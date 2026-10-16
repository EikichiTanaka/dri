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

        this.wheels = model.wheels;
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
        this.meshGroup.position.copy(this.physics.position);
        this.meshGroup.rotation.y = this.physics.yaw;

        // 勾配（ピッチ）とロール・加減速・エンジンブレーキノーズダイブ・立体カントを滑らかに合成
        const bankRoll = (this.physics.trackInfo ? (this.physics.trackInfo.bankAngle || 0) : 0);
        const rollAmount = -this.physics.steerAngle * (this.physics.speed / 180) * 0.12;
        const accelPitch = (this.physics.throttle * 0.02) - (this.physics.brake * 0.05);
        const engineBrakePitch = ((this.physics.engineBrakeForce || 0) / 7.2) * 0.045;
        this.meshGroup.rotation.z = rollAmount + bankRoll + (this.physics.gutterRoll || 0);
        this.meshGroup.rotation.x = this.physics.pitch + accelPitch - engineBrakePitch;

        // ★【視覚リアリズム】フロントタイヤのカウンターステア実舵角アニメーション
        // 通常走行時はドライバーの入力ステア角に自然に追従し、
        // ドリフト発生時はスリップ角（driftAngle）とセルフアライニング・トルクにより、
        // 前輪が進行方向を捉えて綺麗に逆ハンドル（フルカウンター）を切る実車の実舵角挙動を完全再現！
        let targetVisualSteer = -this.physics.steerAngle;

        const driftAngle = this.physics.driftAngle || 0;
        const absDriftAngle = Math.abs(driftAngle);
        const isDrifting = this.physics.isDrifting || (absDriftAngle > 0.05 && this.physics.speed > 15);

        if (isDrifting) {
            // スリップ角に基づくキャスタートルクによる逆ハンドル量（進行方向を捉える実車自己整流）
            const casterCounter = -driftAngle * 1.15;
            // プレイヤーの能動的ステアリング修正（カウンター増し/戻し）の合成
            const playerCorrection = -this.physics.steerAngle * 0.45;
            // 実車ドリフトの切れ角アップナックル仕様（約50.4度 = 0.88 rad でフェンダーからタイヤが大胆に露出！）
            const maxLock = 0.88;
            targetVisualSteer = Math.max(-maxLock, Math.min(maxLock, casterCounter + playerCorrection));
        }

        // 素早く滑らかな実車ステア追従補間（lerp）
        const steerLerpSpeed = isDrifting ? 18.0 : 20.0;
        this.currentVisualSteer += (targetVisualSteer - this.currentVisualSteer) * Math.min(1.0, steerLerpSpeed * dt);

        // アッカーマン・ステアリング幾何（内側輪が外側輪より大きく切れる実車ジオメトリ）
        if (this.frontWheelL && this.frontWheelR) {
            let steerL = this.currentVisualSteer;
            let steerR = this.currentVisualSteer;

            if (this.currentVisualSteer > 0.02) {
                // 左操舵：左前輪（イン側）が約12%大きく切れ、右前輪（アウト側）が約8%小さく切れる
                steerL = this.currentVisualSteer * 1.12;
                steerR = this.currentVisualSteer * 0.92;
            } else if (this.currentVisualSteer < -0.02) {
                // 右操舵：右前輪（イン側）が約12%大きく切れ、左前輪（アウト側）が約8%小さく切れる
                steerR = this.currentVisualSteer * 1.12;
                steerL = this.currentVisualSteer * 0.92;
            }

            this.frontWheelL.rotation.y = steerL;
            this.frontWheelR.rotation.y = steerR;

            // キャスターアクションによるネガティブキャンバーの傾き（カウンター時に前輪がグッと路面に踏ん張る実車アライメント：約6.8度）
            this.frontWheelL.rotation.z = -this.currentVisualSteer * 0.12;
            this.frontWheelR.rotation.z = -this.currentVisualSteer * 0.12;
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
        const leftTail = this.tailLPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
        const rightTail = this.tailRPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
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
