# frozen_string_literal: true

require 'roo'

# rubocop:disable Metrics/ClassLength
module Import
  class ImportSamples
    attr_reader :xlsx, :sheet, :header, :mandatory_check, :rows, :unprocessable,
                :processed, :file_path, :collection_id, :current_user_id, :file_name

    def initialize(file_path, collection_id, user_id, file_name)
      @rows = []
      @unprocessable = []
      @processed = []
      @file_path = file_path
      @collection_id = collection_id
      @current_user_id = user_id
      @file_name = file_name
    end

    def process
      begin
        read_file
      rescue StandardError => e
        return error_process_file(e.message)
      end

      begin
        check_required_fields
      rescue StandardError => e
        return error_required_fields(e.message)
      end

      begin
        process_all_rows
      rescue StandardError => e
        error_process(e.message)
      end
    end

    def read_file
      @xlsx = Roo::Spreadsheet.open(file_path)
    end

    def check_required_fields
      @sheet = xlsx.sheet(0)
      @header = sheet.row(1)
      @mandatory_check = {}
      ['molfile', 'smiles', 'cano_smiles', 'canonical smiles'].each do |check|
        @mandatory_check[check] = true if header.find { |e| /^\s*#{check}?/i =~ e }
      end

      message = 'Column headers should have: molfile, or Smiles (or cano_smiles, canonical smiles)'
      raise message if mandatory_check.empty?
    end

    def extract_molfile_and_molecule(row)
      # If molfile and smiles (Canonical smiles) is both present
      #  Double check the rows
      if molfile?(row) && smiles?(row)
        get_data_from_molfile_and_smiles(row)
      elsif molfile?(row)
        get_data_from_molfile(row)
      elsif smiles?(row)
        get_data_from_smiles(row)
      end
    end

    def process_row(data)
      row = [header, xlsx.row(data)].transpose.to_h

      return unless structure?(row) || row['decoupled'] == 'Yes'

      rows << row.each_pair { |k, v| v && row[k] = v.to_s }
    end

    def process_row_data(row)
      return Molecule.find_or_create_dummy if row['decoupled'] == 'Yes' && !structure?(row)

      molfile, molecule = extract_molfile_and_molecule(row)
      return if molfile.nil? || molecule.nil?

      [molfile, molecule]
    end

    def molecule_not_exist(molecule)
      @unprocessable << { row: row, index: i } if molecule.nil?
      molecule.nil?
    end

    def write_to_db
      unprocessable_count = 0
      begin
        ActiveRecord::Base.transaction do
          rows.map.with_index do |row, i|
            molfile, molecule = process_row_data(row)
            if molecule_not_exist(molecule)
              unprocessable_count += 1
              next
            end
            sample_save(row, molfile, molecule)
          rescue StandardError
            unprocessable_count += 1
            @unprocessable << { row: row, index: i }
          end
        end
      rescue StandardError => _e
        raise 'More than 1 row can not be processed' if unprocessable_count.positive?
      end
    end

    def structure?(row)
      molfile?(row) || smiles?(row)
    end

    def molfile?(row)
      mandatory_check['molfile'] && row['molfile'].to_s.present?
    end

    def smiles?(row)
      header = mandatory_check['smiles'] || mandatory_check['cano_smiles'] || mandatory_check['canonical smiles']
      cell = row['smiles'].to_s.present? || row['cano_smiles'].to_s.present? || row['canonical smiles'].to_s.present?
      header && cell
    end

    def get_data_from_molfile_and_smiles(row)
      molfile = row['molfile'].presence
      if molfile
        babel_info = Chemotion::OpenBabelService.molecule_info_from_molfile(molfile)
        molfile_smiles = babel_info[:smiles]
        molfile_smiles = Chemotion::OpenBabelService.canon_smiles_to_smiles molfile_smiles if mandatory_check['smiles']
      end
      if molfile_smiles.blank? && (molfile_smiles != row['cano_smiles'] &&
         molfile_smiles != row['smiles'] && molfile_smiles != row['canonical smiles'])
        @unprocessable << { row: row, index: i }
        go_to_next = true
      end
      [molfile, go_to_next]
    end

    def get_data_from_molfile(row)
      molfile = row['molfile'].to_s
      babel_info = Chemotion::OpenBabelService.molecule_info_from_molfile(molfile)
      inchikey = babel_info[:inchikey]
      molecule = Molecule.find_or_create_by_molfile(molfile, babel_info) if inchikey.presence
      [molfile, molecule]
    end

    def assign_molecule_data(molfile_coord, babel_info, inchikey, row)
      if inchikey.blank?
        @unprocessable << { row: row, index: i }
        go_to_next = true
      else
        molecule = Molecule.find_or_create_by(inchikey: inchikey, is_partial: false) do |molecul|
          pubchem_info =
            Chemotion::PubchemService.molecule_info_from_inchikey(inchikey)
          molecul.molfile = molfile_coord
          molecul.assign_molecule_data babel_info, pubchem_info
        end
      end
      [molfile_coord, molecule, go_to_next]
    end

    def get_data_from_smiles(row)
      smiles = (mandatory_check['smiles'] && row['smiles'].presence) ||
               (mandatory_check['cano_smiles'] && row['cano_smiles'].presence) ||
               (mandatory_check['canonical smiles'] && row['canonical smiles'].presence)
      inchikey = Chemotion::OpenBabelService.smiles_to_inchikey smiles
      ori_molf = Chemotion::OpenBabelService.smiles_to_molfile smiles
      babel_info = Chemotion::OpenBabelService.molecule_info_from_molfile(ori_molf)
      molfile_coord = Chemotion::OpenBabelService.add_molfile_coordinate(ori_molf)
      assign_molecule_data(molfile_coord, babel_info, inchikey, row)
    end

    def included_fields
      Sample.attribute_names - excluded_fields
    end

    def handle_sample_solvent_column(sample, row)
      return unless row['solvent'].is_a? String

      solvent = Chemotion::SampleConst.solvents_smiles_options.find { |s| s[:label].include?(row['solvent']) }
      if solvent.present?
        solvent_column = [{ label: solvent[:value][:external_label],
                            smiles: solvent[:value][:smiles],
                            ratio: '100' }]
      end
      sample['solvent'] = '' if sample['solvent'].is_a? String
      sample['solvent'] = solvent_column if solvent.present?
    end

    # format row[field] for melting and boiling point
    def format_to_interval_syntax(row_field)
      return "[#{-Float::INFINITY}, #{Float::INFINITY}]" if row_field.nil?

      # Regex checks for a range of numbers that are separated by a dash, or a single number
      matches = row_field.scan(/^(-?\d+(?:[.,]\d+)?)(?:\s*-\s*(-?\d+(?:[.,]\d+)?))?$/).flatten.compact
      return "[#{-Float::INFINITY}, #{Float::INFINITY}]" if matches.empty?

      numbers = matches.filter_map(&:to_f)
      lower_bound, upper_bound = numbers.size == 1 ? [numbers[0], Float::INFINITY] : numbers
      "[#{lower_bound}, #{upper_bound}]"
    end

    def process_sample_fields(sample, db_column, field, row)
      return unless included_fields.include?(db_column)

      excluded_column = %w[description solvent location external_label].freeze
      comparison_values = %w[melting_point boiling_point].freeze

      value = row[field]
      value = format_to_interval_syntax(value) if comparison_values.include?(db_column)

      sample[db_column] = value || ''
      sample[db_column] = '' if excluded_column.include?(db_column) && row[field].nil?
      sample[db_column] = row[field] == 'Yes' if %w[decoupled].include?(db_column)
    end

    def validate_sample_and_save(sample, stereo, row)
      handle_sample_solvent_column(sample, row)
      sample.validate_stereo(stereo)
      sample.collections << Collection.find(collection_id)
      sample.collections << Collection.get_all_collection_for_user(current_user_id)
      sample.save!
      processed.push(sample)
    end

    def sample_save(row, molfile, molecule)
      sample = Sample.new(created_by: current_user_id)
      sample.molfile = molfile
      sample.molecule = molecule
      stereo = {}
      header.each do |field|
        stereo[Regexp.last_match(1)] = row[field] if field.to_s.strip =~ /^stereo_(abs|rel)$/
        map_column = ReportHelpers::EXP_MAP_ATTR[:sample].values.find { |e| e[1] == "\"#{field}\"" }
        db_column = map_column.nil? ? field : map_column[0].sub('s.', '').delete!('"')
        process_sample_fields(sample, db_column, field, row)
      end
      validate_sample_and_save(sample, stereo, row)
    end

    def process_all_rows
      (2..xlsx.last_row).each do |data|
        process_row(data)
      end
      begin
        write_to_db
        if processed.empty?
          no_success
        else
          @unprocessable.empty? ? success : warning
        end
      rescue StandardError => e
        warning(e.message)
      end
    end

    def excluded_fields
      [
        'id',
        # 'name',
        # 'target_amount_value',
        # 'target_amount_unit',
        'created_at',
        'updated_at',
        # 'description',
        'molecule_id',
        'molfile',
        # 'purity',
        # 'solvent',
        'impurities',
        # 'location',
        'is_top_secret',
        'ancestry',
        # 'external_label',
        'created_by',
        'short_label',
        # 'real_amount_value',
        # 'real_amount_unit',
        # 'imported_readout',
        'deleted_at',
        'sample_svg_file',
        'user_id',
        'identifier',
        # 'density',
        # 'melting_point',
        # 'boiling_point',
        'fingerprint_id',
        'xref',
        # 'molarity_value',
        # 'molarity_unit',
        'molecule_name_id',
      ]
    end

    def error_process_file(error)
      { status: 'invalid',
        message: 'Can not process this type of file.',
        error: error,
        data: [] }
    end

    def error_required_fields(error)
      { status: 'invalid',
        error: error,
        message: 'Column headers should have: molfile or Canonical Smiles.',
        data: [] }
    end

    def error_process(error)
      { status: 'invalid',
        error: error,
        message: 'Error while parsing the file.',
        data: [] }
    end

    def no_success(error)
      { status: 'invalid',
        error: error,
        message: "No samples could be imported for file #{@file_name} " \
                 "because of the following error #{error}.",
        unprocessed_data: unprocessable }
    end

    def warning(error = nil)
      { status: 'warning',
        error: error,
        message: "following rows in file: #{@file_name} " \
                 "could not be imported: #{unprocessable_rows}.",
        unprocessed_data: unprocessable,
        data: processed }
    end

    def unprocessable_rows
      unprocessable.map { |u| u[:index] + 2 }.join(', ')
    end

    def success
      { status: 'ok',
        message: "samples in file: #{@file_name} have been imported successfully",
        data: processed }
    end
  end
end
# rubocop:enable Metrics/ClassLength
