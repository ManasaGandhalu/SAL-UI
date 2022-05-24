sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/model/json/JSONModel","sap/ui/core/Fragment"],function(e,t,a){"use strict";return e.extend("com.sal.report.chatbotsummaryreport.controller.ChatbotSummary",{onInit:function(){var e={donut:{"sap.card":{type:"Analytical",header:{type:"Numeric",title:"Most Used Skills",subTitle:"",data:{json:{NumberCount:"0",Unit:"",Trend:"",TrendColor:"Good"}}},content:{chartType:"Donut",legend:{visible:false,position:"top",alignment:"Right"},plotArea:{dataLabel:{visible:true,type:"label",showTotal:false}},title:{text:"Most Used Skills",visible:false},measureAxis:"size",dimensionAxis:"color",data:{json:{measures:[]},path:"/measures"},dimensions:[{label:"Measure Name",value:"{ProductName}"}],measures:[{label:"Value",value:"{UnitsInStock}"}]}}}};this.sBearerToken=this.fnGetBearerToken();if(this.sBearerToken){$.ajax({type:"GET",url:"/sal_cai_dev/public/api/usage-metrics/v2/summary",contentType:"application/json",headers:{"X-Token":"12bf59e7e3763bd9b109083e7407e8aa",Authorization:"Bearer "+this.sBearerToken},success:function(a){var s=new t(a.results);e.donut["sap.card"].content.data.json.measures=a.results.skills;e.donut["sap.card"].content.data.path="/measures";this.getView().setModel(s,"ChatbotSummaryModel")}.bind(this),error:function(){}})}},fnGetBearerToken:function(){$.ajax({type:"GET",url:"/sal_cai_auth/oauth/token?grant_type=client_credentials",contentType:"application/json",success:function(e){this.sBearerToken=e;return this.sBearerToken}.bind(this),error:function(){}})},handleFiltersPress:function(e){var t=e.getSource(),s=this.getView();if(!this._pPopover){this._pPopover=a.load({id:s.getId(),name:"com.sal.report.chatbotsummaryreport.view.FiltersDialog",controller:this}).then(function(e){return e})}this._pPopover.then(function(e){e.openBy(t)})}})});