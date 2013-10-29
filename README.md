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

I didn't even google to see if anybody came up with the same idea; As a musician/music maker/composer/you-name-it, I came up with a pretty naive and straight-forward implementation of the concept that would actually make sense to me... hence the use of a BPL and TPB ("tick per beat"). 

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

### Register! 

```js
Sequencer.register(start, { // start is a number, the beat you start the sequence at
  duration: number, // the beat you stop playing the sequence at
  values: {}, // an object for passing values you can reference on this (not sure it's useful)
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
function main(t) {
  requestAnimationFrame(main)
  Sequencer.play(t)
}
```

### Final words

I started this (and almost ended it) during some my summer 2013 holidays.
I just had an idea while my daughter was sleeping and I thought I might eventually give it a try.
It's not perfect but it's working and it's begging for people to test and improve it (pretty please).

Big thanks to Nicolas Léveillé (aka [uucidl](https://github.com/uucidl)) for giving me some good tips about how to start coding a sequencer... I actually started the wrong way and didn't consider it should just be a converter at first.

Greets to [mog](https://github.com/mog) who actually found it worth sharing with others.