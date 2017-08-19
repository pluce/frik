var logger = require('./logger')
var Bank = require('./mongo_bank')(process.env.MONGO_ADDR || 'mongo',27017,'frik')

var Q = require('q')
var restify = require('restify')

var server = restify.createServer()
server.use(restify.plugins.bodyParser());

var SlackAPI = require('./api_slack.js')(Bank,process.env.SLACK_TOKEN)

server.post('/slack-api/bank', SlackAPI.verify, SlackAPI.bank)
server.post('/slack-api/pay', SlackAPI.verify, SlackAPI.pay)
server.post('/slack-api/forbes', SlackAPI.verify, SlackAPI.forbes)
server.post('/slack-api/debug', SlackAPI.debug)

server.listen(3000, function() {
  logger.info('%s listening at %s', server.name, server.url)
});