/**
 * AudioManager.js - 実車録音オーディオエンジン、スキール音、環境効果音、ユーロビートBGM
 * 機械的なシンセサイザー（オシレーター）を完全撤廃し、
 * 各車種（AE86, RX-7, GT-R, シルビア, チェイサー, スープラ, エボIII, シビック, アルトワークス）の
 * 本物の実車録音・排気音（48kHzスタジオ音源）を使用したリアルオーディオシステム
 */

const SOUND_FILE_MAP = {
    '4age': 'toyota86.m4a',       // AE86 スプリンタートレノ (4A-GEU NA高回転)
    '13b':  'lexuslfa.m4a',       // FD3S RX-7 (13B-REW ロータリーツインターボ超高周波)
    'rb26': 'nissangtr.m4a',     // BNR32 スカイライン GT-R (RB26DETT 直6ツインターボ重低音)
    'sr20': 'golfgti.m4a',       // PS13 / S15 / RPS13 180SX (SR20DET 4気筒ターボ)
    '1jz':  'm4.m4a',            // JZX100 チェイサー (1JZ-GTE 直6ターボ)
    '2jz':  'm4.m4a',            // JZA80 スープラ (2JZ-GTE 直6ツインターボ)
    '4g63': 'focusrs.m4a',       // CE9A ランサーエボリューションIII (4G63 ハイブーストターボ)
    'b16b': 'ferrari458.m4a',   // EK9 シビック Type R (B16B 9000rpm超高回転VTEC)
    'f5a':  'audittrs.m4a'        // CC72V アルトワークス RS-R (F5A 3気筒ドッカンターボ)
};

const SOUND_SPECS = {
    '4age': { loopStart: 3.8, loopDuration: 2.5, popTime: 13.90, popDuration: 0.35, revStart: 1.5, revDuration: 7.0, popDelay: 2.4, basePitch: 1.00, idleRpm: 950, maxRpm: 11000 },
    '13b':  { loopStart: 1.4, loopDuration: 2.5, popTime: 5.10,  popDuration: 0.40, revStart: 3.5, revDuration: 6.5, popDelay: 1.6, basePitch: 1.02, idleRpm: 900, maxRpm: 8500 },
    'rb26': { loopStart: 1.8, loopDuration: 2.5, popTime: 17.90, popDuration: 0.40, revStart: 13.5, revDuration: 6.5, popDelay: 2.5, basePitch: 0.95, idleRpm: 950, maxRpm: 8500 },
    'sr20': { loopStart: 2.8, loopDuration: 2.5, popTime: 21.45, popDuration: 0.35, revStart: 18.0, revDuration: 6.0, popDelay: 2.3, basePitch: 0.98, idleRpm: 850, maxRpm: 7800 },
    '1jz':  { loopStart: 5.6, loopDuration: 2.5, popTime: 16.75, popDuration: 0.40, revStart: 15.0, revDuration: 6.5, popDelay: 2.4, basePitch: 0.96, idleRpm: 800, maxRpm: 7800 },
    '2jz':  { loopStart: 5.6, loopDuration: 2.5, popTime: 16.75, popDuration: 0.40, revStart: 15.0, revDuration: 6.5, popDelay: 2.4, basePitch: 0.92, idleRpm: 750, maxRpm: 8200 },
    '4g63': { loopStart: 5.8, loopDuration: 2.5, popTime: 23.65, popDuration: 0.45, revStart: 2.5, revDuration: 6.0, popDelay: 2.2, basePitch: 0.95, idleRpm: 900, maxRpm: 8200 },
    'b16b': { loopStart: 5.8, loopDuration: 2.5, popTime: 16.30, popDuration: 0.35, revStart: 15.5, revDuration: 6.5, popDelay: 2.3, basePitch: 1.05, idleRpm: 850, maxRpm: 9500 },
    'f5a':  { loopStart: 5.0, loopDuration: 2.5, popTime: 20.50, popDuration: 0.35, revStart: 2.0, revDuration: 6.0, popDelay: 2.0, basePitch: 1.10, idleRpm: 950, maxRpm: 10000 }
};

class AudioManager {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isBgmEnabled = true;

        // ノード
        this.masterGain = null;
        this.sfxGain = null;
        this.bgmGain = null;

        // 実車オーディオバッファキャッシュ
        this.rawBuffers = {};         // ファイル名 -> AudioBuffer (実車フル録音)
        this.loopBuffers = {};        // soundType -> AudioBuffer (ゼロクリッククロスフェードループ)
        this.popBuffers = {};         // soundType -> AudioBuffer (実車マフラー破裂音)
        this.isAudioLoading = false;
        this.audioLoaded = false;

