/**
 * This is the file that makes the timeline for the logs. It receives a log file from log_viewer.js, parses it and uses
 * the timeline library (The JS version of Simile Timeline) to display the data on the screen.
 *
 * @author : Danijel Livaja 2015
 */

//Variables that the timeline functions require
var logTimeLine; //TimeLine
var resizeTimerID = null;

function LogAnalyzer(options) {


	//Making HTML in JS is generally not the best idea, but that's how AE seems to be built, so here we are...
	var $container = $('<div>');

	var $timeline = $('<div>', {
		"id": "analyzethis",
		"class":"dark-theme",
		"style": "height:500px;  border-style: solid; border-width: 2px;"
	});

	$container.append($timeline);
	//A container for all the options pertaining to filters
	var $filterOptions = $("<div id='filterOptions' class='col-md-10'>")


	//Make the radio Button
	var $buttonToggles = $("<div id='buttonToggles' class='col-md-10'>")
	$buttonToggles.append($("<input type='radio' name='includeOrExclude' value='inclusive' checked='checked'>" + loc.js.analyzer.anyOption + "  </input>"));
	$buttonToggles.append($("<input type='radio' name='includeOrExclude' value='exclusive' >  "+loc.js.analyzer.allOptions+"</input>"));
	$buttonToggles.append($('<br>'));

	//Add checkboxes to filter by action
	var $checkboxesContainer = ($("<div id='checkboxes' class='col-md-10'>"));
	$checkboxesContainer.append($('<label>').text(loc.js.analyzer.action + ": "));
	var actionTypes = ['Process', 'General', 'Interface', 'Config', 'Cell Acc', 'Table Acc', 'Systable Qry'];
	for (var i = 0; i < actionTypes.length; i++) {
		$checkboxesContainer.append($("<input type='checkbox' value='" + actionTypes[i] + "' name='action' >" + actionTypes[i] + "  </input>"));
	}
	$checkboxesContainer.append($('<br>'));

	//Add checkboxes to filter by LogLevel
	$checkboxesContainer.append($('<label>').text(loc.js.analyzer.logLevel + ": "));
	var logLevelTypes = ['Info', 'Debug', 'Warning', 'Error'];
	for (var i = 0; i < logLevelTypes.length; i++) {
		$checkboxesContainer.append($("<input type='checkbox' value='" + logLevelTypes[i].charAt(0) + "' name='logLevel' >" + logLevelTypes[i] + "  </input>"));
	}


	//Add RadioButtons to filter by action
	var $radioButtonContainer = ($("<div id='radioButtons' class='col-md-10 hidden' >"));
	$radioButtonContainer.append($('<label>').text("Action: "));
	for (var i = 0; i < actionTypes.length; i++) {
		$radioButtonContainer.append($("<input type='radio' value='" + actionTypes[i] + "' name='action' >" + actionTypes[i] + "  </input>"));
	}
	$radioButtonContainer.append($('<br>'));

	//Add checkboxes to filter by LogLevel
	$radioButtonContainer.append($('<label>').text("Log Level: "));
	for (var i = 0; i < logLevelTypes.length; i++) {
		$radioButtonContainer.append($("<input type='radio' value='" + logLevelTypes[i].charAt(0) + "' name='logLevel' >" + logLevelTypes[i] + "  </input>"));
	}

	$filterOptions.append($buttonToggles);
	$filterOptions.append($checkboxesContainer);
	$filterOptions.append($radioButtonContainer);

	//Add all the filter options to the main container
	$container.append($filterOptions);


	//Add a button to switch themes
	$container.append($("<div class='col-md-2 pull-right'><button id='toggleThemeBtn' class='btn btn-default '>" + loc.js.analyzer.switchTheme + "</button></div>"));

	//Add it all to log_viewer.html
	this.container = $container;

	this.set = function(data) {

		//Take the JSON and split it on the timestamp
		//After this you'll have an array with timestamp (even indecies) and the entry (odd indecies)
		var pattern = new RegExp(/(\d+\/\d+\/\d+\s.\d+:\d+:\d+.\d+)/gm);
		var content = data.toString().split(pattern);
		//Remove the first empty array entry (this is there because of the way split works
		content.splice(0, 1);

		//Take the log file and make it work with the timeline
		content = parseFileToJSON(content);
		content = organizeJSON(content);
		content = makeItTimelineCompatible(content);

		// console.log('Content of timeline:');
		// console.log(content);

		//Set up thetimeline
		onPageLoad(content);
		$(window).resize(onPageResize);


		// Event handler for radio button (toggle for the type of filter)
		$('#buttonToggles>input[type=radio]').change(function(event) {

			//When the options button is switched, change the buttons from checkboxes to radio buttons (or vice versa)
			$("#radioButtons").toggleClass('hidden');
			$("#checkboxes").toggleClass('hidden');

			//Also uncheck everything, and redraw the timeline
			$('input[type=checkbox]').prop('checked', false);
			$('#radioButtons>input[type=radio]').prop('checked', false);
			onPageLoad(content);
		});

		// Event handler for the checkboxes (filters)
		$('input[type=checkbox]').change(function(event) {
			var logs = content;

			//Every time someone clicks something, collect all the options checked
			var inputs = $("input[type=checkbox]:checked");

			var actionFilterArray = [];
			var logLevelFilterArray = [];

			// If everything has been unchecked, redraw the original logs
			if (inputs.length === 0) {
				filteredLogs = logs;
			} else {
				//Go through the options and add them to an array
				for (var i = 0; i < inputs.length; i++) {
					//console.log(inputs[i].name);
					if (inputs[i].name === "action") {
						actionFilterArray.push(inputs[i].value);
					} else if (inputs[i].name === "logLevel") {
						logLevelFilterArray.push(inputs[i].value);
					}
				}

				//Create a filter object that our filter function can work with
				var filter = {
					"action": actionFilterArray,
					"logLevel": logLevelFilterArray
				};
				//Filter the logs
				var filteredLogs = filterEntryInclusively(logs, filter);

			}
			//Display the filtered logs
			onPageLoad(filteredLogs);
		});

		// Event handler for the radio buttons (filters)
		$('#radioButtons>input[type=radio]').change(function(event) {
			var logs = content;

			//Get all the checked options
			var inputs = $("input[type=radio]:checked");

			var actionFilterArray = [];
			var logLevelFilterArray = [];
			//console.log(inputs.length);
			if (inputs.length === 0) {
				filteredLogs = logs;
			} else {
				for (var i = 0; i < inputs.length; i++) {
					//console.log(inputs[i].name);
					if (inputs[i].name === "action") {
						actionFilterArray.push(inputs[i].value);
					} else if (inputs[i].name === "logLevel") {
						logLevelFilterArray.push(inputs[i].value);
					}
				}

				// This was originally objects within an array to allow for multiple filters to be sent
				var filter = [{
					"action": actionFilterArray[0],
					"logLevel": logLevelFilterArray[0]
				}];
				// Filter the logs
				var filteredLogs = filterEntryExclusively(logs, filter);

			}
			//Display the filtered logs
			onPageLoad(filteredLogs);
		});

		//Click listener for the button that switches themes
		//The themes are in the css file, and not built in
		$('#toggleThemeBtn').click(function(event){
			$("#analyzethis").toggleClass('dark-theme');
		});
	};
}

