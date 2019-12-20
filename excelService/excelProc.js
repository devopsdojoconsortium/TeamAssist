const Excel = require('exceljs');
import {validRoutes} from '../src/menuRoutes'
import {tableConfig} from '../src/tableViewConfig'
import {buildStateObj} from '../src/model'

function excelProc(req, events, evtCnt){
  console.log(validRoutes.teams.meta)

  const routeMeta = validRoutes.teams[req.tab] ? validRoutes.teams[req.tab].meta : validRoutes.teams.meta
  const tableCols = tableConfig[req.tab] || { cols: []}
  const stateObj = buildStateObj({}, { teams: events}, "teams", { latest: evtCnt, returnState: true})
  const teamIds = req.teamIds ? req.teamIds.split(/\W+/) : stateObj.ids
  var workbook = new Excel.Workbook({
    modified: new Date(),
    creator: 'Me',
    lastModifiedBy: 'Admin',
    views: [ {
        x: 0, y: 0, width: 10000, height: 20000,
        firstSheet: 0, activeTab: 1, visibility: 'visible'
      } ]
  });
  var sheet = workbook.addWorksheet(routeMeta.name + ' Sheet', {properties:{tabColor:{argb:'FFC0000'}}});
  sheet.columns = tableCols.cols.filter(x => x.dKey).map(c => {
    return {
      header: c.label,
      key: c.dKey,
      width: parseInt((c.width || c.minWidth || 90) / 6)
    }
  })
   // console.log('stateObj and teamIds', stateObj, teamIds)
  const rows = teamIds.map(tid => {
    const out = {}
    const rec = stateObj.state[tid]
    // console.log('tid', tid, rec)
    tableCols.cols.forEach(c => {
      if (c.dKey && rec[c.dKey]) {
        const val = rec[c.dKey]
        if (c.hashMap)
          out[c.dKey] = c.hashMap[val]
        else if (c.dateFormat)
          out[c.dKey] = new Date(val * 60000)
        else if (c.tdStyle === "#modal_priors_cell.mClick.clickBg")
          out[c.dKey] = accumPriors(rec, events, c.dKey).join("\n ________________________ \n\n")
        else 
          out[c.dKey] = val
      }
    })
    return out
  })
  sheet.addRows(rows)
  workbook.xlsx.writeFile("/tmp/test.xlsx").then(excelOut => console.log(excelOut))
  return JSON.stringify(rows, null, 2)
}
function accumPriors (obj, events, prop) {
  const priorKeys = obj.priors ? [obj.eId].concat(obj.priors.reverse()) : [obj.eId]
  return priorKeys
    .map(i => events[i])
    .filter(x => x[prop] )
    .map(res =>  res[prop] + "\n\n" + new Date(res.eStamp * 60000).toDateString() + "| " + (res.user || ""))
}
export {excelProc}