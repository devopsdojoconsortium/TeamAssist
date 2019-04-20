import {h} from '@cycle/dom';
import {mutate} from '../frpHelpers';
import {formProps, hashSrc, inputSelList} from '../view';

export default function valueStreamDetail (mapKey, team, meta, vd) {

  const cntrlObj = vd.sub1 && vd.sub1["meta_" + mapKey] || {}
  
  // const vsMap = vd.sub1 ? Object.keys(vd.sub1).map(i => vd.sub1[i]) : []
  const vsMap = cntrlObj.ord ? cntrlObj.ord.map(i => vd.sub1[i]) : []

  const out = vsMap.filter(x => x.ltHrs).map((act, idx) => {
    const waitHrs = act.ltHrs - act.ptHrs
    const ptHrsLen = act.ptHrs > 3 ? Number(act.ptHrs) : 3
    const ltHrsLen = waitHrs + ptHrsLen
    // console.log('waitHrs, ptHrsLen, ltHrsLen, accumWidth:::::> ', waitHrs, ptHrsLen, ltHrsLen)
    return h('div.vsmAction' + (idx % 2 ? ".sch_tentative" : ""), { style: { width: (ltHrsLen * 30) + 4 + "px"}},
      [
        h('div.vsmWait', { style: { width: (waitHrs * 30) + "px"}}, 
          vsmFrm(vd.settings.vsmObj, mapKey, idx, act.id, ltHrsLen, vd)
        ),
        h('div.vsmProcess', { style: { width: (ptHrsLen * 30) + "px" }}, [
          h('br'),
          h('strong', "PT: " + calcDaysHrs(act.ptHrs)),
        ]),
        h('div.vsmLegend', { style: { width: (ptHrsLen * 30) + "px" }}, [
          h('h4', act.name),
          h('div', [
            "LT: " + calcDaysHrs(act.ltHrs, 0.25), // 0.25 is only val that works in fn for now
            h('br'),
            "C&A: " + act.pctAcc + "%",
          ])
        ])
      ]
    )
  })
  return  h('div.vsmContainer', [
    h('div', { style: { height: "120px"}}),
    h('div', { style: { width: "max-content"  }}, [ metaFrm(vd.settings.vsmObj, mapKey, vd), ...out] )  
  ])

}


function metaFrm (vsmIObj, mapKey, vd) {

  const frmObj = vd.sub1 ? vd.sub1["meta_" + mapKey] : {}  

  const exitX = h('div#delProp_settings_vsmObj.mClick.la.la-close.upperRight')
  const formEleTypeMap = { checkbox: {top: "1px", left: "215px"}, number:{ width: "85px"} }

  const formArr = vd.rteObj.meta.metaFormConfig.map(e => {
    if (!e.type)
      return ""
    const formEleStyle = {}
    formEleStyle.style = formEleTypeMap[e.type] ? mutate(formEleTypeMap[e.type], {color: "#900"}) : {width: "183px"}
    formEleStyle.style.border = e.req ? "2px solid #666" : "2px solid #aaa"
    const optsSrc = e.opts ? hashSrc(vd, e.opts) : ""
    const opts = optsSrc ? Object.keys(optsSrc).map(k => ( { k: k, v: optsSrc[k] } )) : ""
    const formEle = opts ? 
      inputSelList( e.name, frmObj[e.name], ["", ...opts], "keyInput", 
        formEleStyle.style, e.numIndex, { title: e.title }) :
      h('input.keyInput', mutate(formEleStyle, { attrs: formProps(e, frmObj[e.name]) }))
    // console.log('e.opts, optsSrc, opts', e.opts, optsSrc, opts)
    return h('div.vsmFrmRows', [
      h('strong', (e.type !== "submit" ? e.label + ": " : "")), 
      // (e.label ? h('br', { style: { clear:"both"}}) : ""),
      formEle,
      (vd.formObj.errors[e.name] ? h('div.formRowErrorMsg', vd.formObj.errors[e.name]) : ""),
    ])
  })

  const formTag = h('form.formSubmit', { 
    style: { padding: "0 5px", color: "#333", minHeight: "210px" },
    attrs: { onSubmit: "return false" }
  }, [...formArr, h('input.vsmFrmSub', { props: { type: "submit", value: (frmObj.id ? "Update" : "Create") }} )] )
 

  const styleObj = { width: "350px", top: "0px", height: "1px" }
  let frmStyle = { top: "-110px", left: "0px", opacity: 1 }

  console.log('vsmIObj, mapKey', vsmIObj, mapKey, styleObj)

  if (!vsmIObj || vsmIObj.pos !== -1){
    mutate(styleObj, { width: "25px", top: "-150px", height: "250px" })
    frmStyle = { top: "-75px", left: "-355px", opacity: 0 }
  }

  const vsmFrmEle = [ 
    h('div.vsmFrm', { style: frmStyle }, [
      exitX,
      h('div', "Update Map Meta Data"),
      formTag
    ]), 
    h('div.la.la-arrow-right', { style:{ fontSize:"2em", fontWeight: "bold", marginTop: "115px" }} ) 
  ] 

  return h('div#vsmFrm.mClick.vsmMetaFrm', { style: styleObj, attrs: { mapkey: mapKey, pos: -1} }, vsmFrmEle)  
}


