$('document').ready(function(){
	console.log("Growl Started");

	 $.growl({ title: "Growl", message: "The kitten is awake!" });
	$('#successGrowl').click(good);
	$('#dangerGrowl').click(danger);
	$('#warningGrowl').click(warn);
});
function warn(){
$.growl.warning({ title: "Growl WARNING", message: "The kitten is ugly!",
                duration: 0 });
}
function danger(){
 $.growl.error({ title: "Growl DANGER", message: "The kitten is attacking!" ,
                duration: 0});
}
function good(){
$.growl.notice({ title: "Growl NOTICE", message: "The kitten is cute!",
                duration: 0 });
}