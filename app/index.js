
var Bank = require('./mongo_bank')(process.env.MONGO_ADDR || 'mongo',27017,'frik')

var Q = require('q')

var restify = require('restify')

var server = restify.createServer()
server.use(restify.plugins.bodyParser());
var SlackAPI = require('./api_slack.js')(Bank)
server.post('/slack-api/bank', SlackAPI.bank)
server.post('/slack-api/pay', SlackAPI.pay)
server.post('/slack-api/forbes', SlackAPI.forbes)
server.post('/slack-api/debug', SlackAPI.debug)

server.listen(3000, function() {
  console.log('%s listening at %s', server.name, server.url)
});