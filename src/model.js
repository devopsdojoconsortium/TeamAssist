import {Observable} from 'rxjs/Observable';
import rxHelpers from './rxHelpers';
import {mutate, updatedDiff, trimObjExcl, trimObj, extend,
  benchMark, makeMinStamp, range, untilUniq, makeWeeks} from './frpHelpers';
import {validRoutes} from './menuRoutes';
import {tableConfig} from './tableViewConfig';
import {makeStoreFriendlyObj, translateTeamTSV, customEventTweak} from './dataTranslation';
import murmur from 'murmur';
import moment from 'moment';
import uuidFn from 'uuid/v4';
import Cookie from 'js-cookie';
import * as Config from './uiConfig';
// import {deserialize} from './storage-source';
// import serialize from './storage-sink';
import {defaultdisplayObj} from './storage-source';
// a quick commit check
// global model objects.
const eventStore = {};
const listStore = {};
const stateObj = {};
let latestKeyHash = "";
const minEvents = 200;

function determineStreamPaging (markers) {
  if (markers.latest)
    return "/" + (markers.latest + 1) + "/forward/" + minEvents
  return "/head/backward/" + minEvents
}

function readReq (svcObj, delayBy, header) {
  console.log("readReq (svcObj ::::::::: ", svcObj);
  if (delayBy) {
    Observable.empty().startWith("Empty").delay(delayBy).subscribe(function () {
      serviceEmitter$.emit("service", mutate(svcObj, { authHeader: (header || "Accept:application/json") }));
    });
  }
  else
    serviceEmitter$.emit("service", mutate(svcObj, { authHeader: (header || "Accept:application/json") }));
}

function getWebService (svc) {
  // cache check first against stream in listStore
  const listKey = "stream_" + svc.req.hstream;
  const lsObj = getlsObj(listKey);
  if (isCacheNotTimedOut(lsObj, 1) && svc.stateReady !== "buildState" && !svc.noCache && !svc.postData) {
    latestKeyHash = svc.resProp === "main" ? murmur.hash128(listKey).hex() : latestKeyHash;
    console.log('SERVING from cachedData array, NOT processed ES response', lsObj.cachedData);
    return [ { svc: svc, s: svc.req.hstream, data: { rows: lsObj.cachedData } } ];
  }

  const preTagMap = { teams: "c_" } // change AFTER a restream!
  const pageStr = svc.postData ? "" : (svc.pagingUrl || determineStreamPaging(lsObj))
  const stream = (svc.req.noPreTag ? "" : (preTagMap[svc.req.hstream] || "b_")) + svc.req.hstream + pageStr +
    (svc.postData ? "" : svc.req.href || "?embed=tryharder"); // hstream + path additions
  const eventStoreUrl = Config.getEventStoreUrl(stream);

  // for future projections calls
  // let params = mutate({ pagesize: 500 }, svc.req.params);
  // url += "?" + Object.keys(params).map(p => p + "=" + encodeURIComponent(params[p]) ).join("&");

  return rxHelpers.getJSON(eventStoreUrl, svc.postData, svc.blockKeys, svc.authHeader)
    .onErrorResumeNext(Observable.empty()).flatMap(function (data) {
      console.log("Data from Webservice : ", data);
      benchMark('getWebService return on ' +  stream, true);
      data.rows = updateEventStore(data, listKey, svc);
      return [ { svc: svc, u: stream, fromES: eventStoreUrl, data: data } ]; // return service obj and data...
    });
}

// Updates listStore cache and incoming raw ES Events
function updateEventStore (ajaxResult, listKey, svc) {
  let ilist = []
  let idList
  const pKey = svc.req.pKey || "eId";
  const sKey = svc.req.hstream;
  const keyHash = murmur.hash128(listKey).hex()
  latestKeyHash = svc.resProp === "main" ? keyHash : latestKeyHash;
  if (!eventStore[sKey])
    eventStore[sKey] = {};
  const lsObj = listStore[keyHash] || { latest: 0 };
    // STREAMS RESULTS ==> full result with data fld from embed=tryharder
  if (ajaxResult && ajaxResult.entries && ajaxResult.entries[0] && ajaxResult.entries[0].data) {
    lsObj.last = lsObj.latest;
    ajaxResult.entries.forEach(function (itemObj, idx) {
      lsObj.oldest = itemObj.eventNumber < lsObj.oldest || isNaN(lsObj.oldest) ?
        itemObj.eventNumber : lsObj.oldest;
      let dObj = itemObj.data ? JSON.parse(itemObj.data) : {};
      dObj = mutate(dObj, { eId: "e" + itemObj.eventNumber, eventType: itemObj.eventType });
      // console.log('dObj::idx, Event Num', listKey, idx, dObj.eId);
      const pId = dObj[pKey] || "pk_" + idx;
      if (eventStore[sKey][pId])
        console.error("THIS eventStore Obj SHOULD NEVER RE-Process", sKey, "->", pId, eventStore[sKey][pId])
      // DATA recovery..  if(listKey !== "stream_teams" || itemObj.eventNumber < 1124){
        eventStore[sKey][pId] = makeStoreFriendlyObj(pId, dObj, eventStore[sKey], sKey); // this updates the Store if fresh!
        ilist.push(pId);
        lsObj.latest = lsObj.latest > itemObj.eventNumber ? lsObj.latest : itemObj.eventNumber        
      // }
    });
    if (ajaxResult.eTag) {
      lsObj.last = lsObj.latest;
      lsObj.latest = Number(ajaxResult.eTag.replace(/\;.+/, ""));
      if (lsObj.oldest){ // hit again to get to 0
        serviceEmitter$.emit("service", { pagingUrl: "/0/forward/" + lsObj.oldest,
          req: svc.req, authHeader: "Accept:application/json", subCnt: svc.subCnt, resProp: svc.resProp, stateReady: "buildState" });
      }
    }
    else if (!ajaxResult.headOfStream && !svc.pagingUrl)
      serviceEmitter$.emit("service", { req: svc.req, authHeader: "Accept:application/json",
        resProp: svc.resProp, stateReady: "buildState" });

    listStore[keyHash] = mutate(lsObj, {
      minuteStamp: Date.now() / 60000,
      listKey: listKey
    });

    idList = buildStateObj(stateObj, eventStore, sKey, listStore[keyHash])
  }
  // for empties to pass through from no new stream bits...
  else if (ajaxResult && ajaxResult.entries && ajaxResult.entries.length === 0){
    console.log('no new events in ' + sKey + ' stream after eId: ' + lsObj.latest)
    listStore[keyHash] = mutate(lsObj, { minuteStamp: Date.now() / 60000 });
    return lsObj.cachedData
  }
  // form dd builders bypass...
  else if (ajaxResult && svc.req.rowKey && ajaxResult[svc.req.rowKey]){
    const listObj = svc.req.rowKey === "rows" ? ajaxResult.rows[0].VHO : ajaxResult[svc.req.rowKey];
    ilist = [{ k: "", v: "All " + svc.req.name + "s " }];
    listObj.forEach(function (itemObj, idx) {
      const pId = itemObj[pKey] || "pk_" + idx;
      const val = svc.req.nameKey && itemObj[svc.req.nameKey] ? itemObj[svc.req.nameKey] : pId;
      ilist.push( { k: pId, v: val } );
    });
    return ilist;
  }

  console.log('updateEventStore Complete on "' + listKey + '", UPDATING EVENTSTORE:', eventStore);
  console.log('listStore updated keyHash: ' + keyHash, Object.keys(listStore), listStore[keyHash]);
// console.log("uniqueStoreVals::::", uniqueStoreVals); // tmp to track cumulative special properties
  return idList || ilist;
}

