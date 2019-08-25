const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/* var commentSchema = new Schema({
    from:  {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    unread:  {
        type: Boolean,
        default: true
    },
    comment:  {
        type: String,
        required: true
    }
},
{
    timestamps: true
    
}); */

var notificationSchema = new Schema({
  username: {
    type: String,
    unique: true
  },
  unread: {
    type: Boolean,
    required: true
  },
  comments: {
    type: Array,
    default: []
  }
});
var Noti = mongoose.model("Noti", notificationSchema);

module.exports = Noti;
