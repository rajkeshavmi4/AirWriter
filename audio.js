class AirWriterAudio {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.drawingOsc = null;
        this.drawingGain = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.stopDrawingHum();
        }
        return this.muted;
    }

    playClick() {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, now); // A5

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.16);
        osc2.stop(now + 0.16);
    }

    playHoverTick() {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1600, now);

        gain.gain.setValueAtTime(0.015, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.02);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.02);
    }

    playClear() {
        if (this.muted) return;
        this.init();
        const ctx = this.ctx;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.4);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.linearRampToValueAtTime(2000, now + 0.4);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    startDrawingHum(freqY = 300) {
        if (this.muted) return;
        this.init();
        
        if (this.drawingOsc) {
            // Update frequency dynamically based on finger Y position
            const targetFreq = 200 + (1 - freqY) * 350; // Map Y coordinate to 200Hz - 550Hz
            this.drawingOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
            return;
        }

        const ctx = this.ctx;
        const now = ctx.currentTime;

        this.drawingOsc = ctx.createOscillator();
        this.drawingGain = ctx.createGain();

        this.drawingOsc.type = 'sine';
        this.drawingOsc.frequency.setValueAtTime(200 + (1 - freqY) * 350, now);

        // Smooth low hum
        this.drawingGain.gain.setValueAtTime(0.001, now);
        this.drawingGain.gain.linearRampToValueAtTime(0.04, now + 0.1);

        this.drawingOsc.connect(this.drawingGain);
        this.drawingGain.connect(ctx.destination);

        this.drawingOsc.start(now);
    }

    stopDrawingHum() {
        if (!this.drawingOsc) return;

        const now = this.ctx.currentTime;
        const osc = this.drawingOsc;
        const gain = this.drawingGain;

        this.drawingOsc = null;
        this.drawingGain = null;

        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

        setTimeout(() => {
            try {
                osc.stop();
            } catch (e) {}
        }, 100);
    }
}

window.writerAudio = new AirWriterAudio();
