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
	f = new OAT.FishEye(div,optObj);
	var i = f.addImage(url);
	
	CSS: .oat_fisheye
*/

OAT.FishEye = function(div,optObj) {
	this.options = {
		smallSize: 32,
		bigSize:64,
		limit: 2
	}
	
	for (var p in optObj) { this.options[p] = optObj[p]; }
	
	this.images = [];
	this.sizes = [];
	this.div = $(div);
	OAT.Dom.addClass(this.div, "oat_fisheye");
	
	var self = this;
	OAT.Event.attach(this.div, "mouseover", function(e) { self._event(e); });
	OAT.Event.attach(this.div, "mousemove", function(e) { self._event(e); });
	OAT.Event.attach(this.div, "mouseout", function(e) { self._reset(); });
}
	
OAT.FishEye.prototype.addImage = function(url) {
	var i = OAT.Dom.create("img");
	i.src = url;
	this.images.push(i);
	this.sizes.push(this.options.smallSize);
	this.div.appendChild(i);
	this._reset();
	return i;
}
	
OAT.FishEye.prototype._getCoef = function(dist) {
	var M = this.options.bigSize  / this.options.smallSize;
	return Math.max(1, M - dist/this.options.limit);
}
	
OAT.FishEye.prototype._reset = function() {
	for (var i=0;i<this.sizes.length;i++) { this.sizes[i] = this.options.smallSize; }
	this._redraw();
}

OAT.FishEye.prototype._redraw = function() {
	for (var i=0;i<this.images.length;i++) {
		var size = this.sizes[i];
		this.images[i].style.width = size+"px";
		this.images[i].style.height = size+"px";
	}
}
		
OAT.FishEye.prototype._recount = function(event_x) {
	var left = 0;
	var index = -1;
	var ratio = 0;
	for (var i=0;i<this.sizes.length;i++) {
		var s = this.sizes[i];
		if (left <= event_x && left+s > event_x) { 
			index = i; 
			ratio = (event_x-left) / s;
		}
		left += s;
	}
	
	for (var i=0;i<this.sizes.length;i++) {
		var s = this.sizes[i];
		var dist = 0;
		if (i < index) {
			dist += 0.5;
			for (var j=i+1; j<index; j++) { dist++; }
			dist += ratio;
		} else if (i == index) {
			dist = Math.abs(ratio - 0.5);
		} else {
			dist += 1-ratio;
			for (var j=index+1; j<i; j++) { dist++; }
			dist += 0.5;
		}
		var coef = this._getCoef(dist);
		s = Math.round(this.options.smallSize * coef);
		this.sizes[i] = s;
	}
	
	this._redraw();
}
	
OAT.FishEye.prototype._event = function(event) {
	var pos = OAT.Event.position(event)[0];
	var p2 = OAT.Dom.position(this.div)[0];
	this._recount(pos-p2);
}
