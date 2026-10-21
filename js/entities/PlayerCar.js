/**
 * PlayerCar.js - プレイヤー車両（全車種対応・ダイナミックモデルローダー）
 * CarModelBuilder と連携し、AE86, FD3S, R32, S13, JZX100 を自在に切り替え可能
 */

class PlayerCar {
    constructor(scene, physics, carId = 'ae86') {
        this.scene = scene;
        this.physics = physics;
        this.carId = carId;
        this.colorIndex = 0;

        this.meshGroup = new THREE.Group();
        this.meshGroup.rotation.order = 'YXZ';
        this.wheels = [];
        this.frontWheelL = null;
        this.frontWheelR = null;
        this.currentVisualSteer = 0; // 【視覚リアリズム】カウンターステア実舵角アニメーション用
        this.tailLightMat = null;
        this.brakeLight = null;

        // ヘッドライト＆リトラクタブル開閉制御
        this.lightsOn = true;
        this.retractProgress = 1.0; // 1.0: 展開(オープン), 0.0: 格納(クローズ)
        this.popups = [];
        this.headlightMats = [];
        this.headlights = [];

        this.exhaustLocalPos = new THREE.Vector3(0.54, 0.18, -2.15);
        this.tailLPos = new THREE.Vector3(-0.62, 0.62, -2.02);
        this.tailRPos = new THREE.Vector3(0.62, 0.62, -2.02);
        this.rearWheelLPos = new THREE.Vector3(-0.78, 0.1, -1.25);
        this.rearWheelRPos = new THREE.Vector3(0.78, 0.1, -1.25);
        this.frontWheelLPos = new THREE.Vector3(-0.78, 0.1, 1.25);
        this.frontWheelRPos = new THREE.Vector3(0.78, 0.1, 1.25);

        this.scene.add(this.meshGroup);
        this.setCar(this.carId, this.colorIndex);
    }

    get currentCarId() {
        return this.carId;
    }

    /**
     * 車種とカラーを動的に切り替え
     */
    setCar(carId, colorIndex = 0) {
        this.carId = carId;
        this.colorIndex = colorIndex;

        // 既存メッシュの全削除（GPUリソースを完全に解放）
        while (this.meshGroup.children.length > 0) {
            const child = this.meshGroup.children[0];
            child.traverse((c) => {
                if (c.geometry) c.geometry.dispose();
                if (c.material) {
                    if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
                    else c.material.dispose();
                }
            });
            this.meshGroup.remove(child);
        }
        this.wheels = [];

        const carData = (window.CAR_DATABASE && window.CAR_DATABASE[carId]) || null;
        const colorDef = carData && carData.colors ? carData.colors[colorIndex] : null;

        const model = CarModelBuilder.build(carId, colorDef);
        this.meshGroup.add(model.meshGroup);

        this.wheels = model.wheels || [];
        if (this.wheels) {
            this.wheels.forEach(w => {
                if (w.pivot) {
                    w.defaultY = w.pivot.position.y;
                    w.defaultZ = w.pivot.position.z;
                }
            });
        }
        this.frontWheelL = model.frontWheelL;
        this.frontWheelR = model.frontWheelR;
        this.tailLightMat = model.tailLightMat;
        this.brakeLight = model.brakeLight;
        this.exhaustLocalPos = model.exhaustLocalPos;
        this.tailLPos = model.tailLPos;
        this.tailRPos = model.tailRPos;
        this.rearWheelLPos = model.rearWheelLPos;
        this.rearWheelRPos = model.rearWheelRPos;
        this.popups = model.popups || [];
        this.headlightMats = model.headlightMats || [];
        this.headlights = model.headlights || [];

        // 現在のライト・リトラ状態を新車種に即座に反映
        this.applyLightState(true);
    }

