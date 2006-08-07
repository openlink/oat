/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
function Columns(obj) {
	var self = this;
	this.obj = obj;
	this.columns = [];
	this.win = new OAT.Window({min:0,max:0,close:1,height:0,width:180,x:-15,y:350,title:"Form Columns"});
	this.win.hide = function() {OAT.Dom.hide(self.win.div);};
	this.win.show = function() {OAT.Dom.show(self.win.div);};
	this.win.onclose = function() {
		self.win.hide();
		tbar.icons[2].toggle();
	}

	this.clear = function() {
		OAT.Dom.clear(self.win.content);
		self.columns = [];
	}
	
	this.select = function(column) {
		column.style.backgroundColor = "#aaf";
		column.selected = 1;
	}
	
	this.deselect = function() {
		for (var i=0;i<self.win.content.childNodes.length;i++) {
			self.win.content.childNodes[i].style.backgroundColor = "transparent";
			self.win.content.childNodes[i].selected = 0;
		}
	}
	
	this.createColumns = function(form,arr) {
		self.clear();
		for (var i=0;i<arr.length;i++) {
			self.addColumn(form,arr[i],i);
		}
	}
	
	this.addColumn = function(form, name, index) { 
		var div = OAT.Dom.create("div",{cursor:"pointer"});
		div.innerHTML = name;
		self.win.content.appendChild(div);
		self.columns.push(div);
		div.index = index;

		var clickRef = function(event) {
			if (!event.ctrlKey && !event.shiftKey) { self.deselect(); }
			self.select(div);
			if (event.shiftKey) {
				/* interval select */
				var start = 0;
				var end = 0;
				for (var i=0;i<self.columns.length;i++) {
					var col = self.columns[i];
					if (col.selected) { start = 1; }
					if (col == div) { end = 1; }
					if (start && !end) { self.select(col); }
				}
			}
		}
		OAT.Dom.attach(div,"click",clickRef);

		var process = function(elm) {
			elm.style.zIndex = 3;
			elm.style.fontWeight="bold";
			if (div.selected) { elm.firstChild.innerHTML = '[selected column(s)]'; }
		}
		
		var addRef = function(target,x,y) {
			var coords = OAT.Dom.position(self.win.div);
			var dims = OAT.Dom.getWH(self.win.div);
			if (x >= coords[0] && x <= coords[0]+dims[0] && y >= coords[1] && y <= coords[1]+dims[1]) { return; }
			var hack = 0;
			if (!div.selected) {
				div.selected = 1;
				hack = 1;
			}
			var cnt = 0;
			var newObjs = [];
			for (var i=0;i<self.win.content.childNodes.length;i++) if (self.win.content.childNodes[i].selected) {
				var name = self.win.content.childNodes[i].innerHTML;
				var index = self.win.content.childNodes[i].index;
				var o1 = obj.addObject(form,"label",x,y+cnt*30);
				var o2 = obj.addObject(form,"input",x+100,y+cnt*30);
				o1.setValue([name]);
				o2.setValue(["["+name+"]"]);
				o2.datasources[0].columnIndexes[0] = index;
				newObjs.push(o1);
				newObjs.push(o2);
				cnt++;
			}
			obj.deselectAll();
			for (var i=0;i<newObjs.length;i++) { newObjs[i].select(); }
			obj.createDrags();
			obj.toolbox.showMulti();
			if (hack) { div.selected = 0; }
		}
		obj.gd.addSource(div,process,addRef);
		
		var dblClickRef = function(event) {
			var coords = form.getCoords();
			var formCoords = OAT.Dom.position(form.div);
			addRef(false,coords[0]+formCoords[0],coords[1]+formCoords[1]);
		}

		OAT.Dom.attach(div,"dblclick",dblClickRef); /* add to form */
	} /* Columns::addColumn() */
}
