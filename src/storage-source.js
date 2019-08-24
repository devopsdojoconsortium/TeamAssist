function merge () {
  const result = {};
  for (let i = 0; i < arguments.length; i++) {
    const object = arguments[i];
    for (const key in object) {
      if (object.hasOwnProperty(key)) {
        result[key] = object[key];
      }
    }
  }
  return result;
}

const safeJSONParse = str => JSON.parse(str) || {};
const mergeWithDefaultdisplayObj = displayObj => {
  // startWith data...
  return merge(defaultdisplayObj, displayObj);
}

// Take localStorage tRowData stream and transform into
// a JavaScript object. Set default data.
function deserialize (localStorageValue$) {
  return localStorageValue$
    .map(safeJSONParse)
    .map(mergeWithDefaultdisplayObj);
}
const defaultdisplayObj = {
  menu: { list: [] },
  list: [],
  formObj: { errors: {} },
  modalObj: { type: "" },
  rteObj: { meta: {} },
  totRows: { list: 0 },
  tRowCntrl: {},
  dynHashes: {},
  cntrl: { noop: 1 }, // startWith does not need to show to view, as changeRoute will trigger
  session: { 
    loginName: "",
    loginLevel: 0,
  },
  settings: { pageLimit: 50, ttLoc: [] }
};
export {defaultdisplayObj, deserialize }