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
	s = new OAT.SVGSparql(parentElm,options)
	options.selectNodeCallback(node)
	options.selectEdgeCallback(edge)
	options.deselectNodeCallback(node)
	options.deselectEdgeCallback(edge)
	options.addNodeCallback(node,loadMode)
	options.addEdgeCallback(edge,loadMode)
	options.removeNodeCallback(node)
	options.removeEdgeCallback(edge)
	s.toXML()
	s.fromXML()
	s.setProjection(OAT.SVGSparqlData.PROJECTION_PLANAR | PROJECTION_SPHERICAL )
	s.reposition()
	s.arrange()
	s.startDrawing(node,x,y,label)
	
	node|edge.setLabel(index,value)
	node|edge.getLabel(index)
	node|edge.setType(type)
	node|edge.getType()
	node|edge.signalStart|signalStop()
	node.setVisible(bool)
	node.getVisible()
	
*/

OAT.SVGSparqlData = {
	MODE_DRAG:0,
	MODE_ADD:1,
	MODE_DRAW:2,
	NODE_CIRCLE:0,
	NODE_RECT:1,
	EDGE_SOLID:0,
	EDGE_DASHED:1,
	PROJECTION_PLANAR:0,
	PROJECTION_SPHERICAL:1
}

OAT.SVGSparqlNode = function(x,y,value,svgsparql) {
	var self = this;
	this.x = x;
	this.y = y;
	this.hidden = false;
	this.selected = false;
	this.signal = false;
	this.svgsparql = svgsparql;
	this.svgs = [];
	this.indicator = OAT.SVG.element("circle",{fill:svgsparql.options.indicatorColor,r:svgsparql.options.indicatorSize});
	this.label1 = OAT.SVG.element("text",svgsparql.options.fontOptions);
	this.label2 = OAT.SVG.element("text",svgsparql.options.fontOptions);
	this.edges = [];
	this.visible = true; /* not overall visibility, but rather SPARQL query inclusion */
	this.type = OAT.SVGSparqlData.NODE_CIRCLE;
	
	var options = svgsparql.options.nodeOptions;
	
	this.svgs.push(OAT.SVG.element("circle",options));
	this.svgs.push(OAT.SVG.element("rect",options));
	this.svg = self.svgs[0];
	
	for (var i=0;i<self.svgs.length;i++) { self.svgs[i].obj = self; }
	self.label1.obj = self;
	self.label2.obj = self;
	
	this.setType = function(newType) {
		self.type = parseInt(newType);
		var newsvg = false;
		switch (self.type) {
			case OAT.SVGSparqlData.NODE_CIRCLE:
				newsvg = self.svgs[0];
				newsvg.setAttribute("r",options.size);
			break;
			case OAT.SVGSparqlData.NODE_RECT:
				newsvg = self.svgs[1];
				newsvg.setAttribute("width",options.size * 2);
				newsvg.setAttribute("height",options.size * 1.5);
			break;
		} /* switch */
		if (!newsvg) { return; }
		if (self.svg.parentNode) { self.svg.parentNode.replaceChild(newsvg,self.svg); }
		self.svg = newsvg;
		self.redraw();
	}

	this.getType = function() {
		return self.type;
	}

	this.setLabel = function(which,newLabel) {
		self["label"+which].textContent = newLabel;
	}
	
	this.getLabel = function(which) {
		return self["label"+which].textContent;
	}
	this.setLabel(1,value);
	
	this.setVisible = function(value) {
		self.visible = value;
		self.redraw();
	}

	this.getVisible = function() { return self.visible; }
	
	this.signalStart = function() {
		if (self.signal) { return; }
		self.signal = true;
		self.label1.setAttribute("font-weight","bold");
		self.label2.setAttribute("font-weight","bold");
	}
	
	this.signalStop = function() {
		if (!self.signal) { return; }
		self.signal = false;
		self.label1.setAttribute("font-weight","normal");
		self.label2.setAttribute("font-weight","normal");
	}
	
	this.checkBBox = function(x,y) {
		var bb = self.svgsparql.bbox(self.svg);
		if (x >= bb.x && y >= bb.y && x <= bb.x+bb.width && y <= bb.y+bb.height) { return true; }
		var bb = self.svgsparql.bbox(self.label1);
		if (x >= bb.x && y >= bb.y && x <= bb.x+bb.width && y <= bb.y+bb.height) { return true; }
		var bb = self.svgsparql.bbox(self.label2);
		if (x >= bb.x && y >= bb.y && x <= bb.x+bb.width && y <= bb.y+bb.height) { return true; }
		return false;
	}
	
	this.redraw = function() {
		self.draw_x = self.x;
		self.draw_y = self.y;
		self.hidden = false;
		if (self.svgsparql.projection == OAT.SVGSparqlData.PROJECTION_SPHERICAL) {
			var c = self.svgsparql.toSpherical(self.x,self.y);
			if (!c) {
				self.hidden = true;
				self.draw_x = -100;
				self.draw_y = -100;
			} else {
				self.draw_x = c[0];
				self.draw_y = c[1];
			}
		}
		
		switch (self.type) {
			case OAT.SVGSparqlData.NODE_CIRCLE:
				self.svg.setAttribute("cx",self.draw_x);
				self.svg.setAttribute("cy",self.draw_y);
			break;
			case OAT.SVGSparqlData.NODE_RECT:
				var w = parseFloat(self.svg.getAttribute("width"));
				var h = parseFloat(self.svg.getAttribute("height"));
				self.svg.setAttribute("x",self.draw_x - w/2);
				self.svg.setAttribute("y",self.draw_y - h/2);
			break;
			
		} /* switch */
		
		self.indicator.setAttribute("cx",self.draw_x);
		self.indicator.setAttribute("cy",self.draw_y);
		
		if (self.visible) {
			self.indicator.style.visibility = "";
		} else {
			self.indicator.style.visibility = "hidden";
		}
		
		self.label1.setAttribute("x",self.draw_x);
		self.label1.setAttribute("y",self.draw_y);
		self.label2.setAttribute("x",self.draw_x);
		self.label2.setAttribute("y",self.draw_y+svgsparql.options.fontOptions["font-size"]+2);
		for (var i=0;i<self.edges.length;i++) { self.edges[i].redraw(); }
	}
	
	this.setType(OAT.SVGSparqlData.NODE_RECT);
	
	this.toXML = function() {
		var xml = "";
		xml += '\t\t<node x="'+self.x+'" y="'+self.y+'" type="'+self.getType()+'">';
		xml += OAT.Dom.toSafeXML(self.getLabel(1));
		xml += ",";
		xml += OAT.Dom.toSafeXML(self.getLabel(2));
		xml += '</node>\n';
		return xml;
	}
	
	this.fromXML = function(xmlNode) {
		var val = OAT.Xml.textValue(xmlNode);
		var arr = OAT.Dom.fromSafeXML(val).split(",");
		self.setLabel(1,arr[0]);
		self.setLabel(2,arr[1]);
		self.x = parseInt(xmlNode.getAttribute("x"));
		self.y = parseInt(xmlNode.getAttribute("y"));
		var t = parseInt(xmlNode.getAttribute("type"));
		self.setType(t);
	}
}

