/**
* Log viewing functionalities.
*
* Requires:
*	partitions.js
* 	Searcher.js
*	LogBrowser.js
* 	RawFileViewer.js
* 	LogAnalyzer.js
*
* @author Ganna Shmatova (2014)
* @version 2.1.1
**/

var browserProgress;
var logBrowser;
var rawFileViewer;
var logAnalyzer;
var path;
var searcher;

/**
* Get log types' names.
* @param cb - callback with array of types from server
*/
function getLogTypes(cb){
	$.ajax({
		url: '/apps/logs',
		method: 'post',
		dataType: 'json',
		success: function(apps){
			var logs = [];
			apps.forEach(function(a){
				if(a.logs)
					logs.push(a);
			});
			cb(logs);
		}
	});
}

/**
* Uses backend browse route to get a list of all the files in /log directory
* using partition in #partition.
* Empties & populates #file with <option>s.
*
* @param callback function called at the end of success
*/
function fillLogList(callback){
	$.ajax({
		url : $('#logType').val()+'/logs/list',
		dataType: 'json',
		success : function(data) {
			path = data.dir;
			searcher.setData(data.files);
			if(callback && typeof callback == 'function')
				callback();
		}
	});
}

function fillActiveTab(){
	var file = $('#file .active').text();
	if(!/(\\|\/)$/.test(path))
		path = path + '\\';
	var fullPath = path + $('#file .active').text();
	if(!file){
		rawFileViewer.stop();
		return;
	}
	$('#viewer>.tab-content').removeClass('hidden');
	$('#viewer>.page-header').addClass('hidden');

	if($('#viewer #timeline').hasClass('active')){ //fill timeline
		rawFileViewer.stop();
		$('#viewer #timeline #content').addClass('hidden');

		$.ajax({
			url : $('#logType>option:selected').data('fs')+'/fs/file',
			data: { file: path + '/' + searcher.val() },
			success: function(data){
				logBrowser.set(data+'\nx\t');
				$('#viewer #timeline #content').removeClass('hidden');
			},
			progress: function(evt){
				var perc = (evt.loaded/evt.total)*100;
				browserProgress.set('Downloading log...', perc);
			}
		});
	}else if($('#viewer #analyze').hasClass('active')){
		rawFileViewer.stop();
		$.ajax({
			url : $('#logType>option:selected').data('fs')+'/fs/file',
			data: { file: path + '/' + searcher.val() },
			success: function(data){
				logAnalyzer.set(data+'\nx\t');
				$('#viewer #timeline #content').removeClass('hidden');
			},
			progress: function(evt){
				var perc = (evt.loaded/evt.total)*100;
				browserProgress.set('Downloading log...', perc);
			}
		});

	}else{ //fill raw
		rawFileViewer.start();
		$('#logDownloadBtn').on('click', function(){
			var $form = $('<form>',{
				'action': '/fs/download',
				'method': 'POST',
				'class': 'hidden'
			});
			$form.append($('<input>',{
				'type': 'text',
				'name': 'file',
				'value': fullPath
			}));
			$form.append($('<input>',{
				'type': 'submit',
				'value': 'submit'
			}));
			$('body').append($form);
			$form.submit();
		});
	}
}

/**********************************
* Adds events to various objects.
* Initializes things.
***********************************/
$(window).load(function() {
	searcher = new Searchable({
		placeholder: loc.js.searchForLog,
		noSearchHideItems: true,
		action: fillActiveTab
	});
	$('#file').replaceWith(searcher.$container.attr('id', 'file'));

	logBrowser = new LogBrowser({loc: loc.js.browser});

	logAnalyzer = new LogAnalyzer();

	browserProgress = new Progress({steps:4, progressClass: 'progress-bar-info no-transition'});

	rawFileViewer = new RawFileViewer({
		loc: loc.js.rawFile,
		download: function(){
			//TODO
		},
		refreshCheckFn: function(){
			return $('#file .active').text()? true: false;
		},
		getHead: {
			getUrl: function(){
				return $('#logType>option:selected').data('fs')+'/fs/file';
			},
			getData: function(){
				return {
					action: 'head',
					file: path + '/' + searcher.val()
				};
			}
		},
		getTail: {
			getUrl: function(){
				return $('#logType>option:selected').data('fs')+'/fs/file';
			},
			getData: function(){
				return {
					action: 'tail',
					file: path + '/' + searcher.val()
				};
			}
		},
		getWhole: {
			getUrl: function(){
				return $('#logType>option:selected').data('fs')+'/fs/file';
			},
			getData: function(){
				return {
					file: path + '/' + searcher.val()
				};
			}
		}
	});
	$('#viewer #timeline #progress').append(browserProgress.container);
	$('#viewer #timeline #content').append(logBrowser.container);
	$('#viewer #raw').append(rawFileViewer.container);
	$('#viewer #analyze').append(logAnalyzer.container);

	getLogTypes(function(types){
		var $types = $('#logType');
		types.forEach(function(t){
			var $opt = $('<option>',{
				value: t.mount,
				text: t.name
			});
			$opt.data('fs', t.fs);
			$types.append($opt);
		});
		$('.selectpicker').selectpicker('refresh');

		$('#logType').on('change', function(){
			$('#file').find('input').val('');
			$('#file').find('div').html('');
			checkType();
			fillLogList();
		});

		$('#viewer .nav-tabs').on('shown.bs.tab', fillActiveTab);

		autoFill();
	});
});

function autoFill(){
	var query = queryString.parse(window.location.search);
	var file = query.file;
	var logType = query.logType;
	var partition = query.partition;

	if(partition !== null){
		$('#partition').val(partition);
	}else if(file !== null){ //else, check path for partition
		var match = file.match(/partitions[\/\\]([\s\w\d]+)[\/\\]campaigns/);
		if(match)
			$('#partition').val(match[1]);
	}

	if(logType){
		$('#logType').val(logType);
		checkType();
	}
	fillLogList(function(){ //gets logs
		if(file){ //if file was given through a GET
			file = file.match(/[^\/\\]+$/)[0]; //get last base path/file name
			file = file.replace(/\.ses$/, '.log'); //if was asking for ses file, convert to .log
			searcher.val(file);
			$('.selectpicker').selectpicker('refresh');
		}
	});
}

/**
* Checks the type of log you're looking for. If you're looking for flowchart,
* shows you the partition input. Otherwise, makes it invisible.
* Also only lets you Browse if you're looking at a flowchart
*/
function checkType(){
	if($('#logType').val() == '/emm/app/process'){
		$('#partitionHide').removeClass('invisible');
		$('#browseTab').removeClass('invisible');
	}else{
		$('#partitionHide').addClass('invisible');
		$('#browseTab').addClass('invisible');
		$('#rawTab').trigger('click');
	}
}
