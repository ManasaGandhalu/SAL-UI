sap.ui.define(
    ["sap/suite/ui/generic/template/lib/AppComponent"],
    function (Component) {
        "use strict";

        return Component.extend("com.sal.requestsummaryreportsmanager.Component", {
            metadata: {
                manifest: "json"
            },

            onBeforeRendering: function() {
                let modelRead = this.getModel().read;
                this.getModel().read = (url, config) => {
                    console.log(url, config);
                    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    config.urlParameters.push(`timezone=${timezone}`);
                    return modelRead.apply(this.getModel(), [url, config]);
                };
            }
        });
    }
);