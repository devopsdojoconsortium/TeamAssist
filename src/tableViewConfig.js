import {ttLocs, lobs, teamStatus, loginLevels} from "./uiConfig";
import {range, makeWeeks} from "./frpHelpers"
import moment from 'moment';
// COLUMN AND FILTER FORM CONFIG FOR STANDARD PAGES ONLY.
// unlike validRoutes, this object is NOT nested, but indents that way for organization.
/* const verificationStatusHash = {
  all: "All", P: "Pending", I: "In Progress", G: "Processed", C: "Transmitted", E: "Error"
}
const statusHash = {
  all: "All", A: "Active", D: "Deprecated", E: "Error"
}
*/


/*
  CONFIG LEGEND:
  cols[{ == assigned columns for output. If not defined, the table will matchall properties.
    dKey: Must match the response properties you want for your table column
    label: Preferred value for Column Header string. If undefined, dKey is used.
    width: a set width for this column
    minWidth: A minimal width for column. All unassigned columns will be adaptive to table size
    sort: (asc|desc). Defines a column as SORTABLE and its first toggle sort direction. (List initial sort is always last updated on top)
    atag: string for a url link from text of table. urls starting with # will stay in app, otherwise new tab.
    atagClasses: a tag class names in form of ".classA.classB" etc
    atagStyle: Object for a tag style overwrites
    val: show this instead of the cell value
    altVal: value to show for a cell as a fallback if empty (best for atag linked cells)
    tdStyle: id and/or class name assigned to values in table column that we will enable for expansion, editing, detail modals, etc.
    regex: What to match on text for any tweaks needed
    replace: what to replace from regex matches (dependent on regex)
    dateFormat: will assume value is a timestamp. Use tokens from: http://momentjs.com/docs/#/parsing/string-format/
    progressBar: { low: int, high: int, barColor: "hex" (defaults green) } - ex. { low: 0, high: 10 }, title: "Team completion score is __. \nMax is 10" (pairs with range type forms) 
  }]
  filtersPage{ == form elements part of the top bar where pagination is dealt with. If not defined, whole ROW disappears!
    searchCol[]: list of columns relevant to a keyword search. If not defined, there will be NO keyword search.
    specialRange: paging range if not the default list. [500] or > will remove the paging DD's
  }
  filtersExtra{
    dateRange: [startDate,endDate] array of ints relative to today. Ex: [-1, -1] = start & end set to yesterday, [0] = today
    dateRangeLimits: Range for valid selectable days from today for all date form filters. Ex: [-7, -1] = last week to yesterday for verification searches.
    vhoChain: (1,2,3,4,h) Set depth for how far to create nested drop down lists. 'h' stands for vho->hea chain of 2.
    [namedProps]:{ type: [dd]}{ == drop down list
      namedProp: (status, etc) key for webform name. Best to match it to a field in response properties
      label: name to show above form
      opts: { key=>val } hash of keys and text for the drop down list (assigned above)
      getCount: boolean -> show result counts matching each value (not yet working)
    }
    [namedProps]:{ type: [?]} : Others under design review.
  }
  // replication props of above list of 3... to reduce boilerplate
  cloneParams: String of another routeKey in config. Ex: "verification", // all others (remCols, addCols, replaceProps) are conditioned on cloneParams.
  remCols: Array of cols dKeys to remove from cloned Config. Ex: ["vhoid", "Status"]
  addCols: Array of cols to add [{ same params you would find in cols obj }],
  replaceProps: Object with any of the property set (cols, filtersPage, filtersExtra) you want to rewrite.

  /// before adding new properties to LEGEND or config below, consult with team for agreement on changes and create Jira!

*/

// unused for now
function monthYear (){
  return range(-1, 7).reduce((acc, m) => {
    const val = moment().add(m, "M")
    acc["d" + val.format("YYYYMM")] = val.format("MMMM YYYY")
    return acc
  }, {})
}

