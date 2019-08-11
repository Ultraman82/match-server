const express = require('express');
const bodyParser = require('body-parser');
//const mongoose = require('mongoose');
const cors = require('./cors');
const Messages = require('../models/messages');
const User = require('../models/user');
const authenticate = require('../authenticate');
const messageRouter = express.Router();

messageRouter.use(bodyParser.json());

const matchMake = (user1, user2) => {
    Messages.create({users:[user1, user2]})
    .then(chatRoom => {
        Users.findOne({username:user1})
        .then(user => {
            user.chatRoom.user2 = chatRoom;
            user.save();
        })
    })
}
messageRouter.route('/')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors, (req,res,next) => {
    Messages.find({})
    .then((messages) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(messages);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post((req, res, next) => {
//.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Messages.create(req.body)
    .then((message) => {
        //console.log('ChatRoom Created ', message);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(message);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /messages');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Messages.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});

messageRouter.route('/matchmade')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.post((req, res, next) => {        
    let user = req.body.users.split(',');    
    console.log(user);
    //Messages.create({users:[req.body.user1, req.body.user2]})
    req.body.users = user;
    Messages.create(req.body)
    /* .then(room => {
        console.log("room.id: " + room.id);
        const str = `chatRooms.${user[1]}`;
        User.findOneAndUpdate({username: user[0]}, { $set: { [str] : room.id, gender:"gay"  } }, {new:true}) */
        .then((room) => {    
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(room);
        }, (err) => next(err))
        .catch((err) => next(err));
        
    });


messageRouter.route('/:messageId')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get((req,res,next) => {
    Messages.findById(req.params.messageId)
    .populate('comments.author')
    .then((message) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(message);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /messages/'+ req.params.messageId);
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Messages.findByIdAndUpdate(req.params.messageId, {
        $set: req.body
    }, { new: true })
    .then((message) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(message);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Messages.findByIdAndRemove(req.params.messageId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

messageRouter.route('/:messageId/comments')
.options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
})
.get(cors.cors, (req,res,next) => {
    Messages.findById(req.params.messageId)
    .populate('comments.author')
    .then((message) => {
        if (message != null) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(message.comments);
        }
        else {
            err = new Error('Dish ' + req.params.messageId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
//.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
.post((req, res, next) => {
    Messages.findById(req.params.messageId)
    .then((message) => {
        if (message != null) {
            //req.body.author = req.username;
            //message.comments.push(req.body);
            req.body.time = new Date();
            message.comments = message.comments.concat([req.body])
            message.save()
            .then((message) => {
                Messages.findById(message._id)
                .populate('comments.author')
                .then((message) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(message);
                })            
            }, (err) => next(err));
        }
        else {
            err = new Error('Dish ' + req.params.messageId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /messages/'
        + req.params.messageId + '/comments');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    Messages.findById(req.params.messageId)
    .then((message) => {
        if (message != null) {
            for (var i = (message.comments.length -1); i >= 0; i--) {
                message.comments.id(message.comments[i]._id).remove();
            }
            message.save()
            .then((message) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(message);                
            }, (err) => next(err));
        }
        else {
            err = new Error('Dish ' + req.params.messageId + ' not found');
            err.status = 404;
            return next(err);
        }
    }, (err) => next(err))
    .catch((err) => next(err));    
});

module.exports = messageRouter;