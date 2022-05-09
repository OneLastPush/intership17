var globalSqlBuilder = {};

/**
 * Runs when the "Test" button is clicked.
 *
 * @param  {Event} event	The event that triggered this function.
 */
function buttonTestClick(event) {
	disableTestButton();
	event.preventDefault();

	g.component.TABLE_NAME = '';
	g.component.QUERY = '';

	// Change button to be unclickable with a loading symbol
	$(this).html('<span class="glyphicon glyphicon-refresh animate-spin"></span>');

	processSQL();
}

/**
 * Processes the user's SQL query. This function will validate the SQL, and
 * make a request to the server for the column count if the SQL is valid.
 */
function processSQL() {
	// Remove beginning and trailing whitespaces, and remove all semicolons.
	globalSqlBuilder.sql = $('#sql').val().trim().split(';').join('');

	validateSQL(function(err) {
		if (err) {
			resetTestButton();
			$.growl.error({ message: err });
			//$('#error-panel').html('<p class="text-danger">' + err + '</p>');
		} else {
			// The statement is valid. Make the request to the server.
			makeRequest(globalSqlBuilder.sql, handleResults);
		}
	});
}

/**
 * Validates the sql against a list of potentially harmful sql commands. This
 * function assumes the given sql does not having leading or trailing
 * whitespaces, or any semicolons.
 *
 * @param {String} sql	The SQL query that was inputted.
 * @return {Boolean}	True if the SQL is valid, False otherwise. A valid SQL
 * 						statement is one that does not contain any potentially
 * 						harmful keywords, or comments.
 */
function validateSQL(callback) {
	// Convert it to lowercase for matching purposes.
	var sql = globalSqlBuilder.sql.toLowerCase();

	// Don't continue execution if the SQL statement is empty.
	if (sql && sql != '') {
		// These will be checked with all types of whitespaces including spaces,
		// newline, and tabs
		statements = ["delete", "insert", "drop", "alter", "grant", "create",
			"revoke", "show", "into", "declare", "update", "set", "delimiter",
			"if", "begin", "procedure", "trigger", "--", "/*", "*/"
		];

		for (var i = 0; i < statements.length; i++) {
			var statement = statements[i];
			// Escape all regex characters in the statement string.
			regexStatement = escape(statement);
			// Create a regex string with the statement surrounded by 0 or more
			// whitespaces, but ignoring surrounding quotation marks.
			var regex = new RegExp('[^"]*' + regexStatement + '[^"]', 'g');

			if (sql.match(regex)) {
				return callback(loc.js.err.invalidSQL);
			}
		}

		return callback(null, true);
	} else {
		return callback(loc.js.err.sqlRequired);
	}
}

/**
 * Escapes all RegExp characters in the given string.
 *
 * @param  {String}	string	The string in which to escape the RegExp characters.
 * @return {String}	The string with the characters escaped.
 */
function escape(string) {
	return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

/**
 * Makes a POST request to the server to "/process_sql"
 *
 * @param  {Function} callback The function to execute once a result is returned.
 *                             from the server.
 */
function makeRequest(sql, callback) {
	$.ajax({
		url : '/qa/component/process_sql',
		type : 'POST',
		data : { sql : sql },
		success : function(result) {
			callback(null, result);
		},
		error : function(request, errorType, errorMessage) {
			callback(request.responseText);
		}
	});
}

/**
 * Handles the result from the server. The result can be either a list of
 * groups, if the user inputted 3 columns in their select statement or null, if
 * the user inputted 2 columns.
 *
 * @param  {Object} err		An error, if any occurred.
 * @param  {int} 	result	The results from the server.
 */
function handleResults(err, result) {
	resetTestButton();

	if (err) {
		$.growl.error({ message: err });
	} else {
		var resultLength = result.length - 1;
		var tablename = result[resultLength];
		result = result.slice(0, resultLength);
		$.growl.notice({ message: loc.js.successfullyCreatedTable });

		// Add sql query and tablename to component object
		g.component.QUERY = globalSqlBuilder.sql;
		g.component.TABLE_NAME = tablename;

		// Don't allow the user to test the query again until they change it
		disableTestButton();

		if (result && result.length === 0) {
			// Enable the "Save Component" button
			enableSaveButton(loc.js.save, saveDetails);
		} else if (result.length > 0) {
			// Populate modal with the groups
			populateLeftSelect(result);
			// Enable "Define Groups" button
			enableSaveButton(loc.js.groups, showGroupModal);
		}
	}
}

function resetTestButton() {
	var test = $('#test');
	var save = $('#save');

	// Change "Define Groups" button back to "Save Component"
	enableSaveButton(loc.js.save, saveDetails);
	test.html(loc.test);

	// Disable the save button, and enable the test button
	test.prop('disabled', false);
	save.prop('disabled', true);

	test.off();
	test.on('click', buttonTestClick);
}

function disableTestButton() {
	var test = $('#test');
	test.prop('disabled', true);
	test.off();
}

$(window).ready(function() {
	$('#test').on('click', buttonTestClick);
	$('#sql').on('change paste keyup', resetTestButton);
});
