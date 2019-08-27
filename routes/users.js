var express = require("express");
const bodyParser = require("body-parser");
var router = express.Router();
var User = require("../models/user");
var Noti = require("../models/noti");
var passport = require("passport");
var authenticate = require("../authenticate");
var router = express.Router();
router.use(bodyParser.json());
const cors = require("./cors");
var nodemailer = require("nodemailer");
const Messages = require("../models/messages");
const path = require("path");
require("dotenv").config();
//const io = require('socket.io')(router, { origins: '*:*'});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "exelcior99@gmail.com",
    pass: "Wjdckdgus99@"
    /* user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS */
  }
});

verifyMail = email => {
  let mailOptions = {
    from: "Match42@gmail.com",
    to: email,
    subject: "Sending Email using Node.js",
    html: `<form action='https://localhost:3443/users/verify/${email}' method='post'><input type='submit' value='Submit'></input></form>`
  };
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

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

pushNoti = (notiId, from, to, type) => {
  Noti.findByIdAndUpdate(
    notiId,
    {
      $push: {
        comments: {
          date: new Date().getTime(),
          from: from,
          type: type,
          unread: true
        }
      }
    },
    { new: true }
  ).then(result => {
    noti.emit(to, `${type} ${from}`);
  });
};

router.options("*", cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
});
//router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
router.get("/", cors.corsWithOptions, (req, res, next) => {
  User.find({})
    .then(
      users => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(users);
      },
      err => next(err)
    )
    .catch(err => next(err));
});

router.get("/filterd/:username", cors.corsWithOptions, (req, res, next) => {
  /* var chat = io.of('/chat');      
  chat.emit("test1", "test from log in"); */
  User.find({ username: { $nin: req.body.blacklist } })
    .then(
      users => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(users);
      },
      err => next(err)
    )
    .catch(err => next(err));
});

router.post("/lusers", cors.corsWithOptions, (req, res, next) => {
  let userList = {};
  /* userList.connectedUsers = User.find({ username: { $in: req.body.lusers } });
  userList.likedbyUsers = User.find({
    username: { $in: req.body.likedbyUsers }
  });
  userList.checkedbyUsers = User.find({
    username: { $in: req.body.checkedbyUsers }
  }); */
  User.find({
    username: { $in: req.body.connected }
  }).then(user => {
    userList.connected = user;
    User.find({
      username: { $in: req.body.likedby }
    }).then(user => {
      userList.likedby = user;
      User.find({
        username: { $in: req.body.checkedby }
      }).then(user => {
        userList.checkedby = user;
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(userList);
      });
    });
  });
});

/* router.post("/lusers", cors.corsWithOptions, (req, res, next) => {  
  User.find({ username: { $in: req.body.users } })
    .then(
      users => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(users);
      },
      err => next(err)
    )
    .catch(err => next(err));
}); */

router.post("/signup", cors.corsWithOptions, (req, res, next) => {
  //router.post('/signup', (req, res, next) => {
  User.register(
    new User({
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email
    }),
    req.body.password,
    (err, user) => {
      if (err) {
        //res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.json({ err: err, status: "dgd" });
      } else {
        let newNoti = new Noti({ username: req.body.username });
        console.log("noti_id: " + newNoti._id);
        user.noti = newNoti._id;
        newNoti.save();
        /* if (req.body.firstname) user.firstname = req.body.firstname;
        if (req.body.lastname) user.lastname = req.body.lastname;
        if (req.body.email) user.email = req.body.email; */
        user.save((err, user) => {
          if (err) {
            console.log("err at saving users");
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.json({ err: err });
            return;
          }
          passport.authenticate("local")(req, res, () => {
            verifyMail(req.body.email, req.body.username);
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json({ success: true, status: "Registration Successful!" });
          });
        });
      }
    }
  );
});

router.post("/verify/:email", cors.corsWithOptions, (req, res, next) => {
  User.findOneAndUpdate(
    { email: req.params.email },
    { verified: true },
    {
      new: true
    }
  )
    .then(
      user => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.render("layout.jade");
      },
      err => next(err)
    )
    .catch(err => next(err));
});

router.get("/edit/:username", cors.corsWithOptions, (req, res, next) => {
  User.findOne({ username: req.params.username })
    .populate("comments.author")
    .then(
      user => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      },
      err => next(err)
    )
    .catch(err => next(err));
});

router.post("/edit", cors.corsWithOptions, (req, res, next) => {
  User.findOneAndUpdate(
    { username: req.body.username },
    {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      gender: req.body.gender,
      prefer: req.body.prefer,
      email: req.body.email,
      gps: req.body.gps.split(","),
      biography: req.body.biography,
      tags: req.body.tags
    },
    { new: true }
  )
    .then(
      user => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      },
      err => next(err)
    )
    .catch(err => next(err));
});

