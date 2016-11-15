
var selectedPlayerMap = {};

var containerWidth = 1300;
var containerHeight = 300;

var rectWidth = 40;
var rectHeight = 40;
var rectPadding = 20;
var areaWidth = 15 * (rectWidth + rectPadding + 16);

var playerBoxWidth = areaWidth;
var playerBoxHeight = 100;

var selectedBoxX = playerBoxWidth/3;
var selectedBoxY = playerBoxHeight + 10;
var selectedBoxWidth = 5 * (rectWidth + rectPadding + 16);

function init() {
    readIn();
    drawRadialBarChart();
}

function getTranslation(transform) {
    // Create a dummy g for calculation purposes only. This will never
    // be appended to the DOM and will be discarded once this function
    // returns.
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Set the transform attribute to the provided string value.
    g.setAttributeNS(null, "transform", transform);

    // consolidate the SVGTransformList containing all transformations
    // to a single SVGTransform of type SVG_TRANSFORM_MATRIX and get
    // its SVGMatrix.
    var matrix = g.transform.baseVal.consolidate().matrix;

    // As per definition values e and f are the ones for the translation.
    return [matrix.e, matrix.f];
}

function dragstarted(d) {
    // d3.select(this).raise().classed("active", true);
}

function dragged(d) {
    var t = getTranslation(d3.select(this).attr("transform"));
    var currentX = t[0];
    var currentY = t[1];
    var newX = currentX + d3.event.dx;
    var newY = currentY + d3.event.dy;
    d3.select(this).attr("transform", function (d, i) {
        return "translate(" + [newX, newY] + ")"
    });
}

function dragended(d) {
    currentX = getTranslation(d3.select(this).attr("transform"))[0];
    currentY = getTranslation(d3.select(this).attr("transform"))[1];
    getFinal(d, currentX, currentY);
    d3.select(this).classed("active", false);
}

function getFinal(d, currentX, currentY) {
    console.log('currentX: ' + currentX)
    console.log('currentY: ' + currentY)
    console.log('selectedBoxX: ' + selectedBoxX)
    console.log('selectedBoxY: ' + selectedBoxY)
    if (currentX >= selectedBoxX - 10 &&
        currentY >= selectedBoxY - 10 &&
        currentX <= selectedBoxX + selectedBoxWidth + 10 &&
        currentY <= selectedBoxY + playerBoxHeight + 10) {
        selectedPlayerMap[d.key] = d;
        console.log(selectedPlayerMap)
    } else {
        if (d.key in selectedPlayerMap) {

        }
    }
}

function readIn() {
    d3.csv('data/playerData.csv', data);
}
function data(rawdata) {
    playerData = d3.nest()
        .key(function (d) {
            return (d.abrev_name);
        })
        .entries(rawdata);

    var drag = d3.behavior.drag()
        .on("dragstart", dragstarted)
        .on("drag", dragged)
        .on("dragend", dragended);

    var area = d3.select('#player_select').append('svg')
        .attr("width", containerWidth)
        .attr("height", containerHeight);

    var container = area.append("g");

    // player box
    container.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", playerBoxWidth)
        .attr("height", playerBoxHeight)
        .attr("stroke", "black")
        .attr("fill", "none");

    // selection box
    container.append("rect")
        .attr("x", selectedBoxX)
        .attr("y", selectedBoxY)
        .attr("width", selectedBoxWidth)
        .attr("height", playerBoxHeight)
        .attr("stroke", "black")
        .attr("fill", "none");

    var playerBox = area.selectAll('.bar')
        .data(playerData)
        .enter()
        .append("g")
        .attr("class", "player-box")
        .attr("transform", function (d, i) {
            xVal = i * rectWidth + rectPadding;
            yVal = 15;
            return "translate(" + [xVal, yVal] + ")"
        })
        .call(drag);

    playerBox.append("rect")
        .attr("x", function (d, i) {
            return rectPadding + rectWidth * i
        })
        .attr("y", 0)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("fill", "royalblue");

    playerBox.append("text")
      .text(function(d){ return d.key; })
      .attr("text-anchor", "middle")
      .attr("x", function(d,i){return 20 + (rectPadding + (rectWidth * i))})
      .attr("y", 60)
      .attr("font-family", "sans-serif");
}

function drawRadialBarChart() {
    var width = 960,
        height = 500,
        barHeight = height / 2 - 40;

    var formatNumber = d3.format("s");

    var color = d3.scale.ordinal()
        .range(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]);

    var svg = d3.select('#chart').append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

    d3.csv("data/playerData.csv", function(error, data) {

        data.map(function(d) {
            return d['value'] = +d['value'];
        })

        data.sort(function(a,b) { return b.value - a.value; });

        var extent = d3.extent(data, function(d) { return d.value; });
        var barScale = d3.scale.linear()
            .domain(extent)
            .range([0, barHeight]);

        var keys = data.map(function(d,i) { return d.abrev_name; });
        var numBars = keys.length;

        var x = d3.scale.linear()
            .domain(extent)
            .range([0, -barHeight]);

        var xAxis = d3.svg.axis()
            .scale(x).orient("left")
            .ticks(3)
            .tickFormat(formatNumber);

        var circles = svg.selectAll("circle")
            .data(x.ticks(3))
            .enter().append("circle")
            .attr("r", function(d) {return barScale(d);})
            .style("fill", "none")
            .style("stroke", "black")
            .style("stroke-dasharray", "2,2")
            .style("stroke-width",".5px");

        var arc = d3.svg.arc()
            .startAngle(function(d,i) { return (i * 2 * Math.PI) / numBars; })
            .endAngle(function(d,i) { return ((i + 1) * 2 * Math.PI) / numBars; })
            .innerRadius(0);

        var segments = svg.selectAll("path")
            .data(data)
            .enter().append("path")
            .each(function(d) { d.outerRadius = 0; })
            .style("fill", function (d) { return color(d.name); })
            .attr("d", arc);

        segments.transition().ease("elastic").duration(1000).delay(function(d,i) {return (25-i)*10;})
            .attrTween("d", function(d,index) {
                var i = d3.interpolate(d.outerRadius, barScale(+d.value));
                return function(t) { d.outerRadius = i(t); return arc(d,index); };
            });

        // svg.append("circle")
        //     .attr("r", barHeight)
        //     .classed("outer", true)
        //     .style("fill", "none")
        //     .style("stroke", "black")
        //     .style("stroke-width","1.5px");

        var lines = svg.selectAll("line")
            .data(keys)
            .enter().append("line")
            .attr("y2", -barHeight - 20)
            .style("stroke", "black")
            .style("stroke-width",".5px")
            .attr("transform", function(d, i) { return "rotate(" + (i * 360 / numBars) + ")"; });

        svg.append("g")
            .attr("class", "x axis")
            .call(xAxis);

        // Labels
        var labelRadius = barHeight * 1.025;

        var labels = svg.append("g")
            .classed("labels", true);

        labels.append("def")
            .append("path")
            .attr("id", "label-path")
            .attr("d", "m0 " + -labelRadius + " a" + labelRadius + " " + labelRadius + " 0 1,1 -0.01 0");

        labels.selectAll("text")
            .data(keys)
            .enter().append("text")
            .style("text-anchor", "middle")
            .style("font-weight","bold")
            .style("fill", function(d, i) {return "#3e3e3e";})
            .append("textPath")
            .attr("xlink:href", "#label-path")
            .attr("startOffset", function(d, i) {return i * 100 / numBars + 50 / numBars + '%';})
            .text(function(d) {
                return d.toUpperCase();
            });
    });
}