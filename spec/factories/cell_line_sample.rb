# frozen_string_literal: true

FactoryBot.define do
  factory :cellline_sample do
    creator { create(:person) }
    cellline_material { create(:cellline_material) }
    amount { 999 }
    passage { 10 }
  end

  trait :with_analysis do
    callback(:before_create) do |cell_line|
      user = cell_line.creator || FactoryBot.create(:user)
      cell_line.container = FactoryBot.create(:container, :with_jpg_in_dataset, user_id: user.id)
    end
  end
end
