/**
* Configuration wizard thhat works on a component/feature/product basis.
* 
* Vertical pill nav of products installed
* Selecting one shows you all the configuration properties belonging to it, & a 'disable' button.
* There is also an add dropdown for products that not 'active' yet.
* 
* @author Ganna Shmatova
* @version 1.0.0
*/
function ConfigWizard(opts2){
	var config = this;
	var opts = $.extend({
		displayFn: function(key){ //called when an item is selected. Shoudl return JQuery/string obj to display
			return 'Displaying ' + key;
		},
		setActive: function(name, status, successFn){ //should save to persistence & call successFn for reload.
			successFn();
		},
		changeOrderRows: function(categorie,container,successFn){ 
			successFn(categorie);
		}
	}, opts2);
	this.data = {};
	this.setActive = function(name, state, cb){
		if(this.data[name].active === undefined)
			return new Error(name + ' does not have active property').stack;
		this.data[name].active = state;
		opts.setActive(name, state, cb);
	};

	var $container = $('<div>');

	var $select = $('<select>');
	var $disableBtn = $('<span>');

	var $list = $('<ul>');
	var $details = $('<div>');
	

	(function(){ //makes DOM elements
		var col1Classes = 'col-xs-12 col-sm-4 col-md-3';
		var col2Classes = 'col-xs-12 col-sm-8 col-md-9';

		$select.attr('class', 'selectpicker');
		$select.attr('title', 'Add new product...');
		$select.prop('multiple', true); // to make ^ appear
		//$select.attr('data-max-options', '1'); // to undo ^
		var $selectWrapper = $('<div>',{'class': col1Classes});
		$selectWrapper.append($select);

		$list.attr('class', 'nav nav-pills nav-stacked max-height-400 overflow ' + col1Classes);

		var $actions = $('<div>',{
			'class': col2Classes + ' text-right'
		});

		var btn;

  		//move up btn 
 		btn = $('<div>', {"class": "btn btn-default moveRow", "id":"moveUp"});
  		btn.append($('<span>',{"class": 'glyphicon glyphicon-arrow-up'}));
  		btn.tooltip({title: 'Move row up', container: 'body'});
  		$actions.append(btn);
  		btn.on('click', function(){
			moveRow($(this).attr('id'));
  		});

  		//move down btn 
 		btn = $('<div>', {"class": "btn btn-default moveRow", "id":"moveDown"});
  		btn.append($('<span>',{"class": 'glyphicon glyphicon-arrow-down'}));
  		btn.tooltip({title: 'Move row down', container: 'body'});
  		$actions.append(btn);
  		btn.on('click', function(){
			moveRow($(this).attr('id'));
  		});
  		//save new order the rows
 		btn = $('<div>', {"class": "btn btn-default saveContainer", "id":"saveOrder"});
  		btn.append($('<span>',{"class": 'glyphicon glyphicon-save'}));
  		btn.tooltip({title: 'Save row order', container: 'body'});
  		$actions.append(btn);
  		 /* save new order rows     */
  		btn.on('click', function(){
			var key;
			var name;
		 	var container = {};
		 	var categorie = $('#components li.active').text();
		 	var rows = $('#components tbody').find('tr');	

		 	rows.each(function(index, el) {
				var valInputKey = $(this).find('input[name=key]').val();
				if(valInputKey != ''){
					name = valInputKey;
				}
				
				var valInputValue = $(this).find('input[name=value]').val();
				if(valInputValue != '') {
					key = valInputValue;
				}
				container[name] = key;
			});
			config.data[categorie] = container;

			$('#components tbody tr').removeAttr('class');
			opts.changeOrderRows(categorie,container,buildList(categorie));
		 });

		$disableBtn.addClass('btn btn-default');
		$disableBtn.append('Disable');
		$actions.append($disableBtn);

		$details.addClass('max-height-400 overflow panel ' + col2Classes);

		//evnts here
		$disableBtn.on('click', function(){
			var val = $list.children('.active').text();
			config.setActive(val, false, buildList);
		});

		$select.on('change', function(){ //add item
			var val = $(this).val();
			if(val){
				$select.trigger('click'); //hides selectpicker dropdown
				config.setActive(val, true, function(){
					buildList(val);
				});
			}
		});

	
      $list.on('click', 'li', function(){
        	var $this = $(this);

        	var $warning = $('#components').find('tr');
        	if ($warning.hasClass('warning')) {
				modal.make({
					'titleText': 'You have unsaved changes',
					'msg': 'Are you sure you want to do that? There are unsaved changes and they will be lost.',
					btns: [{
						name: 'Discard changes',
						action: function() {
							
							var changed = $('#components').find('.warning');
							var key;
							var row;
							for(var i=0; i<changed.length; i++){
								row = $(changed[i]);
								key = row.find("input[name='key']").data('orig'); //get key
								var value = row.find("input[name='value']").attr('value'); //set to original value
								row.find("input[name='value']").val(value); //get to original value
								row.find('input').trigger('blur'); //trigegr blur to get rid of warning
							}

							showList($this);

						}
					}]
				});
			} else {
				showList($(this));
			}
			
		});

		

		//activate/put it all together
		$container.append($selectWrapper, $actions, $('<div>',{'class':'row'}), $list, $details);
		$select.selectpicker();

		
	})();





	function moveRow(id){
		var rows = $details.find('tr');
		var active = rows.filter('.activeRow');
		rows.removeClass('warning');
		var moveRow = id;
		var indexRowMouve;
		var indexRow = active.index();
		var elInsert = (moveRow == 'moveUp') ? ((indexRow == 0 || indexRow == 1) ? 'start' : indexRow-2) : ((indexRow>=rows.length) ? rows.length : indexRow+1);
		if(moveRow == 'moveUp') {
			if(indexRow != 0) {
				switchRows(active, rows.eq(indexRow));
			} else {
				indexRow = 0;
				$('#' + moveRow + '.btn-default').trigger('blur');
			}
		} else {
				if(elInsert != rows.length-2){
					indexRowMouve = indexRow+2;
					switchRows(active, rows.eq(indexRowMouve));
				} else {
					indexRow = rows.length-2;
				}
		}
	}

	function switchRows(row1, row2){
		var key1 = row1.find('input[name="key"]').val();
		var value1 = row1.find('input[name="value"]').val();
		var class1 = row1.attr('class');

		var key2 = row2.find('input[name="key"]').val();
		var value2 = row2.find('input[name="value"]').val();

		row1.find('input[name="key"]').val(key2);
		row1.find('input[name="key"]').attr('value',key2);
		row1.find('input[name="value"]').val(value2);
		row1.find('input[name="value"]').attr('value',value2);
		row1.removeAttr('class');

		row2.find('input[name="key"]').val(key1);
		row2.find('input[name="key"]').attr('value',key1);
		row2.find('input[name="value"]').val(value1);
		row2.find('input[name="value"]').attr('value',value1);
		row2.attr('class', class1);
	}



	// Activate list 
	function showList(liActive){
		var $this = liActive;
		$this.siblings().removeClass('active');
		$this.addClass('active');

		var val = $this.text();
		$details.children().detach();
		$details.append(opts.displayFn(val));
		$container.find('.selectpicker').selectpicker();

		$disableBtn.removeClass('hidden');
		if(config.data[val].active === undefined)
			$disableBtn.addClass('hidden');
			
	}

	

	//parses data & builds list of products
	// @param selectWhat optional. string of list item that should be active. If omitted selects first.
	function buildList(selectWhat){
		//erase old
		$list.empty();
		$select.empty();
		$select.removeClass('hidden');

		//build
		var data = config.data;

		var $li;
		for(var key in data){
			if(data[key].active === false){ //active undefined or true is always shown
				//add to dropdown
				$select.append($('<option>',{
					name: key,
					text: key
				}));

				$li = $('<li>');
				$li.append($('<a>',{
					text: key,
					class: 'text-muted'
				}));
				$list.append($li);
			}else{
				//show in list
				$li = $('<li>');
				$li.append($('<a>',{
					text: key
				}));
				$list.append($li);
			}
		}
		//activate list
		var triggerMe = selectWhat? $list.children(':contains(' + selectWhat + ')'): undefined;
		if(!triggerMe || triggerMe.length === 0)
			triggerMe = $list.children(':first');
		triggerMe.trigger('click');

		//activate select
		$select.selectpicker('refresh');
		if($select.children().length === 0) //hide adder row if nothing left to add
			$select.addClass('hidden');
	}



	this.set = function(data, displayData){
		config.data = data;
		buildList();
	};
	this.container = $container;
	this.reload = buildList;

}