//Any entry matching any of the filters will be returned from this function
//So if you send action:process, and logLevel:E, anything with either process, or E will be returned
//If you send action:[process, interface], it will return all processes and interface actions.
function filterEntryInclusively(content, filter) {

	//Make a new object and add all the things that match
	var logs = content.events,
		newContent = {};

	newContent.events = [];

	//Go through each of the log entries
	for (var entry in logs) {
		//Go through each of the objects in the filter
		for (var filterEntry in filter) {
			//Make sure we didn't get a bad filterEntry
			if (logs[entry][filterEntry] != undefined) {
				//Then go through each of the values to filtery by
				for (var i = 0, length = filter[filterEntry].length; i < length; i++) {
					//And if it matches..
					if (logs[entry][filterEntry].toUpperCase() === filter[filterEntry][i].toUpperCase()) {
						//..add it to the new array
						newContent.events.push(logs[entry]);
					}
				}
			}
		}
	} //Triple nested for loop ftw

	//console.log(newContent);
	return newContent;
}

/**
 * This is meant to include things that match everything in each of the objects
 *
 * It takes an array of objects that each has a set of fields that need to all be true.
 *
 * Example:
 * [{field1:blue, field2:green},{field1:purple, field2:yellow}]
 * the above would yield all things that match (blue&green) and also (purple&yellow)
 */
