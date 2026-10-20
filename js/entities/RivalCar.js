/**
 * RivalCar.js - ライバル車両（FD3S風 イエロースポーツカー 3Dモデル & 峠AI）
 * 高橋啓介風の鮮烈なイエローボディ、大型GTウィング、リアルタイムドリフトAI
 */

class RivalCar {
    constructor(scene, track, playerPhysics) {
        this.scene = scene;
        this.track = track;
        this.playerPhysics = playerPhysics;
        this.meshGroup = new THREE.Group();
        this.meshGroup.rotation.order = 'YXZ';

        // 状態変数
        this.progressT = 0.005; // スタート位置（プレイヤーの少し前）
        this.lateralOffset = 1.6; // プレイヤーの右側
        this.speed = 0;
        this.speedMs = 0;
        this.targetSpeed = 120;
        this.baseYaw = 0;
        this.yaw = 0;
        this.steerAngle = 0;
        this.driftAngle = 0;
        this.roll = 0;
        this.pitch = 0;
        this.accel = 0;
        this.difficulty = 'normal';
        this.isDrifting = false;
        this.position = new THREE.Vector3();

        this.wheels = [];
        this.frontWheelL = null;
        this.frontWheelR = null;

        this.buildCarModel();
        this.scene.add(this.meshGroup);

        this.resetPosition();
    }

    get trackT() {
        return this.progressT;
    }

    set trackT(val) {
        this.progressT = val;
    }

