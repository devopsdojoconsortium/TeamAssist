const teamDO = {

  "menu": {
    "list": [
      {
        "key": "home",
        "name": "Home"
      },
      {
        "key": "schedule",
        "name": "Schedule"
      },
      {
        "key": "teams",
        "name": "Teams"
      },
      {
        "key": "users",
        "name": "Users",
        "sel": true,
        "list": [
          {
            "key": "modUser",
            "name": "Add User"
          },
          {
            "key": "activity",
            "name": "User Activity  SYSADMIN"
          },
          {
            "key": "usersBySkill",
            "name": "User Skills  SYSADMIN"
          }
        ]
      },
      {
        "key": "admin",
        "name": "Admin"
      }
    ],
    "tabs": []
  },
  "list": [
    {
      "displayName": "Drew Deal",
      "loginLevel": "5",
      "email": "drewdeal@gmail.com",
      "guestTied": "",
      "roleBuilder": "1",
      "roleUser": "",
      "roleSponsor": "",
      "guestCommit": "",
      "soundPref": "normal",
      "id": "1144040",
      "user": "1144040",
      "eStamp": 26439160,
      "eId": "e3",
      "eventType": "modUser_Updated",
      "priors": [
        "e0",
        "e1",
        "e2"
      ],
      "ttLoc": "ct"
    }
  ],
  "formObj": {
    "errors": {},
    "hstream": "teams",
    "activePane": ""
  },
  "modalObj": {},
  "rteObj": {
    "meta": {
      "name": "TeamAssist Users",
      "menuName": "Users",
      "menuLevel": 3,
      "hstream": "users",
      "hardFilt": {
        "loginLevel": [
          1,
          2,
          3,
          4,
          5
        ]
      },
      "pageKey": "users",
      "routeKey": "users",
      "routeChain": [
        "users"
      ],
      "parentName": "",
      "tableParams": {
        "cols": [
          {
            "dKey": "displayName",
            "label": "Preferred Name",
            "sort": "asc",
            "width": 150,
            "tdStyle": "sectionLabel",
            "altVal": "-Partial Registrant-"
          },
          {
            "dKey": "loginName",
            "label": "Session Name/Email",
            "minWidth": 180,
            "atag": "mailto:{email}"
          },
          {
            "dKey": "ttLoc",
            "label": " ",
            "sort": "asc",
            "width": 32,
            "title": "__",
            "hashMap": {
              "ct": "Connecticut",
              "vr": "Virtual"
            },
            "thStyle": "thMapsigns.fa.fa-map-signs",
            "imgUrl": "/images/dojo_{ttLoc}_icon.png",
            "atagStyle": {
              "width": "32px",
              "background": "#F4F5F7"
            }
          },
          {
            "dKey": "teamTied",
            "label": "Member of Team",
            "hashMap": "engagedTeams"
          },
          {
            "dKey": "lob",
            "label": "Business",
            "hashMap": [
              "Customer",
              "Provider",
              "Platform",
              "Client",
              "Producer"
            ]
          },
          {
            "dKey": "loginLevel",
            "label": "Access Level",
            "sort": "desc",
            "hashMap": [
              "Access Pending",
              "Visitor",
              "Team Member",
              "TeamAssist Coach",
              "TeamAssist Admin",
              "System Admin"
            ]
          },
          {
            "dKey": "levelSought",
            "label": "Access Requested",
            "hashMap": [
              "Access Pending",
              "Visitor",
              "Team Member",
              "TeamAssist Coach",
              "TeamAssist Admin",
              "System Admin"
            ]
          },
          {
            "dKey": "eStamp",
            "label": "Updated",
            "width": 60,
            "dateFormat": "MM/DD/YY"
          },
          {
            "dKey": "",
            "label": "",
            "atagClasses": ".la.la-edit.la-3x.tableIconLink",
            "altVal": " ",
            "atag": "#/users/modUser/id/{id}",
            "width": 30
          }
        ],
        "filtersPage": {
          "searchCol": [
            "displayName",
            "loginName"
          ],
          "specialRange": [
            25,
            50,
            100,
            150
          ]
        },
        "filtersExtra": {
          "status": {
            "dKey": "loginLevel",
            "label": "Access Level",
            "opts": [
              "Access Pending",
              "Visitor",
              "Team Member",
              "TeamAssist Coach",
              "TeamAssist Admin",
              "System Admin"
            ],
            "numIndex": true,
            "width": 100,
            "getCount": true
          },
          "teamTied": {
            "dKey": "teamTied",
            "label": "Members of Team",
            "opts": "engagedTeams",
            "width": 150,
            "getCount": true
          }
        }
      }
    },
    "modUser": {
      "meta": {
        "name": "Add User",
        "menuLevel": 3,
        "hstream": "users",
        "panel": "Add a New User to TeamAssist",
        "panelFn": "formPanel",
        "formConfig": [
          {
            "pane": "Basic Profile Information",
            "name": "basic"
          },
          {
            "label": "Preferred Display Name (First/Last)",
            "type": "text",
            "name": "displayName",
            "req": "The name you love to hear. YOURS!"
          },
          {
            "label": "TeamAssist Location",
            "req": "Most relevant Location",
            "type": "select",
            "name": "ttLoc",
            "opts": {
              "ct": "Connecticut",
              "vr": "Virtual"
            }
          },
          {
            "label": "Access Level",
            "req": "No blocking yet.",
            "accessLevel": 3,
            "sessValFilter": true,
            "type": "select",
            "name": "loginLevel",
            "opts": [
              "Access Pending",
              "Visitor",
              "Team Member",
              "TeamAssist Coach",
              "TeamAssist Admin",
              "System Admin"
            ],
            "numIndex": true,
            "title": "App Permission only settable up to YOUR level!"
          }
        ]
      },
      "id": {
        "meta": {
          "name": "Update User Profile",
          "menuName": "Add User",
          "menuLevel": 4,
          "additionalFormConfig": [
            {
              "label": "Email",
              "type": "text",
              "name": "email",
              "title": "Pulled initially from SSO. Many just take the 'one.' off."
            },
            {
              "pane": "Team Connection",
              "name": "prefs"
            },
            {
              "label": "Line of Business",
              "type": "select",
              "name": "lob",
              "opts": [
                "Customer",
                "Provider",
                "Platform",
                "Client",
                "Producer"
              ]
            },
            {
              "label": "Member of Team",
              "type": "select",
              "name": "teamTied",
              "opts": "engagedTeams"
            },
            {
              "label": "I'm a Builder/Developer",
              "type": "checkbox",
              "name": "roleBuilder",
              "value": 1
            },
            {
              "label": "I'm a User/Consumer",
              "type": "checkbox",
              "name": "roleUser",
              "value": 1
            },
            {
              "label": "I'm a Sponsor/Stakeholder",
              "type": "checkbox",
              "name": "roleSponsor",
              "value": 1
            },
            {
              "label": "Challenge Hours Commitment",
              "type": "select",
              "name": "teamCommit",
              "opts": {
                "demo": "Demos",
                "lead": "Demos & Leadership",
                "core": "Core Member",
                "consult": "Affiliated Consult"
              }
            },
            {
              "label": "Sound Preference",
              "type": "select",
              "name": "soundPref",
              "opts": {
                "debug": "Debug beep on all views",
                "normal": "Occasional Highlights",
                "none": "None"
              }
            }
          ],
          "panel": "Connect User to Team, LOB, etc"
        }
      }
    },
    "activity": {
      "meta": {
        "menuLevel": 5,
        "name": "User Activity  SYSADMIN",
        "hstream": "users"
      }
    },
    "usersBySkill": {
      "meta": {
        "menuLevel": 5,
        "name": "User Skills  SYSADMIN",
        "hstream": "users",
        "href": "",
        "subUrl": {
          "hstream": "skills",
          "href": ""
        }
      }
    }
  },
  "totRows": {
    "list": 1
  },
  "tRowCntrl": {},
  "dynHashes": {
    "coachers": {
      "1144040": "Drew Deal"
    }
  },
  "cntrl": {},
  "session": {
    "loginName": "Drew",
    "loginLevel": "5",
    "eid": "1144040",
    "user": "1144040",
    "eStamp": 26432599,
    "email": "drewdeal@gmail.com",
    "dataEnv": "dev",
    "displayName": "Drew Deal",
    "guestTied": "",
    "roleBuilder": "1",
    "roleUser": "",
    "roleSponsor": "",
    "guestCommit": "",
    "soundPref": "normal",
    "ttLoc": "ct",
    "uid": "1144040"
  },
  "settings": {
    "pageLimit": 25,
    "ttLoc": []
  },
  "returnRte": [
    "teams"
  ],
  "sub1": {
    "e6bf9b": {
      "Mon20200330": [
        {
          "tid": "e6bf9b",
          "id": "e6bf9b_mon20200330_26426310",
          "wid": "Mon20200330",
          "user": "1144040",
          "schType": "chall",
          "schNote": "zxc",
          "commitment": "committed",
          "aCoach": "",
          "tCoach": "",
          "whenStamp": 26426310,
          "spreadRight": "",
          "eStamp": 26432681,
          "eId": "e0",
          "eventType": "SchedItemCreated",
          "priors": [
            "e0"
          ]
        }
      ]
    }
  }
}


export {teamDO};