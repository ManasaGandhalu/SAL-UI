/*global QUnit*/

sap.ui.define([
	"comsal/task_summary_report/controller/TaskSummaryReport.controller"
], function (Controller) {
	"use strict";

	QUnit.module("TaskSummaryReport Controller");

	QUnit.test("I should test the TaskSummaryReport controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
