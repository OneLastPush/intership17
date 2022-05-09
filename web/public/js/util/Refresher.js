var refresherUniqueness = {};

/**
* Sets up ajax refresher.
* Either provide a fn to refresh, or ajaxOpts.
* Refresher will stop refreshing if ajax returned with an error.
*
* @param rateEleIdentifier JQuery DOM element identifier for an input with val()
* @param fn Function to run to refresh. Either this or ajaxOpts
* @param ajaxOpts Ajax options. Will be extended and yours will 
*	be called after custom. Provide either this or fn.
* 	Optionally takes in an extra param -- getData. Function that should
*	return data value. Will be refreshed every call. (fix for stale data problems)
*	Also can take in canGo function. Shoudl return t or f. If false, refresh won't run getData enabled ajax.
* @author Ganna Shmatova
* @version 1.1.0
*/
function Refresher(rateEleIdentifier, fn, ajaxOpts){
	if(refresherUniqueness[rateEleIdentifier]){
		refresherUniqueness[rateEleIdentifier].stop();
	}

	refresherUniqueness[rateEleIdentifier] = this;

	var context = this;
	this.refresh = function(){
		context.fn(); //load right away

		var rate = $(context.rateEleIdentifier).val();
		rate *= 1000;

		if(context.interval) //it already existed, stop it
			clearInterval(context.interval);

		if(rate && rate > 0) //if valid refresh rate put for refresher cycle
			context.interval = setInterval(context.fn, rate);
	};

	this.start = function(){
		context.refresh(); //trigger first refresh & intervaler cycles
	};

	this.stop = function(){
		clearInterval(context.interval);
	};

	//constructor
	this.fn = fn;
	if(!rateEleIdentifier)
			rateEleIdentifier = '#refreshRate';
	this.rateEleIdentifier = rateEleIdentifier;
	if(ajaxOpts){
		var rajaxOpts = $.extend({}, ajaxOpts);

		rajaxOpts.error = function(xhr, status, err){
			clearInterval(context.interval);
			if(ajaxOpts.error)
				ajaxOpts.error(xhr, status, err);
		};
		this.fn = function(){
			if(ajaxOpts.canGo? ajaxOpts.canGo(): true){
				var override = {};
				if(ajaxOpts.getData)
					override.data = ajaxOpts.getData();
				if(ajaxOpts.getUrl)
					override.url = ajaxOpts.getUrl();
				$.ajax($.extend({}, rajaxOpts, override));
			}
		};
	}

	//add change event
	$(rateEleIdentifier).off();
	$(rateEleIdentifier).on('change', this.refresh);
}