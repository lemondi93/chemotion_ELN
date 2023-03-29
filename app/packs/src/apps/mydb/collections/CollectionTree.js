import React from 'react';
import { Button, OverlayTrigger, Badge, Glyphicon, Tooltip } from 'react-bootstrap';
import update from 'immutability-helper';
import CollectionStore from 'src/stores/alt/stores/CollectionStore';
import CollectionActions from 'src/stores/alt/actions/CollectionActions';
import CollectionSubtree from 'src/apps/mydb/collections/CollectionSubtree';
import UIActions from 'src/stores/alt/actions/UIActions';
import InboxActions from 'src/stores/alt/actions/InboxActions';
import LoadingActions from 'src/stores/alt/actions/LoadingActions';
import UIStore from 'src/stores/alt/stores/UIStore';
import ElementStore from 'src/stores/alt/stores/ElementStore';
import InboxStore from 'src/stores/alt/stores/InboxStore';
import UserInfos from 'src/apps/mydb/collections/UserInfos';
import SampleTaskNavigationElement from 'src/apps/mydb/collections/sampleTaskInbox/SampleTaskNavigationElement';
import SampleTaskInbox from 'src/apps/mydb/collections/sampleTaskInbox/SampleTaskInbox';
import { filterMySharedCollection, filterSharedWithMeCollection } from './CollectionTreeStructure'

import DeviceBox from 'src/apps/mydb/inbox/DeviceBox';
import UnsortedBox from 'src/apps/mydb/inbox/UnsortedBox';

const colVisibleTooltip = <Tooltip id="col_visible_tooltip">Toggle own collections</Tooltip>;

export default class CollectionTree extends React.Component {
  constructor(props) {
    super(props);

    const collecState = CollectionStore.getState();
    const inboxState = InboxStore.getState();

    this.state = {
      myCollections: collecState.myCollections,
      mySharedCollections: collecState.mySharedCollections,
      sharedCollections: collecState.sharedCollections,
      unsharedRoots: collecState.unsharedRoots,
      sharedRoots: collecState.sharedRoots,
      remoteRoots: collecState.remoteRoots,
      lockedRoots: collecState.lockedRoots,
      syncInRoots: collecState.syncInRoots,
      ownCollectionVisible: true,
      sharedWithCollectionVisible: false,
      sharedToCollectionVisible: false,
      syncCollectionVisible: false,
      inbox: inboxState.inbox,
      numberOfAttachments: inboxState.numberOfAttachments,
      inboxVisible: false
    };

    this.onChange = this.onChange.bind(this);
    this.onClickInbox = this.onClickInbox.bind(this);
  }

  componentDidMount() {
    CollectionStore.listen(this.onChange);
    InboxStore.listen(this.onChange);
    //CollectionActions.fetchGenericEls();
    CollectionActions.fetchLockedCollectionRoots();
    CollectionActions.fetchMyCollections();
    CollectionActions.fetchCollectionsSharedWithMe();
    CollectionActions.fetchUnsharedCollectionRoots();
    CollectionActions.fetchSharedCollectionRoots();
    CollectionActions.fetchRemoteCollectionRoots();
    CollectionActions.fetchSyncInCollectionRoots();
    InboxActions.fetchInboxCount();
  }

  componentWillUnmount() {
    CollectionStore.unlisten(this.onChange);
    InboxStore.unlisten(this.onChange);
  }

  onChange(state) {
    this.setState(state);
  }

  onClickInbox() {
    const { inboxVisible, inbox } = this.state;
    this.setState({ inboxVisible: !inboxVisible });
    if (!inbox.children) {
      LoadingActions.start();
      InboxActions.fetchInbox();
    }
  }

  refreshInbox() {
    LoadingActions.start();
    InboxActions.fetchInbox();
  }

  lockedSubtrees() {
    const roots = this.state.lockedRoots;

    return this.subtrees(roots, null, false);
  }

