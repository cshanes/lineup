
var selectedPlayerMap = {};
var currentLineup = null;
var nextLineup = null;

var containerWidth = 1300;
var containerHeight = 100;

var rectWidth = 50;
var rectHeight = 50;
var rectPadding = 30;
var rVal= 37;
var areaWidth = 12 * (rectWidth + rectPadding + 17);

var playerBoxWidth = areaWidth;
var playerBoxHeight = 100;

var playerData;
var brushBar = false;
var brushCircle = false;
var barFill = "#247ba0";
var lineupData = [];

function init() {
    readIn();
    updateData();
}

function updateData() {

    var size = Object.keys(selectedPlayerMap).length;
    var filename = "data/singlePlayerData.csv";
    var currentLineupFile = "data/singlePlayerData.csv";
    if (size == 1) {
        currentLineupFile = "data/singlePlayerData.csv";
        filename = "data/twoPlayerLineups.csv";
    } else if (size == 2) {
        currentLineupFile = "data/twoPlayerLineups.csv";
        filename = "data/threePlayerLineups.csv";
    } else if (size == 3) {
        currentLineupFile = "data/threePlayerLineups.csv";
        filename = "data/fourPlayerLineups.csv";
    } else if (size == 4) {
        currentLineupFile = "data/fourPlayerLineups.csv";
        filename = "data/fivePlayerLineups.csv";
    }

    d3.csv(currentLineupFile, function(d) {
        setCurrentLineup();
        drawRadialBarChart(filename);
        drawScatterPlot(filename);
        drawTable();
        updatePlayerSelectionBox(filename);
    });

}


function getLineupKey(namesList) {
    return namesList.sort().join('');
}

function getRowNames(row, numPlayers) {
    var result = [];
    for(var i = 0; i < numPlayers; i++) {
        var columnName = 'player' + parseInt(i);
        var playerName = row[columnName];
        result.push(playerName);
    }
    return result;
}

function setLineupData(data, numPlayers) {
    for(var i = 0; i < data.length; i++) {
        var row = data[i];
        var namesList = getRowNames(row, numPlayers);
        var key = getLineupKey(namesList);
        lineupData[key] = row;
    }
}

function readIn() {
    d3.csv('data/singlePlayerData.csv', drawPlayerSelectionBox);
    d3.csv('data/singlePlayerData.csv', function(data) {
        setLineupData(data, 1);
    });
    d3.csv('data/twoPlayerLineups.csv', function(data) {
        setLineupData(data, 2);
    });
    d3.csv('data/threePlayerLineups.csv', function(data) {
        setLineupData(data, 3);
    });
    d3.csv('data/fourPlayerLineups.csv', function(data) {
        setLineupData(data, 4);
    });
    d3.csv('data/fivePlayerLineups.csv', function(data) {
        setLineupData(data, 5);
    });
}

function updatePlayerSelectionBox(file) {
    d3.csv(file, function(error, data) {
        var numSelected = Object.keys(selectedPlayerMap).length;

        var nextPlayers = {};
        if (numSelected < 5) {
            for (var i = 0; i < data.length; i++) {
                var numInLineup = 0;
                var nextPlayer = '';
                for (var k = 0; k < numSelected + 1; k++) {
                    var columnName = 'player' + parseInt(k);
                    var playerName = data[i][columnName];
                    var boxId = '#' + playerName;
                    d3.select(boxId).classed("disabled", false)
                    if (playerName in selectedPlayerMap) {
                        numInLineup++;
                    } else {
                        nextPlayer = playerName;
                    }
                }
                if (numInLineup == numSelected) {
                    nextPlayers[nextPlayer] = true;
                }
            }
        }

        var nextPlayersLength = Object.keys(nextPlayers).length;
        if (nextPlayersLength == 0) {
            return;
        }

        for (var i = 0; i < playerData.length; i++) {
            var player = playerData[i].key;
            if (!(player in nextPlayers)) {
                var boxId = '#' + player;
                var playerSelected = d3.select(boxId).selectAll('img').classed("selected");
                if (!playerSelected) {
                    console.log("disabling: " + player)
                    d3.select(boxId).classed("disabled", true)
                } else {
                    d3.select(boxId).classed("disabled", false)
                }

            }
        }
    });
}

