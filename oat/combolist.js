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
	@css {class} oat_combo_list
	@css {class} oat_combo_list_input
	@css {class} oat_combo_list_option
	@css {class} oat_combo_list_list
	@css {class} oat_combo_list_option_selected
*/

OAT.Combolist = function(optList,value,optObj) {
	var self = this;
	
	this.options = {
	name:"oat_combo_list", /* name of input element */
		imagePath:OAT.Preferences.imagePath,
	hilight:false,	
	keynav:false, /* using keynav without hilighting may be confusing to user */
	suggest:false
	}
	
	for (var p in optObj) { self.options[p] = optObj[p]; }
	
	this.value = value || "";
    this.div = OAT.Dom.create("div",{className:"oat_combo_list"});
	
	this.img = OAT.Dom.create("img",{cursor:"pointer"});
	this.img.src = self.options.imagePath + "Combolist_select.gif";
    this.input = OAT.Dom.create("input",{className:"oat_combo_list_input"});
	this.input.type = "text";
	this.input.name = self.options.name;
	this.input.value = self.value;
	this.input.defaultValue = self.value;

    this.selected = 0;
    this.visibleNodes = [];
	
    this.list = OAT.Dom.create("div",{position:"absolute",left:"0px",top:"0px",zIndex:1001, border:"1px solid",className:"oat_combo_list_list"});
    
    this._keynav = function(event) {
	var l = self.visibleNodes.length + 1;
	
	/* handle event keycode */
	switch (event.keyCode) {
	    /* escape, enter, (close/select and close) */
	case 27:
	    self.selected = 0;
	    self.instant.hide();
	    break;
	    
	case 13:
	    if (self.selected) { 
		var option = self.visibleNodes[self.selected-1];
		self.value = option.value;
		self.input.value = option.value;
		
		/* ff3? fix, escape would otherwise restore previous value */
		self.input.blur();
		self.input.focus();
	    }
	    self.selected = 0;
	    self.instant.toggle();
	    break;
	    
	    /* move up */
	case 38:
	    self.selected = (self.selected - 1) % l;
	    if (self.selected < 0) { self.selected += l; } 
	    self.instant.show();
	    break;
	    
	    /* move down */
	case 40:
	    self.selected = (self.selected + 1) % l; 
	    self.instant.show();
	    break;
	}		
    }
    
    this._suggest = function(event) {
	/* no new input, return */
	if (self.input.value == self.value) { return; }
	
	self.instant.show();
	self.selected = 0;
	self.visibleNodes = [];
	
	/* restore full set */
	for (var i=0;i<self.list.childNodes.length;i++) {
	    var item = self.list.childNodes[i];
	    OAT.Dom.show(item);
	}
	OAT.Dom.show(self.list);
	
	/* grep matches */
	var shown = self.list.childNodes.length;
	for (var i=0;i<self.list.childNodes.length;i++) {
	    var item = self.list.childNodes[i];
	    if (item.value.match(self.input.value)) {
		self.visibleNodes.push(item);
	    } else {
		OAT.Dom.hide(item);
		shown--;
	    } 
	}
	
	/* hide list div if every option is hidden */
	if (!shown) { OAT.Dom.hide(self.list); }
    }
    
    this._hilight = function(event) {
	for (var i=0;i<self.visibleNodes.length;i++) {
	    var node = self.visibleNodes[i];
	    OAT.Dom.removeClass(node,"oat_combo_list_option_selected");
	}
	
	var src = OAT.Event.source(event);
	var current = false;
	
	/* self.input means we're keynaving inside list */
	if (self.options.keynav && src == self.input) {
	    current = self.visibleNodes[self.selected-1];
	} 
	
	/* if option found, we're mouseovering the list */
	if (self.visibleNodes.indexOf(src) != -1) {
	    current = src;
	}
	
	OAT.Dom.addClass(current,"oat_combo_list_option_selected");	
    }
    
    this.clearOptions = function() {
		OAT.Dom.clear(self.list);
	self.visibleNodes = []; 
	}
	
	this.addOption = function(name, value) {
		var n = name;
	var v = (value) ? value : name;
	var option = OAT.Dom.create("div",{innerHTML:n,value:v,className:"oat_combo_list_option"});
	
	var setOption = function(evt) {
	    self.value = evt.target.innerHTML;
	    self.input.value = self.value;
	    OAT.MSG.send(self,"COMBO_LIST_CHANGE",self.value);
	}

	/* clicking sets */
	OAT.Event.attach(option,"mousedown",setOption);
	
	/* clicking hides */
	self.instant.createHandle(option);
	
	/* overing hilights */
	if (self.options.hilight) { OAT.Event.attach(option,"mouseover",self._hilight); }
	
	/* append and add to visible nodes */
	self.list.appendChild(option);
	self.visibleNodes.push(option);
    }
    
    this._showList = function() {
	/* position option list correctly */
	var coords = OAT.Dom.position(self.input);
	var dims = OAT.Dom.getWH(self.input);
	self.list.style.left = (coords[0]+2) +"px";
	self.list.style.top = (coords[1]+dims[1]+5)+"px";
    }
    
    this._hideList = function() {
	/* 
	 * if suggest enabled, visibleNodes list could change,
	 * so renew it after hide
	 */
	if (self.options.suggest) {
	    self.visibleNodes = [];
	    for (var i=0;i<self.list.childNodes.length;i++) {
		var node = self.list.childNodes[i];
		OAT.Dom.show(node);
		self.visibleNodes.push(node);
	    }
	}
	
	/* hiding clears hilights */
	if (self.options.hilight) {
	    for (var i=0;i<self.visibleNodes.length;i++) {
		var node = self.visibleNodes[i];
		OAT.Dom.removeClass(node,"oat_combo_list_option_selected");
	    }
		}
	}

    this._init = function() {
	/* add show/hide capability to the list */
	self.instant = new OAT.Instant(self.list);
	
	OAT.MSG.attach(self.instant,"INSTANT_SHOW",self._showList);
	OAT.MSG.attach(self.instant,"INSTANT_HIDE",self._hideList);
	
	/* attach instant to arrow image and input */
	self.instant.createHandle(self.img);
	self.instant.createHandle(self.input);
	
	/* escape outside list hides */
	OAT.Event.attach(document,"keyup",function(event) { 
	    if (event.keyCode == 27) { self.instant.hide(); }
	});
	
	/* set up event listening for input changes */
	OAT.Event.attach(this.input,"keyup",function(event) {
	    if (self.options.suggest) { self._suggest(event); }
	    if (self.options.keynav) { self._keynav(event); }
	    if (self.options.hilight) { self._hilight(event); }
	    
	    self.value = self.input.value; 
	    
	    OAT.MSG.send(self,"COMBO_LIST_CHANGE",self.input.value);
	});
	
	/* if user passed some options, put them in */
	if (optList) {	
		for (var i=0;i<optList.length;i++) {
			this.addOption(optList[i]);
		}
	}
	
	/* append self to dom tree */
	OAT.Dom.append([self.div,self.input,self.img],[document.body,self.list]);
    }
	
    this.clearOpts = function() {
	self.visibleNodes = [];
	OAT.Dom.clear(self.list);	
	}
    
    self._init();
}
