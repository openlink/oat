var stockCache = {};
var chartOpts = {left:60};
var notifyArea = {};

function oatNotify(eventName, stock) {
	// stock = {tickerName:<string>, corpName:<string>, price:<number>}
	var price = stock.price.toFixed(3);
	var content = OAT.Dom.create("div",{fontFamily:"verdana"});
	var head = OAT.Dom.create("strong");
	head.innerHTML = stock.corpName;
	OAT.Dom.append([content,head,OAT.Dom.create("br"),OAT.Dom.text("Price: "+price)]);
	var bg = "#ccc";
	if (stock.price >= 105) { bg = "#8f8"; }
	if (stock.price <= 95) { bg = "#f88"; }
	notifyArea.send(content,{timeout:1000,background:bg,delayIn:0});

	/* refresh pie chart */
	stockCache[stock.tickerName] = price;
	var data = [];
	var labels = [];
	for (var p in stockCache) {
		data.push(stockCache[p]);
		labels.push(p);
	}
	
	OAT.Dom.clear("DataVis_1");
	var o = new OAT.PieChart("DataVis_1",chartOpts);
	o.attachData(data);
	o.attachText(labels);
	o.draw();
	window.o = o;
}

function init() {
	notifyArea = new OAT.Notify();
	OpenAjax.hub.subscribe("org.openajax.interopfest10.datagen.stockpriceupdate", "oatNotify");
}