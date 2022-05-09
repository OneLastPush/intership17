//use if fixing/tetsing bugs in session manager on a machine without ibm-emm
var testData = {
	"cmd":"c:\\ibm\\emm\\Campaign\\bin\\unica_svradm \"-x\" \"status -d -v\" \"-y\" \"ganna\" \"-z\" \"******\"",
	stdout: "",
	"username":"ganna",
	"data": [{
		user: 'platform_adm',
		c: 'C',
		pid: '16268',
		port: '0ebf0',
		svr: '33',
		flowchart_name: 'Flowchart 1',
		type: 'Batch',
		campaign_code: 'C000000003',
		camp_id: '6',
		mode: 'Develo',
		writer: 'platform_adm',
		filename: 'C:\\ibm\\emm\\campaign\\partitions\\partition1\\campaigns\\test\\test_c000000003_flowchart 1.ses',
		section: 'active',
		start_time: '2016-06-02T18:30:20.000Z',
		duration: 1443333,
		cpu_uptime: 0.53125
	},{
		user: 'ganna',
		svr: '34',
		clientid: '1464893255526',
		section: 'client',
		c: 'C',
		pid: '20796',
		port: '0f09f',
		flowchart_name: '<login session>',
		type: '',
		campaign_code: '',
		camp_id: '0',
		mode: '',
		writer: '<no writer>',
		filename: '',
		start_time: '2016-06-02T18:47:59.000Z',
		duration: 384349,
		cpu_uptime: 0.15625
	},{
		user: 'platform_adm',
		svr: '33',
		clientid: '',
		section: 'client',
		start_time: '--',
		duration: '--',
		cpu_uptime: '--'
	}]
};

/**
 * Requires jquery, bootstrap, datatables, & contextMenu
 */
