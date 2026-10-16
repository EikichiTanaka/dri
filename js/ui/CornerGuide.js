/**
 * CornerGuide.js - 頭文字D THE ARCADE (DAC) 完全再現コーナーガイド
 * 
 * 公式仕様完全準拠 (https://initiald.sega.jp/inidac/beginner/corner-guide/):
 * 1. 菱形（ダイヤモンド）アイコンによる曲率別グラフィック
 *    - 青 (BLUE): かなり緩いコーナー（アクセル全開で通過可能）
 *    - 緑 (GREEN): 少し緩いコーナー（アクセルを緩めて通過）
 *    - 黄 (YELLOW): 少し急なコーナー（ブレーキを踏みながら通過）
 *    - 赤 (RED): かなり急なコーナー（しっかりブレーキを踏んで通過）
 * 2. 左右方向対応（左コーナー / 右コーナーで左右反転）
 * 3. 接近時の激しい点滅警告（残り45m以内での高速フラッシュ点滅＆警告SE）
 * 4. 連続コーナー（S字・ヘアピン連続）時の次コーナー（NEXT CORNER）上部ミニ予告
 */

class CornerGuide {
    constructor(track, playerPhysics, audio) {
        this.track = track;
        this.player = playerPhysics;
        this.audio = audio;

        // 状態トラッキング
        this.active = false;
        this.primary = null;    // { severity, dir, distance, maxCurvature, apexIdx }
        this.secondary = null;  // { severity, dir, distance, maxCurvature, apexIdx }
        this.isBlinking = false;
        this.warningPlayedForApex = -1;

        // 点滅アニメーション用タイマー
        this.blinkTimer = 0;
        this.blinkState = true;

        // SVGパス定義 (すべて右カーブ/右旋回基準: viewBox 0 0 100 100, 中心 50 50)
        this.arrowPaths = {
            blue: 'M 42 74 L 48 74 C 48 58 53 46 58 38 L 64 42 L 63 22 L 43 28 L 49 32 C 44 42 42 56 42 74 Z',
            green: 'M 38 74 L 45 74 C 46 56 54 44 64 36 L 70 41 L 72 20 L 51 25 L 57 30 C 46 38 39 52 38 74 Z',
            yellow: 'M 34 74 L 41 74 L 41 48 C 41 38 48 32 58 32 C 63 32 67 35 69 38 L 65 42 L 80 47 L 79 32 L 74 36 C 70 30 64 25 56 25 C 42 25 34 35 34 48 Z',
            // ★右ヘアピン完全対応：左側(x=42)から立ち上がり、上部で右に180度Uターンして、右側(x=72)を下向きに射出！
            red: 'M 42 74 L 48 74 L 48 46 C 48 38 52 33 58 33 C 64 33 68 38 68 46 L 68 52 L 63 52 L 72 66 L 81 52 L 76 52 L 76 46 C 76 33 68 25 58 25 C 48 25 40 33 40 46 Z'
        };

        // カラーパレット
        this.colors = {
            blue: { bg: '#0070cc', border: '#ffffff', glow: 'rgba(0, 150, 255, 0.9)', text: 'FULL ACCEL', label: 'EASY' },
            green: { bg: '#00a336', border: '#ffffff', glow: 'rgba(0, 255, 100, 0.9)', text: 'LIFT OFF', label: 'CAUTION' },
            yellow: { bg: '#e5a800', border: '#ffffff', glow: 'rgba(255, 220, 0, 0.95)', text: 'BRAKE', label: 'BRAKE' },
            red: { bg: '#c01515', border: '#ffffff', glow: 'rgba(255, 30, 30, 1.0)', text: 'HARD BRAKE', label: 'DANGER' }
        };

        this.initDOM();
    }

    setTrack(newTrack) {
        this.track = newTrack;
        this.reset();
    }

    reset() {
        this.active = false;
        this.primary = null;
        this.secondary = null;
        this.isBlinking = false;
        this.warningPlayedForApex = -1;
        if (this.container) {
            this.container.classList.remove('visible', 'blinking', 'urgent');
        }
    }

