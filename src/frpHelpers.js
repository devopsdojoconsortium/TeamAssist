import moment from 'moment'
import murmur from 'murmur';
const frp = { benchMarks: [] };

// replaces $.expand which would always clone a new obj
// if you start with an {}, you will get a clean clone (no mutation) ONLY if there are no nested objects as prop vals!
const mutate = function () {
  const obj = arguments[0] || {}; // start it up if undef
  for (let i = 1; i < arguments.length; i++) {
    const inObj = arguments[i];
    for (const key in inObj) {
      if (inObj.hasOwnProperty(key)) {
        obj[key] = inObj[key];
      }
    }
  }
  return obj;
};

// returns only new property changes on n objs against first arg, including empty. NON-Deep
// if you start with an {}, then it is close to a clone
const updatedDiff = function () {
  const firstObj = arguments[0] || {}; // start it up if undef
  const outObj = {}
  for (let i = 1; i < arguments.length; i++) {
    const inObj = arguments[i];
    for (const key in inObj) {
      if (inObj.hasOwnProperty(key) && inObj[key] !== firstObj[key] && (inObj[key] || firstObj[key])) {
        outObj[key] = inObj[key];
      }
    }
  }
  return outObj;
};

// returns immutable obj with specified fields excluded
const trimObjExcl = function (inObj, propArr){
  const obj = {};
  for (const key in inObj) {
    if (inObj.hasOwnProperty(key) && !propArr.some(s => s === key)) {
      obj[key] = inObj[key];
    }
  }
  return obj;
}

// returns limited, unmutated object from input obj
const trimObj = function (inObj, propArr = []){
  const obj = {};
  for (let i = 0; i < propArr.length; i++) {
    const key = propArr[i];
    obj[key] = inObj[key];
  }
  return obj;
}

const extend = function (from, to) {
  if (from === null || typeof from !== "object") return from;
  if (from.constructor !== Object && from.constructor !== Array) return from;
  if (from.constructor === Date || from.constructor === RegExp || from.constructor === Function ||
        from.constructor === String || from.constructor === Number || from.constructor === Boolean)
    return new from.constructor(from);
  to = to || new from.constructor();
  for (const name in from)    {
    to[name] = typeof to[name] === "undefined" ? extend(from[name], null) : to[name];
  }
  return to;
}

const benchMark = function (marker, log){
  if (global.process) // mocha/node true, will bail. FOR devtools filtering out: /^(?!.*performan)/
    return
  const nowTime = new Date().getTime(); // performance.now();
  if (marker.match("Start") || frp.benchMarks.length < 1) // use "Start" in marker string at keynav level to reset timer.
    frp.benchMarks  = [{point: marker, time: nowTime}];
  else {
    const last = frp.benchMarks [frp.benchMarks .length - 1];
    frp.benchMarks .push({point: marker, time: nowTime, since: (nowTime - last.time), accum: (nowTime - frp.benchMarks [0].time) });
  }
    //  log = false;
  if (log === "all")
    console.warn('performanceTime.all', frp.benchMarks);
  else if (log)
    console.warn('performanceTime.last', frp.benchMarks [frp.benchMarks .length - 1]);

  return frp.benchMarks [frp.benchMarks .length - 1];
};

const range = function (start, end) {
  if (!end) { end = start; start = 0; }
  return Array(end - start).join(0).split(0).map((val, id) => id + start);
}
// normalize format soon with testing
function untilUniq (idSeed, stateObjSub = {}){
  const id = murmur.hash128(idSeed).hex()
  let outId = id.substring(0, 6)
  while (stateObjSub[outId]){
    console.log('stateObjSub[outId], outId, id', stateObjSub[outId], outId, id)
    outId = id.substring(0, (outId.length + 1))
  }
  return outId
}

const makeWeeks = function (startingMonth, weeksOut = 13){
  const offset = (startingMonth || 0) * 4
  return range(-1 + offset, offset + weeksOut).map(w => {
    const val = moment().day("Monday").add(w, "w")
    return {
      dKey: "Mon" + val.format("YYYYMMDD"), label: val.format("MMM Do"), tdStyle: "schedCell",
      typeCell: "schWeek", title: "Week of Monday, " + val.format("MMM Do YYYY")
    }
  })
}

