/**
* Makes inputs based on string given. [] values make input with [name], and label 'name'.
*
* Requires:
*	JQuery
*	Bootstrap 3
* 	JQueryUI 1.6+
*		JQuery-browser with versions 1.9+
*	JQueryUI timepicker addon
*
*
* var template = new TemplateForm(opts); //make obj. Opts optional.
* $('#something').append(template.container); //attach it to something on your page
*
* var data = {
*	subject: 'Hello World!',
* 	body: 'Hello, my name is [name]!'
* }
* //values in [] will be made into inputs & update live.
*
* template.set(data); //give data so it will make inptus & template DOMs
*
* template.serialize() //Can also .serialize,
* //which will return data with the input values filled in palce of []s
*
*
* @param opts  {
*		inputClass: 'required', //any appending classes for inputs, ei, like a .required
*		autofills: {}, //will autofill fields with these values (ei, {name: 'Susan'})
*		dateFormat: 'yy.mm.dd', //will be applied to every 'date' input
*		timeFormat: 'hh:mm:ss tt', //will be applied to every 'date' input
*		untilTimeFormat: 'HH:mm:ss' //will be applied to every input with 'until' in its name.
*	}
* @version 1.0.0
* @author Ganna Shmatova
*/
function TemplateForm(opts2){
	var opts = $.extend({
		inputClass: 'required', //any appending classes for inputs, ei, like a .required
		autofills: {}, //will autofill fields with these values (ei, {name: 'Susan'})
		dateFormat: 'yy.mm.dd', //will be applied to every 'date' input
		timeFormat: 'hh:mm:ss tt', //will be applied to every 'date' input
		untilTimeFormat: 'HH:mm:ss' //will be applied to every input with 'until' in its name.
	}, opts2);

	var $container = $('<div>');
	var template;
	var fields;

	var $inputs = $('<div>');
	var $template = $('<div>');

	function build(){
		var $divider = $('<div>',{
			'class': 'page-header no-margin'
		});
		$container.append($inputs, $divider, $template);
	}
	build();

	// wraps a label and any item in a form-group & returns the form-group
	function makeRow(labelName, itemTwo){
		var $group = $('<div>',{
			'class': 'form-group'
		});
		var $label = $('<label>',{
			'class': 'control-label',
			//For internationalization to work, the [content] of the square brackets
			//in the template (in send_email.js) needs to be the same string as
			//the key in the language file
			text: loc.js[labelName.replace(/ /g,'')]
		});
		$group.append($label, itemTwo);
		return $group;
	}

	//clears known fields & DOM inputs,
	//finds all fields in template & makes new inputs.
	function makeInputs(){
		$inputs.empty();
		fields = {};
		for(var key in template){
			$.extend(fields, parseForFields(template[key]));
		}

		var $input;
		for(var name in fields){
			$input = $('<input>',{
				name: name,
				value: fields[name],
				'class': 'form-control ' + opts.inputClass
			});

			if(name.match(/.*date.*/i)){ //date input
				$input.datetimepicker({
					dateFormat: opts.dateFormat,
					timeFormat: opts.timeFormat
				});
			}else if(name.match(/.*until.*/i)){ //time input
				$input.timepicker({
					timeFormat: opts.untilTimeFormat
				});
			}
			//string input goes on input event
			//change is for time/date
			$input.on('input change', inputChangeEvnt);

			$inputs.append(makeRow(name, $input));
		}
	}
	//updates fields obj with values & rebuilds DOM template
	function inputChangeEvnt(){
		var name = $(this).attr('name');
		fields[name] = $(this).val();
		// If the input is blank let the user know that something goes there
		if ($(this).val() === '') {
			fields[name] = name.toUpperCase();
		}

		buildTemplate();
	}
	// clears template DOM elements & remakes them.
	function buildTemplate(){
		$template.empty();
		for(var section in template){
			var data = fillFields(template[section]);

			$template.append(makeRow(section, $('<div>',{
				name: section,
				html: data,
				'class':'well well-sm'
			})));
		}
	}

	// parses template for [field]s. Sets them to autofills or empty strings.
	// returns fields {}.
	function parseForFields(string){
		var parser = /\[.+?\]/g;
		var fields = {};
		var name;
		while((result = parser.exec(string))){ //make new
			name = result[0].replace(/\[|\]/g, '');
			fields[name] = opts.autofills[name] || '';
		}
		return fields;
	}
	//replaces [] values with fields values
	function fillFields(string){
		for(var field in fields)
			string = string.replace(new RegExp('\\[' + field + '\\]', 'gi'), fields[field]);
		return string;
	}



	//***** PUBLIC METHODS & OBJECTS *****//
	this.container = $container;
	this.set = function(template2){
		template = template2;
		makeInputs();
		buildTemplate();
	};
	this.get = function(){
		var data = {};
		for(var section in template){
			data[section] = fillFields(template[section]);
		}
		return data;
	}
	this.serialize = function(){
		var serial = '';
		for(var section in template)
			serial += '&' + section + '=' + encodeURIComponent(fillFields(template[section]));

		if(serial >= 1)
			serial = substring(1); //gets rid of first &
		return serial;
	};
}
