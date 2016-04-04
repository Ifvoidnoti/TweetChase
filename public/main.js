var socket = io.connect('http://localhost:8080')

socket.on('stream', function (msg) {  //  execute following code on tweet recive
  console.log(msg)
})
