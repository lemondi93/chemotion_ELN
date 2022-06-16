var e=Object.defineProperty,f=(e,t)=>()=>(e&&(t=e(e=0)),t),d=(t,i)=>{for(var s in i)e(t,s,{get:i[s],enumerable:!0})},t={};d(t,{default:()=>i});var i,s=f((()=>{i=async function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[{}];return Array.isArray(e)||(e=[e]),new Promise(((t,i)=>{let s=document.createElement("input");s.type="file";let o=[...e.map((e=>e.mimeTypes||[])).join(),e.map((e=>e.extensions||[])).join()].join();s.multiple=e[0].multiple||!1,s.accept=o||"";let a=e=>{"function"==typeof r&&r(),t(e)},r=e[0].legacySetup&&e[0].legacySetup(a,(()=>r(i)),s);s.addEventListener("change",(()=>{a(s.multiple?Array.from(s.files):s.files[0])})),s.click()}))}})),o={};d(o,{default:()=>c});var r,c,u=f((()=>{r=async e=>{let t=await e.getFile();return t.handle=e,t},c=async function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[{}];Array.isArray(e)||(e=[e]);let t=[];e.forEach(((e,i)=>{t[i]={description:e.description||"",accept:{}},e.mimeTypes?e.mimeTypes.map((s=>{t[i].accept[s]=e.extensions||[]})):t[i].accept["*/*"]=e.extensions||[]}));let i=await window.showOpenFilePicker({id:e[0].id,startIn:e[0].startIn,types:t,multiple:e[0].multiple||!1,excludeAcceptAllOption:e[0].excludeAcceptAllOption||!1}),s=await Promise.all(i.map(r));return e[0].multiple?s:s[0]}})),p={};d(p,{default:()=>m});var m,v=f((()=>{m=async function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:[{}];return Array.isArray(e)||(e=[e]),e[0].recursive=e[0].recursive||!1,new Promise(((t,i)=>{let s=document.createElement("input");s.type="file",s.webkitdirectory=!0;let n=e=>{"function"==typeof o&&o(),t(e)},o=e[0].legacySetup&&e[0].legacySetup(n,(()=>o(i)),s);s.addEventListener("change",(()=>{let t=Array.from(s.files);e[0].recursive?e[0].recursive&&e[0].skipDirectory&&(t=t.filter((t=>t.webkitRelativePath.split("/").every((t=>!e[0].skipDirectory({name:t,kind:"directory"})))))):t=t.filter((e=>2===e.webkitRelativePath.split("/").length)),n(t)})),s.click()}))}})),g={};d(g,{default:()=>y});var h,y,w=f((()=>{h=async function(e,t){let i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:e.name,s=arguments.length>3?arguments[3]:void 0,o=[],r=[];for await(let c of e.values()){let u="".concat(i,"/").concat(c.name);"file"===c.kind?r.push(c.getFile().then((t=>(t.directoryHandle=e,t.handle=c,Object.defineProperty(t,"webkitRelativePath",{configurable:!0,enumerable:!0,get:()=>u}))))):"directory"===c.kind&&t&&(!s||!s(c))&&o.push(h(c,t,u,s))}return[...(await Promise.all(o)).flat(),...await Promise.all(r)]},y=async function(){let e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};e.recursive=e.recursive||!1;let t=await window.showDirectoryPicker({id:e.id,startIn:e.startIn});return h(t,e.recursive,void 0,e.skipDirectory)}})),b={};async function $(e,t){let i=e.getReader(),s=new ReadableStream({start:e=>async function a(){return i.read().then((t=>{let{done:i,value:s}=t;if(!i)return e.enqueue(s),a();e.close()}))}()}),o=new Response(s);return i.releaseLock(),new Blob([await o.blob()],{type:t})}d(b,{default:()=>A});var A,P=f((()=>{A=async function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};Array.isArray(t)&&(t=t[0]);let i=document.createElement("a"),s=e;"body"in e&&(s=await $(e.body,e.headers.get("content-type"))),i.download=t.fileName||"Untitled",i.href=URL.createObjectURL(s);let l=()=>o(reject),n=()=>{"function"==typeof o&&o()},o=t.legacySetup&&t.legacySetup(n,l,i);return i.addEventListener("click",(()=>{setTimeout((()=>URL.revokeObjectURL(i.href)),3e4),n()})),i.click(),null}})),S={};d(S,{default:()=>x});var x,k=f((()=>{x=async function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[{}],i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,s=arguments.length>3&&void 0!==arguments[3]&&arguments[3];Array.isArray(t)||(t=[t]),t[0].fileName=t[0].fileName||"Untitled";let o=[];if(t.forEach(((t,i)=>{o[i]={description:t.description||"",accept:{}},t.mimeTypes?(0===i&&(e.type?t.mimeTypes.push(e.type):e.headers&&e.headers.get("content-type")&&t.mimeTypes.push(e.headers.get("content-type"))),t.mimeTypes.map((e=>{o[i].accept[e]=t.extensions||[]}))):e.type&&(o[i].accept[e.type]=t.extensions||[])})),i)try{await i.getFile()}catch(e){if(i=null,s)throw e}let r=i||await window.showSaveFilePicker({suggestedName:t[0].fileName,id:t[0].id,startIn:t[0].startIn,types:o,excludeAcceptAllOption:t[0].excludeAcceptAllOption||!1}),c=await r.createWritable();return"stream"in e?(await e.stream().pipeTo(c),r):"body"in e?(await e.body.pipeTo(c),r):(await c.write(blob),await c.close(),r)}})),E=(()=>{if("undefined"==typeof self)return!1;if("top"in self&&self!==top)try{top.location}catch{return!1}else if("showOpenFilePicker"in self)return"showOpenFilePicker";return!1})(),O=E?Promise.resolve().then((()=>(u(),o))):Promise.resolve().then((()=>(s(),t)));E?Promise.resolve().then((()=>(w(),g))):Promise.resolve().then((()=>(v(),p)));var I=E?Promise.resolve().then((()=>(k(),S))):Promise.resolve().then((()=>(P(),b)));async function C(){return(await I).default(...arguments)}
// @license © 2020 Google LLC. Licensed under the Apache License, Version 2.0.
const T="opensave";let j=null;const loadExtensionTranslation=async function(e){let t;const i=e.configObj.pref("lang");try{t=await function __variableDynamicImportRuntime0__(e){switch(e){case"./locale/en.js":return Promise.resolve().then((function(){return L}));case"./locale/fr.js":return Promise.resolve().then((function(){return N}));case"./locale/zh-CN.js":return Promise.resolve().then((function(){return D}));default:return new Promise((function(t,i){("function"==typeof queueMicrotask?queueMicrotask:setTimeout)(i.bind(null,new Error("Unknown variable dynamic import: "+e)))}))}}("./locale/".concat(i,".js"))}catch(e){console.warn("Missing translation (".concat(i,") for ").concat(T," - using 'en'")),t=await Promise.resolve().then((function(){return L}))}e.i18next.addResourceBundle(i,"translation",t.default,!0,!0)};var R={name:T,async init(e){const t=this,{svgCanvas:i}=t,{$id:s,$click:o}=i;await loadExtensionTranslation(t);const importImage=e=>{s("se-prompt-dialog").title=this.i18next.t("notification.loadingImage"),s("se-prompt-dialog").setAttribute("close",!1),e.stopPropagation(),e.preventDefault();const t="drop"===e.type?e.dataTransfer.files[0]:e.currentTarget.files[0];if(!t)return void s("se-prompt-dialog").setAttribute("close",!0);if(!t.type.includes("image"))return;let i;t.type.includes("svg")?(i=new FileReader,i.onloadend=e=>{const t=this.svgCanvas.importSvgString(e.target.result,!0);this.svgCanvas.alignSelectedElements("m","page"),this.svgCanvas.alignSelectedElements("c","page"),this.svgCanvas.selectOnly([t]),s("se-prompt-dialog").setAttribute("close",!0)},i.readAsText(t)):(i=new FileReader,i.onloadend=function(e){let{target:{result:t}}=e;const insertNewImage=(e,i)=>{const o=this.svgCanvas.addSVGElementsFromJson({element:"image",attr:{x:0,y:0,width:e,height:i,id:this.svgCanvas.getNextId(),style:"pointer-events:inherit"}});this.svgCanvas.setHref(o,t),this.svgCanvas.selectOnly([o]),this.svgCanvas.alignSelectedElements("m","page"),this.svgCanvas.alignSelectedElements("c","page"),this.topPanel.updateContextPanel(),s("se-prompt-dialog").setAttribute("close",!0)};let i=100,o=100;const r=new Image;r.style.opacity=0,r.addEventListener("load",(()=>{i=r.offsetWidth||r.naturalWidth||r.width,o=r.offsetHeight||r.naturalHeight||r.height,insertNewImage(i,o)})),r.src=t},i.readAsDataURL(t))},r=document.createElement("input");r.type="file",r.addEventListener("change",importImage),this.workarea.addEventListener("drop",importImage);const clickClear=async function(){const[e,i]=t.configObj.curConfig.dimensions;"Cancel"!==await seConfirm(t.i18next.t("notification.QwantToClear"))&&(t.leftPanel.clickSelect(),t.svgCanvas.clear(),t.svgCanvas.setResolution(e,i),t.updateCanvas(!0),t.zoomImage(),t.layersPanel.populateLayers(),t.topPanel.updateContextPanel(),t.topPanel.updateTitle("untitled.svg"),t.svgCanvas.runExtensions("onNewDocument"))},clickOpen=async function(){if("Cancel"!==await t.openPrep()){i.clear();try{const e=await async function _(){return(await O).default(...arguments)}({mimeTypes:["image/*"]}),i=await e.text();await t.loadSvgString(i),t.updateCanvas(),j=e.handle,t.topPanel.updateTitle(e.name),t.svgCanvas.runExtensions("onOpenedDocument",{name:e.name,lastModified:e.lastModified,size:e.size,type:e.type})}catch(e){if("AbortError"!==e.name)return console.error(e)}}},clickSave=async function(e){if("open"===s("se-svg-editor-dialog").getAttribute("dialog"))t.saveSourceEditor();else{const s={images:t.configObj.pref("img_save"),round_digits:6};if(i.clearSelection(),s){const e=i.mergeDeep(i.getSvgOption(),s);for(const[t,s]of Object.entries(e))i.setSvgOption(t,s)}i.setSvgOption("apply",!0);const o='<?xml version="1.0"?>\n'+i.svgCanvasToString(),r=function(e){let t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"",i=arguments.length>2&&void 0!==arguments[2]?arguments[2]:512;const s=atob(e),o=[];for(let e=0;e<s.length;e+=i){const t=s.slice(e,e+i),r=new Array(t.length);for(let e=0;e<t.length;e++)r[e]=t.charCodeAt(e);const c=new Uint8Array(r);o.push(c)}return new Blob(o,{type:t})}(i.encode64(o),"image/svg+xml");try{if("save"===e&&null!==j){const e=!1;j=await C(r,{fileName:"untitled.svg",extensions:[".svg"]},j,e)}else j=await C(r,{fileName:t.title,extensions:[".svg"]});t.topPanel.updateTitle(j.name),i.runExtensions("onSavedDocument",{name:j.name,kind:j.kind})}catch(e){if("AbortError"!==e.name)return console.error(e)}}};return{name:t.i18next.t("".concat(T,":name")),callback(){i.insertChildAtIndex(s("main_button"),'\n        <se-menu-item id="tool_clear" label="opensave.new_doc" shortcut="N" src="new.svg"></se-menu-item>',0);i.insertChildAtIndex(s("main_button"),'<se-menu-item id="tool_open" label="opensave.open_image_doc" src="open.svg"></se-menu-item>',1);i.insertChildAtIndex(s("main_button"),'<se-menu-item id="tool_save" label="opensave.save_doc" shortcut="S" src="saveImg.svg"></se-menu-item>',2);i.insertChildAtIndex(s("main_button"),'<se-menu-item id="tool_save_as" label="opensave.save_as_doc" src="saveImg.svg"></se-menu-item>',3);i.insertChildAtIndex(s("main_button"),'<se-menu-item id="tool_import" label="tools.import_doc" src="importImg.svg"></se-menu-item>',4),o(s("tool_clear"),clickClear.bind(this)),o(s("tool_open"),clickOpen.bind(this)),o(s("tool_save"),clickSave.bind(this,"save")),o(s("tool_save_as"),clickSave.bind(this,"saveas")),o(s("tool_import"),(()=>r.click()))}}}},L=Object.freeze({__proto__:null,default:{opensave:{new_doc:"New Image",open_image_doc:"Open SVG",save_doc:"Save SVG",save_as_doc:"Save as SVG"}}}),N=Object.freeze({__proto__:null,default:{opensave:{new_doc:"Nouvelle image",open_image_doc:"Ouvrir le SVG",save_doc:"Enregistrer l'image",save_as_doc:"Enregistrer en tant qu'image"}}}),D=Object.freeze({__proto__:null,default:{opensave:{new_doc:"新图片",open_image_doc:"打开 SVG",save_doc:"保存图像",save_as_doc:"另存为图像"}}});export{R as default};
//# sourceMappingURL=ext-opensave.js.map
