/**
 * AudioManager.js - 超リアル・プロシージャル・エンジン音響物理モデリング 3.0 ＆ 総合音響システム
 * 
 * 【音響物理モデリングの革新アーキテクチャ（録音データ一切不使用）】
 * 1. 4ストローク 720°全周期音響物理モデリング (Full 720° Combustion Cycle Impulse Engine):
 *    平坦な連続オシレーター（単調な音階・ブザー音）を完全根絶！
 *    クランク2回転（720度）における全気筒の点火順序・爆発衝撃波（Dirac Shock Pulse）・
 *    等長/不等長エキマニ管長差・気筒間バラつき（IMEP Covariance）をタイムドメインで忠実に合成。
 *    基本周波数をクランク全周期（rpm / 120）に設定することで、アイドリング時は可聴域以下の
 *    「ドスッ！ドスッ！」という個別のシリンダー爆発打撃音となり、シンセ音階臭が完全に消滅。
 * 2. 単極性高圧排気ガススラグ噴射 (Gated High-Pressure Gas Slug Turbulence AM Burst):
 *    排気バルブ開口時（サイクル約30%）のみ高圧排気ガスを噴射し、残り70%は完全無音となる
 *    単極性ゲートWaveShaperで乱流ノイズを音速チョッピング！
 *    アイドリングでの「ボフッ、ボフッ」という風圧排気パフから、全開時の暴力的排気嵐を完全再現。
 * 3. 吸気インダクション・サクション波形連動 (Intake Induction Roar):
 *    スロットル開度にダイレクト連動し、位相反転した吸気サクション波がファンネルから猛烈に吠える。
 * 4. エキゾーストマニホールド Comb Filter（櫛状音響管物理遅延）:
 *    各気筒排気管から集合部・テールパイプまでの往復音波遅延（3.2ms〜8.0ms）とタコ足金属反響。
 * 5. 3バンド排気管ヘルムホルツ共鳴フォルマント:
 *    - マフラー太鼓（メインサイレンサー膨張室）の重厚な地響き低音 (90〜160Hz)
 *    - テールパイプ出口の乾いた喉鳴り (500〜820Hz)
 *    - 高回転時にステンレス・チタン管が激しく共鳴する甲高い金属鳴き (2200〜3200Hz)
 * 6. 有機的アイドリング・ワンダリング (0.8Hz Organic Thermal Drift):
 *    電子的なFMビブラート（高周波変調）を排除し、内燃機関特有の有機的揺らぎのみを注入。
 * 7. 車種別完全個別プロファイル (4A-GE, 13B, RB26, SR20, 1JZ/2JZ, 4G63, B16B, F5A):
 *    直4等長タコ足、直6重低音シルキー、2ローター高速ポート排気、3気筒不均等ビート等の完全個別化。
 */

