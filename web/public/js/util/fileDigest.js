/**
 * Requires a path to function, and util/button.js
 * Will retrieve isPinned, file info from browse_fs API, and path permissions from master-app's intenral db
 * @param {[type]} opts [description]
 */
function FileDigest(opts){
	var fd = this;
	this.opts = $.extend(true, {
		loc: {
			empty: 'Click on a file in the Browse panel to see information or perform operations on it.',

			path: 'Path',
			name: 'Name',
			extension: 'Extension',
			size: 'Size',
			created: 'Created',
			modified: 'Last modified',
			accessed: 'Last accessed',
			permissions: 'Permissions',
			owner: 'Owner',
			group: 'Group',

			import: 'Import Campaign',
			downloadFolder: 'Download as zip',
			upload: 'Upload file',
			run: 'Run',
			pin: 'Pin to workspace',
			unpin: 'Unpin from workspace',
			recompute: 'Recompute',
			viewLog: 'View log',
			report: 'Debug report',
			download: 'Download',
			file: 'File',
			catalog: 'Catalog',
			campaign: 'Campaign',
			viewCatalog: 'View catalog',
			viewContents: 'View contents',
			archive: 'Archive',
			delete: 'Delete'
		}
	}, opts);

	this.$container = $('<div>');
	this.displayReset();
};

