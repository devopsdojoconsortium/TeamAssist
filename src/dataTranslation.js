import {mutate, updatedDiff, trimObj, makeMinStamp, untilUniq} from './frpHelpers';
import {teamStatus} from './uiConfig'
import murmur from 'murmur';
import moment from 'moment';
// const uniqueStoreVals = {};

// turn ajaxObj into storeObj that resembles displayObj properties, with added control props.
function makeStoreFriendlyObj (primaryId, itemObj, subStore, type) {
  let itemObjMinutesCache = (type === "isValid") ? -1 : 30;
    // console.log( itemObj );

  if (type === "schedule" && subStore[primaryId] && !subStore[primaryId].updateType)
    itemObjMinutesCache = -1; // any WS type call overrides data store
  else if (subStore[primaryId] && !subStore[primaryId].description) {
     // type = "changeIfNeeded";
    itemObjMinutesCache = -1; // Some flag calls like GetAllRentalsPurchases_wBundlesPricing are thin
  }
  if (itemObj.eid)
    itemObj.eid = itemObj.eid.toLowerCase()
  if (itemObj.id)
    itemObj.id = itemObj.id.toLowerCase()
  // we can add type check logic here as well, to bypass return and merge when new props are defined for itemObjDetails, etc.
  if (subStore[primaryId] && subStore[primaryId].minuteStamp + itemObjMinutesCache > Date.now() / 60000)
    return {};
  // all that are needed for mutated results for itemStore...
  // if (subStore[primaryId])
     // console.log('subStore[primaryId].minuteStamp', subStore[primaryId].minuteStamp);

  const inObjProps = Object.keys(itemObj);
  const inObjPropsLC = inObjProps.map(p => ({ orig: p, lc: p.toLowerCase() }));
  inObjPropsLC.filter(x => x.orig !== x.lc && ["otherKEYSwithODDcasingid"].some(s => s === x.lc))
  .forEach(p => {
    const prop = p.lc.match(/id/) ? p.lc : p.lc + "id";
    itemObj[prop] = itemObj[p.orig];
    delete itemObj[p.orig];
  });
  const itemOut = mutate(itemObj, {
//        minuteStamp: Date.now() / 60000,
//        primaryId: primaryId,
      // any other data normalizations we want to do on incoming data from Handler response!
      // prop: itemObj.whatever.methodOfMutation
  });
   
  // uniqueStoreVals builder... this is here for data checking only. It can go away later.
  /* ["anyOddKeyWeWantToAccumulate"].filter(function (x) {
    return itemOut[x]
  }).forEach(function (k) {
    const val = itemOut[k];
    uniqueStoreVals[k] = { cnt: (uniqueStoreVals[k] ? uniqueStoreVals[k].cnt + 1 : 1) };
    uniqueStoreVals[k].valcnt[val] = (uniqueStoreVals[k].valcnt[val]) ? uniqueStoreVals[k].valcnt[val] + 1 : 1;
  }); // */
  return itemOut;
}

const teamChallDates = {}
function startEndChallengeFromSched (state, teamEvt) { 
  if (teamChallDates[teamEvt.id])
    return teamChallDates[teamEvt.id]
  if (!state.schedule)
    console.log("state.schedule IS NOT AN OBJECT TIL YOU VISIT Schedule TAB FIRST!!!")

  const schedDates = Object.keys(state.schedule).map(k => state.schedule[k]).filter(x => {
    return x.tid === teamEvt.id && x.schType === "chall"
  }).reduce((acc, i) => {
    acc.m_start = acc.m_start < i.whenStamp ? acc.m_start : i.whenStamp
    acc.m_end = acc.m_end > i.whenStamp ? 
      acc.m_end : parseInt(moment.unix(i.whenStamp * 60).day("Friday").unix() / 60)
    // acc.weeks[(i.counter ? i.counter : 1)] = i.whenStamp
    acc.weeks.push(i.whenStamp)
    return acc
  }, { weeks: [0], m_start: 999999999999990, m_end: 0 })
  schedDates.schStart = moment.unix(schedDates.m_start * 60).format("ddd, MM-DD-YY")
  schedDates.schedEnd = moment.unix(schedDates.m_end * 60).format("ddd, MM-DD-YY")
  if (state.teams[teamEvt.id]) {
    schedDates.teamStart = moment.unix(state.teams[teamEvt.id].challengeStartDate * 60).format("ddd, MM-DD-YY")
    schedDates.teamEnd = moment.unix(state.teams[teamEvt.id].challengeEndDate * 60).format("ddd, MM-DD-YY")   
  }
  teamChallDates[teamEvt.id] = schedDates.m_end > 0 ? schedDates : {}
  return teamChallDates[teamEvt.id];
}

