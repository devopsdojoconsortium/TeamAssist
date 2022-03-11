import {h} from '@cycle/dom';
import domtoimage from 'dom-to-image';
import {mutate} from '../frpHelpers';
import {formProps, hashSrc, inputSelList} from '../view';

export default function valueStreamDetail (mapKey, team, meta, vd) {

  if (mapKey === "newMap")
    return h('div.vsmContainer', [
      h('div.vsmHeader'), h('div', metaFrm(vd.settings.vsmObj, mapKey, vd) )  
    ])
  const snapShot = mapImage (vd.modalObj, mapKey) // will ignore whenever there is no cmd for this specific mapKey

  const actOpts = meta.formConfig.find(o => o.name === "actType").opts
  const cntrlObj = vd.sub1 && vd.sub1["meta_" + mapKey] || {}
  // const vsMap = vd.sub1 ? Object.keys(vd.sub1).map(i => vd.sub1[i]) : []
  const vsMap = cntrlObj.ord ? cntrlObj.ord.map(i => vd.sub1[i]) : []
  const editModeOpts = { discovery: "Discovery", correct: "Correction", track: "Track Improvements" } // from menuRoutes
  let outLen = 0

  const out = vsMap.filter(x => x.lTime).map((act, idx) => {
    const lt = Number(act.lTime) / (act.lTimeType === "mins" ? 480 : 1) // mins in 8 hour day
    const pt = Number(act.pTime) / (act.pTimeType === "mins" ? 480 : 1)
    const waitTime = lt - pt
    const ptLen = pt > 3 ? pt : 3
    const ltLen = waitTime + ptLen
    outLen++

    return h('div.vsmAction' + (idx % 2 ? ".sch_loose" : ""), { style: { width: (ltLen * 30) + 4 + "px"}},
      [
        h('div.vsmWait', { style: { width: (waitTime * 30) + "px"}}, 
          vsmFrm(vd.settings.vsmObj, mapKey, idx, act.id, ltLen, vd)
        ),
        h('div.vsmProcess', { style: { width: (ptLen * 30) + "px" }}, [
          h('br'),
          h('strong', "PT: " + calcDaysHrs(act.pTime, 0, act.pTimeType)),
        ]),
        h('div.vsmLegend', { style: { width: (ptLen * 30) + "px" }}, [
          h('h4', { attrs: {
            tooltip: "Action Type: " + actOpts[act.actType] + " ",
            tooltipPos: "bottom"            
          }}, act.name),
          h('div', [
            "LT: " + calcDaysHrs(act.lTime, 0.25, act.lTimeType), // 0.25 is only val that works in fn for now
            h('br'),
            "C&A: " + act.pctAcc + "%",
          ])
        ])
      ]
    )
  })
  .concat( h('div.vsmAction', vsmFrm(vd.settings.vsmObj, mapKey, outLen, '', '', vd) ))
  .concat( h('div.vsmAction', outLen > 1 ? summaryBox(vsMap.filter(x => x.lTime)) : "" ))

  return  h('div#vsm_' + mapKey + '.vsmContainer', [
    h('div.vsmHeader', [
      h('h2', [ h('span', "Map: "), (cntrlObj.name || "Current State") ]),
      cntrlObj.updateType && vd.settings.vsmObj && vd.settings.vsmObj.mapkey === mapKey ? 
        h('h2',  h('strong', "Edit Mode: " + editModeOpts[cntrlObj.updateType])) : "",
      h('div.clearBoth'),
      snapShot ? "" : h('h3#modal_vsmCapture_' + mapKey + '.la.la-camera.la-2x.vsmCapture.mClick'),
      cntrlObj.notes ? h('h3', [ h('span', "Notes: "), cntrlObj.notes ]) : "",
      cntrlObj.appStack ? h('h3', [ h('span', "Application: "), cntrlObj.appStack ]) : ""
    ]),
    h('div', { style: { width: "max-content"  }}, [ metaFrm(vd.settings.vsmObj, mapKey, vd), ...out] )  
  ])

}


