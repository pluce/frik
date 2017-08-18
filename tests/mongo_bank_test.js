var chai = require('chai')
var expect = chai.expect
var should = chai.should()

var MongoClient = require('mongodb').MongoClient
var util = require('util')
var Q = require("q")

var Account = require('../app/account.js')
var Bank = require('../app/mongo_bank.js')

var mongo_host = process.env.MONGO_ADDR || 'mongo'
var mongo_port = 27017
var mongo_db = 'frik_test'

var bank_builder = function(){
  return Bank(mongo_host,mongo_port,mongo_db)
}

var db;

describe('Mongo Bank', function() {
  
  beforeEach(function(done) {
    MongoClient.connect(util.format("mongodb://%s:%s/%s", mongo_host, mongo_port, mongo_db))
    .then(function(cdb){
      db = cdb
      return db.dropDatabase()
    })
    .then(function(l1,l2){
      done()
    })
    .catch(console.log)
  });

  describe('loadAccount', function(){
    it('should return your account balance when asked', function(done) {
      var bank = bank_builder();
      db.collection('accounts').insertOne({ "_id": "acc-123-456", "realm_id": 123, "account_id": 456, "holder_name": "hello", "balance": 50.0})
      .then(function(res){
        return bank.loadAccount(new Account({ "realm_id": 123, "account_id": 456}))
      })
      .then(function(result){
        should.exist(result)
        expect(result.balance).to.equal(50.0)
        done()
      })
      .catch(console.log)
    });

    it('should return a new account with 1000 fk balance when does not exists', function(done) {
      var bank = bank_builder();
      db.collection('accounts').find().toArray()
      .then(function(res){
        expect(res.length).to.equal(0)
        return bank.loadAccount(new Account({ "realm_id": 123, "account_id": 456}))
      })
      .then(function(result){
        should.exist(result)
        expect(result.balance).to.equal(1000.0)
        done()
      })
      .catch(console.log)
    });
  }); 

  describe('createAccount', function(){
    it('should return your account when it already exists', function(done) {
      var bank = bank_builder();
      db.collection('accounts').insertOne({ "_id": "acc-123-456", "realm_id": 123, "account_id": 456, "holder_name": "hello", "balance": 50.0})
      .then(function(res){
        return bank.createAccount(new Account({ "realm_id": 123, "account_id": 456}))
      })
      .then(function(result){
        should.exist(result)
        expect(result.balance).to.equal(50.0)
        done()
      })
      .catch(console.log)
    });

    it('should return a new account with 1000 fk balance when does not exists', function(done) {
      var bank = bank_builder();
      db.collection('accounts').find().toArray()
      .then(function(res){
        expect(res.length).to.equal(0)
        return bank.createAccount(new Account({ "realm_id": 123, "account_id": 456}))
      })
      .then(function(result){
        should.exist(result)
        expect(result.balance).to.equal(1000.0)
        done()
      })
      .catch(console.log)
    });

    it('should allow a new account with specific balance', function(done) {
      var bank = bank_builder();
      db.collection('accounts').find().toArray()
      .then(function(res){
        expect(res.length).to.equal(0)
        return bank.createAccount(new Account({ "realm_id": 123, "account_id": 456, "balance": 1000000}))
      })
      .then(function(result){
        should.exist(result)
        expect(result.balance).to.equal(1000000.0)
        done()
      })
      .catch(console.log)
    });
  }); 

  describe('top10 command', function(){
    it('should return empty array when no account', function(done) {
      var bank = bank_builder();
      bank.top10(123)
      .then(function(result){
        should.exist(result)
        expect(result.length).to.equal(0)
        done()
      })
      .catch(console.log)
    });

    it('should return correctly ordered list', function(done) {
      var bank = bank_builder();
      Q.all([
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 50, "balance": 750.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 60, "balance": 700.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 70, "balance": 650.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 10, "balance": 1000.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 20, "balance": 900.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 30, "balance": 850.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 40, "balance": 800.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 80, "balance": 600.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 90, "balance": 550.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 100, "balance": 500.0})),
        ])
      .then(function(){
        return bank.top10(123)
      })
      .then(function(result){
        should.exist(result)
        expect(result.length).to.equal(10)
        console.log(result)
        expect(result[0].account_id).to.equal(10)
        expect(result[2].account_id).to.equal(30)
        expect(result[9].account_id).to.equal(100)
        expect(result[9].balance).to.equal(500.0)
        done()
      })
      .catch(console.log)
    });

    it('should be limited to 10 without mixing with other realms', function(done) {
      var bank = bank_builder();
      Q.all([
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 50, "balance": 750.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 60, "balance": 700.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 70, "balance": 650.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 10, "balance": 1000.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 20, "balance": 900.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 30, "balance": 850.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 40, "balance": 800.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 80, "balance": 600.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 90, "balance": 550.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 100, "balance": 500.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 110, "balance": 450.0})),
          bank.createAccount(new Account({ "realm_id": 123, "account_id": 120, "balance": 400.0})),
          bank.createAccount(new Account({ "realm_id": 32, "account_id": 10, "balance": 100000.0})),
          bank.createAccount(new Account({ "realm_id": 32, "account_id": 20, "balance": 90000.0})),
        ])
      .then(function(){
        return bank.top10(123)
      })
      .then(function(result){
        should.exist(result)
        expect(result.length).to.equal(10)
        console.log(result)
        expect(result[0].account_id).to.equal(10)
        expect(result[2].account_id).to.equal(30)
        expect(result[9].account_id).to.equal(100)
        expect(result[9].balance).to.equal(500.0)
        done()
      })
      .catch(console.log)
    });
  }); 
});