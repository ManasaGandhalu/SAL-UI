/*global QUnit*/

sap.ui.define([
	"comsal/chatbotsummary_report/controller/ChatbotSummary.controller"
], function (Controller) {
	"use strict";

	QUnit.module("ChatbotSummary Controller");

	QUnit.test("I should test the ChatbotSummary controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