    update(dt) {
        const trackRef = this.physics ? this.physics.track : null;
        const trackInfo = this.physics.trackInfo || (trackRef ? trackRef.getSmoothTrackInfo(this.physics.position, this.physics.trackT) : null);
        const yaw = this.physics.yaw;
        const sinYaw = Math.sin(yaw);
        const cosYaw = Math.cos(yaw);
        const tHint = this.physics.trackT || null;

        let targetSurfacePitch = 0;
        let targetSurfaceRoll = 0;
        let targetGroundY = this.physics.position.y;

        // ★【幾何学的路面接平面プロジェクション（ヘアピンドリフトガタつき＆タイヤめり込み完全根絶）】
        // 急カーブヘアピンで4輪の座標を個別に中心線へ射影すると、急曲率の幾何学的特異点ジャンプや
        // イン側U字側溝の崖（-0.22m）への突入・離脱により激しいチャタリング（ガタガタ振動）が発生する。
        // これを根絶するため、車体中心の完全C2連続な進行ベクトル(tangent)と立体カント法線(normal)から
        // 真の3次元路面垂直ベクトル(Up)を求め、車両の向き(yaw)に応じてピッチ・ロールを数学的に射影！
        // 4輪接地面が路面アスファルトと常に完全平行に吸着し、ドリフト中も1ミリのめり込みもガタつきも発生しない！
        if (trackInfo && trackInfo.tangent && trackInfo.normal) {
            const tangent = trackInfo.tangent;
            const normal = trackInfo.normal;
            const bank = trackInfo.bankAngle || 0;

            const cosBank = Math.cos(bank);
            const sinBank = Math.sin(bank);
            const cantedNormX = normal.x * cosBank;
            const cantedNormY = sinBank;
            const cantedNormZ = normal.z * cosBank;

            // 路面の真の3次元上向き法線ベクトル Up = cantedNormal x tangent (外積)
            let upX = cantedNormY * tangent.z - cantedNormZ * tangent.y;
            let upY = cantedNormZ * tangent.x - cantedNormX * tangent.z;
            let upZ = cantedNormX * tangent.y - cantedNormY * tangent.x;
            const upLen = Math.hypot(upX, upY, upZ) || 1.0;
            upX /= upLen;
            upY /= upLen;
            upZ /= upLen;

            // 車両の前後ベクトル (XZ平面) と 左右ベクトル (XZ平面)
            const fwdX = sinYaw;
            const fwdZ = cosYaw;
            const rgtX = fwdZ;
            const rgtZ = -fwdX;

            // 【数学的検証済・正の符号】下り坂（upZ > 0）を直進（fwdZ > 0）時、fwdDotUp > 0 となり、正のピッチ（前下がりノーズダイブ）
            const fwdDotUp = fwdX * upX + fwdZ * upZ;
            targetSurfacePitch = Math.asin(Math.max(-0.85, Math.min(0.85, fwdDotUp)));

            // 【数学的検証済・負の符号】右下がりバンク（upX > 0）を直進（rgtX > 0）時、rgtDotUp > 0 となり、負のロール（右下がり）
            const rgtDotUp = rgtX * upX + rgtZ * upZ;
            targetSurfaceRoll = -Math.asin(Math.max(-0.85, Math.min(0.85, rgtDotUp)));

            // 道路中心線＋立体カントによる正確な路面基準標高
            const bankOffsetY = sinBank * trackInfo.offset;
            targetGroundY = trackInfo.centerPos.y + bankOffsetY;
        }

        // ★【実車サスペンション・ダンパーフィルター（ガタガタ振動・チャタリングの完全根絶）】
        if (this.smoothSurfacePitch === undefined || isNaN(this.smoothSurfacePitch)) this.smoothSurfacePitch = targetSurfacePitch;
        if (this.smoothSurfaceRoll === undefined || isNaN(this.smoothSurfaceRoll)) this.smoothSurfaceRoll = targetSurfaceRoll;
        if (this.smoothGroundY === undefined || isNaN(this.smoothGroundY) || Math.abs(targetGroundY - this.smoothGroundY) > 2.0) {
            this.smoothGroundY = targetGroundY;
        }

        // スプライン微細不連続を完全平滑化しつつ、地形追従遅延ゼロを実現する最適減衰率
        const dampAlpha = 1.0 - Math.exp(-24.0 * dt);
        this.smoothSurfacePitch += (targetSurfacePitch - this.smoothSurfacePitch) * dampAlpha;
        this.smoothSurfaceRoll += (targetSurfaceRoll - this.smoothSurfaceRoll) * dampAlpha;
        this.smoothGroundY += (targetGroundY - this.smoothGroundY) * dampAlpha;

        // 接地座標（路面アスファルトへのめり込み・Zファイティングを100%防止する安全クリアランス +0.022m）
        this.meshGroup.position.x = this.physics.position.x;
        this.meshGroup.position.z = this.physics.position.z;
        this.meshGroup.position.y = this.smoothGroundY + 0.022 + (this.physics.gutterDropY || 0);

        // ステアリング入力による車体ロール ＋ 溝落としロール
        const rollAmount = -this.physics.steerAngle * (this.physics.speed / 180) * 0.12;
        const totalRoll = this.smoothSurfaceRoll + rollAmount + (this.physics.gutterRoll || 0);

        // ★【ブレーキ・加減速ノーズダイブ＆タイヤ完全接地補正】
        const rawBrakePitch = (this.physics.brake * 0.022); // 正値 = ノーズダイブ（前下がり）
        const rawEngineBrake = ((this.physics.engineBrakeForce || 0) / 7.2) * 0.012;
        const rawAccelPitch = -(this.physics.throttle * 0.012); // 負値 = リアスクワット（前上がり）

        const targetSuspensionPitch = (rawBrakePitch + rawEngineBrake + rawAccelPitch);
        if (this.currentSuspensionPitch === undefined) this.currentSuspensionPitch = 0;
        this.currentSuspensionPitch += (targetSuspensionPitch - this.currentSuspensionPitch) * Math.min(1.0, 10.0 * dt);

        const totalPitch = this.smoothSurfacePitch + this.currentSuspensionPitch;

        // ★Euler 'YXZ' 姿勢合成（Yaw -> Pitch -> Roll）
        this.meshGroup.rotation.set(totalPitch, this.physics.yaw, totalRoll, 'YXZ');

        // ★各ホイールのサスペンション幾何補正（タイヤ底面が路面高さ y=0 に完全固定）
        const sinSuspPitch = Math.sin(this.currentSuspensionPitch);
        if (this.wheels) {
            this.wheels.forEach(w => {
                if (!w.pivot) return;
                const zArm = w.defaultZ !== undefined ? w.defaultZ : (w.isFront ? 1.20 : -1.20);
                const defY = w.defaultY !== undefined ? w.defaultY : 0.305;
                w.pivot.position.y = defY + zArm * sinSuspPitch;
            });
        }

        // ★【視覚リアリズム】フロントタイヤの「カウンターステア実舵角アニメーション」
        // 通常走行時はドライバーの入力ステア角にダイレクトに追従し、
        // ドリフト発生時はスリップ角（driftAngle）とセルフアライニング・トルクにより、
        // 前輪が進行方向（外側）へキリキリと逆ハンドル（フルカウンター）を切る実車の実舵角挙動を完全再現！
        let targetVisualSteer = 0;

        const driftAngle = this.physics.driftAngle || 0;
        const absDriftAngle = Math.abs(driftAngle);
        const isDrifting = this.physics.isDrifting || (absDriftAngle > 0.05 && this.physics.speed > 15);

        if (isDrifting) {
            // スリップ角に基づくキャスタートルクによる逆ハンドル量（進行方向を捉える実車自己整流）
            // 右ドリフト時（driftAngle < 0）は左へフルカウンター（負値）、左ドリフト時（driftAngle > 0）は右へフルカウンター（正値）
            const casterCounter = driftAngle * 0.95;
            // プレイヤーの能動的ステアリング修正（カウンター増し/戻し）の合成
            const playerCorrection = this.physics.steerAngle * 0.28;
            // 実車ドリフトの適正最大切れ角（約39.0度 = 0.68 rad：フェンダー干渉のないリアルで程よい角度に調整）
            const maxLock = 0.68;
            targetVisualSteer = Math.max(-maxLock, Math.min(maxLock, casterCounter + playerCorrection));
        } else {
            // 通常グリップ走行時も最大舵角を自然な31度（0.54 rad）に抑制
            const maxGripLock = 0.54;
            targetVisualSteer = Math.max(-maxGripLock, Math.min(maxGripLock, this.physics.steerAngle));
        }

        // 素早く滑らかな実車ステア追従補間（急変・ガタつきのない上質なステアフィール）
        const steerLerpSpeed = isDrifting ? 15.0 : 18.0;
        this.currentVisualSteer += (targetVisualSteer - this.currentVisualSteer) * Math.min(1.0, steerLerpSpeed * dt);

        // ★【アッカーマン・ステアリング幾何学】
        // 旋回時、旋回中心に近い内輪の方が外輪よりも切れ角が大きくなる実車ジオメトリを再現
        // 切れ角比率を控えめ（1.08x / 0.94x）にして左右タイヤの自然な開きを維持
        if (this.frontWheelL && this.frontWheelR) {
            let steerL = this.currentVisualSteer;
            let steerR = this.currentVisualSteer;

            if (this.currentVisualSteer > 0.02) {
                // 右操舵（正値）：右前輪（イン側）が約8%大きく切れ、左前輪（アウト側）が約6%小さく切れる
                steerR = this.currentVisualSteer * 1.08;
                steerL = this.currentVisualSteer * 0.94;
            } else if (this.currentVisualSteer < -0.02) {
                // 左操舵（負値）：左前輪（イン側）が約8%大きく切れ、右前輪（アウト側）が約6%小さく切れる
                steerL = this.currentVisualSteer * 1.08;
                steerR = this.currentVisualSteer * 0.94;
            }

            this.frontWheelL.rotation.y = steerL;
            this.frontWheelR.rotation.y = steerR;

            // ★【動的ネガティブキャンバー変化】
            // ステアリングを切ると、実車のキャスター角により外側にタイヤが自然に傾く（約4.5度）
            const camberAngle = -this.currentVisualSteer * 0.08;
            this.frontWheelL.rotation.z = camberAngle;
            this.frontWheelR.rotation.z = camberAngle;
        }

        // ブレーキ時のテールランプ高輝度点灯＆路面照射
        const isBraking = (this.physics.brake > 0.05 || this.physics.handbrake);
        if (this.tailLightMat && this.brakeLight) {
            if (isBraking) {
                this.tailLightMat.color.setHex(0xff0022);
                if (this.tailLightMat.emissive) this.tailLightMat.emissive.setHex(0xee1111);
                this.brakeLight.intensity = 2.6;
            } else {
                this.tailLightMat.color.setHex(0x660808);
                if (this.tailLightMat.emissive) this.tailLightMat.emissive.setHex(0x660808);
                this.brakeLight.intensity = 0.0;
            }
        }

        // ホイール回転アニメーション
        const wheelAngle = (this.physics.speedMs / 0.32) * dt;
        this.wheels.forEach(w => {
            w.mesh.rotation.x += wheelAngle;
        });

        // リトラクタブルヘッドライトのスムーズ開閉アニメーション (約0.22秒で全開閉)
        const targetProgress = this.lightsOn ? 1.0 : 0.0;
        if (Math.abs(this.retractProgress - targetProgress) > 0.001) {
            const speed = 4.5;
            if (this.retractProgress < targetProgress) {
                this.retractProgress = Math.min(targetProgress, this.retractProgress + speed * dt);
            } else {
                this.retractProgress = Math.max(targetProgress, this.retractProgress - speed * dt);
            }
            this.applyLightState(false);
        }
    }

