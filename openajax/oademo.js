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

function init() {
	var agg = $("pivot_agg");
	var pivot = new OAT.Pivot("pivot_content","pivot_chart","pivot_page",header,data,[0,1],[2,3],[],4,{showChart:1});
	var aggRef = function() {
		pivot.options.agg = parseInt($v(agg));
		pivot.go();
	}
	/* create agg function list */
	OAT.Dom.clear(agg);
	for (var i=0;i<OAT.Statistics.list.length;i++) {
		var item = OAT.Statistics.list[i];
		OAT.Dom.option(item.shortDesc,i,agg);
		if (pivot.options.agg == i) { agg.selectedIndex = i; }
	}
	OAT.Dom.attach(agg,"change",aggRef);
	agg.parentNode.replaceChild(agg,agg); /* ie fix */
}
