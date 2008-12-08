/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2008 OpenLink Software
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

	this.addObject = function(type,parent,isLeaf) { 
		var pnode = self.tree.tree;
		
		function recursiveTest(node) {
			for (var i=0;i<node.children.length;i++) {
				var ch = node.children[i];
				if (ch.getLabel() == parent) { pnode = ch; }
				recursiveTest(ch);
			}
		}
		recursiveTest(self.tree.tree);
		
		if (isLeaf) {
			var node = pnode.createChild(OAT.FormObjectNames[type]);
			node._gdElm.style.cursor = "pointer";
			obj.gd1.addSource(node._gdElm,function(elm){ elm.style.fontWeight="bold";},self.getAddRef(type));
		} else {
			var newP = pnode.createChild(type,true);
			newP.collapse();
		}
	}
	
	this.getAddRef = function(type) {
		return function(target,x,y) {
			var o = obj.addObject(type,x,y);
			if (o.userSet) { o.setValue(type); }
			obj.toolbox.showObject(o);
		}
	}
}
