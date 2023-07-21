import React from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip, ButtonGroup } from 'react-bootstrap';

import DatasetContainer from 'src/apps/mydb/inbox/DatasetContainer';
import Pagination from 'src/apps/mydb/inbox/Pagination';
import DragDropItemTypes from 'src/components/DragDropItemTypes';
import InboxActions from 'src/stores/alt/actions/InboxActions';
import InboxStore from 'src/stores/alt/stores/InboxStore';
import LoadingActions from 'src/stores/alt/actions/LoadingActions';

export default class DeviceBox extends React.Component {
  constructor(props) {
    super(props);

    const inboxState = InboxStore.getState();

    this.state = {
      visible: false,
      checkedDeviceAll: inboxState.checkedDeviceAll,
      checkedDeviceIds: inboxState.checkedDeviceIds,
      checkedIds: inboxState.checkedIds,
      deletingTooltip: false,
      currentDeviceBoxPage: inboxState.currentDeviceBoxPage,
      dataItemsPerPage: inboxState.dataItemsPerPage,
    };

    this.handleDatasetSelect = this.handleDatasetSelect.bind(this);
    this.toggleSelectAllFiles = this.toggleSelectAllFiles.bind(this);
    this.deleteCheckedDataset = this.deleteCheckedDataset.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    const { device_box, deviceBoxVisible } = this.props;
    const { currentDeviceBoxPage } = this.state;
    // if (deviceBoxVisible) {
    //   if (Array.isArray(device_box.children) && !device_box.children.length) {
    //     LoadingActions.start();
    //     InboxActions.fetchInboxContainer(device_box.id, currentDeviceBoxPage);
    //   }
    // }
    this.setState({ visible: deviceBoxVisible });
    InboxStore.listen(this.onChange);
  }

  componentDidUpdate(prevProps) {
    const { deviceBoxVisible } = this.props;
    if (deviceBoxVisible !== prevProps.deviceBoxVisible) {
      this.setState({ visible: deviceBoxVisible });
    }
  }

  componentWillUnmount() {
    InboxStore.unlisten(this.onChange);
  }

  handleDeviceBoxClick(deviceBox) {
    const { visible, currentDeviceBoxPage, checkedDeviceAll, checkedDeviceIds, checkedIds } = this.state;
    const { fromCollectionTree } = this.props;

    InboxActions.setActiveDeviceBoxId(deviceBox.id);

    if (fromCollectionTree) {
      return;
    }

    if (!visible) {
      if (Array.isArray(deviceBox.children) && !deviceBox.children.length) {
        LoadingActions.start();
        InboxActions.fetchInboxContainer(deviceBox.id, currentDeviceBoxPage);
      }
    }
    this.setState({ visible: !visible, checkedDeviceAll: false, checkedDeviceIds: [], checkedIds: [] });
  }

  handleDatasetSelect(datasetId) {
    this.setState((prevState) => {
      const { checkedDeviceIds, checkedIds } = prevState;
      const newCheckedIds = [...checkedIds];
      const newCheckedDeviceIds = checkedDeviceIds.includes(datasetId)
        ? checkedDeviceIds.filter((id) => id !== datasetId)
        : [...checkedDeviceIds, datasetId];
  
      // Find the current device box
      const currentDeviceBox = this.props.device_box;
  
      // Find the dataset in the current device box
      const dataset = currentDeviceBox.children.find((d) => d.id === datasetId);
  
      dataset.attachments.forEach((attachment) => {
        const attachmentIndex = newCheckedIds.indexOf(attachment.id);
  
        if (attachmentIndex !== -1) {
          // If the attachment is already selected, deselect it
          newCheckedIds.splice(attachmentIndex, 1);
        } else {
          // If the attachment is not selected, select it
          newCheckedIds.push(attachment.id);
        }
      });
  
      return { checkedIds: newCheckedIds, checkedDeviceIds: newCheckedDeviceIds };
    });
  }

  onChange(state) {
    this.setState(state);
  }

  handlePrevClick = (deviceBox) => {
    const { currentDeviceBoxPage } = this.state;
    const updatedPage = currentDeviceBoxPage - 1;
    this.setState({ currentDeviceBoxPage: updatedPage });
    LoadingActions.start();
    InboxActions.fetchInboxContainer(deviceBox.id, updatedPage);
  };

  handleNextClick = (deviceBox) => {
    const { currentDeviceBoxPage } = this.state;
    const updatedPage = currentDeviceBoxPage + 1;
    this.setState({ currentDeviceBoxPage: updatedPage });
    LoadingActions.start();
    InboxActions.fetchInboxContainer(deviceBox.id, updatedPage);
  };

  toggleSelectAllFiles() {
    const { checkedDeviceAll } = this.state;

    const params = {
      type: false,
      range: 'all'
    };

    if (!checkedDeviceAll) {
      params.type = true;
    }

    this.setState(prevState => ({
      ...prevState.inboxState,
      checkedDeviceAll: !this.state.checkedDeviceAll
    }));

    InboxActions.checkedDeviceAll(params);
    InboxActions.checkedIds(params);
  }

  toggleTooltip() {
    this.setState((prevState) => ({ ...prevState, deletingTooltip: !prevState.deletingTooltip }));
  }

  hasChecked() {
    const { checkedDeviceAll } = this.props;
    return checkedDeviceAll;
  }

