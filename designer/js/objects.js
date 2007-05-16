/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
/*
	objekt abstractParent:
		setTitle() - zmena textu v _title
		select(), deselect() - vyber
		select => je-li vybrano
		_title => html element
		_div => html element
*/

function abstractParent_setTitle(text) {
	this._title.innerHTML = text;
}

function abstractParent_destroy() {
	OAT.Dom.unlink(this._div);
	if (this._mini) { OAT.Dom.unlink(this._mini); }
}

function abstractParent_select() {
	this._div.className = this._div.className + " " + this._div.className + "_selected";
	this.selected = true;
}

function abstractParent_deselect() {
	this._div.className = this._div.getAttribute("defaultClassName");
	this.selected = false;
}

function abstractParent(className) {
	this._div = OAT.Dom.create("div");
	this._title = OAT.Dom.create("div");

	this._title.className = "title";
	this._div.className = className;

	this._div.setAttribute("defaultClassName",className);
	
	this._div.appendChild(this._title);
	
	this.selected = false;
	this.select = abstractParent_select;
	this.deselect = abstractParent_deselect;
	this.destroy = abstractParent_destroy;
	this.setTitle = abstractParent_setTitle;
}

/*
	objekt Row
		setPK(), losePK() - primary key
		setFK(), loseFK() - foreign key
		setIndex(), loseIndex() - index
		setNN(), loseNN() - not null
		setDef() - default
		updateTitle() - updatne title="xxx" atribut
		setTitle() - updatne title="xxx" atribut
		setType() - updatne typ a defaultni hodnotu
		updateSpecial() - updatne special
		updateColor() - updatne pozadi dle datoveho typu
		_special - drzadlo na specialni PK a FK, vpravo
		
		pk - je-li primary key
		fk - je-li foreign key
		index - je-li index
		nn - je-li notnull
		def - defaultni hodnota
		type - datovy typ (resp. jeho index)
		spec - delka ci vycet
*/

function Row_setPK() {
	var self = this;
	this.pk = 1;
	this.setIndex();
	this.updateTitle();
	this.updateSpecial();
	this._title.style.fontWeight = "bold";
	var process = function(elm) {
		var dims = OAT.Dom.getWH(self._div);
		elm.style.width = dims[0]+"px";
		elm.style.zIndex = 100;
	}
	var callback = function(target,x,y) {
		var t = false;
		for (var i=0;i<table_array.length;i++) if (table_array[i]._div == target) { t = table_array[i]; }
		if (!t) alert("??");

		self.deselect(); 
		self.table.deselect();
		table_admin.loseTable();
		
		var t1 = self.table._title.innerHTML;
		var t2 = self._title.innerHTML;
		var newtitle = t2 + "_" + t1;
		var row = t.addRow(newtitle,0);
		
		/* new row in this table */
		t.select();
		t.selectRow(row);
		table_admin.manageTable(t);
		row_admin.manageTable(t);
		row_admin.manageRow(row);
		row.setFK();
		var relation = add_relation(self, "1", row, "&infin;");
		
	}
	gd.addSource(this._div,process,callback);
}

function Row_losePK() {
	this.pk = 0;
	this.updateTitle();
	this.updateSpecial();
	this._title.style.fontWeight = "normal";
	gd.delSource(this._div);
}

function Row_setFK() {
	this.fk = 1;
	this.updateTitle();
	this.updateSpecial();
}

function Row_loseFK() {
	this.fk = 0;
	this.updateTitle();
	this.updateSpecial();
}

function Row_setNN() {
	this.nn = 1;
	this.updateTitle();
}

function Row_loseNN() {
	this.nn = 0;
	this.updateTitle();
}

function Row_setIndex() {
	this.index = 1;
	this.updateTitle();
	this._title.style.fontStyle = "italic";
}

function Row_loseIndex() {
	this.index = 0;
	this.updateTitle();
	this._title.style.fontStyle = "normal";
}

