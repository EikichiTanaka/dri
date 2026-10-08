/**
 * CarPhysics.js - 現実味のあるリアル物理エンジン（重量慣性・タイヤグリップ限界・荷重移動）
 * 「すんなり曲がりすぎる」問題を根本解消し、FRスポーツカー（AE86）らしい
 * ずっしりとした車重感、速度感応ステアリング、ブレーキングターン、リアルなドリフトを実現。
 */

class CarPhysics {
    constructor(track, isPlayer = true) {
        this.track = track;
        this.isPlayer = isPlayer;

        // 車両位置と姿勢
        this.position = new THREE.Vector3(0, 0, 0);
        this.yaw = 0; // 車体の向き (radians)
        this.yawRate = 0; // ヨー角速度 (rad/s) ★慣性モーメントにより滑らかに変化
        this.pitch = 0;
        this.roll = 0;

        // 車両速度・加速度
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.speed = 0; // km/h
        this.speedMs = 0; // m/s
        this.accelX = 0; // 横G
        this.accelZ = 0; // 前後G

        // ステアリング
        this.steerInput = 0;
        this.steerAngle = 0; // 前輪実舵角 (radians)

        // 操作入力
        this.throttle = 0;
        this.brake = 0;
        this.handbrake = false;
        this.isLocked = false; // カウントダウン用

        // トランスミッション (AE86 5速)
        this.gear = 1;
        this.isAutomatic = true;
        this.gearRatios = [0, 3.166, 1.904, 1.392, 1.082, 0.861];
        this.finalDrive = 4.300;
        this.wheelCircumference = 1.82;
        this.rpm = 1000;
        this.maxRpm = 11000;
        this.idleRpm = 950;
        this.shiftTimer = 0;
        this.shiftBuffer = null;
        this.shiftBufferTimer = 0;
        this.downshiftBrakeTimer = 0;
        this.engineBrakeForce = 0;
        this.isRevLimiterCut = false;
        this.wasLocked = false;
        this.clutchSlip = 0;
        this.launchRpm = 950;
        this.launchBoostTimer = 0;

        // アフターファイヤ管理
        this.prevThrottle = 0;
        this.afterfireCooldown = 0;
        this.revLimiterPopTimer = 0;
        this.onAfterfire = null;

        // 走り屋追加メーター用リアルタイム計測値 (油圧 / 水温 / 油温 / 負圧)
        this.oilPressure = 200; // kPa (150〜700 kPa)
        this.waterTemp = 86.0;  // ℃ (75〜110 ℃)
        this.oilTemp = 90.0;    // ℃ (80〜125 ℃)
        this.manifoldPressure = -70; // kPa (-80〜0 kPa)

        // 車両スペック（AE86 トレノ基準）
        this.mass = 960; // kg
        this.weightFrontStatic = 0.53; // 前後重量配分 53:47
        this.wheelbase = 2.40; // ホイールベース (m)
        this.cgToFront = 1.15; // 重心から前軸 (m)
        this.cgToRear = 1.25;  // 重心から後軸 (m)
        this.inertiaZ = 1250;  // ヨー慣性モーメント (kg*m^2)

        // タイヤグリップ・コーナリング特性
        this.corneringStiffnessFront = 38000; // 前輪コーナリングパワー (N/rad)
        this.corneringStiffnessRear = 36000;  // 後輪コーナリングパワー (N/rad)
        this.tireGripLimit = 1.08; // 最大横G (~1.08G)

        // ドリフト状態
        this.isDrifting = false;
        this.driftAngle = 0; // スリップ角
        this.driftScore = 0;
        this.driftType = '';
        this.driftTimer = 0;
        this.feintTimer = 0;
        this.lastSteerDir = 0;
        this.enableHairpinArcadeAssist = true; // ★アーケード型 軌道旋回アシスト有効フラグ
        this.cornerAssistMode = 'weak'; // 'weak' (現在のコーナーアシスト) または 'strong' (面白いほど曲がる強力なアシスト)

        // 溝落とし & 壁衝突
        this.isGutterRun = false;
        this.gutterTimer = 0;
        this.gutterRoll = 0;   // 溝進入時のインサイドロール傾斜角 (radians)
        this.gutterDropY = 0;  // 溝進入時のサスペンション沈み込みオフセット (m)
        this.isCollidingWall = false;
        this.wallHitIntensity = 0;

        // ★天候・路面グリップ特性 (DRY, RAIN, FOG)
        this.weather = 'dry';
        this.surfaceGripFactor = 1.00;

        // ★峠道路肩・砂利（Gravel & Dirt Shoulder）状態
        this.gravelIntensity = 0;
        this.gravelWheelSide = 0; // -1: 左輪, +1: 右輪

        this.maxSpeed = 235;
        this.drivetrain = 'FR';
        this.torqueSplitFront = 0.38;
        this.hasMisfiringSystem = false;
        this.isDokkanTurbo = false;
        this.misfirePopTimer = 0;
        this.carId = 'ae86';
        this.gearAccelMap = [0, 5.4, 4.0, 2.9, 1.9, 1.3];
        this.redlineRpm = 9100;
        this.engineResponse = 24.0;
        this.trackT = 0.002;

        this.resetToTrack(0.002, 0);
    }

    /**
     * ガレージで選択されたマシンのスペック・物理プロファイルを動的適用
     */
    applyCarProfile(profile) {
        if (!profile) return;
        this.carId = profile.id || this.carId;
        this.carModelCode = profile.modelCode || 'AE86';
        this.carShortName = profile.shortName || 'AE86 トレノ';
        const p = profile.physics || profile;

        if (p.mass) this.mass = p.mass;
        if (p.weightFrontStatic) this.weightFrontStatic = p.weightFrontStatic;
        if (p.wheelbase) this.wheelbase = p.wheelbase;
        if (p.cgToFront) this.cgToFront = p.cgToFront;
        if (p.cgToRear) this.cgToRear = p.cgToRear;
        if (p.inertiaZ) this.inertiaZ = p.inertiaZ;
        if (p.corneringStiffnessFront) this.corneringStiffnessFront = p.corneringStiffnessFront;
        if (p.corneringStiffnessRear) this.corneringStiffnessRear = p.corneringStiffnessRear;
        if (p.tireGripLimit) this.tireGripLimit = p.tireGripLimit;
        if (p.drivetrain) this.drivetrain = p.drivetrain;
        this.torqueSplitFront = (p.torqueSplitFront !== undefined) ? p.torqueSplitFront : (this.drivetrain === '4WD' ? 0.38 : 0);
        this.hasMisfiringSystem = !!p.hasMisfiringSystem;
        this.isDokkanTurbo = !!p.isDokkanTurbo;
        if (p.gearRatios) this.gearRatios = [...p.gearRatios];
        if (p.finalDrive) this.finalDrive = p.finalDrive;
        if (p.wheelCircumference) this.wheelCircumference = p.wheelCircumference;
        if (p.gearAccelMap) this.gearAccelMap = [...p.gearAccelMap];
        if (p.maxRpm) this.maxRpm = p.maxRpm;
        if (p.idleRpm) this.idleRpm = p.idleRpm;
        if (p.redlineRpm) this.redlineRpm = p.redlineRpm;
        if (p.maxSpeed) this.maxSpeed = p.maxSpeed;
        if (p.engineResponse) this.engineResponse = p.engineResponse;

        this.rpm = this.idleRpm;
    }

    resetToTrack(progressT, lateralOffset = 0) {
        this.trackT = progressT;
        const point = this.track.getPointAt(progressT);
        const tangent = this.track.curve.getTangentAt(progressT).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        this.position.copy(point).add(normal.clone().multiplyScalar(lateralOffset));
        this.position.y = point.y + 0.01;
        this.yaw = Math.atan2(tangent.x, tangent.z);
        this.yawRate = 0;
        this.pitch = -Math.asin(tangent.y);
        this.roll = 0;

        this.velocity.set(0, 0, 0);
        this.speed = 0;
        this.speedMs = 0;
        this.gear = 1;
        this.rpm = this.idleRpm;
        this.isDrifting = false;
        this.driftAngle = 0;
        this.isGutterRun = false;
        this.gutterRoll = 0;
        this.gutterDropY = 0;
        this.gravelIntensity = 0;
        this.gravelWheelSide = 0;
        this.downshiftBrakeTimer = 0;
        this.shiftTimer = 0;
        this.shiftBuffer = null;
        this.shiftBufferTimer = 0;
        this.isRevLimiterCut = false;
        this.steerAngle = 0;
        this.wasLocked = false;
        this.clutchSlip = 0;
        this.launchRpm = this.idleRpm;
        this.launchBoostTimer = 0;
        this.oilPressure = 200;
        this.waterTemp = 86.0;
        this.oilTemp = 90.0;
        this.manifoldPressure = -70;
        this.prevThrottle = 0;
        this.afterfireCooldown = 0;
        this.revLimiterPopTimer = 0;
    }

    setCornerAssist(mode) {
        if (mode === 'strong' || mode === 'weak') {
            this.cornerAssistMode = mode;
        }
    }

