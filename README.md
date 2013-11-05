# Le Sequencer

## TL;DR

A simple sequencer written in javascript.
As a sequencer, what it primarly does is to convert the current ms into ticks and beats.
You are allowed (even encouraged) to register sequences that goes from a beat to an other beat.

Basically, it's only a singleton you could use as:

  - a demo engine
  - a possible starting block for your own visually editable sequencer

The idea came to me when I was thinking about a way to make javascript demos where visuals and sounds are processed 
through the same engine, to provide a purely synchronized experience between both worlds (remove the "art" from what I've just said).

I didn't even google to see if anybody came up with the same idea; As a musician/music maker/composer/you-name-it, I came up with a pretty naive and straight-forward implementation of the concept that would actually make sense to me... hence the use of a BPM and TPB ("tick per beat"). 

I guess it could also be a good starting block for a simple soundtracker in the end.

## HOWTO

### Initialize it
```js
Sequencer.init(options);
```

Options are straight-forward so far.

```js
options = {
  debug : true|false, // will provide you a nice box for checking the current FPS and time, default is false
  bpm: number, // where the magic happens, what is your BPM of choice, default is 60
  tpb: number, // how much do you want to subdivide the BPM, default is 16
  loop: boolean|number // do you want the sequencer to loop? true actually sets it to 0-end, number is the beat you loop at default is false.
}
```

### Make a scene!

```js
var newScene = Sequencer.makeScene({
  start: number,  // start is a number, the beat you start the sequence at
  duration: number, // the beat you stop playing the sequence at
  values: {}, // an object for passing values you can reference on this (not sure it's useful)
  sync: [], // an array you fill with function and 
  init: function() {
    // a function that is executed when the sequence is initialized (when it starts playing)
  },
  teardown: function() {
    // a function that is executed when the sequence is removed (when it's done doing its job)
  },
  play: function(now, tick, beat, tickFired, beatFired) {
    /*
        that's where you do the magic cooking
        
        Arguments: 
          - now: time in ms
          - tick: time in tick
          - beat: time in beat
          - tickFire: boolean acting as a bang for "new tick"
          - beatFired: boolean acting as a bang for "new beat"
    */
  }
})
```

### Register! 

There's two ways to register a scene.

#### With an already created scene.

```js
Sequencer.register(start, newScene)
```

#### Pass an object

Passing a simple object is possible if you have no interests in doing "weird" things and you just want to register your scene without updating them later.

```js
Sequencer.register(start, {
  start: number,  // start is a number, the beat you start the sequence at
  duration: number, // the beat you stop playing the sequence at
  values: {}, // an object for passing values you can reference on this (not sure it's useful)
  sync: [], // an array you fill with function and 
  init: function() {
    // a function that is executed when the sequence is initialized (when it starts playing)
  },
  teardown: function() {
    // a function that is executed when the sequence is removed (when it's done doing its job)
  },
  play: function(now, tick, beat, tickFired, beatFired) {
    /*
        that's where you do the magic cooking
        
        Arguments: 
          - now: time in ms
          - tick: time in tick
          - beat: time in beat
          - tickFire: boolean acting as a bang for "new tick"
          - beatFired: boolean acting as a bang for "new beat"
    */
  }
})
```

### PLAY IT! 

Because it's begging hard for being played. 

```js
startTime = +(new Date)
Sequencer.play(0)
requestAnimationFrame(main)

function main(t) {
  requestAnimationFrame(main)
  Sequencer.play(+(new Date) - startTime)
}
```

(The way you deal with your "startTime" value is actually yours :)

#### SYNCS

As you may have noticed, you can register an array of functions to play on every ticks, it's something you could easily do in the play handler of a sequence but I actually thought some person may want to externalize some bits of code. 
If you want to add a sequence of function to repetitively play, this is where you should register them.

Let say you set the TPB to 4 and you want to execute a sequence of 4 functions on every ticks.
```js
syncs: {
  arr: [func1, func2, func3, func4]
}
```
let say there's only three of them with a silence?
```js
syncs: {
  arr: [func1, func2, null, func3]
}
```
And let say you decided to set a TPB of 32 and want to subdivide?
```js
syncs: {
  arr: [func1, func2, func3, func4],
  sub: 4
}
```
Then the functions of the array will be executed like this:
-> 0: func1 
-> 8: func2
-> 16: func3
-> 24: func4

TODO/Possible improvements: 
Randomize?

### Misc.

While this sequencer was mainly built for making demos and synchronized animations, I realized some people may want to unregister and register scenes
while it's playing. It's now possible using Sequencer.unregister(sID) (wher sID is the id property of a scene)

#### Sequencer.init

Function takes an object as a parameter, will extend the default options of the sequencer.

#### Sequencer.makeScene

Didn't we cover that already? 

#### Sequencer.register

Ok, we've been through that already :)

#### Sequencer.unregister

Completely remove traces of the scene. 

```js
function unregister(sID)
```

#### Sequencer.add

Add a scene to the timeline. 

```js
function add(start, sID)
```

WARNING: The scene must be registered first.

#### Sequencer.remove

Remove a scene to the timeline. 

```js
function remove(start, sID)
```

WARNING: The scene must be registered first.

#### Sequencer.goTo

Pretty self-explanatory, right?

```js
function goTo(beat)
```

#### Sequencer.play

Play! Actually, it's just converting the passed ms value into beats and ticks and will find which scenes should be added to the playback

```js
function play(ms)
```

### Final words

I started this (and almost ended it) during my summer 2013 holidays.
I just had an idea while my daughter was sleeping and I thought I might eventually give it a try.
It's not perfect but it's working and it's begging for people to test and improve it (pretty please).

Big thanks to Nicolas Léveillé (aka [uucidl](https://github.com/uucidl)) for giving me some good tips about how to start coding a sequencer... I actually started the wrong way and didn't consider it should just be a converter at first.

Greets to [mog](https://github.com/mog) who actually found it worth sharing with others.