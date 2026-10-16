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

        // シフトアップ警告ランプ (各マシンのレッドゾーン手前で点滅)
        if (this.shiftLampElem) {
            const maxGear = (this.player && this.player.maxGear) ? this.player.maxGear : 5;
            const shiftThreshold = (this.player.redlineRpm || 8500) * 0.96;
            if (this.player.rpm > shiftThreshold && this.player.gear < maxGear) {
                const blink = Math.floor(Date.now() / 80) % 2 === 0;
                this.shiftLampElem.style.backgroundColor = blink ? '#ff1111' : '#330000';
                this.shiftLampElem.style.boxShadow = blink ? '0 0 18px #ff1111' : 'none';
            } else {
                this.shiftLampElem.style.backgroundColor = '#1a0000';
                this.shiftLampElem.style.boxShadow = 'none';
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

    renderTachometer() {
        if (!this.tachoCtx) return;
        const ctx = this.tachoCtx;
        const w = this.tachoCanvas.width;
        const h = this.tachoCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = w * 0.43;

        const maxRpm = this.player.maxRpm || 11000;
        const redlineRpm = this.player.redlineRpm || 8500;
        const maxDisplay = Math.ceil(maxRpm / 1000);
        const maxScaleRpm = maxDisplay * 1000;

        ctx.clearRect(0, 0, w, h);

        // 外枠ベゼル（深みのあるマットブラック＆チタンリング）
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = '#10141a';
        ctx.fill();
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 文字盤ブラックフェイス
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0a0c10';
        ctx.fill();

        // アーク目盛りトラック
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;
        const endAngle = startAngle + totalAngle;

        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, startAngle, endAngle);
        ctx.strokeStyle = '#1e2832';
        ctx.lineWidth = 12;
        ctx.stroke();

        // レッドゾーン (redlineRpm 〜 maxScaleRpm)
        const redRatio = Math.max(0, Math.min(1, redlineRpm / maxScaleRpm));
        const redStart = startAngle + redRatio * totalAngle;
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, redStart, endAngle);
        ctx.strokeStyle = '#ee1111';
        ctx.lineWidth = 12;
        ctx.stroke();

        ctx.fillStyle = '#eee';
        ctx.font = 'bold 13px "Impact", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let r = 0; r <= maxDisplay; r++) {
            const angle = startAngle + (r / maxDisplay) * totalAngle;
            const x1 = cx + Math.cos(angle) * (radius - 10);
            const y1 = cy + Math.sin(angle) * (radius - 10);
            const isMajor = (maxDisplay <= 9) ? true : (r % 2 === 0 || r === maxDisplay);
            const tickLen = isMajor ? 22 : 15;
            const x2 = cx + Math.cos(angle) * (radius - tickLen);
            const y2 = cy + Math.sin(angle) * (radius - tickLen);

            const isRed = (r * 1000) >= redlineRpm;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = isRed ? '#ff2222' : '#ffffff';
            ctx.lineWidth = isMajor ? 2.5 : 1.5;
            ctx.stroke();

            // 小目盛り (0.5刻み)
            if (r < maxDisplay) {
                const midAngle = angle + (totalAngle / maxDisplay) * 0.5;
                const mx1 = cx + Math.cos(midAngle) * (radius - 10);
                const my1 = cy + Math.sin(midAngle) * (radius - 10);
                const mx2 = cx + Math.cos(midAngle) * (radius - 14);
                const my2 = cy + Math.sin(midAngle) * (radius - 14);
                ctx.beginPath();
                ctx.moveTo(mx1, my1);
                ctx.lineTo(mx2, my2);
                ctx.strokeStyle = '#667788';
                ctx.lineWidth = 1.0;
                ctx.stroke();
            }

            if (isMajor) {
                const tx = cx + Math.cos(angle) * (radius - 34);
                const ty = cy + Math.sin(angle) * (radius - 34);
                ctx.fillStyle = isRed ? '#ff3333' : '#ffffff';
                ctx.fillText(r, tx, ty);
            }
        }

        ctx.fillStyle = '#8899aa';
        ctx.font = '10px sans-serif';
        ctx.fillText('x1000r/min', cx, cy + 34);
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 12px sans-serif';
        const badgeText = this.player.carModelCode || 'PROJECT.D';
        ctx.fillText(badgeText, cx, cy - 28);

        // 赤色ネオンニードル（指針）
        const rpmRatio = Math.min(1.0, Math.max(0, this.player.rpm / maxScaleRpm));
        const needleAngle = startAngle + rpmRatio * totalAngle;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle);

        ctx.beginPath();
        ctx.moveTo(-5, 0);
        ctx.lineTo(radius - 8, 0);
        ctx.lineTo(-5, 2.5);
        ctx.closePath();
        ctx.fillStyle = '#ff1111';
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.restore();

        // センターキャップ
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.fillStyle = '#141820';
        ctx.strokeStyle = '#8899aa';
        ctx.lineWidth = 2.5;
        ctx.fill();
        ctx.stroke();
    }

    /**
     * 本物の走り屋仕様：Defi風 3連追加メーター描画
     */
    renderSubMeters() {
        // 1. 油圧計 (OIL PRESS: 0〜8 bar, 1.8以下ワーニング)
        const barVal = this.player.oilPressure / 100;
        this.drawSubGauge(this.oilPressCtx, 95, 95, barVal, 0, 8, 'bar', 1.8, 'OIL.P', true);

        // 2. 水温計 (WATER TEMP: 40〜120 ℃, 102℃以上ワーニング)
        this.drawSubGauge(this.waterTempCtx, 95, 95, this.player.waterTemp, 40, 120, '℃', 102, 'WATER', false);

        // 3. 油温計 (OIL TEMP: 50〜150 ℃, 118℃以上ワーニング)
        this.drawSubGauge(this.oilTempCtx, 95, 95, this.player.oilTemp, 50, 150, '℃', 118, 'OIL.T', false);
    }

    /**
     * アナログサブメーター（Defi風）描画ヘルパー
     */
    drawSubGauge(ctx, w, h, val, minVal, maxVal, unit, redZoneVal, label, isLowerRed = false) {
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const radius = w * 0.41;

        // 1. メーターケース・ベゼル（外枠）
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = '#141820';
        ctx.fill();
        ctx.strokeStyle = '#445566';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. 文字盤ブラックフェイス
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#090c10';
        ctx.fill();

        // 3. アーク目盛り（270度円弧：PI * 0.75 〜 PI * 2.25）
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;

        // 背景トラック
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 4, startAngle, startAngle + totalAngle);
        ctx.strokeStyle = '#1e2632';
        ctx.lineWidth = 4;
        ctx.stroke();

        // レッドゾーン
        const redRatio = Math.max(0, Math.min(1, (redZoneVal - minVal) / (maxVal - minVal)));
        ctx.beginPath();
        if (isLowerRed) {
            // 規定値以下がレッドゾーン（油圧など）
            ctx.arc(cx, cy, radius - 4, startAngle, startAngle + redRatio * totalAngle);
        } else {
            // 規定値以上がレッドゾーン（水温・油温など）
            ctx.arc(cx, cy, radius - 4, startAngle + redRatio * totalAngle, startAngle + totalAngle);
        }
        ctx.strokeStyle = '#ee2222';
        ctx.lineWidth = 5;
        ctx.stroke();

        // 4. 目盛り＆数値
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const angle = startAngle + ratio * totalAngle;
            const tickVal = minVal + ratio * (maxVal - minVal);

            const x1 = cx + Math.cos(angle) * (radius - 4);
            const y1 = cy + Math.sin(angle) * (radius - 4);
            const x2 = cx + Math.cos(angle) * (radius - 9);
            const y2 = cy + Math.sin(angle) * (radius - 9);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = (isLowerRed ? tickVal <= redZoneVal : tickVal >= redZoneVal) ? '#ff3333' : '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 小目盛り
            if (i < steps) {
                const midAngle = angle + (totalAngle / steps) * 0.5;
                const mx1 = cx + Math.cos(midAngle) * (radius - 4);
                const my1 = cy + Math.sin(midAngle) * (radius - 4);
                const mx2 = cx + Math.cos(midAngle) * (radius - 7);
                const my2 = cy + Math.sin(midAngle) * (radius - 7);
                ctx.beginPath();
                ctx.moveTo(mx1, my1);
                ctx.lineTo(mx2, my2);
                ctx.strokeStyle = '#778899';
                ctx.lineWidth = 1.0;
                ctx.stroke();
            }

            // 数字
            const tx = cx + Math.cos(angle) * (radius - 17);
            const ty = cy + Math.sin(angle) * (radius - 17);
            ctx.fillStyle = '#ccddee';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(tickVal), tx, ty);
        }

        // ラベル・単位
        ctx.fillStyle = '#ffaa00';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, cx, cy - 13);

        ctx.fillStyle = '#778899';
        ctx.font = '8px sans-serif';
        ctx.fillText(unit, cx, cy + 15);

        // 5. 赤色ネオンニードル（指針）
        const valRatio = Math.max(0, Math.min(1.0, (val - minVal) / (maxVal - minVal)));
        const needleAngle = startAngle + valRatio * totalAngle;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle);

        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(radius - 5, 0);
        ctx.lineTo(-3, 1.5);
        ctx.closePath();
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();

        // センターキャップ
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#111820';
        ctx.strokeStyle = '#667788';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();

        // ワーニングLEDランプ（レッドゾーン突入時に赤く点滅発光！）
        const isWarning = isLowerRed ? (val <= redZoneVal) : (val >= redZoneVal);
        if (isWarning) {
            const blink = Math.floor(Date.now() / 100) % 2 === 0;
            if (blink) {
                ctx.beginPath();
                ctx.arc(cx, cy + 7, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#ff0000';
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 8;
                ctx.fill();
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
