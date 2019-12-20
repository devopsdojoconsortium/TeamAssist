const Excel = require('exceljs');
import {validRoutes} from '../src/menuRoutes'
import {tableConfig} from '../src/tableViewConfig'
import {buildStateObj} from '../src/model'
import {mutate} from '../src/frpHelpers'

function excelProc(req, events, evtCnt){

  const stateObj = buildStateObj({}, { teams: events}, "teams", { latest: evtCnt, returnState: true})
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
  // do sheets in a loopof metas from menuRoutes
  tabArray.forEach((tab, i) => {
    const custom = i === 3 ? mutate(req, { name: "Selected Records"}) : {}
    const routeMeta = validRoutes.teams[tab] ? validRoutes.teams[tab].meta : validRoutes.teams.meta
    const tableCols = tableConfig[tab] || { cols: []}
    const teamIds = req.teamIds && custom.tab ? req.teamIds.split(/\W+/) : stateObj.ids

console.log("tab, custom,", tabArray, tab, custom)
    var sheet = workbook.addWorksheet((custom.name || routeMeta.name), {properties:{tabColor:{argb:'FFC0000'}}});
    sheet.columns = tableCols.cols.filter(x => x.dKey).map(c => {
      return {
        header: c.label,
        key: c.dKey,
        width: parseInt((c.width || c.minWidth || 90) / 6)
      }
    })
     // console.log('stateObj and teamIds', stateObj, teamIds)
    const rows = teamIds
      .filter(x => custom.name || routeMeta.hardFilt.status.some(s => s === stateObj.state[x].status)) 
      .map(tid => {
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
    counts[tab + i] = rows.length

  })

  // write to file in dist
  workbook.xlsx.writeFile("./dist/test.xlsx").then(excelOut => console.log("excelOut", excelOut))
  return JSON.stringify(counts, null, 2)

}

function accumPriors (obj, events, prop) {
  const priorKeys = obj.priors ? [obj.eId].concat(obj.priors.reverse()) : [obj.eId]
  return priorKeys
    .map(i => events[i])
    .filter(x => x[prop] )
    .map(res =>  res[prop] + "\n\n" + new Date(res.eStamp * 60000).toDateString() + "| " + (res.user || ""))
}

export {excelProc}