    initDOM() {
        // すでに存在していれば取得、なければ生成して #hud-container に挿入
        let existing = document.getElementById('dac-corner-guide');
        if (existing) {
            this.container = existing;
        } else {
            this.container = document.createElement('div');
            this.container.id = 'dac-corner-guide';
            this.container.className = 'dac-corner-guide';
            
            const hud = document.getElementById('hud-container');
            if (hud) {
                hud.appendChild(this.container);
            } else {
                document.body.appendChild(this.container);
            }
        }

        this.container.innerHTML = `
            <!-- 次の次コーナー予告ミニアイコン (S字/連続ヘアピン用) -->
            <div id="cg-sub-icon-wrap" class="cg-sub-wrap">
                <svg id="cg-sub-svg" class="cg-sub-svg" viewBox="0 0 100 100">
                    <rect id="cg-sub-bg" x="15" y="15" width="70" height="70" rx="14" ry="14" transform="rotate(45 50 50)" stroke="#ffffff" stroke-width="5" />
                    <g id="cg-sub-arrow-group">
                        <path id="cg-sub-arrow" fill="#ffffff" d="" />
                    </g>
                </svg>
            </div>

            <!-- メインコーナーガイド -->
            <div id="cg-main-icon-wrap" class="cg-main-wrap">
                <!-- 外枠グロー＆パルスエフェクト用背景枠 -->
                <div id="cg-glow-ring" class="cg-glow-ring"></div>
                
                <svg id="cg-main-svg" class="cg-main-svg" viewBox="0 0 100 100">
                    <defs>
                        <filter id="cg-shadow" x="-30%" y="-30%" width="160%" height="160%">
                            <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.8"/>
                        </filter>
                    </defs>
                    <!-- 菱形ベース（角丸45度回転） -->
                    <rect id="cg-main-bg" x="15" y="15" width="70" height="70" rx="14" ry="14" 
                          transform="rotate(45 50 50)" stroke="#ffffff" stroke-width="5" filter="url(#cg-shadow)" />
                    <!-- 内部矢印パス（左右反転グループ） -->
                    <g id="cg-arrow-group">
                        <path id="cg-main-arrow" fill="#ffffff" d="" />
                    </g>
                </svg>
            </div>

            <!-- ガイド下部：残距離 ＆ 推奨アクション (DACアーケード仕様) -->
            <div id="cg-info-bar" class="cg-info-bar">
                <span id="cg-action-text" class="cg-action-text">BRAKE</span>
                <span id="cg-dist-text" class="cg-dist-text">45m</span>
            </div>
        `;

        // DOM参照
        this.subWrap = document.getElementById('cg-sub-icon-wrap');
        this.subBg = document.getElementById('cg-sub-bg');
        this.subArrow = document.getElementById('cg-sub-arrow');
        this.subArrowGroup = document.getElementById('cg-sub-arrow-group');

        this.mainWrap = document.getElementById('cg-main-icon-wrap');
        this.mainBg = document.getElementById('cg-main-bg');
        this.mainArrow = document.getElementById('cg-main-arrow');
        this.arrowGroup = document.getElementById('cg-arrow-group');
        this.glowRing = document.getElementById('cg-glow-ring');

        this.infoBar = document.getElementById('cg-info-bar');
        this.actionText = document.getElementById('cg-action-text');
        this.distText = document.getElementById('cg-dist-text');
    }

    /**
     * 毎フレームの更新処理
     * @param {number} dt 経過時間（秒）
     */
    update(dt) {
        if (!this.track || !this.track.samples || this.track.samples.length === 0 || !this.player) {
            this.container.classList.remove('visible');
            return;
        }

        // 1. 前方コーナーをスキャンして検出
        this.scanAheadCorners();

        // 2. コーナー情報がない場合は非表示
        if (!this.primary) {
            this.container.classList.remove('visible', 'blinking', 'urgent');
            this.active = false;
            return;
        }

        this.active = true;
        this.container.classList.add('visible');

        // 3. 接近距離判定と点滅制御
        const speedMs = Math.max(10, (this.player.speed || 0) / 3.6);
        // 時速に応じた点滅開始距離（低速時42m、高速140km/h時約52m）
        const blinkThresholdDist = Math.max(42, Math.min(65, speedMs * 1.35));

        const dist = this.primary.distance;
        this.isBlinking = (dist <= blinkThresholdDist && dist >= -8);

        // 点滅アニメーションの高速トグル (約 7.5 Hz)
        if (this.isBlinking) {
            this.blinkTimer += dt;
            if (this.blinkTimer >= 0.068) {
                this.blinkTimer = 0;
                this.blinkState = !this.blinkState;
            }
            this.container.classList.add('blinking');
            if (this.primary.severity === 'red' || this.primary.severity === 'yellow') {
                this.container.classList.add('urgent');
            } else {
                this.container.classList.remove('urgent');
            }

            // 点滅開始時の警告ビープ音 (同一Apexにつき1回だけトリガー)
            if (this.warningPlayedForApex !== this.primary.apexIdx) {
                this.warningPlayedForApex = this.primary.apexIdx;
                if (this.audio && this.audio.playCornerWarning) {
                    this.audio.playCornerWarning(this.primary.severity);
                }
            }
        } else {
            this.container.classList.remove('blinking', 'urgent');
            this.blinkState = true;
        }

        // 4. UIの描画更新
        this.renderUI();
    }

