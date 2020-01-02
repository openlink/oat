/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2020 OpenLink Software
 *
 *  See LICENSE file for details.
 */
var fd = false;
var dialogs = {};
var tbar = false;
var ds_tab = false;
var http_cred = {
	user:"demo",
	password:"demo"
};

function set_filename(name) {
	$("corner").innerHTML = name.split("/").pop();
	IO.filename = name;
}

function get_v_errors (xmlDoc) { 
    var err_obj = {};
    err_obj.err_code = xmlDoc.getElementsByTagName('Error')[0].getAttribute('ErrorCode');
    err_obj.err_descr = xmlDoc.getElementsByTagName('Error')[0].getAttribute('Description');
    return err_obj;
}

function show_xhr_error (xhr) {
    // handle error responses

    var err_ctr = OAT.Dom.create('div',{className: "error_dlg"});
    var err_title = OAT.Dom.create('h2');
    var err_expln = OAT.Dom.create ('div', {className:"err_expln"});
    var err_toggle_elm = OAT.Dom.create ('div', {className: "toggle"});
    var toggle = new OAT.Toggle(err_toggle_elm,{title: "Details"});
    var err_descr = OAT.Dom.create('div', {className: "err_descr_ctr"});

    OAT.Dom.hide (err_descr);
    OAT.MSG.attach (toggle,
		    "OAT_TOGGLER_STATE_CHANGE",
		    function (s,m,o) { 
			if (o == 0) OAT.Dom.hide(err_descr);
			else OAT.Dom.show(err_descr);
		    });

    if (xhr.obj.status == 500) {
	var e_o = get_v_errors (xhr.obj.responseXML);
	var err_code = e_o.err_code;
	switch (err_code) {
	case "22023": 
	    err_title.innerHTML = "Invalid Credentials";
	    err_expln.innerHTML = "The server did not accept the username or password presented.";
	    break;
	default:
	    err_title.innerHTML = "Error " + e_o.err_code;
	    err_expln.innerHTML = "The server responded with an error."
	    break;
	}
	err_descr.innerHTML = e_o.err_descr;
    }
    else {
	err_code = xhr.obj.status;
	err_title.innerHTML = "HTTP Error " + xhr.obj.status;
	err_expln.innerHTML = 'Server responded with an error.';
	var err_expln = OAT.Dom.create('div',{className: "err_expln"});
    }

    var err_btn_2 = OAT.Dom.create("input",{type:'button',className:'err_dlg_cont_b'});
    err_btn_2.value = "Continue";

    OAT.Dom.append ([err_ctr,err_title,err_expln,err_toggle_elm,err_descr,err_btn_2]);

    var err_dlg = new OAT.Dialog ("Error " + err_code, err_ctr, 
				  { width:400, modal:0, zIndex:1001, resize:0,buttons: false});

    err_btn_2.onclick = function() { OAT.AJAX.endNotify(OAT.Preferences.showAjax); err_dlg.close();}

    err_dlg.show();
}

var xmla_ajax_o = {
    onerror: show_xhr_error
}

var Connection = {
	get_settings:function() {
		/* read relevant settings from inputboxes */
		var conn = fd.datasources[DS.selectedDSindex].connection;
		if (!conn) { conn = new OAT.Connection(OAT.ConnectionData.TYPE_XMLA); }
		OAT.Xmla.connection = conn;
		conn.options.endpoint = $v("bind_sql_endpoint");
		conn.options.dsn = $v("bind_sql_dsn");
		conn.options.user = $v("bind_sql_user");
		conn.options.password = $v("bind_sql_password");
		http_cred.user = conn.options.user;
		http_cred.password = conn.options.password;
	},

	discover_dsn:function() {
		/* discover datasources */
		Connection.get_settings();
		var ref=function(pole) {
			var select = $("bind_sql_dsn");
			OAT.Dom.clear(select);
			for (var i=0;i<pole.length;i++) { OAT.Dom.option(pole[i],pole[i],select); } /* for all rows */
	    OAT.MSG.send (self,"FORMDESIGNER_DSN_DISCOVERED",pole.length);
		} /* callback */

	OAT.Xmla.discover(ref,xmla_ajax_o);
	},

	use_dsn:function() {
		/* discover catalogs */
		Connection.get_settings();
		var ref=function(pole) {
			ask_for_catalogs(pole,1);
		} /* callback */

	OAT.Xmla.dbschema(ref,xmla_ajax_o);

		var qRef = function(q) {
			OAT.SqlQueryData.columnQualifierPre = q[0];
			OAT.SqlQueryData.columnQualifierPost = q[1];
		}
	OAT.Xmla.qualifiers(qRef,xmla_ajax_o);
	}
} /* Connection */

