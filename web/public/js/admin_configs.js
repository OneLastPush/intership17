/**
 * Uses KeyValueTable & ajax for showing & editing data.
 * 
 * Requires: KeyValueTable.js & KeyValueTable.css TabPanes.js
 * 
 * @author Ganna Shmatova
 */
var settings = {};
var settingsTables = {};

/**
 * Sends settings objects to the backend server to commit to settigns file.
 * 
 * @param successFn
 *            called if file was successfully written.
 */
function setSettings(successFn, key, value) {
	$.ajax({
		url : '/config/set',
		data : {
			item: key,
			value: value
		},
		success : successFn
	});
}

/**
 * Gets config settings from the server and makes them into keyValueTables.
 * 
 * @param doneCB
 *            is always called even if on error
 * 
 * @author Ganna Shmatova
 */
function getSettings(doneCB) {
	$.ajax({
		url : '/config/get',
		dataType : 'json',
		success : function(res) {
			settings = res;

			var opts = {
				keyName : 'Setting',
				valueName : 'Value',
				keyPlaceholder : 'Setting name',
				valuePlaceholder : 'Value name',
				addingRow : false,
				reqTooltipText : 'Requires CLEARGOALS Maestro to be restarted to take effect'
			};
			var opts2 = $.extend({}, opts2, {
				addingRow : true,
				editableKey : true
			});

			var makeTable = function(obj, key) {
				var thisOpts = opts;
				var thisDataOpts = {
					getDataFn: function(successFn) {
						successFn(obj[key]);
					},
					changeDataFn: function(name, value, successFn) {
						obj[key][name] = value;
						setSettings(successFn, key + '.' + name, value);
					}
				};
				for(var f in obj[key]){ //hide private config properties
					if(f.charAt(0) == '_')
						delete obj[key][f];
				}
				if(key.match(/ List$/i)) {
					thisOpts = opts2;
					thisDataOpts = $.extend({}, thisDataOpts, {
						removeDataFn: function(name, successFn) {
							delete obj[key][name];
							setSettings(successFn);
						}
					});
				}

				return new KeyValueTable(thisDataOpts, thisOpts);
			};

			for(var key in settings){
				settingsTables[key] = makeTable(settings, key);
			}
			makeCampaignSettings(settingsTables['IBM Campaign'].container);

			if(doneCB) doneCB();
		},
		error: function() {
			if(doneCB) doneCB();
		}
	});
}

function makeSettingsTabs() {
	var tabPanes = new TabPanes();
	var data = {
		Node : {
			'General Settings' : settingsTables.Node,
			'SSL' : settingsTables.SSL,
			'Email Client' : settingsTables['Email Client'],
			'Watched Servers List' : settingsTables['Watched Servers List'],
			'Global Bookmarks List' : settingsTables['Global Bookmarks List']
		},
		'LDAP Configuration' : settingsTables['LDAP Configuration'],
		'IBM Experience One Modules' : {
			'IBM Marketing Platform' : settingsTables['IBM Marketing Platform'],
			'IBM Campaign' : settingsTables['IBM Campaign'],
			'IBM Contact Optimization' : settingsTables['IBM Contact Optimization'],
			'IBM Distributed Marketing' : settingsTables['IBM Distributed Marketing'],
			'IBM Interact' : settingsTables['IBM Interact'],
			'IBM Marketing Operations' : settingsTables['IBM Marketing Operations'],
			'IBM SPSS Modeler Advantage' : settingsTables['IBM SPSS Modeler Advantage']
		},
		'JDBC' : {
			'Platform Database Access' : settingsTables['Platform Database Access'],
			'Campaign Database Access' : settingsTables['Campaign Database Access']
		},
		'Reporting' : {
			'IBM Cognos' : settingsTables['IBM Cognos'],
			'Apache' : settingsTables.Apache,
			'Microsoft IIS' : settingsTables['Microsoft IIS']
		},
		'Web Support' : {
			'IBM WebSphere' : settingsTables['IBM WebSphere'],
			'Oracle WebLogic' : settingsTables['Oracle WebLogic']
		}
	};

	var hasSubCategories = function(obj) {
		for ( var key in obj) {
			if (typeof obj[key] == 'object')
				return true;
		}
	};

	// will append table DOM on pane select
	var loadPane = function(e, $tab, $pane) {
		var key = $pane.data('name');
		$pane.append(settingsTables[key].container);
	};

	var $pane;
	for(var category in data) {
		if(hasSubCategories(data[category]) && !(data[category] instanceof KeyValueTable)){
			var obj = data[category];
			for(var key in obj){
				$pane = tabPanes.add(key, category, loadPane);
			}
		}else{
			$pane = tabPanes.add(category, undefined, loadPane);
		}
	}
	return tabPanes;
}

