/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2007 OpenLink Software
 *
 *  See LICENSE file for details.
 */
var rdfb = false;
var defaultGraph = false;
var dialogs = {};

var http_cred = {
	user:"demo",
	password:"demo",
	isDav:true
};
var ext_open = [
	["wqx","wqx","Web Query"],
	["rq","rq","Saved SPARQL Query"],
	["isparql","isparql","Saved iSPARQL Query"]
];
var ext_save = [
	["wqx","wqx","Web Query"]
];

var Search = {
	template:'SELECT ?s ?p ?o {dsn} WHERE { ?s ?p ?o . ?o bif:contains "\'{query}\'"}',
	go:function() {
		var q = $v("search_query");
		if (!q) { return; }
		var dsn = [];
		
		for (var i=0;i<rdfb.store.items.length;i++) {
			var item = rdfb.store.items[i];
			if (item.href.match(/^http/i)) { dsn.push(item.href); }
		}
		
		if (dsn.length && defaultGraph) { dsn.push(defaultGraph); }
		for (var i=0;i<dsn.length;i++) { dsn[i] = " FROM <"+dsn[i]+"> "; }
		
		var text = Search.template.replace(/{dsn}/,dsn.join("")).replace(/{query}/,q);
		window.query = text;
		rdfb.store.clear();
		rdfb.removeAllFilters();
		rdfb.store.addSPARQL(text);
	}
}

var IO = {
	save:function() {
		var xslStr = '<?xml-stylesheet type="text/xsl" href="'+$v("options_xslt")+'rdfbrowser.xsl"?>';
		var xml = rdfb.toXML(xslStr);
		var options = {
			extensionFilters:ext_save,
			dataCallback:function(file,ext) { return xml; },
			callback:function() { alert("Saved."); }
		};
		OAT.WebDav.saveDialog(options);
	},
	
	doLoadWQX:function(filename,ignoreCredentials) {
		var callback = function(xmlDoc) { rdfb.fromXML(xmlDoc); }
		var o = {
			auth:OAT.AJAX.AUTH_BASIC,
			user:http_cred.user,
			pass:http_cred.password,
			type:OAT.AJAX.TYPE_XML
		}
		if (ignoreCredentials) { o.auth = OAT.AJAX.AUTH_NONE; }
		OAT.AJAX.GET(filename,false,callback,o);
	},

	load:function() {
		var options = {
			extensionFilters:ext_open,
			callback:function(path,name,data){
				if (name.match(/\.wqx$/)) {
					var xmlDoc = OAT.Xml.createXmlDoc(data);
					rdfb.fromXML(xmlDoc);
				} 
				if (name.match(/\.rq$/)) {
					rdfb.fromRQ(data,true);
				}
				if (name.match(/\.isparql$/)) {
					var xmlDoc = OAT.Xml.createXmlDoc(data);
					var q = xmlDoc.getElementsByTagName("query")[0];
					rdfb.fromRQ(OAT.Xml.textValue(q),true);
				}
				return true; /* return false will keep browser open */
			}
		};
		OAT.WebDav.openDialog(options);
	}
}

function init() {

	/* xslt path */
	$("options_xslt").value = OAT.Preferences.xsltPath;
	
	/* ajax http errors */
	$("options_http").checked = (OAT.Preferences.httpError == 1 ? true : false);
	OAT.AJAX.httpError = OAT.Preferences.httpError;
	OAT.Dom.attach("options_http","change",function(){OAT.AJAX.httpError = ($("options_http").checked ? 1 : 0);});

	/* options */
	dialogs.options = new OAT.Dialog("Options","options",{width:400,modal:1});
	dialogs.options.ok = function() {
		rdfb.options.appActivation = $v("options_app");
		dialogs.options.hide();
		rdfb.redraw();
	}
	dialogs.options.cancel = dialogs.options.hide;

	/* about */
	dialogs.about = new OAT.Dialog("About","about_div",{width:400,modal:1});
	dialogs.about.ok = dialogs.about.hide;
	dialogs.about.cancel = dialogs.about.hide;


	/* connection */
	dialogs.connection = new OAT.Dialog("Connection Setup","connection",{width:500,modal:1,buttons:1});
	dialogs.connection.ok = function() {
		http_cred.user = $v("user");
		http_cred.password = $v("password");
		http_cred.isDav = ($v("login_put_type") == "1");
		dialogs.connection.hide();
		var o = {
			user:http_cred.user,
			pass:http_cred.password,
			isDav:http_cred.isDav,
			path:"/DAV/home/"+http_cred.user+"/"
		}
		OAT.WebDav.init(o);
		/* also look for default graph */
		var ref = function(xmlDoc) {
			var nodes = OAT.Xml.getElementsByLocalName(xmlDoc.documentElement,"DefaultGraph");
			if (nodes && nodes.length) { defaultGraph = OAT.Xml.textValue(nodes[0]); }
		}
		OAT.AJAX.GET("/sparql?ini",null,ref,{type:OAT.AJAX.TYPE_XML,onerror:function(){}});
	}
	dialogs.connection.cancel = dialogs.connection.hide;

	/* menu */
	var m = new OAT.Menu();
	m.noCloseFilter = "noclose";
	m.createFromUL("menu");
	OAT.Dom.attach("menu_about","click",dialogs.about.show);
	OAT.Dom.attach("menu_options","click",dialogs.options.show);
	OAT.Dom.attach("menu_save","click",IO.save);
	OAT.Dom.attach("menu_load","click",IO.load);

	OAT.Dom.unlink("throbber");
	var c = $("throbber_content");
	while (c.firstChild) { document.body.appendChild(c.firstChild); }
	OAT.Dom.unlink(c);

	/* browser */
	rdfb = new OAT.RDFBrowser("browse",{defaultURL:""});
	rdfb.addTab("browser","Browser",{});
	rdfb.addTab("navigator","Navigator",{});
	rdfb.addTab("triples","Raw triples",{});
	rdfb.addTab("svg","SVG Graph",{});
	rdfb.addTab("map","Yahoo Map",{provider:OAT.MapData.TYPE_Y});
	rdfb.addTab("timeline","Timeline",{});
	rdfb.addTab("images","Images",{});
	
	/* search */
	OAT.Dom.attach("search_btn","click",Search.go);
	OAT.Dom.attach("search_query","keypress",function(event) {
		if (event.keyCode == 13) { Search.go(); }
	});
	
	/* load */
	var obj = OAT.Dom.uriParams();
	if ("load" in obj && obj.load != "") {
		IO.doLoadWQX(obj.load,true);
	} else {
		$('about_oat_version').innerHTML = OAT.Preferences.version;
		var ver = "$Id$";
		var r = ver.match(/main\.js,v ([^ ]+)/);
		$('about_version').innerHTML = r[1];
		dialogs.connection.show();
	}
}