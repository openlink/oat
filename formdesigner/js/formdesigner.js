/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */

/*
	new FormDesigner(parent)
	FormDesigner.setBase(baseElement)
	FormDesigner.clear()
	FormDesigner.addObject(formIndex,type,x,y)
*/


var FormDesigner = function(parent) {

	/* basic properties */
	var self = this;
	this.base = false; /* root element */
	this.capture = false; /* yellow select rectangle */

	this.forms = [];
	this.objects = [];
	this.gd = new OAT.GhostDrag();

	this.selObjs = []; /* selected objects */

	this.parent = $(parent); /* place for supplementary windows, toolbox etc */

	/* columns */
	this.columns = new Columns(self);
	this.parent.appendChild(this.columns.win.div);
	OAT.Layers.addLayer(this.columns.win.div);
	
	/* palette */
	this.palette = new Palette(self);
	this.parent.appendChild(this.palette.win.div);
	OAT.Layers.addLayer(this.palette.win.div);
	
	/* toolbox */
	this.toolbox = new Toolbox(self);
	this.parent.appendChild(this.toolbox.win.div);
	OAT.Layers.addLayer(this.toolbox.win.div);
	
	/* --------- available objects ----------- */ 
	this.palette.addObject("label");
	this.palette.addObject("input");
	this.palette.addObject("textarea");
	this.palette.addObject("checkbox");
	this.palette.addObject("line");
	this.palette.addObject("url");
	this.palette.addObject("map");
	this.palette.addObject("grid");
	this.palette.addObject("barchart");
	this.palette.addObject("pivot");
	this.palette.addObject("image");
	this.palette.addObject("imagelist");
	this.palette.addObject("twostate");
	this.palette.addObject("timeline");
	this.palette.addObject("nav");
	this.palette.addObject("gem");
	/* --------------------------------------- */

	/* methods */
	
	this.init = function(base) {
		self.base = $(base);
		OAT.Dom.attach(this.base,"mousedown",self.startCapture);
		OAT.Dom.attach(this.base,"mouseup",self.stopCapture);
		OAT.Dom.attach(this.base,"mousemove",self.processCapture);
		var obj = new OAT.Form(self);
		obj.name = "Main Form";
		obj.div = self.base;
		var pos = OAT.Dom.position(self.base);
		var dim = OAT.Dom.getWH(self.base);
		self.addObject(obj,"nav",pos[0],pos[1]+dim[1]-30);
		self.forms.push(obj);
		self.formEvents(obj);
		self.selectForm(obj);
	}
	
	this.selectForm = function(form) {
		self.deselectAll();
		self.gd.clearSources();
		self.gd.clearTargets();
		self.gd.addTarget(form.div);
		self.palette.createDrags(form);
		self.columns.createColumns(form,form.outputFields);
		self.toolbox.showForm(form);
		for (var i=1;i<self.forms.length;i++) {
			self.forms[i].div.className = "form";
		}
		if (form.div != self.base) { form.div.className = "form form_selected"; }
	}
	
	this.formEvents = function(form) { /* manage clicking on form */
		var div = form.div;
		var callback = function(event) {
			var src = OAT.Dom.source(event);
			if (src != div) { return; } /* only when form is directly clicked */
			self.selectForm(form);
		}
		OAT.Dom.attach(div,"click",callback);
	}
	
	this.addForm = function(optObj) { /* new subform */
		var div = OAT.Dom.create("div",{position:"absolute",left:"10px",top:"10px",width:"300px",height:"200px"});
		div.className = "form";
		self.base.appendChild(div);
		var obj = new OAT.Form(self); 
		obj.div = div;
		if (optObj.addNav) {
			var pos = OAT.Dom.position(div);
			var dim = OAT.Dom.getWH(div);
			self.addObject(obj,"nav",pos[0],pos[1]+dim[1]-30);
		}
		OAT.Drag.create(div,div);
		self.forms.push(obj);
		self.formEvents(obj);
		self.selectForm(obj);
		
		var resizer = OAT.Dom.create("div",{position:"absolute",width:"10px",height:"10px",bottom:"-5px",right:"-5px"});
		div.appendChild(resizer);
		OAT.Resize.create(resizer,div,OAT.Resize.TYPE_XY);
		
		return obj;
	}
	
	this.delForm = function(form) {
		OAT.Dom.unlink(form.div);
		/* all subforms that use this form... */
		for (var i=0;i<self.forms.length;i++) {
			var f = self.forms[i];
			var indexesToRemove = [];
			for (var j=0;j<f.masterForms.length;j++) {
				if (f.masterForms[j] == form) { indexesToRemove.push(j); }
			}
			for (var j=indexesToRemove.length-1;j>=0;j--) {
				f.masterForms.splice(indexesToRemove[j],1);
				f.masterCols.splice(indexesToRemove[j],1);
				f.selfCols.splice(indexesToRemove[j],1);
			}
		}
		var index = self.forms.find(form);
		self.forms.splice(index,1);
		var tmp = []; /* all objects on this form */
		for (var i=0;i<self.objects.length;i++) {
			if (self.objects[i].form == f) { tmp.push(i); }
		}
		for (var i=tmp.length;i>0;i--) {
			self.objects.splice(tmp[i-1],1);
		}
		self.toolbox.showForm(self.forms[0]); /* show form */

	}
	
	this.clear = function(optObj) { /* remove everything from this design */
		OAT.Dom.clear(this.base); 
		while (self.forms.length > 1) {
			self.forms.splice(1,1);
		}
		this.gd.clearSources();
		this.gd.clearTargets();
		this.objects = []; 
		var obj = self.forms[0];
		obj.clear();
		obj.name = "Main Form";

		if (optObj.addNav) {
			var pos = OAT.Dom.position(self.base);
			var dim = OAT.Dom.getWH(self.base);
			self.addObject(self.forms[0],"nav",pos[0],pos[1]+dim[1]-30);
		}
		
		self.selectForm(self.forms[0]);
	}
	
	this.startCapture = function(event) { /* selecting multiple objects */
		var src = OAT.Dom.source(event);
		if (src != self.base) { return; }
		self.capture = OAT.Dom.create("div",{position:"absolute",border:"2px solid #ff0",width:"0px",height:"0px",zIndex:"3"});
		OAT.Dom.attach(self.capture,"mouseup",self.stopCapture);
		OAT.Dom.attach(self.capture,"mousemove",self.processCapture);
		self.base.appendChild(self.capture);
		var coords = OAT.Dom.position(self.base);
		self.capture.parentCoords = coords;
		var exact = OAT.Dom.eventPos(event);
		self.capture.style.left = (exact[0] - coords[0]) + "px";
		self.capture.style.top = (exact[1] - coords[1]) + "px";
	} /* FormDesigner::startCapture() */
	
	this.processCapture = function(event) {
		if (!self.capture) { return; }
		var x = parseInt(self.capture.style.left);
		var y = parseInt(self.capture.style.top);
		var exact = OAT.Dom.eventPos(event);
		var end_x = exact[0] - self.capture.parentCoords[0];
		var end_y = exact[1] - self.capture.parentCoords[1];
		self.capture.style.width = (end_x - x) + "px";
		self.capture.style.height = (end_y - y) + "px";
	} /* FormDesigner::processCapture() */
	
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
			var x2 = o.elm.offsetLeft + o.form.div.offsetLeft;
			var y2 = o.elm.offsetTop + o.form.div.offsetTop;
			var w2 = o.elm.offsetWidth;
			var h2 = o.elm.offsetHeight;
			var bad_x = ( (x < x2 && x+w < x2) || (x > x2+w2) );
			var bad_y = ( (y < y2 && y+h < y2) || (y > y2+h2) );
			if (!bad_x && !bad_y) { 
				o.select();
				lastObj = o;
				numSelected++;
			}
		}
		self.createDrags();
		switch (numSelected) {
			case 0: self.selectForm(self.forms[0]);	break;
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
				OAT.Drag.create(this.selObjs[i].elm,this.selObjs[j].elm);
			}
		}
	} /* FormDesigner::createDrags() */
	
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
	
	this.addObject = function(form,type,x,y) {
		/* add object 'type' to form. event at [x, y] */
		var coords = OAT.Dom.position(form.div);
		
		var obj_x = x - coords[0];
		var obj_y = y - coords[1];
		
		var formObj = new OAT.FormObject[type](obj_x,obj_y,1);
		formObj.form = form;
		self.objects.push(formObj);
		form.div.appendChild(formObj.elm);
		self.deselectAll();
		
		self.selectObject(formObj);
		var cancelRef = function(event) { event.cancelBubble = true; }
		
		OAT.Dom.attach(formObj.elm,"click",function(event){self.selectObject(formObj,event);});
		OAT.Dom.attach(formObj.elm,"mousedown",cancelRef);
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
	
	this.loadXML = function(data) {
		var tmp;
		var xml = OAT.Xml.getTreeString(data);
		var root = xml.documentElement;
		var c = root.getElementsByTagName("connection")[0];
		OAT.Xmla.dsn = c.getAttribute("dsn");
		OAT.Xmla.endpoint = c.getAttribute("endpoint");
		if (c.getAttribute("user")) {
			OAT.Xmla.user = OAT.Crypto.base64d(c.getAttribute("user"));
			OAT.Xmla.password = OAT.Crypto.base64d(c.getAttribute("password"));
		}
		
		var forms = root.getElementsByTagName("form");
		self.clear({addNav:false});
		for (var i=0;i<forms.length;i++) {
			if (i) { var f = self.addForm({addNav:false}); } else { var f = self.forms[0]; }
			var fb = f.fieldBinding;
			
			if (forms[i].getAttribute("hidden")) { f.hidden = 1; } /* hidden? */
			f.empty = parseInt(forms[i].getAttribute("empty")); /* should be emptied with no data? */
			f.name = forms[i].getAttribute("name"); /* name */
			f.pageSize = parseInt(forms[i].getAttribute("pagesize"));
			f.cursorType = parseInt(forms[i].getAttribute("cursortype"));

			var dso = forms[i].getElementsByTagName("datasource")[0];
			f.ds.type = parseInt(dso.getAttribute("type"));
			f.ds.subtype = parseInt(dso.getAttribute("subtype"));
			f.ds.url = dso.getAttribute("url");
			f.ds.service = dso.getAttribute("service");
			f.ds.xpath = parseInt(dso.getAttribute("xpath"));
			var tmp = dso.getElementsByTagName("query")[0];
			f.ds.query = OAT.Xml.textValue(tmp);

			var tmp = dso.getElementsByTagName("inputField");
			f.inputFields = [];
			for (var j=0;j<tmp.length;j++) {
				f.inputFields.push(OAT.Xml.textValue(tmp[j]));
			}
			var tmp = dso.getElementsByTagName("outputField");
			f.outputFields = [];
			for (var j=0;j<tmp.length;j++) {
				var v = OAT.Xml.textValue(tmp[j]);
				f.outputFields.push(OAT.Dom.fromSafeXML(v));
			}

			var tmp = dso.getElementsByTagName("selfField");
			for (var j=0;j<tmp.length;j++) {
				fb.selfFields.push(parseInt(OAT.Xml.textValue(tmp[j])));
			}
			var tmp = dso.getElementsByTagName("masterForm");
			for (var j=0;j<tmp.length;j++) {
				var val = OAT.Xml.textValue(tmp[j]);
				fb.masterForms.push(val);
			}
			var tmp = dso.getElementsByTagName("masterField");
			for (var j=0;j<tmp.length;j++) {
				var val = OAT.Xml.textValue(tmp[j]);
				if (fb.masterForms[j] == "false") {
					fb.masterFields.push(val == "-1" ? -1 : OAT.Dom.fromSafeXML(val));
				} else {
					fb.masterFields.push(parseInt(val));
				}
			}

			tmp = forms[i].getElementsByTagName("area")[0];
			var attrib = tmp.attributes[0];
			f.div.style.color = tmp.getAttribute("fgcolor");
			f.div.style.backgroundColor = tmp.getAttribute("bgcolor");
			f.div.style.fontSize = tmp.getAttribute("size");
			f.div.style.left = tmp.getAttribute("left")+"px";
			f.div.style.top = tmp.getAttribute("top")+"px";
			f.div.style.width = tmp.getAttribute("width")+"px";
			f.div.style.height = tmp.getAttribute("height")+"px";
			
			var objects = forms[i].getElementsByTagName("object");
			for (var j=0;j<objects.length;j++) {
				var type = objects[j].getAttribute("type");
				var obj = self.addObject(f,type,0,0);
				if (obj.userSet) { obj.setValue(objects[j].getAttribute("value")); }
				obj.loadXML(objects[j]);
			}
			
			var cb = (i==0 ? function(){self.selectForm(self.forms[0]);}:function(){});
			
			f.refresh(cb,false);
		} /* for all forms */
		
		/* create master links */
		for (var i=0;i<self.forms.length;i++) {
			var f = self.forms[i];
			var fb = f.fieldBinding;
			for (var j=0;j<fb.masterForms.length;j++) {
				if (fb.masterForms[j] == "false") { fb.masterForms[j] = false; } else {
					fb.masterForms[j] = self.forms[parseInt(fb.masterForms[j])];
				}
			}
		}
		/* create pin links */
		for (var i=0;i<self.objects.length;i++) if (self.objects[i].name == "map") {
			var o = self.objects[i];
			var v = o.properties[4].value;
			if (v == -1) { o.properties[4].value = false; } else { o.properties[4].value = self.forms[v]; }
		}
		
		self.selectForm(self.forms[0]);
	} /* FormDesigner::loadXML() */

	this.toXML = function(xslStr) {
		var xml = '<?xml version="1.0" ?>\n';
		if (xslStr) { xml += xslStr+'\n'; }
		xml += '<design>\n';
		xml += '\t<connection dsn="'+OAT.Xmla.dsn+'" endpoint="'+OAT.Xmla.endpoint+'" ';
		if ($("options_uid").checked) { xml += 'user="'+OAT.Crypto.base64e(OAT.Xmla.user)+'" password="'+OAT.Crypto.base64e(OAT.Xmla.password)+'"'; }
		xml += ' showajax="'+($("options_showajax").checked ? 1 : 0)+'" ';
		xml += ' nocred="'+($("options_nocred").checked ? 1 : 0)+'"></connection>\n';
		for (var i=0;i<self.forms.length;i++) {
			var f = self.forms[i];
			var d = f.div;
			var fb = f.fieldBinding;
			var tmp = [];
			for (var j=0;j<fb.masterForms.length;j++) {
				var index = self.forms.find(fb.masterForms[j]);
				tmp.push(index != -1 ? index : "false");
			}
			xml += '\t<form name="'+f.name+'" empty="'+f.empty+'" ';
			xml += ' cursortype="'+f.cursorType+'" pagesize="'+f.pageSize+'" ';
			if (f.hidden == "1") { xml += 'hidden="1" '; }
			xml += '>\n';
			xml += '\t\t<datasource type="'+f.ds.type+'" subtype="'+f.ds.subtype+'" url="'+f.ds.url+'" ';
			xml += 'xpath="'+f.ds.xpath+'" service="'+f.ds.service+'" rootelement="'+f.ds.rootElement+'">\n';
			xml += '\t\t\t<outputFields>\n';
			for (var j=0;j<f.outputFields.length;j++) {
				xml += '\t\t\t\t<outputField>'+OAT.Dom.toSafeXML(f.outputFields[j])+'</outputField>\n';
			}
			xml += '\t\t\t</outputFields>\n';
			xml += '\t\t\t<inputFields>\n';
			for (var j=0;j<f.inputFields.length;j++) {
				xml += '\t\t\t\t<inputField>'+f.inputFields[j]+'</inputField>\n';
			}
			xml += '\t\t\t</inputFields>\n';
			xml += '\t\t\t<query>'+f.ds.query+'</query>\n';
			xml += '\t\t\t<selfFields>\n';
			for (var j=0;j<fb.selfFields.length;j++) {
				xml += '\t\t\t\t<selfField>'+fb.selfFields[j]+'</selfField>\n';
			}
			xml += '\t\t\t</selfFields>\n';
			xml += '\t\t\t<masterFields>\n';
			for (var j=0;j<fb.masterFields.length;j++) {
				xml += '\t\t\t\t<masterField>'+OAT.Dom.toSafeXML(fb.masterFields[j])+'</masterField>\n';
			}
			xml += '\t\t\t</masterFields>\n';
			xml += '\t\t\t<masterForms>\n';
			for (var j=0;j<tmp.length;j++) {
				xml += '\t\t\t\t<masterForm>'+tmp[j]+'</masterForm>\n';
			}
			xml += '\t\t\t</masterForms>\n';
			xml += '\t\t</datasource>';
			var bg = OAT.Dom.style(d,"backgroundColor");
			var fg = OAT.Dom.style(d,"color");
			var size = OAT.Dom.style(d,"fontSize");
			var coords = OAT.Dom.getLT(d);
			var dims = OAT.Dom.getWH(d);
			xml += '\t\t<area bgcolor="'+bg+'" fgcolor="'+fg+'" size="'+size+'" '+
				'left="'+coords[0]+'" top="'+coords[1]+'" width="'+dims[0]+'" height="'+dims[1]+'" />\n';
			
			for (var j=0;j<self.objects.length;j++) {
				if (self.objects[j].form == f) { 
					xml += '\t\t'+self.objects[j].toXML(self)+'\n'; 
				}
			}
			
			xml += '\t</form>\n';
		}
		xml += '</design>\n';
		
		return xml;
	} /* FormDesigner::toXML(); */
}