function buildStateObj (stateObj, eventStore, sKey, lsObj) {
  if (lsObj.oldest) // still retrieving
    return [{ partial: lsObj.oldest }] // wsUpdate can noop from this
  const eObjs = eventStore[sKey]
  let idList = lsObj.cachedData ? lsObj.cachedData.reverse() : []
  stateObj[sKey] = stateObj[sKey] || {}
  let idx = lsObj.lastState ? lsObj.lastState + 1 : 0 // lastIdx will be for catch up slice markers.
  const [sKeyRoot, singleID] = sKey.split("_") // sKeyRoot ignore
  while (idx <= lsObj.latest){
    const e = eObjs["e" + idx]
    if (e && e.id){ // teams and other extended aggregates marked by an 'id' prop
      const epast = stateObj[sKey][e.id] ? (stateObj[sKey][e.id].priors || []) : [];
      if (stateObj[sKey][e.id]){
        epast.push( stateObj[sKey][e.id].eId)
        idList = idList.filter(x => x !== e.id)
      }
      stateObj[sKey][e.id] = stateObj[sKey][e.id] ? mutate({}, stateObj[sKey][e.id], e, {priors: epast}) : e;
      if (!e.asOfStamp) // asOf only relevant to state if nothing came without it later
        delete stateObj[sKey][e.id].asOfStamp
      // stateKillers for virtual deletion flags
      if (sKey === "schedule" && e.whenStamp < 300000) // deleted sched items are sent to 1970
        delete stateObj[sKey][e.id]
      else if (e.statusDELETE || e.deleted) // deleted team. Put in SYSADMIN bypass here to restore enablement.
        delete stateObj[sKey][e.id]
      else
        idList.push(e.id) // keeps list build sorted by event# sequence
      // console.log("idx .. e:", e.id, stateObj[sKey][e.id].priors, "!==", idx)
    }
    else if (e && singleID){ // singlar ID streams like session_
      idList = [singleID] // keeps list of one intact
      stateObj[sKey] = stateObj[sKey] ? mutate({}, stateObj[sKey], e) : e;
      if (!e.asOfStamp) // asOf only relevant to state if nothing came without it later
        delete stateObj[sKey].asOfStamp
      // console.log("idx .. e:", e.id, stateObj[sKey][e.id].priors, "!==", idx)
    }
    else
        console.error("Events skipped from stateObj !!!", idx)
    idx++
  }
  console.log(sKey, ' === sKey of stateObj !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! ', stateObj[sKey]);
  lsObj.lastState = lsObj.latest
  lsObj.cachedData = idList.reverse()
  return lsObj.cachedData
}

function getlsObj (key) {
  const keyHash = murmur.hash128(key).hex();
  if (listStore[keyHash]) {
    console.log('Retrieved lsObj from ' + key + ": " + keyHash, listStore[keyHash]);
    return listStore[keyHash];
  }
  return {};
}

function isCacheNotTimedOut (lsObj, minutesCache) {
  minutesCache = parseInt(minutesCache) || 30; // default 30 mins.
  if (lsObj.minuteStamp && lsObj.minuteStamp + minutesCache > Date.now() / 60000) {
    console.log('Cache has not expired for: ' + lsObj.listKey);
    return true;
  }
  return false;
}

// expand each storeList item mapped here to its full object for displayObj
function loadStoreObject (rteKey, pKeys) {
  // console.log('rteKey, pKeys', stateObj, rteKey, pKeys);
  return stateObj[rteKey] ? pKeys.map(pk => stateObj[rteKey][pk]) : [];
}

function formEventPost (obj, idSeed, actionType = "generic", asOfStamp, postStream = "teams"){
  // tmp... most arguments can be substituted into the obj props, and it is accommodated AND trimmed
  idSeed = idSeed || obj.idSeed
  if (!obj.id && idSeed)
    obj.id = untilUniq(idSeed, stateObj[obj.postStream || postStream])
  if (asOfStamp)
    obj.asOfStamp = asOfStamp
  return {
    "eventId": uuidFn(),
    "eventType": obj.actionType || actionType,
    "data": mutate(trimObjExcl(obj, ["eId", "eventType", "actionType", "postStream", "idSeed"]), {
      "eStamp": obj.eStamp || makeMinStamp()
    }),
    "metadata": {"$causationId" : obj.user, "$correlationId" : obj.id}
  }
}

function getMenu (dO, route){
  const obj = mutate({}, validRoutes);
  // let routeLast = route.slice(-1)[0]; // get last in route
  const menuObj = getMenuRecurse(obj, route, dO, 0, []);
  return { list: menuObj[0], tabs: menuObj[1] };
}

function getMenuRecurse (obj, route, dO, depth, tabs){
  const tmpitems = [];
  const mItems = Object.keys(obj);
  const sel = route[depth];
  mItems.forEach((mi) => {
    // console.log( "menuRECURSE!! ", depth, mi, obj[mi], tabs, route, dO.rteObj.meta.pageKey);
    if (["meta", "id", "permissions"].some(s => s === mi) || !obj[mi].meta ||
      (obj[mi].meta.menuLevel > dO.session.loginLevel)){
      //  console.log("bail out over obj[mi].meta.menuLevel > dO.session.loginLevel OR? ON: ", mi)
    }
    else if (obj[mi].meta.tabPage && tabs.length) {
      tabs.push({ key: mi, name: obj[mi].meta.name, color: obj[mi].meta.color || "" });
      // console.log( "tabs.push ", obj[mi]);
    }
    else if (!obj[mi].meta.tabPage) {
      const tmpObj = { key: mi, name: (obj[mi].meta.menuName || obj[mi].meta.name)};
      if (mi === sel) { // mark it and recurse!
        tmpObj.sel = true;
        if (obj[mi].meta.primeTab && mi === dO.rteObj.meta.pageKey)
          tabs.push({ key: "", name: obj[mi].meta.primeTab, color: obj[mi].meta.color || "" })
        if (obj[mi])
          tmpObj.list = getMenuRecurse( obj[mi], route, dO, (depth + 1), tabs)[0];
      }
      tmpitems.push( tmpObj )
    }
  });
  return [tmpitems, tabs];
}

function validateForm (displayObj, fAct, formConfig) {
  const fConf = (formConfig || displayObj.rteObj.meta.formConfig).find(i => i.name === fAct.name);
  if (!fConf)
    return displayObj.formObj.errors;
  if (fConf.req === "email" && !fAct.value.match(/^\S+\@\S+\.\S+$/)){
    displayObj.formObj.errors[fAct.name] = "Email required in proper format"
  }
  else if (!isNaN(fConf.req) && fConf.req > fAct.value.length){ // length check
    displayObj.formObj.errors[fAct.name] = "Minimum Length is " + fConf.req + " characters"
  }
  else if (fConf.req && !fAct.value){ // not empty check
    displayObj.formObj.errors[fAct.name] = fConf.req
  }
  else
    delete displayObj.formObj.errors[fAct.name]

  // console.log('VALIDATION... fAct, fConf, formConfig', fAct, fConf, formConfig, displayObj.formObj.errors)

  return displayObj.formObj.errors;
}

function formAccessGate (formConfig, loginLevel){
  // console.log('formAccessGate.', loginLevel, formConfig[3])
  // return formConfig
  return formConfig.filter(x => !x.accessLevel ||
    x.accessLevel <= loginLevel).map(fc => {
      if (fc.sessValFilter && fc.opts[0])
        return mutate(fc, { opts: fc.opts.filter((x, i) => i <= loginLevel) })
      return fc
    })
}

