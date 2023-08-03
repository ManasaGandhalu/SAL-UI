sap.ui.define([
    "sap/ui/core/mvc/Controller"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller) {
        "use strict";

        return Controller.extend("com.sal.chatbotview.controller.View1", {
            onInit: function () {

            },
            onAfterRendering: function () {
                if (!document.getElementById("cai-webchat")) {
                var t = document.createElement("script");
                t.setAttribute("id", "cai-webchat");
                t.setAttribute("src", "https://cdn.cai.tools.sap/webchat/webchat.js");
                document.body.appendChild(t)
                }
                t.setAttribute("channelId", "2565bad7-4bb7-46fe-88f2-8d8633fe20af");
                t.setAttribute("token", "87f2c4ca82653d1a79ec35c1c43287ff")
                }
        });
    });