function summaryBox (vsMap) {

  const accum = vsMap.reduce((acc, i) => {
    acc.lTime += Number(i.ltCalc)
    acc.pTime += Number(i.ptCalc)
    acc.pctAcc = (i.pctAcc / 100) * acc.pctAcc
    return acc
  }, { lTime: 0, pTime: 0, pctAcc: 1 })

  const out = h('div.vsmLegend', { style: { width: "215px", top: "-50px", right: "25px", color: "#333" }}, [
    h('h4', { style: { background: "#333" }, attrs: {
      tooltip: "Aggregating " + vsMap.length + " items... \n Process/Lead Ratio: " + 
      Math.ceil(accum.pTime / accum.lTime * 100) + "%",
      tooltipPos: "top"
    }}, "VSM Summary"),
    h('div', [
      h('b', "Lead Time: "), calcDaysHrs(accum.lTime), // 0.25 is only val that works in fn for now
      h('br'),
      h('b', "Process Time: "), calcDaysHrs(accum.pTime), 
      h('br'),
      h('b', "Wait/Lag Time: "), calcDaysHrs(accum.lTime - accum.pTime), 
      h('br'),
      h('b', "Comp & Acc: "),  Math.ceil(accum.pctAcc * 1000) / 10 + "%",
    ])
  ])

  return  [
    h('div.la.la-arrow-right', { style:{ 
      position: "absolute", top: "-15px", left: "-10px", fontSize:"2em", fontWeight: "bold" 
    }} ),
    h('div', { style: { width: "260px" } }, out)
  ]  
}


function metaFrm (vsmIObj, mapKey, vd) {
  let frmObj = vd.sub1 && vd.sub1["meta_" + mapKey] || {}
  if (vd.sub1 && vd.sub1[0] && vd.sub1[0].errorMessage) {
    frmObj = { name: "" }
  }
  else if (!frmObj && mapKey !== "newMap")
    return h('div', [
      h('img', { 
        style: {
          textAlign: "center", width: "375px", 
          marginLeft: Math.floor(Math.random() * 620) + "px"
        },
        attrs: {src: 'images/animation/ninjaPushButton.gif'}
      })
    ])
  const exitX = h('div#delProp_settings_vsmObj.mClick.la.la-close.upperRight')
  const formEleTypeMap = { checkbox: {top: "1px", left: "215px"}, number:{ width: "85px"} }

  const formArr = vd.rteObj.meta.metaFormConfig.map(e => {
    if (!e.type)
      return ""
    const formEleStyle = {}
    formEleStyle.style = formEleTypeMap[e.type] ? mutate(formEleTypeMap[e.type], {color: "#900"}) : {width: "180px"}
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
      (vd.formObj.errors[e.name] ? h('div.formRowErrorMsg', { style: {fontSize: "0.8em"}}, vd.formObj.errors[e.name]) : ""),
    ])
  })

  const formTag = h('form.formSubmit', { 
    style: { padding: "0 5px", color: "#333", minHeight: "218px"},
    attrs: { onSubmit: "return false" }
  }, [...formArr, h('input.vsmFrmSub', { props: { type: "submit", value: (frmObj.id ? "Update" : "Create") }} )] )
 

  const styleObj = { width: "330px", top: "0px", height: "1px"}
  let frmStyle = { top: "-110px", left: "0px", opacity: 1 }

  // console.log('vsmIObj, mapKey', vsmIObj, mapKey, styleObj)
  let triggerName = ""  
  if ((!vsmIObj || vsmIObj.mapkey !== mapKey) && mapKey === "newMap") {
    mutate(styleObj, { width: "31px", top: "-30px", height: "33px" })
    frmStyle = { top: "-75px", left: "-355px", opacity: "0" }
        
  }
  else if (!vsmIObj || vsmIObj.pos !== -1 || vsmIObj.mapkey !== mapKey){
    mutate(styleObj, { width: "120px", top: "-50px", height: "88px" })
    frmStyle = { top: "-75px", left: "-355px", opacity: "0" }
    triggerName = frmObj.trigger || "Set Your First Trigger Event!"
  }

  const vsmFrmEle = [ 
    h('div.vsmFrm', { style: frmStyle }, [
      exitX,
      h('div', "Update Map Meta Data"),
      formTag
    ]), 
    (triggerName ? h('h3.vsmTrigger', ["Trigger Event", h('span', triggerName)]) : 
      h('div.la.la-plus', { style:{ fontSize:"2.6em"}}) ), 
  ] 

  return h('div#vsmFrm.mClick.vsmMetaFrm', { style: styleObj, attrs: { mapkey: mapKey, pos: -1} }, [
    triggerName ? h('div.la.la-arrow-right', { style:{ 
      position: "absolute", top: "34px", right: "-14px", fontSize:"2em", fontWeight: "bold", color: "#999", zIndex: "-1" 
    }}) : "",
    h('div', vsmFrmEle) 
  ])

}


