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

//  tweet text style
var tweet_text_style = {
  font: '12px courier new',
  fill: '#000000'
}

//  global game variables
var score = 0
var kill_min = Math.pow(10, 2)  //  min squared distance to kill tweet
var kill_animation_lenght = 75  //  in frames, must be > 2
var init_text_vel = 30 //  initial velocity for text explosion
var text_fr = 0.95  //  text explosion friction

//  physics containers
var pr_nb = 100  //  max tweets simultaneously in game
var max_pr_text = 140  //  max text lenght per tweet
var pr_ref = 0  //  id of next sprite to add
var pr = []  //  pixi sprite array
var pr_on = []
var pr_px = []
var pr_py = []
var pr_text = []
var pr_text_lenght = []
var pr_text_px = []
var pr_text_py = []
var pr_text_vx = []
var pr_text_vy = []
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
      // add tweet
      pr_on[id] = 1
      pr_px[id] = Math.random() * sx
      pr_py[id] = Math.random() * sy
      pr_ref = id
      stage.addChild(pr[id])

      // add tweet text
      var max_lenght = max_pr_text
      if (max_lenght > msg.lenght) {
        max_lenght = msg.lenght
      }
      pr_text_lenght[id] = max_lenght
      for (var j = 0; j < max_lenght; j++) {
        pr_text[id * max_pr_text + j] = new PIXI.Text(msg.charAt(j), tweet_text_style)
      }
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

      //  remove tweet, add score
      if (md <= kill_min) {
        stage.removeChild(pr[i])
        //  setup text explosion animation, init physics
        pr_on[i] = kill_animation_lenght
        for (var j = 0; j < pr_text_lenght[i]; j++) {
          var text_id = i * max_pr_text + j
          pr_text_px[text_id] = pr_px[i]
          pr_text_py[text_id] = pr_py[i]
          var fi = Math.random() * Math.PI * 2
          var rad = Math.random() * init_text_vel
          pr_text_vx[text_id] = rad * Math.sin(fi)
          pr_text_vy[text_id] = rad * Math.cos(fi)
          stage.addChild(pr_text[text_id])
        }
        score += 1
      }

      // update sprites
      pr[i].position.x = pr_px[i]
      pr[i].position.y = pr_py[i]
    }
    if (pr_on[i] >= 2) {  //  test for kill animation
      for (var l = 0; l < pr_text_lenght[i]; l++) {
        //  text explosion physics
        var text_id2 = i * max_pr_text + l
        pr_text[text_id2].alpha *= text_fr
        pr_text_vx[text_id2] *= text_fr
        pr_text_vy[text_id2] *= text_fr
        pr_text_px[text_id2] += pr_text_vx[text_id2]
        pr_text_py[text_id2] += pr_text_vy[text_id2]
        if (pr_text_px[text_id2] < 0) {
          pr_text_px[text_id2] = 0
          pr_text_vx[text_id2] *= -1
        }
        if (pr_text_px[text_id2] >= sx) {
          pr_text_px[text_id2] = sx - 1
          pr_text_vx[text_id2] *= -1
        }
        if (pr_text_py[text_id2] < 0) {
          pr_text_py[text_id2] = 0
          pr_text_vy[text_id2] *= -1
        }
        if (pr_text_py[text_id2] >= sy) {
          pr_text_py[text_id2] = sy - 1
          pr_text_vy[text_id2] *= -1
        }
        // update sprites
        pr_text[text_id2].position.x = pr_text_px[text_id2]
        pr_text[text_id2].position.y = pr_text_py[text_id2]
      }
      pr_on[i]--
      if (pr_on[i] === 2) {  //  remove text sprites
        pr_on[i] = 0
        for (var m = 0; m < pr_text_lenght[i]; m++) {
          stage.removeChild(pr_text[i * max_pr_text + m])
        }
      }
    }
  }
  requestAnimationFrame(animate)
  renderer.render(stage)
}
