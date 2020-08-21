import {h} from '@cycle/dom';
import { minToDateFormat } from '../frpHelpers';
import markdownRender from './viewMarkdownRender';

export default function exportModal (vd, coachObj) { 

  let url = "http://localhost:4000/excel/" + (vd.modalObj.tab || "teams")
  let retView = h('div', [
    h('form#exportForm.formSubmit', {
      attrs: { 
        action: url, method: "post",
        target: "excelExportFrame"
      }}, [
      vd.modalObj.urlIds.length ? 
        h('input', { attrs: {name: "teamIds", type: "hidden", value: vd.modalObj.urlIds.join(",")} }) : "",
      h('input', { attrs: {name: "eventCnt", type: "hidden", value: vd.modalObj.eventCnt} }),
      h('input', { attrs: {name: "events", type: "hidden", value: vd.modalObj.events} }),
      h('h3', "By adding a tab name you will include the following " + vd.list.length + " records as an additional Excel tab" ),
      h('div', "(This will match the current filter and sorted view)"),
      h('div.formRow', h('input', { attrs: {name: "tabNameCustom", type: "text", placeholder: "name of tab"} })),
      h('br'),
      h('div.formRow', h('input.formBtn', { attrs: {type: "submit", value: "Generate Excel"}} ))
    ]),
    h('hr'),
    h('iframe', { props: { 
      name: "excelExportFrame",
      width: "600px", 
      height: "200px", 
      frameborder: "11px",
      src: url,
      scrolling: "yes" },
      style: { background: "#f4f5cc" }
    }),
  ])



  return {
    params: { 
      modalPos: {
        left: 220,
        width: 640
      }
    },
    retView: h('div', [
      retView
    ])      
  }
}