function customEventTweak (obj, isCustom, allObj, evt) { 
  if (isCustom !== "custom")
    return obj
  // here is where you custom mutate object
  delete obj.zid // this oldy prop has lost its safety purpose
  // console.log('obj, isCustom, allObj', obj, isCustom, allObj)
  // set up vars
  const valProps = Object.keys(obj)
    .filter(p => !["id", "asOfStamp", "eStamp", "user", "eId", "eventType"].some(s => s === p))
  const coachNotes = obj.coachNotes && obj.coachNotes.trim()
  const textareaProps = ["keyGoal", "description", "elevatorPitchChallengeDescription", "businessImpact"]
  const when = moment.unix((obj.asOfStamp || obj.eStamp) * 60).format("ddd, MM-DD-YY")
  const startEnd = startEndChallengeFromSched(allObj.so, obj)

  if (coachNotes && !startEnd.m_end)
    console.log('coachNotes WITH NOOOOO 0000 SCHED startEnd!! @' + evt, obj.id, when, coachNotes)
  // custom #1 - kill off junky coachNotes
  if (coachNotes && valProps.length === 1 && !coachNotes.match(/\s+/))
    delete obj.id // removes whole obj from post
  // custom #2 - fix eariler inadvertent field erasures on textarea props
  textareaProps.forEach(p => {
    if (valProps.some(s => s === p) && !obj[p])
      delete obj[p]
  })
  // custom #3 - Find week number to move weekly reports to from coachNotes! 
  if (obj.id && coachNotes && coachNotes.length > 420 && startEnd.weeks){
    let week = 0
    startEnd.weeks.forEach((w, idx) => {
      if (obj.eStamp - (60 * 48) > w) // up to 2 days (wed) it is for prior week
        week = idx      
    })
    obj["weeklyReport" + week] = coachNotes
    delete obj.coachNotes
    console.log(' THISISAREPORT! @' + evt, when, startEnd, obj, coachNotes, coachNotes.length)
  }
  else if (obj.id && coachNotes)
    console.log('not a report, but coachNotes!! @' + evt, valProps, when, startEnd, coachNotes)
  // custom #4 - assign start and end dates from schedule 
  if (obj.id && (obj.challengeStartDate || obj.challengeEndDate) &&
      allObj.so.teams[obj.id] && allObj.so.teams[obj.id].status.match(/(grad|imm)/)){
    allObj.so.startEnd[obj.id] = mutate(trimObj(allObj.so.teams[obj.id], 
      ["project", "ttLoc", "status", "challengeStartDate", "challengeEndDate"]), startEnd)
    if (obj.challengeStartDate && startEnd.m_start) 
      obj.challengeStartDate = startEnd.m_start
    if (startEnd.m_end) 
      obj.challengeEndDate = startEnd.m_end
  }

  return obj
}

function camelize (str) {
  return str.trim().toLowerCase().split(/\W+/).reduce((acc, i) => {
    return acc += acc ? i.replace(/^(\w)/, function (m, p1){ return p1.toUpperCase() }) : i
  }, "")
}

function translateBulkTeamJson (json, ss) {
  let jObj = {}
  try {
    jObj = JSON.parse(json)
  } catch (e) {
    jObj = { errors: (e.message || e) }
    return jObj
  }
  const teamKeys = ss ? Object.keys(ss) : []
  if (teamKeys.length < 1)
    return { errors: "Go to teams tab and come back" }
  const colMap = mutate(jObj.columns.reduce((acc, i) => {
    acc[i.uid] = i.title === "TeamAssist Location" ? "ttLoc" : camelize(i.title)
    return acc
  }, {}), { c3btSKJ: "lob", c7fUYdY: "teamContactName", ciEEaA: "teamContactEmail", c4AiPuB: "confluenceInterests" })
  const ttLocsMap = { "NJ": "nj", "TX": "tx", "FL": "fl", "Chennai": "ch", "Hyderabad": "hy"}
  const teams = jObj.rows.map(i => {
    const fMap = i.fields.reduce((acc, f) => {
      acc[colMap[f.uid]] = f.values.join(", ")
      if (colMap[f.uid] === "ttLoc"){
        const matcher = Object.keys(ttLocsMap).find(k => String(acc[colMap[f.uid]]).match(k)) 
        acc[colMap[f.uid]] = matcher ? ttLocsMap[matcher] : acc[colMap[f.uid]]
        // console.log("ACCCCCC...", acc, matcher, f.uid, acc[colMap[f.uid]])
      }
      return acc
    }, {})
    return mutate(fMap, {
      id: i.userKey,
      created: i.created
    })
  }).filter(x => !teamKeys.some(t => x.id === t))
  // console.log(' teams arrayObj..... ', teams, teamKeys)
  return teams;
}

