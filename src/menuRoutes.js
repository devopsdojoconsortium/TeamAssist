import {dateFormat} from "./frpHelpers";
import {ttLocs, lobs, teamStatus, loginLevels, commitmentTypes, soundPrefs} from "./uiConfig";

function today (){
  return dateFormat(0);
}
const restreamFormConfig = [
  { label: "Select Restream Type", type: "select", name: "restreamType", opts: {
    filter: "Filter Events", snap: "Make snapshot", custom: "Custom"
  } },
  { label: "Target stream prefix (ie. 'c_') Make SURE full target stream does not exist!", type: "text", name: "streamPreTag" },
//  { label: "Stream Data (display only)", type: "textarea", name: "evtData", rows: 7, cols: 70, disabled: true },
  { label: "Event ID's to filter: We'll use .split(/\D+/)", type: "textarea", name: "filters", rows: 3, cols: 60 },
  { label: "Target Event Number", type: "number", name: "targetEvent" }
]

const mdTemplates = {
  weeklies: "### What We Planned / Accomplished / Deferred\n\n### What we Learned\n\n### Challenges and Impediments\n\n### What's Next\n\n### Coaching Observations / Progress"
}

const validRoutes = {
  home: { meta: {
    name: "Welcome to TeamTrek - The Cool Tagline goes Here!",      menuName: "Home",
    panelFn: "Home",
  }},
  schedule: {
    meta: {
      name: "TeamTrek Coaching Schedule", menuName: "TeamTrek Schedule",
      hstream: "teams",
      menuLevel: 3,
      postStream: "schedule",
      subUrl: {
        hstream: "schedule",
      },
      hardFilt: { status: ["eng", "ch", "qual", "cons", "cont", "vsm"] },
      formConfig: [
        { label: "", type: "radio", name: "schType", opts: {
          cons: "Consult", chr: "Charter", chall: "Challenge"
        } },
        { label: "Note", type: "text", name: "schNote", size: 35, maxlength: 35 },
        { label: "Team Commitment", type: "select", name: "commitment", opts: {
          loose: "Loosely Considering", tentative: "Tentative", committed: "Committed" // keys tie to css!
        } },
        { label: "Key Coach", type: "select", name: "aCoach", opts: "coachers", numIndex: true }, // numIndex: true covers numeric EID
        { label: "2nd Coach", type: "select", name: "tCoach", opts: "coachers", numIndex: true },
        { label: "Specific Date/Time", type: "datetime-local", name: "whenStamp" },
        { label: "Auto-add weeks (5 for challenges)", type: "number", name: "spreadRight" },
      ]

    }
  },
  vsm: {
    meta: {
      name: "Value Stream Map " + today(),      menuName: "VSM",
      menuLevel: 10,
      panelFn: "valueStream",
      hstream: "teams",
      postStream: "vsm_",
      subUrl: {
        hstream: "vsm_",
      }
    },
    id: { meta: {
      name: "Team",
      menuLevel: 3,

      formConfig: [
        { label: "Step Name", type: "text", name: "name", size: 25, maxlength: 25, req: "Step Name Required" },
        { label: "Action Type", type: "select", name: "actType", req: "Action Type Required", opts: {
          design: "Design", code: "Code", devTest: "Dev Test", approve: "Approvals", 
          build: "Build", intTest: "Integration Test", deploy: "Deployment", other: "Other"
        } },
        { label: "Lead Time", type: "number", name: "lTime", min: 0.125, step: 0.125, req: "Lead Time Required" },
        {  type: "hidden", name: "lTimeType" },
        { label: "Process Time", type: "number", name: "pTime", min: 0.125, step: 0.125, req: "Process Time Required" },
        {  type: "hidden", name: "pTimeType" },
        { label: "% C & A", type: "number", name: "pctAcc", min: 1, max: 100, step: 1 },
      ],

      metaFormConfig: [
        { label: "Map Name", type: "text", name: "name", size: 25, maxlength: 35, req: "Map Name Required" },
        { label: "Trigger Event", type: "text", name: "trigger", req: "Trigger Event Required" },
        { label: "Edit Mode", type: "select", name: "updateType", req: "Choose Edit Mode", opts: {
          discovery: "Discovery", correct: "Correction", track: "Track Improvements"
        } },
        { label: "App Stack", type: "text", name: "appStack" },
        { label: "Notes", type: "text", name: "notes" }
      ]

    }}
  },
  teams: {
    meta: {
      name: "Actively TeamTreking Teams", menuName: "Teams",
      hstream: "teams",
      params: { startdate: dateFormat(-1), enddate: dateFormat(31) },
      hardFilt: { status: ["imm", "eng", "ch", "vsm"] }, // imm kept for backwardsComp
//    cParams: { vhoid: "", sgid: "", zoneid: "", channelid: "", status: "", preverperiod: "? -1?" },
      primeTab: "Current Teams"
    },
    teamLeads: { meta: {
      name: "Potential TeamTrek Teams", menuName: "Pipeline",
      hstream: "teams",
      menuLevel: 3,
      params: { startdate: dateFormat(-1), enddate: dateFormat(31) },
      hardFilt: { status: ["qual", "cons", "cont", "vsm", "lead", "pre", "null"] },
      tabPage: true,
    }},
    teamsCompleted: { meta: {
      name: "Completed Teams", menuName: "Pipeline",
      hstream: "teams",
      params: { startdate: dateFormat(-1), enddate: dateFormat(31) },
      hardFilt: { status: ["grad"] },
      tabPage: true,
    }},
    teamsAllStatii: { meta: {
      name: "All Teams",
      hstream: "teams",
      menuLevel: 3,
      params: { startdate: dateFormat(-1), enddate: dateFormat(31) },
      tabPage: true,
    }},
    id: { meta: {
      name: "Team",
      menuLevel: 3,
      panelFn: "teamPanel",
    }},
    teamReports: { meta: {
      name: "Recent Team Event Updates - " + today(),      menuName: "Reports",
      menuLevel: 3,
      panelFn: "teamReports",
      hstream: "teams",
    }},
    modTeam: {
      meta: {
        name: "Add Team",
        hstream: "teams",
        menuLevel: 3,
        panel: "Add a New Team to teamTrek",
        panelFn: "formPanel",
        formConfig: [
            { pane: "Initial Contact", name: "initial"},
          { label: "Project Name (Team Name)", type: "text", name: "project" },
          { label: "Team Contact", type: "text", name: "contactName" },
          { label: "Contact Email", type: "email", name: "contactEmail" },
          { label: "TeamTrek Location", req: "You must select a Location", type: "select", name: "ttLoc", opts: ttLocs },
          // { label: "Line of Business", type: "select", name: "lob", opts: lobs },
          { label: "What's your goal?", type: "textarea", name: "keyGoal", rows: 3, cols: 72, markDown: true },
        ]
      },
      id: { meta: {
        name: "Update Team", menuName: "Update Team",
        buttonText: "Update Team Record",
        additionalFormConfig: [
            { pane: "Status/Size/Pipeline", name: "pipeline"},
          { label: "Team Status", type: "select", name: "status", opts: teamStatus },
          { label: "Team Size", type: "number", name: "teamSize" },
          { label: "Last Contacted", type: "date", name: "lastContactedDate" },
          { label: "Pipeline Notes", type: "textarea", name: "salesNotes", rows: 7, cols: 35, journal: true  },
          { label: "Next Contact Date", type: "date", name: "nextContactDate" },
            { pane: "Activation Data", name: "active"},
          // { label: "Team Name", req: "6", type: "text", name: "teamName" }, // initial unique val for adds
          { label: "Challenge Description", type: "textarea", name: "description", rows: 3, cols: 72 },
          // { label: "Challenge Start Date", type: "date", name: "challengeStartDate" },
          { label: "Elevator Pitch", type: "textarea", name: "elevatorPitchChallengeDescription", rows: 2, cols: 72 },
          { label: "Confluence Link", type: "text", name: "confluence" },
          { label: "Application ID", type: "text", name: "vastId", title: "."  },
          { label: "Team Color", type: "color", name: "color" }, // fixed naming convention for broad use
            { pane: "Challenge Progress/Health", name: "progress"},
          { label: "Percent Completed", type: "range", min: 0, max: 100, step: 5, name: "percComplete", title: " __% complete on current engagement" },
          { label: "Coaches Notes", type: "textarea", name: "coachNotes", rows: 7, cols: 35, journal: true },
            { pane: "Weekly Reporting", name: "weeklies"},
          { label: "Week 0 - post charter", type: "textarea", name: "weeklyReport0", rows: 5, cols: 72, markDown: true},
          { label: "Week 1 Report", type: "textarea", name: "weeklyReport1", rows: 5, cols: 72, markDown: true, tmplLoader: mdTemplates.weeklies },
          { label: "Week 2 Report", type: "textarea", name: "weeklyReport2", rows: 5, cols: 72, markDown: true, tmplLoader: mdTemplates.weeklies },
          { label: "Week 3 Report", type: "textarea", name: "weeklyReport3", rows: 5, cols: 72, markDown: true, tmplLoader: mdTemplates.weeklies },
          { label: "Week 4 Report", type: "textarea", name: "weeklyReport4", rows: 5, cols: 72, markDown: true, tmplLoader: mdTemplates.weeklies },
          { label: "Week 5 Report", type: "textarea", name: "weeklyReport5", rows: 5, cols: 72, markDown: true, tmplLoader: mdTemplates.weeklies },
          { label: "Week 6 Report", type: "textarea", name: "weeklyReport6", rows: 5, cols: 72, markDown: true, tmplLoader: mdTemplates.weeklies },
            { pane: "Challenge Outcomes", name: "completed"},
          // { label: "Challenge End Date", type: "date", name: "challengeEndDate" },
          { label: "Practices Learned", type: "text", name: "keyPracticesLearned" },
          { label: "Business Impact", type: "textarea", name: "businessImpact", rows: 3, cols: 72 },
          { label: "Speed to Value Improvement", type: "text", name: "speedToValueImprovement" },
          { label: "Post TeamTrek Follow Up Notes", type: "textarea", name: "followUp", rows: 7, cols: 35, journal: true},
            { pane: "Assignments, etc", name: "meta"},
          { label: "Primary Coach / POC", type: "select", name: "keyCoach", opts: "coachers", numIndex: true },
          { label: "Permanently DELETE", type: "checkbox", name: "statusDELETE", value: 1 },
        ],
        panel: "Update information for team"
      }}
    },
    bulkTeams: { meta: {
      name: "Bulk Team Import",
      hstream: "teams",
      menuLevel: 5,
      panel: "Dump JSON from Confluence Intake for to load Teams to teamTrek",
      panelFn: "formPanel",
      formConfig: [
        { label: "Paste in JSON", req: "Must paste in valid JSON from Confluence", type: "textarea", name: "bulkJson", rows: 10, cols: 72 },
        { label: "Import Date", req: "Must supply date for asOfStamp", type: "date", name: "importDate" },
      ]
    }}
  },
  users: {
    meta: {
      name: "teamTrek Users",      menuName: "Users",
      menuLevel: 3,
      hstream: "users",
      hardFilt: { loginLevel: [1, 2, 3, 4, 5] },
    },
    modUser: {
      meta: {
        name: "Add User",
        menuLevel: 3, // gone
        hstream: "users",
        panel: "Add a New User to teamTrek",
        panelFn: "formPanel",
        formConfig: [
          { pane: "Basic Profile Information", name: "basic"},
          { label: "Preferred Display Name (First/Last)", type: "text", name: "displayName", req: "The name you love to hear. YOURS!" },
          { label: "TeamTrek Location", req: "Most relevant Location", type: "select", name: "ttLoc", opts: ttLocs },
          { label: "Access Level", req: "No blocking yet.", accessLevel: 3, sessValFilter: true, type: "select",
            name: "loginLevel", opts: loginLevels, numIndex: true, title: "App Permission only settable up to YOUR level!" }
        ]
      },
      id: { meta: {
        name: "Update User Profile", menuName: "Add User",
        menuLevel: 4,
        additionalFormConfig: [
          // { label: "Sound Preference", type: "select", name: "soundPref", opts: soundPrefs},
          { label: "Email", type: "text", name: "email", title: "Pulled initially from SSO. Many just take the 'one.' off."},
          { pane: "Team Connection", name: "prefs"},
          { label: "Line of Business", type: "select", name: "lob", opts: lobs },
          { label: "Member of Team", type: "select", name: "teamTied", opts: "engagedTeams" },
          { label: "I'm a Builder/Developer", type: "checkbox", name: "roleBuilder", value: 1},
          { label: "I'm a User/Consumer", type: "checkbox", name: "roleUser", value: 1},
          { label: "I'm a Sponsor/Stakeholder", type: "checkbox", name: "roleSponsor", value: 1},
          { label: "Challenge Hours Commitment", type: "select", name: "teamCommit", opts: commitmentTypes},
          { label: "Sound Preference", type: "select", name: "soundPref", opts: soundPrefs}
        ],
        panel: "Connect User to Team, LOB, etc"
      }}
    },
    activity: { meta: {
      menuLevel: 5, // uc
      name: "User Activity  SYSADMIN",
      hstream: "users",
    }},
    usersBySkill: { meta: {
      menuLevel: 5, // uc
      name: "User Skills  SYSADMIN",
      hstream: "users",
      href: "",
      subUrl: {
        hstream: "skills",
        href: ""
      }
    }}
  },
  admin: {
    meta: {
      name: "Admin",
      href: "",
      menuLevel: 5
    },
    teamsRestream: { 
      meta: {
        name: "UTILITY! - Make Restreams from Streams",      menuName: "Restreaming",
        menuLevel: 5,
        panelFn: "restream",
        hstream: "teams",
        subUrl: { hstream: "snap_teams" },
        formConfig: restreamFormConfig,
        primeTab: "Teams Restream"
      },
      scheduleRestream: { meta: {
        name: "Schedule Restream",
        menuLevel: 5,
        panelFn: "restream",
        hstream: "schedule",
        subUrl: { hstream: "snap_schedule" },
        formConfig: restreamFormConfig,
        tabPage: true
      }},
      usersRestream: { meta: {
        name: "Users Restream",
        menuLevel: 5,
        panelFn: "restream",
        hstream: "users",
        subUrl: { hstream: "snap_users" },
        formConfig: restreamFormConfig,
        tabPage: true
      }},    
    },
    querydb: { meta: {
      menuLevel: 5, // uc
      name: "Event Statistics",
      href: ""
    }},
    sampleHtml: { meta: {
      menuLevel: 3, // uc
      name: "HyperScript example",
      panel: "sampleHtml", // this is key in panelObj in view
    }}
  },
  // below is where we'll put all our special routes
  loginScreen: { meta: {
    menuLevel: 10, // over 5 kept from menu
    name: "Login",
    hstream: "users",
    postStream: "session_",
    panelFn: "formPanel",
    makeSess: "eid",
    formConfig: [
      { pane: "This app requires a valid employee session", name: "Login"},
      { label: "Your EID", type: "text", name: "eid", req: "6" },
      { label: "Password", type: "password", name: "password", req: "8", },
    ]
  }},
  register: { meta: {
    menuLevel: 10, // over 5 kept from menu
    name: "Register for Access",
    hstream: "users",
    postStream: "session_",
    panelFn: "formPanel",
    makeSess: "eid",
    formConfig: [
      { pane: "Register now", name: "Register"},
      { label: "Full Name", type: "text", name: "loginName", req: "Your name is key" },
      { label: "Email", type: "text", name: "email", req: "email", title: ""},
      { label: "Your EID", type: "text", name: "eid", req: "Enter your valid Employee Number" },
      { label: "Password", type: "password", name: "password", req: "Strong local password", },
      { label: "Repeat Password", type: "password", name: "password2", req: "Confirm Password", },
    ]
  }},
  welcomeLevel: { meta: {
    menuLevel: 10, // over 5 kept from menu
    name: "Welcome to the TeamTrek!",
    hstream: "users",
    href: "",
    panelFn: "formPanel",
    // move this to special validRoutes property
    sessPropForId: "eid",
    formConfig: [
      { pane: "What role best fits you in the teamTrek?", name: "roleSelect"},
      { label: "Just Visiting", type: "radio", name: "levelSought", value: "1" },
      { label: "Team Member", type: "radio", name: "levelSought", value: "2" },
      { label: "TeamTrek Coach", type: "radio", name: "levelSought", value: "3" },
      { label: "TeamTrek Admin", type: "radio", name: "levelSought", value: "4" }
      // sys admin never a choice coming in, but another sys admin can enable!
    ]
  }},
  cookiesBlock: { meta: {
    menuLevel: 10, // over 5 kept from menu
    name: "There was an Error Setting your Session Cookie",
    tmpPanel: "The SSO service ties to session creation code on our server that was not set. "
  }},
};

export {validRoutes};
