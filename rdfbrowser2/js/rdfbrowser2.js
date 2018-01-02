/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2018 OpenLink Software
 *
 *  See LICENSE file for details.
*/

/*
	rb = new OAT.RDFBrowser2("div",optObj);
	
	rb.toXML();
	rb.fromXML();
	rb.getTitle(item);
	rb.getContent(value);
	rb.getURI(item);
	rb.processLink(domNode, href, disabledActions);
	
	#rdf_side #rdf_cache #rdf_filter #rdf_tabs #rdf_content
	
	data.triples
	data.structured
	
*/

/**
 * @class RDF Browser mark II
 * @message CONTENT_RESIZE  tab content resized?
 * @message CURIE_CACHE_UPDATE curie from sparql fetched and cache updated
 */
OAT.RDFBrowser2 = function(div,optObj) {
	var self = this;

	this.options = {
		maxLength:30,
		maxURILength:60,
		maxDistinctValues:100,
		imagePath:OAT.Preferences.imagePath,
		imagePrefix:'RDFB',
		defaultURL:"",
		appActivation:"click",
		endpoint:"/sparql",
		rdfproxy:"/about?url=",
		viewertype:"builtin",
		defaultQuery:"Data Source URI"
	}

	this.is_xpi = false;
	this.is_loading = false;

	for (var p in optObj) { this.options[p] = optObj[p]; }

	/* - BEGIN XPI EXTRA CODE - */
	
	if (OAT.Browser.isChrome()) {
	    var prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

	    this.options.endpoint = prefs.getCharPref("extensions.ode.sparqlgenendpoint");
	    this.options.viewertype = prefs.getCharPref("extensions.ode.viewertype");

	    this.options.rdfproxy = prefs.getCharPref("extensions.ode.proxygenendpoint");
	    OAT.Dereference.options.endpoint = this.options.rdfproxy;
	    
	    switch ( prefs.getCharPref("extensions.ode.proxyservice") ) {
	      default:
	      case 'virtuoso':
		  OAT.Dereference.options.endpointOpts.virtuoso = true;
		  OAT.Dereference.options.endpointOpts.proxyVersion = 1;
		  break;
	      case 'triplr':
		  OAT.Dereference.options.endpointOpts.virtuoso = false;
		  break;
	    }
	    self.is_xpi = true;
	} else {
	    self.is_xpi = false;
	}
	/* - END XPI EXTRA CODE - */
	
	this.parent = $(div);
	this.tabs = [];
	this.lastQueries = [];
	this.tree = false;
	this.uri = false;
	this.notify = false;

	this.pragmas = {};	

	this.pending_loads = []; // hash to store id and xhr of pending load keyed by URL
	this.pending_loads_url = {}; // array id to URL
	this.pending_loads_hi = 0;
	
	this.throbber = false;
	this.throbberElm = false;
	
	this.ajaxEnd = function() {
		if (self.throbber) {
			if (self.throbberElm) {
				self.throbber.parentNode.replaceChild(self.throbberElm,self.throbber);
			} else {
				OAT.Dom.unlink(self.throbber);
			}
			self.throbber = false;
			self.throbberElm = false;
		}
		if (OAT.AnchorData.window) { OAT.AnchorData.window.close(); }
	}

	this.ajaxError = function(xhr) {
	    var msg = "An error occured while adding the item to the storage:<br/>";
	    msg += xhr.getStatus() + " : " + xhr.obj.statusText + "<br/>";
	    msg += xhr.getResponseText() + "<br/>";
	    msg += "Please try again later.";
	    self.notify.send(msg,{width:400,height:100});
	    OAT.Dom.hide("find_full_thr");
	}

	this.bookmarks = {
		items:[],
		
		init:function() {
			self.bookmarks.redraw();
			
			var obj = OAT.Dom.uriParams();
			if (!("bmURI" in obj)) { return; }
			var uris = obj.bmURI;
			var labels = obj.bmLabel;
			for (var i=0;i<uris.length;i++) {
				var uri = decodeURIComponent(uris[i]);
				var label = decodeURIComponent(labels[i]);
				self.bookmarks.add(uri,label);
			}
		},
		
		add:function(uri,label) {
		var query = "CONSTRUCT { ?property ?hasValue ?isValueOf } \
                             FROM <{graph}>			\
                             WHERE { { <{uri}> ?property ?hasValue . } UNION { ?isValueOf ?property <{uri}> . } }";
			query = query.replace(/{uri}/g,uri).replace(/{graph}/g,self.uri);
			var u = self.options.endpoint+encodeURIComponent(query);
			var o = {
				uri:uri,
				label:label
			}
			self.bookmarks.items.push(o);
			self.bookmarks.redraw();
			self.store.redraw();
		},

		remove:function(index) {
			self.bookmarks.items.splice(index,1);
			self.bookmarks.redraw();
		},

		redraw:function() {
			var removeRef = function(a,index) {
		    OAT.Event.attach(a,"click",function(){self.bookmarks.remove(index);});
			}

			OAT.Dom.clear(self.bookmarkDiv);
			var d = self.bookmarkDiv;
			for (var i=0;i<self.bookmarks.items.length;i++) {
				var item = self.bookmarks.items[i];
				var li = OAT.Dom.create("li");
				var a = OAT.Dom.create("a");
				a.innerHTML = item.label;
				a.href = item.uri;
				var r = OAT.Dom.create("a");
				r.href = "javascript:void(0)";
				r.innerHTML = "Remove";
				removeRef(r,i);
				OAT.Dom.append([li,a]);
				OAT.Dom.append([d,a,OAT.Dom.text(" - "),r,OAT.Dom.create("br")]);
				self.processLink(a,item.uri,OAT.RDFData.DISABLE_BOOKMARK);
			}
			if (!self.bookmarks.items.length) {
				var li = OAT.Dom.create("li");
		    li. innerHTML = "No Bookmarks.";
				OAT.Dom.append([self.bookmarkDiv,li]);
			}
		},
		
		toURL:function() {
			var result = "";
			for (var i=0;i<self.bookmarks.items.length;i++) {
				var item = self.bookmarks.items[i];
				result += encodeURIComponent("bmURI[]")+"="+encodeURIComponent(item.uri)+"&";
				result += encodeURIComponent("bmLabel[]")+"="+encodeURIComponent(item.label)+"&";
			}
			return result;
		}
	}
	
	this.reset = function(hard) { /* triples were changed */
		for (var i=0;i<self.tabs.length;i++) { self.tabs[i].reset(hard); }
		self.redraw(); /* redraw global elements */
	}
	
	this.store = new OAT.RDFStore(self.reset,{onend:self.ajaxEnd,onerror:self.ajaxError});
	this.store.div = OAT.Dom.create("div");
	this.store.div.id = "store_items";
	this.data = self.store.data;
	this.purgeStore = function () {
	    self.store.clear();
	    //	    if (self.is_xpi) {
	    //		window.location.href="chrome://ode/";
	    //}
	}
	this.removeURL = function (url) {
	    self.store.remove (url);
	    //	    if (self.is_xpi) {
	    //		window.location.href="chrome://ode/";
	    //		for (var i=0;i<self.store.items.length;i++) {
	    //		    window.location.href = window.location.href + 
	    //		    '&uri[]=' + encodeURIComponent (items[i].uri);
	    //	}
	
	    //}
	}
	this.store.redraw = function() {
		OAT.Dom.clear(self.store.div);

		var total = 0;

		var removeRef = function(a,url) {
		OAT.Event.attach(a, "click" ,function() {self.removeURL(url);});
		}

	    var refreshRef = function(a,item) {
		OAT.Event.attach(a, "click", function() {
			self.store.remove(item.href);
			self.load_indicator_add (self.store.addURL(item.href,{title:item.title,pragmas:self.pragmas}), item.href);
		    }
		    );
	    }

		var checkRef = function(ch,url) {
			var f = function() {
				if (ch.checked) { self.store.enable(url);} else { self.store.disable(url); }
			}
		OAT.Event.attach(ch,"click",f);
		OAT.Event.attach(ch,"change",f);
		}

		var base = window.location.toString().match(/^[^?#]+/)[0];
		var th = base+"?";


		for (var i=0;i<self.store.items.length;i++) {
			var d = OAT.Dom.create("div");
			OAT.Dom.addClass(d,"storage_item");
			var item = self.store.items[i];
			total += item.triples.length;
			
			var ch = OAT.Dom.create("input");
			ch.type = "checkbox";
			ch.checked = item.enabled;
			ch.defaultChecked = item.enabled;
			
			var a = OAT.Dom.create("a");
		var label = item.href.truncate(self.options.maxURILength);
		a.title = decodeURIComponent(item.href);
		a.innerHTML = item.title ? item.title : label;

			var t = OAT.Dom.text(" - "+item.triples.length+" triples - ");
			OAT.Dom.append([d,ch,OAT.Dom.text(" "),a,t]);
			self.processLink(a,item.href,OAT.RDFData.DISABLE_DEREFERENCE);
			
			var remove = OAT.Dom.create("a");
		OAT.Dom.addClass(remove,'item_controls');
		OAT.Dom.addClass(remove,'ctl_danger');
			remove.href = "javascript:void(0)";
		remove.innerHTML = "Remove";
			removeRef(remove,item.href);
			checkRef(ch,item.href);
			
		var refresh = OAT.Dom.create("a");
		OAT.Dom.addClass(refresh,'item_controls');
		OAT.Dom.addClass(refresh,'ctl_good');
		refresh.innerHTML = "Refresh";
		refresh.href = "javascript:void(0)";
		refreshRef(refresh,item);
		
			var perm = OAT.Dom.create("a");
		OAT.Dom.addClass(perm,'item_controls');
		OAT.Dom.addClass(perm,'ctl_link');
		perm.innerHTML = "Permalink";
			perm.href = base+"?uri="+encodeURIComponent(item.href);
			th += encodeURIComponent("uri[]")+"="+encodeURIComponent(item.href)+"&";
			
		OAT.Dom.append([d,remove,OAT.Dom.text(" - "),refresh,OAT.Dom.text(" - "),perm],[self.store.div,d]);
		}

		$("storage_permalink").href = th + self.bookmarks.toURL();

		if (!$("storage_total")) {
			var d = OAT.Dom.create("div");
			d.id = "storage_total";
			$("rdf_storage").appendChild(d);
		} else {
			var d = $("storage_total");
		}

		d.innerHTML = "Total "+total+" triples";

	    /* display toggler and purge storage or not */

	}

	this.store.addSPARQL = function(q, title) {
		var url = "?query=" + encodeURIComponent(q) + "&format=rdf";

		self.load_indicator_add (self.store.addURL (url,{title:title,endpoint:self.options.endpoint,direct:true}), url);
	}
	
	this.throbberReplace = function(elm,replace) {
		return function(xhr) {
			var t = OAT.Dom.create("img",{cursor:"pointer"});
			t.id = "loading";
			OAT.Event.attach(t,"click",xhr.abort);
			t.src = self.options.imagePath + "Dav_throbber.gif";
			self.throbber = t;
			self.throbberElm = replace ? elm : false;
			if (replace) {
				elm.parentNode.replaceChild(t,elm);
			} else {
				elm.parentNode.insertBefore(t,elm);
			}
		}
	}

	this.store.loadFromInput = function() {
	    var v = $v(self.store.url);
	    if (v==self.options.defaultQuery) self.store.url.value = "";
	    if (OAT.Browser.isIE && !v) { /* IE gives an error with blank query */
			alert('Empty query.');
			return;
		}
	    if (v.indexOf('lsidres:')==0) {
		v = v.substr(8);
		$('inputquery').value = v;
	    }
	    /* if no protocol specified, assume http */
	    if (v.indexOf('.')!==0 && (v.indexOf(':') == -1 || (v.indexOf('/') != -1 && v.indexOf(':') > v.indexOf('/')))) {
		v = 'http://' + v;
		$('inputquery').value = v;
	    }
	    var opts = {
		ajaxOpts:{onstart:self.btnStart},
		pragmas:self.pragmas
	    };
	    self.load_indicator_add (self.store.addURL(v, opts), v);
	    self.addToPrevQueries(v);
	}

	this.store.init = function() {
		var url = OAT.Dom.create("input");
		url.size = 90;
		url.type = "text";
		url.title = "Data source URI";
		url.id = "inputquery";
		url.value = self.options.defaultURL;
		self.store.url = url;
		
		var btn1 = OAT.Dom.create("input");
		btn1.type = "button";
	    btn1.value = "Go";
		btn1.id = "querybutton";
		btn1.title = "Go!";

	    //	    self.btnStart = self.throbberReplace(btn1, false);

		OAT.Dom.append([self.inputDiv,url,btn1,OAT.Dom.text(" ")]);
		OAT.Dom.append([self.storageDiv,self.store.div]);
	    OAT.Event.attach(url, "keypress", function(event) {
			if (event.keyCode == 13) { self.store.loadFromInput(); }
		});
	    OAT.Event.attach(btn1,"click",self.store.loadFromInput);
	}

	this.store.loadFromURL = function() {
		var obj = OAT.Dom.uriParams();

	    /* querystring url, /proxy endpoint */

	    var opts = {
		ajaxOpts:{onstart:self.btnStart},
		pragmas:self.pragmas
	    };

	    if ("uri" in obj) {
		self.is_loading = true;
		if (typeof(obj.uri) != "object") { /* array of uris */
		    self.load_indicator_add (self.store.addURL(obj.uri), obj.uri);
		} else {
			for (var i=0;i<obj.uri.length;i++) {
			if (obj.uri[i].substring(0,8)=='lsidres:')
			    obj.uri[i] = obj.uri[i].substring(8);
			self.load_indicator_add (self.store.addURL(obj.uri[i], opts), obj.uri[i]);
			}
		}
		
		return;
	    }

	    if ("find" in obj) {
		self.is_loading = true;
		var url = "/?find";
		var params = [];
		for (var p in obj) {
		    params.push(p + "=" + obj[p]);
		}
		self.load_indicator_add (self.store.addURL(url + params.join("&")), "Find in progress");
		}
	}

	this.store.simplify = CurieCache.simplify;
	CurieCache.store = this.store;

	this.addTab = function(type,label,optObj) {
		var obj = new OAT.RDFTabs[type](self,optObj);
		self.tabs.push(obj);
		var li = OAT.Dom.create("li");
	    li.title = obj.desc;
		li.innerHTML = label;
		self.tabsUL.appendChild(li);
		self.tab.add(li,obj.elm);
		self.tab.go(0);
	    return obj;
	}

	this.processLink = function(domNode,href,disabledActions) { /* assign custom things to a link */
		var genRef = function() {
			var list = self.generateURIActions(href,disabledActions);
			var ul = OAT.Dom.create("ul",{paddingLeft:"20px",marginLeft:"0px"});
			for (var i=0;i<list.length;i++) {
				if (list[i]) {
					var elm = OAT.Dom.create("li");
					elm.appendChild(list[i]);
				} else {
			var elm = OAT.Dom.create("br");
				}
				ul.appendChild(elm);
			}
			return ul;
		}
			
		var obj = {
			title:"URL",
			content:genRef,
		width:200,
		height:100,
			result_control:false,
			activation:self.options.appActivation
		};
		OAT.Anchor.assign(domNode,obj);
		
		/* maybe image links */
	    //	    var node = $(domNode);
	    //	    if (!node.parentNode) { return; } /* cannot append images when no parent is available */
	    //	    var images = self.generateImageActions(href,disabledActions);
	    //	    var next = node.nextSibling;
	    //	    for (var i=0;i<images.length;i++) {
	    //		node.parentNode.insertBefore(images[i],next);
	    //	    }
	}
	
	this.generateURIActions = function(href,disabledActions) {
		var list = [];
		
		if (!(disabledActions & OAT.RDFData.DISABLE_DEREFERENCE)) {
			var a = OAT.Dom.create("a");
			a.innerHTML = "Describe";
			a.href = "javascript:void(0)";
			var start1 = self.throbberReplace(a);
			OAT.Event.attach(a,"click",function() {
				/* dereference link - add */
				var opts = {
					ajaxOpts:{onstart:start1},
					pragmas:self.pragmas
				};
				self.load_indicator_add(self.store.addURL(href,opts), href);
			});
			list.push(a);
		}

/*		if (!(disabledActions & OAT.RDFData.DISABLE_DEREFERENCE)) {
			var a = OAT.Dom.create("a");
			a.innerHTML = "Describe - replace local storage";
			a.href = "javascript:void(0)";
			var start2 = self.throbberReplace(a);
			OAT.Event.attach(a,"click",function() {
				// dereference link - replace
				var ref = function() {
					self.store.clear();
					start2();
				}
				self.store.addURL(href,ref);
			});
			list.push(a);
		}*/
			
/*		if (!(disabledActions & OAT.RDFData.DISABLE_DEREFERENCE)) {
			var a = OAT.Dom.create("a");
			a.innerHTML = "Describe - permalink";
			var root = window.location.toString().match(/^[^#]+/)[0];
			a.href = root+"#"+encodeURIComponent(href);
			list.push(a);
			list.push(false);
		}*/

		if (!(disabledActions & OAT.RDFData.DISABLE_HTML)) {
			var a = OAT.Dom.create("a");
			a.innerHTML = "(X)HTML View";
			a.href = href;
			list.push(a);
		}

		//list.push(false);

		/*if (!(disabledActions & OAT.RDFData.DISABLE_FILTER)) {
			var a = OAT.Dom.create("a");
			a.innerHTML = "Relationships";
			a.href = "javascript:void(0)";
			OAT.Event.attach(a,"click",function() {
				// dereference link
				OAT.AnchorData.window.close();
				self.store.addFilter(OAT.RDFStoreData.FILTER_URI,href);
			});
			list.push(a);
		}*/

		if (!(disabledActions & OAT.RDFData.DISABLE_BOOKMARK)) {
			var aa = OAT.Dom.create("a");
			aa.innerHTML = "Bookmark";
			aa.href = "javascript:void(0)";
			OAT.Event.attach(aa,"click",function(){
				var label = prompt("Please name your bookmark:",href);
				self.bookmarks.add(href,label);
				OAT.AnchorData.window.close();
			});
			list.push(aa);
		}

		return list;
	},
	
	this.generateImageActions = function(href,disabledActions) {
		var list = [];
		if (!(disabledActions & OAT.RDFData.DISABLE_DEREFERENCE)) {
			var img1 = OAT.Dom.create("img",{paddingLeft:"3px",cursor:"pointer"});
			img1.title = "Describe the attributes";
			img1.src = self.options.imagePath + "RDF_rdf.png";
			var start = self.throbberReplace(img1,true);
			OAT.Event.attach(img1,"click",function() {
				/* dereference link - add */
				var opts = {
					ajaxOpts:{onstart:start},
					pragmas:self.pragmas
				};
				self.store.addURL(href,opts);
			});
			list.push(img1);
		}

		
		if (!(disabledActions & OAT.RDFData.DISABLE_HTML)) {
			var a = OAT.Dom.create("a",{paddingLeft:"3px"});
			var img2 = OAT.Dom.create("img",{border:"none"});
			img2.src = self.options.imagePath + "RDF_xhtml.gif";
			a.title = "Open " + href.truncate(40) + " in web browser";
			a.appendChild(img2);
			a.target = "_blank";
			a.href = href;
			list.push(a);
		}
		return list;
	}
	
	this.drawPrevQueries = function() {
		var l = self.lastQueries.length;
		if (!l) {
			self.prevQueriesDiv.innerHTML = "<li id=\"noqueries\">No Previous Queries.</li>"
		} else {
			self.prevQueriesDiv.innerHTML = '';
			for (var i=0; i<l; i++) {
				var elem = OAT.Dom.create("li");
				self.prevQueriesDiv.appendChild(elem);
				elem.innerHTML = self.lastQueries[i];
				OAT.Event.attach(elem,"click",function(event) {
					if (OAT.Browser.isIE) {
						var elem = event.srcElement;
					} else {
						var elem = event.target;
					}
					$('inputquery').value = elem.innerHTML;
					self.store.loadFromInput();
				});
			}
			var elem = OAT.Dom.create("li");
			elem.style.listStyleType = 'none';
			self.prevQueriesDiv.appendChild(elem);
			elem.innerHTML = "<i>Delete all previous queries</i>";
			OAT.Event.attach(elem,"click",function(){
				if (window.confirm('All ('+self.lastQueries.length+') queries from this session will be deleted.')) {
					self.lastQueries = [];
					self.drawPrevQueries();
				}
			});
		}
	},


	this.addToPrevQueries = function(query) {
		if (self.lastQueries.indexOf(query)<0) {
			self.lastQueries.reverse();
			self.lastQueries.push(query);
			self.lastQueries.reverse();
			self.drawPrevQueries();
		}
	},

	this.drawCategories = function() { /* category tree */

		if (!self.data.structured.length) {
			$('rdf_category').innerHTML = '<ul id="nocategories"><li>No Categories.</li></ul>';
		} else {
			OAT.Dom.clear(self.categoryDiv);
		}

		var cats = {}; /* object of distinct values contained in filtered data */
		for (var i=0;i<self.data.structured.length;i++) {
			var item = self.data.structured[i];
			var preds = item.preds;
			for (var p in preds) {
				var pred = preds[p];
				for (var j=0;j<pred.length;j++) {
					var value = pred[j];
					if (typeof(value) == "object") { continue; }

					if (!(p in cats)) { cats[p] = {}; }
					var obj = cats[p];
					if (!(value in obj)) { obj[value] = 0; }
					obj[value]++;
				}
			}
		}

		/* 
			filter out some categories:
			* if there is only 1 element with such property
			* property count is > self.options.maxDistinctValues
			* if category contains 1 or 0 values
		*/
		for (var p in cats) {
			var count = 0;
			var atLeastOne = false;
			var obj = cats[p];
			for (var o in obj) {
				count++;
				if (obj[o] > 1) { atLeastOne = true; }
			}
			if ((!atLeastOne && p != "type") || 
			    (count <= 1 && p != "type") || 
			    count > self.options.maxDistinctValues) 
			    { 
				delete cats[p]; 
			    }
		}
		
		function assign(node,p,o) {
			var ref = function() {
				self.store.addFilter(OAT.RDFStoreData.FILTER_PROPERTY,p,o);
			}
			OAT.Event.attach(node,"click",ref);
		}
		
		var ul = OAT.Dom.create("ul");
		var bigTotal = 0;
		for (var p in cats) {
			var obj = cats[p];
			var li = OAT.Dom.create("li");
			var lilabel = OAT.Dom.create("span");
			li.appendChild(lilabel);
			lilabel.innerHTML = self.simplify(p);
			var ul2 = OAT.Dom.create("ul");
			li.appendChild(ul2);
			var count = 0;
			var total = 0;
			var anyli = OAT.Dom.create("li");
			var anya = OAT.Dom.create("a");
			anya.setAttribute("href","javascript:void(0)");
			anya.setAttribute("title","Filter by this value");
			anya.innerHTML = "[any]";
			anyli.appendChild(anya);
			ul2.appendChild(anyli);
			assign(anya,p,"");
			for (var o in obj) {
				count++;
				bigTotal++;
				var li2 = OAT.Dom.create("li");
				var a = OAT.Dom.create("a");
				a.setAttribute("href","javascript:void(0)");
				a.setAttribute("title",o);
				var label = self.simplify(o);

				if (label.length > self.options.maxLength) { 
				    label = label.substring(0,self.options.maxLength) + "&hellip;"; 
				}

				a.innerHTML = label + " (" + obj[o] + ")";
				total += obj[o];
				li2.appendChild(a);
				ul2.appendChild(li2);
				assign(a,p,o);
			}
			lilabel.innerHTML += " ("+count+")";
			anya.innerHTML += " ("+total+")";
			ul.appendChild(li);
		}
		self.tree = new OAT.Tree({imagePath:self.options.imagePath,
					  imagePrefix:self.options.imagePrefix,
					  poorMode:(bigTotal > 1000),
					  onClick:"toggle",
					  onDblClick:"toggle"});
		self.tree.assign(ul,true);
		self.categoryDiv.appendChild(ul);
	}
	
	this.drawFilters = function() { /* list of applied filters */
		OAT.Dom.clear(self.filterDiv);

		function assignP(link,index) {
			var ref = function() {
				var f = self.store.filtersProperty[index];
				self.store.removeFilter(OAT.RDFStoreData.FILTER_PROPERTY,f[0],f[1]);
			}
			OAT.Event.attach(link,"click",ref);
		}

		function assignU(link,index) {
			var ref = function() {
				var f = self.store.filtersURI[index];
				self.store.removeFilter(OAT.RDFStoreData.FILTER_URI,f);
			}
			OAT.Event.attach(link,"click",ref);
		}

		for (var i=0;i<self.store.filtersProperty.length;i++) {
			var f = self.store.filtersProperty[i];
			var li = OAT.Dom.create("li");
			var value = (f[1] == "" ? "[any]" : f[1]);
			var strong = OAT.Dom.create("strong");
			strong.innerHTML = f[0]+": ";
			li.appendChild(strong);
			li.innerHTML += value+" ";
			var remove = OAT.Dom.create("a");
			remove.setAttribute("href","javascript:void(0)");
			remove.setAttribute("title","Remove this filter");
			remove.innerHTML = "[remove]";
			assignP(remove,i);
			li.appendChild(remove);
			self.filterDiv.appendChild(li);
		}
		
		for (var i=0;i<self.store.filtersURI.length;i++) {
			var value = self.store.filtersURI[i];
			var div = OAT.Dom.create("div");
			var strong = OAT.Dom.create("strong");
			strong.innerHTML = "URI: ";
			div.appendChild(strong);
			div.innerHTML += value+" ";
			var remove = OAT.Dom.create("a");
			remove.setAttribute("href","javascript:void(0)");
			remove.setAttribute("title","Remove this filter");
			remove.innerHTML = "[remove]";
			assignU(remove,i);
			div.appendChild(remove);
			self.filterDiv.appendChild(div);
		}

		if (!self.store.filtersURI.length && !self.store.filtersProperty.length) {
			var li = OAT.Dom.create("li");
			li.innerHTML = 'No filters are selected. Create some by clicking on the Categories of data you want to remain visible.';
			self.filterDiv.appendChild(li);
		}
		
		if (self.store.filtersURI.length + self.store.filtersProperty.length > 1) {
			var div = OAT.Dom.create("div");
			var remove = OAT.Dom.create("a");
			remove.setAttribute("href","javascript:void(0)");
			remove.setAttribute("title","Remove all filters");
			remove.innerHTML = "remove all filters";
			OAT.Event.attach(remove,"click",self.store.removeAllFilters);
			div.appendChild(remove);
			self.filterDiv.appendChild(div);
		}
	}
	
	this.redraw = function() { /* everything */
		self.drawCategories();
		self.drawFilters();
		self.store.redraw();
		self.bookmarks.redraw();
		for (var i=0;i<self.tabs.length;i++) {
			var tab = self.tab.tabs[i];
			if (i == self.tab.selectedIndex || tab.window) { self.tabs[i].redraw(); }
		}
	    if (self.store.items.length || self.is_loading) {
		OAT.Dom.show("storage_controls");
		OAT.Dom.show("storage_toggle");
		OAT.Dom.show("storage_total");
		OAT.Dom.show("search_button");
		OAT.Dom.show("browse");
		OAT.Dom.show("tabDescription");
		OAT.Dom.show("rdf_content");
		OAT.Dom.show("right_toolbar");
		OAT.Dom.show("rdf_tabs");
		OAT.Dom.show("rdf_input");
		OAT.Dom.hide("find_full");
	    } else {
		OAT.Dom.hide("storage_controls");
		OAT.Dom.hide("storage_toggle");
		OAT.Dom.hide("storage_total");
		OAT.Dom.hide("search_button");
		OAT.Dom.hide("tabDescription");
		OAT.Dom.hide("browse");
		OAT.Dom.hide("rdf_content");
		OAT.Dom.hide("right_toolbar");
		OAT.Dom.hide("rdf_tabs");
		OAT.Dom.hide("rdf_input");
		if (!self.is_xpi && self.store.items.length < 1) OAT.Dom.show("find_full");
	    }

	    if ($("find_full_thr"))
		OAT.Dom.hide("find_full_thr");
	}

	this.showCacheControls = function () {
		OAT.Dom.show("storage_controls");
		OAT.Dom.show("storage_toggle");
		OAT.Dom.show("storage_total");

	}

	this.getContent = function(data_,disabledActions) {
		var content = false;
		var data = (typeof(data_) == "object" ? data_.uri : data_);
		var type = self.getContentType(data);
		
		switch (type) {
			case 3:
			    content = OAT.Dom.create("img",{"max-width": 560,className:"o_img"});
				content.title = data;
				content.src = data;
				self.processLink(content,data);
			break;
			case 2:
				content = OAT.Dom.create("a");
				var r = data.match(/^(mailto:)?(.*)/);
				content.innerHTML = r[2];
				content.href = 'mailto:'+r[2];
			break;
			case 1:
				content = OAT.Dom.create("span");
				var a = OAT.Dom.create("a");
				a.innerHTML = (data_.label ? data_.label.truncate(self.options.maxURILength) : 
					       CurieCache.uri_to_curie (data).truncate(self.options.maxURILength));
				a.href = data;
				a.title = data;
				content.appendChild(a);
				self.processLink(a,data,disabledActions);
			break;
			default:
				content = OAT.Dom.create("span");
				content.innerHTML = data;
				/* create dereference a++ lookups for all anchors */
				var anchors_ = content.getElementsByTagName("a");
				var anchors = [];
				for (var j=0;j<anchors_.length;j++) { anchors.push(anchors_[j]); }
				for (var j=0;j<anchors.length;j++) {
					var a = anchors[j];
					if (a.href.match(/^http/)) {
						self.processLink(a,a.href); 
					}
				}
			break;
		} /* switch */
		return content;
	}
	
	this.simplify = self.store.simplify;
	this.getContentType = self.store.getContentType;
	this.getTitle = self.store.getTitle;
	this.getURI = self.store.getURI;
	
	this.init = function() {
		/* dom */
		self.inputDiv = $("rdf_input");

		self.categoryDiv = $("rdf_category");
		if (!self.categoryDiv) { 
			self.categoryDiv = OAT.Dom.create("li",{});
			self.categoryDiv.id = "rdf_category";
			$('category_ul').appendChild(self.categoryDiv);
		}

		self.bookmarkDiv = $("bookmark_ul");
		if (!self.bookmarkDiv) { 
			self.bookmarkDiv = OAT.Dom.create("li",{});
			self.bookmarkDiv.id = "bookmark_ul";
			$('bookmark_ul').appendChild(self.bookmarkDiv);
		}

		self.sideDiv = $("rdf_side");
		if (!self.sideDiv) { 
			self.sideDiv = OAT.Dom.create("div",{});
			self.sideDiv.id = "rdf_side";
			self.parent.appendChild(self.sideDiv);
		}

		self.storageDiv = $("rdf_storage");
		if (!self.storageDiv) { 
			self.storageDiv = OAT.Dom.create("div",{});
			self.storageDiv.id = "rdf_storage";
			self.parent.appendChild(self.storageDiv);
		}

		self.filterDiv = $("filters_ul");
		if (!self.filterDiv) { 
			self.filterDiv = OAT.Dom.create("ul",{});
			self.filterDiv.id = "rdf_filter";
			$("filters_ul").appendChild(self.filterDiv);
		}

		self.prevQueriesDiv = $("prevQueries_ul");
		if (!self.prevQueriesDiv) { 
			self.prevQueriesDiv = OAT.Dom.create("ul",{});
			self.prevQueriesDiv.id = "prevQueries_ul";
			$("prevQueries_ul").appendChild(self.prevQueriesDiv);
		}

		self.tabsUL = $("rdf_tabs");
		if (!self.tabsUL) { 
			self.tabsUL = OAT.Dom.create("ul",{});
			self.tabsUL.id = "rdf_tabs";
			self.parent.appendChild(self.tabsUL);
		}

		self.tabDiv = $("rdf_content");
		if (!self.tabDiv) { 
			self.tabDiv = OAT.Dom.create("div",{});
			self.tabDiv.id = "rdf_content";
			self.parent.appendChild(self.tabDiv);
		}
		
		/* notification area */
		self.notify = new OAT.Notify();

		self.tab = new OAT.Tab(self.tabDiv);
		if (!$('tabDescription')) {
		self.descDiv = OAT.Dom.create("div");
		self.tabDiv.insertBefore(self.descDiv,self.tabDiv.firstChild);
		} else {
			self.descDiv = $('tabDescription');
		}

		var actTab = function(index) {
			self.tabs[index].redraw();
		}
		
		var goCallback = function(sender,msg,event) {
			var oldIndex = event[0];
			var newIndex = event[1];
			if (OAT.AnchorData.window) { OAT.AnchorData.window.close(); }
			self.tabs[newIndex].redraw();
			self.descDiv.innerHTML = self.tabs[newIndex].description;
		}

		OAT.MSG.attach(self.tab,"TAB_CHANGE",goCallback);
		OAT.MSG.attach (self.store, "STORE_LOADED",        self.load_indicator_remove);
		OAT.MSG.attach (self.store, "STORE_LOAD_FAILED",   self.load_indicator_remove);
		OAT.MSG.attach ("*",        "CURIE_CACHE_UPDATED", function (sender,msg) { self.redraw(); });

		self.redraw();
		self.store.init();
		self.bookmarks.init();
		self.drawPrevQueries();
		self.show_ui ();
	}
	this.load_cancel = function (e) {
	    var _ld_idx = this.id.substring(9)*1;
	    if (typeof(self.pending_loads[_ld_idx]) != 'undefined') {
		var _xhr = self.pending_loads[_ld_idx][0];
		var _url = self.pending_loads[_ld_idx][1];
		_xhr.abort();
	    }
	    self.load_indicator_remove (null, null, {"url": _url}); 
	}
	this.load_indicator_add = function (xhr,_url) {
	    
	    if (self.pending_loads[_url])
		return;
	    
	    var _li  = OAT.Dom.create ("li");
	    _li.id   = "p_ld_" + self.pending_loads_hi;
	    var _t   = OAT.Dom.create ("img", {className:"throbber"});
	    _t.src   = "imgs/ajax_throbber.gif";
	    _t.alt   = "throbber";
	    _t.id    = "p_ld_thr_" + self.pending_loads_hi;

	    // TODO add event to cancel AJAX request on click

	    OAT.Event.attach (_t, "click", self.load_cancel);
	    
	    var _txt = OAT.Dom.create ("span", {className:"load_indicator"});
	    _txt.innerHTML = _url;
	    
	    
	    self.pending_loads_url[_url] = self.pending_loads_hi;
	    self.pending_loads[self.pending_loads_hi] = [xhr, _url];
	    self.pending_loads_hi++;

	    OAT.Dom.append ([_li, _t, _txt]);
	    OAT.Dom.append (["p_ld", _li]);
	    OAT.Dom.show ("browse");
	    OAT.Dom.show ("storage_load_info");
	    OAT.Dom.hide ("find_full");
	}

	this.load_indicator_remove = function (_s, _msg, _o) {
	    var _url = _o.url;

	    var _p_ld_ix = (self.pending_loads_url[_url]);

	    if (typeof (_p_ld_ix) == 'undefined') return;

	    delete self.pending_loads_url[_url];
	    OAT.Dom.unlink ('p_ld_' + _p_ld_ix);

	    if (self.pending_loads.length = 0) {
		OAT.Dom.hide("storage_load_info");
	    }
	}

	this.show_ui = function () { 
	    OAT.Dom.show ('HD');
	    OAT.Dom.show ('MD');
	    OAT.Dom.show ('FT');
	    OAT.Dom.hide ('splash');
	}
	
	this.toXML = function(xslStr) {
		var xml = '<?xml version="1.0" ?>\n';
		if (xslStr) { xml += xslStr+'\n'; }
		xml += '<rdfbrowser tab="'+self.tabsUL.childNodes[self.tab.selectedIndex].innerHTML+'">\n';
		for (var i=0;i<self.store.items.length;i++) {
			var item = self.store.items[i];
			xml += '\t<uri>'+OAT.Dom.toSafeXML(item.href)+'</uri>\n';
		}
		for (var i=0;i<self.bookmarks.items.length;i++) {
			var item = self.bookmarks.items[i];
			xml += '\t<bookmark label="'+OAT.Dom.toSafeXML(item.label)+'">'+OAT.Dom.toSafeXML(item.uri)+'</bookmark>\n';
		}
		
		xml += '</rdfbrowser>\n';
		return xml;
	}
	
	this.fromXML = function(xmlDoc) {
		self.store.clear();
		self.store.removeAllFilters();
		var items = xmlDoc.getElementsByTagName("uri");
		for (var i=0;i<items.length;i++) {
			var item = items[i];
			var href = OAT.Xml.textValue(item);
			self.store.addURL(OAT.Dom.fromSafeXML(href));
		}
		var items = xmlDoc.getElementsByTagName("bookmark");
		for (var i=0;i<items.length;i++) {
			var item = items[i];
			var label = OAT.Dom.fromSafeXML(item.getAttribute("label"));
			var uri = OAT.Xml.textValue(item);
			self.bookmarks.add(OAT.Dom.fromSafeXML(uri),label);
		}
		var b = xmlDoc.getElementsByTagName("rdfbrowser")[0];
		var label = b.getAttribute("tab");
		var index = -1;
		for (var i=0;i<self.tabsUL.childNodes.length;i++) {
			var l = self.tabsUL.childNodes[i].innerHTML;
			if (l == label) { index = i; }
		}
		if (index != -1) { self.tab.go(index); }
		
	}
	
	this.fromRQ = function(data,clear) {
		if (clear) {
			self.store.clear();
			self.store.removeAllFilters();
		}
		var q = "";
		var d = data.replace(/[\r\n]/g," \n");
		var parts = d.split("\n");
		for (var i=0;i<parts.length;i++) {
			var part = parts[i].replace(/\n/g,"");
			var r = part.match(/^[^#]*/);
			q += r[0];
		}
		self.store.addSPARQL(q);
		if (clear) { self.tab.go(0); }
	}

	this.setPragmas = function(pragmaObj) {
	    for (var p in pragmaObj) {
		if (pragmaObj[p]) {
		    self.pragmas[p] = pragmaObj[p];
		} else {
		    delete(self.pragmas[p]);
		}
	    }
	    self.store.setOpts({pragmas:self.pragmas});
	}

	this.makePragmaDefines = function () {
	    var p_str = '';
	    for (var p in self.pragmas) {
		p_str = p_str + 'define ' + p.replace(/sparql_/, '') + '\r\n';
	    }
	    return p_str;
	}

	this.clearPragmas = function() {
	    self.pragmas = {};
	}
	
	this.init();
}
