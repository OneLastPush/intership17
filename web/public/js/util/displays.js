/**
 * @author Ganna Shmatova
 * @version 2.1.0
 **/

/**
* Makes an alert box with your content. Fades out after X miliseconds.
* 
* @param content - text or html, or jquery to put inside the alrt
* @param color - Optional. alert color class -- alert-success/info/warning/danger. Uses info by default.
* @param ms - Optional. Miliseconds for alert to stay until disappearing. Default is 3000.
* @return JQuery alert object
*/
function doAlert(content, color, ms){
	if(!color) color = 'alert-info';

	var $alert = $('<div>',{
		role: 'alert',
		'class': 'alert-dismissible alert ' + color + ' fade in'
	});

	
	$alert.append($('<button>',{
		'class': 'close alert-dismissible',
		'data-dismiss': 'alert',
		text: 'x'
	}));

	$alert.append(content);

	$alert.alert();
	if(ms !== 0){
		setTimeout(function(){
			$alert.alert('close');
		}, ms? ms : 3000);
	} 
	return $alert;
}

/*
* Appends a log to an element ided #logs. #logs should be an unordered list (<ul>)
* with the class list-group.
* It displays a message with a toggle for showing a more detailed message.
* 
* @param details Detailed message that will only be displayed if toggled open.
*		Accepts html strings (so contents can be styled/customly markedup).
* @param msg Message that will be displayed
* @author Ganna Shmatova
*/
function displayLog(msg, details){
	//container for log
	var log = $('<li>', {
		"class": "list-group-item"
	});

	//simple msg
	var displayMsg = $('<span>', {
		text: msg,
		"class": "medium-padding"
	});
	log.append(displayMsg);

	//if theres details, add a toggle and collapsed details div
	if(details.length > 0){
		var toggle = $('<span>', {
			"class": "medium-margin caret"
		});
		displayMsg.append(toggle);

		var displayDetails = $('<div>', {
			"class": "collapse"
		});
		displayDetails.append( $('<div>', {
			html: details,
			"class": "well well-sm"
		}));

		displayMsg.on('click', function(e){
			displayDetails.collapse('toggle');
		});

		log.append(displayDetails);
	}

	//add currently made log to #logs
	$('#logs').append(log);
}

/**
* Displays msg and title in modal box.
* This can be overriden. Just simply make your own method
* with the same name and number of parameters.
* 
* @title text
* @msg HTML text
* @param unique Optional. Boolena if you want only unqiuely titled messages to appear.
* @param btns [] of {name: 'Okay', action: function(){alert('did a thing');}}
* @param onClose function to run when message closes.
* @author Ganna Shmatova
* @version 1.3
*/
function displayMsg(title, details, unique, btns, onClose, closeBtn){
	modal.enQueue(title, details, unique, btns, onClose, closeBtn);
}

/**
* Object that displays message in a modular box.
* It enqueues messages and displays them in order, one by one.
* Supports custom buttons and actions.
*
* @version 1.4.1
* @author Ganna Shmatova
*/
var modal = new (function(){
	//private object variables/internals start here.
	var queue = [];

	/*
	* Puts up new message and title to be enqueued to show. If nothing
	* is showing, it starts showing.
	*
	* @param title text
	* @param msg HTML text
	* @param unique Boolean if this title/message should have a unique title (otherwise it is not added to queue).
	* @param btns [] of {name: 'Okay', action: function(){alert('did a thing');}}
	* @param onClose function to run when modal closes.
	* @Deprecated
	*/
	function enQueue(title, msg, unique, btns, onClose, closeBtn){
		var opts = {
	        "titleText": title,
	        "msg": msg,
	        "btns": btns,
	        "onClose": onClose
	    };
	    if(closeBtn)
	        opts.closeBtn = closeBtn;
	    make(opts, unique);
	}

	/**
	* Settings:
	*	{
	*		"titleText": 'Modal', //title of modal (text)
	*		"msg": 'Box', //message/details of modal (html)
	*		"btns": null, //buttons on modal. [] of {name: 'Okay', action: function(){alert('did a thing');}}
	*		"closeBtn": true, //if to show close button
	*		"onClose": null //function run when modal dismissed (close btn, clicking outside)
	*	}
	*
	* @param modal settings object
	* @param if this modal is uniquely tagged by title 
	*	(duplicate title won't be added again if in active/queue already)
	*/
	function make(modal, unique){
		if(unique){
			for(var i=0; i < queue.length; i++){
				if(queue[i].titleText == modal.titleText){
					return;
				}
			}
		}

		queue.push($.extend({
			"titleText": 'Modal',
			"msg": 'Box',
			"btns": null,
			"closeBtn": true,
			"onClose": null,
			"onCloseBtn": null
		}, modal));
		

		if( $('#modalBox').length === 0) //if none active,
			doModal();
	}

	/*
	* Looks at queue, shows what's on top of queue.
	* On modal box exit, calls itself to show next queue item.
	*/
	function doModal(){
		if(queue.length > 0){
			var curr = queue[0];

			var container = $('<div>', {
				id: 'modalBox',
				"class": "modal fade"
			});
			var modal = $('<div>', {
				"class": "modal-dialog modal-content"
			});
			container.append(modal);
			container.on('hidden.bs.modal', function(e){
				container.remove();
				queue.shift();
				doModal();
			});

			var header = $('<div>', {
				"class": "modal-header bg-primary"
			});
			header.append( $('<h4>', {
				text: curr.titleText,
				"class": "modal-title"
			}));

			var body = $('<div>', {
				"class": "modal-body overflow"
			});
			body.append( $('<p>', {
				html: curr.msg
			}));

			var footer = $('<div>', {
				"class": "modal-footer"
			});
			if(curr.btns){
				var domBtn;
				for(var i=0; i<curr.btns.length; i++){
					domBtn = $('<input>', {
						type: 'button',
						"data-dismiss": "modal",
						value: curr.btns[i].name,
						"class": 'btn btn-default'
					});
					domBtn.on('click', curr.btns[i].action);
					footer.append(domBtn);
				}
			}

			if(curr.closeBtn){
				var closeBtn = $('<input>', {
					type: 'button',
					"data-dismiss": "modal",
					value: curr.closeBtn !== true ? curr.closeBtn: 'Cancel',
					"class": 'btn btn-default'
				});
				if(curr.onCloseBtn) closeBtn.on('click', curr.onCloseBtn);
				footer.append(closeBtn);
			}
			

			modal.append(header);
			modal.append(body);
			modal.append(footer);

			$('body').append(container);

			if(curr.onClose){
				container.on('hide.bs.modal', function(){
					curr.onClose();
				});
			}

			container.modal({
				backdrop: true,
				keyboard: true,
				show: true
			});
		}
	}

	//public object variables/interface
	this.enQueue = enQueue;
	this.make = make;
})();