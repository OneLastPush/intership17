/**
* Server pinging, start, stop, restart fucntionality/form.
* Optional Emergency shutdown button.
* Optional connection form (host name, port, if SSL checkbox)
*
* Requires:
* 	Bootstrap 3
* 	Displays.js
*	Progress.js
*
*
* @param parent JQuery element to add the Server to.
* @param fns {
*		ping: function(data, cb){ cb(result, error); }, //if error, assumes missing server
*		start: function(data, stopPinging, nextFn, progressBar){}, //aka, form data, errFn, successFn, progressBar if given any
*		stop: function(data, stopPinging, nextFn, progressBar){},
*		forceStop: function(data, stopPinging, nextFn, progressBar){},
*		onPingSet: function(state){}
*	}
* @param opts {
*		"name": "Server Name",
*		connectForm: false //if you want to show the hostname, port, SSL connection form.
*		progressBar: null // if set, uses it as a progress bar
*	}
* @version 1.2.2
* @author Ganna Shmatova
*/
function Server(parent, fns, opts){
	var server = this;
	server.fns = $.extend({
		ping: function(callback){ callback(true, null); },
		start: null,
		stop: null,
		forceStop: null,
		onPingSet: function(state){}
	}, fns);
	opts = $.extend({
		"name": "Server",
		connectForm: false,
		progressBar: null
	}, opts);
	var $title;
	server.active = true;

	buildGUI();

	//build html
	function buildGUI(){
		server.container = $('<div>', {
			'id': 'server',
			"class":"col-xs-12 col-sm-6"
		});
		parent.append(server.container);

		var temp, temp2;

		$title = $('<h3>', {
			html: opts.name,
			"class":"page-header large-margin"
		});
		server.container.append($title);

		if(opts.connectForm){
			var form = $('<form>',{
				"class":"col-xs-offset-1 col-xs-10"
			});
			server.container.append(form);

			temp = $('<div>', {
				"class":"row"
			});
			form.append(temp);
			temp.append($('<input>', {
				type: 'text',
				name: 'servername',
				placeHolder: loc.js.hostname,
				"class": "col-xs-8 small-padding small-margin"
			}));
			temp.append($('<input>', {
				type: 'text',
				name: 'port',
				placeHolder: 'Port',
				"class": "col-xs-3 small-padding small-margin"
			}));

			form.append((temp = $('<div>', {
				"class":"row"
			})));

			temp.append((temp = $('<div>', {
				"class":"col-xs-12"
			})));
			temp.append($('<input>',{
				type: 'checkbox',
				id: 'ssl',
				name: 'ssl'
			}));
			temp.append($('<label>', {
				'for':'ssl',
				text: loc.js.sslconnection,
				'class': 'left-padding checkbox-inline'
			}));
		}

		var pinger = $('<h3>', {
			"class": "col-xs-offset-1 col-xs-10"
		});
		server.container.append(pinger);
		temp = $('<div>',{
			"class": "col-xs-4 col-xs-offset-2 text-center"
		});
		temp.append($('<span>',{
			"class": "fa fa-dot-circle-o darken-color",
		}));
		pinger.append(temp);
		temp = $('<div>',{
			"class": "col-xs-6 col-sm-5"
		});
		temp2 = $('<div>',{
			text: 'Ping',
			"class": "btn btn-default col-xs-12"
		});
		temp2.on('click', function(){ ping(); });
		temp.append(temp2);
		pinger.append(temp);

		var btns = $('<div>', {
			"class": "col-xs-12"
		});
		server.container.append(btns);
		if(server.fns.start && server.fns.stop)
			btns.append(makeBtnRow('Restart', function(){ restart(); }));
		if(server.fns.stop)
			btns.append(makeBtnRow('Shutdown', function(){ stop();}));
		if(server.fns.forceStop)
			btns.append(makeBtnRow('Emergency Shutdown', function(){ forceStop(); }));
		if(server.fns.start)
			btns.append(makeBtnRow('Start', function(){ start();}));
		if(opts.progressBar)
			server.container.append(opts.progressBar.container);
	}
	function makeBtnRow(name, fn){
		var div = $('<div>',{
			"class":'hidden'
		});
		var row = $('<div>',{
			'class': 'row verticalMargins'
		});
		var btn = $('<div>',{
			text: name,
			"class": "btn btn-default col-xs-offset-1 col-xs-10 col-sm-offset-3 col-sm-6"
		});
		btn.on('click', fn);
		row.append(btn);
		div.append(row);
		return div;
	}

	//updating html
	function updateGUI(pingState){
		//ping icon
		var color = pingState? 'green': pingState===false? 'red': 'orange';
		var ping = server.container.find('.fa-dot-circle-o');
		ping.removeClass('red green orange darken-color');
		ping.addClass(color);


		if(color==='green'){
			ping.attr('data-title',loc.js.tooltipgreen);
	   		ping.tooltip({
				  title: function(){
				    return $(this).attr('data-title');
				  }
			});
		}else {if(color==='red'){
			ping.attr('data-title',loc.js.tooltipred);
			ping.tooltip({
				  title: function(){
				    return $(this).attr('data-title');
				  }
			});
		}else if(color==='orange'){
			ping.attr('data-title',loc.js.tooltiporange);}
			ping.tooltip({
				  title: function(){
				    return $(this).attr('data-title');
				  }
			});
		}


		var start = server.container.find('.btn:contains("Start")').parent().parent();
		if(pingState){
			start.siblings().removeClass('hidden');
			start.addClass('hidden');
		}else if(pingState === false){
			start.siblings().addClass('hidden');
			start.removeClass('hidden');
		}
	}

	//private fns
	function getData(){ //form data
		return server.container.find('form').serialize();
	}

	function ping(doneFn){
		updateGUI();
		server.fns.ping(getData(), function(state, err){
			updateGUI(state);
			if(err){
				$title.append($('<small>',{
					text: loc.js.missing
				}));
				server.container.find('.btn').addClass('disabled');
				server.active = false;
			}
			if(doneFn) doneFn(state, err);
			if(server.fns.onPingSet) server.fns.onPingSet(state);
		});
	}
	function pingUntil(desiredState, nextFn){ //nextFn not followed if server error
		var waiting = false; //only 1 ping ongoing at a time
		var pinging = function(){
			if(!waiting){
				waiting = true;
				ping(function(state, err){
					waiting = false;
					if(err)
						stopPinging();
					else if(state == desiredState){
						stopPinging();
						if(nextFn) nextFn();
					}
				});
			}
		};
		stopPinging();
		server.pinger = setInterval(pinging, 1500);
	}
	function stopPinging(){ //convenience
		clearInterval(server.pinger);
	}

	function start(nextFn){
		ping(function(state){
			if(!state){
				var nextFns = [];
				if(nextFn) nextFns.push(nextFn);
				server.fns.start(getData(), stopPinging, function(nextFn){
					if(nextFn) nextFns.push(nextFn);
				}, opts.progressBar);

				var postStartFns = function(){
					for(var i=0; i<nextFns.length; i++)
						nextFns[i]();
				};

				pingUntil(true, postStartFns);
			}else{
				displayMsg(loc.js.couldnotproceed, opts.name + loc.js.wasalreadyrunning);
			}
		});
	}

	function stop(nextFn){
		ping(function(state){
			if(state){
				var nextFns = [];
				if(nextFn) nextFns.push(nextFn);
				server.fns.stop(getData(), stopPinging, function(nextFn){
					if(nextFn) nextFns.push(nextFn);
				}, opts.progressBar);

				var postStartFns = function(){
					for(var i=0; i<nextFns.length; i++)
						nextFns[i]();
				};
				pingUntil(false, postStartFns);
			}else{
				displayMsg(loc.js.couldnotproceed, opts.name + loc.js.wasalreadyrunning);
			}
		});
	}

	function forceStop(nextFn){
		ping(function(state){
			if(state){
				var nextFns = [];
				if(nextFn) nextFns.push(nextFn);
				server.fns.forceStop(getData(), stopPinging, function(nextFn){
					if(nextFn) nextFns.push(nextFn);
				}, opts.progressBar);

				var postStartFns = function(){
					for(var i=0; i<nextFns.length; i++)
						nextFns[i]();
				};
				updateGUI();
				pingUntil(false, postStartFns);
			}else{
				displayMsg(loc.js.couldnotproceed, opts.name + loc.js.wasalreadyrunning);
			}
		});
	}

	function restart(){
		modal.make({
			"titleText": loc.js.areyousure,
			"msg":loc.js.youareabouttoshutdown + opts.name + loc.js.thisprocesscantaketenfifteenseconds,
			btns: [{
				name: 'Restart',
				action: function(){
					stop(start);
				}
			}]
		}, true);
	}

	//public fns
	server.name = opts.name;
	server.ping = ping;
	server.start = start;
	server.stop = stop;
	server.restart = restart;

	server.disableBtns = function(msg){
		var btns = server.container.find('.btn:contains("Start")').parent().parent().parent().children();
		btns.find('.btn').addClass('disabled');
		btns.tooltip({
			title: msg
		});
	};
	server.enableBtns = function(){
		var btns = server.container.find('.btn:contains("Start")').parent().parent().parent().children();
		btns.find('.btn').removeClass('disabled');
		btns.tooltip('destroy');
	};
}
