/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comsal/sal_hr/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
