var fs = require('fs');
var path = require('path');

var config = require('smart-config');
var async = require('async');
var xml2json = require('xml-to-json');
var flatten = require('flat');

var emm = require('../../emm');
var cells = require('./cells');

var us = {
	getFields: function(flowchart, opts, audience, username, password, cb){
		var fieldsFile = path.join(config.get('General.public_folder'), path.basename(flowchart, '.ses') + '.json');
		generateXMLMappingFile(flowchart, opts, username, password, function(err, res){
			if(err) return cb(err);
			async.parallel({
				tables: function(cb){
					readXMLMappingFile(res.out, cb);
				},
				meta: function(cb){
					cells.getCells(flowchart, opts, username, password, function(err, res){
						if(err) return cb(err);
						res.audiences = [];
						res.cells.forEach(function(cell){
							if(res.audiences.indexOf(cell.audience) < 0)
								res.audiences.push(cell.audience);
						});
						cb(undefined, res);
					});
				}
			}, function(err, res){
				if(err) return cb(err);
				if(!res.tables || !res.meta.cells || !res.meta.audiences) return cb(new Error('Missing tables, cells or audiences.'));
				if(res.tables.length == 0 || res.meta.cells.length == 0 || res.meta.audiences.length == 0) return cb(new Error('Empty tables, cells or audiences.'));
				generateFieldsFile(fieldsFile, res.meta.audiences, res.tables, function(err, fields){
					if(err) return cb(err);
					var flatFields = flatten(fields);
					var flatFieldsArr = [];
					for(var f in flatFields)
						flatFieldsArr.push(f.substring(f.indexOf('.') + 1, f.length));
					if(flatFieldsArr.length == 0)
						throw new Error('No fields found.');
					res.fields = flatFieldsArr;
					cb(err, res);
				});
			})
		});
	}
};
module.exports = us;

/**
 * Gets the values from an "xml" (xml > jsonified) using a path. Accounts for surprise arrays & nulls cuz that's XMl for you.
 *
 * @param  {[object|array]} convertedXML [JSON reprsentatino of XML to parse. Can be object or array]
 * @param  {[array]} path         [array of paths to follow]
 * @return {[array]}              [array of the objects at the end of the provided path]
 */
function traverse(convertedXML, path){
	if(convertedXML === undefined)
		return [];

	var cursorSets = []; //obj will save all the traversal steps -- 0: step results, 1: step results...
	cursorSets.push(convertedXML instanceof Array? convertedXML: [convertedXML]); //consolidates input if obj or array

	for(var i in path){ //traversal loop
		var step = path[i];
		var nextCursors = [];
		cursorSets.push(nextCursors);

		for(var j in cursorSets[i]){ //go thru current set for this step
			var cursor = cursorSets[i][j];
			var nextCursor = cursor[step];

			if(nextCursor !== undefined){ //accounts for nulls
				if(nextCursor instanceof Array){ //accounts for surprise lists
					for(var k in nextCursor)
						nextCursors.push(nextCursor[k]);
				}else{
					nextCursors.push(nextCursor);
				}
			}

		}
	}
	return cursorSets[cursorSets.length-1]; //get all the final cursors & return them as result.
}

function generateXMLMappingFile(flowchart, opts, username, password, cb){
	var xmlFile = path.join(config.get('General.public_folder'), path.basename(flowchart, '.ses') + '.xml');
	if(!opts.partition)
		opts.partition = config.get('IBM Campaign.default_partition');
	emm.call('unica_acsesutil', ['-s', flowchart, '-h', opts.partition , '-x', '-o', xmlFile], {
		user: username,
		pw: password
	}, function(err, res){
		if (err) return cb(err);
		res.out = xmlFile;
		cb(undefined, res);
	});
}

function readXMLMappingFile(xmlFile, cb){
	xml2json({
		input: xmlFile
	}, function(err, res){
		if(err)
			return cb(err);

		var tables = [];
		var table;
		var userTables = traverse(res, ['TableManager', 'UserTables']);

		var recordTables = traverse(userTables, ['RecordTables', 'RecordTable', 'RelationsTable']);
		for(var i in recordTables){
			var recTable = recordTables[i];

			table = {};
			table.id = recTable.Table.$.TableID;
			table.fields = traverse(recTable.Table, ['DBBaseTable', 'FieldInfoList', 'FieldInfo', 'FieldName']);
			table.audience = recTable.Table.BaseKeyName;

			table.name = recTable.Table.TableName;
			table.refs = traverse(recTable.TableRelations, ['TableRelation', '$', 'DimTableID']);

			tables.push(table);
		}

		var factTables = traverse(userTables, ['FactTables', 'FactTable', 'RelationsTable']);
		for(var j in factTables){
			var factTable = factTables[j];

			table = {};
			table.name = factTable.Table.TableName;
			table.fields = traverse(factTable.Table, ['DBBaseTable', 'FieldInfoList', 'FieldInfo', 'FieldName']);
			table.audience = factTable.Table.BaseKeyName;

			table.id = factTable.Table.$.TableID;
			table.refs = traverse(factTable.TableRelations, ['TableRelation', '$', 'DimTableID']);

			tables.push(table);
		}
		cb(undefined, tables);
	});
}

function generateFieldsFile(fieldsFile, audiences, tables, cb){
	var fields = {};
	audiences.forEach(function(audience){
		fields[audience] = getAudienceFields(audience, tables);
	});
	fs.writeFile(fieldsFile, JSON.stringify(fields));
	cb(undefined, fields);
}

function getAudienceFields(audience, tables){
	var fields = {};
	for(var i in tables){
		var table = tables[i];
		if(table.audience == audience){
			var tablesFields = loadFields(table);
			fields[table.name] = {};
			for(var key in tablesFields)
				fields[table.name][key] = tablesFields[key];
		}
	}
	return fields;
	function loadFields(table){
		var fields = {};
		for(var k in table.fields)
			fields[table.fields[k]] = true;
		for(var i in table.refs){
			var ref = table.refs[i];
			for(var j in tables){
				var refTable = tables[j];
				if(refTable.id == ref){
					var refFields = loadFields(refTable);
					fields[refTable.name] = {};
					for(var key in refFields)
						fields[refTable.name][key] = refFields[key];
				}
			}
		}
		return fields;
	}
}