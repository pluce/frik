var format = require('util').format
var logger = require('./logger')

var Account = require('./account.js')

var Q = require('q')
var MongoClient = require('mongodb').MongoClient

var _account_key = function(realm_id, account_id){
	return format('acc-%s-%s',realm_id,account_id)
}

var Bank = function(mongo_host, mongo_port, mongo_db){
	
	var url = format("mongodb://%s:%s/%s", mongo_host, mongo_port, mongo_db)
	var client = MongoClient.connect(url).catch(function(err){
		logger.error("Cannot connect to Mongo, will exit.")
	})

	return {
		// Return a Promise for an account
		loadAccount: function(acc){
			var realm_id = acc.realm_id
			var account_id = acc.account_id
			var _self = this
			logger.debug("Loading account %s / %s",realm_id, account_id)
			var key = _account_key(realm_id,account_id)
			return Q.Promise(function(resolve,reject){
				client
				.then(function(db){
					return db.collection('accounts').findOne({_id: key})
				})
				.then(function(result) {
					if(result) {
						resolve(new Account(result))
					} else {
						logger.debug("Does not exist, should be created")
						_self.createAccount(acc)
						.then(function(result){
							resolve(result)
						})
					}
				})
				.catch(reject)
			})
		},
		top10: function(realm_id){
			var _self = this
			logger.debug("Getting TOP 10 for realm %s",realm_id)
			return Q.Promise(function(resolve,reject){
				client
				.then(function(db){
					return db.collection('accounts').find({ realm_id: realm_id }).sort([['balance',-1]]).limit(10).toArray()
				})
				.then(resolve)
				.catch(reject)
			})
		},
		createAccount: function(acc){
			var realm_id = acc.realm_id
			var account_id = acc.account_id
			var _self = this
			logger.debug("Creating account %s / %s",realm_id, account_id)
			var default_balance = 1000
			var key = _account_key(realm_id,account_id)
			var acc_new = new Account({ realm_id: realm_id, account_id: account_id, holder_name: acc.holder_name, balance: acc.balance || default_balance})
			return Q.Promise(function(resolve,reject){
				client
				.then(function(db){

					return db.collection('accounts').updateOne(
						{_id: key},
						{
							"$setOnInsert": acc_new
						},
						{ upsert: true }
					)
				})
				.then(function(res){
					if( !res.result.upserted ) {
						logger.debug("Was inserted before me")
					}
					_self.loadAccount(acc_new).then(resolve).catch(reject)
				})
				.catch(reject)
				
			})
		},
		transfer: function(emitter,receiver,amount){
			var _self = this		
			logger.debug("Transfering %s fk from account %s / %s to account %s / %s",amount,emitter.realm_id,emitter.account_id,receiver.realm_id,receiver.account_id)
			return Q.Promise(function(resolve,reject){
				var emitKey = _account_key(emitter.realm_id,emitter.account_id)
				var recvKey = _account_key(receiver.realm_id,receiver.account_id)
				var _db
				client
				.then(function(db){
					_db = db
					return _db.collection('accounts').findOne({ _id: emitKey })
				})
				.then(function(emitterDoc){
					if(emitterDoc.balance >= amount) {
						return _db.collection('accounts').updateOne(
							{
								_id: emitKey,
								balance: emitterDoc.balance
							},
							{
								"$inc": { "balance": -amount }
							}
						)
					} else {
						reject("Not enough money")
					}
				})
				.then(function(res){
					if(res.result.nModified === 0){
						return _self.transfer(emitter,receiver,amount)
					} else {
						return _db.collection('accounts').updateOne(
							{
								_id: recvKey
							},
							{
								"$inc": { "balance": amount }
							}
						).then(function(res) {
							return res.result
						})
					}
				})
				.then(function(res){
					resolve(res)
				})
				.catch(reject)
			})		
		}
	}
}

module.exports = Bank