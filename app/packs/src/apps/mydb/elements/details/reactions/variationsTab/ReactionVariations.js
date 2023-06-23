/* eslint-disable react/display-name */
import { AgGridReact } from 'ag-grid-react';
import React, {
  useRef, forwardRef, useState, useEffect, useImperativeHandle, useCallback
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Button, FormGroup, Radio, ControlLabel, ButtonGroup,
  OverlayTrigger, Tooltip, Form
} from 'react-bootstrap';
import _ from 'lodash';
import { iupacNameTooltip } from 'src/apps/mydb/elements/details/reactions/schemeTab/Material';
import { createVariationsRow } from 'src/apps/mydb/elements/details/reactions/variationsTab/ReactionVariationsUtils';

function MaterialHeader({ material }) {
  return (
    <OverlayTrigger placement="bottom" overlay={iupacNameTooltip(material)}>
      <div>
        {material.external_label || material.short_label || material.id.toString()}
      </div>
    </OverlayTrigger>
  );
}

function RowToolsCellRenderer({ data, copyRow, removeRow }) {
  return (
    <ButtonGroup>
      <Button onClick={() => copyRow(data)}><i className="fa fa-copy" /></Button>
      <Button onClick={() => removeRow(data)}><i className="fa fa-trash" /></Button>
    </ButtonGroup>
  );
}

function CellRenderer({ value: cellData }) {
  const { value = '', unit = 'None', aux = {} } = cellData ?? {};
  const cellContent = `${Number(value) ? Number(value).toFixed(3) : 'NaN'} [${unit}]`;

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

export default function ReactionVariations({ reaction, onEditVariations }) {
  const gridRef = useRef();

  const [materialUnit, setMaterialUnit] = useState('Equiv');

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
  }, []);

  const columnDefs = [
    {
      field: '',
      cellRenderer: RowToolsCellRenderer,
      cellRendererParams: { copyRow, removeRow },
      editable: false,
    },

    {
      headerName: 'Properties',
      groupId: 'Properties',
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
      children: reaction.starting_materials.map(
        (material) => ({
          field: `startingMaterials.${material.id}`, // must be unique
          headerComponent: MaterialHeader,
          headerComponentParams: { material },
        })
      )
    },
    {
      headerName: 'Reactants',
      groupId: 'Reactants',
      children: reaction.reactants.map(
        (material) => ({
          field: `reactants.${material.id}`,
          headerComponent: MaterialHeader,
          headerComponentParams: { material },
        })
      )
    },
    {
      headerName: 'Products',
      groupId: 'Products',
      children: reaction.products.map(
        (material) => ({
          field: `products.${material.id}`,
          headerComponent: MaterialHeader,
          headerComponentParams: { material },
        })
      )
    }
  ];

  const sizeColumnsToFit = useCallback(() => {
    gridRef.current.api.sizeColumnsToFit({ defaultMinWidth: 125 });
  }, []);

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
        </FormGroup>
      </Form>

      <div style={{ height: '50vh' }} className="ag-theme-alpine">
        <AgGridReact
          ref={gridRef}
          rowData={reaction.variations}
          columnDefs={columnDefs}
          readOnlyEdit
          onCellEditRequest={updateRow}
          onComponentStateChanged={sizeColumnsToFit}
          defaultColDef={{
            editable: true,
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
