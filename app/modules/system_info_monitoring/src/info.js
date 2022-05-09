var os = require('os');
var exec = require('child_process').exec;

var diskspace = require('diskspace');
var duration = require('duration');
var bytes = require('bytes');
var log = require('smart-tracer');

var watchedPaths = [];
var info = {
	host_name: os.hostname(),
	type: os.type(),
	platform: os.platform(),
	architecture: os.arch(),
	release: os.release(),

	model: null,
	uptime: new duration(new Date(new Date().getTime() - os.uptime()*1000)).toString(),

	cpus: os.cpus(),
	ram: null,
	swap: null,

	network: {
		usage: null,
		interfaces: os.networkInterfaces()
	},

	disk_usage: null
};
getModel(function(err, model){
	if(err) log.error(err);
	info.model = model;
});
function getModel(cb){
	var data = '';
	if(os.type() == 'Windows_NT'){
		var count = 2;
		var doDone = function doDone(err){
			if(err && count >= 0){
				count = -1;
				cb(err, data);
			}else if(--count===0)
				cb(null, data);
		};

		exec('wmic csproduct get vendor, version', function(err, stdout){
			var match = stdout.match(/\n(.+)/);
			if(match)
				data = match[1].trim() + ' ' + data;
			doDone(err);
		});
		exec('wmic computersystem get model', function(err, stdout){
			var match = stdout.match(/\n(.+)/);
			if(match)
				data = data + ' ' + match[1].trim();
			doDone(err);
		});
	}else{
		exec('dmidecode | grep "Product Name"', function(err, stdout){
			data = stdout;
			cb(err, data);
		});
	}
}

