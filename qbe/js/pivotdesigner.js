/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2006 Ondrej Zara and OpenLink Software
 *
 *  See LICENSE file for details.
 */
function pivot_design_prepare() {
	/* create pivot design form based on pivot_data object */
	OAT.Dom.clear("pivot_design_headercol");
	OAT.Dom.clear("pivot_design_headerrow");
	OAT.Dom.clear("pivot_design_data");
	OAT.Dom.clear("pivot_design_page");
	OAT.Dom.clear("pivot_design_base");
	pivot_gd.clearSources();
	
	var empty = {
		"pivot_design_headercol":"[drag aggregate columns here]",
		"pivot_design_headerrow":"[drag aggregate columns here]",
		"pivot_design_data":"[drag data column here]",
		"pivot_design_page":"[drag paging columns here]",
		"pivot_design_base":"[unused columns]"
		}
	
	for (p in empty) { $(p).innerHTML = empty[p]; }
	OAT.Dom.clear("pivot_design_base");
	
	var process = function(elm) { }
	
	var from_array = function(arr,val) {
		var index = -1;
		for (var i=0;i<arr.length;i++) if (arr[i] == val) { index = i; }
		if (index == -1) { return; }
		arr.splice(index,1);
	}
	
	var move = function(elm,index,source,target) {
		if (source == target) { return; }
		if (target.innerHTML == empty[target.id]) { OAT.Dom.clear(target); } /* clear default texts */
		switch (source.id) {
			case "pivot_design_headercol":
				from_array(pivot_data.headerColIndexes,index);
			break;
			case "pivot_design_headerrow":
				from_array(pivot_data.headerRowIndexes,index);
			break;
			case "pivot_design_data":
				pivot_data.dataColumnIndex = -1;
			break;
			case "pivot_design_page":
				from_array(pivot_data.filterIndexes,index);
			break;
		}
		
		switch (target.id) {
			case "pivot_design_headercol":
				pivot_data.headerColIndexes.push(index);
			break;
			case "pivot_design_headerrow":
				pivot_data.headerRowIndexes.push(index);
			break;
			case "pivot_design_data":
				if (target.childNodes.length) { $("pivot_design_base").appendChild(target.childNodes[0]); }
				pivot_data.dataColumnIndex = index;
			break;
			case "pivot_design_page":
				pivot_data.filterIndexes.push(index);
			break;
		} /* switch */
		
		target.appendChild(elm);
		if (source.childNodes.length == 0) { source.innerHTML = empty[source.id]; }
	}
	
	var register = function(div,index) {
		return function(target,x,y) {
			move(div,index,div.parentNode,target);
		} /* callback */
	} /* register */
	
	if (pivot_data.headerColIndexes.length) { OAT.Dom.clear("pivot_design_headercol"); }
	if (pivot_data.headerRowIndexes.length) { OAT.Dom.clear("pivot_design_headerrow"); }
	if (pivot_data.filterIndexes.length) { OAT.Dom.clear("pivot_design_page"); }

	for (var i=0;i<pivot_data.headerRow.length;i++) {
		var div = OAT.Dom.create("div",{margin:"1px",padding:"2px",backgroundColor:"#eee",border:"1px dotted #000",cursor:"pointer"});
		div.innerHTML = pivot_data.headerRow[i];
		$("pivot_design_base").appendChild(div);
		var ref = register(div,i);
		pivot_gd.addSource(div,process,ref);

		/* is this cell actually positioned in pivot? */
		if (i == pivot_data.dataColumnIndex) { OAT.Dom.clear("pivot_design_data"); $("pivot_design_data").appendChild(div); }

		for (var j=0;j<pivot_data.headerColIndexes.length;j++) if (pivot_data.headerColIndexes[j] == i) {
			$("pivot_design_headercol").appendChild(div);
		}
		for (var j=0;j<pivot_data.headerRowIndexes.length;j++) if (pivot_data.headerRowIndexes[j] == i) {
			$("pivot_design_headerrow").appendChild(div);
		}
		for (var j=0;j<pivot_data.filterIndexes.length;j++) if (pivot_data.filterIndexes[j] == i) {
			$("pivot_design_page").appendChild(div);
		}
	}

}

function pivot_refresh() {
	/* refresh pivot data */
	var callback = function(tmp) {
		var body = tmp[1];   /* pole poli, radku */
		pivot_data.dataRows = body;
		pivot.go();
	}
	if (pivot_data.query != "") { OAT.Xmla.execute(callback); }
}

function pivot_create() {
	/* create / update pivot based on pivot_data object */
	if (!(pivot_data.headerColIndexes.length + pivot_data.headerRowIndexes.length)) {
		alert('You must select at least one aggregate column');
		return;
	}
	if (pivot_data.dataColumnIndex == -1) {
		alert('You must select at least one data column');
		return;
	}
	dialogs.pivot_design.hide();
	OAT.Ajax.startRef();
	pivot = new OAT.Pivot("pivot_content","pivot_chart","pivot_page",pivot_data.headerRow,pivot_data.dataRows,
						pivot_data.headerRowIndexes,pivot_data.headerColIndexes,
						pivot_data.filterIndexes,pivot_data.dataColumnIndex);
	OAT.Ajax.endRef();
	tab.go(3);
}

function pivot_design_load(xmlStr) {
	var xml = OAT.Xml.getTreeString(xmlStr);
	var root = xml.documentElement;
	pivot_data.headerRowIndexes = [];
	var tmp = root.getElementsByTagName("headerRowIndexes")[0];
	var values = tmp.getElementsByTagName("value");
	for (var i=0;i<values.length;i++) { pivot_data.headerRowIndexes.push(OAT.Xml.textValue(values[i])); }
	pivot_data.headerColIndexes = [];
	var tmp = root.getElementsByTagName("headerColIndexes")[0];
	var values = tmp.getElementsByTagName("value");
	for (var i=0;i<values.length;i++) { pivot_data.headerColIndexes.push(OAT.Xml.textValue(values[i])); }
	pivot_data.filterIndexes = [];
	var tmp = root.getElementsByTagName("filterIndexes")[0];
	var values = tmp.getElementsByTagName("value");
	for (var i=0;i<values.length;i++) { pivot_data.filterIndexes.push(OAT.Xml.textValue(values[i])); }
	pivot_data.dataColumnIndex = OAT.Xml.textValue(root.getElementsByTagName("dataColumnIndex")[0]);
	
	OAT.Xmla.query = OAT.Xml.textValue(root.getElementsByTagName("query")[0]);
	pivot_data.query = OAT.Xmla.query;
	var callback = function(pole) {
		pivot_data.headerRow = pole[0];
		pivot_data.dataRows = pole[1];
		pivot_create();
	}
	OAT.Xmla.execute(callback);
}