/**
 * Makes 'Internal Settings' in Campaign menu. Displays logging level (as of currently);
 */
function makeCampaignSettings($pane) {
	$pane.append($('<div>', { // seperator to make look pretty
		'class' : 'page-header no-margin'
	}), $('<div>', {
		'class' : 'top-margin'
	}));

	// populate #internalSettings
	var addRow = function(label, input) {
		var $group = $('<div>', {
			'class' : 'form-group'
		});
		$group.append(label);
		$group.append(input);
		$pane.append($group);
	};

	// Logging Level
	var $label = $('<label>', {
		text : 'Logging level',
		'for' : 'logLevel',
		'class' : 'col-xs-4'
	});
	var $input = $('<select>', {
		name : 'logLevel',
		id : 'logLevel',
		'class' : 'no-margin no-padding col-xs-8'
	});
	var makeOption = function(name, text) {
		return $('<option>', {
			name : name,
			text : text
		});
	};
	$input.append(makeOption('high', 'High'));
	$input.append(makeOption('medium', 'Medium'));
	$input.append(makeOption('low', 'Low'));
	$input.append(makeOption('all', 'All'));

	getLoggingLevel($input);
	$input.on('change', function() {
		setLoggingLevel($(this).val());
	});
	addRow($label, $input);

	$('.selectpicker').selectpicker();

	function getLoggingLevel(jqInput){
		$.ajax({
			url: '/emm/app/loglevel',
			success: function(data){
				jqInput.val(data.substring(0, 1).toUpperCase() + data.substring(1));
				jqInput.selectpicker('refresh');
			},
			statusCode: $.extend(statusHandler,{
				404 : function(){}
			})
		});
	}
	function setLoggingLevel(loggingValue){
		$.ajax({
			url: '/emm/app/loglevel',
			data: {level: loggingValue}
		});
	}
}

function getLicensesAndSupport(cb) {
	var licenses;
	// make database displayer/editor
	$.ajax({
		url : '/db/internal/product_info/blueprint',
		dataType : 'json',
		success : function(blueprint) {
			licenses = new JSONBrowser({
				idName : 'Product name',
				addNewText : 'New Product',

				getDataFn : function(callback) {
					$.ajax({
						url : '/db/internal/product_info/get/all',
						dataType : 'json',
						success : callback
					});
				},
				blueprint : blueprint,
				saveItemFn : function(_id, newData, successFn, whenDoneFn){
					$.ajax({
						url: '/db/internal/product_info/set',
						data: {
							product: _id,
							data: newData
						},
						success: function() {
							successFn();
						},
						error: whenDoneFn
					});
				},
				deleteItemFn: function(_id, successFn){
					$.ajax({
						url: '/db/internal/product_info/remove',
						data: {
							product : _id
						},
						success: function() {
							successFn();
						}
					});
				}
			});
			if(cb) cb(licenses);
		},
		error: function(){
			if(cb) cb();
		}
	});
}

