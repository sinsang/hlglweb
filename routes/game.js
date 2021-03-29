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

  var pattern_spc = /[~!@#$%^&*()_+|<>?:{}]/; // 특수문자 테스트

  var reqName = req.body.userName;
  var newUser = {
    name : reqName,
    room : -1
  };

  if (req.session.user) {     // 이미 로그인 세션이 있는 경우
    res.send({ msg : "잘못된 요청입니다."});
    return;
  }

  if (reqName == "" || reqName == undefined || reqName == null) {   // 유효하지 않은 이름
    res.send({ msg : "유효하지 않은 닉네임입니다."});
    return;
  }

  if (pattern_spc.test(reqName)) {  // 특수문자가 포함된 이름
    res.send({ msg : "특수문자가 포함된 닉네임은 사용이 불가능 합니다."});
    return;
  }

  if (reqName.length > 12) {        // 12자리가 넘는 이름
    res.send({ msg : "12자리 이상의 닉네임은 사용이 불가능 합니다."});
    return;
  }

  for (var i = 0; i < app.nowUsers.length; i++){  // 중복처리
    if (app.nowUsers[i].name == reqName){
      res.send({ msg : "중복된 이름이 있습니다" });
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

  if (req.body.TOKEN != req.session.TOKEN) {
    res.send("유효하지 않은 세션입니다.");
    return;
  }

  var pwd = {
    hostName : req.body.hostName,
    pwd : req.body.password
  }

  console.log(pwd.pwd);

  var index = -1;
  for (var i = 0; i < app.MAX_ROOM; i++) {
    if (isEmpty(app.nowRooms[i])) {
      index = i;
      break;
    }
  }

  if (index > -1){
    app.nowRooms[index] = new gameClass.GAME(index, req.body.hostName);
    if (pwd.pwd != ''){
      app.nowRooms[index].isLocked = true;
    }
    app.nowPwds[index] = pwd;
    req.session.user.room = index;
    app.nowRooms[index].createNewPlayer(req.body.hostName);
    console.log("방 만들어짐");
    res.send({ index : index });
  }
  else {
    res.send("방을 생성할 수 없습니다.");
  }

});

router.post("/enterRoom", (req, res, next) => {

  if (!checkSession(req.session.user)) {
    res.send("잘못된 접근입니다.");
    return;
  }

  var index = req.body.index;
  var gameId = req.body.gameId;
  var pwd = req.body.pwd;
  var playerId = req.body.playerId;

  if (isEmpty(app.nowRooms[index])) {
    res.send("존재하지 않는 방입니다");
    return;
  }

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
