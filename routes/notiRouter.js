const express = require("express");
const bodyParser = require("body-parser");
//const mongoose = require('mongoose');
const cors = require("./cors");
const Noti = require("../models/noti");
const User = require("../models/user");
const authenticate = require("../authenticate");
const messageRouter = express.Router();

messageRouter.use(bodyParser.json());

messageRouter
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Noti.find({})
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
    Noti.create(req.body)
      .then(
        message => {
          //console.log('ChatRoom Created ', message);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(message);
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .put(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("PUT operation not supported on /messages");
    }
  )
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
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

messageRouter
  .route("/:notiId")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, (req, res, next) => {
    Noti.findOne({ username: req.params.notiId })
      //.populate('comments.author')
      .then(
        message => {
          //message.comments = message.comments.sort((a, b) => (a.date < b.date) ? 1 : -1);
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(message);
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .post(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      res.statusCode = 403;
      res.end("POST operation not supported on /messages/" + req.params.notiId);
    }
  )
  .put(cors.corsWithOptions, (req, res, next) => {
    Noti.findOneAndUpdate(
      { _id: req.params.notiId, "comments.date": req.body.date },
      { $set: { "comments.$.unread": false } },
      { new: true }
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
  })
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Noti.findByIdAndRemove(req.params.notiId)
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

messageRouter
  .route("/:messageId/comments")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.cors, (req, res, next) => {
    Noti.findById(req.params.messageId)
      .then(
        message => {
          if (message != null) {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(message.comments);
          } else {
            err = new Error("Dish " + req.params.messageId + " not found");
            err.status = 404;
            return next(err);
          }
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  //.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
  .post((req, res, next) => {
    Noti.findById(req.params.messageId)
      .then(
        message => {
          if (message != null) {
            //req.body.author = req.username;
            //message.comments.push(req.body);
            req.body.time = new Date();
            message.comments = message.comments.concat([req.body]);
            message.unread = message.users[req.body.author];
            message.save().then(
              message => {
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.json(message);
              },
              err => next(err)
            );
          } else {
            err = new Error("Message " + req.params.messageId + " not found");
            err.status = 404;
            return next(err);
          }
        },
        err => next(err)
      )
      .catch(err => next(err));
  })
  .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end(
      "PUT operation not supported on /messages/" +
        req.params.messageId +
        "/comments"
    );
  })
  .delete(
    cors.corsWithOptions,
    authenticate.verifyUser,
    authenticate.verifyAdmin,
    (req, res, next) => {
      Noti.findById(req.params.messageId)
        .then(
          message => {
            if (message != null) {
              for (var i = message.comments.length - 1; i >= 0; i--) {
                message.comments.id(message.comments[i]._id).remove();
              }
              message.save().then(
                message => {
                  res.statusCode = 200;
                  res.setHeader("Content-Type", "application/json");
                  res.json(message);
                },
                err => next(err)
              );
            } else {
              err = new Error("Dish " + req.params.messageId + " not found");
              err.status = 404;
              return next(err);
            }
          },
          err => next(err)
        )
        .catch(err => next(err));
    }
  );

module.exports = messageRouter;
