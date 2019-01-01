/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2019 OpenLink Software
 *
 *  See LICENSE file for details.
 */
function Palette(obj) {
	var self = this;
	this.win = new OAT.Win({buttons:"cr",outerHeight:0,outerWidth:240,x:-15,y:60,title:"Controls Palette"});

	OAT.MSG.attach(this.win, "WINDOW_CLOSE", function() {
		tbar.icons[0].toggleState(0, true);
	});

	this.items = [];
	var ul = OAT.Dom.create("ul");
	self.win.dom.content.appendChild(ul);
	
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
