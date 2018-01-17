module.exports = function(grunt) {

  var csv = require("csv");
  var fs = require("fs");

  grunt.registerTask("aggregate", function() {

    var done = this.async();

    var zips = {};
    var filingsCSV = fs.readFileSync("filings.csv", "utf-8");

    var parser = csv.parse({
      columns: true,
      auto_parse: true
    });
    parser.on("data", function(row) {
      if (!zips[row.zip]) zips[row.zip] = {};
      var zip = zips[row.zip];
      if (!zip[row.address]) {
        zip[row.address] = 1;
      } else {
        zip[row.address]++;
      }
    });

    parser.on("finish", function() {
      var totals = {};
      for (var z in zips) {
        totals[z] = {};
        for (var a in zips[z]) {
          var count = zips[z][a];
          if (!totals[z][count]) {
            totals[z][count] = 1;
          } else {
            totals[z][count]++
          }
        }
      };
      // convert to array
      var output = [];
      for (var z in totals) {
        for (var c in totals[z]) {
          output.push({ zip: z, foreclosed: c, count: totals[z][c] });
        }
      }

      csv.stringify(output, function(err, str) {
        fs.writeFileSync("data/aggregated.csv", str);
        done();
      })
    });

    parser.write(filingsCSV);
    parser.end();

  });

};