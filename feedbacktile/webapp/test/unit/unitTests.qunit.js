/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comsal/feedbacktile/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
