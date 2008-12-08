/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2008 OpenLink Software
 *
 *  See LICENSE file for details.
 */
var IO = {
	lastQName:"",
	lastPName:"",

	save:function(xml,name) {
		var recv_ref = function(data) { alert('Saved.'); }
		var o = {
			auth:OAT.AJAX.AUTH_BASIC,
			user:OAT.WebDav.options.user,
			password:OAT.WebDav.options.pass
		}
		OAT.AJAX.PUT(name,xml,recv_ref,o);
	},

	save_p:function(pivot,showDialog) {
		if (!pivot) { return; }
		var xslStr = '<?xml-stylesheet type="text/xsl" href="'+$v("options_xslt")+'pivotview.xsl"?>';
		var xml = pivot.toXML(xslStr,$("options_uid").checked,$("options_uid").checked,$v("q"));
		
		if (IO.lastPName && !showDialog) { /* if file name is known, then just save */
			IO.save(xml,IO.lastPName);
			return;
		}
			var options = {
			extensionFilters:[ ["xml","xml","Pivot Design"] ],
			dataCallback:function() { return xml;}
			};
		OAT.WebDav.saveDialog(options);
	},

	save_q:function() {
		if (IO.lastQName == "") {
			dialogs.save.show();
			return;
		}
		var query = "";
		var type = "";
		var xsl = "";
		var t = IO.save_type;
		
		var glued = Query.glue(OAT.SqlQueryData.TYPE_SQL);
		var q = $v("q");
		if (q != glued) { t = "manual"; } /* custom query -> statement */
		
		switch (t) {
			case "xml_raw":
				type = "query";
				xsl = $v("options_xslt")+"grid.xsl";
				query = Query.glue(OAT.SqlQueryData.TYPE_FORXML_RAW);
			break;
			case "xml_auto":
				type = "query";
				xsl = $v("options_xslt")+"tree.xsl";
				query = Query.glue(OAT.SqlQueryData.TYPE_FORXML_AUTO);
			break;
			case "sqlx_a":
				type = "sqlx";
				xsl = $v("options_xslt")+"grid.xsl";
				query = Query.glue(OAT.SqlQueryData.TYPE_SQLX_ATTRIBUTES);
			break;
			case "sqlx_e":
				type = "sqlx";
				xsl = $v("options_xslt")+"tree.xsl";
				query = Query.glue(OAT.SqlQueryData.TYPE_SQLX_ELEMENTS);
			break;
			case "xml":
				type = "sql";
				query = Query.glue(OAT.SqlQueryData.TYPE_SQL);
				xsl = $v("options_xslt")+"query.xsl";
			break;
			case "manual":
				type = "sql";
				query = q;
				xsl = $v("options_xslt")+"query.xsl";
			break;
		}

		if (!$("options_doxslt").checked) { xsl = ""; }
		query = OAT.Dom.toSafeXML(query);
		var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
		if (t == "xml" || t == "manual") {
			xml += '\n<?xml-stylesheet type="text/xsl" href="'+$v("options_xslt")+'query.xsl"?>';
			xml += '\n<root>';
			xml += OAT.Xmla.connection.toXML($("options_uid").checked,$("options_nocred").checked);
			xml += '\n<query ';
			if (t == "manual") { xml += 'manual="1"'}
			xml += '>'+query+'</query>';
			xml += '\n</root>';
		} else {
			xml += '<root xmlns:sql="urn:schemas-openlink-com:xml-sql"';
			if (xsl != "") { xml += ' sql:xsl="'+xsl+'" ';}
			xml += '><sql:'+type+'>'+query+'</sql:'+type+'></root>';
		}
		IO.save(xml,IO.lastQName);
	},

	load_q:function() {
			var options = {
			callback:function(path,fname,data){
					IO.lastQName = path+fname;
					IO.save_type = "xml";
					IO.loadProcess(data);
					return true; /* return false will keep browser open */
				}
			};
		OAT.WebDav.openDialog(options);
	},

	load_p:function() {
			var options = {
			callback:function(path,fname,data) {
					IO.lastPName = path+fname;
					pivot_design_load(data);
					return true; /* return false will keep browser open */
				}
			};
		OAT.WebDav.openDialog(options);
	},

	blankColumn:function() {
		var o = {};
		o.column = "";
		o.alias = "";
		o.show = 0;
		o.conditions = [];
		o.havings = [];
		o.order = 0;
		o.group = 0;
		return o;
	},

	loadProcess:function(data) {
		/* clear */
		Columns.init(1,1);
		Tables.clear(); /* tables */
		/* fix for manual queries: */
		var r;
		var repl = data.replace(/[\r\n]/g," ");
		if ((r = repl.match(/<query +manual="1" *>(.*)<\/query>/))) {
			$("q").value = OAT.Dom.fromSafeXML(r[1]);
			tab.go(1);
			return;
		}
		/* standard sql */
		Query.obj = new OAT.SqlQuery();
		Query.obj.fromString(data);
		/* prepare columns */
		var num_1 = 1;
		var num_2 = 1;
		var all_columns = [];
		for (var i=0;i<Query.obj.columns.count;i++) {
			var o = IO.blankColumn();
			o.column = Query.obj.columns.items[i].column;
			o.alias = Query.obj.columns.items[i].alias;
			o.show = 1;
			o.conditions = [];
			o.havings = [];
			o.order = 0;
			o.group = 0;
			all_columns.push(o);
		}

		/* where conditions */
		for (var i=0;i<Query.obj.conditions.count;i++) {
			var c = Query.obj.conditions.items[i];
			/* find column */
			var index = -1;
			for (var j=0;j<all_columns.length;j++) {
				if (all_columns[j].column == c.column) { index = j; }
			}
			if (index == -1) {
				var o = IO.blankColumn();
				o.column = c.column;
				o.conditions.push({logic:c.logic,operator:c.operator,value:c.value});
				all_columns.push(o);
			} else {
				all_columns[index].conditions.push({logic:c.logic,operator:c.operator,value:c.value});
			}
		}

		/* having conditions */
		for (var i=0;i<Query.obj.havings.count;i++) {
			var c = Query.obj.havings.items[i];
			/* find column */
			var index = -1;
			for (var j=0;j<all_columns.length;j++) {
				if (all_columns[j].column == c.column) { index = j; }
			}
			if (index == -1) {
				var o = IO.blankColumn();
				o.column = c.column;
				o.havings.push({logic:c.logic,operator:c.operator,value:c.value});
				all_columns.push(o);
			} else {
				all_columns[index].havings.push({logic:c.logic,operator:c.operator,value:c.value});
			}
		}

		/* order by */
		for (var i=0;i<Query.obj.orders.count;i++) {
			var c = Query.obj.orders.items[i];
			var t = (c.type == "ASC" ? 1 : 2);
			/* find column */
			var index = -1;
			for (var j=0;j<all_columns.length;j++) {
				if (all_columns[j].column == c.column) { index = j; }
			}
			if (index == -1) {
				var o = IO.blankColumn();
				o.column = c.column;
				o.order = t;
				all_columns.push(o);
			} else {
				all_columns[index].order = t;
			}
		}

		/* group by */
		for (var i=0;i<Query.obj.groups.count;i++) {
			var c = Query.obj.groups.items[i];
			/* find column */
			var index = -1;
			for (var j=0;j<all_columns.length;j++) {
				if (all_columns[j].column == c.column) { index = j; }
			}
			if (index == -1) {
				var o = IO.blankColumn();
				o.column = c.column;
				o.order = 1;
				all_columns.push(o);
			} else {
				all_columns[index].order = 1;
			}
		}

		/* max conditions in one column */
		for (var i=0;i<Query.obj.columns.count;i++) {
			if (all_columns[i].conditions.length >= num_1) { num_1 = all_columns[i].conditions.length+1; }
			if (all_columns[i].havings.length >= num_2) { num_2 = all_columns[i].havings.length+1; }
		}
		Columns.init(num_1,num_2);

		tab.go(0);
		for (var i=0;i<Query.obj.tables.length;i++) { /* tables */
			var table = Query.obj.tables[i].split(".");
			if (table.length == 1) { table = ["","",table[0]]; } /* catalogless */
			Tables.add(table[2],table[1],table[0],0,0,1);
		}
		for (var i=0;i<all_columns.length;i++) { /* columns */
			var c = all_columns[i];
			Columns.add(c.column,c.alias,c.show,c.order,c.conditions,c.group,c.havings);
			/* name,alias,show,order,conds_1,group,conds_2 */
		}

		function try_join(j) {
			var pk = {column:j.row1};
			var fk = {column:j.row2};
			var t1 = OAT.SqlQueryData.deQualifyMulti(j.table1).split(".");
			var t2 = OAT.SqlQueryData.deQualifyMulti(j.table2).split(".");
			if (t1.length == 1) {
				pk.catalog = "";
				pk.schema = "";
				pk.table = t1[0];
			} else {
				pk.catalog = t1[0];
				pk.schema = t1[1];
				pk.table = t1[2];
			}
			if (t2.length == 1) {
				fk.catalog = "";
				fk.schema = "";
				fk.table = t2[0];
			} else {
				fk.catalog = t2[0];
				fk.schema = t2[1];
				fk.table = t2[2];
			}
			try_relation(pk,"&infin;",fk,"&infin;");
		}
		
		var callback = function() {
			if (OAT.AJAX.requests.length) { setTimeout(callback, 100); } else { 
				/* manual joins */
				for (var i=0;i<Query.obj.joins.length;i++) { try_join(Query.obj.joins[i]); }
				/* re-create query */
				Query.create(OAT.SqlQueryData.TYPE_SQL); 
			}
		}
		setTimeout(callback,100);
	}
}
