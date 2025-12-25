/* * audio.js - Hybrid Audio Engine (Ver.9 Final Revised)
 * ・Slam音の強化（重低音＋歪み）
 * ・音量バランス調整（SE強調、MP3抑制）
 * ・全演出機能搭載
 */

const AudioEngine = {
    // --- Web Audio API (シンセサイザー用) ---
    ctx: null,
    masterGain: null,
    activeNodes: [],
    bgmInterval: null,
    delayNode: null,
    
    // --- HTML5 Audio (MP3用) ---
    currentMp3: null,

    // ■ 初期化
    init: function() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            
            // マスター音量（効果音を強調するために大きく設定）
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 1.2; // 【調整済み】 1.2倍

            // 空間エフェクト（ディレイ・リバーブ的なもの）
            this.delayNode = this.ctx.createDelay();
            this.delayNode.delayTime.value = 0.4;
            const feedback = this.ctx.createGain();
            feedback.gain.value = 0.3;
            this.delayNode.connect(feedback);
            feedback.connect(this.delayNode);
            
            this.masterGain.connect(this.ctx.destination);
            this.delayNode.connect(this.masterGain);
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // ■ 全停止
    stopMusic: function() {
        // シンセ停止
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
        this.activeNodes.forEach(node => {
            try { 
                if(node.stop) node.stop(); 
                node.disconnect(); 
            } catch(e){}
        });
        this.activeNodes = [];

        // MP3停止
        if (this.currentMp3) {
            this.currentMp3.pause();
            this.currentMp3.currentTime = 0;
            this.currentMp3 = null;
        }
    },

    // ====================================================
    // 🌍 環境音 (Ambience)
    // ====================================================
    playAmbience: function(type = "office") {
        this.init();
        this.stopMusic(); 

        const now = this.ctx.currentTime;
        let bufferSize = this.ctx.sampleRate * 2.0;
        let buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        let data = buffer.getChannelData(0);

        if (type === "office") {
            // 空調・サーバー音
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            const filter = this.ctx.createBiquadFilter();
            filter.type = "lowpass"; filter.frequency.value = 400;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 2);

            noise.connect(filter).connect(gain).connect(this.masterGain);
            noise.start();
            this.activeNodes.push(noise, gain);
        }
        else if (type === "rain") {
            // 雨音
            for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;
            const filter = this.ctx.createBiquadFilter();
            filter.type = "lowpass"; filter.frequency.value = 800;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 3);
            noise.connect(filter).connect(gain).connect(this.masterGain);
            noise.start();
            this.activeNodes.push(noise, gain);
        }
        else if (type === "tinnitus") {
            // 耳鳴り
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine"; osc.frequency.value = 8000;
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.03, now + 0.1);
            const lfo = this.ctx.createOscillator();
            lfo.frequency.value = 8; 
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 5;
            lfo.connect(lfoGain).connect(osc.frequency);
            osc.connect(gain).connect(this.masterGain);
            osc.start(); lfo.start();
            this.activeNodes.push(osc, gain, lfo);
        }
        else if (type === "abyss") {
            // 深淵
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sawtooth"; osc.frequency.value = 40;
            const filter = this.ctx.createBiquadFilter();
            filter.type = "lowpass"; filter.frequency.value = 100;
            const lfo = this.ctx.createOscillator();
            lfo.type = "sine"; lfo.frequency.value = 0.2;
            lfo.connect(filter.frequency);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 4);
            osc.connect(filter).connect(gain).connect(this.masterGain);
            osc.start(); lfo.start();
            this.activeNodes.push(osc, gain, lfo);
        }
    },

    // ====================================================
    // 📁 MP3 楽曲再生 (Suno AI)
    // ====================================================
    playMp3: function(filename, loop = true) {
        this.stopMusic();
        const audio = new Audio(filename);
        audio.loop = loop;
        
        // 音量バランス調整（SEより小さくする）
        audio.volume = 0.3; // 【調整済み】 0.3倍
        
        audio.play().catch(e => console.log("Click required"));
        this.currentMp3 = audio;
    },

    playTitleTheme: function() { this.playMp3("opening.mp3"); },
    playFlashbackTheme: function() { this.playMp3("flashback.mp3"); },
    playConfessionTheme: function() { this.playMp3("confession.mp3"); },
    playEndingTheme: function() { this.playMp3("ending.mp3"); },

    // ====================================================
    // 🎹 プログラム生成 BGM (楽曲)
    // ====================================================
    playMysteryTheme: function() {
        this.init(); this.stopMusic();
        const melody = [{n:440,t:0},{n:523,t:0.5},{n:659,t:1.0},{n:523,t:1.5},{n:698,t:2.0},{n:659,t:2.5},{n:587,t:3.0},{n:0,t:3.5}];
        const loop = () => {
            const now = this.ctx.currentTime;
            melody.forEach(m => { if(m.n>0) this.playTone(m.n, now + m.t, "musicbox"); });
        };
        loop(); this.bgmInterval = setInterval(loop, 4000);
    },

    playChaseTheme: function() {
        this.init(); this.stopMusic();
        const loop = () => {
            const now = this.ctx.currentTime;
            for(let i=0; i<8; i++) { 
                const osc=this.ctx.createOscillator(); const g=this.ctx.createGain();
                osc.type="sawtooth"; osc.frequency.value=92.50; 
                const t=now+(i*0.2); g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.01,t+0.1);
                const f=this.ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.setValueAtTime(400,t); f.frequency.exponentialRampToValueAtTime(100,t+0.1);
                osc.connect(f).connect(g).connect(this.masterGain); osc.start(t); osc.stop(t+0.15); this.activeNodes.push(osc,g);
            }
            for(let i=0; i<8; i+=2) this.playNoisePercussion(now+(i*0.2)+0.1);
            if(Math.random()>0.3) {
                const osc=this.ctx.createOscillator(); const g=this.ctx.createGain();
                osc.type="square"; osc.frequency.value=1480; g.gain.setValueAtTime(0.05,now); g.gain.exponentialRampToValueAtTime(0.001,now+0.5);
                osc.connect(g).connect(this.delayNode); osc.start(now); osc.stop(now+0.5); this.activeNodes.push(osc,g);
            }
        };
        loop(); this.bgmInterval = setInterval(loop, 1600);
    },

    playHorrorTheme: function() {
        this.init(); this.stopMusic();
        const loop = () => {
            const now = this.ctx.currentTime;
            [100,115,123,200].forEach(freq => {
                const osc=this.ctx.createOscillator(); const g=this.ctx.createGain();
                osc.type="triangle"; osc.frequency.value=freq;
                const lfo=this.ctx.createOscillator(); lfo.frequency.value=0.5+Math.random();
                const lg=this.ctx.createGain(); lg.gain.value=10; lfo.connect(lg).connect(osc.frequency);
                g.gain.setValueAtTime(0,now); g.gain.linearRampToValueAtTime(0.15,now+2); g.gain.linearRampToValueAtTime(0,now+6);
                osc.connect(g).connect(this.masterGain); lfo.start(now); osc.start(now); lfo.stop(now+6); osc.stop(now+6); this.activeNodes.push(osc,g);
            });
        };
        loop(); this.bgmInterval = setInterval(loop, 5000);
    },

    // ====================================================
    // 🔔 効果音 (SE) - 強化版
    // ====================================================
    
    // 通知音
    playPing: function() {
        this.init(); const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(880, t);
        g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.6);
        osc.connect(g).connect(this.delayNode); osc.start(t); osc.stop(t+0.6);
    },

    // 心臓音（重低音）
    playHeartbeat: function() {
        this.init(); const t = this.ctx.currentTime;
        const beat = (time, vol) => {
            const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
            osc.type = "sine"; osc.frequency.setValueAtTime(80, time); osc.frequency.exponentialRampToValueAtTime(30, time+0.1);
            g.gain.setValueAtTime(vol, time); g.gain.exponentialRampToValueAtTime(0.001, time+0.15);
            const f = this.ctx.createBiquadFilter(); f.type="lowpass"; f.frequency.value=100;
            osc.connect(f).connect(g).connect(this.masterGain); osc.start(time); osc.stop(time+0.25);
        };
        beat(t, 1.0); beat(t+0.25, 0.7);
    },

    // 💥 激しい打撃音 (Heavy Slam) - 【超強化版】
    // 重低音＋歪みで破壊音を作る
    playSlam: function() {
        this.init();
        const t = this.ctx.currentTime;

        // 1. 歪みカーブ (激しいディストーション)
        const makeDistortionCurve = (amount) => {
            const k = amount, n = 44100, curve = new Float32Array(n), deg = Math.PI / 180;
            for (let i = 0; i < n; ++i) { 
                let x = i * 2 / n - 1; 
                curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x)); 
            }
            return curve;
        };
        const shaper = this.ctx.createWaveShaper(); 
        shaper.curve = makeDistortionCurve(2000); // 歪み量MAX
        shaper.oversample = '4x';
        
        // 2. 音量制御（歪み後の爆音を抑える）
        const preMaster = this.ctx.createGain();
        preMaster.gain.setValueAtTime(1.0, t);

        // A. 重低音 (Sub-Bass) - ドゥゥゥン
        const boomOsc = this.ctx.createOscillator(); boomOsc.type = "sine";
        boomOsc.frequency.setValueAtTime(100, t); boomOsc.frequency.exponentialRampToValueAtTime(10, t+0.5);
        const boomGain = this.ctx.createGain(); boomGain.gain.setValueAtTime(2.0, t); boomGain.gain.exponentialRampToValueAtTime(0.01, t+0.5);

        // B. 打撃音 (Impact) - バシッ
        const crackOsc = this.ctx.createOscillator(); crackOsc.type = "sawtooth";
        crackOsc.frequency.setValueAtTime(150, t); crackOsc.frequency.exponentialRampToValueAtTime(50, t+0.1);
        const crackGain = this.ctx.createGain(); crackGain.gain.setValueAtTime(1.0, t); crackGain.gain.exponentialRampToValueAtTime(0.001, t+0.1);

        // C. 破砕ノイズ (Noise) - ガシャッ
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate*0.5, this.ctx.sampleRate);
        const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
        const noise = this.ctx.createBufferSource(); noise.buffer = buf;
        const nf = this.ctx.createBiquadFilter(); nf.type="lowpass"; nf.frequency.value=800;
        const ng = this.ctx.createGain(); ng.gain.setValueAtTime(1.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t+0.3);

        // 配線: 音源 -> 歪み -> PreMaster -> 出力
        boomOsc.connect(boomGain).connect(shaper);
        crackOsc.connect(crackGain).connect(shaper);
        noise.connect(nf).connect(ng).connect(shaper);
        
        shaper.connect(preMaster).connect(this.masterGain);
        
        boomOsc.start(t); boomOsc.stop(t+0.6);
        crackOsc.start(t); crackOsc.stop(t+0.2);
        noise.start(t); noise.stop(t+0.4);
    },

    // ⚡ 処刑音 (Execution) - 先輩殺害用
    playExecution: function() {
        this.init(); const t = this.ctx.currentTime;
        // 1. バヂッ (ショート音)
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate*0.1, this.ctx.sampleRate);
        const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
        const spark = this.ctx.createBufferSource(); spark.buffer = buf;
        const sg = this.ctx.createGain(); sg.gain.setValueAtTime(0.8, t); sg.gain.exponentialRampToValueAtTime(0.01, t+0.1);
        
        // 2. ゴウン (モーター起動)
        const motor = this.ctx.createOscillator(); motor.type = "sawtooth";
        motor.frequency.setValueAtTime(20, t); motor.frequency.exponentialRampToValueAtTime(100, t+1.0);
        const mg = this.ctx.createGain(); mg.gain.setValueAtTime(0, t); mg.gain.linearRampToValueAtTime(0.5, t+0.1); mg.gain.linearRampToValueAtTime(0, t+1.5);
        
        spark.connect(sg).connect(this.masterGain);
        motor.connect(mg).connect(this.masterGain);
        spark.start(t); motor.start(t); motor.stop(t+1.5);
    },

    // 🔨 承認音 (Stamp) - 部長決裁用
    playStamp: function() {
        this.init(); const t = this.ctx.currentTime;
        // 1. カチッ (クリック)
        const click = this.ctx.createOscillator(); click.type = "square";
        click.frequency.setValueAtTime(2000, t);
        const cg = this.ctx.createGain(); cg.gain.setValueAtTime(0.1, t); cg.gain.exponentialRampToValueAtTime(0.001, t+0.05);
        
        // 2. ドォォォン (重い判決)
        const thud = this.ctx.createOscillator(); thud.type = "sine";
        thud.frequency.setValueAtTime(150, t+0.05); thud.frequency.exponentialRampToValueAtTime(30, t+0.5);
        const tg = this.ctx.createGain(); tg.gain.setValueAtTime(0, t); tg.gain.setValueAtTime(1.0, t+0.05); tg.gain.exponentialRampToValueAtTime(0.001, t+1.5);

        click.connect(cg).connect(this.masterGain);
        thud.connect(tg).connect(this.delayNode); // リバーブ
        click.start(t); click.stop(t+0.1);
        thud.start(t); thud.stop(t+1.5);
    },

    playShredder: function() {
        this.init(); const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); osc.type = "sawtooth";
        osc.frequency.setValueAtTime(100, t); osc.frequency.linearRampToValueAtTime(50, t+3);
        const og = this.ctx.createGain(); og.gain.setValueAtTime(0.2, t); og.gain.linearRampToValueAtTime(0, t+3);
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate*3.0, this.ctx.sampleRate);
        const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1);
        const noise = this.ctx.createBufferSource(); noise.buffer = buf;
        const nf = this.ctx.createBiquadFilter(); nf.type="bandpass"; nf.frequency.value=1000;
        const ng = this.ctx.createGain(); ng.gain.setValueAtTime(0.4, t); ng.gain.exponentialRampToValueAtTime(0.01, t+3.0);
        osc.connect(og).connect(this.masterGain); noise.connect(nf).connect(ng).connect(this.masterGain);
        osc.start(t); osc.stop(t+3); noise.start(t); noise.stop(t+3);
    },

    playGlitch: function() {
        this.init();
        const buf = this.ctx.createBuffer(1, this.ctx.sampleRate*0.2, this.ctx.sampleRate);
        const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
        const src = this.ctx.createBufferSource(); src.buffer=buf;
        const g = this.ctx.createGain(); g.gain.value=0.3;
        src.connect(g).connect(this.masterGain); src.start();
    },

    playImpact: function() {
        this.init(); const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); const g = this.ctx.createGain();
        osc.frequency.setValueAtTime(150, t); osc.frequency.exponentialRampToValueAtTime(10, t+0.2);
        g.gain.setValueAtTime(1.0, t); g.gain.exponentialRampToValueAtTime(0.001, t+0.2);
        osc.connect(g).connect(this.masterGain); osc.start(t); osc.stop(t+0.3);
    },

    // ----------------------------------------------------
    // 補助関数
    // ----------------------------------------------------
    playTone: function(freq, time, type, duration = 2.0) {
        const osc=this.ctx.createOscillator(); const osc2=this.ctx.createOscillator(); const g=this.ctx.createGain();
        if (type === "musicbox") {
            osc.type='sine'; osc2.type='sine'; osc2.detune.value=5;
            g.gain.setValueAtTime(0, time); g.gain.linearRampToValueAtTime(0.1, time+0.05); g.gain.exponentialRampToValueAtTime(0.001, time+2.0);
        }
        osc.frequency.setValueAtTime(freq, time); osc2.frequency.setValueAtTime(freq, time);
        osc.connect(g).connect(this.delayNode); osc2.connect(g).connect(this.delayNode);
        osc.start(time); osc.stop(time+duration+1); osc2.start(time); osc2.stop(time+duration+1);
        this.activeNodes.push(osc, osc2, g);
    },
    
    playNoisePercussion: function(time) {
        const buf=this.ctx.createBuffer(1,this.ctx.sampleRate*0.05,this.ctx.sampleRate);
        const d=buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
        const src=this.ctx.createBufferSource(); src.buffer=buf;
        const g=this.ctx.createGain(); g.gain.setValueAtTime(0.1,time); g.gain.exponentialRampToValueAtTime(0.01,time+0.05);
        src.connect(g).connect(this.masterGain); src.start(time); this.activeNodes.push(src,g);
    }
};