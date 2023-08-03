/*global QUnit*/

sap.ui.define([
	"comsalreports/sla_compliance_report/controller/SLACompliance.controller"
], function (Controller) {
	"use strict";

	QUnit.module("SLACompliance Controller");

	QUnit.test("I should test the SLACompliance controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
