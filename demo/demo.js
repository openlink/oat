/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2009 OpenLink Software
 *
 *  See LICENSE file for details.
 */

var header = ["Company","Year","Quarter","Color","$$$'s spent on pencils"];
var data = [];
var Companies = ["IBM","Novell","Microsoft"];
var Years = ["2003","2004","2005"];
var Quarters = ["1st","2nd","3rd","4th"];
var Colors = ["Red","Blue","Black"];
for (var i=0;i<Companies.length;i++)
for (var j=0;j<Years.length;j++)
for (var k=0;k<Quarters.length;k++)
for (var l=0;l<Colors.length;l++) {
	var value = Math.round(Math.random()*100);
	data.push([Companies[i],Years[j],Quarters[k],Colors[l],value]);
}

var DEMO = {};
window.cal = false;

DEMO.about = {
	panel:0,
	tab:0,
	div:"about",
	needs:[],
	cb:false
}

DEMO.usage = {
	panel:0,
	tab:1,
	div:"usage",
	needs:[],
	cb:false
}

DEMO.license = {
	panel:0,
	tab:2,
	div:"license",
	needs:[],
	cb:false
}

DEMO.chart = {
	panel:1,
	tab:3,
	div:"chart",
	needs:["barchart"],
	cb:function() {
		var chart_1 = new OAT.BarChart("chart_1",{});
		var chart_2 = new OAT.BarChart("chart_2",{percentage:true});
		var data = [];
		var textX = [];
		var textY = ["Red","Green","Blue"];
		for (var i=0;i<10;i++) {
			textX.push(i+1);
			var p = [];
			for (var j=0;j<3;j++) { p.push(Math.random()); }
			data.push(p);
		}

		chart_1.attachTextX(textX);
		chart_1.attachTextY(textY);
		chart_1.attachData(data);
		chart_1.draw();
		chart_2.attachTextX(textX);
		chart_2.attachTextY(textY);
		chart_2.attachData(data);
		chart_2.draw();
	}
}

DEMO.grid = {
	panel:1,
	tab:4,
	div:"grid",
	needs:["grid"],
	cb:function() {
		var grid = new OAT.Grid("grid_content",0,1);
		grid.createHeader(header);
		for (var i=0;i<data.length;i++) { grid.createRow(data[i]); }
	}
}

DEMO.pivot = {
	panel:1,
	tab:5,
	div:"pivot",
	needs:["pivot","statistics"],
	cb:function() {
		var pivot = new OAT.Pivot("pivot_content","pivot_chart","pivot_page",header,data,[0,1],[2,3],[],4,{showChart:1});
		var aggRef = function() {
			pivot.options.agg = parseInt($v("pivot_agg"));
			pivot.go();
		}
		var aggRefTotals = function() {
			pivot.options.aggTotals = parseInt($v("pivot_agg_totals"));
			pivot.go();
		}
		/* create agg function list */
		OAT.Dom.clear("pivot_agg");
		OAT.Dom.clear("pivot_agg_totals");
		for (var i=0;i<OAT.Statistics.list.length;i++) {
			var item = OAT.Statistics.list[i];
			OAT.Dom.option(item.shortDesc,i,"pivot_agg");
			OAT.Dom.option(item.shortDesc,i,"pivot_agg_totals");
			if (pivot.options.agg == i) { $("pivot_agg").selectedIndex = i; }
			if (pivot.options.aggTotals == i) { $("pivot_agg_totals").selectedIndex = i; }
		}
		OAT.Dom.attach("pivot_agg","change",aggRef);
		OAT.Dom.attach("pivot_agg_totals","change",aggRefTotals);
	}
}

DEMO.date = {
	panel:1,
	tab:6,
	div:"date",
	needs:["calendar"],
	cb:function() {
		var c = new OAT.Calendar();
		window.cal = c;
		var openRef = function(event) {
			var callback = function(date) {
				$("calendar_value").innerHTML = date[0]+"/"+date[1]+"/"+date[2];
			}
			var coords = OAT.Dom.position("calendar_value");
			c.show(coords[0],coords[1]+30,callback);
		}
		OAT.Dom.attach("calendar_btn","click",openRef);
	}
}

DEMO.color = {
	panel:1,
	tab:7,
	div:"color",
	needs:["color"],
	cb:function() {
		var c = new OAT.Color();
		var colorRef = function(event) {
			var callback = function(color) { $("color_content").style.backgroundColor = color;}
			var coords = OAT.Dom.position("color_content");
			c.pick(coords[0],coords[1],callback);
		}
		OAT.Dom.attach("color_content","click",colorRef);
	}
}

