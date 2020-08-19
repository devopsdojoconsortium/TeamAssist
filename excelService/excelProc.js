const Excel = require('exceljs');
import {validRoutes} from '../src/menuRoutes'
import {tableConfig} from '../src/tableViewConfig'
import {buildStateObj} from '../src/model'
import {mutate} from '../src/frpHelpers'
import {statusColors} from '../src/uiConfig'

function excelProc(req){
  const events = JSON.parse(Buffer.from(req.events, 'base64').toString('utf-8'))
  console.log("THE EVENTS", events)
  const stateObj = buildStateObj({}, { teams: events}, "teams", { latest: req.eventCnt, returnState: true})
  var workbook = new Excel.Workbook({
    modified: new Date(),
    creator: 'Me',
    lastModifiedBy: 'Admin',
    views: [ {
        x: 0, y: 0, width: 10000, height: 20000,
        firstSheet: 0, activeTab: 1, visibility: 'visible'
      } ]
  });
  const tabArray = ["teams", "teamLeads", "teamsCompleted"]
  if(req.tab && req.teamIds)
    tabArray.push(req.tab)
  const counts = {}
  // do sheets in a loop of metas from menuRoutes
  tabArray.forEach((tab, i) => {
    const custom = i === 3 ? mutate(req, { name: (req.tabName || "Selected Records")}) : {}
    const routeMeta = validRoutes.teams[tab] ? validRoutes.teams[tab].meta : validRoutes.teams.meta
    const tableCols = tableConfig[tab] || { cols: []}
    const teamIds = req.teamIds && custom.tab ? req.teamIds.split(/\W+/) : stateObj.ids
    const tabColor = routeMeta.color ? routeMeta.color.replace("#", "FF") : "FFFFFFFF"
    console.log("tab, custom,", tabArray, tab, custom)
    var sheet = workbook.addWorksheet((custom.name || routeMeta.name), {
      properties:{tabColor:{argb: tabColor}, outlineLevelRow: 2, outlineLevelCol: 7},
      views: [{state: "frozen", ySplit: 1}]
    });
    sheet.columns = tableCols.cols.filter(x => x.dKey).map(c => {
      return {
        header: c.label,
        key: c.dKey,
        width: parseInt((c.width || c.minWidth || 90) / 6)
      }
    })
     // console.log('stateObj and teamIds', stateObj, teamIds)
     let cellArr = []
     const rows = teamIds
      .filter(x => custom.name || routeMeta.hardFilt.status.some(s => s === stateObj.state[x].status))
      .map((tid, rIdx) => {
        const out = {}
        const rec = stateObj.state[tid]
        // console.log('tid', tid, rec)
        tableCols.cols.forEach((c, cIdx) => {
          if (c.dKey && rec[c.dKey]) {
            const val = rec[c.dKey]
            if (c.dKey === "status")
              cellArr = cells2Arr(cellArr, rIdx, cIdx, 'status', val)
            if (c.hashMap)
              out[c.dKey] = c.hashMap[val]
            else if (c.dateFormat)
              out[c.dKey] = new Date(val * 60000)
            else
              out[c.dKey] = val
            if (c.tdStyle === "#modal_priors_cell.mClick.clickBg")
              cellArr = cells2Arr(cellArr, rIdx, cIdx, 'note', accumPriors(rec, events, c.dKey))
            // console.log(cellKeys(rIdx, cIdx), val)
          }
        })
        out.id = tid
        return out
      })
    sheet.addRows(rows)
    sheet.getRow(1).font = { name: "Calibri", bold: true, color: { argb: "FFFFFFFF"} }
    sheet.getRow(1).fill = { type: "gradient", gradient: "angle", degree: 0, stops: [
      {position: 0, color: {argb: "FFFF0000"}},
      {position: 1, color: {argb: "FFC00000"}}
    ]}
    sheet.getRow(1).alignment = { vertical: "middle" }
    sheet.getRow(1).height = 50
//    sheet.getRow(1).protection = { locked: true }
    sheet.autoFilter = "A1:F1"
    counts[tab + i] = rows.length
    // do cell styling
    // console.log("The array of cell obj", cellArr)
    const colors = ['000000', '000090']
    cellArr.forEach(c => {
      if (c.prop === "status"){
        sheet.getCell(c.cid).fill = { type: "pattern", pattern: "solid", fgColor: {
          argb: statusColors[c.val] ? statusColors[c.val].replace("#", "AA") : "FFFFFFFF"
        }}
      }
      if (c.prop === "note"){
        sheet.getCell(c.cid).value = { richText: c.val.map((note, nIdx) => ({
          font: { size: 8, color: {argb: 'FF' + colors[(nIdx % 2)]}}, text: note
        }))}
        sheet.getCell(c.cid).alignment = { wrapText: true }
      }
    })
  })

  const filePath = "Engagements_" + new Date().toISOString() + "_Evts_" + req.eventCnt + ".xlsx"
  // write to file in dist
  workbook.xlsx.writeFile("./dist/" + filePath).then(excelOut => console.log("excelOut", excelOut))

  return JSON.stringify(counts, null, 2) + "<br><br>File generated! <a href='http://localhost:8080/dist/" + filePath + "'>Download</a>"
}

// internal funcs
function cells2Arr (cellArr, rIdx, cIdx, prop, val) {
  return cellArr.concat({ cid: cellKeys(rIdx, cIdx), prop: prop, val: val})
  // return cells
}
function cellKeys (rowIdx, cellIdx) {
  return String.fromCharCode(cellIdx + 65) + (rowIdx + 2)
}
function accumPriors (obj, events, prop) {
  const priorKeys = obj.priors ? [obj.eId].concat(obj.priors.reverse()) : [obj.eId]
  return priorKeys
    .map(i => events[i])
    .filter(x => x[prop] && x[prop] != "undefined" )
    .map(res =>  res[prop].trim() + "\n - " + new Date(res.eStamp * 60000).toDateString() +
      (res.user ? " | " + getUsers(res.user) : "") +
      "\n")
}
function getUsers (uid) {
  // pull or pass later on
  const userHash = {
    "testacct": "Test Account"
  }
  return userHash[uid] || uid
}
export {excelProc}