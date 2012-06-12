/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2012 OpenLink Software
 *
 *  See LICENSE file for details.
 */
var dialogs = {}
var grid_in;
var tab = false;
var table_array = [];
var gd = false;
var gd2 = false;
var pivot = false;
var global_data = {pending:false,x:10,y:10,conds_1_count:1,conds_2_count:1,conds_1_last:false,conds_2_last:false}
var pivot_gd = false;
var pivot_data = {headerRow:[],dataRows:[],headerRowIndexes:[],headerColIndexes:[],dataColumnIndex:-1,filterIndexes:[],query:""};
var lastQuery = false;
var total_catalog_count = 0;
var datasource = false; 
var layerObj = false;
var connection = false;
var http_cred = {
	user:"demo",
	password:"demo"
};

var ORDER = ["NO","ASC","DESC"];

var Query = {
	obj:false,
	orderIndex:-1,
	orderType:0,
	query:"",
	
	create:function(type) {
		Query.obj = new OAT.SqlQuery();
		Query.createColumns();
		Query.createConditions();
		Query.createTables();
		Query.createLimit();
		Query.createOrders();
		Query.createGroups();
		Query.query = Query.glue(type);
		if (!Query.query) { return; }
		$("q").value = Query.query;
	},
	
	glue:function(type) { /* glue together all pieces */
		if (!Query.obj || !Query.obj.columns.count) {
			return false;
		}
		var q = Query.obj.toString(type);
		return q;
	},
	
	createColumns:function() {
		var values = Columns.getValues(0); /* array of divs */
		var aliases = Columns.getValues(1); /* array of divs */
		var shows = Columns.getValues(2); /* array of divs */
		for (var i=0;i<values.length;i++) {
			var col = [];
			col[0] = values[i].getElementsByTagName("input")[0].value;
			col[1] = aliases[i].getElementsByTagName("input")[0].value;
			var show = shows[i].getElementsByTagName("input")[0].checked && col[0] != "";
			if (show) { 
				var c = Query.obj.columns.add();
				c.column = col[0];
				c.alias = col[1];
			}
		}
	}, /* Query.createColumns() */
	
	createLimit:function() {
		if ($("options_dolimit").checked && !OAT.Preferences.useCursors) {
			Query.obj.limit = $v("options_limit");
		} else { Query.obj.limit = -1; }
	},
	
	createTables:function() {
		Query.obj.tablesString = generate_join_list();
	},
	
	createConditions:function() {
		var c_array = [];
		var h_array = [];
		var tables = Columns.getValues(0);
		
		for (var i=0;i<global_data.conds_1_count;i++) {
			var conds = Columns.getValues(4+i);
			for (var j=0;j<conds.length;j++) { /* read through grid and get set conditions */
				var v = conds[j].getElementsByTagName("input")[0].value;
				if (v) { c_array.push([tables[j],conds[j]]); }
			}
		}
		
		for (var i=0;i<global_data.conds_2_count;i++) {
			var conds = Columns.getValues(5+i+global_data.conds_1_count);
			for (var j=0;j<conds.length;j++) { /* read through grid and get set conditions */
				var v = conds[j].getElementsByTagName("input")[0].value;
				if (v) { h_array.push([tables[j],conds[j]]); }
			}
		}
		
		/* available conditions now in c_array and h_array */
		for (var i=0;i<c_array.length;i++) {
			var c = Query.obj.conditions.add();
			if (i) { c.logic = c_array[i][1].getElementsByTagName("select")[0].value; }
			c.column = c_array[i][0].getElementsByTagName("input")[0].value;
			c.operator = c_array[i][1].getElementsByTagName("select")[1].value;
			c.value = c_array[i][1].getElementsByTagName("input")[0].value;
		}
		
		for (var i=0;i<h_array.length;i++) {
			var c = Query.obj.havings.add();
			if (i) { c.logic = h_array[i][1].getElementsByTagName("select")[0].value; }
			c.column = h_array[i][0].getElementsByTagName("input")[0].value;
			c.operator = h_array[i][1].getElementsByTagName("select")[1].value;
			c.value = h_array[i][1].getElementsByTagName("input")[0].value;
		}
	}, /* Query.createConditions() */
	
	createOrders:function() {
		Query.orderIndex = -1;
		var tmp = [];
		var tables = Columns.getValues(0);
		var orders = Columns.getValues(3);
		var shows = Columns.getValues(2);
		for (var i=0;i<tables.length;i++) {
			var type = orders[i].getElementsByTagName("select")[0].selectedIndex;
			if (type) {
				var c = Query.obj.orders.add();
				if (Query.orderIndex == -1) { 
					Query.orderIndex = i; 
					Query.orderType = type;
				}
				c.column = tables[i].getElementsByTagName("input")[0].value;
				c.type = ORDER[type];
			}
		}
		
		/* 
			note: the primary sorting column may not be selected to show in result.
			in this case, we don't want the grid to show ordering symbol
		*/
		if (Query.orderIndex != -1 && !shows[Query.orderIndex].getElementsByTagName("input")[0].checked) { Query.orderIndex = -1; }
	}, /* Query.createOrders() */
	
	createGroups:function() {
		var tables = Columns.getValues(0);
		var groups = Columns.getValues(4+global_data.conds_1_count);
		for (var i=0;i<tables.length;i++) {
			var group = groups[i].getElementsByTagName("input")[0].checked;
			if (group) { 
				var c = Query.obj.groups.add();
				c.column = tables[i].getElementsByTagName("input")[0].value;
			}
		}
	} /* Query.createGroups() */
}

