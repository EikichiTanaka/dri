/**
 * AudioManager.js - 超リアル・フィジカルモデリング・エンジンサウンド＆総合音響システム
 * 
 * 【音響物理モデリングの特長】
 * 1. 非対称エキゾースト圧力波形 (Asymmetric Exhaust Shock Wave WaveShaper):
 *    排気バルブ開口の爆圧衝撃波とシリンダー負圧行程の非対称性を再現し、偶数＋奇数の豊かな生々しい倍音を生成。
 * 2. 燃焼サイクル・ジッター (Combustion Cycle Jitter LFO):
 *    各気筒の燃焼圧力ばらつきとタコ足集合部での脈動をシミュレートし、シンセ特有の平坦さを排してガソリン爆発の粒立ち・鼓動を再現。
 * 3. 3バンド排気管共鳴フォルマント (3-Band Exhaust Acoustic Formants):
 *    - 140Hz: マフラー太鼓・メインサイレンサー膨張室の重低音胴鳴り
 *    - 720Hz: テールパイプ出口の乾いた喉鳴り
 *    - 2400Hz: 高回転時にタコ足（等長エキマニ）やチタン・ステン管が激しく共鳴する甲高い金属鳴き (Header Ringing)
 * 4. レブリミッター・バウンス (Rev Limiter Bouncing Stutter / 点火カット・スタッター):
 *    レッドライン到達時に毎秒18〜24Hzの高速点火カットチョッピング変調を起動！
 *    単調な持続音ではなく、「パパパパパパパパッ！」「ババババババババッ！」という鳥肌の立つレブ打ちを完全再現。
 * 5. 減速時デセル・クラックル (Deceleration Overrun Burble & Crackle):
 *    アクセルオフ時の排気管内アフターバーン・ランブルを付加。
 * 6. 車種別専用プロファイル (4A-GE, 13B, RB26, SR20, 1JZ/2JZ, 4G63, B16B, F5A):
 *    気筒数・過給器・点火特性に応じた完全個別チューニング。
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.bgmGain = null;

        // フィジカルモデリング・エンジンサウンド
        this.engineOscSub = null;       // クランク軸半次数サブベース (40〜120Hz)
        this.engineOscMain1 = null;     // 主燃焼パルス 1 (sawtooth)
        this.engineOscMain2 = null;     // 主燃焼パルス 2 (triangle/sawtooth)
        this.engineOscHigh = null;      // 高域金属倍音 (sawtooth)
        this.subGain = null;
        this.highGain = null;
        this.engineGain = null;

        // 非対称排気圧力波 WaveShaper
        this.engineWaveShaper = null;

        // 3バンド排気管共鳴フォルマントフィルター群
        this.engineBodyFilter = null;   // 140Hz マフラー胴鳴り (peaking)
        this.engineRaspFilter = null;   // 720Hz テールパイプ喉鳴り (peaking)
        this.engineRingFilter = null;   // 2400Hz タコ足金属鳴き (peaking)
        this.engineFilter = null;       // メイン可変吸排気ローパス (lowpass)

        // 燃焼サイクル・ジッター LFO (有機的脈動)
        this.combustionJitterSource = null;
        this.combustionJitterGain = null;

        // レブリミッター・スタッターチョッパー (18〜24Hz 点火カット)
        this.revLfo = null;
        this.revModGain = null;
        this.revChopperGain = null;
        this.isRevBouncing = false;

        // デセル・クラックル (減速時ランブルノイズ)
        this.decelNoiseSource = null;
        this.decelNoiseGain = null;
        this.decelFilter = null;
        this.prevThrottle = 0;

        // 4連スロットル吸気インダクション咆哮
        this.intakeNoiseNode = null;
        this.intakeFilter = null;
        this.intakeGain = null;

        // ターボチャージャー過給機ホイッスル
        this.turboOsc = null;
        this.turboFilter = null;
        this.turboGain = null;

        // ドリフトタイヤスキール音（実車アスファルト摩擦物理音響＆頭文字Dアーケード音響モデル）
        this.tireGain = null;
        this.tireNoiseSource = null;
        this.tireNoiseGain = null;
        this.tireBodyFilter = null;
        this.tireScreechFilter = null;
        this.tireSizzleFilter = null;
        this.tireLowpassFilter = null;
        this.tireWaveShaper = null;
        this.tireFlutterOsc = null;
        this.tireFlutterModGain = null;
        this.tireFlutterGain = null;

        // 環境音（ウェット水しぶき / 砂利 / 溝落とし）
        this.wetTireGain = null;
        this.wetTireFilter = null;
        this.gravelSource = null;
        this.gravelFilter = null;
        this.gravelGain = null;
        this.gutterSource = null;
        this.gutterFilter = null;
        this.gutterGain = null;

        // ユーロビートシーケンサー
        this.bgmInterval = null;
        this.bgmStep = 0;
        this.bpm = 155;

        this.initialized = false;
        this.soundType = '4age';
        this.isBgmEnabled = true;
        this.currentWeather = 'dry';

        // ユーザー操作による即座のWeb Audio自動アンロック
        this._unlockBound = false;
        this.setupUserUnlock();
    }

    setupUserUnlock() {
        if (this._unlockBound) return;
        this._unlockBound = true;

        const unlock = () => {
            if (!this.initialized) {
                this.init();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => {
                    console.log('[AudioManager] AudioContext resumed by user interaction.');
                });
            }
        };

        window.addEventListener('click', unlock, { passive: true });
        window.addEventListener('keydown', unlock, { passive: true });
        window.addEventListener('touchstart', unlock, { passive: true });
        window.addEventListener('pointerdown', unlock, { passive: true });
    }

    init() {
        if (this.initialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // マスターゲイン
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // SFX & BGM ゲイン
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        // 超リアル・フィジカルモデリング・セットアップ
        this.setupEngineSynth();
        this.setupTireSqueal();
        this.setupWetTireHiss();
        this.setupGravelSound();
        this.setupGutterSound();

        this.initialized = true;
        console.log('[AudioManager] Pro Physical Modeling Engine with Rev-Limiter Bouncing Initialized.');
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startEngineLoop() {
        if (!this.initialized) this.init();
        this.resume();
    }

    startEurobeatBGM() {
        if (!this.isBgmEnabled) return;
        this.startBGM();
    }

    stopEurobeatBGM() {
        this.stopBGM();
    }

    setWeather(weather) {
        this.currentWeather = weather || 'dry';
    }

    playWallHit(intensity = 1.0) {
        this.playCrashSound(intensity * 90);
    }

    playCornerWarning(severity = 'yellow') {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(severity === 'red' ? 1200 : 880, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.13);
    }

    playHeadlightSwitch() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.04);
        gain.gain.setValueAtTime(0.20, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playGutterDropSound() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);
        gain.gain.setValueAtTime(0.40, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.14);
    }

    playGutterExitSound() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.09);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.11);
    }

    onShiftChange(direction, fromGear, toGear, rpm) {
        this.playShiftSound();
    }

    /**
     * 非対称排気圧力波伝達カーブ (Asymmetric Exhaust Shock Wave Curve)
     * 正圧（排気バルブ開口の爆圧衝撃波）と負圧（シリンダー吸入・排気管負圧）を物理的に分離
     */
    _makeAsymmetricExhaustCurve(amount = 2.6) {
        const n = 4096;
        const curve = new Float32Array(n);
        const k = Math.max(0.5, amount);

        for (let i = 0; i < n; i++) {
            const x = (i * 2) / n - 1; // -1.0 〜 +1.0
            if (x >= 0) {
                // 正圧側：急速な立ち上がりと硬い飽和（タコ足の金属衝撃音、偶数＋奇数倍音）
                curve[i] = Math.tanh(k * x * 1.55) * 0.88 + 0.12 * Math.sin(Math.PI * x);
            } else {
                // 負圧側：緩やかな指数減衰（豊かな基音と暖かみのある低域共鳴）
                const denom = Math.exp(k * 0.75) - 1;
                curve[i] = (Math.exp(k * 0.75 * x) - 1) / (denom || 1) * 0.85;
            }
        }
        return curve;
    }

    /**
     * プロ・フィジカルモデリング・エンジンサウンド構築
     */
    setupEngineSynth() {
        const now = this.ctx.currentTime;
        const sampleRate = this.ctx.sampleRate;

        // 1. クランク軸半次数サブベース (排気量感・超低域パンチ 40〜120Hz)
        this.engineOscSub = this.ctx.createOscillator();
        this.engineOscSub.type = 'sine';
        this.subGain = this.ctx.createGain();
        this.subGain.gain.setValueAtTime(0.36, now);

        // 2. 主燃焼パルス (ノコギリ波＋デチューン波形)
        this.engineOscMain1 = this.ctx.createOscillator();
        this.engineOscMain1.type = 'sawtooth';

        this.engineOscMain2 = this.ctx.createOscillator();
        this.engineOscMain2.type = 'triangle';

        // 3. 高回転排気マニホールド金属倍音 (スポーツマフラーの甲高い咆哮)
        this.engineOscHigh = this.ctx.createOscillator();
        this.engineOscHigh.type = 'sawtooth';
        this.highGain = this.ctx.createGain();
        this.highGain.gain.setValueAtTime(0.24, now);

        // 4. 燃焼サイクル・ジッター LFO (内燃機関の生々しい爆発脈動・気筒差)
        const jitterLen = sampleRate * 3;
        const jitterBuf = this.ctx.createBuffer(1, jitterLen, sampleRate);
        const jData = jitterBuf.getChannelData(0);
        let lastJ = 0;
        for (let i = 0; i < jitterLen; i++) {
            const white = Math.random() * 2 - 1;
            // 4〜12Hzの低周波カオス脈動
            lastJ = 0.995 * lastJ + 0.005 * white;
            jData[i] = lastJ * 4.5 + Math.sin(i * 0.004) * 0.4;
        }
        this.combustionJitterSource = this.ctx.createBufferSource();
        this.combustionJitterSource.buffer = jitterBuf;
        this.combustionJitterSource.loop = true;
        this.combustionJitterGain = this.ctx.createGain();
        this.combustionJitterGain.gain.setValueAtTime(4.2, now); // ±4.2Hz ピッチ微細カオス脈動
        this.combustionJitterSource.connect(this.combustionJitterGain);
        this.combustionJitterGain.connect(this.engineOscMain1.frequency);
        this.combustionJitterGain.connect(this.engineOscMain2.frequency);

        // 5. 排気管非対称ショックウェーブ・サチュレーター (WaveShaper)
        this.engineWaveShaper = this.ctx.createWaveShaper();
        this.engineWaveShaper.curve = this._makeAsymmetricExhaustCurve(2.6);
        this.engineWaveShaper.oversample = '2x';

        // 6. 3バンド排気管・マフラー音響共鳴フォルマントフィルター群
        // フォルマント①: マフラー膨張室・胴鳴り共鳴 (140Hz, +6.0dB, Q: 1.8)
        this.engineBodyFilter = this.ctx.createBiquadFilter();
        this.engineBodyFilter.type = 'peaking';
        this.engineBodyFilter.frequency.setValueAtTime(140, now);
        this.engineBodyFilter.gain.setValueAtTime(6.0, now);
        this.engineBodyFilter.Q.setValueAtTime(1.8, now);

        // フォルマント②: テールパイプ喉鳴り共鳴 (720Hz, +7.5dB, Q: 2.2)
        this.engineRaspFilter = this.ctx.createBiquadFilter();
        this.engineRaspFilter.type = 'peaking';
        this.engineRaspFilter.frequency.setValueAtTime(720, now);
        this.engineRaspFilter.gain.setValueAtTime(7.5, now);
        this.engineRaspFilter.Q.setValueAtTime(2.2, now);

        // フォルマント③: タコ足（等長エキマニ）金属鳴き・ステンレス高域共鳴 (2400Hz, +5.5dB, Q: 3.0)
        this.engineRingFilter = this.ctx.createBiquadFilter();
        this.engineRingFilter.type = 'peaking';
        this.engineRingFilter.frequency.setValueAtTime(2400, now);
        this.engineRingFilter.gain.setValueAtTime(5.5, now);
        this.engineRingFilter.Q.setValueAtTime(3.0, now);

        // メイン可変吸排気ローパスフィルター (スロットル開度・回転数でダイナミック開閉)
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(800, now);
        this.engineFilter.Q.setValueAtTime(2.2, now);

        // 7. レブリミッター・スタッターチョッパー (10〜13Hz 実車点火カット変調)
        this.revChopperGain = this.ctx.createGain();
        this.revChopperGain.gain.setValueAtTime(1.0, now);

        this.revLfo = this.ctx.createOscillator();
        this.revLfo.type = 'sawtooth'; // 急峻なカット＆急激な再点火
        this.revLfo.frequency.setValueAtTime(11.5, now); // AE86デフォルト 11.5Hz
        this.revModGain = this.ctx.createGain();
        this.revModGain.gain.setValueAtTime(0.0, now); // 通常時は0（変調なし）
        this.revLfo.connect(this.revModGain);
        this.revModGain.connect(this.revChopperGain.gain);

        // 8. デセル・クラックル (減速時エンジンブレーキ・排気管ランブル)
        const decelBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
        const dData = decelBuf.getChannelData(0);
        for (let i = 0; i < dData.length; i++) {
            const w = Math.random() * 2 - 1;
            // 粗いスパイク状の未燃焼ガス爆発
            dData[i] = (Math.random() < 0.08) ? w * 0.9 : w * 0.12;
        }
        this.decelNoiseSource = this.ctx.createBufferSource();
        this.decelNoiseSource.buffer = decelBuf;
        this.decelNoiseSource.loop = true;
        this.decelFilter = this.ctx.createBiquadFilter();
        this.decelFilter.type = 'bandpass';
        this.decelFilter.frequency.setValueAtTime(180, now);
        this.decelFilter.Q.setValueAtTime(2.5, now);
        this.decelNoiseGain = this.ctx.createGain();
        this.decelNoiseGain.gain.setValueAtTime(0.0, now);
        this.decelNoiseSource.connect(this.decelFilter);
        this.decelFilter.connect(this.decelNoiseGain);

        // 9. 吸気サージタンク・4連スロットルインダクション咆哮
        const intakeBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
        const nData = intakeBuf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < nData.length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            nData[i] = (b0 + b1 + b2 + white * 0.5362) * 0.12;
        }
        this.intakeNoiseNode = this.ctx.createBufferSource();
        this.intakeNoiseNode.buffer = intakeBuf;
        this.intakeNoiseNode.loop = true;
        this.intakeFilter = this.ctx.createBiquadFilter();
        this.intakeFilter.type = 'bandpass';
        this.intakeFilter.frequency.setValueAtTime(320, now);
        this.intakeFilter.Q.setValueAtTime(2.0, now);
        this.intakeGain = this.ctx.createGain();
        this.intakeGain.gain.setValueAtTime(0.0, now);

        // 10. ターボチャージャー過給機ホイッスル
        this.turboOsc = this.ctx.createOscillator();
        this.turboOsc.type = 'sine';
        this.turboFilter = this.ctx.createBiquadFilter();
        this.turboFilter.type = 'bandpass';
        this.turboFilter.frequency.setValueAtTime(2400, now);
        this.turboFilter.Q.setValueAtTime(4.0, now);
        this.turboGain = this.ctx.createGain();
        this.turboGain.gain.setValueAtTime(0.0, now);

        // 11. エンジンマスターゲイン
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.0, now);

        // 【音響ルーティング】
        // [Main1 + Main2] -> [WaveShaper] -> [BodyFilter (140Hz)] -> [RaspFilter (720Hz)] -> [RingFilter (2400Hz)] -> [Lowpass] -> [RevChopperGain]
        this.engineOscMain1.connect(this.engineWaveShaper);
        this.engineOscMain2.connect(this.engineWaveShaper);
        this.engineWaveShaper.connect(this.engineBodyFilter);
        this.engineBodyFilter.connect(this.engineRaspFilter);
        this.engineRaspFilter.connect(this.engineRingFilter);
        this.engineRingFilter.connect(this.engineFilter);
        this.engineFilter.connect(this.revChopperGain);

        // [High-Overtone] -> [HighGain] -> [RingFilter]
        this.engineOscHigh.connect(this.highGain);
        this.highGain.connect(this.engineRingFilter);

        // [Sub-Bass] -> [SubGain] -> [RevChopperGain]
        this.engineOscSub.connect(this.subGain);
        this.subGain.connect(this.revChopperGain);

        // [Intake Noise] -> [IntakeFilter] -> [IntakeGain] -> [RevChopperGain]
        this.intakeNoiseNode.connect(this.intakeFilter);
        this.intakeFilter.connect(this.intakeGain);
        this.intakeGain.connect(this.revChopperGain);

        // [Decel Overrun] -> [DecelGain] -> [RevChopperGain]
        this.decelNoiseGain.connect(this.revChopperGain);

        // [Turbo Spool] -> [TurboFilter] -> [TurboGain] -> [RevChopperGain]
        this.turboOsc.connect(this.turboFilter);
        this.turboFilter.connect(this.turboGain);
        this.turboGain.connect(this.revChopperGain);

        // [RevChopperGain] -> [EngineGain] -> [SFX Master]
        this.revChopperGain.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);

        // 発振開始
        this.engineOscSub.start();
        this.engineOscMain1.start();
        this.engineOscMain2.start();
        this.engineOscHigh.start();
        this.combustionJitterSource.start();
        this.revLfo.start();
        this.decelNoiseSource.start();
        this.intakeNoiseNode.start();
        this.turboOsc.start();
    }

    setEngineSoundType(type) {
        this.soundType = type || '4age';
        if (!this.initialized || !this.engineOscMain1) return;

        // 車種別の波形＆非対称歪みカーブ設定
        if (this.soundType === '13b') {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'sine';
            this.engineWaveShaper.curve = this._makeAsymmetricExhaustCurve(2.0);
            this.revLfo.frequency.setValueAtTime(13.5, this.ctx.currentTime); // ロータリー高速レブ打ち 13.5Hz
        } else if (this.soundType === 'rb26') {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'triangle';
            this.engineWaveShaper.curve = this._makeAsymmetricExhaustCurve(3.2);
            this.revLfo.frequency.setValueAtTime(10.5, this.ctx.currentTime); // 直6重厚レブ打ち 10.5Hz
        } else if (this.soundType === '1jz' || this.soundType === '2jz') {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'triangle';
            this.engineWaveShaper.curve = this._makeAsymmetricExhaustCurve(2.8);
            this.revLfo.frequency.setValueAtTime(10.5, this.ctx.currentTime);
        } else if (this.soundType === 'b16b') {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'sawtooth';
            this.engineWaveShaper.curve = this._makeAsymmetricExhaustCurve(2.9);
            this.revLfo.frequency.setValueAtTime(12.0, this.ctx.currentTime); // VTEC鋭利レブ打ち 12.0Hz
        } else if (this.soundType === 'f5a') {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'triangle';
            this.engineWaveShaper.curve = this._makeAsymmetricExhaustCurve(2.4);
            this.revLfo.frequency.setValueAtTime(11.0, this.ctx.currentTime);
        } else {
            // 4A-GE (AE86) / SR20
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'triangle';
            this.engineWaveShaper.curve = this._makeAsymmetricExhaustCurve(2.7);
            this.revLfo.frequency.setValueAtTime(11.5, this.ctx.currentTime); // AE86 11.5Hz
        }
    }

    /**
     * リアルタイム物理・音響更新（RPM, スロットル開度, ドリフト状態, レブ打ち連動）
     */
    updateEngine(rpm, throttle, isDrifting, driftAngle, isRevLimiter = false, redlineRpm = 8500, speed = 0, brake = 0, handbrake = false) {
        if (!this.initialized || !this.ctx) return;

        const curTime = this.ctx.currentTime;
        throttle = Math.max(0, Math.min(1.0, throttle || 0));
        rpm = Math.max(800, rpm || 800);

        // 車種別の音響パラメータプロファイル
        let orderMult = 2.0;       // 点火次数 (4気筒=2.0, 6気筒/ロータリー=3.0, 3気筒=1.5)
        let maxRpmRef = 11000;
        let baseCutoff = 540;
        let rangeCutoff = 5800;
        let throttleCutoff = 2600;
        let subBassWeight = 0.36;
        let highRaspWeight = 0.24;
        let ringGainWeight = 0.20;
        let isTurbo = false;
        let revBounceHz = 11.5;

        if (this.soundType === '4age') {
            // AE86 トレノ: 4A-GEU 1.6L 4気筒 4連スロットル NA高回転 (11,000rpm)
            orderMult = 2.0;
            maxRpmRef = 10500;
            baseCutoff = 600;
            rangeCutoff = 6500;
            throttleCutoff = 3400;
            subBassWeight = 0.33;
            highRaspWeight = (rpm > 6500) ? 0.40 : 0.25;
            ringGainWeight = (rpm > 7000) ? 0.45 : 0.22; // 高回転でタコ足金属鳴きが強烈に抜ける！
            isTurbo = false;
            revBounceHz = 11.5;
        } else if (this.soundType === '13b') {
            // FD3S RX-7: 13B-REW 2ローター・シーケンシャルツインターボ
            orderMult = 3.0;
            maxRpmRef = 8500;
            baseCutoff = 740;
            rangeCutoff = 7000;
            throttleCutoff = 2800;
            subBassWeight = 0.26;
            highRaspWeight = 0.38;
            ringGainWeight = 0.30;
            isTurbo = true;
            revBounceHz = 13.5;
        } else if (this.soundType === 'rb26') {
            // BNR32 GT-R: RB26DETT 2.6L 直6ツインターボ
            orderMult = 3.0;
            maxRpmRef = 8500;
            baseCutoff = 440;
            rangeCutoff = 5600;
            throttleCutoff = 3800;
            subBassWeight = 0.52; // 強烈な低域パンチ
            highRaspWeight = 0.28;
            ringGainWeight = 0.25;
            isTurbo = true;
            revBounceHz = 10.5;
        } else if (this.soundType === 'sr20') {
            // S13 / S15 シルビア: SR20DET 2.0L 4気筒ターボ
            orderMult = 2.0;
            maxRpmRef = 7800;
            baseCutoff = 520;
            rangeCutoff = 5600;
            throttleCutoff = 3000;
            subBassWeight = 0.42;
            highRaspWeight = 0.24;
            ringGainWeight = 0.24;
            isTurbo = true;
            revBounceHz = 11.0;
        } else if (this.soundType === '1jz' || this.soundType === '2jz') {
            // JZX100 チェイサー / JZA80 スープラ: 1JZ/2JZ 直6ターボ
            orderMult = 3.0;
            maxRpmRef = 8200;
            baseCutoff = 460;
            rangeCutoff = 6000;
            throttleCutoff = 3500;
            subBassWeight = 0.50;
            highRaspWeight = 0.30;
            ringGainWeight = 0.28;
            isTurbo = true;
            revBounceHz = 10.5;
        } else if (this.soundType === '4g63') {
            // CE9A エボIII: 4G63 2.0L ハイブースト4気筒ターボ
            orderMult = 2.0;
            maxRpmRef = 8200;
            baseCutoff = 500;
            rangeCutoff = 5800;
            throttleCutoff = 3400;
            subBassWeight = 0.46;
            highRaspWeight = 0.27;
            ringGainWeight = 0.26;
            isTurbo = true;
            revBounceHz = 11.0;
        } else if (this.soundType === 'b16b') {
            // EK9 シビック Type R: B16B 1.6L 9000rpm VTEC
            orderMult = 2.0;
            maxRpmRef = 9500;
            const isVtec = (rpm > 5800);
            baseCutoff = isVtec ? 900 : 540;
            rangeCutoff = isVtec ? 8200 : 5600;
            throttleCutoff = isVtec ? 4000 : 2400;
            subBassWeight = 0.29;
            highRaspWeight = isVtec ? 0.48 : 0.24; // VTEC領域で超高域が激変！
            ringGainWeight = isVtec ? 0.55 : 0.20;
            isTurbo = false;
            revBounceHz = 12.0;
        } else if (this.soundType === 'f5a') {
            // アルトワークス: F5A 550cc 3気筒ドッカンターボ
            orderMult = 1.5;
            maxRpmRef = 10000;
            const isBoost = (rpm > 4500);
            baseCutoff = isBoost ? 680 : 450;
            rangeCutoff = isBoost ? 6400 : 4700;
            throttleCutoff = isBoost ? 3400 : 1700;
            subBassWeight = 0.32;
            highRaspWeight = 0.32;
            ringGainWeight = 0.25;
            isTurbo = true;
            revBounceHz = 11.0;
        }

        // 1. 基本点火周波数 (Firing Frequency) の物理計算
        const baseFreq = Math.max(30, (rpm / 60) * orderMult);
        const rpmNorm = Math.min(1.25, Math.max(0, rpm / maxRpmRef));

        // 2. オシレーター群の周波数更新
        this.engineOscSub.frequency.setTargetAtTime(baseFreq * 0.5, curTime, 0.025);
        this.engineOscMain1.frequency.setTargetAtTime(baseFreq, curTime, 0.025);
        this.engineOscMain2.frequency.setTargetAtTime(baseFreq * 2.008, curTime, 0.025);
        this.engineOscHigh.frequency.setTargetAtTime(baseFreq * 3.015, curTime, 0.025);

        // ドリフト状態の強度 (0.0 〜 1.0)
        // ドリフト中、深い横滑り角、または急制動・サイド引き時にリアルに立ち上がる
        const absAngle = Math.abs(driftAngle || 0);
        let driftIntensity = 0;
        if (isDrifting) {
            driftIntensity = Math.min(1.0, Math.max(0.35, absAngle * 2.2));
        } else if (absAngle > 0.08) {
            // ドリフト突入直前または限界コーナリング時のタイヤスクラブ摩擦
            driftIntensity = Math.min(0.48, (absAngle - 0.08) * 2.4);
        } else if ((brake > 0.55 || handbrake) && speed > 22) {
            // 急制動・サイド引きによるブレーキングスキッド摩擦
            const brakeSkid = handbrake ? 0.65 : Math.min(0.70, (brake - 0.55) * 1.6);
            driftIntensity = Math.min(0.70, brakeSkid * Math.min(1.0, speed / 50.0));
        }

        // 3. サブベース＆高域金属音ゲイン（ドリフト中はタイヤスキールを濁らせないよう適正化）
        this.subGain.gain.setTargetAtTime(subBassWeight * (0.80 + throttle * 0.32), curTime, 0.03);
        this.highGain.gain.setTargetAtTime(highRaspWeight * (0.45 + rpmNorm * 0.65 + throttle * 0.30), curTime, 0.03);

        // 4. マフラー・エキゾースト管共鳴フォルマントのダイナミック追従
        const bodyFreq = 135 + rpmNorm * 45;
        this.engineBodyFilter.frequency.setTargetAtTime(bodyFreq, curTime, 0.04);

        const raspFreq = 700 + rpmNorm * 260;
        this.engineRaspFilter.frequency.setTargetAtTime(raspFreq, curTime, 0.04);

        // タコ足金属鳴き（通常時は金属音を響かせ、ドリフト時はタイヤスキール(2.2〜3.5kHz)の周波数帯を空けるため控えめに抑制）
        const ringFreq = 2300 + rpmNorm * 400;
        const ringGainVal = ringGainWeight * (isDrifting ? 8.0 : 16.0);
        this.engineRingFilter.frequency.setTargetAtTime(ringFreq, curTime, 0.04);
        this.engineRingFilter.gain.setTargetAtTime(ringGainVal, curTime, 0.04);

        // 5. 吸排気可変ローパスフィルター
        const targetCutoff = baseCutoff + (rpmNorm * rangeCutoff) + (throttle * throttleCutoff);
        this.engineFilter.frequency.setTargetAtTime(targetCutoff, curTime, 0.03);

        // 6. 吸気サージタンク・4連スロットル咆哮
        const intakeVol = Math.max(0, (throttle * 0.30) + (rpmNorm * 0.14 * throttle));
        const intakeFreq = 260 + (throttle * 240) + (rpmNorm * 180);
        this.intakeFilter.frequency.setTargetAtTime(intakeFreq, curTime, 0.03);
        this.intakeGain.gain.setTargetAtTime(intakeVol, curTime, 0.03);

        // 7. ★レブリミッター・スタッターバウンス (点火カット・チョッピング変調)
        this.revLfo.frequency.setValueAtTime(revBounceHz, curTime);

        if (isRevLimiter && throttle > 0.45) {
            // レブリミット到達＆アクセル踏み続け中：
            // 毎秒約10〜13Hzの実車ECU点火カット周期でリアルなレブ打ちスタッターを炸裂！
            this.revModGain.gain.setValueAtTime(0.88, curTime);
            // 点火カットと再着火の荒々しい高域スパイク
            this.engineFilter.frequency.setValueAtTime(targetCutoff * 1.45, curTime);
            this.engineRingFilter.gain.setValueAtTime(ringGainWeight * 26.0, curTime);
            // 点火抜けによる微小ピッチドロップ変調
            const bouncePitchFactor = 0.94 + Math.sin(curTime * revBounceHz * Math.PI * 2) * 0.06;
            this.engineOscMain1.frequency.setValueAtTime(baseFreq * bouncePitchFactor, curTime);
        } else {
            // 通常走行時：変調オフ（スムーズなエンジン回転音）
            this.revModGain.gain.setValueAtTime(0.0, curTime);
        }

        // 8. 減速時デセル・クラックル（エンジンブレーキ・アクセル急閉時のランブル）
        const throttleDrop = (this.prevThrottle > 0.35 && throttle < 0.15);
        if (throttleDrop || (throttle < 0.12 && rpm > 3600)) {
            const decelVol = Math.min(0.22, (rpm / maxRpmRef) * 0.26);
            this.decelNoiseGain.gain.setTargetAtTime(decelVol, curTime, 0.02);
        } else {
            this.decelNoiseGain.gain.setTargetAtTime(0.0, curTime, 0.06);
        }
        this.prevThrottle = throttle;

        // 9. ターボチャージャー過給スピナー音
        if (isTurbo && throttle > 0.12 && rpm > 3200) {
            const turboFreq = 1400 + (rpmNorm * 2200) + (throttle * 600);
            const turboVol = Math.min(0.20, 0.05 + (throttle * 0.12) + (rpmNorm * 0.06));
            this.turboOsc.frequency.setTargetAtTime(turboFreq, curTime, 0.04);
            this.turboFilter.frequency.setTargetAtTime(turboFreq, curTime, 0.04);
            this.turboGain.gain.setTargetAtTime(turboVol, curTime, 0.04);
        } else {
            this.turboGain.gain.setTargetAtTime(0.0, curTime, 0.06);
        }

        // 10. エンジンマスター音量（ドリフト時の動的サイドチェイン・ダッキングでスキール音を主役に）
        const baseEngineVol = 0.22 + (throttle * 0.30) + (rpmNorm * 0.24);
        // ドリフト強度に応じてエンジン音量を最大35%ダッキング（-3.7dB）
        const driftDucking = 1.0 - (driftIntensity * 0.35);
        const masterVol = baseEngineVol * driftDucking;
        this.engineGain.gain.setTargetAtTime(masterVol, curTime, 0.025);

        // 11. ドリフト時のタイヤスキール音（実車アスファルト摩擦物理音響＆頭文字Dアーケード仕様）
        let squealVol = 0;

        if (driftIntensity > 0 && this.tireScreechFilter) {
            // 車速に応じたフェード（低速16km/h以下ではカット、38km/h以上で全開）
            const speedFactor = Math.min(1.0, Math.max(0.0, (speed - 16) / 22));

            // 実車＆アーケード基準の力強い音量（最大約0.95）
            squealVol = (0.35 + driftIntensity * 0.65) * (0.80 + throttle * 0.20) * speedFactor;

            // 車速・ドリフト強度に応じた実車物理サンプルのplaybackRate動的推移（0.88〜1.16）
            // 偽のシンセ音ではなく、摩擦テクスチャ自体の再生速度が滑らかに追従
            if (this.tireNoiseSource && this.tireNoiseSource.playbackRate) {
                const speedNorm = Math.min(1.0, Math.max(0.0, speed / 130.0));
                const targetRate = 0.88 + (speedNorm * 0.20) + (driftIntensity * 0.08);
                this.tireNoiseSource.playbackRate.setTargetAtTime(targetRate, curTime, 0.04);
            }

            // トレッド破裂スクリーチ帯域の自然な推移（1,750Hz〜2,350Hz）
            const screechFreq = 1750 + (driftIntensity * 400) + (Math.min(1.0, speed / 120.0) * 200);
            this.tireScreechFilter.frequency.setTargetAtTime(screechFreq, curTime, 0.04);

            // 車輪回転フラッター変調（控えめな4〜5%で自然な揺らぎを維持）
            if (this.tireFlutterOsc) {
                const flutterRate = 14.0 + Math.min(6.0, (speed / 100.0) * 4.0 + driftIntensity * 2.0);
                this.tireFlutterOsc.frequency.setTargetAtTime(flutterRate, curTime, 0.04);
            }
        }

        if (this.tireGain) {
            this.tireGain.gain.setTargetAtTime(squealVol, curTime, 0.035);
        }
    }

    /**
     * ガレージ画面用：実車仕様の空ぶかしサウンドプレビュー
     */
    previewRev(carId, onPopCallback = null) {
        if (!this.initialized) {
            this.init();
        }
        this.resume();

        const car = window.CAR_DATABASE && window.CAR_DATABASE[carId];
        const soundType = car && car.physics ? car.physics.engineSoundType : '4age';
        this.setEngineSoundType(soundType);

        const redline = (car && car.physics && car.physics.redlineRpm) ? car.physics.redlineRpm : 8000;
        let currentRpm = 1000;
        let step = 0;

        const revInterval = setInterval(() => {
            step++;
            if (step <= 22) {
                // スロットル全開で一気に吹け上がり
                currentRpm += (redline * 0.95 - currentRpm) * 0.24;
                this.updateEngine(currentRpm, 1.0, false, 0, false, redline);
            } else if (step <= 36) {
                // レッドゾーン到達：爽快なレブ打ちバウンス！
                const isBounce = true;
                currentRpm = redline - Math.random() * 140;
                this.updateEngine(currentRpm, 1.0, false, 0, isBounce, redline);
                if (step % 5 === 0) {
                    this.playAfterfireSound(0.75);
                    if (onPopCallback) onPopCallback(0.75);
                }
            } else if (step <= 48) {
                // アクセル全閉＆減速クラックル＋アフターファイヤ
                currentRpm -= (currentRpm - 1000) * 0.24;
                this.updateEngine(currentRpm, 0.0, false, 0, false, redline);
                if (step === 33) {
                    this.playAfterfireSound(1.2);
                    if (onPopCallback) onPopCallback(1.2);
                }
            } else {
                this.updateEngine(1000, 0.0, false, 0, false, redline);
                clearInterval(revInterval);
            }
        }, 16);
    }

    setupTireSqueal() {
        const sampleRate = this.ctx.sampleRate;
        // 4.0秒のステレオ・スティックスリップ物理摩擦バッファ
        const bufferSize = sampleRate * 4;
        const noiseBuffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
        const leftChannel = noiseBuffer.getChannelData(0);
        const rightChannel = noiseBuffer.getChannelData(1);

        // ★実車アスファルト・スティックスリップ摩擦モデリング（2chステレオ独立生成）
        // ゴムのブロックがアスファルト微細骨材に引っかかり、弾性限界で弾け飛ぶ非ガウス・衝撃波ノイズ
        for (let ch = 0; ch < 2; ch++) {
            const out = (ch === 0) ? leftChannel : rightChannel;
            let pink = 0.0;
            let brown = 0.0;
            let snapState = 0.0;
            const snapDecay = Math.exp(-1.0 / (sampleRate * 0.0004)); // 0.4msのゴム復元緩和時間

            for (let i = 0; i < bufferSize; i++) {
                const w = Math.random() * 2.0 - 1.0;
                // 非ガウス尖頭性（kurtosis）スティックスリップ微小衝撃
                let impact;
                if (Math.random() < 0.22) {
                    impact = Math.sign(w) * Math.pow(Math.abs(w), 1.6);
                } else {
                    impact = w * 0.12;
                }
                snapState = snapState * snapDecay + impact * (1.0 - snapDecay);

                // アスファルトの粗面テクスチャ（ピンクノイズ & ブラウンノイズ）
                pink = 0.86 * pink + 0.14 * w;
                brown = 0.96 * brown + 0.04 * w;

                // 複合摩擦テクスチャ合成
                out[i] = impact * 0.38 + snapState * 0.32 + pink * 0.20 + brown * 0.10;
            }

            // ループ終端と先頭のスムーズクロスフェード
            const fadeLen = 4096;
            for (let i = 0; i < fadeLen; i++) {
                const factor = i / fadeLen;
                const startVal = out[i];
                const endVal = out[bufferSize - fadeLen + i];
                out[i] = (1.0 - factor) * endVal + factor * startVal;
                out[bufferSize - fadeLen + i] = out[i];
            }

            // 正規化（ピーク0.95）
            let maxVal = 0.001;
            for (let i = 0; i < bufferSize; i++) {
                const absVal = Math.abs(out[i]);
                if (absVal > maxVal) maxVal = absVal;
            }
            const normFactor = 0.95 / maxVal;
            for (let i = 0; i < bufferSize; i++) {
                out[i] *= normFactor;
            }
        }

        // 摩擦ループ音源（車速・スリップ角に応じてplaybackRateを動的追従）
        this.tireNoiseSource = this.ctx.createBufferSource();
        this.tireNoiseSource.buffer = noiseBuffer;
        this.tireNoiseSource.loop = true;

        this.tireNoiseGain = this.ctx.createGain();
        this.tireNoiseGain.gain.setValueAtTime(1.8, this.ctx.currentTime);
        this.tireNoiseSource.connect(this.tireNoiseGain);

        // =========================================================================
        // ★実車＆頭文字Dアーケード・マルチバンド音響イコライジング（広帯域・非発振）
        // 単一の鋭い共鳴（笛や叫び声）を排し、本物のタイヤがアスファルトを引き裂く「シャアァァ！」を形成
        // =========================================================================

        // ① 低中域タイヤ接地スクラブ（850Hz, Q: 1.0, +3.0dB）
        this.tireBodyFilter = this.ctx.createBiquadFilter();
        this.tireBodyFilter.type = 'peaking';
        this.tireBodyFilter.frequency.setValueAtTime(850, this.ctx.currentTime);
        this.tireBodyFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);
        this.tireBodyFilter.gain.setValueAtTime(3.0, this.ctx.currentTime);

        // ② 中高域トレッドせん断スクリーチ（1,850Hz, Q: 1.2, +5.5dB）
        this.tireScreechFilter = this.ctx.createBiquadFilter();
        this.tireScreechFilter.type = 'peaking';
        this.tireScreechFilter.frequency.setValueAtTime(1850, this.ctx.currentTime);
        this.tireScreechFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);
        this.tireScreechFilter.gain.setValueAtTime(5.5, this.ctx.currentTime);

        // ③ 高域微細骨材シズル・スモークバイト（3,600Hz, +2.5dB Highshelf）
        this.tireSizzleFilter = this.ctx.createBiquadFilter();
        this.tireSizzleFilter.type = 'highshelf';
        this.tireSizzleFilter.frequency.setValueAtTime(3600, this.ctx.currentTime);
        this.tireSizzleFilter.gain.setValueAtTime(2.5, this.ctx.currentTime);

        // ④ 超高域デジタルノイズカット（8,200Hz, Lowpass）
        // 耳障りなホワイトノイズ感をカットし、実車の生ゴムらしい太い摩擦音へ整形
        this.tireLowpassFilter = this.ctx.createBiquadFilter();
        this.tireLowpassFilter.type = 'lowpass';
        this.tireLowpassFilter.frequency.setValueAtTime(8200, this.ctx.currentTime);
        this.tireLowpassFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);

        // フィルター直列接続
        this.tireNoiseGain.connect(this.tireBodyFilter);
        this.tireBodyFilter.connect(this.tireScreechFilter);
        this.tireScreechFilter.connect(this.tireSizzleFilter);
        this.tireSizzleFilter.connect(this.tireLowpassFilter);

        // =========================================================================
        // ★滑り摩擦サチュレーション（Soft Saturation WaveShaper）
        // =========================================================================
        const nPts = 256;
        const curve = new Float32Array(nPts);
        for (let i = 0; i < nPts; i++) {
            const x = (i * 2.0 / (nPts - 1)) - 1.0;
            curve[i] = Math.tanh(1.2 * x);
        }
        this.tireWaveShaper = this.ctx.createWaveShaper();
        this.tireWaveShaper.curve = curve;
        this.tireWaveShaper.oversample = '2x';

        this.tireLowpassFilter.connect(this.tireWaveShaper);

        // =========================================================================
        // ★回転スリップ・フラッター変調（Wheel-Spin Flutter LFO）
        // 控えめな4〜5%の揺らぎで自然なテクスチャを維持（叫び声やバタつきは一切排除）
        // =========================================================================
        this.tireFlutterOsc = this.ctx.createOscillator();
        this.tireFlutterOsc.type = 'sine';
        this.tireFlutterOsc.frequency.setValueAtTime(16, this.ctx.currentTime);

        this.tireFlutterModGain = this.ctx.createGain();
        this.tireFlutterModGain.gain.setValueAtTime(0.035, this.ctx.currentTime);

        this.tireFlutterGain = this.ctx.createGain();
        this.tireFlutterGain.gain.setValueAtTime(0.88, this.ctx.currentTime);

        this.tireFlutterOsc.connect(this.tireFlutterModGain);
        this.tireFlutterModGain.connect(this.tireFlutterGain.gain);

        this.tireWaveShaper.connect(this.tireFlutterGain);

        // =========================================================================
        // ★マスタータイヤスキールゲイン -> SFX Master
        // =========================================================================
        this.tireGain = this.ctx.createGain();
        this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.tireFlutterGain.connect(this.tireGain);
        this.tireGain.connect(this.sfxGain);

        // 発振開始
        this.tireNoiseSource.start();
        this.tireFlutterOsc.start();
    }

    playShiftSound() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        // シフトショック・メカニカルクラッチ接続音
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);

        gain.gain.setValueAtTime(0.32, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.085);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.09);
    }

    playAfterfireSound(intensity = 1.0, isRival = false) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const volMultiplier = (isRival ? 0.65 : 1.0) * Math.min(1.4, Math.max(0.5, intensity));

        this._synthesizeExhaustPop(now, volMultiplier, 1.0);

        if (intensity > 0.85 && Math.random() < 0.65) {
            const delay = 0.045 + Math.random() * 0.035;
            this._synthesizeExhaustPop(now + delay, volMultiplier * 0.55, 1.25);
        }
    }

    _synthesizeExhaustPop(time, volume, pitchFactor = 1.0) {
        // A. 排気ガス破裂音（クリック＆破裂インパルス）
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const decay = Math.exp(-i / (this.ctx.sampleRate * 0.012));
            data[i] = (Math.random() * 2 - 1) * decay;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const popFilter = this.ctx.createBiquadFilter();
        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(450 * pitchFactor, time);
        popFilter.Q.setValueAtTime(1.8, time);

        const popGain = this.ctx.createGain();
        popGain.gain.setValueAtTime(0.48 * volume, time);
        popGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        noise.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(this.sfxGain);
        noise.start(time);
        noise.stop(time + 0.08);

        // B. マフラー膨張室の低音キック（ドンッという重低音インパルス）
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'triangle';
        kickOsc.frequency.setValueAtTime(155 * pitchFactor, time);
        kickOsc.frequency.exponentialRampToValueAtTime(42, time + 0.07);

        kickGain.gain.setValueAtTime(0.55 * volume, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.075);

        kickOsc.connect(kickGain);
        kickGain.connect(this.sfxGain);
        kickOsc.start(time);
        kickOsc.stop(time + 0.08);
    }

    playRocketStartSound(rpm) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const rFactor = Math.min(1.0, (rpm - 2800) / 7200);

        // 強烈なホイールスピン衝撃音
        this.playAfterfireSound(1.15 + rFactor * 0.35);

        // 低域インパクト
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);

        gain.gain.setValueAtTime(0.65 + rFactor * 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playCrashSound(speed) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;
        const intensity = Math.min(1.0, speed / 120);

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(25, now + 0.25);

        gain.gain.setValueAtTime(intensity * 0.75, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playCountdownBeep(isGo = false) {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(isGo ? 880 : 440, now);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.35 : 0.15));

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + (isGo ? 0.36 : 0.16));
    }

    playDriftAwardSound() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.05);

            gain.gain.setValueAtTime(0.18, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.14);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.15);
        });
    }

    setupWetTireHiss() {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const hissSource = this.ctx.createBufferSource();
        hissSource.buffer = noiseBuffer;
        hissSource.loop = true;

        this.wetTireFilter = this.ctx.createBiquadFilter();
        this.wetTireFilter.type = 'bandpass';
        this.wetTireFilter.frequency.setValueAtTime(2800, this.ctx.currentTime);
        this.wetTireFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

        this.wetTireGain = this.ctx.createGain();
        this.wetTireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        hissSource.connect(this.wetTireFilter);
        this.wetTireFilter.connect(this.wetTireGain);
        this.wetTireGain.connect(this.sfxGain);

        hissSource.start();
    }

    updateWetTireHiss(speed) {
        if (!this.initialized || !this.wetTireGain) return;
        const targetGain = Math.min(0.28, Math.max(0, (speed - 20) / 100 * 0.28));
        this.wetTireGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }

    setupGravelSound() {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        this.gravelSource = this.ctx.createBufferSource();
        this.gravelSource.buffer = noiseBuffer;
        this.gravelSource.loop = true;

        this.gravelFilter = this.ctx.createBiquadFilter();
        this.gravelFilter.type = 'bandpass';
        this.gravelFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
        this.gravelFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

        this.gravelGain = this.ctx.createGain();
        this.gravelGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.gravelSource.connect(this.gravelFilter);
        this.gravelFilter.connect(this.gravelGain);
        this.gravelGain.connect(this.sfxGain);

        this.gravelSource.start();
    }

    updateGravel(speed, intensity) {
        if (!this.initialized || !this.gravelGain) return;
        const targetGain = (intensity > 0 && speed > 10)
            ? Math.min(0.32, (speed / 90) * intensity * 0.32)
            : 0;
        this.gravelGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }

    setupGutterSound() {
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        this.gutterSource = this.ctx.createBufferSource();
        this.gutterSource.buffer = noiseBuffer;
        this.gutterSource.loop = true;

        this.gutterFilter = this.ctx.createBiquadFilter();
        this.gutterFilter.type = 'bandpass';
        this.gutterFilter.frequency.setValueAtTime(850, this.ctx.currentTime);
        this.gutterFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

        this.gutterGain = this.ctx.createGain();
        this.gutterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.gutterSource.connect(this.gutterFilter);
        this.gutterFilter.connect(this.gutterGain);
        this.gutterGain.connect(this.sfxGain);

        this.gutterSource.start();
    }

    updateGutterGrind(speed, isGutterRun) {
        if (!this.initialized || !this.gutterGain) return;
        const targetGain = (isGutterRun && speed > 15)
            ? Math.min(0.40, 0.15 + (speed / 100) * 0.25)
            : 0;
        this.gutterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }

    startBGM() {
        if (!this.initialized || this.bgmInterval) return;
        this.bgmStep = 0;
        const stepTime = (60 / this.bpm) / 4 * 1000;

        this.bgmInterval = setInterval(() => {
            this.playBGMStep(this.bgmStep);
            this.bgmStep = (this.bgmStep + 1) % 64;
        }, stepTime);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }

    playBGMStep(step) {
        if (!this.initialized || !this.bgmGain) return;
        const now = this.ctx.currentTime;

        // Kick (4つ打ち)
        if (step % 4 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(38, now + 0.08);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start(now);
            osc.stop(now + 0.1);
        }

        // Hi-Hat (裏打ち)
        if (step % 4 === 2) {
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.008));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(7000, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);
            noise.start(now);
            noise.stop(now + 0.04);
        }

        // Bassline (ユーロビート・オクターブベース)
        const bassNotes = [110, 110, 220, 110, 130.81, 130.81, 261.63, 130.81, 98, 98, 196, 98, 123.47, 123.47, 246.94, 123.47];
        const noteIdx = Math.floor(step / 4) % bassNotes.length;
        if (step % 2 === 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            const f = bassNotes[noteIdx] * (step % 4 === 2 ? 1.0 : 0.5);
            osc.frequency.setValueAtTime(f, now);

            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.bgmGain);
            osc.start(now);
            osc.stop(now + 0.09);
        }
    }
}

window.AudioManager = AudioManager;
