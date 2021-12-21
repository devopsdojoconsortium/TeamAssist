import {h} from '@cycle/dom';
import {benchMark, range, dateFormat, minToDateFormat, mutate, trimObj} from './frpHelpers';
import $ from "jquery";
import {loginLevels, ttLocs, statusColors}  from './uiConfig';
import mdModal from './view/viewMarkdownModal';
import valueStreamDetail from './view/valueStreamMapper';
import teamDetail from './view/viewTeamDetail';
import priorsModal from './view/viewPriorsModal';
import exportModal from './view/excelExportModal';
import markdownRender from './view/viewMarkdownRender';

const panelObj = { 
  Home: function (rteObj, vd){
    const locs = vd.settings.ttLoc && vd.settings.ttLoc.length ? vd.settings.ttLoc : ["ct", "vr"]
    const metaMap = {
      ct: {
        title: "TeamAssist at Connecticut Campus",
        confluenceUrl: "https://confluence.com", 
        activitiesImg: "./images/posters/null.jpg",
        activitiesUrl: "https://goo.gl/forms/sample",
      },
      vr: {
        title: "The Virtual TeamAssist (VoJo)",
        confluenceUrl: "https://confluence.com", 
        activitiesImg: "./images/posters/virtualWarriorsArentMade.jpg",
        activitiesUrl: "https://confluence.com"
      }
    }
    const divWidth = 94 / locs.length
    return h('div', { style: {width: "100%", height: "auto", clear: "both" }}, locs.map(l => {
      const activities = metaMap[l].activitiesImg ? h('img', { 
        props: { src: metaMap[l].activitiesImg },
        style: { width: "99%", height: "auto" }
      }) : ""
      return h('div', { style: { float: "left", width: divWidth + "%", minHeight: "600px", padding: 0, margin: "10px 5px", textAlign: "center", border: "3px solid #000"}}, [
        h('div', { style: { background: "#fff", padding: "4px", clear: "both"}}, [ 
          h('img#setting_ttLoc_' + l + '.locIconImg.ttLocSel.mClick', { 
            attrs: { src: 'images/dojo_' + l.toUpperCase() + '_icon.png', align: 'absmiddle'},
            style: { float: "left"}
          }) 
        ]),
        h('h3', metaMap[l].title),
        metaMap[l].confluenceUrl ? h('a', { 
          props: { href: metaMap[l].confluenceUrl, target: "outTeamAssist" }
        }, "Confluence Page") : "", 
        h('br'), h('br'),
        metaMap[l].activitiesUrl ? h('a', { 
          props: {href: metaMap[l].activitiesUrl, target: "outTeamAssist"}
        }, activities) : ""
      ])
    }))
  },
  sampleHtml: h('div', { style: {fontSize: "22px"}}, [
    h('H3', "This is an H3 tag, vs <H3>header text</H3>."),
    h('div', "Users: TTrek developers and operators"), h('br'),
    h('div.djvSubHead', "div tag with a class"),
    h('div', { style: {  margin: "6px", fontSize: "0.8em"}}, "div tag with style obj"),
    h('h3', "Font Awesome testing and feedback"),
    h('div', "See the camera? also has mClick and ID, as used in our tables, etc."),
    h('b#schPrev.mClick.thSchedToggle.la.la-camera-retro.la-3x', " "),
    h('div', "various spinners under consideration.."),
    h('b.la.la-spinner.la-pulse.la-3x.la-fw', ""),
    h('b.la.la-spinner.la-spin.la-3x.la-fw', ""),
    h('b.la.la-circle-o-notch.la-spin.la-3x.la-fw', ""),
    h('b.la.la-refresh.la-spin.la-3x', ""),
    h('b.la.la-cog.la-spin.la-3x.la-fw', ""),
    h('b.la.la-snowflake-o.la-spin.la-4x.la-fw', ""),
    h('b.la.la-ravelry.la-spin.la-5x.la-fw', ""),
  ]),
  teamReports: function (rObj, vd, panelHeight, panelWidth){
    // add and adjust for each table!
    if (rObj.meta.blockIt)
      return rObj.meta.blockIt

    const locs = vd.rteObj.meta.tableParams.cols[0].hashMap
    const statii = vd.rteObj.meta.tableParams.statusCols[0].hashMap

    const colParamsObj = {
      totals: vd.rteObj.meta.tableParams.statusCols.filter((x, idx) => idx === 0)
        .concat(Object.keys(locs).map(i => ({ dKey: i, label: locs[i] })))
        .concat( [{ dKey: "colTotals", label: "Grand Total", tdStyle: "larger2m" }] ),
      status: vd.rteObj.meta.tableParams.statusCols,
      ttLoc: vd.rteObj.meta.tableParams.cols      
    } 
    const pivotKey = vd.settings.homePivot || "totals"
    const colParams = colParamsObj[pivotKey]

    let newList = []
    if (pivotKey === "totals"){
      newList = listObjReduceCounts(vd.list, "status", "ttLoc", statii)
    }
    else if (pivotKey === "status")
      newList = listObjReduceGroup(vd.list, "status", "ttLoc", ["project"])
    else if (pivotKey === "ttLoc")
      newList = listObjReduceGroup(vd.list, "ttLoc", "status", ["project"])

    console.log('newObj :::: newList', newList)
    return h('div.homeContainer', [
      labelTable( [
        { label: "No of Active Leads:", val: (vd.list && vd.list[0] && vd.list[0].ImportedSubDMA ? vd.list[0].ImportedSubDMA : "-") }, 
        { label: "Charters Scheduled:", val: (vd.list && vd.list[0] && vd.list[0].ImportedSubDMA ? vd.list[0].ImportedSubDMA : "-") }, 
        { label: "Active Challenge Teams:", val: (vd.list && vd.list[0] && vd.list[0].ImportedSubDMA ? vd.list[0].ImportedSubDMA : "-") }, 
        { label: "No of Teams in Prep:", val: (vd.list && vd.list[0] && vd.list[0].ImportedSubDMA ? vd.list[0].ImportedSubDMA : "-") }, 
        { label: "Challenge Scheduled:", val: (vd.list && vd.list[0] && vd.list[0].ImportedSubDMA ? vd.list[0].ImportedSubDMA : "-") }, 
        { label: "Teams in Followup:", val: (vd.list && vd.list[0] && vd.list[0].ImportedSubDMA ? vd.list[0].ImportedSubDMA : "-") }
      ], 3), 
      h('div.sectionLabel', [
        h('span.teams_icon', { style: { 
          float: "left", width: "50px", height: "35px", margin: "-9px 15px 0 5px" 
        }}), "Team Pivot Tables"
      ]),
      tableFilters(vd),
      tableGrid(vd, panelHeight, panelWidth, (newList.length ? newList : vd.list), { cols: colParams })
    ])
  },
  tableDefault: function (rObj, vd, panelHeight, panelWidth){
    if (rObj.meta.blockIt)
      return rObj.meta.blockIt
    return  h('div.tableContainer', [
      tableTabs(vd), 
      tableFilters(vd),
      tableGrid(vd, panelHeight, panelWidth)
    ])
  },
  Report: function (rteObj, vd, panelHeight, panelWidth){
    // rteObj.iframe = "file:///mockData/" + rteObj.iframe;
    console.log('Report panelHeight, panelWidth ', panelHeight, panelWidth);
    const tp = rteObj.meta.tableParams;
    if (rteObj.meta.blockIt)
      return rteObj.meta.blockIt
    return  h('div', [
      h('b', (rteObj.panel || "Report will load in iFrame")), h('p'),
      h('form', {
        props: { 
          target: "reportFrame", method: "POST", 
          action: "https://cloudpath.futureReportLink.php"
        },
        style: { clear: "both"}
      }, [ 
        (tp.filtersExtra ? h('div', tableExtraFilters(vd, tp.filtersExtra) ) : ""),
        h('div.GrayTxt.formFloat', [ 
          h('br'),
          h('input#btnGO.InputButton.mClick', { 
            style: {width: '95px', margin: "0 8px 0 0", color: '#000'},
            attrs: {type: 'submit', value: 'Run Report'}
          })      
        ]),
      ]),
      h('iframe', { props: { 
        name: "reportFrame",
        width: (panelWidth ? panelWidth  : 1100) + "px", 
        height: (panelHeight ? panelHeight + 75 : 855) + "px", 
        src: "placeholder.html", 
        scrolling: "yes" },
        style: { background: "#f4f5f7" }
      })
    ])
  },
  iFrame: function (rteObj, vd, panelHeight){
    // rteObj.iframe = "file:///mockData/" + rteObj.iframe;
    return  h('div', [
      h('b', (rteObj.panel || "Needs Description in menuJson")), h('p'),
      h('iframe', { props: { width: "860px", height: (panelHeight ? panelHeight - 66 : 555) + "px", 
        src: rteObj.iframe, scrolling: "yes" },
        style: { background: "#fff" }
      })
    ])
  },
  formPanel: function (rteObj, vd, panelHeight){
    // console.log('rteObj, panelHeight', rteObj, panelHeight)
    return  h('div', { style: { position: "relative" }}, [
      rteObj.details && rteObj.meta.routeKey === "modTeam" ? h('a.la.la-book.la-3x.tableIconLink', {
        attrs: { href: "#/teams/id/" + rteObj.details.id },
        style: { position: "absolute", top: "11px", right: "48px", width: "30px", textDecoration: "none"}
      }, "") : "",
      // h('b', (rteObj.meta.panel || "Needs Description in menuJson")), h('p'),
      rteObj.meta.blockIt ? rteObj.meta.blockIt : modForm(rteObj, vd, panelHeight)
    ])
  },
  teamPanel: function (rteObj, vd){
    const team = rteObj.details || {}
    return  h('div', { style: { position: "relative", textAlign: "center" }}, [
      h('h1', (team.project || "") + " Details"),
      h('a.la.la-map.la-3x.tableIconLink', {
        attrs: { href: "#/vsm/id/" + team.id, title: "Value Stream Map" },
        style: { position: "absolute", top: "3px", right: "75px", width: "30px", textDecoration: "none"}
      }, h('sup', {style: {fontSize: "0.6em"}}, "VSM")),
      rteObj.meta.blockIt ? rteObj.meta.blockIt : teamDetail(team, rteObj.meta, vd)
    ])
  },
  valueStream: function (rteObj, vd){
    const team = rteObj.details || {}
    const vsmMaps = vd.sub1 && vd.sub1.maps && vd.sub1.maps.ord || ["current"]
    return  h('div', { style: { position: "relative", textAlign: "center" }}, [
      h('h1', " Value Stream Mapping"),
      h('a.la.la-edit.la-3x.tableIconLink', {
        attrs: { href: "#/teams/modTeam/pane_weeklies/id/" + team.id },
        style: { position: "absolute", top: "3px", right: "45px", width: "30px", textDecoration: "none"}
      }, ""),
      h('div', 
        rteObj.meta.blockIt ? rteObj.meta.blockIt : 
          vsmMaps.map(i => valueStreamDetail(i, team, rteObj.meta, vd)).concat(valueStreamDetail("newMap", "", "", vd))
      )
    ])
  },
  restream: function (rteObj, vd, panelHeight){
    // const meta = rteObj.meta
    const dump = vd.cntrl.dump 
    return  h('div', { style: { height: (panelHeight - 30) + "px" }}, [
      h('div.hey', [
        h('strong', "Select Dump Events, and use event filters if needed. The other restream options are a future feature")
      ]),
      tableTabs(vd, { style: { margin: "0 0 0 85px" }}), 
      h('div', { style: { position: "relative", margin: "35px"}}, 
        modForm(rteObj, vd, panelHeight)
      ),
      dump ? h('textarea', {style: {
        position: "absolute", right: "40px",
        width: "520px", height: "520px"
      }}, JSON.stringify(dump, 0 , 2) ) : ""
    ])
  },
  subSel: h('i', "Select a sub menu")
};

