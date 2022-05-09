/**
* Requires:
*	FormHelpers.js
* 
* @author Ganna Shmatova
*/

$(window).load(function(){
	var query = queryString.parse(window.location.search);
	var token = query.token;
	var user = query.user;
	if(token&&user){ //if token & username in url, must be redirecting for a password reset
		$('input[name="token"]').val(token); //auto fill the values
		$('input[name="username"]').val(user);
		$('a[href="#reset"]').tab('show'); //show reset tab
	}

	//attach send email event
	attachSendFormEvent($('input[type="button"][value="Send reset email"'), '/login/reset/token', loc.js.successfullySentEmail);
	//attach send change password event
	attachSendFormEvent($('input[type="button"][value="Change password"'), '/login/reset/pw', loc.js.successfullyChangedEmail, function(form){
		//validator to see if the password confirm input value matches the password input value
		var pws = form.find('input[type="password"]');
		if($(pws[0]).val() === $(pws[1]).val())
			pws.removeClass('error-background');
		else
			pws.addClass('error-background');
		return !pws.hasClass('error-background');
	});
});

/**
* Attaches ajax event to button click.
* Sends the form that encompasses the button click to the relative url link.
* Ajax event puts button into load state until we get a reply.
* 
* @param btn JQuery button object
* @param url for the ajax call (ei, '/place/here'. it is relative)
* @param successMsg message to display upon success repyl from ajax url
* @param validateFn optional function that is given the form and & expected to return true or false.
*	If false, the ajax is not called.
*/
function attachSendFormEvent(btn, url, successMsg, validateFn){
	btn.on('click', function(){
		var form = btn.parents('form:first');
		if(isRequiredFilled(form) && (!validateFn || validateFn(form))){
			btn.button('loading');
			$.ajax({
				url: hostServer + url,
				data: form.serialize(),
				success: function(){
					var outputer = form.find('.msgs');
					outputer.removeClass('text-danger');
					outputer.addClass('text-success');
					outputer.text(successMsg);
				},
				complete: function(){
					btn.button('reset');
				}
			});
		}
	});
}

/**
* Override for modla popups.
* Displays the message as error message in the active tab-pane's .msgs div.
*/
function displayMsg(msg, res){
	if(res)
		msg += '<br>' + res;
	var outputer = $('.tab-pane.active').find('.msgs');
	outputer.removeClass('text-success');
	outputer.addClass('text-danger');
	outputer.html(msg);
}