import {h} from '@cycle/dom';
import { minToDateFormat } from '../frpHelpers';
import markdownRender from './viewMarkdownRender';

export default function exportModal (vd, coachObj) { 

  let url = "http://localhost:4000/excel/" + (vd.modalObj.tab || "teams") + "?"
  if (vd.modalObj.tab && vd.modalObj.urlIds.length) { // selected for custom tab
    url += "teamIds=" + vd.modalObj.urlIds.join(",") + "&tabName=" + vd.modalObj.tabName.trim().replace(/\W+/, "+")
  }
  let retView = vd.modalObj.field ? // fix toggle issue and we are golden
    h('iframe', { props: { 
      name: "exportFrame",
      width: "628px", 
      height: "800px", 
      src: url + "&events=" + vd.modalObj.events,
      scrolling: "yes" },
      style: { background: "#f4f5f7" }
    }) :
    h('div', [
      h('h3', "Would you like to include the following " + vd.list.length + " records as an additional Excel tab?" ),
      h('div', "(This will match the current filter and sorted view)"),
      h('div.formRow', h('input.keyInput', { props: {name: "tabName", type: "text", placeholder: "name of tab"} })),
      h('br'),
      h('div.formRow', h('button#modal_export_custom.mClick.formBtn', "Yes, include a custom tab in my export")),
      h('hr'),
      h('div.formRow', h('button#modal_export_go.mClick.formBtn', "No, just a simple export of team records"))
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
