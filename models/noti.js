const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var notificationSchema = new Schema({
    username: {
        type: String,
        unique: true
    },
    unread: {
        type: Boolean,
        required: false
    },        
    comments:{
        type: Array,
        default: []
    }
});
var Noti = mongoose.model('Noti', notificationSchema);

module.exports = Noti;