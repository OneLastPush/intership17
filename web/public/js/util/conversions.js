/**
* Converts seconds to format X days HH:mm:ss
* @param seconds int or float with seconds scope
*/
function secondsToReadable(seconds){
	var numdays = Math.floor(seconds / 86400);
	var numhours = Math.floor((seconds % 86400) / 3600);
	var numminutes = Math.floor(((seconds % 86400) % 3600) / 60);
	var numseconds = ((seconds % 86400) % 3600) % 60;
	numseconds = numseconds.toFixed(0);

	function zeroIt(num){
		return num <= 9? '0'+num: num;
	}

	return numdays + " " + loc.global.conversions.days + " " + zeroIt(numhours) + ":" + zeroIt(numminutes) + ":" + zeroIt(numseconds);
}

/**
* Converts from a lesser byte to another greater byte size. Accurate to 2 precision.
*
* @param bytes num
* @param forceMultiplier Do not multiply higher than this
* @param currMult if bytes num is not bytes but KB, MB, GB, etc.
*	Expects numbers 1, 2, 3 for those respectively, and onwards follows same pattern.
* @return object like {string: '12 KB', num: 12, size: 'KB', multiplier: 1}
*/
function bytesToReadable(bytes, forceMultiplier, currMult){
	bytes = parseInt(bytes);
	var times = 1024;
	for(var i=currMult?currMult:0; bytes>times; i++){
		if(forceMultiplier && i == forceMultiplier)
			break;
		bytes /= times;
	}
	bytes = bytes.toFixed(2);
	var size;
	switch(i){
		case 0: size = 'byte'; break;
		case 1: size = 'KB'; break;
		case 2: size = 'MB'; break;
		case 3: size = 'GB'; break;
		case 4: size = 'TB'; break;
		case 5: size = 'PB'; break;
		case 6: size = 'EB'; break;
		case 7: size = 'ZB'; break;
		case 8: size = 'YB'; break;
	}
	return {string: bytes + ' ' + size, num: bytes, symbol: size, multiplier: i};
}