var Connection = {
	get_settings:function() {
		/* read relevant settings from inputboxes */
		connection.options.user = $v("user");
		connection.options.password = $v("password");
		connection.options.dsn = $v("dsn");
		connection.options.endpoint = $v("endpoint");
	},
	
	discover_dsn:function() {
		/* discover datasources */
		Connection.get_settings();	
		http_cred.user = connection.options.user;
		http_cred.password = connection.options.password;
		var ref=function(pole) {
			if (pole.length) { dialogs.connection.okBtn.removeAttribute("disabled"); }
			var select = $("dsn");
			OAT.Dom.clear(select);
			OAT.Dom.clear("ds_catalogs");
			OAT.Dom.clear("ds_tables");
			for (var i=0;i<pole.length;i++) { OAT.Dom.option(pole[i],pole[i],select); } /* for all rows */
		} /* callback */
		OAT.Xmla.discover(ref);
	},
	
	use_dsn:function(read_settings,whatToDo) {
		if (read_settings) { Connection.get_settings(); }
		http_cred.user = connection.options.user;
		http_cred.password = connection.options.password;

		/* if not virtuoso, hide its save formats */
		var cBack = function(data) {
			var result = OAT.Xmla.parseResponse(data);
			var index = result[0].find("ProviderName");
			var _index = result[0].find("DataSourceInfo");
			for (var i=0;i<result[1].length;i++) {
				if (result[1][i][_index] == connection.options.dsn && !result[1][i][index].match(/virtuoso/i)) {
					/* delete! */
					var opts = $("options_savetype").getElementsByTagName("option");
					var indexes = [];
					for (var i=0;i<opts.length;i++)
						if (opts[i].value != "xml") { indexes.push(i); }
					if (!indexes.length) { return; }
					for (var i=indexes.length-1;i>=0;i--) {
						OAT.Dom.unlink(opts[indexes[i]]);
					}
				}
			}
		}
		var data = '<Discover  env:encodingStyle="http://www.w3.org/2003/05/soap-encoding"'+
			' xmlns="urn:schemas-microsoft-com:xml-analysis" >'+
			'<RequestType>DISCOVER_DATASOURCES</RequestType>'+
			'<Restrictions xsi:nil="1" ></Restrictions>'+
			'<Properties></Properties></Discover>';
		var o = {headers:OAT.Xmla.discoverHeader,type:OAT.AJAX.TYPE_XML}
		OAT.Soap.command(connection.options.endpoint, data, cBack, o);
	
		/* discover catalogs */
		var ref=function(pole) {
			Tables.clear();
			Columns.init(1,1);
			/* list of catalogs */
			OAT.Dom.clear(dialogs.tablelist.list);
			Filter.init();
			ask_for_catalogs(pole,1);
			dialogs.connection.hide();
			tab.go(0);
			if (whatToDo) { whatToDo(); }
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
		total_catalog_count = pole.length;
		for (var i=0;i<pole.length;i++) {
			var name = pole[i];
			var callback = function(catalog_name,a) {
				read_tables(catalog_name,a);
			}
			OAT.Xmla.tables(name,callback);
		} /* for each catalog */
		/* no catalogs present? */
		if (!pole.length) {
			total_catalog_count = 1;
			var callback = function(catalog,arr) {
				read_tables("",arr);
			}
			OAT.Xmla.tables("",callback);
		}
	}
}

function try_relation(pk,card1,fk,card2) {
	/* 
		there is a relation between {pk} and {fk}
		can we mark that in our design?
	*/
	var t1=false;
	var t2=false;
	for (var i=0;i<table_array.length;i++) {
		var table = table_array[i];
		if (pk.catalog == table.catalog && pk.schema == table.schema && pk.table == table.name) {
			t1 = table;
		} /* if table == q1 */
		if (fk.catalog == table.catalog && fk.schema == table.schema && fk.table == table.name) {
			t2 = table;
		} /* if table == q2 */
	} /* for all tables */
	if (t1 && t2) {
		for (var i=0;i<t1.rows.length;i++) {
			if (t1.rows[i].name == pk.column) {
				var r1 = t1.rows[i];
			}
		}
		for (var i=0;i<t2.rows.length;i++) {
			if (t2.rows[i].name == fk.column) {
				var r2 = t2.rows[i];
			}
		}
		var hope = 1; /* is this relation already present? */
		for (var i=0;i<r1.relations.length;i++) {
			var r = r1.relations[i];
			if (
				(r.row_1 == r1 && r.row_2 ==r2) ||
				(r.row_1 == r2 && r.row_2 ==r1)
			) { hope = 0; }
		}
		if (hope) { add_relation(r1,r2,card1,card2); }
	}
}

function ask_for_keys(table) {
	/* get pk and fk info about a table */

	var callback_fk = function(pole) {
		for (var i=0;i<pole.length;i++) {
			try_relation(pole[i][0],"1",pole[i][1],"&infin;");
		}
	}	/* received fk response */
	
	var callback_pk = function(pole) {
		if (pole.length) {
			for (var i=0;i<table.rows.length;i++) {
				if (table.rows[i].name == pole[0]) {
					table.rows[i].mark();
				} /* correct row! */
			} /* for all rows */
		} /* if has pk */
	} /* callback */
	
	OAT.Xmla.primaryKeys(table.catalog,table.schema,table.name,callback_pk);
	OAT.Xmla.foreignKeys(table.catalog,table.schema,table.name,callback_fk);
}

function read_tables(catalog_name,pole) {
	/* add all these tables to catalog tree */
	var label = OAT.Dom.create("span");
	var group = OAT.Dom.create("ul");
	var item = OAT.Dom.create("li");
	label.innerHTML = (catalog_name != "" ? catalog_name : "[no catalog]");
	
	item.appendChild(label);
	item.appendChild(group);
	var getRef = function(span) { /* to be called when drag succeeds */
		return function(target,x,y) {
			/* fuck off when dragged onto tablelist */
			var coords = OAT.Dom.position(dialogs.tablelist.div);
			var w = dialogs.tablelist.div.offsetWidth;
			var h = dialogs.tablelist.div.offsetHeight;
			if (x > coords[0] && x < coords[0]+w && y > coords[1] && y < coords[1] + h) return;
			
			var coords = OAT.Dom.position("design_area");
			var table_x = x - coords[0];
			var table_y = y - coords[1];
			Tables.add(span.innerHTML,span.schema,span.catalog,table_x,table_y,0);
		}
	}
	
	var process = function(elm) {
		elm.style.padding = "2px";
		elm.style.backgroundColor = "#888";
		elm.style.border = "1px dotted #000";
	}

	for (var i=0;i<pole[0].length;i++) {
		var opt = OAT.Dom.create("li");
		var lbl = OAT.Dom.create("span");
		opt.style.cursor = "pointer";
		gd.addSource(opt,process,getRef(lbl)); 
		lbl.catalog = catalog_name;
		lbl.schema = pole[1][i];
		lbl.innerHTML = pole[0][i];
		Filter.addValue(lbl.schema);
		opt.appendChild(lbl);
		group.appendChild(opt);
		var ref=function(event) {
			var elm = OAT.Dom.source(event).parentNode.getElementsByTagName("span")[0];
			/* no position -> autoplace */
			Tables.add(elm.innerHTML,elm.schema,elm.catalog,0,0,1);
		}
		OAT.Dom.attach(opt,"dblclick",ref);
	}
	
	dialogs.tablelist.list.appendChild(item);
	total_catalog_count--;
	
	if (!total_catalog_count) { /* create tree after last catalog arrived */
		var t = new OAT.Tree({imagePath:"../images/"});
		t.assign(dialogs.tablelist.list,1);
		/* also fix grid in ie here */
		grid_in.ieFix();
	}
}

function query(q) {
	/* send query */
	tab.go(2);
	lastQuery = q;
	datasource.connection = connection;
	datasource.options.query = q;
	var s = ($("options_dolimit").checked ? parseInt($v("options_limit")) : 0);
	datasource.pageSize = s;
	datasource.reset();
	datasource.advanceRecord(0);
}

function qualifier(table) {
	/* create a qualified name */
	var t = table;
	if (typeof(table) == "string") {
		t = table.toUpperCase();
		for (var i=0;i<table_array.length;i++) {
			if (table_array[i].name.toUpperCase() == table.toUpperCase() ) { t = table_array[i]; }			
		}
	} /* if string given */
	var nq = (t.catalog == "" ? t.name : t.catalog + "." + t.schema + "." + t.name);
	return OAT.SqlQueryData.qualifyMulti(nq);
}

var Filter = {
	addValue:function(value) {
		var hope = 1;
		var opts = $("tablefilter_select").getElementsByTagName("option");
		for (var i=0;i<opts.length;i++) {
			if (opts[i].value == value) { hope = 0; }
		}
		if (!hope) { return; }
		OAT.Dom.option(value,value,"tablefilter_select");
	},
	
	apply:function() {
		var value = $v("tablefilter_select");
		var catalogLis = $("tablelist").childNodes;
		var catalogs = $("tablelist").getElementsByTagName("ul");
		for (var i=0;i<catalogs.length;i++) {
			var tables = catalogs[i].getElementsByTagName("li");
			var visibleCount = 0;
			for (var j=0;j<tables.length;j++) {
				var li = tables[j];
				var span = li.getElementsByTagName("span")[2];
				if (value == "" || value == span.schema) {
					/* show */
					OAT.Dom.show(li);
					visibleCount++;
				} else {
					/* hide */
					OAT.Dom.hide(li);
				}
			} /* for all tables */
			if (visibleCount) {
				OAT.Dom.show(catalogLis[i]);
			} else {
				OAT.Dom.hide(catalogLis[i]);
			}
		} /* for all catalogs */
	},
	
	init:function() {
		OAT.Dom.clear("tablefilter_select");
		OAT.Dom.option("[no filter]","","tablefilter_select");
	}
}

var Tables = {
	add:function(name,schema,catalog,x,y,autoplace) {
		var ref=function(pole) { /* column info has arrived... */
			$("status_content").innerHTML = "Mark Primary keys using 'P' button. Drag 'R' buttons to create relations.";
			var new_x = x;
			var new_y = y;
			if (autoplace) {
				new_x = global_data.x;
				new_y = global_data.y;
				global_data.x += 190;
				if (global_data.x > 700) {
					global_data.x = 10;
					global_data.y += 200;
				}
			}
			var tmp = new SqlTable(name,pole,new_x,new_y); /* object */
			tmp.catalog = catalog; /* inherit catalog name */
			tmp.schema = schema; /* inherit schema name */
			table_array.push(tmp); /* put into global array */
			tmp.closeFunc = function() { Tables.remove(tmp);	}
//			OAT.Dom.attach(tmp.obj.close,"click",tmp.closeFunc);
			tmp.obj.onclose = tmp.closeFunc;
			$("design_area").appendChild(tmp.obj.div);
			ask_for_keys(tmp); /* get pk and fk info */
			Columns.updateCombos(); /* actualize combos */
		} /* callback */
		OAT.Xmla.columns(catalog,schema,name,ref);
	}, /* Tables.add() */
	
	remove:function(object) {
		/* remove columns */
		var name = object.name;
		var colsToRemove = [];
		var values = Columns.getValues(0);
		for (var i=0;i<values.length;i++) {
			var colName = values[i].getElementsByTagName("input")[0].value;
			if (colName.indexOf(name) != -1) { colsToRemove.push(i+1); }
		}
		for (var i=colsToRemove.length-1;i>=0;i--) {
			grid_in.removeColumn(colsToRemove[i]); 
		}
		/* remove relations */
		for (var i=0;i<object.rows.length;i++) {
			for (var j=0;j<object.rows[i].relations.length;j++) {
				if (object.rows[i].relations[j]) {
					object.rows[i].relations[j].remove();
				}
			}
		}
		/* remove from dom tree */
		OAT.Dom.unlink(object.obj.div);
		/* from global array */
		for (var i=0;i<table_array.length;i++) {
			if (table_array[i] == object) { table_array.splice(i,1); }
		}
	},
	
	clear:function() {
		while (table_array.length) {
			var obj = table_array[0];
			obj.closeFunc();
		}
		global_data.x = 10;
		global_data.y = 10;
	} /* Tables.clear() */
}

var Columns = {
	getValues:function(rowIndex) {
		/* one row */
		var result = [];
		var row = grid_in.rows[rowIndex];
		for (var i=1;i<row.cells.length;i++) { result.push(row.cells[i].value);	}
		return result;
	},
	
	getKeyUpRef:function(type,elm,input) {
		return function(event) {
			if ($v(input) == "") { return; }
			if (type == 1 && elm.last) {
				var oldLast = Columns.getValues(global_data.conds_1_count + 3);
				for (var i=0;i<oldLast.length;i++) { oldLast[i].last = false; }
				/* insert new line to where conditions */
				grid_in.createRow([".."],4+global_data.conds_1_count);
				for (var i=1;i<grid_in.header.cells.length;i++) {
					var div = grid_in.rows[4+global_data.conds_1_count].addCell({align:OAT.GridData.ALIGN_CENTER});
					Columns.createConds([div],[],1);
				}
				global_data.conds_1_count++;
			}
			if (type == 2 && elm.last) {
				var oldLast = Columns.getValues(global_data.conds_1_count + global_data.conds_2_count + 4);
				for (var i=0;i<oldLast.length;i++) { oldLast[i].last = false; }
				grid_in.createRow([".."],5+global_data.conds_1_count+global_data.conds_2_count);
				for (var i=1;i<grid_in.header.cells.length;i++) {
					var div = grid_in.rows[5+global_data.conds_1_count+global_data.conds_2_count].addCell({align:OAT.GridData.ALIGN_CENTER});
					Columns.createConds([div],[],2);
				}
				global_data.conds_2_count++;
			}
		}
	},
	
	createConds:function(div_array,conds_array,type) {
		var logic, operator, value;
		/* conds_array[i] == {logic:"",operator:"",value:""} */
		/* div_array is (should be :) larger than conds_array (by 1)! */
		for (var i=0;i<div_array.length;i++) {
			if (conds_array.length > i) {
				logic = conds_array[i].logic;
				operator = conds_array[i].operator;
				value = conds_array[i].value;
			} else {
				logic = "AND";
				operator = "=";
				value = "";
			}
		
			var select_logic = OAT.Dom.create("select",{font:"menu"});
			OAT.Dom.option("AND","AND",select_logic);
			OAT.Dom.option("OR","OR",select_logic);
			select_logic.selectedIndex = (logic == "AND" ? 0 : 1);
			div_array[i].appendChild(select_logic);
			
			var select_operator = OAT.Dom.create("select",{font:"menu"});
			OAT.Dom.option("=","=",select_operator);
			OAT.Dom.option("&lt;&gt;","<>",select_operator);
			OAT.Dom.option("&gt;",">",select_operator);
			OAT.Dom.option("&gt;=",">=",select_operator);
			OAT.Dom.option("&lt;","<",select_operator);
			OAT.Dom.option("&lt;=","<=",select_operator);
			OAT.Dom.option("LIKE","LIKE",select_operator);
			OAT.Dom.option("NOT LIKE","NOT LIKE",select_operator);
			var opts = select_operator.getElementsByTagName("option");
			for (var j=0;j<opts.length;j++) if (opts[j].value == operator) { select_operator.selectedIndex = j; }
			div_array[i].appendChild(select_operator);
			
			
			div_array[i].last = (i == div_array.length-1 ? true : false);
			
			var input_value = OAT.Dom.create("input",{font:"menu",border:"none",textAlign:"center",display:"block"});
			var keyUpRef = Columns.getKeyUpRef(type,div_array[i],input_value);
			OAT.Dom.attach(input_value,"keyup",keyUpRef);
			input_value.setAttribute("type","text");
			input_value.setAttribute("size","20");
			input_value.value = value;
			div_array[i].appendChild(input_value);
		}
	},
	
	allColsList:function() {
		var result = [];
		for (var i=0;i<table_array.length;i++) {
			var table = table_array[i];
			for (var j=0;j<table.rows.length;j++) if (table.rows[j].name != "*") {
				result.push(OAT.SqlQueryData.qualifyMulti(table.name+"."+table.rows[j].name));
			}
		}
		return result;
	},
	
	blank:function() {
		Columns.add("","",1,0,[],0,[],grid_in.header.cells.length);
		Columns.updateCombos();
	},
	
	updateCombos:function() {
		var allCols = Columns.allColsList();
		var combos = Columns.getValues(0);
		for (var i=0;i<combos.length;i++) {
			var c = combos[i].c;
			c.clearOpts();
			for (var j=0;j<allCols.length;j++) { c.addOption(allCols[j]); }
		}
		
	},
	
	add:function(name,alias,show,order,conds_1,group,conds_2, newIndex) {
		var ni = (newIndex ? newIndex : grid_in.header.cells.length-1);
		/* add a new column to columns grid */
		var num_cols = grid_in.header.cells.length;
		var numSpan = OAT.Dom.create("span");
		var cell = grid_in.appendHeader({sortable:0,value:"Column #",align:OAT.GridData.ALIGN_CENTER},ni);
		cell.value.appendChild(numSpan);
		cell.numSpan = numSpan;
		
		/* actualize numbering */
		for (var i=1;i<grid_in.header.cells.length;i++) {
			grid_in.header.cells[i].numSpan.innerHTML = i+" ";
		}
		
		/* dynamic adding of blank column */
		var div_name = grid_in.rows[0].addCell({align:OAT.GridData.ALIGN_CENTER},ni);
		var n = name;
		var combo_name = new OAT.Combolist([],n);
		div_name.c = combo_name;
		div_name.appendChild(combo_name.div);
		var addRef = function() {
			var colNames = Columns.getValues(0);
			if (colNames[colNames.length-1] != div_name) { return; }
			Columns.blank();
		}
		combo_name.onchange = addRef;
		
		/* remove link */
		var a_remove = OAT.Dom.create("a");
		a_remove.setAttribute("href","#");
		a_remove.innerHTML = "remove";
		var removeRef = function(event) { 
			var elm = OAT.Dom.source(event);
			var str = elm.parentNode.innerHTML;
			var index = -1;
			for (var i=0;i<grid_in.header.cells.length;i++) {
				if (grid_in.header.cells[i].value.innerHTML == str) { index = i; }
			}
			grid_in.removeColumn(index); 
		}
		OAT.Dom.attach(a_remove,"click",removeRef);
		cell.value.appendChild(a_remove);

		var div_alias = grid_in.rows[1].addCell({align:OAT.GridData.ALIGN_CENTER},ni);
		var input_alias = OAT.Dom.create("input",{font:"menu",border:"none",textAlign:"center"});
		input_alias.setAttribute("type","text");
		input_alias.value = alias;
		div_alias.appendChild(input_alias);
		
		var div_show = grid_in.rows[2].addCell({align:OAT.GridData.ALIGN_CENTER},ni);
		var check_show = OAT.Dom.create("input");
		check_show.setAttribute("type","checkbox");
		div_show.appendChild(check_show);
		check_show.checked = (show ? true : false);
		
		var div_order = grid_in.rows[3].addCell({align:OAT.GridData.ALIGN_CENTER},ni);
		var select_order = OAT.Dom.create("select",{font:"menu",boder:"none"});
		OAT.Dom.option("[none]",0,select_order);
		OAT.Dom.option("Ascending",1,select_order);
		OAT.Dom.option("Descending",2,select_order);
		select_order.selectedIndex = order;
		div_order.appendChild(select_order);
		
		var div_conds_1 = [];
		for (var i=0;i<global_data.conds_1_count;i++) {
			div_conds_1.push(grid_in.rows[4+i].addCell({align:OAT.GridData.ALIGN_CENTER},ni));
			
		}
		Columns.createConds(div_conds_1,conds_1,1);
		var div_group = grid_in.rows[4+global_data.conds_1_count].addCell({align:OAT.GridData.ALIGN_CENTER},ni);
		var check_group = OAT.Dom.create("input");
		check_group.setAttribute("type","checkbox");
		div_group.appendChild(check_group);
		check_group.checked = (group ? true : false);

		var div_conds_2 = [];
		for (var i=0;i<global_data.conds_2_count;i++) {
			div_conds_2.push(grid_in.rows[5+global_data.conds_1_count+i].addCell({align:OAT.GridData.ALIGN_CENTER},ni));
			
		}
		Columns.createConds(div_conds_2,conds_2,2);
		Columns.updateCombos();
	},
	
	init:function(num_1,num_2) {
		global_data.conds_1_count = num_1;
		global_data.conds_2_count = num_2;
		OAT.Dom.clear("grid_in");
		grid_in = new OAT.Grid("grid_in");
		grid_in.createHeader([{value:"&nbsp;Query columns&nbsp;",sortable:0,draggable:0,align:OAT.GridData.ALIGN_CENTER}]);
		var a = OAT.Dom.create("a");
		a.setAttribute("href","#");
		a.innerHTML = "clear";
		OAT.Dom.attach(a,"click",function(){Columns.init(1,1);});
		grid_in.header.cells[0].value.appendChild(a);
		grid_in.createRow(["Column"]);
		grid_in.createRow(["Alias"]);
		grid_in.createRow(["Show"]);
		grid_in.createRow(["Sort"]);
		grid_in.createRow(["Where conditions"]);
		for (var i=1;i<num_1;i++) { grid_in.createRow([".."]); }
		grid_in.createRow(["Group by"]);
		grid_in.createRow(["Having conditions"]);
		for (var i=1;i<num_2;i++) { grid_in.createRow([".."]); }
		Columns.blank(); 
	}
}

function init() {
	/* datasource */
	datasource = new OAT.DataSource(OAT.DataSourceData.TYPE_SQL);
	connection = new OAT.Connection(OAT.ConnectionData.TYPE_XMLA);
	OAT.Xmla.connection = connection;
	/* layers */
	layerObj = new OAT.Layers(100);

	/* xslt path */
	$("options_xslt").value = OAT.Preferences.xsltPath;
	$("endpoint").value = OAT.Preferences.endpointXmla;
	
	/* ajax http errors */
	$("options_http").checked = (OAT.Preferences.httpError == 1 ? true : false);
	OAT.AJAX.httpError = OAT.Preferences.httpError;
	OAT.Dom.attach("options_http","change",function(){OAT.AJAX.httpError = ($("options_http").checked ? 1 : 0);});
	
	/* connection */
	dialogs.connection = new OAT.Dialog("XMLA Data Provider Connection Setup","connection",{width:500,modal:1,buttons:1});
	OAT.Dom.attach("endpoint","blur",Connection.discover_dsn);
	OAT.Dom.attach("endpoint","keyup",function(e) { if (e.keyCode == 13) { Connection.discover_dsn(); }});
	OAT.Dom.attach("dsn","click",function(){if ($("dsn").childNodes.length == 0) { Connection.discover_dsn(); }});
	dialogs.connection.ok = function(){ 
		Connection.use_dsn(1);
		var options = {
			imagePath:'../images/',
			imageExt:'png',
			user:$v("user"),
			pass:$v("password"),	
			isDav:($v("login_put_type") == "dav")
		};
		OAT.WebDav.init(options);
	};
	dialogs.connection.cancel = function() { 
		var options = {
			imagePath:'../images/',
			imageExt:'png',
			user:$v("user"),
			pass:$v("password"),	
			isDav:($v("login_put_type") == "dav")
		};
		OAT.WebDav.init(options);
		dialogs.connection.hide(); 
	};
	dialogs.connection.okBtn.setAttribute("disabled","disabled");

	/* columns grid */
	Columns.init(1,1);

	/* relation edit */
	dialogs.rel_props = new OAT.Dialog("Relation properties","rel_props",{modal:1,resize:0,width:400});
	var rel_change = function() { dialogs.rel_props.object.type = $("rel_type").selectedIndex; }
	var rel_remove = function() {
		dialogs.rel_props.object.remove();
		dialogs.rel_props.hide()
	}
	dialogs.rel_props.ok = dialogs.rel_props.hide;
	dialogs.rel_props.cancel = dialogs.rel_props.hide;
	OAT.Dom.attach("rel_type","change",rel_change);
	OAT.Dom.attach("rel_remove","click",rel_remove);

	/* save */
	dialogs.save = new OAT.Dialog("Save","save",{width:400,modal:1});
	dialogs.save.ok = function() {
		IO.lastQName = $v("save_name");
		IO.save_type = $v("options_savetype");
		dialogs.save.hide();
		IO.save_q();
	}
	dialogs.save.cancel = dialogs.save.hide;
	/* options */
	dialogs.options = new OAT.Dialog("Options","options",{width:400,modal:1});
	dialogs.options.ok = dialogs.options.hide;
	dialogs.options.cancel = dialogs.options.hide;
	/* pivot design */
	dialogs.pivot_design = new OAT.Dialog("Pivot table design","pivot_design",{width:600,height:0,modal:1});
	dialogs.pivot_design.ok = pivot_create;
	dialogs.pivot_design.cancel = dialogs.pivot_design.hide;
	/* tree tablelist */
	dialogs.tablelist = new OAT.Window({title:"Tables", close:0, min:0, max:0, width:200, height:320, x:-20,y:10});
	dialogs.tablelist.move._Drag_movers[0][1].restrictionFunction = function(l,t) {
		return l < 0 || t < 0;
	}
	$("design_area").appendChild(dialogs.tablelist.div);
	dialogs.tablelist.content.appendChild($("tablefilter"));
	dialogs.tablelist.content.appendChild($("tablelist"));
	dialogs.tablelist.list = $("tablelist");
	
	
	/* drag'n'drop */
	gd = new OAT.GhostDrag(); /* tables -> design */
	gd.addTarget("design");
	gd2 = new OAT.GhostDrag(); /* columns -> query */
	gd2.addTarget("design_columns");
	pivot_gd = new OAT.GhostDrag(); /* pivot design */
	pivot_gd.addTarget("pivot_design_data");
	pivot_gd.addTarget("pivot_design_headerrow");
	pivot_gd.addTarget("pivot_design_headercol");
	pivot_gd.addTarget("pivot_design_page");
	pivot_gd.addTarget("pivot_design_base");

	/* menu */
	var m = new OAT.Menu();
	m.noCloseFilter = "noclose";
	m.createFromUL("menu");
	OAT.Dom.attach("menu_about","click",function(){alert('Assembly date: '+OAT.Preferences.version);});
	OAT.Dom.attach("menu_savep","click",function(){IO.save_p(pivot,false);});
	OAT.Dom.attach("menu_saveasp","click",function(){IO.save_p(pivot,true);});
	OAT.Dom.attach("menu_saveq","click",IO.save_q);
	OAT.Dom.attach("menu_saveasq","click",dialogs.save.show);
	OAT.Dom.attach("menu_loadq","click",IO.load_q);
	OAT.Dom.attach("menu_loadp","click",IO.load_p);
	OAT.Dom.attach("menu_pivot","click",function(){	pivot_design_prepare(); dialogs.pivot_design.show();});
	OAT.Dom.attach("menu_pivot_refresh","click",pivot_refresh);
	OAT.Dom.attach("menu_options","click",dialogs.options.show);
	OAT.Dom.attach("menu_clear","click",function(){Tables.clear(); Columns.init(1,1);});
	OAT.Dom.attach("menu_create","click",function(){Query.create(OAT.SqlQueryData.TYPE_SQL); tab.go(1); });
	OAT.Dom.attach("menu_addcol","click",function() {tab.go(0); Columns.blank();});
	
	var execRef = function(){ 
		/* post-process by adding TOP (when selected), but only when SQL Passthrough is not active */
		var q = $v("q");
		if (q == "") {
			Query.create(OAT.SqlQueryData.TYPE_SQL);
			q = $v("q");
		}
		if (!($("passthrough").checked) && !OAT.Preferences.useCursors) {
			q = q.replace(/[\n\r]/g," ");
			if ($("options_dolimit").checked && !(q.match(/^ *select +top/i))) {
				var part = q.match(/^ *select(.*)/i)[1];
				q = "SELECT TOP "+$v("options_limit")+" "+part;
			}
		}
		query(q); 
	}
	
	var visRef = function() {
		var data = $v("q");
		IO.loadProcess(data);
	}
	OAT.Dom.attach("menu_exec","click",execRef);
	OAT.Dom.attach("btn_exec","click",execRef);
	OAT.Dom.attach("btn_vis","click",visRef);

	/* grid & nav */
	var g = new OAT.FormObject["grid"](0,0,0); 
	g.showAll = true;
	var n = new OAT.FormObject["nav"](0,0,0);
	$("grid_out").appendChild(g.elm);
	$("nav").appendChild(n.elm);
	g.elm.style.width = "100%";
	g.init();
	n.init();
	datasource.bindRecord(n.bindRecordCallback);
	datasource.bindRecord(g.bindRecordCallback);
	var ref2 = function(data,index) {
		pivot_data.dataRows = data;
		g.bindPageCallback(data,index);
	}
	var ref1 = function(h) {
		pivot_data.headerRow = h;
		g.bindHeaderCallback(h);
	}
	datasource.bindHeader(ref1);
	datasource.bindPage(ref2);
	OAT.Dom.attach(n.first,"click",function() { datasource.advanceRecord(0); });
	OAT.Dom.attach(n.prevp,"click",function() { datasource.advanceRecord(datasource.recordIndex - datasource.pageSize); });
	OAT.Dom.attach(n.prev,"click",function() { datasource.advanceRecord("-1"); });
	OAT.Dom.attach(n.next,"click",function() { datasource.advanceRecord("+1"); });
	OAT.Dom.attach(n.nextp,"click",function() { datasource.advanceRecord(datasource.recordIndex + datasource.pageSize); });
//	OAT.Dom.attach(n.last,"click",function() { datasource.advanceRecord(parseInt(n.total.innerHTML)-1); });
	OAT.Dom.attach(n.current,"keyup",function(event) { 
		if (event.keyCode != 13) { return; }
		var value = parseInt($v(n.current));
		datasource.advanceRecord(value-1); 
	});
	
	/* pivot aggregation */
	var aggRef = function() {
		pivot.options.agg = parseInt($v("pivot_agg"));
		pivot.go();
	}
	/* create agg function list */
	OAT.Dom.clear("pivot_agg");
	for (var i=0;i<OAT.Statistics.list.length;i++) {
		var item = OAT.Statistics.list[i];
		OAT.Dom.option(item.shortDesc,i,"pivot_agg");
	}
	$("pivot_agg").selectedIndex = 1;
	OAT.Dom.attach("pivot_agg","change",aggRef);
	
	/* resizing */
	OAT.Resize.create("resizer_area","design_area",OAT.Resize.TYPE_Y);
	OAT.Resize.create("resizer_area","design_columns",-OAT.Resize.TYPE_Y);
	
	/* file name for query saving */
	var fileRef = function() {
			var options = {
			callback:function(path,fname){
					var name = path + fname;
					$("save_name").value = name;
				},
			extensionFilters:[ ["xml","xml","Saved SQL Query"] ]
			};
		OAT.WebDav.openDialog(options);
	}
	OAT.Dom.attach("btn_browse","click",fileRef);
	
	/* tabs */
	tab = new OAT.Tab("content");
	tab.add("tab_design","design"); 
	tab.add("tab_query","query"); 
	tab.add("tab_results","results"); 
	tab.add("tab_pivot","pivot"); 
	tab.go(0);
	var tabChangeRef = function(oldIndex,newIndex) {
		if (oldIndex == 0 && newIndex == 1) {
			Query.create(OAT.SqlQueryData.TYPE_SQL); 
		}
		if (newIndex >= 1 && newIndex <= 3) {
			OAT.Dom.show("webclip");
		} else {
			OAT.Dom.hide("webclip");
		}
	}
	tab.options.goCallback = tabChangeRef;
	OAT.Dom.hide("webclip");

	/* MS Live clipboard */
	var onRef = function() {}
	var outRef = function() {}
	var genRef = function() { 
		switch (tab.selectedIndex) {
			case 1:
				if (Query.obj) { return Query.glue(OAT.SqlQueryData.TYPE_SQL); } else { return ""; }
			break;
			case 2:
				return (lastQuery ? lastQuery : ""); 
			break;
			case 3:
				if (pivot) { return pivot.toXML("",$("options_uid").checked,$v("q")); } else { return ""; }
			break;
		}
	}
	var pasteRef = function(xmlStr){ 
		switch (tab.selectedIndex) {
			case 1:
				IO.loadProcess(xmlStr);
			break;
			case 2:
				query(xmlStr);
			break;
			case 3:
				pivot_design_load(xmlStr);
			break;
		}
	}
	var typeRef = function() {
		switch (tab.selectedIndex) {
			case 1: return "ol_query";
			case 2: return "ol_grid";
			case 3: return "ol_pivot";
		}
	}
	OAT.WebClipBindings.bind("webclip", typeRef, genRef, pasteRef, onRef, outRef);
	
	/* query returning */
	var returnRef = function() {
		window.__inherited.callback($v("q"));
		window.close();
	}
	OAT.Dom.attach("btn_return","click",returnRef);
	
	if (window.__inherited) {
		connection.options.user = window.__inherited.user;
		connection.options.dsn = window.__inherited.dsn;
		connection.options.endpoint = window.__inherited.endpoint;
		connection.options.password = window.__inherited.password;
		OAT.Dom.show("btn_return");
		var cb = function() {}
		if (window.__inherited.query != "") {
			cb = function() { IO.loadProcess(window.__inherited.query);	}
		}
		Connection.use_dsn(0,cb);
	} else {
		OAT.Dom.hide("btn_return");
		dialogs.connection.show();
	}
}