DEMO.tree = {
	panel:1,
	tab:8,
	div:"tree",
	needs:["tree"],
	cb:function() {
		var t = new OAT.Tree({allowDrag:1,onClick:"select",onDblClick:"toggle"});
		t.assign("tree_content",0);
	}
}

DEMO.json = {
	panel:3,
	tab:9,
	div:"json",
	needs:["json"],
	cb:function() {
		var jsonRef = function(event) {
			var data = OAT.JSON.stringify(OAT.JSON,-1);
			data = data.replace(/\n/g,"<br/>");
			data = data.replace(/ /g,"&nbsp;");
			$("json_content").innerHTML = data;
		}
		OAT.Dom.attach("json_btn","click",jsonRef);
	}
}

DEMO.upload = {
	panel:2,
	tab:10,
	div:"upload",
	needs:["upload"],
	cb:function() {
		var ifr = OAT.Dom.create("iframe",{display:"none"});
		ifr.name="ifr";
		document.body.appendChild(ifr);
		var u = new OAT.Upload("GET","","ifr","file");
		$("upload_content").appendChild(u.div);
		u.submitBtn.value = "Upload files";
		u.form.setAttribute("onsubmit","return false;");
		OAT.Dom.attach(u.submitBtn,"click",function(){alert("In real application, clicking this button would upload files to server.");});
	}
}

DEMO.validation = {
	panel:2,
	tab:11,
	div:"validation",
	needs:["validation"],
	cb:function() {
		OAT.Validation.create("validation_numbers",OAT.Validation.TYPE_REGEXP,{regexp:/[0-9]/, min:10, max:10});
		OAT.Validation.create("validation_chars",OAT.Validation.TYPE_REGEXP,{regexp:/[a-z]/i, min:3, max:12});
		OAT.Validation.create("validation_date",OAT.Validation.TYPE_DATE,{});
	}
}

DEMO.dock = {
	panel:1,
	tab:12,
	div:"dock",
	needs:["dock","ws","datasource"],
	cb:function() {
		var d = new OAT.Dock("dock_content",3);
		var colors = ["#99c","#cc9","#c8c","#9c9"];
		var columns = [0,1,2,0];
		var titles = ["Welcome!","News?","Weather forecast","Google"];

		for (var i=0;i<colors.length;i++) {
			d.addObject(columns[i],"dock_"+(i+1),{color:colors[i],title:titles[i],titleColor:"#000"});
		}
		
		/* google search */
		var ds = new OAT.DataSource(OAT.DataSourceData.TYPE_SOAP)
		var wsdl = "/google/services.wsdl";
		ds.connection = new OAT.Connection(OAT.ConnectionData.TYPE_WSDL,{url:wsdl});
		var searchReceiveRef = function(data,index) {
			var cnt = Math.min(data.length,3);
			OAT.Dom.clear("dock_results");
			for (var i=0;i<cnt;i++) {
				var num = OAT.Dom.create("span");
				num.innerHTML = (i+1)+". ";
				$("dock_results").appendChild(num);
				var val = data[i];
				var a = OAT.Dom.create("a");
				a.href = val[0];
				a.innerHTML = val[1];
				$("dock_results").appendChild(a);
				var br = OAT.Dom.create("br");
				$("dock_results").appendChild(br);
			}
		}
		ds.bindPage(searchReceiveRef);
		var searchRef = function() {
			var obj = {
				doGoogleSearch:{
					key:"IGWnqjhQFHKvB8MdJlVI0GPKDJxZhwBf",
					q:$v("dock_q"),
					start:0,
					maxResults:10,
					filter:"",
					restrict:"",
					safeSearch:"",
					lr:"",
					ie:"",
					oe:""
				}
			}
			ds.options.service = "doGoogleSearch";
			ds.options.inputObj = obj;
			ds.outputFields = ["URL","title"];
			ds.reset();
			ds.advanceRecord(0);
		}
		OAT.Dom.attach("dock_search","click",searchRef);
	}
}

DEMO.panelbar = {
	panel:1,
	tab:13,
	div:"panelbar_content",
	needs:[],
	cb:false
}

