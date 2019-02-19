import {h} from '@cycle/dom';
// import {minToDateFormat, mutate, trimObj} from '../frpHelpers';
// import markdownRender from './viewMarkdownRender';

export default function valueStreamDetail (team, meta, vd) {
  const vsMap = ["Analyze", "Code", "Make Merge Request", "Code Review", "Dev Testing", "QA", "prodDeploy", "smokeTest"]
    .map(i => ({
      name: i,
      ltHrs: 8.2,
      ptHrs: 6.1,
      pctAcc: 80
    }))

  let accumWidth = 10
  const out = vsMap.map((act, idx) => {
    const waitHrs = act.ltHrs - act.ptHrs
    const ptHrsLen = act.ptHrs > 3 ? act.ptHrs : 3
    const ltHrsLen = waitHrs + ptHrsLen
    accumWidth += (ltHrsLen * 34)
    return h('div.vsmAction' + (idx % 2 ? ".sch_tentative" : ""), { style: { width: (ltHrsLen * 30) + 4 + "px"}},
      [
        h('div.vsmWait', { style: { width: (waitHrs * 30) + "px"}}, 
          h('div#vsmFrm.mClick.la.la-plus.upperLeft', { 
            style:{ fontSize:"1.2em"}, attrs: {idx: act.name, prop: idx} 
        })),
        h('div.vsmProcess', { style: { width: (ptHrsLen * 30) + "px" }}, [
          h('br'),
          h('strong', act.ptHrs + " Days"),
        ]),
        h('div.vsmLegend', { style: { width: (ptHrsLen * 30) + "px" }}, [
          h('h4', act.name),
          h('div', [
            "Lead Time: " + act.ltHrs,          
            h('br'),
            "C&A %: " + act.pctAcc,
          ])
        ])

//        h('div.stickyLeft', h('span.bigSticky.fa.fa-sticky-note.orange', 
//          h('span.bigStickyTxt', [ h('b', "Week"), h('br'), h('b', row.weekNum) ]))), 
//        h('div.weeklyText', [row.report, h('div.weeklyMeta', metaHtml)]),
//        h('br', { style: { clear: "all" }})
      ]
    )
  })
  return  h('div.vsmContainer', [
    h('div', { style: { height: "80px"}}),
    h('div', { style: { width: accumWidth + "px"  }}, out)  
  ])

}