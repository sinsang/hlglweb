const e = require("express");
var app = require("./app");
var funcs = require("./funcs");

// socket Fucntion
exports.joinRoom = (socket, io, info) => {
  
  if (!funcs.checkSession(socket.handshake.session.user)){
    return;
  }
  if (!funcs.checkInfo(info)){
    return;
  }
  if (!funcs.checkToken(socket, info.TOKEN)) {
    return;
  }
  if (funcs.isEmpty(app.nowRooms[info.index])){
    return;
  }

  if (funcs.checkPlayer(info, socket) && funcs.checkHost(app, info)){
    socket.join(info.index);
    io.sockets.in(info.index).emit("refresh", app.nowRooms[info.index].gameInfo);
  }
  else {
    console.log("잘못된 접근 : " + socket.handshake.session);
  }

};

exports.hitBell = (socket, io, info) => {

  if (!funcs.checkSession(socket.handshake.session.user)){
    return;
  }
  if (!funcs.checkInfo(info)){
    return;
  }
  if (!funcs.checkToken(socket, info.TOKEN)) {
    return;
  }
  if (funcs.isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (funcs.checkPlayer(info, socket) && funcs.checkHost(app, info)){

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
  
  if (!funcs.checkSession(socket.handshake.session.user)){
    return;
  }
  if (!funcs.checkInfo(info)){
    return;
  }
  if (!funcs.checkToken(socket, info.TOKEN)) {
    return;
  }
  if (funcs.isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (funcs.checkPlayer(info, socket) && funcs.checkHost(app, info)){
    
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

  if (!funcs.checkSession(socket.handshake.session.user)){
    return;
  }
  if (!funcs.checkInfo(info)){
    return;
  }
  if (!funcs.checkToken(socket, info.TOKEN)) {
    return;
  }
  if (funcs.isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (funcs.isHost(app, info, socket)){
    
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

exports.disconnect = (socket, io) => {

  if (!funcs.checkSession(socket.handshake.session.user)){
    return;
  }

  var player = socket.handshake.session.user.name;
  var room = socket.handshake.session.user.room;
  var hostName = app.nowRooms[room].hostName;

  var time = 10 * 1000;   // 재접속 가능 시간 

  if (funcs.isEmpty(app.nowRooms[room])){
    return;
  }

  if (funcs.checkHost(app, {index : room, hostName : hostName}) && app.nowRooms[room].players.indexOf(player) != -1) {

    var index = app.nowRooms[room].players.indexOf(player);
    console.log(player + "님이 " + hostName + "의 방에서 나감 ");
    
    app.nowRooms[room].timeOutList.push(
      {
        player : player,
        leftTime : 10
        /*
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
            console.log("refresh 함");
          }
        }, time)
        */
      }
    );

  }

}

exports.getRoom = (socket, io, info) => {
  io.sockets.in(info.index).emit("getRoomInfo", app.nowRooms[info.index]);
}

exports.gameSet = (socket, io, info) => {
  app.nowRooms[info.index].gameSet();
}