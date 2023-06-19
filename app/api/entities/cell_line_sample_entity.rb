module Entities
    class CellLineSampleEntity < Grape::Entity 
        expose :id
        expose :amount
        expose :passage
        expose :contamination
        expose :name
        expose :short_label
        expose :description
        expose :unit
        expose :cellline_material
        expose :container, using: 'Entities::ContainerEntity'
    end
end