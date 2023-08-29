/* eslint-disable react/display-name */
import { AgGridReact } from 'ag-grid-react';
import React, {
  useRef, forwardRef, useState, useEffect, useImperativeHandle, useCallback
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Button, FormGroup, Radio, ControlLabel, ButtonGroup,
  OverlayTrigger, Tooltip, Form, Badge, DropdownButton, MenuItem
} from 'react-bootstrap';
import _ from 'lodash';
import { createVariationsRow } from 'src/apps/mydb/elements/details/reactions/variationsTab/ReactionVariationsUtils';

function RowToolsCellRenderer({ data, copyRow, removeRow }) {
  return (
    <div>
      <Badge>{data.id.substring(0, 5)}</Badge>
      {' '}
      <ButtonGroup>
        <Button onClick={() => copyRow(data)}><i className="fa fa-copy" /></Button>
        <Button onClick={() => removeRow(data)}><i className="fa fa-trash" /></Button>
      </ButtonGroup>
    </div>
  );
}

function CellRenderer({ value: cellData }) {
  const { value = '', unit = 'None', aux = {} } = cellData ?? {};
  const cellContent = `${Number(value) ? Number(value).toFixed(6) : 'NaN'} [${unit}]`;

  let overlayContent = aux.coefficient ? `Coeff: ${aux.coefficient}` : '';
  overlayContent += aux.isReference ? '; Ref' : '';
  overlayContent += aux.yield ? `; Yield: ${aux.yield}%` : '';
  if (!overlayContent) {
    return cellContent;
  }

  const overlay = (
    <Tooltip>
      {overlayContent}
    </Tooltip>
  );
  return (
    <OverlayTrigger placement="bottom" overlay={overlay}>
      <div>
        {cellContent}
      </div>
    </OverlayTrigger>
  );
}

const cellComparator = (item1, item2) => {
  const { value: value1, unit: unit1 } = item1;
  const { value: value2, unit: unit2 } = item2;
  if (unit1 !== unit2) {
    return 0;
  }
  return value1 - value2;
};

const CellEditor = forwardRef((props, ref) => {
  const { value = '', unit = 'None', aux = {} } = props.value ?? {};
  const [editedValue, setEditedValue] = useState(value);
  const refInput = useRef(null);

  useEffect(() => {
    // focus on the input
    refInput.current.focus();
  }, []);

  useImperativeHandle(ref, () => ({
    getValue() {
      // final value to send to the grid, on completion of editing
      return { value: editedValue, unit, aux };
    },

    isCancelAfterEnd() {
      // validate edit here: return true to declare edit invalid and keep previous value
      return false;
    }
  }));

  return (
    <input
      type="number"
      ref={refInput}
      value={editedValue}
      onChange={(event) => setEditedValue(event.target.value)}
      style={{ width: '100%' }}
      disabled={aux.isReference}
    />
  );
});

function getMaterialHeaderIdentifier(material, identifier) {
  const fallbackIdentifier = `ID: ${material.id.toString()}`;
  switch (identifier) {
    case 'ext. label':
      return material.external_label || fallbackIdentifier;
    case 'name':
      return material.name || fallbackIdentifier;
    case 'short label':
      return material.short_label || fallbackIdentifier;
    case 'sum formula':
      return material?.molecule.sum_formular || fallbackIdentifier;
    case 'iupac name':
      return material?.molecule.iupac_name || fallbackIdentifier;
    default:
      return fallbackIdentifier;
  }
}

