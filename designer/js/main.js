/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2007 OpenLink Software
 *
 *  See LICENSE file for details.
 */
var IO = {};
var dialogs = {};
var Locks = {
	newTable:0,
	map:0
}
var drag_lock = 0; /* hybeme-li tabulkou */
var new_table_flag = 0; /* cekame-li na click pro vytvoreni nove tabulky */
var new_table_name = ""; /* jak se bude nova jmenovat */
var table_array = []; /* ukazatele na tabulky */
var relation_array = []; /* ukazatele na relace */
var drag_start; /* prvni element dragu */
var rel_hover_lock = -1; /* mame zvyraznenou relaci */
var mouse_x,mouse_y; /* souradnice */
var table_admin, row_admin, io_admin; /* tooly na baru */
var gd = false;
var xmla = false;
var grid = false;
var layerObj = false;
var http_cred = {
	user:"demo",
	password:"demo"
};
/* --------------------------------------------------------------------------- */

function raise_table(table) {
	row_admin.manageTable(table);
	table_admin.manageTable(table);
	for (var i=0;i<table_array.length;i++) {
		if (table_array[i] !=  table) {
			/* deselectujeme ostatni tabulky a popripade jejich selectnuty radek */
			table_array[i].deselect();
			if (table_array[i].selectedRow) {
				table_array[i].selectedRow.deselect();
				table_array[i].selectedRow = null;
			}
		}
	}
	table.select();
}

function update_map() {
	var map_ = $("map_");
	if (OAT.Browser.isIE) {
		var win_x = document.body.clientWidth;
		var win_y = document.body.clientHeight;
		var scroll_x = document.body.scrollLeft;
		var scroll_y = document.body.scrollTop;
	} else {
		var win_x = window.innerWidth;
		var win_y = window.innerHeight;
		var scroll_x = pageXOffset;
		var scroll_y = pageYOffset;
	}
	map_.style.width = Math.round(win_x * MAP_SIZE / DESK_SIZE) - 2 + "px"; 
	map_.style.height = Math.round(win_y * MAP_SIZE / DESK_SIZE) - 2 + "px"; 
	map_.style.left = Math.round(scroll_x * MAP_SIZE / DESK_SIZE) + "px";
	map_.style.top = Math.round(scroll_y * MAP_SIZE / DESK_SIZE) + "px";
}

function update_bar() {
	var bar = $("bar");
	bar.style.width = parseInt(document.body.clientWidth) + "px";
}

function global_event_resize(co) {
	update_map();
	update_bar();
}

function global_event_scroll(co) {
	update_map();
	update_bar();
}

function add_table(x,y,title) {
	var root=$("root"); /* sem tabulku napojime */
	var table = new Table(x,y,title); /* to je ona */
	table_array.push(table); /* dame si objekt do pole */
	root.appendChild(table._div); /* a pridame i do HTML stromu */
	layerObj.addLayer(table._div);
	table.updateMini();
	raise_table(table);
	gd.addTarget(table._div);
	return table;
}

function remove_table(table) {
	var index = table_array.find(table);
	while (table.rows.length) { table.removeRow(table.rows[0]);	}
	gd.delTarget(table._div);
	layerObj.removeLayer(table._div);
	table.destroy();
	table_array.splice(index,1);
	table_admin.loseTable();
	row_admin.loseRow();
	row_admin.loseTable();
}

function add_relation(row_1, card1, row_2, card2) {
	var root=$("root"); /* sem relaci napojime */
	var relation = new Relation(row_1, card1, row_2, card2); /* to je ona */
	relation_array.push(relation); /* dame si objekt do pole */
	root.appendChild(relation._div); /* a pridame i do HTML stromu */
	relation.update();
	return relation;
}

function remove_relation(rel) {
	var row_2 = rel.row_2;
	row_2.loseFK();
	var index = relation_array.find(rel);
	rel.destroy(); /* odpojit z DOM */
	relation_array.splice(index,1); /* zrusit z globalni tabulky */
}

