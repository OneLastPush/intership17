module.exports = function(d){
	describe('trigger', function(){
		var successMsg = 'TRIGGER message delivered to listener process.';
		var triggers = [{
			valid: {
				'campaignCode': d.validCampaignCode,
				'triggerMsg': d.triggerMsg
			},
			invalid: {
				'campaignCode': d.invalidCampaignCode,
				'triggerMsg': d.triggerMsg
			},
			err: 'Campaign code provided cannot be found',
			'desc': 'campagin code'
		},{
			valid: {
				'flowchartName': d.validFlowchartName,
				'triggerMsg': d.triggerMsg
			},
			invalid: {
				'flowchartName': d.invalidFlowchartName,
				'triggerMsg': d.triggerMsg
			},
			err: 'Flowchart name provided cannot be found',
			'desc': 'flowchart name'
		}];
		triggers.forEach(function(trigger){
			describe(trigger.desc, function(){
				it('valid', function(done){
					d.request.post('/'+d.mount+'/app/trigger')
					.send(trigger.valid)
					.expect(200)
					.end(function(err, res){
						if(err)
							throw err;
						var stdout = res.body.stdout;
						var stderr = res.body.stderr;
						if(!res.body.cmd && !res.body.stdout){
							throw new Error('Expected trigger command and standard output are empty');
						}
						else if(stdout.indexOf(successMsg) == -1){
							throw new Error('TRIGGER message was not delivered to listener process');
						}
						else
							done();
					});
				});
				it('invalid', function(done){
					d.request.post('/'+d.mount+'/app/trigger')
					.send(trigger.invalid)
					.expect(404, trigger.err)
					.end(done);
				});
			});
		});
	});
}