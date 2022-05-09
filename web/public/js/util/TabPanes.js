/**
* I got tired of rewriting same old code. Here's it once.
* 
* Shortcut for various functions of tabe-pane for Bootstrap.
* 
* Requires:
* 	Boostrap
* 	JQuery
* 
* @version 1.1.3
* @author Ganna Shmatova
*/
function TabPanes(opts2){
	var opts = $.extend({
		titleInsidePanes: true
	}, opts2);
	var loadEvnts = {};
	var unloadEvnts = {};

	var $container = $('<div>');
	var $tabs = $('<ul>',{
		'role': 'tablist',
		'class': 'nav nav-tabs scrollable-tabs fillWidth'
	});
	var $panes = $('<div>',{
		'class':'tab-content'
	});

	(function construct(){
		var $panel = $('<div>',{
			'class': 'panel-body'
		});
		$panel.append($panes);
		var $overflow = $('<div>',{
			'class': ''//overflow' dropdowns messing up patchfix
		});
		$overflow.append($tabs);
		
		$container.append($overflow, $panel);

		$container.on('click', 'a[data-toggle="tab"]', function(e){
			var last = $container.find('.tab-pane.active').attr('id');
			var next = $(e.target).attr('href').substring(1);

			if(next != last){ //transitioned tabs (not same)
				if(unloadEvnts[last]) //if has unload evnt
					unloadEvnts[last](e, $(this)); //do unload evnt
			}
			if(loadEvnts[next])
				loadEvnts[next](e, $(e.target), $panes.find('#'+next));
		});
	})();

	//makes an id from a name string
	function makeId(name){
		return name.replace(/\s|\/|&/g, '');
	}

	//returns $tab
	function makeTab(name, menu){
		var $tab = $('<li>');
		$tab.append($('<a>',{
			'href': '#' + makeId(name),
			'role': 'tab',
			'data-toggle': 'tab',
			text: name,
			'class': 'col-xs-12'
		}));

		if(menu){
			var $menu = $tabs.find('.dropdown-toggle:contains("' + menu + '")').next();
			if(($menu.length === 0)){ //DNE? make
				var $dropdown = $('<li>', {
					'class': 'dropdown'
				});
				
				var $btn = $('<a>',{ //btn
					'class': 'dropdown-toggle',
					'data-toggle': 'dropdown',
					text: menu
				});
				$btn.append($('<span>',{
					'class': 'caret'
				}));

				$menu = $('<ul>',{ //dropdown list
					'role': 'menu',
					'class':'dropdown-menu'
				});

				$dropdown.append($btn, $menu);
				$tabs.append($dropdown);
			}
			$tab.attr('tab-index', -1); //bootstrap doesnt have a guide for this (???)
			// ... inspected element. Apparently doesn't work without it.
			$menu.append($tab); //add to dropdown
		}else{
			$tabs.append($tab); //add to normal menu
		}
		return $tab;
	}
	//returns pane made
	function makePane(name){
		var $pane = $('<div>', {
			"class": "tab-pane fade",
			"id": makeId(name)
		});
		$pane.data('name', name);
		$panes.append($pane);
		var $returnObj = $pane;

		if(opts.titleInsidePanes){
			$returnObj = $('<div>',{
				id: makeId(name) + 'Inner'
			});
			$pane.append($('<h4>',{
				'class':'text-right',
				text: name
			}), $returnObj);
		}

		return $returnObj;
	}


	/**
	* Adds an item to the tabs.
	* returns a jquery DOM div to put your contents into
	* 
	* @param name - string name of the tab. Its spaces will be removed
	* 	as it will be used as the id for the tab pane.
	* @param menu - optional. If provided, this item will be a sub-item of this menu.
	* 	Menu will be made automagically.
	* 	Just a menu can also be sent in also, then it will make an empty menu.
	* @param loadEvnt - optiona. Will be called on tab load.
	* @param unloadEvnt - optional. Will be called on tab unload. Return true to stop tab switching.
	*/
	this.add = function(name, menu, loadEvnt, unloadEvnt){
		var $tab = makeTab(name, menu);

		var id = makeId(name);
		if(loadEvnt)
			loadEvnts[id] = loadEvnt;
		if(unloadEvnt)
			unloadEvnts[id] = unloadEvnt;

		return makePane(name);
	};

	this.selectFirst = function(){
		$tabs.find('a[data-toggle="tab"]:first').addClass('active');
		$panes.find('.tab-pane:first').addClass('active in');
		$tabs.find('a[data-toggle="tab"]:first').trigger('click');	
	};

	this.container = $container;
}