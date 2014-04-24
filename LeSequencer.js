;(function(root) { "use strict";
  var doc = root.document
    , win = root.window
    , Sequencer = root.Sequencer = (function() {
        var sequences = {}
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
          , duration = 0
          // some booleans
          , debug = false
          , isPlaying = false
          , beatFired = false
          , tickFired = false
          // some default options
          , options = { bpm: 60,  loop: false, debug: false, tpb: 16 }
          /*
            This is our World.
            The timeline must be aware of how many scenes are registered on it.
          */
          , timeline = (function() {
              var timelineArr = {}
                , references = {}
                , T = function(o) {
                  extend.call(this, o)

                  this.duration = 0
                }

            T.prototype.add = function addToTimeline(start, sID, loop) {
              var scene = sequences[sID]

              // if no sequences are registered at this start, create an empty array
              if (typeof timelineArr[start] == "undefined") {
                timelineArr[start] = []
              }
              
              // push to timeline
              if (typeof references[sID] == "undefined") {
                references[sID] = {}
              }

              // make a reference: this ID is located at this start
              references[sID][start] = timelineArr[start].push(sID) - 1

              // check for timeline duration
              if (this.duration - start < scene.duration) {
                this.duration = start + scene.duration
              }

              if (typeof loop == "number" && loop) {
                // recurse it. Only a thought, not sure about this yet.
                addToTimeline(start + scene.duration, scene, loop - 1)
              }
            }

            T.prototype.remove = function(start, sID) {
              var scene = sequences[sID]

              if (typeof scene != "undefined") {
                timelineArr[start].splice(references[sID][start], 1)
                
                if (typeof seqToPlay[sID] != "undefined") { // if the scene was already registered in seqToPlay
                  if (typeof scene.teardown == "function") {
                    scene.teardown(now, tick, beat, tickFired /*bang for tick */, beatFired /* bang for beat */)
                  }

                  delete seqToPlay[sID]
                }

                return true
              }
              
              return false
            }

            // scene is killed, then everything related to it in the timeline is dead... DEAD.
            T.prototype.kill = function(sID) {
              // check references map, 
              for (var k in references[sID]) if (references[sID].hasOwnProperty(k)) {
                this.remove(k, sID)
              }

              delete references[sID]
            }

            T.prototype.check = function(beat) {
              var scene = null

              // check if there's something register at index: beat
              if(typeof timelineArr[beat] != "undefined") {
                // loop on the array
                for(var i = timelineArr[beat].length; i--; ) {
                  // if not already added, add it
                  scene = sequences[timelineArr[beat][i]]
                  
                  if(!seqToPlay[scene.id]) {
                    // execute start method
                    if (typeof scene.init == "function") {
                      scene.init(now, tick, beat, tickFired /*bang for tick */, beatFired /* bang for beat */)
                    }

                    // add
                    seqToPlay[scene.id] = {
                      scene: scene,
                      end: beat + scene.duration,
                      start: beat
                    }
                  }
                }
              }

              // loop on seqToPlay
              for (var k in seqToPlay) if (seqToPlay.hasOwnProperty(k) && seqToPlay[k].end == beat) {
                if (typeof seqToPlay[k].scene.teardown == "function") {
                  seqToPlay[k].scene.teardown(now, tick, beat, tickFired /*bang for tick */, beatFired /* bang for beat */)
                }

                delete seqToPlay[k]
              }
            }

            return new T()
          }())
          /*
            A scene is only a bunch of functions:
              - init
              - play
              - teardown

            + duration.
            + loop: number (loop an amount of time)

            And it actually doesn't know more, only the Timeline does.
            The Timeline is almighty. 
            All glory to the Timeline.
          */
          , Scene = (function() {
              var sceneCount = 0
                , S = function Scene(o) {
                    if (!o.id) {
                      o.id = sceneCount++ // set an unique ID
                    }

                    extend.call(this, o)
                  }

              S.prototype.update = function(o) {
                extend.call(this, o)
              }

              return S
            }())
          /*
            A Sync is only a very simple iterator
          */
          , Sync = (function() {
              var S = function(o, values) {
                extend.call(this,o)
                this.values = values

                this.index = 0

                return this
              }

              S.prototype.execute = function(index, tpb) {
              	var sub = 1;

              	if (typeof this.sub != "undefined") {
                  sub = this.sub;
                }

                this.index = (index / sub) % tpb

                if (this.index%1 > 0) {
                  // abort
                  return
                }

                if (typeof this.arr[this.index] == "function") {
                  this.arr[this.index](this.values)
                }
              }

              return S
            }())

        function makeScene(o) {
          o.syncs = new Sync(o.syncs, o.values);
          return new Scene(o)
        }

        // the converter, converts ms into beats and ticks (with no fancy tricks, you can make a rap about it).
        function convert(time) {
          now = time - timeDiff

          // convert ms to ticks
          tick = (now / msPerTick)|0
          beat = (now / msPerBeat)|0

          // if new tick
          if (frame === 0 || tick != oldTick) {
            tickFired = true
            oldTick = tick
          }

          // if new beat
          if (frame === 0 || beat != oldBeat) {
            beatFired = true
            oldBeat = beat
          }
        }

        // some simple copy tool
        function copy(o) {
          return extend.call({}, o)
        }

        // le extend
        function extend(o) {
          for (var k in o) if(o.hasOwnProperty(k)) {
            this[k] = o[k]
          }

          return this
        }

        function init(o) {
          extend.call(options, o)

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
              debug.init()
            }
          }

          // calculate and store
          msPerBeat = (min / options.bpm)
          msPerTick = msPerBeat / options.tpb
          
          return this
        }

        function register(start, scene) {
          var newScene = null

          if(!(scene instanceof Scene)) {
            if(typeof scene.syncs != "undefined") {
              scene.syncs = new Sync(scene.syncs, scene.values)
            }

            newScene = new Scene(scene)
          } else {
            newScene = scene
          }

          // push to sequences collection
          sequences[newScene.id] = newScene
          
          timeline.add(start, newScene.id)

          // check if the sequence should be added into the seqToPlay map
          if (beat > 0 && beat >= start && beat < (start + newScene.duration)) {
            timeline.check(start)
          }

          return this
        }

        function unregister(sID) {
          timeline.kill(sID)

          delete sequences[sID]
          
          return this
        }

        function add(start, sID) {
          timeline.add(start, sID)

          return this
        }

        function remove(start, sID) {
          timeline.remove(start, sID)

          return this
        }

        function goTo(beat) {
          timeDiff = timeDiff + now - beat*msPerBeat

          return this
        }

        function rewind(to, actual) {
          goTo(to)
          convert(actual)

          // wash seqToPlay
          for (var k in sequences) if (sequences.hasOwnProperty(k)) {
            if(typeof seqToPlay[k] != "undefined") {
              if(typeof sequences[k].teardown == "function") {
                sequences[k].teardown(now, tick, beat, tickFired /*bang for tick */, beatFired /* bang for beat */)
              }
              
              delete seqToPlay[k]
            }
          }
        }

        function play(time) { // pl
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
              debug.behavior(frame - frameDiff, now)
            }
            
            frameDiff = frame
          }

          convert(time)
          
          // if loop is on and beat is superior|equal to the auto-calculated duration of timeline
          if (typeof options.loop == "boolean" && beat >= timeline.duration) {
            // go back to 0
            rewind(0, time)
          } else if (typeof options.loop == "object") {
            if(typeof options.loop.end == "number" && (beat >= options.loop.end || beat >= timeline.duration)) {
              // go back to 0
              rewind(options.loop.start || 0, time)
            }
          }

          // if new beat
          if(beatFired) {
            // check if there's a new sequence to add to the sequences to play (timeline takes care of it, just sit back and relax)
            timeline.check(beat)
          }

          // then an other for-loop for great glory
          for(var k in seqToPlay) {
            thisSeq = seqToPlay[k]

            if (tickFired && !!thisSeq.scene.syncs) {
              thisSeq.scene.syncs.execute(tick - (options.tpb*beat), options.tpb)
            }

            // execute sequence main functions
            thisSeq.scene.play(now, tick, beat, tickFired /*bang for tick */, beatFired /* bang for beat */)
          }

          // increase frame number - debug purposes only
          frame += 1

          return this
        }

        function getBeat() {
          return beat
        }

        function getTick() {
          return tick
        }

        return {
          init: init,
          makeScene: makeScene,
          register: register,
          unregister: unregister,
          add: add,
          remove: remove,
          goTo: goTo,
          play: play,

          // will have, again, to refactor the code.
          getBeat: getBeat,
          getTick: getTick
        }
    }())
}(this))