<script setup lang="ts">
  import { reactive, computed } from 'vue'
  import { WaveSine, WaveSquare, WaveSawTool, ArrowDown, ArrowUp, Settings } from '@vicons/tabler';

  import {
    Synthesizer, SynthState
  } from '../modules/synth';
  
  import { SelectOption } from 'naive-ui';
  
  const synthState: SynthState = reactive({
    message: '',
    status: 'Waiting for midi',
    activeNotes: [] as number[],
  });

  interface State {
    frequency: number,
    resonance: number,
    oscType: OscillatorType,
    subOscType: OscillatorType,
    subOscLevel: number,
    lfoFrequency: number,
    lfoLevel: number,
    synthesizer?: Synthesizer,
    attack: number,
    decay: number,
    sustain: number,
    release: number,
    midiDevices: SelectOption[],
    midiDevice?: string,
    showSettings: boolean,
  }

  const state: State = reactive({
    frequency: 20000,
    resonance: 1,
    oscType: 'sawtooth',
    subOscType: 'sine',
    subOscLevel: 127,
    lfoFrequency: 3,
    lfoLevel: 0,
    attack: 0,
    decay: 127,
    sustain: 127,
    release: 0,
    midiDevices: [],
    midiDevice: undefined,
    showSettings: false,
  });

  function changeCutoffFreq(frequency: number ): void {
    state.synthesizer?.changeParameter('filter', 'cutoff', frequency);
  }

  function changeResonance(resonance: number): void {
    state.synthesizer?.changeParameter('filter', 'resonance', resonance);
  }

  function changeOscillatorType(type: OscillatorType): void {
    state.oscType = type;
    state.synthesizer?.changeParameter('oscillator', 'type', type);
  }

  function changeSubOscillatorType(type: OscillatorType): void {
    state.subOscType = type;
    state.synthesizer?.changeParameter('subOscillator', 'type', type);
  }

  function changeSubOscLevel(level: number): void {
    state.synthesizer?.changeParameter('subOscillator', 'level', level);
  }

  function changeLfoFrequency(frequency: number): void {
    state.synthesizer?.changeParameter('lfo', 'frequency', frequency);
  }

  function changeLfoLevel(level: number): void {
    state.synthesizer?.changeParameter('lfo', 'level', level);
  }

  function changeEnvelopeParameter(parameter: string) {
    return (value: number): void => {
      state.synthesizer?.changeParameter('envelope', parameter, value);
    }
  }

  const changeAttack = changeEnvelopeParameter('attack');
  const changeDecay = changeEnvelopeParameter('decay');
  const changeSustain = changeEnvelopeParameter('sustain');
  const changeRelease = changeEnvelopeParameter('release');

  let midiAccess: WebMidi.MIDIAccess;
  
  function getDeviceName({ id='', manufacturer='', name=''}) {
    if (!name) return id;
    return [manufacturer, name].filter(e => !!e).join(' ');
  }

  async function initMidi() {
    if (navigator.requestMIDIAccess) {
      try {
        midiAccess = await navigator.requestMIDIAccess();
        synthState.status = 'Midi ready!';
        midiAccess.inputs.forEach((device) => {
          state.midiDevices.push({
            value: device.id,
            label: getDeviceName(device),
          })
        });
      } catch (e) {
        synthState.status = 'Failed to get midi access!';
      }
    }
  }
  
  initMidi();

  function changeMidiDevice(id: string) {
    if (!state.synthesizer) {
      start();
    }
    state.synthesizer?.bindMidi(id);
  }

  function start() {
    state.synthesizer = new Synthesizer(synthState, midiAccess);
  }

  
  interface Key {
    note: number,
    letter?: string,
  }

  const getKeyLetters = (): Key[] => ([
    {
      note: 12 + 12 * keyboard.octave,
      letter: 'A',
    }, {
      note: 13 + 12 * keyboard.octave,
      letter: 'W',
    }, { 
      note: 14 + 12 * keyboard.octave,
      letter: 'S',
    }, {
      note: 15 + 12 * keyboard.octave,
      letter: 'E',
    }, {
      note: 16 + 12 * keyboard.octave,
      letter: 'D',
    }, {
      note: 17 + 12 * keyboard.octave,
      letter: 'F',
    }, {
      note: 18 + 12 * keyboard.octave,
      letter: 'T',
    }, {
      note: 19 + 12 * keyboard.octave,
      letter: 'G',
    }, {
      note: 20 + 12 * keyboard.octave,
      letter: 'Y',
    }, {
      note: 21 + 12 * keyboard.octave,
      letter: 'H',
    }, {
      note: 22 + 12 * keyboard.octave,
      letter: 'U',
    }, {
      note: 23 + 12 * keyboard.octave,
      letter: 'J',
    }, {
      note: 24 + 12 * keyboard.octave,
      letter: 'K',
    }
  ]);

  interface Keyboard {
    keyLetters?: Key[],
    octave: number,
  }

  const keyboard: Keyboard = reactive({
    octave: 4,
  });

  keyboard.keyLetters = getKeyLetters();
  
  const keys = computed(() => Array(88).fill(21).map((start: number, index: number) => {
    const note = start + index;
    const key: Key = { note };
    const match = keyboard.keyLetters?.find(k => k.note === note);
    if (match?.letter) key.letter = match.letter;
    return key;
  }));

  const getNote = (letter: string) : number | undefined => {
    const found = keyboard.keyLetters?.find(k => k.letter === letter.toUpperCase());
    return found?.note;
  }

  const getKeyClasses = (midiNote: number): Array<string> => {
    const key = midiNote % 12;
    const whiteKeys = [0,2,4,5,7,9,11];
    const whiteOffset = [2,4,7,9,11];
    const blackKeys = [1,3,6,8,10];
    const classes = [];
    if (whiteKeys.includes(key)) classes.push('white');
    if (whiteOffset.includes(key)) classes.push('offset');
    if (blackKeys.includes(key)) classes.push('black');
    if (synthState.activeNotes.includes(midiNote)) classes.push('pressed');
    return classes;
  }

  const keyOn = (midiNote: number): void => {
    const velocity = 127;
    if (!state.synthesizer) {
      start();
    }
    state.synthesizer?.noteOn(midiNote, velocity);
  }

  const keyOff = (midiNote: number): void => {
    state.synthesizer?.noteOff(midiNote);
  }

  document.addEventListener('keydown', (event) => {
    const { key } = event;
    const note = getNote(key);
    if (note && !synthState.activeNotes.includes(note)) {
      keyOn(note);
    }
  });

  document.addEventListener('keyup', (event) => {
    const { key } = event;
    const note = getNote(key);
    if (note) {
      keyOff(note);
    }
  });

  const octaveDown = () => {
    keyboard.octave = Math.max(keyboard.octave - 1, 1);
    keyboard.keyLetters = getKeyLetters();
  }

  const octaveUp = () => {
    keyboard.octave = Math.min(keyboard.octave + 1, 7);
    keyboard.keyLetters = getKeyLetters();
  }

