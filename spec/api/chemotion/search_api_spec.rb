# frozen_string_literal: true

# rubocop:disable RSpec/MultipleMemoizedHelpers
require 'rails_helper'

describe Chemotion::SearchAPI do
  include_context 'api request authorization context'

  let(:other_user) { create(:person) }
  let(:collection) { create(:collection, user: user) }
  let(:other_collection) { create(:collection, user: other_user) }
  let(:sample_a) { create(:sample, name: 'SampleA', creator: user) }
  let(:sample_b) { create(:sample, name: 'SampleB', creator: user) }
  let(:sample_c) { create(:sample, name: 'SampleC', creator: other_user) }
  let(:sample_d) { create(:sample, name: 'SampleD', creator: other_user) }
  let(:wellplate) { create(:wellplate, name: 'Wellplate', wells: [build(:well, sample: sample_a)]) }
  let(:other_wellplate) { create(:wellplate, name: 'Other Wellplate', wells: [build(:well, sample: sample_b)]) }
  let(:reaction) { create(:reaction, name: 'Reaction', samples: [sample_a, sample_b], creator: user) }
  let(:other_reaction) { create(:reaction, name: 'Other Reaction', samples: [sample_c, sample_d], creator: other_user) }
  let(:screen) { create(:screen, name: 'Screen') }
  let(:other_screen) { create(:screen, name: 'Other Screen') }
  let!(:cell_line) { create(:cellline_sample, name: 'another-cellline-search-example', collections: [collection]) }

  before do
    CollectionsReaction.create!(reaction: reaction, collection: collection)
    CollectionsSample.create!(sample: sample_a, collection: collection)
    CollectionsScreen.create!(screen: screen, collection: collection)
    CollectionsWellplate.create!(wellplate: wellplate, collection: collection)
    ScreensWellplate.create!(wellplate: wellplate, screen: screen)

    CollectionsReaction.create!(reaction: other_reaction, collection: other_collection)
    CollectionsSample.create!(sample: sample_b, collection: other_collection)
    CollectionsScreen.create!(screen: other_screen, collection: other_collection)
    CollectionsWellplate.create!(wellplate: other_wellplate, collection: other_collection)
    ScreensWellplate.create!(wellplate: other_wellplate, screen: other_screen)

    post url, params: params
  end

  describe 'POST /api/v1/search/elements' do
    pending 'TODO: Add missing spec'
  end

  describe 'POST /api/v1/search/cell_lines' do
    let(:url) { '/api/v1/search/cell_lines' }
    let(:result) { JSON.parse(response.body) }
    let(:params) do
      {
        selection: {
          elementType: :cell_lines,
          name: search_term,
          search_by_method: search_method,
        },
        collection_id: collection.id,
      }
    end

    context 'when searching a cell line sample in correct collection by cell line material name' do
      let(:search_term) { 'name-001' }
      let(:search_method) { 'cell_line_material_name' }

      it 'returns one cell line sample object' do
        expect(result.dig('cell_lines', 'totalElements')).to eq 1
        expect(result.dig('cell_lines', 'ids')).to eq [cell_line.id]
      end
    end

    context 'when searching a cell line sample in correct collection by cell line sample name' do
      let(:search_term) { 'other' }
      let(:search_method) { 'cell_line_sample_name' }

      it 'returns one cell line sample object' do
        expect(result.dig('cell_lines', 'totalElements')).to eq 1
        expect(result.dig('cell_lines', 'ids')).to eq [cell_line.id]
      end
    end
  end

  describe 'POST /api/v1/search/all' do
    let(:url) { '/api/v1/search/all' }
    let(:search_method) { 'substring' }
    let(:result) { JSON.parse(response.body) }
    let(:params) do
      {
        selection: {
          elementType: :all,
          name: search_term,
          search_by_method: search_method,
        },
        collection_id: collection.id,
      }
    end

    context 'when searching a cell line sample in correct collection by cell line material name' do
      let(:search_term) { 'name-001' }
      let(:search_method) { 'cell_line_material_name' }

      it 'returns one cell line sample object' do
        expect(result.dig('cell_lines', 'totalElements')).to eq 1
        expect(result.dig('cell_lines', 'ids')).to eq [cell_line.id]
      end
    end

    context 'when searching a cell line sample in correct collection by cell line sample name' do
      let(:search_term) { 'cellline-search-example' }
      let(:search_method) { 'cell_line_sample_name' }

      it 'returns one cell line sample object' do
        expect(result.dig('cell_lines', 'totalElements')).to eq 1
        expect(result.dig('cell_lines', 'ids')).to eq [cell_line.id]
      end
    end

    context 'when searching a sample in correct collection' do
      let(:search_term) { 'SampleA' }

      it 'returns the sample' do
        expect(result.dig('samples', 'totalElements')).to eq 1
        expect(result.dig('samples', 'ids')).to eq [sample_a.id]
      end

      it 'returns referenced reaction of sample' do
        expect(result.dig('reactions', 'totalElements')).to eq 1
        expect(result.dig('reactions', 'ids')).to eq [reaction.id]
      end

      it 'returns referenced screen of sample' do
        expect(result.dig('screens', 'totalElements')).to eq 1
        expect(result.dig('screens', 'ids')).to eq [screen.id]
      end

      it 'returns referenced wellplate of sample' do
        expect(result.dig('wellplates', 'totalElements')).to eq 1
        expect(result.dig('wellplates', 'ids')).to eq [wellplate.id]
      end
    end
  end

  describe 'POST /api/v1/search/samples' do
    let(:url) { '/api/v1/search/samples' }

    context 'when searching a sample in correct collection' do
      let(:search_term) { 'SampleA' }
      let(:result) { JSON.parse(response.body) }
      let(:params) do
        {
          selection: {
            elementType: :samples,
            name: search_term,
            search_by_method: :substring,
          },
          collection_id: collection.id,
        }
      end

      it 'returns the sample' do
        expect(result.dig('samples', 'totalElements')).to eq 1
        expect(result.dig('samples', 'ids')).to eq [sample_a.id]
      end

      it 'returns referenced reaction of sample' do
        expect(result.dig('reactions', 'totalElements')).to eq 1
        expect(result.dig('reactions', 'ids')).to eq [reaction.id]
      end

      it 'returns screen reaction of sample' do
        expect(result.dig('screens', 'totalElements')).to eq 1
        expect(result.dig('screens', 'ids')).to eq [screen.id]
      end

      it 'returns wellplate reaction of sample' do
        expect(result.dig('wellplates', 'totalElements')).to eq 1
        expect(result.dig('wellplates', 'ids')).to eq [wellplate.id]
      end
    end
  end

  describe 'POST /api/v1/search/reactions' do
    pending 'TODO: Add missing spec'
  end

  describe 'POST /api/v1/search/wellplates' do
    pending 'TODO: Add missing spec'
  end

  describe 'POST /api/v1/search/screens' do
    pending 'TODO: Add missing spec'
  end
end
# rubocop:enable RSpec/MultipleMemoizedHelpers
