<?xml version="1.0" ?>
<!--

  $Id$

  This file is part of the OpenLink Ajax Toolkit (OAT) project

  Copyright (C) 2006 Ondrej Zara
  Copyright (C) 2006 OpenLink Software

  This project is free software; you can redistribute it and/or modify it
  under the terms of the GNU General Public License as published by the
  Free Software Foundation; only version 2 of the License, dated June 1991

  This project is distributed in the hope that it will be useful, but
  WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
  General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program; if not, write to the Free Software Foundation,
  Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

-->
<xsl:stylesheet version="1.0" xmlns:xsl='http://www.w3.org/1999/XSL/Transform'>
    <xsl:output method="html"/>

<xsl:template name="escapeQuot">
    <xsl:param name="text"/>
	<xsl:variable name="noNewlines" select="normalize-space($text)"/>
    <xsl:choose>
	    <xsl:when test='contains($noNewlines, "&apos;")'>
			<xsl:variable name="bufferBefore" select='substring-before($noNewlines,"&apos;")'/>
			<xsl:variable name="newBuffer" select='substring-after($noNewlines,"&apos;")'/>
			<xsl:value-of select="$bufferBefore"/><xsl:text>\'</xsl:text>
			<xsl:call-template name="escapeQuot">
				<xsl:with-param name="text" select="$newBuffer"/>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$noNewlines"/>
		</xsl:otherwise>
    </xsl:choose>
</xsl:template>
  
<xsl:template name="ol">
	<xsl:for-each select="//object[@type = 'map']/properties/property[name = 'Provider' and value = 4]">
		<xsl:element name="script">
			<xsl:attribute name="src">http://openlayers.org/api/OpenLayers.js</xsl:attribute>
			<xsl:attribute name="type">text/javascript</xsl:attribute>
		</xsl:element>
	</xsl:for-each>
</xsl:template>