//remove data rows that do not include currently selected players
function removeNonSelectedPlayers(data) {
    var numSelected = Object.keys(selectedPlayerMap).length;
    var result = data;

    if (numSelected == 0) {
        result = data.filter(function(d) {
            d.nextPlayer = d.player0;
            return true;
        })
    }

    if (numSelected > 0 && numSelected < 5) {
        result = data.filter(function(d) {
            var numInLineup = 0;
            var nextPlayer = '';
            for (var i = 0; i < numSelected + 1; i++) {
                var columnName = 'player' + parseInt(i);
                var playerName = d[columnName];
                if (playerName in selectedPlayerMap) {
                    numInLineup++;
                } else {
                    nextPlayer = playerName;
                }
            }
            if (numInLineup == numSelected) {
                d.nextPlayer = nextPlayer;
                return true;
            } else {
                return false;
            }
        });
    }
    return result;
}

function getNonSelectedPlayerName(data, i) {
    var numSelected = Object.keys(selectedPlayerMap).length;
    var result = parseInt(i);
    if (numSelected == 0) {
        return data.player0;
    }

    if (numSelected > 0 && numSelected < 5) {
        for (var j = 0; j < numSelected + 1; j++) {
            var columnName = 'player' + parseInt(j);
            var playerName = data[columnName];
            if (!(playerName in selectedPlayerMap)) {
                return playerName;
            }
        }
    }

    return result;
}

function setCurrentLineup() {
    var lineupKeyList = [];
    for (var key in selectedPlayerMap) {
        lineupKeyList.push(key);
    }
    var lineupKey = getLineupKey(lineupKeyList);
    console.log('current lineup: ' + lineupData[lineupKey]);
    currentLineup = lineupData[lineupKey];
}

function mouseClickPlayerArc(d) {
    var numSelected = Object.keys(selectedPlayerMap).length;
    if (numSelected >= 4) {
        return;
    }

    selectedPlayerMap[d.nextPlayer] = d;
    var boxId = '#' + d.nextPlayer;
    var disabled = d3.select(boxId).classed("disabled");
    if (disabled) {
        return;
    }
    d3.select(boxId).selectAll('img').classed("selected", true)
    console.log(selectedPlayerMap);
    updateData();
}

function arcMouseOver(d) {
    var name = d.nextPlayer;
    console.log(name);
    var numSelected = Object.keys(selectedPlayerMap).length;
    var namesList = [name];
    for (var i = 0; i <= numSelected; i++) {
        var columnName = 'player' + parseInt(i);
        var playerName = d[columnName];
        if (namesList.indexOf(playerName) < 0) {
            namesList.push(playerName);
        }
    }
    console.log(namesList);
    var lineupKey = getLineupKey(namesList);
    d3.select(this).style("fill", "#6AADCA");
    nextLineup = lineupData[lineupKey];
    drawTable();
    d3.select('circle#'+name+'.dot.hvr-box-shadow-inset').style("fill", "#6AADCA");
}

function arcMouseOut(d){
  var name = d.nextPlayer;
  d3.select(this).style("fill", barFill);
  d3.select('circle#'+name+'.dot.hvr-box-shadow-inset').style("fill", cMap);
  d3.selectAll('td#new.num').html("--");
}

function circleMouseOver(d) {
    var name = d.nextPlayer;
    console.log(name);
    var numSelected = Object.keys(selectedPlayerMap).length;
    var namesList = [name];
    for (var i = 0; i <= numSelected; i++) {
        var columnName = 'player' + parseInt(i);
        var playerName = d[columnName];
        if (namesList.indexOf(playerName) < 0) {
            namesList.push(playerName);
        }
    }
    console.log(namesList);
    var lineupKey = getLineupKey(namesList);
    d3.select(this).style("fill", "#6AADCA");
    nextLineup = lineupData[lineupKey];
    drawTable();
    d3.select('path#'+name).style("fill", "#6AADCA");
}

function circleMouseOut(d){
  var name = d.nextPlayer;
  d3.select(this).style("fill", cMap);
  d3.select('path#'+name).style("fill", barFill);
  d3.selectAll('td#new.num').html("--");
}

