/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2018 OpenLink Software
 *
 *  See LICENSE file for details.
 */

OAT.QuickEdit = function(elm,optObj) {
	var self = this;

	this.options = {
		type:false,
		options:false
	};

	this.state = 0;
	this.elm = $(elm);
	this.newelm = false;
	this.instant = false;

	for (var p in optObj) { this.options[p] = optObj[p]; }

	this._create = function() {
		var content = self.elm.innerHTML;
	
		switch (self.options.type) {
			/* plain text input */
			case OAT.QuickEdit.STRING:
				self.newelm = OAT.Dom.create("input",{type:"text"});
				self.newelm.setAttribute("size",content.length+1);
				self.newelm.value = content;
			break;

			/* a select box */
			case OAT.QuickEdit.SELECT:
				var ind = -1;
				self.newelm = OAT.Dom.create("select");

				/* push options in */
				for (var i=0;i<self.options.options.length;i++) {
					var opt = self.options.options[i];
					var newopt = OAT.Dom.create("option",{name:opt,value:opt,innerHTML:opt});
					OAT.Dom.append([self.newelm,newopt]);
					if (content == opt) { ind = i };
				}
				
				/* new content appeared, add it as option */
				if (ind == -1) {
					var newopt = OAT.Dom.create("option",{name:content,value:content,innerHTML:content});
					OAT.Dom.append([self.newelm,newopt]);
					self.newelm.selectedIndex = i;
				/* previous content matches one of the options, select it */
				} else {
					self.newelm.selectedIndex = ind;
				}
			break;
		}
	}
		
	this._toggle = function() {
		/* input hidden, show and focus it */
		if (self.state == 0) {
			self.elm.parentNode.replaceChild(self.newelm,self.elm);
			self.instant.show();
			self.newelm.focus();
			self.state = 1;
		/* input shown, copy option value and hide */
		} else {
			self.elm.innerHTML = self.newelm.value;
			self.newelm.parentNode.replaceChild(self.elm,self.newelm);
			self.state = 0;
	}
}

	this._init = function() {
		self._create();

		self.instant = new OAT.Instant(self.newelm);
		
		OAT.Event.attach(self.elm,"click",self._toggle);
		OAT.MSG.attach(self.instant,"INSTANT_HIDE",self._toggle);
	}

	this._init();
}

OAT.QuickEdit.STRING = 1;

OAT.QuickEdit.SELECT = 2;


