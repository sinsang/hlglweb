var app = require("../app");
var gameClass = require("../gameClass");
var express = require('express');
const { test } = require("../socketApp");
var router = express.Router();

var createNewPlayer = (index, playerId) => {
  var newPlayer = {
    name : playerId,
    available : true,
    surfaceCard : {fruit : 1, num : 0},
    leftCards : 0
  };

  app.nowRooms[index].players.push(playerId);
  app.nowRooms[index].gameInfo.players.push(newPlayer);
  //app.nowRooms[index].gameInfo.playerAvailable.push(true);
  app.nowRooms[index].playerDeck.push([]);
  app.nowRooms[index].holdOutDeck.push([]);
  //app.nowRooms[index].gameInfo.playerSurfaceCard.push({fruit: 1, num: 0});
  //app.nowRooms[index].gameInfo.playerLeftCards.push(0);
  app.nowRooms[index].NOW_PLAYER++;
}

var createNewDeck = () => {
  var newDeck = [];
  for (var i = 1; i <= 4; i++){
    for (var j = 0; j < 5; j++) { newDeck.push({fruit: i, num: 1}); }
    for (var j = 0; j < 3; j++) { newDeck.push({fruit: i, num: 2}); }
    for (var j = 0; j < 3; j++) { newDeck.push({fruit: i, num: 3}); }
    for (var j = 0; j < 2; j++) { newDeck.push({fruit: i, num: 4}); }
    for (var j = 0; j < 1; j++) { newDeck.push({fruit: i, num: 5}); }
  }
  return newDeck;
}

function isEmpty(param) {
  return Object.keys(param).length === 0;
}

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
  //console.log(req.session.user);
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
    res.render("hlglGame", {
      roomNum : req.params.roomNum,
      hostName : app.nowRooms[req.params.roomNum].hostName,
      player : req.session.user
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
  
  res.redirect("../game/list");

});

router.post("/logout", (req, res, next) => {
  app.nowUsers.splice(app.nowUsers.indexOf(req.session.user), 1);
  delete req.session.user;
  res.redirect("../game/login");
});

router.post("/makeRoom", (req, res, next) => {
  
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

router.post("/exitRoom", (req, res, next) => {
  
  var index = req.body.index;
  var gameId = req.body.gameId;
  var playerId = req.body.playerId;

  //player가 host일 때

  //player가 혼자 남았을 때

});

module.exports = router;