function drawPlayerSelectionBox(rawdata) {
    playerData = d3.nest()
        .key(function (d) {
            return (d.player0);
        })
        .entries(rawdata);

    var row = d3.select('#player_select').append('div').attr('class', 'row dash-container');
    
    var playerContainers = row.selectAll('.player-box')
        .data(playerData)
        .enter()
        .append("div")
        .attr("id", function(d) {
            return d.key
        })
        .attr("class", "player-box col-md-1 hvr-underline-from-center")
        .attr("transform", function (d, i) {
            xVal = i * rectWidth + rectPadding;
            yVal = 15;
            return "translate(" + [xVal, yVal] + ")"
        })
        .on("click", function(d) {
            var numSelected = Object.keys(selectedPlayerMap).length;

            if (d.key in selectedPlayerMap) {
                delete selectedPlayerMap[d.key];
                d3.select(this).selectAll('img').classed("selected", false)
            } else {
                if (numSelected >= 4) {
                    return;
                }
                var disabled = d3.select(this).classed("disabled");
                if (disabled) {
                    return;
                }
                selectedPlayerMap[d.key] = d.values[0]
                d3.select(this).selectAll('img').classed("selected", true)
            }
            console.log(selectedPlayerMap);
            updateData();
        })

    playerContainers.append("img")
        .attr('src', function(d) {return ("js/photos/" +  d.key + ".jpeg");})
        .attr("class", "img-circle img-responsive");
    playerContainers.append("p")
        .text(function(d){ return d.key; });
}

function drawRadialBarChart(csv_path) {
    var width = 500,
        height = 430,
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
            return d['clinch_rating'] = +d['clinch_rating'];
        });

        data = removeNonSelectedPlayers(data);

        if (data.length > 20) {
            data = data.slice(0, 20);
        }


        data.sort(function(a,b) { return b.clinch_rating - a.clinch_rating; });

        var extent = d3.extent(data, function(d) {
            return d.clinch_rating;
        });
        var barScale = d3.scale.linear()
            .domain([0,10])
            .range([0, barHeight]);

        var keys = data.map(function(d,i) { return d.clinch_rating; });
        var numBars = keys.length;

        var x = d3.scale.linear()
            .domain([0,10])
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
            .style("fill", barFill)
            .attr("d", arc)
            .attr("id", function(d, i){return getNonSelectedPlayerName(d, i)})
            .on("click", mouseClickPlayerArc)
            .on("mouseover", arcMouseOver)
            .on("mouseout", arcMouseOut);

        segments.transition().ease("elastic").duration(1000).delay(function(d,i) {return (25-i)*10;})
            .attrTween("d", function(d,index) {
                var i = d3.interpolate(d.outerRadius, barScale(+d.clinch_rating));
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
        var labelRadius = barHeight * 1.08;

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
                return getNonSelectedPlayerName(d, i);
            });
    });

}

