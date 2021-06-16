var app = require("../app");
var gameClass = require("../gameClass");
var express = require('express');
const { test } = require("../socketApp");
var router = express.Router();
var funcs = require("../funcs");


/* GET home page. */
router.get("/login", (req, res, next) => {
  if (funcs.checkSession(req.session.user)){
    if (funcs.sessionGameCheck(req.session)){
      //res.redirect("../game/play/" + req.session.user.room);
    }
    res.redirect("../game/list");
  }
  else{
    res.render("login");
  }
});

router.get("/list", (req, res) => {

  if (funcs.checkSession(req.session.user)){
    var rooms = []
    for (var i = 0; i < app.nowRooms.length; i++){
      if (!funcs.isEmpty(app.nowRooms[i])) {
        rooms.push(app.nowRooms[i].gameInfo);
      }
    }

    res.render('list', {
      user : req.session.user,
      TOKEN : req.session.TOKEN,
      rooms : rooms
    });
  }
  else{
    res.redirect("../game/login");
  }
});

router.get("/play/:roomNum", (req, res, next) => {
  const location = "GET /play";

  if (!funcs.checkSession(req.session.user) || funcs.isEmpty(app.nowRooms[req.params.roomNum])) {
    console.log(location + req.session.user + " 유효하지 않은 접근");
    res.send("잘못된 접근입니다.");
  }
  else if (app.nowRooms[req.params.roomNum].players.indexOf(req.session.user.name) != -1){

    for (var i = 0; i < app.nowRooms[req.params.roomNum].timeOutList.length; i++){
      if (app.nowRooms[req.params.roomNum].timeOutList[i].player == req.session.user.name) {
        //clearTimeout(app.nowRooms[req.params.roomNum].timeOutList[i].event);
        app.nowRooms[req.params.roomNum].timeOutList.splice(i, 1);
        console.log(location + "플레이어 " + req.session.user.name + " " + req.params.roomNum + "번 방 재입장");
        break;
      }
    }

    res.render("hlglGame", {
      roomNum : req.params.roomNum,
      hostName : app.nowRooms[req.params.roomNum].hostName,
      player : req.session.user,
      TOKEN : req.session.TOKEN
    });
  }
  else {
    console.log(location + req.session.user + " 임의로 " + req.params.roomNum + "번 방 접속 시도");
    res.send("잘못된 접근입니다.");
    res.redirect("../game/list");
  }

});

/* POST */
router.post("/check", (req, res, next) => {
  const location = "POST /check : ";

  var pattern_spc = /[~!@#$%^&*()_+|<>?:{}]/; // 특수문자 테스트

  var reqName = req.body.userName;
  var newUser = {
    name : reqName,
    room : -1
  };

  console.log(location + reqName, " 로그인 시도");

  if (req.session.user != undefined) {     // 이미 로그인 세션이 있는 경우
    res.send({ result : false, msg : "잘못된 요청입니다."});
    console.log(location + reqName + " 세션 존재로 로그인 실패");
    return;
  }

  if (reqName == "" || reqName == undefined || reqName == null) {   // 유효하지 않은 이름
    res.send({ result : false, msg : "유효하지 않은 닉네임입니다."});
    console.log(location + reqName + " 유효하지 않은 이름으로 로그인 실패");
    return;
  }

  if (pattern_spc.test(reqName)) {  // 특수문자가 포함된 이름
    res.send({ result : false, msg : "특수문자가 포함된 닉네임은 사용이 불가능 합니다."});
    console.log(location + reqName + " 특수문자로 로그인 실패");
    return;
  }

  if (reqName.length > 12) {        // 12자리가 넘는 이름
    res.send({ result : false, msg : "12자리 이상의 닉네임은 사용이 불가능 합니다."});
    console.log(location + reqName + " 12자리 이상으로 로그인 실패");
    return;
  }

  for (var i = 0; i < app.nowUsers.length; i++){  // 중복처리
    if (app.nowUsers[i].name == reqName){
      res.send({ result : false, msg : "중복된 이름이 있습니다" });
      console.log(location + reqName + " 중복된 이름으로 로그인 실패");
      return;
    }
  }
  
  app.nowUsers.push(newUser);
  req.session.user = newUser;
  req.session.TOKEN = funcs.UUID();

  console.log(location + reqName, " 로그인 성공");
  res.send({ result : true, msg : "로그인 성공" });

});

router.post("/logout", (req, res, next) => {
  app.nowUsers.splice(app.nowUsers.indexOf(req.session.user), 1);
  delete req.session.user;
  res.redirect("../game/login");
});

router.post("/makeRoom", (req, res, next) => {
  const location = "POST /makeRoom : ";
  if (!funcs.checkSession(req.session.user)) {
    console.log(location + "유효하지 않은 세션의 방 만들기 요청");
    res.send("유효하지 않은 세션입니다.");
    return;
  }
  
  if (req.body.TOKEN != req.session.TOKEN) {
    console.log(location + "변조된 토큰으로 방 만들기 요청");
    res.send("유효하지 않은 세션입니다.");
    return;
  }

  var index = app.roomIndex.pop();

  if (index != undefined){
    app.nowRooms[index] = new gameClass.GAME(index, req.body.hostName, req.body.password);
    
    if (app.nowRooms[index].pwd != ''){
      app.nowRooms[index].isLocked = true;
    }

    req.session.user.room = index;
    app.nowRooms[index].createNewPlayer(req.body.hostName);

    console.log(location + req.body.hostName + "가 " + index +  "번 방 개설");
    
    res.send({ index : index });
  }
  else {
    res.send("방을 생성할 수 없습니다.");
  }

});

router.post("/enterRoom", (req, res, next) => {
  const location = "POST /enterRoom : "

  if (!funcs.checkSession(req.session.user)) {
    console.log(location + "유효하지 않은 세션의 방 접근 시도")
    res.send("잘못된 접근입니다.");
    return;
  }

  var index = req.body.index;
  var hostName = req.body.hostName;
  var pwd = req.body.pwd;
  var playerId = req.body.playerId;

  if (funcs.isEmpty(app.nowRooms[index])) {
    console.log(location + playerId + " 존재하지 않는 방 접근");
    res.send("존재하지 않는 방입니다");
    return;
  }

  if (app.nowRooms[index].hostName == hostName){
    if (app.nowRooms[index].isPlaying){
      res.send({result : false});
      return;
    }
    else if (!app.nowRooms[index].isLocked || app.nowRooms[index].pwd == pwd) {
      if (app.nowRooms[index].players.indexOf(playerId) != -1){
        req.session.user.room = index;
        res.send({result : true});
        return;
      }
      app.nowRooms[index].createNewPlayer(playerId);
      req.session.user.room = index;
      res.send({result : true});
      return;
    }
  }
  
  res.send({result : false});

});

router.post("/clearRoomInUserInfo", (req, res, next) => {
  if (funcs.checkSession(req.session.user) && req.body.TOKEN == req.session.TOKEN){
    req.session.user.room = -1;
    console.log(req.session);
    res.send(true);
  }
  else {
    res.send(false);
  }
});

module.exports = router;
