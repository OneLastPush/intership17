var methods = {
	buildDateString : function(date){
		var year = this.stringLPadZeros(date.getFullYear(), 4);
		var month = this.stringLPadZeros(date.getMonth(), 2);
		var day = this.stringLPadZeros(date.getDate(), 2);
		var hours = this.stringLPadZeros(date.getHours(), 2);
		var minutes = this.stringLPadZeros(date.getMinutes(), 2);
		var seconds = this.stringLPadZeros(date.getSeconds(), 2);
		var milliseconds = this.stringRPadZeros(date.getMilliseconds(), 4);

		var string = year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds + '.' + milliseconds;
		return string;
	},
	stringLPadZeros : function(string, desiredLength){
		string = string + '';
		while (string.length < desiredLength)
		{
			string = '0' + string;
		}
		return string;
	},
	stringRPadZeros : function(string, desiredLength){
		string = string + '';
		while (string.length < desiredLength)
		{
			string = string + '0';
		}
		return string;
	},
	/**
	 * Escapes all RegExp characters in the given string.
	 *
	 * @param  {String} string The string in which to escape the RegExp
	 *                         characters.
	 * @return {String} The string with the characters escaped.
	 */
	escape : function(string) {
		return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	},
	/**
	 * This function transforms names into the
	 * proper case.
	 *
	 * @param  str - The string to be transformed
	 * @return the transformed string
	 */
	stringProperNames : function(str){
		var first = str.charAt(0).toUpperCase();
		var sub = str.substr(1).toLowerCase();
		return (first + sub);
	}
};

module.exports = methods;