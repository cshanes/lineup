
var selectedPlayerMap = {};

var containerWidth = 1300;
var containerHeight = 120;

var rectWidth = 40;
var rectHeight = 40;
var rectPadding = 20;
var areaWidth = 15 * (rectWidth + rectPadding + 16);

var playerBoxWidth = areaWidth;
var playerBoxHeight = 100;


function updateData() {
    var size = Object.keys(selectedPlayerMap).length;
    var filename;
    if (size == 0) {
        filename = "data/singlePlayerData.csv";
    } else if (size == 1) {
        filename = "data/twoPlayerLineups.csv";
    }

    drawRadialBarChart(filename);
    drawScatterPlot(filename);
}

function init() {
    readIn();
    updateData();
}

function readIn() {
    d3.csv('data/singlePlayerData.csv', drawPlayerSelectionBox);
}

//remove data rows that do not include currently selected players
function removeNonSelectedPlayers(data) {
    var numSelected = Object.keys(selectedPlayerMap).length;
    var result = data;
    if (numSelected > 0) {
        //TODO: This logic will need to be modified for player groups that are > 2
        result = data.filter(function(d) {
            for (var i = 0; i < numSelected; i++) {
                var columnName = 'player' + parseInt(i);
                var playerName = d[columnName];
                if (playerName in selectedPlayerMap) {
                    return true;
                }
            }
        })
    }
    return result;
}

function drawPlayerSelectionBox(rawdata) {
    var playerData = d3.nest()
        .key(function (d) {
            return (d.abrev_name);
        })
        .entries(rawdata);

    var area = d3.select('#player_select').append('svg')
        .attr("width", containerWidth)
        .attr("height", containerHeight);

    var container = area.append("g");

    // player box
    container.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", playerBoxWidth+100)
        .attr("height", playerBoxHeight)
        .attr("stroke", "black")
        .attr("fill", "none");

    var playerContainers = area.selectAll('.bar')
        .data(playerData)
        .enter()
        .append("g")
        .attr("class", "player-box")
        .attr("transform", function (d, i) {
            xVal = i * rectWidth + rectPadding;
            yVal = 15;
            return "translate(" + [xVal, yVal] + ")"
        })
        .on("click", function(d) {
            if (d.key in selectedPlayerMap) {
                delete selectedPlayerMap[d.key];
                d3.select(this).selectAll('rect').classed("selected", false)
            } else {
                selectedPlayerMap[d.key] = d.values[0]
                d3.select(this).selectAll('rect').classed("selected", true)
            }
            console.log(selectedPlayerMap);
            updateData();
        });

    playerContainers.append("rect")
        .attr("x", function (d, i) {
            return rectPadding + rectWidth * i
        })
        .attr("y", 0)
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("fill", "royalblue");

    playerContainers.append("text")
      .text(function(d){ return d.key; })
      .attr("text-anchor", "middle")
      .attr("x", function(d,i){return 20 + (rectPadding + (rectWidth * i))})
      .attr("y", 60)
      .attr("font-family", "sans-serif");
}

function drawRadialBarChart(csv_path) {
    var width = 960,
        height = 500,
        barHeight = height / 2 - 40;

    var formatNumber = d3.format("s");

    var color = d3.scale.ordinal()
        .range(["#8dd3c7","#ffffb3","#bebada","#fb8072","#80b1d3","#fdb462","#b3de69","#fccde5","#d9d9d9","#bc80bd","#ccebc5","#ffed6f"]);

    d3.select('#chart').selectAll('*').remove();

    var svg = d3.select('#chart').append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width/2 + "," + height/2 + ")");

    d3.csv(csv_path, function(error, data) {

        data.map(function(d) {
            return d['off_rating'] = +d['off_rating'];
        });

        data = removeNonSelectedPlayers(data);

        data.sort(function(a,b) { return b.off_rating - a.off_rating; });

        var extent = d3.extent(data, function(d) {
            return d.off_rating;
        });
        var barScale = d3.scale.linear()
            .domain(extent)
            .range([0, barHeight]);

        var keys = data.map(function(d,i) { return d.off_rating; });
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
                var i = d3.interpolate(d.outerRadius, barScale(+d.off_rating));
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
            .data(data)
            .enter().append("text")
            .style("text-anchor", "middle")
            .style("font-weight","bold")
            .style("fill", function(d, i) {return "#3e3e3e";})
            .append("textPath")
            .attr("xlink:href", "#label-path")
            .attr("startOffset", function(d, i) {return i * 100 / numBars + 50 / numBars + '%';})
            .text(function(d, i) {
                return parseInt(i);
            });
    });
}

function drawScatterPlot(csv_path) {
    var width = 960,
        xWidth = 900,
        height = 600,
        yHeight = 25,
        xHeight = 580;
    var tooltip;
    d3.select('#scatterplot').selectAll('*').remove();
    
    var svg = d3.select('#scatterplot').append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    d3.csv(csv_path, function(error, data) {
        data.map(function(d) {
            return d['off_rating'] = +d['off_rating'],
               d['def_rating'] = +d['def_rating'];
        });

        data = removeNonSelectedPlayers(data);
        
        // setup x
        var xValue = function(d) { return d.def_rating ;}, // data -> value
            xScale = d3.scale.linear().range([0, xWidth]), // value -> display
            xMap = function(d) {return xScale(xValue(d));}, // data -> display
            xAxis = d3.svg.axis().orient("bottom").scale(xScale);

        // setup y
        var yValue = function(d) { return d.off_rating;}, // data -> value
            yScale = d3.scale.linear().range([height, 0]), // value -> display
            yMap = function(d) { return yScale(yValue(d));}, // data -> display
            yAxis = d3.svg.axis().scale(yScale).orient("left");

        // don't want dots overlapping axis, so add in buffer to data domain
        xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
        yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

        // x-axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+yHeight+"," + xHeight + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", xWidth)
            .attr("y", -20)
            .style("text-anchor", "end")
            .text("Defensive Efficiency");

        // y-axis
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate("+yHeight+","+-20+")")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Offensive Efficiency");

        // draw dots
        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("class", "dot")
            .attr("r", 5) //make dynamic with number of posessions
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", 'steelblue') //make dynamic with score
            .on("mouseover", function(d) {
                 tooltip.transition()
                     .duration(200)
                     .style("opacity", 0.9);
                 tooltip.html("test")
                     .style("left", (d3.this.x) + "px")
                     .style("top", (d3.this.y) + "px");
            })
            .on("mouseout", function(d) {
                 tooltip.transition()
                     .duration(500)
                     .style("opacity", 0);
            });
            


    });
}