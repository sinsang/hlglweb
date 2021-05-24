const e = require("express");
var app = require("./app");

var checkPlayer = (info, socket) => {
  return info.playerId == socket.handshake.session.user.name;
}
var checkHost = (info) => {
  return app.nowRooms[info.index].hostName == info.hostName
}
var checkInfo = (info) => {
  if (info.index == undefined || info.index == null || typeof info.index != "number") {
    return false;
  }
  if (info.hostName == undefined || info.hostName == null || typeof info.hostName != "string") {
    return false;
  }
  if (info.playerId == undefined || info.playerId == null || typeof info.playerId != "string") {
    return false;
  }
  if (info.TOKEN == undefined || info.TOKEN == null || typeof info.TOKEN != "string") {
    return false;
  }
  
  return true;
}
var isHost = (info, socket) => {
  return checkPlayer(info, socket) && app.nowRooms[info.index].hostName == info.playerId;
}
function isEmpty(param) {
  return Object.keys(param).length === 0;
}
function checkSession (session) {
  if (session == undefined) {
    console.log("유효하지 않은 세션의 요청");
    return false;
  }
  return true;
}
function checkToken (socket, TOKEN) {   // TOKEN을 통해 위조된 요청 감지
  return TOKEN == socket.handshake.session.TOKEN;
}

// socket Fucntion
exports.joinRoom = (socket, io, info) => {
  
  if (!checkSession(socket.handshake.session.user)){
    return;
  }
  if (!checkInfo(info)){
    return;
  }
  if (!checkToken(socket, info.TOKEN)) {
    return;
  }
  if (isEmpty(app.nowRooms[info.index])){
    return;
  }

  if (checkPlayer(info, socket) && checkHost(info)){
    socket.join(info.index);
    io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);
  }
  else {
    console.log("잘못된 접근 : " + socket.handshake.session);
  }

};

exports.hitBell = (socket, io, info) => {

  if (!checkSession(socket.handshake.session.user)){
    return;
  }
  if (!checkInfo(info)){
    return;
  }
  if (!checkToken(socket, info.TOKEN)) {
    return;
  }
  if (isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (checkPlayer(info, socket) && checkHost(info)){

    io.sockets.in(info.index).emit("ring"); // bell sound

    switch (app.nowRooms[info.index].hitBell(info.playerId)) {
      case 1: // 대기
        socket.emit("notice", "현재는 대기 중입니다.");
        return;
        
      case 2: // 승리
        io.sockets.in(info.index).emit("notice", info.playerId + "님이 이겼습니다. 카드를 가져가는 중..");
        io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);

        setTimeout(() => {  // 2초 후 재시작
          app.nowRooms[info.index].restart();
          io.sockets.in(info.index).emit("notice", "게임이 다시 시작되었습니다.");
          io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);
        }, 2000);
        break;
      
      case 3: // 벌칙
        io.sockets.in(info.index).emit("notice", info.playerId + "님이 잘못 종을 쳤습니다. 벌칙으로 카드를 나눠 주는 중..");
        io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);

        setTimeout(() => {  // 2초 후 재시작
          app.nowRooms[info.index].restart();
          io.sockets.in(info.index).emit("notice", "게임이 다시 시작되었습니다.");
          io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);
        }, 2000);
        break;
    }  

    if (app.nowRooms[info.index].isGameSet()){
      io.sockets.in(info.index).emit("notice", app.nowRooms[info.index].gameSet());
      io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);
    }
  }
  else {
    console.log("잘못된 접근 : " + socket.handshake.session);
  }
};

exports.holdOutCard = (socket, io, info) => {
  
  if (!checkSession(socket.handshake.session.user)){
    return;
  }
  if (!checkInfo(info)){
    return;
  }
  if (!checkToken(socket, info.TOKEN)) {
    return;
  }
  if (isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (checkPlayer(info, socket) && checkHost(info)){
    
    switch (app.nowRooms[info.index].holdOutCard(info.playerId)) {
        case 1: // 대기
          socket.emit("notice", "현재는 대기 중입니다.");
          return;
        case 2: // 잘못된 차례
          socket.emit("notice", "현재 당신의 차례가 아닙니다.");
          return;
        case 3: // 덱이 비어있음
          socket.emit("notice", "현재 당신의 덱이 비어있습니다.");
          return; 

        case 4: // 카드 소진
          io.sockets.in(info.index).emit("cardSound");  // card sound
          io.sockets.in(info.index).emit("notice", info.playerId + "님이 카드를 냈습니다.");
          io.sockets.in(info.index).emit("notice", info.playerId + "님이 카드를 모두 소진했습니다.");
          break;

        case 5: // 정상 처리
          io.sockets.in(info.index).emit("cardSound");  // card sound
          io.sockets.in(info.index).emit("notice", info.playerId + "님이 카드를 냈습니다.");  
          break;
      }

      io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);
      
      if (app.nowRooms[info.index].isGameSet()){
        io.sockets.in(info.index).emit("notice", app.nowRooms[info.index].gameSet());
        io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);
      }
  }
  else {
    console.log("잘못된 접근 : " + socket.handshake.session);
  }
};

