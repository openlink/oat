/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
var fd = false;
var dialogs = {};
var tbar = false;

function set_filename(name) {
	$("corner").innerHTML = name.split("/").pop();
	IO.filename = name;
}

var Connection = {
	get_settings:function() {
		/* read relevant settings from inputboxes */
		OAT.Xmla.endpoint = $v("endpoint");
		OAT.Xmla.dsn = $v("dsn");
		OAT.Xmla.user = $v("user");
		OAT.Xmla.password = $v("password");
		OAT.Ajax.user = OAT.Xmla.user;
		OAT.Ajax.password = OAT.Xmla.password;
		var h = $('options_type_http');
		var d = $('options_type_dav');
		h.checked = ($v('login_put_type') == "http");
		d.checked = ($v('login_put_type') == "dav");
		h.__checked = (h.checked ? "1" : "0");
		d.__checked = (d.checked ? "1" : "0");
	},

	discover_dsn:function() {
		/* discover datasources */
		Connection.get_settings();
		var ref=function(pole) {
			if (pole.length) { dialogs.connection.okBtn.removeAttribute("disabled"); }
			var select = $("dsn");
			OAT.Dom.clear(select);
			for (var i=0;i<pole.length;i++) { OAT.Dom.option(pole[i],pole[i],select); } /* for all rows */
		} /* callback */
		OAT.Xmla.discover(ref);
	},

	use_dsn:function() {
		/* discover catalogs */
		Connection.get_settings();
		var ref=function(pole) {
			OAT.Dimmer.hide();
			ask_for_catalogs(pole,1);
		} /* callback */
		OAT.Xmla.dbschema(ref);

		var qRef = function(q) {
			OAT.SqlQueryData.columnQualifierPre = q[0];
			OAT.SqlQueryData.columnQualifierPost = q[1];
		}
		OAT.Xmla.qualifiers(qRef);
	}
} /* Connection */

function ask_for_catalogs(pole,firstTime) {
	/*
		this is tricky - virtuoso sometimes requires name/pwd for
		table detection. this is why we first send only one request
		and if it succeeds, we ask for remaining catalogs
	*/
	if (firstTime && pole.length) {
		/* first, testing catalog */
		var name = pole[0];
		var callback = function() { ask_for_catalogs(pole,0); }
		OAT.Xmla.tables(name,callback);
	} else {
		/* ok, first request was successfully returned - go for it for real */
		Filter.clear();
		if (pole.length) { var lastCatalog = pole[pole.length-1]; }
		for (var i=0;i<pole.length;i++) {
			var name = pole[i];
			var callback = function(catalog_name,arr) {
				read_tables(catalog_name,arr,lastCatalog);
			}
			OAT.Xmla.tables(name,callback);
		} /* for each catalog */
		/* no catalogs present? */
		if (!pole.length) {
			var callback = function(catalog,arr) {
				read_tables("",arr,"");
			}
			OAT.Xmla.tables("",callback);
		}
	}
}

function read_tables(catalog_name,pole,lastCatalog) {
	/* we have 'pole' of tables in this catalog */
	for (var i=0;i<pole[0].length;i++) {
		var schema = pole[1][i];
		var table = pole[0][i];
		Filter.addTable(catalog_name,schema,table);
	}
	if (catalog_name == lastCatalog) { Filter.create(); }
}

