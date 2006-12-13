/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
var reposition = 0;

function import_xml(str) {
	/* load data from saved xml file */
	var pending_relations = [];
	var xml = OAT.Xml.createXmlDoc(str);
	var root = xml.documentElement;
	if (!root) {
		alert('No data!');
		return false;
	}
	clear_tables();
	
	/* datatypes */
	var datatypes = root.getElementsByTagName("datatype");
	if (datatypes.length) {
		var arr = [];
		for (var i=0;i<datatypes.length;i++) {
			var dt = datatypes[i];
			var obj = {};
			obj.name = dt.getAttribute("name");
			obj.type = dt.getAttribute("type");
			obj.def = dt.getAttribute("default").replace(/&quot;/g,'"');
			obj.params = dt.getAttribute("params");
			obj.prefix = dt.getAttribute("prefix").replace(/&quot;/g,'"');
			obj.suffix = dt.getAttribute("suffix").replace(/&quot;/g,'"');
			arr.push(obj);
		}
		create_data_types(arr);
	}
	
	/* tables */
	var tables = root.getElementsByTagName("table");
	for (var i=0;i<tables.length;i++) {
		var t = tables[i];
		var pos_x=0;
		var pos_y=0;
		var tname = t.getAttribute("name");
		var x = t.getAttribute("x");
		var y = t.getAttribute("y");
		if (x) { pos_x = parseInt(x); } else { reposition = 1;}
		if (y) { pos_y = parseInt(y); } else { reposition = 1;}
		var table = add_table(pos_x,pos_y,tname);
		var cols = t.getElementsByTagName("column");
		for (var j=0;j<cols.length;j++) {
			var col = cols[j];
			var name = col.getAttribute("name");
			var type = col.getAttribute("type");
			var spec = type.match(/(.*)\((.*)\)/);
			if (spec) { type = spec[1]; }
			var t = get_data_type(""+type);
			var row = table.addRow(name,t.type);
			if (col.getAttribute("primarykey") == "Y") { row.setPK(); row.setIndex(); }
			if (col.getAttribute("notnull") == "Y") { row.setNN(); }
			if (spec) { row.setSpec(spec[2]); }
			/* default */
			var d = col.getElementsByTagName("default")[0].firstChild;
			row.setDef(OAT.Xml.textValue(d));
			/* index */
			var idx = col.getElementsByTagName("index");
			if (idx.length) { row.setIndex(); }
			/* fk */
			var fk = col.getAttribute("foreignkey");
			if (fk) {
				row.setFK();
				var parts = fk.match(/(.*)\((.*)\)/);
				pending_relations.push([parts[1],parts[2],row]);
			}
		}
	}

	/* relations */
	for (var i=0;i<pending_relations.length;i++) {
		var pr = pending_relations[i];
		var t1=false;
		var r1=false;
		for (var j=0;j<table_array.length;j++) {
			var t = table_array[j];
			if (t._title.innerHTML == pr[0]) { 
				t1 = t;
				for (var k=0;k<t1.rows.length;k++) {
					if (t1.rows[k]._title.innerHTML == pr[1]) { r1 = t1.rows[k]; }
				}
			}
		}
		if (r1) { add_relation(r1,"1",pr[2],"&infin;"); }
	}
	
	if (reposition) {
		reposition_tables();
		reposition = 0;
	}
  return true;
}

function export_xml(xslStr,catalog,takeAll) {
	/* export to zenark's xml for sql format */
	
	/* headers */
	var x,y;
	var xml = '<?xml version="1.0" encoding="UTF-8" ?>\n';
	if (xslStr) { xml += xslStr+'\n'; }
	xml += '<database name="www sql designer export" >\n';
	xml += '<!-- WWWSQLEditor XML export -->\n';
	
	/* data types */
	xml += '\t<datatypes>\n';
	for (var i=0;i<SQL_DATA_TYPES.length;i++) {
		for (var j=0;j<SQL_DATA_TYPES[i].types.length;j++) {
			var type = SQL_DATA_TYPES[i].types[j];
			var p = type.prefix.replace(/"/g,"&quot;");
			var s = type.suffix.replace(/"/g,"&quot;");
			var d = type.def.toString().replace(/"/g,"&quot;");
			xml += '\t\t<datatype name="'+type.name+'" type="'+type.type+'" default="'+d+'" params="'+type.params+'" prefix="'+p+'" suffix="'+s+'"/>\n';
		}
	}
	xml += '\t</datatypes>\n';
	
	/* tables & columns */
	for (var i=0;i<table_array.length;i++) {
		var table = table_array[i];
		if (table.markbox.checked || takeAll) {
			x = parseInt(table._div.style.left);
			y = parseInt(table._div.style.top);
			var c = "";
			if (catalog) { c = catalog+".."; }
			xml += '\t<table name="'+c+table._title.innerHTML+'" x="'+x+'" y="'+y+'" >\n';
			for (var j=0;j<table.rows.length;j++) {
				var row = table.rows[j];
				var type = get_data_type(row.type);
				var name = row._title.innerHTML;
				xml += '\t\t<column name="'+name+'" type="'+type.name;
				if (type.params != "") { xml += '('+row.spec+')'; }
				xml += '" ';
				if (row.nn) { xml += 'notnull="Y" '; }
				if (row.pk) { xml += 'primarykey="Y" sequence="Y" seq-start="1" seq-increment="1" '; }
				if (row.fk) { /* foreign key */
					/* find appropriate relation */
					var r = false;
					for (var k=0;k<relation_array.length;k++) {
						var rel = relation_array[k];
						if (rel.row_2 == row) { r = rel; }
					}
					var rtable = r.row_1.table._title.innerHTML;
					var rrow = r.row_1._title.innerHTML;
					xml += 'foreignkey="'+rtable+'('+rrow+')" ';
				}
				xml += ' >\n';
				xml += '\t\t\t<default><value>'+row.def+'</value></default>\n';
				if (row.index && !row.pk) { 
					xml += '\t\t\t<index name="'+name+'">\n';
					xml += '\t\t\t\t<field column="'+name+'" />\n';
					xml += '\t\t\t</index>';
				}
				xml += '\t\t</column>\n';
				
			} /* all columns */
			xml += '\t</table>\n';
		} /* if checked */
	} /* for all tables */
	
	/* footer */
	xml += '</database>';
	return xml;
}

