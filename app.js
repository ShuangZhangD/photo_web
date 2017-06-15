var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var helpers = require('express-helpers');
var session = require('client-sessions');
helpers(app);
app.listen(process.env.PORT || 3000);
console.log('Running on port 3000');
// mongodb
var mongoose = require('mongoose');
mongoose.connect('mongodb://test:test@ds155201.mlab.com:55201/myphoto')

var path = require('path');

var routes = require('./routes/imagefile');

app.use('/', routes);
// public dir
app.use(express.static("./public"));
app.use(session({
  cookieName: 'mySession',
  secret: 'whatever',
  duration: 30*60*1000,
  activeDuration: 5*60*1000,
  cookie: {secure: false}
}));

app.get('/images/', routes.requireSignin, function(req, res){
  var queryUserName = "";
  if(req.query && req.query.user){
    queryUserName = req.query.user;
  }
  routes.getImages(queryUserName, function(err, genres){
    if(err) throw err;
    if(req.mySession && req.mySession.userName){
      res.render('images.ejs', {data: genres, username: req.mySession.userName});
    }
});
});


app.get('/myimages', routes.requireSignin, function(req, res){
  routes.getMyImages(req.mySession.userName,function(err, genres){
    if(err) throw err;
    if(req.mySession && req.mySession.userName){
      res.render('myImages.ejs', {data: genres, username: req.mySession.userName});
    }
  });
});

app.get('/image/:id', function(req, res){
  routes.getImageById(req.params.id, function(err, genres){
    res.send(genres.path);
  });
});


app.get('/signout/',function(req, res){
  req.mySession.reset();
  res.redirect('/signin');
});

