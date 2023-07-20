import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { DropTarget } from 'react-dnd';
import DragDropItemTypes from 'src/components/DragDropItemTypes';
import ElementActions from 'src/stores/alt/actions/ElementActions';
import { UrlSilentNavigation } from 'src/utilities/ElementUtils';
import SampleName from 'src/components/common/SampleName';
import SamplesFetcher from 'src/fetchers/SamplesFetcher';

const spec = {
  drop(props, monitor) {
    const { field, onChange } = props;
    onChange({ sample_id: monitor.getItem().element.id }, field.id);
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

class ResearchPlanDetailsFieldSample extends Component {
  constructor(props) {
    super(props);
    this.state = {
      idle: true,
      sample: {
        id: null
      },
      wasSampleSet: false
    };
  }

  componentDidMount() {
    const { field } = this.props;
    if (field?.value?.sample_id && hasAuth(field?.value?.sample_id) && !this.state.sample.id) {
      this.fetch();
    }
  }

  componentDidUpdate(prevProps) {
    const { field } = this.props;
    const { idle } = this.state;
    if (prevProps.field?.value?.sample_id !== field?.value?.sample_id && hasAuth(field?.value?.sample_id) && idle) {
      this.setState(
        {
          idle: false,
          wasSampleSet: !!field?.value?.sample_id
        },
        this.fetch
      );
    }
  }

  fetch() {
    const { field } = this.props;
    SamplesFetcher.fetchById(field?.value?.sample_id).then((sample) => {
      this.setState({ idle: true, sample });
    });
  }

  showSample() {
    const { sample } = this.state;
    UrlSilentNavigation(sample);
    ElementActions.fetchSampleById(sample?.id);
  }

  renderSample(sample) {
    if (!hasAuth(sample?.id)) {
      return noAuth(sample);
    }
    const { edit } = this.props;
    const title = sample.title();
    let link;
    if (edit) {
      link = (<p>{`Sample: ${title}`}</p>);
    }
    let image;
    if (sample.svgPath) {
      image = (
        <div className="image-container">
          <a role="link" tabIndex={0} onClick={() => this.showSample()} style={{ cursor: 'pointer' }}>
            <img src={sample.svgPath} alt={title} />
          </a>
          <SampleName sample={sample} />
        </div>
      );
    } else {
      image = (
        <div className="image-container">
          <a role="link" tabIndex={0} onClick={() => this.showSample()} style={{ cursor: 'pointer' }}>
            {title}
          </a>
        </div>
      );
    }
    return (
      <div className="research-plan-field-image">
        {link}
        {image}
      </div>
    );
  }

  renderEdit() {
    const { connectDropTarget, isOver, canDrop } = this.props;
    const { sample, wasSampleSet } = this.state;

    if (!hasAuth(sample?.id)) {
      return noAuth(sample);
    }

    let className = 'drop-target';
    if (isOver) className += ' is-over';
    if (canDrop) className += ' can-drop';

    let content;
    if (sample?.id) {
      content = this.renderSample(sample);
    } else if (wasSampleSet) {
      content = (
        <div style={{ color: 'red', textAlign: 'left' }}>
          <i className="fa fa-exclamation-triangle" aria-hidden="true" style={{ marginRight: '5px' }} />
          <span style={{ fontWeight: 'bold' }}>Element not found!</span>
        </div>
      );
    } else {
      content = 'Drop sample here.';
    }

    return connectDropTarget(
      <div className={className}>
        {content}
      </div>
    );
  }

  renderStatic() {
    const { sample, wasSampleSet } = this.state;

    let content;
    if (sample?.id) {
      content = this.renderSample(sample);
    } else if (wasSampleSet) {
      content = (
        <div style={{ color: 'red', textAlign: 'left' }}>
          <i className="fa fa-exclamation-triangle" aria-hidden="true" style={{ marginRight: '5px' }} />
          <span style={{ fontWeight: 'bold' }}>Element not found!</span>
        </div>
      );
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

ResearchPlanDetailsFieldSample.propTypes = {
  field: PropTypes.object,
  index: PropTypes.number,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
  edit: PropTypes.bool,
};

export default DropTarget(DragDropItemTypes.SAMPLE, spec, collect)(ResearchPlanDetailsFieldSample);
