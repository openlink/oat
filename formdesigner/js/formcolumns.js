/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2019 OpenLink Software
 *
 *  See LICENSE file for details.
 */
function Columns(obj) {
	var self = this;
	this.obj = obj;
	this.columns = [];
	this.elm = OAT.Dom.create("div",{padding:"3px"});
	this.win = new OAT.Win({buttons:"cr",outerHeight:0,outerWidth:240,x:-15,y:390,title:"Data Columns"});
        this.win.dom.content.appendChild(this.elm);

	OAT.MSG.attach(this.win, "WINDOW_CLOSE", function() {
		tbar.icons[2].toggleState(0, true);
	});

	this.clear = function() {
		OAT.Dom.clear(self.elm);
		self.columns = [];
	}
	
	this.select = function(column) {
		column.style.backgroundColor = "#aaf";
		column.selected = 1;
	}
	
	this.deselect = function() {
		for (var i=0;i<self.columns.length;i++) {
			self.columns[i].style.backgroundColor = "transparent";
			self.columns[i].selected = 0;
		}
	}
	
	this.createColumns = function() {
		self.clear();
	    if (self.obj.datasources.length) {
		self.DSlabel = OAT.Dom.create("label");
		self.DSlabel.innerHTML="Datasource:";
		self.DSSelect = OAT.Dom.create("select");
		self.DSColsHD = OAT.Dom.create("h3",{className:"ds_cols_hd"});
		self.DSColsHD.innerHTML = "Available Columns:";
		for (var i=0;i<self.obj.datasources.length;i++) {
			var o = OAT.Dom.option(self.obj.datasources[i].name,i,self.DSSelect);
		}
		OAT.Event.attach(self.DSSelect,"change",function() { self.addColumns(self.DSSelect.selectedIndex); });
		OAT.Dom.append([self.elm,self.DSlabel,self.DSSelect,self.DSColsHD]);
		self.div = OAT.Dom.create("div",{className: "ds_cols_ctr"});
		self.elm.appendChild(self.div);
		self.addColumns(0);
	    }
	    else {
		var DSDefBtn = OAT.Dom.create ("button", {className: "ds_def_btn"});
		DSDefBtn.innerHTML = "New datasource&hellip;";
		OAT.Event.attach (DSDefBtn, "click", function () {OAT.MSG.send (self,"FORMDESIGNER_NEW_DS",{});});
		self.elm.appendChild(DSDefBtn);
	    }
	}
	
	this.addColumns = function(index) {
		self.obj.gd2.clearSources();
		OAT.Dom.clear(self.div);
		self.columns = [];
		var cols = self.obj.datasources[index].outputFields;
		var labels = self.obj.datasources[index].outputLabels;
		for (var i=0;i<cols.length;i++) {
			var l = (labels[i] ? labels[i] : cols[i]);
			self.addColumn(l,i);
		}
	}
	
	this.addColumn = function(name, index) { 
		var div = OAT.Dom.create("div",{cursor:"pointer"});
		div.innerHTML = name;
		self.div.appendChild(div);
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
		OAT.Event.attach(div,"click",clickRef);

		var process = function(elm) {
			elm.style.zIndex = 10;
			elm.style.fontWeight="bold";
			if (div.selected) { elm.firstChild.innerHTML = '[selected column(s)]'; }
		}
		
		var addRef = function(target,x,y) {
			var coords = OAT.Dom.position(self.win.dom.container);
			var dims = OAT.Dom.getWH(self.win.dom.container);
			if (x >= coords[0] && x <= coords[0]+dims[0] && y >= coords[1] && y <= coords[1]+dims[1]) { return; }
			var hack = 0;
			if (!div.selected) {
				div.selected = 1;
				hack = 1;
			}
			var cnt = 0;
			var newObjs = [];
			for (var i=0;i<self.columns.length;i++) if (self.columns[i].selected) {
				var name = self.columns[i].innerHTML;
				var index = self.columns[i].index;
				var o1 = obj.addObject("label",x,y+cnt*30);
				var o2 = obj.addObject("input",x+100,y+cnt*30);
				o1.setValue([name]);
				o2.setValue(["["+name+"]"]);
				o2.datasources[0].fieldSets[0].columnIndexes[0] = index;
				o2.datasources[0].ds = self.obj.datasources[self.DSSelect.selectedIndex];
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
		obj.gd2.addSource(div,process,addRef);
		
		var dblClickRef = function(event) {
			var coords = self.obj.getCoords();
			addRef(false,coords[0],coords[1]);
		}

		OAT.Event.attach(div,"dblclick",dblClickRef); /* add to form */
	} /* Columns::addColumn() */
}
