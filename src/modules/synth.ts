import { Oscillator } from './oscillator';
import { Envelope } from './envelope';
import { Filter } from './filter';
import { Lfo } from './lfo';

export interface SynthState {
  message: string,
  status: string,
  activeNotes: number[]
}

const defaultState: SynthState = {
  message: '',
  status: 'Waiting for midi',
  activeNotes: []
};

enum Destinations {
  Oscillator = 'oscillator',
  SubOscillator = 'subOscillator',
  Filter = 'filter',
  Envelope = 'envelope',
  Lfo = 'lfo',
}

export class Synthesizer {
  state: SynthState;
  audioCtx: AudioContext;
  oscillator: Oscillator;
  subOscillator: Oscillator;
  lfo: Lfo;
  filter: Filter;
  envelope: Envelope;
  midi?: WebMidi.MIDIAccess;
  activeNotes: Set<number>;
  
  constructor(state = defaultState, midiAccess: WebMidi.MIDIAccess) {
    this.state = state;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.envelope = new Envelope(this.audioCtx);
    this.oscillator = new Oscillator(this.audioCtx);
    this.subOscillator = new Oscillator(this.audioCtx, 'sine', 1);
    this.lfo = new Lfo(this.audioCtx, 'sine');
    this.filter = new Filter(this.audioCtx);
    

    this.oscillator.output.connect(this.filter.input);
    this.subOscillator.output.connect(this.filter.input);
    this.lfo.output.connect(this.oscillator.frequency)
    this.lfo.output.connect(this.subOscillator.frequency)
    this.filter.output.connect(this.envelope.input);
    this.envelope.output.connect(this.audioCtx.destination);

    this.activeNotes = new Set();
    this.state.activeNotes = Array.from(this.activeNotes);
    if (midiAccess) {
      this.midi = midiAccess;
      // this.midi.inputs.forEach(entry => entry.onmidimessage = this.onMIDIMessage.bind(this))
    }
  }

  bindMidi(inputId: string) {
    this.midi?.inputs.forEach(entry => {
      if (entry.id === inputId) {
        entry.onmidimessage = this.onMIDIMessage.bind(this);
      } else {
        entry.onmidimessage = () => null;
      }
    })
  }
  
  onMIDIMessage({ data }: WebMidi.MIDIMessageEvent) {
    const event = data[0];
    if (event != 254) {
      let str = 'Event: ' + event;
  
      if (event === 144) {
        const [,note, velocity] = data;
        str += ', Note: ' + note + ', Velocity: ' + velocity;
        if (velocity > 0) {
          this.noteOn(note, velocity)
        } else {
          this.noteOff(note)
        }
      }
      if (event === 128) {
        const [,note,] = data;
        this.noteOff(note)
      }
      this.state.message = str;
    }
  }

  noteOn(note: number, velocity?: number) {
    this.activeNotes.add(note);
    this.state.activeNotes = Array.from(this.activeNotes);
    this.oscillator.playNote(note);
    this.subOscillator.playNote(note);
  
    if (velocity) {
      this.envelope.triggerOn(velocity);
    }
  }
  
  noteOff(note: number) {
    this.activeNotes.delete(note);
    this.state.activeNotes = Array.from(this.activeNotes);
    if (this.activeNotes.size === 0) {
      this.envelope.triggerOff();
    } else {
      const highest = Math.max(...Array.from(this.activeNotes) as Array<number>);
      this.noteOn(highest);
    }
  }

  changeParameter(destination: string, parameter: string, value: number | BiquadFilterType | OscillatorType): void {
    switch (destination) {
      case Destinations.Filter:
        this.filter.changeParameter(parameter, value as number | BiquadFilterType);
        break;
      case Destinations.Oscillator:
        this.oscillator.changeParameter(parameter, value as number | OscillatorType);
        break;
      case Destinations.SubOscillator:
        this.subOscillator.changeParameter(parameter, value as number | OscillatorType);
        break;
      case Destinations.Envelope:
        this.envelope.changeParameter(parameter, value as number);
        break;
      case Destinations.Lfo:
        this.lfo.changeParameter(parameter, value as number);
        break;    
    }
  }
}