<!-- temporary, highly customized (some say hacked) mapping solution -->
	<xsl:template name="maps">
		<xsl:for-each select="//object[@type = 'map']">
			<xsl:if test="properties/property[3]/value = 1">
				featureList.push("gmaps");
				window._apiKey = '<xsl:value-of select="./properties/property/value" />';
			</xsl:if>
			<xsl:if test="properties/property[3]/value = 2">
				featureList.push("ymaps");
				window.YMAPPID = '<xsl:value-of select="./properties/property/value" />';
			</xsl:if>
			<xsl:if test="properties/property[3]/value = 4">
				featureList.push("openlayers");
			</xsl:if>
			<xsl:if test="properties/property[3]/value = 3">
				featureList.push("msapi");
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
<!-- -->

	<xsl:template name="gems">
		<xsl:for-each select="//object[@type = 'gem1']">
			<xsl:element name="link">
				<xsl:attribute name="rel">alternate</xsl:attribute>
				<xsl:attribute name="type"><xsl:value-of select="properties/property[name = 'MIME type']/value" /></xsl:attribute>
				<xsl:attribute name="title"><xsl:value-of select="properties/property[name = 'Link name']/value" /></xsl:attribute>
 				<xsl:attribute name="href"><xsl:value-of select="properties/property[name = 'Resulting file']/value" /></xsl:attribute>
			</xsl:element>
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="form"> <!-- basic form properties -->
		<xsl:for-each select="//form">
			var nocred = "<xsl:value-of select="@nocred" />";
			var showajax = "<xsl:value-of select="@showajax" />";
		</xsl:for-each>
	</xsl:template>
	
	<xsl:template name="datasources">
		<xsl:for-each select="//ds">
			var obj = new OAT.DataSource(<xsl:value-of select="@type" />);
			window.datasources.push(obj);
			<xsl:for-each select="connection">
				obj.connection = new OAT.Connection(<xsl:value-of select="@type" />);
				<xsl:if test="@type = 1">sqlDS.push(obj);</xsl:if>
				<xsl:for-each select="@*">
					<xsl:if test="name() != 'type'">
						obj.connection.options.<xsl:value-of select="name()" /> = "<xsl:value-of select="." />";
					</xsl:if>
				</xsl:for-each>
			</xsl:for-each>
			obj.name = "<xsl:value-of select="@name" />";
			obj.pageSize = <xsl:value-of select="@pagesize" />;
			<xsl:for-each select="options/@*">
				obj.options.<xsl:value-of select="name()" /> = "<xsl:value-of select="." />";
			</xsl:for-each>
			if ("table" in obj.options) {
				if (obj.options.table == "false") { obj.options.table = ""; }
				if (obj.options.table == "undefined") { obj.options.table = ""; }
			}
			if ("query" in obj.options) {
				obj.options.query = '<xsl:call-template name="escapeQuot"><xsl:with-param name="text" select="./query" /></xsl:call-template>';
			}
				<xsl:for-each select="inputFields/inputField">
					obj.inputFields.push("<xsl:value-of select="." />");
				</xsl:for-each>
				<xsl:for-each select="outputFields/outputField">
					obj.outputFields.push('<xsl:call-template name="escapeQuot"><xsl:with-param name="text" select="." /></xsl:call-template>');
				</xsl:for-each>
			
				var fb = obj.fieldBinding;
				<xsl:for-each select="selfFields/selfField">
					fb.selfFields.push(<xsl:value-of select="." />);
				</xsl:for-each>
				<xsl:for-each select="masterFields/masterField">
					fb.masterFields.push('<xsl:call-template name="escapeQuot"><xsl:with-param name="text" select="." /></xsl:call-template>');
				</xsl:for-each>
			<xsl:for-each select="masterDSs/masterDS">
				fb.masterDSs.push("<xsl:value-of select="." />");
			</xsl:for-each>
			<xsl:for-each select="types/type">
				fb.types.push(<xsl:value-of select="." />);
				</xsl:for-each>
			</xsl:for-each>
	</xsl:template>
			
	<xsl:template name="objects">
			<xsl:for-each select="object">
				var name = "<xsl:value-of select="@type" />";
			var obj = new OAT.FormObject[name](0,0,0,1);
				if (obj.userSet) { obj.setValue("<xsl:value-of select="@value" />"); }
			obj.parentContainer = <xsl:value-of select="@parent" />;
			obj.empty = <xsl:value-of select="@empty" />;
				<xsl:if test="@hidden">obj.hidden = 1;</xsl:if>
				obj.elm.style.position = "absolute";
				obj.elm.style.left = <xsl:value-of select="./style/@left" />+"px";
				obj.elm.style.top = <xsl:value-of select="./style/@top" />+"px";
			obj.elm.style.zIndex = <xsl:value-of select="./style/@z-index" />;
				if (obj.resizable) {
					obj.elm.style.width = <xsl:value-of select="./style/@width" />+"px";
					obj.elm.style.height = <xsl:value-of select="./style/@height" />+"px";
				}
				<xsl:for-each select="style/css/@*">
					obj.elm.style.<xsl:value-of select="name()" /> = "<xsl:value-of select="." />";
				</xsl:for-each>
				var index = 0;
				<xsl:for-each select="properties/property">
					var p = obj.properties[index];
					p.name = "<xsl:value-of select="name" />";
					p.value = "<xsl:value-of select="value" />";
				if (p.variable) { p.value = p.value.split(","); }
					index++;
				</xsl:for-each>
			obj.__tp = [];
			<xsl:for-each select="tab_page">
				obj.__tp.push([]);
				<xsl:for-each select="tab_object">
					obj.__tp[obj.__tp.length-1].push(<xsl:value-of select="." />);
				</xsl:for-each>
			</xsl:for-each>
				var index = 0;
				<xsl:for-each select="datasources/datasource">
				if (index) {
					<![CDATA[
					var newds = {ds:false,fieldSets:[]};
					for (var i=0;i<obj.datasources[0].fieldSets.length;i++) {
						var fs = obj.datasources[0].fieldSets[i];
						newds.fieldSets.push({name:fs.name,names:[],realIndexes:[],variable:fs.variable,columnIndexes:(fs.variable ? [] : [-1])});
					}
					obj.datasources.push(newds);
					]]>
				}
					var ds = obj.datasources[index];
				ds.ds = datasources[<xsl:value-of select="@index" />];
				var index2 = 0;
				<xsl:for-each select="fieldset">
					var fs = ds.fieldSets[index2];
					fs.names = [];
					fs.columnIndexes = [];
					<xsl:for-each select="name">
						fs.names.push("<xsl:value-of select="." />");
					</xsl:for-each>
					<xsl:for-each select="columnIndex">
						fs.columnIndexes.push("<xsl:value-of select="." />");
					</xsl:for-each>
					index2++;
					</xsl:for-each>
					index++;
				</xsl:for-each>
				objects.push(obj);
			</xsl:for-each>
	</xsl:template>
	
	<xsl:template name="area">
		var div = $("canvas");
		div.style.backgroundColor = "<xsl:value-of select="//area/@bgcolor" />";
		div.style.color = "<xsl:value-of select="//area/@fgcolor" />";
		div.style.fontSize = "<xsl:value-of select="//area/@size" />";
	</xsl:template>
	
    <xsl:template match = "/*"> <!-- see http://www.dpawson.co.uk/xsl/sect2/root.html for explanation -->
	<html>
		<head>
			<xsl:call-template name="gems" />
			<script type="text/javascript">
				var toolkitPath = "/DAV/JS/oat";
				var featureList = ["ajax","formobject","soap","xmla","window","crypto","webclip","ws",
									"sqlquery","grid","pivot","barchart","dialog","datasource","resize",
									"timeline","piechart","rdf","graphsvg","sparql","connection","linechart","sparkline"];
				<xsl:call-template name="maps" />
				
			</script>
			<script type="text/javascript" src="/DAV/JS/oat/loader.js"></script>
			<script type="text/javascript">
			<![CDATA[
				var datasources = [];
				var objects = [];
				var dialogs = {};
				var sqlDS = [];
			
				/* prepare */
				function attachNav(nav) {
					var ds = nav.properties[0].value;
					OAT.Dom.attach(nav.first,"click",function() { ds.advanceRecord(0); }); 
					OAT.Dom.attach(nav.prevp,"click",function() { ds.advanceRecord(ds.recordIndex - ds.pageSize); });
					OAT.Dom.attach(nav.prev,"click",function() { ds.advanceRecord("-1"); });
					OAT.Dom.attach(nav.next,"click",function() { ds.advanceRecord("+1"); });
					OAT.Dom.attach(nav.nextp,"click",function() { ds.advanceRecord(ds.recordIndex + ds.pageSize); });
//					OAT.Dom.attach(nav.last,"click",function() { ds.advanceRecord(parseInt(nav.total.innerHTML)-1); });
					OAT.Dom.attach(nav.current,"keyup",function(event) { 
						if (event.keyCode != 13) { return; }
						var value = parseInt($v(nav.current));
						ds.advanceRecord(value-1); 
					});
				}
				
				
				function get_value(fb,index) {
					switch (fb.types[index]) {
						case 0: /* typed at designtime */
						case 2: /* typed at runtime */
							var val = fb.masterFields[index];
						break;
						case 1: /* another form */
							var master = fb.masterDSs[index];
							var masterFieldIndex = master.usedFields[fb.masterFields[index]];
							var val = master.lastRow[masterFieldIndex];
						break;
						case 3: /* uinput */
							var val = $v(fb.masterDSs[index].input);
						break;
					}
					return val;
				}
				
				function build_rest(ds) { /* build REST GET string for this form */
					var fb = ds.fieldBinding;
					var pairs = {};
					for (var i=0;i<ds.inputFields.length;i++) {
						pairs[ds.inputFields[i]] = "";
					}
					for (var i=0;i<fb.masterDSs.length;i++) {
						var index = fb.selfFields[i];
						var column = ds.inputFields[index];
						var val = get_value(fb,i);
						pairs[column] = encodeURIComponent(val);
					}
					var q = [];
					for (var p in pairs) { q.push(p+"="+pairs[p]); }
					return q.join("&");
				}

				function build_wsdl(ds) { /* build wsdl input object for this form */
					var fb = ds.fieldBinding;
					var inputObj = {};
					for (var i=0;i<ds.inputFields.length;i++) {
						inputObj[ds.inputFields[i]] = "";
					}
					for (var i=0;i<fb.masterDSs.length;i++) {
						var index = fb.selfFields[i];
						var column = ds.inputFields[index];
						var val = get_value(fb,i);
						inputObj[column] = val;
					}
					var result = {};
					result[ds.rootElement] = inputObj;
					return result;
				}
				
				function build_query(ds) { /* build query for this form */
					var fb = ds.fieldBinding;
					if (!ds._oldQuery) { ds._oldQuery = ds.options.query; }
					/* easy way */
					if (!fb.masterDSs.length) { return ds._oldQuery; }
					/* hard way */
					var queryObj = new OAT.SqlQuery();
					queryObj.fromString(ds._oldQuery);
					for (var i=0;i<fb.masterDSs.length;i++) {
						if (queryObj.groups.count) {
							var c = queryObj.havings.add();
						} else {
							var c = queryObj.conditions.add();
						}
						c.logic = "AND";
						c.operator = "=";
						var selfFieldIndex = ds.usedFields[fb.selfFields[i]];
						c.column = OAT.SqlQueryData.qualifyOne(queryObj.columns.items[selfFieldIndex].column);
						var val = get_value(fb,i);
						if (isNaN(val) || val == "") { val = "'"+val+"'"; }
						c.value = val;
					}
					return queryObj.toString(OAT.SqlQueryData.TYPE_SQL);
				}
				
				function call_for_data(ds) {
					ds.reset();
					switch (ds.type) { 
						case OAT.DataSourceData.TYPE_SQL:
							var q = build_query(ds);
							if (ds.lastQuery && q == ds.lastQuery) { return; }
							ds.lastQuery = q;
							ds.options.query = q;
						break;
						
						case OAT.DataSourceData.TYPE_SOAP:
							var inputObj = build_wsdl(ds);
							ds.options.inputobj = inputObj;
						break;
						
						case OAT.DataSourceData.TYPE_REST:
							ds.options.query = build_rest(ds);
						break;
						
						case OAT.DataSourceData.TYPE_SPARQL:
							var sq = new OAT.SparqlQuery();
							sq.fromString(ds.options.query);
							var formatStr = sq.variables.length ? "format=xml" : "format=rdf"; /* xml for SELECT, rdf for CONSTRUCT */
							if (ds.options.query != "") { /* query specified in textarea */
								var q = "query="+encodeURIComponent(ds.options.query)+"&"+formatStr;
								ds.options.query = q;
							}
						break;
						
						case OAT.DataSourceData.TYPE_GDATA:
							var q = ds.options.query ? "q="+encodeURIComponent(ds.options.query) : "";
							ds.options.query = q;
						break;
					}

					/* notify objects that new data will arrive soon */
					for (var i=0;i<objects.length;i++) {
						var o = objects[i];
						for (var j=0;j<o.datasources.length;j++) {
							var ods = o.datasources[j];
							if (ods.ds == ds && o.notify) { o.notify(); }
					}
					}
					ds.advanceRecord(0);
				}

				function draw_form() {
					var do_binding = function(o,index) {
						var ds = o.datasources[index].ds;
						if (!ds) { return; }
						if (o.bindRecordCallback) { 
							var ref1 = function(dataRow,currentIndex) { o.bindRecordCallback(dataRow,currentIndex,index); }
							ds.bindRecord(ref1); 
						}
						if (o.bindPageCallback) { 
							var ref2 = function(dataRows,currentPageIndex) { o.bindPageCallback(dataRows,currentPageIndex,index); }
							ds.bindPage(ref2); 
						}
						if (o.empty) {
							var ref3 = function() { o.clear(index); }
							ds.bindEmpty(ref3); 
						}
					}
					for (var i=0;i<objects.length;i++) {
						var o = objects[i];
						
							if (!o.hidden) {
							$("canvas").appendChild(objects[i].elm);
								o.init();
							if (o.name == "nav") { 
								attachNav(o); 
								var nav_ds = o.properties[0].value;
								nav_ds.bindRecord(o.bindRecordCallback);
							}
							if (o.name == "graph") {
								var graph_ds = o.properties[0].value;
								graph_ds.bindFile(o.bindFileCallback);
							}
							for (var j=0;j<o.datasources.length;j++) {
								do_binding(o,j);
							}
							} /* not hidden */
							if (o.name == "map" || o.name == "grid" || o.name == "twostate" || o.name == "pivot") {
								OAT.Resize.createDefault(o.elm);
							} /* if movable object */
					} /* for all objects */
					/* create tab dependencies */
					for (var i=0;i<objects.length;i++) if (objects[i].name == "tab") {
						var o = objects[i];
						var max = o.properties[0].value.length;
						o.countChangeCallback(0,max);
						for (var j=0;j<max;j++) { o.changeCallback(j,o.properties[0].value[j]); }
						for (var j=0;j<o.__tp.length;j++) {
							o.tab.go(j);
							var tp = o.__tp[j];
							for (var k=0;k<tp.length;k++) { 
								var victim = objects[tp[k]];
								var coords = OAT.Dom.getLT(victim.elm);
								o.consume(victim,coords[0],coords[1]); 
							}
						}
					}
					/* create subforms for lookup windows & possible drag handles */
					for (var i=0;i<objects.length;i++) { 
						var o = objects[i];
						if ((o.parentContainer && o.parentContainer.properties[1].value == "1") || o.name == "nav") { 
							var useIcon = (o.name == "map" || o.name == "pivot" || o.name == "grid" || o.name == "twostate");
							OAT.Drag.createDefault(o.elm,useIcon); 
						}
						if (o.name == "container") { o.createForm(objects); }
					}
				}

				function ask_for_params() {
					var p = [];
					for (var i=0;i<datasources.length;i++) {
						var fb = datasources[i].fieldBinding;
						for (var j=0;j<fb.selfFields.length;j++) {
							if (fb.types[j] == 2) {
								p.push([datasources[i],j]);
							}
						}
					}
					if (!p.length) { go(); return; }
					dialogs.params.show();
					for (var i=0;i<p.length;i++) {
						/* ask for this parameter */
						var ds = p[i][0];
						var index = p[i][1];
						var div = OAT.Dom.create("div");
						var label = OAT.Dom.create("span");
						var input = OAT.Dom.create("input");
						input.type = "text";
						
						label.innerHTML = ds.inputFields[ds.fieldBinding.selfFields[index]] + ' = ';
						
						div.appendChild(label);
						div.appendChild(input);
						$("parameters_content").appendChild(div);
						bindParameter(input,ds,index);
					}
				}
				
				function bindParameter(input,ds,index) {
					var ref = function() {
						ds.fieldBinding.masterFields[index] = $v(input);
					}
					OAT.Dom.attach(input,"keyup",ref);
				}
				
				function go() {
					/* massive re-computation of used fields for table binding */
					for (var i=0;i<datasources.length;i++) { /* count used columns */
						var ds = datasources[i];
						ds.usedFields = [];
						for (var j=0;j<ds.outputFields.length;j++) { ds.usedFields.push(-1); }
					}
					for (var i=0;i<objects.length;i++) {
						var o = objects[i];
						for (var j=0;j<o.datasources.length;j++) {
							var ds = o.datasources[j];
							for (var k=0;k<ds.fieldSets.length;k++) {
								var fs = ds.fieldSets[k];
								for (var l=0;l<fs.columnIndexes.length;l++) {
									if (fs.columnIndexes[l] != -1) { ds.ds.usedFields[fs.columnIndexes[l]] = 1; }
								} /* all fs parts */
							} /* for all fieldsets */
						} /* all datasources */
					} /* all objects */
					
					/* also binding columns need to be included in query */
					for (var i=0;i<datasources.length;i++) { 
						var ds = datasources[i];
						var fb = ds.fieldBinding;
						for (var j=0;j<fb.selfFields.length;j++) {
							ds.usedFields[fb.selfFields[j]] = 1;
						}
						for (var j=0;j<fb.masterDSs.length;j++) {
							var type = fb.types[j];
							if (type == 1) { fb.masterDSs[j].usedFields[fb.masterFields[j]] = 1; }
						}
					}

					/* we have now marked all really used fields */

					/* create right queries */
					for (var i=0;i<datasources.length;i++) { 
						var ds = datasources[i];
						if (ds.type == OAT.DataSourceData.TYPE_SQL && ds.options.table) { /* only table forms */
							var q = [];
							var index = 0;
							for (var j=0;j<ds.usedFields.length;j++) {
								if (ds.usedFields[j] == 1) {
									q.push(ds.outputFields[j]);
									ds.usedFields[j] = index;
									index++;
								} /* if column is used */
							} /* for all used columns */
							ds.query = "SELECT "+q.join(", ")+" FROM "+OAT.SqlQueryData.qualifyMulti(ds.options.table);
						} else {
							for (var j=0;j<ds.usedFields.length;j++) {
								ds.usedFields[j] = j;
							}
							/* non-table bindings have all usedcolumns ok */
						}
					}
					/* create realIndexes */
					for (var i=0;i<objects.length;i++) {
						var o = objects[i];
						for (var j=0;j<o.datasources.length;j++) {
							var ds = o.datasources[j];
							for (var k=0;k<ds.fieldSets.length;k++) {
								var fs = ds.fieldSets[k];
								fs.realIndexes = [];
								for (var l=0;l<fs.columnIndexes.length;l++) {
									if (fs.columnIndexes[l] == -1) {
										fs.realIndexes.push(-1);
								} else {
										fs.realIndexes.push(ds.ds.usedFields[fs.columnIndexes[l]]);
								} /* not -1 */
								} /* all fs parts */
							} /* all fieldsets */
						} /* all datasources */
					} /* all objects */						

					/* draw */
					draw_form();

					/* call for initial data */
					var topLevelCandidates = [];
					for (var i=0;i<datasources.length;i++) {
						var hope = 1;
						var fb = datasources[i].fieldBinding;
						for (var j=0;j<fb.types.length;j++) {
							var t = fb.types[j];
							if (t == 1 || t == 3) { hope = 0; }
						}
						if (hope) { topLevelCandidates.push(datasources[i]); }
					}
					for (var i=0;i<topLevelCandidates.length;i++) {
						call_for_data(topLevelCandidates[i]); 
					}
				}
				
				function init_after_maps() {
			]]>
			
			<xsl:call-template name="form" />
			<xsl:call-template name="datasources" />
			<xsl:call-template name="area" />
			<xsl:call-template name="objects" />
			
			<![CDATA[
					/* webclip */
					var onRef = function() {}
					var outRef = function() {}
					var genRef = function() { 
						var xhtml = $("canvas").innerHTML; 
						return "<style>.webclip {display:none}</style>"+xhtml;
					}
					var pasteRef = function(xmlStr) {}
					var typeRef = function() { return "ol_form_xhtml"; }
					OAT.WebClipBindings.bind("webclip", typeRef, genRef, pasteRef, onRef, outRef);

					/* decode base64 names & passwords */
					for (var i=0;i<datasources.length;i++) if (datasources[i].connection.type == OAT.ConnectionData.TYPE_XMLA) {
						var o = datasources[i].connection.options;
						o.user = OAT.Crypto.base64d(o.user);
						o.password = OAT.Crypto.base64d(o.password);
					}
					
					/* various references */
					var create_callback = function(index) { return function() { call_for_data(datasources[index]); };}
					for (var i=0;i<datasources.length;i++) {
						var fb = datasources[i].fieldBinding;
						for (var j=0;j<fb.types.length;j++) {
							switch (fb.types[j]) {
								case 1:
									fb.masterDSs[j] = datasources[parseInt(fb.masterDSs[j])];
								break;
								case 3:
									fb.masterDSs[j] = objects[parseInt(fb.masterDSs[j])];
									fb.masterDSs[j].changeCallback = create_callback(i);
								break;
							} /* switch */
						} /* all field bindings */
					} /* all datasources*/
					
					/* control references */
					for (var i=0;i<objects.length;i++) {
						if (objects[i].parentContainer != -1) {
							objects[i].parentContainer = objects[objects[i].parentContainer];
						} else { objects[i].parentContainer = false; }
						if (objects[i].name == "nav" || objects[i].name == "graph") { 
							objects[i].properties[0].value = datasources[parseInt(objects[i].properties[0].value)];
						}
						for (var j=0;j<objects[i].properties.length;j++) {
							var p = objects[i].properties[j];
							if (p.type == "container") { p.value = (parseInt(p.value) == -1 ? false : objects[parseInt(p.value)]); }
						}
					}
					
					OAT.Dom.unlink("loading");
					$("ajax_alert").style.display = "block";

					/* ajax */
					var ajax = new OAT.Dialog("Please wait","ajax_alert",{width:240,modal:0,zIndex:1001,resize:0});
					ajax.ok = ajax.hide;
					ajax.cancel = ajax.hide;
					OAT.Ajax.setCancel(ajax.cancelBtn);
					if (showajax == "1") {
						OAT.Ajax.setStart(ajax.show);
						OAT.Ajax.setEnd(ajax.hide);
					}
					
					dialogs.params = new OAT.Dialog("Parameters","parameters",{width:400,modal:1,zIndex:1000});
					dialogs.params.ok = function() { dialogs.params.hide(); go(); }
					OAT.Dom.unlink(dialogs.params.cancelBtn);
					
					var cont = function() {
						/* datasources also listen for data -> because of subforms */
						var backRef = function(ds) {
							return function(dataRow,index,total) {
								/* optionally modify sub-forms */
								ds.lastRow = dataRow;
								var candidates = {};
								for (var i=0;i<datasources.length;i++) {
									var fb = datasources[i].fieldBinding;
									for (var j=0;j<fb.masterDSs.length;j++) {
										if (fb.masterDSs[j] == ds) { candidates[i] = 1; }
						}
							}
								for (p in candidates) {	call_for_data(datasources[p]); }
						}
							}
						for (var i=0;i<datasources.length;i++) {
							var br = backRef(datasources[i]);
							datasources[i].bindRecord(br);
						}
						/* ask for qualifiers */
						if (sqlDS.length) {
						var qRef = function(qualifs) {
							OAT.SqlQueryData.columnQualifierPre = qualifs[0];
							OAT.SqlQueryData.columnQualifierPost = qualifs[1];
							ask_for_params();
						}
							OAT.Xmla.endpoint = sqlDS[0].connection.options.endpoint;
							OAT.Xmla.dsn = sqlDS[0].connection.options.dsn;
							OAT.Xmla.user = sqlDS[0].connection.options.user;
							OAT.Xmla.password = sqlDS[0].connection.options.password;
						OAT.Xmla.qualifiers(qRef);
						} else { ask_for_params(); }
					} /* cont */
					
					if (!sqlDS.length || parseInt(nocred) || (sqlDS.length && sqlDS[0].connection.options.user != "")) {
						/* we can continue */
						OAT.Dom.unlink("credentials");
						cont();
					} else {
						/* user must input credentials */
						var d = new OAT.Dialog("Credentials","credentials",{modal:1,width:300});
						d.show();
						var ref = function() {
							for (var i=0;i<datasources.length;i++) if (datasources[i].connection.type == OAT.ConnectionData.TYPE_XMLA) {
								var o = datasources[i].connection.options;
								o.user = $v("cred_user");
								o.password = $v("cred_password");
							}
							d.hide();
							cont();
						}
						d.ok = ref;
						d.cancel = d.hide;
					}
				} /* init_after_maps */
					
				function init() {
					var index=-1;
					for (var i=0;i<featureList.length;i++) if (featureList[i] == "ymaps") { index = i; } 
					if ((window.YahooMapsAPIAjax || index == -1)) { 
						init_after_maps();
					} else {
						setTimeout(init,100);
					}
				}
			]]>
			</script>
			
			<style type="text/css">
				@import url("/DAV/JS/styles/grid.css");
				@import url("/DAV/JS/styles/timeline.css");
				@import url("/DAV/JS/styles/pivot.css");
				@import url("/DAV/JS/styles/webclip.css");

				.ie_height_fix {
					height: expression(this.ieHeight ? eval(this.ieHeight.offsetHeight) : "0px");
				}

				.right {
					text-align: right;
				}
				
				body {
					font-family: verdana;
					padding: 0px;
					margin: 0px;
				}
				
				#credentials {
					margin: 1em;
				}

				#canvas {
					width: 100%;
					height: 1000px;
				}


				#ajax_alert {
					font-weight: bold;
				}

				#ajax_progress {
					background-image:url("/DAV/JS/images/progress.gif");
					height: 16px;
					width: 80%;
				}

				.nav {
					font-weight: bold;
					position: absolute;
					left: 10px;
					bottom: 10px;
				}			

				.form {
					border: 2px ridge #aaa;
				}

				.chart {
					height: 200px;
					background-color: #aaa;
					position: relative;
				}

				.legend {
					background-color: #fff;
					border: 1px solid #000;
					font-size: 90%;
					padding: 1px;
				}

				.legend_box {
					width: 10px;
					height: 10px;
					border: 1px solid #000;
					margin: 2px;
					float: left;
					font-size: 0px;
				}

				.textX {
					font-size: 60%;
					text-align: center;
				}

				.textY {
					font-size: 80%;
				}				
				#webclip {
					position: absolute;
					top: 1px;
					right: 1px;
					z-index: 900;
				}

				ul, li {
					margin: 0px;
					padding: 0px;
				}

				ul.tab {
					list-style-type: none;
					position:relative;
					left:-2px;
					_left:-4px;
				}

				li.tab {
					display: block;
					border: 2px solid #000;
					padding: 2px 3px;
					margin-right: 0.5em;
					cursor: pointer;
					height:20px;
					_height:28px;
					float:left;
					background-color: #aaa;
				}

				li.tab_selected {
					background-color: #888;
					border-bottom-color: #888;
				}

				li.tab:hover {
					background-color: #ccc;
				}
				
				li.tab_selected:hover {
					background-color: #888;
				}
				
				.tag_cloud a {
					text-decoration: none;
					color: #000;
				}
				</style>
			
			<title>Form</title>
		</head>
		
		<body>
			<div id="loading">Loading...</div>
			<div id="ajax_alert" style="display:none">
				Ajax call in progress...
				<div id="ajax_progress"></div>
			</div>
			<div id="webclip"></div>
			<div id="canvas"></div>
			<div id="credentials">
				<table>
				<tr><td class="right">Name: </td><td><input name="cred_user" value="demo" type="text" id="cred_user" /></td></tr>
				<tr><td class="right">Password: </td><td><input name="cred_password" value="demo" type="password" id="cred_password" /></td></tr>
				</table>
			</div>
			<div id="parameters">
				<div id="parameters_content"></div>
			</div>
		</body>
	</html>
	</xsl:template>
</xsl:stylesheet>
