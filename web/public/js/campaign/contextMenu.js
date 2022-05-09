/**
 * Requires jquery & bootstrap
 */
function ContextMenu(){
	var cm = this;
	this.$dropdown = $('<div>',{
		'class': 'dropdown clearfix'
	});
	this.$menu = $('<ul>',{
		'class': 'dropdown-menu',
		'role': 'menu',
		'style': 'display:block;position:absolute;margin-bottom:5px;'
	});
	this.$dropdown.append(this.$menu);
	$('body').prepend(this.$dropdown);
	$('body').on('click', function(e){
		if(cm.$menu.parent().is(':visible')){ //menu is open
			var $target = $(e.target);
			//hide menu when user clicks outside of it
			if($target.parents('.contextMenu').length === 0){
				cm.$dropdown.hide();
			}
		}
	});

	//fixes context menu's popup making scrollbars on page
	$('body, html').css('overflow-x', 'hidden');

	this.createDivider = function(){
		return $('<li>',{
			'class': 'divider'
		});
	}
	this.createItem = function(text, icon, action){
		var $li = $('<li>');
		var $a = $('<a>');
		$li.append($a);
		$a.append($('<span>',{
			'class': icon
		}));
		$a.append(' '+text);
		if(typeof action == 'string'){
			$a.attr('href', action);
			$a.attr('target', '_blank');
		}else{
			$a.on('click', action);
			$a.addClass('clickable');
		}
		return $li;
	}
	this.addItems = function(items){
		for(var i=0; i<items.length; i++)
			cm.$menu.append(items[i]);
	}

	this.show = function(e){
		if(cm.$menu.find('li').length > 0){ //has a menu list
			cm.$dropdown.css({
				left: e.pageX,
				top: e.pageY
			});
			cm.$dropdown.show();
		}
	};
	this.clear = function(){
		cm.$menu.off().empty();
	};

	return this;
};