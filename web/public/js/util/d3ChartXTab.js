/**
 * Convenience class for building d3js chart for crosstab report.
 *
 * //make
 * var container = d3.select('#yourchart');
 * var chart = new d3Chart()
 * 	.width(container.width())
 * 	.data(data)
 * 	.container(container)
 * 	.update();
 *
 * //update on resize:
 * chart
 * 	.width(container.width())
 * 	.update();
 *
 * //change data & update chart
 * chart
 * 	.data(data)
 * 	.update();
 *
 * @author Ganna Shmatova
 * @version  1.1.2
 */
function d3ChartXTab(config){
	var me = this; //internal vars & fns object
	var outside = {}; //public control object of this chart instance

	// -- properties -- //
	config = $.extend({
		width: $(window).width()*0.8,
		height: 600,
		margin: {top: 20, right: 10, bottom: 30, left: 100},

		colors: ['#333399', '#3366CC', '#003399'],
		bg: 'rgb(240, 240, 245)',
		label: 'rgb(172, 172, 172)',

		data: [],
		headersX: [],
		headersY: [],
		container: d3.select('body')
	}, config);

	//my laziness knows no bounds
	(function(){ //closure so this fn is cached then poofs after we use it
		function makeConfigProp(key){
			return function(value){
				if(!arguments.length) return config[key];
				config[key] = value;
				return outside;
			};
		}
		for(var prop in config) //no bounds
			outside[prop] = makeConfigProp(prop);
	})();

	function create(){ //builds all elements
		//-- building fns inited --//
		me.colors = d3.scale.ordinal();
		me.zoom = d3.behavior.zoom()
			.on('zoom', doZoom);
		me.scaleX = d3.scale.ordinal();
		me.scaleY = d3.scale.ordinal();

		me.axisX = d3.svg.axis()
			.scale(me.scaleX)
			.orient('bottom');
		me.axisY = d3.svg.axis()
			.scale(me.scaleY)
			.orient('left');

		me.tip = d3.tip()
			.attr('class', 'd3-tip')
			.html(function(d){
				return '<span style="color:#197bb0">['+config.headersX[d.x]+'] ['+config.headersY[d.y]+ ']</span><br>' + d.value;
			});

		//-- elements inited --//
		me.svg = config.container.append('svg');

		me.chart = me.svg.append('g')
			.call(me.tip)
			.call(me.zoom);

		var defs = me.chart.append('defs');
		me.xClip = defs.append('svg:clipPath')
			.attr('id', 'x-clip')
		.append('svg:rect');
		me.yClip = defs.append('svg:clipPath')
			.attr('id', 'y-clip')
		.append('svg:rect');
		me.clip = defs.append('svg:clipPath')
			.attr('id', 'clip')
		.append('svg:rect');
		me.bg = me.chart.append('rect');

		me.chartAreaX = me.chart.append('g')
			.attr('clip-path', 'url(#x-clip)');
		me.chartAreaY = me.chart.append('g')
			.attr('clip-path', 'url(#y-clip)');

		me.chartArea =  me.chart.append('g')
			.attr('clip-path', 'url(#clip)');

		me.xAxis = me.chartAreaX.append('g');
		me.yAxis = me.chartAreaY.append('g');

		me.dataDisplay = me.chartArea.append('g');
	}
	create(); //autocalls / is the init/constructor

	// -- publically callable fns --//
	function update(){ //sets configs on all elements
		compute();
		$(config.container.node()).append(me.svg.node()); //jquery cuz fuckit

		me.svg
			.attr('width', config.width)
			.attr('height', config.height);

		me.chart
			.attr('transform', 'translate('+config.margin.left+','+config.margin.top+')');

		me.bg
			.attr('fill', config.bg)
			.attr("width", me.width)
			.attr("height", me.height);

		me.xClip
			.attr('x', 0)
			.attr('y', -config.margin.top)
			.attr('width', me.width)
			.attr('height', config.height);
		me.yClip
			.attr('x', -config.margin.left)
			.attr('y', 0)
			.attr('width', config.width)
			.attr('height', me.height);
		me.clip
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', me.width)
			.attr('height', me.height);

		me.xAxis
			.attr('class', 'x axis')
			.attr('transform', 'translate(0,'+me.height+')')
			.call(me.axisX);

		me.yAxis
			.attr('class', 'y axis')
			.call(me.axisY);

		me.rows = me.dataDisplay
			.attr('width', me.width)
			.attr('height', me.height)
		.selectAll('g')
			.data(config.data);
		me.rows.enter().append('g');
		me.rows
			.attr('transform', function(d, i){
				return 'translate('+me.scaleX.rangeBand()/2+','+(me.height - me.scaleY.rangeBand()*(i+0.5))+')';
			});

		me.columns = me.rows
		.selectAll('rect')
			.data(function(d){ return d; });
		me.columns.enter().append('rect')
			.on('mouseover', me.tip.show)
			.on('mouseout', me.tip.hide);
		me.columns
			.each(function(d){ d.scale = d.value/me.max; })
			.attr('fill', function(d){ return me.colors(d.value); })
			.attr('x', function(d, i){
				return me.scaleX.rangeBand()*i - (me.scaleX.rangeBand()*d.scale)/2;
			})
			.attr('y', function(d, i){ return -(me.scaleY.rangeBand()*d.scale)/2; })
			.attr('width', function(d){ return me.scaleX.rangeBand()*d.scale; })
			.attr('height', function(d){ return me.scaleY.rangeBand()*d.scale; });

		me.rows.exit().remove();
		me.columns.exit().remove();

		//extra styling/autogen items styling
		me.chart.selectAll('path')
			.attr('stroke', 'rgb(172, 172, 172)')
			.attr('fill', 'none');
		me.chart.selectAll('line')
			.attr('stroke', 'rgb(172, 172, 172)')
			.attr('fill', 'none');
		me.chart.selectAll('.axis line')
			.attr('stroke-dasharray', '5,5');
		me.chart.selectAll('.axis text')
			.style('font', '10px sans-serif');

		//compute positioning/zoom
		me.zoom.event(me.chart.transition().duration(1));

		return outside;
	}
	outside.update = update;

	// -- private fns -- //
	function compute(){ //sets extra/internal variables using config properties
		me.width = config.width - config.margin.left - config.margin.right;
		me.height = config.height - config.margin.top - config.margin.bottom;

		var values = [];
		for(var y=0; y<config.data.length; y++){
			for(var x=0; x<config.data[y].length; x++){
				config.data[y][x].y = y;
				config.data[y][x].x = x;
				values.push(config.data[y][x].value);
			}
		}
		me.max = d3.max(values);
		me.colors
			.domain(values)
			.range(config.colors);

		me.scaleX
			.domain(config.headersX)
			.rangeRoundBands([0, me.width], 0);
		me.scaleY
			.domain(config.headersY)
			.rangeRoundBands([me.height, 0], 0);

		me.axisX
			.tickSize(10)
			.tickSize(-me.height); //extends tick across chart (grids it)
		me.axisY
			.ticks(10)
			.tickSize(-me.width); //extends tick across chart (grids it)

		me.zoom.scaleExtent([1, config.data.length/4]);
	}

	function doZoom(){
		var x = d3.event.translate[0];
		var y = d3.event.translate[1];
		var scale = d3.event.scale;
		var scaleXZoom = me.scaleX.copy().rangeRoundBands([0, me.width * scale], 0);
		var scaleYZoom = me.scaleY.copy().rangeRoundBands([me.height * scale, 0], 0);

		me.dataDisplay
			.attr('transform', 'translate('+x+','+y+')scale('+scale+','+scale+')');

		me.xAxis
			.attr('transform', 'translate('+x+','+me.height+')')
			.call(me.axisX.scale(scaleXZoom));
		me.yAxis
			.attr('transform', 'translate(0,'+y+')')
			.call(me.axisY.scale(scaleYZoom));
	}

	return outside;
}