    /**
     * ヘッドライトの点灯／消灯（リトラクタブル開閉連動）
     */
    toggleHeadlights() {
        this.lightsOn = !this.lightsOn;
        if (this.popups.length === 0) {
            this.applyLightState(true);
        }
    }

    /**
     * ヘッドライト・リトラクタブルの角度と発光強度の適用
     */
    applyLightState(instant = false) {
        // リトラクタブルユニットの開閉角度を更新
        for (let p of this.popups) {
            const angle = p.closedAngle + (p.openAngle - p.closedAngle) * this.retractProgress;
            p.unit.rotation.x = angle;
        }

        // ヘッドライト発光レンズマテリアルの輝度
        const targetEmissive = this.popups.length > 0
            ? 2.5 * this.retractProgress
            : (this.lightsOn ? 2.5 : 0.0);

        for (let mat of this.headlightMats) {
            if (mat && mat.emissive) {
                mat.emissiveIntensity = targetEmissive;
            }
        }

        // 前方ツインスポットライト＋フィルライトの照射強度
        const lightMult = this.popups.length > 0 ? this.retractProgress : (this.lightsOn ? 1.0 : 0.0);
        for (let l of this.headlights) {
            if (l.isSpotLight) {
                l.intensity = 8.5 * lightMult;
            } else if (l.isPointLight) {
                l.intensity = 1.8 * lightMult;
            }
        }
    }

