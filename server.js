'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./db-connection');
const helmet = require('helmet');

const cors = require('cors');

const apiRoutes = require('./routes/api.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');

const app = express();
// Setup HelmetJS:


app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "script-src": ["'self'"],
      "style-src": ["'self'"],
    },
  })
);
app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({ origin: '*' })); //For FCC testing purposes only

app.use(express.urlencoded({ extended: true }));
app.use(express.json());






//Index page (static HTML)
app.route('/')
  .get(function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

//For FCC testing purposes
fccTestingRoutes(app);
myDB(async (client) => {
  const myDataBase = await client.db('FCC_STOCK_PRICE_CHECKER').collection('likes');

  //Routing for API 
  apiRoutes(app, myDataBase);

}).catch((e) => {
  app.route('/').get((req, res) => {
    res.send(`${e}, message: 'Unable to connect to db' `);
  });
});




//Start our server and tests!
app.listen(process.env.PORT || 3000, function() {
  console.log("Listening on port " + process.env.PORT);
  if (process.env.NODE_ENV === 'test') {
    console.log('Running Tests...');
    setTimeout(function() {
      try {
        runner.run();
      } catch (e) {
        var error = e;
        console.log('Tests are not valid:');
        console.log(error);
      }
    }, 2000);
  }
});

module.exports = app; //for testing
