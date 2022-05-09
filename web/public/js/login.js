/**
* Login functionality.
*
* @author Ganna Shmatova
* @version 2.0.1
*/

$.ajax({
	url: '/license',
	success: function(data){
		$('#licenseWarning > #days').html(data);
		if(data <= 14)
			$('#licenseWarning').removeClass('hidden');
	}
});
/**
* Ajax requests the server to authenticate the provided form's username and password.
* If it is successfuly, it puts the username in session (local cookie) data
* and redirects to a page of your choice.
*
* @param eleIdentifier
*		The jQuery strign that identifies a form that will be serialized.
* @param redirect
*		The url to redirect to after logging in.
* @author Ganna Shmatova
*/
function loginUser(eleIdentifier, redirect){
	//custom errror msg
	statusHandler[401] = function(errRes, status, res){
		displayMsg('', errRes.responseText.replace(/\n/g, "<br/>") + ' <a href="login_reset.html">' + loc.js.resetPassword + '</a> ' + loc.js.resetDisclaimer);
	};
	statusHandler[429] = function(){
		$('.g-recaptcha').show();
	};
	statusHandler[0] = function(errRes){
		displayMsg('', errRes.responseText.replace(/\n/g, "<br/>"));
	};

	$.ajax({
		url: '/login',
		data: $(eleIdentifier).serialize(),
		success: function(data){
			$.session.set('username', data.user || $(eleIdentifier + ' #username').val());
			$.session.set('ibmMarketingUser', data.ibmMarketingUser || $(eleIdentifier + ' #username').val());
			$(location).attr('href', redirect);
		},
		statusCode: statusHandler
	});
}

/**
* Overrides the old displayMsg that would display errors.
* This func displays the msgs in red text in a div called #errorSpace.
*
* @param msg Strig to display
* @author Ganna Shmatova
*/
function displayMsg(msg, res){
	if(res)
		msg += '<br>' + res;
	$('#errorSpace').html(msg);
}

/**
* Adds an event to #loginForm to validate required fields, and if they're filled
* it calls loginUser with the intent to redirect to the page they were
* trying to look at, or session_manager.html.
*
* Also fills any errors from loginErr key in session obj, and clears that error session key.
*
* Also adds customized error msg for this page when user is not authorized.
*
* @author Ganna Shmatova
*/

$(window).load(function(){
	//sets error if one was attached to session, then clears cookie
	if($.session.get('loginErr')){
		displayMsg('', $.session.get('loginErr'));
		$.session.remove('loginErr');
	}
	//adds event to form
	var form = '#loginForm';
	$(form).submit(function(e){
		e.preventDefault();
		if(isRequiredFilled(form)){
			loginUser(form, $.session.get('loc')? $.session.get('loc'): 'dashboard.html');
		}
	});
});