function makeResultList (displayObj, rows, rowKey = "list"){
  const offset = Number(displayObj.tRowCntrl.filterOffset) || 0;
  const ender = Number(displayObj.settings.pageLimit) + offset;
  const meta = displayObj.rteObj.meta;
  let listObj = loadStoreObject(meta.hstream, rows);
  const tmpFilterArr = Object.keys(displayObj.tRowCntrl).filter(x => x !== "filterOffset" && x !== "sort");
  const rteFilterArr = meta.hardFilt ? Object.keys(meta.hardFilt) : [];
  const setsFilterArr = Object.keys(displayObj.settings).filter(x => x !== "pageLimit");
  let hardFiltCountException = 0
  if (tmpFilterArr.length || rteFilterArr.length || setsFilterArr.length)
    listObj = listObj.filter(x => {
      let include = 1;
      rteFilterArr.forEach(rfKey => { // from menuRoutes config
        const rfArr = meta.hardFilt[rfKey]
        if (!rfArr.some(s => s == x[rfKey] || (s === "null" && !x[rfKey]))){ // ignore == lint warning
          hardFiltCountException++
          include = 0
        }
        // console.log('!rfArr.some(s ======', rfArr, rfKey, x[rfKey], x, include);
      });
      setsFilterArr.forEach(sfKey => { // from displayObj.settings ... denoting session/global persistent
        const sfArr = displayObj.settings[sfKey]
        if (include && sfArr.length && typeof sfArr === 'object' && !sfArr.some(s => s === x[sfKey])) {
          hardFiltCountException++
          include = 0
          // console.log('!sfArr.some(s ======', sfArr, sfKey, x[sfKey], typeof sfArr);
        }
      });
      tmpFilterArr.forEach(f => {
        if (f === "keyWord" && meta.tableParams.filtersPage && meta.tableParams.filtersPage.searchCol) {
          const re = new RegExp(displayObj.tRowCntrl[f], 'i')
          include = (meta.tableParams.filtersPage.searchCol.some(s => x[s] && x[s].match(re)))
        }
        else if (x[f] && displayObj.tRowCntrl[f] && x[f] !== displayObj.tRowCntrl[f])
          include = 0
        else if (!x[f] && displayObj.tRowCntrl[f] && !["cellDiv", "keyWord"].some(s => s === f))
          include = 0
        // console.log('f, x', f, x, include);
      });
      return include;
    });
  console.log('offset, ender, listObj.length, rows.length', offset, ender, listObj.length, rows.length);

  return {
    [rowKey]: sortBy(displayObj, listObj).slice(offset, ender),
    totRows: { [rowKey]: (rows.length - hardFiltCountException)}
  }
}

// Sort By
function sortBy (displayObj, listObj) {
  const sortArr = displayObj.tRowCntrl.sort
  if (!sortArr || sortArr.length < 1)
    return listObj
  const blankFldList = [], sortableList = []
  const so = sortArr[0] 
  const so2 = sortArr[1] || {}
  listObj.forEach(f => {
    if (!f[so.fld] || (isNaN(f[so.fld]) && !f[so.fld].trim()))
      blankFldList.push(f)
    else
      sortableList.push(f)
  })
  const resToggle = so.dir === "asc" ? 1 : -1
  const resToggle2 = so2.dir === "asc" ? 1 : -1

  return sortableList.sort((a, b) => {
    const aVal = isNaN(a[so.fld]) ? a[so.fld] && a[so.fld].trim().toLowerCase() : a[so.fld]
    const bVal = isNaN(b[so.fld]) ? b[so.fld] && b[so.fld].trim().toLowerCase() : b[so.fld]
    // console.log("sort((a, b) ON so.fld: " + so.fld + so.dir, a.project, aVal, bVal)
    if (aVal === bVal){
      const aVal2 = isNaN(a[so2.fld]) ? a[so2.fld] && a[so2.fld].trim().toLowerCase() : a[so2.fld]
      const bVal2 = isNaN(b[so2.fld]) ? b[so2.fld] && b[so2.fld].trim().toLowerCase() : b[so2.fld]
      // console.log("=== sort((a, b) ON so2.fld: " + so2.fld + so2.dir, aVal2, bVal2)
      return (aVal2 > bVal2 ? resToggle2 : (aVal2 === bVal2 ? 0 : resToggle2 * -1))
    }
    return (aVal > bVal ? resToggle : (resToggle * -1))
  }).concat(blankFldList)
}

function getRteObj (route, level){
  // let obj = validRoutes;
  let obj = extend(validRoutes);
  route.forEach(r => {
    if (typeof r === "object") // intent will keep this props safe (pane_ only allowed at this point)
      obj.meta[r[0]] = r[1]
    else if (r === "id"){
      const idMeta = mutate({}, obj.meta, obj[r].meta, { pageKey: r + "_id" });
      obj.selectedId = route[route.length - 1]
      // const selObj = stateObj[idMeta.hstream] ? (stateObj[idMeta.hstream][selId] || {}) : {}

      if (idMeta.formConfig && idMeta.additionalFormConfig && idMeta.additionalFormConfig.length) {
        const arr = []
        const foundX = []
        idMeta.formConfig.forEach(i => {
          const altEle = idMeta.additionalFormConfig.find((f, idx) => {
            if (f.name === i.name){
              foundX.push(idx)
              return true
            }
            return false
          })
          if (!altEle || altEle.type !== "remove")
            arr.push(altEle || i)
        })
        const moreEles = idMeta.additionalFormConfig.filter((x, idx) => !foundX.some(s => s === idx))
        idMeta.formConfig = arr.concat(...moreEles)
      }
      if (idMeta.formConfig)
        idMeta.formConfig = formAccessGate(idMeta.formConfig, level)

      return mutate(obj, { meta: idMeta })
    }
    else if (obj[r]){
      const meta = mutate(obj[r].meta, {
        pageKey: (obj[r].meta.tabPage && obj.meta ? obj.meta.pageKey : r),
        routeKey: r,
        routeChain: route,
        parentName: (obj.meta ? obj.meta.name : ""),
        tableParams: tableConfig[r] || {}
      });
      if (meta.tableParams.filtersPage && !meta.tableParams.filtersPage.specialRange)
        meta.tableParams.filtersPage.specialRange = [25, 50, 100, 150]; // set to default
      if (meta.tableParams.cloneParams){
        meta.tableParams = mutate(meta.tableParams, extend(tableConfig[meta.tableParams.cloneParams]));
        if (meta.tableParams.addCols)
          meta.tableParams.addCols.forEach(ac => meta.tableParams.cols.push(ac) );
        if (meta.tableParams.remCols && typeof meta.tableParams.remCols === "object")
          meta.tableParams.cols = meta.tableParams.cols.filter(x => !meta.tableParams.remCols.some(s => x.dKey === s) );
        if (meta.tableParams.replaceProps)
          Object.keys(meta.tableParams.replaceProps).forEach(rp => meta.tableParams[rp] = meta.tableParams.replaceProps[rp])
      }
      if (meta.formConfig && meta.formConfig.some(s => s.accessLevel || s.sessValFilter))
        meta.formConfig = formAccessGate(meta.formConfig, level)

      obj = mutate(obj[r], { meta: meta });
    }
  });
  // console.log('rteObj and route', validRoutes, tableConfig.verification, route);
  if (obj.meta.name){
    return obj;
  }
  return false;
}

function userLacksPermissions (displayObj){
  if (displayObj.rteObj.selectedId === displayObj.session.uid || !displayObj.session.uid)
    return false;
  if (displayObj.session.loginLevel < displayObj.rteObj.meta.menuLevel)
    return true;
  return false;
}

