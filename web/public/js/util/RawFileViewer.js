/**
* Utility for viewing raw files.
* var rawFileViewer = new RawFileViewer(options)
*
* Options:
*	{
		refreshCheckFn: null, //function should return false to abort ajax refresher fucntionality
*		getTail: null, //{} ajax options object.
*		getHead: null, //Also takes in getData: function(){return $('x').serialize(); }
*		getWhole: null,
*		download: null, //function(){}
*		loc: {
*			tail: 'End of file',
*			head: 'Beginning of file',
*			whole: 'Whole file',
*			refreshRate: 'Refresh rate (seconds)',
*			lines: 'Lines shown',
*			download: 'Download'
*		}
*	}
* All ajax options object. An extra option is getData.
* Function that returns  a data string (serialized-looking).
*
* //add this to any element
* $('#yourElement').append(rawFileViewer.container);
*
* //controls
* rawFileViewer.start(); //loads file/head/tail. Does autorefresh if applicable.
* rawFileViewer.stop(); //pauses any auto refresh
*
* Requires:
*	Bootstrap 3
*	JQuery
*	Refresher.js
* 	Progress.js
*
*
* @param options object with functions for tail head, & whole file retrieval.
* @version 1.3.2
* @author Ganna Shmatova
*/
function RawFileViewer(options){
	var opts = $.extend(true, {
		refreshCheckFn: null,
		getTail: null,
		getHead: null,
		getWhole: null,
		download: null,
		loc: {
			tail: 'End of file',
			head: 'Beginning of file',
			whole: 'Whole file',
			refreshRate: 'Refresh rate (seconds)',
			lines: 'Lines shown',
			download: 'Download'
		}
	}, options);

	var progressEvt = function(evt){
		var perc = (evt.loaded/evt.total)*100;
		progress.set('Downloading...', perc);
	};

	var getTail = $.extend({
		progress: progressEvt,
		success: function(data){
			$viewer.text(data);
			$viewer.scrollTop($viewer[0].scrollHeight);
		},
		canGo: opts.refreshCheckFn
	}, opts.getTail, {
		getData: function(){
			var data = {};
			if(opts.getTail && opts.getTail.getData())
				data = opts.getTail.getData();
			data.lines = $lines.val();
			return data;
		}
	});
	var getHead = $.extend({
		progress: progressEvt,
		success: function(data){
			$viewer.text(data);
		},
		canGo: opts.refreshCheckFn
	}, opts.getHead, {
		getData: function(){
			var data = {};
			if(opts.getHead && opts.getHead.getData())
				data = opts.getHead.getData();
			data.lines = $lines.val();
			return data;
		}
	});
	var getWhole = $.extend({
		progress: progressEvt,
		success: function(data){
			$viewer.text(data);
		}
	}, opts.getWhole);

	var $container = $('<div>');
	var $viewType;
	var $form;
	var $lines;
	var progress = new Progress({
		progressClass: 'progress-bar-info no-transition',
		hideClass: 'invisible'
	});
	var $viewer;
	build();
	var refresher;

	function loadView(){
		$form.removeClass('invisible hidden-xs');
		var view = $viewType.val();
		if(view == 'tail'){
			refresher = new Refresher('#refreshRate', null, getTail);
			refresher.start();
		}else if(view == 'head'){
			refresher = new Refresher('#refreshRate', null, getHead);
			refresher.start();
		}else{
			$form.addClass('hidden-xs invisible');
			if(refresher) refresher.stop();
			var override = {};
			if(getWhole.getData)
				override.data = getWhole.getData();
			if(getWhole.getUrl)
				override.url = getWhole.getUrl();
			$.ajax($.extend({}, getWhole, override));
		}
	}

	function build(){
		var $temp2 = $('<div>',{
			"class": "col-xs-12 col-sm-6"
		});
		$container.append($temp2);
		//view type
		var $temp = $('<span>');
		$temp2.append($temp);
		$viewType = $('<select>',{
			id: 'viewType',
			"class": "selectpicker no-padding no-margin"
		});
		$viewType.on('change', loadView);
		$temp.append($viewType);
		if(opts.getTail){
			$viewType.append($('<option>',{
				value: 'tail',
				text: opts.loc.tail
			}));
		}
		if(opts.getHead){
			$viewType.append($('<option>',{
				value: 'head',
				text: opts.loc.head
			}));
		}
		if(opts.getWhole){
			$viewType.append($('<option>',{
				value: 'all',
				text: opts.loc.whole
			}));
		}
		$viewType.selectpicker('refresh');

		//progressbar
		$temp = $('<div>',{
			"class":"verticalMargins"
		});
		$temp.append(progress.container);
		$temp2.append($temp);


		$form = $('<div>', {"class":"pull-right"});
		$container.append($form);
		//refresh
		$form.append($('<label>',{
			'for': 'refreshRate',
			text: opts.loc.refreshRate+': ',
			"class": "medium-padding"
		}));
		$form.append($('<input>',{
			id: 'refreshRate',
			type: 'number',
			max: '99',
			min: '1',
			value: '0',
			"class": "small-padding medium-margin pull-right"
		}));
		$form.append($('<div>', {"class":"row"}));//row
		//lines
		$form.append($('<label>',{
			'for': 'lines',
			text: opts.loc.lines+': ',
			"class": "medium-padding"
		}));
		$lines =$('<input>',{
			id: 'lines',
			name: 'lines',
			type: 'number',
			max: '99',
			min: '1',
			value: '20',
			"class": "small-padding medium-margin pull-right"
		});
		$lines.on('change', loadView);
		$form.append($lines);

		$container.append($('<div>', {"class":"row"})); //row

		//textarea
		$viewer = $('<textarea>',{
			rows: 21,
			readonly: true,
			"class": 'col-xs-12 overflow monospace'
		});
		$container.append($viewer);

		var $actions = $('<div>', {"class":"pull-right"});

		if(opts.download){
			var $download = $('<button>',{
				'class': 'btn btn-default'
			});
			$download.append($('<span>',{
				'class': 'fa fa-download'
			}));
			$download.append(' '+opts.loc.download);
			$download.on('click', opts.download);
			$actions.append($download);
		}

		$container.append($actions);
	}

	this.container = $container;
	this.stop = function(){
		if(refresher) refresher.stop();
	};
	this.start = loadView;
	this.clear = function(){
		$viewer.text('');
	};
}
