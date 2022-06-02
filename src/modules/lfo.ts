import { velocityToGain } from "./helpers";

enum LfoParams {
  Level = 'level',
  Frequency = 'frequency'
}

export class Lfo {
  oscillatorNode: OscillatorNode;
  output: GainNode;
  audioCtx: AudioContext;
  frequency: AudioParam;
  
  constructor(audioCtx: AudioContext, type: OscillatorType = 'sine') {
    this.audioCtx = audioCtx;
    this.oscillatorNode = audioCtx.createOscillator();
    this.oscillatorNode.type = type;
    this.oscillatorNode.frequency.setValueAtTime(3, this.audioCtx.currentTime);
    this.oscillatorNode.start();
    this.output = audioCtx.createGain();
    this.output.gain.setValueAtTime(0, audioCtx.currentTime);
    this.oscillatorNode.connect(this.output)
    this.frequency = this.oscillatorNode.frequency;
  }

  changeParameter(parameter: string, value: number | OscillatorType): void {
    switch (parameter) {
      case LfoParams.Level:
        this.output.gain.setValueAtTime(value as number, this.audioCtx.currentTime);
        break;
      case LfoParams.Frequency:
        this.oscillatorNode.frequency.setValueAtTime(value as number, this.audioCtx.currentTime);
        break;
    }
  }
}