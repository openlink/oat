/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2020 OpenLink Software
 *
 *  See LICENSE file for details.
 */

OAT.Toggle = function (togglerElm, optObj) {
    var self=this;
    
    OAT.Style.include('toggle.css');
    this.state = 0;

//
// default is 2-state toggler with unicode text indicators
//

    this.options = {
	imagePath: OAT.Preferences.imagePath,
	states: 2,
	initialState: 0,
	stateIndicatorImgs:["toggle_state_1.img", "toggle_state_2.img"],
	stateIndicatorTexts:["&#9656;","&#9662;"],
	stateIndicatorElms:[],
	stateDepElms:[],
	title: "Toggler",
	indicatorStyle: 0x2 // bitmap style 0x01 = images 0x02 = text 0x03 = elms
    }

    this.stateIndicatorA = [];

    for (var p in optObj) { this.options[p] = optObj[p]; }


    this.setState = function (e,state) {
	self.state = state % self.options.states;
	self.refresh(true);
    }

    this.toggle = function (e) {
	self.state = (self.state + 1) % self.options.states;
	self.refresh(true);
    }

//
// refresh the widget. signalState controls whether so send an OAT.MSG with new state
//

    this.refresh = function (signalChange) {
	for (i=0;i<self.options.states;i++) {
	    if (i==self.state)
		OAT.Dom.show (self.stateIndicatorA[i]);
	    else 
		OAT.Dom.hide (self.stateIndicatorA[i]);
	}
	if (signalChange) OAT.MSG.send (self,"OAT_TOGGLER_STATE_CHANGE",self.state);
    }

    this.init = function () {
	if ((self.options.indicatorStyle % 0x1) && self.options.stateIndicatorImgs.length < self.options.states) {
	    var e = new Error("OAT Toggler init: toggler has more states than available graphic indicators");
	    throw (e);
	}
	if ((self.options.indicatorStyle % 0x2) && self.options.stateIndicatorTexts.length < self.options.states) {
	    var e = new Error("OAT Toggler init: toggler has more states than available graphic indicators");
	    throw (e);
	}
	if ((self.options.indicatorStyle & 0x4) && self.options.stateIndicatorElms.length < self.options.states) {
	    var e = new Error("OAT Toggler init: toggler has more states than available indicator elems");
	    throw (e);
	}
    
	if (togglerElm)
	    self.togglerElm = togglerElm;
	else
	    self.togglerElm = OAT.Dom.create ('div');

	OAT.Dom.addClass (self.togglerElm,'oat_toggle_container');
	OAT.Event.attach (self.togglerElm,"click",self.toggle);

	if (self.options.title) {
	    var titleElm = OAT.Dom.create ('h3',{className: "oat_toggle_title"});
	    titleElm.innerHTML = self.options.title;
	    self.togglerElm.appendChild (titleElm);
	}

	for (i=0;i<self.options.states;i++) {
	    var stateIndCtr = OAT.Dom.create ('span',{className: "oat_toggle_indicator_ctr"});

	    if (self.options.indicatorStyle & 0x1) {
		var imgElm = OAT.Dom.image (self.options.stateIndicatorImgs[i],"");
		OAT.Dom.addClass (imgElm,'oat_toggler_indicator');
		stateIndCtr.appendChild(imgElm);
	    }

	    if (self.options.indicatorStyle & 0x2) {
		var txtElm = OAT.Dom.create ('span',{className: "oat_toggle_indicator"});
		txtElm.innerHTML = self.options.stateIndicatorTexts[i];
		stateIndCtr.appendChild(txtElm);
	    }
					     
	    if (self.options.indicatorStyle & 0x4) {
		stateIndCtr.appendChild(stateIndicatorElms[i]);
		OAT.Dom.addClass (stateIndicatorElms[i], "oat_toggle_indicator");
	    }
	    self.stateIndicatorA.append(stateIndCtr);
	    togglerElm.appendChild (stateIndCtr);
	    if (i != self.options.initialState) OAT.Dom.hide (stateIndCtr);
	}

	self.state = self.options.initialState;
	self.refresh(false);
    } // init

    self.init();
}