function displayByRoute (route, displayObj, tweakHist){

  const lastMeta = extend(displayObj.rteObj.meta)
  displayObj.returnRte = lastMeta.formConfig ? (displayObj.returnRte || ["home"]) :
    lastMeta.routeChain || ["home"] // simplify all this after MVP1

  route = route === "same" ? displayObj.rteObj.meta.routeChain : route
  console.log("displayByRoute location", route, tweakHist, lastMeta, displayObj.returnRte)
  const rteObj = getRteObj(route, displayObj.session.loginLevel);
  displayObj.rteObj = rteObj;
  // block users below authorized for route
  if (userLacksPermissions(displayObj)){
    const reqLevel = Config.loginLevels[rteObj.meta.menuLevel]
    displayObj.rteObj.meta.blockIt = "You must be a " + reqLevel + " to view this route."
  }
  if (tweakHist && lastMeta.routeKey !== rteObj.meta.routeKey){ // simplify all this after MVP1
    console.log("location TWEAKED lastMeta.routeKey !== rteObj.meta.routeKey !!!", lastMeta.routeKey, rteObj.meta.routeKey)
    location.hash = (typeof tweakHist === "object" ? tweakHist.join("/") : (lastMeta.routeChain.join("/") || "home"))
    return mutate(displayObj, (displayObj.cntrl.snd ? {} : {cntrl: {noop: 1}}) );
  }
  displayObj.menu = getMenu(displayObj, route);

  if (!displayObj.session.loginLevel){ // dozjjHcQj50w
    // Cookie.set("ttID", "", { expires: 77 }) // for dev ENV ONLY. Do not commit it setting!
    const cookies = Cookie.get()
    if (cookies.ttID)
      serviceEmitter$.emit("service", { resProp: "getSession", req: {
        hstream: "session_" + cookies.ttID,
        href: "?embed=tryharder",
        noPreTag: true
      }, authHeader: "Accept:application/json" });
    else
      return mutate(displayObj, { rteObj: getRteObj( route[0] === "register" ? route : ["loginScreen"], 0) });
    displayObj.cntrl.loading = 1;
    return mutate(displayObj, {cntrl: {noop: 1}});
  }
  if (rteObj.meta.hstream && displayObj.session.loginLevel){
    serviceEmitter$.emit("service", { resProp: "main", req: rteObj.meta, authHeader: "Accept:application/json" });
    displayObj.cntrl.loading = 1;
    if (rteObj.meta.tableParams.filtersPage)
      displayObj.settings.pageLimit = rteObj.meta.tableParams.filtersPage.specialRange.some(s => {
        return s === Number(displayObj.settings.pageLimit)
      }) ? displayObj.settings.pageLimit : rteObj.meta.tableParams.filtersPage.specialRange[0]
  }
  // selective resets, retention, etc!
  displayObj.list = [];
  displayObj.totRows = {};
  displayObj.modalObj = {};
  displayObj.tRowCntrl = displayObj.tRowCntrl.keyWord && lastMeta.pageKey === displayObj.rteObj.meta.pageKey ?
    { keyWord: displayObj.tRowCntrl.keyWord } : {} // retain within tabs in page
  // whenever we are on a formPanel route, meta has formConfig
  if (rteObj.meta.formConfig){
    if (displayObj.formObj.hstream !== rteObj.meta.hstream ) // new stream for form loses activePane, etc.
      displayObj.formObj = { errors: {}, hstream: rteObj.meta.hstream, activePane: rteObj.meta.pane || "" }
    else if (displayObj.formObj.selId !== rteObj.selectedId) // new record reset
      displayObj.formObj = {
        errors: {},
        selId: rteObj.selectedId,
        activePane: rteObj.meta.pane || displayObj.formObj.activePane,
      }
  }
  return displayObj;
}

function changedOnlyProps (id, streamName, stateObj, formObj, keepers = []){
  keepers = mutate(trimObj(formObj, keepers), { id: id })
  if (id && stateObj[streamName])
    return mutate(updatedDiff(stateObj[streamName][id], formObj), keepers)
  return formObj;
}

const serviceEmitter$ = new rxHelpers.customEmitter();
const serviceListener$ = serviceEmitter$.listen("service");

