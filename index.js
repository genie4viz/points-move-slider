var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %Y");
var parseDate = d3.timeParse("%m/%d/%y");

var margin = { top: 50, right: 50, bottom: 0, left: 50 },
    width = 1000 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("#viz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

Promise.resolve(d3.csv("tatal_tracks.csv")).then(data => {
    data = data.sort((a, b) => Number(a.Timestamp) - Number(b.Timestamp));
    var nestedTimestamp = d3.nest()
        .key(d => d.Timestamp)
        .entries(data);    
    
    var nestedID = d3.nest()
        .key(d => d.ID)
        .entries(data);
    console.log(nestedID)
    var moving = false;
    var currentValue = 0;
    var targetValue = width;

    var playButton = d3.select("#play-button");
    var x_domain = nestedTimestamp.map(d => d.key);
    var color_domain = nestedID.map(d => d.key);

    var colorRange = getRandomColors(color_domain.length);

    var colorScale = d3.scaleOrdinal()
        .domain(color_domain)
        .range(colorRange);

    var x = d3.scaleBand()
        .domain(x_domain)
        .range([0, targetValue]);
    // .clamp(true);

    // custom invert function
    x.invert = (function() {
        var domain = x.domain();
        var range = x.range();
        var scale = d3.scaleQuantize().domain(range).range(domain);

        return function(ex) {
            return scale(ex);
        }
    })();
    //add slider
    var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", `translate(${margin.left}, ${height + 30})`);

    slider.append("line")
        .attr("class", "track")
        .attr("x1", x.range()[0])
        .attr("x2", x.range()[1])
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-inset")
        .select(function() { return this.parentNode.appendChild(this.cloneNode(true)); })
        .attr("class", "track-overlay")
        .call(d3.drag()
            .on("start.interrupt", function() { slider.interrupt(); })
            .on("start drag", function() {
                var currentValue = x.invert(d3.event.x);
                update(currentValue);
            })
        );

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);
    ////////// plot //////////

    var plot = svg.append("g")
        .attr("class", "plot")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    playButton
        .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                // timer = 0;
                button.text("Play");
            } else {
                moving = true;
                timer = setInterval(step, 100);
                button.text("Pause");
            }
        })

    // drawAvailablePlot(x_domain[0])
    function step() {
        update(x.invert(currentValue));
        currentValue++;
        if (currentValue > targetValue) {
            moving = false;
            currentValue = 0;
            clearInterval(timer);
            timer = 0;
            playButton.text("Play");
            // console.log("Slider moving: " + moving);
        }
    }


    function drawPlot(moment) {

        var plotMoment = nestedTimestamp.filter(d => d.key === moment)[0].values;
        plot.selectAll("*").remove();
        for (var pt of plotMoment) {
            plot
                .append("circle")
                .attr("cx", pt.x)
                .attr("cy", pt.y)
                .style("fill", colorScale(pt.ID))
                .attr("r", 9)
            plot
                .append("text")
                .attr("x", Number(pt.x) + 10)
                .attr("y", Number(pt.y) + 5)
                .style("stroke", colorScale(pt.ID))
                .text(pt.ID + ":" + pt["Device Name"])
        }        
    }

    // function drawAvailablePlot(moment){

    //     var locations = plot.selectAll(".location")
    //         .data(nestedID);

    //     locations.enter()
    //         .append("circle")
    //         .attr("class", "location")
    //         .attr("cx", d => {
    //             var current = d.values.map(v => v.Timestamp === moment);
    //             if(current){
    //                 return current.x;
    //             }
    //         })
    //         .attr("cy", d => {
    //             var current = d.values.map(v => v.Timestamp === moment);
    //             if(current){
    //                 return current.y;
    //             }
    //         })
    //         .style("fill", d => colorScale(d.key))
    //         .attr("r", 9)
    //         .attr("opacity", d => {
    //             var current = d.values.map(v => v.Timestamp === moment);
    //             if(current){
    //                 return 1;
    //             }else{
    //                 return 0;
    //             }
    //         })
    //         // .transition()
    //         // .duration(200)
    //         // .attr("opacity", 0)
    //         // .transition()
    //         // .attr("r", 8);

    //     // if filtered dataset has less circles than already existing, remove excess
    //     locations.exit()
    //         .remove();
    // }


    function update(h) {
        // update position and text of label according to slider scale
        handle.attr("cx", x(h));
        drawPlot(h);
    }
    
    function getRandomColors(length) {
        var colors = [];
        for (var i = 0; i < length; i++) {
            colors.push(randomColor());
        }
        return colors;
    }

    function randomColor() {
        return '#' + parseInt(Math.random() * 0xffffff).toString(16)
    }
});