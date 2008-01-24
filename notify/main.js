/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2007 OpenLink Software
 *
 *  See LICENSE file for details.
 */

var colors = ["#99c","#cc9","#c8c","#9c9"];
var dock = false;
var counter = 0;
var urls = {};

var Url = function(url,div,notify) {
	var self = this;
	this.url = url;
	this.notify = notify;
	this.wakeupTime = false;
	
	this.remove = function() {
		delete urls[self.url];
	}

	this.div = $(div);
	
	this.throbber = OAT.Dom.create("img");
	this.throbber.src = OAT.Preferences.imagePath + "Dav_throbber.gif";
	OAT.Dom.hide(self.throbber);
	
	this.status = OAT.Dom.create("span");;
	self.status.innerHTML = "initializing";
	
	OAT.Dom.append([self.div,self.throbber,OAT.Dom.text(" "),self.status]);
	
	this.parseExpires = function(str) {
		var d = new Date(str.trim());
		if (d.getTime()) { return d; }
		var now = new Date();
		return now;
	}
	
	this.parseCache = function(str) {
		var r = str.match(/max-age=([0-9]+)/);
		if (!r) { return false; }
		var sec = parseInt(r[1]);
		var d = new Date();
		d.setTime(d.getTime() + 1000*sec);
		return d;
	}
	

	this.cb = function(xmlDoc,headers) {
		var content = OAT.Dom.create("div");
		var s = OAT.Dom.create("strong");
		s.innerHTML = self.url;
		OAT.Dom.append([content,s,OAT.Dom.create("br"),OAT.Dom.text("New data!")]);
		self.notify.send(content,{timeout:3000});
		
		self.rdf.store.clear();
		self.rdf.store.addXmlDoc(xmlDoc);
		
		self.headers = headers;
		var h = headers.split("\n");
		var date1 = false;
		var date2 = false;
		for (var i=0;i<h.length;i++) {
			var header = h[i];
			if (!header) { continue; }
			var pos = header.indexOf(":");
			var parts = ["",""];
			parts[0] = header.substring(0,pos);
			parts[1] = header.substring(pos+1);
			if (parts[0] == "Expires") { date1 = self.parseExpires(parts[1]); }
			if (parts[0] == "Cache-Control") { date2 = self.parseCache(parts[1]); }
		}
		var date = new Date();
		if (!date1 && !date2) {
			self.wakeupTime = false;
			self.status.innerHTML = "no expiration set, checking disabled";
		} else { 
			var d = false;
			if (date1) {
				var t = date1.getTime();
				if (!d || t < d.getTime()) { d = date1; }
			}
			if (date2) {
				var t = date2.getTime();
				if (!d || t < d.getTime()) { d = date2; }
			}
			if (d.getTime() <= date.getTime()) {
				/* in past */
				var sec = 10;
				date.setTime(date.getTime() + 1000*sec);
				self.wakeupTime = date; /* after 10 sec */
				self.status.innerHTML = "already expired, check in "+sec+" seconds";
			} else {
				/* in future */
				self.wakeupTime = d;
				self.status.innerHTML = "expires on "+d.toHumanString();
			}
		}
	}
	
	this.check = function() {
		self.wakeupTime = false; /* prevent further checks until solved */
		var o = {
			onstart:function() { OAT.Dom.show(self.throbber); },
			onend:function() { OAT.Dom.hide(self.throbber); },
			type:OAT.AJAX.TYPE_XML
		}
		var path = "/proxy?url="+encodeURIComponent(self.url)+"&force=rdf";
		OAT.AJAX.GET(path,false,self.cb,o);
	}
}

var add = function(notify) {
	var url = $v("inp").trim();
	if (!url) { return; }
	if (url in urls) { 
		alert("We already have this!");
		return;
	}
	
	var tabs = [
				["browser","Browser",{removeNS:true}],
				["navigator","Navigator"],
				["triples","Raw Triples",{}],
				["map","Yahoo Map",{provider:2}],
				["timeline","Timeline",{}],
				["images","Images",{}]
	];

	var container = OAT.Dom.create("div");
	var rdfdiv = OAT.Dom.create("div");
	var statusdiv = OAT.Dom.create("div");
	var color = colors[counter % colors.length];

	var win = dock.addObject(counter++ % 3,container,{color:color,title:url,titleColor:"#000"});

	var r = new OAT.RDFMini(rdfdiv,{showSearch:false,tabs:tabs});

	var obj = new Url(url,statusdiv,notify); /* refreshing url object */
	OAT.Dom.append([container,statusdiv,rdfdiv]);
	
	obj.win = win;
	obj.rdf = r;
	
	urls[url] = obj;
	obj.check();
}

var timeout = 1000*5; /* 5 sec */

function globalChecker() {
	var d = new Date();
	var t = d.getTime();
	for (var p in urls) {
		var item = urls[p];
		if (item.wakeupTime && item.wakeupTime.getTime() <= t) { item.check(); }
	}
	setTimeout(globalChecker,timeout);
}

function init() {
	dock = new OAT.Dock("dock_content",3);
	notify = new OAT.Notify();

	OAT.MSG.attach(dock,OAT.MSG.DOCK_REMOVE,function(source,message,win){
		var victim = false;
		for (var p in urls) {
			var obj = urls[p];
			if (obj.win == win) { victim = obj; }
		}
		if (victim) { victim.remove(); }
	});
	OAT.Event.attach("btn","click",add);
	OAT.Event.attach("inp","keypress",function(event){
		if (event.keyCode == 13) { add(notify); }
	});
	globalChecker();
	
	/**/
	$("inp").value = "http://www.weather.com/"; add(notify);
	$("inp").value = "http://www.bbc.co.uk/"; add(notify);
	$("inp").value = "http://www.cnn.com/"; add(notify);
	$("inp").value = "http://www.nasdaq.com/"; add(notify);
	$("inp").value = "";
	/**/
	
}
