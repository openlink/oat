/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2019 OpenLink Software
 *
 *  See LICENSE file for details.
 */
/*
	OAT.Notify.send(content, optObj);
*/

OAT.Notify = function(parentDiv,optObj) {
	var self = this;
	this.options = {
		x:-1,
		y:-1
	}

	for (var p in optObj) { self.options[p] = optObj[p]; }

	this.parentDiv = parentDiv || document.body;
	this.container = false; 
	this.cx = 0;
	this.cy = 0;

	this._update = function() {
		var scroll = OAT.Dom.getScroll();
		var dims = OAT.Dom.getViewport();
		with (self.container.style) {
			left = (self.cx + scroll[0]) + "px";
			top = (self.cy + scroll[1]) + "px";
		}
	}
	
	this._createContainer = function(width,height) {
		var pos = OAT.Dom.getLT(self.parentDiv);
		var dim = OAT.Dom.getWH(self.parentDiv);

		if(self.options.x == -1) { 
			self.cx = Math.round( pos[0] + (dim[0] - width ) / 2 ); 
		} else { 
			self.cx = pos[0] + self.options.x; 
		}
		
		if(self.options.y == -1) { 
			self.cy = Math.round( pos[1] + (dim[1] - height) / 2 ); 
		} else { 
			self.cy = pos[1] + self.options.y; 
		}
		
		var c = OAT.Dom.create("div",{position:"fixed", top: self.cy + "px", left: self.cx + "px"});
		self.container = c;
		self.parentDiv.appendChild(c);


		if (OAT.Browser.isIE6) { 
			c.style.position = "absolute"; 
			OAT.Event.attach(window,'resize',self._update); 
			OAT.Event.attach(window,'scroll',self._update); 
			self._update();
		} 
		} 

	this.send = function(content, optObj) {
		var options = {
			image:false, /* url */
			padding:"2px", /* of container */
			background:"#ccc", /* of container */
			color:"#000", /* of container */
			style:false, /* custom properties for text */
			opacity:0.8,
			delayIn:50, /* when fading in */
			delayOut:50, /* when fading out */
			timeout:2000, /* how long will be visible? */
			width:300,
			height:50
		}
		for (var p in optObj) { options[p] = optObj[p]; }
		
		/* create container for all notifications if necessary */
		if (!self.container) { self._createContainer(options.width,options.height); }

		/* this notification's container */
		var div = OAT.Dom.create("div",{width:options.width+"px",height:options.height+"px",cursor:"pointer",overflow:"hidden",marginBottom:"2px",padding:options.padding,backgroundColor:options.background,color:options.color});
		
		/* create the messages text box and style it */		
		var c = $(content);
		if (!c) { 
			c = OAT.Dom.create("div",{innerHTML:content}); 
		}
		if (options.style) { OAT.Style.set(c,options.style); }
		div.appendChild(c);

		/* image or throbber */
		if (options.image) {
			var img = OAT.Dom.create("img",{cssFloat:"left",styleFloat:"left",marginRight:"2px"});
			img.src = options.image;
			div.appendChild(img); 
		}

		/* set initial opacity to zero */
		OAT.Style.set(div,{opacity:0});

		/* callbacks */
		var start = function() {
			self.container.appendChild(div);
			if (options.delayIn) { 
				aAppear.start(); 
			} else { 
				OAT.Style.set(div,{opacity:options.opacity}); 
				afterAppear();
			}
		}

		var end = function() {
			aAppear.stop();
		}

		var afterRemove = function() {
			OAT.Dom.unlink(div);
		}

		var afterAppear = function() {
			if (!options.timeout) { return; }
			setTimeout(function() {
				if (div.parentNode) { aDisappear.start(); }
			},options.timeout);
		}
		
		/* appear/disappear/when notification is removed animations */
		var aAppear = new OAT.AnimationOpacity(div,{opacity:options.opacity,speed:0.1,delay:options.delayIn});
		var aDisappear = new OAT.AnimationOpacity(div,{opacity:0,speed:0.1,delay:options.delayOut});
		var aRemove = new OAT.AnimationSize(div,{height:0,speed:10,delay:options.delayOut});

		/* listen for messages triggering correct animation sequencing */
		OAT.MSG.attach(aRemove.animation, "ANIMATION_STOP", afterRemove);
		OAT.MSG.attach(aAppear.animation,"ANIMATION_STOP",afterAppear);
		OAT.MSG.attach(aDisappear.animation,"ANIMATION_STOP",aRemove.start);
		
		/* attach removal on click */
		OAT.Event.attach(div,"click",function() {
			if (options.delayOut) {
				aRemove.start();
			} else {
				OAT.Dom.unlink(div);
			}
		});
		
		/* and show notification */
		start();
	}
}