</script>

<template>
  <header>
    <h1>S-01</h1>
    <p>Simple mono synth with Web Audio API</p>
  </header>
  <main>
    <div class="controls">
      <div class="control-block">
        <h2>OSC 1</h2>
        <div class="control-group">
          <div class="control">
            <h3>Waveform</h3>
            <n-button-group vertical>
              <n-button round :type="state.oscType === 'sawtooth' ? 'success' : 'default'" @click="() => changeOscillatorType('sawtooth')">
                <template #icon>
                  <n-icon><WaveSawTool /></n-icon>
                </template>
                Sawtooth
              </n-button>
              <n-button round :type="state.oscType === 'square' ? 'success' : 'default'" @click="() => changeOscillatorType('square')">
                <template #icon>
                  <n-icon><WaveSquare /></n-icon>
                </template>
                Square
              </n-button>
            </n-button-group>
          </div>
        </div>
      </div>
      <div class="control-block">
        <h2>SUB OSC</h2>
        <div class="control-group">
          <div class="control">
            <h3>Waveform</h3>
            <n-space style="height: 100px; justify-content: center">
            
              <n-button-group vertical >
                <n-button
                  round
                  :type="state.subOscType === 'sine' ? 'success' : 'default'"
                  @click="() => changeSubOscillatorType('sine')"
                >
                  <template #icon>
                    <n-icon><WaveSine /></n-icon>
                  </template>
                  Sine
                </n-button>
                <n-button round :type="state.subOscType === 'square' ? 'success' : 'default'"  @click="() => changeSubOscillatorType('square')">
                  <template #icon>
                    <n-icon><WaveSquare /></n-icon>
                  </template>
                  Square
                </n-button>
              </n-button-group>
            </n-space>
          </div>
          <div class="control">
            <h3>Level</h3>
            <n-space style="height: 100px; justify-content: center">
              <n-slider v-model:value="state.subOscLevel" :min="0" :max="127" vertical @update:value="changeSubOscLevel"/>
            </n-space>
          </div>
        </div>
      </div>
      <div class="control-block">
        <h2>LFO</h2>
        <div class="control-group">
          <div class="control">
            <h3>Rate</h3>
            <n-space style="height: 100px; justify-content: center">
              <n-slider v-model:value="state.lfoFrequency" :min="0.5" :max="10" vertical @update:value="changeLfoFrequency"/>
            </n-space>
          </div>
          <div class="control">
            <h3>Level</h3>
            <n-space style="height: 100px; justify-content: center">
              <n-slider v-model:value="state.lfoLevel" :min="1" :max="50" vertical @update:value="changeLfoLevel"/>
            </n-space>
          </div>
        </div>
      </div>
      <div class="control-block">
        <h2>LPF</h2>
        <div class="control-group">
          <div class="control">
            <h3>Cutoff</h3>

            <n-space style="height: 100px; justify-content: center">
              <n-slider v-model:value="state.frequency" :min="100" :max="20000" vertical @update:value="changeCutoffFreq"/>
            </n-space>
          </div>
          <div class="control">
            <h3>Resonance</h3>
            <n-space style="height: 100px; justify-content: center">
              <n-slider v-model:value="state.resonance" :min="1" :max="50" vertical @update:value="changeResonance"/>
            </n-space>
          </div>
        </div>
      </div>
      <div class="control-block">
        <h2>ADSR</h2>
        <div class="control-group">
          <div class="control">
            <h3>Attack</h3>
            <n-space style="height: 100px; justify-content: center">
              <n-slider v-model:value="state.attack" :min="0" :max="127" vertical @update:value="changeAttack"/>
            </n-space>
          </div>
          <div class="control">
            <h3>Decay</h3>
            <n-space style="height: 100px; justify-content: center">
              <n-slider v-model:value="state.decay" :min="0" :max="127" vertical @update:value="changeDecay"/>
            </n-space>
          </div>
           <div class="control">
            <h3>Sustain</h3>
            <n-space style="height: 100px; justify-content: center">
              <n-slider v-model:value="state.sustain" :min="0" :max="127" vertical @update:value="changeSustain"/>
            </n-space>
          </div>
           <div class="control">
            <h3>Release</h3>
            <n-space style="height: 100px; justify-content: center">
              <n-slider v-model:value="state.release" :min="0" :max="127" vertical @update:value="changeRelease"/>
            </n-space>
          </div>
        </div>
      </div>
    </div>

    <div class="keyboard" >
      <div v-for="key in keys" :class="getKeyClasses(key.note)" @mousedown="() => keyOn(key.note)" @mouseup="() => keyOff(key.note)" @mouseleave="() => keyOff(key.note)">{{key.letter}}</div>
    </div>

    <div class="settings">
      <n-space justify="center">
        <n-button round type="default" @click="() => octaveDown()">
          <template #icon>
            <n-icon><ArrowDown /></n-icon>
          </template>
          Octave down
        </n-button>

        <n-button round type="default" @click="state.showSettings = true">
          <template #icon>
            <n-icon><Settings /></n-icon>
          </template>
          Settings
        </n-button>

        <n-button round type="default" @click="() => octaveUp()">
          <template #icon>
            <n-icon><ArrowUp /></n-icon>
          </template>
          Octave up
        </n-button>
      </n-space>
    </div>
  </main>

  <footer>
    <a href="https://github.com/h-line/">
      Made by h-line
    </a>
  </footer>
  
  <n-modal v-model:show="state.showSettings">
    <n-card
      style="width: 600px"
      title="Settings"
      :bordered="false"
      size="huge"
      role="dialog"
      aria-modal="true"
    >
      <div class="midi-devices" >
        <h3>Connect to Midi device</h3>
        <div class="midi-select" v-if="state.midiDevices.length > 0">
          <n-select
            v-model:value="state.midiDevice"
            :options="state.midiDevices"
            @update:value="changeMidiDevice"
            clearable
          />
        </div>

        <div class="no-devices" v-if="state.midiDevices.length === 0">
          <p>No Midi devices found. Web Midi API is only supported by Google Chrome.</p>
        </div>
      </div>

    </n-card>
  </n-modal>
