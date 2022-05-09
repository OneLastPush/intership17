/**
* Attaches events & functionality to emailing page.
*
* Requires:
*	FormHelpers.js
*	TemplateForm.js
*		JQuery
*		Bootstrap 3
* 		JQueryUI 1.6+
*			JQuery-browser with versions 1.9+
*		JQueryUI timepicker addon
*
* @author Ganna Shmatova
*/
var template;
var predefined;

$(window).load(function(){
	predefined = {
		'ibmenvironmentrestart':{
			subject: loc.js.restartSubject,
			body: loc.js.restartBody
		},
		'ibmenvironmentmaintenance':{
			subject: loc.js.maintenanceSubject,
			body: loc.js.maintenanceBody
		}
	};

	$.ajax({
		url: '/config/get',
		data: {
			item: 'Email.active'
		},
		dataType: 'json',
		success: function(active){
			if(!active){
				var $btns = $('.tab-pane button');
				$btns.addClass('disabled');
				$btns.parent().tooltip({
					title: loc.js.emailConfigIssue
				});
			}
		}
	});

	//email submit event
	$('.tab-pane button').on('click', function(e){
		var $parent = $(this).parents('.tab-pane:first');
		var $emailList = $('#emailsList');
		var $emails = $emailList.children();

		// emailList has someone check
		if($emails.length > 0){
			$emailList.parent().parent().removeClass('bg-danger');
		}else{
			$emailList.parent().parent().addClass('bg-danger');
			return;
		}

		// required inputs filled
		if(isRequiredFilled($parent)){
			var serial;
			//serialize email
			if($parent.is('#predefined'))
				serial = template.serialize();
			else
				serial = $parent.find('[name]').serialize();

			//serialize emaillist
			serial += '&emails=';
			$emails.each(function(){
				serial += encodeURIComponent($(this).text()) + ',';
			});

			//using jquery-ui on this page. Conflicts with bootstrap. Manual workaround.
			var $btn = $(this);
			var name = $btn.text();
			$btn.prop('disabled', true);
			$btn.text(loc.js.sending);
			$.ajax({
				url: '/email/send',
				data: serial,
				complete: function(){
					$btn.prop('disabled', false);
					$btn.text(name);
				}
			});
		}
	});

	//predefined emails initialization
	$.ajax({
		url: '/db/internal/user/get',
		dataType: 'json',
		success: function(data){
			$.ajax({
				url: '/date',
				dataType: 'text',
				success: function(serverDate){
					template = new TemplateForm({
						autofills: {
							'name': (data.Name.First + data.Name.Last) || data.Username,
							'contact email': data.Email,
							'contact phone': data.Phone.Office || data.Phone.Mobile,
							'getServerDate': serverDate
						}
					});
					$('#predefined > .panel-body').append(template.container);

					//predefined tab fill events
					$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
						if($(e.target).attr('href') == '#predefined'){
							//The id of the element matches the name of the template object
							template.set(predefined[e.target.id]);
						}
					});

					//The id of the element matches the name of the template object
					template.set(predefined[$('a[data-toggle="tab"]:first')[0].id]);
				}
			});
		}
	});

	//populate group dropdown
	populateGroupDropdown();
	//attach dropdown functionality
	$('#emailSelectDropdown').find('a').on('click', emailDropdownEvnt);
	//email adder button function (adds all emails in a group or a custom email)
	$('#addEmail').on('click', addEmailEvnt);
	//emailsList has deleteEmail evnt
	$('#emailsList').on('click', delEmailEvnt);
});

///*********** WHO TO EMAIL EVENTS **************/
function populateGroupDropdown(){
	$.ajax({
		url: '/db/internal/group/get/all',
		dataType: 'json',
		success: function(data){
			var $select = $('#emailSelectDropdown').parent().find('select');
			$select.empty();
			data.forEach(function(group){
				$select.append($('<option>',{
					text: group.Name,
					value: group.Name
				}));
			});
			$('.selectpicker').selectpicker();
			$('.selectpicker').selectpicker('refresh');
		}
	});
}

// assumes attached to <a> with value attribute
function emailDropdownEvnt(){
	var parent = $(this).parents('.form-group:first');
	var dropVal = $(this).attr('value');

	//changes button name to what user selected in dropdown
	parent.find('button:first span:first').text(dropVal+' ');

	//changes input type
	var $select = parent.find('select, .bootstrap-select');
	var $input = parent.find('input');

	if(dropVal == 'Group'){
		$select.removeClass('hidden');
		$input.addClass('hidden');
	}else if(dropVal == 'Custom'){
		$input.val('');
		$input.prop('disabled', false);
		$input.removeClass('hidden');
		$select.addClass('hidden');
	}else{
		$input.removeClass('hidden');
		$select.addClass('hidden');

		$input.prop('disabled', true);
		$.ajax({ //how many emails?
			url: '/db/internal/user/get/all/emails',
			success: function(emails){
				$input.val(emails.length + ' found');
			}
		});
	}
}
// assumes attached to an add button. Will find emails of all group
// members or add a single email. Ensures unqiueness (won't add duplicates).
function addEmailEvnt(){
	var parent = $(this).parents('.form-group:first');
	var adding = parent.find('button:first span:first').text().trim();

	if(adding == 'Group'){
		$.ajax({
			url: '/db/internal/group/get/emails',
			dataType: 'json',
			data: {
				group: parent.find('select').val()
			},
			success: function(data){
				addEmails(data);
			}
		});
	}else if(adding == 'Custom'){
		var $input = parent.find('input');
		var value = $input.val();

		if(isValidEmail($input))
			addEmails([value]);
	}else{// all
		$.ajax({
			url: '/db/internal/user/get/all/emails',
			success: function(emails){
				addEmails(emails);
			}
		});
	}

	//adds unique emails
	function addEmails(emails){
		var $list = $('#emailsList');
		var $item;
		var $right;
		var $removeIcon;
		emails.forEach(function(email){
			if(!email || $list.find('a:contains("' + email + '")').length > 0) //already exists?
				return;

			//build email list item
			$item = $('<a>',{
				'class':'list-group-item',
				text: email
			});
			$right = $('<div>',{'class':'pull-right'});
			$removeIcon = $('<span>',{'class':'fa fa-times'});

			$item.append($right);
			$right.append($removeIcon);

			//insert at beginning
			$list.prepend($item);
		});
	}
}
//assumes is attached to list container
function delEmailEvnt(e){
	var $item = $(e.target);
	if(!$item.hasClass('list-group-item')) //if not list group item
		$item = $item.parents('a.list-group-item:first'); //select list group item parent

	$item.remove();
}