function Row_updateTitle() {
	var str = this._title.innerHTML + ": ";
	var type = get_data_type(this.type);
	str += type.name
	if (type.params != "") {
		str += "(" + this.spec + ")";
	}
	str += ", default: '" + this.def + "'";
	if (this.pk) {
		str += ", Primary key";
	}
	if (this.fk) {
		str += ", Foreign key";
	}
	if (this.nn) {
		str += ", NOT NULL";
	}
	if (this.index) {
		str += ", Index";
	}
	this._div.setAttribute("title",str);
	this._title.setAttribute("title",str);
}

function Row_setDef(value) {
	this.def = value;
	this.updateTitle();
}

function Row_setSpec(value) {
	this.spec = value;
	this.updateTitle();
}

function Row_setType(type) {
	this.type = parseInt(type);
	this.def = "";
	this.updateTitle();
	this.updateColor();
}

function Row_updateSpecial() {
	var str = "";
	if (this.pk) str += "PK";
	if (this.pk && this.fk) str += ",";
	if (this.fk) str += "FK";
	this._special.innerHTML = str;
}

function Row_updateColor() {
	for (var i=0;i<SQL_DATA_TYPES.length;i++) {
		for (var j=0;j<SQL_DATA_TYPES[i].types.length;j++) {
			if (this.type == SQL_DATA_TYPES[i].types[j].type) {
				this._div.style.backgroundColor = SQL_DATA_TYPES[i].color;
			}
		}
	}
}

function Row_updateRelations() {
	var self = this;
	for (var i=0;i<relation_array.length;i++) {
		var rel = relation_array[i];
		if (rel.row_1 == self || rel.row_2 == self) { rel.update(); }
	}
}

function Row_hideRelations() {
	var self = this;
	for (var i=0;i<relation_array.length;i++) {
		var rel = relation_array[i];
		if (rel.row_1 == self || rel.row_2 == self) { rel.hide(); }
	}
}

function Row_showRelations() {
	var self = this;
	for (var i=0;i<relation_array.length;i++) {
		var rel = relation_array[i];
		if (rel.row_1 == self || rel.row_2 == self) { rel.show(); }
	}
}

function Row(title,type) {
	var self = this;
	this.base = abstractParent;
	this.base("row");
	this.setPK = Row_setPK;
	this.losePK = Row_losePK;
	this.setFK = Row_setFK;
	this.loseFK = Row_loseFK;
	this.setIndex = Row_setIndex;
	this.loseIndex = Row_loseIndex;
	this.setNN = Row_setNN;
	this.loseNN = Row_loseNN;
	this.setType = Row_setType;
	this.setSpec = Row_setSpec;
	this.updateTitle = Row_updateTitle;
	this.updateSpecial = Row_updateSpecial;
	this.updateColor = Row_updateColor;
	this.setDef = Row_setDef;
	this.updateRelations = Row_updateRelations;
	this.showRelations = Row_showRelations;
	this.hideRelations = Row_hideRelations;
	this.setTitle(title);
	this._title.className = "row_title";
	this._special = OAT.Dom.create("div");
	this._special.className="special";
	this._sipka = OAT.Dom.create("div");
	this._sipka.className="sipka";
	this._sipka.innerHTML = "&raquo;&nbsp;";
	this._div.insertBefore(this._special,this._title);
	this._div.insertBefore(this._sipka,this._title);
	this.pk = 0;
	this.fk = 0;
	this.index = 0;
	this.def = "";
	this.nn = 0;
	this.spec = "";
	this.setType(type);
	this.updateTitle();
	this.updateColor();
	this._div.style.height = ROW_HEIGHT+"px";
	
	var downRef = function(event) {
		self.table.selectRow(self);
		var callback = function() { row_admin.manageRow(self); }
		setTimeout(callback,50);
	}
	OAT.Dom.attach(self._div,"mousedown",downRef);
	
}


