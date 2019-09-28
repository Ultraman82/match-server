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
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
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

getDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  } else {
    var radlat1 = (Math.PI * lat1) / 180;
    var radlat2 = (Math.PI * lat2) / 180;
    var theta = lon1 - lon2;
    var radtheta = (Math.PI * theta) / 180;
    var dist =
      Math.sin(radlat1) * Math.sin(radlat2) +
      Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = (dist * 180) / Math.PI;
    dist = dist * 60 * 1.1515;
    /* if (unit=="K") { dist = dist * 1.609344 }
      if (unit=="N") { dist = dist * 0.8684 } */
    return dist;
  }
};

router.options("*", cors.corsWithOptions, (req, res) => {
  res.sendStatus(200);
});
//router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req,res,next) => {
// router.post("/", cors.corsWithOptions, (req, res, next) => {
//   User.find({ username : {$ne : req.query.username}})
//     .then(
//       users => {
//         console.log("length : " + users.length);
//         res.statusCode = 200;
//         res.setHeader("Content-Type", "application/json");
//         res.json(users);
//       },
//       err => next(err)
//     )
//     .catch(err => next(err));
// });

router.post("/filtered", cors.corsWithOptions, (req, res, next) => {    
  //console.log("vodi " + JSON.stringify(req.body));
   User.findOne({username:"blacklist"}).then(
     list => {      
      let blacklist = list.blacklist.concat(req.body.username).concat(req.body.likelist);      
      console.log("blacklist " + blacklist);
      User.find({
        $and: [  
          { username : {$nin : blacklist }},
          { age: { $gte: req.body.ageL, $lte: req.body.ageS } },
          { fame: { $gte: req.body.fameL, $lte: req.body.fameS } }
        ]
      })
        .then(
          users => {        
            let tags = JSON.parse(req.body.tags);        
            let result = users.map(user => {
              let comtags = 0;
              tags.forEach(tag => {
                comtags = comtags + user.tags[tag];
              });          
              let distance = getDistance(
                req.body.gps.lat,
                req.body.gps.lng,
                user.gps.lat,
                user.gps.lng
              );          
              if (comtags >= req.body.comtags &&
                distance >= req.body.distanceL &&
                distance <= req.body.distanceS) {                            
                  user._doc.distance = Math.round(distance);
                  user._doc.comtags = comtags;
                  return user;
                }          
            });        
            result = result.sort((a, b) => (a._doc[req.body.sortby] > b._doc[req.body.sortby]) ? 1 : -1)        
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(result);
          },
          err => next(err)
        )
     }
   ).catch(err => next(err));
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
        User.find({
          username: { $in: req.body.like }
        }).then(user => {
        userList.like = user;
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(userList);
      });
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
        let newNoti = new Noti({ username: req.body.username }).save();
        //console.log("noti_id: " + newNoti._id);
        user.noti = newNoti._id;
        //newNoti.save();
        /* if (req.body.firstname) user.firstname = req.body.firstname;
        if (req.body.lastname) user.lastname = req.body.lastname;
        if (req.body.email) user.email = req.body.email; */
        user.save((err, user) => {
          if (err) {        
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
      gps: req.body.gps,
      biography: req.body.biography,
      tags: req.body.tags,
      dob: req.body.dob
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
  //console.log("/chatrooms req.body: " + req.body);
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
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      },
      err => next(err)
    )
    .catch(err => next(err));
});

const matchMake = (user1, user2) => {
  let newMessage = new Messages({ users: { [user1]: user2, [user2]: user1}, comments:[{date:new Date(), message:"This is the first message", unread:false}]});
  User.findOneAndUpdate(
    { username: user1 },
    { 
      $push: { connected: user2},      
    },
    { new: true }
  ).then(user => {
    user.chatrooms[user2] =  newMessage.id;
    newMessage.image[user2] = user.profile;    
    pushNoti(user.noti, user2, user1, "connected");    
    user.markModified("chatrooms");
    user.save();
  });
  User.findOneAndUpdate(
    { username: user2 },
    {
      $push: { connected: user1 }
    },
    { new: true }
  ).then(user => {
    user.chatrooms[user1] =  newMessage.id;     
    newMessage.image[user1] = user.profile;
    pushNoti(user.noti, user1, user2, "connected");
    newMessage.markModified("image");
    newMessage.save();
    user.markModified("chatrooms");
    user.save();
  });
  /* const matchMake = (user1, user2) => {
    let newMessage = new Messages({ users: { [user1]: user2, [user2]: user1}, comments:[{date:1, message:"This is the first message"}]});
    User.findOneAndUpdate(
      { username: user1 },
      { 
        $push: { connected: user2},
        $set: { chatrooms: { [user1]: newMessage.id } }
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
    }); */  
};
router.get("/add/dislike", cors.corsWithOptions, (req, res, next) => {
  let userId = req.query.user;
  let dislike = req.query.dislike
  console.log(JSON.stringify(req.query));
  User.findOneAndUpdate(
    { username: userId },
    { $pull: { like: dislike, connected: dislike} },
    { new: true});    
  User.findOneAndUpdate(
    { username: dislike },
    { $pull: { likedby: userId, connected: userId} },
    { new: true }
  )
  .then(user => {
    pushNoti(user.noti, userId, dislike, "dislike")
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(user);
  }).catch(err => next(err));
})
    
    


router.get("/add/blacklist", cors.corsWithOptions, (req, res, next) => {
  User.findOneAndUpdate(
    { username: "blacklist" },
    { $push: { blacklist: req.query.user } },
    { new: true }
  )
    .then(user => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(user.blacklist);
    })
    .catch(err => next(err));
});

router.post("/add/like", cors.corsWithOptions, (req, res, next) => {
  let user1 = req.body.user;
  let user2 = req.body.data;  
  User.findOneAndUpdate(
    { username: user2 },
    { $push: { likedby: user1 } },
    { new: true }
  )
    .then(user => {
      pushNoti(user.noti, user1, user2, "like");     
    })    
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
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(user);
    })
    .catch(err => next(err));
});

router.post("/add/profile", cors.corsWithOptions, (req, res, next) => {
  let user1 = req.body.user;
  let user2 = req.body.data;
  User.findOneAndUpdate(
    { username: user2,  checkedby: { $ne:user1}},
    { $push: { checkedby: user1 } },
    { new: true }
  )
    .then(user => {      
      if(user) {
        pushNoti(user.noti, user1, user2, "checked");
        user.fame = Math.round(
          (user.likedby.length / user.checkedby.length) * 100
        );
        user.save();
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json(user);
      } 
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({message:"Already checked profile before"});     
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
    } else if (!user.verified) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: false, status: "Need Email Verification", err: {"message":"Need Verification"}});
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
      User.findByIdAndUpdate(req.user._id, {$set : {is_login : true, last_login: new Date()}}, { new: true })
      .then(user => console.log(user.last_login));
      //console.log("authenticate " + JSON.stringify(authenticate));
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json({ success: true, status: "Login Successful!", token: token });
    });
  })(req, res, next);
});

router.get("/logout", cors.corsWithOptions, (req, res, next) => {
  User.findOneAndUpdate({username:req.query.username}, {$set : {is_login:false}}, {new:true})
  .then(user => {    
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json({ success: false, status: "Logout Successful!"});
  }).catch(err => next(err));
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
