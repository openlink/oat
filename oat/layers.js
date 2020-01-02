/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2020 OpenLink Software
 *
 *  See LICENSE file for details.
 */
/*

	var l = new OAT.Layers(baseOffset);
	l.addLayer(something,activationEvent)
	l.removeLayer(something)
*/

OAT.Layers = function(baseOffset) {
	var self = this;
	this.baseOffset = baseOffset;
	this.layers = [];
	
	this.raise = function(elm) {
		var currZ = elm.style.zIndex;
		var maxZ = currZ;
		var arr = [];
		for (var i=0;i<this.layers.length;i++) {
			var l = this.layers[i];
			var z = l.style.zIndex;
			if (z > currZ) { arr.push(l); } /* greater than current layer */
			if (z > maxZ) { maxZ = z; } /* largest z-index */
		}
		
		arr.sort(function(a,b) { return a.style.zIndex - b.style.zIndex; }); /* sort those which were above */
		arr.unshift(elm);
		
		for (var i=1;i<arr.length;i++) { /* decrease all */
			arr[i].style.zIndex = arr[i-1].style.zIndex;
		}
		elm.style.zIndex = maxZ; /* raise layer */
	}

	this.addLayer = function(something,activationEvent) {
		var elm = $(something);
		if (!elm) { throw new Error("Cannot find '"+something+"'"); }

		var event = activationEvent || "mousedown";
		elm.style.zIndex = self.baseOffset + this.layers.length;
		this.layers.push(elm);
		OAT.Event.attach(elm,event,function(){self.raise(elm);});
	}
	
	this.removeLayer = function(something) {
		var elm = $(something);
		var index = self.layers.indexOf(elm);
		if (index == -1) { throw new Error("Cannot find '"+something+"'"); }
		self.layers.splice(index,1);
	}
}
