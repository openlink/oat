/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
function xmla_init() {
	dialogs.xmla = new OAT.Dialog("Table import","xmla",{width:700,modal:1});
	dialogs.xmla.ok = xmla_tables;
	dialogs.xmla.cancel = dialogs.xmla.hide;
	OAT.Dom.attach("xmla_usecatalog","click",xmla_catalogs);

	var resize = OAT.Dom.create("div",{width:"10px",height:"10px",position:"absolute",right:"-5px",bottom:"-5px",cursor:"nw-resize"});
	OAT.Resize.create(resize,"xmla_table_container",OAT.Resize.TYPE_X);
	$("xmla_table_container").appendChild(resize);

	var state = 1;
	var toggleRef = function() {
		var d = $("xmla_detailsbtn");
		if (state) {
			state = 0;
			d.innerHTML = "show";
			OAT.Dom.hide("xmla_details");
		} else {
			state = 1;
			d.innerHTML = "hide";
			OAT.Dom.show("xmla_details");
		}
	}
	OAT.Dom.attach("xmla_detailsbtn","click",toggleRef);
	toggleRef();
}

function xmla_try_relation(pk,fk) {
	/* 
		there is a relation between {pk} and {fk}
		can we mark that in our design?
	*/
	var t1=false;
	var t2=false;
	for (var i=0;i<table_array.length;i++) {
		var table = table_array[i];
		if (pk.catalog == table.catalog && pk.schema == table.schema && pk.table == table.name) {
			t1 = table_array[i];
		} /* if table == q1 */
		if (fk.catalog == table.catalog && fk.schema == table.schema && fk.table == table.name) {
			t2 = table_array[i];
		} /* if table == q2 */
	} /* for all tables */
	if (t1 && t2) {
		for (var i=0;i<t1.rows.length;i++) {
			if (t1.rows[i]._title.innerHTML == pk.column) {
				var r1 = t1.rows[i];
			}
		}
		for (var i=0;i<t2.rows.length;i++) {
			if (t2.rows[i]._title.innerHTML == fk.column) {
				var r2 = t2.rows[i];
			}
		}
		var hope = 1;
		for (var i=0;i<relation_array.length;i++) {
			var rel = relation_array[i];
			if (rel.row_1 == r1 && rel.row_2 == r2) { hope = 0; }
		}
		if (hope) {
			add_relation(r1,"1",r2,"&infin;");
			r2.setFK();
		}
	}
}

function qualifier(table) {
	/* create a qualified name */
	var nq = (table.catalog == "" ? table.name : table.catalog + "." + table.schema + "." + table.name);
	return OAT.SqlQueryData.qualifyMulti(nq);
}

function xmla_ask_for_keys(table) {
	/* get pk and fk info about a table */
	var callback_fk = function(pole) {
		for (var i=0;i<pole.length;i++) {
			xmla_try_relation(pole[i][0],pole[i][1]);
		}
	} /* received fk response */
	
	var callback_pk = function(pole) {
		if (pole.length) for (var i=0;i<pole.length;i++) {
			for (var j=0;j<table.rows.length;j++) {
				if (table.rows[j] && table.rows[j]._title.innerHTML == pole[i]) {
					table.rows[j].setPK();
				} /* correct row! */
			} /* for all rows */
		} /* if has pk */
	} /* callback */
	
	OAT.Xmla.primaryKeys(table.catalog,table.schema,table.name,callback_pk);
	OAT.Xmla.foreignKeys(table.catalog,table.schema,table.name,callback_fk);
}

function xmla_one_table(table_name,schema_name,catalog_name) {
	/* read one table via xml/a */
	var table = false;
	for (var i=0;i<table_array.length;i++)  {
		if (table_array[i]._title.innerHTML == table_name) { table = table_array[i]; }
	}
	if (table) {
		while (table.rows.length) { table.removeRow(table.rows[0]); }
	} else {
		var table = add_table(20,120,table_name);
		table.name = table_name;
		table.schema = schema_name;
		table.catalog = catalog_name;
	}
	var ref = function(pole) {
		/* list of columns */
		if (!pole.length) return;
		for (var i=0;i<pole.length;i++) {
			var name = pole[i]["name"];
			var type = pole[i]["type"];
			var nn = pole[i]["nn"];
			var def = pole[i]["def"];
			var spec = pole[i]["spec"];
			var row = table.addRow(name,parseInt(type));
			if (nn == "0" || nn=="-1") row.setNN();
			row.setSpec(spec);
			row.setDef(def);
		} /* for all columns */
		if ($("xmla_reposition").checked) { reposition_tables(); }
		xmla_ask_for_keys(table);
	} /* callback */
	OAT.Xmla.columns(table.catalog,table.schema,table.name,ref);
}

