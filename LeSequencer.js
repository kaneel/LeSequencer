;(function(root) { "use strict";
  var doc = root.document
    , win = root.window
    , Sequencer = root.Sequencer = (function() {
        var timeline = {}
          , sequences = {}
          , seqToPlay = {}
          , thisSeq = null
          // some numbers
          , frame = 0
          , now = 0
          , timeDiff = 0
          , timeForFrames = 0
          , frameDiff = 0
          , sec = 1000
          , min = sec*60
          , msPerBeat = 0
          , msPerTick = 0
          , tick = 0
          , beat = 0
          , oldTick = 0
          , oldBeat = 0
          , numSeq = 0
          , duration = 0
          // some booleans
          , debug = false
          , isPlaying = false
          , beatFired = false
          , tickFired = false
          // some default options
          , options = {
              bpm: 60,
              loop: false,
              debug: false,
              tpb: 16
            }
          // some important object
          , Sync = (function() {
              var S = function(o, values) {
                var self = this

                for (var k in o) { // copy object
                  self[k] = o[k]
                }

                self.values = values

                self.index = 0

                return self
              }

              S.prototype.execute = function(index) {
                var self = this

                if (self.sub) {
                  index = index / self.sub
                  // stop exec if float (fast hack yet...)
                  if (index.toString().split(".").length > 1) return S
                }
                    
                if (self.arr[index]) {
                  self.arr[index](self.values)
                }
              }

              return S
            }())

        // the converter, converts ms into beats and ticks (make a rap about it).
        function calculate(t) {
          now = t - timeDiff
          
          // convert ms to ticks
          tick = (now / msPerTick)|0
          beat = (now / msPerBeat)|0
          
          // if new tick
          if (!frame || tick != oldTick) {
            tickFired = true
            oldTick = tick
          }

          // if new beat
          if (!frame || beat != oldBeat) {
            beatFired = true
            oldBeat = beat
          }
        }

        // some simple copy tool
        function copy(o) {
          var nO = {}

          for (var k in o) {
            nO[k] = o[k]
          }

          return nO
        }

        function init(o) {
          for (var k in o) if (o.hasOwnProperty(k)) {
            options[k] = o[k]
          }

          // debug mode
          if (typeof o.debug != "undefined") {
            debug = true
            
            if (typeof o.debug == "boolean") {
              options.debug = {}
              options.debug.container = doc.createElement("div")
              options.debug.fps = doc.createElement("span")
              options.debug.now = doc.createElement("span")

              var fps = doc.createElement("div")
                , now = doc.createElement("div")

              fps.id = "fps"
              now.id = "timer"
              
              fps.innerHTML = "fps: "
              now.innerHTML = "timer: "

              fps.appendChild(options.debug.fps)
              now.appendChild(options.debug.now)

              options.debug.container.appendChild(fps)
              options.debug.container.appendChild(now)

              doc.body.appendChild(options.debug.container)

              fps = null
              now = null
            } else if (typeof o.debug == "object") {
              debug.init();
            }
          }

          msPerBeat = (min / options.bpm)
          msPerTick = msPerBeat / options.tpb
          
          return this
        }

        function register(id,o) {
          if(!!o.syncs) {
            o.syncs = new Sync(o.syncs, o.values)
          }

          if (!id) {
            o.id = numSeq++ // set an unique ID
          } else {
            o.id = id
          }
          
          if (duration < o.start + o.duration) {
            duration = o.start + o.duration
          }

          // if no sequences are registered at this start, create an empty array
          if (!timeline[o.start]) {
            timeline[o.start] = []
          }

          // push to sequences collection
          sequences[o.id] = o

          // push to timeline
          timeline[o.start][o.id] = o

          // check if the sequence should be added into the seqToPlay map
          if (beat && beat >= o.start && beat < o.start + o.duration  && !seqToPlay[o.id]) {
            add(o)
          }

          // oh wow this bit is so, so, wrong.
          if (!!o.loop) {
            // update the object loop number
            o.loop = +o.loop - 1
            // register the same object (minus 1 on loop property) by making a copy
            register(s + o.duration, copy(o))
          }

          return this
        }

        function unregister(id) {
          // tear down. 
          if (typeof sequences[id].teardown == "function") {
            sequences[id].teardown()
          }
          // mass delete
          sequences[id] = null // delete the sequence from the sequences map            
          seqToPlay[id] = null // delete the sequence from the seqToPlay map too, cargo-cult is strong
          
          // cargo-cult is stronger than strong
          delete sequences[id]
          delete seqToPlay[id]

          for (var k in timeline) if (timeline.hasOwnProperty(k) && !!timeline[k][id]) {
            timeline[k][id] = null
            delete timeline[k][id]
          }

          return this
        }

        function remove(id) {
          // tear down. 
          if (typeof sequences[id].teardown == "function") {
            sequences[id].teardown()
          }

          // only remove from the sequences to play
          seqToPlay[id] = null
          // blabla
          delete seqToPlay[id]

          return this
        }

        function add(seq) {
           // execute start method
            if (typeof seq.init == "function") {
              seq.init()
            }

            // add
            seqToPlay[seq.id] = seq
        }

        function goTo(beat) {
          timeDiff = timeDiff + now - beat*msPerBeat

          return this
        }

        function play(t) { // pl
          isPlaying = true
          tickFired = false // set back to false
          beatFired = false // set back to false
          
          // debugger 
          if(debug && now > timeForFrames + sec) {
            timeForFrames = now

            if(typeof options.debug.behavior == "undefined") {
              options.debug.fps.innerHTML = frame - frameDiff
              options.debug.now.innerHTML = now
            } else {
              debug.behavior(frame - frameDiff, now);
            }
            
            frameDiff = frame
          }

          calculate(t)
          
          // exp
          if (!!options.loop && !!options.loop.end && beat >= options.loop.end) {
            // change values
            goTo(options.loop.start || 0)
            calculate(t)
          } else if(typeof options.loop == "boolean" && beat >= duration) {
            goTo(0)
            calculate(t)
          }

          // check if there's a new sequence to add to the sequences to play
          if(beatFired && !!timeline[beat]) {
            // loop and add if not already added
            for(var k in timeline[beat]) if (timeline[beat].hasOwnProperty(k) && !seqToPlay[timeline[beat][k].id]) {
              add(timeline[beat][k])
            }
          }

          // then an other for-loop for great glory
          for(var k in seqToPlay) {
            thisSeq = seqToPlay[k]
            
            // if thisSeq is not null
            if (!!thisSeq) {
              if (beat < thisSeq.start + thisSeq.duration && beat >= thisSeq.start) {
                // throw syncs
                if (tickFired && thisSeq.syncs) thisSeq.syncs.execute(tick%options.tpb)
                // execute sequence main functions
                thisSeq.play(now, tick, beat, tickFired /*bang for tick */, beatFired /* bang for beat */)
              } else if (!!thisSeq) {
                remove(thisSeq.id);
              }
            }
          }

          // increase frame number - debug purposes only
          frame += 1

          return this
        }

        function stop() {
          isPlaying = false

          return this
        }

        return {
          init: init,
          register: register,
          unregister: unregister,
          remove: remove,
          add: add,
          goTo: goTo,
          play: play,
          stop: stop
        }
    }())
}(this))