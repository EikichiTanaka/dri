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
        orderMult: 3.0,            // 直6シングルターボ (120°点火・1-5-3-6-2-4 → CT15Bシングルタービンスクロール集合)
        cycleFreqRatio: 1 / 120,
        idleRpm: 800,
        idleBaseRpm: 800,
        lowBaseRpm: 1950,
        midBaseRpm: 3800,
        highBaseRpm: 6000,
        redlineRpm: 7200,
        maxRpm: 8000,
        mainWeight: 0.86,          // 直6シングルターボの豊かで芯のある音圧
        exhaustDrive: 2.35,        // 大口径砲弾マフラーの自然な音圧飽和
        // 音響管ウェーブガイド・マフラー物理パラメータ
        pipeLen: 2.92,             // JZX100 ストレート砲弾マフラー管長 2.92m
        primLen: 0.62,             // 6-1シングルターボエキマニ平均管長 0.62m
        tailRef: -0.64,            // 大口径φ115ストレート砲弾マフラー出口反射率
        bodyFreq: 92, bodyGain: 10.5, bodyQ: 1.35, // JZX100大口径砲弾マフラーの腹に響く重低音ベース (92Hz)
        throatFreq: 370, throatGain: 9.5,          // 2.5L直6の肉厚で野太い中低域トルク咆哮「グォォォン」(370Hz)
        raspFreq: 760, raspGain: 11.5,             // 1JZ-GTE 6-1集合＋CT15Bタービン特有の伸びやかな直管共鳴 (760Hz)
        ringFreq: 2450, ringGain: 8.5,             // ステンレス直管砲弾マフラーの乾いた高域金属倍音 (2450Hz)
        raspRatioBase: 0.26,
        raspRatioMax: 0.78,        // 低回転の重厚な砲弾低音から高回転の快音直管咆哮へ自然に移行
        intakePeak: 410, intakeQ: 2.2, intakeGain: 0.48,
        mechWeight: 0.09, mechFreq: 3200,          // ヤマハ設計24バルブヘッドの精密なカム・タペット機械音
        // 点火順序 1-5-3-6-2-4 における各気筒から中央CT15Bタービンスクロールまでの実測プライマリ管長差ディレイ
        headerDelays: [0.00034, -0.00014, -0.00028, 0.00030, -0.00010, -0.00022],
        cylAmps: [1.06, 0.95, 1.03, 0.96, 1.04, 0.96], // 6気筒それぞれの吸気充填効率・燃焼圧の自然な個体差
        runnerScales: [1.18, 0.94, 0.82, 1.15, 0.96, 0.85], // 気筒別エキマニブランチ管長比（1・6番が長く、3・4番が短い）
        shockSharpness: 2.75,      // ショートストローク(86×71.5mm)の鋭いブローダウン衝撃波立ち上がり
        gasAmp: 0.82,              // シングルターボから噴き出す分厚い高温排気ガス流の風圧感
        revBounceHz: 14.5,         // 1JZ特有のキレが良く小刻みな直6レブリミッター
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
        throatFreq: 320, throatGain: 10.0,
        raspFreq: 490, raspGain: 9.0,             // 1JZのように割れず、分厚い風圧トルクの轟音 (490Hz)
        ringFreq: 2300, ringGain: 8.0,
        raspRatioBase: 0.18,
        raspRatioMax: 0.70,
        intakePeak: 360, intakeQ: 2.8, intakeGain: 0.52,
        mechWeight: 0.10, mechFreq: 2800,
        headerDelays: [0.00022, 0.00010, -0.00018, 0.00020, 0.00008, -0.00016],
        cylAmps: [1.05, 0.96, 1.02, 0.97, 1.04, 0.96],
        runnerScales: [1.12, 0.98, 0.88, 1.10, 0.96, 0.90],
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
        throatFreq: 390, throatGain: 8.5,
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
        throatFreq: 420, throatGain: 7.5,
        raspFreq: 620, raspGain: 16.0,           // 直4の3倍音・VTEC高回転排気咆哮「クォォォォン！」(8,400rpmで800Hz合致)
        ringFreq: 2950, ringGain: 10.5,          // 4-2-1等長ステン管の突き抜ける乾いた高音金属鳴き (2950Hz)
        raspRatioBase: 0.18,
        raspRatioMax: 0.82,        // 5,800rpmハイカムで直管排気比率が一気に爆発！
        intakePeak: 580, intakeQ: 1.8, intakeGain: 0.35, // ノイズ感を排した自然な大口径サージタンク吸気咆哮
        mechWeight: 0.08, mechFreq: 3400,
        headerDelays: [0.00012, -0.00008, -0.00010, 0.00008], // 4-2-1等長エキマニの微小位相差
        cylAmps: [1.03, 0.97, 1.02, 0.98],
        shockSharpness: 3.0,       // 乾いた輪郭の際立つ高圧縮NA排気衝撃波
        gasAmp: 0.55,              // 排気ガス風圧とレーシング倍音のバランス
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
        throatFreq: 380, throatGain: 7.0,
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

        // プロシージャル・リアルエンジン＆マフラー音響物理 8.0
        // 4段階マルチスピード・ウェーブテーブル音源（早回し感・シンセ感を完全根絶）
        this.engineLoopIdle = null;         // アイドリング脈動音源 (基準 750-950 RPM)
        this.engineLoopLow = null;          // 低回転トルク・マフラー胴鳴り音源 (基準 1900-2400 RPM)
        this.engineLoopMid = null;          // 中回転トルク唸り音源 (基準 3800-4600 RPM)
        this.engineLoopHigh = null;         // 高回転レーシング咆哮音源 (基準 6000-8200 RPM)
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
        this.engineBodyFilter = null;       // マフラー太鼓胴鳴り (peaking, 76-160Hz)
        this.engineRaspFilter = null;       // テールパイプ喉鳴り・中域トルク咆哮 (peaking, 460-960Hz)
        this.engineRingFilter = null;       // タコ足・直管金属鳴き (peaking, 2200-3300Hz)
        this.engineFilter = null;           // メイン吸排気ダイナミックローパス
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
        this.currentBoost = 0;              // ターボ過給圧の物理慣性状態 (0.0〜1.0)
        this._lastEngineUpdateTime = 0;
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
     * プロシージャル・リアルエンジン＆マフラー音響物理 8.0
     * 【サイン波加算・電子オルガン臭・テープ早回し感を完全根絶 / 1D流体衝撃波＆多段拡散排気管モデル】
     * 
     * 録音ファイル一切不使用（100%純粋な物理シミュレーションによるプロシージャル合成）：
     * ① 双極性フリードランダー爆発衝撃波（Friedlander Bipolar Blast Wavefront + Scavenging Rarefaction）
     *    排気バルブ開弁時の急峻な正圧ブローダウン衝撃波（+P）と、ガス柱の慣性による負圧掃気波（-P）、
     *    および点火順序（1JZ: 1-5-3-6-2-4）に基づく各気筒プライマリ管長差の反射波をタイムドメイン合成。
     *    ※Math.sinによる人工的な倍音加算を完全撤廃し、電子オルガン・ブザー感を根絶！
     * ② 燃焼同期・高温排気ガス乱流ジェット（Combustion-Modulated Aeroacoustic Gas Turbulence）
     *    ホワイトノイズ（デジタル砂嵐音）ではなく、鋼管内を高速噴出する高温ガスの流体乱流（100〜1,800Hz帯域の
     *    ブラウン/ピンク気流音）を各気筒の排気流量エンベロープで変調し、「ゴォォォッ／グォォォッ」という実体感を生成。
     * ③ 多段拡散エキゾースト・ウェーブガイド（Collector + Center Resonator + All-Pass Diffused Tailpipe）
     *    単一コムフィルター特有の塩ビ管・フランジャー臭を消すため、エキマニ集合部・中間タイコ・リア砲弾マフラーの
     *    多段反射とオールパス位相分散（管壁熱境界層減衰）を結合。
     * ④ 2室マフラー共鳴（Helmholtz重低音92Hz ＋ 中域スロート咆哮370Hz）＆ 720°マルチサイクルRMS正規化
     *    1ストローク単位の過剰AGCによる「全気筒均等ブザー化」を廃止し、クランク4回転（720°×2周期）窓で
     *    気筒間の自然なビート・脈動を100%温存したまま回転域間の音量を完全均一化。
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
        const targetDur = 3.0; // ループ周期感を人間の耳に一切悟らせない3.0秒ロングバッファ

        // 4段階基準RPMの決定
        let baseRpm = 2200.0;
        if (speedMode === 'idle') {
            baseRpm = profile.idleBaseRpm || profile.idleRpm || 850.0;
        } else if (speedMode === 'low') {
            baseRpm = profile.lowBaseRpm || 2000.0;
        } else if (speedMode === 'mid') {
            baseRpm = profile.midBaseRpm || 3800.0;
        } else if (speedMode === 'high') {
            baseRpm = profile.highBaseRpm || 6200.0;
        }

        const orderMult = profile.orderMult || 2.0;
        const numCyl = profile.numCyl || 4;
        const strokesPerSec = (baseRpm / 60.0) * orderMult;

        // ★完全整数720°サイクル周期化：2×気筒数（4ストローク全気筒2周期分）の整数倍を厳密に確保
        const cycleUnit = numCyl * 2;
        const rawStrokes = Math.round(targetDur * strokesPerSec);
        const numStrokes = Math.max(cycleUnit * 3, Math.round(rawStrokes / cycleUnit) * cycleUnit);
        const dur = numStrokes / strokesPerSec;
        const N = Math.round(dur * sampleRate);
        const interval = dur / numStrokes;

        // 0. 高温排気ガス流体乱流ジェット（Aeroacoustic Pink/Brown Gas Turbulence）のシームレス事前生成
        // ホワイトノイズの「サーサー」したデジタル臭を排除し、「ゴォォォッ」という太い排気風圧を生成
        const gasJetLow = new Float32Array(N);
        const gasJetHigh = new Float32Array(N);
        let gLp1 = 0.0, gLp2 = 0.0, gHpState = 0.0;
        let sLp1 = 0.0, sHpState = 0.0;
        const lowCutAlpha = Math.min(0.45, (2.0 * Math.PI * 520.0) / sampleRate);
        const lowHpAlpha = Math.min(0.20, (2.0 * Math.PI * 85.0) / sampleRate);
        const shearCutAlpha = Math.min(0.65, (2.0 * Math.PI * 1950.0) / sampleRate);
        const shearHpAlpha = Math.min(0.35, (2.0 * Math.PI * 420.0) / sampleRate);
        const noiseWarmup = Math.min(N, Math.floor(sampleRate * 0.1));

        for (let i = -noiseWarmup; i < N; i++) {
            const w = Math.random() * 2.0 - 1.0;
            // 低中域の重厚なガス塊乱流 (85Hz - 520Hz)
            gLp1 += lowCutAlpha * (w - gLp1);
            gLp2 += lowCutAlpha * (gLp1 - gLp2);
            gHpState += lowHpAlpha * (gLp2 - gHpState);
            const warmRoar = (gLp2 - gHpState) * 3.2;

            // 高流速シアー乱流・タービン通過気流 (420Hz - 1950Hz)
            sLp1 += shearCutAlpha * (w - sLp1);
            sHpState += shearHpAlpha * (sLp1 - sHpState);
            const shearJet = (sLp1 - sHpState) * 2.1;

            if (i >= 0) {
                gasJetLow[i] = warmRoar;
                gasJetHigh[i] = shearJet;
            }
        }

        // 1. 双極性フリードランダー燃焼衝撃波 ＋ 気筒別プライマリ管反射 ＋ 爆発同期ガスジェット合成
        const rawCyl = new Float32Array(N);
        const amps = profile.cylAmps || [1.04, 0.96, 1.02, 0.98];
        const delays = profile.headerDelays || [0.00015, -0.00010, -0.00012, 0.00010];
        const runnerScales = profile.runnerScales || [1.12, 0.94, 0.88, 1.08, 0.96, 0.90];
        const sharpness = profile.shockSharpness || 2.5;
        const isRotary = !!profile.isRotary;
        const cGas = 540.0; // 高温排気ガス中の音速 (m/s)
        const basePrimLen = profile.primLen || 0.60;

        // 3秒周期内で緩やかに呼吸する内燃機関の有機的燃焼ゆらぎ（機械的な完全定常ループ感を打破）
        const wanderPh1 = Math.random() * Math.PI * 2.0;
        const wanderPh2 = Math.random() * Math.PI * 2.0;

        // パルス時間定数（フリードランダー正圧ブローダウン時間と負圧掃気膨張時間）
        const tauRiseBase = 0.00011 / Math.max(0.75, sharpness * 0.45);
        const tauZeroBase = Math.max(0.0010, Math.min(0.0032, interval * 0.21));
        const tauDecayBase = Math.max(0.0014, Math.min(0.0044, interval * 0.28)) / Math.max(0.8, sharpness * 0.38);
        const pLen = Math.min(N, Math.floor(sampleRate * Math.max(0.018, interval * 0.92)));

        for (let s = 0; s < numStrokes; s++) {
            const cylIdx = s % numCyl;
            const cycleProgress = s / numStrokes;

            // 緩やかな燃焼圧・空燃比の有機的うねり + ストローク毎の確率的IMEPゆらぎ
            const slowWander = 0.018 * Math.sin(cycleProgress * Math.PI * 2.0 + wanderPh1)
                             + 0.012 * Math.sin(cycleProgress * Math.PI * 6.0 + wanderPh2);
            const jitterFactor = (speedMode === 'idle') ? 0.028 : (speedMode === 'low' ? 0.011 : 0.0085);
            const jit = ((Math.random() * 2.0 - 1.0) * jitterFactor + slowWander * 0.25) * interval;
            const headerDelay = delays[cylIdx % delays.length] || 0.0;
            const stTime = (s * interval + jit + headerDelay + dur) % dur;

            // 気筒別の充填効率差（cylAmps）とサイクル毎の燃焼圧（IMEP）ゆらぎ
            const ampJitter = (speedMode === 'idle') ? 0.085 : 0.042;
            const baseAmp = amps[cylIdx % amps.length] || 1.0;
            const cylAmp = (1.0 + (Math.random() * 2.0 - 1.0) * ampJitter + slowWander) * baseAmp;

            // 気筒ごとのエキマニブランチ管長に基づくプライマリ反射往復時間（1JZ等の6-1集合の立体的な音色を形成）
            const rScale = runnerScales[cylIdx % runnerScales.length] || 1.0;
            const cylPrimLen = basePrimLen * rScale * (1.0 + (Math.random() * 2.0 - 1.0) * 0.015);
            const primDelay1 = (2.0 * cylPrimLen) / cGas;
            const primDelay2 = primDelay1 * 1.92;

            // ストローク毎のバルブ開弁速度の微小変化
            const strokeSharp = 1.0 + (Math.random() * 2.0 - 1.0) * 0.06;
            const tauRise = tauRiseBase * strokeSharp;
            const tauZero = tauZeroBase * (2.0 - strokeSharp);
            const tauDecay = tauDecayBase;

            const idx0 = Math.floor(stTime * sampleRate);
            const gasWeight = profile.gasAmp || 0.75;

            for (let j = 0; j < pLen; j++) {
                const t = j / sampleRate;
                const bufIdx = (idx0 + j) % N;
                let p = 0.0;

                if (isRotary) {
                    // 13Bペリフェラル排気ポート：アペックスシールがポート開口部を高速通過する双極性ブローダウン波
                    const tauRiseRot = 0.00014;
                    const tauDecayRot = Math.max(0.0018, Math.min(0.0038, interval * 0.26));
                    const rise = 1.0 - Math.exp(-t / tauRiseRot);
                    const bipolar = (1.0 - 0.58 * (t / (tauDecayRot * 0.85))) * Math.exp(-t / tauDecayRot);
                    const portPulse = rise * bipolar;
                    let colBounce = 0.0;
                    if (t >= primDelay1) {
                        const tr = t - primDelay1;
                        colBounce = 0.36 * (1.0 - Math.exp(-tr / 0.00022)) * (1.0 - 0.5 * (tr / tauDecayRot)) * Math.exp(-tr / (tauDecayRot * 1.2));
                    }
                    const flowEnv = (1.0 - Math.exp(-t / 0.00045)) * Math.exp(-t / Math.max(0.0024, interval * 0.36));
                    const gasTurb = (gasJetLow[bufIdx] * 0.62 + gasJetHigh[bufIdx] * 0.38) * flowEnv * gasWeight;
                    p = portPulse + colBounce + gasTurb * 0.48;
                } else if (soundType === 'b16b' && speedMode === 'high') {
                    // B16B VTECハイカム領域：高リフト・広オーバーラップによる鋭い双極性直管衝撃波
                    const tauRiseVtec = 0.000068;
                    const tauZeroVtec = Math.max(0.00085, interval * 0.17);
                    const tauDecayVtec = Math.max(0.0011, interval * 0.21);
                    const rise = 1.0 - Math.exp(-t / tauRiseVtec);
                    const shock = rise * (1.0 - 0.68 * (t / tauZeroVtec)) * Math.exp(-t / tauDecayVtec);
                    let ref1 = 0.0;
                    if (t >= primDelay1) {
                        const tr = t - primDelay1;
                        ref1 = 0.42 * (1.0 - Math.exp(-tr / 0.00014)) * (1.0 - 0.6 * (tr / tauZeroVtec)) * Math.exp(-tr / (tauDecayVtec * 1.25));
                    }
                    const flowEnv = (1.0 - Math.exp(-t / 0.00035)) * Math.exp(-t / Math.max(0.0018, interval * 0.30));
                    const gasTurb = (gasJetLow[bufIdx] * 0.55 + gasJetHigh[bufIdx] * 0.45) * flowEnv * gasWeight;
                    p = shock + ref1 + gasTurb * 0.38;
                } else {
                    // ★実車レシプロ内燃機関（1JZ-GTE / 2JZ / RB26 / SR20 / 4A-GE / 4G63 / F5A）の物理排気ブローダウン：
                    // サイン波加算（Math.sin）を一切使わず、フリードランダー正負双極性衝撃波とエキマニ管内反射、
                    // および高温排気ガスジェット気流の物理重ね合わせのみで生々しい内燃機関の爆発・排気音を合成！
                    const rise = 1.0 - Math.exp(-t / tauRise);
                    const friedlander = (1.0 - 0.64 * (t / tauZero)) * Math.exp(-t / tauDecay);
                    const primaryShock = rise * friedlander;

                    // エキマニ集合部（1JZではCT15Bタービンスクロール入口）からの第1・第2反射波
                    let runnerRef = 0.0;
                    if (t >= primDelay1) {
                        const tr1 = t - primDelay1;
                        const rRise1 = 1.0 - Math.exp(-tr1 / (tauRise * 1.7));
                        runnerRef += 0.38 * rRise1 * (1.0 - 0.55 * (tr1 / (tauZero * 1.2))) * Math.exp(-tr1 / (tauDecay * 1.3));
                    }
                    if (t >= primDelay2) {
                        const tr2 = t - primDelay2;
                        const rRise2 = 1.0 - Math.exp(-tr2 / (tauRise * 2.4));
                        runnerRef -= 0.18 * rRise2 * Math.exp(-tr2 / (tauDecay * 1.5));
                    }

                    // ピストン上昇に伴う高温排気ガススラグの噴出包絡線（衝撃波の直後に熱いガス塊が噴き出す）
                    const flowRise = 1.0 - Math.exp(-t / Math.max(0.00035, tauRise * 3.8));
                    const flowDecay = Math.exp(-t / Math.max(0.0022, interval * 0.35));
                    const flowEnv = flowRise * flowDecay;
                    const highJetMix = (speedMode === 'high') ? 0.42 : (speedMode === 'mid' ? 0.34 : 0.24);
                    const gasTurb = (gasJetLow[bufIdx] * (1.0 - highJetMix) + gasJetHigh[bufIdx] * highJetMix) * flowEnv * gasWeight;

                    p = primaryShock + runnerRef + gasTurb * 0.52;
                }

                rawCyl[bufIdx] += p * cylAmp;
            }
        }

        // 2. 多段拡散エキゾースト・ウェーブガイド（Collector + 中間タイコ + オールパス分散メインパイプ）
        // 単一ディレイによる「塩ビ管・フランジャー臭」を完全に排除し、複雑な鋼管排気系の重厚な共鳴を再現
        const L_pipe = profile.pipeLen || 2.85;
        const delayCol = Math.max(12, Math.floor(sampleRate * (2.0 * basePrimLen * 0.82 / cGas)));
        const delayMid = Math.max(24, Math.floor(sampleRate * (2.0 * (L_pipe * 0.41) / cGas)));
        const delayPipe = Math.max(48, Math.floor(sampleRate * (2.0 * L_pipe / cGas)));

        const colBuf = new Float32Array(delayCol);
        const midBuf = new Float32Array(delayMid);
        const pipeBuf = new Float32Array(delayPipe);
        let colIdx = 0, midIdx = 0, pipeIdx = 0;

        const pipeOut = new Float32Array(N);
        const rOpen = profile.tailRef || -0.65;
        const rCol = profile.isTurbo ? 0.32 : 0.38; // タービンハウジングまたはエキマニ集合部の反射率
        const rMid = -0.22;                        // 中間タイコ（サブサイレンサー）・触媒膨張室の反射率

        let lpCol = 0.0, lpPipe = 0.0;
        let apX1 = 0.0, apY1 = 0.0;
        const apCoef = 0.38; // 管壁摩擦・曲がり管によるオールパス位相分散係数
        const warmup = Math.min(N, Math.floor(sampleRate * 0.18));

        for (let i = -warmup; i < N; i++) {
            const srcIdx = (i + N) % N;

            // Stage 2A: エキマニ集合部・タービンスクロール室の部分反射と気流混合
            const colDelayed = colBuf[colIdx];
            lpCol = lpCol * 0.30 + colDelayed * 0.70;
            const colNode = rawCyl[srcIdx] + rCol * lpCol;
            colBuf[colIdx] = colNode;
            colIdx = (colIdx + 1) % delayCol;

            // Stage 2B: フロントパイプ〜中間タイコ〜メインテールパイプの二経路結合ウェーブガイド
            const midDelayed = midBuf[midIdx];
            const tailDelayed = pipeBuf[pipeIdx];

            // 管内の熱境界層ローパス減衰 ＋ オールパス位相分散（周期的なコムフィルター金属臭を解消）
            lpPipe = lpPipe * 0.26 + tailDelayed * 0.74;
            const dispersedTail = apCoef * lpPipe + apX1 - apCoef * apY1;
            apX1 = lpPipe;
            apY1 = dispersedTail;

            const pipeIn = colNode + rMid * midDelayed + (rOpen * 0.52) * dispersedTail;
            const radiated = pipeIn + rOpen * dispersedTail + 0.25 * midDelayed;

            if (i >= 0) {
                pipeOut[i] = radiated;
            }

            midBuf[midIdx] = pipeIn;
            midIdx = (midIdx + 1) % delayMid;
            pipeBuf[pipeIdx] = pipeIn;
            pipeIdx = (pipeIdx + 1) % delayPipe;
        }

        // 3. 2室構造マフラー（第1膨張室：大口径砲弾ヘルムホルツ重低音 / 第2共鳴室：中域エンジンスロート肉厚感）
        // 従来の96Hzと840Hzの間の「中低域のスカスカ感」を解消し、2.5L/3.0L直6やターボ車の分厚いトルク塊感を形成
        const mufflerOut = new Float32Array(N);
        const bodyFreq = profile.bodyFreq || 100.0;
        const throatFreq = profile.throatFreq || 360.0;

        // Chamber 1: リアマフラー膨張室 (Helmholtz Bass, 76-160Hz)
        const wBody = 2.0 * Math.PI * bodyFreq / sampleRate;
        const qBody = Math.min(1.35, (profile.bodyQ || 1.5) * 0.72);
        const aBody = Math.sin(wBody) / (2.0 * qBody);
        const cBody = Math.cos(wBody);
        const b1_0 = aBody, b1_2 = -aBody;
        const a1_0 = 1.0 + aBody, a1_1 = -2.0 * cBody, a1_2 = 1.0 - aBody;

        // Chamber 2: センターパイプ＆マフラーインナーパンチング中域共鳴 (Throat Growl, 320-440Hz)
        const wThroat = 2.0 * Math.PI * throatFreq / sampleRate;
        const qThroat = 0.85;
        const aThroat = Math.sin(wThroat) / (2.0 * qThroat);
        const cThroat = Math.cos(wThroat);
        const b2_0 = aThroat, b2_2 = -aThroat;
        const a2_0 = 1.0 + aThroat, a2_1 = -2.0 * cThroat, a2_2 = 1.0 - aThroat;

        let bx1 = 0, bx2 = 0, by1 = 0, by2 = 0;
        let tx1 = 0, tx2 = 0, ty1 = 0, ty2 = 0;
        let lpMuff = 0;
        const lpMuffCoef = Math.min(0.32, 2.0 * Math.PI * 340.0 / sampleRate);

        for (let i = -warmup; i < N; i++) {
            const inSig = pipeOut[(i + N) % N];
            lpMuff += lpMuffCoef * (inSig - lpMuff);

            // Helmholtz Bass Chamber
            const by0 = (b1_0 * lpMuff + b1_2 * bx2 - a1_1 * by1 - a1_2 * by2) / a1_0;
            bx2 = bx1; bx1 = lpMuff;
            by2 = by1; by1 = by0;

            // Mid-Throat Chamber
            const ty0 = (b2_0 * inSig + b2_2 * tx2 - a2_1 * ty1 - a2_2 * ty2) / a2_0;
            tx2 = tx1; tx1 = inSig;
            ty2 = ty1; ty1 = ty0;

            if (i >= 0) {
                mufflerOut[i] = lpMuff * 0.58 + by0 * 1.45 + ty0 * 1.15;
            }
        }

        // 4. 直管透過波（Straight-Through Cannon Core）とマフラー膨張室音の物理ブレンド＋非対称音響波面急峻化
        const rBase = profile.raspRatioBase || 0.22;
        const rMax = profile.raspRatioMax || 0.76;
        let raspRatio = rBase;
        if (speedMode === 'idle') raspRatio = rBase * 0.72;
        else if (speedMode === 'low') raspRatio = rBase + (rMax - rBase) * 0.22;
        else if (speedMode === 'mid') raspRatio = rBase + (rMax - rBase) * 0.56;
        else if (speedMode === 'high') raspRatio = rMax;

        const driveK = (profile.exhaustDrive || 2.4) * 0.78;
        const bufData = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            const straightPipe = pipeOut[i];
            const mufflerBoom = mufflerOut[i];
            // 高音圧ガス波の非対称急峻化（正圧圧縮波が負圧膨張波より速く伝播する気体力学非線形性）
            const asymSteep = Math.tanh(1.55 * straightPipe + 0.14 * straightPipe * straightPipe) - 0.06;
            const rawMix = mufflerBoom * (1.0 - raspRatio) + asymSteep * raspRatio;
            bufData[i] = (2.0 / Math.PI) * Math.atan(driveK * rawMix);
        }

        // 5. ★広帯域アコースティック・ボディ整形（過度な狭帯域焼き込みによる「早回しテープ感」を排除！）
        // バッファ内には低Q（0.65〜0.85）の緩やかな音響ボディ特性のみを与え、
        // 車種固有の物理マフラー共鳴周波数はリアルタイムフィルター側で絶対周波数として保持する
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

        applyOfflinePeaking(bufData, profile.bodyFreq || 100, (profile.bodyGain || 10) * 0.42, 0.70);
        applyOfflinePeaking(bufData, profile.throatFreq || 370, (profile.throatGain || 8.5) * 0.45, 0.75);
        applyOfflinePeaking(bufData, profile.raspFreq || 680, (profile.raspGain || 11) * 0.42, 0.80);
        applyOfflinePeaking(bufData, profile.ringFreq || 2500, (profile.ringGain || 9) * 0.35, 0.85);

        // 5b. テールパイプ開口端の空間放射ローパス（デジタルな超高域折り返し・チリチリ感を滑らかにロールオフ）
        const radCutoff = (soundType === 'b16b' && speedMode === 'high') ? 5600.0 : 4400.0;
        const radAlpha = Math.min(0.60, (2.0 * Math.PI * radCutoff) / sampleRate);
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

        // 7. ★720°マルチサイクル窓（クランク4回転分）による有機的RMSラウドネス正規化
        // 【超重要】従来のように1ストローク周期（interval）の極小窓で正規化すると、気筒間の圧力差（cylAmps）や
        // エキマニ集合の脈動ビートまで全て平坦に潰れて「単調な機械ブザー音」になってしまう！
        // 窓幅を「2×気筒数×interval（クランク4回転＝720°×2サイクル）」に広げることで、
        // 6気筒/4気筒それぞれの生々しい爆発ビートと脈動を100%温存しつつ、長周期の音量ムラだけを完全に整える！
        const targetRms = 0.26;
        if (speedMode !== 'idle') {
            const winHalf = Math.min(Math.floor(N / 3), Math.max(2048, Math.round(numCyl * 2 * interval * sampleRate)));
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
                bufData[i] = Math.tanh(leveled[i] * 1.18) * 0.85;
            }
        } else {
            let sumSqIdle = 0;
            for (let i = 0; i < N; i++) sumSqIdle += bufData[i] * bufData[i];
            const idleRms = Math.sqrt(sumSqIdle / N) || 0.0001;
            const idleScale = targetRms / idleRms;
            for (let i = 0; i < N; i++) {
                bufData[i] = Math.tanh(bufData[i] * idleScale * 1.15) * 0.85;
            }
        }

        // 最終全体RMSを全車種・全回転ゾーンで targetRms (0.26) に厳密一致させる
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
     * プロシージャル・エンジン＆マフラー音響物理チェーン 8.0 の構築
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

        // 2. 排気管ドライブゲイン
        this.exhaustDriveGain = this.ctx.createGain();
        this.exhaustDriveGain.gain.setValueAtTime(1.0, now);

        this.engineGainIdle.connect(this.exhaustDriveGain);
        this.engineGainLow.connect(this.exhaustDriveGain);
        this.engineGainMid.connect(this.exhaustDriveGain);
        this.engineGainHigh.connect(this.exhaustDriveGain);

        // 3. 排気管ソフトサチュレーションシェーパー（スロットル負荷に応じた微細な倍音密度変化）
        this.exhaustWaveShaper = this.ctx.createWaveShaper();
        const softCurve = new Float32Array(512);
        for (let i = 0; i < 512; i++) {
            const x = (i / 255.5) - 1.0;
            softCurve[i] = Math.tanh(x * 1.15) / Math.tanh(1.15);
        }
        this.exhaustWaveShaper.curve = softCurve;

        this.exhaustDriveGain.connect(this.exhaustWaveShaper);

        // 4. 3バンド物理マフラー固定共鳴フォルマントフィルター群
        // ★車体に固定された金属マフラーの物理サイズ（共振周波数）を実空間周波数で保持することで、
        // ピッチシフトに伴う「録音テープの早回し感・シンセのピッチベンド感」を完全に払拭！
        // 低Q（0.55〜0.70）の広帯域設計により、特定回転数での音量スパイクや谷間もゼロ化。
        this.engineBodyFilter = this.ctx.createBiquadFilter();
        this.engineBodyFilter.type = 'peaking';
        this.engineBodyFilter.frequency.setValueAtTime(profile.bodyFreq, now);
        this.engineBodyFilter.gain.setValueAtTime(2.5, now);
        this.engineBodyFilter.Q.setValueAtTime(0.58, now);

        this.engineRaspFilter = this.ctx.createBiquadFilter();
        this.engineRaspFilter.type = 'peaking';
        this.engineRaspFilter.frequency.setValueAtTime(profile.raspFreq, now);
        this.engineRaspFilter.gain.setValueAtTime(2.0, now);
        this.engineRaspFilter.Q.setValueAtTime(0.62, now);

        this.engineRingFilter = this.ctx.createBiquadFilter();
        this.engineRingFilter.type = 'peaking';
        this.engineRingFilter.frequency.setValueAtTime(profile.ringFreq, now);
        this.engineRingFilter.gain.setValueAtTime(1.5, now);
        this.engineRingFilter.Q.setValueAtTime(0.68, now);

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

        // 5. レブリミッター・スタッターチョッパー (点火カット)
        this.revChopperGain = this.ctx.createGain();
        this.revChopperGain.gain.setValueAtTime(1.0, now);

        this.revLfo = this.ctx.createOscillator();
        this.revLfo.type = 'sawtooth';
        this.revLfo.frequency.setValueAtTime(profile.revBounceHz, now);
        this.revModGain = this.ctx.createGain();
        this.revModGain.setValueAtTime ? this.revModGain.setValueAtTime(0.0, now) : this.revModGain.gain.setValueAtTime(0.0, now);
        this.revLfo.connect(this.revModGain);
        this.revModGain.connect(this.revChopperGain.gain);

        this.engineFilter.connect(this.revChopperGain);

        // 6. 動弁系・カムギア・タイミングベルト機械回転ノイズ音源（RPM連動で再生速度が変化！）
        const mechLen = Math.floor(sampleRate * 2.0);
        const mechBuf = this.ctx.createBuffer(1, mechLen, sampleRate);
        const mData = mechBuf.getChannelData(0);
        let mLp = 0.0;
        const tappetPeriod = Math.floor(sampleRate * 0.018);
        for (let i = 0; i < mechLen; i++) {
            const w = Math.random() * 2 - 1;
            mLp = 0.72 * mLp + 0.28 * w;
            const phaseInPeriod = i % tappetPeriod;
            const tappetEnv = Math.exp(-phaseInPeriod / (sampleRate * 0.0028));
            mData[i] = mLp * (0.22 + 0.78 * tappetEnv);
        }
        this.mechNoiseNode = this.ctx.createBufferSource();
        this.mechNoiseNode.buffer = mechBuf;
        this.mechNoiseNode.loop = true;

        this.mechFilter = this.ctx.createBiquadFilter();
        this.mechFilter.type = 'bandpass';
        this.mechFilter.frequency.setValueAtTime(profile.mechFreq || 3000, now);
        this.mechFilter.Q.setValueAtTime(1.8, now);

        this.mechGain = this.ctx.createGain();
        this.mechGain.gain.setValueAtTime(profile.mechWeight || 0.05, now);

        this.mechNoiseNode.connect(this.mechFilter);
        this.mechFilter.connect(this.mechGain);
        this.mechGain.connect(this.revChopperGain);

        // 7. 吸気サージタンク・エアクリーナーインダクション咆哮
        const intakeBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
        const inData = intakeBuf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < inData.length; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            inData[i] = (b0 + b1 + b2 + white * 0.5362) * 0.065;
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

        // 8. ターボチャージャー過給コンプレッサー気流＆ブレード風切り音（純粋な空力気流合成）
        const turboBuf = this.ctx.createBuffer(1, sampleRate * 2, sampleRate);
        const tData = turboBuf.getChannelData(0);
        let lastTb1 = 0, lastTb2 = 0;
        for (let i = 0; i < tData.length; i++) {
            const w = Math.random() * 2 - 1;
            lastTb1 = 0.82 * lastTb1 + 0.18 * w;
            lastTb2 = 0.94 * lastTb2 + 0.06 * w;
            tData[i] = (lastTb1 - lastTb2) * 1.15;
        }
        this.turboNoiseNode = this.ctx.createBufferSource();
        this.turboNoiseNode.buffer = turboBuf;
        this.turboNoiseNode.loop = true;

        this.turboFilter = this.ctx.createBiquadFilter();
        this.turboFilter.type = 'bandpass';
        this.turboFilter.frequency.setValueAtTime(2400, now);
        this.turboFilter.Q.setValueAtTime(1.8, now);

        this.turboGain = this.ctx.createGain();
        this.turboGain.gain.setValueAtTime(0.0, now);

        this.turboNoiseNode.connect(this.turboFilter);
        this.turboFilter.connect(this.turboGain);
        this.turboGain.connect(this.revChopperGain);

        // 9. 減速時（エンジンブレーキ時）マフラー内未燃焼ガス・バブリング＆ゴロゴロ脈動音源
        // 単なるホワイトノイズではなく、排気管内で不規則に起きる微小な未燃焼ガス膨張パフ（Friedlanderバブル）を合成
        const decelLen = sampleRate * 3;
        const decelBuf = this.ctx.createBuffer(1, decelLen, sampleRate);
        const dData = decelBuf.getChannelData(0);
        let dLp = 0.0;
        for (let i = 0; i < decelLen; i++) {
            const w = Math.random() * 2 - 1;
            dLp = 0.92 * dLp + 0.08 * w;
            dData[i] = dLp * 0.35;
        }
        // 不規則な未燃焼ガス・バブリング脉冲を重ね合わせる
        const numBurbles = 95;
        for (let b = 0; b < numBurbles; b++) {
            const pos = Math.floor(Math.random() * (decelLen - 2400));
            const bAmp = 0.35 + Math.random() * 0.65;
            const bZero = 0.0022 + Math.random() * 0.0025;
            const bDecay = bZero * 1.4;
            for (let k = 0; k < 1800; k++) {
                const t = k / sampleRate;
                const wave = (1.0 - Math.exp(-t / 0.00025)) * (1.0 - 0.65 * (t / bZero)) * Math.exp(-t / bDecay);
                dData[pos + k] += wave * bAmp;
            }
        }
        for (let i = 0; i < decelLen; i++) {
            dData[i] = Math.tanh(dData[i] * 1.1) * 0.75;
        }

        this.decelNoiseSource = this.ctx.createBufferSource();
        this.decelNoiseSource.buffer = decelBuf;
        this.decelNoiseSource.loop = true;

        this.decelFilter = this.ctx.createBiquadFilter();
        this.decelFilter.type = 'lowpass';
        this.decelFilter.frequency.setValueAtTime(320, now);
        this.decelFilter.Q.setValueAtTime(1.3, now);

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
        this.currentBoost = 0.0;
        if (!this.initialized || !this.engineCombustionGain) return;

        const now = this.ctx.currentTime;
        const profile = ENGINE_PROFILES[this.soundType] || ENGINE_PROFILES['4age'];

        // 1. 車種専用プロシージャル燃焼ループ音源の切替（4段階マルチスピード）
        if (this.engineGainIdle) this.engineGainIdle.gain.setValueAtTime(0.96, now);
        if (this.engineGainLow) this.engineGainLow.gain.setValueAtTime(0.0, now);
        if (this.engineGainMid) this.engineGainMid.gain.setValueAtTime(0.0, now);
        if (this.engineGainHigh) this.engineGainHigh.gain.setValueAtTime(0.0, now);
        this._startEngineLoopSource(this.soundType);

        // 2. マフラー・エキマニ固定物理共鳴フォルマントの即時適用
        if (this.engineBodyFilter) {
            this.engineBodyFilter.frequency.setValueAtTime(profile.bodyFreq, now);
            this.engineBodyFilter.gain.setValueAtTime(2.5, now);
        }
        if (this.engineRaspFilter) {
            this.engineRaspFilter.frequency.setValueAtTime(profile.raspFreq, now);
            this.engineRaspFilter.gain.setValueAtTime(2.0, now);
        }
        if (this.engineRingFilter) {
            this.engineRingFilter.frequency.setValueAtTime(profile.ringFreq, now);
            this.engineRingFilter.gain.setValueAtTime(1.5, now);
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
        const dt = this._lastEngineUpdateTime ? Math.min(0.05, Math.max(0.004, curTime - this._lastEngineUpdateTime)) : 0.016;
        this._lastEngineUpdateTime = curTime;

        throttle = Math.max(0, Math.min(1.0, throttle || 0));
        rpm = Math.max(680, rpm || 680);

        const profile = ENGINE_PROFILES[this.soundType] || ENGINE_PROFILES['4age'];
        const maxRpmRef = Math.max(redlineRpm, profile.maxRpm || 8500);
        const rpmNorm = Math.min(1.25, Math.max(0, (rpm - profile.idleRpm) / (maxRpmRef - profile.idleRpm)));

        // 1. 4段階マルチスピード・プロシージャル燃焼バッファの動的再生レート
        const baseIdle = profile.idleBaseRpm || profile.idleRpm || 850.0;
        const baseLow = profile.lowBaseRpm || 2000.0;
        const baseMid = profile.midBaseRpm || 3800.0;
        const baseHigh = profile.highBaseRpm || 6200.0;

        const rateIdle = Math.max(0.60, Math.min(2.2, rpm / baseIdle));
        const rateLow = Math.max(0.45, Math.min(2.2, rpm / baseLow));
        const rateMid = Math.max(0.40, Math.min(2.2, rpm / baseMid));
        const rateHigh = Math.max(0.45, Math.min(1.8, rpm / baseHigh));

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

        // ★4ゾーン超広帯域イコールパワー・クロスフェード（早回しピッチベンド感とVTEC風段差の両方を完全根絶！）
        // 1つのループだけを5倍ピッチシフトすると「録音・シンセの早回し感」が出るため、
        // idle / low / mid / high の4つの物理シミュレーションバッファを、1,500〜1,750rpmもの非常に広いオーバーラップ帯域で
        // 等パワー（cos^2 + sin^2 = 1.0）クロスフェードさせる。これにより各バッファは常に自然な等倍付近（0.75〜1.28x）で鳴り、
        // かつ切り替えの段差も100%知覚不能なシームレス吹け上がりを実現！
        let gIdle = 0.0, gLow = 0.0, gMid = 0.0, gHigh = 0.0;
        const idleStart = baseIdle + 60.0;
        const idleEnd = 1720.0;

        if (this.soundType === 'b16b') {
            // ★EK9 シビック Type R 専用：5,800rpmでの本物のVTECハイカム切り替え
            const vtecRpm = 5800.0;
            if (rpm <= idleStart) {
                gIdle = 1.0;
            } else if (rpm < idleEnd) {
                const t = (rpm - idleStart) / (idleEnd - idleStart);
                gIdle = Math.cos(t * Math.PI * 0.5);
                gLow = Math.sin(t * Math.PI * 0.5);
            } else if (rpm < 2400.0) {
                gLow = 1.0;
            } else if (rpm < 4000.0) {
                const t = (rpm - 2400.0) / 1600.0;
                gLow = Math.cos(t * Math.PI * 0.5);
                gMid = Math.sin(t * Math.PI * 0.5);
            } else if (rpm < vtecRpm) {
                gMid = 1.0;
            } else {
                gHigh = 1.0;
            }
        } else {
            // ★全ターボ車・通常NA車（JZX100 1JZ-GTE, FD3S, R32, S15, JZA80, CE9A, AE86, CC72V）：
            // 1,600rpm以上の超ワイドな等パワークロスフェードにより、段差ゼロ＆早回し感ゼロの自然な吹け上がり
            const lowToMidStart = 2050.0;
            const lowToMidEnd = 3650.0;
            const midToHighStart = 4050.0;
            const midToHighEnd = 5800.0;

            if (rpm <= idleStart) {
                gIdle = 1.0;
            } else if (rpm < idleEnd) {
                const t = (rpm - idleStart) / (idleEnd - idleStart);
                gIdle = Math.cos(t * Math.PI * 0.5);
                gLow = Math.sin(t * Math.PI * 0.5);
            } else if (rpm < lowToMidStart) {
                gLow = 1.0;
            } else if (rpm < lowToMidEnd) {
                const t = (rpm - lowToMidStart) / (lowToMidEnd - lowToMidStart);
                gLow = Math.cos(t * Math.PI * 0.5);
                gMid = Math.sin(t * Math.PI * 0.5);
            } else if (rpm < midToHighStart) {
                gMid = 1.0;
            } else if (rpm < midToHighEnd) {
                const t = (rpm - midToHighStart) / (midToHighEnd - midToHighStart);
                gMid = Math.cos(t * Math.PI * 0.5);
                gHigh = Math.sin(t * Math.PI * 0.5);
            } else {
                gHigh = 1.0;
            }
        }

        if (this.engineGainIdle) this.engineGainIdle.gain.setTargetAtTime(gIdle, curTime, 0.020);
        if (this.engineGainLow) this.engineGainLow.gain.setTargetAtTime(gLow, curTime, 0.020);
        if (this.engineGainMid) this.engineGainMid.gain.setTargetAtTime(gMid, curTime, 0.020);
        if (this.engineGainHigh) this.engineGainHigh.gain.setTargetAtTime(gHigh, curTime, 0.020);

        // 2. ターボ過給圧の物理回転慣性シミュレーション（this.currentBoost: 0.0〜1.0）
        const prevBoost = this.currentBoost || 0.0;
        const turboStartRpm = (this.soundType === '1jz') ? 1950 : 2150;
        let targetBoost = 0.0;
        if (profile.isTurbo && throttle > 0.08 && rpm > turboStartRpm) {
            const spoolRamp = Math.max(0.0, Math.min(1.0, (rpm - turboStartRpm) / 2300.0));
            const smoothSpool = spoolRamp * spoolRamp * (3.0 - 2.0 * spoolRamp);
            const throttleLoad = Math.pow(Math.max(0.0, Math.min(1.0, (throttle - 0.08) / 0.85)), 0.85);
            targetBoost = smoothSpool * throttleLoad;
        }
        // スプールアップは排気エネルギーによるタービン慣性（時定数約0.26s）、アクセルオフ時は急速減衰
        const boostRate = (targetBoost > prevBoost) ? 3.8 : 7.5;
        this.currentBoost = prevBoost + (targetBoost - prevBoost) * Math.min(1.0, dt * boostRate);

        // 排気管ドライブゲイン（スロットル開度と実過給圧に応じて燃焼圧力の厚みが変化）
        if (this.exhaustDriveGain) {
            const driveVal = 0.88 + throttle * 0.16 + this.currentBoost * 0.08;
            this.exhaustDriveGain.gain.setTargetAtTime(driveVal, curTime, 0.025);
        }

        // 3. 車体固定マフラーの物理共鳴フォルマント制御（実空間周波数を維持し、早回し感を完全防止）
        // 排気ガス温度・流速上昇に伴う微小な音速シフト（+5〜15%程度）のみを与え、マフラー固有の箱鳴り感を死守！
        const loadFactor = 0.30 + 0.70 * throttle;
        if (this.soundType === '1jz') {
            // ★1JZ-GTE (JZX100 ツアラーV) 専用物理マフラー共鳴：
            // 92Hzの大口径砲弾マフラー重低音と、6-1集合＋CT15Bタービンの肉厚な中高域咆哮が負荷に応じて立体的に融合
            const bodyFreq1jz = profile.bodyFreq + rpmNorm * 12;
            const bodyGain1jz = 3.2 - rpmNorm * 1.4 + (1.0 - throttle) * 1.2;
            this.engineBodyFilter.frequency.setTargetAtTime(bodyFreq1jz, curTime, 0.04);
            this.engineBodyFilter.gain.setTargetAtTime(bodyGain1jz, curTime, 0.04);

            const raspFreq1jz = profile.raspFreq + rpmNorm * 110 + this.currentBoost * 65;
            const raspGain1jz = (2.2 + rpmNorm * 2.4 + this.currentBoost * 1.6) * loadFactor;
            this.engineRaspFilter.frequency.setTargetAtTime(raspFreq1jz, curTime, 0.04);
            this.engineRaspFilter.gain.setTargetAtTime(raspGain1jz, curTime, 0.04);

            const ringFreq1jz = profile.ringFreq + rpmNorm * 240;
            const ringGain1jz = (1.2 + rpmNorm * 2.6 + this.currentBoost * 1.2) * (0.25 + 0.75 * throttle);
            this.engineRingFilter.frequency.setTargetAtTime(ringFreq1jz, curTime, 0.04);
            this.engineRingFilter.gain.setTargetAtTime(ringGain1jz, curTime, 0.04);
        } else {
            const bodyFreq = profile.bodyFreq + rpmNorm * 12;
            const bodyGain = 2.6 - rpmNorm * 0.8 + (1.0 - throttle) * 1.0;
            this.engineBodyFilter.frequency.setTargetAtTime(bodyFreq, curTime, 0.04);
            this.engineBodyFilter.gain.setTargetAtTime(bodyGain, curTime, 0.04);

            const raspFreq = profile.raspFreq + rpmNorm * 110;
            const raspGain = (1.8 + rpmNorm * 2.2 + this.currentBoost * 1.2) * loadFactor;
            this.engineRaspFilter.frequency.setTargetAtTime(raspFreq, curTime, 0.04);
            this.engineRaspFilter.gain.setTargetAtTime(raspGain, curTime, 0.04);

            const ringFreq = profile.ringFreq + rpmNorm * 180;
            const ringGain = (1.0 + rpmNorm * 2.2) * (0.20 + 0.80 * throttle);
            this.engineRingFilter.frequency.setTargetAtTime(ringFreq, curTime, 0.04);
            this.engineRingFilter.gain.setTargetAtTime(ringGain, curTime, 0.04);
        }

        // 4. 動弁系・カムギア・メカノイズ（RPMに比例してピッチと周期が加速し、エンジン本体の機械回転実在感を付与！）
        if (this.mechNoiseNode && this.mechNoiseNode.playbackRate) {
            const mechRate = 0.55 + rpmNorm * 1.65;
            this.mechNoiseNode.playbackRate.setTargetAtTime(mechRate, curTime, 0.025);
        }
        if (this.mechFilter) {
            const mFreq = (profile.mechFreq || 3000) * (0.72 + rpmNorm * 0.55);
            this.mechFilter.frequency.setTargetAtTime(mFreq, curTime, 0.03);
        }
        if (this.mechGain) {
            let mechWeightVal = (profile.mechWeight || 0.10) * 0.28;
            if (this.soundType === '13b') {
                mechWeightVal = 0.003;
            }
            const mechVol = mechWeightVal * (0.65 + 0.35 * (1.0 - Math.min(0.8, rpmNorm)));
            this.mechGain.gain.setTargetAtTime(mechVol, curTime, 0.03);
        }

        // 5. 吸排気可変ダイナミックローパスフィルター（アクセルONで高域の乾いた直管咆哮が弾け、OFFでこもった負圧排気音へ）
        let baseCutoff = 1650;
        let rangeCutoff = 6200;
        let throttleCutoff = 7200;
        let vtecVolumeBoost = 1.0;

        if (this.soundType === 'b16b') {
            const isVtec = (rpm >= 5800);
            if (isVtec) {
                baseCutoff = 4800;
                rangeCutoff = 9500;
                throttleCutoff = 5500;
                vtecVolumeBoost = 1.22; // VTECハイカム切替時の音圧跳ね上がり
            } else {
                baseCutoff = 1800;
                rangeCutoff = 4600;
                throttleCutoff = 4200;
                vtecVolumeBoost = 0.96;
            }
        } else if (this.soundType === '1jz') {
            // 1JZ-GTE：アクセルオフ時は砲弾マフラーの低い唸り、踏み込むとCT15B過給とともに乾いた直6咆哮が全開！
            baseCutoff = 1750;
            rangeCutoff = 6800;
            throttleCutoff = 7600 + this.currentBoost * 2200;
        }

        const targetCutoff = baseCutoff + (rpmNorm * rangeCutoff) + (throttle * throttleCutoff);
        this.engineFilter.frequency.setTargetAtTime(Math.min(18000, targetCutoff), curTime, 0.022);

        // 6. 吸気サージタンク・エアクリーナー吸入咆哮
        let intakeVol = 0;
        let intakeFreq = profile.intakePeak;
        if (this.soundType === '4age') {
            intakeVol = Math.max(0, (throttle * 0.13) + (rpmNorm * 0.08 * throttle));
            intakeFreq = 420 + (throttle * 520) + (rpmNorm * 300);
        } else if (this.soundType === 'b16b') {
            const isVtec = (rpm >= 5800);
            intakeVol = Math.max(0, (throttle * (isVtec ? 0.09 : 0.05)) + (rpmNorm * 0.04 * throttle));
            intakeFreq = isVtec ? (580 + throttle * 320 + rpmNorm * 160) : (360 + throttle * 200);
        } else if (this.soundType === '13b' || this.soundType === 'rb26') {
            intakeVol = Math.max(0, (throttle * 0.05) + (rpmNorm * 0.03 * throttle));
            intakeFreq = profile.intakePeak + (throttle * 280) + (rpmNorm * 180);
        } else {
            intakeVol = Math.max(0, (throttle * 0.075) + (rpmNorm * 0.045 * throttle));
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

        // 8. ターボチャージャー過給コンプレッサー気流 ＆ 実ブースト連動バックタービン（BOV）
        const throttleDrop = (this.prevThrottle > 0.35 && throttle < 0.15);
        if (profile.isTurbo && this.currentBoost > 0.02) {
            const turboScale = (this.soundType === '13b' || this.soundType === 'rb26') ? 0.16 : (this.soundType === '1jz' ? 0.28 : 0.24);
            const turboVol = Math.min(0.085, this.currentBoost * (0.065 + rpmNorm * 0.035) * turboScale);
            const turboFreq = (this.soundType === '1jz')
                ? (1850 + (this.currentBoost * 1600) + (rpmNorm * 1400))
                : (1700 + (this.currentBoost * 1400) + (rpmNorm * 1300));
            if (this.turboNoiseNode && this.turboNoiseNode.playbackRate) {
                this.turboNoiseNode.playbackRate.setTargetAtTime(0.75 + this.currentBoost * 0.65 + rpmNorm * 0.40, curTime, 0.04);
            }
            this.turboFilter.frequency.setTargetAtTime(turboFreq, curTime, 0.04);
            this.turboGain.gain.setTargetAtTime(turboVol, curTime, 0.04);
        } else {
            this.turboGain.gain.setTargetAtTime(0.0, curTime, 0.06);
        }

        if (profile.isTurbo && throttleDrop && (prevBoost > 0.22 || rpm > 2800)) {
            const blowOffIntensity = Math.max(rpmNorm * 0.75, prevBoost * 1.15);
            this.playBlowOffSound(blowOffIntensity, profile.isTwinTurbo);
            // JZX100直管マフラー特有のアクセルオフ時の乾いたアフターファイヤ・バブリング連動
            if (this.soundType === '1jz' && rpm > 4200 && Math.random() < 0.68) {
                this.playAfterfireSound(0.72 * Math.max(rpmNorm, prevBoost));
            }
        }

        // 9. 減速時（エンジンブレーキ時）マフラー内未燃焼ガス・バブリング＆CE9Aアンチラグ
        if (throttleDrop || (throttle < 0.15 && rpm > 2000)) {
            const decelVol = Math.min(0.32, ((rpm - 1400) / maxRpmRef) * 0.38);
            if (this.decelNoiseSource && this.decelNoiseSource.playbackRate) {
                this.decelNoiseSource.playbackRate.setTargetAtTime(0.65 + rpmNorm * 0.95, curTime, 0.03);
            }
            if (this.decelFilter) {
                this.decelFilter.frequency.setTargetAtTime((profile.bodyFreq || 100) * 2.4 + rpmNorm * 160, curTime, 0.03);
            }
            this.decelNoiseGain.gain.setTargetAtTime(Math.max(0, decelVol), curTime, 0.025);

            if (this.soundType === '4g63' && throttle < 0.12 && rpm > 2600) {
                if (Math.random() < 0.45) {
                    this.playAntiLagPop(rpmNorm);
                }
            }
        } else {
            this.decelNoiseGain.gain.setTargetAtTime(0.0, curTime, 0.05);
        }
        this.prevThrottle = throttle;

        // 10. ★エンジンマスター音量制御（回転数・スロットル負荷・実過給圧に応じて滑らかに単調増加）
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

        const maxBoostSwell = (this.soundType === 'rb26' || this.soundType === '13b') ? 0.09 : 0.15;
        const boostSwell = this.currentBoost * maxBoostSwell;

        const carWeightScale = (profile.mainWeight || 0.75) / 0.75;
        const rpmCurve = Math.pow(Math.min(1.0, rpmNorm), 0.88);
        const baseEngineVol = (0.25 + (throttle * 0.33) + (rpmCurve * 0.56) + boostSwell) * carWeightScale * vtecVolumeBoost;
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

        const sampleRate = this.ctx.sampleRate;
        const is1jz = (this.soundType === '1jz');

        // 1. 高圧エアー初期開放アタック「カシュッ！」（0.18秒）
        const bufLen = Math.floor(sampleRate * 0.20);
        const buf = this.ctx.createBuffer(1, bufLen, sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) {
            const decay = Math.exp(-i / (sampleRate * 0.032));
            data[i] = (Math.random() * 2 - 1) * decay;
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(isTwinTurbo ? 3000 : (is1jz ? 2350 : 2500), now);
        filter.Q.setValueAtTime(2.2, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.32 * Math.min(1.2, 0.7 + intensity * 0.4), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        src.start(now);

        // 2. 本物のバックタービン（コンプレッサーサージ・チャタリング）「カシュルルルルッ！」
        // 電子サイン波を排除し、アルミ吸気管＆むき出しエアクリーナー内を逆流空気がブレード周期で断続共鳴する空力物理合成
        const dur = is1jz ? 0.42 : 0.34;
        const surgeLen = Math.floor(sampleRate * dur);
        const surgeBuf = this.ctx.createBuffer(1, surgeLen, sampleRate);
        const sData = surgeBuf.getChannelData(0);

        let flutterPhase = 0;
        let bp1_y1 = 0, bp1_y2 = 0, bp1_x1 = 0, bp1_x2 = 0;
        let bp2_y1 = 0, bp2_y2 = 0, bp2_x1 = 0, bp2_x2 = 0;

        for (let i = 0; i < surgeLen; i++) {
            const t = i / sampleRate;
            const progress = t / dur;

            // タービンシャフト減速に伴うチャタリング周期の低下（22.5Hz -> 10.8Hz）
            const fFlutter = (isTwinTurbo ? 25.0 : 22.5) * (1.0 - 0.52 * Math.pow(progress, 0.85));
            flutterPhase += (2.0 * Math.PI * fFlutter) / sampleRate;

            // 逆流空気がインデューサーブレードを叩く非対称チョッピング包絡線
            const rawWave = Math.sin(flutterPhase);
            const chopPulse = Math.pow(Math.max(0.0, rawWave), 1.65);
            const overallDecay = Math.exp(-t * (is1jz ? 5.0 : 6.2));
            const env = (0.10 + 0.90 * chopPulse) * overallDecay;

            // 1回のチョップ内で「シュッ→ルッ」と共鳴周波数がスウィープする空力特性
            const intraChop = 0.5 + 0.5 * Math.cos(flutterPhase);
            const fRes1 = (isTwinTurbo ? 1150 : 960) * (1.0 - 0.30 * progress) + intraChop * 380;
            const fRes2 = (isTwinTurbo ? 2550 : 2200) * (1.0 - 0.26 * progress) + intraChop * 600;

            const wn = Math.random() * 2 - 1;

            // フォルマント1：インテークパイプ気柱共鳴
            const w1 = 2.0 * Math.PI * fRes1 / sampleRate;
            const a1 = Math.sin(w1) / (2.0 * 3.2);
            const c1 = Math.cos(w1);
            const y1 = (a1 * (wn - bp1_x2) + 2.0 * c1 * bp1_y1 - (1.0 - a1) * bp1_y2) / (1.0 + a1);
            bp1_x2 = bp1_x1; bp1_x1 = wn;
            bp1_y2 = bp1_y1; bp1_y1 = y1;

            // フォルマント2：コンプレッサーハウジング＆エアクリ高圧気流エッジ
            const w2 = 2.0 * Math.PI * fRes2 / sampleRate;
            const a2 = Math.sin(w2) / (2.0 * 4.0);
            const c2 = Math.cos(w2);
            const y2 = (a2 * (wn - bp2_x2) + 2.0 * c2 * bp2_y1 - (1.0 - a2) * bp2_y2) / (1.0 + a2);
            bp2_x2 = bp2_x1; bp2_x1 = wn;
            bp2_y2 = bp2_y1; bp2_y1 = y2;

            sData[i] = Math.tanh((y1 * 1.55 + y2 * 1.25) * 1.4) * env * 0.72;
        }

        const sSrc = this.ctx.createBufferSource();
        sSrc.buffer = surgeBuf;
        const sGain = this.ctx.createGain();
        const surgeVol = (is1jz ? 0.38 : 0.30) * Math.min(1.25, 0.75 + intensity * 0.45);
        sGain.gain.setValueAtTime(surgeVol, now);
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
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;
        const sr = this.ctx.sampleRate || 44100;

        // シフトリンケージ・クラッチ断続の金属・駆動系ショック音（電子オシレーター不使用）
        const len = Math.floor(sr * 0.085);
        const buf = this.ctx.createBuffer(1, len, sr);
        const d = buf.getChannelData(0);
        let lp = 0.0;
        for (let i = 0; i < len; i++) {
            const t = i / sr;
            const w = Math.random() * 2.0 - 1.0;
            lp = 0.80 * lp + 0.20 * w;
            // シフトフォーク咬み合い衝撃 + ミッションケース低域減衰
            const clunk = (1.0 - Math.exp(-t / 0.0004)) * (1.0 - 0.7 * (t / 0.0045)) * Math.exp(-t / 0.014);
            const subImpact = (1.0 - Math.exp(-t / 0.0012)) * Math.exp(-t / 0.024) * Math.cos(2.0 * Math.PI * 95.0 * t);
            d[i] = Math.tanh((clunk * 0.7 + subImpact * 0.65 + lp * Math.exp(-t / 0.018) * 0.45) * 1.4) * 0.65;
        }
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.32, now);
        src.connect(gain);
        gain.connect(this.sfxGain);
        src.start(now);
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
        if (!this.ctx) return;
        const sr = this.ctx.sampleRate || 44100;
        const dur = 0.11;
        const bufferSize = Math.floor(sr * dur);
        const buffer = this.ctx.createBuffer(1, bufferSize, sr);
        const data = buffer.getChannelData(0);

        // 実車マフラー出口での未燃焼ガス爆発（フリードランダー衝撃波＋砲弾太鼓の重低音膨張共鳴、オシレーター不使用）
        const tauZero = 0.0018 / Math.max(0.7, pitchFactor);
        const tauDecay = 0.0085 / Math.max(0.7, pitchFactor);
        let lpNoise = 0.0;
        let cavityY1 = 0.0, cavityY2 = 0.0, cavityX1 = 0.0, cavityX2 = 0.0;
        const fCav = 115.0 * pitchFactor;
        const w0 = (2.0 * Math.PI * fCav) / sr;
        const alpha = Math.sin(w0) / (2.0 * 1.4);
        const cosw0 = Math.cos(w0);

        for (let i = 0; i < bufferSize; i++) {
            const t = i / sr;
            const wn = Math.random() * 2.0 - 1.0;
            lpNoise = 0.76 * lpNoise + 0.24 * wn;

            // 急峻な正圧爆轟波と負圧吸引波
            const rise = 1.0 - Math.exp(-t / 0.00018);
            const blast = rise * (1.0 - 0.72 * (t / tauZero)) * Math.exp(-t / tauDecay);
            const jetBurst = lpNoise * Math.exp(-t / 0.022) * 0.65;
            const rawIn = blast + jetBurst;

            // マフラー膨張室のヘルムホルツ重低音共鳴（「ボフッ！／パンッ！」の胴鳴り）
            const y0 = (alpha * (rawIn - cavityX2) + 2.0 * cosw0 * cavityY1 - (1.0 - alpha) * cavityY2) / (1.0 + alpha);
            cavityX2 = cavityX1; cavityX1 = rawIn;
            cavityY2 = cavityY1; cavityY1 = y0;

            data[i] = Math.tanh((rawIn * 0.85 + y0 * 1.75) * 1.6) * 0.82;
        }

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;

        const popGain = this.ctx.createGain();
        popGain.gain.setValueAtTime(0.58 * volume, time);

        src.connect(popGain);
        popGain.connect(this.sfxGain);
        src.start(time);
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
