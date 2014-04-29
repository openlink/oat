/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2014 OpenLink Software
 *
 *  See LICENSE file for details.
 */
	
OAT.Panelbar = function(div, optObj) {
	var self = this;
	
	this.options = {
		duration: 300,
		height: false,
		noanim: false
	};

	for (var p in optObj) { this.options[p] = optObj[p]; }

	this.div = $(div);
	this.panels = [];

	this.opacityAnim = false;
	this.resizeAnim  = false;

	OAT.Dom.addClass(this.div,"oat_panelbar");
	this.selectedIndex = -1;
	this._height = 0;
	this._delay = 20;
	this._steps = Math.round(this.options.duration / this._delay);

	this._show = function(panel, noanim) {
		OAT.Dom.addClass(panel[0], "oat_panelbar_option_selected");

				if (OAT.Browser.isIE6) {
			OAT.Style.set(panel[1], {display:""});
		}

		if (noanim || self.options.noanim) { /* static version */
			OAT.Style.set(panel[1], {height:this._height + "px",opacity:1});
		} else { /* animated version */
			var opAnimOpts = {delay:self._delay, opacity:1, speed:1/this._steps};
			var reAnimOpts = {delay:self._delay, height:this._height, speed:this._height/this._steps};

			var opacityAnim = new OAT.AnimationOpacity(panel[1], opAnimOpts);
			var resizeAnim = new OAT.AnimationSize(panel[1], reAnimOpts);

			opacityAnim.start();
			resizeAnim.start();
		}
	}
	
	this._hide = function(panel, noanim) {
		OAT.Dom.removeClass(panel[0], "oat_panelbar_option_selected");

		if (noanim || self.options.noanim) { /* static version */
			OAT.Style.set(panel[1], {height:"0px",opacity:0});
			
			if (OAT.Browser.isIE6) {
				OAT.Style.set(panel[1], {display:"none"});
			}
			
		} else { /* animated version */
			var opAnimOpts = {delay:self._delay, opacity:0, speed:1/this._steps};
			var reAnimOpts = {delay:self._delay, height:0, speed:this._height/this._steps };

			var opacityAnim = new OAT.AnimationOpacity(panel[1], opAnimOpts);
			var resizeAnim = new OAT.AnimationSize(panel[1], reAnimOpts);

				if (OAT.Browser.isIE6) {
				OAT.MSG.attach(resizeAnim.animation, "ANIMATION_STOP", function() {
					OAT.Style.set(panel[1], {display:"none"});
					});
				}
			
			self.opacityAnim = opacityAnim; 
			self.resizeAnim = resizeAnim;

			opacityAnim.start();
			resizeAnim.start();
		}
	}
	
	this._recomputeClasses = function(index) {
		for (var i=0;i<self.panels.length;i++) {
			OAT.Dom.removeClass(self.panels[i][0],"oat_panelbar_option_above");
			OAT.Dom.removeClass(self.panels[i][0],"oat_panelbar_option_below");

			if (i <= index) {
				OAT.Dom.addClass(self.panels[i][0],"oat_panelbar_option_above");
				} else {
				OAT.Dom.addClass(self.panels[i][0],"oat_panelbar_option_below");
				}
			}
		}

	this.go = function(index) {
		var prevPanel = self.panels[self.selectedIndex] || false;
		var curPanel = self.panels[index];

		/* clicking on active panel -> noop */
		if (index == self.selectedIndex) { return; }

		/* stop animations, if any */
		if (self.opacityAnim) { self.opacityAnim.stop(); }
		if (self.resizeAnim) { self.resizeAnim.stop(); }
		
		/* update css */
		this._recomputeClasses(index);
		
		/* show current panel and if any, hide previous */
		if (prevPanel) { self._hide(prevPanel); }
		self._show(curPanel);

		/* update index */
		self.selectedIndex = index;
	}

	this.addPanel = function(option,content) {
		var optionElm = $(option);
		var contentElm = $(content);

		OAT.Dom.addClass(optionElm, "oat_panelbar_option");
		OAT.Dom.addClass(contentElm, "oat_panelbar_content");
		OAT.Style.set(contentElm, {overflow: "hidden"});

		/* FIXME: maybe this could be delegated to self.div */
		var callback = function(event) {
			var index = -1;
			for (var i=0;i<self.panels.length;i++) {
				var panel = self.panels[i];
				if (panel[0] == optionElm) { index = i; break; }
		}
			self.go(index);
	}
	
		OAT.Event.attach(optionElm,"click",callback);
	
		var panel = [optionElm,contentElm];
		this.panels.push(panel);
		this.div.appendChild(optionElm);
		this.div.appendChild(contentElm);
	
		if (self.options.height) { /* fixed height */
			this._height = self.options.height;
		} else { /* use largest height across all panels */
			this._height = Math.max(this._height, contentElm.offsetHeight);
		}

		/* always show first panel content, hide others by default */
		if (self.panels.length == 1) {
			self._show(panel, true);
			this.selectedIndex = 0;
		} else {
			self._hide(panel, true);
		}
		self._recomputeClasses(0)
	}
}
