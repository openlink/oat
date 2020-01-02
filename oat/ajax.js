/*
 *  $Id$
 *
 *  This file is part of the OpenLink Software AJAX Toolkit (OAT) project.
 *
 *  Copyright (C) 2005-2020 OpenLink Software
 *
 *  See LICENSE file for details.
 */
/*
	OAT.AJAX.GET|POST|SOAP|PUT|MKCOL|PROPFIND|PROPPATCH(url, data, callback, optObj)
	optObj = {
		headers:{},
		auth:OAT.AJAX.AUTH_NONE,
		user:"",
		password:"",
		timeout:false,
		type:OAT.AJAX.TYPE_TEXT,
		async:true,
		onerror:function(){},
		onstart:function(){},
		onend:function(){},
		noSecurityCookie:false
	}

	OAT.AJAX.startRef = function..
	OAT.AJAX.endRef = function..

	OAT.AJAX.AUTH_NONE
	OAT.AJAX.AUTH_BASIC
	OAT.AJAX.TYPE_TEXT
	OAT.AJAX.TYPE_XML
*/

/**
 * @namespace Provides basic Asynchronous XML call (AJAX) routines.
 * @message AJAX_START ajax reuqest started
 * @message AJAX_TIMEOUT ajax request timed out
 * @message AJAX_ERROR ajax request finished with error
 * @message AJAX_DONE ajax request successfully finished
 */

