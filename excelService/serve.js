const express = require('express')
const app = express()
const fetch = require('node-fetch')

import {excelProc} from './excelProc'
import {mutate} from '../src/frpHelpers'

app.get('/excel/:tab', (req, res) => {
  fetch(`http://localhost:2113/streams/c_teams/0/forward/775?embed=tryharder`)
    .then(response => response.json())
    .then(json => {
      const events = json.entries.reduce((acc, ev) => {
        acc["e" + ev.eventNumber] = mutate(JSON.parse(ev.data), {eId: "e" + ev.eventNumber})
        return acc
      }, {})
      const excelRes = excelProc(mutate(req.params, req.query, req.body), events, json.entries.length)
      // console.log(excelRes)
      res.send("HERE WE GO.... <pre>" + excelRes + JSON.stringify(events, null, 2))
    }
  );
  console.log('teamLoader')
})
app.listen(4000)
console.log('Listening ...')