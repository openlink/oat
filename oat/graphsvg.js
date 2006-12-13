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
	new OAT.GraphSVG(div,vertices,edges,optObj)
	vertex: { name: "", type:0/1}
	edge: { vertex1:{},name: "", vertex2:{} }
	optObj:{
		vertexColor:"#f00",
		edgeColor:"#888",
		backgroundColor:"#ffc",
		vertexSize:8,
		vertexPadding:2,
		padding:15,
		edgeSize:1.5
	}
*/
	var self = this;
OAT.GraphSVGData = {
	graph:false,
	node:false,
	mouse_x:0,
	mouse_y:0,
	
	move:function(event) { /* onmousemove handler for dragging */
		// OAT.Profiler.start("event");
		if (!OAT.GraphSVGData.graph) return;
		var g = OAT.GraphSVGData.graph;
		var coef = g.svg.getCTM().a;
		var dx = (event.clientX - OAT.GraphSVGData.mouse_x) /coef;
		var dy = (event.clientY - OAT.GraphSVGData.mouse_y) /coef;
		
		function apply(n,recurse) {
			n.x += dx;
			n.y += dy;
			if (recurse && n.children && n.children.length) {
				for (var i=0;i<n.children.length;i++) { apply(n.children[i],true); }
			}
		}
		if (OAT.GraphSVGData.node) { 
			var r = event.ctrlKey;
			apply(OAT.GraphSVGData.node,r); 
		} else {
			for (var i=0;i<g.data.length;i++) {
				var node = g.data[i];
				apply(node,false);
			}
		}
		// OAT.Profiler.stop("event");
		g.drawUpdate();
		OAT.GraphSVGData.mouse_x = event.clientX;
		OAT.GraphSVGData.mouse_y = event.clientY;
	},
	
	up:function(event) { /* onmouseup handler for dragging */
		// OAT.Profiler.display();
		OAT.GraphSVGData.graph = false;
		OAT.GraphSVGData.node = false;
	},
	
	fromTriples:function(tripleArray) { /* create vertices and edges from a set of triples */
		var vertices = [];
		var edges = [];
		function present(name) {
			for (var i=0;i<vertices.length;i++) { if (vertices[i].name == name) { return vertices[i]; } }
			return false;
		}
		for (var i=0;i<tripleArray.length;i++) {
			var t = tripleArray[i];
			var v1 = t[0];
			var v2 = t[2];
			var type = t[3];
			var o1 = present(v1);
			var o2 = present(v2);
			if (!o1) { o1 = {name:v1,type:1}; vertices.push(o1); }
			if (!o2) { o2 = {name:v2,type:type}; vertices.push(o2); }
			edges.push({name:t[1],vertex1:o1,vertex2:o2});
		}
		return [vertices,edges];
	}
}
OAT.Dom.attach(document,"mousemove",OAT.GraphSVGData.move);
OAT.Dom.attach(document,"mouseup",OAT.GraphSVGData.up);

