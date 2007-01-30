/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
var RELATION_OFFSET = 14;
var RELATION_THICKNESS = 2;

function SqlRow(table,name) {
	var obj = this;
	this.pk = 0;
	this.table = table;
	this.relations = [];
	this.name = name;
	this.selected = 0;
	
	this.div = OAT.Dom.create("div");
	this.div.className = "row";

	this.btn_pk = OAT.Dom.create("div", {"cssFloat":"left","styleFloat":"left"});
	this.btn_pk.className = "btn";
	this.btn_pk.innerHTML = "P";
	this.btn_pk.row = this;
	
	var text = OAT.Dom.create("div",{cursor:"pointer"});
	text.innerHTML = name;
	
	this.select = function() {
		if (this.selected) { return; }
		this.selected = 1;
		this.div.oldClassName = this.div.className;
		this.div.className += " "+this.div.oldClassName+"_selected";
	}
	
	this.deselect = function() {
		if (!this.selected) { return; }
		this.selected = 0;
		this.div.className = this.div.oldClassName;
	}
	
	this.mark = function() {
		obj.pk = 1;
		obj.div.style.fontWeight = "bold";
		for (var i=0;i<table.rows.length;i++) {
			var row = table.rows[i];
			OAT.Dom.unlink(row.btn_pk);
		}
	}
	
	this.addToQuery = function(x,y) {
		/* name,alias,show,order,conds_1,group,conds_2 */
		var index = -1;
		if (x) {
			/* find some place for new column in grid */
			for (var i=1;i<grid_in.header.cells.length;i++) {
				var h = grid_in.header.cells[i].html;
				var b = grid_in.rows[grid_in.rows.length-1].cells[i].html;
				var coords_h = OAT.Dom.position(h);
				var coords_b = OAT.Dom.position(b);
				var dims = OAT.Dom.getWH(h);
				if (x >= coords_h[0] && x <= coords_h[0]+dims[0] &&
					y >= coords_h[1] && y <= coords_b[1]) { index = i; }
			} /* for all cells */
		} 
		var fq = OAT.SqlQueryData.qualifyMulti(table.name+"."+name);
		if (index != -1) {
			Columns.add(fq,"",1,0,[],0,[],index);
		} else { 
			Columns.add(fq,"",1,0,[],0,[]); 
		}
	}

	var clickRef = function(event) { /* select */
		if (!event.ctrlKey && !event.shiftKey) { 
			for (var i=1;i<table.rows.length;i++) { table.rows[i].deselect(); }
		}
		obj.select();
		if (event.shiftKey) {
			/* interval select */
			var start = 0;
			var end = 0;
			for (var i=1;i<table.rows.length;i++) {
				var r = table.rows[i];
				if (r.selected) { start = 1; }
				if (r == obj) { end = 1; }
				if (start && !end) { r.select(); }
			}
		} /* interval */
	} /* clickRef */

	var dropRef = function(target,x,y) {
		/* what to do when d'n'd ends */
		if (target.id == "design_columns") {
			if (!(obj.selected)) { obj.addToQuery(x,y); return; }
			for (var i=1;i<table.rows.length;i++) if (table.rows[i].selected) { table.rows[i].addToQuery(x,y); }
		} else {
			if (target == text) { return; }  /* no relations between identical rows */
			var c1 = (obj.pk ? "1" : "&infin;");
			var c2 = (target.row.pk ? "1" : "&infin;");
			add_relation(obj,target.row,c1,c2);
		}
	}
	var processRef = function(elm) {
		elm.style.padding = "2px";
		elm.style.backgroundColor = "#888";
		elm.style.border = "1px dotted #000";
		if (obj.selected) { elm.firstChild.innerHTML = '[selected columns]'; }
	}
	gd2.addSource(text,processRef,dropRef);
	gd2.addTarget(text);
	
	OAT.Dom.attach(this.btn_pk,"click",obj.mark); /* mark PK */
	OAT.Dom.attach(text,"dblclick",obj.addToQuery); /* add to query */
	OAT.Dom.attach(this.div,"click",clickRef); /* select */

	this.div.appendChild(this.btn_pk);
	this.div.appendChild(text);
	text.row = this;
}

