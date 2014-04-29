/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2014 OpenLink Software
 *
 *  See LICENSE file for details.
 */
	
OAT.Instant = function(element) {
	var self = this;
	
	this.visible = 1;
	this.elm = $(element);
	this.handles = [];
	
	this.hide = function() {
		if (!self.visible) { return; }
		self.visible = 0;
		OAT.Dom.hide(self.elm);
		OAT.MSG.send(self,"INSTANT_HIDE",self.elm);
	}
	
	this.show = function() {
		if (self.visible) { return; }
		self.visible = 1;
		OAT.Dom.show(self.elm);
		OAT.MSG.send(self,"INSTANT_SHOW",self.elm);
	}
	
	this.toggle = function() {
		self.visible? self.hide() : self.show();
	}

	this._toggle = function(event) {
		var src = OAT.Event.source(event);
		
		/* noone but registered handle may show via event */
		if (!self.visible && self.handles.indexOf(src) == -1) { return; }

		/* cancel event propagation, so we dont trigger document listener */ 
		OAT.Event.cancel(event); 
		self.toggle();
	}
	
	this.createHandle = function(elm) {
		var e = $(elm);
		self.handles.push(e);
		OAT.Event.attach(e,"mousedown",self._toggle);
	}
	
	this.removeHandle = function(elm) {
		var e = $(elm);
		var i = self.handles.indexOf(e);

		if (i != -1) { 
			self.handles.splice(i,1);
			OAT.Event.detach(e,"mousedown",self._toggle);	
		}
	}
	
	this._init = function() {	
		/* clicking on element doesnt hide */
		OAT.Event.attach(self.elm,"mousedown",OAT.Event.cancel);

		/* if anywhere outside is clicked, toggle (close) */
		OAT.Event.attach(document,"mousedown",self._toggle);
	
		/* hide by default */
		self.hide();
}

	self._init();
}
