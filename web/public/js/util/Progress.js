/**
* var prog = new Progress(opts);
* $('#someplace').append(prog.container);
* 
* //optional. Progress bar starts hidden.
* prog.show();
*
* //Setting a progress between 0 and 100 (exclusive) makes it visible. 
* prog.set('Things happened', 50); //outside 0 & 100 makes it invisible
*
* prog.step('A thing happened'); //increments a step & derives % using opts.steps
* //works like set, but less work for you.
* prog.reset(); //resets current step count to 0 & hides. Used when using step system.
*
* prog.hide();
*
* prog.remove(); //removes events & HTML elements
* 
* 
* Requires:
* 	Boostrap 3
* 
* 
* @param opts {
*		progressClass: 'progress-bar-info', //progress bar class from bootstrap
*		precision: 0, //precision of progress % to show
*		currStep: 0, //current step. Optional. Starting step/manualy step override. Used in step().
*		steps: 10 //num of steps total. Optional. Used for step()
* 	}
* @version 1.2.0
* @author Ganna Shmatova
*/
function Progress(opts){
	opts = $.extend({
		progressClass: 'progress-bar-info',
		hideClass: 'hidden',
		precision: 0,
		currStep: 0,
		steps: 10
	}, opts);

	var container = $('<div>',{
		"class":"col-xs-12 "
	});
	var bar = $('<div>',{
		'class': 'progress'
	});
	container.append(bar);
	var progress = $('<div>',{
		'role':'progressbar',
		'aria-valuemin': '0',
		'aria-valuemax': '100',
		"class":'progress-bar ' + opts.progressClass
	});
	bar.append(progress);
	progress.append('<span>');
	hide();


	function set(desc, perc){
		perc = parseInt(perc).toFixed(opts.precision);
		if(perc > 0 && perc < 100)
			show();
		else
			hide();
		progress.children('span').html(desc + ": " + perc + '%');
		progress.css('width', perc + '%');
	}

	function step(desc){
		opts.currStep++;
		set(desc, opts.currStep/opts.steps*100);
	}

	function reset(){
		opts.currStep = 0;
		hide();
	}

	function show(){
		container.removeClass(opts.hideClass);
	}

	function hide(){
		container.addClass(opts.hideClass);
	}

	function remove(){
		container.off().remove();
	}

	this.container = container;
	this.opts = opts;
	this.step = step;
	this.reset = reset;
	this.set = set;
	this.show = show;
	this.hide = hide;
	this.remove = remove;
}