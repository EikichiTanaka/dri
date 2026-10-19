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
     * 3D六角ソケットボルト（キャップスクリュー）描画ヘルパー
     */
    drawHexBolt(ctx, x, y, r = 3.0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, r + 1.0, 0, Math.PI * 2);
        ctx.fillStyle = '#0c1016';
        ctx.fill();

        const bGrad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
        bGrad.addColorStop(0, '#c8d6e5');
        bGrad.addColorStop(0.5, '#4a5868');
        bGrad.addColorStop(1, '#1e2630');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = bGrad;
        ctx.fill();

        // 内側六角穴
        ctx.beginPath();
        const hr = r * 0.52;
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
            const hx = x + Math.cos(a) * hr;
            const hy = y + Math.sin(a) * hr;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fillStyle = '#090d12';
        ctx.fill();
        ctx.restore();
    }

    /**
     * ★頭文字D ARCADE STAGE 完全再現マスターメータークラスター描画 (540x340 HiDPI 一体成形)
     * 1. 左下：3D削り出しチタン・デジタルスピードメーター＆3連デジタルマルチテレメトリーウイング
     *    - 上段：頭文字Dアーケード象徴「DRIFT」シェブロン発光ランプ ＆ 10連シーケンシャルREVインジケーター
     *    - 中段：超高輝度VFD 7セグメントイタリックデジタル速度計 (km/h)
     *    - 下段：Defi Advance ZD風 3連デジタルマルチモニター (OIL.P / WATER / OIL.T)
     * 2. 左上オーバーラップ：頭文字D公式アナログブースト計 (BOOST ×100kPa, -1.0〜+2.0, デジタル過給圧窓付)
     * 3. ベゼル左肩ボルトオン：大型フレネルルビーレンズ・シフトアップ警告ランプ (SHIFT UP!!)
     * 4. メイン11,000RPM TRD/Smiths 頭文字D仕様タコメーター (多層クロームベゼル + 60セグメント発光RPMバー + 盤面下部ギア窓)
     * 5. 右外周：チタンハウジング付 18セグメント湾曲ペダルテレメトリーゲージ (ACC / BRK)
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
        const shiftWarnZone = curRpm >= redlineRpm * 0.89;
        const inRedzone = curRpm >= redlineRpm * 0.95;
        const blinkOn = Math.floor(Date.now() / 60) % 2 === 0;
        const throttle = Math.max(0, Math.min(1, this.player.throttle || 0));
        const brake = Math.max(0, Math.min(1, this.player.brake || 0));
        const speedInt = Math.floor(this.player.speed || 0);
        const gearStr = (this.player.gear === 0) ? 'N' : String(this.player.gear || 1);
        const transStr = this.player.isAutomatic ? 'AT' : 'MT';
        const isDrifting = !!this.player.isDrifting;
        const isGutter = !!this.player.isGutterRun;

        // 過給圧（ブースト / バキューム圧：-0.75 〜 +1.35 ×100kPa）の滑らか算出
        const targetBoost = -0.68 + throttle * (0.95 + Math.pow(rpmRatio, 1.35) * 1.12);
        this.smoothBoost = (this.smoothBoost === undefined)
            ? targetBoost
            : this.smoothBoost + (targetBoost - this.smoothBoost) * 0.16;

        const barVal = (this.player.oilPressure || 580) / 100;
        const waterVal = this.player.waterTemp || 88;
        const oilTempVal = this.player.oilTemp || 96;

        ctx.clearRect(0, 0, w, h);
        const carbonPat = this.getCarbonPattern(ctx);

        // メインタコメーターの中心座標＆半径
        const cx = 372;
        const cy = 180;
        const radius = 128;

        // =====================================================================
        // STEP 1: 左下スカルプト・アーケードデジタルスピードメーター＆マルチテレメトリーウイング
        // =====================================================================
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.90)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetX = -5;
        ctx.shadowOffsetY = 5;

        // 外側削り出しチタン＆クロームベゼル
        const wingGrad = ctx.createLinearGradient(12, 180, 290, 326);
        wingGrad.addColorStop(0, '#c4d4e4');
        wingGrad.addColorStop(0.18, '#586a7e');
        wingGrad.addColorStop(0.55, '#1d2530');
        wingGrad.addColorStop(0.85, '#344252');
        wingGrad.addColorStop(1, '#788b9f');

        ctx.beginPath();
        ctx.moveTo(32, 182);
        ctx.lineTo(286, 182);
        ctx.lineTo(274, 326);
        ctx.lineTo(18, 326);
        ctx.lineTo(8, 308);
        ctx.lineTo(20, 198);
        ctx.closePath();
        ctx.fillStyle = wingGrad;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#070a0f';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 4隅の六角ソケットボルト
        this.drawHexBolt(ctx, 28, 191, 2.6);
        this.drawHexBolt(ctx, 250, 191, 2.6);
        this.drawHexBolt(ctx, 20, 316, 2.6);
        this.drawHexBolt(ctx, 244, 316, 2.6);

        // 内側ダークVFD液晶ベベル窓
        ctx.beginPath();
        ctx.moveTo(36, 191);
        ctx.lineTo(264, 191);
        ctx.lineTo(254, 316);
        ctx.lineTo(26, 316);
        ctx.lineTo(18, 302);
        ctx.lineTo(28, 204);
        ctx.closePath();
        const vfdGrad = ctx.createLinearGradient(20, 191, 20, 316);
        vfdGrad.addColorStop(0, '#04070c');
        vfdGrad.addColorStop(0.5, '#091018');
        vfdGrad.addColorStop(1, '#030509');
        ctx.fillStyle = vfdGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(140, 185, 225, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // --- 上段左：頭文字D ARCADE STAGE 象徴「DRIFT」シェブロン発光ランプ ---
        ctx.fillStyle = isDrifting ? 'rgba(0, 255, 110, 0.22)' : 'rgba(16, 24, 34, 0.85)';
        ctx.strokeStyle = isDrifting ? '#00ff88' : 'rgba(90, 115, 140, 0.35)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.roundRect(34, 197, 74, 16, 3);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'italic 900 11px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isDrifting ? '#44ff99' : '#44586c';
        if (isDrifting) {
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
        }
        ctx.fillText('» DRIFT «', 71, 205.5);
        ctx.shadowBlur = 0;

        // --- 上段右：10連シーケンシャルREVインジケーターバー ---
        ctx.fillStyle = '#030508';
        ctx.fillRect(114, 198, 138, 14);
        ctx.strokeStyle = 'rgba(110, 140, 175, 0.35)';
        ctx.lineWidth = 1;
        ctx.strokeRect(114, 198, 138, 14);

        const revStart = redlineRpm * 0.48;
        const revSpan = Math.max(500, redlineRpm * 0.95 - revStart);
        const revProg = Math.max(0, Math.min(1, (curRpm - revStart) / revSpan));
        const totalLeds = 10;
        const activeLeds = Math.floor(revProg * totalLeds + 0.05);

        for (let i = 0; i < totalLeds; i++) {
            const lx = 117 + i * 13.4;
            const ly = 200.5;
            const isOn = inRedzone ? blinkOn : (i < activeLeds);
            let ledColor = '#00ff88';
            if (i >= 7) ledColor = '#ff1828';
            else if (i >= 4) ledColor = '#ffbb00';

            ctx.fillStyle = isOn ? ledColor : 'rgba(24, 34, 46, 0.95)';
            if (isOn) {
                ctx.shadowColor = ledColor;
                ctx.shadowBlur = 7;
            }
            ctx.fillRect(lx, ly, 10.8, 9);
            ctx.shadowBlur = 0;
        }

        // --- 中段：超高輝度VFD 7セグメントイタリックデジタル速度計 (km/h) ---
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(30, 219, 4.5, 62);
        ctx.font = 'italic 900 10.5px "Rajdhani", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#9cb4cc';
        ctx.fillText('SPEED', 40, 229);

        if (isGutter) {
            ctx.fillStyle = 'rgba(0, 229, 255, 0.22)';
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.roundRect(38, 235, 48, 15, 3);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#70ffff';
            ctx.font = 'italic 900 9.5px "Rajdhani", sans-serif';
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 8;
            ctx.fillText('GUTTER', 43, 246);
            ctx.shadowBlur = 0;
        }

        ctx.textAlign = 'right';
        ctx.textBaseline = 'alphabetic';
        ctx.font = 'italic 700 76px "Teko", "Rajdhani", "Impact", sans-serif';
        ctx.fillStyle = 'rgba(180, 225, 255, 0.06)';
        ctx.fillText('888', 186, 281);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 225, 255, 0.85)';
        ctx.shadowBlur = 14;
        ctx.fillText(String(speedInt), 186, 281);
        ctx.shadowBlur = 0;

        ctx.textAlign = 'left';
        ctx.font = 'italic 900 18.5px "Rajdhani", sans-serif';
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
        ctx.shadowBlur = 6;
        ctx.fillText('km/h', 190, 280);
        ctx.shadowBlur = 0;

        // --- 下段：Defi Advance ZD風 3連デジタルマルチモニターバー (OIL.P / WATER / OIL.T) ---
        ctx.fillStyle = 'rgba(4, 7, 12, 0.95)';
        ctx.strokeStyle = 'rgba(90, 125, 160, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(28, 287, 220, 23, 3);
        ctx.fill();
        ctx.stroke();

        // セル区切り線
        ctx.beginPath();
        ctx.moveTo(101, 289);
        ctx.lineTo(101, 308);
        ctx.moveTo(174, 289);
        ctx.lineTo(174, 308);
        ctx.strokeStyle = 'rgba(90, 125, 160, 0.35)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.textBaseline = 'middle';
        // OIL.P
        ctx.textAlign = 'left';
        ctx.font = 'italic 900 8.5px "Rajdhani", sans-serif';
        ctx.fillStyle = '#00d8ff';
        ctx.fillText('OIL.P', 33, 298.5);
        ctx.textAlign = 'right';
        ctx.font = 'italic 900 11.5px "Rajdhani", monospace';
        ctx.fillStyle = barVal <= 1.8 ? '#ff3344' : '#ffdd44';
        ctx.fillText(`${barVal.toFixed(1)}b`, 97, 298.5);

        // WATER
        ctx.textAlign = 'left';
        ctx.font = 'italic 900 8.5px "Rajdhani", sans-serif';
        ctx.fillStyle = '#00d8ff';
        ctx.fillText('WATER', 105, 298.5);
        ctx.textAlign = 'right';
        ctx.font = 'italic 900 11.5px "Rajdhani", monospace';
        ctx.fillStyle = waterVal >= 102 ? '#ff3344' : '#ffdd44';
        ctx.fillText(`${Math.round(waterVal)}℃`, 170, 298.5);

        // OIL.T
        ctx.textAlign = 'left';
        ctx.font = 'italic 900 8.5px "Rajdhani", sans-serif';
        ctx.fillStyle = '#00d8ff';
        ctx.fillText('OIL.T', 178, 298.5);
        ctx.textAlign = 'right';
        ctx.font = 'italic 900 11.5px "Rajdhani", monospace';
        ctx.fillStyle = oilTempVal >= 118 ? '#ff3344' : '#ffdd44';
        ctx.fillText(`${Math.round(oilTempVal)}℃`, 244, 298.5);

        // ガラス光沢ハイライト
        const spGlass = ctx.createLinearGradient(28, 191, 90, 250);
        spGlass.addColorStop(0, 'rgba(255, 255, 255, 0.09)');
        spGlass.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.fillStyle = spGlass;
        ctx.fillRect(30, 192, 222, 42);
        ctx.restore();

        // =====================================================================
        // STEP 2: 左上オーバーラップ・頭文字D公式アナログブースト計 (BOOST ×100kPa)
        // =====================================================================
        const bcx = 180;
        const bcy = 108;
        const br = 62;

        ctx.save();
        ctx.beginPath();
        ctx.arc(bcx, bcy, br + 10, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.88)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetX = -4;
        ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#10151c';
        ctx.fill();
        ctx.restore();

        // ブースト計3D多層クローム＆ガンメタルベゼル
        const bBezelGrad = ctx.createLinearGradient(bcx - br, bcy - br, bcx + br, bcy + br);
        bBezelGrad.addColorStop(0, '#d8e6f4');
        bBezelGrad.addColorStop(0.25, '#58687a');
        bBezelGrad.addColorStop(0.55, '#1b222c');
        bBezelGrad.addColorStop(0.85, '#3b4858');
        bBezelGrad.addColorStop(1, '#8496a8');

        ctx.beginPath();
        ctx.arc(bcx, bcy, br + 10, 0, Math.PI * 2);
        ctx.fillStyle = bBezelGrad;
        ctx.fill();
        ctx.strokeStyle = '#070a0f';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // ブースト計ベゼルボルト
        for (let b = 0; b < 4; b++) {
            const ba = (b / 4) * Math.PI * 2 + Math.PI / 4;
            this.drawHexBolt(ctx, bcx + Math.cos(ba) * (br + 5.5), bcy + Math.sin(ba) * (br + 5.5), 2.3);
        }

        // 内側メタリックチャプターリング
        ctx.beginPath();
        ctx.arc(bcx, bcy, br + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#a8bed4';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // ブースト計カーボン文字盤
        ctx.beginPath();
        ctx.arc(bcx, bcy, br, 0, Math.PI * 2);
        ctx.fillStyle = carbonPat || '#080c12';
        ctx.fill();

        const bVignette = ctx.createRadialGradient(bcx, bcy, br * 0.35, bcx, bcy, br);
        bVignette.addColorStop(0, 'rgba(10, 18, 28, 0.1)');
        bVignette.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
        ctx.beginPath();
        ctx.arc(bcx, bcy, br, 0, Math.PI * 2);
        ctx.fillStyle = bVignette;
        ctx.fill();

        const bStart = Math.PI * 0.75;
        const bTotal = Math.PI * 1.45;
        const bMin = -1.0;
        const bMax = 2.0;

        // ブースト目盛りトラック（バキューム域：シアン、正圧域：シルバーホワイト、高ブースト域：レッド）
        const zeroRatio = (0 - bMin) / (bMax - bMin);
        const redBoostRatio = (1.2 - bMin) / (bMax - bMin);
        ctx.beginPath();
        ctx.arc(bcx, bcy, br - 6, bStart, bStart + zeroRatio * bTotal);
        ctx.strokeStyle = 'rgba(0, 215, 255, 0.55)';
        ctx.lineWidth = 5.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bcx, bcy, br - 6, bStart + zeroRatio * bTotal, bStart + redBoostRatio * bTotal);
        ctx.strokeStyle = 'rgba(235, 245, 255, 0.42)';
        ctx.lineWidth = 5.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(bcx, bcy, br - 6, bStart + redBoostRatio * bTotal, bStart + bTotal);
        ctx.strokeStyle = '#ff2233';
        ctx.lineWidth = 5.5;
        ctx.stroke();

        // ブースト計細目盛り＆太目盛り
        const bTotalTicks = 18;
        ctx.font = 'italic 900 11px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= bTotalTicks; i++) {
            const ratio = i / bTotalTicks;
            const ang = bStart + ratio * bTotal;
            const val = bMin + ratio * (bMax - bMin);
            const isMajor = (i % 6 === 0);
            const isMed = (i % 3 === 0);
            const r1 = br - 3;
            const r2 = isMajor ? (br - 13) : (isMed ? (br - 9.5) : (br - 7));

            ctx.beginPath();
            ctx.moveTo(bcx + Math.cos(ang) * r1, bcy + Math.sin(ang) * r1);
            ctx.lineTo(bcx + Math.cos(ang) * r2, bcy + Math.sin(ang) * r2);
            ctx.strokeStyle = (val >= 1.2) ? '#ff3344' : '#ffffff';
            ctx.lineWidth = isMajor ? 2.3 : (isMed ? 1.5 : 0.9);
            ctx.stroke();

            if (isMajor) {
                const tx = bcx + Math.cos(ang) * (br - 22);
                const ty = bcy + Math.sin(ang) * (br - 22);
                const rVal = Math.round(val);
                ctx.fillStyle = (rVal >= 1.2) ? '#ff4455' : (rVal < 0 ? '#66e0ff' : '#ffffff');
                ctx.fillText(rVal > 0 ? `+${rVal}` : String(rVal), tx, ty);
            }
        }

        ctx.fillStyle = '#ffbb00';
        ctx.font = 'italic 900 10.5px "Rajdhani", sans-serif';
        ctx.fillText('BOOST', bcx, bcy - 17);
        ctx.fillStyle = '#9cb4cc';
        ctx.font = 'bold 8.5px "Rajdhani", sans-serif';
        ctx.fillText('x100kPa', bcx, bcy + 14);

        // ブースト計盤面下部デジタル過給圧窓
        ctx.fillStyle = 'rgba(4, 8, 14, 0.92)';
        ctx.strokeStyle = 'rgba(100, 140, 180, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(bcx - 22, bcy + 23, 44, 15, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = this.smoothBoost >= 0 ? '#00ffaa' : '#00d8ff';
        ctx.font = 'italic 900 11px "Rajdhani", monospace';
        const bSign = this.smoothBoost >= 0 ? '+' : '';
        ctx.fillText(`${bSign}${this.smoothBoost.toFixed(2)}`, bcx, bcy + 31);

        // ブースト指針
        const boostRatio = Math.max(0, Math.min(1, (this.smoothBoost - bMin) / (bMax - bMin)));
        const bNeedleAng = bStart + boostRatio * bTotal;
        ctx.save();
        ctx.translate(bcx, bcy);
        ctx.rotate(bNeedleAng);
        ctx.beginPath();
        ctx.moveTo(-11, -2.5);
        ctx.lineTo(br - 6, 0);
        ctx.lineTo(-11, 2.5);
        ctx.closePath();
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 9;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-4, -0.8);
        ctx.lineTo(br - 11, 0);
        ctx.lineTo(-4, 0.8);
        ctx.closePath();
        ctx.fillStyle = '#fff5f5';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(bcx, bcy, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#1b232d';
        ctx.strokeStyle = '#b0c2d4';
        ctx.lineWidth = 1.6;
        ctx.fill();
        ctx.stroke();

        // =====================================================================
        // STEP 3: ベゼル左肩ボルトオン・大型フレネルルビーレンズ シフトアップ警告ランプ
        // =====================================================================
        const slx = 266;
        const sly = 34;
        const slr = 18;

        ctx.save();
        // 削り出しアルミ二股ステー金具
        ctx.beginPath();
        ctx.moveTo(slx + 10, sly + 4);
        ctx.lineTo(cx - 66, cy - 106);
        ctx.lineTo(cx - 84, cy - 90);
        ctx.lineTo(slx + 2, sly + 14);
        ctx.closePath();
        const brkGrad = ctx.createLinearGradient(slx, sly, cx - 66, cy - 94);
        brkGrad.addColorStop(0, '#8fa2b6');
        brkGrad.addColorStop(0.5, '#2c3642');
        brkGrad.addColorStop(1, '#586878');
        ctx.fillStyle = brkGrad;
        ctx.fill();
        ctx.strokeStyle = '#0b0f14';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        this.drawHexBolt(ctx, slx + 14, sly + 15, 2.3);

        // 円筒クロームランプフード
        const hoodGrad = ctx.createLinearGradient(slx - slr, sly - slr, slx + slr, sly + slr);
        hoodGrad.addColorStop(0, '#e2edf8');
        hoodGrad.addColorStop(0.35, '#5c6e82');
        hoodGrad.addColorStop(0.7, '#1a222c');
        hoodGrad.addColorStop(1, '#8ca0b4');

        ctx.beginPath();
        ctx.arc(slx, sly, slr + 5, 0, Math.PI * 2);
        ctx.fillStyle = hoodGrad;
        ctx.fill();
        ctx.strokeStyle = '#080b10';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ルビーフレネルレンズ
        const lampActive = shiftWarnZone && (!inRedzone || blinkOn);
        const lensGrad = ctx.createRadialGradient(slx - 4, sly - 4, 2, slx, sly, slr);
        if (lampActive) {
            lensGrad.addColorStop(0, '#ffffff');
            lensGrad.addColorStop(0.3, '#ff4444');
            lensGrad.addColorStop(0.7, '#ff0011');
            lensGrad.addColorStop(1, '#880000');
        } else {
            lensGrad.addColorStop(0, '#77151e');
            lensGrad.addColorStop(0.55, '#33060a');
            lensGrad.addColorStop(1, '#140103');
        }

        ctx.beginPath();
        ctx.arc(slx, sly, slr, 0, Math.PI * 2);
        ctx.fillStyle = lensGrad;
        if (lampActive) {
            ctx.shadowColor = '#ff1122';
            ctx.shadowBlur = 28;
        }
        ctx.fill();
        ctx.shadowBlur = 0;

        // フレネルレンズ同心円カット模様
        for (let fr = 5; fr < slr; fr += 4.5) {
            ctx.beginPath();
            ctx.arc(slx, sly, fr, 0, Math.PI * 2);
            ctx.strokeStyle = lampActive ? 'rgba(255, 230, 230, 0.35)' : 'rgba(180, 40, 50, 0.25)';
            ctx.lineWidth = 0.9;
            ctx.stroke();
        }

        if (shiftWarnZone) {
            ctx.fillStyle = blinkOn ? '#ffea00' : '#ff2233';
            ctx.font = 'italic 900 13.5px "Rajdhani", sans-serif';
            ctx.textAlign = 'right';
            ctx.shadowColor = '#ff1122';
            ctx.shadowBlur = 12;
            ctx.fillText('SHIFT UP!!', slx - 25, sly - 8);
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = '#9cb2c8';
            ctx.font = 'italic 900 10px "Rajdhani", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText('SHIFT LAMP', slx - 25, sly - 8);
        }
        ctx.restore();

        // =====================================================================
        // STEP 4: メイン 11,000 RPM タコメーター（3D多層クロームベゼル＋インナーリフレクター＋カーボン盤面）
        // =====================================================================
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 16, 0, Math.PI * 2);
        ctx.shadowColor = 'rgba(0, 0, 0, 0.92)';
        ctx.shadowBlur = 22;
        ctx.shadowOffsetX = -6;
        ctx.shadowOffsetY = 5;
        ctx.fillStyle = '#0d1218';
        ctx.fill();
        ctx.restore();

        // 外周ステップ1：ガンメタル削り出しフランジリング
        const flangeGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
        flangeGrad.addColorStop(0, '#6c7e92');
        flangeGrad.addColorStop(0.5, '#182028');
        flangeGrad.addColorStop(1, '#3e4c5c');
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 16, 0, Math.PI * 2);
        ctx.fillStyle = flangeGrad;
        ctx.fill();
        ctx.strokeStyle = '#06080c';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 外周8点留め六角ソケットボルト
        for (let b = 0; b < 8; b++) {
            const bAngle = (b / 8) * Math.PI * 2 + Math.PI / 8;
            const bx = cx + Math.cos(bAngle) * (radius + 11.5);
            const by = cy + Math.sin(bAngle) * (radius + 11.5);
            this.drawHexBolt(ctx, bx, by, 2.7);
        }

        // 外周ステップ2：鏡面クロームベゼルリング
        const chromeGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
        chromeGrad.addColorStop(0, '#eef6ff');
        chromeGrad.addColorStop(0.22, '#788a9e');
        chromeGrad.addColorStop(0.48, '#222b36');
        chromeGrad.addColorStop(0.75, '#b8c8d8');
        chromeGrad.addColorStop(1, '#364454');
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 6.5, 0, Math.PI * 2);
        ctx.fillStyle = chromeGrad;
        ctx.fill();
        ctx.strokeStyle = '#10161e';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 内側ステップ3：立体インナーチャプターリング（斜め内壁 Rehaut）
        const rehautGrad = ctx.createLinearGradient(cx + radius, cy + radius, cx - radius, cy - radius);
        rehautGrad.addColorStop(0, '#445264');
        rehautGrad.addColorStop(0.5, '#121820');
        rehautGrad.addColorStop(1, '#06090e');
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 1, 0, Math.PI * 2);
        ctx.fillStyle = rehautGrad;
        ctx.fill();

        // カーボンファイバー文字盤フェイス
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
        ctx.fillStyle = carbonPat || '#080c12';
        ctx.fill();

        // 文字盤外周のサテンブラック目盛りトラック帯
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 22, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(8, 12, 18, 0.85)';
        ctx.lineWidth = 36;
        ctx.stroke();

        // 文字盤の立体インナーシャドウ・ビネット
        const faceVignette = ctx.createRadialGradient(cx, cy, radius * 0.42, cx, cy, radius - 4);
        faceVignette.addColorStop(0, 'rgba(15, 24, 36, 0.05)');
        faceVignette.addColorStop(0.78, 'rgba(4, 7, 12, 0.45)');
        faceVignette.addColorStop(1, 'rgba(0, 0, 0, 0.90)');
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
        ctx.fillStyle = faceVignette;
        ctx.fill();

        // =====================================================================
        // STEP 5: 頭文字D ARCADE STAGE 60セグメント発光RPMバー ＆ TRDレッドゾーン目盛り
        // =====================================================================
        const startAngle = Math.PI * 0.68;
        const totalAngle = Math.PI * 1.50;
        const endAngle = startAngle + totalAngle;
        const redStart = startAngle + redRatio * totalAngle;

        // 1. 外周60セグメント・アーケードRPMバー
        const segCount = 60;
        const segGap = 0.0065;
        const segArc = (totalAngle / segCount) - segGap;
        for (let s = 0; s < segCount; s++) {
            const segPos = (s + 0.5) / segCount;
            const a0 = startAngle + s * (totalAngle / segCount);
            const a1 = a0 + segArc;
            const isLit = segPos <= rpmRatio;

            let segColor = '#00e5ff';
            if (segPos >= redRatio) {
                segColor = '#ff1828';
            } else if (segPos >= redRatio * 0.84) {
                segColor = '#ffaa00';
            } else if (segPos >= redRatio * 0.52) {
                segColor = '#00ff88';
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius - 8.5, a0, a1);
            ctx.strokeStyle = isLit ? segColor : 'rgba(26, 36, 48, 0.75)';
            ctx.lineWidth = 6.2;
            if (isLit && segPos >= redRatio * 0.84) {
                ctx.shadowColor = segColor;
                ctx.shadowBlur = 7;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // 2. 実車TRD/Smiths風 ダブルコンセントリック・スケールライン
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 13.5, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(220, 235, 250, 0.65)';
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, radius - 27, startAngle, redStart);
        ctx.strokeStyle = 'rgba(180, 200, 220, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // 3. レッドゾーン・クリムゾン警告ブロック帯 (8,500〜11,000 RPM)
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 20, redStart, endAngle);
        ctx.strokeStyle = inRedzone ? 'rgba(255, 24, 40, 0.92)' : 'rgba(215, 16, 32, 0.80)';
        ctx.lineWidth = 12;
        ctx.stroke();

        // 4. 精密目盛り（1000rpm太ウェッジ目盛り / 200rpm細目盛り）
        const subTicksPerUnit = 5;
        const totalSubTicks = maxDisplay * subTicksPerUnit;
        for (let t = 0; t <= totalSubTicks; t++) {
            const ratio = t / totalSubTicks;
            const angle = startAngle + ratio * totalAngle;
            const rpmVal = ratio * maxScaleRpm;
            const isThousand = (t % subTicksPerUnit === 0);
            const isRed = rpmVal >= redlineRpm - 10;

            const outerR = radius - 13.5;
            const innerR = isThousand ? (radius - 28) : (radius - 20.5);

            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
            ctx.lineTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
            if (isThousand) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3.2;
            } else {
                ctx.strokeStyle = isRed ? 'rgba(255, 220, 220, 0.9)' : 'rgba(190, 210, 230, 0.75)';
                ctx.lineWidth = 1.3;
            }
            ctx.stroke();
        }

        // 5. 1000rpm毎のモータースポーツ・コンデンスドイタリック数字
        ctx.font = 'italic 900 21px "Teko", "Rajdhani", "Impact", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let r = 0; r <= maxDisplay; r++) {
            const angle = startAngle + (r / maxDisplay) * totalAngle;
            const isRed = (r * 1000) >= redlineRpm;
            const numR = radius - 42;
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
        // STEP 6: 文字盤内エンブレム ＆ 盤面下部内蔵ギアポジション窓（スッキリ抜けた実車文字盤）
        // =====================================================================
        const badgeText = this.player.carModelCode || 'TRD / PROJECT.D';
        ctx.fillStyle = '#ffbb00';
        ctx.font = 'italic 900 15px "Rajdhani", sans-serif';
        ctx.fillText(badgeText, cx, cy - 42);

        ctx.fillStyle = '#a8bed4';
        ctx.font = 'bold 10px "Rajdhani", sans-serif';
        ctx.fillText('x1000 r/min', cx, cy - 28);

        // ★頭文字D ARCADE STAGE 象徴：タコメーター盤面下部（6時方向）内蔵 3Dメタリック枠ギアポジション窓
        const gx = cx - 44;
        const gy = cy + 26;
        const gw = 88;
        const gh = 58;

        // ギア窓3Dメタリック外枠
        const gFrameGrad = ctx.createLinearGradient(gx, gy, gx + gw, gy + gh);
        gFrameGrad.addColorStop(0, '#b0c4d8');
        gFrameGrad.addColorStop(0.5, '#2b3644');
        gFrameGrad.addColorStop(1, '#586a7e');
        ctx.beginPath();
        ctx.roundRect(gx - 2.5, gy - 2.5, gw + 5, gh + 5, 7);
        ctx.fillStyle = gFrameGrad;
        ctx.fill();

        const gBoxGrad = ctx.createLinearGradient(gx, gy, gx, gy + gh);
        gBoxGrad.addColorStop(0, '#060a10');
        gBoxGrad.addColorStop(1, '#020407');

        ctx.beginPath();
        ctx.roundRect(gx, gy, gw, gh, 5);
        ctx.fillStyle = gBoxGrad;
        ctx.fill();
        ctx.strokeStyle = inRedzone ? '#ff3344' : '#ffaa00';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // 左半分：MT/AT バッジ + GEAR ラベル + デジタルRPM数値
        ctx.fillStyle = '#00d8ff';
        ctx.beginPath();
        ctx.roundRect(gx + 6, gy + 6, 30, 14, 2.5);
        ctx.fill();
        ctx.fillStyle = '#001018';
        ctx.font = '900 10px "Rajdhani", sans-serif';
        ctx.fillText(transStr, gx + 21, gy + 13.5);

        ctx.fillStyle = '#9cb4cc';
        ctx.font = 'bold 9.5px "Rajdhani", sans-serif';
        ctx.fillText('GEAR', gx + 21, gy + 28);

        ctx.fillStyle = inRedzone ? '#ff4455' : '#00e5ff';
        ctx.font = 'italic 800 11px "Rajdhani", monospace';
        ctx.fillText(`${Math.round(curRpm)}`, gx + 23, gy + 45);

        // 右半分：大型発光ギア数字 (1〜6 / N)
        ctx.fillStyle = 'rgba(255, 190, 0, 0.08)';
        ctx.font = 'italic 700 54px "Teko", "Rajdhani", sans-serif';
        ctx.fillText('8', gx + 65, gy + 32);

        ctx.fillStyle = inRedzone ? '#ff3344' : '#ffdd22';
        ctx.shadowColor = inRedzone ? '#ff1122' : '#ffaa00';
        ctx.shadowBlur = 12;
        ctx.fillText(gearStr, gx + 65, gy + 32);
        ctx.shadowBlur = 0;

        // =====================================================================
        // STEP 7: 3D 透過照明ポインターニードル（ドロップシャドウ＋ホワイトホットコア＋削り出しハブ）
        // =====================================================================
        const needleAngle = startAngle + rpmRatio * totalAngle;

        // 指針のドロップシャドウ
        ctx.save();
        ctx.translate(cx + 4, cy + 5);
        ctx.rotate(needleAngle);
        ctx.beginPath();
        ctx.moveTo(-28, -4);
        ctx.lineTo(radius - 13, 0);
        ctx.lineTo(-28, 4);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fill();
        ctx.restore();

        // 指針本体
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle);

        // カウンターウェイト
        ctx.beginPath();
        ctx.moveTo(-29, -5.2);
        ctx.lineTo(-5, -3.8);
        ctx.lineTo(-5, 3.8);
        ctx.lineTo(-29, 5.2);
        ctx.closePath();
        ctx.fillStyle = '#1e2630';
        ctx.strokeStyle = '#5c6e82';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        // 発光クリムゾンブレード
        ctx.beginPath();
        ctx.moveTo(-8, -4.6);
        ctx.lineTo(radius - 11, 0);
        ctx.lineTo(-8, 4.6);
        ctx.closePath();
        ctx.fillStyle = '#ff1a1a';
        ctx.shadowColor = '#ff2222';
        ctx.shadowBlur = 15;
        ctx.fill();

        // ホワイトホット・コアライン
        ctx.beginPath();
        ctx.moveTo(-4, -1.3);
        ctx.lineTo(radius - 18, 0);
        ctx.lineTo(-4, 1.3);
        ctx.closePath();
        ctx.fillStyle = '#fff8f8';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.restore();

        // 削り出しアルミ・センタースピンドルキャップ
        const capGrad = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 16.5);
        capGrad.addColorStop(0, '#788a9e');
        capGrad.addColorStop(0.55, '#1e2630');
        capGrad.addColorStop(1, '#0a0e14');

        ctx.beginPath();
        ctx.arc(cx, cy, 16, 0, Math.PI * 2);
        ctx.fillStyle = capGrad;
        ctx.fill();
        ctx.strokeStyle = '#b0c2d4';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = inRedzone ? '#ff2222' : '#ffaa00';
        ctx.fill();

        // ドームガラスレンズの光沢ハイライト
        const glassGrad = ctx.createLinearGradient(cx, cy - radius, cx, cy + 10);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
        glassGrad.addColorStop(0.45, 'rgba(200, 235, 255, 0.04)');
        glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, Math.PI * 1.05, Math.PI * 1.95);
        ctx.fillStyle = glassGrad;
        ctx.fill();

        // =====================================================================
        // STEP 8: 右サイド外周・チタンハウジング付 18セグメント湾曲ペダルゲージ (ACC / BRK)
        // =====================================================================
        const pBottomAng = Math.PI * 0.22;
        const pTopAng = -Math.PI * 0.24;
        const pSpan = pBottomAng - pTopAng;
        const pSegs = 18;
        const pGap = 0.007;
        const pStep = pSpan / pSegs;

        const accOuterR = radius + 27;
        const brkInnerR = radius + 20;

        // ペダルゲージ背面チタンハウジングトラック
        ctx.beginPath();
        ctx.arc(cx, cy, (accOuterR + brkInnerR) * 0.5, pTopAng - 0.03, pBottomAng + 0.03);
        ctx.strokeStyle = 'rgba(12, 18, 26, 0.92)';
        ctx.lineWidth = 17;
        ctx.stroke();

        for (let s = 0; s < pSegs; s++) {
            const segRatio = (s + 0.5) / pSegs;
            const a1 = pBottomAng - s * pStep;
            const a0 = a1 - (pStep - pGap);

            // ACCEL セグメント
            const accOn = throttle >= segRatio;
            ctx.beginPath();
            ctx.arc(cx, cy, accOuterR, a0, a1);
            ctx.strokeStyle = accOn ? (segRatio > 0.78 ? '#00ff88' : '#00e5ff') : 'rgba(26, 40, 54, 0.80)';
            ctx.lineWidth = 5.0;
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
            ctx.strokeStyle = brkOn ? '#ff2233' : 'rgba(42, 20, 26, 0.80)';
            ctx.lineWidth = 4.2;
            if (brkOn) {
                ctx.shadowColor = '#ff2233';
                ctx.shadowBlur = 5;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        const pLabelX = cx + Math.cos(pBottomAng + 0.08) * (accOuterR - 3);
        const pLabelY = cy + Math.sin(pBottomAng + 0.08) * (accOuterR - 3);
        ctx.font = 'italic 900 9px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00e5ff';
        ctx.fillText('ACC', pLabelX + 9, pLabelY + 4);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('BRK', pLabelX - 15, pLabelY + 4);
    }

    /**
     * 互換用サブメーター更新フック（統合マスタークラスター側で一括描画）
     */
    renderSubMeters() {
        // マスタークラスター（renderTachometer）内にて一括高精細描画
    }

    drawSubGauge() {
        // 互換スタブ
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
