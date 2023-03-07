# frozen_string_literal: true

module Chemotion
  class InboxAPI < Grape::API
    helpers ParamsHelpers

    resource :inbox do
      params do
        requires :cnt_only, type: Boolean, desc: 'return count number only'
      end

      paginate per_page: 20, offset: 0, max_per_page: 50

      get do
        current_user.container = Container.create(name: 'inbox', container_type: 'root') unless current_user.container
        scope = current_user.container.children.sort_by(&:name)

        reset_pagination_page(scope)

        device_boxes = paginate(scope).map do |device_box|
          Entities::DeviceBoxEntity.represent(device_box, root_container: true)
        end
        if params[:cnt_only]
          present current_user.container, with: Entities::InboxEntity, root: :inbox, only: [:inbox_count]
        else
          {
            inbox: {
              children: device_boxes,
              count: scope.size,
              container_type: current_user.container.container_type,
              unlinked_attachments: Attachment.where(
                attachable_type: 'Container',
                attachable_id: nil,
                created_for: current_user.container&.containable&.id,
              ),
              children_count: current_user.container.descendants.includes(:attachments).sum { |dataset| dataset&.attachments&.size },
            },
          }
        end
      end

      desc 'Return files by subcontainer ID'
      params do
        requires :id, type: Integer, desc: 'subcontainer ID'
      end

      get "containers/id" do
        container = Container.includes(:attachments).find params[:id]

        Entities::DeviceBoxEntity.represent(container, root_container: false, root: :inbox)
      end

      resource :samples do
        desc 'search samples from user by'
        params do
          requires :search_string, type: String, desc: 'Search String'
        end
        get do
          search_string = params[:search_string]
          search_string.chomp!(File.extname(search_string))
          search_string.chomp!(' EA')
          search_string.sub!(/-?[a-zA-Z]$/, '')
          search_string.sub!(/^[a-zA-Z0-9]+-/, '')
          collection_ids = Collection.belongs_to_or_shared_by(current_user.id, current_user.group_ids).map(&:id)
          samples = Sample.by_exact_name(search_string)
                          .joins(:collections_samples)
                          .where(collections_samples: { collection_id: collection_ids }).uniq
          samples.select { |s| ElementPolicy.new(current_user, s).update? }

          ids = samples.pluck(:id)
          rs = ReactionsSample.where(sample_id: ids)
          res = samples.map do |s|
            {
              id: s.id,
              name: s.name,
              short_label: s.short_label,
              type: rs.find { |r| r.sample_id == s.id }&.type&.sub(/^Reactions/, '')&.sub(/Sample/, ''),
            }
          end
          { samples: res }
        end

        desc 'assign attachment to sample'
        params do
          optional :attachment_id, type: Integer, desc: 'Sample ID'
        end
        before do
          @sample = Sample.find(params[:sample_id])
          error!('401 Unauthorized', 401) unless ElementPolicy.new(current_user, @sample).update?
          attachment = Attachment.find(params[:attachment_id])
          error!('402 Unauthorized', 402) unless attachment.created_for == current_user.id
        end
        post ':sample_id' do
          analyses_container = Sample.find(params[:sample_id]).container.children.find_by(container_type: 'analyses')
          attachment = Attachment.find(params[:attachment_id])
          analysis_name = attachment.filename.chomp(File.extname(attachment.filename))

          new_analysis_container = analyses_container.children.create(container_type: 'analysis', name: analysis_name)
          dataset = new_analysis_container.children.create(parent_id: new_analysis_container.id,
                                                           container_type: 'dataset', name: analysis_name)
          attachment.update!(attachable: dataset)

          @link = "#{Rails.application.config.root_url}/mydb/collection/all/sample/#{@sample.id}"

          Message.create_msg_notification(
            channel_subject: Channel::ASSIGN_INBOX_TO_SAMPLE,
            message_from: current_user.id,
            data_args: { filename: attachment.filename, info: "#{@sample.short_label} #{@sample.name}" },
            url: @link,
            level: 'success',
          )

          present dataset, with: Entities::ContainerEntity, root: :container
        end
      end
    end
  end
end