function drawTable() {

    // column definitions
    var columns = [
        { head: 'Current', cl: 'num', id: "current", html: ƒ('current', d3.format('.1f'))},
        { head: 'Stat', cl: 'center', id:"stat", html: ƒ('stat')},
        { head: 'New', cl: 'num', id:"new", html: ƒ('new', d3.format('.1f')) },
    ];

    d3.select('#table').selectAll('*').remove();

    // create table
    var table = d3.select('#table')
        .append('table')
        .attr('class', 'table table-borderless');

    // create table header
    table.append('thead').append('tr')
        .selectAll('th')
        .data(columns).enter()
        .append('th')
        .attr('class', ƒ('cl'))
        .text(ƒ('head'));

    var data = null;
    if (nextLineup == null && currentLineup == null) {
        data = [
            {
                current: null,
                stat: 'Clinch Rating',
                new: null
            },
            {
                current: null,
                stat: 'Effective FG%',
                new: null
            },
            {
                current: null,
                stat: 'Rebounding Rate',
                new: null
            },
            {
                current: null,
                stat: 'Turnover Rate',
                new: null
            },
            {
                current: null,
                stat: 'Free Throw Rate',
                new: null
            },
            {
                current: null,
                stat: 'Off. Efficiency',
                new: null
            },
            {
                current: null,
                stat: 'Def. Efficiency',
                new: null
            },
            {
                current: null,
                stat: '# Possessions',
                new: null
            }
        ]
    }
    else if (nextLineup == null && currentLineup != null) {
        data = [
            {
                current: currentLineup.clinch_rating,
                stat: 'Clinch Rating',
                new: null
            },
            {
                current: currentLineup.eff_fg_value,
                stat: 'Effective FG%',
                new: null
            },
            {
                current: currentLineup.reb_rate_value,
                stat: 'Rebounding Rate',
                new: null
            },
            {
                current: currentLineup.to_rate_value,
                stat: 'Turnover Rate',
                new: null
            },
            {
                current: currentLineup.ft_rate_value,
                stat: 'Free Throw Rate',
                new: null
            },
            {
                current: currentLineup.off_rating,
                stat: 'Off. Efficiency',
                new: null
            },
            {
                current: currentLineup.def_rating,
                stat: 'Def. Efficiency',
                new: null
            },
            {
                current: currentLineup.num_poss,
                stat: '# Possessions',
                new: null
            }
        ]
    } else if (nextLineup != null && currentLineup == null) {
        data = [
            {
                current: null,
                stat: 'Clinch Rating',
                new: nextLineup.clinch_rating
            },
            {
                current: null,
                stat: 'Effective FG%',
                new: nextLineup.eff_fg_value
            },
            {
                current: null,
                stat: 'Rebounding Rate',
                new: nextLineup.reb_rate_value
            },
            {
                current: null,
                stat: 'Turnover Rate',
                new: nextLineup.to_rate_value
            },
            {
                current: null,
                stat: 'Free Throw Rate',
                new: nextLineup.ft_rate_value
            },
            {
                current: null,
                stat: 'Off. Efficiency',
                new: nextLineup.off_rating
            },
            {
                current: null,
                stat: 'Def. Efficiency',
                new: nextLineup.def_rating
            },
            {
                current: null,
                stat: '# Possessions',
                new: nextLineup.num_poss
            }
        ]
    } else {
            data = [
            {
                current: currentLineup.clinch_rating,
                stat: 'Clinch Rating',
                new: nextLineup.clinch_rating
            },
            {
                current: currentLineup.eff_fg_value,
                stat: 'Effective FG%',
                new: nextLineup.eff_fg_value
            },
            {
                current: currentLineup.reb_rate_value,
                stat: 'Rebounding Rate',
                new: nextLineup.reb_rate_value
            },
            {
                current: currentLineup.to_rate_value,
                stat: 'Turnover Rate',
                new: nextLineup.to_rate_value
            },
            {
                current: currentLineup.ft_rate_value,
                stat: 'Free Throw Rate',
                new: nextLineup.ft_rate_value
            },
            {
                current: currentLineup.off_rating,
                stat: 'Off. Efficiency',
                new: nextLineup.off_rating
            },
            {
                current: currentLineup.def_rating,
                stat: 'Def. Efficiency',
                new: nextLineup.def_rating
            },
            {
                current: currentLineup.num_poss,
                stat: '# Possessions',
                new: nextLineup.num_poss
            }
        ]
    }

        table.append('tbody')
            .selectAll('tr')
            .data(data).enter()
            .append('tr')
            .selectAll('td')
            .data(function(row, i) {
                return columns.map(function(c) {
                    // compute cell values for this specific row
                    var cell = {};
                    d3.keys(c).forEach(function(k) {
                        cell[k] = typeof c[k] == 'function' ? c[k](row,i) : c[k];
                    });
                    if (row['new'] == null && cell.head == 'New') {
                        cell.html = '--';
                    }
                    return cell;
                });
            }).enter()
            .append('td')
            .html(ƒ('html'))
            .attr('class', ƒ('cl'))
            .attr('id', ƒ('id') );

}