/*
	objekt Relation:
		update() - upravi pozice na zaklade pozic otcu
		select(), deselect() - ma svuj vlastni select, neb sestava ze 3 casti
		hover(), dehover() - ma svuj vlastni hover, neb sestava ze 3 casti
		parent_1, parent_2 - divy otcovskych tabulek
		row_1, row_2 - divy relevantnich radek
		id - id do globalni tabulky
*/

function Relation_show() {
	this._div.style.visibility = "visible";
}

function Relation_hide() {
	this._div.style.visibility = "hidden";
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
	if (parseInt(this.parent_1._div.style.left) < parseInt(this.parent_2._div.style.left)) {
		left_table = this.parent_1._div;
		right_table = this.parent_2._div;
		left_row = this.row_1._div;
		right_row = this.row_2._div;
		this.elem_card_left.innerHTML = this.card_1;
		this.elem_card_right.innerHTML = this.card_2;
	} else {
		right_table = this.parent_1._div;
		left_table = this.parent_2._div;
		right_row = this.row_1._div;
		left_row = this.row_2._div;
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
		start_x--;
		this.elem_card_left.style.left = (start_x + 4) + "px";
		this.elem_card_right.style.left = (end_x - 10) + "px";
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
			this.elem_card_left.style.left = (start_x - 10) + "px";
			this.elem_card_right.style.left = (end_x - 10) + "px";
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
			start_x--;
			end_x--;
			this.elem_card_left.style.left = (start_x + 4) + "px";
			this.elem_card_right.style.left = (end_x + 4) + "px";
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

function Relation(row_1, card_1, row_2, card_2) {
	this.base = abstractParent;
	this.base("relation");
	OAT.Dom.unlink(this._title);
	this.update = Relation_update; /* funkce na aktualizaci car */
	this.show = Relation_show; /* ukazani */
	this.hide = Relation_hide; /* schovani */
	this.parent_1 = row_1.table; /* prvni rodicovska tabulka */
	this.parent_2 = row_2.table; /* druha rodicovska tabulka */
	this.row_1 = row_1; /* prvni rodicovska radka */
	this.row_2 = row_2; /* druha rodicovska radka */
	this.elem_1 = OAT.Dom.create("div");
	this.elem_2 = OAT.Dom.create("div");
	this.elem_3 = OAT.Dom.create("div");
	this.elem_1.className = "line";
	this.elem_2.className = "line";
	this.elem_3.className = "line";
	this.elem_1.style.height = RELATION_THICKNESS+"px";
	this.elem_2.style.width = RELATION_THICKNESS+"px";
	this.elem_3.style.height = RELATION_THICKNESS+"px";
	
	this.elem_card_left = OAT.Dom.create("div");
	this.elem_card_right = OAT.Dom.create("div");
	this.elem_card_left.className = "card";
	this.elem_card_right.className = "card";
	this.card_1 = card_1;
	this.card_2 = card_2;

	
	this._div.appendChild(this.elem_1);
	this._div.appendChild(this.elem_2);
	this._div.appendChild(this.elem_3);
	this._div.appendChild(this.elem_card_left);
	this._div.appendChild(this.elem_card_right);
	this.cardinality = 1;
	
	var tmp = this;
	var ref=function(event) {
		/* show relation's properties */
		var coords = OAT.Dom.eventPos(event);
		var x = coords[0];
		var y = coords[1];
		var props = dialogs.rel_props;
		props.object = tmp;
		$("rel_1").innerHTML = tmp.parent_1._title.innerHTML;
		$("rel_2").innerHTML = tmp.parent_2._title.innerHTML;
		$("rel_type").selectedIndex = props.object.cardinality;
		props.show();
	}
	OAT.Dom.attach(this._div,"click",ref);
	this._div.style.cursor = "crosshair";

}

/*
	objekt Table:
		moveTo() - posun na zadane souradnice
		addRow() - prida radku
		removeRow() - odebere radku
		selectRow() - vybere radku
		updateWidth() - aktualizuje sirku
		updateMini() - aktualizuje minimapku
		updateShadow() - aktualizuje rozbite stiny
		showRelations() - ukaze relevantni relace
		hideRelations() - schova relevantni relace
		rows => pole radku
		_rows => html drzak radku
*/



function Table_updateMini() {
	var w = parseInt(this._div.offsetWidth);
	var h = parseInt(this._div.offsetHeight);
	var l = parseInt(this._div.style.left);
	var t = parseInt(this._div.style.top);
	this._mini.style.width = Math.round(w * MAP_SIZE / DESK_SIZE) + "px";
	this._mini.style.height = Math.round(h * MAP_SIZE / DESK_SIZE) + "px";
	this._mini.style.left = Math.round(l * MAP_SIZE / DESK_SIZE) + "px";
	this._mini.style.top = Math.round(t * MAP_SIZE / DESK_SIZE) + "px";
}

function Table_moveTo(x,y) {
	this._div.style.left = x + "px";
	this._div.style.top = y + "px";
	this.updateMini();
}

function Table_addRow(title,type) {
	var self = this;
	var row = new Row(title,type); /* to je ona */
	row.table = this;
	this.rows.push(row); /* dame si objekt do pole */
	this._rows.appendChild(row._div); /* a pridame i do HTML stromu */
	this.updateWidth();
	self.updateMini();
	self.updateShadow();
	for (var i=0;i<self.rows.length;i++) {
		self.rows[i].updateRelations();
		self.rows[i].showRelations();
	}
	return row;
}

function Table_removeRow(row) {
	/* neprijdeme tim o nejake pekne relace? */
	var list = [];
	for (var i=0;i<relation_array.length;i++) {
		var rel = relation_array[i];
		if (rel.row_1 == row || rel.row_2 == row) {	list.push(rel); }
	}
	for (var i=0;i<list.length;i++) {
		remove_relation(list[i]);
	}
	var self = this;
	var index = self.rows.find(row);
	row.destroy(); 
	self.rows.splice(index,1);
	self.updateMini();
	self.updateShadow();
	self.updateWidth();
	for (var i=0;i<self.rows.length;i++) {
		self.rows[i].updateRelations();
		self.rows[i].showRelations();
	}
	var last = -1;
	if (this.rows.length && this.rows[this.rows.length-1] != row) { last = this.rows[this.rows.length-1]; }
	if (last != -1) { this.selectRow(last); }
	return (last == -1 ? false : last);
}

function Table_selectRow(row) {
	if (this.selectedRow) {
		this.selectedRow.deselect();
	}
	this.selectedRow = row;
	this.selectedRow.select();
}


function Table_updateWidth() {
	var index;
	var orig = parseInt(this._div.style.width);
	var max=this._title.innerHTML.length;
	for (var i=0;i<this.rows.length;i++) {
		if (this.rows[i]) {
			if (this.rows[i]._title.innerHTML.length > max) {
				max = this.rows[i]._title.innerHTML.length;
			}
		}
	}
	var new_ = Math.max(TABLE_WIDTH,80+max*LETTER_WIDTH);
	this._div.style.width = new_ + "px";
	if (new_ != orig) {
		this.updateMini();
		/* pokud jsme tabulce zmenili rozmery, musime aktualizovat relace */
		for (var i=0;i<this.rows.length;i++) {
			if (this.rows[i]) {
				this.rows[i].updateRelations();
			} /* if ziva relace */
		} /* for vsechny relace */
	} /* if hybli sme sirkou */
}

function Table_hideShadow() {
	this.s1.className= "";
	this.s2.className= "";
	this.s3.className= "";
}

function Table_updateShadow() {
	this.hideShadow();
	this.s1.className= "shadow_right";
	this.s2.className= "shadow_bottom";
	this.s3.className = "shadow_corner";
}

function Table_setPK(index) {
	this.rows[index].setPK();
}

function Table_losePK(index) {
	this.rows[index].losePK();
}


function Table(x,y,title) {
	var self=this;
	this.base = abstractParent;
	this.base("table");
	this._div.style.width = TABLE_WIDTH + "px";
	this.rows = Array();
	this.selectRow = Table_selectRow;
	this.moveTo = Table_moveTo;
	this.addRow = Table_addRow;
	this.removeRow = Table_removeRow;
	this.updateWidth = Table_updateWidth;
	this.updateMini = Table_updateMini;
	this.updateShadow = Table_updateShadow;
	this.hideShadow = Table_hideShadow;
	this.setPK = Table_setPK;
	this.losePK = Table_losePK;

	this.markbox = OAT.Dom.create("input",{cssFloat:"left",styleFloat:"left"});
	this.markbox.setAttribute("type","checkbox");
	this._div.insertBefore(this.markbox,this._title);
	
	this.setTitle(title);
	this._title.className = "table_title";
	this.selectedRow = null;

	this._rows = OAT.Dom.create("div"); /* sem pujdou radky */
	this._rows.className = "rows"
	
	this._mini = OAT.Dom.create("div");
	this._mini.className = "mini";
	
	/* provazani do stromove struktury */
	var map = $("map");
	map.appendChild(this._mini);
	this._div.appendChild(this._rows);
	
	this.s1 = OAT.Dom.create("div");
	this.s2 = OAT.Dom.create("div");
	this.s3 = OAT.Dom.create("div");

	this._div.appendChild(this.s1);
	this._div.appendChild(this.s2);
	this._div.appendChild(this.s3);
	this.updateShadow();
	
	this.moveTo(x,y);
	this.updateWidth();
	
	OAT.Drag.create(this._title,this._div);
	var obj = this;
	var ref1 = function() {
		for (var i=0;i<obj.rows.length;i++) {
			obj.rows[i].hideRelations();
		}
	} /* callback */
	var ref2 = function() {
		for (var i=0;i<obj.rows.length;i++) {
			obj.rows[i].updateRelations();
			obj.rows[i].showRelations();
		}
	} /* callback */
	OAT.Dom.attach(this._title,"mousedown",ref1);
	OAT.Dom.attach(this._title,"mouseup",ref2);
	
	OAT.Dom.attach(this._div,"mousedown",function(){raise_table(self);});
}


/*
	objekt TableAdmin:
		cudliky na pridani a smazani tabulek, input na zmenu nazvu
		changeName() - zmena nadpisu tabulky
		manageTable, loseTable() - vybrani a odvybrani tabulky
		addTable, delTable() - zruseni a vytvoreni tabulky
	
*/

function TableAdmin_addTable() {
	this.loseTable();
	this._input.value = "[click anywhere to place table]";
	document.body.style.cursor = "crosshair";
	this.last_number++;
	Locks.newTable = 1;
	new_table_name = "table_"+this.last_number;
}

function TableAdmin_delTable() {
	if (!this.table_ref) { return; }
	var title = this.table_ref._title.innerHTML;
	if (!confirm("Really delete table '"+title+"' ?")) { return; }
	remove_table(this.table_ref);
}

function TableAdmin_changeName() {
	
	this.table_ref.setTitle(this._input.value);
	this.table_ref.updateWidth();
}

function TableAdmin_manageTable(table) {
	this.table_ref = table;
	this._input.removeAttribute("disabled");
	this._input.value = table._title.innerHTML;
}

function TableAdmin_loseTable() {
	this.table_ref = null;
	this._input.setAttribute("disabled","true");
	this._input.value = "[no table selected]";
}

function getLateFunc(obj, methodName) {
	return (function() {
			return obj[methodName](this);
	});
}

function TableAdmin() {
	this.manageTable = TableAdmin_manageTable;
	this.loseTable = TableAdmin_loseTable;
	this.changeName = TableAdmin_changeName;
	this.addTable = TableAdmin_addTable;
	this.delTable = TableAdmin_delTable;
	this.last_number = 0; /* pro automaticke cislovani tabulek */
	this.table_ref = null; /* odkaz na prave vybranou tabulku */
	this._div = $("table_admin"); /* cela cast baru pro tabulky */
	this._input = $("table_name");
	
	OAT.Dom.attach("menu_tableadd","click",getLateFunc(this,"addTable"));
	OAT.Dom.attach("menu_tabledel","click",getLateFunc(this,"delTable"));
	OAT.Dom.attach(this._input,"keyup",getLateFunc(this,"changeName"));
	OAT.Dom.attach("menu_align","click",reposition_tables);
	OAT.Dom.attach("menu_clear","click",clear_tables);

	this.loseTable();
}

/*
	objekt RowAdmin:
		cudliky na pridani a smazani radek, resp. budoucich sloupcu
		changeName() - zmena nazvu
		manageTable, loseTable() - vybrani a odvybrani tabulky
		manageRow, loseRow() - vybrani a odvybrani radku
		addRow, delRow() - zruseni a vytvoreni radku
		upRow, downRow() - presun nahoru a dolu
*/

function RowAdmin_upRow() {
	var div = this.row_ref._div;
	var root = div.parentNode;
	var prev = div.previousSibling;
	if (prev) {
		root.insertBefore(div,prev);
		var index_upper = this.table_ref.rows.find(this.row_ref)-1;
		var upperRow = this.table_ref.rows[index_upper];
		this.table_ref.rows.splice(index_upper,1);
		this.table_ref.rows.splice(index_upper+1,0,upperRow);
		this.row_ref.updateRelations();
		upperRow.updateRelations();
	}
}

function RowAdmin_downRow() {
	var div = this.row_ref._div;
	var root = div.parentNode;
	var next = div.nextSibling;
	if (next) {
		root.insertBefore(next,div);
		var index = this.table_ref.rows.find(this.row_ref);
		this.table_ref.rows.splice(index,1);
		var lowerRow = this.table_ref.rows[index];
		this.table_ref.rows.splice(index+1,0,this.row_ref);
		
		this.row_ref.updateRelations();
		lowerRow.updateRelations();
	}
}

function RowAdmin_addRow() {
	if (!this.table_ref) { return; }
	var row = this.table_ref.addRow("row",SQL_DATA_TYPES[1].types[0].type);
	row.setNN();
	row.setSpec(32);
	this.manageRow(row);
	if (this.table_ref.selectedRow) {
		this.table_ref.selectedRow.deselect();
	}
	this.table_ref.selectedRow = row;
	row.select();
}

function RowAdmin_delRow() {
	if (!this.row_ref) { return; }
	var title = this.row_ref._title.innerHTML;
	var title2 = this.table_ref._title.innerHTML;
	if (!confirm("Really delete row '"+title+"' from table '"+title2+"' ?")) { return; }
	var last_row = this.table_ref.removeRow(this.row_ref);
	if (last_row) {
		this.manageRow(last_row); 
	} else {
		this.loseRow();
	}

}

function RowAdmin_changeName() {
	this.row_ref.setTitle(this._input.value);
	this.table_ref.updateWidth();
	this.row_ref.updateTitle();
}

function RowAdmin_changeDef() {
	this.row_ref.setDef(this._def.value);
}

function RowAdmin_changeSpec() {
	this.row_ref.setSpec(this._spec.value);
}

function RowAdmin_manageTable(table) {
	if (this.table_ref != table) {
		/* pokud jsme vybrali nejakou, ktera predtim nebyla vybrana */
		this.loseRow();
		this.table_ref = table; /* reference na tabulku */
		this._input.value = "[no row selected]";
	}
}

function RowAdmin_loseTable(table) {
	/* ztratili jsme tabulku */
	this.loseRow();
	this.table_ref = null;
	this._input.value = "[no table selected]";

}

function RowAdmin_manageRow(row) {
	/* nekdo klikl na radek */
	var index = 0;
	var total = 0;
	for (var i=0;i<SQL_DATA_TYPES.length;i++) {
		for (var j=0;j<SQL_DATA_TYPES[i].types.length;j++) {
			if (row.type == SQL_DATA_TYPES[i].types[j].type) { index = total; }
			total++;
		}
	}

	this.row_ref = row;
	this._input.removeAttribute("disabled");
	this._pk.removeAttribute("disabled");
	this._index.removeAttribute("disabled");
	this._nn.removeAttribute("disabled");
	this._def.removeAttribute("disabled");
	this._type.removeAttribute("disabled");
	this._input.value = row._title.innerHTML;
	this._pk.checked = (row.pk ? true : false);
	this._index.checked = (row.index ? true : false);
	this._nn.checked = (row.nn ? true : false);
	this._def.value = row.def;
	this._type.selectedIndex = index;
	this._spec.value = row.spec;
	var type = get_data_type(row.type);
	if (type.params != "") {
		this._spec.removeAttribute("disabled");
	} else {
		this._spec.setAttribute("disabled","true");
	}
	if (row.pk) {
		this._index.setAttribute("disabled","true");
	}
	
}

function RowAdmin_loseRow() {
	this.row_ref = null;
	this._input.setAttribute("disabled","true");
	this._pk.setAttribute("disabled","true");
	this._index.setAttribute("disabled","true");
	this._nn.setAttribute("disabled","true");
	this._def.setAttribute("disabled","true");
	this._type.setAttribute("disabled","true");
	this._spec.setAttribute("disabled","true");
	this._input.value = "[no row selected]";
}

function RowAdmin_togglePK() {
	/* primary key */
	if (!this.row_ref) { return; }
	var index = parseInt(this.row_ref._div.getAttribute("row_number"));
	if (this._pk.checked) {
		this.table_ref.setPK(index);
		this._index.checked = true;
		this._index.setAttribute("disabled","true");	
	} else {
		this.table_ref.losePK(index);
		this._index.removeAttribute("disabled");	
		this._index.checked = false;
	}
}

function RowAdmin_changeType() {
	/* zmena typu */
	if (!this.row_ref) { return; }
	this.row_ref.setType(this._type.selectedIndex);
	this._def.value = this.row_ref.def;
	var type = get_data_type(this.row_ref.type);
	if (type.params != "") {
		this._spec.removeAttribute("disabled");
	} else {
		this._spec.setAttribute("disabled","true");
	}
}

function RowAdmin_changeIndex() {
	/* zmena index on/off */
	if (!this.row_ref) { return; }
	if (this.row_ref.index) {
		this.row_ref.loseIndex();
	} else {
		this.row_ref.setIndex();
	}
}

function RowAdmin_changeNN() {
	/* zmena index on/off */
	if (!this.row_ref) { return; }
	if (this.row_ref.nn) {
		this.row_ref.loseNN();
	} else {
		this.row_ref.setNN();
	}
}

function RowAdmin() {
	var self = this;
	this.manageRow = RowAdmin_manageRow;
	this.loseRow = RowAdmin_loseRow;
	this.changeName = RowAdmin_changeName;
	this.changeSpec = RowAdmin_changeSpec;
	this.changeDef = RowAdmin_changeDef;
	this.addRow = RowAdmin_addRow;
	this.delRow = RowAdmin_delRow;
	this.upRow = RowAdmin_upRow;
	this.downRow = RowAdmin_downRow;
	this.manageTable = RowAdmin_manageTable;
	this.loseTable = RowAdmin_loseTable;
	this.togglePK = RowAdmin_togglePK;
	this.changeType = RowAdmin_changeType;
	this.changeIndex = RowAdmin_changeIndex;
	this.changeNN = RowAdmin_changeNN;
	
	this.last_number = 0; /* pro automaticke cislovani tabulek */
	this.table_ref = null; /* odkaz na prave vybranou tabulku */
	this.row_ref = null; /* odkaz na prave vybranou radku */
	this._div = $("row_admin"); /* cela cast baru pro tabulky */
	this._input = $("row_name");
	this._pk = $("row_primary");
	this._nn = $("row_notnull");
	this._index = $("row_index");
	this._def = $("row_default");
	this._type = $("row_type");
	this._spec = $("row_spec");
	
	OAT.Dom.attach("menu_rowadd","click",getLateFunc(this,"addRow"));
	OAT.Dom.attach("menu_rowdel","click",getLateFunc(this,"delRow"));
	OAT.Dom.attach("menu_rowup","click",getLateFunc(this,"upRow"));
	OAT.Dom.attach("menu_rowdown","click",getLateFunc(this,"downRow"));
	OAT.Dom.attach(this._input,"keyup",getLateFunc(this,"changeName"));
	OAT.Dom.attach(this._def,"keyup",getLateFunc(this,"changeDef"));
	OAT.Dom.attach(this._spec,"keyup",getLateFunc(this,"changeSpec"));
	OAT.Dom.attach(this._pk,"change",getLateFunc(this,"togglePK"));
	OAT.Dom.attach(this._type,"change",getLateFunc(this,"changeType"));
	OAT.Dom.attach(this._index,"click",getLateFunc(this,"changeIndex"));
	OAT.Dom.attach(this._nn,"click",getLateFunc(this,"changeNN"));

	this.loseRow();
}


function apply_xslt(data, xslt, callback) {
	var xmlDoc = OAT.Xml.createXmlDoc(data);
	var ref = function(text) {
		var xslDoc = OAT.Xml.createXmlDoc(text);
		var result = OAT.Xml.transformXSLT(xmlDoc,xslDoc);
		result = result.documentElement.getElementsByTagName("body")[0].innerHTML;
		callback(result);
	}
	OAT.AJAX.GET(xslt,false,ref);
}

function IOAdmin_save() {
	if (IO.filename == "") {
		dialogs.save.show();
		return;
	}
	
	var recv_ref = function(data) { alert('Saved.'); }
	var callback = function(result) {
		var o = {
			auth:OAT.AJAX.AUTH_BASIC,
			user:http_cred.user,
			password:http_cred.password
		}
		OAT.AJAX.PUT(IO.filename,result,recv_ref,o);
	}

	if (IO.savetype=="sql") {
		var xml = export_xml("",false);
		apply_xslt(xml,"zsql2sql.xsl",callback);
	} else {
		var xslStr = '<?xml-stylesheet type="text/xsl" href="'+$v("options_xslt")+'designview.xsl"?>';
		var xml = export_xml(xslStr,false,true);
		callback();
	}
	
}

function IOAdmin_load() {
	if ($("options_type_http").checked) {
		var name = OAT.Dav.getFile("/DAV/home/"+http_cred.user,".xml");
		if (!name) { return; }
		IO.filename = name;
		OAT.AJAX.GET(name,false,import_xml);
	}
	if ($("options_type_dav").checked) {
		var options = {
			mode:'open_dialog',
			user:$v("user"),
			pass:$v("password"),
			pathDefault:"/DAV/home/"+$v("user")+"/",
			onConfirmClick:function(path,fname,data){
				IO.filename = path+fname;
				return import_xml(data);
			}
		};
		OAT.WebDav.open(options);
	}
}

function IOAdmin() {
	var self = this;
	this.save = IOAdmin_save;
	this.load = IOAdmin_load;
	IO.filename = "";
	IO.savetype = "";

	OAT.Dom.attach("menu_markall","click",function(){for (var i=0;i<table_array.length;i++) if (table_array[i]) table_array[i].markbox.checked = true; });
	OAT.Dom.attach("menu_marknone","click",function(){for (var i=0;i<table_array.length;i++) if (table_array[i]) table_array[i].markbox.checked = false; });
	OAT.Dom.attach("menu_import","click",dialogs.xmla.show);
	OAT.Dom.attach("menu_save","click",self.save);
	OAT.Dom.attach("menu_saveas","click",dialogs.save.show);
	OAT.Dom.attach("menu_load","click",self.load);
	dialogs.save.ok = function() {
		IO.filename = $v("save_name");
		IO.savetype = $v("options_savetype");
		dialogs.save.hide();
		self.save();
	}
}