//chatroom register
router.post("/chatroom", (req, res, next) => {
  console.log("/chatrooms req.body: " + req.body);
  const str = `chatRooms.${req.body.user2}`;
  User.findOneAndUpdate(
    { username: req.body.user1 },
    { $set: { [str]: req.body.room } },
    { new: true },
    (err, user) => {
      console.log(err);
    }
  )
    .then(
      user => {
        res.statusCode = 200;
        4;
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      },
      err => next(err)
    )
    .catch(err => next(err));
});

const matchMake = (user1, user2) => {
  let newMessage = new Messages({ users: { [user1]: user2, [user2]: user1 } });
  User.findOneAndUpdate(
    { username: user1 },
    {
      $push: { connected: user2 },
      $set: { chatrooms: { [user2]: newMessage.id } }
    },
    { new: true }
  ).then(user => {
    newMessage.image[user1] = user.profile;
    pushNoti(user.noti, user2, user1, "connected");
  });
  User.findOneAndUpdate(
    { username: user2 },
    {
      $push: { connected: user1 },
      $set: { chatrooms: { [user1]: newMessage.id } }
    },
    { new: true }
  ).then(user => {
    newMessage.image[user2] = user.profile;
    pushNoti(user.noti, user1, user2, "connected");
    newMessage.save();
  });
  //console.log("newMessage.image : " + JSON.stringify(newMessage.image));
  /* Messages.create({users:{[user1]:user2, [user2]:user1}})
  .then(chatRoom => {
    User.findOneAndUpdate({username:user1}, { $push: {chatrooms : {[user2]: chatRoom.id}}}, {new:true})
    .then(user => {        
      console.log("chatRoom" + chatRoom);
        chatRoom.image[user1] = user.profile;        
        chatRoom.image[user1] = "a";
        console.log("image in the user: " + JSON.stringify(chatRoom.image));
        chatRoom.save();
        chatRoom.update({$set:{ image: {[user1]:user.profile}}}, {new:true});
      });
    User.findOneAndUpdate({username:user2}, { $push: {chatrooms : {[user1]: chatRoom.id}}}, {new:true})
    .then(user => {   
        chatRoom.save();
      });    
  }); */
};

router.post("/add/blacklist", cors.corsWithOptions, (req, res, next) => {
  let user1 = req.body.user;
  let user2 = req.body.data;
  User.findOneAndUpdate(
    { username: user1 },
    { $push: { blacklist: user2 } },
    { new: true }
  )
    .then(user => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(user);
    })
    .catch(err => next(err));
});

router.post("/add/like", cors.corsWithOptions, (req, res, next) => {
  let user1 = req.body.user;
  let user2 = req.body.data;
  let image;
  User.findOneAndUpdate(
    { username: user1 },
    { $push: { like: user2 } },
    { new: true }
  ).then(user => {
    //console.log("add/like user.likedby" + user.likedby);
    if (user.likedby.indexOf(user2) !== -1) {
      matchMake(user1, user2);
    }
    image = user.profile;
  });
  User.findOneAndUpdate(
    { username: user2 },
    { $push: { likedby: user1 } },
    { new: true }
  )
    .then(user => {
      pushNoti(user.noti, user1, user2, "like");
      /* Noti.findByIdAndUpdate(
        user.noti,
        { $push: { comments: obj } },
        { new: true }
      ).then(noti => {
        console.log("User2 noti : " + JSON.stringify(noti));
      }); */
    })
    .then(user => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(user);
    })
    .catch(err => next(err));
});

router.get("/user/:username", cors.corsWithOptions, (req, res, next) => {
  //console.log("req.params: " + req.params);
  User.findOne({ username: req.params.username })
    .then(
      user => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      },
      err => next(err)
    )
    .catch(err => next(err));
});

router.get("/:username/:field", cors.corsWithOptions, (req, res, next) => {
  //console.log("req.params: " + req.params);
  const str = `${req.params.field}`;
  User.findOne({ username: req.params.username })
    .then(
      user => {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(user[str]);
      },
      err => next(err)
    )
    .catch(err => next(err));
});

router.post("/login", cors.corsWithOptions, (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      res.statusCode = 401;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: false, status: "Login Unsuccessful!", err: info });
    }
    req.logIn(user, err => {
      if (err) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.json({
          success: false,
          status: "Login Unsuccessful!",
          err: "Could not log in user!"
        });
      }
      var token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: true, status: "Login Successful!", token: token });
    });
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy();
    res.clearCookie("session-id");
    res.redirect("/");
  } else {
    var err = new Error("You are not logged in!");
    err.status = 403;
    next(err);
  }
});

router.get(
  "/facebook/token",
  passport.authenticate("facebook-token"),
  (req, res) => {
    if (req.user) {
      var token = authenticate.getToken({ _id: req.user._id });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({
        success: true,
        token: token,
        status: "You are successfully logged in!"
      });
    }
  }
);

module.exports = router;
