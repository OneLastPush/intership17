/**
* Displays list of items. You can search the list.
*
* @author Ganna Shmatova
*/
function Searchable(opts){
	var s = this;
	this.opts = $.extend(true, {
		placeholder: 'Search...',
		noSearchHideItems: true,
		action: function($item){}
	}, opts);
	this.data = [];
	this.$container = $('<div>', {'class': 'col-xs-12'});
	this.$search = $('<input>',{
		placeholder: this.opts.placeholder,
		'class': 'form-control form-group'
	});
	this.$list = $('<div>', {'class': 'list-group max-height-150 overflow'});
	this.$container.append(this.$search, this.$list);

	this.updateList = function(){
		s.$list.empty();
		var searchVal = s.$search.val();
		var items = s.data;
		if(!(s.opts.noSearchHideItems && searchVal.length == 0)){
			items = items.filter(function(val){
				return ~val.indexOf(searchVal);
			})
		}
		items.forEach(function(d){
			s.$list.append($('<a>',{
				'class': 'list-group-item',
				text: d
			}));
		});
	};
	this.setData = function(data){
		s.data = data;
		s.updateList();
	};
	this.val = function(v){
		if(v){
			s.$search.val(v);
			s.$search.trigger('input');
			s.$list.find(':contains('+v+')').trigger('click');
		}else{
			return s.$list.find('.active').text();
		}
	};

	this.$search.on('input', this.updateList);
	this.$list.on('click', function(e){
		var $item = $(e.target);
		$item.addClass('active');
		$item.siblings().removeClass('active');
		s.opts.action($item);
	});
}
