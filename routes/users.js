var express = require('express');
const bodyParser = require('body-parser');
var router = express.Router();
var User = require('../models/user');
var Noti = require('../models/noti');
var passport = require('passport');
var authenticate = require('../authenticate');
var router = express.Router();
router.use(bodyParser.json());
const cors = require('./cors');
var nodemailer = require('nodemailer');
const Messages = require('../models/messages');
const path = require('path');
require('dotenv').config()
//const io = require('socket.io')(router, { origins: '*:*'});


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});   

verifyMail = (email) => {  
  let mailOptions = {
    from: 'Match42@gmail.com',
    to: email,
    subject: 'Sending Email using Node.js',
    html : `<form action='https://localhost:3443/users/verify/${email}' method='post'><input type='submit' value='Submit'></input></form>`
  };        
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  }); 
}

/* var chat = io
  .of('/chat')
  .on('connection', function (socket) {    
    socket.on('message', function(msg){
      console.log(msg);
      chat.emit(msg[0], [msg[1], msg[0], "response"]);
    });
    socket.emit('message', {
        that: 'only'
      , '/chat': 'will get'
    });
    chat.emit('message', {
        everyone: 'in'
      , '/chat': 'will get'
    });
  });
 */
/* GET users listing. */
router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });
//router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
router.get('/', cors.corsWithOptions, (req,res,next) => {
  var chat = io.of('/chat');      
  chat.emit("test1", "test from log in");
  User.find({})  
  .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
  }, (err) => next(err))
  .catch((err) => next(err));
});

router.post('/lusers', cors.corsWithOptions, (req,res,next) => { 
  //var obj_ids = req.body.users.split(',').map(function(id) { return ObjectId(id); });
  //console.log(req.body);  
  User.find({username: {$in: req.body.users}})  
  .then((users) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(users);
  }, (err) => next(err))
  .catch((err) => next(err));
});


router.post('/signup', cors.corsWithOptions, (req, res, next) => {
//router.post('/signup', (req, res, next) => {
  User.register(new User({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      let newNoti=new Noti({username: req.body.username});
      console.log("noti_id: " + newNoti._id);
      user.noti = newNoti._id;
      newNoti.save();
      if (req.body.firstname)
        user.firstname = req.body.firstname;
      if (req.body.lastname)
        user.lastname = req.body.lastname;
      if (req.body.email)
        user.email = req.body.email;                       
      user.save((err, user) => {
        if (err) {          
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');          
          res.json({err: err});
          return ;
        }
        passport.authenticate('local')(req, res, () => {          
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true, status: 'Registration Successful!'});
          verifyMail(req.body.email, req.body.username);
        });
      });      
    }
  });
});

router.post('/verify/:email', cors.corsWithOptions, (req, res, next) => {  
  User.findOneAndUpdate({email:req.params.email}, { verified:true}, {
    new: true
  }).then((user) => {    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');    
    res.render('layout.jade');    
}, (err) => next(err))
.catch((err) => next(err));
})

router.get('/edit/:username', cors.corsWithOptions, (req,res,next) => {
  User.findOne({username:req.params.username})
  .populate('comments.author')
  .then((dish) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(dish);
  }, (err) => next(err))
  .catch((err) => next(err));
})

router.post('/edit', cors.corsWithOptions, (req, res, next) => {  
  User.findOneAndUpdate({username:req.body.username}, {
    firstname: req.body.firstname,
    lastname: req.body.lastname,    
    gender: req.body.gender,
    prefer: req.body.prefer,
    email: req.body.email,
    gps: req.body.gps.split(","),
    biography: req.body.biography,
    tags: req.body.tags.split(",")}
    , {new: true})
  .then((user) => {    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(user);
}, (err) => next(err))
.catch((err) => next(err));
})

//chatroom register
router.post('/chatroom', (req, res, next) => {  
  console.log("req.body: " + req.body);
  const str = `chatRooms.${req.body.user2}`;
  User.findOneAndUpdate({username: req.body.user1}, { $set: { [str] : req.body.room  } }, {new:true})  
  .then((user) => {    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(user);
}, (err) => next(err))
.catch((err) => next(err));
})     

router.post('/add/:field', cors.corsWithOptions, (req, res, next) => {  
  //console.log("req.params: " + req.params);  
  let user1 = req.body.user;
  let user2 = req.body.data;

  let noti = io.of('noti');
  noti.emit(user2, `${user1} like you`);
  console.log(user2 + `\n${user1} like you`);
  const str = req.params.field;
  if(req.body.connected){
    //notify connected
    noti.emit(user2, `${user1} connected`);
    noti.emit(user1, `${user2} connected`);
    //create chat room
    let room = new Messages({users=[user1, user2]});


    //save chatroom id in each users`    
  }
  User.findOne({username: user2})  
  .then(user => {
    user[str] = user[str].concat(user1); 
    user.save((err, user) => {
      if (err) {          
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');          
        res.json({err: err});
        return ;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(user[str]);      
  })
  })  
  .catch((err) => next(err));
})     

router.post('/addback', cors.corsWithOptions, (req, res, next) => {  
  //console.log("req.params: " + req.params);  
  let noti = io.of('noti');
  noti.emit(req.body.data, `${req.body.user} like you`);
  console.log(req.body.data + `\n${req.body.user} like you`);
  const str = req.params.field;  
  User.findOne({username: req.body.data})  
  .then(user => {
    user[str] = user[str].concat(req.body.user); 
    user.save((err, user) => {
      if (err) {          
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');          
        res.json({err: err});
        return ;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json(user[str]);      
  })
  })  
  .catch((err) => next(err));
})     

router.get('/:username/:field', cors.corsWithOptions, (req, res, next) => {  
  //console.log("req.params: " + req.params);
  const str = `${req.params.field}`;
  User.findOne({username: req.params.username})    
  .then((user) => {    
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json(user[str]);
}, (err) => next(err))
.catch((err) => next(err));
})    

router.post('/login', cors.corsWithOptions, (req, res, next) => {    
  passport.authenticate('local', (err, user, info) => {
    if (err)
      return next(err);
    if (!user) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: false, status: 'Login Unsuccessful!', err: info});
    }
    req.logIn(user, (err) => {
      if (err) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.json({success: false, status: 'Login Unsuccessful!', err: 'Could not log in user!'});          
      }      
      var token = authenticate.getToken({_id: req.user._id});      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.json({success: true, status: 'Login Successful!', token: token});
      
    }); 
  }) (req, res, next);
});

router.get('/logout', (req, res) => {    
  if (req.session) {    
    req.session.destroy();
    res.clearCookie('session-id');
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    next(err);
  }
});

router.get('/facebook/token', passport.authenticate('facebook-token'), (req, res) => {
  if (req.user) {
    var token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({success: true, token: token, status: 'You are successfully logged in!'});
  }
});

module.exports = router;
