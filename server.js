// get dependencies
const http = require('http');
const mongoose = require('mongoose');
const url = "mongodb://heroku_zw7r33bw:ktsol2q3v842ec1urocmvappdp@ds251217.mlab.com:51217/heroku_zw7r33bw";
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express()

app.use(express.static(__dirname + '/js'));
app.use(express.static(__dirname + '/css'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')

// schema for database -------------------------------------
var Schema = mongoose.Schema;
var employeeSchema = new Schema({
  first: String,
  last: String,
  base: Number,
  deductions: [Number],
  takehome: Number
});

var Employee = mongoose.model('Employee', employeeSchema);
mongoose.connect(url);
// end database ---------------------------------------------



// default index route
app.get('/', (req,res) => {

  Employee.find(function (err, employees) {
    if (err) return console.error(err);
    res.render('index', {response: employees});
  })
})

// route for creating new entry
app.post('/create', (req,res) => {

  if(!req.body.first || !req.body.last) {
    res.sendStatus(400);
  }
  var takehome = req.body.base;
  var nums = req.body.deductions.split(',').map(Number);
  console.log(nums);

  // determing takehome pay by removing deductions
  for (var i of nums) {
    takehome -= i;
  }
  var newGuy = new Employee({ first: req.body.first, last: req.body.last, base: req.body.base, deductions: nums, takehome: takehome });

  newGuy.save(function (err, newGuy) {
   if (err) return console.error(err);
   console.log(newGuy + " saved");
  });

  res.redirect('/');
});

// route for deleting existing entry
app.post('/delete', (req,res) => {
  if(!req.body.first || !req.body.last) {
    res.send("error deleting");
  }
  var first = req.body.first;
  var last = req.body.last;

  // find the db entry with the associated first and last name
  Employee.findOne({ 'first': first, 'last': last }, 'first last base deductions takehome', function (err, employees) {
  if (err) return handleError(err);
  }).remove().exec();
  console.log("deleted entry " + first + " " + last);
  res.redirect('/');
});

// route for updating existing entry
app.post('/update', (req,res) => {
  //get first and last name from get
  var first = req.body.first;
  var last = req.body.last;
  var base = req.body.base;
  var takehome = req.body.base;
  var nums = req.body.deductions.split(',').map(Number);

  // determing takehome pay by removing deductions
  for (var i of nums) {
    takehome -= i;
  }
  // find the db entry with the associated first and last name
  Employee.findOne({ 'first': first, 'last': last }, 'first last base deductions takehome', function (err, employee) {
    if (err) return handleError(err);
    employee.first = first;
    employee.last = last;
    employee.base = base;
    employee.deductions = nums;
    employee.takehome = takehome;
    console.log(employee.id);
    // attempt to update the entry found for given first/last combo
    Employee.update({_id: employee.id}, employee, function(err, data) {
      if (err) return err;
    }).exec(function(err, emp) {
      if (err) res.send(err);
      res.redirect('/');
    });
  });
});

// catch-all to account for error routes
app.get('*', (req, res) => {
  res.redirect('/');
});

// set port and serve, use process.env to get Heroku config
const port = (process.env.PORT || '3000');
app.set('port', port);
const server = http.createServer(app);
server.listen(port, () => console.log(`Server running on localhost:${port}`));