var Filter = {
	addTable:function(catalog,schema,table) {
		Filter.tables.push([catalog,schema,table]);
		if (!(schema in Filter.distinct_schemas)) { Filter.distinct_schemas[schema] = 1; }
		if (!(catalog in Filter.distinct_catalogs)) { Filter.distinct_catalogs[catalog] = 1; }
	},
	clear:function() {
		OAT.Dom.clear("ds_schemas");
		OAT.Dom.clear("ds_catalogs");
		Filter.distinct_catalogs = {};
		Filter.distinct_schemas = {};
		Filter.tables = [];
	},
	create:function() { /* create catalog & schema lists */
		OAT.Dom.option("[all]","-1","ds_schemas"); /* first value */
		OAT.Dom.option("[all]","-1","ds_catalogs");
		for (var p in Filter.distinct_catalogs) { /* other values */
			if (p == ""){ 
				OAT.Dom.option("[no catalog]",p,"ds_catalogs");
			} else {
				OAT.Dom.option(p,p,"ds_catalogs");
			}
		} 
		for (var p in Filter.distinct_schemas) { OAT.Dom.option(p,p,"ds_schemas"); }
		$("ds_schemas").selectedIndex = 0; /* first is selected */
		$("ds_catalogs").selectedIndex = 0;
		Filter.apply(); /* when filter is created, display all tables */
	},
	apply:function() {
		var okArr = [];
		for (var i=0;i<Filter.tables.length;i++) {
			var item = Filter.tables[i];
			var ok = 1;
			var cVal = $v("ds_catalogs");
			var sVal = $v("ds_schemas");
			if (cVal != "-1" && cVal != item[0]) { ok = 0; }
			if (sVal != "-1" && sVal != item[1]) { ok = 0; }
			if (ok) { okArr.push(item); }
		}
		/* sort tables which are ok */
		var compare = function(a,b) {
			var n1 = a[2].toLowerCase();
			var n2 = b[2].toLowerCase();
			if (n1 < n2) { return -1; }
			if (n1 > n2) { return 1; }
			return 0;
		}
		okArr.sort(compare); /* sort by table names */
		/* add them to tree */
		OAT.Dom.clear("ds_tables");
		for (var i=0;i<okArr.length;i++) {
			var item = okArr[i];
			var label = (item[0] != "" ? item[1]+"."+item[2] : item[2]);
			var o = OAT.Dom.option(label,item[2],"ds_tables");
			o.schema = item[1];
			o.catalog = item[0];
		}
	} /* Filter.apply */
}

var IO = {
	filename:"",

	save:function(xml,name) {
		var send_ref = function() { return xml; }
		var recv_ref = function(data) { alert('Saved.'); }
		set_filename(name);
		OAT.Ajax.command(OAT.Ajax.PUT + OAT.Ajax.AUTH_BASIC,name,send_ref,recv_ref,OAT.Ajax.TYPE_TEXT);
	},

	load:function() {
		if ($("options_type_http").checked) {
			var name = OAT.Dav.getFile("/DAV/home/"+OAT.Xmla.user,".xml");
			if (!name) { return; }
			set_filename(name);
			$("corner").innerHTML = name;
			var callback = function(data) { fd.loadXML(data); }
			OAT.Ajax.command(OAT.Ajax.GET + OAT.Ajax.AUTH_BASIC,name,function(){return '';},callback,OAT.Ajax.TYPE_TEXT);
		}
		if ($("options_type_dav").checked) {
			var options = {
				mode:'open_dialog',
				user:OAT.Xmla.user,
				pass:OAT.Xmla.password,
				pathDefault:'/DAV/home/'+OAT.Xmla.user+'/',
				onConfirmClick:function(path,fname,data){
					set_filename(path+fname);
					fd.loadXML(data);
					return true; /* return false will keep browser open */
				}
			};
			OAT.WebDav.open(options);
		}
	},

	preview:function() {
		if (IO.filename == "") { alert("Design not saved yet!"); return; }
		window.open("http://"+window.location.host+IO.filename,"Design preview");
	}
}

