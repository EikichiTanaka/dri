/**
 * CarDatabase.js - ガレージ用 マシン詳細スペック＆性能マスターデータ
 * AE86, FD3S, BNR32, PS13, JZX100 の5台の実車スペック・駆動方式・物理特性・カラー・サウンド定義
 */

const CAR_DATABASE = {
    'ae86': {
        id: 'ae86',
        name: 'TOYOTA SPRINTER TRUENO GT-APEX',
        shortName: 'AE86 トレノ',
        modelCode: 'AE86',
        category: 'LIGHTWEIGHT FR',
        driver: '藤原拓海 (秋名スピードスターズ / プロジェクトD)',
        drivetrain: 'FR',
        engineName: '4A-GEU 改 レーシング仕様',
        engineType: '1.6L 直列4気筒 DOHC 20バルブ NA',
        power: '240 PS / 11,000 rpm',
        torque: '18.0 kgm / 8,500 rpm',
        weight: '960 kg',
        desc: '【ハチロク】超軽量ボディと11,000回転まで突き抜けるグループAレーシングエンジンを搭載した伝説のパンダトレノ。圧倒的軽快感とインベタ溝落としコーナリングで無敵のダウンヒルを誇る。',
        stats: {
            speed: 8.0,
            accel: 7.8,
            handling: 10.0,
            drift: 9.2,
            stability: 6.5
        },
        colors: [
            { name: 'パンダ白黒 (ハイテックツートン)', primary: 0xf5f5f7, secondary: 0x181818, hood: 0x242426, rim: 0x3a3025 },
            { name: 'オールホワイト (プロジェクトD仕様)', primary: 0xf5f5f7, secondary: 0xf5f5f7, hood: 0x1c1c1e, rim: 0x222222 },
            { name: 'ハイフラッシュシルバー', primary: 0xaaaaaa, secondary: 0x181818, hood: 0xaaaaaa, rim: 0xddaa33 }
        ],
        physics: {
            mass: 960,
            weightFrontStatic: 0.53,
            wheelbase: 2.40,
            cgToFront: 1.15,
            cgToRear: 1.25,
            inertiaZ: 1250,
            corneringStiffnessFront: 38000,
            corneringStiffnessRear: 36000,
            tireGripLimit: 1.08,
            drivetrain: 'FR',
            gearRatios: [0, 3.166, 1.904, 1.392, 1.082, 0.861],
            finalDrive: 4.300,
            wheelCircumference: 1.82,
            gearAccelMap: [0, 5.4, 4.0, 2.9, 1.9, 1.3],
            maxRpm: 11000,
            idleRpm: 950,
            redlineRpm: 9100,
            maxSpeed: 235,
            engineSoundType: '4age',
            engineResponse: 24.0
        }
    },

    'fd3s': {
        id: 'fd3s',
        name: 'MAZDA RX-7 Type R',
        shortName: 'FD3S RX-7',
        modelCode: 'FD3S',
        category: 'ROTARY TURBO FR',
        driver: '高橋啓介 (赤城レッドサンズ / プロジェクトD)',
        drivetrain: 'FR',
        engineName: '13B-REW 改 シーケンシャルツインターボ',
        engineType: '654cc x 2 ロータリー ツインターボ',
        power: '350 PS / 6,500 rpm',
        torque: '41.0 kgm / 5,000 rpm',
        weight: '1,260 kg',
        desc: '【黄色の弾丸】ロータリーエンジン特有の超低重心・前後50:50理想重量配分を誇るピュアスポーツ。シーケンシャルツインターボによる爆発的加速とカミソリのように鋭い回頭性。',
        stats: {
            speed: 9.3,
            accel: 9.4,
            handling: 9.3,
            drift: 9.0,
            stability: 8.0
        },
        colors: [
            { name: 'コンペティションイエローマイカ', primary: 0xffcc00, secondary: 0x181818, hood: 0xffcc00, rim: 0xddaa33 },
            { name: 'イノセントブルーマイカ', primary: 0x0a3d91, secondary: 0x181818, hood: 0x0a3d91, rim: 0xd4d4d4 },
            { name: 'ピュアホワイト', primary: 0xf5f5f7, secondary: 0x181818, hood: 0x222224, rim: 0x282828 }
        ],
        physics: {
            mass: 1260,
            weightFrontStatic: 0.50,
            wheelbase: 2.42,
            cgToFront: 1.21,
            cgToRear: 1.21,
            inertiaZ: 1450,
            corneringStiffnessFront: 44000,
            corneringStiffnessRear: 43000,
            tireGripLimit: 1.15,
            drivetrain: 'FR',
            gearRatios: [0, 3.483, 2.015, 1.391, 1.000, 0.762],
            finalDrive: 3.909,
            wheelCircumference: 1.98,
            gearAccelMap: [0, 6.4, 4.8, 3.5, 2.4, 1.6],
            maxRpm: 8500,
            idleRpm: 900,
            redlineRpm: 7800,
            maxSpeed: 265,
            engineSoundType: '13b',
            engineResponse: 19.5
        }
    },

    'r32': {
        id: 'r32',
        name: 'NISSAN SKYLINE GT-R V-spec II',
        shortName: 'R32 GT-R',
        modelCode: 'BNR32',
        category: 'ATTESA 4WD',
        driver: '中里毅 (妙義ナイトキッズ)',
        drivetrain: '4WD',
        engineName: 'RB26DETT 2.6L 直6ツインターボ',
        engineType: '2.6L 直列6気筒 DOHC 24バルブ ツインターボ',
        power: '380 PS / 6,800 rpm',
        torque: '45.0 kgm / 4,400 rpm',
        weight: '1,430 kg',
        desc: '【不敗神話のGT-R】電子制御トルクスプリット4WD「ATTESA E-TS」と名機RB26DETTを搭載。怒涛のトラクションでコーナー立ち上がりから無敵のロケットダッシュを見せる。',
        stats: {
            speed: 10.0,
            accel: 10.0,
            handling: 7.6,
            drift: 6.8,
            stability: 10.0
        },
        colors: [
            { name: 'ガングレーメタリック', primary: 0x3d4348, secondary: 0x1a1a1a, hood: 0x3d4348, rim: 0x8c8c8c },
            { name: 'クリスタルホワイト', primary: 0xf5f5f7, secondary: 0x1a1a1a, hood: 0xf5f5f7, rim: 0xddaa33 },
            { name: 'ブラックパールメタリック', primary: 0x121417, secondary: 0x121417, hood: 0x121417, rim: 0xbbbbbb }
        ],
        physics: {
            mass: 1430,
            weightFrontStatic: 0.57,
            wheelbase: 2.61,
            cgToFront: 1.12,
            cgToRear: 1.49,
            inertiaZ: 1950,
            corneringStiffnessFront: 47000,
            corneringStiffnessRear: 49000,
            tireGripLimit: 1.22,
            drivetrain: '4WD',
            gearRatios: [0, 3.214, 1.925, 1.302, 1.000, 0.752],
            finalDrive: 3.889,
            wheelCircumference: 1.98,
            gearAccelMap: [0, 6.8, 5.1, 3.7, 2.5, 1.7],
            maxRpm: 8500,
            idleRpm: 950,
            redlineRpm: 8000,
            maxSpeed: 280,
            engineSoundType: 'rb26',
            engineResponse: 17.5
        }
    },

    's13': {
        id: 's13',
        name: 'NISSAN SILVIA K\'s',
        shortName: 'S13 シルビア',
        modelCode: 'PS13',
        category: 'TURBO FR DRIFT',
        driver: '池谷浩一郎 (秋名スピードスターズ)',
        drivetrain: 'FR',
        engineName: 'SR20DET 2.0L 直4インタークーラーターボ',
        engineType: '2.0L 直列4気筒 DOHC ターボ',
        power: '205 PS / 6,000 rpm',
        torque: '28.0 kgm / 4,000 rpm',
        weight: '1,150 kg',
        desc: '【FRドリフトの金字塔】しなやかな足回りと軽量FRレイアウトが生む極上のコントロール性。アクセルコントロールひとつで自由自在に美しいテールスライドを描く。',
        stats: {
            speed: 8.0,
            accel: 8.1,
            handling: 8.6,
            drift: 10.0,
            stability: 7.4
        },
        colors: [
            { name: 'ライムグリーンツートン (池谷仕様)', primary: 0x88ad93, secondary: 0x3e4d46, hood: 0x88ad93, rim: 0xd4d4d4 },
            { name: 'スーパーレッド', primary: 0xb51212, secondary: 0x222222, hood: 0xb51212, rim: 0xddaa33 },
            { name: 'ウォームホワイトツートン', primary: 0xeeebe1, secondary: 0x5a544c, hood: 0xeeebe1, rim: 0xaaaaaa }
        ],
        physics: {
            mass: 1150,
            weightFrontStatic: 0.54,
            wheelbase: 2.47,
            cgToFront: 1.14,
            cgToRear: 1.33,
            inertiaZ: 1400,
            corneringStiffnessFront: 39000,
            corneringStiffnessRear: 37000,
            tireGripLimit: 1.06,
            drivetrain: 'FR',
            gearRatios: [0, 3.321, 1.902, 1.308, 1.000, 0.759],
            finalDrive: 3.900,
            wheelCircumference: 1.97,
            gearAccelMap: [0, 5.3, 3.9, 2.8, 1.9, 1.3],
            maxRpm: 7800,
            idleRpm: 850,
            redlineRpm: 7000,
            maxSpeed: 245,
            engineSoundType: 'sr20',
            engineResponse: 18.0
        }
    },

    'jzx100': {
        id: 'jzx100',
        name: 'TOYOTA CHASER Tourer V',
        shortName: 'JZX100 チェイサー',
        modelCode: 'JZX100',
        category: 'POWER FR SEDAN',
        driver: 'ストリートドリフト番長',
        drivetrain: 'FR',
        engineName: '1JZ-GTE 2.5L 直6 VVT-i ターボ',
        engineType: '2.5L 直列6気筒 DOHC シングルターボ',
        power: '310 PS / 6,200 rpm',
        torque: '38.5 kgm / 2,400 rpm',
        weight: '1,470 kg',
        desc: '【直6ハイパワー4ドアセダン】ロングホイールベースによる雄大なフルカウンタースライドと、低回転からモリモリ湧き上がる1JZターボトルク。白煙を巻き上げる大迫力ドリフトマシン。',
        stats: {
            speed: 9.4,
            accel: 9.0,
            handling: 7.7,
            drift: 9.6,
            stability: 8.6
        },
        colors: [
            { name: 'スーパーホワイトII', primary: 0xf5f5f7, secondary: 0x181818, hood: 0xf5f5f7, rim: 0xddaa33 },
            { name: 'ダークグリーンマイカ', primary: 0x122e1e, secondary: 0x111612, hood: 0x122e1e, rim: 0xd4d4d4 },
            { name: 'シルバーメタリック', primary: 0xb5b5b5, secondary: 0x1a1a1a, hood: 0x222222, rim: 0x222222 }
        ],
        physics: {
            mass: 1470,
            weightFrontStatic: 0.54,
            wheelbase: 2.73,
            cgToFront: 1.25,
            cgToRear: 1.48,
            inertiaZ: 1880,
            corneringStiffnessFront: 41000,
            corneringStiffnessRear: 39000,
            tireGripLimit: 1.10,
            drivetrain: 'FR',
            gearRatios: [0, 3.285, 1.894, 1.275, 1.000, 0.783],
            finalDrive: 3.727,
            wheelCircumference: 1.99,
            gearAccelMap: [0, 6.0, 4.5, 3.2, 2.2, 1.5],
            maxRpm: 8000,
            idleRpm: 800,
            redlineRpm: 7200,
            maxSpeed: 260,
            engineSoundType: '1jz',
            engineResponse: 16.5
        }
    },

    'ce9a': {
        id: 'ce9a',
        name: 'MITSUBISHI LANCER Evolution III GSR',
        shortName: 'エボIII (CE9A)',
        modelCode: 'CE9A',
        category: 'RALLY 4WD TURBO',
        driver: '須藤京一 (エンペラー)',
        drivetrain: '4WD',
        engineName: '4G63 2.0L 直4 DOHC インタークーラーターボ',
        engineType: '2.0L 直列4気筒 DOHC 16バルブ ターボ',
        power: '270 PS / 6,250 rpm',
        torque: '31.5 kgm / 3,000 rpm',
        weight: '1,260 kg',
        desc: '【ラリー4WDの怪物】ビスカスカップリング式フルタイム4WDと、WRC直系の4G63ターボを搭載。須藤京一が誇る「ミスファイアリングシステム（アンチラグ）」がアクセルオフ時に炸裂音と炎を連射し、コーナー立ち上がりから驚異のロケット加速を生む。',
        stats: {
            speed: 9.2,
            accel: 9.8,
            handling: 8.8,
            drift: 7.9,
            stability: 9.5
        },
        colors: [
            { name: 'ピレネーブラック (須藤京一仕様)', primary: 0x16181b, secondary: 0x111214, hood: 0x16181b, rim: 0xf5f5f7 },
            { name: 'スコーティアホワイト (WRCワークス)', primary: 0xf5f6f8, secondary: 0x181818, hood: 0xf5f6f8, rim: 0xf5f5f7 },
            { name: 'ダンデライオンイエロー', primary: 0xebbe15, secondary: 0x181818, hood: 0xebbe15, rim: 0xf5f5f7 },
            { name: 'クイーンズシルバーメタリック', primary: 0x9fa4a8, secondary: 0x1a1a1a, hood: 0x9fa4a8, rim: 0x333335 }
        ],
        physics: {
            mass: 1260,
            weightFrontStatic: 0.60,
            wheelbase: 2.51,
            cgToFront: 1.00,
            cgToRear: 1.51,
            inertiaZ: 1580,
            corneringStiffnessFront: 46000,
            corneringStiffnessRear: 44000,
            tireGripLimit: 1.18,
            drivetrain: '4WD',
            torqueSplitFront: 0.50,
            hasMisfiringSystem: true,
            gearRatios: [0, 3.090, 2.052, 1.444, 1.096, 0.825],
            finalDrive: 4.176,
            wheelCircumference: 1.97,
            gearAccelMap: [0, 6.5, 4.9, 3.5, 2.4, 1.6],
            maxRpm: 8200,
            idleRpm: 900,
            redlineRpm: 7500,
            maxSpeed: 255,
            engineSoundType: '4g63',
            engineResponse: 19.0
        }
    },

    'ek9': {
        id: 'ek9',
        name: 'HONDA CIVIC Type R',
        shortName: 'EK9 シビック Type R',
        modelCode: 'EK9',
        category: 'LIGHTWEIGHT FF VTEC',
        driver: '二宮大輝 / 舘智幸 (東堂塾)',
        drivetrain: 'FF',
        engineName: 'B16B 1.6L 直4 DOHC VTEC',
        engineType: '1.6L 直列4気筒 DOHC 16バルブ VTEC (NA)',
        power: '185 PS / 8,200 rpm',
        torque: '16.3 kgm / 7,500 rpm',
        weight: '1,050 kg',
        desc: '【NA高回転の極致】1.6Lでリッター116PSを絞り出す驚異の名機B16Bを搭載。5,800rpmでハイカムへ切り替わった瞬間に甲高く咆哮し、9,000rpmまで突き抜ける。超軽量ボディとヘリカルLSDによる前輪牽引力、アクセルオフでノーズが切れ込む「タックイン」コーナリングが真骨頂。',
        stats: {
            speed: 8.2,
            accel: 8.2,
            handling: 9.8,
            drift: 7.2,
            stability: 8.4
        },
        colors: [
            { name: 'チャンピオンシップホワイト (Type R象徴)', primary: 0xf3f2ea, secondary: 0x181818, hood: 0xf3f2ea, rim: 0xf3f2ea },
            { name: 'ボーグシルバーメタリック (東堂塾仕様)', primary: 0xa6a9ac, secondary: 0x181818, hood: 0xa6a9ac, rim: 0xf3f2ea },
            { name: 'サンライトイエロー', primary: 0xf1c618, secondary: 0x181818, hood: 0xf1c618, rim: 0x222222 },
            { name: 'スターライトブラックパール', primary: 0x141518, secondary: 0x141518, hood: 0x141518, rim: 0xf3f2ea }
        ],
        physics: {
            mass: 1050,
            weightFrontStatic: 0.62,
            wheelbase: 2.39,
            cgToFront: 0.91,
            cgToRear: 1.48,
            inertiaZ: 1300,
            corneringStiffnessFront: 42000,
            corneringStiffnessRear: 38000,
            tireGripLimit: 1.12,
            drivetrain: 'FF',
            gearRatios: [0, 3.230, 2.105, 1.458, 1.107, 0.848],
            finalDrive: 4.400,
            wheelCircumference: 1.87,
            gearAccelMap: [0, 5.2, 3.9, 2.8, 1.9, 1.3],
            maxRpm: 9500,
            idleRpm: 850,
            redlineRpm: 8400,
            maxSpeed: 238,
            engineSoundType: 'b16b',
            engineResponse: 23.0
        }
    },

    'rps13': {
        id: 'rps13',
        name: 'NISSAN 180SX TYPE X',
        shortName: '180SX TYPE X',
        modelCode: 'RPS13',
        category: 'TURBO FR DRIFT',
        driver: '健二 (秋名スピードスターズ)',
        drivetrain: 'FR',
        engineName: 'SR20DET 2.0L 直4 DOHC ターボ',
        engineType: '2.0L 直列4気筒 DOHC ターボ',
        power: '205 PS / 6,000 rpm',
        torque: '28.0 kgm / 4,000 rpm',
        weight: '1,200 kg',
        desc: '【ストリートドリフトの象徴】リトラクタブルヘッドライトと流麗なファストバックハッチバックボディを備えたFRスポーツ。SR20DETターボの鋭いレスポンスと高い回頭性、そして粘りのあるコントロール性能で、長きにわたりドリフト界を牽引する名車。',
        stats: {
            speed: 8.2,
            accel: 8.3,
            handling: 8.8,
            drift: 9.8,
            stability: 7.8
        },
        colors: [
            { name: 'ウォームホワイト (健二仕様)', primary: 0xf0efea, secondary: 0x181818, hood: 0xf0efea, rim: 0xd0d4d8 },
            { name: 'ミッドナイトパープル', primary: 0x24112e, secondary: 0x141218, hood: 0x24112e, rim: 0xddaa33 },
            { name: 'スーパーブラック', primary: 0x141517, secondary: 0x141517, hood: 0x141517, rim: 0xd4d8dc },
            { name: 'スパークシルバーメタリック', primary: 0x9ea3a8, secondary: 0x181818, hood: 0x1c1c1e, rim: 0x222222 }
        ],
        physics: {
            mass: 1200,
            weightFrontStatic: 0.53,
            wheelbase: 2.47,
            cgToFront: 1.16,
            cgToRear: 1.31,
            inertiaZ: 1420,
            corneringStiffnessFront: 40000,
            corneringStiffnessRear: 38000,
            tireGripLimit: 1.08,
            drivetrain: 'FR',
            gearRatios: [0, 3.321, 1.902, 1.308, 1.000, 0.759],
            finalDrive: 4.083,
            wheelCircumference: 1.97,
            gearAccelMap: [0, 5.3, 3.9, 2.8, 1.9, 1.3],
            maxRpm: 7800,
            idleRpm: 850,
            redlineRpm: 7000,
            maxSpeed: 248,
            engineSoundType: 'sr20',
            engineResponse: 19.0
        }
    },

    'cc72v': {
        id: 'cc72v',
        name: 'SUZUKI ALTO WORKS RS-R',
        shortName: 'アルトワークス RS-R',
        modelCode: 'CC72V',
        category: 'KEI DOKKAN TURBO 4WD',
        driver: '群馬の走り屋 (ジャイアントキラー)',
        drivetrain: '4WD',
        engineName: 'F5A 543cc 直3 DOHC 12V ターボ',
        engineType: '550cc 直列3気筒 DOHC ターボ',
        power: '64 PS / 7,500 rpm',
        torque: '7.3 kgm / 4,000 rpm',
        weight: '650 kg',
        desc: '【軽自動車64馬力自主規制の元凶】わずか650kgの超軽量ボディに550cc DOHC 12バルブ＋インタークーラーターボを搭載した過激なホットハッチ。4,500rpmから強烈に炸裂する伝説の「ドッカンターボ」とビスカス4WDのトラクションで、大排気量スポーツカーを峠の下りで手玉に取るジャイアントキラー。',
        stats: {
            speed: 6.8,
            accel: 8.6,
            handling: 9.6,
            drift: 7.2,
            stability: 8.5
        },
        colors: [
            { name: 'パルマホワイト (WORKSデカール)', primary: 0xf4f4f4, secondary: 0x222226, hood: 0xf4f4f4, rim: 0xffffff },
            { name: 'サターンブラックメタリック / ガンメタ', primary: 0x18181a, secondary: 0x3e4246, hood: 0x18181a, rim: 0xcccccc },
            { name: 'フレンチブルー / ホワイト', primary: 0x1d4d8c, secondary: 0x141416, hood: 0x1d4d8c, rim: 0xffffff },
            { name: 'スペリアホワイト / シルバー', primary: 0xf2f2f2, secondary: 0x828890, hood: 0xf2f2f2, rim: 0xdddddd }
        ],
        physics: {
            mass: 650,
            weightFrontStatic: 0.60,
            wheelbase: 2.18,
            cgToFront: 0.88,
            cgToRear: 1.30,
            inertiaZ: 720,
            corneringStiffnessFront: 32000,
            corneringStiffnessRear: 30000,
            tireGripLimit: 1.10,
            drivetrain: '4WD',
            torqueSplitFront: 0.45,
            isDokkanTurbo: true,
            gearRatios: [0, 3.818, 2.277, 1.521, 1.030, 0.783],
            finalDrive: 5.125,
            wheelCircumference: 1.60,
            gearAccelMap: [0, 4.5, 3.3, 2.3, 1.5, 1.1],
            maxRpm: 10000,
            idleRpm: 950,
            redlineRpm: 9500,
            maxSpeed: 225,
            engineSoundType: 'f5a',
            engineResponse: 26.0
        }
    },

    'jza80': {
        id: 'jza80',
        name: 'TOYOTA SUPRA RZ',
        shortName: 'スープラ RZ (JZA80)',
        modelCode: 'JZA80',
        category: 'TWIN TURBO FR MONSTER',
        driver: '皆川英雄 (チーム・スパイラル)',
        drivetrain: 'FR',
        engineName: '2JZ-GTE 3.0L 直6 DOHC ツインターボ',
        engineType: '3.0L 直列6気筒 DOHC 24バルブ ツインターボ',
        power: '280 PS / 5,600 rpm',
        torque: '46.0 kgm / 3,600 rpm',
        weight: '1,490 kg',
        desc: '【直6ツインターボの絶対王者】強靭無比な鋳鉄ブロックの「2JZ-GTE」とゲトラグ製6速MTを搭載した、日本を代表するヘビー級FRスーパースポーツ。3.0Lの大排気量から湧き出る46kgmの極太トルクとシーケンシャルツインターボの圧倒的加速力、ロングホイールベースがもたらす超高速域での圧倒的スタビリティを誇る。豪快なパワースライドと高速ドリフトの制圧力は圧巻。',
        stats: {
            speed: 9.6,
            accel: 9.3,
            handling: 8.4,
            drift: 9.2,
            stability: 9.0
        },
        colors: [
            { name: 'シルバーメタリック (199 - 代表色)', primary: 0xb4b8bc, secondary: 0x161618, hood: 0xb4b8bc, rim: 0xd0d4d8 },
            { name: 'スーパーホワイトII (040)', primary: 0xf5f5f7, secondary: 0x181818, hood: 0xf5f5f7, rim: 0xd0d4d8 },
            { name: 'スーパーレッドIV (3L2 - RZ象徴色)', primary: 0xc41212, secondary: 0x161618, hood: 0xc41212, rim: 0xd0d4d8 },
            { name: 'ブラック (202)', primary: 0x141416, secondary: 0x141416, hood: 0x141416, rim: 0xd8d8dc },
            { name: 'ロイヤルサファイアパール (8L5)', primary: 0x183884, secondary: 0x121214, hood: 0x183884, rim: 0xd0d4d8 }
        ],
        physics: {
            mass: 1490,
            weightFrontStatic: 0.53,
            wheelbase: 2.55,
            cgToFront: 1.20,
            cgToRear: 1.35,
            inertiaZ: 1750,
            corneringStiffnessFront: 46000,
            corneringStiffnessRear: 44000,
            tireGripLimit: 1.15,
            drivetrain: 'FR',
            gearRatios: [0, 3.827, 2.360, 1.685, 1.312, 1.000, 0.793],
            finalDrive: 3.266,
            wheelCircumference: 2.00,
            gearAccelMap: [0, 6.2, 4.8, 3.6, 2.7, 2.0, 1.5],
            maxRpm: 8200,
            idleRpm: 750,
            redlineRpm: 7200,
            maxSpeed: 265,
            engineSoundType: '2jz',
            engineResponse: 20.0
        }
    },

    's15': {
        id: 's15',
        name: 'NISSAN SILVIA spec-R (S15)',
        shortName: 'シルビア spec-R (S15)',
        modelCode: 'S15',
        category: 'TURBO FR DRIFT KING',
        driver: '奥山広也 (チーム・スパイラル)',
        drivetrain: 'FR',
        engineName: 'SR20DET 2.0L 直4 DOHC ターボ',
        engineType: '2.0L 直列4気筒 DOHC 16バルブ ICターボ',
        power: '250 PS / 6,400 rpm',
        torque: '28.0 kgm / 4,800 rpm',
        weight: '1,240 kg',
        desc: '【最後の純血シルビア・FRドリフトの至宝】5ナンバー枠の引き締まった軽量ボディに、ボールベアリングターボを採用した熟成のSR20DETとアイシン製6速MTを搭載。鋭く切れ込むノーズの回頭性と、俊敏なブーストレスポンスが織りなす極上のドリフトコントロール性能を誇る。',
        stats: {
            speed: 8.8,
            accel: 8.9,
            handling: 9.3,
            drift: 9.8,
            stability: 8.2
        },
        colors: [
            { name: 'スパークリングシルバーメタリック (WV2 - カタログ代表色)', primary: 0x9ca4ad, secondary: 0x141416, hood: 0x9ca4ad, rim: 0xd4d8de },
            { name: 'ブリリアントブルーチタン (BN5 - 奥山仕様)', primary: 0x143c78, secondary: 0x141416, hood: 0x143c78, rim: 0xd4d8de },
            { name: 'パールホワイト (WK0 - 定番人気色)', primary: 0xf2f4f7, secondary: 0x141416, hood: 0xf2f4f7, rim: 0xd4d8de },
            { name: 'ライトニングイエロー (EV1 - 象徴色)', primary: 0xedc010, secondary: 0x141416, hood: 0xedc010, rim: 0x222224 },
            { name: 'スーパーブラック (KH3)', primary: 0x141416, secondary: 0x141416, hood: 0x141416, rim: 0xd8d8dc },
            { name: 'スーパーレッド (526)', primary: 0xc21818, secondary: 0x141416, hood: 0xc21818, rim: 0xd4d8de }
        ],
        physics: {
            mass: 1240,
            weightFrontStatic: 0.54,
            wheelbase: 2.525,
            cgToFront: 1.16,
            cgToRear: 1.365,
            inertiaZ: 1450,
            corneringStiffnessFront: 42000,
            corneringStiffnessRear: 40000,
            tireGripLimit: 1.10,
            drivetrain: 'FR',
            gearRatios: [0, 3.626, 2.200, 1.541, 1.213, 1.000, 0.767],
            finalDrive: 3.692,
            wheelCircumference: 1.98,
            gearAccelMap: [0, 5.8, 4.3, 3.1, 2.3, 1.7, 1.2],
            maxRpm: 8000,
            idleRpm: 800,
            redlineRpm: 7200,
            maxSpeed: 255,
            engineSoundType: 'sr20',
            engineResponse: 19.0
        }
    }
};

CAR_DATABASE['180sx'] = CAR_DATABASE['rps13'];
CAR_DATABASE['altoworks'] = CAR_DATABASE['cc72v'];
CAR_DATABASE['works'] = CAR_DATABASE['cc72v'];
CAR_DATABASE['supra'] = CAR_DATABASE['jza80'];


CAR_DATABASE['silvia'] = CAR_DATABASE['s15'];
CAR_DATABASE['s15specr'] = CAR_DATABASE['s15'];
window.CAR_DATABASE = CAR_DATABASE;
