exports.checkPlayer = (info, socket) => {
    return info.playerId == socket.handshake.session.user.name;
}
exports.checkHost = (app, info) => {
    return app.nowRooms[info.index].hostName == info.hostName
}
exports.checkInfo = (info) => {
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

exports.isHost = (app, info, socket) => {
    return info.playerId == socket.handshake.session.user.name && app.nowRooms[info.index].hostName == info.playerId;
}
exports.isEmpty = (param) => {
    return Object.keys(param).length === 0;
}
exports.checkSession = (session) => {
    if (session == undefined) {
      console.log("유효하지 않은 세션의 요청");
      return false;
    }
    console.log("세션체크 완료");
    return true;
}
exports.checkToken = (socket, TOKEN) => {   // TOKEN을 통해 위조된 요청 감지
    return TOKEN == socket.handshake.session.TOKEN;
}

exports.UUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
exports.sessionGameCheck = (s) => {
    if (s.user.room != -1) {
      return true;
    }
    return false;
}