DEMO.ticker = {
	panel:1,
	tab:14,
	div:"ticker",
	needs:["ticker"],
	cb:function() {
		var getStartRef = function(i) { return function() { tickerArr[i].start(); }	}
		var getStopRef = function(i) { return function() { tickerArr[i].stop(); }	}
		var textArr = [
			"The United States of America is a federal republic situated primarily in North America. It is bordered on the north by Canada and to the south by Mexico. It comprises 50 states and one federal district, and has several territories with differing degrees of affiliation. It is also referred to, with varying formality, as the U.S., the U.S.A., the U.S. of A., the States, the United States, America, or (poetically) Columbia.",
			"The United Kingdom of Great Britain and Northern Ireland (usually shortened to the United Kingdom, or the UK) occupies part of the British Isles in northwestern Europe, with most of its territory and population on the island of Great Britain. It shares a land border with the Republic of Ireland on the island of Ireland and is otherwise surrounded by the North Sea, the English Channel, the Celtic Sea, the Irish Sea, and the Atlantic Ocean.",
			"The Czech Republic, is a landlocked country in Central Europe. The country has borders with Poland to the north, Germany to the northwest and west, Austria to the south, and Slovakia to the east. Historic Prague, a major tourist attraction, is its capital and largest city.",
			'Republic of Zimbabwe (formerly Rhodesia) is a landlocked country located in the southern part of the continent of Africa, between the Zambezi and Limpopo rivers. It is bordered by South Africa to the south, Botswana to the west, Zambia to the north, and Mozambique to the east. The name Zimbabwe is derived from "dzimba dzamabwe" meaning "stone buildings" in the Shona language.'
		];
		var tickerArr = [];
		for (var i=0;i<4;i++) {
			var opts = {
				loop:OAT.TickerData.LOOP_FULL,
				timing:OAT.TickerData.TIMING_PERCHAR,
				defDelay:20,
				clear:OAT.TickerData.CLEAR_END
			}
			tickerArr.push(new OAT.Ticker("ticker_content",textArr[i],opts));
			var startRef = getStartRef(i);
			var stopRef = getStopRef(i);
			OAT.Dom.attach("ticker_"+i,"mouseover",startRef);
			OAT.Dom.attach("ticker_"+i,"mouseout",stopRef);
		}
	}
}

DEMO.dimmer = {
	panel:2,
	tab:15,
	div:"dimmer",
	needs:["dimmer"],
	cb:function() {
		OAT.Dom.hide("dimmer_content");
		OAT.Dom.attach("dimmer_btn","click",function(){OAT.Dimmer.show("dimmer_content");OAT.Dom.center("dimmer_content",1,1);});
		OAT.Dom.attach("dimmer_close","click",function(){OAT.Dimmer.hide();});
	}
}

DEMO.crypto = {
	panel:3,
	tab:16,
	div:"crypto",
	needs:["crypto"],
	cb:function() {
		var cryptoRef = function() {
			var text = $v("crypto_input");
			$("crypto_base64").innerHTML = OAT.Crypto.base64e(text);
			$("crypto_md5").innerHTML = OAT.Crypto.md5(text);
			$("crypto_sha").innerHTML = OAT.Crypto.sha(text);

		}
		OAT.Dom.attach("crypto_input","keyup",cryptoRef);
	}
}

DEMO.stats = {
	panel:3,
	tab:17,
	div:"stats",
	needs:["statistics"],
	cb:function() {
		var statsRef = function() {
			OAT.Dom.clear("stats_content");
			var value = parseInt($v("stats_count"));
			var count = (isNaN(value) ? 20 : value);
			value = parseInt($v("stats_maximum"));
			var max = (isNaN(value) ? 10 : value);
			var data = [];
			for (var i=0;i<count;i++) { data.push(Math.round(Math.random()*(max-1))+1); }
			$("stats_data").innerHTML = data.join(", ");
			/* dynamically walk through all available stats functions */
			for (var i=0;i<OAT.Statistics.list.length;i++) {
				var item = OAT.Statistics.list[i];
				var div = OAT.Dom.create("div");
				var val = OAT.Statistics[item.func](data);
				div.innerHTML = item.longDesc+": "+val;
				$("stats_content").appendChild(div);
			}
		}
		OAT.Dom.attach("stats_btn","click",statsRef);
		statsRef();
	}
}

DEMO.quickedit = {
	panel:2,
	tab:18,
	div:"quickedit",
	needs:["quickedit"],
	cb:function() {
		OAT.QuickEdit.assign("qe_1",OAT.QuickEdit.SELECT,["sir","madam"]);
		OAT.QuickEdit.assign("qe_2",OAT.QuickEdit.STRING,[]);
		OAT.QuickEdit.assign("qe_3",OAT.QuickEdit.SELECT,["information","money","monkey"]);
		OAT.QuickEdit.assign("qe_4",OAT.QuickEdit.STRING,[]);
		OAT.QuickEdit.assign("qe_5",OAT.QuickEdit.STRING,[]);
	}
}

DEMO.combolist = {
	panel:2,
	tab:19,
	div:"combolist",
	needs:["combolist"],
	cb:function() {
		var cl = new OAT.Combolist(["red","green","blue"],"pick your color");
		cl.addOption("your own?","custom");
		$("combolist_content").appendChild(cl.div)
	}
}

