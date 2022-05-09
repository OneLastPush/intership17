/**
 * The authorization.js file offers the necessary functions
 * for authentication; they are used to log in, log out, or
 * access a user's credentials.
 *
 * @author Anthony-Virgil Bermejo (2013)
 * @author Ganna Shmatova (2014)
 * @version 2.0.0
 **/

function doLogin(msg, loginPageMsg){ //TODO maybe remove
	if(!msg)
		msg = 'Please log in.';

	if(isOnLogin()){
		displayMsg(loginPageMsg);
	}else{
		//save old page
		$.session.set('loc', $(window.location).attr('href'));
		//set up error msg
		$.session.set('loginErr', msg);
		$(window.location).attr('href', 'login.html'); //redirect
	}
}