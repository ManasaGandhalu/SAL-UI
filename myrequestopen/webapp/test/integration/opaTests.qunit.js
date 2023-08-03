/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require(["com/sal/myrequestopen/myrequestopen/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});
