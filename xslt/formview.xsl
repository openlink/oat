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
    <xsl:choose>
	    <xsl:when test='contains($text, "&apos;")'>
			<xsl:variable name="bufferBefore" select='substring-before($text,"&apos;")'/>
			<xsl:variable name="newBuffer" select='substring-after($text,"&apos;")'/>
			<xsl:value-of select="$bufferBefore"/><xsl:text>\'</xsl:text>
			<xsl:call-template name="escapeQuot">
				<xsl:with-param name="text" select="$newBuffer"/>
			</xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="$text"/>
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
				featureList.push("map");
				featureList.push("layers");
			</xsl:if>
			<xsl:if test="properties/property[3]/value = 3">
				featureList.push("msapi");
			</xsl:if>
		</xsl:for-each>
	</xsl:template>
<!-- -->

	<xsl:template name="gems">
		<xsl:for-each select="//object[@type = 'gem']">
			<xsl:element name="link">
				<xsl:attribute name="rel">alternate</xsl:attribute>
				<xsl:attribute name="type"><xsl:value-of select="properties/property[name = 'MIME type']/value" /></xsl:attribute>
				<xsl:attribute name="title"><xsl:value-of select="properties/property[name = 'Link name']/value" /></xsl:attribute>
 				<xsl:attribute name="href"><xsl:value-of select="properties/property[name = 'Resulting file']/value" /></xsl:attribute>
			</xsl:element>
		</xsl:for-each>
	</xsl:template>

	<xsl:template name="connection"> <!-- setup connection -->
		<xsl:for-each select="//connection">
			OAT.Xmla.dsn = "<xsl:value-of select="@dsn" />";
			OAT.Xmla.endpoint = "<xsl:value-of select="@endpoint" />";
			OAT.Xmla.user = "<xsl:value-of select="@user" />";
			OAT.Xmla.password = "<xsl:value-of select="@password" />";
			var nocred = "<xsl:value-of select="@nocred" />";
			var showajax = "1";
			if ("<xsl:value-of select="@showajax" />" == "0") { showajax = "0"; }
		</xsl:for-each>
	</xsl:template>
	
	<xsl:template name="forms">
		<xsl:for-each select="//form">
			var div = OAT.Dom.create("div");
			div.className = "form";
			var obj = new OAT.Form(window);
			obj.empty = "<xsl:value-of select="@empty" />";
			obj.div = div;
			<xsl:if test="@hidden">obj.hidden = 1;</xsl:if>
			obj.pageSize = <xsl:value-of select="@pagesize" />;
			obj.cursorType = <xsl:value-of select="@pagesize" />;
			
			<xsl:for-each select="datasource">
				obj.ds.type = <xsl:value-of select="@type" />;
				obj.ds.subtype = <xsl:value-of select="@subtype" />;
				obj.ds.url = "<xsl:value-of select="@url" />";
				obj.ds.service = "<xsl:value-of select="@service" />";
				obj.ds.xpath = parseInt(<xsl:value-of select="@xpath" />);
				obj.ds.rootElement = "<xsl:value-of select="@rootelement" />";
				obj.ds.query = '<xsl:call-template name="escapeQuot"><xsl:with-param name="text" select="./query" /></xsl:call-template>';
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
				<xsl:for-each select="masterForms/masterForm">
					fb.masterForms.push("<xsl:value-of select="." />");
				</xsl:for-each>
			</xsl:for-each>
			
			forms.push(obj);
			obj.oneShotCallback = false;
			obj.div.style.backgroundColor = "<xsl:value-of select="./area/@bgcolor" />";
			obj.div.style.color = "<xsl:value-of select="./area/@fgcolor" />";
			obj.div.style.fontSize = "<xsl:value-of select="./area/@size" />";
			if (forms.length) {
				obj.div.style.position = "absolute";
				obj.div.style.left = "<xsl:value-of select="./area/@left" />px";
				obj.div.style.top = "<xsl:value-of select="./area/@top" />px";
				obj.div.style.width = "<xsl:value-of select="./area/@width" />px";
				obj.div.style.height = "<xsl:value-of select="./area/@height" />px";
			}
			var f = obj;
			<xsl:for-each select="object">
				var name = "<xsl:value-of select="@type" />";
				if (name == "pivot") { f.cursorType = 0; } // pivot => snapshot
				var obj = new OAT.FormObject[name](0,0,0);
				if (obj.userSet) { obj.setValue("<xsl:value-of select="@value" />"); }
				<xsl:if test="@hidden">obj.hidden = 1;</xsl:if>
				obj.form = f;
				obj.elm.style.position = "absolute";
				obj.elm.style.left = <xsl:value-of select="./style/@left" />+"px";
				obj.elm.style.top = <xsl:value-of select="./style/@top" />+"px";
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
					index++;
				</xsl:for-each>
				var index = 0;
				<xsl:for-each select="datasources/datasource">
					var ds = obj.datasources[index];
					ds.names = [];
					ds.columnIndexes = [];
					<xsl:for-each select="name">
						ds.names.push("<xsl:value-of select="." />");
					</xsl:for-each>
					<xsl:for-each select="columnIndex">
						ds.columnIndexes.push("<xsl:value-of select="." />");
					</xsl:for-each>
					index++;
				</xsl:for-each>
				
				objects.push(obj);
			</xsl:for-each>
			var ps = f.pageSize;
			if (f.cursorType == 0) { ps = 0; }
			f.dso = new OAT.DataSource(ps);
		</xsl:for-each>
	</xsl:template>
	
    <xsl:template match = "/*"> <!-- see http://www.dpawson.co.uk/xsl/sect2/root.html for explanation -->
	<html>
		<head>
			<xsl:call-template name="gems" />
			<xsl:call-template name="ol" />
			<script type="text/javascript">
				var toolkitPath = "/DAV/JS/toolkit";
				var featureList = ["dom","ajax","formobject","soap","xmla","window","crypto","webclip","ws",
									"sqlquery","grid","pivot","barchart","dialog","datasource","resize","form",
									"timeline"];
				<xsl:call-template name="maps" />
				
			</script>
			<script type="text/javascript" src="/DAV/JS/toolkit/loader.js"></script>
			<script type="text/javascript">
			<![CDATA[
				var forms = [];
				var objects = [];
				var dialogs = {};
			
				/* prepare */
				function attachNav(nav) {
					OAT.Dom.attach(nav.first,"click",function() { nav.form.dso.advanceRecord(0); });
					OAT.Dom.attach(nav.prevp,"click",function() { nav.form.dso.advanceRecord(nav.form.dso.recordIndex - nav.form.dso.pageSize); });
					OAT.Dom.attach(nav.prev,"click",function() { nav.form.dso.advanceRecord("-1"); });
					OAT.Dom.attach(nav.next,"click",function() { nav.form.dso.advanceRecord("+1"); });
					OAT.Dom.attach(nav.nextp,"click",function() { nav.form.dso.advanceRecord(nav.form.dso.recordIndex + nav.form.dso.pageSize); });
//					OAT.Dom.attach(nav.last,"click",function() { nav.form.dso.advanceRecord(parseInt(nav.total.innerHTML)-1); });
					OAT.Dom.attach(nav.current,"keyup",function(event) { 
						if (event.keyCode != 13) { return; }
						var value = parseInt($v(nav.current));
						nav.form.dso.advanceRecord(value-1); 
					});
				}
				
				function build_rest(form) { /* build REST GET string for this form */
					var f = form;
					var fb = f.fieldBinding;
					var pairs = {};
					for (var i=0;i<f.inputFields.length;i++) {
						pairs[f.inputFields[i]] = "";
					}
					for (var i=0;i<fb.masterForms.length;i++) {
						var index = fb.selfFields[i];
						var column = f.inputFields[index];
						if (fb.masterForms[i]) { /* normal binding */
							var master = fb.masterForms[i];
							var masterFieldIndex = master.usedFields[fb.masterFields[i]];
							var val = master.lastRow[masterFieldIndex];
						} else {
							/* user-typed value */
							var val = fb.masterFields[i];
						}
						pairs[column] = encodeURIComponent(val);
					}
					var q = [];
					for (var p in pairs) { q.push(p+"="+pairs[p]); }
					return q.join("&");
				}

				function build_wsdl(form) { /* build wsdl input object for this form */
					var f = form;
					var fb = f.fieldBinding;
					var inputObj = {};
					for (var i=0;i<f.inputFields.length;i++) {
						inputObj[f.inputFields[i]] = "";
					}
					for (var i=0;i<fb.masterForms.length;i++) {
						var index = fb.selfFields[i];
						var column = f.inputFields[index];
						if (fb.masterForms[i]) { /* normal binding */
							var master = fb.masterForms[i];
							var masterFieldIndex = master.usedFields[fb.masterFields[i]];
							var val = master.lastRow[masterFieldIndex];
						} else {
							/* user-typed value */
							var val = fb.masterFields[i];
						}
						inputObj[column] = val;
					}
					var result = {};
					result[f.ds.rootElement] = inputObj;
					return result;
				}
				
				function build_query(form) { /* build query for this form */
					var f = form;
					var fb = f.fieldBinding;
					/* easy way */
					if (!fb.masterForms.length) { return f.ds.query; }
					/* hard way */
					var queryObj = new OAT.SqlQuery();
					queryObj.fromString(f.ds.query);
					for (var i=0;i<fb.masterForms.length;i++) {
						if (queryObj.groups.count) {
							var c = queryObj.havings.add();
						} else {
							var c = queryObj.conditions.add();
						}
						c.logic = "AND";
						c.operator = "=";
						var selfFieldIndex = f.usedFields[fb.selfFields[i]];
						c.column = OAT.SqlQueryData.qualifyOne(queryObj.columns.items[selfFieldIndex].column);
						if (fb.masterForms[i]) { /* normal binding */
							var master = fb.masterForms[i];
							var masterFieldIndex = master.usedFields[fb.masterFields[i]];
							var val = master.lastRow[masterFieldIndex];
						} else {
							/* user-typed value */
							var val = fb.masterFields[i];
						}
						if (isNaN(val) || val == "") { val = "'"+val+"'"; }
						c.value = val;
					}
					return queryObj.toString(OAT.SqlQueryData.TYPE_SQL);
				}
				
				function call_for_data(form) {
					switch (form.ds.type) { 
						case 1:
							var q = build_query(form);
							if (form.lastQuery && q == form.lastQuery) { return; }
							form.dso.init();
							form.lastQuery = q;
							form.dso.setQuery(q);
						break;
						
						case 2:
							var inputObj = build_wsdl(form);
							form.dso.init();
							form.dso.setWSDL(form.ds.url,form.ds.service,inputObj,form.outputFields);
						break;
						
						case 3:
							var q = build_rest(form);
							form.dso.init();
							form.dso.setREST(form.ds.url,form.ds.subtype,form.ds.xpath,q,form.outputFields);
						break;
						
					}

					/* notify objects that new data will arrive soon */
					for (var i=0;i<objects.length;i++) {
						var o = objects[i];
						if (o.form == form && o.notify) { o.notify(); }
					}
					if (form.oneShotCallback) {	
						form.dso.oneShotCallback = form.oneShotCallback;
						form.oneShotCallback = false; 
					}
					form.dso.advanceRecord(0);
				}

				function draw_form(form) {
					var f = form;
					if (f.hidden) { return; }
					if (!f.pin) { $("canvas").appendChild(f.div); }
					var maxPage = 0;
					
					for (var i=0;i<objects.length;i++) {
						var o = objects[i];
						if (o.form == f) {
							if (!o.hidden) {
								f.div.appendChild(objects[i].elm);
								o.init();
								if (o.name == "nav") { attachNav(o);	}
								if (o.bindRecordCallback) { f.dso.bindRecord(o.bindRecordCallback); }
								if (o.bindPageCallback) { f.dso.bindPage(o.bindPageCallback); }
							} /* not hidden */
							if (o.name == "map" || o.name == "grid" || o.name == "twostate" || o.name == "pivot") {
								OAT.Resize.createDefault(o.elm);
								if (f != forms[0]) { OAT.Drag.createDefault(o.elm,f.div); } else { OAT.Drag.createDefault(o.elm); }
							} /* if movable object */
						} /* if in this form */
					} /* for all objects */
					
					if (form != forms[0]) { OAT.Resize.createDefault(f.div); }
				}

				function ask_for_params() {
					var p = [];
					for (var i=0;i<forms.length;i++) {
						var fb = forms[i].fieldBinding;
						for (var j=0;j<fb.selfFields.length;j++) {
							if (!fb.masterForms[j] && fb.masterFields[j] == -1) {
								p.push([forms[i],j]);
							}
						}
					}
					if (!p.length) { go(); return; }
					dialogs.params.show();
					for (var i=0;i<p.length;i++) {
						/* ask for this parameter */
						var f = p[i][0];
						var index = p[i][1];
						var div = OAT.Dom.create("div");
						var label = OAT.Dom.create("span");
						var input = OAT.Dom.create("input");
						input.type = "text";
						
						label.innerHTML = f.inputFields[f.fieldBinding.selfFields[index]] + ' = ';
						
						div.appendChild(label);
						div.appendChild(input);
						$("parameters_content").appendChild(div);
						bindParameter(input,f,index);
					}
				}
				
				function bindParameter(input,form,index) {
					var ref = function() {
						form.fieldBinding.masterFields[index] = $v(input);
					}
					OAT.Dom.attach(input,"keyup",ref);
				}
				
				function go() {
					/* massive re-computation of used fields for table binding */
					for (var i=0;i<forms.length;i++) { /* count used columns */
						var f = forms[i];
						f.usedFields = [];
						for (var j=0;j<f.outputFields.length;j++) { f.usedFields.push(-1); }
					}
					for (var i=0;i<objects.length;i++) {
						var o = objects[i];
						for (var j=0;j<o.datasources.length;j++) {
							var ds = o.datasources[j];
							for (var k=0;k<ds.columnIndexes.length;k++) {
								if (ds.columnIndexes[k] != -1) { o.form.usedFields[ds.columnIndexes[k]] = 1; }
							} /* all ds parts */
						} /* all datasources */
					} /* all objects */
					
					/* also binding columns need to be included in query */
					for (var i=0;i<forms.length;i++) { 
						var f = forms[i];
						var fb = f.fieldBinding;
						for (var j=0;j<fb.selfFields.length;j++) {
							f.usedFields[fb.selfFields[j]] = 1;
						}
						for (var j=0;j<fb.masterForms.length;j++) {
							var mf = fb.masterForms[j];
							if (mf != false) { mf.usedFields[fb.masterFields[j]] = 1; } /* if not user set or parametric */
						}
					}

					/* we have now marked all really used fields */

					/* create right queries */
					for (var i=0;i<self.forms.length;i++) { 
						var f = self.forms[i];
						if (f.ds.type == 1 && f.ds.subtype == 3) { /* only table forms */
							var q = [];
							var index = 0;
							for (var j=0;j<f.usedFields.length;j++) {
								if (f.usedFields[j] == 1) {
									q.push(f.outputFields[j]);
									f.usedFields[j] = index;
									index++;
								} /* if column is used */
							} /* for all used columns */
							f.ds.query = "SELECT "+q.join(", ")+" FROM "+OAT.SqlQueryData.qualifyMulti(f.ds.url);
						} else {
							for (var j=0;j<f.usedFields.length;j++) {
								f.usedFields[j] = j;
							}
							/* non-table bindings have all usedcolumns ok */
						}
					}
					/* create realIndexes */
					for (var i=0;i<objects.length;i++) {
						var o = objects[i];
						var f = o.form;
						for (var j=0;j<o.datasources.length;j++) {
							var ds = o.datasources[j];
							ds.realIndexes = [];
							for (var k=0;k<ds.columnIndexes.length;k++) {
								if (ds.columnIndexes[k] == -1) {
									ds.realIndexes.push(-1);
								} else {
									ds.realIndexes.push(f.usedFields[ds.columnIndexes[k]]);
								} /* not -1 */
							} /* all ds parts */
						} /* all datasources */
					} /* all objects */						

					/* draw */
					for (var i=0;i<forms.length;i++) { draw_form(forms[i]); }

					/* call for initial data on forms which are not sub-forms */
					var topLevelCandidates = [];
					for (var i=0;i<forms.length;i++) {
						var hope = 1;
						var fb = forms[i].fieldBinding;
						for (var j=0;j<fb.masterForms.length;j++) {
							if (fb.masterForms[j] != false) { hope = 0; }
						}
						if (hope) { topLevelCandidates.push(forms[i]); }
					}
					for (var i=0;i<topLevelCandidates.length;i++) {
						call_for_data(topLevelCandidates[i]); 
					}
				}
				
				function init() {
			]]>
			
			<xsl:call-template name="connection" />
			<xsl:call-template name="forms" />
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


					/* references to masters */
					for (var i=0;i<forms.length;i++) {
						var fb = forms[i].fieldBinding;
						for (var j=0;j<fb.masterForms.length;j++) { 
							var mf = fb.masterForms[j];
							if (mf == "false") { fb.masterForms[j] = false; } else {
								var index = parseInt(mf);
								fb.masterForms[j] = forms[index];
							}
						}
					}
					
					/* no constraints to top-level form */
					forms[0].div.style.width = "100%";
					forms[0].div.style.height = "100%";
					
					/* reference to pin forms */
					for (var i=0;i<objects.length;i++) if (objects[i].name == "map" || objects[i].name == "timeline") {
						var o = objects[i];
						var iindex = -1;
						switch (o.name) {
							case "map": iindex = 4; break;
							case "timeline": iindex = 0; break;
						}
						var index = o.properties[iindex].value;
						if (index != -1) { 
							var f = forms[index];
							var st = f.div.style;
							o.properties[iindex].value = f; 
							o.form.pinForm = f;
							f.pin = 1;
							st.position = "relative";
							st.left = "0px";
							st.top = "0px";
							st.backgroundColor = "transparent";
							st.border = "none";
						}
					}
					
//					OAT.Dom.unlink("loading");
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
					OAT.Xmla.user = OAT.Crypto.base64d(OAT.Xmla.user);
					OAT.Xmla.password = OAT.Crypto.base64d(OAT.Xmla.password);
					
					dialogs.params = new OAT.Dialog("Parameters","parameters",{width:400,modal:1,zIndex:1000});
					dialogs.params.ok = function() { dialogs.params.hide(); go(); }
					OAT.Dom.unlink(dialogs.params.cancelBtn);
					
					var cont = function() {
						
						/* forms also listen for data -> because of subforms */
						var backRef = function(form) {
							return function(dataRow,index,total) {
								/* optionally modify sub-forms */
								form.lastRow = dataRow;
								var candidates = {};
								for (var i=0;i<forms.length;i++) {
									var fb = forms[i].fieldBinding;
									for (var j=0;j<fb.masterForms.length;j++) {
										if (fb.masterForms[j] == form) { candidates[i] = 1; }
									}
								}
								for (p in candidates) {	call_for_data(forms[p]); }
							}
						}
						var emptyRef = function(form) {
							return function() {
								for (var i=0;i<objects.length;i++) if (objects[i].form == form) { objects[i].clear(); }
							}
						}
						for (var i=0;i<forms.length;i++) { /* empties */
							var br = backRef(forms[i]);
							forms[i].dso.bindRecord(br);
							if (forms[i].empty == "1") {
								var er = emptyRef(forms[i]);
								forms[i].dso.bindEmpty(er);
							}
						}
						
						
						/* ask for qualifiers */
						var qRef = function(qualifs) {
							OAT.SqlQueryData.columnQualifierPre = qualifs[0];
							OAT.SqlQueryData.columnQualifierPost = qualifs[1];
							ask_for_params();
						}
						OAT.Xmla.qualifiers(qRef);
					} /* cont */
					
					if (OAT.Xmla.user || parseInt(nocred)) {
						OAT.Dom.unlink("credentials");
						cont();
					} else {
						var d = new OAT.Dialog("Credentials","credentials",{modal1:1,width:300});
						d.show();
						var ref = function() {
							OAT.Xmla.user = $v("cred_user");
							OAT.Xmla.password = $v("cred_password");
							d.hide();
							cont();
						}
						d.ok = ref;
						d.cancel = d.hide;
					}
					
				} /* init */
				
				function wait_for_ymaps() {
					var index=-1;
					for (var i=0;i<featureList.length;i++) if (featureList[i] == "ymaps") { index = i; } 
					if ((window.YahooMapsAPIAjax || index == -1) && OAT.Loader.pendingCount <= 0) { 
						init();
						
					} else {
						setTimeout(wait_for_ymaps,100);
					}
				}
			]]>
			</script>
			
			<style type="text/css">
				@import url("/DAV/JS/styles/grid.css");
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

				.timeline_port {
					font: menu;
					border: 1px solid #000;
				}

				.timeline_slider {
					position: absolute;
					width: 11px;
					height: 21px;
					top: 0px;
					background-image: url("/DAV/JS/images/Slider.gif");
					cursor: w-resize;
				}

				.timeline_blank {
					position: absolute;
					background-image: url("/DAV/JS/images/Timeline_zigzag.gif");
				}
				</style>
			
			<title>Form</title>
		</head>
		
		<body onload="wait_for_ymaps()">
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
