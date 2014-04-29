/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2014 OpenLink Software
 *
 *  See LICENSE file for details.
 */
	
OAT.Tab = function(elm) {
	var self = this;

	this.tabs = [];
	this.element = $(elm);
	this.selectedIndex = -1;
	
	this.add = function(elm_1,elm_2) {
		var tab = new OAT.Tab.Part(elm_1, elm_2, self);
		this.tabs.push(tab);
		return tab;
	};

	this.go = function(something) {
		var index = -1;
		for (var i=0;i<this.tabs.length;i++) {
			var tab = this.tabs[i];
			if (something == i || something == tab) {
				index = i;
				tab.activate();
			} else {
			tab.deactivate();
		}
		}

		if (index == -1) {
			throw new Error("Cannot activate tab '"+something+"'");
		} else {
			OAT.MSG.send(this, "TAB_CHANGE", [self.selectedIndex,index]);
		self.selectedIndex = index;
		}
	};
	
	this.remove = function(something) {
		var index = -1;
		for (var i=0;i<this.tabs.length;i++) {
			var tab = this.tabs[i];
			if (something == i || something == tab) { index = i; }
		}
		if (index == -1) { throw new Error("Cannot remove tab '"+something+"'"); }
		
		var decreaseIndex = false;
		if (index < self.selectedIndex) { decreaseIndex = true; }
		if (index == self.selectedIndex) {
			decreaseIndex = true;
			if (index == self.tabs.length-1) {
				self.go(index-1);
				decreaseIndex = false;
			} else {
				self.go(index+1);
			}
		}
		self.tabs[index].remove();
		self.tabs.splice(index,1);
		if (decreaseIndex) { self.selectedIndex--; }
	};
	
	OAT.Dom.clear(self.element); 
}
	
OAT.Tab.Part = function(clicker, mover, parent) {
	var self = this;
	this.key = $(clicker);
	this.value = $(mover);
	this.parent = parent;
	
	this.go = function() {
		parent.go(self);
	}
	
	this.activate = function() {
		parent.element.appendChild(self.value);
		OAT.Dom.show(self.value);
		OAT.Dom.addClass(self.key, "tab_selected");
	}
	
	this.deactivate = function() {
		if (self.window) { return; }
		OAT.Dom.hide(self.value);
		OAT.Dom.removeClass(self.key, "tab_selected");
	}
	
	this.remove = function() {
		OAT.Dom.removeClass(this.key, "tab");
		OAT.Event.detach(this.key, "click", this.go);
	}
	
	this.add = function() {
		OAT.Dom.addClass(this.key, "tab");
		OAT.Event.attach(this.key, "click", this.go);
	}
	
	this.add();
}
