/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comsalsummarytiles/hrrequestssummarymanagertile/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
