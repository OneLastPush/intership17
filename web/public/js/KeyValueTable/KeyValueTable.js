/**
* Sortable & editable key value pair table GUI & functionality.
* You can provide functions for getting, editing & removing outside data,
* as well as specify if you want an adding row.
*
*
* Use:
* var dataOpts = {
*	getDataFn: function(sendData){
*		//do stuff, like ajax, or just build data from scratch
*		var data = {
*			test: 'value',
*			like: 'this',
*			"see ee e": 'whee e e'
*		};
*		sendData(data); //sends data back to the KeyValueTable
*	},
*	changeDataFn: function(name, value, successFn, existed, KVTable){
*		//key name, new value, function that signifies successful change, JQuery identifier for DOM element,
*		// if this key already existed, reference to (this) key value table object instance
*
*		//do stuff like ajax or editing your own
* 		//persistent data wherever you want it.
*		//You MUST call successFn() to update the change in KeyValueTable
*		successFn();
*		// - changeDataFn is called whenever key's value is changed, or new key is added.
*		// - SuccessFn must be called to tell KeyValueTable the change was valid.
*	},
*	removeDataFn: function(name, successFn){ //optional
*		//only specify this method if you want delete options for rows.
*		//do stuff like ajax or editing your own
* 		//persistent data to reflect the remove change.
*
*		// - removeDataFn is called when someone presses the X button on a row
*		//You MUST call successFn() to update the change in KeyValueTable
*		successFn();
*	}
* };
* var opts = {
*	keyName: 'Key', //The displaying name for column one (Key)
*	valueName: 'Value', //The displaying name for column two (Value)
*	keyPlaceholder: 'Enter key', //Placeholder text for key input box.
*	valuePlaceholder: 'Enter value, //Placeholder text for value input box.
*	editableKey: false, //if key column should be editable
*	addingRow: true, //should there be an adding row at the end of the table?
*	emptyKeyInvalid: true, //true = can't input empty keys
*	oneEditRow: false, //true will make the user submit a row onblur.
*	reqTooltipText: 'Required' //if a key has * it will have this tooltip
* };
*
* var table = new KeyValueTable(dataOpts, opts);
* $('#something').append(table.container);
* table.defaults(); //reverts all key/value pairs to default/unedited values
* table.reload(function(){ console.log('done'); }); //will reload whole table (getData, rebuild)
*
* Requires:
*	Bootstrap 3
*	JQuery
*	KeyValueTable.css
*
*
* @param dataOpts - data functions (getting & setting, optional removing). See example.
* @param opts - Optional options for the KeyValue table. See example for details.
*
* @version 2.0.1
* @author Ganna Shmatova
*/
function KeyValueTable(dataOpts, opts){
	var KVTable = this;
	//Constructor
	var data;
	var table;
	var $container = $('<div>');

	dataOpts = $.extend({
		getDataFn: function(callbackFn){},
		changeDataFn: function(key, value, successFn, existed, KVTable){},
		removeDataFn: null
	}, dataOpts);

	opts = $.extend({
		keyName: 'Key',
		valueName: 'Value',
		keyPlaceholder: 'Enter key',
		valuePlaceholder: 'Enter value',
		editableKey: false,
		addingRow: true,
		emptyKeyInvalid: true,
		oneEditRow: false,
		reqTooltipText: 'Required',
		warnKeyChange: true
	}, opts);

	var requiredTooltipOpts = {
		title: opts.reqTooltipText,
		'data-trigger': 'hover'
	};

	build();
	function load(cb){
		dataOpts.getDataFn(function(data2){
			data = data2;
			syncBody();
			if(cb) cb();
		});
	}
	load();

	//******* private data/functions *******
	/**
	* Sets key value pair in table's data and calls changeDataFn.
	*
	* @param key Can be existing or new key
	* @param value Is only updated if value changed from old value (or nonexistant key provided)
	* @param callback Function called on successful change.
	*		callback(existed) where existed is boolean signifying if key existed before the set.
	* @param dontOverwrite request boolean. Will still do callback but wont overwrite if existed.
	*/
	function setKey(key, value, callback, dontOverwrite){
		function set(existed){
			dataOpts.changeDataFn(key, value, function(){
				data[key] = value;
				if(callback)
					callback(existed);
			}, existed, KVTable);
		}

		if(key in data){ //if exists
			if(dontOverwrite){ //don't overwrite, do nothing.
				if(callback)
					callback(true);
			}else if(data[key] !== value) //& changed value
				set(true);
		}else{ //does not exist
			set(false);
		}
	}

	/**
	* Removes key from locally kept data, if key could be found.
	*
	* @param key to remove
	* @param callback Function. Always called. Takes 1 param -- if key existed/deleted successfully.
	*/
	function removeKey(key, callback){
		function remove(existed){
			dataOpts.removeDataFn(key, function(){
				delete data[key];
				if(callback) callback(existed);
			});
		}

		if(key in data){ //if exists
			remove(true);
		}else{
			if(callback) callback(false);
		}
	}


	// BUILDING FUNCTIONS

	/**
	* Builds KeyValueTable's table member <table>.
	*
	* The <table> has:
	* 	<colgroup> styles with 2 <col>,
	*	<thead> with 2 <th> headers (col1Name and col2Name),
	* 	and an empty <tbody>
	*
	* The <th> headers are linked with the sorting event.
	*/
	function build(){
		table = $('<table>',{
			"class": "table table-striped table-bordered table-condensed editable-table"
		});
		$container.off().empty(); //empties just in case
		$container.append(table);

		var tr; //reused var

		//do styles
		var colgroup = $('<colgroup>');
		colgroup.append($('<col>',{
			"class": "col-xs-6 col-sm-5 col-md-4 col-lg-3"
		}));
		colgroup.append($('<col>',{
			"class": "col-xs-6 col-sm-7 col-md-8 col-lg-9"
		}));

		//make headers
		var headers = $('<thead>');
		headers.append(tr = $('<tr>'));

		var th = $('<th>');
		th.append($('<span>',{"class":"fa fa-caret-down"}));
		th.append(' ' + opts.keyName);
		tr.append(th);

		th = $('<th>');
		th.append($('<span>',{"class":"fa fa-caret-down"}));
		th.append(' ' + opts.valueName);
		tr.append(th);

		tr.children('th').addClass('clickable').on('click', thClickEvnt);

		//makes tbody
		var body = $('<tbody>');

		//puts it all together
		table.append(colgroup);
		table.append(headers);
		table.append(body);
	}

	/**
	* Syncs the KeyValueTable's data member with table's <tbody>.
	* Optionally, you can provide sorting specifications.
	*
	* Uses buildTR() for every <tr> needed.
	*
	* @param sortCol Optional. Name of the column to sort table data by.
	* @param asc Optional. If sorting should be ascending. If omitted, descending.
	*/
	function syncBody(sortCol, asc){
		var body = table.find('tbody');
		body.off().empty(); //clears old
		var pair = []; //converts to sortable array
		for(var key in data)
			pair.push([key, data[key]]);

		if(sortCol){ //if sorting
			var col;
			var cols = table.find('th'); //finds sort col #
			for(col=0; i<cols.length; col++)
				if(cols[col].text() == sortCol)
					break;

			pair.sort(function(a,b){ //sorts
				var order = a[col].localeCompare(b[col]);
				return asc? order: -order;
			});
		}

		for(var i=0; i<pair.length; i++) //parses data into DOM elements
			body.append(buildTR(pair[i][0], pair[i][1]));

		//Adds last row which functions to Add Env Variables.
		body.append(buildTR('', '', true));
	}

	/**
	* Builds <tr> element.
	*
	* Normal row:
	*	Disabled <input> for key <td>
	*	Enabled <input> for value <td>
	*		Focus makes visible submit btn (inputFocusEvnt())
	*		Enter presses submit btn (inputKeypressEvnt())
	*		On blur event adds warning if value changed & not saved (inputBlurEvnt())
	*	Invisible submit btn
	*		Submit btn is pencil icon
	*
	* Adding row: (key & value are editable)
	*	Enabled <input> for key <td>
	*		keyPlaceholder placeholder
	*	Enabled <input> for key <td>
	*		valuePlaceholder placeholder
	*		Enter presses submit btn (inputKeypressEvnt())
	*	Constant submit btn
	*		Submit btn is plus icon
	*
	*
	* @param key Key value which will be in the first column
	* @param value Value which will be in the second column
	* @param addingRow If this row is acting as an adding row
	*/
	function buildTR(key, value, addingRow){
		if(!opts.addingRow && addingRow) return;
		var tr = $('<tr>');
		tr.on('keypress', inputKeypressEvnt); //pressing enetr triggers save

		var td; //swap var

		//KEY TD
		tr.append(td = $('<td>'));
		var keyInput = $('<input>',{
			"name": 'key',
			placeHolder: (addingRow? opts.keyPlaceholder : ''),
			"value": key
		}).prop('disabled', !(addingRow || opts.editableKey));
		keyInput.data('orig', key);
		if(!addingRow && opts.editableKey){ //adds events to key only if editable key option
			keyInput.on('click', inputFocusEvnt);
			keyInput.on('blur input', inputBlurEvnt);
		}
		if(key.match(/\*/)){ //required tooltip
			var tooltip = $('<div>',{
				'data-toggle': 'tooltip'
			});
			tooltip.append(keyInput);
			tooltip.tooltip(requiredTooltipOpts);
			td.append(tooltip);
		}else{
			td.append(keyInput);
		}

		//VALUE TD
		tr.append(td = $('<td>'));

		var group = $('<div>',{"class": "input-group"});
		td.append(group);
		var input =$('<input>',{
			"name": 'value',
			type: (key.indexOf('password') > -1)? 'password': 'text',
			placeHolder: (addingRow? opts.valuePlaceholder: ''),
			"value": value
		});
		group.append(input);

		if(!addingRow){ //validation & toggled visiblity of btn not needed in adding row
			input.on('click', inputFocusEvnt);
			input.on('blur', inputBlurEvnt);
		}

		//BTN
		var btn;

		//edit or adding btn (if AddingRow: has different icon & starts visible)
		btn = $('<div>', {"class": "input-group-addon btn " + (addingRow? '': "invisible")});
		btn.append($('<span>',{"class": addingRow? 'fa fa-plus':'fa fa-save'}));
		btn.tooltip({title: addingRow? 'Add': 'Save', container: 'body'});

		group.append(btn);
		btn.on('click', btnAddClickEvnt);

		//removing button if applicable
		if(!addingRow && dataOpts.removeDataFn){
			btn = $('<div>', {"class": "input-group-addon btn " + (addingRow? '': "invisible")});
			btn.append($('<span>',{"class": 'fa fa-times'}));
			btn.tooltip({title: 'Delete', container: 'body'});

			group.append(btn);
			btn.on('click', btnRemoveClickEvnt);
		}
		//FINISH
		return tr;
	}


	//re-used DOM events (saves memory to cache once & not remake for every DOM element)

	/**
	* DOM event for keypress. On enter key, finds all children with fa-save
	* or fa-plus and triggers click for parent.
	*/
	function inputKeypressEvnt(e){
		if(e.which == 13)
			$(this).find('.fa-save, .fa-plus').parent().trigger('click');
	}

	/**
	* Makes btn visible.
	*/
	function inputFocusEvnt(){
		table.find('.input-group-addon').addClass('invisible'); //make btn invisible
		table.find('tr').removeAttr('class');
		var nameInput = $(this).attr('name');
		(nameInput == 'key') ? $(this).parent().parent().attr('class','activeRow') : $(this).parent().parent().parent().attr('class','activeRow')
		var tr = $(this).parents('tr:first');
		if(opts.oneEditRow){ //if only supposed to have 1 edit row at a time
			var unsaved = table.find('.warning').not(tr);
			if(unsaved.length > 0){ //if unsaved data
				$(this).trigger('blur'); //cancel the focus on this new row
				unsaved.find('.fa-save, .fa-plus').parent().trigger('click'); //save
			}
		}
 		tr.find('.invisible').removeClass('invisible');
	}

	/**
	* Checks if key's value was changed.
	* If it was changed, adds .warning class.
	* If unchanged, clears .warning class & hides btn.
	* This event only applies to normal rows (not adding row), or supposed to.
	*/
	function inputBlurEvnt(){
		var tr = $(this).parents('tr:first');
		var key = tr.find("input[name='key']").data('orig');
		var key2 = tr.find("input[name='key']").val();
		var value = tr.find("input[name='value']").val();

		if(data[key]+'' != value+'' || (key != key2)){ //if different
			tr.addClass('warning');
		}else{ //if same
			tr.removeClass('warning');
			setTimeout(function (){ //adds delay so you can still click x button
				tr.find('.btn').addClass('invisible'); //makes btns invisible
			}, 100);
		}

	}

	/**
	* Calls setKey().
	* Only changes table GUI if setKey was successful.
	*
	* Changing a row clears .warning and makes btn invisible again.
	*
	* Adding a row:
	* 	- Either replaces old <tr> if there was one with the same key,
	* 	or adds a new <tr> with the key-value pair provided.
	*	- Clears adding row data.
	*/
	function btnAddClickEvnt(){
		$(this).tooltip('destroy');
		var tr = $(this).parents('tr:first');
		var key = tr.find("input[name='key']").data('orig');
		var key2 = tr.find("input[name='key']").val();
		var value = tr.find("input[name='value']").val();
		var addingRow = (tr.find('.fa-plus').length > 0);

		if(opts.emptyKeyInvalid && key2.length === 0){
			displayMsg('Invalid', opts.keyName +' cannot be blank');
		}else{
			if(key != key2 && !addingRow){ //if key was changed
				setKey(key2, value, function(existed){ //try to make new key
					if(existed && opts.warnKeyChange){
						//if exists, display warning
						displayMsg('Duplicate',
							'This key already exists. You would be overwriting the key ' + key2,
							false, [{
								name: 'Overwrite',
								action: function(){
									var existing = table.find("input[name='key'][value='"+ key2 +"']").parents('tr:first');
									existing.find("input[name='value']").val(value);

									//triggers save event
									existing.find('.fa-save, .fa-plus').parent().trigger('click');

									//removes this table row
									tr.find('.fa-times').trigger('click');
								}
							}]);
					}else{
						removeKey(key, function(existed){
							tr.off().replaceWith(buildTR(key2, value));
						});
					}
				}, true); //won't set if exists
			}


			setKey(key2, value, function(existed){ //otherwise try value change
				if(!addingRow){ //if normal row
					tr.removeClass('warning'); //get rid of warning color if any
					tr.find('.input-group-addon').addClass('invisible'); //make btn invisible
					tr.find("input[name='value']").blur(); //untarget input box
				}else{//else must be adding row sooo...
					//append a new adding row
					tr.parent().append(buildTR('', '', true));

					if(existed){ //if already exists
						//update existing row
						var matchTR = tr.parent().find("input[name='key'][value='"+ key2 +"']").parents('tr:first');
						matchTR.find("input[name='value']").val(value);
						//just in case this was changed but not saved before, clear errors
						matchTR.removeClass('warning');

						tr.off().remove(); //remove adding row
					}else{ //if new
						tr.off().replaceWith(buildTR(key2, value)); //replace this row with identical normal row
					}

				}
			});
		}
	}

	/**
	* Calls removeKey().
	* Only change table GUI if remove was successfuly.
	*
	* This method will delete the table row in the GUI.
	*/
	function btnRemoveClickEvnt(){
		$(this).tooltip('destroy');
		var tr = $(this).parents('tr:first');
		var key = tr.find("input[name='key']").data('orig');

		removeKey(key, function(existed){
			if(existed){
				tr.off().remove();
			}
		});
	}

	/**
	* Orders <tr> in <tbody> (syncBody()) based on the click <th>'s caret type.
	*/
	function thClickEvnt(){
		var caret;
		//toggles caret & sorts based on caret
		if((caret = $(this).find(".fa-caret-down")).length > 0){
			caret.removeClass("fa-caret-down");
			caret.addClass("fa-caret-up");
			syncBody($(this).text(), true);
		}else if((caret = $(this).find(".fa-caret-up")).length > 0){
			caret.removeClass("fa-caret-up");
			caret.addClass("fa-caret-down");
			syncBody($(this).text());
		}
	}

	/**
	* Clears all changes done in GUi and sycns it with the real data. (clears edited but not saved values, basically)
	*/
	this.defaults = function(){
		var changed = table.find('.warning');
		var key;
		var row;
		for(var i=0; i<changed.length; i++){
			row = $(changed[i]);
			key = row.find("input[name='key']").data('orig'); //get key
			row.find("input[name='key']").val(key); //set to original key
			row.find("input[name='value']").val(data[key]); //set to original value
			row.find('input').trigger('blur'); //trigegr blur to get rid of warning
		}
	};
	this.container = $container;
	this.reload = load;

}
