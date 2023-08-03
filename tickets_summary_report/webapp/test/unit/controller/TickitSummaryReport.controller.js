/*global QUnit*/

sap.ui.define([
	"comsalreports/tickets_summary_report/controller/TickitSummaryReport.controller"
], function (Controller) {
	"use strict";

	QUnit.module("TickitSummaryReport Controller");

	QUnit.test("I should test the TickitSummaryReport controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
