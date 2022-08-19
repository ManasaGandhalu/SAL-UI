/*
 * Copyright (C) 2009-2020 SAP SE or an SAP affiliate company. All rights reserved.
 */
/*Base controller*/
jQuery.sap.require("sap.ca.ui.message.message");
var oMessagePopover;
var oSearchterm, callInitAfterDeleteOrder;
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History",
	"ui/s2p/mm/requisition/maintain/s1/model/formatter",
	"ui/s2p/mm/requisition/maintain/s1/misc/DataManager",
	"sap/ui/model/json/JSONModel",
	'sap/m/MessageBox'
], function(Controller, History, formatter, DataManager, JSONModel, MessageBox) {
	"use strict";
	return Controller.extend("ui.s2p.mm.requisition.maintain.s1.controller.BaseController", {

		dataManager: DataManager,
		entityConstants: DataManager.EntityConstants,
		formatter: formatter,
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		setTestMode: function(bBool) {
			this.getOwnerComponent().getComponentData().testMode = bBool;
		},

		getTestMode: function() {
			return this.getOwnerComponent().getComponentData().testMode;
		},
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Setter for the Search Text .
		 * @public
		 */
		setSearchterm: function(searchterm) {
			oSearchterm = searchterm;
		},

		/**
		 * Getter for the Search Text .
		 * @public
		 * @returns search text
		 */
		getSearchterm: function() {
			return oSearchterm;
		},

		/**
		 * Triggers a Update request once the mini cart list has been updated
		 */
		listUpdated: function() {
			if (this.getView().byId("btnCart").getText() > 0) {
				sap.ui.getCore().byId("popover").getFooter().getAggregation("content")[1].focus();
				sap.ui.getCore().byId("popover").getFooter().getAggregation("content")[1].setEnabled(true);
				sap.ui.getCore().byId("popover").getFooter().getAggregation("content")[2].setEnabled(true);
				this.retrieveMessages();
			} else {
				sap.ui.getCore().byId("popover").getFooter().getAggregation("content")[1].setEnabled(false);
				sap.ui.getCore().byId("popover").getFooter().getAggregation("content")[2].setEnabled(false);
			}
			if (!(this.sourcePage === "FreeText" && this.isMaterial())) {
				if (this.getView().byId("price")) {
					this.getView().byId("price").setValue("");
				}
			}
		},
		storeMessages: function(data, headers) {
			this.headers = headers;
		},
		retrieveMessages: function() {
			// this.headers;
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.removeAllMessages();
			if (!(this.getView().byId("btnCart").getText() === "0")) {
				if (this.headers) {

					if (this.headers.headers["sap-message"]) {
						var oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
						var messages = [];
						messages.push(JSON.parse(this.headers.headers["sap-message"]).message);

						if (this.headers.headers["sap-message"].search("details")) {
							var errors = JSON.parse(this.headers.headers["sap-message"]);
							for (var i = 0; i < errors.details.length; i++) {
								messages.push(errors.details[i].message);
							}
						}

						for (i = 0; i < messages.length; i++) {
							var code = "";
							if (errors.details.length > 1) {
								code = errors.details[i]["code"];
							}
							var errorMessage = new sap.ui.core.message.Message({
								message: messages[i],
								type: sap.ui.core.MessageType.Error,
								id: "1",
								code: code,
								persistent: true,
								// target: "/idMaterialDescription/value",
								processor: oMessageProcessor
							});
							oMessageManager.addMessages(errorMessage);
						}
					}
				}
			}
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function(sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function(oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function() {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to a route passed to this function.
		 *
		 * @public
		 * @param {string} sRoute the name of the route if there is no history entry
		 * @param {object} mData the parameters of the route, if the route does not need parameters, it may be omitted.
		 */
		myNavBack: function(sRoute, mData) {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo(sRoute, mData, bReplace);
			}
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},
		/**
		 * Setter method to set the draft guid
		 * @public
		 *
		 * @param{draftKey}his. Draft Key fo the application
		 *
		 */
		setHeaderDraftKey: function(draftKey) {
			this.draftKey = draftKey;
			this.getOwnerComponent().getComponentData().draftKey = draftKey;
		},

		/**
		 * Getter method which returns the draft guid
		 * @public
		 *
		 */
		getHeaderDraftKey: function() {
			if (this.getOwnerComponent().getComponentData().draftKey) {
				return this.getOwnerComponent().getComponentData().draftKey;
			} else {
				return this.draftKey;
			}
		},

		setKeys: function(param) {

			var keys = param.startupParameters["Keys"];

			if (keys) {
				// var pattern =param.startupParameters["page"];
				this.sourcePage = keys[0];
				this.draftKey = keys[1];
				this.purchaseRequisition = keys[2];
			}

		},
		setSourcePage: function(page) {
			this.sourcePage = page;
			this.getOwnerComponent().getComponentData().sourcePage = page;
		},
		getSourcePage: function() {
			if (this.getOwnerComponent().getComponentData().sourcePage) {
				return this.getOwnerComponent().getComponentData().sourcePage;
			} else {
				return this.sourcePage;
			}
		},
		navToSourcePage: function() {
			if (this.getSourcePage() === "FreeText") {
				this.goToFreetext();
			} else if (this.getSourcePage() === "CartOverview" || this.getSourcePage() === "ItemDetails") {
				this.handleViewCartPress();
			} else if (this.getSourcePage() === "PurReqList") {
				this.getRouter().navTo("PurReqList");
			} else if (this.getSourcePage() === "Search") {
				this.getRouter().navTo("Search");
				this.getView().setVisible(true);
			}
			// else {
			// 	var purchaseRequisition = this.getPurchaseRequisition() ? this.getPurchaseRequisition() : this.entityConstants.DUMMY_PR_KEY;
			// 	this.prNumber = purchaseRequisition;
			// 	this.prItemNo = this.getOwnerComponent().getComponentData().purReqnItem;
			// 	this.ItemDraft = this.getOwnerComponent().getComponentData().purReqnItemDraft;
			// 	this.itemPath = this.getOwnerComponent().getComponentData().PRitemPath;
			// 	this.getRouter().navTo("ItemDetails", {
			// 		DraftKey: this.getHeaderDraftKey(),
			// 		PurchaseRequisition: purchaseRequisition,
			// 		OpnCtlgItemID: 0,
			// 		PurReqnItemDraftUUID: this.ItemDraft,
			// 		items: this.itemPath,
			// 		PurchaseRequisitionItem: this.prItemNo
			// 	});
			// }
			this.setSourcePage('');
			this.getOwnerComponent().getComponentData().changingSourcePageAllowed = true;
		},
		goToFreetext: function() {
			var oSearchValue = this.getView().byId("searchItems").getValue();
			if (oSearchValue.length === 0) {
				oSearchValue = " ";
			}
			if (this._oMiniCart) {
				this._oMiniCart.destroy();
				this._oMiniCart = null;
			}
			if (this._oPopover) {
				this._oPopover.destroy();
				this._oPopover.destroyContent();
				this._oPopover = null;
			}
			var purchaseRequisition = this.getPurchaseRequisition() ? this.getPurchaseRequisition() : this.dataManager.EntityConstants.DUMMY_PR_KEY;
			this.getRouter().navTo("Freetext", {
				DraftKey: this.getHeaderDraftKey(),
				PurchaseRequisition: purchaseRequisition,
				SearchValue: oSearchValue
			});

		},

		/**
		 * Setter method to set the Purchase Requisition Number
		 * @public
		 * @param{prNo} Purchase Requisition Number fo the application
		 */

		setPurchaseRequisition: function(prNo) {
			if (prNo === this.entityConstants.DUMMY_PR_KEY) {
				this.purchaseRequisition = '';
			} else {
				this.purchaseRequisition = prNo;
			}
			this.getOwnerComponent().getComponentData().purchaseRequisition = this.purchaseRequisition;
		},

		/**
		 * Getter method to get the Purchase Requisition Number
		 * @public
		 * @return Purchase Requisition Number
		 */

		getPurchaseRequisition: function() {
			if (this.getOwnerComponent().getComponentData().purchaseRequisition) {
				return this.getOwnerComponent().getComponentData().purchaseRequisition;
			} else {
				if (this.purchaseRequisition === undefined) {
					return '';
				} else {
					return this.purchaseRequisition;
				}
			}

		},

		/**
		 * Setter method to set the currently logged in User Id
		 * @public
		 * @param{userId} User logged in the application
		 */
		setUserID: function(userId) {
			this.userId = userId;
		},
		/**
		 * Getter method to get the currently logged in User Id
		 * @public
		 * @return User Id
		 */
		getUserID: function() {
			return this.userId;
		},

		/**
		 * Returns an object which will be passed to the DataManager with properties
		 * oParentObject - Parent Controller,
		 * successHandler - OData service success handler
		 * errorHandler - OData service error handler
		 *
		 * @param{successHandler} : Success Handler function callback, this is called after the service call returns SUCCESS(Status Code : 200, 201)
		 * @param{errorHandler} : Error handler function callback, called when service fails(Status Codes : 400, 500, 401)
		 */
		getServiceCallParameter: function(successHandler, errorHandler) {
			return {
				oParentObject: this,
				successHandler: successHandler,
				errorHandler: errorHandler
			};

		},

		/**
		 * Convenience method which will navigate to Cart Overview Screen
		 * @public
		 */

		handleViewCartPress: function() {
			if (this._oMiniCart) {
				this._oMiniCart.destroy();
				this._oMiniCart = null;
			}
			if (this._oContent) {
				this._oContent.destroy();
				this._oContent = null;
			}
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.removeAllMessages();
			var purchaseRequisition = this.getPurchaseRequisition() ? this.getPurchaseRequisition() : this.entityConstants.DUMMY_PR_KEY;
			this.getRouter().navTo("CartOverview", {
				DraftKey: this.getHeaderDraftKey(),
				PurchaseRequisition: purchaseRequisition
			});

		},

		/**
		 * Getter method which will return the model details
		 * @public
		 * return oData model
		 */
		getAppModel: function() {
			var oModel = this.getOwnerComponent().getModel();
			oModel.setDefaultBindingMode("TwoWay");
			return oModel;
		},

		/**
		 * Setter method which will set the variable "callInitAfterDeleteOrder" when we delete the cart from Cart Overview screen
		 * @public
		 */
		setOrderDelete: function(uid) {
			callInitAfterDeleteOrder = uid;
		},

		/**
		 * Getter method which will returns the variable "callInitAfterDeleteOrder"
		 * @public
		 * return callInitAfterDeleteOrder
		 */
		getOrderDelete: function() {
			return callInitAfterDeleteOrder;
		},

		/**
		 * Trigger a request which will trigger when we delete the item from mini cart list
		 */
		deleteItem: function(oEvent) {
			var oItem = oEvent.getParameter('listItem');
			var oList = oEvent.getSource();
			this.deleteItemId = oEvent.getParameter('listItem').getId();
			var sPath = oItem.getBindingContext().getPath();
			oList.getModel().remove(sPath);
			oList.attachEventOnce('updateFinished', oList.focus, oList);
			this.refreshMinicart();
		},

		/**
		 * Trigger a request which will update the no. of items in your mini cart
		 */
		refreshMinicart: function() {
			var mParameters = this.getServiceCallParameter(this.headerSuccess, this.serviceFail);
			this.dataManager.getHeader(mParameters, this.getHeaderDraftKey(), this.getPurchaseRequisition());
		},
		firstMiniCartOpen: function() {

			var cartbtn = this.getView().byId("btnCart");
			if (cartbtn.getText() === "1") {
				cartbtn.firePress();
				cartbtn.setType("Emphasized");
			}

		},

		/**
		 * This is the success callback which will trigger once the service in refresh Mini Cart will executed successfully
		 */
		headerSuccess: function(data) {
			var viewName = this.getView().getId().toString();
			if (viewName.search("Search") > 0) {
				var oJSModelCart = new sap.ui.model.json.JSONModel(data);
				this.getView().byId("btnCart").setModel(oJSModelCart);
				this.getView().byId("btnCart").bindElement("/");
			} else {
				this.dataManager.headerSuccess(this.getView().byId("btnCart"), [this.getPurchaseRequisition(), "guid'" + this.getHeaderDraftKey() +
					"'"
				]);
				// this.getView().byId('btnCart').bindElement("/" + this.entityConstants.getEntityName('headerEntity') +
				// 	"(PurchaseRequisition='" + this.getPurchaseRequisition() + "',PurReqnDraftUUID=guid'" + this.getHeaderDraftKey() + "')");
			}

			if (viewName.search("Freetext") > 0) {
				var purData = data;
				if (purData.NumberOfItems > 1) {
					var oText = purData.NumberOfItems + " " + this.getResourceBundle().getText("items") + " " + this.getResourceBundle().getText(
						"itemcount");
				} else {
					var oText = purData.NumberOfItems + " " + this.getResourceBundle().getText("item") + " " + this.getResourceBundle().getText(
						"itemcount");
				}
				var itemsInCart = this.getView().byId("numberofitems");
				itemsInCart.setText(oText);
			}

			if (Number(this.getView().byId('btnCart').getText()) > 0) {
				this.getView().byId('btnCart').setType("Emphasized");
			} else {
				this.getView().byId('btnCart').setType("Default");
			}
			var prData = data.results ? data.results[0] : data;
			this.setUserID(prData.PurReqnSSPAuthor);
		},

		/**
		 * trigger a delete request which will display the message and call
		 * the other function to update the mini cart
		 */
		deleteSuccess: function() {
			sap.m.MessageToast.show(this.getResourceBundle().getText("delete"));
			this.deleteItemId = null;
			this.refreshMinicart();
		},

		validateQuantity: function() {
			var quantity;
			var items = this.getView().byId("productsTable").getItems().length;
			for (var i = 0; i < items; i++) {
				quantity = this.getView().byId("productsTable").getItems()[i].getCells()[3].getItems()[0].getValue();
				quantity = quantity.split('.').join('');
				quantity = quantity.split(',').join('');
				quantity = Number(quantity);
				if (quantity <= 0 || isNaN(quantity)) {
					this.getView().byId("productsTable").getItems()[i].getCells()[3].getItems()[0].setValueState(sap.ui.core.ValueState.Error);
					// this.getView().byId("productsTable").getItems()[i].getCells()[3].getItems()[0].setValueStateText(this.getResourceBundle().getText("quantityError"));
					return false;
				}
			}
			return true;
		},

		/**
		 * trigger a order request when we click on Order button in Mini cart List
		 */
		handleOrderCartPress: function() {
			var bflag = true;
			if (this.getView().getId().search("CartOverview") > 0) {
				bflag = this.validateQuantity();
			}
			if (bflag) {
				var that = this;
				this.getView().setBusy(true);
				if (this.getTestMode()) {
					var a, b;
					this.orderCartSuccessCallback(a, b);
				}
				var purchaseRequisition = this.getPurchaseRequisition() ? this.getPurchaseRequisition() : this.entityConstants.DUMMY_PR_KEY;
				this.prNumber = purchaseRequisition;
				var mParameters = this.getServiceCallParameter(this.orderCartSuccessCallback, this.serviceFail);
				setTimeout(function() {
					that.dataManager.activateDocument(mParameters, that.getHeaderDraftKey(), that.getPurchaseRequisition());
				}, 3000);
			}
		},

		/**
		 * trigger a successcall back request when the service in handleOrderCartPress will executed successfully
		 */
		orderCartSuccessCallback: function(data, headers) {
			var that = this;
			var text;
			var viewName = this.getView().getId().toString();
			this.getView().setBusy(false);
			if (!this.getTestMode()) {
				if (headers.headers['sap-message']) {
					var s = JSON.parse(headers.headers['sap-message']);
					if (((s['code'])) && ((s['code'] == '06/402') || (s['code'] == '06/403'))) {
						text = JSON.parse(headers.headers['sap-message']).message;
					} else if (JSON.parse(headers.headers['sap-message']).details[0].code === '06/402') {
						text = JSON.parse(headers.headers['sap-message']).details[0].message;
					} else if (JSON.parse(headers.headers['sap-message']).details[0].code === '06/403') {
						text = JSON.parse(headers.headers['sap-message']).details[0].message;
					} else {
						text = that.getResourceBundle().getText("MSG_SuccessOrder");
					}
				}
			} else {
				text = "Purchase Requisition 10133876 Created";
			}

			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.removeAllMessages();
			MessageBox.show(text, {
				icon: MessageBox.Icon.INFORMATION,
				title: that.getResourceBundle().getText("orderCart"),
				actions: [that.getResourceBundle().getText("ok")],
				onClose: function(oAction) {
					if (oAction === that.getResourceBundle().getText("ok")) {
						that.refreshView();
						that.setOrderDelete(true);
						if (viewName.search("Search") > 0) {
							that._handleRouteMatched();
						} else {
							//do nothing
						}
						if (that.getPurchaseRequisition() === '') {
							that.getRouter().navTo("Search");
						} else {
							that.getRouter().navTo("PurReqList");
						}

					} else {
						//do nothing. 
					}
				},
				initialFocus: that.getResourceBundle().getText("ok")
			});
		},

		refreshView: function() {
			//this.getView().getModel().remove(this.getView().getBindingContext().getPath());
			if (this._oPopover) {
				this._oPopover.destroy();
				this._oPopover.destroyContent();
				this._oPopover = null;
			}
			if (this._oMiniCart) {
				this._oMiniCart.destroy();
				this._oMiniCart.destroyContent();
				this._oMiniCart = null;
			}
		},

		updateMiniCartTotal: function() {
			this.dataManager.updateMiniCartTotal(sap.ui.getCore().byId("minicartTotal"), [this.getPurchaseRequisition(), "guid'" + this.getHeaderDraftKey() +
				"'"
			]);
			// sap.ui.getCore().byId("minicartTotal").bindElement("/" + this.entityConstants.getEntityName('headerEntity') +
			// 	"(PurchaseRequisition='" +
			// 	this.getPurchaseRequisition() +
			// 	"',PurReqnDraftUUID=guid'" + this.getHeaderDraftKey() + "')");

		},
		prepareMiniCart: function() {
			this._oMiniCart = sap.ui.xmlfragment("ui.s2p.mm.requisition.maintain.s1.view.PopoverCart", this);
			//commenting as part of change for IntIncident 1770460409 & 1770572448
			//this._oItemTemplate = this._oMiniCart.getContent()[0].getAggregation('items')[0].getItems()[0];
			this.getView().addDependent(this._oMiniCart);
			this._oMiniCart.setContentHeight("auto");
			//change as part of IntIncident 1770460409 & 1770572448
			//this._oItemTemplate = this._oMiniCart.getContent()[0].getAggregation('items')[0].getItems()[0];
			this._oItemTemplate = this._oMiniCart.getContent()[0].getAggregation('items')[0].getItems()[0].clone();
			this.getView().addDependent(this._oMiniCart);
			//change as part of IntIncident 1770460409 & 1770572448
			//this._oMiniCart.getContent()[0].getAggregation('items')[0].removeAllItems();
			this._oMiniCart.getContent()[0].getAggregation('items')[0].destroyItems();
			if (this.getTestMode()) {
				this.setPurchaseRequisition("PurchaseRequisition 8");
			}

			this.dataManager.prepareMiniCart(this._oMiniCart.getContent()[0].getAggregation('items')[0], this._oItemTemplate, [this.getPurchaseRequisition(),
				"guid'" + this.getHeaderDraftKey() + "'"
			]);
			// this._oMiniCart.getContent()[0].getAggregation('items')[0].bindItems({
			// 	path: "/" + this.entityConstants.getEntityName('headerEntity') +
			// 		"(PurchaseRequisition='" + this.getPurchaseRequisition() + "',PurReqnDraftUUID=guid'" + this.getHeaderDraftKey() + "')/" + this
			// 		.entityConstants
			// 		.getEntityNavigationName('item'),
			// 	template: this._oItemTemplate
			// });

		},
		openMiniCart: function(oEvent) {
			var oEventSrc = oEvent.getSource();
			this._oMiniCart.openBy(oEventSrc);
		},
		getMiniCartData: function() {
			// var mListParameters = this.getServiceCallParameter(this.genInfoCart1, this.errorServiceFail1);
			// this.dataManager.getItems(mListParameters, this.getHeaderDraftKey(), this.getPurchaseRequisition());
			sap.ui.getCore().byId("minicartList").getBinding("items").refresh();
			var viewName = this.getView().getId().toString();
			if (viewName.search("Freetext") > 0) {
				this.oModel.resetChanges();
				this.getView().byId("idMaterial").setValue(this.dummy.Material);
				this.getView().byId("idMaterialDescription").setValue(this.dummy.PurchaseRequisitionItemText);
				this.getView().byId("idMaterialDescription").setEditable(true);
				this.getView().byId("idMaterialGroup").setValue(this.dummy.MaterialGroup);
				this.getView().byId("idMaterialGroup").setEditable(true);
				this.getView().byId("idMaterialGroupText").setValue(this.dummy.MaterialGroup_Text);
				// this.getDummyItem();
			}
		},
		genInfoCart1: function() {

		},
		errorServiceFail1: function() {

		},

		onPressCart: function(oEvent) {

			if (this.getTestMode()) {
				this.getView().byId("btnCart").setText("1");
			}
			if (this.getView().byId("btnCart").getText() > 0) {
				if (!this._oMiniCart) {
					this.prepareMiniCart();
				}

				this.getMiniCartData();
				this.updateMiniCartTotal();
				this.openMiniCart(oEvent);

			} else {
				sap.m.MessageToast.show(this.getResourceBundle().getText("noItemsText"));
			}

		},

		onPressCart1: function(oEvent) {
			sap.m.MessageToast.show(this.getResourceBundle().getText("noItemsText"));

		},
		beforeDialogOpen: function() {
			sap.ui.getCore().byId("btnaddSupplier").setEnabled(true);
			this.supplierValid = false;
		},
		onSupplierChange: function() {
			this.supplierValid = false;
			var supplier = sap.ui.getCore().byId("supplier").getValue();
			var supplierId = sap.ui.getCore().byId("supplier");
			this.supplierNameoData = supplierId.getBindingContext().getModel().oData;
			this.supplierEntity = supplier; //Temporarily holding value of supplier. 

			if (!(supplier === '' || supplier === " " || supplier.toString().trim().length === 0)) {
				sap.ui.getCore().byId("btnaddSupplier").setEnabled(false);
				this.dataManager.getSupplierName(this.getServiceCallParameter(this.intrimSupplierCheckSuccess, this.supplierCheckFailure),
					supplier);
			} else {
				this.supplierValid = false;
			}
		},
		// Supplier Validation Logic

		//Function to overcome the TypeCase Problem of Supplier.
		findCorrectSupplier: function(supplier, data) {
			for (var temp in data.results) {
				if (data.results[temp].Supplier === supplier) {
					return supplier;
				}
				if (data.results[temp].Supplier.toUpperCase() === supplier) {
					return supplier.toLowerCase();
				}
			}
		},

		//intrim check for SupplierName
		intrimSupplierCheckSuccess: function(data) {
			var supplierIDCheck = this.findCorrectSupplier(this.supplierEntity, data);
			if (data && supplierIDCheck) {
				this.supplierCheckSuccess(data);
			} else {
				this.dataManager.checkSupplierName(this.getServiceCallParameter(this.supplierCheckSuccess, this.supplierCheckFailure), this.supplierEntity);
			}
		},

		supplierCheckSuccess: function(data) {
			var supplierIDCheck = this.findCorrectSupplier(this.supplierEntity, data);
			this.supplierEntity = "I_Supplier('" + supplierIDCheck + "')";
			sap.ui.getCore().byId("btnaddSupplier").setEnabled(true);
			if (this.supplierNameoData[this.supplierEntity]) {
				this.supplierValid = true;
				this.supplierName = this.supplierNameoData[this.supplierEntity].SupplierName;
				this.onAddSupplier();
			} else {
				this.supplierValid = false;
				sap.ui.getCore().byId("supplier").setValueState(sap.ui.core.ValueState.Error);
				sap.ui.getCore().byId("supplier").setValueStateText(this.getResourceBundle().getText("invalidSupplier"));
			}

		},

		supplierCheckFailure: function(data) {
			sap.ui.getCore().byId("supplier").setValueState(sap.ui.core.ValueState.Error);
			sap.ui.getCore().byId("supplier").setValueStateText(this.getResourceBundle().getText("invalidSupplier"));
		},

		popOverSuccessHandler: function() {
			this._oMiniCart.openBy(this.oEventSrc);
			this._oMiniCart.setContentHeight("auto");
			this.enableDisableBtnInCart();
		},

		onAddSupplier: function(oEvent) {

			if (this.supplierValid) {
				this.getView().byId("sourceOfSupply").removeContent();
				this.sText = sap.ui.getCore().byId("supplier").getValue();
				var preferred = sap.ui.getCore().byId("preferred").getSelected();
				var fixed = sap.ui.getCore().byId("fixed").getSelected();

				if (preferred === true) {
					this.text = sap.ui.getCore().byId("preferred").getText();
					this.Supplier = this.sText;
					this.Fixedsupplier = "";
				} else {
					this.text = sap.ui.getCore().byId("fixed").getText();
					this.Fixedsupplier = this.sText;
					this.Supplier = "";
				}

				if (!this.productList) {
					this.productList = sap.ui.xmlfragment("ui.s2p.mm.requisition.maintain.s1.view.AssignedSupplier", this);
					this.getView().addDependent(this.productList);
				}
				// oEvent.getSource().getParent().getParent().getParent().byId("sourceOfSupply").removeAllContent();
				this.getView().byId("sourceOfSupply").removeAllContent();
				this.getView().byId("addSupplier1").setVisible(false);
				this.getView().byId("sourceOfSupply").addContent(this.productList);

				var supplier = sap.ui.getCore().byId("supplier").getValue();
				var supplierId = sap.ui.getCore().byId("supplier");
				var supplierNameoData = supplierId.getBindingContext().getModel().oData;

				var supplierEntity = "I_Supplier('" + supplier + "')";

				try {
					this.supplierName = supplierNameoData[supplierEntity].SupplierName;
					this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[0].setText(
						this.supplierName);
					this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[1].setText(this.sText);
					this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[2].setText(this.text);
					this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[2].setText(this.getResourceBundle().getText("assigned"));
					this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[4].setType("Reject");
					oEvent.getSource().getParent().close();
					this.Fixedsupplier1 = this.Fixedsupplier;
					this.Supplier1 = this.Supplier;
				} catch (e) {
					this.dataManager.getSupplierDescription(this.getServiceCallParameter(this.supplierDescSuccess, this.supplierDescFailure),
						supplier,
						oEvent);
				}
				// this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[0].setText(
				// 	this.supplierName);

				// this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[1].setText(this.sText);
				// this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[2].setText(this.text);
				// this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[2].setText("Assigned");
				// this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[4].setType("Reject");
				// oEvent.getSource().getParent().close();
				// this.Fixedsupplier1 = this.Fixedsupplier;
				// this.Supplier1 = this.Supplier;
				this.bFlag = false;
			}
		},
		supplierDescSuccess: function(data) {
			var suppdata = data.results ? data.results[0] : data;
			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[0].setText(
				suppdata.SupplierName);

			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[1].setText(this.sText);
			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[2].setText(this.text);
			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[2].setText(this.getResourceBundle().getText("assigned"));
			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[4].setType("Reject");
			// oEvent.getSource().getParent().getParent().close();
			this._oContent.close();
			this.Fixedsupplier1 = this.Fixedsupplier;
			this.Supplier1 = this.Supplier;
		},
		supplierDescFailure: function(data) {
			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[0].setText("");

			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[1].setText(this.sText);
			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[1].getItems()[0].getAttributes()[2].setText(this.text);
			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[2].setText(this.getResourceBundle().getText("assigned"));
			this.getView().byId("sourceOfSupply").getContent()[0].getItems()[0].getCells()[4].setType("Reject");
			this._oContent.close();
			this.Fixedsupplier1 = this.Fixedsupplier;
			this.Supplier1 = this.Supplier;
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessageManager.removeAllMessages();
		},
		serviceFail: function(oError) {
			this.getView().setBusy(false);

		},

		createFragment: function(fragmentPath, ContentId) {
			this.catalog = this.getView().byId(ContentId);
			this.catalog.removeAllContent();
			var oFragment = sap.ui.xmlfragment(fragmentPath, this);
			this.getView().addDependent(oFragment);
			this.catalog.addContent(oFragment);
		},
		destroyContent: function(ContentId) {
			var ContainerId = this.getView().byId(ContentId).getContent();
			if (ContainerId.length) {
				this.getView().byId(ContentId).destroyContent();
			}
		},

		bindCatalog: function(Idtobind) {
			var catalogModel = this.getAppModel();
			this.getView().byId(Idtobind).setModel(catalogModel);
		},

		getMode: function() {

			return "read";
		},

		_MessagePopoverInitialise: function() {
			oMessagePopover = new sap.m.MessagePopover({
				items: {
					path: "message>/",
					template: new sap.m.MessagePopoverItem({
						description: "{message>description}",
						type: "{message>type}",
						title: "{message>message}"
					})
				}
			});

		},
		showMessageLogPopover: function(oEvent) {
			/*Message Popover */
			this._MessagePopoverInitialise();
			var viewModel = new JSONModel();
			viewModel.setData({
				messagesLength: sap.ui.getCore().getMessageManager().getMessageModel().oData.length
			});
			sap.ui.getCore().byId(oEvent.getSource().getId()).setModel(viewModel);

			oMessagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
			if (!this.oMessagePopover) {
				oMessagePopover.openBy(oEvent.getSource());
			}
		},
		statusData: function(PRNum, PRItemNum, navCon) {
			var oModel = this.getAppModel();
			if (navCon) {
				this.navCon = navCon;
			}
			this.StatusEntity = "PRItemStatusSet(Documentitemnumber='00000',Documentnumber='" + PRNum + "')";
			while (PRNum.length < 10) {
				PRNum = "0" + PRNum;
			}
			oModel.read("/PRItemStatusSet", {
				urlParameters: {
					"$filter": "Sourcedocument eq '" + PRNum + "' and Documentitemnumber eq '" + PRItemNum + "'"

				},
				success: jQuery.proxy(this.statusSuccessHandler, this),
				error: jQuery.proxy(this.statusErrorHandler, this)
			});
		},
		statusSuccessHandler: function(data) {
			this.statusdata = data;
			// this.prepareStatusData(this.statusData);
			this.statusModel = this.prepareStatusData(this.statusdata);

			if (this.getView().getId().search("CartOverview") > 0) {
				this._historyDialog = sap.ui.xmlfragment(
					"ui.s2p.mm.requisition.maintain.s1.fragment.StatusInPR",
					this
				);
				this.getView().addDependent(this._historyDialog);
				// this.statusModel = this.getStatusModel();
				// this.bindProcessFlow();
				sap.ui.getCore().byId("processflow").setModel(this.statusModel, "pf1");
				// open value help dialog filtered by the input value
				this._historyDialog.openBy(this.oButton);

				this.getView().setBusy(false);
			}
			if (this.getView().getId().search("PurReqList") > 0) {
				sap.ui.getCore().byId("processflow").setModel(this.statusModel, "pf1");
				sap.ui.getCore().byId("processflow").updateModel();
				sap.ui.getCore().byId("p2").getSubHeader().getContent()[0].setText(this.itemText);
				this.navCon.to("p2");
			} else {
				if (!this._oContent) {
					this._oContent = sap.ui.xmlfragment("ui.s2p.mm.requisition.maintain.s1.fragment.ItemStatus", this);
					sap.ui.getCore().byId("itemProcessFlow").setModel(this.statusModel, "pf3");
					this.getView().byId("idItemStatus").removeAllContent();
					this.getView().byId("idItemStatus").addContent(this._oContent);

				}
			}

		},
		getStatusModel: function() {
			return this.statusModel;
		},
		prepareStatusData: function(statusData) {
			var status = {};
			var node = [];
			var lane = [];
			var docs = statusData.results;
			for (var i = 0; i < docs.length; i++) {
				var docNodes = {};
				var docLanes = {};
				docNodes.id = i + 1;
				docNodes.lane = i;
				docNodes.title = docs[i].Documentnumber; //this.getTitle(docs[i].Documenttype);
				docNodes.state = sap.suite.ui.commons.ProcessFlowNodeState.Positive;
				docNodes.stateText = this.getResourceBundle().getText("created");
				docNodes.children = this.getChildren(i + 1, docs.length);
				docNodes.texts = [(docs[i].Documentcreationdate).toDateString()];

				node.push(docNodes);

				docLanes.id = i;
				docLanes.icon = this.getIcon(docs[i].Documenttype);
				docLanes.label = this.getLabel(docs[i].Documenttype, docs[i].Documentmovetype);
				docLanes.position = i;
				lane.push(docLanes);

			}
			if (lane[i - 1].label === "Invoice" || lane[i - 1].label === "Goods Issue") {
				delete node[i - 1].children;
			} else {
				var nextNode = {};
				nextNode.id = i + 1;
				nextNode.lane = i;
				nextNode.state = sap.suite.ui.commons.ProcessFlowNodeState.Neutral;
				nextNode.stateText = this.getResourceBundle().getText("inProcess");

				var nextLane = {};
				nextLane.id = i;
				nextLane.icon = this.getIcon(parseInt(docs[i - 1].Documenttype) + 1);
				nextLane.label = this.getLabel(parseInt(docs[i - 1].Documenttype) + 1);
				nextLane.position = i;

				node.push(nextNode);
				lane.push(nextLane);
			}

			status.nodes = node;
			status.lanes = lane;

			var statusModel = new sap.ui.model.json.JSONModel();
			statusModel.setData(status);
			return statusModel;

		},
		getChildren: function(nodeID, length) {
			if (nodeID <= length) {
				nodeID++;
				return [nodeID.toString()];
			} else {
				return [];
			}

		},
		getIcon: function(docType) {
			switch (docType) {
				case "0":
					return "sap-icon://sales-document";

				case "1":
					return "sap-icon://receipt";
				case "2":
					return "sap-icon://sales-order";
				case "*":
					return "sap-icon://sales-order-item";
				case "+":
					return "sap-icon://order-status";
				case "-":
					return "sap-icon://sales-quote";
				default:
					return "sap-icon://documents";
			}
		},
		getLabel: function(docType, moveType) {
			switch (docType) {
				case "0":
					return this.getResourceBundle().getText("appTitle");
					// return this.getResourceBundle().getText("PurchaseOrder");
				case "1":
					switch (moveType) {
						case "122":
							return this.getResourceBundle().getText("ReturnDelivery");
						default:
							return this.getResourceBundle().getText("GoodsReceipt");
					}
					return this.getResourceBundle().getText("GoodsReceipt");
				case "2":
					return this.getResourceBundle().getText("Invoice");
				case "*":
					return this.getResourceBundle().getText("PurchaseOrder");
				case "+":
					return this.getResourceBundle().getText("Reservation");
				case "-":
					return this.getResourceBundle().getText("GoodsIssue");
				default:
					return this.getResourceBundle().getText("FollowOn");
			}
		},
		processFlowZoomIn: function() {
			sap.ui.getCore().byId("processflow").zoomIn();
		},
		processFlowZoomOut: function() {
			sap.ui.getCore().byId("processflow").zoomOut();
		},
		onNodePress: function(oEvent) {
			var node = oEvent.getParameters().getNodeId();
			node = Number(node);
			var sourcePage = this.sourcePage;
			if (sourcePage === "ItemDetails") {
				var doctype = oEvent.getParameters().getBindingContext("pf3").getModel().getData().lanes[node - 1].label;
			} else {
				doctype = oEvent.getParameters().getBindingContext("pf1").getModel().getData().lanes[node - 1].label;
			}
			if (doctype === "Purchase Order") {

				doctype = doctype.replace(/ /g, "");
				var docnumber = oEvent.getParameters().getTitle();

				var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
				var navObject = {};
				navObject.target = {
					semanticObject: doctype,
					action: "displayFactSheet"
				};
				navObject.params = new Object();
				navObject.params[doctype] = [docnumber];
				oCrossAppNavigator.toExternal(navObject);
			}
		},
		getDraftKey: function(obj, header) {
			if (obj && header) {
				var keys = this.entityConstants.getKeys("headerEntity");
				for (var i = 0; i < keys.length; i++) {
					if (this.getView().getId().search("PurReqList") >= 0) {
						if (obj[keys[i]].length > 10) {
							return obj[keys[i]];
						}
					} else {

						if (obj[keys[i]]) {
							return obj[keys[i]];
						}
					}
				}
			} else {
				return;
			}
		}

	});
});