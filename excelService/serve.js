const express = require('express')
const bodyParser = require('body-parser')
const app = express()

import {excelProc} from './excelProc'
import {mutate} from '../src/frpHelpers'

app.use(bodyParser.urlencoded({ extended: true })) // middleware for parsing application/x-www-form-urlencoded

app.get('/excel/:tab', (req, res) => {
  res.send("Confirmation will appear here <br>" )
})
app.post('/excel/:tab', (req, res) => {
  const reqs = mutate(req.params, req.query, req.body)
  console.log(reqs)
  const excelRes = excelProc(reqs)
  console.log(excelRes)
  res.send("File created! <br>" + excelRes )
  // console.log('Excel Created with params: ', reqs)
})
app.listen(4000)
console.log('Listening ...')