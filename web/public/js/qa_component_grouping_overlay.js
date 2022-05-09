//Note to change:
//Ajax call to persist, need to send the right component ID, now default to 5
//Variable declaration: scope whole script
var originalUL;
var modifiedUL;
var leftLI;
var rightLI;
var saveBtn;
var setSave = false;

// Add event handler, set global variable, create custom event
$('document').ready(init);

// Call when document ready
function init(){
	//Give a value to the mock data
	originalUL = $('#origGroupList');
	modifiedUL = $('#modifiedGroupList');
	saveBtn = $('#saveBtn');
	refreshOptionVar();

	//Set the Li element sortable between the two lists
	$( function() {
	    $( "#origGroupList, #modifiedGroupList" ).sortable({
			connectWith: ".connectedSortable",
			stop: function() {
				refreshOptionVar();
				isLeftSelectEmpty();
			}
		});
	});

	/////////////////////////////////////////////////////////////////////
	// Set the event handler
	/////////////////////////////////////////////////////////////////////

	//Set the LI element clickable
	//Note: Custom clickable solution
	//Explication: Sortable and selectable are not functioning
	//well togheter so I implemented my own
	originalUL.on('click','li',selectClickHandler);
	modifiedUL.on('click','li',selectClickHandler);


	// Open modal view on click
	$('#openModalBtn').on('click',function(){
		//Prevent the user from exiting Modal when outside background is click
		//Or using ESC key
		$('#groupModal').modal({backdrop: 'static', keyboard: false});
	});
	///////////////////////////////////////////////////
	/// The two following event handler             ///
	/// take care of ordering the right ul          ///
	/// any element selected will be moved          ///
	/// by one up or down                           ///
	///                                             ///
	/// Note: When more than one element is         ///
	/// selected, the top (up arrow) or the         ///
	/// bottom (down arrow) will move one up/down   ///
	/// along with the other element                ///
	///                                             ///
	/// The li global variable updated after change ///
	///////////////////////////////////////////////////
	$('#moveUpRight').on('click',function(e){
		e.preventDefault();
		var selectedList = modifiedUL.find('.ui-selected');
		if(selectedList.length){
			selectedList.first().prev().before(selectedList);
		}
		refreshOptionVar();
	});
	$('#moveDownRight').on('click',function(e){
		e.preventDefault();
		var selectedList = modifiedUL.find('.ui-selected');
		if(selectedList.length){
			selectedList.last().next().after(selectedList);
		}
		refreshOptionVar();
	});
	//Send all element to the other panel
	$('#sendAllRightBtn').on('click',sendAllElementsRight);
	$('#sendAllLeftBtn').on('click',sendAllElementsLeft);

	//Send selected element to the right
     $('#sendRightBtn').on('click',sendElementsRight);
	//Send selected element to the left
	$('#sendLeftBtn').on('click',sendElementsLeft);

	//Custom events

	//Enable and Disable save button; also remove/add event handler
	saveBtn.on('disable.save',function() {
		saveBtn.prop('disabled', true);
		saveBtn.off('click');
	});
	saveBtn.on('enable.save', saveEnableFunction);
	//End of the document. ready
}
// Parse ordered groups list into Array
function parseGroupIntoArray(){
	var array = new Array();
	var index;
	var len = rightLI.length;
	var object = {};
	for(index = 0; index < len; index++){
		object = {};
		object.value = rightLI[index].innerHTML;
		array[index] = object;
	}
	return array;
}

var PersistGroup = {
	persistOptions: function(gList){
		var index, len = gList.length;
		var list = new Array();
		for(index = 0; index < len; index++){
			list[index] = JSON.stringify(gList[index]);
		}
		g.component.GROUPS = gList;
	}
};
//Use to refresh the list variable
function refreshOptionVar(){
	leftLI =  originalUL.find('li');
	rightLI = modifiedUL.find('li');
}
//Event handlers
function selectClickHandler(e){
	e.preventDefault;
	var li = $(this);
		if(e.ctrlKey == false){
			li.parent().children('li').removeClass('ui-selected');
		}
		if(li.hasClass('ui-selected')){
			li.removeClass("ui-selected");
		}else{
			li.addClass('ui-selected');
		}
}
function sendAllElementsRight(e){
	refreshOptionVar();
	e.preventDefault();
	moveGroups(leftLI,modifiedUL, true);
	leftLI.removeClass('ui-selected');
	isLeftSelectEmpty();
}
function sendAllElementsLeft(e){
	refreshOptionVar();
	e.preventDefault();
	moveGroups(rightLI,originalUL, true);
	rightLI.removeClass('ui-selected');
	isLeftSelectEmpty();
}
function sendElementsRight(e){
	refreshOptionVar();
	e.preventDefault();
	moveGroups(leftLI,modifiedUL, false);
	leftLI.removeClass('ui-selected');
	isLeftSelectEmpty();
}
function sendElementsLeft(e){
	refreshOptionVar();
	e.preventDefault();
	//Will move selected element to the left select
	moveGroups(rightLI,originalUL, false);
	rightLI.removeClass('ui-selected');
	//Will disable the click event listener
	isLeftSelectEmpty();
}
function saveEnableFunction(e){
	saveBtn.off('click');
	parseGroupIntoArray();
	//Enable the button
	saveBtn.prop('disabled', false);
	//Add the event handler
	saveBtn.on('click', function(e){
		e.preventDefault();
		//Persist
		PersistGroup.persistOptions(parseGroupIntoArray());

		// Change "Define Groups" button to "Save Component"
		enableSaveButton(loc.js.save, saveDetails);
	});
}
//Enable the save button if left panel is empty
function isLeftSelectEmpty(){
	refreshOptionVar();
	if (leftLI.length === 0) {
		if (setSave === false) {
			saveBtn.trigger('enable.save');
			setSave = true;
		}
	} else {
		saveBtn.trigger('disable.save');
		setSave = false;
	}
}


/*************************************************
 * This function will move the selected element
 * of the to select into the from
 * All elements will be append to the end
 * of the to
 *
 * If no elements selected, nothing happen
 *
 * @param from - list of all li tag
 * @param to - ul tag
 * @param moveAllBoolean - boolean if you move
 *                         all not matter what
 *                         is selected
 *
 * @author Frank Birikundavyi
 * @version 0.1.2
 ************************************************/
function moveGroups(fromOption,to, moveAllBoolean){
	var selectedValue = new Array();
	var selectedCount = 0;
	var index, groups;
		if(moveAllBoolean === false){
			groups = fromOption.parent().find('.ui-selected');
		}else{
			groups = fromOption;
		}
		var temp =groups.length - 1;
	//Retrieve them in inverse order to avoid messing array indexing
	for(index = temp; index >= 0; index--){
			//Save the selected option
			selectedValue[selectedCount] = groups[index];
			//Count how many selected option there is
			selectedCount++;
	}
	//Remove all the Li that are going to be moved
	groups.remove();
	//Check if there is any Li to move
	if(selectedCount !== 0){
		//Add them in the reverse order
		temp = selectedCount - 1;
		for(index = temp; index >= 0; index--){
			addGroupTo(to,selectedValue[index]);
		}
	}
}
//Method use in the moveGroup function
function addGroupTo(to, tag){
	to.append(tag);
}

//Method when retrieve original list of groups
function populateLeftSelect(groupList){
	clearSelects();
	$.each(groupList,function(index,g){
		originalUL.append($("<li>"+g.group+"</li>"));
	});
}

function clearSelects() {
	originalUL.html('');
	$('#modifiedGroupList').html('');
}
