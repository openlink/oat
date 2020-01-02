/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2020 OpenLink Software
 *
 *  See LICENSE file for details.
 */
function generate_join_list() {
	/* 
		walk through joined tables and create a query
		needs:
		* table_array
		* relations between rows
		* relation types
		* qualifier()
	*/
	
	var result = ""; /* we'll return this one day */

	/* mark all tables as ready */
	for (var i=0;i<table_array.length;i++) {
		if (table_array[i]) { table_array[i].walked = 0; }
	}
	
	/* this cycle goes through all components of table graph */
	var first = 1;
	var startTable=false;
	while ( (startTable = get_startTable()) ) {
		var componentString = get_componentString(startTable);
		if (first) {
			result += componentString;
			first = 0;
		} else {
			result += " CROSS JOIN " + componentString;
		}
	}
	
	/* done */
	return result;
}

function get_joinString(table,row,relation) {
	/* 
		we have a table, row and relation set.
		return the proper JOIN clause
	*/
	var result = "";
	var t1 = relation.parent_1;
	var t2 = relation.parent_2;
	var r1 = relation.row_1;
	var r2 = relation.row_2;
	var side = 0;
	if (t1 == table && r1 == row) { /* which side of relation are we? */
		side = 1; 
		var t = t2;
		var r = r2;
	}
	if (t2 == table && r2 == row) { /* which side of relation are we? */
		side = 2; 
		var t = t1;
		var r = r1;
	}
	if (!side) {
		/* this should not happen */
		alert("Relation walk-through problem, aborting...");
		return false;
	}
	if (t.walked) { return ""; } /* don't visit already done tables */
	switch (relation.type) {
		case JOIN_NATURAL:
			result += " NATURAL JOIN "+qualifier(t);
		break;
		case JOIN_INNER:
			result += " INNER JOIN "+qualifier(t)+" ON "+qualifier(t)+"."+OAT.SqlQueryData.qualifyOne(r.name)+" = "+qualifier(table)+"."+OAT.SqlQueryData.qualifyOne(row.name);
		break;
		case JOIN_LOUTER:
			var type = (side == 1 ? " LEFT OUTER JOIN " : " RIGHT OUTER JOIN ");
			result +=  type+qualifier(t)+" ON "+qualifier(t)+"."+OAT.SqlQueryData.qualifyOne(r.name)+" = "+qualifier(table)+"."+OAT.SqlQueryData.qualifyOne(row.name);
		break;
		case JOIN_ROUTER:
			var type = (side == 2 ? " LEFT OUTER JOIN " : " RIGHT OUTER JOIN ");
			result += type+qualifier(t)+" ON "+qualifier(t)+"."+OAT.SqlQueryData.qualifyOne(r.name)+" = "+qualifier(table)+"."+OAT.SqlQueryData.qualifyOne(row.name);
		break;
	}
	result += recursiveWalk(t);
	return result;
}

function recursiveWalk(table) {
	var result = "";
	table.walked = 1;
	for (var i=0;i<table.rows.length;i++) {
		for (var j=0;j<table.rows[i].relations.length;j++) {
			if (table.rows[i].relations[j]) {
				result += " "+get_joinString(table,table.rows[i],table.rows[i].relations[j])+" ";
			} /* if relation exists */
		} /* for all relations */
	} /* for all rows */
	return result;
}

function get_componentString(startTable) {
	/* walk through component, starting from this table */
	var result = "";
	result += " "+qualifier(startTable)+" "+recursiveWalk(startTable);
	return result;
}

function get_startTable() {
	/* get first table that was not walked through */
	for (var i=0;i<table_array.length;i++) {
		if (table_array[i] && table_array[i].walked == 0) return table_array[i];
	}
	return false;
}
