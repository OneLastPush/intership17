/**
* Does an ajax request to hostServer to get the available Campaign policies. It
* then populates the given select with them: The value is the policy id
* (number), the text/display value is the polcy's display name
*
* Refreshes selectpickers, as well.
* 
* @param policySelect JQuery representation of a select DOM object
* @param useNameAsValue boolean. If true, uses DISPLAY_NAME of policy as value instead of the ID.
* @author Ganna Shmatova
*/
function populatePolicyInfo(policySelect, useNameAsValue) {
	$.ajax({
		url : '/emm/app/db/policies',
		dataType : 'json',
		success : function(data) {
			for (var i = 0; i < data.length; i++) {
				policySelect.append($('<option>', {
					value : useNameAsValue? data[i].DISPLAY_NAME: data[i].ID,
					text : data[i].DISPLAY_NAME
				}));
			}

			$('.selectpicker').selectpicker('refresh');
		}
	});
}
