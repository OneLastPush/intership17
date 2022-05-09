var emm = require('../emm');
var db = require('../db');

module.exports = function(campaignCode, flowchartName, triggerMsg, cb){
	if(campaignCode){
		db.validateCampaignCode(campaignCode, function(err, valid){
			if(err)
				return cb(err);
			if(valid){
				emm.call('unica_actrg', [campaignCode, triggerMsg], {}, cb);
			} else {
				cb(new Error('Invalid campaign code.'));
			}
		});
	}
	else if(flowchartName){
		db.validateFlowchartName(flowchartName, function(err, valid){
			if(err)
				return cb(err);
			if(valid){
				emm.call('unica_actrg', ['-n', flowchartName, triggerMsg], {}, cb);
			} else {
				cb(new Error('Invalid flowchart name.'));
			}
		});
	}
};