function SqlTable(name,data,x,y) {
	var obj = this;
	var h = 0;
	this.obj = new OAT.Window({title:name, close:1, min:0, max:0, height:0, width:160, x:x, y:y});
	this.obj.move._Drag_movers[0][1].restrictionFunction = function(l,t) {
		return l < 0 || t < 0;
	}
	layerObj.addLayer(this.obj.div);

	this.obj.div.className = "table";
	this.obj.div.style.backgroundColor = "#aaa";
	this.obj.content.style.overflow = "auto";
	this.name = name;
	this.rows = [];
	
	var moveRef = function(event) {
		/* select all rows */
		for (var i=1;i<obj.rows.length;i++) { obj.rows[i].select(); }
	}
	OAT.Dom.attach(this.obj.move,"dblclick",moveRef);

	/* first row with star */
	var starRow = {};
	starRow.table = this;
	starRow.relations = [];
	var rowname = "*";
	starRow.name = rowname;
	var div = OAT.Dom.create("div");
	div.className = "row";
	var text = OAT.Dom.create("div");
	text.innerHTML = rowname;
	text.style.cursor = "pointer";
	var processRef = function(obj) { 
		obj.style.padding = "2px";
		obj.style.backgroundColor = "#888";
		obj.style.border = "1px dotted #000";
		obj.firstChild.innerHTML = '[all columns]'; 
	}
	var dropRef = function(target,x,y) {
		if (target.id != "design_columns") { return; }
		for (var i=1;i<obj.rows.length;i++) { obj.rows[i].addToQuery(x,y);}
	}
	gd2.addSource(text,processRef,dropRef);
	text.row = starRow;
	starRow.div = div;
	div.appendChild(text);
	this.rows.push(starRow);
	this.obj.content.appendChild(div);	
	
	var starRef = function(event) {
		/* add all rows */
		for (var i=1;i<obj.rows.length;i++) {
			obj.rows[i].addToQuery();
		}
	}
	OAT.Dom.attach(text,"dblclick",starRef);

	/* other rows */
	for (var i=0;i<data.length;i++) {
		var row = new SqlRow(this,data[i].name);
		this.rows.push(row);
		this.obj.content.appendChild(row.div);
	} /* for all rows */
	
	var hideRef = function() {
		for (var i=0;i<obj.rows.length;i++) {
			for (var j=0;j<obj.rows[i].relations.length;j++) {
				if (obj.rows[i].relations[j]) obj.rows[i].relations[j].hide();
			}
		}
	}
	var showRef = function() {
		for (var i=0;i<obj.rows.length;i++) {
			for (var j=0;j<obj.rows[i].relations.length;j++) {
				if (obj.rows[i].relations[j]) {
					obj.rows[i].relations[j].update();
					obj.rows[i].relations[j].show();
				}
			}
		}
	}
	OAT.Dom.attach(this.obj.move,"mousedown",hideRef);
	OAT.Dom.attach(this.obj.move,"mouseup",showRef);
	
	var deselectRef = function(event) {
		for (var i=1;i<obj.rows.length;i++) { obj.rows[i].deselect(); }
	}
	OAT.Dom.attach(this.obj.move,"click",deselectRef);
	OAT.Dom.attach(starRow.div,"click",deselectRef);
}


function add_relation(row1,row2,card1,card2) {
	var relation = new Relation(row1,row2,card1,card2);
	row1.relations.push(relation);
	row2.relations.push(relation);
	relation.update();
	$("design_area").appendChild(relation.div);
}

