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

    renderTachometer() {
        if (!this.tachoCtx) return;
        const ctx = this.tachoCtx;
        const w = this.tachoCanvas.width;
        const h = this.tachoCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const radius = w * 0.44;

        const maxRpm = this.player.maxRpm || 11000;
        const redlineRpm = this.player.redlineRpm || 8500;
        const maxDisplay = Math.ceil(maxRpm / 1000);
        const maxScaleRpm = maxDisplay * 1000;
        const curRpm = Math.max(0, this.player.rpm || 0);
        const rpmRatio = Math.min(1.0, Math.max(0, curRpm / maxScaleRpm));
        const redRatio = Math.max(0, Math.min(1, redlineRpm / maxScaleRpm));
        const inRedzone = curRpm >= redlineRpm * 0.96;

        ctx.clearRect(0, 0, w, h);

        // =====================================================================
        // 1. 3D 削り出しチタン＆ガンメタル・ステップドベゼル（外枠＋6角キャップボルト）
        // =====================================================================
        const outerGrad = ctx.createLinearGradient(0, 0, w, h);
        outerGrad.addColorStop(0, '#5a6878');
        outerGrad.addColorStop(0.35, '#252d38');
        outerGrad.addColorStop(0.7, '#11161d');
        outerGrad.addColorStop(1, '#3d4856');

        ctx.beginPath();
        ctx.arc(cx, cy, radius + 11, 0, Math.PI * 2);
        ctx.fillStyle = outerGrad;
        ctx.fill();
        ctx.strokeStyle = '#0a0d12';
        ctx.lineWidth = 2;
        ctx.stroke();

        // ベゼル外周の6角ボルトリベット
        for (let b = 0; b < 6; b++) {
            const bAngle = (b / 6) * Math.PI * 2 + Math.PI / 6;
            const bx = cx + Math.cos(bAngle) * (radius + 6);
            const by = cy + Math.sin(bAngle) * (radius + 6);
            ctx.beginPath();
            ctx.arc(bx, by, 2.6, 0, Math.PI * 2);
            ctx.fillStyle = '#182028';
            ctx.fill();
            ctx.strokeStyle = '#778899';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 内側ブラッシュドリング（レッドゾーン突入時はクリムゾン発光）
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 1.5, 0, Math.PI * 2);
        ctx.strokeStyle = inRedzone ? '#ff2233' : '#00d8ff';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = inRedzone ? '#ff1122' : '#00d8ff';
        ctx.shadowBlur = inRedzone ? 12 : 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // =====================================================================
        // 2. カーボン調ディープブラック文字盤フェイス
        // =====================================================================
        const faceGrad = ctx.createRadialGradient(cx, cy - radius * 0.25, radius * 0.05, cx, cy, radius);
        faceGrad.addColorStop(0, '#18202c');
        faceGrad.addColorStop(0.55, '#0b0f16');
        faceGrad.addColorStop(1, '#05070b');

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = faceGrad;
        ctx.fill();

        // 繊細なコンセントリック・ヘアラインリング
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(120, 160, 200, 0.10)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // =====================================================================
        // 3. 頭文字D ARCADE STAGE 象徴：外周LEDセグメントRPMバー ＆ レッドゾーン
        // =====================================================================
        const startAngle = Math.PI * 0.72;
        const totalAngle = Math.PI * 1.48;
        const endAngle = startAngle + totalAngle;
        const redStart = startAngle + redRatio * totalAngle;

        // 背景トラック帯
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 9, startAngle, endAngle);
        ctx.strokeStyle = 'rgba(26, 36, 48, 0.95)';
        ctx.lineWidth = 13;
        ctx.stroke();

        // レッドゾーンベース帯 (redlineRpm 〜 maxScaleRpm)
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 9, redStart, endAngle);
        ctx.strokeStyle = inRedzone ? 'rgba(255, 20, 40, 0.92)' : 'rgba(190, 18, 32, 0.65)';
        ctx.lineWidth = 13;
        ctx.stroke();

        // 動的発光LEDセグメント (44セグメント)
        const segCount = 44;
        const segGap = 0.008;
        const segArc = (totalAngle / segCount) - segGap;
        for (let s = 0; s < segCount; s++) {
            const segPos = (s + 0.5) / segCount;
            if (segPos > rpmRatio) break;

            const a0 = startAngle + s * (totalAngle / segCount);
            const a1 = a0 + segArc;
            let segColor = '#00e5ff';
            if (segPos >= redRatio) {
                segColor = '#ff1122';
            } else if (segPos >= redRatio * 0.82) {
                segColor = '#ffaa00';
            } else if (segPos >= redRatio * 0.55) {
                segColor = '#00ff88';
            }

            ctx.beginPath();
            ctx.arc(cx, cy, radius - 9, a0, a1);
            ctx.strokeStyle = segColor;
            ctx.lineWidth = 11;
            ctx.shadowColor = segColor;
            ctx.shadowBlur = (segPos >= redRatio * 0.85) ? 8 : 3;
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // =====================================================================
        // 4. 精密目盛り（1000rpm主目盛り / 500rpm中目盛り / 200rpm細目盛り）＆ イタリック数字
        // =====================================================================
        const subTicksPerUnit = 5; // 200rpm刻み
        const totalSubTicks = maxDisplay * subTicksPerUnit;
        for (let t = 0; t <= totalSubTicks; t++) {
            const ratio = t / totalSubTicks;
            const angle = startAngle + ratio * totalAngle;
            const rpmVal = ratio * maxScaleRpm;
            const isThousand = (t % subTicksPerUnit === 0);
            const isRed = rpmVal >= redlineRpm - 10;

            const outerR = radius - 16;
            const innerR = isThousand ? (radius - 29) : (radius - 22);

            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
            ctx.lineTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
            if (isThousand) {
                ctx.strokeStyle = isRed ? '#ff3344' : '#ffffff';
                ctx.lineWidth = 3.0;
            } else {
                ctx.strokeStyle = isRed ? 'rgba(255, 70, 80, 0.85)' : 'rgba(150, 175, 200, 0.65)';
                ctx.lineWidth = 1.3;
            }
            ctx.stroke();
        }

        // 1000rpm毎のレーシングイタリック数字
        ctx.font = 'italic 900 19px "Teko", "Rajdhani", "Impact", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let r = 0; r <= maxDisplay; r++) {
            const angle = startAngle + (r / maxDisplay) * totalAngle;
            const isRed = (r * 1000) >= redlineRpm;
            const numR = radius - 43;
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
        // 5. ★頭文字DAC仕様：下部リム内蔵 ツインペダル・テレメトリーアーク (ACCEL / BRAKE)
        // =====================================================================
        const pedStart = Math.PI * 0.65;
        const pedEnd = Math.PI * 0.27;
        const pedSpan = pedStart - pedEnd;
        const throttle = Math.max(0, Math.min(1, this.player.throttle || 0));
        const brake = Math.max(0, Math.min(1, this.player.brake || 0));

        // ACCEL トラック (外周側)
        const accR = radius - 14;
        ctx.beginPath();
        ctx.arc(cx, cy, accR, pedEnd, pedStart);
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.16)';
        ctx.lineWidth = 4.5;
        ctx.stroke();
        if (throttle > 0.01) {
            ctx.beginPath();
            ctx.arc(cx, cy, accR, pedStart - throttle * pedSpan, pedStart);
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 4.5;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // BRAKE トラック (内周側)
        const brkR = radius - 21;
        ctx.beginPath();
        ctx.arc(cx, cy, brkR, pedEnd, pedStart);
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.16)';
        ctx.lineWidth = 4.5;
        ctx.stroke();
        if (brake > 0.01) {
            ctx.beginPath();
            ctx.arc(cx, cy, brkR, pedStart - brake * pedSpan, pedStart);
            ctx.strokeStyle = '#ff3322';
            ctx.lineWidth = 4.5;
            ctx.shadowColor = '#ff3322';
            ctx.shadowBlur = 6;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = '#00e5ff';
        ctx.font = 'bold 8px "Rajdhani", sans-serif';
        ctx.fillText('ACC', cx - 22, cy + radius - 28);
        ctx.fillStyle = '#ff4444';
        ctx.fillText('BRK', cx + 22, cy + radius - 28);

        // =====================================================================
        // 6. 文字盤ロゴ・マシン型式エンブレム・デジタルRPMサブウィンドウ
        // =====================================================================
        const badgeText = this.player.carModelCode || 'PROJECT.D';
        ctx.fillStyle = '#ffbb00';
        ctx.font = 'italic 900 15px "Rajdhani", sans-serif';
        ctx.fillText(badgeText, cx, cy - 36);

        ctx.fillStyle = '#7f94ab';
        ctx.font = 'bold 10px "Rajdhani", sans-serif';
        ctx.fillText('x1000 r/min', cx, cy - 22);

        // 下部デジタルRPMミニウィンドウ
        ctx.fillStyle = 'rgba(5, 10, 16, 0.85)';
        ctx.strokeStyle = inRedzone ? '#ff3344' : 'rgba(0, 220, 255, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(cx - 38, cy + 28, 76, 21, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = inRedzone ? '#ff4455' : '#00f0ff';
        ctx.font = 'italic 800 14px "Rajdhani", monospace';
        ctx.fillText(`${Math.round(curRpm)} RPM`, cx, cy + 39);

        // =====================================================================
        // 7. 3D 発光テーパード・ポインターニードル（ドロップシャドウ＋ホワイトコア）
        // =====================================================================
        const needleAngle = startAngle + rpmRatio * totalAngle;

        // 指針のドロップシャドウ
        ctx.save();
        ctx.translate(cx + 3, cy + 4);
        ctx.rotate(needleAngle);
        ctx.beginPath();
        ctx.moveTo(-22, -3.5);
        ctx.lineTo(radius - 14, 0);
        ctx.lineTo(-22, 3.5);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fill();
        ctx.restore();

        // 指針本体
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle);

        // カウンターウェイト（根元側）
        ctx.beginPath();
        ctx.moveTo(-24, -4.5);
        ctx.lineTo(-4, -3.5);
        ctx.lineTo(-4, 3.5);
        ctx.lineTo(-24, 4.5);
        ctx.closePath();
        ctx.fillStyle = '#252c36';
        ctx.fill();

        // 発光レッドブレード
        ctx.beginPath();
        ctx.moveTo(-8, -4.0);
        ctx.lineTo(radius - 12, 0);
        ctx.lineTo(-8, 4.0);
        ctx.closePath();
        ctx.fillStyle = '#ff1a1a';
        ctx.shadowColor = '#ff2222';
        ctx.shadowBlur = 14;
        ctx.fill();

        // ホワイトホット・コアライン（本物の透過照明指針の輝き）
        ctx.beginPath();
        ctx.moveTo(-4, -1.1);
        ctx.lineTo(radius - 18, 0);
        ctx.lineTo(-4, 1.1);
        ctx.closePath();
        ctx.fillStyle = '#fff5f5';
        ctx.shadowBlur = 0;
        ctx.fill();
        ctx.restore();

        // 削り出しアルミ・センタースピンドルキャップ
        const capGrad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 15);
        capGrad.addColorStop(0, '#4a5666');
        capGrad.addColorStop(0.6, '#1a2028');
        capGrad.addColorStop(1, '#0c1016');

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
    }

    /**
     * 本物の走り屋仕様：Defi-Link BF 3連追加メーター描画
     */
    renderSubMeters() {
        const w = this.oilPressCanvas ? this.oilPressCanvas.width : 76;
        const h = this.oilPressCanvas ? this.oilPressCanvas.height : 76;

        // 1. 油圧計 (OIL PRESS: 0〜8 bar, 1.8以下ワーニング)
        const barVal = this.player.oilPressure / 100;
        this.drawSubGauge(this.oilPressCtx, w, h, barVal, 0, 8, 'bar', 1.8, 'OIL.P', true);

        // 2. 水温計 (WATER TEMP: 40〜120 ℃, 102℃以上ワーニング)
        this.drawSubGauge(this.waterTempCtx, w, h, this.player.waterTemp, 40, 120, '℃', 102, 'WATER', false);

        // 3. 油温計 (OIL TEMP: 50〜150 ℃, 118℃以上ワーニング)
        this.drawSubGauge(this.oilTempCtx, w, h, this.player.oilTemp, 50, 150, '℃', 118, 'OIL.T', false);
    }

    /**
     * アナログサブメーター（Defi-Link Meter BF風）描画ヘルパー
     */
    drawSubGauge(ctx, w, h, val, minVal, maxVal, unit, redZoneVal, label, isLowerRed = false) {
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;
        const radius = w * 0.43;

        // 1. メーターケース・アルミベゼル（外枠）
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#18202a';
        ctx.fill();
        ctx.strokeStyle = '#607890';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 2. 文字盤ブラックフェイス
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#070a0f';
        ctx.fill();

        // 3. アーク目盛り（270度円弧：PI * 0.75 〜 PI * 2.25）
        const startAngle = Math.PI * 0.75;
        const totalAngle = Math.PI * 1.5;

        // BFシアン・背景トラック
        ctx.beginPath();
        ctx.arc(cx, cy, radius - 3.5, startAngle, startAngle + totalAngle);
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.22)';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // レッドゾーン
        const redRatio = Math.max(0, Math.min(1, (redZoneVal - minVal) / (maxVal - minVal)));
        ctx.beginPath();
        if (isLowerRed) {
            ctx.arc(cx, cy, radius - 3.5, startAngle, startAngle + redRatio * totalAngle);
        } else {
            ctx.arc(cx, cy, radius - 3.5, startAngle + redRatio * totalAngle, startAngle + totalAngle);
        }
        ctx.strokeStyle = '#ff2233';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 4. 目盛り＆数値
        const steps = 4;
        for (let i = 0; i <= steps; i++) {
            const ratio = i / steps;
            const angle = startAngle + ratio * totalAngle;
            const tickVal = minVal + ratio * (maxVal - minVal);

            const x1 = cx + Math.cos(angle) * (radius - 2);
            const y1 = cy + Math.sin(angle) * (radius - 2);
            const x2 = cx + Math.cos(angle) * (radius - 7.5);
            const y2 = cy + Math.sin(angle) * (radius - 7.5);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = (isLowerRed ? tickVal <= redZoneVal : tickVal >= redZoneVal) ? '#ff3333' : '#e8f8ff';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 数字
            const tx = cx + Math.cos(angle) * (radius - 14.5);
            const ty = cy + Math.sin(angle) * (radius - 14.5);
            ctx.fillStyle = '#d8f0ff';
            ctx.font = 'bold 8px "Rajdhani", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.round(tickVal), tx, ty);
        }

        // 単位のみ中央下部にスッキリ表示（ラベルは直下のHTML側で表示し文字被りをゼロに）
        ctx.fillStyle = '#7799bb';
        ctx.font = 'bold 7.5px "Rajdhani", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit, cx, cy + 14);

        // 5. 赤色ネオンニードル（指針）
        const valRatio = Math.max(0, Math.min(1.0, (val - minVal) / (maxVal - minVal)));
        const needleAngle = startAngle + valRatio * totalAngle;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(needleAngle);

        ctx.beginPath();
        ctx.moveTo(-4, -1.5);
        ctx.lineTo(radius - 4, 0);
        ctx.lineTo(-4, 1.5);
        ctx.closePath();
        ctx.fillStyle = '#ff2222';
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();

        // センターキャップ
        ctx.beginPath();
        ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
        ctx.fillStyle = '#18222c';
        ctx.strokeStyle = '#8899aa';
        ctx.lineWidth = 1.2;
        ctx.fill();
        ctx.stroke();

        // PEAKワーニングLEDランプ（レッドゾーン突入時に赤く点滅発光！）
        const isWarning = isLowerRed ? (val <= redZoneVal) : (val >= redZoneVal);
        if (isWarning) {
            const blink = Math.floor(Date.now() / 90) % 2 === 0;
            if (blink) {
                ctx.beginPath();
                ctx.arc(cx, cy - 8, 2.5, 0, Math.PI * 2);
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
