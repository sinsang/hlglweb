var app = require("../app");
var cors = require("cors");
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("합격")
});

router.get("/list", (req, res) => {
  res.render('list');
});

module.exports = router;
