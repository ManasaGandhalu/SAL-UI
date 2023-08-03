/*global QUnit*/

sap.ui.define([
	"comsal/plantmaintenancereqsummarytile/controller/PlantMaintenanceReqSummaryTile.controller"
], function (Controller) {
	"use strict";

	QUnit.module("PlantMaintenanceReqSummaryTile Controller");

	QUnit.test("I should test the PlantMaintenanceReqSummaryTile controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