function ask_for_catalogs(pole) {
		Filter.clear();
    var n = pole.length;

    var handle_error = function (xhr) {
	n = 0;
	OAT.AJAX.abortAll();
	OAT.MSG.send (this,"FORMDESIGNER_CATALOG_CALL_FAIL",xhr);
	show_xhr_error(xhr);
    }

    var o = {onerror: handle_error};

		for (var i=0;i<pole.length;i++) {
			var name = pole[i];

	var tbl_cb = function(catalog_name,arr) {
	    read_tables(catalog_name,arr);
	    n--;
	    if (!n) Filter.create();
		}

	OAT.Xmla.tables(name,tbl_cb,o);
	}
}

function read_tables(catalog_name,pole,lastCatalog) {
	/* we have 'pole' of tables in this catalog */
	for (var i=0;i<pole[0].length;i++) {
		var schema = pole[1][i];
		var table = pole[0][i];
		Filter.addTable(catalog_name,schema,table);
	}
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
		var recv_ref = function(data) { alert('Saved.'); }
		set_filename(name);
		var o = {
	    auth:OAT.AJAX.AUTH_DEFAULT,
			user:OAT.WebDav.options.user,
	    password:OAT.WebDav.options.pass,
	    headers:{"Content-Type": "text/xml"}
		}
		OAT.AJAX.PUT(name,xml,recv_ref,o);
	},

	load:function() {
			var options = {
			extensionFilters:[ ["xml","xml","Form Design"] ],
			callback:function(path,fname,data){
					set_filename(path+fname);
					fd.fromXML(data);
					return true; /* return false will keep browser open */
				}
			};
		OAT.WebDav.openDialog(options);
	},

	preview:function() {
		if (IO.filename == "") { alert("Design not saved yet!"); return; }
		var proto = window.location.href.match(/^(http[s]?:\/\/)/)[1];
		var newloc = proto+window.location.host+IO.filename;
		window.open(newloc);
	}
}

