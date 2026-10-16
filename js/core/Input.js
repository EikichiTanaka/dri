/**
 * Input.js - キーボード & ゲームパッド入力統合マネージャー
 * キーボード（WASD / 矢印）と各種ゲームコントローラー（Xbox/PS）のアナログ入力に対応
 */

class InputManager {
    constructor() {
        this.keys = {};

        // 状態
        this.steer = 0; // -1.0 (左) ~ +1.0 (右)
        this.throttle = 0; // 0.0 ~ 1.0
        this.brake = 0; // 0.0 ~ 1.0
        this.handbrake = false;

        this.shiftUp = false;
        this.shiftDown = false;
        this.changeView = false;
        this.reset = false;
        this.toggleLight = false;
        this.toggleAssist = false;

        // 直前フレームの状態（エッジトリガー検知用）
        this.prevShiftUp = false;
        this.prevShiftDown = false;
        this.prevChangeView = false;
        this.prevReset = false;
        this.prevToggleLight = false;
        this.prevToggleAssist = false;

        this.gamepadIndex = null;

        this.initListeners();
    }

    initListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.code) this.keys[e.code] = true;
            if (e.key) this.keys[e.key] = true;
            // スペースキーなどでの画面スクロール防止
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) ||
                ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code) this.keys[e.code] = false;
            if (e.key) this.keys[e.key] = false;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
        });

        window.addEventListener('gamepadconnected', (e) => {
            console.log('Gamepad connected:', e.gamepad.id);
            this.gamepadIndex = e.gamepad.index;
        });

        window.addEventListener('gamepaddisconnected', (e) => {
            console.log('Gamepad disconnected');
            if (this.gamepadIndex === e.gamepad.index) {
                this.gamepadIndex = null;
            }
        });
    }

    update() {
        // キーボード入力の取得（ステアリングは A/D のみ。矢印キー左右はシフト操作専用）
        let kSteer = 0;
        if (this.keys['KeyA'] || this.keys['a'] || this.keys['A']) kSteer -= 1.0;
        if (this.keys['KeyD'] || this.keys['d'] || this.keys['D']) kSteer += 1.0;

        let kThrottle = 0;
        if (this.keys['KeyW'] || this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) kThrottle = 1.0;

        let kBrake = 0;
        if (this.keys['KeyS'] || this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) kBrake = 1.0;

        let kHandbrake = !!this.keys['Space'];

        // ★ユーザー指定：矢印キーの左右でシフトチェンジ（←：シフトダウン、→：シフトアップ）
        let rawShiftUp = !!(
            this.keys['ArrowRight'] || this.keys['KeyE'] || this.keys['ShiftLeft'] || this.keys['ShiftRight'] ||
            this.keys['e'] || this.keys['E'] || this.keys['Shift']
        );
        let rawShiftDown = !!(
            this.keys['ArrowLeft'] || this.keys['KeyQ'] || this.keys['ControlLeft'] || this.keys['ControlRight'] ||
            this.keys['q'] || this.keys['Q'] || this.keys['Control']
        );
        let rawChangeView = !!(this.keys['KeyC'] || this.keys['c'] || this.keys['C']);
        let rawReset = !!(this.keys['KeyR'] || this.keys['r'] || this.keys['R']);
        let rawToggleLight = !!(this.keys['KeyL'] || this.keys['l'] || this.keys['L']);
        let rawToggleAssist = !!(this.keys['KeyT'] || this.keys['t'] || this.keys['T']);

        // ゲームパッド入力の統合
        let gp = this.getGamepad();
        if (gp) {
            // アナログスティック左右
            const stickX = gp.axes[0] || 0;
            if (Math.abs(stickX) > 0.18) {
                kSteer = stickX;
            } else if (gp.buttons[14] && gp.buttons[14].pressed) {
                kSteer = -1.0; // 十字キー左
            } else if (gp.buttons[15] && gp.buttons[15].pressed) {
                kSteer = 1.0;  // 十字キー右
            }

            // アクセルトリガー (RT: button 7 or Aボタン)
            if (gp.buttons[7] && gp.buttons[7].value > 0.08) {
                kThrottle = gp.buttons[7].value;
            } else if (gp.buttons[0] && gp.buttons[0].pressed) {
                kThrottle = 1.0; // Aボタン
            }

            // ブレーキトリガー (LT: button 6 or Bボタン)
            if (gp.buttons[6] && gp.buttons[6].value > 0.08) {
                kBrake = gp.buttons[6].value;
            } else if (gp.buttons[1] && gp.buttons[1].pressed) {
                kBrake = 1.0; // Bボタン
            }

            // サイドブレーキ (RB: button 5)
            if (gp.buttons[5] && gp.buttons[5].pressed) {
                kHandbrake = true;
            }

            // シフト操作 (Y: button 3 シフトアップ / X: button 2 シフトダウン)
            if (gp.buttons[3] && gp.buttons[3].pressed) rawShiftUp = true;
            if (gp.buttons[2] && gp.buttons[2].pressed) rawShiftDown = true;
            if (gp.buttons[9] && gp.buttons[9].pressed) rawChangeView = true;
            if (gp.buttons[8] && gp.buttons[8].pressed) rawToggleLight = true;
        }

        this.steer = kSteer;
        this.throttle = kThrottle;
        this.brake = kBrake;
        this.handbrake = kHandbrake;

        // ワンショット（立ち上がりエッジ）判定
        this.shiftUp = rawShiftUp && !this.prevShiftUp;
        this.shiftDown = rawShiftDown && !this.prevShiftDown;
        this.changeView = rawChangeView && !this.prevChangeView;
        this.reset = rawReset && !this.prevReset;
        this.toggleLight = rawToggleLight && !this.prevToggleLight;
        this.toggleAssist = rawToggleAssist && !this.prevToggleAssist;

        this.prevShiftUp = rawShiftUp;
        this.prevShiftDown = rawShiftDown;
        this.prevChangeView = rawChangeView;
        this.prevReset = rawReset;
        this.prevToggleLight = rawToggleLight;
        this.prevToggleAssist = rawToggleAssist;
    }

    getGamepad() {
        if (!navigator.getGamepads) return null;
        const pads = navigator.getGamepads();
        for (let i = 0; i < pads.length; i++) {
            if (pads[i]) return pads[i];
        }
        return null;
    }
}

window.InputManager = InputManager;