DEMO.combobox = {
	panel:2,
	tab:20,
	div:"combobox",
	needs:["combobox"],
	cb:function() {
		var cbx = new OAT.ComboBox("Your browser");
		cbx.addOption("opt_1","Firefox");
		cbx.addOption("opt_2","MSIE");
		cbx.addOption("opt_3","Opera");
		cbx.addOption("opt_4","Netscape");
		$("combobox_content").appendChild(cbx.div);
	}
}

DEMO.combobutton = {
	panel:2,
	tab:21,
	div:"combobutton",
	needs:["combobutton"],
	cb:function() {
		var cb = new OAT.ComboButton();
		cb.addOption("images/cb_1.gif","Down",function(){alert("Down clicked");})
		cb.addOption("images/cb_2.gif","Up",function(){alert("Up clicked");})
		cb.addOption("images/cb_3.gif","Stop",function(){alert("Stop clicked");})
		$("combobutton_content").appendChild(cb.div);
	}
}

DEMO.ajax = {
	panel:3,
	tab:22,
	div:"ajax",
	needs:["ajax2"],
	cb:function() {
		OAT.AJAX.startRef = function(){$("ajax_input").style.backgroundImage = "url(images/progress.gif)";}
		OAT.AJAX.endRef = function(){$("ajax_input").style.backgroundImage = "none";}
		var ajaxBack = function(data) {
			var approx = (data == "0" ? "" : "approximately ");
			$("ajax_output").innerHTML = "Google found "+approx+data+" results matching your query";
		}
		var ajaxRef = function(event) {
			var value = $v("ajax_input");
			if (value.length < 5) { return; }
			OAT.AJAX.GET("ajax.php?q="+value,false,ajaxBack);
		}
		OAT.Dom.attach("ajax_input","keyup",ajaxRef);
	}
}

DEMO.fisheye = {
	panel:1,
	tab:23,
	div:"fisheye",
	needs:["fisheye"],
	cb:function() {
		var fe = new OAT.FishEye("fisheye_content",{bigSize:70,limit:100});
		fe.addImage("images/fe_img1.png");
		fe.addImage("images/fe_img2.png");
		fe.addImage("images/fe_img3.png");
		fe.addImage("images/fe_img4.png");
		fe.addImage("images/fe_img5.png");
		fe.addImage("images/fe_img6.png");
		fe.addImage("images/fe_img7.png");
		fe.addImage("images/fe_img8.png");
		fe.addImage("images/fe_img9.png");
		fe.addImage("images/fe_img10.png");
	}
}

DEMO.ghostdrag = {
	panel:3,
	tab:24,
	div:"gd",
	needs:["ghostdrag"],
	cb:function() {
		var gd = new OAT.GhostDrag();
		gd.addTarget("gd_cart");
		var ids = ["banana","cherry","strawberry","lemon"];
		var names = ["Bananas","Cherries","Strawberries","Lemons"];
		var contents = [0,0,0,0];
		function gdRefresh() {
			OAT.Dom.clear("gd_cart");
			for (var i=0;i<names.length;i++) {
				if (contents[i]) {
					$("gd_cart").innerHTML += names[i]+": "+contents[i]+"<br/>";
				}
			}
		}
		var getGDref = function(index) {
			return function(target,x,y) {
				contents[index]++;
				gdRefresh();
			}
		}
		for (var i=0;i<ids.length;i++) {
			var elm = $("cart_"+ids[i]);
			gd.addSource(elm,function(){},getGDref(i));
		}
		OAT.Dom.attach("gd_clear","click",function(){contents=[0,0,0,0];gdRefresh();});
	}
}

DEMO.window = {
	panel:3,
	tab:25,
	div:"window",
	needs:["window"],
	cb:function() {
		window.win = new OAT.Window({close:1,min:0,max:0,width:300,height:0,title:"Demo window"},OAT.WindowData.TYPE_AUTO);
		window.win.content.appendChild($("window_content"));
		window.win.div.style.zIndex = 1000;
		document.body.appendChild(window.win.div);
		OAT.Dom.hide(window.win.div);
		window.win.onclose = function() { OAT.Dom.hide(window.win.div); OAT.Dom.show("window_launch"); }
		OAT.Dom.attach("window_launch","click",function(){ OAT.Dom.show(window.win.div); OAT.Dom.center(win.div,1,1); OAT.Dom.hide("window_launch");});
	}
}

DEMO.docs = {
	panel:1,
	tab:26,
	div:"docs",
	needs:[],
	cb:false
}

DEMO.compatibility = {
	panel:1,
	tab:27,
	div:"compat",
	needs:[],
	cb:false
}

DEMO.slider = {
	panel:2,
	tab:28,
	div:"slider",
	needs:["slider"],
	cb:function() {
		var slider = new OAT.Slider("slider_btn",{minPos:16,maxPos:272});
		slider.onchange = function(value) { $("slider_value").innerHTML = value; }
		slider.init();
	}
}

