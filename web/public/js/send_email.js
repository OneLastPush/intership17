function isEmailingWorking(){
	$.ajax({
		url: '/config/get',
		data: { item: 'Email.active' },
		success: function(active){
			if(active !== 'true' && !active){
				var $submits = $('.tab-pane button');
				$submits.addClass('disabled');
				$submits.parent().tooltip({
					title: loc.js.emailConfigIssue
				});
			}
		}
	});
}

$(window).load(function(){
	var templates = {
		restart: {
			subject: loc.js.restartSubject,
			body: loc.js.restartBody
		},
		maintenance: {
			subject: loc.js.maintenanceSubject,
			body: loc.js.maintenanceBody
		}
	};

	isEmailingWorking();
	$('#restart').data('subject', loc.js.restartSubject).data('body', loc.js.restartBody);
	$('#maintenance').data('subject', loc.js.maintenanceSubject).data('body', loc.js.maintenanceBody);

	var emailTo = new EmailTo();

	$.when($.ajax({
		url: '/db/internal/user/get',
		dataType: 'json'
	}), $.ajax({
		url: '/date',
		dataType: 'text'
	})).done(function(d1, d2){
		var userData = d1[0];
		var date = d2[0];

		var template = new TemplateForm({
			autoFills: {
				name: (userData.Name.First + ' ' + userData.Name.Last).trim() || userData.Username,
				'contact email': userData.Email,
				'contact phone': userData.Phone.Office || userData.Phone.Mobile,
				'server time': date
			},
			loc: loc.js.template
		});
		$('#predefined .panel-body').append(template.$container);
		$('.tab-pane button').on('click', null, {emails: emailTo, template: template}, submitEmail);

		$('a[data-toggle="tab"]').on('shown.bs.tab', function(e){
			if($(e.target).attr('href') == '#predefined'){
				template.setTemplate(templates[e.target.id]);
			}
		});
		template.setTemplate(templates.restart);
	});
});

function EmailTo(opts){
	var et = this;
	this.opts = $.extend({
		$type: $('#emailSelectDropdown'),
		$input: $('#inputEmail'),
		$select: $('#selectEmail'),
		$add: $('#addEmail'),
		$list: $('#emailList'),

		getGroups: function(cb){
			$.ajax({
				url: '/db/internal/group/get/all',
				dataType: 'json',
				success: function(data){
					cb(undefined, data);
				},
			});
		},
		getAllEmails: function(cb){
			$.ajax({
				url: '/db/internal/user/get/all/emails',
				dataType: 'json',
				success: function(data){
					cb(undefined, data);
				}
			});
		},
		getGroupEmails: function(group, cb){
			$.ajax({
				url: '/db/internal/group/get/emails',
				data: {group: group},
				dataType: 'json',
				success: function(data){
					cb(undefined, data);
				}
			});
		}
	}, opts);


	this.opts.$type.on('click', 'a', function(){
		var val = $(this).attr('value');
		if(val == 'group')
			et.showGroups();
		else if(val == 'custom')
			et.showCustom();
		else
			et.showAll();
	});
	this.opts.$add.on('click', function(e){
		if(et.opts.$input.is('.hidden')){
			var group = et.opts.$select.val();
			if(group === undefined || group === null || group.trim().length === 0)
				return;
			et.opts.getGroupEmails(group, function(err, emails){
				et.addEmail.apply(et, [emails]);
			});
		}else{
			if(et.opts.$input.is(':disabled')){
				var emails = et.opts.$input.data('emails');
				if(emails === undefined || emails === null || emails.length === 0)
					return;
				et.addEmail.apply(et, [emails]);
			}else{
				var email = et.opts.$input.val();
				if(email === undefined || email === null || email.trim().length === 0)
					return;
				et.addEmail.apply(et, [email]);
			}
		}
	});
	this.opts.$list.on('click', 'a div span', function(){
		var email = $(this).parent().parent().text();
		et.emails.splice(et.emails.indexOf(email), 1);
		et.renderEmailList();
	});

	this.emails = [];
	this.showGroups = function(){
		et.opts.$input.addClass('hidden');
		et.opts.$select.parent().find('select, .bootstrap-select').removeClass('hidden');
		et.opts.$select.empty();
		et.opts.getGroups(function(err, groups){
			groups.forEach(function(g){
				et.opts.$select.append($('<option>', {
					text: g.Name,
					value: g.Name
				}));
			});
			et.opts.$select.selectpicker('refresh');
		});
	};
	this.showCustom = function(){
		et.opts.$select.parent().find('select, .bootstrap-select').addClass('hidden');
		et.opts.$select.selectpicker('refresh');
		et.opts.$input.removeClass('hidden').prop('disabled', false).val('').data('emails', undefined);
	};
	this.showAll = function(){
		var et = this;
		et.opts.$select.parent().find('select, .bootstrap-select').addClass('hidden');
		et.opts.$select.selectpicker('refresh');
		et.opts.$input.removeClass('hidden').prop('disabled', true).val('');
		et.opts.getAllEmails(function(err, emails){
			et.opts.$input.data('emails', emails).val(emails.length + ' found');
		});
	};
	this.addEmail = function(data){
		var emails;
		if(data instanceof Array)
			emails = data;
		else
			emails = [data];
		emails.forEach(function(email){
			if(et.emails.indexOf(email) == -1)
				et.emails.push(email);
		});
		et.renderEmailList();
	};
	this.renderEmailList = function(){
		et.opts.$list.empty();

		et.emails.forEach(function(e){
			et.opts.$list.append($('<a>', {
				'class': 'list-group-item',
				text: e
			}).append($('<div>', {
				'class': 'pull-right'
			}).append($('<span>', {
				'class': 'fa fa-times'
			}))));
		});
	};

	this.opts.$type.find('a[value="group"]').trigger('click');
}

function submitEmail(e){
	var $btn = $(this);
	$btn.button('loading');
	var data = $.extend(true, e.data.template.get(), {emails: e.data.emails.emails});
	$.ajax({
		url: '/email/send',
		data: data,
		complete: function(){
			$btn.button('reset');
		}
	});
}