  removeOrphanRoots(roots) {
    let newRoots = []
    roots.forEach((root) => {
      if (root.children.length > 0) newRoots.push(root)
    })

    return newRoots;
  }
  unsharedSubtrees() {
    let roots = this.state.unsharedRoots;
    roots = roots.filter(function (item) { return !item.isNew })

    return this.subtrees(roots, null, false);
  }

  myCollections() {
    let myCollections = this.state.myCollections;

    myCollections = myCollections.filter(c => (c.is_shared === false && c.is_locked === false ));
    const subtrees = myCollections.map((root, index) => {
      return <CollectionSubtree root={root} key={index} />
    })

    return (
      <div>
        <div style={{ display: '' }}>
          {subtrees}
        </div>
      </div>
    );
  }

  unsharedSubtrees() {
    let roots = this.state.unsharedRoots;
    roots = roots.filter(function (item) { return !item.isNew })

    return this.subtrees(roots, null, false);
  }

  inboxSubtrees() {
    const { inbox } = this.state;

    let boxes = '';
    if (inbox.children) {
      inbox.children.sort((a, b) => {
        if (a.name > b.name) { return 1; } if (a.name < b.name) { return -1; } return 0;
      });
      boxes = inbox.children.map((deviceBox) => {
        return (
          <DeviceBox key={`box_${deviceBox.id}`} device_box={deviceBox} />
        );
      });
    }

    return (
      <div className="tree-view">
        {boxes}
        {inbox.unlinked_attachments
          ? <UnsortedBox key="unsorted_box" unsorted_box={inbox.unlinked_attachments} />
          : ''
        }
      </div>
    );
  }

  sharedByMeSubtrees() {
    let myCollections = this.state.myCollections;

    let { sharedToCollectionVisible } = this.state;
    let collections = filterMySharedCollection(myCollections);
    let sharedLabelledRoots = {};
    sharedLabelledRoots = collections.map(e => {
      return update(e, {
        label: {
          $set:
            <span>{this.labelRoot('shared_to', e)}</span>
        }
      })
    })

    let subTreeLabels = (
      <div className="tree-view">
        <div id="synchron-home-link" className="title" style={{backgroundColor:'white'}}
             onClick={() => this.setState({ sharedToCollectionVisible: !sharedToCollectionVisible })}>
          <i className="fa fa-share-alt" />&nbsp;&nbsp;
          Shared by me &nbsp;
        </div>
      </div>
    )

    return this.subtrees(sharedLabelledRoots, subTreeLabels,
      false, sharedToCollectionVisible, 'shared_to')
  }

  sharedWithMeSubtrees() {
    let { sharedCollections, sharedWithCollectionVisible } = this.state;

    let collections = filterSharedWithMeCollection(sharedCollections);
    let sharedLabelledRoots = {};
    sharedLabelledRoots = collections.map(e => {
      return update(e, {
        label: {
          $set:
            <span>{this.labelRoot('shared_by', e)}</span>
        }
      })
    })

    let subTreeLabels = (
      <div className="tree-view">
        <div id="synchron-home-link" className="title" style={{backgroundColor:'white'}}
             onClick={() => this.setState({ sharedWithCollectionVisible: !sharedWithCollectionVisible })}>
          <i className="fa fa-share-alt" />&nbsp;&nbsp;
          Shared with me &nbsp;
        </div>
      </div>
    )

    return this.subtrees(sharedLabelledRoots, subTreeLabels,
      false, sharedWithCollectionVisible, 'shared_by')
  }


  labelRoot(sharedToOrBy, rootCollection) {
    let collection = rootCollection[sharedToOrBy]
    if (!collection) return <span />

    return (
      <OverlayTrigger placement="bottom" overlay={UserInfos({ users:[collection] })}>
        <span>
          &nbsp; {sharedToOrBy == 'shared_to' ? 'with' : 'by'}
          &nbsp; {sharedToOrBy == 'shared_to' ? collection.initials : rootCollection.shared_by.initials}
        </span>
      </OverlayTrigger>
    )
  }

  convertToSlug(name) {
    return name.toLowerCase()
  }

