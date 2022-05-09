/**
* Give it log data, it makes you a DOM element with a log browser.
* 
* var logBrowser = new LogBrowser();
* $('div').append(logBrowser.container);
* logBrowser.set(data); //where data is string.
* //data is parsed into 4 categories -- date, category, type, & details.
* 
* Options:
* {
*	defaultZoom: 2,
*	parseRegex: /^([\d\/ :.]+)\t\((\d+)\)\t(\[.+\])\t([\s\S]*?)\n?(?=^.+\t)/gm,
*	loc: {
*		filter: 'Filter',
*			categoryLabel: 'processes',
*			noFileSelected: 'No file selected',
*			noLogFileSelected: 'No log file selected',
*			emptyLogFile: 'This log file is empty'
*	}
*}
*
* Requires:
*	Bootstrap 3
*	JQuery
*	JQueryUI (with slider)
* 
* @param option/settings object. Optional.
* @version 1.0.2
* @author Ganna Shmatova
*/
function LogBrowser(options){
	var browser = this;
	var opts = $.extend(true, {
		defaultZoom: 2,
		parseRegex: /^([\d\/ :.]+)\t\((\d+)\)\t(\[.+\])\t([\s\S]*?)\n?(?=^.+\t)/gm,
		loc: {
			filter: 'Filter',
			categoryLabel: 'processes',
			noFileSelected: 'No file selected',
			noLogFileSelected: 'No log file selected',
			emptyLogFile: 'This log file is empty'
		}
	}, options);

	var logData;
	var $container = $('<div>');
	var $errMsg = $('<h3>',{'class': 'page-header', text: opts.loc.noFileSelected});
	//build layout
	var $times = $('<ul>',{
		"class": "nav nav-pills nav-stacked max-height-400 overflow col-sm-3 col-xs-5"
	});
	var $filter = $('<ul>', {
		"role": "menu",
		"class": "dropdown-menu dropdown-menu-right"
	});
	var $categories = $('<div>',{
		id: 'categories',
		"class":"no-padding col-sm-3 col-xs-7 max-height-400 overflow"
	});
	var $details = $('<div>',{
		"class": "col-sm-6 col-xs-12 max-height-400 overflow"
	});
	var $detailsTime = $('<div>');

	build();
	function build(){
		var $header = $('<div>', {
			"class":"col-xs-12 verticalMargins no-padding"
		});
		//slider
		var $sliderContainer = $('<div>',{
			"class": "col-sm-3 col-xs-5 medium-padding"
		});
		var $slider = $('<div>');
		$slider.slider({
			max: 5,
			value: opts.defaultZoom,
			change: function(){
				makeTimes($(this).slider('value'), true);
			}
		});
		$sliderContainer.append($slider);
		$header.append($sliderContainer);
		//filter dropdown button
		var $dropdown = $('<div>',{
			"class":"dropdown col-sm-3 col-xs-7"
		});
		var $filterBtn = $('<div>',{
			"class": "btn btn-default dropdown-toggle col-xs-12",
			"data-toggle":'dropdown',
			text: opts.loc.filter + ' ' + opts.loc.categoryLabel + ' '
		});
		$filterBtn.append($('<span>', {"class": "caret"}));
		$dropdown.append($filterBtn);
		$dropdown.append($filter); //filter items
		$header.append($dropdown);

		$container.append($errMsg);
		$container.append($header);

		$container.append($times);

		$container.append($categories);

		$container.append($details);

		doErr(opts.loc.noLogFileSelected);
	}

	//utilities
	var dilate = [
		function seconds(date){	return date.substr(0, date.length - 4);	},
		function minutes(date){	return date.substr(0, date.length - 7);	},
		function hours(date){ return date.substr(0, date.length - 10) + ':00'; },
		function days(date){ return date.substr(0, date.length - 13); },
		function month(date){ return date.substr(0, date.length - 13).replace(/\/\d{2}\//, ' '); },
		function year(date){ return date.substr(6, date.length - 19); }
	];

	//DOM events
	var timesClickFn = function(){
		$(this).siblings().removeClass('active');
		$(this).addClass('active');
		makeContent($(this).data('events'));
	};
	var categoryClickFn = function(){
		var children = $(this).children();
		children.toggleClass('fa-minus-square-o');
		children.toggleClass('fa-plus-square-o');
		$(this).next().collapse('toggle');
	};
	var eventClickFn = function(){
		$(this).siblings().removeClass('active');
		$(this).addClass('active');
		makeDetails($(this).data('event'));
	};

	var dropdownFixFn = function(e){
		e.stopPropagation();
	};

	var clickChildCheckFn = function(){
		$(this).find('input[type="checkbox"]').trigger('click');
	};

	//fills times & activates
	function makeTimes(timeDilation, dontActivate){
		if(!timeDilation && timeDilation !== 0) timeDilation = opts.defaultZoom;

		$times.off().empty();

		var events = [];
		var li;
		var date;
		var nextDate;
		for(var i=0; i<logData.length; i++){
			events.push(i); //record event id
			date = dilate[timeDilation](logData[i].date);
			nextDate = i+1 == logData.length? '' : dilate[timeDilation](logData[i+1].date);
			if(nextDate !== date){ //if next date not same time
				li = $('<li>'); //make the events
				li.data('events', events);
				li.append($('<a>',{	text: date }));
				li.on('click', timesClickFn);
				$times.append(li);

				//reset
				events = [];
			}
		}

		if(!dontActivate)
			$times.children('li:first').trigger('click');

		if($times.children().length === 0)
			doErr(opts.loc.emptyLogFile);
	}

	function makeContent(events){
		//rebuilds filter
		$filter.off().empty();

		var event;
		var types = [];
		for(var i=0; i<events.length; i++){
			event = logData[events[i]];
			if(types.indexOf(event.event) < 0) //new event type?
				types.push(event.event); //record as filterable type
		}

		var filterChangeFn = function(e){
			filterEvents(events);
		};

		var $li;
		var $a;
		var $check;
		for(i=0; i<types.length; i++){
			$li = $('<li>');
			$a = $('<a>');
			$a.on('click', dropdownFixFn);
			$a.on('click', clickChildCheckFn);
			$li.append($a);

			$check = $('<input>',{
				name: types[i],
				type: "checkbox",
				checked: true
			});
			$check.on('change', filterChangeFn);
			$a.append($check);

			$a.append(' ' +types[i]);

			$filter.append($li);
		}

		filterChangeFn(); //makes filtered events
	}

	function filterEvents(events){
		$categories.off().empty();

		//get filter settings
		var checks = $filter.find('input').serializeArray();
		var filtered = [];
		for(var i=0; i<checks.length; i++)
			filtered.push(checks[i].name);

		var event;
		//categories
		var categories = {};
		for(i=0; i<events.length; i++){
			event = logData[events[i]];
			//apply filter
			if(filtered.indexOf(event.event) >= 0){
				//make category if DNE
				if(!categories[event.category])
					categories[event.category] = [];
				categories[event.category].push(events[i]); //save index
			}
		}

		makeEvents(categories);
	}
	function makeEvents(categories){
		var header;
		var list;
		var li;
		for(var category in categories){
			header = $('<h5>');
			header.append($('<span>',{
				"class":"fa fa-plus-square-o medium-padding"
			}));
			header.on('click', categoryClickFn);
			header.append(category);

			list = $('<ul>',{
				"class": "nav nav-pills nav-stacked collapse"
			});
			var events = categories[category];
			for(i=0; i<events.length; i++){
				li = $('<li>');
				li.append($('<a>',{
					text: logData[events[i]].event
				}));
				li.data('event', events[i]);
				li.on('click', eventClickFn);
				list.append(li);
			}

			$categories.append(header);
			$categories.append(list);
		}
	}

	function makeDetails(event){
		$details.off().empty();
		var data = logData[event];

		var $date = $('<small>',{
			text: data.date,
			"class": "col-xs-12 text-right"
		});
		var $header = $('<div>', {"class": "row verticalMargins"});
		$header.append($date);

		var $body = $('<div>', {
			html: data.details.replace(/\n/g, '<br>'),
			"class": 'col-xs-12'
		});

		$details.append($header);
		$details.append($body);
	}

	function doErr(error){
		$container.children().addClass('hidden');
		$errMsg.text(error);
		$errMsg.removeClass('hidden');
	}

	this.set = function(data){
		logData = []; //clear old
		//clear errors
		$container.children().removeClass('hidden');
		$errMsg.addClass('hidden');

		//parse
		var parser = opts.parseRegex;
		var result;
		while((result = parser.exec(data))){ //make new
			logData.push({
				"date": result[1],
				"category": result[2],
				"event": result[3],
				"details": result[4]
			});
		}
		makeTimes();
	};

	this.container = $container;
}
