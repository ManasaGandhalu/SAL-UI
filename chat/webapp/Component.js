sap.ui.define(["sap/fe/core/AppComponent"], function (AppComponent) {
    "use strict";

    return AppComponent.extend("chat.Component", {
        metadata: {
            manifest: "json"
        },
        init: function () {

            this.renderRecastChatbot();
            this._getRenderer();
        },
        renderRecastChatbot: function () {
            // debugger;
            if (!document.getElementById("cai-webchat")) {
                var s = document.createElement("script");
                s.setAttribute("id", "cai-webchat");
                s.setAttribute("src", "https://cdn.cai.tools.sap/webchat/webchat.js");
                s.setAttribute("channelId", "15c31348-867a-40b9-9157-cf594ecdba7b");
                s.setAttribute("token", "3fdcb50dfe8b7bef23974ebd11a9fcd3");
               
                // var sBaseUrl = this._getApiBaseURL(sThis,"chatbot");
                // s.setAttribute("apiRoot", sBaseUrl + "/public/api");
                // document.body.appendChild(s);
            }
            // if (!document.getElementById("cai-webchat")) {
            //     var s = document.createElement("script");
            //     s.setAttribute("id", "cai-webchat");
            //     s.setAttribute("src", "https://cdn.cai.tools.sap/webchat/webchat.js");
            //     document.body.appendChild(s);
            // }
            // s.setAttribute("channelId", "2565bad7-4bb7-46fe-88f2-8d8633fe20af");
            // s.setAttribute("token","87f2c4ca82653d1a79ec35c1c43287ff");
            // s.setAttribute("apiRoot","https://sal-btp-cf-dev-8glkufj3.sapcai.eu10.hana.ondemand.com/public/api");
        },


        // _getApiBaseURL: function (sThis, sSource) {
        //     var appId = sThis.getOwnerComponent().getManifestEntry("/sap.app/id"); 
        //     var appPath = appId.replaceAll(".", "/"); 
        //     var appModulePath = jQuery.sap.getModulePath(appPath); 
        //     var oDataSource = sThis.getOwnerComponent().getMetadata().getManifestEntry("sap.app").dataSources; 
        //     var dSourceUri = oDataSource[sSource].uri; 
        //     var apiEndpoint = appModulePath + "/" + dSourceUri; 
        //     apiEndpoint = apiEndpoint.replace("//", "/"); 
        //     return apiEndpoint;
        // },

        _getRenderer: function () {
            var that = this,
                // @ts-ignore
                oDeferred = new jQuery.Deferred(),
                oRenderer;

            // @ts-ignore
            that._oShellContainer = jQuery.sap.getObject("sap.ushell.Container");
            if (!that._oShellContainer) {
                oDeferred.reject(
                    "Illegal State");
            } else {
                oRenderer = that._oShellContainer.getRenderer();
                if (oRenderer) {
                    oDeferred.resolve(oRenderer);
                } else {
                    that._onRendererCreated = function (oEvent) {
                        oRenderer = oEvent.getParameter("renderer");
                        if (oRenderer) {
                            oDeferred.resolve(oRenderer);
                        } else {
                            oDeferred.reject("Illegal State");
                        }
                    };
                    that._oShellContainer.attachRendererCreatedEvent(that._onRendererCreated);
                }
            }
            return oDeferred.promise();
        }
    });
});