var path;
function getInstallLogsList(){
	var $select = $('#file');

	$.ajax({
		url: $('#product').val()+'/app/logs/install/list',
		dataType: 'json',
		success: function(data){
			path = data.dir;
			$select.empty();
			data.files.forEach(function(item){
				$select.append($('<option>', {
					'text' : item
				}));
			});
			$select.selectpicker('refresh');
			if($select.children().length > 0)
				$select.trigger('change');
		},
		error: function() {
			$select.empty();
			$select.selectpicker('refresh');
			installLogs.clear(); // clear file viewer
		}
	});
}

var installLogs;
$(window).load(function(){
	$('.selectpicker').selectpicker();
	var $settings = $('#settings');
	var components;
	var licenses;
	installLogs = new RawFileViewer({
		getHead: {
			getUrl: function(){
				return $('#product').val()+'/fs/file';
			},
			getData: function(){
				return {
					action: 'head',
					file: path + '/' + $('#file').val()
				};
			}
		},
		getTail: {
			getUrl: function(){
				return $('#product').val()+'/fs/file';
			},
			getData: function(){
				return {
					action: 'tail',
					file: path + '/' + $('#file').val()
				};
			}
		},
		getWhole: {
			getUrl: function(){
				return $('#product').val()+'/fs/file';
			},
			getData: function(){
				return {
					file: path + '/' + $('#file').val()
				};
			}
		}
	});
	$('#installLogs').append(installLogs.container);
	$('#product').on('change', getInstallLogsList);
	$('#file').on('change', function getInstallLog() {
		if($('#file').val() && $('#product').val())
			installLogs.start();
	});

	$.ajax({
		url : '/apps',
		dataType : 'json',
		success : function(data) {
			var $select = $('#product');
			data.forEach(function(item) {
				$select.append($('<option>', {
					text : item.name,
					value: item.mount
				}));
			});
			$select.selectpicker('refresh');
			if ($select.children().length > 0)
				$select.trigger('change');
		}
	});

	getSettings(function() {
		// config wizard
		components = new ConfigWizard({
			displayFn : function(name) {
				return settingsTables[name].container;
			},
			setActive : function(name, state, successFn) {
				setSettings(function() {
					settingsTables[name].reload(successFn);
				});
			},
			changeOrderRows: function(category,container,successFn){
				setSettings(function(){}, category);
			}
		});
		components.set(settings);
		components.container.attr('id', 'components');
		$settings.append(components.container);

		getLicensesAndSupport(function(licenses2) {
			licenses = licenses2;
			var $licenses = licenses.container;
			$licenses.attr('id', 'licenses');
			$settings.append($licenses);
			// page unload catches pending changes in licenses
			window.onbeforeunload = function(e){
				var unsaved = licenses.container.find('.has-success');
				var unsavedWizard = $('#components').find('.warning');
				if(unsaved.length > 0 || unsavedWizard.length > 0)
					return 'You have pending unsaved changes. Do you really want to discard them?';
			};

			$settings.children().addClass('hidden');
			components.container.removeClass('hidden');
		});
	});
	var $view = $('#viewType');
	$view.on('change', function() {
		var val = $(this).val();
		var tabIndex = $(this)[0].selectedIndex;

		var $all = $('#settings').children();
		var prev = $all.not('.hidden').attr('id');
		if(prev == 'licenses'){
			var $viewSelect = $(this);
			var unsaved = licenses.hasUnsavedChanges(true, function(){
				licenses.clearPendingChanges();
				switchView(); // continue onward
				$viewSelect.val(val); // sets view to the view user selected
				$viewSelect.selectpicker('refresh');
			});
			if(unsaved){ // cancel navigation
				$viewSelect.val('SW Licenses & Support'); // undo user's view select
				return;
			}
		}
		switchView(tabIndex);
	});

	function switchView(tabIndex) {
		$('#settings').children().addClass('hidden');
		installLogs.stop();

		if (tabIndex === 0) {
			components.reload();
			$('#components').removeClass('hidden');
		} else if (tabIndex === 1) {
			licenses.reload();
			$('#licenses').removeClass('hidden');
		} else if (tabIndex === 2) {
			$('#installLogs').removeClass('hidden');
			// installLogs.start();
		}
	}
});