// listObj reducer for pivot Tables for Counts
function listObjReduceCounts (listObj, rowKey, colKey, rowKeyObj){
  const newObj = listObj.reduce((obj, i) => {
    // console.log( 'st[i[rowKey]][i[colKey]]', i[rowKey], i[colKey])
    if (i[rowKey] && i[colKey]){
      obj[i[rowKey]][i[colKey]] = obj[i[rowKey]][i[colKey]] ? obj[i[rowKey]][i[colKey]] + 1 : 1
      obj[i[rowKey]].colTotals = obj[i[rowKey]].colTotals ? obj[i[rowKey]].colTotals + 1 : 1
    }
    return obj
  }, Object.keys(rowKeyObj).reduce((acc, s) => {
    acc[s] = {}
    return acc
  }, {}))
  const rowtotals = {}
  const newList = Object.keys(newObj).map(gKey => {
    Object.keys(newObj[gKey]).forEach(k => {
      rowtotals[k] = Number((rowtotals[k] || 0) + newObj[gKey][k])
    })
    return mutate(newObj[gKey], { [rowKey]: gKey })
  })
  rowtotals[rowKey] = "Grand Totals"
  newList.push(rowtotals)
  return newList
}

// listObj reducer for pivot Tables for Counts
function listObjReduceGroup (listObj, rowKey, colKey, groupOuts){
  const newObj = listObj.reduce((obj, i) => {
    // console.log( 'st[i[rowKey]][i[colKey]]', i[rowKey], i[colKey])
    if (i[rowKey] && i[colKey]){
      if (!obj[i[rowKey]])
        obj[i[rowKey]] = {}
      if (!obj[i[rowKey]][i[colKey]])
        obj[i[rowKey]][i[colKey]] = []
      obj[i[rowKey]][i[colKey]].push( trimObj(i, groupOuts))
    }
    return obj
  }, {})
  const newList = Object.keys(newObj).map(gKey => {
    return mutate(newObj[gKey], { [rowKey]: gKey })
  })
//  rowtotals[rowKey] = "Grand Totals"
//  newList.push(rowtotals)
  return newList
}

