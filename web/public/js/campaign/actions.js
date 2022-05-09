var util = {
	partitionPath: function(path){
		var data = {};
		data.path = path;
		data.relPath = path.match(/campaign[\/\\]partitions[\/\\](.+)/i)[1];
		data.partition = data.relPath.match(/(.+?)[\/\\]/)[1];
		data.partitionPath = data.relPath.match(/[\/\\](.+)/)[1];
		return data;
	},
	download: function(type, path){
		var $form = $('<form>',{
			action: '/fs/download',
			method: 'POST'
		});
		$form.append($('<input>',{
			type: 'hidden',
			name: type,
			value: path
		}));
		$form.submit();
	}
};
var actions = {
	logFile: {
		baseIcon: 'glyphicon glyphicon-eye-open',
		icon: 'glyphicon glyphicon-eye-open blue',
		link: function(flowchartPath){
			return 'log_viewer.html?file='+flowchartPath+'&logType=/emm/app/process';
		}
	},
	trigger: {
		icon: 'fa fa-bullseye blue',
		act: function(pid, cb){
			$('body').append(new InboundTrigger(pid, cb));
		}
	},
	run: {
		baseIcon: 'fa fa-toggle-right',
		icon: 'fa fa-toggle-right dark-green',
		link: function(path){
			var pathData = util.partitionPath(path);
			return 'run.html?file='+pathData.partitionPath+'&partition='+pathData.partition;
		},
		act: function(path, cb){
			var custStatuser = $.extend({
				200 : function(errRes, status, res){
					var msg = loc.js.run.success;
					custResHandler(msg, res.responseText.replace(/\n/g, "<br/>"));
				},
				202 : function(obj, status, res){
					var msg = loc.js.run.alreadyRunning;
					custResHandler(msg, res.responseText.replace(/\n/g, "<br/>"));
				},
				400 : function(errRes, status, res){
					var msg = loc.js.run.error;
					custResHandler(msg, errRes.responseText.replace(/\n/g, "<br/>"));
				},
				605 : function(errRes, status, res){
					var msg = loc.js.run.cannotOpen
					custResHandler(msg, errRes.responseText.replace(/\n/g, "<br/>"));
				}
			}, statusHandler);
			var pathData = util.partitionPath(path);
			$.ajax({
				url: '/emm/app/process/run',
				data: {partition: pathData.partition, flowchartPath: pathData.partitionPath},
				complete: cb,
				statusCode: custStatuser
			});
		}
	},
	pin: {
		baseIcon: 'fa fa-laptop',
		icon: 'fa fa-laptop blue',
		act: function(flowchartPath, cb){
			$.ajax({
				url:'/db/internal/user/add/pinned',
				data: {pinned: flowchartPath},
				complete: cb
			});
		}
	},
	unpin: {
		baseIcon: 'fa fa-laptop',
		icon: 'fa fa-laptop text-warning',
		act: function(flowchartPath, cb){
			$.ajax({
				url:'/db/internal/user/remove/pinned',
				data: {pinned: flowchartPath},
				complete: cb
			});
		}
	},
	contents: {
		icon: 'fa fa-file-text-o',
		link: function(path){
			return 'ascii_viewer.html?path='+path;
		}
	},
	report: {
		icon: 'fa fa-info-circle',
		link: function(path){
			var pathData = util.partitionPath(path);
			return 'debug_report.html?file='+pathData.partitionPath+'&partition='+pathData.partition;
		}
	},
	recompute: {
		icon: 'glyphicon glyphicon-repeat',
		link: function(path){
			var pathData = util.partitionPath(path);
			return 'recompute.html?file='+pathData.partitionPath+'&partition='+pathData.partition;
		}
	},
	catalog: {
		icon: 'fa fa-align-left',
		link: function(path){
			var pathData = util.partitionPath(path);
			return 'catalog_viewer.html?file='+pathData.partitionPath+'&partition='+pathData.partition;
		}
	},
	import: {
		icon: 'fa fa-upload',
		act: function($container, path, cb){
			$container.off().empty();

			var $form = $('<form>',{
				'class': 'panel-body',
				enctype: 'multipart/form-data'
			});
			var $owner = $('<select>',{
				name: 'opts.owner',
				'class': 'selectpicker',
				'data-none-selected-text': 'You',
				multiple: true,
				'data-max-options': 1
			});
			var $policy = $('<select>',{
				name: 'policy',
				'class': 'selectpicker'
			});
			populatePolicyInfo($policy, true);
			populateUserInfo($owner, undefined, true);
			var $file = $('<input>',{
				'type': 'file',
				'name': 'zipFile',
				'accept': 'application/zip,application/x-zip,application/x-zip-compressed',
				'class': 'hidden'
			});
			var $btn = Button.build({
				text: loc.js.importCampaign,
				icon: 'fa fa-upload'
			});
			$btn.on('click', function(){
				$file.trigger('click');
			});
			$file.on('change', function(){
				$form.ajaxForm($.extend({}, $.ajaxSettings, {
					url: '/emm/app/campaign/import',
					data: {dest: path},
					complete: cb
				}));
				$form.submit();
			});

			var $ownerGrp = $('<div>',{
				'class': 'form-group'
			});
			$ownerGrp.append($('<label>',{
				for: 'opts.owner',
				'class': 'col-xs-6 control-label',
				text: 'Owner'
			}), $owner);

			var $policyGrp = $('<div>',{
				'class': 'form-group'
			});
			$policyGrp.append($('<label>',{
				for: 'policy',
				'class': 'col-xs-6 control-label',
				text: 'Policy'
			}), $policy);
			$btn.addClass('col-xs-offset-4 col-xs-4');

			$form.append($ownerGrp, $policyGrp, $file, $btn);
			$container.append($form);
		}
	},

	download: {
		icon: 'fa fa-download',
		folder: {
			act: function(path){
				util.download('folder', path);
			}
		},
		file: {
			act: function(path){
				util.download('file', path);
			}
		},
		catalog: {
			act: function(path){
				var $form = $('<form>',{
					action: '/emm/app/catalog/export',
					method: 'POST'
				});
				$form.append($('<input>',{
					type: 'hidden',
					name: 'catFile',
					value: path
				}));
				$form.submit();
			}
		},
		campaign: {
			act: function(path){
				var $form = $('<form>',{
					action: '/emm/app/campaign/export',
					method: 'POST'
				});
				$form.append($('<input>',{
					type: 'hidden',
					name: 'exportFile',
					value: path
				}));
				$form.submit();
			}
		}
	},
	upload: {
		icon: 'fa fa-upload',
		act: function(path, cb){
			var $form = $('<form>',{
				action: '/fs/upload',
				method: 'POST'
			});
			var $file = $('<input>',{
				type: 'file',
				name: 'file',
				'class': 'hidden'
			});
			$form.append($file);
			var ajax = $.extend({}, $.ajaxSettings, {
				url: '/fs/upload',
				data: {uploadTo: path},
				complete: cb
			});
			$form.ajaxForm(ajax);

			$file.on('change', function(){
				var fileName = $file.val().match(/.+[\/\\](.+?)$/);
				fileName = fileName? fileName[1]: $file.val();
				//chrome gives C:\fakepath. Firefox doens't pretend.
				var filePath = path + '/' + fileName;

				$.ajax({
					url: '/fs/exists',
					data: {file: filePath},
					success: function(exists){
						if(!exists)
							return $form.submit();
						var locModal = loc.js.alreadyExists;
						modal.make({
							titleText: locModal.title,
							msg: '<strong>'+fileName+'</strong> '+locModal[1]+' <strong>'+path+'</strong>',
							onCloseBtn: function(){
								$file.val('');
							},
							btns: [{
								name: locModal.overwrite,
								action: function(){
									ajax.data = {uploadTo: path, force: true};
									$form.submit();
								}
							}]
						}, true);
					}
				});
			});
			$file.trigger('click');
		}
	},
	archive: {
		icon: 'fa fa-briefcase',
		act: function(path, cb){
			var locModal = loc.js.archiveConfirm;
			modal.make({
				titleText: locModal.title,
				msg: locModal[1]+' <strong>'+path+'</strong> '+locModal[2],
				btns: [{
					name: locModal.archive,
					action: function(){
						$.ajax({
							url: '/fs/archive',
							data: {file: path},
							complete: cb
						});
					}
				}]
			})
		}
	},
	delete: {
		icon: 'fa fa-trash',
		act: function(path, cb){
			var locModal = loc.js.deleteConfirm;
			modal.make({
				titleText: locModal.title,
				msg: locModal[1]+' <strong>'+path+'</strong> '+locModal[2],
				btns: [{
					name: locModal.delete,
					action: function(){
						$.ajax({
							url: '/fs/delete',
							data: {file: path},
							complete: cb
						});
					}
				}]
			})
		}
	},

	save: {
		icon: 'glyphicon glyphicon-floppy-disk blue',
		act: function(pid, cb){
			$.ajax({
				url: '/emm/app/process/save',
				data: {pid: pid},
				complete: cb
			});
		}
	},
	suspend: {
		icon: 'fa fa-pause orange',
		act: function(pid, cb){
			$.ajax({
				url: '/emm/app/process/suspend',
				data: {pid: pid},
				complete: cb
			});
		}
	},
	resume: {
		icon: 'fa fa-play dark-green',
		act: function(pid, cb){
			$.ajax({
				url: '/emm/app/process/resume',
				data: {pid: pid},
				complete: cb
			});
		}
	},
	stop: {
		icon: 'fa fa-stop red',
		act: function(pid, cb){
			$.ajax({
				url: '/emm/app/process/stop',
				data: {pid: pid},
				complete: cb
			});
		}
	},
	kill: {
		icon: 'fa fa-minus-circle red',
		act: function(pid, cb){
			$.ajax({
				url: '/emm/app/process/kill',
				data: {pid: pid},
				complete: cb
			});
		}
	}
};