const teamLinks = [       
  { dKey: "", label: "VSM", atagClasses: ".la.la-map.la-3x.tableIconLink", altVal: " ", atag: "#/vsm/id/{id}", width: 30 },
  { dKey: "", label: "Report", atagClasses: ".la.la-book.la-3x.tableIconLink", altVal: " ", atag: "#/teams/id/{id}", width: 30 },
  { dKey: "", label: "Edit", atagClasses: ".la.la-edit.la-3x.tableIconLink", altVal: " ", atag: "#/teams/modTeam/id/{id}", width: 30 }
]

const tableConfig = {
  teamReports: { // not a standard table view, but these defaults are good for pivot types
    cols: [
      { dKey: "ttLoc", label: "Location", hashMap: ttLocs },
      { dKey: "status", label: "Status", hashMap: teamStatus },
      { dKey: "project", label: "Project", minWidth: 100 },
    ],
    statusCols: [
      { dKey: "status", label: "Status", hashMap: teamStatus },
      { dKey: "ttLoc", label: "Location", hashMap: ttLocs },
      { dKey: "project", label: "Project", minWidth: 100 },
    ],
    filtersPage: { searchCol: [""], specialRange: [500] },
    filtersExtra: {
      pivotType: { dKey: "pType", label: "Pivot Type",
        opts: {
          totals: "Counts by Status",
          status: "Teams By Status",
          ttLoc: "Teams By Location"
        },
        width: 120
      }
    }
  },
  schedule: {
    cols: [
      { dKey: "project", label: "Project (Team Name)", sort: "asc", minWidth: 220, tdStyle: "sectionLabel", altVal: "Unnamed" },
     // { dKey: "challengeStartDate", label: "Challenge Start", dateFormat: "MM/DD/YY", width: 60 },
      { dKey: "status", label: "Status", sort: "asc", hashMap: teamStatus, width: 60 },
      { dKey: "ttLoc", label: ".", width: 28, title: "__", hashMap: ttLocs,
        thStyle: "#setting_schShift_Prev.mClick.thSchedToggle.la.la-caret-square-o-left.la-2x",
        tdStyle: "borderRight2Blk", // mutedBg",
        imgUrl: "/images/dojo_{ttLoc}_icon.png", 
        atagStyle: { width: "25px", background: "#F4F5F7" } // F4F5F7
      },
    ]
    .concat(makeWeeks())
    .concat(
      { dKey: "next", label: ".",  width: 11,
        thStyle: "#setting_schShift_Next.mClick.thSchedToggle.la.la-caret-square-o-right.la-2x",
        tdStyle: "borderLeft2Blk", atagClasses: ".la.la-edit.la-2x.tableIconLink",
        altVal: " ", atag: "#/teams/modTeam/pane_progress/id/{id}"
      }
    ),
    filtersPage: { searchCol: [ "project"], specialRange: [500]  },
    filtersExtra: {
      status: { dKey: "status", label: "Team Status", opts: teamStatus, width: 120, getCount: true },
      // drange: { dKey: "drange", label: "Starting Month", opts: monthYear(), width: 120 }
    }
  },
  teams: {
    cols: [
      { dKey: "project", label: "Project (Team Name)", sort: "asc", minWidth: 220, tdStyle: "sectionLabel", altVal: "Unnamed" },
      { dKey: "status", label: "Status", sort: "asc", hashMap: teamStatus },
      { dKey: "contactName", label: "Contact", sort: "asc", atag: "mailto:{contactEmail}" },
      { dKey: "ttLoc", label: " ", sort: "asc", width: 32, title: "__", hashMap: ttLocs,
        thStyle: "thMapsigns.fa.fa-map-signs",
        imgUrl: "/images/dojo_{ttLoc}_icon.png", 
        atagStyle: { width: "32px", background: "#F4F5F7" }
      },
      { dKey: "description", label: "Challenge Description", minWidth: 300 },
      { dKey: "teamSize", label: "Team Size"},
      { dKey: "coachNotes", label: "Coaching Notes", sort: "asc", width: 280, tdStyle: "#modal_priors_cell.mClick.clickBg" },
      { dKey: "percComplete", label: "Progress", progressBar: { low: 0, high: 100, barColor: "#9f9" }, title: "__% complete"},
      { dKey: "challengeStartDate", label: "Start Date", dateFormat: "MM/DD/YY" },
      { dKey: "eStamp", label: "Updated", width: 60, dateFormat: "MM/DD/YY" },
      ...teamLinks
    ],
    filtersPage: { searchCol: ["project", "contactName"], specialRange: [500]  },
    filtersExtra: {
      status: { dKey: "status", label: "Team Status", opts: teamStatus, width: 120, getCount: true }
    }
  },
  teamLeads: {
    cols: [
      { dKey: "project", label: "Project (Team Name)", sort: "asc", minWidth: 220, tdStyle: "sectionLabel", altVal: "Unnamed"},
      { dKey: "status", label: "Status", sort: "asc", hashMap: teamStatus },
      { dKey: "contactName", label: "Contact", sort: "asc", minWidth: 180, atag: "mailto:{contactEmail}"  },
      { dKey: "ttLoc", label: " ", sort: "asc", width: 32, title: "__", hashMap: ttLocs,
        thStyle: "thMapsigns.fa.fa-map-signs",
        imgUrl: "/images/dojo_{ttLoc}_icon.png", 
        atagStyle: { width: "32px", background: "#F4F5F7" }
      },
      { dKey: "lob", label: "LOB", hashMap: lobs },
      { dKey: "keyGoal", label: "Stated Goal", minWidth: 300 },
      // { dKey: "teamSize", label: "Team Size"},
      // { dKey: "teamSizeEquiv", label: "TSE - Teams"},
      { dKey: "lastContactedDate", label: "Last Contact", sort: "desc", width: 100, dateFormat: "MM/DD/YY" },
      { dKey: "salesNotes", label: "Pipeline Notes", sort: "asc", width: 280, tdStyle: "#modal_priors_cell.mClick.clickBg" },
      { dKey: "nextContactDate", label: "Next Contact", sort: "desc", width: 100, dateFormat: "MM/DD/YY" },
      { dKey: "eStamp", label: "Updated", width: 60, dateFormat: "MM/DD/YY" },
      { dKey: "", label: "", atagClasses: ".la.la-edit.la-3x.tableIconLink", altVal: " ", atag: "#/teams/modTeam/pane_pipeline/id/{id}", width: 30 }
    ],
    filtersPage: { searchCol: [ "project", "contactName"], specialRange: [100, 200, 300] },
    filtersExtra: {
      // dateRange: [-100, 0],
      status: { dKey: "status", label: "Team Status", opts: teamStatus, width: 120, getCount: true }
    }
  },
  teamsCompleted: {
    cols: [
      { dKey: "project", label: "Project (Team Name)", sort: "asc", minWidth: 220, tdStyle: "sectionLabel", altVal: "Unnamed"},
      { dKey: "status", label: "Status", hashMap: teamStatus },
      { dKey: "contactName", label: "Contact", sort: "asc", atag: "mailto:{contactEmail}"  },
      { dKey: "ttLoc", label: " ", sort: "asc", width: 32, title: "__", hashMap: ttLocs,
        thStyle: "thMapsigns.fa.fa-map-signs",
        imgUrl: "/images/dojo_{ttLoc}_icon.png", 
        atagStyle: { width: "32px", background: "#F4F5F7" }
      },
      { dKey: "keyPracticesLearned", label: "Practices Learned", minWidth: 180 },
      { dKey: "followUp", label: "Follow Up", width: 280, tdStyle: "#modal_priors_cell.mClick.clickBg" },
      { dKey: "challengeStartDate", label: "Started", sort: "asc", dateFormat: "MM/DD/YY" },
      { dKey: "challengeEndDate", label: "Ended", sort: "asc", dateFormat: "MM/DD/YY" },
      { dKey: "teamSize", label: "Team Size"},
      { dKey: "eStamp", label: "Updated", width: 60, dateFormat: "MM/DD/YY" },
      ...teamLinks
    ],
    filtersPage: { searchCol: [ "project", "contactName"], specialRange: [100, 200, 300] },
    filtersExtra: {
      status: { dKey: "status", label: "Team Status", opts: teamStatus, width: 120, getCount: true }
    }
  },
  teamsAllStatii: {
    cols: [
      { dKey: "project", label: "Project (Team Name)", sort: "asc", minWidth: 220, tdStyle: "sectionLabel", altVal: "Unnamed"},
      { dKey: "status", label: "Status", sort: "asc", hashMap: teamStatus },
      { dKey: "contactName", label: "Contact", sort: "asc", minWidth: 180, atag: "mailto:{contactEmail}"  },
      { dKey: "ttLoc", label: " ", sort: "asc", width: 32, title: "__", hashMap: ttLocs,
        thStyle: "thMapsigns.fa.fa-map-signs",
        imgUrl: "/images/dojo_{ttLoc}_icon.png", 
        atagStyle: { width: "32px", background: "#F4F5F7" }
      },
      { dKey: "lob", label: "LOB", hashMap: lobs },
      { dKey: "vastId", label: "APP ID", sort: "asc"},
      { dKey: "teamSize", label: "Team Size"},
      { dKey: "coachNotes", label: "Coaching Notes", width: 280, tdStyle: "#modal_priors_cell.mClick.clickBg" },
      { dKey: "eStamp", label: "Updated", width: 60, dateFormat: "MM/DD/YY" },
      ...teamLinks
    ],
    filtersPage: { searchCol: [ "project", "contactName"], specialRange: [100, 200, 300, 500] },
    filtersExtra: {
      status: { dKey: "status", label: "Team Status", opts: teamStatus, width: 120, getCount: true }
    }
  },
  users: {
    cols: [
     // { dKey: "userImg", label: " ", width: 50, atag: "#/users/modUser/id/{id}", imgUrl: "https://gitlab.com/users/{id}/avatar.png?s=40" },
      { dKey: "displayName", label: "Preferred Name", sort: "asc", width: 150, tdStyle: "sectionLabel", altVal: "-Partial Registrant-" },
      { dKey: "loginName", label: "Session Name/Email", minWidth: 180, atag: "mailto:{email}"  },
      { dKey: "ttLoc", label: " ", sort: "asc", width: 32, title: "__", hashMap: ttLocs,
        thStyle: "thMapsigns.fa.fa-map-signs",
        imgUrl: "/images/dojo_{ttLoc}_icon.png", 
        atagStyle: { width: "32px", background: "#F4F5F7" }
      },
      { dKey: "teamTied", label: "Member of Team", hashMap: "engagedTeams" },
      { dKey: "lob", label: "Business", hashMap: lobs },
      { dKey: "loginLevel", label: "Access Level", sort: "desc", hashMap: loginLevels },
      { dKey: "levelSought", label: "Access Requested", hashMap: loginLevels },
      { dKey: "eStamp", label: "Updated", width: 60, dateFormat: "MM/DD/YY" },
      { dKey: "", label: "", atagClasses: ".la.la-edit.la-3x.tableIconLink", altVal: " ", atag: "#/users/modUser/id/{id}", width: 30 }
    ],
    filtersPage: { searchCol: ["displayName", "loginName"] },
    filtersExtra: {
      status: { dKey: "loginLevel", label: "Access Level", opts: loginLevels, numIndex: true, width: 100, getCount: true },
      teamTied: { dKey: "teamTied", label: "Members of Team", opts: "engagedTeams", width: 150, getCount: true }
    }

  },
  activity: {},
  usersBySkill: {},
  admin: {},
  querydb: {},
  permissions: {},
  adminNotes: {}
};

export {tableConfig};
