'use strict';

const ttLocs = { ct: "Connecticut", vr: "Virtual" }

const lobs = ["Customer", "Provider", "Platform", "Client", "Producer"]

const teamStatus = { pre: "Prefill", lead: "Lead", eng: "Engagement", 
  cons: "Consult", qual: "Pre-qualification", ch: "Charter", imm: "Immersion", grad: "Graduated", out: "Opt-Out" }

const loginLevels = ["Access Pending", "Visitor", "Team Member", "TeamTrek Coach", "TeamTrek Admin", "System Admin"] // 0-5
const commitmentTypes = { demo: "Demos", lead: "Demos & Leadership", core: "Core Member", consult: "Affiliated Consult" }
const soundPrefs = { debug: "Debug beep on all views", normal: "Occasional Highlights", none: "None" }
const ENTER_KEY = 13;
const ESC_KEY = 27;

const ES_DIT_HOST = "localhost" // teamTrek-test.cigna.com";

function getEventStoreUrl (stream) {
  const protocol = window.location.href.split(":")[0];
  const debug = window.location.href.match(/debug/);
  const host = window.location.href.match(/localhost/) ? "localhost" : ES_DIT_HOST
  // let url = `${protocol}://${host}/teamTrekdb`;
  let url = `${protocol}://${host}:2113`;

  if (debug) {
    url = "http://localhost:2113";
  }

  if (stream) {
    url = `${url}/streams/${stream}`
  }

  return url;
}

export {ttLocs, lobs, teamStatus, loginLevels, commitmentTypes, soundPrefs, ENTER_KEY, ESC_KEY, getEventStoreUrl};
