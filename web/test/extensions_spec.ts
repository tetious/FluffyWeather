/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/should/should.d.ts"/>
/// <reference path="../typings/mocha/mocha.d.ts"/>
/// <reference path="../util/extensions"/>

require('../util/extensions');
require('should');
var assert = require('assert');

describe("String.toUnderscore", () => {
    it("returns underscored string for camelcased", () => {
        assert.equal("testOne".toUnderscore(), 'test_one');
    });
});

describe("Object.toUnderscore", () => {
    it("returns object with underscored properties", () => {
        var underscored = {hiThere: "bunny"}.toUnderscore();
        underscored.should.have.property('hi_there', 'bunny');
    })
})