// small piece renderers
function panelHeader (rObj) {  
  const iconMap = {
    home: "bullhorn",
    schedule: "calendar",
    teams: "users",
    modTeam: "edit",
    teamLeads: "leaf",
    teamReports: "bar-chart",
    teamsCompleted: "graduation-cap",
    teamsAllStatii: "cubes",
    users: "user-secret",
    modUser: "user-secret",
    vsm: "map"
  }
  return   h('div.panelHeader', [
    h('div.iconSprite', [
      h('div.la.la-' + (iconMap[rObj.meta.routeKey] || "flask") + '.la-4x.blue')
    ]), 
    h('h2.panelTitle', rObj.meta.name + (rObj.details ? 
      " - " + (rObj.details.project || rObj.details.displayName || "") : 
      "")
    )
  ])
}

function tableTabs (vd, elementObj = {}) {
  if (vd.menu.tabs.length < 1)
    return "";
  const routeKey = vd.rteObj.meta.routeKey; // get last in route
  const pagePath = vd.rteObj.meta.routeChain.filter(x => x !== routeKey || routeKey === vd.rteObj.meta.pageKey);
  // console.log('pagePath', pagePath, vd.rteObj.meta);
  const countMark = vd.totRows.list > 1 ? ' (' + vd.totRows.list + ')' : '';
  return  h('ul.menuUl', elementObj, vd.menu.tabs.map((ti, i) => { 
    const tiSelClass = ti.key === routeKey || (!ti.key && routeKey === vd.rteObj.meta.pageKey) ? ".menuSel" : ""
    return h('li.menuLi.tableTabs' + tiSelClass, { }, 
      h('a', { 
        attrs: { href: "#/" + pagePath.join("/") + (ti.key ? "/" + ti.key : "") },
        style: { borderBottom: (ti.color ? "3px solid " + ti.color : "transparent")}
      }, ti.name + ( tiSelClass ? countMark : ""))
    )
  }));
}


function formProps (e, val) {
  const allowed = ["type", "name", "min", "max", "maxlength", "disabled", 
    "rows", "cols", "title", "placeholder", "size", "step"]
  // console.log("e, val, e, val ------------------------------------", e, val)
  return allowed.filter(x => e[x] || e[x] === 0)
    .concat("value").reduce((acc, i) => {
      if (i === "value" && acc.type === "date" && val && !isNaN(val))
        val = minToDateFormat(val, "YYYY-MM-DD")
      else if (i === "value" && acc.type === "datetime-local" && val && !isNaN(val))
        val = minToDateFormat(val, "YYYY-MM-DDTHH:mm:ss")
      else if (i === "value" && (acc.type === "radio" || acc.type === "checkbox") && val)
        acc.checked = e[i] == val // ignore lint on == 
      acc[i] = i === "value" ? (val || e[i] || "") : e[i]
      return acc
    }, {})
}

function modForm (rteObj, vd, panelHeight) {
  const panes = []
  const elements = []
  const activeEles = {}
  let activePane = 0
  rteObj.meta.formConfig.forEach(e => {
    if (e.pane && (e.name === vd.formObj.activePane || (!vd.formObj.activePane && panes.length === 0))){
      panes.push({ active: true, name: e.name, label: e.pane, color: e.color })
      activePane = 1
    }
    else if (e.pane){
      panes.push({ name: e.name, label: e.pane, fConfig: [], color: e.color })
      activePane = 0      
    }
    else if (activePane)
      activeEles[e.name] = e.type
    else if (panes.length)
      panes[panes.length - 1].fConfig.push(e)
    if (!e.pane)
      elements.push(e)
  })
  const buttonText = rteObj.meta.buttonText
  // const loginLevels = ["Welcome", "Visitor", "Team Member", "TeamAssist Coach", "TeamAssist Admin", "System Admin"]
  const loginLevelsColors = ["#ffffff", "#ffffff", "#193ABA", "#199A19",    "#F88B22",   "#D9141B"] 
  const detailObj = rteObj.details || {}
  const formRowHeightMap = { textarea: "auto", checkbox: "37px", radio: "33px" }
  const formEleTypeMap = { checkbox: {top: "1px", left: "215px"}, radio:{top: "1px", left: "135px"} }
  const formArr = elements.concat({ type: "submit", value: (buttonText || rteObj.meta.name) }).map(e => {
    const formEleStyle = {}
    formEleStyle.style = formEleTypeMap[e.type] ? mutate(formEleTypeMap[e.type], {width: "33px"}) : {}
    if (e.accessLevel){
      formEleStyle.style.border = "2px solid " + loginLevelsColors[e.accessLevel]
      e.title += " This field is only editable by a " + loginLevels[e.accessLevel] + " or greater."
    }
    else if (e.req)
      formEleStyle.style.border = "2px solid #171717"
    const optsSrc = e.opts ? hashSrc(vd, e.opts) : ""
    const opts = (e.type === "select" && e.opts) ?
      Object.keys(optsSrc).map(k => {
        return { k: k, v: optsSrc[k] }
      }) : ""
    let formEle = opts ? 
      inputSelList( e.name, detailObj[e.name], ["", ...opts], "keyInput", 
        formEleStyle.style, e.numIndex, { title: e.title }) :
      h('input.keyInput', mutate(formEleStyle, { props: formProps(e, detailObj[e.name]) }))
    let journalEle = ""
    let markdownIcons = []
    if (e.type === "range"){
      const curVal = vd.formObj[e.name] ||  detailObj[e.name] || 0
      journalEle = h('div.rangeValue', e.title ? e.title.replace(/__/, curVal) : curVal) 
    }
    else if (e.type === "checkbox" && e.title){
      journalEle = h('div.rangeValue', {style: {background: "none", border: "none", fontWeight: "normal"}}, 
        e.title) 
    }
    else if (e.type === "textarea"){
      if (typeof e.journal === "object" && e.journal.length)
        journalEle = h('div.journalAbs', e.journal.map(e => h('div.cellDiv', [ 
          markdownRender(e.val),
          h('small', minToDateFormat(e.asOfStamp || e.eStamp, "MM/DD/YY HH:mm")),
          h('small', e.user && hashSrc(vd, "coachers")[e.user] ? " | " + hashSrc(vd, "coachers")[e.user] :
            (e.user ? " | " + e.user : ""))
        ]))) 
      if (e.journal || e.markDown)
        markdownIcons = markdownIcon(e, vd.modalObj)
      formEle = h('textarea#' + e.name + '.keyTAInput', { 
        style: formEleStyle, 
        attrs: formProps(e),
        props: { placeholder: journalEle ? "Add new notes, priors are on the right." : ""}
      }, journalEle ? "" : (detailObj[e.name] || ""))
    }
    const formRowStyle = { style: {height: "0px"} } // default hide
    const tooltipObj = { style: {}}
    if (activeEles[e.name] || e.type === "submit" || !panes.length) {
      formRowStyle.style = (formRowHeightMap[e.type] ? { height: formRowHeightMap[e.type]} : {}) 
      if (e.tooltip) {
        formRowStyle.style.overflow = "visible"
        tooltipObj.attrs = { tooltip: e.tooltip, tooltipPos: ( e.tooltipPos || "bottom") }
      }
    }
    return h('div.formRow.easeAll', formRowStyle, [
      h('label', (e.type !== "submit" ? (e.label || e.name) : "")), 
      (e.tooltip ? h('div.tableIconLink.infoCircle', tooltipObj, h('div.la.la-info-circle.la-2x')) : ""),
      (e.type !== "submit" ? h('br') : ""),
      formEle, journalEle, ...markdownIcons,

      (vd.formObj.errors[e.name] ? h('div.formRowErrorMsg', vd.formObj.errors[e.name]) : ""),
      (vd.formObj.errors.submit && e.type === "submit" ? h('div.formRowErrorMsg', vd.formObj.errors.submit) : ""),
    ])
  })
  const formTag = h('form.formSubmit', { attrs: { onSubmit: "return false" },
    style: { height: (panelHeight ? (panelHeight - 15) : 395) + "px" }
  }, formArr)
  let offset = 0
  let activePaneObj = {}
  const inactiveW = panelHeight + 7
  return h('div.formPaneContainer', panes.map((p, idx) => {
    if (p.active){
      offset = offset + 710 + (idx * 47)
      activePaneObj = p
      return ""
    }
    offset = offset + (p.active ? 710 + (idx * 47) : 0)
    return h('div#formObj_activePane_' + p.name + '.formPaneInactive.mClick.clickBg', 
      { style: {
        zIndex: String(idx * (offset ? -1 : 1)), 
        left: (offset ? 710 - 47 : 0) + (idx * 47) + "px", 
        marginLeft: (offset ? "0px" : (inactiveW - 47) * -1 + "px"),
        width: inactiveW + "px",
        transform: "rotate(" + (offset ? 90 : 270) + "deg)",
        transformOrigin: (offset ? "bottom left" : "bottom right")
      }}, 
      [ h('h3', { style: { background: (p.color || "#888") }}, p.label) ]
      .concat(p.fConfig.map(fo => {
        const labClass = (vd.formObj.errors[fo.name] ? ".redBg" : vd.formObj[fo.name] ? ".greenBg" : "")
        return h('span' + labClass, fo.label)
      }))
    )
  })
  .concat(h('div.formPaneActive.easeAll', { style: {left: ((offset ? offset : 710) - 710) + 'px'}}, [ 
    h('h2', { style:{ 
      borderBottom: "5px solid " + (activePaneObj.color || "#888")
    }}, activePaneObj.label), formTag // had to move this out of panes map loop to enable transition animations
  ])))
}