function filterEntryExclusively(content, filter) {

	//Make a new object and add all the things that match
	var logs = content.events,
		newContent = {};

	newContent.events = [];
	//console.log(filter);
	//Go through each of the log entries
	for (var entry in logs) {
		//Go through each of the entries in the filter
		for (var i = 0, length = filter.length; i < length; i++) {
			for (var filterObject in filter) {
				//console.log(filter[filterObject]['action'].toUpperCase());

				// In case one or the other option has not been clicked, check if it's there before assigning it to the filter
				var actionFilter = filter[filterObject]['action'] ? filter[filterObject]['action'].toUpperCase() : logs[entry]['action'].toUpperCase();
				var logLevelFilter = filter[filterObject]['logLevel'] ? filter[filterObject]['logLevel'].toUpperCase() : logs[entry]['logLevel'].toUpperCase();

				//If both fields match, then push it; if not, ignore it.
				if (actionFilter === logs[entry]['action'].toUpperCase() &&
					logLevelFilter === logs[entry]['logLevel'].toUpperCase()) {
					newContent.events.push(logs[entry]);
				}
			}
		}
	}

	// console.log("New Content:");
	// console.log(newContent);
	return newContent;
}

/**
 *
 * These are the Basic Event Attributes that the timeline looks for when building the timeline:
 *
 * start
 * end
 * title
 * description
 * icon
 * textColor
 * caption
 *
 * These are not all of them, but that's what google is for :)
 *
 *  source: http://simile-widgets.org/wiki/Timeline_EventSources
 */
function makeItTimelineCompatible(content) {

	var entry = {};

	for (var i = 0; i < content.events.length; i++) {
		entry = content.events[i];
		entry.title = entry.action + " [" + entry.logLevel + "]";
		entry.caption = "PID: " + entry.PID;
	}
	return content;
}


//This creates a JSON object where each entry has 2 fields, Start (Timestamp) and Entry
function parseFileToJSON(content) {

	var result = {};
	result.events = []; //The timeline needs an array of objects to work with

	//All even fields (in content) are timestamps, and the odd ones are the log entries
	//This seperates them and places them into the array as an object
	for (var i = 0, x = content.length; i < x; i += 2) {
		logEntry = {};
		logEntry.start = content[i];
		logEntry.description = content[i + 1];
		result.events.push(logEntry);
	}
	return result;
}

//This function takes the JSON that only has 2 fields and organizes it so that it contains more readable fields
function organizeJSON(content) {

	var result = {},
		element,
		start = 0,
		end = 0,
		logEntry,
		pattern,
		remainingString;

	for (var i = 0; i < content.events.length; i++) {

		logEntry = content.events[i];

		//Get the PID - or what I believe to be the PID
		start = logEntry.description.indexOf('(');
		end = logEntry.description.indexOf(')');
		logEntry.PID = logEntry.description.substring(start + 1, end);

		//Get the LogLevel of the entry
		start = logEntry.description.indexOf('[', end);
		end = logEntry.description.indexOf(']', start);
		logEntry.logLevel = logEntry.description.substring(start + 1, end);

		//Get the Action type of the log entry
		start = logEntry.description.indexOf('[', end);
		end = logEntry.description.indexOf(']', start);
		logEntry.action = logEntry.description.substring(start + 1, end);

		//If there is a Name on the process, then add it to the JSON
		if (logEntry.description.indexOf('[', end) == end + 2) {
			start = logEntry.description.indexOf('[', end);
			end = logEntry.description.indexOf(']', start);
			logEntry.name = logEntry.description.substring(start + 1, end);
		}


		//If the process has been started/stopped, add that to the JSON
		var pattern = /PROCESS_RUN/g;
		var remainingString = logEntry.description.substring(end);

		if (pattern.test(remainingString)) {

			// If there was a "PROCESS_RUN" get the type...
			start = logEntry.description.indexOf('\t', end);
			end = logEntry.description.indexOf(' ', start);
			logEntry.processType = logEntry.description.substring(start + 1, end);

			// ...and the Action performed
			start = end;
			end = logEntry.description.indexOf(' ', start + 1); // +1 needed to avoid getting the space the index is on
			logEntry.processAction = logEntry.description.substring(start + 1, end);
		}


		//If a process has been created/destroyed, add that to the JSON
		pattern = /SProcessRun/g;
		remainingString = logEntry.description.substring(end);

		if (pattern.test(remainingString)) {

			// If there was a "ProcessRun" add it to the JSON with details about what ran
			start = logEntry.description.indexOf('\t', end);
			end = logEntry.description.indexOf(' ', start);
			logEntry[(logEntry.description.substring(start + 2, end))] =
				logEntry.description.substring(end + 1, (logEntry.description.indexOf('[', end) - 1));
		}

		if (logEntry.action == "CELL ACC") {
			pattern = /SCell/g;
			remainingString = logEntry.description.substring(end);

			if (pattern.test(remainingString)) {

				// If there was a "Cell Action" add it to the JSON with details about what ran
				start = logEntry.description.indexOf('\t', end);
				end = logEntry.description.indexOf(' ', start);
				logEntry[(logEntry.description.substring(start + 2, end))] =
					logEntry.description.substring(end + 1, (logEntry.description.indexOf('[', end) - 2));
			}
		}

		//Remove the stuff we just organized
		logEntry.description = logEntry.description.substring(end + 1).trim();
	}

	return content;
}

