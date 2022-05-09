/**
 * Convenience class for building d3js chart for profile report.
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
 * @version  1.1.1
 */
function d3ChartProfile(config){
	var me = this; //internal vars & fns object
	var outside = {}; //public control object of this chart instance

	// -- properties -- //
	config = $.extend({
		width: $(window).width()*0.8,
		height: 600,
		margin: {top: 20, right: 20, bottom: 30, left: 50},

		color: 'steelblue',
		bg: 'rgb(240, 240, 245)',
		labelInside: 'rgb(255, 255, 255)',
		labelOutside: 'rgb(172, 172, 172)',

		data: [],
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
		me.zoom = d3.behavior.zoom()
			.on('zoom', doZoom);
		me.scaleX = d3.scale.ordinal();
		me.scaleY = d3.scale.linear();

		me.axisX = d3.svg.axis()
			.scale(me.scaleX)
			.orient('bottom');
		me.axisY = d3.svg.axis()
			.scale(me.scaleY)
			.orient('left');

		me.tip = d3.tip()
			.attr('class', 'd3-tip')
			.html(function(d){ return d.value; });

		//-- elements inited --//
		me.svg = config.container.append('svg');

		me.chart = me.svg.append('g')
			.call(me.tip)
			.call(me.zoom);

		me.defClip = me.chart.append('defs').append('svg:clipPath')
			.attr('id', 'x-clip')
		.append('svg:rect');
		me.bg = me.chart.append('rect');

		me.yAxis = me.chart.append('g');

		me.chartAreaX = me.chart.append('g')
			.attr('clip-path', 'url(#x-clip)');

		me.xAxis = me.chartAreaX.append('g');

		me.bars = me.chartAreaX.append('g');
		//me.labels = me.chartAreaX.append('g');
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

		me.defClip
			.attr('x', 0)
			.attr('y', -config.margin.top)
			.attr('width', me.width)
			.attr('height', me.height + config.margin.top + config.margin.bottom);

		me.xAxis
			.attr('class', 'x axis')
			.attr('transform', 'translate(0,'+me.height+')')
			.call(me.axisX);

		me.yAxis
			.attr('class', 'y axis')
			.call(me.axisY);

		var dataBars = me.bars
			.attr('width', me.width)
			.attr('height', me.height)
		.selectAll('rect')
			.data(config.data);
		dataBars.enter().append('rect')
			.on('mouseover', me.tip.show)
			.on('mouseout', me.tip.hide);
		dataBars
			.attr('fill', config.color)
			.attr('x', function(d){ return me.scaleX(d.name); })
			.attr('y', function(d){ return me.scaleY(d.value); })
			.attr('width', me.scaleX.rangeBand())
			.attr('height', function(d){ return me.height - me.scaleY(d.value); });
		dataBars.exit().remove();

		//extra styling/autogen items styling
		me.chart.selectAll('path')
			.attr('stroke', 'rgb(172, 172, 172)')
			.attr('fill', 'none');
		me.chart.selectAll('line')
			.attr('stroke', 'rgb(172, 172, 172)')
			.attr('fill', 'none');
		me.chart.selectAll('.y.axis line')
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

		me.dataMax = d3.max(config.data, function(d){ return d.value; });

		me.scaleX
			.domain(config.data.map(function(d) { return d.name; }))
			.rangeRoundBands([0, me.width], 0.1);
		me.scaleY
			.domain([0, me.dataMax])
			.range([me.height, 0]);

		me.axisX
			.tickSize(8, 0); //outward inner ticks, nonexistant outer ticks. Outer is confusign on a zoomable chart
		me.axisY
			.ticks(10)
			.tickSize(-me.width); //extends tick across chart (grids it)

		me.zoom.scaleExtent([1, config.data.length/4]);
	}

	function doZoom(){
		var x = d3.event.translate[0];
		var scale = d3.event.scale;
		var scaleXZoom = me.scaleX.copy().rangeRoundBands([0, me.width * scale], 0.1 * scale);

		me.bars
			.attr('transform', 'translate('+x+', 0)scale('+scale+', 1)');

		me.xAxis
			.attr('transform', 'translate('+x+','+me.height+')')
			.call(me.axisX.scale(scaleXZoom));
	}

	return outside;
}