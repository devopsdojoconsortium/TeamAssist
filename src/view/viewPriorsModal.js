import {h} from '@cycle/dom';
import { minToDateFormat } from '../frpHelpers';
import markdownRender from './viewMarkdownRender';

export default function priorsModal (listObj, coachObj) { 
  return {
    params: { 
      modalPos: {
        left: 220,
        width: 640
      }
    },
    retView: h('div', 
      listObj.map(e => h('div.cellDiv', [ 
        markdownRender(e.val),
        h('small', minToDateFormat(e.asOfStamp || e.eStamp, "MM/DD/YY HH:mm")),
        h('small', e.user && coachObj[e.user] ? " | " + coachObj[e.user] :
        (e.user ? " | " + e.user : ""))              
      ]))
    )      
  }
}
