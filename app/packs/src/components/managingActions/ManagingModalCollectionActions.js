import React from 'react';
import PropTypes from 'prop-types';
import { Button, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';
import UIStore from 'src/stores/alt/stores/UIStore';
import CollectionStore from 'src/stores/alt/stores/CollectionStore';
import Select from 'react-select'

export default class ManagingModalCollectionActions extends React.Component {
  constructor(props) {
    super(props);
    const options = this.collectionOptions();
    this.state = {
      newLabel: null,
      options: options,
      selected: null,
    }
    this.onSelectChange = this.onSelectChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  onSelectChange(e) {
    let selected = e && e.value
    this.setState((previousProps, previousState) => {
      return { ...previousState, selected: selected }
    });
  }

  writableColls(colls) {
    return colls.map(coll => {
      return coll.permission_level >= 1 ? coll : null;
    }).filter(r => r != null);
  }

  collectionEntries() {
    const collStore = CollectionStore.getState();
    const ui_state = UIStore.getState();

    let collections = collStore.myCollections;
    collections.splice(collections.findIndex(c => c.id === ui_state.currentCollection.id),1);

    if (collections.length > 0) { collections[0] = Object.assign(collections[0], { first: true }); }

    const cAll = [...collections];
    let cAllTree = [];
    this.makeTree(cAllTree, cAll, 0);
    return cAllTree;
  }

  makeTree(tree, collections, depth) {
    collections.forEach((collection, index) => {
      tree.push({
        id: collection.id,
        label: collection.label,
        depth: depth,
        first: collection.first,
        is_shared: collection.is_shared
      });
      if (collection.children && collection.children.length > 0) {
        this.makeTree(tree, collection.children, depth + 1)
      }
    });
  }

  collectionOptions() {
    const cAllTree = this.collectionEntries();
    if (cAllTree.length === 0) return [];
    const options = cAllTree.map(leaf => {
      const indent = "\u00A0".repeat(leaf.depth * 3 + 1);
      const className = leaf.first ? "separator" : "";
      return {
        value: `${leaf.id}-${leaf.is_shared ? "is_shared" : ""}`,
        label: indent + leaf.label,
        className: className
      };
    });
    return options;
  }

  handleSubmit() {
    const { selected, newLabel, selectedUsers } = this.state;
    const collection_id = selected && parseInt(selected.split("-")[0]);
    const is_shared = selected && selected.split("-")[1] == "is_shared";
    const ui_state = UIStore.getState();

    this.props.action({
      ui_state, collection_id, is_shared, newLabel, user_ids: selectedUsers
    });
    this.props.onHide();
  }

  submitButton() {
    const { newLabel, selected } = this.state
    const l = newLabel && newLabel.length
    return l && l > 0 ? (
      <Button bsStyle="warning" onClick={this.handleSubmit}>
        Create collection &lsquo;{newLabel}&rsquo; and Submit
      </Button>
    ) : (
      <Button bsStyle="warning" onClick={this.handleSubmit} disabled={!selected}>
        Submit
      </Button>
    );
  }

  render() {
    const { options, selected } = this.state;
    const onChange = (e) => {
      const val = e.target && e.target.value
      this.setState((previousState) => {
        return { ...previousState, newLabel: val }
      });
    }
    return (
      <div>
        <FormGroup>
          <ControlLabel>Select a Collection</ControlLabel>
          <Select
            options={options}
            value={selected}
            onChange={this.onSelectChange}
            className="select-assign-collection"
          />
        </FormGroup>
        <FormGroup>
          <ControlLabel>or Create a new Collection</ControlLabel>
          <FormControl
            type="text"
            placeholder="-- Please insert collection name --"
            onChange={onChange}
          />
        </FormGroup>
        {this.submitButton()}
      </div>
    )
  }
}

ManagingModalCollectionActions.propTypes = {
  action: PropTypes.func,
  onHide: PropTypes.func,
  listSharedCollections: PropTypes.bool,
}
