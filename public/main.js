var socket = io.connect('http://localhost:8080')

//  window size
var sx = window.innerWidth
var sy = window.innerWidth

//  pixi setup
var renderer = PIXI.autoDetectRenderer(sx, sy, {backgroundColor: 0xffffff})
document.body.appendChild(renderer.view)
var stage = new PIXI.Container()
var mousePosition = renderer.plugins.interaction.mouse.global

// onresize will dynamicly resize renderer
window.onresize = function (event) {
  sx = window.innerWidth
  sy = window.innerHeight
  renderer.view.style.width = sx + 'px'
  renderer.view.style.height = sy + 'px'
  renderer.resize(sx, sy)
}

//  texture loads
var arrow_texture = PIXI.Texture.fromImage('arrow.png')

//  setup for score displaying
var score_style = {
  font: '18px courier new',
  fill: '#000000'
}
var score_text = new PIXI.Text('0', score_style)
score_text.x = 10
score_text.y = 10
stage.addChild(score_text)

//  global game variables
var score = 0
var kill_min = Math.pow(10, 2)  //  min squared distance to kill tweet

//  physics containers
var pr_nb = 100  //  max tweets simultaneously in game
var pr_ref = 0  //  id of next sprite to add
var pr = []  //  pixi sprite array
var pr_on = []
var pr_px = []
var pr_py = []
//  init containers
for (var i = 0; i < pr_nb; i++) {
  pr_on[i] = 0
  pr[i] = new PIXI.Sprite(arrow_texture)
  pr[i].anchor.x = 0.5
  pr[i].anchor.y = 0.5
}

socket.on('stream', function (msg) {  //  execute following code on tweet recive
//  add tweet to game
  for (var i = 0; i < pr_nb; i++) {
    var id = (i + pr_ref) % pr_nb
    if (pr_on[id] === 0) {
      pr_on[id] = 1
      pr_px[id] = Math.random() * sx
      pr_py[id] = Math.random() * sy
      pr_ref = id
      stage.addChild(pr[id])
      break
    }
  }
})

// main game loop
animate()
function animate () {
  score_text.text = score

  for (var i = 0; i < pr_nb; i++) {
    if (pr_on[i] === 1) {  //  test if tweet is active
      //  squared distance between mouse and tweet
      var mdx = mousePosition.x - pr_px[i]
      var mdy = mousePosition.y - pr_py[i]
      var md = mdx * mdx + mdy * mdy

      //  remove tweet, add score, play killing animation
      if (md <= kill_min) {
        stage.removeChild(pr[i])
        pr_on[i] = 0
        score += 1
      }

      // update sprites
      pr[i].position.x = pr_px[i]
      pr[i].position.y = pr_py[i]
    }
  }
  requestAnimationFrame(animate)
  renderer.render(stage)
}