function reposition_tables() {
	/* maso :) */
	var avail_width = parseInt(document.body.clientWidth);
	var max_height=0, table_width, table_height;
	var actual_x=10, actual_y=10 + BAR_HEIGHT;
	for (var i=0;i<table_array.length;i++) {
		if (table_array[i]) {
			table_width = parseInt(table_array[i]._div.offsetWidth);
			table_height = parseInt(table_array[i]._div.offsetHeight);
			if (actual_x + table_width > avail_width) {
				actual_x = 10;
				actual_y += 10 + max_height;
				max_height = 0;
			}
			table_array[i].moveTo(actual_x,actual_y);
			actual_x += 10 + table_width;
			if (table_height > max_height) {
				max_height = table_height;
			}
		}
	}
	
	for (var j=0;j<relation_array.length;j++) {
		if (relation_array[j]) {
			relation_array[j].update();
		}
	}
}

function clear_tables() {
	while (table_array.length) { remove_table(table_array[0]); }
}

function get_data_type(t) {
	for (var i=0;i<SQL_DATA_TYPES.length;i++) {
		for (var j=0;j<SQL_DATA_TYPES[i].types.length;j++) {
			if (
				(typeof(t) == "string" && SQL_DATA_TYPES[i].types[j].name == t) || 
				(typeof(t) == "number" && SQL_DATA_TYPES[i].types[j].type == t)
			)
				{ return SQL_DATA_TYPES[i].types[j]; }
		}
	}
	return false;
}

function create_data_types(arr) {
	/* analyze array */
	for (var i=0;i<SQL_DATA_TYPES.length;i++) { SQL_DATA_TYPES[i].types = []; }
	for (var i=0;i<arr.length;i++) {
		var dt = arr[i];
		if (dt.name.match(/date|time/i)) {
			/* XXX */
			dt.def = "";
			/* */
			SQL_DATA_TYPES[2].types.push(dt);
			continue;
		}
		if (dt.prefix != "") {
			/* XXX */
			dt.def = dt.prefix + dt.suffix;
			/* */
			SQL_DATA_TYPES[1].types.push(dt);
			continue;
		}
		/* XXX */
		dt.def = 0;
		/* */
		SQL_DATA_TYPES[0].types.push(dt);
	}
	
	/* create <select> based on SQL_DATA_TYPES */
	OAT.Dom.clear("row_type");
	grid.clearData();
	
	for (var i=0;i<SQL_DATA_TYPES.length;i++) {
		var og = OAT.Dom.create("optgroup");
		og.setAttribute("label",SQL_DATA_TYPES[i].name);
		og.style.backgroundColor = SQL_DATA_TYPES[i].color;
		for (var j=0;j<SQL_DATA_TYPES[i].types.length;j++) {
			var type = SQL_DATA_TYPES[i].types[j];
			OAT.Dom.option(type.name,type.type,og);
			/* grid */
			grid.createRow([type.name,type.type,type.params,type.def,type.prefix,type.suffix]);
		}
		$("row_type").appendChild(og);
		

	}
}

