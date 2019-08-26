const express = require("express");
const bodyParser = require("body-parser");
//const mongoose = require('mongoose');
const cors = require("./cors");
const Chat = require("../models/messages");
const chatRouter = express.Router();

chatRouter.use(bodyParser.json());

pushChat = (chatId, from, message) => {
  let chat = io.of("chat");
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

chatRouter.post("/unread", cors.corsWithOptions, (req, res, next) => {
  Chat.find({
    _id: { $in: ["5d631978341b2763d7fb6130", "5d631978341b2763d7fb6131"] }
  }).then(chat => {
    let result = {};
    chat.map(items => {
      result[items._id] = items.comments.filter(
        item => item.unread === true && item.from !== req.body.user
      ).length;
    });
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.json(result);
  });
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
  .post((req, res, next) => {
    //.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  })
  .put(cors.corsWithOptions, (req, res, next) => {
    let chat = io.of("chat");
    let date = new Date().getTime();
    chat.emit(req.params.chatId, `${req.body.to},${date},${req.body.message}`);
    Chat.findByIdAndUpdate(
      req.params.chatId,
      {
        $push: {
          comments: {
            date: date,
            from: req.body.from,
            message: req.body.message,
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
  .delete(
    cors.corsWithOptions,

    (req, res, next) => {
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
    }
  );

module.exports = chatRouter;
