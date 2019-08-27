const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var messageSchema = new Schema({
  users: {
    type: Object,
    required: true
    //unique: true
  },
  image: {
    type: Object,
    default: {}
  },
  unread: {
    type: String,
    default: ""
  },
  comments: {
    type: Array,
    default: [Object]
  }
});
var Messages = mongoose.model("Message", messageSchema);

module.exports = Messages;
