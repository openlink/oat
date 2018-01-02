/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2018 OpenLink Software
 *
 *  See LICENSE file for details.
 */

var state = 0;

var positions = [
	{container:[35,211],inp:[81,180],btn:[40,177]},
	{container:[134,110],inp:[185,78],btn:[138,74]}
];

var dimensions = [
	{iphone:[387,738],container:[321,364],inp:[230,25]},
	{iphone:[738,387],container:[480,202],inp:[380,25]}
]

function actualize_state() {
	var pos = positions[state];
	for (var p in pos) {
		var elm = $(p);
		elm.style.left = pos[p][0] + "px";
		elm.style.top = pos[p][1] + "px";
	}
	var dims = dimensions[state];
	for (var p in dims) {
		var elm = $(p);
		elm.style.width = dims[p][0] + "px";
		elm.style.height = dims[p][1] + "px";
	}
	$("iphone").style.backgroundImage = "url(iphone"+state+".gif)";
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
	actualize_state();
	var r = new OAT.RDFMini("container",{showSearch:false});
	
	function addURI() {
		var u = $v("inp").trim();
		if (!u) { return; }
		r.open(u);
	}
	
	OAT.Event.attach("btn","click",addURI);
	OAT.Event.attach("inp","keypress",function(event) {
		if (event.keyCode == 13) { addURI(); }
	});
	
	function toggle() {
		state = (state+1) % 2;
		actualize_state();
	}
	OAT.Event.attach("toggle","click",toggle);
}
