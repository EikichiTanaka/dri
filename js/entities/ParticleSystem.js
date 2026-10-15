/**
 * ParticleSystem.js - タイヤスモーク、スキッドマーク、ガードレール火花、スピードライン
 * ドリフト時のモクモクした白煙、路面の焼き付きタイヤ痕、壁激突時の火花をリアルタイム生成
 */

class ParticleSystem {
    constructor(scene) {
        this.scene = scene;

        // タイヤスモーク用プール
        this.maxSmokes = 400;
        this.smokes = [];
        this.smokeGeom = new THREE.PlaneGeometry(1.2, 1.2);
        this.smokeMat = new THREE.MeshBasicMaterial({
            color: 0xdddddd,
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        // スモークメッシュの初期化
        this.smokeGroup = new THREE.Group();
        for (let i = 0; i < this.maxSmokes; i++) {
            const mesh = new THREE.Mesh(this.smokeGeom, this.smokeMat.clone());
            mesh.visible = false;
            this.smokeGroup.add(mesh);
            this.smokes.push({
                mesh: mesh,
                active: false,
                life: 0,
                maxLife: 1.0,
                velocity: new THREE.Vector3(),
                scale: 1.0
            });
        }
        this.scene.add(this.smokeGroup);

        // ガードレール火花用プール
        this.maxSparks = 150;
        this.sparks = [];
        const sparkGeom = new THREE.BufferGeometry();
        const sparkPos = new Float32Array(this.maxSparks * 3);
        const sparkColors = new Float32Array(this.maxSparks * 3);
        sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
        sparkGeom.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

        const sparkMat = new THREE.PointsMaterial({
            size: 0.28,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        this.sparkPoints = new THREE.Points(sparkGeom, sparkMat);
        this.scene.add(this.sparkPoints);

        for (let i = 0; i < this.maxSparks; i++) {
            this.sparks.push({
                active: false,
                pos: new THREE.Vector3(),
                vel: new THREE.Vector3(),
                life: 0,
                maxLife: 0.5
            });
        }

        // ★峠道路肩：茶褐色の土煙（Dirt Dust）パーティクルプール
        this.maxDirtSmokes = 180;
        this.dirtSmokes = [];
        this.dirtSmokeGeom = new THREE.PlaneGeometry(1.3, 1.3);
        this.dirtSmokeGroup = new THREE.Group();

        const dirtColors = [0x8f7252, 0x7a5e3d, 0xa18764, 0x694d30, 0x826c54];
        for (let i = 0; i < this.maxDirtSmokes; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: dirtColors[i % dirtColors.length],
                transparent: true,
                opacity: 0.45,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(this.dirtSmokeGeom, mat);
            mesh.visible = false;
            this.dirtSmokeGroup.add(mesh);
            this.dirtSmokes.push({
                mesh: mesh,
                mat: mat,
                active: false,
                life: 0,
                maxLife: 0.6,
                velocity: new THREE.Vector3(),
                startScale: 0.35,
                endScale: 1.1,
                baseOpacity: 0.40
            });
        }
        this.scene.add(this.dirtSmokeGroup);

        // ★峠道路肩：跳ね飛ぶ小石・砕石（Gravel Spray）パーティクルプール
        this.maxGravelSparks = 180;
        this.gravelSparks = [];
        const gravelGeom = new THREE.BufferGeometry();
        const gravelPos = new Float32Array(this.maxGravelSparks * 3);
        const gravelColors = new Float32Array(this.maxGravelSparks * 3);
        gravelGeom.setAttribute('position', new THREE.BufferAttribute(gravelPos, 3));
        gravelGeom.setAttribute('color', new THREE.BufferAttribute(gravelColors, 3));

        const gravelMat = new THREE.PointsMaterial({
            size: 0.22,
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.NormalBlending
        });
        this.gravelPoints = new THREE.Points(gravelGeom, gravelMat);
        this.scene.add(this.gravelPoints);

        for (let i = 0; i < this.maxGravelSparks; i++) {
            this.gravelSparks.push({
                active: false,
                pos: new THREE.Vector3(),
                vel: new THREE.Vector3(),
                groundY: 0,
                life: 0,
                maxLife: 0.45
            });
        }

        // =========================================================================
        // ★リアルタイム・スキッドマーク（タイヤ痕）クワッド・リングバッファ 2.0
        // 実車スポーツタイヤのリアルなトレッド溝・ショルダー高接地圧プロファイルテクスチャ
        // ドリフト後も長時間路面に残り続ける超大容量バッファ (4,800クワッド / 19,200頂点)
        // =========================================================================
        this.maxSkidQuads = 4800; // 4,800クワッド（全コーナーのドリフト痕が数分間美しく持続）
        this.skidQuadIndex = 0;
        this.skidNeedsUpdate = false;

        const totalVerts = this.maxSkidQuads * 4;
        const totalIndices = this.maxSkidQuads * 6;
        const skidPositions = new Float32Array(totalVerts * 3);
        const skidColors = new Float32Array(totalVerts * 4);
        const skidUvs = new Float32Array(totalVerts * 2);
        const skidIndices = new Uint16Array(totalIndices);

        // 初期状態は画面外（Y = -9999）に退避
        for (let i = 0; i < totalVerts; i++) {
            skidPositions[i * 3 + 1] = -9999;
            skidColors[i * 4] = 0.04;
            skidColors[i * 4 + 1] = 0.04;
            skidColors[i * 4 + 2] = 0.05;
            skidColors[i * 4 + 3] = 0.0;
        }

        // クワッド（2ポリゴン）インデックスの静的構築 [0,1,2, 2,1,3, 4,5,6, ...]
        for (let q = 0; q < this.maxSkidQuads; q++) {
            const vBase = q * 4;
            const iBase = q * 6;
            skidIndices[iBase] = vBase;
            skidIndices[iBase + 1] = vBase + 1;
            skidIndices[iBase + 2] = vBase + 2;
            skidIndices[iBase + 3] = vBase + 2;
            skidIndices[iBase + 4] = vBase + 1;
            skidIndices[iBase + 5] = vBase + 3;
        }

        // ★実車のラジアル/Sタイヤの焼き付きトレッドパターン（溝＋ショルダー高接地圧）テクスチャ生成
        this.skidTexture = this.generateSkidTexture();

        this.skidGeom = new THREE.BufferGeometry();
        this.skidGeom.setAttribute('position', new THREE.BufferAttribute(skidPositions, 3));
        this.skidGeom.setAttribute('color', new THREE.BufferAttribute(skidColors, 4));
        this.skidGeom.setAttribute('uv', new THREE.BufferAttribute(skidUvs, 2));
        this.skidGeom.setIndex(new THREE.BufferAttribute(skidIndices, 1));

        // ★GPUへの動的バッファ更新属性を明示（GPUキャッシュ問題を完全防止）
        this.skidGeom.attributes.position.setUsage(THREE.DynamicDrawUsage);
        this.skidGeom.attributes.color.setUsage(THREE.DynamicDrawUsage);
        this.skidGeom.attributes.uv.setUsage(THREE.DynamicDrawUsage);

        // ★視錐台カリング用の超巨大バウンディングスフィアを固定定義
        this.skidGeom.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100000);

        const skidMat = new THREE.MeshBasicMaterial({
            map: this.skidTexture,
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1.5,
            polygonOffsetUnits: -4.0,
            side: THREE.DoubleSide
        });

        this.skidMesh = new THREE.Mesh(this.skidGeom, skidMat);
        this.skidMesh.renderOrder = 3; // 路面および事前タイヤ痕の直後に描画
        this.skidMesh.frustumCulled = false; // ★絶対に視錐台カリングさせない（画面外スキップを完全防止）
        this.scene.add(this.skidMesh);

        // 【4】クワッドごとの経過時間（age）と初期アルファの記録バッファ（熱い漆黒から冷えたマットグレーへの経年変化用）
        this.skidQuadAge = new Float32Array(this.maxSkidQuads);
        this.skidQuadInitialAlpha = new Float32Array(this.maxSkidQuads);
        this.skidQuadAge.fill(9999.0); // 初期状態は完全に冷却済み

        // 左右車輪ごとの打刻トラッキング状態（リア駆動輪＋【1】フロント操舵輪）
        this.playerTireL = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };
        this.playerTireR = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };
        this.playerFrontTireL = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };
        this.playerFrontTireR = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };

