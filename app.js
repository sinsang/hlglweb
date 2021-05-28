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
var funcs = require("./funcs");

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
app.use(bodyParser.urlencoded({extended: false}));

// sessions
exports.nowUsers = [];
exports.nowRooms = [];
exports.roomIndex = [];
exports.nowPwds = [];

exports.MAX_ROOM = 5000;

for (var i = 0 ; i < this.MAX_ROOM; i++){
  this.nowRooms.push({});
  //this.nowPwds.push({});
  this.roomIndex.push(this.MAX_ROOM - i - 1);
}

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
const { ftruncateSync } = require('fs');
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

setInterval(() => {
  for (var i = 0; i < this.MAX_ROOM; i++){
    if (!funcs.isEmpty(this.nowRooms[i])){
      for (var j = 0; j < this.nowRooms[i].timeOutList.length; j++) {

        this.nowRooms[i].timeOutList[j].leftTime--;

        console.log(this.nowRooms[i].timeOutList[j].player + " 남은시간 : " + this.nowRooms[i].timeOutList[j].leftTime);

        if (this.nowRooms[i].timeOutList[j].leftTime <= 0){

          console.log(this.nowRooms[i].timeOutList[j].player + " 지움");

          this.nowRooms[i].deletePlayer(this.nowRooms[i].timeOutList[j].player);
          this.nowRooms[i].timeOutList.splice(j, 1);

          if (this.nowRooms[i].isGameSet()){
            app.io.sockets.in(i).emit("notice", this.nowRooms[i].gameSet());
          }
          app.io.sockets.in(i).emit("refresh", this.nowRooms[i].gameInfo);
          j--;
        }
      }
    }
  }
}, 1000);

module.exports = app;
