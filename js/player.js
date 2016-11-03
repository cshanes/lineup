var width = 3000;
var height = 3000;
colorScale = d3.scaleOrdinal(d3.schemeCategory10);


function init() {
    area = d3.select('#container').append('svg')
        .attr("width", width)
        .attr("height", height);
    readIn();
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
    d3.select(this).raise().classed("active", true);
}

function dragged(d) {
    var t = getTranslation(d3.select(this).attr("transform"))
    var currentX = t[0]
    var currentY = t[1]
    var newX = currentX + d3.event.dx
    var newY = currentY + d3.event.dy
    d3.select(this).attr("transform", function (d, i) {
        return "translate(" + [newX, newY] + ")"
    });
}

function dragended(d) {
    d3.select(this).classed("active", false);
}

function getFinal(d) {
    //if box within rectangle 2, then return box id
}
function readIn() {
    d3.csv('data/playerData.csv', data);
}
function data(rawdata) {
    playerData = d3.nest()
        .key(function (d, i) {
            return (d.playername);
        })
        .entries(rawdata);

    var drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    container = area.selectAll("g")
        .enter().append("g");

    var rectWidth = 60;
    var rectPadding = 40;

    container.append("rect")
        .attr("x", rectWidth)
        .attr("y", 150)
        .attr("width", 720)
        .attr("height", 80)
        .attr("stroke", "black")
        .attr("fill", "none");

    container.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 1500)
        .attr("height", 100)
        .attr("stroke", "black")
        .attr("fill", "none");

    var playerBox = area.selectAll('.bar')
        .data(playerData)
        .enter()
        .append("g")
        .attr("class", "bar")
        .attr("transform", function (d, i) {
            xVal = i * rectWidth + rectPadding;
            yVal = 30;
            return "translate(" + [xVal, yVal] + ")"
        })
        .call(drag);

    playerBox.append("rect")
        .attr("x", function (d, i) {
            return rectPadding + rectWidth * i
        })
        .attr("y", 30)
        .attr("width", 40)
        .attr("height", 40)
        .attr("fill", colorScale(1));

    playerBox.append("text")
      .text(function(d){return d.key;})
      .attr("text-anchor", "middle")
      .attr("x", function(d,i){return (rectPadding + (rectWidth * i))})
      .attr("y", 80)
      .attr("font-family", "sans-serif");
}