var DS = { /* datasources / bindings */
	selectedForm:false,
	
	applyBinding:function() {
		var f = DS.selectedForm;
		var ntype = 0;
		if ($("bind_sql").checked) { ntype = 1; }
		if ($("bind_soap").checked) { ntype = 2; }
		if ($("bind_rest").checked) { ntype = 3; }
		
		if (ntype != f.ds.type) {
			f.fieldBinding.selfFields = [];
			f.fieldBinding.masterFields = [];
			f.fieldBinding.masterForms = [];
			f.ds.type = ntype;
		}
	
		switch (f.ds.type) {
			case 1:
				if ($("bind_sql_query").checked) {
					f.ds.subtype = 1;
					f.ds.query = $v("bind_sql_query_text");
				}
				
				if ($("bind_sql_file").checked) {
					f.ds.subtype = 2;
					f.ds.url = $("bind_sql_file_text").innerHTML;
				}

				if ($("bind_sql_table").checked) {
					f.ds.subtype = 3;
					f.ds.url = $("bind_sql_table_text").innerHTML;
				}
			break;
			case 2:	f.ds.url = $v("bind_soap_wsdl"); break;
			case 3:	
				f.ds.url = $v("bind_rest_url"); 
				f.ds.subtype = $v("bind_rest_type");
				f.ds.xpath = ($v("bind_rest_xpath") == "1" ? 1 : 0);
			break;
		}
		
		f.refresh(function(){fd.selectForm(f);},true);
		DS.selectedForm = false;
	},

	readBinding:function(form) {
		DS.selectedForm = form;
		dialogs.bind.show();
		/* clear old values */
		$("bind_soap_wsdl").value = "";
		$("bind_rest_url").value = "";
		$("bind_sql_query_text").value = "";
		$("bind_sql_table_text").innerHTML = "";
		$("bind_sql_file_text").innerHTML = "";
		$("bind_sql").checked = false;
		$("bind_soap").checked = false;
		$("bind_rest").checked = false;
		$("bind_sql_query").checked = false;
		$("bind_sql_file").checked = false;
		$("bind_sql_table").checked = false;
		
		$("bind_rest_in").value = "";
		$("bind_rest_out").value = "";
		/* read actual values from form */
		switch (form.ds.type) {
			case 0: $("bind_none").checked = true; break;
			case 1: 
				$("bind_sql").checked = true; 
				switch (form.ds.subtype) {
					case 1: /* query */
						$("bind_sql_query").checked = true;
						$("bind_sql_query_text").value = form.ds.query;
					break;

					case 2: /* saved query */
						$("bind_sql_file").checked = true;
						$("bind_sql_file_text").innerHTML = form.ds.url;
						$("bind_sql_query_text").value = form.ds.query;
					break;

					case 3: /* table */
						$("bind_sql_table").checked = true;
						$("bind_sql_table_text").innerHTML = form.ds.url;
					break;
				}
			break;
			case 2: /* wsdl */
				$("bind_soap").checked = true;
				$("bind_soap_wsdl").value = form.ds.url;
			break;
			case 3: /* rest */
				$("bind_rest").checked = true;
				$("bind_rest_url").value = form.ds.url;
				$("bind_rest_in").value = form.inputFields.join(",");
				$("bind_rest_out").value = form.outputFields.join(",");
				$("bind_rest_type").selectedIndex = (form.ds.subtype == 0 ? 0 : 1);
				$("bind_rest_xpath").selectedIndex = form.ds.xpath;
			break;
		}
	},
	
	load:function() {
		var callback = function(f) {
			var qRef = function(data) {
				var queryObj = new OAT.SqlQuery();
				queryObj.fromString(data);
				var q = queryObj.toString(OAT.SqlQueryData.TYPE_SQL);
				$("bind_sql_query_text").value = q;
				$("bind_sql_file").checked = true;
				$("bind_sql").checked = true;
				$("bind_sql_file_text").innerHTML = f;
			}
			OAT.Ajax.command(OAT.Ajax.GET + OAT.Ajax.AUTH_BASIC,f,function(){return '';},qRef,OAT.Ajax.TYPE_TEXT);
		}
		if ($("options_type_http").checked) {
			var name = OAT.getFile("/DAV/home/"+OAT.Xmla.user,".xml");
			if (!name) { return; }
			callback(name);
		}
		if ($("options_type_dav").checked) {
			var options = {
				mode:'open_dialog',
				user:OAT.Xmla.user,
				pass:OAT.Xmla.password,
				pathDefault:'/DAV/home/'+OAT.Xmla.user+'/',
				onConfirmClick:function(path,fname,data) {
					callback(path+fname);
					return true; /* false == keep browser opened */
				}
			};
			OAT.WebDav.open(options);
		}
	},

	save:function() {
		if (IO.filename == "") {
			DS.save_as();
			return;
		}
		var xslStr = '<?xml-stylesheet type="text/xsl" href="'+$v("options_xslt")+'/formview.xsl"?>';
		var xml = fd.toXML(xslStr);
		IO.save(xml,IO.filename);
	},
	
	save_as:function() {
		var xslStr = '<?xml-stylesheet type="text/xsl" href="'+$v("options_xslt")+'/formview.xsl"?>';
		var xml = fd.toXML(xslStr);
		if ($("options_type_http").checked) {
			var name = OAT.Dav.getNewFile("/DAV/home/"+OAT.Ajax.user,".xml","xml");
			if (!name) { return; }
			if (name.slice(name.length-4).toLowerCase() != ".xml") { name += ".xml"; }
			IO.save(xml,name);
		}
		if ($("options_type_dav").checked) {
			var options = {
				mode:'save_dialog',
				user:OAT.Xmla.user,
				pass:OAT.Xmla.password,
				pathDefault:'/DAV/home/'+OAT.Xmla.user+'/',
				file_ext:'xml',
+ 				onConfirmClick:function() {
					set_filename(OAT.WebDav.options.path + OAT.WebDav.options.filename);
					$("corner").innerHTML = OAT.WebDav.options.filename;
					return xml;
				}
			};
			OAT.WebDav.open(options);
		}
	}

}

