var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get("/list", (req, res) => {
  res.send("유야호~");
});

module.exports = router;