function translateTeamTSV (tsv, ss) {
  ss = ss || {}
  const teamKeys = ss ? Object.keys(ss) : []
  if (teamKeys.length < 1)
    return { errors: "Go to teams tab and come back" }
  const rows = tsv.split("\n")
  const header = rows.shift().split("\t")
  const colMap = mutate(header.reduce((acc, i) => {
    acc[camelize(i)] = camelize(i)
    return acc
  }, {}), { 
    tt: "ttLoc", 
    ProjectSummary: "description",
    challengeStart: "challengeStartDate",
    challengeEnd: "challengeEndDate",
    otherPertinentInformation: "salesNotes",
    elevatorPitchChallengeDescription: "elevatorPitch",
    tryingToAchieve: "keyGoal", 
    vPOrg: "lobVp"
  })
  const statusTups = [["Pending", "lead"], ["Opt Out", "out"], ["Kickoff/Charter", "ch"]]
    .concat(Object.keys(teamStatus).map(i => [ teamStatus[i], i ]))
  const arrObj = rows.map(i => {
    const cols = i.split("\t")
    const fMap = header.reduce((acc, j, idx) => {
      const key = camelize(j)
      if (key.length > 3 && cols[idx].length)
        acc[colMap[key]] = cols[idx]
      if (cols[idx].match(/^\s*\d+\/\d+\/\d+\s*$/))
        acc[colMap[key]] = makeMinStamp(cols[idx], "m/d/y", 1)
      if (colMap[key] === "ttLoc" && cols[idx].length)
        acc.ttLoc = cols[idx].toLowerCase()
      else if (colMap[key] === "status" && cols[idx].length){
        const matcher = statusTups.find(k => cols[idx].toLowerCase() === k[0].toLowerCase()) 
        acc.status = matcher ? matcher[1] : acc.status + " --- NO MATCH!"
        // console.log(": status, acc.project, acc.contactName...........", acc.status, acc.project, acc.contactName)
      }
      return acc
    }, {})
    return fMap
  })
  const accObjArr = []
  const ssLong = Object.keys(ss).reduce((acc, i) => {
    acc[(ss[i].zid || "noZed")] = i
    return acc
  }, {})
  let accIdx = -1
  let rownum = "1"
  arrObj.forEach(obj => {
    rownum = obj.rownum || rownum
    // console.log(obj.rownum, obj)
    if (obj.project || obj.contactName){
      obj.project = obj.project ? obj.project.trim() : ""
      obj.contactName = obj.contactName ? obj.contactName.trim() : ""
      let karr = [obj.project, obj.contactName]
      if (obj.specops && obj.specops.match(/__/)){
        karr = obj.specops.split(/__/)
        karr[0] = karr[0].trim()
        karr[1] = karr[1].trim()
      }
      const zid = murmur.hash128(karr.join("__")).hex()
      if (ssLong[zid])
        obj.id = ssLong[zid]
      else if (karr[0] && ssLong[murmur.hash128(karr[0] + "__").hex()])
        obj.id = ssLong[murmur.hash128(karr[0] + "__").hex()]
      else {
        obj.id = untilUniq(karr.join("__"), ss)
        obj.zid = zid
      }
      delete obj.rownum
      delete obj.specops
      delete obj.teamName
      accObjArr.push(obj)
      accIdx++
    }
    else { // append rougue cells
      Object.keys(obj).forEach(prop => {
        // console.log("APPEND rownum idx CELL:", rownum, accIdx, prop, "'", accObjArr[accIdx][prop], "'", obj[prop], "'")
        accObjArr[accIdx][prop] += " " + obj[prop].trim()
      })
    }
  })
  // console.log('stateObj SSSSSS::::: ', Object.keys(ss))
  const counts = { added: 0, chng: 0, pass: 0}
  const outObjArr = accObjArr.map(obj => { // mutate against existing state
    if (ss[obj.id]){
      const changedOnly = updatedDiff(ss[obj.id], obj)
      if (Object.keys(changedOnly).length){
        /**/ console.log('changedOnly diff ________________\n', Object.keys(changedOnly).map(i => {
          return i + ":: |" + changedOnly[i] + "| :from: |" + ss[obj.id][i] + "|"
        }), 
          "out of total fields: ", Object.keys(obj).length, 
          trimObj(obj, ["ttLoc", "status", "project", "contactName"])
        ) // */
        counts.chng++
        return mutate(changedOnly, { id: obj.id, status: (changedOnly.status || obj.status) })
      }
      counts.pass++
      return {} // { id: obj.id, status: "redund", project: obj.project, contact: obj.contactName }
    } 
    counts.added++
    // console.log("NEW record for: ", trimObj(obj, ["status", "ttLoc", "project", "contactName"]))
    return obj
  }).filter(x => x.id && x.status && x.status.length < 7 && x.status.length > 1)
  // console.log('parse....', header, colMap, 'len, len, accIdx, out:', arrObj.length, outObjArr, counts, accIdx)
  return outObjArr

}


export {makeStoreFriendlyObj, translateBulkTeamJson, translateTeamTSV, camelize, customEventTweak};
