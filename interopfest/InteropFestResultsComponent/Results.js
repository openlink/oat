/*******************************************************************************
 * InteropFestResultsComponent/Results.js:
 *		The main function of this file is to insert (and then update) a snippet
 *		of HTML into the host document in order to populate a rectangular area
 *		with the InteropFest test results.
 *
 *		This file uses the OpenAjax Hub to subscribe to the following events:
 *			org.openajax.hub.registerLibrary - 
 *				uses this to keep track of the number of libraries registered with the Hub
 *			org.openajax.interopfest10.bodyload - 
 *				uses this to print out an initial version of the results table
 *			org.openajax.interopfest10.refreshResults - 
 *				message from other components that the table needs to be re-generated
 *
 *		IN MOST CASES, PARTICIPANTS IN THE INTEROPFEST SHOULD NOT CHANGE THIS FILE.
 *		However, it is likely that alternative CSS styling might be used,
 *		such as to change the position and size of the rectangular results snippet.
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

	/*******************************************************************************
	 * Section 1: Duplicate version of OpenAjax.js
	 *
	 * We are including a shadow copy of the Hub source code in this Results.js file
	 * because this test case intercepts all calls to the pub/sub engine in order
	 * to determine if the pub/sub engine is actually being used to successfully
	 * pass messages among components.
	 *
	 * The shadow copy is placed on the "InterceptOpenAjax" object (versus the OpenAjax object).
	 *
	 ******************************************************************************/

OpenAjaxInteropFest10_OrigPublish = OpenAjax.hub.publish;
OpenAjaxInteropFest10_OrigSubscribe = OpenAjax.hub.subscribe;
OpenAjaxInteropFest10_OrigUnsubscribe = OpenAjax.hub.unsubscribe;
OpenAjaxInteropFest10_UniqueTopics = [];

