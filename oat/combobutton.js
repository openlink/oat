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
	var cb = new OAT.ComboButton();
	appendChild(cb.div);
	cb.addOption(imagepath,textvalue,callback)
	cb.removeOption(index)
	
	CSS: oat_combo_button, oat_combo_button_image, oat_combo_button_text, oat_combo_button_option, oat_combo_button_option_down
*/

OAT.ComboButton = function() {
	var self = this;

	this.div = OAT.Dom.create("div"); /* THE element */
	this.optList = OAT.Dom.create("div",{position:"absolute",left:"0px",top:"0px",className:"oat_combo_button"}); /* list of other options; hidden most of the time */

	this.image = OAT.Dom.create("img",{cursor:"pointer",className:"oat_combo_button_image"}); /* dropdown clicker */
	this.image.src = OAT.Preferences.imagePath+"Combobutton_select.gif";
	this.selected = OAT.Dom.create("div",{cssFloat:"left",styleFloat:"left"}); /* currently selected option */
	
	this.options = [];
	
	this.select = function(index,do_callback) { /* select one option, call for action */
		if (self.selected.firstChild) { self.optList.appendChild(self.selected.firstChild); } /* remove old option, if any */
		self.selected.appendChild(self.options[index][0]); /* append one from listbox */
		if (self.optList.parentNode) { self.instant.hide(); } /* hide listbox */
		if (do_callback) { self.options[index][1](); } /* if not selected automatically, action */
	}
	
	this._showList = function() { /* open listbox */
		var coords = OAT.Dom.position(self.div); /* calculate the place */
		var dims = OAT.Dom.getWH(self.div); /* calculate the place */
		self.optList.style.left = coords[0]+"px";
		self.optList.style.top = (coords[1]+dims[1])+"px";
	}
	
	this.addOption = function(imagePath,textValue,callback) {
		var opt = OAT.Dom.create("div",{className:"oat_combo_button_option"});
		OAT.Event.attach(opt,"mousedown",function(){
			OAT.Dom.addClass(opt,"oat_combo_button_option_down");
		});
		OAT.Event.attach(opt,"mouseup",function(){
			OAT.Dom.removeClass(opt,"oat_combo_button_option_down");
		});
		if (imagePath) { /* if image specified, add it to option */
			var img = OAT.Dom.create("img",{cssFloat:"left",styleFloat:"left"});
			img.src = imagePath;
			opt.appendChild(img);
		}
		var text = OAT.Dom.create("div"); /* text */
		text.className = "oat_combo_button_text";
		text.innerHTML = textValue;
		opt.appendChild(text);
		self.options.push([opt,callback]); /* put to global registry */
		self.optList.appendChild(opt);
		var index = self.options.length - 1;
		var clickRef = function() {	self.select(index,true); }
		OAT.Event.attach(opt,"click",clickRef); /* what to do after clicking */
		if (self.options.length == 1) { this.select(0,false); } /* first option is automatically selected */
	}
	
	this.removeOption = function(index) {
		if (index > self.options.length-1) { return; }
		var was_active = false;
		if (self.options[index][0] == self.selected.firstChild) { was_active = true; } /* what if we removed the active option? */
		OAT.Dom.unlink(self.options[index][0]);
		self.options.splice(index,1);
		if (was_active && self.options.length) { self.select(0,false); } /* then select the first available */
	}
	
	this._init = function() {
		self.instant = new OAT.Instant(this.optList);
		self.instant.createHandle(self.image);

		OAT.MSG.attach(self.instant,"INSTANT_SHOW",self._showList);
		OAT.Dom.append([this.div,this.selected,this.image],[document.body,self.optList]);
	}

	self._init();
}