function markdownIcon (ele, modalObj){
  // console.log(ele)
  const active = modalObj.type && modalObj.field === ele.name ? ".mdHelpIconActive" : ""
  return [ 
      h("div#modal_mdHelp_" + ele.name + ".mdHelpIcon" + active + ".mClick", " Previewer"),
      ele.tmplLoader ? h("div#mdTmpl_" + ele.name + ".mdTmplBtn.mClick", "Load Template") : ""
    ]
}

function inputSelList (action, sel, options, goClass = "filterChange", style, numIndex, inProps) {
  return  h('select.' + goClass, { 
    style: (style || {}),
    props: mutate(inProps, { name: action })
  }, options.map(o => {
    const truKey = isNaN(o.k) || numIndex ? o.k : o.v
    return h('option', { 
      props: { value: truKey, selected: (truKey === sel)}
    }, o.v) 
  }));
}

function dateForm (label, key, val, range) {
  const rangeStr = range ? range.join("|") : "";
  return h('div.GrayTxt.formFloat.posRelative', { 
    attrs: {width: 115, height: 57, nowrap: 'nowrap', align: 'left'}
  }, [
    h('div', label), 
    h('input#' + key + '.CMInputText', { 
      style: {'width': '62px', 'fontSize': '11px'},
      attrs: {type: 'text', value: val, placeholder: '[mm/dd/yyyy]',
        onblur: "isValidDate(this, " + key + ", 'mm/dd/yyyy', '" + rangeStr + "', '" + val + "'); return false;"}
    }), 
    h('img#calendar' + key + '.mClick', { 
      attrs: {src: 'images/GUI/Img-IconCal.gif', width: 38, height: 23, border: 0, align: 'absmiddle', 
        onclick: "showCalendar(this, " + key + ", 'mm/dd/yyyy', null, '" + rangeStr + "', -1, -1); return false;"}
    })
  ])
}

function tableExtraFilters (vd, filtersObj) {
  const objList = Object.keys(filtersObj);
  const outDivs = [];
  objList.forEach(f => {
    if (f === "dateRange"){
      const dateArr = filtersObj[f];
      const rangeLimits = filtersObj["dateRangeLimits"];
      outDivs.push( dateForm("Start Date", "startDate", dateFormat(dateArr[0]), rangeLimits ));
      if (dateArr.length === 2)
        outDivs.push( dateForm("End Date", "endDate", dateFormat(dateArr[1]), rangeLimits ));
      outDivs.push( h('div.GrayTxt.formFloat', [
        h('br'),
        h('input#btnGO.InputButton.mClick', { 
          style: {'width': '45px', margin: "0 8px 0 0", color: '#000'},
          attrs: {type: 'button', value: 'GO'}
        })
      ]));
    }
    else { 
      const ddObj = filtersObj[f];  // dd: { dKey: "status", label: "Status", opts: ttLocs, width: 100 }} 
      const lim = vd.rteObj.meta && vd.rteObj.meta.hardFilt && vd.rteObj.meta.hardFilt[ddObj.dKey] || []
      const optsSrc = hashSrc(vd, ddObj.opts)
      const opts = Object.keys(optsSrc).filter(x => !lim.length || lim.some(s => s == x)).map(k => { // ignore ==
        return { k: k, v: optsSrc[k] }
      });
      outDivs.push( h('div.GrayTxt.formFloat', [
        h('div', ddObj.label), 
        inputSelList( ddObj.dKey, (vd.tRowCntrl[ddObj.dKey] || ""), ["", ...opts], undefined, { margin: "3px 0", width: (ddObj.width || 80) + "px" }, ddObj.numIndex ),
      ]));
    }
  });
  return outDivs;
}

