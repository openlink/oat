/*******************************************************************************
 * SampleDataGenComponent/SampleDataGenComponent.js:
 *		This file holds a mini Ajax component that generates simulated dynamic stock data.
 *
 *		PARTICIPANTS IN THE INTEROPFEST can do any of the following with this file:
 *			(1) Keep this data generation component as is. This makes sense if you are trying 
 *				to integrate your own data *visualization* component and appreciate the  
 *				convenience of a ready-made data generation component.
 *			(2) Replace with a different data generation component. Some Ajax toolkits
 *				focus on server-generated dynamic data, in which case it would be
 *				very natural to replace this fake data generation component with
 *				a data generation component that leverages a different library' datagen features.
 *			(3) Don't use dynamic data generation within your InteropFest application.
 *				You don't have to have dynamic data within your application -
 *				to pass the InteropFest, you only need to register at least two libraries
 *				and pass messages via OpenAjax.hub.publish() and OpenAjax.hub.subscribe(),
 *				and include the results snippet.
 *
 *		This file uses the OpenAjax Hub to subscribe to the following events:
 *			org.openajax.interopfest10.bodyload - 
 *				Uses this to activate the data generation logic
 *
 *		This file uses the OpenAjax Hub to publish to the following events:
 *			org.openajax.interopfest10.datagen.stockpriceupdate - 
 *				Timer logic within the file creates fake new stock quotes periodically. 
 *				With each newly manufactured fake stock quote, this file broadcasts an event
 *				that the data visualization components can receive so they can update/redraw
 *				themselves.
 *			org.openajax.interopfest10.refreshResults - 
 *				This file sets up a timer such that every <n> milliseconds a message is sent
 *				telling the InteropFest results snippet so that it can update its results.
 *
 * Copyright 2007 OpenAjax Alliance
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not 
 * use this file except in compliance with the License. You may obtain a copy 
 * of the License at http://www.apache.org/licenses/LICENSE-2.0 . Unless 
 * required by applicable law or agreed to in writing, software distributed 
 * under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR 
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 *
 ******************************************************************************/

/*************************************************************************************************
 * This JavaScript file represents a mini Ajax library that contains a single data generation component.
 * Therefore, tell the OpenAjax Hub about his library by calling OpenAjax.hub.registerLibrary().
 *************************************************************************************************/
OpenAjax.hub.registerLibrary("SampleDataGenComponent", "http://openajax.org/InteropFest10/SampleDataGenComponent", "1.0");

SampleDataGenComponent = {}

/*************************************************************************************************
 * Manage the pause/resume button.
 *************************************************************************************************/

SampleDataGenComponent.running = false;
SampleDataGenComponent.pause_resume = function() {
	if (!SampleDataGenComponent.running) {
		SampleDataGenComponent.randomizerInterval = setInterval("SampleDataGenComponent.setRandomPrice()", 1500);
		SampleDataGenComponent.running = true;
		var elem = document.getElementById("pause_resume");
		elem.setAttribute("value", "Pause");
		SampleDataGenComponent.resultsUpdateInterval = setInterval("OpenAjax.hub.publish('org.openajax.interopfest10.refreshResults',null)", 2500);
	} else {
		clearInterval(SampleDataGenComponent.randomizerInterval);
		SampleDataGenComponent.running = false;
		clearInterval(SampleDataGenComponent.resultsUpdateInterval);
		var elem = document.getElementById("pause_resume");
		elem.setAttribute("value", "Resume");
		OpenAjax.hub.publish('org.openajax.interopfest10.refreshResults',null);
	}
}

/*************************************************************************************************
 * Initialize a list of fake companies and their initial stock prices.
 *************************************************************************************************/
SampleDataGenComponent.corplist = [];
SampleDataGenComponent.add = function(tickerName, corpName, startPrice) {
	SampleDataGenComponent.corplist.push({ tName: tickerName, cName: corpName, price: startPrice });
}
SampleDataGenComponent.add("STRA", "Strawberry Computers", 100);
SampleDataGenComponent.add("TITA", "Titan Power", 100);
SampleDataGenComponent.add("EBEL", "East Bay Electric", 100);
SampleDataGenComponent.add("MOOP", "Venetian Executive Search", 100);
SampleDataGenComponent.add("HLSY", "Hall Systems", 100);
SampleDataGenComponent.add("ULSO", "Ultisoft Systems", 100);
SampleDataGenComponent.add("LATR", "Lattern Circuits", 100);
SampleDataGenComponent.add("YSAM", "West Pecos Inc", 100);

/*************************************************************************************************
 * Pick a random company and update with a random price.
 *************************************************************************************************/
SampleDataGenComponent.getRandomCorp = function() {
	var len = SampleDataGenComponent.corplist.length;
	var i = Math.floor(Math.random() * len);
	if (i >= len)
		i = len-1;
	return i;
}
SampleDataGenComponent.setRandomPrice = function() {
	var inflation = 1.01;
	var i = SampleDataGenComponent.getRandomCorp();
	var stock = SampleDataGenComponent.corplist[i];
	var oldprice = stock.price;
	var oldprice_div10 = oldprice / 10;
	var oldprice_div20 = oldprice / 20;
	var price = oldprice + (Math.random() * oldprice_div10 * inflation) - oldprice_div20;
	stock.price = price;
	OpenAjax.hub.publish("org.openajax.interopfest10.datagen.stockpriceupdate", 
		{tickerName: stock.tName, corpName: stock.cName, price: stock.price});
}

/*************************************************************************************************
 * Subscribe to document load event and launch data generation logic when event is received.
 *************************************************************************************************/
OpenAjax.hub.subscribe("org.openajax.interopfest10.bodyload", SampleDataGenComponent.pause_resume);
