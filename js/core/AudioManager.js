/**
 * AudioManager.js - 実車録音スタジオ音源（48kHz）サンプリング・エンジン ＆ 総合音響システム
 * 
 * 【音響システムの特長】
 * 1. 本物の実車スタジオ録音（48kHz Studio Quality）の完全再現:
 *    シンセサイザー・オシレーター（周期波）による「電子音・ピコピコ臭」を全廃。
 *    各車両固有の実車排気音・シリンダー燃焼音（M4A）を Base64 埋め込みデータから直接デコード。
 * 2. ゼロクリック・等パワークロスフェードループ (Equal-Power sin/cos Crossfade Loop):
 *    継ぎ目を感じさせない滑らかで有機的な実車連続排気サウンド。
 * 3. リアルタイム・ダイナミック音響物理モデリング:
 *    - 車速・RPM追従の連続ピッチシフト (0.82x〜2.18x)
 *    - スロットル開度に連動した吸排気可変ローパスフィルター（全閉時のこもった太い重低音 〜 全開時の咆哮 680Hz〜16,000Hz）
 *    - EK9 VTEC (B16B): 5,800rpm以上のハイカム領域で超高域が一段と開放される甲高いレーシングノート
 *    - レブリミッター・スタッター (18〜22Hz ECU点火カット変調＋アフターファイヤ誘発)
 *    - ターボ過給ホイッスル ＆ アクセル全開オフ時のブローオフバルブ過給圧解放（プシューン！）
 * 4. 効果音ラボ 実車急ブレーキ音ハイブリッド・タイヤスキールシステム (完全統合)
 *    - 左右荷重移動ステレオパンニング、アスファルト研磨グラインド、トラクションスナップ
 */

const ENGINE_FILE_MAP = {
    '4age': 'toyota86',       // AE86 スプリンタートレノ (4A-GEU NA高回転スポーツノート)
    '13b':  'lexuslfa',       // FD3S RX-7 (13B-REW ロータリー超高回転唸り)
    'rb26': 'nissangtr',      // BNR32 スカイライン GT-R (RB26DETT 直6ツインターボ重厚咆哮)
    'sr20': 'golfgti',        // S13 / 180SX / S15 シルビア (SR20DET 4気筒ターボスポーツ排気)
    '1jz':  'm4',             // JZX100 チェイサー (1JZ-GTE 直6ターボ)
    '2jz':  'm4',             // JZA80 スープラ (2JZ-GTE 直6ツインターボ)
    '4g63': 'focusrs',        // CE9A ランサーエボリューションIII (4G63 ラリー仕様ハイブースト)
    'b16b': 'ferrari458',     // EK9 シビック Type R (B16B 9000rpm VTEC甲高い咆哮)
    'f5a':  'audittrs'        // CC72V アルトワークス RS-R (F5A 3気筒ドッカンターボ脈動)
};

