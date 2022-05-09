/**
* Inbound trigger form, popup & ajax call functionality.
*
* Requires:
* 	- Bootstrap 3
*	- JQuery
*	- displays.js (doAlert)
*
*
* new InboundTrigger(pid);
* // where pid is pid of a running flowchart
* //will display a popup box with trigger to what and trigger what forms.
*
* $('#something').append(new InboundTrigger());
* // will display a full form for triggering a flowchart, campaign, or all campaigns,
* // & what the trigger is
*
* @version 1.0.0
* @author Ganna Shmatova
*/
function InboundTrigger(pid, cb){
	var $container = $('<form>',{
		'role': 'form',
		'class': 'form-horizontal max-width-600 center-block'
	});
	var msAlert = $('<div>',{
		class: 'form-group pre-scrollable '
	});
	msAlert.hide();

	var $type, $toWhom, $trigger;
	var $whomLabel;
	var $whomRow;

	(function(){
		function makeFormGroup(labelName, input){
			var $grp = $('<div>',{
				'class':'form-group'
			});
			var $lbl = $('<label>',{
				'class': 'col-xs-12',
				text: labelName
			});
			var $two = $('<div>',{
				'class': 'col-xs-12'
			});
			$two.append(input);
			$grp.append($lbl, $two);
			return $grp;
		}

		$type = $('<select>',{
			'class': 'form-control selectpicker',
		});
		$container.append(makeFormGroup(loc.js.trigger.broadcastTo, $type));

		$toWhom = $('<input>',{
			'type': 'text',
			'class': 'form-control'
		});
		$whomRow = makeFormGroup(loc.js.trigger.cCodeOrName, $toWhom);
		$container.append($whomRow);
		$whomLabel = $whomRow.find('label');

		$trigger = $('<input>',{
			'type': 'text',
			'class': 'form-control'
		});
		$container.append(makeFormGroup(loc.js.trigger.cCodeOrName, $trigger));

		var $btn = $('<button>',{
			'class': 'btn btn-default pull-right sideMargins',
			'text': loc.js.trigger.broadcast,
			'type': 'button'
		});
		var $grp = $('<div>', {'class': 'form-group'});
		$grp.append($btn);
		$container.append($grp);
		$container.append(msAlert);

		//events
		$btn.on('click', function(){
			var type = $type.val();
			//clear errors
			$container.find('.has-error').removeClass('has-error');

			//trigger empty check
			if($trigger.val().length < 1)
				$trigger.parents('.form-group:first').addClass('has-error');

			if(type == '*'){
				if($container.find('.has-error').length === 0)
					callBroadcast($trigger.val(), null, '*');
			}else{
				//whom empty check
				if($toWhom.val().length < 1)
					$toWhom.parents('.form-group:first').addClass('has-error');

				if($container.find('.has-error').length === 0){
					if(type == 'flowchart')
						callBroadcast($trigger.val(), $toWhom.val());
					else
						callBroadcast($trigger.val(), null, $toWhom.val());
				}
			}

		});
		$type.on('change', function(){
			var type = $(this).val();
			if(type == '*'){
				$whomRow.addClass('hidden');
			}else{
				$whomRow.removeClass('hidden');
				if(type == 'campaign'){
					$whomLabel.text(loc.js.trigger.campaignCode);
				}else{
					$whomLabel.text(loc.js.trigger.flowchartName);
				}
			}
		});

		if(pid){ //popup gui
			var solo = true; //check status if only campaign's running flowchart
			$.ajax({
				url: '/emm/app/status',
				dataType: 'json',
				success: function(res){
					//processing flowchart data
					var flowchart;
					for(var i=0; i<res.length; i++){
						if(res[i].pid == pid){
							flowchart = res[i];
							break;
						}
					}
					if(!flowchart)
						return modal.make({
							msg: loc.js.trigger.noFlowchart
						});

					var campaignCode = flowchart.campaign_code;
					var flowcharts = [];
					for(i=0; i<res.length; i++){
						if(res[i].campaign_code == campaignCode){
							flowcharts.push(res[i]);
						}
					}

					//what options can we give user based on this flowchart?
					$type.append($('<option>',{
						value: 'flowchart',
						text: loc.js.trigger.aFlowchart
					}));
					if(flowcharts.length > 1){
						$type.append($('<option>',{
							value: 'campaign',
							text: loc.js.trigger.wholeCampaign
						}));
					}

					//autofill form with flowchart data on type change
					$type.on('change', function(){
						if($(this).val() == 'flowchart'){
							$toWhom.val(flowchart.flowchart_name);
						}else{
							$toWhom.val(flowchart.campaign_code);
						}
					});
					$toWhom.prop('disabled', 'true');

					//init
					$type.trigger('change');
					$container.find('.selectpicker').selectpicker();

					modal.make({
						titleText: loc.js.trigger.broadcastInboundTrigger,
						msg: $container
					});
				}
			});
		}else{ //form gui
			//has all campaigns select & whole campaign & flowchart
			$type.append($('<option>',{
				value: '*',
				text: loc.js.trigger.allCampaigns
			}));
			$type.append($('<option>',{
				value: 'campaign',
				text: loc.js.trigger.wholeCampaign
			}));
			$type.append($('<option>',{
				value: 'flowchart',
				text: loc.js.trigger.aFlowchart
			}));

			$type.trigger('change');
			$container.find('.selectpicker').selectpicker();
		}
	})();

	/**
	* @param trigger - trigger name
	* @param flowchart - flowchart name. Optional: choose flowchart or campaign.
	* @param campaign - campaign name or * for all campaigns. Optiona: choose flowchart or campaign.
	*/
	function callBroadcast(trigger, flowchart, campaign){
		var data = {
			triggerMsg: trigger
		};
		if(flowchart) data.flowchartName = flowchart;
		if(campaign) data.campaignCode = campaign;

		var displayErr = function(err){
			var msg = loc.js.trigger.broadcasting + ' <strong>' + trigger +
				'</strong> '+loc.js.trigger.to+' <strong>"' +
				(data.flowchart || data.campaign) +
				'"</strong>:<br><br>' + err.responseText.replace('\n', '<br>');

				msAlert.show();
				msAlert.prepend(doAlert(msg, 'alert-danger', 15 * 60 * 1000));
		};

		$.ajax({
			url: '/emm/app/trigger',
			data: data,
			success: function(res){
				var msg = loc.js.trigger.broadcast + ' <strong>' + trigger +
					'</strong> '+loc.js.trigger.to+' <strong>"' +
					(data.flowchart || data.campaign) +
					'"</strong>.<br><br>' + '<strong>' + res.cmd + '</strong><br><br>' + res.stdout.replace('\n', '<br>').replace('\nTRIGGER', '<br><br>TRIGGER');
				var msgs = msg.replace(/\-{2,}(?=[^-]*$)/g,''); //finds last instance of hyphen(-) character repeating 2 to unlimited times. Replaces what it finds with nothing
				$container.append(doAlert(msgs, 'alert-success', 0));
			},
			statusCode: $.extend(statusHandler, {
				404: displayErr,
				500: displayErr
			}),
			complete: cb
		});
	}
	return $container;
}