    /**
     * 前方のコーナーをスキャン
     */
    scanAheadCorners() {
        const samples = this.track.samples;
        const N = samples.length;
        const playerT = (this.player.trackT !== undefined && !isNaN(this.player.trackT)) ? this.player.trackT : 
                        ((this.player.t !== undefined && !isNaN(this.player.t)) ? this.player.t : 0);
        const currentIdx = Math.floor(playerT * (N - 1));
        const curSample = samples[currentIdx];

        // 探索範囲：現在位置から約 140m 先まで（約 45 サンプル）
        const scanCount = 45;
        const corners = [];

        let inCurve = false;
        let curveStartIdx = -1;
        let maxCurv = 0;
        let apexIdx = -1;
        let dominantTurnDir = 0;

        for (let i = 2; i <= scanCount; i++) {
            const idx = (currentIdx + i) % N;
            const s = samples[idx];
            if (!s) continue;

            const isCurving = (s.curvature >= 0.0065 && s.turnDir !== 0);

            if (isCurving) {
                // S字などで旋回方向が切り替わった場合
                if (inCurve && dominantTurnDir !== 0 && s.turnDir !== dominantTurnDir) {
                    // 直前のコーナーが主要コーナー（黄・赤: 曲率0.0135以上）なら登録
                    if (maxCurv >= 0.0135) {
                        corners.push({
                            startIdx: curveStartIdx,
                            apexIdx: apexIdx,
                            maxCurvature: maxCurv,
                            turnDir: dominantTurnDir
                        });
                    }
                    // 新しい旋回方向のコーナーを開始
                    curveStartIdx = idx;
                    maxCurv = s.curvature;
                    apexIdx = idx;
                    dominantTurnDir = s.turnDir;
                } else if (!inCurve) {
                    inCurve = true;
                    curveStartIdx = idx;
                    maxCurv = s.curvature;
                    apexIdx = idx;
                    dominantTurnDir = s.turnDir;
                } else {
                    if (s.curvature > maxCurv) {
                        maxCurv = s.curvature;
                        apexIdx = idx;
                        dominantTurnDir = s.turnDir;
                    }
                }
            } else {
                if (inCurve) {
                    // カーブ区間終了 -> 主要コーナー（黄・赤: 曲率0.0135以上）のみ登録
                    if (maxCurv >= 0.0135) {
                        corners.push({
                            startIdx: curveStartIdx,
                            apexIdx: apexIdx,
                            maxCurvature: maxCurv,
                            turnDir: dominantTurnDir
                        });
                    }
                    inCurve = false;
                    maxCurv = 0;
                    if (corners.length >= 2) break; // 最大2つまで検出
                }
            }
        }

        if (inCurve && corners.length < 2) {
            if (maxCurv >= 0.0135) {
                corners.push({
                    startIdx: curveStartIdx,
                    apexIdx: apexIdx,
                    maxCurvature: maxCurv,
                    turnDir: dominantTurnDir
                });
            }
        }

        // 主要コーナーが前方に存在しない場合は非表示
        if (corners.length === 0) {
            this.primary = null;
            this.secondary = null;
            return;
        }

        const sampleDist = this.track.trackLength / N;

        // 自車がすでにこのコーナーの頂点（Apex）を通過して脱出中の場合は除外
        let c1 = corners[0];
        let cornerIdx = 0;
        if (curSample && curSample.curvature >= c1.maxCurvature) {
            // 第1コーナーは通過済み -> 第2コーナーがあればそれを繰り上げ
            if (corners.length >= 2) {
                c1 = corners[1];
                cornerIdx = 1;
            } else {
                this.primary = null;
                this.secondary = null;
                return;
            }
        }

        let offsetSamples1 = (c1.apexIdx >= currentIdx) ? (c1.apexIdx - currentIdx) : (c1.apexIdx + N - currentIdx);
        const dist1 = offsetSamples1 * sampleDist;

        // 主要コーナー（黄・赤）判定：
        // 手前約88m以内に接近するまで非表示に保つ（頭文字DAC実機仕様）
        const sev1 = this.classifySeverity(c1.maxCurvature);
        if ((sev1 !== 'red' && sev1 !== 'yellow') || dist1 > 88 || dist1 < -8) {
            this.primary = null;
            this.secondary = null;
            return;
        }

        this.primary = {
            severity: sev1,
            dir: c1.turnDir >= 0 ? 'right' : 'left',
            distance: Math.round(dist1),
            maxCurvature: c1.maxCurvature,
            apexIdx: c1.apexIdx
        };

        // 第2コーナー（直後に控える主要コーナーの予告ミニアイコン）
        const nextCorner = (cornerIdx === 0 && corners.length >= 2) ? corners[1] : null;
        if (nextCorner) {
            const sev2 = this.classifySeverity(nextCorner.maxCurvature);
            let offsetSamples2 = (nextCorner.apexIdx >= currentIdx) ? (nextCorner.apexIdx - currentIdx) : (nextCorner.apexIdx + N - currentIdx);
            const dist2 = offsetSamples2 * sampleDist;
            // 第2コーナーも主要コーナー（黄・赤）かつ近接（120m以内）の場合のみ表示
            if ((sev2 === 'red' || sev2 === 'yellow') && dist2 <= 120) {
                this.secondary = {
                    severity: sev2,
                    dir: nextCorner.turnDir >= 0 ? 'right' : 'left',
                    distance: Math.round(dist2),
                    maxCurvature: nextCorner.maxCurvature,
                    apexIdx: nextCorner.apexIdx
                };
            } else {
                this.secondary = null;
            }
        } else {
            this.secondary = null;
        }
    }