function init() {
	xmla_init();
	
	layerObj = new OAT.Layers(100);
	
	/* ghostdrag */
	gd = new OAT.GhostDrag();
	
	/* events */
	var rootDown = function(event) {
		if (OAT.Dom.source(event) != $("root")) { return; }
		table_admin.loseTable();
		row_admin.loseTable();
		for (var i=0;i<table_array.length;i++) {
			if (table_array[i]) {
				table_array[i].deselect();
				if (table_array[i].selectedRow) {
					table_array[i].selectedRow.deselect();
					table_array[i].selectedRow = null;
				}
			}
		} /* deselect vsech tabulek */
		if (Locks.newTable) {
			/* new table placement */
			Locks.newTable = 0;
			document.body.style.cursor = "default";
			var tmp = OAT.Dom.eventPos(event);
			var table = add_table(tmp[0],tmp[1],new_table_name);
			var row = table.addRow("id",SQL_DATA_TYPES[0].types[0].type);
			table.selectedRow = row;
			row.select();
			row_admin.manageTable(table);
			row_admin.manageRow(row);
			row.setPK();
		}
	}
	OAT.Dom.attach("root","mousedown",rootDown);
	OAT.Dom.attach(window,"keydown",global_event_scroll); /* kvuli mape */
	OAT.Dom.attach(window,"resize",global_event_resize); /* kvuli mape */
	OAT.Dom.attach(window,"scroll",global_event_scroll); /* kvuli mape */
	OAT.Dom.attach(window,"DOMMouseScroll",global_event_scroll); /* kvuli mape */	
	var elm = $("root");
	elm.style.width = DESK_SIZE + "px";
	elm.style.height = DESK_SIZE + "px";
	elm.style.minHeight = DESK_SIZE + "px";
	
	/* xslt path */
	$("options_xslt").value = OAT.Preferences.xsltPath;
	
	/* ajax http errors */
	$("options_http").checked = (OAT.Preferences.httpError == 1 ? true : false);
	OAT.AJAX.httpError = OAT.Preferences.httpError;
	OAT.Dom.attach("options_http","change",function(){OAT.AJAX.httpError = ($("options_http").checked ? 1 : 0);});

	/* options */
	dialogs.options = new OAT.Dialog("Options","options",{width:400,modal:1});
	dialogs.options.ok = dialogs.options.hide;
	dialogs.options.cancel = dialogs.options.hide;

	/* connection */
	dialogs.connection = new OAT.Dialog("XMLA Data Provider Connection Setup","connection",{width:500,modal:1,buttons:1});
	OAT.Dom.attach("xmla_endpoint","blur",xmla_discover);
	OAT.Dom.attach("login_put_type","change",function(){if ($("xmla_dsn").childNodes.length == 0) { xmla_discover(); }});
	OAT.Dom.attach("xmla_dsn","click",function(){if ($("xmla_dsn").childNodes.length == 0) { xmla_discover(); }});
	OAT.Dom.attach("xmla_endpoint","keyup",function(e) { if (e.keyCode == 13) { xmla_discover(); }});
	dialogs.connection.ok = xmla_dbschema;
	dialogs.connection.cancel = dialogs.connection.hide;
	dialogs.connection.okBtn.setAttribute("disabled","disabled");
	dialogs.connection.show();

	/* save */
	dialogs.save = new OAT.Dialog("Save","save",{width:400,modal:1});
	dialogs.save.cancel = dialogs.save.hide;

	/* objects */
	table_admin = new TableAdmin();
	row_admin = new RowAdmin();
	io_admin = new IOAdmin();

	/* menu */
	var m = new OAT.Menu();
	m.noCloseFilter = "noclose";
	m.createFromUL("menu");
	OAT.Dom.attach("menu_about","click",function(){alert('Assembly date: '+OAT.Preferences.version);});
	OAT.Dom.attach("menu_options","click",dialogs.options.show);

	/* bar */
	elm = $("bar");
	elm.style.height = BAR_HEIGHT + "px";
	elm.appendChild(table_admin._div);
	
	/* shadow */
	elm = $("shadow");
	elm.style.top = BAR_HEIGHT + "px";
	
	/* minimap */
	elm = $("map");
	elm.style.width = MAP_SIZE + "px";
	elm.style.height = MAP_SIZE + "px";
	var mapDown = function(event) {
		Locks.map = 1;
		document.body.style.cursor = "move"; 
	}
	OAT.Dom.attach("map","mousedown",mapDown);
	var mapUp = function(event) {
		Locks.map = 0;
		document.body.style.cursor = "default";
	}
	OAT.Dom.attach("map","mouseup",mapUp);
	var mapMove = function(event) {
		var coef = DESK_SIZE / MAP_SIZE;
		var pos = OAT.Dom.getLT("map_");
		window.scrollTo(coef * pos[0], coef * pos[1]);
	}
	OAT.Dom.attach("map","mousemove",mapMove);
	var restrict = function(l,t) {
		var dims = OAT.Dom.getWH("map_");
		return (l<0 || t < 0 || l >= MAP_SIZE - dims[0] || t >= MAP_SIZE - dims[1]);
	}
	OAT.Drag.create("map_","map_",{type:OAT.Drag.TYPE_XY,restrictionFunction:restrict});
	update_bar();
	update_map();
	

	/* relation props */
	dialogs.rel_props = new OAT.Dialog("Relation properties","rel_props",{modal:1,resize:0,width:300});
	var rel_change = function() { dialogs.rel_props.object.cardinality = $("rel_type").selectedIndex; }
	dialogs.rel_props.ok = dialogs.rel_props.hide;
	dialogs.rel_props.cancel = dialogs.rel_props.hide;
	OAT.Dom.attach("rel_type","change",rel_change);

	/* file name for saving */ 
	var fileRef = function() {
		var ext = ($v("options_savetype") == "sql" ? ".sql" : ".xml");
		
		if ($("options_type_http").checked) {
			var name = OAT.Dav.getNewFile("/DAV/home/"+http_cred.user,ext,ext);
			if (!name) { return; }
			if (name.slice(name.length-4).toLowerCase() != ext) { name += ext; }
			$("save_name").value = name;
		}
		
		if ($("options_type_dav").checked) {
			var options = {
				mode:'browser',
				onConfirmClick:function(path,fname) {
					var name = path + fname;
					$("save_name").value = name;
				},
				user:$v("user"),
				pass:$v("password"),
				file_ext:ext,
				pathDefault:"/DAV/home/"+$v("user")+"/"
			};
			OAT.WebDav.open(options);
		}
	}
	OAT.Dom.attach("btn_browse","click",fileRef);
	
	/* load */
	var name = document.location.toString().match(/\?load=(.+)/);
	if (name) {
		var file = decodeURIComponent(name[1]);
		OAT.AJAX.GET(file,false,import_xml);
	}
	
	/* datatype grid */
	var data = ["Name","Type number","Create params","Default value","Prefix","Suffix"];
	var headers = [];
	for (var i=0;i<data.length;i++) { 
		var o = {
			value:data[i],
			sortable:0,
			draggable:0,
			resizable:1
		}
		headers.push(o); 
	}
	grid = new OAT.Grid("xmla_grid");
	grid.imagePath = "../images/";
	self.grid.createHeader(headers);
	
	/* data types */
	create_data_types(SQL_DATA_TYPES_DEFAULT);

	/* MS Live clipboard */
	var onRef = function() {}
	var outRef = function() {}
	var genRef = function() { return export_xml("",false,true); }
	var pasteRef = function(xmlStr){ import_xml(xmlStr); }
	var typeRef = function(){ return "ol_design"; }
	OAT.WebClipBindings.bind("webclip", typeRef, genRef, pasteRef, onRef, outRef);

	/* DAV Browser init */
	var options = {
		imagePath:'../images/',
		imageExt:'png'
	};
	OAT.WebDav.init(options);
}


  /*****************************************
	
	var t1 = add_table(100,120,"czf_smaha");
	var r1_1 = table_array[0].addRow("id",0); 
	table_array[0].rows[0].setPK();
	table_array[0].addRow("jmeno",4);
	table_array[0].rows[1].setSpec(32);
	table_array[0].addRow("mail",4);
	table_array[0].rows[2].setSpec(32);
	var t2 = add_table(450,120,"czf_squat");
	var r2_1 = table_array[1].addRow("id",0); 
	table_array[1].rows[0].setPK();
	table_array[1].addRow("adresa",4);
	table_array[1].rows[1].setSpec(128)
	table_array[1].addRow("food_amount",2);
	table_array[1].addRow("beer_amount",2);
	var t3 = add_table(200,300,"obyvatel"); 
	table_array[2].addRow("id",0); 
	table_array[2].rows[0].setPK();
	var r3_1 = table_array[2].addRow("id_smaha",0); 
	table_array[2].rows[1].setFK();
	table_array[2].rows[1].setIndex();
	var r3_2 = table_array[2].addRow("id_squat",0);
	table_array[2].rows[2].setFK();
	table_array[2].rows[2].setIndex();
	table_array[2].addRow("najem",2); 

	add_relation(r1_1,"1",r3_1,"&infin;");
	add_relation(r2_1,"1",r3_2,"&infin;"); 
	
	/*******************************************/