        this.rivalTireL = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };
        this.rivalTireR = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };
        this.rivalFrontTireL = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };
        this.rivalFrontTireR = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };

        this.playerLastL = null;
        this.playerLastR = null;
        this.rivalLastL = null;
        this.rivalLastR = null;

        // 【3】タイヤ痕直後からの微細な路面余熱ヴェイパー（Hot Surface Wisps / 熱気スモーク）プール
        this.maxHeatWisps = 60;
        this.heatWisps = [];
        this.heatWispGeom = new THREE.PlaneGeometry(0.35, 0.35);
        this.heatWispTexture = this.generateWispTexture();
        this.heatWispMat = new THREE.MeshBasicMaterial({
            map: this.heatWispTexture,
            transparent: true,
            opacity: 0.12,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.heatWispGroup = new THREE.Group();
        this.heatWispGroup.renderOrder = 4; // スキッドマークの直後に描画

        for (let i = 0; i < this.maxHeatWisps; i++) {
            const mesh = new THREE.Mesh(this.heatWispGeom, this.heatWispMat.clone());
            mesh.visible = false;
            this.heatWispGroup.add(mesh);
            this.heatWisps.push({
                mesh: mesh,
                active: false,
                life: 0,
                maxLife: 1.6,
                baseScale: 0.35,
                targetScale: 0.75,
                baseOpacity: 0.12,
                velocity: new THREE.Vector3()
            });
        }
        this.scene.add(this.heatWispGroup);

        // ★アフターファイヤ（マフラー火炎）パーティクルプール
        this.maxFlames = 90;
        this.flames = [];
        this.flameGeom = new THREE.PlaneGeometry(0.38, 0.38);
        this.flameGroup = new THREE.Group();

        for (let i = 0; i < this.maxFlames; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.95,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                side: THREE.DoubleSide
            });
            const mesh = new THREE.Mesh(this.flameGeom, mat);
            mesh.visible = false;
            this.flameGroup.add(mesh);
            this.flames.push({
                mesh: mesh,
                mat: mat,
                active: false,
                life: 0,
                maxLife: 0.1,
                velocity: new THREE.Vector3(),
                startScale: 0.3,
                endScale: 0.8,
                isCore: false
            });
        }
        this.scene.add(this.flameGroup);

        // マフラーフラッシュライト（夜の路面・車体を照らす瞬間発光）
        this.playerFlameLight = new THREE.PointLight(0xff7722, 0, 9, 2.2);
        this.playerFlameLightTimer = 0;
        this.scene.add(this.playerFlameLight);

        this.rivalFlameLight = new THREE.PointLight(0xff6611, 0, 9, 2.2);
        this.rivalFlameLightTimer = 0;
        this.scene.add(this.rivalFlameLight);

        // テールランプ残像光跡（Light Trails）初期化
        this.initLightTrails();

        // ★雨天パーティクル（降雨ストリーク：カメラ追従3Dパーティクル）
        this.maxRainDrops = 4200;
        this.isRaining = false;
        const rainGeom = new THREE.BufferGeometry();
        const rainPositions = new Float32Array(this.maxRainDrops * 2 * 3);
        const boxW = 44, boxH = 24, boxD = 44;
        for (let i = 0; i < this.maxRainDrops; i++) {
            const rx = (Math.random() - 0.5) * boxW;
            const ry = Math.random() * boxH - 4;
            const rz = (Math.random() - 0.5) * boxD;
            const streakLen = 2.0 + Math.random() * 1.0;
            const idx = i * 6;
            rainPositions[idx] = rx;
            rainPositions[idx + 1] = ry;
            rainPositions[idx + 2] = rz;
            rainPositions[idx + 3] = rx - 0.18;
            rainPositions[idx + 4] = ry - streakLen;
            rainPositions[idx + 5] = rz - 0.18;
        }
        rainGeom.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
        const rainMat = new THREE.LineBasicMaterial({
            color: 0xadc8e2,
            transparent: true,
            opacity: 0.68,
            depthWrite: false
        });
        this.rainMesh = new THREE.LineSegments(rainGeom, rainMat);
        this.rainMesh.visible = false;
        this.scene.add(this.rainMesh);
    }

    setWeather(weather) {
        this.isRaining = (weather === 'rain');
        if (this.rainMesh) {
            this.rainMesh.visible = this.isRaining;
        }
    }

    emitSmoke(pos, baseVel, intensity = 1.0) {
        for (let i = 0; i < this.maxSmokes; i++) {
            const s = this.smokes[i];
            if (!s.active) {
                s.active = true;
                s.life = 0;
                s.isWaterSpray = this.isRaining;

                if (this.isRaining) {
                    // ★雨天時：タイヤ水しぶき（控えめで繊細なウェットスプレー）
                    s.mesh.material.color.setHex(0xd8e8f8);
                    s.maxLife = 0.20 + Math.random() * 0.12; // 素早く消散
                    s.scale = (0.16 + Math.random() * 0.10) * Math.min(0.65, intensity); // 小さくコンパクト
                    s.mesh.material.opacity = 0.13 * Math.min(0.6, intensity); // 薄い透明感

                    // 路面近くで後方に細かく散る
                    s.mesh.position.copy(pos);
                    s.mesh.position.x += (Math.random() - 0.5) * 0.20;
                    s.mesh.position.y = pos.y + 0.05 + Math.random() * 0.08;
                    s.mesh.position.z += (Math.random() - 0.5) * 0.20;

                    s.velocity.copy(baseVel).multiplyScalar(-0.18);
                    s.velocity.x += (Math.random() - 0.5) * 0.5;
                    s.velocity.y = 0.06 + Math.random() * 0.12; // 高く舞い上がらせず抑える
                    s.velocity.z += (Math.random() - 0.5) * 0.5;
                } else {
                    // ドライ時：タイヤスモーク（白煙）
                    s.mesh.material.color.setHex(0xdddddd);
                    s.maxLife = 0.38 + Math.random() * 0.14;
                    s.scale = 0.32 * Math.min(1.0, intensity);
                    s.mesh.material.opacity = 0.22 * Math.min(1.0, intensity);

                    s.mesh.position.copy(pos);
                    s.mesh.position.x += (Math.random() - 0.5) * 0.25;
                    s.mesh.position.y = pos.y + 0.08 + Math.random() * 0.1;
                    s.mesh.position.z += (Math.random() - 0.5) * 0.25;

                    s.velocity.copy(baseVel).multiplyScalar(-0.25);
                    s.velocity.x += (Math.random() - 0.5) * 0.6;
                    s.velocity.y = 0.12 + Math.random() * 0.18;
                    s.velocity.z += (Math.random() - 0.5) * 0.6;
                }

                s.mesh.visible = true;
                s.mesh.scale.set(s.scale, s.scale, s.scale);
                break;
            }
        }
    }

    emitSparks(pos, count = 15) {
        let spawned = 0;
        for (let i = 0; i < this.maxSparks && spawned < count; i++) {
            const sp = this.sparks[i];
            if (!sp.active) {
                sp.active = true;
                sp.life = 0;
                sp.maxLife = 0.3 + Math.random() * 0.3;
                sp.pos.copy(pos);
                sp.vel.set(
                    (Math.random() - 0.5) * 12,
                    2.0 + Math.random() * 8.0,
                    (Math.random() - 0.5) * 12
                );
                spawned++;
            }
        }
    }

    /**
     * 路肩や未舗装砂利を踏んだ際の土煙（Dirt Dust）放出
     */
    emitDirtDust(pos, baseVel, intensity = 1.0) {
        const count = Math.min(3, Math.floor(1 + intensity * 2));
        let spawned = 0;

        for (let i = 0; i < this.maxDirtSmokes && spawned < count; i++) {
            const s = this.dirtSmokes[i];
            if (!s.active) {
                s.active = true;
                s.life = 0;
                s.maxLife = 0.45 + Math.random() * 0.25;
                s.startScale = (0.28 + Math.random() * 0.15) * Math.min(1.2, intensity);
                s.endScale = (0.95 + Math.random() * 0.45) * Math.min(1.3, intensity);
                s.baseOpacity = (0.35 + Math.random() * 0.15) * Math.min(1.0, intensity);

                s.mesh.position.copy(pos);
                s.mesh.position.x += (Math.random() - 0.5) * 0.35;
                s.mesh.position.y = pos.y + 0.08 + Math.random() * 0.10;
                s.mesh.position.z += (Math.random() - 0.5) * 0.35;

                // 車両進行方向と逆向きに吹き飛ばされつつ、上方にフワッと舞い上がる
                s.velocity.copy(baseVel).multiplyScalar(-0.22);
                s.velocity.x += (Math.random() - 0.5) * 1.2;
                s.velocity.y = 0.35 + Math.random() * 0.55; // 上昇気流
                s.velocity.z += (Math.random() - 0.5) * 1.2;

                s.mesh.scale.set(s.startScale, s.startScale, s.startScale);
                s.mat.opacity = s.baseOpacity;
                s.mesh.visible = true;

                spawned++;
            }
        }
    }

    /**
     * 路肩や未舗装砂利を踏んだ際の跳ね石（Gravel Spray）放出
     */
    emitGravelSpray(pos, baseVel, intensity = 1.0, side = 1) {
        const count = Math.min(6, Math.floor(2 + intensity * 4));
        let spawned = 0;

        // 小石の自然色（ダークスレート、黄土、褐色、砂色）
        const pebbleTones = [
            [0.32, 0.28, 0.24],
            [0.48, 0.42, 0.36],
            [0.58, 0.50, 0.42],
            [0.26, 0.24, 0.22],
            [0.65, 0.56, 0.46]
        ];

        const colorsAttr = this.gravelPoints.geometry.attributes.color;

        for (let i = 0; i < this.maxGravelSparks && spawned < count; i++) {
            const sp = this.gravelSparks[i];
            if (!sp.active) {
                sp.active = true;
                sp.life = 0;
                sp.maxLife = 0.25 + Math.random() * 0.25;
                sp.pos.copy(pos);
                sp.pos.x += (Math.random() - 0.5) * 0.3;
                sp.pos.y = pos.y + 0.06 + Math.random() * 0.06;
                sp.pos.z += (Math.random() - 0.5) * 0.3;
                sp.groundY = pos.y;

                // 車輪の回転で後方および外側に勢いよく弾け飛ぶ
                const backwards = baseVel.clone().multiplyScalar(-0.35);
                sp.vel.set(
                    backwards.x + (Math.random() - 0.5) * 3.5 + side * (0.8 + Math.random() * 2.2),
                    1.8 + Math.random() * 3.8, // 跳ね上がり初速
                    backwards.z + (Math.random() - 0.5) * 3.5
                );

                const c = pebbleTones[Math.floor(Math.random() * pebbleTones.length)];
                colorsAttr.setXYZ(i, c[0], c[1], c[2]);

                spawned++;
            }
        }
        colorsAttr.needsUpdate = true;
    }

    /**
     * ★実車のスポーツラジアル（ネオバ/ポテンザ等）のトレッド面をプロシージャル生成
     * ショルダー高接地圧ピーク、縦主溝（グルーブ抜けスリット）、アスファルト骨材擦過縦筋を完全再現
     */
    generateSkidTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(128, 64);
        const data = imgData.data;

        for (let y = 0; y < 64; y++) {
            const v = y / 64.0;
            // 進行方向の微小なアスファルト擦れ波（シームレス周期関数）
            const longitudinalNoise = 
                Math.sin(v * Math.PI * 2) * 0.04 +
                Math.sin(v * Math.PI * 6) * 0.03 +
                Math.cos(v * Math.PI * 10) * 0.02;

            for (let x = 0; x < 128; x++) {
                const u = x / 127.0; // 0.0 (左端) 〜 1.0 (右端)

                // 1. ショルダー高接地圧ピーク（両端部にかけて旋回横Gで面圧が集中）
                let edgePeak = 0;
                if (u < 0.15) {
                    const edgeFrac = u / 0.15;
                    edgePeak = Math.sin(edgeFrac * Math.PI * 0.5) * 0.32;
                } else if (u > 0.85) {
                    const edgeFrac = (1.0 - u) / 0.15;
                    edgePeak = Math.sin(edgeFrac * Math.PI * 0.5) * 0.32;
                }

                // 2. 主溝（グルーブ）：実車スポーツラジアルの3本ストレートグルーブ抜け
                const g1 = Math.exp(-Math.pow((u - 0.30) / 0.038, 2));
                const g2 = Math.exp(-Math.pow((u - 0.50) / 0.034, 2));
                const g3 = Math.exp(-Math.pow((u - 0.70) / 0.038, 2));
                const grooveDeduction = (g1 * 0.72 + g2 * 0.62 + g3 * 0.72);

                // 3. アスファルト粗粒に削られたゴムの微小な引きずり縦筋ノイズ
                const scratchNoise = 
                    Math.sin(u * 125.0 + 1.2) * 0.07 +
                    Math.cos(u * 290.0 + 0.4) * 0.05 +
                    Math.sin(u * 440.0 + v * 30.0) * 0.04;

                // 4. 端部の自然なソフトフェード（カクつきを完全排除）
                let sideFade = 1.0;
                if (u < 0.035) sideFade = u / 0.035;
                else if (u > 0.965) sideFade = (1.0 - u) / 0.035;

                // 統合アルファ (0.0 〜 1.0)
                let a = (0.76 + edgePeak - grooveDeduction + longitudinalNoise + scratchNoise);
                a = Math.max(0.0, Math.min(1.0, a)) * sideFade;

                const idx = (y * 128 + x) * 4;
                // RGBは白(255)にして頂点カラー(0.04, 0.04, 0.05)との乗算で完全なリアルダークゴム色にする
                data[idx] = 255;
                data[idx + 1] = 255;
                data[idx + 2] = 255;
                data[idx + 3] = Math.floor(a * 255);
            }
        }

        ctx.putImageData(imgData, 0, 0);

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        return texture;
    }

    /**
     * 【3】路面余熱ヴェイパー（熱気・スモーク）用ソフト円形グラデーションテクスチャの生成
     */
    generateWispTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0.0, 'rgba(235, 235, 240, 0.85)');
        grad.addColorStop(0.35, 'rgba(215, 215, 225, 0.45)');
        grad.addColorStop(0.70, 'rgba(185, 185, 195, 0.15)');
        grad.addColorStop(1.0, 'rgba(160, 160, 170, 0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    /**
     * 【3】焼き付いたばかりのアスファルト表面から立ち上る微細な路面余熱ヴェイパー（熱気スモーク）を発生
     * 車速で吹き飛ぶ通常のタイヤスモークとは異なり、路面直上に留まってフワッと漂う熱気
     */
    emitHeatWisp(pos, intensity = 0.8) {
        for (let i = 0; i < this.maxHeatWisps; i++) {
            const w = this.heatWisps[i];
            if (!w.active) {
                w.active = true;
                w.life = 0;
                w.maxLife = 1.3 + Math.random() * 0.7; // 1.3〜2.0秒間ふんわり持続
                w.mesh.position.set(
                    pos.x + (Math.random() - 0.5) * 0.16,
                    pos.y + 0.035, // 路面直上に密着して滞留
                    pos.z + (Math.random() - 0.5) * 0.16
                );
                // 水平速度はほぼ静止（微小乱気流）、熱対流によるわずかな垂直上昇 (vy: 0.10〜0.18 m/s)
                w.velocity.set(
                    (Math.random() - 0.5) * 0.04,
                    0.10 + Math.random() * 0.08,
                    (Math.random() - 0.5) * 0.04
                );
                w.baseScale = 0.28 + Math.random() * 0.10;
                w.targetScale = 0.65 + Math.random() * 0.30;
                // 薄く繊細な透明度（0.08〜0.14）
                w.baseOpacity = (0.08 + Math.random() * 0.05) * Math.min(1.2, intensity);
                w.mesh.material.opacity = w.baseOpacity;
                w.mesh.scale.set(w.baseScale, w.baseScale, w.baseScale);
                w.mesh.visible = true;
                break;
            }
        }
    }

    /**
     * 単一車輪の移動距離を累積し、低速でも高速でも均一で滑らかなクワッドリボンを生成
     * 摩擦熱蓄積カーブ、抜け直前の幅テーパリング、スティックスリップ微小脈動を統合
     * @param {Object} state - { lastPos, uvV, slipSegments, thermalHeat, cumDist } 追跡状態オブジェクト
     * @param {THREE.Vector3} currPos - 現フレーム車輪接地位置
     * @param {number} intensity - スリップ強度 (0.15〜1.5)
     * @param {number} tireWidth - タイヤ幅 (実車サイズ: 0.20〜0.27m)
     */
    addWheelMark(state, currPos, intensity = 0.8, tireWidth = 0.24) {
        if (intensity < 0.15) {
            this.finalizeWheelMark(state);
            return;
        }

        if (!state.lastPos) {
            state.lastPos = currPos.clone();
            state.uvV = 0;
            state.slipSegments = 0;
            state.thermalHeat = 0.25;
            state.cumDist = 0;
            return;
        }

        const dx = currPos.x - state.lastPos.x;
        const dz = currPos.z - state.lastPos.z;
        const dist = Math.hypot(dx, dz);

        // ワープ・リセット（6.0m以上離れた場合はワープなので線を引かず再アンカー）
        if (dist > 6.0) {
            state.lastPos.copy(currPos);
            state.uvV = 0;
            state.slipSegments = 0;
            state.thermalHeat = 0.25;
            state.cumDist = 0;
            return;
        }

        // 最小セグメント長（0.12m）。この距離に達するまでは前回の確定打刻位置を維持して累積！
        const minStep = 0.12;
        if (dist < minStep) {
            return;
        }

        state.slipSegments = (state.slipSegments || 0) + 1;
        state.cumDist = (state.cumDist || 0) + dist;

        // 1. 摩擦熱の蓄積（Thermal Friction Curve）: スライド持続でゴムが熱分解して徐々に濃く焼き付く
        state.thermalHeat = Math.min(1.0, (state.thermalHeat || 0.25) + dist * 0.38);
        const thermalFactor = 0.50 + state.thermalHeat * 0.50; // 0.50 -> 1.0

        // 2. 進入時の滑らかな立ち上がりフェードイン
        const entryFade = Math.min(1.0, 0.30 + (state.slipSegments / 4.0) * 0.70);

        // 3. ドリフト抜け・低スリップ時の幅テーパリング（細く収束）
        const widthScale = Math.max(0.58, Math.min(1.0, 0.30 + intensity * 0.75));
        const effectiveWidth = tireWidth * widthScale;

        // 4. スティックスリップ（微小摩擦脈動）による自然な濃淡の波
        const ripple = 1.0 + Math.sin(state.cumDist * 13.0) * 0.08 + Math.cos(state.cumDist * 25.0) * 0.05;

        // 総合フェード係数
        const totalFade = entryFade * thermalFactor * ripple;

        // 【3】高摩擦スリップ時、路面に微細な余熱ヴェイパー（熱気スモーク）を漂わせる
        if (intensity > 0.40 && Math.random() < 0.28) {
            this.emitHeatWisp(currPos, intensity);
        }

        // 高速移動時の細分化（subdivision）：1フレームで 0.24m 以上進んだ場合は中間分割して滑らかな円弧を維持
        const steps = Math.min(3, Math.max(1, Math.floor(dist / 0.24)));
        let prev = state.lastPos.clone();

        for (let s = 1; s <= steps; s++) {
            const frac = s / steps;
            const subCurr = new THREE.Vector3(
                state.lastPos.x + dx * frac,
                state.lastPos.y + (currPos.y - state.lastPos.y) * frac,
                state.lastPos.z + dz * frac
            );
            const subDist = prev.distanceTo(subCurr);
            const v0 = state.uvV || 0;
            // 1m移動あたり約1.8テクスチャ周期（実車タイヤ外径0.64m・周長約2.0mの接地トレッドスケール）
            const v1 = v0 + subDist * 1.8;
            state.uvV = v1 % 1000.0;

            this.emitTireQuad(prev, subCurr, intensity, effectiveWidth, v0, v1, totalFade);
            prev = subCurr;
        }

        state.lastPos.copy(currPos);
    }

    /**
     * 車輪打刻トラッキングの終了・リセット
     */
    finalizeWheelMark(state) {
        if (!state) return;
        state.lastPos = null;
        state.uvV = 0;
        state.slipSegments = 0;
        state.thermalHeat = 0.25;
        state.cumDist = 0;
    }

    /**
     * 単一タイヤの四角形（2ポリゴン）クワッドセグメントをリングバッファに書き込み
     * @param {THREE.Vector3} prevPos - 始点接地位置
     * @param {THREE.Vector3} currPos - 終点接地位置
     * @param {number} intensity - スリップ強度 (0.15〜1.5)
     * @param {number} tireWidth - タイヤ幅 (m)
     * @param {number} v0 - テクスチャUV開始V座標
     * @param {number} v1 - テクスチャUV終了V座標
     * @param {number} fade - 進入・熱・脈動総合フェード係数
     */
    emitTireQuad(prevPos, currPos, intensity = 0.8, tireWidth = 0.24, v0 = 0.0, v1 = 1.0, fade = 1.0) {
        const dx = currPos.x - prevPos.x;
        const dz = currPos.z - prevPos.z;
        const dist = Math.hypot(dx, dz);
        if (dist < 0.03) return;

        // タイヤ進行方向に直交する横方向法線ベクトル（正規化）
        const invLen = 1.0 / dist;
        const nx = -dz * invLen;
        const nz = dx * invLen;
        let effectiveTireWidth = tireWidth;
        // 【5】U字側溝内（溝落とし深さ -0.20m以下）では溝底幅に合わせてタイヤ痕幅を安全クランプ
        if (prevPos.y < -0.15 || currPos.y < -0.15) {
            effectiveTireWidth = Math.min(tireWidth, 0.22);
        }
        const halfW = effectiveTireWidth * 0.5;

        // 路面・縁石・U字側溝底面の直上（Y + 0.018m）に配置して正確に密着（Z-fight完全防止）
        const y0 = prevPos.y + 0.018;
        const y1 = currPos.y + 0.018;

        const posAttr = this.skidGeom.attributes.position;
        const colAttr = this.skidGeom.attributes.color;
        const uvAttr = this.skidGeom.attributes.uv;
        const vBase = this.skidQuadIndex * 4;

        // 4頂点（四角形リボン：縁石や側溝の立体高低差にミリ単位で完全追従）
        posAttr.setXYZ(vBase,     prevPos.x - nx * halfW, y0, prevPos.z - nz * halfW);
        posAttr.setXYZ(vBase + 1, prevPos.x + nx * halfW, y0, prevPos.z + nz * halfW);
        posAttr.setXYZ(vBase + 2, currPos.x - nx * halfW, y1, currPos.z - nz * halfW);
        posAttr.setXYZ(vBase + 3, currPos.x + nx * halfW, y1, currPos.z + nz * halfW);

        // トレッドパターンのシームレスUVマッピング
        uvAttr.setXY(vBase,     0.0, v0);
        uvAttr.setXY(vBase + 1, 1.0, v0);
        uvAttr.setXY(vBase + 2, 0.0, v1);
        uvAttr.setXY(vBase + 3, 1.0, v1);

        // 物理的摩擦エネルギーに基づく非線形濃度カーブ（抜け直前の極薄かすれ 0.06 〜 Apexフルカウンターの漆黒 0.94）
        let baseAlpha = Math.pow(Math.min(1.0, intensity / 1.05), 1.30) * 0.90;
        baseAlpha = Math.max(0.06, baseAlpha);
        let alpha = Math.min(0.95, baseAlpha * fade);
        if (this.isRaining) alpha *= 0.35; // 雨天ウェット路面は薄いタイヤ痕

        // 【4】刻みたての「熱い漆黒」から「マットな冷えグレー」への経年変化トラッキング
        const qIdx = this.skidQuadIndex;
        if (this.skidQuadAge) this.skidQuadAge[qIdx] = 0.0;
        if (this.skidQuadInitialAlpha) this.skidQuadInitialAlpha[qIdx] = alpha;

        // 刻みたての生々しい熱い漆黒 (R:0.016, G:0.016, B:0.020)
        // 高熱で溶け出たゴム油分の濃厚ブラック。数秒後に冷却されマットグレー (0.052, 0.052, 0.062) へ滑らかに推移
        const cr = 0.016, cg = 0.016, cb = 0.020;
        colAttr.setXYZW(vBase,     cr, cg, cb, alpha);
        colAttr.setXYZW(vBase + 1, cr, cg, cb, alpha);
        colAttr.setXYZW(vBase + 2, cr, cg, cb, alpha);
        colAttr.setXYZW(vBase + 3, cr, cg, cb, alpha);

        this.skidQuadIndex = (this.skidQuadIndex + 1) % this.maxSkidQuads;
        this.skidNeedsUpdate = true;
    }

    /**
     * 後方互換用
     */
    addTireQuad(prevPos, currPos, intensity = 0.8, tireWidth = 0.24) {
        this.emitTireQuad(prevPos, currPos, intensity, tireWidth, 0.0, 1.0, 1.0);
    }

    /**
     * プレイヤーの車輪に動的荷重移動と【1】フロント前輪カウンターステア痕（4輪フル軌跡）を反映したドリフトタイヤ痕を追加
     * @param {THREE.Vector3} leftPos - 左後輪の接地位置
     * @param {THREE.Vector3} rightPos - 右後輪の接地位置
     * @param {number} intensity - 基本スリップ強度
     * @param {number} driftAngle - 自車のドリフト角（ラジアン）
     * @param {Object} frontWheels - { left: Vector3, right: Vector3 } フロント前輪接地位置（任意）
     * @param {number} steerAngle - ステアリング操舵角（任意）
     */
    addPlayerDriftMark(leftPos, rightPos, intensity = 0.8, driftAngle = 0.0, frontWheels = null, steerAngle = 0.0) {
        if (!this.playerTireL) this.playerTireL = { lastPos: null, uvV: 0, slipSegments: 0 };
        if (!this.playerTireR) this.playerTireR = { lastPos: null, uvV: 0, slipSegments: 0 };

        // 左右荷重移動（外側輪は高荷重で太く漆黒、内側輪は抜重で細くかすれたグレー）
        let leftWidth = 0.24;
        let rightWidth = 0.24;
        let leftIntensity = intensity;
        let rightIntensity = intensity;

        const absAngle = Math.abs(driftAngle);
        if (absAngle > 0.04) {
            const wt = Math.min(0.50, absAngle * 0.85); // 最大50%の荷重移動
            if (driftAngle > 0) {
                // 右ドリフト（車両右スライド）：遠心力で左外輪が高荷重！
                leftWidth = 0.24 * (1.0 + wt * 0.22);
                leftIntensity = intensity * (1.0 + wt * 0.45);
                rightWidth = 0.24 * (1.0 - wt * 0.20);
                rightIntensity = intensity * (1.0 - wt * 0.55);
            } else {
                // 左ドリフト（車両左スライド）：遠心力で右外輪が高荷重！
                rightWidth = 0.24 * (1.0 + wt * 0.22);
                rightIntensity = intensity * (1.0 + wt * 0.45);
                leftWidth = 0.24 * (1.0 - wt * 0.20);
                leftIntensity = intensity * (1.0 - wt * 0.55);
            }
        }

        this.addWheelMark(this.playerTireL, leftPos, leftIntensity, leftWidth);
        this.addWheelMark(this.playerTireR, rightPos, rightIntensity, rightWidth);
        this.playerLastL = this.playerTireL.lastPos;
        this.playerLastR = this.playerTireR.lastPos;

        // 【1】フロント前輪のカウンターステア痕（実車FRフルカウンター時のスクラブ摩擦痕・4輪フル軌跡）
        if (frontWheels && frontWheels.left && frontWheels.right && absAngle > 0.08) {
            if (!this.playerFrontTireL) this.playerFrontTireL = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };
            if (!this.playerFrontTireR) this.playerFrontTireR = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };

            // 実車FRドリフトでは、逆ハンドル（カウンターステア）を切ることで外側前輪が路面に対して横滑り（スクラブ）を起こす
            if (driftAngle > 0) {
                // 右ドリフト（車体右滑り）: 左前輪が外側（Outer Front）。スクラブ強度はリアの約68%、幅0.21m
                const fLeftIntensity = leftIntensity * 0.68;
                this.addWheelMark(this.playerFrontTireL, frontWheels.left, fLeftIntensity, 0.21);
                // 内側（右前輪）: ドリフト角が大きい（absAngle > 0.32）時にのみ薄く補助痕
                if (absAngle > 0.32) {
                    this.addWheelMark(this.playerFrontTireR, frontWheels.right, rightIntensity * 0.32, 0.18);
                } else {
                    this.finalizeWheelMark(this.playerFrontTireR);
                }
            } else {
                // 左ドリフト（車体左滑り）: 右前輪が外側（Outer Front）。
                const fRightIntensity = rightIntensity * 0.68;
                this.addWheelMark(this.playerFrontTireR, frontWheels.right, fRightIntensity, 0.21);
                // 内側（左前輪）: ドリフト角が大きい時にのみ薄く補助痕
                if (absAngle > 0.32) {
                    this.addWheelMark(this.playerFrontTireL, frontWheels.left, leftIntensity * 0.32, 0.18);
                } else {
                    this.finalizeWheelMark(this.playerFrontTireL);
                }
            }
        } else {
            // ドリフト終了時・浅い角度ではフロント前輪痕を終了リセット
            if (this.playerFrontTireL) this.finalizeWheelMark(this.playerFrontTireL);
            if (this.playerFrontTireR) this.finalizeWheelMark(this.playerFrontTireR);
        }
    }

    /**
     * プレイヤードリフト終了時（直進復帰）の不連続リセット
     * 前回のドリフト終点と次のドリフト始点が直線で結ばれるのを完全に防止
     */
    endPlayerDrift() {
        this.finalizeWheelMark(this.playerTireL);
        this.finalizeWheelMark(this.playerTireR);
        if (this.playerFrontTireL) this.finalizeWheelMark(this.playerFrontTireL);
        if (this.playerFrontTireR) this.finalizeWheelMark(this.playerFrontTireR);
        this.playerLastL = null;
        this.playerLastR = null;
    }

    /**
     * ライバル車（FD3S）の車輪に動的荷重移動＋【1】フロントカウンターステア痕付きドリフトタイヤ痕を追加
     */
    addRivalDriftMark(leftPos, rightPos, intensity = 0.7, driftAngle = 0.0, frontWheels = null) {
        if (!this.rivalTireL) this.rivalTireL = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };
        if (!this.rivalTireR) this.rivalTireR = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };

        let leftWidth = 0.24;
        let rightWidth = 0.24;
        let leftIntensity = intensity;
        let rightIntensity = intensity;

        const absAngle = Math.abs(driftAngle);
        if (absAngle > 0.04) {
            const wt = Math.min(0.50, absAngle * 0.85);
            if (driftAngle > 0) {
                leftWidth = 0.24 * (1.0 + wt * 0.22);
                leftIntensity = intensity * (1.0 + wt * 0.45);
                rightWidth = 0.24 * (1.0 - wt * 0.20);
                rightIntensity = intensity * (1.0 - wt * 0.55);
            } else {
                rightWidth = 0.24 * (1.0 + wt * 0.22);
                rightIntensity = intensity * (1.0 + wt * 0.45);
                leftWidth = 0.24 * (1.0 - wt * 0.20);
                leftIntensity = intensity * (1.0 - wt * 0.55);
            }
        }

        this.addWheelMark(this.rivalTireL, leftPos, leftIntensity, leftWidth);
        this.addWheelMark(this.rivalTireR, rightPos, rightIntensity, rightWidth);
        this.rivalLastL = this.rivalTireL.lastPos;
        this.rivalLastR = this.rivalTireR.lastPos;

        // ライバル車フロント操舵輪スクラブ痕
        if (frontWheels && frontWheels.left && frontWheels.right && absAngle > 0.08) {
            if (!this.rivalFrontTireL) this.rivalFrontTireL = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };
            if (!this.rivalFrontTireR) this.rivalFrontTireR = { lastPos: null, uvV: 0, slipSegments: 0, thermalHeat: 0.25, cumDist: 0 };

            if (driftAngle > 0) {
                this.addWheelMark(this.rivalFrontTireL, frontWheels.left, leftIntensity * 0.65, 0.21);
                if (absAngle > 0.32) {
                    this.addWheelMark(this.rivalFrontTireR, frontWheels.right, rightIntensity * 0.30, 0.18);
                } else {
                    this.finalizeWheelMark(this.rivalFrontTireR);
                }
            } else {
                this.addWheelMark(this.rivalFrontTireR, frontWheels.right, rightIntensity * 0.65, 0.21);
                if (absAngle > 0.32) {
                    this.addWheelMark(this.rivalFrontTireL, frontWheels.left, leftIntensity * 0.30, 0.18);
                } else {
                    this.finalizeWheelMark(this.rivalFrontTireL);
                }
            }
        } else {
            if (this.rivalFrontTireL) this.finalizeWheelMark(this.rivalFrontTireL);
            if (this.rivalFrontTireR) this.finalizeWheelMark(this.rivalFrontTireR);
        }
    }

    /**
     * ライバル車ドリフト終了時の不連続リセット
     */
    endRivalDrift() {
        this.finalizeWheelMark(this.rivalTireL);
        this.finalizeWheelMark(this.rivalTireR);
        if (this.rivalFrontTireL) this.finalizeWheelMark(this.rivalFrontTireL);
        if (this.rivalFrontTireR) this.finalizeWheelMark(this.rivalFrontTireR);
        this.rivalLastL = null;
        this.rivalLastR = null;
    }

    /**
     * コース変更時・再スタート時のタイヤ痕全消去
     */
    clearSkidMarks() {
        this.endPlayerDrift();
        this.endRivalDrift();
        this.skidQuadIndex = 0;
        if (this.skidQuadAge) this.skidQuadAge.fill(9999.0);
        const posAttr = this.skidGeom.attributes.position;
        const colAttr = this.skidGeom.attributes.color;
        const totalVerts = this.maxSkidQuads * 4;
        for (let i = 0; i < totalVerts; i++) {
            posAttr.setXYZ(i, 0, -9999, 0);
            colAttr.setXYZW(i, 0.04, 0.04, 0.05, 0.0);
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
        this.skidNeedsUpdate = false;
    }

    /**
     * 後方互換用メソッド
     */
    addSkidSegment(leftPos, rightPos, intensity = 0.8) {
        this.addPlayerDriftMark(leftPos, rightPos, intensity);
    }

    /**
     * アフターファイヤ火炎放射と夜間路面フラッシュ発光
     * @param {THREE.Vector3} pos - マフラー排気口ワールド座標
     * @param {THREE.Vector3} dir - 排気噴射方向ベクトル（車体後方）
     * @param {number} intensity - 威力 (0.5〜1.5)
     * @param {boolean} isRival - ライバル車両か
     */
    emitAfterfire(pos, dir, intensity = 1.0, isRival = false) {
        // 瞬間フラッシュライト点灯（夜の峠のアスファルトをパッと照らす）
        const light = isRival ? this.rivalFlameLight : this.playerFlameLight;
        light.position.copy(pos);
        light.intensity = 5.8 * Math.min(1.6, intensity);
        if (isRival) {
            this.rivalFlameLightTimer = 0.09;
        } else {
            this.playerFlameLightTimer = 0.09;
        }

        const particleCount = Math.floor(8 * Math.max(0.6, intensity));
        let spawned = 0;

        for (let i = 0; i < this.maxFlames && spawned < particleCount; i++) {
            const f = this.flames[i];
            if (!f.active) {
                f.active = true;
                f.life = 0;
                f.maxLife = 0.06 + Math.random() * 0.07; // 0.06〜0.13秒の瞬間スプレー

                const isCore = (spawned < 2); // 最初の2個は超高温の青白コア炎
                f.isCore = isCore;

                if (isCore) {
                    f.mat.color.setHex(0x38e1ff); // 鮮烈なシアンブルー
                    f.startScale = 0.22 * intensity;
                    f.endScale = 0.40 * intensity;
                } else {
                    const fireColors = [0xff4400, 0xff7700, 0xffaa00, 0xff2200];
                    f.mat.color.setHex(fireColors[Math.floor(Math.random() * fireColors.length)]);
                    f.startScale = 0.28 * intensity;
                    f.endScale = (0.55 + Math.random() * 0.45) * intensity;
                }

                // マフラー出口から後方へ噴射開始
                f.mesh.position.copy(pos);
                f.mesh.position.add(dir.clone().multiplyScalar(0.04 + spawned * 0.05));

                // 噴射初速（マフラー後方への高速ジェット）
                const speed = (isCore ? 26 : 21) * (0.9 + Math.random() * 0.25);
                f.velocity.copy(dir).multiplyScalar(speed);
                f.velocity.x += (Math.random() - 0.5) * 2.2;
                f.velocity.y += (Math.random() - 0.3) * 1.5;
                f.velocity.z += (Math.random() - 0.5) * 2.2;

                f.mesh.visible = true;
                f.mesh.scale.set(f.startScale, f.startScale, f.startScale);
                f.mat.opacity = isCore ? 1.0 : 0.95;

                spawned++;
            }
        }
    }

    update(dt, camera) {
        // 【4】刻みたての「熱い漆黒」から「マットな冷えグレー」への経年変化更新
        if (this.skidQuadAge) {
            let colorUpdated = false;
            const maxCoolingTime = 10.0; // 10秒かけて外気冷却＆路面粉塵吸着
            const colAttr = this.skidGeom.attributes.color;
            for (let q = 0; q < this.maxSkidQuads; q++) {
                if (this.skidQuadAge[q] < maxCoolingTime) {
                    this.skidQuadAge[q] += dt;
                    const age = this.skidQuadAge[q];
                    // 0.0〜1.2秒: 生々しい熱い漆黒 (cr: 0.016, cg: 0.016, cb: 0.020)
                    // 1.2〜10.0秒: 滑らかに外気冷却され、乾いたマットダークグレー (cr: 0.052, cg: 0.052, cb: 0.062) へ推移
                    const coolProgress = Math.min(1.0, Math.max(0.0, (age - 1.2) / 8.8));
                    const cr = 0.016 + (0.052 - 0.016) * coolProgress;
                    const cg = 0.016 + (0.052 - 0.016) * coolProgress;
                    const cb = 0.020 + (0.062 - 0.020) * coolProgress;

                    // アルファもゴム揮発油分が抜けてほんのり落ち着いたマット調に推移 (初期アルファの約86%)
                    const initA = this.skidQuadInitialAlpha ? this.skidQuadInitialAlpha[q] : 0.8;
                    const curA = initA * (1.0 - coolProgress * 0.14);

                    const vBase = q * 4;
                    colAttr.setXYZW(vBase,     cr, cg, cb, curA);
                    colAttr.setXYZW(vBase + 1, cr, cg, cb, curA);
                    colAttr.setXYZW(vBase + 2, cr, cg, cb, curA);
                    colAttr.setXYZW(vBase + 3, cr, cg, cb, curA);
                    colorUpdated = true;
                }
            }
            if (colorUpdated) {
                this.skidGeom.attributes.color.needsUpdate = true;
            }
        }

        // スキッドマーク（タイヤ痕）バッファの動的転送
        if (this.skidNeedsUpdate) {
            this.skidGeom.attributes.position.needsUpdate = true;
            this.skidGeom.attributes.color.needsUpdate = true;
            this.skidGeom.attributes.uv.needsUpdate = true;
            this.skidNeedsUpdate = false;
        }

        // 【3】路面余熱ヴェイパー（熱気スモーク）更新（ビルボード化・低空滞留）
        if (this.heatWisps) {
            for (let i = 0; i < this.maxHeatWisps; i++) {
                const w = this.heatWisps[i];
                if (w.active) {
                    w.life += dt;
                    if (w.life >= w.maxLife) {
                        w.active = false;
                        w.mesh.visible = false;
                    } else {
                        const progress = w.life / w.maxLife;
                        w.mesh.position.add(w.velocity.clone().multiplyScalar(dt));
                        const curScale = w.baseScale + (w.targetScale - w.baseScale) * progress;
                        w.mesh.scale.set(curScale, curScale, curScale);
                        // 滑らかにフェードアウト
                        w.mesh.material.opacity = w.baseOpacity * (1.0 - Math.pow(progress, 1.2));
                        if (camera) w.mesh.quaternion.copy(camera.quaternion);
                    }
                }
            }
        }

        // マフラーフラッシュライト減衰
        if (this.playerFlameLightTimer > 0) {
            this.playerFlameLightTimer -= dt;
            this.playerFlameLight.intensity *= Math.max(0, 1.0 - dt * 14.0);
            if (this.playerFlameLightTimer <= 0) this.playerFlameLight.intensity = 0;
        }
        if (this.rivalFlameLightTimer > 0) {
            this.rivalFlameLightTimer -= dt;
            this.rivalFlameLight.intensity *= Math.max(0, 1.0 - dt * 14.0);
            if (this.rivalFlameLightTimer <= 0) this.rivalFlameLight.intensity = 0;
        }

        // アフターファイヤ炎更新（ビルボード化）
        for (let i = 0; i < this.maxFlames; i++) {
            const f = this.flames[i];
            if (f.active) {
                f.life += dt;
                if (f.life >= f.maxLife) {
                    f.active = false;
                    f.mesh.visible = false;
                } else {
                    const p = f.life / f.maxLife;
                    f.mesh.position.add(f.velocity.clone().multiplyScalar(dt));
                    const curScale = f.startScale + (f.endScale - f.startScale) * p;
                    f.mesh.scale.set(curScale, curScale, curScale);
                    f.mat.opacity = (1.0 - Math.pow(p, 1.4)) * (f.isCore ? 1.0 : 0.95);
                    f.mesh.quaternion.copy(camera.quaternion);
                }
            }
        }

        // スモーク更新（ビルボード化：常にカメラを向く）
        for (let i = 0; i < this.maxSmokes; i++) {
            const s = this.smokes[i];
            if (s.active) {
                s.life += dt;
                if (s.life >= s.maxLife) {
                    s.active = false;
                    s.mesh.visible = false;
                } else {
                    const progress = s.life / s.maxLife;
                    s.mesh.position.add(s.velocity.clone().multiplyScalar(dt));

                    // 巨大化させず視界を塞がない適度な拡散（水しぶき時はさらに小さく上品に）
                    const expandFactor = s.isWaterSpray ? 0.18 : 0.65;
                    const curScale = s.scale + progress * expandFactor;
                    s.mesh.scale.set(curScale, curScale, curScale);
                    // 綺麗に半透明フェードアウト
                    const baseAlpha = s.isWaterSpray ? 0.12 : 0.20;
                    s.mesh.material.opacity = (1.0 - progress) * baseAlpha;

                    // カメラの向きにビルボード回転
                    s.mesh.quaternion.copy(camera.quaternion);
                }
            }
        }

        // スパーク火花更新
        const sparkPos = this.sparkPoints.geometry.attributes.position;
        const sparkColors = this.sparkPoints.geometry.attributes.color;

        for (let i = 0; i < this.maxSparks; i++) {
            const sp = this.sparks[i];
            if (sp.active) {
                sp.life += dt;
                if (sp.life >= sp.maxLife) {
                    sp.active = false;
                    sparkPos.setXYZ(i, 0, -1000, 0); // 画面外
                } else {
                    sp.vel.y -= 25.0 * dt; // 重力
                    sp.pos.add(sp.vel.clone().multiplyScalar(dt));
                    sparkPos.setXYZ(i, sp.pos.x, sp.pos.y, sp.pos.z);

                    // 明るい黄色〜赤色への変色
                    const lifeRatio = 1.0 - (sp.life / sp.maxLife);
                    sparkColors.setXYZ(i, 1.0, lifeRatio * 0.9, lifeRatio * 0.2);
                }
            } else {
                sparkPos.setXYZ(i, 0, -1000, 0);
            }
        }
        sparkPos.needsUpdate = true;
        sparkColors.needsUpdate = true;

        // ★土煙（Dirt Dust）更新（ビルボード化）
        for (let i = 0; i < this.maxDirtSmokes; i++) {
            const s = this.dirtSmokes[i];
            if (s.active) {
                s.life += dt;
                if (s.life >= s.maxLife) {
                    s.active = false;
                    s.mesh.visible = false;
                } else {
                    const p = s.life / s.maxLife;
                    s.mesh.position.add(s.velocity.clone().multiplyScalar(dt));
                    s.velocity.y *= 0.94; // 上昇減衰
                    const curScale = s.startScale + (s.endScale - s.startScale) * Math.sqrt(p);
                    s.mesh.scale.set(curScale, curScale, curScale);
                    s.mat.opacity = (1.0 - p) * s.baseOpacity;
                    s.mesh.quaternion.copy(camera.quaternion);
                }
            }
        }

        // ★跳ね石（Gravel Spray）更新
        const gravelPosAttr = this.gravelPoints.geometry.attributes.position;
        for (let i = 0; i < this.maxGravelSparks; i++) {
            const sp = this.gravelSparks[i];
            if (sp.active) {
                sp.life += dt;
                if (sp.life >= sp.maxLife) {
                    sp.active = false;
                    gravelPosAttr.setXYZ(i, 0, -1000, 0);
                } else {
                    sp.vel.y -= 32.0 * dt; // 重力
                    sp.pos.add(sp.vel.clone().multiplyScalar(dt));

                    // 路面バウンド（地面に落ちたら弾む）
                    if (sp.pos.y < sp.groundY) {
                        sp.pos.y = sp.groundY + 0.02;
                        sp.vel.y = -sp.vel.y * 0.35; // バウンド減衰
                        sp.vel.x *= 0.6;
                        sp.vel.z *= 0.6;
                    }

                    gravelPosAttr.setXYZ(i, sp.pos.x, sp.pos.y, sp.pos.z);
                }
            } else {
                gravelPosAttr.setXYZ(i, 0, -1000, 0);
            }
        }
        gravelPosAttr.needsUpdate = true;

        // ★雨天パーティクル更新
        this.updateRain(dt, camera);
    }

    updateRain(dt, camera) {
        if (!this.isRaining || !this.rainMesh) {
            if (this.rainMesh && this.rainMesh.visible) this.rainMesh.visible = false;
            return;
        }
        this.rainMesh.visible = true;

        const posAttr = this.rainMesh.geometry.attributes.position;
        const arr = posAttr.array;
        const camPos = camera.position;
        const fallSpeed = 58.0; // 落下速度 (m/s)
        const windX = -3.2, windZ = -3.2;
        const streakDx = 0.22, streakDy = 2.4, streakDz = 0.22;
        const boxW = 44, boxH = 24, boxD = 44;
        const halfW = 22, halfD = 22;

        for (let i = 0; i < this.maxRainDrops; i++) {
            const idx = i * 6;

            // カメラ相対座標で計算（カメラ追従トーラス循環）
            let rx = arr[idx] - camPos.x;
            let ry = arr[idx + 1] - camPos.y;
            let rz = arr[idx + 2] - camPos.z;

            // 落下 & 風
            ry -= fallSpeed * dt;
            rx += windX * dt;
            rz += windZ * dt;

            // ボックス境界から外れたら反対側へトーラス循環
            // これにより、車が超高速で移動・旋回しても雨の空間密度が完全に均一に保たれ、切れ目や穴が一切生じない
            if (ry < -5) ry += boxH;
            else if (ry > boxH - 5) ry -= boxH;

            if (rx < -halfW) rx += boxW;
            else if (rx > halfW) rx -= boxW;

            if (rz < -halfD) rz += boxD;
            else if (rz > halfD) rz -= boxD;

            const wx = camPos.x + rx;
            const wy = camPos.y + ry;
            const wz = camPos.z + rz;

            arr[idx] = wx;
            arr[idx + 1] = wy;
            arr[idx + 2] = wz;
            arr[idx + 3] = wx - streakDx;
            arr[idx + 4] = wy - streakDy;
            arr[idx + 5] = wz - streakDz;
        }
        posAttr.needsUpdate = true;
    }

    /**
     * ★頭文字D名物：テールランプ残像（Light Trails）初期化
     */
    initLightTrails() {
        this.maxTrailPoints = 35; // トレイルの履歴フレーム数

        // 左右のトレイル用データ
        this.playerTrailL = [];
        this.playerTrailR = [];
        this.rivalTrailL = [];
        this.rivalTrailR = [];

        // プレイヤー左、右、ライバル左、右
        this.meshPlayerTrailL = this.createTrailMesh();
        this.meshPlayerTrailR = this.createTrailMesh();
        this.meshRivalTrailL = this.createTrailMesh();
        this.meshRivalTrailR = this.createTrailMesh();

        this.scene.add(this.meshPlayerTrailL);
        this.scene.add(this.meshPlayerTrailR);
        this.scene.add(this.meshRivalTrailL);
        this.scene.add(this.meshRivalTrailR);
    }

    createTrailMesh() {
        const geom = new THREE.BufferGeometry();
        const posArray = new Float32Array(this.maxTrailPoints * 2 * 3);
        const colorArray = new Float32Array(this.maxTrailPoints * 2 * 3);
        const indexArray = [];

        for (let i = 0; i < this.maxTrailPoints - 1; i++) {
            const base = i * 2;
            indexArray.push(base, base + 1, base + 2);
            indexArray.push(base + 1, base + 3, base + 2);
        }

        geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        geom.setIndex(indexArray);

        const mat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        return new THREE.Mesh(geom, mat);
    }

    updateTrailPoints(trailArray, newPos, isDrifting) {
        if (isDrifting) {
            trailArray.unshift(newPos.clone());
            if (trailArray.length > this.maxTrailPoints) {
                trailArray.pop();
            }
        } else {
            if (trailArray.length > 0) {
                trailArray.pop();
                if (trailArray.length > 0) trailArray.pop(); // 素早く消滅
            }
        }
    }

    updateTrailMesh(mesh, trailArray) {
        const posAttr = mesh.geometry.attributes.position;
        const colAttr = mesh.geometry.attributes.color;
        const len = trailArray.length;
        const ribbonHalfHeight = 0.08;

        for (let i = 0; i < this.maxTrailPoints; i++) {
            const base = i * 2;
            if (i < len) {
                const p = trailArray[i];
                posAttr.setXYZ(base, p.x, p.y + ribbonHalfHeight, p.z);
                posAttr.setXYZ(base + 1, p.x, p.y - ribbonHalfHeight, p.z);

                // 先頭は鮮烈なネオンレッド、末尾に向かって自然に黒（透明）へ減衰
                const alpha = Math.pow(1.0 - (i / this.maxTrailPoints), 1.6);
                colAttr.setXYZ(base, 1.0 * alpha, 0.08 * alpha, 0.15 * alpha);
                colAttr.setXYZ(base + 1, 1.0 * alpha, 0.08 * alpha, 0.15 * alpha);
            } else {
                const lastP = (len > 0) ? trailArray[len - 1] : new THREE.Vector3(0, -9999, 0);
                posAttr.setXYZ(base, lastP.x, lastP.y, lastP.z);
                posAttr.setXYZ(base + 1, lastP.x, lastP.y, lastP.z);
                colAttr.setXYZ(base, 0, 0, 0);
                colAttr.setXYZ(base + 1, 0, 0, 0);
            }
        }

        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;
    }

    updateTailTrails(playerTails, isPlayerDrifting, rivalTails, isRivalDrifting) {
        if (playerTails) {
            this.updateTrailPoints(this.playerTrailL, playerTails.left, isPlayerDrifting);
            this.updateTrailPoints(this.playerTrailR, playerTails.right, isPlayerDrifting);
            this.updateTrailMesh(this.meshPlayerTrailL, this.playerTrailL);
            this.updateTrailMesh(this.meshPlayerTrailR, this.playerTrailR);
        }
        if (rivalTails) {
            this.updateTrailPoints(this.rivalTrailL, rivalTails.left, isRivalDrifting);
            this.updateTrailPoints(this.rivalTrailR, rivalTails.right, isRivalDrifting);
            this.updateTrailMesh(this.meshRivalTrailL, this.rivalTrailL);
            this.updateTrailMesh(this.meshRivalTrailR, this.rivalTrailR);
        }
    }
}

window.ParticleSystem = ParticleSystem;
