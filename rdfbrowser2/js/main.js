/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2012 OpenLink Software
 *
 *  See LICENSE file for details.
 */
var rdfb = false;
var defaultGraph = false;
var dialogs = {};

var http_cred = {
	user:"demo",
	pass:"demo",
	isDav:true
};

var ext_rdf = [
	["rq","rq","Saved SPARQL Query"],
	["isparql","isparql","Saved iSPARQL Query"],
	["n3","n3","N3 RDF"],
	["ttl","ttl","Turtle RDF"],
	["xml","xml","RDF/XML"],
	["rdf","rdf","RDF/XML"]
];
var ext_open = [
	["wqx","wqx","Web Query"]
];
var ext_save = [
	["wqx","wqx","Web Query"]
];

var Search = {
	/*template:'CONSTRUCT { ?s ?p ?o } {dsn} WHERE { ?s ?p ?o . ?o bif:contains "\'{query}\'"}',*/
	//template:'CONSTRUCT { ?s ?p ?o } WHERE { {dsn} }',
	template:'CONSTRUCT { ?s ?p ?o } FROM <fromstr> WHERE {graph ?g {?s ?p ?o. ?o bif:contains <pattern>} union graph ?g {?s ?p ?o filter regex(?o,<pattern>)} } ',
	go:function() {
		var q = $v("search_query");
		if (!q) return;
		var dsn = [];

		var items = $("search_list").getElementsByTagName("input"); // this searches over selected items
		
		/* if (items.length && defaultGraph) { dsn.unshift(defaultGraph); } // what's this?? */
		for (var i=0;i<items.length;i++) {
			if (items[i].checked)
				//dsn.push("{ graph <"+items[i].value+"> {?s ?p ?o . ?o bif:contains \"\'{query}\'\"} }");
				dsn.push(items[i].value);
		}

		if (!dsn.length) {
			alert("You must select search scope.");
			return;
		}

		for (var i=0;i<rdfb.store.items.length;i++)
			rdfb.store.disable(rdfb.store.items[i].href);

		//text = Search.template.replace(/{dsn}/,dsn.join(" UNION ")).replace(/{query}/g,q);
		text = Search.template.replace(/fromstr/,dsn.join(" "));
		text = text.replace(/pattern/g,q);
		rdfb.store.removeAllFilters();
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
			pass:http_cred.pass,
			type:OAT.AJAX.TYPE_XML
		}
		if (ignoreCredentials) { o.auth = OAT.AJAX.AUTH_NONE; }
		OAT.AJAX.GET(filename,false,callback,o);
	},

	loadSession:function() {
		var options = {
			extensionFilters:ext_open,
			callback:function(path,name,data){
				var xmlDoc = OAT.Xml.createXmlDoc(data);
				rdfb.fromXML(xmlDoc);
			}
		};
		OAT.WebDav.openDialog(options);
	},

	loadRDF:function() {
		var options = {
			extensionFilters:ext_rdf,
			callback:function(path,name,data){
				if (name.match(/\.rq$/)) {
					rdfb.fromRQ(data,true);
				} else if (name.match(/\.isparql$/)) {
					var xmlDoc = OAT.Xml.createXmlDoc(data);
					var q = xmlDoc.getElementsByTagName("query")[0];
					rdfb.fromRQ(OAT.Xml.textValue(q),true);
				} else {
					rdfb.store.url.value = path+name;
					rdfb.store.loadFromInput();
				}
			}
		};
		OAT.WebDav.openDialog(options);
	}

}

