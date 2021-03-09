const express = require("express");
const socket = require("socket.io");
const http = require("http");
const server = http.Server(app);

const app = express();
const io = socket(server);

const port = process.env.port;

app.use(express.static(__dirname + "/"));
app.set("views", "views");

app.get("/", function(req, res){
  res.send("HELLO PROJECT");
});

io.on("connection", function(socket){
  console.log(socket.id);
});

app.listen(port, function(){
  console.log("running..");
});