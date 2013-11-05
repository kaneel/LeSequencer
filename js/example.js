;(function(root) {
  var doc = document
    , cv = doc.createElement("canvas")
    , div = doc.createElement("div")
    , ctx = cv.getContext("2d")
    , cW = 600
    , cH = 600
    , beatCount = 0
    , frame = 0
    , startTime
    , Sequencer = root.Sequencer
    , registers = doc.getElementsByClassName("register")
    , unregisters = doc.getElementsByClassName("unregister")
    , scenes = {
      "first": {
        duration: 6,
        id: "first",
        values: {
          marker: 0
        },
        init: function() {
          beatCount = 0
          frame = 0
        },
        play: function play1(now, tick, beat, tickFired, beatFired) {
          cv.height = cH

          if (beatFired) beatCount += 1
          if (!beat && beatFired) frame = 0
          if (beat%6 >= 5) {
            colors.apply(this, [now, beatFired, tickFired, "BLUE"])
          } else if (beat%6 >= 3) {
            colors.apply(this, [now, beatFired, tickFired, "GREEN"])
          } else {
            colors.apply(this, [now, beatFired, tickFired, "RED"])
          }

          frame += 1
        },
        teardown: function tear1() {
          cv.height = cH
        }
      },
      "counter": { // this counts the beats from beat 0 to beat 12
        duration: 12,
        id: "counter",
        init: function() {
          div.id = "counter"
          doc.getElementById("canvas-wrapper").appendChild(div)
        },
        play: function counter(now, tick, beat, tickFired, beatFired) {
          div.innerHTML = beat
        },
        teardown: function remove() {
          div.parentNode.removeChild(div)
        }
      },
      "silly": { // just a silly quick test
        duration: 6,
        values: {
          marker: 0
        },
        id: "silly",
        init: function() {
          beatCount = 0
          frame = 0
        },
        play: function play1(now, tick, beat, tickFired, beatFired) {
          cv.height = cH
          console.log("si")
          if (beatFired) beatCount += 1
          if (!beat && beatFired) frame = 0
          if (beat%6 >= 5) {
            colors.apply(this, [now, beatFired, tickFired, "NOGREEN"])

            ctx.fillStyle = "rgba(0, 0, 200, "+(0.8-(now-this.values.marker)/1000)+")"
            ctx.fillRect(0, 0, cW, cH) 
          } else if (beat%6 >= 3) {
            colors.apply(this, [now, beatFired, tickFired, "NORED"])
            ctx.fillStyle = "rgba(0, 200, 0, "+(0.8-(now-this.values.marker)/1000)+")"
            ctx.fillRect(0, 0, cW, cH) 
          } else {
            colors.apply(this, [now, beatFired, tickFired, "NOBLUE"])
            ctx.fillStyle = "rgba(200, 0, 0, "+(0.8-(now-this.values.marker)/1000)+")"
            ctx.fillRect(0, 0, cW, cH) 
          }

          frame += 1
        },
        teardown: function tear2() {
          console.log("oh")
          cv.height = cH
        }
      }
    }

  cv.id = "canvas"
  cv.width = cW
  cv.height = cH
  doc.getElementById("canvas-wrapper").appendChild(cv)

  Sequencer.init({bpm: 60, loop: true})
  
  for (i = registers.length; i--; ) {
    registers[i].addEventListener("click", function(e) {
      if (!!e.target.getAttribute("data-start")) {
        Sequencer.register(e.target.getAttribute("data-start"), scenes[e.target.getAttribute("data-id")])
      }
    })
  }

  for (i = unregisters.length; i--; ) {
    unregisters[i].addEventListener("click", function(e) {
      if (!!e.target.getAttribute("data-start")) {
        Sequencer.unregister(e.target.getAttribute("data-id"))
      }
    })
  }

  doc.getElementById("play").addEventListener("click", function() {
    startTime = +(new Date)
    Sequencer.play(0)
    requestAnimationFrame(main)
  })

  doc.getElementById("init60").addEventListener("click", function() {
    Sequencer.init({bpm: 60, loop: true})
  })

  doc.getElementById("init120").addEventListener("click", function() {
    Sequencer.init({bpm: 120, loop: true})
  })

  function main(t) {
    requestAnimationFrame(main)
    Sequencer.play(+(new Date) - startTime)
  }

  function colors(now, beatFired, tickFired, color) {
    if (color == "RED")
      ctx.fillStyle = "rgba(255,0,0,1)"
    if (color == "GREEN")
      ctx.fillStyle = "rgba(0,255,0,1)"
    if (color == "BLUE")
      ctx.fillStyle = "rgba(0,0,255,1)"
    
    ctx.fillRect(0, 0, cW, cH)

    if (beatFired) {
      this.values.marker = now
    }
      
    if (now < +(this.values.marker) + 800) {
      ctx.fillStyle = "rgba(255, 255, 255, "+(0.8-(now-this.values.marker)/1000)+")"
      ctx.fillRect(0, 0, cW, cH) 
    }

    ctx.font="300px Helvetica"
    ctx.fillStyle = "white"
    ctx.fillText(color, frame/5, 600 + frame/5)
  }
}(this))