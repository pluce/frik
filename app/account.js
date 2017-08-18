var extend = require('util')._extend

var Account = function(init){
	return extend({
		realm_id: null,
		account_id: null,
		holder_name: null,
		balance: 0.0
	},init)
}

module.exports = Account