        // 走行中実車エンジン再生ノード
        this.engineSourceNode = null;
        this.engineFilter = null;
        this.engineGain = null;
        this.enginePlaying = false;

        // ガレージ生音空ぶかしノード
        this.revPreviewSource = null;

        // スキール音
        this.tireNoiseNode = null;
        this.tireFilter = null;
        this.tireGain = null;

        // 環境音（雨天、砂利、溝落とし）
        this.rainGain = null;
        this.wetSprayGain = null;
        this.gravelGain = null;
        this.gravelFilter = null;
        this.gutterGain = null;
        this.gutterFilter = null;

        // ユーロビートシーケンサー
        this.bgmInterval = null;
        this.bgmStep = 0;
        this.bpm = 155;

        this.initialized = false;
        this.soundType = '4age';
        this.lastThrottle = 0;
        this.lastBlowoffTime = 0;
    }

    init() {
        if (this.initialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // マスターゲイン
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // SFX & BGM ゲイン
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(0.90, this.ctx.currentTime);
        this.sfxGain.connect(this.masterGain);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        this.bgmGain.connect(this.masterGain);

        // 実車エンジン音チェーンのセットアップ
        this.setupRealEngineAudioChain();

        // 実車音源の非同期ロード
        this.loadAllRealCarSounds();

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

    /**
     * 実車エンジンサウンド再生チェーン
     * [AudioBufferSource] -> [Lowpass Filter (スロットル連動)] -> [Gain (音量連動)] -> [SFX Gain]
     */
    setupRealEngineAudioChain() {
        if (!this.ctx) return;

        // スロットル連動・吸気/排圧ダイナミックローパスフィルター
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
        this.engineFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

        // エンジンゲイン
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);
    }

    /**
     * 全車種の実車排気・エンジン音（48kHz実録音）を一括ロード＆バッファ生成
     */
    async loadAllRealCarSounds() {
        if (this.isAudioLoading || this.audioLoaded) return;
        this.isAudioLoading = true;

        const uniqueFiles = [...new Set(Object.values(SOUND_FILE_MAP))];
        const loadPromises = uniqueFiles.map(async (fileName) => {
            try {
                const response = await fetch('assets/sounds/' + fileName);
                if (!response.ok) throw new Error(`HTTP ${response.status} loading ${fileName}`);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
                this.rawBuffers[fileName] = audioBuffer;
            } catch (err) {
                console.warn(`[AudioManager] Failed to load real sound ${fileName}:`, err);
            }
        });

        await Promise.all(loadPromises);

        // 各車種用の「シームレスループバッファ」と「本物のアフターファイヤ破裂音」を生成
        for (const [soundType, fileName] of Object.entries(SOUND_FILE_MAP)) {
            const raw = this.rawBuffers[fileName];
            if (!raw) continue;

            const spec = SOUND_SPECS[soundType] || SOUND_SPECS['4age'];

            // 1. ゼロクリック・イコールパワークロスフェードループバッファ
            this.loopBuffers[soundType] = this._createCrossfadeLoop(
                raw,
                spec.loopStart,
                spec.loopDuration,
                0.28
            );

            // 2. 実車マフラー破裂音（アフターファイヤ）スライス
            this.popBuffers[soundType] = this._extractSlice(
                raw,
                spec.popTime,
                spec.popDuration
            );
        }

        this.audioLoaded = true;
        this.isAudioLoading = false;
        console.log('[AudioManager] All real car engine sounds loaded and initialized successfully.');

        // もしすでに初期化済みなら、現在の車種でループを開始
        if (this.initialized && !this.enginePlaying) {
            this.startEngineLoop();
        }
    }

    /**
     * クロスフェードによるゼロクリック・シームレスループバッファ生成
     */
    _createCrossfadeLoop(srcBuffer, startTime, duration, crossfadeDuration = 0.25) {
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

            // 末尾と先頭のイコールパワークロスフェード（sin / cos）
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
     * 実車音源から指定区間のサンプル（アフターファイヤ・過給圧等）を切り出し
     */
    _extractSlice(srcBuffer, startTime, duration) {
        const sRate = srcBuffer.sampleRate;
        const channels = srcBuffer.numberOfChannels;
        const startSample = Math.floor(startTime * sRate);
        const sliceSamples = Math.floor(duration * sRate);

        const sliceBuffer = this.ctx.createBuffer(channels, sliceSamples, sRate);

        for (let ch = 0; ch < channels; ch++) {
            const src = srcBuffer.getChannelData(ch);
            const dst = sliceBuffer.getChannelData(ch);

            for (let i = 0; i < sliceSamples; i++) {
                // 末尾を自然にフェードアウトさせてクリックノイズを除去
                const fadeOut = Math.min(1.0, (sliceSamples - i) / (sRate * 0.04));
                dst[i] = (src[startSample + i] || 0) * fadeOut;
            }
        }
        return sliceBuffer;
    }

    /**
     * 走行中の実車エンジンループ再生を開始
     */
    startEngineLoop() {
        if (!this.ctx || !this.audioLoaded) return;
        const loopBuffer = this.loopBuffers[this.soundType] || this.loopBuffers['4age'];
        if (!loopBuffer) return;

        if (this.engineSourceNode) {
            try { this.engineSourceNode.stop(); } catch (e) {}
            this.engineSourceNode.disconnect();
            this.engineSourceNode = null;
        }

        this.engineSourceNode = this.ctx.createBufferSource();
        this.engineSourceNode.buffer = loopBuffer;
        this.engineSourceNode.loop = true;
        this.engineSourceNode.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);

        this.engineSourceNode.connect(this.engineFilter);
        this.engineSourceNode.start();
        this.enginePlaying = true;
    }

    /**
     * 車種ごとの実車エンジンサウンド切り替え
     * @param {string} type - '4age', '13b', 'rb26', 'sr20', '1jz', '2jz', '4g63', 'b16b', 'f5a'
     */
    setEngineSoundType(type) {
        const nextType = type || '4age';
        if (this.soundType === nextType && this.enginePlaying) return;
        this.soundType = nextType;

        if (this.initialized && this.audioLoaded) {
            this.startEngineLoop();
        }
    }

    /**
     * ガレージ画面用：実車エキゾースト・空ぶかしサウンド鑑賞（生音録音ワンショット再生）
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

        const fileName = SOUND_FILE_MAP[soundType] || 'toyota86.m4a';
        const rawBuffer = this.rawBuffers[fileName];

        // 前回のプレビュー再生があれば停止
        if (this.revPreviewSource) {
            try { this.revPreviewSource.stop(); } catch (e) {}
            this.revPreviewSource.disconnect();
            this.revPreviewSource = null;
        }

        if (!rawBuffer) {
            console.log('[AudioManager] Raw sound buffer not loaded yet, retrying...');
            this.loadAllRealCarSounds().then(() => {
                this.previewRev(carId, onPopCallback);
            });
            return;
        }

        const spec = SOUND_SPECS[soundType] || SOUND_SPECS['4age'];
        const revStart = spec.revStart || 0;
        const revDuration = spec.revDuration || 6.5;

        // 実車フル録音を大迫力で生音ワンショット再生（最も気持ちいい吹け上がり区間を頭出し再生）
        this.revPreviewSource = this.ctx.createBufferSource();
        this.revPreviewSource.buffer = rawBuffer;

        const revGain = this.ctx.createGain();
        revGain.gain.setValueAtTime(0.95, this.ctx.currentTime);

        this.revPreviewSource.connect(revGain);
        revGain.connect(this.sfxGain);

        this.revPreviewSource.start(0, revStart, revDuration);

        // 各車種特有のアフターファイヤ発生タイミングに合わせて炎エフェクトを発火
        const popDelayMs = (spec.popDelay || 2.2) * 1000;
        setTimeout(() => {
            if (onPopCallback) onPopCallback(1.4);
        }, popDelayMs);

        // プレビュー終了時にクリーンアップ
        this.revPreviewSource.onended = () => {
            revGain.disconnect();
            this.revPreviewSource = null;
        };
    }

    /**
     * 走行中エンジン音のリアルタイム物理・音響モデリング更新
     * 車両のRPM、アクセル開度（スロットル）にリアルタイム連動
     */
    updateEngine(rpm, throttle, isDrifting, driftAngle) {
        if (!this.initialized || !this.ctx) return;

        // 音源がまだロードされていない場合は再開待機
        if (!this.enginePlaying && this.audioLoaded) {
            this.startEngineLoop();
        }
        if (!this.engineSourceNode || !this.engineFilter || !this.engineGain) return;

        const spec = SOUND_SPECS[this.soundType] || SOUND_SPECS['4age'];
        const idleRpm = spec.idleRpm || 900;
        const maxRpm = spec.maxRpm || 8500;
        const curTime = this.ctx.currentTime;

        // 1. 回転数（RPM）に応じた実車ピッチシフト (playbackRate)
        const rpmNorm = Math.max(0, Math.min(1.25, (rpm - idleRpm) / (maxRpm - idleRpm)));
        // アイドリング時 0.80x 〜 最高回転時 2.15x
        const targetPitch = spec.basePitch * (0.80 + rpmNorm * 1.35);
        this.engineSourceNode.playbackRate.setTargetAtTime(targetPitch, curTime, 0.035);
        this.currentPitch = targetPitch;

        // 2. アクセル開度（スロットル）に応じたダイナミック・吸排気ローパスフィルター
        // アクセルOFF時は排圧低下と吸気抵抗でマフラー音がこもり、アクセル全開時は排気管直通の爆音咆哮へ解放！
        let cutoff = 650 + (throttle * 8000) + (rpmNorm * 3800);
        if (this.soundType === 'b16b' && rpm > 5800) {
            // VTECハイカム領域：高域を一段と開放し甲高い咆哮へシフト
            cutoff += 3000;
        }
        this.engineFilter.frequency.setTargetAtTime(cutoff, curTime, 0.04);
        this.currentCutoff = cutoff;

        // 3. 実車エンジン音量制御
        // アイドリングでも低く心地よい実車の排気ビートを響かせ、アクセル全開でド迫力の音圧に到達
        const targetGain = 0.28 + (throttle * 0.42) + (rpmNorm * 0.28);
        this.engineGain.gain.setTargetAtTime(targetGain, curTime, 0.035);
        this.currentGain = targetGain;

        // 4. ターボ車のアクセルオフ時、ブローオフ過給圧解放（プシューン！）
        if (['13b', 'rb26', 'sr20', '1jz', '2jz', '4g63', 'f5a'].includes(this.soundType)) {
            if (this.lastThrottle > 0.75 && throttle < 0.15 && rpm > 4000) {
                if (curTime - this.lastBlowoffTime > 0.45) {
                    this.playBlowoffSound();
                    this.lastBlowoffTime = curTime;
                }
            }
        }
        this.lastThrottle = throttle;

        // 5. タイヤスキール音の更新
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
     * 実車マフラー破裂音（アフターファイヤ・エキゾーストポップ）
     * 機械的なシンセではなく、本物の実車マフラーから録音された強烈な破裂音サンプルを再生
     */
    playAfterfireSound(intensity = 1.0, isRival = false) {
        if (!this.initialized || !this.ctx || this.isMuted) return;

        const popBuffer = this.popBuffers[this.soundType] || this.popBuffers['4age'];
        if (!popBuffer) return;

        const now = this.ctx.currentTime;
        const volMultiplier = (isRival ? 0.65 : 1.0) * Math.min(1.5, Math.max(0.6, intensity));

        const source = this.ctx.createBufferSource();
        source.buffer = popBuffer;

        // ランダムなピッチシフト（実車のリアルな排気破裂のばらつきを再現）
        const randomPitch = 0.94 + Math.random() * 0.16;
        source.playbackRate.setValueAtTime(randomPitch, now);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.85 * volMultiplier, now);

        source.connect(gainNode);
        gainNode.connect(this.sfxGain);

        source.start(now);

        // 高強度時（アンチラグ・ミスファイアリングシステム等）は連続した二次破裂音（ババッ！）
        if (intensity > 0.85 && Math.random() < 0.65) {
            const delay = 0.05 + Math.random() * 0.04;
            setTimeout(() => {
                if (!this.ctx) return;
                const secSource = this.ctx.createBufferSource();
                secSource.buffer = popBuffer;
                secSource.playbackRate.setValueAtTime(1.1 + Math.random() * 0.15, this.ctx.currentTime);
                const secGain = this.ctx.createGain();
                secGain.gain.setValueAtTime(0.55 * volMultiplier, this.ctx.currentTime);
                secSource.connect(secGain);
                secGain.connect(this.sfxGain);
                secSource.start();
            }, delay * 1000);
        }
    }

    /**
     * ターボ車のブローオフバルブ（過給圧解放・バックタービン音）
     */
    playBlowoffSound() {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;

        // 実車の過給圧がインマニから大気開放される「プシューーーン！」というリアル音
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            const decay = Math.exp(-i / (this.ctx.sampleRate * 0.08));
            // タービンブレードの脈動（バックタービン フラッター）
            const flutter = 1.0 + 0.3 * Math.sin(2 * Math.PI * 28 * (i / this.ctx.sampleRate));
            data[i] = (Math.random() * 2 - 1) * decay * flutter;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(3400, now);
        filter.frequency.exponentialRampToValueAtTime(1600, now + 0.32);
        filter.Q.setValueAtTime(3.2, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.42, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);

        source.start(now);
        source.stop(now + 0.35);
    }

    /**
     * シフトチェンジ音（メカニカルショック）
     */
    playShiftSound() {
        if (!this.initialized) return;
        const now = this.ctx.currentTime;

        // シフトチェンジ時の小気味よいアフターファイヤを低確率で誘発
        if (Math.random() < 0.45) {
            this.playAfterfireSound(0.7);
        }

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.08);
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
        if (this.weather !== 'rain') {
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