DEMO.dav = {
	panel:2,
	tab:29,
	div:"dav",
	needs:["dav"],
	cb:function() {
		var opts = {
			user:"demo",
			pass:"demo",
			path:"/DAV/home/demo/",
			callback:function(path,file,content) {
				$("dav_file_name").innerHTML = path+file;
				$("dav_file_content").value = content;
			},
			extensionFilters: [
				["all","*","All files"],
				["xml","xml","XML files"],
				["txt","txt","Text documents"],
			]
		}
		OAT.Dom.attach("dav_btn","click",function(){
			OAT.WebDav.openDialog(opts);
		});
		OAT.WebDav.init(opts);
	}
}

DEMO.mashups = {
	panel:4,
	tab:30,
	div:"out_maps",
	needs:[],
	cb:false
}

DEMO.pivots = {
	panel:4,
	tab:31,
	div:"out_pivot",
	needs:[],
	cb:false
}

DEMO.cursors = {
	panel:4,
	tab:32,
	div:"out_cursors",
	needs:[],
	cb:false
}

DEMO.data = {
	panel:4,
	tab:33,
	div:"out_data",
	needs:[],
	cb:false
}

DEMO.timeline = {
	panel:1,
	tab:34,
	div:"timeline",
	needs:["timeline","ajax2","xml"],
	cb:function() {
		var tl = new OAT.Timeline("timeline_content",{});
		tl.addBand("JFK","rgb(255,204,153)");
		var callback = function(xmlDoc) {
			var events = OAT.Xml.xpath(xmlDoc,"//event",{});
			for (var i=0;i<events.length;i++)  {
				var e = events[i];

				var a = OAT.Dom.create("div",{left:"-7px"});
				var ball = OAT.Dom.create("div",{width:"16px",height:"16px",cssFloat:"left",styleFloat:"left"});
				ball.style.backgroundImage = "url("+OAT.Preferences.imagePath+"Timeline_circle.png)";
				var t = OAT.Dom.create("span");
				var time = e.getAttribute("title");
				t.innerHTML = time;
				a.appendChild(ball);
				a.appendChild(t);
				var start = e.getAttribute("start");
				var end = e.getAttribute("end");

				tl.addEvent("JFK",start,end,a,"#ddd");
			}
			tl.draw();
			tl.slider.slideTo(0,1);
		}
		OAT.AJAX.GET("jfk.xml",false,callback,{type:OAT.AJAX.TYPE_XML});
		OAT.Dom.attach(window,"resize",tl.sync);
	}
}

DEMO.round = {
	panel:3,
	tab:35,
	div:"round",
	needs:["simplefx"],
	cb:function() {
		OAT.SimpleFX.roundDiv('round_1');
		OAT.SimpleFX.roundDiv('round_2',{antialias:0});
		OAT.SimpleFX.roundDiv('round_3',{corners:[1,0,1,0]});
		OAT.SimpleFX.roundDiv('round_4',{size:5});
		OAT.SimpleFX.roundDiv('round_5',{size:12});
	}
}

DEMO.rdf = {
	panel:1,
	tab:36,
	div:"rdf",
	needs:["rdf","graphsvg","ajax2","slider"],
	cb:function() {
		function rdf_zoom(val) {
			var z = Math.pow(2,val/100);
			var dims = OAT.Dom.getWH("rdf_content");
			if (window.rdf_graph) { 
				window.rdf_graph.transform.scale = z;
				window.rdf_graph.applyTransform();
			}
		}


		function rdf_load() {
			var p = "";
			var url = p + $v("rdf_url");
			var returnRef = function(xmlDoc) {
				var triples = OAT.RDF.toTriples(xmlDoc);
				var x = OAT.GraphSVGData.fromTriples(triples);
				window.rdf_graph = new OAT.GraphSVG("rdf_content",x[0],x[1],{vertexSize:[4,8]});
			}
			OAT.AJAX.GET(url,false,returnRef,{type:OAT.AJAX.TYPE_XML});
		}

		function rdf_preset() {
			if ($v("rdf_preset")) { $("rdf_url").value = $v("rdf_preset"); }
		}

		var rdf_s = new OAT.Slider("rdf_slider",{minValue:-150,maxValue:100,initValue:0});
		rdf_s.slideTo(0);
		rdf_s.onchange = rdf_zoom;
		OAT.Dom.attach("rdf_load","click",rdf_load);
		OAT.Dom.attach("rdf_preset","change",rdf_preset);
	}
}