  deleteCheckedDataset() {
    const { checkedDeviceIds, currentDeviceBoxPage, dataItemsPerPage, device_box } = this.state;
    const startIndex = (currentDeviceBoxPage - 1) * dataItemsPerPage;
    const endIndex = startIndex + dataItemsPerPage;
    const currentItems = device_box.children.slice(startIndex, endIndex);
    const currentItemsCount = currentItems.length;
    const itemsDeleted = checkedDeviceIds.length;

    checkedDeviceIds.forEach((checkedId) => {
      device_box.children.forEach((dataset) => {
        if (checkedId === dataset.id) {
          InboxActions.deleteDataset(dataset, true);
        }
      });
    });

    if (currentDeviceBoxPage > 1 && itemsDeleted === currentItemsCount) {
      InboxActions.prevClick();
    } else {
      InboxActions.fetchInboxContainer(device_box.id, currentDeviceBoxPage);
    }

    checkedDeviceIds.length = 0;
    this.toggleTooltip();
    this.setState({ checkedDeviceAll: false });
  }

  deleteDeviceBox(deviceBox) {
    const { fromCollectionTree } = this.props;
    if (fromCollectionTree) {
      return;
    }

    InboxActions.deleteContainer(deviceBox);
  }

  render() {
    const { device_box, largerInbox, fromCollectionTree } = this.props;
    const {
      visible, checkedDeviceAll, checkedDeviceIds, checkedIds, currentDeviceBoxPage, dataItemsPerPage,
    } = this.state;
    const cache = InboxStore.getState().cache;

    // device_box.children_count gives the total number of children of each DeviceBox
    // while device_box.children contains only the paginated entries

    const totalPages = Math.ceil(device_box.children_count / dataItemsPerPage);

    const renderCheckAll = (
      <div>
        <input
          type="checkbox"
          checked={checkedDeviceAll && checkedDeviceIds.length === device_box.children.length }
          onChange={this.toggleSelectAllFiles}
        />
        <span className="g-marginLeft--10" style={{ fontWeight: 'bold' }}>
          {checkedDeviceAll && checkedDeviceIds.length === device_box.children.length? 'Deselect all' : 'Select all'}
        </span>
      </div>
    );

    const trash = (
      <span>
        <i
          className="fa fa-trash-o"
          aria-hidden="true"
          onClick={() => this.toggleTooltip()}
          style={{ cursor: 'pointer' }}
        >
          &nbsp;
        </i>
        {this.state.deletingTooltip ? (
          <Tooltip placement="bottom" className="in" id="tooltip-bottom">
            Delete this dataset?
            <ButtonGroup>
              <Button
                bsStyle="danger"
                bsSize="xsmall"
                onClick={() => this.deleteCheckedDataset()}
              >
                Yes
              </Button>
              <Button bsStyle="warning" bsSize="xsmall" onClick={() => this.toggleTooltip()}>
                No
              </Button>
            </ButtonGroup>
          </Tooltip>
        ) : null}
      </span>
    );

    device_box.children.sort((a, b) => {
      if (a.name > b.name) { return 1; } if (a.name < b.name) { return -1; } return 0;
    });

    const datasets = device_box.children.map((dataset) => (
      <DatasetContainer
        key={`dataset_${dataset.id}`}
        sourceType={DragDropItemTypes.DATASET}
        dataset={dataset}
        cache={cache}
        largerInbox={largerInbox}
        isSelected={checkedDeviceIds.includes(dataset.id)}
        onDatasetSelect={this.handleDatasetSelect}
      />
    ));

    const textStyle = {
      display: 'block',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      cursor: 'move'
    };

    return (
      <div className="tree-view">
        <div
          className="title"
          style={textStyle}
          onClick={() => this.handleDeviceBoxClick(device_box)}
          role="button"
          tabIndex={0}
          onKeyDown={() => {}}
        >
          {
            device_box?.children_count === 0
              ? (
                <i
                  className="fa fa-trash-o"
                  onClick={() => this.deleteDeviceBox(device_box)}
                  style={{ cursor: 'pointer' }}
                >
                  &nbsp;&nbsp;
                </i>
              ) : null
          }
          <button
            type="button"
            className="btn-inbox"
            onClick={!fromCollectionTree ? () => this.setState({ visible: !visible }) : null}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                InboxActions.showInboxModal();
              }
            }}
          >
            <i
              className={`fa fa-folder${visible ? '-open' : ''}`}
              aria-hidden="true"
              style={{ marginRight: '5px' }}
            />
            {device_box.name}
          </button>
        </div>
        {
          visible && !fromCollectionTree && device_box?.children_count > dataItemsPerPage ? (
            <Pagination
              currentDataSetPage={currentDeviceBoxPage}
              totalPages={totalPages}
              handlePrevClick={() => this.handlePrevClick(device_box)}
              handleNextClick={() => this.handleNextClick(device_box)}
            />
          ) : null
        }
        <table>
          <tbody>
            <tr>
              <td style={{ width: '80%', paddingRight: '30px' }}>
                <div>{visible ? renderCheckAll : null}</div>
              </td>
              <td style={{ width: '20%' }}>
                <div>{visible ? trash : null}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div>{visible && !fromCollectionTree ? datasets : null}</div>
      </div>
    );
  }
}

DeviceBox.propTypes = {
  device_box: PropTypes.object.isRequired,
  largerInbox: PropTypes.bool,
  fromCollectionTree: PropTypes.bool,
  deviceBoxVisible: PropTypes.bool,
};

DeviceBox.defaultProps = {
  largerInbox: false,
  fromCollectionTree: false,
  deviceBoxVisible: false,
};
