/**
 * AudioManager.js - プロシージャルエンジン音、スキール音、効果音、ユーロビートBGM
 * Web Audio APIによって、外部音源ファイルなしでも超本格的なサウンドを完全生成
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isBgmEnabled = true;

        // ノード
        this.masterGain = null;
        this.sfxGain = null;
        this.bgmGain = null;

        // エンジンシンセ
        this.engineOsc1 = null;
        this.engineOsc2 = null;
        this.engineFilter = null;
        this.engineGain = null;

        // スキール音シンセ
        this.tireNoiseNode = null;
        this.tireFilter = null;
        this.tireGain = null;

        // ユーロビートシーケンサー
        this.bgmInterval = null;
        this.bgmStep = 0;
        this.bpm = 155;

        this.initialized = false;
        this.soundType = '4age';
    }

    init() {
        if (this.initialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // マスターゲイン
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // SFX & BGM ゲイン
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        // エンジンサウンドのセットアップ
        this.setupEngineSynth();

        // タイヤスキール音のセットアップ
        this.setupTireSqueal();

        // 雨天サウンド＆水しぶき音のセットアップ
        this.setupRainAudio();

        // ★峠道砂利走行音＆小石直撃音のセットアップ
        this.setupGravelAudio();

        // ★溝落としグラインド摩擦音のセットアップ
        this.setupGutterAudio();

        this.initialized = true;
    }

    setupRainAudio() {
        if (!this.ctx) return;
        // 雨のアンビエント環境音（低域〜中域の優しい雨音）
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.04 * white) / 1.04;
            lastOut = data[i];
        }

        this.rainNoiseNode = this.ctx.createBufferSource();
        this.rainNoiseNode.buffer = buffer;
        this.rainNoiseNode.loop = true;

        const rainFilter = this.ctx.createBiquadFilter();
        rainFilter.type = 'lowpass';
        rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);

        this.rainGain = this.ctx.createGain();
        this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.rainNoiseNode.connect(rainFilter);
        rainFilter.connect(this.rainGain);
        this.rainGain.connect(this.sfxGain);

        this.rainNoiseNode.start();

        // ウェット路面走行時のタイヤ水しぶきシズル音（スピード比例）
        const sprayBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const sprayData = sprayBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            sprayData[i] = Math.random() * 2 - 1;
        }
        const spraySource = this.ctx.createBufferSource();
        spraySource.buffer = sprayBuffer;
        spraySource.loop = true;

        const sprayFilter = this.ctx.createBiquadFilter();
        sprayFilter.type = 'bandpass';
        sprayFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
        sprayFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

        this.wetSprayGain = this.ctx.createGain();
        this.wetSprayGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        spraySource.connect(sprayFilter);
        sprayFilter.connect(this.wetSprayGain);
        this.wetSprayGain.connect(this.sfxGain);

        spraySource.start();
    }

    setWeather(weather) {
        this.weather = weather || 'dry';
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (this.weather === 'rain') {
            if (this.rainGain) this.rainGain.gain.setTargetAtTime(0.24, now, 0.4);
        } else {
            if (this.rainGain) this.rainGain.gain.setTargetAtTime(0.0, now, 0.2);
            if (this.wetSprayGain) this.wetSprayGain.gain.setTargetAtTime(0.0, now, 0.2);
        }
    }

    updateWetTireHiss(speedKmh) {
        if (!this.initialized || !this.wetSprayGain || !this.ctx) return;
        if (this.weather !== 'rain') {
            this.wetSprayGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
            return;
        }
        const speedNorm = Math.min(1.0, Math.max(0, (speedKmh - 15) / 100));
        const targetGain = speedNorm * 0.16;
        this.wetSprayGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }

    /**
     * ★峠道あるある完全再現：プロシージャル砂利走行音（Gravel Road Noise & Pebble Hits）
     * タイヤが未舗装路肩・砂利を踏んだときの「ジャリジャリッ」「ザザーッ」という粗い砂利ノイズと
     * 小石がインナーフェンダーに当たる「パチッ、カンッ」という音をWeb Audio APIで完全プロシージャル合成
     */
    setupGravelAudio() {
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * 2;
        // 砂利ノイズ用バッファ（ザラついた粗粒度クラックルノイズ）
        const gravelBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const gravelData = gravelBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // パルス成分を混ぜた不規則な砂利摩擦ノイズ
            const rand = Math.random();
            const pulse = (Math.random() < 0.05) ? (Math.random() * 2 - 1) * 1.8 : 0;
            gravelData[i] = (rand * 2 - 1) * 0.7 + pulse;
        }

        this.gravelSource = this.ctx.createBufferSource();
        this.gravelSource.buffer = gravelBuffer;
        this.gravelSource.loop = true;

        // バンドパスフィルター（砂利のザラザラした周波数帯 2400Hz）
        this.gravelFilter = this.ctx.createBiquadFilter();
        this.gravelFilter.type = 'bandpass';
        this.gravelFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
        this.gravelFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

        this.gravelGain = this.ctx.createGain();
        this.gravelGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.gravelSource.connect(this.gravelFilter);
        this.gravelFilter.connect(this.gravelGain);
        this.gravelGain.connect(this.sfxGain);

        this.gravelSource.start();

        // 小石直撃音用のクールダウン
        this.lastPebbleHitTime = 0;
    }

    /**
     * 砂利走行音のリアルタイム更新
     * @param {number} speedKmh - 車両速度 (km/h)
     * @param {number} intensity - 砂利踏み込み度合い (0.0〜1.0)
     */
    updateGravel(speedKmh, intensity = 0.0) {
        if (!this.initialized || !this.gravelGain || !this.ctx) return;

        const now = this.ctx.currentTime;
        if (intensity <= 0.01 || speedKmh < 8) {
            this.gravelGain.gain.setTargetAtTime(0.0, now, 0.08);
            return;
        }

        // 速度と踏み込み量に応じたゲイン（最大 0.28）
        const speedNorm = Math.min(1.2, speedKmh / 75.0);
        const targetGain = Math.min(0.28, intensity * speedNorm * 0.25);
        this.gravelGain.gain.setTargetAtTime(targetGain, now, 0.04);

        // 速度に応じてフィルター周波数をシフト（高速になるほど高周波化 2000Hz〜3600Hz）
        const targetFreq = 2000 + speedNorm * 1200;
        this.gravelFilter.frequency.setTargetAtTime(targetFreq, now, 0.06);

        // 高速走行時、ホイールハウスに小石が当たるランダムポップ音を時折発音
        if (speedKmh > 25 && Math.random() < (intensity * 0.22) && (now - this.lastPebbleHitTime > 0.09)) {
            this.playPebbleHit();
            this.lastPebbleHitTime = now;
        }
    }

    /**
     * 小石がインナーフェンダーやフロアパンに当たる「パチッ、カンッ」という音
     */
    playPebbleHit() {
        if (!this.ctx || this.isMuted) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // 800Hz〜2200Hzの短いインパルス
        const freq = 900 + Math.random() * 1200;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.025);

        gain.gain.setValueAtTime(0.09 + Math.random() * 0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.03);
    }

    /**
     * ★溝落としグラインド摩擦音（Gutter Concrete Grind & Rattle）
     * 側溝を駆け抜ける際の「ゴロゴロゴロ…」「ガガガガッ」という重厚なコンクリート擦過音
     */
    setupGutterAudio() {
        if (!this.ctx) return;

        const bufferSize = this.ctx.sampleRate * 2;
        const gutterBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = gutterBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            // 低周波パルスとコンクリート粗面の摩擦ノイズ
            const pulse = (Math.random() < 0.12) ? (Math.random() * 2 - 1) * 1.5 : 0;
            data[i] = (Math.random() * 2 - 1) * 0.6 + pulse;
        }

        this.gutterSource = this.ctx.createBufferSource();
        this.gutterSource.buffer = gutterBuffer;
        this.gutterSource.loop = true;

        // 重厚なコンクリート溝のレゾナンス（バンドパス 450Hz〜800Hz）
        this.gutterFilter = this.ctx.createBiquadFilter();
        this.gutterFilter.type = 'bandpass';
        this.gutterFilter.frequency.setValueAtTime(520, this.ctx.currentTime);
        this.gutterFilter.Q.setValueAtTime(2.4, this.ctx.currentTime);

        this.gutterGain = this.ctx.createGain();
        this.gutterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.gutterSource.connect(this.gutterFilter);
        this.gutterFilter.connect(this.gutterGain);
        this.gutterGain.connect(this.sfxGain);

        this.gutterSource.start();
    }

    /**
     * 溝走行グラインド音のリアルタイム更新
     */
    updateGutterGrind(speedKmh, active = false) {
        if (!this.initialized || !this.gutterGain || !this.ctx) return;

        const now = this.ctx.currentTime;
        if (!active || speedKmh < 10) {
            this.gutterGain.gain.setTargetAtTime(0.0, now, 0.06);
            return;
        }

        // 速度に応じた音量と周波数の変動
        const speedNorm = Math.min(1.4, speedKmh / 70.0);
        const targetGain = Math.min(0.35, 0.12 + speedNorm * 0.18);
        this.gutterGain.gain.setTargetAtTime(targetGain, now, 0.04);

        const targetFreq = 480 + speedNorm * 380;
        this.gutterFilter.frequency.setTargetAtTime(targetFreq, now, 0.05);
    }

    setEngineSoundType(type) {
        this.soundType = type || '4age';
        if (!this.initialized || !this.engineOsc1 || !this.engineOsc2) return;

        if (this.soundType === '13b') {
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'sine';
        } else if (this.soundType === 'rb26') {
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'sawtooth';
        } else if (this.soundType === '1jz') {
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'triangle';
        } else if (this.soundType === 'sr20') {
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'triangle';
        } else if (this.soundType === '4g63') {
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'triangle';
        } else if (this.soundType === 'b16b') {
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'sawtooth';
        } else if (this.soundType === 'f5a') {
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'sawtooth';
        } else if (this.soundType === '2jz') {
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'sawtooth';
        } else {
            this.engineOsc1.type = 'sawtooth';
            this.engineOsc2.type = 'triangle';
        }
    }

    previewRev(carId, onPopCallback = null) {
        if (!this.initialized) {
            this.init();
            this.resume();
        }
        const car = window.CAR_DATABASE && window.CAR_DATABASE[carId];
        const soundType = car && car.physics ? car.physics.engineSoundType : '4age';
        this.setEngineSoundType(soundType);

        const targetRpm = (car && car.physics && car.physics.redlineRpm) ? car.physics.redlineRpm * 0.88 : 7500;
        let currentRpm = 1000;
        let step = 0;

        const revInterval = setInterval(() => {
            step++;
            if (step <= 24) {
                // スロットル全開で回転急上昇
                currentRpm += (targetRpm - currentRpm) * 0.16;
                this.updateEngine(currentRpm, 1.0, false, 0);
            } else if (step <= 34) {
                // アクセルを抜いて減速＋アフターファイヤ炸裂
                currentRpm -= (currentRpm - 1000) * 0.22;
                this.updateEngine(currentRpm, 0.0, false, 0);
                if (step === 25) {
                    this.playAfterfireSound(1.2);
                    if (onPopCallback) onPopCallback(1.2);
                }
            } else {
                this.updateEngine(1000, 0.0, false, 0);
                this.engineGain.gain.setTargetAtTime(0.0, this.ctx.currentTime, 0.1);
                clearInterval(revInterval);
            }
        }, 16);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setupEngineSynth() {
        // エンジンサウンドシンセ
        this.engineOsc1 = this.ctx.createOscillator();
        this.engineOsc1.type = 'sawtooth';

        this.engineOsc2 = this.ctx.createOscillator();
        this.engineOsc2.type = 'triangle';

        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
        this.engineFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.engineOsc1.connect(this.engineFilter);
        this.engineOsc2.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);

        this.engineOsc1.start();
        this.engineOsc2.start();
    }

    setupTireSqueal() {
        // ホワイトノイズ生成
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        this.tireFilter = this.ctx.createBiquadFilter();
        this.tireFilter.type = 'bandpass';
        this.tireFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
        this.tireFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

        this.tireGain = this.ctx.createGain();
        this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        whiteNoise.connect(this.tireFilter);
        this.tireFilter.connect(this.tireGain);
        this.tireGain.connect(this.sfxGain);

        whiteNoise.start();
    }

    updateEngine(rpm, throttle, isDrifting, driftAngle) {
        if (!this.initialized) return;

        // 車種別エンジンの気筒数・ロータリー・過給特性に応じた周波数＆音響モデリング
        let orderMultiplier = 2.0; // 4気筒 NA
        let maxRpmRef = 11000;
        let cutoffBase = 500;
        let cutoffRange = 4500;
        let cutoffThrottle = 1500;

        if (this.soundType === '13b') {
            orderMultiplier = 3.0; // ロータリー高調波
            maxRpmRef = 8500;
            cutoffBase = 650;
            cutoffRange = 4800;
            cutoffThrottle = 2200;
        } else if (this.soundType === 'rb26') {
            orderMultiplier = 3.0; // 直列6気筒ツインターボ
            maxRpmRef = 8500;
            cutoffBase = 420;
            cutoffRange = 3600;
            cutoffThrottle = 2400;
        } else if (this.soundType === '1jz') {
            orderMultiplier = 3.0; // 2.5L 直列6気筒シングルターボ
            maxRpmRef = 8000;
            cutoffBase = 400;
            cutoffRange = 3900;
            cutoffThrottle = 2500;
        } else if (this.soundType === 'sr20') {
            orderMultiplier = 2.0; // 4気筒ターボ
            maxRpmRef = 7800;
            cutoffBase = 480;
            cutoffRange = 4000;
            cutoffThrottle = 1900;
        } else if (this.soundType === '4g63') {
            orderMultiplier = 2.0; // 2.0L 4気筒ターボ（重厚な過給ビート）
            maxRpmRef = 8200;
            cutoffBase = 460;
            cutoffRange = 4200;
            cutoffThrottle = 2400;
        } else if (this.soundType === 'b16b') {
            orderMultiplier = 2.0; // 1.6L 4気筒 高回転NA VTEC
            maxRpmRef = 9500;
            const isVtec = rpm > 5800; // 5,800rpmでVTECハイカム突入！甲高い咆哮へシフト
            cutoffBase = isVtec ? 680 : 500;
            cutoffRange = isVtec ? 5600 : 4200;
            cutoffThrottle = isVtec ? 2800 : 1600;
        } else if (this.soundType === 'f5a') {
            orderMultiplier = 1.5; // 550cc 直列3気筒（1.5次オーダーパルス）
            maxRpmRef = 10000;
            const isBoost = rpm > 4500; // 4,500rpm以上でドッカン過給＆タービン過給高音
            cutoffBase = isBoost ? 620 : 420;
            cutoffRange = isBoost ? 5500 : 3800;
            cutoffThrottle = isBoost ? 2900 : 1300;
        } else if (this.soundType === '2jz') {
            orderMultiplier = 3.0; // 3.0L 直列6気筒ツインターボ
            maxRpmRef = 8200;
            cutoffBase = 380; // 3Lならではの図太い重低音
            cutoffRange = 4100;
            cutoffThrottle = 2600; // アクセル開度で豪快に吼えるツインターボ吸排気
        }

        const baseFreq = Math.max(35, (rpm / 60) * orderMultiplier);
        const curTime = this.ctx.currentTime;

        this.engineOsc1.frequency.setTargetAtTime(baseFreq, curTime, 0.03);
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.015, curTime, 0.03);

        const cutoff = cutoffBase + (rpm / maxRpmRef) * cutoffRange + throttle * cutoffThrottle;
        this.engineFilter.frequency.setTargetAtTime(cutoff, curTime, 0.04);

        // 音量
        const vol = 0.15 + (throttle * 0.25) + (rpm / maxRpmRef) * 0.22;
        this.engineGain.gain.setTargetAtTime(vol, curTime, 0.03);

        // ドリフト時のスキール音
        let squealVol = 0;
        if (isDrifting) {
            const slipIntensity = Math.min(1.0, Math.abs(driftAngle) * 2.2);
            squealVol = 0.15 + slipIntensity * 0.35;
            const squealPitch = 900 + slipIntensity * 1200;
            this.tireFilter.frequency.setTargetAtTime(squealPitch, curTime, 0.04);
        }
        this.tireGain.gain.setTargetAtTime(squealVol, curTime, 0.05);
    }

    playShiftSound() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        // シフトショック・メカニカル音
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.09);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    /**
     * アフターファイヤ破裂音（Web Audio API プロシージャル合成）
     * 乾いた衝撃破裂音（パンッ！）、低域の排気衝撃波、高負荷時の連続破裂（ババッ！）を忠実再現
     */
    playAfterfireSound(intensity = 1.0, isRival = false) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const volMultiplier = (isRival ? 0.65 : 1.0) * Math.min(1.4, Math.max(0.5, intensity));

        // 1発目の主破裂音生成
        this._synthesizeExhaustPop(now, volMultiplier, 1.0);

        // 高強度時はランダムで「ババッ！」と追従する小気味よい二次破裂音
        if (intensity > 0.85 && Math.random() < 0.65) {
            const delay = 0.045 + Math.random() * 0.035;
            this._synthesizeExhaustPop(now + delay, volMultiplier * 0.55, 1.25);
        }
    }

    _synthesizeExhaustPop(time, volume, pitchFactor = 1.0) {
        // A. 鋭い高圧ガス破裂ノイズ（乾いた「パンッ！」というクラック音）
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const decay = Math.exp(-i / (this.ctx.sampleRate * 0.015));
            data[i] = (Math.random() * 2 - 1) * decay;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(2200 * pitchFactor, time);
        noiseFilter.Q.setValueAtTime(3.0, time);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.70 * volume, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);

        noise.start(time);
        noise.stop(time + 0.08);

        // B. 排気管内の空気衝撃波・重低音キック（ドスッと腹に響くコンカッション）
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(170 * pitchFactor, time);
        subOsc.frequency.exponentialRampToValueAtTime(36, time + 0.055);

        subGain.gain.setValueAtTime(0.55 * volume, time);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.065);

        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);

        subOsc.start(time);
        subOsc.stop(time + 0.07);
    }

    playWallHit(intensity = 1.0) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        // クラッシュ衝撃ノイズ
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.06));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(900, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.6 * intensity, now);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        noise.start(now);
    }

    /**
     * ★溝落とし進入衝撃音（Gutter Drop Impact）
     * 「ガコンッ！」「ダンッ！」という車輪の溝底着地とサスペンション底突き衝撃音
     */
    playGutterDropSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // 1. 重量衝撃波（ドスッ！という低域サブベース）
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(145, now);
        subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.14);

        subGain.gain.setValueAtTime(0.72, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        subOsc.connect(subGain);
        subGain.connect(this.sfxGain);
        subOsc.start(now);
        subOsc.stop(now + 0.16);

        // 2. メタリックスプリング＆サスペンション打撃音（ガチンッ！）
        const crackOsc = this.ctx.createOscillator();
        const crackGain = this.ctx.createGain();
        crackOsc.type = 'sawtooth';
        crackOsc.frequency.setValueAtTime(320, now);
        crackOsc.frequency.exponentialRampToValueAtTime(75, now + 0.08);

        crackGain.gain.setValueAtTime(0.48, now);
        crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        crackOsc.connect(crackGain);
        crackGain.connect(this.sfxGain);
        crackOsc.start(now);
        crackOsc.stop(now + 0.10);

        // 3. コンクリート縁石打撃クラックノイズ
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.07);
        const buf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.015));
        }
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = buf;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1600, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.45, now);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noiseSource.start(now);
    }

    playGutterSound() {
        this.playGutterDropSound();
    }

    /**
     * ★溝落とし脱出音（Gutter Exit Sound）
     * 「ガタンッ！」というサスペンション解放と路面復帰音
     */
    playGutterExitSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.10);

        gain.gain.setValueAtTime(0.38, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    playCountdownBeep(isFinal = false) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(isFinal ? 880 : 440, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + (isFinal ? 0.6 : 0.2));

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + (isFinal ? 0.6 : 0.2));
    }

    playHeadlightSwitch() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        // メカニカルなリトラクタブル・ライトスイッチのリレー音（カチッ）
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.045);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.045);

        // セカンドリレー音
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(800, now + 0.035);
        osc2.frequency.exponentialRampToValueAtTime(220, now + 0.08);
        gain2.gain.setValueAtTime(0.22, now + 0.035);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.085);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now + 0.035);
        osc2.stop(now + 0.085);
    }

    /**
     * 頭文字D風 ユーロビートBGMシンセサイザー
     * 高速155BPMのオクターブシンセベースとブラスコード、疾走感あるリフをループ生成
     */
    startEurobeatBGM() {
        if (!this.initialized || this.bgmInterval) return;

        // ユーロビートのコード進行（Am - F - G - Em パターン）
        // 周波数テーブル
        const noteFreqs = {
            'A1': 55.0, 'A2': 110.0, 'C2': 65.4, 'C3': 130.8,
            'D2': 73.4, 'D3': 146.8, 'E2': 82.4, 'E3': 164.8,
            'F1': 43.6, 'F2': 87.3, 'G1': 49.0, 'G2': 98.0,
            'A3': 220.0, 'B3': 246.9, 'C4': 261.6, 'D4': 293.7, 'E4': 329.6,
            'F4': 349.2, 'G4': 392.0, 'A4': 440.0
        };

        const bassPattern = [
            'A1', 'A2', 'A1', 'A2', 'A1', 'A2', 'A1', 'A2',
            'F1', 'F2', 'F1', 'F2', 'F1', 'F2', 'F1', 'F2',
            'G1', 'G2', 'G1', 'G2', 'G1', 'G2', 'G1', 'G2',
            'E2', 'E3', 'E2', 'E3', 'E2', 'E3', 'E2', 'E3'
        ];

        // 高揚感あるユーロビートのリードシンセメロディ
        const leadPattern = [
            'A4', null, 'C4', null, 'E4', null, 'D4', 'C4',
            'F4', null, 'E4', 'D4', 'C4', null, 'A3', null,
            'G4', null, 'F4', 'G4', 'A4', null, 'G4', 'F4',
            'E4', null, 'F4', 'E4', 'D4', null, 'E4', null
        ];

        const stepTime = (60 / this.bpm) / 4; // 16分音符
        this.bgmStep = 0;

        this.bgmInterval = setInterval(() => {
            if (!this.isBgmEnabled) return;
            const now = this.ctx.currentTime;
            const stepIdx = this.bgmStep % 32;

            // 1. オクターブベース音
            const bassNote = bassPattern[stepIdx];
            if (bassNote && noteFreqs[bassNote]) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sawtooth';
                bOsc.frequency.setValueAtTime(noteFreqs[bassNote], now);

                bGain.gain.setValueAtTime(0.22, now);
                bGain.gain.exponentialRampToValueAtTime(0.01, now + stepTime * 0.9);

                bOsc.connect(bGain);
                bGain.connect(this.bgmGain);
                bOsc.start(now);
                bOsc.stop(now + stepTime * 0.9);
            }

            // 2. ユーロビートのハイハット & キックドラム
            if (stepIdx % 4 === 0) {
                // キック
                const kOsc = this.ctx.createOscillator();
                const kGain = this.ctx.createGain();
                kOsc.frequency.setValueAtTime(140, now);
                kOsc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
                kGain.gain.setValueAtTime(0.4, now);
                kGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
                kOsc.connect(kGain);
                kGain.connect(this.bgmGain);
                kOsc.start(now);
                kOsc.stop(now + 0.09);
            } else if (stepIdx % 2 === 0) {
                // オフビート・ハイハット
                const hBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
                const hData = hBuf.getChannelData(0);
                for (let i = 0; i < hData.length; i++) hData[i] = (Math.random() * 2 - 1) * 0.2;
                const hSrc = this.ctx.createBufferSource();
                hSrc.buffer = hBuf;
                const hFilter = this.ctx.createBiquadFilter();
                hFilter.type = 'highpass';
                hFilter.frequency.setValueAtTime(6000, now);
                hSrc.connect(hFilter);
                hFilter.connect(this.bgmGain);
                hSrc.start(now);
            }

            // 3. リードシンセ（ブラス調）
            const leadNote = leadPattern[stepIdx];
            if (leadNote && noteFreqs[leadNote]) {
                const lOsc1 = this.ctx.createOscillator();
                const lOsc2 = this.ctx.createOscillator();
                const lFilter = this.ctx.createBiquadFilter();
                const lGain = this.ctx.createGain();

                lOsc1.type = 'sawtooth';
                lOsc2.type = 'sawtooth';
                lOsc1.frequency.setValueAtTime(noteFreqs[leadNote], now);
                lOsc2.frequency.setValueAtTime(noteFreqs[leadNote] * 1.004, now); // デチューンで太く

                lFilter.type = 'lowpass';
                lFilter.frequency.setValueAtTime(3200, now);
                lFilter.Q.setValueAtTime(3.0, now);

                lGain.gain.setValueAtTime(0.18, now);
                lGain.gain.exponentialRampToValueAtTime(0.01, now + stepTime * 1.8);

                lOsc1.connect(lFilter);
                lOsc2.connect(lFilter);
                lFilter.connect(lGain);
                lGain.connect(this.bgmGain);

                lOsc1.start(now);
                lOsc2.start(now);
                lOsc1.stop(now + stepTime * 1.8);
                lOsc2.stop(now + stepTime * 1.8);
            }

            this.bgmStep++;
        }, stepTime * 1000);
    }

    stopEurobeatBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    toggleBgm() {
        this.isBgmEnabled = !this.isBgmEnabled;
        return this.isBgmEnabled;
    }

    /**
     * ★頭文字DAC仕様：コーナー接近警告サウンド (ピピッ！)
     * @param {'blue'|'green'|'yellow'|'red'} severity 
     */
    playCornerWarning(severity = 'yellow') {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const isUrgent = (severity === 'red');
        const freqs = isUrgent ? [1320, 1760, 2093] : (severity === 'yellow' ? [1320, 1760] : [1046, 1320]);
        const toneDuration = 0.038;
        const interval = 0.048;

        freqs.forEach((freq, idx) => {
            const tStart = now + idx * interval;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, tStart);

            const vol = isUrgent ? 0.32 : 0.22;
            gain.gain.setValueAtTime(0.001, tStart);
            gain.gain.linearRampToValueAtTime(vol, tStart + 0.006);
            gain.gain.exponentialRampToValueAtTime(0.001, tStart + toneDuration);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(tStart);
            osc.stop(tStart + toneDuration + 0.01);
        });
    }
}

window.AudioManager = AudioManager;