function Relation_update() {
	/* 
		prekresleni car:
		rozlisujeme dva pripady,
 		 a) kdyz maji mezi sebou tabulky horizontalni mezeru,
		 b) kdyz ji nemaji
	*/
	
	/* 
		k napozicovani elementu je potreba techto udaju:
			- start_x, start_y, center_x, start_y
			- center_x, start_y, center_x, end_y
			- center_x, end_y, end_x, end_y
	*/

	var left_table, right_table, left_row, right_row, left_1, left_2, right_1, right_2, width_1, width_2;
	var top_table_1, top_table_2, top_row_1, top_row_2;
	if (parseInt(this.parent_1.obj.div.style.left) < parseInt(this.parent_2.obj.div.style.left)) {
		left_table = this.parent_1.obj.div;
		right_table = this.parent_2.obj.div;
		left_row = this.row_1.div;
		right_row = this.row_2.div;
		this.elem_card_left.innerHTML = this.card_1;
		this.elem_card_right.innerHTML = this.card_2;
	} else {
		right_table = this.parent_1.obj.div;
		left_table = this.parent_2.obj.div;
		right_row = this.row_1.div;
		left_row = this.row_2.div;
		this.elem_card_left.innerHTML = this.card_2;
		this.elem_card_right.innerHTML = this.card_1;
	}
	/* ted uz vime, ktera tabulka ma levou hranu vic vlevo. spocteme dulezita cisla */
	left_1 = parseInt(left_table.style.left); /* leva hrana leve tabulky */
	left_2 = parseInt(right_table.style.left); /* leva hrana prave tabulky */
	width_1 = parseInt(left_table.offsetWidth); /* sirka leve tabulky */
	width_2 = parseInt(right_table.offsetWidth); /* sirka prave tabulky */
	right_1 = left_1 + width_1; /* prava hrana leve tabulky */
	right_2 = left_2 + width_2; /* prava hrana prave tabulky */
	top_table_1 = parseInt(left_table.style.top); /* horni hrana leve tabulky */
	top_table_2 = parseInt(right_table.style.top); /* horni hrana prave tabulky */
	top_row_1 = Math.round(parseInt(left_row.offsetHeight)/2)+parseInt(left_row.offsetTop); /* posun radku v leve tabulce */
	top_row_2 = Math.round(parseInt(right_row.offsetHeight)/2)+parseInt(right_row.offsetTop); /* posun radku v prave tabulce */
	/* nyni detekce mezery... */
	if (right_1 < left_2) {
		/* tabulky mezi sebou maji mezeru, standardni postup */
		var width = left_2 - left_1 - width_1 + RELATION_THICKNESS;
		var start_x = left_1 + width_1 - RELATION_THICKNESS;
		var start_y = top_table_1 + top_row_1;
		var end_x = left_2;
		var end_y = top_table_2 + top_row_2;
		var center_x = start_x + Math.round(width / 2);
		/* korekce kvuli borderu... */
		start_x++;
		
		this.elem_card_left.style.left = (start_x + 12) + "px";
		this.elem_card_right.style.left = (end_x - 20) + "px";
	} else {
		var diff_1 = Math.abs(left_2 - left_1); /* rozdil vlevo */
		var diff_2 = Math.abs(right_2 - right_1); /* rozdil vlevo */
		if (diff_1 < diff_2 + RELATION_THICKNESS) {
			/* "ucho" povede vlevo od obou tabulek */
			start_x = left_1;
			start_y = top_table_1 + top_row_1;
			end_x = left_2;
			end_y = top_table_2 + top_row_2;
			center_x = start_x - RELATION_OFFSET;
			this.elem_card_left.style.left = (start_x - 20) + "px";
			this.elem_card_right.style.left = (end_x - 20) + "px";
		} else {
			/* "ucho" povede vpravo od obou tabulek */
			start_x = Math.max(right_1, right_2) - RELATION_THICKNESS;
			start_y = (right_1 > right_2 ? top_table_1 + top_row_1 : top_table_2 + top_row_2);
			end_x = Math.min(right_1, right_2) - RELATION_THICKNESS;
			end_y = (right_1 < right_2 ? top_table_1 + top_row_1 : top_table_2 + top_row_2);
			center_x = start_x + RELATION_OFFSET;
			/* zde se muze prohodit kardinalita, takze check...*/
			if (right_2 >= right_1) {
				this.elem_card_left.innerHTML = this.card_2;
				this.elem_card_right.innerHTML = this.card_1;
			}
			/* korekce kvuli borderu... */
			start_x++;
			end_x++;
			this.elem_card_left.style.left = (start_x + 12) + "px";
			this.elem_card_right.style.left = (end_x + 12) + "px";
		}
	}
	
	/* korekce aby se vesla vesela znamenka kardinality... */
	start_y = start_y + 4;
	end_y = end_y + 4;
	
	/* a jedem */
	this.elem_1.style.left = Math.min(start_x, center_x) + "px";
	this.elem_1.style.top = start_y + "px"
	this.elem_1.style.width = Math.abs(center_x - start_x) + "px";
	this.elem_2.style.left = center_x + "px";
	this.elem_2.style.top = Math.min(start_y, end_y) + "px";
	this.elem_2.style.height = Math.abs(end_y - start_y) + RELATION_THICKNESS + "px";
	this.elem_3.style.left = Math.min(center_x, end_x) + "px";
	this.elem_3.style.top = end_y + "px"
	this.elem_3.style.width = Math.abs(center_x - end_x) + "px";
	
	this.elem_card_left.style.top = (start_y - 12) + "px";
	this.elem_card_right.style.top = (end_y - 12) + "px";
}

