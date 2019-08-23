var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var passportLocalMongoose = require("passport-local-mongoose");

var User = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  /* username: {
    type: String,
    validate: {
      validator: function(v, cb) {
        User.find({ username: v }, function(err, docs) {
          cb(docs.length == 0);
        });
      },
      message: "User already exists!"
    }
  }, */
  firstname: {
    type: String,
    required: true
  },
  lastname: {
    type: String,
    required: true
  },
  admin: {
    type: Boolean,
    default: false
  },
  gender: {
    type: String,
    default: ""
  },
  prefer: {
    type: String,
    default: ""
  },
  verified: {
    type: Boolean,
    default: false
  },
  tags: {
    type: Object,
    default: {
      tag1: false,
      tag2: false,
      tag3: false,
      tag4: false,
      tag5: false,
      tag6: false,
      tag7: false,
      tag8: false,
      tag9: false,
      tag10: false
    }
  },
  biography: {
    type: String,
    default: ""
  },
  gps: {
    type: Array,
    default: []
  },
  gallery: {
    type: Array,
    default: []
  },
  profile: {
    type: String,
    default: null
  },
  chatrooms: {
    type: Object,
    default: null
  },
  noti: {
    type: String,
    default: null
  },
  isLogged: {
    type: Boolean,
    default: false
  },
  connected: {
    type: Array,
    default: []
  },
  like: {
    type: Array,
    default: []
  },
  likedby: {
    type: Array,
    default: []
  },
  checkedby: {
    type: Array,
    default: []
  },
  blacklist: {
    type: Array,
    default: []
  },
  fame: {
    type: Number,
    default: 0
  },
  last_login: {
    type: Date,
    default: Date.now
  },
  is_login: {
    type: Date,
    default: Date.now
  }
});

User.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", User);
