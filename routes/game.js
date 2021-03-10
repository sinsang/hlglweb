var app = require("../app");
var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("합격")
});

router.get("/login", (req, res, next) => {
  if (req.session.user){
    res.redirect("../game/list");
  }
  else{
    res.render("login");
  }
});

router.post("/check", (req, res, next) => {

  var reqName = req.body.username;
  var newUser = {name : reqName};

  for (var i = 0; i < app.nowUsers.length; i++){
    if (app.nowUsers[i].name == reqName){
      res.redirect("../game/login");
      return;
    }
  }
  
  app.nowUsers.push(newUser);
  console.log(req.session);
  req.session.user = reqName;

  console.log(app.nowUsers);
  
  res.redirect("../game/list");

});

router.post("/logout", (req, res, next) => {
  delete req.session.user;
  res.redirect("../game/login");
});

router.get("/list", (req, res) => {
  console.log(req.session.user);
  if (req.session.user){
    //console.log(req.session.user);
    res.render('list', {
      user : req.session.user
    });
  }
  else{
    res.redirect("../game/login");
  }
});

module.exports = router;