    buildCarModel() {
        const yellowMat = new THREE.MeshStandardMaterial({
            color: 0xffcc00, // コンペティションイエローマイカ
            roughness: 0.2,
            metalness: 0.3
        });

        const blackMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.4,
            metalness: 0.3
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x0a1018,
            roughness: 0.1,
            metalness: 0.9,
            transparent: true,
            opacity: 0.8
        });

        const goldRimMat = new THREE.MeshStandardMaterial({
            color: 0xddaa33,
            roughness: 0.35,
            metalness: 0.75
        });

        const tireMat = new THREE.MeshStandardMaterial({
            color: 0x222222,
            roughness: 0.9
        });

        // 1. 流線型メインボディ
        const bodyGeom = new THREE.BoxGeometry(1.68, 0.42, 4.1);
        const body = new THREE.Mesh(bodyGeom, yellowMat);
        body.position.y = 0.48;
        body.castShadow = true;
        this.meshGroup.add(body);

        // 2. フロントノーズ＆スポイラー
        const noseGeom = new THREE.BoxGeometry(1.65, 0.22, 1.2);
        const nose = new THREE.Mesh(noseGeom, yellowMat);
        nose.position.set(0, 0.38, 1.6);
        this.meshGroup.add(nose);

        const splitterGeom = new THREE.BoxGeometry(1.65, 0.045, 0.22);
        const splitter = new THREE.Mesh(splitterGeom, blackMat);
        splitter.position.set(0, 0.2, 2.06);
        this.meshGroup.add(splitter);

        // 3. ルーフ＆キャビン
        const cabinGeom = new THREE.BoxGeometry(1.4, 0.42, 1.9);
        const cabin = new THREE.Mesh(cabinGeom, yellowMat);
        cabin.position.set(0, 0.86, -0.2);
        this.meshGroup.add(cabin);

        // 4. ウィンドウ
        const frontGlassGeom = new THREE.BoxGeometry(1.36, 0.38, 0.05);
        const frontGlass = new THREE.Mesh(frontGlassGeom, glassMat);
        frontGlass.position.set(0, 0.84, 0.76);
        frontGlass.rotation.x = -0.72;
        this.meshGroup.add(frontGlass);

        const rearGlassGeom = new THREE.BoxGeometry(1.36, 0.38, 0.05);
        const rearGlass = new THREE.Mesh(rearGlassGeom, glassMat);
        rearGlass.position.set(0, 0.84, -1.16);
        rearGlass.rotation.x = 0.72;
        this.meshGroup.add(rearGlass);

        // 5. ヘッドライト
        for (let s of [-1, 1]) {
            const hlGeom = new THREE.BoxGeometry(0.35, 0.12, 0.3);
            const hl = new THREE.Mesh(hlGeom, new THREE.MeshBasicMaterial({ color: 0xffffee }));
            hl.position.set(s * 0.55, 0.56, 1.95);
            this.meshGroup.add(hl);
        }

        // 6. テールランプ（丸目連装風）
        for (let s of [-1, 1]) {
            const tlGeom = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 12);
            tlGeom.rotateX(Math.PI / 2);
            const tl = new THREE.Mesh(tlGeom, new THREE.MeshBasicMaterial({ color: 0xff1111 }));
            tl.position.set(s * 0.55, 0.54, -2.06);
            this.meshGroup.add(tl);
        }

        // 7. 大型GTウィング
        const wingStands = new THREE.Group();
        for (let s of [-1, 1]) {
            const standGeom = new THREE.BoxGeometry(0.04, 0.35, 0.18);
            const stand = new THREE.Mesh(standGeom, blackMat);
            stand.position.set(s * 0.45, 0.82, -1.8);
            wingStands.add(stand);
        }
        const wingGeom = new THREE.BoxGeometry(1.72, 0.05, 0.32);
        const mainWing = new THREE.Mesh(wingGeom, blackMat);
        mainWing.position.set(0, 1.0, -1.8);
        wingStands.add(mainWing);
        this.meshGroup.add(wingStands);

        // 8. ホイール＆タイヤ
        const wheelRadius = 0.32;
        const wheelWidth = 0.26;
        const tireGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 16);
        tireGeom.rotateZ(Math.PI / 2);
        const rimGeom = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth + 0.02, 10);
        rimGeom.rotateZ(Math.PI / 2);

        const wheelPos = [
            { x: -0.82, y: 0.32, z: 1.3, isFront: true, isLeft: true },
            { x: 0.82, y: 0.32, z: 1.3, isFront: true, isLeft: false },
            { x: -0.82, y: 0.32, z: -1.3, isFront: false, isLeft: true },
            { x: 0.82, y: 0.32, z: -1.3, isFront: false, isLeft: false }
        ];

        wheelPos.forEach((wp) => {
            const pivot = new THREE.Group();
            pivot.position.set(wp.x, wp.y, wp.z);

            const wMesh = new THREE.Group();
            const tire = new THREE.Mesh(tireGeom, tireMat);
            tire.castShadow = true;
            wMesh.add(tire);
            const rim = new THREE.Mesh(rimGeom, goldRimMat);
            wMesh.add(rim);

            pivot.add(wMesh);
            this.meshGroup.add(pivot);

            this.wheels.push({ pivot, mesh: wMesh, isFront: wp.isFront, isLeft: wp.isLeft, defaultY: wp.y, defaultZ: wp.z });
            if (wp.isFront) {
                if (wp.isLeft) this.frontWheelL = pivot;
                else this.frontWheelR = pivot;
            }
        });

        // 9. ヘッドライト照射（高光度ツインスポット＋フィルライト）
        for (let s of [-1, 1]) {
            const headLight = new THREE.SpotLight(0xfff8de, 8.5, 110, Math.PI / 5.5, 0.45, 0.7);
            headLight.position.set(s * 0.55, 0.62, 1.95);
            const targetObj = new THREE.Object3D();
            targetObj.position.set(s * 0.55 * 0.7, -0.2, 42.0);
            this.meshGroup.add(targetObj);
            headLight.target = targetObj;
            this.meshGroup.add(headLight);
        }
        const rivalFill = new THREE.PointLight(0xfff5d8, 1.8, 18, 1.5);
        rivalFill.position.set(0, 0.62, 2.2);
        this.meshGroup.add(rivalFill);

        // 10. FD3S専用 大口径チタン砲弾マフラー
        const exhaustGroup = new THREE.Group();
        const titaniumMat = new THREE.MeshStandardMaterial({
            color: 0x98b4d4, // チタン焼き色グラデーション風
            metalness: 0.95,
            roughness: 0.15
        });
        const pipeInnerMat = new THREE.MeshBasicMaterial({ color: 0x050505 });

        // タイコ（砲弾サイレンサー）
        const canGeom = new THREE.CylinderGeometry(0.085, 0.085, 0.40, 16);
        canGeom.rotateX(Math.PI / 2);
        const canMesh = new THREE.Mesh(canGeom, titaniumMat);
        canMesh.position.set(0.56, 0.19, -1.82);
        canMesh.rotation.y = 0.06;
        exhaustGroup.add(canMesh);

        // スラッシュカット大口径テールパイプ
        const tipGeom = new THREE.CylinderGeometry(0.058, 0.058, 0.22, 16);
        tipGeom.rotateX(Math.PI / 2);
        const tipMesh = new THREE.Mesh(tipGeom, titaniumMat);
        tipMesh.position.set(0.59, 0.17, -2.08);
        tipMesh.rotation.y = 0.10; // 迫力の斜め跳ね上げ出し
        exhaustGroup.add(tipMesh);

        // 排気口内部
        const innerGeom = new THREE.CircleGeometry(0.052, 14);
        const innerMesh = new THREE.Mesh(innerGeom, pipeInnerMat);
        innerMesh.position.set(0.60, 0.17, -2.19);
        innerMesh.rotation.y = Math.PI + 0.10;
        exhaustGroup.add(innerMesh);

        this.meshGroup.add(exhaustGroup);
        this.exhaustLocalPos = new THREE.Vector3(0.60, 0.17, -2.20);
        this.afterfireCooldown = 0;
    }

    resetPosition() {
        this.progressT = 0.0035;
        this.lateralOffset = 1.6;
        this.speed = 0;
        this.speedMs = 0;
        this.driftAngle = 0;
        this.steerAngle = 0;
        this.roll = 0;
        this.pitch = 0;
        this.accel = 0;
        const tangent = this.track.curve.getTangentAt(this.progressT).normalize();
        this.baseYaw = Math.atan2(tangent.x, tangent.z);
        this.yaw = this.baseYaw;
        this.updatePositionFromTrack(0.016, 0, 0);
    }

    setDifficulty(diff) {
        this.difficulty = diff || 'normal';
    }

    setWeather(weather) {
        this.weather = weather || 'dry';
    }

    update(dt) {
        if (dt > 0.1) dt = 0.1;

        // コース情報のサンプリング
        const trackPoint = this.track.getPointAt(this.progressT);
        const tangent = this.track.curve.getTangentAt(this.progressT).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        // 前方マルチサンプルによるコーナー曲率と旋回方向の先読み予測（人間らしい予見ブレーキング）
        const sampleCount = (this.track.samples && this.track.samples.length) ? this.track.samples.length : 1000;
        const curIdx = Math.min(sampleCount - 1, Math.max(0, Math.floor(this.progressT * (sampleCount - 1))));
        const curSample = (this.track.samples && this.track.samples[curIdx]) ? this.track.samples[curIdx] : { curvature: 0, turnDir: 0 };

        const lookAheadIdx1 = Math.min(sampleCount - 1, Math.floor((this.progressT + 0.008) * (sampleCount - 1)));
        const lookAheadIdx2 = Math.min(sampleCount - 1, Math.floor((this.progressT + 0.016) * (sampleCount - 1)));
        const lookAheadIdx3 = Math.min(sampleCount - 1, Math.floor((this.progressT + 0.024) * (sampleCount - 1)));

        const s1 = (this.track.samples && this.track.samples[lookAheadIdx1]) ? this.track.samples[lookAheadIdx1] : curSample;
        const s2 = (this.track.samples && this.track.samples[lookAheadIdx2]) ? this.track.samples[lookAheadIdx2] : curSample;
        const s3 = (this.track.samples && this.track.samples[lookAheadIdx3]) ? this.track.samples[lookAheadIdx3] : curSample;

        // ブレーキングゾーン前方最大曲率
        const maxCurvatureAhead = Math.max(curSample.curvature || 0, s1.curvature || 0, s2.curvature || 0, s3.curvature || 0);

        // 旋回方向の算出（外積）：+なら右カーブ、-なら左カーブ
        const lookAheadT = Math.min(0.999, this.progressT + 0.018);
        const tanAhead = this.track.curve.getTangentAt(lookAheadT).normalize();
        const crossY = tangent.z * tanAhead.x - tangent.x * tanAhead.z;
        const turnDir = (Math.abs(crossY) > 0.0005) ? Math.sign(crossY) : 0;

        // 難易度ごとの速度プロファイル（プレイヤーの頭文字D・リアル挙動に適合）
        let maxStraight = 126;
        let midCorner = 70;
        let hairpinSpeed = 46;
        let baseAccel = 17.5;

        if (this.difficulty === 'easy') {
            maxStraight = 112;
            midCorner = 60;
            hairpinSpeed = 40;
            baseAccel = 14.5;
        } else if (this.difficulty === 'hard') {
            maxStraight = 138;
            midCorner = 78;
            hairpinSpeed = 50;
            baseAccel = 20.0;
        }

        // 天候によるコーナリングスピード＆加速の調整
        if (this.weather === 'rain') {
            midCorner *= 0.88;
            hairpinSpeed *= 0.88;
            baseAccel *= 0.90;
        }

        // 曲率に応じた滑らかな目標速度の連続ブレンド算出
        let desiredSpeed = maxStraight;
        if (maxCurvatureAhead <= 0.004) {
            desiredSpeed = maxStraight;
        } else if (maxCurvatureAhead <= 0.016) {
            const blend = (maxCurvatureAhead - 0.004) / (0.016 - 0.004);
            desiredSpeed = maxStraight + (midCorner - maxStraight) * blend;
        } else if (maxCurvatureAhead <= 0.032) {
            const blend = (maxCurvatureAhead - 0.016) / (0.032 - 0.016);
            desiredSpeed = midCorner + (hairpinSpeed - midCorner) * blend;
        } else {
            const extra = Math.min(1.0, (maxCurvatureAhead - 0.032) / 0.02);
            desiredSpeed = hairpinSpeed * (1.0 - 0.08 * extra);
        }

        // 接戦演出ラバーバンド（メートル換算で滑らかに調整）
        const playerSample = this.playerPhysics.track.getClosestSample(this.playerPhysics.position, this.playerPhysics.trackT);
        const distMeters = (this.progressT - playerSample.t) * this.track.trackLength;

        let rubberBandFactor = 1.0;
        if (distMeters > 20) {
            // ライバルが先行している場合：プレイヤーが追いつけるように適度にペースを落とす
            const easeT = Math.min(1.0, (distMeters - 20) / 60);
            const minFactor = (this.difficulty === 'easy' ? 0.75 : (this.difficulty === 'hard' ? 0.88 : 0.82));
            rubberBandFactor = 1.0 - (1.0 - minFactor) * easeT;
        } else if (distMeters < -15) {
            // プレイヤーが先行している場合：ライバルが追いすがる（ただし非現実的なチート速度は出さない）
            const chaseT = Math.min(1.0, (-distMeters - 15) / 60);
            const maxFactor = (this.difficulty === 'easy' ? 1.02 : (this.difficulty === 'hard' ? 1.10 : 1.06));
            rubberBandFactor = 1.0 + (maxFactor - 1.0) * chaseT;
        }
        desiredSpeed *= rubberBandFactor;

        // 加減速（速度域に応じたリアルなトルク＆空気抵抗特性、自然なブレーキング）
        const prevSpeed = this.speed;
        if (this.speed < desiredSpeed) {
            const speedRatio = Math.min(1.0, this.speed / maxStraight);
            const accelFactor = Math.max(0.45, 1.25 - 0.75 * speedRatio);
            this.speed += baseAccel * accelFactor * dt;
        } else {
            // コーナー進入前のブレーキング
            this.speed -= 36.0 * dt;
        }
        const speedCap = maxStraight * (this.difficulty === 'hard' ? 1.12 : 1.08);
        this.speed = Math.max(0, Math.min(speedCap, this.speed));
        this.speedMs = this.speed / 3.6;
        this.accel = (this.speed - prevSpeed) / dt;

        // ★ライバルFD3Sのアフターファイヤ発火判定（コーナー進入前の急減速時）
        if (this.afterfireCooldown > 0) this.afterfireCooldown -= dt;
        if (this.accel < -18 && prevSpeed > 55 && this.afterfireCooldown <= 0) {
            this.afterfireCooldown = 1.4 + Math.random() * 0.8;
            if (this.onAfterfire) {
                this.onAfterfire(0.85);
            }
        }

        // 進捗 t の加算
        const deltaProgress = (this.speedMs * dt) / this.track.trackLength;
        this.progressT = Math.min(0.999, this.progressT + deltaProgress);

        // ドリフト判定
        const currentCurvature = curSample.curvature || 0;
        const minDriftCurv = (this.weather === 'rain') ? 0.012 : 0.016;
        const minDriftSpd = (this.weather === 'rain') ? 26 : 38;
        this.isDrifting = (currentCurvature > minDriftCurv && this.speed > minDriftSpd);

        // コーナリング時のアウト・イン・アウトの滑らかなレーシングライン
        const targetOffset = -turnDir * (currentCurvature > 0.018 ? 2.4 : 0.8);
        this.lateralOffset += (targetOffset - this.lateralOffset) * Math.min(1.0, 2.8 * dt);

        // 姿勢＆前輪アニメーション更新（人間らしい滑らかなドライビングモーション）
        this.updatePositionFromTrack(dt, turnDir, currentCurvature);

        // ホイール回転アニメ
        const wheelAngle = (this.speedMs / 0.32) * dt;
        this.wheels.forEach(w => {
            w.mesh.rotation.x += wheelAngle;
        });
    }

    updatePositionFromTrack(dt, turnDir, curvature) {
        const point = this.track.getPointAt(this.progressT);
        const tangent = this.track.curve.getTangentAt(this.progressT).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const sampleIdx = Math.min(this.track.samples.length - 1, Math.floor(this.progressT * this.track.samples.length));
        const trackSample = this.track.samples[sampleIdx];
        const bank = trackSample ? (trackSample.bankAngle || 0) : 0;

        // 1. 車体位置（路面完全接地＆立体カント追従）
        this.position.copy(point).add(normal.clone().multiplyScalar(this.lateralOffset));

        // 2. 滑らかな車体基本アングル（Yaw）の慣性補間（カクカク直代入の廃止！）
        const targetRoadYaw = Math.atan2(tangent.x, tangent.z);
        let angleDiff = targetRoadYaw - this.baseYaw;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        this.baseYaw += angleDiff * Math.min(1.0, 9.5 * dt);

        // 3. 有機的ドリフトアングル（ジワッとテールが滑り出し、滑らかに収束）
        let targetDrift = 0;
        if (this.isDrifting && turnDir !== 0) {
            const driftMagnitude = Math.min(0.38, (curvature / 0.04) * 0.36);
            targetDrift = turnDir * driftMagnitude;
        }
        this.driftAngle += (targetDrift - this.driftAngle) * Math.min(1.0, 4.0 * dt);

        this.yaw = this.baseYaw + this.driftAngle;
        const sinYaw = Math.sin(this.yaw);
        const cosYaw = Math.cos(this.yaw);

        // ★【ライバル車・4輪アクスル直下実路面標高サンプリング（坂道下り・ドリフトめり込み根絶）】
        let groundCenterY = point.y + (Math.sin(bank) * this.lateralOffset);
        let surfacePitch = -Math.asin(Math.max(-0.99, Math.min(0.99, tangent.y)));
        let surfaceRoll = bank;

        if (typeof this.track.getRoadSurfaceY === 'function') {
            const fPosX = this.position.x + sinYaw * 1.25;
            const fPosZ = this.position.z + cosYaw * 1.25;
            const rPosX = this.position.x - sinYaw * 1.25;
            const rPosZ = this.position.z - cosYaw * 1.25;

            const yF = this.track.getRoadSurfaceY(new THREE.Vector3(fPosX, this.position.y, fPosZ), this.progressT);
            const yR = this.track.getRoadSurfaceY(new THREE.Vector3(rPosX, this.position.y, rPosZ), this.progressT);

            if (yF !== null && yR !== null && !isNaN(yF) && !isNaN(yR)) {
                surfacePitch = -Math.atan2(yF - yR, 2.50);
                groundCenterY = (yF + yR) * 0.5;
            }

            const lPosX = this.position.x - cosYaw * 0.79;
            const lPosZ = this.position.z + sinYaw * 0.79;
            const rtPosX = this.position.x + cosYaw * 0.79;
            const rtPosZ = this.position.z - sinYaw * 0.79;

            const yL = this.track.getRoadSurfaceY(new THREE.Vector3(lPosX, this.position.y, lPosZ), this.progressT);
            const yRt = this.track.getRoadSurfaceY(new THREE.Vector3(rtPosX, this.position.y, rtPosZ), this.progressT);

            if (yL !== null && yRt !== null && !isNaN(yL) && !isNaN(yRt)) {
                surfaceRoll = Math.atan2(yRt - yL, 1.58);
            }
        }
        this.position.y = groundCenterY + 0.016;

        // 4. 人間らしい前輪ステアリング＆カウンターステア（逆ハン）
        let targetSteer = 0;
        if (this.isDrifting && Math.abs(this.driftAngle) > 0.05) {
            // カウンターステア：テールスライドを抑え込むように逆向きに操舵！
            targetSteer = -this.driftAngle * 0.90;
        } else {
            // 通常のコーナー進入：滑らかにインへ切り込み
            targetSteer = turnDir * Math.min(0.42, curvature * 14.0);
        }
        this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1.0, 10.0 * dt);

        if (this.frontWheelL && this.frontWheelR) {
            let steerL = this.steerAngle;
            let steerR = this.steerAngle;
            if (this.steerAngle > 0.02) {
                steerL = this.steerAngle * 1.08;
                steerR = this.steerAngle * 0.94;
            } else if (this.steerAngle < -0.02) {
                steerR = this.steerAngle * 1.08;
                steerL = this.steerAngle * 0.94;
            }
            this.frontWheelL.rotation.y = steerL;
            this.frontWheelR.rotation.y = steerR;
            this.frontWheelL.rotation.z = -this.steerAngle * 0.045;
            this.frontWheelR.rotation.z = -this.steerAngle * 0.045;
        }

        // 5. 車体サスペンションの動的ロール＆ピッチ（立体カント＋遠心力ロール）
        const targetRoll = surfaceRoll - (turnDir * (this.speed / 160) * Math.min(1.0, curvature * 22.0) * 0.08);
        this.roll += (targetRoll - this.roll) * Math.min(1.0, 8.0 * dt);

        // 勾配ピッチ＋加減速ピッチ（ブレーキでノーズダイブ、加速でリア沈み込み）
        const targetSuspPitch = (this.accel > 0 ? -0.010 : 0.018);
        if (this.currentSuspPitch === undefined) this.currentSuspPitch = 0;
        this.currentSuspPitch += (targetSuspPitch - this.currentSuspPitch) * Math.min(1.0, 10.0 * dt);
        this.pitch = surfacePitch + this.currentSuspPitch;

        // ホイールの接地補正（ブレーキ時沈み込みでもタイヤがめり込まない）
        const sinSuspPitch = Math.sin(this.currentSuspPitch);
        if (this.wheels) {
            this.wheels.forEach(w => {
                const zArm = w.defaultZ !== undefined ? w.defaultZ : (w.isFront ? 1.25 : -1.25);
                const defY = w.defaultY !== undefined ? w.defaultY : 0.31;
                w.pivot.position.y = defY + zArm * sinSuspPitch;
            });
        }

        // 6. 車体メッシュへの反映（Euler YXZ で姿勢合成）
        this.meshGroup.position.copy(this.position);
        this.meshGroup.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
    }

    getRearWheelPositions(track = null, hintT = null) {
        this.meshGroup.updateMatrixWorld(true);
        const leftRear = new THREE.Vector3(-0.82, 0.1, -1.3).applyMatrix4(this.meshGroup.matrixWorld);
        const rightRear = new THREE.Vector3(0.82, 0.1, -1.3).applyMatrix4(this.meshGroup.matrixWorld);

        const trackRef = track || this.track;
        const tHint = (hintT !== null && hintT !== undefined) ? hintT : (this.progressT || this.trackT || null);

        if (trackRef && typeof trackRef.getRoadSurfaceY === 'function') {
            leftRear.y = trackRef.getRoadSurfaceY(leftRear, tHint);
            rightRear.y = trackRef.getRoadSurfaceY(rightRear, tHint);
        } else {
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
            leftFront = new THREE.Vector3(-0.82, 0.1, 1.25).applyMatrix4(this.meshGroup.matrixWorld);
            rightFront = new THREE.Vector3(0.82, 0.1, 1.25).applyMatrix4(this.meshGroup.matrixWorld);
        }

        const trackRef = track || this.track;
        const tHint = (hintT !== null && hintT !== undefined) ? hintT : (this.progressT || this.trackT || null);

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
        const leftTail = new THREE.Vector3(-0.55, 0.54, -2.06).applyMatrix4(this.meshGroup.matrixWorld);
        const rightTail = new THREE.Vector3(0.55, 0.54, -2.06).applyMatrix4(this.meshGroup.matrixWorld);
        return { left: leftTail, right: rightTail };
    }

    /**
     * FD3Sマフラー排気口のワールド座標と後方噴射ベクトル
     */
    getExhaustPosition() {
        this.meshGroup.updateMatrixWorld(true);
        const worldPos = this.exhaustLocalPos.clone().applyMatrix4(this.meshGroup.matrixWorld);
        const worldDir = new THREE.Vector3(0.08, -0.04, -1.0)
            .applyQuaternion(this.meshGroup.quaternion)
            .normalize();
        return { position: worldPos, direction: worldDir };
    }

    /**
     * プレイヤーとの距離（メートル、+ならライバル先行、-ならプレイヤー先行）
     */
    getDistanceToPlayer() {
        const playerSample = this.track.getClosestSample(this.playerPhysics.position, this.playerPhysics.trackT);
        const rivalSample = this.track.getClosestSample(this.position, this.progressT);
        const deltaT = rivalSample.t - playerSample.t;
        return deltaT * this.track.trackLength;
    }
}

window.RivalCar = RivalCar;
