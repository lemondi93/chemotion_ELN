# frozen_string_literal: true

class AttachmentUploader < Shrine
  require 'helpers/annotation/annotation_creator'
  require 'helpers/thumbnail/thumbnail_creator'
  require 'helpers/annotation/mini_magick_image_analyser'

  MAX_SIZE = Rails.configuration.shrine_storage.maximum_size * 1024 * 1024 # 10 MB

  plugin :derivatives
  plugin :keep_files, replaced: true
  plugin :validation_helpers
  plugin :pretty_location
  Attacher.validate do
    validate_max_size MAX_SIZE, message: "File #{record.filename} cannot be uploaded. File size must be less than #{Rails.configuration.shrine_storage.maximum_size} MB"
  end

  def is_integer?
    !!(self =~ /\A[-+]?[0-9]+\z/)
  end

  def generate_location(io, context = {})
    if context[:record]
      file_name = if io.path.include? 'thumb.jpg'
                    "#{context[:record][:key]}.thumb.jpg"
                  elsif io.path.include? 'annotation.svg'
                    "#{context[:record][:key]}.annotation.svg"
                  else
                    "#{context[:record][:key]}#{File.extname(context[:record][:filename])}"
                  end

      bucket = 1
      bucket = (context[:record][:id] / 10_000).floor + 1 if context[:record][:id].present?
      "#{storage.directory}/#{bucket}/#{file_name}"
    else
      super
    end
  end

  # plugins and uploading logic
  Attacher.derivatives do |_original|
    file_extension = AttachmentUploader.getFileExtension(file.id)

    file_basename = File.basename(file.metadata['filename'], '.*')

    file_path = AttachmentUploader.createTmpFile(file_basename, file_extension, file)

    AttachmentUploader.create_derivatives(file_extension, file_path, _original, @context[:record].id, record)
  end

  def self.createTmpFile(file_basename, file_extension, file)
    tmp = Tempfile.new([file_basename, file_extension], encoding: 'ascii-8bit')
    tmp.write file.read
    tmp.rewind
    tmp.path
  end

  def self.getFileExtension(fileName)
    file_extension = File.extname(fileName)&.downcase
    file_extension = '.jpg' if file_extension == '.jpeg'

    file_extension
  end

  def self.create_derivatives(file_extension, file_path, _original, attachment_id, record)
    result = {}
    factory = DerivativeBuilderFactory.new
    builders = factory.createDerivativeBuilders(file_extension)
    binding.pry
    builders.each do |builder|
      builder.create_derivative(
        file_path.to_s,
        _original,
        attachment_id,
        result, record
      )
    end

    result
  end
end
