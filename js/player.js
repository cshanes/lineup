
var selectedPlayerMap = {};
var currentLineup = null;
var nextLineup = null;

var containerWidth = 1300;
var containerHeight = 120;

var rectWidth = 50;
var rectHeight = 50;
var rectPadding = 30;
var rVal= 37;
var areaWidth = 13 * (rectWidth + rectPadding + 17);

var playerBoxWidth = areaWidth;
var playerBoxHeight = 100;


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
 //       drawFilters(filename);
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

function mouseClickPlayerBox(d) {
    var name = d.key;
    if (name in selectedPlayerMap) {
        delete selectedPlayerMap[name];
        d3.select(this).selectAll('circle').classed("selected", false)
    } else {
        selectedPlayerMap[name] = d.values[0];
        d3.select(this).selectAll('circle').classed("selected", true)
    }
    console.log(selectedPlayerMap);
    updateData();
}

function mouseClickPlayerArc(d) {
    selectedPlayerMap[d.nextPlayer] = d;
    var boxId = '#' + d.nextPlayer;
    d3.select(boxId).selectAll('circle').classed("selected", true)
    console.log(selectedPlayerMap);
    updateData();
}

function playerMouseOver(d) {
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
    nextLineup = lineupData[lineupKey];
    drawTable();
}

function drawPlayerSelectionBox(rawdata) {
    var playerData = d3.nest()
        .key(function (d) {
            return (d.player0);
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
        .attr("width", playerBoxWidth)
        .attr("height", playerBoxHeight)
        .attr("stroke", "#D3D3D3")
        .attr("fill", "#D3D3D3");

    var playerContainers = area.selectAll('.bar')
        .data(playerData)
        .enter()
        .append("g")
        .attr("id", function(d) {
            return d.key
        })
        .attr("class", "player-box")
        .attr("transform", function (d, i) {
            xVal = i * rectWidth + rectPadding;
            yVal = 15;
            return "translate(" + [xVal, yVal] + ")"
        })
        .on("click", function(d) {
            if (d.key in selectedPlayerMap) {
                delete selectedPlayerMap[d.key];
                d3.select(this).selectAll('circle').classed("selected", false)
            } else {
                selectedPlayerMap[d.key] = d.values[0]
                d3.select(this).selectAll('circle').classed("selected", true)
            }
            console.log(selectedPlayerMap);
            updateData();
        })

    playerContainers.append("text")
      .text(function(d){ return d.key; })
      .attr("text-anchor", "middle")
      .attr("x", function(d,i){return 20 + (rectPadding + (rectWidth * i))})
      .attr("y", 60)
      .attr("font-family", "sans-serif");
    
    playerContainers.append("image")
      .attr("xlink:href", function(d) {return ("js/photos/" +  d.key + ".jpeg"); })
      .attr("x", function(d,i){return (rectPadding + (rectWidth * i))})
      .attr("y", 0)
      .attr("width", rectWidth)
      .attr("height", rectHeight)
      .style("border-radius", "10px");
      
    playerContainers.append("circle")
        .attr("cx", function (d, i) {
            return rectPadding + rectWidth * i + 24
        })
        .attr("cy", 30)
        .attr("r", rVal)
        // .attr("class", "hvr-grow")
        .attr("fill", "url(#image)");
}

function drawRadialBarChart(csv_path) {
    var width = 400,
        height = 400,
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
            .domain(extent)
            .range([0, barHeight]);

        var keys = data.map(function(d,i) { return d.clinch_rating; });
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
            //.style("fill", function (d) { return color(d.name); })
            .style("fill", "#996600")
            .attr("d", arc)
            .attr("class", "arc hvr-grow")
            .on("click", mouseClickPlayerArc)
            .on("mouseover", playerMouseOver);

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
                return getNonSelectedPlayerName(d, i);
            });
    });
}

function drawTable() {

    // column definitions
    var columns = [
        { head: 'Current', cl: 'num', html: ƒ('current', d3.format('.1f')) },
        { head: 'Stat', cl: 'center', html: ƒ('stat') },
        { head: 'New', cl: 'num', html: ƒ('new', d3.format('.1f')) },
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
                new: nextLineup.eff_fg
            },
            {
                current: null,
                stat: 'Rebounding Rate',
                new: nextLineup.reb_rate
            },
            {
                current: null,
                stat: 'Turnover Rate',
                new: nextLineup.ro_rate
            },
            {
                current: null,
                stat: 'Free Throw Rate',
                new: nextLineup.ft_rate
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
                        cell.html = '-';
                    }
                    return cell;
                });
            }).enter()
            .append('td')
            .html(ƒ('html'))
            .attr('class', ƒ('cl'));

}

