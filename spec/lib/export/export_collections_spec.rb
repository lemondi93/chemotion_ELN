# frozen_string_literal: true

# rubocop:disable RSpec/MultipleMemoizedHelpers
require 'rails_helper'

# test for ExportJson ImportJson
RSpec.describe 'ExportCollection' do
  let(:nested) { true }
  let(:gate) { true }
  let(:user) { create(:person, first_name: 'Ulf', last_name: 'User', name_abbreviation: 'UU') }
  let(:file_names) do
    file_names = []
    Zip::File.open(file_path) do |files|
      files.each do |file|
        file_names << file.name
      end
    end
    file_names
  end

  let(:collection) { create(:collection, user_id: user.id, label: 'Awesome Collection') }
  let(:file_path) { File.join('public', 'zip', "#{job_id}.zip") }

  let(:molfile) { Rails.root.join('spec/fixtures/test_2.mol').read }
  let(:svg) { Rails.root.join('spec/fixtures/images/molecule.svg').read }
  let(:sample) do
    create(:sample, created_by: user.id, name: 'Sample zero', molfile: molfile, collections: [collection])
  end
  let(:molecule_name_name) { 'Awesome Molecule' }
  let(:molecule_name) do
    create(:molecule_name, user_id: user.id, name: molecule_name_name, molecule_id: sample.molecule_id)
  end
  let(:job_id) { SecureRandom.uuid }
  let(:molecule_file) { "images/molecules/#{sample.molecule.molecule_svg_file}" }

  let(:elements_in_json) do
    json = {}
    Zip::File.open(file_path) do |files|
      files.each do |file|
        json = JSON.parse(file.get_input_stream.read) if file.name == 'export.json'
      end
    end
    json[element]
  end

  context 'with a sample' do
    before do
      sample
      export = Export::ExportCollections.new(job_id, [collection.id], 'zip', true)
      export.prepare_data
      export.to_file
    end

    it 'exported file exists' do
      file_path = File.join('public', 'zip', "#{job_id}.zip")
      expect(File.exist?(file_path)).to be true
    end

    it 'zip file containing export.json, schema.json and description.txt and molecule image' do
      expect(file_names.length).to be 4
      expect(file_names).to include('export.json', 'schema.json', 'description.txt', molecule_file)
    end
  end

  context 'with a researchplan' do # rubocop:disable RSpec/MultipleMemoizedHelpers
    let(:collection) { create(:collection, user_id: user.id, label: 'collection-with-rp') }
    let(:research_plan) { create(:research_plan, collections: [collection]) }
    let(:expected_attachment_filename) { "attachments/#{attachment.identifier}.png" }
    let(:attachment) do
      create(:attachment, :with_png_image, bucket: 1, created_by: 1, attachable_id: research_plan.id)
    end

    before do
      research_plan.attachments = [attachment]
      research_plan.save!
      update_body_of_researchplan(research_plan, attachment.identifier)
      export = Export::ExportCollections.new(job_id, [collection.id], 'zip', nested, gate)
      export.prepare_data
      export.to_file
    end

    it 'exported file exists' do
      expect(File.exist?(file_path)).to be true
    end

    it 'attachment is in zip file' do
      expect(file_names.length).to be 4
      expect(file_names).to include expected_attachment_filename
    end
  end

  context 'with a reaction' do # rubocop:disable RSpecq/MultipleMemoizedHelpers
    let(:sample1) { create(:sample) }
    let(:sample2) { create(:sample) }
    let(:element) { 'Reaction' }
    let(:reaction_in_json) { elements_in_json.first.second }

    let(:reaction) do
      create(:reaction, collections: [collection],
                        starting_materials: [sample1],
                        products: [sample2])
    end

    before do
      reaction
      export = Export::ExportCollections.new(job_id, [collection.id], 'zip', false)
      export.prepare_data
      export.to_file
    end

    it 'exported file exists and has 4 entries' do
      expect(File.exist?(file_path)).to be true
      expect(file_names.length).to be 4
    end

    it 'export.json has one reaction entry' do
      expect(elements_in_json.length).to be 1
      # TO DO - find an elegant way to check all properties json <-> raction, maybe with an grape entity??
      expect(reaction_in_json['name']).to eq reaction.name
    end
  end

  context 'with two cell lines including one has a jpg attachment in analysis' do
    let(:expected_attachment_name) do
      "attachments/#{cell_line_sample.container.children[0].children[0].children[0].attachments[0].identifier}.jpg"
    end
    let(:cell_line_sample) { create(:cellline_sample, :with_analysis, user_id: user.id, collections: [collection]) }
    let(:cell_line_sample2) do
      create(:cellline_sample,
             cellline_material: cell_line_sample.cellline_material, user_id: user.id, collections: [collection])
    end

    let(:fist_cellline_in_json) { elements_in_json[elements_in_json.keys.first] }
    let(:second_cellline_in_json) { elements_in_json[elements_in_json.keys.second] }
    let(:element) { 'CelllineSample' }

    before do
      cell_line_sample2
      export = Export::ExportCollections.new(job_id, [collection.id], 'zip', nested, gate)
      export.prepare_data
      export.to_file
    end

    it 'zip file was created' do
      expect(File.exist?(file_path)).to be true
    end

    it 'zip file include the cell line and its analysis attachments' do
      expect(file_names.length).to be 4
      expect(file_names).to include('export.json', 'schema.json', 'description.txt', expected_attachment_name)
    end

    it 'cell line properties in zip file match the original ones' do
      expect(cell_line_sample.as_json).to eq fist_cellline_in_json
      expect(cell_line_sample2.as_json).to eq second_cellline_in_json
    end
  end

  def update_body_of_researchplan(research_plan, identifier_of_attachment)
    research_plan.body = [
      {
        id: 'entry-003',
        type: 'image',
        value: {
          file_name: 'xyz.png',
          public_name: identifier_of_attachment,
        },
      },
    ]
    research_plan.save!
    research_plan
  end
end
# rubocop:enable RSpec/MultipleMemoizedHelpers
