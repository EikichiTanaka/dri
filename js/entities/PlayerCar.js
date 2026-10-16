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

        // 既存メッシュの全削除
        while (this.meshGroup.children.length > 0) {
            const child = this.meshGroup.children[0];
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

        // 前輪ステアリング角の反映（ハンドル操作方向とタイヤの向きを完全一致）
        if (this.frontWheelL && this.frontWheelR) {
            this.frontWheelL.rotation.y = -this.physics.steerAngle;
            this.frontWheelR.rotation.y = -this.physics.steerAngle;
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

    getRearWheelPositions() {
        this.meshGroup.updateMatrixWorld(true);
        const leftRear = this.rearWheelLPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
        const rightRear = this.rearWheelRPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
        return { left: leftRear, right: rightRear };
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
