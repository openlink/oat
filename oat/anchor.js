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
	OAT.Anchor.assign(elm,paramsObj);
*/

OAT.Anchor = {
	callForData:function(win,options,anchor) {
		var ds = options.datasource;
		ds.connection = options.connection;
		
		options.status = 1; /* loading */
		var link = anchor.innerHTML;
		var unlinkRef = function() {
			win.caption.innerHTML = anchor.innerHTML;
		}
		ds.bindRecord(unlinkRef);
		ds.bindEmpty(unlinkRef);

		switch (options.result_control) {
			case "grid":
				var g = new OAT.FormObject["grid"](0,0,0,1); /* x,y,designMode,forbidHiding */
				g.showAll = true;
				win.content.appendChild(g.elm);
				g.elm.style.position = "relative";
				g.init();
				ds.bindRecord(g.bindRecordCallback);
				ds.bindPage(g.bindPageCallback);
				ds.bindHeader(g.bindHeaderCallback);
			break;
			case "timeline":
				var tl = new OAT.FormObject["timeline"](0,20,0); /* x,y,designMode */
				win.content.appendChild(tl.elm);
				tl.elm.style.position = "relative";
				var dims = OAT.Dom.getWH(win.content);
				tl.elm.style.width = (dims[0]-3)+"px";
				tl.elm.style.height = (dims[1]-20)+"px";
				tl.init();
				/* canonic binding to output fields */
				for (var i=0;i<tl.datasources[0].fieldSets.length;i++) {
					tl.datasources[0].fieldSets[i].realIndexes = [i];
				}
				ds.bindPage(tl.bindPageCallback);
			break;
		} /* switch */
		
		ds.options.query = ds.options.query.replace(/\$link_name/g,link);
		options.connection.options.endpoint = options.href;
		options.connection.options.url = options.href;
		
		switch (ds.type) {
			case OAT.DataSourceData.TYPE_SPARQL:
				var sq = new OAT.SparqlQuery();
				sq.fromString(ds.options.query);
				var formatStr = sq.variables.length ? "format=xml" : "format=rdf"; /* xml for SELECT, rdf for CONSTRUCT */
				ds.options.query = "query="+encodeURIComponent(ds.options.query)+"&"+formatStr;
			break;
			case OAT.DataSourceData.TYPE_GDATA:
				ds.options.query = ds.options.query ? "q="+encodeURIComponent(ds.options.query) : "";
			break;
		} /* switch */
		ds.advanceRecord(0);
	},

	assign:function(element,paramsObj) {
		var elm = $(element);
		if (elm.tagName.toLowerCase() != "a") { return; }
		var options = {
			href:false,
			connection:false,
			datasource:false,
			imagePath:"/DAV/JS/images/",
			result:"grid",
			activation:"hover",
			width:300,
			height:0
		};
		for (var p in paramsObj) { options[p] = paramsObj[p]; }

		var win = new OAT.Window({close:1,resize:1,width:options.width,height:options.height,title:"Loading..."},OAT.WindowData.TYPE_ROUND);
		win.close = function() { OAT.Dom.unlink(win.div); }
		win.onclose = win.close;

		options.status = 0; /* not initialized */
		if (!options.href) { options.href = elm.href; } /* if no oat:href provided, then try the default one */
		elm.href = "javascript:void(0)";
		var closeFlag = 0;
		
		var startClose = function() {
			closeFlag = 1;
			setTimeout(closeRef,1000);
		}
		var endClose = function() {
			closeFlag = 0;
		}
		var moveRef = function(event) {
			endClose();
			var pos = OAT.Dom.eventPos(event);
			var dims = OAT.Dom.getWH(win.div);
			var x = Math.round(pos[0] - dims[0]/2);
			var y = pos[1] + 20;
			if (x < 0) { x = 10; }
			win.div.style.left = x+"px";
			win.div.style.top = y+"px";
		}
		var displayRef = function(event) {
			endClose();
			document.body.appendChild(win.div);
			moveRef(event);
			if (!options.status) { OAT.Anchor.callForData(win,options,elm); }
		}
		var closeRef = function() {
			if (closeFlag) {
				win.close();
				endClose();
			}
		}
		
		switch (options.activation) {
			case "hover":
				OAT.Dom.attach(elm,"mouseover",displayRef);
				OAT.Dom.attach(win.div,"mouseover",endClose);
				OAT.Dom.attach(elm,"mouseout",startClose);
				OAT.Dom.attach(win.div,"mouseout",startClose);
			break;
			case "click":
				OAT.Dom.attach(elm,"click",displayRef);
			break;
		}
	}
}
OAT.Loader.featureLoaded("anchor");
