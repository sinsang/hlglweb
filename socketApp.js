// socket.io
exports.test = (socket) => {
  console.log("SOMEBODY HERE");
  socket.on("test", (a) => {
    console.log(a);
    socket.emit("testtest", a);
  });
}