/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2019 OpenLink Software
 *
 *  See LICENSE file for details.
 */
var dock = false;
var counter = 0;
var colors = ["#99c","#cc9","#c8c","#9c9"];

function addWin(title) {
	var color = colors[counter % colors.length];
	var div = OAT.Dom.create("div");
	var r = new OAT.RDFMini(div);
	dock.addObject(counter % 3,div,{color:color,title:title,titleColor:"#000"});
	counter++;
	return r;
}

function addURI() {
	var r = addWin($v("uri"));
	r.open($v("uri"));
}

function addSearch() {
	var r = addWin("Search: '"+$v("search")+"'");
	r.search($v("search"));
}

function init() {
	dock = new OAT.Dock("dock_content",3);
	
	OAT.Event.attach("btn1","click",addURI);
	OAT.Event.attach("btn2","click",addSearch);
	OAT.Event.attach("uri","keypress",function(event) {
		if (event.keyCode == 13) { addURI(); }
	});
	OAT.Event.attach("search","keypress",function(event) {
		if (event.keyCode == 13) { addSearch(); }
	});
}
