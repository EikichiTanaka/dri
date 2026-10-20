/**
 * GarageUI.js - ガレージ＆マシン選択UIコントローラー (SEGA Initial D 本格仕様)
 * 3Dショールーム・フロントクォーター美角カメラ演出、スペックシート表示、カラー選択、エンジン空ぶかし試聴
 */

const GARAGE_MFG_MAP = {
    'ae86': 'TOYOTA',
    'fd3s': 'MAZDA',
    'r32': 'NISSAN',
    's13': 'NISSAN',
    'rps13': 'NISSAN',
    'jzx100': 'TOYOTA',
    'ce9a': 'MITSUBISHI',
    'ek9': 'HONDA',
    'cc72v': 'SUZUKI',
    'jza80': 'TOYOTA',
    's15': 'NISSAN'
};

class GarageUI {
    constructor(game) {
        this.game = game;
        this.carIds = ['ae86', 'fd3s', 'r32', 's13', 'rps13', 'jzx100', 'ce9a', 'ek9', 'cc72v', 'jza80', 's15'];
        this.currentIndex = 0;
        this.currentColorIndex = 0;
        this.isOpen = false;

        // ショールームカメラ回転用 (斜め前方の英雄的ビュー)
        this.orbitAngle = 0.65;
        this.orbitDistance = 5.6;
        this.orbitHeight = 1.35;
        this.isDragging = false;
        this.prevMouseX = 0;
        this.prevMouseY = 0;

        this.initDOM();
    }

