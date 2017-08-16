var format = require('util').format
var Account = require('./account.js')
var request = require('request')
var SlackAPI = function(bank){
	return {
		debug: function(req,res,next){
			console.log(" >> DEBUG ENDPOINT")
			console.log(" >> ",req.params)
			console.log(" >> ",req.body)
			console.log(" << DEBUG ENDPOINT")
			return next()
		},
		forbes: function(req,res,next){
			var e = req.body;
		    var team_id = e.team_id;
		    bank.top10(team_id)
		    .then(function(top){
		    	var attachs = new Array();
		    	for(var i = 0; i < top.length ; i++) {
		    		attachs.push({ text: format("%s - %s with %s fk",i+1,top[i].holder_name,top[i].balance) })
		    	}
		    	res.send({
						response_type: "ephemeral",
						text: "Top 10",
					    attachments: attachs
					})
		    })
		    .fail(function(reason){
		    	res.send(new Error(reason))
		    	return next()
		    })
		    .catch(function(error){
		    	res.send(new Error(error))
		    	return next()
		    })
		},
		bank: function(req,res,next){
			var e = req.body;

		    var team_id = e.team_id;
		    var user_id = e.user_id;
		    var user_name = e.user_name;

		    bank.loadAccount(new Account({realm_id: team_id, account_id: user_id, holder_name: user_name}))
		    .then(function(account){
		    	res.send({ text: format('Your bank account has %s fk.', account.balance) })
		    	return next()
		    })
		    .fail(function(reason){
		    	res.send(new Error(reason))
		    	return next()
		    })
		    .catch(function(error){
		    	res.send(new Error(error))
		    	return next()
		    })
		},
		pay: function(req,res,next){
			var e = req.body;

		    const msg_regex = /^([0-9]+) <@([A-Z0-9]+)\|(\w+)>(| .*)$/;

		    var cmd = e.text.match(msg_regex);
			
			if(cmd == null){
		    	res.send(new Error("Syntax error"))
		    	return next()
		    }

		    var team_id = e.team_id;
		    var giver_id = e.user_id;
		    var giver_name = e.user_name;
		    var amount = parseInt(cmd[1]);
		    if(amount == NaN || amount < 0) {
		    	res.send(new Error("Bad amount"))
		    	return next()
		    }
		    var receiver_id = cmd[2];
		    var receiver_name = cmd[3];

		    if (giver_id === receiver_id) {
		    	res.send({ response_type: "ephemeral", text: "Sorry. That didn't work... You cannot give fk to yourself."})
		    	return next()
		    }

		    var comment = null
		    if(cmd.length > 4){
		    	comment = cmd[4]
		    }

			var giver = null;
			var receiver = null;

			bank.loadAccount(new Account({realm_id: team_id, account_id: giver_id, holder_name: giver_name}))
			.then(function(resA){
				giver = resA;
				return bank.loadAccount(new Account({realm_id: team_id, account_id: receiver_id, holder_name: receiver_name}))
			})
			.then(function(resB){
				receiver = resB;
				return bank.transfer(giver,receiver,amount)
			})
			.then(function(result){
				//res.send({ response_type: "in_channel", text: format('%s gives %s fk to %s',giver_name,amount,receiver_name) })
				res.send(200)
				return request({
					uri: e.response_url,
					method: 'POST',
					json: true,
					body: {
						response_type: "in_channel",
						text: format('%s gives %s fk to %s',giver_name,amount,receiver_name),
					    attachments: [
					        {
					            "text": comment
					        }
					    ]
					}
				},function(result){
					console.log("Callback URL called successfully: "+result)
				})
				return next();
			})
		    .fail(function(reason){
				console.log("Payment failed: "+reason)
		    	res.send({ response_type: "ephemeral", text: "You don't have enough money for this."})
		    	return next()
		    })
		    .catch(function(error){
				console.log("Error: "+error)
		    	res.send(new Error(error))
		    	return next()
		    })
		}
	}
}

module.exports = SlackAPI
