;(function(root) { "use strict";
  var doc = root.document
    , win = root.window
    , Sequencer = root.Sequencer = (function() {
        var frame = 0
          , now = 0
          , timeDiff = 0
          , timeForFrames = 0
          , frameDiff = 0
          , sequences = {}
          , seqToPlay = {}
          , thisSeq = null
          , beatFired = false
          , tickFired = false
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
          , options = {bpm: 60, loop: false, debug: false, tpb: 16}
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

        // simple copy tool
        function copy(o) {
          var nO = {}

          for (var k in o) {
            nO[k] = o[k]
          }

          return nO
        }

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

        return {
          init: function init(o) {
            // simple extend
            for (var k in o) {
              options[k] = o[k]
            }

            // debug mode
            if (options.debug) {
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
            }

            msPerBeat = (min / options.bpm)
            msPerTick = msPerBeat / options.tpb
            
            return this
          },
          register: function register(s,o) {
            if(!!o.syncs) {
              o.syncs = new Sync(o.syncs, o.values)
            }

            o.start = s
            o.id = numSeq++ // set an unique ID
            
            if (duration < s + o.duration) {
              duration = s + o.duration
            }

            // if no sequences are register at this start, create an empty array
            if (!sequences[s]) {
              sequences[s] = []
            }

            // push to array
            sequences[s].push(o)

            // if the sequence is looped
            if (!!o.loop) {
              // substract 1 - dunaskyet
              o.loop = +o.loop - 1
              // register the same object by making a copy
              register(s + o.duration, copy(o))
            }

            return this
          },
          goTo: function goTo(beat) {
            timeDiff = timeDiff + now - beat*msPerBeat
          },
          play: function play(t) { // pl
            tickFired = false // set back to false
            beatFired = false // set back to false
            
            // debugger 
            if(options.debug && now > timeForFrames + sec) {
              timeForFrames = now
              options.debug.fps.innerHTML = frame - frameDiff
              options.debug.now.innerHTML = now
              frameDiff = frame
            }

            calculate(t)

            // exp
            if (!!options.loop && !!options.loop.end && beat == options.loop.end) {
              // change values
              this.goTo(options.loop.start || 0)
              calculate(t)
            } else if(typeof options.loop == "boolean" && beat == duration) {
              this.goTo(0)
              calculate(t)
            }

            // check if there's a new sequence to add to the sequences to play
            if(beatFired && !!sequences[beat]) {
              // loop and add if not already added
              for(var seqs = sequences[beat], i = seqs.length; i--; ) if (!seqToPlay[seqs[i].id]) {
                // execute start method
                if (typeof seqs[i].init == "function") seqs[i].init()
                // add
                seqToPlay[seqs[i].id] = seqs[i]
              }
            }

            // then an other for loop for great glory
            for(var k in seqToPlay) {
              thisSeq = seqToPlay[k]
              
              // if thisSeq is not null
              if (!!thisSeq) {
                if (beat < thisSeq.start + thisSeq.duration && beat >= thisSeq.start) {
                  // throw syncs
                  if (tickFired && thisSeq.syncs) thisSeq.syncs.execute(tick%options.tpb)
                  // execute sequence main functions
                  thisSeq.play(now, tick, beat, tickFired /*bang for tick */, beatFired /* bang for beat */)
                } else {
                  // simple remove
                  if (typeof thisSeq.teardown == "function") thisSeq.teardown()
                  seqToPlay[k] = null
                }
              }
            }

            // increase frame number - debug purposes only
            frame += 1

            return this
          }
        }
    }())
}(this))