const dateFormat = function (fromNow, pad) {
    // date.getMonth() + 1) + '/' + date.getDate() + '/' +  date.getFullYear());
  const day = new Date(); // today
  if (fromNow) // offset
    day.setDate(day.getDate() + fromNow);
  let dd = day.getDate();
  let mm = day.getMonth() + 1; // January is 0!
  const yyyy = day.getFullYear();
  dd = pad && dd < 10 ? '0' + dd : dd;
  mm = pad && mm < 10 ? '0' + mm : mm;
  return mm + '/' + dd + '/' + yyyy;
}

// date format from 
const minToDateFormat = function (minStamp, format) {
  const ms = minStamp * 60000
  if (!ms || isNaN(ms))
    return ""
  let date = moment(ms)
  if (format && format.match(/h/i))
    date = moment(ms)
  // console.log('moment(seconds):::::::::', date.format(), date.format("YYYY-MM-DD"))
  return date.format(format)
}

// get a UTC minute integer from a date or now
const makeMinStamp = function (input, format, inclTime) {
  let m, d, y, h, min
  input = input ? input.trim() : input
  if (format === "y-m-d")
    [y, m, d] = input.split("-")
  else if (format === "m/d/y")
    [m, d, y] = input.split("/")
  else if (format === "utc")
    [y, m, d, h, min] = input.split(/\D+/)
  if (format && y && m && d){
    y = y.length === 2 ? "20" + y : y
    m = m - 1
    if (inclTime && (isNaN(h) || isNaN(min))){
      const dt = new Date()
      h = isNaN(h) ? dt.getHours() : h
      min = isNaN(min) ? dt.getMinutes() : min
    }
    // console.log('[y, m, d, h, min]', input, [y, m, d, h, min])
    return Math.floor(moment([y, m, d, (h || 0), (min || 0), 0]).format('x') / 60000) || ""
  }
  if (format) // no val in
    return undefined
  return Math.floor(Date.now() / 60000)
}

// BELOW NOT USED YET, BUT under consideration !!...

// current val + difference will be checked agianst length and columns to give any cardinal keyNav a good result.
const focusBounds = function (focus, diff, arrayLength, cols){
  cols = (isNaN(cols)) ? 1 : cols;
  let newSel = focus + diff;
  console.log(' newSel', focus, diff, "lenNoff", arrayLength, cols, (arrayLength % cols));
  if (newSel < 0 && focus >= cols)
    while (newSel < 0)
      newSel = newSel + cols;
  else if (newSel >= arrayLength && focus < arrayLength - (arrayLength % cols)){
    while (newSel >= arrayLength){
            // console.log(' odd 0 ', newSel, focus, cols, (focus % cols), (arrayLength % cols));
      newSel = (focus % cols >= arrayLength % cols && arrayLength % cols > 0)
                ? arrayLength - 1 : newSel - cols;
    }
    newSel = (newSel < focus) ? focus : newSel; // when +1 and %==0, keeps from row wrap
  }
  else if (newSel < 0 || newSel >= arrayLength)
    return focus; // no change. Handle noop below as needed.
  return newSel;
};

/**
 * @PublicMethod intentKeyFilter
 * Cleans up the obj and its properties and sets the values to null
 */
const intentKeyFilter = function (actions, keyCode) {
  return actions
    .filter(function (act) {
      if (act.numberEntry) {
            // act.keys = [ Platform.Keys.key0, Platform.Keys.key1, Platform.Keys.key2, Platform.Keys.key3, Platform.Keys.key4, Platform.Keys.key5, Platform.Keys.key6, Platform.Keys.key7, Platform.Keys.key8, Platform.Keys.key9 ];
        act.amounts = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
      }
      return act.keys.some(function (key, idx) { // .some() is like php's inArray, retuning true.
        act.keyIdx = idx; // this allows .some() to be like Perl's until().
        return key === keyCode;
      })
    })
    .map(function (matchedAction) {
      if (matchedAction.amounts)
        matchedAction.val = matchedAction.amounts[matchedAction.keyIdx];
      console.log('========================= INTENT key action =======================> ', matchedAction);
      return { go: matchedAction.go, val: matchedAction.val, key: keyCode };
    })[0];
}

export {mutate, updatedDiff, trimObjExcl, trimObj, extend, benchMark, untilUniq, makeMinStamp, 
  makeWeeks, minToDateFormat, range, dateFormat, focusBounds, intentKeyFilter};