var DS = { /* datasources / bindings */
	selectedDSindex:-1,
	
	showList:function() {
		/* draw table of current datasources */
		OAT.Dom.clear("dslist_tbody");
		
		function create_row(index) {
			var ds = fd.datasources[index];
			var tr = OAT.Dom.create("tr");
			/* name */
			var td = OAT.Dom.create("td");
			var inp = OAT.Dom.create("input");
			inp.type = "text";
			inp.size = 20;
			inp.value = ds.name;
			td.appendChild(inp);
			tr.appendChild(td);
			OAT.Bindings.bindString(inp,ds,"name");
			/* type */
			var td = OAT.Dom.create("td");
			var n = OAT.Dom.create("span");
			n.innerHTML = ds.typeToString() + " ";
			var inp = OAT.Dom.create("input");
			inp.type = "button";
			inp.value = "Edit";
			td.appendChild(n);
			td.appendChild(inp);
			tr.appendChild(td);
	    OAT.Event.attach(inp,"click",function(){DS.readBinding(index);});

			/* dependencies */
			var td = OAT.Dom.create("td");
			var inp = OAT.Dom.create("input");
			inp.type = "button";
			inp.value = "View & Edit";
			td.appendChild(inp);
			tr.appendChild(td);
	    OAT.Event.attach(inp,"click",function(){DS.showDependencies(index);});

			/* remove */
			var td = OAT.Dom.create("td");
			var inp = OAT.Dom.create("input");
			inp.type = "button";
			inp.value = "Remove";
			td.appendChild(inp);
			tr.appendChild(td);
	    OAT.Event.attach(inp,"click",function(){
				fd.datasources.splice(index,1);
				/* now fix all controls bound to this datasource */
				for (var i=0;i<fd.objects.length;i++) {
					var o = fd.objects[i];
					for (var j=0;j<o.datasources.length;j++) if (o.datasources[j].ds == ds) {
						if (j > 0 || o.datasources.length > 1) {
							o.datasources.splice(j,1);
						} else { o.datasources[0].ds = false; }
					} /* all datasources */
				} /* all objects*/
				DS.showList();
			});
			
			$("dslist_tbody").appendChild(tr);
		}
		
		for (var i=0;i<fd.datasources.length;i++) {
			create_row(i);
		}
	dialogs.dslist.open();
	},

	applyBinding:function() {
		var ds = fd.datasources[DS.selectedDSindex];
		var ntype = OAT.DataSourceData.TYPE_NONE;
		switch (ds_tab.selectedIndex) {
			case 0:
				switch (parseInt($v("bind_generic_type"))) {
					case 0: ntype = OAT.DataSourceData.TYPE_SQL; break;
					case 1: ntype = OAT.DataSourceData.TYPE_SPARQL; break;
					case 2: ntype = OAT.DataSourceData.TYPE_GDATA; break;
				} /* switch */
			break;
			case 1:
				switch (parseInt($v("bind_ws_type"))) {
					case 0: ntype = OAT.DataSourceData.TYPE_REST; break;
					case 1: ntype = OAT.DataSourceData.TYPE_SOAP; break;
				} /* switch */
			break;
		}

		/* trick - if no type is selected, scan for a filled field: user may have forgotten to use appropriate radio button */
		if (ntype == 0) {
			if ($v("bind_rest_url") != "") { ntype = OAT.DataSourceData.TYPE_REST; }
			if ($v("bind_soap_wsdl") != "") { ntype = OAT.DataSourceData.TYPE_SOAP; }
			if ($v("bind_sparql_url") != "") { ntype = OAT.DataSourceData.TYPE_SPARQL; }
			if ($v("bind_gdata_url") != "") { ntype = OAT.DataSourceData.TYPE_GDATA; }
			if ($v("bind_sql_query_text") != "") { ntype = OAT.DataSourceData.TYPE_SQL; }
			if ($("bind_sql_table_text").innerHTML != "") { ntype = OAT.DataSourceData.TYPE_SQL; }
		}

		if (ntype != ds.type) {
			ds2 = new OAT.DataSource(ntype);
			ds2.name = ds.name;
			fd.datasources[DS.selectedDSindex] = ds2;
			ds = ds2;
			if (ntype == OAT.DataSourceData.TYPE_SQL) { ds.connection = OAT.Xmla.connection; }
		}

		switch (ds.type) {
			case OAT.DataSourceData.TYPE_SQL:
				ds.options.cursortype = $("bind_sql_type").selectedIndex;
				ds.options.limit = parseInt($v("bind_sql_limit"));
				ds.pageSize = ds.options.limit
				var opts = ds.connection.options;
				
	    if ($("bind_sql_qry_or_table").value == '0') {
					ds.options.table = "";
					ds.options.query = $v("bind_sql_query_text");
	    } else {
					ds.options.table = $("bind_sql_table_text").innerHTML;
				}

			break;
			case OAT.DataSourceData.TYPE_SOAP:	ds.connection.options.url = $v("bind_soap_wsdl"); break;
			case OAT.DataSourceData.TYPE_REST:	
				ds.connection.options.url = $v("bind_rest_url"); 
				ds.options.output = $v("bind_rest_type");
				ds.options.xpath = ($v("bind_rest_xpath") == "1" ? 1 : 0);
			break;
			case OAT.DataSourceData.TYPE_SPARQL:
				ds.connection.options.url = $v("bind_sparql_url");
				ds.options.query = $v("bind_sparql_query");
			break;
			case OAT.DataSourceData.TYPE_GDATA:
				ds.connection.options.url = $v("bind_gdata_url");
				ds.options.query = $v("bind_gdata_query");
			break;
		} /* switch */
		ds.refresh(function(){fd.selectForm();DS.showList();},true,fd.datasources);
		DS.selectedDSindex = -1;
	},

	readBinding:function(index) {
		DS.selectedDSindex = index;
		var ds = fd.datasources[index];
		/* clear old values */
		OAT.Dom.show("bind_sql","bind_sparql","bind_gdata","bind_rest","bind_soap");

		$("bind_soap_wsdl").value = "";
		$("bind_rest_url").value = "";
		$("bind_sql_query_text").value = "";
		$("bind_sql_table_text").innerHTML = "";
		$("bind_sql_file_text").innerHTML = "";
		$("bind_sparql_query").value = "";
		$("bind_sparql_url").value = "";
		$("bind_sparql_file_text").innerHTML = "";
		$("bind_gdata_query").value = "";
		$("bind_gdata_url").value = "";
		$("bind_sql_query").checked = false;
		$("bind_sql_file").checked = false;
		$("bind_sql_table").checked = false;
		
	OAT.Dom.hide("bind_sql","bind_sparql","bind_gdata",/*"bind_geoloc",*/"bind_rest","bind_soap");

		$("bind_rest_in").value = "";
		$("bind_rest_out").value = "";
		
		/* read actual values from datasource */
		switch (ds.type) {
			case OAT.DataSourceData.TYPE_NONE: ds_tab.go(0); break;
			case OAT.DataSourceData.TYPE_SQL: 
				ds_tab.go(0);
				var opts = ds.connection.options;
				OAT.Dom.show("bind_sql");
	    $("bind_generic_type").selectedIndex = 0;
				$("bind_sql_type").selectedIndex = ds.options.cursortype;
				$("bind_sql_limit").value = ds.options.limit;
				$("bind_sql_user").value = opts.user;
				$("bind_sql_password").value = opts.password;
				$("bind_sql_endpoint").value = opts.endpoint;
				var dsn = $("bind_sql_dsn");
				OAT.Dom.clear(dsn);
				OAT.Dom.option(opts.dsn,opts.dsn,dsn);
				if (ds.options.table) {
					/* table */
					$("bind_sql_table").checked = true;
					$("bind_sql_table_text").innerHTML = ds.options.table;
				} else {
					/* query */
					$("bind_sql_query").checked = true;
					$("bind_sql_query_text").value = ds.options.query;
				}
			break;
			case OAT.DataSourceData.TYPE_SOAP: /* wsdl */
				ds_tab.go(1);
				OAT.Dom.show("bind_soap");
				$("bind_soap_wsdl").value = ds.connection.options.url;
			break;
			case OAT.DataSourceData.TYPE_REST: /* rest */
				ds_tab.go(1);
				OAT.Dom.show("bind_rest");
				$("bind_rest_url").value = ds.connection.options.url;
				$("bind_rest_in").value = ds.inputFields.join(",");
				$("bind_rest_out").value = ds.outputFields.join(",");
				$("bind_rest_type").selectedIndex = (ds.options.output == 0 ? 0 : 1);
				$("bind_rest_xpath").selectedIndex = ds.options.xpath;
			break;
			case OAT.DataSourceData.TYPE_SPARQL:
				ds_tab.go(0);
				OAT.Dom.show("bind_sparql");
				$("bind_sparql_query").value = ds.options.query;
				$("bind_sparql_url").value = ds.connection.options.url;
	    $("bind_generic_type").selectedIndex = 1;
			break;
			case OAT.DataSourceData.TYPE_GDATA:
				ds_tab.go(0);
				OAT.Dom.show("bind_gdata");
				$("bind_gdata_query").value = ds.options.query;
				$("bind_gdata_url").value = ds.connection.options.url;
	    $("bind_generic_type").selectedIndex = 2;
			break;
/*	case OAT.DataSourceData.TYPE_GEOLOC:
	    ds_tab.go(0);
	    OAT.Dom.show("bind_geoloc");
	    $("bind_geoloc_timeout").value = ds.options.timeout;
	    if (ds.options.high_accuracy) $("bind_geoloc_highacc").checked=true;
	    if (ds.options.track) $("bind_geoloc_track").checked=true;
	    break; */
		} /* switch */

	switch (ds.type) {
	case OAT.DataSourceData.TYPE_SOAP:
	case OAT.DataSourceData.TYPE_RES:
        case OAT.DataSourceData.TYPE_NONE:
			$("bind_generic_type").selectedIndex = 0;
			OAT.Dom.show("bind_sql");
	    break
	case OAT.DataSourceData.SPARQL:
	    $("bind_generic_type").selectedIndex = 1;
	    OAT.Dom.show("bind_sparql");
	    break;
		}

		if (ds.type != OAT.DataSourceData.TYPE_SOAP && ds.type != OAT.DataSourceData.TYPE_REST) {
			$("bind_ws_type").selectedIndex = 0;
			OAT.Dom.show("bind_rest");
		}

	dialogs.bind.open();
	},
	
	showDependencies:function(dsIndex) {
		var ds = fd.datasources[dsIndex];
		DS.selectedDSindex = dsIndex;
	dialogs.dsdepends.open();
		OAT.Dom.clear("depends_tbody");
		OAT.Dom.clear("depends_count");
		
		$("depends_name").innerHTML = ds.name;
		
		/* count of dependencies */
		for (var i=0;i<=ds.inputFields.length;i++) {
			OAT.Dom.option(i,i,"depends_count");
			if (i == ds.fieldBinding.selfFields.length) { $("depends_count").selectedIndex = i; }
		}

		/* actual field bindings */
		var fb = ds.fieldBinding;
		function createFieldPair(index) {
			/* first part - list of own input fields */
			var s = OAT.Dom.create("select");
			for (var i=0;i<ds.inputFields.length;i++) {
				OAT.Dom.option(ds.inputFields[i],i,s);
				if (fb.selfFields[index] == i) { s.selectedIndex = i; }
			}
	    OAT.Event.attach(s,"change",function(){fb.selfFields[index] = parseInt($v(s));});
			
			/* second part - list of available other fields, direct input or parametrized values */
			var div = OAT.Dom.create("div");
			
			/* 1.direct value */
			var d1 = OAT.Dom.create("div");
			var r1 = OAT.Dom.create("input");
			var l = OAT.Dom.create("span");
			l.innerHTML = " has an exact value of ";
			r1.type = "radio";
			r1.name = "radio_"+index;
			var inp = OAT.Dom.create("input"); 
			inp.type = "text";
			inp.size = 40;
			if (fb.types[index] == 0) { 
				r1.checked = true;
				inp.value = fb.masterFields[index]; 
			}
	    OAT.Event.attach(inp,"keyup",function(){
				if (!r1.checked) { return; }
				fb.masterFields[index] = inp.__value ? inp.__value : $v(inp);
			});
	    OAT.Event.attach(r1,"change",function(){
				fb.masterDSs[index] = false;
				fb.masterFields[index] = inp.__value ? inp.__value : $v(inp);
				fb.types[index] = 0;
			});
			var enl = OAT.Dom.create("a");
			enl.innerHTML = "enlarge input box";
			enl.href = "#";
	    OAT.Event.attach(enl,"click",function(){
		OAT.MSG.attach(dialogs.enl, "DIALOG_OK", function() { 
					inp.value = $v("enl_textarea"); 
					inp.__value = $v("enl_textarea");
					if (!r1.checked) { return; }
					fb.masterFields[index] = inp.__value;
		});
				$("enl_textarea").value = inp.__value ? inp.__value : $v(inp);
		dialogs.enl.open();
			});
			
			d1.appendChild(r1);
			d1.appendChild(l);
			d1.appendChild(inp);
			d1.appendChild(OAT.Dom.text(" "));
			d1.appendChild(enl);
			
			/* 2.pick a column */
			var d2 = OAT.Dom.create("div");
			var r2 = OAT.Dom.create("input");
			var l = OAT.Dom.create("span");
			l.innerHTML = " should inherit its value from ";
			r2.type = "radio";
			r2.name = "radio_"+index;
			var sel_ds = false;
			var sel_index = false;
			if (fb.types[index] == 1) { 
				r2.checked = true; 
				sel_ds = fb.masterDSs[index];
				sel_index = fb.masterFields[index];
			}
			var sel2 = fd.createDSSelect(sel_ds,sel_index);
			var changeRef = function() {
				r2.checked = true;
				var o = sel2.getElementsByTagName("option")[sel2.selectedIndex];
				fb.masterDSs[index] = o.masterDS;
				fb.masterFields[index] = o.masterField;
				fb.types[index] = 1;
			}
	    OAT.Event.attach(r2,"change",changeRef);
	    OAT.Event.attach(sel2,"change",changeRef);
			d2.appendChild(r2);
			d2.appendChild(l);
			d2.appendChild(sel2);
			
			/* 3.parameter */
			var d3 = OAT.Dom.create("div");
			var r3 = OAT.Dom.create("input");
			r3.type = "radio";
			r3.name = "radio_"+index;
			var text = OAT.Dom.create("span"); 
			text.innerHTML = " should be prompted for at materialization time";
			if (fb.types[index] == 2) { 
				r3.checked = true;
			}
	    OAT.Event.attach(r3,"change",function(){
				fb.masterDSs[index] = false;
				fb.masterFields[index] = -1;
				fb.types[index] = 2;
			});
			d3.appendChild(r3);
			d3.appendChild(text);
			
			/* 4.user input */
			var d4 = OAT.Dom.create("div");
			var r4 = OAT.Dom.create("input");
			r4.type = "radio";
			r4.name = "radio_"+index;
			var text = OAT.Dom.create("span"); 
			text.innerHTML = " should read its value from User input control ";
			if (fb.types[index] == 3) { 
				r4.checked = true;
			}
			var sel4 = OAT.Dom.create("select");
			for (var i=0;i<fd.objects.length;i++) {
				var ui = fd.objects[i];
				if (ui.name == "uinput") { 
					var opt = OAT.Dom.option(ui.properties[0].value,-1,sel4); 
					opt.ui = ui;
				}
				if (fb.masterDSs[index] == ui) { sel4.selectedIndex = sel4.childNodes.length-1; }
			}
			var changeRef = function() {
				r4.checked = true;
				fb.masterDSs[index] = sel4.childNodes[sel4.selectedIndex].ui;
				fb.masterFields[index] = -1;
				fb.types[index] = 3;
			}
	    OAT.Event.attach(r4,"change",changeRef);
	    OAT.Event.attach(sel4,"change",changeRef);
			d4.appendChild(r4);
			d4.appendChild(text);
			d4.appendChild(sel4);
			
			div.appendChild(d1);
			div.appendChild(d2);
			div.appendChild(d3);
			div.appendChild(d4);
			
			var first = OAT.Dom.create("div");
			first.innerHTML = "This field: ";
			first.appendChild(s);
			return [first,div];
		}
			
		for (var i=0;i<fb.selfFields.length;i++) {
			var pair = createFieldPair(i);
			var tr = OAT.Dom.create("tr");
			var td = OAT.Dom.create("td");
			td.appendChild(pair[0]);
			tr.appendChild(td);
			var td = OAT.Dom.create("td");
			td.appendChild(pair[1]);
			tr.appendChild(td);
			$("depends_tbody").appendChild(tr);
		}
	},
	
	load:function(type) {
		var options = {
			callback:function(path,fname,data) {
				switch (type) {
					case OAT.DataSourceData.TYPE_SQL: /* sql */
						var queryObj = new OAT.SqlQuery();
						queryObj.fromString(data);
						var q = queryObj.toString(OAT.SqlQueryData.TYPE_SQL);
						$("bind_sql_query_text").value = q;
						$("bind_sql_query").checked = true;
					break;
					case OAT.DataSourceData.TYPE_SPARQL: /* sparql */
						$("bind_sparql_query").value = data;
					break;
				}
					return true; /* false == keep browser opened */
				}
			};
		OAT.WebDav.openDialog(options);
	},

	save:function() {
		if (IO.filename == "") {
			DS.save_as();
			return;
		}
		var xslStr = '<?xml-stylesheet type="text/xsl" href="'+$v("options_xslt")+'formview.xsl"?>';
		var xml = fd.toXML(xslStr);
		IO.save(xml,IO.filename);
	},
	
	save_as:function() {
		var xslStr = '<?xml-stylesheet type="text/xsl" href="'+$v("options_xslt")+'formview.xsl"?>';
		var xml = fd.toXML(xslStr);
			var options = {
	    extensionFilters:[ ["xml","xml", "Form Design", "text/xml"] ],
 			dataCallback:function() { 
					return xml;
				},
			callback:function(path,name) {
					set_filename(path+name);
				}
			};
		OAT.WebDav.saveDialog(options);
	}

}

