var fs = require('fs');

/**
* Utility that can tail/head a file.
* Positive line number means head, negative means tail, 0 or null means whole.
*
* @param file string that says where file is located & its name
* @param lines number of lines to read (negative will do tail, 0 or null will read whole file)
* @param callback with err, data
* @version 1.1.0
* @author Ganna Shmatova
*/
function getLines(file, lines, callback){
	fs.stat(file, function(err, stats){
		if(err) return callback(err);
		if(!lines) return fs.readFile(file, callback);

		var fileSize = stats.size;
		if(fileSize <= 0) return callback(undefined, '');

		var bufferSize = 1024 * 64;
		var data = '';

		var position;
		//fns that differ between head & tail
		var getRemainingFileSize,
			getReadStartPosition,
			getNextNewline,
			getRestOfStringPos,
			recordAndGetLeftoverData,
			updatePosition,
			addMoreNoticeToFile;

		if(lines > 0){ //head
			position = 0;

			getRemainingFileSize = 	function(){ return fileSize - position; };
			getReadStartPosition =  function(buffer){ return position; };
			getNextNewline = function(str){ return str.indexOf('\n'); };
			getRestOfStringPos = function(str){ return str.length; };
			recordAndGetLeftoverData = function(newData, snipPos){
				data += newData.substring(0, snipPos + 1); //add to what we've read
				return newData.substring(snipPos + 1); //get rid of data we just processed/added
			};
			updatePosition = function(buffer){ position += buffer.length; };
			addMoreNoticeToFile = function(data){ return data + '<<< more >>> ...'; };
		}else{ //tail
			lines = -lines;
			position = fileSize;

			getRemainingFileSize = function(){ return fileSize - (fileSize - position); };
			getReadStartPosition = function(buffer){ return position - buffer.length; };
			getNextNewline = function(str){ return str.lastIndexOf('\n'); };
			getRestOfStringPos = function(str){ return 0; };
			recordAndGetLeftoverData = function(newData, snipPos){
				data = newData.substring(snipPos) + data; //add to what we've read
				return newData.substring(0, snipPos); //get rid of data we just processed/added
			};
			updatePosition = function(buffer){ position -= buffer.length; };
			addMoreNoticeToFile = function(data){ return '... <<< more >>>' + data; };
		}

		var readLines = 0;
		fs.open(file, 'r', function(err, stream){
			if(err)
				return callback(err);

			function read(){
				var length = getRemainingFileSize(); //how much is left to read
				if(length <= 0) //if nothing left to read
					return callback(undefined, data); //callback & exit

				var buffer = new Buffer(bufferSize > length? length: bufferSize); //min(buffersize or length)

				fs.read(stream, buffer, 0, buffer.length, getReadStartPosition(buffer), function(err, numRead, buffer){
					var newData = buffer.toString('utf8', 0, buffer.length);

					do{
						var snipPos = getNextNewline(newData);
						if(snipPos >= 0) //snip at new line, if works...
							readLines++; //track that we had a new line
						else
							snipPos = getRestOfStringPos(newData); //else get remaining

						newData = recordAndGetLeftoverData(newData, snipPos);
					}while(readLines < lines && newData.length > 0); //while still need new lines & have data

					if(readLines < lines){ //havent read all yet
						updatePosition(buffer);
						read();
					}else{ //done
						callback(undefined, addMoreNoticeToFile(data));
					}
				});
			}

			read(); //starts reading file
		});
	});
}
module.exports = getLines;