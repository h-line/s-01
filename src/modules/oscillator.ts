import { velocityToGain } from "./helpers";

enum OscillatorParams {
  Level = 'level',
  Type = 'type',
  Frequency = 'frequency'
}

export class Oscillator {
  oscillatorNode: OscillatorNode;
  output: GainNode;
  audioCtx: AudioContext;
  octave: number;
  frequency: AudioParam;
  
  constructor(audioCtx: AudioContext, type: OscillatorType = 'sawtooth', octave = 0) {
    this.audioCtx = audioCtx;
    this.oscillatorNode = audioCtx.createOscillator();
    this.oscillatorNode.type = type;
    this.oscillatorNode.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    this.oscillatorNode.start();
    this.output = audioCtx.createGain();
    this.output.gain.setValueAtTime(1, audioCtx.currentTime);
    this.octave = octave;
    this.oscillatorNode.connect(this.output)
    this.frequency = this.oscillatorNode.frequency;
  }

  noteToFrequency(note: number): number {
    const divider = this.octave !== 0 ? this.octave * 2 : 1;
    return (440 * Math.pow(2, (note - 69) / 12)) / divider;
  }

  playNote(note: number): void {
    const frequency = this.noteToFrequency(note);
    this.oscillatorNode.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
  }

  changeParameter(parameter: string, value: number | OscillatorType): void {
    switch (parameter) {
      case OscillatorParams.Level:
        const level = velocityToGain(value as number);
        this.output.gain.setValueAtTime(level, this.audioCtx.currentTime);
        break;
      case OscillatorParams.Type:
        this.oscillatorNode.type = value as OscillatorType;
        break;
      case OscillatorParams.Frequency:
        this.oscillatorNode.frequency.setValueAtTime(value as number, this.audioCtx.currentTime);
        break;
    }
  }
}