const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var messageSchema = new Schema({
    users: {
        type: Array,
        required: true,
        unique: true
    },
    unread: {
        type: String,
        required: false
    },        
    comments:{
        type: Array,
        default: []
    }
});
var Messages = mongoose.model('Message', messageSchema);

module.exports = Messages;