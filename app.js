var express = require("express");
var path = require("path");
//var favicon = require('serve-favicon');
var logger = require("morgan");
//var cookieParser = require('cookie-parser');
var bodyParser = require("body-parser");
var session = require("express-session");
var FileStore = require("session-file-store")(session);
var passport = require("passport");
var config = require("./config");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var dishRouter = require("./routes/dishRouter");
var promoRouter = require("./routes/promoRouter");
var leaderRouter = require("./routes/leaderRouter");
var uploadRouter = require("./routes/uploadRouter");
var notiRouter = require("./routes/notiRouter");
var chatRouter = require("./routes/chatRouter");
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

//const Dishes = require('./models/dishes');

// Connection URL
const url = config.mongoUrl;
const connect = mongoose.connect(url, {
  useMongoClient: true
  /* other options */
});

connect.then(
  db => {
    console.log("Connected correctly to server");
  },
  err => {
    console.log(err);
  }
);

var app = express();

//server.listen(5000);

app.all("*", (req, res, next) => {
  if (req.secure) {
    return next();
  } else {
    res.redirect(
      307,
      "https://" + req.hostname + ":" + app.get("secPort") + req.url
    );
  }
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/dishes", dishRouter);
app.use("/promotions", promoRouter);
app.use("/leaders", leaderRouter);
app.use("/image", uploadRouter);
app.use("/noti", notiRouter);
app.use("/chat", chatRouter);

/* app.use(cookieParser('12345-67890-09876-54321')); */

/* app.use(session({
  name : 'session-id',
  secret: '123456-123456',
  saveUninitialized: false,
  resave: false,
  store: new FileStore()
})) */

/* function auth (req, res, next) {
    console.log(req.session);

  if(!req.user) {
      var err = new Error('You are not authenticated!');
      err.status = 403;
      return next(err);
  }
  else {
    next();
  }
}

app.use(auth); */

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