function tableKeywordFilter (vd, searchCol) {
  // we'll need a field list to search on and put in placeholder txt
  if (!searchCol || typeof searchCol !== "object" || !searchCol[0])
    return "";
  const idSearch = vd.rteObj.meta.pageKey //  common sticky ID for all tabs within page
  const labelArray = vd.rteObj.meta.tableParams.cols.filter(x => searchCol.some(s => s === x.dKey)).map(l => l.label)
  const searchColString =  "Matches on: \n - " + labelArray.join("\n - ") + " \n (overrides other filters)"
  return h('div.tableKeywordFilter', { attrs: { tooltip: searchColString, tooltipPos: "top" }},  [
    h('input#searchKey_' + idSearch + '.tFilterInput.easeAll', { 
      style: { width: '250px', display: 'inline'},
      props: { placeholder: " Filter by Keyword",  value: (vd.tRowCntrl.keyWord || "")}
    }), 
  ]);
}
function tablePagingFilter (vd) {
  // console.log(rteObj);
  const tp = vd.rteObj.meta.tableParams;
  if (tp.filtersPage.specialRange[0] >= 500)
    return ""
  const perPageOpts = tp.filtersPage.specialRange.map(k => {
    return { k: k, v: 'View ' + k + ' per page'}
  });
  // vd.settings.pageLimit = 6;
  let offsetOpts = [{ k: "", v: 'This is Page 1 of 1'}];
  if (vd.totRows.list > vd.settings.pageLimit){
    const pageCnt = Math.ceil(vd.totRows.list / vd.settings.pageLimit);
    offsetOpts = range(pageCnt).map(i => {
      const mult = i * vd.settings.pageLimit;
      const lastNum = vd.totRows.list < (mult + vd.settings.pageLimit) ? vd.totRows.list : mult + vd.settings.pageLimit;
      return { k: mult, v: 'Page ' + (i + 1) + ' (' + (mult + 1) + ' - ' + lastNum + ')'}
    });
  }
  return  h('div.tablePagingFilter', [
    h('div#modal_export.mClick.blue', { style: {float: "left", margin: "4px 10px"} }, "Export to Excel"),
    inputSelList( "filterLimit", (vd.settings.pageLimit || 40), perPageOpts, undefined, { float: "left", margin: "4px 10px" }, true ),
    inputSelList( "filterOffset", 0, offsetOpts, undefined, { float: "left", margin: "4px 10px" }, true ),
  ]);
}

function tableFilters (vd) {
  const meta = vd.rteObj.meta;
  const tp = meta.tableParams;
  if (meta.tmpPanel) // data dumps and loading msgs
    return meta.tmpPanel;
  const extraFilters = tp.filtersExtra ? h('div.tableExtraFilters', tableExtraFilters(vd, tp.filtersExtra) ) : "";
  const pageFilters = tp.filtersPage ? h('div.tablePageFilters', [
    tableKeywordFilter(vd, tp.filtersPage.searchCol),
    extraFilters,
    tablePagingFilter(vd),
  ]) : "";
  return h('div', {style: { clear: "both"}}, [ pageFilters ]);
}

function hashSrc (vd, opts) {
  return typeof opts === "string" ? (vd.dynHashes[opts] || { noKey: "loading..." }) : opts
}

const mappedIcon = { chall: "sticky-note.orange", chr: "sitemap.green", cons: "handshake-o.blue" }

