const e = require("express");
var app = require("./app");

exports.joinRoom = (socket, io, info) => {
  if (app.nowRooms[info.index].hostName == info.hostName){
    socket.join(app.nowRooms[info.index].hostName);
    io.sockets.in(app.nowRooms[info.index].hostName).emit("welcome", info.playerId);
  }
};

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
        io.sockets.in(app.nowRooms[info.roomNum].hostName).emit("result", -1);
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