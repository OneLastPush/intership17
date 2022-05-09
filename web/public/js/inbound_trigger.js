/**
* javascript for sending Inbound triggers to IBM EMM campaigns.
* 
* Requires:
* 	campaign/inboundTrigger.js
*
* @author Ganna Shmatova
*/

$(window).load(function(){
	$('#broadcastTrigger').append(new InboundTrigger());
});