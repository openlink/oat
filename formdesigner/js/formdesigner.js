/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2007 OpenLink Software
 *
 *  See LICENSE file for details.
 */

/*
	new FormDesigner(parent)
	FormDesigner.setBase(baseElement)
	FormDesigner.clear()
	FormDesigner.addObject(type,x,y,loading)
*/

var FormDesigner = function(parent) {
	/* basic properties */
	var self = this;
	this.base = false; /* root element */
	this.layers = [];
	this.layersObj = new OAT.Layers(0);
	this.capture = false; /* yellow select rectangle */

	this.datasources = [];
	this.objects = [];
	this.gd1 = new OAT.GhostDrag();
	this.gd2 = new OAT.GhostDrag();

	this.selObjs = []; /* selected objects */

	this.parent = $(parent); /* place for supplementary windows, toolbox etc */

	var l = new OAT.Layers(100);
	/* columns */
	this.columns = new Columns(self);
	this.parent.appendChild(this.columns.win.div);
	l.addLayer(this.columns.win.div);
	
	/* palette */
	this.palette = new Palette(self);
	this.parent.appendChild(this.palette.win.div);
	l.addLayer(this.palette.win.div);
	
	/* toolbox */
	this.toolbox = new Toolbox(self);
	this.parent.appendChild(this.toolbox.win.div);
	l.addLayer(this.toolbox.win.div);
	
	/* --------- available objects ----------- */ 
	this.palette.addObject("label","Basic controls");
	this.palette.addObject("input","Basic controls");
	this.palette.addObject("textarea","Basic controls");
	this.palette.addObject("checkbox","Basic controls");
	this.palette.addObject("line","Basic controls");
	this.palette.addObject("url","Basic controls");
	this.palette.addObject("map","Advanced controls");
	this.palette.addObject("grid","Advanced controls");
	this.palette.addObject("barchart","Basic controls");
	this.palette.addObject("piechart","Basic controls");
	this.palette.addObject("linechart","Basic controls");
	this.palette.addObject("sparkline","Basic controls");
	this.palette.addObject("pivot","Advanced controls");
	this.palette.addObject("flash","Basic controls");
	this.palette.addObject("image","Basic controls");
	this.palette.addObject("imagelist","Advanced controls");
	this.palette.addObject("twostate","Advanced controls");
	this.palette.addObject("timeline","Advanced controls");
	this.palette.addObject("graph","RDF controls");
	this.palette.addObject("cloud","Advanced controls");
	this.palette.addObject("nav","Navigation controls");
	this.palette.addObject("gem1","Basic controls");
	this.palette.addObject("uinput","Basic controls");
	this.palette.addObject("tab","Advanced controls");
	this.palette.addObject("container","Advanced controls");
	this.palette.win.accomodate(false,true);
	/* --------------------------------------- */
	/* methods */
	
	this.createDSSelect = function(sel_ds,sel_index) {
		var s = OAT.Dom.create("select");
		var total = 0;
		for (var i=0;i<self.datasources.length;i++) {
			var ds = self.datasources[i];
			var og = OAT.Dom.create("optgroup");
			og.label = ds.name;
			s.appendChild(og);
			for (var j=0;j<ds.outputFields.length;j++) {
				var f = ds.outputFields[j];
				var o = OAT.Dom.create("option");
				o.innerHTML = (ds.outputLabels[j] ? ds.outputLabels[j] : f);
				o.value = ds.name;
				o.masterDS = ds;
				o.masterField = j;
				og.appendChild(o);
				if (sel_ds == ds && sel_index == j) { s.selectedIndex = total; }
				total++;
			}
		}
		return s;
	}
	
	this.createDSOnlySelect = function(sel_ds) {
		var s = OAT.Dom.create("select");
		for (var i=0;i<self.datasources.length;i++) {
			var ds = self.datasources[i];
			var o = OAT.Dom.create("option");
			o.innerHTML = ds.name;
			o.value = ds;
			o.ds = ds;
			s.appendChild(o);
			if (sel_ds == ds) { s.selectedIndex = i; }
		}
		return s;
	}
	
	this.init = function(base) {
		self.base = $(base);
		self.gd1.addTarget(self.base);
		self.gd2.addTarget(self.base);
		for (var i=0;i<4;i++) { 
			var l = OAT.Dom.create("div",{position:"absolute",width:"100%",height:"0px",zIndex:i});
			self.layers.push(l); 
			self.base.appendChild(l);
		}
		OAT.Dom.attach(this.base,"mousedown",self.startCapture);
		OAT.Dom.attach(this.base,"mouseup",self.stopCapture);
		OAT.Dom.attach(this.base,"mousemove",self.processCapture);
		var pos = OAT.Dom.position(self.base);
		var dim = OAT.Dom.getWH(self.base);
		self.selectForm();
		var callback = function(event) {
			var src = OAT.Dom.source(event);
			if (src != self.base) { return; } /* only when form is directly clicked */
			self.selectForm();
		}
		OAT.Dom.attach(self.base,"click",callback);
		self.x = 20;
		self.y = 0;
	}
	
	this.getCoords = function() {
		self.y += 30;
		return [self.x,self.y];
	}
	
	this.selectForm = function() {
		self.deselectAll();
		self.columns.createColumns();
		self.toolbox.showForm();
	}
	
	this.clear = function(ds) { /* remove everything from this design */
		self.deselectAll();
		for (var i=0;i<self.layers.length;i++) { OAT.Dom.clear(self.layers[i]);  }
		self.layersObj = new OAT.Layers(0);
		self.objects = []; 
		if (ds) { this.datasources = []; }
		self.x = 20;
		self.y = 0;
		self.selectForm();
	}
	
	this.startCapture = function(event) { /* selecting multiple objects */
		var src = OAT.Dom.source(event);
		if (src != self.base) { return; }
		self.capture = OAT.Dom.create("div",{position:"absolute",border:"2px solid #ff0",width:"0px",height:"0px",zIndex:10});
		OAT.Dom.attach(self.capture,"mouseup",self.stopCapture);
		OAT.Dom.attach(self.capture,"mousemove",self.processCapture);
		self.base.appendChild(self.capture);
		var coords = OAT.Dom.position(self.base);
		self.capture.parentCoords = coords;
		var exact = OAT.Dom.eventPos(event);
		var x = exact[0] - coords[0];
		var y = exact[1] - coords[1];
		self.capture.style.left = x + "px";
		self.capture.style.top = y + "px";
		self.capture.origX = x;
		self.capture.origY = y;
	} /* FormDesigner::startCapture() */
	
	this.processCapture = function(event) {
		if (!self.capture) { return; }
		var exact = OAT.Dom.eventPos(event);
		var end_x = exact[0] - self.capture.parentCoords[0];
		var end_y = exact[1] - self.capture.parentCoords[1];
		var dx = end_x - self.capture.origX;
		var dy = end_y - self.capture.origY;
		if (dx < 0) { 
			self.capture.style.left = end_x + "px";
		}
		if (dy < 0) { 
			self.capture.style.top = end_y + "px";
		}
		self.capture.style.width = Math.abs(dx) + "px";
		self.capture.style.height = Math.abs(dy) + "px";
	} /* FormDesigner::processCapture() */
	
	this.collide = function(something1,something2) {
		/* true if they have something common */
		var coords_1 = OAT.Dom.position(something1);
		var coords_2 = OAT.Dom.position(something2);
		var dims_1 = OAT.Dom.getWH(something1);
		var dims_2 = OAT.Dom.getWH(something2);
		var bad_x = ( (coords_1[0] < coords_2[0] && coords_1[0]+dims_1[0] < coords_2[0]) || (coords_1[0] > coords_2[0] + dims_2[0]) );
		var bad_y = ( (coords_1[1] < coords_2[1] && coords_1[1]+dims_1[1] < coords_2[1]) || (coords_1[1] > coords_2[1] + dims_2[1]) );
		return !(bad_x || bad_y);
	}
	
	this.stopCapture = function(event) {
		if (!self.capture) { return; }
		var x = parseInt(self.capture.style.left);
		var y = parseInt(self.capture.style.top);
		var w = parseInt(self.capture.style.width);
		var h = parseInt(self.capture.style.height);
		self.deselectAll();
		var numSelected = 0;
		var lastObj = false;
		for (var i=0;i<self.objects.length;i++) {
			/* old problem - are two rectangles overlapping ? */
			var o = self.objects[i];
			var c = self.collide(self.capture,o.elm);
			if (c) {
				o.select();
				lastObj = o;
				numSelected++;
			}
		}
		self.createDrags();
		switch (numSelected) {
			case 0: self.selectForm();	break;
			case 1: self.toolbox.showObject(lastObj); break;
			default: self.toolbox.showMulti(); break;
		}
		
		OAT.Dom.unlink(self.capture);
		self.capture = false;
	} /* FormDesigner::stopCapture() */
	
	this.createDrags = function() { /* mark selected elements draggable */
		this.selObjs = [];
		for (var i=0;i<self.objects.length;i++) {
			OAT.Drag.removeAll(self.objects[i].elm);
			if (self.objects[i].selected) { this.selObjs.push(self.objects[i]); }
		}
		for (var i=0;i<this.selObjs.length;i++) {
			for (var j=0;j<this.selObjs.length;j++) {
				OAT.Drag.create(this.selObjs[i].elm,this.selObjs[j].elm,{endFunction:self.checkTabPlacement});
			}
		}
	} /* FormDesigner::createDrags() */
	
	this.alreadyOnTab = function(object,tabsArr,ignoreActive) { /* is object already present on some of _active_ tabs? */
		for (var i=0;i<tabsArr.length;i++) {
			var t = tabsArr[i];
			for (var j=0;j<t.objects.length;j++) {
				var p = t.objects[j];
				var index = p.find(object);
				if (index != -1 && (ignoreActive || t.tab.selectedIndex == j)) { return t; }
			} /* for all pages */
		} /* for all tabs */
		return false;
	}
	
	this.onTab = function(object,tabsArr) { /* is object placed to a position in a tab? */
		for (var i=0;i<tabsArr.length;i++) {
			var t = tabsArr[i];
			var dims = OAT.Dom.getWH(t.elm);
			var coords = OAT.Dom.position(t.elm);
			var oc = OAT.Dom.position(object.elm);
			if (oc[0] > coords[0] && oc[0] < coords[0]+dims[0] &&
				oc[1] > coords[1] && oc[1] < coords[1]+dims[1]) { return t; }
		}
		return false;
	}
	
	this.checkTabPlacement = function() {
		/* check all elements: place/remove from tab */
		var tabs = [];
		for (var i=0;i<self.objects.length;i++) if (self.objects[i].name == "tab") { tabs.push(self.objects[i]); }
		/* 1. placed on tabs */
		for (var i=0;i<self.objects.length;i++) if (!self.alreadyOnTab(self.objects[i],tabs,1)) {
			var t = self.onTab(self.objects[i],tabs);
			if (t) { 
				var o = self.objects[i];
				var coords_t = OAT.Dom.getLT(t.elm);
				var coords_o = OAT.Dom.getLT(o.elm);
				var x = coords_o[0] - coords_t[0];
				var y = coords_o[1] - coords_t[1];
				t.consume(o,x,y);
			}
		}
		/* 2. placed away */
		for (var i=0;i<self.objects.length;i++) if (!self.onTab(self.objects[i],tabs)) {
			var t = self.alreadyOnTab(self.objects[i],tabs,0);
			if (t) {
				var o = self.objects[i];
				var coords_t = OAT.Dom.getLT(t.elm);
				var coords_o = OAT.Dom.getLT(o.elm);
				var x = coords_o[0] + coords_t[0];
				var y = coords_o[1] + coords_t[1];
				t.remove(o,x,y);
			}
		}
	}
	
	this.deselectAll = function() {
		for (var i=0;i<self.objects.length;i++) { self.objects[i].deselect(); OAT.Drag.removeAll(self.objects[i].elm); }
	} /* FormDesigner::deselectAll() */
	
	this.selectObject = function(obj,event) {
		if (obj.selected) { return; } /* what to do when element gets clicked */
		if (event) {
			if (!event.shiftKey && !event.ctrlKey) { self.deselectAll(); }
		}
		obj.select();
		self.createDrags();
		if (self.selObjs.length > 1) { 
			self.toolbox.showMulti(); 
		} else { 
			self.toolbox.showObject(obj); 
		}
	}
	
	this.addObject = function(type,x,y,loading) {
		/* add object 'type' to form. event at [x, y] */
		var coords = OAT.Dom.position(self.base);
		
		var obj_x = x - coords[0];
		var obj_y = y - coords[1];
		
		var formObj = new OAT.FormObject[type](obj_x,obj_y,1,loading);
		self.objects.push(formObj);
		/* append to correct layer */
		var l = false;
		switch (formObj.name) {
			case "map": l = self.layers[0]; break;
			case "timeline": l = self.layers[1];break;
			case "container": l = self.layers[2]; break;
			default: l = self.layers[3]; break;
		}
		l.appendChild(formObj.elm);
		self.layersObj.addLayer(formObj.elm,"click");
		self.deselectAll();
		
		self.selectObject(formObj);
		var cancelRef = function(event) { event.cancelBubble = true; }
		
		OAT.Dom.attach(formObj.elm,"click",function(event){
			var src = OAT.Dom.source(event);
			/* climb up and find first available control */
			do {
				var hope = 0;
				for (var i=0;i<self.objects.length;i++) if (self.objects[i].elm == src) { hope = self.objects[i]; }
				src = src.parentNode;
			} while (!hope);
			self.selectObject(hope,event);
		});
		OAT.Dom.attach(formObj.elm,"mousedown",cancelRef);
		
		if (!loading) { self.checkTabPlacement(); }
		return formObj;
	}

	this.alignSelected = function(type) {
		var extreme = -1;
		for (var i=0;i<self.objects.length;i++) if (self.objects[i] && self.objects[i].selected) {
			var e = self.objects[i].elm;
			var x = e.offsetLeft;
			var y = e.offsetTop;
			var w = e.offsetWidth-4;
			var h = e.offsetHeight-4;
			switch (type) {
				case "top": if (extreme == -1 || y < extreme) { extreme = y; } break;
				case "left": if (extreme == -1 || x < extreme) { extreme = x; } break;
				case "bottom": if (extreme == -1 || y+h > extreme) { extreme = y+h; } break;
				case "right": if (extreme == -1 || x+w > extreme) { extreme = x+w; } break;
			} /* switch */
		}
		for (var i=0;i<self.objects.length;i++) if (self.objects[i] && self.objects[i].selected) {
			var e = self.objects[i].elm;
			var w = e.offsetWidth-4;
			var h = e.offsetHeight-4;
			switch (type) {
				case "top": e.style.top = extreme + "px"; break;
				case "left": e.style.left = extreme + "px"; break;
				case "bottom": e.style.top = (extreme - h) + "px"; break;
				case "right": e.style.left = (extreme - w) + "px"; break;
			} /* switch */
		}
	} /* FormDesigner::alignSelected(type); */
	
	this.fromXML = function(data) {
		self.clear(true);
		var tmp;
		var xmlDoc = OAT.Xml.createXmlDoc(data);
		var root = xmlDoc.documentElement;
		/* datasources*/
		self.clear();
		var dsnodes = root.getElementsByTagName("ds");
		for (var i=0;i<dsnodes.length;i++) {
			var dsnode = dsnodes[i];
			var ds = new OAT.DataSource(parseInt(dsnode.getAttribute("type")));
			self.datasources.push(ds);
			ds.fromXML(dsnode);
			var cb = (i==0 ? function(){self.selectForm();}:function(){});
			ds.refresh(cb,false,self.datasources);
		}
		/* area */
		var tmp = root.getElementsByTagName("area")[0];
		self.base.style.color = tmp.getAttribute("fgcolor");
		self.base.style.backgroundColor = tmp.getAttribute("bgcolor");
		self.base.style.fontSize = tmp.getAttribute("size");
		self.base.style.left = tmp.getAttribute("left")+"px";
		self.base.style.top = tmp.getAttribute("top")+"px";
		self.base.style.width = tmp.getAttribute("width")+"px";
		self.base.style.height = tmp.getAttribute("height")+"px";
		/* objects */
		var objects = root.getElementsByTagName("object");
		for (var j=0;j<objects.length;j++) {
			var type = objects[j].getAttribute("type");
			var obj = self.addObject(type,0,0,1);
			if (obj.userSet) { obj.setValue(objects[j].getAttribute("value")); }
			obj.fromXML(objects[j],self.datasources);
		}
		/* create master links */
		for (var i=0;i<self.datasources.length;i++) {
			var ds = self.datasources[i];
			var fb = ds.fieldBinding;
			for (var j=0;j<fb.masterDSs.length;j++) {
				switch (parseInt(fb.types[j])) {
					case 1:
						fb.masterDSs[j] = self.datasources[parseInt(fb.masterDSs[j])];
					break;
					case 3:
						fb.masterDSs[j] = self.objects[parseInt(fb.masterDSs[j])];
					break;
					default: fb.masterDSs[j] = false;
				} /* switch */
			} /* all bindings */
		} /* all datasources */
		
		/* create tab dependencies */
		for (var i=0;i<self.objects.length;i++) if (self.objects[i].name == "tab") {
			var o = self.objects[i];
			var max = o.properties[0].value.length;
			o.countChangeCallback(0,max);
			o.properties[0].value.length = max;
			for (var j=0;j<max;j++) { o.changeCallback(j,o.properties[0].value[j]); }
			for (var j=0;j<o.__tp.length;j++) {
				o.tab.go(j);
				var tp = o.__tp[j];
				for (var k=0;k<tp.length;k++) { 
					var victim = self.objects[tp[k]];
					var coords = OAT.Dom.getLT(victim.elm);
					o.consume(victim,coords[0],coords[1]); 
				}
			}
		}
		
		/* create parent control */
		for (var i=0;i<self.objects.length;i++) {
			if (self.objects[i].parentContainer != -1) {
				self.objects[i].parentContainer = self.objects[self.objects[i].parentContainer];
			}
			for (var j=0;j<self.objects[i].properties.length;j++) {
				var p = self.objects[i].properties[j];
				if (p.type == "container") { p.value = (parseInt(p.value) == -1 ? false : self.objects[parseInt(p.value)]); }
			}
		}
		
		self.selectForm();
	} /* FormDesigner::fromXML() */

	this.toXML = function(xslStr) {
		var xml = '<?xml version="1.0" ?>\n';
		if (xslStr) { xml += xslStr+'\n'; }
		xml += '<form';
		xml += ' showajax="'+($("options_showajax").checked ? 1 : 0)+'" '; /* display ajax dialogs? */
		xml += '>\n';
		
		var uid = $("options_uid").checked;
		for (var i=0;i<self.datasources.length;i++) {
			xml += self.datasources[i].toXML(uid,self.datasources,self.objects,$("options_nocred").checked)+'\n'; 
		}
		var d = self.base;
		var bg = OAT.Dom.style(d,"backgroundColor");
		var fg = OAT.Dom.style(d,"color");
		var size = OAT.Dom.style(d,"fontSize");
		var coords = OAT.Dom.getLT(d);
		var dims = OAT.Dom.getWH(d);
		xml += '\t<area bgcolor="'+bg+'" fgcolor="'+fg+'" size="'+size+'" '+
			'left="'+coords[0]+'" top="'+coords[1]+'" width="'+dims[0]+'" height="'+dims[1]+'" />\n';
			
		var tabs = [];
		for (var i=0;i<self.objects.length;i++) if (self.objects[i].name == "tab") { tabs.push(self.objects[i]); }
		for (var i=0;i<self.objects.length;i++) {
			var o = self.objects[i];
			var t = self.alreadyOnTab(o,tabs,1);
			if (t) { 
				for (var j=0;j<t.objects.length;j++) if (t.objects[j].find(o) != -1) { 
					t.tab.go(j); 
				} /* activate its tab */
			} /* if on a tab */
			xml += o.toXML(self)+'\n'; 
		}
		xml += '</form>\n';
		
		return xml;
	} /* FormDesigner::toXML(); */
}
