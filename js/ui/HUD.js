/**
 * HUD.js - 頭文字D ARCADE STAGE 完全再現HUD
 * コース切り替え時のミニマップ再描画、11,000RPMタコメーター、ライバル距離差ゲージ
 */

class HUD {
    constructor(track, playerPhysics, rivalCar, audio = null) {
        this.track = track;
        this.player = playerPhysics;
        this.rival = rivalCar;
        this.audio = audio;

        this.popupText = '';
        this.popupTimer = 0;
        this.popupColor = '#ffff00';

        this.startTime = 0;
        this.currentTime = 0;
        this.isFinished = false;

        this.initDOMElements();
        this.setupTachometerCanvas();
        this.setupSubMeters();
        this.setupMinimap();
        this.setupSpeedLines();

        // ★頭文字DAC仕様 コーナーガイド (SEGAアーケード完全再現)
        if (window.CornerGuide) {
            this.cornerGuide = new CornerGuide(this.track, this.player, this.audio);
        } else {
            this.cornerGuide = null;
        }
    }

    setTrack(newTrack) {
        this.track = newTrack;
        this.precalcMinimapBounds();
        if (this.cornerGuide) {
            this.cornerGuide.setTrack(newTrack);
        }
    }

    initDOMElements() {
        this.speedValElem = document.getElementById('speed-val');
        this.gearValElem = document.getElementById('gear-val');
        this.transModeElem = document.getElementById('trans-mode');
        this.shiftLampElem = document.getElementById('shift-lamp');
        this.revLeds = Array.from(document.querySelectorAll('.rev-led'));
        this.timeValElem = document.getElementById('time-val');
        this.leadValElem = document.getElementById('lead-val');
        this.leadBarElem = document.getElementById('lead-bar');
        this.leadLabelElem = document.getElementById('lead-label');
        this.driftPopupElem = document.getElementById('drift-popup');
        this.countdownElem = document.getElementById('countdown-overlay');
        this.resultOverlayElem = document.getElementById('result-overlay');
        this.valOilPressElem = document.getElementById('val-oilpress');
        this.valWaterTempElem = document.getElementById('val-watertemp');
        this.valOilTempElem = document.getElementById('val-oiltemp');

        // 頭文字DAC仕様 セクション要素
        this.secTags = [1, 2, 3, 4].map(n => document.getElementById('sec-tag-' + n));
        this.secPopupElem = document.getElementById('section-popup');
        this.secPopupTitleElem = document.getElementById('sec-popup-title');
        this.secPopupTimeElem = document.getElementById('sec-popup-time');
        this.secPopupDiffElem = document.getElementById('sec-popup-diff');
        this.secPopupTimer = 0;
    }

    setupTachometerCanvas() {
        this.tachoCanvas = document.getElementById('tacho-canvas');
        if (this.tachoCanvas) {
            this.tachoCtx = this.tachoCanvas.getContext('2d');
        }
    }

    setupSubMeters() {
        this.oilPressCanvas = document.getElementById('meter-oilpress-canvas');
        if (this.oilPressCanvas) this.oilPressCtx = this.oilPressCanvas.getContext('2d');

        this.waterTempCanvas = document.getElementById('meter-watertemp-canvas');
        if (this.waterTempCanvas) this.waterTempCtx = this.waterTempCanvas.getContext('2d');

        this.oilTempCanvas = document.getElementById('meter-oiltemp-canvas');
        if (this.oilTempCanvas) this.oilTempCtx = this.oilTempCanvas.getContext('2d');
    }

    setupMinimap() {
        this.minimapCanvas = document.getElementById('minimap-canvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
            this.precalcMinimapBounds();
        }
    }

    setupSpeedLines() {
        this.speedLinesCanvas = document.getElementById('speed-lines-canvas');
        if (this.speedLinesCanvas) {
            this.speedLinesCtx = this.speedLinesCanvas.getContext('2d');
            this.resizeSpeedLines();
            window.addEventListener('resize', () => this.resizeSpeedLines());
        }
    }

    resizeSpeedLines() {
        if (!this.speedLinesCanvas) return;
        this.speedLinesCanvas.width = window.innerWidth;
        this.speedLinesCanvas.height = window.innerHeight;
    }

    precalcMinimapBounds() {
        let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        for (let s of this.track.samples) {
            if (s.pos.x < minX) minX = s.pos.x;
            if (s.pos.x > maxX) maxX = s.pos.x;
            if (s.pos.z < minZ) minZ = s.pos.z;
            if (s.pos.z > maxZ) maxZ = s.pos.z;
        }
        this.mapMinX = minX - 40;
        this.mapMaxX = maxX + 40;
        this.mapMinZ = minZ - 40;
        this.mapMaxZ = maxZ + 40;
    }

    showPopup(text, color = '#ffea00', duration = 1.2) {
        this.popupText = text;
        this.popupColor = color;
        this.popupTimer = duration;

        if (this.driftPopupElem) {
            this.driftPopupElem.textContent = text;
            this.driftPopupElem.style.color = color;
            this.driftPopupElem.style.textShadow = `0 0 15px ${color}, 2px 2px 0px #000`;
            this.driftPopupElem.classList.remove('active');
            void this.driftPopupElem.offsetWidth;
            this.driftPopupElem.classList.add('active');
        }
    }

