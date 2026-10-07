/**
 * AudioManager.js - プロフェッショナル・プロシージャル・フィジカルモデリング音響エンジン
 * 外部音源ファイルに依存せず、Web Audio APIによる高度な物理音響合成（Physical Modeling Synthesis）で
 * 安っぽい単調なシンセ（オシレーター）音を完全打破。
 * 
 * 【音響物理モデリングの構成】
 * 1. クランク軸・排気量サブベース (Crankshaft Sub-Bass): 40〜120Hzの重厚な胴鳴り・排気量感
 * 2. 多重気筒燃焼パルス (Cylinder Combustion Pulses): ノコギリ波＋デチューン三角波による有機的な燃焼ビート
 * 3. 排気管ノンリニア・サチュレーション (Exhaust WaveShaping): 双曲線正接(tanh)歪みによる野太いスポーツ排気音・咆哮
 * 4. 音響共鳴キャビティ・フォルマント (Exhaust & Muffler Formants): 140Hzの胴鳴り共鳴＋720Hzの喉鳴り排気共鳴
 * 5. 吸気サージタンク・4連スロットル咆哮 (Intake Induction Roar): アクセル全開時の強烈な吸気負圧・空気吸引唸り
 * 6. ターボチャージャー過給機ホイッスル (Turbo Compressor Spool): ターボ車特有の1.4kHz〜4.2kHz過給圧スピナー音
 * 7. 車種別エンジン・シグネチャー（AE86 4A-GE, FD3S 13B, GT-R RB26, シルビア SR20, チェイサー/スープラ 1JZ/2JZ, エボ 4G63, EK9 B16B VTEC, アルトワークス F5A）
 */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isBgmEnabled = true;

        // マスター / SFX / BGM ゲイン
        this.masterGain = null;
        this.sfxGain = null;
        this.bgmGain = null;

        // プロフェッショナル・エンジンフィジカルモデリング・ノード群
        this.engineOscSub = null;      // クランク軸サブベース（超低域・排気量感）
        this.subGain = null;
        this.engineOscMain1 = null;    // 主燃焼パルス（気筒点火基本波）
        this.engineOscMain2 = null;    // 対向気筒パルス（微小デチューン倍音）
        this.engineOscHigh = null;     // 高回転・排気マニホールド金属倍音
        this.highGain = null;
        this.engineWaveShaper = null;  // 排気管ノンリニア歪み（tanhサチュレーター）
        this.engineBodyFilter = null;  // マフラー胴鳴り共鳴 (140Hzフォルマント)
        this.engineRaspFilter = null;  // エキゾーストパイプ喉鳴り共鳴 (720Hzフォルマント)
        this.engineFilter = null;      // スロットル連動・可変吸排気ローパスフィルター
        this.engineGain = null;        // エンジンマスターゲイン

        // 吸気サージタンク・インダクション咆哮
        this.intakeNoiseNode = null;
        this.intakeFilter = null;
        this.intakeGain = null;

        // ターボチャージャー過給機スピナー音
        this.turboOsc = null;
        this.turboFilter = null;
        this.turboGain = null;

        // スキール音シンセ
        this.tireNoiseNode = null;
        this.tireFilter = null;
        this.tireGain = null;

        // 環境音（雨天、砂利、溝落とし）
        this.rainNoiseNode = null;
        this.rainGain = null;
        this.wetSprayGain = null;
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

        // ユーザーインタラクションによる即座のWeb Audio自動アンロック
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

        // プロフェッショナル・エンジンフィジカルモデリング・セットアップ
        this.setupEngineSynth();

        // タイヤスキール音のセットアップ
        this.setupTireSqueal();

        // 雨天サウンド＆水しぶき音のセットアップ
        this.setupRainAudio();

        // 峠道砂利走行音＆小石直撃音のセットアップ
        this.setupGravelAudio();

        // 溝落としグラインド摩擦音のセットアップ
        this.setupGutterAudio();

        this.initialized = true;
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startEngineLoop() {
        if (!this.initialized) {
            this.init();
        }
        this.resume();
    }

    onShiftChange(direction, fromGear, toGear, rpm) {
        if (!this.initialized || !this.ctx || this.isMuted) return;
        this.playShiftSound();
        if (direction === 'down' && rpm > 4500) {
            this.playAfterfireSound(0.85, false);
        } else if (direction === 'up' && rpm > 6500) {
            this.playAfterfireSound(0.75, false);
        }
    }

    /**
     * 排気管の音響非線形性を再現する双曲線正接(tanh)サチュレーションカーブ生成
     */
    _makeDistortionCurve(amount = 2.4) {
        const k = amount;
        const n_samples = 4096;
        const curve = new Float32Array(n_samples);
        for (let i = 0; i < n_samples; ++i) {
            const x = (i * 2) / n_samples - 1;
            curve[i] = Math.tanh(k * x);
        }
        return curve;
    }

    /**
     * プロフェッショナル・フィジカルモデリング・エンジンサウンド構築
     */
    setupEngineSynth() {
        const now = this.ctx.currentTime;

        // 1. クランク軸サブベース (排気量感・超低域パンチ 40〜120Hz)
        this.engineOscSub = this.ctx.createOscillator();
        this.engineOscSub.type = 'sine';
        this.subGain = this.ctx.createGain();
        this.subGain.gain.setValueAtTime(0.35, now);

        // 2. 主燃焼パルス (ノコギリ波＋デチューン三角波)
        this.engineOscMain1 = this.ctx.createOscillator();
        this.engineOscMain1.type = 'sawtooth';

        this.engineOscMain2 = this.ctx.createOscillator();
        this.engineOscMain2.type = 'triangle';

        // 3. 高回転排気マニホールド金属倍音 (スポーツマフラーの甲高い咆哮)
        this.engineOscHigh = this.ctx.createOscillator();
        this.engineOscHigh.type = 'sawtooth';
        this.highGain = this.ctx.createGain();
        this.highGain.gain.setValueAtTime(0.18, now);

        // 4. 排気管ノンリニア・サチュレーター (WaveShaper)
        this.engineWaveShaper = this.ctx.createWaveShaper();
        this.engineWaveShaper.curve = this._makeDistortionCurve(2.4);
        this.engineWaveShaper.oversample = '2x';

        // 5. 排気管・マフラー音響共鳴フォルマントフィルター群
        // フォルマント①: マフラー膨張室・胴鳴り共鳴 (140Hz, +5.5dB, Q: 1.8)
        this.engineBodyFilter = this.ctx.createBiquadFilter();
        this.engineBodyFilter.type = 'peaking';
        this.engineBodyFilter.frequency.setValueAtTime(140, now);
        this.engineBodyFilter.gain.setValueAtTime(5.5, now);
        this.engineBodyFilter.Q.setValueAtTime(1.8, now);

        // フォルマント②: テールパイプ喉鳴り共鳴 (720Hz, +6.0dB, Q: 2.2)
        this.engineRaspFilter = this.ctx.createBiquadFilter();
        this.engineRaspFilter.type = 'peaking';
        this.engineRaspFilter.frequency.setValueAtTime(720, now);
        this.engineRaspFilter.gain.setValueAtTime(6.0, now);
        this.engineRaspFilter.Q.setValueAtTime(2.2, now);

        // メイン可変吸排気ローパスフィルター (スロットル開度・回転数でダイナミック開閉)
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(800, now);
        this.engineFilter.Q.setValueAtTime(2.2, now);

        // 6. 吸気サージタンク・4連スロットルインダクション咆哮
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuf = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const nData = noiseBuf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            nData[i] = (b0 + b1 + b2 + white * 0.5362) * 0.12;
        }
        this.intakeNoiseNode = this.ctx.createBufferSource();
        this.intakeNoiseNode.buffer = noiseBuf;
        this.intakeNoiseNode.loop = true;

        this.intakeFilter = this.ctx.createBiquadFilter();
        this.intakeFilter.type = 'bandpass';
        this.intakeFilter.frequency.setValueAtTime(320, now);
        this.intakeFilter.Q.setValueAtTime(2.0, now);

        this.intakeGain = this.ctx.createGain();
        this.intakeGain.gain.setValueAtTime(0.0, now);

        // 7. ターボチャージャー過給機ホイッスル
        this.turboOsc = this.ctx.createOscillator();
        this.turboOsc.type = 'sine';
        this.turboFilter = this.ctx.createBiquadFilter();
        this.turboFilter.type = 'bandpass';
        this.turboFilter.frequency.setValueAtTime(2400, now);
        this.turboFilter.Q.setValueAtTime(4.0, now);
        this.turboGain = this.ctx.createGain();
        this.turboGain.gain.setValueAtTime(0.0, now);

        // 8. エンジンマスターゲイン
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.0, now);

        // 【音響ルーティング】
        // [Main1 + Main2] -> [WaveShaper (歪み)] -> [BodyFilter (140Hz)] -> [RaspFilter (720Hz)] -> [Lowpass] -> [EngineGain]
        this.engineOscMain1.connect(this.engineWaveShaper);
        this.engineOscMain2.connect(this.engineWaveShaper);
        this.engineWaveShaper.connect(this.engineBodyFilter);
        this.engineBodyFilter.connect(this.engineRaspFilter);
        this.engineRaspFilter.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);

        // [Sub-Bass (クランク軸)] -> [SubGain] -> [EngineGain] (歪ませずにタイトな低域を維持)
        this.engineOscSub.connect(this.subGain);
        this.subGain.connect(this.engineGain);

        // [High-Overtone (金属倍音)] -> [HighGain] -> [Lowpass]
        this.engineOscHigh.connect(this.highGain);
        this.highGain.connect(this.engineFilter);

        // [Intake Noise] -> [IntakeFilter] -> [IntakeGain] -> [EngineGain]
        this.intakeNoiseNode.connect(this.intakeFilter);
        this.intakeFilter.connect(this.intakeGain);
        this.intakeGain.connect(this.engineGain);

        // [Turbo Spool] -> [TurboFilter] -> [TurboGain] -> [EngineGain]
        this.turboOsc.connect(this.turboFilter);
        this.turboFilter.connect(this.turboGain);
        this.turboGain.connect(this.engineGain);

        this.engineGain.connect(this.sfxGain);

        // 発振開始
        this.engineOscSub.start();
        this.engineOscMain1.start();
        this.engineOscMain2.start();
        this.engineOscHigh.start();
        this.intakeNoiseNode.start();
        this.turboOsc.start();
    }

    setEngineSoundType(type) {
        this.soundType = type || '4age';
        if (!this.initialized || !this.engineOscMain1) return;

        // 車種別の音響キャラクター（波形・歪みキャラクター）
        if (this.soundType === '13b') {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'sine';
            this.engineWaveShaper.curve = this._makeDistortionCurve(1.8);
        } else if (this.soundType === 'rb26') {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'triangle';
            this.engineWaveShaper.curve = this._makeDistortionCurve(2.8);
        } else if (this.soundType === '1jz' || this.soundType === '2jz') {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'triangle';
            this.engineWaveShaper.curve = this._makeDistortionCurve(2.5);
        } else if (this.soundType === 'b16b') {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'sawtooth';
            this.engineWaveShaper.curve = this._makeDistortionCurve(2.6);
        } else {
            this.engineOscMain1.type = 'sawtooth';
            this.engineOscMain2.type = 'triangle';
            this.engineWaveShaper.curve = this._makeDistortionCurve(2.4);
        }
    }

    /**
     * リアルタイム物理・音響更新（RPM, スロットル開度, ドリフト状態連動）
     */
    updateEngine(rpm, throttle, isDrifting, driftAngle) {
        if (!this.initialized || !this.ctx) return;

        const curTime = this.ctx.currentTime;

        // 車種別の音響パラメータプロファイル
        let orderMult = 2.0;       // 点火次数 (4気筒=2.0, 6気筒/ロータリー=3.0, 3気筒=1.5)
        let maxRpmRef = 11000;
        let baseCutoff = 540;
        let rangeCutoff = 5800;
        let throttleCutoff = 2400;
        let subBassWeight = 0.36;
        let highRaspWeight = 0.22;
        let isTurbo = false;

        if (this.soundType === '4age') {
            // AE86 トレノ: 4A-GEU 1.6L 4気筒 NA高回転
            // 4連スロットル特有の吸気咆哮＋乾いた甲高いスポーツエキゾースト
            orderMult = 2.0;
            maxRpmRef = 9500;
            baseCutoff = 580;
            rangeCutoff = 6200;
            throttleCutoff = 3200;
            subBassWeight = 0.32;
            highRaspWeight = (rpm > 6400) ? 0.38 : 0.24;
            isTurbo = false;
        } else if (this.soundType === '13b') {
            // FD3S RX-7: 13B-REW 2ローター・シーケンシャルツインターボ
            // 超高周波の甲高いロータリーハウリング＋タービン過給
            orderMult = 3.0;
            maxRpmRef = 8500;
            baseCutoff = 720;
            rangeCutoff = 6800;
            throttleCutoff = 2600;
            subBassWeight = 0.25;
            highRaspWeight = 0.34;
            isTurbo = true;
        } else if (this.soundType === 'rb26') {
            // BNR32 GT-R: RB26DETT 2.6L 直6ツインターボ
            // 威圧的な重低音バリトン＋ツインカム直6の重厚な咆哮
            orderMult = 3.0;
            maxRpmRef = 8500;
            baseCutoff = 420;
            rangeCutoff = 5400;
            throttleCutoff = 3600;
            subBassWeight = 0.50; // 強烈な低域パンチ
            highRaspWeight = 0.26;
            isTurbo = true;
        } else if (this.soundType === 'sr20') {
            // S13 / S15 シルビア: SR20DET 2.0L 4気筒ターボ
            // 中低速トルクフルな低音＋鋭いタービンブースト
            orderMult = 2.0;
            maxRpmRef = 7800;
            baseCutoff = 500;
            rangeCutoff = 5500;
            throttleCutoff = 2800;
            subBassWeight = 0.40;
            highRaspWeight = 0.22;
            isTurbo = true;
        } else if (this.soundType === '1jz' || this.soundType === '2jz') {
            // JZX100 チェイサー / JZA80 スープラ: 1JZ/2JZ 直6ターボ
            // 重厚で滑らかなビッグシングル/ツインターボの豪快な吸排気
            orderMult = 3.0;
            maxRpmRef = 8200;
            baseCutoff = 440;
            rangeCutoff = 5900;
            throttleCutoff = 3400;
            subBassWeight = 0.48;
            highRaspWeight = 0.28;
            isTurbo = true;
        } else if (this.soundType === '4g63') {
            // CE9A エボIII: 4G63 2.0L ハイブースト4気筒ターボ
            // 怒涛のハイブースト重低音＋強烈な吸排気圧力
            orderMult = 2.0;
            maxRpmRef = 8200;
            baseCutoff = 480;
            rangeCutoff = 5600;
            throttleCutoff = 3200;
            subBassWeight = 0.44;
            highRaspWeight = 0.25;
            isTurbo = true;
        } else if (this.soundType === 'b16b') {
            // EK9 シビック Type R: B16B 1.6L 9000rpm VTEC
            // 5800rpmでハイカム切り替わり、超高域が激変するVTECサウンド！
            orderMult = 2.0;
            maxRpmRef = 9500;
            const isVtec = (rpm > 5800);
            baseCutoff = isVtec ? 850 : 520;
            rangeCutoff = isVtec ? 7800 : 5400;
            throttleCutoff = isVtec ? 3800 : 2200;
            subBassWeight = 0.28;
            highRaspWeight = isVtec ? 0.45 : 0.22; // VTEC領域で甲高い金属音が炸裂！
            isTurbo = false;
        } else if (this.soundType === 'f5a') {
            // アルトワークス: F5A 550cc 3気筒ドッカンターボ
            // 独特の1.5次ビート＋元気な過給機ホイッスル
            orderMult = 1.5;
            maxRpmRef = 10000;
            const isBoost = (rpm > 4500);
            baseCutoff = isBoost ? 660 : 440;
            rangeCutoff = isBoost ? 6200 : 4600;
            throttleCutoff = isBoost ? 3200 : 1600;
            subBassWeight = 0.30;
            highRaspWeight = 0.30;
            isTurbo = true;
        }

        // 1. 基本点火周波数 (Firing Frequency) の物理計算
        const baseFreq = Math.max(30, (rpm / 60) * orderMult);
        const rpmNorm = Math.min(1.25, Math.max(0, rpm / maxRpmRef));

        // 2. オシレーター群の周波数更新
        this.engineOscSub.frequency.setTargetAtTime(baseFreq * 0.5, curTime, 0.025);
        this.engineOscMain1.frequency.setTargetAtTime(baseFreq, curTime, 0.025);
        this.engineOscMain2.frequency.setTargetAtTime(baseFreq * 2.008, curTime, 0.025);
        this.engineOscHigh.frequency.setTargetAtTime(baseFreq * 3.015, curTime, 0.025);

        // 3. サブベース＆高域金属音ゲイン
        this.subGain.gain.setTargetAtTime(subBassWeight * (0.85 + throttle * 0.35), curTime, 0.03);
        this.highGain.gain.setTargetAtTime(highRaspWeight * (0.50 + rpmNorm * 0.70 + throttle * 0.35), curTime, 0.03);

        // 4. マフラー・エキゾースト管共鳴フォルマントのダイナミック追従
        const bodyFreq = 135 + rpmNorm * 45;
        this.engineBodyFilter.frequency.setTargetAtTime(bodyFreq, curTime, 0.04);

        const raspFreq = 700 + rpmNorm * 260;
        this.engineRaspFilter.frequency.setTargetAtTime(raspFreq, curTime, 0.04);

        // 5. 吸排気可変ローパスフィルター
        const targetCutoff = baseCutoff + (rpmNorm * rangeCutoff) + (throttle * throttleCutoff);
        this.engineFilter.frequency.setTargetAtTime(targetCutoff, curTime, 0.03);

        // 6. 吸気サージタンク・4連スロットル咆哮
        const intakeVol = Math.max(0, (throttle * 0.28) + (rpmNorm * 0.12 * throttle));
        const intakeFreq = 260 + (throttle * 240) + (rpmNorm * 180);
        this.intakeFilter.frequency.setTargetAtTime(intakeFreq, curTime, 0.03);
        this.intakeGain.gain.setTargetAtTime(intakeVol, curTime, 0.03);

        // 7. ターボチャージャー過給スピナー音
        if (isTurbo && throttle > 0.12 && rpm > 3200) {
            const turboFreq = 1400 + (rpmNorm * 2200) + (throttle * 600);
            const turboVol = Math.min(0.18, 0.04 + (throttle * 0.10) + (rpmNorm * 0.06));
            this.turboOsc.frequency.setTargetAtTime(turboFreq, curTime, 0.04);
            this.turboFilter.frequency.setTargetAtTime(turboFreq, curTime, 0.04);
            this.turboGain.gain.setTargetAtTime(turboVol, curTime, 0.04);
        } else {
            this.turboGain.gain.setTargetAtTime(0.0, curTime, 0.06);
        }

        // 8. エンジン音量（アイドリングの心地よい重低音鼓動 〜 全開時の迫力ある咆哮）
        const masterVol = 0.24 + (throttle * 0.36) + (rpmNorm * 0.28);
        this.engineGain.gain.setTargetAtTime(masterVol, curTime, 0.025);

        // 9. ドリフト時のタイヤスキール音
        let squealVol = 0;
        if (isDrifting) {
            const slipIntensity = Math.min(1.0, Math.abs(driftAngle) * 2.2);
            squealVol = 0.15 + slipIntensity * 0.35;
            const squealPitch = 900 + slipIntensity * 1200;
            this.tireFilter.frequency.setTargetAtTime(squealPitch, curTime, 0.04);
        }
        this.tireGain.gain.setTargetAtTime(squealVol, curTime, 0.05);
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

        const targetRpm = (car && car.physics && car.physics.redlineRpm) ? car.physics.redlineRpm * 0.90 : 8000;
        let currentRpm = 1000;
        let step = 0;

        const revInterval = setInterval(() => {
            step++;
            if (step <= 26) {
                // スロットル全開で一気に吹け上がり
                currentRpm += (targetRpm - currentRpm) * 0.18;
                this.updateEngine(currentRpm, 1.0, false, 0);
            } else if (step <= 38) {
                // アクセルオフ＆排気アフターファイヤ
                currentRpm -= (currentRpm - 1000) * 0.22;
                this.updateEngine(currentRpm, 0.0, false, 0);
                if (step === 27) {
                    this.playAfterfireSound(1.2);
                    if (onPopCallback) onPopCallback(1.2);
                }
            } else {
                this.updateEngine(1000, 0.0, false, 0);
                clearInterval(revInterval);
            }
        }, 16);
    }

    setupTireSqueal() {
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

        // B. 排気管内の低域衝撃波（ドスッと腹に響くサブベース）
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

    setupRainAudio() {
        if (!this.ctx) return;
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
        if (this.weather !== 'rain' || speedKmh < 10) {
            this.wetSprayGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
            return;
        }
        const speedNorm = Math.min(1.0, Math.max(0, (speedKmh - 15) / 100));
        const targetGain = speedNorm * 0.16;
        this.wetSprayGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
    }

    setupGravelAudio() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        const gravelBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const gravelData = gravelBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const rand = Math.random();
            const pulse = (Math.random() < 0.05) ? (Math.random() * 2 - 1) * 1.8 : 0;
            gravelData[i] = (rand * 2 - 1) * 0.7 + pulse;
        }

        this.gravelSource = this.ctx.createBufferSource();
        this.gravelSource.buffer = gravelBuffer;
        this.gravelSource.loop = true;

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
        this.lastPebbleHitTime = 0;
    }

    updateGravel(speedKmh, intensity = 0.0) {
        if (!this.initialized || !this.gravelGain || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (intensity <= 0.01 || speedKmh < 8) {
            this.gravelGain.gain.setTargetAtTime(0.0, now, 0.08);
            return;
        }

        const speedNorm = Math.min(1.2, speedKmh / 75.0);
        const targetGain = Math.min(0.28, intensity * speedNorm * 0.25);
        this.gravelGain.gain.setTargetAtTime(targetGain, now, 0.04);

        const targetFreq = 2000 + speedNorm * 1200;
        this.gravelFilter.frequency.setTargetAtTime(targetFreq, now, 0.06);

        if (speedKmh > 25 && Math.random() < (intensity * 0.22) && (now - this.lastPebbleHitTime > 0.09)) {
            this.playPebbleHit();
            this.lastPebbleHitTime = now;
        }
    }

    playPebbleHit() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

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

    setupGutterAudio() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        const gutterBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = gutterBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const pulse = (Math.random() < 0.12) ? (Math.random() * 2 - 1) * 1.5 : 0;
            data[i] = (Math.random() * 2 - 1) * 0.6 + pulse;
        }

        this.gutterSource = this.ctx.createBufferSource();
        this.gutterSource.buffer = gutterBuffer;
        this.gutterSource.loop = true;

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

    updateGutterGrind(speedKmh, active = false) {
        if (!this.initialized || !this.gutterGain || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (!active || speedKmh < 10) {
            this.gutterGain.gain.setTargetAtTime(0.0, now, 0.06);
            return;
        }

        const speedNorm = Math.min(1.4, speedKmh / 70.0);
        const targetGain = Math.min(0.35, 0.12 + speedNorm * 0.18);
        this.gutterGain.gain.setTargetAtTime(targetGain, now, 0.04);

        const targetFreq = 480 + speedNorm * 380;
        this.gutterFilter.frequency.setTargetAtTime(targetFreq, now, 0.05);
    }

    playGutterDropSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

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

    playGutterExitSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.09);

        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.10);
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

    startEurobeatBGM() {
        if (!this.initialized || this.bgmInterval) return;

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

        const leadPattern = [
            'A4', null, 'C4', null, 'E4', null, 'D4', 'C4',
            'F4', null, 'E4', 'D4', 'C4', null, 'A3', null,
            'G4', null, 'F4', 'G4', 'A4', null, 'G4', 'F4',
            'E4', null, 'F4', 'E4', 'D4', null, 'E4', null
        ];

        const stepTime = (60 / this.bpm) / 4;
        this.bgmStep = 0;

        this.bgmInterval = setInterval(() => {
            if (!this.isBgmEnabled) return;
            const now = this.ctx.currentTime;
            const stepIdx = this.bgmStep % 32;

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

            if (stepIdx % 4 === 0) {
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

            const leadNote = leadPattern[stepIdx];
            if (leadNote && noteFreqs[leadNote]) {
                const lOsc1 = this.ctx.createOscillator();
                const lOsc2 = this.ctx.createOscillator();
                const lFilter = this.ctx.createBiquadFilter();
                const lGain = this.ctx.createGain();

                lOsc1.type = 'sawtooth';
                lOsc2.type = 'sawtooth';
                lOsc1.frequency.setValueAtTime(noteFreqs[leadNote], now);
                lOsc2.frequency.setValueAtTime(noteFreqs[leadNote] * 1.004, now);

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