    /**
     * 曲率 (curvature) から4段階のきつさを判定
     * @param {number} curv 
     * @returns {'blue'|'green'|'yellow'|'red'}
     */
    classifySeverity(curv) {
        if (curv >= 0.0260) {
            return 'red';       // ヘアピン・急激な旋回（ブレーキ必須）
        } else if (curv >= 0.0135) {
            return 'yellow';    // 少し急なコーナー（減速・ブレーキ）
        } else if (curv >= 0.0062) {
            return 'green';     // 少し緩いコーナー（アクセルオフ）
        } else {
            return 'blue';      // かなり緩いコーナー（アクセル全開）
        }
    }

    /**
     * UIの更新レンダリング
     */
    renderUI() {
        if (!this.primary) return;

        const info = this.colors[this.primary.severity];
        if (!info) return;

        // メインアイコン色・矢印パス・向き
        this.mainBg.setAttribute('fill', info.bg);
        this.mainArrow.setAttribute('d', this.arrowPaths[this.primary.severity]);

        // 左右反転：右カーブはそのまま、左カーブは中心50で完全対称反転
        const isRight = (this.primary.dir === 'right');
        if (isRight) {
            this.arrowGroup.removeAttribute('transform');
        } else {
            this.arrowGroup.setAttribute('transform', 'translate(100, 0) scale(-1, 1)');
        }

        // ネオングローリングの色
        if (this.glowRing) {
            this.glowRing.style.boxShadow = `0 0 24px ${info.glow}, 0 0 45px ${info.glow}`;
            this.glowRing.style.borderColor = info.bg;
        }

        // 下部アクションテキスト ＆ 距離表示
        if (this.actionText) {
            this.actionText.textContent = info.text;
            this.actionText.style.color = (this.primary.severity === 'blue') ? '#00e5ff' :
                                          (this.primary.severity === 'green') ? '#00ff66' :
                                          (this.primary.severity === 'yellow') ? '#ffea00' : '#ff3344';
        }
        if (this.distText) {
            this.distText.textContent = `${Math.max(0, this.primary.distance)}m`;
        }

        // 第2コーナー（予告ミニアイコン）の更新
        if (this.secondary) {
            this.subWrap.style.display = 'block';
            const subInfo = this.colors[this.secondary.severity];
            this.subBg.setAttribute('fill', subInfo.bg);
            this.subArrow.setAttribute('d', this.arrowPaths[this.secondary.severity]);
            if (this.secondary.dir === 'right') {
                this.subArrowGroup.removeAttribute('transform');
            } else {
                this.subArrowGroup.setAttribute('transform', 'translate(100, 0) scale(-1, 1)');
            }
        } else {
            this.subWrap.style.display = 'none';
        }
    }
}

window.CornerGuide = CornerGuide;
