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

//  graphics for cursor and tails
var graphics = new PIXI.Graphics()
stage.addChild(graphics)

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
var kill_animation_lenght = 150  //  in frames, must be > 2
var init_text_vel = 2 //  initial velocity for text explosion
var text_fr = 0.97  //  text explosion friction
var pr_fr = 0.95  //  tweet friction
var pr_ac_mouse = 50  //  run from mouse force
var pr_ac_center = 0.1  //  run to center force
var pr_ac_random = 0.05  //  random motion force in % of velocity

//  physics containers
var pr_nb = 200  //  max tweets simultaneously in game
var max_pr_text = 140  //  max text lenght per tweet
var pr_tail_nb = 20  //  segmets nb for each tweet
var pr_tail_length = 3  //  length of each segment
var pr_ref = 0  //  id of next sprite to add
var pr = []  //  pixi sprite array
var pr_on = []
var pr_px = []
var pr_py = []
var pr_vx = []
var pr_vy = []
var pr_text = []
var pr_text_lenght = []
var pr_text_px = []
var pr_text_py = []
var pr_text_vx = []
var pr_text_vy = []
var pr_tail_px = []
var pr_tail_py = []
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
      //  add tweet
      pr_on[id] = 1
      pr_px[id] = Math.random() * sx
      pr_py[id] = Math.random() * sy
      pr_vx[id] = 0
      pr_vy[id] = 0
      pr_ref = id
      stage.addChild(pr[id])

      //  add tweet text
      var max_lenght = max_pr_text
      if (max_lenght > msg.lenght) {
        max_lenght = msg.lenght
      }
      pr_text_lenght[id] = max_lenght
      for (var j = 0; j < max_lenght; j++) {
        pr_text[id * max_pr_text + j] = new PIXI.Text(msg.charAt(j), tweet_text_style)
      }

      //  setup tail
      for (var k = 0; k < pr_tail_nb; k++) {
        var tail_id = id * pr_tail_nb + k
        pr_tail_px[tail_id] = pr_px[id] + 15.1 * k
        pr_tail_py[tail_id] = pr_py[id] + 15.1 * k
      }
      break
    }
  }
})

//  main game loop
animate()
function animate () {
  score_text.text = 'Score : ' + score
  graphics.clear()
  graphics.lineStyle(1, 0x000000)

  //  id and min_d for closest tweet to mouse
  var tw_id = 0
  var tw_min_d = Math.pow(sx * sy, 2)
  for (var i = 0; i < pr_nb; i++) {
    if (pr_on[i] === 1) {  //  test if tweet is active
      //  tweet physics
      var dx = pr_px[i] - mousePosition.x
      var dy = pr_py[i] - mousePosition.y
      var md = dx * dx + dy * dy  //  squared distance between mouse and tweet
      if (tw_min_d >= md) {
        tw_min_d = md
        tw_id = i
      }
      var d = pr_ac_mouse / md
      pr_vx[i] += dx * d
      pr_vy[i] += dy * d
      dx = sx / 2 - pr_px[i]
      dy = sy / 2 - pr_py[i]
      d = pr_ac_center / Math.sqrt(dx * dx + dy * dy)
      pr_vx[i] += dx * d
      pr_vy[i] += dy * d
      var f = Math.random() * Math.PI * 2
      var r = Math.random() * pr_ac_random
      pr_vx[i] += r * Math.sin(f)
      pr_vy[i] += r * Math.cos(f)
      pr_vx[i] *= pr_fr
      pr_vy[i] *= pr_fr
      pr_px[i] += pr_vx[i]
      pr_py[i] += pr_vy[i]
      if (pr_px[i] < 0) {
        pr_px[i] = 0
        pr_vx[i] *= -1
      }
      if (pr_px[i] >= sx) {
        pr_px[i] = sx - 1
        pr_vx[i] *= -1
      }
      if (pr_py[i] < 0) {
        pr_py[i] = 0
        pr_vy[i] *= -1
      }
      if (pr_py[i] >= sy) {
        pr_py[i] = sy - 1
        pr_vy[i] *= -1
      }
      // update sprites
      pr[i].position.x = pr_px[i]
      pr[i].position.y = pr_py[i]
      pr[i].rotation = Math.atan2(pr_vy[i], pr_vx[i]) + Math.PI * 0.5

      //  update and draw tails
      pr_tail_px[i * pr_tail_nb] = pr_px[i]
      pr_tail_py[i * pr_tail_nb] = pr_py[i]
      graphics.moveTo(pr_px[i], pr_py[i])
      for (var k = 1; k < pr_tail_nb; k++) {
        var tail_id = i * pr_tail_nb + k
        var tx = pr_tail_px[tail_id] - pr_tail_px[tail_id - 1]
        var ty = pr_tail_py[tail_id] - pr_tail_py[tail_id - 1]
        var td = pr_tail_length / Math.sqrt(tx * tx + ty * ty)
        pr_tail_px[tail_id] = pr_tail_px[tail_id - 1] + tx * td
        pr_tail_py[tail_id] = pr_tail_py[tail_id - 1] + ty * td
        graphics.lineTo(pr_tail_px[tail_id], pr_tail_py[tail_id])
      }

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
          var rad = Math.random() * init_text_vel * Math.sqrt(pr_vx[i] * pr_vx[i] + pr_vy[i] * pr_vy[i])
          pr_text_vx[text_id] = rad * Math.sin(fi)
          pr_text_vy[text_id] = rad * Math.cos(fi)
          stage.addChild(pr_text[text_id])
        }
        score += 1
      }
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
          pr_text[i * max_pr_text + m].destroy()
        }
      }
    }
  }

  //  draw custom cursor
  graphics.endFill()
  graphics.lineStyle(2, 0xff0000)
  graphics.moveTo(mousePosition.x, mousePosition.y)
  var hx = pr_px[tw_id] - mousePosition.x
  var hy = pr_py[tw_id] - mousePosition.y
  var hd = 20 / Math.sqrt(hx * hx + hy * hy)
  graphics.lineTo(mousePosition.x + hx * hd, mousePosition.y + hy * hd)
  graphics.endFill()
  graphics.lineStyle(0)
  graphics.beginFill(0xff0000, 1)
  graphics.drawCircle(mousePosition.x, mousePosition.y, 4)
  graphics.endFill()

  requestAnimationFrame(animate)
  renderer.render(stage)
}