FileDigest.prototype.getData = function(path, cb){
	var data = {
		path: path
	};
	var isPinned = $.ajax({
		url: '/db/internal/user/is/pinned',
		data: {pinned: path},
		success: function(isPinned){
			data.pinned = isPinned;
		}
	});
	var getFileInfo = $.ajax({
		url: '/fs/info',
		dataType: 'json',
		data: {file: path},
		success: function(stat){
			for(var f in stat){
				data[f] = stat[f];
			}
		}
	});
	var getPathPermissions = $.ajax({
		url: '/db/internal/group/get/path/permissions',
		dataType: 'json',
		data: {path: path},
		success: function(pathPermission){
			for(var f in pathPermission){
				if(f.startsWith('Can'))
					data[f.substring(4)] = pathPermission[f]
			}
		}
	});
	$.when(isPinned, getFileInfo, getPathPermissions).always(function(){
		if(!data.folder){
			var code = data.path.match(/.*_(C\d{9})/);
			if(code)
				data.campaignCode = code[1];
			data.isInCampaigns = data.path.match(/campaign[\\\/]partitions[\\\/].+[\\\/]campaigns.*/i) == null? false: true;
			data.isInSessions = data.path.match(/campaign[\\\/]partitions[\\\/].+[\\\/]sessions.*/i) == null? false: true;

			data.canManageSessions = permissions.indexOf('manage sessions') != -1;
			data.canRecompute = permissions.indexOf('recompute catalogs/flowcharts') != -1;
			data.canViewLogs = permissions.indexOf('review log files') != -1;
		}
		cb(data);
	});
};
FileDigest.prototype.displayReset = function(empty){
	this.$container.off().empty();
	if(!empty)
		this.$container.append($('<div>',{
			text: this.opts.loc.empty,
			'class': 'well'
		}));
};
FileDigest.prototype.display = function(path, folder, refresh){
	var fd = this;
	this.getData(path, function(data){
		data.folder = folder;
		data.refresh = refresh;
		//build
		fd.displayReset(true);
		fd.$container.append(fd.buildInfo(data));
		fd.$container.append(fd.buildActions(data));
	});
};
FileDigest.prototype.buildLine = function(key, value){
	var $p = $('<p>');
	$p.append($('<strong>',{text: key+': '}));
	$p.append(value);
	return $p;
};
FileDigest.prototype.buildInfo = function(data){
	var $info = $('<div>', {'class': 'well'});
	var $p1 = $('<p>');
	var $p2 = $('<p>');
	var $p3 = $('<p>');
	$info.append($p1, $('<br>'), $p2, $('<br>'), $p3);

	$p1.append(
		this.buildLine(this.opts.loc.run, data.path),
		this.buildLine(this.opts.loc.name, data.name)
	);
	if(!data.folder){
		$p1.append(
			this.buildLine(this.opts.loc.extension, data.extension),
			this.buildLine(this.opts.loc.size, data.size)
		);
	}
	$p2.append(
		this.buildLine(this.opts.loc.created, data.created? new Date(data.created).toLocaleString(): '--'),
		this.buildLine(this.opts.loc.modified, data.modified? new Date(data.modified).toLocaleString(): '--'),
		this.buildLine(this.opts.loc.accessed, data.accessed? new Date(data.accessed).toLocaleString(): '--')
	);
	$p3.append(
		this.buildLine(this.opts.loc.permissions, data.permissions),
		this.buildLine(this.opts.loc.owner, data.owner),
		this.buildLine(this.opts.loc.group, data.group)
	);

	this.$container.append($info);
};
FileDigest.prototype.buildActions = function(data){
	console.log(data);
	var wrapperClass = 'small-margin';
	var btnColor = 'btn-default';
	switch(data.extension){
		case 'ses': btnColor = 'btn-success'; break;
		case 'cat': btnColor = 'btn-warning'; break;
		case 'xml': btnColor = 'btn-danger'; break;
		case 'log': btnColor = 'btn-info'; break;
	}
	var $actions = $('<div>',{
		'class': 'col-xs-12 row center-block'
	});
	var $collapse = $('<div>',{
		'class': 'collapse'
	});
	this.$container.append($('<div>',{'class':'row'}), $actions, $('<div>',{'class':'row'}), $collapse);

	if(data.folder){
		if(data.upload)
			$actions.append(Button.build({
				text: this.opts.loc.import,
				'class': wrapperClass,
				color: btnColor,
				icon: actions.import.icon
			}, function(){
				actions.import.act($collapse, data.path, data.refresh);
				$collapse.collapse('show');
			}));
		if(data.download)
			$actions.append(Button.build({
				text: this.opts.loc.downloadFolder,
				'class': wrapperClass,
				color: btnColor,
				icon: actions.download.icon,
			}, function(){
				actions.download.folder.act(data.path)
			}));
		if(data.upload)
			$actions.append(Button.build({
				text: this.opts.loc.upload,
				'class': wrapperClass,
				color: btnColor,
				icon: actions.upload.icon,
			}, function(){
				actions.upload.act(data.path, data.refresh);
			}));
	}else{ //files
		if(data.extension == 'ses' && (data.isInCampaigns || data.isInSessions)){
			if(data.canManageSessions)
				$actions.append(Button.build({
					text: this.opts.loc.run,
					'class': wrapperClass,
					color: btnColor,
					icon: actions.run.baseIcon,
					advanced: function(){
						return actions.run.link(data.path);
					}()
				}, function(){
					actions.run.act(data.path);
				}));
			var pinning = data.pinned? actions.unpin: actions.pin;
			$actions.append(Button.build({
				text: data.pinned? this.opts.loc.unpin: this.opts.loc.pin,
				'class': wrapperClass,
				color: btnColor,
				icon: pinning.baseIcon
			}, function(){
				pinning.act(data.path, data.refresh);
			}));
			if(data.canRecompute)
				$actions.append(Button.build({
					text: this.opts.loc.recompute,
					'class': wrapperClass,
					color: btnColor,
					icon: actions.recompute.icon
				}, function(){
					return actions.recompute.link(data.path);
				}()));
			if(data.canViewLogs)
				$actions.append(Button.build({
					text: this.opts.loc.viewLog,
					'class': wrapperClass,
					color: btnColor,
					icon: actions.logFile.baseIcon
				}, function(){
					return actions.logFile.link(data.path);
				}()));
			$actions.append(Button.build({
				text: this.opts.loc.report,
				'class': wrapperClass,
				color: btnColor,
				icon: actions.report.icon
			}, function(){
				return actions.report.link(data.path);
			}()));
			if(data.download){
				$actions.append(Button.build({
					text: this.opts.loc.download,
					'class': wrapperClass,
					color: btnColor,
					icon: actions.download.icon,
				}, {
					text: this.opts.loc.file,
					act: function(){
						actions.download.file.act(data.path);
					}
				},{
					text: this.opts.loc.catalog,
					act: function(){
						actions.download.file.catalog(data.path);
					}
				},{
					text: this.opts.loc.campaign,
					act: function(){
						actions.download.file.campaign(data.path);
					}
				}));
			}
		}else if((data.campaignCode && data.isInCampaigns) || data.isInSessions){
			if(data.download){
				$actions.append(Button.build({
					text: this.opts.loc.download,
					'class': wrapperClass,
					color: btnColor,
					icon: actions.download.icon,
				}, {
					text: this.opts.loc.file,
					act: function(){
						actions.download.file.act(data.path);
					}
				},{
					text: this.opts.loc.campaign,
					act: function(){
						actions.download.file.campaign(data.path);
					}
				}));
			}
		}else{ //non campaign files
			if(data.extension == 'cat'){
				$actions.append(Button.build({
					text: this.opts.loc.viewCatalog,
					'class': wrapperClass,
					color: btnColor,
					icon: actions.catalog.icon
				}, function(){
					return actions.catalog.link(data.path);
				}()));
				if(data.canRecompute)
					$actions.append(Button.build({
						text: this.opts.loc.recompute,
						'class': wrapperClass,
						color: btnColor,
						icon: actions.recompute.icon
					}, function(){
						return actions.recompute.link(data.path);
					}()));
			}else if(data.extension == 'log'){
				if(data.canViewLogs)
					$actions.append(Button.build({
						text: this.opts.loc.viewLog,
						'class': wrapperClass,
						color: btnColor,
						icon: actions.logFile.baseIcon
					}, function(){
						return actions.logFile.link(data.path);
					}()));
			}
			if(data.binary == false)
				$actions.append(Button.build({
					text: this.opts.loc.viewContents,
					'class': wrapperClass,
					color: btnColor,
					icon: actions.contents.icon
				}, function(){
					return actions.contents.link(data.path);
				}()));

			if(data.download)
				$actions.append(Button.build({
					text: this.opts.loc.download,
					'class': wrapperClass,
					color: btnColor,
					icon: actions.download.icon,
				}, function(){
					actions.download.file.act(data.path);
				}));
		}
		if(data.archive)
			$actions.append(Button.build({
				text: this.opts.loc.archive,
				'class': wrapperClass,
				color: btnColor,
				icon: actions.archive.icon,
			}, function(){
				actions.archive.act(data.path, data.refresh);
			}));
		if(data.delete)
			$actions.append(Button.build({
				text: this.opts.loc.delete,
				'class': wrapperClass,
				color: btnColor,
				icon: actions.delete.icon,
			}, function(){
				actions.delete.act(data.path, data.refresh);
			}));
	}
};