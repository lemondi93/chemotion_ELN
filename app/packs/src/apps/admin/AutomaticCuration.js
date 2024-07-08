import React, { Component, useEffect} from 'react';
import { Grid, Row, Col, Nav, NavItem , Button, Form, FormGroup,ControlLabel,FormControl,HelpBlock} from 'react-bootstrap';
import { a, search } from 'react-dom-factories';
import Dropzone from 'react-dropzone';


export default class DictionaryCuration extends Component  {
    constructor(props) {
        super(props);
        this.saveFile = this.saveFile.bind(this)
        this.handleChangeCustom = this.handleChangeCustom.bind(this);
        this.handleChangeEstablished = this.handleChangeEstablished.bind(this);
        this.handleChangeCustomSearch = this.handleChangeCustomSearch.bind(this)
        this.handleChangeEstablishedSearch = this.handleChangeEstablishedSearch.bind(this)
        this.state = {
            customValue: '',
            establishedValue:"",
            file: null,
            customSearch: "",
            establishedSearch :"",
            affixFile: "",
            affObject : null,
            establishedDictionaryText :"",
            customDictionaryText: ""
        }}

    componentDidMount(){
      var customDictionaryText = ""
      var establishedDictionaryText = ""
      var affixText =""
      fetch("/typojs/custom/custom.dic")
        .then ((res)=> res.text())
        .then((text) => {
          customDictionaryText = text;
          this.setState({customValue : customDictionaryText,
            customDictionaryText : customDictionaryText
          }, () =>{
          });
        })
      fetch("/typojs/en_US/en_US.dic")
        .then ((res)=> res.text())
        .then((text) => {
          establishedDictionaryText = text;
          this.setState({establishedValue : establishedDictionaryText,
            establishedDictionaryText : establishedDictionaryText
          }, () =>{
          });
        })
      fetch("/typojs/en_US/en_US.aff")
        .then ((res)=> res.text())
        .then((text) => {
          affixText = text;
          this.setState({affixFile : affixText}, () =>{
          var affObject = this.convertAffxStrtoObj(affixText)
          this.setState({affObject: affObject})
          });
        })
        // .then(()=>{this.applyAffix()})
    }

    // useEffect(() => {
    //   // here I am guaranteed to get the updated counter
    //   // since I waited for it to change.
    //   console.log(counter);
    //   // here we added counter to the dependency array to
    //   // listen for changes to that state variable.
    // }, [counter])

    // componentDidUpdate(prevState) {
    //   if(this.state.affObject !== prevState ){
    //   this.applyAffix()}
    // }

    convertAffxStrtoObj(affixStr){
      var affixArray =affixStr.split("\n")
      var iArray = []
      var affixObject = {}
      for (var i =0 ; i < affixArray.length; i++){
        var affixLine = affixArray[i]
        if (affixLine.match(/((SFX)|(PFX)) [A-Z] ((Y)|(N)) \d/g)){
          iArray.push(i)
        }
      }
      for (var i =0 ; i < iArray.length; i++){
        var startingLine = (affixArray[iArray[i]])
        var numOfLines = startingLine.match(/\d/).join()
        var affixLetter= startingLine.match(/ [A-Z] /)
        affixLetter[0] = affixLetter[0].replaceAll(" ", "") 
        var affixMap = new Map
        var endingLine = iArray[i] + parseInt(numOfLines)
          for (var j = iArray[i] +1; j <= endingLine; j++){
            var selectedLine = affixArray[j];
            var slicedLine = selectedLine.slice(14,selectedLine.length);
            var splitSlicedLine = slicedLine.split(" ");
            var filteredLine = splitSlicedLine.filter((x)=> x != "" );
            var affix = filteredLine[0]
            var lastChar = filteredLine[1]
            affixMap.set(lastChar, affix)
            affixObject[affixLetter] = [affixMap]
             }
             var sOrP = (startingLine.match(/((SFX)|(PFX))/)[0])
             affixObject[affixLetter].push(sOrP)
          }
      return affixObject
    }