DEMO.pie = {
	panel:1,
	tab:37,
	div:"pie",
	needs:["piechart"],
	cb:function(){
		var piechart = new OAT.PieChart("pie_content");
		var data = [];
		for (var i=0;i<7;i++) {
			data.push(Math.round(10+Math.random()*100));
		}
		piechart.attachData(data);
		piechart.attachText(data);
		piechart.draw();
	}
}

DEMO.sparklines = {
	panel:1,
	tab:38,
	div:"sparklines",
	needs:["sparkline"],
	cb:function(){
		var data = [ [1,2,4,3], [4,3,2,1], [2,1,3,4], [3,4,1,2]];
		var lc = new OAT.LineChart("line_chart",{markerSize:6});
		lc.attachData(data);
		lc.attachTextX(["a","b","c","d"]);
		lc.attachTextY(["red","blue","green","yellow"]);
		lc.draw();
		var d2 = [];
		var d3 = [];
		for (var i=0;i<60;i++) {
			var n = i / 35 * 2 * Math.PI;
			var v = Math.sin(n);
			d2.push(v);
			d3.push(Math.random());
		}
		var d4 = [-207.802,-185.367,-212.308,-221.215,-149.728,-155.152,-152.456,-221.195,-269.328,
		-290.376,-255.087,-203.250,-163.972,-107.473,-21.958,69.213,125.563,236.445,127.299,-157.802,-304.15].reverse();


		var s1 = new OAT.Sparkline("sparkline_1",{});
		var s2 = new OAT.Sparkline("sparkline_2",{});
		var s3 = new OAT.Sparkline("sparkline_3",{});
		s1.attachData(d2);
		s2.attachData(d3);
		s3.attachData(d4);
		s1.draw();
		s2.draw();
		s3.draw();
	}
}


DEMO.anchor = {
	panel:1,
	tab:39,
	div:"anchor",
	needs:["anchor","datasource","timeline","ajax2","grid","xmla","sparql","form"],
	cb:function(){
		var ds_form = new OAT.DataSource(OAT.DataSourceData.TYPE_REST);

		var ds_sql = new OAT.DataSource(OAT.DataSourceData.TYPE_SQL);
		ds_sql.options.query = "SELECT CategoryID, CategoryName FROM Demo.demo.Categories WHERE CategoryID > $link_name";

		var ds_xml = new OAT.DataSource(OAT.DataSourceData.TYPE_REST);
		ds_xml.options.output = 0; /* fetch result as XML */
		ds_xml.options.xpath = 1; /* outputFields are specified as XPATH expressions */
		ds_xml.outputFields = ['//result/binding[@name="created"]/node()/text()',
							'//result/binding[@name="creator"]/node()/text()',
							'//result/binding[@name="item_title"]/node()/text()',
							'//result/binding[@name="url"]/node()/text()'];

		var ds_sp = new OAT.DataSource(OAT.DataSourceData.TYPE_SPARQL);
		ds_sp.options.query = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n"+
			"PREFIX sioc:   <http://rdfs.org/sioc/ns#>\n"+
			"PREFIX dct: <http://purl.org/dc/elements/1.1/>\n"+
			"PREFIX dcc: <http://purl.org/dc/terms/>\n"+
			"PREFIX sioct: <http://rdfs.org/sioc/types#>"+
			"SELECT distinct ?forum_name, ?creator, ?channel, ?item_title, ?post, ?created "+
			"FROM <http://demo.openlinksw.com/dataspace> "+
			"WHERE { "+
				'?forum a sioct:SubscriptionList;'+
				'sioc:id ?forum_name.'+
				'?forum sioc:parent_of ?channel.'+
				'?channel sioc:container_of ?post.'+
				'optional{?post sioc:has_creator ?creator}.'+
				'optional{?post dct:title ?item_title }.'+
				'optional{ ?post sioc:links_to ?url }.'+
				'optional{ ?post dcc:created ?created }'+
			'}\n'+
			"ORDER BY DESC (?created)";
		ds_sp.outputFields = ['//result/binding[@name="created"]/node()/text()',
							'//result/binding[@name="forum_name"]/node()/text()',
							'//result/binding[@name="item_title"]/node()/text()',
							'//result/binding[@name="post"]/node()/text()'];

		var c2 = new OAT.Connection(OAT.ConnectionData.TYPE_REST);
		var c1 = new OAT.Connection(OAT.ConnectionData.TYPE_XMLA,{user:"demo",password:"demo"});

		OAT.Anchor.assign("a_1",{activation:"hover",width:"300",datasource:ds_sql,result_control:"grid",connection:c1});
		OAT.Anchor.assign("a_2",{activation:"click",width:"800",height:"400",datasource:ds_xml,result_control:"timeline",connection:c2});
		OAT.Anchor.assign("a_3",{activation:"click",width:"600",height:"400",datasource:ds_sp,result_control:"timeline",connection:c2});
		OAT.Anchor.assign("a_4",{activation:"click",width:"100",height:"50",datasource:ds_form,result_control:"form",connection:c2});
	}
}