function init() {
	/* xslt path */
	$("options_xslt").value = OAT.Preferences.xsltPath;

	/* ajax */
	dialogs.ajax = new OAT.Dialog("Please wait","ajax_alert",{width:240,modal:0,zIndex:1001,resize:0});
	dialogs.ajax.ok = dialogs.ajax.hide;
	dialogs.ajax.cancel = dialogs.ajax.hide;
	OAT.Ajax.setCancel(dialogs.ajax.cancelBtn);
	OAT.Ajax.setStart(function() { if ($("options_ajax").checked) {dialogs.ajax.show();} });
	OAT.Ajax.setEnd(dialogs.ajax.hide);

	/* ajax http errors */
	$("options_http").checked = (OAT.Preferences.httpError == 1 ? true : false);
	OAT.Ajax.httpError = OAT.Preferences.httpError;
	OAT.Dom.attach("options_http","change",function(){OAT.Ajax.httpError = ($("options_http").checked ? 1 : 0);});

	/* connection */
	dialogs.connection = new OAT.Dialog("XMLA Data Provider Connection Setup","connection",{width:500,modal:1,buttons:1});
	OAT.Dom.attach("endpoint","blur",Connection.discover_dsn);
	OAT.Dom.attach("dsn","click",function(){if ($("dsn").childNodes.length == 0) { Connection.discover_dsn(); }});
	OAT.Dom.attach("endpoint","keyup",function(e) { if (e.keyCode == 13) { Connection.discover_dsn(); }});
	OAT.Dom.attach("login_put_type","change",function(){if ($("dsn").childNodes.length == 0) { Connection.discover_dsn(); }});
	dialogs.connection.ok = function(){Connection.use_dsn(1);};
	dialogs.connection.cancel = dialogs.connection.hide;
	dialogs.connection.okBtn.setAttribute("disabled","disabled");

	/* options */
	dialogs.options = new OAT.Dialog("Options","options",{width:400,modal:1});
	dialogs.options.ok = dialogs.options.hide;
	dialogs.options.cancel = dialogs.options.hide;

	/* form designer */
	fd = new FormDesigner("form");
	fd.init("formbase");

	/* data bindings */
	dialogs.bind = new OAT.Dialog("Data bindings","bind",{width:600,modal:0});
	dialogs.bind.ok = function() { DS.applyBinding(); dialogs.bind.hide(); }
	dialogs.bind.cancel = dialogs.bind.hide;

	/* table list */
	dialogs.tables = new OAT.Dialog("Pick a table","tables",{width:400,modal:0});
	dialogs.tables.ok = function() {
		var index = $("ds_tables").selectedIndex;
		if (index == -1) {
			alert("You need to select a table!");
			return;
		}
		var opt = $("ds_tables").childNodes[index];
		var catalog = opt.catalog;
		var schema = opt.schema;
		var table = opt.value;
		var fq = (catalog == "" ? table : catalog+"."+schema+"."+table);
		$("bind_sql_table_text").innerHTML = fq;
		$("bind_sql_table").checked = true;
		$("bind_sql").checked = true;
		dialogs.tables.hide();
	}
	dialogs.tables.cancel = dialogs.tables.hide;

	/* links */
	dialogs.services = new OAT.Dialog("Available services","services",{width:400,modal:0});
	OAT.Dom.unlink(dialogs.services.cancelBtn);
	dialogs.services.hide();

	/* table selection */
	OAT.Dom.attach("ds_catalogs","change",Filter.apply);
	OAT.Dom.attach("ds_schemas","change",Filter.apply);

	/* menu */
	var m = new OAT.Menu();
	m.noCloseFilter = "noclose";
	m.createFromUL("menu");
	OAT.Dom.attach("menu_new","click",function(){fd.clear({addNav:true});fd.columns.clear();IO.filename="";});
	OAT.Dom.attach("menu_clear","click",function(){fd.clear({addNav:true});});
	OAT.Dom.attach("menu_load","click",IO.load);
	OAT.Dom.attach("menu_save","click",DS.save);
	OAT.Dom.attach("menu_saveas","click",DS.save_as);
	OAT.Dom.attach("menu_preview","click",IO.preview);
	OAT.Dom.attach("menu_options","click",dialogs.options.show);
	OAT.Dom.attach("menu_about","click",function(){alert('Assembly date: '+OAT.Preferences.version);});
	OAT.Dom.attach("menu_sub","click",function(){fd.addForm({addNav:true});});

	/* binding buttons */
	OAT.Dom.attach("bind_sql_query_btn","click",function() {
		var obj = {};
		obj.user = OAT.Xmla.user;
		obj.password = OAT.Xmla.password;
		obj.dsn = OAT.Xmla.dsn;
		obj.endpoint = OAT.Xmla.endpoint;
		obj.type = ($("options_type_dav").checked ? "dav" : "http");
		obj.query = $v("bind_sql_query_text");
		obj.callback = function(q) { 
			$("bind_sql").checked = true;
			$("bind_sql_query").checked = true;
			$("bind_sql_query_text").value = q;
		}
		var w = window.open("../qbe/index.html");
		w.__inherited = obj;
	});
	OAT.Dom.attach("bind_sql_table_btn","click",dialogs.tables.show);
	OAT.Dom.attach("bind_sql_file_btn","click",DS.load);
	
	/* MS Live clipboard */
	var onRef = function() {}
	var outRef = function() {}
	var genRef = function() { return fd.toXML(); }
	var pasteRef = function(xmlStr){ fd.loadXML(xmlStr); }
	var typeRef = function(){ return "ol_form"; }
	OAT.WebClipBindings.bind("webclip", typeRef, genRef, pasteRef, onRef, outRef);

	/* toolbar */
	tbar = new OAT.Toolbar();
	$("tbar").appendChild(tbar.div);
	tbar.addIcon(1,"images/palette.gif","Control Palette",function(state){if(state){fd.palette.win.show()} else {fd.palette.win.hide();}});
	tbar.addIcon(1,"images/toolbox.gif","Control Properties",function(state){if(state){fd.toolbox.win.show()} else {fd.toolbox.win.hide();}});
	tbar.addIcon(1,"images/columns.gif","Form Columns",function(state){if(state){fd.columns.win.show()} else {fd.columns.win.hide();}});
	for (var i=0;i<3;i++) { tbar.icons[i].toggle(); }

	/* DAV Browser init */
	var options = {
		imagePath:'../images/',
		imageExt:'gif'
	};
	OAT.WebDav.init(options);
	dialogs.connection.show();
}

