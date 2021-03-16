const e = require("express");
var app = require("./app");

var checkPlayer = (info, socket) => {
  return info.playerId == socket.handshake.session.user.name;
}
var checkHost = (info) => {
  return app.nowRooms[info.index].hostName == info.hostName
}
var isHost = (info, socket) => {
  return checkPlayer(info, socket) && app.nowRooms[info.index].hostName == info.playerId;
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
function shuffle(sourceArray) {
  for (var i = 0; i < sourceArray.length - 1; i++) {
      var j = i + Math.floor(Math.random() * (sourceArray.length - i));

      var temp = sourceArray[j];
      sourceArray[j] = sourceArray[i];
      sourceArray[i] = temp;
  }
  return sourceArray;
}
function isEmpty(param) {
  return Object.keys(param).length === 0;
}

// socket Fucntion
exports.joinRoom = (socket, io, info) => {
  if (isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (checkPlayer(info, socket) && checkHost(info)){
    socket.join(app.nowRooms[info.index].hostName);
    io.sockets.in(app.nowRooms[info.index].hostName).emit("refresh", app.nowRooms[info.index].gameInfo);
  }
  else {
    console.log("잘못된 접근 : " + socket.handshake.session);
  }
};

exports.hitBell = (socket, io, info) => {
  if (isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (checkPlayer(info, socket) && checkHost(info)){
    if (app.nowRooms[info.index].surfaceCardsSum.indexOf(5) != -1){
      io.sockets.in(app.nowRooms[info.index].hostName).emit("notice", info.playerId + "님이 이겼습니다.");
      io.sockets.in(app.nowRooms[info.index].hostName).emit("refresh", app.nowRooms[info.index].gameInfo);
    }
    else {
      io.sockets.in(app.nowRooms[info.index].hostName).emit("notice", info.playerId + "님이 잘못 종을 쳤습니다.");
      io.sockets.in(app.nowRooms[info.index].hostName).emit("refresh", app.nowRooms[info.index].gameInfo);
    }
  }
  else {
    console.log("잘못된 접근 : " + socket.handshake.session);
  }
};

exports.holdOutCard = (socket, io, info) => {
  if (isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (checkPlayer(info, socket) && checkHost(info)){
    var playerIndex = app.nowRooms[info.index].gameInfo.players.indexOf(info.playerId);
    if (app.nowRooms[info.index].gameInfo.nowTurn != playerIndex){
      socket.emit("notice", "현재 당신의 차례가 아닙니다.");
    }
    else if (app.nowRooms[info.index].playerDeck[playerIndex].length < 1){
      socket.emit("notice", "현재 당신의 덱이 비어있습니다.");
    }
    else {

      // 카드 내밀기
      console.log(app.nowRooms[info.index].playerDeck[playerIndex]);
      var getCard = app.nowRooms[info.index].playerDeck[playerIndex].pop();      
      app.nowRooms[info.index].holdOutDeck[playerIndex].push(getCard);

      app.nowRooms[info.index].surfaceCardsSum[app.nowRooms[info.index].gameInfo.playerSurfaceCard[playerIndex].fruit - 1] -= app.nowRooms[info.index].gameInfo.playerSurfaceCard[playerIndex].num
      app.nowRooms[info.index].gameInfo.playerSurfaceCard[playerIndex] = getCard;
      app.nowRooms[info.index].surfaceCardsSum[getCard.fruit - 1] += getCard.num;

      app.nowRooms[info.index].gameInfo.playerLeftCards[playerIndex]--;

      // 다음순서로 조정
      app.nowRooms[info.index].gameInfo.nowTurn++;
      app.nowRooms[info.index].gameInfo.nowTurn %= app.nowRooms[info.index].NOW_PLAYER; 

      // 클라이언트로 정보 전달
      io.sockets.in(app.nowRooms[info.index].hostName).emit("notice", info.playerId + "님이 카드를 냈습니다.");
      io.sockets.in(app.nowRooms[info.index].hostName).emit("refresh", app.nowRooms[info.index].gameInfo);
    
    }
  }
  else {
    console.log("잘못된 접근 : " + socket.handshake.session);
  }
};

exports.gameStart = (socket, io, info) => {
  if (isEmpty(app.nowRooms[info.index])){
    return;
  }
  if (isHost(info, socket)){
    var newDeck = createNewDeck();
    
    for (var i = 0; i < 10; i++) shuffle(newDeck);
    
    var cardPerPlayer = parseInt(newDeck.length / app.nowRooms[info.index].NOW_PLAYER);

    for (var i = 0; i < app.nowRooms[info.index].players.length; i++){
      for (var j = 0; j < cardPerPlayer; j++){
        app.nowRooms[info.index].playerDeck[i].push(newDeck.pop());
      }
      app.nowRooms[info.index].gameInfo.playerLeftCards[i] = app.nowRooms[info.index].playerDeck[i].length;
      app.nowRooms[info.index].gameInfo.nowTurn = 0;
    }

    app.nowRooms[info.index].isPlaying = true;

    io.sockets.in(app.nowRooms[info.index].hostName).emit("notice", "게임이 시작되었습니다.");

  }
  else {
    console.log("잘못된 접근 : " + socket.handshake.session);
  }

}

exports.gamePause = (socket, io, info) => {



}

exports.disconnect = (socket, io) => {

  var player = socket.handshake.session.user.name;
  var room = socket.handshake.session.user.room;
  var hostName = app.nowRooms[room].hostName;

  if (isEmpty(app.nowRooms[room])){
    return;
  }

  if (checkHost({index : room, hostName : hostName}) && app.nowRooms[room].players.indexOf(player) != -1) {
    var index = app.nowRooms[room].players.indexOf(player);
    console.log(player + "님이 " + hostName + "의 방에서 나감 ");
    
    app.nowRooms[room].players.splice(index, 1);
    app.nowRooms[room].holdOutDeck.splice(index, 1);
    app.nowRooms[room].playerDeck.splice(index, 1);
    
    app.nowRooms[room].gameInfo.players.splice(index, 1);
    app.nowRooms[room].gameInfo.playerSurfaceCard.splice(index, 1);
    app.nowRooms[room].gameInfo.playerLeftCards.splice(index, 1);

    app.nowRooms[room].NOW_PLAYER--;

    if (app.nowRooms[room].gameInfo.nowTurn == index){
      app.nowRooms[room].gameInfo.nowTurn++;
      app.nowRooms[room].gameInfo.nowTurn %= app.nowRooms[room].NOW_PLAYER;
    }

    if (isHost({index : room, playerId : player, hostName : hostName}, socket) && app.nowRooms[room].NOW_PLAYER > 0) {
      app.nowRooms[room].hostName = app.nowRooms[room].players[app.nowRooms[room].gameInfo.nowTurn];
      app.nowPwds[room].hostName = app.nowRooms[room].players[app.nowRooms[room].gameInfo.nowTurn];
    }

    socket.handshake.session.user.room = -1;

    if (app.nowRooms[room].NOW_PLAYER < 1){
      app.nowRooms[room] = {};
    }
    else {
      io.sockets.in(hostName).emit("refresh", app.nowRooms[room].gameInfo);
    }

  }

}

exports.getRoom = (socket, io, info) => {
  console.log("야호");
  io.sockets.in(info.hostName).emit("getRoomInfo", app.nowRooms[info.index]);
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