function drawScatterPlot(csv_path) {
  
  //How do we want to deal with occlusion
  //Help with tooltip issues
  
    var yWidth = 430,
        xWidth = 450,
        yHeight = 50,
        xHeight = 400;
    var tooltip;
    var width = 500,
        height = 440
        yDiff = height-yWidth
        xDiff = xWidth - yHeight;
    d3.select('#scatterplot').selectAll('*').remove();
    d3.select('div.tipsy').selectAll('*').remove();

    var svg = d3.select('#scatterplot').append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");
    d3.csv(csv_path, function(error, data) {
        data.map(function(d) {
            return d['off_rating'] = +d['off_rating'],
               d['def_rating'] = +d['def_rating'],
               d['num_poss']  = +d['num_poss'],
               d['clinch_rating'] = +d['clinch_rating'];
        });
        data = removeNonSelectedPlayers(data);
        // setup x
        var xValue = function(d) { return d.def_rating ;}, // data -> value
            xScale = d3.scale.linear().range([yHeight, xWidth]), // value -> display
            xMap = function(d) {return xScale(xValue(d));}, // data -> display
            xAxis = d3.svg.axis().orient("bottom").scale(xScale).ticks(8);

        // setup y
        var yValue = function(d) { return d.off_rating;}, // data -> value
            yScale = d3.scale.linear().range([yWidth, yDiff]), // value -> display
            yMap = function(d) { return yScale(yValue(d))-30;}, // data -> display
            yAxis = d3.svg.axis().scale(yScale).orient("left").ticks(8);
            
        //setup width and color
        var sizeMax = d3.max(data, function(d) { return d.num_poss; }),
               sizeMin = d3.min(data, function(d) { return d.num_poss; }),
               sizeMean = d3.mean(data, function(d) { return d.num_poss; }),
               colorMax = d3.max(data, function(d) { return d.clinch_rating; }),
               colorMin = d3.min(data, function(d) { return d.clinch_rating; }),
               colorMean = d3.mean(data, function(d) { return d.clinch_rating; });
        var size = function(d){return d.num_poss;},
            rscale = d3.scale.linear().domain([sizeMin, sizeMean, sizeMax]).range([5,8,11]),
            rMap = function(d){return rscale(size(d));};
        var color = function(d){return d.clinch_rating;},
            colorScale = d3.scale.linear().domain([colorMin, colorMean, colorMax]).range(["#d7191c", "yellow", "#1a9850"]);
            cMap = function(d){return colorScale(color(d))};
        console.log(d3.max(data, yValue))
        // don't want dots overlapping axis, so add in buffer to data domain
        xChange = (d3.max(data, xValue) - d3.min(data, xValue))/10
        yChange = (d3.max(data, yValue) - d3.min(data, yValue))/10
        xScale.domain([d3.min(data, xValue)-xChange, d3.max(data, xValue)+xChange]);
        yScale.domain([d3.min(data, yValue)-yChange, d3.max(data, yValue)+yChange]);

      function make_x_gridlines() {		
          return d3.svg.axis()
              .scale(xScale)
              .orient("bottom")
              .ticks(5)
          }
      function make_y_gridlines() {		
          return d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(5)
          }
        //adding X gridline
        svg.append("g")		
            .attr("stroke", "grey")
            .attr("fill", "none")
            .attr("opacity", 0.7)
            .attr("rendering", "crispEdges")
            .attr("transform", "translate(" + 0 + "," + height/2 + ")")
            .call(make_x_gridlines()
                .tickSize(1)
                .tickFormat(""))
            .style("stroke-dasharray","5,5");
        // add the Y gridlines
        svg.append("g")	
            .attr("stroke", "grey")
            .attr("fill", "none")
            .attr("opacity", 0.7)
            .attr("rendering", "crispEdges")
            .attr("transform", "translate(" + (width)/2 + "," + -30 + ")")
            .call(make_y_gridlines()
              .tickSize(1)
              .tickFormat(""))
            .style("stroke-dasharray","5,5");
        // x-axis
        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+0+"," + xHeight + ")")
            .call(xAxis)
            .append("text")
            .attr("class", "label")
            .attr("x", xWidth)
            .attr("y", 30)
            .style("text-anchor", "end")
            .text("Defensive Efficiency");

        // y-axis
        svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate("+yHeight+","+-30+")")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("x", -40)
            .attr("y", -45)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Offensive Efficiency");
        
        // draw dots
        svg.selectAll(".dot")
            .data(data)
            .enter().append("circle")
            .attr("id", function(d, i){return getNonSelectedPlayerName(d, i)})
            .attr("stroke", "black")
            .attr("class", "dot hvr-box-shadow-inset")
            .attr("r", rMap)  
            .attr("cx", xMap)
            .attr("cy", yMap)
            .style("fill", cMap)
            .on("click", function(d) {
            if (d.key in selectedPlayerMap) {
                delete selectedPlayerMap[d.key];
                d3.select(this).selectAll('.dot').classed("selected", false)
            } else {
                selectedPlayerMap[d.nextPlayer] = d.nextPlayer;
                d3.select(this).selectAll('.dot').classed("selected", true)
            }
            console.log(selectedPlayerMap);
            updateData();
            })
            .on("mouseover", circleMouseOver)
            .on("mouseout", circleMouseOut)
            .on("click", mouseClickPlayerArc);

        $('svg .dot').tipsy({
            gravity: 's',
            html: true,
            fade: true,
            offset: 10,
            title: function() {
                var d = this.__data__;
                return d.nextPlayer;
            }
        })
    })
}
//function drawFilters(csv_path) {
//    var width = 200,
//        height = 200
//    d3.select('#filter').selectAll('*').remove();

//    var svg = d3.select('#filter').append("svg")
//        .attr("width", width)
//        .attr("height", height)
//        .append("g");
//    d3.csv(csv_path, function(error, data) {
//        data.map(function(d) {
//            return d['off_rating'] = +d['off_rating'],
//               d['def_rating'] = +d['def_rating'],
//               d['clinch_rating'] = +d['clinch_rating'];
//        });
//        data = removeNonSelectedPlayers(data);
//    })
//} 