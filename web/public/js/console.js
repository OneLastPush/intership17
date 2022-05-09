/**
 * The console.js file is used on the console.html webpage
 * to perform console operations on the web browser.
 *
 * @author Cristan D'Ambrosio (2014)
 * @author Ganna Shmatova (2014)
 */

var recentCommands = [];
var positionTracker = -1;

// This is here to remove the default form submission functionality and replace
// it with our own.
$(document).ready(function() {
	$('#txtCommand').keydown(function(event) {
		if (event.keyCode == 13) {
			event.preventDefault();
			runLineCommand();
			return false;
		}
	});
});

// Run when page has finished loading
$(window).load(function() {
	$("#consoleForm").submit(function(event) {
		event.preventDefault();
	});

	// executed when user clicks on clear button
	$("#btnClear").click(function(event) {
		clearConsoleScreen();
	});

	$('#btnHelp').on('click',function(){
		doHelp();
	});

	$('#txtCommand').keydown(function(event) {
		// Up arrow
		if (event.keyCode == 38)
			cycleThroughRecentCommands("up");
		// Down arrow
		else if (event.keyCode == 40)
			cycleThroughRecentCommands("down");
	});

	$('#upBtn').on('click', function() {
		cycleThroughRecentCommands("up");
	});

	$('#downBtn').on('click', function() {
		cycleThroughRecentCommands("down");
	});

	clearConsoleScreen();
});

function cycleThroughRecentCommands(upOrDown) {
	var txtInput = $('#txtCommand');

	if (upOrDown == "up") {
		if (!(positionTracker == recentCommands.length - 1))
			positionTracker++;
	} else {
		if (!(positionTracker == -1))
			positionTracker--;
	}

	txtInput.val(recentCommands[positionTracker]);
}

// function to run a line command from the console
function runLineCommand() {
	var cmd = $('input#txtCommand').val();

	// Refrain from sending empty requests to the server
	if (cmd !== '') {
		recentCommands.unshift(cmd);
		positionTracker = -1;

		$.ajax({
			url : '/emm/app/console',
			data : {cmd: cmd},
			dataType : "json",
			success : function(data) {
				writeToConsole(data.cmdLine, data.stdout.replace(/</g,'&lt;').replace(/>/g,'&gt;'), data.stderr);
			}
		});

		// Reset text of input to empty
		$("input#txtCommand").val('');
	}
	return false;
}

function writeToConsole(cmdLine, stdout, stderr){
	//old height
	var oldHeight = $('pre#consoleOutput').prop("scrollHeight");

	if(cmdLine)
		$("pre#consoleOutput").append("\n> " + cmdLine + "\n");

	$('pre#consoleOutput').append(stdout).scrollTop(oldHeight);
	if(stderr)
		$('pre#consoleOutput').append('\n'+stderr);
}

// clears the console screen
function clearConsoleScreen() {
	$("pre#consoleOutput").html("This console can be used to run commands against the <strong>unica_svradm</strong> utility<br><br>");
}

function doHelp(){
	$.ajax({
		url : '/emm/app/console',
		data : { cmd: 'help'},
		dataType: 'json',
		success : function(data) {
			var help = '';
			for(var sect in data)
				help += data[sect] + '\n';
			help = help.substr(help.indexOf('Available commands:'));

			writeToConsole(data.stderr + '\n', help);
		}
	});
}
