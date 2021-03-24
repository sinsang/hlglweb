var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require("cors");
var bodyParser = require("body-parser");
var session = require("express-session");
var FileStore = require("session-file-store")(session);
var ios = require("express-socket.io-session");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var gameRouter = require("./routes/game");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'hamburgers-master')));
app.use(bodyParser.urlencoded({extended: false}));

// sessions
exports.nowUsers = [];
exports.nowRooms = [{}, {}, {}, {}, {}];
exports.nowPwds = [{}, {}, {}, {}, {}];

exports.MAX_ROOM = 5;

var fileStoreOption = {
  reapInterval : 600
}

var session = session({
  secret : "12312dajfj23rj2po4$#%@#",
  resave : false,
  saveUninitialized : true,
  store : new FileStore(fileStoreOption),
  //cookie : {maxAge : 60 * 30},
  //rolling : true
});
app.use(session);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/game", gameRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// socket.io
app.io = require("socket.io")();
var socketApp = require("./socketApp");
app.io.use(ios(session, { autoSave: true }));

app.io.on("connection", (socket) => {
  
  socket.on("joinRoom", (info) => {socketApp.joinRoom(socket, app.io, info)});
  socket.on("pushHand", (info) => {socketApp.pushHand(socket, app.io, info)});
  socket.on("hitBell", (info) => {socketApp.hitBell(socket, app.io, info)});
  socket.on("holdOutCard", (info) => {socketApp.holdOutCard(socket, app.io, info)});
  socket.on("gameStart", (info) => {socketApp.gameStart(socket, app.io, info)});
  socket.on("disconnect", () => {socketApp.disconnect(socket, app.io)});

  socket.on("getRoom", (info) => {socketApp.getRoom(socket, app.io, info)});
});

module.exports = app;