OAT.AJAX = {
    AUTH_NONE: 0,
    AUTH_BASIC: 1,
    AUTH_DEFAULT: 2,
    // Leave it to the browser to decide
    TYPE_TEXT: 0,
    TYPE_XML: 1,
    httpError: 1,
    SHOW_NONE: 0,
    SHOW_POPUP: 1,
    SHOW_THROBBER: 2,
    SHOW_CUSTOM: 3,
    requests: [],
    err_dlgs: false,
    stat_dlg: false,
    imagePath: OAT.Preferences.imagePath,
    startRef: false,
    endRef: false,

    abortAll: function() {
        while (OAT.AJAX.requests.length) {
            OAT.AJAX.requests[0].abort();
        }
    },

    GET: function(url, data, callback, optObj) {
        var options = OAT.AJAX.options(optObj);
        var xhr = OAT.AJAX.init(url, callback, options);
        var url_ = url; /* create security cookie */
        if (url.match(/\?/)) {
            url_ += "&";
        } else {
            if (data || !options.noSecurityCookie) {
                url_ += "?";
            }
        }

        if (data) {
            url_ += data;
        }

        if (!options.noSecurityCookie) {
            url_ += "&";
            var secure = OAT.AJAX.createCookie(); /* array of name & value */
            url_ += secure[0] + "=" + secure[1];
        }
        xhr.open("GET", url_, options.async);
        OAT.AJAX.send(xhr, null);
        return xhr;
    },

    POST: function(url, data, callback, optObj) {
        var options = OAT.AJAX.options(optObj);
        var xhr = OAT.AJAX.init(url, callback, options);
        xhr.open("POST", url, options.async);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        OAT.AJAX.send(xhr, data);
        return xhr;
    },

    PUT: function(url, data, callback, optObj) {
        var options = OAT.AJAX.options(optObj);
        var xhr = OAT.AJAX.init(url, callback, options);
        xhr.open("PUT", url, options.async);
        OAT.AJAX.send(xhr, data);
        return xhr;
    },

    SOAP: function(url, data, callback, optObj) {
        var options = OAT.AJAX.options(optObj);
        var xhr = OAT.AJAX.init(url, callback, options);
        xhr.open("POST", url, options.async);
        OAT.AJAX.send(xhr, data);
        return xhr;
    },

    SOAP_SYNC: function(url, data, optObj) {
        var res = null;
        var cBack = function(xmlDoc, headers) {
                res = xmlDoc;
            };
        var options = OAT.AJAX.options(optObj);
        var xhr = OAT.AJAX.init(url, cBack, options);
        xhr.open("POST", url, false);
        OAT.AJAX.send(xhr, data);
        return res;
    },

    MKCOL: function(url, data, callback, optObj) {
        var options = OAT.AJAX.options(optObj);
        var xhr = OAT.AJAX.init(url, callback, options);
        xhr.open("MKCOL", url, options.async);
        OAT.AJAX.send(xhr, data);
        return xhr;
    },

    PROPFIND: function(url, data, callback, optObj) {
        var options = OAT.AJAX.options(optObj);
        var xhr = OAT.AJAX.init(url, callback, options);
        xhr.open("PROPFIND", url, options.async);
        OAT.AJAX.send(xhr, data);
        return xhr;
    },

    PROPPATCH: function(url, data, callback, optObj) {
        var options = OAT.AJAX.options(optObj);
        var xhr = OAT.AJAX.init(url, callback, options);
        xhr.open("PROPPATCH", url, options.async);
        OAT.AJAX.send(xhr, data);
        return xhr;
    },

    options: function(optObj) { /* add default options */
        var options = {
            headers: {},
            auth: OAT.AJAX.AUTH_NONE,
            user: "",
            password: "",
            timeout: false,
            type: OAT.AJAX.TYPE_TEXT,
            noSecurityCookie: false,
            async: true,
            onerror: false,
            onstart: false,
            onend: false
        };
        for (var p in optObj) {
            options[p] = optObj[p];
        }
        return options;
    },

    init: function(url, callback, options) { /* common initialization for all methods */
        OAT.MSG.send(OAT.AJAX, "AJAX_START", url);

        var xhr = new OAT.AJAX.XMLHTTP(options, callback);

        if (options.onstart) { /* if individual callback */
            options.onstart(xhr);
        } else { /* global notification otherwise - when allowed or specified */
            if ((OAT.AJAX.startRef || OAT.Preferences.showAjax) && !OAT.AJAX.requests.length) {
                OAT.AJAX.startNotify(OAT.Preferences.showAjax);
            }
        }

        xhr.setResponse(function() {
            OAT.AJAX.response(xhr);
        });
        OAT.AJAX.requests.push(xhr);
        return xhr;
    },

    send: function(xhr, data) {
        function go() {
            xhr.send(data);
            try {
                if (OAT.Browser.isGecko && !xhr.options.async) {
                    OAT.AJAX.response(xhr);
                }
            } catch (e) {}
        }
        for (var p in xhr.options.headers) {
            xhr.setRequestHeader(p, xhr.options.headers[p]);
        }

        if (xhr.options.timeout) {
            xhr.setTimeout(xhr.options.timeout);
        }

        if (xhr.options.auth == OAT.AJAX.AUTH_BASIC) {
            var cb = function() {
                    xhr.setRequestHeader('Authorization', 'Basic ' + OAT.Crypto.base64e(xhr.options.user + ":" + xhr.options.password));
                    go();
                }

            OAT.Loader.load("crypto", cb);
        } /* if auth needed */
        else go();
    },

    response: function(xhr) {
        if (xhr.aborted) {
            return;
        }
        if (xhr.getReadyState() == 4) {
            if (xhr.timeout != false) {
                xhr.clearTimeout();
            }
            var headers = xhr.getAllResponseHeaders();
            var index = OAT.AJAX.requests.indexOf(xhr);
            if (index != -1) {
                OAT.AJAX.requests.splice(index, 1);
            } /* remove from request registry */
            OAT.AJAX.checkEnd();
            if (xhr.options.onend) {
                xhr.options.onend(xhr);
            }
            if (xhr.getStatus().toString().charAt(0) == "2" || xhr.getStatus() == 0) { /* success */
                OAT.MSG.send(OAT.AJAX, "AJAX_DONE", xhr);
                if (xhr.options.type == OAT.AJAX.TYPE_TEXT) {
                    xhr.callback(xhr.getResponseText(), headers);
                } else {
                    if (OAT.Browser.isIE || OAT.Browser.isWebKit) {
                        xmlStr = xhr.getResponseText();
                        var xmlDoc = OAT.Xml.createXmlDoc(xmlStr);
                    } else {
                        var xmlDoc = xhr.getResponseXML();
                        if (!xmlDoc) {
                            xmlDoc = OAT.Xml.createXmlDoc(xhr.getResponseText());
                        }
                    }
                    xhr.callback(xmlDoc, headers);
                }
            } else { /* not success */
                OAT.MSG.send(OAT.AJAX, "AJAX_ERROR", xhr);
                if (xhr.options.onerror) {
                    xhr.options.onerror(xhr);
                } else if (OAT.AJAX.httpError) {
                    var err_dlg = OAT.AJAX.make_error(xhr);
                    err_dlg.show();

                    if (OAT.AJAX.SHOW_POPUP) { // show the error message inside the popup
                        if (OAT.Loader.isLoaded('dialog') && self.error_dlg) self.error_dlg.show();
                    } else { // if no popup
                        var tmp = window.confirm(errtext);
                        if (tmp) {
                            window.alert(xhr.getResponseText());
                        }
                    }
                }
            } /* http error */
        } /* readystate == 4 */
    },
    /* OAT.AJAX.response */

    checkEnd: function() {
        if ((OAT.AJAX.endRef || OAT.Preferences.showAjax) && OAT.AJAX.requests.length == 0) {
            OAT.AJAX.endNotify(OAT.Preferences.showAjax);
        }
    },

    startNotify: function(showType) { /* global notification */
        if (OAT.AJAX.startRef) {
            OAT.AJAX.startRef();
            return;
        }

        if (showType == OAT.AJAX.SHOW_POPUP) { // show dialog
            if (!OAT.AJAX.stat_dlg && OAT.Loader.isLoaded('dialog')) {
                OAT.AJAX.stat_dlg = OAT.AJAX.make_stat_dlg();
                OAT.AJAX.stat_dlg.open();
            }
        }

        if (showType == OAT.AJAX.SHOW_THROBBER) { // show throbber
            if ($('oat_ajax_throbber')) {
                OAT.Dom.show($('oat_ajax_throbber'));
            } else {
                var win = new OAT.Win({
                    type: OAT.Win.Round,
                    title: "Processing...",
                    outerWidth: 165,
                    outerHeight: 125,
                    buttons: ""
                });
                win.dom.container.id = 'oat_ajax_throbber';
                win.dom.content.id = 'oat_ajax';
                win.dom.title.id = 'oat_ajax_title';
                win.open();

                var img = OAT.Dom.image('./imgs/throbber.gif');
                win.dom.content.appendChild(img);
                win.dom.content.style.textAlign = 'center';
                win.dom.content.style.marginTop = '12px';
                win.dom.container.style.position = 'fixed';
                OAT.Dom.center(win.dom.container, 1, 1, document.body);
            }
        }
    },

    endNotify: function(showType) {
        if (OAT.AJAX.endRef) {
            OAT.AJAX.endRef();
            return;
        }
        if (showType == OAT.AJAX.SHOW_POPUP) {
            if (OAT.Loader.isLoaded("dialog") && OAT.AJAX.stat_dlg) {
                OAT.AJAX.stat_dlg.close();
            }
        }
        if (showType == OAT.AJAX.SHOW_THROBBER) {
            OAT.Dom.hide($('oat_ajax_throbber'));
        }
    },

    createCookie: function() {
        var code = Math.random().toString().split(".").pop();
        var date = new Date();
        var name = "oatSecurityCookie";
        date.setTime(date.getTime() + (60 * 1000)); /* 1 minute validity */
        var expires = "; expires=" + date.toGMTString();
        document.cookie = name + "=" + code + expires + "; path=/";
        return [name, code];
    },

    make_stat_dlg: function() {
        // Status dialog
        var stat_ctr = OAT.Dom.create('div', {
            className: 'oat_xhr_status_dlg'
        });
        var stat_thr = OAT.Dom.create('img', {
            className: 'oat_xhr_status_thr'
        });
        stat_thr.src = OAT.Preferences.imagePath + "arrow_anim_throbber.gif";
        var stat_msg = OAT.Dom.create('div', {
            className: 'oat_xhr_status_msg'
        });

        stat_msg.innerHTML = "In progress..."

        OAT.Dom.append([stat_ctr, stat_thr, stat_msg]);

        stat_dlg = new OAT.Dialog("XHR call", stat_ctr, {
            width: 240,
            modal: 0,
            zIndex: 1001,
            resize: 0
        });

        OAT.MSG.attach(stat_dlg, "DIALOG_CANCEL", function() {
            OAT.AJAX.abortAll();
        });

        return stat_dlg;
    },

    make_error: function(xhr) {
        // Error dialog
        var err_ctr = OAT.Dom.create('div', {
            className: 'oat_xhr_err_dlg'
        });
        var err_msg = OAT.Dom.create('div', {
            className: 'oat_xhr_err_msg'
        });
        err_msg.innerHTML = "Problem retrieving data, status=" + xhr.getStatus() + ".";

        // XXX make details toggle
        var err_btn_1 = OAT.Dom.create("input", {
            type: 'button'
        });
        err_btn_1.value = "Details";
        err_btn_1.onclick = function() {
            window.alert(xhr.getResponseText());
        }

        var err_btn_2 = OAT.Dom.create("input", {
            type: 'button'
        });
        err_btn_2.value = "Continue";

        OAT.Dom.append([err_ctr, err_msg, err_btn_1, err_btn_2]);

        var error_dlg = new OAT.Dialog("XHR error", err_ctr, {
            width: 240,
            modal: 0,
            zIndex: 1001,
            resize: 0,
            buttons: false
        });

        err_btn_2.onclick = function() {
            OAT.AJAX.endNotify(OAT.Preferences.showAjax);
            error_dlg.close();
        }

        return error_dlg;
    },

    XMLHTTP: function(options, callback) {
        var self = this;
        this.obj = false;
        this.callback = callback;
        this.options = options;
        this.timeout = false;
        this.aborted = false;
        this.open = function(method, target, async) {
            try {
                if (self.options.auth == OAT.AJAX.AUTH_DEFAULT && self.options.user && self.options.password) self.obj.open(method, target, async, self.options.user, self.options.password);
                else self.obj.open(method, target, async);
            } catch (e) {
                self.aborted = true;
                if (self.options.onend) {
                    self.options.onend(self);
                }
                var index = OAT.AJAX.requests.indexOf(self);
                OAT.AJAX.requests.splice(index, 1);
                OAT.AJAX.checkEnd();
            }
        }
        this.send = function(data) {
            if (!self.aborted) {
                self.obj.send(data);
            }
        }
        this.setResponse = function(callback) {
            self.obj.onreadystatechange = callback;
        }
        this.getResponseText = function() {
            return self.obj.responseText;
        }
        this.getResponseXML = function() {
            return self.obj.responseXML;
        }
        this.getReadyState = function() {
            return self.obj.readyState;
        }
        this.getStatus = function() {
            return self.obj.status;
        }
        this.setRequestHeader = function(name, value) {
            self.obj.setRequestHeader(name, value);
        }
        this.getAllResponseHeaders = function() {
            return self.obj.getAllResponseHeaders();
        }

        this.setTimeout = function(msec) {
            var cb = function() {
                    OAT.MSG.send(OAT.AJAX, "AJAX_TIMEOUT", self);
                    self.timeout = false;
                    self.abort();
                }
            self.timeout = setTimeout(cb, msec);
        }

        this.clearTimeout = function(msec) {
            clearTimeout(self.timeout);
            self.timeout = false;
        }

        this.abort = function() { /* abort */
            self.aborted = true;
            var index = OAT.AJAX.requests.indexOf(self);
            if (index != -1) {
                OAT.AJAX.requests.splice(index, 1);
            }
            if (self.options.onend) {
                self.options.onend(self);
            }
            if (self.timeout != false) {
                self.clearTimeout();
            }
            OAT.AJAX.checkEnd();
            if (self.obj.abort) {
                self.obj.abort();
            } /* abort the xmlhttp */
        }

        //
        //  Constructor
        //
        var oXMLHttpRequest = window.XMLHttpRequest;
        if (oXMLHttpRequest) {
            self.obj = new oXMLHttpRequest(); /* gecko */
        } else if (window.ActiveXObject) {
            self.obj = new ActiveXObject("Microsoft.XMLHTTP"); /* ie */
        } else {
            alert("OAT.AJAX.constructor:\nXMLHTTPRequest not available!");
        }

        // Fix problem with some versions of FireBug
        if (OAT.Browser.isGecko && oXMLHttpRequest.wrapped) self.obj.wrapped = oXMLHttpRequest.wrapped;
    }
} /* OAT.AJAX */
OAT.AJAX.cancelAll = OAT.AJAX.abortAll;
