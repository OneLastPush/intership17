/**
 * Requires JQuery, underscore, and modal maker
 * @param {[type]} opts [description]
 */
function JSONBrowser(opts){
	var us = this;
	this.opts = {
		blueprint: undefined, // will order items based on blueprint and only allow editing what's in blueprint. Expects {}
		order: {}, //optional, will display items in this provided order
		getItemDataFn: undefined, //mandatory. Expects: function(listData, cb){cb({});}

		onChange: {}, //Will call after a value is changed. Expected { 'field.key': function(e, this, isDifferent, $container){}}
		placeHolders: {}, //Will put palcehodler in input. Expected { 'field.key': 'Enter X' }
		validators: {}, //provide validation functionality. Expects: { 'field.key': /\d/ }
		dropdowns: {}, //provides dropdown data. Expects: { 'field.key': ['A', 'B'] }
		toggleArrays: {}, //toggles yes to those sent in. Expects: { 'field.key': ['A', 'B'] }
		templates: {}, //custom template that overrules normal parsing/styling. Expects: function(data, path, events){ return $builtThing; }
		hide: [], //hides fields in this object. Expects: ['field.key']

		saveItemFn: undefined, //if here offers save btn. Expects:: function(index, oldData, newData, cb{
		deleteItemFn: undefined, //if here offers delete btn. Expects: function(index, oldData, cb){

		getDataFn: undefined, //optional. Expected []. If provided will list all. Expects: function(cb){cb('displayKey', [], optionalBadgeArrayCounterKeyOrFieldString);}

		msgs: {
			addNew: 'New', //only works in list/array/ getDataFn mode
			filter: 'Type to filter list', //only works in list/array/ getDataFn mode

			save: 'Save',
			saving: 'Saving...',
			remove: 'Delete',
			removing: 'Deleting...',
			clear: 'Cancel',

			unsavedTitle: 'You have unsaved changes',
			unsavedMsg: 'Are you sure you want to do that? There are unsaved changes and they will be lost.',
			unsavedDiscard: 'Discard changes',

			errorTitle: 'Error',
			errorMsg: 'You have unresolved errors. Please fix them first.',

			removeTitle: 'Are you sure?',
			removeMsg: 'This will delete this record permanently.',
			removeYes: 'Yes',
			removeNo: 'No',

			removeItem: 'Remove',
			addItem: 'Add',
			dropdownAdd: 'Choose an item to add',
			none: 'None',

			fields: {} //will localize fields in items using this, only for display expects dot notation for objects
		}
	};
	this.setOpts(opts);
	this.data = {
		list: [],
		item: {
			index: 0,
			original: undefined,
			active: undefined
		}
	};

	//events
	this.events = {
		list : {
			search: function(){ //filters list items
				var $this = $(this);
				var $input = $this.closest('div').find('input');
				var search = $input.val().toLowerCase();
				var showAll = false;
				if(search.length === 0)
					showAll = true;
				$this.closest('.list-group').find('a').each(function(){
					var $a = $(this);
					if(showAll)
						return $a.show();
					var value = $a.text().toLowerCase();
					if(value.indexOf(search) === -1)
						$a.hide();
					else
						$a.show();
				});
			},
			clearSearch: function(){
				var $input = $(this).closest('div').find('input');
				$input.val('');
				us.events.list.search();
			},
			select: function(){ //selects a list item & shows its item details
				var $this = $(this);
				us.data.item.index = $this.data('index');
				us.loadItem(us.data.list[us.data.item.index]);
			},
		},
		item: {
			save: function(){
				var $errors = us.$container.find('.has-error');
				if($errors.length === 0)
					us.opts.saveItemFn(us.data.item.index, us.data.item.original, us.data.item.active, function(){
						us.load.apply(us);
					});
				else{
					modal.make({
						titleText: us.opts.msgs.errorTitle,
						msg: us.opts.msgs.errorMsg
					});
				}
			},
			remove: function(){
				modal.make({
					titleText: us.opts.msgs.removeTitle,
					msg: us.opts.msgs.removeMsg,
					btns: [{
						name: us.opts.msgs.removeYes,
						action: function(){
							us.opts.deleteItemFn(us.data.item.index, us.data.item.original, function(){
								us.load.apply(us);
							});
						}
					}],
					closeBtn: us.opts.msgs.removeNo
				});
			},
			clear: function(){
				us.data.item.active = $.extend(true, {}, us.data.item.original);
				us.buildItem(us.data.item.active);
			},
			unsavedCheck: function(nextFn){
				var hasUnsaved = us.$container.find('.has-success, .has-error').length > 0;
				if(!hasUnsaved){
					if(nextFn)
						nextFn();
					return;
				}
				modal.make({
					titleText: us.opts.msgs.unsavedTitle,
					msg: us.opts.msgs.unsavedMsg,
					btns: [{
						name: us.opts.msgs.unsavedDiscard,
						action: nextFn
					}]
				});
			}
		},
		details: {
			validate: function(){
				var $this = $(this);
				var $container = $this.parents('.form-group:first .array-container:first');
				var path = $this.data('path');
				var value = $this.val();
				var valid = us.opts.validators[path]? (value.match(us.opts.validators[path])? true: false): true;
				if(valid)
					$container.removeClass('has-error');
				else
					$container.addClass('has-error');
			},
			isChanged: function(e){ //checks vs old data and adds .has-success if changed
				var $this = $(this);
				var $container = $this.parents('.form-group:first');
				var path = $this.data('path');
				var different = us.isDiff(path);
				if(different)
					$container.addClass('has-success');
				else
					$container.removeClass('has-success');

				if(us.opts.onChange[path])
					us.opts.onChange[path](e, this, different, $container);
			},
			update: function(){ //updates key-value or dropdown
				var $this = $(this);
				var path = $this.data('path');
				us.util.set(path, us.data.item.active, $this.val());
			},
			toggle: function(){ //toggles array
				var $this = $(this);
				var $container = $this.parents('.array-container');
				var path = $container.data('path');
				var value = $this.clone().children().remove().end().text(); //only gets value from this element no kids
				var $badge = $this.find('.badge');

				var data = us.util.get(path, us.data.item.active);
				if($badge.hasClass('alert-success'))
					data.splice(data.indexOf(value), 1); //remove
				else
					data.push(value); //add

				//rebuild array
				var $container2 = us.buildComponentArray(data, path);
				$container.before($container2);
				$container.off().remove();

				$container2.one('change', us.events.details.isChanged);
				$container2.trigger('change');
			},
			add: function(){ //add element to array
				var $this = $(this);
				$this.tooltip('destroy');
				var $container = $this.parents('.array-container');
				var path = $container.data('path');

				var value = $this.val() || $this.parent().parent().find('input').val();
				if(value == undefined || value.length == 0)
					return;

				var data = us.util.get(path, us.data.item.active);
				if(value instanceof Array){
					value.forEach(function(v){
						data.push(v);
					});
				}else{
					data.push(value);
				}

				//rebuild array
				var $container2 = us.buildComponentArray(data, path);
				$container.before($container2);
				$container.off().remove();

				$container2.one('change', us.events.details.isChanged);
				$container2.trigger('change');
			},
			remove: function(){ //remove element from array
				var $this = $(this);
				$this.tooltip('destroy');
				var $container = $this.parents('.array-container');
				var path = $container.data('path');
				var index = $this.data('index');

				var data = us.util.get(path, us.data.item.active);
				data.splice(index, 1);

				//rebuild array
				var $container2 = us.buildComponentArray(data, path);
				$container.before($container2);
				$container.off().remove();

				$container2.one('change', us.events.details.isChanged);
				$container2.trigger('change');
			}
		}
	}

	//build base
	this.$container = $('<div>');
	if(this.opts.getDataFn){ //sidebar
		var $listContainer = $('<div>', {
			'class': 'list-group col-sm-12 col-md-4 col-lg-3'
		});

		//search
		var $search = $('<div>', {
			'class': 'input-group'
		});
		var $input = $('<input>', {
			'type': 'text',
			'class': 'form-control',
			'placeholder': this.opts.msgs.filter
		});
		var $clear = $('<button>', {
			'class': 'btn btn-default',
			'type': 'button'
		});
		$clear.append($('<span>', {
			'class': 'glyphicon glyphicon-remove'
		}));
		$input.on('keyup', this.events.list.search);
		$clear.on('click', this.events.list.clearSearch);
		var $grp = $('<span>', {
			'class': 'input-group-btn'
		});
		$grp.append($clear);
		$search.append($input);
		$search.append($grp);
		$listContainer.append($search);

		//list
		this.$list = $('<div>',{
			'class': 'max-height-400 overflow'
		});
		$listContainer.append(this.$list);
		this.$container.append($listContainer);
	}
	//item
	this.$item = $('<div>', {
		'class': 'form-group ' + (this.opts.getDataFn? 'col-sm-12 col-md-8 col-lg-9': 'col-xs-12')
	});
	this.$container.append(this.$item);

	return this;
}
JSONBrowser.prototype.setOpts = function(opts){
	var newOpts = $.extend({}, this.opts, opts);
	newOpts.msgs = $.extend(true, {}, this.opts.msgs, opts.msgs);
	this.opts = newOpts;
};
JSONBrowser.prototype.util = {
	get: function(path, obj){
		var res = obj;
		path.split('.').forEach(function(f){
			if(!res){
				console.log('Couldn\'t find ' + path);
				return;
			}
			res = res[f];
		});
		return res;
	},
	set: function(path, obj, value){
		var res = obj;
		var paths = path.split('.');
		var last = paths.pop();
		paths.forEach(function(f){
			res = res[f];
		});
		res[last] = value;
	}
};
JSONBrowser.prototype.isDiff = function(path){
	var orig = this.util.get(path, this.data.item.original);
	var now = this.util.get(path, this.data.item.active);
	if(orig instanceof Array && now instanceof Array){
		if(orig.length !== now.length)
			return true;
		var different = false;
		for(var i=0; i<orig.length; i++){
			if(this.isDiff(path+'.'+i))
				different = true;
		}
		return different;
	}
	return !_.isEqual(orig, now);
};
JSONBrowser.prototype.isChangeable = function(path){
	var blueprint = this.util.get(path, this.opts.blueprint);
	return blueprint != undefined;
}
JSONBrowser.prototype.buildList = function(primary, badge){
	var that = this;
	this.$list.off().empty(); //clear

	var $lgi;
	//add new item button
	if(this.opts.blueprint){
		$lgi = $('<a>', {
			'class': 'list-group-item'
		});
		$lgi.append($('<span>', {
			'class': 'fa fa-plus'
		}));
		$lgi.append(' ' + this.opts.msgs.addNew);
		$lgi.on('click', this.events.list.select);
		this.$list.append($lgi);
	}
	//existing items
	this.data.list.forEach(function(item, i){
		$lgi = $('<a>', {
			text: that.util.get(primary, item),
			'class': 'list-group-item list-group-item-fix' //TODO list-group-item-fix?
		});
		if(badge){
			$lgi.append($('<span>', {
				'class': 'badge',
				text: that.util.get(badge, item).length
			}));
		}

		$lgi.data('index', i);
		$lgi.on('click', that.events.list.select);
		that.$list.append($lgi);
	});
};
JSONBrowser.prototype.buildItem = function(item){
	this.$item.off().empty(); //clear
	this.buildActions(item);

	//build existing or make new from blueprint
	var data = item || $.extend(true, {}, this.opts.blueprint);

	//build order
	var buildOrder = $.extend(true, {}, this.opts.order, data); //order, then etc data. Does deep ordering.
	//build
	this.$item.append(this.buildComponent(data, '', buildOrder));

	//trigger on change events in case hide/show fields
	this.$item.find('input, .selectpicker').trigger('change');
};
JSONBrowser.prototype.buildActions = function(item){
	var $container = $('<div>', {'class': 'form-group btn-group pull-right'});
	var $btn;
	if(this.opts.saveItemFn){
		$btn = this.buildButton('fa fa-floppy-o').find('.btn');
		$btn.append(' ' + this.opts.msgs.save);
		$btn.attr('data-loading-text', this.opts.msgs.saving);
		$btn.on('click', this.events.item.save);
		$container.append($btn);
	}
	if(item && this.opts.deleteItemFn){
		$btn = this.buildButton('fa fa-trash-o').find('.btn');
		$btn.append(' ' + this.opts.msgs.remove);
		$btn.attr('data-loading-text', this.opts.msgs.removing);
		$btn.on('click', this.events.item.remove);
		$container.append($btn);
	}
	$btn = this.buildButton('fa fa-ban').find('.btn');
	$btn.append(' ' + this.opts.msgs.clear);
	$btn.on('click', this.events.item.clear);
	$container.append($btn);

	this.$item.append($container);
	this.$item.append($('<div>', {'class': 'row'}));
};
JSONBrowser.prototype.buildButton = function(spanClasses){
	var $grp = $('<div>', {'class': 'input-group-btn'});
	var $btn = $('<div>', {'class': 'btn btn-default'});
	var $icon = $('<span>', {'class': spanClasses});
	$grp.append($btn);
	$btn.append($icon);
	return $grp;
};
JSONBrowser.prototype.buildComponent = function(obj, path, order){
	var $obj;
	if(obj instanceof Array){
		$obj = this.buildComponentArray(obj, path);
	}else if(typeof obj == 'object'){
		$obj = this.buildComponentObject(obj, path, order);
	}else{
		$obj = this.buildComponentValue(obj, path);
	}
	return $obj;
};
JSONBrowser.prototype.buildComponentObject = function(obj, path, ordered){
	var $container = $('<div>');

	for(var f in ordered){
		var item = obj[f];
		var path2 = path + (path.length > 0? '.': '') + f;
		var $kv = $('<div>', {'class': 'form-group'});

		var key = this.opts.msgs.fields[path2] || f;
		if(this.opts.templates[path2]){ //is custom template
			$kv.append(this.opts.templates[path2](item, path2, this.events.details));
		}else if(this.opts.hide.indexOf(path2) !== -1){ //is hidden
			console.log('Hidden field ' + path2);
			continue;
		}else{ //is normal
			if(!(item instanceof Array) && typeof item == 'object'){ //object but not array = header
				$kv.append($('<h4>', {
					text: key
				}));
			}else{
				//display key
				$kv.addClass('input-group');
				$kv.append($('<span>', {
					text: key,
					'class': 'input-group-addon'
				}));
			}
			//make value
			$kv.append(this.buildComponent(item, path2, ordered[f]));
		}
		$container.append($kv);
	}
	return $container;
};
JSONBrowser.prototype.buildComponentArray = function(obj, path){
	var that = this;
	var $container;

	if(this.opts.toggleArrays[path]){ //toggles
		var notActive = [];
		this.opts.toggleArrays[path].forEach(function(item){
			if(obj.indexOf(item) === -1)
				notActive.push(item);
		});
		obj.sort();
		notActive.sort();

		$container = $('<div>');
		obj.forEach(function(item){
			var $val = $('<span>', {
				'class': 'form-control',
				text: item
			});
			$val.append($('<span>', {
				'class': 'badge pull-right alert-success',
				text: '✓'
			}));
			var $grp = $('<div>',{
				'class': 'input-group col-xs-12'
			});
			$grp.append($val);
			$container.append($grp);
		});
		notActive.forEach(function(item){
			var $val = $('<span>', {
				'class': 'form-control',
				text: item
			});
			$val.append($('<span>', {
				'class': 'badge pull-right alert-danger',
				text: 'x'
			}));
			var $grp = $('<div>',{
				'class': 'input-group col-xs-12'
			});
			$grp.append($val);
			$container.append($grp);
		});
		if(this.isChangeable(path))
			$container.children().children().on('click', this.events.details.toggle);
	}else{ //value
		$container = $('<div>');
		obj.forEach(function(item){
			var $val = $('<span>', {
				'class': 'form-control',
				text: item
			});
			var $grp = $('<div>',{
				'class': 'input-group col-xs-12'
			});
			$grp.append($val);
			$container.append($grp);
		});
		if(this.isChangeable(path)){
			//delete entry
			$container.children().each(function(index, grp){
				var $btn = that.buildButton('fa fa-times text-warning');
				$btn.tooltip({
					title: that.opts.msgs.removeItem,
					container: 'body'
				});
				$btn.data('index', index);
				$btn.on('click', that.events.details.remove);
				$(grp).append($btn);
			});
			//add entry
			if(that.opts.dropdowns[path]){
				var addable = [];
				that.opts.dropdowns[path].forEach(function(item){
					if(obj.indexOf(item) === -1)
						addable.push(item);
				});
				if(addable.length > 0){
					var $select = $('<select>', {
						'class': 'form-control selectpicker',
						'data-live-search': true,
						'title': that.opts.msgs.dropdownAdd
					});
					$select.prop('multiple', true);
					addable.forEach(function(v){
						$select.append($('<option>', {
							text: v,
							value: v
						}));
					});
					var $grp = $('<div>', {
						'class': 'input-group-col-xs-12'
					});
					$grp.append($select);
					$container.append($grp);
					$select.on('change', that.events.details.add);
				}
			}else{
				var $input = $('<input>', {
					type: 'text',
					'class': 'form-control'
				});
				var $btn = that.buildButton('fa fa-plus');
				$btn.tooltip({
					title: that.opts.msgs.addItem,
					container: 'body'
				});
				$btn.on('click', that.events.details.add);
				var $grp = $('<div>', {
					'class': 'input-group col-xs-12'
				});
				$grp.append($input);
				$grp.append($btn);
				$container.append($grp);
			}
		}else if(obj.length == 0){
			var $val = $('<span>', {
				'class': 'form-control',
				text: this.opts.msgs.none
			});
			var $grp = $('<div>',{
				'class': 'input-group col-xs-12'
			});
			$grp.append($val);
			$container.append($grp);
		}
	}
	$container.data('path', path);
	$container.addClass('array-container');
	$container.find('.selectpicker').selectpicker('refresh');

	return $container;
};
JSONBrowser.prototype.buildComponentValue = function(v, path){
	var $value;
	if(this.opts.dropdowns[path]){
		$value = $('<select>', {
			'class': 'form-control selectpicker',
			'data-live-search': true
		});
		this.opts.dropdowns[path].forEach(function(item){
			$value.append($('<option>', {
				text: item,
				value: item
			}));
		});
		$value.val(v);
	}else{
		$value = $('<input>', {
			type: path.match(/password/i)? 'password': 'text',
			'class': 'form-control'
		});
		$value.val(v);
	}
	if(!this.isChangeable(path))
		$value.prop('disabled', true);
	else{
		if(this.opts.placeHolders[path])
			$value.attr('placeholder', this.opts.placeHolders[path]);
		if(this.opts.validators[path])
			$value.on('input', this.events.details.validate);
	}
	$value.data('path', path);
	$value.on('input change', this.events.details.update);
	$value.on('input change', this.events.details.isChanged);

	return $value;
};
JSONBrowser.prototype.load = function(){
	var us = this;
	if(this.opts.getDataFn){
		this.opts.getDataFn(function(primary, data, badge){
			us.data.list = data;
			us.buildList(primary, badge);
			if(data.length < us.data.item.index)
				us.data.item.index = 0;
			us.loadItem(us.data.list[us.data.item.index]);
		});
	}else
		this.loadItem(true);
};
JSONBrowser.prototype.loadItem = function(item){
	var us = this;
	if(item){
		this.opts.getItemDataFn(item, function(item){
			us.data.item.original = item;
			us.data.item.active = $.extend(true, {}, item);
			us.buildItem(us.data.item.active);
		});
	}else if(item == true){
		this.opts.getItemDataFn(item, function(item){
			us.data.item.original = item;
			us.data.item.active = $.extend(true, {}, item);
			us.buildItem(us.data.item.active);
		});
	}else{
		us.data.item.original = undefined;
		us.data.item.active = $.extend(true, {}, us.opts.blueprint);
		us.buildItem(us.data.item.active);
	}
};