    initDOM() {
        // DOM要素参照
        this.container = document.getElementById('garage-overlay');
        this.carNameElem = document.getElementById('garage-car-name');
        this.carMfgElem = document.getElementById('garage-car-mfg');
        this.carCategoryElem = document.getElementById('garage-car-category');
        this.carDriveBadge = document.getElementById('garage-car-drive-badge');
        this.carDriverElem = document.getElementById('garage-car-driver');
        this.carDescElem = document.getElementById('garage-car-desc');
        this.engineValElem = document.getElementById('garage-engine-val');
        this.powerValElem = document.getElementById('garage-power-val');
        this.torqueValElem = document.getElementById('garage-torque-val');
        this.weightValElem = document.getElementById('garage-weight-val');
        this.driveValElem = document.getElementById('garage-drive-val');

        // パラメータバー ＆ 数値ラベル
        this.barSpeed = document.getElementById('stat-bar-speed');
        this.barAccel = document.getElementById('stat-bar-accel');
        this.barHandling = document.getElementById('stat-bar-handling');
        this.barDrift = document.getElementById('stat-bar-drift');
        this.barStability = document.getElementById('stat-bar-stability');

        this.statValSpeed = document.getElementById('stat-val-speed');
        this.statValAccel = document.getElementById('stat-val-accel');
        this.statValHandling = document.getElementById('stat-val-handling');
        this.statValDrift = document.getElementById('stat-val-drift');
        this.statValStability = document.getElementById('stat-val-stability');

        // カラーボタングループ ＆ カラー名表示
        this.colorGroup = document.getElementById('garage-color-group');
        this.colorNameElem = document.getElementById('garage-color-name');

        // ボタン
        this.btnPrev = document.getElementById('btn-garage-prev');
        this.btnNext = document.getElementById('btn-garage-next');
        this.btnRev = document.getElementById('btn-garage-rev');
        this.btnSelect = document.getElementById('btn-garage-select');
        this.btnClose = document.getElementById('btn-garage-close');

        // イベントバインド
        if (this.btnPrev) this.btnPrev.addEventListener('click', () => this.prevCar());
        if (this.btnNext) this.btnNext.addEventListener('click', () => this.nextCar());
        if (this.btnRev) this.btnRev.addEventListener('click', () => this.revEngine());
        if (this.btnSelect) this.btnSelect.addEventListener('click', () => this.confirmSelection());
        if (this.btnClose) this.btnClose.addEventListener('click', () => this.close());

        // 車両セレクターカード群生成
        this.cardContainer = document.getElementById('garage-car-cards');
        if (this.cardContainer) {
            this.cardContainer.innerHTML = '';
            this.carIds.forEach((id, idx) => {
                const car = CAR_DATABASE[id];
                if (!car) return;
                const mfg = GARAGE_MFG_MAP[id] || 'JAPAN';
                const card = document.createElement('div');
                card.className = 'garage-car-card' + (idx === 0 ? ' active' : '');
                card.id = `garage-card-${id}`;
                card.innerHTML = `
                    <div class="card-mfg-row">
                        <span class="card-mfg-tag">${mfg}</span>
                        <span class="card-drive-pill ${car.drivetrain.toLowerCase()}">${car.drivetrain}</span>
                    </div>
                    <div class="card-model-code">${car.modelCode}</div>
                    <div class="card-car-name">${car.shortName}</div>
                `;
                card.addEventListener('click', () => this.selectCarByIndex(idx));
                this.cardContainer.appendChild(card);
            });
        }

        // キーボード操作サポート (左右で車両切替、Enterで決定、ESCで閉じる、Space/Rで空ぶかし)
        window.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            if (e.key === 'ArrowLeft') {
                this.prevCar();
                e.preventDefault();
            } else if (e.key === 'ArrowRight') {
                this.nextCar();
                e.preventDefault();
            } else if (e.key === 'Enter') {
                this.confirmSelection();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                this.close();
                e.preventDefault();
            } else if (e.key === ' ' || e.key === 'r' || e.key === 'R') {
                this.revEngine();
                e.preventDefault();
            }
        });

        // 3Dドラッグ回転イベント
        window.addEventListener('mousedown', (e) => {
            if (this.isOpen && (e.target.id === 'canvas-container' || (e.target.tagName === 'CANVAS' && !e.target.closest('#garage-overlay')))) {
                this.isDragging = true;
                this.prevMouseX = e.clientX;
                this.prevMouseY = e.clientY;
            }
        });
        window.addEventListener('mousemove', (e) => {
            if (this.isOpen && this.isDragging) {
                const dx = e.clientX - this.prevMouseX;
                const dy = e.clientY - this.prevMouseY;
                this.orbitAngle += dx * 0.007;
                this.orbitHeight = Math.max(0.6, Math.min(3.2, this.orbitHeight - dy * 0.007));
                this.prevMouseX = e.clientX;
                this.prevMouseY = e.clientY;
            }
        });
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
    }

    open() {
        this.isOpen = true;
        if (this.container) this.container.style.display = 'flex';
        const startOverlay = document.getElementById('start-overlay');
        if (startOverlay) startOverlay.style.display = 'none';

        if (this.game && this.game.audio) {
            this.game.audio.resume();
        }

        // ガレージ位置にプレイヤー車を配置（原点付近）
        this.game.enterGarageMode();

        // カメラ初期位置を車の3/4フロント美角（斜め前からの迫力アングル）に設定
        const carYaw = (this.game.playerPhysics && this.game.playerPhysics.yaw !== undefined) ? this.game.playerPhysics.yaw : 0;
        this.orbitAngle = carYaw + 0.65;
        this.orbitDistance = 5.6;
        this.orbitHeight = 1.35;

        // 現在のマシンを選択
        if (this.game && this.game.selectedCarId) {
            const idx = this.carIds.indexOf(this.game.selectedCarId);
            if (idx !== -1) {
                this.currentIndex = idx;
                this.currentColorIndex = this.game.selectedColorIndex || 0;
            }
        }

        this.updateCarDisplay();
    }

    close() {
        this.isOpen = false;
        if (this.container) this.container.style.display = 'none';
        const startOverlay = document.getElementById('start-overlay');
        if (startOverlay) startOverlay.style.display = 'flex';
        this.game.exitGarageMode();
    }

    confirmSelection() {
        this.close();
    }

    nextCar() {
        this.currentIndex = (this.currentIndex + 1) % this.carIds.length;
        this.currentColorIndex = 0;
        this.updateCarDisplay();
    }

    prevCar() {
        this.currentIndex = (this.currentIndex - 1 + this.carIds.length) % this.carIds.length;
        this.currentColorIndex = 0;
        this.updateCarDisplay();
    }

    selectCarByIndex(idx) {
        this.currentIndex = idx;
        this.currentColorIndex = 0;
        this.updateCarDisplay();
    }

    selectCar(id) {
        const idx = this.carIds.indexOf(id);
        if (idx !== -1) {
            this.selectCarByIndex(idx);
        }
    }

    get selectedCarId() {
        return this.carIds[this.currentIndex];
    }

    get selectedColorIdx() {
        return this.currentColorIndex;
    }

    confirmCar() {
        this.confirmSelection();
    }

    selectColor(colIdx) {
        this.currentColorIndex = colIdx;
        const currentCarId = this.carIds[this.currentIndex];
        this.game.applyPlayerCar(currentCarId, this.currentColorIndex);
        this.updateColorButtons();
    }

    updateCarDisplay() {
        const carId = this.carIds[this.currentIndex];
        const car = CAR_DATABASE[carId];
        if (!car) return;

        // ゲーム内の車体更新
        this.game.applyPlayerCar(carId, this.currentColorIndex);

        // テキスト情報
        const mfg = GARAGE_MFG_MAP[carId] || 'JAPAN';
        if (this.carMfgElem) this.carMfgElem.textContent = mfg;
        if (this.carNameElem) this.carNameElem.textContent = car.name;
        if (this.carCategoryElem) this.carCategoryElem.textContent = car.category;
        if (this.carDriveBadge) {
            this.carDriveBadge.textContent = car.drivetrain;
            this.carDriveBadge.className = `car-drive-pill ${car.drivetrain.toLowerCase()}`;
        }
        if (this.carDriverElem) this.carDriverElem.textContent = `劇中ドライバー: ${car.driver}`;
        if (this.carDescElem) this.carDescElem.textContent = car.desc;
        if (this.engineValElem) this.engineValElem.textContent = car.engineName;
        if (this.powerValElem) this.powerValElem.textContent = car.power;
        if (this.torqueValElem) this.torqueValElem.textContent = car.torque;
        if (this.weightValElem) this.weightValElem.textContent = car.weight;
        if (this.driveValElem) this.driveValElem.textContent = `${car.drivetrain} (${car.drivetrain === 'FR' ? '後輪駆動' : (car.drivetrain === '4WD' ? '四輪駆動' : '前輪駆動')})`;

        // パラメータバー ＆ 数値
        if (this.barSpeed) this.barSpeed.style.width = `${car.stats.speed * 10}%`;
        if (this.barAccel) this.barAccel.style.width = `${car.stats.accel * 10}%`;
        if (this.barHandling) this.barHandling.style.width = `${car.stats.handling * 10}%`;
        if (this.barDrift) this.barDrift.style.width = `${car.stats.drift * 10}%`;
        if (this.barStability) this.barStability.style.width = `${car.stats.stability * 10}%`;

        if (this.statValSpeed) this.statValSpeed.textContent = car.stats.speed.toFixed(1);
        if (this.statValAccel) this.statValAccel.textContent = car.stats.accel.toFixed(1);
        if (this.statValHandling) this.statValHandling.textContent = car.stats.handling.toFixed(1);
        if (this.statValDrift) this.statValDrift.textContent = car.stats.drift.toFixed(1);
        if (this.statValStability) this.statValStability.textContent = car.stats.stability.toFixed(1);

        // 車両カードのアクティブ状態 ＆ 自動スクロール
        this.carIds.forEach(id => {
            const card = document.getElementById(`garage-card-${id}`);
            if (card) {
                if (id === carId) {
                    card.classList.add('active');
                    // スムーズスクロールで中央へ
                    card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                } else {
                    card.classList.remove('active');
                }
            }
        });

        // カラーパレット再生成
        this.updateColorButtons();
    }

    updateColorButtons() {
        const carId = this.carIds[this.currentIndex];
        const car = CAR_DATABASE[carId];
        if (!car || !this.colorGroup) return;

        this.colorGroup.innerHTML = '';
        car.colors.forEach((col, idx) => {
            const btn = document.createElement('button');
            btn.className = 'garage-color-btn' + (idx === this.currentColorIndex ? ' active' : '');
            btn.title = col.name;
            const hexStr = '#' + col.primary.toString(16).padStart(6, '0');
            const secHex = '#' + col.secondary.toString(16).padStart(6, '0');
            btn.style.background = `linear-gradient(135deg, ${hexStr} 50%, ${secHex} 50%)`;
            btn.addEventListener('click', () => this.selectColor(idx));
            this.colorGroup.appendChild(btn);
        });

        if (this.colorNameElem && car.colors[this.currentColorIndex]) {
            this.colorNameElem.textContent = car.colors[this.currentColorIndex].name;
        }
    }

    revEngine() {
        const carId = this.carIds[this.currentIndex];
        if (this.game && this.game.audio) {
            this.game.audio.resume();
            this.game.audio.previewRev(carId, (intensity) => {
                const exhaust = this.game.playerCar.getExhaustPosition();
                this.game.particles.emitAfterfire(exhaust.position, exhaust.direction, intensity, false);
            });
        }
    }

    update(dt) {
        if (!this.isOpen) return;

        // 優雅にターンテーブル自動回転 (約38秒で1周するジェントルなサロン演出)
        if (!this.isDragging) {
            this.orbitAngle += dt * 0.16;
        }

        // カメラを車の周囲を回るように配置
        const targetPos = this.game.playerPhysics.position.clone().add(new THREE.Vector3(0, 0.45, 0));
        const camX = targetPos.x + Math.sin(this.orbitAngle) * this.orbitDistance;
        const camZ = targetPos.z + Math.cos(this.orbitAngle) * this.orbitDistance;
        const camY = targetPos.y + this.orbitHeight;

        this.game.camera.position.set(camX, camY, camZ);
        this.game.camera.lookAt(targetPos);
    }
}

window.GarageUI = GarageUI;