DEMO.rss = {
	panel:1,
	tab:40,
	div:"rss",
	needs:["rssreader","ajax2"],
	cb:function() {
		var rss1 = new OAT.RSSReader("rss_content_rss");
		var rss2 = new OAT.RSSReader("rss_content_rdf");
		var ref1 = function(xmlText) { rss1.display(xmlText); }
		var ref2 = function(xmlText) { rss2.display(xmlText); }
		OAT.AJAX.GET("feed_rss.xml",false,ref1);
		OAT.AJAX.GET("feed_rdf.xml",false,ref2);
	}
}

DEMO.qbe = {
	panel:5,
	tab:41,
	div:"app_qbe",
	needs:[],
	cb:false
}

DEMO.designer = {
	panel:5,
	tab:42,
	div:"app_designer",
	needs:[],
	cb:false
}
DEMO.formdesigner = {
	panel:5,
	tab:43,
	div:"app_formdesigner",
	needs:[],
	cb:false
}
DEMO.isparql = {
	panel:5,
	tab:44,
	div:"app_isparql",
	needs:[],
	cb:false
}
DEMO.rdfbrowser = {
	panel:5,
	tab:45,
	div:"app_rdfbrowser",
	needs:[],
	cb:false
}

DEMO.tagcloud = {
	panel:2,
	tab:46,
	div:"tagcloud",
	needs:["tagcloud"],
	cb:function() {
		var data = [
			["OAT",13],["Internet",8],["Visualization",3],["Frequency",12],["Hello world!",6],
			["OpenLink",10],["Tag Cloud",5],["Web 2.0",8],["SPARQL",7],["Testing message",4]
		];
		var tc1 = new OAT.TagCloud("tc_1",{});
		var tc2 = new OAT.TagCloud("tc_2",{separator:", ",colorMapping:OAT.TagCloudData.COLOR_CYCLE});
		var tc3 = new OAT.TagCloud("tc_3",{colorMapping:OAT.TagCloudData.COLOR_RANDOM,sizes:["100%"]});
		var tmp = OAT.Dom.create("span");
		tmp.innerHTML = " &bull; ";
		var tc4 = new OAT.TagCloud("tc_4",{sizes:["100%"],separator:tmp.innerHTML});
		for (var i=0;i<data.length;i++) {
			tc1.addItem(data[i][0],"",data[i][1]);
			tc2.addItem(data[i][0],"",data[i][1]);
			tc3.addItem(data[i][0],"",data[i][1]);
			tc4.addItem(data[i][0],"",data[i][1]);
		}
		tc1.draw();
		tc2.draw();
		tc3.draw();
		tc4.draw();
	}
}

DEMO.notify = {
	panel:3,
	tab:47,
	div:"notify",
	needs:["notify"],
	cb:function() {
		var notify = new OAT.Notify();
		OAT.Event.attach("notify_1","click",function() {
			notify.send("This is a standard notification window. It can hold any HTML content.");
		});
		OAT.Event.attach("notify_2","click",function() {
			notify.send("Click me to disappear!",{timeout:0,style:{fontWeight:"bold",marginTop:"10px"},color:"#f00"});
		});
		OAT.Event.attach("notify_3","click",function() {
			notify.send("I am shown and hidden instantly. Click me to see it :)",
				{opacity:0.5,timeout:0,delay:0,style:{fontFamily:"courier new"},color:"#00a",background:"#8c8",image:OAT.Preferences.imagePath+"Dav_throbber.gif"});
		});
      }
}

DEMO.slidebar = {
	panel:1,
	tab:48,
	div:"slidebar_content",
	needs:["slidebar"],
	cb:function() { 
	  var slb = new OAT.Slidebar ("slb", {imgPrefix: "images/"});
    }
}

