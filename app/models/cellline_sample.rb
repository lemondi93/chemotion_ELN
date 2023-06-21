# frozen_string_literal: true

class CelllineSample < ApplicationRecord
  has_one :container, as: :containable
  has_many :collections_celllines, inverse_of: :cellline_sample, dependent: :destroy
  has_many :collections, through: :collections_celllines

  acts_as_paranoid
  belongs_to :cell_line_sample, optional: true
  belongs_to :cellline_material
  belongs_to :creator, class_name: 'User', foreign_key: 'user_id'

  def create_root_container
    self.container = Container.create_root_container if container.nil?
  end
end
