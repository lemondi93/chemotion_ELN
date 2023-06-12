/* eslint-disable no-param-reassign */
/* eslint-disable react/prop-types */
/* eslint-disable react/require-default-props */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Button, Overlay, Popover } from 'react-bootstrap';
import Immutable from 'immutable';
import _, { isEmpty } from 'lodash';
import UserStore from 'src/stores/alt/stores/UserStore';
import UserActions from 'src/stores/alt/actions/UserActions';
import TabLayoutContainer from 'src/apps/mydb/elements/tabLayout/TabLayoutContainer';
import UIStore from 'src/stores/alt/stores/UIStore';
import CollectionActions from '../../../../stores/alt/actions/CollectionActions';
import { getElementSegments } from '../../../../utilities/ElementUtils';

const getNodeText = (node) => {
  if (['string', 'number'].includes(typeof node)) return node;
  if (node instanceof Array) return node.map(getNodeText).join('');
  if (typeof node === 'object' && node) {
    if (node.props.children) {
      return getNodeText(node.props.children);
    } else if (node.props.alt) {
      return getNodeText(node.props.alt);
    }
    return '';
  }
  return '';
};

const getArrayFromLayout = (layout, availableTabs, addInventoryTab) => {
  const layoutKeys = Object.keys(layout);
  if (addInventoryTab) {
    layout.inventory = layoutKeys.length + 1;
  }
  const enabled = availableTabs.filter(val => layoutKeys.includes(val));
  const leftover = availableTabs.filter(val => !layoutKeys.includes(val));
  const visible = [];
  const hidden = [];

  enabled.forEach((key) => {
    const order = layout[key];
    if (order < 0) { hidden[Math.abs(order)] = key; }
    if (order > 0) { visible[order] = key; }
  });

  leftover.forEach(key => hidden.push(key));

  let first = null;
  if (visible.length === 0) {
    first = hidden.filter(n => n !== undefined)[0];
    if (first) {
      visible.push(first);
    }
  }
  if (hidden.length === 0) {
    hidden.push('hidden');
  }
  return {
    visible: Immutable.List(visible.filter(n => n !== undefined)),
    hidden: Immutable.List(hidden.filter(n => (n !== undefined && n !== first)))
  };
};

const filterTabLayout = (layoutState) => {
  const { visible, hidden } = layoutState;
  const layout = {};

  visible.forEach((value, index) => {
    layout[value] = (index + 1);
  });
  hidden.filter(val => val !== 'hidden').forEach((value, index) => {
    layout[value] = (-index - 1);
  });
  return layout;
};

export default class ElementDetailSortTab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: Immutable.List(),
      hidden: Immutable.List(),
      showTabLayoutContainer: false
    };

    this.type = props.type;

    this.onChangeUser = this.onChangeUser.bind(this);
    this.onCloseTabLayoutContainer = this.onCloseTabLayoutContainer.bind(this);
    this.toggleTabLayoutContainer = this.toggleTabLayoutContainer.bind(this);

    UserActions.fetchCurrentUser();
  }

  // to force popups to stay anchored to button
  // as shouldUpdatePosition prop for Overlay does not work for reactions
  resize = () => this.forceUpdate()

  componentDidMount() {
    UserStore.listen(this.onChangeUser);
    window.addEventListener('resize', this.resize);
  }

  componentWillUnmount() {
    UserStore.unlisten(this.onChangeUser);
    window.removeEventListener('resize', this.resize);
  }

  onChangeUser(state) {
    const { availableTabs, addInventoryTab } = this.props;
    const currentCollection = UIStore.getState().currentCollection;
    const tabs = currentCollection?.tabs_segment;
    let layout = {};
    if (tabs && tabs.hasOwnProperty(`${this.type}`) && tabs[`${this.type}`]) {
      layout = tabs[`${this.type}`]
    } else if(state.profile && state.profile.data && state.profile.data[`layout_detail_${this.type}`]){
      layout = state.profile.data[`layout_detail_${this.type}`]
    }
    const { visible, hidden } = getArrayFromLayout(layout, availableTabs, addInventoryTab);

    this.setState(
      { visible, hidden },
      () => this.props.onTabPositionChanged(visible)
    );
  }

  onCloseTabLayoutContainer() {
    this.toggleTabLayoutContainer();
    this.updateLayout();
  }

  updateLayout() {
    const layout = filterTabLayout(this.tabLayoutContainerElement.state);
    const currentCollection = UIStore.getState().currentCollection;
    let tabSegment = currentCollection?.tabs_segment;
    _.set(tabSegment, `${this.type}`, layout);
    tabSegment = { ...tabSegment, [`${this.type}`]: layout };
    CollectionActions.updateTabsSegment({ segment: tabSegment, cId: currentCollection.id });

    const userProfile = UserStore.getState().profile;
    const layoutName = `data.layout_detail_${this.type}`;
    _.set(userProfile, layoutName, layout);
    UserActions.updateUserProfile(userProfile);
  }

  toggleTabLayoutContainer() {
    this.setState({ showTabLayoutContainer: !this.state.showTabLayoutContainer });
  }

  render() {
    const currentCollection = UIStore.getState().currentCollection;
    const tabs = currentCollection?.tabs_segment;
    const buttonInfo = isEmpty(tabs) ? 'info' : 'default';
    const tabLayoutContainerElement = (
      <TabLayoutContainer
        visible={this.state.visible}
        hidden={this.state.hidden}
        tabTitles={this.props.tabTitles}
        isElementDetails
        ref={(tabLayoutContainerElement) => this.tabLayoutContainerElement = tabLayoutContainerElement}
      />
    );
    const { visible, hidden } = this.state;
    const wd = 200 + ((visible && visible.size * 75) || 0) + ((hidden && hidden.size * 75) || 0);
    const popoverSettings = (
      <Popover
        className="collection-overlay"
        id="popover-layout"
        style={{ maxWidth: 'none', width: `${wd}px`, position: 'sticky' }}
      >
        <div>
          <h3 className="popover-title">Tab Layout</h3>
          <div className="popover-content">
            {tabLayoutContainerElement}
          </div>
        </div>
      </Popover>
    );
    return (
      <div>
        <Button
          bsStyle={buttonInfo}
          bsSize="xsmall"
          className="button-right"
          ref={button => { this.tabLayoutButton = button; }}
          onClick={this.toggleTabLayoutContainer}
          title="Tabs layout for all collections can also be managed in Collection Tabs page">
        >
          <i className="fa fa-sliders" aria-hidden="true" />
        </Button>
        <Overlay
          style={{ overflowY: 'scroll'}}
          container={this}
          onHide={this.onCloseTabLayoutContainer}
          placement="bottom"
          rootClose
          show={this.state.showTabLayoutContainer}
          target={() => ReactDOM.findDOMNode(this.tabLayoutButton)}
          shouldUpdatePosition // works alongside resize event listener
        >
          {popoverSettings}
        </Overlay>
      </div>
    );
  }
}

ElementDetailSortTab.propTypes = {
  onTabPositionChanged: PropTypes.func,
  availableTabs: PropTypes.arrayOf(PropTypes.string),
  tabTitles: PropTypes.object,
  addInventoryTab: PropTypes.bool,
};

export { getArrayFromLayout, filterTabLayout };
