var express = require('express');
var router = express.Router();
var multer = require('multer');
var mongoose = require('mongoose');
var session = require('client-sessions');

router.use(session({
  cookieName: 'mySession',
  secret: 'whatever',
  duration: 30*60*1000,
  activeDuration: 5*60*1000,
  cookie: {secure: !true}
}));

var imageSchema = new mongoose.Schema({
  username: String,
  description: String,
  path:{
    type: String,
    required: true,
    trim: true
  },
  originalname: {
    type: String,
    required: true
  }
});
var Image = mongoose.model('Image', imageSchema);

router.getImages = function(userName, callback, limit){
  if(userName === ""){
    Image.find(callback).limit(limit);
  } else{
    console.log(userName)
    Image.find({username: userName}, callback).limit(limit);
  }
}

router.getMyImages = function(userName,callback, limit){
  Image.find({username:userName},callback).limit(limit);
}

router.getImageById = function(id, callback){
  Image.findById(id,callback);
}
router.addImage = function(image, callback){
  Image.create(image, callback);
}


router.requireSignin = function(req, res, next) {
  if(!req.mySession.userName){
    res.redirect('/signin');
  } else{
    next();
  }
}

var storage = multer.diskStorage({
  destination: function(req, file, callback){
    callback(null,'public/images/');
  },
  filename: function(req, file,callback){
    callback(null, file.originalname);
  }
});

var upload = multer({
  storage: storage
});

router.get('/', router.requireSignin, function(req, res){
  res.redirect('/images');

});

router.get('/signin',function(req, res){
  if(!req.mySession.userName){
    res.render('signin.ejs');
  }
  else{
    res.redirect('/images');
  }
});

router.post('/signin',upload.any(), function(req, res){
  req.mySession.userName = req.body.username;
  res.redirect('/images/');
});


router.get('/upload', router.requireSignin, function(req, res){
  res.render('upload.ejs',{username: req.mySession.userName});
});

router.post('/upload', upload.any(), function(req, res){
  var validFileExtensions = ["jpg", "jpeg", "png", "gif"];
  var description = req.body.description;
  var path = req.files[0].path;
  var imageName = req.files[0].originalname;
  var image={};
  image['username'] = req.mySession.userName;
  image['path'] = path;
  image['originalname'] = imageName;
  image['description'] = description;

  router.addImage(image, function(err){});
  res.redirect('/images');

});

router.post('/update/',upload.any(), function(req, res){
  Image.findById(req.body.id).update({description: req.body.description}, function(err, data){
    if(err) throw err;
    res.redirect('/myimages');
  });
});

router.delete('/delete/:id', function(req, res){
  //delete the requested item from mongodb
  Image.findById(req.params.id).remove(function(err, data){
    if(err) throw err;
    res.json(data);
  });
});

module.exports = router;