// MAKE MODIFICATION STREAM
// A function that takes the actions passed from intent
// and returns a stream of functions that expect displayObj (the data model)
// and return a modified version of the data.
function makeModification$ (actions) {
  // onChange from a tRowCntrl-relevant row filter/pager
  const filterOnChangeMod$ = actions.filterOnChange$.map(action => {
    benchMark('Start filterOnChangeMod$ observer on action response', true);
    return (displayObj) => {
      console.log('action, eventStore[latestKeyHash]', action, latestKeyHash, listStore[latestKeyHash]);
      displayObj.cntrl = {};
      const key = action.name || "x";
      if (key === "filterLimit")
        displayObj.settings.pageLimit = action.val;
      else if (key !== "filterOffset")
        delete displayObj.tRowCntrl.filterOffset;
      if (key !== "filterLimit")
        displayObj.tRowCntrl[key] = action.val;
      delete displayObj.tRowCntrl.cellDiv;

      console.log('displayObj.tRowCntrl, displayObj.settings', displayObj.tRowCntrl, displayObj.settings);
      return mutate(displayObj, makeResultList(displayObj, (listStore[latestKeyHash].cachedData || []) ))
    }
  });

  // update displayObj based on various mClick mouse clicks!
  const clickBlockMod$ = actions.clickBlock$.map(action => {
    benchMark('MODEL: clickBlock$ observer of actions', true);
    return (displayObj) => {
      displayObj.cntrl = {};
      const meta = displayObj.rteObj.meta
      const [setting, key, divId] = action.id.split("_")
      console.log('clickBlock$ -> setting, key, divId, action.val:', setting, key, divId, action.val);
      if (setting === "modal"){ 
        let modal = mutate({}, displayObj.modalObj, action.pos)
        if(key === "priors"){
          const obj = extend(displayObj.rteObj.details || displayObj.list[action.val.idx])
          const pListObj = getEventMapByProperty (obj, meta.hstream, action.val.prop)
          let colObj = {}, footer = ""
          if(divId === "cell") // list view cell click
            colObj = meta.tableParams.cols.find(col => col.dKey === action.val.prop)
          if(divId === "cell" && action.val.prop === "coachNotes") 
            footer = "Weekly reports moved to [Team Detail](#/teams/id/" + obj.id + ")"
          else if(divId === "reports")
            colObj = { label: "Edits on " + action.val.prop }
          modal = mutate(modal, { colObj: colObj, list: pListObj, team: obj.project, footer: footer })
        }
        else if(key === "mdHelp" && displayObj.rteObj.details){
          modal.preview = displayObj.formObj[divId] || displayObj.rteObj.details[divId]
        }
        console.log("MODAL action, modal", action, modal)

        modal.type = ( key === "clear" || modal.type === key) ? "" : key // toggler
        modal.field = divId || "" // for field markup preview tracking
        return mutate(displayObj, { modalObj: modal } )
      }
      if (setting === "setting" && ["ttLoc"].some(s => s === key)){ // ttLoc 1st in array settings update
        const arr = displayObj.settings[key] || []
        const filteredArr = arr.filter(x => x !== divId)
        displayObj.settings[key] = filteredArr.length < arr.length ? filteredArr : arr.concat([divId]);
        // displayObj.tRowCntrl = {};
        if (listStore[latestKeyHash])
          return mutate(displayObj, makeResultList(displayObj, (listStore[latestKeyHash].cachedData || []) ))
      }
      if (setting === "sort" && key){  // [{ dir: "asc", fld: "displayName" }]
        const sortArr = displayObj.tRowCntrl.sort || []
        const already = sortArr.find(f => f.fld === key)
        const filteredArr = sortArr.filter(x => x.fld && x.fld !== key)
        const colObj = meta.tableParams.cols.find(col => col.dKey === key)
        let direction = colObj.sort === "desc" ? "desc" : "asc"
        direction = already && already.dir ? ( already.dir === "asc" ? "desc" : "asc" ) : direction
        displayObj.tRowCntrl.sort = [{ fld: key, dir: direction }]
        if (filteredArr.length)
          displayObj.tRowCntrl.sort.push(filteredArr[0])
        // console.log('filteredArr, colObj, direction, already', filteredArr, colObj, direction, already)
        if (listStore[latestKeyHash])
          return mutate(displayObj, makeResultList(displayObj, (listStore[latestKeyHash].cachedData || []) ))
      }
      else if (setting === "delProp" && displayObj[key] && displayObj[key][divId]){
        delete displayObj[key][divId]
      }
      else if (setting === "formObj" && displayObj[setting]){
        displayObj[setting][key] = divId
        displayObj.cntrl.snd = (action.val.style && action.val.style.match(/270deg/) ? "fore" : "back")
      }
      else if (setting === "mdTmpl" && key){
        const formConfigObj = meta.formConfig.find(cnf => cnf.name === key)
        formConfigObj.rows = formConfigObj.rows >= 20 ? formConfigObj.rows : formConfigObj.rows * 2
        displayObj.formObj[key] = formConfigObj.tmplLoader
        displayObj.cntrl.textAreaVal = { [key]: formConfigObj.tmplLoader } // set here, handle in DOM via Query
      }
      else if (setting === "vsmFrm" && action.val){
        displayObj.settings.vsmObj = mutate(trimObj(action.val, ["mapkey", "pos", "actid"]), { pos: Number(action.val.pos) })
        displayObj.formObj = { errors: {} } // reset
      }
      else if (setting === "timeType"){
        displayObj.formObj[key] = divId === "days" ? "mins" : "days"
      }
      // table cell click operations
      else if (setting === "schFrm" && action.val.prop){
        const teamObj = trimObj(displayObj.list[action.val.idx], ["id"])
        displayObj.tRowCntrl.cellDiv = mutate(trimObj(action.val, ["idx", "prop", "schid"]), teamObj, { frm: setting })
      }
      else if (setting === "setting" && key === "schShift" && action.val){
        const shiftVal = divId === "Prev" ? -1 : 1
        displayObj.settings[key] = displayObj.settings[key] || 0
        displayObj.settings[key] += shiftVal
        let chunkDex = 0
        const colsChunks = [[], []]
        meta.tableParams.cols.forEach(c => {
          if (c.typeCell === "schWeek")
            chunkDex = 1
          else
            colsChunks[chunkDex].push(c)
        })
        meta.tableParams.cols = [...colsChunks[0], ...makeWeeks(displayObj.settings[key]), ...colsChunks[1]]
      }
      return displayObj;
    }
  });
  // keyword searches!
  const formFilterMod$ = actions.formFilterKeyUp$.map(action => {
    benchMark('MODEL: formFilterMod$ observer of actions', true);
    return (displayObj) => {
      displayObj.cntrl = {};
      displayObj.tRowCntrl.keyWord = action.value;
      if (!action.value)
        delete displayObj.tRowCntrl.keyWord
      return mutate(displayObj, makeResultList(displayObj, (listStore[latestKeyHash].cachedData || []) ))
    }
  });

  // track form obj!
  const trackFormVals$ = Observable.merge(actions.formValChange$, actions.textAreaValChange$).map(action => {
    benchMark('MODEL: formValChange$ observer of actions', true);
    // console.log(action)
    return (displayObj) => {
      displayObj.cntrl = {};
      if(action.textarea && displayObj.modalObj.field){
        displayObj.modalObj.preview = action.value
        displayObj.modalObj.field = action.name
      }
      const vsmSettingsObj = displayObj.settings.vsmObj || {}
      displayObj.formObj.errors = validateForm(displayObj, action, 
        vsmSettingsObj.pos === -1 ? displayObj.rteObj.meta.metaFormConfig : "");
      displayObj.formObj[action.name] = action.value
      return displayObj
    }
  });

  // Post an event!
  const formSubmitMod$ = actions.formSubmit$.map(action => {
    benchMark('formSubmit$ observer on action response', true);
    return (displayObj) => {
      displayObj.cntrl = {};
      const vsmSettingsObj = displayObj.settings.vsmObj || {}
      const meta = displayObj.rteObj.meta
      const fConfs = vsmSettingsObj.pos === -1 &&  meta.metaFormConfig ? meta.metaFormConfig : 
        meta.formConfig.filter(x => !x.pane);
      fConfs.forEach(f => {
        displayObj.formObj.errors = validateForm(displayObj, { name: f.name, value: action[f.name].value }, fConfs);
      })
      if (action.bulkJson){
        // const bulkObj = translateBulkTeamJson(action.bulkJson.value, stateObj[meta.hstream])
        const bulkObj = translateTeamTSV(action.bulkJson.value, stateObj[meta.hstream])
        console.log('bulkObj', bulkObj)
        // bulkObj.errors = "hold on for a min"
        if (bulkObj.errors)
          displayObj.formObj.errors.bulkJson = bulkObj.errors
        else {
          const asOfStamp = action.importDate.value ? makeMinStamp(action.importDate.value, "y-m-d") : ""
          serviceEmitter$.emit("service", {
            resProp: "EventCreated",
            req: { hstream: (meta.hstream) },
            postData: bulkObj.map(i => formEventPost(i, "", meta.pageKey + "Updated", asOfStamp)),
            authHeader: "Content-Type:application/vnd.eventstore.events+json"
          });
          return displayObj;
        }
      }
      if (action.restreamType){
        const restreamType = action.restreamType.value
        if (!restreamType)
          displayObj.formObj.errors.restreamType = "You must select a type!" 
        if (restreamType === "snap" && action.targetEvent.value < 1)
          displayObj.formObj.errors.targetEvent = "Select an event number wisely!"
        if (!action.streamPreTag.value || !action.streamPreTag.value.match(/^\w+_$/))
          displayObj.formObj.errors.streamPreTag = "target preTag must be /\w+_$/ !"
        console.log('action action action action::::::::::', action)
        if (Object.keys(displayObj.formObj.errors).length)
          return displayObj

        let streamPreTag = action.streamPreTag.value
        let postObj = { 
          user: displayObj.session.uid,
          id: restreamType + "At_" + action.targetEvent.value,
        }
        let postArray = []
        if (restreamType === "snap") {
          stateObj[meta.hstream] = {}
          const restreamNum = action.targetEvent.value
          const idList = buildStateObj(stateObj, eventStore, meta.hstream, { latest: restreamNum })
          postObj = mutate(postObj, { 
            stateObjects: stateObj[meta.hstream],
            idList: idList,
            lastEvent: action.targetEvent.value
          })
          postArray.push(formEventPost(postObj, "", meta.hstream + "Snapshotted"))
          streamPreTag = "snap_"
          console.log('state based snap check', stateObj[meta.hstream], idList)
        }
        else if (restreamType === "filter" || restreamType === "custom"){
          const eObjs = eventStore[meta.hstream]
          stateObj.startEnd = {}
          const allObj = { act: action, so: stateObj, es: eventStore }
          const filts = action.filters.value.split(/\D+/).filter(x => x.length).map(i => Number(i))
          for (let i = 0; i < Object.keys(eObjs).length; i++) {
            if (eObjs["e" + i] && !filts.some(s => s === i))
              postArray.push(formEventPost(customEventTweak(eObjs["e" + i], restreamType, allObj, i)))
            else 
              console.log("filtered on: e", i, " in:", filts)
          }
          console.log('stateObj.startEnd', stateObj.startEnd)
        }
        if (Object.keys(displayObj.formObj.errors).length)
          return displayObj

        serviceEmitter$.emit("service", {
          resProp: "stateRestreamCreated",
          req: { hstream: streamPreTag + meta.hstream, noPreTag: true },
          postData: postArray.filter(x => x.eventId),
          // safety SWITCH!!  authHeader: "Content-Type:application/vnd.eventstore.events+json"
        });
        return displayObj; // no alert div from ctrl{} yet.
      }
      // build formObj for post
      const arrOfPosts = [] // if formObjs are pushed to this, use instead of single
      const keys = fConfs.map(i => i.name)
      let postStream = (meta.postStream || meta.hstream)
        + (meta.postStream && meta.postStream.match(/_$/) ? displayObj.rteObj.selectedId : "")
      let formObj = fConfs.reduce((acc, fo) => {
        const k = fo.name
        acc[k] = fo.type.match(/^date/) ? makeMinStamp(action[k].value, "utc") : action[k].value
        if ((action[k].type === "checkbox" || action[k].type === "radio") && !action[k].checked)
          acc[k] = ""
        if (fo.journal && !action[k].value && displayObj.rteObj.details && displayObj.rteObj.details[k])
          acc[k] = displayObj.rteObj.details[k]
        // console.log("makeFormObj->" + k, action[k].value, acc[k])
        return acc
      }, {})
      // console.log('formObj displayObj.session', extend({}, formObj), action, displayObj.session);
      // new vs mod
      let idSeed = meta.pageKey === meta.routeKey ? formObj[keys[0]] : "" // VERY temp
      if (formObj.forkProject && formObj.forkProject.length){
        idSeed = formObj.forkProject
        formObj = mutate(trimObj(formObj, ["contactName", "color", "keyCoach"]), {
          parentId: displayObj.rteObj.details.id,
          project: formObj.project.replace(/\s+\(.+/, "") + " -- " + formObj.forkProject,
          salesNotes: "Created from Project: " + formObj.project,
          status: "lead"
        })
      }
      else if (meta.sessPropForId && displayObj.session[meta.sessPropForId]){
        formObj.id = displayObj.session[meta.sessPropForId] // non-hashed for eid
        // idSeed = displayObj.session[meta.sessPropForId]  // hash method for any other stream
        formObj = mutate(formObj, trimObj(displayObj.session, ["loginLevel", "loginName", "email", "employeeId", "eid"]))
      }
      if (meta.makeSess){ // post on login or register forms
        if(formObj.password2 && formObj.password2 !== formObj.password || formObj.password.length < 8)
          displayObj.formObj.errors.password = "Passwords do not match or are shorter than 8 strong characters"
        else if (!Object.keys(displayObj.formObj.errors).length) {
          const sessId = formObj.eid + "Y" + murmur.hash128(formObj.eid + "__" + formObj.password).hex()
          postStream = "session_" + sessId
          idSeed = ""
          formObj.user = displayObj.session.uid = formObj.eid
          Cookie.set("ttID", sessId, { expires: 77 })          
        }
        formObj = trimObjExcl(formObj, ["password", "password2"])
      }
      if (meta.postStream === "schedule" && displayObj.tRowCntrl.cellDiv){
        const cellObj = displayObj.tRowCntrl.cellDiv
        const schedObj = { tid: cellObj.id, actionType: "SchedItemCreated" }
        schedObj.id = cellObj.schid ? cellObj.schid : cellObj.id + "_" + cellObj.prop + "_" + formObj.whenStamp
        if (action.deleteIt && action.deleteIt.value && action.deleteIt.checked)
          formObj.whenStamp = 0
        const widStamp = moment.unix(formObj.whenStamp * 60).day("Monday").format("YYYY-MM-DD")
        schedObj.wid = "Mon" + moment(widStamp).format("YYYYMMDD")
        if (schedObj.spreadRight > 0)
          schedObj.counter =  1
        schedObj.user = displayObj.session.uid
        const schPost = changedOnlyProps(schedObj.id, meta.postStream, stateObj, mutate(schedObj, formObj), ["user"])
        if (Object.keys(schPost).length < 4) // actionType, id and user are baseline.
          return displayObj;
        arrOfPosts.push(schPost)
        schPost.commitment = schPost.commitment || "committed"
        if (schedObj.spreadRight > 0){
          range(1, Number(schedObj.spreadRight) + 1).forEach(w => {
            const spreadObj = extend(trimObjExcl(schedObj, ["spreadRight"]))
            console.log("spreadObj, spreadObj, spreadObj, ", spreadObj)
            spreadObj.wid = "Mon" + moment(widStamp).add(w, "w").format("YYYYMMDD")
            spreadObj.id = schedObj.id + "_" + (w + 1)
            spreadObj.counter = (w + 1)
            spreadObj.childOf = schedObj.id
            spreadObj.whenStamp = schedObj.whenStamp + (w * 7 * 24 * 60)
            arrOfPosts.push( changedOnlyProps(spreadObj.id, meta.postStream, stateObj, spreadObj, ["user"]) )
          })
        }
        // console.log("schedule POST!!! arrOfPosts, schedObj, formObj", arrOfPosts, schedObj, formObj)
        // adding a team start-stop post as well if chall and commit === committed
        if (formObj.schType === "chall" && schPost.commitment === "committed") {
          const schedDatesState = Object.keys(stateObj.schedule || {})
            .map(k => stateObj.schedule[k])
            .filter(x => x.tid === schedObj.tid && x.schType === "chall")
            .reduce((acc, i) => {
              acc[i.id] = i
              return acc
            }, {})
          console.log('schedDatesState', schedDatesState)
          arrOfPosts.forEach(p => { // mutate in whatever was posted
            schedDatesState[p.id] = mutate(schedDatesState[p.id], p)
            if(schedDatesState[p.id].whenStamp < 300000) // deleted sched items excluded
              delete schedDatesState[p.id]
          })
          const schedDates = Object.keys(schedDatesState)  
            .map(k => schedDatesState[k])
            .reduce((acc, i) => {
              acc.m_start = acc.m_start < i.whenStamp ? acc.m_start : i.whenStamp
              acc.m_end = acc.m_end > i.whenStamp ? acc.m_end : i.whenStamp
              return acc
            }, { m_start: 999999999999990, m_end: 0 })
          schedDates.end = parseInt(moment.unix(schedDates.m_end * 60).day("Friday").unix() / 60)
          const teamObj = stateObj.teams[schedObj.tid] // do not mutate, just for if statement
          console.log('schedDates, teamObj ', schedDates, teamObj)
          if(schedDates.m_start !== teamObj.challengeStartDate || schedDates.end !== teamObj.challengeEndDate){

            Observable.empty().startWith("Empty").delay(1800).subscribe(function () {
              serviceEmitter$.emit("service", {
                resProp: "EventCreated",
                req: { hstream: "teams" },
                postData: [ formEventPost( {
                  id: schedObj.tid,
                  user: displayObj.session.uid,
                  challengeEndDate: schedDates.end,
                  challengeStartDate: schedDates.m_start
                }, "", "teamStartEndUpdated") ],
                authHeader: "Content-Type:application/vnd.eventstore.events+json"
              });
            });
          }
        }

      }
      if (meta.postStream === "vsm_"){
        const stepObj = displayObj.settings.vsmObj
        const postObj = {  actionType: "VsmActionCreated" }
        postObj.id = stepObj.actid ? stepObj.actid : "m" + untilUniq( moment().format(), stateObj[postStream])
        if (stepObj.pos === -1)
          postObj.id = "meta_" + stepObj.mapkey
        if (action.deleteIt && action.deleteIt.value && action.deleteIt.checked)
          postObj.deleted = 1
        postObj.user = displayObj.session.uid
        const vsmPost = changedOnlyProps(postObj.id, postStream, stateObj, mutate(postObj, formObj), ["user"])
        if (Object.keys(vsmPost).length < 4) //  id and user are baseline.
          displayObj.formObj.errors.name = "No fields were changed!"
        if (formObj.pTime && formObj.lTime) {
          vsmPost.ltCalc = Number(formObj.lTime) / (formObj.lTimeType === "mins" ? 480 : 1)
          vsmPost.ptCalc = Number(formObj.pTime) / (formObj.pTimeType === "mins" ? 480 : 1)
          if (vsmPost.ptCalc > vsmPost.ltCalc)
            displayObj.formObj.errors.lTime = "Process Time > Lead Time"
        }  
        if (Object.keys(displayObj.formObj.errors).length)
          return displayObj;
        arrOfPosts.push(vsmPost)
        // adjust meta key with array
        postObj.pctAcc = postObj.pctAcc || 1
        const vsmObj = displayObj.sub1 || { maps: {}, meta_current: {}}
        vsmObj.maps = vsmObj.maps && vsmObj.maps.ord ? vsmObj.maps : { ord: []}
        const meta = vsmObj["meta_" + stepObj.mapkey] || {}
        const ord = meta.ord || []
        if(stepObj.actid && postObj.deleted)
          arrOfPosts.push( mutate(trimObj(postObj, ["user", "actionType"]), {
            id: "meta_" + stepObj.mapkey,
            deletes: meta.deletes + 1,
            ord: ord.filter(x => x !== postObj.id)
          }) )
        else if(!stepObj.actid && stepObj.pos > -1){
          // console.log("ADDACT!!! ", postObj, ord, stepObj)
          let newArr = []
          ord.forEach((i, idx) => {
            if(Number(stepObj.pos) === idx)
              newArr.push(postObj.id)
            newArr.push(i)
          })
          arrOfPosts.push( mutate(trimObj(postObj, ["user", "actionType"]), {
            id: "meta_" + stepObj.mapkey,
            ord: stepObj.pos >= ord.length ? ord.concat(postObj.id) : newArr
            // ord: stepObj.pos >= ord.length ? ord.concat(postObj.id) : ord.splice(stepObj.pos, 0, postObj.id)
          }) )
        }
        if(vsmObj.maps.ord.indexOf(stepObj.mapkey) === -1){
          arrOfPosts.push( mutate(trimObj(postObj, ["user", "actionType"]), {
            id: "maps",
            ord: vsmObj.maps.ord.concat(stepObj.mapkey)
          }) )
        }

        console.log("vsmPOST!!! vsmPost, arrOfPosts, postObj, stepObj", vsmPost, arrOfPosts, postObj, stepObj)

      }
      else if (!idSeed && !meta.makeSess)
        formObj.id = meta.routeChain[meta.routeChain.length - 1]
      const actionType = meta.routeKey + (idSeed ? "_Created" : "_Updated")
      const changedOnly = changedOnlyProps(formObj.id, meta.hstream, stateObj, formObj)
      if (Object.keys(changedOnly).length < 2) // id is always there.
        displayObj.formObj.errors.submit = "No fields were changed!"
      else
        delete displayObj.formObj.errors.submit
      // console.log('changedOnly, formObj, displayObj.formObj, action', changedOnly, formObj, displayObj.formObj, action);
      if (Object.keys(displayObj.formObj.errors).length)
        return displayObj;
      displayObj.formObj = { errors: {} } // reset
      displayObj.cntrl.loading = 1;

      serviceEmitter$.emit("service", {
        resProp: "EventCreated",
        req: { hstream: (postStream || meta.hstream || "oopsStream"), noPreTag: postStream.match(/session_/) },
        postData: arrOfPosts.length ? arrOfPosts.map(i => formEventPost(i))
          : [formEventPost(mutate(changedOnly, {
            id: formObj.id,
            user: displayObj.session.uid
          }), idSeed, actionType)],
        authHeader: "Content-Type:application/vnd.eventstore.events+json"
      });

      return displayObj;
    }
  });

  // valid url change
  const changeRouteMod$ = actions.changeRoute$.map(route => {
    return (displayObj) => {
      displayObj.cntrl = {};
      return displayByRoute(route, displayObj)
    }
  });

// listens to all API responses.
  const wsUpdate$ = serviceListener$.debounceTime(60).flatMap(getWebService).map( results => {
    benchMark('wsUpdate$ observer on ' + results.svc.req.hstream + ' response', true);
    return (displayObj) => {
      displayObj.cntrl = {};
      console.log('wsUpdate$ results:::::::::::', results);
      const doKey = results.svc.subCnt ? results.svc.resProp : "list";
      const req = results.svc.req;
      const meta = displayObj.rteObj.meta
      if (results.data.rows && !results.data.error && results.data.rows[0] && results.data.rows[0].partial)
        return mutate(displayObj, {cntrl: {noop: 1}}) // partials
      if (results.svc.req.subUrl){ // call again for nest chain of multi-calls per route change.
        const idStream = results.svc.req.subUrl.hstream === "vsm_" ? (displayObj.rteObj.selectedId || "") : ""
        results.svc.req.subUrl.hstream += idStream
        const subCnt = results.svc.subCnt ? results.svc.subCnt + 1 : 1;
        readReq({ resProp: "sub" + subCnt, subCnt: subCnt, req: results.svc.req.subUrl}, 200)
      }
      else if (results.svc.resProp === "EventCreated"){
        displayObj[doKey] = [
          { errorMessage: "Event Created" }
        ];
        const post = results.svc.postData && results.svc.postData[0].data || {}
        if (req.hstream.match(/session_/) && post.eid){ // Login or register
          displayObj = displayByRoute(displayObj.returnRte, displayObj, ["home"])
          return displayObj 
        }
        if (req.hstream === "users" && post.levelSought){ // new user record created
          displayObj = displayByRoute(["users", "modUser", "id", post.id], displayObj)
          return mutate(displayObj, {cntrl: {snd: "gong"}})
        }
        if (req.hstream === "users" && post.id === displayObj.session.uid){ // Updated own, so update session!
          displayObj.session = mutate(displayObj.session, post)
          displayObj.cntrl.snd = "chime2"
          if (displayObj.returnRte[0] === req.hstream)
            readReq({ resProp: "main", noCache: true, req: { hstream: req.hstream }}, 900)
          return displayByRoute(displayObj.returnRte, displayObj, displayObj.returnRte)
        }
        if (req.hstream === "schedule"){ // sched updated. return to same
          displayObj.cntrl.snd = "glass"
          readReq({ resProp: "sub1", subCnt: 1, noCache: true, req: { hstream: req.hstream } }, 600)
          return displayByRoute(displayObj.returnRte, displayObj, ["schedule", "post" + moment().format('mmss'), post.id])
        }
        if (req.hstream.match("vsm_")){ // vsm updated. return to same
          // console.log('req, post', req, post)
          readReq({ resProp: "sub1", subCnt: 1, noCache: true, req: { hstream: req.hstream } }, 400)
          // return displayByRoute(displayObj.returnRte, displayObj, ["vsm", "id", req.hstream.replace(/\w+_/, "")])
          delete displayObj.settings.vsmObj
          return mutate(displayObj, {cntrl: {snd: "gong"}}) // bass ?
        }
        if (req.hstream === "teams" && post.parentId && post.salesNotes && post.salesNotes.match(/from Project/)){ // CLONE
          displayObj.cntrl.snd = "chime2"
          readReq({ resProp: "main", noCache: true, req: { hstream: req.hstream }}, 900)
          return displayByRoute(displayObj.returnRte, displayObj, ["teams", "modTeam", "id", post.id])
        }
        // refresh same stream with noCache call.
        readReq({ resProp: "main", noCache: true, req: { hstream: req.hstream }}, 900)
        return displayByRoute(displayObj.returnRte, displayObj, displayObj.returnRte)
      }
      else if (results.svc.resProp === "getSession"){
        const ses = stateObj[req.hstream] ?
          trimObjExcl(stateObj[req.hstream], [ "id", "eId", "priors", "eventType"]) : {};
        // ses.loginName = ses.firstName + " " + ses.lastName
        ses.loginLevel = 1
        ses.dataEnv = results.fromES.match(/localhost/) ? "dev" :
          (results.fromES.match(/(119-99-239|teamTrek.ebiz)/) ? "stg" : "dit")
   // console.log('stateObj[req.hstream] && ses', stateObj, req.hstream, ses)
        displayObj.session = mutate(displayObj.session, ses)
        if (displayObj.session.loginName)
          serviceEmitter$.emit("service", { resProp: "getProfile", req: {
            hstream: "users",
            href: "?embed=tryharder",
          }, authHeader: "Accept:application/json" });
        else {          
          Cookie.remove("ttID")
          return mutate(displayObj, { rteObj: getRteObj(["loginScreen"]), formObj: {errors: { password: "invalid login "}} });
        }
          // return displayByRoute(["cookiesBlock"], displayObj)
        return displayObj;
      }
      else if (results.svc.resProp === "getProfile"){
        const hashOfID = displayObj.session.eid
        if (stateObj[req.hstream] && stateObj[req.hstream][hashOfID]){
          const profile = trimObjExcl(stateObj[req.hstream][hashOfID], ["eStamp", "id", "eId", "priors", "eventType"]);
          profile.loginLevel = profile.loginLevel || 1
          stateObj[req.hstream][hashOfID].displayName = profile.displayName || displayObj.session.loginName
          displayObj.session = mutate(displayObj.session, profile, { uid: hashOfID })
          console.log('profile profile profile ::::', profile, req.hstream, hashOfID, displayObj.session.eid)
          if (!profile.ttLoc) // make em say who they are / where they from!
            displayObj = displayByRoute(["users", "modUser", "id", hashOfID], displayObj, true)
          // getRteObj(["users", "modUser", "id", hashOfID], profile.loginLevel)
          // readReq({ resProp: "makeTeamHash", req: { hstream: "teams" }}, 200)
          return mutate(displayByRoute("same", displayObj, "trueLogged"), {cntrl: {snd: "chime", loading: 1}})
        }
        else if (!stateObj[req.hstream]) // REDUND... needs another round to get users stateObj
          return mutate(displayObj, {cntrl: {snd: 1}})
        console.log("hashOfID = displayObj.session.eid", hashOfID, displayObj.session.eid, stateObj[req.hstream][hashOfID])
        return mutate(displayObj, { rteObj: getRteObj(["welcomeLevel"]) });
      }
      else if (results.svc.resProp === "makeTeamHash" && stateObj[req.hstream]){
        displayObj.dynHashes.engagedTeams = Object.keys(stateObj[req.hstream])
          .filter(x => ["imm", "ch", "qual", "cons", "eng"].some(s => s === stateObj[req.hstream][x].status))
          .reduce((acc, i) => {
            acc[i] = stateObj[req.hstream][i].project
            return acc
          }, {})
        return displayObj
      }
      else if (results.svc.resProp === "makeUserHash" && stateObj[req.hstream]){
        const userHashes = Object.keys(stateObj[req.hstream])
          .filter(x => stateObj[req.hstream][x].displayName && stateObj[req.hstream][x].loginLevel > 1)
          .reduce((acc, i) => {
            const uKey = stateObj[req.hstream][i].loginLevel > 2 ? "coachers" : "teamers"
            acc[uKey] = acc[uKey] || {}
            acc[uKey][i] = stateObj[req.hstream][i].displayName
            return acc
          }, {})
        displayObj.dynHashes = mutate(displayObj.dynHashes, userHashes)
        return displayObj
      }
      // main output for list build
      if (results.data && !results.data.error){
        if (results.data.rows && doKey === "list")
          displayObj = mutate(displayObj, makeResultList(displayObj, results.data.rows, doKey))
        else if (results.data.rows){ // subCnt processing
          if (req.hstream === "schedule"){
            displayObj[doKey] = loadStoreObject(req.hstream, results.data.rows).reduce((acc, i) => {
              acc[i.tid] = acc[i.tid] || {}
              acc[i.tid][i.wid] = acc[i.tid][i.wid] ? acc[i.tid][i.wid].concat(i) : [i]
              return acc
            }, {})
          }
          else if (req.hstream.match("vsm_")){
            displayObj[doKey] = loadStoreObject(req.hstream, results.data.rows).reduce((acc, i) => {
              acc[i.id] = i
              return acc
            }, {})
          }
          else if (req.hstream.match(/restream_/)){
            const rteObj = displayObj.rteObj
            displayObj.rteObj.details = { 
              evtData: "Event Count: " + eventStore[rteObj.hstream].length + "\n"
            }
            displayObj.rteObj.details.evtData += "Event Count: " + eventStore[rteObj.hstream].length + "\n"
            // stateObj[req.hstream][displayObj.rteObj.selectedId] || {}
          }
          // console.log("sdsdfsdf", req)
        }
        else {
          displayObj.list = [{ errorMessage: "rows can't be missing!" }]
          displayObj.totRows[doKey] = 0;
          return displayObj
        }
        // make details obj for form
        if (displayObj.rteObj.selectedId && stateObj[meta.hstream]){
          displayObj.rteObj.details = stateObj[meta.hstream][displayObj.rteObj.selectedId] || {}
          if (meta.formConfig && meta.formConfig.some(s => s.journal)){
            const obj = extend(displayObj.rteObj.details)
            const priorKeys = obj.priors ? [obj.eId].concat(obj.priors.reverse()) : [obj.eId]
            const addReports = [] 
            let topReport = 0, splicePoint = 0
            // console.log(" priorKeys priorKeys priorKeys", priorKeys)
            meta.formConfig.forEach((f, idx) => {
              if (f.journal && priorKeys){
                f.journal = priorKeys.map(i => eventStore[meta.hstream][i]).filter(x => x[f.name])
                  .map(res => mutate(trimObj(res, ["eId", "asOfStamp", "eStamp", "user"]), {val: res[f.name]}))
              }
              if(f.name === "weeklyReport6")
                splicePoint =  idx + 1
            })
            const weeklies = Object.keys(displayObj.rteObj.details).filter(x => x.match(/weeklyReport/))
            weeklies.forEach(i => {
              const weekNum = Number(i.replace(/\D+/, ""))
              if(weekNum >= 6)
                topReport = weekNum + 1
            })
            if(topReport){
              range(7, topReport + 1).forEach(num => {
                addReports.push( { 
                  label: "Week " + num + " Report", type: "textarea", 
                  name: "weeklyReport" + num, rows: 4, cols: 72, markDown: true
                } )
              })
              meta.formConfig.splice(splicePoint, 0, ...addReports)
            }
          }
          else if (meta.panelFn === "teamPanel"){
            const obj = extend(displayObj.rteObj.details)
            const keys = Object.keys(obj).filter(x => x.match(/weeklyReport/))
            displayObj.rteObj.details.eMap = {}
            keys.forEach(k => {
              displayObj.rteObj.details.eMap[k] = getEventMapByProperty(obj, meta.hstream, k) // all depth
            })
          }
        }
        if (req.hstream === "users" && results.fromES){ // users need a team DD
          readReq({ resProp: "makeTeamHash", req: { hstream: "teams" }}, 800)
        }
        else if (req.hstream === "teams" && results.fromES){ // teams need a coach DD
          readReq({ resProp: "makeUserHash", req: { hstream: "users" }}, 800)
        }

        /*
        displayObj[doKey] = results.data.rows ? makeResultList(displayObj, results.data.rows)
          : [{ errorMessage: "rows cant be missing!" }];
        displayObj.rteObj.meta.params = displayObj.rteObj.meta.params ? displayObj.rteObj.meta.params : { pagesize: 500 };
        // get these 2 conditions right to get right bypass total counts being wrong, even for mockData.
        if (results.data.rows && displayObj.totRows[doKey] > results.data.rows.length && displayObj.rteObj.meta.params.pagesize > displayObj.totRows[doKey])
          displayObj.totRows[doKey] = results.data.rows.length; // fixes times if total is errantly high
        else if (results.data.rows && results.data.rows.length < results.data.total)
          displayObj.rteObj.meta.params.pagesize = Number(results.data.total) + 100; // mutates meta for route, pagesize increase
        //*/
      }
      else
        displayObj[doKey] = [
          { errorMessage: (results.data.error ? results.data.error + " on: " + results.svc.req.hstream : "unknown error") }
        ];

      return displayObj;
    }
  });

  return Observable.merge(
    wsUpdate$, filterOnChangeMod$, clickBlockMod$, changeRouteMod$, formFilterMod$, trackFormVals$, formSubmitMod$
  );
}

function getEventMapByProperty (obj, stream, prop, depth) {
  const priorKeys = obj.priors ? [obj.eId].concat(obj.priors.reverse()) : [obj.eId]
  return priorKeys
    .map(i => eventStore[stream][i])
    .filter((x, idx) => x[prop] && (!depth || idx < depth))
    .map(res => mutate(trimObj(res, ["eId", "asOfStamp", "eStamp", "user"]), {val: res[prop]}))
}

// startWith data.
function startWithData (defaultdisplayObj, validRoutes) {
  defaultdisplayObj.rteObj = validRoutes.home
  // defaultdisplayObj.menu = getMenu(defaultdisplayObj, 'home');
  return defaultdisplayObj
}

// THIS IS THE MODEL FUNCTION
// It expects the actions coming in from the intent and
// the initial localStorage data.
function model (actions) {
  // THE BUSINESS LOGIC
  // Actions are passed to the `makeModification$` function
  // which creates a stream of modification functions that needs
  // to be applied on the displayObj when an action happens.
  // RETURN THE MODEL DATA
  return  makeModification$ (actions) // startWith() combined with localStorage initial displayObj
    .startWith(startWithData(defaultdisplayObj, validRoutes))
    .scan((displayObj, modFn) => modFn(displayObj))
    .filter(data => !data.cntrl.noop)
    .map(data => {
      console.log('MODEL OUTPUT TO VIEW:', data);
      return data;
    })
}

export {model, getRteObj, validateForm};
