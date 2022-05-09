/**
 * Requires JSONBrowser
 * @param  {[type]}   all [if to display all users or just one]
 * @param  {[type]}   loc [localization values for the fields]
 * @param  {Function} cb  [callback that will return JSOnBrowser instance]
 * @return {[type]}       [description]
 */
function groupDisplayer(all, loc, cb){
	this.all = all;

	var counter = 2;
	var blueprint, permissions, users;
	function doDone(){
		if(--counter===0){
			var order = $.extend(true, {}, blueprint);
			var group = make(blueprint, order, permissions);
			group.load();
			cb(group);
		}
	}
	$.ajax({
		url: '/db/internal/group/blueprint',
		dataType: 'json',
		success: function(data){
			blueprint = data;
			doDone();
		}
	});
	$.ajax({
		url: '/db/internal/permission/get/all',
		dataType: 'json',
		success: function(data){
			permissions = data;
			doDone();
		}
	});

	function make(blueprint, order, permissions){
		var jsonBrowser;
		var msgs = $.extend(true, {}, loc.generic);
		msgs.fields = loc.groups;
		var opts = {
			blueprint: blueprint,
			order: order,
			getItemDataFn: function(listData, cb){
				var sendData = {};
				if(listData && listData.Name)
					sendData.group = listData.Name;
				var group;
				var counter = 2;
				function doDone(){
					if(--counter===0)
						cb(group);
				}
				$.ajax({ //updates usernames every time loads a group
					url: '/db/internal/user/get/all/name',
					dataType: 'json',
					success: function(data){
						jsonBrowser.setOpts({
							dropdowns: {
								Users: data
							}
						});
						doDone();
					}
				});
				$.ajax({
					url: '/db/internal/group/get',
					dataType: 'json',
					data: sendData,
					success: function(data){
						group = data;
						doDone();
					}
				});
			},
			toggleArrays: {
				'Permissions': permissions
			},
			templates: {
				'File system permissions': function(data, path, events){
					var $container = $('<div>');
					$container.data('path', path);
					$container.on('change', events.isChanged);

					function btnToggle(e){
						if(!$(e.target).is('input'))
							$(this).find('input').trigger('click');
					}
					function update(){
						var $this = $(this);
						var $container = $this.parents('.form-group:first');
						var data = $container.data('data');
						var path = $this.data('path');
						var val = $this.val();
						if($this.is('[type="checkbox"]'))
							val = $this.is(':checked');
						else if($this.is('[type="number"]'))
							val = parseInt(val);
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
					function buildToggle(data, path, iconClass, text){
						var $btn = $('<div>', {
							'class': 'btn btn-default'
						});
						$btn.tooltip({
							title: text
						});
						var $check = $('<input>', {
							type: 'checkbox'
						});
						if(data[path] == true)
							$check.prop('checked', 'true');
						$check.data('path', path);
						$check.on('change', update);
						$btn.append($check, $('<span>', {
							'class': iconClass
						}));
						$btn.on('click', btnToggle);
						return $btn;
					}
					function buildEntry(index, data, $btn){
						var $grp = $('<div>', {
							'class': 'input-group form-group col-xs-12'
						});
						$grp.data('data', data);
						$grp.data('index', index);

						//row1
						var $row = $('<div>', {
							'class': 'input-group'
						});
						var $path = $('<input>', {
							value: data.Path,
							'class': 'form-control'
						});
						$path.data('path', 'Path');
						$path.on('change', update);

						if(index === -1)
							$row.append($btn, $path);
						else
							$row.append($path, $btn);
						$grp.append($row);

						//row2
						$row = $('<div>', {
							'class': 'input-group col-xs-offset-4 col-xs-8'
						});

						//rank
						var $rank = $('<input>', {
							type: 'number',
							value: data.Rank,
							'class': 'form-control'
						});
						$rank.tooltip({
							title: loc.groups.orderranking
						});
						$rank.data('path', 'Rank');
						$rank.on('change', update);

						//toggles
						var $toggles = $('<div>', {
							'class': 'input-group-btn'
						});
						$toggles.append(buildToggle(data, 'Can download', 'fa fa-download', loc.groups.candownload));
						$toggles.append(buildToggle(data, 'Can upload', 'fa fa-upload', loc.groups.canupload));
						$toggles.append(buildToggle(data, 'Can archive', 'fa fa-briefcase', loc.groups.canarchive));
						$toggles.append(buildToggle(data, 'Can delete', 'fa fa-trash', loc.groups.candelete));
						$toggles.append(buildToggle(data, 'Propogate to subfolders', 'fa fa-sitemap', loc.groups.propagate));
						$row.append($rank, $toggles);

						$grp.append($row);
						return $grp;
					}

					function build(){
						$container.append($('<h4>', {
							text: loc.groups['File system permissions']
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
							'Can archive': true,
							'Can delete': true,
							'Can download': true,
							'Can upload': true,
							'Propogate to subfolders': true,
							Rank: 0,
							Path: ''
						}, $add));
					}
					build();

					return $container;
				}
			},
			hide: ['_id'],
			saveItemFn: function(index, oldData, newData, cb){
				var sendData = {};
				if(oldData && oldData.Name)
					sendData.group = oldData.Name;
				sendData.data = newData;
				$.ajax({
					url: '/db/internal/group/set',
					dataType: 'json',
					data: sendData,
					complete: cb
				});
			},
			msgs: msgs
		};
		if(all){
			opts.deleteItemFn = function(index, oldData, cb){
				$.ajax({
					url: '/db/internal/group/remove',
					dataType: 'json',
					data: {
						group: oldData.Name
					},
					complete: cb
				});
			}
			opts.getDataFn = function(cb){
				$.ajax({
					url: '/db/internal/group/get/all',
					dataType: 'json',
					success: function(data){
						cb('Name', data, 'Users');
					}
				});
			}
		}
		jsonBrowser = new JSONBrowser(opts);
		return jsonBrowser;
	};
}