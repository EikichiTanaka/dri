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
// 車種別エンジン音響物理プロファイル（管内気柱共鳴ウェーブガイド ＆ マフラー膨張室モデル）
const ENGINE_PROFILES = {
    '4age': {
        name: '4A-GEU 20V (AE86 トレノ)',
        numCyl: 4,
        orderMult: 2.0,            // 直4: クランク1回転あたり2回点火 (180°等間隔)
        cycleFreqRatio: 1 / 120,
        idleRpm: 950,
        idleBaseRpm: 950,          // アイドル基準回転
        lowBaseRpm: 2400,          // 低速基準回転
        midBaseRpm: 4600,          // 中速基準回転
        highBaseRpm: 8200,         // 高速基準回転
        redlineRpm: 8000,
        maxRpm: 11000,
        mainWeight: 0.72,
        exhaustDrive: 2.8,
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 2.65,             // 排気管長 2.65m (短尺管特有の軽快な高域共鳴)
        primLen: 0.62,             // 4-1等長タコ足 0.62m (奇数次倍音相殺・乾いたレーシングサウンド)
        tailRef: -0.68,            // 砲弾テールパイプ反射率
        bodyFreq: 118, bodyGain: 7.5, bodyQ: 2.0, // 太鼓低音はやや絞り、重苦しさを排除
        raspFreq: 740, raspGain: 13.0,            // 等長エキマニの乾いたハイトーン喉鳴り (740Hz)
        ringFreq: 3100, ringGain: 14.0,           // 4-1ステン管の突き抜ける高周波鳴き (3100Hz)
        raspRatioBase: 0.20,       // 低回転での直管抜け率
        raspRatioMax: 0.75,        // 高回転・全開時の直管破裂抜け率
        // 4連独立スロットル・剥き出しファンネル吸気咆哮（踏み込んだ瞬間に吸気が猛烈に吠える！）
        intakePeak: 520, intakeQ: 3.6, intakeGain: 0.85,
        mechWeight: 0.16, mechFreq: 3400,
        headerDelays: [0.0, 0.00004, -0.00004, 0.0],
        cylAmps: [1.01, 0.99, 1.01, 0.99],
        shockSharpness: 2.6,       // 超鋭敏なスロットルレスポンス
        gasAmp: 0.55,
        revBounceHz: 11.5,
        isTurbo: false,
        isRotary: false
    },
    '13b': {
        name: '13B-REW (FD3S RX-7)',
        numCyl: 2,                 // 2ローター (フロント / リア)
        orderMult: 2.0,            // 偏心軸1回転あたり2回排気 (180°等間隔点火・実車通りの真のロータリーピッチ)
        cycleFreqRatio: 1 / 60,
        idleRpm: 850,
        idleBaseRpm: 850,
        lowBaseRpm: 2200,
        midBaseRpm: 4400,
        highBaseRpm: 7200,
        redlineRpm: 8200,
        maxRpm: 8800,
        mainWeight: 0.78,
        exhaustDrive: 2.8,         // 鋭く高圧なロータリー排気波面
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 2.70,             // ロータリー専用ストレート管長
        primLen: 0.52,
        tailRef: -0.70,            // 砲弾チタンテール
        bodyFreq: 125, bodyGain: 8.0, bodyQ: 1.8,  // アイドリングで「ポポポポ…」と乾いて弾ける胴鳴り (125Hz)
        raspFreq: 960, raspGain: 15.0,            // 13B特有の超甲高い高密度ロータリー咆哮 (960Hz)
        ringFreq: 3300, ringGain: 13.5,           // チタン/ステン砲弾マフラーの突き抜ける高周波鳴き (3300Hz)
        raspRatioBase: 0.18,
        raspRatioMax: 0.82,        // 高回転で突き抜ける快音
        // シーケンシャルツインターボ吸気
        intakePeak: 420, intakeQ: 2.8, intakeGain: 0.55,
        mechWeight: 0.005, mechFreq: 4500, // ロータリーは動弁系打撃音ほぼ皆無
        headerDelays: [0.0, 0.0],  // 2ローター完全180°対称
        cylAmps: [1.0, 1.0],       // 前後ローター完全均等
        shockSharpness: 2.2,       // アペックスシールのスリット通過による鋭角排気パルス
        gasAmp: 0.85,
        revBounceHz: 13.5,
        isTurbo: true,
        isTwinTurbo: true,
        isRotary: true
    },
    'rb26': {
        name: 'RB26DETT (BNR32 GT-R)',
        numCyl: 6,
        orderMult: 3.0,            // 直6: 1回転あたり3回点火 (完全等間隔120°点火)
        cycleFreqRatio: 1 / 120,
        idleRpm: 880,
        idleBaseRpm: 880,
        lowBaseRpm: 2200,
        midBaseRpm: 4200,
        highBaseRpm: 6800,
        redlineRpm: 8000,
        maxRpm: 8500,
        mainWeight: 0.88,          // 圧倒的な音圧・存在感
        exhaustDrive: 3.4,
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 3.10,             // 3.10m大口径等長ステンマフラー
        primLen: 0.65,             // 等長6-2-1
        tailRef: -0.76,            // 大口径φ115砲弾マフラー出口
        bodyFreq: 82, bodyGain: 16.5, bodyQ: 1.6,  // 2.6Lツインターボの地響き重低音（82Hz広帯域でズッシリ腹に響く！）
        raspFreq: 460, raspGain: 13.5,            // 直6特有の澄んだ野太い中低音排気咆哮「クォォォォン」(460Hz)
        ringFreq: 2400, ringGain: 8.5,            // 大口径ステン管の澄んだレーシング鳴き・クリアな抜け感（籠もり感完全排除！）
        raspRatioBase: 0.22,
        raspRatioMax: 0.65,        // 直管の突き抜ける抜けの良さと太鼓の重低音のハイブリッド
        intakePeak: 380, intakeQ: 2.6, intakeGain: 0.52, // ツインターボの分厚い過給吸気音
        mechWeight: 0.08, mechFreq: 3100,
        // ★RB26ツインターボ前後バンク排気干渉物理モデル（F:1-2-3 / R:4-5-6）
        // 点火順序 1-5-3-6-2-4 に伴う前後バンク排気管長差・微小位相差により、
        // 1オクターブ下の野太い重低音脈動（1.5次: 8000rpmで200Hz！）を物理的に自発励起！
        headerDelays: [0.0, 0.00065, 0.0, 0.00065, 0.0, 0.00065],
        cylAmps: [1.14, 0.86, 1.14, 0.86, 1.14, 0.86],
        shockSharpness: 2.6,       // クッキリと輪郭の立った燃焼衝撃波面（アタックの鋭さと抜け）
        gasAmp: 0.95,              // 分厚い排気風圧
        revBounceHz: 10.5,
        isTurbo: true,
        isTwinTurbo: true,
        isRotary: false
    },
    'sr20': {
        name: 'SR20DET (S13 / 180SX / S15)',
        numCyl: 4,
        orderMult: 2.0,            // 直4シングルターボ
        cycleFreqRatio: 1 / 120,
        idleRpm: 850,
        idleBaseRpm: 850,
        lowBaseRpm: 2100,
        midBaseRpm: 4000,
        highBaseRpm: 6400,
        redlineRpm: 7500,
        maxRpm: 8000,
        mainWeight: 0.70,
        exhaustDrive: 2.9,
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 2.80,
        primLen: 0.60,
        tailRef: -0.66,
        bodyFreq: 102, bodyGain: 12.0, bodyQ: 2.1, // 太い4気筒ターボ重低音 (102Hz)
        raspFreq: 590, raspGain: 10.0,            // 不等長マニホールドの野太いドロドロ喉鳴り (590Hz)
        ringFreq: 2550, ringGain: 9.0,
        raspRatioBase: 0.22,
        raspRatioMax: 0.76,
        intakePeak: 320, intakeQ: 2.4, intakeGain: 0.45,
        mechWeight: 0.22, mechFreq: 2800, // ラッシュアジャスター特有の打撃音
        headerDelays: [0.0, 0.0024, -0.0010, 0.0018], // 不等長エキマニ干渉ディレイ（強いドロドロ脈動）
        cylAmps: [1.12, 0.88, 1.15, 0.85],           // 気筒別燃焼圧差による強い不等長ビート
        shockSharpness: 2.3,
        gasAmp: 0.70,
        revBounceHz: 11.0,
        isTurbo: true,
        isTwinTurbo: false,
        isRotary: false
    },
    '1jz': {
        name: '1JZ-GTE (JZX100 チェイサー)',
        numCyl: 6,
        orderMult: 3.0,            // 直6シングルターボ
        cycleFreqRatio: 1 / 120,
        idleRpm: 800,
        idleBaseRpm: 800,
        lowBaseRpm: 2000,
        midBaseRpm: 4200,
        highBaseRpm: 6500,
        redlineRpm: 7500,
        maxRpm: 8000,
        mainWeight: 0.76,
        exhaustDrive: 3.6,         // 直管マフラー高回転で激しく割れる強烈な破裂音（ワンジェイ節！）
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 3.25,             // ロングセダン管長 3.25m
        primLen: 0.65,
        tailRef: -0.84,            // 直管砲弾マフラー（高反射率で激しく炸裂）
        bodyFreq: 94, bodyGain: 11.5, bodyQ: 2.0,  // 2.5L直6の太い低音 (94Hz)
        raspFreq: 650, raspGain: 14.5,            // 高回転で激しく弾ける1JZ特有の甲高い直管抜け (650Hz)
        ringFreq: 2650, ringGain: 12.0,           // 直管の共鳴金属鳴き (2650Hz)
        raspRatioBase: 0.26,
        raspRatioMax: 0.90,        // 高回転でバリバリ割れる強烈な直管破裂音
        intakePeak: 340, intakeQ: 2.6, intakeGain: 0.48,
        mechWeight: 0.12, mechFreq: 3200,
        headerDelays: [0.0, 0.0001, -0.0001, 0.0, 0.0001, -0.0001],
        cylAmps: [1.04, 0.96, 1.02, 0.98, 1.03, 0.97],
        shockSharpness: 2.8,       // 鋭い排気打撃波
        gasAmp: 0.95,
        revBounceHz: 10.5,
        isTurbo: true,
        isTwinTurbo: false,
        isRotary: false
    },
    '2jz': {
        name: '2JZ-GTE (JZA80 スープラ RZ)',
        numCyl: 6,
        orderMult: 3.0,            // 3.0L 直6ツインターボ
        cycleFreqRatio: 1 / 120,
        idleRpm: 750,
        idleBaseRpm: 750,
        lowBaseRpm: 1900,
        midBaseRpm: 3800,
        highBaseRpm: 6200,
        redlineRpm: 7800,
        maxRpm: 8300,
        mainWeight: 0.80,
        exhaustDrive: 3.0,
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 3.05,
        primLen: 0.70,
        tailRef: -0.76,
        bodyFreq: 76, bodyGain: 16.5, bodyQ: 2.5,  // 3.0L大排気量モンスターの超重低音 (76Hz地響き)
        raspFreq: 490, raspGain: 9.0,             // 1JZのように割れず、分厚い風圧トルクの轟音 (490Hz)
        ringFreq: 2300, ringGain: 8.0,
        raspRatioBase: 0.18,
        raspRatioMax: 0.70,
        intakePeak: 360, intakeQ: 2.8, intakeGain: 0.52,
        mechWeight: 0.10, mechFreq: 2800,
        headerDelays: [0.0, 0.00008, -0.00008, 0.0, 0.00008, -0.00008],
        cylAmps: [1.02, 0.98, 1.01, 0.99, 1.02, 0.98],
        shockSharpness: 2.5,
        gasAmp: 1.00,              // 3.0L強大な排気風量
        revBounceHz: 10.5,
        isTurbo: true,
        isTwinTurbo: true,
        isRotary: false
    },
    '4g63': {
        name: '4G63 (CE9A ランエボIII GSR)',
        numCyl: 4,
        orderMult: 2.0,            // 直4ハイブーストターボ
        cycleFreqRatio: 1 / 120,
        idleRpm: 900,
        idleBaseRpm: 900,
        lowBaseRpm: 2200,
        midBaseRpm: 4200,
        highBaseRpm: 6600,
        redlineRpm: 7800,
        maxRpm: 8300,
        mainWeight: 0.74,
        exhaustDrive: 3.4,
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 2.75,
        primLen: 0.58,
        tailRef: -0.76,            // ラリー競技管（高硬度）
        bodyFreq: 110, bodyGain: 11.0, bodyQ: 2.1, // 硬質な低音胴鳴り (110Hz)
        raspFreq: 680, raspGain: 13.0,            // 4G63特有の硬く乾いた排気打撃音 (680Hz)
        ringFreq: 2700, ringGain: 12.0,           // 排気管の金属鳴き (2700Hz)
        raspRatioBase: 0.24,
        raspRatioMax: 0.84,        // WRC競技マフラーの暴力的な排気破裂音
        intakePeak: 340, intakeQ: 3.0, intakeGain: 0.55,
        mechWeight: 0.16, mechFreq: 3300,
        headerDelays: [0.0, 0.0006, -0.0003, 0.0004],
        cylAmps: [1.06, 0.94, 1.05, 0.95],
        shockSharpness: 3.2,       // 超急峻なラリー高ブースト衝撃波（乾いた金属的爆圧）
        gasAmp: 0.90,
        revBounceHz: 11.0,
        isTurbo: true,
        isTwinTurbo: false,
        isRotary: false
    },
    'b16b': {
        name: 'B16B (EK9 シビック Type R)',
        numCyl: 4,
        orderMult: 2.0,            // 1.6L 9,000rpm 超高回転 VTEC NA (直4 180°等間隔点火)
        cycleFreqRatio: 1 / 120,
        idleRpm: 850,
        idleBaseRpm: 850,
        lowBaseRpm: 2400,
        midBaseRpm: 4400,          // ローカム巡航域基準RPM
        highBaseRpm: 7200,         // ハイカムVTEC基準RPM（5,800〜8,500rpmで自然な音程伸長）
        redlineRpm: 8400,
        maxRpm: 9500,
        mainWeight: 0.78,          // 澄んだNA排気音圧
        exhaustDrive: 2.0,         // 過剰な歪みを完全に排し、澄み切った高回転NAエキゾーストノートへ
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 2.70,             // 実車ハッチバック管長 2.70m
        primLen: 0.60,             // 4-2-1等長ステンレスエキマニ
        tailRef: -0.74,            // 高回転ストレートマフラー出口
        bodyFreq: 128, bodyGain: 5.5, bodyQ: 2.2,  // 籠もり重低音を排したタイトで乾いた小排気量NA排気胴鳴り (128Hz)
        raspFreq: 620, raspGain: 16.0,           // 直4の3倍音・VTEC高回転排気咆哮「クォォォォン！」(8,400rpmで800Hz合致)
        ringFreq: 2950, ringGain: 10.5,          // 4-2-1等長ステン管の突き抜ける乾いた高音金属鳴き (2950Hz)
        raspRatioBase: 0.18,
        raspRatioMax: 0.82,        // 5,800rpmハイカムで直管排気比率が一気に爆発！
        intakePeak: 580, intakeQ: 1.8, intakeGain: 0.35, // ノイズ感を排した自然な大口径サージタンク吸気咆哮
        mechWeight: 0.08, mechFreq: 3400,
        headerDelays: [0.0, 0.00002, -0.00002, 0.0], // 4-2-1等長エキマニ（完全バランス）
        cylAmps: [1.0, 1.0, 1.0, 1.0],
        shockSharpness: 3.0,       // 乾いた輪郭の際立つ高圧縮NA排気衝撃波
        gasAmp: 0.35,              // 乱流ノイズを抑制し、澄んだレーシング倍音を際立たせる
        revBounceHz: 13.0,         // 8400rpm超高速レブ打ち
        isTurbo: false,
        isRotary: false
    },
    'f5a': {
        name: 'F5A (CC72V アルトワークス RS-R)',
        numCyl: 3,
        orderMult: 1.5,            // 3気筒: 1回転あたり1.5回点火 (240°点火)
        cycleFreqRatio: 1 / 120,
        idleRpm: 950,
        idleBaseRpm: 950,
        lowBaseRpm: 2400,
        midBaseRpm: 4400,
        highBaseRpm: 7500,
        redlineRpm: 9500,
        maxRpm: 10500,
        mainWeight: 0.65,
        exhaustDrive: 2.5,
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 2.20,             // 軽自動車短尺管 2.20m
        primLen: 0.45,
        tailRef: -0.62,
        bodyFreq: 160, bodyGain: 9.0, bodyQ: 1.8,  // 550cc軽快な胴鳴り (160Hz)
        raspFreq: 510, raspGain: 10.0,             // 3気筒パタパタ不均等ビート (510Hz)
        ringFreq: 2750, ringGain: 8.5,
        raspRatioBase: 0.22,
        raspRatioMax: 0.68,
        intakePeak: 320, intakeQ: 2.2, intakeGain: 0.40,
        mechWeight: 0.20, mechFreq: 3100,
        headerDelays: [0.0, 0.0006, -0.0005],
        cylAmps: [1.12, 0.88, 1.05],
        shockSharpness: 2.2,
        gasAmp: 0.60,
        revBounceHz: 11.0,
        isTurbo: true,
        isTwinTurbo: false,
        isRotary: false
    }
};

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.bgmGain = null;

        // プロシージャル・リアルエンジン＆マフラー音響物理 6.0
        // 4段階マルチスピード・ウェーブテーブル音源（ミッキーマウス効果を完全根絶）
        this.engineLoopIdle = null;         // アイドリング脈動音源 (基準 750-950 RPM)
        this.engineLoopLow = null;          // 低回転トルク・マフラー胴鳴り音源 (基準 1900-2400 RPM)
        this.engineLoopMid = null;          // 中回転トルク唸り音源 (基準 3800-4800 RPM)
        this.engineLoopHigh = null;         // 高回転レーシング咆哮音源 (基準 6200-8200 RPM)
        this.engineGainIdle = null;         // アイドル・ブレンドゲイン
        this.engineGainLow = null;          // 低速ブレンドゲイン
        this.engineGainMid = null;          // 中速ブレンドゲイン
        this.engineGainHigh = null;         // 高速ブレンドゲイン
        this.exhaustDriveGain = null;       // スロットル連動・排気管圧力ドライブゲイン
        this.exhaustWaveShaper = null;      // 排気管非線形衝撃波面シェーパー（マフラー破裂音）
        this._proceduralBufferCache = {};   // 車種・回転域別プロシージャル燃焼バッファキャッシュ

        // 動弁系メカニカル音源（タペット・カム打音）
        this.mechNoiseNode = null;
        this.mechFilter = null;
        this.mechGain = null;

        // 後方互換用プロパティ（既存参照の安全担保）
        this.engineLoopSource = null;
        this.engineCombustionGain = null;
        this.engineOscMain1 = null;
        this.engineOscMain2 = null;
        this.engineOscSub = null;
        this.subGain = null;
        this.mainGain1 = null;
        this.mainGain2 = null;

        // 3バンド排気管ヘルムホルツ共鳴フォルマントフィルター群
        this.engineBodyFilter = null;       // マフラー太鼓胴鳴り (peaking, 110-155Hz, 広帯域Q=0.65)
        this.engineRaspFilter = null;       // テールパイプ喉鳴り (peaking, 560-820Hz, 広帯域Q=0.75)
        this.engineRingFilter = null;       // タコ足金属鳴き (peaking, 2200-2900Hz, 広帯域Q=0.85)
        this.engineFilter = null;           // メイン吸排気ダイナミックローパス (Butterworth Q=0.707)
        this.engineCompressor = null;       // 倍音共振スパイク・位相うねりを平滑化する高速アコースティックレベラー

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
     * 排気管非線形音響サチュレーションカーブ生成
     * 高圧排気ガスが管内を伝播する際の非線形音圧飽和（Acoustic Pipe Saturation）を再現。
     * 電気的ファズ・ギター歪みを完全排除し、マフラー特有の図太い排気圧サチュレーションを生成。
     */
    _makeExhaustDistortionCurve(samples = 1024, k = 1.6) {
        const curve = new Float32Array(samples);
        const half = samples / 2;
        for (let i = 0; i < samples; i++) {
            const x = (i - half) / half;
            // 音響管ソフトサチュレーション関数 (arctan系)
            const y = (2.0 / Math.PI) * Math.atan(k * x * 1.3) + 0.08 * Math.sin(Math.PI * x);
            curve[i] = Math.max(-1.0, Math.min(1.0, y));
        }
        return curve;
    }

    /**
     * プロシージャル・リアルエンジン＆マフラー音響物理 7.0
     * 【サイン波・電子シンセ完全排除 / 純粋物理ウェーブガイド・排気管音響モデリング】
     * 
     * 録音ファイル一切不使用（物理シミュレーションによるプロシージャル合成）：
     * ① 純粋シリンダー燃焼放出圧力パルス（Unipolar Shock Wavefront: 立上り0.12ms + 非線形膨張減衰）
     *    ※サイン波（Math.sin）による倍音合成を完全排除し、電子音・ブザー臭を根絶！
     * ② 各気筒の完全非同期サイクル間カオス揺らぎ（Stochastic IMEP Jitter）
     *    不均等な爆発力と点火時期の微小ゆらぎにより、生き物のような有機的ビートを生成。
     * ③ 排気管内往復反射ウェーブガイド（Pipe Acoustic Waveguide Delay-Line Comb Filter）
     *    排気管長（2.2〜3.25m）に応じた気柱内往復反射により、本物の鉄パイプ・ステンレス管特有の
     *    無数の自然倍音（管鳴き・直管咆哮）が物理的に自発励起！
     * ④ サイレンサー太鼓（Muffler Expansion Chamber）の音響透過
     *    膨張室容積とパンチングパイプによる高周波吸音 ＆ ヘルムホルツ胴鳴り共振（78〜155Hz）。
     *    急峻な衝撃波が「ドスッ」「ドバババ」という腹の底に響く重低音の排気塊（Muffler Puff）に変化！
     * ⑤ 直管放射（Tailpipe Rasp）と太鼓胴鳴り（Muffler Boom）のハイブリッドブレンド
     */
    _getProceduralEngineBuffer(soundType, speedMode = 'low') {
        if (!this.ctx) return null;
        if (!this._proceduralBufferCache) this._proceduralBufferCache = {};
        const cacheKey = soundType + '_' + speedMode;
        if (this._proceduralBufferCache[cacheKey]) {
            return this._proceduralBufferCache[cacheKey];
        }

        const profile = ENGINE_PROFILES[soundType] || ENGINE_PROFILES['4age'];
        const sampleRate = this.ctx.sampleRate || 44100;
        const targetDur = 2.0;

        // 4段階基準RPMの決定
        let baseRpm = 2200.0;
        if (speedMode === 'idle') {
            baseRpm = profile.idleBaseRpm || profile.idleRpm || 850.0;
        } else if (speedMode === 'low') {
            baseRpm = profile.lowBaseRpm || 2200.0;
        } else if (speedMode === 'mid') {
            baseRpm = profile.midBaseRpm || 4200.0;
        } else if (speedMode === 'high') {
            baseRpm = profile.highBaseRpm || 6800.0;
        }

        const orderMult = profile.orderMult || 2.0;
        const numCyl = profile.numCyl || 4;
        const strokesPerSec = (baseRpm / 60.0) * orderMult;

        // ★完全整数サイクル周期化：気筒数の整数倍の爆発ストローク数を厳密に確保し、
        // ループ境界の端数空白（音抜け）およびゾーン間の基本周波数ピッチ誤差（うねり）を完全ゼロ化！
        const rawStrokes = Math.round(targetDur * strokesPerSec);
        const numStrokes = Math.max(numCyl * 4, Math.round(rawStrokes / numCyl) * numCyl);
        const dur = numStrokes / strokesPerSec;
        const N = Math.round(dur * sampleRate);
        const interval = dur / numStrokes;

        // 1. 純粋シリンダー圧力放出パルス列の生成 (rawCylBuffer)
        const rawCyl = new Float32Array(N);
        const amps = profile.cylAmps || [1.0, 1.0, 1.0, 1.0];
        const delays = profile.headerDelays || [0.0, 0.0, 0.0, 0.0];
        const sharpness = profile.shockSharpness || 2.4;
        const isRotary = !!profile.isRotary;

        // パルス時間定数（クランク角度比例の膨張減衰により、低回転〜高回転まで自然な排気充填率を維持）
        const tauRise = 0.00012 / Math.max(0.8, sharpness * 0.5);
        const crankScaledDecay = Math.max(0.0014, Math.min(0.0042, interval * 0.24));
        const tauDecay = crankScaledDecay / Math.max(0.8, sharpness * 0.4);
        const pLen = Math.min(N, Math.floor(sampleRate * Math.max(0.014, interval * 0.85)));

        for (let s = 0; s < numStrokes; s++) {
            const cylIdx = s % numCyl;

            // サイクル間カオス揺らぎ（アイドル時は有機的脈動、走行域は音量ムラを防ぐ微小揺らぎ）
            const jitterFactor = (speedMode === 'idle') ? 0.025 : 0.003;
            const jit = ((Math.random() * 2 - 1) * jitterFactor) * interval;
            const headerDelay = delays[cylIdx] || 0.0;
            const stTime = (s * interval + jit + headerDelay + dur) % dur;

            // IMEP燃焼圧力揺らぎ
            const ampJitter = (speedMode === 'idle') ? 0.06 : 0.008;
            const baseAmp = amps[cylIdx] || 1.0;
            const cylAmp = (1.0 + (Math.random() * 2 - 1) * ampJitter) * baseAmp;

            const idx0 = Math.floor(stTime * sampleRate);

            for (let j = 0; j < pLen; j++) {
                const t = j / sampleRate;
                let p = 0;

                if (isRotary) {
                    const tauRiseRot = 0.00018;
                    const tauDecayRot = Math.max(0.0020, Math.min(0.0040, interval * 0.25));
                    const rise = 1.0 - Math.exp(-t / tauRiseRot);
                    const decay = Math.exp(-t / tauDecayRot);
                    const shape = Math.sin(Math.min(1.0, t / 0.0045) * Math.PI);
                    const shock = rise * decay * (0.60 + 0.40 * shape);
                    const turb = (Math.random() * 2 - 1) * shock * (profile.gasAmp || 0.85);
                    p = shock + turb * 0.35;
                } else if (soundType === 'b16b') {
                    if (speedMode === 'high') {
                        const tauRiseVtec = 0.000065;
                        const tauDecayVtec = Math.max(0.0011, interval * 0.20);
                        const rise = 1.0 - Math.exp(-t / tauRiseVtec);
                        const decay = Math.exp(-t / tauDecayVtec);
                        const shock = rise * decay;
                        const turb = (Math.random() * 2 - 1) * shock * 0.18;
                        p = shock + turb * 0.20;
                    } else {
                        const tauRiseLow = 0.00016;
                        const tauDecayLow = Math.max(0.0020, interval * 0.24);
                        const rise = 1.0 - Math.exp(-t / tauRiseLow);
                        const decay = Math.exp(-t / tauDecayLow);
                        const shock = rise * decay;
                        const turb = (Math.random() * 2 - 1) * shock * 0.25;
                        p = shock + turb * 0.28;
                    }
                } else {
                    const rise = 1.0 - Math.exp(-t / tauRise);
                    const decay = Math.exp(-t / tauDecay);
                    const shock = rise * decay;
                    const turb = (Math.random() * 2 - 1) * shock * (profile.gasAmp || 0.65);
                    p = shock + turb * 0.45;
                }

                rawCyl[(idx0 + j) % N] += p * cylAmp;
            }
        }

        // 2. 排気管内往復反射ウェーブガイド（ループ境界の位相連続性を保証するプリロール付き）
        const cGas = 520.0;
        const L_pipe = profile.pipeLen || 2.80;
        const delayPipe = Math.max(16, Math.floor(sampleRate * (2.0 * L_pipe / cGas)));
        const delayBuf = new Float32Array(delayPipe);
        let delayIdx = 0;

        const pipeOut = new Float32Array(N);
        const rOpen = profile.tailRef || -0.68;
        const rCol = 0.42;
        let lastDamped = 0.0;
        const warmup = Math.min(N, Math.floor(sampleRate * 0.15));

        for (let i = -warmup; i < N; i++) {
            const srcIdx = (i + N) % N;
            const delayed = delayBuf[delayIdx];
            const damped = lastDamped * 0.22 + delayed * 0.78;
            lastDamped = damped;

            const w = rawCyl[srcIdx] + rCol * damped;
            const out = w + rOpen * damped;
            if (i >= 0) {
                pipeOut[i] = out;
            }

            delayBuf[delayIdx] = w;
            delayIdx = (delayIdx + 1) % delayPipe;
        }

        // 3. マフラー太鼓（サイレンサー膨張室）の音響透過（プリロール付き）
        const mufflerOut = new Float32Array(N);
        const bodyFreq = profile.bodyFreq || 110.0;
        const w0 = 2.0 * Math.PI * bodyFreq / sampleRate;
        const qVal = Math.min(1.4, (profile.bodyQ || 1.6) * 0.75);
        const alpha = Math.sin(w0) / (2.0 * qVal);
        const cosw0 = Math.cos(w0);

        const b0 = alpha;
        const b1 = 0.0;
        const b2 = -alpha;
        const a0 = 1.0 + alpha;
        const a1 = -2.0 * cosw0;
        const a2 = 1.0 - alpha;

        let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
        let lpVal = 0;
        const lpCoef = Math.min(0.25, 2.0 * Math.PI * 280.0 / sampleRate);

        for (let i = -warmup; i < N; i++) {
            const inSig = pipeOut[(i + N) % N];
            lpVal += lpCoef * (inSig - lpVal);

            const x0 = lpVal;
            const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
            x2 = x1; x1 = x0;
            y2 = y1; y1 = y0;

            if (i >= 0) {
                mufflerOut[i] = lpVal * 0.70 + y0 * 1.60;
            }
        }

        // 4. 直管放射（Rasp & Crackle）と太鼓胴鳴り（Muffler Boom）のハイブリッドブレンド＋非線形飽和
        const rBase = profile.raspRatioBase || 0.20;
        const rMax = profile.raspRatioMax || 0.75;
        let raspRatio = rBase;
        if (speedMode === 'idle') raspRatio = rBase * 0.75;
        else if (speedMode === 'low') raspRatio = rBase * 1.15;
        else if (speedMode === 'mid') raspRatio = rBase + (rMax - rBase) * 0.50;
        else if (speedMode === 'high') raspRatio = rMax;

        const driveK = (profile.exhaustDrive || 2.4) * 0.85;
        const bufData = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const straightPipe = pipeOut[i];
            const mufflerBoom = mufflerOut[i];
            const steepRasp = Math.tanh(1.8 * straightPipe) + 0.10 * (straightPipe * straightPipe) * Math.sign(straightPipe);
            const rawMix = mufflerBoom * (1.0 - raspRatio) + steepRasp * raspRatio;
            bufData[i] = (2.0 / Math.PI) * Math.atan(driveK * rawMix);
        }

        // 5. ★3バンド排気管共鳴フォルマント（Body / Rasp / Ring）のオフライン物理焼き込み
        // リアルタイム側での高ゲイン狭帯域フィルターによる「倍音通過時の音量スパイク＆谷間落ち込み」を根絶するため、
        // 各車種の固有フォルマント共鳴をバッファ生成時に焼き込み、その直後にRMSラウドネス正規化を行う！
        const applyOfflinePeaking = (data, freq, dBgain, Q) => {
            if (Math.abs(dBgain) < 0.05) return;
            const A = Math.pow(10, dBgain / 40);
            const w = 2.0 * Math.PI * Math.min(sampleRate * 0.45, Math.max(20, freq)) / sampleRate;
            const al = Math.sin(w) / (2.0 * Q);
            const cw = Math.cos(w);
            const pb0 = 1.0 + al * A;
            const pb1 = -2.0 * cw;
            const pb2 = 1.0 - al * A;
            const pa0 = 1.0 + al / A;
            const pa1 = -2.0 * cw;
            const pa2 = 1.0 - al / A;
            let px1 = 0, px2 = 0, py1 = 0, py2 = 0;
            const pre = Math.min(N, Math.floor(sampleRate * 0.08));
            for (let i = -pre; i < N; i++) {
                const idx = (i + N) % N;
                const px0 = data[idx];
                const py0 = (pb0 * px0 + pb1 * px1 + pb2 * px2 - pa1 * py1 - pa2 * py2) / pa0;
                px2 = px1; px1 = px0;
                py2 = py1; py1 = py0;
                if (i >= 0) data[idx] = py0;
            }
        };

        applyOfflinePeaking(bufData, profile.bodyFreq || 110, (profile.bodyGain || 10) * 0.75, 1.0);
        applyOfflinePeaking(bufData, profile.raspFreq || 600, (profile.raspGain || 12) * 0.80, 1.1);
        applyOfflinePeaking(bufData, profile.ringFreq || 2600, (profile.ringGain || 10) * 0.65, 1.2);

        // 5b. 排気出口の空間放射ローパス（超高域の非可聴スパイク成分をRMS正規化前に整え、low/mid/high間の実効音圧差を解消）
        const radCutoff = (soundType === 'b16b' && speedMode === 'high') ? 6200.0 : 4600.0;
        const radAlpha = Math.min(0.65, (2.0 * Math.PI * radCutoff) / sampleRate);
        let radLp = 0.0;
        const radPre = Math.min(N, Math.floor(sampleRate * 0.04));
        for (let i = -radPre; i < N; i++) {
            const idx = (i + N) % N;
            radLp += radAlpha * (bufData[idx] - radLp);
            if (i >= 0) bufData[idx] = radLp;
        }

        // 6. DCオフセットの除去
        let mean = 0;
        for (let i = 0; i < N; i++) mean += bufData[i];
        mean /= N;
        for (let i = 0; i < N; i++) bufData[i] -= mean;

        // 7. ★サイクル同期スライディング窓＆全体RMSラウドネス均一化（時間的な音量揺れ・回転域間の音量逆転を100%解消）
        const targetRms = 0.26;
        if (speedMode !== 'idle') {
            // 厳密に爆発2ストローク周期（1ペア）の整数サンプル窓で局所RMSを均一化し、窓端数による振幅変調を防止
            const winHalf = Math.max(128, Math.round(interval * sampleRate));
            const winLen = winHalf * 2 + 1;
            const sq = new Float32Array(N);
            let runSum = 0;
            for (let i = 0; i < N; i++) {
                sq[i] = bufData[i] * bufData[i];
            }
            for (let k = -winHalf; k <= winHalf; k++) {
                runSum += sq[(k + N) % N];
            }
            const leveled = new Float32Array(N);
            for (let i = 0; i < N; i++) {
                const localRms = Math.sqrt(Math.max(0.00001, runSum / winLen));
                leveled[i] = bufData[i] * (targetRms / localRms);
                const outIdx = (i - winHalf + N) % N;
                const inIdx = (i + winHalf + 1) % N;
                runSum += sq[inIdx] - sq[outIdx];
            }
            for (let i = 0; i < N; i++) {
                bufData[i] = Math.tanh(leveled[i] * 1.25) * 0.82;
            }
        } else {
            // アイドル時も極端なピークのみソフトリミット
            let sumSqIdle = 0;
            for (let i = 0; i < N; i++) sumSqIdle += bufData[i] * bufData[i];
            const idleRms = Math.sqrt(sumSqIdle / N) || 0.0001;
            const idleScale = targetRms / idleRms;
            for (let i = 0; i < N; i++) {
                bufData[i] = Math.tanh(bufData[i] * idleScale * 1.15) * 0.85;
            }
        }

        // 最終全体RMSを全車種・全回転ゾーンで targetRms (0.26) に完全一致させる
        let sumSqFinal = 0;
        for (let i = 0; i < N; i++) sumSqFinal += bufData[i] * bufData[i];
        const postRms = Math.sqrt(sumSqFinal / N) || 0.0001;
        const finalScale = targetRms / postRms;
        for (let i = 0; i < N; i++) {
            bufData[i] = Math.max(-0.95, Math.min(0.95, bufData[i] * finalScale));
        }

        const audioBuf = this.ctx.createBuffer(1, N, sampleRate);
        audioBuf.copyToChannel(bufData, 0);

        this._proceduralBufferCache[cacheKey] = audioBuf;
        if (speedMode === 'low') {
            this._proceduralBufferCache[soundType] = audioBuf;
        }
        return audioBuf;
    }

    /**
     * プロシージャル燃焼ループ音源の起動・切替（4段階マルチスピード音源）
     */
    _startEngineLoopSource(soundType) {
        if (!this.ctx || !this.engineGainIdle || !this.engineGainLow || !this.engineGainMid || !this.engineGainHigh) return;

        const modes = ['idle', 'low', 'mid', 'high'];
        const loops = ['engineLoopIdle', 'engineLoopLow', 'engineLoopMid', 'engineLoopHigh'];
        const gains = ['engineGainIdle', 'engineGainLow', 'engineGainMid', 'engineGainHigh'];

        for (let i = 0; i < modes.length; i++) {
            const loopKey = loops[i];
            const gainKey = gains[i];
            const buf = this._getProceduralEngineBuffer(soundType, modes[i]);

            if (this[loopKey]) {
                try { this[loopKey].stop(); this[loopKey].disconnect(); } catch (e) {}
                this[loopKey] = null;
            }

            if (buf) {
                const src = this.ctx.createBufferSource();
                src.buffer = buf;
                src.loop = true;
                src.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);
                src.connect(this[gainKey]);
                src.start(0);
                this[loopKey] = src;
            }
        }

        // 後方互換用参照
        this.engineLoopSource = this.engineLoopLow || this.engineLoopIdle;
    }

    /**
     * プロシージャル・エンジン＆マフラー音響物理チェーン 6.0 の構築
     */
    setupProceduralEngineChain() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const sampleRate = this.ctx.sampleRate || 44100;
        const profile = ENGINE_PROFILES[this.soundType] || ENGINE_PROFILES['4age'];

        // 1. 4段階マルチスピード音源ゲイン（idle, low, mid, high）
        this.engineGainIdle = this.ctx.createGain();
        this.engineGainIdle.gain.setValueAtTime(1.0, now);

        this.engineGainLow = this.ctx.createGain();
        this.engineGainLow.gain.setValueAtTime(0.0, now);

        this.engineGainMid = this.ctx.createGain();
        this.engineGainMid.gain.setValueAtTime(0.0, now);

        this.engineGainHigh = this.ctx.createGain();
        this.engineGainHigh.gain.setValueAtTime(0.0, now);

        // 2. 排気管ドライブゲイン（オフライン側でRMS正規化＆飽和済みのため、リアルタイム側は1.0基準で音量天井クランプを防止）
        this.exhaustDriveGain = this.ctx.createGain();
        this.exhaustDriveGain.gain.setValueAtTime(1.0, now);

        this.engineGainIdle.connect(this.exhaustDriveGain);
        this.engineGainLow.connect(this.exhaustDriveGain);
        this.engineGainMid.connect(this.exhaustDriveGain);
        this.engineGainHigh.connect(this.exhaustDriveGain);

        // 3. 排気管シェーパー（振幅クランプによる音量頭打ちを防ぐためリニアパススルー特性に設定）
        this.exhaustWaveShaper = this.ctx.createWaveShaper();
        const linearCurve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            linearCurve[i] = (i / 127.5) - 1.0;
        }
        this.exhaustWaveShaper.curve = linearCurve;

        this.exhaustDriveGain.connect(this.exhaustWaveShaper);

        // 4. 3バンド排気管・マフラー音響共鳴フォルマントフィルター群
        // ★各車種の強いフォルマント共鳴は _getProceduralEngineBuffer 内で焼き込み＆RMS正規化済み！
        // リアルタイム側では微小なトーン補正（0〜1.5dB, Q=0.5）のみとし、倍音移動時の音量バンピング（大小の波打ち）を完全ゼロ化！
        this.engineBodyFilter = this.ctx.createBiquadFilter();
        this.engineBodyFilter.type = 'peaking';
        this.engineBodyFilter.frequency.setValueAtTime(profile.bodyFreq, now);
        this.engineBodyFilter.gain.setValueAtTime(0.5, now);
        this.engineBodyFilter.Q.setValueAtTime(0.5, now);

        this.engineRaspFilter = this.ctx.createBiquadFilter();
        this.engineRaspFilter.type = 'peaking';
        this.engineRaspFilter.frequency.setValueAtTime(profile.raspFreq, now);
        this.engineRaspFilter.gain.setValueAtTime(0.5, now);
        this.engineRaspFilter.Q.setValueAtTime(0.5, now);

        this.engineRingFilter = this.ctx.createBiquadFilter();
        this.engineRingFilter.type = 'peaking';
        this.engineRingFilter.frequency.setValueAtTime(profile.ringFreq, now);
        this.engineRingFilter.gain.setValueAtTime(0.5, now);
        this.engineRingFilter.Q.setValueAtTime(0.5, now);

        // メイン可変吸排気ダイナミックローパス（Q=0.5 臨界減衰特性でカットオフ共振暴れを完全防止）
        this.engineFilter = this.ctx.createBiquadFilter();
        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(6000, now);
        this.engineFilter.Q.setValueAtTime(0.5, now);

        this.exhaustWaveShaper.connect(this.engineBodyFilter);
        this.engineBodyFilter.connect(this.engineRaspFilter);
        this.engineRaspFilter.connect(this.engineRingFilter);
        this.engineRingFilter.connect(this.engineFilter);

        // 後方互換用参照
        this.engineCombustionGain = this.exhaustDriveGain;

        // 5. レブリミッター・スタッターチョッパー (18〜24Hz 点火カット)
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

        // 6. 動弁系メカニカルノイズ音源（タペット・カム打音）
        const mechBuf = this.ctx.createBuffer(1, Math.floor(sampleRate * 1.5), sampleRate);
        const mData = mechBuf.getChannelData(0);
        for (let i = 0; i < mData.length; i++) {
            const w = Math.random() * 2 - 1;
            const pulse = (i % Math.floor(sampleRate * 0.024) < 12) ? w * 0.8 : w * 0.08;
            mData[i] = pulse;
        }
        this.mechNoiseNode = this.ctx.createBufferSource();
        this.mechNoiseNode.buffer = mechBuf;
        this.mechNoiseNode.loop = true;

        this.mechFilter = this.ctx.createBiquadFilter();
        this.mechFilter.type = 'bandpass';
        this.mechFilter.frequency.setValueAtTime(profile.mechFreq || 3000, now);
        this.mechFilter.Q.setValueAtTime(2.8, now);

        this.mechGain = this.ctx.createGain();
        this.mechGain.gain.setValueAtTime(profile.mechWeight || 0.05, now);

        this.mechNoiseNode.connect(this.mechFilter);
        this.mechFilter.connect(this.mechGain);
        this.mechGain.connect(this.revChopperGain);

        // 7. 吸気サージタンク・インダクション咆哮（スロットル全開でファンネルから吸気）
        const intakeBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
        const inData = intakeBuf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < inData.length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            inData[i] = (b0 + b1 + b2 + white * 0.5362) * 0.06;
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

        // 8. ターボチャージャー過給エアラッシュ（純粋な空力気流音・電子サイン波は完全排除）
        const turboBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
        const tData = turboBuf.getChannelData(0);
        let lastTb = 0;
        for (let i = 0; i < tData.length; i++) {
            const w = Math.random() * 2 - 1;
            lastTb = 0.85 * lastTb + 0.15 * w;
            tData[i] = lastTb * 0.8;
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

        // 9. 減速時デセル・クラックル (未燃焼ガスランブル)
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

        // 10. エンジンマスターゲイン
        this.engineGain = this.ctx.createGain();
        this.engineGain.gain.setValueAtTime(0.0, now);

        this.revChopperGain.connect(this.engineGain);
        this.engineGain.connect(this.sfxGain);

        // 音源起動
        this.revLfo.start();
        this.mechNoiseNode.start();
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

        // 1. 車種専用プロシージャル燃焼ループ音源の切替（4段階マルチスピード）
        if (this.engineGainIdle) this.engineGainIdle.gain.setValueAtTime(0.96, now);
        if (this.engineGainLow) this.engineGainLow.gain.setValueAtTime(0.0, now);
        if (this.engineGainMid) this.engineGainMid.gain.setValueAtTime(0.0, now);
        if (this.engineGainHigh) this.engineGainHigh.gain.setValueAtTime(0.0, now);
        this._startEngineLoopSource(this.soundType);

        // 2. マフラー・エキマニ共鳴フォルマントの即時適用（強共鳴はバッファ焼き込み済みのためリアルタイム側はフラット基準）
        if (this.engineBodyFilter) {
            this.engineBodyFilter.frequency.setValueAtTime(profile.bodyFreq, now);
            this.engineBodyFilter.gain.setValueAtTime(0.5, now);
        }
        if (this.engineRaspFilter) {
            this.engineRaspFilter.frequency.setValueAtTime(profile.raspFreq, now);
            this.engineRaspFilter.gain.setValueAtTime(0.5, now);
        }
        if (this.engineRingFilter) {
            this.engineRingFilter.frequency.setValueAtTime(profile.ringFreq, now);
            this.engineRingFilter.gain.setValueAtTime(0.5, now);
        }
        if (this.mechFilter) {
            this.mechFilter.frequency.setValueAtTime(profile.mechFreq || 3000, now);
        }
        if (this.mechGain) {
            this.mechGain.gain.setValueAtTime((profile.mechWeight || 0.12) * 0.35, now);
        }
        if (this.intakeFilter) {
            this.intakeFilter.frequency.setValueAtTime(profile.intakePeak, now);
            this.intakeFilter.Q.setValueAtTime(profile.intakeQ, now);
        }
        if (this.revLfo) {
            this.revLfo.frequency.setValueAtTime(profile.revBounceHz, now);
        }
        if (this.exhaustDriveGain) {
            this.exhaustDriveGain.gain.setValueAtTime(1.0, now);
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

        // 1. 4段階マルチスピード・プロシージャル燃焼バッファの動的再生レート
        const baseIdle = profile.idleBaseRpm || profile.idleRpm || 850.0;
        const baseLow = profile.lowBaseRpm || 2200.0;
        const baseMid = profile.midBaseRpm || 4200.0;
        const baseHigh = profile.highBaseRpm || 6800.0;

        const rateIdle = Math.max(0.60, rpm / baseIdle);
        const rateLow = Math.max(0.50, rpm / baseLow);
        const rateMid = Math.max(0.50, rpm / baseMid);
        const rateHigh = Math.max(0.45, rpm / baseHigh);

        if (this.engineLoopIdle && this.engineLoopIdle.playbackRate) {
            this.engineLoopIdle.playbackRate.setTargetAtTime(rateIdle, curTime, 0.015);
        }
        if (this.engineLoopLow && this.engineLoopLow.playbackRate) {
            this.engineLoopLow.playbackRate.setTargetAtTime(rateLow, curTime, 0.015);
        }
        if (this.engineLoopMid && this.engineLoopMid.playbackRate) {
            this.engineLoopMid.playbackRate.setTargetAtTime(rateMid, curTime, 0.015);
        }
        if (this.engineLoopHigh && this.engineLoopHigh.playbackRate) {
            this.engineLoopHigh.playbackRate.setTargetAtTime(rateHigh, curTime, 0.015);
        }

        // ★ゾーン単独駆動＋段階ゲイン補正（ゾーン切替時のローパス通過エネルギー差を完全補正し、切替ポイントでの微小な音量落ち込みもゼロ化！）
        let gIdle = 0, gLow = 0, gMid = 0, gHigh = 0;
        const idleToLowRpm = 1350;
        const lowToMidRpm = (baseLow + baseMid) * 0.5;
        const midToHighRpm = (this.soundType === 'b16b') ? 5800 : (baseMid + baseHigh) * 0.5;

        if (rpm < idleToLowRpm) {
            gIdle = 0.96;
        } else if (rpm < lowToMidRpm) {
            gLow = 1.00;
        } else if (rpm < midToHighRpm) {
            gMid = 1.07;
        } else {
            gHigh = 1.19;
        }

        if (this.engineGainIdle) this.engineGainIdle.gain.setTargetAtTime(gIdle, curTime, 0.012);
        if (this.engineGainLow) this.engineGainLow.gain.setTargetAtTime(gLow, curTime, 0.012);
        if (this.engineGainMid) this.engineGainMid.gain.setTargetAtTime(gMid, curTime, 0.012);
        if (this.engineGainHigh) this.engineGainHigh.gain.setTargetAtTime(gHigh, curTime, 0.012);

        // 2. 排気管ドライブゲイン（全ゾーン均一RMS 0.26 をそのまま後段へ伝達し、音量制御は最終段 engineGain に一元化）
        if (this.exhaustDriveGain) {
            this.exhaustDriveGain.gain.setTargetAtTime(1.0, curTime, 0.02);
        }

        // 3. マフラー・エキゾースト管共鳴フォルマントの微小トーン追従（強共鳴はバッファ内焼き込み＆RMS正規化済み）
        const bodyFreq = profile.bodyFreq + rpmNorm * 15;
        this.engineBodyFilter.frequency.setTargetAtTime(bodyFreq, curTime, 0.04);
        this.engineBodyFilter.gain.setTargetAtTime(0.5, curTime, 0.04);

        const raspFreq = profile.raspFreq + rpmNorm * 180;
        this.engineRaspFilter.frequency.setTargetAtTime(raspFreq, curTime, 0.04);
        this.engineRaspFilter.gain.setTargetAtTime(0.5, curTime, 0.04);

        const ringFreq = profile.ringFreq + rpmNorm * 220;
        this.engineRingFilter.frequency.setTargetAtTime(ringFreq, curTime, 0.04);
        this.engineRingFilter.gain.setTargetAtTime(0.5 * throttle, curTime, 0.04);

        // 4. 動弁系メカニカル打音（アイドリング〜低回転で存在感、高回転ではマスク）
        if (this.mechGain) {
            let mechWeightVal = (profile.mechWeight || 0.12) * 0.25;
            if (this.soundType === '13b') {
                mechWeightVal = 0.002;
            }
            const mechVol = mechWeightVal * (1.0 - Math.min(0.8, rpmNorm));
            this.mechGain.gain.setTargetAtTime(mechVol, curTime, 0.03);
        }

        // 5. 吸排気可変ダイナミックローパスフィルター (スロットル開放時は広帯域をフラット通過させ音量落ちを防止)
        let baseCutoff = 2600;
        let rangeCutoff = 9000;
        let throttleCutoff = 6500;
        let vtecVolumeBoost = 1.0;

        if (this.soundType === 'b16b') {
            const isVtec = (rpm >= 5800);
            if (isVtec) {
                baseCutoff = 5500;
                rangeCutoff = 10500;
                throttleCutoff = 5000;
                vtecVolumeBoost = 1.22; // VTECが入った瞬間に音圧が一段階跳ね上がる！
            } else {
                baseCutoff = 2400;
                rangeCutoff = 5200;
                throttleCutoff = 3800;
                vtecVolumeBoost = 0.96;
            }
        }

        const targetCutoff = baseCutoff + (rpmNorm * rangeCutoff) + (throttle * throttleCutoff);
        this.engineFilter.frequency.setTargetAtTime(Math.min(18000, targetCutoff), curTime, 0.02);

        // 6. 吸気サージタンク・インダクション咆哮（ランダムノイズによるRMS揺れを起こさない控えめな隠し味レベル）
        let intakeVol = 0;
        let intakeFreq = profile.intakePeak;
        if (this.soundType === '4age') {
            intakeVol = Math.max(0, (throttle * 0.12) + (rpmNorm * 0.08 * throttle));
            intakeFreq = 420 + (throttle * 520) + (rpmNorm * 300);
        } else if (this.soundType === 'b16b') {
            const isVtec = (rpm >= 5800);
            intakeVol = Math.max(0, (throttle * (isVtec ? 0.09 : 0.05)) + (rpmNorm * 0.04 * throttle));
            intakeFreq = isVtec ? (580 + throttle * 320 + rpmNorm * 160) : (360 + throttle * 200);
        } else if (this.soundType === '13b' || this.soundType === 'rb26') {
            intakeVol = Math.max(0, (throttle * 0.04) + (rpmNorm * 0.03 * throttle));
            intakeFreq = profile.intakePeak + (throttle * 280) + (rpmNorm * 180);
        } else {
            intakeVol = Math.max(0, (throttle * 0.07) + (rpmNorm * 0.04 * throttle));
            intakeFreq = profile.intakePeak + (throttle * 280) + (rpmNorm * 180);
        }
        this.intakeFilter.frequency.setTargetAtTime(intakeFreq, curTime, 0.03);
        this.intakeGain.gain.setTargetAtTime(intakeVol, curTime, 0.03);

        // 7. レブリミッター・スタッターバウンス (点火カット・チョッピング変調)
        const isAtRedline = Boolean(isRevLimiter);
        if (isAtRedline && throttle > 0.45) {
            this.revModGain.gain.setValueAtTime(0.65, curTime);
        } else {
            this.revModGain.gain.setTargetAtTime(0.0, curTime, 0.02);
        }

        // 8. ターボチャージャー過給エアラッシュ ＆ ブローオフバルブ
        const throttleDrop = (this.prevThrottle > 0.35 && throttle < 0.15);
        if (profile.isTurbo && throttle > 0.12 && rpm > 2400) {
            const spoolRamp = Math.min(1.0, (rpm - 2400) / 2000);
            let turboScale = (this.soundType === '13b' || this.soundType === 'rb26') ? 0.12 : 0.25;
            turboScale *= spoolRamp;
            const turboVol = Math.min(0.08, (0.02 + (throttle * 0.06) + (rpmNorm * 0.05)) * turboScale);
            const turboFreq = 2200 + (rpmNorm * 2200) + (throttle * 650);
            this.turboFilter.frequency.setTargetAtTime(turboFreq, curTime, 0.04);
            this.turboGain.gain.setTargetAtTime(turboVol, curTime, 0.04);
        } else {
            this.turboGain.gain.setTargetAtTime(0.0, curTime, 0.06);
        }

        if (profile.isTurbo && throttleDrop && rpm > 2800) {
            this.playBlowOffSound(rpmNorm, profile.isTwinTurbo);
        }

        // 9. 減速時デセル・クラックル ＆ CE9Aミスファイアリングシステム（アンチラグ）
        if (throttleDrop || (throttle < 0.15 && rpm > 2600)) {
            const decelVol = Math.min(0.28, (rpm / maxRpmRef) * 0.32);
            this.decelNoiseGain.gain.setTargetAtTime(decelVol, curTime, 0.02);

            if (this.soundType === '4g63' && throttle < 0.12 && rpm > 2600) {
                if (Math.random() < 0.45) {
                    this.playAntiLagPop(rpmNorm);
                }
            }
        } else {
            this.decelNoiseGain.gain.setTargetAtTime(0.0, curTime, 0.06);
        }
        this.prevThrottle = throttle;

        // 10. ★エンジン音量制御（RMS均一化された音源に対し、回転数と過給圧に応じて滑らかに単調増加するマスターカーブを適用）
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

        // 過給開始（2,200〜4,800rpm）に伴う滑らかな単調増加ブーストエンベロープ
        let boostSwell = 0.0;
        if (profile.isTurbo && throttle > 0.15 && rpm > 2200) {
            const spoolProgress = Math.min(1.0, Math.max(0.0, (rpm - 2200) / 2600));
            const smoothSpool = spoolProgress * spoolProgress * (3.0 - 2.0 * spoolProgress);
            const maxBoostSwell = (this.soundType === 'rb26' || this.soundType === '13b') ? 0.08 : 0.14;
            boostSwell = smoothSpool * throttle * maxBoostSwell;
        }

        const carWeightScale = (profile.mainWeight || 0.75) / 0.75;
        const rpmCurve = Math.pow(Math.min(1.0, rpmNorm), 0.90);
        const baseEngineVol = (0.24 + (throttle * 0.34) + (rpmCurve * 0.56) + boostSwell) * carWeightScale * vtecVolumeBoost;
        const driftDucking = 1.0 - (driftIntensity * 0.28);
        const masterVol = baseEngineVol * driftDucking;
        this.engineGain.gain.setTargetAtTime(masterVol, curTime, 0.018);

        // 11. タイヤスキール音の更新（100%完全維持）
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
                if (step === 39) {
                    this.playAfterfireSound(1.3);
                    if (onPopCallback) onPopCallback(1.3);
                } else if (step === 44) {
                    this.playAfterfireSound(0.75);
                    if (onPopCallback) onPopCallback(0.75);
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