  subtrees(roots, label, isRemote, visible = true, sharedToOrBy) {

    if (roots.length == undefined ) return <div />
    let subtrees = roots.map((root, index) => {
      return <CollectionSubtree root={root} key={index} isRemote={isRemote} sharedToOrBy={sharedToOrBy} />
    })

    let subtreesVisible = visible ? "" : "none"
    return (
      <div>
        {label}
        <div style={{ display: subtreesVisible }}>
          {subtrees}
        </div>
      </div>
    )
  }

  collectionManagementButton() {
    return (
      <div className="take-ownership-btn">
        <Button id="collection-management-button" bsSize="xsmall" bsStyle="danger"
          onClick={() => this.handleCollectionManagementToggle()}>
          <i className="fa fa-cog"></i>
        </Button>
      </div>
    )
  }

  handleCollectionManagementToggle() {
    UIActions.toggleCollectionManagement();
    const { showCollectionManagement, currentCollection, isShared } = UIStore.getState();

    if (showCollectionManagement) {
      Aviator.navigate('/collection/management');
    } else {
      if (currentCollection == null || currentCollection.label == 'All') {
        Aviator.navigate(`/collection/all/${this.urlForCurrentElement()}`);
      } else {
        Aviator.navigate(isShared
          ? `/scollection/${currentCollection.id}/${this.urlForCurrentElement()}`
          : `/collection/${currentCollection.id}/${this.urlForCurrentElement()}`);
      }
    }
  }

  urlForCurrentElement() {
    const { currentElement } = ElementStore.getState();
    if (currentElement) {
      if (currentElement.isNew) {
        return `${currentElement.type}/new`;
      }
      else {
        return `${currentElement.type}/${currentElement.id}`;
      }
    }
    else {
      return '';
    }
  }

  render() {
    let { ownCollectionVisible, inboxVisible, inbox } = this.state

    const ownCollectionDisplay = ownCollectionVisible ? '' : 'none';
    const inboxDisplay = inboxVisible ? '' : 'none';

    return (
      <div>
        <div className="tree-view">
          {this.collectionManagementButton()}
          <OverlayTrigger placement="top" delayShow={1000} overlay={colVisibleTooltip}>
            <div className="title" style={{ backgroundColor: 'white' }}
              onClick={() => this.setState({ ownCollectionVisible: !ownCollectionVisible })}>
              <i className="fa fa-list" /> &nbsp;&nbsp; Collections
            </div>
          </OverlayTrigger>
        </div>
        <div className="tree-wrapper" style={{ display: ownCollectionDisplay }}>
          {this.myCollections()}
        </div>
        <div className="tree-wrapper">
          {this.sharedByMeSubtrees()}
        </div>
        <div className="tree-wrapper">
          {this.sharedWithMeSubtrees()}
        </div>
        <div className="tree-view">
          <div className="title" style={{ backgroundColor: 'white' }}>
            <button
              type="button"
              className="btn-inbox"
              onClick={() => this.onClickInbox()}
            >
              <i className="fa fa-inbox" />
              <span style={{ marginLeft: '10px', marginRight: '5px' }}>Inbox</span>
            </button>
            {
              this.state.numberOfAttachments > 0 ? <Badge> {this.state.numberOfAttachments} </Badge> : ''
            }
            <Glyphicon bsSize="small" glyph="refresh" style={{ marginLeft: '5px' }} onClick={() => this.refreshInbox()} />
            <OverlayTrigger placement="bottom" overlay={<Tooltip id="fullInbox">Show larger Inbox</Tooltip>}>
              <Button style={{ position: 'absolute', right: 0 }} bsSize="xsmall" onClick={InboxActions.toggleInboxModal}>
                <i className="fa fa-expand" aria-hidden="true" />
              </Button>
            </OverlayTrigger>

          </div>

        </div>
        <div className="tree-wrapper" style={{ display: inboxDisplay }}>
          {this.inboxSubtrees()}
        </div>
        <SampleTaskNavigationElement />
        <SampleTaskInbox />
      </div>
    );
  }
}