function init() {
	OAT.Dom.unlink("throbber");
	var c = $("throbber_content");
	while (c.firstChild) { document.body.appendChild(c.firstChild); }
	OAT.Dom.unlink(c);

	function view_source() {
		OAT.Dimmer.hide();
		var id = tab.tabs[tab.selectedIndex].value.id;
		var name = false;

		for (var p in DEMO) if (DEMO[p].div == id) { name = p; }

		if (!name || !DEMO[name].cb) { 
		    alert ("Source code for this particular demonstration is not available.\nPlease select another and try again..."); 
		    return; 
		}

		$("source_permalink").href = $("permalink").href + ":source";
		var scr = DEMO[name].cb.toString();
		scr = scr.replace(/^[ \s]*function *\(\) *{([\s\S]*)}[ \s]*$/,"$1");
		var ent = scr.replace(/&/g,"&amp;"); /* entities */
		var ent = ent.replace(/</g,"&lt;"); /* entities */
		var ent = ent.replace(/>/g,"&gt;"); /* entities */
		var t = ent.replace(/\t/g,"&nbsp;&nbsp;&nbsp;&nbsp;"); /* tabs */
		var t = t.replace(/    /g,"&nbsp;&nbsp;&nbsp;&nbsp;"); /* gecko tabs */
		var nl = t.replace(/\n/g,"<br/>"); /* newlines */
		var nl = nl.replace(/\\n/g,"<br/>"); /* newlines */
		var nl = nl.replace(/<br\/>&nbsp;&nbsp;&nbsp;&nbsp;/g,"<br/>"); /* initial tabs */
		var tr = nl.match(/^(<br\/>)*(.*)/); /* trim */
		var txt = tr[2].replace(/([^\\])"(.*?)([^\\])"/g,"$1<span style=\"color: #888;\">\"$2$3\"</span>"); /* text */
		var txt = txt.replace(/([^\\])'(.*?)([^\\])'/g,"$1<span style=\"color: #888;\">'$2$3'</span>"); /* text */
		var b = txt.replace(/([\(\)\[\]])/g,"<span style='color: #a00'>$1</span>"); /* braces */
		var c = b.replace(/([{}])/g,"<span style='color: #00a'>$1</span>"); /* curly */
		var f = c.replace(/(for|var|function|return|new)([ \(])/g,"<span style='color: #0a0'>$1$2</span>"); 
		source.show();
		$("source_content").innerHTML = f;
	}

	/* source */
	var source = new OAT.Dialog ("Source", "source", {modal:1,width:700,height:400});
	OAT.Dom.unlink (source.cancelBtn);
	source.hide ();
	source.ok = source.hide;
	OAT.Dom.attach ("source_btn","click",view_source);

	/* tabs */
	var tab = new OAT.Tab ("content");
	for (var p in DEMO) {
		var name = DEMO[p].div;
		tab.add ("tab_" + name, name);
	}

	/* panelbar_content */
	var pb = new OAT.Panelbar("panelbar",20);
	pb.addPanel("pb_1","pb_11");
	pb.addPanel("pb_2","pb_22");
	pb.addPanel("pb_3","pb_33");
	pb.addPanel("pb_4","pb_44");
	pb.addPanel("pb_5","pb_55");
	pb.addPanel("pb_6","pb_66");

	/* create dimmer element */
	var dimmerElm = OAT.Dom.create("div",{border:"2px solid #000",padding:"1em",position:"absolute",backgroundColor:"#fff"});
	dimmerElm.innerHTML = "OAT Components loading...";
	document.body.appendChild(dimmerElm);
	OAT.Dom.hide(dimmerElm);
	
	for (var p in DEMO) { DEMO[p].drawn = false; }
	tab.options.goCallback = function(oldIndex,newIndex) {
		var oldName, newName;
		for (var p in DEMO) {
			var v = DEMO[p];
			if (v.tab == oldIndex) { oldName = p; }
			if (v.tab == newIndex) { newName = p; }
		}
		/*
			when changing demos:
			* maybe close some windows
			* actualize permalink
			* include dependencies
			* do it
		*/
		if (oldName == "window" && newName != "window") { win.onclose(); }
		if (oldName == "color" && newName != "color") { if (OAT.Color.div) { OAT.Dom.hide(OAT.Color.div);}  }
		if (oldName == "date" && newName != "date") { if (window.cal)  { OAT.Dom.hide(window.cal.div); } }
		$("permalink").href = "index.html?"+newName;

		var obj = DEMO[newName];
		if (!obj.drawn) {
			if (obj.cb) {
				OAT.Dimmer.show(dimmerElm,{opacity:0.0});
				OAT.Dom.center(dimmerElm,1,1);
				var ref = function() {
					if (!window.location.href.match(/:source/)) { OAT.Dimmer.hide(); }
					obj.cb();
					obj.drawn = true;
				}
				OAT.Loader.loadFeatures(obj.needs,ref);
			} else { obj.drawn = true; }
		} /* if not yet included & drawn */
	}
	pb.go(0);
	tab.go(0);

	/* initial demo switch */
	var test = window.location.toString().match(/\?(.+?)#?$/);
	if (test) {
		var part = test[1].split(":");
		var name = part[0];
		if (name in DEMO) {
			var v = DEMO[name];
			pb.go(v.panel);
			tab.go(v.tab);
			if (part.length > 1 && part[1] == "source") { view_source(); }
		}
	}
}
