enum FilterParam {
  Cutoff = 'cutoff',
  Resonance = 'resonance',
  Type = 'type'
}

export class Filter {
  audioCtx: AudioContext;
  input: BiquadFilterNode;
  output: BiquadFilterNode;
  cutoff: AudioParam;
  constructor(audioCtx: AudioContext) {
    this.audioCtx = audioCtx;
    this.input = this.audioCtx.createBiquadFilter();
    this.input.type = 'lowpass';
    this.input.frequency.setValueAtTime(20000, this.audioCtx.currentTime);
    this.input.Q.setValueAtTime(1, this.audioCtx.currentTime);
    this.output = this.input;
    this.cutoff = this.input.frequency;
  }
  
  changeParameter(parameter: string, value: number | BiquadFilterType): void {
    switch(parameter) {
      case FilterParam.Cutoff:
        this.input.frequency.setValueAtTime(value as number, this.audioCtx.currentTime);
        break;
      case FilterParam.Resonance:
        this.input.Q.setValueAtTime(value as number, this.audioCtx.currentTime)
        break;
      case FilterParam.Type:
        this.input.type = value as BiquadFilterType;
        break;
    }
  }
}