/**
 * Requires JSONBrowser
 * @param  {[type]}   all [if to display all users or just one]
 * @param  {[type]}   loc [localization values for the fields]
 * @param  {Function} cb  [callback that will return JSOnBrowser instance]
 * @return {[type]}       [description]
 */
function userDisplayer(all, loc, cb){
	this.all = all;
	$.ajax({
		url: '/db/internal/user/blueprint',
		dataType: 'json',
		success: function(blueprint){
			var order = $.extend(true, {}, blueprint);
			blueprint.Bookmarks = [];
			if(!all){
				delete blueprint.Username;
				delete blueprint.Status;
				delete blueprint['Authentication Service'];
			}else{
				blueprint['Groups & Permissions'] = {
					Groups: []
				};
			}
			var account = make(blueprint, order);
			account.load();
			cb(account);
		}
	});

	function inputMatchError(){
		var $container = $(this).parents('.form-group:first');
		var $pw = $container.find('input:first');
		var $confirm = $container.find('.confirmation');
		if($pw.val() == $confirm.val())
			$container.removeClass('has-error');
		else
			$container.addClass('has-error');
	}
	function passwordConfirmation(e, dom, isDifferent, $container){
		var $this = $(dom);
		var $confirm = $container.find('.confirmation');
		if(isDifferent){
			if($confirm.length === 0){ //make
				$confirm = $('<input>',{
					type: 'password',
					'class': 'form-control confirmation'
				});
				$this.on('input', inputMatchError);
				$confirm.on('input', inputMatchError);
				$container.append($confirm);
			}
		}else{
			$container.removeClass('has-error');
			$this.unbind('input', inputMatchError);
			$confirm.off().remove();
		}
	}

	function make(blueprint, order){
		var jsonBrowser;
		var msgs = $.extend(true, {}, loc.generic);
		msgs.fields = loc.users;
		var dropdowns = {
			Language: ['English', 'French'],
			'Authentication Service': ['Internal', 'LDAP', 'IBM EMM']
		};
		var hide = ['_id'];
		var opts = {
			blueprint: blueprint,
			order: order,
			getItemDataFn: function(listData, cb){
				var sendData = {};
				if(listData && listData.Username)
					sendData.username = listData.Username;
				$.ajax({
					url: '/db/internal/user/get',
					dataType: 'json',
					data: sendData,
					success: function(user){
						user['Groups & Permissions'] = {};

						var counter = 3;
						function doDone(){
							if(--counter === 0)
								cb(user);
						}

						$.ajax({
							url: '/db/internal/group/get/user',
							dataType: 'json',
							data: sendData,
							success: function(groups){
								user['Groups & Permissions'].Groups = groups;
								doDone();
							},
						});
						$.ajax({
							url: '/db/internal/group/get/permissions',
							dataType: 'json',
							data: sendData,
							success: function(permissions){
								user['Groups & Permissions'].Permissions = permissions;
								doDone();
							},
						});
						$.ajax({
							url: '/db/internal/group/get/all/name',
							dataType: 'json',
							success: function(data){
								dropdowns['Groups & Permissions.Groups'] = data;
								jsonBrowser.setOpts({
									dropdowns: dropdowns
								});
								doDone();
							}
						});
					}
				});
			},
			onChange: {
				'Authentication Service': function(e, dom, isDifferent, $container){
					var value = $(dom).val();
					var $password = jsonBrowser.$container.find('[type="Password"]:first');
					var $passwordContainer = $password.parents('.form-group:first');
					if(!$passwordContainer.is('.hidden')){
						if(value != 'Internal'){ //hide password
							$passwordContainer.addClass('hidden');
							$password.val(''); //clear
							$passwordContainer.removeClass('has-error has-success');
						}
					}else{
						if(value == 'Internal') //show password
							$passwordContainer.removeClass('hidden');
					}
				},
				Password: passwordConfirmation,
				'IBM Marketing.Password': passwordConfirmation
			},
			placeHolders: {
				'Phone.Office': '(1-)123-456-7890',
				'Phone.Mobile': '(1-)123-456-7890'
			},
			validators: {
				'Phone.Office': /(^(\d{1}\-){0,1}\d{3}\-\d{3}\-\d{4}$)/,
				'Phone.Mobile': /(^(\d{1}\-){0,1}\d{3}\-\d{3}\-\d{4}$)/,
				Email: /(^\S+@\S+\.\S+$|^\s*$)/
			},
			dropdowns: dropdowns,
			templates: {
				Bookmarks: function(data, path, events){
					var $container = $('<div>');
					$container.data('path', path);
					$container.on('change', events.isChanged);
					$container.on('change', function(){
						$container.find('.form-group').each(function(){
							var $this = $(this);
							if($this.data('index') === -1)
								return;
							var $inputs = $this.find('input');
							var empty = false;
							$inputs.each(function(){
								if($(this).val().trim().length == 0)
									empty = true;
							});
							if(empty)
								$this.addClass('has-error');
							else
								$this.removeClass('has-error');
						});
					});

					function update(){
						var $this = $(this);
						var $container = $this.parents('.form-group:first');
						var data = $container.data('data');
						var path = $this.data('path');
						var val = $this.val();
						if(path == 'value'){
							if(!val.match(/^http[s]?:\/\//)){
								val = 'http://' + val;
								$this.val(val);
							}
						}
						data[path] = val;
						$container.trigger('change');
					}
					function remove(){
						var $grp = $(this).parents('.form-group:first');
						data.splice($grp.data('index'), 1);
						rebuild();
						$container.trigger('change');
					}
					function add(){
						var $grp = $(this).parents('.form-group:first');
						var entry = $grp.data('data');
						data.push(entry);
						rebuild();
						$container.trigger('change');
					}

					function rebuild(){
						$('body').tooltip('destroy');
						$container.children().off()
						$container.empty();
						build();
					}

					function buildEntry(index, data, $btn){
						var $grp = $('<div>', {
							'class': 'form-group col-xs-12 no-padding'
						});
						$grp.data('data', data);
						$grp.data('index', index);

						//key
						var $key = $('<input>', {
							'class': 'form-control',
							value: data.key,
							placeholder: loc.users.bookmarksKeyPlaceholder
						});
						$key.data('path', 'key');
						$key.on('change', update);
						var $keyWrapper = $('<div>', {
							'class': 'col-xs-4 no-padding'
						});
						$keyWrapper.append($key);

						//value
						var $value = $('<input>', {
							'class': 'form-control',
							value: data.value,
							placeholder: loc.users.bookmarksValuePlaceholder
						});
						$value.data('path', 'value');
						$value.on('change', update);
						var $valueWrapper = $('<div>', {
							'class': 'col-xs-8 no-padding input-group'
						});
						$valueWrapper.append($value, $btn);

						$grp.append($keyWrapper, $valueWrapper);
						return $grp;
					}

					function build(){
						$container.append($('<h4>', {
							text: loc.users.Bookmarks
						}));
						data.forEach(function(d, i){
							var $remove = jsonBrowser.buildButton('fa fa-times text-warning');
							$remove.find('span').tooltip({
								title: loc.remove
							});
							$remove.on('click', remove);
							$container.append(buildEntry(i, d, $remove));
						});
						//adding row
						var $add = jsonBrowser.buildButton('fa fa-plus text-success');
						$add.find('span').tooltip({
							title: loc.add
						});
						$add.on('click', add);
						$container.append(buildEntry(-1, {
							key: '',
							value: ''
						}, $add))
					}
					build();
					return $container;
				},
			},
			hide: hide,
			saveItemFn: function(index, oldData, newData, cb){
				var sendData = {};
				if(oldData && oldData.Username)
					sendData.username = oldData.Username;
				sendData.data = $.extend(true, {}, newData);
				sendData.groups = newData['Groups & Permissions'].Groups;

				//delete misc dtaa not belonging to users
				delete sendData.data['Groups & Permissions'];

				//delete fabricated data
				if(sendData.data.Password === '******')
					delete sendData.data.Password;
				if(sendData.data['IBM Marketing'].Password === '******')
					delete sendData.data['IBM Marketing'].Password;

				var counter = 1;
				if(all)
					counter++;
				function doDone(){
					if(--counter===0)
						cb();
				}
				$.ajax({
					url: '/db/internal/user/set',
					dataType: 'json',
					data: sendData,
					complete: doDone
				});
				if(all){
					$.ajax({
						url: '/db/internal/group/sync',
						dataType: 'json',
						data: sendData,
						complete: doDone
					});
				}
			},
			msgs: msgs
		};
		if(all){
			opts.deleteItemFn = function(index, oldData, cb){
				$.ajax({
					url: '/db/internal/user/remove',
					dataType: 'json',
					data: {
						username: oldData.Username
					},
					complete: cb
				});
			}
			opts.getDataFn = function(cb){
				$.ajax({
					url: '/db/internal/user/get/all/name',
					dataType: 'json',
					success: function(data){
						var listData = [];
						data.forEach(function(username){
							listData.push({Username: username});
						});
						cb('Username', listData);
					}
				});
			}
		}
		jsonBrowser = new JSONBrowser(opts);
		return jsonBrowser;
	};
}