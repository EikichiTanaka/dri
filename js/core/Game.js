/**
 * Game.js - メインゲームループ・カメラ・レース進行管理
 * コース切り替え対応、カウントダウン完全ロック、ガタつきのないカメラ追従
 */

class Game {
    constructor() {
        this.container = document.getElementById('canvas-container');

        this.state = 'TITLE';
        this.countdownTimer = 0;
        this.countdownStep = 3;
        this.currentCourse = 'akina';

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();

        this.cameraMode = 0;
        this.cameraTargetPos = new THREE.Vector3();
        this.cameraLookTarget = new THREE.Vector3();
        this.cameraShakeTimer = 0;
        this.cameraShakeIntensity = 0;

        this.track = null;
        this.playerPhysics = null;
        this.playerCar = null;
        this.rivalCar = null;
        this.particles = null;
        this.input = null;
        this.audio = null;
        this.hud = null;
        this.playerTireBurnTimer = 0;

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x05070a);
        this.scene.fog = new THREE.FogExp2(0x05070a, 0.005);

        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 1800);
        this.camera.position.set(0, 5, -10);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        if (this.container) {
            this.container.appendChild(this.renderer.domElement);
        }

        this.hemiLight = new THREE.HemisphereLight(0x334466, 0x111622, 0.6);
        this.scene.add(this.hemiLight);

        this.dirLight = new THREE.DirectionalLight(0xaaccff, 0.85);
        this.dirLight.position.set(120, 220, 120);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 10;
        this.dirLight.shadow.camera.far = 450;
        this.dirLight.shadow.camera.left = -120;
        this.dirLight.shadow.camera.right = 120;
        this.dirLight.shadow.camera.top = 120;
        this.dirLight.shadow.camera.bottom = -120;
        this.scene.add(this.dirLight);

        this.track = new TougeTrack(this.scene, this.currentCourse);
        this.playerPhysics = new CarPhysics(this.track, true);
        this.playerCar = new PlayerCar(this.scene, this.playerPhysics, 'ae86');
        this.rivalCar = new RivalCar(this.scene, this.track, this.playerPhysics);
        this.particles = new ParticleSystem(this.scene);
        this.input = new InputManager();
        this.audio = new AudioManager();
        this.audio.init();
        this.hud = new HUD(this.track, this.playerPhysics, this.rivalCar, this.audio);
        this.garageUI = new GarageUI(this);

        this.selectedCarId = 'ae86';
        this.selectedColorIndex = 0;
        this.cornerAssistMode = 'weak';

        // ★天候（DRY / RAIN / FOG）＆時間帯（MIDNIGHT / SUNSET / DAYLIGHT）
        this.currentWeather = 'dry';
        this.currentTimeOfDay = 'midnight';
        this.applyEnvironment();

        this.setupCallbacks();

        window.addEventListener('resize', () => this.onResize());

        this.animate();
    }

    applyPlayerCar(carId, colorIndex = 0) {
        this.selectedCarId = carId;
        this.selectedColorIndex = colorIndex;

        const carData = window.CAR_DATABASE ? window.CAR_DATABASE[carId] : null;
        if (carData) {
            this.playerPhysics.applyCarProfile(carData);
            this.playerCar.setCar(carId, colorIndex);
            if (this.audio) {
                this.audio.setEngineSoundType(carData.physics.engineSoundType);
            }
        }
    }

    enterGarageMode() {
        this.prevState = this.state;
        this.state = 'GARAGE';
        if (this.playerCar && this.playerCar.meshGroup) {
            this.playerCar.meshGroup.visible = true;
        }
        this.playerPhysics.velocity.set(0, 0, 0);
        this.playerPhysics.speed = 0;
        this.playerPhysics.speedMs = 0;
        this.playerPhysics.yawRate = 0;
        this.playerPhysics.steerAngle = 0;
    }

    exitGarageMode() {
        this.state = this.prevState || 'WAITING';
        this.playerPhysics.resetToTrack(0.003, -1.8);
    }

    setCourse(courseType) {
        this.currentCourse = courseType;
        this.track.setCourse(courseType);
        this.applyEnvironment();
        this.playerPhysics.resetToTrack(0.003, -1.8);
        this.rivalCar.resetPosition();
        if (this.particles && this.particles.clearSkidMarks) {
            this.particles.clearSkidMarks();
        }
        this.hud.setTrack(this.track);
    }

    setWeather(weather) {
        this.currentWeather = weather || 'dry';
        this.applyEnvironment();
    }

    setTimeOfDay(timeOfDay) {
        this.currentTimeOfDay = timeOfDay || 'midnight';
        this.applyEnvironment();
    }

    applyEnvironment() {
        const time = this.currentTimeOfDay || 'midnight';
        const weather = this.currentWeather || 'dry';

        // 1. 時間帯 × 天候別の環境設定（空、フォグ、環境光、太陽/月光）
        let bgColor, fogColor, fogNear, fogFar;
        let hemiSky, hemiGround, hemiIntensity;
        let dirColor, dirIntensity, dirPos;

        if (weather === 'fog') {
            // ★【濃霧モード (FOG) - 一寸先が見えない本物の山岳ホワイトミスト】
            // 霧の水滴による光の乱反射・散乱を再現し、視界を厳格に制限
            if (time === 'sunset') {
                bgColor = new THREE.Color(0x4a2c3a);
                fogColor = new THREE.Color(0x5e3a4c);
                fogNear = 6.0;
                fogFar = 48.0;
                hemiSky = new THREE.Color(0xbb7766);
                hemiGround = new THREE.Color(0x35202a);
                hemiIntensity = 0.65;
                dirColor = new THREE.Color(0xd06030);
                dirIntensity = 0.55;
                dirPos = new THREE.Vector3(250, 70, -180);
            } else if (time === 'daylight') {
                bgColor = new THREE.Color(0xb0bec8);
                fogColor = new THREE.Color(0xc5d0dc);
                fogNear = 8.0;
                fogFar = 52.0;
                hemiSky = new THREE.Color(0xccd8e4);
                hemiGround = new THREE.Color(0x606870);
                hemiIntensity = 0.75;
                dirColor = new THREE.Color(0xffeedd);
                dirIntensity = 0.50;
                dirPos = new THREE.Vector3(90, 260, 90);
            } else {
                // 深夜の濃霧：真っ黒な闇ではなく、ヘッドライトで乳白色に照らし出される濃厚な夜霧
                bgColor = new THREE.Color(0x242e3b);
                fogColor = new THREE.Color(0x384758);
                fogNear = 6.0;
                fogFar = 46.0;
                hemiSky = new THREE.Color(0x50657c);
                hemiGround = new THREE.Color(0x18202a);
                hemiIntensity = 0.55;
                dirColor = new THREE.Color(0x88aacc);
                dirIntensity = 0.40;
                dirPos = new THREE.Vector3(120, 220, 120);
            }
        } else if (time === 'sunset') {
            // 【夕暮れ / トワイライト - 茜色に染まる秋名】
            bgColor = new THREE.Color(0x381420);
            fogColor = new THREE.Color(0x401624);
            fogNear = (weather === 'rain') ? 22.0 : 65.0;
            fogFar = (weather === 'rain') ? 135.0 : 380.0;
            hemiSky = new THREE.Color(0xff8855);
            hemiGround = new THREE.Color(0x281622);
            hemiIntensity = 0.85;
            dirColor = new THREE.Color(0xff7030); // 低い角度の夕日
            dirIntensity = 1.20;
            dirPos = new THREE.Vector3(250, 70, -180);
        } else if (time === 'daylight') {
            // 【昼 / 薄曇り - ピュアな山岳ワインディング】
            bgColor = new THREE.Color(0x607286);
            fogColor = new THREE.Color(0x607286);
            fogNear = (weather === 'rain') ? 25.0 : 70.0;
            fogFar = (weather === 'rain') ? 140.0 : 420.0;
            hemiSky = new THREE.Color(0x99bbdd);
            hemiGround = new THREE.Color(0x384438);
            hemiIntensity = 0.95;
            dirColor = new THREE.Color(0xfff8ee);
            dirIntensity = 1.35;
            dirPos = new THREE.Vector3(90, 260, 90);
        } else {
            // 【深夜 / 闇夜 - 頭文字D 王道ナイトバトル】
            bgColor = new THREE.Color(0x05070a);
            fogColor = new THREE.Color(0x05070a);
            fogNear = (weather === 'rain') ? 20.0 : 60.0;
            fogFar = (weather === 'rain') ? 130.0 : 360.0;
            hemiSky = new THREE.Color(0x334466);
            hemiGround = new THREE.Color(0x111622);
            hemiIntensity = 0.60;
            dirColor = new THREE.Color(0xaaccff); // 月明かり
            dirIntensity = 0.85;
            dirPos = new THREE.Vector3(120, 220, 120);
        }

        // 雨天時の空のトーン調整（雨雲が空を覆う）
        if (weather === 'rain') {
            if (time === 'sunset') {
                bgColor.lerp(new THREE.Color(0x1d141e), 0.55);
                fogColor.lerp(new THREE.Color(0x1d141e), 0.55);
            } else if (time === 'daylight') {
                bgColor.lerp(new THREE.Color(0x384452), 0.50);
                fogColor.lerp(new THREE.Color(0x384452), 0.50);
            } else {
                bgColor.lerp(new THREE.Color(0x020306), 0.40);
                fogColor.lerp(new THREE.Color(0x020306), 0.40);
            }
            dirIntensity *= 0.65; // 雨雲による減光
        }

        // シーン環境の適用
        if (this.scene) {
            this.scene.background = bgColor;
            this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);
        }

        if (this.hemiLight) {
            this.hemiLight.color.copy(hemiSky);
            this.hemiLight.groundColor.copy(hemiGround);
            this.hemiLight.intensity = hemiIntensity;
        }
        if (this.dirLight) {
            this.dirLight.color.copy(dirColor);
            this.dirLight.intensity = dirIntensity;
            this.dirLight.position.copy(dirPos);
        }

        // トラック・路面への天候適用
        if (this.track && this.track.setWeather) {
            this.track.setWeather(weather);
        }

        // 物理エンジンへの天候適用（ウェット路面μ係数・ドリフト閾値）
        if (this.playerPhysics && this.playerPhysics.setWeather) {
            this.playerPhysics.setWeather(weather);
        }

        // ライバルAIへの天候適用
        if (this.rivalCar && this.rivalCar.setWeather) {
            this.rivalCar.setWeather(weather);
        }

        // パーティクルシステムへの天候適用（雨粒3Dパーティクル）
        if (this.particles && this.particles.setWeather) {
            this.particles.setWeather(weather);
        }

        // サウンドへの天候適用（雨音環境音）
        if (this.audio && this.audio.setWeather) {
            this.audio.setWeather(weather);
        }
    }

    setDifficulty(diff) {
        this.difficulty = diff;
        if (this.rivalCar) {
            this.rivalCar.setDifficulty(diff);
        }
    }

    setCornerAssist(mode) {
        this.cornerAssistMode = mode;
        if (this.playerPhysics) {
            this.playerPhysics.setCornerAssist(mode);
        }
        const btnWeak = document.getElementById('btn-assist-weak');
        const btnStrong = document.getElementById('btn-assist-strong');
        if (btnWeak && btnStrong) {
            btnWeak.classList.toggle('active', mode === 'weak');
            btnStrong.classList.toggle('active', mode === 'strong');
        }
        if (this.hud && this.hud.showPopup) {
            if (mode === 'strong') {
                this.hud.showPopup('★ ASSIST: STRONG (強・超旋回) ★', '#00ffff', 1.5);
            } else {
                this.hud.showPopup('ASSIST: WEAK (弱・標準)', '#ffcc00', 1.5);
            }
        }
    }

    setupCallbacks() {
        this.playerPhysics.onDriftStart = (type) => {
            let label = 'DRIFT!';
            let color = '#ffcc00';
            if (type === 'FEINT') {
                label = 'FEINT DRIFT!!';
                color = '#ff66ff';
            } else if (type === 'KANSEI') {
                label = 'KANSEI DRIFT!!';
                color = '#ff3333';
            } else if (type === 'BRAKE') {
                label = 'BRAKE DRIFT!';
                color = '#ffff33';
            }
            this.hud.showPopup(label, color, 1.2);
        };

        this.playerPhysics.onDriftEnd = (score) => {
            if (score > 140) {
                this.hud.showPopup('ROCKET EXIT!!', '#00ffcc', 1.0);
            }
        };

        this.playerPhysics.onRocketStart = (rpm) => {
            this.hud.showPopup('★ ROCKET START!! ★', '#ffea00', 1.5);
            if (this.audio && this.audio.playShiftSound) {
                this.audio.playShiftSound();
            }
        };

        this.playerPhysics.onGutterDrop = () => {
            this.cameraShakeTimer = 0.20;
            this.cameraShakeIntensity = 0.22;
            this.hud.showPopup('⚡ GUTTER RUN!! ⚡', '#ffe600', 1.8);
            if (this.audio && this.audio.playGutterDropSound) {
                this.audio.playGutterDropSound();
            }
        };

        this.playerPhysics.onGutterExit = () => {
            if (this.audio && this.audio.playGutterExitSound) {
                this.audio.playGutterExitSound();
            }
        };

        this.playerPhysics.onGutterRun = (active) => {
            // 状態トラッキング
        };

        this.playerPhysics.onWallHit = (intensity) => {
            this.audio.playWallHit(intensity);
            this.particles.emitSparks(this.playerPhysics.position, Math.floor(intensity * 22));
        };

        this.playerPhysics.onShift = (direction, fromGear, toGear) => {
            if (this.audio && this.audio.onShiftChange) {
                this.audio.onShiftChange(direction, fromGear, toGear, this.playerPhysics.rpm);
            } else if (this.audio) {
                this.audio.playShiftSound();
            }
        };

        // ★プレイヤー アフターファイヤ コールバック（火炎パーティクル＋瞬間ライト＋Web Audio破裂音）
        this.playerPhysics.onAfterfire = (intensity) => {
            const exhaust = this.playerCar.getExhaustPosition();
            this.particles.emitAfterfire(exhaust.position, exhaust.direction, intensity, false);
            if (this.audio && this.audio.playAfterfireSound) {
                this.audio.playAfterfireSound(intensity, false);
            }
        };

        // ★ライバルFD3S アフターファイヤ コールバック
        if (this.rivalCar) {
            this.rivalCar.onAfterfire = (intensity) => {
                const exhaust = this.rivalCar.getExhaustPosition();
                this.particles.emitAfterfire(exhaust.position, exhaust.direction, intensity, true);
                if (this.audio && this.audio.playAfterfireSound) {
                    this.audio.playAfterfireSound(intensity, true);
                }
            };
        }
    }

    startRace() {
        this.audio.init();
        this.audio.resume();
        this.audio.startEngineLoop();
        this.audio.startEurobeatBGM();

        this.applyEnvironment();
        this.playerPhysics.resetToTrack(0.003, -1.8);
        this.playerPhysics.isLocked = true; // ★カウントダウン中は完全ロック！
        this.rivalCar.resetPosition();
        if (this.particles && this.particles.clearSkidMarks) {
            this.particles.clearSkidMarks();
        }

        this.state = 'COUNTDOWN';
        this.countdownStep = 3;
        this.countdownTimer = 1.0;
        this.hud.showCountdown(3, '3');
        this.audio.playCountdownBeep(false);

        this.passedSections = new Set();
        if (this.hud) {
            this.hud.currentTime = 0;
            this.hud.isFinished = false;
            if (this.hud.resetSections) {
                this.hud.resetSections();
            }
        }

        const resultOverlay = document.getElementById('result-overlay');
        if (resultOverlay) resultOverlay.style.display = 'none';

        document.getElementById('start-overlay').style.display = 'none';
        document.getElementById('hud-container').style.display = 'block';
    }

    update(dt) {
        this.input.update();

        if (this.state === 'GARAGE') {
            if (this.input.toggleLight && this.playerCar) {
                this.playerCar.toggleHeadlights();
                if (this.audio) this.audio.playHeadlightSwitch();
            }
            if (this.garageUI) this.garageUI.update(dt);
            this.playerCar.update(dt);
            this.particles.update(dt, this.camera);
            return;
        }

        if (this.input.toggleLight && this.playerCar) {
            this.playerCar.toggleHeadlights();
            if (this.audio) this.audio.playHeadlightSwitch();
        }

        if (this.input.changeView) {
            this.cameraMode = (this.cameraMode + 1) % 4;
            if (this.hud && this.hud.showPopup) {
                const modeNames = [
                    'VIEW: STANDARD CHASE (標準三人称)',
                    'VIEW: CLOSE CHASE (近接三人称)',
                    'VIEW: DRIFT ACTION (横斜め追従)',
                    'VIEW: IDAS NOSE / 1ST-PERSON (頭文字D 一人称ノーズ)'
                ];
                this.hud.showPopup(modeNames[this.cameraMode], '#00e5ff', 1.0);
            }
        }

        if (this.input.toggleAssist) {
            const nextMode = (this.playerPhysics.cornerAssistMode === 'weak') ? 'strong' : 'weak';
            this.setCornerAssist(nextMode);
        }

        if (this.input.reset) {
            this.startRace();
        }

        if (this.state === 'COUNTDOWN') {
            this.countdownTimer -= dt;
            if (this.countdownTimer <= 0) {
                this.countdownStep--;
                if (this.countdownStep > 0) {
                    this.countdownTimer = 1.0;
                    this.hud.showCountdown(this.countdownStep, String(this.countdownStep));
                    this.audio.playCountdownBeep(false);
                } else if (this.countdownStep === 0) {
                    this.countdownTimer = 0.8;
                    this.hud.showCountdown(0, 'GO!!');
                    this.audio.playCountdownBeep(true);
                    this.playerPhysics.isLocked = false; // ★ロック解除して発進！
                    this.state = 'RACING';
                }
            }

            // カウントダウン中も空ぶかし（RPM音のみ）
            this.playerPhysics.update(dt, {
                steer: 0,
                throttle: this.input.throttle,
                brake: 0,
                handbrake: false
            });
        } else if (this.state === 'RACING') {
            this.playerPhysics.update(dt, this.input);
            this.rivalCar.update(dt);

            const playerSample = this.track.getSmoothTrackInfo(this.playerPhysics.position, this.playerPhysics.trackT);

            // ★頭文字DAC仕様：セクション通過スプリット判定
            if (!this.passedSections) this.passedSections = new Set();
            const curT = playerSample.t;
            const secSplits = [
                { t: 0.250, sec: 2 },
                { t: 0.520, sec: 3 },
                { t: 0.760, sec: 4 }
            ];
            for (const sp of secSplits) {
                if (curT >= sp.t && !this.passedSections.has(sp.sec)) {
                    this.passedSections.add(sp.sec);
                    const timeStr = this.hud.timeValElem ? this.hud.timeValElem.textContent : '';
                    const distDiff = this.rivalCar.getDistanceToPlayer();
                    const diffSec = distDiff / 32.0;
                    this.hud.onSectionPassed(sp.sec, timeStr, diffSec);
                    if (this.audio) this.audio.playCountdownBeep(true);
                }
            }

            // ★頭文字DAC象徴：3D青色コーナーナビゲーション更新
            if (this.track && this.track.updateCornerNavigation) {
                this.track.updateCornerNavigation(this.playerPhysics.position, this.playerPhysics.trackT);
            }

            if (playerSample.t >= 0.988 && !this.hud.isFinished) {
                this.state = 'FINISH';
                const rivalSample = this.track.getSmoothTrackInfo(this.rivalCar.position, this.rivalCar.progressT);
                const isWin = playerSample.t >= rivalSample.t;
                this.hud.showResult(isWin, this.hud.timeValElem.textContent);
            }
        } else if (this.state === 'FINISH') {
            this.playerPhysics.update(dt, { steer: 0, throttle: 0, brake: 0.3, handbrake: false });
            this.rivalCar.update(dt);
        }

        this.playerCar.update(dt);
        this.updateEffects(dt);

        this.audio.updateEngine(
            this.playerPhysics.rpm,
            this.playerPhysics.throttle,
            this.playerPhysics.isDrifting,
            this.playerPhysics.driftAngle,
            this.playerPhysics.isRevLimiterCut,
            this.playerPhysics.redlineRpm,
            this.playerPhysics.speed,
            this.playerPhysics.brake,
            this.playerPhysics.handbrake
        );

        if (this.audio && this.audio.updateWetTireHiss) {
            this.audio.updateWetTireHiss(this.playerPhysics.speed);
        }

        // ★峠道あるある：路肩砂利ロードノイズ＆小石直撃音更新
        if (this.audio && this.audio.updateGravel) {
            this.audio.updateGravel(this.playerPhysics.speed, this.playerPhysics.gravelIntensity);
        }

        // ★溝落としグラインド摩擦音更新
        if (this.audio && this.audio.updateGutterGrind) {
            this.audio.updateGutterGrind(this.playerPhysics.speed, this.playerPhysics.isGutterRun);
        }

        this.hud.update(dt);
        this.updateCamera(dt);
    }

    updateEffects(dt) {
        // ★雨天時のタイヤ水しぶき（控えめで上品なウェットスプレー）
        if (this.currentWeather === 'rain') {
            if (this.playerPhysics.speed > 35 && Math.random() < 0.35) {
                const wheels = this.playerCar.getRearWheelPositions();
                const sprayFactor = Math.min(0.55, (this.playerPhysics.speed - 32) / 60);
                this.particles.emitSmoke(wheels.left, this.playerPhysics.velocity, sprayFactor);
                this.particles.emitSmoke(wheels.right, this.playerPhysics.velocity, sprayFactor);
            }
            if (this.rivalCar.speed > 35 && Math.random() < 0.35) {
                const rWheels = this.rivalCar.getRearWheelPositions();
                const rSpray = Math.min(0.50, (this.rivalCar.speed - 32) / 60);
                this.particles.emitSmoke(rWheels.left, new THREE.Vector3(0, 0, 0), rSpray);
                this.particles.emitSmoke(rWheels.right, new THREE.Vector3(0, 0, 0), rSpray);
            }
        }

        // ★峠道あるある完全再現：路肩砂利・土煙＆跳ね石パーティクル（Dirt Dust & Gravel Spray）
        if (this.playerPhysics.gravelIntensity > 0 && this.playerPhysics.speed > 8) {
            const gIntensity = this.playerPhysics.gravelIntensity;
            const wheels = this.playerCar.getRearWheelPositions();
            const activeWheel = (this.playerPhysics.gravelWheelSide > 0) ? wheels.right : wheels.left;

            // 土煙放出
            this.particles.emitDirtDust(activeWheel, this.playerPhysics.velocity, gIntensity);

            // 跳ね石放出（20km/h以上でパチパチ飛び散る）
            if (this.playerPhysics.speed > 20 && Math.random() < 0.85) {
                this.particles.emitGravelSpray(
                    activeWheel,
                    this.playerPhysics.velocity,
                    gIntensity,
                    this.playerPhysics.gravelWheelSide
                );
            }
        }

        // ★溝落とし中のイン側ホイール激しい土煙＆跳ね石演出（頭文字D側溝ダスト完全再現！）
        if (this.playerPhysics.isGutterRun && this.playerPhysics.speed > 12) {
            const wheels = this.playerCar.getRearWheelPositions();
            const turnDir = (this.playerPhysics.trackInfo ? this.playerPhysics.trackInfo.turnDir : 1);
            const gutterWheel = (turnDir > 0) ? wheels.left : wheels.right;
            this.particles.emitDirtDust(gutterWheel, this.playerPhysics.velocity, 0.95);
            if (Math.random() < 0.65) {
                this.particles.emitGravelSpray(gutterWheel, this.playerPhysics.velocity, 0.8, (turnDir > 0 ? -1 : 1));
            }
        }

        // ライバル車が路肩を踏んだ場合の土煙（イン攻め演出）
        if (this.rivalCar && this.rivalCar.speed > 25 && this.rivalCar.position) {
            const rInfo = this.track.getSmoothTrackInfo(this.rivalCar.position, this.rivalCar.progressT || this.rivalCar.trackT || 0);
            const rOffset = Math.abs(rInfo.offset);
            if (rOffset > (this.track.roadWidth / 2 - 0.70)) {
                const rWheels = this.rivalCar.getRearWheelPositions();
                const rSide = (rInfo.offset > 0) ? rWheels.right : rWheels.left;
                this.particles.emitDirtDust(rSide, new THREE.Vector3(0, 0, 0), 0.7);
            }
        }

        // =========================================================================
        // ★リアルタイム・スキッドマーク（タイヤ痕）＆ドリフトスモーク更新
        // 通常のステアリング操作（グリップ旋回）ではタイヤ痕を絶対に発生させず、
        // ドリフト・本格パワースライド・急制動（ハードブレーキ/サイド）・発進ホイールスピン時のみ刻印
        // =========================================================================
        const pSpeed = this.playerPhysics.speed || 0;
        const pAbsAngle = Math.abs(this.playerPhysics.driftAngle || 0);
        // 本格ドリフト中（driftAngle が一定以上ある時）
        const pIsDrifting = this.playerPhysics.isDrifting && (pAbsAngle > 0.08);
        const pVLat = Math.abs(this.playerPhysics.velocity ? (
            this.playerPhysics.velocity.x * Math.cos(this.playerPhysics.yaw) - 
            this.playerPhysics.velocity.z * Math.sin(this.playerPhysics.yaw)
        ) : 0);

        // 強烈なブレーキング（ABS作動域の急制動、またはサイドブレーキでのリアロック）
        // ※通常の減速操作（brake 0.2〜0.5）ではタイヤ痕は出さない
        const pIsBraking = ((this.playerPhysics.brake > 0.70 && pSpeed > 24) || (this.playerPhysics.handbrake && pSpeed > 15));

        // ドリフト未判定だがテールが限界摩擦を超えて激しく流れた本格パワースライド
        // ※通常のステアリング操作（pAbsAngle: 0.04〜0.12, pVLat: 1〜2m/s）を完全に除外し、明確な滑走のみ検知
        const pIsPowerSliding = (pAbsAngle > 0.22 && pVLat > 2.8 && pSpeed > 18);

        // 発進時の急加速ホイールスピン（ローンチバーンアウト）
        const pIsLaunchSpin = (this.playerPhysics.launchBoostTimer > 0) && pSpeed < 45 && (this.input.throttle > 0.50);

        // 現フレームでタイヤが限界摩擦を超えて滑っているか
        const isTireSlippingNow = pIsDrifting || pIsPowerSliding || pIsBraking || pIsLaunchSpin;

        // ★振り返し（S字等の切り返し）時のゼロクロスによる途切れを防止するホールドタイマー
        // ※本格ドリフト中（pIsDrifting）の時のみホールドし、通常走行や軽いスライドでは一切引き延ばさない！
        if (pIsDrifting) {
            this.playerTireBurnTimer = 0.18;
        } else if (isTireSlippingNow) {
            this.playerTireBurnTimer = Math.max(this.playerTireBurnTimer, 0.06);
        } else if (this.playerTireBurnTimer > 0) {
            this.playerTireBurnTimer -= dt;
        }

        // ドリフト抜け（収束フェーズ）のプログレッシブ・フェードアウト係数 (0.16〜1.0)
        // スリップ角が 0.08 〜 0.22 rad (約4.5°〜12.6°) の収束領域に入った時、グリップ回復とともに滑らかに濃度減衰
        let exitFadeFactor = 1.0;
        if (pIsDrifting) {
            if (pAbsAngle < 0.22) {
                exitFadeFactor = Math.max(0.18, Math.pow((pAbsAngle - 0.06) / 0.16, 1.25));
            }
        } else if (this.playerTireBurnTimer > 0) {
            // ホールドタイマー中（振り返しゼロクロスやスリップ収束の滑らかな余韻）
            exitFadeFactor = Math.max(0.16, this.playerTireBurnTimer / 0.18);
        }

        const isPlayerBurningTire = isTireSlippingNow || (pIsDrifting && this.playerTireBurnTimer > 0);
        let pTireIntensity = 0.65;

        if (pIsDrifting && pSpeed > 14) {
            // 車速とスリップ角に応じたダイナミック強度（下限を 0.18 まで広げて繊細な抜け際フェードアウトを実現）
            const rawIntensity = Math.min(1.35, Math.max(0.18, pAbsAngle * 2.8 + (pSpeed - 30) * 0.008));
            pTireIntensity = rawIntensity * exitFadeFactor;
        } else if (pIsPowerSliding) {
            const rawIntensity = Math.min(1.15, Math.max(0.20, (pAbsAngle - 0.15) * 3.0 + pVLat * 0.10));
            pTireIntensity = rawIntensity * exitFadeFactor;
        } else if (pIsBraking) {
            pTireIntensity = this.playerPhysics.handbrake ? 0.95 : Math.min(0.95, (this.playerPhysics.brake - 0.65) * 3.0);
        } else if (pIsLaunchSpin) {
            pTireIntensity = 1.0;
        }

        if (isPlayerBurningTire) {
            // ★左右タイヤ直下の真のアスファルト路面表面の標高（ミリ単位）をサンプリング！
            // 秋名山などの急勾配ダウンヒルでも、下り坂の標高差（約10〜14cm）を完璧に捉えてアスファルト表面に100%吸着
            const wheels = this.playerCar.getRearWheelPositions(this.track, this.playerPhysics.trackT);
            const intensity = (this.currentWeather === 'rain') ? pTireIntensity * 0.40 : pTireIntensity;

            // スモーク発生（ドリフトおよびホイールスピン時、雨天は水しぶき）
            if (pIsDrifting || pIsPowerSliding || pIsLaunchSpin) {
                this.particles.emitSmoke(wheels.left, this.playerPhysics.velocity, intensity);
                this.particles.emitSmoke(wheels.right, this.playerPhysics.velocity, intensity);
            }
            // ★路面にクッキリと自車のタイヤ痕（ブラックマーク：左右動的荷重移動＋余熱ヴェイパー＋冷えグレー経年変化）を刻み込む
            this.particles.addPlayerDriftMark(wheels.left, wheels.right, intensity, this.playerPhysics.driftAngle || 0);
        } else {
            this.particles.endPlayerDrift();
        }

        // ★ライバル車（高橋啓介FD3S）ドリフト時のタイヤスモーク＆リアルタイム・スキッドマーク
        const rSpeed = this.rivalCar.speed || 0;
        const rIsDrifting = this.rivalCar.isDrifting && rSpeed > 20;
        if (rIsDrifting) {
            const rWheels = this.rivalCar.getRearWheelPositions(this.track, this.rivalCar.progressT);
            const rIntensity = (this.currentWeather === 'rain') ? 0.35 : 0.75;
            this.particles.emitSmoke(rWheels.left, new THREE.Vector3(0, 0, 0), rIntensity);
            this.particles.emitSmoke(rWheels.right, new THREE.Vector3(0, 0, 0), rIntensity);
            this.particles.addRivalDriftMark(rWheels.left, rWheels.right, rIntensity, this.rivalCar.driftAngle || 0);
        } else {
            this.particles.endRivalDrift();
        }

        // ★頭文字D名物：ドリフト時のテールランプ残像（Light Trails）更新
        const pTails = this.playerCar.getTailLightPositions();
        const rTails = this.rivalCar.getTailLightPositions();
        this.particles.updateTailTrails(
            pTails,
            this.playerPhysics.isDrifting,
            rTails,
            this.rivalCar.isDrifting
        );

        this.particles.update(dt, this.camera);
    }

    updateCamera(dt) {
        // ★重要：自車メッシュは常に表示（meshGroup内にヘッドライトのSpotLight/PointLightが含まれるため、
        // falseにするとライトまで消灯してしまう。trueを維持することでヘッドライトが前方を煌々と照らし、
        // かつ画面下端に愛車のボンネット先端＆リトラクタブルライトがリアルに視認できる！）
        if (this.playerCar && this.playerCar.meshGroup) {
            this.playerCar.meshGroup.visible = true;
        }

        // カメラの上方向ベクトルを常にワールドY軸(0, 1, 0)に固定（360度どの向き・ドリフト時でも上下反転・転倒を100%防止！）
        this.camera.up.set(0, 1, 0);

        const carPos = this.playerPhysics.position;
        const forward = new THREE.Vector3(
            Math.sin(this.playerPhysics.yaw),
            0,
            Math.cos(this.playerPhysics.yaw)
        );

        const trackInfo = this.track.getSmoothTrackInfo(carPos, this.playerPhysics.trackT);
        const roadCenterY = trackInfo.centerPos.y;
        const speedKmh = this.playerPhysics.speed;
        const speedRatio = Math.min(1.0, speedKmh / 160);
        const speedPull = Math.min(1.0, speedKmh / 150);

        // =========================================================================
        // ★【頭文字D ARCADE STAGE 再現：一人称ボンネット／フロントビュー】(cameraMode === 3)
        // =========================================================================
        if (this.cameraMode === 3) {
            // 全車種のフロントガラス上端より前方・上部のボンネット視点（車体中心より+0.65m、高さ+1.08m）
            // 画面下端に愛車のボンネットとリトラクタブルライトが程よく見え、そこから強力なヘッドライト光が前方の路面を照らす！
            const hoodOffset = 0.65;
            const hoodHeight = 1.08;

            const idealCamPos = new THREE.Vector3(
                carPos.x + forward.x * hoodOffset,
                carPos.y + hoodHeight,
                carPos.z + forward.z * hoodOffset
            );

            // 一人称視点は車体フロントに直結追従
            this.camera.position.copy(idealCamPos);

            // ドリフト時は車体向き(forward)を基本としつつ、進行方向(velDir)へ最大18%だけ自然に視線を向けることで
            // 目の前のボンネットを画面下に維持したままコーナー出口を見やすくする
            let lookDir = forward.clone();
            if (this.playerPhysics.speedMs > 3.0 && !this.playerPhysics.isCollidingWall) {
                const velDir = this.playerPhysics.velocity.clone();
                velDir.y = 0;
                if (velDir.lengthSq() > 0.04) {
                    velDir.normalize();
                    if (forward.dot(velDir) > 0.35) {
                        const driftLookWeight = this.playerPhysics.isDrifting ? 0.18 : 0.05;
                        lookDir = forward.clone().lerp(velDir, driftLookWeight).normalize();
                    }
                }
            }

            // 注視点：前方20m先、路面勾配に正確に合致
            const lookAheadDist = 20.0 + speedPull * 5.0;
            const tangentPitchOffset = trackInfo.tangent.y * lookAheadDist;
            const idealLookTarget = idealCamPos.clone()
                .add(lookDir.multiplyScalar(lookAheadDist))
                .add(new THREE.Vector3(0, -0.32 + tangentPitchOffset, 0));

            this.cameraLookTarget.copy(idealLookTarget);
            this.camera.lookAt(this.cameraLookTarget);
            // ※lookAt後にcamera.rotation.zを直接書き換えると南向き走行時にEuler角仕様で180度上下反転するため絶対に行わない。
            // コーナリングや溝落とし時のロール・ピッチ傾斜は、画面下端に見えるボンネット自身の傾きとしてリアルに表現される！

            // 視野角（IDAS一人称基準：62° -> 最大72°の自然な遠近感とスピード感）
            let targetFov = 62 + speedRatio * 10;
            if (this.playerPhysics.isDrifting) {
                targetFov += Math.min(2.5, Math.abs(this.playerPhysics.driftAngle) * 4.0);
            }
            this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, 10.0 * dt);
            this.camera.updateProjectionMatrix();

            // 高速走行時の微振動＆溝落とし衝撃
            if (speedKmh > 140) {
                const shakeIntensity = Math.min(0.015, (speedKmh - 140) * 0.00025);
                this.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
                this.camera.position.y += (Math.random() - 0.5) * shakeIntensity;
            }
            if (this.cameraShakeTimer > 0) {
                this.cameraShakeTimer -= dt;
                const shakeAmt = this.cameraShakeIntensity * Math.min(1.0, this.cameraShakeTimer / 0.14) * 0.6;
                this.camera.position.x += (Math.random() - 0.5) * shakeAmt;
                this.camera.position.y += (Math.random() - 0.5) * shakeAmt;
            }
            return;
        }

        // =========================================================================
        // ★三人称系チェイスカメラ（Mode 0: 標準, Mode 1: 近接, Mode 2: ドリフトアクション）
        // =========================================================================
        // 1. 車体向き (forward) と進行方向 (velDir) の安全なブレンド
        let camDir = forward.clone();
        if (this.playerPhysics.speedMs > 3.0 && !this.playerPhysics.isCollidingWall) {
            const velDir = this.playerPhysics.velocity.clone();
            velDir.y = 0;
            if (velDir.lengthSq() > 0.04) {
                velDir.normalize();
                const dot = forward.dot(velDir);
                if (dot > 0.4) {
                    const blendWeight = this.playerPhysics.isDrifting ? 0.45 : 0.25;
                    const blended = forward.clone().lerp(velDir, blendWeight);
                    if (blended.lengthSq() > 0.01) {
                        camDir = blended.normalize();
                    }
                }
            }
        }

        let targetDist = 4.95;
        let targetHeight = 1.72;
        let lookAheadDist = 8.4;

        if (this.cameraMode === 0) { // ★頭文字D ARCADE STAGE 完全再現：標準チェイス（黄金比テールビュー）
            targetDist = 4.95 + speedPull * 0.45;
            targetHeight = 1.72 - speedPull * 0.12;
            lookAheadDist = 8.4 + speedPull * 2.8;
        } else if (this.cameraMode === 1) { // ★近接三人称チェイス（タイトテールビュー）
            targetDist = 4.25 + speedPull * 0.35;
            targetHeight = 1.54 - speedPull * 0.10;
            lookAheadDist = 7.4 + speedPull * 2.5;
        } else if (this.cameraMode === 2) { // ★ドリフト・サイドアクション視点（斜め追従）
            targetDist = 5.20 + speedPull * 0.45;
            targetHeight = 1.62 - speedPull * 0.12;
            lookAheadDist = 6.8 + speedPull * 2.5;
        }

        // 2. 下り坂・勾配適応補正
        const slopeDown = -trackInfo.tangent.y;
        const slopeHeightOffset = Math.max(0, slopeDown * targetDist * 1.30);
        const baseHeight = targetHeight + slopeHeightOffset;

        const carRight = new THREE.Vector3(forward.z, 0, -forward.x);
        let lateralOffset = new THREE.Vector3();

        if (this.cameraMode === 2) {
            // ドリフト・サイドアクション視点：車体斜め外側からカウンター舵角とスライドを大胆に捉える
            const sideSign = (this.playerPhysics.driftAngle !== 0) ? Math.sign(this.playerPhysics.driftAngle) : 1.0;
            const driftSwing = Math.sin(this.playerPhysics.driftAngle || 0) * 1.6;
            lateralOffset = carRight.clone().multiplyScalar(sideSign * 1.25 + driftSwing);
        } else if (this.playerPhysics.isDrifting) {
            const swingScale = (this.cameraMode === 1 ? 1.45 : 1.38);
            const driftSwing = Math.sin(this.playerPhysics.driftAngle || 0) * swingScale;
            lateralOffset = carRight.clone().multiplyScalar(driftSwing);
        }

        const idealCamPos = new THREE.Vector3(
            carPos.x - camDir.x * targetDist + lateralOffset.x,
            roadCenterY + baseHeight,
            carPos.z - camDir.z * targetDist + lateralOffset.z
        );

        // 滑らかなカメラ位置補間
        const lerpFactor = Math.min(1.0, 9.5 * dt);
        this.camera.position.lerp(idealCamPos, lerpFactor);

        // カメラが車両路面より下（地下）に潜り込まないよう絶対保証クランプ
        const minSafeY = roadCenterY + 1.15;
        if (this.camera.position.y < minSafeY) {
            this.camera.position.y = minSafeY;
        }

        // 4. 注視点（LookTarget）の勾配アライメント
        const tangentPitchOffset = trackInfo.tangent.y * lookAheadDist;
        const idealLookTarget = carPos.clone()
            .add(forward.clone().multiplyScalar(lookAheadDist))
            .add(new THREE.Vector3(0, 0.88 + tangentPitchOffset, 0));

        this.cameraLookTarget.lerp(idealLookTarget, Math.min(1.0, 12.0 * dt));
        this.camera.lookAt(this.cameraLookTarget);

        // 5. 速度に応じたダイナミックFOV＆スピード演出
        let targetFov = 55 + speedRatio * 9;
        if (this.cameraMode === 1) {
            targetFov = 58 + speedRatio * 9;
        } else if (this.cameraMode === 2) {
            targetFov = 62 + speedRatio * 12;
        }

        if (this.playerPhysics.isDrifting) {
            targetFov += Math.min(3, Math.abs(this.playerPhysics.driftAngle) * 5);
        }

        this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, 6.0 * dt);
        this.camera.updateProjectionMatrix();

        // 6. 高速時（140km/h以上）のリアルな風圧・路面トレモロ（カメラ微振動）
        if (speedKmh > 140) {
            const shakeIntensity = Math.min(0.025, (speedKmh - 140) * 0.00035);
            this.camera.position.x += (Math.random() - 0.5) * shakeIntensity;
            this.camera.position.y += (Math.random() - 0.5) * shakeIntensity * 0.6;
        }

        // 7. 溝落とし突入衝撃＆クラッシュ振動（カメラシェイク）
        if (this.cameraShakeTimer > 0) {
            this.cameraShakeTimer -= dt;
            const shakeAmt = this.cameraShakeIntensity * Math.min(1.0, this.cameraShakeTimer / 0.14);
            this.camera.position.x += (Math.random() - 0.5) * 2 * shakeAmt;
            this.camera.position.y += (Math.random() - 0.5) * 2 * shakeAmt * 0.7;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const dt = Math.min(0.05, this.clock.getDelta());
        this.update(dt);
        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        if (this.hud && this.hud.resizeSpeedLines) {
            this.hud.resizeSpeedLines();
        }
    }
}

window.Game = Game;