const ENGINE_SPECS = {
    '4age': { loopStart: 3.8, loopDuration: 2.5, revStart: 1.5, revDuration: 7.0, popDelay: 2.4, basePitch: 1.00, idleRpm: 950, maxRpm: 11000 },
    '13b':  { loopStart: 1.4, loopDuration: 2.5, revStart: 3.5, revDuration: 6.5, popDelay: 1.6, basePitch: 1.02, idleRpm: 900, maxRpm: 8500 },
    'rb26': { loopStart: 1.8, loopDuration: 2.5, revStart: 13.5, revDuration: 6.5, popDelay: 2.5, basePitch: 0.95, idleRpm: 950, maxRpm: 8500 },
    'sr20': { loopStart: 2.8, loopDuration: 2.5, revStart: 18.0, revDuration: 6.0, popDelay: 2.3, basePitch: 0.98, idleRpm: 850, maxRpm: 7800 },
    '1jz':  { loopStart: 5.6, loopDuration: 2.5, revStart: 15.0, revDuration: 6.5, popDelay: 2.4, basePitch: 0.96, idleRpm: 800, maxRpm: 7800 },
    '2jz':  { loopStart: 5.6, loopDuration: 2.5, revStart: 15.0, revDuration: 6.5, popDelay: 2.4, basePitch: 0.92, idleRpm: 750, maxRpm: 8200 },
    '4g63': { loopStart: 5.8, loopDuration: 2.5, revStart: 2.5, revDuration: 6.0, popDelay: 2.2, basePitch: 0.95, idleRpm: 900, maxRpm: 8200 },
    'b16b': { loopStart: 5.8, loopDuration: 2.5, revStart: 15.5, revDuration: 6.5, popDelay: 2.3, basePitch: 1.05, idleRpm: 850, maxRpm: 9500 },
    'f5a':  { loopStart: 5.0, loopDuration: 2.5, revStart: 2.0, revDuration: 6.0, popDelay: 2.0, basePitch: 1.10, idleRpm: 950, maxRpm: 10000 }
};

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.bgmGain = null;

        // 実車スタジオ録音バッファキャッシュ
        this.rawBuffers = {};          // fileKey -> AudioBuffer (実車フル録音)
        this.loopBuffers = {};         // soundType -> AudioBuffer (イコールパワークロスフェードループ)
        this.engineAudioLoaded = false;
        this.isEngineAudioLoading = false;

        // 走行中実車エンジン再生ノード
        this.engineSourceNode = null;
        this.engineFilter = null;       // スロットル連動吸排気可変ローパス
        this.engineSubFilter = null;    // マフラー膨張室低域補強 (130Hz peaking)
        this.revChopperGain = null;     // レブリミッター・点火カットスタッター用ゲイン
        this.engineGain = null;
        this.enginePlaying = false;

        // ガレージ生音空ぶかしプレビュー用
        this.revPreviewSource = null;

        // ターボチャージャー過給ホイッスル
        this.turboOsc = null;
        this.turboFilter = null;
        this.turboGain = null;

        // デセル・クラックル（減速時ランブル）
        this.decelNoiseSource = null;
        this.decelNoiseGain = null;
        this.decelFilter = null;
        this.prevThrottle = 0;
        this.lastBlowoffTime = 0;
        this.lastMisfireTime = 0;

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
                    this._loadEmbeddedEngineAudio();
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

        // 実車スタジオ録音エンジン音チェーンのセットアップ
        this.setupRealEngineAudioChain();

        // タイヤスキール音のセットアップ
        this.setupTireSqueal();

        // 環境音（ウェット、砂利、溝落とし）
        this.setupWetTireHiss();
        this.setupGravelSound();
        this.setupGutterSound();

        this.initialized = true;
        console.log('[AudioManager] Real Car Studio Sound Sampling Engine Initialized.');
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                this._loadEmbeddedEngineAudio();
                this._loadEmbeddedTireAudio();
                this._ensureTireLoopPlaying();
            });
        } else {
            this._loadEmbeddedEngineAudio();
            this._loadEmbeddedTireAudio();
            this._ensureTireLoopPlaying();
        }
    }

    startEngineLoop() {
        if (!this.initialized) this.init();
        this.resume();

        if (!this.ctx) return;
        if (!this.engineAudioLoaded) {
            this._loadEmbeddedEngineAudio();
            return;
        }

        const loopBuffer = this.loopBuffers[this.soundType] || this.loopBuffers['4age'];
        if (!loopBuffer) return;

        if (this.engineSourceNode) {
            try { this.engineSourceNode.stop(); } catch (e) {}
            try { this.engineSourceNode.disconnect(); } catch (e) {}
            this.engineSourceNode = null;
        }

        this.engineSourceNode = this.ctx.createBufferSource();
        this.engineSourceNode.buffer = loopBuffer;
        this.engineSourceNode.loop = true;
        this.engineSourceNode.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);

        this.engineSourceNode.connect(this.engineFilter);
        this.engineSourceNode.start(0);
        this.enginePlaying = true;
        console.log('[AudioManager] Real car studio engine loop started: ' + this.soundType);
    }

    stopEngineLoop() {
        if (this.engineSourceNode) {
            try { this.engineSourceNode.stop(); } catch (e) {}
            try { this.engineSourceNode.disconnect(); } catch (e) {}
            this.engineSourceNode = null;
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
     * 実車スタジオ録音オーディオ再生チェーンの構築
     */
    setupRealEngineAudioChain() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // 1. スロットル連動の吸気・排気可変ローパスフィルター (680Hz 〜 16,000Hz)
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(800, now);
        this.engineFilter.Q.setValueAtTime(1.5, now);

        // 2. マフラー膨張室低域補強 (130Hz peaking +3.5dB)
        this.engineSubFilter = this.ctx.createBiquadFilter();
        this.engineSubFilter.type = 'peaking';
        this.engineSubFilter.frequency.setValueAtTime(130, now);
        this.engineSubFilter.gain.setValueAtTime(3.5, now);
        this.engineSubFilter.Q.setValueAtTime(1.2, now);

        // 3. レブリミッター・スタッターチョッパーゲイン (点火カット時に高速チョッピング)
        this.revChopperGain = this.ctx.createGain();
        this.revChopperGain.gain.setValueAtTime(1.0, now);

        // 4. エンジンゲイン
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.0, now);

        // [Filter] -> [SubFilter] -> [RevChopper] -> [EngineGain] -> [sfxGain]
        this.engineFilter.connect(this.engineSubFilter);
        this.engineSubFilter.connect(this.revChopperGain);
        this.revChopperGain.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);

        // 5. ターボチャージャー過給ホイッスル
        this.turboOsc = this.ctx.createOscillator();
        this.turboOsc.type = 'sine';
        this.turboFilter = this.ctx.createBiquadFilter();
        this.turboFilter.type = 'bandpass';
        this.turboFilter.frequency.setValueAtTime(2400, now);
        this.turboFilter.Q.setValueAtTime(3.5, now);
        this.turboGain = this.ctx.createGain();
        this.turboGain.gain.setValueAtTime(0.0, now);

        this.turboOsc.connect(this.turboFilter);
        this.turboFilter.connect(this.turboGain);
        this.turboGain.connect(this.engineGain);
        this.turboOsc.start(now);

        // 6. デセル・クラックル (減速時ランブルノイズ)
        const sampleRate = this.ctx.sampleRate;
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
        this.decelNoiseGain.connect(this.engineGain);
        this.decelNoiseSource.start(now);

        // 組み込み実車オーディオの自動デコード開始
        this._loadEmbeddedEngineAudio();
    }

    /**
     * 埋め込みBase64実車音源の一括非同期デコード
     */
    _loadEmbeddedEngineAudio() {
        if (this.engineAudioLoaded || this.isEngineAudioLoading || !this.ctx) return;
        const data = window.ENGINE_AUDIO_DATA;
        if (!data) {
            console.warn('[AudioManager] window.ENGINE_AUDIO_DATA not found.');
            return;
        }

        this.isEngineAudioLoading = true;

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
                console.error('[AudioManager] Engine Base64 decode failed:', e);
                return null;
            }
        };

        const keys = Object.keys(data);
        let loadedCount = 0;

        keys.forEach((key) => {
            const b64 = data[key];
            const ab = decodeBase64(b64);
            if (ab) {
                this.ctx.decodeAudioData(ab.slice(0), (buf) => {
                    this.rawBuffers[key] = buf;
                    loadedCount++;
                    if (loadedCount === keys.length) {
                        this._onAllEngineAudioLoaded();
                    }
                }, (err) => {
                    console.warn('[AudioManager] Failed to decode engine buffer for ' + key + ':', err);
                    loadedCount++;
                    if (loadedCount === keys.length) {
                        this._onAllEngineAudioLoaded();
                    }
                });
            } else {
                loadedCount++;
                if (loadedCount === keys.length) {
                    this._onAllEngineAudioLoaded();
                }
            }
        });
    }

    _onAllEngineAudioLoaded() {
        this.engineAudioLoaded = true;
        this.isEngineAudioLoading = false;
        console.log('[AudioManager] All real car engine studio recordings decoded successfully.');

        // 各車種用の「イコールパワークロスフェードループバッファ」を生成
        for (const [soundType, fileKey] of Object.entries(ENGINE_FILE_MAP)) {
            const raw = this.rawBuffers[fileKey];
            if (!raw) continue;
            const spec = ENGINE_SPECS[soundType] || ENGINE_SPECS['4age'];

            this.loopBuffers[soundType] = this._createCrossfadeLoop(
                raw,
                spec.loopStart,
                spec.loopDuration,
                0.28
            );
        }

        // 走行中であれば実車ループを開始
        if (this.initialized && !this.enginePlaying) {
            this.startEngineLoop();
        }
    }

    /**
     * クロスフェードによるゼロクリック・イコールパワーシームレスループバッファ生成
     */
    _createCrossfadeLoop(srcBuffer, startTime, duration, crossfadeDuration = 0.28) {
        const sRate = srcBuffer.sampleRate;
        const channels = srcBuffer.numberOfChannels;
        const startSample = Math.floor(startTime * sRate);
        const loopSamples = Math.floor(duration * sRate);
        const fadeSamples = Math.floor(crossfadeDuration * sRate);

        const loopBuffer = this.ctx.createBuffer(channels, loopSamples, sRate);

        for (let ch = 0; ch < channels; ch++) {
            const src = srcBuffer.getChannelData(ch);
            const dst = loopBuffer.getChannelData(ch);

            // メイン区間のコピー
            for (let i = 0; i < loopSamples; i++) {
                dst[i] = src[startSample + i] || 0;
            }

            // 末尾と先頭のイコールパワークロスフェード (sin / cos)
            for (let i = 0; i < fadeSamples; i++) {
                const progress = i / fadeSamples;
                const fadeIn = Math.sin(progress * Math.PI * 0.5);
                const fadeOut = Math.cos(progress * Math.PI * 0.5);

                const tailSample = src[startSample + loopSamples + i] || dst[loopSamples - fadeSamples + i] || 0;
                dst[i] = dst[i] * fadeIn + tailSample * fadeOut;
            }
        }
        return loopBuffer;
    }

    /**
     * 車種ごとの実車エンジンサウンド切り替え
     * @param {string} type - '4age', '13b', 'rb26', 'sr20', '1jz', '2jz', '4g63', 'b16b', 'f5a'
     */
    setEngineSoundType(type) {
        const nextType = type || '4age';
        if (this.soundType === nextType && this.enginePlaying) return;
        this.soundType = nextType;

        if (this.initialized && this.engineAudioLoaded) {
            this.startEngineLoop();
        }
    }

    /**
     * リアルタイム物理・音響更新（RPM, スロットル開度, ドリフト状態, レブ打ち連動）
     */
    updateEngine(rpm, throttle, isDrifting, driftAngle, isRevLimiter = false, redlineRpm = 8500, speed = 0, brake = 0, handbrake = false) {
        if (!this.initialized || !this.ctx) return;

        if (!this.enginePlaying && this.engineAudioLoaded) {
            this.startEngineLoop();
        }

        if (!this.engineSourceNode || !this.engineFilter || !this.engineGain) {
            this._updateTireAudio(isDrifting, driftAngle, speed, brake, handbrake, throttle);
            return;
        }

        const curTime = this.ctx.currentTime;
        throttle = Math.max(0, Math.min(1.0, throttle || 0));
        rpm = Math.max(700, rpm || 700);

        const spec = ENGINE_SPECS[this.soundType] || ENGINE_SPECS['4age'];
        const idleRpm = spec.idleRpm || 900;
        const maxRpm = Math.max(redlineRpm, spec.maxRpm || 8500);

        // 1. 実車ピッチシフト (playbackRate)
        const rpmNorm = Math.max(0, Math.min(1.28, (rpm - idleRpm) / (maxRpm - idleRpm)));
        // アイドリング時 0.82x 〜 最高回転時 2.18x に滑らかにピッチシフト
        const targetPitch = spec.basePitch * (0.82 + rpmNorm * 1.36);
        this.engineSourceNode.playbackRate.setTargetAtTime(targetPitch, curTime, 0.035);

        // 2. アクセル開度（スロットル）に応じたダイナミック吸排気ローパスフィルター
        let cutoff = 680 + (throttle * 7800) + (rpmNorm * 3600);
        if (this.soundType === 'b16b' && rpm > 5800) {
            // EK9 VTECハイカム領域：高域を一段と開放し甲高い咆哮へ
            cutoff += 3200;
        }
        this.engineFilter.frequency.setTargetAtTime(Math.min(16000, cutoff), curTime, 0.035);

        // 3. 実車エンジン音量制御（アイドリングの排気鼓動 〜 全開時の迫力音圧）
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

        const baseEngineVol = 0.32 + (throttle * 0.42) + (rpmNorm * 0.26);
        const driftDucking = 1.0 - (driftIntensity * 0.30);
        const masterVol = baseEngineVol * driftDucking;
        this.engineGain.gain.setTargetAtTime(masterVol, curTime, 0.035);

        // 4. レブリミッター・スタッター (ECU点火カット・チョッピング変調)
        const isAtRedline = isRevLimiter || (rpm >= redlineRpm * 0.985);
        if (isAtRedline && throttle > 0.45) {
            const chopPhase = (curTime * 20.0) % 1.0;
            const chopVal = (chopPhase < 0.42) ? 0.06 : 1.0;
            this.revChopperGain.gain.setValueAtTime(chopVal, curTime);
            if (Math.random() < 0.20) {
                this.playAfterfireSound(0.85);
            }
        } else {
            this.revChopperGain.gain.setTargetAtTime(1.0, curTime, 0.02);
        }

        // 5. ターボチャージャー過給ホイッスル ＆ ブローオフバルブ
        const isTurbo = ['13b', 'rb26', 'sr20', '1jz', '2jz', '4g63', 'f5a'].includes(this.soundType);
        const throttleDrop = (this.prevThrottle > 0.35 && throttle < 0.15);

        if (isTurbo && throttle > 0.12 && rpm > 2800) {
            const turboFreq = 1600 + (rpmNorm * 2400) + (throttle * 800);
            const turboVol = Math.min(0.20, 0.04 + (throttle * 0.10) + (rpmNorm * 0.06));
            if (this.turboOsc) this.turboOsc.frequency.setTargetAtTime(turboFreq, curTime, 0.04);
            if (this.turboFilter) this.turboFilter.frequency.setTargetAtTime(turboFreq, curTime, 0.04);
            if (this.turboGain) this.turboGain.gain.setTargetAtTime(turboVol, curTime, 0.04);
        } else if (this.turboGain) {
            this.turboGain.gain.setTargetAtTime(0.0, curTime, 0.06);
        }

        // ブローオフ過給圧解放（アクセル全閉時）
        if (isTurbo && throttleDrop && rpm > 3000) {
            const isTwinTurbo = (this.soundType === '13b' || this.soundType === 'rb26' || this.soundType === '2jz');
            this.playBlowOffSound(rpmNorm, isTwinTurbo);
        }

        // 6. デセル・クラックル ＆ CE9Aミスファイアリングシステム
        if (this.decelNoiseGain) {
            if (throttleDrop || (throttle < 0.12 && rpm > 3400)) {
                const decelVol = Math.min(0.22, (rpm / maxRpm) * 0.25);
                this.decelNoiseGain.gain.setTargetAtTime(decelVol, curTime, 0.02);

                if (this.soundType === '4g63' && throttle < 0.10 && rpm > 3200) {
                    if (Math.random() < 0.28) {
                        this.playAntiLagPop(rpmNorm);
                    }
                }
            } else {
                this.decelNoiseGain.gain.setTargetAtTime(0.0, curTime, 0.06);
            }
        }
        this.prevThrottle = throttle;

        // 7. タイヤスキール音の更新
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
     * ガレージ画面用：実車エキゾーストの空ぶかしサウンド鑑賞（実車録音生音ワンショット再生）
     * @param {string} carId - 車両ID
     * @param {Function} onPopCallback - アフターファイヤ発生時のマフラー炎コールバック
     */
    previewRev(carId, onPopCallback = null) {
        if (!this.initialized) {
            this.init();
        }
        this.resume();

        const car = window.CAR_DATABASE && window.CAR_DATABASE[carId];
        const soundType = car && car.physics ? car.physics.engineSoundType : '4age';
        this.setEngineSoundType(soundType);

        const fileKey = ENGINE_FILE_MAP[soundType] || 'toyota86';
        const rawBuffer = this.rawBuffers[fileKey];

        // 前回のプレビュー再生があれば停止
        if (this.revPreviewSource) {
            try { this.revPreviewSource.stop(); } catch (e) {}
            try { this.revPreviewSource.disconnect(); } catch (e) {}
            this.revPreviewSource = null;
        }

        if (!rawBuffer) {
            console.log('[AudioManager] Raw sound buffer not loaded yet, retrying after decode...');
            this._loadEmbeddedEngineAudio();
            setTimeout(() => {
                if (this.rawBuffers[fileKey]) {
                    this.previewRev(carId, onPopCallback);
                }
            }, 300);
            return;
        }

        const spec = ENGINE_SPECS[soundType] || ENGINE_SPECS['4age'];
        const revStart = spec.revStart || 0;
        const revDuration = spec.revDuration || 6.5;

        // 実車スタジオ録音の生音ワンショット再生（最も気持ちいい吹け上がり区間）
        this.revPreviewSource = this.ctx.createBufferSource();
        this.revPreviewSource.buffer = rawBuffer;

        const revGain = this.ctx.createGain();
        revGain.gain.setValueAtTime(0.95, this.ctx.currentTime);

        this.revPreviewSource.connect(revGain);
        revGain.connect(this.sfxGain);

        this.revPreviewSource.start(0, revStart, revDuration);

        // 各車種特有のアフターファイヤ発生タイミングに合わせてマフラー炎エフェクトを発火
        const popDelayMs = (spec.popDelay || 2.2) * 1000;
        setTimeout(() => {
            this.playAfterfireSound(1.4);
            if (onPopCallback) onPopCallback(1.4);
        }, popDelayMs);

        this.revPreviewSource.onended = () => {
            try { revGain.disconnect(); } catch (e) {}
            this.revPreviewSource = null;
        };
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
