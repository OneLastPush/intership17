	var gridX = -1;
	var gridY = -1;
function setPriority(widgets){
	var priority = [];
	var temp = createTempArray(widgets);

}
/**
 * This function return an formated array that 
 * will help to draw the widget on the excel preview
 * @return {[array]} [description]
 */
function createTempArray(widgets){
	var temp = [];
	console.log(widgets.components.length);
	var len = widgets.components.length;
	var ctr;
	var index = 0;
	/*
	 * This loop create the an array with all the 
	 * needed information to define the drawing 
	 * priority. For now everything is stored in the
	 * temp array.
	 *
	 * This process is done because we need to merge
	 * the three array into one. So, I prefered the
	 * approach where I store the value I needed
	 * at the same time.
	 *
	 * This loop add all the component information
	 * @field index - act as an Id
	 * @field type - can be a component, textarea or an graphic element
	 * @field x - x position
	 * @field y - y position
	 * @field height - y + height = where the last entry will be inserted
	 * @field width - x + width = where the last entry will be inserted
	 *
	 * The same apply for the next two loops
	 */
	console.log(len);
	for(ctr = 0; ctr < len; ctr++){
		var holder = {};
		var wholder = widgets.components[ctr];
		holder.index = ctr;
		holder.type ='component';
		holder.x = wholder.x;
		holder.y = wholder.y;
		holder.distanceOrigin = Math.sqrt(Math.pow(wholder.x, 2) + Math.pow(wholder.y, 2));
		console.log('WIDTH:::::');
		console.log(wholder.data[0]);
		holder.height = wholder.data.length;
		holder.width = wholder.data[0].rowValue.length;

		moveElementToPosition(sortByPriority(tempArray,index, holder),tempArray,holder);
		index++;

	}

	setupLoop(temp,widgets.textareas, 'textarea');
	setupLoop(temp,widgets.graphics, 'graphic');
	console.log('Here is the temp array');
	console.log(temp);

	return temp;
}
/*
 *  For Widgets textarea and graphic
 */
function setupLoop(tempArray ,array, typeOfWidget){
	for(ctr = 0, len = array.length; ctr < len; ctr++){
		var holder = {};
		var wholder = array[ctr];
		holder.index = ctr;
		holder.type = typeOfWidget;
		holder.x = wholder.x;
		holder.y = wholder.y;
		holder.distanceOrigin = Math.sqrt(Math.pow(wholder.x, 2) + Math.pow(wholder.y, 2));
		holder.height = wholder.height;
		holder.width = wholder.width;

		moveElementToPosition(sortByPriority(tempArray,index, holder),tempArray,holder);
		index++;


	}
}
/*
 *	This is used after all the widgets x and y are evaluted
 *  This function keep track of the grid minimum size
 */
function setGridSize(x,y){
	if(gridX < x){
		gridX = x;
	}
	if(gridY < y){
		gridY = y;
	}
}
function sortByPriority(array,len,widget){

	var mid,low = 0, high = len - 1, value = widget.distanceOrigin;
	while(low <= high){
		mid = Math.floor((low+high)/2);
		if(array[mid].distanceOrigin > value){
			high = mid - 1;
		}else{
			if(array[mid].distanceOrigin < value){
				low = mid + 1;
			}else{
				return mid;
			}
		}
	}
	return low;
	//Need a method that move all the element down

}
function moveElementToPosition(pos, array, element){
	var holder, ctr = pos, len = array.length;
	while(ctr <= len){
		holder = array[ctr];
		array[ctr] = element;
		element = holder;
		ctr++;
	}
}