function tableGrid (vd, panelHeight, panelWidth, tableRows, tableParams) {
  // console.log('panelHeight, panelWidth', panelHeight, panelWidth);
  if (vd.cntrl.loading)
    return h('div.tableGridContainer.tableGridHighlight', [
      h('img', { 
        style: {
          textAlign: "center", width: "450px", 
          marginLeft: Math.floor(Math.random() * 620) + "px"
        },
        attrs: {src: 'images/animation/ninjaPushButton.gif'}
      })
    ])
  const tp = tableParams || vd.rteObj.meta.tableParams;  // favor generic input, default to tableDefault tableConfig && vd.list
  const list = tableRows || vd.list;
  if (list.length === 1 && list[0].errorMessage)
    return h('div.tableGridContainer.tableGridHighlight', list[0].errorMessage);
  if (!list.length)
    return h('div.tableGridContainer.tableGridHighlight', "No Results");
  if (!tp.cols)
    tp.cols = Object.keys(list[0]).filter(c => c !== "tRowItem").map(c => ({ dKey: c }) );
  // console.log("tp_Object!!", tp, list);
  const setWCols = tp.cols.filter(th => th.width);
  let setWColsAcc = setWCols.reduce((a, th) => a + th.width, 0);
  let avgW = Math.floor((panelWidth - setWColsAcc) / (tp.cols.length - setWCols.length));
  const minWCols = tp.cols.filter(th => th.minWidth && th.minWidth > avgW);
  if (minWCols.length){
    setWColsAcc = minWCols.reduce((a, th) => a + th.minWidth, setWColsAcc);
    avgW = Math.floor((panelWidth - setWColsAcc) / (tp.cols.length - setWCols.length - minWCols.length));
  }
  // avgW = avgW - (tp.cols.length * 6) // offset for padding space
  const sortArr = vd.tRowCntrl.sort
  const th = tp.cols.map(c => {
    const thClass = (c.sort ? ".sortClick.ui-djv-sort-icon" : "") + (c.thStyle ? ".thClearJQ" : "");
    const matchSort = c.sort && sortArr ? (sortArr.find(f => c.dKey === f.fld) || {}) : {}
    const sortIndicators = c.sort ? ["asc", "desc"].map(s => {
      const disabledClass = s === matchSort.dir ? "" : ".ui-djv-disabled"; // add LOGIC for actual sort in results
      const upDownClass = s === "asc" ? ".ui-icon-djv-north" : ".ui-icon-djv-south";
      return h('span.ui-grid-ico-sort.ui-icon-' + s + '.ui-djv-icon' + upDownClass + disabledClass, { 
        attrs: {sort: s}
      })
    }) : [];
    return h('th' + thClass, { 
      style: {'width': (c.minWidth > avgW ? c.minWidth : (c.width || avgW)) + 'px'},
      attrs: {val: c.dKey}
    }, c.sort ? [
      h('div#sort_' + c.dKey + '.ui-jqgrid-sortable.mClick', [
        h('span' + (c.thStyle ? ".thClearJQ." + c.thStyle : ""), (c.label || c.dKey)), 
        h('span.s-ico', sortIndicators )
      ])
    ] : h('span' + (c.thStyle ? (c.thStyle.match(/^\w/) ? "." : "") + c.thStyle : ""), 
      { attrs: {title: (c.title || c.label)}},
      (c.label === "." ? "" : c.label || c.dKey)) )
  });
  const grid = list.map((item, idx) => {
    const tr = tp.cols.map((c, cellIdx) => {
      let cellVal = c.hashMap && item[c.dKey] && hashSrc(vd, c.hashMap)[item[c.dKey]] ? 
        hashSrc(vd, c.hashMap)[item[c.dKey]] : (item[c.dKey] || "");
      if (c.dKey === "skillsCoach" && hashSrc(vd, c.hashMap)[item.id])
        cellVal = hashSrc(vd, c.hashMap)[item.id].map(i => h('div.tagItem', i.n + ": " + i.score))
      else if (c.dKey === "coachSkills" && hashSrc(vd, c.hashMap)[item.id])
        cellVal = hashSrc(vd, c.hashMap)[item.id].map(i => h('div.tagItem', i.tag + ": " + i.score))
      else if (c.dKey === "eStamp" && item.asOfStamp)
        cellVal = minToDateFormat(item.asOfStamp, c.dateFormat)
      else if (c.dateFormat)
        cellVal = minToDateFormat(cellVal, c.dateFormat)
      else if (c.imgUrl)
        cellVal = h('img', { 
          props: { src: c.imgUrl.replace(/\{(\w+)\}/, function (m, p1){ return (item[p1] || "__") }) },
          attrs: c.title ? { title: (c.title === "__" ? cellVal : c.title) } : {},
          style: c.atagStyle || { height: "48px", borderRadius: "25px" }
        })
      else if (c.progressBar && c.progressBar.high && cellVal)
        cellVal = h('div.tableProgressBar', { 
          attrs: c.title ? { tooltip: c.title.replace(/__/, cellVal), tooltipPos: "bottom" } : {},
        }, h('div', { style: { 
            width: ((cellVal - c.progressBar.low) / (c.progressBar.high - c.progressBar.low) * 100) + "%", 
            background: c.progressBar.barColor ? c.progressBar.barColor : ""
          }})
        )
      if (c.atag){
        const parseTag = c.atag.replace(/\{(\w+)\}/, function (m, p1){ return (item[p1] || "___") })
        const hrefProps = { 
          props: { href: parseTag, target: (parseTag.match(/^#/) ? "" : "newDTab") },
          style: c.atagStyle ? c.atagStyle : {}
        }
        cellVal = parseTag.match(/___/) ? cellVal : 
          h('a' + (c.atagClasses || ""), hrefProps, (c.val || cellVal || c.altVal || c.atag ))
      }
      if (c.typeCell === "schWeek" && vd.sub1){
        let schEles = ""
        const schObj = vd.sub1[item.id] && vd.sub1[item.id][c.dKey]
        let commLev = ""
        if (schObj){
          const mappedIconFontSize = { chall: "1.6em", chr: "1.4em", cons: "1.4em" }
          schEles = h('div', schObj.map((sc, scidx) => {
            commLev = sc.commitment || "committed"
            const note = sc.schNote ? "Note: " + sc.schNote + "\n" : ""
            const commitment = sc.commitment ? "Commitment: " + sc.commitment + "\n" : ""
            let coaches = sc.aCoach ? "Key Coach: " + hashSrc(vd, "coachers")[sc.aCoach] + "\n" : ""
            coaches += sc.tCoach ? "2nd Coach: " + hashSrc(vd, "coachers")[sc.tCoach] + "\n" : ""
            const coachFirst = hashSrc(vd, "coachers")[sc.aCoach || sc.tCoach || item.keyCoach]
            return h('div', [
              scidx ? h('hr', { style: { margin: "1px"}}) : " ", 
              h('div#schFrm.mClick.sch_' + commLev, { style: { whiteSpace: "pre"}, attrs: {
                idx: idx, 
                prop: c.dKey, 
                schId: sc.id,
                tooltip: commitment + note + "Date: " + minToDateFormat(sc.whenStamp, "M/D h:ma") + "\n" + coaches,
                tooltipPos: idx > 2 ? "top" : "bottom"
              } }, [
                h('i.fa.fa-' + mappedIcon[sc.schType], {style: {fontSize: mappedIconFontSize[sc.schType]}}), 
                sc.schType === "chall" ? h('span.challNum', sc.counter || "1")
                  : h('i', ""),
                h('span', coachFirst ? " " + coachFirst.replace(/\s*coach\s*/i, "").replace(/\s+.*/i, "") : ""), 
              ])
            ])
          }))
        }
        cellVal = h('div.schCell.sch_' + commLev, [
          h('div#schFrm.mClick.la.la-plus.tightUpperRight', { 
            style:{ fontSize:"0.8em"}, attrs: {idx: idx, prop: c.dKey} 
          }), schEles
        ])
      }
      else if (c.showRowNum)
        cellVal = idx + 1;
      // console.log(c, avgW, panelWidth, "-", setWColsAcc,") / (", tp.cols.length," - ", setWCols.length);
      let cellClass = "";
      if (c.tdStyle){ // now, only tdStyle cells can do cellDivs anyway
        cellClass = (c.tdStyle.match(/^#/) ? "" : ".") + c.tdStyle;
        if (!cellVal.length && c.tdStyle.match(/mClick.clickBg/))
          cellClass = cellClass.replace(/.mClick.clickBg/, "")
        else if (cellVal.length <= 100 && c.tdStyle.match(/mClick$/))
          cellClass = cellClass.replace(/.mClick/, "")
        if (vd.tRowCntrl.cellDiv && vd.tRowCntrl.cellDiv.idx == idx && vd.tRowCntrl.cellDiv.prop === c.dKey) // ignore ==
          cellVal = schFrm(vd, item) // only sched has these for now.
        else if (c.tdStyle.match(/_priors/) && cellVal.length > 100) // truncate journal fields
          cellVal = cellVal.split(/(\s+|\/+)/).slice(0, 40).join(" ") + "... "
      }
      const cellStyle = (idx ? {} : {'width': (c.minWidth > avgW ? c.minWidth : (c.width || avgW)) + 'px'})
      if (!cellIdx && item.color)
        cellStyle.borderLeft = "4px solid " + item.color
      else if (c.dKey === "status" && statusColors[item.status])
        cellStyle.borderRight = "4px solid " + statusColors[item.status]
      if (idx && idx === list.length - 1)
        cellStyle.borderBottom = "none"
      return h('td' + cellClass, {
        style: cellStyle,
        attrs: {idx: idx, prop: c.dKey}        
      }, (c.regex && cellVal ? cellVal.replace(c.regex, c.replace) : cellVal  || c.altVal));
    });
    return h('tr.ui-widget-content.jqgrow.ui-row-ltr', tr);
  });
  benchMark('tableGrid rows drawn!', true);

  const tableHeight = (!tableRows && list.length * 3333 > panelHeight ? panelHeight + "px" : "100%");

  return  h('div.ui-jqgrid.tableGridContainer', [
    h('div.tableGrid', { style: { height: tableHeight }}, [
      h('table.ui-jqgrid-btable', [
        h('thead.ui-jqgrid-htable', [
          h('tr.ui-jqgrid-labels', th),
        ]),
        h('tbody', grid)
      ])
    ])
  ]);
}

function schFrm (vd, teamObj) {
  const cntrlObj = vd.tRowCntrl.cellDiv
  const teamAllSched = vd.sub1 && vd.sub1[teamObj.id] || {}
  // ["schType", "schNote", "aCoach", "tCoach", "spreadRight" "whenStamp" ]
  const schObj = cntrlObj.schid && teamAllSched[cntrlObj.prop] && teamAllSched[cntrlObj.prop][0] ? 
  (teamAllSched[cntrlObj.prop].find(i => i.id == cntrlObj.schid) ) : // test == //||  teamAllSched[cntrlObj.prop][0]) :
  { 
    schType: "chall", 
    spreadRight: 0,
    whenStamp: cntrlObj.prop.replace(/Mon(\d\d\d\d)(\d\d)(\d\d)/, "$1-$2-$3") + "T09:30"
  }
  // console.log('schObj, cntrlObj,', schObj, cntrlObj)
  if (!schObj)
    return h('i')
  const exitX = h('div#delProp_tRowCntrl_cellDiv.mClick.la.la-close.upperRight')
  // get formConfig set in menuRoutes and look like modForm does
  const formEleTypeMap = { checkbox: {top: "1px", left: "215px"}, radio:{top: "1px", left: "135px"} }
  const mappedIconFontSize = { chall: "2em", chr: "2.1em", cons: "2em" }
  const editSch = schObj.id ? { label: "Delete Item?", type: "checkbox", name: "deleteIt", value: "1" } : {}
  const formArr = vd.rteObj.meta.formConfig.concat(editSch).map(e => {
    if (!e.type)
      return ""
    const formEleStyle = {}
    formEleStyle.style = formEleTypeMap[e.type] ? mutate(formEleTypeMap[e.type], {width: "33px"}) : {}
    formEleStyle.style.border = "2px solid #999"
    const optsSrc = e.opts ? hashSrc(vd, e.opts) : ""
    const opts = optsSrc ? Object.keys(optsSrc).map(k => ( { k: k, v: optsSrc[k] } )) : ""
    let formEle = opts ? 
      inputSelList( e.name, schObj[e.name], ["", ...opts], "keyInput", 
        formEleStyle.style, e.numIndex, { title: e.title }, true) :
      h('input.keyInput', mutate(formEleStyle, { attrs: formProps(e, schObj[e.name]) }))
    // console.log('e.opts, optsSrc, opts', e.opts, optsSrc, opts)
    if (e.type === "radio" && opts)
      formEle = h('div', opts.map(r => h('div', {style: {float: "left", margin: "0 12px"}}, [ 
        h('label.fa.fa-' + mappedIcon[r.k], {style:{cursor:"pointer", fontSize:mappedIconFontSize[r.k]}, attrs: {"for": r.k, title: r.v}}), " ",
        h('input#' + r.k + '.keyInput', { props: formProps(mutate(e, {value: schObj[e.name], title: r.v}), r.k) } )
      ])).concat( h('div', {style:{clear: "both", width: "200px", height: "3px"}}) ))
    return h('div.schFrmRows', [
      h('strong', (e.type !== "submit" ? (e.label) : "")), 
      (e.label ? h('br', { style: { clear:"both"}}) : ""),
      formEle,
      (vd.formObj.errors[e.name] ? h('div.formRowErrorMsg', vd.formObj.errors[e.name]) : ""),
    ])
  })
  
  const formTag = h('form.formSubmit', { 
    style: { padding: "5px", color: "#333" },
    attrs: { onSubmit: "return false" }
  }, [...formArr, h('input.schFrmSub', { props: { type: "submit", value: (schObj.id ? "Update" : "Create") }} )] )
 
  return h('div.cellAbs.schFrm', { style: { }}, [
    exitX,
    h('div', teamObj.project + ". Week of: " + cntrlObj.prop.replace(/Mon(\d\d\d\d)(\d\d)(\d\d)/, "$2/$3/$1")),
    formTag
  ])

}

function labelTable (pairArr, cols) {
  const trows = [];
  let tds = [];
  const widthSet = Math.floor(100 / ((cols || 2) * 2));
  pairArr.forEach(i => {
    tds.push(h('td.GrayTxt', { attrs: {width: widthSet + '%', nowrap: 'nowrap'} }, i.label));
    tds.push(h('td.GrayTxtBold', { attrs: {width: widthSet + '%'} }, i.val));
    if (tds.length === cols * 2){
      trows.push(tds);
      tds = [];
    }
  });
  if (tds.length) // any remainder
    trows.push(tds);
  return h('div.WhtBoxM', [
    h('table', { 
      attrs: {border: 0, cellpadding: 0, cellspacing: 0, width: '100%'}
    }, [
      h('tbody', trows.map(tds => h('tr', tds)))
    ])
  ]);
}

function panelBody (rteObj, vd, panelHeight, panelWidth) {
  // console.log(rteObj);
  const meta = rteObj.meta;
  if (meta.tmpPanel) // static pages, dumps, etc.
    return meta.tmpPanel;
  if (panelObj[meta.panelFn]) // functions we want to call
    return panelObj[meta.panelFn].apply(this, [rteObj, vd, panelHeight, panelWidth]);
  if (panelObj[meta.panel])
    return panelObj[meta.panel];
  if (panelObj["tableDefault"]) // default ELSE when no panel or panelFn property - function we call for vast majority of screens
    return panelObj["tableDefault"].apply(this, [rteObj, vd, panelHeight, panelWidth]);
//  if(!isNaN(meta.panel))
//    return getSetContext('x', (rteObj.panel + 1), SMIContextStore).panel; // rare use of SMIContextStore ref in View.
  else
    return "no panel";
}

function renderHeader (viewData) {
  const bannerLocIconsList = ["vr", "ct"].map(st => {
    const ttLocSel = viewData.settings.ttLoc.some(s => s === st) ? ".ttLocSel" : ""
    return h('div.locIconImgDiv', { attrs: { 
      tooltip: "Select " + ttLocs[st] + " to include results from this location.",
      tooltipPos: "bottom"
    }}, 
    h('img#setting_ttLoc_' + st + '.locIconImg.mClick' + ttLocSel, { 
      attrs: { src: 'images/dojo_' + st + '_icon.png', align: 'absmiddle'}
    }))
  })
  return h('div.header', [
    h('div.BannerBg.dataEnv_' + viewData.session.dataEnv, [
      h('div.bannerTitle', ""),
      h('a', {
         props: { href: "https://github.com/devopsdojoconsortium/TeamAssist", target: "outTeamAssist"},
         attrs: { tooltip: "You can fork \nTeamAssist from \nGitHub", tooltipPos: "bottom" }
      }, h('img.ttLogo', {props: {src: "images/TeamAssistLogoT.png"}})), 
      h('a', {
         props: { href: "https://dojoconsortium.org/", target: "outTeamAssist"},
         attrs: { title: "TeamAssist is designed to be a fit for enterprises in the\n Dojo Consortium" }
      }, h('img.topRightLogo', {props:{ src: "images/dojo-consortium-circle.png"}})), 
      h('div.bannerMeta', [
        h('div', h('span.yell', viewData.session.displayName || viewData.session.loginName)), 
        h('div', loginLevels[viewData.session.loginLevel] || "Welcome"), 
        h('div', viewData.session.uid ? 
          h('a', { props: { href: "#/users/modUser/id/" + viewData.session.uid }}, [
            h('img.gearIcon', { props: { src: "images/gear.png" }})
          ]) : ""), 
      ])
    ]),
    h('div.bannerLocIcons', bannerLocIconsList)

    // h('div.crumbs', viewData.rteObj.meta.routeChain.join(" :: ")), // kept in case someone wants a crumb trail. :-)
  ]);
}

function renderPanel (viewData, panelHeight, panelWidth) {
  const tabsOffset = viewData.menu.tabs.length ? 215 : 180
  panelHeight = panelHeight || Math.ceil($('#heightMarker').innerHeight() - tabsOffset);
  panelWidth = panelWidth || Math.ceil($('#widthMarker').innerWidth() - 30);
//  let leftMenuCalc = panelWidth > 1200 ? 231 : 144;
  if (viewData.cntrl.textAreaVal){
    Object.keys(viewData.cntrl.textAreaVal).forEach(ta => {
      const currVal = $('#' + ta).val() ? $('#' + ta).val() + "\n" : ""
      $('#' + ta).val(currVal + viewData.cntrl.textAreaVal[ta])
    })
  }
  return h('div.panel', {
    style: {'transition': viewData.list.length ? 'none' : 'all .3s ease-in-out'}
  }, [
    panelHeader(viewData.rteObj),
    panelBody(viewData.rteObj, viewData, panelHeight, panelWidth)
  ])
}

function renderMenu (viewData) {
  const path = [];
  let selMark;
  const subList = viewData.menu.list.filter(x => x.list); // the selected obj in list that has its own list
  const ulArr = [viewData.menu.list];
  if (subList[0] && subList[0].list)
    ulArr.push(subList[0].list);
  // console.log('viewData.menu.list, subList.list', ulArr, viewData.menu.list, subList[0].list);
  let mainSelPos = 230;
  const opacityToggle = viewData.cntrl.loading ? 0.6 : 1;
  return h('div#menuContainer', ulArr.map((menu, dIdx) => {
    if (dIdx && selMark){
      path[dIdx - 1] = selMark;
    }
    return h('ul.menuUl#menu' + (dIdx ? "Sub" : "Main") + ".easeAll", {  
      style: (dIdx ? { left: mainSelPos + "px", opacity: opacityToggle } : {})
    }, menu.map((mi, idx) => {
      path[dIdx] = mi.key;
      if (mi.sel){
        selMark = mi.key;
        mainSelPos += (80 * idx);  
      }
      return h('li.menuLi' + (dIdx ? '.menuSubLi' : '') + (mi.sel ? '.menuSel' : ''), 
        [ h('a', {props: {href: "#/" + path.join("/") }}, mi.name) ]
      )
    }));
  }));
}


function nl2br (string) {
  const out = []
  const arr = string.trim().split("\n")
  arr.forEach(i => {
    out.push(i)
    out.push(h('br'))
  })
  out.pop()
  return out
}


function renderModal (viewData) {
  if (!viewData.modalObj.type)
    return ""
  let modalBody, modalPos, title, footer
  if (viewData.modalObj.type === "mdHelp"){
    const modalObj = mdModal()
    const preview = viewData.modalObj.preview
    modalBody = h('div.modal-mdHelp', [
      tableGrid(viewData, 0, 0, [{ p: markdownRender(preview ? preview : 
        "## ## Placeholder H2 Markdown. \n- type your own MD in form and see it here.") }], {
        cols: [{
          dKey: "p", label: "Dynamic Markdown Preview", 
          minWidth: 590, tdStyle: "mdHelpPreviewCell"
        }]
      }),
      h('h3', { style: { margin: "20px 0 3px"}}, "Markdown Legend"),
      tableGrid(viewData, 0, 0, modalObj.list, modalObj.params)
    ])
    modalPos = modalObj.params.modalPos
    title = modalObj.params.title
  }
  else if (viewData.modalObj.type === "export"){
    const modalObj = exportModal(viewData, hashSrc(viewData, "coachers"))
    modalBody = modalObj.retView
    modalPos = modalObj.params.modalPos
    title = "Export Team Data to Excel"
    footer = viewData.modalObj.footer
  }
  else if (viewData.modalObj.type === "vsmCapture"){
    const modalObj = {
        params: {  modalPos: { left: 50, width: 1240 }
      }}
    modalBody = h('div', { style: {overflow: "scroll"}}, [
      h('div', { style: {fontSize: "1.6em"}}, "This is your Value Stream map captured as an image. Right click on it and save as a PNG file to print and distribute."),
      h('img#vsmFill', {
        attrs: { src: "/images/animation/rollingLoader.gif" }, 
        style: { minWidth: "100%", margin: "5px", border: "1px solid blue"}
      }),
      h('div', "https://rasterbator.net/ is where you need to go to get a long printout of your VSM")
    ])
    modalPos = modalObj.params.modalPos
    title = "Save Value Stream for Image Sharing and Printing"
    footer = viewData.modalObj.footer
  }
  else if (viewData.modalObj.type === "priors"){
    const modalObj = priorsModal(viewData.modalObj.list, hashSrc(viewData, "coachers"))
    modalBody = modalObj.retView
    modalPos = modalObj.params.modalPos
    title = viewData.modalObj.team + " " + viewData.modalObj.colObj.label
    footer = viewData.modalObj.footer
  }
  const left_right = modalPos.right ? "right" : "left"
  const modConfig = mutate(viewData.modalObj, modalPos)
  const scrollOffset = modConfig.pageY - modConfig.clickY
  return h('div.modal', {
    style: {
      top: modConfig.pageY + "px", 
      [left_right]: modConfig.clickX + "px", 
      width: "3px", 
      height: "3px", 
      delayed: {
        top: (scrollOffset + (modConfig.top || 102)) + "px", 
        [left_right]: (left_right === "right" ? modConfig.right : (modConfig.left || 220)) + "px", 
        width: (modConfig.width || 640) + "px", 
        height: (modConfig.height ? modConfig.height + "px" : "95%"), 
      }
    }}, h('div.modal-container', [
      h('div.modal-header', [
        h('h1.modal-title-text', (title || 'Modal Help')), 
        h('div#modal_clear.modal-cancel-circle.muted.mClick.la.la-times-circle.la-2x')
      ]),
      h('div.modal-body', [
        modalBody
      ]),
      footer ? h('div.modal-footer', markdownRender(footer) ) : ""
    ]))
}

function renderFooter (viewData) {

  benchMark(' footer VOM render', true);

  return viewData.footer ? h('div.footer', {
    style: {}
  }, viewData.footer) : ""
}

// collection of sounds that are playing
const playing = {};
const sounds = { 
  bass: "Basso.mp3",
  chime: "chime.wav", 
  chime2: "chime2.mp3",  
  fore: "foreWhoosh.wav",
  back: "backWhoosh.wav",
  ding: "Bottle.mp3",
  glass: "Glass.mp3", 
  gong: "gong.wav",
  gongLong: "gongLong.wav"  
};
// function that is used to play sounds
function player (vd){
  const sndPref = vd.session.soundPref || "none"
  if (sndPref === "none")
    return
  if (sndPref === "normal" && !vd.cntrl.snd)
    return
  const snd = vd.cntrl.snd && sounds[vd.cntrl.snd] ? vd.cntrl.snd : 'bass'
  const a = Date.now()
  playing[a] = new Audio("sounds/" + sounds[snd]);
  playing[a].onended = function (){ delete playing[a] } // clean obj onended
  playing[a].play();
}

// THE VIEW
// This function expects the stream of displayObj
// from the model function and turns it into a
// virtual DOM stream that is then ultimately returned into
// the DOM sink in the index.js.
export default function view (viewData$) {
  return viewData$.map(viewData =>
    h('div.mainContainer', [
      renderHeader(viewData),
      renderPanel(viewData),
      renderModal(viewData),
      renderMenu(viewData), // http://localhost:8080/#/vsm/id/6cc326
      renderFooter(viewData),
      player(viewData)
    ])
  );
}
export {renderPanel, renderFooter, renderMenu, nl2br, formProps, hashSrc, inputSelList};
