/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2018 OpenLink Software
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


// Curie cache

var CurieCache = {
    self: this,
    uri_curie_h: {},
    curie_uri_h: {},
    store: false,
    init: function () { return },
    
    uri_to_curie:function(uc_str) {
	return ((uc_str in CurieCache.uri_curie_h) ? CurieCache.uri_curie_h[uc_str] : uc_str);
    },
    
    curie_to_uri:function(cu_str) {
	return ((cu_str in CurieCache.curie_uri_h) ? CurieCache.curie_uri_h[cu_str] : cu_str);
    },
    
    exists:function(_uri) { 
	if (CurieCache.uri_curie_h[_uri]) return true;
	else return false;
    },
    
    looks_like_uri:function(_str) {
	if (_str.match (/^http/)) return true;
	else return false;
    },
    
    init_from_store:function(store, msg, evt) {
	if (CurieCache.store == false) return;
	var q_arr = [];
	
	for (var i=0;i<CurieCache.store.data.triples.length;i++) {
	    for (var j=0; j < 3;j++) {		
		if (j == 2 && ! CurieCache.looks_like_uri(CurieCache.store.data.triples[i][2])) // Non-URI in ?o
		continue;
		
		var col = CurieCache.store.data.triples[i][j];
		
		if (typeof col != 'undefined' && !col.match(/#b\d*$/) && !CurieCache.exists(col)) 
		    q_arr.push(col);
	    }
	}
	CurieCache.load (q_arr, false);
    },
    
    // return array with ns and elem
    split_ns:function(_uri) {
	var elms = _uri.split(/([^\/#]+)[\/#]?$/);
	if (elms[elms.length-1] == this) { }
    },
    
    simplify:function(_uri) {
	var _curie = CurieCache.uri_to_curie (_uri);
	
	if (_curie != _uri) return (_curie);
	
	else {
	    var r = _uri.match(/([^\/#]+)[\/#]?$/);
	    if (r && r[1] == "this") {
		r = _uri.match(/([^\/#]+)#[^#]*$/);
	    }
	    return (r ? r[1] : _uri);
	}
    },
    
    load:function(cq_arr, _async) {
	var process_reply = 
	    function(reply_data) {
		var reply_s = OAT.JSON.deserialize (reply_data);
		
		//	  alert ("got " + reply_s.results.length + " replies from curie service");
		
		// maintaining the 2 "hash tables" for CURIE conversion
		
		if (!reply_s) return;
		for (var i = 0; i < reply_s.results.length; i++) {
		    if (!(reply_s.results[i].uri in CurieCache.uri_curie_h)) {
			CurieCache.uri_curie_h[reply_s.results[i].uri] = reply_s.results[i].curie; 
			CurieCache.curie_uri_h[reply_s.results[i].curie] = reply_s.results[i].uri;
		    }
		}
		OAT.MSG.send (CurieCache, "CURIE_CACHE_UPDATED",{});
	    };
	
	var q = Search.endpoint.replace(/sparql?/,'services/rdf/curies.get?');
	var d = "";
	var hdr = { "Content-type":"application/x-www-form-urlencoded" };
	
	for (var i = 0; i < cq_arr.length; i++)
	{
	    var uri = cq_arr[i];
	    d = d + "uri=" + encodeURIComponent(uri) + '&';
	}
	
	if (cq_arr.length)
	    OAT.AJAX.POST (q, d, process_reply,{type:OAT.AJAX.TYPE_TEXT, async:_async, headers: hdr});
    }
}

var Status = {
    redraw: function () {},
    init: function (){},
    reset: function (){},
    hide: function (){},
    show: function (){}
}

var Search = {
    propQuery:        "SELECT DISTINCT ?class ?prop #{from} WHERE { ?x a ?class . ?x ?prop ?y }",
    findQuery:        "#{pragmas} CONSTRUCT {?s ?p ?o} #{from} WHERE { { SELECT DISTINCT ?s WHERE { ?s ?p1 ?o1 . ?o1 bif:contains '#{term}' . #{filter} } } ?s ?p ?o. }",
    filterQuery:      "#{classfilter} FILTER (?o2 = str(?o1))",
    classfilterQuery: "{ ?s a <#{class}> . #{propfilter} }",
    propfilterQuery:  "{ ?s <#{prop}> ?o2 }",
    
    term:"",
    from:"",
    filter:"",
    
    scope:[],
    props:[],
    propStore:[],
    propTree:false,
    
    pending:false,
    notify:false,
    
    endpoint:false,
    //defines:' define get:soft "replacing" ',
    defines:"",
    
    rdfStore:{},
    
    /* initializes Search dom tree */
    init:function() {
	var divsearch     = OAT.Dom.create ('div');
	divsearch.id      = "search";
	
	var searchtypesel = OAT.Dom.create ('select');
	searchtypesel.id  = "search_type_sel";
	OAT.Dom.option ('Smart Search', 1, searchtypesel);
	OAT.Dom.option ('SPARQL full text', 2, searchtypesel);
	
	var searchinput   = OAT.Dom.create ('input');
	searchinput.type  = "text";
	searchinput.id    = "search_query";
	
	var searchsubmit   = OAT.Dom.create ('input');
	searchsubmit.type  = "button";
	searchsubmit.id    = "search_submit";
	searchsubmit.value = "Go";
	
	var divprops      = OAT.Dom.create ('div');
	var searchlist    = OAT.Dom.create ('ul');
	searchlist.id     = "search_list";
	
	var treediv       = OAT.Dom.create ("div");
	treediv.id        = "search_tree_div";

	var proptree      = OAT.Dom.create ("ul");
	proptree.id       = "search_tree";
	
	OAT.Dom.append([treediv,proptree]);
	OAT.Dom.append([divsearch,searchtypesel,searchinput,searchsubmit,divprops,searchlist,treediv]);
	
	//		OAT.Event.attach(searchtypesel,"change",Search.changeType);
	OAT.Event.attach (searchsubmit, "click", Search.go);
	OAT.Event.attach (searchinput, "keypress", function(event) {
	    if (event.keyCode == 13) { Search.go(); }
	});
		
	var obj = {
	    title:"Find",
	    content:divsearch,
	    status:"",
	    width:600,
	    height:230,
	    preload:true,
	    activation:"click",
	    buttons: "c",
	    type:OAT.Win.Rect
		}

	OAT.Anchor.assign("search_button",obj);
	OAT.Event.attach("search_button","click", Search.rdfStore.redraw);
	OAT.Event.attach("search_button","click", function() { searchinput.focus(); });
	
	Search.propTree = new OAT.Tree();
	Search.propTree.assign("search_tree",0);
	
	OAT.MSG.attach("*","STORE_LOADED",        function(sender,msg,content) { Search.addURL(content.url); });
	OAT.MSG.attach("*","STORE_REMOVED",       function(sender,msg,content) { Search.remove(content.url); Search.rebuild();});
	OAT.MSG.attach("*","STORE_DISABLED",      function(sender,msg,content) { Search.disable(content.url); Search.rebuild(); });
	OAT.MSG.attach("*","STORE_ENABLED",       function(sender,msg,content) { Search.enable(content.url); Search.rebuild();});
	OAT.MSG.attach("*","STORE_CLEARED",       function(sender,msg)         { Search.clear(); Search.rebuild(); });
	OAT.MSG.attach("*","CURIE_CACHE_UPDATED", function(sender,msg)         { Search.rebuild(); });
	
	
    },
    changeType:function(e) {
	Search.notify.send ("type changed");
    },
    
    findIndex:function(url) {
	var index = -1;
	for (var i=0; i<Search.propStore.length; i++) {
	    var item = Search.propStore[i];
	    if (item.url == url) { index = i; break; }
	}
	return index;
    },
    
    findLocal:function(url) {
	var crit = [];
	var triples = [];
	var matches = [];
	
	/* strip " from search term and create a regex */
	var reg = new RegExp(Search.term.replace(/^"/,"").replace(/"$/,""));
	
	/* get filtering criteria */
	for (var i=0;i<Search.props.length;i++) {
	    var classname = Search.props[i].url;
	    var propnames = Search.props[i].data;
	    for (var j=0;j<propnames.length;j++) {
		var propname = propnames[j];
		crit.push([classname,propname]);		
	    }
	}
	
	/* search only scoped items */
	for (var i=0;i<Search.scope.length;i++) {
	    var href = Search.scope[i];
	    var index = Search.rdfStore.findIndex(href);
	    triples.append(Search.rdfStore.items[index].triples);
	}
	
	/* get matching triples */
	for (var i=0;i<triples.length;i++) {
	    var t = triples[i];
	    var s = t[0]; 
	    var p = t[1];
	    var o = t[2];
	    /* no criteria, just look for matching objects */
	    if (!crit.length && reg.test(o)) {
		matches.push(t);
		continue;
	    }
	    /* match against list of criteria */
	    for (var j=0;j<crit.length;j++) {
		var classname = crit[j][0];
		var propname = crit[j][1];
		/* match will short circuit the if most often / is slowest
				 * try to experiment here */
		if (reg.test(o) && s == classname && p == propname) { matches.push(t); break; }
	    }
	}
	
	if (!matches.length) {
	    Search.notify.send("Nothing found. Please, try to refine your search.");
	} else {
	    Search.rdfStore.addTripleList(matches, url, "Local search results for:" + Search.term);
	}
    },
    
    checkFindResults:function(url) {
	var index = Search.rdfStore.findIndex(url);
	var triples = Search.rdfStore.items[index].triples;
	
	/* OK, search yielded results */
	if (triples.length) { return; }
	
	/* no results */
	
	/* remove uri from rdfstore */
	Search.rdfStore.remove(url);
	
	// Search.notify.send ("No matches found via remote search, searching in local cache.");
	/* and search in the local local storage */
	Search.findLocal(url);
    },
    
    
    addURL:function(url) {
	var index = Search.findIndex(url);
	
	/* previous query was a sparql search, don't add, just check the results */
	if (!url.indexOf(Search.endpoint)) { 
	    Search.checkFindResults(url);
			return;
		}

	/* bnode - XXX you *can* dereference these on Virtuoso */
	
	if (!url.match(/^http/)) { return; } // || !url.match(/^nodeID/)) { return; }

    var q = Search.defines + Search.propQuery;
    
    q = q.replace(/#{pragmas}/,rdfb.makePragmaDefines());
    
    q = q.replace(/#{from}/,"FROM <" + url + ">");
    q = Search.endpoint + "/?query=" + encodeURIComponent(q);
    
    var search_addurl_qry_cb = function(_data) {
	var cq_arr = [];
	var urlobj = { url:url, data:[], enabled:true };
	
	var obj = {};
	var rows = _data.getElementsByTagName ("tr");
	
	for (var i=0;i<rows.length;i++) { 
	    var cols = rows[i].getElementsByTagName("td"); 
	    if (!cols.length) { continue; }
	    var classname = OAT.Xml.textValue(cols[0].firstChild);
	    var propname = OAT.Xml.textValue(cols[1].firstChild);
	    
	    if (!(classname in obj)) { obj[classname] = []; }
	    
	    cq_arr[classname] = true;
	    cq_arr[propname] = true;
	    
	    var propobj = { url:propname, data:false, enabled:true }
	    obj[classname].push(propobj);
	}
	
	for (var classname in obj) {
	    var classobj = { url:classname, data:obj[classname], enabled:true }
	    urlobj.data.push(classobj);
	}
	
	Search.rebuildTree();
	Search.propStore.push(urlobj);
	Search.rebuild();
    }
    
    var onerror = function(xhr) {
	var msg = "Could not retrieve property information for find scoping.<br/>";	
	msg += "Error description: " + xhr.obj.status + " : " + xhr.obj.statusText + "<br/>";
	msg += "Please, try again later.";
	Search.notify.send(msg, {width:400, height:100, timeout: 5000});
    };

    var hdrs = { Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*\/*;q=0.8" };
    OAT.AJAX.GET (q, 
 		  false,
		  search_addurl_qry_cb,
                  {type:OAT.AJAX.TYPE_XML, headers: hdrs});
},

remove:function(url) {
    var index = Search.findIndex(url);
	if (index == -1) { return; }
	Search.propStore.splice(index,1);
	Search.rebuildTree();
	Search.rebuildDSList();
    },
    
    disable:function(url) {
	var index = Search.findIndex(url);
	if (index == -1) { return; }
	Search.propStore[index].enabled = false;
    },
    
    enable:function(url) {
	var index = Search.findIndex(url);
	if (index == -1) { return; }
	Search.propStore[index].enabled = true;
    },
    
    clear:function() {
	Search.propStore = [];	
	Search.rebuildTree();
	Search.rebuildDSList();
    },
    
    /* performs final query and if no results are returned, fallbacks to local storage search */
    
    find:function() {
	var q = Search.findQuery;
	var from = [];
	
	if (Search.type == '1') { // "smart" query - non-SPARQL
	    var params = [];
	    for (var i = 0;i < Search.scope.length; i++) {
		var url = Search.scope[i];
			params.push("default-graph-uri" + "=" + url);
		    }

		    params.push ("find" + "=" + Search.term);
		    var search_url = "?";

		    for (var i = 0;i < Search.props.length; i++) {
			var class_url = Search.props[i]["url"];
			params.push ("class" + "=" + "<" + CurieCache.curie_to_uri(class_url) + ">");
		    }
		    
		    params.push ("format" + "=" + "application/rdf%2Bxml");

		    for (var i=0;i<Search.rdfStore.items.length;i++) { Search.rdfStore.disable(Search.rdfStore.items[i].href); }
		    Search.rdfStore.removeAllFilters();
		    Search.rdfStore.addURL (search_url + params.join("&"), 
					    {title: "Search results for: " + Search.term,endpoint:Search.endpoint,direct:true});
		}
		else {
		    /* from */

		    for (var i=0;i<Search.scope.length;i++) {
			var url = Search.scope[i];
			from.push("FROM <" + CurieCache.curie_to_uri(url) + ">");
		    }

		    Search.from = from.join(" ");

		    var classfilters = [];

		    for (var i=0;i<Search.props.length;i++) {
			var classname = Search.props[i]["url"];
			var propnames = Search.props[i]["data"];
			var propfilters = [];
			
			for (var j=0;j<propnames.length;j++) {
			    var propname = propnames[j];
			    propfilters.push(Search.propfilterQuery.replace(/#{prop}/,CurieCache.curie_to_uri(propname)));
			}
			
			var cfq = Search.classfilterQuery;
			cfq = cfq.replace(/#{class}/,classname);
			cfq = cfq.replace(/#{propfilter}/,propfilters.join(" UNION "));
			classfilters.push(cfq);
		    }

		    if (classfilters.length) { 
			Search.filter = Search.filterQuery.replace(/#{classfilter}/,classfilters.join(" UNION "));
		    }
		    
		    q = q.replace (/#{term}/,Search.term);
		    q = q.replace (/#{from}/,Search.from);
		    q = q.replace (/#{filter}/,Search.filter);
		    q = q.replace (/#{pragmas}/,rdfb.makePragmaDefines());

		    /* Disable current graphs in cache - only display search result when finished */

		    for (var i = 0; i < Search.rdfStore.items.length; i++) { 
			Search.rdfStore.disable (Search.rdfStore.items[i].href); 
		    }

		    Search.rdfStore.removeAllFilters();
		    Search.rdfStore.addSPARQL(Search.defines + q, "Search results for: "+ Search.term);
		}
	},

	rebuildTree:function()
	{
		var builddom = function(elm,node) {
			if (!node.enabled) { return; }

			var _uri = CurieCache.uri_to_curie(node.url);

			var li = OAT.Dom.create("li");
			li.innerHTML = _uri;

			OAT.Dom.append([elm,li]);

			/* leaf */
			if (node.data == false)	{ return; }

			var ul = OAT.Dom.create("ul");
			OAT.Dom.append([li,ul]);

			for (var i = 0; i < node.data.length; i++) {
				var child = node.data[i];
				builddom(ul,child);
			}
		}
		OAT.Dom.clear("search_tree");
		OAT.Dom.hide("search_tree");

		for (var i=0; i < Search.propStore.length; i++) { 
		    builddom($("search_tree"),Search.propStore[i]); 
		}

		Search.propTree.assign("search_tree",1);
		OAT.Dom.show("search_tree");
	},

	rebuildDSList:function() {
		OAT.Dom.clear("search_list");

		var comment = OAT.Dom.create("div");
		if (!Search.propStore.length) {
			comment.innerHTML = "Nothing to search in.";
		} else {
			comment.innerHTML = "Search in graphs:";
		}

		OAT.Dom.append(["search_list",comment]);

		var callback = function(event) {
			var cb = event.target;
			var url = cb.value;
			if (cb.checked) { Search.enable(url); } else { Search.disable(url); }
			Search.rebuildTree();
		}

		for (var i=0;i<Search.propStore.length;i++) {
			var item = Search.propStore[i];
			var id = "searchscope" + i;

			var li = OAT.Dom.create("li");

			var cbox   = OAT.Dom.create("input");
			cbox.type  = "checkbox";
			cbox.value = item.url;
			cbox.id    = id;

			var label = OAT.Dom.create("label");
			label.setAttribute ("for", id);
			label.innerHTML = item.url.truncate(40);

			OAT.Dom.append([li,cbox,label]);
			OAT.Dom.append(["search_list",li]);

			if (item.enabled) { cbox.checked = "checked"; }
			OAT.Event.attach(cbox,"click",callback);
		}
	},

	rebuild:function() {
		Search.rebuildTree();
		Search.rebuildDSList();
	},

	go:function() {
		Search.props = [];
		Search.scope = [];

		Search.term = "";
		Search.type = "";
		Search.from = "";
		Search.filter = "";

		Search.term = $v("search_query");
		if (!Search.term) { 
		    Search.notify.send ("Please enter a search term or phrase."); 
		    return; 
		}

		Search.type = $v("search_type_sel");
		
		for (var i=0;i<Search.propStore.length;i++) {
			var item = Search.propStore[i];
			if (item.enabled) { Search.scope.push(item.url); }
		}

		// XXXMOD ghard
		//		if (!Search.scope.length && Search.type != '1') { 
		//    Search.notify.send ("Please select at least one graph to search in."); 
		//    return; 
		//}

		var urlnodes = Search.propTree.tree.children;

		/* datasources */
	    
		for (var i = 0; i < urlnodes.length; i++) {
			var urlnode = urlnodes[i];
			
			/* classes */
			for (var j=0;j<urlnode.children.length;j++) {
				var classnode = urlnode.children[j];
				var classname = classnode.getLabel();
				var all = false;
				var o = { url:classname, data:[] };

				/* whole class selected, get all props */
				if (classnode.selected) { all = true;}

				/* props */
				for (var k=0;k<classnode.children.length;k++) {
					var propnode = classnode.children[k];
					var propname = propnode.getLabel();
					if (propnode.selected || all) { o.data.push(propname); }
				}

				/* class had any props selected */
				if (o.data.length) { Search.props.push(o); }
			}
		}
		Search.find();
	}
}

var StartScreen = {
    rdfStore: {},
    go_find:function() {
	$("search_query").value = $v("find_txt_input");
	OAT.Dom.show("find_full_thr");
	Search.go();
    },
    go_deref:function() {
	$("inputquery").value = $v("find_txt_input");
	OAT.Dom.show("find_full_thr");
	StartScreen.rdfStore.loadFromInput();
    },
    init:function() {
	OAT.Event.attach ("find_txt_input", 
			  "keypress", 
			  function (event) {
			      if (event.keyCode == 13) {
				  if ($v("find_txt_input").match(/https?:\/\//)) {
				      StartScreen.go_deref();
				  }
				  else {
				      StartScreen.go_find();
				  }
			      }
			  });
	OAT.Event.attach ("find_find_btn","click",StartScreen.go_find);
	OAT.Event.attach ("find_deref_btn","click",StartScreen.go_deref);
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

    OAT.Preferences.showAjax = OAT.AJAX.SHOW_NONE;
    OAT.Preferences.httpError = 0;
    
    if (OAT.Browser.isChrome()) {
	OAT.Preferences.imagePath = '../images/';
	OAT.Preferences.stylePath = '../styles/';
	OAT.Preferences.xsltPath  = '../xslt/';
    }
    
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
    OAT.Event.attach("options_http","change",function(){ OAT.AJAX.httpError = ($("options_http").checked ? 1 : 0);});

	/* options */
	dialogs.options = new OAT.Dialog("Options","options",{width:400,modal:1});
    OAT.MSG.attach(dialogs.options, "DIALOG_OK", function() {
		rdfb.options.appActivation = $v("options_app");
		rdfb.redraw();
	rdfb.options.endpoint = $('options_endpoint').getElementsByTagName('input')[0].value;
    });

	/* about */

	dialogs.about = new OAT.Dialog("About","about_div",{width:400,modal:1});
    
    /* start page help */
    
    dialogs.find_help_d = new OAT.Dialog("Help","find_help",{width:400,modal:0,buttons:0});
    OAT.Event.attach ("find_help_ok_b", "click", dialogs.find_help_d.close);

	/* menu */
    
	var m = new OAT.Menu();
	m.noCloseFilter = "noclose";
	m.createFromUL("menu");
    
    OAT.Event.attach("menu_about",  "click",dialogs.about.open);
    OAT.Event.attach("menu_options","click",dialogs.options.open);
	OAT.Event.attach("menu_save","click",IO.save);
	OAT.Event.attach("menu_load","click",IO.loadSession);
	OAT.Event.attach("menu_rdf","click",IO.loadRDF);

    OAT.Event.attach("find_help_a", "click",dialogs.find_help_d.open);
    
	OAT.Dom.unlink("throbber");
	var c = $("throbber_content");
    
	while (c.firstChild) { document.body.appendChild(c.firstChild); }
    
	OAT.Dom.unlink(c);

	/* browser */
    
	rdfb = new OAT.RDFBrowser2("browse",{});

    /* initialize search */
    Search.rdfStore = rdfb.store;
    Search.notify = rdfb.notify;
    Search.endpoint = rdfb.options.endpoint;
    Search.init();
    
    /* initialize start screen */
    
    StartScreen.init();
    StartScreen.rdfStore = rdfb.store;
    
    var br_tab = rdfb.addTab("browser",  "What", {});
    OAT.MSG.attach ("*", "CONTENT_RESIZE", br_tab.resize)
    
    rdfb.addTab("map",      "Where",{provider:OAT.Map.TYPE_G3}); // Google Map
	rdfb.addTab("timeline","When",{}); // Timeline
    rdfb.addTab("fresnel",  "Who",
		{	
		    defaultURL:"samples/fresnel-foaf.n3",
		    autoload:true,
		    description:"This module projects data on people using a fresnel template",
		    desc:"People"}); //People
    
	rdfb.addTab("images","Images",{});
	rdfb.addTab("triples","Grid view",{});
	rdfb.addTab("tagcloud","Tag Cloud",{});
	//rdfb.addTab("fresnel","Music",{defaultURL:"We don't have a music template yet"});
	rdfb.addTab("svg","SVG Graph",{});
    rdfb.addTab("navigator", "Navigator",{});
	rdfb.addTab("fresnel","Custom",{defaultURL:""});
	
    OAT.MSG.attach("*", "STORE_LOADED", CurieCache.init_from_store);
    
    /* load data if url contains datasources */
    rdfb.store.loadFromURL();
    
    /* custom endpoint config in browser options */
    var cl = new OAT.Combolist ([rdfb.options.endpoint, "http://demo.openlinksw.com/sparql"], rdfb.options.endpoint);
    
    $("options_endpoint").appendChild(cl.div);
    
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
	
//
// The codebase_principal_support preference and enablePrivilege function 
//   are considered unsafe to use and support for them will be removed from 
//   Firefox very soon: https://bugzilla.mozilla.org/show_bug.cgi?id=546866
//
//    var historyRef = function() {
//	var ch = $("options_history");
//	if (ch.checked) {
//	    try {
//		netscape.security.PrivilegeManager.enablePrivilege('UniversalBrowserRead');
//	    } catch (e) {
//		alert(e);
//		ch.checked = false;
//	    }
//	    /* decide based on selection */
//	}
//    }
//
//    OAT.Event.attach("options_history","change",historyRef);

	/* load */
	var obj = OAT.Dom.uriParams();
	if ("load" in obj && obj.load != "") {
		IO.doLoadWQX(obj.load,true);
	} else {
		$('about_oat_version').innerHTML = OAT.Preferences.version;
	var v = "OAT v" + OAT.Preferences.version;
	$('about_oat_build').innerHTML = OAT.Preferences.build;
	v += " build " + OAT.Preferences.build;
		var ver = "$Id$";
		var r = ver.match(/main\.js,v ([^ ]+)/);
		$('about_version').innerHTML = r[1];
	//		$('copyright').innerHTML += "Version " +  r[1] + " (" + v + ")";

		/* look for default graph */
	
		var ref = function(xmlDoc) {
			var nodes = OAT.Xml.getElementsByLocalName(xmlDoc.documentElement,"DefaultGraph");
			if (nodes && nodes.length) { defaultGraph = OAT.Xml.textValue(nodes[0]); }
		}
	
	OAT.AJAX.GET("/sparql?ini",null,ref,{type:OAT.AJAX.TYPE_XML,headers:{Accept: "application/rdf+xml"},onerror:function(){}});	

		/* initialize webdav gui with http auth options*/
	http_cred.imagePath = OAT.Preferences.imagePath;
		OAT.WebDav.init(http_cred);
	}

    var adjustImageMaxWidth = function () {
	var img_list = $('browse')
    }
    
	/* adjust div#MD (=main content) size */	
	var adjustContentWidth = function() {
	var contentwidth = OAT.Dom.getWH(document.body)[0] - OAT.Dom.getWH($('right_toolbar'))[0] - 40;
		$('browse').style.width = contentwidth + 'px';
	OAT.MSG.send (self, "CONTENT_RESIZE", {w: contentwidth});
	}

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
	if (OAT.Browser.isIE) { // XXX OAT should have functionality to make it unnecessary to test for IE in code like this
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
    
    // Should use OAT accordeon behaviour for this stuff...
    
	OAT.Event.attach("category","click",rightBarTogglerHide);
	OAT.Event.attach("bookmark","click",rightBarTogglerShow);
	OAT.Event.attach("filters","click",rightBarTogglerShow);
	OAT.Event.attach("prevQueries","click",rightBarTogglerShow);
	OAT.Event.attach("dataRetrievalOpt","click",rightBarTogglerShow);
	OAT.Event.attach("browserOptions","click",rightBarTogglerShow);

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
    OAT.Event.attach($("storage_purge"),      "click", rdfb.purgeStore);
	OAT.Event.attach($("storage_checkall"),"click",rdfb.store.enableAll);
	OAT.Event.attach($("storage_uncheckall"),"click",rdfb.store.disableAll);
    OAT.Event.attach($("storage_invertsel"),  "click", rdfb.store.invertSel);
    OAT.Event.attach($("storage_refreshall"), "click", function() {
	for (var i=0;i<rdfb.store.items.length;i++) {
	    var url = rdfb.store.items[i].href;
	    rdfb.store.remove(url);
	    var xhr = rdfb.store.addURL(url);
	    self.load_indicator_add (xhr, url);
	}
    }
		    );

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
	var spongerLimitNodes = new OAT.Combolist(["default", "100", "200","300","400","500"], 
						  "default",{onblur:function() {
		var v = spongerLimitNodes.value.trim();
		if (!v.match(/^\d*$/)) v = "";
		var o = { 'sparql_input:grab-limit':v };
		rdfb.setPragmas(o);
						      }});

	$("spongerLimitNodes").appendChild(spongerLimitNodes.div);

	var spongerLimitDepth = new OAT.Combolist(["default", "1", "2","3","4","5","6","7","8","9","10"], 
						  "default", {onblur:function() {
		var v = spongerLimitDepth.value.trim();
		if (!v.match(/^\d*$/)) v = "";
		var o = { 'sparql_input:grab-depth':v };
		rdfb.setPragmas(o);
	    }})
	$("spongerLimitDepth").appendChild(spongerLimitDepth.div);

	var predicates = {
		title:"Select Predicates",
		content:$('predicates_popup'),
		status:"Select more with Ctrl click",
		width:220,
		result_control:false,
		activation:"click",
		type:OAT.Win.Rect
	}
	OAT.Anchor.assign("predicates_select",predicates);

	/* pragmas change */
	OAT.Event.attach($("spongerGetSoft"),"click",function() { 
		var o = { 'get':'soft' };
		rdfb.setPragmas(o);
	});

	OAT.Event.attach($("spongerGetReplacing"),"click",function() { 
		var o = { 'get':'replacing' };
		rdfb.setPragmas(o);
	});

	OAT.Event.attach($("spongerGrabAll"),"click",function() { 
		var o = { 
					'sparql_input:grab-all':"yes",
					'sparql_input:grab-seealso':false 
		};
		rdfb.setPragmas(o);
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
		rdfb.setPragmas(o);
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
		if ($("spongerGrabSeealsoPredicates").options.length==0 || 
		    window.confirm ("This will remove custom added predicates. Really restore?")) {
			$("spongerGrabSeealsoPredicates").options.length = 0;
			$("spongerGrabSeealsoPredicates").options[0] = new Option('foaf:knows','foaf:knows');
			$("spongerGrabSeealsoPredicates").options[1] = new Option('sioc:links_to','sioc:links_to');
			$("spongerGrabSeealsoPredicates").options[2] = new Option('rdfs:isDefinedBy','rdfs:isDefinedBy');
			$("spongerGrabSeealsoPredicates").options[3] = new Option('rdfs:seeAlso','rdfs:seeAlso');
			$("spongerGrabSeealsoPredicates").options[4] = new Option('owl:sameAs','owl:sameAs');
		}
	});

	/* show "scan browser history" only if gecko-based browser */
	if (!OAT.Browser.isGecko) {
		OAT.Dom.hide("scan_history");
	}
	adjustContentWidth();
}