function SessionManager(opts){
	var sm = this;
	this.opts = $.extend(true, {
		pinned: false,
		sessions: true,
		users: false,
		durationWarning: function(data){
			return data > 0.5;
		}
	}, opts);
	this.pinned = [];

	//build
	this.$container = $('<div>');
	this.$table = $('<table>',{
		'class': 'table table-striped table-hover dt-responsive'
	});
	this.$table.attr('width', '100%'); //makes table auto-sizable by dataTables
	this.$table.attr('display', 'block');
	this.$extras = $('<div>',{'class': 'panel-body'});
	this.$container.append(this.$table, this.$extras);

	var columns = [{
		title: loc.js.manager.action, data: null, 'class': 'contextMenu', render: function(record){
			var statusData = sm.getStatusData(record);
			var $btn = $('<button>', {
				text: (statusData.status == 'Client'? 'End session': statusData.status)+' ',
				'class': 'col-xs-12 btn ' + statusData.btnColor
			});
			if(statusData.status != 'Client')
				$btn.append($('<span>',{'class': 'caret'}));
			return $btn[0].outerHTML;
		}
	}];
	var c = {
		flowchartType: {
			title: loc.js.manager.campaign_session, data: null, render: function(record){
				var $container = $('<a>',{
					'class': 'searchCS'
				});
				var name;
				if(record.filename)
					name = record.filename.match(/.+[\/\\](.+?)_/);
				if(name)
					$container.text(name[1] + (record.campaign_code? ' ('+record.campaign_code+')': ''));
				$container.attr('title', record.filename);
				return $container[0].outerHTML;
			}
		},
		flowchartName: {
			title: loc.js.manager.flowchart, data: 'flowchart_name', render: function(data, type, record){
				return $('<div>',{
					text: data,
					title: record.filename
				})[0].outerHTML;
			}, defaultContent: '--'
		},
		type: {
			title: loc.js.manager.type, data: null, render: function(record){
				var $container = $('<div>');
				if(record.flowchart_name == '<login session>')
					$container.text(loc.js.loginSession)
				else if(record.campaign_code)
					$container.text(loc.js.campaignFlowchart);
				else
					$container.text(loc.js.sessionFlowchart);
				if(record.filename)
					$container.attr('title', record.filename);
				return $container[0].outerHTML;
			}
		},
		user: {
			title: loc.js.manager.user, data: 'user', render: function(data, type, record){
				return $('<a>', {
					text: data,
					title: 'Type: ' + record.type,
					'class': 'searchUser'
				})[0].outerHTML;
			}
		},
		pid: {
			title: loc.js.manager.pid, data: 'pid', render: function(data, type, record){
				return $('<div>', {
					text: data,
					title: 'Port: ' + record.port
				})[0].outerHTML;
			}
		},
		startTime: {
			title: loc.js.manager.startTime, data: 'start_time', render: function(data, type, record){
				return isNaN(data)? data: new Date(data).toLocaleString();
			}, defaultContent: '--'
		},
		elapsedTime: {
			title: loc.js.manager.elapsedTime, data: 'duration', render: function(data, type, record){
				return $('<div>', {
					text: isNaN(data)? '--': secondsToReadable(data/1000),
					'class': sm.opts.durationWarning(data)? 'red': ''
				})[0].outerHTML;
			}, defaultContent: '--'
		},
		cpuUptime: {
			title: loc.js.manager.cpuUptime, data: 'cpu_uptime', render: function(data, type, record){
				return isNaN(data)? data: secondsToReadable(data)
			}, defaultContent: '--'
		},
		file: {
			title: loc.js.manager.file, data: 'filename', render: function(data, type, record){
				return $('<div>',{
					text: data,
					title: 'Type: ' + record.type
				})[0].outerHTML;
			}
		},
		campaignId: {
			title: loc.js.manager.id, data: 'camp_id', render: function(data, type, record){
				return $('<div>',{
					text: data,
					title: 'Type: ' + record.type
				})[0].outerHTML;
			}
		},
		clientId: {
			title: loc.js.manager.id, data: 'client_id', render: function(data, type, record){
				return $('<div>',{
					text: data,
					title: 'Type: ' + record.type
				})[0].outerHTML;
			}
		},
		svr: {
			title: loc.js.manager.svr, data: 'svr', render: function(data, type, record){
				return $('<div>',{
					text: data,
					title: 'Type: ' + record.type
				})[0].outerHTML;
			}
		},
		writer: {
			title: loc.js.manager.writer, data: 'writer', render: function(data, type, record){
				return $('<a>',{
					text: data? data.replace(/<|>/g,''): data,
					title: 'Type: ' + record.type,
					'class': 'searchUser'
				})[0].outerHTML;
			}
		}
	};
	if(sm.opts.sessions){
		columns.push(
			c.flowchartType,
			c.flowchartName,
			c.type,
			c.user,
			c.pid,
			c.startTime,
			c.elapsedTime,
			c.cpuUptime,
			c.file,
			c.campaignId,
			c.svr,
			c.writer);
	}
	if(sm.opts.users){
		columns.push(
			c.user,
			c.clientId,
			c.startTime,
			c.elapsedTime,
			c.cpuUptime,
			c.pid,
			c.svr);
	}
	this.dataTable = this.$table.DataTable({
		responsive: true,
		pageLength: 5,
		lengthMenu: [
			[5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, -1],
			[5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, loc.js.dataTable.all]
		],
		dom: "<'toolbar pull-left'><'pull-right' l>rtip",
		sAjaxDataProp: '', //ajax prop's cb function will traverse here for table data
		ajax: function(sendData, cb, settings){
			var counter = 1;
			var data = [];
			function doDone(err){
				if(err)
					return sm.dataTable.clear().draw(); //clears 'Loading...'
				if(--counter===0){
					sm.pinned.forEach(function(p){
						//if pinned item is not an already displayed item
						var found = false;
						data.forEach(function(r){
							if(r.filename && r.filename == p)
								found = true;;
						})
						if(found)
							return;

						//make a record for pinned item
						var record = {
							filename: p,
							section: 'Pinned'
						};
						var extractor = p.match(/.*[\\\/].+_(.+)_(.+)\./);
						if(extractor){
							record.campaign_code = extractor[1];
							record.flowchart_name = extractor[2];
						}
						data.push(record);
					});
					cb(data);
				}
			}
			if(sm.opts.pinned){
				counter++;
				$.ajax({
					url: '/db/internal/user/get/pinned',
					dataType: 'json',
					success: function(pins){
						sm.pinned = pins;
						doDone()
					},
					error: doDone
				});
			}
			$.ajax({
				url: '/emm/app/status',
				dataType: 'json',
				success: function(res){
					var resData = $.extend(true, [], res.data); //fixes datatables messing up their data if on same page
					if(!sm.opts.users){
						resData = resData.filter(function(v){ //true means keep
							return v.section != 'client';
						});
					}
					if(!sm.opts.sessions){
						resData = resData.filter(function(v){ //true means keep
							return v.flowchart_name == '<login session>';
						});
					}
					data.push.apply(data, resData);
					doDone();
				},
				error: doDone
			});
		},
		columns: columns,
		drawCallback: function(settings){
			//activates bootstrap tooltips
			sm.$table.find('[title]').tooltip({
				container: 'body'
			});
		},
		language: loc.js.dataTable
	});
	$.fn.dataTable.ext.errMode = 'throw'; //throw erors instead of showing alert boxes

	//load additional features
	this.reload = function(){
		//open previously opened rows?
		sm.dataTable.ajax.reload();
	}

	this.$toolbar = this.$table.parent().find('.toolbar');

	this.contextMenu();

	this.$search = this.search();
	this.$toolbar.append(this.$search);
	var $searchInput = this.$search.find('input');
	this.searchBy($searchInput, '.searchUser', 'Users');
	this.searchBy($searchInput, '.searchCS', 'Flowcharts');

	//save pagination setting, refresh rate setting in cookies

	return this;
};

