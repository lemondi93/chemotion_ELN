import React, { Component } from 'react';
import UIStore from 'src/stores/alt/stores/UIStore';
import { Table } from 'react-bootstrap';
import ElementCheckbox from 'src/apps/mydb/elements/list/ElementCheckbox';
import ElementContainer from 'src/apps/mydb/elements/list/ElementContainer';
import { elementShowOrNew } from 'src/utilities/routesUtils';
import DragDropItemTypes from 'src/components/DragDropItemTypes';
import Aviator from 'aviator';
import CellLineItemText from 'src/apps/mydb/elements/list/cellLine/CellLineItemText';
import ArrayUtils from 'src/utilities/ArrayUtils';
import ElementCollectionLabels from 'src/apps/mydb/elements/labels/ElementCollectionLabels';
import { CellLinePropTypeTableEntry } from 'src/models/cellLine/CellLinePropTypes';

export default class CellLineItemEntry extends Component {
  constructor() {
    super();
    this.showDetails = this.showDetails.bind(this);
  }

  showDetails() {
    const { currentCollection, isSync } = UIStore.getState();
    const { cellLineItem } = this.props;
    const { id, type } = cellLineItem;

    const uri = isSync
      ? `/scollection/${currentCollection.id}/${type}/${id}`
      : `/collection/${currentCollection.id}/${type}/${id}`;
    Aviator.navigate(uri, { silent: true });
    const e = {
      type,
      params: {
        collectionID: currentCollection.id,
        new_cellLine: false,
        cellLineId: id
      }
    };
    e.params[`${type}ID`] = id;

    elementShowOrNew(e);
  }

  // eslint-disable-next-line class-methods-use-this
  isElementChecked(element) {
    const { checkedIds, uncheckedIds, checkedAll } = UIStore.getState().cell_line;
    return (checkedAll && ArrayUtils.isValNotInArray(uncheckedIds || [], element.id))
      || ArrayUtils.isValInArray(checkedIds || [], element.id);
  }

  render() {
    const { cellLineItem } = this.props;
    return (
      <div className="group-entry">
        <Table className="elements" hover>
          <tbody>
            <tr className="white-background top-border">
              <td className="select-checkBox">
                <ElementCheckbox
                  element={cellLineItem}
                  key={cellLineItem.id}
                  checked={this.isElementChecked(cellLineItem)}
                />
              </td>
              <td className="short_label">
                {cellLineItem.short_label}
              </td>

              <CellLineItemText
                cellLineItem={cellLineItem}
                showDetails={this.showDetails}
              />
              <td className="arrow">
                <ElementCollectionLabels element={cellLineItem} key={cellLineItem.id} />
                <ElementContainer
                  key={cellLineItem.id}
                  sourceType={DragDropItemTypes.CELL_LINE}
                  element={cellLineItem}
                />
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    );
  }
}

CellLineItemEntry.propTypes = {
  cellLineItem: CellLinePropTypeTableEntry.isRequired
};
