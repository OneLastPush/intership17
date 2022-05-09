/**
* Misc setups -- changes existing objects (ei, jquery ajax, date object), adds new utility objs.
*
* Requires:
*	js/errors.js for custom statusHandler of generic HTTP errors
*
* @author Ganna Shmatova
*/

$(window).load(function(){
    $('ul.settings li').click(function(e){ //hacks bootstrap dropdown disappearing when clicked
        e.stopPropagation();
    });

    // ------- gives 'caps lock is on' warning in password fields ---------
    var $pws = $('[type=password]');
    $pws.tooltip({ //initiates
        title: 'Caps lock is on',
        trigger: 'manual'
    });
    $pws.keypress(function(e){ //checks caps lock on typing
        var s = String.fromCharCode(e.which);
        if(s.match(/[a-z]/i)){ //if a letter
            var $pw = $(this);

            //if shift down && key is lower case, caps lock on
            //if shift up && key is upper case, caps lock on
            if(e.shiftKey? s === s.toLowerCase(): s === s.toUpperCase()){ //caps lock on
                if(!$pw.next().is('.tooltip')) //tool tip not there yet
                    $pw.tooltip('show'); //show it
            }else{ //caps lock off
                $pw.tooltip('hide');
            }
        }
    });
    $pws.on('blur', function(){ //hides if password loses focus
        $(this).tooltip('hide');
    });

    // Add animation on dropdown menu
    $('#navMenu .navbar-nav li.dropdown').click(function() {
      $('#navMenu .navbar-nav li.dropdown .dropdown-menu').hide();  
      $('.dropdown-menu', this).slideToggle("slow");
    });

   $(document).on('click', function(event){
        var dropdown = $('#navMenu .dropdown-menu');
        // if the target of the click isn't the container...
        if (!dropdown.is(event.target) && dropdown.has(event.target).length === 0) // ... nor a descendant of the container
        {
            //Do whatever you want to do when click is outside the element
            $('#navMenu .navbar-nav li.dropdown .dropdown-menu').slideUp("slow");
        }
    });
});

/**
* Defaults for the ajax obj for all the ajax calls
*
* Provides the ability to get progress of upload/download actions -- sample use:
* $.ajax({
*	url : hostServer + '/logs/contents',
*		data: $('#logSelect').serialize() + '&file=' + file,
*		success: function(data){
*			logBrowser.set(data+'\nx\t');
*			$('#viewer #timeline #content').removeClass('hidden');
*		},
*		progress: function(evt){
*			var perc = (evt.loaded/evt.total)*100;
*			browserProgress.set('Downloading log...', perc);
*		}
*	});
*/
var originalXhr = $.ajaxSettings.xhr;
$.ajaxSetup({
	//url: hostServer, //home just in case
	type: 'POST',
	statusCode: statusHandler, //custom error handler from js/errors.js
	xhrFields: {
		withCredentials: true //for server-side sessions
		//also enables talk wit SSL? At least IE doesn't abort ajax calls
	},

	doUploadProgress: false, //set to true if you want progress() to return upload progress.

	xhr: function() {
		var req = originalXhr();
		var that = this;
		if (req) {
			if(typeof req.addEventListener == "function") {
				req.addEventListener("progress", function(evt) {
					if(that.progress) that.progress(evt);
				}, false);
			}
			if(that.doUploadProgress && typeof req.upload.addEventListener == "function") {
				req.upload.addEventListener("progress", function(evt) {
					if(that.progress) that.progress(evt);
				}, false);
			}
		}
		return req;
	}
});

//title casing function
var toProperCase = function(string){
	return string.replace(/\w\S*/g, function(txt){
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
};

//flatten javascript object
JSON.flatten = function(data) {
    var result = {};
    function recurse (cur, prop) {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
             for(var i=0, l=cur.length; i<l; i++)
                 recurse(cur[i], prop + "[" + i + "]");
            if (l == 0)
                result[prop] = [];
        } else {
            var isEmpty = true;
            for (var p in cur) {
                isEmpty = false;
                recurse(cur[p], prop ? prop+"."+p : p);
            }
            if (isEmpty && prop)
                result[prop] = {};
        }
    }
    recurse(data, "");
    return result;
};
//unflatten flattened javascript object
JSON.unflatten = function(data) {
    "use strict";
    if (Object(data) !== data || Array.isArray(data))
        return data;
    var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
        resultholder = {};
    for (var p in data) {
        var cur = resultholder,
            prop = "",
            m;
        while (m = regex.exec(p)) {
            cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
            prop = m[2] || m[1];
        }
        cur[prop] = data[p];
    }
    return resultholder[""] || resultholder;
};


/*
 * Date Format 1.2.3
 * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
 * MIT license
 *
 * Includes enhancements by Scott Trenda <scott.trenda.net>
 * and Kris Kowal <cixar.com/~kris.kowal/>
 *
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 */

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d:    d,
                dd:   pad(d),
                ddd:  dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m:    m + 1,
                mm:   pad(m + 1),
                mmm:  dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy:   String(y).slice(2),
                yyyy: y,
                h:    H % 12 || 12,
                hh:   pad(H % 12 || 12),
                H:    H,
                HH:   pad(H),
                M:    M,
                MM:   pad(M),
                s:    s,
                ss:   pad(s),
                l:    pad(L, 3),
                L:    pad(L > 99 ? Math.round(L / 10) : L),
                t:    H < 12 ? "a"  : "p",
                tt:   H < 12 ? "am" : "pm",
                T:    H < 12 ? "A"  : "P",
                TT:   H < 12 ? "AM" : "PM",
                Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default":      "ddd mmm dd yyyy HH:MM:ss",
    shortDate:      "m/d/yy",
    mediumDate:     "mmm d, yyyy",
    longDate:       "mmmm d, yyyy",
    fullDate:       "dddd, mmmm d, yyyy",
    shortTime:      "h:MM TT",
    mediumTime:     "h:MM:ss TT",
    longTime:       "h:MM:ss TT Z",
    isoDate:        "yyyy-mm-dd",
    isoTime:        "HH:MM:ss",
    isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};