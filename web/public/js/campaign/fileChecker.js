/**
* Requires:
*	formHelper.js to be linked to the same html page before this. (uses its methods)
*
* @author Ganna Shmatova
* @version 2.0.0
**/

/**
* Queries back-end server asking it if the path in the partition provided
* is a valid file/exists. Returns true or false in the callback function.
* 
* @param flePath path
* @param partition the partition folder name this file resides in
* @param callback function that is called when response is recieved. Takes 1 param, a boolean.
* @author Ganna Shmatova
*/
function campaignFileExists(file, partition, cb){
	$.ajax({
		url: '/config/get',
		data: { item: 'IBM Campaign.root' },
		dataType: 'text',
		success: function(root){
			$.ajax({
				type: 'POST',
				url: '/emm/fs/exists',
				dataType: 'text',
				data: {file: root+'/partitions/'+partition+'/'+file},
				success: function(exists){
					cb(exists);
				},
				error: function(){
					cb(false);
				},
				statusCode: $.extend(statusHandler, {
					404 : function(errRes, status, res){ //overwrite this to not give error
						//404 is given if file not found
					}
				})
			});
		},
		error: function(){
			cb(false);
		}
	});
}

/**
* Attaches 'if file exists checking' event to specified DOM objects. It checks the DOM's value on blur
* (when you click away from the input box). Uses the formHelpers validation technique 
* (so colors background that off-red & requirs formHelpers.js).
* 
* @param jqFile JQuery object of the DOM that has the value of the file (will be serialized &
*		renamed to the expected value/key)
* @param jqPartition JQuery object that signifies the partition (will be serialized &
*		renamed to the expected value/key)
* @author Ganna Shmatova
*/
function attachFileValidatorOnBlurEvent(jqFile, jqPartition){
	jqFile.on('blur', function(e){
		var fileInput = $(this);
		campaignFileExists(jqFile.val(), jqPartition.val(), function(exists){
			validate(fileInput, function(){ //formHelper.js validate method used to display error
				return !exists;
			});

		});
	});
}

/**
* On page load, automatically attach file validation events to
* every .campFile and use the partition value from #partition.
* 
* @author Ganna Shmatova
*/
$(window).load(function(){
	attachFileValidatorOnBlurEvent($('.campFile'), $('#partition'));
});