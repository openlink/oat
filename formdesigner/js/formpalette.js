/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2007 OpenLink Software
 *
 *  See LICENSE file for details.
 */
function Palette(obj) {
	var self = this;
	this.win = new OAT.Window({min:0,max:0,close:1,width:180,height:0,x:-15,y:20,title:"Controls Palette"});
	this.win.hide = function() {OAT.Dom.hide(self.win.div);};
	this.win.show = function() {OAT.Dom.show(self.win.div);};
	this.win.onclose = function() {
		self.win.hide();
		tbar.icons[0].toggle();
	}
	this.items = [];
	var ul = OAT.Dom.create("ul");
	self.win.content.appendChild(ul);
	
	this.tree = new OAT.Tree({onClick:"toggle",onDblClick:"toggle"});
	self.tree.assign(ul,true);

	this.addObject = function(type,parent) { 
		var pnode = false;
		for (var i=0;i<self.tree.tree.children.length;i++) {
			var n = self.tree.tree.children[i];
			if (n.getLabel() == parent) { pnode = n; }
		}
		if (!pnode) { 
			pnode = self.tree.tree.createChild(parent,true); 
			pnode.collapse();
		}
		var node = pnode.createChild(OAT.FormObjectNames[type]);
		node._gdElm.style.cursor = "pointer";
		obj.gd1.addSource(node._gdElm,function(elm){ elm.style.fontWeight="bold";},self.getAddRef(type));
	}
	
	this.getAddRef = function(type) {
		return function(target,x,y) {
			var o = obj.addObject(type,x,y);
			if (o.userSet) { o.setValue(type); }
			obj.toolbox.showObject(o);
		}
	}
}
