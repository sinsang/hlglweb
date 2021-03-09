const http = require("http");
const express = require("express");

const app = express();

const port = process.env.port;

app.use(express.static(__dirname + "/"));
app.set("views", "views");

app.get("/", (req, res) => {
    res.send("안녕");
});

app.listen(port, () => {
    console.log("running at " + port);
});