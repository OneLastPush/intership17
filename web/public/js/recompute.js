/**
* Functionality for recomputing. Also has progress bar and access
* to logs of multi recompute runs.
*
* Requires:
* 	partition.js for populating the partition select box.
*	formHelpers.js for decoding URL GET data & validating.
* 	fileChecker.js for validating if the recompute file path exists
*	varDatabases.js for database source selection
*
* @author Ganna Shmatova
* @version 2.0.0
**/

var progUpdater; //timeout variable so I can turn it off and on

//for autofills for anything that was sent in through a get
var query = queryString.parse(window.location.search);
var filePath = query.file;
var partition = query.partition;

/**
* Takes an HTTP response or a string, changes \n to <br>, and
* bolds & colors error & success messages.
* @param res HTTP res object or a string to parse
* @return edited string
*/
function getResLog(res){
	if(res.responseText)
		res = res.responseText;
	res = res.replace(/\n/g, "<br/>");
	res = res.replace(/(error \d+)/ig, '<strong class="text-danger">$1</strong>');
	res = res.replace(/(success[a-z]+)/ig, '<strong class="text-success">$1</strong>');
	return res;
}

/**
* General recompute command ajax.
* Puts the submit button into a loading state.
* Has custom status handling that it displays in a log box.
* If fileType was 'acat' it waits 5 secodns and queries
* the progressUpdater.
*
* @param JQuery obj designating the form
*/
function recompute($form){
	nameNumerate($form.find('#datasList input'), 3);

	var submitBtn = $form.find(' :submit');
	submitBtn.button('loading');

	var custStatuser = {};

	$.extend(custStatuser, statusHandler);

	custStatuser = {
		200 : function(errRes, status, res){
			var msg = 'Successfuly recomputed';
			displayLog(msg, getResLog(res));
		},
		400 : function(errRes, status, res){
			var msg = 'A webserver error has occurred...';
			displayLog(msg, getResLog(errRes));
		},
		500 : function(errRes, status, res){
			var msg = 'A utility error has occurred...';
			displayLog(msg, getResLog(errRes));
		},
		404 : function(errRes, status, res){ //probably will never happen
			var msg = 'Missing data';
			displayLog(msg, getResLog(errRes));
		}
	};

	$.ajax({
		url: hostServer + '/recompute',
		data: $form.serialize(),
		complete: function(){
			submitBtn.button('reset');
		},
		statusCode: custStatuser
	});

	if($('#file').val() == 'acat'){ //if doing multiple files
		setTimeout(function(){
			getRecomputeProgress(); //do progress bar
			getRecomputeDate(); //update recomputeAll date on this page
		}, 5000);
	}

	nameDenumerate($form.find('#datasList input'));
}

/**
* Sets the last recompute all date to #lastRecomputeAllTime text
*/
function getRecomputeDate(){
	$.ajax({
		url: hostServer + '/recompute/meta',
		data: "date=yes",
		success: function(data){
			$('#lastRecomputeAllTime').text(data);
		}
	});
}
/**
* Updates the progress bar with the recompute progress amount it gets from the server.
* The progressbar is hidden if it isn't between 0 and 100 (exclusive).
* Function makes sure there is no other progUpdater running, then sets timeout of
* 2500 miliseconds until this function calls itself to update the progress bar again.
*/
function getRecomputeProgress(){
	$.ajax({
		url: hostServer + '/recompute/meta',
		success: function(data){
			var bar = $('#recomputeProgress');
			$('.progress').removeClass('hidden');
			bar.text(data);
			bar.css('width', data);
			var num = parseFloat(data);
			if(num > 0 && num < 100){
				if(progUpdater){
					clearTimeout(progUpdater);
					fillRecomputeLog();
				}
				progUpdater = setTimeout(getRecomputeProgress, 2500);
			}else{
				$('.progress').addClass('hidden');
			}
		}
	});
}

/**
* Fetches the recompute log from the last recompute all run.
* On success, does callback (same params as jquery.ajax success)
* @param callback Function(data) called when logs successfulyl retrieved.
*/
function getRecomputeLog(callback){
	$.ajax({
		url: hostServer + '/recompute/log',
		success: callback
	});
}

function fillRecomputeLog(){
	getRecomputeLog(function(log){
		$('#recomputeAllLog').html(getResLog(log));
		$('#allMore').collapse('show');
	});
}

function fillFiles(cb){
	var fileType = $('#fileType').val();
	var partition = $('#partition').val();
	if(!fileType || !partition)
		return;

	var url = hostServer + '/campaign/find/';
	if(fileType.match(/catalog/i)){
		url += 'catalog';
	}else if(fileType.match(/flowchart/i)){
		url += 'flowchart';
	}else if(fileType.match(/session/i)){
		url += 'session';
	}else{
		if(cb && typeof cb == 'function')
			cb();
		return;
	}

	var $file = $('#file');
	$file.empty();
	$.ajax({
		url: url,
		dataType: 'json',
		data: {partition: partition},
		success: function(data){
			data.forEach(function(opt){
				$file.append($('<option>',{
					text: opt
				}));
			});
			//fill with given file from GET (if any)
			if(filePath){
				$file.val(filePath);
				filePath = undefined;
			}
			$file.selectpicker('refresh');
			if(cb && typeof cb == 'function')
				cb();
		}
	});
}

/**
* Initializes (autofills, gets data from server, starts selectpicker)
* Adds events (database soruce functions, fileType hides filePath sometimes,
* show more logs loads logs from server on clickW).
*
*/
$(window).load(function(){
	//inits
	getRecomputeDate();
	getRecomputeProgress();

	//events
	//db sources
	$('#addDatabase').click(function(){
		addDatabase('#datasourceDetails #datasList');
	});

	//ajax form
	var $form = $('form#recompute');
	$form.submit(function(event){
		event.preventDefault();
		recompute($form);
	});

	//show more logs for recompute all
	$('#lastRecomputedAllDesc').on('click', function(e){
		if($('#allMore').hasClass('in')){ //if open
			$('#allMore').collapse('hide');
			$('#chev').removeClass('fa-chevron-up');
			$('#chev').addClass('fa-chevron-down');
		}else{ //if closed
			$('#chev').removeClass('fa-chevron-down');
			$('#chev').addClass('fa-chevron-up');
			fillRecomputeLog();
		}
	});

	//file type selection event
	$('#fileType').on('change', function(e){
		if($('#fileType').val() == 'acat'){
			$('#pathInput').addClass('hidden');
			$('#pathInput input').removeClass('required');
		}else{
			$('#pathInput').removeClass('hidden');
			$('#pathInput input').addClass('required');
			fillFiles();
		}
	});

	$('#partition').on('change', fillFiles);

	if(filePath){
		var $fileType = $('#fileType');
		var $file = $('#file');

		//check if path is
		if(filePath.match(/^[\/\\]?campaigns/i)){ //campaigns
			$fileType.val('Flowchart file');
		}else if(filePath.match(/^[\/\\]?sessions/i)){ //sessions
			$fileType.val('Session file');
		}else if(filePath.match(/^[\/\\]?catalogs/i)){ //catalogs
			$fileType.val('Catalog file');
		}
		$fileType.trigger('change');
	}
	if(partition !== null) $('#partition').val(partition);

	$('.selectpicker').selectpicker('refresh');
	//$('.selectpicker').selectpicker('mobile');
});
