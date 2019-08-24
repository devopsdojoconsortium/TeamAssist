'use strict';

const { Given, When, Then } = require('cucumber');
const { expect, assert } = require('chai');
//const request = require('superagent');
const _ = require('lodash');

// specialized for non-empty
Then(/^response body prop: (\S+) should not be empty$/, function(prop, callback) {
    const res = JSON.parse(this.apickli.getResponseObject().body);
    // console.log(res.city, res[prop], prop, res)
    expect(res[prop]).to.not.be.empty;
    callback();
});
