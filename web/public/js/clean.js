/**
* Interfaces with the unica_acclean utility on the server.
*
* Requires:
* 	partition.js for populating the partition select box.
*	formHelpers.js for required fields & validation.
*
* @author Ganna Shmatova
* @version 2.0.0
**/

/**
* Tells server that it wants to have unica_acclean generate an output file
* with the provided criteria (type + optionally, a criteria).
* After the server makes the file, we send another ajax request to retrieve the file contents.
* Puts formatted results into #searchResults as html with <br> instead f \n.
*
* @param callback function that will be called on search complete. Optional.
*/
function search(callback){
	$.ajax({
		url: '/emm/app/clean/generate',
		data: {
			type: $('#type').val(),
			partition: $('#partition').val(),
			criteria: $('#criteria').va()
		},
		success: function(data){
			$.ajax({
				url: '/emm/app/clean/list',
				data: {type: $('#type').val()},
				success: function(data){
					$('#searchResults').html(data.replace(/\n/g, "<br/>"));
				}
			});
		},
		complete: callback
	});
}

/**
* Sends clean command to server. The server will run clean with the previously generated
* file as input data. You can specify logging level.
*
* This method needs partition. It retrieves it from the previous form ('#partition').
*
* @param callback function that will be called on complete. Optional.
*/
function clean(callback){
	$.ajax({
		url: '/emm/app/clean/delete',
		data: {
			type: $('#type').val(),
			partition: $('#partition').val()
		},
		success: function(data){
			displayMsg('', data.replace(/\n/g, "<br/>"));
		},
		complete: callback
	});
}

/**
* Checks type of search you'll be doing.
* If you're looking for orphans, it hides the criteria and datasource input boxes.
* If not, it shows them.
*/
function checkType(){
	if($('#type').val() == 'orphan'){
		$('#criteriaHide').addClass('hidden');
		$('#criteriaHide input').removeClass('required');
	}else{
		$('#criteriaHide').removeClass('hidden');
		$('#criteriaHide input').addClass('required');
	}
}

/**
* Initializes select picker. Adds events for the forms, db sources
* button, and type changing selection.
*/
$(window).load(function(){
	//inits
	$('.selectpicker').selectpicker();
	checkType();

	//ajax form
	var form = 'form#cleanSearch';
	var form2 = 'form#cleanDelete';
	$(form).submit(function(event){
		event.preventDefault();

		if(campaignChecks(function(check){
			if(check && isRequiredFilled(form)){
				var submitBtn = $(form + ' :submit');
				submitBtn.button('loading');
				search(function(){
					submitBtn.button('reset');
					$(form2 + ' :submit').prop('disabled', false); //enables Clean files btn
				});
			}
		}));
	});
	$(form2).submit(function(event){
		event.preventDefault();

		modal.make({
			'titleText': loc.js.areYouSure,
			'msg': loc.js.areYouSureMsg + $('#searchResults').parent().html(),
			closeBtn: false,
			btns: [{
				name: loc.js.yes,
				action: function(){
					var submitBtn = $(form2 + ' :submit');
					submitBtn.button('loading');
					clean(function(){
						submitBtn.button('reset');
					});
				}
			},{
				name: loc.js.no
			}]
		});
	});

	//type selection hides database sources and search criteria if orphans is selected
	$('#type').on('change', function(e){
		checkType();
	});
});

function campaignChecks(callback){
	var flowcharts = 0;
	var users = 0;
	var campaign = true;

	var count = 0;
	var doneFn = function(){
		if(++count == 2){
			if(flowcharts > 0 || users > 0 || campaign){
				var msg = loc.js.cleanUpCheckMsg;
				msg += '<br><br><span class="red">';

				var i = 1;
				if(flowcharts > 0) {
					msg += i + '. ' + flowcharts + ' ' + loc.js.currentlyRunning +'<br>';
					i++;
				}
				if(users > 0){
					msg += i + '. ' + users + ' ' + loc.js.currentlyConnected +'<br>';
					i++;
				}
				if(campaign) {
					msg += i + '. ' + loc.js.listenerRunning +'<br>';
					i++;
				}
				msg += '</span><br>';

				msg += loc.js.followSteps + ':<br>(1) ' + loc.js.step1 + '<br>(2) ' + loc.js.step2 + '<br>(3) ' + loc.js.step3;

				modal.make({
					'titleText': loc.js.error,
					'msg': msg,
					btns: [{
						name: loc.js.shutdownCampaign,
						action: function(){
							window.open('start_stop.html');
						}
					}]
				});
				callback(false);
			}else
				callback(true);
		}
	};

	$.ajax({
		url: '/emm/app/status',
		dataType: 'json',
		success: function(data){
			data.forEach(function(d){
				if(d.section == 'client'){
					users++;
				}else{
					flowcharts++
				}
			});
		},
		complete: doneFn,
		statusCode: {500: function(){}}
	});
	pingCampaign('', function(state){
		campaign = state;
		doneFn();
	});
}
