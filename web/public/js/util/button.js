var Button = {};
Button.addAction = function($ele, act){
	var action = typeof act == 'function'? act: act.act;
	var link = typeof act == 'string'? act: act.link;

	if(action){
		$ele.on('click', action);
	}else if(link){
		$ele.attr('href', act);
		$ele.attr('target', '_blank');
	}
};
Button.build = function(opts){
	var builder = this;
	var $rtn;
	opts = $.extend({
		text: '',
		'class': '',
		color: 'btn-default',
		size: '',
		icon: ''
	}, opts);
	var acts = Array.prototype.slice.call(arguments, 1);

	var $btn = $('<a>',{
		type: 'button',
		'class': 'btn ' + opts.color + ' ' + opts.size
	});
	if(opts.icon)
		$btn.append($('<span>', {'class': opts.icon}));
	$btn.append(' '+opts.text);

	var $grp;
	if(acts.length == 1){ //one action btn
		this.addAction($btn, acts[0]);
		if(opts.advanced){
			$grp = $('<div>', {
				role: 'group',
				'class': 'btn-group '+opts['class']
			});
			var $btn2 = $('<a>',{
				type: 'button',
				'class': 'btn ' + opts.color + ' ' + opts.size
			});
			$btn2.append($('<span>',{
				'class': 'fa fa-cog'
			}));
			builder.addAction($btn2, opts.advanced);
			$grp.append($btn, $btn2);
		}else
			$btn.addClass(opts['class']);
	}else if(acts.length > 1){ //dropdown
		$grp = $('<div>', {'class': 'btn-group '+opts['class']});
		$btn.addClass('dropdown-toggle');
		$btn.attr({
			'data-toggle': 'dropdown',
			'aria-haspopup': 'true',
			'aria-expanded': 'false'
		});
		$btn.append(' ');
		$btn.append($('<span>', {'class':  'caret'}));
		var $ul = $('<ul>', {'class': 'dropdown-menu'});
		acts.forEach(function(a){
			var $li = $('<li>');
			if(!a){
				$li.attr({
					'class': 'divider',
					'role': 'separator'
				});
			}else{
				var $a = $('<a>', {
					text: a.text
				});
				builder.addAction($a, a);
				$li.append($a);
			}
			$ul.append($li);
			$grp.append($btn, $ul);
		});
	}

	return $grp? $grp: $btn;
};