function init() {
	/* xslt path */
	$("options_xslt").value = OAT.Preferences.xsltPath;
	$("bind_sql_endpoint").value = OAT.Preferences.endpointXmla;

    /* version info */
    $("about_oat").innerHTML = "OAT version: " + OAT.Preferences.version + ' build ' + OAT.Preferences.build;
    
	/* ajax http errors */
	$("options_http").checked = (OAT.Preferences.httpError == 1 ? true : false);

    OAT.AJAX.httpError = false;

    OAT.Event.attach("options_http","change",function(){OAT.AJAX.httpError = ($("options_http").checked ? 1 : 0);});

	/* connection */

    OAT.MSG.attach ("*","FORMDESIGNER_DSN_DISCOVERED",function (obj,msg,val) { 
	if (val > 0) {
	    OAT.Dom.show ("bind_sql_dsn");
	}
	else {
	    OAT.Dom.hide ("bind_sql_dsn");
	}
    });


    OAT.Event.attach("bind_sql_endpoint","blur",Connection.discover_dsn);
    OAT.Event.attach("bind_sql_xmla","click",Connection.discover_dsn);

    OAT.Event.attach("bind_sql_dsn","click",function(){if ($("bind_sql_dsn").childNodes.length == 0) { Connection.discover_dsn(); }});
    OAT.Event.attach("bind_sql_endpoint","keyup",function(e) { if (e.keyCode == 13) { Connection.discover_dsn(); }});

    OAT.Event.attach("bind_sql_user","blur",Connection.get_settings);
    OAT.Event.attach("bind_sql_password","blur",Connection.get_settings);

    OAT.Event.attach("bind_sql_qry_or_table","change",
		     function() { 
			 if ($('bind_sql_qry_or_table').value=="1") {
			Connection.use_dsn();
			     OAT.Dom.hide ('bind_sql_query_ctr');
			     OAT.Dom.show ('bind_tables_ctr');
			 }
			 else {
			     OAT.Dom.hide ('bind_tables_ctr');
			     OAT.Dom.show ('bind_sql_query_ctr');
		}
	});

    OAT.MSG.attach ("*","FORMDESIGNER_CATALOG_CALL_FAIL",
		    function () { 
			$('bind_sql_qry_or_table').selectedIndex = 0; 
			OAT.Dom.hide ('bind_tables_ctr');
			OAT.Dom.show ('bind_sql_query_ctr')});

    OAT.MSG.attach ("*","FORMDESIGNER_CATALOG_RECEIVED",function () { });

	/* options */
	dialogs.options = new OAT.Dialog("Options","options",{width:400,modal:1});

	/* form designer */
	fd = new FormDesigner("form");
	fd.init("formbase");

	/* data bindings */
	dialogs.dslist = new OAT.Dialog("List of datasources","dslist",{width:600,modal:0});
//	OAT.Dom.unlink(dialogs.dslist.cancelBtn);

	/* ds type */
	dialogs.bind = new OAT.Dialog("Datasource type","bind",{width:600,height:0,modal:0,autoEnter:0});
	$("bind").style.overflow = "auto";
    OAT.MSG.attach(dialogs.bind, "DIALOG_OK", DS.applyBinding);
	ds_tab = new OAT.Tab("bind_content");

	ds_tab.add("bind_tab_generic","bind_content_generic");
	ds_tab.add("bind_tab_ws","bind_content_ws");

	/* data dependencies */
	dialogs.dsdepends = new OAT.Dialog("Datasource dependencies","dsdepends",{width:700,modal:0});
//	OAT.Dom.unlink(dialogs.dsdepends.cancelBtn);
	
	/* enlarged input */
	dialogs.enl = new OAT.Dialog("Enter value","enl",{modal:1,width:700,autoEnter:0});

	/* table list */
	dialogs.tables = new OAT.Dialog("Pick a table","tables",{width:400,modal:0});

    OAT.MSG.attach(dialogs.tables, "DIALOG_OK", function() {
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
    });

	/* services */
	dialogs.services = new OAT.Dialog("Available services","services",{width:400,modal:0});
//	OAT.Dom.unlink(dialogs.services.cancelBtn);
    dialogs.services.close();
	
	/* table selection */
    OAT.Event.attach("ds_catalogs","change",Filter.apply);
    OAT.Event.attach("ds_schemas","change",Filter.apply);

	/* menu */
	var m = new OAT.Menu();
	m.noCloseFilter = "noclose";
	m.createFromUL("menu");
    OAT.Event.attach("menu_new","click",function(){fd.clear({addNav:true});fd.columns.clear();IO.filename="";});
    OAT.Event.attach("menu_clear","click",function(){fd.clear({addNav:true});});
    OAT.Event.attach("menu_load","click",IO.load);
    OAT.Event.attach("menu_save","click",DS.save);
    OAT.Event.attach("menu_saveas","click",DS.save_as);
    OAT.Event.attach("menu_preview","click",IO.preview);
    OAT.Event.attach("menu_options","click",dialogs.options.open);
    OAT.Event.attach("menu_about","click",function() { alert('OAT version: ' + OAT.Preferences.version + ' build: '+OAT.Preferences.build);});
    OAT.Event.attach("menu_ds","click",DS.showList);
	
	/* dependency count */
    OAT.Event.attach("depends_count","change",function() {
		var fb = fd.datasources[DS.selectedDSindex].fieldBinding;
		var oldLen = fb.selfFields.length;
		var newLen = parseInt($v("depends_count"));
		fb.selfFields.length = newLen; 
		fb.masterDSs.length = newLen; 
		fb.masterFields.length = newLen; 
		fb.types.length = newLen; 
		for (var j=0;j<newLen;j++) {
			if (j >= oldLen) { 
				fb.selfFields[j] = 0;
				fb.masterDSs[j] = false;
				fb.masterFields[j] = "";
				fb.types[j] = 0;
			}
		}
		DS.showDependencies(DS.selectedDSindex);
	});

    
	/* new datasource */
    
    
    function new_ds () {
		var ds = new OAT.DataSource(0);
	ds.name = 'new datasource';
		fd.datasources.push(ds);
		DS.showList();
    }
    
    
    OAT.Event.attach("ds_new","click",new_ds);
    OAT.MSG.attach ("*","FORMDESIGNER_NEW_DS", new_ds);

	/* switch generic query services */
    OAT.Event.attach("bind_generic_type","change",function() {
		OAT.Dom.hide("bind_sql","bind_sparql","bind_gdata");
		var v = parseInt($v("bind_generic_type"));
		if (v == 0) { OAT.Dom.show("bind_sql"); }
		if (v == 1) { OAT.Dom.show("bind_sparql"); }
		if (v == 2) { OAT.Dom.show("bind_gdata"); }
	});
	
	/* switch web services */
    OAT.Event.attach("bind_ws_type","change",function() {
		OAT.Dom.hide("bind_rest","bind_soap");
		var v = parseInt($v("bind_ws_type"));
		if (v == 0) { OAT.Dom.show("bind_rest"); }
		if (v == 1) { OAT.Dom.show("bind_soap"); }
	});

	/* binding buttons */
    OAT.Event.attach("bind_sql_query_btn","click",function() {
		var conn = fd.datasources[DS.selectedDSindex].connection;
	if (!conn) { 
	    conn = OAT.Xmla.connection; 
	}
		var obj = {};
		obj.user = conn.options.user;
		obj.password = conn.options.password;
		obj.dsn = conn.options.dsn;
		obj.endpoint = conn.options.endpoint;
		obj.type = (OAT.WebDav.options.isDav)? "dav" : "http";
		obj.query = $v("bind_sql_query_text");
		obj.callback = function(q) { 
			$("bind_sql_query").checked = true;
			$("bind_sql_query_text").value = q;
		}
		var w = window.open("../qbe/index.html");
		w.__inherited = obj;
	});

    OAT.Event.attach("bind_sparql_query_btn","click",function() {
		var obj = {};
		obj.username = http_cred.user;
		obj.password = http_cred.password;
		obj.login_put_type = (OAT.WebDav.options.isDav)? "dav" : "http";
		obj.endpoint = $v("bind_sparql_url");
		obj.query = $v("bind_sparql_query");
		obj.callback = function(q) { 
			$("bind_sparql_query").value = q;
		}
		var w = window.open("/isparql/");
		w.__inherited = obj;
	});

    OAT.Event.attach("bind_sql_table_btn","click",dialogs.tables.open);
    OAT.Event.attach("bind_sql_file_btn","click",function(){DS.load(OAT.DataSourceData.TYPE_SQL);});
    OAT.Event.attach("bind_sparql_file_btn","click",function(){DS.load(OAT.DataSourceData.TYPE_SPARQL);});
	
	/* MS Live clipboard */
	var onRef = function() {}
	var outRef = function() {}
	var genRef = function() { return fd.toXML(); }
	var pasteRef = function(xmlStr){ fd.fromXML(xmlStr); }
	var typeRef = function(){ return "ol_form"; }
	OAT.WebClipBindings.bind("webclip", typeRef, genRef, pasteRef, onRef, outRef);

	/* toolbar */
    
	tbar = new OAT.Toolbar("tbar");
    tbar.addIcon(1,"images/colorize.png","Control Palette",
		 function (state) {
		     if(state){fd.palette.win.open();OAT.Dom.show ("check_0");} 
		     else {fd.palette.win.close();OAT.Dom.hide("check_0");}
		 });
    tbar.addIcon(1,"images/view_detailed.png","Inspector",
		 function(state){
		     if(state){fd.toolbox.win.open();OAT.Dom.show ("check_1");} 
		     else {fd.toolbox.win.close();OAT.Dom.hide("check_1");}
		 });
    tbar.addIcon(1,"images/raid.png","Datasource",
		 function(state){
		     if(state){fd.columns.win.open();OAT.Dom.show ("check_2");} 
		     else {fd.columns.win.close();OAT.Dom.hide("check_2");}
		 });
	for (var i=0;i<3;i++) { tbar.icons[i].toggle(); }

    OAT.Event.attach("menu_view_palette","click",function (){tbar.icons[0].toggle();});
    OAT.Event.attach("menu_view_inspector","click",function (){tbar.icons[1].toggle();});
    OAT.Event.attach("menu_view_datasources","click",function (){tbar.icons[2].toggle();});
    
	/* DAV Browser init */
	var options = {
	imagePath:OAT.Preferences.imagePath,
	imageExt:'png',
	silentStart: false
	};
	OAT.WebDav.init(options);

//    OAT.Resize.createDefault($("bind_sparql_query_container"));
//    OAT.Resize.createDefault($("bind_sql_query_container"));
	
    OAT.Event.attach("bind_sql_query_text","keyup",function(){
		$("bind_sql_query").checked = true;
		$("bind_gq").checked = true;
	});

	OAT.Dom.unlink("throbber");
	var h = $("hidden");
	while (h.firstChild) { document.body.appendChild(h.firstChild); }
	OAT.Dom.unlink(h);
}

