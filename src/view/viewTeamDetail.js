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
      val = h('div.inlineMiddling', [ 
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

function isDetailBoxOpen (team, section, fc, settings) {
  const toggleKey = "detView" + team.id
  if (settings[toggleKey] && settings[toggleKey][section.key])
    return settings[toggleKey][section.key] === "plus" ? 1 : 0
  return (section.stArr.some(s => s === team.status)) ? 1 : 0
}

function isDetailBoxAvailable (team, sec, sections, fc) {
  let secStatMatch = 2
  sections.forEach(i => {
    if(i.stArr.some(s => s === team.status)) 
      secStatMatch = 1
    else if(secStatMatch === 1 && sec.key == i.key)
      secStatMatch = 0
  })
  return secStatMatch
}

function toggleExpander (id, s, isOpen, isAvail) {
  const icon = isOpen ? "minus" : "plus"
  return isAvail ? h('span#detailSectionToggle_' + id + '_' + s.key + '-' + icon + '.la.la-' + icon + '-circle.mClick') : ""
}

export default function teamDetail (team, meta, vd) {
  const formConfig = getFormConfig (vd.rteObj)
  const sections = [
    { key: "pipeline", label: "Engagement Opportunity Tracking", stArr: ["pre", "lead", "cont", "cons", "qual", "out"] }, 
    { key: "progress", label: "Engagement Activation and Progress", stArr: ["ch", "eng"] }, 
    { key: "weeklies",  label: "Weekly Engagement Reports", stArr: [ "eng"]},
    { key: "completed",  label: "Engagement Outcomes", stArr: ["grad"] }
  ]
  const sectionBlocks = {
    initial: htmlBlock(team, vd, [formConfig.initial]),
    pipeline: htmlBlock(team, vd, [formConfig.pipeline]),
    progress: htmlBlock(team, vd, [formConfig.active, formConfig.progress]),
    weeklies: weeklyReports(team, vd),
    completed: htmlBlock(team, vd, [formConfig.completed])
  }
  const rightSections = sections.map(s => {
    const isOpen = isDetailBoxOpen(team, s, formConfig[s.key], vd.settings)
    const isAvail = isDetailBoxAvailable(team, s, sections, formConfig[s.key])
    const color = isAvail ? formConfig[s.key].color : "#ccc"
    return h('div.detailBoxRight', [
      h('div.detailBoxHeader', { style: { background: color, borderColor: color } }, [ 
        h('label', s.label), 
        toggleExpander(team.id, s, isOpen, isAvail),
        h('a.la.la-edit', { attrs: { href: "#/teams/modTeam/pane_" + s.key + "/id/" + team.id }}, "")
      ]),
      h('div.detailBox.easeAll', { style: { 
        maxHeight: (isOpen ? "2000px" : "0px"), transform: "scaleY(" + isOpen + ")", borderColor: color 
      } }, sectionBlocks[s.key])
    ])
  })
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