OAT.GraphSVG = function(div,vertices,edges,optObj) { /* constructor */
	/* 
		vertex: { name: ""}
		edge: { vertex1:{},name: "", vertex2:{} }
	*/
	var self = this;
	this.div = $(div);
	this.svg = false;
	this.options = {
		vertexColor:"#f00",
		edgeColor:"#888",
		backgroundColor:"#ffc",
		vertexSize:8,
		vertexPadding:2,
		padding:15,
		edgeSize:1.5
	};
	this.svgLabels = [];
	this.selectedNode = false;
	this.infoWindow = OAT.Dom.create("div",{position:"absolute",border:"1px solid #000",display:"none",backgroundColor:"#ff3",padding:"2px"});
	document.body.appendChild(this.infoWindow);
	
	for (var p in optObj) { this.options[p] = optObj[p]; }
	this.vertices = vertices;
	this.edges = edges;
	
	this.computeVisibility = function() { /* find out which objects are hidden */
		/* compute node.visible.box property */
		var w = self.width;
		var h = self.height;
		var p = self.options.padding;
		var r = Math.min(w,h) / 2 - self.options.padding;
		var R = r * Math.PI / 2;
		var cx = w/2;
		var cy = h/2;
		var v = parseInt(self.selects.dist.value);
		var len = self.data.length;
		for (var i=0;i<len;i++) { 
			var node = self.data[i];
			node.visible.user = !v || (node.distance <= v && node.distance != -1);
			node.visible.box = 0; 
			switch (parseInt(self.selects.projection.value)) {
				case 0: /* planar */
					if (node.x >= p && node.x <= w-p && node.y >= p && node.y <= h-p) { node.visible.box = 1; }
					node.draw_x = node.x;
					node.draw_y = node.y;
				break;
				case 1: /* spherical */
					var dx = node.x - cx;
					var dy = node.y - cy;
					var dist = dx*dx + dy*dy;
					var d = Math.sqrt(dist);
					if (d <= R) { node.visible.box = 1; }
					var pi2 = Math.PI / 2;
					var new_d = r * Math.sin(pi2*d/R);
					var coef = d ? new_d / d : 0;
					node.draw_x = cx + dx * coef;
					node.draw_y = cy + dy * coef;
				break;
			} /* switch */
			node.visible.total = node.visible.box && node.visible.user;
		} /* for all nodes */
	}
	
	this.computeVerticesPosition = function() { /* place vertices. to be called only once */
		var p = self.options.padding;
		var w = self.width;
		var h = self.height;
		if (self.selects.type.value == "0") {
			/* all nodes at once */
			switch (parseInt(self.selects.placement.value)) {
				case 0: /* random */
					for (var i=0;i<self.data.length;i++) {
						var node = self.data[i];
						node.children = [];
						node.x = Math.random() * (w-2*p) + p;
						node.y = Math.random() * (h-2*p) + p;
					}
				break;
				case 1: /* circle */
					var cx = w / 2;
					var cy = h / 2;
					var r = Math.min(w,h) / 2 - p;
					var total = self.data.length;
					for (var i=0;i<total;i++) {
						var node = self.data[i];
						node.children = [];
						var a = i * 2 * Math.PI / total;
						node.x = cx + r * Math.cos(a);
						node.y = cy + r * Math.sin(a);
					}
				break;
			} /* switch */
		} else { /* equal distances */
			/* find central node */
			var max = 0;
			var n = false;
			for (var i=0;i<self.data.length;i++) {
				var node = self.data[i];
				var total = node.inCount + node.outCount;
				if (total > max) { 
					max = total; 
					n = node;
				}
			} /* for all nodes */
			if (!n) { return; }
			var dist = 50 + parseInt(self.selects.distance.value)*50; /* 50, 100, 150 */
			var totalPositioned = [n];
			var lastPositioned = [[n,0]];
			n.x = w/2;
			n.y = h/2;
			/* recursively position all nodes */
			
			function computeAngle(index,numSiblings,parentAngle,depth) {
				if (depth) {
					var angle = (parentAngle + Math.PI) + (index+1) * (2 * Math.PI) / (numSiblings +1);
				} else {
					/* first time - don't care about parent's angle */
					var angle = index * 2 * Math.PI / numSiblings;
				}
				return angle;
			}
			
			var depth = 0;
			var coef1 = 1.5; /* distance increase for too dense nodes */
			var coef2 = 20; /* distance increase for distant nodes */
			while (totalPositioned.length != self.data.length) {
				var newLast = [];
				
				for (var i=0;i<lastPositioned.length;i++) {
					var parent = lastPositioned[i][0];
					var angle = lastPositioned[i][1];
					var edges = [];
					var children = [];
					for (var j=0;j<parent.inEdges.length;j++) { 
						var child = parent.inEdges[j].vertex1;
						if (totalPositioned.find(child) == -1 && children.find(child) == -1) { children.push(child); }
					}
					for (var j=0;j<parent.outEdges.length;j++) { 
						var child = parent.outEdges[j].vertex2;
						if (totalPositioned.find(child) == -1 && children.find(child) == -1) { children.push(child); }
					}
					parent.children = []; /* need to know child nodes for advanced dragging */
					for (var j=0;j<parent.outEdges.length;j++) {
						var child = parent.outEdges[j].vertex2;
						if (totalPositioned.find(child) == -1 && parent.children.find(child) == -1) { parent.children.push(child); }
					}
					for (var j=0;j<children.length;j++) {
						var child = children[j];
						var a = computeAngle(j,children.length,angle,depth);
						var d = dist;
						var d = (children.length > 8 && j % 2) ? coef1*dist : dist;
						d += depth * coef2;
						child.x = parent.x + d * Math.cos(a);
						child.y = parent.y + d * Math.sin(a);
						totalPositioned.push(child);
						newLast.push([child,a]);
							/* find a position */
					} /* for all child nodes */
				}
				lastPositioned = newLast;
				depth++;
				/* 
					trick: it is possible that the graph has multiple components. in this case, this loop can never finish.
					we have to detect this and solve 
				*/
				if (lastPositioned.length == 0 && totalPositioned.length != self.data.length) {
					/* find non-positioned node and continue */
					var c = false;
					for (var i=0;i<self.data.length;i++) { 
						if (totalPositioned.find(self.data[i]) == -1) { c = self.data[i]; }
					}
					/* some good position for new component */
					c.x = Math.random() * (w-2*p) + p;
					c.y = Math.random() * (h-2*p) + p;
					totalPositioned.push(c);
					lastPositioned.push([c,0]);
					depth = 0;
				}
				
			} /* while there are unpositioned nodes */
		} /* mode */
	} /* compute vertices */
	
	/* compute own structure */
	this.compute = function() { /* convert user data to our own megastructure */
		self.data = [];
		for (var i=0;i<self.vertices.length;i++) {
			var v = self.vertices[i];
			var o = {
				vertex:v,
				name:v.name,
				distance:-1, /* from selected node */
				inEdges:[],
				outEdges:[],
				inCount:0,
				outCount:0,
				x:0,
				y:0,
				type:v.type, /* reference */
				visible:{box:0,user:0},
				svg:false, /* element */
				radius:self.options.vertexSize
			}
			this.data.push(o);
		}
		for (var i=0;i<self.edges.length;i++) {
			var e = self.edges[i];
			var v1 = e.vertex1;
			var v2 = e.vertex2;
			var o1 = false;
			var o2 = false;
			for (var j=0;j<self.data.length;j++) {
				var node = self.data[j];
				if (node.vertex == v1) { o1 = node; }
				if (node.vertex == v2) { o2 = node; }
			}
			if (!o1 || !o2) { alert('Inconsistent input data!'); }
			o1.outCount++;
			o2.inCount++;
			var edge = {name:e.name,vertex1:o1,vertex2:o2,svg:false,distance:-1};
			o1.outEdges.push(edge);
			o2.inEdges.push(edge);
		}
		var min = self.edges.length * 2;
		var max = 0;
		for (var i=0;i<self.data.length;i++) {
			var node = self.data[i];
			var total = node.inCount + node.outCount;
			if (total > max) { max = total; }
			if (total < min) { min = total; }
		}
		for (var i=0;i<self.data.length;i++) if (self.data[i].inCount + self.data[i].outCount == max) { self.selectedNode = self.data[i]; }
		if (self.options.vertexSize instanceof Array) {	/* we have to manually compute vertex radii */
			var minr = self.options.vertexSize[0];
			var maxr = self.options.vertexSize[1];
			var coef = max == min ? 0 : (maxr - minr) / (max - min);
			for (var i=0;i<self.data.length;i++) {
				var node = self.data[i];
				var total = node.inCount + node.outCount;
				node.radius = minr + coef * (total - min);
			}
		} /* if computed radii */
	} /* compute */
	
	this.computeDistance = function(centerNode) { /* compute node.distance property */
		/* reset */
		for (var i=0;i<self.data.length;i++) {
			var n = self.data[i];
			n.distance = -1;
			for (var j=0;j<n.outEdges.length;j++) { n.outEdges[j].distance = -1; }
		}
		var depth = 0;
		var workToDo = [centerNode];
		while (workToDo.length) {
			var newToDo = [];
			for (var i=0;i<workToDo.length;i++) { workToDo[i].distance = depth; }
			for (var i=0;i<workToDo.length;i++) {
				var obj = workToDo[i];
				/* all edges */
				for (var j=0;j<obj.outEdges.length;j++) if (obj.outEdges[j].distance == -1) {
					obj.outEdges[j].distance = depth;
					var v = obj.outEdges[j].vertex2;
					if (v.distance == -1 && newToDo.find(v) == -1) { newToDo.push(v); }
				}
				for (var j=0;j<obj.inEdges.length;j++) if (obj.inEdges[j].distance == -1) {
					obj.inEdges[j].distance = depth;
					var v = obj.inEdges[j].vertex1;
					if (v.distance == -1 && newToDo.find(v) == -1) { newToDo.push(v); }
				}
			} /* for all pending nodes */
			depth++;
			workToDo = newToDo;
		} /* while */
	}
	
	this.selectNode = function(node) {
		self.selectedNode = node;
		self.computeDistance(node);
		self.selectedNode.svg.setAttribute("stroke-width","2");
		self.selectedNode.svg.setAttribute("stroke","#00f");
		self.drawUpdate();
	}
	
	this.createSVG = function() {
		/* mousedown handler */
		function assign(node,index) {
			OAT.Dom.attach(node.svg,"mousedown",function(event){
				node._mousedown = 1;
				setTimeout(function(){node._mousedown=0;},150);
				OAT.GraphSVGData.graph = self;
				OAT.GraphSVGData.node = self.data[index];
				OAT.GraphSVGData.mouse_x = event.clientX;
				OAT.GraphSVGData.mouse_y = event.clientY;
			});
			OAT.Dom.attach(node.svg,"click",function() {
				if (!node._mousedown) { return; }
				if (self.selectedNode) { self.selectedNode.svg.setAttribute("stroke","none"); }
				self.selectNode(node);
			});
		}
		/* create node elements */
		for (var i=0;i<self.data.length;i++)  {
			var node = self.data[i];
			switch (node.type) {
				case 0:
					var c = OAT.SVG.element("rect",{fill:self.options.vertexColor,width:2*node.radius,height:2*node.radius});
				break;
				case 1:
					var c = OAT.SVG.element("circle",{r:node.radius,fill:self.options.vertexColor});
				break;
			} /* switch */
			node.svg = c;
			var label = OAT.SVG.element("text",{"text-anchor":"middle"});
			label.textContent = node.name;
			node.label = label;
			assign(node,i);
			self.assignLabelEvents(node,0);
		}
		/* create edge elements */
		for (var i=0;i<self.data.length;i++) {
			var node1 = self.data[i];
			for (var j=0;j<node1.outEdges.length;j++) {
				var e = node1.outEdges[j];
				var node2 = node1.outEdges[j].vertex2;
				/* create element */
				if (node1 == node2) {
					var l = OAT.SVG.element("path",{fill:"none"});
				} else {
					var l = OAT.SVG.element("line",{});
					l.setAttribute("marker-end","url(#arrow)");
				}
				l.setAttribute("stroke",self.options.edgeColor);
				l.setAttribute("stroke-width",self.options.edgeSize);
				e.svg = l;
				var label = OAT.SVG.element("text",{"text-anchor":"middle"});
				label.textContent = e.name;
				e.label = label;
				self.assignLabelEvents(e,1);
			} /* all outEdges */
		} /* all nodes */
	} /* createSVG */
	
	this.init = function() { /* only when object is instantiated */
		self.selects = {};
		self.compute();
		OAT.Dom.clear(self.div);
		self.control = OAT.Dom.create("div",{position:"absolute",left:"0px",top:"-20px"});
		self.div.appendChild(self.control);
		/* type */
		var s = OAT.Dom.create("select");
		self.selects.type = s;
		OAT.Dom.option("All nodes at once","0",s);
		OAT.Dom.option("Equal distances","1",s);
		s.selectedIndex = 1;
		OAT.Dom.attach(s,"change",self.draw);
		self.control.appendChild(s);
		self.control.appendChild(OAT.Dom.text(" "));
		/* placement */
		var s = OAT.Dom.create("select");
		self.selects.placement = s;
		OAT.Dom.option("Random","0",s);
		OAT.Dom.option("Circle","1",s);
		OAT.Dom.attach(s,"change",self.draw);
		self.control.appendChild(s);
		self.control.appendChild(OAT.Dom.text(" "));
		/* distance */
		var s = OAT.Dom.create("select");
		self.selects.distance = s;
		OAT.Dom.option("Close distance","0",s);
		OAT.Dom.option("Medium distance","1",s);
		OAT.Dom.option("Far distance","2",s);
		s.selectedIndex = 1;
		OAT.Dom.attach(s,"change",self.draw);
		self.control.appendChild(s);
		self.control.appendChild(OAT.Dom.text(" "));
		/* projection */
		var s = OAT.Dom.create("select");
		self.selects.projection = s;
		OAT.Dom.option("Planar","0",s);
		OAT.Dom.option("Pseudo-spherical","1",s);
		OAT.Dom.attach(s,"change",self.draw);
		self.control.appendChild(s);
		/* draw */
		var s = OAT.Dom.create("select");
		self.selects.draw = s;
		OAT.Dom.option("Draw everything","0",s);
		OAT.Dom.option("Draw only subjects","1",s);
		OAT.Dom.option("Draw only predicates","2",s);
		OAT.Dom.attach(s,"change",self.draw);
//		self.control.appendChild(s);
		/* labels */
		var s = OAT.Dom.create("select");
		self.selects.labels = s;
		OAT.Dom.option("Labels only on one element","0",s);
		OAT.Dom.option("Up to distance 1","1",s);
		OAT.Dom.option("Up to distance 2","2",s);
		OAT.Dom.option("Up to distance 3","3",s);
		OAT.Dom.option("Up to distance 4","4",s);
		self.control.appendChild(s);
		/* distance */
		var s = OAT.Dom.create("select");
		self.selects.dist = s;
		OAT.Dom.option("Show all nodes","0",s);
		OAT.Dom.option("Selected up to distance 1","1",s);
		OAT.Dom.option("Selected up to distance 2","2",s);
		OAT.Dom.option("Selected up to distance 3","3",s);
		OAT.Dom.option("Selected up to distance 4","4",s);
		OAT.Dom.attach(s,"change",self.drawUpdate);
		self.control.appendChild(s);
		
		/* create SVG elements */
		self.createSVG();
	}

	this.callMouseover = function(obj,type) {
		/* remove all displayed labels */
		for (var i=0;i<self.svgLabels.length;i++) {
			OAT.Dom.unlink(self.svgLabels[i]);
		}
		self.svgLabels = [];
		/* recursively show labels */
		function process(obj,t,depth){ 
			if (!obj.label.parentNode) {
				self.svg.appendChild(obj.label);
				self.svgLabels.push(obj.label);
			} /* only if not yet present */
			if (depth < parseInt(self.selects.labels.value)) {
				/* recurse */
				var next = [];
				switch (t) {
					case 0: /* vertex */
						next.append(obj.outEdges);
						next.append(obj.inEdges);
					break;
					case 1: /* edge */
						next.append(obj.vertex1);
						next.append(obj.vertex2);
					break;
				}
				for (var i=0;i<next.length;i++) { process(next[i],(t+1)%2,depth+1); }
			} /* if recurse */
		} /* recursive function */
		process(obj,type,0);
		self.drawLabels();
	} /* mouseover */
	
	this.assignLabelEvents = function(obj,type) { /* hook events for displaying of labels */
		OAT.Dom.attach(obj.svg,"mouseover",function(){
			self.callMouseover(obj,type);
		});
	}
	
	this.drawVertices = function() { /* DRAW VERTICES phase */
		var len = self.data.length;
		for (var i=0;i<len;i++) if (self.data[i].visible.total) {
			var node = self.data[i];
			if (!node.svg.parentNode) { self.svg.appendChild(node.svg); }
			switch (node.type) {
				case 0:
					var oldx = node.svg.getAttribute("x")+node.radius;
					var oldy = node.svg.getAttribute("y")+node.radius;
					if (oldx != node.draw_x || oldy != node.draw_y) { /* if was moved */
						node.svg.setAttribute("x",node.draw_x-node.radius);
						node.svg.setAttribute("y",node.draw_y-node.radius);
					}
				break;
				case 1:
					var oldx = node.svg.getAttribute("cx");
					var oldy = node.svg.getAttribute("cx");
					if (oldx != node.draw_x || oldy != node.draw_y) { /* if was moved */
						node.svg.setAttribute("cx",node.draw_x);
						node.svg.setAttribute("cy",node.draw_y);
					}
				break;
			} /* switch */
		/* if not visible and still present, unlink svg element */
		} else if (self.data[i].svg.parentNode) { OAT.Dom.unlink(self.data[i].svg);	}
	}

	this.drawEdges = function(startNode) { /* DRAW EDGES phase */
		var len1 = self.data.length;
		for (var i=0;i<len1;i++) {
			var node1 = self.data[i];
			var len2 = node1.outEdges.length;
			for (var j=0;j<len2;j++) {
				var e = node1.outEdges[j];
				if (!e.svg.parentNode) { self.svg.appendChild(e.svg); }
				var node2 = node1.outEdges[j].vertex2;
				if (node1.visible.total || node2.visible.total) {
					var dx = node2.draw_x - node1.draw_x;
					var dy = node2.draw_y - node1.draw_y;
					var a = Math.atan2(dy,dx);
					var p1 = node1.radius + self.options.vertexPadding;
					var p2 = node2.radius + self.options.vertexPadding;
					var x1 = node1.draw_x + p1 * Math.cos(a);
					var y1 = node1.draw_y + p1 * Math.sin(a);
					var x2 = node2.draw_x - p2 * Math.cos(a);
					var y2 = node2.draw_y - p2 * Math.sin(a);
					
					if (x1 == e.x1 && x2 == e.x2 && y1 == e.y1 && y2 == e.y2 && e.n1vis == node1.visible.total && e.n2vis == node2.visible.total) { continue; }
					e.x1 = x1;
					e.x2 = x2;
					e.y1 = y1;
					e.y2 = y2;
					e.n1vis = node1.visible.total;
					e.n2vis = node2.visible.total;
					/* update position/style */
					if (node1 == node2) {
						e.svg.setAttribute("d","M "+x1+" "+y1+" A "+(node1.radius * 2)+" "+(node1.radius * 2)+" 0 1 0 "+x2+" "+y2);
					} else {
						e.svg.setAttribute("x1",x1);
						e.svg.setAttribute("x2",x2);
						e.svg.setAttribute("y1",y1);
						e.svg.setAttribute("y2",y2);
						if (!e.n1vis || !e.n2vis) {
							e.svg.setAttribute("stroke-dasharray","3,3");
						} else { 
							e.svg.setAttribute("stroke-dasharray","1,0");
						}
					}
				/* if not visible and still present, unlink svg element */
				} else if (e.svg.parentNode) { OAT.Dom.unlink(e.svg); }
			} /* all out edges */
		} /* all nodes */
	} /* drawEdges */
	
	this.drawLabels = function() {
		function drawSub(obj,type) {
			var x,y;
			switch (type) {
				case 0: /* vertex */
					x = obj.draw_x;
					y = obj.draw_y - 10;
				break;
				case 1: /* edge */
					x = (obj.x2+obj.x1)/2;
					y = (obj.y2+obj.y1)/2;
				break;
			} /* switch */
			obj.label.setAttribute("x",x);
			obj.label.setAttribute("y",y);
		}
		var len = self.data.length;
		for (var i=0;i<len;i++) {
			var n = self.data[i];
			if (n.label.parentNode) { drawSub(n,0); }
			var len2 = n.outEdges.length;
			for (var j=0;j<len2;j++) if (n.outEdges[j].label.parentNode) { drawSub(n.outEdges[j],1); }
		}
	}
	
	
	this.drawUpdate = function() { /* redraw during dragging */
		var x = parseInt(self.selects.draw.value);
		// OAT.Profiler.start("compute");
		self.computeVisibility();
		// OAT.Profiler.stop("compute");
		self.svgc.suspendRedraw(0);
		// OAT.Profiler.start("edges");
		/* draw appropriate edges */
		if (x == 0 || x == 2) { self.drawEdges(); }
		// OAT.Profiler.stop("edges");
		// OAT.Profiler.start("vertices");
		/* draw appropriate vertices */
		if (x == 0 || x == 1) { self.drawVertices(); }
		// OAT.Profiler.stop("vertices");
		/* draw appropriate labels */
		self.drawLabels();
		self.svgc.unsuspendRedraw(0);
	}
	
	this.draw = function() { /* complete redraw when selectbox changed */
		self.selects.placement.disabled = (self.selects.type.value == "1");
		self.selects.distance.disabled = (self.selects.type.value == "0");
		self.selects.projection.disabled = (self.selects.type.value == "0");
		
		for (var i=0;i<self.data.length;i++) {
			var node = self.data[i];
			if (node.svg.parentNode) { OAT.Dom.unlink(node.svg); }
			for (var j=0;j<node.outEdges.length;j++) { 
				var e = node.outEdges[j];
				if (e.svg.parentNode) { OAT.Dom.unlink(e.svg); }
				e.x1 = 0;
				e.x2 = 0;
				e.y1 = 0;
				e.y2 = 0;
			}
		}
		
		self.div.style.backgroundColor = self.options.backgroundColor;
		if (self.svgc) { OAT.Dom.unlink(self.svgc); }
		var w = self.options.width ? self.options.width : "100%";
		var h = self.options.height ? self.options.height : "100%";
		self.svgc = OAT.SVG.canvas(w,h);
		self.svg = OAT.SVG.element("g");
		self.svgc.appendChild(self.svg);
		self.div.appendChild(self.svgc);
		OAT.Dom.attach(self.svgc,"mousedown",function(event){
			OAT.GraphSVGData.graph = self;
			OAT.GraphSVGData.mouse_x = event.clientX;
			OAT.GraphSVGData.mouse_y = event.clientY;
		}); 
		var dims = OAT.Dom.getWH(self.div);
		if (w == "100%") { w = dims[0]; }
		if (h == "100%") { h = dims[1]; }
		self.width = w;
		self.height = h;
		
		if (self.selects.projection.value == "1") {
			var r = Math.min(w,h) / 2 - self.options.padding;
			var R = r * Math.PI / 2;
			var c = OAT.SVG.element("circle",{cx:w/2,cy:h/2,r:r,fill:"#000","fill-opacity":0.05});
			self.svg.appendChild(c);
		} else {
			/* hack for firefox's buggy dragging */
			var r = OAT.SVG.element("rect",{x:0,y:0,width:w,height:h,fill:"#fff","fill-opacity":0.0001});
			self.svg.appendChild(r); 
		}

		/* define arrow marker */
		var defs = OAT.SVG.element("defs");
		var marker = OAT.SVG.element("marker",{id:"arrow"});
		var poly = OAT.SVG.element("polyline",{fill:self.options.edgeColor,points:"0,0 10,4 0,7"});
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
		
		/* based on current settings, find some coordinates for vertices */
		self.computeVerticesPosition();
		self.drawUpdate();
		self.selectNode(self.selectedNode);
	} /* draw */
	
	this.init();
	this.draw();
} /* OAT.GraphSVG() */
OAT.Loader.featureLoaded("graphsvg");