    update(dt) {
        if (!this.isFinished) {
            this.currentTime += dt;
        }

        // スピード・ギア
        if (this.speedValElem) {
            this.speedValElem.textContent = Math.floor(this.player.speed);
        }
        if (this.gearValElem) {
            this.gearValElem.textContent = this.player.gear === 0 ? 'N' : this.player.gear;
        }
        if (this.transModeElem) {
            this.transModeElem.textContent = this.player.isAutomatic ? 'AT' : 'MT';
        }

        // シフトアップ警告ランプ ＆ シーケンシャルREVインジケーター (各マシンのレッドゾーン手前で点灯・点滅)
        const redline = this.player.redlineRpm || 8500;
        const maxGear = (this.player && this.player.maxGear) ? this.player.maxGear : 5;
        const shiftThreshold = redline * 0.95;
        const isShiftBlink = (this.player.rpm > shiftThreshold);
        const blinkOn = Math.floor(Date.now() / 65) % 2 === 0;

        if (this.revLeds && this.revLeds.length > 0) {
            const startRev = redline * 0.52;
            const spanRev = Math.max(500, shiftThreshold - startRev);
            const revProgress = Math.max(0, Math.min(1, (this.player.rpm - startRev) / spanRev));
            const activeCount = Math.floor(revProgress * this.revLeds.length + 0.05);
            this.revLeds.forEach((led, idx) => {
                if (isShiftBlink) {
                    led.classList.toggle('on', blinkOn);
                } else {
                    led.classList.toggle('on', idx < activeCount);
                }
            });
        }

        if (this.shiftLampElem) {
            if (isShiftBlink && this.player.gear <= maxGear) {
                this.shiftLampElem.style.backgroundColor = blinkOn ? '#ff1111' : '#3a0000';
                this.shiftLampElem.style.boxShadow = blinkOn ? '0 0 18px #ff1111, 0 0 6px #ffffff' : 'none';
                this.shiftLampElem.style.borderColor = blinkOn ? '#ffaaaa' : '#661111';
            } else {
                this.shiftLampElem.style.backgroundColor = '#200303';
                this.shiftLampElem.style.boxShadow = 'none';
                this.shiftLampElem.style.borderColor = '#551111';
            }
        }

        // タイム
        if (this.timeValElem) {
            const mins = Math.floor(this.currentTime / 60);
            const secs = Math.floor(this.currentTime % 60);
            const millis = Math.floor((this.currentTime % 1) * 1000);
            this.timeValElem.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
        }

        // ライバル距離差
        const distDiff = this.rival.getDistanceToPlayer();
        if (this.leadValElem && this.leadBarElem) {
            const absDist = Math.abs(distDiff).toFixed(1);
            if (distDiff <= 0) {
                this.leadLabelElem.textContent = '1ST';
                this.leadLabelElem.style.color = '#33ff55';
                this.leadValElem.textContent = `+${absDist}m`;
                this.leadValElem.style.color = '#33ff55';

                const percent = Math.min(100, (Math.abs(distDiff) / 50) * 100);
                this.leadBarElem.style.width = `${percent}%`;
                this.leadBarElem.style.backgroundColor = '#33ff55';
                this.leadBarElem.style.float = 'left';
            } else {
                this.leadLabelElem.textContent = '2ND';
                this.leadLabelElem.style.color = '#ff3333';
                this.leadValElem.textContent = `-${absDist}m`;
                this.leadValElem.style.color = '#ff3333';

                const percent = Math.min(100, (distDiff / 50) * 100);
                this.leadBarElem.style.width = `${percent}%`;
                this.leadBarElem.style.backgroundColor = '#ff3333';
                this.leadBarElem.style.float = 'right';
            }
        }

        // 走り屋追加メーター数値更新
        if (this.valOilPressElem) {
            this.valOilPressElem.textContent = (this.player.oilPressure / 100).toFixed(1) + ' bar';
        }
        if (this.valWaterTempElem) {
            this.valWaterTempElem.textContent = Math.round(this.player.waterTemp) + ' ℃';
        }
        if (this.valOilTempElem) {
            this.valOilTempElem.textContent = Math.round(this.player.oilTemp) + ' ℃';
        }

        this.renderTachometer();
        this.renderSubMeters();
        this.renderMinimap();
        this.renderSpeedLines();

        if (this.popupTimer > 0) {
            this.popupTimer -= dt;
            if (this.popupTimer <= 0 && this.driftPopupElem) {
                this.driftPopupElem.classList.remove('active');
            }
        }

        // セクションポップアップタイマー
        if (this.secPopupTimer > 0) {
            this.secPopupTimer -= dt;
            if (this.secPopupTimer <= 0 && this.secPopupElem) {
                this.secPopupElem.classList.remove('active');
            }
        }

        // ★頭文字DAC仕様 コーナーガイド更新
        if (this.cornerGuide && !this.isFinished) {
            this.cornerGuide.update(dt);
        }
    }

    /**
     * ★頭文字DAC仕様：セクション通過コールバック
     * @param {number} secNum 現在到達したセクション番号 (2, 3, 4)
     * @param {string} splitTimeSec 通過区間タイム
     * @param {number} diffSec 前走差分 (負なら先行グリーン、正なら遅れレッド)
     */
    onSectionPassed(secNum, splitTimeSec, diffSec = -0.28) {
        // セクションインジケーター更新
        if (this.secTags) {
            this.secTags.forEach((tag, idx) => {
                if (!tag) return;
                tag.classList.remove('active', 'passed');
                if (idx + 1 < secNum) {
                    tag.classList.add('passed');
                } else if (idx + 1 === secNum) {
                    tag.classList.add('active');
                }
            });
        }

        // ポップアップ表示
        if (this.secPopupElem) {
            const passedSec = secNum - 1;
            if (this.secPopupTitleElem) {
                this.secPopupTitleElem.textContent = `SECTION ${passedSec} CLEAR`;
            }
            if (this.secPopupTimeElem) {
                this.secPopupTimeElem.textContent = splitTimeSec;
            }
            if (this.secPopupDiffElem) {
                const isGreen = (diffSec <= 0);
                const sign = isGreen ? '-' : '+';
                const absVal = Math.abs(diffSec).toFixed(3);
                this.secPopupDiffElem.textContent = `${sign}0'00"${absVal.replace('.', '')}`;
                this.secPopupDiffElem.className = `sec-popup-diff ${isGreen ? 'green' : 'red'}`;
            }

            this.secPopupElem.classList.remove('active');
            void this.secPopupElem.offsetWidth;
            this.secPopupElem.classList.add('active');
            this.secPopupTimer = 2.4;
        }
    }

    /**
     * セクションインジケーターを初期状態 (SEC 1) にリセット
     */
    resetSections() {
        if (this.secTags) {
            this.secTags.forEach((tag, idx) => {
                if (!tag) return;
                tag.classList.remove('active', 'passed');
                if (idx === 0) tag.classList.add('active');
            });
        }
        if (this.secPopupElem) {
            this.secPopupElem.classList.remove('active');
        }
        this.secPopupTimer = 0;
        if (this.cornerGuide) {
            this.cornerGuide.reset();
        }
    }