function init() {

	/* xslt path */
	$("options_xslt").value = OAT.Preferences.xsltPath;
	
	/* load stylesheets */
	OAT.Style.include("grid.css");
	OAT.Style.include("rdftabs.css");
	OAT.Style.include("timeline.css");
	OAT.Style.include("webdav.css");
	
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

	/* menu */
	var m = new OAT.Menu();
	m.noCloseFilter = "noclose";
	m.createFromUL("menu");
	OAT.Event.attach("menu_about","click",dialogs.about.show);
	OAT.Event.attach("menu_options","click",dialogs.options.show);
	OAT.Event.attach("menu_save","click",IO.save);
	OAT.Event.attach("menu_load","click",IO.loadSession);
	OAT.Event.attach("menu_rdf","click",IO.loadRDF);

	OAT.Dom.unlink("throbber");
	var c = $("throbber_content");
	while (c.firstChild) { document.body.appendChild(c.firstChild); }
	OAT.Dom.unlink(c);

	/* browser */
	rdfb = new OAT.RDFBrowser2("browse",{});
	/* RDFBrowser2 is not really part of OAT - OAT namespace is used here because of code similarity and "history reasons" */

	rdfb.addTab("navigator","Navigator",{});
	rdfb.addTab("map","Where",{provider:OAT.MapData.TYPE_Y}); // Yahoo Map
	rdfb.addTab("timeline","When",{}); // Timeline
	rdfb.addTab("fresnel","Who",{defaultURL:"samples/fresnel-foaf.n3",autoload:true}); //People
	rdfb.addTab("images","Images",{});
	rdfb.addTab("triples","Grid view",{});
	rdfb.addTab("tagcloud","Tag Cloud",{});
	//rdfb.addTab("fresnel","Music",{defaultURL:"We don't have a music template yet"});
	rdfb.addTab("svg","SVG Graph",{});
	rdfb.addTab("browser","Raw triples",{});
	rdfb.addTab("fresnel","Custom",{defaultURL:""});
	
	/* history */
	if (window.location.href.match(/history/)) {
		var hs = OAT.Dom.create("select");
		OAT.Dom.option("","",hs);
		for (var i=0;i<window.history.length;i++) {
			OAT.Dom.option(window.history[i],window.history[i],hs);
		}
		var div = OAT.Dom.create("div");
		div.innerHTML = "Browsing history: ";
		div.appendChild(hs);
		rdfb.store.div.parentNode.insertBefore(div,rdfb.store.div);
		hs.selectedIndex = 0;
		OAT.Event.attach(hs,"change",function() {
			if (hs.value != "") { rdfb.store.url.value = hs.value; }
		});
	}
	
	var historyRef = function() {
		var ch = $("options_history");
		if (ch.checked) {
			try {
				netscape.security.PrivilegeManager.enablePrivilege('UniversalBrowserRead');
			} catch (e) {
			alert(e);
				ch.checked = false;
			}
			/* decide based on selection */
		}
	}
	OAT.Event.attach("options_history","change",historyRef);

	/* load */
	var obj = OAT.Dom.uriParams();
	if ("load" in obj && obj.load != "") {
		IO.doLoadWQX(obj.load,true);
	} else {
		$('about_oat_version').innerHTML = OAT.Preferences.version;
		var ver = "$Id$";
		var r = ver.match(/main\.js,v ([^ ]+)/);
		$('about_version').innerHTML = r[1];

		/* look for default graph */
		var ref = function(xmlDoc) {
			var nodes = OAT.Xml.getElementsByLocalName(xmlDoc.documentElement,"DefaultGraph");
			if (nodes && nodes.length) { defaultGraph = OAT.Xml.textValue(nodes[0]); }
		}
		OAT.AJAX.GET("/sparql?ini",null,ref,{type:OAT.AJAX.TYPE_XML,onerror:function(){}});	

		/* initialize webdav gui with http auth options*/
		OAT.WebDav.init(http_cred);
	}

	/* adjust div#MD (=main content) size */	
	var adjustContentWidth = function() {
		var contentwidth = OAT.Dom.getWH(document.body)[0] - OAT.Dom.getWH($('right_toolbar'))[0] - 20;
		$('browse').style.width = contentwidth + 'px';
	}
	adjustContentWidth();

	/* toggle right bar */
	var togglerHide = function() {
		$('toggler').style.backgroundImage = 'url("./imgs/arrow_toggle_show.png")';
		$('right_toolbar').style.width = '10px';
		$('right_toolbar').style.overflow = 'hidden';
		OAT.Event.detach("toggler","click",togglerHide);
		OAT.Event.attach("toggler","click",togglerShow);
		adjustContentWidth();
	}
	var togglerShow = function() {
		$('toggler').style.backgroundImage = 'url("./imgs/arrow_toggle_hide.png")';
		$('right_toolbar').style.width = '302px';
		OAT.Event.detach("toggler","click",togglerShow);
		OAT.Event.attach("toggler","click",togglerHide);
		adjustContentWidth();
	}
	OAT.Event.attach("toggler","click",togglerHide);

	/* right toolbar togglers */
	var rightBarTogglerHide = function(event) {
		if (OAT.Browser.isIE) {
			var elem = event.srcElement;
		} else {
			var elem = event.target;
		}
		if (elem.tagName=='IMG') elem = elem.parentNode;
		$('toggler_'+elem.id).src = './imgs/item_show.png';
		OAT.Dom.hide( $(elem.id+'_ul') );
		OAT.Event.detach(elem,"click",rightBarTogglerHide);
		OAT.Event.attach(elem,"click",rightBarTogglerShow);
	}
	var rightBarTogglerShow = function(event) {
		if (OAT.Browser.isIE) {
			var elem = event.srcElement;
		} else {
			var elem = event.target;
		}
		if (elem.tagName=='IMG') elem = elem.parentNode;
		$('toggler_'+elem.id).src = './imgs/item_hide.png';
		OAT.Dom.show( $(elem.id+'_ul') );
		OAT.Event.detach(elem,"click",rightBarTogglerShow);
		OAT.Event.attach(elem,"click",rightBarTogglerHide);
	}
	OAT.Dom.hide("bookmark_ul");
	OAT.Dom.hide("filters_ul");
	OAT.Dom.hide("prevQueries_ul");
	OAT.Dom.hide("dataRetrievalOpt_ul");
	OAT.Dom.hide("browserOptions_ul");
	//OAT.Dom.hide("category_ul");
	OAT.Event.attach("category","click",rightBarTogglerHide);
	OAT.Event.attach("bookmark","click",rightBarTogglerShow);
	OAT.Event.attach("filters","click",rightBarTogglerShow);
	OAT.Event.attach("prevQueries","click",rightBarTogglerShow);
	OAT.Event.attach("dataRetrievalOpt","click",rightBarTogglerShow);
	OAT.Event.attach("browserOptions","click",rightBarTogglerShow);

	/* storage rounded */
	if (!OAT.Browser.isIE)
		OAT.SimpleFX.roundDiv($("rdf_storage"));

	/* toggle storage */
	var storageTogglerHide = function() {
		OAT.Dom.hide("store_items");
		$("storage_toggle").src = "./imgs/item_show_dark.png";
		$("storage_toggle").title = "Show storage";
		OAT.Event.detach($("storage_toggle"),"click",storageTogglerHide);
		OAT.Event.attach($("storage_toggle"),"click",storageTogglerShow);
	}
	var storageTogglerShow = function() {
		OAT.Dom.show("store_items");
		$("storage_toggle").src = "./imgs/item_hide_dark.png";
		$("storage_toggle").title = "Hide storage";
		OAT.Event.detach($("storage_toggle"),"click",storageTogglerShow);
		OAT.Event.attach($("storage_toggle"),"click",storageTogglerHide);
	}
	OAT.Event.attach($("storage_toggle"),"click",storageTogglerHide);
	
	/* purge storage */
	OAT.Event.attach($("storage_purge"),"click",rdfb.store.clear);
	OAT.Event.attach($("storage_checkall"),"click",rdfb.store.enableAll);
	OAT.Event.attach($("storage_uncheckall"),"click",rdfb.store.disableAll);

	/* search */
	var divsearch = OAT.Dom.create('div');
	divsearch.id = "search";
	var searchinput = OAT.Dom.create('input');
	searchinput.type = "text";
	searchinput.id = "search_query";
	var searchsubmit = OAT.Dom.create('input');
	searchsubmit.type = "button";
	searchsubmit.id = "search_btn";
	searchsubmit.value = "Go";
	divsearch.appendChild(searchinput);
	divsearch.appendChild(searchsubmit);
	OAT.Event.attach(searchsubmit,"click",Search.go);
	OAT.Event.attach(searchinput,"keypress",function(event) {
		if (event.keyCode == 13) { Search.go(); }
	});
	var searchlist = OAT.Dom.create('div'); // div with list of storage items
	searchlist.id = "search_list";
	divsearch.appendChild(searchlist);
	var obj = {
		title:"Search",
		content:divsearch,
		status:"",
		width:300,
		result_control:false,
		activation:"click",
		type:OAT.WinData.TYPE_RECT
	}
	OAT.Anchor.assign("search_button",obj);
	OAT.Event.attach("search_button","click",rdfb.store.redraw);

	/* input box default content */
	var clearQuery = function() {
		var query = $('inputquery');
		query.value = '';
		query.style.color = '#000000';
		OAT.Event.detach(query,"focus",clearQuery);
	}
	var query = $('inputquery');
	query.style.color = "#777777";
	query.value = rdfb.options.defaultQuery;
	OAT.Event.attach(query,"focus",clearQuery);

	/* pragmas */
	var predicates = {
		title:"Select Predicates",
		content:$('predicates_popup'),
		status:"Select more with Ctrl click",
		width:220,
		result_control:false,
		activation:"click",
		type:OAT.WinData.TYPE_RECT
	}
	OAT.Anchor.assign("predicates_select",predicates);

	/* pragmas change */
	OAT.Event.attach($("spongerGetSoft"),"click",function() { 
		var o = { 'get':'soft' };
		OAT.Dereference.setPragmas(o);
	});
	OAT.Event.attach($("spongerGetReplacing"),"click",function() { 
		var o = { 'get':'replacing' };
		OAT.Dereference.setPragmas(o);
	});

	OAT.Event.attach($("spongerGrabAll"),"click",function() { 
		var o = { 
					'sparql_input:grab-all':"yes",
					'sparql_input:grab-seealso':false 
		};
		OAT.Dereference.setPragmas(o);
	});

	OAT.Event.attach($("spongerLimitNodes"),"change",function() { 
		var o = { 'sparql_input:limit':$("spongerLimitNodes").value };
		OAT.Dereference.setPragmas(o);
	});

	OAT.Event.attach($("spongerLimitDepth"),"change",function() { 
		var o = { 'sparql_input:limit-depth':$("spongerLimitDepth").value };
		OAT.Dereference.setPragmas(o);
	});


	var grabSeealsoValues = function() {
		var out = [];
		var preds = $("spongerGrabSeealsoPredicates").options;
		for (var i=0;i<preds.length; i++) {
			var p = preds[i];
			if (p.selected) { 
				var v = "<" + p.value + ">";
				out.push(v);
			}
		}
		var o = { 
					'sparql_input:grab-seealso': out.join(" "), 
					'sparql_input:grab-all':false 
		};
		OAT.Dereference.setPragmas(o);
	}
	OAT.Event.attach($("spongerGrabSeealso"),"click",grabSeealsoValues);
	OAT.Event.attach($("spongerGrabSeealsoPredicates"),"change",grabSeealsoValues);

	/* add predicate */
	OAT.Event.attach($("spongerPredsAdd"),"click",function() {
		var pred = window.prompt("Type new predicate:");
		if (pred) {
			for (var i=0;i<$("spongerGrabSeealsoPredicates").options.length;i++) {
				if ($("spongerGrabSeealsoPredicates").options[i].value==pred) {
					alert("Predicate "+pred+" is already present in the list.");
					return;
				}	
			}
			var l =$("spongerGrabSeealsoPredicates").options.length;
			$("spongerGrabSeealsoPredicates").options[l] = new Option(pred,pred);
		} else {
			alert("No predicate added.");
		}
	});
	/* remove selected predicate */
	OAT.Event.attach($("spongerPredsDel"),"click",function() {
		for (var i=0;i<$("spongerGrabSeealsoPredicates").options.length;i++)
			if ($("spongerGrabSeealsoPredicates").options[i].selected) {
				$("spongerGrabSeealsoPredicates").options[i] = null;
				i--;
			}
	});
	/* restore default set of predicates (ask only if list length is not 0) */
	OAT.Event.attach($("spongerPredsDefault"),"click",function() {
		if ($("spongerGrabSeealsoPredicates").options.length==0 || window.confirm("This will remove custom added predicates. Really restore?")) {
			$("spongerGrabSeealsoPredicates").options.length = 0;
			$("spongerGrabSeealsoPredicates").options[0] = new Option('foaf:knows','foaf:knows');
			$("spongerGrabSeealsoPredicates").options[1] = new Option('sioc:links_to','sioc:links_to');
			$("spongerGrabSeealsoPredicates").options[2] = new Option('rdfs:isDefinedBy','rdfs:isDefinedBy');
			$("spongerGrabSeealsoPredicates").options[3] = new Option('rdfs:seeAlso','rdfs:seeAlso');
			$("spongerGrabSeealsoPredicates").options[4] = new Option('owl:sameAs','owl:sameAs');
		}
	});

}
