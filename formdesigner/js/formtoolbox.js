/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2007 OpenLink Software
 *
 *  See LICENSE file for details.
 */
function Toolbox(obj) {	
	var self = this;
	this.obj = obj;

	this.selectFile = function(callback,mode) {
		if ($("options_type_http").checked) {
			var name = OAT.Dav.getNewFile("/DAV/home/"+http_cred.user,".xml","xml");
			if (!name) { return; }
			if (name.slice(name.length-4).toLowerCase() != ".xml") { name += ".xml"; }
			callback(name);
		}
		if ($("options_type_dav").checked) {
			var options = {
				mode:mode,
				onConfirmClick:function(path,fname){
					var name = path + fname;
					callback(name);
				},
				onConfirmClick:function(path,fname,data){
					var name = path + fname;
					callback(name);
					return true; /* return false will keep browser open */
				},
				user:http_cred.user,
				pass:http_cred.password,
				pathDefault:"/DAV/home/"+http_cred.user+"/",
				file_ext:'xml'
			};
			OAT.WebDav.open(options);
		}
	}

	this.win = new OAT.Window({min:0,max:0,close:1,height:0,width:240,x:-15,y:140,title:"Control Properties"});
	var d = OAT.Dom.create("div",{padding:"3px"},"toolbox");
	this.win.hide = function() {OAT.Dom.hide(self.win.div);};
	this.win.show = function() {OAT.Dom.show(self.win.div);};
	this.win.onclose = function() {
		self.win.hide();
		tbar.icons[1].toggle();
	}
	this.win.content.appendChild(d);
	this.name = OAT.Dom.create("span");
	var tmp = OAT.Dom.create("div");
	tmp.innerHTML = "Selected: ";
	tmp.appendChild(this.name);
	d.appendChild(tmp);
	var ul = OAT.Dom.create("ul");
	d.appendChild(ul);
	
	this.content = OAT.Dom.create("div",{marginTop:"20px",border:"2px solid #000"});
	d.appendChild(this.content);
	
	this.lastTabIndex = 0;
	this.tab = new OAT.Tab(this.content,{
		goCallback:function(a,b) {
			self.lastTabIndex = b;
		}
	});
	
	this.lis = [];
	this.tabs = [];
	this.tables = [];
	for (var i=0;i<3;i++) {
		var li = OAT.Dom.create("li");
		li.innerHTML = ["Generic","Data","Style"][i];
		this.lis.push(li);
		ul.appendChild(li);
		var cont = OAT.Dom.create("div");
		this.tabs.push(cont);
		this.tab.add(li,cont);
		var t = OAT.Dom.create("table");
		var b = OAT.Dom.create("tbody");
		t.appendChild(b);
		this.tables.push(b);
		cont.appendChild(t);
	}
	this.tableIndex = 0;
	
	this.clear = function() {
		var last = self.lastTabIndex;
		for (var i=0;i<self.tables.length;i++) { OAT.Dom.clear(self.tables[i]); }
//		self.win.accomodate();
		self.tab.go(0);
		self.lastTabIndex = last;
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
		self.tables[self.tableIndex].appendChild(r);
	}
	
	this.showForm = function() {
		self.clear();
		self.name.innerHTML = "[form]";

		self.tableIndex = 2;
		/* css props */
		var t = OAT.Dom.text("Appearance");
		self.addTable(t);
		var elm = self.obj.base;
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

		/* if needed, resize property window */
		var tableW = OAT.Dom.getWH(self.tables[self.tableIndex])[0];
		var divW = parseInt(self.win.content.style.width);
		if (tableW > divW) { self.win.content.style.width = tableW + "px"; }
	}
	
	this.container = function(o,label,targetO,targetP) {
		var t = OAT.Dom.text(label);
		var cont_select = OAT.Dom.create("select");
		var opt = OAT.Dom.option("",false,cont_select);
		opt.cont = false;
		for (var i=0;i<self.obj.objects.length;i++) {
			var cont = self.obj.objects[i];
			if (cont.name == "container") { 
				var opt = OAT.Dom.option(cont.properties[0].value,-1,cont_select); 
				opt.cont = cont;
			}
			if (cont == targetO[targetP]) { cont_select.selectedIndex = cont_select.childNodes.length-1; }
		}
		OAT.Dom.attach(cont_select,"change",function(){
			targetO[targetP] = cont_select.childNodes[cont_select.selectedIndex].cont;
		});
		self.addTable(t,cont_select);
	}
	
	
	this.showObject = function(object,tabIndex) {
		var o = object;
		self.clear();
		self.name.innerHTML = OAT.FormObjectNames[o.name];
		self.tableIndex = 0;
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
		/* container */
		if (o.name != "container") { self.container(o,"Parent container",o,"parentContainer"); }
		/* empty */
		if (o.datasources.length) {
			var t = OAT.Dom.text("When empty data arrives");
			var emptysel = OAT.Dom.create("select");
			OAT.Dom.option("Do nothing",0,emptysel);
			OAT.Dom.option("Clear contents",1,emptysel);
			emptysel.selectedIndex = o.empty;
			OAT.Bindings.bindSelect(emptysel,o,"empty");
			self.addTable(t,emptysel);
		}
		if (o.properties.length) {
			var t = OAT.Dom.text("Properties");
			self.addTable(t);
		}
		for (var i = 0;i<o.properties.length;i++) {
			var p = o.properties[i];
			self.tableIndex = 0;
			if ("positionOverride" in p) { self.tableIndex = p.positionOverride; }
			var text = OAT.Dom.text(p.name);
			switch (p.type) {
				case "string":
					if (p.variable) {
						var cnt = OAT.Dom.create("select");
						for (var j=1;j<11;j++) { OAT.Dom.option(j,j,cnt); }
						cnt.selectedIndex = p.value.length-1;
						OAT.Dom.attach(cnt,"change",function(){ 
							var newc = parseInt($v(cnt));
							var oldc = p.value.length;
							if (newc != oldc) { 
								p.oncountchange(oldc,newc); 
								self.showObject(o);
							}
						});
						self.addTable(text,cnt);
						var gen = function(index,input) {
							return function() { p.onchange(index,$v(input)); }
						}
						for (var j=0;j<p.value.length;j++) {
							/* all values */
							var input = OAT.Dom.create("input");
							input.setAttribute("size","14");
							input.value = p.value[j];
							OAT.Bindings.bindString(input,p.value,j);
							var ref = gen(j,input);
							OAT.Dom.attach(input,"keyup",ref);
							var text = OAT.Dom.text("#"+(j+1));
							self.addTable(text,input);
						}
					} else {
						var input = OAT.Dom.create("input");
						input.setAttribute("size","14");
						input.value = p.value;
						OAT.Bindings.bindString(input,p,"value");
						self.addTable(text,input);
					}
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

				case "datasource":
					if (!p.value && self.obj.datasources.length) { p.value = self.obj.datasources[0]; }
					var input = self.obj.createDSOnlySelect(p.value);
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
				
				case "container":
					self.container(o,p.name,p,"value");
				break;
			} /* property type switch */
		} /* for all properties */

		self.tableIndex = 1;

		/* datasources */
		if (o.datasources.length) {
			var t = OAT.Dom.text("Datasources");
			self.addTable(t);
		}
		if (o.allowMultipleDatasources) {
			var text = OAT.Dom.text("Number of used datasources");
			var dssel = OAT.Dom.create("select");
			for (var i=1;i<=self.obj.datasources.length;i++) {
				OAT.Dom.option(i,i,dssel);
			}
			if (o.datasources.length <= self.obj.datasources.length) {
				dssel.selectedIndex = o.datasources.length-1;
			}
			self.addTable(text,dssel);
			OAT.Dom.attach(dssel,"change",function(){
				var c = $v(dssel);
				if (c < o.datasources.length) {
					/* easy - remove redundant datasources */
					o.datasources.length = c;
				} else {
					/* difficult - copy first ds to suit current number */
					for (var i=o.datasources.length;i<c;i++) {
						var newds = {ds:false,fieldSets:[]};
						for (var j=0;j<o.datasources[0].fieldSets.length;j++) {
							var fs = o.datasources[0].fieldSets[j];
							newds.fieldSets.push({name:fs.name,names:[],realIndexes:[],variable:fs.variable,columnIndexes:(fs.variable ? [] : [-1])});
						}
						o.datasources.push(newds);
					} /* for all new ds */
				} /* increase number of ds */
				/* redraw */
				self.showObject(o,2);
			}); /* reference */
		}
		
		var getDSref = function(select,ds) {
			return function() {
				var opt = select.childNodes[select.selectedIndex];
				ds.ds = opt.ds;
				/* erase all set fields */
				for (var i=0;i<ds.fieldSets.length;i++) {
					var fs = ds.fieldSets[i];
					fs.names = [];
					fs.realIndexes = [];
					fs.columnIndexes = (fs.variable ? [] : [-1]);
				}
				/* redraw */
				self.showObject(o,2);
			}
		}
		
		for (var i=0;i<o.datasources.length;i++) {
			/* one datasource set */
			var ds = o.datasources[i];
			if (!ds.ds && !i && self.obj.datasources.length) { ds.ds = self.obj.datasources[0]; }
			var text = OAT.Dom.text("Datasource");
			var s = self.obj.createDSOnlySelect(ds.ds);
			self.addTable(text,s);
			var ref = getDSref(s,ds);
			OAT.Dom.attach(s,"change",ref);
			
			var fieldSets = ds.fieldSets;
			for (var ii=0;ii<fieldSets.length;ii++) {
				var fs = fieldSets[ii];
				var t = OAT.Dom.text(fs.name);
				var colList = (ds.ds ? ds.ds.outputFields : []);
				if (fs.variable) {
					/* variable count datasource */
					var cnt_select = OAT.Dom.create("select");
					for (var j=0;j<11;j++) {
						OAT.Dom.option(j,j,cnt_select);
						if (j == fs.names.length) { cnt_select.selectedIndex = j; }
					}
					self.addTable(t,cnt_select);
					/* count change reference */
					var fsCountRef = self.fsCountRef(cnt_select,fs,o);
					OAT.Dom.attach(cnt_select,"change",fsCountRef);
					
					/* actual values */
					for (var j=0;j<fs.names.length;j++) {
						var text = OAT.Dom.text("#"+(j+1)+" name");
						var name = OAT.Dom.create("input");
						name.type = "text";
						name.size = "16";
						name.value = fs.names[j];
						OAT.Bindings.bindString(name,fs.names,j);
						self.addTable(text,name);
						
						var text = OAT.Dom.text("#"+(j+1)+" value");
						var select = OAT.Dom.create("select");
						OAT.Dom.option("","-1",select);
						for (var k=0;k<colList.length;k++) { 
							var l = (ds.ds.outputLabels[k] ? ds.ds.outputLabels[k] : colList[k]);
							OAT.Dom.option(l,k,select);
							if (k == fs.columnIndexes[j]) { select.selectedIndex = k+1; }
						}
						OAT.Bindings.bindSelect(select,fs.columnIndexes,j);
						self.addTable(text,select);
					}
				} else {
					/* static datasource */
					var select = OAT.Dom.create("select");
					OAT.Dom.option("","-1",select);
					for (var j=0;j<colList.length;j++) { 
						var l = (ds.ds.outputLabels[j] ? ds.ds.outputLabels[j] : colList[j]);
						OAT.Dom.option(l,j,select);
						if (fs.columnIndexes.length && j == fs.columnIndexes[0]) { select.selectedIndex = j+1; }
					}
					OAT.Bindings.bindSelect(select,fs.columnIndexes,0);
					if (fs.columnIndexes.length) { self.addTable(t,select); }
				} /* static fieldset */
			} /* for all fieldsets */
		} /* for all datasources */
		
		/* css */
		self.tableIndex = 2;
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
		self.tableIndex = 0;
		var del = OAT.Dom.create("a",{marginTop:"3px"});
		del.setAttribute("href","#");
		del.innerHTML = "remove";
		var delRef = function(event) {
			o.deselect();
			obj.layersObj.removeLayer(o.elm);
			OAT.Dom.unlink(o.elm);
			var index = obj.objects.find(o);
			obj.objects.splice(index,1);
			/* object may be referenced as parent control or user input... */
			for (var i=0;i<obj.objects.length;i++) {
				var test = obj.objects[i];
				if (test.parentControl == o) { test.parentControl = false; }
			}
			for (var i=0;i<obj.datasources.length;i++) {
				var ds = obj.datasources[i];
				for (var j=0;j<ds.fieldBinding.types.length;j++) {
					if (ds.fieldBinding.masterDSs[j] == o) { 
						ds.fieldBinding.types[j] = 2; /* change to 'ask at runtime' */
					} /* if this control */
				} /* all bindings */
			} /* all ds */
			self.showForm(); /* show form */
		}
		OAT.Dom.attach(del,"click",delRef);
		self.addTable(del);
		
		/* if specified, switch to tab index */
		if (tabIndex) { 
			self.tab.go(tabIndex-1); 
		} else {
			self.tab.go(self.lastTabIndex);
		}
	}
	
	this.showMulti = function() {
		self.clear();
		self.name.innerHTML = "[multiple]";
		
		self.tableIndex = 0;
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
			self.showForm(); /* show form */
		}
		OAT.Dom.attach(del,"click",delRef);
		self.addTable(del);
	}
	
	/************************************************************/
	
	this.fsCountRef = function(cnt_select,fs,o) { 
		return function() {
			var oldLen = fs.names.length;
			fs.names.length = parseInt(cnt_select.value); 
			fs.columnIndexes.length = parseInt(cnt_select.value); 
			for (var j=0;j<fs.names.length;j++) {
				if (j >= oldLen) { 
					fs.names[j] = "";
					fs.columnIndexes[j] = -1;
				}
			}
			self.showObject(o,2); 
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

	
} /* Toolbox() */