    /**
     * リアルな綾織りカーボンファイバー（Twill Carbon Weave）パターンを生成・キャッシュ
     */
    getCarbonPattern(ctx) {
        if (this.carbonPattern) return this.carbonPattern;
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 8;
        pCanvas.height = 8;
        const pCtx = pCanvas.getContext('2d');

        pCtx.fillStyle = '#070a0f';
        pCtx.fillRect(0, 0, 8, 8);

        pCtx.fillStyle = '#141c27';
        pCtx.fillRect(0, 0, 4, 2);
        pCtx.fillRect(2, 2, 4, 2);
        pCtx.fillRect(4, 4, 4, 2);
        pCtx.fillRect(0, 6, 2, 2);
        pCtx.fillRect(6, 6, 2, 2);

        pCtx.fillStyle = '#1e2836';
        pCtx.fillRect(0, 0, 2, 1);
        pCtx.fillRect(2, 2, 2, 1);
        pCtx.fillRect(4, 4, 2, 1);
        pCtx.fillRect(6, 6, 2, 1);

        this.carbonPattern = ctx.createPattern(pCanvas, 'repeat');
        return this.carbonPattern;
    }

    /**
     * ★頭文字D ARCADE STAGE 完全再現マスターメータークラスター描画 (460x300 HiDPI)
     * 1. 左下スカルプト・デジタルスピードメーターウイング (km/h + シーケンシャルREVバー)
     * 2. 左上オーバーラップ・アナログブースト計 (×100kPa, -1.0 〜 +2.0)
     * 3. ベゼル外付けボルトオン・大型赤色シフトアップ警告ランプ (SHIFT UP!)
     * 4. メイン11,000RPMタコメーター (カーボン文字盤 + 3Dクロームベゼル + 盤面内ギア表示窓 + DRIFT/GUTTERランプ)
     * 5. 右サイド外周・20セグメント湾曲ペダルテレメトリーバー (ACCEL / BRAKE)
     */
    renderTachometer() {
        if (!this.tachoCtx) return;
        const ctx = this.tachoCtx;
        const w = this.tachoCanvas.width;
        const h = this.tachoCanvas.height;

        const maxRpm = this.player.maxRpm || 11000;
        const redlineRpm = this.player.redlineRpm || 8500;
        const maxDisplay = Math.ceil(maxRpm / 1000);
        const maxScaleRpm = maxDisplay * 1000;
        const curRpm = Math.max(0, this.player.rpm || 0);
        const rpmRatio = Math.min(1.0, Math.max(0, curRpm / maxScaleRpm));
        const redRatio = Math.max(0, Math.min(1, redlineRpm / maxScaleRpm));
        const inRedzone = curRpm >= redlineRpm * 0.95;
        const blinkOn = Math.floor(Date.now() / 60) % 2 === 0;
        const throttle = Math.max(0, Math.min(1, this.player.throttle || 0));
        const brake = Math.max(0, Math.min(1, this.player.brake || 0));
        const speedInt = Math.floor(this.player.speed || 0);
        const gearStr = (this.player.gear === 0) ? 'N' : String(this.player.gear || 1);
        const transStr = this.player.isAutomatic ? 'AT' : 'MT';

        // 過給圧（ブースト / バキューム圧：-0.75 〜 +1.35 ×100kPa）の滑らか算出
        const targetBoost = -0.68 + throttle * (0.95 + Math.pow(rpmRatio, 1.35) * 1.12);
        this.smoothBoost = (this.smoothBoost === undefined)
            ? targetBoost
            : this.smoothBoost + (targetBoost - this.smoothBoost) * 0.16;

        ctx.clearRect(0, 0, w, h);
        const carbonPat = this.getCarbonPattern(ctx);

        // メインタコメーターの中心座標＆半径
        const cx = 304;
        const cy = 152;
        const radius = 118;

        // =====================================================================
        // STEP 1: 左下スカルプト・アーケードデジタルスピードメーターウイング
        //         (メインタコメーターの左下部から一体成形で張り出す立体チタンハウジング)
        // =====================================================================
        ctx.save();
        // 外側メタリックチタンフレーム（多角形スカルプトシェイプ）
        const wingGrad = ctx.createLinearGradient(10, 168, 230, 286);
        wingGrad.addColorStop(0, '#7a8b9e');
        wingGrad.addColorStop(0.25, '#2b3542');
        wingGrad.addColorStop(0.65, '#141a22');
        wingGrad.addColorStop(1, '#4c5b6e');

        ctx.beginPath();
        ctx.moveTo(30, 174);
        ctx.lineTo(232, 174);
        ctx.lineTo(222, 278);
        ctx.lineTo(14, 278);
        ctx.lineTo(6, 264);
        ctx.lineTo(18, 186);
        ctx.closePath();
        ctx.fillStyle = wingGrad;
        ctx.fill();
        ctx.strokeStyle = '#090d12';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 内側カーボン液晶ディスプレイ面
        ctx.beginPath();
        ctx.moveTo(34, 181);
        ctx.lineTo(214, 181);
        ctx.lineTo(204, 271);
        ctx.lineTo(20, 271);
        ctx.lineTo(14, 260);
        ctx.lineTo(24, 190);
        ctx.closePath();
        ctx.fillStyle = carbonPat || '#080b10';
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // 上部アーケードアクセントバー ＆ シーケンシャル8連REVインジケーター
        const revStart = redlineRpm * 0.50;
        const revSpan = Math.max(500, redlineRpm * 0.95 - revStart);
        const revProg = Math.max(0, Math.min(1, (curRpm - revStart) / revSpan));
        const totalLeds = 8;
        const activeLeds = Math.floor(revProg * totalLeds + 0.05);

        for (let i = 0; i < totalLeds; i++) {
            const lx = 33 + i * 19;
            const ly = 187;
            const isOn = inRedzone ? blinkOn : (i < activeLeds);
            let ledColor = '#00ff77';
            if (i >= 6) ledColor = '#ff1122';
            else if (i >= 4) ledColor = '#ffbb00';

            ctx.save();
            ctx.transform(1, 0, -0.18, 1, 0, 0);
            ctx.fillStyle = isOn ? ledColor : 'rgba(25, 35, 45, 0.9)';
            if (isOn) {
                ctx.shadowColor = ledColor;
                ctx.shadowBlur = 8;
            }
            ctx.fillRect(lx + 32, ly, 14, 6);
            ctx.strokeStyle = 'rgba(255,255,255,0.18)';
            ctx.lineWidth = 0.8;
            ctx.strokeRect(lx + 32, ly, 14, 6);
            ctx.restore();
        }

        // 「SPEED」マイクロヘッダーとアンバーサイドライン
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(22, 200, 4, 62);
        ctx.font = 'italic 900 10px "Rajdhani", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#88a4c0';
        ctx.fillText('SPEEDOMETER', 32, 207);

        // 7セグメント風ゴースト「888」背景 + 超高輝度デジタル速度数値
        ctx.textAlign = 'right';
        ctx.textBaseline = 'alphabetic';
        ctx.font = 'italic 700 66px "Teko", "Rajdhani", "Impact", sans-serif';
        ctx.fillStyle = 'rgba(200, 235, 255, 0.06)';
        ctx.fillText('888', 152, 257);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 230, 255, 0.85)';
        ctx.shadowBlur = 14;
        ctx.fillText(String(speedInt), 152, 257);
        ctx.shadowBlur = 0;