function vsmFrm (vsmIObj, mapKey, idx, actId, ltLen, vd) {
  const isNew = vd.sub1 && ((vd.sub1[0] && vd.sub1[0].errorMessage) || 
    (vd.sub1["meta_"+mapKey] && (!vd.sub1["meta_"+mapKey].ord || !vd.sub1["meta_"+mapKey].ord.length))) ? ".vsmStartShow" : ""
  if (!vsmIObj || idx !== vsmIObj.pos || mapKey !== vsmIObj.mapkey)
    return [
      h('div#vsmFrm.mClick.vsmFrmCallInsert' + isNew, { 
        attrs: { mapkey: mapKey, pos: idx, tooltip: "       Add / Insert Step " + (idx + 1), tooltipPos: "bottom" }
      }, h('div.la.la-plus', { 
        style:{ fontSize:"1.6em"}
      })),
      ltLen ? h('div#vsmFrm.mClick.vsmFrmCallEdit', { 
        style:{ width: (ltLen * 30) - 18 + "px" }, attrs: {actid: actId, mapkey: mapKey, pos: idx} 
      }, h('div.la.la-edit', { 
        style:{ left: (ltLen * 15) + "px", fontSize:"1.6em"}, attrs: {actid: actId, mapkey: mapKey, pos: idx} 
      })) : ""
    ]

  const mappedIcon = { mins: "hourglass", days: "calendar.blue" }

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
  const formEleTypeMap = { checkbox: {top: "1px", left: "215px"}, number:{ width: "70px"} }
  const mappedIconFontSize = { chall: "2em", chr: "2.1em", cons: "2em" }
  const editAct = frmObj.id ? { label: "Delete Item?", type: "checkbox", name: "deleteIt", value: "1" } : {}
  const formArr = vd.rteObj.meta.formConfig.concat(editAct).map(e => {
    if (!e.type)
      return ""
    const formEleStyle = {}
    formEleStyle.style = formEleTypeMap[e.type] ? mutate(formEleTypeMap[e.type], {color: "#900"}) : {width: "180px"}
    formEleStyle.style.border = e.req ? "2px solid #666" : "2px solid #aaa"
    const optsSrc = e.opts ? hashSrc(vd, e.opts) : ""
    const opts = optsSrc ? Object.keys(optsSrc).map(k => ( { k: k, v: optsSrc[k] } )) : ""
    let formEle = opts ? 
      inputSelList( e.name, frmObj[e.name], ["", ...opts], "keyInput", 
        formEleStyle.style, e.numIndex, { title: e.title }) :
      h('input.keyInput', mutate(formEleStyle, { attrs: formProps(e, frmObj[e.name]) }))
    // console.log('formProps(e, frmObj[e.name])', e.req, formProps(e, frmObj[e.name]), e)
    // console.log('e.opts, optsSrc, opts', e.opts, optsSrc, opts)
    if (e.name === "lTime" || e.name === "pTime") {
      const nameExt = e.name + "Type"
      let stepsToggle = (vd.formObj[nameExt] === "mins" || (!vd.formObj[nameExt] && frmObj[nameExt] === "mins")) ? { 
        min: 1, max: 120, step: 1
      } : {} 
      const iconToggle = stepsToggle.step ? "mins" : "days"
      if (!stepsToggle.step && vd.formObj[e.name] >= 5) // 5 days or more, no need to incr on hours
        stepsToggle = { min: 1, step: 1 }
      console.log('vd.formObj[e.name] || frmObj[e.name], stepsToggle', vd.formObj[e.name], frmObj[e.name], stepsToggle)
      const mutatedFrmEle = { attrs: mutate(formProps(e, frmObj[e.name]), stepsToggle) }
      formEle = h('div.vsmFrmRowsWrap', [
        h('input.keyInput', mutate(formEleStyle, mutatedFrmEle )),
        h('div.vsmFrmDaysHrs', calcDaysHrs(vd.formObj[e.name] || frmObj[e.name], 0, vd.formObj[nameExt] || frmObj[nameExt])),
        h('div#timeType_' + nameExt + '_' + iconToggle + '.vsmFrmRowsIcon.mClick.fa.fa-' + mappedIcon[iconToggle], { style:{ fontSize: "0.8em" }})
      ])
    }
    else if (e.type === "hidden"){
      return h('input.keyInput', { props: formProps(mutate(e, {value: vd.formObj[e.name] || frmObj[e.name]} )) } )
    }
    else if (e.type === "radio" && opts)
      formEle = h('div', { style: {float: "right"}}, opts.map(r => h('div', {style: {float: "left", margin: "0 12px"}}, [ 
        h('label.fa.fa-' + mappedIcon[r.k], {style:{cursor:"pointer", fontSize:mappedIconFontSize[r.k]}, attrs: {"for": r.k, title: r.v}}), " ",
        h('input#' + r.k + '.keyInput', { props: formProps(mutate(e, {value: frmObj[e.name], title: r.v}), r.k) } )
      ])).concat( h('div', {style:{clear: "both", width: "180px", height: "3px"}}) ))
    return h('div.vsmFrmRows', [
      h('strong', keyValsTT(e) , (e.type !== "submit" ? e.label + ": " : "")), 
      formEle,
      (vd.formObj.errors[e.name] ? h('div.formRowErrorMsg', { style: {fontSize: "0.8em"}}, vd.formObj.errors[e.name]) : ""),
    ])
  })

  const formTag = h('form.formSubmit', { 
    style: { padding: "5px", color: "#333", overflow: "visible"  },
    attrs: { onSubmit: "return false" }
  }, [...formArr, h('input.vsmFrmSub', { props: { type: "submit", value: (frmObj.id ? "Update" : "Create") }} )] )
 
  return h('div.vsmFrm', [
    exitX,
    h('div', vsmIObj.actid ? "Update Step: " + frmObj.name : " Create Action as Step " + (idx + 1)),
    formTag
  ])

}

