'use strict';

const ttLocs = { ct: "Connecticut", vr: "Virtual" }

const lobs = ["Customer", "Provider", "Platform", "Client", "Producer"]

const teamStatus = { pre: "Prefill", lead: "Lead", cont: "Contacted", 
  cons: "Consult", qual: "Pre-qualification", ch: "Charter", eng: "Engagement", grad: "Graduated", out: "Opt-Out" }

const statusColors = { pre: "#aaa", lead: "#89a0c3", cont: "#57a1e4", 
  cons: "#57d0d6", qual: "#0eadb5", ch: "#79e200", eng: "#4bb529", grad: "#f57c00", out: "#333" }

const skillCats = { pipeline: "Pipeline", charter: "Charter", agile: "Agile" }
const loginLevels = ["Access Pending", "Visitor", "Team Member", "TeamAssist Coach", "TeamAssist Admin", "System Admin"] // 0-5
const commitmentTypes = { demo: "Demos", lead: "Demos & Leadership", core: "Core Member", consult: "Affiliated Consult" }
const soundPrefs = { debug: "Debug beep on all views", normal: "Occasional Highlights", none: "None" }
const ENTER_KEY = 13;
const ESC_KEY = 27;

const ES_DIT_HOST = "localhost" // TeamAssist-test.cigna.com";

function getEventStoreUrl (stream) {
  const protocol = window.location.href.split(":")[0];
  const debug = window.location.href.match(/debug/);
  const host = window.location.href.match(/localhost/) ? "localhost" : ES_DIT_HOST
  // let url = `${protocol}://${host}/TeamAssistdb`;
  let url = `${protocol}://${host}:2113`;

  if (debug) {
    url = "http://localhost:2113";
  }

  if (stream) {
    url = `${url}/streams/${stream}`
  }

  return url;
}

export {ttLocs, lobs, teamStatus, statusColors, skillCats, loginLevels, commitmentTypes, soundPrefs, ENTER_KEY, ESC_KEY, getEventStoreUrl};
