import { velocityToGain } from './helpers';

enum EnvelopeParams {
  Attack = 'attack',
  Decay = 'decay',
  Sustain = 'sustain',
  Release = 'release',
}

export class Envelope {
  audioCtx: AudioContext;
  input: GainNode;
  output: GainNode;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  constructor(audioCtx: AudioContext) {
    this.audioCtx = audioCtx;
    this.input = this.audioCtx.createGain();
    this.output = this.input;
    this.output.gain.setValueAtTime(0, this.audioCtx.currentTime);
    this.attack = 0;
    this.decay = 127;
    this.sustain = 127;
    this.release = 0;
  }

  triggerOn(velocity: number): void {
    const gain = velocityToGain(velocity);
    const now = this.audioCtx.currentTime;
    const attackTime = now + this.attack / 127 * 5;
    const decayTime = attackTime + (this.decay / 127 * 5);
    const sustainLevel = (this.sustain / 127) * gain;
    this.output.gain.cancelScheduledValues(now);
    this.output.gain.setValueAtTime(0, now);
    this.output.gain.linearRampToValueAtTime(gain, attackTime);
    if (this.decay < 127) {
      this.input.gain.linearRampToValueAtTime(sustainLevel, decayTime);
    }
  }

  triggerOff(): void {
    this.output.gain.cancelScheduledValues(this.audioCtx.currentTime);
    const releaseTime = this.audioCtx.currentTime + ((this.release / 127) * 5); 
    this.output.gain.linearRampToValueAtTime(0, releaseTime);
  }

  changeParameter(parameter: string, value: number): void {
    switch(parameter) {
      case EnvelopeParams.Attack:
        this.attack = value;
        break;
      case EnvelopeParams.Decay:
        this.decay = value;
        break;
      case EnvelopeParams.Sustain:
        this.sustain = value;
        break;
      case EnvelopeParams.Release:
        this.release = value;
    }
  }
}
