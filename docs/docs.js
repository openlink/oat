/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2008 OpenLink Software
 *
 *  See LICENSE file for details.
 */
var TOC = [];
TOC.push(["Basic operation","basic.doc.html"]);
TOC.push(["Obsolete calls","obsolete.doc.html"]);
TOC.push(["Event handling basics","events.doc.html"]);
TOC.push(["Messaging","msg.doc.html"]);
TOC.push(["Security","security.doc.html"]);
TOC.push(["ajax2.js","ajax2.doc.html"]);
TOC.push(["ajax.js - OLD!","ajax.doc.html"]);
TOC.push(["anchor.js","anchor.doc.html"]);
TOC.push(["animation.js","animation.doc.html"]);
TOC.push(["barchart.js","barchart.doc.html"]);
TOC.push(["bezier.js","bezier.doc.html"]);
TOC.push(["calendar.js","calendar.doc.html"]);
// TOC.push(["canvas.js","canvas.doc.html"]);
TOC.push(["color.js","color.doc.html"]);
TOC.push(["connection.js","connection.doc.html"]);
TOC.push(["combobox.js","combobox.doc.html"]);
TOC.push(["combobutton.js","combobutton.doc.html"]);
TOC.push(["combolist.js","combolist.doc.html"]);
TOC.push(["crypto.js","crypto.doc.html"]);
TOC.push(["datasource.js","datasource.doc.html"]);
TOC.push(["dav.js","dav.doc.html"]);
TOC.push(["dialog.js","dialog.doc.html"]);
TOC.push(["dimmer.js","dimmer.doc.html"]);
TOC.push(["dock.js","dock.doc.html"]);
TOC.push(["drag.js","drag.doc.html"]);
TOC.push(["fisheye.js","fisheye.doc.html"]);
TOC.push(["fresnel.js","fresnel.doc.html"]);
TOC.push(["ghostdrag.js","ghostdrag.doc.html"]);
// TOC.push(["graph.js","graph.doc.html"]);
TOC.push(["graphsvg.js","graphsvg.doc.html"]);
TOC.push(["grid.js","grid.doc.html"]);
TOC.push(["instant.js","instant.doc.html"]);
TOC.push(["json.js","json.doc.html"]);
TOC.push(["keyboard.js","keyboard.doc.html"]);
TOC.push(["layers.js","layers.doc.html"]);
TOC.push(["linechart.js","linechart.doc.html"]);
TOC.push(["loader.js","loader.doc.html"]);
TOC.push(["map.js","map.doc.html"]);
TOC.push(["menu.js","menu.doc.html"]);
TOC.push(["n3.js","n3.doc.html"]);
TOC.push(["panelbar.js","panelbar.doc.html"]);
TOC.push(["piechart.js","piechart.doc.html"]);
TOC.push(["pivot.js","pivot.doc.html"]);
TOC.push(["quickedit.js","quickedit.doc.html"]);
TOC.push(["rdf.js","rdf.doc.html"]);
TOC.push(["rdfbrowser.js","rdfbrowser.doc.html"]);
TOC.push(["rdfstore.js","rdfstore.doc.html"]);
TOC.push(["resize.js","resize.doc.html"]);
TOC.push(["rotator.js","rotator.doc.html"]);
TOC.push(["rssreader.js","rssreader.doc.html"]);
TOC.push(["simplefx.js","simplefx.doc.html"]);
TOC.push(["soap.js","soap.doc.html"]);
TOC.push(["sparkline.js","sparkline.doc.html"]);
TOC.push(["sqlquery.js","sqlquery.doc.html"]);
TOC.push(["statistics.js","statistics.doc.html"]);
TOC.push(["tab.js","tab.doc.html"]);
TOC.push(["tagcloud.js","tagcloud.doc.html"]);
TOC.push(["ticker.js","ticker.doc.html"]);
TOC.push(["timeline.js","timeline.doc.html"]);
TOC.push(["toolbar.js","toolbar.doc.html"]);
TOC.push(["tree.js","tree.doc.html"]);
TOC.push(["upload.js","upload.doc.html"]);
TOC.push(["validation.js","validation.doc.html"]);
TOC.push(["window.js","window.doc.html"]);
TOC.push(["ws.js","ws.doc.html"]);
TOC.push(["xml.js","xml.doc.html"]);
TOC.push(["xmla.js","xmla.doc.html"]);

function add_data(data) {
	OAT.Dom.clear("content");
	var div = OAT.Dom.create("div");
	div.innerHTML = data;
	$("content").appendChild(div);
}

function call_for(file) {
	OAT.AJAX.GET(file,false,add_data);
}

function create_ref(elm,file) {
	var callback = function() {	call_for(file);	}
	OAT.Dom.attach(elm,"click",callback);
}

function create_toc() {
	OAT.Drag.create("toc_header","toc");
	$("toggle").state = 1;
	var toggle = function(event) {
		var t = $("toggle");
		t.state++;
		if (t.state == 2) { t.state = 0; }
		if (t.state) {
			OAT.Dom.show("toc_content"); 
			$("toggle").innerHTML = "-";
		} else {
			OAT.Dom.hide("toc_content"); 
			$("toggle").innerHTML = "+";
		}
	}
	OAT.Dom.attach("toggle","click",toggle);

	var ul = OAT.Dom.create("ul");
	for (var i=0;i<TOC.length;i++) {
		var li = OAT.Dom.create("li");
		var a = OAT.Dom.create("span");
		a.className = "link";
		a.innerHTML = TOC[i][0];
		li.appendChild(a);
		ul.appendChild(li);
		create_ref(a,TOC[i][1]);
	}
	$("toc_content").appendChild(ul);
}

function init() {
	create_toc();
}