if(!window["InterceptOpenAjax"]){
	InterceptOpenAjax = new function(){
		var t = true;
		var f = false;
		var g = window;
		var libs;
		var ooh = "org.openajax.hub.";
this.nMessagesPublished = 0;
this.nMessagesReceived = 0;

		var h = {};
		this.hub = h;
		h.implementer = "http://openajax.org";
		h.implVersion = "0.6";
		h.specVersion = "0.6";
		h.implExtraData = {};
		var libs = {};
		h.libraries = libs;

		h.registerLibrary = function(prefix, nsURL, version, extra){
			libs[prefix] = {
				prefix: prefix,
				namespaceURI: nsURL,
				version: version,
				extraData: extra 
			};
			this.publish(ooh+"registerLibrary", libs[prefix]);
		}
		h.unregisterLibrary = function(prefix){
			this.publish(ooh+"unregisterLibrary", libs[prefix]);
			delete libs[prefix];
		}

		h._subscriptions = { c:{}, s:[] };
		h._cleanup = [];
		h._subIndex = 0;
		h._pubDepth = 0;

		// Intercept the call to OpenAjax's subscribe() function so that we can do accounting.
		// Still invokes the original OpenAjax subscribe() function, but also calls our
		// shadow version of subscribe() in order to do the accounting.
		OpenAjax.hub.subscribe = function(name, callback, scope, subscriberData, filter)			
		{
			var handle = OpenAjaxInteropFest10_OrigSubscribe.call(OpenAjax.hub, name, callback, scope, subscriberData, filter);
			if(!scope){
				scope = window;
			}
			// var handle = name + "." + this._subIndex;
			var sub = { scope: scope, cb: callback, fcb: filter, data: subscriberData, sid: this._subIndex++, hdl: handle };
			var path = name.split(".");
	 		InterceptOpenAjax.hub._subscribe(InterceptOpenAjax.hub._subscriptions, path, 0, sub);
			return handle;
		}

		// Intercept the call to OpenAjax's publish() function so that we can do accounting.
		// Still invokes the original OpenAjax publish() function, but also calls our
		// shadow version of publish() in order to do the accounting.
		OpenAjax.hub.publish = function(name, message)
		{
			InterceptOpenAjax.nMessagesPublished++;
			OpenAjaxInteropFest10_OrigPublish.call(OpenAjax.hub, name, message);
			var path = name.split(".");
			InterceptOpenAjax.hub._pubDepth++;
			InterceptOpenAjax.hub._publish(this._subscriptions, path, 0, name, message);
			InterceptOpenAjax.hub._pubDepth--;
			if((InterceptOpenAjax.hub._cleanup.length > 0) && (InterceptOpenAjax.hub._pubDepth == 0)) {
				for(var i = 0; i < InterceptOpenAjax.hub._cleanup.length; i++) 
					InterceptOpenAjax.hub.unsubscribe(InterceptOpenAjax.hub._cleanup[i].hdl);
				delete(InterceptOpenAjax.hub._cleanup);
				InterceptOpenAjax.hub._cleanup = [];
			}
		}

		// Intercept the call to OpenAjax's unsubscribe() function so that we can do accounting.
		// Still invokes the original OpenAjax unsubscribe() function, but also calls our
		// shadow version of unsubscribe() in order to do the accounting.
		OpenAjax.hub.unsubscribe = function(sub) 
		{
			OpenAjaxInteropFest10_OrigUnsubscribe.call(OpenAjax.hub, sub);
			var path = sub.split(".");
			var sid = path.pop();
			InterceptOpenAjax.hub._unsubscribe(InterceptOpenAjax.hub._subscriptions, path, 0, sid);
		}
		
		h._subscribe = function(tree, path, index, sub) 
		{
			var token = path[index];
			if(index == path.length) 	
				tree.s.push(sub);
			else { 
				if(typeof tree.c == "undefined")
					 tree.c = {};
				if(typeof tree.c[token] == "undefined") {
					tree.c[token] = { c: {}, s: [] }; 
					this._subscribe(tree.c[token], path, index + 1, sub);
				}
				else 
					this._subscribe( tree.c[token], path, index + 1, sub);
			}
		}

		h._publish = function(tree, path, index, name, msg) {
			if(typeof tree != "undefined") {
				var node;
				if(index == path.length) {
					node = tree;
				} else {
					this._publish(tree.c[path[index]], path, index + 1, name, msg);
					this._publish(tree.c["*"], path, index + 1, name, msg);			
					node = tree.c["**"];
				}
				if(typeof node != "undefined") {
					var callbacks = node.s;
					var max = callbacks.length;
					for(var i = 0; i < max; i++) {
						if(callbacks[i].cb) {
							InterceptOpenAjax.nMessagesReceived++;

							// Check to see if this is a new topic.
							var unique = true;
							for (var topic = 0; topic < OpenAjaxInteropFest10_UniqueTopics.length; topic++) {
								if (name == OpenAjaxInteropFest10_UniqueTopics[topic]) {
									unique = false;
									break;
								}
							}
							if (unique && name != "org.openajax.hub.registerLibrary") {
								OpenAjaxInteropFest10_UniqueTopics.push(name);
							}
						}
					}
				}
			}
		}
			
		h._unsubscribe = function(tree, path, index, sid) {
			if(typeof tree != "undefined") {
				if(index < path.length) {
					var childNode = tree.c[path[index]];
					this._unsubscribe(childNode, path, index + 1, sid);
					if(childNode.s.length == 0) {
						for(var x in childNode.c) 
					 		return;		
						delete tree.c[path[index]];	
					}
					return;
				}
				else {
					var callbacks = tree.s;
					var max = callbacks.length;
					for(var i = 0; i < max; i++) 
						if(sid == callbacks[i].sid) {
							if(this._pubDepth > 0) {
								callbacks[i].cb = null;	
								this._cleanup.push(callbacks[i]);						
							}
							else
								callbacks.splice(i, 1);
							return; 	
						}
				}
			}
		}
	};
}

	/*******************************************************************************
	 * Section 2: Logic to insert an appropriate results snippet into the host document
	 *
	 * The following logic registers event listeners via OpenAjax.hub.subscribe().
	 * The OpenAjaxInteropFest10Results.updateResults() function replaces the
	 * innerHTML value for the element in the host document whose ID is
	 * "InteropFest_10_Results" with an updated results snippet.
	 *
	 ******************************************************************************/

