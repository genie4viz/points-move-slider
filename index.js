var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %Y");
var parseDate = d3.timeParse("%m/%d/%y");

var margin = { top: 50, right: 50, bottom: 0, left: 50 },
    width = 1600 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var svg = d3.select("#viz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

var colorScale = d3.scaleOrdinal("schemeAccent");

Promise.resolve(d3.csv("tracks.csv")).then(data => {
    data = data.sort((a, b) => Number(a.Timestamp) - Number(b.Timestamp));
    var nested = d3.nest()
        .key(d => d.Timestamp)
        .entries(data);

    var moving = false;
    var currentValue = 0;
    var targetValue = width;

    var playButton = d3.select("#play-button");
    var x_domain = Array.from(new Set(data.map(d => d.Timestamp)));

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
        .attr("transform", `translate(${margin.left}, ${height  + 30})`);

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

    drawPlot(x_domain[0]);

    playButton
        .on("click", function() {
            var button = d3.select(this);
            if (button.text() == "Pause") {
                moving = false;
                clearInterval(timer);
                timer = 0;
                button.text("Play");
            } else {
                moving = true;
                timer = setInterval(step, 100);
                button.text("Pause");
            }
        })

    function step() {
        update(x.invert(currentValue));
        currentValue++; //= currentValue + (targetValue / 151);
        if (currentValue > targetValue) {
            moving = false;
            currentValue = 0;
            clearInterval(timer);
            // timer = 0;
            playButton.text("Play");
            // console.log("Slider moving: " + moving);
        }
    }


    function drawPlot(moment) {

        var plotMoment = nested.filter(d => d.key === moment)[0].values;

        plot.selectAll("circle").remove();
        for (var i = 0; i < plotMoment.length; i++) {
            plot
                .append("circle")
                .attr('cx', plotMoment[i].x)
                .attr('cy', plotMoment[i].y)
                .attr('r', 9)
                .attr('fill', 'green');
        }


        //     for(var i = 0; i < d.values.length; i++){

        //     }
        //     return x(Number(d.Timestamp));
        // })
        // locations.enter()
        //     .append("circle")
        //     .attr("class", "location")
        //     .attr("cx", function(d) {
        //         for(var i = 0; i < d.values.length; i++){

        //         }
        //         return x(Number(d.Timestamp));
        //     })
        //     .attr("cy", height / 2)
        //     .style("fill", function(d) { return d3.hsl(Number(d.Timestamp) / 1000000000, 0.8, 0.8) })
        //     .style("stroke", function(d) { return d3.hsl(Number(d.Timestamp) / 1000000000, 0.7, 0.7) })
        //     .style("opacity", 0.5)
        //     .attr("r", 8);
        //     // .transition()
        //     // .duration(400)
        //     // .attr("r", 25)
        //     // .transition()
        //     // .attr("r", 8);

        // // // if filtered dataset has less circles than already existing, remove excess
        // // locations.exit()
        // //     .remove();
    }

    function update(h) {
        // update position and text of label according to slider scale
        handle.attr("cx", x(h));
        drawPlot(h);
    }

});