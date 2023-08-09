import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropTarget } from 'react-dnd';
import DragDropItemTypes from 'src/components/DragDropItemTypes';
import ElementActions from 'src/stores/alt/actions/ElementActions';
import { UrlSilentNavigation } from 'src/utilities/ElementUtils';
import ReactionsFetcher from 'src/fetchers/ReactionsFetcher';

const spec = {
  drop(props, monitor, component) {
    const { field, onChange } = props;
    field.value.reaction_id = monitor.getItem().element.id;
    onChange({ reaction_id: monitor.getItem().element.id }, field.id);

    // set reactionDropped to true when an item is dropped
    component.setState({ reactionDropped: true });

    // trigger immediate update of the state after dropping
    component.onDropReaction(monitor.getItem().element.id);
  }
};

const collect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop()
});

const hasAuth = (id) => {
  if (typeof id === 'string' && id.includes('error')) return false; return true;
};

const noAuth = (el) => (
  <div className="research-plan-no-auth">
    <h4>
      {el.id.split(':')[2]}
      &nbsp;
      <i className="fa fa-eye-slash" aria-hidden="true" />
    </h4>
  </div>
);

function elementError() {
  return (
    <div style={{ color: 'red', textAlign: 'left' }}>
      <i className="fa fa-exclamation-triangle" aria-hidden="true" style={{ marginRight: '5px' }} />
      <span style={{ fontWeight: 'bold' }}>Element not found!</span>
    </div>
  );
}

class ResearchPlanDetailsFieldReaction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      idle: true,
      reaction: {
        id: null
      },
    };
    this.onDropReaction = this.onDropReaction.bind(this);
  }

  componentDidMount() {
    const { field } = this.props;
    if (field?.value?.reaction_id && hasAuth(field?.value?.reaction_id) && !this.state.reaction.id) {
      this.fetch();
    }

    if (this.state.reactionDropped) {
      this.onDropReaction(this.props.field?.value?.reaction_id);
      this.setState({ reactionDropped: false });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { field } = this.props;
    const { idle } = this.state;
    // if reaction id is not the same as before or the previous state of reaction was null, fetch the new one
    if (
      idle
      && field?.value?.reaction_id
      && prevState.reaction?.id !== field?.value?.reaction_id
      && hasAuth(field?.value?.reaction_id)
    ) {
      this.setState(
        {
          idle: false,
        },
        this.fetch
      );
    }

    if (this.state.reactionDropped) {
      this.onDropReaction(this.props.field?.value?.reaction_id);
      this.setState({ reactionDropped: false });
    }
  }

  onDropReaction(reaction_id) {
    ReactionsFetcher.fetchById(reaction_id)
      .then((reaction) => {
        if (reaction_id === reaction.id) {
          this.setState({ idle: true, reaction });
        }
      })
      .catch(() => {
        // handle case when the reaction is not found
        if (reaction_id === this.state.reaction.id) {
          this.setState({ idle: true, reaction: { id: null } });
        }
      });
  }

  fetch() {
    const { field } = this.props;

    // check if the field's reaction_id exists and if the reaction id in the state is different from the one in the field's value
    if (
      field?.value?.reaction_id
      && this.state.reaction?.id !== field?.value?.reaction_id
    ) {
      ReactionsFetcher.fetchById(field.value.reaction_id)
        .then((reaction) => {
          // only update state if the fetched reaction's id is the same as the current field's reaction_id
          if (field?.value?.reaction_id === reaction.id) {
            this.setState({ idle: true, reaction });
          }
        })
        .catch(() => {
          // handle case when the reaction is not found
          if (field?.value?.reaction_id === this.state.reaction?.id) {
            this.setState({ idle: true, reaction: { id: null } });
          }
        });
    }
  }

  showReaction() {
    const { reaction } = this.state;
    UrlSilentNavigation(reaction);
    ElementActions.fetchReactionById(reaction?.id);
  }

  renderReaction(reaction) {
    if (!hasAuth(reaction?.id)) {
      return noAuth(reaction);
    }

    if (!reaction?.id) {
      elementError();
    }

    const { edit } = this.props;

    const link = (
      <button
        type="button"
        style={{
          cursor: 'pointer',
          color: '#003366',
          backgroundColor: 'transparent',
          border: '1px solid #003366',
          borderRadius: '4px',
          margin: '5px',
          outline: 'none',
        }}
        onClick={() => this.showReaction()}
      >
        {reaction.title()}
      </button>
    );

    let image;
    if (reaction.svgPath) {
      image = <img src={reaction.svgPath} alt={reaction.title()} />;
    }

    const reactionStyle = edit ? {} : {
      border: '1px solid #cccccc',
      padding: '5px',
    };

    return (
      <div className="research-plan-field-reaction" style={reactionStyle}>
        {link}
        <div className="image-container">
          {image}
        </div>
      </div>
    );
  }

  renderEdit() {
    const { connectDropTarget, isOver, canDrop } = this.props;
    const { reaction } = this.state;

    if (!hasAuth(reaction?.id)) {
      return noAuth(reaction);
    }

    let className = 'drop-target';
    if (isOver) className += ' is-over';
    if (canDrop) className += ' can-drop';

    let content;
    if (reaction?.id) {
      content = this.renderReaction(reaction);
    } else if (!reaction?.id && this.props.field?.value?.reaction_id) {
      content = elementError();
    } else {
      content = 'Drop reaction here.';
    }

    return connectDropTarget(
      <div className={className}>
        {content}
      </div>
    );
  }

  renderStatic() {
    const { reaction } = this.state;

    let content;
    if (reaction?.id) {
      content = this.renderReaction(reaction);
    } else if (!reaction?.id && this.props.field?.value?.reaction_id) {
      content = elementError();
    } else {
      content = null;
    }

    return content;
  }

  render() {
    if (this.props.edit) {
      return this.renderEdit();
    }
    return this.renderStatic();
  }
}

ResearchPlanDetailsFieldReaction.propTypes = {
  field: PropTypes.object,
  index: PropTypes.number,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  edit: PropTypes.bool,
};

export default DropTarget(DragDropItemTypes.REACTION, spec, collect)(ResearchPlanDetailsFieldReaction);