function vsmFrm (vsmIObj, mapKey, idx, actId, ltHrsLen, vd) {

  if (!vsmIObj || idx !== vsmIObj.pos)
    return [
      h('div#vsmFrm.mClick.vsmFrmCallInsert', { 
        attrs: { mapkey: mapKey, pos: idx} 
      }, h('div.la.la-plus', { 
        style:{ fontSize:"1.6em"}
      })),
      h('div#vsmFrm.mClick.vsmFrmCallEdit', { 
        style:{ width: (ltHrsLen * 30) - 18 + "px" }, attrs: {actid: actId, mapkey: mapKey, pos: idx} 
      }, h('div.la.la-edit', { 
        style:{ left: (ltHrsLen * 15) + "px", fontSize:"1.6em"}, attrs: {actid: actId, mapkey: mapKey, pos: idx} 
      }))
    ]

  const mappedIcon = { hrs: "hourglass", days: "calendar.blue" }

  // const cntrlObj = vd.sub1 && vd.sub1["meta_" + mapKey] || {}
  // const teamAllSched = vd.sub1 && vd.sub1[teamObj.id] || {}
  // ["schType", "schNote", "aCoach", "tCoach", "spreadRight" "whenStamp" ]
  const frmObj = vsmIObj.actid && vd.sub1 ? vd.sub1[vsmIObj.actid] :
  { 
    timeMult: "hrs",
    pctAcc: 90
  }
  // console.log('frmObj, vsmIObj,', frmObj, vsmIObj, vd.sub1)
  if (!frmObj)
    return h('i')
  const exitX = h('div#delProp_settings_vsmObj.mClick.la.la-close.upperRight')
  // get formConfig set in menuRoutes and look like modForm does
  const formEleTypeMap = { checkbox: {top: "1px", left: "215px"}, number:{ width: "85px"} }
  const mappedIconFontSize = { chall: "2em", chr: "2.1em", cons: "2em" }
  const editAct = frmObj.id ? { label: "Delete Item?", type: "checkbox", name: "deleteIt", value: "1" } : {}
  const formArr = vd.rteObj.meta.formConfig.concat(editAct).map(e => {
    if (!e.type)
      return ""
    const formEleStyle = {}
    formEleStyle.style = formEleTypeMap[e.type] ? mutate(formEleTypeMap[e.type], {color: "#900"}) : {width: "183px"}
    formEleStyle.style.border = e.req ? "2px solid #666" : "2px solid #aaa"
    const optsSrc = e.opts ? hashSrc(vd, e.opts) : ""
    const opts = optsSrc ? Object.keys(optsSrc).map(k => ( { k: k, v: optsSrc[k] } )) : ""
    let formEle = opts ? 
      inputSelList( e.name, frmObj[e.name], ["", ...opts], "keyInput", 
        formEleStyle.style, e.numIndex, { title: e.title }) :
      h('input.keyInput', mutate(formEleStyle, { attrs: formProps(e, frmObj[e.name]) }))
    console.log('formProps(e, frmObj[e.name])', e.req, formProps(e, frmObj[e.name]), e)
    // console.log('e.opts, optsSrc, opts', e.opts, optsSrc, opts)
    if (e.type === "radio" && opts)
      formEle = h('div', { style: {float: "right"}}, opts.map(r => h('div', {style: {float: "left", margin: "0 12px"}}, [ 
        h('label.fa.fa-' + mappedIcon[r.k], {style:{cursor:"pointer", fontSize:mappedIconFontSize[r.k]}, attrs: {"for": r.k, title: r.v}}), " ",
        h('input#' + r.k + '.keyInput', { props: formProps(mutate(e, {value: frmObj[e.name], title: r.v}), r.k) } )
      ])).concat( h('div', {style:{clear: "both", width: "180px", height: "3px"}}) ))
    return h('div.vsmFrmRows', [
      h('strong', (e.type !== "submit" ? e.label + ": " : "")), 
      // (e.label ? h('br', { style: { clear:"both"}}) : ""),
      formEle,
      (vd.formObj.errors[e.name] ? h('div.formRowErrorMsg', vd.formObj.errors[e.name]) : ""),
      (e.name === "ltHrs" ? h('div.vsmFrmDaysHrs', { style: {top: "113px"}}, calcDaysHrs(vd.formObj[e.name] || frmObj[e.name])) : ""),
      (e.name === "ptHrs" ? h('div.vsmFrmDaysHrs', { style: {top: "146px"}}, calcDaysHrs(vd.formObj[e.name] || frmObj[e.name])) : "")
    ])
  })

  const formTag = h('form.formSubmit', { 
    style: { padding: "5px", color: "#333" },
    attrs: { onSubmit: "return false" }
  }, [...formArr, h('input.vsmFrmSub', { props: { type: "submit", value: (frmObj.id ? "Update" : "Create") }} )] )
 
  return h('div.vsmFrm', [
    exitX,
    h('div', vsmIObj.actid ? "Update Step: " + frmObj.name : " Create Action as Step " + (idx + 1)),
    formTag
  ])

}

function calcDaysHrs (num, inDays) {
  num = Number(num)
  if (inDays && num)
    return (num % inDays ? (num + inDays / 2) : num) + " Day" + (num === 1 || num === 1 - (inDays / 2) ? "" : "s")
  const days = parseInt(num)
  const hours = num % 1
  return (days ? days + " Day" + (days > 1 ? "s" : "") : "") + 
    (days && hours ? ", " : "") + 
    (hours ? (hours * 8) + " Hour" + (hours > 0.125 ? "s" : "")  : "")
}

