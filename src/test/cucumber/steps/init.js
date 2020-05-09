'use strict';

const apickli = require('apickli/apickli.js');
const {defineSupportCode} = require('cucumber');

defineSupportCode(function({Before}) {
    Before(function() {
		this.apickli = new apickli.Apickli('http', "TeamAssist-test.com:2113");
		this.apickli.addRequestHeader('Cache-Control', 'no-cache');
		this.apickli.setGlobalVariable('authheadername', "authheadername");
		this.apickli.setGlobalVariable('authheadervalue', "authheadervalue");
    });
});

defineSupportCode(function({setDefaultTimeout}) {
    setDefaultTimeout(20 * 1000);
});
