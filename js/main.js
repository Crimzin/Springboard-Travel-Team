/**
 * Created by williamcorbett on 4/22/16.
 */

var formatDate = d3.time.format("%m-%d-%y").parse;
var formatTime = d3.time.format("%H:%M:%S").parse;
var format = d3.time.format("%m-%d-%y %H:%M:%S").parse;
var allData = [];

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
                trip.score = 0;
            });
            console.log(allData);
            runAlgorithm(allData);
        }
    });
}

loadData();

function runAlgorithm(data) {

    var filteredData = data.filter(function(trip){
        return trip.driving == "TRUE";
    })

    filteredData.forEach(function(trip){

        //INEVITABILITY
        //add a point if the group has traveled before
        trip.score += trip.traveled_before;

        //add one point for each level of inevitability (historical info)
        trip.score += trip.inevitable;
        //

        //add a point for each time the group goes on the current trip
        trip.score += trip.frequency;

        //add a point for the age level of the group
        trip.score += trip.age;

        //add a point for travel without grant likelihood
        trip.score += trip.likelihood_without_grant;

        //SAFETY
        //add a point for each hour in the car
        trip.score += trip.length;

        //add a point for each driving segment >=2.5 hours
        trip.score += (trip.length / (trip.drivers_to_destination / trip.cars_to_destination));

        //OTHER
        //add a point for each person on the trip
        trip.score += trip.people;

        trip.length =
    })

    //rank the trips
    filteredData.sort(function(a, b){
        return b.score - a.score;
    })

    console.log(filteredData);
}

// TO DO:
// 1) Factor in income/expenses
// 2) Give everything different weights
// 3) Factor in weather (AUTOMATED BASED ON DATES)
// 4) Automate length of driving (based on date+times)
// 5) Factor in driving AT destination (probably needs to just be
//    displayed when you hover over the group's div in the ranking









