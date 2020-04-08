import {h} from '@cycle/dom';
import { minToDateFormat } from '../frpHelpers';
import markdownRender from './viewMarkdownRender';
import {hashSrc} from '../view';
import {statusColors} from '../uiConfig';


function weeklyReports (team, vd) {
  const weeklies = Object.keys(team).filter(x => x.match(/weeklyReport/))
    .map(i => ({
      report: markdownRender(team[i]),
      meta: team.eMap[i][0],
      priors: team.eMap[i].length - 1,
      weekNum: Number(i.replace(/\D+/, ""))
    }))
  const coachObj = hashSrc(vd, "coachers")
  const out = weeklies.map(row => {
    const metaHtml = [
      h('small', minToDateFormat(row.meta.asOfStamp || row.meta.eStamp, "MM/DD/YY HH:mm")),
      h('small', row.meta.user && coachObj[row.meta.user] ? " | " + coachObj[row.meta.user] :
      (row.meta.user ? " | " + row.meta.user : "")),
      (row.priors ? h('small#modal_priors_reports.mClick.blue', { attrs: { 
        prop: "weeklyReport" + row.weekNum
      }}, " (edits: " + row.priors + ")" ) : ""),
    ]
    return h('div.teamRows', [
        h('div.stickyLeft', h('span.bigSticky.fa.fa-sticky-note.orange', 
          h('span.bigStickyTxt', [ h('b', row.weekNum ? "Week" : "Start"), h('br'), h('b', row.weekNum || "Up") ]))), 
        h('div.weeklyText', [row.report, h('div.eventMeta', metaHtml)]),
        h('br.clearBoth')
      ]
    )
  })
  return  (out.length ? out : "")
}

function htmlBlock (team, vd, fc) {
  const activeConfs = fc.reduce((arr,i) => arr.concat(i.arr), []).filter(x => team[x.name]) // combine and filter where val is truthy
  const coachObj = hashSrc(vd, "coachers")
  const out = activeConfs.filter(x => x.type !== "color").map(i => {

    let val = team[i.name]
    if (i.type === "textarea") {
      val = markdownRender(val)
      if (i.journal && team.eMap[i.name])
        val = h('div', { style: {overflow: "auto", height: "150px"}}, team.eMap[i.name].map(e => h('div.cellDiv', [ 
          markdownRender(e.val),
          h('div.eventMeta', [
            h('small', minToDateFormat(e.asOfStamp || e.eStamp, "MM/DD/YY HH:mm")),
            h('small', e.user && hashSrc(vd, "coachers")[e.user] ? " | " + hashSrc(vd, "coachers")[e.user] :
              (e.user ? " | " + e.user : ""))
          ])
        ])))
    }
    else if (i.type === "select")
      val = i.opts[val]
    else if (i.type === "date")
      val = minToDateFormat(val, "MM/DD/YY")
    else if (i.type === "range"){
      const curVal = team[i.name] || 0
      val = h('div.inlineMiddling', {style: {}}, [ 
        h('div.tableProgressBar', { 
          style: { display: "inline-block", width: "50%"},
          attrs: i.title ? { tooltip: i.title.replace(/__/, val), tooltipPos: "bottom" } : {},
        }, h('div', { style: { 
            width: ((val - i.min) / (i.max - i.min) * 100) + "%", 
            background: i.barColor ? i.barColor : ""
          }})
        ),
        h('small', { style: { padding: "0 0 0 5px"}}, i.title ? i.title.replace(/__/, curVal) : curVal)
      ])
    }
    return h('div.teamRows', [
        h('div.label', i.label + ""),
        h('div.value', { style: (i.name === "status" ? {
          background: statusColors[team[i.name]],
          color: "#fff",
          fontWeight: "bold"
        } : {})}, val),
        h('br.clearBoth')
      ]
    )
  })
  return  (out.length ? out : "")
}

export default function teamDetail (team, meta, vd) {
  const formConfig = getFormConfig (vd.rteObj)
  console.log(formConfig)
  const sections = [
    { key: "pipeline", label: "Engagement Opportunity Tracking" }, 
    { key: "active", label: "Engagement Activation and Progress" }, 
    { key: "weeklies",  label: "Weekly Engagement Reports" },
    { key: "completed",  label: "Engagement Outcomes" }
  ]
  const sectionBlocks = {
    initial: htmlBlock(team, vd, [formConfig.initial]),
    pipeline: htmlBlock(team, vd, [formConfig.pipeline]),
    active: htmlBlock(team, vd, [formConfig.active, formConfig.progress]),
    weeklies: weeklyReports(team, vd),
    completed: htmlBlock(team, vd, [formConfig.completed])
  }
  const rightSections = sections.map(s => h('div.detailBoxRight', [
    h('div.detailBoxHeader', { style: { background: formConfig[s.key].color, borderColor: formConfig[s.key].color }}, [ 
      h('label', s.label), 
      h('span#collToggle_' + s.key + '.la.la-minus-circle.mClick'),
      h('a.la.la-edit', { attrs: { href: "#/teams/modTeam/pane_" + s.key + "/id/" + team.id }}, "")
    ]),
    h('div.detailBox', { style: { borderColor: formConfig[s.key].color }}, sectionBlocks[s.key])
  ]))
  return  h('div.detailContainer', [
    h('div.detailBoxLeft', [
      h('div.detailBoxHeader', { style: { background: formConfig.initial.color, borderColor: formConfig.initial.color }}, [
        h('label', "META"), 
        h('a.la.la-edit', { attrs: { href: "#/teams/modTeam/pane_initial/id/" + team.id }}, "")
      ]),
      h('div.detailBox', { style: { borderColor: formConfig.initial.color }}, sectionBlocks.initial)
    ]),
    ...rightSections
  ])

}

function getFormConfig (rteObj) {
  const fields = rteObj.modTeam.meta && rteObj.modTeam.meta.formConfig || []
  let paneKey = "SLUGGO"
  return fields.concat(rteObj.modTeam.id.meta && rteObj.modTeam.id.meta.additionalFormConfig || []).reduce((acc, i) => {
    if (i.pane){
      paneKey = i.name
      acc[paneKey] = {label: i.pane, color: i.color, arr: []}
    }
    else if(i.name === "status")
      acc["initial"]["arr"].unshift(i) 
    else 
      acc[paneKey]["arr"].push(i) 
    return acc
  }, {})
}

