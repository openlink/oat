/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
var pivot, tab;

var demo_mapping = {
	about:[0,0,"about"],
	usage:[0,1,"usage"],
	license:[0,2,"license"],
	chart:[1,3,"chart"], /* URL part : [ panelbarIndex, tabIndex, divName ] */
	grid:[1,4,"grid"],
	pivot:[1,5,"pivot"],
	date:[1,6,"date"], 
	color:[1,7,"color"],
	tree:[1,8,"tree"],
	json:[3,9,"json"],
	upload:[2,10,"upload"],
	validation:[2,11,"validation"],
	dock:[1,12,"dock"],
	panelbar:[1,13,"panelbar_content"],
	ticker:[1,14,"ticker"],
	dimmer:[2,15,"dimmer"],
	crypto:[3,16,"crypto"],
	stats:[3,17,"stats"],
	quickedit:[2,18,"quickedit"],
	combolist:[2,19,"combolist"],
	combobox:[2,20,"combobox"],
	combobutton:[2,21,"combobutton"],
	ajax:[3,22,"ajax"],
	fisheye:[1,23,"fisheye"],
	ghostdrag:[3,24,"gd"],
	window:[1,25,"window"],
	docs:[1,26,"docs"],
	compatibility:[1,27,"compat"],
	slider:[2,28,"slider"],
	dav:[2,29,"dav"],
	mashups:[4,30,"out_maps"],
	pivots:[4,31,"out_pivot"],
	cursors:[4,32,"out_cursors"],
	data:[4,33,"out_data"]
}

