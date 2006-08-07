/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
function Toolbox(obj) {	
	var self = this;
	this.obj = obj;

	this.selectFile = function(callback,mode) {
		if ($("options_type_http").checked) {
			var name = OAT.Dav_old.getNewFile("/DAV/home/"+OAT.Ajax.user,".xml","xml");
			if (!name) { return; }
			if (name.slice(name.length-4).toLowerCase() != ".xml") { name += ".xml"; }
			callback(name);
		}
		if ($("options_type_dav").checked) {
			var options = {
				mode:mode,
				onOKClick:function(path,fname){
					var name = path + fname;
					callback(name);
				},
				onOpenClick:function(path,fname,data){
					var name = path + fname;
					callback(name);
					return true; /* return false will keep browser open */
				},
				user:OAT.Xmla.user,
				pass:OAT.Xmla.password,
				pathDefault:"/DAV/home/"+OAT.Xmla.user+"/",
				file_ext:'xml'
			};
			OAT.WebDav.open(options);
		}
	}

	this.win = new OAT.Window({min:0,max:0,close:1,height:0,width:180,x:-15,y:170,title:"Control Properties"});
	this.win.hide = function() {OAT.Dom.hide(self.win.div);};
	this.win.show = function() {OAT.Dom.show(self.win.div);};
	this.win.onclose = function() {
		self.win.hide();
		tbar.icons[1].toggle();
	}
	this.win.content.className = "toolbox";
	this.content = OAT.Dom.create("div");
	this.name = OAT.Dom.create("span");
	var tmp = OAT.Dom.create("div");
	tmp.innerHTML = "Selected: ";
	tmp.appendChild(this.name);
	this.win.content.appendChild(tmp);
	this.win.content.appendChild(this.content);
	
	this.clear = function() {
		OAT.Dom.clear(self.content); /* clear toolbox */
		self.win.content.style.height = ""; /* set toolbox to auto-stretch */
		self.win.div.style.height = "";
	}
	
	this.createTable = function() {
		var t = OAT.Dom.create("table");
		var b = OAT.Dom.create("tbody");
		t.appendChild(b);
		self.table = b;
		self.content.appendChild(t);
	}
	
	this.addTable = function(a,b) {
		var r = OAT.Dom.create("tr");
		var d = OAT.Dom.create("td");
		d.className = "cell_1";
		d.appendChild(a);
		r.appendChild(d);
		if (b) {
			var d = OAT.Dom.create("td");
			d.className = "cell_2";
			d.appendChild(b);
			r.appendChild(d);
		} else {
			d.className = "cell_single";
			d.setAttribute("colSpan",2);
			d.colSpan = 2;
		}
		self.table.appendChild(r);
	}
	
	this.showForm = function(form) {
		self.clear();
		self.name.innerHTML = "[form]";
		self.createTable();
		var f = form;

		/* name */
		var text = OAT.Dom.text("Name");
		var inp = OAT.Dom.create("input"); 
		inp.setAttribute("type","text");
		inp.setAttribute("size","14");
		inp.value = f.name;
		OAT.Dom.attach(inp,"keyup",function() {f.name = inp.value;} )
		self.addTable(text,inp);
		/* hidden */
		var hid = OAT.Dom.create("input");
		hid.setAttribute("type","checkbox");
		hid.checked = (f.hidden == "1" ? true : false);
		OAT.Bindings.bindBool(hid,f,"hidden");
		var text = OAT.Dom.text("Hidden");
		self.addTable(text,hid);
		/* empty */
		var empty = OAT.Dom.create("input");
		empty.setAttribute("type","checkbox");
		empty.checked = (f.empty == "1" ? true : false);
		OAT.Bindings.bindBool(empty,f,"empty");
		var text = OAT.Dom.text("Clear with empty resultset");
		self.addTable(text,empty);
		/* cursor type */
		var cursor = OAT.Dom.create("select");
		OAT.Dom.option("Snapshot",0,cursor);
		OAT.Dom.option("Dynaset",1,cursor);
		cursor.selectedIndex = f.cursorType;
		OAT.Bindings.bindSelect(cursor,f,"cursorType");
		var text = OAT.Dom.text("Cursor type");
		self.addTable(text,cursor);
		/* page size */
		var size = OAT.Dom.create("input");
		size.setAttribute("type","text");
		size.setAttribute("size","3");
		size.value = f.pageSize;
		OAT.Bindings.bindString(size,f,"pageSize");
		var text = OAT.Dom.text("Page size");
		self.addTable(text,size);
		
		/* datasource */
		var t = OAT.Dom.text("Data binding");
		self.addTable(t);
		var ds = OAT.Dom.create("span");
		switch (f.ds.type) {
			case 0: ds.innerHTML = "[none] "; break;
			case 1: ds.innerHTML = "SQL "; break;
			case 2: ds.innerHTML = "WSDL "; break;
		}
		var ds_btn = OAT.Dom.create("input");
		ds_btn.setAttribute("type","button");
		ds_btn.value = "edit";
		var text = OAT.Dom.text("Type");
		var ds_div = OAT.Dom.create("div");
		ds_div.appendChild(ds);
		ds_div.appendChild(ds_btn);
		self.addTable(text,ds_div);
		OAT.Dom.attach(ds_btn,"click",function(){DS.readBinding(f);});
		
		/* field bindings */
		if (f.ds.type != 0) {
			var cnt_select = OAT.Dom.create("select");
			for (var j=0;j<=f.inputFields.length;j++) {
				OAT.Dom.option(j,j,cnt_select);
				if (j == f.fieldBinding.selfFields.length) { cnt_select.selectedIndex = j; }
			}
			var text = OAT.Dom.text("Bound fields");
			self.addTable(text,cnt_select);
			/* count change reference */
			var fieldCountRef = self.fieldCountRef(cnt_select,f);
			OAT.Dom.attach(cnt_select,"change",fieldCountRef);

			/* actual field bindings */
			var fb = f.fieldBinding;
			for (var i=0;i<fb.selfFields.length;i++) {
				var pair = self.createFieldPair(form,i);
				self.addTable(pair[0],pair[1]);
			}
		}
		
		/* css props */
		var t = OAT.Dom.text("Appearance");
		self.addTable(t);
		var elm = f.div;
		var text = OAT.Dom.text("BG color");
		var color = OAT.Dom.style(elm,"backgroundColor");
		var c1 = OAT.Dom.create("div",{cssFloat:"right",styleFloat:"right",width:"16px",height:"8px",margin:"3px",backgroundColor:color,border:"1px solid #000",cursor:"pointer",overflow:"hidden"});
		self.addTable(text,c1);
		OAT.Bindings.bindColor(c1,elm.style,"backgroundColor");
		
		var text = OAT.Dom.text("FG color");
		var color = OAT.Dom.style(elm,"color");
		var c2 = OAT.Dom.create("div",{cssFloat:"right",styleFloat:"right",width:"16px",height:"8px",margin:"3px",backgroundColor:color,border:"1px solid #000",cursor:"pointer",overflow:"hidden"});
		self.addTable(text,c2);
		OAT.Bindings.bindColor(c2,elm.style,"color");
		
		var text = OAT.Dom.text("Font size");
		var font = new OAT.Combolist(["60%","80%","100%","120%","140%"],OAT.Dom.style(elm,"fontSize"));
		font.input.setAttribute("size","6");
		self.addTable(text,font.div);
		OAT.Bindings.bindCombo(font,elm.style,"fontSize");

		/* remove */
		if (form.div != obj.base) {
			var del = OAT.Dom.create("a",{marginTop:"3px"});
			del.setAttribute("href","#");
			del.innerHTML = "remove";
			OAT.Dom.attach(del,"click",function(){obj.delForm(f);});
			self.addTable(del);
		}
		
		/* if needed, resize property window */
		var tableW = OAT.Dom.getWH(self.table)[0];
		var divW = parseInt(self.win.content.style.width);
		if (tableW > divW) { self.win.content.style.width = tableW + "px"; }
	}
	
	this.showObject = function(object) {
		var o = object;
		self.clear();
		self.name.innerHTML = OAT.FormObjectNames[o.name];
		self.createTable();
		var hid = OAT.Dom.create("input");
		hid.setAttribute("type","checkbox");
		hid.checked = (o.hidden == "1" ? true : false);
		OAT.Bindings.bindBool(hid,o,"hidden");
		var text = OAT.Dom.text("Hidden");
		self.addTable(text,hid);
		/* data etc */
		if (o.userSet) { /* value */
			var text = OAT.Dom.text("Value");
			var inp = OAT.Dom.create("input"); 
			inp.setAttribute("type","text");
			inp.setAttribute("size","14");
			inp.value = o.getValue();
			OAT.Dom.attach(inp,"keyup",function() {o.setValue(inp.value);} )
			self.addTable(text,inp);
		}
		if (o.properties.length) {
			var t = OAT.Dom.text("Properties");
			self.addTable(t);
		}
		for (var i = 0;i<o.properties.length;i++) {
		
			var p = o.properties[i];
			var text = OAT.Dom.text(p.name);
			switch (p.type) {
				case "string":
					var input = OAT.Dom.create("input");
					input.setAttribute("size","14");
					input.value = p.value;
					OAT.Bindings.bindString(input,p,"value");
					self.addTable(text,input);
				break;
				case "bool":
					var input = OAT.Dom.create("input");
					input.setAttribute("type","checkbox");
					input.checked = (p.value == "1");
					OAT.Bindings.bindBool(input,p,"value");
					self.addTable(text,input);
				break;
				case "color":
					var input = OAT.Dom.create("div",{cssFloat:"right",styleFloat:"right",width:"16px",height:"8px",margin:"3px",backgroundColor:p.value,border:"1px solid #000",cursor:"pointer",overflow:"hidden"});
					OAT.Bindings.bindColor(input,p,value);
					self.addTable(text,input);
				break;
				
				case "combo":
					var input = new OAT.Combolist(p.options,value);
					input.input.setAttribute("size","6");
					OAT.Bindings.bindCombo(input,p,"value");
					self.addTable(text,input.div);
				break;
				
				case "select":
					var input = OAT.Dom.create("select");
					for (var j=0;j<p.options.length;j++) {
						var item = p.options[j];
						if (typeof(item) == "object") {
							var name = item[0];
							var value = item[1];
						} else {
							var name = item;
							var value = item;
						}
						OAT.Dom.option(name,value,input);
						if (value == p.value) { input.selectedIndex = j; }
					}
					OAT.Bindings.bindSelect(input,p,"value");
					self.addTable(text,input);
				break;

				case "form":
					var input = OAT.Dom.create("select");
					OAT.Dom.option("","",input);
					for (var j=0;j<self.obj.forms.length;j++) {
						var f = self.obj.forms[j];
						if (f != o.form) { OAT.Dom.option(f.toString(),f,input); }
						if (f == p.value) { input.selectedIndex = j; }
					}
					OAT.Bindings.bindSelect(input,p,"value");
					self.addTable(text,input);
				break;

				case "file":
					var input = OAT.Dom.create("div");
					var input1 = OAT.Dom.create("span");
					var txt = OAT.Dom.text(" ");
					var input2 = OAT.Dom.create("input");
					input2.setAttribute("type","button");
					input1.innerHTML = p.value.split("/").pop();
					input2.value = "...";
					input.appendChild(input1);
					input.appendChild(txt);
					input.appendChild(input2);
					
					var browseRef = self.browseRef(input1,p,p.dialog);
					OAT.Dom.attach(input2,"click",browseRef);
					self.addTable(text,input);
				break;
			} /* property type switch */
		} /* for all properties */
		/* datasources */
		if (o.datasources.length) {
			var t = OAT.Dom.text("Datasources");
			self.addTable(t);
		}
		for (var i=0;i<o.datasources.length;i++) {
			var ds = o.datasources[i];
			var t = OAT.Dom.text(ds.name);
			var colList = o.form.outputFields;
			if (ds.variable) {
				/* variable count datasource */
				var cnt_select = OAT.Dom.create("select");
				for (var j=0;j<11;j++) {
					OAT.Dom.option(j,j,cnt_select);
					if (j == ds.names.length) { cnt_select.selectedIndex = j; }
				}
				self.addTable(t,cnt_select);
				/* count change reference */
				var dsCountRef = self.dsCountRef(cnt_select,ds,o);
				OAT.Dom.attach(cnt_select,"change",dsCountRef);
				
				/* actual values */
				for (var j=0;j<ds.names.length;j++) {
					var text = OAT.Dom.text("#"+(j+1)+" name");
					var name = OAT.Dom.create("input");
					name.setAttribute("type","text");
					name.setAttribute("size","16");
					name.value = ds.names[j];
					OAT.Bindings.bindString(name,ds.names,j);
					self.addTable(text,name);
					
					var text = OAT.Dom.text("#"+(j+1)+" value");
					var select = OAT.Dom.create("select");
					OAT.Dom.option("","-1",select);
					for (var k=0;k<colList.length;k++) { 
						OAT.Dom.option(colList[k],k,select);
						if (k == ds.columnIndexes[j]) { select.selectedIndex = k+1; }
					}
					OAT.Bindings.bindSelect(select,ds.columnIndexes,j);
					self.addTable(text,select);
				}
			} else {
				/* static datasource */
				var select = OAT.Dom.create("select");
				OAT.Dom.option("","-1",select);
				for (var j=0;j<colList.length;j++) { 
					OAT.Dom.option(colList[j],j,select);
					if (j == ds.columnIndexes[0]) { select.selectedIndex = j+1; }
				}
				OAT.Bindings.bindSelect(select,ds.columnIndexes,0);
				self.addTable(t,select);
			}
		}
		
		/* css */
		if (o.css.length) {
			var t = OAT.Dom.text("Appearance");
			self.addTable(t);
		}
		for (var i=0;i<o.css.length;i++) {
			var css = o.css[i];
			var text = OAT.Dom.text(css.name);
			var value = OAT.Dom.style(o.elm,css.property);
			switch (css.type) {
				case "string":
					var input = OAT.Dom.create("input");
					input.setAttribute("size","5");
					input.value = value;
					OAT.Bindings.bindString(input,o.elm.style,css.property);
					self.addTable(text,input);
				break;
				
				case "combo":
					var input = new OAT.Combolist(css.options,value);
					input.input.setAttribute("size","6");
					OAT.Bindings.bindCombo(input,o.elm.style,css.property);
					self.addTable(text,input.div);
				break;
				
				case "select":
					var input = OAT.Dom.create("select");
					for (var i=0;i<css.options.length;i++) {
						OAT.Dom.option(css.options[i],css.options[i],input);
						if (css.options[i] == css.value) { input.selectedIndex = i; }
					}
					OAT.Bindings.bindSelect(input,o.elm.style,css.property);
					self.addTable(text,input);
				break;

				case "color":
					var input = OAT.Dom.create("div",{cssFloat:"right",styleFloat:"right",width:"16px",height:"8px",margin:"3px",backgroundColor:value,border:"1px solid #000",cursor:"pointer",overflow:"hidden"});
					OAT.Bindings.bindColor(input,o.elm.style,css.property);
					self.addTable(text,input);
				break;
			}
		}
		
		/* delete */
		var del = OAT.Dom.create("a",{marginTop:"3px"});
		del.setAttribute("href","#");
		del.innerHTML = "remove";
		var delRef = function(event) {
			o.deselect();
			OAT.Dom.unlink(o.elm);
			var index = -1;
			for (var i=0;i<obj.objects.length;i++) if (obj.objects[i] == o) { index = i; }
			obj.objects.splice(index,1);
			self.showForm(o.form); /* show form */
		}
		OAT.Dom.attach(del,"click",delRef);
		self.addTable(del);
	}
	
	this.showMulti = function() {
		self.clear();
		self.name.innerHTML = "[multiple]";
		self.createTable();
		
		var alignTop = OAT.Dom.create("a",{display:"block"});
		alignTop.setAttribute("href","#");	alignTop.innerHTML = "align to top";
		self.addTable(alignTop);
		OAT.Dom.attach(alignTop,"click",function(){obj.alignSelected("top");});
		var alignBottom = OAT.Dom.create("a",{display:"block"});
		alignBottom.setAttribute("href","#"); alignBottom.innerHTML = "align to bottom";
		self.addTable(alignBottom);
		OAT.Dom.attach(alignBottom,"click",function(){obj.alignSelected("bottom");});
		var alignLeft = OAT.Dom.create("a",{display:"block"});
		alignLeft.setAttribute("href","#");	alignLeft.innerHTML = "align to left";
		self.addTable(alignLeft);
		OAT.Dom.attach(alignLeft,"click",function(){obj.alignSelected("left");});
		var alignRight = OAT.Dom.create("a",{display:"block"});
		alignRight.setAttribute("href","#");	alignRight.innerHTML = "align to right";
		self.addTable(alignRight);
		OAT.Dom.attach(alignRight,"click",function(){obj.alignSelected("right");});
		var del = OAT.Dom.create("a",{marginTop:"3px"});
		del.setAttribute("href","#");
		del.innerHTML = "remove";
		var delRef = function(event) {
			for (var i=0;i<obj.selObjs.length;i++) {
				var o = obj.selObjs[i];
				o.deselect();
				OAT.Dom.unlink(o.elm);
				var index = -1;
				for (var j=0;j<obj.objects.length;j++) if (obj.objects[j] == o) { index = j; }
				obj.objects.splice(index,1);
			}
			self.showForm(o.form); /* show form */
		}
		OAT.Dom.attach(del,"click",delRef);
		self.addTable(del);
	}
	
	/************************************************************/
	
	this.fieldCountRef = function(cnt_select,form) {
		return function() {
			var fb = form.fieldBinding;
			var oldLen = fb.selfFields.length;
			var newLen = parseInt(cnt_select.value);
			fb.selfFields.length = newLen; 
			fb.masterForms.length = newLen; 
			fb.masterFields.length = newLen; 
			for (var j=0;j<newLen;j++) {
				if (j >= oldLen) { 
					fb.selfFields[j] = 0;
					fb.masterForms[j] = false;
					fb.masterFields[j] = "";
				}
			}
			self.showForm(form); 
		}
	}
	
	this.dsCountRef = function(cnt_select,ds,o) { 
		return function() {
			var oldLen = ds.names.length;
			ds.names.length = parseInt(cnt_select.value); 
			ds.columnIndexes.length = parseInt(cnt_select.value); 
			for (var j=0;j<ds.names.length;j++) {
				if (j >= oldLen) { 
					ds.names[j] = "";
					ds.columnIndexes[j] = -1;
				}
			}
			self.showObject(o); 
		}
	}
	
	this.browseRef = function(elm,property,mode) {
		return function() {
			var callback = function(name) {
				var f = name.split("/").pop();
				elm.innerHTML = f+" ";
				property.value = name;
				if (property.onselect) { property.onselect(); }
			}
			self.selectFile(callback,mode);
		}
	}

	
	this.createFieldPair = function(form,index) {
		/* first part - list of own input fields */
		var fb = form.fieldBinding;
		var s = OAT.Dom.create("select");
		for (var i=0;i<form.inputFields.length;i++) {
			OAT.Dom.option(form.inputFields[i],i,s);
			if (fb.selfFields[index] == i) { s.selectedIndex = i; }
		}
		OAT.Dom.attach(s,"change",function(){fb.selfFields[index] = parseInt($v(s));});
		
		/* second part - list of available other fields, direct input or parametrized values */
		var div = OAT.Dom.create("div");
		
		/* 1.direct value */
		var d1 = OAT.Dom.create("div");
		var r1 = OAT.Dom.create("input");
		r1.type = "radio";
		r1.name = "radio_"+index;
		var inp = OAT.Dom.create("input"); 
		inp.type = "text";
		inp.size = 40;
		if (!fb.masterForms[index] && typeof(fb.masterFields[index]) == "string") { 
			r1.checked = true;
			inp.value = fb.masterFields[index]; 
		}
		OAT.Dom.attach(inp,"keyup",function(){
			if (!r1.checked) { return; }
			fb.masterFields[index] = $v(inp);
		});
		OAT.Dom.attach(r1,"change",function(){
			fb.masterForms[index] = false;
			fb.masterFields[index] = $v(inp);
		});
		d1.appendChild(r1);
		d1.appendChild(inp);
		
		/* 2.pick a column */
		var d2 = OAT.Dom.create("div");
		var r2 = OAT.Dom.create("input");
		r2.type = "radio";
		r2.name = "radio_"+index;
		if (fb.masterForms[index]) { r2.checked = true; }
		var sel = OAT.Dom.create("select");
		var currIndex = -1;
		for (var i=0;i<self.obj.forms.length;i++) {
			var f = self.obj.forms[i];
			if (f != form) {
				for (var j=0;j<f.outputFields.length;j++) {
					currIndex++;
					var name = f.toString()+"."+f.outputFields[j];
					var o = OAT.Dom.option(name,name,sel);
					o.masterForm = f;
					o.masterField = j;
					if (fb.masterForms[index] == f && fb.masterFields[index] == j) { sel.selectedIndex = currIndex; }
				}
			}
		}
		var changeRef = function() {
			if (!r2.checked) { return; }
			var o = sel.childNodes[sel.selectedIndex];
			fb.masterForms[index] = o.masterForm;
			fb.masterFields[index] = o.masterField;
		}
		OAT.Dom.attach(r2,"change",changeRef);
		OAT.Dom.attach(sel,"change",changeRef);
		d2.appendChild(r2);
		d2.appendChild(sel);
		
		/* 3.parameter */
		var d3 = OAT.Dom.create("div");
		var r3 = OAT.Dom.create("input");
		r3.type = "radio";
		r3.name = "radio_"+index;
		var text = OAT.Dom.create("span"); 
		text.innerHTML = " ask at runtime";
		if (!fb.masterForms[index] && fb.masterFields[index] == -1) { 
			r3.checked = true;
		}
		OAT.Dom.attach(r3,"change",function(){
			fb.masterForms[index] = false;
			fb.masterFields[index] = -1;
		});
		d3.appendChild(r3);
		d3.appendChild(text);
		
		div.appendChild(d1);
		div.appendChild(d2);
		div.appendChild(d3);
		return [s,div];
	}
	
} /* Toolbox() */