//This methods refreshes the timeline when someone resizes
function onPageResize() {
	if (resizeTimerID == null) {
		resizeTimerID = window.setTimeout(function() {
			resizeTimerID = null;
			logTimeLine.layout();
		}, 500);
	}
}

//This initializes the timeline
function onPageLoad(content) {

	var eventSource = new Timeline.DefaultEventSource();

	var theme = Timeline.ClassicTheme.create();
	theme.event.bubble.width = 350;
	theme.event.bubble.height = 300;

	//The date that the timeline will be centered on when it first loads
	var date = content.events[0] ? content.events[0].start : new Date(Date.now());

	//These are the sections of the timeline
	var bandInfos = [
		//The top sectoin that displays all the log events
		Timeline.createBandInfo({
			width: "80%",
			intervalUnit: Timeline.DateTime.HOUR,
			intervalPixels: 100,
			eventSource: eventSource,
			date: date,
			theme: theme,
			layout: 'original', // original, overview, detailed
			zoomIndex: 15, //This matches the zoomSteps index to the intervalUnit/intervalPixels above
			//Each time someone zooms, the level of zoom will correspond to the levels below
			zoomSteps: new Array({
				pixelsPerInterval: 50,
				unit: Timeline.DateTime.SECOND
			}, {
				pixelsPerInterval: 25,
				unit: Timeline.DateTime.SECOND
			}, {
				pixelsPerInterval: 15,
				unit: Timeline.DateTime.SECOND
			}, {
				pixelsPerInterval: 500,
				unit: Timeline.DateTime.MINUTE
			}, {
				pixelsPerInterval: 300,
				unit: Timeline.DateTime.MINUTE
			}, {
				pixelsPerInterval: 200,
				unit: Timeline.DateTime.MINUTE
			}, {
				pixelsPerInterval: 100,
				unit: Timeline.DateTime.MINUTE
			}, {
				pixelsPerInterval: 50,
				unit: Timeline.DateTime.MINUTE
			}, {
				pixelsPerInterval: 30,
				unit: Timeline.DateTime.MINUTE
			}, {
				pixelsPerInterval: 20,
				unit: Timeline.DateTime.MINUTE
			}, {
				pixelsPerInterval: 500,
				unit: Timeline.DateTime.HOUR
			}, {
				pixelsPerInterval: 300,
				unit: Timeline.DateTime.HOUR
			}, {
				pixelsPerInterval: 250,
				unit: Timeline.DateTime.HOUR
			}, {
				pixelsPerInterval: 200,
				unit: Timeline.DateTime.HOUR
			}, {
				pixelsPerInterval: 150,
				unit: Timeline.DateTime.HOUR
			}, {
				pixelsPerInterval: 100,
				unit: Timeline.DateTime.HOUR
			}, {
				pixelsPerInterval: 400,
				unit: Timeline.DateTime.DAY
			}, {
				pixelsPerInterval: 300,
				unit: Timeline.DateTime.DAY
			}, {
				pixelsPerInterval: 200,
				unit: Timeline.DateTime.DAY
			}, {
				pixelsPerInterval: 100,
				unit: Timeline.DateTime.DAY
			}, {
				pixelsPerInterval: 150,
				unit: Timeline.DateTime.WEEK
			}, {
				pixelsPerInterval: 200,
				unit: Timeline.DateTime.MONTH
			})
		}),
		//Bottom section that is used as an overview
		Timeline.createBandInfo({
			overview: true, //This makes the points in overview much smaller to reduce clutter
			eventSource: eventSource,
			date: date,
			width: "20%",
			intervalUnit: Timeline.DateTime.MONTH,
			intervalPixels: 200
		})
	];

	//Synchronizes the timeline and overview
	bandInfos[1].syncWith = 0;
	bandInfos[1].highlight = true;

	//Remove the classes of the div, otherwise TimeLine keeps adding them each time you refresh it
	$("#analyzethis").removeClass("timeline-container");
	$("#analyzethis").removeClass("timeline-horizontal");

	//Creates the actual Timeline
	logTimeLine = Timeline.create(document.getElementById("analyzethis"), bandInfos, Timeline.HORIZONTAL);

	//Load the JSON data into the timeline
	var url = '.';
	eventSource.loadJSON(content, url);
}
