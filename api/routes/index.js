var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/uiconfig', function(req, res, next) {
  res.send({
    domain: 'mydemotenant.eu.auth0.com',
    clientId: '89eVpU4Ixox4Llx6j7466L7pnK9lO4A8',
  });
});

module.exports = router;
