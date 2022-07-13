# frozen_string_literal: true

require 'rails_helper'

# test for ExportJson ImportJson
RSpec.describe 'ImportCollection' do
  let(:user) do
    create(:person, first_name: 'Ulf', last_name: 'User', name_abbreviation: 'UU')
  end

  before do
    user.save!
    create_tmp_file
    stub_rest_request('RJUFJBKOKNCXHH-UHFFFAOYSA-N')
    stub_rest_request('OKKJLVBELUTLKV-UHFFFAOYSA-N')
    stub_rest_request('XBDQKXXYIPTUBI-UHFFFAOYSA-N')
    stub_const('EPSILON', 0.001)
  end

  context 'when importing from a file' do
    it 'import a collection with 2 samples' do
      zip_file_path = copy_target_to_import_folder('collection_samples')
      do_import(zip_file_path, user)

      collection = Collection.find_by(label: 'Fab-Col-Sample')
      expect(collection).to be_present

      sample = Sample.find_by(name: 'Water-001')

      expect(sample).to be_present
      expect(sample.target_amount_value).to be_within(EPSILON).of(0.1)
      expect(sample.target_amount_unit).to eq('g')
      expect(sample.created_at.strftime('%FT%T')).to eq('2022-08-22T07:59:32')
      expect(sample.updated_at.strftime('%FT%T')).to eq('2022-08-22T07:59:32')
      expect(sample.description).to eq('MyWater')
      expect(sample.purity).to be_within(EPSILON).of(0.95)
      expect(sample.location).to eq('Room X1')
      expect(sample.is_top_secret).to eq(false)
      expect(sample.external_label).to eq('Ext-Water')
      expect(sample.short_label).to eq('FM-7')
      expect(sample.real_amount_unit).to eq('g')
      expect(sample.density).to be_within(EPSILON).of(0.998202)
      expect(sample.melting_point.to_s).to eq('0.0...Infinity')
      expect(sample.boiling_point.to_s).to eq('100.0...Infinity')
      expect(sample.molarity_value).to be_within(EPSILON).of(0)
      expect(sample.molarity_unit).to eq('M')
      expect(sample.decoupled).to eq(false)
      expect(sample.molecular_mass).to be_within(EPSILON).of(0)
      expect(sample.sum_formula).to eq('')

      # TO DO: found out whats the meaning of these params
      expect(sample.real_amount_value).to eq(nil)
      expect(sample.user_id).to eq(nil)

      sample = Sample.find_by(name: 'Benzene A')
      expect(sample).to be_present
    end

    it 'import a collection with a reaction' do
      zip_file_path = copy_target_to_import_folder('collection_reaction')
      do_import(zip_file_path, user)

      collection = Collection.find_by(label: 'Fab-Col-Reaction')
      expect(collection).to be_present

      reaction = Reaction.first
      expect(reaction).to be_present
      expect(reaction.name).to eq('Esterification of propionic acid ')
      expect(reaction.created_at.strftime('%FT%T')).to eq('2022-08-22T14:19:45')
      expect(reaction.description.to_s).to eq('{"ops"=>[{"insert"=>"A "}, {"attributes"=>{"bold"=>true}, "insert"=>"sample "}, {"attributes"=>{"underline"=>true}, "insert"=>"reaction"}, {"insert"=>"\\n"}]}')
      expect(reaction.timestamp_start).to eq('22/08/2022 16:16:30')
      expect(reaction.timestamp_stop).to eq('23/08/2022 16:16:33')
      expect(reaction.observation.to_s).to eq('{"ops"=>[{"insert"=>"\\nThe obtained crude product was purified via HPLC using MeCN/H₂O 10:1."}]}')
      expect(reaction.purification).to match_array(%w[TLC HPLC])
      expect(reaction.dangerous_products).to match_array([])
      expect(reaction.tlc_solvents).to eq('')
      expect(reaction.tlc_description).to eq('')
      expect(reaction.rf_value).to eq('0')
      expect(reaction.temperature.to_s).to eq('{"data"=>[], "userText"=>"30", "valueUnit"=>"°C"}')
      expect(reaction.status).to eq('Done')
      expect(reaction.solvent).to eq('')
      expect(reaction.short_label).to eq('UU-R1')
      expect(reaction.role).to eq('gp')
      expect(reaction.duration).to eq('1 Day(s)')
      expect(reaction.conditions).to eq('')
    end

    it 'import a collection with a wellplate' do
      zip_file_path = copy_target_to_import_folder('collection_wellplate')
      do_import(zip_file_path, user)

      collection = Collection.find_by(label: 'Fab-Col-Wellplate')
      expect(collection).to be_present

      wellplate = Wellplate.first
      expect(wellplate).to be_present
      expect(wellplate.name).to eq('MyWellplate')
      expect(wellplate.size).to eq(96)
      expect(wellplate.description).to eq({})

      expect(wellplate.samples).to be_present
      expect(wellplate.samples.length).to eq(1)

      expect(wellplate.wells).to be_present
      expect(wellplate.wells.length).to eq(wellplate.size)

      # TO DO: Checking well properties (color, labels, ...). First the export must be repaired
    end
    it 'import a collection with a screen' do
      zip_file_path = copy_target_to_import_folder('collection_screen')
      do_import(zip_file_path, user)

      collection = Collection.find_by(label: 'Fab-Col-Screen')
      expect(collection).to be_present

      expect(collection.screens).to be_present
      expect(collection.screens.length).to eq(1)
      screen = collection.screens[0]
      expect(screen.description.to_s).to eq('{"ops"=>[{"insert"=>"nothing to see here\\n"}]}')
      expect(screen.name).to eq('MyScreen')
      expect(screen.result).to eq('also nothing')
      expect(screen.collaborator).to eq('none')
      expect(screen.conditions).to eq('also none')
      expect(screen.requirements).to eq('nothing')
      expect(screen.created_at.strftime('%FT%T')).to eq('2022-08-24T08:39:17')
      expect(screen.updated_at.strftime('%FT%T')).to eq('2022-08-24T08:39:17')

      expect(screen.wellplates.length).to eq(1)
    end

    it 'import a collection with a researchplan' do
      zip_file_path = copy_target_to_import_folder('collection_research_plan')
      do_import(zip_file_path, user)

      collection = Collection.find_by(label: 'collection-with-rp')
      expect(collection).to be_present
      expect(collection.research_plans).to be_present
      expect(collection.research_plans.length).to eq(1)
      research_plan=collection.research_plans[0]

      expect(research_plan.name).to eq('Research plan 1')
      expect(research_plan.created_at.strftime('%FT%T')).to eq('2022-08-24T14:19:19')
      expect(research_plan.updated_at.strftime('%FT%T')).to eq('2022-08-24T14:19:19')
      expect(research_plan.attachments.length).to eq(1)
      attachment=research_plan.attachments[0]
      expect(attachment.identifier).to eq('f3864e5e-0559-4134-9912-50837f397024')

      #TO DO: create a more realistic example with more assosiatons of the research plan. Here i will stop because i focus on the attachment refactoring
    end
  end

  def stub_rest_request(identifier)
    stub_request(:get, 'http://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/inchikey/' + identifier + '/record/JSON')
      .with(
        headers: {
          'Accept' => '*/*',
          'Accept-Encoding' => 'gzip;q=1.0,deflate;q=0.6,identity;q=0.3',
          'Content-Type' => 'text/json',
          'User-Agent' => 'Ruby'
        }
      )
      .to_return(status: 200, body: '', headers: {})
  end

  def create_tmp_file
    import_path = File.join('tmp', 'import')
    FileUtils.mkdir_p(import_path) unless Dir.exist?(import_path)
  end

  def copy_target_to_import_folder(import_id)
    src_location = File.join('spec', 'fixtures', 'import', "#{import_id}.zip")
    target_location = File.join('tmp', 'import', "#{import_id}.zip")
    FileUtils.copy_file(src_location, target_location)
    target_location
  end

  def do_import(zip_file_path, user)
    import = Import::ImportCollections.new(AttachmentMock.new(zip_file_path), user.id)
    import.extract
    import.import
    import.cleanup
  end

  class AttachmentMock
    def initialize(file_path)
      @file_path = file_path
    end

    def read_file
      File.open(@file_path).read
    end
  end
end
