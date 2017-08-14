# frik
A slack app to exchange virtual money

## Dependencies
Needs a Mongo database. Using docker, link name is "mongo" and port 27017.

## Install

* Deploy this somewhere accessible from outside. Docker will help a LOT, Dockerfile is provided and also build script for GKE / Kubernetes.
* Configure your Slack app commands to use it.

## Concepts
A "realm" is an abstraction for a team / world / organization.
An "account" is a wallet.
The "holder" is the owner of an account.

## API
These URL are answering to Slack commands

* `/slack-api/bank` returns user account status (command: `/bank`)
* `/slack-api/pay` transfers money from one to another (command: `/pay 100 @pluce`)
* `/slack-api/forbes` returns a Top 10 of the realm account (command: `/forbes`)

## Contributing
Feel free to file bugs or features. If you want to contribute, you can implement something and make a pull request.