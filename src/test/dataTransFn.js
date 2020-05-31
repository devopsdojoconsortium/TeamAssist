import chai from 'chai';
const expect = chai.expect;
/* global describe, it */

// import {getMockJson, stringFromMockData} from './data/getTestData';
import {camelize, translateBulkTeamJson, translateTeamTSV} from '../dataTranslation';

describe('camelize', () => {
  it('should be a function', () => {
    expect(camelize).to.be.a('function');
  });

  it('should get rid of any whitespace', () => {
    expect(camelize("heythere ")).to.equal("heythere");
    expect(camelize(" heythere  ")).to.not.match(/\W+/);
  });
  it('should always produce a LC first char', () => {
    expect(camelize(" heythere  ")).to.not.match(/^[A-Z]/);
  });
  it('should camelize a two word lc phrase', () => {
    expect(camelize(" hey there  ")).to.equal("heyThere");
  });
  it('should camelize a two word mixed case phrase', () => {
    expect(camelize("heY tHere  ")).to.equal("heyThere");
  });
  it('should camelize a whole messy string with non alphas', () => {
    expect(camelize("heY tHere Hi! there AND &^%*&()XX why?")).to.equal("heyThereHiThereAndXxWhy");
  });
  it('should camelize a non-alpha first messy string too', () => {
    expect(camelize("!!heY tHere Hi! there AND &^%*&()XX why?")).to.equal("heyThereHiThereAndXxWhy");
  });

});

// describe('translateBulkTeamJson', () => {
//   it('should be a function', () => {
//     expect(translateBulkTeamJson).to.be.a('function');
//   });

//   const teamsAlready = { "8acda8754ba0c7f3014ba0cb9a391e5a": 1 }
//   const rawJson = getMockJson("EasyFormReport-TeamAssistIntake.json");
//   const bulkObj = translateBulkTeamJson(JSON.stringify(rawJson), teamsAlready) 
//   const reqKeys = ["ttLoc", "lob", "teamContactName", "teamContactEmail", "confluenceInterests", "id", "created"]
//   it('should translate ttLoc into two digit keys', () => {
//     // console.log("rawJson", rawJson, "bulkObj", bulkObj)
//     expect(bulkObj[0].ttLoc).to.eql("nj");
//     expect(bulkObj[1].ttLoc).to.eql("hy");
//   });
//   it('should have properties: ' + reqKeys.join(", "), () => {
//     expect(bulkObj[0]).to.have.property("teamContactName");  
//     expect(bulkObj[0]).to.have.all.keys(reqKeys); 
//   });
//   it('should have 24 - 1 teams in array (24 orig minus one filtered)', () => {
//     expect(bulkObj).to.have.lengthOf(23);   
//   });

// });

// describe('translateTeamTSV', () => {
//   it('should be a function', () => {
//     expect(translateTeamTSV).to.be.a('function');
//   });

//   const stateObj = getMockJson("stateObj.json"); // out: 87 35 { added: 18, chng: 18, pass: 32 } 67
//   const tsvParsed = stringFromMockData("ImportSheet_November_v21.tsv");
//   const bulkObj = translateTeamTSV(tsvParsed, stateObj.teams) 
//   const reqKeys = ["status", "id"] // "description", "salesNotes", "lobVp", "keyGoal", "contactName", "status", "project", "id"
//   bulkObj.forEach(o => {
//     it('proj:' + o.project + ', should have props: ' + reqKeys.map(f => f + ": " + o[f]), () => {
//       expect(o).to.include.all.keys(reqKeys); 
//     })
//   });
//   it('should have x teams in array for this test', () => {
//     expect(bulkObj).to.have.lengthOf(88);  
//   });

// });