exports.gameStart = (socket, io, info) => {

  if (!checkSession(socket.handshake.session.user)){
    return;
  }
  if (!checkInfo(info)){
    return;
  }
  if (!checkToken(socket, info.TOKEN)) {
    return;
  }
  if (isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (isHost(info, socket)){
    
    app.nowRooms[info.index].gameStart(300);
    io.sockets.in(info.index).emit("timeCount", app.nowRooms[info.index].time);
  
    io.sockets.in(info.index).emit("notice", "게임이 시작되었습니다.");
    io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);

    app.nowRooms[info.index].timeCount = setInterval(() => {
      if (app.nowRooms[info.index].time <= 0) {
        io.sockets.in(info.index).emit("notice", app.nowRooms[info.index].gameSet());
        io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);
        return;
      }
      app.nowRooms[info.index].time -= 1;
      io.sockets.in(info.index).emit("timeCount", app.nowRooms[info.index].time);
    }, 1000);

  }
  else {
    console.log("잘못된 접근 : " + socket.handshake.session);
  }

}

exports.gamePause = (socket, io, info) => {



}

exports.disconnect = (socket, io) => {

  if (!checkSession(socket.handshake.session.user)){
    return;
  }

  var player = socket.handshake.session.user.name;
  var room = socket.handshake.session.user.room;
  var hostName = app.nowRooms[room].hostName;

  var time = 10 * 1000;   // 재접속 가능 시간 

  if (isEmpty(app.nowRooms[room])){
    return;
  }

  if (checkHost({index : room, hostName : hostName}) && app.nowRooms[room].players.indexOf(player) != -1) {
    var index = app.nowRooms[room].players.indexOf(player);
    console.log(player + "님이 " + hostName + "의 방에서 나감 ");
    
    app.nowRooms[room].timeOutList.push(
      {
        player : player,
        event : setTimeout(() => {
          console.log(player + "나감");
          app.nowRooms[room].deletePlayer(player);

          socket.handshake.session.user.room = -1;

          if (app.nowRooms[room].NOW_PLAYER < 1){
            app.roomIndex.push(app.nowRooms[room].id);
            app.nowRooms[room] = {};
          }
          else {
            if (app.nowRooms[room].isGameSet()){
              io.sockets.in(room).emit("notice", app.nowRooms[room].gameSet());
            }
            console.log("갱신시킴");
            io.sockets.in(room).emit("refresh", app.nowRooms[room].gameInfo);
          }
      }, time)
    });

    console.log(app.nowRooms[room].timeOutList);

  }

}

exports.getRoom = (socket, io, info) => {
  io.sockets.in(info.index).emit("getRoomInfo", app.nowRooms[info.index]);
}

exports.gameSet = (socket, io, info) => {
  app.nowRooms[info.index].gameSet();
}

exports.pushHand = (socket, io, info) => {
  if (!app.nowRooms[info.roomNum]){
    socket.emit("error");
    return;
  }
  if (app.nowRooms[info.roomNum].players.indexOf(info.playerId) != -1){
    if (app.nowRooms[info.roomNum].players.length < 2){
      socket.emit("wait", "상대 플레이어가 없습니다. 기다려주세요.");
      return;
    }
    app.nowRooms[info.roomNum].playersHand[app.nowRooms[info.roomNum].players.indexOf(info.playerId)] = info.hand * 1;
    console.log(app.nowRooms[info.roomNum].playersHand);
    if (app.nowRooms[info.roomNum].playersHand[0] == 0 || app.nowRooms[info.roomNum].playersHand[1] == 0){
      socket.emit("wait", "상대 플레이어가 내기를 기다리는 중..");
    }
    else {
      var first = eval(app.nowRooms[info.roomNum].playersHand[0]);
      var second = eval(app.nowRooms[info.roomNum].playersHand[1]);

      if (first == second){
        io.sockets.in(info.roomNum).emit("result", -1);
        app.nowRooms[info.roomNum].playersHand = [0, 0];
        return;
      }
      winner = 0;
      switch(first){ // 가위 바위 보
        case 1:
          switch(second){
            case 2: winner = 1; break;
            case 3: winner = 0; break;
          }
          break;
        case 2:
          switch(second){
            case 1: winner = 0; break;
            case 3: winner = 1; break;
          }
          break;
        case 3:
          switch(second){
            case 1: winner = 1; break;
            case 2: winner = 0; break;
          }
          break;
      }
      var tmp = ["가위", "바위", "보"];
      io.sockets.in(app.nowRooms[info.roomNum].hostName).emit("result", { 
        first : [app.nowRooms[info.roomNum].players[0], tmp[first-1]], 
        second : [app.nowRooms[info.roomNum].players[1], tmp[second-1]], 
        winner : app.nowRooms[info.roomNum].players[winner]
      });
      app.nowRooms[info.roomNum].playersHand = [0, 0];
      
    }
  }
  else {
    socket.emit("error");
  }
};
