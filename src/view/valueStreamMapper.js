import {h} from '@cycle/dom';
import {minToDateFormat, mutate, trimObj} from '../frpHelpers';
import {formProps, hashSrc, inputSelList} from '../view';

export default function valueStreamDetail (team, meta, vd) {
  const vsMap = ["Analyze", "Code", "Make Merge Request", "Code Review", "Dev Testing", "QA", "prodDeploy", "smokeTest"]
    .map(i => ({
      name: i,
      actType: "",
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
          vsmFrm(vd.settings.vsmObj, idx, vd)
        ),
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
    h('div', { style: { height: "120px"}}),
    h('div', { style: { width: accumWidth + "px"  }}, out)  
  ])

}


function vsmFrm (vsmIObj, idx, vd) {

  if(!vsmIObj || idx  !== Number(vsmIObj.prop))
    return h('div#vsmFrm.mClick.la.la-plus.upperLeft', { 
        style:{ fontSize:"1.2em"}, attrs: {idx: "name", prop: idx} 
      })

  const mappedIcon = { hrs: "sticky-note.orange", days: "sitemap.green" }

  const cntrlObj = vd.sub1 && vd.sub1.meta || {}
  // const teamAllSched = vd.sub1 && vd.sub1[teamObj.id] || {}
  // ["schType", "schNote", "aCoach", "tCoach", "spreadRight" "whenStamp" ]
  const frmObj = vsmIObj.vsmid && vsmObj ? vsmObj :
  { 
    actType: "chall", 
    timeMult: "hrs",
    mapName: cntrlObj.mapName || "current"
  }
  // console.log('frmObj, vsmIObj,', frmObj, vsmIObj)
  if (!frmObj)
    return h('i')
  const exitX = h('div#delProp_settings_vsmObj.mClick.la.la-close.upperRight')
  // get formConfig set in menuRoutes and look like modForm does
  const formEleTypeMap = { checkbox: {top: "1px", left: "215px"}, radio:{top: "1px", left: "135px"} }
  const mappedIconFontSize = { chall: "2em", chr: "2.1em", cons: "2em" }
  const editAct = frmObj.id ? { label: "Delete Item?", type: "checkbox", name: "deleteIt", value: "1" } : {}
  const formArr = vd.rteObj.meta.formConfig.concat(editAct).map(e => {
    if (!e.type)
      return ""
    const formEleStyle = {}
    formEleStyle.style = formEleTypeMap[e.type] ? mutate(formEleTypeMap[e.type], {width: "33px"}) : {}
    formEleStyle.style.border = "2px solid #999"
    const optsSrc = e.opts ? hashSrc(vd, e.opts) : ""
    const opts = optsSrc ? Object.keys(optsSrc).map(k => ( { k: k, v: optsSrc[k] } )) : ""
    let formEle = opts ? 
      inputSelList( e.name, frmObj[e.name], ["", ...opts], "keyInput", 
        formEleStyle.style, e.numIndex, { title: e.title }) :
      h('input.keyInput', mutate(formEleStyle, { attrs: formProps(e, frmObj[e.name]) }))
    // console.log('e.opts, optsSrc, opts', e.opts, optsSrc, opts)
    if (e.type === "radio" && opts)
      formEle = h('div', opts.map(r => h('div', {style: {float: "left", margin: "0 12px"}}, [ 
        h('label.fa.fa-' + mappedIcon[r.k], {style:{cursor:"pointer", fontSize:mappedIconFontSize[r.k]}, attrs: {"for": r.k, title: r.v}}), " ",
        h('input#' + r.k + '.keyInput', { props: formProps(mutate(e, {value: frmObj[e.name], title: r.v}), r.k) } )
      ])).concat( h('div', {style:{clear: "both", width: "200px", height: "3px"}}) ))
    return h('div.schFrmRows', [
      h('strong', (e.type !== "submit" ? e.label + ": " : "")), 
      // (e.label ? h('br', { style: { clear:"both"}}) : ""),
      formEle,
      (vd.formObj.errors[e.name] ? h('div.formRowErrorMsg', vd.formObj.errors[e.name]) : ""),
    ])
  })

  const formTag = h('form.formSubmit', { 
    style: { padding: "5px", color: "#333" },
    attrs: { onSubmit: "return false" }
  }, [...formArr, h('input.schFrmSub', { props: { type: "submit", value: (frmObj.id ? "Update" : "Create") }} )] )
 
  return h('div.cellAbs.schFrm', { style: { textAlign: "left"}}, [
    exitX,
    h('div', "<--  Insert Action Step"),
    formTag
  ])


}