// 車種別エンジン音響物理プロファイル
const ENGINE_PROFILES = {
    '4age': {
        name: '4A-GEU (AE86)',
        orderMult: 2.0,       // 4気筒: 1回転あたり2回点火
        cycleFreqRatio: 1 / 120, // 4ストローク720°全周期 (クランク2回転/1サイクル)
        combDelay: 0.0040,    // 等長タコ足遅延 4.0ms
        combFeedback: 0.40,   // 等長タコ足乾いた金属反響
        idleRpm: 950,
        redlineRpm: 8000,
        maxRpm: 11000,
        subWeight: 0.50,      // アイドリング低域パルス
        mainWeight: 0.62,
        noiseBurstWeight: 0.68, // 排気ガス噴射風圧
        bodyFreq: 135, bodyGain: 7.5,
        raspFreq: 640, raspGain: 8.5,
        ringFreq: 2850, ringGain: 8.5, // 4A-GE等長タコ足高域鳴き
        intakePeak: 420, intakeQ: 3.2,
        mechWhineRatio: 1.5,
        mechClatterWeight: 0.14,
        revBounceHz: 11.5,
        isTurbo: false
    },
    '13b': {
        name: '13B-REW (FD3S)',
        orderMult: 3.0,       // 2ローター・偏心軸: 1回転あたり3回排気
        cycleFreqRatio: 1 / 60, // 360°基準 (偏心軸1回転で3回排気)
        combDelay: 0.0032,    // ロータリースムース管 3.2ms
        combFeedback: 0.28,
        idleRpm: 900,
        redlineRpm: 8200,
        maxRpm: 8800,
        subWeight: 0.38,
        mainWeight: 0.64,
        noiseBurstWeight: 0.55,
        bodyFreq: 155, bodyGain: 5.5,
        raspFreq: 820, raspGain: 9.0,
        ringFreq: 2200, ringGain: 6.5,
        intakePeak: 320, intakeQ: 2.2,
        mechWhineRatio: 2.0,
        mechClatterWeight: 0.02, // ロータリーはピストン・タペット打撃なし
        revBounceHz: 13.5,
        isTurbo: true,
        isTwinTurbo: true
    },
    'rb26': {
        name: 'RB26DETT (BNR32)',
        orderMult: 3.0,       // 直6: 1回転あたり3回点火
        cycleFreqRatio: 1 / 120,
        combDelay: 0.0056,    // 直6排気管 5.6ms
        combFeedback: 0.44,
        idleRpm: 950,
        redlineRpm: 8000,
        maxRpm: 8500,
        subWeight: 0.72,      // 直6重低音ランブル
        mainWeight: 0.64,
        noiseBurstWeight: 0.70,
        bodyFreq: 110, bodyGain: 9.5,
        raspFreq: 560, raspGain: 7.5,
        ringFreq: 2350, ringGain: 8.0,
        intakePeak: 340, intakeQ: 2.6,
        mechWhineRatio: 1.8,
        mechClatterWeight: 0.12,
        revBounceHz: 10.5,
        isTurbo: true,
        isTwinTurbo: true
    },
    'sr20': {
        name: 'SR20DET (S13/180SX)',
        orderMult: 2.0,       // 4気筒ターボ
        cycleFreqRatio: 1 / 120,
        combDelay: 0.0066,    // 不等長排気干渉 6.6ms
        combFeedback: 0.40,
        idleRpm: 850,
        redlineRpm: 7500,
        maxRpm: 8000,
        subWeight: 0.58,
        mainWeight: 0.58,
        noiseBurstWeight: 0.74, // 荒々しいラフな排気脈動
        bodyFreq: 125, bodyGain: 8.0,
        raspFreq: 680, raspGain: 8.0,
        ringFreq: 2450, ringGain: 7.0,
        intakePeak: 300, intakeQ: 2.2,
        mechWhineRatio: 1.4,
        mechClatterWeight: 0.16,
        revBounceHz: 11.0,
        isTurbo: true,
        isTwinTurbo: false
    },
    '1jz': {
        name: '1JZ-GTE (JZX100)',
        orderMult: 3.0,       // 直6ターボ
        cycleFreqRatio: 1 / 120,
        combDelay: 0.0052,    // 極太直管 5.2ms
        combFeedback: 0.45,
        idleRpm: 800,
        redlineRpm: 7500,
        maxRpm: 8000,
        subWeight: 0.75,
        mainWeight: 0.62,
        noiseBurstWeight: 0.68,
        bodyFreq: 115, bodyGain: 9.0,
        raspFreq: 600, raspGain: 8.5,
        ringFreq: 2400, ringGain: 7.5,
        intakePeak: 320, intakeQ: 2.5,
        mechWhineRatio: 1.8,
        mechClatterWeight: 0.11,
        revBounceHz: 10.5,
        isTurbo: true,
        isTwinTurbo: false
    },
    '2jz': {
        name: '2JZ-GTE (JZA80)',
        orderMult: 3.0,       // 3.0L 直6ツインターボ
        cycleFreqRatio: 1 / 120,
        combDelay: 0.0054,
        combFeedback: 0.48,
        idleRpm: 750,
        redlineRpm: 7800,
        maxRpm: 8300,
        subWeight: 0.80,      // 3.0L大排気量重低音
        mainWeight: 0.60,
        noiseBurstWeight: 0.72,
        bodyFreq: 105, bodyGain: 10.0,
        raspFreq: 570, raspGain: 8.0,
        ringFreq: 2350, ringGain: 7.5,
        intakePeak: 340, intakeQ: 2.6,
        mechWhineRatio: 1.8,
        mechClatterWeight: 0.11,
        revBounceHz: 10.5,
        isTurbo: true,
        isTwinTurbo: true
    },
    '4g63': {
        name: '4G63 (CE9A エボIII)',
        orderMult: 2.0,       // 4気筒ハイブースト
        cycleFreqRatio: 1 / 120,
        combDelay: 0.0046,
        combFeedback: 0.40,
        idleRpm: 900,
        redlineRpm: 7800,
        maxRpm: 8300,
        subWeight: 0.62,
        mainWeight: 0.64,
        noiseBurstWeight: 0.78, // ラリー仕様の強烈打撃感
        bodyFreq: 125, bodyGain: 8.5,
        raspFreq: 680, raspGain: 8.5,
        ringFreq: 2450, ringGain: 8.0,
        intakePeak: 310, intakeQ: 2.8,
        mechWhineRatio: 1.5,
        mechClatterWeight: 0.15,
        revBounceHz: 11.0,
        isTurbo: true,
        isTwinTurbo: false
    },
    'b16b': {
        name: 'B16B (EK9 Type R)',
        orderMult: 2.0,       // 1.6L 9000rpm VTEC
        cycleFreqRatio: 1 / 120,
        combDelay: 0.0036,    // 等長チタン管 3.6ms
        combFeedback: 0.46,
        idleRpm: 850,
        redlineRpm: 9000,
        maxRpm: 9800,
        subWeight: 0.42,
        mainWeight: 0.68,
        noiseBurstWeight: 0.64,
        bodyFreq: 145, bodyGain: 6.5,
        raspFreq: 760, raspGain: 9.5,
        ringFreq: 3200, ringGain: 11.0, // VTEC超高域突き抜け鳴き
        intakePeak: 440, intakeQ: 3.6,
        mechWhineRatio: 1.6,
        mechClatterWeight: 0.13,
        revBounceHz: 12.0,
        isTurbo: false
    },
    'f5a': {
        name: 'F5A (アルトワークス)',
        orderMult: 1.5,       // 3気筒: 1回転あたり1.5回点火
        cycleFreqRatio: 1 / 120,
        combDelay: 0.0080,    // 3気筒脈動遅延 8.0ms
        combFeedback: 0.38,
        idleRpm: 950,
        redlineRpm: 9500,
        maxRpm: 10500,
        subWeight: 0.48,
        mainWeight: 0.56,
        noiseBurstWeight: 0.80, // パタパタ脈動
        bodyFreq: 175, bodyGain: 7.0,
        raspFreq: 500, raspGain: 7.5,
        ringFreq: 2550, ringGain: 6.5,
        intakePeak: 300, intakeQ: 2.0,
        mechWhineRatio: 1.3,
        mechClatterWeight: 0.18,
        revBounceHz: 11.0,
        isTurbo: true,
        isTwinTurbo: false
    }
};

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.bgmGain = null;

        // プロシージャル・グランラー燃焼エンジン 4.0（無録音・無オシレーター・真のシリンダー爆発流）
        this.engineLoopSource = null;       // 2.0秒連続プロシージャル燃焼バッファ音源 (AudioBufferSourceNode)
        this.engineCombustionGain = null;   // 燃焼圧力・負荷ダイナミックゲイン
        this._proceduralBufferCache = {};   // 車種別プロシージャル燃焼バッファキャッシュ

        // 後方互換用プロパティ（既存参照の安全担保）
        this.engineOscMain1 = null;
        this.engineOscMain2 = null;
        this.engineOscSub = null;
        this.subGain = null;
        this.mainGain1 = null;
        this.mainGain2 = null;

        // 3バンド排気管ヘルムホルツ共鳴フォルマントフィルター群
        this.engineBodyFilter = null;       // マフラー太鼓胴鳴り (peaking, 110-155Hz, 広帯域Q=1.1)
        this.engineRaspFilter = null;       // テールパイプ喉鳴り (peaking, 560-820Hz, 広帯域Q=1.3)
        this.engineRingFilter = null;       // タコ足金属鳴き (peaking, 2200-2900Hz, 広帯域Q=1.4)
        this.engineFilter = null;           // メイン吸排気ダイナミックローパス

        // レブリミッター・スタッターチョッパー (18〜24Hz 点火カット)
        this.revLfo = null;
        this.revModGain = null;
        this.revChopperGain = null;

        // デセル・クラックル (減速時ランブルノイズ ＆ アンチラグ)
        this.decelNoiseSource = null;
        this.decelNoiseGain = null;
        this.decelFilter = null;
        this.prevThrottle = 0;
        this.lastBlowoffTime = 0;
        this.lastMisfireTime = 0;

        // 吸気サージタンク・インダクション咆哮
        this.intakeNoiseNode = null;
        this.intakeFilter = null;
        this.intakeGain = null;

        // ターボチャージャー過給機エアラッシュ（純粋な空力気流音・電子サイン波は完全排除）
        this.turboNoiseNode = null;
        this.turboFilter = null;
        this.turboGain = null;
        this.turboOsc = null;

        // エンジンマスターゲイン
        this.engineGain = null;
        this.enginePlaying = false;

        // ガレージ空ぶかしインターバル
        this._revPreviewInterval = null;

        // ドリフトタイヤスキール音（効果音ラボ 実車急ブレーキ音＆路面研磨グラインド・ハイブリッド）
        this.tireGain = null;
        this.tirePanner = null;             // 左右荷重移動ステレオパンニング
        this.tireToneFilter = null;         // スリップ角・天候連動ダイナミックEQ
        this.tireOnsetBuffer = null;
        this.tireLoopBuffer = null;
        this.tireLoopSource = null;
        this.tireLoopGain = null;
        this.tireLoopPlaying = false;
        this.tireSamplesLoaded = false;
        this.tireGrindGain = null;
        this.tireGrindFilter = null;
        this.tireGrainGain = null;          // アスファルト微小骨材クラックル
        this.tireGrainFilter = null;
        this.prevDriftIntensity = 0;
        this.wasDrifting = false;
        this.wasBrakingHard = false;
        this._lastOnsetPlayTime = 0;
        this._lastSnapPlayTime = 0;

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
                    this._loadEmbeddedTireAudio();
                    this._ensureTireLoopPlaying();
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

        // プロシージャル・エンジン音響物理チェーン 2.0 のセットアップ
        this.setupProceduralEngineChain();

        // タイヤスキール音のセットアップ
        this.setupTireSqueal();

        // 環境音（ウェット、砂利、溝落とし）
        this.setupWetTireHiss();
        this.setupGravelSound();
        this.setupGutterSound();

        this.initialized = true;
        console.log('[AudioManager] Pure Procedural Acoustic Physics Engine 2.0 Initialized.');
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this._loadEmbeddedTireAudio();
                this._ensureTireLoopPlaying();
            });
        } else {
            this._loadEmbeddedTireAudio();
            this._ensureTireLoopPlaying();
        }
    }

    startEngineLoop() {
        if (!this.initialized) this.init();
        this.resume();
        this.enginePlaying = true;
    }

    stopEngineLoop() {
        if (this.engineGain) {
            this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
        }
        this.enginePlaying = false;
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
     * プロシージャル・グランラー燃焼バッファ生成（Procedural Granular Combustion Buffer）
     * 録音ファイル一切不使用：クランク・シリンダー燃焼衝撃波と排気乱流ジェットを
     * 2.0秒間（数百サイクル分）の微細時間揺らぎ・IMEP気筒差・乱流ノイズと共にタイムドメイン合成！
     * 固定オシレーターによる単調な音階・ブザー音を根絶し、本物の内燃機関の有機的脈動を生成。
     */
    _getProceduralEngineBuffer(soundType) {
        if (!this.ctx) return null;
        if (!this._proceduralBufferCache) this._proceduralBufferCache = {};
        if (this._proceduralBufferCache[soundType]) {
            return this._proceduralBufferCache[soundType];
        }

        const sampleRate = this.ctx.sampleRate || 44100;
        const dur = 2.0;
        const N = Math.floor(sampleRate * dur);
        const bufData = new Float32Array(N);

        let strokesPerSec = 100.0; // 4気筒 3000rpm時 100打撃/秒
        let pLenSec = 0.0038;
        let pDecay = 2.8;
        let gasRatio = 0.52;
        let numCyl = 4;
        let amps = [1.02, 0.94, 1.05, 0.96];
        let delays = [0.0, 0.0002, -0.0002, 0.0001];

        if (soundType === '13b') {
            // 2ローター・偏心軸360°基準排気 (150打撃/秒)
            strokesPerSec = 150.0;
            pLenSec = 0.0030;
            pDecay = 2.4;
            gasRatio = 0.42;
            numCyl = 3;
            amps = [1.00, 0.98, 1.02];
            delays = [0.0, 0.0, 0.0];
        } else if (soundType === 'rb26' || soundType === '1jz' || soundType === '2jz') {
            // 直列6気筒 (150打撃/秒、直6シルキーバランス)
            strokesPerSec = 150.0;
            pLenSec = 0.0034;
            pDecay = 2.7;
            gasRatio = 0.48;
            numCyl = 6;
            amps = [1.02, 0.97, 1.01, 0.98, 1.03, 0.96];
            delays = [0.0, 0.0001, -0.0001, 0.0, 0.0001, -0.0001];
        } else if (soundType === 'f5a') {
            // 直列3気筒 (75打撃/秒、パタパタ不均等)
            strokesPerSec = 75.0;
            pLenSec = 0.0045;
            pDecay = 2.2;
            gasRatio = 0.58;
            numCyl = 3;
            amps = [1.05, 0.94, 1.02];
            delays = [0.0, 0.0003, -0.0002];
        } else {
            // 直列4気筒 (4A-GE, SR20, 4G63, B16B)
            const isSr20 = (soundType === 'sr20');
            strokesPerSec = 100.0;
            pLenSec = 0.0038;
            pDecay = 2.9;
            gasRatio = 0.50;
            numCyl = 4;
            amps = [1.02, 0.94, 1.05, 0.96];
            delays = [0.0, isSr20 ? 0.0008 : 0.0002, -0.0002, isSr20 ? 0.0006 : 0.0001];
        }

        const interval = 1.0 / strokesPerSec;
        const numStrokes = Math.floor(dur * strokesPerSec);
        const pLen = Math.floor(pLenSec * sampleRate);

        // 各ストロークをタイムドメインで合成
        for (let s = 0; s < numStrokes; s++) {
            const cylIdx = s % numCyl;
            // 毎サイクル独立した微小カオス揺らぎ（IMEP timing jitter +/- 1.6%）
            const jit = ((Math.random() * 2 - 1) * 0.016) * interval;
            const stTime = (s * interval + jit + delays[cylIdx] + dur) % dur;
            // 気筒別燃焼圧の揺らぎ（IMEP pressure jitter +/- 5%）
            const cylAmp = (1.0 + (Math.random() * 2 - 1) * 0.05) * amps[cylIdx];

            const idx0 = Math.floor(stTime * sampleRate);

            for (let j = 0; j < pLen; j++) {
                const tau = j / pLen;
                // ピストンの衝撃圧縮波 ＋ 負圧引力
                const shock = Math.pow(Math.sin(Math.PI * tau), 1.3) * Math.exp(-pDecay * tau) -
                              0.22 * Math.sin(2 * Math.PI * tau) * Math.exp(-4.2 * tau);
                // 排気バルブ開放時の非線形気流乱流ジェット（フラクタル排気ノイズ）
                const white = Math.random() * 2 - 1;
                const gas = white * Math.pow(Math.sin(Math.PI * tau), 2.2) * Math.exp(-1.8 * tau) * gasRatio;

                const pulse = (shock + gas) * cylAmp;
                bufData[(idx0 + j) % N] += pulse;
            }
        }

        // DCオフセットの除去
        let mean = 0;
        for (let i = 0; i < N; i++) mean += bufData[i];
        mean /= N;
        for (let i = 0; i < N; i++) bufData[i] -= mean;

        // ピーク正規化 (0.88)
        let maxAbs = 0.0001;
        for (let i = 0; i < N; i++) {
            const a = Math.abs(bufData[i]);
            if (a > maxAbs) maxAbs = a;
        }
        for (let i = 0; i < N; i++) bufData[i] = (bufData[i] / maxAbs) * 0.88;

        const audioBuf = this.ctx.createBuffer(1, N, sampleRate);
        audioBuf.copyToChannel(bufData, 0);

        this._proceduralBufferCache[soundType] = audioBuf;
        return audioBuf;
    }

    /**
     * プロシージャル燃焼ループ音源の起動・切替
     */
    _startEngineLoopSource(soundType) {
        if (!this.ctx || !this.engineCombustionGain) return;

        const buffer = this._getProceduralEngineBuffer(soundType);
        if (!buffer) return;

        if (this.engineLoopSource) {
            try {
                this.engineLoopSource.stop();
                this.engineLoopSource.disconnect();
            } catch (e) {}
            this.engineLoopSource = null;
        }

        this.engineLoopSource = this.ctx.createBufferSource();
        this.engineLoopSource.buffer = buffer;
        this.engineLoopSource.loop = true;
        this.engineLoopSource.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);
        this.engineLoopSource.connect(this.engineCombustionGain);
        this.engineLoopSource.start(0);
    }

    /**
     * プロシージャル・エンジン音響物理チェーン 4.0 の構築
     */
    setupProceduralEngineChain() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const sampleRate = this.ctx.sampleRate || 44100;
        const profile = ENGINE_PROFILES[this.soundType] || ENGINE_PROFILES['4age'];

        // 1. プロシージャル燃焼圧力・負荷ゲイン
        this.engineCombustionGain = this.ctx.createGain();
        this.engineCombustionGain.gain.setValueAtTime(profile.mainWeight, now);

        // 2. 3バンド排気管・マフラー音響共鳴フォルマントフィルター群（広帯域Q=1.1〜1.4で自然な管胴鳴り）
        // フォルマント①: マフラー膨張室・胴鳴り共鳴 (105〜175Hz, 広帯域Q=1.1)
        this.engineBodyFilter = this.ctx.createBiquadFilter();
        this.engineBodyFilter.type = 'peaking';
        this.engineBodyFilter.frequency.setValueAtTime(profile.bodyFreq, now);
        this.engineBodyFilter.gain.setValueAtTime(profile.bodyGain, now);
        this.engineBodyFilter.Q.setValueAtTime(1.1, now);

        // フォルマント②: テールパイプ喉鳴り共鳴 (500〜820Hz, 広帯域Q=1.3)
        this.engineRaspFilter = this.ctx.createBiquadFilter();
        this.engineRaspFilter.type = 'peaking';
        this.engineRaspFilter.frequency.setValueAtTime(profile.raspFreq, now);
        this.engineRaspFilter.gain.setValueAtTime(profile.raspGain, now);
        this.engineRaspFilter.Q.setValueAtTime(1.3, now);

        // フォルマント③: タコ足・ステン管金属鳴き共鳴 (2200〜3200Hz, 広帯域Q=1.4)
        this.engineRingFilter = this.ctx.createBiquadFilter();
        this.engineRingFilter.type = 'peaking';
        this.engineRingFilter.frequency.setValueAtTime(profile.ringFreq, now);
        this.engineRingFilter.gain.setValueAtTime(profile.ringGain, now);
        this.engineRingFilter.Q.setValueAtTime(1.4, now);

        // メイン可変吸排気ダイナミックローパス
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(800, now);
        this.engineFilter.Q.setValueAtTime(1.2, now);

        this.engineCombustionGain.connect(this.engineBodyFilter);
        this.engineBodyFilter.connect(this.engineRaspFilter);
        this.engineRaspFilter.connect(this.engineRingFilter);
        this.engineRingFilter.connect(this.engineFilter);

        // 3. レブリミッター・スタッターチョッパー (18〜24Hz 点火カット)
        this.revChopperGain = this.ctx.createGain();
        this.revChopperGain.gain.setValueAtTime(1.0, now);

        this.revLfo = this.ctx.createOscillator();
        this.revLfo.type = 'sawtooth';
        this.revLfo.frequency.setValueAtTime(profile.revBounceHz, now);
        this.revModGain = this.ctx.createGain();
        this.revModGain.gain.setValueAtTime(0.0, now);
        this.revLfo.connect(this.revModGain);
        this.revModGain.connect(this.revChopperGain.gain);

        this.engineFilter.connect(this.revChopperGain);

        // 4. 吸気サージタンク・インダクション咆哮（スロットル全開でファンネルから猛烈に吸気）
        const intakeBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
        const inData = intakeBuf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < inData.length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            inData[i] = (b0 + b1 + b2 + white * 0.5362) * 0.12;
        }
        this.intakeNoiseNode = this.ctx.createBufferSource();
        this.intakeNoiseNode.buffer = intakeBuf;
        this.intakeNoiseNode.loop = true;

        this.intakeFilter = this.ctx.createBiquadFilter();
        this.intakeFilter.type = 'bandpass';
        this.intakeFilter.frequency.setValueAtTime(profile.intakePeak, now);
        this.intakeFilter.Q.setValueAtTime(profile.intakeQ, now);

        this.intakeGain = this.ctx.createGain();
        this.intakeGain.gain.setValueAtTime(0.0, now);

        this.intakeNoiseNode.connect(this.intakeFilter);
        this.intakeFilter.connect(this.intakeGain);
        this.intakeGain.connect(this.revChopperGain);

        // 5. ターボチャージャー過給エアラッシュ（純粋な空力気流音・電子サイン波は完全排除）
        const turboBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
        const tData = turboBuf.getChannelData(0);
        let lastTb = 0;
        for (let i = 0; i < tData.length; i++) {
            const w = Math.random() * 2 - 1;
            lastTb = 0.85 * lastTb + 0.15 * w;
            tData[i] = lastTb * 1.5;
        }
        this.turboNoiseNode = this.ctx.createBufferSource();
        this.turboNoiseNode.buffer = turboBuf;
        this.turboNoiseNode.loop = true;

        this.turboFilter = this.ctx.createBiquadFilter();
        this.turboFilter.type = 'bandpass';
        this.turboFilter.frequency.setValueAtTime(2600, now);
        this.turboFilter.Q.setValueAtTime(2.2, now);

        this.turboGain = this.ctx.createGain();
        this.turboGain.gain.setValueAtTime(0.0, now);

        this.turboNoiseNode.connect(this.turboFilter);
        this.turboFilter.connect(this.turboGain);
        this.turboGain.connect(this.revChopperGain);

        // 6. 減速時デセル・クラックル (未燃焼ガスランブル)
        const decelBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
        const dData = decelBuf.getChannelData(0);
        for (let i = 0; i < dData.length; i++) {
            const w = Math.random() * 2 - 1;
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
        this.decelNoiseGain.connect(this.revChopperGain);

        // 7. エンジンマスターゲイン
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.0, now);

        this.revChopperGain.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);

        // 音源起動
        this.revLfo.start();
        this.intakeNoiseNode.start();
        this.turboNoiseNode.start();
        this.decelNoiseSource.start();

        // プロシージャル燃焼ループの起動
        this._startEngineLoopSource(this.soundType);
    }

    /**
     * 車種ごとのプロシージャル・エンジン設定の動的切り替え
     */
    setEngineSoundType(type) {
        this.soundType = type || '4age';
        if (!this.initialized || !this.engineCombustionGain) return;

        const now = this.ctx.currentTime;
        const profile = ENGINE_PROFILES[this.soundType] || ENGINE_PROFILES['4age'];

        // 1. 車種専用プロシージャル燃焼ループ音源の切替
        this._startEngineLoopSource(this.soundType);

        // 2. マフラー・エキマニ共鳴フォルマントの即時適用
        if (this.engineBodyFilter) {
            this.engineBodyFilter.frequency.setValueAtTime(profile.bodyFreq, now);
            this.engineBodyFilter.gain.setValueAtTime(profile.bodyGain, now);
        }
        if (this.engineRaspFilter) {
            this.engineRaspFilter.frequency.setValueAtTime(profile.raspFreq, now);
            this.engineRaspFilter.gain.setValueAtTime(profile.raspGain, now);
        }
        if (this.engineRingFilter) {
            this.engineRingFilter.frequency.setValueAtTime(profile.ringFreq, now);
            this.engineRingFilter.gain.setValueAtTime(profile.ringGain, now);
        }
        if (this.intakeFilter) {
            this.intakeFilter.frequency.setValueAtTime(profile.intakePeak, now);
            this.intakeFilter.Q.setValueAtTime(profile.intakeQ, now);
        }
        if (this.revLfo) {
            this.revLfo.frequency.setValueAtTime(profile.revBounceHz, now);
        }
        if (this.engineCombustionGain) {
            this.engineCombustionGain.gain.setValueAtTime(profile.mainWeight, now);
        }
    }

    /**
     * リアルタイム物理・音響更新（RPM, スロットル開度, ドリフト状態, レブ打ち連動）
     */
    updateEngine(rpm, throttle, isDrifting, driftAngle, isRevLimiter = false, redlineRpm = 8500, speed = 0, brake = 0, handbrake = false) {
        if (!this.initialized || !this.ctx) return;
        if (!this.engineCombustionGain || !this.engineFilter || !this.engineGain) {
            this._updateTireAudio(isDrifting, driftAngle, speed, brake, handbrake, throttle);
            return;
        }

        const curTime = this.ctx.currentTime;
        throttle = Math.max(0, Math.min(1.0, throttle || 0));
        rpm = Math.max(680, rpm || 680);

        const profile = ENGINE_PROFILES[this.soundType] || ENGINE_PROFILES['4age'];
        const maxRpmRef = Math.max(redlineRpm, profile.maxRpm || 8500);
        const rpmNorm = Math.min(1.25, Math.max(0, (rpm - profile.idleRpm) / (maxRpmRef - profile.idleRpm)));

        // 1. プロシージャル燃焼バッファの動的再生レート追従 (3000 RPM基準)
        const baseRpm = profile.baseRpm || 3000.0;
        const targetRate = Math.max(0.20, rpm / baseRpm);
        if (this.engineLoopSource && this.engineLoopSource.playbackRate) {
            this.engineLoopSource.playbackRate.setTargetAtTime(targetRate, curTime, 0.025);
        }

        // 2. 燃焼圧力・負荷ゲイン（スロットル全開で爆発圧力が激増）
        const targetCombVol = profile.mainWeight * (0.80 + throttle * 0.40 + rpmNorm * 0.20);
        this.engineCombustionGain.gain.setTargetAtTime(targetCombVol, curTime, 0.025);

        // 3. マフラー・エキゾースト管共鳴フォルマントのダイナミック追従
        const bodyFreq = profile.bodyFreq + rpmNorm * 40;
        this.engineBodyFilter.frequency.setTargetAtTime(bodyFreq, curTime, 0.04);

        const raspFreq = profile.raspFreq + rpmNorm * 220;
        this.engineRaspFilter.frequency.setTargetAtTime(raspFreq, curTime, 0.04);

        const ringFreq = profile.ringFreq + rpmNorm * 380;
        const ringGainVal = profile.ringGain * (0.60 + throttle * 0.40);
        this.engineRingFilter.frequency.setTargetAtTime(ringFreq, curTime, 0.04);
        this.engineRingFilter.gain.setTargetAtTime(ringGainVal, curTime, 0.04);

        // 4. 吸排気可変ダイナミックローパスフィルター (スロットル開閉にダイレクト連動)
        let baseCutoff = 700;
        let rangeCutoff = 6200;
        let throttleCutoff = 3600;

        if (this.soundType === 'b16b') {
            // EK9 VTEC: 5800rpm以上でハイカム吸排気が炸裂！超高域9200Hzまで突き抜ける
            const isVtec = (rpm > 5800);
            baseCutoff = isVtec ? 1100 : 650;
            rangeCutoff = isVtec ? 9200 : 5800;
            throttleCutoff = isVtec ? 4800 : 2600;
        }

        const targetCutoff = baseCutoff + (rpmNorm * rangeCutoff) + (throttle * throttleCutoff);
        this.engineFilter.frequency.setTargetAtTime(Math.min(16000, targetCutoff), curTime, 0.028);

        // 5. 吸気サージタンク・インダクション咆哮
        let intakeVol = 0;
        let intakeFreq = profile.intakePeak;
        if (this.soundType === '4age') {
            // AE86 4連独立スロットル: 踏み込んだ瞬間に剥き出しファンネルが猛烈に吠える！
            intakeVol = Math.max(0, (throttle * 0.52) + (rpmNorm * 0.28 * throttle));
            intakeFreq = 360 + (throttle * 460) + (rpmNorm * 280);
        } else if (this.soundType === 'b16b') {
            // EK9 VTEC: 5800rpm以上でハイカム吸気が一気に炸裂！
            const isVtec = (rpm > 5800);
            intakeVol = Math.max(0, (throttle * (isVtec ? 0.55 : 0.30)) + (rpmNorm * 0.22 * throttle));
            intakeFreq = isVtec ? (680 + throttle * 580) : (340 + throttle * 320);
        } else if (profile.isTurbo) {
            intakeVol = Math.max(0, (throttle * 0.38) + (rpmNorm * 0.20 * throttle));
            intakeFreq = profile.intakePeak + (throttle * 340) + (rpmNorm * 200);
        } else {
            intakeVol = Math.max(0, (throttle * 0.32) + (rpmNorm * 0.18 * throttle));
            intakeFreq = profile.intakePeak + (throttle * 280) + (rpmNorm * 180);
        }
        this.intakeFilter.frequency.setTargetAtTime(intakeFreq, curTime, 0.03);
        this.intakeGain.gain.setTargetAtTime(intakeVol, curTime, 0.03);

        // 6. レブリミッター・スタッターバウンス (点火カット・チョッピング変調)
        const isAtRedline = isRevLimiter || (rpm >= redlineRpm * 0.985);
        if (isAtRedline && throttle > 0.45) {
            this.revModGain.gain.setValueAtTime(0.88, curTime);
            this.engineFilter.frequency.setValueAtTime(targetCutoff * 1.45, curTime);
            this.engineRingFilter.gain.setValueAtTime(profile.ringGain * 1.65, curTime);
            if (Math.random() < 0.24) {
                this.playAfterfireSound(0.90);
            }
        } else {
            this.revModGain.gain.setTargetAtTime(0.0, curTime, 0.02);
        }

        // 7. ターボチャージャー過給エアラッシュ ＆ ブローオフバルブ
        const throttleDrop = (this.prevThrottle > 0.35 && throttle < 0.15);
        if (profile.isTurbo && throttle > 0.12 && rpm > 2600) {
            const turboVol = Math.min(0.22, 0.04 + (throttle * 0.12) + (rpmNorm * 0.08));
            const turboFreq = 2200 + (rpmNorm * 2000) + (throttle * 600);
            this.turboFilter.frequency.setTargetAtTime(turboFreq, curTime, 0.04);
            this.turboGain.gain.setTargetAtTime(turboVol, curTime, 0.04);
        } else {
            this.turboGain.gain.setTargetAtTime(0.0, curTime, 0.06);
        }

        if (profile.isTurbo && throttleDrop && rpm > 3000) {
            this.playBlowOffSound(rpmNorm, profile.isTwinTurbo);
        }

        // 8. 減速時デセル・クラックル ＆ CE9Aミスファイアリングシステム
        if (throttleDrop || (throttle < 0.12 && rpm > 3400)) {
            const decelVol = Math.min(0.26, (rpm / maxRpmRef) * 0.30);
            this.decelNoiseGain.gain.setTargetAtTime(decelVol, curTime, 0.02);

            // CE9A エボIII ミスファイアリングシステム (二次エア爆裂音「パンッ！」)
            if (this.soundType === '4g63' && throttle < 0.10 && rpm > 3200) {
                if (Math.random() < 0.30) {
                    this.playAntiLagPop(rpmNorm);
                }
            }
        } else {
            this.decelNoiseGain.gain.setTargetAtTime(0.0, curTime, 0.06);
        }
        this.prevThrottle = throttle;

        // 9. エンジン音量制御（アイドリングの排気鼓動 〜 全開時の大迫力音圧）
        const absAngle = Math.abs(driftAngle || 0);
        let driftIntensity = 0;
        if (isDrifting) {
            driftIntensity = Math.min(1.0, Math.max(0.38, absAngle * 2.3));
        } else if (absAngle > 0.08 && speed > 18) {
            driftIntensity = Math.min(0.52, (absAngle - 0.08) * 2.6);
        } else if ((brake > 0.25 || handbrake) && speed > 16) {
            const brakeFactor = handbrake ? 0.80 : Math.min(0.90, brake * 1.25);
            const speedRatio = Math.min(1.0, (speed - 12) / 25.0);
            driftIntensity = Math.min(0.85, brakeFactor * speedRatio);
        }

        const baseEngineVol = 0.38 + (throttle * 0.42) + (rpmNorm * 0.24);
        const driftDucking = 1.0 - (driftIntensity * 0.30);
        const masterVol = baseEngineVol * driftDucking;
        this.engineGain.gain.setTargetAtTime(masterVol, curTime, 0.025);

        // 10. タイヤスキール音の更新（100%完全維持）
        this._updateTireAudio(isDrifting, driftAngle, speed, brake, handbrake, throttle, driftIntensity);
    }

    /**
     * タイヤスキール音（効果音ラボ 実車急ブレーキ音＆ステレオパンニング＆グラインド・ハイブリッド）
     */
    _updateTireAudio(isDrifting, driftAngle, speed, brake, handbrake, throttle, driftIntensity = -1) {
        if (!this.initialized || !this.ctx) return;
        const curTime = this.ctx.currentTime;

        if (driftIntensity < 0) {
            const absAngle = Math.abs(driftAngle || 0);
            if (isDrifting) {
                driftIntensity = Math.min(1.0, Math.max(0.38, absAngle * 2.3));
            } else if (absAngle > 0.08 && speed > 18) {
                driftIntensity = Math.min(0.52, (absAngle - 0.08) * 2.6);
            } else if ((brake > 0.25 || handbrake) && speed > 16) {
                const brakeFactor = handbrake ? 0.80 : Math.min(0.90, brake * 1.25);
                const speedRatio = Math.min(1.0, (speed - 12) / 25.0);
                driftIntensity = Math.min(0.85, brakeFactor * speedRatio);
            } else {
                driftIntensity = 0;
            }
        }

        let squealVol = 0;
        if (driftIntensity > 0) {
            this._ensureTireLoopPlaying();

            // 車速に応じたフェード（低速12km/h以下ではカット、26km/h以上で全開）
            const speedFactor = Math.min(1.0, Math.max(0.0, (speed - 12) / 14.0));

            // 実音スキール音量：ドリフト強度とスロットル開度に連動（最大約0.95）
            squealVol = (0.55 + driftIntensity * 0.45) * (0.80 + throttle * 0.20) * speedFactor;

            // ★車速・横G・ホイールスピン（アクセルON）連動の動的playbackRate推移
            if (this.tireLoopSource && this.tireLoopSource.playbackRate) {
                const speedNorm = Math.min(1.0, Math.max(0.0, speed / 120.0));
                const wheelSpinRate = (throttle > 0.5) ? ((throttle - 0.5) * 0.07) : 0;
                const brakeRateDrop = (brake > 0.35) ? (Math.min(0.65, brake) * 0.035) : 0;
                const targetRate = 0.94 + (speedNorm * 0.14) + (driftIntensity * 0.04) + wheelSpinRate - brakeRateDrop;
                this.tireLoopSource.playbackRate.setTargetAtTime(targetRate, curTime, 0.035);
            }

            // ★左右荷重移動ステレオパンニング（遠心力で外側輪へ音像がリアルタイムにシフト）
            if (this.tirePanner && this.tirePanner.pan) {
                const targetPan = Math.max(-0.55, Math.min(0.55, -driftAngle * 1.3));
                this.tirePanner.pan.setTargetAtTime(targetPan, curTime, 0.04);
            }

            // ★スリップ角・天候連動ダイナミックトーンEQ
            if (this.tireToneFilter && this.tireToneFilter.gain) {
                const isRain = (this.currentWeather === 'rain');
                if (isRain) {
                    this.tireToneFilter.gain.setTargetAtTime(-4.0, curTime, 0.04);
                } else {
                    const highBoost = (driftIntensity > 0.4) ? ((driftIntensity - 0.4) * 5.8) : 0;
                    this.tireToneFilter.gain.setTargetAtTime(highBoost, curTime, 0.04);
                }
            }

            if (this.tireGrindFilter) {
                this.tireGrindFilter.frequency.setTargetAtTime(320 + speed * 1.5, curTime, 0.04);
            }
        } else {
            if (this.tirePanner && this.tirePanner.pan) {
                this.tirePanner.pan.setTargetAtTime(0.0, curTime, 0.08);
            }
        }

        // ★ドリフト突入・急ブレーキ開始の瞬間に「キキッ！」という初期食いつき音を1回鳴らす
        const isBrakingHard = (brake > 0.30 || handbrake) && speed > 18;
        const driftStarted = isDrifting && !this.wasDrifting && speed > 18;
        const brakeStarted = isBrakingHard && !this.wasBrakingHard;
        const suddenSlide = (driftIntensity > 0.28 && (this.prevDriftIntensity || 0) < 0.12 && speed > 18);

        if (driftStarted || brakeStarted || suddenSlide) {
            this.playTireOnset(Math.max(driftIntensity, isBrakingHard ? 0.85 : 0.6));
        }

        // ★ドリフト終了・グリップ回復（トラクションスナップ音）
        if (this.wasDrifting && !isDrifting && speed > 22 && driftIntensity === 0) {
            this.playTractionSnap(Math.min(1.0, (speed - 20) / 40.0));
        }

        this.wasDrifting = isDrifting;
        this.wasBrakingHard = isBrakingHard;
        this.prevDriftIntensity = driftIntensity;

        if (this.tireGain) {
            const releaseTime = (driftIntensity > 0) ? 0.035 : 0.065;
            this.tireGain.gain.setTargetAtTime(squealVol, curTime, releaseTime);
        }
    }

    /**
     * ガレージ画面用：プロシージャル・エキゾースト空ぶかし鑑賞 2.0
     * 録音不使用：純粋な物理モデリングによる爽快な吹け上がり・レブ打ち・アフターファイヤ炎
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

        if (this._revPreviewInterval) {
            clearInterval(this._revPreviewInterval);
            this._revPreviewInterval = null;
        }

        this._revPreviewInterval = setInterval(() => {
            step++;
            if (step <= 24) {
                // スロットル全開で一気に吹け上がり！
                currentRpm += (redline * 0.96 - currentRpm) * 0.22;
                this.updateEngine(currentRpm, 1.0, false, 0, false, redline);
            } else if (step <= 38) {
                // レッドゾーン到達：爽快なレブ打ちスタッターバウンス！
                currentRpm = redline - Math.random() * 120;
                this.updateEngine(currentRpm, 1.0, false, 0, true, redline);
                if (step % 5 === 0) {
                    this.playAfterfireSound(0.85);
                    if (onPopCallback) onPopCallback(0.85);
                }
            } else if (step <= 52) {
                // アクセル全閉＆減速クラックル＋アフターファイヤ
                currentRpm -= (currentRpm - 1000) * 0.22;
                this.updateEngine(currentRpm, 0.0, false, 0, false, redline);
                if (step === 36) {
                    this.playAfterfireSound(1.3);
                    if (onPopCallback) onPopCallback(1.3);
                }
            } else {
                this.updateEngine(1000, 0.0, false, 0, false, redline);
                clearInterval(this._revPreviewInterval);
                this._revPreviewInterval = null;
            }
        }, 16);
    }


    setupTireSqueal() {
        // マスタータイヤゲインノード
        this.tireGain = this.ctx.createGain();
        this.tireGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        // ★左右荷重移動ステレオパンナー（遠心力で外側輪へ音像がリアルタイムにシフト）
        if (this.ctx.createStereoPanner) {
            this.tirePanner = this.ctx.createStereoPanner();
            this.tireGain.connect(this.tirePanner);
            this.tirePanner.connect(this.sfxGain);
        } else {
            this.tireGain.connect(this.sfxGain);
        }

        // ★スリップ角・天候連動ダイナミックEQ（激しいフルカウンターでエッジが立ち、雨天で丸まる）
        this.tireToneFilter = this.ctx.createBiquadFilter();
        this.tireToneFilter.type = 'highshelf';
        this.tireToneFilter.frequency.setValueAtTime(3200, this.ctx.currentTime);
        this.tireToneFilter.gain.setValueAtTime(0.0, this.ctx.currentTime);

        // ① 実音スキールループ用ゲイン -> トーンEQ -> マスタータイヤゲイン
        this.tireLoopGain = this.ctx.createGain();
        this.tireLoopGain.gain.setValueAtTime(1.1, this.ctx.currentTime);
        this.tireLoopGain.connect(this.tireToneFilter);
        this.tireToneFilter.connect(this.tireGain);

        // ② 路面接地アスファルト研磨グラインド（低中域の重厚な摩擦土台＋高域微粒子クラックル）
        const sampleRate = this.ctx.sampleRate;
        const grindBufSize = Math.floor(sampleRate * 2.0);
        const grindBuffer = this.ctx.createBuffer(2, grindBufSize, sampleRate);
        const gL = grindBuffer.getChannelData(0);
        const gR = grindBuffer.getChannelData(1);
        let lastL = 0, lastR = 0;
        for (let i = 0; i < grindBufSize; i++) {
            // ブラウンノイズ（低域重厚グラインド）
            const wL = Math.random() * 2 - 1;
            const wR = Math.random() * 2 - 1;
            lastL = 0.92 * lastL + 0.08 * wL;
            lastR = 0.92 * lastR + 0.08 * wR;
            // アスファルト砕石パチパチ成分（微粒子クラックル）
            const grainL = Math.pow(Math.abs(wL), 4.0) * Math.sign(wL) * 0.4;
            const grainR = Math.pow(Math.abs(wR), 4.0) * Math.sign(wR) * 0.4;
            gL[i] = lastL * 3.5 + grainL;
            gR[i] = lastR * 3.5 + grainR;
        }

        const grindSource = this.ctx.createBufferSource();
        grindSource.buffer = grindBuffer;
        grindSource.loop = true;

        // 低中域接地グラインド（450Hz lowpass）
        this.tireGrindFilter = this.ctx.createBiquadFilter();
        this.tireGrindFilter.type = 'lowpass';
        this.tireGrindFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
        this.tireGrindFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

        this.tireGrindGain = this.ctx.createGain();
        this.tireGrindGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

        grindSource.connect(this.tireGrindFilter);
        this.tireGrindFilter.connect(this.tireGrindGain);
        this.tireGrindGain.connect(this.tireGain);

        // 高域アスファルト砕石・タイヤカス擦過テクスチャ（2400Hz bandpass, Q:0.8, -14dB）
        this.tireGrainFilter = this.ctx.createBiquadFilter();
        this.tireGrainFilter.type = 'bandpass';
        this.tireGrainFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
        this.tireGrainFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

        this.tireGrainGain = this.ctx.createGain();
        this.tireGrainGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

        grindSource.connect(this.tireGrainFilter);
        this.tireGrainFilter.connect(this.tireGrainGain);
        this.tireGrainGain.connect(this.tireGain);

        grindSource.start();

        // 組み込みBase64オーディオの自動デコード開始
        this._loadEmbeddedTireAudio();
    }

    _loadEmbeddedTireAudio() {
        if (this.tireSamplesLoaded || !this.ctx) return;
        const data = window.TIRE_AUDIO_DATA;
        if (!data) {
            console.warn('[AudioManager] window.TIRE_AUDIO_DATA not found.');
            return;
        }

        const decodeBase64 = (b64) => {
            try {
                const bin = window.atob(b64);
                const len = bin.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = bin.charCodeAt(i);
                }
                return bytes.buffer;
            } catch (e) {
                console.error('[AudioManager] Base64 decode failed:', e);
                return null;
            }
        };

        const onsetAb = decodeBase64(data.onsetWavBase64);
        const loopAb = decodeBase64(data.loopWavBase64);

        if (onsetAb) {
            this.ctx.decodeAudioData(onsetAb.slice(0), (buf) => {
                this.tireOnsetBuffer = buf;
                console.log('[AudioManager] Tire onset buffer decoded successfully.');
            }, (err) => {
                console.warn('[AudioManager] Failed to decode onset buffer:', err);
            });
        }

        if (loopAb) {
            this.ctx.decodeAudioData(loopAb.slice(0), (buf) => {
                this.tireLoopBuffer = buf;
                this.tireSamplesLoaded = true;
                console.log('[AudioManager] Tire loop buffer decoded successfully.');
                this._ensureTireLoopPlaying();
            }, (err) => {
                console.warn('[AudioManager] Failed to decode loop buffer:', err);
            });
        }
    }

    _ensureTireLoopPlaying() {
        if (!this.ctx || !this.tireLoopBuffer || !this.tireLoopGain) return;
        if (this.tireLoopSource && this.tireLoopPlaying) return;

        try {
            if (this.tireLoopSource) {
                try { this.tireLoopSource.stop(); } catch (e) {}
                try { this.tireLoopSource.disconnect(); } catch (e) {}
            }
            const src = this.ctx.createBufferSource();
            src.buffer = this.tireLoopBuffer;
            src.loop = true;
            src.connect(this.tireLoopGain);
            src.onended = () => {
                this.tireLoopPlaying = false;
            };
            src.start(0);
            this.tireLoopSource = src;
            this.tireLoopPlaying = true;
            console.log('[AudioManager] Tire skid loop source active.');
        } catch (e) {
            console.warn('[AudioManager] Failed to start tire loop:', e);
        }
    }

    playTireOnset(intensity = 0.6) {
        if (!this.initialized || !this.ctx) return;
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        const now = this.ctx.currentTime;
        if (this._lastOnsetPlayTime && (now - this._lastOnsetPlayTime < 0.18)) {
            return;
        }
        this._lastOnsetPlayTime = now;

        if (this.tireOnsetBuffer) {
            try {
                const src = this.ctx.createBufferSource();
                src.buffer = this.tireOnsetBuffer;
                src.playbackRate.setValueAtTime(0.96 + Math.random() * 0.08, now);
                const gain = this.ctx.createGain();
                const vol = Math.min(1.2, 0.75 + intensity * 0.35);
                gain.gain.setValueAtTime(vol, now);
                src.connect(gain);
                gain.connect(this.sfxGain);
                src.start(now);
            } catch (e) {
                console.warn('[AudioManager] playTireOnset buffer playback error:', e);
            }
        } else {
            // バッファデコード前フォールバック：叫び声オシレーターは一切使わずスナップノイズのみ
            const bufLen = Math.floor(this.ctx.sampleRate * 0.05);
            const snapBuf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
            const snapData = snapBuf.getChannelData(0);
            for (let i = 0; i < bufLen; i++) {
                const env = Math.exp(-i / (this.ctx.sampleRate * 0.010));
                snapData[i] = (Math.random() * 2 - 1) * env;
            }
            const snapSrc = this.ctx.createBufferSource();
            snapSrc.buffer = snapBuf;
            const snapFilter = this.ctx.createBiquadFilter();
            snapFilter.type = 'bandpass';
            snapFilter.frequency.setValueAtTime(1800, now);
            snapFilter.Q.setValueAtTime(1.2, now);
            const snapGain = this.ctx.createGain();
            snapGain.gain.setValueAtTime(0.4, now);
            snapSrc.connect(snapFilter);
            snapFilter.connect(snapGain);
            snapGain.connect(this.sfxGain);
            snapSrc.start(now);
        }
    }

    playTractionSnap(intensity = 0.5) {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (this._lastSnapPlayTime && (now - this._lastSnapPlayTime < 0.30)) return;
        this._lastSnapPlayTime = now;

        // タイヤが路面に再密着・グリップ回復する瞬間の低音ゴムスナップ音（0.06秒）
        const bufLen = Math.floor(this.ctx.sampleRate * 0.06);
        const snapBuf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
        const data = snapBuf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            const env = Math.exp(-i / (this.ctx.sampleRate * 0.012));
            data[i] = (Math.random() * 2 - 1) * env;
        }
        const src = this.ctx.createBufferSource();
        src.buffer = snapBuf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.24 * Math.min(1.0, intensity), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.058);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        src.start(now);
    }

    playBlowOffSound(intensity = 1.0, isTwinTurbo = false) {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (this._lastBlowOffTime && (now - this._lastBlowOffTime < 0.35)) return;
        this._lastBlowOffTime = now;

        // 1. 高圧エアー瞬間開放シューッ音（0.22秒）
        const bufLen = Math.floor(this.ctx.sampleRate * 0.25);
        const buf = this.ctx.createBuffer(1, bufLen, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            const decay = Math.exp(-i / (this.ctx.sampleRate * 0.040));
            data[i] = (Math.random() * 2 - 1) * decay;
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isTwinTurbo ? 3200 : 2500, now);
        filter.Q.setValueAtTime(2.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35 * Math.min(1.2, 0.7 + intensity * 0.4), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        src.start(now);

        // 2. バックタービン・サージフラッター「ピロロロロ！」
        const surgeLen = Math.floor(this.ctx.sampleRate * 0.30);
        const surgeBuf = this.ctx.createBuffer(1, surgeLen, this.ctx.sampleRate);
        const sData = surgeBuf.getChannelData(0);
        const flutterHz = isTwinTurbo ? 26.0 : 20.0;
        const baseFreq = isTwinTurbo ? 1650 : 1400;
        for (let i = 0; i < surgeLen; i++) {
            const t = i / this.ctx.sampleRate;
            const decay = Math.exp(-t * 7.0);
            const flutter = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * flutterHz);
            const carrier = Math.sin(t * Math.PI * 2 * (baseFreq - t * 900));
            sData[i] = carrier * flutter * decay * 0.40;
        }
        const sSrc = this.ctx.createBufferSource();
        sSrc.buffer = surgeBuf;
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.28 * Math.min(1.2, intensity), now);
        sSrc.connect(sGain);
        sGain.connect(this.sfxGain);
        sSrc.start(now);
    }

    playAntiLagPop(intensity = 1.0) {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (this._lastMisfireTime && (now - this._lastMisfireTime < 0.080)) return;
        this._lastMisfireTime = now;

        // CE9AエボIII エキマニ内二次エア爆発（乾いた金属的爆裂音「パンッ！」）
        this._synthesizeExhaustPop(now, 0.85 * Math.min(1.2, intensity), 1.35);
        if (Math.random() < 0.45) {
            this._synthesizeExhaustPop(now + 0.038, 0.60 * intensity, 1.55);
        }
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
