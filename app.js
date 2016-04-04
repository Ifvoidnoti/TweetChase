var config = require('./config.json')  //  load config
var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var Twitter = require('node-tweet-stream')
var t = new Twitter(config.tw_auth)  //  twitter authentication

app.use(express.static('public'))  //  allows client acces files in public folder

app.get('/', function (req, res) {
  res.sendFile(config.path + 'index.html')
})

t.track(config.trackListe)

t.on('tweet', function (tweet) {
  io.emit('stream', tweet.text)  //  emits tweet to client
})

http.listen(8080)
