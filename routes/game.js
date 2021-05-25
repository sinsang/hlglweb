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

  if (!funcs.checkSession(req.session.user) || funcs.isEmpty(app.nowRooms[req.params.roomNum])) {
    res.send("잘못된 접근입니다.");
  }
  else if (app.nowRooms[req.params.roomNum].players.indexOf(req.session.user.name) != -1){

    console.log(req.session.user.name);
    for (var i = 0; i < app.nowRooms[req.params.roomNum].timeOutList.length; i++){
      if (app.nowRooms[req.params.roomNum].timeOutList[i].player == req.session.user.name) {
        console.log(app.nowRooms[req.params.roomNum].timeOutList[i].player);
        clearTimeout(app.nowRooms[req.params.roomNum].timeOutList[i].event);
        app.nowRooms[req.params.roomNum].timeOutList.splice(i, 1);
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
    res.send("잘못된 접근입니다.");
  }

});

/* POST */
router.post("/check", (req, res, next) => {

  var pattern_spc = /[~!@#$%^&*()_+|<>?:{}]/; // 특수문자 테스트

  var reqName = req.body.userName;
  var newUser = {
    name : reqName,
    room : -1
  };

  console.log(reqName, " 로그인 시도");

  if (req.session.user) {     // 이미 로그인 세션이 있는 경우
    res.send({ result : false, msg : "잘못된 요청입니다."});
    return;
  }

  if (reqName == "" || reqName == undefined || reqName == null) {   // 유효하지 않은 이름
    res.send({ result : false, msg : "유효하지 않은 닉네임입니다."});
    return;
  }

  if (pattern_spc.test(reqName)) {  // 특수문자가 포함된 이름
    res.send({ result : false, msg : "특수문자가 포함된 닉네임은 사용이 불가능 합니다."});
    return;
  }

  if (reqName.length > 12) {        // 12자리가 넘는 이름
    res.send({ result : false, msg : "12자리 이상의 닉네임은 사용이 불가능 합니다."});
    return;
  }

  for (var i = 0; i < app.nowUsers.length; i++){  // 중복처리
    if (app.nowUsers[i].name == reqName){
      res.send({ result : false, msg : "중복된 이름이 있습니다" });
      return;
    }
  }
  
  app.nowUsers.push(newUser);
  req.session.user = newUser;
  req.session.TOKEN = func.UUID();

  console.log(reqName, " 로그인 성공");
  
  res.send({ result : true, msg : "로그인 성공" });

});

router.post("/logout", (req, res, next) => {
  app.nowUsers.splice(app.nowUsers.indexOf(req.session.user), 1);
  delete req.session.user;
  res.redirect("../game/login");
});

router.post("/makeRoom", (req, res, next) => {

  if (!func.checkSession(req.session.user)) {
    console.log("요청 오류");
    res.send("잘못된 요청입니다.");
    return;
  }
  
  if (req.body.TOKEN != req.session.TOKEN) {
    console.log("세션 오류");
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

    console.log(req.body.hostName, " ", index, " ", app.nowRooms[index].pwd, " : maked");
    
    res.send({ index : index });
  }
  else {
    res.send("방을 생성할 수 없습니다.");
  }

});

router.post("/enterRoom", (req, res, next) => {

  if (!funcs.checkSession(req.session.user)) {
    res.send("잘못된 접근입니다.");
    return;
  }

  var index = req.body.index;
  var hostName = req.body.hostName;
  var pwd = req.body.pwd;
  var playerId = req.body.playerId;

  if (funcs.isEmpty(app.nowRooms[index])) {
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
    console.log("초기화함");
    req.session.user.room = -1;
    console.log(req.session);
    res.send(true);
  }
  else {
    console.log("잘못된 방 정보 초기화 발생");
    res.send(false);
  }
});

module.exports = router;