OAT.SVGSparqlEdge = function(node1,node2,value,svgsparql,radius) {
	var self = this;
	this.node1 = node1;
	this.node2 = node2;
	this.svgsparql = svgsparql;
	this.selected = false;
	this.signal = false;
	this.type = OAT.SVGSparqlData.EDGE_SOLID;
	node1.edges.push(self);
	node2.edges.push(self);
	
	var options = svgsparql.options.edgeOptions;
	
	if (node1 == node2) {
		this.svg = OAT.SVG.element("path",options);
		this.svg.setAttribute("fill","none");
	} else {
		this.svg = OAT.SVG.element("line",options);
		this.svg.setAttribute("marker-end","url(#arrow)");
	}
	this.label1 = OAT.SVG.element("text",svgsparql.options.fontOptions);
	this.label2 = OAT.SVG.element("text",svgsparql.options.fontOptions);
	
	self.svg.obj = self;
	self.label1.obj = self;
	self.label2.obj = self;

	this.setType = function(newType) {
		self.type = parseInt(newType);
		switch (self.type) {
			case OAT.SVGSparqlData.EDGE_SOLID:
				self.svg.setAttribute("stroke-dasharray","1,0");
			break;
			case OAT.SVGSparqlData.EDGE_DASHED:
				self.svg.setAttribute("stroke-dasharray","3,3");
			break;
		}
		self.redraw();
	}

	this.getType = function() {
		return self.type;
	}

	this.setLabel = function(which,newLabel) {
		self["label"+which].textContent = newLabel;
	}
	
	this.getLabel = function(which) {
		return self["label"+which].textContent;
	}
	this.setLabel(1,value);
	
	this.signalStart = function() {
		if (self.signal) { return; }
		self.signal = true;
		self.label1.setAttribute("font-weight","bold");
		self.label2.setAttribute("font-weight","bold");
	}
	
	this.signalStop = function() {
		if (!self.signal) { return; }
		self.signal = false;
		self.label1.setAttribute("font-weight","normal");
		self.label2.setAttribute("font-weight","normal");
	}
	
	this.checkBBox = function(x,y) {
		var bb = self.svgsparql.bbox(self.svg);
		if (x >= bb.x && y >= bb.y && x <= bb.x+bb.width && y <= bb.y+bb.height) { return true; }
		var bb = self.svgsparql.bbox(self.label1);
		if (x >= bb.x && y >= bb.y && x <= bb.x+bb.width && y <= bb.y+bb.height) { return true; }
		var bb = self.svgsparql.bbox(self.label2);
		if (x >= bb.x && y >= bb.y && x <= bb.x+bb.width && y <= bb.y+bb.height) { return true; }
		return false;
	}

	this.redraw = function() {
		var x1 = self.node1.draw_x;
		var x2 = self.node2.draw_x;
		var y1 = self.node1.draw_y;
		var y2 = self.node2.draw_y;
		
		if (self.node1.hidden ^ self.node2.hidden) {
			/* if exactly one node is hidden, find an intersection with circle boundary */
			var s = self.svgsparql.sphere;
			if (self.node1.hidden) {
				var dx = self.node1.x - s.cx;
				var dy = self.node1.y - s.cy;
				var a = Math.atan2(dy,dx);
				x1 = s.cx + s.r * Math.cos(a);
				y1 = s.cy + s.r * Math.sin(a);
			} else {
				var dx = self.node2.x - s.cx;
				var dy = self.node2.y - s.cy;
				var a = Math.atan2(dy,dx);
				x2 = s.cx + s.r * Math.cos(a);
				y2 = s.cy + s.r * Math.sin(a);
			}
		}
		
		var dx = x2-x1;
		var dy = y2-y1;
		var a = Math.atan2(dy,dx);
		var p1 = radius + options.padding;
		var p2 = radius + options.padding;
		x1 += p1 * Math.cos(a);
		y1 += p1 * Math.sin(a);
		x2 -= p2 * Math.cos(a);
		y2 -= p2 * Math.sin(a);

		var y;
		if (node1 == node2) {
			self.svg.setAttribute("d","M "+x1+" "+y1+" A "+(radius*1.5)+" "+(radius*1.5)+" 0 1 0 "+x2+" "+y2);
			self.label1.setAttribute("x",x1);
			self.label2.setAttribute("x",x1);
			y = y1 - 1.5*radius;
		} else {
			self.label1.setAttribute("x",(x2+x1)/2);
			self.label2.setAttribute("x",(x2+x1)/2);
			y = (y2+y1)/2;
			self.svg.setAttribute("x1",x1);
			self.svg.setAttribute("x2",x2);
			self.svg.setAttribute("y1",y1);
			self.svg.setAttribute("y2",y2);
		}
		self.label1.setAttribute("y",y);
		self.label2.setAttribute("y",y+svgsparql.options.fontOptions["font-size"]+2);
	}
	
	this.redraw();
	
	this.toXML = function(index1,index2) {
		var xml = "";
		xml += '\t\t<edge node1="'+index1+'" node2="'+index2+'" type="'+self.getType()+'">';
		xml += OAT.Dom.toSafeXML(self.getLabel(1));
		xml += ",";
		xml += OAT.Dom.toSafeXML(self.getLabel(2));
		xml += '</edge>\n';
		return xml;
	}
	
	this.fromXML = function(xmlNode) {
		var val = OAT.Xml.textValue(xmlNode);
		var arr = OAT.Dom.fromSafeXML(val).split(",");
		self.setLabel(1,arr[0]);
		self.setLabel(2,arr[1]);
		var t = parseInt(xmlNode.getAttribute("type"));
		self.setType(t);
		self.redraw();
	}
	
}