function keyValsTT (e) {
  const tips = {
    lTime: "From receipt to complete! \n\nThe total time of step from inception to passing along to the next step.",
    pTime: "The actual time taken to work the process step. \n\n(subset of Lead Time)",
    pctAcc: "% Complete and Accurate. \n\nThe percentage of completeness based on absence of rework, as reported from subsequent steps in the value stream"
  }
  return e.name && tips[e.name] ? { attrs: { tooltip: tips[e.name], tooltipPos: "top" }} : {}
}

function calcDaysHrs (num, inDays, inMins) {
  num = Number(num)
  if (inMins === "mins" && num)
    return (num % inDays ? (num + inDays / 2) : num) + " Minute" + (num === 1 || num === 1 - (inDays / 2) ? "" : "s")
  if (inDays && num)
    return (num % inDays ? (num + inDays / 2) : num) + " Day" + (num === 1 || num === 1 - (inDays / 2) ? "" : "s")
  const days = parseInt(num)
  const hours = num % 1
  return (days ? days + " Day" + (days > 1 ? "s" : "") : "") + 
    (days && hours ? ", " : "") + 
    (hours ? (Math.ceil(hours * 8 * 100) / 100) + " Hour" + (hours > 0.125 ? "s" : "")  : "")
}

function mapImage (modalObj, mapKey) {
  if(!modalObj.type === "vsmCapture" || modalObj.field !== mapKey)
    return ""

  domtoimage.toPng(document.getElementById('vsm_' + mapKey), {bgcolor: "#ffffff"}) // style: { transform: "scale(1.2)" }
    .then(function (dataUrl) {
        // var img = new Image();
        // img.src = dataUrl;
        document.getElementById('vsmFill').src = dataUrl;
    })
    .catch(function (error) {
        console.error('oops, something went wrong!', error);
    })

  return 1
}
