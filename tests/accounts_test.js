var chai = require('chai')
var expect = chai.expect
var Account = require('../app/account.js')

describe('Account', function() {
  it('new() should return a balance of 0 and null attribute', function() {
    var account = new Account();
    expect(account.balance).to.equal(0.0);
    expect(account.realm_id).to.equal(null);
    expect(account.account_id).to.equal(null);
    expect(account.holder_name).to.equal(null);
  });
});