    update(dt, input) {
        if (dt > 0.1) dt = 0.1;

        // カウントダウン中ロック
        if (this.isLocked) {
            this.wasLocked = true;
            this.velocity.set(0, 0, 0);
            this.speed = 0;
            this.speedMs = 0;
            this.yawRate = 0;
            this.steerAngle = 0;

            const curThrottle = (input ? (input.throttle || 0) : 0);
            if (this.afterfireCooldown > 0) this.afterfireCooldown -= dt;

            // カウントダウン中の空ぶかしアクセルオフでもアフターファイヤ！
            if (this.prevThrottle > 0.45 && curThrottle < 0.20 && this.rpm > 5200 && this.afterfireCooldown <= 0) {
                this.afterfireCooldown = 0.35;
                if (this.onAfterfire) this.onAfterfire(0.85);
            }
            this.prevThrottle = curThrottle;

            const maxR = this.maxRpm || 10000;
            const revRate = maxR * 1.30;
            if (curThrottle > 0) {
                this.rpm += revRate * curThrottle * dt;
            } else {
                this.rpm -= maxR * 0.85 * dt;
            }
            const revThreshold = (this.redlineRpm || 9100);
            if (this.rpm >= revThreshold && curThrottle > 0.4) {
                this.isRevLimiterCut = true;
                const bounceHz = (this.carId === 'fd3s') ? 24 : ((this.carId === 'bnr32' || this.carId === 'jzx100') ? 18 : 21);
                const bouncePhase = (Date.now() * 0.001 * bounceHz) % 1.0;
                const bounceDip = (bouncePhase < 0.45) ? (bouncePhase / 0.45) * 190 : (1.0 - (bouncePhase - 0.45) / 0.55) * 190;
                this.rpm = Math.min(this.maxRpm, revThreshold - bounceDip);

                this.revLimiterPopTimer -= dt;
                if (this.revLimiterPopTimer <= 0) {
                    this.revLimiterPopTimer = 0.055 + Math.random() * 0.035;
                    if (this.onAfterfire) this.onAfterfire(0.70 + Math.random() * 0.35);
                }
            } else {
                this.isRevLimiterCut = false;
                this.revLimiterPopTimer = 0.06;
            }
            if (this.rpm > this.maxRpm) this.rpm = this.maxRpm;
            if (this.rpm < this.idleRpm) this.rpm = this.idleRpm;
            return;
        }

        // カウントダウン終了（スタート）の瞬間を検知：高回転ロケットスタート発動！
        if (this.wasLocked && !this.isLocked) {
            this.wasLocked = false;
            if (this.rpm > 2800) {
                this.launchRpm = this.rpm;
                this.clutchSlip = 1.0;
                this.launchBoostTimer = 1.2;
                if (this.onRocketStart && this.rpm > 5000) {
                    this.onRocketStart(this.rpm);
                }
            }
        }

        if (this.launchBoostTimer > 0) {
            this.launchBoostTimer -= dt;
        }

        this.steerInput = input.steer || 0;
        this.throttle = input.throttle || 0;
        this.brake = input.brake || 0;
        this.handbrake = input.handbrake || false;

        // ★急激なアクセル全閉（高回転オーバーラン・未燃焼ガスのアフターファイヤ）検知
        if (this.afterfireCooldown > 0) this.afterfireCooldown -= dt;
        const throttleDropped = (this.prevThrottle > 0.45 && this.throttle < 0.20);
        if (throttleDropped && this.rpm > 4600 && this.afterfireCooldown <= 0) {
            this.afterfireCooldown = this.hasMisfiringSystem ? 0.12 : 0.35;
            const intensity = 0.75 + Math.min(0.5, (this.rpm - 4600) / 5000 * 0.5);
            if (this.onAfterfire) this.onAfterfire(intensity);
        }

        // ★ミスファイアリングシステム（アンチラグ・2ステップ）作動：
        // エボIIIはアクセルオフかつ高回転減速中に連続してパンパンと未燃焼ガスを排気管内で爆発！
        if (this.hasMisfiringSystem && this.throttle < 0.18 && this.rpm > 3500 && this.speed > 25) {
            if (this.misfirePopTimer > 0) {
                this.misfirePopTimer -= dt;
            } else {
                this.misfirePopTimer = 0.12 + Math.random() * 0.08;
                if (this.onAfterfire) this.onAfterfire(0.85 + Math.random() * 0.4);
            }
        } else {
            this.misfirePopTimer = 0.06;
        }
        this.prevThrottle = this.throttle;

        this.handleGears(dt, input);

        // 1. 速度感応ステアリング（Speed-Sensitive Steering）
        this.updateSteering(dt);

        // 2. フェイント検知
        this.detectFeint(dt);

        // 3. リアル二輪モデル物理（荷重移動・コーナリングフォース・ヨー慣性）
        this.updateRealisticPhysics(dt);

        // 4. コリジョン＆溝落とし
        this.checkCollisions(dt);

        // 5. エンジンRPM更新
        this.updateEngineRpm(dt);

        // 6. 走り屋追加メーター（油圧・水温・油温・インマニ圧）更新
        this.updateSubGauges(dt);
    }

    /**
     * 走り屋追加メーター物理シミュレーション：
     * 油圧、水温、油温、インマニ圧を実車チューニングカー同様に連動
     */
    updateSubGauges(dt) {
        // 油圧 (Oil Pressure)：クランク回転数（オイルポンプ）とスロットル開度に俊敏に連動
        const targetOilPress = 180 + (this.rpm / 11000) * 460 + this.throttle * 50;
        this.oilPressure += (targetOilPress - this.oilPressure) * Math.min(1.0, 18.0 * dt);

        // インマニ圧 (Manifold Vacuum / Boost)：スロットル操作に即応（アクセル全開で0kPa、全閉で負圧-75kPa）
        const targetManifold = -75 * (1.0 - Math.pow(this.throttle, 0.75)) + (this.rpm / 11000) * 4;
        this.manifoldPressure += (targetManifold - this.manifoldPressure) * Math.min(1.0, 26.0 * dt);

        // 水温 (Water Temp)：高回転・全開負荷でジワリと熱を持ち、車速（ラジエーター風）で冷却
        const load = (this.rpm / 8500) * (0.3 + 0.7 * this.throttle);
        const cooling = (this.speed / 130) * 0.9 + 0.15;
        const targetWater = 86 + load * 18 - cooling * 6;
        this.waterTemp += (targetWater - this.waterTemp) * Math.min(1.0, 0.4 * dt);

        // 油温 (Oil Temp)：高回転持続・ドリフト走行でじわじわ上昇
        const targetOil = 90 + load * 28 - cooling * 5;
        this.oilTemp += (targetOil - this.oilTemp) * Math.min(1.0, 0.2 * dt);
    }

    handleGears(dt, input) {
        if (this.shiftTimer > 0) this.shiftTimer -= dt;
        if (this.downshiftBrakeTimer > 0) this.downshiftBrakeTimer -= dt;

        // MT先行入力バッファリング（0.25秒間保持して確実な変速を保証）
        if (input.shiftUp) {
            this.shiftBuffer = 'up';
            this.shiftBufferTimer = 0.25;
        } else if (input.shiftDown) {
            this.shiftBuffer = 'down';
            this.shiftBufferTimer = 0.25;
        }

        if (this.shiftBufferTimer > 0) {
            this.shiftBufferTimer -= dt;
            if (this.shiftBufferTimer <= 0) {
                this.shiftBuffer = null;
            }
        }

        const redline = this.redlineRpm || 8500;

        if (this.isAutomatic) {
            this.shiftBuffer = null;
            this.shiftBufferTimer = 0;
            // 各車種のトルクバンドピーク (redline * 0.90) で気持ちよく高回転まで引っ張ってシフトアップ！
            const upShiftRpm = redline * 0.90;
            // 速度とギア比に応じた適正シフトダウン回転数（不要なキックダウンのハンチングを防止）
            const downShiftRpm = Math.max(this.idleRpm + 400, redline * 0.35);

            if (this.rpm > upShiftRpm && this.gear < 5 && this.shiftTimer <= 0) {
                const prevGear = this.gear;
                this.gear++;
                this.shiftTimer = 0.20;
                this.downshiftBrakeTimer = 0; // シフトアップ時はエンブレタイマーを即解除
                this.isRevLimiterCut = false; // ★レブカット状態を即座に完全解除！

                // シフトアップ時のRPMドロップ（実車同様に次ギアの回転数へ素早くマッチング）
                const newGearRatio = this.gearRatios[this.gear];
                const wheelCircum = this.wheelCircumference || 1.95;
                const targetUpRpm = Math.max(this.idleRpm, (this.speedMs / wheelCircum) * newGearRatio * this.finalDrive * 60);
                this.rpm = Math.min(this.rpm, targetUpRpm + 80);

                if (this.onAfterfire && this.rpm > redline * 0.65) {
                    this.onAfterfire(1.05);
                }
                if (this.onShift) this.onShift('up', prevGear, this.gear);
            } else if (this.rpm < downShiftRpm && this.gear > 1 && this.shiftTimer <= 0) {
                const prevGear = this.gear;
                this.gear--;
                this.shiftTimer = 0.20;
                this.downshiftBrakeTimer = 0.5; // シフトダウンによるバックトルク
                this.isRevLimiterCut = false; // ★レブカット状態を即座に完全解除！

                // シフトダウン時のブリッピング・回転数跳ね上がり
                const newGearRatio = this.gearRatios[this.gear];
                const wheelCircum = this.wheelCircumference || 1.95;
                const targetDownRpm = (this.speedMs / wheelCircum) * newGearRatio * this.finalDrive * 60;
                this.rpm = Math.max(this.rpm, Math.min(this.maxRpm - 150, targetDownRpm));

                if (this.onShift) this.onShift('down', prevGear, this.gear);
            }
        } else {
            // MTモード：完全手動シフトチェンジ（先行入力対応）
            const wantShiftUp = (this.shiftBuffer === 'up') || input.shiftUp;
            const wantShiftDown = (this.shiftBuffer === 'down') || input.shiftDown;

            if (wantShiftUp && this.gear < 5 && this.shiftTimer <= 0) {
                const prevGear = this.gear;
                this.gear++;
                this.shiftTimer = 0.16; // キビキビとした軽快なシフトフィーリング
                this.shiftBuffer = null;
                this.shiftBufferTimer = 0;
                this.downshiftBrakeTimer = 0; // シフトアップ時はバックトルクタイマーを即解除して加速最優先！
                this.isRevLimiterCut = false; // ★レブカット状態を即座に完全解除！

                // シフトアップ時のRPMドロップ（実車同様に次ギアの回転数へ素早くマッチング）
                const newGearRatio = this.gearRatios[this.gear];
                const wheelCircum = this.wheelCircumference || 1.95;
                const targetUpRpm = Math.max(this.idleRpm, (this.speedMs / wheelCircum) * newGearRatio * this.finalDrive * 60);
                this.rpm = Math.min(this.rpm, targetUpRpm + 80);

                if (this.rpm > redline * 0.65) {
                    const intensity = 0.80 + Math.min(0.55, (this.rpm - redline * 0.65) / (redline * 0.35) * 0.55);
                    if (this.onAfterfire) this.onAfterfire(intensity);
                }
                if (this.onShift) this.onShift('up', prevGear, this.gear);
            } else if (wantShiftDown && this.gear > 1 && this.shiftTimer <= 0) {
                const prevGear = this.gear;
                this.gear--;
                this.shiftTimer = 0.16;
                this.shiftBuffer = null;
                this.shiftBufferTimer = 0;
                this.downshiftBrakeTimer = 0.7; // シフトダウン直後の強烈なバックトルクサージ
                this.isRevLimiterCut = false; // ★レブカット状態を即座に完全解除！

                // シフトダウン時のリアルなRPM吹き上がり（タコメーター瞬間跳ね上がり）
                const newGearRatio = this.gearRatios[this.gear];
                const wheelCircum = this.wheelCircumference || 1.95;
                const targetDownRpm = (this.speedMs / wheelCircum) * newGearRatio * this.finalDrive * 60;
                this.rpm = Math.max(this.rpm, Math.min(this.maxRpm - 150, targetDownRpm));

                if (this.rpm > redline * 0.60 || targetDownRpm > redline * 0.65) {
                    if (this.onAfterfire) this.onAfterfire(0.85);
                }

                if (this.speed > 30 && Math.abs(this.steerAngle) > 0.07) {
                    this.triggerDrift('SHIFT_DOWN');
                }
                if (this.onShift) this.onShift('down', prevGear, this.gear);
            }
        }
    }

