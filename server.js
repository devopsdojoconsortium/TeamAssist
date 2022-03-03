'use strict';

const express = require('express');

// Constants
const PORT = 80;
const HOST = '0.0.0.0'; // Docker container host requirement

// App
const app = express();

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);