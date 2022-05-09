function TemplateForm(opts){
	var tf = this;
	this.opts = $.extend(true, {
		autoFills: {},
		dateFormat: 'yy.mm.dd',
		timeFormat: 'hh:mm:ss tt',
		untilTimeFormat: 'HH:mm:ss',
		loc: {}
	}, opts);

	this.$container = $('<div>');
	this.$inputs = $('<div>');
	this.$divider = $('<div>', {'class': 'page-header no-margin'});
	this.$template = $('<div>');

	this.$container.append(this.$inputs, this.$divider, this.$template);

	this.$inputs.on('input change', 'input', function(){
		var name = $(this).attr('name');
		tf.fields[name] = $(this).val();
		if(tf.fields[name] === '')
			tf.fields[name] = name.toUpperCase();
		tf.buildTemplate.apply(tf);
	});
}
TemplateForm.prototype.build = function(){
	this.$inputs.empty();
	for(var f in this.fields)
		this.$inputs.append(this.buildInput(f, this.fields[f]));
	this.buildTemplate();
};
TemplateForm.prototype.buildRow = function(label, item){
	var $group = $('<div>', {'class': 'form-group'});
	var $label = $('<label>', {
		'class': 'control-label',
		text: this.opts.loc[label]? this.opts.loc[label]: label
	});
	$group.append($label, item);
	return $group;
};
TemplateForm.prototype.buildInput = function(key, defaultValue){
	var $input = $('<input>', {
		name: key,
		value: defaultValue,
		'class': 'form-control required'
	});
	if(key.match(/(date)|(time)/i)){ //datetime input
		$input.datetimepicker({
			dateFormat: this.opts.dateFormat,
			timeFormat: this.opts.timeFormat
		});
	}else if(name.match(/.*until.*/i)){ //time input
		$input.timepicker({
			timeFormat: this.opts.untilTimeFormat
		});
	}

	return this.buildRow(key, $input);
};
TemplateForm.prototype.buildTemplate = function(){
	this.$template.empty();

	for(var section in this.template){
		this.$template.append(this.buildRow(section, $('<div>', {
			name: this.opts.loc[section]? this.opts.loc[section]: section,
			html: this.fill(this.template[section]),
			'class': 'well well-sm'
		})));
	}
};
/**
 * Template sent in should be localized with english [fields]
 * @param {[type]} template text with [fields]
 */
TemplateForm.prototype.setTemplate = function(template){
	this.template = template;
	this.fields = {};
	for(var f in template){
		this.fields = $.extend(this.fields, this.parse(template[f]));
	}
	this.build();
};
TemplateForm.prototype.addAutoFills = function(autoFills){
	this.opts.autoFills = $.extend(true, this.opts.autoFills, autoFills);
};
TemplateForm.prototype.parse = function(text){
	var parser = /\[.+?\]/g;
	var data = {};
	var result, field;
	while((result = parser.exec(text))){
		field = result[0].replace(/\[|\]/g, '');
		this.fields[field] = this.opts.autoFills[field] || '';
	}
	return data;
};
TemplateForm.prototype.fill = function(text){
	for(var field in this.fields)
		text = text.replace(new RegExp('\\['+field+'\\]', 'gi'), this.fields[field]);
	return text;
};
TemplateForm.prototype.get = function(){
	var data = {};
	for(var f in this.template)
		data[f] = this.fill(this.template[f]);
	return data;
};
