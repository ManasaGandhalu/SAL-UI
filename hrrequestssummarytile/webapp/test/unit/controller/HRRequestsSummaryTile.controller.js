/*global QUnit*/

sap.ui.define([
	"comsalsummarytiles/hrrequestssummarytile/controller/HRRequestsSummaryTile.controller"
], function (Controller) {
	"use strict";

	QUnit.module("HRRequestsSummaryTile Controller");

	QUnit.test("I should test the HRRequestsSummaryTile controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