SessionManager.prototype.getStatusData = function(record){
	var data = {
		status: 'Offline',
		btnColor: 'btn-default'
	};

	if(record.pid == -1){
		data.status = 'Invalid';
		data.btnColor = 'btn-dark';
	}else{
		switch(record.section){
			case 'active':
				if(record.c == 'D'){
					data.status = 'Active';
					data.btnColor = 'btn-success';
				}else if(record.writer == '<no writer>'){
					data.status = 'Viewing';
					data.btnColor = 'btn-success';
				}else{
					data.status = 'Running';
					data.btnColor = 'btn-info';
				}
			break;
			case 'suspended':
				data.status = 'Suspended';
				data.btnColor = 'btn-danger';
			break;
			case 'client':
				data.status = 'Client';
				data.btnColor = 'btn-warning';
			break;
		}
	}
	return data;
};

SessionManager.prototype.contextMenu = function(){
	var sm = this;
	this.contextMenu = new ContextMenu();
	this.contextMenu.items = {
		pin: {
			isValid: function(record){
				return record.filename? sm.pinned.indexOf(record.filename) === -1: false;
			},
			btn: (function(){
				return sm.contextMenu.createItem(loc.js.context.pin, actions.pin.icon, function(){
					var record = sm.contextMenu.data;
					actions.pin.act(record.filename, sm.reload);
				});
			})()
		},
		unpin: {
			isValid: function(record){
				return record.filename? sm.pinned.indexOf(record.filename) !== -1: false;
			},
			btn: (function(){
				return sm.contextMenu.createItem(loc.js.context.unpin, actions.unpin.icon, function(){
					var record = sm.contextMenu.data;
					actions.unpin.act(record.filename, sm.reload);
				});
			})()
		},
		logFile: {
			isValid: function(record, status){
				return status !== 'End session';
			},
			btn: (function(){
				return sm.contextMenu.createItem(loc.js.context.logFile, actions.logFile.icon, function(){
					var $this = $(this);
					var record = sm.contextMenu.data;
					var link = actions.logFile.link(record.filename);
					$this.attr('href', link);
					$this.attr('target', '_blank');
					return true;
				});
			})()
		},
		_1: sm.contextMenu.createDivider(),
		save: {
			isValid: function(record, status){
				return status === 'Active' || status === 'Running';
			},
			btn: (function(){
				return sm.contextMenu.createItem(loc.js.context.save, actions.save.icon, function(){
					var record = sm.contextMenu.data;
					actions.save.act(record.pid, sm.reload);
				});
			})()
		},
		trigger: {
			isValid: function(record, status){
				return status !== 'End session';
			},
			btn: (function(){
				return sm.contextMenu.createItem(loc.js.context.trigger, actions.trigger.icon, function(){
					var record = sm.contextMenu.data;
					actions.trigger.act(record.pid, sm.reload);
				});
			})()
		},
		_2: sm.contextMenu.createDivider(),
		run: {
			isValid: function(record, status){
				return status === 'Offline';
			},
			btn: (function(){
				return sm.contextMenu.createItem(loc.js.context.run, actions.run.icon, function(){
					var record = sm.contextMenu.data;
					actions.run.act(record.filename, sm.reload);
				});
			})()
		},
		suspend: {
			isValid: function(record, status){
				return status == 'Active' || status == 'Running';
			},
			btn: (function(){
				return sm.contextMenu.createItem(loc.js.context.suspend, actions.suspend.icon, function(){
					var record = sm.contextMenu.data;
					actions.suspend.act(record.pid, sm.reload);
				});
			})()
		},
		stop: {
			isValid: function(record, status){
				return status == 'Active' || status == 'Running';
			},
			btn: (function(){
				return sm.contextMenu.createItem(loc.js.context.stop, actions.stop.icon, function(){
					var record = sm.contextMenu.data;
					actions.stop.act(record.pid, sm.reload);
				});
			})()
		},
		kill: {
			isValid: function(record, status){
				return status !== 'Suspended' && status !== 'Offline';
			},
			btn: (function(){
				return sm.contextMenu.createItem(loc.js.context.kill, actions.kill.icon, function(){
					var record = sm.contextMenu.data;
					actions.kill.act(record.pid, sm.reload);
				});
			})()
		}
	};
	this.$table.find('tbody').on('click', 'td.contextMenu .btn', function(e){
		var $this = $(this);
		var status = $this.text().trim();
		var record = sm.dataTable.row($this.parents('tr:first')).data();

		if(status == 'End session'){ //status is action name for clients.. oops
			actions.kill.act(record.pid, sm.reload);
		}else{
			sm.contextMenu.data = record;
			sm.contextMenu.clear();
			var newItems = [];
			var cachedItems = sm.contextMenu.items;
			var itemsSinceLastDivider = 0;
			for(var f in cachedItems){
				if(f.startsWith('_')){
					if(itemsSinceLastDivider > 0){
						itemsSinceLastDivider = 0;
						newItems.push(cachedItems[f]);
					}
				}else if(!cachedItems[f].isValid || cachedItems[f].isValid(record, status)){
					itemsSinceLastDivider++;
					newItems.push(cachedItems[f].btn);
				}
			}
			sm.contextMenu.addItems(newItems);
			sm.contextMenu.show(e);
		}
	});
};
SessionManager.prototype.search = function(){
	var sm = this;
	var $grp = $('<div>',{'class':'input-group col-sm-4 col-xs-12'});
	var $span = $('<span>',{'class':'input-group-addon'});
	$span.append($('<span>',{'class':'fa fa-search'}));

	var $input = $('<input>',{
		placeholder: loc.js.dataTable.filterResults,
		'class':'form-control'
	});
	$input.on('input', function(){
		sm.dataTable.search($(this).val()).draw();
	});

	$grp.append($span, $input);
	return $grp;
};
SessionManager.prototype.searchBy = function($search, searchValueClass, switchToView){
	var $table = this.$table;
	$table.find('tbody').on('click', searchValueClass, function(e){
		var value = $(this).text();
		$search.val(value);
		$search.trigger('input');

		if(switchToView){
			var $types = $table.parent().find('.typeToggle');
			$types.filter(':not(.active):contains('+switchToView+')').trigger('click');
		}
	});
};