OpenAjaxInteropFest10Results = {};
OpenAjaxInteropFest10Results.registeredLibraries = {};
OpenAjaxInteropFest10Results.updateResults = function() {
	var libcount = 0;
	var liblist = "";
	for (var prefix in OpenAjaxInteropFest10Results.registeredLibraries) {
		if (libcount>0) {
			liblist += "\n";
		}
		liblist += prefix;
		libcount++;
	}
	var elem = document.getElementById("InteropFest_10_Results");
	var s = '';
s+='		<p id="OpenAjaxBanner">';
s+='			<a href="http://www.openajax.org">';
s+='				<img id="OpenAjaxBanner" class="InteropFest_10_Results_Banner" src="InteropFestResultsComponent/OpenAjaxAllianceBanner.jpg" alt="OpenAjax Alliance banner"/>';
s+='			</a>';
s+='		</p>';
s+='	  <p class="HubTestCaption">OpenAjax InteropFest 1.0 Test Results</p>';
s+='		<table id="InteropFest_10_ResultsTable" class="HubTestResults">';
s+='			<tbody>';
s+='				<tr>';
s+='					<td class="HubTestLabel">Library registration test</td>';
if (libcount>2) {
s+='					<td class="HubTestResult" id="registerLibraryResult"><span style="color:green">TEST SUCCESSFUL</span></td>';
} else {
s+='					<td class="HubTestResult" id="registerLibraryResult"><span style="color:red">TEST NOT SUCCESSFUL</span></td>';
}
s+='				</tr>';
s+='				<tr>';
s+='					<td class="HubTestLabel">Pub/sub test</td>';
if (InterceptOpenAjax.nMessagesReceived>0) {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:green">TEST SUCCESSFUL</span></td>';
} else {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:red">TEST NOT SUCCESSFUL</span></td>';
}
s+='				</tr>';
s+='				<tr>';
s+='					<td class="HubTestLabel"># Registered libraries</td>';
if (libcount>2) {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:green">'+libcount+'</span></td>';
} else {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:red">'+libcount+'</span></td>';
}
s+='				</tr>';
s+='				<tr>';
s+='					<td class="HubTestLabel"># Messages published</td>';
if (InterceptOpenAjax.nMessagesPublished>0) {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:green">'+InterceptOpenAjax.nMessagesPublished+'</span></td>';
} else {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:red">'+InterceptOpenAjax.nMessagesPublished+'</span></td>';
}
s+='				</tr>';
s+='				<tr>';
s+='					<td class="HubTestLabel"># Messages received</td>';
if (InterceptOpenAjax.nMessagesReceived>0) {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:green">'+InterceptOpenAjax.nMessagesReceived+'</span></td>';
} else {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:red">'+InterceptOpenAjax.nMessagesReceived+'</span></td>';
}
s+='				</tr>';
s+='				<tr>';
s+='					<td class="HubTestLabel"># Unique topics received</td>';
if (OpenAjaxInteropFest10_UniqueTopics.length>0) {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:green">'+OpenAjaxInteropFest10_UniqueTopics.length+'</span></td>';
} else {
s+='					<td class="HubTestResult" id="PublishSubscribeResult"><span style="color:red">'+OpenAjaxInteropFest10_UniqueTopics.length+'</span></td>';
}
s+='				</tr>';
s+='			</tbody>';
s+='		</table>';
	elem.innerHTML = s;
}

/***************************************************************************
 * At document load time, insert an initial version of the results snippet.
 ***************************************************************************/
OpenAjax.hub.subscribe("org.openajax.interopfest10.bodyload", OpenAjaxInteropFest10Results.updateResults);

/*************************************************************************************************
 * Tell the OpenAjax Hub that this file wants to subscribe to "org.openajax.hub.registerLibrary".
 * This is how the results logic keeps track of which libraries have registered with the Hub.
 *************************************************************************************************/
OpenAjaxInteropFest10Results.registerLibraryCB = function(eventName, payload) {
	OpenAjaxInteropFest10Results.registeredLibraries[payload.prefix] = true;
}
OpenAjax.hub.subscribe("org.openajax.hub.registerLibrary", OpenAjaxInteropFest10Results.registerLibraryCB);

/*************************************************************************************************
 * This JavaScript file represents a mini Ajax library that contains a single visualization component.
 * Tell the OpenAjax Hub about his library via OpenAjax.hub.registerLibrary().
 *************************************************************************************************/
OpenAjax.hub.registerLibrary("OpenAjaxInteropFest10Results", "http://openajax.org/InteropFest10/OpenAjaxInteropFest10Results", "1.0");

/*************************************************************************************************
 * Tell the OpenAjax Hub that this file wants to subscribe to "org.openajax.interopfest10.refreshResults".
 * Other logic in the application can call OpenAjax.hub.publish("org.openajax.interopfest10.refreshResults", null)
 * at any time to send a message that the results snippet needs to be updated and redisplayed.
 *************************************************************************************************/
OpenAjax.hub.subscribe("org.openajax.interopfest10.refreshResults", OpenAjaxInteropFest10Results.updateResults);


