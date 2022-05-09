/**
* Queries the server for all the users and their status codes, then calls the
* callback with the user data as the only parameter.
* 
* @param callback that takes in 1 parameter, the user objects array.
*		Each user has ID, NAME, and STATUS
* @author Ganna Shmatova
*/
function getUserInfo(callback) {
	$.ajax({
		url : '/emm/app/db/users',
		dataType : 'json',
		success : function(data) {
			if(callback) callback(data);
		}
	});
}

/**
* Populates given select objects with users. The users are ordered by
* active, disabled, and deleted, each group has its own optgroup title.
* The disabled users have the class .light-gray and deleted have .lighter-gray.
* Refreshes selectpicker.
* 
* @param userSelects array of JQuery select DOM elements
* @param whenDone function to run when done populating everything.
* @param useNameAsValue boolean. If yes value of <option> is user NAME. If no, value is user ID.
* @author Ganna Shmatova
*/
function populateUserInfo(userSelects, whenDone, useNameAsValue){
	if(!userSelects instanceof Array)
		userSelects = [userSelects];
	getUserInfo(function(users){
		//utility method for making an option
		function getOption(user, classes){
			return $('<option>', {
				value: useNameAsValue? user.NAME: user.ID,
				text: user.NAME,
				"class": classes
			});
		}

		//ordered users arrays
		var active = [];
		var disabled = [];
		var deleted = [];
		for (var i = 0; i < users.length; i++) { //ordering users
			switch(parseInt(users[i].STATUS, 10)){
				case 1:	active.push(users[i]); break;
				case 2: disabled.push(users[i]); break;
				case 3: deleted.push(users[i]); break;
			}
		}

		//adds users to GUI
		for (var s = 0; s < userSelects.length; s++) { //for every select given
			var userSelect = $(userSelects[s]);

			//populate with users
			//active
			var optGrp = $('<optgroup>',{
				label: loc.js.userTypes.active
			});
			for (i = 0; i < active.length; i++) {
				optGrp.append(getOption(active[i]));
			}
			userSelect.append(optGrp);

			//disabled
			optGrp = $('<optgroup>',{
				label: loc.js.userTypes.disabled
			});
			for (i = 0; i < disabled.length; i++) {
				optGrp.append(getOption(disabled[i],'light-gray'));
			}
			userSelect.append(optGrp);

			//deleted
			optGrp = $('<optgroup>',{
				label: loc.js.userTypes.deleted
			});
			for (i = 0; i < deleted.length; i++) {
				optGrp.append(getOption(deleted[i], 'lighter-gray'));
			}
			userSelect.append(optGrp);
		}

		if(whenDone) whenDone(); //callback
		$('.selectpicker').selectpicker('refresh');
	});
}