OAT.SVGSparql = function(parentElm,paramsObj) {
	var self = this;
	
	this.options = {
		allowSelfEdges:false,
		defaultNodeValue:"<anonymous node>",
		defaultEdgeValue:"<anonymous edge>",
		indicatorColor:"#ff0",
		indicatorSize:6,
		padding:10,
		nodeOptions:{
			size:10,
			fill:"#f00"
		},
		edgeOptions:{
			stroke:"#888",
			"stroke-width":2,
			padding:4
		},
		fontOptions:{
			"font-size":12,
			"text-anchor":"middle"
		}
	};
	for (var p in paramsObj) { self.options[p] = paramsObj[p]; }

	this.mode = OAT.SVGSparqlData.MODE_DRAG;
	this.projection = OAT.SVGSparqlData.PROJECTION_PLANAR;
	self.nodes = [];
	self.edges = [];
	this.x = 0;
	this.y = 0;
	this.selectedNode = false;
	this.selectedEdge = false;
	this.selectedNodes = [];
	this.selectedEdges = [];
	
	this.ghostdrag = new OAT.GhostDrag();
	
	self.parent = $(parentElm);
	var dims = OAT.Dom.getWH(self.parent);
	self.svgcanvas = OAT.SVG.canvas("100%","100%");
	self.svg = OAT.SVG.element("g");
	self.parent.appendChild(self.svgcanvas);
	self.svgcanvas.appendChild(self.svg);

	/* define arrow marker */
	var defs = OAT.SVG.element("defs");
	var marker = OAT.SVG.element("marker",{id:"arrow"});
	var poly = OAT.SVG.element("polyline",{fill:self.options.edgeOptions.stroke,points:"0,0 10,4 0,7"});
	marker.setAttribute("viewBox","0 0 10 7");
	marker.setAttribute("refX","8");
	marker.setAttribute("refY","4");
	marker.setAttribute("markerUnits","strokeWidth");
	marker.setAttribute("orient","auto");
	marker.setAttribute("markerWidth","6");
	marker.setAttribute("markerHeight","6");
	self.svg.appendChild(defs);
	defs.appendChild(marker);
	marker.appendChild(poly);
	
	this.redraw = function() {
		for (var i=0;i<self.nodes.length;i++) { self.nodes[i].redraw(); }
	}
	
	this.bbox = function(svgNode) {
		var fake = {x:-1,y:-1,w:0,h:0};
		if (!svgNode.parentNode) { return fake; } /* if not appended */
		if (!self.parent.offsetParent) { return fake; } /* if not visible */
		if (svgNode.nodeName == "text" && svgNode.textContent == "") { return fake; }
		return svgNode.getBBox();
	}
	
	this.testNodes = function(x,y) {
		var result = [];
		for (var i=0;i<self.nodes.length;i++) {
			var n = self.nodes[i];
			if (n.checkBBox(x,y)) { result.push(n); }
		}
		return result;
	}
	
	this.dragging = {
		obj:false,
		x:0,
		y:0,
		move:function(event) {
			if (!self.dragging.obj) { return; }
			var dx = event.clientX - self.dragging.x;
			var dy = event.clientY - self.dragging.y;
			self.dragging.x = event.clientX;
			self.dragging.y = event.clientY;
			if (self.fakeEdge) {
				var epos = OAT.Dom.eventPos(event);
				var pos = OAT.Dom.position(self.parent);
				var x = epos[0] - pos[0];
				var y = epos[1] - pos[1];
				self.fakeEdge._x2 = x;
				self.fakeEdge._y2 = y;
				self.fakeEdge.redraw();
			} else {
				var o = self.dragging.obj;
				o.x += dx;
				o.y += dy;
				o.redraw();
			}
		},
		up:function(event) {
			if (!self.dragging.obj) { return; }
			var o = self.dragging.obj;
			self.dragging.obj = false;
			
			if (self.fakeEdge) {
				var l1 = self.fakeEdge.l1.textContent;
				var l2 = self.fakeEdge.l2.textContent;
				self.fakeEdge.unlink();
				var epos = OAT.Dom.eventPos(event);
				var pos = OAT.Dom.position(self.parent);
				var x = epos[0] - pos[0];
				var y = epos[1] - pos[1];
				var targetNodes = self.testNodes(x,y);
				if (targetNodes.length) {
					/* create correct new edge */
					var node1 = o;
					var node2 = targetNodes[0];
					if (node1 == node2 && !self.options.allowSelfEdges) { return; }
					var e = self.addEdge(node1,node2,self.options.defaultEdgeValue);
					if (l1 != "") {
						e.setLabel(1,l1);
						e.setLabel(2,l2);
					}
				} /* if mouseup over node */
			} /* if drawing mode */
		} /* self.dragging.up */
	} /* self.dragging */

	OAT.Drag.create(self.svg,self.svg,{
		cursor:false,
		moveFunction:function(dx,dy) {
			if (self.mode != OAT.SVGSparqlData.MODE_DRAG) { return; }
			if (self.dragging.obj) { return; }
			for (var i=0;i<self.nodes.length;i++) {
				var n = self.nodes[i];
				n.x += dx;
				n.y += dy;
			}
			for (var i=0;i<self.nodes.length;i++) {
				self.nodes[i].redraw();
			}
		}
	});
	
	/* 
		firefox trick: firefox sometimes displays 'dragging forbidden' cursor when we try to move nodes.
		this can be prevented by creating semi-transparent layer
	*/
	self.layers = [];
	for (var i=0;i<3;i++) {
		var g = OAT.SVG.element("g");
		self.layers.push(g);
		self.svg.appendChild(g); 
	}
	var r = OAT.SVG.element("rect",{x:0,y:0,width:"100%",height:"100%",fill:"#fff","fill-opacity":0.1});
	self.layers[0].appendChild(r);
	
	this.setProjection = function(newProjection) {
		self.projection = newProjection;
		self.prepareSphere();
		if (self.projection == OAT.SVGSparqlData.PROJECTION_SPHERICAL) {
			if (!self.sphere.c) {
				self.sphere.c = OAT.SVG.element("circle",{cx:self.sphere.cx,cy:self.sphere.cy,r:self.sphere.r,fill:"#000","fill-opacity":0.05});
				self.layers[0].appendChild(self.sphere.c);
			}
		} else {
			if (self.sphere.c) { OAT.Dom.unlink(self.sphere.c); self.sphere.c = false; }
		}
		self.redraw();
	}
	
	this.computeMinDist = function(w,h) {
		/* for each node, compute its distance to all other nodes & borders. find the minimum, add to total */
		var total = 0;
		var cnt = self.nodes.length;
		var dx,dy;
		for (var i=0;i<cnt;i++) {
			var n1 = self.nodes[i];
			/* distances to borders */
			var min = Math.min(n1.x,n1.y,w-n1.x,h-n1.y);
			for (var j=0;j<cnt;j++) {
				if (i != j) {
					var n2 = self.nodes[j];
					dx = n2.x - n1.x;
					dy = n2.y - n1.y;
					var dist = 0.5*Math.sqrt(dx*dx + dy*dy*dy); /* we prefer horizontal distance */
					if (dist < min) { min = dist; }
				}
			}
			total += min;
		}
		return total;
	}
	
	this.arrange = function(numIterations) { /* shift nodes to optimize space */
		var num = (numIterations ? numIterations : 5);
		var cnt = self.nodes.length;
		var dims = OAT.Dom.getWH(self.parent);
		var w = dims[0];
		var h = dims[1];
		var shiftSize = 20;
		var shiftMatrix = [
			[0,0],
			[1,0],
			[-1,0],
			[0,1],
			[0,-1],
			[1,1],
			[-1,-1],
			[1,-1],
			[-1,1]
		];
		for (var i=0;i<shiftMatrix.length;i++) {
			shiftMatrix[i][0] *= shiftSize;
			shiftMatrix[i][1] *= shiftSize;
		}
		/* place missing nodes to viewport */
		for (var i=0;i<cnt;i++) {
			var n = self.nodes[i];
			if (n.x < 0) { n.x = 0; }
			if (n.y < 0) { n.y = 0; }
			if (n.x > w) { n.x = w; }
			if (n.y > h) { n.y = h; }
		}
		for (var i=0;i<num;i++) {
			/* one iteration */
			for (var j=0;j<cnt;j++) {
				var node = self.nodes[j];
				var oldx = node.x;
				var oldy = node.y;
				var bestDist = self.computeMinDist(w,h);
				var bestIndex = 0;
				for (var k=1;k<shiftMatrix.length;k++) {
					/* test shift */
					node.x = oldx + shiftMatrix[k][0];
					node.y = oldy + shiftMatrix[k][1];
					var c = self.computeMinDist(w,h);
					if (node.x <= 0 || node.y <= 0 || node.x >=w || node.y >= h) { c = 0; }
					if (c > bestDist) {
						bestDist = c;
						bestIndex = k;
						k = shiftMatrix.length; /* end after first better result is found - optimalization! */
					} /* if better result */
				} /* for all possible shifts */
				node.x = oldx + shiftMatrix[bestIndex][0];
				node.y = oldy + shiftMatrix[bestIndex][1];
			} /* for all nodes */
		} /* for all iterations */
		self.redraw();
	} /* arrange */
	
	this.reposition = function() {
		/* completely re-position and arrange all nodes */
		var components = [];
		var allNodes = [];
		var usedNodes = [];
		
		var walk = function(node) {
			var index = allNodes.find(node);
			if (index == -1) { return [false,0]; }
			usedNodes.push(node);
			allNodes.splice(index,1);
			var out = 0;
			var tmp = [false,-1];
			for (var i=0;i<node.edges.length;i++) {
				var e = node.edges[i];
				if (e.node1 != node) { tmp = walk(e.node1); }
				if (e.node2 != node) { tmp = walk(e.node2); out++; }
			}
			if (out > tmp[1]) { return [node,out]; } else { return tmp; }
		}
		
		for (var i=0;i<self.nodes.length;i++) { allNodes.push(self.nodes[i]); }
		while (allNodes.length) {
			var start = allNodes[0];
			var maxEdges = walk(start);
			components.push(maxEdges);
		}
		
		var dims = OAT.Dom.getWH(self.parent);
		var w = dims[0];
		var h = dims[1];
		var s = Math.ceil(Math.sqrt(components.length)); /* number of nodes in a row / column */
		var s2 = Math.ceil(components.length / s);
		var dist = 80;
		var depth = 0;
		var coef1 = 1.5; /* distance increase for too dense nodes */
		var coef2 = 20; /* distance increase for distant nodes */
		
		function computeAngle(index,numSiblings,parentAngle,first) {
			if (!first) {
				var angle = (parentAngle + Math.PI) + (index+1) * (2 * Math.PI) / (numSiblings+1);
			} else {
				/* first time - don't care about parent's angle */
				var angle = index * 2 * Math.PI / numSiblings;
			}
			return angle;
		}
		for (var ci=0;ci<components.length;ci++) {
			var centerNode = components[ci][0];
			/* draw one component */
			var v = w/(s+1);
			if (ci >= s*(s2-1)) { v = w/(components.length - s*(s2-1) + 1); }
			var cx = (ci % s + 1) * v;
			var cy = Math.floor(1 + ci / s) * (h/(s2+1));
			
			centerNode.x = cx;
			centerNode.y = cy;

			var positionedNodes = [];
			var workToDo = [[centerNode,0]];
			
			while (workToDo.length) {
				var node = workToDo[0][0]; /* this node needs children repositioned */
				var angle = workToDo[0][1]; /* this node needs children repositioned */
				workToDo.splice(0,1);
				positionedNodes.push(node);
				var children = [];
				for (var i=0;i<node.edges.length;i++) {
					var e = node.edges[i];
					if (e.node1 != node && positionedNodes.find(e.node1) == -1 && children.find(e.node1) == -1)  { children.push(e.node1); }
					if (e.node2 != node && positionedNodes.find(e.node2) == -1 && children.find(e.node1) == -1)  { children.push(e.node2); }
				}
				for (var i=0;i<children.length;i++) {
					var child = children[i];
					var a = 0.3 + computeAngle(i,children.length,angle,node == centerNode);
					var d = dist;
					var d = (children.length > 8 && j % 2) ? coef1*dist : dist;
					child.x = node.x + d * Math.cos(a);
					child.y = node.y + d * Math.sin(a);
					workToDo.push([child,a]);
				}
			} /* while work to do */
		} /* for all components */
		self.arrange();
	}
	
	this.addTarget = function(svgObj) {
		var testFunc = function(x_,y_) {
			var pos = OAT.Dom.position(self.parent);
			var x = x_ - pos[0];
			var y = y_ - pos[1];
			return svgObj.checkBBox(x,y);
		}
		self.ghostdrag.addTarget(svgObj,testFunc);
	}
	
	this.delTarget = function(svgObj) {
		self.ghostdrag.delTarget(svgObj);
	}
	
	this.clear = function() {
		self.nodes = [];
		self.edges = [];
		self.deselectNodes();
		self.deselectEdges();
		self.ghostdrag.clearTargets();
		var canvasCheck = function(x_,y_) {
			var pos = OAT.Dom.position(self.parent);
			var x = x_ - pos[0];
			var y = y_ - pos[1];
			var dims = OAT.Dom.getWH(self.parent);
			return (x >=0 && y >= 0 && x <= dims[0] && y <= dims[1]);
		}
		self.ghostdrag.addTarget(self,canvasCheck,true);
		for (var i=1;i<self.layers.length;i++) { OAT.Dom.clear(self.layers[i]); }
	}
	
	this.sphere = {}
	this.prepareSphere = function() {
		var dims = OAT.Dom.getWH(self.parent);
		var w = dims[0];
		var h = dims[1];
		var p = self.options.padding;
		self.sphere.r = Math.min(w,h) / 2 - p;
		self.sphere.R = self.sphere.r * Math.PI / 2;
		self.sphere.cx = w/2;
		self.sphere.cy = h/2;
	}
	
	this.toSpherical = function(x,y) {
		var dx = x - self.sphere.cx;
		var dy = y - self.sphere.cy;
		var dist = dx*dx + dy*dy;
		var d = Math.sqrt(dist);
		if (d > self.sphere.R) { return false; } /* not within circle - invisible */
		var pi2 = Math.PI / 2;

		var coef = Math.sin(pi2*d/self.sphere.R);
		var new_d = d ? coef * (self.sphere.r/d) : 0
		
		var new_x = self.sphere.cx + dx * new_d;
		var new_y = self.sphere.cy + dy * new_d;
		return [new_x,new_y];
	}
	
	this.fromSpherical = function(x,y) {
		var dx = x - self.sphere.cx;
		var dy = y - self.sphere.cy;
		var dist = dx*dx + dy*dy;
		var d = Math.sqrt(dist);
		if (d > self.sphere.r) { return false; }
		var pi2 = Math.PI / 2;

		var coef = Math.asin(d/self.sphere.r) / pi2;
		var new_d = d ? coef * (self.sphere.R/d) : 0
		var new_x = self.sphere.cx + dx * new_d;
		var new_y = self.sphere.cy + dy * new_d;
		return [new_x,new_y];
	}
	
	this.startDrawing = function(node,x,y,label) {
		self.dragging.obj = node;
		self.dragging.x = x;
		self.dragging.y = y;
		self.fakeEdge = OAT.SVG.element("line",self.options.edgeOptions);
		var l1 = OAT.SVG.element("text",self.options.fontOptions);
		var l2 = OAT.SVG.element("text",self.options.fontOptions);
		self.svg.appendChild(self.fakeEdge);
		self.svg.appendChild(l1);
		self.svg.appendChild(l2);
		var parts = label.split(",");
		l1.textContent = parts[0];
		if (parts.length > 1) { l2.textContent = parts[1]; }
		self.fakeEdge._x1 = node.draw_x;
		self.fakeEdge._y1 = node.draw_y;
		self.fakeEdge._x2 = node.draw_x;
		self.fakeEdge._y2 = node.draw_y;
		self.fakeEdge.l1 = l1;
		self.fakeEdge.l2 = l2;
		self.fakeEdge.redraw = function() {
			var x1 = self.fakeEdge._x1;
			var x2 = self.fakeEdge._x2;
			var y1 = self.fakeEdge._y1;
			var y2 = self.fakeEdge._y2;
			self.fakeEdge.setAttribute("x1",x1);
			self.fakeEdge.setAttribute("x2",x2);
			self.fakeEdge.setAttribute("y1",y1);
			self.fakeEdge.setAttribute("y2",y2);
			l1.setAttribute("x",(x2+x1)/2);
			l2.setAttribute("x",(x2+x1)/2);
			var y = (y2+y1)/2;
			l1.setAttribute("y",y);
			l2.setAttribute("y",y+self.options.fontOptions["font-size"]+2);
		}
		self.fakeEdge.unlink = function() {
			OAT.Dom.unlink(l1);
			OAT.Dom.unlink(l2);
			OAT.Dom.unlink(self.fakeEdge);
			self.fakeEdge = false;
		}
		self.fakeEdge.redraw();
	}
	
	this.deselectNode = function(node) {
		var index = self.selectedNodes.find(node);
		if (index == -1) { return; }
		node.selected = false;
		self.selectedNodes.splice(index,1);
		if (self.options.deselectNodeCallback) { self.options.deselectNodeCallback(node); }
		if (node == self.selectedNode) { self.selectedNode = false; }
	}
	
	this.deselectEdge = function(edge) {
		var index = self.selectedEdges.find(edge);
		if (index == -1) { return; }
		edge.selected = false;
		self.selectedEdges.splice(index,1);
		if (self.options.deselectEdgeCallback) { self.options.deselectEdgeCallback(edge); }
		if (edge == self.selectedEdge) { self.selectedEdge = false; }
	}
	
	this.deselectNodes = function() {
		while (self.selectedNodes.length) { self.deselectNode(self.selectedNodes[0]); }
	}
	
	this.deselectEdges = function() {
		while (self.selectedEdges.length) { self.deselectEdge(self.selectedEdges[0]); }
	}
	
	this.selectNode = function(node) {
		self.selectedNode = node;
		node.selected = true;
		self.selectedNodes.push(node);
		if (self.options.selectNodeCallback) { self.options.selectNodeCallback(node); }
	}
	
	this.selectEdge = function(edge) {
		self.selectedEdge = edge;
		edge.selected = true;
		self.selectedEdges.push(edge);
		if (self.options.selectEdgeCallback) { self.options.selectEdgeCallback(edge); }
	}
	
	this.toggleNode = function(node,event) {
		self.deselectEdges();
		if (!event.shiftKey && !event.ctrlKey) {
			self.deselectNodes();
			self.selectNode(node);
		} else {
			if (node.selected) { self.deselectNode(node); } else { self.selectNode(node); }
		}
	}
	
	this.toggleEdge = function(edge,event) {
		self.deselectNodes();
		if (!event.shiftKey && !event.ctrlKey) {
			self.deselectEdges();
			self.selectEdge(edge);
		} else {
			if (edge.selected) { self.deselectEdge(edge); } else { self.selectEdge(edge); }
		}
	}

	this.removeNode = function(node) {
		if (self.options.removeNodeCallback) { self.options.removeNodeCallback(node); }
		while (node.edges.length) { self.removeEdge(node.edges[0]); } /* remove all relevant edges */
		self.delTarget(node);
		var index = self.nodes.find(node);
		self.nodes.splice(index,1);
		for (var i=0;i<node.svgs.length;i++) {
			OAT.Dom.unlink(node.svgs[i]);
		}
		OAT.Dom.unlink(node.label1);
		OAT.Dom.unlink(node.label2);
		OAT.Dom.unlink(node.indicator);
		if (node == self.selectedNode) { self.deselectNode(); }
	}
	
	this.removeEdge = function(edge) {
		/* remove from node's array */
		if (self.options.removeEdgeCallback) { self.options.removeEdgeCallback(edge); }
		self.delTarget(edge);
		var i = edge.node1.edges.find(edge);
		edge.node1.edges.splice(i,1);
		var i = edge.node2.edges.find(edge);
		edge.node2.edges.splice(i,1);
		var index = self.edges.find(edge);
		self.edges.splice(index,1);
		OAT.Dom.unlink(edge.svg);
		OAT.Dom.unlink(edge.label1);
		OAT.Dom.unlink(edge.label2);
		if (edge == self.selectedEdge) { self.deselectEdge(); }
	}
	
	this.toXML = function() {
		var xml = "";
		xml += "<sparql_design>\n";
		xml += "\t<nodes>\n";
		for (var i=0;i<self.nodes.length;i++) { xml += self.nodes[i].toXML(); }
		xml += "\t</nodes>\n";
		xml += "\t<edges>\n";
		for (var i=0;i<self.edges.length;i++) { 
			var e = self.edges[i];
			var index1 = self.nodes.find(e.node1);
			var index2 = self.nodes.find(e.node2);
			xml += e.toXML(index1,index2); 
		}
		xml += "\t</edges>\n";
		xml += "</sparql_design>\n";
		return xml;
	}
	
	this.fromXML = function(xmlNode) {
		self.clear();
		var nnodes = xmlNode.getElementsByTagName("node");
		var enodes = xmlNode.getElementsByTagName("edge");
		for (var i=0;i<nnodes.length;i++) {
			var node = self.addNode(0,0,"",1);
			if (node) { node.fromXML(nnodes[i]); }
		}
		for (var i=0;i<enodes.length;i++) {
			var index1 = parseInt(enodes[i].getAttribute("node1"));
			var index2 = parseInt(enodes[i].getAttribute("node2"));
			var edge = self.addEdge(self.nodes[index1],self.nodes[index2],"",1);
			edge.fromXML(enodes[i]);
		}
	}
	
	this.addEdge = function(node1,node2,value,loadMode) {
		/* check for inverse or same edge */
		for (var i=0;i<self.edges.length;i++) {
			var e = self.edges[i];
			if (e.node1 == node1 && e.node2 == node2) { 
				alert("This relationship can not be created, because the same relationship already exists.");
				return false;
			}
			if (e.node1 == node2 && e.node2 == node1) { 
				alert("This relationship can not be created, because inverse relationship exists.");
				return false;
			}
		}
		
		var edge = new OAT.SVGSparqlEdge(node1,node2,value,self,self.options.nodeOptions.size);
		if (self.options.addEdgeCallback) { self.options.addEdgeCallback(edge,loadMode); }
		self.addTarget(edge);
		self.edges.push(edge);
		self.layers[1].appendChild(edge.svg);
		self.layers[2].appendChild(edge.label1);
		self.layers[2].appendChild(edge.label2);
		return edge;
	}

	this.addNode = function(x_,y_,value,loadMode) {
		var x = x_;
		var y = y_;
		if (self.projection == OAT.SVGSparqlData.PROJECTION_SPHERICAL) {
			var c = self.fromSpherical(x,y);
			if (!c) { 
				alert("In spherical mode, nodes must be placed within radius.");
				return false;
			}
			x = c[0];
			y = c[1];
		}
		var node = new OAT.SVGSparqlNode(x,y,value,self);
		if (self.options.addNodeCallback) { self.options.addNodeCallback(node,loadMode); }
		self.addTarget(node);
		self.nodes.push(node);
		self.layers[1].appendChild(node.svg);
		self.layers[1].appendChild(node.indicator);
		self.layers[2].appendChild(node.label1);
		self.layers[2].appendChild(node.label2);
		return node;
	}
	
	var downRef = function(event) { /* start dragging or moving */
		if (self.dragging.obj) { return; }
		var epos = OAT.Dom.eventPos(event);
		var pos = OAT.Dom.position(self.parent);
		var x = epos[0] - pos[0];
		var y = epos[1] - pos[1];
		var nodes = self.testNodes(x,y);
		if (!nodes.length) { return; }
		var node = nodes[0];
		if (self.mode == OAT.SVGSparqlData.MODE_DRAG) {
			self.dragging.obj = node;
			self.dragging.x = event.clientX;
			self.dragging.y = event.clientY;
		}
		if (self.mode == OAT.SVGSparqlData.MODE_DRAW) {
			self.startDrawing(node,x,y,"");
		} /* if appropriate mode */
	}
	
	var clickRef = function(event) { /* add new node */
		var epos = OAT.Dom.eventPos(event);
		var pos = OAT.Dom.position(self.parent);
		var x = epos[0] - pos[0];
		var y = epos[1] - pos[1];
		if (self.mode == OAT.SVGSparqlData.MODE_ADD) {
			var ep = OAT.Dom.eventPos(event);
			var coords = OAT.Dom.position(self.parent);
			self.addNode(ep[0]-coords[0],ep[1]-coords[1],self.options.defaultNodeValue);
		}
		if (self.mode == OAT.SVGSparqlData.MODE_DRAG) {
			for (var i=0;i<self.nodes.length;i++) if (self.nodes[i].checkBBox(x,y)) { self.toggleNode(self.nodes[i],event); }
			for (var i=0;i<self.edges.length;i++) if (self.edges[i].checkBBox(x,y)) { self.toggleEdge(self.edges[i],event); }
		}
	}
	
	var moveRef = function(event) { /* signalling */
		var epos = OAT.Dom.eventPos(event);
		var pos = OAT.Dom.position(self.parent);
		var x = epos[0] - pos[0];
		var y = epos[1] - pos[1];
		for (var i=0;i<self.nodes.length;i++) {
			var n = self.nodes[i];
			var over = n.checkBBox(x,y);
			if (!n.signal && over) { n.signalStart(); } else if (n.signal && !over) { n.signalStop(); }
		}
		for (var i=0;i<self.edges.length;i++) {
			var e = self.edges[i];
			var over = e.checkBBox(x,y);
			if (!e.signal && over) { e.signalStart(); } else if (e.signal && !over) { e.signalStop(); }
		}
	}

	OAT.Dom.attach(self.svg,"mousedown",downRef);
	OAT.Dom.attach(self.svg,"click",clickRef);
	OAT.Dom.attach(document,"mousemove",moveRef);
	
	OAT.Dom.attach(self.svg,"mousemove",self.dragging.move);
	OAT.Dom.attach(self.svg,"mouseup",self.dragging.up);
	
	self.clear();
	self.prepareSphere();
}
OAT.Loader.featureLoaded("svgsparql");