    /**
     * 速度感応ステアリング：
     * 高速域での直進安定性を保ちつつ、峠のコーナー（60〜100km/h）でもしっかりと曲がれる十分な舵角を確保
     */
    updateSteering(dt) {
        // 低速〜中速(〜45km/h): 最大約31度(0.54rad)
        // 中高速(80km/h): 約27度(0.47rad)
        // 超高速(140km/h以上): 約21度(0.37rad)
        const speedKmh = this.speed;
        let speedFactor = 1.0;
        if (speedKmh > 45) {
            speedFactor = Math.max(0.68, 1.0 - (speedKmh - 45) / 300);
        }

        const maxSteerRad = 0.54 * speedFactor;
        const isSteeringIntoDrift = this.isDrifting && (Math.abs(this.driftAngle) > 0.25) && (this.steerInput * Math.sign(this.driftAngle) > 0.05);
        const steerLimit = isSteeringIntoDrift ? 0.72 : 1.0;
        const targetSteer = this.steerInput * maxSteerRad * steerLimit;

        // ハンドルの切り込みレスポンス（ドリフト維持・切り込み・カウンターの手応えを保ちつつ、キー解放時は素早くニュートラルに戻す）
        const steerSpeed = (this.isDrifting && Math.abs(this.steerInput) > 0.05) ? 8.5 : 16.0;
        this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1.0, steerSpeed * dt);
    }

    detectFeint(dt) {
        const currentDir = Math.sign(this.steerInput);
        if (currentDir !== 0 && currentDir !== this.lastSteerDir && this.lastSteerDir !== 0) {
            if (this.feintTimer < 0.45 && this.speed > 50) {
                this.triggerDrift('FEINT');
            }
            this.feintTimer = 0;
            this.lastSteerDir = currentDir;
        } else if (currentDir !== 0) {
            this.lastSteerDir = currentDir;
            this.feintTimer += dt;
        } else {
            this.feintTimer += dt;
        }
    }

    setWeather(weather) {
        this.weather = weather || 'dry';
        if (this.weather === 'rain') {
            this.surfaceGripFactor = 0.72; // ウェット路面：横G限界約28%低下、豪快な滑走
        } else if (this.weather === 'fog') {
            this.surfaceGripFactor = 0.92; // 濃霧：路面やや湿潤
        } else {
            this.surfaceGripFactor = 1.00; // ドライ
        }
    }

    triggerDrift(type) {
        const minDriftSpeed = (this.weather === 'rain') ? 22 : 35;
        if (!this.isDrifting && this.speed > minDriftSpeed) {
            this.isDrifting = true;
            this.driftType = type;
            this.driftTimer = 0;
            if (this.onDriftStart) this.onDriftStart(type);
        }
    }

    /**
     * 現実味のある二輪モデル物理（Bicycle Model with Inertia & Weight Transfer）
     */
    updateRealisticPhysics(dt) {
        const trackInfo = this.track.getSmoothTrackInfo(this.position, this.trackT);
        this.trackT = trackInfo.t;
        this.trackInfo = trackInfo;
        const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
        const right = new THREE.Vector3(forward.z, 0, -forward.x);

        // 車体ローカル速度成分
        const vLong = this.velocity.dot(forward); // 前後速度
        const vLat = this.velocity.dot(right);    // 横滑り速度

        // 1. 動的前後荷重移動 (Dynamic Longitudinal Weight Transfer)
        // 加速時はリア荷重（スクワット）、減速・ブレーキ時はフロント荷重（ノーズダイブ）
        const g = 9.81;
        const totalWeight = this.mass * g;
        // ブレーキや駆動力による前後加速度推定
        const longAcc = this.accelZ;
        const heightCg = 0.48; // 重心高 (m)
        const deltaWeight = (this.mass * longAcc * heightCg) / this.wheelbase;

        let weightFront = (totalWeight * this.weightFrontStatic) - deltaWeight;
        let weightRear = (totalWeight * (1.0 - this.weightFrontStatic)) + deltaWeight;
        weightFront = Math.max(totalWeight * 0.2, Math.min(totalWeight * 0.8, weightFront));
        weightRear = totalWeight - weightFront;

        // 2. スリップ角の計算 (Tire Slip Angles)
        let alphaFront = 0;
        let alphaRear = 0;
        const absVLong = Math.max(1.5, Math.abs(vLong));

        // 前輪スリップ角: 進行角度 - ステアリング角
        alphaFront = Math.atan2(vLat + this.cgToFront * this.yawRate, absVLong) + this.steerAngle;
        // 後輪スリップ角
        alphaRear = Math.atan2(vLat - this.cgToRear * this.yawRate, absVLong);

        // 3. ドリフトトリガー判定（サイドブレーキ、ブレーキドリフト、フェイント）
        const minTriggerSpeed = (this.weather === 'rain') ? 18 : 28;
        if (!this.isDrifting && this.speed > minTriggerSpeed) {
            if (this.handbrake && Math.abs(this.steerAngle) > 0.05) {
                // サイドブレーキによる意図的なテールスライド
                this.triggerDrift('HANDBRAKE');
            } else if (this.brake > 0.12 && Math.abs(this.steerAngle) > 0.07) {
                // ★ブレーキドリフト：ブレーキングによる前荷重移動とリアスライド開始
                this.triggerDrift('BRAKE');
            }
        }

        // 4. タイヤコーナリングフォース (Tire Lateral Forces - 天候＆路肩砂利グリップ連動)
        const gravelPenalty = 1.0 - (this.gravelIntensity || 0) * 0.14;
        const muGrip = this.tireGripLimit * (this.surfaceGripFactor || 1.0) * gravelPenalty;
        const isStrongAssist = (this.cornerAssistMode === 'strong');
        let maxForceFront = (isStrongAssist ? muGrip * 1.35 : muGrip) * weightFront;
        let maxForceRear = muGrip * weightRear;

        // ★直進制動時のスタビリティ（直線ブレーキング時のスピン防止。旋回時やドリフト時は自然な荷重移動・回頭性を許容）
        if (this.brake > 0.1 && !this.handbrake && !this.isDrifting && Math.abs(this.steerAngle) < 0.06) {
            maxForceRear = Math.max(maxForceRear, muGrip * totalWeight * 0.42);
        }

        // ドリフト中はリアがスライド摩擦（約70%）に移行。前輪もアングルに応じて適度に滑らせて過剰な自励巻き込みトルクを緩和
        if (this.isDrifting) {
            this.driftTimer += dt;
            maxForceRear *= 0.68;
            if (this.handbrake) maxForceRear *= 0.35;
            const driftBalance = Math.min(1.0, Math.abs(this.driftAngle) / 0.55);
            maxForceFront *= (1.0 - 0.30 * driftBalance);
        }

        // 非線形タイヤ力（飽和関数）
        let forceYFront = -this.corneringStiffnessFront * alphaFront;
        forceYFront = Math.max(-maxForceFront, Math.min(maxForceFront, forceYFront));

        let forceYRear = -this.corneringStiffnessRear * alphaRear;
        forceYRear = Math.max(-maxForceRear, Math.min(maxForceRear, forceYRear));

        // 5. ヨーモーメント＆ヨー角加速度 (Yaw Dynamics with Inertia)
        let yawTorque = (forceYFront * Math.cos(this.steerAngle) * this.cgToFront) - (forceYRear * this.cgToRear);

        // 強アシスト（strong）：ステアリング操舵時にノーズがスッとインへ切り込むクイックピボットトルク
        if (isStrongAssist && Math.abs(this.steerAngle) > 0.02 && this.speed > 12) {
            const steerSign = Math.sign(this.steerAngle);
            const entryYawTorque = -steerSign * (2800 + Math.min(2600, this.speed * 35));
            yawTorque += entryYawTorque;
        }

        // FF（前輪駆動）特有の旋回ダイナミクス：
        // ① パワーオン・アンダーステア（前輪が駆動と操舵を両方担うため、アクセル全開旋回で外に膨らむ）
        // ② アクセルオフ・「タックイン」（アクセルを抜くと前輪に荷重が乗り、鋭くイン側に頭が入る）
        if (this.drivetrain === 'FF') {
            if (this.throttle > 0.35) {
                yawTorque *= 0.86; // パワーオン時のアンダーステア
            } else if (this.throttle < 0.15 && Math.abs(this.steerAngle) > 0.03 && this.speed > 30) {
                // タックイン効果：旋回内側へのヨーモーメント補助
                const tuckInSign = Math.sign(this.steerAngle);
                yawTorque += tuckInSign * (950 + Math.abs(this.yawRate) * 450);
            }
        }

        // ヨーダンピング（直進急制動時は強力に直進安定、ステア入力時やドリフト旋回時は素直な回頭性を確保）
        const isStraightBraking = (this.brake > 0.1 && Math.abs(this.steerInput) < 0.08 && !this.isDrifting);
        const brakeDamping = isStraightBraking ? 2600 : 1500;
        yawTorque -= this.yawRate * brakeDamping;

        // =========================================================================
        // ★頭文字D式 曲率適応型スピン防止＆ヘアピン回頭ダイナミクス
        // いろは坂などの急激なU字ヘアピンでは旋回アングルを動的に拡大・回頭ピボットをアシストし、
        // 直線・高速コーナーではスピンを完全遮断して絶対に180°反転・タコツボ化させない
        // =========================================================================
        let curDriftAngle = 0;
        let velHeading = this.yaw;
        if (this.speedMs > 1.5) {
            const velNorm = this.velocity.clone().normalize();
            velHeading = Math.atan2(velNorm.x, velNorm.z);
            curDriftAngle = velHeading - this.yaw;
            while (curDriftAngle > Math.PI) curDriftAngle -= Math.PI * 2;
            while (curDriftAngle < -Math.PI) curDriftAngle += Math.PI * 2;
        }
        this.driftAngle = curDriftAngle;
        const absAngle = Math.abs(curDriftAngle);
        const driftSign = (curDriftAngle >= 0 ? 1 : -1);

        // コーナー情報（曲率・旋回方向）の取得
        const curvature = (trackInfo && trackInfo.curvature) ? trackInfo.curvature : 0;
        const turnDir = (trackInfo && trackInfo.turnDir) ? trackInfo.turnDir : 0;
        // プレイヤーがコーナーのイン側（旋回方向）へステアリングを切っているか
        const isSteeringIntoCorner = (turnDir !== 0 && (this.steerInput * turnDir > 0));

        // ヘアピン・急カーブ適応ファクター（曲率 0.005〜0.035 に応じて0.0〜1.0）
        const curveFactor = Math.min(1.0, Math.max(0, (curvature - 0.005) / 0.030));

        // 動的ドリフト許容角：直線では約56° (0.98 rad)、いろは坂ヘアピンでは最大約86° (1.50 rad) まで拡大
        const maxDriftRad = 0.98 + (curveFactor * 0.52);
        // 復元力開始しきい値：直線では約42° (0.73 rad)、ヘアピンでは約68° (1.18 rad)
        const restoreThreshold = 0.73 + (curveFactor * 0.45);
        // 絶対ハードクランプ角：直線では約60° (1.05 rad)、ヘアピンでは約92° (1.60 rad)
        const hardClampRad = 1.05 + (curveFactor * 0.55);

        if (this.isDrifting) {
            // 1. カウンターステア効果（過度に軽すぎず、タイヤの粘り・しっかりした手応えと重みを持たせる）
            const latSign = (vLat >= 0 ? 1 : -1);
            const counterSteer = -this.steerInput * latSign;
            if (counterSteer > 0.05) {
                // アシストトルクを過剰な4800から適度な2600に調整し、入力深度に応じたプログレッシブ付与
                const counterPower = 2000 + counterSteer * 700;
                yawTorque -= this.steerInput * counterPower;
                // カウンター時のタイヤ接地抵抗・ジャイロダンピング（軽すぎるフリップ現象を防ぎ、重厚な手応えを付与）
                yawTorque -= this.yawRate * (counterSteer * 1800);
            }

            // 2. ★ヘアピン旋回ピボットアシスト（いろは坂等のきついU字カーブ進入でインへ鋭く頭を入れる）
            // ＆ 切り増し（チョン押し）時のリニア角度制御（急激な巻き込みを防ぎ、穏やかで高精度なアングル微調整を実現）
            const isSteeringIntoDrift = (absAngle > 0.25) && (this.steerInput * driftSign > 0.05);
            if (isSteeringIntoDrift) {
                // ドリフト確立中の切り増し（チョン押し）：過剰なピボットトルクをカットし、ダンピングを効かせてわずかな角度増加に抑える
                const inSteerTorque = -this.steerInput * (1200 + curveFactor * 1000);
                yawTorque += inSteerTorque;
                yawTorque -= this.yawRate * (Math.abs(this.steerInput) * 2200);
            } else if (isSteeringIntoCorner && curvature > 0.008) {
                // コーナー進入時およびヘアピン回頭アシスト
                const hairpinTorque = -this.steerInput * (2400 + curveFactor * 4800);
                yawTorque += hairpinTorque;
            }

            // 3. 段階的プログレッシブ復元モーメント（適応しきい値を超えた過大スライドを進行方向へ優しく戻す）
            if (absAngle > restoreThreshold) {
                const overAngleExcess = absAngle - restoreThreshold;
                yawTorque += driftSign * overAngleExcess * 12000;
                yawTorque -= this.yawRate * (overAngleExcess * 3600);
            }

            // 4. アクセルON時の回頭ピボット推進（適正ドリフト角内でコーナー出口へ爽快に頭を向ける。切り増し中は除外して過剰な巻き込みを防ぐ）
            if (this.throttle > 0.08 && absAngle < (restoreThreshold + 0.15) && !isSteeringIntoDrift) {
                const turnSign = (this.steerInput !== 0) ? -Math.sign(this.steerInput) : driftSign;
                const isStrong = (this.cornerAssistMode === 'strong');
                const basePivot = isStrong ? 5200 : 1800;
                const curveBonus = isStrong ? (curveFactor * 2800) : (curveFactor * 1600);
                const pivotAssist = (this.speed < 50) ? (basePivot + 1200 + curveBonus) : (basePivot + curveBonus);
                yawTorque += turnSign * this.throttle * pivotAssist;
            }

            // ドリフト終了判定
            if (absAngle < 0.10 && Math.abs(this.steerInput) < 0.15 && this.driftTimer > 0.3) {
                this.isDrifting = false;
                if (this.onDriftEnd) this.onDriftEnd(this.driftScore);
                this.driftScore = 0;
            } else if (this.speed < 12 && this.throttle < 0.10) {
                this.isDrifting = false;
                if (this.onDriftEnd) this.onDriftEnd(this.driftScore);
                this.driftScore = 0;
            } else {
                this.driftScore += dt * (Math.abs(vLat) * 28 + this.speed * 0.4);
            }
        } else {
            // 非ドリフト時でも急激なスピン挙動（過大アングル）を未然に防止
            const nonDriftLimit = 0.65 + curveFactor * 0.35;
            if (absAngle > nonDriftLimit) {
                const excess = absAngle - nonDriftLimit;
                yawTorque += driftSign * excess * 12000;
                yawTorque -= this.yawRate * 2500;
            }
        }

        // 角加速度 = トルク / 慣性モーメント
        const yawAcc = yawTorque / this.inertiaZ;
        this.yawRate += yawAcc * dt;

        // 5. ★ダイナミック・ヨーレートクランプ（適応限界到達時にスピン方向の角速度をカット）
        if (absAngle >= maxDriftRad && this.speedMs > 2.0) {
            // イン側へ積極的に切り込んでいる最中でなければ、これ以上外へ流れるスピン角速度を遮断
            if (!isSteeringIntoCorner || absAngle >= (maxDriftRad + 0.10)) {
                if (driftSign > 0 && this.yawRate < 0) {
                    this.yawRate = 0;
                } else if (driftSign < 0 && this.yawRate > 0) {
                    this.yawRate = 0;
                }
            }
        }

        // ヨー角の更新
        this.yaw += this.yawRate * dt;

        // 6. ★絶対フェイルセーフ・ハードクランプ（コース逆走・180°反転スピン100%遮断）
        if (this.speedMs > 2.0) {
            let testDrift = velHeading - this.yaw;
            while (testDrift > Math.PI) testDrift -= Math.PI * 2;
            while (testDrift < -Math.PI) testDrift += Math.PI * 2;

            if (Math.abs(testDrift) > hardClampRad) {
                const clampSign = Math.sign(testDrift) || 1;
                this.yaw = velHeading - (clampSign * hardClampRad);
                this.yawRate = 0;
            }
        }

        // 6. 前後駆動力・制動力 (実車エンジントルク特性＆回転数連動物理)
        // ※人工的なギア最高速度壁は撤廃。実車同様に回転数（RPM）に応じたトルクバンドと内部フリクションで自然に制御
        let engineForce = 0;
        if (this.throttle > 0 && this.gear > 0) {
            // 各車種のギア別基底加速力マップ
            const accelMap = this.gearAccelMap || [0, 5.4, 4.0, 2.9, 1.9, 1.3];
            const baseAccel = accelMap[this.gear] || 1.9;

            // 各車のレッドライン比率に基づくリアルな動的トルクバンドカーブ
            // 低回転: アイドリング付近でもエンストせず粘り強く立ち上がり
            // パワーバンド(0.35〜0.88): 最大トルクゾーン（最も力強く加速し爽快感MAX）
            // 高回転(0.88〜1.00): パワーバンドを抜けトルクが穏やかに落ち着く
            // 限界域(1.00〜1.10): 回転数は上がるがトルクが低下、速度の伸びが鈍化してリミッター域へ
            const redline = this.redlineRpm || 8500;
            const normRpm = this.rpm / redline;

            let torqueFactor = 0.70;
            if (this.isDokkanTurbo) {
                // 初代アルトワークス伝説の「ドッカンターボ」カーブ！
                // 4,200rpm以下（normRpm < 0.44）: 550cc NA並みの穏やかなトルク
                // 4,500rpm以上（normRpm >= 0.47）: RHB31小型タービンが過給圧1.0barへ一気に過給、爆発的なロケットサージ！
                if (normRpm < 0.35) {
                    torqueFactor = 0.45 + 0.10 * (normRpm / 0.35);
                } else if (normRpm < 0.47) {
                    const t = (normRpm - 0.35) / 0.12;
                    torqueFactor = 0.55 + 0.40 * (t * t); // タービンスプール過渡期
                } else if (normRpm <= 0.88) {
                    // ドッカン過給全開ゾーン！
                    const mid = (normRpm - 0.47) / 0.41;
                    torqueFactor = 1.36 + 0.08 * Math.sin(mid * Math.PI);
                } else if (normRpm <= 1.05) {
                    const t = (normRpm - 0.88) / 0.17;
                    torqueFactor = 1.36 - 0.55 * Math.pow(t, 1.2);
                } else {
                    const t = Math.min(1.0, (normRpm - 1.05) / 0.15);
                    torqueFactor = Math.max(0.20, 0.70 * (1.0 - t));
                }
            } else {
                if (normRpm < 0.15) {
                    torqueFactor = 0.70;
                } else if (normRpm < 0.38) {
                    const t = (normRpm - 0.15) / 0.23;
                    torqueFactor = 0.70 + 0.28 * t;
                } else if (normRpm <= 0.88) {
                    // パワーバンド中央で最大トルク
                    const mid = (normRpm - 0.38) / 0.50;
                    torqueFactor = 0.98 + 0.08 * Math.sin(mid * Math.PI);
                } else if (normRpm <= 1.05) {
                    // レッドゾーン突入時：トルクが緩やかに落ち着くがゼロにはならない
                    const t = (normRpm - 0.88) / 0.17;
                    torqueFactor = 1.02 - 0.40 * Math.pow(t, 1.2);
                } else {
                    // レブ頭打ち域
                    const t = Math.min(1.0, (normRpm - 1.05) / 0.15);
                    torqueFactor = Math.max(0.20, 0.62 * (1.0 - t));
                }
            }

            engineForce = baseAccel * torqueFactor * this.throttle;

            // レブリミッター作動時は推進力を滑らかに制御（急減速によるバウンス・息継ぎ振動を排除）
            if (this.isRevLimiterCut) {
                engineForce *= 0.82;
            }

            // ★スタート前高回転クラッチミート（ロケットスタート）ブースト
            if (this.launchBoostTimer > 0 && this.gear === 1 && this.speed < 45) {
                const launchRatio = Math.min(1.0, Math.max(0, (this.launchRpm - 3000) / 4500));
                const launchBoost = 1.8 * launchRatio * (this.launchBoostTimer / 1.2) * this.throttle;
                engineForce += launchBoost;
            }

            if (this.speed > this.maxSpeed) engineForce = 0;
        }

        let brakeForce = 0;
        if (this.brake > 0) {
            // ★ブレーキ制動力：スポーツ走行にふさわしい確実で力強いブレーキ（22.0 -> 25.0 m/s²）
            const baseBrakePower = 25.0;

            // アクセルオン時でもブレーキがしっかり効くように（左足ブレーキ・進入姿勢調整の応答性を向上）
            let throttleMitigation = 1.0;
            if (this.throttle > 0.08) {
                // ドリフト中・グリップ中ともにアクセルを開けていてもブレーキがしっかり効く比率を確保
                if (this.isDrifting) {
                    throttleMitigation = Math.max(0.50, 1.0 - this.throttle * 0.50);
                } else {
                    throttleMitigation = Math.max(0.44, 1.0 - this.throttle * 0.56);
                }
            }

            brakeForce += baseBrakePower * this.brake * throttleMitigation;
        }
        if (this.handbrake) {
            // サイドブレーキ：アクセルOFF時はしっかり減速・テールスライド（12.0 m/s²）、アクセルON時やドリフト中でも適度に制動（4.8 m/s²）
            const hbDecel = (this.throttle > 0.08) ? 4.8 : 12.0;
            brakeForce += hbDecel;
        }

        // 速度更新：エンジン駆動力 (FR vs 4WD ATTESA vs ラリー4WD vs FF)
        const curForwardAcc = engineForce;

        // ★ドリフト時の駆動力ベクトル適応：適度な推進力を供給（真横失速を防ぎつつ、後ろ向きスピン時の爆走を防止）
        let driveDir = forward.clone();
        if (this.isDrifting && this.speedMs > 1.5) {
            const velNorm = this.velocity.clone().normalize();
            const headingAlign = forward.dot(velNorm);
            // 正常なドリフト中、進行方向へトラクションをブレンド
            // ★急コーナー・ヘアピンでは車体ノーズ方向（forward）への直結度を高め、外壁への膨らみを防いで出口へ力強く脱出！
            if (headingAlign >= -0.20) {
                const cornerSharpness = Math.min(1.0, Math.max(0, (((trackInfo && trackInfo.curvature) || 0) - 0.005) / 0.025));
                const maxBlend = 0.50 * (1.0 - cornerSharpness * 0.85); // ヘアピンではブレンドを7.5%に抑え、92.5%ノーズ方向推進
                const blend = Math.min(maxBlend, Math.abs(this.driftAngle) * 0.40);
                driveDir.lerp(velNorm, blend).normalize();
            }
        }
        if (this.drivetrain === '4WD') {
            const frontRatio = this.torqueSplitFront || 0.38;
            const rearRatio = 1.0 - frontRatio;
            const frontSteerVec = driveDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.steerAngle * 0.42);
            this.velocity.add(driveDir.clone().multiplyScalar(curForwardAcc * rearRatio * dt));
            this.velocity.add(frontSteerVec.multiplyScalar(curForwardAcc * frontRatio * dt));
        } else if (this.drivetrain === 'FF') {
            const frontSteerVec = driveDir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.steerAngle * 0.82);
            this.velocity.add(frontSteerVec.multiplyScalar(curForwardAcc * dt));
        } else {
            this.velocity.add(driveDir.clone().multiplyScalar(curForwardAcc * dt));
        }

        // 下り坂重力加速（機械損失や接地抵抗を考慮した自然でリアルな重力アシスト）
        const slopeTangent = trackInfo.tangent;
        const downhillAcc = -slopeTangent.y * 9.8 * 0.40;
        this.velocity.add(forward.clone().multiplyScalar(downhillAcc * dt));

        // 空気抵抗 (Air Drag) & 転がり抵抗 (速度の2乗に比例し高速域で自然に伸びが落ち着く)
        const airDragAcc = 0.00040 * (this.speedMs * this.speedMs);
        const rollingResistAcc = 0.12;
        const totalResistance = (airDragAcc + rollingResistAcc);
        if (this.speedMs > 0.1) {
            this.velocity.sub(forward.clone().multiplyScalar(totalResistance * dt));
        }

        // ★実車エンジンブレーキ＆高回転バックトルク物理（現実の峠走行・頭文字Dの挙動を忠実再現）
        // 「アクセルOFF・シフトダウン時に強烈なバックトルクとポンピングロスが働き、確実な減速と前荷重移動（ノーズダイブ）を生む」
        this.engineBrakeForce = 0;
        if (this.gear > 0 && this.speedMs > 1.0) {
            // 各ギアに応じた実車スポーツカー準拠のバックトルク制動力 (低速ギアほど強烈に減速)
            const baseGearBrake = [0, 5.2, 4.0, 2.8, 1.9, 1.3][this.gear] || 1.8;

            // アクセル開度に応じたポンピングロスの自然な推移 (アクセル全閉で100%作動、開度に応じてリニアにフェード)
            const throttleBrakeFade = Math.max(0.0, 1.0 - (this.throttle / 0.22));

            if (throttleBrakeFade > 0) {
                // ① シフトダウン直後のクラッチ衝撃・バックトルクサージ (約0.7秒間持続)
                let downshiftSurge = 0;
                if (this.downshiftBrakeTimer > 0) {
                    const surgeRatio = this.downshiftBrakeTimer / 0.7;
                    downshiftSurge = baseGearBrake * 1.30 * surgeRatio;
                }

                // ② 高回転バックトルク減速 (レッドライン付近の強大な吸気抵抗・ポンピングロス)
                let highRpmBrake = 0;
                const redline = this.redlineRpm || 8500;
                const backThreshold = redline * 0.50; // 50%以上の回転域で顕著に立ち上がり
                if (this.rpm > backThreshold) {
                    const backRatio = (this.rpm - backThreshold) / (redline * 0.50);
                    highRpmBrake = baseGearBrake * Math.pow(Math.max(0, backRatio), 1.25) * 1.20;
                }

                // ③ 通常のアクセルオフ巡航減速
                const rpmRatio = Math.max(0.0, Math.min(1.0, (this.rpm - this.idleRpm) / (this.maxRpm - this.idleRpm)));
                const rpmFactor = 0.40 + 0.85 * (rpmRatio * rpmRatio);
                const steadyBrake = baseGearBrake * rpmFactor;

                // 総合エンジンブレーキ力（シフトダウン衝撃、高回転バックトルク、通常アクセルオフの最大効果）
                const rawEngineBrake = Math.max(downshiftSurge, highRpmBrake, steadyBrake);
                this.engineBrakeForce = rawEngineBrake * throttleBrakeFade;
            } else {
                this.downshiftBrakeTimer = 0;
            }
        }

        // 制動力（フットブレーキ + サイドブレーキ + エンジンブレーキ）
        const totalBraking = brakeForce + this.engineBrakeForce;
        if (totalBraking > 0) {
            if (this.isDrifting && this.speedMs > 1.0) {
                // ★ドリフト中のブレーキ改善：車体ノーズ方向だけでなく、進行方向（速度ベクトル）に対しても確実にブレーキを効かせる
                // （大アングルドリフト時でもブレーキを踏めば確実に減速・コントロール可能）
                const velNorm = this.velocity.clone().normalize();
                const brakeDir = forward.clone().lerp(velNorm, 0.75).normalize();
                const curBrakeSpeed = this.velocity.dot(brakeDir);
                if (curBrakeSpeed > 0.05) {
                    const decel = Math.min(curBrakeSpeed, totalBraking * dt);
                    this.velocity.sub(brakeDir.multiplyScalar(decel));
                }
            } else {
                const curLongSpeed = this.velocity.dot(forward);
                if (Math.abs(curLongSpeed) > 0.05) {
                    const decel = Math.min(Math.abs(curLongSpeed), totalBraking * dt);
                    this.velocity.sub(forward.clone().multiplyScalar(Math.sign(curLongSpeed) * decel));
                }
            }
        }

        // タイヤ横力による速度ベクトルの変化
        const totalLateralForce = forceYFront * Math.cos(this.steerAngle) + forceYRear;
        const latAcc = (totalLateralForce / this.mass);
        const latVec = right.clone().multiplyScalar(latAcc * dt);

        if (this.isDrifting && this.speedMs > 2.0) {
            const velNorm = this.velocity.clone().normalize();
            // 進行方向に逆行するブレーキ成分（drag）と、曲げる旋回成分（turn）を分解
            const dragProj = latVec.dot(velNorm); // 進行方向への投影（負なら減速ドラッグ）
            if (dragProj < 0) {
                // アクセルON時や低速時は、真横スライドによる強烈な減速アンカー効果を大幅緩和
                // （車速が落ち切って20km/h以下で固まる現象を根本防止）
                let mitigation = 0.70;
                if (this.brake > 0.08 || this.handbrake) {
                    // ★プレイヤーがブレーキを踏んでいる時は、タイヤ横滑り抵抗も減速力としてしっかり発揮
                    mitigation = 0.95;
                } else if (this.throttle > 0.08) {
                    // 低速（45km/h以下）ではドラッグを85%カット（mitigation = 0.15）して失速を徹底阻止
                    mitigation = (this.speed < 45) ? 0.15 : 0.32;
                }
                const turnVec = latVec.clone().sub(velNorm.clone().multiplyScalar(dragProj));
                const attenuatedDragVec = velNorm.clone().multiplyScalar(dragProj * mitigation);
                this.velocity.add(turnVec.add(attenuatedDragVec));
            } else {
                this.velocity.add(latVec);
            }
        } else {
            this.velocity.add(latVec);
        }

        // コーナリング抵抗（旋回時のタイヤスリップによる自然な減速抵抗）
        let scrubAcc = Math.min(2.0, Math.abs(latAcc) * 0.12);
        if (this.isDrifting && this.throttle > 0.12) {
            scrubAcc *= (this.weather === 'rain' ? 0.20 : 0.35); // ドリフト中の適度なタイヤ横滑り抵抗（ウェット時は滑走慣性維持）
        }
        if (this.speedMs > 1.5) {
            this.velocity.sub(forward.clone().multiplyScalar(scrubAcc * dt));
        }

        // ★ドリフト時のアクセル推進力制御（真横での20km/h以下失速を防止し、過大加速や後ろ向き爆走を遮断）
        if (this.isDrifting) {
            if (this.throttle > 0.08) {
                const velNormPush = this.speedMs > 1.0 ? this.velocity.clone().normalize() : forward.clone();
                const headingAlign = forward.dot(velNormPush);
                // 後ろ向きスピン（headingAlign < -0.20）でない正常なドリフト旋回時
                if (headingAlign >= -0.20) {
                    // ① 回頭ノーズプッシュ（コーナー出口へノーズを誘導）
                    const nosePush = 1.0 * this.throttle;
                    this.velocity.add(forward.clone().multiplyScalar(nosePush * dt));

                    // ② 低速域（42km/h以下）での失速・完全停止防止アシスト
                    // ※高速域（42km/h以上）では0になり過大加速を完全防止。
                    // 低速ヘアピンで真横になっても20km/h以下に落ち込まず力強く立ち上がる
                    if (this.speed < 42) {
                        const lowSpeedFactor = (42 - this.speed) / 42;
                        const antiStallPush = 2.4 * lowSpeedFactor * this.throttle;
                        this.velocity.add(velNormPush.multiplyScalar(antiStallPush * dt));
                    }
                }
            } else {
                // アクセルオフ時：タイヤ滑り摩擦による自然な減速（ノーズがイン側へ切れ込む）
                const slipIntensity = Math.min(1.0, Math.abs(this.driftAngle) * 1.4);
                // 車速が25km/h以下の極低速では減速を穏やかにして完全停止スタックを防止
                const lowSpeedDamp = Math.min(1.0, Math.max(0.2, this.speed / 25));
                const scrubDecel = slipIntensity * 1.5 * lowSpeedDamp;
                if (this.speedMs > 2.0) {
                    this.velocity.sub(forward.clone().multiplyScalar(scrubDecel * dt));
                }
            }
        }

        // ★ヘアピンでの20km/h以下失速・タコツボ化を完全根絶するアンチストール推進
        if (this.isDrifting) {
            if (this.throttle > 0.08) {
                // ① 低速ヘアピン（55km/h以下）での力強い立ち上がり推進
                // ヘアピンで真横に近くなっても20km/h以下に落ち込まず、45〜60km/hの軽快な速度で一気にコーナーをクリア！
                if (this.speed < 55) {
                    const lowSpeedFactor = (55 - this.speed) / 55;
                    const antiStallPush = 3.6 * lowSpeedFactor * this.throttle;
                    this.velocity.add(driveDir.clone().multiplyScalar(antiStallPush * dt));
                }
                // ② コーナー出口方向（ノーズ）への牽引アシスト
                const nosePush = 1.0 * this.throttle;
                this.velocity.add(forward.clone().multiplyScalar(nosePush * dt));
            }
        }

        // =========================================================================
        // ★アーケード型 軌道旋回アシスト（向心力＆トラクションベクタリング）
        // 弱（weak）: 現在の穏やかなコーナーアシスト（急ヘアピン＆ドリフト時限定）
        // 強（strong）: 面白いほど曲がる強力なアシスト（広域発動・強力向心力・高速トラクション誘導）
        // =========================================================================
        if (this.enableHairpinArcadeAssist && trackInfo && trackInfo.turnDir !== 0) {
            const isStrong = (this.cornerAssistMode === 'strong');
            const minCurv = isStrong ? 0.0035 : 0.012;
            const curvScale = isStrong ? 0.016 : 0.024;
            const isTurning = this.isDrifting || (isStrong && Math.abs(this.steerAngle) > 0.04);

            if (isTurning && trackInfo.curvature > minCurv) {
                const curveSharpness = Math.min(1.0, Math.max(0, (trackInfo.curvature - minCurv) / curvScale));

                // ① 向心力アシスト（Centripetal Trajectory Assist）
                const innerDir = trackInfo.normal.clone().multiplyScalar(trackInfo.turnDir);
                innerDir.y = 0;
                if (innerDir.lengthSq() > 0.01) {
                    innerDir.normalize();
                    const innerDist = trackInfo.offset * trackInfo.turnDir;
                    // イン側路肩にすでに寄っている場合の減衰（強モード時はより内側インベタを深く攻められる設定）
                    const innerDamp = isStrong
                        ? Math.max(0.35, 1.0 - Math.max(0, (innerDist - 0.4) / 2.6))
                        : Math.max(0.20, 1.0 - Math.max(0, (innerDist - 0.9) / 2.2));

                    const baseInwardAcc = isStrong
                        ? (4.8 + Math.min(4.5, this.speedMs * 0.18)) * innerDamp
                        : (1.35 + Math.min(1.35, this.speedMs * 0.08)) * innerDamp;

                    const throttleFactor = isStrong
                        ? (this.throttle > 0.05 ? 1.15 : 0.90)
                        : (this.throttle > 0.10 ? 1.0 : 0.65);

                    const centripetalAcc = curveSharpness * baseInwardAcc * throttleFactor;
                    this.velocity.add(innerDir.multiplyScalar(centripetalAcc * dt));
                }

                // ② 出口方向へのトラクション誘導（速度ベクトル誘導）
                if (this.speedMs > 2.0 && (this.throttle > 0.05 || isStrong)) {
                    const exitBlend = isStrong ? 0.52 : 0.18;
                    const targetExitDir = forward.clone().lerp(trackInfo.tangent, exitBlend);
                    targetExitDir.y = 0;
                    if (targetExitDir.lengthSq() > 0.01) {
                        targetExitDir.normalize();
                        const curSpeed = this.velocity.length();
                        const curVelDir = this.velocity.clone().divideScalar(curSpeed);
                        const blendRate = isStrong
                            ? (2.8 * curveSharpness * (0.5 + this.throttle * 0.7))
                            : (0.68 * curveSharpness * this.throttle);
                        const maxStep = isStrong ? 0.16 : 0.06;
                        const newVelDir = curVelDir.lerp(targetExitDir, Math.min(maxStep, blendRate * dt)).normalize();
                        this.velocity = newVelDir.multiplyScalar(curSpeed);
                    }
                }
            }
        }

        // 加速度の記録（次フレームの荷重移動計算用：エンブレも前後荷重移動・ノーズダイブに反映！）
        this.accelX = latAcc;
        const curTotalBraking = brakeForce + this.engineBrakeForce;
        this.accelZ = curForwardAcc - curTotalBraking;

        // 速度の算出
        this.speedMs = this.velocity.length();
        this.speed = this.speedMs * 3.6;

        // スリップ角
        if (this.speedMs > 2.0) {
            const velNorm = this.velocity.clone().normalize();
            this.driftAngle = Math.atan2(velNorm.x, velNorm.z) - this.yaw;
            while (this.driftAngle > Math.PI) this.driftAngle -= Math.PI * 2;
            while (this.driftAngle < -Math.PI) this.driftAngle += Math.PI * 2;
        } else {
            this.driftAngle = 0;
        }

        // 位置の更新
        this.position.add(this.velocity.clone().multiplyScalar(dt));

        // サスペンションダンパーによる追従（路面完全接地＆立体カント傾斜追従＆溝落とし沈み込み）
        const bankOffsetY = Math.sin(trackInfo.bankAngle || 0) * trackInfo.offset;
        const targetGroundY = trackInfo.centerPos.y + bankOffsetY + 0.01 + (this.gutterDropY || 0);
        const deltaGroundY = targetGroundY - this.position.y;
        this.position.y += Math.max(-2.5, Math.min(2.5, deltaGroundY * Math.min(1.0, 24.0 * dt)));

        // 勾配ピッチ角の滑らか反映
        const targetPitch = -Math.asin(Math.max(-0.99, Math.min(0.99, trackInfo.tangent.y)));
        this.pitch += (targetPitch - this.pitch) * Math.min(1.0, 16.0 * dt);
    }

    checkCollisions(dt) {
        const trackInfo = this.track.getSmoothTrackInfo(this.position, this.trackT);
        this.trackT = trackInfo.t;
        const halfRoad = this.track.roadWidth / 2;
        const offset = trackInfo.offset;

        this.isCollidingWall = false;

        // 1. 旋回方向とイン側の特定（左旋回: +1, 右旋回: -1）
        // ★完全インコース限定：直線や緩やかな繋ぎ区間はイン・アウトが存在しないため除外
        const isCorner = Math.abs(trackInfo.curvature) > 0.0022 && trackInfo.turnDir !== 0;
        const innerSide = isCorner ? trackInfo.turnDir : 0;

        // 車両中心および内輪のイン側オフセット計算（イン側へ向かう方向を正とする）
        const innerOffset = isCorner ? (offset * innerSide) : 0;
        const treadHalf = 0.72; // 車輪トレッド半幅 (m)
        const innerTireOffset = innerOffset + treadHalf;

        // 2. ★頭文字D象徴「溝落とし（Gutter Run）」完全再現物理
        // 条件：
        // ① 側溝設置区間（hasGutter）
        // ② カーブ旋回中（isCorner）
        // ③ 内側車輪が道路端（halfRoad）を超えて側溝（幅0.65m）に落ちている
        // ④ 車体全体がガードレールを突き破っていない（外輪は道路面〜縁石上）
        // ⑤ 一定以上の進入速度・維持速度
        const canGutter = trackInfo.hasGutter && isCorner;
        const qualifies = canGutter && (
            (!this.isGutterRun && innerTireOffset >= halfRoad - 0.10 && innerOffset <= halfRoad + 0.38 && this.speed > 18) ||
            (this.isGutterRun && innerTireOffset >= halfRoad - 0.30 && innerOffset <= halfRoad + 0.48 && this.speed > 10)
        );

        if (qualifies) {
            if (!this.isGutterRun) {
                this.isGutterRun = true;
                this.gutterTimer = 0;
                if (this.onGutterDrop) this.onGutterDrop();
                if (this.onGutterRun) this.onGutterRun(true);
            }
            this.gutterTimer += dt;

            // ① 車体姿勢変化（インサイドロール ＆ サスペンション沈み込み）
            // 内輪が側溝（深さ22cm）に落ちるため、車体が内側にガクンと傾斜し車高全体が沈み込む
            const targetRoll = innerSide * 0.12; // 約6.8度のインサイドロール
            const targetDropY = -0.075;          // 約7.5cmの沈み込み
            this.gutterRoll += (targetRoll - this.gutterRoll) * Math.min(1.0, 16.0 * dt);
            this.gutterDropY += (targetDropY - this.gutterDropY) * Math.min(1.0, 18.0 * dt);

            // ② レール拘束力（Centrifugal Slide Absorption / 遠心力横滑り速度の側溝壁吸収）
            // 側溝の垂直内壁がタイヤをガッチリ受け止めるため、外側へ膨らもうとする横滑り速度を強力に吸収！
            const outwardVel = this.velocity.dot(trackInfo.normal) * (-innerSide);
            if (outwardVel > 0) {
                // 外向き速度成分を毎フレーム88%吸収・相殺
                this.velocity.sub(trackInfo.normal.clone().multiplyScalar(-innerSide * outwardVel * Math.min(1.0, 18.0 * dt)));
            }

            // ③ 側溝レールガイダンス（溝底中心へ安定引き込み）
            const targetInOffset = halfRoad - 0.40;
            const offsetDiff = targetInOffset - innerOffset;
            const railGuideForce = Math.max(-0.55, Math.min(0.55, offsetDiff * 4.2));
            this.position.add(trackInfo.normal.clone().multiplyScalar(innerSide * railGuideForce * dt));

            // ④ クリッピングポイントへのインベタ回頭トルク（Inward Yaw Torque）
            // 内輪が溝に引っかかることで発生するイン向きの強烈な回頭性モーメント
            const curveSharpness = Math.min(1.0, Math.max(0, (trackInfo.curvature - 0.002) / 0.015));
            const gutterYawTorque = innerSide * (1.15 + curveSharpness * 2.2);
            this.yawRate += gutterYawTorque * dt;

            // ⑤ 遠心力ロスゼロによる強烈な立ち上がり加速ブースト（Traction Boost）
            // 横滑りパワーロスがゼロになり、全駆動力が前進方向へ集中
            if (this.brake < 0.2) {
                const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
                const boost = (this.throttle > 0 ? (4.8 * Math.max(0.65, this.throttle)) : 2.4);
                this.velocity.add(forward.multiplyScalar(boost * dt));
            }
        } else {
            if (this.isGutterRun) {
                this.isGutterRun = false;
                if (this.onGutterExit) this.onGutterExit();
                if (this.onGutterRun) this.onGutterRun(false);
            }
            // 溝脱出時は姿勢を素早く水平に戻す
            this.gutterRoll += (0 - this.gutterRoll) * Math.min(1.0, 14.0 * dt);
            this.gutterDropY += (0 - this.gutterDropY) * Math.min(1.0, 14.0 * dt);
        }

        // 3. ガードレール・壁衝突判定
        const wallSide = Math.sign(offset) || 1;
        const isInnerWall = isCorner && (wallSide === innerSide);
        const isGutterInnerWall = isInnerWall && trackInfo.hasGutter;

        // ★側溝区間のイン側はガードレールが側溝外側（halfRoad + 0.65m）にあるため許容マージンを広く設定！
        const maxOffset = isGutterInnerWall ? (halfRoad + 0.48) : (isInnerWall ? (halfRoad + 0.15) : (halfRoad - 0.20));

        if (Math.abs(offset) > maxOffset) {
            const penetration = Math.abs(offset) - maxOffset;
            const safePenetration = Math.min(penetration, 0.75);

            if (isInnerWall) {
                // コーナーイン側の壁／縁石接触：減速や引っ付きを起こさず、スムーズに路面内へ滑らかに逃がす
                this.position.add(trackInfo.normal.clone().multiplyScalar(-wallSide * (safePenetration + 0.04)));
                const wallNormal = trackInfo.normal.clone().multiplyScalar(-wallSide);
                const vDotN = this.velocity.dot(wallNormal);
                if (vDotN < 0) {
                    this.velocity.sub(wallNormal.clone().multiplyScalar(1.10 * vDotN));
                }

                // スムーズなウォールスライド（壁に張り付いて動けなくなるのを防止）
                this.velocity.multiplyScalar(0.999);
                this.yawRate *= 0.95;

                this.wallHitIntensity = Math.min(1.0, this.speed / 80);
                if (this.onWallHit) this.onWallHit(this.wallHitIntensity);
            } else {
                // 通常のガードレール・外側壁衝突：ガードレール突き破りを100%遮断して確実に路面内へ押し戻す
                this.isCollidingWall = true;
                this.wallHitIntensity = Math.min(1.0, this.speed / 75);

                // 壁の外側へ飛び出さないよう路面内へ確実に押し戻す（安全マージン+0.06m）
                this.position.add(trackInfo.normal.clone().multiplyScalar(-wallSide * (safePenetration + 0.06)));

                const wallNormal = trackInfo.normal.clone().multiplyScalar(-wallSide);
                const vDotN = this.velocity.dot(wallNormal);
                if (vDotN < 0) {
                    // 外向きの速度成分を完全消去し、路面側へ確実にはね返す
                    this.velocity.sub(wallNormal.clone().multiplyScalar(1.15 * vDotN));
                }

                // スムーズなウォールスライド（壁に沿って適度に減衰しつつ滑走、引っかかり停止を防止）
                this.velocity.multiplyScalar(0.995);
                this.yawRate *= 0.90;

                // ガードレール接触の火花エフェクト＆衝突音を発生
                if (this.onWallHit) this.onWallHit(this.wallHitIntensity);
            }
        }

        // 4. ★絶対フェイルセーフ：ガードレール突き破り完全防止ハードクランプ
        // 側溝区間のイン側は側溝内走行（halfRoad + 0.52m）まで許容、それ以外はhalfRoad境界で完全遮断
        const currentClampLimit = (wallSide === innerSide && trackInfo.hasGutter) ? (halfRoad + 0.52) : (halfRoad - 0.10);
        const currentOffset = trackInfo.normal.dot(this.position.clone().sub(trackInfo.centerPos));
        if (Math.abs(currentOffset) > currentClampLimit) {
            const side = Math.sign(currentOffset) || 1;
            const excess = Math.abs(currentOffset) - currentClampLimit;
            // 瞬間移動（テレポート）の完全防止：1フレームでの補正量を最大0.75mに安全制限
            const safeExcess = Math.min(excess, 0.75);
            this.position.add(trackInfo.normal.clone().multiplyScalar(-side * safeExcess));
            // 法線方向速度の漏れを完全リセット
            const vOutward = this.velocity.dot(trackInfo.normal) * side;
            if (vOutward > 0) {
                this.velocity.sub(trackInfo.normal.clone().multiplyScalar(side * vOutward * 1.10));
            }
        }

        // 5. ★峠道あるある：路肩・白線外側未舗装砂利帯（Gravel / Dirt Shoulder）判定
        // 車両のタイヤが白線の外側（未舗装の土・砂利帯：halfRoad - 0.75m 以遠）を踏んでいるかを検知
        const whiteLineLimit = halfRoad - 0.75;
        const currentCheckOffset = trackInfo.normal.dot(this.position.clone().sub(trackInfo.centerPos));
        const leftDist = Math.abs(currentCheckOffset - treadHalf);
        const rightDist = Math.abs(currentCheckOffset + treadHalf);
        const maxTireDist = Math.max(leftDist, rightDist);

        if (maxTireDist > whiteLineLimit && !this.isGutterRun) {
            const penetration = maxTireDist - whiteLineLimit;
            this.gravelIntensity = Math.min(1.0, Math.max(0, penetration / 0.60));
            this.gravelWheelSide = (rightDist > leftDist) ? 1 : -1;
        } else {
            this.gravelIntensity = 0;
            this.gravelWheelSide = 0;
        }
    }

    updateEngineRpm(dt) {
        const redline = this.redlineRpm || 8500;
        const maxR = this.maxRpm || 10000;

        if (this.gear === 0) {
            // ニュートラル／カウントダウン空ぶかし
            const revRate = maxR * 1.30;
            if (this.throttle > 0) {
                this.rpm += revRate * this.throttle * dt;
            } else {
                this.rpm -= maxR * 0.80 * dt;
            }
        } else {
            const gearRatio = this.gearRatios[this.gear];
            const wheelCircumference = this.wheelCircumference || 1.95;
            const wheelRps = (this.speedMs) / wheelCircumference;
            const driveRpm = wheelRps * gearRatio * this.finalDrive * 60;

            // スロットルオン時の駆動スリップ・トルクコンプライアンス（各車のレッドラインに応じた自然な針の跳ね上がり）
            const throttleSlip = this.throttle * (redline * 0.045 / Math.sqrt(this.gear));

            // ★ドリフト中のリアルなホイールスピン回転数（アクセルを踏むと一気にパワーバンド〜レッドゾーンへ跳ね上がる！）
            let driftWheelspinRpm = 0;
            if (this.isDrifting && this.throttle > 0.05) {
                // 車輪空転により、アクセル開度に応じてレッドラインの62%〜97%までダイナミックに跳ね上がり、タコメーターが吼える！
                const powerbandRpm = redline * (0.62 + this.throttle * 0.35);
                driftWheelspinRpm = Math.max(driveRpm, powerbandRpm);
            }

            const directRpm = Math.max(this.idleRpm, driveRpm + throttleSlip, driftWheelspinRpm);
            let desiredRpm = directRpm;

            // ★発進時のクラッチスリップ＆高回転ロケットスタート物理
            // 「スタート前に上げた回転数がスタートした瞬間にゼロ（アイドリング）に落ちてしまうのを解消しつつ、
            // ハチロク以外の車でもレッドゾーンへ唐突に突き抜けることなく、自然で力強い吹け上がりを実現！」
            if (this.gear === 1 && (this.clutchSlip > 0 || (this.speedMs < 6.5 && this.rpm > directRpm + 300))) {
                if (this.throttle > 0.2) {
                    // 各マシンのレッドラインに応じた自然で迫力あるクラッチミート回転数（約50%〜64%）
                    const baseHold = redline * (0.38 + this.throttle * 0.26);
                    const holdRpm = Math.max(baseHold, this.launchRpm * 0.92);
                    const slipRpm = Math.max(directRpm, Math.min(this.maxRpm - 400, holdRpm));

                    // 車両が加速して車輪回転 (directRpm) が追いついたらクラッチ完全締結
                    if (directRpm >= slipRpm - 200) {
                        this.clutchSlip = 0;
                    } else {
                        this.clutchSlip = Math.max(0, this.clutchSlip - dt * 0.5);
                    }
                    desiredRpm = Math.max(directRpm, slipRpm);
                } else {
                    // アクセルを離した場合はクラッチ負荷でスムーズに directRpm へ収束
                    this.clutchSlip = Math.max(0, this.clutchSlip - dt * 2.0);
                    desiredRpm = directRpm;
                }
            } else {
                this.clutchSlip = 0;
            }

            // ★レブリミッター演出：各マシンのレッドゾーン以上で間欠カット＆火花バウンス
            const revThreshold = (this.redlineRpm || 9100);

            // ★重要：物理回転 (directRpm) がレブ閾値を下回っている、またはスロットルを緩めた場合は即座にレブカット解除！
            // シフトアップ直後や車速変化時にレブカット状態がデッドロックして加速不能になる現象を完全に防止
            if (directRpm < revThreshold - 150 || this.throttle <= 0.4) {
                this.isRevLimiterCut = false;
            } else if (this.rpm >= revThreshold && this.throttle > 0.5) {
                this.isRevLimiterCut = true;
            }

            if (this.isRevLimiterCut) {
                // 車種別のレブ打ち点火カット周波数 (AE86: 21Hz, FD3S: 24Hz, GT-R/JZX: 18Hz, EK9: 22Hz)
                const bounceHz = (this.carId === 'fd3s') ? 24 : ((this.carId === 'bnr32' || this.carId === 'jzx100') ? 18 : 21);
                // 周期パルス（点火遮断の瞬間急降下し、即座に跳ね上がる高速ノコギリ／パルス波）
                const bouncePhase = (Date.now() * 0.001 * bounceHz) % 1.0;
                const bounceDip = (bouncePhase < 0.45) ? (bouncePhase / 0.45) * 190 : (1.0 - (bouncePhase - 0.45) / 0.55) * 190;
                desiredRpm = Math.min(this.maxRpm, revThreshold - bounceDip);

                this.revLimiterPopTimer -= dt;
                if (this.revLimiterPopTimer <= 0) {
                    this.revLimiterPopTimer = 0.055 + Math.random() * 0.035; // 毎秒約14〜18回の連続排気破裂！
                    if (this.onAfterfire) this.onAfterfire(0.70 + Math.random() * 0.35);
                }
            } else {
                this.revLimiterPopTimer = 0.06;
            }

            // 車種固有のエンジンフライホイール慣性レスポンス
            const baseResponse = this.engineResponse || 22.0;
            const responseUp = (this.isDrifting && this.throttle > 0.08) ? 34.0 : baseResponse;
            const rpmResponse = this.isRevLimiterCut ? 48.0 : ((desiredRpm > this.rpm) ? responseUp : 22.0);
            this.rpm += (desiredRpm - this.rpm) * Math.min(1.0, rpmResponse * dt);
        }

        if (this.rpm > this.maxRpm) this.rpm = this.maxRpm;
        if (this.rpm < this.idleRpm) this.rpm = this.idleRpm;
    }
}

window.CarPhysics = CarPhysics;
