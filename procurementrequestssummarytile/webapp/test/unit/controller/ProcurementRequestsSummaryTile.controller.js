/*global QUnit*/

sap.ui.define([
	"comsalsummarytiles/procurementrequestssummarytile/controller/ProcurementRequestsSummaryTile.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ProcurementRequestsSummaryTile Controller");

	QUnit.test("I should test the ProcurementRequestsSummaryTile controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
