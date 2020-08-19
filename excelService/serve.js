const express = require('express')
const app = express()
const fetch = require('node-fetch')

import {excelProc} from './excelProc'
import {mutate} from '../src/frpHelpers'

app.get('/excel/:tab', (req, res) => {
  const excelRes = excelProc(mutate(req.params, req.query, req.body))
  console.log(excelRes)
  res.send("File created! <br>" + excelRes )
  console.log('teamLoader')
})
app.listen(4000)
console.log('Listening ...')