function xmla_tables() {
	/* add all tables to design */
	dialogs.xmla.hide();
	var tables = [];
	var opts = $("xmla_table").getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) { /* get all marked catalogs */
		if (opts[i].selected) {
			var opt = opts[i];
			tables.push([opt.value,opt.schema,opt.catalog]);
		}
	}

	for (var i=0;i<tables.length;i++) {
		t = tables[i];
		xmla_one_table(t[0],t[1],t[2]);
	} /* for all selected tables */
}


function xmla_catalogs() {
	/* add all tables from selected catalogs into table <select> */
	xmla_settings();

	var catalogs = [];
	var opts = $("xmla_catalog").getElementsByTagName("option");
	for (var i=0;i<opts.length;i++) { /* get all marked catalogs */
		if (opts[i].selected) catalogs.push(opts[i].value);
	}

	var ref = function(catalog,pole) {
		/* list of tables */
		if (!pole[0].length) return;
		var select = $("xmla_table");

		for (var i=0;i<pole[0].length;i++) {
			var name = pole[0][i];
			var schema = pole[1][i];
			var e = OAT.Dom.create("option");
			e.innerHTML= (catalog == "" ? name : catalog+"."+schema+"."+name);
			e.value=name;
			e.catalog=catalog;
			e.schema=schema;
			select.appendChild(e);
		} /* for all received tables */
	} /* callback */
	OAT.Dom.clear("xmla_table");
	for (var i=0;i<catalogs.length;i++) { OAT.Xmla.tables(catalogs[i],ref); }
}
	
	
function xmla_dbschema() {
	dialogs.connection.hide();
	xmla_settings();
	var ref = function(pole) {
		/* list of catalogs */
		var select = $("xmla_catalog");
		OAT.Dom.clear(select);
		for (var i=0;i<pole.length;i++) { OAT.Dom.option(pole[i],pole[i],select); }
		if (!pole.length) { OAT.Dom.option("[no catalog]","",select); }
	}
	OAT.Xmla.dbschema(ref);
	var qRef = function(q) {
		OAT.SqlQueryData.columnQualifierPre = q[0];
		OAT.SqlQueryData.columnQualifierPost = q[1];
		$("xmla_q1").innerHTML = q[0];
		$("xmla_q2").innerHTML = q[1];
	}
	OAT.Xmla.qualifiers(qRef);
	var typeRef = function(types) {
		create_data_types(types);
	}
	OAT.Xmla.providerTypes(typeRef);
}

function xmla_discover() {
	xmla_settings();
	var ref = function(pole) {
		/* list of datasources */
		if (pole.length) { dialogs.connection.okBtn.removeAttribute("disabled"); }
		var select = $("xmla_dsn");
		OAT.Dom.clear(select);
		for (var i=0;i<pole.length;i++) { OAT.Dom.option(pole[i],pole[i],select); }
	}
	OAT.Xmla.discover(ref);
}

function xmla_settings() {
	var c = new OAT.Connection(OAT.ConnectionData.TYPE_XMLA);
	c.options.endpoint = $v("xmla_endpoint");
	c.options.dsn = $v("xmla_dsn");
	c.options.user = $v("user");
	c.options.password = $v("password");
	http_cred.user = c.options.user;
	http_cred.password = c.options.password;
	OAT.Xmla.connection = c;
	var h = $('options_type_http');
	var d = $('options_type_dav');
	h.checked = ($v('login_put_type') == "http");
	d.checked = ($v('login_put_type') == "dav");
	h.__checked = (h.checked ? "1" : "0");
	d.__checked = (d.checked ? "1" : "0");
}	
