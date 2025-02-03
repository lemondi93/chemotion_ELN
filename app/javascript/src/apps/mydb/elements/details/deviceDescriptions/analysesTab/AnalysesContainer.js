import React, { useContext, useEffect } from 'react';
import {
  Form, Button, ButtonGroup, ButtonToolbar,
  OverlayTrigger, Tooltip, Accordion, Card,
} from 'react-bootstrap';

import ContainerComponent from 'src/components/container/ContainerComponent';
import AnalysisHeader from './AnalysisHeader';
import AnalysesSortableContainer from './AnalysesSortableContainer';
import ViewSpectra from 'src/apps/mydb/elements/details/ViewSpectra';
import NMRiumDisplayer from 'src/components/nmriumWrapper/NMRiumDisplayer';
import ButtonGroupToggleButton from 'src/components/common/ButtonGroupToggleButton';
import AccordionHeaderWithButtons from 'src/components/common/AccordionHeaderWithButtons';

import TextTemplateActions from 'src/stores/alt/actions/TextTemplateActions';
import { observer } from 'mobx-react';
import { StoreContext } from 'src/stores/mobx/RootStore';

const AnalysesContainer = ({ readonly }) => {
  const deviceDescriptionsStore = useContext(StoreContext).deviceDescriptions;
  const deviceDescription = deviceDescriptionsStore.device_description;
  const containers = deviceDescription.container.children[0].children;
  const mode = deviceDescriptionsStore.analysis_mode;

  useEffect(() => {
    TextTemplateActions.fetchTextTemplates('deviceDescription');
  }, []);

  const addEmptyAnalysis = () => {
    deviceDescriptionsStore.addEmptyAnalysisContainer();
    changeMode();
  }

  const changeMode = () => {
    const newMode = deviceDescriptionsStore.analysis_mode == 'edit' ? 'order' : 'edit';
    deviceDescriptionsStore.changeAnalysisMode(newMode);
  }

  const toggleCommentBox = () => {
    deviceDescriptionsStore.toggleAnalysisCommentBox();
  }

  const handleCommentTextChange = (e) => {
    deviceDescriptionsStore.changeAnalysisComment(e.target.value);
  }

  const handleContainerChanged = (container) => {
    deviceDescriptionsStore.changeAnalysisContainerContent(container);
  }

  const handleSpectraChange = () => {
    // TODO: spectra change
  }

  const handleSpectraSubmit = () => {
    // TODO: spectra submit
  }

  const addButton = () => {
    return (
      <div className="add-button">
        <Button
          size="xsm"
          variant="success"
          onClick={() => addEmptyAnalysis()}
          disabled={readonly}
        >
          <i className="fa fa-plus me-1" />
          Add analysis
        </Button>
      </div>
    );
  }

  const modeButton = () => {
    const isReadonly = !readonly && containers.length < 1 ? true : false;

    return (
      <ButtonGroup>
        <ButtonGroupToggleButton
          size="xsm"
          active={deviceDescriptionsStore.analysis_mode === 'edit'}
          onClick={() => changeMode()}
          disabled={isReadonly}
        >
          <i className="fa fa-edit me-1" />
          Edit mode
        </ButtonGroupToggleButton>
        <ButtonGroupToggleButton
          size="xsm"
          active={deviceDescriptionsStore.analysis_mode === 'order'}
          onClick={() => changeMode()}
          disabled={isReadonly}
        >
          <i className="fa fa-reorder me-1" />
          Order mode
        </ButtonGroupToggleButton>
      </ButtonGroup>
    );
  }

  const commentButton = () => {
    if (containers.length < 1) { return null; }

    const disableMode = deviceDescriptionsStore.analysis_mode === 'order' ? true : false;

    return (
      <OverlayTrigger
        placement="top"
        overlay={(
          <Tooltip id="analysisCommentBox">
            general remarks that relate to all analytical data
          </Tooltip>
        )}
      >
        <Button
          size="xsm"
          variant="primary"
          onClick={() => { toggleCommentBox() }}
          disabled={disableMode}
        >
          Add comment
        </Button>
      </OverlayTrigger>
    );
  }

  const commentBox = () => {
    if (containers.length < 1) { return null; }
    if (!deviceDescriptionsStore.analysis_comment_box) { return null; }

    return (
      <Form.Group>
        <Form.Control
          as="textarea"
          style={{ height: '80px' }}
          value={deviceDescription.container.description}
          onChange={(e) => handleCommentTextChange(e)}
          className="my-3"
        />
      </Form.Group>
    );
  }

  const analysisContainer = () => {
    let items = [];

    containers.forEach((container, index) => {
      items.push(
        <Card key={`container_${container.id}`} className={`rounded-0 border-0${index === 0 ? '' : ' border-top'}`}>
          <Card.Header className="rounded-0 p-0 border-bottom-0">
            <AccordionHeaderWithButtons eventKey={container.id}>
              <AnalysisHeader container={container} readonly={readonly} />
            </AccordionHeaderWithButtons>
          </Card.Header>
          {
            !container.is_deleted && mode === 'edit' && (
              <Accordion.Collapse eventKey={container.id}>
                <Card.Body>
                  <ContainerComponent
                    disabled={readonly}
                    readOnly={readonly}
                    templateType="deviceDescription"
                    container={container}
                    onChange={() => handleContainerChanged(container)}
                  />
                  <ViewSpectra
                    sample={deviceDescription}
                    handleSampleChanged={handleSpectraChange}
                    handleSubmit={handleSpectraSubmit}
                  />
                  <NMRiumDisplayer
                    sample={deviceDescription}
                    handleSampleChanged={handleSpectraChange}
                    handleSubmit={handleSpectraSubmit}
                  />
                </Card.Body>
              </Accordion.Collapse>
            )
          }
        </Card>
      );
    });
    return items;
  }

  return (
    <>
      {
        containers.length > 0 ? (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              {modeButton()}
              <ButtonToolbar className="gap-2">
                {commentButton()}
                {addButton()}
              </ButtonToolbar>
            </div>
            {commentBox()}
            {mode === 'edit' ? (
              <Accordion className="border rounded overflow-hidden">
                {analysisContainer()}
              </Accordion>
            ) : (
              <AnalysesSortableContainer
                readonly={readonly}
                key={`analyses-sortable-${container.id}`}
              />
            )}
          </div>
        ) : (
          <div className='d-flex justify-content-between align-items-center'>
            <p className='m-0'>There are currently no Analyses.</p>
            {addButton()}
          </div>
        )
      }
    </>
  );
}

export default observer(AnalysesContainer);
