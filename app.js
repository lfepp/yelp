'use strict';

var yelp = require('yelp').createClient({
  consumer_key: 'q9HCxwON4DQTMQZlfwFCNw',
  consumer_secret: 'f9tyRm5bnGcW0_rw-6c1TG2Gha0',
  token: 'le6gyKArYY-nV7BR0bsqEYJge3sqsTls',
  token_secret: 'Sf-GECfPAw65IHJbq_9TLwoDus8'
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
  res.sendFile(__dirname + '/index.html');
})

app.post('/input', input.single('bizIDs'), function(req, res) {
  res.sendFile(__dirname + '/views/submit.html');
  console.dir(req.file);
  path = req.file.path;
  var fileContents = fs.readFile(path, 'utf8', function(err, data) {
    if(err) {
      console.log(err);
    } else {
      var str = data.replace(/\s/g,"");
      ids = str.split(',');
      console.log(ids.length + 'IDs submitted');
    }
  })
})

app.get('/call', function(req, res) {
  res.sendFile(__dirname + '/views/call.html');
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

app.listen('9000');

module.exports = app;
