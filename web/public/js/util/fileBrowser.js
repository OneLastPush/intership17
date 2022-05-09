/**
 * FancyTree instance maker that is compatible with browse_fs API
 * @param {[type]} opts [description]
 */
function FileBrowser(opts){
	var fb = this;
	this.opts = $.extend(true, {
		location: '.',
		debug: false,
		extensions: [],
		loc: {
			loading: 'Loading...',
			loadError: 'Load error',
			moreData: 'More...',
			noData: 'No data'
		},
		onSelect: function(e, n, d){
			console.log(d);
		}
	}, opts);

	this.$container = $('<div>');
	this.$container.fancytree({
		escapeTitles: true,
		quicksearch: true,
		aria: true,

		strings: this.opts.loc,
		debugLevel: this.opts.debug? 2: 1, // 0:quiet, 1:normal, 2:debug
		source: this.source(),
		lazyLoad: function(e, data){
			data.result = fb.getFolder(data.node.data.path, fb.opts.extensions, true);
		},
		activate: function(e, d){
			fb.opts.onSelect(e, d, fb.getData(d));
		},
		defaultKey: function(n){
			return n.data.path || 'root';
		}
	});
	this.tree = this.$container.fancytree('getTree');
};
FileBrowser.prototype.getFolder = function(folder, exts, justChildren){
	return $.ajax({
		url: '/fs',
		data: {folder: folder, exts: exts, justChildren: justChildren},
		dataType: 'json',
		success: function(data){
			var children = justChildren? data: data.children;
			children.sort(function(c1, c2){
				return c1.title.localeCompare(c2.title);
			});
			children.sort(function(c){
				return c.folder? -1: 1;
			});
			children.forEach(function(c){
				if(c.folder)
					c.lazy = true;
			});
		}
	});
};
FileBrowser.prototype.source = function(){
	return this.getFolder(this.opts.location, this.opts.extensions);
};

FileBrowser.prototype.getData = function(d){
	var fb = this;
	return {
		refresh: function(){
			var folder = d.node.folder? d.node: d.node.parent;
			if(folder.isLazy()){ //if lazy folder, refresh folder
				folder.resetLazy();
				folder.setExpanded(true).done(function(){
					fb.tree.activateKey(d.node.data.path);
				});
			}else //refresh whole
				fb.refresh();
		},
		path: d.node.data.path,
		folder: d.node.folder? true: false
	};
};
FileBrowser.prototype.setLocation = function(location){
	this.opts.location = location;
};
FileBrowser.prototype.refresh = function(){
	this.tree.reload(this.source());
};