function updateInfo(cb){
	var count = 6;
	function doDone(){
		if(--count===0)
			cb(info);
	}
	getUptime(function(uptime){
		info.uptime = uptime;
		doDone();
	});
	getCPUUsage(1000, function(err, usage){
		if(err) log.error(err);
		info.cpus.forEach(function(cpu, index, array){
			cpu.ticks_since_boot = cpu.times; //renames times
			delete cpu.times;
			cpu.usage = usage[index] + ' %';
		});
		doDone();
	});
	getRAM(function(err, ram){
		if(err) log.error(err);
		info.ram = ram;
		doDone();
	});
	getSwap(function(err, swap){
		if(err) log.error(err);
		info.swap = swap;
		doDone();
	});
	getDiskUsage(function(err, diskUsage){
		if(err) log.error(err);
		info.disk_usage = diskUsage;
		doDone();
	});
	getNetworkUsage(function(err, netUsage){
		if(err) log.error(err);
		info.network.usage = netUsage;
		doDone();
	});
}
function getUptime(cb){
	cb(undefined, new duration(new Date(new Date().getTime() - os.uptime()*1000)).toString());
}
function getCPUUsage(pollingMiliseconds, cb){
	function pollAverageCPUCoreUse(){
		var cpus = os.cpus();
		var usage = 0;
		var idle = 0;

		var cores = [];

		for(var i=0; i<cpus.length; i++){
			var time = cpus[i].times;
			cores.push({"usage": time.user + time.nice + time.sys + time.irq, "idle": time.idle});
		}

		return cores;
	}

	var before = pollAverageCPUCoreUse();
	setTimeout(function(){
		var now = pollAverageCPUCoreUse();

		var cores = [];

		for(var i=0; i<before.length; i++){
			var usage = now[i].usage - before[i].usage;
			var idle = now[i].idle - before[i].idle;

			cores.push(((usage / (idle + usage))*100).toFixed(2));
		}
		cb(undefined, cores);
	}, pollingMiliseconds? pollingMiliseconds: 1000);
}
function getRAM(cb){
	var free = os.freemem();
	var total = os.totalmem();
	var ram = {
		free: free,
		used: total - free,
		total: total
	};
	cb(undefined, ram);
	return ram;
}
function getSwap(cb){
	if(os.type() == 'Windows_NT'){
		exec('wmic pagefile list /format:list', function(err, stdout, stderr){
			if(err || stderr) cb(err + stderr);

			var swap = {
				used: parseInt(stdout.match(/CurrentUsage=(\d+)/i)[1]*1024*1024, 10),
				total: parseInt(stdout.match(/AllocatedBaseSize=(\d+)/i)[1]*1024*1024, 10)
			};
			swap.free = swap.total - swap.used;
			cb(undefined, swap);
		});
	}else{
		exec('free', function(err, stdout, stderr){
			if(err || stderr) cb(err + stderr);

			var result = stdout.match(/Swap:\s*(\d+)\s*(\d+)/i);
			var swap = {
				used: parseInt(result[2], 10),
				total: parseInt(result[1], 10)
			};
			swap.free = swap.total - swap.used;
			cb(undefined, swap);
		});
	}
}
function getNetworkUsage(cb){
	var data = {'download': null, 'upload': null};
	if(os.type() == 'Windows_NT'){
		var queryBytes = function(cb){
			exec('netstat -e', function(err, stdout){
				var data = {download: null, upload: null};
				var res = stdout.match(/\nBytes(.+)$/im);
				if(res){
					res = res[1].trim().split(/\s+/);
					data.download = parseInt(res[0]);
					data.upload = parseInt(res[1]);
				}
				cb(err, data);
			});
		};

		queryBytes(function(err, bytes){
			if(err) return cb(err, data);
			setTimeout(function(){
				queryBytes(function(err, bytes2){
					if(err) return cb(err, data);

					data.download = bytes2.download - bytes.download;
					data.upload = bytes2.upload - bytes.upload;

					cb(undefined, data);
				});
			}, 1000);
		});
	}else{
		exec('dstat -n --nocolor 1 1', function(err, stdout){
			var res = stdout.match(/\n(.+)\n*$/);
			if(res){
				res = res[1].trim().split(/\s+/);

				var convertToBytes = function(amt){
					var units = ['B','k','M','G'];
					var unit = amt.match(/([a-z])/i);
					if(unit)
						unit = unit[1];
					amt = parseInt(amt, 10);
					var index = units.indexOf(unit);
					while(index > 0){
						amt *= 1024;
						index--;
					}
					return amt;
				};

				data.download = convertToBytes(res[0]);
				data.upload = convertToBytes(res[1]);
			}
			cb(err, data);
		});
	}
}
function getDiskUsage(cb){
	var disks = {};

	var getDisk;
	if(os.type() == 'Windows_NT'){
		getDisk = function(path, cb){
			var disk = path.match(/^([a-z]):?[\/\\]?/i)[1];
			if(disks[disk]) //if already have, no need to re-get
				return cb();
			diskspace.check(disk, function(err, total, free, status){
				cb(err, disk, {
					free: parseInt(free, 10),
					total: parseInt(total, 10)
				});
			});
		};
	}else{
		getDisk = function(path, cb){
			exec('df -k "' + path + '"', function(err, stdout){
				// Filesystem     1K-blocks     Used Available Use% Mounted on
				// /dev/xvdj      103212320 67538008  30431432  69% /vm
				if(err)
					return cb(err);
				var res = stdout.match(/\n(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\n*$/);
				var used = parseInt(res[3], 10);
				var free = parseInt(res[4], 10);
				var total = used + free;
				var mount = res[6];

				cb(undefined, mount, {use: used*1024, free: free*1024, total: total*1024});
			});
		};
	}

	var counter = watchedPaths.length + 1;
	function doDone(err, mount, size){
		if(mount && size)
			disks[mount] = size;

		if(err && counter >= 0){
			cb(err);
			counter = -1;
		}else if(--counter===0){
			cb(undefined, disks);
		}
	}

	//find all the disks
	for(i=0; i<watchedPaths.length; i++)
		getDisk(watchedPaths[i], doDone);
	doDone();
}

module.exports = function(pathsToWatch){
	if(pathsToWatch)
		watchedPaths = pathsToWatch;
	return {
		setPaths: function(paths){
			watchedPaths = paths;
		},
		info: info,
		updateInfo: updateInfo,
		getUptime: getUptime,
		getCPUUsage: getCPUUsage,
		getRAM: getRAM,
		getSwap: getSwap,
		getDiskUsage: getDiskUsage,
		getNetworkUsage: getNetworkUsage
	};
};