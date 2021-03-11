var app = require("./app");

// socket.io
exports.test = (socket) => {
  
  socket.on("joinRoom", (info) => {
    if (app.nowRooms[info.index].hostName == info.hostName){
      socket.join(app.nowRooms[info.index].hostName);
      console.log("조인" + info.index + " " + app.nowRooms[info.index].hostName);
      console.log(socket.rooms);
    }
  });

  socket.on("test", (hostName) => {
    socket.in(hostName).emit("testtest", hostName);
  });
}