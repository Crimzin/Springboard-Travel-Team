/**
 * Created by williamcorbett on 4/22/16.
 */

var formatDate = d3.time.format("%m-%d-%y").parse;
var formatTime = d3.time.format("%H:%M:%S").parse;
var format = d3.time.format("%m-%d-%y %H:%M:%S").parse;
var allData = [];

var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// setup x
var xScale = d3.scale.linear().range([0, width]), // value -> display
    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

// setup y
var yScale = d3.scale.linear().range([height, 0]), // value -> display
    yAxis = d3.svg.axis().scale(yScale).orient("left");

var rScale = d3.scale.linear()
    .range([3.5, 15]);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// add the tooltip area to the webpage
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

function loadData() {
    d3.csv("data/Harvard_Student_Organization_Travel_Profile_(Responses).csv", function(error, data) {
        if (error){
            console.log("error");
        }
        else {
            allData = data;
            allData.forEach(function(trip) {
                trip.age = +trip.age;
                trip.arrival = format(trip.arrival_date.replace(/\//g, "-") + " " + trip.arrival_time);
                delete trip.arrival_date;
                delete trip.arrival_time;
                trip.cars_at_desination = +trip.cars_at_desination;
                trip.cars_to_destination = +trip.cars_to_destination;
                trip.departure = format(trip.departure_date.replace(/\//g, "-") + " " + trip.departure_time);
                delete trip.departure_date;
                delete trip.departure_time;
                trip.drivers_at_destination = +trip.drivers_at_destination;
                trip.drivers_to_destination = +trip.drivers_to_destination;
                trip.expenses = +trip.expenses;
                trip.frequency = +trip.frequency;
                trip.income = +trip.income;
                trip.inevitable = +trip.inevitable;
                trip.length = +trip.length;
                trip.likelihood_without_grant = +trip.likelihood_without_grant;
                trip.people = +trip.people;
                trip.return_departure = format(trip.return_date.replace(/\//g, "-") + " " + trip.return_time);
                delete trip.return_date;
                delete trip.return_time;
                trip.return_arrival = format(trip.return_arrival_date.replace(/\//g, "-") + " " + trip.return_arrival_time);
                delete trip.return_arrival_date;
                delete trip.return_arrival_time;
                trip.traveled_before = +trip.traveled_before;
                trip.weather = +trip.weather;
                trip.inevitability = 0;
                trip.safety = 1;
                trip.score = 0;
            });
            console.log(allData);
            runAlgorithm(allData);
        }
    });
}

loadData();

//INEVITABILITY WEIGHTS
var traveled_before_weight = 0.5;
var inevitable_weight = 0.9;
var frequency_weight = 0.7;
var age_weight = 0.3;
var likelihood_without_grant_weight = 0.6;

//SAFETY WEIGHTS
var length_weight = 1;
var segments_weight = 1;
var weather_weight = 0.7;

var people_weight = 0.3;

function runAlgorithm(data) {

    data.forEach(function(trip){

        //INEVITABILITY
        //add a point if the group has traveled before
        trip.inevitability += trip.traveled_before * traveled_before_weight;

        //add one point for each level of inevitability (historical info)
        trip.inevitability += trip.inevitable * inevitable_weight;

        //add a point for each time the group goes on the current trip
        trip.inevitability += trip.frequency * frequency_weight;

        //add a point for the age level of the group
        trip.inevitability += trip.age * age_weight;

        //add a point for travel without grant likelihood
        trip.inevitability += trip.likelihood_without_grant * likelihood_without_grant_weight;

        //SAFETY
        //add a point for each hour in the car
        trip.safety += trip.length *length_weight;

        //add a point for each driving segment >=2 hours
        if (trip.driving == "TRUE"){
        trip.safety += (trip.length / (trip.drivers_to_destination / trip.cars_to_destination)) * segments_weight;
        }

        //OTHER
        //add a point for each person on the trip
        //trip.safety += trip.people;

        //Add up both
        trip.score += trip.inevitability * trip.safety ;

    })

    var filteredData = data.filter(function(trip){
        return trip.driving == "TRUE";
    })

    //rank the trips
    filteredData.sort(function(a, b){
        return b.score - a.score;
    })

    console.log(data);

    //console.log(filteredData);

    // don't want dots overlapping axis, so add in buffer to data domain
    xScale.domain([d3.min(data, function(d) {return d.safety})-1, d3.max(data, function(d) {return d.safety})+1]);
    yScale.domain([d3.min(data, function(d) {return d.inevitability})-1, d3.max(data, function(d) {return d.inevitability})+1]);
    rScale.domain([d3.min(data, function(d) {return d.people}), d3.max(data, function(d) {return d.people})]);

    // x-axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .append("text")
        .attr("class", "label")
        .attr("x", width)
        .attr("y", -6)
        .style("text-anchor", "end")
        .text("Unsafe");

    // y-axis
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("class", "label")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Inevitable");

    // draw dots
    svg.selectAll(".dot")
        .data(data)
        .enter().append("circle")
        .attr("id", function(d) {return d.organization})
        .attr("class", "dot")
        .style("fill", function(d) {if (d.driving == "TRUE") return "red"; else return "blue";})
        .attr("r", function(d) {return rScale(d.people)})
        .attr("cx", function(d) { return xScale(d.safety)})
        .attr("cy", function(d) {return yScale(d.inevitability)})
        .attr("opacity", 0.6)
        .on("mouseover", function(d) {
            tooltip.transition()
                //.duration(200)
                .style("opacity", 1);
            tooltip.html("<strong>" + d.organization + "</strong><br/> Unsafe: " + d.safety
                    + "<br/> Inevitable: " + d.inevitability
                    + "<br/> People: " + d.people)
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                //.duration(500)
                .style("opacity", 0);
        });

    data.sort(function(a, b){
       return a.score - b.score;
    });

    var maxInevitable = d3.max(data, function(d) {return d.inevitability});
    var maxUnsafe = d3.max(data, function(d) {return d.safety});
    var maxScore = d3.max(data, function(d) {return d.score});

    function normalize(raw, max){
        return (raw * 10) / max;
    }

    var i = data.length;
    data.forEach(function(trip){
        //initialize row and cells
        var table = document.getElementById("ranking");
        var row = table.insertRow(0);
        var rank = row.insertCell(0);
        var club = row.insertCell(1);
        var cost = row.insertCell(2);
        var score = row.insertCell(3);
        var inevitable = row.insertCell(4);
        var unsafe = row.insertCell(5);

        //give them values
        rank.innerHTML = i;
        club.innerHTML = trip.organization;
        club.style = "text-align: left";
        cost.innerHTML = trip.expenses;
        inevitable.innerHTML = Math.round(normalize(trip.inevitability, maxInevitable));
        unsafe.innerHTML = Math.round(normalize(trip.safety, maxUnsafe));
        score.innerHTML = Math.round(normalize(trip.score, maxScore));
        i--;
    })
}

// TO DO:
// 4) Automate length of driving (based on date+times and destinations)
//      Query Google for this - GeoData lab might be able to help
// 8) Map visualization
// 3) Factor in weather (AUTOMATE BASED ON DATES)
// 9) Link vizs (e.g. hover over a trip in one and the others light up)
// 5) Factor in driving AT destination (probably needs to just be
//    displayed when you hover over the group's div in the ranking
//      ^Maybe not a big deal
// 1) Factor in income/expenses
//        Or not?

// OSL is creating travel cost and method guide; maybe next semester we make a coded version?
//      Use this to display the cost differential of funding the trip
// Ask if Cat (or anyone from Springboard) wants to join tha committee
// Organize meeting with Dean Friedrich and Peyton and Cat
// Put together slides
// Send Lauren Qualtrics survey


//Google Maps API key: AIzaSyBN98VC0PKeNpxFB6vA_DE0JfD2Q9poWuA