var app = require("../app");
var gameClass = require("../gameClass");
var express = require('express');
const { test } = require("../socketApp");
var router = express.Router();

function checkSession (session) {
  if (session == undefined) {
    console.log("유효하지 않은 세션의 요청");
    return false;
  }
  return true;
}
function checkToken (TOKEN, info) {

}
function isEmpty(param) {
  return Object.keys(param).length === 0;
}
function UUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/* GET home page. */
router.get("/login", (req, res, next) => {
  if (req.session.user){
    res.redirect("../game/list");
  }
  else{
    res.render("login");
  }
});

router.get("/list", (req, res) => {
  //console.log(req.session.user);
  if (req.session.user){
    res.render('list', {
      user : req.session.user,
      TOKEN : req.session.TOKEN,
      rooms : app.nowRooms
    });
  }
  else{
    res.redirect("../game/login");
  }
});

router.get("/play/:roomNum", (req, res, next) => {

  if (!checkSession(req.session.user) || isEmpty(app.nowRooms[req.params.roomNum])) {
    res.send("잘못된 접근입니다.");
  }
  else if (app.nowRooms[req.params.roomNum].players.indexOf(req.session.user.name) != -1){
    res.render("hlglGame", {
      roomNum : req.params.roomNum,
      hostName : app.nowRooms[req.params.roomNum].hostName,
      player : req.session.user,
      TOKEN : req.session.TOKEN
    });
  }
  else {
    res.send("잘못된 접근입니다.");
  }

});

/* POST */
router.post("/check", (req, res, next) => {

  var reqName = req.body.username;
  var newUser = {
    name : reqName,
    room : -1
  };

  for (var i = 0; i < app.nowUsers.length; i++){
    if (app.nowUsers[i].name == reqName){
      res.redirect("../game/login");
      return;
    }
  }
  
  app.nowUsers.push(newUser);
  req.session.user = newUser;
  req.session.TOKEN = UUID();
  
  res.redirect("../game/list");

});

router.post("/logout", (req, res, next) => {
  app.nowUsers.splice(app.nowUsers.indexOf(req.session.user), 1);
  delete req.session.user;
  res.redirect("../game/login");
});

router.post("/makeRoom", (req, res, next) => {

  if (!checkSession(req.session.user)) {
    res.send("잘못된 요청입니다.");
    return;
  }
  
  var newCard = {
    fruit : 1,
    num : 0 
  }

  // 클라이언트로 보낼 게임 정보
  var gameInfo = {
    nowState : 0, // 현재 게임 상태   0: 대기, 1: 플레이, 2: 일시정지(카드 분배 등), 3: 종료(결과창)
    nowTurn : 0,  // 현재 턴 
    players : [], // 현재 플레이어 
    time : 0,     // 남은 시간
  }

  // 서버에 남을 정보
  var newRoom = {
    id : 0,
    hostName : req.body.hostName,
    isLocked : false,
    isPlaying : false,        
    gameMode : 0,
    players : [],
    surfaceCardsSum : [0, 0, 0, 0],   // 내민 카드 중 표면들의 총 합
    holdOutDeck : [],               // 내밀어서 쌓인 카드들
    playerDeck : [],                // 플레이어에게 남은 카드
    MAX_PLAYER : 5,
    NOW_PLAYER : 0, 
    gameInfo : gameInfo  
  }

  /*
  var testRoom = {
    hostName : req.body.hostName,
    isLocked : false,
    gameMode : 0,
    players : [req.body.hostName],
    playersHand : [0],
    nowState : 0,
    MAX_PLAYER : 2
  }
  */

  var pwd = {
    hostName : req.body.hostName,
    pwd : req.body.password
  }

  if (pwd.pwd != ''){
    newRoom.isLocked = true;
  }

  var index = -1;
  for (var i = 0; i < app.MAX_ROOM; i++) {
    if (isEmpty(app.nowRooms[i])) {
      index = i;
      break;
    }
  }

  if (index > -1){
    app.nowRooms[index] = new gameClass.GAME(index, req.body.hostName);
    //app.nowRooms[index] = newRoom;
    app.nowPwds[index] = pwd;
    req.session.user.room = index;
    app.nowRooms[index].createNewPlayer(req.body.hostName);
    console.log(app.nowRooms[index]);
    res.redirect("../game/play/" + index);
  }
  else {
    res.send("방을 생성할 수 없습니다.");
  }

});

router.post("/enterRoom", (req, res, next) => {

  if (!checkSession(req.session.user) || isEmpty(app.nowRooms[req.params.roomNum])) {
    res.send("잘못된 접근입니다.");
    return;
  }

  var index = req.body.index;
  var gameId = req.body.gameId;
  var pwd = req.body.pwd;
  var playerId = req.body.playerId;

  //console.log(pwd, app.nowPwds[index].pwd);
  if (app.nowRooms[index].hostName == gameId && app.nowPwds[index].hostName == gameId){
    if (app.nowRooms[index].isPlaying){
      res.send({result : false});
      return;
    }
    else if (!app.nowRooms[index].isLocked || app.nowPwds[index].pwd === pwd) {
      app.nowRooms[index].createNewPlayer(playerId);
      req.session.user.room = index;
      res.send({result : true});
      return;
    }
  }
  
  res.send({result : false});

});

module.exports = router;