    applyAffix(){
      var dictionaryString = this.state.establishedValue
      var dictionaryArray = dictionaryString.split("\n")
      for(var entry of dictionaryArray){
        entry = entry.replace("!","")
        // console.log(entry)
        if (/\/[A-Z]/.test(entry)){
          var entrySplitArray = entry.split("/")
          var word = entrySplitArray[0]
          var affix = entrySplitArray[1]
          affix = affix.split("")
          var newDictArray = [word]
          newDictArray = newDictArray.concat(this.workWithaffObject(word,affix, this.state.affObject))
          // console.log(newDictArray)

          dictionaryArray[dictionaryArray.indexOf(entry)] = newDictArray
        }
        else{
          // console.log(entry)
        }
      }
      dictionaryArray = dictionaryArray.flat()
      console.log("affix applied")
      dictionaryString = dictionaryArray.join("\n")
      this.setState({establishedDictionaryText: dictionaryString,
        establishedValue: dictionaryString
      })
    }

    workWithaffObject (word, inputAff, affixObject){
    // var word = "leach"
    // var inputAff = ["S","D","G"]
    // var affixObject = this.state.affObject

    var newWordArray = []
    for(var indvidualAff of inputAff){
      var sOrP = affixObject[indvidualAff][1]
      var affMap = affixObject[indvidualAff][0]
      var wordLastChar = word.charAt(word.length-1)
      var affKey = affMap.keys()
      for(var key of affKey){
        const keyRegex = new RegExp(key)
        if (keyRegex.test(wordLastChar)){
          if (sOrP == "SFX"){
            newWordArray.push(word + affMap.get(key))
          }
          else {
            newWordArray.push(affMap.get(key) + word)
          }
        }
        else{
        }
      }
    }
      return (newWordArray)
    }

    handleSearchSubmit(DictionaryText,search,valueState){
      var dictionaryArray = DictionaryText.split("\n")
      var searchTerm = search
      var count = []
      var newDictString =""
      for (var dictEntry of dictionaryArray){
        if (dictEntry.includes(searchTerm)){
          count.push(dictionaryArray.indexOf(dictEntry))
        }
      }
      for (var countValue of count){
        newDictString = newDictString + dictionaryArray[countValue] + "\n"
      }
      if(valueState == "established")  {
        this.setState({establishedValue: newDictString})}
      if(valueState == "custom") {
        this.setState({customValue: newDictString})
      }
    }

    saveFile(){
      var new_dic = this.state.customValue
      new_dic = encodeURIComponent(new_dic)
      console.log(new_dic)
      fetch("http://localhost:3000/api/v1/dictionary/save?new_dic=" + new_dic)
    }

    handleChangeCustom(e) {
      this.setState({ customValue: e.target.value });
    }
    
    handleChangeEstablished(e) {
      this.setState({ establishedValue: e.target.value });
    }

    handleChangeCustomSearch(e) {
      this.setState({ customSearch: e.target.value });
    }

    handleChangeEstablishedSearch(e) {
      this.setState({ establishedSearch: e.target.value });
    }

    handleFileDrop(attach) {
        this.setState({ file: attach[0] });
    }
    
    handleAttachmentRemove() {
        this.setState({ file: null });
    }

    convertDictionaryToArray(custom,established){
      var customArray = custom.split("\n")
      var establishedArray = established.split("\n")
      var newCustomArray = customArray.filter(val => !establishedArray.includes(val));
      var removed_entries = customArray.filter(val => establishedArray.includes(val))
      console.log(removed_entries)
      console.log("finished checking")
      this.setState({customValue: newCustomArray.join("\n")})
    }