function drawScatterPlot(csv_path) {
  
  //How do we want to deal with occlusion
  //Help with tooltip issues
  
  
    var yWidth = 360,
        xWidth = 340,
        yHeight = 40,
        xHeight = 360;
    var tooltip;
    var width = 400,
        height = 400
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
               d['clinch_rating'] = +d['clinch_rating'],
               sizeMax = d3.max(data, function(d) { return d.num_poss; }),
               sizeMin = d3.min(data, function(d) { return d.num_poss; }),
               sizeMean = d3.mean(data, function(d) { return d.num_poss; }),
               colorMax = d3.max(data, function(d) { return d.clinch_rating; }),
               colorMin = d3.min(data, function(d) { return d.clinch_rating; }),
               colorMean = d3.mean(data, function(d) { return d.clinch_rating; });
        });
        data = removeNonSelectedPlayers(data);
        // setup x
        var xValue = function(d) { return d.def_rating ;}, // data -> value
            xScale = d3.scale.linear().range([yHeight, xWidth]), // value -> display
            xMap = function(d) {return xScale(xValue(d));}, // data -> display
            xAxis = d3.svg.axis().orient("bottom").scale(xScale);

        // setup y
        var yValue = function(d) { return d.off_rating;}, // data -> value
            yScale = d3.scale.linear().range([yWidth, yDiff]), // value -> display
            yMap = function(d) { return yScale(yValue(d));}, // data -> display
            yAxis = d3.svg.axis().scale(yScale).orient("left");
            
        //setup width and color
        var size = function(d){return d.num_poss;},
            rscale = d3.scale.linear().domain([sizeMin, sizeMean, sizeMax]).range([4,6,10]),
            rMap = function(d){return rscale(size(d));};
        var color = function(d){return d.clinch_rating;},
            colorScale = d3.scale.linear().domain([colorMin, colorMean, colorMax]).range(["red", "orange", "green"]);
            cMap = function(d){return colorScale(color(d))};
        console.log(d3.max(data, yValue))
        // don't want dots overlapping axis, so add in buffer to data domain
        xScale.domain([0, d3.max(data, xValue)+5]);
        yScale.domain([d3.min(data, yValue)-5, d3.max(data, yValue)+5]);

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
            .attr("transform", "translate(" + yWidth/2 + "," + 0 + ")")
            .call(make_y_gridlines()
              .tickSize(1)
              .tickFormat(""))
            .style("stroke-dasharray","5,5")
            .append("text")
            .attr("stroke", "none")
            .attr("fill", "black")
            .attr("class", "label")
            .attr("x", 50)
            .attr("y", 40)
            .attr("dy", ".71em");
          svg.append("text")
            .attr("opacity", 0.7)
            .attr("stroke", "none")
            .attr("fill", "black")
            .attr("class", "label")
            .attr("x", 70)
            .attr("y", 40)
            .attr("dy", ".71em");
          svg.append("text")
            .attr("opacity", 0.7)
            .attr("stroke", "none")
            .attr("fill", "black")
            .attr("class", "label")
            .attr("x", 220)
            .attr("y", 350)
            .attr("dy", ".71em");
          svg.append("text")
            .attr("opacity", 0.7)
            .attr("stroke", "none")
            .attr("fill", "black")
            .attr("class", "label")
            .attr("x", 70)
            .attr("y", 350)
            .attr("dy", ".71em");
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
            .attr("transform", "translate("+yHeight+","+0+")")
            .call(yAxis)
            .append("text")
            .attr("class", "label")
            .attr("transform", "rotate(-90)")
            .attr("x", -40)
            .attr("y", -40)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Offensive Efficiency");
        
        // draw dots
        svg.selectAll(".dot")
            .data(data)
            .attr("id", function(d) {return d.key})
            .enter().append("circle")
            .attr("stroke", "black")
            .attr("class", "dot")
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
            .on("mouseover", playerMouseOver)
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