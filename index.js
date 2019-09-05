var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %Y");
var parseDate = d3.timeParse("%m/%d/%y");

var margin = { top: 50, right: 50, bottom: 0, left: 50 },
    width = 5000 - margin.left - margin.right,
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

    var startDate = data[0].Timestamp, //new Date(d3.min(data.map(d => Number(d.Timestamp)))),
        endDate = data[data.length - 1].Timestamp; //new Date(d3.max(data.map(d => Number(d.Timestamp))));
    console.log(startDate, endDate);
    
    var moving = false;
    var currentValue = 0;
    var targetValue = width;

    var playButton = d3.select("#play-button");
    var x_domain = Array.from(new Set(data.map(d => d.Timestamp)));

    var x = d3.scaleBand()
        .domain(x_domain)
        .range([0, targetValue])
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
  
    var slider = svg.append("g")
        .attr("class", "slider")
        .attr("transform", "translate(" + margin.left + "," + height / 5 + ")");

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

    // slider.insert("g", ".track-overlay")
    //     .attr("class", "ticks")
    //     .attr("transform", "translate(0," + 18 + ")")
    //     .selectAll("text")
    //     .data(x.ticks(10))
    //     .enter()
    //     .append("text")
    //     .attr("x", x)
    //     .attr("y", 10)
    //     .attr("text-anchor", "middle")
    //     .text(function(d) { return d; });

    var handle = slider.insert("circle", ".track-overlay")
        .attr("class", "handle")
        .attr("r", 9);

    // var label = slider.append("text")
    //     .attr("class", "label")
    //     .attr("text-anchor", "middle")
    //     .text(startDate)
    //     .attr("transform", "translate(0," + (-25) + ")");

    ////////// plot //////////

    var plot = svg.append("g")
        .attr("class", "plot")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    drawPlot(startDate);

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
            // console.log("Slider moving: " + moving);
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
        // var locations = plot.selectAll(".location")
        //     .data(data);
        // console.log(moment, 'monnet')
        // var plotMoment = nested.filter(d => Number(d.key) === moment.toFixed(0));

        // console.log(plotMoment)
        // // if filtered dataset has more circles than already existing, transition new ones in
        // .attr("cx", function(d) {
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
        console.log(h, 'h')
        handle.attr("cx", x(h));
        // label
        //     .attr("x", x(h))
        //     .text(formatDate(h));

        // filter data set and redraw plot
        drawPlot(h);
    }

    // var nested = d3.nest()
    //     .key(d => d.Timestamp)
    //     .entries(data);


    // console.log(nested)
    // var paths = [];
    // for (let i = 0; i < nested.length; i++) {
    //     var pathCurrent = `M${nested[i].values[0].x} ${nested[i].values[0].y}`;
    //     for (let k = 1; k < nested[i].values.length; k++) {
    //         pathCurrent += `L${nested[i].values[k].x} ${nested[i].values[k].y}`;
    //     }
    //     paths.push(pathCurrent);
    // }

    // var linesPane = d3.select("svg");
    // var testLen = 3;
    // for (let i = 0; i < testLen; i++) {
    //     linesPane
    //         .append("path")
    //         .attr("class", "path-person-" + nested[i].values[0].ID)
    //         .attr("fill", "transparent")
    //         .attr("stroke", "green")
    //         .attr("opacity", 0.2)
    //         .attr("d", paths[i]);
    //     //add arrows
    //     linesPane
    //         .append("path")
    //         .attr("class", "arrow-" + nested[i].values[0].ID)
    //         .attr("fill", "red")
    //         .attr("stroke", "red")
    //         .attr("opacity", 0.7)
    //         .attr("d", "M34.5441,24.8292L15.1154,44.2573c-1.2359,1.2365-3.2397,1.2365-4.475,0c-1.2354-1.2354-1.2354-3.2391,0-4.4744   L27.8318,22.592L10.6409,5.4017c-1.2354-1.2359-1.2354-3.2394,0-4.4748c1.2354-1.2359,3.2391-1.2359,4.475,0l19.4287,19.4284   c0.6177,0.618,0.9262,1.4271,0.9262,2.2366C35.4708,23.4018,35.1617,24.2115,34.5441,24.8292z");
    // }

    // for (let i = 0; i < testLen; i++) {
    //     var path = anime.path(".path-person-" + nested[i].values[0].ID);
    //     anime({
    //         targets: ".arrow-" + nested[i].values[0].ID,
    //         translateX: path("x"),
    //         translateY: path("y"),
    //         rotate: path("angle"),
    //         easing: "linear",
    //         duration: 50000,
    //         loop: false
    //     });
    // }
    // var path = anime.path(".base-path");

    // anime({
    //     targets: ".arrow",
    //     translateX: path("x"),
    //     translateY: path("y"),
    //     rotate: path("angle"),
    //     easing: "linear",
    //     duration: 50000,
    //     loop: true
    // });
    // anime({
    //     targets: ".arrow-1",
    //     translateX: path("x"),
    //     translateY: path("y"),
    //     rotate: path("angle"),
    //     easing: "linear",
    //     delay: 200,
    //     duration: 100000,
    //     loop: true
    // });
    // anime({
    //     targets: ".arrow-2",
    //     translateX: path("x"),
    //     translateY: path("y"),
    //     rotate: path("angle"),
    //     easing: "linear",
    //     delay: 400,
    //     duration: 100000,
    //     loop: true
    // });
    // var pathEls = document.querySelectorAll("path");
    // for (var i = 0; i < pathEls.length; i++) {
    //     var pathEl = pathEls[i];
    //     var offset = anime.setDashoffset(pathEl);
    //     pathEl.setAttribute("stroke-dashoffset", offset);
    //     anime({
    //         targets: pathEl,
    //         strokeDashoffset: [offset, 0],
    //         duration: 100000, //anime.random(1000, 3000),
    //         // delay: 1, //anime.random(0, 2000),
    //         loop: true,
    //         // direction: "alternate",
    //         // easing: "easeInOutSine",
    //         autoplay: true
    //     });
    // }
});