function view_source() {
	var current = tab.values[tab.selectedIndex].id;
	var callback = function(script) {
		var s = script.replace(/\r/g,"");
		var re = new RegExp("/\\\* "+current+" \\\*/((.|\\\n)*?)/\\\*\\\*\\\*/","i");
		var scr = s.match(re);
		if (scr) {
			$("source_permalink").href = $("permalink").href + ":source";
			var ent = scr[1].replace(/&/g,"&amp;"); /* entities */
			var ent = ent.replace(/</g,"&lt;"); /* entities */
			var ent = ent.replace(/>/g,"&gt;"); /* entities */
			var nl = ent.replace(/\n/g,"<br/>"); /* newlines */
			var t = nl.replace(/\t/g,"&nbsp;&nbsp;&nbsp;&nbsp;"); /* tabs */
			var tr = t.match(/^(<br\/>)*(.*)/); /* trim */
			var txt = tr[2].replace(/(["'])(.*?)\1/g,"<span style='color: #888;'>$1$2$1</span>"); /* text */
			var b = txt.replace(/([\(\)\[\]])/g,"<span style='color: #a00'>$1</span>"); /* braces */
			var c = b.replace(/([{}])/g,"<span style='color: #00a'>$1</span>"); /* curly */
			var f = c.replace(/(for|var|function|return|new)/g,"<span style='color: #0a0'>$1</span>"); /* curly */
			$("source_content").innerHTML = f;
			OAT.Dimmer.show("source");
			OAT.Dom.center("source",1,1);
		} else {
			alert("Source code for this particular demonstration is not available.\nPlease select another and try again...");
		}
	}
	OAT.Ajax.command(OAT.Ajax.GET, "demo.js", function(){return false;}, callback, OAT.Ajax.TYPE_TEXT,{});
}
function init() {
	/* source */
	OAT.Dom.hide("source");
	OAT.Dom.attach("source_btn","click",view_source);
	OAT.Dom.attach("source_close","click",OAT.Dimmer.hide);
	/* tabs */
	tab = new OAT.Tab("content"); 
	for (var p in demo_mapping) {
		var name = demo_mapping[p][2];
		window.debug.push(name);
		tab.add("tab_"+name,name);
	}

	/* panelbar_content */
	var pb = new OAT.Panelbar(10);
	$("panelbar").appendChild(pb.div);
	pb.addPanel("pb_1","pb_11");
	pb.addPanel("pb_2","pb_22");
	pb.addPanel("pb_3","pb_33");
	pb.addPanel("pb_4","pb_44");
	pb.addPanel("pb_5","pb_55");
	/***/
	
	/* chart */
	tab.go(3);
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
	/***/
	
	
	/* grid */
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
	tab.go(4);
	var grid = new OAT.Grid("grid_content",0);
	grid.createHeader(header);
	for (var i=0;i<data.length;i++) { grid.createRow(data[i]); }
	/***/
	
	/* pivot */
	tab.go(5);
	pivot = new OAT.Pivot("pivot_content","pivot_chart","pivot_page",header,data,[0,1],[2,3],[],4,{showChart:1});
	var aggRef = function() {
		pivot.options.agg = parseInt($v("pivot_agg"));
		pivot.go();
	}
	/* create agg function list */
	OAT.Dom.clear("pivot_agg");
	for (var i=0;i<OAT.Statistics.list.length;i++) {
		var item = OAT.Statistics.list[i];
		OAT.Dom.option(item.shortDesc,i,"pivot_agg");
		if (pivot.options.agg == i) { $("pivot_agg").selectedIndex = i; }
	}
	OAT.Dom.attach("pivot_agg","change",aggRef);
	/***/
	
	/* date */
	var openRef = function(event) {
		var callback = function(date) {
			$("calendar_value").innerHTML = date[0]+"/"+date[1]+"/"+date[2];
		}
		var coords = OAT.Dom.position("calendar_value");
		OAT.Calendar.show(coords[0],coords[1]+30,callback);
	}
	OAT.Dom.attach("calendar_btn","click",openRef);
	/***/
	
	/* color */
	var colorRef = function(event) {
		var callback = function(color) { $("color_content").style.backgroundColor = color;}
		var coords = OAT.Dom.position("color_content");
		OAT.Color.pick(coords[0],coords[1],callback);
	}
	OAT.Dom.attach("color_content","click",colorRef);
	/***/
	
	/* tree */
	OAT.Tree.assign("tree_content","images","gif",false,"tree");
	/***/
	
	/* json */
	var jsonRef = function(event) {
		var data = OAT.JSON.stringify(OAT.JSON,-1);
		data = data.replace(/\n/g,"<br/>");
		data = data.replace(/ /g,"&nbsp;");
		$("json_content").innerHTML = data;
	}
	OAT.Dom.attach("json_btn","click",jsonRef);
	/***/
	
	/* upload */
	var ifr = OAT.Dom.create("iframe",{display:"none"});
	ifr.name="ifr";
	document.body.appendChild(ifr);
	var u = new OAT.Upload("GET","","ifr");
	$("upload_content").appendChild(u.div);
	u.submitBtn.value = "Upload files";
	u.form.setAttribute("onsubmit","return false;");
	OAT.Dom.attach(u.submitBtn,"click",function(){alert("In real application, clicking this button would upload files to server.");});
	/***/
	
	/* validation */
	OAT.Validation.create("validation_numbers",OAT.Validation.TYPE_REGEXP,{regexp:/[0-9]/, min:10, max:10});
	OAT.Validation.create("validation_chars",OAT.Validation.TYPE_REGEXP,{regexp:/[a-z]/i, min:3, max:12});
	OAT.Validation.create("validation_date",OAT.Validation.TYPE_DATE,{});
	/***/
	
	/* dock */
	var d = new OAT.Dock(3); 
	$("dock").appendChild(d.div);
	d.addObject(0,"d1","dock_1");
	d.addObject(1,"d2","dock_2");
	d.addObject(2,"d3","dock_3");
	d.addObject(0,"d4","dock_4");
	/* google search */
	var ds = new OAT.DataSource(10)
	var wsdl = "/google/services.wsdl";
	var searchRecieveRef = function(data,index) {
		window.d = data;
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
	ds.bindPage(searchRecieveRef);
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
		ds.init();
		ds.setWSDL(wsdl,"doGoogleSearch",obj,["URL","title"]);
		ds.advanceRecord(0);
	}
	OAT.Dom.attach("dock_search","click",searchRef);
	/***/

	/* ticker */
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
	/***/
	
	/* dimmer */
	OAT.Dom.hide("dimmer_content");
	OAT.Dom.attach("dimmer_btn","click",function(){OAT.Dimmer.show("dimmer_content",{});OAT.Dom.center("dimmer_content",1,1);});
	OAT.Dom.attach("dimmer_close","click",function(){OAT.Dimmer.hide();});
	/***/
	
	/* crypto */
	var cryptoRef = function() {
		var text = $v("crypto_input");
		$("crypto_base64").innerHTML = OAT.Crypto.base64e(text);
		$("crypto_md5").innerHTML = OAT.Crypto.md5(text);
		$("crypto_sha").innerHTML = OAT.Crypto.sha(text);
		
	}
	OAT.Dom.attach("crypto_input","keyup",cryptoRef);
	/***/
	
	/* stats */
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
	/***/
	
	/* quickedit */
	OAT.QuickEdit.assign("qe_1",OAT.QuickEdit.SELECT,["sir","madam"]);
	OAT.QuickEdit.assign("qe_2",OAT.QuickEdit.STRING,[]);
	OAT.QuickEdit.assign("qe_3",OAT.QuickEdit.SELECT,["information","money","monkey"]);
	OAT.QuickEdit.assign("qe_4",OAT.QuickEdit.STRING,[]);
	OAT.QuickEdit.assign("qe_5",OAT.QuickEdit.STRING,[]);
	/***/
	
	/* combolist */
	var cl = new OAT.Combolist(["red","green","blue","your own?"],"pick your color");
	$("combolist_content").appendChild(cl.div)
	/***/
	
	/* menu 
	//tab.go(4);
	var menu = new OAT.Menu(MenuData.TYPE_CLICK,0,MenuData.ANIM_FADE,10);
	menu.setNoCloseFilter("noclose");
	menu.createFromUL("menu_content");
	/* */
	
	/* ajax */
	OAT.Ajax.setStart(function(){$("ajax_input").style.backgroundImage = "url(images/progress.gif)";})
	OAT.Ajax.setEnd(function(){$("ajax_input").style.backgroundImage = "none";})
	var ajaxBack = function(data) {
		var approx = (data == "0" ? "" : "approximately ");
		$("ajax_output").innerHTML = "Google found "+approx+data+" results matching your query";
	}
	var ajaxRef = function(event) {
		var value = $v("ajax_input");
		if (value.length < 5) { return; }
		OAT.Ajax.command(OAT.Ajax.GET,"ajax.php?q="+value,function(){return "";},ajaxBack,OAT.Ajax.TYPE_TEXT,{});
	}
	OAT.Dom.attach("ajax_input","keyup",ajaxRef);
	/***/
	
	/* combobox */
	var cbx = new OAT.ComboBox("Your browser");
	cbx.addOption("opt_1","Firefox");
	cbx.addOption("opt_2","MSIE");
	cbx.addOption("opt_3","Opera");
	cbx.addOption("opt_4","Netscape");
	$("combobox_content").appendChild(cbx.div);
	/***/
	
	/* combobutton */
	var cb = new OAT.ComboButton();
	cb.addOption("images/cb_1.gif","Down",function(){alert("Down clicked");})
	cb.addOption("images/cb_2.gif","Up",function(){alert("Up clicked");})
	cb.addOption("images/cb_3.gif","Stop",function(){alert("Stop clicked");})
	$("combobutton_content").appendChild(cb.div);
	/***/
	
	/* fisheye */
	var fe = new OAT.FishEye({bigSize:70,limit:100});
	$("fisheye_content").appendChild(fe.div);
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
	/***/
	
	/* gd */
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
	/***/
	
	/* window */
	var win = new OAT.Window({close:1,min:0,max:0,width:300,height:0,title:"Demo window",imagePath:"images/"});
	win.content.appendChild($("window_content"));
	win.div.style.zIndex = 1000;
	document.body.appendChild(win.div);
	OAT.Dom.hide(win.div);
	win.onclose = function() { OAT.Dom.hide(win.div); OAT.Dom.show("window_launch"); }
	OAT.Dom.attach("window_launch","click",function(){ OAT.Dom.show(win.div); OAT.Dom.center(win.div,1,1); OAT.Dom.hide("window_launch");});
	/***/
	
	/* slider */
	var slider = new OAT.Slider("slider_btn",{minPos:16,maxPos:272});
	slider.onchange = function(value) { $("slider_value").innerHTML = value; }
	slider.init();
	/***/
	
	/* dav */
  var dav_browse = function(){
		var options = {
        mode:'browser',
        onResClick:function(param){
            alert('onResClick:'+param);
        },
        onOKClick:function(path,fname){
            document.f1.my_dav_file.value = path + fname;

          }
      };
    OAT.WebDav.open(options);
  }

  var dav_open = function(){
    options = {
			mode:'open_dialog',
			onOpenClick:function(path,fname,data){
            document.f1.my_dav_content.value = data;
            $('my_dav_path').innerHTML = path;
            $('my_dav_filename').innerHTML = fname;
				return true;
			}
		};
		OAT.WebDav.open(options);
	}

  var dav_save = function(){
    var options = {
    	mode:'save_dialog',
    	dontDisplayWarning:true,
    	onSaveClick:function() { return document.f1.my_dav_content.value;},
    	afterSave:function(path,fname) {
            $('my_dav_path').innerHTML = path;
            $('my_dav_filename').innerHTML = fname;
    	}
    };
    OAT.WebDav.open(options);
  }

  var dav_save_as = function(){
    var options = {
    	mode:'save_dialog',
    	onSaveClick:function() { return document.f1.my_dav_content.value;},
    	afterSave:function(path,fname) {
            $('my_dav_path').innerHTML = path;
            $('my_dav_filename').innerHTML = fname;
        console.log('da');
    	}
    };
    OAT.WebDav.open(options);

  }

	OAT.Dom.attach("dav_browse","click",dav_browse);
	OAT.Dom.attach("dav_open","click",dav_open);
	OAT.Dom.attach("dav_save","click",dav_save);
	OAT.Dom.attach("dav_save_as","click",dav_save_as);

	var options = {
		imagePath:'../images/',
		imageExt:'gif',
		pathDefault:'/DAV/home/demo/Public/',
	};
	OAT.WebDav.init(options);
	/***/
	
	/* let's go */
	pb.go(0);
	tab.go(0);
	
	tab.goCallback = function(oldIndex,newIndex) {
		if (oldIndex == 25 && newIndex != 25) {	win.onclose(); }
		if (oldIndex == 7 && newIndex != 7) { if (OAT.Color.div) { OAT.Dom.hide(OAT.Color.div);}  }
		if (oldIndex == 6 && newIndex != 6) { OAT.Dom.hide(OAT.Calendar.div); }
		var current = tab.values[newIndex].id;
		var item = false;
		for (var p in demo_mapping) {
			if (demo_mapping[p][2] == current) { item = p; }
		}
		if (item) {
			$("permalink").href = "index.html?"+item;
		}
	}
	
	var test = window.location.toString().match(/\?(.+)$/);
	if (test) {
		var part = test[1].split(":");
		var name = part[0];
		if (name in demo_mapping) {
			var tmp = demo_mapping[name];
			pb.go(tmp[0]);
			tab.go(tmp[1]);
			if (part.length > 1 && part[1] == "source") { view_source(); }
		}
	}
}
