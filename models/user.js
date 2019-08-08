var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');


var User = new Schema({
    firstname: {
      type: String,
        default: ''
    },
    lastname: {
      type: String,
        default: ''
    },    
    admin:   {
        type: Boolean,
        default: false
    },
     gender: {
      type: String,
        default: ''
    },
    prefer: {
      type: String,
        default: ''
    },
    email: {
      type: String,
        default: ''
    },
    verified:   {
      type: Boolean,
      default: false
  },
    tags:{
      type: Array,
      default: []
    },
    biography:{
      type:String,
      default:""
    },
    gps : {
      type: Array,
      default: []
    },
    gallery : {
      type: Array,
      default: []
    },
    profile : {
      type: String,
      default: null
    }
});

User.plugin(passportLocalMongoose)

module.exports = mongoose.model('User', User);