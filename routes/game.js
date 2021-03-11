var app = require("../app");
var express = require('express');
const { test } = require("../socketApp");
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("합격")
});

router.get("/login", (req, res, next) => {
  if (req.session.user){
    res.redirect("../game/list");
  }
  else{
    res.render("login");
  }
});

router.get("/list", (req, res) => {
  console.log(req.session.user);
  if (req.session.user){
    res.render('list', {
      user : req.session.user,
      rooms : app.nowRooms
    });
  }
  else{
    res.redirect("../game/login");
  }
});

router.get("/play/:roomNum", (req, res, next) => {

  if (app.nowRooms[req.params.roomNum].players.indexOf(req.session.user.name) != -1){
    res.render("rkdnlqkdnlqh", {
      roomNum : req.params.roomNum,
      hostName : app.nowRooms[req.params.roomNum].hostName,
      player : req.session.user
    });
  }
  else {
    res.send("잘못된 접근입니다.");
  }

});

router.post("/check", (req, res, next) => {

  var reqName = req.body.username;
  var newUser = {name : reqName};

  for (var i = 0; i < app.nowUsers.length; i++){
    if (app.nowUsers[i].name == reqName){
      res.redirect("../game/login");
      return;
    }
  }
  
  app.nowUsers.push(newUser);
  req.session.user = newUser;
  
  res.redirect("../game/list");

});

router.post("/logout", (req, res, next) => {
  app.nowUsers.splice(app.nowUsers.indexOf(req.session.user), 1);
  delete req.session.user;
  res.redirect("../game/login");
});

router.post("/makeRoom", (req, res, next) => {
  
  var newRoom = {
    id : 0,
    hostName : req.body.hostName,
    isLocked : false,
    gameMode : 0,
    time : req.body.time,
    surfaceCardsSum : [0, 0, 0, 0],
    playerSurfaceCard : [],
    players : [],
    MAX_PLAYER : 5  
  }

  var testRoom = {
    hostName : req.body.hostName,
    isLocked : false,
    gameMode : 0,
    players : [],
    playersHand : [],
    nowState : 0,
    MAX_PLAYER : 2
  }

  var pwd = {
    hostName : req.body.hostName,
    pwd : req.body.password
  }

  if (pwd.pwd != ''){
    testRoom.isLocked = true;
  }
  testRoom.players.push(req.body.hostName);

  app.nowRooms.push(testRoom);
  app.nowPwds.push(pwd);
  res.redirect("../game/play/" + (app.nowRooms.length - 1));

});

router.post("/enterRoom", (req, res, next) => {

  var index = req.body.index;
  var gameId = req.body.gameId;
  var pwd = req.body.pwd;
  var playerId = req.body.playerId;

  console.log(pwd, app.nowPwds[index].pwd);
  if (app.nowRooms[index].hostName == gameId && app.nowPwds[index].hostName == gameId){
    if (!app.nowRooms[index].isLocked || app.nowPwds[index].pwd === pwd){
      app.nowRooms[index].players.push(playerId);
      app.nowRooms[index].playersHand.push(0);
      res.send({result : true});
      return;
    }
  }
  
  res.send({result : false});

});

module.exports = router;
