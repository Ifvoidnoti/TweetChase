var config = require('./config.json')
var express = require('express')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)

app.get('/', function (req, res) {
  res.sendFile(config.path + 'index.html')
})

setInterval(function () {
  io.emit('stream', 'hi client')
}, 1000)

http.listen(8080)
