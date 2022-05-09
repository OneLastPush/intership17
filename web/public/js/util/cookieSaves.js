var cookieSaves = {
	all: [],
	registerInput: function($input, cookieName, defaultValue){
		cookieSaves.inputLoad($input, cookieName, defaultValue);
		cookieSaves.inputUpdate($input, cookieName);
		cookieSaves.all.push({$input: $input, cookieName: cookieName});
	},
	inputLoad: function($input, cookieName, defaultValue){
		var value = $.cookie(cookieName);
		if(!value && value !== 0)
			value = defaultValue;
		$input.attr('value', value);
		$input.trigger('change');
	},
	/**
	 * Ties input to a cookie value.
	 * @param  {[type]} $input     [jquery element for the input]
	 * @param  {[type]} cookieName [name of this cookie save]
	 * @return {[type]}            [nothing]
	 * @author  Olga Zlotea
	 */
	inputUpdate: function($input, cookieName){
		$input[0].oninput = function () {
			$(this).attr('value',$(this).val());
			$.cookie(cookieName, $(this).val());
		};
		$input[0].oninput();
	}
};