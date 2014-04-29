/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software Ajax Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2014 OpenLink Software
 *
 *  See LICENSE file for details.
 */
/*
	var cb = new OAT.ComboBox(defaultValue);
	appendChild(cb.div);
	cb.onchange = callback;
	
	cb.addOption(element,textValue)
	
	CSS: oat_combo_box, oat_combo_box_value, oat_combo_box_list, oat_combo_box_image
*/

OAT.ComboBox = function(defaultValue) {
	var self = this;
	this.onchange = function() {};
	this.div = OAT.Dom.create("div",{className:"oat_combo_box"}); /* THE element */
	this.options = [];
	this.optList = OAT.Dom.create("div",{position:"absolute",left:"0px",top:"0px",className:"oat_combo_box_list"}); /* list of other options; hidden most of the time */
	this.image = OAT.Dom.create("img",{cursor:"pointer",className:"oat_combo_box_image"}); /* dropdown clicker */
	this.image.src = OAT.Preferences.imagePath+"Combobox_select.gif";
	this.selected = OAT.Dom.create("div",{className:"oat_combo_box_value"});
	this.value = defaultValue;
	this.selected.innerHTML = this.value;
	
	self.instant = new OAT.Instant(this.optList);
	OAT.Dom.append([this.div,this.selected,this.image],[document.body,self.optList]);
	
	this.select = function(textValue) {
		self.value = textValue;
		self.selected.innerHTML = textValue;
		self.onchange(textValue);
		self.instant.hide();
	}
	
	this._showList = function() {	
		var coords = OAT.Dom.position(self.div); /* calculate the place */
		var dims = OAT.Dom.getWH(self.div); /* calculate the place */
		self.optList.style.left = coords[0]+"px";
		self.optList.style.top = (coords[1]+dims[1])+"px";
	}
	
	OAT.MSG.attach(self.instant,"INSTANT_SHOW",self._showList);
	
	this.addOption = function(element,textValue) {
		var elm = $(element);
		self.options.push([elm,textValue]);
		self.optList.appendChild(elm);
		var clickRef = function() {	self.select(textValue); }
		OAT.Event.attach(elm,"click",clickRef); /* what to do after clicking */
	}
	
	self.instant.createHandle(this.image);
	self.instant.createHandle(this.selected);
}
