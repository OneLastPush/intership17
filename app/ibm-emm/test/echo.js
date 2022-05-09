var args = "";
process.argv.forEach(function(v, i, a){
	args += v + " ";
});
console.log(args);