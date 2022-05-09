/**
 * Uses javascript DataTables library to display audit info.
 *
 * Requires: DataTables (js and css)
 *
 * @author Ganna Shmatova
 */
var dataTable;

$(window).load(function() {
	$('#from, #to').datetimepicker({
		dateFormat : 'yy.mm.dd',
		timeFormat : 'HH:mm:ss'
	});
	$('#retrieval').find('.btn').on('click', function() {
		dataTable.ajax.reload();
	});

	var $table = $('<table>', {
		'class' : 'table table-striped table-hover',
	});
	$table.attr('width', '100%');
	$('#audits').append($table);

	var ajaxSettings = $.extend({}, $.ajaxSettings);
	delete ajaxSettings.success;

	dataTable = $table.DataTable({
		responsive: true,
		processing: true,
		language: {
			loadingRecords: loc.js.datatableloadingrecords,
			info: loc.js.datatableinfo,
			aria: {
                			sortAscending:  loc.js.datatablesortascending,
                			sortDescending: loc.js.datatablesortdescending
            		},
            		emptyTable: loc.js.datatableemptytable,
            		infoEmpty: loc.js.datatableinfoempty,
            		processing:    "<img src='../img/ajax-loader_1.gif'>",
            		infoFiltered: loc.js.datatableinfofiltered,
            		lengthMenu:    loc.js.datatablelengthmenu,
          			search: loc.js.datatablesearch,
            		zeroRecords:    loc.js.datatablezerorecords,
            		paginate: {
                			first: loc.js.datatablepaginatefirst,
                			previous:  loc.js.datatablepaginateprevious,
                			next: loc.js.datatablepaginatenext,
                			last: loc.js.datatablepaginatelast
            		}
		},
		dom : 'lrtip',
		serverSide : true,
		"ajax" : $.extend(ajaxSettings, {
			url : hostServer + '/db/get/audit/datatable',
			dataType : 'json',
			dataSrc : function(data) {
				data = data.data;
				return data;
			},
			error : function() {
			} // stop datatables from popping up alert boxes
		}),
		
		"columns" : [ {
			"data" : "when",
			"title" : loc.whenstring,
			"render" : function(data) {
				return new Date(data).format('yyyy/mm/dd HH:MM:ss l');
			}
		}, {
			"data" : "command.url",
			"title" : 'URL'
		}, {
			"data" : "result.code",
			"title" : loc.resultcode
		}, {
			"data" : "who",
			"title" : loc.user
		}, ],
		"order" : [ [ 0, 'desc' ] ]
		
	});

	{ // make tfoot with search input boxes
		var $foot = $('<tfoot>');
		var $tr = $('<tr>');
		$tr.append($('<th>'), $('<th>'), $('<th>'), $('<th>'));
		$foot.append($tr);
		$table.append($foot);

		$tr.children().each(function() {
			$(this).append($('<input>', {
				type : 'text',
				placeholder : loc.js.datatablesearch,
				'class' : 'form-control input-sm'
			}));
		});

		// range search for date
		$tr.children(':first').each(function() {
			var $input1 = $(this).children().attr('placeholder', loc.starttime);
			var $input2 = $('<input>', {
				type : 'text',
				placeholder : loc.endtime,
				'class' : 'form-control input-sm'
			});
			var datetime = {
				dateFormat : 'yy/mm/dd',
				timeFormat : 'HH:mm:ss',
				timezone : -420, // utc
				showButtonPanel : false, // so you can't do 'now' because now
											// messes things up.
				// 'now' would give EST time but you want UTC 'now'. onselect
				// event hook fix messes up manually time selection.
				// so we're not going to both with 'now'.
				onSelect : function(text, datepicker) {
					// convert user's selected time to UTC time
					// var now = new Date(text);
					// now = new Date(now.getTime() +
					// now.getTimezoneOffset()*60*1000);
					var $input = datepicker.$input || datepicker.input; // why?
																		// cuz
																		// datetimepicker
																		// can't
																		// decide.
					if ($input) {
						// $input.datetimepicker('setDate', now);
						$input.data('changed', true);
						// workaround for datepicker throwing off multiple
						// change events
						// you would think this has to go above last line, but
						// apparently not...
						$input.trigger('change'); // apparently wont' do
													// change first time. Forget
													// it. GAH. let's force a
													// change event then!
					}
				}
			};
			$input1.datetimepicker(datetime);
			$input2.datetimepicker(datetime);

			var $wrap1 = $('<div>', {
				'class' : 'col-xs-6'
			});
			$wrap1.append($input1);
			var $wrap2 = $('<div>', {
				'class' : 'col-xs-6'
			});
			$wrap2.append($input2);

			$(this).append($wrap1, $wrap2);
		});
	}
	// add events to input boxes
	$table.find('tfoot').on('change', 'input', function() {
		// footer is technically not part of table (so can't select it...)
		// so figure out which index the input is & get column by index
		var $th = $(this).parents('th');
		var index;

		// manually search index, jquery wasn't working some reason...
		var $ths = $table.find('tfoot th');
		$ths.each(function(i) {
			if ($(this).is($th)) {
				index = i;
			}
		});

		var value = '';
		var $inputs = $th.find('input');
		if ($inputs.length > 1) {
			// datetimepicker fix for multipe change events
			if ($(this).data('changed') === true) {
				$(this).data('changed', false);
				var date1 = $inputs[0].value ? new Date($inputs[0].value) : '';
				var date2 = $inputs[1].value ? new Date($inputs[1].value) : '';
				value = date1 + '><' + date2;
			} else {
				return;
			}
		} else {
			value = this.value;
		}

		// apply search
		dataTable.column(index).search(value).draw();
	});

	// details for rows
	$table.find('tbody').on('click', 'tr', function(e) {
		var $tr = $(this).closest('tr');
		var row = dataTable.row($tr);

		if (row.child.isShown()) {
			row.child.hide();
		} else {
			if (row.data())
				row.child(doDetails(row.data())).show();
		}
	});

	/**
	 * Takes in 1 audit's data, returns a JQuery object
	 */
	function doDetails(data) {
		var $dets = $('<p>', {
			'class' : 'col-xs-12'
		});
		$dets.append($('<p>', {
			text : data.command.info
		}));
		var $req = $('<p>', {
			'class' : 'col-xs-12',
			html : 'Request:<br>'
		});
		$req.append($('<p>', {
			'class' : 'well well-sm',
			text : JSON.stringify(data.command.data)
		}));
		var $res = $('<p>', {
			'class' : 'col-xs-12',
			html : 'Response:<br>'
		});
		$res.append($('<p>', {
			'class' : 'well well-sm',
			text : JSON.stringify(data.result.data)
		}));
		$dets.append($req, $res);
		return $dets;
	}
});
