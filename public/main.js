var socket = io.connect('http://localhost:8080')

var renderer = PIXI.autoDetectRenderer(400, 400, {backgroundColor: 0xffffff})
document.body.appendChild(renderer.view)
var stage = new PIXI.Container()
var arrow_texture = PIXI.Texture.fromImage('arrow.png')

socket.on('stream', function (msg) {  //  execute following code on tweet recive
  var temp = new PIXI.Sprite(arrow_texture)
  temp.anchor.x = 0.5
  temp.anchor.y = 0.5
  temp.position.x = Math.random() * 400
  temp.position.y = Math.random() * 400
  stage.addChild(temp)
})

animate()
function animate () {
  requestAnimationFrame(animate)
  renderer.render(stage)
}