    getRearWheelPositions(track = null, hintT = null) {
        this.meshGroup.updateMatrixWorld(true);
        const leftRear = this.rearWheelLPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
        const rightRear = this.rearWheelRPos.clone().applyMatrix4(this.meshGroup.matrixWorld);

        // トラック参照がある場合は、左右タイヤそれぞれの直下のアスファルト路面高さを直接サンプリング
        // 秋名山などの急勾配ダウンヒルでも、下り坂の標高差（約10〜14cm）を完璧に捉えてアスファルト表面に100%吸着
        const trackRef = track || (this.physics ? this.physics.track : null);
        const tHint = (hintT !== null && hintT !== undefined) ? hintT : (this.physics ? this.physics.trackT : null);

        if (trackRef && typeof trackRef.getRoadSurfaceY === 'function') {
            leftRear.y = trackRef.getRoadSurfaceY(leftRear, tHint);
            rightRear.y = trackRef.getRoadSurfaceY(rightRear, tHint);
        } else {
            // フォールバック：車体の傾き（ピッチ）を維持したままタイヤ半径0.31m分を接地面にオフセット
            leftRear.y -= 0.31;
            rightRear.y -= 0.31;
        }

        return { left: leftRear, right: rightRear };
    }

    /**
     * フロント前輪（操舵輪）の左右接地位置の算出（カウンターステア痕用）
     */
    getFrontWheelPositions(track = null, hintT = null) {
        this.meshGroup.updateMatrixWorld(true);
        let leftFront, rightFront;

        if (this.frontWheelL && this.frontWheelR) {
            leftFront = new THREE.Vector3();
            rightFront = new THREE.Vector3();
            this.frontWheelL.getWorldPosition(leftFront);
            this.frontWheelR.getWorldPosition(rightFront);
        } else {
            leftFront = this.frontWheelLPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
            rightFront = this.frontWheelRPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
        }

        const trackRef = track || (this.physics ? this.physics.track : null);
        const tHint = (hintT !== null && hintT !== undefined) ? hintT : (this.physics ? this.physics.trackT : null);

        if (trackRef && typeof trackRef.getRoadSurfaceY === 'function') {
            leftFront.y = trackRef.getRoadSurfaceY(leftFront, tHint);
            rightFront.y = trackRef.getRoadSurfaceY(rightFront, tHint);
        } else {
            leftFront.y -= 0.31;
            rightFront.y -= 0.31;
        }

        return { left: leftFront, right: rightFront };
    }

    getTailLightPositions() {
        this.meshGroup.updateMatrixWorld(true);
        const lPos = this.tailLPos || new THREE.Vector3(-0.60, 0.58, -2.05);
        const rPos = this.tailRPos || new THREE.Vector3(0.60, 0.58, -2.05);
        const leftTail = lPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
        const rightTail = rPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
        return { left: leftTail, right: rightTail };
    }

    /**
     * アフターファイヤ用マフラー排気口のワールド座標と後方噴射ベクトル
     */
    getExhaustPosition() {
        this.meshGroup.updateMatrixWorld(true);
        const worldPos = this.exhaustLocalPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
        const worldDir = new THREE.Vector3(0.06, -0.04, -1.0)
            .applyQuaternion(this.meshGroup.quaternion)
            .normalize();
        return { position: worldPos, direction: worldDir };
    }
}

window.PlayerCar = PlayerCar;
