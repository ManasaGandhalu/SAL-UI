/*global QUnit*/

sap.ui.define([
	"comsaldonerequestcardtile/donerequestcardtile/controller/DoneRequestCard.controller"
], function (Controller) {
	"use strict";

	QUnit.module("DoneRequestCard Controller");

	QUnit.test("I should test the DoneRequestCard controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