function Relation_show() {
	OAT.Dom.show(this.elem_1);
	OAT.Dom.show(this.elem_2);
	OAT.Dom.show(this.elem_3);
	OAT.Dom.show(this.elem_card_left);
	OAT.Dom.show(this.elem_card_right);
}

function Relation_hide() {
	OAT.Dom.hide(this.elem_1);
	OAT.Dom.hide(this.elem_2);
	OAT.Dom.hide(this.elem_3);
	OAT.Dom.hide(this.elem_card_left);
	OAT.Dom.hide(this.elem_card_right);
}

function Relation_remove() {
	for (var i=0;i<this.row_1.relations.length;i++) {
		if (this.row_1.relations[i] == this) {
			this.row_1.relations[i] = false;
		}
	}
	for (var i=0;i<this.row_2.relations.length;i++) {
		if (this.row_2.relations[i] == this) {
			this.row_2.relations[i] = false;
		}
	}
	OAT.Dom.unlink(this.div);
}

var JOIN_INNER = 0;
var JOIN_NATURAL = 1;
var JOIN_LOUTER = 2;
var JOIN_ROUTER = 3;

function Relation(row_1, row_2, card_1, card_2) {
	this.type = JOIN_INNER;
	this.update = Relation_update; /* funkce na aktualizaci car */
	this.show = Relation_show; /* ukazani */
	this.hide = Relation_hide; /* schovani */
	this.remove = Relation_remove;
	this.row_1 = row_1; /* prvni rodicovska radka */
	this.row_2 = row_2; /* druha rodicovska radka */
	this.parent_1 = row_1.table; /* prvni rodicovska tabulka */
	this.parent_2 = row_2.table; /* druha rodicovska tabulka */
	this.div = OAT.Dom.create("div",{zIndex:200});
	this.elem_1 = OAT.Dom.create("div");
	this.elem_2 = OAT.Dom.create("div");
	this.elem_3 = OAT.Dom.create("div");
	this.div.className = "relation";
	this.elem_1.className = "line";
	this.elem_2.className = "line";
	this.elem_3.className = "line";
	
	this.elem_card_left = OAT.Dom.create("div");
	this.elem_card_right = OAT.Dom.create("div");
	this.elem_card_left.className = "card";
	this.elem_card_right.className = "card";
	this.card_1 = card_1;
	this.card_2 = card_2;
	
	this.elem_1.style.height = RELATION_THICKNESS + "px";
	this.elem_2.style.width = RELATION_THICKNESS + "px";
	this.elem_3.style.height = RELATION_THICKNESS + "px";
	this.div.appendChild(this.elem_1);
	this.div.appendChild(this.elem_2);
	this.div.appendChild(this.elem_3);
	this.div.appendChild(this.elem_card_left);
	this.div.appendChild(this.elem_card_right);

	var tmp = this;
	var ref=function(event) {
		/* show relation's properties */
		var exact = OAT.Dom.eventPos(event);
		var x = exact[0];
		var y = exact[1];
		var props = dialogs.rel_props;
		props.object = tmp;
		$("rel_1").innerHTML = (tmp.parent_1.catalog ? tmp.parent_1.catalog+"."+tmp.parent_1.name : tmp.parent_1.name);
		$("rel_2").innerHTML = (tmp.parent_2.catalog ? tmp.parent_2.catalog+"."+tmp.parent_2.name : tmp.parent_2.name);
		$("rel_type").selectedIndex = props.object.type;
		props.show();
	}
	OAT.Dom.attach(this.div,"click",ref);
}

