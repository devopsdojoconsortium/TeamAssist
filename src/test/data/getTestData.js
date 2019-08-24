import jsonfile from 'jsonfile';
import read from 'read-file';

function getMockJson (filePath) { 
  const urlPath = "mockData/";
  return jsonfile.readFileSync(urlPath + filePath)
}

function stringFromMockData (filePath) { // for tsv, etc that mocks bulk form data, etc
  return read.sync("mockData/" + filePath,  {encoding: 'utf8', normalize: true})
}

export {getMockJson, stringFromMockData}