export default function ReactionVariations({ reaction, onEditVariations }) {
  const gridRef = useRef();

  const [materialUnit, setMaterialUnit] = useState('Equiv');
  const [materialHeaderIdentifier, setMaterialHeaderIdentifier] = useState('ext. label');

  function addRow() {
    const newRow = createVariationsRow(reaction, uuidv4(), materialUnit);
    onEditVariations(
      [...reaction.variations, newRow]
    );
  }

  function copyRow(data) {
    const copiedRow = _.cloneDeep(data);
    copiedRow.id = uuidv4();
    onEditVariations(
      [...reaction.variations, copiedRow]
    );
  }

  function removeRow(data) {
    onEditVariations(reaction.variations.filter((row) => row.id !== data.id));
  }

  const updateRow = useCallback(({ data: oldRow, colDef, newValue }) => {
    const { field } = colDef;
    const updatedRow = { ...oldRow };
    _.set(updatedRow, field, newValue);
    onEditVariations(
      reaction.variations.map((row) => (row.id === oldRow.id ? updatedRow : row))
    );
  }, [reaction]);

  const columnDefs = [
    {
      field: '',
      cellRenderer: RowToolsCellRenderer,
      cellRendererParams: { copyRow, removeRow },
      lockPosition: 'left',
      editable: false,
      sortable: false,
      resizable: false,
    },

    {
      headerName: 'Properties',
      groupId: 'Properties',
      marryChildren: true,
      children: [
        {
          headerName: 'Temperature',
          field: 'properties.temperature',
        },
        {
          headerName: 'Duration',
          field: 'properties.duration',
        },
      ]
    },
    {
      headerName: 'Starting Materials',
      groupId: 'Starting Materials',
      marryChildren: true,
      children: reaction.starting_materials.map(
        (material) => ({
          field: `startingMaterials.${material.id}`, // must be unique
          headerName: getMaterialHeaderIdentifier(material, materialHeaderIdentifier)
        })
      )
    },
    {
      headerName: 'Reactants',
      groupId: 'Reactants',
      marryChildren: true,
      children: reaction.reactants.map(
        (material) => ({
          field: `reactants.${material.id}`,
          headerName: getMaterialHeaderIdentifier(material, materialHeaderIdentifier)
        })
      )
    },
    {
      headerName: 'Products',
      groupId: 'Products',
      marryChildren: true,
      children: reaction.products.map(
        (material) => ({
          field: `products.${material.id}`,
          headerName: getMaterialHeaderIdentifier(material, materialHeaderIdentifier)
        })
      )
    }
  ];

  return (
    <div>
      <Form inline>
        <OverlayTrigger placement="bottom" overlay={<Tooltip>Add row with data from current reaction scheme.</Tooltip>}>
          <Button onClick={() => addRow()}>Add row</Button>
        </OverlayTrigger>
        {' '}
        <FormGroup>
          <ControlLabel>with material unit</ControlLabel>
          {' '}
          {['Equiv', 'Amount'].map(
            (unit) => (
              <Radio
                key={unit}
                checked={materialUnit === unit}
                onChange={() => setMaterialUnit(unit)}
                inline
              >
                {unit}
              </Radio>
            )
          )}
          {' '}
          <ControlLabel>Identify materials by</ControlLabel>
          {' '}
          <DropdownButton
            title={materialHeaderIdentifier}
          >
            {['name', 'ext. label', 'short label', 'sum formula', 'iupac name'].map(
              (identifier) => (
                <MenuItem
                  key={identifier}
                  onSelect={() => setMaterialHeaderIdentifier(identifier)}
                >
                  {identifier}
                </MenuItem>
              )
            )}
          </DropdownButton>
        </FormGroup>
      </Form>

      <div style={{ height: '50vh' }} className="ag-theme-alpine">
        <AgGridReact
          ref={gridRef}
          rowData={reaction.variations}
          rowDragEntireRow
          rowDragManaged
          columnDefs={columnDefs}
          readOnlyEdit
          onCellEditRequest={updateRow}
          defaultColDef={{
            editable: true,
            sortable: true,
            resizable: true,
            comparator: cellComparator,
            cellEditor: CellEditor,
            cellRenderer: CellRenderer,
            wrapHeaderText: true,
            autoHeaderHeight: true,
          }}
        />
      </div>
    </div>
  );
}