        // 「km/h」ロゴ
        ctx.textAlign = 'left';
        ctx.font = 'italic 900 17px "Rajdhani", sans-serif';
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fillText('km/h', 156, 257);
        ctx.shadowBlur = 0;
        ctx.restore();

        // =====================================================================
        // STEP 2: 左上オーバーラップ・頭文字D公式アナログブースト計 (BOOST ×100kPa)
        // =====================================================================
        const bcx = 128;
        const bcy = 104;
        const br = 55;

        // ブースト計3Dメタリックベゼル
        const bBezelGrad = ctx.createLinearGradient(bcx - br, bcy - br, bcx + br, bcy + br);
        bBezelGrad.addColorStop(0, '#8092a6');
        bBezelGrad.addColorStop(0.4, '#242d38');
        bBezelGrad.addColorStop(0.8, '#0f141a');
        bBezelGrad.addColorStop(1, '#4a5868');

        ctx.beginPath();
        ctx.arc(bcx, bcy, br + 7, 0, Math.PI * 2);
        ctx.fillStyle = bBezelGrad;
        ctx.fill();
        ctx.strokeStyle = '#080b10';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bcx, bcy, br + 1, 0, Math.PI * 2);
        ctx.strokeStyle = '#00d8ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // ブースト計カーボン文字盤
        ctx.beginPath();
        ctx.arc(bcx, bcy, br, 0, Math.PI * 2);
        ctx.fillStyle = carbonPat || '#080c12';
        ctx.fill();

        const bStart = Math.PI * 0.75;
        const bTotal = Math.PI * 1.45;
        const bMin = -1.0;
        const bMax = 2.0;

        // ブースト目盛りトラック（バキューム域：シアン、正圧域：ホワイト、高ブースト域：レッド）
        const zeroRatio = (0 - bMin) / (bMax - bMin);
        const redBoostRatio = (1.2 - bMin) / (bMax - bMin);
        ctx.beginPath();
        ctx.arc(bcx, bcy, br - 5, bStart, bStart + zeroRatio * bTotal);
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.45)';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bcx, bcy, br - 5, bStart + zeroRatio * bTotal, bStart + redBoostRatio * bTotal);
        ctx.strokeStyle = 'rgba(240, 248, 255, 0.35)';
        ctx.lineWidth = 5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bcx, bcy, br - 5, bStart + redBoostRatio * bTotal, bStart + bTotal);
        ctx.strokeStyle = '#ff2233';
        ctx.lineWidth = 5;
        ctx.stroke();

        // ブースト計目盛り (-1, -0.5, 0, 0.5, 1.0, 1.5, 2.0)
        const bSteps = 6;
        ctx.font = 'italic 800 9.5px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= bSteps; i++) {
            const ratio = i / bSteps;
            const ang = bStart + ratio * bTotal;
            const val = bMin + ratio * (bMax - bMin);
            const isMajor = (i % 2 === 0);
            const r1 = br - 3;
            const r2 = isMajor ? (br - 11) : (br - 8);

            ctx.beginPath();
            ctx.moveTo(bcx + Math.cos(ang) * r1, bcy + Math.sin(ang) * r1);
            ctx.lineTo(bcx + Math.cos(ang) * r2, bcy + Math.sin(ang) * r2);
            ctx.strokeStyle = (val >= 1.2) ? '#ff3344' : '#ffffff';
            ctx.lineWidth = isMajor ? 2.0 : 1.2;
            ctx.stroke();

            if (isMajor) {
                const tx = bcx + Math.cos(ang) * (br - 19);
                const ty = bcy + Math.sin(ang) * (br - 19);
                ctx.fillStyle = (val >= 1.2) ? '#ff4455' : (val < 0 ? '#66e0ff' : '#ffffff');
                ctx.fillText(val > 0 ? `+${val}` : String(val), tx, ty);
            }
        }

        ctx.fillStyle = '#ffbb00';
        ctx.font = 'italic 900 9px "Rajdhani", sans-serif';
        ctx.fillText('TURBO', bcx, bcy - 13);
        ctx.fillStyle = '#88a0b8';
        ctx.font = 'bold 7.5px "Rajdhani", sans-serif';
        ctx.fillText('x100kPa', bcx, bcy + 16);

        // ブースト指針
        const boostRatio = Math.max(0, Math.min(1, (this.smoothBoost - bMin) / (bMax - bMin)));
        const bNeedleAng = bStart + boostRatio * bTotal;
        ctx.save();
        ctx.translate(bcx, bcy);
        ctx.rotate(bNeedleAng);
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.lineTo(br - 6, 0);
        ctx.lineTo(-8, 2);
        ctx.closePath();
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(bcx, bcy, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#1b232d';
        ctx.strokeStyle = '#99aabb';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        // =====================================================================
        // STEP 3: ベゼル外付けボルトオン・大型赤色シフトアップ警告パイロットランプ
        // =====================================================================
        const slx = 205;
        const sly = 40;
        const slr = 16;

        // 取り付けステー金具
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(slx + 6, sly + 10);
        ctx.lineTo(cx - 68, cy - 86);
        ctx.strokeStyle = '#445262';
        ctx.lineWidth = 10;
        ctx.stroke();

        // ランプ円筒クロームベゼル
        ctx.beginPath();
        ctx.arc(slx, sly, slr + 4, 0, Math.PI * 2);
        ctx.fillStyle = '#28323e';
        ctx.fill();
        ctx.strokeStyle = '#8fa2b8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ルビーレンズ（シフト回転域で点灯し、レッドゾーン突入でストロボ発光！）
        const shiftWarnZone = curRpm >= redlineRpm * 0.90;
        const lampActive = shiftWarnZone && (!inRedzone || blinkOn);
        const lensGrad = ctx.createRadialGradient(slx - 4, sly - 4, 2, slx, sly, slr);
        if (lampActive) {
            lensGrad.addColorStop(0, '#ffffff');
            lensGrad.addColorStop(0.35, '#ff3333');
            lensGrad.addColorStop(1, '#aa0000');
        } else {
            lensGrad.addColorStop(0, '#661118');
            lensGrad.addColorStop(0.6, '#2a0408');
            lensGrad.addColorStop(1, '#120103');
        }

        ctx.beginPath();
        ctx.arc(slx, sly, slr, 0, Math.PI * 2);
        ctx.fillStyle = lensGrad;
        if (lampActive) {
            ctx.shadowColor = '#ff1122';
            ctx.shadowBlur = 24;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        if (shiftWarnZone) {
            ctx.fillStyle = blinkOn ? '#ffea00' : '#ff2233';
            ctx.font = 'italic 900 13px "Rajdhani", sans-serif';
            ctx.textAlign = 'right';
            ctx.shadowColor = '#ff1122';
            ctx.shadowBlur = 10;
            ctx.fillText('SHIFT UP!!', slx - 23, sly + 4);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = '#889bb0';
            ctx.font = 'italic 900 9.5px "Rajdhani", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('SHIFT', slx - 23, sly + 3);
        }
        ctx.restore();

        // =====================================================================
        // STEP 4: メイン 11,000 RPM タコメーター（3D多層クロームベゼル＋カーボン文字盤）
        // =====================================================================
        // ドロップシャドウ（ブースト計とスピードウイングの上に立体的に重なる）
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 13, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = -5;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#10151c';
        ctx.fill();
        ctx.restore();

        // 外周3D削り出しチタン＆クロームベゼル
        const outerGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
        outerGrad.addColorStop(0, '#96a8bc');
        outerGrad.addColorStop(0.25, '#394554');
        outerGrad.addColorStop(0.55, '#151b24');
        outerGrad.addColorStop(0.85, '#2c3644');
        outerGrad.addColorStop(1, '#687a8e');

        ctx.beginPath();
        ctx.arc(cx, cy, radius + 13, 0, Math.PI * 2);
        ctx.fillStyle = outerGrad;
        ctx.fill();
        ctx.strokeStyle = '#070a0f';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // ベゼル外周の6角ソケットボルト
        for (let b = 0; b < 6; b++) {
            const bAngle = (b / 6) * Math.PI * 2 + Math.PI / 6;
            const bx = cx + Math.cos(bAngle) * (radius + 7.5);
            const by = cy + Math.sin(bAngle) * (radius + 7.5);
            ctx.beginPath();
            ctx.arc(bx, by, 2.8, 0, Math.PI * 2);
            ctx.fillStyle = '#121820';
            ctx.fill();
            ctx.strokeStyle = '#8899aa';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 内側メタリックベベルリング
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = inRedzone ? '#ff2233' : '#00e5ff';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = inRedzone ? '#ff1122' : '#00e5ff';
        ctx.shadowBlur = inRedzone ? 14 : 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // カーボンファイバー文字盤フェイス
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = carbonPat || '#080c12';
        ctx.fill();

        // 文字盤の立体インナーシャドウ・ビネット
        const faceVignette = ctx.createRadialGradient(cx, cy, radius * 0.45, cx, cy, radius);
        faceVignette.addColorStop(0, 'rgba(15, 24, 36, 0.15)');
        faceVignette.addColorStop(0.75, 'rgba(5, 8, 14, 0.55)');
        faceVignette.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = faceVignette;
        ctx.fill();

        // =====================================================================
        // STEP 5: 頭文字D ARCADE STAGE スケールリング ＆ 50セグメント発光RPMバー
        // =====================================================================
        const startAngle = Math.PI * 0.68;
        const totalAngle = Math.PI * 1.50;
        const endAngle = startAngle + totalAngle;
        const redStart = startAngle + redRatio * totalAngle;

        // 外周シルバーホワイト・スケールバンド背景（実車の白銀目盛り帯）
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 10, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(220, 232, 245, 0.12)';
        ctx.lineWidth = 16;
        ctx.stroke();

        // レッドゾーン・クリムゾンブロック帯
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 10, redStart, endAngle);
        ctx.strokeStyle = inRedzone ? 'rgba(255, 20, 40, 0.90)' : 'rgba(200, 16, 32, 0.72)';
        ctx.lineWidth = 16;
        ctx.stroke();

        // 動的発光50セグメントRPMバー（外周エッジに沿って鮮やかに光る）
        const segCount = 50;
        const segGap = 0.007;
        const segArc = (totalAngle / segCount) - segGap;
        for (let s = 0; s < segCount; s++) {
            const segPos = (s + 0.5) / segCount;
            if (segPos > rpmRatio) break;

            const a0 = startAngle + s * (totalAngle / segCount);
            const a1 = a0 + segArc;
            let segColor = '#00e5ff';
            if (segPos >= redRatio) {
                segColor = '#ff1122';
            } else if (segPos >= redRatio * 0.84) {
                segColor = '#ffaa00';
            } else if (segPos >= redRatio * 0.55) {
                segColor = '#00ff88';
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius - 5, a0, a1);
            ctx.strokeStyle = segColor;
            ctx.lineWidth = 6.5;
            ctx.shadowColor = segColor;
            ctx.shadowBlur = (segPos >= redRatio * 0.84) ? 8 : 3;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // 精密目盛り（1000rpm太目盛り / 200rpm細目盛り）
        const subTicksPerUnit = 5;
        const totalSubTicks = maxDisplay * subTicksPerUnit;
        for (let t = 0; t <= totalSubTicks; t++) {
            const ratio = t / totalSubTicks;
            const angle = startAngle + ratio * totalAngle;
            const rpmVal = ratio * maxScaleRpm;
            const isThousand = (t % subTicksPerUnit === 0);
            const isRed = rpmVal >= redlineRpm - 10;

            const outerR = radius - 9;
            const innerR = isThousand ? (radius - 24) : (radius - 16);

            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
            ctx.lineTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
            if (isThousand) {
                ctx.strokeStyle = isRed ? '#ff3344' : '#ffffff';
                ctx.lineWidth = 3.0;
            } else {
                ctx.strokeStyle = isRed ? 'rgba(255, 90, 100, 0.9)' : 'rgba(180, 200, 220, 0.72)';
                ctx.lineWidth = 1.3;
            }
            ctx.stroke();
        }

        // 1000rpm毎のアーケード・コンデンスドイタリック数字
        ctx.font = 'italic 900 20px "Teko", "Rajdhani", "Impact", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let r = 0; r <= maxDisplay; r++) {
            const angle = startAngle + (r / maxDisplay) * totalAngle;
            const isRed = (r * 1000) >= redlineRpm;
            const numR = radius - 38;
            const tx = cx + Math.cos(angle) * numR;
            const ty = cy + Math.sin(angle) * numR;

            ctx.fillStyle = isRed ? '#ff3344' : '#f4f8ff';
            if (isRed) {
                ctx.shadowColor = '#ff1122';
                ctx.shadowBlur = 8;
            }
            ctx.fillText(String(r), tx, ty);
            ctx.shadowBlur = 0;
        }

        // =====================================================================
        // STEP 6: 文字盤内エンブレム ＆ DRIFT/GUTTERインジケーター ＆ 盤面内蔵ギア表示ボックス
        // =====================================================================
        const badgeText = this.player.carModelCode || 'PROJECT.D';
        ctx.fillStyle = '#ffbb00';
        ctx.font = 'italic 900 15px "Rajdhani", sans-serif';
        ctx.fillText(badgeText, cx, cy - 38);

        ctx.fillStyle = '#8aa0b8';
        ctx.font = 'bold 9.5px "Rajdhani", sans-serif';
        ctx.fillText('x1000 r/min', cx, cy - 25);

        // 盤面内「DRIFT」＆「GUTTER」パイロットランプ（実車メーター内警告灯風）
        const isDrifting = !!this.player.isDrifting;
        const isGutter = !!this.player.isGutterRun;

        // DRIFT ランプ (中心左)
        ctx.fillStyle = isDrifting ? 'rgba(255, 160, 0, 0.22)' : 'rgba(20, 28, 38, 0.65)';
        ctx.strokeStyle = isDrifting ? '#ffaa00' : 'rgba(90, 110, 130, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cx - 64, cy - 9, 40, 15, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isDrifting ? '#ffdd33' : '#445566';
        ctx.font = 'italic 900 9.5px "Rajdhani", sans-serif';
        if (isDrifting) {
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 8;
        }
        ctx.fillText('DRIFT', cx - 44, cy - 1);
        ctx.shadowBlur = 0;

        // GUTTER ランプ (中心右)
        ctx.fillStyle = isGutter ? 'rgba(0, 229, 255, 0.22)' : 'rgba(20, 28, 38, 0.65)';
        ctx.strokeStyle = isGutter ? '#00e5ff' : 'rgba(90, 110, 130, 0.35)';
        ctx.beginPath();
        ctx.roundRect(cx + 24, cy - 9, 42, 15, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = isGutter ? '#70ffff' : '#445566';
        if (isGutter) {
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 8;
        }
        ctx.fillText('GUTTER', cx + 45, cy - 1);
        ctx.shadowBlur = 0;

        // ★頭文字D ARCADE STAGE 象徴：タコメーター盤面下部内蔵 ギアポジション＆MT/AT統合ウィンドウ
        const gx = cx - 44;
        const gy = cy + 24;
        const gw = 88;
        const gh = 54;

        const gBoxGrad = ctx.createLinearGradient(gx, gy, gx, gy + gh);
        gBoxGrad.addColorStop(0, '#0a0f16');
        gBoxGrad.addColorStop(1, '#04060a');

        ctx.beginPath();
        ctx.roundRect(gx, gy, gw, gh, 6);
        ctx.fillStyle = gBoxGrad;
        ctx.fill();
        ctx.strokeStyle = inRedzone ? '#ff3344' : '#ffaa00';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 左半分：MT/AT バッジ + GEAR ラベル + RPMデジタル数値
        ctx.fillStyle = '#00d8ff';
        ctx.beginPath();
        ctx.roundRect(gx + 6, gy + 6, 28, 13, 2);
        ctx.fill();
        ctx.fillStyle = '#001018';
        ctx.font = '900 9.5px "Rajdhani", sans-serif';
        ctx.fillText(transStr, gx + 20, gy + 13);

        ctx.fillStyle = '#8fa4bc';
        ctx.font = 'bold 9px "Rajdhani", sans-serif';
        ctx.fillText('GEAR', gx + 20, gy + 26);

        ctx.fillStyle = inRedzone ? '#ff4455' : '#00e5ff';
        ctx.font = 'italic 800 10.5px "Rajdhani", monospace';
        ctx.fillText(`${Math.round(curRpm)}`, gx + 23, gy + 42);

        // 右半分：大型発光ギア数字 (1〜6 / N)
        ctx.fillStyle = 'rgba(255, 190, 0, 0.10)';
        ctx.font = 'italic 700 48px "Teko", "Rajdhani", sans-serif';
        ctx.fillText('8', gx + 65, gy + 30);

        ctx.fillStyle = inRedzone ? '#ff3344' : '#ffdd22';
        ctx.shadowColor = inRedzone ? '#ff1122' : '#ffaa00';
        ctx.shadowBlur = 12;
        ctx.fillText(gearStr, gx + 65, gy + 30);
        ctx.shadowBlur = 0;

        // =====================================================================
        // STEP 7: 3D 透過照明ポインターニードル（ドロップシャドウ＋ホワイトホットコア）
        // =====================================================================
        const needleAngle = startAngle + rpmRatio * totalAngle;

        // 指針のドロップシャドウ
        ctx.save();
        ctx.translate(cx + 3, cy + 4);
        ctx.rotate(needleAngle);
        ctx.beginPath();
        ctx.moveTo(-24, -3.5);
        ctx.lineTo(radius - 12, 0);
        ctx.lineTo(-24, 3.5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.70)';
        ctx.fill();
        ctx.restore();

        // 指針本体
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle);

        // カウンターウェイト
        ctx.beginPath();
        ctx.moveTo(-25, -4.5);
        ctx.lineTo(-4, -3.5);
        ctx.lineTo(-4, 3.5);
        ctx.lineTo(-25, 4.5);
        ctx.closePath();
        ctx.fillStyle = '#222a34';
        ctx.fill();

        // 発光クリムゾンブレード
        ctx.beginPath();
        ctx.moveTo(-8, -4.2);
        ctx.lineTo(radius - 10, 0);
        ctx.lineTo(-8, 4.2);
        ctx.closePath();
        ctx.fillStyle = '#ff1818';
        ctx.shadowColor = '#ff2222';
        ctx.shadowBlur = 15;
        ctx.fill();

        // ホワイトホット・コアライン
        ctx.beginPath();
        ctx.moveTo(-4, -1.2);
        ctx.lineTo(radius - 16, 0);
        ctx.lineTo(-4, 1.2);
        ctx.closePath();
        ctx.fillStyle = '#fff6f6';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.restore();

        // 削り出しアルミ・センタースピンドルキャップ
        const capGrad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 15);
        capGrad.addColorStop(0, '#5c6b7e');
        capGrad.addColorStop(0.6, '#1c232d');
        capGrad.addColorStop(1, '#0b0f15');

        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.fillStyle = capGrad;
        ctx.fill();
        ctx.strokeStyle = '#99aabb';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = inRedzone ? '#ff2222' : '#ffaa00';
        ctx.fill();

        // ドームガラスレンズの光沢ハイライト（本物のガラスカバーの映り込み）
        const glassGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.14)');
        glassGrad.addColorStop(0.5, 'rgba(200, 235, 255, 0.04)');
        glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 2, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fillStyle = glassGrad;
        ctx.fill();

        // =====================================================================
        // STEP 8: 右サイド外周・頭文字Dアーケード仕様 セグメント式ペダルゲージ (ACC / BRK)
        // =====================================================================
        const pBottomAng = Math.PI * 0.22;
        const pTopAng = -Math.PI * 0.24;
        const pSpan = pBottomAng - pTopAng;
        const pSegs = 16;
        const pGap = 0.008;
        const pStep = pSpan / pSegs;

        // 外側アーク：ACCEL (シアン〜エメラルドグリーン)
        const accOuterR = radius + 21;
        // 内側アーク：BRAKE (オレンジ〜クリムゾンレッド)
        const brkInnerR = radius + 15;

        for (let s = 0; s < pSegs; s++) {
            const segRatio = (s + 0.5) / pSegs;
            const a1 = pBottomAng - s * pStep;
            const a0 = a1 - (pStep - pGap);

            // ACCEL セグメント
            const accOn = throttle >= segRatio;
            ctx.beginPath();
            ctx.arc(cx, cy, accOuterR, a0, a1);
            ctx.strokeStyle = accOn ? (segRatio > 0.8 ? '#00ff88' : '#00e5ff') : 'rgba(20, 32, 44, 0.75)';
            ctx.lineWidth = 4.5;
            if (accOn) {
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 5;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            // BRAKE セグメント
            const brkOn = brake >= segRatio;
            ctx.beginPath();
            ctx.arc(cx, cy, brkInnerR, a0, a1);
            ctx.strokeStyle = brkOn ? '#ff2233' : 'rgba(36, 18, 22, 0.75)';
            ctx.lineWidth = 4.0;
            if (brkOn) {
                ctx.shadowColor = '#ff2233';
                ctx.shadowBlur = 5;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        const pLabelX = cx + Math.cos(pBottomAng + 0.08) * (accOuterR - 4);
        const pLabelY = cy + Math.sin(pBottomAng + 0.08) * (accOuterR - 4);
        ctx.font = 'italic 900 8.5px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00e5ff';
        ctx.fillText('ACC', pLabelX + 8, pLabelY + 2);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('BRK', pLabelX - 14, pLabelY + 2);
    }

    /**
     * 本物の走り屋仕様：フレームレス独立3連 Defi-Link BF 追加メーター描画
     */
    renderSubMeters() {
        const w = this.oilPressCanvas ? this.oilPressCanvas.width : 92;
        const h = this.oilPressCanvas ? this.oilPressCanvas.height : 92;

        // 1. 油圧計 (OIL PRESS: 0〜8 bar, 1.8以下ワーニング)
        const barVal = this.player.oilPressure / 100;
        this.drawSubGauge(this.oilPressCtx, w, h, barVal, 0, 8, 'bar', 1.8, 'OIL.P', true);

        // 2. 水温計 (WATER TEMP: 40〜120 ℃, 102℃以上ワーニング)
        this.drawSubGauge(this.waterTempCtx, w, h, this.player.waterTemp, 40, 120, '℃', 102, 'WATER', false);

        // 3. 油温計 (OIL TEMP: 50〜150 ℃, 118℃以上ワーニング)
        this.drawSubGauge(this.oilTempCtx, w, h, this.player.oilTemp, 50, 150, '℃', 118, 'OIL.T', false);
    }

    /**
     * アナログサブメーター（Defi-Link Meter BF 独立3Dベゼル仕様）描画ヘルパー
     */
    drawSubGauge(ctx, w, h, val, minVal, maxVal, unit, redZoneVal, label, isLowerRed = false) {
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const radius = w * 0.41;
        const carbonPat = this.getCarbonPattern(ctx);

        // 1. 3D削り出しアルミ＆ガンメタルベゼル（独立丸型メーターケース）
        const bezelGrad = ctx.createLinearGradient(0, 0, w, h);
        bezelGrad.addColorStop(0, '#8899ad');
        bezelGrad.addColorStop(0.35, '#2b3644');
        bezelGrad.addColorStop(0.75, '#10151c');
        bezelGrad.addColorStop(1, '#4c5b6c');

        ctx.beginPath();
        ctx.arc(cx, cy, radius + 5, 0, Math.PI * 2);
        ctx.fillStyle = bezelGrad;
        ctx.fill();
        ctx.strokeStyle = '#070a0f';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 2. 文字盤カーボンブラックフェイス
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = carbonPat || '#070a0f';
        ctx.fill();

        // 3. アーク目盛り（270度円弧：PI * 0.75 〜 PI * 2.25）
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;

        // BFシアン・背景トラック
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, startAngle, startAngle + totalAngle);
        ctx.strokeStyle = 'rgba(0, 220, 255, 0.25)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // レッドゾーン
        const redRatio = Math.max(0, Math.min(1, (redZoneVal - minVal) / (maxVal - minVal)));
        ctx.beginPath();
        if (isLowerRed) {
            ctx.arc(cx, cy, radius - 4, startAngle, startAngle + redRatio * totalAngle);
        } else {
            ctx.arc(cx, cy, radius - 4, startAngle + redRatio * totalAngle, startAngle + totalAngle);
        }
        ctx.strokeStyle = '#ff2233';
        ctx.lineWidth = 4.5;
        ctx.stroke();

        // 4. 目盛り＆数値
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const angle = startAngle + ratio * totalAngle;
            const tickVal = minVal + ratio * (maxVal - minVal);

            const x1 = cx + Math.cos(angle) * (radius - 2);
            const y1 = cy + Math.sin(angle) * (radius - 2);
            const x2 = cx + Math.cos(angle) * (radius - 8.5);
            const y2 = cy + Math.sin(angle) * (radius - 8.5);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = (isLowerRed ? tickVal <= redZoneVal : tickVal >= redZoneVal) ? '#ff3333' : '#e8f8ff';
            ctx.lineWidth = 1.6;
            ctx.stroke();

            // 数字
            const tx = cx + Math.cos(angle) * (radius - 16);
            const ty = cy + Math.sin(angle) * (radius - 16);
            ctx.fillStyle = '#d8f0ff';
            ctx.font = 'bold 9px "Rajdhani", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(tickVal), tx, ty);
        }

        // 単位のみ中央下部にスッキリ表示
        ctx.fillStyle = '#88a4c0';
        ctx.font = 'bold 8.5px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit, cx, cy + 16);

        // 5. 赤色ネオンニードル（指針）
        const valRatio = Math.max(0, Math.min(1.0, (val - minVal) / (maxVal - minVal)));
        const needleAngle = startAngle + valRatio * totalAngle;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle);

        ctx.beginPath();
        ctx.moveTo(-5, -1.8);
        ctx.lineTo(radius - 4, 0);
        ctx.lineTo(-5, 1.8);
        ctx.closePath();
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 7;
        ctx.fill();
        ctx.restore();

        // センターキャップ
        ctx.beginPath();
        ctx.arc(cx, cy, 4.8, 0, Math.PI * 2);
        ctx.fillStyle = '#18222c';
        ctx.strokeStyle = '#99aabb';
        ctx.lineWidth = 1.4;
        ctx.fill();
        ctx.stroke();

        // PEAKワーニングLEDランプ
        const isWarning = isLowerRed ? (val <= redZoneVal) : (val >= redZoneVal);
        if (isWarning) {
            const blink = Math.floor(Date.now() / 90) % 2 === 0;
            if (blink) {
                ctx.beginPath();
                ctx.arc(cx, cy - 9, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    renderMinimap() {
        if (!this.minimapCtx) return;
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(10, 15, 20, 0.65)';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(100, 150, 200, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, w - 2, h - 2);

        const scaleX = (w - 24) / (this.mapMaxX - this.mapMinX);
        const scaleZ = (h - 24) / (this.mapMaxZ - this.mapMinZ);

        ctx.beginPath();
        for (let i = 0; i < this.track.samples.length; i++) {
            const s = this.track.samples[i];
            const mx = 12 + (s.pos.x - this.mapMinX) * scaleX;
            const my = 12 + (s.pos.z - this.mapMinZ) * scaleZ;
            if (i === 0) ctx.moveTo(mx, my);
            else ctx.lineTo(mx, my);
        }
        ctx.strokeStyle = '#556677';
        ctx.lineWidth = 4;
        ctx.stroke();

        // コーナー部分のハイライト
        ctx.beginPath();
        const startH = Math.floor(this.track.samples.length * 0.35);
        const endH = Math.floor(this.track.samples.length * 0.85);
        for (let i = startH; i <= endH; i++) {
            const s = this.track.samples[i];
            const mx = 12 + (s.pos.x - this.mapMinX) * scaleX;
            const my = 12 + (s.pos.z - this.mapMinZ) * scaleZ;
            if (i === startH) ctx.moveTo(mx, my);
            else ctx.lineTo(mx, my);
        }
        ctx.strokeStyle = '#cc8800';
        ctx.lineWidth = 4;
        ctx.stroke();

        // ライバル位置
        const rPos = this.rival.position;
        const rmx = 12 + (rPos.x - this.mapMinX) * scaleX;
        const rmy = 12 + (rPos.z - this.mapMinZ) * scaleZ;
        ctx.beginPath();
        ctx.arc(rmx, rmy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcc00';
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 6;
        ctx.fill();

        // プレイヤー位置
        const pPos = this.player.position;
        const pmx = 12 + (pPos.x - this.mapMinX) * scaleX;
        const pmy = 12 + (pPos.z - this.mapMinZ) * scaleZ;
        ctx.beginPath();
        ctx.arc(pmx, pmy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#3388ff';
        ctx.shadowBlur = 8;
        ctx.fill();
    }

    /**
     * 高速走行時の頭文字D風 放射状集中スピードライン演出
     */
    renderSpeedLines() {
        if (!this.speedLinesCtx || !this.speedLinesCanvas) return;
        const ctx = this.speedLinesCtx;
        const w = this.speedLinesCanvas.width;
        const h = this.speedLinesCanvas.height;

        ctx.clearRect(0, 0, w, h);

        const speed = this.player.speed;
        // 100km/h以上でスピード集中線を描画（速度が上がるほど激しく放射）
        if (speed < 100) return;

        const speedRatio = Math.min(1.0, (speed - 100) / 75);
        const lineCount = Math.floor(16 + speedRatio * 44);
        const cx = w * 0.5;
        const cy = h * 0.46;
        const maxDist = Math.hypot(cx, cy);

        ctx.save();
        for (let i = 0; i < lineCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);

            // 画面中心周辺は車の視界を邪魔しないよう開け、外側へ向けて走る
            const innerDist = maxDist * (0.34 + Math.random() * 0.32);
            const lineLen = (110 + speedRatio * 230) * (0.7 + Math.random() * 0.6);
            const outerDist = innerDist + lineLen;

            const x1 = cx + cos * innerDist;
            const y1 = cy + sin * innerDist;
            const x2 = cx + cos * outerDist;
            const y2 = cy + sin * outerDist;

            const alpha = (0.16 + speedRatio * 0.48) * (0.5 + Math.random() * 0.5);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = speed > 160 ? `rgba(200, 240, 255, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 1.0 + Math.random() * (1.2 + speedRatio * 2.2);
            ctx.stroke();
        }
        ctx.restore();
    }

    showCountdown(count, text) {
        if (!this.countdownElem) return;
        this.countdownElem.style.display = 'block';
        this.countdownElem.textContent = text || count;
        this.countdownElem.className = 'countdown-anim';
        if (count === 0) {
            setTimeout(() => {
                this.countdownElem.style.display = 'none';
            }, 800);
        }
    }

    showResult(isWin, timeStr) {
        this.isFinished = true;
        if (!this.resultOverlayElem) return;
        this.resultOverlayElem.style.display = 'flex';
        const title = document.getElementById('result-title');
        const time = document.getElementById('result-time');
        if (title) {
            title.textContent = isWin ? 'WINNER - SPECIAL STAGE!' : 'LOSE - TRY AGAIN!';
            title.style.color = isWin ? '#ffcc00' : '#ff3333';
        }
        if (time) {
            time.textContent = `TIME: ${timeStr}`;
        }
    }
}

window.HUD = HUD;