    creatDictionaryFromString(){
      var input = 'The Tetrarchy was the administrative division of the Roman Empire instituted by Roman emperor Diocletian in 293 AD, marking the end of the Crisis of the Third Century and the recovery of the Roman Empire. The first phase, sometimes referred to as the Diarchy ("the rule of two"), involved the designation of the general Maximian as co-emperor firstly as Caesar (junior emperor) in 285, followed by his promotion to Augustus in 286. Diocletian took care of matters in the Eastern regions of the Empire while Maximian similarly took charge of the Western regions. In 293, feeling more focus was needed on both civic and military problems, Diocletian, with Maximian\'s consent, expanded the imperial college by appointing two Caesars (one responsible to each Augustus) Galerius and Constantius Chlorus. '
      input = input.replaceAll(" ", "\n")
      input = input.replaceAll(/[\.\,\?\!\(\) \"]/g, "")
      input = input.toLowerCase()
      console.log(input)
    }

    dropzoneOrfilePreview() {
        const { file } = this.state;
        return file ? (
          <div>
            {file.name}
            <Button bsSize="xsmall" bsStyle="danger" onClick={() => this.handleAttachmentRemove()} className="pull-right">
              <i className="fa fa-trash-o" />
            </Button>
          </div>
        ) : (
          <Dropzone
            onDrop={attach => this.handleFileDrop(attach)}
            style={{ height: 50, width: '100%', border: '3px dashed lightgray' }}
            // accept ={".dic"}
            >
            <div style={{ textAlign: 'center', paddingTop: 12, color: 'gray' }}>
              Drop File, or Click to Select.
            </div>
          </Dropzone>
        );
      }

    fileDisplay(){
        let dictionary_variable = "test"
        if (this.state.file === null){
            dictionary_variable = "this.state.file"}
        else(this.state.file.text()
        .then((text) => this.setState({value :text})))}
    
    render() {
        return(
        <div>
            {this.fileDisplay()}
            {this.dropzoneOrfilePreview()}
            <Button onClick={()=> this.convertDictionaryToArray(this.state.customValue,this.state.establishedDictionaryText)}>Check Custom Dictionary</Button>
            <Button onClick={()=> this.saveFile()}>Save dictionary</Button>
            <Button onClick={()=> this.applyAffix()}>load affix</Button>
            <Button onClick={()=> this.creatDictionaryFromString()}>Create dictionary</Button>
            <Row>
              <Col lg={6}>
                  <FormGroup controlId="customDictionary">
                      <ControlLabel>Custom Dictionary
                        <Row>
                          <Col lg={6}>
                            <FormControl
                              type="text"
                              placeholder="Enter Search"
                              onChange={this.handleChangeCustomSearch}/>
                          </Col>
                          <Col lg={5}> <Button onClick={()=> this.handleSearchSubmit(this.state.customDictionaryText,this.state.customSearch,"custom")}>Submit</Button></Col>
                        </Row>
                      </ControlLabel>
                      <FormControl
                          componentClass="textarea"
                          value={this.state.customValue}
                          onChange={this.handleChangeCustom}
                          style={{width: 500, height: 600}}
                      />
                      <FormControl.Feedback />
                  </FormGroup>
                  </Col>
                  <Col lg={6}>
                  <FormGroup controlId="establishedDictionary">
                      <ControlLabel>Established Dictionary
                        <Row>
                          <Col lg={6}>
                            <FormControl
                              type="text"
                              // value={this.state.value}
                              placeholder="Enter Search"
                              onChange={this.handleChangeEstablishedSearch}/>
                          </Col>
                          <Col lg={5}> <Button onClick={()=> this.handleSearchSubmit(this.state.establishedDictionaryText,this.state.establishedSearch,"established")}>Submit</Button></Col>
                        </Row>
                        </ControlLabel>
                      <FormControl
                          componentClass="textarea"
                          value={this.state.establishedValue}
                          onChange={this.handleChangeEstablished}
                          style={{width: 500, height: 600}}
                      />
                      <FormControl.Feedback />
                  </FormGroup>
                  </Col>
                </Row>
            </div>
        )
    }   
}
