/**
* Populates optiong from the backend server for changing ownership functionality.
* Talks to backend server to change ownerships.
*
* @author Ganna Shmatova
* @version 2.0.0
**/

/**
* Sends the ajax request to change owners. It serialzies the given DOM object,
* and then sends it and the user credentials to the hostServer's /changeowner
* route.
*
* As of this revision, the /changeowner route takes in the keys/'name's:
* oldUserIds, newUserId, policyId
* All of these expect number ids. (oldUserIds expects numbers with delimiter ,)
*
* Changes button to loading state during the wait for ajax.
*
* @param eleIdentifier
*            JQuery string that identifies a form element to seiralize
* @author Ganna Shmatova
*/
function changeOwner(eleIdentifier) {
	var submitBtn = $(eleIdentifier + ' :submit');
	submitBtn.button('loading');

	$.ajax({
		url: '/emm/app/owner',
		data: $(eleIdentifier).serialize(),
		complete: function(){
			submitBtn.button('reset');
		},
		statusCode: $.extend(statusHandler, {
			200: function(errRes, status, res){ //explicite 'success' handler
				var msg = loc.js.changedOwnership;
				displayMsg(msg, res.responseText.replace(/\n/g, "<br/>"), false, null,null,'Ok');
			}
		})
	});
}

/**
* Populates the selects for the policy, the old users & new users. Also adds
* custom event on the change owner form's submit.
*
* Initializes select picker.
*
* @author Ganna Shmatova
*/
$(window).load(function() {
	//inits
	$('.selectpicker').selectpicker();

	//events
	populatePolicyInfo($('#policyId'));

	populateUserInfo([ $('#oldUserIds'), $('#newUserId') ]);

	$('#changeOwnerForm').submit(function(e) {
		e.preventDefault();
		changeOwner('#changeOwnerForm');
	});
});
