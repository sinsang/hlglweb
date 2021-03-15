var app = require("../app");
var express = require('express');
const { test } = require("../socketApp");
var router = express.Router();

var createNewPlayer = (index, playerId) => {
  app.nowRooms[index].players.push(playerId);
  app.nowRooms[index].gameInfo.players.push(playerId);
  app.nowRooms[index].gameInfo.playerSurfaceCard.push({fruit: -1, num: -1});
  app.nowRooms[index].gameInfo.playerLeftCards.push(0);
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
  
  var newCard = {
    fruit : 1,
    num : 0 
  }

  // 클라이언트로 보낼 게임 정보
  var gameInfo = {
    nowState : 0, // 현재 게임 상태
    nowTurn : 0,  // 현재 턴 
    players : [req.body.hostName], // 현재 플레이어 
    time : 0,               // 남은 시간
    playerSurfaceCard : [newCard], // 현재 플레이어가 내민 카드
    playerLeftCards : [0],   // 현재 플레이어의 남은 카드 수
  }

  // 서버에 남을 정보
  var newRoom = {
    id : 0,
    hostName : req.body.hostName,
    isLocked : false,
    state : 0,        
    gameMode : 0,
    players : [req.body.hostName],
    surfaceCardsSum : [0, 0, 0, 0],   // 내민 카드 중 표면들의 총 합
    holdOutDeck : [[]],               // 내밀어서 쌓인 카드들
    playerDeck : [[]],                // 플레이어에게 남은 카드
    MAX_PLAYER : 5,
    NOW_PLAYER : 1, 
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

  //app.nowRooms.push(testRoom);
  app.nowRooms.push(newRoom);
  app.nowPwds.push(pwd);
  res.redirect("../game/play/" + (app.nowRooms.length - 1));

});

router.post("/enterRoom", (req, res, next) => {

  var index = req.body.index;
  var gameId = req.body.gameId;
  var pwd = req.body.pwd;
  var playerId = req.body.playerId;

  //console.log(pwd, app.nowPwds[index].pwd);
  if (app.nowRooms[index].hostName == gameId && app.nowPwds[index].hostName == gameId){
    if (!app.nowRooms[index].isLocked || app.nowPwds[index].pwd === pwd){
      createNewPlayer(index, playerId);
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
