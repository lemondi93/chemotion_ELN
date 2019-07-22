import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Row, Col, Glyphicon } from 'react-bootstrap';
import SVG from 'react-inlinesvg';
import { includes, last, findKey, values } from 'lodash';

import ResearchPlansFetcher from '../fetchers/ResearchPlansFetcher';
import StructureEditorModal from '../structure_editor/StructureEditorModal';
import QuillEditor from '../QuillEditor';

export default class KetcherField extends Component {

  constructor(props) {
    super(props)
    const { field, index, disabled, onChange } = props
    this.state = {
      field,
      index,
      disabled,
      onChange,
      showStructureEditor: false,
      loadingMolecule: false
    }
  }

  showStructureEditor() {
    this.setState({
      showStructureEditor: true
    });
  }

  hideStructureEditor() {
    this.setState({
      showStructureEditor: false
    });
  }

  handleStructureEditorSave(sdf_file, svg_file, config = null) {
    let { field, index, onChange } = this.state

    field.value = {
      sdf_file: sdf_file,
      svg_file: svg_file
    }

    const smiles = config ? config.smiles : null;

    this.setState({loadingMolecule: true});

    const isChemdraw = smiles ? true : false

    ResearchPlansFetcher.updateSVGFile(svg_file, isChemdraw).then((json) => {
      field.value.svg_file = json.svg_path;
      this.setState({
        field: field,
        loadingMolecule: false
      });
      onChange(field.value, index)
      this.hideStructureEditor();
    });
  }

  handleStructureEditorCancel() {
    this.hideStructureEditor()
  }

  renderStructureEditorModal(field) {
    const molfile = field.value.sdf_file;
    return(
      <StructureEditorModal key={field.id}
                            showModal={this.state.showStructureEditor}
                            onSave={this.handleStructureEditorSave.bind(this)}
                            onCancel={this.handleStructureEditorCancel.bind(this)}
                            molfile={molfile} />
    )
  }

  render() {
    let { field, disabled } = this.state

    let className, svgPath

    if (field.value.svg_file) {
      className = 'svg-container'
      svgPath = '/images/research_plans/' + field.value.svg_file
    } else {
      className = 'svg-container-empty'
      svgPath = '/images/wild_card/loading-bubbles.svg'
    }

    const imageDefault = !includes(svgPath, 'no_image_180.svg');

    return (
      <Row>
        <Col md={12}>
          <FormGroup>
            <div className={className}
                 onClick={this.showStructureEditor.bind(this)} >
              <Glyphicon className="pull-right" glyph="pencil" />
              <SVG key={svgPath} src={svgPath} className="molecule-mid" />
            </div>
          </FormGroup>
        </Col>
        {this.renderStructureEditorModal(field)}
      </Row>
    )
  }
}

KetcherField.propTypes = {
  field: PropTypes.object,
  index: PropTypes.number,
  disabled: PropTypes.bool,
  onChange: PropTypes.func,
}
