'use strict';

var apiKey = require('./app/config.js');

var yelp = require('yelp').createClient({
  consumer_key: apiKey.consumerKey,
  consumer_secret: apiKey.consumerSecret,
  token: apiKey.token,
  token_secret: apiKey.tokenSecret
});
var express = require('express');
var app = express();
var fs = require('fs');

var multer = require('multer');
var input = multer({ dest: 'input/'});

var json2csv = require('nice-json2csv');
app.use(json2csv.expressDecorator);

var json = [];
var ids = [];
var i = 0;
var temp = -1;
var path = '';

app.get('/', function(req, res) {
  json = [];
  ids = [];
  i = 0;
  temp = -1;
  path = '';
  res.sendFile(__dirname + '/public/views/index.html');
})

app.post('/input', input.single('bizIDs'), function(req, res) {
  path = req.file.path;
  var fileContents = fs.readFile(path, 'utf8', function(err, data) {
    if(err) {
      console.log(err);
      res.sendFile(__dirname + '/public/views/submit.html');
    } else {
      var str = data.replace(/\s/g,"");
      ids = str.split(',');
      console.log('Uploaded ' + ids.length + ' IDs');
      res.redirect('/call');
    }
  })
})

app.get('/call', function(req, res) {
  res.setTimeout(0);
  console.log(ids.length);
  var queryInt = setInterval(function() {
    if(temp < i) {
      temp++;
      console.log('Running for index: ' + i);
      yelp.business(ids[i], function(error, data) {
        if(!error) {
          json[i] = {
            idSent: ids[i],
            id: data.id,
            url: data.url,
            isClaimed: data.is_claimed,
            isClosed: data.is_closed,
            name: data.name,
            phone: data.display_phone,
            address: data.location.address[0],
            city: data.location.city,
            state: data.location.state_code,
            zip: data.location.postal_code,
            country: data.location.country_code,
            numReviews: data.review_count
          };
          console.log('Successfully added:');
          console.dir(json[i]);
          i++;
        } else {
          console.log(error);
          json[i] = {
            idSent: ids[i],
            status: error.statusCode,
            errorData: error.data
          }
          i++;
          if (i >= ids.length) {
            clearInterval(queryInt);
            console.log('All IDs have processed!');
            res.redirect('/write');
          }
        }
      })
    }
  }, 0)
})

app.get('/write', function(req, res) {
  fs.unlink(path, function(err) {
    if(err) {
      console.log(err);
    }
  })
  console.log('Successfully wrote output.csv');
  res.csv(json, 'output.csv');
})

app.listen(process.env.PORT || 9000);
console.log('Server running on localhost:9000');

module.exports = app;
