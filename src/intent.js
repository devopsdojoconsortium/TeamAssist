import {ENTER_KEY} from './uiConfig';
import {validRoutes} from './menuRoutes';
import {benchMark} from './frpHelpers';
import debounce from 'xstream/extra/debounce';


function filterRoute (location) {
  benchMark("Start on changeRoute$ Intent", true)
  const rArr = location.split("/");
  const outArr = []
  let lastR = ""
  let obj = validRoutes;
  rArr.forEach((r) => {
    if (r.match(/pane_\w+/))
      outArr.push(r.split(/_/))
    else if ((obj && obj[r] && r !== "meta") || lastR === "id"){
      obj = obj[r];
      outArr.push(r);
      lastR = r
    }
  })
  // console.log('rteArray:', outArr);
  return outArr.length ? outArr : ["home"];
}

// THE INTENT FOR THE LIST
export default function intent (DOM, history) {

  return {
    // THE ROUTE STREAM
    // A stream that provides the path whenever the route changes.
    changeRoute$: history
      .map(location => {
        console.log('location:', location)
        return location
      })
      .map(i => i.pathname)
      .distinctUntilChanged()
      .map(filterRoute).filter(r => !!r),

    // A stream of clicks on divs/cells that don't change route.
    clickBlock$: DOM.select('.mClick').events('click')
      .map(ev => {
        ev.stopPropagation()
        return {
          id: ev.ownerTarget.id,
          val: Object.keys(ev.ownerTarget.attributes).reduce((acc, i) => {
            acc[ev.ownerTarget.attributes[i].name] = ev.ownerTarget.attributes[i].value
            return acc
          }, {}),
          pos: { pageY: ev.pageY, clickY: ev.clientY, clickX: ev.clientX}
        }
      }),

    // A stream of text values updating instantly
    formFilterKeyUp$: DOM.select('.tFilterInput').events('keyup').compose(debounce(400))
      .filter(x => x.keyCode !== ENTER_KEY)
      .map(ev => {
        benchMark("Start on formValChange$ Intent", true)
        return { name: ev.target.name, value: ev.target.value }
      }),

    formValChange$: DOM.select('.keyInput').events('change')
      .filter(x => x.keyCode !== ENTER_KEY)
      .map(ev => {
        benchMark("Start on formValChange$ Intent", true)
        return { name: ev.target.name, value: ev.target.value }
      }),
    textAreaValChange$: DOM.select('.keyTAInput').events('input')
      .filter(x => x.keyCode !== ENTER_KEY)
      .map(ev => {
        benchMark("Start on textAreaValChange$ Intent", true)
        return { name: ev.target.name, value: ev.target.value, textarea: true }
      }),

    // A stream of form submissions.
    formSubmit$: DOM.select('.formSubmit').events('submit', { preventDefault: true })
      .map(ev => ev.srcElement.elements),

    // SELECT LIST (DD) onChange STREAM
    // A stream of filterChange changes used for tableDefault filters and Page controls.
    filterOnChange$: DOM.select('.filterChange').events('change')
      .map(ev => ({ name: ev.target.name, idx: ev.target.selectedIndex, val: ev.target[ev.target.selectedIndex].value })),

  };
}
