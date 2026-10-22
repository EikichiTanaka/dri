/**
 * CarModelBuilder.js - 全5車種（AE86, FD3S, R32, S13, JZX100）の超高精度3Dプロシージャルモデルビルダー
 * 各車の実車ディテール、アイコニックなシルエット、ランプ造形、カスタムホイール、ブレーキ、マフラー、デカールを極限まで忠実に再現
 */

class CarModelBuilder {
    /**
     * 車種IDとカラー設定から3Dモデル一式を構築して返却
     * @param {string} carId - 'ae86', 'fd3s', 'r32', 's13', 'jzx100'
     * @param {object} colorDef - { primary, secondary, hood, rim }
     * @returns {object} モデル制御オブジェクト
     */
    static build(carId, colorDef = null) {
        const carData = (window.CAR_DATABASE && window.CAR_DATABASE[carId]) || (window.CAR_DATABASE && window.CAR_DATABASE['ae86']) || {};
        const colors = colorDef || (carData.colors ? carData.colors[0] : { primary: 0xf5f5f7, secondary: 0x181818, hood: 0x242426, rim: 0x3a3025 });

        switch (carId) {
            case 'fd3s':
                return this.buildFD3S(colors);
            case 'r32':
                return this.buildR32(colors);
            case 's13':
                return this.buildS13(colors);
            case 'jzx100':
                return this.buildJZX100(colors);
            case 'ce9a':
                return this.buildCE9A(colors);
            case 'ek9':
                return this.buildEK9(colors);
            case 'rps13':
            case '180sx':
                return this.build180SX(colors);
            case 'cc72v':
            case 'altoworks':
            case 'works':
                return this.buildAltoWorks(colors);
            case 'jza80':
            case 'supra':
                return this.buildJZA80(colors);
            case 's15':
            case 'silvia':
            case 's15specr':
                return this.buildS15(colors);
            case 'ae86':
            default:
                return this.buildAE86(colors);
        }
    }

    // =========================================================================
    // 1. TOYOTA SPRINTER TRUENO GT-APEX (AE86)
    // =========================================================================
    static buildAE86(col) {
        const group = new THREE.Group();

        // -------------------------------------------------------------------------
        // マテリアル定義
        // -------------------------------------------------------------------------
        const primaryMat = new THREE.MeshStandardMaterial({ 
            color: (col && col.primary) || 0xf6f6f8, 
            roughness: 0.20, 
            metalness: 0.12 
        });
        const secondaryMat = new THREE.MeshStandardMaterial({ 
            color: (col && col.secondary) || 0x161618, 
            roughness: 0.42, 
            metalness: 0.15 
        });
        const hoodMat = new THREE.MeshStandardMaterial({ 
            color: (col && col.hood) || 0x222225, 
            roughness: 0.28, 
            metalness: 0.16 
        });
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x0a141e, 
            roughness: 0.04, 
            metalness: 0.92, 
            transparent: true, 
            opacity: 0.88 
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({ 
            color: 0x141416, 
            roughness: 0.58, 
            metalness: 0.10 
        });
        const interiorMat = new THREE.MeshStandardMaterial({ 
            color: 0x18181c, 
            roughness: 0.88 
        });
        const chromeMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            roughness: 0.08, 
            metalness: 0.95 
        });
        const meshDarkMat = new THREE.MeshBasicMaterial({ color: 0x0c0c0e });

        // RSワタナベ用マテリアル（定番マグ・ガンメタリック調＋切削ポリッシュシルバー深リム）
        const watanabeSpokeMat = new THREE.MeshStandardMaterial({ 
            color: 0x7c7264, 
            roughness: 0.28, 
            metalness: 0.58 
        });
        const polishedLipMat = new THREE.MeshStandardMaterial({ 
            color: 0xf4f6fa, 
            roughness: 0.08, 
            metalness: 0.70 
        });
        const tireMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1c, 
            roughness: 0.92 
        });

        // 灯火類マテリアル
        const amberLightMat = new THREE.MeshBasicMaterial({ color: 0xff7700 });
        const amberLensMat = new THREE.MeshStandardMaterial({
            color: 0xff7700,
            roughness: 0.15,
            metalness: 0.15,
            transparent: true,
            opacity: 0.85
        });
        const yellowFogMat = new THREE.MeshStandardMaterial({ 
            color: 0xffbb00,
            roughness: 0.12,
            metalness: 0.20,
            emissive: 0x553800,
            emissiveIntensity: 0.4
        });
        const clearLensMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            roughness: 0.08, 
            metalness: 0.12, 
            transparent: true, 
            opacity: 0.50 
        });
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xbb0808 });

        // =========================================================================
        // 1. メインボディ造形（シャープなウェッジシェイプ・パンダツートン＆立体フェンダー）
        // =========================================================================
        // 1.1 ロアアンダーボディ（ブラック：フロアベース）
        const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.18, 3.88), secondaryMat);
        lowerBody.position.set(0, 0.23, 0);
        lowerBody.castShadow = true;
        group.add(lowerBody);

        // 1.2 ドア部ウエスト＆ブラックサイドステップ
        for (let s of [-1, 1]) {
            const doorLower = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 1.36), secondaryMat);
            doorLower.position.set(s * 0.785, 0.26, 0.02);
            group.add(doorLower);

            const sideStep = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.44), secondaryMat);
            sideStep.position.set(s * 0.80, 0.17, 0.02);
            group.add(sideStep);

            const doorUpper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.28, 1.36), primaryMat);
            doorUpper.position.set(s * 0.785, 0.48, 0.02);
            doorUpper.castShadow = true;
            group.add(doorUpper);

            // サイドモールディング（前後ホイール開口部に干渉しないドア部のみ配置）
            const sideMolding = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.038, 1.48), blackTrimMat);
            sideMolding.position.set(s * 0.812, 0.44, -0.05);
            group.add(sideMolding);

            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.032, 0.09), blackTrimMat);
            handle.position.set(s * 0.818, 0.58, -0.28);
            group.add(handle);
        }

                // 1.3 フロントフェンダー＆ホイールアーチ（開口部を確保し車輪への干渉・埋没を完全解消）
        for (let s of [-1, 1]) {
            // フロントフェンダー上部アーチフレア（車輪上部y=0.58）
            const fArchLip = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.05, 0.66), primaryMat);
            fArchLip.position.set(s * 0.815, 0.645, 1.20);
            group.add(fArchLip);

            // 車輪前方フェンダー
            const fFenderFront = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.38), primaryMat);
            fFenderFront.position.set(s * 0.76, 0.44, 1.68);
            group.add(fFenderFront);

            const fFenderLowerFront = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.38), secondaryMat);
            fFenderLowerFront.position.set(s * 0.76, 0.26, 1.68);
            group.add(fFenderLowerFront);

            // 車輪後方フェンダー
            const fFenderRear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.28), primaryMat);
            fFenderRear.position.set(s * 0.76, 0.44, 0.74);
            group.add(fFenderRear);

            const fFenderLowerRear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.28), secondaryMat);
            fFenderLowerRear.position.set(s * 0.76, 0.26, 0.74);
            group.add(fFenderLowerRear);
        }

        // 1.4 リアフェンダー＆リアホイールアーチ（開口部を確保し車輪への干渉・埋没を完全解消）
        for (let s of [-1, 1]) {
            // リアフェンダー上部アーチフレア（車輪上部y=0.58）
            const rArchLip = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.05, 0.66), primaryMat);
            rArchLip.position.set(s * 0.815, 0.645, -1.20);
            group.add(rArchLip);

            // 車輪前方リアフェンダー
            const rFenderFront = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.28), primaryMat);
            rFenderFront.position.set(s * 0.76, 0.44, -0.74);
            group.add(rFenderFront);

            const rFenderLowerFront = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.28), secondaryMat);
            rFenderLowerFront.position.set(s * 0.76, 0.26, -0.74);
            group.add(rFenderLowerFront);

            // 車輪後方リアフェンダー
            const rFenderRear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.38), primaryMat);
            rFenderRear.position.set(s * 0.76, 0.44, -1.66);
            group.add(rFenderRear);

            const rFenderLowerRear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.38), secondaryMat);
            rFenderLowerRear.position.set(s * 0.76, 0.26, -1.66);
            group.add(rFenderLowerRear);

const rShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 1.40), primaryMat);
            rShoulder.position.set(s * 0.74, 0.69, -1.16);
            group.add(rShoulder);

            // クォーターベント（黒いエアルーバーバッジ）
            const qVent = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.065, 0.13), blackTrimMat);
            qVent.position.set(s * 0.812, 0.74, -0.72);
            qVent.rotation.x = -0.227;
            group.add(qVent);
        }

        // 車体センターコア
        const bodyCore = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.30, 3.82), primaryMat);
        bodyCore.position.set(0, 0.47, 0);
        group.add(bodyCore);

        // =========================================================================
        // 2. スラントノーズ・リトラクタブル＆前期型GT-APEXフロントマスク
        // =========================================================================
        const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.04, 0.14), blackTrimMat);
        cowl.position.set(0, 0.66, 0.54);
        group.add(cowl);

        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.035, 1.22), hoodMat);
        hood.position.set(0, 0.635, 1.15);
        hood.rotation.x = 0.075;
        group.add(hood);

        const noseFront = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.13, 0.34), primaryMat);
        noseFront.position.set(0, 0.54, 1.80);
        group.add(noseFront);

        const popups = [];
        const headlightMats = [];

        // 2.3 ★AE86 リトラクタブルヘッドライトユニット（後端ヒンジ回転ピボット機構）
        for (let s of [-1, 1]) {
            const pivotGroup = new THREE.Group();
            // 後端ヒンジ位置
            pivotGroup.position.set(s * 0.48, 0.635, 1.45);

            const unit = new THREE.Group();
            pivotGroup.add(unit);

            // 1. トップリッドパネル（塗装色）
            const lid = new THREE.Mesh(new THREE.BoxGeometry(0.355, 0.024, 0.34), primaryMat);
            lid.position.set(0, -0.012, 0.17);
            unit.add(lid);

            // リッド前縁ブラックモール
            const seamF = new THREE.Mesh(new THREE.BoxGeometry(0.358, 0.026, 0.012), blackTrimMat);
            seamF.position.set(0, -0.012, 0.34);
            unit.add(seamF);

            // 2. ブラックハウジングバケット（ポップアップ時に現れる側壁・底面）
            const housing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.13, 0.32), blackTrimMat);
            housing.position.set(0, -0.08, 0.16);
            unit.add(housing);

            // 3. クロームベゼル（小糸製角型シールドビーム枠）
            const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.105, 0.02), chromeMat);
            bezel.position.set(0, -0.07, 0.325);
            unit.add(bezel);

            // 4. 高輝度角型ヘッドライト発光レンズ（実車風クリスタルリフレクター）
            const lensMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xfff8de,
                emissiveIntensity: 2.5,
                roughness: 0.10,
                metalness: 0.15
            });
            headlightMats.push(lensMat);

            const lens = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.085, 0.015), lensMat);
            lens.position.set(0, -0.07, 0.335);
            unit.add(lens);

            // 初期角度：夜間デフォルト展開（オープン: -0.28 rad）
            // 格納時は 0.075 rad（フード傾斜と完全ツライチ）
            unit.rotation.x = -0.28;

            group.add(pivotGroup);

            popups.push({
                pivotGroup: pivotGroup,
                unit: unit,
                closedAngle: 0.075,
                openAngle: -0.28,
                posYOpen: 0.72,
                posYClosed: 0.58
            });
        }

        for (let s of [-1, 1]) {
            const cornerReflect = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.085, 0.22), chromeMat);
            cornerReflect.position.set(s * 0.77, 0.525, 1.82);
            group.add(cornerReflect);

            const cornerLamp = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.088, 0.225), amberLensMat);
            cornerLamp.position.set(s * 0.775, 0.525, 1.82);
            group.add(cornerLamp);
        }

        const grill = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.04), blackTrimMat);
        grill.position.set(0, 0.51, 1.97);
        group.add(grill);

        const badge = new THREE.Mesh(
            new THREE.PlaneGeometry(0.13, 0.032),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        badge.position.set(0, 0.51, 1.992);
        group.add(badge);

        const fBumper = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.18, 0.24), secondaryMat);
        fBumper.position.set(0, 0.34, 1.85);
        group.add(fBumper);

        for (let s of [-1, 1]) {
            const bCorner = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.18), secondaryMat);
            bCorner.position.set(s * 0.78, 0.34, 1.79);
            bCorner.rotation.y = s * -0.30;
            group.add(bCorner);
        }

        const fLip = new THREE.Mesh(new THREE.BoxGeometry(1.63, 0.04, 0.18), blackTrimMat);
        fLip.position.set(0, 0.23, 1.85);
        group.add(fLip);

        const fIntake = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.04), meshDarkMat);
        fIntake.position.set(0, 0.28, 1.95);
        group.add(fIntake);

        for (let s of [-1, 1]) {
            const fogHousing = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.075, 0.04), blackTrimMat);
            fogHousing.position.set(s * 0.34, 0.34, 1.95);
            group.add(fogHousing);

            const fogReflect = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.060, 0.02), chromeMat);
            fogReflect.position.set(s * 0.34, 0.34, 1.96);
            group.add(fogReflect);

            const fog = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.055, 0.015), yellowFogMat);
            fog.position.set(s * 0.34, 0.34, 1.968);
            group.add(fog);

            const fogLens = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.065, 0.01), clearLensMat);
            fogLens.position.set(s * 0.34, 0.34, 1.975);
            group.add(fogLens);

            const blinker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.065, 0.04), amberLightMat);
            blinker.position.set(s * 0.65, 0.34, 1.965);
            group.add(blinker);
        }

        // =========================================================================
        // 3. 隙間ゼロ・超高精度3ドアハッチバックキャビン（完全シームレス接合）
        // =========================================================================
        const interiorCore = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.32, 1.48), interiorMat);
        interiorCore.position.set(0, 0.68, -0.25);
        group.add(interiorCore);

        // リアパーセルシェルフ（トノデッキフロア：ハッチ下の空洞化を完全解消）
        const parcelShelf = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.04, 1.10), interiorMat);
        parcelShelf.position.set(0, 0.68, -1.25);
        group.add(parcelShelf);

        for (let s of [-1, 1]) {
            const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.10), blackTrimMat);
            headrest.position.set(s * 0.30, 0.86, -0.22);
            group.add(headrest);
        }

        const steering = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16),
            blackTrimMat
        );
        steering.rotation.x = 0.52;
        steering.position.set(0.30, 0.77, 0.24);
        group.add(steering);

        const rViewMirror = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.032, 0.035), blackTrimMat);
        rViewMirror.position.set(0, 0.95, 0.30);
        group.add(rViewMirror);

        // 3.2 ルーフパネル（幅1.20m、z=0.24 から z=-0.52 まで長さ0.76m、全高y=0.995m）
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.030, 0.76), primaryMat);
        roof.position.set(0, 0.995, -0.14);
        group.add(roof);

        const fRoofMould = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.020, 0.04), blackTrimMat);
        fRoofMould.position.set(0, 0.995, 0.23);
        group.add(fRoofMould);

        const rRoofMould = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.020, 0.04), blackTrimMat);
        rRoofMould.position.set(0, 0.995, -0.51);
        group.add(rRoofMould);

        for (let s of [-1, 1]) {
            const dripRail = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.018, 0.76), blackTrimMat);
            dripRail.position.set(s * 0.605, 1.00, -0.14);
            group.add(dripRail);
        }

        // 3.3 スラント・フロントウインドウ＆スリムAピラー
        const fWindSlope = -0.64;
        const fWind = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.44, 0.032), glassMat);
        fWind.position.set(0, 0.835, 0.39);
        fWind.rotation.x = fWindSlope;
        group.add(fWind);

        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.42, 0.032), primaryMat);
            aPillar.position.set(s * 0.602, 0.835, 0.39);
            aPillar.rotation.x = fWindSlope;
            group.add(aPillar);

            const aSash = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.42, 0.035), blackTrimMat);
            aSash.position.set(s * 0.582, 0.835, 0.39);
            aSash.rotation.x = fWindSlope;
            group.add(aSash);
        }

        // 3.4 ★シームレス・ファストバック・リアハッチガラス ＆ 美しいCピラー
        // ルーフ後端(z=-0.52, y=0.995) から リアダックテール(z=-1.84, y=0.69) へ直結
        const hatchSlope = -0.227;
        const hatchLen = 1.36;
        const rHatch = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.028, hatchLen), glassMat);
        rHatch.position.set(0, 0.842, -1.18);
        rHatch.rotation.x = hatchSlope;
        group.add(rHatch);

        for (let s of [-1, 1]) {
            const hatchFrame = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.034, hatchLen), blackTrimMat);
            hatchFrame.position.set(s * 0.585, 0.845, -1.18);
            hatchFrame.rotation.x = hatchSlope;
            group.add(hatchFrame);
        }

        // ★Cピラー（ルーフ幅内に収まり、ルーフ後端・リアフェンダー天面とツライチ結合）
        for (let s of [-1, 1]) {
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.70), primaryMat);
            cPillar.position.set(s * 0.645, 0.78, -0.84);
            cPillar.rotation.x = hatchSlope;
            group.add(cPillar);

            // クォーターウィンドウ後端サッシュ（黒い垂直フレーム）
            const qRearSash = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.32, 0.035), blackTrimMat);
            qRearSash.position.set(s * 0.615, 0.825, -0.515);
            group.add(qRearSash);
        }

        // 3.5 サイドウィンドウ（ドアガラス＋Bピラー＋クォーター三角窓）
        for (let s of [-1, 1]) {
            const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.29, 0.44), glassMat);
            doorGlass.position.set(s * 0.615, 0.825, 0.02);
            group.add(doorGlass);

            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.30, 0.040), blackTrimMat);
            bPillar.position.set(s * 0.620, 0.825, -0.21);
            group.add(bPillar);

            const qGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.26), glassMat);
            qGlass.position.set(s * 0.615, 0.825, -0.37);
            group.add(qGlass);

            const beltMould = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.020, 1.10), blackTrimMat);
            beltMould.position.set(s * 0.625, 0.68, -0.15);
            group.add(beltMould);
        }

        // =========================================================================
        // 4. 「藤原とうふ店（自家用）」右ドアデカール
        // =========================================================================
        const tofuDecalMat = new THREE.MeshBasicMaterial({
            map: this.createTofuTexture(),
            transparent: true,
            depthWrite: false
        });
        const tofuDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.16), tofuDecalMat);
        tofuDecal.position.set(0.817, 0.54, 0.08);
        tofuDecal.rotation.y = Math.PI / 2;
        group.add(tofuDecal);

        // =========================================================================
        // 5. リアコンビランプ ＆ 純正ダックテールスポイラー ＆ ナンバープレート
        // =========================================================================
        const ae86TailTex = this.createAE86TailTexture();
        const tailTexMat = new THREE.MeshStandardMaterial({ 
            map: ae86TailTex, 
            roughness: 0.15, 
            metalness: 0.08 
        });
        const tail = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.16, 0.04), tailTexMat);
        tail.position.set(0, 0.57, -1.97);
        group.add(tail);

        const rSpoiler = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.055, 0.18), blackTrimMat);
        rSpoiler.position.set(0, 0.69, -1.88);
        group.add(rSpoiler);

        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.20, 0.26), secondaryMat);
        rBumper.position.set(0, 0.33, -1.98);
        group.add(rBumper);

        const plateRecess = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.20, 0.04), meshDarkMat);
        plateRecess.position.set(0, 0.33, -2.10);
        group.add(plateRecess);

        this.addSideMirrors(group, 0.74, 0.70, 0.46, blackTrimMat);
        this.addLicensePlates(group, '群馬 55 お 13-954', 2.145, -2.125, 0.30);

        // =========================================================================
        // 6. ★本物志向：RSワタナベ 8スポーク深リムホイール
        // =========================================================================
        const wheelPositions = [
            { x: -0.70, y: 0.305, z: 1.20, isFront: true, isLeft: true },
            { x: 0.70, y: 0.305, z: 1.20, isFront: true, isLeft: false },
            { x: -0.70, y: 0.305, z: -1.20, isFront: false, isLeft: true },
            { x: 0.70, y: 0.305, z: -1.20, isFront: false, isLeft: false }
        ];

        // RSワタナベ エイトスポーク F8-Type (ガンメタサテン・陰影際立つPBR質感)
        const watanabeRimMat = new THREE.MeshStandardMaterial({
            color: 0x484642,
            roughness: 0.28,
            metalness: 0.48
        });

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            watanabeRimMat,
            tireMat,
            'watanabe',
            0.305,
            0.20,
            0x333338
        );

        // 砲弾スポーツマフラー
        this.createDetailedExhaust(group, 0.50, 0.18, -1.80, 0.53, 0.17, -2.04, 0.065, 0.045, 0xcccccc);
        const exhaustPos = new THREE.Vector3(0.54, 0.18, -2.15);

        // ライティング
        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.58, -2.15);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.48, 0.72, 1.85);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat: watanabeSpokeMat },
            tailLPos: new THREE.Vector3(-0.62, 0.58, -1.98),
            tailRPos: new THREE.Vector3(0.62, 0.58, -1.98),
            rearWheelLPos: new THREE.Vector3(-0.79, 0.1, -1.20),
            rearWheelRPos: new THREE.Vector3(0.79, 0.1, -1.20),
            popups: popups,
            headlightMats: headlightMats,
            headlights: headlights
        };
    }

    // =========================================================================
    // 2. MAZDA RX-7 Type R (FD3S)
    // =========================================================================
    static buildFD3S(col) {
        const group = new THREE.Group();

        // マテリアル定義（マツダ・コンペティションイエローマイカ＆リアルディテール）
        const yellowBodyMat = new THREE.MeshStandardMaterial({
            color: col.primary || 0xffcc00,
            roughness: 0.16,
            metalness: 0.22
        });
        const yellowHoodMat = new THREE.MeshStandardMaterial({
            color: col.hood || 0xffcc00,
            roughness: 0.18,
            metalness: 0.22
        });
        const secondaryMat = new THREE.MeshStandardMaterial({
            color: col.secondary || 0x161618,
            roughness: 0.45,
            metalness: 0.15
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x08101a,
            roughness: 0.03,
            metalness: 0.95,
            transparent: true,
            opacity: 0.88
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({
            color: 0x121214,
            roughness: 0.55,
            metalness: 0.12
        });
        const carbonMat = new THREE.MeshStandardMaterial({
            color: 0x18181c,
            roughness: 0.35,
            metalness: 0.35
        });
        const meshDarkMat = new THREE.MeshBasicMaterial({ color: 0x080808 });
        const intercoolerMat = new THREE.MeshStandardMaterial({
            color: 0xb8c2cc,
            roughness: 0.20,
            metalness: 0.88
        });
        const clearLensMat = new THREE.MeshStandardMaterial({
            color: 0xf5f8fa,
            roughness: 0.08,
            metalness: 0.25,
            transparent: true,
            opacity: 0.80
        });
        const amberLensMat = new THREE.MeshStandardMaterial({
            color: 0xff8800,
            emissive: 0xaa4400,
            emissiveIntensity: 0.4,
            roughness: 0.15,
            metalness: 0.10
        });
        const tailLightMat = new THREE.MeshStandardMaterial({
            color: 0xee1111,
            emissive: 0x880808,
            emissiveIntensity: 0.5,
            roughness: 0.15,
            metalness: 0.10
        });
        const tailSmokeMat = new THREE.MeshStandardMaterial({
            color: 0x280e0e,
            roughness: 0.06,
            metalness: 0.08,
            transparent: true,
            opacity: 0.45
        });
        const reverseLensMat = new THREE.MeshStandardMaterial({
            color: 0xf4f8ff,
            emissive: 0x8899aa,
            emissiveIntensity: 0.3,
            roughness: 0.12,
            metalness: 0.20
        });

        // Mazdaspeed MS-01 / 深リムゴールドホイール用マテリアル
        const goldSpokeMat = new THREE.MeshStandardMaterial({
            color: col.rim || 0xd8a024,
            roughness: 0.22,
            metalness: 0.58
        });
        const polishedLipMat = new THREE.MeshStandardMaterial({
            color: 0xf4f7fa,
            roughness: 0.12,
            metalness: 0.50
        });
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.06,
            metalness: 0.95
        });
        const rotorMat = new THREE.MeshStandardMaterial({
            color: 0x98989c,
            roughness: 0.22,
            metalness: 0.88
        });
        const caliperMat = new THREE.MeshStandardMaterial({
            color: 0xcc1111,
            roughness: 0.30,
            metalness: 0.65
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x1c1c1e,
            roughness: 0.92
        });

        // =========================================================================
        // 1. コークボトル・有機的流線型メインボディ
        // =========================================================================
        // 1.1 ロアボディフロア（ホイールベース2.42m対応）
        const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.22, 4.14), yellowBodyMat);
        lowerBody.position.set(0, 0.26, 0);
        lowerBody.castShadow = true;
        group.add(lowerBody);

        // 1.2 ドア部くびれ＆サイドスカート（幅1.70m、有機的なウエストライン）
        for (let s of [-1, 1]) {
            // ドアパネル本体（くびれたウエスト）
            const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 1.24), yellowBodyMat);
            doorPanel.position.set(s * 0.81, 0.47, 0.02);
            group.add(doorPanel);

            // サイドステップ（下部のエアロスカート）
            const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 1.38), secondaryMat);
            sideSkirt.position.set(s * 0.825, 0.18, 0.02);
            group.add(sideSkirt);

            // リアフェンダー直前のサイドエアロフィン
            const sideFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.20, 0.24), yellowBodyMat);
            sideFin.position.set(s * 0.84, 0.32, -0.62);
            group.add(sideFin);
        }

                // 1.3 フロントマッスルフェンダー（ホイール開口部を確保し車輪への干渉・埋没を完全解消）
        for (let s of [-1, 1]) {
            // フェンダーアーチフレア（前輪上部y=0.63の力強い膨らみ）
            const fArchLip = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.05, 0.68), yellowBodyMat);
            fArchLip.position.set(s * 0.855, 0.66, 1.25);
            group.add(fArchLip);

            // 車輪前方フェンダー
            const fFenderFront = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.36), yellowBodyMat);
            fFenderFront.position.set(s * 0.78, 0.46, 1.74);
            group.add(fFenderFront);

            // 車輪後方フェンダー
            const fFenderRear = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.28), yellowBodyMat);
            fFenderRear.position.set(s * 0.78, 0.46, 0.76);
            group.add(fFenderRear);

            // フロントフェンダーノーズテーパー
            const fNoseFender = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.24, 0.40), yellowBodyMat);
            fNoseFender.position.set(s * 0.77, 0.43, 1.93);
            fNoseFender.rotation.x = 0.16;
            group.add(fNoseFender);

            // フロントフェンダー後部アウトレットダクト（FD3Sの象徴的エアスリット）
            const fVentRecess = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.20, 0.14), meshDarkMat);
            fVentRecess.position.set(s * 0.855, 0.47, 0.63);
            group.add(fVentRecess);

            const fVentFin = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.025, 0.14), yellowBodyMat);
            fVentFin.position.set(s * 0.865, 0.47, 0.63);
            group.add(fVentFin);
        }

        // 1.4 リアマッスルワイドフェンダー（リアホイール開口部を確保し車輪への干渉・埋没を完全解消）
        for (let s of [-1, 1]) {
            // リアアーチ上部フレア（車輪上部y=0.64）
            const rFlare = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.05, 0.70), yellowBodyMat);
            rFlare.position.set(s * 0.865, 0.665, -1.25);
            group.add(rFlare);

            // 車輪前方リアフェンダー
            const rHipFront = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.34, 0.28), yellowBodyMat);
            rHipFront.position.set(s * 0.80, 0.47, -0.76);
            group.add(rHipFront);

            // 車輪後方リアフェンダー
            const rHipRear = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.34, 0.38), yellowBodyMat);
            rHipRear.position.set(s * 0.80, 0.47, -1.72);
            group.add(rHipRear);

            // リアショルダー（上面）
const rShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.08, 1.34), yellowBodyMat);
            rShoulder.position.set(s * 0.74, 0.69, -1.18);
            group.add(rShoulder);
        }

        // =========================================================================
        // 2. ロータリー超低ノーズ＆フロントバンパー
        // =========================================================================
        // 2.1 カウル＆ワイパードレイ
        const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.06, 0.18), blackTrimMat);
        cowl.position.set(0, 0.66, 0.58);
        group.add(cowl);

        // 2.2 スラントボンネット（13Bロータリーならではの超低重心・前下がりウェッジ）
        const hoodGeom = new THREE.BoxGeometry(1.52, 0.035, 1.28);
        const hood = new THREE.Mesh(hoodGeom, yellowHoodMat);
        hood.position.set(0, 0.61, 1.20);
        hood.rotation.x = 0.115;
        group.add(hood);

        // ボンネットセンタープレスライン（中央が低く引き締まる）
        const hoodCenter = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.02, 1.24), yellowHoodMat);
        hoodCenter.position.set(0, 0.60, 1.20);
        hoodCenter.rotation.x = 0.115;
        group.add(hoodCenter);

        // ノーズ先端部（丸みを帯びて前下がりにスラントするノーズコーン）
        const noseCone = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.16, 0.40), yellowBodyMat);
        noseCone.position.set(0, 0.45, 1.93);
        noseCone.rotation.x = 0.16;
        group.add(noseCone);

        // ★マツダ・ロータリー形状（おにぎり型）エンブレム
        const rotaryBadge = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.025, 0.008, 3),
            chromeMat
        );
        rotaryBadge.position.set(0, 0.47, 2.135);
        rotaryBadge.rotation.x = Math.PI / 2;
        rotaryBadge.rotation.y = Math.PI;
        group.add(rotaryBadge);

        const popups = [];
        const headlightMats = [];

        // 2.3 ★FD3S リトラクタブルヘッドライトユニット（後端ヒンジ回転ピボット機構）
        for (let s of [-1, 1]) {
            const pivotGroup = new THREE.Group();
            // 後端ヒンジ位置
            pivotGroup.position.set(s * 0.49, 0.585, 1.45);

            const unit = new THREE.Group();
            pivotGroup.add(unit);

            // 1. 流線型トップリッドパネル（ツライチ塗装面）
            const lid = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.024, 0.35), yellowBodyMat);
            lid.position.set(0, -0.012, 0.175);
            unit.add(lid);

            // リッド前縁ブラックモール
            const seamF = new THREE.Mesh(new THREE.BoxGeometry(0.352, 0.026, 0.012), blackTrimMat);
            seamF.position.set(0, -0.012, 0.35);
            unit.add(seamF);

            // 2. ブラックハウジングバケット（開時に現れる流線型黒ハウジング）
            const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.33), blackTrimMat);
            housing.position.set(0, -0.075, 0.165);
            unit.add(housing);

            // 3. クロームリフレクターベゼル
            const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.095, 0.02), chromeMat);
            bezel.position.set(0, -0.065, 0.33);
            unit.add(bezel);

            // 4. 高輝度プロジェクター内蔵ヘッドライトレンズ
            const lensMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xfff8de,
                emissiveIntensity: 2.5,
                roughness: 0.08,
                metalness: 0.15
            });
            headlightMats.push(lensMat);

            const lens = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.078, 0.015), lensMat);
            lens.position.set(0, -0.065, 0.34);
            unit.add(lens);

            // 初期角度：夜間デフォルト展開（オープン: -0.25 rad）
            // 格納時は 0.115 rad（フード傾斜と完全ツライチ）
            unit.rotation.x = -0.25;

            group.add(pivotGroup);

            // ウォッシャーノズル（ボンネット固定）
            const washer = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.025), blackTrimMat);
            washer.position.set(s * 0.36, 0.61, 1.76);
            group.add(washer);

            popups.push({
                pivotGroup: pivotGroup,
                unit: unit,
                closedAngle: 0.115,
                openAngle: -0.25,
                posYOpen: 0.68,
                posYClosed: 0.54
            });
        }

        // 2.4 フロントバンパー開口部＆冷却コア（実車FD3Sの「微笑み型」大型エアダム）
        // センター大口径オーバルラジエーター開口部
        const centerDam = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.18, 0.06), meshDarkMat);
        centerDam.position.set(0, 0.28, 2.07);
        group.add(centerDam);

        // 前置きアルミインタークーラーコア（冷却フィン）
        const icCore = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.14, 0.03), intercoolerMat);
        icCore.position.set(0, 0.28, 2.065);
        group.add(icCore);

        // インタークーラーパイピング
        for (let s of [-1, 1]) {
            const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.03), intercoolerMat);
            pipe.position.set(s * 0.41, 0.28, 2.07);
            group.add(pipe);
        }

        // 左右ツインオイルクーラーダクト
        for (let s of [-1, 1]) {
            const oilDam = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.13, 0.05), meshDarkMat);
            oilDam.position.set(s * 0.62, 0.27, 2.06);
            group.add(oilDam);

            const oilCore = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.02), intercoolerMat);
            oilCore.position.set(s * 0.62, 0.27, 2.05);
            group.add(oilCore);
        }

        // 2.5 フロントコンビネーションランプ（実車FD3Sのクリアポジション＋アンバーウインカー）
        for (let s of [-1, 1]) {
            const posLight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.055, 0.03), clearLensMat);
            posLight.position.set(s * 0.44, 0.41, 2.10);
            group.add(posLight);

            const turnLight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.03), amberLensMat);
            turnLight.position.set(s * 0.62, 0.41, 2.09);
            group.add(turnLight);
        }

        // 2.6 フロントリップスプリッター（実車RX-7の流麗なラウンドアンダースポイラー）
        const fLip = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.04, 0.20), carbonMat);
        fLip.position.set(0, 0.16, 2.01);
        group.add(fLip);

        for (let s of [-1, 1]) {
            const fLipCorner = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.20), carbonMat);
            fLipCorner.position.set(s * 0.76, 0.16, 1.96);
            fLipCorner.rotation.y = s * -0.28;
            group.add(fLipCorner);
        }

        // =========================================================================
        // 3. ティアドロップ・キャノピー＆流麗ファストバック（完全脱・箱型）
        // =========================================================================
        // 3.1 ダブルバブルルーフ
        const roofBase = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.03, 0.72), yellowBodyMat);
        roofBase.position.set(0, 0.955, -0.05);
        group.add(roofBase);

        // ダブルバブル膨らみ
        for (let s of [-1, 1]) {
            const bubble = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.02, 0.68), yellowBodyMat);
            bubble.position.set(s * 0.32, 0.97, -0.05);
            group.add(bubble);
        }

        // 3.2 フロントウインドウ（約62度の鋭角スラントガラス＆Aピラー）
        const fWindSlope = -0.66;
        const fWind = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.46, 0.035), glassMat);
        fWind.position.set(0, 0.80, 0.50);
        fWind.rotation.x = fWindSlope;
        group.add(fWind);

        // スリムAピラー
        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.04), yellowBodyMat);
            aPillar.position.set(s * 0.62, 0.80, 0.50);
            aPillar.rotation.x = fWindSlope;
            group.add(aPillar);
        }

        // 3.3 ★ファストバック・リアハッチガラス（ルーフからリアデッキへ直結）
        const rHatchSlope = -0.228;
        const rHatch = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.035, 1.42), glassMat);
        rHatch.position.set(0, 0.78, -1.11);
        rHatch.rotation.x = rHatchSlope;
        group.add(rHatch);

        // リアハッチサイドサッシュ（ブラックフレーム）
        for (let s of [-1, 1]) {
            const hatchSash = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.04, 1.42), blackTrimMat);
            hatchSash.position.set(s * 0.59, 0.785, -1.11);
            hatchSash.rotation.x = rHatchSlope;
            group.add(hatchSash);
        }

        // ★Cピラー（ルーフ後端y=0.955に隙間なくシームレスに直結する美しいピラー）
        for (let s of [-1, 1]) {
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.84), yellowBodyMat);
            cPillar.position.set(s * 0.63, 0.84, -0.80);
            cPillar.rotation.x = rHatchSlope;
            group.add(cPillar);
        }

        // 3.4 ティアドロップ・サイドウィンドウ（サイドガラス＋サッシュ）
        for (let s of [-1, 1]) {
            // ドアガラス
            const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.72), glassMat);
            sideGlass.position.set(s * 0.62, 0.78, 0.04);
            group.add(sideGlass);

            // Bピラー（ブラックサッシュ）
            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.05), blackTrimMat);
            bPillar.position.set(s * 0.63, 0.78, -0.32);
            group.add(bPillar);

            // ★実車FD3Sの象徴「Bピラー内蔵ドアハンドル」
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.08, 0.035), blackTrimMat);
            handle.position.set(s * 0.64, 0.76, -0.32);
            group.add(handle);

            // クォーター三角窓ガラス
            const qGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.24), glassMat);
            qGlass.position.set(s * 0.62, 0.76, -0.46);
            group.add(qGlass);
        }

        // 3.5 遮光ブラックインテリアコア
        const cabinCore = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.16, 1.10), blackTrimMat);
        cabinCore.position.set(0, 0.58, -0.25);
        group.add(cabinCore);

        // バケットシートヘッドレストシルエット
        for (let s of [-1, 1]) {
            const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.12), blackTrimMat);
            headrest.position.set(s * 0.28, 0.76, -0.15);
            group.add(headrest);
        }

        // =========================================================================
        // 4. リアエンド・スモーク丸目テール・チタンマフラー・3D GTウィング
        // =========================================================================
        // 4.1 リアデッキ＆バンパー（丸みを持たせた美しいコーミング）
        const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.28, 0.36), yellowBodyMat);
        rearBumper.position.set(0, 0.42, -1.98);
        group.add(rearBumper);

        // リアデッキ上部（ダックテール調の柔らかなトランクエンド）
        const rearDeckLip = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.06, 0.24), yellowBodyMat);
        rearDeckLip.position.set(0, 0.62, -1.86);
        group.add(rearDeckLip);

        // 4.2 ★FD3S象徴のスモーク一体型リアコンビネーションランプ
        // フルワイド・スモークブラックハウジング
        const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.13, 0.05), tailSmokeMat);
        tailBar.position.set(0, 0.54, -2.12);
        group.add(tailBar);

        // 内部の丸型ランプ群（実車後期のアイコニックな3連丸目）
        for (let s of [-1, 1]) {
            // 外側丸型テール/ブレーキ（赤）
            const tlOuterGeom = new THREE.CylinderGeometry(0.048, 0.048, 0.03, 16);
            tlOuterGeom.rotateX(Math.PI / 2);
            const tlOuter = new THREE.Mesh(tlOuterGeom, tailLightMat);
            tlOuter.position.set(s * 0.60, 0.54, -2.11);
            group.add(tlOuter);

            // 中間丸型ウインカー（アンバー）
            const tlMidGeom = new THREE.CylinderGeometry(0.044, 0.044, 0.03, 16);
            tlMidGeom.rotateX(Math.PI / 2);
            const tlMid = new THREE.Mesh(tlMidGeom, amberLensMat);
            tlMid.position.set(s * 0.46, 0.54, -2.11);
            group.add(tlMid);

            // 内側丸型リバース（クリア白）
            const tlInGeom = new THREE.CylinderGeometry(0.040, 0.040, 0.03, 16);
            tlInGeom.rotateX(Math.PI / 2);
            const tlIn = new THREE.Mesh(tlInGeom, reverseLensMat);
            tlIn.position.set(s * 0.33, 0.54, -2.11);
            group.add(tlIn);
        }

        // 4.3 リアアンダーディフューザー＆エアロフィン
        const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.08, 0.36), carbonMat);
        diffuser.position.set(0, 0.19, -2.00);
        group.add(diffuser);

        // ディフューザーフィン（整流板3本）
        for (let x of [-0.40, 0.0, 0.40]) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.07, 0.34), carbonMat);
            fin.position.set(x, 0.16, -2.00);
            group.add(fin);
        }

        // 4.4 ★高橋啓介仕様 3D湾曲GTウィング
        const wingGroup = new THREE.Group();
        for (let s of [-1, 1]) {
            // アルミウィングステー
            const stay = new THREE.Mesh(
                new THREE.BoxGeometry(0.025, 0.32, 0.12),
                new THREE.MeshStandardMaterial({ color: 0x444448, roughness: 0.25, metalness: 0.85 })
            );
            stay.position.set(s * 0.44, 0.77, -1.82);
            wingGroup.add(stay);

            // 翼端板
            const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.20, 0.32), carbonMat);
            endPlate.position.set(s * 0.84, 0.94, -1.84);
            wingGroup.add(endPlate);
        }

        // メインウィングブレード
        const mainBlade = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.035, 0.30), carbonMat);
        mainBlade.position.set(0, 0.93, -1.84);
        wingGroup.add(mainBlade);

        // ウィングガーニーフラップ
        const gurney = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.015, 0.015), carbonMat);
        gurney.position.set(0, 0.95, -1.98);
        wingGroup.add(gurney);

        group.add(wingGroup);

        // 4.5 ドアミラー & ナンバープレート（ナンバー凹部新設＆前後鮮明露出）
        const plateRecess = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.20, 0.04), meshDarkMat);
        plateRecess.position.set(0, 0.34, -2.15);
        group.add(plateRecess);

        this.addSideMirrors(group, 0.74, 0.67, 0.50, yellowBodyMat);
        this.addLicensePlates(group, '群馬 37 お 63-887', 2.175, -2.175, 0.34, 0.30);

        // =========================================================================
        // 5. Mazdaspeed MS-01 風 ゴールド5スポーク深リムスポーツホイール
        // =========================================================================
        const wheelPos = [
            { x: -0.75, y: 0.31, z: 1.25, isFront: true, isLeft: true },
            { x: 0.75, y: 0.31, z: 1.25, isFront: true, isLeft: false },
            { x: -0.75, y: 0.31, z: -1.25, isFront: false, isLeft: true },
            { x: 0.75, y: 0.31, z: -1.25, isFront: false, isLeft: false }
        ];

        // マツダスピード MS-01 レーシングゴールド (輝くPBRゴールド質感)
        const ms01RimMat = new THREE.MeshStandardMaterial({
            color: 0xd8aa34,
            roughness: 0.20,
            metalness: 0.52
        });

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPos,
            ms01RimMat,
            tireMat,
            'ms01',
            0.31,
            0.22,
            0xd42020
        );

        // =========================================================================
        // 6. 大口径チタン砲弾マフラー（斜め跳ね上げ出し・焼き色グラデーション）
        // =========================================================================
        this.createDetailedExhaust(group, 0.54, 0.18, -1.82, 0.58, 0.17, -2.14, 0.082, 0.058, 0x6688cc);
        const exhaustPos = new THREE.Vector3(0.58, 0.17, -2.22);

        // バンパーヒートプロテクトプレート（マフラー上部の遮熱アルミ板）
        const heatShield = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.06, 0.08),
            new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 })
        );
        heatShield.position.set(0.58, 0.27, -2.13);
        group.add(heatShield);

        // ブレーキライト（急制動時に赤色PointLight発光）
        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.56, -2.25);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.49, 0.68, 1.85);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat: yellowBodyMat, secondaryMat, hoodMat: yellowHoodMat, rimMat: goldSpokeMat },
            tailLPos: new THREE.Vector3(-0.52, 0.54, -2.12),
            tailRPos: new THREE.Vector3(0.52, 0.54, -2.12),
            rearWheelLPos: new THREE.Vector3(-0.84, 0.1, -1.25),
            rearWheelRPos: new THREE.Vector3(0.84, 0.1, -1.25),
            popups: popups,
            headlightMats: headlightMats,
            headlights: headlights
        };
    }

    // =========================================================================
    // 3. NISSAN SKYLINE GT-R V-spec II (BNR32)
    // =========================================================================
    static buildR32(col) {
        const group = new THREE.Group();

        // =========================================================================
        // 1. 高品位マテリアル設定
        // =========================================================================
        // ガングレーメタリック塗装
        const primaryMat = new THREE.MeshStandardMaterial({ 
            color: col.primary, 
            roughness: 0.22, 
            metalness: 0.45 
        });
        // セミグロスブラック・エアロ＆トリム
        const secondaryMat = new THREE.MeshStandardMaterial({ 
            color: col.secondary, 
            roughness: 0.42, 
            metalness: 0.20 
        });
        // ボンネットフード
        const hoodMat = new THREE.MeshStandardMaterial({ 
            color: col.hood, 
            roughness: 0.22, 
            metalness: 0.45 
        });
        // スモークグリーン・自動車用強化ガラス
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x0a141e, 
            roughness: 0.05, 
            metalness: 0.90, 
            transparent: true, 
            opacity: 0.82 
        });
        // サテンブラックサッシュ・モール
        const blackTrimMat = new THREE.MeshStandardMaterial({ 
            color: 0x18181a, 
            roughness: 0.55, 
            metalness: 0.15 
        });
        // 暗色インテリアコア
        const interiorMat = new THREE.MeshStandardMaterial({ 
            color: 0x141416, 
            roughness: 0.92 
        });
        // BNR32純正 鍛造6スポーク（高輝度シルバーアルミ調）
        const spokeMat = new THREE.MeshStandardMaterial({ 
            color: 0xd8e0e8, 
            roughness: 0.24, 
            metalness: 0.38 
        });
        // 切削ポリッシュシルバー外周フランジ＆ステップリム
        const polishedLipMat = new THREE.MeshStandardMaterial({ 
            color: 0xf2f4f8, 
            roughness: 0.10, 
            metalness: 0.55 
        });
        // タイヤゴム
        const tireMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1c, 
            roughness: 0.92 
        });
        // スカイライン丸型テール（高輝度発光赤）
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xcc0606 });
        // 暗部メッシュ・ダクト
        const meshDarkMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0c });
        // ヘッドライト高品位クロームリフレクター
        const hlReflectorMat = new THREE.MeshStandardMaterial({ 
            color: 0xd0d8e2, 
            roughness: 0.20, 
            metalness: 0.50 
        });
        // プロジェクター球体（点灯風クリアブルークローム）
        const projBallMat = new THREE.MeshStandardMaterial({ 
            color: 0xb5e2ff, 
            roughness: 0.08, 
            metalness: 0.35,
            emissive: 0x336699,
            emissiveIntensity: 0.65
        });
        // ヘッドライトクリアアウターカバー（白濁を解消し極高透明化）
        const clearLensMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            roughness: 0.02, 
            metalness: 0.02, 
            transparent: true, 
            opacity: 0.30 
        });
        // アンバーコーナーマーカー（クリアオレンジ）
        const amberLensMat = new THREE.MeshStandardMaterial({ 
            color: 0xee7700, 
            roughness: 0.15, 
            metalness: 0.25, 
            transparent: true, 
            opacity: 0.85 
        });
        // クロームパーツ（GT-Rエンブレム・テールベゼル・マフラー）
        const chromeMat = new THREE.MeshStandardMaterial({ 
            color: 0xf0f2f5, 
            roughness: 0.10, 
            metalness: 0.65 
        });

        // =========================================================================
        // 2. シャシー＆引き締まったロアボディ
        // =========================================================================
        // 2.1 メインアンダーフロア（ホイールベース2.70m、前輪z=1.35、後輪z=-1.35）
        const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.20, 4.22), primaryMat);
        lowerBody.position.set(0, 0.26, 0.0);
        lowerBody.castShadow = true;
        group.add(lowerBody);

        // 2.2 エンジンルーム隔壁（前方からの視線抜けを完全遮断）
        const radiatorBulkhead = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.44, 0.10), blackTrimMat);
        radiatorBulkhead.position.set(0, 0.48, 1.96);
        group.add(radiatorBulkhead);

        // 2.3 ドア部（くびれたウエスト幅1.68m、張り出す前後フェンダーとのコントラスト）
        for (let s of [-1, 1]) {
            // ドア本体パネル
            const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.44, 1.30), primaryMat);
            doorPanel.position.set(s * 0.81, 0.47, 0.02);
            group.add(doorPanel);

            // ロッカーモールディング（サイドステップ）
            const sideSill = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 1.42), secondaryMat);
            sideSill.position.set(s * 0.825, 0.19, 0.02);
            group.add(sideSill);

            // 実車BNR32の角型フラッシュドアハンドル
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.09), blackTrimMat);
            handle.position.set(s * 0.845, 0.62, -0.22);
            group.add(handle);

            // サイドプロテクションモール（ブラックモール）
            const doorMoulding = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 1.30), blackTrimMat);
            doorMoulding.position.set(s * 0.842, 0.45, 0.02);
            group.add(doorMoulding);
        }

        // =========================================================================
        // 3. BNR32最大の象徴：前後ワイドブリスターフェンダー（全幅1.78m）
        // =========================================================================
                for (let s of [-1, 1]) {
            // 3.1 フロントフェンダーアーチ上部フレア（車輪上部y=0.64）
            const fFlare = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.05, 0.68), primaryMat);
            fFlare.position.set(s * 0.865, 0.655, 1.35);
            group.add(fFlare);

            // 車輪前方ブリスターフェンダー
            const fBlisterFront = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.36), primaryMat);
            fBlisterFront.position.set(s * 0.81, 0.47, 1.82);
            group.add(fBlisterFront);

            // 車輪後方ブリスターフェンダー
            const fBlisterRear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.26), primaryMat);
            fBlisterRear.position.set(s * 0.81, 0.47, 0.86);
            group.add(fBlisterRear);

            // フロントフェンダー上面ショルダー
const fShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.045, 1.26), primaryMat);
            fShoulder.position.set(s * 0.79, 0.69, 1.30);
            group.add(fShoulder);

            // ノーズへの前方テーパー
            const fTaper = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.38, 0.44), primaryMat);
            fTaper.position.set(s * 0.81, 0.47, 1.94);
            group.add(fTaper);

            // ★スカイラインGT伝統の丸型フロントフェンダーエンブレム（赤丸＋シルバーGT）
            const gtBadgeBase = new THREE.Mesh(
                new THREE.CylinderGeometry(0.022, 0.022, 0.008, 16),
                new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.3, metalness: 0.2 })
            );
            gtBadgeBase.rotateZ(Math.PI / 2);
            gtBadgeBase.position.set(s * 0.885, 0.52, 0.72);
            group.add(gtBadgeBase);

            const gtBadgeTrim = new THREE.Mesh(
                new THREE.RingGeometry(0.020, 0.024, 16),
                chromeMat
            );
            gtBadgeTrim.rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2);
            gtBadgeTrim.position.set(s * 0.890, 0.52, 0.72);
            group.add(gtBadgeTrim);

            // 3.2 リア・ブリスターフェンダー（GT-Rならではの肉厚なスクエアショルダー）
            // 3.2 リア・ブリスターフェンダー（ホイール開口部を完全にくり抜いたリアル構造）
            const rBlisterFront = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.34, 0.34), primaryMat);
            rBlisterFront.position.set(s * 0.845, 0.47, -0.74);
            group.add(rBlisterFront);

            const rBlisterRear = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.34, 0.36), primaryMat);
            rBlisterRear.position.set(s * 0.845, 0.47, -1.84);
            group.add(rBlisterRear);

            const rBlisterTop = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.66), primaryMat);
            rBlisterTop.position.set(s * 0.845, 0.67, -1.35);
            group.add(rBlisterTop);

            // リアアーチフレア（タイヤ上部に美しく沿う薄型アーチリップ）
            const rFlare = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.05, 0.70), primaryMat);
            rFlare.position.set(s * 0.895, 0.655, -1.35);
            group.add(rFlare);

            // リアショルダー稜線（テールランプへと繋がる力強い水平ライン）
            const rShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.048, 1.36), primaryMat);
            rShoulder.position.set(s * 0.78, 0.70, -1.24);
            group.add(rShoulder);
        }

        // =========================================================================
        // 4. 精緻なクーペキャビン＆リアルウィンドウ構造（完全脱・箱型）
        // =========================================================================
        // 4.1 暗色インテリアコア
        const interiorCore = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.40, 1.32), interiorMat);
        interiorCore.position.set(0, 0.65, -0.15);
        group.add(interiorCore);

        // バケットシート・ヘッドレスト
        for (let s of [-1, 1]) {
            const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.24, 0.12), blackTrimMat);
            headrest.position.set(s * 0.32, 0.85, -0.20);
            group.add(headrest);
        }

        // 3本スポーク・スポーツステアリング（右ハンドル仕様 x=0.32）
        const steering = new THREE.Mesh(
            new THREE.CylinderGeometry(0.12, 0.12, 0.02, 16),
            blackTrimMat
        );
        steering.rotation.x = 0.50;
        steering.position.set(0.32, 0.77, 0.28);
        group.add(steering);

        // ルームミラー
        const rViewMirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.04), blackTrimMat);
        rViewMirror.position.set(0, 0.98, 0.36);
        group.add(rViewMirror);

        // 4.2 薄型ルーフパネル（リアルクーペプロポーション：前後ヘッダーとピラーにジャストフィット）
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.035, 1.28), primaryMat);
        roof.position.set(0, 1.035, -0.15);
        group.add(roof);

        // フロントルーフヘッダーモール（Aピラー頂上を美しく包み込む）
        const fHeader = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.036, 0.07), blackTrimMat);
        fHeader.position.set(0, 1.035, 0.485);
        group.add(fHeader);

        // リアパーセルヘッダーモール（Cピラー頂上を美しく包み込む）
        const rHeader = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.036, 0.07), blackTrimMat);
        rHeader.position.set(0, 1.035, -0.785);
        group.add(rHeader);

        // ルーフドリップモール（ブラックモール）
        for (let s of [-1, 1]) {
            const dripRail = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 1.28), blackTrimMat);
            dripRail.position.set(s * 0.612, 1.045, -0.15);
            group.add(dripRail);
        }

        // 4.3 スラント・フロントウインドウ＆Aピラー
        // 傾斜角 -0.58 rad、長さ0.42m：頂点 y=1.032 でルーフヘッダー下端に完全に収まり、ルーフ突き抜け（角立ち）をゼロ化
        const fSlope = -0.58;
        const fWind = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.42, 0.035), glassMat);
        fWind.position.set(0, 0.86, 0.62);
        fWind.rotation.x = fSlope;
        group.add(fWind);

        // フロントガラス上部トップシェードバンド
        const fShade = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.08, 0.036), blackTrimMat);
        fShade.position.set(0, 0.99, 0.50);
        fShade.rotation.x = fSlope;
        group.add(fShade);

        // Aピラー（ボディ同色＋ブラックサッシュ：ルーフ幅1.22内に整合し突き抜け解消）
        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.42, 0.042), primaryMat);
            aPillar.position.set(s * 0.605, 0.86, 0.62);
            aPillar.rotation.x = fSlope;
            group.add(aPillar);

            const aSash = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.42, 0.045), blackTrimMat);
            aSash.position.set(s * 0.585, 0.86, 0.62);
            aSash.rotation.x = fSlope;
            group.add(aSash);
        }

        // カウルルーバー＆ワイパードレイ（ウインドウ下部とボンネット間を隙間なくカバー）
        const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.04, 0.18), blackTrimMat);
        cowl.position.set(0, 0.69, 0.81);
        group.add(cowl);

        // 4.4 ノッチバック・リアウインドウ＆重厚なCピラー
        // 傾斜角 0.56 rad、長さ0.42m：頂点 y=1.034 でリアヘッダー下端にジャストフィットし突き抜け（角立ち）をゼロ化
        const rSlope = 0.56;
        const rWind = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.42, 0.035), glassMat);
        rWind.position.set(0, 0.86, -0.90);
        rWind.rotation.x = rSlope;
        group.add(rWind);

        // リアパーセルシェルフ（車内フロア遮蔽パネル）
        const rShelf = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.03, 0.35), blackTrimMat);
        rShelf.position.set(0, 0.68, -0.90);
        group.add(rShelf);

        // 重厚なCピラー（ルーフ四隅のトゲ・角立ちを完全解消）
        for (let s of [-1, 1]) {
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.42, 0.065), primaryMat);
            cPillar.position.set(s * 0.595, 0.86, -0.90);
            cPillar.rotation.x = rSlope;
            group.add(cPillar);
        }

        // 4.5 サイドウィンドウ＆ホフマイスター・キンク調クォーターウィンドウ
        for (let s of [-1, 1]) {
            // ドアガラス
            const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.33, 0.68), glassMat);
            sideGlass.position.set(s * 0.655, 0.84, 0.10);
            group.add(sideGlass);

            // Bピラーサッシュ
            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.045), blackTrimMat);
            bPillar.position.set(s * 0.66, 0.84, -0.25);
            group.add(bPillar);

            // クォーター三角窓ガラス
            const qGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.30, 0.38), glassMat);
            qGlass.position.set(s * 0.65, 0.84, -0.47);
            group.add(qGlass);

            // ウインドウ下部ウェザーストリップ（ブラックモール）
            const beltMould = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 1.18), blackTrimMat);
            beltMould.position.set(s * 0.665, 0.69, -0.15);
            group.add(beltMould);
        }

        // =========================================================================
        // 5. 武骨かつ精悍なGT-Rフロントマスク
        // =========================================================================
        // 5.1 アルミボンネットフード
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.035, 1.40), hoodMat);
        hood.position.set(0, 0.675, 1.50);
        hood.rotation.x = 0.024;
        group.add(hood);

        // 左右キャラクタープレスライン
        for (let s of [-1, 1]) {
            const hoodRidge = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 1.38), hoodMat);
            hoodRidge.position.set(s * 0.40, 0.692, 1.50);
            hoodRidge.rotation.x = 0.024;
            group.add(hoodRidge);
        }

        // 5.2 フロントグリル＆GT-R立体エンブレム
        const grillBacking = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.11, 0.06), meshDarkMat);
        grillBacking.position.set(0, 0.57, 2.18);
        group.add(grillBacking);

        // グリル水平2本スリットバー
        for (let yOff of [-0.025, 0.025]) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.018, 0.04), blackTrimMat);
            bar.position.set(0, 0.57 + yOff, 2.20);
            group.add(bar);
        }

        // GT-R立体エンブレム
        const gtrEmblemMat = new THREE.MeshBasicMaterial({ 
            map: this.createGtrEmblemTexture(), 
            transparent: true 
        });
        const gtrBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.075), gtrEmblemMat);
        gtrBadge.position.set(0.14, 0.57, 2.23);
        group.add(gtrBadge);

        // 5.3 角型2眼クリスタルプロジェクターヘッドライト
        for (let s of [-1, 1]) {
            // クロームリフレクターハウジング
            const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.13, 0.06), hlReflectorMat);
            hlHousing.position.set(s * 0.52, 0.57, 2.18);
            group.add(hlHousing);

            // ハウジング外周ブラックベゼルフレーム
            const hlFrame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.02), blackTrimMat);
            hlFrame.position.set(s * 0.52, 0.57, 2.16);
            group.add(hlFrame);

            // 外側ロービーム（丸型プロジェクターレンズ）
            const projGeom = new THREE.CylinderGeometry(0.042, 0.042, 0.025, 16);
            projGeom.rotateX(Math.PI / 2);
            const proj = new THREE.Mesh(projGeom, projBallMat);
            proj.position.set(s * 0.60, 0.57, 2.21);
            group.add(proj);

            // プロジェクター周囲のクロームベゼルリング
            const pRingGeom = new THREE.RingGeometry(0.040, 0.048, 16);
            const pRing = new THREE.Mesh(pRingGeom, chromeMat);
            pRing.position.set(s * 0.60, 0.57, 2.225);
            group.add(pRing);

            // 内側ハイビーム（パラボラリフレクター）
            const refl = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.095, 0.02), hlReflectorMat);
            refl.position.set(s * 0.44, 0.57, 2.20);
            group.add(refl);

            // ハイビーム電球バルブ
            const bulb = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8), chromeMat);
            bulb.rotateX(Math.PI / 2);
            bulb.position.set(s * 0.44, 0.57, 2.215);
            group.add(bulb);

            // 透明クリスタルクリアアウターレンズカバー
            const hlGlass = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.125, 0.015), clearLensMat);
            hlGlass.position.set(s * 0.52, 0.57, 2.235);
            group.add(hlGlass);

            // 縦型アンバーコーナーマーカー
            const cornerLamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.135, 0.16), amberLensMat);
            cornerLamp.position.set(s * 0.76, 0.57, 2.16);
            group.add(cornerLamp);

            const cornerBacking = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.13, 0.01), hlReflectorMat);
            cornerBacking.position.set(s * 0.76, 0.57, 2.08);
            group.add(cornerBacking);
        }

        // 5.4 フロントバンパー＆冷却開口部
        const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.30, 0.36), primaryMat);
        bumper.position.set(0, 0.38, 2.18);
        group.add(bumper);

        // バンパーコーナーの面取りテーパー
        for (let s of [-1, 1]) {
            const bCorner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.24), primaryMat);
            bCorner.position.set(s * 0.81, 0.38, 2.08);
            bCorner.rotation.y = s * -0.32;
            group.add(bCorner);
        }

        // ★ツインNISMOダクト
        for (let s of [-1, 1]) {
            const nismoSlot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.045, 0.05), meshDarkMat);
            nismoSlot.position.set(s * 0.23, 0.46, 2.36);
            group.add(nismoSlot);
        }

        // ★大型前置きインタークーラー開口部
        const icRecess = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.22, 0.08), meshDarkMat);
        icRecess.position.set(0, 0.29, 2.34);
        group.add(icRecess);

        // アルミインタークーラーコア
        const icMat = new THREE.MeshStandardMaterial({
            map: this.createIntercoolerTexture('NISMO'),
            metalness: 0.85,
            roughness: 0.35
        });
        const icMesh = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.20, 0.03), icMat);
        icMesh.position.set(0, 0.29, 2.37);
        group.add(icMesh);

        // 左右ブレーキ冷却ダクト
        for (let s of [-1, 1]) {
            const bDuct = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.05), meshDarkMat);
            bDuct.position.set(s * 0.64, 0.29, 2.32);
            group.add(bDuct);
        }

        // フロントチンスポイラー
        const fLip = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.05, 0.38), secondaryMat);
        fLip.position.set(0, 0.17, 2.24);
        group.add(fLip);

        // =========================================================================
        // 6. リアエンド・伝統の丸型4灯テール＆純正大型リアウィング
        // =========================================================================
        // 6.1 水平トランクデッキ
        const trunkDeck = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.04, 0.94), primaryMat);
        trunkDeck.position.set(0, 0.69, -1.62);
        group.add(trunkDeck);

        // トランク後端リップ
        const trunkLip = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.05, 0.12), primaryMat);
        trunkLip.position.set(0, 0.685, -2.10);
        group.add(trunkLip);

        // トランク上の立体GT-Rエンブレム（トランク右端）
        const trunkBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.055), gtrEmblemMat);
        trunkBadge.position.set(0.48, 0.70, -2.15);
        trunkBadge.rotation.x = -Math.PI / 2;
        group.add(trunkBadge);

        // 6.2 リアテールガーニッシュ
        const rGarnish = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.24, 0.06), secondaryMat);
        rGarnish.position.set(0, 0.57, -2.18);
        group.add(rGarnish);

        // ★伝統の丸型4灯テールランプ（3D立体クロームカップベゼル＋高輝度レンズ）
        for (let s of [-1, 1]) {
            for (let i of [0, 1]) {
                const posX = s * (0.39 + i * 0.24);
                const posZ = -2.215;

                // 立体クロームベゼルカップ（円筒状の深彫りベゼル）
                const cupGeom = new THREE.CylinderGeometry(0.088, 0.088, 0.035, 20, 1, true);
                cupGeom.rotateX(Math.PI / 2);
                const cup = new THREE.Mesh(cupGeom, chromeMat);
                cup.position.set(posX, 0.57, posZ);
                group.add(cup);

                // ベゼル外周フランジリング
                const bezelRing = new THREE.Mesh(new THREE.RingGeometry(0.078, 0.092, 20), chromeMat);
                bezelRing.position.set(posX, 0.57, -2.233);
                group.add(bezelRing);

                // 内側赤色レンズ
                const lensGeom = new THREE.CylinderGeometry(0.076, 0.076, 0.030, 20);
                lensGeom.rotateX(Math.PI / 2);
                const tl = new THREE.Mesh(lensGeom, tailLightMat);
                tl.position.set(posX, 0.57, posZ);
                group.add(tl);

                // 内側ランプ中央にバックランプクリア円
                if (i === 0) {
                    const revGeom = new THREE.CircleGeometry(0.028, 16);
                    const revMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
                    const rev = new THREE.Mesh(revGeom, revMat);
                    rev.position.set(posX, 0.57, -2.231);
                    group.add(rev);
                }
            }
        }

        // 6.3 BNR32純正大型リアスポイラー
        const wingGroup = new THREE.Group();
        for (let s of [-1, 1]) {
            // エアロダイナミック・直立ステー
            const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.26, 0.28), primaryMat);
            pillar.position.set(s * 0.65, 0.83, -1.95);
            wingGroup.add(pillar);

            // ★ウィング翼端板
            const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.09, 0.36), primaryMat);
            endPlate.position.set(s * 0.85, 0.955, -1.98);
            wingGroup.add(endPlate);
        }
        // メインウィングブレード
        const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.70, 0.050, 0.34), primaryMat);
        wingBlade.position.set(0, 0.955, -1.98);
        wingGroup.add(wingBlade);

        // ウィング後端ガーニーフラップ
        const gurney = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.018, 0.020), secondaryMat);
        gurney.position.set(0, 0.980, -2.14);
        wingGroup.add(gurney);
        group.add(wingGroup);

        // 6.4 リアバンパー＆ナンバープレート
        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.32, 0.36), primaryMat);
        rBumper.position.set(0, 0.38, -2.16);
        group.add(rBumper);

        // バンパー下部エアロインデント
        const rDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.08, 0.32), secondaryMat);
        rDiffuser.position.set(0, 0.20, -2.12);
        group.add(rDiffuser);

        // ナンバープレート凹部
        const plateRecess = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.04), meshDarkMat);
        plateRecess.position.set(0, 0.34, -2.33);
        group.add(plateRecess);

        // 6.5 ドアミラー＆ナンバープレート
        this.addSideMirrors(group, 0.79, 0.72, 0.62, primaryMat);
        this.addLicensePlates(group, '群馬 33 お 12-345', 2.32, -2.355, 0.30);

        // =========================================================================
        // 7. BNR32純正 鍛造6スポーク深リムホイール＆ゴールドBremboキャリパー
        // =========================================================================
        const wheelPositions = [
            { x: -0.76, y: 0.31, z: 1.35, isFront: true, isLeft: true },
            { x: 0.76, y: 0.31, z: 1.35, isFront: true, isLeft: false },
            { x: -0.76, y: 0.31, z: -1.35, isFront: false, isLeft: true },
            { x: 0.76, y: 0.31, z: -1.35, isFront: false, isLeft: false }
        ];

        // BNR32 純正鍛造16インチ 5スポーク (スパークシルバーメタリック)
        const gtrRimMat = new THREE.MeshStandardMaterial({
            color: 0xdce2ea,
            roughness: 0.18,
            metalness: 0.50
        });

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            gtrRimMat,
            tireMat,
            'bnr32_oem',
            0.31,
            0.22,
            0x222226
        );

        // =========================================================================
        // 8. 大口径ステンレス砲弾スポーツマフラー＆ライティング
        // =========================================================================
        this.createDetailedExhaust(group, 0.56, 0.18, -1.92, 0.60, 0.18, -2.22, 0.085, 0.058, 0xeeeeee);
        const exhaustPos = new THREE.Vector3(0.60, 0.18, -2.26);

        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.58, -2.3);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.52, 0.57, 2.25);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat: spokeMat },
            tailLPos: new THREE.Vector3(-0.53, 0.57, -2.22),
            tailRPos: new THREE.Vector3(0.53, 0.57, -2.22),
            rearWheelLPos: new THREE.Vector3(-0.86, 0.1, -1.35),
            rearWheelRPos: new THREE.Vector3(0.86, 0.1, -1.35),
            popups: [],
            headlightMats: [projBallMat],
            headlights: headlights
        };
    }

    // =========================================================================
    // 4. NISSAN SILVIA K's (PS13) - 「アートフォース・シルビア」徹底実車再現
    // =========================================================================
    static buildS13(col) {
        const group = new THREE.Group();

        // 1. マテリアルパレット
        const primaryMat = new THREE.MeshStandardMaterial({ 
            color: col.primary, 
            roughness: 0.22, 
            metalness: 0.22 
        });
        const secondaryMat = new THREE.MeshStandardMaterial({ 
            color: col.secondary, 
            roughness: 0.38, 
            metalness: 0.24 
        });
        const hoodMat = new THREE.MeshStandardMaterial({ 
            color: col.hood, 
            roughness: 0.24, 
            metalness: 0.22 
        });
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x081018, 
            roughness: 0.05, 
            metalness: 0.90, 
            transparent: true, 
            opacity: 0.88 
        });
        const interiorMat = new THREE.MeshStandardMaterial({ 
            color: 0x181a1d, 
            roughness: 0.88, 
            metalness: 0.10 
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({ 
            color: 0x111214, 
            roughness: 0.65, 
            metalness: 0.15 
        });
        const clearLensMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            roughness: 0.03, 
            metalness: 0.03, 
            transparent: true, 
            opacity: 0.32 
        });
        const projBallMat = new THREE.MeshStandardMaterial({ 
            color: 0xb5e2ff, 
            emissive: 0x336699, 
            emissiveIntensity: 0.65, 
            roughness: 0.08, 
            metalness: 0.35 
        });
        const brakeRotorMat = new THREE.MeshStandardMaterial({ 
            color: 0x9aa2aa, 
            roughness: 0.35, 
            metalness: 0.70 
        });
        const caliperMat = new THREE.MeshStandardMaterial({ 
            color: 0xbb1111, 
            roughness: 0.30, 
            metalness: 0.20 
        });
        const innerRimMat = new THREE.MeshStandardMaterial({ 
            color: 0x282b30, 
            roughness: 0.50, 
            metalness: 0.50 
        });
        const spokeMat = new THREE.MeshStandardMaterial({ 
            color: col.rim || 0xdce2e8, 
            roughness: 0.24, 
            metalness: 0.38 
        });
        const polishedLipMat = new THREE.MeshStandardMaterial({ 
            color: 0xf2f4f8, 
            roughness: 0.10, 
            metalness: 0.55 
        });
        const tireMat = new THREE.MeshStandardMaterial({ 
            color: 0x1a1a1c, 
            roughness: 0.92 
        });
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xcc0606 });
        const meshDarkMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0c });
        const intercoolerMat = new THREE.MeshStandardMaterial({ 
            color: 0xd8e0e8, 
            roughness: 0.28, 
            metalness: 0.85 
        });
        const hlReflectorMat = new THREE.MeshStandardMaterial({ 
            color: 0xd4dce4, 
            roughness: 0.12, 
            metalness: 0.50 
        });
        const amberLensMat = new THREE.MeshStandardMaterial({ 
            color: 0xee7700, 
            roughness: 0.15, 
            metalness: 0.25, 
            transparent: true, 
            opacity: 0.85 
        });
        const chromeMat = new THREE.MeshStandardMaterial({ 
            color: 0xf0f2f5, 
            roughness: 0.10, 
            metalness: 0.65 
        });

        // =====================================================================
        // 2. シャシー＆ライムグリーンツートン・彫刻的ボディ
        // =====================================================================
        // 2.1 メインアンダーフロア（ホイールベース2.50m、前輪z=1.25、後輪z=-1.25）
        const lowerFloor = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.18, 4.02), secondaryMat);
        lowerFloor.position.set(0, 0.25, 0.0);
        lowerFloor.castShadow = true;
        group.add(lowerFloor);

        // エンジンルーム隔壁（高さを抑えてフード下y=0.58に収め、視線抜けを完全遮断）
        const radiatorBulkhead = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.30, 0.10), blackTrimMat);
        radiatorBulkhead.position.set(0, 0.42, 1.86);
        group.add(radiatorBulkhead);

        // 2.2 ドア部（ツートン下部＋上部＋サイドモール）
        for (let s of [-1, 1]) {
            // ドア下部パネル（ツートンロアカラー）
            const doorLower = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 1.28), secondaryMat);
            doorLower.position.set(s * 0.78, 0.35, 0.0);
            group.add(doorLower);

            // サイドシル（ロッカーパネル）
            const sideSill = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.08, 1.34), secondaryMat);
            sideSill.position.set(s * 0.795, 0.18, 0.0);
            group.add(sideSill);

            // ドア上部パネル（ツートンアッパーカラー）
            const doorUpper = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 1.28), primaryMat);
            doorUpper.position.set(s * 0.78, 0.55, 0.0);
            group.add(doorUpper);

            // ★ツートン境界のブラックサイドプロテクションモール
            const doorMoulding = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.024, 1.28), blackTrimMat);
            doorMoulding.position.set(s * 0.812, 0.44, 0.0);
            group.add(doorMoulding);

            // 実車S13のスマートなフラッシュドアハンドル
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.026, 0.085), blackTrimMat);
            handle.position.set(s * 0.814, 0.60, -0.22);
            group.add(handle);
        }

        // 2.3 フロントフェンダー（ホイールハウス切り欠き＆ツートン）
        for (let s of [-1, 1]) {
            // フロントフェンダー上部（プライマリカラー、タイヤ上部y=0.62を美しく包む）
            const fFenderUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.66), primaryMat);
            fFenderUpper.position.set(s * 0.78, 0.65, 1.25);
            group.add(fFenderUpper);

            // ホイールアーチフレア（タイヤハウス輪郭）
            const fArchFlare = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.68), primaryMat);
            fArchFlare.position.set(s * 0.825, 0.645, 1.25);
            group.add(fArchFlare);

            // フロントフェンダー下部・前方（ツートン下部）
            const fFenderLowerFront = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.36), secondaryMat);
            fFenderLowerFront.position.set(s * 0.77, 0.35, 1.82);
            group.add(fFenderLowerFront);

            // フロントフェンダー下部・後方（ドア直前）
            const fFenderLowerRear = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.24), secondaryMat);
            fFenderLowerRear.position.set(s * 0.77, 0.35, 0.76);
            group.add(fFenderLowerRear);

            // フェンダー側面のブラックプロテクションモール（前方延長）
const fMoulding = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.024, 0.36), blackTrimMat);
            fMoulding.position.set(s * 0.812, 0.44, 1.82);
            group.add(fMoulding);
        }

        // 2.4 リアフェンダー（流麗な5ナンバークーペヒップ＆ツートン）
        for (let s of [-1, 1]) {
            // リアフェンダー上部（プライマリカラー）
            const rFenderUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.66), primaryMat);
            rFenderUpper.position.set(s * 0.78, 0.65, -1.25);
            group.add(rFenderUpper);

            // リアアーチフレア
            const rArchFlare = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.68), primaryMat);
            rArchFlare.position.set(s * 0.825, 0.645, -1.25);
            group.add(rArchFlare);

            // リアフェンダー下部・前方（ドア直後）
            const rFenderLowerFront = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.24), secondaryMat);
            rFenderLowerFront.position.set(s * 0.77, 0.35, -0.76);
            group.add(rFenderLowerFront);

            // リアフェンダー下部・後方（リアオーバーハング）
            const rFenderLowerRear = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.44), secondaryMat);
            rFenderLowerRear.position.set(s * 0.77, 0.35, -1.86);
            group.add(rFenderLowerRear);

            // フェンダー側面のブラックプロテクションモール（後方延長）
const rMoulding = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.024, 0.44), blackTrimMat);
            rMoulding.position.set(s * 0.812, 0.44, -1.86);
            group.add(rMoulding);
        }

        // =====================================================================
        // 3. アートフォース・優美なクーペキャビン＆ウィンドウ（完全脱・箱型）
        // =====================================================================
        // 3.1 暗色インテリアコア
        const interiorCore = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.38, 1.28), interiorMat);
        interiorCore.position.set(0, 0.64, -0.15);
        group.add(interiorCore);

        // バケットシート・ヘッドレスト
        for (let s of [-1, 1]) {
            const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, 0.12), blackTrimMat);
            headrest.position.set(s * 0.30, 0.83, -0.18);
            group.add(headrest);
        }

        // 3本スポーク・スポーツステアリング（右ハンドル仕様 x=0.30）
        const steering = new THREE.Mesh(
            new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16),
            blackTrimMat
        );
        steering.rotation.x = 0.50;
        steering.position.set(0.30, 0.75, 0.26);
        group.add(steering);

        // ルームミラー
        const rViewMirror = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.032, 0.035), blackTrimMat);
        rViewMirror.position.set(0, 0.96, 0.34);
        group.add(rViewMirror);

        // 3.2 薄型ルーフパネル（優美なS13クーペプロポーション：全高y=1.01m、z=0.43から-0.73まで完全カバー）
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.032, 1.16), primaryMat);
        roof.position.set(0, 1.005, -0.15);
        group.add(roof);

        // フロントルーフヘッダーモール（フロントガラス上端との完璧な接合部）
        const fHeader = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.024, 0.05), blackTrimMat);
        fHeader.position.set(0, 1.005, 0.42);
        group.add(fHeader);

        // リアパーセルヘッダーモール（リアガラス上端との完璧な接合部）
        const rHeader = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.024, 0.05), blackTrimMat);
        rHeader.position.set(0, 1.005, -0.72);
        group.add(rHeader);

        // ルーフドリップモール
        for (let s of [-1, 1]) {
            const dripRail = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.020, 1.16), blackTrimMat);
            dripRail.position.set(s * 0.592, 1.01, -0.15);
            group.add(dripRail);
        }

        // 3.3 スラント・フロントウインドウ＆Aピラー（ルーフ前端z=0.43からカウルz=0.78まで隙間なく結合）
        const fSlope = -0.60;
        const fWind = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.44, 0.032), glassMat);
        fWind.position.set(0, 0.835, 0.58);
        fWind.rotation.x = fSlope;
        group.add(fWind);

        // トップシェードバンド
        const fShade = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.07, 0.033), blackTrimMat);
        fShade.position.set(0, 0.96, 0.44);
        fShade.rotation.x = fSlope;
        group.add(fShade);

        // スリムAピラー（ボディ同色＋ブラックサッシュ：ルーフとカウルに完全に一体化）
        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.44, 0.040), primaryMat);
            aPillar.position.set(s * 0.59, 0.835, 0.58);
            aPillar.rotation.x = fSlope;
            group.add(aPillar);

            const aSash = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.44, 0.042), blackTrimMat);
            aSash.position.set(s * 0.575, 0.835, 0.58);
            aSash.rotation.x = fSlope;
            group.add(aSash);
        }

        // カウルルーバー＆ワイパードレイ
        const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.035, 0.12), blackTrimMat);
        cowl.position.set(0, 0.67, 0.78);
        group.add(cowl);

        // 3.4 ノッチバック・リアウインドウ＆繊細なCピラー（ルーフ後端z=-0.73からトランクデッキz=-1.00まで隙間なく結合）
        const rSlope = 0.52;
        const rWind = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.40, 0.032), glassMat);
        rWind.position.set(0, 0.815, -0.83);
        rWind.rotation.x = rSlope;
        group.add(rWind);

        // 繊細なCピラー（S13の優美なピラーライン：ルーフ後端とリアフェンダーに滑らかに結合）
        for (let s of [-1, 1]) {
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.060, 0.38, 0.055), primaryMat);
            cPillar.position.set(s * 0.585, 0.810, -0.83);
            cPillar.rotation.x = rSlope;
            group.add(cPillar);
        }

        // 3.5 サイドウィンドウ＆流れるクォーター三角窓
        for (let s of [-1, 1]) {
            // ドアガラス
            const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.31, 0.65), glassMat);
            sideGlass.position.set(s * 0.61, 0.825, 0.10);
            group.add(sideGlass);

            // Bピラーサッシュ
            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.32, 0.038), blackTrimMat);
            bPillar.position.set(s * 0.615, 0.825, -0.23);
            group.add(bPillar);

            // クォーター三角窓ガラス
            const qGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.42), glassMat);
            qGlass.position.set(s * 0.61, 0.825, -0.46);
            group.add(qGlass);

            // ウインドウ下部ウェザーストリップ（ブラックモール）
            const beltMould = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.02, 1.18), blackTrimMat);
            beltMould.position.set(s * 0.62, 0.68, -0.15);
            group.add(beltMould);
        }

        // =====================================================================
        // 4. PS13象徴：角目3連クリスタルプロジェクター＆専用フロントマスク
        // =====================================================================
        // 4.1 低くシャープなボンネットフード（カウルからグリルまで滑らかに前下がり）
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.032, 1.34), hoodMat);
        hood.position.set(0, 0.655, 1.44);
        hood.rotation.x = 0.028;
        group.add(hood);

        // フード左右キャラクタープレスライン
        for (let s of [-1, 1]) {
            const hoodRidge = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.012, 1.32), hoodMat);
            hoodRidge.position.set(s * 0.38, 0.672, 1.44);
            hoodRidge.rotation.x = 0.028;
            group.add(hoodRidge);
        }

        // 4.2 アクリル調センターグリル（SILVIAエンブレム）
        const s13GrillTex = this.createSilviaGrillTexture();
        const grill = new THREE.Mesh(
            new THREE.BoxGeometry(0.48, 0.10, 0.04),
            new THREE.MeshBasicMaterial({ map: s13GrillTex, transparent: true })
        );
        grill.position.set(0, 0.55, 2.12);
        group.add(grill);

        // 4.3 ★PS13最大の象徴「角目3連クリスタルプロジェクターヘッドライト」
        for (let s of [-1, 1]) {
            // クロームリフレクターハウジング
            const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.125, 0.05), hlReflectorMat);
            hlHousing.position.set(s * 0.52, 0.55, 2.12);
            group.add(hlHousing);

            // ハウジング外周ブラックベゼルフレーム
            const hlFrame = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.135, 0.02), blackTrimMat);
            hlFrame.position.set(s * 0.52, 0.55, 2.10);
            group.add(hlFrame);

            // 3つの丸型プロジェクター眼（角目3連：ロービーム、ハイビーム、フォグ）
            for (let i = -1; i <= 1; i++) {
                const posX = s * 0.52 + i * 0.11;
                
                // プロジェクター球体
                const projGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.022, 16);
                projGeom.rotateX(Math.PI / 2);
                const proj = new THREE.Mesh(projGeom, projBallMat);
                proj.position.set(posX, 0.55, 2.14);
                group.add(proj);

                // プロジェクター周囲のクロームベゼルリング
                const ringGeom = new THREE.RingGeometry(0.033, 0.040, 16);
                const ring = new THREE.Mesh(ringGeom, chromeMat);
                ring.position.set(posX, 0.55, 2.155);
                group.add(ring);
            }

            // 透明クリスタルクリアアウターレンズカバー
            const hlGlass = new THREE.Mesh(new THREE.BoxGeometry(0.37, 0.12, 0.015), clearLensMat);
            hlGlass.position.set(s * 0.52, 0.55, 2.165);
            group.add(hlGlass);

            // 回り込みアンバーコーナーマーカー（フェンダー両端に回り込むウインカー）
            const cornerLamp = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.125, 0.16), amberLensMat);
            cornerLamp.position.set(s * 0.74, 0.55, 2.10);
            group.add(cornerLamp);

            const cornerBacking = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.12, 0.01), hlReflectorMat);
            cornerBacking.position.set(s * 0.74, 0.55, 2.02);
            group.add(cornerBacking);
        }

        // 4.4 フロントバンパー（ツートンアッパー＋ツートンロア＆冷却ダクト）
        // バンパー上部（プライマリカラー）
        const fBumpUpper = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.14, 0.32), primaryMat);
        fBumpUpper.position.set(0, 0.45, 2.10);
        group.add(fBumpUpper);

        // バンパー下部（セカンダリカラー）
        const fBumpLower = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.16, 0.32), secondaryMat);
        fBumpLower.position.set(0, 0.30, 2.10);
        group.add(fBumpLower);

        // バンパーコーナーテーパー（上下ツートンに完全適合）
        for (let s of [-1, 1]) {
            // コーナー上部（ライムグリーン）
            const bCornerUpper = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.26), primaryMat);
            bCornerUpper.position.set(s * 0.77, 0.45, 2.04);
            bCornerUpper.rotation.y = s * -0.22;
            group.add(bCornerUpper);

            // コーナー下部（ガンメタツートン）
            const bCornerLower = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.16, 0.26), secondaryMat);
            bCornerLower.position.set(s * 0.77, 0.30, 2.04);
            bCornerLower.rotation.y = s * -0.22;
            group.add(bCornerLower);
        }

        // センター冷却インテークダクト開口部
        const fIntake = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.06), meshDarkMat);
        fIntake.position.set(0, 0.28, 2.26);
        group.add(fIntake);

        // アルミインタークーラー冷却コア
        const icMesh = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.10, 0.02), intercoolerMat);
        icMesh.position.set(0, 0.28, 2.27);
        group.add(icMesh);

        // バンパーコーナー・ターンシグナル／フォグランプ
        for (let s of [-1, 1]) {
            const sig = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.03), amberLensMat);
            sig.position.set(s * 0.58, 0.34, 2.25);
            group.add(sig);
        }

        // フロントチンスポイラー（ブラックリップ）
        const fLip = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.045, 0.34), blackTrimMat);
        fLip.position.set(0, 0.16, 2.16);
        group.add(fLip);

        // =====================================================================
        // 5. リアエンド・フルワイドテールランプ＆純正トランクスポイラー
        // =====================================================================
        // 5.1 水平トランクデッキ
        const trunkDeck = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.035, 0.88), primaryMat);
        trunkDeck.position.set(0, 0.665, -1.54);
        group.add(trunkDeck);

        // トランク後端リップ
        const trunkLip = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.045, 0.10), primaryMat);
        trunkLip.position.set(0, 0.66, -1.98);
        group.add(trunkLip);

        // 5.2 純正トランクスポイラー（K'sエアロスポイラー）
        const spoiler = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.045, 0.20), primaryMat);
        spoiler.position.set(0, 0.695, -1.95);
        group.add(spoiler);

        // ハイマウントストップランプスリット
        const highMount = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.01), tailLightMat);
        highMount.position.set(0, 0.695, -2.055);
        group.add(highMount);

        // 5.3 ★S13象徴のフルワイドテールランプ（高精細立体化＋ブレーキ発光連動）
        const s13TailTex = this.createS13TailTexture();
        const tailMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.56, 0.13, 0.05),
            new THREE.MeshBasicMaterial({ map: s13TailTex })
        );
        tailMesh.position.set(0, 0.55, -2.08);
        group.add(tailMesh);

        // 左右アウターテール/ブレーキ赤色発光レンズ（tailLightMat連動で鮮やかに発光！）
        for (let s of [-1, 1]) {
            const brakeRed = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.115, 0.02), tailLightMat);
            brakeRed.position.set(s * 0.58, 0.55, -2.106);
            group.add(brakeRed);
        }

        // テールランプ外周ブラックトリムフレーム
        const tailFrame = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.145, 0.02), blackTrimMat);
        tailFrame.position.set(0, 0.55, -2.06);
        group.add(tailFrame);

        // 5.4 リアバンパー（ツートンアッパー＋ツートンロア）
        // バンパー上部（プライマリカラー）
        const rBumpUpper = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.14, 0.32), primaryMat);
        rBumpUpper.position.set(0, 0.44, -2.06);
        group.add(rBumpUpper);

        // バンパー下部（セカンダリカラー）
        const rBumpLower = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.18, 0.32), secondaryMat);
        rBumpLower.position.set(0, 0.28, -2.06);
        group.add(rBumpLower);

        // ナンバープレート凹部
        const plateRecess = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.20, 0.04), meshDarkMat);
        plateRecess.position.set(0, 0.32, -2.23);
        group.add(plateRecess);

        // 5.5 ドアミラー＆池谷仕様ナンバープレート（群馬 58 へ 11-052：凹部前面に鮮明露出）
        this.addSideMirrors(group, 0.76, 0.70, 0.55, primaryMat);
        this.addLicensePlates(group, '群馬 58 へ 11-052', 2.30, -2.255, 0.32, 0.30);

        // =====================================================================
        // 6. 90s JDM 深リム5スポーク星型ホイール＆ブレーキ露出
        // =====================================================================
        const wheelPositions = [
            { x: -0.73, y: 0.305, z: 1.25, isFront: true, isLeft: true },
            { x: 0.73, y: 0.305, z: 1.25, isFront: true, isLeft: false },
            { x: -0.73, y: 0.305, z: -1.25, isFront: false, isLeft: true },
            { x: 0.73, y: 0.305, z: -1.25, isFront: false, isLeft: false }
        ];

        // SSR フォーミュラメッシュ (ゴールドメッシュ + 鏡面ステップリム + 24本ピアスボルト)
        const ssrMeshRimMat = new THREE.MeshStandardMaterial({
            color: 0xd8b040,
            roughness: 0.22,
            metalness: 0.50
        });

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            ssrMeshRimMat,
            tireMat,
            'ssr_mesh',
            0.305,
            0.21,
            0x2a2a2e
        );

        // =====================================================================
        // 7. 大口径ステンレス砲弾スポーツマフラー＆ライティング
        // =====================================================================
        this.createDetailedExhaust(group, 0.52, 0.17, -1.82, 0.55, 0.16, -2.12, 0.075, 0.052, 0xcccccc);
        const exhaustPos = new THREE.Vector3(0.55, 0.16, -2.16);

        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.56, -2.25);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.52, 0.55, 2.18);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat: spokeMat },
            tailLPos: new THREE.Vector3(-0.58, 0.56, -2.13),
            tailRPos: new THREE.Vector3(0.58, 0.56, -2.13),
            rearWheelLPos: new THREE.Vector3(-0.83, 0.1, -1.25),
            rearWheelRPos: new THREE.Vector3(0.83, 0.1, -1.25),
            popups: [],
            headlightMats: [projBallMat],
            headlights: headlights
        };
    }

    // =========================================================================
    // =========================================================================
    // 5. TOYOTA CHASER Tourer V (JZX100)
    // =========================================================================
    static buildJZX100(col) {
        const group = new THREE.Group();

        // 1. レーシング・マテリアルパレット
        const primaryMat = new THREE.MeshStandardMaterial({ 
            color: col.primary, 
            roughness: 0.18, 
            metalness: 0.25 
        });
        const secondaryMat = new THREE.MeshStandardMaterial({ 
            color: col.secondary || 0x1a1a1e, 
            roughness: 0.35, 
            metalness: 0.20 
        });
        const hoodMat = new THREE.MeshStandardMaterial({ 
            color: col.hood || col.primary, 
            roughness: 0.22, 
            metalness: 0.25 
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({ 
            color: 0x18181b, 
            roughness: 0.65, 
            metalness: 0.15 
        });
        const interiorMat = new THREE.MeshStandardMaterial({ 
            color: 0x111114, 
            roughness: 0.95 
        });
        const glassMat = new THREE.MeshStandardMaterial({ 
            color: 0x0c1018, 
            roughness: 0.06, 
            metalness: 0.90, 
            transparent: true, 
            opacity: 0.88 
        });
        const amberLensMat = new THREE.MeshStandardMaterial({ 
            color: 0xff7700, 
            roughness: 0.15, 
            metalness: 0.10 
        });
        const clearLensMat = new THREE.MeshStandardMaterial({ 
            color: 0xf0f5ff, 
            roughness: 0.08, 
            metalness: 0.15, 
            transparent: true, 
            opacity: 0.55 
        });
        const projBallMat = new THREE.MeshStandardMaterial({ 
            color: 0x99ccff, 
            roughness: 0.10, 
            metalness: 0.80 
        });
        const hlReflectorMat = new THREE.MeshStandardMaterial({ 
            color: 0xf0f2f8, 
            roughness: 0.10, 
            metalness: 0.92 
        });
        const brakeRotorMat = new THREE.MeshStandardMaterial({ 
            color: 0x888c94, 
            roughness: 0.30, 
            metalness: 0.85 
        });
        const caliperMat = new THREE.MeshStandardMaterial({ 
            color: 0xd81111, 
            roughness: 0.25, 
            metalness: 0.25 
        });
        const spokeMat = new THREE.MeshStandardMaterial({ 
            color: col.rim || 0xd8aa30, 
            roughness: 0.22, 
            metalness: 0.45 
        });
        const polishedLipMat = new THREE.MeshStandardMaterial({ 
            color: 0xf4f6fa, 
            roughness: 0.10, 
            metalness: 0.60 
        });
        const tireMat = new THREE.MeshStandardMaterial({ 
            color: 0x18181a, 
            roughness: 0.92 
        });
        const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xdd0808 });
        const meshDarkMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0c });
        const chromeMat = new THREE.MeshStandardMaterial({ 
            color: 0xf5f7fb, 
            roughness: 0.08, 
            metalness: 0.80 
        });
        const titaniumTipMat = new THREE.MeshStandardMaterial({ 
            color: 0x2255bb, 
            roughness: 0.12, 
            metalness: 0.85 
        });
        const goldEmblemMat = new THREE.MeshStandardMaterial({ 
            color: 0xddaa22, 
            roughness: 0.18, 
            metalness: 0.75 
        });

        // =========================================================================
        // 2. 威風堂々たる大型4ドアスポーツセダンシャシー＆ボディ
        // =========================================================================
        // ホイールベース: 2.73m (前輪 z=1.38, 後輪 z=-1.35)
        // 2.1 メインアンダーフロア
        const lowerFloor = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.18, 4.46), secondaryMat);
        lowerFloor.position.set(0, 0.25, 0.02);
        lowerFloor.castShadow = true;
        group.add(lowerFloor);

        // エンジンルーム隔壁（視線抜けを完全遮断）
        const radiatorBulkhead = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.32, 0.10), blackTrimMat);
        radiatorBulkhead.position.set(0, 0.44, 2.05);
        group.add(radiatorBulkhead);

        // 2.2 4枚ドアセクション（前後ドアパーティング、サイドモール、4枚フラッシュドアハンドル）
        for (let s of [-1, 1]) {
            // ドアロアボディ
            const doorLower = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 1.88), primaryMat);
            doorLower.position.set(s * 0.83, 0.38, 0.02);
            group.add(doorLower);

            // エアロサイドスカート（純正ツアラーVサイドマッドガード）
            const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.11, 1.96), primaryMat);
            sideSkirt.position.set(s * 0.85, 0.21, 0.02);
            group.add(sideSkirt);

            // サイドスカート下部ブラックプロテクター
            const skirtLip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.03, 1.98), blackTrimMat);
            skirtLip.position.set(s * 0.875, 0.165, 0.02);
            group.add(skirtLip);

            // ドアアッパーボディ（ベルトラインまでしっかり立ち上げる）
            const doorUpper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 1.88), primaryMat);
            doorUpper.position.set(s * 0.83, 0.59, 0.02);
            group.add(doorUpper);

            // ★JZX100象徴：ボディ全周を走るブラックサイドプロテクションモール（ドア部）
            const doorMoulding = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.028, 1.88), blackTrimMat);
            doorMoulding.position.set(s * 0.872, 0.48, 0.02);
            group.add(doorMoulding);

            // 前後ドア分割パーティングライン
            const doorSeam = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.44, 0.015), blackTrimMat);
            doorSeam.position.set(s * 0.871, 0.48, 0.02);
            group.add(doorSeam);

            // 4枚フラッシュドアハンドル（フロント＆リア）
            const fHandle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.026, 0.085), primaryMat);
            fHandle.position.set(s * 0.873, 0.63, 0.48);
            group.add(fHandle);

            const rHandle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.026, 0.085), primaryMat);
            rHandle.position.set(s * 0.873, 0.63, -0.42);
            group.add(rHandle);

            // ウインドウ下部ウェザーストリップ（ドアショルダー部）
            const beltMould = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.022, 1.88), blackTrimMat);
            beltMould.position.set(s * 0.865, 0.705, 0.02);
            group.add(beltMould);
        }

        // 2.3 フロントフェンダー（ホイールハウス切り欠き＆ワイドフレアアーチ：前後完全連続）
        for (let s of [-1, 1]) {
            // フロントフェンダー上部（前ドアからライトまで隙間なく連続カバー）
            const fFenderUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.68), primaryMat);
            fFenderUpper.position.set(s * 0.83, 0.675, 1.38);
            group.add(fFenderUpper);

            // フロントワイドブリスターアーチフレア
            const fArchFlare = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.05, 0.70), primaryMat);
            fArchFlare.position.set(s * 0.875, 0.665, 1.38);
            group.add(fArchFlare);

            // フロントフェンダー下部・前方（バンパー結合部）
            const fFenderLowerFront = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.24, 0.38), primaryMat);
            fFenderLowerFront.position.set(s * 0.83, 0.39, 2.05);
            group.add(fFenderLowerFront);

            // フロントフェンダー下部・後方（前ドア結合部）
            const fFenderLowerRear = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.24, 0.26), primaryMat);
            fFenderLowerRear.position.set(s * 0.83, 0.39, 0.85);
            group.add(fFenderLowerRear);

            // フェンダー側面のブラックモール（前方延長）
const fMoulding = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.028, 0.38), blackTrimMat);
            fMoulding.position.set(s * 0.872, 0.48, 2.05);
            group.add(fMoulding);
        }

        // 2.4 リアフェンダー（大型セダン特有のスクエアショルダー＆ワイドリアアーチ：後ドアからテールまで完全連続）
        for (let s of [-1, 1]) {
            // リアフェンダー上部（後ドアからテールランプまで隙間なく完全カバー）
            const rFenderUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.68), primaryMat);
            rFenderUpper.position.set(s * 0.83, 0.68, -1.35);
            group.add(rFenderUpper);

            // リアワイドブリスターアーチフレア
            const rArchFlare = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.05, 0.70), primaryMat);
            rArchFlare.position.set(s * 0.875, 0.67, -1.35);
            group.add(rArchFlare);

            // リアフェンダー下部・前方（後ドア直後）
            const rFenderLowerFront = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.24, 0.26), primaryMat);
            rFenderLowerFront.position.set(s * 0.83, 0.39, -0.80);
            group.add(rFenderLowerFront);

            // リアフェンダー下部・後方（リアオーバーハング）
            const rFenderLowerRear = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.24, 0.48), primaryMat);
            rFenderLowerRear.position.set(s * 0.83, 0.39, -2.00);
            group.add(rFenderLowerRear);

            // フェンダー側面のブラックモール（後方延長）
const rMoulding = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.028, 0.48), blackTrimMat);
            rMoulding.position.set(s * 0.872, 0.48, -2.00);
            group.add(rMoulding);
        }

        // =========================================================================
        // 3. スタイリッシュな4ドアハードトップキャビン＆6ライトウィンドウ
        // =========================================================================
        // 3.1 遮光ダークインテリアコア（ウエストライン下に完全に収め、外へのはみ出しを完全解消）
        const interiorCore = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.26, 1.48), interiorMat);
        interiorCore.position.set(0, 0.48, -0.10);
        group.add(interiorCore);

        // 前席スポーツバケットシート（左右）
        for (let s of [-1, 1]) {
            const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.22, 0.12), blackTrimMat);
            headrest.position.set(s * 0.34, 0.84, 0.12);
            group.add(headrest);
        }
        // 後席ヘッドレスト（左右）
        for (let s of [-1, 1]) {
            const rHeadrest = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.12), blackTrimMat);
            rHeadrest.position.set(s * 0.36, 0.82, -0.68);
            group.add(rHeadrest);
        }

        // 3本スポーク・スポーツステアリング（右ハンドル仕様 x=0.32）
        const steering = new THREE.Mesh(
            new THREE.CylinderGeometry(0.115, 0.115, 0.022, 16),
            blackTrimMat
        );
        steering.rotation.x = 0.50;
        steering.position.set(0.32, 0.76, 0.46);
        group.add(steering);

        // ルームミラー
        const rViewMirror = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.038), blackTrimMat);
        rViewMirror.position.set(0, 0.99, 0.52);
        group.add(rViewMirror);

        // 3.2 薄型ルーフパネル（全高y=1.035m）
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.032, 1.34), primaryMat);
        roof.position.set(0, 1.035, -0.10);
        group.add(roof);

        // フロントルーフヘッダーモール
        const fHeader = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.024, 0.04), blackTrimMat);
        fHeader.position.set(0, 1.035, 0.55);
        group.add(fHeader);

        // リアルーフヘッダーモール
        const rHeader = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.024, 0.04), blackTrimMat);
        rHeader.position.set(0, 1.035, -0.75);
        group.add(rHeader);

        // ルーフドリップモール
        for (let s of [-1, 1]) {
            const dripRail = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.020, 1.34), blackTrimMat);
            dripRail.position.set(s * 0.712, 1.04, -0.10);
            group.add(dripRail);
        }

        // 3.3 スラント・フロントウインドウ＆スリムAピラー
        const fSlope = -0.56;
        const fWind = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.44, 0.032), glassMat);
        fWind.position.set(0, 0.84, 0.72);
        fWind.rotation.x = fSlope;
        group.add(fWind);

        // トップシェードバンド
        const fShade = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.08, 0.033), blackTrimMat);
        fShade.position.set(0, 0.97, 0.58);
        fShade.rotation.x = fSlope;
        group.add(fShade);

        // スリムAピラー
        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.44, 0.045), primaryMat);
            aPillar.position.set(s * 0.70, 0.84, 0.72);
            aPillar.rotation.x = fSlope;
            group.add(aPillar);

            const aSash = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.44, 0.046), blackTrimMat);
            aSash.position.set(s * 0.685, 0.84, 0.72);
            aSash.rotation.x = fSlope;
            group.add(aSash);
        }

        // カウルルーバー＆ワイパードレイ
        const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.030, 0.12), blackTrimMat);
        cowl.position.set(0, 0.68, 0.94);
        group.add(cowl);

        // 3.4 優美かつ重厚なCピラー＆リアウィンドウ
        const rSlope = 0.52;
        const rWind = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.44, 0.032), glassMat);
        rWind.position.set(0, 0.84, -0.92);
        rWind.rotation.x = rSlope;
        group.add(rWind);

        // 重厚なCピラー
        for (let s of [-1, 1]) {
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.44, 0.085), primaryMat);
            cPillar.position.set(s * 0.70, 0.84, -0.92);
            cPillar.rotation.x = rSlope;
            group.add(cPillar);
        }

        // 3.5 6ライト・サイドウィンドウ
        for (let s of [-1, 1]) {
            // フロントドアガラス
            const fDoorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.58), glassMat);
            fDoorGlass.position.set(s * 0.76, 0.84, 0.29);
            group.add(fDoorGlass);

            // センターBピラーサッシュ（ブラックアウト）
            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.33, 0.045), blackTrimMat);
            bPillar.position.set(s * 0.765, 0.84, 0.00);
            group.add(bPillar);

            // リアドアガラス
            const rDoorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.32, 0.48), glassMat);
            rDoorGlass.position.set(s * 0.76, 0.84, -0.24);
            group.add(rDoorGlass);

            // ★JZX100チェイサー特有のクォーター三角窓（Cピラーサッシュ＆キックアップ）
            const qPillarSash = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.30, 0.035), blackTrimMat);
            qPillarSash.position.set(s * 0.762, 0.84, -0.49);
            group.add(qPillarSash);

            const qGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.28), glassMat);
            qGlass.position.set(s * 0.755, 0.84, -0.64);
            group.add(qGlass);
        }

        // =========================================================================
        // 4. ツアラーV象徴：4灯マルチリフレクター＆専用フロントマスク
        // =========================================================================
        // 4.1 ロングボンネットフード（ツインプレスライン成型）
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.60, 0.035, 1.44), hoodMat);
        hood.position.set(0, 0.69, 1.68);
        hood.rotation.x = 0.028;
        group.add(hood);

        // ボンネット左右キャラクタープレスライン
        for (let s of [-1, 1]) {
            const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.015, 1.42), hoodMat);
            ridge.position.set(s * 0.42, 0.71, 1.68);
            ridge.rotation.x = 0.028;
            group.add(ridge);
        }

        // 4.2 ツアラーV専用フロントグリル＆ゴールド弓矢エンブレム
        const grillOuter = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.125, 0.05), chromeMat);
        grillOuter.position.set(0, 0.58, 2.38);
        group.add(grillOuter);

        const grillInner = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.105, 0.06), meshDarkMat);
        grillInner.position.set(0, 0.58, 2.385);
        group.add(grillInner);

        // 横スリットフィン（ツアラーVグリル）
        for (let j = -1; j <= 1; j++) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.015, 0.015), chromeMat);
            fin.position.set(0, 0.58 + j * 0.032, 2.415);
            group.add(fin);
        }

        // ★チェイサー伝統の「盾と弓矢」ゴールドクレストエンブレム
        const emblemBase = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.080, 0.018), goldEmblemMat);
        emblemBase.position.set(0, 0.58, 2.425);
        group.add(emblemBase);

        // 4.3 ★4灯マルチリフレクターヘッドライト＆回り込みコーナーランプ
        for (let s of [-1, 1]) {
            // クロームハウジング
            const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.13, 0.06), hlReflectorMat);
            hlHousing.position.set(s * 0.56, 0.58, 2.38);
            group.add(hlHousing);

            // 外周ブラックベゼル
            const hlFrame = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.14, 0.02), blackTrimMat);
            hlFrame.position.set(s * 0.56, 0.58, 2.36);
            group.add(hlFrame);

            // 外側：プロジェクターロービーム（クリアブルー眼球＋クロームリング）
            const projGeom = new THREE.CylinderGeometry(0.040, 0.040, 0.025, 16);
            projGeom.rotateX(Math.PI / 2);
            const proj = new THREE.Mesh(projGeom, projBallMat);
            proj.position.set(s * 0.65, 0.58, 2.41);
            group.add(proj);

            const projRing = new THREE.Mesh(new THREE.RingGeometry(0.038, 0.046, 16), chromeMat);
            projRing.position.set(s * 0.65, 0.58, 2.425);
            group.add(projRing);

            // 内側：ハイビーム（パラボラリフレクター＋バルブ）
            const hbGeom = new THREE.CylinderGeometry(0.042, 0.025, 0.025, 16);
            hbGeom.rotateX(Math.PI / 2);
            const hb = new THREE.Mesh(hbGeom, hlReflectorMat);
            hb.position.set(s * 0.46, 0.58, 2.41);
            group.add(hb);

            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), chromeMat);
            bulb.position.set(s * 0.46, 0.58, 2.42);
            group.add(bulb);

            // クリアガラスアウターレンズカバー
            const hlLens = new THREE.Mesh(new THREE.BoxGeometry(0.41, 0.125, 0.015), clearLensMat);
            hlLens.position.set(s * 0.56, 0.58, 2.435);
            group.add(hlLens);

            // 回り込みクリスタルコーナーマーカー（上段アンバー/下段クリア：奥にクロームバッカー）
            const cornerBacker = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.18), hlReflectorMat);
            cornerBacker.position.set(s * 0.80, 0.58, 2.32);
            group.add(cornerBacker);

            const cornerLamp = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.075, 0.20), amberLensMat);
            cornerLamp.position.set(s * 0.81, 0.605, 2.32);
            group.add(cornerLamp);

            const cornerClear = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.055, 0.20), clearLensMat);
            cornerClear.position.set(s * 0.81, 0.54, 2.32);
            group.add(cornerClear);
        }

        // 4.4 ツアラーV アグレッシブフロントエアロバンパー
        const fBumper = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.28, 0.38), primaryMat);
        fBumper.position.set(0, 0.40, 2.34);
        group.add(fBumper);

        // バンパーコーナーテーパー（フェンダーへ流麗に接続）
        for (let s of [-1, 1]) {
            const bCorner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.30), primaryMat);
            bCorner.position.set(s * 0.84, 0.40, 2.26);
            bCorner.rotation.y = s * -0.25;
            group.add(bCorner);
        }

        // 巨大台形センター冷却インテーク
        const fIntake = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.17, 0.08), meshDarkMat);
        fIntake.position.set(0, 0.31, 2.50);
        group.add(fIntake);

        // ★前置き大型アルミインタークーラー（1JZターボの証！冷却フィンマップ＋サイドタンク）
        const icMat = new THREE.MeshStandardMaterial({
            map: this.createIntercoolerTexture('1JZ'),
            metalness: 0.85,
            roughness: 0.30
        });
        const icCore = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.14, 0.03), icMat);
        icCore.position.set(0, 0.31, 2.53);
        group.add(icCore);

        // インタークーラー左右アルミ配管/サイドタンク＆エルボーパイピング
        for (let s of [-1, 1]) {
            const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.14, 12), chromeMat);
            tank.position.set(s * 0.44, 0.31, 2.53);
            group.add(tank);

            // 1JZ専用アルミインタークーラーパイピング
            const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.18, 12), chromeMat);
            pipe.rotateZ(s * 0.52);
            pipe.position.set(s * 0.48, 0.31, 2.45);
            group.add(pipe);
        }

        // バンパー左右プロジェクターフォグランプポッド
        for (let s of [-1, 1]) {
            const fogPod = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.09, 0.05), meshDarkMat);
            fogPod.position.set(s * 0.66, 0.31, 2.48);
            group.add(fogPod);

            const fogLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 12), clearLensMat);
            fogLamp.rotateX(Math.PI / 2);
            fogLamp.position.set(s * 0.66, 0.31, 2.51);
            group.add(fogLamp);
        }

        // フロントエアロチンスポイラー（フロントリップ＆コーナースプリッター）
        const fLip = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.045, 0.42), blackTrimMat);
        fLip.position.set(0, 0.18, 2.38);
        group.add(fLip);

        // =========================================================================
        // 5. 水平3段ワイドテールランプ＆ツアラーVリアエアロ
        // =========================================================================
        // 5.1 ハイデッキトランク
        const trunkDeck = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.035, 0.96), primaryMat);
        trunkDeck.position.set(0, 0.70, -1.68);
        group.add(trunkDeck);

        // トランク後端リップ
        const trunkLip = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.045, 0.12), primaryMat);
        trunkLip.position.set(0, 0.69, -2.18);
        group.add(trunkLip);

        // 5.2 純正ツアラーV フローティングリアウイングスポイラー（左右ウイングステー支持）
        for (let s of [-1, 1]) {
            const wingStrut = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 0.14), primaryMat);
            wingStrut.position.set(s * 0.66, 0.745, -2.12);
            group.add(wingStrut);
        }

        const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.038, 0.22), primaryMat);
        wingBlade.position.set(0, 0.79, -2.14);
        group.add(wingBlade);

        // スポイラーハイマウントストップランプ（フローティングウイング後端に美しく埋め込み）
        const highMount = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.016, 0.012), tailLightMat);
        highMount.position.set(0, 0.79, -2.252);
        group.add(highMount);

        // 5.3 ★JZX100象徴の水平3段ワイドテールランプ（高精細立体化＋ブレーキ発光連動）
        const jzxTailTex = this.createJZXTailTexture();
        const tailMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.70, 0.16, 0.05),
            new THREE.MeshBasicMaterial({ map: jzxTailTex })
        );
        tailMesh.position.set(0, 0.58, -2.28);
        group.add(tailMesh);

        // 左右アウターテール/ブレーキ赤色発光レンズ（tailLightMat連動で鮮やかに発光！）
        for (let s of [-1, 1]) {
            const brakeRed = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.02), tailLightMat);
            brakeRed.position.set(s * 0.61, 0.58, -2.306);
            group.add(brakeRed);
        }

        // テールランプ外周ブラックフレーム
        const tailFrame = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.175, 0.02), blackTrimMat);
        tailFrame.position.set(0, 0.58, -2.26);
        group.add(tailFrame);

        // トランク中央ガーニッシュ＆エンブレム
        const garnish = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.08, 0.02), primaryMat);
        garnish.position.set(0, 0.58, -2.31);
        group.add(garnish);

        const tourerBadge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.01), chromeMat);
        tourerBadge.position.set(0, 0.58, -2.325);
        group.add(tourerBadge);

        // 5.4 リアバンパー＆ライセンスプレート凹部
        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.28, 0.36), primaryMat);
        rBumper.position.set(0, 0.40, -2.24);
        group.add(rBumper);

        // ナンバープレート凹部
        const plateRecess = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.20, 0.04), meshDarkMat);
        plateRecess.position.set(0, 0.34, -2.425);
        group.add(plateRecess);

        // リアバンパー下部アンダースポイラー
        const rLip = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.05, 0.34), primaryMat);
        rLip.position.set(0, 0.20, -2.25);
        group.add(rLip);

        // 5.5 ドアミラー＆ナンバープレート（所沢 34 つ 77-889：フロントはバンパーノーズ、リアは凹部前面に鮮明露出）
        this.addSideMirrors(group, 0.82, 0.72, 0.75, primaryMat);
        this.addLicensePlates(group, '所沢 34 つ 77-889', 2.545, -2.455, 0.34, 0.44);

        // =========================================================================
        // 6. AVS Model 5風 深リムコンケイブ・5スプリットスポークアルミホイール
        // =========================================================================
        const wheelPositions = [
            { x: -0.76, y: 0.315, z: 1.38, isFront: true, isLeft: true },
            { x: 0.76, y: 0.315, z: 1.38, isFront: true, isLeft: false },
            { x: -0.76, y: 0.315, z: -1.35, isFront: false, isLeft: true },
            { x: 0.76, y: 0.315, z: -1.35, isFront: false, isLeft: false }
        ];

        // ヨコハマ AVS Model 5 (激コンケイブ・ツインV5スポーク・ハイパーシルバー)
        const avsRimMat = new THREE.MeshStandardMaterial({
            color: 0xe8ecf2,
            roughness: 0.14,
            metalness: 0.52
        });

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            avsRimMat,
            tireMat,
            'avs_model5',
            0.315,
            0.22,
            0xcc2222
        );

        // =========================================================================
        // 7. 1JZ極太・斜め跳ね上げ大口径砲弾マフラー＆ライティング
        // =========================================================================
        // 右リアバンパー下（x=0.62, y=0.18, z=-2.34）から斜め外向き・上向きに突き出すドリフト砲弾マフラー
        this.createDetailedExhaust(group, 0.58, 0.20, -2.02, 0.62, 0.18, -2.34, 0.095, 0.068, 0xd0d8e2);
        
        // チタン風ブルーグラデーションのテールエンドリング
        const tipRing = new THREE.Mesh(
            new THREE.CylinderGeometry(0.070, 0.070, 0.040, 16, 1, true),
            titaniumTipMat
        );
        tipRing.rotateX(Math.PI / 2);
        tipRing.position.set(0.62, 0.18, -2.37);
        group.add(tipRing);

        const exhaustPos = new THREE.Vector3(0.62, 0.18, -2.38);

        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.58, -2.48);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.56, 0.58, 2.45);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat: spokeMat },
            tailLPos: new THREE.Vector3(-0.61, 0.58, -2.31),
            tailRPos: new THREE.Vector3(0.61, 0.58, -2.31),
            rearWheelLPos: new THREE.Vector3(-0.87, 0.1, -1.35),
            rearWheelRPos: new THREE.Vector3(0.87, 0.1, -1.35),
            popups: [],
            headlightMats: [projBallMat],
            headlights: headlights
        };
    }

    // =========================================================================
    // 6. MITSUBISHI LANCER Evolution III GSR (CE9A)
    // =========================================================================
    static buildCE9A(col) {
        const group = new THREE.Group();

        // -------------------------------------------------------------------------
        // マテリアル定義（ピレネーブラック / スコーティアホワイト / ダンデライオンイエロー）
        // -------------------------------------------------------------------------
        const primaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.primary) || 0x16181b,
            roughness: 0.18,
            metalness: 0.16
        });
        const hoodMat = new THREE.MeshStandardMaterial({
            color: (col && col.hood) || 0x16181b,
            roughness: 0.18,
            metalness: 0.16
        });
        const secondaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.secondary) || 0x141416,
            roughness: 0.48,
            metalness: 0.15
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x0a141e,
            roughness: 0.04,
            metalness: 0.92,
            transparent: true,
            opacity: 0.88
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({
            color: 0x121214,
            roughness: 0.58,
            metalness: 0.10
        });
        const meshDarkMat = new THREE.MeshBasicMaterial({ color: 0x08080a });
        const intercoolerMat = new THREE.MeshStandardMaterial({
            color: 0xb0bac4,
            roughness: 0.22,
            metalness: 0.88
        });
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.06,
            metalness: 0.95
        });
        const clearLensMat = new THREE.MeshStandardMaterial({
            color: 0xf5f8fa,
            roughness: 0.08,
            metalness: 0.22,
            transparent: true,
            opacity: 0.82
        });
        const yellowFogLensMat = new THREE.MeshStandardMaterial({
            color: 0xffd000,
            emissive: 0xaa7700,
            emissiveIntensity: 0.45,
            roughness: 0.10,
            metalness: 0.15
        });
        const amberLensMat = new THREE.MeshStandardMaterial({
            color: 0xff7700,
            roughness: 0.15,
            metalness: 0.15
        });
        const tailLightMat = new THREE.MeshStandardMaterial({
            color: 0xee1111,
            emissive: 0x880808,
            emissiveIntensity: 0.45,
            roughness: 0.15,
            metalness: 0.10
        });
        const ozWheelMat = new THREE.MeshStandardMaterial({
            color: (col && col.rim) || 0xf6f7f8,
            roughness: 0.22,
            metalness: 0.25
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1c,
            roughness: 0.92
        });
        const interiorMat = new THREE.MeshStandardMaterial({
            color: 0x18181c,
            roughness: 0.85
        });
        const recaroMat = new THREE.MeshStandardMaterial({
            color: 0x222228,
            roughness: 0.88
        });

        // 1. シャシー＆アンダーフロア
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.08, 4.10), secondaryMat);
        floor.position.set(0, 0.14, 0.0);
        group.add(floor);

        // 2. フロントバンパー＆アグレッシブエアロ（エボIII象徴の大開口部＆丸型フォグ）
        const fMainBumper = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.28, 0.36), primaryMat);
        fMainBumper.position.set(0, 0.32, 1.94);
        group.add(fMainBumper);

        const fLip = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.045, 0.38), secondaryMat);
        fLip.position.set(0, 0.14, 1.96);
        group.add(fLip);

        // 中央大口径インタークーラーインテーク開口部
        const icOpening = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.18, 0.08), meshDarkMat);
        icOpening.position.set(0, 0.27, 2.11);
        group.add(icOpening);

        const icCore = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.05), intercoolerMat);
        icCore.position.set(0, 0.27, 2.09);
        group.add(icCore);

        for (let i = -2; i <= 2; i++) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.008, 0.01), blackTrimMat);
            bar.position.set(0, 0.27 + i * 0.032, 2.12);
            group.add(bar);
        }

        // 左右丸型フォグランプベゼル＆イエロー補助灯
        for (let s of [-1, 1]) {
            const fogPod = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.06, 16), blackTrimMat);
            fogPod.rotateX(Math.PI / 2);
            fogPod.position.set(s * 0.52, 0.28, 2.10);
            group.add(fogPod);

            const fogLens = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.078, 0.02, 16), yellowFogLensMat);
            fogLens.rotateX(Math.PI / 2);
            fogLens.position.set(s * 0.52, 0.28, 2.13);
            group.add(fogLens);

            const brakeDuct = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.05), meshDarkMat);
            brakeDuct.position.set(s * 0.70, 0.26, 2.06);
            group.add(brakeDuct);
        }

        // 3. フロントグリル＆ヘッドライト＆エンブレム
        const upperGrille = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.09, 0.05), meshDarkMat);
        upperGrille.position.set(0, 0.54, 2.04);
        group.add(upperGrille);

        const mitsuTex = this.createMitsubishiEmblemTexture();
        const mitsuBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.065, 0.065), new THREE.MeshBasicMaterial({ map: mitsuTex, transparent: true }));
        mitsuBadge.position.set(0, 0.54, 2.072);
        group.add(mitsuBadge);

        const evoBadge = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.02, 0.01), chromeMat);
        evoBadge.position.set(0.22, 0.53, 2.072);
        group.add(evoBadge);

        const headlightMats = [];
        for (let s of [-1, 1]) {
            const hlFrame = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.05), blackTrimMat);
            hlFrame.position.set(s * 0.52, 0.54, 2.02);
            group.add(hlFrame);

            const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.02), chromeMat);
            reflector.position.set(s * 0.50, 0.54, 2.035);
            group.add(reflector);

            const hlBulbMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xfffae0,
                emissiveIntensity: 2.2,
                roughness: 0.1
            });
            headlightMats.push(hlBulbMat);
            const hlBulb = new THREE.Mesh(new THREE.SphereGeometry(0.032, 12, 12), hlBulbMat);
            hlBulb.position.set(s * 0.50, 0.54, 2.045);
            group.add(hlBulb);

            const outerLens = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.10), clearLensMat);
            outerLens.position.set(s * 0.50, 0.54, 2.058);
            group.add(outerLens);

            const cornerSignal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.10, 0.14), amberLensMat);
            cornerSignal.position.set(s * 0.70, 0.54, 1.96);
            group.add(cornerSignal);
        }

        // 4. フロントフェンダー（ホイールアーチ上部・側面を完全にカバー）
        for (let s of [-1, 1]) {
            // フロントフェンダー上部（フード側面からヘッドライト、ドアまで完全に埋める）
            const fFenderTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.66), primaryMat);
            fFenderTop.position.set(s * 0.75, 0.66, 1.25);
            group.add(fFenderTop);

            // ホイールアーチフレア
            const fArch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.68), primaryMat);
            fArch.position.set(s * 0.83, 0.645, 1.25);
            group.add(fArch);

            // ドアパネル
            const doorSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 1.25), primaryMat);
            doorSide.position.set(s * 0.78, 0.50, 0.0);
            group.add(doorSide);

            // リアフェンダー
            const rFenderTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.66), primaryMat);
            rFenderTop.position.set(s * 0.75, 0.66, -1.25);
            group.add(rFenderTop);

            const rArch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.68), primaryMat);
            rArch.position.set(s * 0.83, 0.645, -1.25);
            group.add(rArch);

            const rQuarter = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.30, 0.26), primaryMat);
            rQuarter.position.set(s * 0.75, 0.48, -1.94);
            group.add(rQuarter);

            // サイドステップ
            const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 1.85), primaryMat);
            sideSkirt.position.set(s * 0.81, 0.16, 0.0);
            group.add(sideSkirt);

            // モール
            const rubStrip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 1.55), blackTrimMat);
            rubStrip.position.set(s * 0.84, 0.44, 0.0);
            group.add(rubStrip);
        }

        // 5. ボンネット（巨大中央排熱ルーバー＆非対称NACAダクト）
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.045, 1.28), hoodMat);
        hood.position.set(0, 0.63, 1.28);
        hood.rotation.x = 0.065;
        group.add(hood);

        const hoodVentOpening = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.03, 0.34), meshDarkMat);
        hoodVentOpening.position.set(0, 0.645, 1.26);
        hoodVentOpening.rotation.x = 0.065;
        group.add(hoodVentOpening);

        for (let b = -1.5; b <= 1.5; b++) {
            const louver = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.015, 0.055), blackTrimMat);
            louver.position.set(0, 0.652, 1.26 + b * 0.075);
            louver.rotation.x = 0.28;
            group.add(louver);
        }

        const naca = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.18), meshDarkMat);
        naca.position.set(0.35, 0.66, 1.38);
        naca.rotation.x = 0.065;
        group.add(naca);

        // 6. キャビン・グリーンハウス・ルーフ・ピラー（4ドアセダンシルエット）
        const cabinLower = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.38, 2.25), primaryMat);
        cabinLower.position.set(0, 0.44, -0.05);
        group.add(cabinLower);

        const dash = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.20, 0.40), interiorMat);
        dash.position.set(0, 0.70, 0.44);
        group.add(dash);

        const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.016, 10, 20), blackTrimMat);
        wheelRim.position.set(0.34, 0.74, 0.26);
        wheelRim.rotation.x = 0.35;
        group.add(wheelRim);

        for (let s of [-1, 1]) {
            const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.46), recaroMat);
            seatBase.position.set(s * 0.34, 0.32, -0.08);
            group.add(seatBase);

            const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.46, 0.12), recaroMat);
            seatBack.position.set(s * 0.34, 0.60, -0.30);
            seatBack.rotation.x = -0.12;
            group.add(seatBack);
        }

        // フロントガラス＆Aピラー
        const fSlope = -0.58;
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.48, 0.035), glassMat);
        windshield.position.set(0, 0.94, 0.32);
        windshield.rotation.x = fSlope;
        group.add(windshield);

        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.04), primaryMat);
            aPillar.position.set(s * 0.71, 0.94, 0.32);
            aPillar.rotation.x = fSlope;
            group.add(aPillar);
        }

        // ルーフパネル
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.035, 1.15), primaryMat);
        roof.position.set(0, 1.18, -0.25);
        group.add(roof);

        // サイドウィンドウ＆Bピラー
        for (let s of [-1, 1]) {
            const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.36, 1.25), glassMat);
            sideGlass.position.set(s * 0.70, 0.96, -0.25);
            group.add(sideGlass);

            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.38, 0.07), blackTrimMat);
            bPillar.position.set(s * 0.705, 0.96, -0.22);
            group.add(bPillar);
        }

        // スラントリアウィンドウ＆一体化Cピラー（ルーフからトランクへ正しく滑らかに結合）
        const rSlope = 0.52;
        const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.44, 0.035), glassMat);
        rearGlass.position.set(0, 0.96, -0.88);
        rearGlass.rotation.x = rSlope;
        group.add(rearGlass);

        for (let s of [-1, 1]) {
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.44, 0.05), primaryMat);
            cPillar.position.set(s * 0.69, 0.96, -0.88);
            cPillar.rotation.x = rSlope;
            group.add(cPillar);
        }

        this.addSideMirrors(group, 0.84, 0.70, 0.60, primaryMat);

        // 7. トランク＆伝説のエボIII特大2段ハイマウントリアスポイラー
        const trunkDeck = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.045, 0.80), primaryMat);
        trunkDeck.position.set(0, 0.72, -1.55);
        group.add(trunkDeck);

        const trunkRearFace = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.20, 0.10), primaryMat);
        trunkRearFace.position.set(0, 0.60, -1.94);
        group.add(trunkRearFace);

        for (let s of [-1, 1]) {
            const endPlate = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.38, 0.42), primaryMat);
            endPlate.position.set(s * 0.68, 0.92, -1.82);
            group.add(endPlate);
        }

        const centerPillar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.20), primaryMat);
        centerPillar.position.set(0, 0.92, -1.84);
        group.add(centerPillar);

        const mainBlade = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.038, 0.28), primaryMat);
        mainBlade.position.set(0, 1.10, -1.84);
        mainBlade.rotation.x = -0.05;
        group.add(mainBlade);

        const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.025, 0.14), primaryMat);
        lowerLip.position.set(0, 0.74, -1.90);
        group.add(lowerLip);

        // 8. リアテールランプ＆バンパー＆エンブレム＆エキゾースト
        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.32, 0.32), primaryMat);
        rBumper.position.set(0, 0.34, -1.94);
        group.add(rBumper);

        const rLowerDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.06, 0.32), secondaryMat);
        rLowerDiffuser.position.set(0, 0.15, -1.95);
        group.add(rLowerDiffuser);

        const ce9aTailTex = this.createCE9ATailTexture();
        const tailMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.56, 0.13, 0.04),
            new THREE.MeshBasicMaterial({ map: ce9aTailTex })
        );
        tailMesh.position.set(0, 0.58, -2.02);
        group.add(tailMesh);

        for (let s of [-1, 1]) {
            const brakeMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.11, 0.02), tailLightMat);
            brakeMesh.position.set(s * 0.48, 0.58, -2.035);
            group.add(brakeMesh);
        }

        const rEvoBadge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.01), chromeMat);
        rEvoBadge.position.set(0.46, 0.66, -1.98);
        group.add(rEvoBadge);

        this.addLicensePlates(group, '群馬 33 さ 44-555', 2.13, -2.11, 0.34, 0.42, 0);

        // 9. OZ Racing ラリーターマックホイール＆ブレーキ（ツライチ・ハミタイ完全解消）
        const wheelRadius = 0.305;
        const wheelWidth = 0.20;
        const wheelPositions = [
            { x: -0.73, y: wheelRadius, z: 1.25, isFront: true, isLeft: true },
            { x: 0.73, y: wheelRadius, z: 1.25, isFront: true, isLeft: false },
            { x: -0.73, y: wheelRadius, z: -1.25, isFront: false, isLeft: true },
            { x: 0.73, y: wheelRadius, z: -1.25, isFront: false, isLeft: false }
        ];

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            ozWheelMat,
            tireMat,
            'oz',
            wheelRadius,
            wheelWidth,
            0xcc1111
        );

        // 10. 大口径ステンレスラリーエキゾースト＆ライティング
        this.createDetailedExhaust(group, 0.54, 0.20, -1.82, 0.56, 0.17, -2.04, 0.085, 0.062, 0xe0e6ed);
        const exhaustPos = new THREE.Vector3(0.56, 0.17, -2.06);

        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.58, -2.06);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.50, 0.54, 2.06);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat: ozWheelMat },
            tailLPos: new THREE.Vector3(-0.48, 0.58, -2.04),
            tailRPos: new THREE.Vector3(0.48, 0.58, -2.04),
            rearWheelLPos: new THREE.Vector3(-0.79, 0.1, -1.25),
            rearWheelRPos: new THREE.Vector3(0.79, 0.1, -1.25),
            popups: [],
            headlightMats: headlightMats,
            headlights: headlights
        };
    }

    // =========================================================================
    // 7. HONDA CIVIC Type R (EK9)
    // =========================================================================
    static buildEK9(col) {
        const group = new THREE.Group();

        // -------------------------------------------------------------------------
        // マテリアル定義（チャンピオンシップホワイト / ボーグシルバー / サンライトイエロー）
        // -------------------------------------------------------------------------
        const primaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.primary) || 0xf3f2ea,
            roughness: 0.16,
            metalness: 0.12
        });
        const hoodMat = new THREE.MeshStandardMaterial({
            color: (col && col.hood) || 0xf3f2ea,
            roughness: 0.16,
            metalness: 0.12
        });
        const secondaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.secondary) || 0x141416,
            roughness: 0.52,
            metalness: 0.12
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x081018,
            roughness: 0.04,
            metalness: 0.94,
            transparent: true,
            opacity: 0.88
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({
            color: 0x121214,
            roughness: 0.60,
            metalness: 0.10
        });
        const meshDarkMat = new THREE.MeshBasicMaterial({ color: 0x060608 });
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.06,
            metalness: 0.95
        });
        const smokedLensMat = new THREE.MeshStandardMaterial({
            color: 0xd8e0e8,
            roughness: 0.08,
            metalness: 0.32,
            transparent: true,
            opacity: 0.84
        });
        const amberLensMat = new THREE.MeshStandardMaterial({
            color: 0xff7700,
            roughness: 0.15,
            metalness: 0.15
        });
        const tailLightMat = new THREE.MeshStandardMaterial({
            color: 0xee1111,
            emissive: 0x880808,
            emissiveIntensity: 0.45,
            roughness: 0.15,
            metalness: 0.10
        });
        const typeRWheelMat = new THREE.MeshStandardMaterial({
            color: (col && col.rim) || 0xf4f3ec,
            roughness: 0.20,
            metalness: 0.28
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1c,
            roughness: 0.92
        });
        const interiorMat = new THREE.MeshStandardMaterial({
            color: 0x16161a,
            roughness: 0.85
        });
        const redRecaroMat = new THREE.MeshStandardMaterial({
            color: 0xd01020, // 鮮烈な赤レカロ！
            roughness: 0.80
        });
        const titaniumMat = new THREE.MeshStandardMaterial({
            color: 0xc8c0aa,
            roughness: 0.22,
            metalness: 0.85
        });

        // 1. シャシー＆フロア
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.08, 3.96), secondaryMat);
        floor.position.set(0, 0.14, 0.0);
        group.add(floor);

        // 2. フロントバンパー＆Type R チンスポイラー＆グリル（赤バッジ「赤H」）
        const fMainBumper = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.26, 0.34), primaryMat);
        fMainBumper.position.set(0, 0.32, 1.86);
        group.add(fMainBumper);

        const fLip = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.045, 0.36), primaryMat);
        fLip.position.set(0, 0.13, 1.88);
        group.add(fLip);

        const lowerIntake = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.12, 0.06), meshDarkMat);
        lowerIntake.position.set(0, 0.24, 2.02);
        group.add(lowerIntake);

        const upperGrille = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.05), meshDarkMat);
        upperGrille.position.set(0, 0.52, 1.96);
        group.add(upperGrille);

        const grilleFrame = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.095, 0.02), chromeMat);
        grilleFrame.position.set(0, 0.52, 1.95);
        group.add(grilleFrame);

        const hondaRedTex = this.createHondaRedBadgeTexture();
        const redBadgeFront = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.062), new THREE.MeshBasicMaterial({ map: hondaRedTex, transparent: true }));
        redBadgeFront.position.set(0, 0.52, 1.992);
        group.add(redBadgeFront);

        // 3. スモーク調マルチリフレクターヘッドライト
        const headlightMats = [];
        for (let s of [-1, 1]) {
            const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.11, 0.06), blackTrimMat);
            hlHousing.position.set(s * 0.52, 0.53, 1.94);
            group.add(hlHousing);

            const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.02), chromeMat);
            reflector.position.set(s * 0.49, 0.53, 1.955);
            group.add(reflector);

            const hlBulbMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xfffae6,
                emissiveIntensity: 2.2,
                roughness: 0.1
            });
            headlightMats.push(hlBulbMat);
            const hlBulb = new THREE.Mesh(new THREE.SphereGeometry(0.030, 12, 12), hlBulbMat);
            hlBulb.position.set(s * 0.49, 0.53, 1.965);
            group.add(hlBulb);

            const outerLens = new THREE.Mesh(new THREE.PlaneGeometry(0.23, 0.095), smokedLensMat);
            outerLens.position.set(s * 0.49, 0.53, 1.978);
            group.add(outerLens);

            const cornerSignal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.095, 0.14), amberLensMat);
            cornerSignal.position.set(s * 0.68, 0.53, 1.88);
            group.add(cornerSignal);
        }

        // 4. フロントフェンダー＆サイドボディ（ホイールアーチとボディ隙間を完全に埋める）
        for (let s of [-1, 1]) {
            // フロントフェンダー上部
            const fFenderTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.66), primaryMat);
            fFenderTop.position.set(s * 0.75, 0.66, 1.20);
            group.add(fFenderTop);

            const fArch = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.68), primaryMat);
            fArch.position.set(s * 0.82, 0.645, 1.20);
            group.add(fArch);

            // ドアパネル
            const doorSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 1.20), primaryMat);
            doorSide.position.set(s * 0.77, 0.48, 0.0);
            group.add(doorSide);

            // リアフェンダー
            const rFenderTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.66), primaryMat);
            rFenderTop.position.set(s * 0.75, 0.66, -1.20);
            group.add(rFenderTop);

            const rArch = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.68), primaryMat);
            rArch.position.set(s * 0.82, 0.645, -1.20);
            group.add(rArch);

            const rQuarter = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.30, 0.24), primaryMat);
            rQuarter.position.set(s * 0.75, 0.47, -1.68);
            group.add(rQuarter);

            // サイドステップ
            const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.10, 1.65), primaryMat);
            sideSkirt.position.set(s * 0.80, 0.15, 0.0);
            group.add(sideSkirt);

            const rubStrip = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.035, 1.48), primaryMat);
            rubStrip.position.set(s * 0.84, 0.42, 0.0);
            group.add(rubStrip);
        }

        // 5. ボンネット
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.04, 1.22), hoodMat);
        hood.position.set(0, 0.62, 1.24);
        hood.rotation.x = 0.078;
        group.add(hood);

        // 6. キャビン・グリーンハウス＆鮮烈な赤レカロシート内装
        const cabinLower = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.36, 2.10), primaryMat);
        cabinLower.position.set(0, 0.42, -0.05);
        group.add(cabinLower);

        const dash = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.18, 0.36), interiorMat);
        dash.position.set(0, 0.66, 0.40);
        group.add(dash);

        const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.015, 10, 20), blackTrimMat);
        wheelRim.position.set(0.34, 0.70, 0.24);
        wheelRim.rotation.x = 0.35;
        group.add(wheelRim);

        const shiftKnob = new THREE.Mesh(new THREE.SphereGeometry(0.020, 12, 12), titaniumMat);
        shiftKnob.position.set(0.08, 0.50, 0.12);
        group.add(shiftKnob);

        // 鮮烈な赤レカロセミバケットシート2脚
        for (let s of [-1, 1]) {
            const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.14, 0.44), redRecaroMat);
            seatBase.position.set(s * 0.34, 0.30, -0.08);
            group.add(seatBase);

            const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.12), redRecaroMat);
            seatBack.position.set(s * 0.34, 0.56, -0.26);
            seatBack.rotation.x = -0.14;
            group.add(seatBack);

            const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.13, 0.08), redRecaroMat);
            headrest.position.set(s * 0.34, 0.80, -0.30);
            group.add(headrest);
        }

        // フロントガラス＆Aピラー
        const ekSlope = -0.58;
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.48, 0.035), glassMat);
        windshield.position.set(0, 0.92, 0.26);
        windshield.rotation.x = ekSlope;
        group.add(windshield);

        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.48, 0.04), primaryMat);
            aPillar.position.set(s * 0.70, 0.92, 0.26);
            aPillar.rotation.x = ekSlope;
            group.add(aPillar);
        }

        // ハッチバックロングキャビンルーフ
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.035, 1.24), primaryMat);
        roof.position.set(0, 1.14, -0.32);
        group.add(roof);

        // サイドウィンドウ＆Bピラー
        for (let s of [-1, 1]) {
            const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.34, 1.24), glassMat);
            sideGlass.position.set(s * 0.69, 0.94, -0.32);
            group.add(sideGlass);

            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.36, 0.06), blackTrimMat);
            bPillar.position.set(s * 0.695, 0.94, -0.15);
            group.add(bPillar);
        }

        // ハッチバック急傾斜リアウィンドウ＆一体化Cピラー
        // ルーフ後端（z = -0.94, y = 1.14）からテールゲート（z = -1.48, y = 0.70）へ美しい傾斜で直結
        const hSlope = 0.90;
        const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.70, 0.035), glassMat);
        rearGlass.position.set(0, 0.92, -1.205);
        rearGlass.rotation.x = hSlope;
        group.add(rearGlass);

        for (let s of [-1, 1]) {
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.70, 0.06), primaryMat);
            cPillar.position.set(s * 0.67, 0.92, -1.205);
            cPillar.rotation.x = hSlope;
            group.add(cPillar);
        }

        this.addSideMirrors(group, 0.83, 0.66, 0.50, primaryMat);

        // 7. ハッチバック後端＆Type R ルーフスポイラー
        // ルーフ後端上部から後方へ鋭く突き出すType R専用ハイマウントスポイラー
        for (let s of [-1, 1]) {
            const wingStay = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.10, 0.18), primaryMat);
            wingStay.position.set(s * 0.52, 1.17, -0.98);
            wingStay.rotation.x = -0.12;
            group.add(wingStay);

            const wingEnd = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.09, 0.22), primaryMat);
            wingEnd.position.set(s * 0.68, 1.21, -1.06);
            wingEnd.rotation.x = -0.12;
            group.add(wingEnd);
        }

        const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.035, 0.22), primaryMat);
        wingBlade.position.set(0, 1.21, -1.06);
        wingBlade.rotation.x = -0.12;
        group.add(wingBlade);

        // 8. リアテールゲート＆バンパー＆エンブレム＆エキゾースト
        const hatchMid = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.24, 0.26), primaryMat);
        hatchMid.position.set(0, 0.60, -1.58);
        hatchMid.rotation.x = 0.40;
        group.add(hatchMid);

        const hatchRearFace = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.24, 0.10), primaryMat);
        hatchRearFace.position.set(0, 0.48, -1.71);
        group.add(hatchRearFace);

        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.30, 0.24), primaryMat);
        rBumper.position.set(0, 0.30, -1.74);
        group.add(rBumper);

        const rLip = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.045, 0.26), primaryMat);
        rLip.position.set(0, 0.13, -1.75);
        group.add(rLip);

        const ek9TailTex = this.createEK9TailTexture();
        const ek9TailMat = new THREE.MeshBasicMaterial({ map: ek9TailTex });

        for (let s of [-1, 1]) {
            const tailUnit = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.04), ek9TailMat);
            tailUnit.position.set(s * 0.68, 0.54, -1.75);
            group.add(tailUnit);

            const brakeRed = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.02), tailLightMat);
            brakeRed.position.set(s * 0.68, 0.47, -1.765);
            group.add(brakeRed);
        }

        const redBadgeRear = new THREE.Mesh(new THREE.PlaneGeometry(0.062, 0.062), new THREE.MeshBasicMaterial({ map: hondaRedTex, transparent: true }));
        redBadgeRear.rotation.y = Math.PI;
        redBadgeRear.position.set(0, 0.58, -1.765);
        group.add(redBadgeRear);

        const civicBadge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.01), chromeMat);
        civicBadge.position.set(-0.36, 0.58, -1.765);
        group.add(civicBadge);

        this.addLicensePlates(group, '栃木 58 け 23-110', 2.03, -1.87, 0.28, 0.38, 0);

        // 9. Type R 専用 7スポーク チャンピオンシップホワイトホイール
        const wheelRadius = 0.31;
        const wheelWidth = 0.20;
        const wheelPositions = [
            { x: -0.73, y: wheelRadius, z: 1.20, isFront: true, isLeft: true },
            { x: 0.73, y: wheelRadius, z: 1.20, isFront: true, isLeft: false },
            { x: -0.73, y: wheelRadius, z: -1.20, isFront: false, isLeft: true },
            { x: 0.73, y: wheelRadius, z: -1.20, isFront: false, isLeft: false }
        ];

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            typeRWheelMat,
            tireMat,
            'type_r',
            wheelRadius,
            wheelWidth,
            0x222228
        );

        // 10. 高回転NAスポーツ砲弾マフラー＆ライティング
        this.createDetailedExhaust(group, 0.52, 0.18, -1.60, 0.54, 0.15, -1.82, 0.075, 0.052, 0xe2e6ea);
        const exhaustPos = new THREE.Vector3(0.54, 0.15, -1.84);

        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.52, -1.80);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.49, 0.53, 2.04);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat: typeRWheelMat },
            tailLPos: new THREE.Vector3(-0.68, 0.47, -1.74),
            tailRPos: new THREE.Vector3(0.68, 0.47, -1.74),
            rearWheelLPos: new THREE.Vector3(-0.79, 0.1, -1.20),
            rearWheelRPos: new THREE.Vector3(0.79, 0.1, -1.20),
            popups: [],
            headlightMats: headlightMats,
            headlights: headlights
        };
    }

    // =========================================================================
    // 8. NISSAN 180SX TYPE X (RPS13)
    // =========================================================================
    static build180SX(col) {
        const group = new THREE.Group();

        // -------------------------------------------------------------------------
        // マテリアル定義（ウォームホワイト / ミッドナイトパープル / スーパーブラック）
        // -------------------------------------------------------------------------
        const primaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.primary) || 0xf0efea,
            roughness: 0.18,
            metalness: 0.16
        });
        const hoodMat = new THREE.MeshStandardMaterial({
            color: (col && col.hood) || 0xf0efea,
            roughness: 0.18,
            metalness: 0.16
        });
        const secondaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.secondary) || 0x181818,
            roughness: 0.45,
            metalness: 0.15
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x0a141e,
            roughness: 0.04,
            metalness: 0.92,
            transparent: true,
            opacity: 0.88
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({
            color: 0x121214,
            roughness: 0.58,
            metalness: 0.10
        });
        const meshDarkMat = new THREE.MeshBasicMaterial({ color: 0x08080a });
        const intercoolerMat = new THREE.MeshStandardMaterial({
            color: 0xa8b4c0,
            roughness: 0.25,
            metalness: 0.85
        });
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.06,
            metalness: 0.95
        });
        const amberLensMat = new THREE.MeshStandardMaterial({
            color: 0xff7700,
            roughness: 0.15,
            metalness: 0.15
        });
        const clearLensMat = new THREE.MeshStandardMaterial({
            color: 0xf5f8fa,
            roughness: 0.08,
            metalness: 0.20,
            transparent: true,
            opacity: 0.82
        });
        const tailLightMat = new THREE.MeshStandardMaterial({
            color: 0xee1111,
            emissive: 0x880808,
            emissiveIntensity: 0.45,
            roughness: 0.15,
            metalness: 0.10
        });
        const wheelMat = new THREE.MeshStandardMaterial({
            color: (col && col.rim) || 0xd0d4d8,
            roughness: 0.22,
            metalness: 0.50
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1c,
            roughness: 0.92
        });
        const interiorMat = new THREE.MeshStandardMaterial({
            color: 0x18181c,
            roughness: 0.85
        });
        const seatMat = new THREE.MeshStandardMaterial({
            color: 0x222228,
            roughness: 0.88
        });

        // 1. シャシー＆アンダーフロア
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.08, 4.25), secondaryMat);
        floor.position.set(0, 0.14, 0.0);
        group.add(floor);

        // 2. Type X フロントバンパー＆リップ＆インテーク（ウェッジシェイプ）
        const fMainBumper = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.26, 0.30), primaryMat);
        fMainBumper.position.set(0, 0.29, 1.98);
        group.add(fMainBumper);

        const fLip = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.045, 0.20), secondaryMat);
        fLip.position.set(0, 0.13, 2.01);
        group.add(fLip);

        // Type X 中央大開口インタークーラーインテーク
        const intake = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.13, 0.06), meshDarkMat);
        intake.position.set(0, 0.24, 2.10);
        group.add(intake);

        const ic = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.10, 0.04), intercoolerMat);
        ic.position.set(0, 0.24, 2.08);
        group.add(ic);

        for (let i = -1; i <= 1; i++) {
            const bar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.008, 0.01), blackTrimMat);
            bar.position.set(0, 0.24 + i * 0.035, 2.105);
            group.add(bar);
        }

        // Type X 左右ブレーキ冷却ダクト
        for (let s of [-1, 1]) {
            const brakeDuct = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.06), meshDarkMat);
            brakeDuct.position.set(s * 0.54, 0.23, 2.09);
            group.add(brakeDuct);

            // フロントコンビネーションランプ（外側アンバー / 内側クリアポジション）
            const lampHousing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.065, 0.04), blackTrimMat);
            lampHousing.position.set(s * 0.60, 0.36, 2.10);
            group.add(lampHousing);

            const amberPart = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.055, 0.02), amberLensMat);
            amberPart.position.set(s * 0.67, 0.36, 2.118);
            group.add(amberPart);

            const clearPart = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.055, 0.02), clearLensMat);
            clearPart.position.set(s * 0.55, 0.36, 2.118);
            group.add(clearPart);
        }

        // ノーズ前端パネル（リトラとバンパーをつなぐ滑らかなスラントノーズ）
        const fNoseTop = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.12, 0.38), primaryMat);
        fNoseTop.position.set(0, 0.49, 1.98);
        group.add(fNoseTop);

        // 3. リトラクタブルヘッドライトユニット（後端ヒンジ回転・開閉連動）
        const popups = [];
        const headlightMats = [];

        for (let s of [-1, 1]) {
            const pivotGroup = new THREE.Group();
            // 後端ヒンジ位置
            pivotGroup.position.set(s * 0.49, 0.575, 1.45);

            const unit = new THREE.Group();
            pivotGroup.add(unit);

            // トップリッド（ボディ塗装色）
            const lid = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.024, 0.35), primaryMat);
            lid.position.set(0, -0.012, 0.175);
            unit.add(lid);

            const seamF = new THREE.Mesh(new THREE.BoxGeometry(0.352, 0.026, 0.01), blackTrimMat);
            seamF.position.set(0, -0.012, 0.35);
            unit.add(seamF);

            // ブラックハウジングバケット
            const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.12, 0.33), blackTrimMat);
            housing.position.set(0, -0.075, 0.165);
            unit.add(housing);

            // クロームベゼル
            const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.095, 0.02), chromeMat);
            bezel.position.set(0, -0.065, 0.33);
            unit.add(bezel);

            // 高輝度角型ヘッドライト発光レンズ
            const hlBulbMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xfffae0,
                emissiveIntensity: 2.5,
                roughness: 0.08,
                metalness: 0.15
            });
            headlightMats.push(hlBulbMat);

            const hlBulb = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.078, 0.015), hlBulbMat);
            hlBulb.position.set(0, -0.065, 0.34);
            unit.add(hlBulb);

            // 初期角度：夜間デフォルト展開（オープン: -0.28 rad）
            // 格納時は 0.075 rad（フード傾斜と完全ツライチ）
            unit.rotation.x = -0.28;

            group.add(pivotGroup);

            popups.push({
                pivotGroup: pivotGroup,
                unit: unit,
                closedAngle: 0.075,
                openAngle: -0.28,
                posYOpen: 0.67,
                posYClosed: 0.55
            });
        }

        // 4. フロントフェンダー＆サイドボディ＆モール
        for (let s of [-1, 1]) {
            // フロントフェンダー上部（ホイールアーチとフードの間を完全に埋める）
            const fFenderTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.66), primaryMat);
            fFenderTop.position.set(s * 0.75, 0.65, 1.22);
            group.add(fFenderTop);

            const fArch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.68), primaryMat);
            fArch.position.set(s * 0.825, 0.64, 1.22);
            group.add(fArch);

            // ドアパネル下部（サイドシル〜プロテクションモール）
            const doorLower = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 1.25), primaryMat);
            doorLower.position.set(s * 0.77, 0.42, 0.0);
            group.add(doorLower);

            // ドアパネル上部（プロテクションモール〜ベルトライン：空洞化を完全解消）
            const doorUpper = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.24, 1.25), primaryMat);
            doorUpper.position.set(s * 0.77, 0.66, 0.0);
            group.add(doorUpper);

            // ドアハンドル
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.025, 0.085), blackTrimMat);
            handle.position.set(s * 0.812, 0.70, -0.22);
            group.add(handle);

            // リアフェンダー下部
            const rFenderTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.66), primaryMat);
            rFenderTop.position.set(s * 0.75, 0.65, -1.25);
            group.add(rFenderTop);

            const rArch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.68), primaryMat);
            rArch.position.set(s * 0.825, 0.64, -1.25);
            group.add(rArch);

            const rQuarter = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.30, 0.35), primaryMat);
            rQuarter.position.set(s * 0.75, 0.46, -1.92);
            group.add(rQuarter);

            // リアクォーターショルダー（フェンダー上端からハッチガラス脇を埋める水平デッキ）
            const rShoulder = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 1.35), primaryMat);
            rShoulder.position.set(s * 0.74, 0.72, -1.28);
            group.add(rShoulder);

            // サイドステップ
            const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 1.85), primaryMat);
            sideSkirt.position.set(s * 0.81, 0.15, 0.0);
            group.add(sideSkirt);

            // サイドモール（ブラックプロテクションストリップ）
            const rubStrip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 1.50), blackTrimMat);
            rubStrip.position.set(s * 0.815, 0.44, -0.05);
            group.add(rubStrip);

            // ウインドウ下部ベルトラインモール
            const beltMould = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.022, 1.25), blackTrimMat);
            beltMould.position.set(s * 0.805, 0.78, 0.0);
            group.add(beltMould);
        }

        // 5. ボンネット（低くスラントしたロングノーズ・リトラ連動分割造形）
        // リトラクタブル後方のメインフード
        const hoodRear = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.035, 0.85), hoodMat);
        hoodRear.position.set(0, 0.62, 1.025);
        hoodRear.rotation.x = 0.075;
        group.add(hoodRear);

        // リトラクタブル間のノーズセンター
        const hoodCenter = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.035, 0.36), hoodMat);
        hoodCenter.position.set(0, 0.575, 1.63);
        hoodCenter.rotation.x = 0.075;
        group.add(hoodCenter);

        // 6. キャビン・グリーンハウス・インテリア（ファストバッククーペシルエット）
        const cabinLower = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.36, 2.25), primaryMat);
        cabinLower.position.set(0, 0.40, -0.05);
        group.add(cabinLower);

        const dash = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.20, 0.38), interiorMat);
        dash.position.set(0, 0.66, 0.42);
        group.add(dash);

        const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.10, 0.015, 10, 20), blackTrimMat);
        wheelRim.position.set(0.34, 0.70, 0.24);
        wheelRim.rotation.x = 0.35;
        group.add(wheelRim);

        for (let s of [-1, 1]) {
            const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.14, 0.44), seatMat);
            seatBase.position.set(s * 0.34, 0.28, -0.08);
            group.add(seatBase);

            const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.44, 0.12), seatMat);
            seatBack.position.set(s * 0.34, 0.54, -0.28);
            seatBack.rotation.x = -0.14;
            group.add(seatBack);
        }

        // リアパーセルシェルフ（トノカバー・ハッチ下インテリアフロア）
        const parcelShelf = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.04, 0.95), interiorMat);
        parcelShelf.position.set(0, 0.66, -1.25);
        group.add(parcelShelf);

        // フロントガラス＆Aピラー
        const fSlope = -0.60;
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.48, 0.032), glassMat);
        windshield.position.set(0, 0.88, 0.34);
        windshield.rotation.x = fSlope;
        group.add(windshield);

        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.48, 0.035), primaryMat);
            aPillar.position.set(s * 0.68, 0.88, 0.34);
            aPillar.rotation.x = fSlope;
            group.add(aPillar);
        }

        // ルーフパネル（低くフラットなルーフ）
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.035, 0.90), primaryMat);
        roof.position.set(0, 1.08, -0.22);
        group.add(roof);

        // サイドウィンドウ＆Bピラー＆特徴的な三角形クォーターガラス
        for (let s of [-1, 1]) {
            const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.50), glassMat);
            doorGlass.position.set(s * 0.65, 0.92, 0.02);
            group.add(doorGlass);

            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.29, 0.045), blackTrimMat);
            bPillar.position.set(s * 0.655, 0.92, -0.24);
            group.add(bPillar);

            const qGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.42), glassMat);
            qGlass.position.set(s * 0.65, 0.92, -0.47);
            group.add(qGlass);

            const qRearSash = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.27, 0.035), blackTrimMat);
            qRearSash.position.set(s * 0.655, 0.92, -0.68);
            group.add(qRearSash);
        }

        // 180SX象徴のロング・ファストバックリアハッチガラス＆薄型シームレスCピラー
        // ルーフ後端(z=-0.67, y=1.08)からリアハッチデッキ(z=-1.75, y=0.68)へ直結
        const rSlope = -0.355;
        const hatchLen = 1.15;
        const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.026, hatchLen), glassMat);
        rearGlass.position.set(0, 0.87, -1.21);
        rearGlass.rotation.x = rSlope;
        group.add(rearGlass);

        for (let s of [-1, 1]) {
            const hatchFrame = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.030, hatchLen), blackTrimMat);
            hatchFrame.position.set(s * 0.59, 0.875, -1.21);
            hatchFrame.rotation.x = rSlope;
            group.add(hatchFrame);

            // 薄型Cピラーフレーム（ガラス左右外側を流れるボディ同色ルーフライン）
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.036, hatchLen), primaryMat);
            cPillar.position.set(s * 0.635, 0.88, -1.21);
            cPillar.rotation.x = rSlope;
            group.add(cPillar);

            // Cピラー基部・クォーターパネルのセイルパネル（三角結合部）
            const sailPanel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, 0.36), primaryMat);
            sailPanel.position.set(s * 0.67, 0.83, -0.85);
            sailPanel.rotation.x = rSlope * 0.4;
            group.add(sailPanel);

            const hatchDeckSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.52), primaryMat);
            hatchDeckSide.position.set(s * 0.68, 0.72, -1.48);
            group.add(hatchDeckSide);
        }

        this.addSideMirrors(group, 0.82, 0.64, 0.55, primaryMat);

        // 7. リアハッチデッキ＆Type X専用エアロリアスポイラー
        const hatchDeck = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.045, 0.58), primaryMat);
        hatchDeck.position.set(0, 0.66, -1.75);
        group.add(hatchDeck);

        const hatchRearFace = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.20, 0.08), primaryMat);
        hatchRearFace.position.set(0, 0.56, -2.00);
        group.add(hatchRearFace);

        // Type X エアロリアスポイラー（左右ステー＋流麗なアーチブレード＋翼端）
        for (let s of [-1, 1]) {
            const wingStay = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.16, 0.22), primaryMat);
            wingStay.position.set(s * 0.62, 0.76, -1.86);
            wingStay.rotation.x = -0.06;
            group.add(wingStay);

            const wingTip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.08, 0.26), primaryMat);
            wingTip.position.set(s * 0.72, 0.83, -1.88);
            wingTip.rotation.x = -0.08;
            group.add(wingTip);
        }

        const wingBlade = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.035, 0.26), primaryMat);
        wingBlade.position.set(0, 0.84, -1.88);
        wingBlade.rotation.x = -0.08;
        group.add(wingBlade);

        // 8. 後期型（Type X）丸目テールランプ＆リアバンパー＆エキゾースト
        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.30, 0.28), primaryMat);
        rBumper.position.set(0, 0.31, -1.98);
        group.add(rBumper);

        const rLip = new THREE.Mesh(new THREE.BoxGeometry(1.66, 0.045, 0.30), secondaryMat);
        rLip.position.set(0, 0.13, -1.99);
        group.add(rLip);

        const r180TailTex = this.create180SXTailTexture();
        const tailMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.54, 0.15, 0.04),
            new THREE.MeshBasicMaterial({ map: r180TailTex })
        );
        tailMesh.position.set(0, 0.55, -2.06);
        group.add(tailMesh);

        // ブレーキ時に発光する丸型ブレーキリング
        for (let s of [-1, 1]) {
            for (let rx of [-0.075, 0.075]) {
                const rRing = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16), tailLightMat);
                rRing.rotateX(Math.PI / 2);
                rRing.position.set(s * (0.50 + rx), 0.55, -2.075);
                group.add(rRing);
            }
        }

        const rNissanBadge = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.01), chromeMat);
        rNissanBadge.position.set(0, 0.64, -2.02);
        group.add(rNissanBadge);

        this.addLicensePlates(group, '群馬 55 お 26-937', 2.21, -2.13, 0.31, 0.36, 0);

        // 9. SSR ロンシャン XR-4 4本十字スポークホイール＆ブレーキ（ツライチ・ハミタイ完全解消）
        const wheelRadius = 0.305;
        const wheelWidth = 0.20;
        const wheelPositions = [
            { x: -0.73, y: wheelRadius, z: 1.22, isFront: true, isLeft: true },
            { x: 0.73, y: wheelRadius, z: 1.22, isFront: true, isLeft: false },
            { x: -0.73, y: wheelRadius, z: -1.25, isFront: false, isLeft: true },
            { x: 0.73, y: wheelRadius, z: -1.25, isFront: false, isLeft: false }
        ];

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            wheelMat,
            tireMat,
            '5star',
            wheelRadius,
            wheelWidth,
            0x222228
        );

        // 10. 大口径ステンレス砲弾スポーツマフラー＆ライティング
        this.createDetailedExhaust(group, 0.54, 0.18, -1.86, 0.56, 0.16, -2.10, 0.085, 0.060, 0xe0e6ed);
        const exhaustPos = new THREE.Vector3(0.56, 0.16, -2.12);

        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.55, -2.12);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.49, 0.58, 1.85);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat: wheelMat },
            tailLPos: new THREE.Vector3(-0.50, 0.55, -2.06),
            tailRPos: new THREE.Vector3(0.50, 0.55, -2.06),
            rearWheelLPos: new THREE.Vector3(-0.78, 0.1, -1.25),
            rearWheelRPos: new THREE.Vector3(0.78, 0.1, -1.25),
            popups: popups,
            headlightMats: headlightMats,
            headlights: headlights
        };
    }

    // =========================================================================
    // 9. SUZUKI ALTO WORKS RS-R (CC72V) - 伝説の初代「ドッカンターボ」ホットハッチ
    // =========================================================================
    static buildAltoWorks(col) {
        const group = new THREE.Group();

        // 1. マテリアルパレット
        const primaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.primary) || 0xf4f4f4,
            roughness: 0.22,
            metalness: 0.18
        });
        const secondaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.secondary) || 0x222226,
            roughness: 0.38,
            metalness: 0.22
        });
        const hoodMat = new THREE.MeshStandardMaterial({
            color: (col && col.hood) || 0xf4f4f4,
            roughness: 0.22,
            metalness: 0.18
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x0a141e,
            roughness: 0.05,
            metalness: 0.90,
            transparent: true,
            opacity: 0.88
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({
            color: 0x121214,
            roughness: 0.58,
            metalness: 0.12
        });
        const meshDarkMat = new THREE.MeshBasicMaterial({ color: 0x060608 });
        const worksPinkMat = new THREE.MeshStandardMaterial({
            color: 0xe81e63,
            roughness: 0.32,
            metalness: 0.20
        });
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.08,
            metalness: 0.95
        });
        const fogYellowMat = new THREE.MeshStandardMaterial({
            color: 0xffbb00,
            emissive: 0x664400,
            emissiveIntensity: 0.2,
            roughness: 0.15,
            metalness: 0.25
        });
        const amberLensMat = new THREE.MeshStandardMaterial({
            color: 0xff7700,
            roughness: 0.15,
            metalness: 0.15
        });
        const clearLensMat = new THREE.MeshStandardMaterial({
            color: 0xf0f4f8,
            roughness: 0.08,
            metalness: 0.20,
            transparent: true,
            opacity: 0.82
        });
        const tailLightMat = new THREE.MeshStandardMaterial({
            color: 0xee1111,
            emissive: 0x880808,
            emissiveIntensity: 0.45,
            roughness: 0.15,
            metalness: 0.10
        });
        const wheelMat = new THREE.MeshStandardMaterial({
            color: (col && col.rim) || 0xffffff,
            roughness: 0.25,
            metalness: 0.35
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1c,
            roughness: 0.92
        });
        const interiorMat = new THREE.MeshStandardMaterial({
            color: 0x18181c,
            roughness: 0.85
        });
        const seatBolsterMat = new THREE.MeshStandardMaterial({
            color: 0x222228,
            roughness: 0.88
        });
        const seatCenterMat = new THREE.MeshStandardMaterial({
            color: 0xd82060,
            roughness: 0.78
        });

        // 2. シャシー＆アンダーフロア（軽規格 全長3.1m×全幅1.4m・ホイールベース2.18m）
        const floor = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.07, 2.96), secondaryMat);
        floor.position.set(0, 0.13, -0.10);
        group.add(floor);

        // 3. 初代ワークス専用エアロフロントバンパー ＆ 大口径丸型フォグランプ ＆ 横長ウインカー
        // バンパー本体（シャンパンシルバー／ガンメタの2トーン）
        const fBumper = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.28, 0.20), secondaryMat);
        fBumper.position.set(0, 0.24, 1.38);
        group.add(fBumper);

        // 中央大型エアダム開口部（ブラックメッシュインテーク）
        const fIntake = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.20, 0.05), meshDarkMat);
        fIntake.position.set(0, 0.23, 1.482);
        group.add(fIntake);

        // 中央ロアチンスポイラー（開口部下端を繋ぐシルバーリップ）
        const fCenterLip = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.045, 0.16), secondaryMat);
        fCenterLip.position.set(0, 0.11, 1.43);
        group.add(fCenterLip);

        const fogTex = this.createAltoWorksFogLampTexture();
        const fogMat = new THREE.MeshStandardMaterial({
            map: fogTex,
            color: 0xffffff,
            roughness: 0.15,
            metalness: 0.85,
            emissive: 0xfffae0,
            emissiveIntensity: 0.06
        });

        for (let s of [-1, 1]) {
            // 【上段】横長アンバーウインカー（角型ヘッドライト直下）
            const blinker = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.065, 0.035), amberLensMat);
            blinker.position.set(s * 0.48, 0.33, 1.485);
            group.add(blinker);

            const blinkerBezel = new THREE.Mesh(new THREE.BoxGeometry(0.195, 0.08, 0.015), blackTrimMat);
            blinkerBezel.position.set(s * 0.48, 0.33, 1.472);
            group.add(blinkerBezel);

            // 【下段・最重要】大型丸型クリアフォグランプ（直径約16cm相当の大口径スポット）
            // 丸型凹型ベゼルポッド
            const fogPocket = new THREE.Mesh(
                new THREE.CylinderGeometry(0.088, 0.088, 0.04, 24),
                blackTrimMat
            );
            fogPocket.rotateX(Math.PI / 2);
            fogPocket.position.set(s * 0.48, 0.19, 1.465);
            group.add(fogPocket);

            // クロームベゼル外枠リング
            const fogRing = new THREE.Mesh(
                new THREE.CylinderGeometry(0.084, 0.084, 0.015, 24),
                chromeMat
            );
            fogRing.rotateX(Math.PI / 2);
            fogRing.position.set(s * 0.48, 0.19, 1.482);
            group.add(fogRing);

            // 丸型クリアフォグ発光レンズ（クローム反射板＆フレネルレンズテクスチャ）
            const fogLens = new THREE.Mesh(
                new THREE.CylinderGeometry(0.078, 0.078, 0.015, 24),
                fogMat
            );
            fogLens.rotateX(Math.PI / 2);
            fogLens.position.set(s * 0.48, 0.19, 1.488);
            group.add(fogLens);

            // 【アゴ出しチンスポイラー】左右フォグランプ下の張り出しエアロフラップ
            const chinFlap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 0.18), secondaryMat);
            chinFlap.position.set(s * 0.48, 0.10, 1.42);
            group.add(chinFlap);
        }

        // 4. 【初代ワークスの顔】横長角型ヘッドライト ＆ 左右非対称ノーズフェイス
        const hlTex = this.createAltoWorksHeadlightTexture();
        const grillTex = this.createAltoWorksGrillTexture();

        // ノーズ上部ヘッダーモール（ボンネット前端とのチリ合わせ）
        const noseHeader = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.035, 0.16), primaryMat);
        noseHeader.position.set(0, 0.565, 1.34);
        group.add(noseHeader);

        // 【左右非対称ノーズパネル】
        // ① 助手席側（実車正面写真向かって左 / -X）：フラットなボディ同色パネル
        const noseSolid = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.05), primaryMat);
        noseSolid.position.set(-0.16, 0.48, 1.375);
        group.add(noseSolid);

        // ② 運転席側（実車正面写真向かって右 / +X）：一段奥まったブラックメッシュ吸気グリル
        const grillMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.32, 0.13, 0.03),
            new THREE.MeshBasicMaterial({ map: grillTex })
        );
        grillMesh.position.set(0.16, 0.48, 1.365);
        group.add(grillMesh);

        // ③ ノーズ下端のブラック横スリット（左右のヘッドライト間を貫通）
        const noseLowerSlit = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.025, 0.04), meshDarkMat);
        noseLowerSlit.position.set(0, 0.395, 1.385);
        group.add(noseLowerSlit);

        // 【横長角型ヘッドライト ＆ コーナーマーカー】
        const headlightMats = [fogMat]; // フォグランプも点灯対象に追加
        for (let s of [-1, 1]) {
            // ブラックヘッドライトハウジング
            const hlHousing = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.17, 0.06), blackTrimMat);
            hlHousing.position.set(s * 0.49, 0.48, 1.365);
            group.add(hlHousing);

            // 角型クリスタルヘッドライト発光レンズ（リブ付きガラス＆クロームリフレクター）
            const hlBulbMat = new THREE.MeshStandardMaterial({
                map: hlTex,
                color: 0xffffff,
                roughness: 0.12,
                metalness: 0.70,
                emissive: 0xfffae0,
                emissiveIntensity: 0.08
            });
            headlightMats.push(hlBulbMat);

            const hlLens = new THREE.Mesh(new THREE.BoxGeometry(0.23, 0.15, 0.02), hlBulbMat);
            hlLens.position.set(s * 0.45, 0.48, 1.395);
            group.add(hlLens);

            // 外側クリア／アンバー コーナーマーカー
            const cornerLamp = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.145, 0.04), clearLensMat);
            cornerLamp.position.set(s * 0.61, 0.48, 1.385);
            group.add(cornerLamp);
        }

        // 5. ボンネットフード ＆ 流線型インタークーラーエアスクープ ＆ カウルルーバー
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.032, 0.80), hoodMat);
        hood.position.set(0, 0.58, 0.94);
        hood.rotation.x = 0.06;
        group.add(hood);

        // ワイパーカウル部 ツイン吸気ルーバー（フロントガラス直前）
        for (let s of [-1, 1]) {
            for (let k of [-0.03, 0, 0.03]) {
                const cowlSlit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.018), blackTrimMat);
                cowlSlit.position.set(s * 0.28, 0.655, 0.54 + k);
                cowlSlit.rotation.x = 0.06;
                group.add(cowlSlit);
            }
        }

        // 流線型インタークーラーエアスクープ（実車正面写真向かって右 / +X に滑らかにスラントする立体3D造形）
        const scoopBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.055, 0.32), hoodMat);
        scoopBase.position.set(0.16, 0.61, 0.96);
        scoopBase.rotation.x = 0.05;
        group.add(scoopBase);

        const scoopWedge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.032, 0.28), hoodMat);
        scoopWedge.position.set(0.16, 0.645, 0.93);
        scoopWedge.rotation.x = 0.12;
        group.add(scoopWedge);

        // スクープ開口部（楕円メッシュ吸気口）
        const scoopIntake = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.038, 0.02), meshDarkMat);
        scoopIntake.position.set(0.16, 0.625, 1.10);
        group.add(scoopIntake);

        // 6. サイドフェンダー＆ドアパネル＆専用サイドスカート＆デカール
        const sideDecalTex = this.createAltoWorksSideDecalTexture();
        const sideDecalMat = new THREE.MeshBasicMaterial({ map: sideDecalTex, transparent: true });

        for (let s of [-1, 1]) {
            // フロントフェンダー上部
            const fFender = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.58), primaryMat);
            fFender.position.set(s * 0.62, 0.605, 0.88);
            group.add(fFender);

            const fArch = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.58), primaryMat);
            fArch.position.set(s * 0.68, 0.595, 0.88);
            group.add(fArch);

            // ドアパネル下部（ツートン下部）
            const doorLower = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.22, 0.94), secondaryMat);
            doorLower.position.set(s * 0.645, 0.40, 0.07);
            group.add(doorLower);

            // ドアパネル上部（メインカラー）
            const doorUpper = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.24, 0.94), primaryMat);
            doorUpper.position.set(s * 0.645, 0.63, 0.07);
            group.add(doorUpper);

            // リアフェンダー下部（後端はリアハッチ・バンパーに綺麗に収束）
            const rFenderLowerFront = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.32), secondaryMat);
            rFenderLowerFront.position.set(s * 0.62, 0.40, -0.84);
            group.add(rFenderLowerFront);

            const rFenderLowerRear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.22), secondaryMat);
            rFenderLowerRear.position.set(s * 0.62, 0.40, -1.64);
            group.add(rFenderLowerRear);

            // リアフェンダー上部
            const rFenderUpper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.07, 0.58), primaryMat);
            rFenderUpper.position.set(s * 0.62, 0.605, -1.30);
            group.add(rFenderUpper);

            const rArch = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.04, 0.58), primaryMat);
            rArch.position.set(s * 0.68, 0.595, -1.30);
            group.add(rArch);

            // フロントフェンダー側面 アンバーサイドターンシグナル
            const sideMarker = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.032, 0.055), amberLensMat);
            sideMarker.position.set(s * 0.686, 0.50, 0.55);
            group.add(sideMarker);

            // サイドエアロスカート（下部ステップ）
            const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.09, 1.45), secondaryMat);
            sideSkirt.position.set(s * 0.67, 0.15, -0.10);
            group.add(sideSkirt);

            // ブラックプロテクションモール
            const sideMould = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.024, 1.30), blackTrimMat);
            sideMould.position.set(s * 0.685, 0.48, -0.15);
            group.add(sideMould);

            // ウインドウ下部ベルトモール
            const beltMould = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.020, 0.94), blackTrimMat);
            beltMould.position.set(s * 0.68, 0.75, 0.07);
            group.add(beltMould);

            // ドアハンドル
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.024, 0.075), blackTrimMat);
            handle.position.set(s * 0.685, 0.68, -0.25);
            group.add(handle);

            // WORKS専用サイドストライプデカール（TWINCAM 12VALVE TURBO / FULL TIME 4WD）
            const sideDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 0.20), sideDecalMat);
            sideDecal.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
            sideDecal.position.set(s * 0.686, 0.38, 0.07);
            group.add(sideDecal);
        }

        // 7. キャビン・グリーンハウス・Cピラー3連ルーバー・インテリア
        const cabinLower = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.36, 2.84), primaryMat);
        cabinLower.position.set(0, 0.38, -0.10);
        group.add(cabinLower);

        // ダッシュボード
        const dash = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.18, 0.32), interiorMat);
        dash.position.set(0, 0.64, 0.30);
        group.add(dash);

        // 3本スポーク・スポーツステアリング（ピンクWORKSホーンボタン）
        const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.014, 10, 20), blackTrimMat);
        wheelRim.position.set(0.28, 0.68, 0.16);
        wheelRim.rotation.x = 0.40;
        group.add(wheelRim);

        const hornButton = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.015, 12), worksPinkMat);
        hornButton.position.set(0.28, 0.68, 0.17);
        hornButton.rotation.x = 0.40;
        group.add(hornButton);

        // ワークス専用 2トーンバケットシート（外側ダークグレー＆中央ピンクファブリック）
        for (let s of [-1, 1]) {
            const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.12, 0.38), seatBolsterMat);
            seatBase.position.set(s * 0.28, 0.24, -0.15);
            group.add(seatBase);

            const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.42, 0.10), seatBolsterMat);
            seatBack.position.set(s * 0.28, 0.50, -0.32);
            seatBack.rotation.x = -0.12;
            group.add(seatBack);

            // ピンクWORKSセンターインサート
            const seatPink = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.38, 0.02), seatCenterMat);
            seatPink.position.set(s * 0.28, 0.50, -0.265);
            seatPink.rotation.x = -0.12;
            group.add(seatPink);
        }

        // フロントガラス＆スリムAピラー
        const fSlope = -0.55;
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.44, 0.028), glassMat);
        windshield.position.set(0, 0.81, 0.38);
        windshield.rotation.x = fSlope;
        group.add(windshield);

        // フロントワイパー（フロントガラス下端）
        for (let w of [
            { x: -0.22, armLen: 0.28, angle: 0.12 },
            { x: 0.18, armLen: 0.28, angle: 0.12 }
        ]) {
            const wPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.02, 8), blackTrimMat);
            wPivot.rotation.x = -0.55;
            wPivot.position.set(w.x, 0.645, 0.49);
            group.add(wPivot);

            const wBlade = new THREE.Mesh(new THREE.BoxGeometry(w.armLen, 0.010, 0.012), blackTrimMat);
            wBlade.position.set(w.x + 0.13, 0.665, 0.46);
            wBlade.rotation.x = -0.55;
            wBlade.rotation.z = w.angle;
            group.add(wBlade);
        }

        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.44, 0.032), primaryMat);
            aPillar.position.set(s * 0.61, 0.81, 0.38);
            aPillar.rotation.x = fSlope;
            group.add(aPillar);
        }

        // フラットルーフパネル（ホットハッチとして後軸上端まで伸びるロングキャビンルーフ）
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.030, 1.48), primaryMat);
        roof.position.set(0, 1.01, -0.52);
        group.add(roof);

        // ルーフドリップレール（雨樋モール）
        for (let s of [-1, 1]) {
            const dripRail = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.022, 1.48), blackTrimMat);
            dripRail.position.set(s * 0.595, 1.025, -0.52);
            group.add(dripRail);
        }

        // ルーフアンテナ（フロントガラス右側Aピラー基部）
        const antBase = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.014, 0.025, 8), blackTrimMat);
        antBase.position.set(-0.58, 1.03, 0.22);
        group.add(antBase);

        const antRod = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.38, 6), blackTrimMat);
        antRod.position.set(-0.58, 1.18, 0.08);
        antRod.rotation.x = -0.65;
        group.add(antRod);

        // サイドウィンドウ＆Bピラー＆Cピラー3連ルーバー
        for (let s of [-1, 1]) {
            const doorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.88), glassMat);
            doorGlass.position.set(s * 0.585, 0.85, 0.07);
            group.add(doorGlass);

            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.29, 0.04), blackTrimMat);
            bPillar.position.set(s * 0.59, 0.85, -0.38);
            group.add(bPillar);

            const qGlass = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.26, 0.52), glassMat);
            qGlass.position.set(s * 0.585, 0.85, -0.66);
            group.add(qGlass);

            // 太い特徴的なCピラー（リアハッチと一体化）
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.29, 0.34), primaryMat);
            cPillar.position.set(s * 0.595, 0.85, -1.09);
            group.add(cPillar);

            // ★初代アルトワークス特有のCピラー3連ブラックエアルーバー！
            for (let j of [-0.06, 0, 0.06]) {
                const louver = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.018, 0.22), blackTrimMat);
                louver.position.set(s * 0.635, 0.85 + j, -1.09);
                group.add(louver);
            }
        }

        this.addSideMirrors(group, 0.70, 0.64, 0.38, secondaryMat);

        // 8. 【初代ワークス最大のアイコン】「コの字形」大型バックドアスポイラー ＆ リアワイパー
        // リアハッチガラス（ハッチバック特有の急傾斜ガラス）
        const rSlope = 0.45;
        const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.44, 0.028), glassMat);
        rearGlass.position.set(0, 0.83, -1.39);
        rearGlass.rotation.x = rSlope;
        group.add(rearGlass);

        // リアワイパー（リアガラス下端に水平マウント）
        const rWiperPivot = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.02, 8), blackTrimMat);
        rWiperPivot.rotation.x = rSlope;
        rWiperPivot.position.set(-0.02, 0.68, -1.50);
        group.add(rWiperPivot);

        const rWiperBlade = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.010, 0.010), blackTrimMat);
        rWiperBlade.position.set(0.11, 0.69, -1.49);
        rWiperBlade.rotation.x = rSlope;
        group.add(rWiperBlade);

        // 【初代ワークス専用 「コの字形」大型バックドアスポイラー】
        // ① トップウイング（ルーフ後端から鋭く後方へせり出す逆翼型スポイラー）
        const topWing = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.035, 0.26), primaryMat);
        topWing.position.set(0, 1.03, -1.26);
        topWing.rotation.x = -0.06;
        group.add(topWing);

        // ② 左右縦型エアロサイドブレード（トップウイングからリアガラス両端に沿ってウエストデッキへ一体連結する「コの字」フレーム）
        for (let s of [-1, 1]) {
            const sideBlade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.44, 0.08), primaryMat);
            sideBlade.position.set(s * 0.60, 0.84, -1.38);
            sideBlade.rotation.x = rSlope;
            group.add(sideBlade);

            // トップウィング外側フィン
            const topWingTip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.26), primaryMat);
            topWingTip.position.set(s * 0.61, 1.01, -1.26);
            group.add(topWingTip);
        }

        // ③ 下端：ミッド・ウエストデッキリップ（リアガラス直下で「コの字」フレームを支える）
        const midWing = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.032, 0.14), primaryMat);
        midWing.position.set(0, 0.67, -1.52);
        midWing.rotation.x = -0.08;
        group.add(midWing);

        const midWingDeck = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.05, 0.10), secondaryMat);
        midWingDeck.position.set(0, 0.64, -1.49);
        group.add(midWingDeck);

        // 9. リアコンビネーションランプ＆リアバンパー＆エキゾースト
        const rHatchFace = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.24, 0.06), primaryMat);
        rHatchFace.position.set(0, 0.52, -1.51);
        group.add(rHatchFace);

        const rTailTex = this.createAltoWorksTailTexture();
        const tailMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.22, 0.13, 0.03),
            new THREE.MeshBasicMaterial({ map: rTailTex })
        );
        tailMesh.position.set(0, 0.51, -1.545);
        group.add(tailMesh);

        // リアバンパー（ツートンアッパー＆ロアスカート）
        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.24, 0.16), secondaryMat);
        rBumper.position.set(0, 0.28, -1.53);
        group.add(rBumper);

        const rSkirt = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.05, 0.18), blackTrimMat);
        rSkirt.position.set(0, 0.13, -1.53);
        group.add(rSkirt);

        // ★軽自動車 黄色ナンバープレート（Yellow Plates）
        this.addLicensePlates(group, '群馬 40 あ ・7 52', 1.515, -1.62, 0.28, 0.24, 0, true);

        // 10. 初代ワークス専用 13インチ エアロディッシュホイール（ホイールベース2.18m：前0.88 / 後-1.30）
        const wheelRadius = 0.28;
        const wheelWidth = 0.16;
        const wheelPositions = [
            { x: -0.58, y: wheelRadius, z: 0.88, isFront: true, isLeft: true },
            { x: 0.58, y: wheelRadius, z: 0.88, isFront: true, isLeft: false },
            { x: -0.58, y: wheelRadius, z: -1.30, isFront: false, isLeft: true },
            { x: 0.58, y: wheelRadius, z: -1.30, isFront: false, isLeft: false }
        ];

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            wheelMat,
            tireMat,
            'works_dish',
            wheelRadius,
            wheelWidth,
            0x333338
        );

        // 11. ステンレススポーツエキゾースト＆ライティング
        this.createDetailedExhaust(group, -0.38, 0.16, -1.48, -0.40, 0.16, -1.60, 0.060, 0.042, 0xeeeeee);
        const exhaustPos = new THREE.Vector3(-0.40, 0.16, -1.62);

        const brakeLight = new THREE.PointLight(0xff0022, 0, 8, 2.0);
        brakeLight.position.set(0, 0.51, -1.56);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.44, 0.52, 1.44);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat: wheelMat },
            tailLPos: new THREE.Vector3(-0.48, 0.51, -1.54),
            tailRPos: new THREE.Vector3(0.48, 0.51, -1.54),
            rearWheelLPos: new THREE.Vector3(-0.63, 0.1, -1.30),
            rearWheelRPos: new THREE.Vector3(0.63, 0.1, -1.30),
            popups: [],
            headlightMats: headlightMats,
            headlights: headlights
        };
    }

    // =========================================================================
    // 共通高精度ホイール＆ブレーキローター・キャリパービルダー
    // =========================================================================
    // =========================================================================
    // 次世代・超リアル完全再現ホイール＆ブレーキローター・キャリパービルダー
    // （画像テクスチャ貼り付けゼロ！全て純粋なThree.js 3D幾何ポリゴン＋物理ベースPBRマテリアルで完全構築）
    // =========================================================================
    // =========================================================================
    // 次世代・超リアル完全再現ホイール＆ブレーキローター・キャリパービルダー
    // （画像テクスチャ貼り付けゼロ！全て純粋なThree.js 3D幾何ポリゴン＋物理ベースPBRマテリアルで完全構築）
    // =========================================================================
    // =========================================================================
    // 次世代・超リアル完全再現ホイール＆ブレーキローター・キャリパービルダー
    // （画像テクスチャ貼り付けゼロ！全て純粋なThree.js 3D幾何ポリゴン＋物理ベースPBRマテリアルで完全構築）
    // =========================================================================
    // =========================================================================
    // 次世代ハイパーリアル・レーシングホイール＆ブレーキシステム
    // （完全自己完結型プロシージャル高解像度PBRテクスチャ＋精密3D幾何ポリゴン造形）
    // =========================================================================

    static getWheelTextureCache() {
        if (!CarModelBuilder._wheelTexCache) {
            CarModelBuilder._wheelTexCache = {};
        }
        return CarModelBuilder._wheelTexCache;
    }

    // 1. プロシージャル・ハイグリップスポーツタイヤ サイドウォールテクスチャ
    static createTireSidewallTexture(style, radius) {
        const cacheKey = 'sidewall_' + style;
        const cache = this.getWheelTextureCache();
        if (cache[cacheKey]) return cache[cacheKey];

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const cx = 256, cy = 256;

        let brandText = 'POTENZA  RE-71RS';
        let specText = '225/50R16 92V  EXTRA LOAD';
        if (style === 'watanabe') {
            brandText = 'ADVAN  NEOVA  AD08R';
            specText = '195/60R14 86H  RADIAL TUBELESS';
        } else if (style === 'ms01') {
            brandText = 'POTENZA  RE-71RS';
            specText = '255/40R17 94W  STEEL BELTED';
        } else if (style === 'ssr_mesh') {
            brandText = 'PROXES  R1R';
            specText = '205/55R15 88V  RADIAL TUBELESS';
        } else if (style === 'avs_model5' || style === 'avs5') {
            brandText = 'ADVAN  SPORT  V105';
            specText = '235/40R18 95Y  EXTRA LOAD';
        } else if (style === 'oz_chrono' || style === 'oz') {
            brandText = 'DIREZZA  ZIII';
            specText = '205/50R15 86V  COMPETITION';
        } else if (style === 'ek9_typer' || style === 'type_r') {
            brandText = 'POTENZA  RE-71RS';
            specText = '195/55R15 85V  RADIAL TUBELESS';
        } else if (style === 'longchamp' || style === '5star') {
            brandText = 'ADVAN  NEOVA  AD08R';
            specText = '205/55R15 88V  STEEL BELTED';
        } else if (style === 'works_dish') {
            brandText = 'POTENZA  RE-71RS';
            specText = '165/65R13 77H  RADIAL TUBELESS';
        } else if (style === 'supra_5spoke' || style === 'supra_rz') {
            brandText = 'POTENZA  S007A';
            specText = '255/40R17 94W  EXTRA LOAD';
        } else if (style === 's15_5spoke' || style === 's15_spec_r') {
            brandText = 'POTENZA  RE-71RS';
            specText = '205/55R16 89V  RADIAL TUBELESS';
        }

        // 背景：マット微細テクスチャゴムベース (#18181c)
        ctx.fillStyle = '#18181c';
        ctx.beginPath();
        ctx.arc(cx, cy, 252, 0, Math.PI * 2);
        ctx.fill();

        // ベルベット調コントラスト帯
        ctx.fillStyle = '#131417';
        ctx.beginPath();
        ctx.arc(cx, cy, 236, 0, Math.PI * 2);
        ctx.arc(cx, cy, 184, 0, Math.PI * 2, true);
        ctx.fill();

        // 微細同心円セレーション
        ctx.strokeStyle = '#101114';
        ctx.lineWidth = 1.2;
        for (let r = 188; r < 232; r += 3.5) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // リムプロテクター溝
        ctx.strokeStyle = '#2b2c32';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 168, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#0d0d10';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 165, 0, Math.PI * 2);
        ctx.stroke();

        // 円弧エンボス文字描画
        const drawCurvedText = (text, arcRadius, startAngle, endAngle, isClockwise, fontStr, baseColor, shadowColor, highlightColor) => {
            ctx.save();
            ctx.font = fontStr;
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center';
            const totalAngle = endAngle - startAngle;
            const len = text.length;
            for (let i = 0; i < len; i++) {
                const char = text[i];
                const charAngle = startAngle + (i / Math.max(1, len - 1)) * totalAngle;
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(charAngle + (isClockwise ? Math.PI / 2 : -Math.PI / 2));
                ctx.translate(0, isClockwise ? -arcRadius : arcRadius);

                ctx.fillStyle = shadowColor;
                ctx.fillText(char, 1, 1.2);
                ctx.fillStyle = highlightColor;
                ctx.fillText(char, -0.8, -0.8);
                ctx.fillStyle = baseColor;
                ctx.fillText(char, 0, 0);

                ctx.restore();
            }
            ctx.restore();
        };

        // ブランド名（立体エンボス 3D レリーフ）
        drawCurvedText(
            brandText,
            210,
            -Math.PI * 0.78,
            -Math.PI * 0.22,
            true,
            'bold 22px "Arial Black", "Impact", sans-serif',
            '#3a3c44',
            '#0a0b0d',
            '#525660'
        );

        // 下部タイヤスペック刻印
        drawCurvedText(
            specText,
            206,
            Math.PI * 0.24,
            Math.PI * 0.76,
            false,
            'bold 13px "Arial", sans-serif',
            '#32343c',
            '#0d0e11',
            '#4a4c56'
        );

        // 回転方向インジケーター
        drawCurvedText(
            'ROTATION >>>',
            192,
            Math.PI * 0.90,
            Math.PI * 1.10,
            true,
            'bold 11px "Arial", sans-serif',
            '#444750',
            '#0a0a0c',
            '#606470'
        );
        drawCurvedText(
            'MADE IN JAPAN',
            192,
            -Math.PI * 0.10,
            Math.PI * 0.10,
            true,
            'bold 11px "Arial", sans-serif',
            '#444750',
            '#0a0a0c',
            '#606470'
        );

        // ▲ TWI 摩耗限界インジケーター
        for (let a = 0; a < 6; a++) {
            const angle = (a / 6) * Math.PI * 2;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.fillStyle = '#424550';
            ctx.beginPath();
            ctx.moveTo(0, -244);
            ctx.lineTo(-4, -238);
            ctx.lineTo(4, -238);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        // 黄色バルブ位置合わせ軽点マーク
        const dotAngle = 0.55;
        const dotX = cx + Math.cos(dotAngle) * 175;
        const dotY = cy + Math.sin(dotAngle) * 175;
        ctx.fillStyle = '#d4b420';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5a4c10';
        ctx.lineWidth = 1.0;
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        cache[cacheKey] = tex;
        return tex;
    }

    // 2. プロシージャル・非対称スポーツタイヤトレッドテクスチャ
    static createTireTreadTexture() {
        const cacheKey = 'tire_tread';
        const cache = this.getWheelTextureCache();
        if (cache[cacheKey]) return cache[cacheKey];

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#1c1c20';
        ctx.fillRect(0, 0, 512, 256);

        // 4本の縦溝
        const grooveXs = [80, 180, 310, 420];
        grooveXs.forEach(gx => {
            ctx.fillStyle = '#08080a';
            ctx.fillRect(gx - 12, 0, 24, 256);
            ctx.fillStyle = '#2c2e36';
            ctx.fillRect(gx - 14, 0, 2, 256);
            ctx.fillRect(gx + 12, 0, 2, 256);
        });

        // 斜めトラクションサイプ
        ctx.lineWidth = 4;
        for (let y = 0; y < 256; y += 32) {
            ctx.strokeStyle = '#0e0e12';
            ctx.beginPath();
            ctx.moveTo(10, y + 8);
            ctx.lineTo(68, y + 24);
            ctx.stroke();
            ctx.strokeStyle = '#32343e';
            ctx.beginPath();
            ctx.moveTo(10, y + 6);
            ctx.lineTo(68, y + 22);
            ctx.stroke();

            ctx.strokeStyle = '#0e0e12';
            ctx.beginPath();
            ctx.moveTo(92, y + 4);
            ctx.lineTo(168, y + 28);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(192, y + 4);
            ctx.lineTo(298, y + 28);
            ctx.stroke();

            ctx.strokeStyle = '#0e0e12';
            ctx.beginPath();
            ctx.moveTo(322, y + 24);
            ctx.lineTo(408, y + 8);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(432, y + 24);
            ctx.lineTo(502, y + 8);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 16);
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        cache[cacheKey] = tex;
        return tex;
    }

    // 3. プロシージャル・2ピースベンチレーテッド レーシングブレーキローターテクスチャ
    static createBrakeRotorTexture() {
        const cacheKey = 'brake_rotor';
        const cache = this.getWheelTextureCache();
        if (cache[cacheKey]) return cache[cacheKey];

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const cx = 256, cy = 256;
        const rOuter = 248;
        const rInner = 112;

        ctx.clearRect(0, 0, 512, 512);

        // 摩擦接触面
        ctx.fillStyle = '#b0b8c4';
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
        ctx.arc(cx, cy, rInner, 0, Math.PI * 2, true);
        ctx.fill();

        // 円周旋盤・パッド摺動ヘアライン加工痕
        let seed = 12345;
        const pseudoRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        for (let r = rInner + 4; r < rOuter - 4; r += 1.0) {
            const tone = 155 + Math.floor(pseudoRandom() * 65);
            const alpha = 0.25 + pseudoRandom() * 0.45;
            ctx.strokeStyle = `rgba(${tone}, ${tone + 4}, ${tone + 10}, ${alpha})`;
            ctx.lineWidth = 0.8 + pseudoRandom() * 0.6;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 外周・内周の黒皮酸化被膜帯
        ctx.strokeStyle = '#282a30';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter - 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#22242a';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, rInner + 4, 0, Math.PI * 2);
        ctx.stroke();

        // 8スパイラル放射線状クロススリット ドリルド冷却孔
        for (let s = 0; s < 8; s++) {
            const baseAngle = (s / 8) * Math.PI * 2;
            for (let h = 0; h < 4; h++) {
                const frac = (h + 1) / 5.0;
                const rHole = rInner + 22 + frac * (rOuter - rInner - 44);
                const angle = baseAngle + Math.pow(frac, 1.2) * 0.38;
                const hx = cx + Math.cos(angle) * rHole;
                const hy = cy + Math.sin(angle) * rHole;

                ctx.fillStyle = '#68707a';
                ctx.beginPath();
                ctx.arc(hx, hy, 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#d0d8e2';
                ctx.lineWidth = 1.0;
                ctx.stroke();

                ctx.fillStyle = '#08080a';
                ctx.beginPath();
                ctx.arc(hx, hy, 4.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 8本のCNCカーブド スリットグルーブ
        for (let s = 0; s < 8; s++) {
            const slotAngle = (s / 8) * Math.PI * 2 + Math.PI / 8;
            ctx.beginPath();
            for (let st = 0; st <= 14; st++) {
                const frac = st / 14;
                const rSlot = rInner + 18 + frac * (rOuter - rInner - 36);
                const a = slotAngle + Math.pow(frac, 1.3) * 0.32;
                const px = cx + Math.cos(a) * rSlot;
                const py = cy + Math.sin(a) * rSlot;
                if (st === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.strokeStyle = '#22242a';
            ctx.lineWidth = 4.0;
            ctx.stroke();
            ctx.strokeStyle = 'rgba(230, 238, 248, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 8;
        tex.needsUpdate = true;
        cache[cacheKey] = tex;
        return tex;
    }

    // 4. プロシージャル・対向ピストン レーシングブレーキキャリパーロゴテクスチャ
    static createCaliperTexture(style, caliperColor) {
        const cacheKey = 'caliper_' + style + '_' + caliperColor;
        const cache = this.getWheelTextureCache();
        if (cache[cacheKey]) return cache[cacheKey];

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');

        let hexStr = '#' + ((caliperColor & 0xffffff).toString(16).padStart(6, '0'));
        ctx.fillStyle = hexStr;
        ctx.fillRect(0, 0, 256, 96);

        const grad = ctx.createLinearGradient(0, 0, 0, 96);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
        grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.05)');
        grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.15)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 96);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (style === 'bnr32_oem' || style === 'gtr') {
            ctx.fillStyle = '#b81414';
            ctx.font = 'bold 36px "Arial", sans-serif';
            ctx.fillText('brembo', 135, 48);
            ctx.beginPath();
            ctx.arc(48, 48, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = hexStr;
            ctx.beginPath();
            ctx.arc(48, 48, 8, 0, Math.PI * 2);
            ctx.fill();
        } else if (style === 'supra_5spoke' || style === 'supra_rz') {
            ctx.fillStyle = '#f0f4f8';
            ctx.font = 'italic bold 44px "Georgia", "Times New Roman", serif';
            ctx.fillText('Supra', 128, 46);
        } else if (style === 'ms01') {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 30px "Arial Black", sans-serif';
            ctx.fillText('MAZDASPEED', 128, 48);
        } else if (style === 'ek9_typer' || style === 'type_r') {
            ctx.fillStyle = '#cc1818';
            ctx.font = 'bold 38px "Arial Black", sans-serif';
            ctx.fillText('NISSIN', 128, 48);
        } else if (style === 's15_5spoke' || style === 's15_spec_r') {
            ctx.fillStyle = '#e2e6ea';
            ctx.font = 'bold 38px "Arial Black", sans-serif';
            ctx.fillText('NISSAN', 128, 48);
        } else if (style === 'oz_chrono' || style === 'oz') {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px "Arial", sans-serif';
            ctx.fillText('brembo', 128, 48);
        } else if (style === 'avs_model5' || style === 'avs5') {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic bold 36px "Arial", sans-serif';
            ctx.fillText('TOURER', 128, 48);
        } else if (style === 'watanabe') {
            ctx.fillStyle = '#cccccc';
            ctx.font = 'bold 36px "Arial Black", sans-serif';
            ctx.fillText('TOYOTA', 128, 48);
        } else if (style === 'ssr_mesh' || style === 'longchamp' || style === '5star') {
            ctx.fillStyle = '#dcdfe4';
            ctx.font = 'bold 36px "Arial Black", sans-serif';
            ctx.fillText('NISSAN', 128, 48);
        } else if (style === 'works_dish') {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 34px "Arial Black", sans-serif';
            ctx.fillText('WORKS', 128, 48);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 34px "Arial", sans-serif';
            ctx.fillText('SPORT', 128, 48);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        cache[cacheKey] = tex;
        return tex;
    }

    // 5. プロシージャル・高精細ハブセンターエンブレムテクスチャ
    static createCenterEmblemTexture(style) {
        const cacheKey = 'emblem_' + style;
        const cache = this.getWheelTextureCache();
        if (cache[cacheKey]) return cache[cacheKey];

        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        const cx = 128, cy = 128;

        ctx.fillStyle = '#e2e8f0';
        ctx.beginPath();
        ctx.arc(cx, cy, 126, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e2024';
        ctx.beginPath();
        ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (style === 'watanabe') {
            ctx.fillStyle = '#121214';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, 96, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#dfb842';
            for (let c = -1; c <= 1; c++) {
                ctx.beginPath();
                ctx.arc(cx + c * 28, cy - 8 + Math.abs(c) * 12, 14, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.font = 'bold 18px "Arial Black", sans-serif';
            ctx.fillText('WATANABE', cx, cy + 48);
        } else if (style === 'ms01') {
            ctx.fillStyle = '#141416';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#dfb842';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(cx, cy, 96, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#dfb842';
            ctx.font = 'bold 36px "Arial Black", sans-serif';
            ctx.fillText('MS', cx, cy - 10);
            ctx.fillStyle = '#cc1818';
            ctx.font = 'bold 18px "Arial Black", sans-serif';
            ctx.fillText('MAZDASPEED', cx, cy + 34);
        } else if (style === 'bnr32_oem' || style === 'gtr') {
            ctx.fillStyle = '#26282e';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e8ecf2';
            ctx.font = 'bold 64px "Arial Black", sans-serif';
            ctx.fillText('GT', cx - 36, cy);

            ctx.fillStyle = '#e60012';
            ctx.font = 'bold 88px "Arial Black", sans-serif';
            ctx.fillText('R', cx + 40, cy - 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeText('R', cx + 40, cy - 2);
        } else if (style === 'ssr_mesh') {
            ctx.fillStyle = '#b81212';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#f2d854';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(cx, cy, 98, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#f8f9fa';
            ctx.font = 'italic bold 64px "Arial Black", sans-serif';
            ctx.fillText('SS', cx, cy);
        } else if (style === 'avs_model5' || style === 'avs5') {
            ctx.fillStyle = '#181a1e';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e2e6ea';
            ctx.font = 'bold 36px "Arial Black", sans-serif';
            ctx.fillText('AVS', cx, cy - 16);
            ctx.font = 'bold 22px "Arial", sans-serif';
            ctx.fillText('MODEL 5', cx, cy + 24);
        } else if (style === 'oz_chrono' || style === 'oz') {
            ctx.fillStyle = '#cc1414';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 44px "Arial Black", sans-serif';
            ctx.fillText('O・Z', cx, cy - 12);
            ctx.font = 'bold 18px "Arial Black", sans-serif';
            ctx.fillText('RACING', cx, cy + 30);
        } else if (style === 'ek9_typer' || style === 'type_r') {
            ctx.fillStyle = '#f4f5f0';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#cc1212';
            ctx.font = 'bold 110px "Arial Black", "Impact", sans-serif';
            ctx.fillText('H', cx, cy - 4);
        } else if (style === 'longchamp' || style === '5star') {
            ctx.fillStyle = '#d8dee6';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#181a1e';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, 85, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#111214';
            ctx.font = 'bold 32px "Arial Black", sans-serif';
            ctx.fillText('XR-4', cx, cy);
        } else if (style === 'works_dish') {
            ctx.fillStyle = '#b81438';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px "Arial Black", sans-serif';
            ctx.fillText('WORKS', cx, cy - 14);
            ctx.fillStyle = '#f8d030';
            ctx.font = 'bold 22px "Arial Black", sans-serif';
            ctx.fillText('RS-R', cx, cy + 24);
        } else if (style === 'supra_5spoke' || style === 'supra_rz') {
            ctx.fillStyle = '#d0d8e2';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#32363e';
            ctx.lineWidth = 7;
            ctx.beginPath();
            ctx.ellipse(cx, cy, 70, 48, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy - 2, 28, 48, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy - 12, 48, 20, 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (style === 's15_5spoke' || style === 's15_spec_r') {
            ctx.fillStyle = '#2c2e36';
            ctx.beginPath();
            ctx.arc(cx, cy, 116, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#e8ecf4';
            ctx.fillStyle = '#f0f4fc';
            ctx.beginPath();
            ctx.moveTo(cx + 20, cy - 58);
            ctx.lineTo(cx - 36, cy - 6);
            ctx.lineTo(cx - 4, cy - 6);
            ctx.lineTo(cx - 20, cy + 58);
            ctx.lineTo(cx + 36, cy + 6);
            ctx.lineTo(cx + 4, cy + 6);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = '#e0e4ec';
            ctx.font = 'bold 36px "Arial", sans-serif';
            ctx.fillText('SPORTS', cx, cy);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;
        tex.needsUpdate = true;
        cache[cacheKey] = tex;
        return tex;
    }

    // =========================================================================
    // 6. メインホイールビルダー（高精度PBRマテリアル＋3Dポリゴン幾何学）
    // =========================================================================
    // =========================================================================
    // 200％極限再現：ハイパーリアル・レーシングホイール＆ホイール回り完全体システム
    // （物理的3Dトレッド溝・車高調サスペンション・ダストシールド・高解像度PBRテクスチャ）
    // =========================================================================

    // =========================================================================
    // 300％極限超越再現：ハイパーリアル・ホイール＆ホイール回り完全体システム
    // （ツインスプリング車高調・物理的3Dトレッド溝・ダストシールド・高解像度PBRテクスチャ）
    // =========================================================================

    static createDetailedWheels(parentGroup, wheelPositions, rimMat, tireMat, style, radius, width, caliperColor = null) {
        const wheels = [];
        let frontWheelL = null;
        let frontWheelR = null;

        // タイヤ基本ラバーマテリアル（本物のマット微細ゴム質感）
        const realTireMat = (tireMat && tireMat.isMaterial) ? tireMat : new THREE.MeshStandardMaterial();
        realTireMat.color.setHex(0x191a1d);
        realTireMat.roughness = 0.86;
        realTireMat.metalness = 0.05;
        realTireMat.side = THREE.DoubleSide;

        // タイヤ溝底（深い影・ピッチブラックラバー）
        const tireGrooveBaseMat = new THREE.MeshStandardMaterial({
            color: 0x07080a,
            roughness: 0.98,
            metalness: 0.02
        });

        // 3Dトレッドリブ表面マテリアル（路面コンパウンド微細テクスチャ）
        const treadRibMat = new THREE.MeshStandardMaterial({
            color: 0x1c1d22,
            roughness: 0.82,
            metalness: 0.06
        });

        // タイヤサイドウォールマテリアル（専用高解像度ブランド刻印）
        const sidewallTex = this.createTireSidewallTexture(style, radius);
        const sidewallMat = new THREE.MeshStandardMaterial({
            map: sidewallTex,
            roughness: 0.74,
            metalness: 0.08,
            side: THREE.DoubleSide
        });

        // ポリッシュド・ミラーリップマテリアル
        const mirrorLipMat = new THREE.MeshStandardMaterial({
            color: 0xf8fafc,
            roughness: 0.06,
            metalness: 0.92
        });

        // インナーリムバレル（陽極酸化アルミ・ダーク質感）
        const stepBarrelMat = new THREE.MeshStandardMaterial({
            color: 0x1e2026,
            roughness: 0.38,
            metalness: 0.55,
            side: THREE.DoubleSide
        });

        // 2ピースベンチレーテッド レーシングブレーキローター
        const rotorTex = this.createBrakeRotorTexture();
        const rotorMat = new THREE.MeshStandardMaterial({
            map: rotorTex,
            roughness: 0.20,
            metalness: 0.78,
            side: THREE.DoubleSide
        });

        // 冷却ベンチレーションフィン
        const rotorVaneMat = new THREE.MeshStandardMaterial({
            color: 0x2e3238,
            roughness: 0.65,
            metalness: 0.40
        });

        // フローティングベルハウジング（ローターハット）
        const bellHousingMat = new THREE.MeshStandardMaterial({
            color: 0x1d1f23,
            roughness: 0.35,
            metalness: 0.60
        });

        // クローム／チタン金具マテリアル
        const chromeNutMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.08,
            metalness: 0.92
        });

        // バランスウェイト（亜鉛・鉛合金）
        const balanceWeightMat = new THREE.MeshStandardMaterial({
            color: 0x9ca4ad,
            roughness: 0.35,
            metalness: 0.82
        });

        // サスペンション用PBRマテリアル
        const damperRodMat = new THREE.MeshStandardMaterial({ color: 0xecf0f6, roughness: 0.06, metalness: 0.94 });
        const shockBodyMat = new THREE.MeshStandardMaterial({ color: 0xb89228, roughness: 0.28, metalness: 0.75 }); // アノダイズドゴールド
        const lockCollarMat = new THREE.MeshStandardMaterial({ color: 0xcc1414, roughness: 0.20, metalness: 0.85 }); // 鮮紅アルマイトダブルリング
        const spacerSeatMat = new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 0.30, metalness: 0.80 }); // ヘルパースプリングスペーサーシート
        const helperSpringMat = new THREE.MeshStandardMaterial({ color: 0x121418, roughness: 0.40, metalness: 0.60 }); // フラットワイヤーヘルパースプリング

        let springColor = 0x22c55e; // TEINレーシンググリーン
        if (style === 'bnr32_oem' || style === 'gtr' || style === 's15_spec_r') springColor = 0xd41818; // NISMOレッド
        else if (style === 'jzx100' || style === 's13' || style === 'rps13') springColor = 0x7c3aed; // HKSハイパーマックスパープル
        else if (style === 'supra_5spoke' || style === 'supra_rz') springColor = 0xeab308; // ビルシュタインイエロー
        const coilSpringMat = new THREE.MeshStandardMaterial({ color: springColor, roughness: 0.22, metalness: 0.65 });

        // ブレーキダストシールド（プレス成形ブラック防熱板）
        const dustShieldMat = new THREE.MeshStandardMaterial({
            color: 0x14161a,
            roughness: 0.55,
            metalness: 0.60,
            side: THREE.DoubleSide
        });

        // インナーフェンダーライナー（ホイールハウス遮光カバー）
        const archLinerMat = new THREE.MeshStandardMaterial({
            color: 0x090a0c,
            roughness: 0.96,
            side: THREE.BackSide
        });

        const isModularLip = (style === 'watanabe' || style === 'ms01' || style === 'ssr_mesh' || style === 'longchamp' || style === '5star');

        // キャリパーカラー設定
        let defaultCaliperCol = 0x282a2e;
        if (style === 'bnr32_oem' || style === 'gtr') defaultCaliperCol = 0xd8a020;
        else if (style === 'ms01' || style === 'oz' || style === 'oz_chrono') defaultCaliperCol = 0xcc1818;
        else if (style === 'avs_model5' || style === 'avs5') defaultCaliperCol = 0xb81818;
        else if (style === 'ek9_typer' || style === 'type_r') defaultCaliperCol = 0x343840;
        else if (style === 'supra_5spoke' || style === 'supra_rz') defaultCaliperCol = 0x16161a;
        else if (style === 's15_spec_r' || style === 's15_5spoke') defaultCaliperCol = 0x383a42;
        const finalCaliperColor = caliperColor !== null ? caliperColor : defaultCaliperCol;

        const caliperTex = this.createCaliperTexture(style, finalCaliperColor);
        const caliperMat = new THREE.MeshStandardMaterial({
            color: finalCaliperColor,
            roughness: 0.18,
            metalness: 0.52
        });
        const caliperFaceMat = new THREE.MeshStandardMaterial({
            map: caliperTex,
            roughness: 0.18,
            metalness: 0.50
        });

        const rimRatio = (style === 'watanabe' || style === 'works_dish') ? 0.65 : 0.69;
        const rimHoleRadius = radius * rimRatio;
        const halfW = width * 0.5;
        const tireHalfW = halfW + 0.008;

        wheelPositions.forEach((wp) => {
            const pivot = new THREE.Group();
            pivot.position.set(wp.x, wp.y, wp.z);
            const inwardSign = wp.isLeft ? 1 : -1;

            // =====================================================================
            // 1. Stationary Wheel Surround & Brake Assembly (車体側静止パーツ群)
            // =====================================================================
            const surroundGroup = new THREE.Group();
            const rotorRadius = rimHoleRadius * 0.77;
            const rotorThick = 0.024;

            // 1.1 インナーフェンダー・ホイールハウスライナー
            const archLinerGeom = new THREE.CylinderGeometry(radius * 1.15, radius * 1.15, width * 1.30, 24, 1, true, -Math.PI * 0.82, Math.PI * 0.64);
            archLinerGeom.rotateZ(Math.PI / 2);
            const archLiner = new THREE.Mesh(archLinerGeom, archLinerMat);
            archLiner.position.set(inwardSign * 0.02, 0, 0);
            surroundGroup.add(archLiner);

            // 1.2 ★【300％超進化】ツインスプリング式レーシング車高調サスペンション
            const suspGroup = new THREE.Group();
            suspGroup.position.set(inwardSign * 0.045, 0.12, 0);

            // 鏡面クローム ダンパーロッド
            const damperRod = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.30, 14),
                damperRodMat
            );
            damperRod.position.y = 0.05;
            suspGroup.add(damperRod);

            // アノダイズドゴールド ダンパーシリンダー
            const shockBody = new THREE.Mesh(
                new THREE.CylinderGeometry(0.024, 0.024, 0.20, 14),
                shockBodyMat
            );
            shockBody.position.y = -0.06;
            suspGroup.add(shockBody);

            // アジャスタブル車高調整ダブルロックシート
            for (let c of [-0.022, -0.010]) {
                const lockRing = new THREE.Mesh(
                    new THREE.TorusGeometry(0.029, 0.005, 8, 20),
                    lockCollarMat
                );
                lockRing.rotateX(Math.PI / 2);
                lockRing.position.y = c;
                suspGroup.add(lockRing);
            }

            // 下段：フラットワイヤー・ヘルパースプリング（3段）
            for (let hs = 0; hs < 3; hs++) {
                const hCoil = new THREE.Mesh(
                    new THREE.TorusGeometry(0.028, 0.0035, 6, 20),
                    helperSpringMat
                );
                hCoil.rotateX(Math.PI / 2);
                hCoil.position.y = -0.002 + hs * 0.010;
                suspGroup.add(hCoil);
            }

            // 中間スプリングスペーサーシート
            const spacerSeat = new THREE.Mesh(
                new THREE.TorusGeometry(0.029, 0.004, 8, 20),
                spacerSeatMat
            );
            spacerSeat.rotateX(Math.PI / 2);
            spacerSeat.position.y = 0.030;
            suspGroup.add(spacerSeat);

            // 上段：メインレーシングコイルスプリング（6段ヘリカルコイル）
            for (let sp = 0; sp < 6; sp++) {
                const coil = new THREE.Mesh(
                    new THREE.TorusGeometry(0.028, 0.0055, 8, 22),
                    coilSpringMat
                );
                coil.rotateX(Math.PI / 2);
                coil.position.y = 0.044 + sp * 0.022;
                suspGroup.add(coil);
            }
            surroundGroup.add(suspGroup);

            // 1.3 ナックルハブ・アップライト
            const knuckle = new THREE.Mesh(
                new THREE.BoxGeometry(0.036, 0.13, 0.064),
                new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.85, metalness: 0.35 })
            );
            knuckle.position.set(inwardSign * 0.038, 0, 0);
            surroundGroup.add(knuckle);

            // 1.4 ブレーキバックプレート・防熱ダストシールド
            const dustShieldGeom = new THREE.RingGeometry(rotorRadius * 0.38, rotorRadius * 1.05, 36);
            dustShieldGeom.rotateY(wp.isLeft ? -Math.PI / 2 : Math.PI / 2);
            const dustShield = new THREE.Mesh(dustShieldGeom, dustShieldMat);
            dustShield.position.x = inwardSign * 0.020;
            surroundGroup.add(dustShield);

            // 1.5 対向ピストン・レーシングブレーキキャリパー
            const caliperGroup = new THREE.Group();
            const caliperBody = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.32, rotorRadius * 0.44, 0.082),
                caliperMat
            );
            caliperGroup.add(caliperBody);

            // 高精細キャリパーロゴプレート
            const caliperFaceGeom = new THREE.PlaneGeometry(width * 0.31, rotorRadius * 0.43);
            caliperFaceGeom.rotateY(wp.isLeft ? -Math.PI / 2 : Math.PI / 2);
            const caliperFace = new THREE.Mesh(caliperFaceGeom, caliperFaceMat);
            caliperFace.position.x = (wp.isLeft ? -1 : 1) * (width * 0.16 + 0.001);
            caliperGroup.add(caliperFace);

            // 剛性強化外周ブリッジアーチ
            const caliperBridge = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.34, 0.022, 0.068),
                caliperMat
            );
            caliperBridge.position.set(0, rotorRadius * 0.22, -0.016);
            caliperGroup.add(caliperBridge);

            // 油圧ピストンシリンダー
            for (let p of [-0.038, 0.038]) {
                const piston = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.019, 0.019, width * 0.35, 14),
                    new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.40, metalness: 0.70 })
                );
                piston.rotateZ(Math.PI / 2);
                piston.position.set(0, p, 0.014);
                caliperGroup.add(piston);
            }

            // パッドスプリング＆ピン
            const padSpring = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.26, 0.012, 0.038),
                chromeNutMat
            );
            padSpring.position.set(0, 0, 0.038);
            caliperGroup.add(padSpring);

            const retainerPin = new THREE.Mesh(
                new THREE.CylinderGeometry(0.0028, 0.0028, 0.076, 8),
                chromeNutMat
            );
            retainerPin.position.set(0, 0, 0.040);
            caliperGroup.add(retainerPin);

            // ブリーダーニップル＆ゴムキャップ
            const bleeder = new THREE.Mesh(
                new THREE.CylinderGeometry(0.003, 0.003, 0.016, 8),
                chromeNutMat
            );
            bleeder.position.set(0, rotorRadius * 0.20, 0.036);
            caliperGroup.add(bleeder);
            const bleederCap = new THREE.Mesh(
                new THREE.CylinderGeometry(0.004, 0.004, 0.008, 8),
                new THREE.MeshStandardMaterial({ color: 0x111114, roughness: 0.90 })
            );
            bleederCap.position.set(0, rotorRadius * 0.20 + 0.008, 0.036);
            caliperGroup.add(bleederCap);

            // ステンメッシュブレーキホース＆バンジョー金具
            const banjo = new THREE.Mesh(
                new THREE.CylinderGeometry(0.006, 0.006, 0.014, 6),
                chromeNutMat
            );
            banjo.position.set(inwardSign * 0.04, -rotorRadius * 0.15, 0.030);
            caliperGroup.add(banjo);

            const brakeHose = new THREE.Mesh(
                new THREE.CylinderGeometry(0.0032, 0.0032, 0.12, 8),
                new THREE.MeshStandardMaterial({ color: 0x9098a2, roughness: 0.38, metalness: 0.75 })
            );
            brakeHose.position.set(inwardSign * 0.045, -rotorRadius * 0.08, 0.045);
            brakeHose.rotation.x = 0.45;
            caliperGroup.add(brakeHose);

            const calAngle = Math.PI * 0.58;
            caliperGroup.position.set(
                wp.isLeft ? -0.018 : 0.018,
                Math.sin(calAngle) * (rotorRadius * 0.82),
                Math.cos(calAngle) * (rotorRadius * 0.82)
            );
            caliperGroup.rotation.x = -calAngle + Math.PI / 2;
            surroundGroup.add(caliperGroup);
            pivot.add(surroundGroup);

            // =====================================================================
            // 2. Rotating Wheel Assembly (車輪とともに超精密3D回転)
            // =====================================================================
            const mesh = new THREE.Group();

            // 2.1 2ピースベンチレーテッド・レーシングブレーキローター
            const discThick = 0.005;
            const discOffset = 0.006;
            for (let side of [-1, 1]) {
                const discRingGeom = new THREE.RingGeometry(rotorRadius * 0.44, rotorRadius, 48);
                discRingGeom.rotateY(side < 0 ? -Math.PI / 2 : Math.PI / 2);
                const disc = new THREE.Mesh(discRingGeom, rotorMat);
                disc.position.x = side * discOffset;
                mesh.add(disc);

                const edgeGeom = new THREE.CylinderGeometry(rotorRadius, rotorRadius, discThick, 48, 1, true);
                edgeGeom.rotateZ(Math.PI / 2);
                const edgeMesh = new THREE.Mesh(edgeGeom, stepBarrelMat);
                edgeMesh.position.x = side * (discOffset - discThick * 0.5);
                mesh.add(edgeMesh);
            }

            // 12枚の内部冷却フィン
            for (let v = 0; v < 12; v++) {
                const vAngle = (v / 12) * Math.PI * 2;
                const vaneMesh = new THREE.Mesh(
                    new THREE.BoxGeometry(discOffset * 2, rotorRadius * 0.44, 0.005),
                    rotorVaneMat
                );
                vaneMesh.position.set(
                    0,
                    Math.cos(vAngle) * (rotorRadius * 0.68),
                    Math.sin(vAngle) * (rotorRadius * 0.68)
                );
                vaneMesh.rotation.x = -vAngle + 0.25;
                mesh.add(vaneMesh);
            }

            // フローティングベルハウジング＆10個のボビンピン
            const bellRadius = rotorRadius * 0.44;
            const bellGeom = new THREE.CylinderGeometry(bellRadius, bellRadius, rotorThick + 0.008, 32);
            bellGeom.rotateZ(Math.PI / 2);
            const bell = new THREE.Mesh(bellGeom, bellHousingMat);
            mesh.add(bell);

            for (let b = 0; b < 10; b++) {
                const bAngle = (b / 10) * Math.PI * 2;
                const bobbin = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.0055, 0.0055, rotorThick + 0.010, 8),
                    chromeNutMat
                );
                bobbin.rotateZ(Math.PI / 2);
                bobbin.position.set(0, Math.cos(bAngle) * (bellRadius * 0.94), Math.sin(bAngle) * (bellRadius * 0.94));
                mesh.add(bobbin);
            }

            // 32mmスピンドルキャッスルナット＆割りピン
            const spindleNut = new THREE.Mesh(
                new THREE.CylinderGeometry(0.016, 0.016, 0.016, 6),
                chromeNutMat
            );
            spindleNut.rotateZ(Math.PI / 2);
            spindleNut.position.x = (wp.isLeft ? -1 : 1) * 0.015;
            mesh.add(spindleNut);

            // =====================================================================
            // 2.2 ★【300％極限進化】物理的3Dトレッド溝＆非対称スポーツタイヤ
            // =====================================================================
            // (a) タイヤベースカーカス（有機的曲面サイドウォール＆溝底）
            const carcassRadius = radius - 0.0075;
            const tirePoints = [
                new THREE.Vector2(-halfW + 0.010, rimHoleRadius),
                new THREE.Vector2(-tireHalfW, rimHoleRadius + (radius - rimHoleRadius) * 0.28),
                new THREE.Vector2(-tireHalfW - 0.004, rimHoleRadius + (radius - rimHoleRadius) * 0.55),
                new THREE.Vector2(-halfW + 0.012, carcassRadius),
                new THREE.Vector2(-halfW * 0.5, carcassRadius),
                new THREE.Vector2(0, carcassRadius),
                new THREE.Vector2(halfW * 0.5, carcassRadius),
                new THREE.Vector2(halfW - 0.012, carcassRadius),
                new THREE.Vector2(tireHalfW + 0.004, rimHoleRadius + (radius - rimHoleRadius) * 0.55),
                new THREE.Vector2(tireHalfW, rimHoleRadius + (radius - rimHoleRadius) * 0.28),
                new THREE.Vector2(halfW - 0.010, rimHoleRadius)
            ];
            const lathePoints = tirePoints.map(p => new THREE.Vector2(p.y, p.x));
            const tireGeom = new THREE.LatheGeometry(lathePoints, 48);
            tireGeom.rotateZ(Math.PI / 2);
            tireGeom.computeVertexNormals();
            const tireMesh = new THREE.Mesh(tireGeom, realTireMat);
            tireMesh.castShadow = true;
            mesh.add(tireMesh);

            // (b) リムプロテクタービード（ホイールリムを保護する立体ゴムリブ）
            const rimGuardGeom = new THREE.TorusGeometry(rimHoleRadius * 1.04, 0.0045, 12, 48);
            rimGuardGeom.rotateY(Math.PI / 2);
            const rimGuard = new THREE.Mesh(rimGuardGeom, realTireMat);
            rimGuard.position.x = (wp.isLeft ? -1 : 1) * (halfW - 0.006);
            mesh.add(rimGuard);

            // (c) 外側サイドウォール専用高解像度ブランド刻印ディスク
            const outerSwRingGeom = new THREE.RingGeometry(rimHoleRadius * 1.01, radius * 0.985, 48);
            outerSwRingGeom.rotateY(wp.isLeft ? -Math.PI / 2 : Math.PI / 2);
            const outerSwMesh = new THREE.Mesh(outerSwRingGeom, sidewallMat);
            outerSwMesh.position.x = (wp.isLeft ? -1 : 1) * (tireHalfW + 0.001);
            mesh.add(outerSwMesh);

            // (d) ★【物理的3Dトレッド溝】4列の立体リブバンド＆3本の主排水縦溝
            const treadTopRadius = radius + 0.0008;
            const ribConfigs = [
                { xCenter: -width * 0.35, ribW: width * 0.17 }, // 外側ショルダーリブ
                { xCenter: -width * 0.12, ribW: width * 0.15 }, // 外側インナーリブ
                { xCenter: width * 0.12,  ribW: width * 0.15 }, // 内側インナーリブ
                { xCenter: width * 0.35,  ribW: width * 0.17 }  // 内側ショルダーリブ
            ];

            ribConfigs.forEach((cfg) => {
                const ribGeom = new THREE.CylinderGeometry(treadTopRadius, treadTopRadius, cfg.ribW, 48, 1, true);
                ribGeom.rotateZ(Math.PI / 2);
                const ribMesh = new THREE.Mesh(ribGeom, treadRibMat);
                ribMesh.position.x = cfg.xCenter;
                mesh.add(ribMesh);

                for (let s of [-cfg.ribW * 0.5, cfg.ribW * 0.5]) {
                    const wallGeom = new THREE.RingGeometry(carcassRadius, treadTopRadius, 48);
                    wallGeom.rotateY(s < 0 ? -Math.PI / 2 : Math.PI / 2);
                    const wallMesh = new THREE.Mesh(wallGeom, tireGrooveBaseMat);
                    wallMesh.position.x = cfg.xCenter + s;
                    mesh.add(wallMesh);
                }
            });

            // (e) ★【物理的3Dサイプ】全周24個の立体方向性トラクション切り欠き（ショルダー＋センター）
            for (let notch = 0; notch < 24; notch++) {
                const nAngle = (notch / 24) * Math.PI * 2;
                // 外側ショルダー横溝
                const sipeOuter = new THREE.Mesh(
                    new THREE.BoxGeometry(width * 0.175, 0.0085, 0.0055),
                    tireGrooveBaseMat
                );
                sipeOuter.position.set(
                    -width * 0.35,
                    Math.cos(nAngle) * (radius - 0.0035),
                    Math.sin(nAngle) * (radius - 0.0035)
                );
                sipeOuter.rotation.x = -nAngle + 0.20;
                mesh.add(sipeOuter);

                // 内側ショルダー横溝
                const sipeInner = new THREE.Mesh(
                    new THREE.BoxGeometry(width * 0.175, 0.0085, 0.0055),
                    tireGrooveBaseMat
                );
                sipeInner.position.set(
                    width * 0.35,
                    Math.cos(nAngle) * (radius - 0.0035),
                    Math.sin(nAngle) * (radius - 0.0035)
                );
                sipeInner.rotation.x = -nAngle - 0.20;
                mesh.add(sipeInner);

                // センター斜め方向性サイプ
                if (notch % 2 === 0) {
                    const sipeCenter = new THREE.Mesh(
                        new THREE.BoxGeometry(width * 0.14, 0.0085, 0.0045),
                        tireGrooveBaseMat
                    );
                    sipeCenter.position.set(
                        -width * 0.12,
                        Math.cos(nAngle) * (radius - 0.0035),
                        Math.sin(nAngle) * (radius - 0.0035)
                    );
                    sipeCenter.rotation.x = -nAngle + 0.35;
                    mesh.add(sipeCenter);
                }
            }

            // 2.3 アルミホイールバレル＆アウターリムフランジ
            const barrelGeom = new THREE.CylinderGeometry(rimHoleRadius - 0.002, rimHoleRadius * 0.94, width * 0.90, 48, 1, true);
            barrelGeom.rotateZ(Math.PI / 2);
            const barrel = new THREE.Mesh(barrelGeom, stepBarrelMat);
            mesh.add(barrel);

            const rimLipX = (wp.isLeft ? -1 : 1) * (halfW - 0.014);
            const activeLipMat = isModularLip ? mirrorLipMat : rimMat;

            // アウターリムフランジ
            const lipFlangeGeom = new THREE.CylinderGeometry(rimHoleRadius, rimHoleRadius, 0.016, 48, 1, true);
            lipFlangeGeom.rotateZ(Math.PI / 2);
            const lipFlange = new THREE.Mesh(lipFlangeGeom, activeLipMat);
            lipFlange.position.x = rimLipX;
            mesh.add(lipFlange);

            // リムビードカールトーラス
            const lipBeadGeom = new THREE.TorusGeometry(rimHoleRadius, 0.006, 16, 48);
            lipBeadGeom.rotateY(Math.PI / 2);
            const lipBead = new THREE.Mesh(lipBeadGeom, activeLipMat);
            lipBead.position.x = rimLipX;
            mesh.add(lipBead);

            // 段付きドロップセンターチャンネル
            const dropCenterGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.985, rimHoleRadius * 0.935, 0.020, 48, 1, true);
            dropCenterGeom.rotateZ(Math.PI / 2);
            const dropCenter = new THREE.Mesh(dropCenterGeom, isModularLip ? mirrorLipMat : stepBarrelMat);
            dropCenter.position.x = rimLipX + (wp.isLeft ? 0.012 : -0.012);
            mesh.add(dropCenter);

            // インナーバレル貼付式ホイールバランサーウェイト（8連亜鉛ブロック）
            for (let wIdx = 0; wIdx < 8; wIdx++) {
                const bw = new THREE.Mesh(
                    new THREE.BoxGeometry(0.007, 0.011, 0.009),
                    balanceWeightMat
                );
                const bAngle = 0.38 + (wIdx * 0.038);
                const bwR = rimHoleRadius * 0.938;
                bw.position.set(
                    rimLipX + (wp.isLeft ? 0.040 : -0.040),
                    Math.cos(bAngle) * bwR,
                    Math.sin(bAngle) * bwR
                );
                bw.rotation.x = -bAngle;
                mesh.add(bw);
            }

            // 3Dアングル付き金属製エアバルブステム＆ローレットキャップ
            const valveStem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.0038, 0.0048, 0.026, 8),
                chromeNutMat
            );
            valveStem.position.set(
                rimLipX - (wp.isLeft ? -0.006 : 0.006),
                Math.cos(0.55) * (rimHoleRadius * 0.90),
                Math.sin(0.55) * (rimHoleRadius * 0.90)
            );
            valveStem.rotation.x = -0.55;
            valveStem.rotation.z = wp.isLeft ? 0.35 : -0.35;
            mesh.add(valveStem);

            const valveCap = new THREE.Mesh(
                new THREE.CylinderGeometry(0.0048, 0.0048, 0.008, 10),
                new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.35, metalness: 0.80 })
            );
            valveCap.position.set(
                rimLipX - (wp.isLeft ? -0.013 : 0.013),
                Math.cos(0.55) * (rimHoleRadius * 0.93),
                Math.sin(0.55) * (rimHoleRadius * 0.93)
            );
            valveCap.rotation.x = -0.55;
            valveCap.rotation.z = wp.isLeft ? 0.35 : -0.35;
            mesh.add(valveCap);

            // 2.4 車種別専用スポーク造形、ハブボウル、PCDボルト＆専用エンブレム
            this.addWheelSpokes(mesh, style, rimMat, radius, width, wp.isLeft, rimHoleRadius, rimLipX);

            pivot.add(mesh);
            parentGroup.add(pivot);

            wheels.push({ pivot, mesh, isFront: wp.isFront, isLeft: wp.isLeft });
            if (wp.isFront) {
                if (wp.isLeft) frontWheelL = pivot;
                else frontWheelR = pivot;
            }
        });

        return { wheels, frontWheelL, frontWheelR };
    }

    static addWheelSpokes(mesh, style, rimMat, radius, width, isLeft, rimHoleRadius, rimLipX) {
        const spokeGroup = new THREE.Group();
        const inwardSign = isLeft ? 1 : -1;
        const faceX = rimLipX + inwardSign * 0.002;

        const chromeNutMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.10,
            metalness: 0.88
        });
        const darkPocketMat = new THREE.MeshStandardMaterial({
            color: 0x121214,
            roughness: 0.92,
            metalness: 0.15
        });

        // 貫通オープンレーシングナット・スタッドボルト生成
        const addLugNutPattern = (bowlFloorX, pcdRadius, numLugs, nutColor = 0xffffff, startAngle = 0) => {
            const nutMat = (nutColor === 0xffffff) ? chromeNutMat : new THREE.MeshStandardMaterial({
                color: nutColor,
                roughness: 0.14,
                metalness: 0.88
            });
            for (let i = 0; i < numLugs; i++) {
                const angle = (i / numLugs) * Math.PI * 2 + startAngle;
                const ly = Math.cos(angle) * pcdRadius;
                const lz = Math.sin(angle) * pcdRadius;

                // 深型テーパー座面カウンターサンクポケット
                const pocket = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.013, 0.009, 0.012, 12),
                    darkPocketMat
                );
                pocket.rotateZ(Math.PI / 2);
                pocket.position.set(bowlFloorX - inwardSign * 0.002, ly, lz);
                spokeGroup.add(pocket);

                // 高精度六角レーシングナット
                const nut = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.0068, 0.0068, 0.014, 6),
                    nutMat
                );
                nut.rotateZ(Math.PI / 2);
                nut.position.set(bowlFloorX + inwardSign * 0.005, ly, lz);
                spokeGroup.add(nut);

                // ナット中心から覗くネジ山付きスタッドボルト芯
                const stud = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.0036, 0.0036, 0.015, 8),
                    new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.40, metalness: 0.75 })
                );
                stud.rotateZ(Math.PI / 2);
                stud.position.set(bowlFloorX + inwardSign * 0.007, ly, lz);
                spokeGroup.add(stud);
            }
        };

        // マルチピース組み立てピアスボルト（円周ボルト）
        const addPierceBolts = (circleRadius, boltCount, boltX) => {
            for (let b = 0; b < boltCount; b++) {
                const bAngle = (b / boltCount) * Math.PI * 2;
                const by = Math.cos(bAngle) * circleRadius;
                const bz = Math.sin(bAngle) * circleRadius;
                const bolt = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.0045, 0.0045, 0.008, 6),
                    chromeNutMat
                );
                bolt.rotateZ(Math.PI / 2);
                bolt.position.set(boltX, by, bz);
                spokeGroup.add(bolt);
            }
        };

        // スポーク付け根とアウターリムを自然に繋ぐフィレットガセット
        const addSpokeRimGusset = (spLen, angle, widthFront, widthRear) => {
            const gusset = new THREE.Mesh(
                new THREE.BoxGeometry(0.022, spLen * 0.22, widthFront * 1.25),
                rimMat
            );
            gusset.position.y = spLen + rimHoleRadius * 0.06;
            return gusset;
        };

        // 車種エンブレムテクスチャの取得
        const emblemTex = this.createCenterEmblemTexture(style);
        const emblemMat = new THREE.MeshStandardMaterial({
            map: emblemTex,
            roughness: 0.18,
            metalness: 0.55
        });

        // ---------------------------------------------------------------------
        // 1. AE86: RS Watanabe Eight Spoke F8 (8本バナナスポーク＆鶴マーク)
        // ---------------------------------------------------------------------
        if (style === 'watanabe') {
            const spokeCount = 8;
            const dishDepth = 0.024;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            const hubBowlGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.32, rimHoleRadius * 0.20, dishDepth + 0.004, 32, 1, true);
            hubBowlGeom.rotateZ(Math.PI / 2);
            const hubBowl = new THREE.Mesh(hubBowlGeom, rimMat);
            hubBowl.position.x = faceX + inwardSign * (dishDepth * 0.5);
            spokeGroup.add(hubBowl);

            // ワタナベ高精細エンブレムディスク
            const centerBadge = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.12, rimHoleRadius * 0.12, 0.008, 24),
                emblemMat
            );
            centerBadge.rotateZ(Math.PI / 2);
            centerBadge.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(centerBadge);

            // 8本オーガニックバナナスポーク（断面楕円＋リブ＋リム結合ガセット）
            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spGroup = new THREE.Group();
                spGroup.position.x = faceX + inwardSign * (dishDepth * 0.32);

                const spLen = rimHoleRadius * 0.84;
                const spokeMesh = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.024, 0.034, spLen, 14),
                    rimMat
                );
                spokeMesh.scale.set(1.0, 1.0, 0.72);
                spokeMesh.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                spokeMesh.rotation.z = isLeft ? 0.12 : -0.12;
                spGroup.add(spokeMesh);

                const ribMesh = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.014, 0.022, spLen * 0.90, 10),
                    rimMat
                );
                ribMesh.position.set(inwardSign * -0.005, spLen * 0.50 + rimHoleRadius * 0.18, 0);
                ribMesh.rotation.z = isLeft ? 0.12 : -0.12;
                spGroup.add(ribMesh);

                // リム結合部ガセット
                const gusset = new THREE.Mesh(
                    new THREE.BoxGeometry(0.020, 0.038, 0.048),
                    rimMat
                );
                gusset.position.set(0, spLen * 0.95 + rimHoleRadius * 0.18, 0);
                spGroup.add(gusset);

                spGroup.rotation.x = -angle;
                spokeGroup.add(spGroup);
            }

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.16, 4, 0xffffff, Math.PI / 4);

        // ---------------------------------------------------------------------
        // 2. FD3S: Mazdaspeed MS-01 (ゴールド5本スポーク、24ピアスボルト＆センターロック)
        // ---------------------------------------------------------------------
        } else if (style === 'ms01') {
            const spokeCount = 5;
            const dishDepth = 0.022;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            addPierceBolts(rimHoleRadius * 0.91, 24, faceX + inwardSign * 0.005);

            const hubBowlGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.35, rimHoleRadius * 0.22, dishDepth + 0.004, 32, 1, true);
            hubBowlGeom.rotateZ(Math.PI / 2);
            const hubBowl = new THREE.Mesh(hubBowlGeom, rimMat);
            hubBowl.position.x = faceX + inwardSign * (dishDepth * 0.5);
            spokeGroup.add(hubBowl);

            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spGroup = new THREE.Group();
                spGroup.position.x = faceX + inwardSign * (dishDepth * 0.34);

                const spLen = rimHoleRadius * 0.83;
                const spoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.024, spLen, 0.052),
                    rimMat
                );
                spoke.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                spoke.rotation.z = isLeft ? 0.11 : -0.11;
                spGroup.add(spoke);

                for (let wing of [-0.016, 0.016]) {
                    const bevel = new THREE.Mesh(
                        new THREE.BoxGeometry(0.015, spLen * 0.88, 0.016),
                        rimMat
                    );
                    bevel.position.set(inwardSign * -0.004, spLen * 0.50 + rimHoleRadius * 0.18, wing);
                    bevel.rotation.z = isLeft ? 0.11 : -0.11;
                    spGroup.add(bevel);
                }

                // リム結合ガセット
                const gusset = new THREE.Mesh(
                    new THREE.BoxGeometry(0.022, 0.035, 0.065),
                    rimMat
                );
                gusset.position.set(0, spLen * 0.94 + rimHoleRadius * 0.18, 0);
                spGroup.add(gusset);

                spGroup.rotation.x = -angle;
                spokeGroup.add(spGroup);
            }

            // センター大口径六角ロックナット
            const hexCap = new THREE.Mesh(
                new THREE.CylinderGeometry(0.036, 0.036, 0.016, 6),
                chromeNutMat
            );
            hexCap.rotateZ(Math.PI / 2);
            hexCap.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(hexCap);

            // マツダスピードエンブレム
            const msDisc = new THREE.Mesh(
                new THREE.CylinderGeometry(0.020, 0.020, 0.018, 20),
                emblemMat
            );
            msDisc.rotateZ(Math.PI / 2);
            msDisc.position.x = bowlFloorX + inwardSign * 0.004;
            spokeGroup.add(msDisc);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.24, 5, 0xffffff, Math.PI / 5);

        // ---------------------------------------------------------------------
        // 3. R32: BNR32 GT-R 純正鍛造16インチ 5本ツインスポーク (中央背骨リブ＆GT-Rバッジ)
        // ---------------------------------------------------------------------
        } else if (style === 'bnr32_oem' || style === 'gtr') {
            const spokeCount = 5;
            const dishDepth = 0.024;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            const hubBowlGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.36, rimHoleRadius * 0.20, dishDepth + 0.004, 32, 1, true);
            hubBowlGeom.rotateZ(Math.PI / 2);
            const hubBowl = new THREE.Mesh(hubBowlGeom, rimMat);
            hubBowl.position.x = faceX + inwardSign * (dishDepth * 0.5);
            spokeGroup.add(hubBowl);

            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spGroup = new THREE.Group();
                spGroup.position.x = faceX + inwardSign * (dishDepth * 0.32);

                const spLen = rimHoleRadius * 0.83;
                const mainSpoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.025, spLen, 0.058),
                    rimMat
                );
                mainSpoke.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                mainSpoke.rotation.z = isLeft ? 0.11 : -0.11;
                spGroup.add(mainSpoke);

                // 中央シャープ背骨リブ
                const ridgeSpoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.016, spLen * 0.94, 0.018),
                    rimMat
                );
                ridgeSpoke.position.set(inwardSign * -0.006, spLen * 0.50 + rimHoleRadius * 0.18, 0);
                ridgeSpoke.rotation.z = isLeft ? 0.11 : -0.11;
                spGroup.add(ridgeSpoke);

                for (let side of [-0.020, 0.020]) {
                    const chamfer = new THREE.Mesh(
                        new THREE.BoxGeometry(0.014, spLen * 0.85, 0.016),
                        rimMat
                    );
                    chamfer.position.set(inwardSign * -0.003, spLen * 0.48 + rimHoleRadius * 0.18, side);
                    chamfer.rotation.z = isLeft ? 0.11 : -0.11;
                    spGroup.add(chamfer);
                }

                // リム結合ガセット
                const gusset = new THREE.Mesh(
                    new THREE.BoxGeometry(0.024, 0.038, 0.072),
                    rimMat
                );
                gusset.position.set(0, spLen * 0.94 + rimHoleRadius * 0.18, 0);
                spGroup.add(gusset);

                spGroup.rotation.x = -angle;
                spokeGroup.add(spGroup);
            }

            // GT-R高精細エンブレムセンターキャップ
            const gtrCap = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.14, rimHoleRadius * 0.14, 0.014, 24),
                emblemMat
            );
            gtrCap.rotateZ(Math.PI / 2);
            gtrCap.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(gtrCap);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.22, 5, 0xffffff, Math.PI / 5);

        // ---------------------------------------------------------------------
        // 4. S13: SSR Formula Mesh (ダイヤモンド交差メッシュ＆深リム)
        // ---------------------------------------------------------------------
        } else if (style === 'ssr_mesh') {
            const meshCount = 16;
            const dishDepth = 0.026;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            addPierceBolts(rimHoleRadius * 0.90, 24, faceX + inwardSign * 0.006);

            const meshHub = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.36, rimHoleRadius * 0.26, dishDepth + 0.004, 24),
                rimMat
            );
            meshHub.rotateZ(Math.PI / 2);
            meshHub.position.x = faceX + inwardSign * (dishDepth * 0.52);
            spokeGroup.add(meshHub);

            const innerRing = new THREE.Mesh(
                new THREE.TorusGeometry(rimHoleRadius * 0.55, 0.009, 8, 28),
                rimMat
            );
            innerRing.rotateY(Math.PI / 2);
            innerRing.position.x = faceX + inwardSign * (dishDepth * 0.38);
            spokeGroup.add(innerRing);

            for (let i = 0; i < meshCount; i++) {
                const angle = (i / meshCount) * Math.PI * 2;
                const spLen = rimHoleRadius * 0.83;

                for (let cross of [-0.32, 0.32]) {
                    const spGroup = new THREE.Group();
                    spGroup.position.x = faceX + inwardSign * (dishDepth * 0.36);

                    const blade = new THREE.Mesh(
                        new THREE.BoxGeometry(0.012, spLen, 0.016),
                        rimMat
                    );
                    blade.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                    blade.rotation.z = cross;
                    spGroup.add(blade);

                    spGroup.rotation.x = -angle;
                    spokeGroup.add(spGroup);
                }
            }

            // SSR Speed Starセンタータワー
            const ssrTower = new THREE.Mesh(
                new THREE.CylinderGeometry(0.034, 0.036, 0.018, 6),
                chromeNutMat
            );
            ssrTower.rotateZ(Math.PI / 2);
            ssrTower.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(ssrTower);

            const ssrDisc = new THREE.Mesh(
                new THREE.CylinderGeometry(0.020, 0.020, 0.020, 20),
                emblemMat
            );
            ssrDisc.rotateZ(Math.PI / 2);
            ssrDisc.position.x = bowlFloorX + inwardSign * 0.004;
            spokeGroup.add(ssrDisc);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.22, 4, 0xffffff, Math.PI / 4);

        // ---------------------------------------------------------------------
        // 5. JZX100: Yokohama AVS Model 5 (アグレッシブディープコンケイブ ツイン5スポーク)
        // ---------------------------------------------------------------------
        } else if (style === 'avs_model5' || style === 'avs5') {
            const spokePairs = 5;
            const dishDepth = 0.028;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            const hubBowlGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.34, rimHoleRadius * 0.20, dishDepth + 0.004, 32, 1, true);
            hubBowlGeom.rotateZ(Math.PI / 2);
            const hubBowl = new THREE.Mesh(hubBowlGeom, rimMat);
            hubBowl.position.x = faceX + inwardSign * (dishDepth * 0.52);
            spokeGroup.add(hubBowl);

            for (let i = 0; i < spokePairs; i++) {
                const pairAngle = (i / spokePairs) * Math.PI * 2;
                const spLen = rimHoleRadius * 0.84;

                for (let twin of [-0.070, 0.070]) {
                    const spGroup = new THREE.Group();
                    spGroup.position.x = faceX + inwardSign * (dishDepth * 0.30);

                    const spoke = new THREE.Mesh(
                        new THREE.BoxGeometry(0.022, spLen, 0.026),
                        rimMat
                    );
                    spoke.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                    spoke.rotation.z = isLeft ? 0.14 : -0.14;
                    spGroup.add(spoke);

                    const bevel = new THREE.Mesh(
                        new THREE.BoxGeometry(0.015, spLen * 0.92, 0.012),
                        rimMat
                    );
                    bevel.position.set(inwardSign * -0.004, spLen * 0.50 + rimHoleRadius * 0.18, 0);
                    bevel.rotation.z = isLeft ? 0.14 : -0.14;
                    spGroup.add(bevel);

                    const gusset = new THREE.Mesh(
                        new THREE.BoxGeometry(0.020, 0.035, 0.036),
                        rimMat
                    );
                    gusset.position.set(0, spLen * 0.94 + rimHoleRadius * 0.18, 0);
                    spGroup.add(gusset);

                    spGroup.rotation.x = -(pairAngle + twin);
                    spokeGroup.add(spGroup);
                }
            }

            const avsCap = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.13, rimHoleRadius * 0.13, 0.014, 24),
                emblemMat
            );
            avsCap.rotateZ(Math.PI / 2);
            avsCap.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(avsCap);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.22, 5, 0x222226, Math.PI / 5);

        // ---------------------------------------------------------------------
        // 6. CE9A: OZ Racing Chrono Rally 5本スポーク (コンペホワイト＆OZロゴ)
        // ---------------------------------------------------------------------
        } else if (style === 'oz_chrono' || style === 'oz') {
            const spokeCount = 5;
            const dishDepth = 0.020;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            const hubBowlGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.38, rimHoleRadius * 0.24, dishDepth + 0.004, 32, 1, true);
            hubBowlGeom.rotateZ(Math.PI / 2);
            const hubBowl = new THREE.Mesh(hubBowlGeom, rimMat);
            hubBowl.position.x = faceX + inwardSign * (dishDepth * 0.5);
            spokeGroup.add(hubBowl);

            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spGroup = new THREE.Group();
                spGroup.position.x = faceX + inwardSign * (dishDepth * 0.32);

                const spLen = rimHoleRadius * 0.83;
                const spoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.024, spLen, 0.072),
                    rimMat
                );
                spoke.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                spoke.rotation.z = isLeft ? 0.09 : -0.09;
                spGroup.add(spoke);

                for (let side of [-0.026, 0.026]) {
                    const draft = new THREE.Mesh(
                        new THREE.BoxGeometry(0.015, spLen * 0.88, 0.018),
                        rimMat
                    );
                    draft.position.set(inwardSign * -0.004, spLen * 0.48 + rimHoleRadius * 0.18, side);
                    draft.rotation.z = isLeft ? 0.09 : -0.09;
                    spGroup.add(draft);
                }

                const gusset = new THREE.Mesh(
                    new THREE.BoxGeometry(0.022, 0.038, 0.084),
                    rimMat
                );
                gusset.position.set(0, spLen * 0.94 + rimHoleRadius * 0.18, 0);
                spGroup.add(gusset);

                spGroup.rotation.x = -angle;
                spokeGroup.add(spGroup);
            }

            const ozCap = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.15, rimHoleRadius * 0.15, 0.014, 24),
                emblemMat
            );
            ozCap.rotateZ(Math.PI / 2);
            ozCap.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(ozCap);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.23, 5, 0xffffff, Math.PI / 5);

        // ---------------------------------------------------------------------
        // 7. EK9: Honda Civic Type R OEM 7本スポーク (チャンピオンシップホワイト＆赤H)
        // ---------------------------------------------------------------------
        } else if (style === 'ek9_typer' || style === 'type_r') {
            const spokeCount = 7;
            const dishDepth = 0.020;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            const hubBowlGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.34, rimHoleRadius * 0.22, dishDepth + 0.004, 32, 1, true);
            hubBowlGeom.rotateZ(Math.PI / 2);
            const hubBowl = new THREE.Mesh(hubBowlGeom, rimMat);
            hubBowl.position.x = faceX + inwardSign * (dishDepth * 0.5);
            spokeGroup.add(hubBowl);

            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spGroup = new THREE.Group();
                spGroup.position.x = faceX + inwardSign * (dishDepth * 0.30);

                const spLen = rimHoleRadius * 0.83;
                const spoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.024, spLen, 0.042),
                    rimMat
                );
                spoke.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                spoke.rotation.z = isLeft ? 0.09 : -0.09;
                spGroup.add(spoke);

                const crown = new THREE.Mesh(
                    new THREE.BoxGeometry(0.015, spLen * 0.90, 0.018),
                    rimMat
                );
                crown.position.set(inwardSign * -0.004, spLen * 0.50 + rimHoleRadius * 0.18, 0);
                crown.rotation.z = isLeft ? 0.09 : -0.09;
                spGroup.add(crown);

                const gusset = new THREE.Mesh(
                    new THREE.BoxGeometry(0.022, 0.035, 0.054),
                    rimMat
                );
                gusset.position.set(0, spLen * 0.94 + rimHoleRadius * 0.18, 0);
                spGroup.add(gusset);

                spGroup.rotation.x = -angle;
                spokeGroup.add(spGroup);
            }

            const typeRCap = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.14, rimHoleRadius * 0.14, 0.014, 24),
                emblemMat
            );
            typeRCap.rotateZ(Math.PI / 2);
            typeRCap.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(typeRCap);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.22, 5, 0xffffff, Math.PI / 5);

        // ---------------------------------------------------------------------
        // 8. RPS13: SSR Longchamp XR-4 (4本クロスブレード＆ブラックポケット)
        // ---------------------------------------------------------------------
        } else if (style === 'longchamp' || style === '5star') {
            const spokeCount = 4;
            const dishDepth = 0.026;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            addPierceBolts(rimHoleRadius * 0.91, 16, faceX + inwardSign * 0.006);

            const darkHub = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.36, rimHoleRadius * 0.26, dishDepth + 0.004, 24),
                darkPocketMat
            );
            darkHub.rotateZ(Math.PI / 2);
            darkHub.position.x = faceX + inwardSign * (dishDepth * 0.52);
            spokeGroup.add(darkHub);

            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spGroup = new THREE.Group();
                spGroup.position.x = faceX + inwardSign * (dishDepth * 0.34);

                const spLen = rimHoleRadius * 0.83;
                const blade = new THREE.Mesh(
                    new THREE.BoxGeometry(0.026, spLen, 0.076),
                    new THREE.MeshStandardMaterial({ color: 0xfafcff, roughness: 0.12, metalness: 0.70 })
                );
                blade.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                blade.rotation.z = isLeft ? 0.12 : -0.12;
                spGroup.add(blade);

                const rib = new THREE.Mesh(
                    new THREE.BoxGeometry(0.016, spLen * 0.92, 0.030),
                    chromeNutMat
                );
                rib.position.set(inwardSign * -0.006, spLen * 0.50 + rimHoleRadius * 0.18, 0);
                rib.rotation.z = isLeft ? 0.12 : -0.12;
                spGroup.add(rib);

                const gusset = new THREE.Mesh(
                    new THREE.BoxGeometry(0.024, 0.038, 0.090),
                    chromeNutMat
                );
                gusset.position.set(0, spLen * 0.94 + rimHoleRadius * 0.18, 0);
                spGroup.add(gusset);

                spGroup.rotation.x = -angle;
                spokeGroup.add(spGroup);
            }

            const centerCap = new THREE.Mesh(
                new THREE.CylinderGeometry(0.032, 0.034, 0.018, 20),
                emblemMat
            );
            centerCap.rotateZ(Math.PI / 2);
            centerCap.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(centerCap);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.22, 4, 0xffffff, Math.PI / 4);

        // ---------------------------------------------------------------------
        // 9. CC72V: Suzuki Alto Works Aero Dish (削り出しディッシュ＆4スリット)
        // ---------------------------------------------------------------------
        } else if (style === 'works_dish') {
            const dishDepth = 0.018;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            const dishGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.98, rimHoleRadius * 0.96, 0.018, 32);
            dishGeom.rotateZ(Math.PI / 2);
            const dish = new THREE.Mesh(dishGeom, rimMat);
            dish.position.x = faceX + inwardSign * (dishDepth * 0.40);
            spokeGroup.add(dish);

            for (let s = 0; s < 4; s++) {
                const sAngle = (s / 4) * Math.PI * 2 + Math.PI / 4;
                const slot = new THREE.Mesh(
                    new THREE.BoxGeometry(0.024, rimHoleRadius * 0.26, 0.036),
                    darkPocketMat
                );
                slot.position.set(
                    faceX + inwardSign * (dishDepth * 0.40),
                    Math.cos(sAngle) * (rimHoleRadius * 0.68),
                    Math.sin(sAngle) * (rimHoleRadius * 0.68)
                );
                slot.rotation.x = -sAngle;
                spokeGroup.add(slot);
            }

            const worksCap = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.22, rimHoleRadius * 0.22, 0.022, 24),
                emblemMat
            );
            worksCap.rotateZ(Math.PI / 2);
            worksCap.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(worksCap);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.20, 4, 0xffffff, Math.PI / 4);

        // ---------------------------------------------------------------------
        // 10. JZA80: Toyota Supra RZ OEM 17-inch 5本スポーク (流体リブ＆トヨタエンブレム)
        // ---------------------------------------------------------------------
        } else if (style === 'supra_rz' || style === 'supra_5spoke') {
            const spokeCount = 5;
            const dishDepth = 0.024;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            const hubBowlGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.36, rimHoleRadius * 0.22, dishDepth + 0.004, 32, 1, true);
            hubBowlGeom.rotateZ(Math.PI / 2);
            const hubBowl = new THREE.Mesh(hubBowlGeom, rimMat);
            hubBowl.position.x = faceX + inwardSign * (dishDepth * 0.5);
            spokeGroup.add(hubBowl);

            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spGroup = new THREE.Group();
                spGroup.position.x = faceX + inwardSign * (dishDepth * 0.32);

                const spLen = rimHoleRadius * 0.83;
                const spoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.026, spLen, 0.066),
                    rimMat
                );
                spoke.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                spoke.rotation.z = isLeft ? 0.11 : -0.11;
                spGroup.add(spoke);

                for (let flute of [-0.018, 0.018]) {
                    const ridge = new THREE.Mesh(
                        new THREE.CylinderGeometry(0.010, 0.013, spLen * 0.92, 10),
                        rimMat
                    );
                    ridge.position.set(inwardSign * -0.005, spLen * 0.50 + rimHoleRadius * 0.18, flute);
                    ridge.rotation.z = isLeft ? 0.11 : -0.11;
                    spGroup.add(ridge);
                }

                const gusset = new THREE.Mesh(
                    new THREE.BoxGeometry(0.024, 0.038, 0.078),
                    rimMat
                );
                gusset.position.set(0, spLen * 0.94 + rimHoleRadius * 0.18, 0);
                spGroup.add(gusset);

                spGroup.rotation.x = -angle;
                spokeGroup.add(spGroup);
            }

            const supraCap = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.14, rimHoleRadius * 0.14, 0.014, 24),
                emblemMat
            );
            supraCap.rotateZ(Math.PI / 2);
            supraCap.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(supraCap);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.22, 5, 0xffffff, Math.PI / 5);

        // ---------------------------------------------------------------------
        // 11. S15: Nissan Silvia Spec-R OEM 16-inch 5本スポーク (ツインフルート溝＆Sエンブレム)
        // ---------------------------------------------------------------------
        } else if (style === 's15_spec_r' || style === 's15_5spoke') {
            const spokeCount = 5;
            const dishDepth = 0.024;
            const bowlFloorX = faceX + inwardSign * dishDepth;

            const hubBowlGeom = new THREE.CylinderGeometry(rimHoleRadius * 0.35, rimHoleRadius * 0.20, dishDepth + 0.004, 32, 1, true);
            hubBowlGeom.rotateZ(Math.PI / 2);
            const hubBowl = new THREE.Mesh(hubBowlGeom, rimMat);
            hubBowl.position.x = faceX + inwardSign * (dishDepth * 0.5);
            spokeGroup.add(hubBowl);

            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spGroup = new THREE.Group();
                spGroup.position.x = faceX + inwardSign * (dishDepth * 0.32);

                const spLen = rimHoleRadius * 0.83;
                const mainSpoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.026, spLen, 0.060),
                    rimMat
                );
                mainSpoke.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                mainSpoke.rotation.z = isLeft ? 0.11 : -0.11;
                spGroup.add(mainSpoke);

                for (let flute of [-0.015, 0.015]) {
                    const ridge = new THREE.Mesh(
                        new THREE.BoxGeometry(0.015, spLen * 0.94, 0.013),
                        rimMat
                    );
                    ridge.position.set(inwardSign * -0.005, spLen * 0.50 + rimHoleRadius * 0.18, flute);
                    ridge.rotation.z = isLeft ? 0.11 : -0.11;
                    spGroup.add(ridge);
                }

                const trough = new THREE.Mesh(
                    new THREE.BoxGeometry(0.004, spLen * 0.88, 0.006),
                    darkPocketMat
                );
                trough.position.set(inwardSign * -0.002, spLen * 0.50 + rimHoleRadius * 0.18, 0);
                trough.rotation.z = isLeft ? 0.11 : -0.11;
                spGroup.add(trough);

                const gusset = new THREE.Mesh(
                    new THREE.BoxGeometry(0.024, 0.038, 0.072),
                    rimMat
                );
                gusset.position.set(0, spLen * 0.94 + rimHoleRadius * 0.18, 0);
                spGroup.add(gusset);

                spGroup.rotation.x = -angle;
                spokeGroup.add(spGroup);
            }

            const s15Cap = new THREE.Mesh(
                new THREE.CylinderGeometry(rimHoleRadius * 0.14, rimHoleRadius * 0.14, 0.014, 24),
                emblemMat
            );
            s15Cap.rotateZ(Math.PI / 2);
            s15Cap.position.x = bowlFloorX - inwardSign * 0.002;
            spokeGroup.add(s15Cap);

            addLugNutPattern(bowlFloorX, rimHoleRadius * 0.22, 5, 0xffffff, Math.PI / 5);

        // フォールバック
        } else {
            const spokeCount = 5;
            for (let i = 0; i < spokeCount; i++) {
                const angle = (i / spokeCount) * Math.PI * 2;
                const spGroup = new THREE.Group();
                spGroup.position.x = faceX;

                const spLen = rimHoleRadius * 0.83;
                const spoke = new THREE.Mesh(
                    new THREE.BoxGeometry(0.024, spLen, 0.050),
                    rimMat
                );
                spoke.position.y = spLen * 0.5 + rimHoleRadius * 0.18;
                spoke.rotation.z = isLeft ? 0.10 : -0.10;
                spGroup.add(spoke);

                spGroup.rotation.x = -angle;
                spokeGroup.add(spGroup);
            }
            addLugNutPattern(faceX + inwardSign * 0.015, rimHoleRadius * 0.22, 5);
        }

        mesh.add(spokeGroup);
    }

    static addSideMirrors(group, posX, posY, posZ, mirrorMat) {
        for (let s of [-1, 1]) {
            const mGroup = new THREE.Group();
            mGroup.position.set(s * posX, posY, posZ);

            // ステム
            const stem = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.025, 0.03), mirrorMat);
            stem.position.set(s * 0.03, 0, 0);
            mGroup.add(stem);

            // ハウジング
            const housing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.14), mirrorMat);
            housing.position.set(s * 0.07, 0.02, 0);
            mGroup.add(housing);

            // 鏡面
            const mirrorGlass = new THREE.Mesh(
                new THREE.PlaneGeometry(0.06, 0.05),
                new THREE.MeshStandardMaterial({ color: 0xaaccdd, metalness: 0.95, roughness: 0.1 })
            );
            mirrorGlass.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2;
            mirrorGlass.position.set(s * 0.07, 0.02, -0.072);
            mGroup.add(mirrorGlass);

            group.add(mGroup);
        }
    }

    static addLicensePlates(group, plateText, frontZ, rearZ, height, frontHeight = null, frontX = 0, isKei = false) {
        const plateTex = isKei ? this.createKeiYellowLicensePlateTexture(plateText) : this.createLicensePlateTexture(plateText);
        const plateMat = new THREE.MeshBasicMaterial({ map: plateTex });

        const fH = frontHeight !== null ? frontHeight : height;
        const rH = frontHeight !== null ? height : height + 0.04;

        // フロントプレート
        const fPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), plateMat);
        fPlate.position.set(frontX, fH, frontZ);
        group.add(fPlate);

        // リアプレート
        const rPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.16), plateMat);
        rPlate.rotation.y = Math.PI;
        rPlate.position.set(0, rH, rearZ);
        group.add(rPlate);
    }

    static createDetailedExhaust(parentGroup, canX, canY, canZ, tipX, tipY, tipZ, canRad, tipRad, tipColor = 0xcccccc) {
        const exGroup = new THREE.Group();
        const mufflerMat = new THREE.MeshStandardMaterial({ color: tipColor, metalness: 0.94, roughness: 0.15 });

        // 太鼓（サイレンサータイコ）
        const can = new THREE.Mesh(new THREE.CylinderGeometry(canRad, canRad, 0.40, 16), mufflerMat);
        can.rotation.x = Math.PI / 2;
        can.position.set(canX, canY, canZ);
        exGroup.add(can);

        // テールパイプ出口
        const tip = new THREE.Mesh(new THREE.CylinderGeometry(tipRad, tipRad, 0.24, 18), mufflerMat);
        tip.rotation.x = Math.PI / 2;
        tip.rotation.y = 0.08;
        tip.position.set(tipX, tipY, tipZ);
        exGroup.add(tip);

        // パイプ内側のブラック空洞
        const inner = new THREE.Mesh(new THREE.CircleGeometry(tipRad * 0.88, 16), new THREE.MeshBasicMaterial({ color: 0x050505 }));
        inner.rotation.y = Math.PI + 0.08;
        inner.position.set(tipX + 0.01, tipY, tipZ - 0.12);
        exGroup.add(inner);

        parentGroup.add(exGroup);
    }

    static addHeadlights(parentGroup, posX, posY, posZ) {
        const lights = [];
        for (let side of [-1, 1]) {
            // 前方路面を力強く射抜くツインスポットライト
            const light = new THREE.SpotLight(0xfff8de, 8.5, 110, Math.PI / 5.5, 0.45, 0.7);
            light.position.set(side * posX, posY, posZ);
            const targetObj = new THREE.Object3D();
            targetObj.position.set(side * posX * 0.7, -0.2, posZ + 42.0);
            parentGroup.add(targetObj);
            light.target = targetObj;
            parentGroup.add(light);
            lights.push(light);
        }

        // 前方至近距離の路面とバンパー下を照らすフィルライト
        const fillLight = new THREE.PointLight(0xfff5d8, 1.8, 18, 1.5);
        fillLight.position.set(0, posY, posZ + 0.3);
        parentGroup.add(fillLight);
        lights.push(fillLight);

        return lights;
    }

    // =========================================================================
    // Canvas動的テクスチャ生成エンジン
    // =========================================================================
    static createTofuTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');

        // 透明背景
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 「藤原とうふ店（自家用）」の本格フォント描画
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 54px "MS Gothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('藤原とうふ店', 10, 48);

        ctx.font = 'bold 36px "MS Gothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif';
        ctx.fillText('(自家用)', 345, 48);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createGtrEmblemTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // クローム GT
        ctx.fillStyle = '#e0e0e0';
        ctx.font = 'bold 80px "Arial Black", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('GT', 10, 64);

        // 鮮烈な赤 R
        ctx.fillStyle = '#e60012';
        ctx.font = 'bold 96px "Arial Black", sans-serif';
        ctx.fillText('R', 145, 62);

        // 白のアウトライン
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeText('R', 145, 62);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createTourerVTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ゴールド Tourer V
        ctx.fillStyle = '#dfb12e';
        ctx.font = 'italic bold 46px "Arial Black", sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText('Tourer', 10, 40);

        ctx.fillStyle = '#ff2222';
        ctx.font = 'bold 56px "Arial Black", sans-serif';
        ctx.fillText('V', 185, 38);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createSilviaGrillTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, 256, 64);

        // 水平スリット
        ctx.fillStyle = '#333333';
        for (let y = 8; y < 64; y += 12) {
            ctx.fillRect(0, y, 256, 3);
        }

        // SILVIA シルバーエンブレム
        ctx.fillStyle = '#cccccc';
        ctx.font = 'bold 26px "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SILVIA', 128, 32);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createIntercoolerTexture(stencilText = '') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // アルミチューブフィン下地
        ctx.fillStyle = '#aaaaaa';
        ctx.fillRect(0, 0, 256, 128);

        ctx.fillStyle = '#666666';
        for (let y = 6; y < 128; y += 10) {
            ctx.fillRect(0, y, 256, 3);
        }

        // ステンシルロゴ（NISMO / 1JZ）
        if (stencilText) {
            ctx.fillStyle = '#222222';
            ctx.font = 'bold 44px "Arial Black", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(stencilText, 128, 64);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createAE86TailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // 左：橙（ウインカー）、赤（ブレーキ）、白（バック）
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(0, 0, 45, 64);
        ctx.fillStyle = '#bb0808';
        ctx.fillRect(45, 0, 50, 64);
        ctx.fillStyle = '#dddddd';
        ctx.fillRect(95, 0, 25, 64);

        // 中央ガーニッシュ（ブラック）
        ctx.fillStyle = '#161616';
        ctx.fillRect(120, 0, 16, 64);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';

        // 右：対称
        ctx.fillStyle = '#dddddd';
        ctx.fillRect(136, 0, 25, 64);
        ctx.fillStyle = '#bb0808';
        ctx.fillRect(161, 0, 50, 64);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(211, 0, 45, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createS13TailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');

        // PS13 フルワイド横長レンズ
        ctx.fillStyle = '#990808';
        ctx.fillRect(0, 0, 80, 48);
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(80, 0, 30, 48);
        ctx.fillStyle = '#141414';
        ctx.fillRect(110, 0, 36, 48);
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(146, 0, 30, 48);
        ctx.fillStyle = '#990808';
        ctx.fillRect(176, 0, 80, 48);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createJZXTailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // 上段：レッドブレーキ、下段：アンバー＆クリアリバース
        ctx.fillStyle = '#aa0808';
        ctx.fillRect(0, 0, 256, 34);

        ctx.fillStyle = '#ff7700';
        ctx.fillRect(0, 34, 80, 30);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(80, 34, 45, 30);
        ctx.fillStyle = '#222222';
        ctx.fillRect(125, 34, 6, 30);
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(131, 34, 45, 30);
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(176, 34, 80, 30);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createCE9ATailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // エボIII 水平コンビネーションランプ
        // 左：橙（ウインカー 25%）、赤（ブレーキ 45%）、クリア（バック 20%）、ブラックトリム
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(0, 0, 55, 64);
        ctx.fillStyle = '#b80808';
        ctx.fillRect(55, 0, 60, 64);
        ctx.fillStyle = '#dce2e6';
        ctx.fillRect(90, 16, 25, 32);

        // 中央ガーニッシュ
        ctx.fillStyle = '#181818';
        ctx.fillRect(115, 0, 26, 64);
        ctx.fillStyle = '#990000';
        ctx.fillRect(122, 22, 12, 20);

        // 右：対称
        ctx.fillStyle = '#dce2e6';
        ctx.fillRect(141, 16, 25, 32);
        ctx.fillStyle = '#b80808';
        ctx.fillRect(141, 0, 60, 64);
        ctx.fillStyle = '#dce2e6';
        ctx.fillRect(141, 16, 25, 32);
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(201, 0, 55, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createEK9TailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // EK9 シビック 縦型コンビネーションランプ
        // 上段（32%）：アンバーウインカー
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(0, 0, 128, 80);

        // 中段（24%）：クリアリバース
        ctx.fillStyle = '#dce4e8';
        ctx.fillRect(0, 80, 128, 60);

        // 下段（44%）：鮮烈なレッドテール＆ストップ
        ctx.fillStyle = '#c80808';
        ctx.fillRect(0, 140, 128, 116);

        // 外周ブラックベゼル
        ctx.strokeStyle = '#141416';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 122, 250);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static create180SXTailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // ダークスモークハウジング地色
        ctx.fillStyle = '#141416';
        ctx.fillRect(0, 0, 512, 128);

        // --- 左ユニット (0 〜 185) ---
        // 上部アンバーウインカー
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(10, 8, 165, 24);

        // 後期Type X 丸目2連テール＆ストップ
        const drawRoundTail = (cx, cy, r) => {
            // 外枠ベゼル
            ctx.fillStyle = '#0a0a0c';
            ctx.beginPath();
            ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
            ctx.fill();

            // 赤外輪
            ctx.fillStyle = '#b00808';
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();

            // 明るいインナーサークル
            ctx.fillStyle = '#ee1818';
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.65, 0, Math.PI * 2);
            ctx.fill();

            // センターハイライト
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
            ctx.fill();
        };

        drawRoundTail(52, 74, 26);
        drawRoundTail(132, 74, 26);

        // --- 中央ガーニッシュ (185 〜 327) ---
        ctx.fillStyle = '#18181c';
        ctx.fillRect(185, 4, 142, 120);

        // バックランプ（白）
        ctx.fillStyle = '#e0e6ec';
        ctx.fillRect(195, 78, 38, 28);
        ctx.fillRect(279, 78, 38, 28);

        // 180SX ロゴ
        ctx.fillStyle = '#e8eaed';
        ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('180SX', 256, 44);

        // --- 右ユニット (327 〜 512) ---
        // 上部アンバーウインカー
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(337, 8, 165, 24);

        drawRoundTail(380, 74, 26);
        drawRoundTail(460, 74, 26);

        // 外周ブラックフレーム
        ctx.strokeStyle = '#08080a';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 506, 122);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createMitsubishiEmblemTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#111113';
        ctx.fillRect(0, 0, 128, 128);

        // スリーダイヤ（赤）
        ctx.fillStyle = '#dd1111';
        // 上ダイヤ
        ctx.beginPath();
        ctx.moveTo(64, 18);
        ctx.lineTo(82, 50);
        ctx.lineTo(64, 82);
        ctx.lineTo(46, 50);
        ctx.closePath();
        ctx.fill();

        // 左下ダイヤ
        ctx.beginPath();
        ctx.moveTo(46, 50);
        ctx.lineTo(64, 82);
        ctx.lineTo(46, 114);
        ctx.lineTo(28, 82);
        ctx.closePath();
        ctx.fill();

        // 右下ダイヤ
        ctx.beginPath();
        ctx.moveTo(82, 50);
        ctx.lineTo(100, 82);
        ctx.lineTo(82, 114);
        ctx.lineTo(64, 82);
        ctx.closePath();
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createHondaRedBadgeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // Type R 鮮烈な赤地
        ctx.fillStyle = '#cc0011';
        ctx.fillRect(0, 0, 128, 128);

        // クローム枠
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 8;
        ctx.strokeRect(6, 6, 116, 116);

        // ホワイト/クローム「H」マーク
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 90px "Arial", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', 64, 68);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createLicensePlateTexture(numberStr) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // 白地プレート＆緑文字
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(0, 0, 256, 128);

        ctx.strokeStyle = '#1e6633';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 248, 120);

        // ネジボルト
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(45, 26, 6, 0, Math.PI * 2);
        ctx.arc(211, 26, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e6633';
        ctx.font = 'bold 36px "MS Gothic", "Hiragino Kaku Gothic ProN", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const parts = numberStr.split(' ');
        if (parts.length >= 3) {
            ctx.font = 'bold 30px "MS Gothic", sans-serif';
            ctx.fillText(parts[0] + ' ' + parts[1], 128, 36);
            ctx.font = 'bold 50px "Arial Black", sans-serif';
            ctx.fillText(parts[2] + ' ' + (parts[3] || ''), 128, 86);
        } else {
            ctx.font = 'bold 44px "MS Gothic", sans-serif';
            ctx.fillText(numberStr, 128, 64);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createKeiYellowLicensePlateTexture(numberStr) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // 軽自動車 黄色地プレート＆黒文字（自家用軽・昭和ボンネットバン40ナンバー規格）
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, 0, 256, 128);

        ctx.strokeStyle = '#181818';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 248, 120);

        // ネジボルト
        ctx.fillStyle = '#777777';
        ctx.beginPath();
        ctx.arc(45, 26, 6, 0, Math.PI * 2);
        ctx.arc(211, 26, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#181818';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const parts = numberStr.split(' ');
        if (parts.length >= 3) {
            ctx.font = 'bold 30px "MS Gothic", sans-serif';
            ctx.fillText(parts[0] + ' ' + parts[1], 128, 36);
            ctx.font = 'bold 50px "Arial Black", sans-serif';
            ctx.fillText(parts[2] + ' ' + (parts[3] || ''), 128, 86);
        } else {
            ctx.font = 'bold 44px "MS Gothic", sans-serif';
            ctx.fillText(numberStr, 128, 64);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createAltoWorksHeadlightTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // クロームリフレクターグラデーション
        const grad = ctx.createLinearGradient(0, 0, 256, 128);
        grad.addColorStop(0, '#c8d4e0');
        grad.addColorStop(0.5, '#ffffff');
        grad.addColorStop(1, '#94a0b0');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 128);

        // クリスタルレンズ縦型リブパターン
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        for (let x = 8; x < 248; x += 10) {
            ctx.fillRect(x, 6, 3, 116);
        }
        ctx.fillStyle = 'rgba(80, 95, 115, 0.22)';
        for (let x = 11; x < 248; x += 10) {
            ctx.fillRect(x, 6, 2, 116);
        }

        // センターハロゲンバルブキャップ＆プリズムパターン
        ctx.fillStyle = '#eaf0f8';
        ctx.beginPath();
        ctx.arc(128, 64, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4c525e';
        ctx.beginPath();
        ctx.arc(128, 64, 10, 0, Math.PI * 2);
        ctx.fill();

        // 外周ブラックシールトリム
        ctx.strokeStyle = '#18181c';
        ctx.lineWidth = 5;
        ctx.strokeRect(2, 2, 252, 124);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createAltoWorksFogLampTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // ダークベゼル
        ctx.fillStyle = '#141416';
        ctx.fillRect(0, 0, 128, 128);

        // クロームパラボラリフレクター
        const radGrad = ctx.createRadialGradient(64, 64, 4, 64, 64, 58);
        radGrad.addColorStop(0, '#ffffff');
        radGrad.addColorStop(0.4, '#e0e8f0');
        radGrad.addColorStop(0.75, '#8a94a2');
        radGrad.addColorStop(1, '#2c3038');
        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(64, 64, 58, 0, Math.PI * 2);
        ctx.fill();

        // 同心円フレネルリング
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        for (let r = 16; r <= 48; r += 10) {
            ctx.beginPath();
            ctx.arc(64, 64, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 横型ディフューザーリブ
        ctx.strokeStyle = 'rgba(100, 115, 135, 0.35)';
        ctx.lineWidth = 1.5;
        for (let y = 24; y <= 104; y += 8) {
            ctx.beginPath();
            ctx.moveTo(20, y);
            ctx.lineTo(108, y);
            ctx.stroke();
        }

        // センターバルブキャップ
        ctx.fillStyle = '#444850';
        ctx.beginPath();
        ctx.arc(64, 64, 9, 0, Math.PI * 2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createAltoWorksGrillTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // 一段奥まったブラックインテーク地色
        ctx.fillStyle = '#0e0e12';
        ctx.fillRect(0, 0, 256, 64);

        // ハニカム・クロスハッチメッシュ
        ctx.strokeStyle = '#25252c';
        ctx.lineWidth = 2;
        for (let x = -64; x < 320; x += 12) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 64, 64);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + 64, 0);
            ctx.lineTo(x, 64);
            ctx.stroke();
        }

        // 横スリットルーバー
        ctx.fillStyle = '#1c1c24';
        for (let y = 12; y < 60; y += 14) {
            ctx.fillRect(4, y, 248, 3);
        }

        // 外周ブラックトリム
        ctx.strokeStyle = '#08080a';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, 252, 60);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createAltoWorksTailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // ダークブラックベゼル
        ctx.fillStyle = '#18181c';
        ctx.fillRect(0, 0, 256, 64);

        // --- 左テールユニット (0 〜 96) ---
        // 外側：アンバーウインカー
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(4, 6, 32, 52);
        // 中央：鮮烈な赤ブレーキ/テール
        ctx.fillStyle = '#c80808';
        ctx.fillRect(40, 6, 34, 52);
        // 内側：クリアリバース
        ctx.fillStyle = '#dce2e6';
        ctx.fillRect(78, 6, 18, 52);

        // --- 中央ガーニッシュ (96 〜 160) ---
        ctx.fillStyle = '#101012';
        ctx.fillRect(98, 4, 60, 56);
        ctx.fillStyle = '#c80808';
        ctx.fillRect(102, 10, 52, 10); // 赤リフレクター

        ctx.fillStyle = '#e81e63';
        ctx.font = 'bold 13px "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('WORKS', 128, 32);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('4WD', 128, 48);

        // --- 右テールユニット (160 〜 256) ---
        // 内側：クリアリバース
        ctx.fillStyle = '#dce2e6';
        ctx.fillRect(160, 6, 18, 52);
        // 中央：赤ブレーキ/テール
        ctx.fillStyle = '#c80808';
        ctx.fillRect(182, 6, 34, 52);
        // 外側：アンバーウインカー
        ctx.fillStyle = '#ff7700';
        ctx.fillRect(220, 6, 32, 52);

        // 外枠トリム
        ctx.strokeStyle = '#08080a';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, 252, 60);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    static createAltoWorksSideDecalTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');

        // 背景は透明
        ctx.clearRect(0, 0, 512, 96);

        // 上部ホットピンクピンストライプ
        ctx.fillStyle = '#e81e63';
        ctx.fillRect(10, 12, 492, 4);

        // シルバーレーシングストライプ
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(10, 20, 492, 2);

        // "TWINCAM 12VALVE TURBO"
        ctx.fillStyle = '#f0f0f0';
        ctx.font = 'italic bold 28px "Arial Black", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('TWINCAM 12VALVE TURBO', 20, 48);

        // "FULL TIME 4WD"
        ctx.fillStyle = '#e81e63';
        ctx.font = 'italic bold 22px "Arial Black", sans-serif';
        ctx.fillText('FULL TIME 4WD', 320, 76);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // 10. TOYOTA SUPRA RZ (JZA80) - 実車写真完全準拠モデル（適正車高・本物ヘッドライト・流麗オーガニック）
    // =========================================================================
    static buildJZA80(col) {
        const group = new THREE.Group();

        // -------------------------------------------------------------------------
        // マテリアル定義（実車写真 アルパインシルバーメタリック<199> 完全準拠）
        // -------------------------------------------------------------------------
        const primaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.primary) || 0xb4b8bc,
            roughness: 0.18,
            metalness: 0.38
        });
        const secondaryMat = new THREE.MeshStandardMaterial({
            color: 0x161618,
            roughness: 0.62,
            metalness: 0.08
        });
        const hoodMat = new THREE.MeshStandardMaterial({
            color: (col && col.hood) || 0xb4b8bc,
            roughness: 0.18,
            metalness: 0.38
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x09121a,
            roughness: 0.04,
            metalness: 0.92,
            transparent: true,
            opacity: 0.88
        });
        const windshieldGlassMat = new THREE.MeshStandardMaterial({
            color: 0x0c1824,
            roughness: 0.04,
            metalness: 0.88,
            transparent: true,
            opacity: 0.78
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({
            color: 0x141416,
            roughness: 0.68,
            metalness: 0.06
        });
        const darkMeshMat = new THREE.MeshBasicMaterial({ color: 0x060608 });
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.04,
            metalness: 0.98
        });
        const amberLensMat = new THREE.MeshStandardMaterial({
            color: 0xff7700,
            emissive: 0xcc5500,
            emissiveIntensity: 0.50,
            roughness: 0.12,
            metalness: 0.10
        });
        const tailLightMat = new THREE.MeshStandardMaterial({
            color: 0x770808,
            emissive: 0x770808,
            emissiveIntensity: 0.65,
            roughness: 0.10,
            metalness: 0.10
        });
        const reverseLensMat = new THREE.MeshStandardMaterial({
            color: 0xf2f7ff,
            emissive: 0xaabbcc,
            emissiveIntensity: 0.30,
            roughness: 0.08,
            metalness: 0.20
        });
        const interiorMat = new THREE.MeshStandardMaterial({
            color: 0x1a1b20,
            roughness: 0.80,
            metalness: 0.05
        });
        const seatFabricMat = new THREE.MeshStandardMaterial({
            color: 0x26272e,
            roughness: 0.85,
            metalness: 0.02
        });
        const radiatorCoreMat = new THREE.MeshStandardMaterial({
            color: 0x98a0a8,
            roughness: 0.35,
            metalness: 0.85
        });
        const rimMat = new THREE.MeshStandardMaterial({
            color: (col && col.rim) || 0xdce2ea,
            roughness: 0.16,
            metalness: 0.52
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x1c1c1e,
            roughness: 0.92
        });

        // -------------------------------------------------------------------------
        // 1. シャシーフロア（前後端はバンパー曲面の内側に収める）
        // -------------------------------------------------------------------------
        const mainFloor = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.16, 3.70), primaryMat);
        mainFloor.position.set(0, 0.26, 0);
        mainFloor.castShadow = true;
        group.add(mainFloor);

        const frontTray = new THREE.Mesh(new THREE.BoxGeometry(1.40, 0.10, 0.70), secondaryMat);
        frontTray.position.set(0, 0.19, 1.62);
        group.add(frontTray);

        const rearDiffuserPan = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.10, 0.80), secondaryMat);
        rearDiffuserPan.position.set(0, 0.20, -1.75);
        group.add(rearDiffuserPan);

        // -------------------------------------------------------------------------
        // 2. 【実車写真準拠】曲面フロントフェイシア
        //    実写（正面・斜め）から計測：
        //    ・ヘッドライトは全幅の内側 x=±0.37 〜 外側 x=±0.79、高さ y=0.445〜0.615
        //    ・ヘッドライト面は約38°後傾し、ボンネット前端ラインがライト上端と一致
        //    ・平面視でノーズは丸く、外側ほど後退（ライト外端がフェンダーへ回り込む）
        // -------------------------------------------------------------------------
        const F_X0 = 0.30, F_C = 0.90;
        const bendZ = (x) => -F_C * Math.pow(Math.max(0, Math.abs(x) - F_X0), 2);
        const crownY = (x) => 0.02 * Math.max(0, 1 - Math.pow(x / 0.80, 2));
        // 高さyにおける前面プロファイル（バンパー部はほぼ垂直、ライト部は後傾）
        const frontPoint = (x, y) => {
            let z;
            if (y <= 0.44) z = 2.17 - ((y - 0.20) / 0.24) * 0.05;
            else z = 2.12 - ((y - 0.44) / 0.18) * 0.14;
            const k = Math.min(1, Math.max(0, (y - 0.44) / 0.18));
            return new THREE.Vector3(x, y + crownY(x) * k, z + bendZ(x));
        };
        // 曲面に沿ったパネル生成（offsetで面の法線方向へ浮かせる）
        const makeFrontPanel = (xA, xB, yA, yB, segX, segY, mat, offset = 0) => {
            const geo = new THREE.PlaneGeometry(1, 1, segX, segY);
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const u = pos.getX(i) + 0.5;
                const v = pos.getY(i) + 0.5;
                const x = xA + (xB - xA) * u;
                const y = yA + (yB - yA) * v;
                const p = frontPoint(x, y);
                if (offset !== 0) {
                    const e = 0.002;
                    const tx = frontPoint(x + e, y).sub(frontPoint(x - e, y));
                    const ty = frontPoint(x, y + e).sub(frontPoint(x, y - e));
                    const n = new THREE.Vector3().crossVectors(tx, ty).normalize();
                    if (n.z < 0) n.negate();
                    p.addScaledVector(n, offset);
                }
                pos.setXYZ(i, p.x, p.y, p.z);
            }
            geo.computeVertexNormals();
            const mesh = new THREE.Mesh(geo, mat);
            group.add(mesh);
            return mesh;
        };
        const bodyDS = primaryMat.clone();
        bodyDS.side = THREE.DoubleSide;

        // フロントフェイシア本体（バンパー〜ライト周り〜ノーズを一枚の曲面で）
        const fascia = makeFrontPanel(-0.83, 0.83, 0.20, 0.62, 40, 14, bodyDS);
        fascia.castShadow = true;

        // バンパーサイド閉じ（ホイールアーチ前部へ接続）
        for (let s of [-1, 1]) {
            const bSide = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.14), primaryMat);
            bSide.position.set(s * 0.795, 0.32, 1.79);
            group.add(bSide);
        }

        // トヨタマーク（ライト中心と同じ高さのノーズ上）
        const badgeP = frontPoint(0, 0.525);
        for (let r of [[0.032, 0.005], [0.016, 0.0035]]) {
            const tb = new THREE.Mesh(new THREE.TorusGeometry(r[0], r[1], 8, 20), chromeMat);
            tb.position.set(0, badgeP.y, badgeP.z + 0.006);
            tb.rotation.x = -0.66;
            tb.scale.set(1.25, 1, 1);
            group.add(tb);
        }

        // 中央開口部（ナンバー裏〜下：インタークーラーが覗くワイドグリル）
        const mouthP = frontPoint(0, 0.27);
        const centerMouth = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.11, 0.08), darkMeshMat);
        centerMouth.position.set(0, 0.27, mouthP.z - 0.035);
        group.add(centerMouth);
        const intercoolerCore = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.085, 0.01), radiatorCoreMat);
        intercoolerCore.position.set(0, 0.27, mouthP.z + 0.008);
        group.add(intercoolerCore);
        for (let k = 0; k < 4; k++) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.006, 0.012), blackTrimMat);
            fin.position.set(0, 0.238 + k * 0.022, mouthP.z + 0.012);
            group.add(fin);
        }

        // 左右：アンバーウインカー＋その下のエアダクト（実車写真：中央プロジェクター直下に配置）
        for (let s of [-1, 1]) {
            const x = s * 0.52;
            const yaw = s * Math.atan(2 * F_C * Math.max(0, 0.52 - F_X0));
            const tp = frontPoint(x, 0.340);
            const turnSignal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.040, 0.02), amberLensMat);
            turnSignal.position.set(tp.x, tp.y, tp.z + 0.002);
            turnSignal.rotation.y = yaw;
            group.add(turnSignal);

            const dp = frontPoint(x, 0.260);
            const duct = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.085, 0.06), darkMeshMat);
            duct.position.set(dp.x, dp.y, dp.z - 0.022);
            duct.rotation.y = yaw;
            group.add(duct);
        }

        // チンスポイラー（バンパー下端に沿う）
        const fChinLip = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.035, 0.10), blackTrimMat);
        fChinLip.position.set(0, 0.195, 2.15);
        group.add(fChinLip);
        for (let s of [-1, 1]) {
            const lp = frontPoint(s * 0.76, 0.20);
            const lipC = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.035, 0.08), blackTrimMat);
            lipC.position.set(s * 0.74, 0.195, lp.z + 0.01);
            lipC.rotation.y = s * Math.atan(2 * F_C * Math.max(0, 0.74 - F_X0));
            group.add(lipC);
        }

        // ナンバープレート「三河 33 ほ 87-69」（バンパー面に密着）
        const plateP = frontPoint(0, 0.355);
        this.addLicensePlates(group, '三河 33 ほ 87-69', plateP.z + 0.012, -2.255, 0.42, 0.355);

        // -------------------------------------------------------------------------
        // 3. 【実車写真から再現】JZA80 ヘッドライト
        //    ・外形：実車採寸（アスペクト比 2.26:1、内側高・外側回り込み）
        //    ・中身：内側＝大径マルチリフレクター、中央＝プロジェクター、外側＝小径プロジェクター
        //    ・フェイシア曲面に沿って湾曲・後傾（段差のないツライチマウント）
        // -------------------------------------------------------------------------
        const headlightMats = [];
        const hlTex = this.createSupraHeadlightTexture();
        const hlLensMat = new THREE.MeshStandardMaterial({
            map: hlTex,
            emissiveMap: hlTex,
            emissive: 0xffffff,
            emissiveIntensity: 0.14,
            roughness: 0.15,
            metalness: 0.35,
            transparent: true,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });
        const hlGlassMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.04,
            metalness: 0.75,
            transparent: true,
            opacity: 0.16,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        // 消灯時は不可視・点灯時のみ光る加算合成バルブ
        const bulbGlowMat = new THREE.MeshStandardMaterial({
            color: 0x000000,
            emissive: 0xfff4dc,
            emissiveIntensity: 0,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        headlightMats.push(bulbGlowMat);

        // 実車プロポーション（ノーズ〜フェンダー、ボンネット前端〜バンパー）
        const HL_IN = 0.25, HL_OUT = 0.73, HL_Y0 = 0.395, HL_Y1 = 0.625;
        for (let s of [-1, 1]) {
            // レンズ（u=0が内側になるよう左右で x の向きを反転 → テクスチャは共通）
            makeFrontPanel(s * HL_IN, s * HL_OUT, HL_Y0, HL_Y1, 24, 8, hlLensMat, 0.004);
            makeFrontPanel(s * HL_IN, s * HL_OUT, HL_Y0, HL_Y1, 24, 8, hlGlassMat, 0.010);

            // 各ランプ中心の発光（テクスチャのランプ位置と厳密一致）
            const lamps = [[120, 132, 0.052], [282, 148, 0.040], [422, 154, 0.030]];
            for (let L of lamps) {
                const u = L[0] / 512, v = 1 - L[1] / 256;
                const x = s * (HL_IN + (HL_OUT - HL_IN) * u);
                const y = HL_Y0 + (HL_Y1 - HL_Y0) * v;
                const p = frontPoint(x, y);
                const glow = new THREE.Mesh(new THREE.CircleGeometry(L[2], 20), bulbGlowMat);
                glow.rotation.order = 'YXZ';
                glow.rotation.y = s * Math.atan(2 * F_C * Math.max(0, Math.abs(x) - F_X0));
                glow.rotation.x = -0.66;
                glow.position.set(p.x, p.y, p.z + 0.014);
                group.add(glow);
            }
        }

        // -------------------------------------------------------------------------
        // 4. ボンネット（前端はヘッドライト上端ラインに沿って丸く切り欠く）
        // -------------------------------------------------------------------------
        const hoodGeo = new THREE.PlaneGeometry(1, 1, 20, 10);
        {
            const pos = hoodGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const u = pos.getX(i) + 0.5;
                const v = pos.getY(i) + 0.5; // 0=カウル 1=前端
                const x = -0.74 + 1.48 * u;
                const y = 0.68 + (0.62 - 0.68) * v + crownY(x);
                const z = 0.54 + (1.98 - 0.54) * v + bendZ(x) * v;
                pos.setXYZ(i, x, y, z);
            }
            hoodGeo.computeVertexNormals();
        }
        const hoodMatDS = hoodMat.clone();
        hoodMatDS.side = THREE.DoubleSide;
        const hood = new THREE.Mesh(hoodGeo, hoodMatDS);
        hood.castShadow = true;
        group.add(hood);

        // カウル・ワイパー
        const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.030, 0.16), blackTrimMat);
        cowl.position.set(0, 0.69, 0.54);
        group.add(cowl);

        for (let s of [-1, 1]) {
            const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.010, 0.020), blackTrimMat);
            nozzle.position.set(s * 0.28, 0.70, 0.62);
            group.add(nozzle);

            const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.011, 0.016), blackTrimMat);
            wiper.position.set(s * 0.30, 0.71, 0.55);
            wiper.rotation.z = -s * 0.07;
            group.add(wiper);
        }

        // フロントフェンダー（ボンネット面と同じ傾斜、前端はフェイシア裏に収める）
        const hoodSlope = Math.atan(0.06 / 1.44);
        for (let s of [-1, 1]) {
            const fFenderTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.66), primaryMat);
            fFenderTop.position.set(s * 0.76, 0.675, 1.25);
            fFenderTop.rotation.x = hoodSlope;
            group.add(fFenderTop);

            const fArchFlare = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.68), primaryMat);
            fArchFlare.position.set(s * 0.835, 0.665, 1.25);
            fArchFlare.rotation.x = hoodSlope;
            group.add(fArchFlare);

            const fFenderFront = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.16), primaryMat);
            fFenderFront.position.set(s * 0.76, 0.44, 1.64);
            group.add(fFenderFront);

            const fFenderRear = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.36), primaryMat);
            fFenderRear.position.set(s * 0.76, 0.44, 0.78);
            group.add(fFenderRear);

            // 丸型アンバーサイドマーカー
            const sideRepeater = new THREE.Mesh(
                new THREE.CylinderGeometry(0.016, 0.016, 0.014, 12),
                amberLensMat
            );
            sideRepeater.rotateZ(Math.PI / 2);
            sideRepeater.position.set(s * 0.835, 0.50, 1.62);
            group.add(sideRepeater);
        }

        // -------------------------------------------------------------------------
        // 5. 本格コクピットインテリア（完全開放・車内遮蔽物なし）
        // -------------------------------------------------------------------------
        const interiorTub = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.16, 1.35), interiorMat);
        interiorTub.position.set(0, 0.35, -0.05);
        group.add(interiorTub);

        const dashMain = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 0.34), interiorMat);
        dashMain.position.set(0, 0.66, 0.34);
        dashMain.rotation.x = -0.14;
        group.add(dashMain);

        const meterHood = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.18), interiorMat);
        meterHood.position.set(0.28, 0.74, 0.28);
        group.add(meterHood);

        const meterPanel = new THREE.Mesh(
            new THREE.PlaneGeometry(0.28, 0.065),
            new THREE.MeshBasicMaterial({ color: 0x080808 })
        );
        meterPanel.position.set(0.28, 0.72, 0.34);
        group.add(meterPanel);

        const steeringWheel = new THREE.Mesh(
            new THREE.TorusGeometry(0.090, 0.012, 8, 20),
            blackTrimMat
        );
        steeringWheel.position.set(0.28, 0.69, 0.22);
        steeringWheel.rotation.x = 0.52;
        group.add(steeringWheel);

        const steeringHub = new THREE.Mesh(
            new THREE.CylinderGeometry(0.030, 0.030, 0.02, 12),
            interiorMat
        );
        steeringHub.position.set(0.28, 0.69, 0.22);
        steeringHub.rotation.x = 0.52;
        group.add(steeringHub);

        const centerConsole = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.15, 0.65), interiorMat);
        centerConsole.position.set(0, 0.51, 0.05);
        group.add(centerConsole);

        const shiftKnob = new THREE.Mesh(
            new THREE.SphereGeometry(0.020, 8, 8),
            blackTrimMat
        );
        shiftKnob.position.set(0.06, 0.62, 0.14);
        group.add(shiftKnob);

        for (let s of [-1, 1]) {
            const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.40), seatFabricMat);
            seatBase.position.set(s * 0.30, 0.47, -0.05);
            group.add(seatBase);

            const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.12), seatFabricMat);
            seatBack.position.set(s * 0.30, 0.67, -0.22);
            seatBack.rotation.x = 0.22;
            group.add(seatBack);

            const headRest = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.10), seatFabricMat);
            headRest.position.set(s * 0.30, 0.85, -0.28);
            headRest.rotation.x = 0.22;
            group.add(headRest);
        }

        const rViewMirror = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.028, 0.026), blackTrimMat);
        rViewMirror.position.set(0, 0.89, 0.34);
        group.add(rViewMirror);

        // -------------------------------------------------------------------------
        // 6. エアロキャノピー＆ルーフ（全高 y=1.01m、他車と調和した美しいプロポーション）
        // -------------------------------------------------------------------------
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.030, 0.88), primaryMat);
        roof.position.set(0, 1.01, -0.06);
        group.add(roof);

        for (let s of [-1, 1]) {
            const roofRail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.024, 0.86), primaryMat);
            roofRail.position.set(s * 0.51, 1.00, -0.06);
            roofRail.rotation.z = -s * 0.18;
            group.add(roofRail);
        }

        const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.48), windshieldGlassMat);
        windshield.position.set(0, 0.84, 0.46);
        windshield.rotation.x = -0.62;
        group.add(windshield);

        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.48, 0.040), primaryMat);
            aPillar.position.set(s * 0.54, 0.84, 0.46);
            aPillar.rotation.x = -0.62;
            aPillar.rotation.z = -s * 0.10;
            group.add(aPillar);
        }

        const hatchTexMat = new THREE.MeshStandardMaterial({
            map: this.createSupraHatchGlassTexture(),
            transparent: true,
            roughness: 0.05,
            metalness: 0.85
        });
        const rHatchUpper = new THREE.Mesh(new THREE.PlaneGeometry(1.12, 0.70), hatchTexMat);
        rHatchUpper.position.set(0, 0.85, -0.80);
        rHatchUpper.rotation.x = 1.05;
        group.add(rHatchUpper);

        for (let s of [-1, 1]) {
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.70, 0.050), primaryMat);
            cPillar.position.set(s * 0.55, 0.85, -0.80);
            cPillar.rotation.x = 1.05;
            cPillar.rotation.z = s * 0.10;
            group.add(cPillar);
        }

        const rWiper = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.012, 0.018), blackTrimMat);
        rWiper.position.set(0.06, 0.76, -1.25);
        rWiper.rotation.x = 0.52;
        rWiper.rotation.z = -0.22;
        group.add(rWiper);

        for (let s of [-1, 1]) {
            const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.20, 0.68), glassMat);
            sideGlass.position.set(s * 0.58, 0.81, 0.06);
            sideGlass.rotation.z = -s * 0.08;
            group.add(sideGlass);

            const quarterGlass = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.36), glassMat);
            quarterGlass.position.set(s * 0.57, 0.80, -0.46);
            quarterGlass.rotation.z = -s * 0.08;
            group.add(quarterGlass);

            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.21, 0.038), blackTrimMat);
            bPillar.position.set(s * 0.59, 0.81, -0.28);
            bPillar.rotation.z = -s * 0.08;
            group.add(bPillar);
        }

        // -------------------------------------------------------------------------
        // 7. ドア・コークボトルウエスト＆オーバルサイドブレーキスクープ
        // -------------------------------------------------------------------------
        for (let s of [-1, 1]) {
            const door = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.32, 1.10), primaryMat);
            door.position.set(s * 0.74, 0.47, 0.05);
            group.add(door);

            const shoulderChamfer = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 1.08), primaryMat);
            shoulderChamfer.position.set(s * 0.77, 0.63, 0.05);
            shoulderChamfer.rotation.z = s * 0.785;
            group.add(shoulderChamfer);

            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.022, 0.10), chromeMat);
            handle.position.set(s * 0.79, 0.64, -0.15);
            group.add(handle);

            const sideSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.065, 1.32), secondaryMat);
            sideSkirt.position.set(s * 0.77, 0.21, 0.05);
            group.add(sideSkirt);

            // オーバル型サイドブレーキ冷却スクープ
            const scoopRecess = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.11, 0.14), darkMeshMat);
            scoopRecess.position.set(s * 0.81, 0.37, -0.78);
            group.add(scoopRecess);

            const scoopBezel = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.15), primaryMat);
            scoopBezel.position.set(s * 0.82, 0.37, -0.78);
            group.add(scoopBezel);

            const scoopLip = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.14), primaryMat);
            scoopLip.position.set(s * 0.805, 0.37, -0.68);
            group.add(scoopLip);
        }

        // 左給油口
        const fuelLid = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.09, 0.08), secondaryMat);
        fuelLid.position.set(-0.895, 0.60, -1.25);
        group.add(fuelLid);

        // -------------------------------------------------------------------------
        // 8. ★★★ 本格リアホイールアーチ＆1,810mm グラマラス・リアヒップ ★★★
        // -------------------------------------------------------------------------
        for (let s of [-1, 1]) {
            // (1) リアホイールアーチ上部（天面y=0.70mでタイヤy=0.64mを美しくカバー）
            const rHipTop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.68), primaryMat);
            rHipTop.position.set(s * 0.80, 0.68, -1.25);
            group.add(rHipTop);

            const rFlare = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.70), primaryMat);
            rFlare.position.set(s * 0.88, 0.67, -1.25);
            group.add(rFlare);

            // (2) リアホイールアーチ前部（ドア・サイドスクープ後方）
            const rHipFront = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.36), primaryMat);
            rHipFront.position.set(s * 0.80, 0.44, -0.78);
            group.add(rHipFront);

            // (3) リアホイールアーチ後部（リアバンパー前方）
            const rHipRear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.28, 0.36), primaryMat);
            rHipRear.position.set(s * 0.80, 0.44, -1.72);
            group.add(rHipRear);
        }

        // -------------------------------------------------------------------------
        // 9. リアデッキ・ハッチゲート＆エンブレム
        // -------------------------------------------------------------------------
        const rDeck = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.040, 0.68), primaryMat);
        rDeck.position.set(0, 0.68, -1.65);
        group.add(rDeck);

        const rDucktail = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.045, 0.14), primaryMat);
        rDucktail.position.set(0, 0.705, -2.04);
        group.add(rDucktail);

        const highStop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.022, 0.03), tailLightMat);
        highStop.position.set(0, 0.715, -2.00);
        group.add(highStop);

        const rTBadge1 = new THREE.Mesh(new THREE.TorusGeometry(0.030, 0.005, 8, 20), chromeMat);
        rTBadge1.position.set(0, 0.71, -2.06);
        rTBadge1.rotation.x = -0.32;
        group.add(rTBadge1);

        const rTBadge2 = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.0035, 8, 16), chromeMat);
        rTBadge2.position.set(0, 0.712, -2.062);
        rTBadge2.rotation.x = -0.32;
        group.add(rTBadge2);

        const supraBadgeMat = new THREE.MeshBasicMaterial({
            map: this.createSupraBadgeTexture(),
            transparent: true
        });
        const supraBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.055), supraBadgeMat);
        supraBadge.position.set(0.30, 0.71, -2.06);
        supraBadge.rotation.x = -0.32;
        group.add(supraBadge);

        // -------------------------------------------------------------------------
        // 10. ラウンドリアバンパー＆左出し大径マフラー
        // -------------------------------------------------------------------------
        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.28, 0.28), primaryMat);
        rBumper.position.set(0, 0.39, -2.14);
        group.add(rBumper);

        for (let s of [-1, 1]) {
            const rBumperCorner1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.27, 0.26), primaryMat);
            rBumperCorner1.position.set(s * 0.71, 0.39, -2.06);
            rBumperCorner1.rotation.y = s * 0.25;
            group.add(rBumperCorner1);

            const rBumperCorner2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.28, 0.30), primaryMat);
            rBumperCorner2.position.set(s * 0.81, 0.40, -1.90);
            rBumperCorner2.rotation.y = s * 0.48;
            group.add(rBumperCorner2);
        }

        const rDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.12, 0.26), secondaryMat);
        rDiffuser.position.set(0, 0.22, -2.08);
        group.add(rDiffuser);

        const plateRecess = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.17, 0.04), darkMeshMat);
        plateRecess.position.set(0, 0.42, -2.24);
        group.add(plateRecess);

        // マフラー（左出し）
        const mufflerCan = new THREE.Mesh(
            new THREE.CylinderGeometry(0.10, 0.10, 0.46, 16),
            new THREE.MeshStandardMaterial({ color: 0x77777a, roughness: 0.4, metalness: 0.8 })
        );
        mufflerCan.rotation.z = Math.PI / 2;
        mufflerCan.position.set(-0.22, 0.22, -1.85);
        group.add(mufflerCan);

        const exhaustTip = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.26, 20), chromeMat);
        exhaustTip.rotation.x = Math.PI / 2;
        exhaustTip.position.set(-0.52, 0.22, -2.14);
        group.add(exhaustTip);

        const exhaustRim = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.005, 8, 20), chromeMat);
        exhaustRim.position.set(-0.52, 0.22, -2.24);
        group.add(exhaustRim);

        const exhaustPos = new THREE.Vector3(-0.52, 0.22, -2.25);

        // -------------------------------------------------------------------------
        // 11. 丸目4灯テールランプ
        // -------------------------------------------------------------------------
        const supraTailTex = this.createSupraTailTexture();
        const tailPanelMat = new THREE.MeshStandardMaterial({
            map: supraTailTex,
            roughness: 0.08,
            metalness: 0.15
        });
        const tailPanel = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.15, 0.04), tailPanelMat);
        tailPanel.position.set(0, 0.58, -2.18);
        group.add(tailPanel);

        const lampXCoords = [
            { x: -0.60, type: 'turn', r: 0.038 },
            { x: -0.48, type: 'brake_outer', r: 0.038 },
            { x: -0.36, type: 'brake_inner', r: 0.038 },
            { x: -0.24, type: 'reverse', r: 0.035 },
            { x: 0.24, type: 'reverse', r: 0.035 },
            { x: 0.36, type: 'brake_inner', r: 0.038 },
            { x: 0.48, type: 'brake_outer', r: 0.038 },
            { x: 0.60, type: 'turn', r: 0.038 }
        ];

        lampXCoords.forEach(lp => {
            const bezelRing = new THREE.Mesh(new THREE.TorusGeometry(lp.r, 0.004, 8, 20), blackTrimMat);
            bezelRing.position.set(lp.x, 0.58, -2.202);
            group.add(bezelRing);

            let mat = tailLightMat;
            if (lp.type === 'turn') mat = amberLensMat;
            else if (lp.type === 'reverse') mat = reverseLensMat;

            const lens = new THREE.Mesh(new THREE.CircleGeometry(lp.r * 0.90, 16), mat);
            lens.position.set(lp.x, 0.58, -2.201);
            lens.rotation.y = Math.PI;
            group.add(lens);
        });

        // -------------------------------------------------------------------------
        // 12. ハイアーチ・フープ型リアウイング
        // -------------------------------------------------------------------------
        for (let s of [-1, 1]) {
            const mount = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.18), primaryMat);
            mount.position.set(s * 0.64, 0.72, -1.96);
            group.add(mount);

            const stanchion = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.36, 0.14), primaryMat);
            stanchion.position.set(s * 0.64, 0.90, -1.98);
            stanchion.rotation.x = -0.20;
            stanchion.rotation.y = -s * 0.06;
            stanchion.rotation.z = -s * 0.12;
            group.add(stanchion);

            const elbow = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.07, 0.24), primaryMat);
            elbow.position.set(s * 0.66, 1.10, -2.04);
            elbow.rotation.x = -0.06;
            group.add(elbow);
        }

        const wingWing = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.038, 0.24), primaryMat);
        wingWing.position.set(0, 1.12, -2.06);
        wingWing.rotation.x = -0.06;
        group.add(wingWing);

        // -------------------------------------------------------------------------
        // 13. ドアミラー
        // -------------------------------------------------------------------------
        this.addSideMirrors(group, 0.82, 0.72, 0.46, primaryMat);

        // -------------------------------------------------------------------------
        // 14. ホイール＆ブレーキ（タイヤはみ出し完全解消：適正トレッド＆幅）
        // -------------------------------------------------------------------------
        const wheelPositions = [
            { x: -0.74, y: 0.32, z: 1.25, isFront: true, isLeft: true },
            { x: 0.74, y: 0.32, z: 1.25, isFront: true, isLeft: false },
            { x: -0.76, y: 0.32, z: -1.25, isFront: false, isLeft: true },
            { x: 0.76, y: 0.32, z: -1.25, isFront: false, isLeft: false }
        ];

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            rimMat,
            tireMat,
            'supra_5spoke',
            0.315,
            0.22,
            0x333336
        );

        // -------------------------------------------------------------------------
        // 15. ライティング＆エミッター設定
        // -------------------------------------------------------------------------
        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.58, -2.20);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.56, 0.53, 2.06);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat },
            tailLPos: new THREE.Vector3(-0.50, 0.58, -2.20),
            tailRPos: new THREE.Vector3(0.50, 0.58, -2.20),
            rearWheelLPos: new THREE.Vector3(-0.76, 0.12, -1.25),
            rearWheelRPos: new THREE.Vector3(0.76, 0.12, -1.25),
            popups: [],
            headlightMats: headlightMats,
            headlights: headlights
        };
    }

    // =========================================================================
    // JZA80 スープラ専用ヘッドライトテクスチャ（実車正面写真から外形・ランプ配置を採寸）
    //   u=0 が内側(ノーズ側)、u=1 が外側(フェンダー側)。左右共通で使用。
    // =========================================================================
    static createSupraHeadlightTexture() {
        const W = 512, H = 256;
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);

        // 1. 実車採寸 JZA80 ヘッドライト外形輪郭
        // 内側端（ノーズ側）は上下の角が自然に丸まりノーズ曲面に沿う、上辺は水平〜外側へ向けて優美に降下、
        // 外側端（フェンダー側）は小径プロジェクターを包み込む丸い先端、下辺はほぼ水平
        const outline = () => {
            ctx.beginPath();
            ctx.moveTo(50, 28);
            ctx.bezierCurveTo(28, 65, 28, 190, 50, 226);
            ctx.bezierCurveTo(200, 228, 360, 226, 464, 206);
            ctx.bezierCurveTo(498, 192, 502, 120, 470, 90);
            ctx.bezierCurveTo(380, 38, 220, 26, 50, 28);
            ctx.closePath();
        };

        ctx.save();
        outline();
        ctx.clip();

        // 2. ハウジングベース（実車80スープラ特有のダークアンスラサイト／ガンメタ金属調）
        const baseGrad = ctx.createLinearGradient(0, 0, 0, H);
        baseGrad.addColorStop(0.00, '#1a1d22');
        baseGrad.addColorStop(0.35, '#282d34');
        baseGrad.addColorStop(0.55, '#323842');
        baseGrad.addColorStop(0.85, '#22262d');
        baseGrad.addColorStop(1.00, '#15171b');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, W, H);

        // 3. 上部縦リブフルーティング（80スープラ象徴の上部スリットリフレクター質感）
        for (let x = 160; x < 485; x += 5) {
            ctx.strokeStyle = 'rgba(100, 115, 135, 0.45)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, 24);
            ctx.lineTo(x, 112);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(8, 10, 14, 0.70)';
            ctx.beginPath();
            ctx.moveTo(x + 1, 24);
            ctx.lineTo(x + 1, 112);
            ctx.stroke();
        }

        // リブ下端のクロームシェルフステップ
        const shelfGrad = ctx.createLinearGradient(160, 0, 480, 0);
        shelfGrad.addColorStop(0, 'rgba(180, 190, 205, 0.1)');
        shelfGrad.addColorStop(0.3, 'rgba(210, 225, 240, 0.8)');
        shelfGrad.addColorStop(0.8, 'rgba(140, 150, 165, 0.7)');
        shelfGrad.addColorStop(1, 'rgba(80, 90, 100, 0.2)');
        ctx.fillStyle = shelfGrad;
        ctx.fillRect(170, 110, 310, 3);
        ctx.fillStyle = 'rgba(10, 12, 16, 0.8)';
        ctx.fillRect(170, 113, 310, 2);

        // クロームベゼルリング描画関数
        const drawBezel = (cx, cy, rIn, rOut) => {
            ctx.strokeStyle = 'rgba(10, 12, 15, 0.85)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, rOut + 1, 0, Math.PI * 2);
            ctx.stroke();

            const g = ctx.createLinearGradient(cx - rOut, cy - rOut, cx + rOut, cy + rOut);
            g.addColorStop(0.00, '#ffffff');
            g.addColorStop(0.25, '#c5d0dc');
            g.addColorStop(0.50, '#68727e');
            g.addColorStop(0.75, '#b0bcc8');
            g.addColorStop(1.00, '#ffffff');
            ctx.strokeStyle = g;
            ctx.lineWidth = rOut - rIn;
            ctx.beginPath();
            ctx.arc(cx, cy, (rIn + rOut) / 2, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(12, 15, 20, 0.9)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, rIn - 0.5, 0, Math.PI * 2);
            ctx.stroke();
        };

        // (1) 内側：大径マルチリフレクター（ハイビーム/メイン）
        const cx1 = 120, cy1 = 132, r1 = 82;
        drawBezel(cx1, cy1, r1 - 2, r1 + 7);

        const dishGrad = ctx.createRadialGradient(cx1, cy1, 4, cx1, cy1, r1);
        dishGrad.addColorStop(0.00, '#ffffff');
        dishGrad.addColorStop(0.30, '#f2f6fa');
        dishGrad.addColorStop(0.65, '#9faab6');
        dishGrad.addColorStop(0.90, '#58626e');
        dishGrad.addColorStop(1.00, '#363d46');
        ctx.fillStyle = dishGrad;
        ctx.beginPath();
        ctx.arc(cx1, cy1, r1, 0, Math.PI * 2);
        ctx.fill();

        // 同心円ファセットリング（高い金属光沢コントラスト）
        for (let r = 24; r < r1 - 3; r += 8) {
            ctx.strokeStyle = (r % 16 === 0) ? 'rgba(255, 255, 255, 0.75)' : 'rgba(220, 230, 245, 0.50)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(cx1, cy1, r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(25, 30, 38, 0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx1, cy1, r + 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        // 放射状ファセットリブ
        for (let a = 0; a < 360; a += 15) {
            const rad = (a * Math.PI) / 180;
            const xIn = cx1 + 24 * Math.cos(rad);
            const yIn = cy1 + 24 * Math.sin(rad);
            const xOut = cx1 + (r1 - 3) * Math.cos(rad);
            const yOut = cy1 + (r1 - 3) * Math.sin(rad);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(xIn, yIn);
            ctx.lineTo(xOut, yOut);
            ctx.stroke();

            const radS = ((a + 2.5) * Math.PI) / 180;
            ctx.strokeStyle = 'rgba(20, 25, 32, 0.45)';
            ctx.beginPath();
            ctx.moveTo(cx1 + 24 * Math.cos(radS), cy1 + 24 * Math.sin(radS));
            ctx.lineTo(cx1 + (r1 - 3) * Math.cos(radS), cy1 + (r1 - 3) * Math.sin(radS));
            ctx.stroke();
        }

        // 中央バルブシェード＆ハロゲンバルブグロー
        drawBezel(cx1, cy1, 16, 21);
        const capGrad = ctx.createRadialGradient(cx1 - 4, cy1 - 4, 1, cx1, cy1, 16);
        capGrad.addColorStop(0.0, '#d5dde6');
        capGrad.addColorStop(0.6, '#555d66');
        capGrad.addColorStop(1.0, '#22262a');
        ctx.fillStyle = capGrad;
        ctx.beginPath();
        ctx.arc(cx1, cy1, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff4d0';
        ctx.beginPath();
        ctx.arc(cx1, cy1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx1, cy1, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // (2) 中央：ロービームプロジェクター（深みのある濃青色凸レンズ）
        const cx2 = 282, cy2 = 148, r2 = 54;
        drawBezel(cx2, cy2, r2 - 2, r2 + 8);

        const pGrad2 = ctx.createRadialGradient(cx2 - 14, cy2 - 16, 3, cx2, cy2, r2);
        pGrad2.addColorStop(0.00, '#d6e5f5');
        pGrad2.addColorStop(0.20, '#6b829c');
        pGrad2.addColorStop(0.55, '#223040');
        pGrad2.addColorStop(0.85, '#101720');
        pGrad2.addColorStop(1.00, '#060a0f');
        ctx.fillStyle = pGrad2;
        ctx.beginPath();
        ctx.arc(cx2, cy2, r2, 0, Math.PI * 2);
        ctx.fill();

        const glint2 = ctx.createRadialGradient(cx2 - 15, cy2 - 18, 0, cx2 - 15, cy2 - 18, 10);
        glint2.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        glint2.addColorStop(0.5, 'rgba(220, 238, 255, 0.7)');
        glint2.addColorStop(1, 'rgba(220, 238, 255, 0)');
        ctx.fillStyle = glint2;
        ctx.beginPath();
        ctx.arc(cx2 - 15, cy2 - 18, 10, 0, Math.PI * 2);
        ctx.fill();

        // (3) 外側：小径プロジェクター（補助/フォグ/ターン）
        const cx3 = 422, cy3 = 154, r3 = 40;
        drawBezel(cx3, cy3, r3 - 2, r3 + 7);

        const pGrad3 = ctx.createRadialGradient(cx3 - 10, cy3 - 12, 2, cx3, cy3, r3);
        pGrad3.addColorStop(0.00, '#dce8f6');
        pGrad3.addColorStop(0.22, '#7086a0');
        pGrad3.addColorStop(0.60, '#243242');
        pGrad3.addColorStop(0.88, '#101620');
        pGrad3.addColorStop(1.00, '#070a0e');
        ctx.fillStyle = pGrad3;
        ctx.beginPath();
        ctx.arc(cx3, cy3, r3, 0, Math.PI * 2);
        ctx.fill();

        const glint3 = ctx.createRadialGradient(cx3 - 11, cy3 - 13, 0, cx3 - 11, cy3 - 13, 7);
        glint3.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        glint3.addColorStop(0.5, 'rgba(225, 240, 255, 0.65)');
        glint3.addColorStop(1, 'rgba(225, 240, 255, 0)');
        ctx.fillStyle = glint3;
        ctx.beginPath();
        ctx.arc(cx3 - 11, cy3 - 13, 7, 0, Math.PI * 2);
        ctx.fill();

        // (4) クリアレンズ表面のハイライト光沢
        const glassSheen = ctx.createLinearGradient(0, 25, 0, 95);
        glassSheen.addColorStop(0.0, 'rgba(255, 255, 255, 0.22)');
        glassSheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
        glassSheen.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = glassSheen;
        ctx.fillRect(0, 20, W, 80);

        ctx.restore();

        // 4. 外周ブラックガスケット（繊細な3.5pxの純正ウェザーストリップラバー）
        outline();
        ctx.strokeStyle = '#121418';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        outline();
        ctx.strokeStyle = 'rgba(80, 90, 105, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 8;
        return texture;
    }

    // =========================================================================
    // JZA80 スープラ専用 1024x256 超高精細テールランプテクスチャ
    // =========================================================================
    static createSupraTailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 1024, 256);

        // 丸目ランプ描画ヘルパー
        const drawSupraRoundLamp = (cx, cy, r, type) => {
            // ダーク外枠ベゼルリング（実車写真通り各ランプを縁取るリング）
            ctx.fillStyle = '#1c1e22';
            ctx.beginPath();
            ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
            ctx.fill();

            // 内側シャドウ
            ctx.fillStyle = '#0a0a0c';
            ctx.beginPath();
            ctx.arc(cx, cy, r + 1, 0, Math.PI * 2);
            ctx.fill();

            if (type === 'turn') {
                // アンバーウインカー（オレンジリフレクター）
                const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
                grad.addColorStop(0, '#ffbb33');
                grad.addColorStop(0.6, '#ff6600');
                grad.addColorStop(1.0, '#552200');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();

                // 放射状フレネルリフレクターパターン
                ctx.strokeStyle = '#cc5500';
                ctx.lineWidth = 2.0;
                for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
                    ctx.stroke();
                }
                ctx.fillStyle = '#ffe088';
                ctx.beginPath();
                ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
                ctx.fill();
            } else if (type === 'brake_outer' || type === 'brake_inner') {
                // 赤ブレーキ/テール
                const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
                grad.addColorStop(0, '#ff3333');
                grad.addColorStop(0.5, '#cc0808');
                grad.addColorStop(0.85, '#880000');
                grad.addColorStop(1.0, '#330000');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();

                // 同心円フレネルレンズカット
                ctx.strokeStyle = '#990000';
                ctx.lineWidth = 2.2;
                for (let cr = r * 0.25; cr < r; cr += 8.0) {
                    ctx.beginPath();
                    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
                    ctx.stroke();
                }

                // センターコア
                ctx.fillStyle = '#ff6666';
                ctx.beginPath();
                ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
                ctx.fill();
            } else if (type === 'reverse') {
                // クリアバックランプ（ダイヤモンドクリスタルカット）
                const grad = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.5, '#d0e0ec');
                grad.addColorStop(1.0, '#445566');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fill();

                // クリスタルレンズ格子
                ctx.strokeStyle = '#99bbcc';
                ctx.lineWidth = 1.6;
                for (let d = -r + 6; d < r; d += 10) {
                    ctx.beginPath();
                    ctx.moveTo(cx + d, cy - r * 0.8);
                    ctx.lineTo(cx + d, cy + r * 0.8);
                    ctx.stroke();
                }
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
                ctx.fill();
            }

            // レンズ上部のガラス反射ハイライト
            const hlGrad = ctx.createLinearGradient(cx, cy - r, cx, cy);
            hlGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
            hlGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
            ctx.fillStyle = hlGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 0.9, Math.PI, 0);
            ctx.fill();
        };

        // --- 左側コンビネーションランプハウジング (カプセル型スモークベゼル) ---
        ctx.fillStyle = '#111215';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(32, 36, 440, 184, 92);
        } else {
            ctx.rect(32, 36, 440, 184);
        }
        ctx.fill();
        ctx.strokeStyle = '#282a30';
        ctx.lineWidth = 4.0;
        ctx.stroke();

        // 左側サイドリフレクター（最外側レッドリフレクター）
        ctx.fillStyle = '#990000';
        ctx.fillRect(42, 96, 16, 64);
        ctx.strokeStyle = '#660000';
        ctx.lineWidth = 2.0;
        ctx.strokeRect(42, 96, 16, 64);

        // 【実車写真完全一致：左側丸目4灯】 (外側 -> 内側)
        // 1. 最外灯: アンバーウインカー！ (x = -0.66 -> px 79)
        drawSupraRoundLamp(110, 128, 42, 'turn');
        // 2. 外中灯: 赤ブレーキ/テール (x = -0.54 -> px 158)
        drawSupraRoundLamp(210, 128, 42, 'brake_outer');
        // 3. 内中灯: 赤ブレーキ/テール (x = -0.42 -> px 236)
        drawSupraRoundLamp(310, 128, 42, 'brake_inner');
        // 4. 最内灯: クリアリバース！ (x = -0.30 -> px 315)
        drawSupraRoundLamp(410, 128, 38, 'reverse');

        // --- 右側コンビネーションランプハウジング (対称) ---
        ctx.fillStyle = '#111215';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(552, 36, 440, 184, 92);
        } else {
            ctx.rect(552, 36, 440, 184);
        }
        ctx.fill();
        ctx.strokeStyle = '#282a30';
        ctx.lineWidth = 4.0;
        ctx.stroke();

        // 右側サイドリフレクター（最外側レッドリフレクター）
        ctx.fillStyle = '#990000';
        ctx.fillRect(966, 96, 16, 64);
        ctx.strokeStyle = '#660000';
        ctx.lineWidth = 2.0;
        ctx.strokeRect(966, 96, 16, 64);

        // 【実車写真完全一致：右側丸目4灯】 (内側 -> 外側)
        // 4. 最内灯: クリアリバース！
        drawSupraRoundLamp(614, 128, 38, 'reverse');
        // 3. 内中灯: 赤ブレーキ/テール
        drawSupraRoundLamp(714, 128, 42, 'brake_inner');
        // 2. 外中灯: 赤ブレーキ/テール
        drawSupraRoundLamp(814, 128, 42, 'brake_outer');
        // 1. 最外灯: アンバーウインカー！
        drawSupraRoundLamp(914, 128, 42, 'turn');

        // ガラス全体の水平反射グラデーション
        const glassShine = ctx.createLinearGradient(0, 36, 0, 220);
        glassShine.addColorStop(0, 'rgba(255, 255, 255, 0.20)');
        glassShine.addColorStop(0.3, 'rgba(255, 255, 255, 0.06)');
        glassShine.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
        ctx.fillStyle = glassShine;
        ctx.fillRect(32, 36, 440, 184);
        ctx.fillRect(552, 36, 440, 184);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // JZA80 スープラ専用 超高精細リアハッチガラス（熱線デフロスター＋ブラックセラミック枠）
    // =========================================================================
    static createSupraHatchGlassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // ベース深いスモークガラス
        ctx.fillStyle = 'rgba(9, 18, 26, 0.88)';
        ctx.fillRect(0, 0, 512, 512);

        // 外周ブラックセラミックフリット（実車写真通りの縁取り）
        ctx.fillStyle = '#060a0f';
        ctx.fillRect(0, 0, 512, 32);       // 上端
        ctx.fillRect(0, 476, 512, 36);     // 下端
        ctx.fillRect(0, 0, 36, 512);       // 左端
        ctx.fillRect(476, 0, 36, 512);     // 右端

        // オレンジ/ブロンズ熱線デフロスター（実車写真完全準拠）
        ctx.strokeStyle = 'rgba(220, 130, 50, 0.35)';
        ctx.lineWidth = 1.5;
        for (let y = 60; y < 450; y += 26) {
            ctx.beginPath();
            ctx.moveTo(48, y);
            ctx.lineTo(464, y);
            ctx.stroke();
        }

        // ハイマウントストップランプ窓枠（下端中央）
        ctx.fillStyle = '#000000';
        ctx.fillRect(206, 440, 100, 36);

        // ガラス対角ハイライト
        const shine = ctx.createLinearGradient(0, 0, 512, 512);
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
        shine.addColorStop(0.3, 'rgba(255, 255, 255, 0.04)');
        shine.addColorStop(0.7, 'rgba(0, 0, 0, 0.0)');
        shine.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
        ctx.fillStyle = shine;
        ctx.fillRect(0, 0, 512, 512);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // JZA80 スープラ専用 超高精細クローム「Supra」スクリプトエンブレム
    // =========================================================================
    static createSupraBadgeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 512, 128);

        // Supra スクリプト立体エンブレム（実車写真通りの流麗な筆記体）
        ctx.font = 'italic bold 72px "Brush Script MT", "Segoe Script", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // ドロップシャドウ
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText('Supra', 260, 68);

        // クローム鏡面グラデーション
        const grad = ctx.createLinearGradient(0, 32, 0, 96);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.48, '#e0e6ec');
        grad.addColorStop(0.52, '#707a84');
        grad.addColorStop(0.75, '#b4bcc4');
        grad.addColorStop(1, '#606870');
        ctx.fillStyle = grad;
        ctx.fillText('Supra', 256, 64);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // 11. NISSAN SILVIA spec-R (S15) - 実車カタログ広報写真＆象徴的ヘッドライト完全再現モデル
    // =========================================================================
    static buildS15(col) {
        const group = new THREE.Group();

        // -------------------------------------------------------------------------
        // マテリアル定義（実車カタログ写真 スパークリングシルバーメタリック<WV2> 完全準拠）
        // -------------------------------------------------------------------------
        const primaryMat = new THREE.MeshStandardMaterial({
            color: (col && col.primary) || 0x9ca4ad,
            roughness: 0.18,
            metalness: 0.42
        });
        const secondaryMat = new THREE.MeshStandardMaterial({
            color: 0x141416,
            roughness: 0.65,
            metalness: 0.08
        });
        const hoodMat = new THREE.MeshStandardMaterial({
            color: (col && col.hood) || 0x9ca4ad,
            roughness: 0.18,
            metalness: 0.42
        });
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x09121a,
            roughness: 0.04,
            metalness: 0.92,
            transparent: true,
            opacity: 0.88
        });
        const windshieldGlassMat = new THREE.MeshStandardMaterial({
            color: 0x0c1824,
            roughness: 0.04,
            metalness: 0.86,
            transparent: true,
            opacity: 0.76
        });
        const blackTrimMat = new THREE.MeshStandardMaterial({
            color: 0x141416,
            roughness: 0.68,
            metalness: 0.06
        });
        const darkMeshMat = new THREE.MeshBasicMaterial({ color: 0x08080a });
        const chromeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.04,
            metalness: 0.98
        });
        const clearLensMat = new THREE.MeshStandardMaterial({
            color: 0xf5f8fc,
            roughness: 0.04,
            metalness: 0.20,
            transparent: true,
            opacity: 0.82
        });
        const amberLensMat = new THREE.MeshStandardMaterial({
            color: 0xff7700,
            emissive: 0xcc5500,
            emissiveIntensity: 0.50,
            roughness: 0.12,
            metalness: 0.10
        });
        const tailLightMat = new THREE.MeshStandardMaterial({
            color: 0x770808,
            emissive: 0x770808,
            emissiveIntensity: 0.65,
            roughness: 0.10,
            metalness: 0.10
        });
        const interiorMat = new THREE.MeshStandardMaterial({
            color: 0x1a1b20,
            roughness: 0.80,
            metalness: 0.05
        });
        const seatFabricMat = new THREE.MeshStandardMaterial({
            color: 0x26272e,
            roughness: 0.85,
            metalness: 0.02
        });
        const titaniumTrimMat = new THREE.MeshStandardMaterial({
            color: 0x707882,
            roughness: 0.35,
            metalness: 0.60
        });
        const rimMat = new THREE.MeshStandardMaterial({
            color: (col && col.rim) || 0xdce2ea,
            roughness: 0.16,
            metalness: 0.50
        });
        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x1c1c1e,
            roughness: 0.92
        });

        // -------------------------------------------------------------------------
        // 1. シャシーフロア＆アンダーフロア（引き締まった全長＆軽量FRパッケージ）
        // -------------------------------------------------------------------------
        const mainFloor = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.16, 3.86), primaryMat);
        mainFloor.position.set(0, 0.23, 0);
        mainFloor.castShadow = true;
        group.add(mainFloor);

        const frontTray = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.10, 0.70), secondaryMat);
        frontTray.position.set(0, 0.16, 1.50);
        group.add(frontTray);

        const rearPan = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.10, 0.70), secondaryMat);
        rearPan.position.set(0, 0.18, -1.52);
        group.add(rearPan);

        // -------------------------------------------------------------------------
        // 2. 実車カタログ写真完全再現：曲面ラウンドノーズ＆純正バンパー造形
        // -------------------------------------------------------------------------
        // センターノーズ（左右ライト間の幅を0.66mに最適化、中央の絞り込みを再現）
        const fNoseCenter = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.14, 0.30), primaryMat);
        fNoseCenter.position.set(0, 0.475, 2.00);
        fNoseCenter.rotation.x = 0.08;
        group.add(fNoseCenter);

        // ノーズ先端ピーク（実車写真：中央エンブレム台座の鋭利な突き出し）
        const fNosePeak = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.045, 0.12), primaryMat);
        fNosePeak.position.set(0, 0.495, 2.10);
        fNosePeak.rotation.x = 0.12;
        group.add(fNosePeak);

        // コアサポート／ラジエーターバルクヘッド（ヘッドライト背後の密閉壁）
        const fCoreSupport = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.15, 0.18), secondaryMat);
        fCoreSupport.position.set(0, 0.46, 1.76);
        group.add(fCoreSupport);

        // ヘッドライト下部サポートシェルフ（バンパーフェイスとヘッドライトを繋ぐ受け台）
        for (let s of [-1, 1]) {
            const hlShelf = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, 0.22), primaryMat);
            hlShelf.position.set(s * 0.51, 0.40, 1.98);
            hlShelf.rotation.y = -s * 0.16;
            group.add(hlShelf);
        }

        // シルビア稲妻「S」エンブレム（実車写真：ボンネット先端中央の立体クロームバッジ）
        const sBadgeMat = new THREE.MeshBasicMaterial({
            map: this.createS15SilviaSBadgeTexture(),
            transparent: true
        });
        const sBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.060, 0.060), sBadgeMat);
        sBadge.position.set(0, 0.505, 2.13);
        sBadge.rotation.x = -0.22;
        group.add(sBadge);

        // 下部バンパーフェイス（引き締まった全長4.18mバランス）
        const fBumperFace = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.20, 0.28), primaryMat);
        fBumperFace.position.set(0, 0.27, 1.98);
        group.add(fBumperFace);

        // バンパーコーナー（角ばりを解消するラウンド曲面コーナーキャップ）
        for (let s of [-1, 1]) {
            const fCorner = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.36), primaryMat);
            fCorner.position.set(s * 0.72, 0.35, 1.82);
            fCorner.rotation.y = -s * 0.28;
            group.add(fCorner);
        }

        // 中央エアダム開口部
        const centerAirDam = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.13, 0.10), darkMeshMat);
        centerAirDam.position.set(0, 0.25, 2.05);
        group.add(centerAirDam);

        // ナンバープレート左右の角丸エアインテーク
        for (let s of [-1, 1]) {
            const sideScoop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.10, 0.10), darkMeshMat);
            sideScoop.position.set(s * 0.33, 0.25, 2.06);
            group.add(sideScoop);

            const scoopBar = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.02, 0.05), blackTrimMat);
            scoopBar.position.set(s * 0.33, 0.25, 2.07);
            group.add(scoopBar);
        }

        // バンパー最下部チンスポイラー＆アンダーリップ
        const fChinLip = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.035, 0.32), primaryMat);
        fChinLip.position.set(0, 0.15, 2.00);
        group.add(fChinLip);

        const fUnderLip = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.016, 0.34), blackTrimMat);
        fUnderLip.position.set(0, 0.125, 2.01);
        group.add(fUnderLip);

        for (let s of [-1, 1]) {
            const lipSpat = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.14), blackTrimMat);
            lipSpat.position.set(s * 0.75, 0.14, 1.82);
            group.add(lipSpat);
        }

        // フロント「Silvia」カタログショールームプレート
        const catalogPlateMat = new THREE.MeshBasicMaterial({
            map: this.createS15CatalogPlateTexture()
        });
        const fPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.145), catalogPlateMat);
        fPlate.position.set(0, 0.26, 2.14);
        group.add(fPlate);

        // リア「湘南 503 ほ 16-801」プレート
        const rPlateTex = this.createLicensePlateTexture('湘南 503 ほ 16-801');
        const rPlateMat = new THREE.MeshBasicMaterial({ map: rPlateTex });
        const rPlate = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.155), rPlateMat);
        rPlate.rotation.y = Math.PI;
        rPlate.position.set(0, 0.40, -2.045);
        group.add(rPlate);

        // -------------------------------------------------------------------------
        // 3. 【実車写真完全再現】：★S15特有の「吊り目」マルチプロジェクターヘッドライト
        //    ・完全露出マウント：遮蔽物ゼロで最前面に堂々配置
        //    ・内側先端が針のように鋭くノーズへ絞り込む
        //    ・上端がフェンダーへ跳ね上がるアグレッシブな「吊り目」
        //    ・下端にプロジェクターを抱き込む象徴的な「くびれ・段差」
        //    ・最外端に実車通りのアンバーウインカー、中央にD2S HIDプロジェクター、内側にハイビーム
        // -------------------------------------------------------------------------
        const headlightMats = [];
        for (let s of [-1, 1]) {
            const isLeft = (s < 0);
            const hlTex = this.createS15HeadlightTexture(isLeft);
            const hlMat = new THREE.MeshStandardMaterial({
                map: hlTex,
                emissiveMap: hlTex,
                emissive: 0xffffff,
                emissiveIntensity: 0.40,
                roughness: 0.15,
                metalness: 0.20,
                transparent: true,
                alphaTest: 0.02,
                depthWrite: false,
                side: THREE.DoubleSide
            });

            const hlGroup = new THREE.Group();
            hlGroup.position.set(s * 0.51, 0.485, 2.01);
            hlGroup.rotation.y = -s * 0.18;
            hlGroup.rotation.x = 0.08;
            hlGroup.rotation.z = s * 0.05; // 実車特有の吊り目スラント角！

            // インナーバックハウジング（ランプ台座）
            const hlHousing = new THREE.Mesh(
                new THREE.BoxGeometry(0.30, 0.10, 0.03),
                new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.5, metalness: 0.7 })
            );
            hlHousing.position.set(s * 0.01, 0, 0.01);
            hlGroup.add(hlHousing);

            // 【実車完全同期】：D2S HID プロジェクター周囲の立体クロームベゼルリング
            const projRing = new THREE.Mesh(
                new THREE.TorusGeometry(0.027, 0.004, 8, 20),
                chromeMat
            );
            projRing.position.set(s * 0.048, -0.005, 0.036);
            hlGroup.add(projRing);

            // D2S HID プロジェクター球体ガラスレンズ（青白い鋭い光）
            const bulbMat1 = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xddeeff,
                emissiveIntensity: 2.8,
                roughness: 0.05
            });
            headlightMats.push(bulbMat1);

            const projOrb = new THREE.Mesh(new THREE.SphereGeometry(0.023, 16, 16), bulbMat1);
            projOrb.position.set(s * 0.048, -0.005, 0.040);
            hlGroup.add(projOrb);

            // ハイビーム立体パラボラリフレクターカップ＆高輝度バルブ（内側）
            const refCone = new THREE.Mesh(
                new THREE.ConeGeometry(0.030, 0.022, 16),
                chromeMat
            );
            refCone.rotation.x = -Math.PI / 2;
            refCone.position.set(-s * 0.062, 0.005, 0.022);
            hlGroup.add(refCone);

            const bulbMat2 = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0xfff0aa,
                emissiveIntensity: 2.2,
                roughness: 0.10
            });
            headlightMats.push(bulbMat2);
            const refBulb = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 10), bulbMat2);
            refBulb.position.set(-s * 0.062, 0.005, 0.034);
            hlGroup.add(refBulb);

            // 【実車配置完全一致】：最外角のアンバーウインカー立体レンズ！
            const signalLens = new THREE.Mesh(
                new THREE.CircleGeometry(0.021, 14),
                amberLensMat
            );
            signalLens.position.set(s * 0.120, -0.005, 0.036);
            hlGroup.add(signalLens);

            // S15専用アウターレンズパネル（超高精細プロシージャルテクスチャ）
            const outerLens = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.13), hlMat);
            outerLens.position.set(0, 0, 0.045);
            hlGroup.add(outerLens);

            // 空力クリアガラスアウターカバー（滑らかな曲面反射ハイライト）
            const clearGlassMat = new THREE.MeshStandardMaterial({
                color: 0xf5f8fc,
                roughness: 0.04,
                metalness: 0.30,
                transparent: true,
                opacity: 0.30,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const glassCover = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.13), clearGlassMat);
            glassCover.position.set(0, 0, 0.048);
            hlGroup.add(glassCover);

            group.add(hlGroup);
        }

        // -------------------------------------------------------------------------
        // 4. ロングボンネット＆ツインプレスライン（伸びやかでスポーティな造形）
        // -------------------------------------------------------------------------
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.045, 1.20), hoodMat);
        hood.position.set(0, 0.565, 1.20);
        hood.rotation.x = 0.042;
        group.add(hood);

        for (let s of [-1, 1]) {
            const hoodRidge = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.014, 1.15), hoodMat);
            hoodRidge.position.set(s * 0.44, 0.58, 1.20);
            hoodRidge.rotation.x = 0.042;
            hoodRidge.rotation.y = -s * 0.04;
            group.add(hoodRidge);
        }

        const cowl = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.030, 0.16), blackTrimMat);
        cowl.position.set(0, 0.615, 0.54);
        group.add(cowl);

        for (let s of [-1, 1]) {
            const nozzle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.010, 0.018), blackTrimMat);
            nozzle.position.set(s * 0.25, 0.63, 0.58);
            group.add(nozzle);

            const wiper = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.011, 0.016), blackTrimMat);
            wiper.position.set(s * 0.29, 0.645, 0.55);
            wiper.rotation.z = -s * 0.07;
            group.add(wiper);
        }

        // -------------------------------------------------------------------------
        // 5. フロントフェンダー＆サイドマーカー・バッジ
        // -------------------------------------------------------------------------
        for (let s of [-1, 1]) {
            const fFenderFront = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.32, 0.30), primaryMat);
            fFenderFront.position.set(s * 0.74, 0.44, 1.62);
            group.add(fFenderFront);

            const fFenderRear = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.28), primaryMat);
            fFenderRear.position.set(s * 0.74, 0.46, 0.76);
            group.add(fFenderRear);

            const fFenderTop = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.07, 0.66), primaryMat);
            fFenderTop.position.set(s * 0.74, 0.65, 1.20);
            group.add(fFenderTop);

            const fArchLip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.05, 0.68), primaryMat);
            fArchLip.position.set(s * 0.795, 0.645, 1.20);
            group.add(fArchLip);

            const sideRepeater = new THREE.Mesh(
                new THREE.CylinderGeometry(0.014, 0.014, 0.012, 12),
                amberLensMat
            );
            sideRepeater.rotateZ(Math.PI / 2);
            sideRepeater.position.set(s * 0.805, 0.50, 0.82);
            group.add(sideRepeater);

            const repeaterRim = new THREE.Mesh(
                new THREE.TorusGeometry(0.015, 0.003, 6, 12),
                chromeMat
            );
            repeaterRim.rotateY(Math.PI / 2);
            repeaterRim.position.set(s * 0.808, 0.50, 0.82);
            group.add(repeaterRim);

            const fenderBadge = new THREE.Mesh(
                new THREE.BoxGeometry(0.005, 0.012, 0.042),
                chromeMat
            );
            fenderBadge.position.set(s * 0.806, 0.53, 0.82);
            group.add(fenderBadge);
        }

        // -------------------------------------------------------------------------
        // 6. コクピットインテリア（Aピラーブースト計＆センタータコメーター）
        // -------------------------------------------------------------------------
        const interiorTub = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.16, 1.40), interiorMat);
        interiorTub.position.set(0, 0.34, -0.05);
        group.add(interiorTub);

        const dashMain = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.16, 0.34), interiorMat);
        dashMain.position.set(0, 0.62, 0.34);
        dashMain.rotation.x = -0.12;
        group.add(dashMain);

        for (let vx of [-0.46, -0.10, 0.10, 0.46]) {
            const vent = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 6, 14), titaniumTrimMat);
            vent.position.set(vx, 0.64, 0.32);
            group.add(vent);
        }

        const meterHood = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.18), interiorMat);
        meterHood.position.set(0.28, 0.70, 0.28);
        group.add(meterHood);

        const clusterTexMat = new THREE.MeshBasicMaterial({
            map: this.createS15ClusterTexture(),
            transparent: true
        });
        const meterPanel = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.065), clusterTexMat);
        meterPanel.position.set(0.28, 0.68, 0.34);
        group.add(meterPanel);

        // Aピラー純正ブーストメーター
        const boostPod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.022, 0.024, 0.030, 14),
            interiorMat
        );
        boostPod.rotation.x = Math.PI / 2 + 0.35;
        boostPod.rotation.y = -0.32;
        boostPod.position.set(0.43, 0.74, 0.44);
        group.add(boostPod);

        const boostBezel = new THREE.Mesh(
            new THREE.TorusGeometry(0.022, 0.004, 6, 16),
            titaniumTrimMat
        );
        boostBezel.rotation.x = Math.PI / 2 + 0.35;
        boostBezel.rotation.y = -0.32;
        boostBezel.position.set(0.42, 0.73, 0.425);
        group.add(boostBezel);

        const boostTexMat = new THREE.MeshBasicMaterial({
            map: this.createS15BoostGaugeTexture(),
            transparent: true
        });
        const boostDial = new THREE.Mesh(new THREE.CircleGeometry(0.019, 14), boostTexMat);
        boostDial.rotation.x = 0.35;
        boostDial.rotation.y = -0.32;
        boostDial.position.set(0.418, 0.728, 0.423);
        group.add(boostDial);

        // ステアリングホイール
        const steeringWheel = new THREE.Mesh(new THREE.TorusGeometry(0.090, 0.012, 8, 20), blackTrimMat);
        steeringWheel.position.set(0.28, 0.64, 0.22);
        steeringWheel.rotation.x = 0.52;
        group.add(steeringWheel);

        const steeringHub = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.02, 12), interiorMat);
        steeringHub.position.set(0.28, 0.64, 0.22);
        steeringHub.rotation.x = 0.52;
        group.add(steeringHub);

        // センターコンソール
        const centerConsole = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.14, 0.65), interiorMat);
        centerConsole.position.set(0, 0.48, 0.05);
        group.add(centerConsole);

        const consoleTrim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.46), titaniumTrimMat);
        consoleTrim.position.set(0, 0.56, 0.10);
        group.add(consoleTrim);

        const shiftKnob = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 8), blackTrimMat);
        shiftKnob.position.set(0.05, 0.58, 0.14);
        group.add(shiftKnob);

        // バケットシート
        for (let s of [-1, 1]) {
            const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.40), seatFabricMat);
            seatBase.position.set(s * 0.30, 0.46, -0.05);
            group.add(seatBase);

            const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.34, 0.12), seatFabricMat);
            seatBack.position.set(s * 0.30, 0.64, -0.22);
            seatBack.rotation.x = 0.22;
            group.add(seatBack);

            const headRest = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.10, 0.10), seatFabricMat);
            headRest.position.set(s * 0.30, 0.82, -0.28);
            headRest.rotation.x = 0.22;
            group.add(headRest);
        }

        const rViewMirror = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.028, 0.026), blackTrimMat);
        rViewMirror.position.set(0, 0.88, 0.34);
        group.add(rViewMirror);

        // -------------------------------------------------------------------------
        // 7. 【実車写真完全再現】：低く引き締まった本格クーペグリーンハウス＆ルーフ
        //    ・屋根高を実車S15の全高1,285mmに合わせた低重心・流麗なファストバック（y=0.995m）
        //    ・フロントウィンドウの深い傾斜（-0.67 rad）による鋭いスポーツカーシルエット
        //    ・リアファストバックガラスの美しい寝かせ（+1.08 rad）によるリアデッキ連続性
        //    ・ウエストラインの引き上げとウィンドウの薄さ（チョップドルック）
        //    ・キャビン上部の絞り込み（タンブルホーム曲線）
        // -------------------------------------------------------------------------

        // スポーティな低重心ルーフ（全高1,285mm準拠：y=0.995m、S13比-5mm）
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.030, 0.84), primaryMat);
        roof.position.set(0, 0.995, -0.08);
        group.add(roof);

        // ルーフサイドクラウン（角ばりを解消する曲面ルーフレール）
        for (let s of [-1, 1]) {
            const roofRail = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.024, 0.82), primaryMat);
            roofRail.position.set(s * 0.51, 0.985, -0.08);
            roofRail.rotation.z = -s * 0.15;
            group.add(roofRail);
        }

        // フロントウインドシールド（傾斜角度を-0.67 radへ深め、カウルからルーフへ流麗に接続）
        const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.10, 0.48), windshieldGlassMat);
        windshield.position.set(0, 0.808, 0.47);
        windshield.rotation.x = -0.67;
        group.add(windshield);

        for (let s of [-1, 1]) {
            const aPillar = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.48, 0.040), primaryMat);
            aPillar.position.set(s * 0.55, 0.808, 0.47);
            aPillar.rotation.x = -0.67;
            aPillar.rotation.z = -s * 0.09;
            group.add(aPillar);
        }

        // リアウィンドウ（後方へなだらかに傾斜する流麗なファストバックガラス：ルーフからトランクへ隙間なく連結）
        const hatchTexMat = new THREE.MeshStandardMaterial({
            map: this.createS15HatchGlassTexture(),
            transparent: true,
            roughness: 0.05,
            metalness: 0.85
        });

        const rGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.74), hatchTexMat);
        rGlass.position.set(0, 0.822, -0.81);
        rGlass.rotation.x = 1.077;
        group.add(rGlass);

        // Cピラーファストバックピラー（キャビン内側を完全密閉し、隙間をシャットアウト）
        for (let s of [-1, 1]) {
            const cPillar = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.72, 0.050), primaryMat);
            cPillar.position.set(s * 0.56, 0.822, -0.81);
            cPillar.rotation.x = 1.077;
            cPillar.rotation.z = s * 0.09;
            group.add(cPillar);
        }

        for (let s of [-1, 1]) {
            const sideGlass = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.20, 0.68), glassMat);
            sideGlass.position.set(s * 0.58, 0.77, 0.06);
            sideGlass.rotation.z = -s * 0.08;
            group.add(sideGlass);

            const quarterGlass = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.16, 0.36), glassMat);
            quarterGlass.position.set(s * 0.57, 0.76, -0.46);
            quarterGlass.rotation.z = -s * 0.08;
            group.add(quarterGlass);

            const bPillar = new THREE.Mesh(new THREE.BoxGeometry(0.030, 0.21, 0.038), blackTrimMat);
            bPillar.position.set(s * 0.59, 0.77, -0.28);
            bPillar.rotation.z = -s * 0.08;
            group.add(bPillar);
        }

        // -------------------------------------------------------------------------
        // 8. 【実車写真完全再現】：コークボトルウエスト＆シャープなショルダー面取り
        //    ・ドア中央を内側に3cm絞り込み、前後フェンダーのワイド感を強調
        //    ・ドア上端に45度の面取り（ショルダーライン）を追加し角ばりを解消
        // -------------------------------------------------------------------------
        for (let s of [-1, 1]) {
            // ドアパネル（ウエスト中央部を内側へキュッと絞り込む）
            const door = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.28, 1.08), primaryMat);
            door.position.set(s * 0.715, 0.42, 0.05);
            group.add(door);

            // ★実車名物：光を鋭く反射するショルダーライン面取り（角ばり解消）
            const shoulderChamfer = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.032, 1.05), primaryMat);
            shoulderChamfer.position.set(s * 0.74, 0.56, 0.05);
            shoulderChamfer.rotation.z = s * 0.785; // 45度面取り
            group.add(shoulderChamfer);

            const doorCrease = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.016, 1.05), primaryMat);
            doorCrease.position.set(s * 0.75, 0.54, 0.05);
            group.add(doorCrease);

            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.020, 0.10), chromeMat);
            handle.position.set(s * 0.76, 0.57, -0.12);
            group.add(handle);

            const sideSill = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.055, 1.30), primaryMat);
            sideSill.position.set(s * 0.73, 0.175, 0.05);
            group.add(sideSill);
        }

        // 右リアクォーター給油口フューエルリッド
        const fuelLid = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.08, 0.08), secondaryMat);
        fuelLid.position.set(0.795, 0.54, -1.12);
        group.add(fuelLid);

        // -------------------------------------------------------------------------
        // 9. 【実車写真完全再現】：★トランク隙間・抜け穴ゼロ＆流麗なダックテール
        //    ・リアガラス下端とトランクの隙間を密閉するリアパーセルシェルフ（y=0.645m）
        //    ・トランク後端とテールランプの隙間を密閉するブリッジパネル（y=0.590m）
        //    ・純正カタログ仕様の流麗なクーペデッキ＆一体型ダックテールスポイラー
        // -------------------------------------------------------------------------
        for (let s of [-1, 1]) {
            const rHipFront = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.36), primaryMat);
            rHipFront.position.set(s * 0.75, 0.45, -0.72);
            group.add(rHipFront);

            const rHipRear = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.32, 0.36), primaryMat);
            rHipRear.position.set(s * 0.75, 0.45, -1.68);
            group.add(rHipRear);

            const rHipTop = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.66), primaryMat);
            rHipTop.position.set(s * 0.75, 0.655, -1.20);
            group.add(rHipTop);

            const rFlare = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.05, 0.68), primaryMat);
            rFlare.position.set(s * 0.815, 0.645, -1.20);
            group.add(rFlare);
        }

        // ★抜け穴完全密閉①：リアパーセルシェルフ（リアガラス下端とトランク前部を隙間ゼロで連結）
        const parcelShelf = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.035, 0.30), primaryMat);
        parcelShelf.position.set(0, 0.645, -1.24);
        group.add(parcelShelf);

        // トランクデッキ天面（パーセルシェルフからテールまで隙間なく連続）
        const rDeck = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.040, 0.52), primaryMat);
        rDeck.position.set(0, 0.640, -1.62);
        group.add(rDeck);

        // 純正カタログ仕様：トランク後端の一体型ダックテールスポイラーリップ
        const rDucktail = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.045, 0.12), primaryMat);
        rDucktail.position.set(0, 0.655, -1.90);
        group.add(rDucktail);

        for (let s of [-1, 1]) {
            const rDucktailWrap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.040, 0.08), primaryMat);
            rDucktailWrap.position.set(s * 0.64, 0.645, -1.88);
            rDucktailWrap.rotation.y = -s * 0.25;
            group.add(rDucktailWrap);
        }

        // ★抜け穴完全密閉②：テールランプ上部ブリッジパネル（ダックテール下端とテールランプを隙間ゼロで連結）
        const tailBridge = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.08, 0.04), primaryMat);
        tailBridge.position.set(0, 0.60, -1.96);
        group.add(tailBridge);

        const s15BadgeMat = new THREE.MeshBasicMaterial({
            map: this.createS15BadgeTexture(),
            transparent: true
        });
        const s15Badge = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.055), s15BadgeMat);
        s15Badge.position.set(0.28, 0.63, -1.97);
        s15Badge.rotation.x = -0.28;
        group.add(s15Badge);

        const keyHole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.006, 0.006, 0.01, 8),
            chromeMat
        );
        keyHole.position.set(0.40, 0.62, -1.97);
        keyHole.rotateX(Math.PI / 2);
        group.add(keyHole);

        const shelfHighStop = new THREE.Mesh(
            new THREE.BoxGeometry(0.15, 0.022, 0.030),
            tailLightMat
        );
        shelfHighStop.position.set(0, 0.70, -1.24);
        group.add(shelfHighStop);

        // -------------------------------------------------------------------------
        // 10. リアバンパー＆日産シルビア純正「右出し」大径スポーツマフラー
        // -------------------------------------------------------------------------
        // リアバンパーメイン（長さを引き締め、後端をZ = -1.94mに設定）
        const rBumper = new THREE.Mesh(new THREE.BoxGeometry(1.50, 0.28, 0.26), primaryMat);
        rBumper.position.set(0, 0.33, -1.94);
        group.add(rBumper);

        // リアバンパーコーナー（角ばりを解消する流麗なラウンド曲面）
        for (let s of [-1, 1]) {
            const rBumperCorner = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.30), primaryMat);
            rBumperCorner.position.set(s * 0.70, 0.33, -1.78);
            rBumperCorner.rotation.y = s * 0.26;
            group.add(rBumperCorner);
        }

        const rDiffuser = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.09, 0.24), secondaryMat);
        rDiffuser.position.set(0, 0.17, -1.92);
        group.add(rDiffuser);

        const plateRecess = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.18, 0.04), darkMeshMat);
        plateRecess.position.set(0, 0.39, -2.04);
        group.add(plateRecess);

        for (let s of [-1, 1]) {
            const plateLight = new THREE.Mesh(new THREE.BoxGeometry(0.050, 0.016, 0.022), blackTrimMat);
            plateLight.position.set(s * 0.12, 0.47, -2.03);
            group.add(plateLight);
        }

        const mufflerCan = new THREE.Mesh(
            new THREE.CylinderGeometry(0.095, 0.095, 0.42, 16),
            new THREE.MeshStandardMaterial({ color: 0x77777a, roughness: 0.4, metalness: 0.8 })
        );
        mufflerCan.rotation.z = Math.PI / 2;
        mufflerCan.position.set(0.24, 0.19, -1.70);
        group.add(mufflerCan);

        const exhaustTip = new THREE.Mesh(
            new THREE.CylinderGeometry(0.046, 0.046, 0.24, 20),
            chromeMat
        );
        exhaustTip.rotation.x = Math.PI / 2;
        exhaustTip.position.set(0.48, 0.18, -1.92);
        group.add(exhaustTip);

        const exhaustRim = new THREE.Mesh(
            new THREE.TorusGeometry(0.046, 0.005, 8, 20),
            chromeMat
        );
        exhaustRim.position.set(0.48, 0.18, -2.04);
        group.add(exhaustRim);

        const exhaustHole = new THREE.Mesh(
            new THREE.CircleGeometry(0.041, 16),
            new THREE.MeshBasicMaterial({ color: 0x040404 })
        );
        exhaustHole.position.set(0.48, 0.18, -2.042);
        exhaustHole.rotation.y = Math.PI;
        group.add(exhaustHole);

        const exhaustPos = new THREE.Vector3(0.48, 0.18, -2.06);

        // -------------------------------------------------------------------------
        // 11. S15シャープウェッジテールランプ（1024x256超高精細・隙間密閉マウント）
        // -------------------------------------------------------------------------
        const s15TailTex = this.createS15TailTexture();
        const tailPanelMat = new THREE.MeshStandardMaterial({
            map: s15TailTex,
            roughness: 0.08,
            metalness: 0.15
        });
        const tailPanel = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.16, 0.03), tailPanelMat);
        tailPanel.position.set(0, 0.54, -1.98);
        group.add(tailPanel);

        for (let s of [-1, 1]) {
            const brakeLens = new THREE.Mesh(
                new THREE.BoxGeometry(0.22, 0.065, 0.01),
                tailLightMat
            );
            brakeLens.position.set(s * 0.48, 0.55, -1.996);
            group.add(brakeLens);
        }

        // -------------------------------------------------------------------------
        // 12. エアロドアミラー
        // -------------------------------------------------------------------------
        this.addSideMirrors(group, 0.74, 0.65, 0.44, primaryMat);

        // -------------------------------------------------------------------------
        // 13. 純正16インチ 5本スポークアルミホイール
        // -------------------------------------------------------------------------
        const wheelPositions = [
            { x: -0.730, y: 0.305, z: 1.20, isFront: true, isLeft: true },
            { x: 0.730, y: 0.305, z: 1.20, isFront: true, isLeft: false },
            { x: -0.735, y: 0.305, z: -1.20, isFront: false, isLeft: true },
            { x: 0.735, y: 0.305, z: -1.20, isFront: false, isLeft: false }
        ];

        const { wheels, frontWheelL, frontWheelR } = this.createDetailedWheels(
            group,
            wheelPositions,
            rimMat,
            tireMat,
            's15_5spoke',
            0.305,
            0.21,
            0x242426
        );

        // -------------------------------------------------------------------------
        // 14. ライティング＆エミッター設定
        // -------------------------------------------------------------------------
        const brakeLight = new THREE.PointLight(0xff0022, 0, 9, 2.0);
        brakeLight.position.set(0, 0.55, -2.01);
        group.add(brakeLight);

        const headlights = this.addHeadlights(group, 0.51, 0.49, 2.05);

        return {
            meshGroup: group,
            wheels: wheels,
            frontWheelL: frontWheelL,
            frontWheelR: frontWheelR,
            tailLightMat: tailLightMat,
            brakeLight: brakeLight,
            exhaustLocalPos: exhaustPos,
            materials: { primaryMat, secondaryMat, hoodMat, rimMat },
            tailLPos: new THREE.Vector3(-0.48, 0.55, -2.00),
            tailRPos: new THREE.Vector3(0.48, 0.55, -2.00),
            rearWheelLPos: new THREE.Vector3(-0.75, 0.12, -1.20),
            rearWheelRPos: new THREE.Vector3(0.75, 0.12, -1.20),
            popups: [],
            headlightMats: headlightMats,
            headlights: headlights
        };
    }
    // =========================================================================
    // S15 シルビア専用 ★超高精細「吊り目」マルチプロジェクターヘッドライトテクスチャ
    // =========================================================================
    static createS15HeadlightTexture(isLeft) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 512, 256);

        ctx.save();
        if (!isLeft) {
            // 右側ヘッドライトは左右反転
            ctx.translate(512, 0);
            ctx.scale(-1, 1);
        }

        // =====================================================================
        // S15特有のヘッドライト外形ポリゴン（吊り目・鋭い内端・プロジェクター段差）
        // 1. 内側鋭端: (498, 154) - グリルへ向けて針のように鋭く尖る
        // 2. 上端稜線: (430, 110) -> (320, 56) -> (240, 50) -> (68, 54) - フェンダーへ跳ね上がる「吊り目」
        // 3. 外側コーナー: (20, 105) -> (46, 184) - フェンダーサイドへ回り込む
        // 4. 下端ライン: (172, 206) [プロジェクター下の段差・くびれ] -> (278, 176) -> (498, 154)
        // =====================================================================
        ctx.beginPath();
        ctx.moveTo(498, 154);
        ctx.bezierCurveTo(430, 110, 320, 56, 240, 50);
        ctx.bezierCurveTo(160, 46, 100, 50, 68, 54);
        ctx.bezierCurveTo(32, 58, 18, 76, 20, 105);
        ctx.bezierCurveTo(20, 105, 24, 142, 46, 184);
        ctx.bezierCurveTo(88, 204, 128, 208, 172, 206); // プロジェクター部の落ち込み（段差）
        ctx.bezierCurveTo(218, 202, 248, 180, 278, 176); // 段差のステップアップ
        ctx.bezierCurveTo(360, 170, 442, 162, 498, 154);
        ctx.closePath();

        ctx.save();
        ctx.clip();

        // 1. ハウジングベース（スモークドブラッククローム / オブシディアン）
        const bgGrad = ctx.createLinearGradient(0, 40, 0, 220);
        bgGrad.addColorStop(0, '#1c1e24');
        bgGrad.addColorStop(0.5, '#121418');
        bgGrad.addColorStop(1, '#08090b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 512, 256);

        // 2. 最外側：ウインカー室 (x: 22 to 110) - クリスタル縦リブカット＋内部アンバーバルブ
        const sigGrad = ctx.createRadialGradient(70, 120, 10, 70, 120, 65);
        sigGrad.addColorStop(0, '#b0bcc8');
        sigGrad.addColorStop(0.6, '#606a75');
        sigGrad.addColorStop(1, '#1e2228');
        ctx.fillStyle = sigGrad;
        ctx.beginPath();
        ctx.arc(70, 120, 56, 0, Math.PI * 2);
        ctx.fill();

        // クリスタル縦スリットリブ
        ctx.strokeStyle = 'rgba(210, 225, 240, 0.55)';
        ctx.lineWidth = 2.0;
        for (let x = 32; x < 108; x += 6) {
            ctx.beginPath();
            ctx.moveTo(x, 70);
            ctx.lineTo(x, 170);
            ctx.stroke();
        }

        // リフレクター内部アンバーグロー
        const amberGlow = ctx.createRadialGradient(70, 120, 4, 70, 120, 36);
        amberGlow.addColorStop(0, 'rgba(255, 180, 40, 0.95)');
        amberGlow.addColorStop(0.45, 'rgba(255, 120, 10, 0.65)');
        amberGlow.addColorStop(1, 'rgba(160, 60, 0, 0.0)');
        ctx.fillStyle = amberGlow;
        ctx.beginPath();
        ctx.arc(70, 120, 36, 0, Math.PI * 2);
        ctx.fill();

        // S25 アンバーバルブ本体
        ctx.fillStyle = '#ffaa20';
        ctx.beginPath();
        ctx.arc(70, 120, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff0aa';
        ctx.beginPath();
        ctx.arc(68, 118, 4, 0, Math.PI * 2);
        ctx.fill();

        // ウインカーとプロジェクターを仕切る垂直クロームベゼルリブ
        const ribGrad = ctx.createLinearGradient(112, 48, 117, 202);
        ribGrad.addColorStop(0, '#ffffff');
        ribGrad.addColorStop(0.5, '#788898');
        ribGrad.addColorStop(1, '#18202a');
        ctx.fillStyle = ribGrad;
        ctx.fillRect(112, 48, 5, 154);

        // 3. 【S15の眼光】：D2S HID プロジェクターユニット (cx: 180, cy: 128)
        // 立体クロームベゼルアウターリング
        const shGrad = ctx.createRadialGradient(180, 128, 44, 180, 128, 62);
        shGrad.addColorStop(0, '#445566');
        shGrad.addColorStop(0.45, '#ffffff');
        shGrad.addColorStop(0.8, '#889aaa');
        shGrad.addColorStop(1, '#182028');
        ctx.fillStyle = shGrad;
        ctx.beginPath();
        ctx.arc(180, 128, 58, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#3a4450';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        ctx.fillStyle = '#080a0e';
        ctx.beginPath();
        ctx.arc(180, 128, 44, 0, Math.PI * 2);
        ctx.fill();

        // 球体凸ガラスプロジェクターレンズ（キセノンHIDの鋭い輝き）
        const lensGrad = ctx.createRadialGradient(176, 122, 4, 180, 128, 38);
        lensGrad.addColorStop(0, '#ffffff');
        lensGrad.addColorStop(0.25, '#d8eefc');
        lensGrad.addColorStop(0.65, '#5599cc');
        lensGrad.addColorStop(0.9, '#1a3355');
        lensGrad.addColorStop(1, '#0a1422');
        ctx.fillStyle = lensGrad;
        ctx.beginPath();
        ctx.arc(180, 128, 38, 0, Math.PI * 2);
        ctx.fill();

        // プロジェクターレンズ特有の水平カットオフライン遮光板シャドウ（下半分）
        ctx.fillStyle = 'rgba(6, 12, 20, 0.70)';
        ctx.beginPath();
        ctx.rect(142, 128, 76, 38);
        ctx.arc(180, 128, 38, 0, Math.PI);
        ctx.fill();

        // カットオフライン境界の青紫/シアン分散エッジ
        ctx.strokeStyle = '#38b0ff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(142, 128);
        ctx.lineTo(218, 128);
        ctx.stroke();

        ctx.strokeStyle = '#e0f4ff';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(155, 127);
        ctx.lineTo(205, 127);
        ctx.stroke();

        // レンズ上部のガラス二重ハイライト（曲面反射）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.90)';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(180, 128, 32, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(180, 128, 24, Math.PI * 1.25, Math.PI * 1.75);
        ctx.stroke();

        // 4. ポジションランプ (T10) (cx: 254, cy: 132)
        ctx.fillStyle = '#404c5a';
        ctx.beginPath();
        ctx.arc(254, 132, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#cfdbe8';
        ctx.beginPath();
        ctx.arc(254, 132, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(254, 132, 6, 0, Math.PI * 2);
        ctx.fill();

        // 5. ハイビーム：パラボラクロームマルチリフレクター (cx: 350, cy: 118)
        const refGrad = ctx.createRadialGradient(350, 118, 10, 350, 118, 55);
        refGrad.addColorStop(0, '#ffffff');
        refGrad.addColorStop(0.3, '#d8e2ec');
        refGrad.addColorStop(0.7, '#8899aa');
        refGrad.addColorStop(1, '#2c3540');
        ctx.fillStyle = refGrad;
        ctx.beginPath();
        ctx.arc(350, 118, 54, 0, Math.PI * 2);
        ctx.fill();

        // 放射状リフレクターカットライン
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
            ctx.strokeStyle = 'rgba(100, 120, 140, 0.85)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(350 + Math.cos(a) * 10, 118 + Math.sin(a) * 10);
            ctx.lineTo(350 + Math.cos(a) * 52, 118 + Math.sin(a) * 52);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.50)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(350 + Math.cos(a) * 10 + 1, 118 + Math.sin(a) * 10);
            ctx.lineTo(350 + Math.cos(a) * 52 + 1, 118 + Math.sin(a) * 52);
            ctx.stroke();
        }

        // HB3 ハロゲンバルブ
        ctx.fillStyle = '#cfd8e2';
        ctx.beginPath();
        ctx.arc(350, 118, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fffde8';
        ctx.beginPath();
        ctx.arc(350, 118, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#778899';
        ctx.beginPath();
        ctx.arc(350, 118, 4, 0, Math.PI * 2);
        ctx.fill();

        // 6. 内側鋭角リフレクターフィン (398 to 494px)
        for (let y = 134; y < 168; y += 6) {
            const length = (168 - y) * 2.8;
            ctx.strokeStyle = 'rgba(130, 148, 168, 0.75)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(398, y);
            ctx.lineTo(398 + length, y);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(230, 240, 255, 0.40)';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(398, y + 1);
            ctx.lineTo(398 + length, y + 1);
            ctx.stroke();
        }

        // 7. アウターレンズ全体の空力ガラス反射ハイライト
        const glassShine = ctx.createLinearGradient(0, 40, 500, 220);
        glassShine.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
        glassShine.addColorStop(0.18, 'rgba(255, 255, 255, 0.12)');
        glassShine.addColorStop(0.45, 'rgba(255, 255, 255, 0.02)');
        glassShine.addColorStop(0.7, 'rgba(0, 0, 0, 0.06)');
        glassShine.addColorStop(1, 'rgba(255, 255, 255, 0.16)');
        ctx.fillStyle = glassShine;
        ctx.fillRect(0, 0, 512, 256);

        ctx.restore();

        // 8. 外周ブラックラバーガスケットモール
        ctx.beginPath();
        ctx.moveTo(498, 154);
        ctx.bezierCurveTo(430, 110, 320, 56, 240, 50);
        ctx.bezierCurveTo(160, 46, 100, 50, 68, 54);
        ctx.bezierCurveTo(32, 58, 18, 76, 20, 105);
        ctx.bezierCurveTo(20, 105, 24, 142, 46, 184);
        ctx.bezierCurveTo(88, 204, 128, 208, 172, 206);
        ctx.bezierCurveTo(218, 202, 248, 180, 278, 176);
        ctx.bezierCurveTo(360, 170, 442, 162, 498, 154);
        ctx.closePath();
        ctx.strokeStyle = '#0e1014';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.strokeStyle = '#222830';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return tex;
    }

    // =========================================================================
    // S15 シルビア専用 ★実車カタログ広報写真仕様「Silvia」ショールームプレート
    // =========================================================================
    static createS15CatalogPlateTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const baseGrad = ctx.createLinearGradient(0, 0, 512, 256);
        baseGrad.addColorStop(0, '#f8f9fc');
        baseGrad.addColorStop(0.5, '#eceef2');
        baseGrad.addColorStop(1, '#dfe2e8');
        ctx.fillStyle = baseGrad;
        ctx.fillRect(0, 0, 512, 256);

        ctx.strokeStyle = '#2b333c';
        ctx.lineWidth = 10;
        ctx.strokeRect(8, 8, 496, 240);

        ctx.fillStyle = '#7a8490';
        ctx.beginPath();
        ctx.arc(110, 36, 12, 0, Math.PI * 2);
        ctx.arc(402, 36, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'italic bold 98px "Brush Script MT", "Segoe Script", cursive, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillText('Silvia', 260, 134);

        const grad = ctx.createLinearGradient(0, 80, 0, 180);
        grad.addColorStop(0, '#445566');
        grad.addColorStop(0.48, '#1e2832');
        grad.addColorStop(0.52, '#0e141a');
        grad.addColorStop(1, '#2c3a48');
        ctx.fillStyle = grad;
        ctx.fillText('Silvia', 256, 130);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // S15 シルビア専用 1024x256 超高精細テールランプテクスチャ
    // =========================================================================
    static createS15TailTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 1024, 256);

        const drawS15WedgeLamp = (startX, endX, isLeft) => {
            const width = Math.abs(endX - startX);

            ctx.fillStyle = '#141416';
            ctx.beginPath();
            if (isLeft) {
                ctx.moveTo(startX, 60);
                ctx.lineTo(endX, 36);
                ctx.lineTo(endX, 220);
                ctx.lineTo(startX, 196);
            } else {
                ctx.moveTo(startX, 36);
                ctx.lineTo(endX, 60);
                ctx.lineTo(endX, 196);
                ctx.lineTo(startX, 220);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#282a30';
            ctx.lineWidth = 4;
            ctx.stroke();

            const topH = 88;
            if (isLeft) {
                const revGrad = ctx.createLinearGradient(startX + 16, 64, startX + 110, 64);
                revGrad.addColorStop(0, '#ffffff');
                revGrad.addColorStop(0.6, '#d8e4ec');
                revGrad.addColorStop(1, '#8898a8');
                ctx.fillStyle = revGrad;
                ctx.fillRect(startX + 20, 68, 90, topH);

                ctx.strokeStyle = '#667788';
                ctx.lineWidth = 1.6;
                for (let x = startX + 28; x < startX + 105; x += 10) {
                    ctx.beginPath();
                    ctx.moveTo(x, 70);
                    ctx.lineTo(x, 70 + topH - 4);
                    ctx.stroke();
                }

                const redGrad = ctx.createLinearGradient(startX + 115, 60, endX - 20, 40);
                redGrad.addColorStop(0, '#cc0808');
                redGrad.addColorStop(0.5, '#ee1818');
                redGrad.addColorStop(1, '#770000');
                ctx.fillStyle = redGrad;
                ctx.fillRect(startX + 115, 60, width - 135, topH);

                ctx.strokeStyle = '#880000';
                ctx.lineWidth = 2.0;
                for (let y = 68; y < 60 + topH; y += 12) {
                    ctx.beginPath();
                    ctx.moveTo(startX + 115, y);
                    ctx.lineTo(endX - 20, y);
                    ctx.stroke();
                }
            } else {
                const redGrad = ctx.createLinearGradient(startX + 20, 40, endX - 115, 60);
                redGrad.addColorStop(0, '#770000');
                redGrad.addColorStop(0.5, '#ee1818');
                redGrad.addColorStop(1, '#cc0808');
                ctx.fillStyle = redGrad;
                ctx.fillRect(startX + 20, 60, width - 135, topH);

                ctx.strokeStyle = '#880000';
                ctx.lineWidth = 2.0;
                for (let y = 68; y < 60 + topH; y += 12) {
                    ctx.beginPath();
                    ctx.moveTo(startX + 20, y);
                    ctx.lineTo(endX - 115, y);
                    ctx.stroke();
                }

                const revGrad = ctx.createLinearGradient(endX - 110, 64, endX - 16, 64);
                revGrad.addColorStop(0, '#8898a8');
                revGrad.addColorStop(0.4, '#d8e4ec');
                revGrad.addColorStop(1, '#ffffff');
                ctx.fillStyle = revGrad;
                ctx.fillRect(endX - 110, 68, 90, topH);

                ctx.strokeStyle = '#667788';
                ctx.lineWidth = 1.6;
                for (let x = endX - 105; x < endX - 22; x += 10) {
                    ctx.beginPath();
                    ctx.moveTo(x, 70);
                    ctx.lineTo(x, 70 + topH - 4);
                    ctx.stroke();
                }
            }

            const btmY = 160;
            const btmH = 46;
            const amberGrad = ctx.createLinearGradient(startX + 20, btmY, endX - 20, btmY);
            amberGrad.addColorStop(0, '#ff9900');
            amberGrad.addColorStop(0.5, '#ff7700');
            amberGrad.addColorStop(1, '#cc5500');
            ctx.fillStyle = amberGrad;
            ctx.fillRect(startX + 20, btmY, width - 40, btmH);

            ctx.strokeStyle = '#bb4400';
            ctx.lineWidth = 2.0;
            for (let x = startX + 26; x < endX - 24; x += 12) {
                ctx.beginPath();
                ctx.moveTo(x, btmY + 4);
                ctx.lineTo(x, btmY + btmH - 4);
                ctx.stroke();
            }

            const glassShine = ctx.createLinearGradient(startX, 40, startX, 210);
            glassShine.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
            glassShine.addColorStop(0.28, 'rgba(255, 255, 255, 0.06)');
            glassShine.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
            ctx.fillStyle = glassShine;
            ctx.fillRect(startX + 16, 50, width - 32, 155);
        };

        drawS15WedgeLamp(36, 460, true);
        drawS15WedgeLamp(564, 988, false);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // S15 シルビア専用 超高精細リアウィンドウ（熱線デフロスター＋ブラックセラミック枠）
    // =========================================================================
    static createS15HatchGlassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(9, 18, 26, 0.88)';
        ctx.fillRect(0, 0, 512, 512);

        ctx.fillStyle = '#060a0f';
        ctx.fillRect(0, 0, 512, 36);
        ctx.fillRect(0, 474, 512, 38);
        ctx.fillRect(0, 0, 36, 512);
        ctx.fillRect(476, 0, 36, 512);

        ctx.strokeStyle = 'rgba(220, 130, 50, 0.35)';
        ctx.lineWidth = 1.5;
        for (let y = 64; y < 450; y += 28) {
            ctx.beginPath();
            ctx.moveTo(48, y);
            ctx.lineTo(464, y);
            ctx.stroke();
        }

        const shine = ctx.createLinearGradient(0, 0, 512, 512);
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
        shine.addColorStop(0.3, 'rgba(255, 255, 255, 0.04)');
        shine.addColorStop(0.7, 'rgba(0, 0, 0, 0.0)');
        shine.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
        ctx.fillStyle = shine;
        ctx.fillRect(0, 0, 512, 512);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // S15 シルビア専用 ★名物Aピラー純正ブーストメーターダイヤル
    // =========================================================================
    static createS15BoostGaugeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 256, 256);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(128, 128, 120, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#222226';
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.strokeStyle = '#55555c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(128, 128, 108, 0, Math.PI * 2);
        ctx.stroke();

        const startAng = Math.PI * 0.75;
        const endAng = Math.PI * 2.25;
        const ticks = 11;

        for (let i = 0; i <= ticks; i++) {
            const a = startAng + (i / ticks) * (endAng - startAng);
            const isMajor = i % 2 === 0;
            const len = isMajor ? 18 : 10;
            const r1 = 104;
            const r2 = r1 - len;

            ctx.strokeStyle = (i >= 8) ? '#dd2222' : '#111111';
            ctx.lineWidth = isMajor ? 3.5 : 2.0;
            ctx.beginPath();
            ctx.moveTo(128 + Math.cos(a) * r1, 128 + Math.sin(a) * r1);
            ctx.lineTo(128 + Math.cos(a) * r2, 128 + Math.sin(a) * r2);
            ctx.stroke();
        }

        ctx.fillStyle = '#222224';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('x100 kPa', 128, 76);

        ctx.fillStyle = '#e51e1e';
        ctx.font = 'italic bold 16px "Arial Black", sans-serif';
        ctx.fillText('TURBO', 128, 172);

        const zeroAngle = startAng + (4 / ticks) * (endAng - startAng);
        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(128 - Math.cos(zeroAngle) * 16, 128 - Math.sin(zeroAngle) * 16);
        ctx.lineTo(128 + Math.cos(zeroAngle) * 92, 128 + Math.sin(zeroAngle) * 92);
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.beginPath();
        ctx.arc(128, 128, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(128, 128, 5, 0, Math.PI * 2);
        ctx.fill();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // S15 シルビア専用 ★実車名物センタータコメーター仕様ホワイトメーターパネル
    // =========================================================================
    static createS15ClusterTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 512, 128);

        ctx.fillStyle = '#111215';
        ctx.fillRect(0, 0, 512, 128);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(120, 64, 52, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#222226';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('km/h', 120, 84);

        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(120, 64);
        ctx.lineTo(120 - 38, 64 + 18);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(256, 60, 56, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#222226';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.strokeStyle = '#ee1818';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(256, 60, 48, Math.PI * 1.6, Math.PI * 2.15);
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 14px "Arial Black", sans-serif';
        ctx.fillText('x1000r/min', 256, 78);

        ctx.strokeStyle = '#ff3300';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(256, 60);
        ctx.lineTo(256 - 44, 60 + 20);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(392, 64, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#222226';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('FUEL / TEMP', 392, 44);

        [120, 256, 392].forEach(x => {
            ctx.fillStyle = '#111111';
            ctx.beginPath();
            ctx.arc(x, (x === 256 ? 60 : 64), 7, 0, Math.PI * 2);
            ctx.fill();
        });

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // S15 シルビア専用 超高精細「SILVIA」＆「spec-R」リアバッジ
    // =========================================================================
    static createS15BadgeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 512, 128);

        ctx.font = 'bold 44px "Arial Black", Impact, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText('SILVIA', 28, 48);

        const grad = ctx.createLinearGradient(0, 24, 0, 68);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#e0e6ec');
        grad.addColorStop(0.55, '#707a84');
        grad.addColorStop(1, '#b0b8c0');
        ctx.fillStyle = grad;
        ctx.fillText('SILVIA', 24, 46);

        ctx.font = 'italic bold 32px "Arial Black", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('spec-', 240, 50);

        ctx.fillStyle = '#e51e1e';
        ctx.fillText('R', 345, 50);

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    // =========================================================================
    // S15 シルビア専用 稲妻「S」フロントエンブレム（立体クローム）
    // =========================================================================
    static createS15SilviaSBadgeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 256, 256);

        const bgGrad = ctx.createLinearGradient(0, 16, 0, 244);
        bgGrad.addColorStop(0, '#10223a');
        bgGrad.addColorStop(0.5, '#0a1626');
        bgGrad.addColorStop(1, '#040810');
        ctx.fillStyle = bgGrad;
        ctx.beginPath();
        ctx.moveTo(128, 16);
        ctx.lineTo(224, 60);
        ctx.lineTo(196, 210);
        ctx.lineTo(128, 244);
        ctx.lineTo(60, 210);
        ctx.lineTo(32, 60);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#c4ccd4';
        ctx.lineWidth = 8;
        ctx.stroke();

        const sGrad = ctx.createLinearGradient(0, 50, 0, 205);
        sGrad.addColorStop(0, '#ffffff');
        sGrad.addColorStop(0.48, '#e0e8f0');
        sGrad.addColorStop(0.52, '#788490');
        sGrad.addColorStop(1, '#b0b8c0');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.moveTo(180, 52);
        ctx.lineTo(84, 52);
        ctx.lineTo(68, 116);
        ctx.lineTo(164, 116);
        ctx.lineTo(152, 156);
        ctx.lineTo(76, 156);
        ctx.lineTo(64, 204);
        ctx.lineTo(188, 204);
        ctx.lineTo(204, 140);
        ctx.lineTo(108, 140);
        ctx.lineTo(120, 96);
        ctx.lineTo(192, 96);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#334455';
        ctx.lineWidth = 3;
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }
}

window.CarModelBuilder = CarModelBuilder;