</template>

<style scoped>

  header {
    margin-bottom: 2rem;
  }
  .controls {
    display: flex;
    justify-content: center;
  }
  .control-block {
    background-color: #eee;
    margin: 0 0.5rem 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 5px #bbb
  }
  .control-group {
    display: flex;
  }

  .control {
    margin: 0.5rem;
  }

  .keyboard {
    display: flex;
    justify-content: center;
  }

  .keyboard .white, .keyboard .black {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    box-sizing: border-box;
    font-size: 0.8vw;
  }

  .keyboard .black {
    z-index: 2;
    color: white;
    height: 5vw;
    width: 1.2vw;
    margin: 0 0 0 -0.6vw;
    border-radius: 0 0 2px 2px;
    border: 1px solid black;
    box-shadow:-1px -1px 2px rgba(255,255,255,0.2) inset,0 -5px 2px 3px rgba(0,0,0,0.6) inset,0 2px 4px rgba(0,0,0,0.5);
    background:linear-gradient(45deg,#222 0%,#555 100%)
  }
  
  .keyboard .white {
    background: linear-gradient(to bottom, hsl(0, 0%, 93%) 0%, white 100%);
    z-index: 1;
    height: 8vw;
    width: 1.8vw;
    border: 1px solid black;
    color: black;
    border-radius: 0 0 4px 4px;
    box-shadow: -1px 0 0 rgba(255,255,255,0.8) inset, 0 0 2px black inset,0 0 2px rgba(0,0,0,0.2);
  }

  .keyboard .white.pressed {
    box-shadow:2px 0 3px rgba(0,0,0,0.1) inset,-5px 5px 20px rgba(0,0,0,0.2) inset,0 0 3px rgba(0,0,0,0.2);
    background: linear-gradient(to bottom, white 0%, hsl(0, 0%, 80%) 100%);
    height: 7.9vw;
  }

  .keyboard .black.pressed {
    box-shadow:-1px -1px 2px rgba(255,255,255,0.2) inset,0 -2px 2px 3px rgba(0,0,0,0.6) inset,0 1px 2px rgba(0,0,0,0.5);
    background:linear-gradient(to right,#444 0%,#222 100%)
  }

  .keyboard .white.offset {
    margin: 0 0 0 -0.6vw;
  }
  .settings {
    margin-top: 2rem;
  }

  footer {
    position: fixed;
    bottom: 0;
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 1rem;
  }

  footer a {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: #999;
    transition: all .1s ease-in-out;
  }

  footer a img {
    margin-right: 1rem;
  }

  footer a:hover, footer a:active {
    color: #000;
  }
</style>
