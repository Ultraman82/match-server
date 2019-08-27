const express = require("express");
const bodyParser = require("body-parser");
//const mongoose = require('mongoose');
const cors = require("./cors");
const Chat = require("../models/messages");
const chatRouter = express.Router();

chatRouter.use(bodyParser.json());

pushChat = (chatId, from, message) => {
  Chat.findByIdAndUpdate(
    chatId,
    {
      $push: {
        comments: {
          date: new Date().getTime(),
          from: from,
          message: message,
          unread: true
        }
      }
    },
    { new: true }
  ).then(result => {
    chat.emit(chatId, `${from} ${message}`);
  });
};

chatRouter
  .route("/unread")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    Chat.find({
      _id: { $in: req.body.chatIds }
    }).then(chat => {
      let result = {};
      console.log(JSON.stringify(chat));
      chat.map(items => {
        result[items._id] = items.comments.filter(
          item => item.unread === true && item.from !== req.body.user
        ).length;
      });
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.json(result);
    });
  }) //unread to read
  .put(cors.corsWithOptions, (req, res, next) => {
    console.log(req.body.date);
    Noti.findOneAndUpdate(
      { _id: req.params.notiId, "comments.date": req.body.date },
      { $set: { "comments.$.unread": false } },
      { new: true, multi: true }
    )
      .then(
        message => {
          console.log("message : " + message);
          //message.comments[parseInt(req.body.index)].unread = false;
          //message.save();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(message);
        },
        err => next(err)
      )
      .catch(err => next(err));
  });

chatRouter
  .route("/:chatId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Chat.findById(req.params.chatId)
      .then(
        messages => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(messages);
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    let date = new Date().getTime();
    console.log("check 1 connected", Object.keys(chat.connected));
    // To chat Room
    chat.emit(req.params.chatId, `${req.body.to},${date},${req.body.message}`);
    // To Header notice
    chatnoti.emit(
      req.body.to,
      `${req.params.chatId},${req.body.from},${req.body.message},${date}`
    );
    Chat.findByIdAndUpdate(
      req.params.chatId,
      {
        $push: {
          comments: {
            date: date,
            from: req.body.from,
            message: req.body.message,
            to: req.body.to,
            unread: true
          }
        },
        $set: { unread: req.body.to }
      },
      { new: true }
    )
      .then(
        resp => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .delete(cors.corsWithOptions, (req, res, next) => {
    Noti.remove({})
      .then(
        resp => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(resp);
        },
        err => next(err)
      )
      .catch(err => next(err));
  });
/* Chat.findById(req.params.chatId)
      .update(
        { "comments.to": req.query.from, "comments.unread": true },
        { $set: { "comments.$.unread": false } },
        { multi: true }
      ) */
/* Chat.findById(req.params.chatId)
      .then(
        chat => {
          let tmp = chat.comments.map(comment => {
            if (comment.unread && comment.to === req.query.from)
              comment.unread = false;
            return comment;
          });
          chat.comments = tmp;
          chat.save((err, messages) => {
            if (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.json({ err: err });
            }
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(messages);
          });
        },
        err => next(err)
      )
      .catch(err => next(err));
  }) */

module.exports = chatRouter;
