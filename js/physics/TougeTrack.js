/**
 * TougeTrack.js - 峠コース生成とコリジョン・路面補間
 * 原作・アーケード版『頭文字D』秋名山（榛名山）コースを完全忠実に再現
 * 給水塔、5連ヘアピン標識、赤白ゼブラ減速帯、チャッターバー、立体U字側溝を実装
 */

class TougeTrack {
    constructor(scene, courseType = 'akina') {
        this.scene = scene;
        this.courseType = courseType;
        this.trackGroup = new THREE.Group();
        this.scene.add(this.trackGroup);

        this.roadWidth = 9.2;
        this.gutterWidth = 0.95;
        this.curve = null;
        this.trackLength = 0;
        this.samples = [];
        this.sampleCount = 2400;

        this.buildCourse(courseType);
    }

    setCourse(courseType) {
        this.courseType = courseType;
        while (this.trackGroup.children.length > 0) {
            const obj = this.trackGroup.children[0];
            obj.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                    else child.material.dispose();
                }
            });
            this.trackGroup.remove(obj);
        }

        this.buildCourse(courseType);
    }

    /**
     * ★秋名山（上り/ヒルクライム）の幾何学点列生成
     * 下り（ダウンヒル）と完全同一の峠道ラインを逆走し、麓から山頂（+490m）へ駆け上がる上り勾配に変換
     */
    buildAkinaUphillPoints(downhillPoints) {
        const n = downhillPoints.length;
        const lastP = downhillPoints[n - 1];
        const uphillPoints = [];
        for (let i = n - 1; i >= 0; i--) {
            const p = downhillPoints[i];
            const x = p.x - lastP.x;
            const y = -(p.y - lastP.y); // 麓のスタート標高0mから山頂へ+490m登る上り坂！
            const z = p.z - lastP.z;
            uphillPoints.push(new THREE.Vector3(x, y, z));
        }
        return uphillPoints;
    }

    buildCourse(courseType) {
        let points = [];

if (courseType === 'myogi') {
            // ★本物完全再現：妙義山（ARCADE STAGE 4 公式レイアウト - 全長7,068m）
            // 原作画像レイアウト完全準拠・全4区間実寸再現・ハイスピードガードレールワインディング
            this.roadWidth = 11.2;
            this.gutterWidth = 0.6;
            points = [
                new THREE.Vector3(0.0, -0.0, 0.0),
                new THREE.Vector3(17.9, -1.1, -32.7),
                new THREE.Vector3(35.1, -2.3, -65.9),
                new THREE.Vector3(53.2, -3.5, -98.5),
                new THREE.Vector3(70.5, -4.7, -131.5),
                new THREE.Vector3(83.8, -6.0, -162.1),
                new THREE.Vector3(101.0, -7.3, -185.9),
                new THREE.Vector3(124.2, -8.5, -200.0),
                new THREE.Vector3(159.4, -9.8, -201.5),
                new THREE.Vector3(196.1, -11.1, -195.2),
                new THREE.Vector3(231.2, -12.4, -191.2),
                new THREE.Vector3(258.6, -13.7, -192.2),
                new THREE.Vector3(277.6, -15.0, -201.9),
                new THREE.Vector3(290.4, -16.3, -225.7),
                new THREE.Vector3(291.1, -17.7, -260.9),
                new THREE.Vector3(289.0, -19.0, -292.3),
                new THREE.Vector3(297.1, -20.3, -322.4),
                new THREE.Vector3(319.9, -21.7, -351.8),
                new THREE.Vector3(345.3, -23.0, -379.0),
                new THREE.Vector3(368.5, -24.3, -405.8),
                new THREE.Vector3(383.3, -25.7, -428.8),
                new THREE.Vector3(386.6, -27.0, -453.9),
                new THREE.Vector3(376.8, -28.4, -479.2),
                new THREE.Vector3(350.3, -29.8, -502.2),
                new THREE.Vector3(319.0, -31.1, -522.5),
                new THREE.Vector3(288.2, -32.5, -543.6),
                new THREE.Vector3(264.2, -33.8, -560.7),
                new THREE.Vector3(253.2, -35.2, -574.4),
                new THREE.Vector3(250.4, -36.6, -587.6),
                new THREE.Vector3(255.5, -38.0, -600.1),
                new THREE.Vector3(266.6, -39.3, -607.8),
                new THREE.Vector3(292.9, -40.7, -603.1),
                new THREE.Vector3(324.4, -42.1, -583.1),
                new THREE.Vector3(355.3, -43.5, -562.2),
                new THREE.Vector3(385.7, -44.9, -540.6),
                new THREE.Vector3(416.3, -46.2, -519.2),
                new THREE.Vector3(447.0, -47.6, -498.1),
                new THREE.Vector3(477.8, -49.0, -476.9),
                new THREE.Vector3(504.2, -50.4, -460.0),
                new THREE.Vector3(522.7, -51.8, -453.8),
                new THREE.Vector3(536.2, -53.2, -455.4),
                new THREE.Vector3(546.1, -54.6, -464.5),
                new THREE.Vector3(548.3, -56.0, -477.9),
                new THREE.Vector3(533.5, -57.4, -504.8),
                new THREE.Vector3(506.1, -58.8, -530.2),
                new THREE.Vector3(480.6, -60.2, -554.6),
                new THREE.Vector3(465.5, -61.6, -572.7),
                new THREE.Vector3(460.4, -63.0, -585.3),
                new THREE.Vector3(462.9, -64.4, -598.6),
                new THREE.Vector3(473.5, -65.8, -607.0),
                new THREE.Vector3(487.0, -67.2, -607.5),
                new THREE.Vector3(515.3, -68.7, -586.9),
                new THREE.Vector3(541.7, -70.1, -560.6),
                new THREE.Vector3(567.9, -71.5, -536.8),
                new THREE.Vector3(595.0, -72.9, -521.2),
                new THREE.Vector3(629.7, -74.3, -515.4),
                new THREE.Vector3(666.8, -75.7, -512.2),
                new THREE.Vector3(702.2, -77.2, -511.7),
                new THREE.Vector3(731.0, -78.6, -506.7),
                new THREE.Vector3(761.0, -80.0, -484.9),
                new THREE.Vector3(787.8, -81.4, -458.9),
                new THREE.Vector3(814.6, -82.9, -439.2),
                new THREE.Vector3(847.5, -84.3, -426.4),
                new THREE.Vector3(872.9, -85.7, -416.2),
                new THREE.Vector3(888.5, -87.2, -398.9),
                new THREE.Vector3(892.1, -88.7, -373.9),
                new THREE.Vector3(879.2, -90.1, -341.3),
                new THREE.Vector3(863.0, -91.6, -312.2),
                new THREE.Vector3(857.4, -93.1, -279.7),
                new THREE.Vector3(862.2, -94.6, -246.7),
                new THREE.Vector3(871.5, -96.0, -220.9),
                new THREE.Vector3(889.1, -97.5, -202.7),
                new THREE.Vector3(913.3, -99.0, -196.0),
                new THREE.Vector3(945.2, -100.4, -205.1),
                new THREE.Vector3(974.9, -101.9, -224.1),
                new THREE.Vector3(1000.0, -103.4, -248.8),
                new THREE.Vector3(1019.6, -104.8, -278.3),
                new THREE.Vector3(1040.4, -106.3, -301.7),
                new THREE.Vector3(1068.0, -107.8, -316.1),
                new THREE.Vector3(1103.0, -109.3, -320.2),
                new THREE.Vector3(1136.3, -110.7, -322.2),
                new THREE.Vector3(1161.3, -112.2, -317.4),
                new THREE.Vector3(1176.0, -113.7, -307.9),
                new THREE.Vector3(1182.5, -115.1, -293.8),
                new THREE.Vector3(1176.9, -116.6, -271.5),
                new THREE.Vector3(1151.0, -118.1, -244.8),
                new THREE.Vector3(1121.6, -119.5, -221.8),
                new THREE.Vector3(1095.0, -121.0, -195.8),
                new THREE.Vector3(1071.2, -122.5, -167.0),
                new THREE.Vector3(1046.9, -123.9, -138.7),
                new THREE.Vector3(1019.5, -125.4, -113.4),
                new THREE.Vector3(989.6, -126.9, -91.2),
                new THREE.Vector3(959.9, -128.4, -68.5),
                new THREE.Vector3(937.4, -129.8, -46.7),
                new THREE.Vector3(926.6, -131.3, -28.1),
                new THREE.Vector3(925.6, -132.8, -12.6),
                new THREE.Vector3(931.8, -134.2, -0.6),
                new THREE.Vector3(944.5, -135.7, 8.4),
                new THREE.Vector3(965.7, -137.2, 8.5),
                new THREE.Vector3(994.3, -138.6, -11.8),
                new THREE.Vector3(1020.4, -140.1, -32.6),
                new THREE.Vector3(1053.1, -141.6, -45.3),
                new THREE.Vector3(1088.1, -143.1, -50.2),
                new THREE.Vector3(1118.8, -144.5, -56.3),
                new THREE.Vector3(1149.7, -146.0, -77.1),
                new THREE.Vector3(1175.4, -147.5, -98.3),
                new THREE.Vector3(1199.7, -148.9, -110.8),
                new THREE.Vector3(1228.6, -150.4, -108.7),
                new THREE.Vector3(1260.8, -151.9, -90.0),
                new THREE.Vector3(1289.1, -153.3, -68.8),
                new THREE.Vector3(1313.2, -154.8, -40.5),
                new THREE.Vector3(1333.3, -156.3, -11.4),
                new THREE.Vector3(1347.0, -157.7, 18.9),
                new THREE.Vector3(1350.4, -159.2, 56.0),
                new THREE.Vector3(1350.4, -160.7, 93.3),
                new THREE.Vector3(1350.4, -162.2, 130.6),
                new THREE.Vector3(1350.1, -163.6, 162.0),
                new THREE.Vector3(1344.6, -165.1, 182.7),
                new THREE.Vector3(1330.3, -166.6, 195.7),
                new THREE.Vector3(1299.5, -168.0, 196.8),
                new THREE.Vector3(1268.8, -169.5, 190.5),
                new THREE.Vector3(1239.9, -171.0, 195.2),
                new THREE.Vector3(1215.0, -172.4, 210.6),
                new THREE.Vector3(1197.5, -173.9, 236.4),
                new THREE.Vector3(1190.7, -175.4, 262.9),
                new THREE.Vector3(1197.5, -176.9, 291.2),
                new THREE.Vector3(1216.6, -178.3, 315.9),
                new THREE.Vector3(1241.2, -179.8, 331.8),
                new THREE.Vector3(1270.2, -181.2, 335.7),
                new THREE.Vector3(1298.2, -182.5, 327.3),
                new THREE.Vector3(1323.6, -183.9, 306.0),
                new THREE.Vector3(1342.7, -185.3, 283.6),
                new THREE.Vector3(1362.9, -186.6, 272.1),
                new THREE.Vector3(1390.1, -188.0, 273.9),
                new THREE.Vector3(1415.7, -189.3, 288.1),
                new THREE.Vector3(1433.0, -190.7, 311.6),
                new THREE.Vector3(1438.9, -192.1, 346.2),
                new THREE.Vector3(1442.4, -193.4, 383.3),
                new THREE.Vector3(1449.8, -194.8, 419.8),
                new THREE.Vector3(1460.5, -196.1, 453.5),
                new THREE.Vector3(1474.7, -197.5, 479.2),
                new THREE.Vector3(1488.1, -198.9, 493.5),
                new THREE.Vector3(1500.4, -200.2, 499.5),
                new THREE.Vector3(1513.8, -201.6, 498.1),
                new THREE.Vector3(1523.4, -202.9, 488.7),
                new THREE.Vector3(1526.9, -204.3, 457.8),
                new THREE.Vector3(1524.5, -205.7, 430.4),
                new THREE.Vector3(1527.0, -207.0, 415.0),
                new THREE.Vector3(1534.9, -208.4, 404.0),
                new THREE.Vector3(1547.7, -209.7, 400.1),
                new THREE.Vector3(1571.7, -211.1, 416.0),
                new THREE.Vector3(1592.0, -212.5, 440.0),
                new THREE.Vector3(1607.0, -213.8, 452.5),
                new THREE.Vector3(1619.9, -215.2, 456.8),
                new THREE.Vector3(1633.1, -216.5, 453.6),
                new THREE.Vector3(1641.9, -217.9, 443.4),
                new THREE.Vector3(1642.8, -219.3, 420.2),
                new THREE.Vector3(1628.5, -220.6, 390.2),
                new THREE.Vector3(1618.4, -222.0, 360.5),
                new THREE.Vector3(1617.8, -223.3, 335.2),
                new THREE.Vector3(1625.8, -224.7, 317.5),
                new THREE.Vector3(1641.8, -226.1, 306.7),
                new THREE.Vector3(1670.9, -227.4, 308.2),
                new THREE.Vector3(1697.2, -228.8, 320.9),
                new THREE.Vector3(1718.3, -230.1, 346.5),
                new THREE.Vector3(1733.8, -231.5, 376.0),
                new THREE.Vector3(1754.6, -232.9, 399.4),
                new THREE.Vector3(1784.1, -234.2, 414.6),
                new THREE.Vector3(1813.6, -235.6, 429.9),
                new THREE.Vector3(1835.0, -236.9, 450.1),
                new THREE.Vector3(1861.5, -238.3, 461.5),
                new THREE.Vector3(1894.8, -239.7, 460.0),
                new THREE.Vector3(1927.7, -241.0, 464.3),
                new THREE.Vector3(1959.3, -242.4, 479.8),
                new THREE.Vector3(1985.3, -243.7, 497.4),
                new THREE.Vector3(2005.0, -245.1, 506.1),
                new THREE.Vector3(2022.3, -246.5, 505.0),
                new THREE.Vector3(2042.3, -247.8, 484.2),
                new THREE.Vector3(2055.6, -249.2, 449.4),
                new THREE.Vector3(2069.6, -250.5, 414.8),
                new THREE.Vector3(2086.1, -251.8, 383.6),
                new THREE.Vector3(2110.7, -253.1, 355.6),
                new THREE.Vector3(2138.6, -254.4, 330.8),
                new THREE.Vector3(2166.3, -255.7, 312.2),
                new THREE.Vector3(2182.3, -257.0, 295.2),
                new THREE.Vector3(2187.6, -258.3, 272.6),
                new THREE.Vector3(2176.0, -259.5, 243.8),
                new THREE.Vector3(2153.3, -260.8, 216.8),
                new THREE.Vector3(2136.5, -262.1, 192.7),
                new THREE.Vector3(2130.1, -263.4, 164.2),
                new THREE.Vector3(2139.2, -264.6, 130.3),
                new THREE.Vector3(2154.0, -265.9, 98.2),
                new THREE.Vector3(2161.4, -267.2, 65.8),
                new THREE.Vector3(2158.4, -268.4, 32.7),
                new THREE.Vector3(2144.7, -269.7, -1.9),
                new THREE.Vector3(2128.5, -270.9, -33.3),
                new THREE.Vector3(2120.6, -272.2, -59.5),
                new THREE.Vector3(2127.4, -273.4, -89.8),
                new THREE.Vector3(2148.0, -274.7, -120.8),
                new THREE.Vector3(2171.4, -275.9, -149.9),
                new THREE.Vector3(2192.9, -277.2, -175.4),
                new THREE.Vector3(2204.4, -278.4, -193.6),
                new THREE.Vector3(2206.7, -279.7, -207.0),
                new THREE.Vector3(2201.3, -280.9, -219.3),
                new THREE.Vector3(2189.3, -282.1, -225.4),
                new THREE.Vector3(2157.8, -283.3, -216.3),
                new THREE.Vector3(2124.7, -284.6, -199.0),
                new THREE.Vector3(2091.7, -285.8, -181.7),
                new THREE.Vector3(2058.7, -287.0, -164.2),
                new THREE.Vector3(2025.6, -288.2, -147.1),
                new THREE.Vector3(1996.2, -289.4, -131.3),
                new THREE.Vector3(1977.7, -290.6, -124.7),
                new THREE.Vector3(1964.3, -291.8, -126.4),
                new THREE.Vector3(1954.1, -293.0, -135.3),
                new THREE.Vector3(1951.4, -294.2, -150.4),
                new THREE.Vector3(1967.5, -295.4, -181.6),
                new THREE.Vector3(1986.6, -296.5, -209.0),
                new THREE.Vector3(1997.9, -297.7, -236.0),
                new THREE.Vector3(1995.4, -298.9, -271.0),
                new THREE.Vector3(1990.2, -300.0, -305.9),
                new THREE.Vector3(1993.6, -301.2, -343.0),
                new THREE.Vector3(1999.2, -302.3, -377.8),
                new THREE.Vector3(1997.2, -303.5, -409.1),
                new THREE.Vector3(1979.8, -304.6, -441.9),
                new THREE.Vector3(1959.5, -305.7, -470.8),
                new THREE.Vector3(1939.7, -306.8, -489.7),
                new THREE.Vector3(1917.4, -307.9, -496.3),
                new THREE.Vector3(1893.3, -309.0, -488.9),
                new THREE.Vector3(1869.7, -310.1, -463.0),
                new THREE.Vector3(1849.8, -311.2, -431.4),
                new THREE.Vector3(1829.2, -312.3, -405.2),
                new THREE.Vector3(1808.7, -313.3, -390.2),
                new THREE.Vector3(1783.8, -314.4, -386.5),
                new THREE.Vector3(1757.2, -315.4, -398.3),
                new THREE.Vector3(1731.6, -316.4, -425.4),
                new THREE.Vector3(1707.1, -317.4, -453.5),
                new THREE.Vector3(1678.9, -318.3, -477.9),
                new THREE.Vector3(1649.2, -319.2, -500.5),
                new THREE.Vector3(1635.4, -320.0, -511.5)
            ];
                } else if (courseType === 'irohazaka') {
            // ★公式完全再現：第一いろは坂（日光）下り 全長5,116m（標高差-440m・公式4区間完全一致・ポリゴン交差ゼロ）
            // 全長: 5,116m (第①区間: 1,320m / 第②区間: 1,332m / 第③区間: 1,240m / 第④区間: 1,224m)
            this.roadWidth = 10.5;
            this.gutterWidth = 1.2;
            points = [
                new THREE.Vector3(0.00, 0.00, 0.00), // 【スタート】(標高 0.0m)
                new THREE.Vector3(5.01, -1.57, -15.42),
                new THREE.Vector3(12.30, -3.14, -31.59),
                new THREE.Vector3(22.61, -4.71, -46.44),
                new THREE.Vector3(32.16, -6.29, -61.57),
                new THREE.Vector3(40.39, -7.86, -77.27),
                new THREE.Vector3(51.17, -9.43, -91.94),
                new THREE.Vector3(59.21, -11.00, -107.64),
                new THREE.Vector3(69.99, -12.57, -122.39),
                new THREE.Vector3(78.32, -14.14, -138.00),
                new THREE.Vector3(88.72, -15.71, -152.75),
                new THREE.Vector3(97.71, -17.29, -168.17),
                new THREE.Vector3(107.73, -18.86, -183.11),
                new THREE.Vector3(117.09, -20.43, -198.34),
                new THREE.Vector3(126.84, -22.00, -213.48),
                new THREE.Vector3(137.24, -23.57, -228.23),
                new THREE.Vector3(146.13, -25.14, -243.65),
                new THREE.Vector3(156.25, -26.71, -258.59),
                new THREE.Vector3(168.08, -28.29, -272.78),
                new THREE.Vector3(179.52, -29.86, -287.25),
                new THREE.Vector3(193.80, -31.43, -298.79),
                new THREE.Vector3(208.46, -33.00, -309.67),
                new THREE.Vector3(223.22, -34.57, -320.07),
                new THREE.Vector3(237.50, -36.14, -331.71),
                new THREE.Vector3(251.69, -37.71, -343.43),
                new THREE.Vector3(261.24, -39.29, -358.57),
                new THREE.Vector3(269.28, -40.86, -374.36),
                new THREE.Vector3(275.05, -42.43, -391.10),
                new THREE.Vector3(277.32, -44.00, -409.26),
                new THREE.Vector3(277.32, -45.57, -428.37),
                new THREE.Vector3(282.81, -47.14, -445.21),
                new THREE.Vector3(293.30, -48.71, -459.96),
                new THREE.Vector3(304.28, -50.29, -474.53),
                new THREE.Vector3(316.29, -51.86, -488.71),
                new THREE.Vector3(330.48, -53.43, -500.63),
                new THREE.Vector3(347.31, -55.00, -506.21),
                new THREE.Vector3(364.15, -56.57, -511.70),
                new THREE.Vector3(380.70, -58.14, -517.85),
                new THREE.Vector3(395.83, -59.71, -527.68),
                new THREE.Vector3(403.78, -61.29, -543.48),
                new THREE.Vector3(412.95, -62.86, -558.80),
                new THREE.Vector3(425.34, -64.43, -572.70),
                new THREE.Vector3(425.15, -66.00, -596.35),
                new THREE.Vector3(431.30, -67.57, -607.61),
                new THREE.Vector3(447.10, -69.14, -609.21),
                new THREE.Vector3(462.14, -70.71, -602.50),
                new THREE.Vector3(461.95, -72.29, -582.83),
                new THREE.Vector3(440.95, -73.86, -569.96),
                new THREE.Vector3(431.11, -75.43, -554.92),
                new THREE.Vector3(417.59, -77.00, -541.40),
                new THREE.Vector3(411.72, -78.57, -524.75),
                new THREE.Vector3(404.17, -80.14, -511.78),
                new THREE.Vector3(372.50, -81.71, -504.88),
                new THREE.Vector3(366.77, -83.29, -493.12),
                new THREE.Vector3(361.78, -84.86, -478.78),
                new THREE.Vector3(377.67, -86.43, -463.93),
                new THREE.Vector3(412.02, -88.00, -474.61),
                new THREE.Vector3(424.87, -89.57, -494.48),
                new THREE.Vector3(428.46, -91.14, -512.08),
                new THREE.Vector3(434.33, -92.71, -528.82),
                new THREE.Vector3(446.15, -94.29, -542.91),
                new THREE.Vector3(461.19, -95.86, -552.84),
                new THREE.Vector3(471.12, -97.43, -567.69),
                new THREE.Vector3(479.26, -99.00, -583.49),
                new THREE.Vector3(492.12, -100.57, -597.49),
                new THREE.Vector3(508.86, -102.14, -603.16),
                new THREE.Vector3(516.97, -103.71, -603.23),
                new THREE.Vector3(548.43, -105.29, -610.98),
                new THREE.Vector3(566.03, -106.86, -629.27),
                new THREE.Vector3(565.22, -108.43, -637.37),
                new THREE.Vector3(548.78, -110.00, -657.07), // 【第①チェックポイント】(1,320m地点・標高 -110.0m)
                new THREE.Vector3(549.95, -111.74, -665.65),
                new THREE.Vector3(558.06, -113.48, -680.04),
                new THREE.Vector3(568.44, -115.22, -690.50),
                new THREE.Vector3(571.98, -116.96, -710.95),
                new THREE.Vector3(583.30, -118.70, -715.28),
                new THREE.Vector3(600.61, -120.43, -697.97),
                new THREE.Vector3(604.30, -122.17, -687.83),
                new THREE.Vector3(601.39, -123.91, -681.30),
                new THREE.Vector3(593.13, -125.65, -674.53),
                new THREE.Vector3(578.11, -127.39, -662.50),
                new THREE.Vector3(583.78, -129.13, -647.24),
                new THREE.Vector3(593.69, -130.87, -645.35),
                new THREE.Vector3(599.51, -132.61, -651.10),
                new THREE.Vector3(601.79, -134.35, -676.34),
                new THREE.Vector3(613.27, -136.09, -687.75),
                new THREE.Vector3(626.33, -137.83, -695.61),
                new THREE.Vector3(638.36, -139.57, -705.76),
                new THREE.Vector3(651.65, -141.30, -712.92),
                new THREE.Vector3(665.89, -143.04, -717.87),
                new THREE.Vector3(672.63, -144.78, -731.66),
                new THREE.Vector3(705.06, -146.52, -738.56),
                new THREE.Vector3(720.23, -148.26, -732.39),
                new THREE.Vector3(750.13, -150.00, -748.93),
                new THREE.Vector3(738.67, -151.74, -774.26),
                new THREE.Vector3(709.85, -153.48, -757.57),
                new THREE.Vector3(705.66, -155.22, -719.49),
                new THREE.Vector3(685.55, -156.96, -710.24),
                new THREE.Vector3(673.28, -158.70, -700.49),
                new THREE.Vector3(667.30, -160.43, -690.89),
                new THREE.Vector3(643.16, -162.17, -663.68),
                new THREE.Vector3(657.08, -163.91, -646.38),
                new THREE.Vector3(672.42, -165.65, -655.97),
                new THREE.Vector3(680.67, -167.39, -692.94),
                new THREE.Vector3(692.87, -169.13, -702.69),
                new THREE.Vector3(705.06, -170.87, -712.60),
                new THREE.Vector3(718.90, -172.61, -718.42),
                new THREE.Vector3(733.29, -174.35, -722.98),
                new THREE.Vector3(740.61, -176.09, -748.15),
                new THREE.Vector3(769.21, -177.83, -756.20),
                new THREE.Vector3(781.30, -179.57, -741.57),
                new THREE.Vector3(777.14, -181.30, -727.62),
                new THREE.Vector3(768.74, -183.04, -708.41),
                new THREE.Vector3(763.20, -184.78, -705.13),
                new THREE.Vector3(713.87, -186.52, -709.06),
                new THREE.Vector3(702.62, -188.26, -680.28),
                new THREE.Vector3(709.07, -190.00, -672.65),
                new THREE.Vector3(729.04, -191.74, -675.71),
                new THREE.Vector3(756.10, -193.48, -695.77),
                new THREE.Vector3(770.49, -195.22, -700.25),
                new THREE.Vector3(784.73, -196.96, -705.05),
                new THREE.Vector3(789.29, -198.70, -710.64),
                new THREE.Vector3(807.88, -200.43, -727.83),
                new THREE.Vector3(827.74, -202.17, -715.68),
                new THREE.Vector3(816.46, -203.91, -690.86),
                new THREE.Vector3(789.43, -205.65, -688.98),
                new THREE.Vector3(782.84, -207.39, -687.75),
                new THREE.Vector3(769.94, -209.13, -679.65),
                new THREE.Vector3(756.89, -210.87, -671.86),
                new THREE.Vector3(744.38, -212.61, -662.74),
                new THREE.Vector3(731.88, -214.35, -653.77),
                new THREE.Vector3(724.33, -216.09, -654.16),
                new THREE.Vector3(702.62, -217.83, -657.15),
                new THREE.Vector3(690.43, -219.57, -637.88),
                new THREE.Vector3(695.30, -221.30, -628.29),
                new THREE.Vector3(701.20, -223.04, -624.20),
                new THREE.Vector3(716.38, -224.78, -624.83),
                new THREE.Vector3(729.44, -226.52, -642.05),
                new THREE.Vector3(739.74, -228.26, -649.76),
                new THREE.Vector3(746.51, -230.00, -651.73), // 【第②チェックポイント】(2,652m地点・標高 -230.0m)
                new THREE.Vector3(761.90, -231.72, -655.51),
                new THREE.Vector3(772.69, -233.44, -648.01),
                new THREE.Vector3(809.94, -235.16, -653.35),
                new THREE.Vector3(808.20, -236.88, -674.03),
                new THREE.Vector3(798.51, -238.59, -678.88),
                new THREE.Vector3(790.44, -240.31, -672.80),
                new THREE.Vector3(791.18, -242.03, -648.87),
                new THREE.Vector3(779.33, -243.75, -640.68),
                new THREE.Vector3(776.68, -245.47, -635.57),
                new THREE.Vector3(766.79, -247.19, -620.92),
                new THREE.Vector3(750.52, -248.91, -618.20),
                new THREE.Vector3(743.73, -250.62, -612.11),
                new THREE.Vector3(725.87, -252.34, -599.65),
                new THREE.Vector3(722.12, -254.06, -587.71),
                new THREE.Vector3(731.76, -255.78, -579.82),
                new THREE.Vector3(750.51, -257.50, -577.76),
                new THREE.Vector3(759.24, -259.22, -592.02),
                new THREE.Vector3(767.94, -260.94, -602.64),
                new THREE.Vector3(775.12, -262.66, -613.86),
                new THREE.Vector3(785.12, -264.38, -623.93),
                new THREE.Vector3(796.90, -266.09, -629.75),
                new THREE.Vector3(802.49, -267.81, -631.37),
                new THREE.Vector3(824.14, -269.53, -637.90),
                new THREE.Vector3(825.11, -271.25, -649.09),
                new THREE.Vector3(816.60, -272.97, -662.95),
                new THREE.Vector3(829.87, -274.69, -687.20),
                new THREE.Vector3(848.10, -276.41, -679.89),
                new THREE.Vector3(850.23, -278.12, -670.96),
                new THREE.Vector3(849.66, -279.84, -658.94),
                new THREE.Vector3(846.42, -281.56, -642.94),
                new THREE.Vector3(845.45, -283.28, -636.56),
                new THREE.Vector3(843.73, -285.00, -627.49),
                new THREE.Vector3(826.11, -286.72, -621.43),
                new THREE.Vector3(801.53, -288.44, -641.07),
                new THREE.Vector3(793.85, -290.16, -638.47),
                new THREE.Vector3(793.27, -291.88, -623.72),
                new THREE.Vector3(814.63, -293.59, -612.91),
                new THREE.Vector3(825.79, -295.31, -615.37),
                new THREE.Vector3(839.89, -297.03, -608.52),
                new THREE.Vector3(861.33, -298.75, -624.03),
                new THREE.Vector3(847.77, -300.47, -645.52),
                new THREE.Vector3(796.49, -302.19, -626.60),
                new THREE.Vector3(810.59, -303.91, -601.54),
                new THREE.Vector3(826.75, -305.62, -597.43),
                new THREE.Vector3(844.61, -307.34, -603.94),
                new THREE.Vector3(872.47, -309.06, -582.95),
                new THREE.Vector3(852.09, -310.78, -561.07),
                new THREE.Vector3(813.69, -312.50, -605.35),
                new THREE.Vector3(804.11, -314.22, -601.29),
                new THREE.Vector3(809.18, -315.94, -574.78),
                new THREE.Vector3(839.81, -317.66, -567.83),
                new THREE.Vector3(842.73, -319.38, -557.03),
                new THREE.Vector3(829.54, -321.09, -547.96),
                new THREE.Vector3(791.49, -322.81, -545.01),
                new THREE.Vector3(786.67, -324.53, -532.96),
                new THREE.Vector3(805.04, -326.25, -520.74),
                new THREE.Vector3(838.87, -327.97, -537.82),
                new THREE.Vector3(849.75, -329.69, -528.35),
                new THREE.Vector3(863.10, -331.41, -526.37),
                new THREE.Vector3(877.34, -333.12, -526.43),
                new THREE.Vector3(889.46, -334.84, -521.44),
                new THREE.Vector3(900.69, -336.56, -518.63),
                new THREE.Vector3(908.49, -338.28, -510.41),
                new THREE.Vector3(921.91, -340.00, -508.94), // 【第③チェックポイント】(3,892m地点・標高 -340.0m)
                new THREE.Vector3(949.12, -341.69, -487.33),
                new THREE.Vector3(974.12, -343.39, -467.33),
                new THREE.Vector3(999.12, -345.08, -452.33),
                new THREE.Vector3(1009.13, -346.78, -432.33),
                new THREE.Vector3(1002.12, -348.47, -417.32),
                new THREE.Vector3(986.12, -350.17, -412.32),
                new THREE.Vector3(972.12, -351.86, -420.32),
                new THREE.Vector3(970.12, -353.56, -436.33),
                new THREE.Vector3(982.12, -355.25, -450.33),
                new THREE.Vector3(999.12, -356.95, -452.33),
                new THREE.Vector3(1019.13, -358.64, -447.33),
                new THREE.Vector3(1039.13, -360.34, -447.33),
                new THREE.Vector3(1044.13, -362.03, -467.33),
                new THREE.Vector3(1044.13, -363.73, -492.33),
                new THREE.Vector3(1048.82, -365.42, -503.65),
                new THREE.Vector3(1060.13, -367.12, -508.34),
                new THREE.Vector3(1071.45, -368.81, -503.65),
                new THREE.Vector3(1076.13, -370.51, -492.33),
                new THREE.Vector3(1076.13, -372.20, -472.33),
                new THREE.Vector3(1076.13, -373.90, -452.33),
                new THREE.Vector3(1080.82, -375.59, -441.01),
                new THREE.Vector3(1092.14, -377.29, -436.33),
                new THREE.Vector3(1103.45, -378.98, -441.01),
                new THREE.Vector3(1108.14, -380.68, -452.33),
                new THREE.Vector3(1108.14, -382.37, -472.33),
                new THREE.Vector3(1108.14, -384.07, -492.33),
                new THREE.Vector3(1112.83, -385.76, -503.65),
                new THREE.Vector3(1124.14, -387.46, -508.34),
                new THREE.Vector3(1135.46, -389.15, -503.65),
                new THREE.Vector3(1140.14, -390.85, -492.33),
                new THREE.Vector3(1140.14, -392.54, -472.33),
                new THREE.Vector3(1140.14, -394.24, -452.33),
                new THREE.Vector3(1144.83, -395.93, -441.01),
                new THREE.Vector3(1156.15, -397.63, -436.33),
                new THREE.Vector3(1167.46, -399.32, -441.01),
                new THREE.Vector3(1172.15, -401.02, -452.33),
                new THREE.Vector3(1172.15, -402.71, -472.33),
                new THREE.Vector3(1172.15, -404.41, -492.33),
                new THREE.Vector3(1176.84, -406.10, -503.65),
                new THREE.Vector3(1188.15, -407.80, -508.34),
                new THREE.Vector3(1199.47, -409.49, -503.65),
                new THREE.Vector3(1204.15, -411.19, -492.33),
                new THREE.Vector3(1204.15, -412.88, -472.33),
                new THREE.Vector3(1219.16, -414.58, -457.33),
                new THREE.Vector3(1239.16, -416.27, -452.33),
                new THREE.Vector3(1268.57, -417.97, -452.85),
                new THREE.Vector3(1300.18, -419.66, -448.07),
                new THREE.Vector3(1331.68, -421.36, -443.39),
                new THREE.Vector3(1363.19, -423.05, -438.71),
                new THREE.Vector3(1393.40, -424.75, -430.63),
                new THREE.Vector3(1419.31, -426.44, -412.34),
                new THREE.Vector3(1440.92, -428.14, -390.86),
                new THREE.Vector3(1467.33, -429.83, -373.48),
                new THREE.Vector3(1496.73, -431.53, -363.60),
                new THREE.Vector3(1525.34, -433.22, -351.82),
                new THREE.Vector3(1550.55, -434.92, -331.83),
                new THREE.Vector3(1573.96, -436.61, -311.05),
                new THREE.Vector3(1599.27, -438.31, -291.07),
                new THREE.Vector3(1621.47, -440.00, -271.69) // 【ゴール/フィニッシュ】(5,116m地点・標高 -440.0m)
            ];
        } else if (courseType === 'usui') {
            // ★本物完全再現：碓氷峠（全長3,972m サーキットレイアウト・C-121・めがね橋・連続ヘアピン）
            this.roadWidth = 8.8;
            this.gutterWidth = 0.6;
            points = [
                new THREE.Vector3(0.0, 0.0, 0.0), // スタートライン（メインストレート）
                new THREE.Vector3(0.1, -1.2, 34.8),
                new THREE.Vector3(0.3, -2.4, 70.0),
                new THREE.Vector3(0.7, -3.6, 105.2),
                new THREE.Vector3(0.7, -4.8, 140.3),
                new THREE.Vector3(-4.7, -6.1, 173.5),
                new THREE.Vector3(-21.2, -7.3, 202.7),
                new THREE.Vector3(-45.9, -8.6, 226.2),
                new THREE.Vector3(-74.2, -9.8, 244.0),
                new THREE.Vector3(-101.6, -11.1, 262.0),
                new THREE.Vector3(-125.1, -12.4, 286.6),
                new THREE.Vector3(-145.0, -13.7, 316.0),
                new THREE.Vector3(-134.3, -15.0, 340.6), // メインストレート脱出〜南アプローチ
                new THREE.Vector3(-100.5, -16.4, 342.7),
                new THREE.Vector3(-66.6, -18.0, 336.9),
                new THREE.Vector3(-32.9, -19.7, 338.5),
                new THREE.Vector3(-1.8, -21.5, 353.4),
                new THREE.Vector3(12.5, -23.4, 380.5),
                new THREE.Vector3(3.2, -25.2, 411.3),
                new THREE.Vector3(-23.3, -27.0, 428.1),
                new THREE.Vector3(-58.5, -28.7, 427.6),
                new THREE.Vector3(-93.2, -30.3, 423.5),
                new THREE.Vector3(-125.4, -31.8, 418.3),
                new THREE.Vector3(-156.8, -33.0, 409.7),
                new THREE.Vector3(-188.4, -34.0, 400.2),
                new THREE.Vector3(-221.1, -34.6, 393.0),
                new THREE.Vector3(-255.5, -35.0, 391.1), // めがね橋（碓氷第三橋梁）直下・谷底セクション
                new THREE.Vector3(-289.3, -34.9, 388.2),
                new THREE.Vector3(-319.0, -34.6, 374.3),
                new THREE.Vector3(-349.3, -34.0, 362.4),
                new THREE.Vector3(-383.1, -33.1, 359.3),
                new THREE.Vector3(-410.0, -32.0, 337.0),
                new THREE.Vector3(-436.2, -30.6, 317.7),
                new THREE.Vector3(-463.7, -29.1, 299.7),
                new THREE.Vector3(-490.4, -27.3, 275.6),
                new THREE.Vector3(-503.3, -25.4, 247.3),
                new THREE.Vector3(-492.1, -23.3, 219.4),
                new THREE.Vector3(-466.8, -21.1, 194.9),
                new THREE.Vector3(-439.1, -18.8, 175.9),
                new THREE.Vector3(-410.7, -16.3, 160.8),
                new THREE.Vector3(-381.2, -13.8, 147.9),
                new THREE.Vector3(-350.4, -11.2, 135.0),
                new THREE.Vector3(-324.2, -8.6, 115.2),
                new THREE.Vector3(-324.1, -5.9, 86.6),
                new THREE.Vector3(-353.1, -3.3, 78.5),
                new THREE.Vector3(-385.1, -0.6, 90.1),
                new THREE.Vector3(-416.2, 2.0, 100.1),
                new THREE.Vector3(-447.8, 4.6, 107.3),
                new THREE.Vector3(-481.5, 7.2, 111.3),
                new THREE.Vector3(-517.6, 9.6, 111.1),
                new THREE.Vector3(-548.2, 12.0, 99.5),
                new THREE.Vector3(-565.2, 14.2, 72.5),
                new THREE.Vector3(-566.6, 16.3, 39.9),
                new THREE.Vector3(-555.5, 18.2, 9.0),
                new THREE.Vector3(-542.3, 20.0, -21.3), // 西側連続テクニカルヘアピン
                new THREE.Vector3(-532.0, 21.7, -52.1),
                new THREE.Vector3(-521.5, 23.4, -82.8),
                new THREE.Vector3(-509.3, 25.1, -113.2),
                new THREE.Vector3(-495.4, 26.8, -142.8),
                new THREE.Vector3(-479.7, 28.5, -171.5),
                new THREE.Vector3(-462.3, 30.2, -199.2),
                new THREE.Vector3(-446.9, 31.9, -229.1),
                new THREE.Vector3(-457.6, 33.6, -257.5),
                new THREE.Vector3(-489.8, 35.3, -259.2),
                new THREE.Vector3(-508.0, 37.0, -232.5),
                new THREE.Vector3(-515.0, 38.6, -199.3),
                new THREE.Vector3(-539.4, 40.2, -180.4),
                new THREE.Vector3(-569.7, 41.7, -194.7),
                new THREE.Vector3(-571.7, 43.2, -223.1),
                new THREE.Vector3(-556.0, 44.7, -253.8),
                new THREE.Vector3(-538.5, 46.1, -281.5),
                new THREE.Vector3(-521.2, 47.4, -308.8),
                new THREE.Vector3(-502.9, 48.7, -337.3),
                new THREE.Vector3(-480.6, 50.0, -362.7),
                new THREE.Vector3(-455.7, 51.1, -385.0),
                new THREE.Vector3(-445.9, 52.2, -418.2),
                new THREE.Vector3(-455.9, 53.2, -448.5),
                new THREE.Vector3(-475.0, 54.2, -476.4),
                new THREE.Vector3(-490.9, 55.0, -506.2),
                new THREE.Vector3(-493.9, 55.8, -537.0),
                new THREE.Vector3(-480.9, 56.6, -567.3),
                new THREE.Vector3(-462.1, 57.4, -596.2),
                new THREE.Vector3(-445.2, 58.2, -624.0),
                new THREE.Vector3(-430.1, 58.9, -652.4),
                new THREE.Vector3(-416.1, 59.4, -682.0),
                new THREE.Vector3(-401.4, 59.8, -711.6),
                new THREE.Vector3(-384.6, 60.0, -740.1), // 北部山頂ヘアピン（最高標高地点）
                new THREE.Vector3(-363.8, 59.9, -765.7),
                new THREE.Vector3(-334.7, 59.4, -768.2),
                new THREE.Vector3(-310.8, 58.5, -743.1),
                new THREE.Vector3(-307.7, 57.2, -712.5),
                new THREE.Vector3(-315.4, 55.6, -680.3),
                new THREE.Vector3(-326.5, 53.7, -647.7),
                new THREE.Vector3(-336.2, 51.5, -615.2),
                new THREE.Vector3(-340.0, 49.1, -583.4),
                new THREE.Vector3(-334.5, 46.5, -552.5),
                new THREE.Vector3(-321.1, 43.8, -522.8),
                new THREE.Vector3(-301.9, 41.0, -494.5),
                new THREE.Vector3(-279.2, 38.1, -467.6),
                new THREE.Vector3(-255.5, 35.2, -442.1),
                new THREE.Vector3(-233.1, 32.3, -416.6),
                new THREE.Vector3(-214.5, 29.4, -389.5),
                new THREE.Vector3(-202.2, 26.6, -359.5),
                new THREE.Vector3(-199.0, 24.0, -326.1),
                new THREE.Vector3(-209.5, 21.5, -293.7),
                new THREE.Vector3(-228.5, 19.2, -264.5),
                new THREE.Vector3(-233.1, 17.2, -234.8), // ★名物「C-121」超高速ブラインド右コーナー
                new THREE.Vector3(-213.7, 14.9, -208.1),
                new THREE.Vector3(-183.8, 12.5, -200.2),
                new THREE.Vector3(-153.4, 10.0, -214.1),
                new THREE.Vector3(-124.3, 7.5, -233.4),
                new THREE.Vector3(-95.2, 5.3, -245.7),
                new THREE.Vector3(-62.5, 3.2, -245.1),
                new THREE.Vector3(-31.0, 1.6, -230.8),
                new THREE.Vector3(-10.2, 0.5, -206.6),
                new THREE.Vector3(-0.9, 0.0, -175.4), // 最終コーナー脱出〜メインストレート復帰
                new THREE.Vector3(1.3, 0.0, -140.3),
                new THREE.Vector3(0.7, 0.0, -104.2),
                new THREE.Vector3(0.2, 0.0, -69.0),
                new THREE.Vector3(-0.0, 0.0, -34.5),
                new THREE.Vector3(0.0, 0.0, -0.0), // フィニッシュゲート（スタートと完全合流）
            ];
        } else if (courseType === 'akagi') {
            // ★本物完全再現：赤城山（群馬県道4号線）赤城レッドサンズ聖地・大鳥居・白樺並木・中高速下り・悪魔のV字コーナー
            this.roadWidth = 10.0;
            this.gutterWidth = 1.0;
            points = [
                // 1. 赤城大沼・山頂スタート〜赤城大鳥居通過
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(10, -4, 80),
                new THREE.Vector3(25, -9, 170),  // 赤城大鳥居くぐり抜け
                new THREE.Vector3(45, -16, 270),

                // 2. 前半：白樺並木を突き抜ける超高速下りストレート＆大アールS字
                new THREE.Vector3(75, -26, 390),
                new THREE.Vector3(115, -38, 530),
                new THREE.Vector3(135, -52, 690),
                new THREE.Vector3(110, -68, 860),  // 高速右1
                new THREE.Vector3(50, -86, 1020),
                new THREE.Vector3(-35, -104, 1170), // 高速左1
                new THREE.Vector3(-110, -122, 1310),
                new THREE.Vector3(-145, -140, 1460),
                new THREE.Vector3(-125, -158, 1610),
                new THREE.Vector3(-60, -176, 1750),

                // 3. ★悪魔のV字コーナー（超高速下りから急減速し鋭角に切り返す！）
                new THREE.Vector3(30, -194, 1880),  // V字コーナー急減速アプローチ
                new THREE.Vector3(100, -208, 1970),
                new THREE.Vector3(145, -220, 2050),
                new THREE.Vector3(135, -232, 2120), // V字コーナー クリップ1 (鋭角右)
                new THREE.Vector3(70, -244, 2160),  // 切り返し
                new THREE.Vector3(-20, -256, 2200), // V字コーナー クリップ2 (鋭角左)
                new THREE.Vector3(-95, -268, 2260),
                new THREE.Vector3(-130, -280, 2340),
                new THREE.Vector3(-115, -292, 2430),

                // 4. 中盤：連続ブラインド複合S字（木立に隠れたアペックス）
                new THREE.Vector3(-50, -306, 2530),
                new THREE.Vector3(35, -320, 2640),
                new THREE.Vector3(105, -334, 2760),
                new THREE.Vector3(130, -348, 2890),
                new THREE.Vector3(95, -362, 3020),
                new THREE.Vector3(10, -376, 3140),
                new THREE.Vector3(-75, -390, 3260),
                new THREE.Vector3(-120, -404, 3390),
                new THREE.Vector3(-100, -418, 3520),
                new THREE.Vector3(-30, -430, 3640),

                // 5. 終盤：赤城森林公園〜総合案内所前高速フィニッシュ
                new THREE.Vector3(50, -442, 3760),
                new THREE.Vector3(110, -452, 3880),
                new THREE.Vector3(125, -460, 4010),
                new THREE.Vector3(80, -466, 4130),
                new THREE.Vector3(20, -470, 4240),
                new THREE.Vector3(0, -472, 4340)    // フィニッシュゲート
            ];
                } else if (courseType === 'happo') {
            // 【八方ヶ原 忠実再現版】公式マップ(5478m)基準 完全再構築
            // ①区間: 1320m / ②区間: 1410m / ③区間: 1428m / ④区間: 1320m (全長 5478m)
            // プレイアビリティ確保: 全コーナー最小半径 R >= 22.0m (ドリフト・溝落とし最適化)
            this.roadWidth = 8.6;
            this.gutterWidth = 0.8;
            points = [
                new THREE.Vector3(0.0, -0.0, -0.0), // START / FINISH (0m)
                new THREE.Vector3(25.2, -2.6, 52.0),
                new THREE.Vector3(16.9, -5.4, 105.4),
                new THREE.Vector3(27.7, -8.3, 137.7),
                new THREE.Vector3(47.1, -11.3, 218.9),
                new THREE.Vector3(21.2, -14.3, 258.1),
                new THREE.Vector3(15.8, -17.3, 290.8),
                new THREE.Vector3(59.5, -20.4, 335.1),
                new THREE.Vector3(88.6, -23.5, 380.0),
                new THREE.Vector3(128.1, -26.7, 423.2),
                new THREE.Vector3(173.7, -29.9, 457.4),
                new THREE.Vector3(231.6, -33.1, 467.8),
                new THREE.Vector3(281.1, -36.3, 492.4),
                new THREE.Vector3(292.9, -39.5, 550.0),
                new THREE.Vector3(287.0, -42.8, 601.2),
                new THREE.Vector3(258.9, -46.0, 672.1),
                new THREE.Vector3(224.7, -49.3, 663.2),
                new THREE.Vector3(206.8, -52.6, 601.9),
                new THREE.Vector3(162.1, -55.9, 564.5),
                new THREE.Vector3(104.7, -59.2, 558.3),
                new THREE.Vector3(64.9, -62.6, 515.7),
                new THREE.Vector3(30.1, -65.9, 479.7),
                new THREE.Vector3(7.8, -69.2, 433.3),
                new THREE.Vector3(-26.7, -72.6, 393.5), // CHECKPOINT 1 (第①区間終了 1320m)
                new THREE.Vector3(-84.0, -76.0, 392.6), // CHECKPOINT 1 (第①区間終了 1320m)
                new THREE.Vector3(-151.5, -79.4, 410.0), // CHECKPOINT 1 (第①区間終了 1320m)
                new THREE.Vector3(-177.6, -82.8, 382.0),
                new THREE.Vector3(-166.6, -86.2, 323.0),
                new THREE.Vector3(-146.3, -89.6, 268.2),
                new THREE.Vector3(-152.2, -93.0, 201.3),
                new THREE.Vector3(-199.7, -96.4, 157.5),
                new THREE.Vector3(-238.9, -99.8, 170.4),
                new THREE.Vector3(-283.7, -103.3, 201.4),
                new THREE.Vector3(-332.9, -106.7, 182.6),
                new THREE.Vector3(-397.4, -110.2, 121.7),
                new THREE.Vector3(-437.1, -113.6, 146.5),
                new THREE.Vector3(-443.8, -117.1, 197.1),
                new THREE.Vector3(-468.1, -120.6, 250.0),
                new THREE.Vector3(-521.8, -124.1, 273.5),
                new THREE.Vector3(-580.1, -127.6, 277.2),
                new THREE.Vector3(-637.8, -131.1, 264.5),
                new THREE.Vector3(-695.9, -134.6, 254.9),
                new THREE.Vector3(-740.4, -138.1, 296.5),
                new THREE.Vector3(-731.2, -141.6, 339.6), // CHECKPOINT 2 (第②区間終了 2730m)
                new THREE.Vector3(-680.7, -145.1, 370.3), // CHECKPOINT 2 (第②区間終了 2730m)
                new THREE.Vector3(-635.6, -148.6, 379.8), // CHECKPOINT 2 (第②区間終了 2730m)
                new THREE.Vector3(-560.5, -152.1, 438.2),
                new THREE.Vector3(-581.2, -155.7, 462.6),
                new THREE.Vector3(-655.4, -159.2, 408.1),
                new THREE.Vector3(-677.3, -162.7, 429.4),
                new THREE.Vector3(-641.8, -166.3, 471.0),
                new THREE.Vector3(-582.7, -169.8, 482.3),
                new THREE.Vector3(-538.9, -173.4, 498.8),
                new THREE.Vector3(-531.8, -177.0, 528.9),
                new THREE.Vector3(-560.9, -180.5, 575.6),
                new THREE.Vector3(-578.1, -184.1, 617.8),
                new THREE.Vector3(-560.0, -187.7, 677.2),
                new THREE.Vector3(-570.6, -191.3, 733.9),
                new THREE.Vector3(-606.8, -194.8, 813.7),
                new THREE.Vector3(-642.4, -198.4, 795.9),
                new THREE.Vector3(-628.3, -202.0, 703.9),
                new THREE.Vector3(-661.4, -205.6, 693.3),
                new THREE.Vector3(-711.1, -209.2, 769.5),
                new THREE.Vector3(-691.1, -212.8, 822.8),
                new THREE.Vector3(-667.1, -216.4, 876.1),
                new THREE.Vector3(-630.2, -220.1, 916.9),
                new THREE.Vector3(-608.4, -223.7, 964.1),
                new THREE.Vector3(-579.4, -227.3, 1010.9),
                new THREE.Vector3(-541.7, -230.9, 1049.0),
                new THREE.Vector3(-523.5, -234.5, 1092.3),
                new THREE.Vector3(-503.1, -238.2, 1148.6), // CHECKPOINT 3 (第③区間終了 4158m)
                new THREE.Vector3(-519.5, -241.8, 1190.7), // CHECKPOINT 3 (第③区間終了 4158m)
                new THREE.Vector3(-553.9, -245.4, 1236.4), // CHECKPOINT 3 (第③区間終了 4158m)
                new THREE.Vector3(-608.3, -249.1, 1258.6),
                new THREE.Vector3(-649.3, -252.7, 1255.0),
                new THREE.Vector3(-680.7, -256.4, 1249.1),
                new THREE.Vector3(-750.0, -260.0, 1257.9),
                new THREE.Vector3(-760.9, -263.7, 1296.5),
                new THREE.Vector3(-721.1, -267.3, 1369.8),
                new THREE.Vector3(-752.0, -271.0, 1399.8),
                new THREE.Vector3(-849.5, -274.7, 1373.4),
                new THREE.Vector3(-874.0, -278.3, 1407.0),
                new THREE.Vector3(-823.6, -282.0, 1468.7),
                new THREE.Vector3(-751.3, -285.7, 1482.2),
                new THREE.Vector3(-705.4, -289.4, 1507.6),
                new THREE.Vector3(-703.4, -293.0, 1548.5),
                new THREE.Vector3(-738.8, -296.7, 1584.9),
                new THREE.Vector3(-784.3, -300.4, 1626.3),
                new THREE.Vector3(-830.4, -304.1, 1638.3),
                new THREE.Vector3(-873.7, -307.8, 1661.9),
                new THREE.Vector3(-913.7, -311.5, 1664.5),
                new THREE.Vector3(-955.0, -315.2, 1665.3),
                new THREE.Vector3(-1024.8, -318.9, 1614.3),
                new THREE.Vector3(-1072.1, -322.6, 1615.3),
                new THREE.Vector3(-1085.0, -326.3, 1650.6),
                new THREE.Vector3(-1055.1, -330.0, 1708.5) // FINISH / START (5478m)
            ];
        } else if (courseType === 'tsubaki') {
            // ★本物完全再現：椿ライン（神奈川県道75号 箱根・大観山〜奥湯河原 全長7,312m・標高差-730m）
            // 公式マップ形状完全準拠・4区間完全再現・全カーブ曲率適正化・メッシュ折れ完全解消
            this.roadWidth = 10.6;
            this.gutterWidth = 1.1;
            points = [
                new THREE.Vector3(0.0, 0.0, 0.0),
                new THREE.Vector3(19.1, -2.9, 26.1),
                new THREE.Vector3(41.4, -5.9, 49.5),
                new THREE.Vector3(64.6, -8.9, 72.2),
                new THREE.Vector3(80.2, -11.1, 90.7),
                new THREE.Vector3(87.9, -12.7, 107.1),
                new THREE.Vector3(85.8, -14.6, 126.9),
                new THREE.Vector3(74.7, -16.6, 146.2),
                new THREE.Vector3(69.2, -18.1, 161.3),
                new THREE.Vector3(72.7, -19.5, 176.8),
                new THREE.Vector3(94.2, -22.3, 197.9),
                new THREE.Vector3(120.8, -25.3, 216.4),
                new THREE.Vector3(145.9, -28.3, 236.8),
                new THREE.Vector3(167.6, -31.3, 260.9),
                new THREE.Vector3(185.7, -34.3, 287.7),
                new THREE.Vector3(200.7, -37.3, 316.3),
                new THREE.Vector3(211.8, -40.4, 346.7),
                new THREE.Vector3(218.4, -43.4, 378.4),
                new THREE.Vector3(220.1, -46.2, 408.7),
                new THREE.Vector3(214.2, -49.1, 438.4),
                new THREE.Vector3(204.2, -51.9, 467.0),
                new THREE.Vector3(198.8, -54.6, 494.7),
                new THREE.Vector3(201.7, -57.0, 520.8),
                new THREE.Vector3(214.0, -59.7, 546.2),
                new THREE.Vector3(233.6, -62.6, 569.3),
                new THREE.Vector3(255.9, -65.3, 586.7),
                new THREE.Vector3(283.8, -68.1, 598.3),
                new THREE.Vector3(313.6, -71.0, 604.3),
                new THREE.Vector3(338.0, -73.5, 613.6),
                new THREE.Vector3(359.7, -76.2, 631.7),
                new THREE.Vector3(378.7, -79.3, 657.9),
                new THREE.Vector3(393.4, -82.4, 686.7),
                new THREE.Vector3(404.6, -85.5, 717.1),
                new THREE.Vector3(413.9, -88.6, 748.1),
                new THREE.Vector3(424.8, -91.5, 776.4),
                new THREE.Vector3(443.6, -94.7, 802.6),
                new THREE.Vector3(463.5, -97.6, 825.5),
                new THREE.Vector3(477.4, -100.3, 850.1),
                new THREE.Vector3(483.5, -103.3, 879.8),
                new THREE.Vector3(485.9, -106.0, 908.0),
                new THREE.Vector3(494.1, -108.6, 932.8),
                new THREE.Vector3(513.2, -111.5, 956.2),
                new THREE.Vector3(532.7, -114.3, 976.8),
                new THREE.Vector3(545.7, -116.8, 999.5),
                new THREE.Vector3(549.0, -119.6, 1027.5),
                new THREE.Vector3(543.8, -122.8, 1059.4),
                new THREE.Vector3(536.8, -125.9, 1091.0),
                new THREE.Vector3(529.9, -129.1, 1122.7),
                new THREE.Vector3(525.1, -132.1, 1152.6),
                new THREE.Vector3(526.1, -134.7, 1178.8),
                new THREE.Vector3(528.6, -136.1, 1192.8),
                new THREE.Vector3(528.9, -137.5, 1206.9),
                new THREE.Vector3(518.4, -138.8, 1214.2),
                new THREE.Vector3(505.5, -140.2, 1208.7),
                new THREE.Vector3(494.8, -141.8, 1196.7),
                new THREE.Vector3(488.4, -144.1, 1173.5),
                new THREE.Vector3(492.1, -147.4, 1141.5),
                new THREE.Vector3(497.1, -150.6, 1109.5),
                new THREE.Vector3(496.8, -153.8, 1077.1),
                new THREE.Vector3(492.7, -156.8, 1047.1),
                new THREE.Vector3(484.6, -159.5, 1022.1),
                new THREE.Vector3(467.6, -162.3, 999.6),
                new THREE.Vector3(442.3, -165.5, 979.5),
                new THREE.Vector3(421.3, -168.4, 960.5),
                new THREE.Vector3(405.4, -171.4, 934.8),
                new THREE.Vector3(395.4, -174.5, 906.2),
                new THREE.Vector3(381.3, -177.3, 881.8),
                new THREE.Vector3(358.7, -180.4, 861.5),
                new THREE.Vector3(338.3, -183.4, 839.1),
                new THREE.Vector3(323.0, -186.5, 813.0),
                new THREE.Vector3(307.6, -189.2, 791.7),
                new THREE.Vector3(286.1, -191.9, 776.8),
                new THREE.Vector3(260.7, -194.6, 770.4),
                new THREE.Vector3(236.7, -197.0, 772.4),
                new THREE.Vector3(213.7, -199.7, 784.8),
                new THREE.Vector3(191.7, -203.1, 808.5),
                new THREE.Vector3(173.5, -206.0, 830.2),
                new THREE.Vector3(155.8, -208.3, 843.5),
                new THREE.Vector3(130.2, -211.0, 848.0),
                new THREE.Vector3(108.0, -213.3, 846.2),
                new THREE.Vector3(93.9, -214.8, 846.4),
                new THREE.Vector3(81.0, -216.2, 851.8),
                new THREE.Vector3(80.4, -217.5, 864.3),
                new THREE.Vector3(92.6, -219.0, 871.4),
                new THREE.Vector3(123.5, -222.4, 880.9),
                new THREE.Vector3(148.9, -225.2, 887.8),
                new THREE.Vector3(173.0, -227.7, 887.3),
                new THREE.Vector3(197.8, -230.6, 874.1),
                new THREE.Vector3(218.9, -233.4, 858.4),
                new THREE.Vector3(237.3, -235.5, 850.3),
                new THREE.Vector3(255.3, -237.5, 851.4),
                new THREE.Vector3(274.7, -240.0, 865.5),
                new THREE.Vector3(292.0, -243.4, 892.7),
                new THREE.Vector3(305.7, -246.6, 919.9),
                new THREE.Vector3(314.1, -249.9, 948.9),
                new THREE.Vector3(317.9, -252.9, 977.0),
                new THREE.Vector3(329.2, -255.9, 1002.7),
                new THREE.Vector3(349.6, -259.3, 1027.9),
                new THREE.Vector3(365.3, -262.4, 1051.4),
                new THREE.Vector3(372.4, -265.2, 1076.6),
                new THREE.Vector3(370.0, -268.0, 1102.6),
                new THREE.Vector3(358.7, -271.0, 1128.5),
                new THREE.Vector3(340.6, -274.3, 1152.8),
                new THREE.Vector3(317.4, -277.5, 1172.2),
                new THREE.Vector3(290.4, -280.8, 1186.1),
                new THREE.Vector3(271.6, -283.2, 1197.9),
                new THREE.Vector3(259.7, -285.4, 1214.1),
                new THREE.Vector3(257.1, -287.7, 1235.9),
                new THREE.Vector3(265.6, -290.6, 1260.6),
                new THREE.Vector3(282.9, -293.6, 1282.9),
                new THREE.Vector3(308.7, -297.1, 1302.4),
                new THREE.Vector3(337.0, -300.6, 1318.0),
                new THREE.Vector3(363.9, -304.1, 1336.0),
                new THREE.Vector3(387.3, -307.6, 1358.3),
                new THREE.Vector3(407.8, -311.2, 1383.4),
                new THREE.Vector3(428.6, -314.4, 1405.4),
                new THREE.Vector3(454.0, -317.7, 1421.9),
                new THREE.Vector3(484.3, -321.3, 1433.3),
                new THREE.Vector3(510.6, -324.3, 1443.7),
                new THREE.Vector3(533.4, -327.4, 1460.4),
                new THREE.Vector3(552.7, -330.9, 1486.3),
                new THREE.Vector3(569.2, -334.4, 1514.2),
                new THREE.Vector3(587.3, -337.7, 1538.5),
                new THREE.Vector3(606.0, -340.6, 1557.0),
                new THREE.Vector3(627.2, -343.2, 1568.5),
                new THREE.Vector3(655.3, -346.3, 1569.4),
                new THREE.Vector3(684.7, -349.6, 1562.0),
                new THREE.Vector3(712.4, -352.9, 1549.7),
                new THREE.Vector3(737.7, -356.4, 1529.7),
                new THREE.Vector3(761.9, -359.9, 1508.2),
                new THREE.Vector3(788.8, -363.4, 1490.2),
                new THREE.Vector3(814.0, -366.5, 1477.2),
                new THREE.Vector3(837.4, -369.1, 1471.2),
                new THREE.Vector3(865.1, -372.2, 1476.2),
                new THREE.Vector3(895.4, -375.7, 1487.6),
                new THREE.Vector3(920.9, -378.5, 1494.0),
                new THREE.Vector3(937.4, -380.5, 1501.4),
                new THREE.Vector3(946.8, -382.2, 1514.3),
                new THREE.Vector3(946.3, -385.0, 1540.2),
                new THREE.Vector3(938.2, -388.5, 1571.6),
                new THREE.Vector3(931.6, -392.1, 1603.3),
                new THREE.Vector3(922.4, -395.6, 1634.3),
                new THREE.Vector3(915.3, -398.7, 1661.7),
                new THREE.Vector3(917.2, -402.0, 1691.8),
                new THREE.Vector3(926.6, -405.6, 1722.8),
                new THREE.Vector3(934.4, -408.8, 1750.1),
                new THREE.Vector3(945.1, -411.4, 1771.7),
                new THREE.Vector3(964.2, -414.1, 1786.2),
                new THREE.Vector3(989.4, -417.1, 1793.7),
                new THREE.Vector3(1007.4, -419.3, 1802.7),
                new THREE.Vector3(1020.0, -422.0, 1823.1),
                new THREE.Vector3(1026.9, -425.6, 1854.7),
                new THREE.Vector3(1037.5, -429.3, 1885.2),
                new THREE.Vector3(1047.9, -432.7, 1913.7),
                new THREE.Vector3(1051.2, -436.1, 1943.8),
                new THREE.Vector3(1049.9, -439.3, 1972.1),
                new THREE.Vector3(1052.3, -441.8, 1994.1),
                new THREE.Vector3(1060.9, -443.9, 2010.0),
                new THREE.Vector3(1077.6, -446.1, 2021.0),
                new THREE.Vector3(1103.6, -449.1, 2023.1),
                new THREE.Vector3(1131.1, -452.3, 2016.4),
                new THREE.Vector3(1146.6, -454.1, 2011.9),
                new THREE.Vector3(1160.7, -455.7, 2010.3),
                new THREE.Vector3(1169.2, -457.2, 2019.4),
                new THREE.Vector3(1164.0, -458.8, 2032.4),
                new THREE.Vector3(1142.5, -462.4, 2056.5),
                new THREE.Vector3(1120.1, -466.1, 2079.8),
                new THREE.Vector3(1103.2, -469.5, 2105.0),
                new THREE.Vector3(1090.7, -473.2, 2134.8),
                new THREE.Vector3(1080.8, -476.2, 2159.1),
                new THREE.Vector3(1068.3, -478.5, 2174.9),
                new THREE.Vector3(1050.4, -480.7, 2183.9),
                new THREE.Vector3(1028.3, -483.2, 2184.2),
                new THREE.Vector3(1007.9, -485.7, 2175.8),
                new THREE.Vector3(992.3, -488.2, 2160.0),
                new THREE.Vector3(984.4, -490.9, 2137.3),
                new THREE.Vector3(985.2, -494.1, 2109.0),
                new THREE.Vector3(983.8, -497.1, 2082.9),
                new THREE.Vector3(971.7, -500.5, 2055.2),
                new THREE.Vector3(958.0, -503.9, 2028.1),
                new THREE.Vector3(952.0, -507.2, 1998.4),
                new THREE.Vector3(947.7, -510.2, 1972.5),
                new THREE.Vector3(939.3, -512.4, 1954.2),
                new THREE.Vector3(925.5, -514.4, 1942.7),
                new THREE.Vector3(899.7, -517.3, 1939.4),
                new THREE.Vector3(873.6, -520.2, 1941.6),
                new THREE.Vector3(851.9, -522.6, 1937.2),
                new THREE.Vector3(832.8, -525.3, 1922.6),
                new THREE.Vector3(818.0, -528.3, 1898.5),
                new THREE.Vector3(808.6, -531.9, 1867.6),
                new THREE.Vector3(802.0, -535.4, 1835.9),
                new THREE.Vector3(792.7, -538.7, 1807.0),
                new THREE.Vector3(782.6, -541.0, 1787.2),
                new THREE.Vector3(771.8, -542.8, 1775.2),
                new THREE.Vector3(758.9, -544.3, 1769.9),
                new THREE.Vector3(745.3, -545.8, 1773.1),
                new THREE.Vector3(727.1, -548.5, 1791.7),
                new THREE.Vector3(712.1, -551.9, 1820.3),
                new THREE.Vector3(701.2, -554.7, 1844.3),
                new THREE.Vector3(688.9, -556.8, 1860.3),
                new THREE.Vector3(670.9, -558.9, 1869.0),
                new THREE.Vector3(644.8, -561.6, 1868.3),
                new THREE.Vector3(616.1, -564.8, 1858.5),
                new THREE.Vector3(593.3, -567.2, 1850.2),
                new THREE.Vector3(577.3, -568.9, 1848.2),
                new THREE.Vector3(564.2, -570.3, 1852.9),
                new THREE.Vector3(554.8, -572.1, 1868.1),
                new THREE.Vector3(551.1, -574.6, 1892.1),
                new THREE.Vector3(546.6, -576.4, 1909.7),
                new THREE.Vector3(537.8, -577.8, 1920.6),
                new THREE.Vector3(524.6, -579.2, 1925.0),
                new THREE.Vector3(499.7, -581.8, 1917.5),
                new THREE.Vector3(478.7, -584.2, 1905.2),
                new THREE.Vector3(464.1, -585.7, 1898.4),
                new THREE.Vector3(450.2, -587.1, 1898.0),
                new THREE.Vector3(440.8, -588.4, 1908.0),
                new THREE.Vector3(438.2, -590.8, 1931.9),
                new THREE.Vector3(444.8, -593.9, 1963.6),
                new THREE.Vector3(455.0, -597.1, 1994.3),
                new THREE.Vector3(464.6, -600.2, 2025.2),
                new THREE.Vector3(471.6, -602.9, 2052.7),
                new THREE.Vector3(473.9, -604.8, 2072.7),
                new THREE.Vector3(471.2, -606.2, 2086.5),
                new THREE.Vector3(460.9, -607.5, 2095.8),
                new THREE.Vector3(434.9, -610.0, 2098.9),
                new THREE.Vector3(405.5, -612.9, 2105.9),
                new THREE.Vector3(382.7, -615.2, 2114.5),
                new THREE.Vector3(368.8, -616.5, 2116.6),
                new THREE.Vector3(355.4, -617.8, 2112.6),
                new THREE.Vector3(347.3, -619.1, 2101.3),
                new THREE.Vector3(345.8, -621.4, 2077.2),
                new THREE.Vector3(345.4, -623.5, 2055.0),
                new THREE.Vector3(337.5, -625.3, 2036.6),
                new THREE.Vector3(320.0, -627.4, 2023.3),
                new THREE.Vector3(290.5, -630.2, 2016.6),
                new THREE.Vector3(258.4, -633.2, 2012.2),
                new THREE.Vector3(227.8, -636.2, 2001.9),
                new THREE.Vector3(199.7, -639.0, 1990.5),
                new THREE.Vector3(176.5, -641.2, 1983.3),
                new THREE.Vector3(159.7, -643.0, 1972.4),
                new THREE.Vector3(149.1, -645.4, 1948.7),
                new THREE.Vector3(145.8, -648.3, 1916.5),
                new THREE.Vector3(146.2, -651.3, 1884.1),
                new THREE.Vector3(150.6, -654.2, 1852.1),
                new THREE.Vector3(156.6, -656.7, 1824.4),
                new THREE.Vector3(158.8, -658.3, 1806.3),
                new THREE.Vector3(156.4, -659.6, 1792.5),
                new THREE.Vector3(146.2, -660.8, 1783.1),
                new THREE.Vector3(118.2, -663.3, 1780.0),
                new THREE.Vector3(90.2, -665.8, 1776.0),
                new THREE.Vector3(72.1, -667.4, 1773.7),
                new THREE.Vector3(58.6, -668.7, 1777.2),
                new THREE.Vector3(51.2, -669.9, 1788.8),
                new THREE.Vector3(50.8, -672.2, 1815.0),
                new THREE.Vector3(47.9, -674.6, 1843.1),
                new THREE.Vector3(34.4, -677.4, 1872.4),
                new THREE.Vector3(17.5, -680.2, 1900.0),
                new THREE.Vector3(3.9, -682.9, 1927.2),
                new THREE.Vector3(-4.8, -685.6, 1958.3),
                new THREE.Vector3(-10.0, -688.4, 1990.2),
                new THREE.Vector3(-14.3, -690.8, 2018.2),
                new THREE.Vector3(-17.9, -692.2, 2034.0),
                new THREE.Vector3(-24.5, -693.4, 2046.4),
                new THREE.Vector3(-37.2, -694.5, 2049.9),
                new THREE.Vector3(-45.8, -695.6, 2039.0),
                new THREE.Vector3(-50.6, -698.0, 2011.2),
                new THREE.Vector3(-54.3, -700.2, 1985.2),
                new THREE.Vector3(-62.1, -701.9, 1966.6),
                new THREE.Vector3(-71.4, -703.1, 1956.0),
                new THREE.Vector3(-84.3, -704.2, 1950.6),
                new THREE.Vector3(-97.6, -705.4, 1954.7),
                new THREE.Vector3(-116.7, -707.9, 1978.0),
                new THREE.Vector3(-132.9, -710.4, 2003.7),
                new THREE.Vector3(-147.6, -712.2, 2020.3),
                new THREE.Vector3(-163.9, -713.6, 2027.8),
                new THREE.Vector3(-189.7, -715.8, 2024.1),
                new THREE.Vector3(-218.8, -718.4, 2009.9),
                new THREE.Vector3(-246.7, -721.0, 1993.5),
                new THREE.Vector3(-275.4, -723.6, 1978.5),
                new THREE.Vector3(-305.8, -726.2, 1967.4),
                new THREE.Vector3(-337.3, -728.7, 1959.9),
                new THREE.Vector3(-352.8, -730.0, 1955.5)
            ];
        } else {
            // ★本物完全再現：秋名山（榛名山 県道33号線 - 全長7,552m / 頭文字DAC公式完全同期）
            // 原作画像レイアウト完全準拠・全カーブ完全滑らか補正（上り/下り完全両立）
            this.roadWidth = 10.8;
            this.gutterWidth = 1.15;
            const akinaBasePoints = [
                new THREE.Vector3(0.0, -0.0, 0.0),
                new THREE.Vector3(-20.2, -0.9, -29.0),
                new THREE.Vector3(-32.6, -1.9, -64.7),
                new THREE.Vector3(-42.9, -3.0, -98.9),
                new THREE.Vector3(-53.4, -4.1, -124.6),
                new THREE.Vector3(-68.3, -5.2, -137.2),
                new THREE.Vector3(-85.8, -6.3, -138.7),
                new THREE.Vector3(-106.9, -7.5, -121.8),
                new THREE.Vector3(-122.1, -8.7, -87.3),
                new THREE.Vector3(-135.1, -9.9, -54.0),
                new THREE.Vector3(-140.3, -11.1, -18.7),
                new THREE.Vector3(-145.1, -12.3, 8.7),
                new THREE.Vector3(-158.6, -13.6, 27.8),
                new THREE.Vector3(-180.8, -14.8, 35.2),
                new THREE.Vector3(-205.7, -16.1, 29.7),
                new THREE.Vector3(-228.3, -17.3, 2.4),
                new THREE.Vector3(-246.7, -18.6, -30.5),
                new THREE.Vector3(-265.6, -19.9, -58.3),
                new THREE.Vector3(-287.9, -21.2, -78.0),
                new THREE.Vector3(-316.2, -22.5, -86.3),
                new THREE.Vector3(-348.7, -23.8, -78.3),
                new THREE.Vector3(-378.4, -25.1, -58.4),
                new THREE.Vector3(-405.0, -26.4, -45.4),
                new THREE.Vector3(-432.5, -27.8, -46.4),
                new THREE.Vector3(-456.5, -29.1, -59.9),
                new THREE.Vector3(-472.5, -30.4, -89.2),
                new THREE.Vector3(-478.2, -31.8, -124.4),
                new THREE.Vector3(-474.4, -33.1, -157.8),
                new THREE.Vector3(-460.7, -34.5, -188.5),
                new THREE.Vector3(-440.1, -35.8, -212.7),
                new THREE.Vector3(-428.5, -37.2, -237.5),
                new THREE.Vector3(-431.0, -38.6, -264.9),
                new THREE.Vector3(-446.9, -39.9, -287.3),
                new THREE.Vector3(-479.8, -41.3, -300.9),
                new THREE.Vector3(-516.6, -42.7, -309.3),
                new THREE.Vector3(-553.6, -44.1, -316.7),
                new THREE.Vector3(-590.7, -45.4, -323.4),
                new THREE.Vector3(-627.9, -46.8, -330.1),
                new THREE.Vector3(-664.9, -48.2, -337.5),
                new THREE.Vector3(-700.0, -49.6, -344.3),
                new THREE.Vector3(-735.5, -51.0, -347.8),
                new THREE.Vector3(-773.1, -52.4, -350.7),
                new THREE.Vector3(-810.8, -53.8, -350.8),
                new THREE.Vector3(-836.6, -55.3, -352.7),
                new THREE.Vector3(-851.7, -56.7, -348.4),
                new THREE.Vector3(-860.4, -58.1, -337.9),
                new THREE.Vector3(-861.4, -59.5, -324.3),
                new THREE.Vector3(-842.1, -60.9, -305.4),
                new THREE.Vector3(-806.4, -62.4, -293.3),
                new THREE.Vector3(-771.5, -63.8, -285.9),
                new THREE.Vector3(-735.9, -65.2, -282.8),
                new THREE.Vector3(-704.1, -66.7, -282.0),
                new THREE.Vector3(-682.7, -68.1, -278.4),
                new THREE.Vector3(-670.8, -69.5, -268.3),
                new THREE.Vector3(-667.0, -71.0, -251.2),
                new THREE.Vector3(-685.3, -72.4, -223.8),
                new THREE.Vector3(-713.9, -73.9, -199.1),
                new THREE.Vector3(-737.3, -75.3, -169.6),
                new THREE.Vector3(-755.6, -76.8, -136.6),
                new THREE.Vector3(-768.6, -78.3, -107.6),
                new THREE.Vector3(-779.8, -79.7, -91.3),
                new THREE.Vector3(-791.9, -81.2, -84.9),
                new THREE.Vector3(-805.4, -82.6, -86.9),
                new THREE.Vector3(-817.2, -84.1, -108.6),
                new THREE.Vector3(-817.6, -85.6, -138.4),
                new THREE.Vector3(-818.4, -87.0, -154.3),
                new THREE.Vector3(-825.8, -88.5, -165.4),
                new THREE.Vector3(-839.2, -90.0, -164.8),
                new THREE.Vector3(-857.0, -93.1, -136.8),
                new THREE.Vector3(-872.1, -95.9, -102.3),
                new THREE.Vector3(-882.6, -98.7, -70.2),
                new THREE.Vector3(-882.2, -101.4, -34.9),
                new THREE.Vector3(-871.7, -104.1, 1.3),
                new THREE.Vector3(-862.9, -106.8, 27.7),
                new THREE.Vector3(-861.6, -109.4, 43.4),
                new THREE.Vector3(-867.3, -112.1, 55.7),
                new THREE.Vector3(-880.4, -114.7, 57.8),
                new THREE.Vector3(-897.8, -117.3, 39.7),
                new THREE.Vector3(-907.0, -119.9, 15.5),
                new THREE.Vector3(-915.1, -122.4, 2.0),
                new THREE.Vector3(-926.9, -125.0, -4.7),
                new THREE.Vector3(-938.0, -127.6, 2.2),
                new THREE.Vector3(-939.6, -130.1, 33.5),
                new THREE.Vector3(-936.8, -132.6, 59.2),
                new THREE.Vector3(-938.3, -135.2, 73.0),
                new THREE.Vector3(-948.0, -137.7, 81.8),
                new THREE.Vector3(-961.1, -140.2, 78.6),
                new THREE.Vector3(-970.9, -142.7, 55.3),
                new THREE.Vector3(-973.2, -145.2, 35.6),
                new THREE.Vector3(-978.4, -147.7, 23.0),
                new THREE.Vector3(-991.2, -150.2, 19.7),
                new THREE.Vector3(-1001.6, -152.7, 28.5),
                new THREE.Vector3(-1002.2, -155.2, 61.7),
                new THREE.Vector3(-1001.7, -157.6, 99.4),
                new THREE.Vector3(-999.8, -160.1, 135.1),
                new THREE.Vector3(-998.0, -162.6, 170.7),
                new THREE.Vector3(-993.2, -165.0, 204.0),
                new THREE.Vector3(-977.8, -167.5, 233.8),
                new THREE.Vector3(-952.5, -169.9, 255.8),
                new THREE.Vector3(-921.2, -172.4, 268.0),
                new THREE.Vector3(-885.7, -174.8, 272.4),
                new THREE.Vector3(-850.1, -177.3, 275.9),
                new THREE.Vector3(-823.0, -179.7, 281.4),
                new THREE.Vector3(-803.2, -182.1, 297.6),
                new THREE.Vector3(-795.9, -184.6, 331.8),
                new THREE.Vector3(-795.8, -187.0, 367.6),
                new THREE.Vector3(-790.4, -189.4, 394.5),
                new THREE.Vector3(-768.8, -191.8, 417.5),
                new THREE.Vector3(-735.9, -194.2, 430.7),
                new THREE.Vector3(-699.9, -196.7, 442.2),
                new THREE.Vector3(-667.5, -199.1, 457.2),
                new THREE.Vector3(-638.7, -201.5, 478.2),
                new THREE.Vector3(-621.2, -203.9, 497.1),
                new THREE.Vector3(-614.9, -206.3, 509.4),
                new THREE.Vector3(-616.3, -208.7, 522.8),
                new THREE.Vector3(-628.1, -211.1, 529.3),
                new THREE.Vector3(-660.3, -213.5, 521.2),
                new THREE.Vector3(-692.0, -215.9, 504.6),
                new THREE.Vector3(-728.6, -218.3, 496.0),
                new THREE.Vector3(-761.3, -220.6, 487.9),
                new THREE.Vector3(-793.8, -223.0, 468.7),
                new THREE.Vector3(-822.7, -225.4, 455.9),
                new THREE.Vector3(-858.2, -227.8, 456.8),
                new THREE.Vector3(-895.0, -230.2, 465.1),
                new THREE.Vector3(-930.0, -232.6, 472.2),
                new THREE.Vector3(-965.7, -234.9, 472.8),
                new THREE.Vector3(-1002.6, -237.3, 465.4),
                new THREE.Vector3(-1037.1, -239.7, 456.1),
                new THREE.Vector3(-1074.6, -242.0, 451.3),
                new THREE.Vector3(-1112.3, -244.4, 450.7),
                new THREE.Vector3(-1147.9, -246.7, 453.2),
                new THREE.Vector3(-1184.2, -248.9, 463.1),
                new THREE.Vector3(-1219.8, -251.1, 475.8),
                new THREE.Vector3(-1254.2, -253.4, 485.4),
                new THREE.Vector3(-1289.8, -255.6, 487.8),
                new THREE.Vector3(-1324.1, -257.8, 497.7),
                new THREE.Vector3(-1352.7, -260.1, 515.5),
                new THREE.Vector3(-1373.4, -262.3, 541.9),
                new THREE.Vector3(-1385.7, -264.5, 575.4),
                new THREE.Vector3(-1388.0, -266.8, 611.0),
                new THREE.Vector3(-1386.9, -269.0, 632.8),
                new THREE.Vector3(-1381.1, -271.2, 645.3),
                new THREE.Vector3(-1368.9, -273.5, 650.7),
                new THREE.Vector3(-1357.0, -275.7, 644.3),
                new THREE.Vector3(-1343.5, -277.9, 609.4),
                new THREE.Vector3(-1333.5, -280.2, 577.1),
                new THREE.Vector3(-1317.4, -282.4, 554.8),
                new THREE.Vector3(-1292.7, -284.6, 542.6),
                new THREE.Vector3(-1263.3, -286.9, 544.5),
                new THREE.Vector3(-1235.5, -289.1, 563.2),
                new THREE.Vector3(-1208.1, -291.3, 578.6),
                new THREE.Vector3(-1172.5, -293.5, 580.2),
                new THREE.Vector3(-1137.9, -295.8, 572.0),
                new THREE.Vector3(-1106.1, -298.0, 560.8),
                new THREE.Vector3(-1074.5, -300.2, 561.4),
                new THREE.Vector3(-1039.9, -302.5, 576.3),
                new THREE.Vector3(-1010.8, -304.7, 588.8),
                new THREE.Vector3(-979.5, -306.9, 588.1),
                new THREE.Vector3(-947.3, -309.2, 572.8),
                new THREE.Vector3(-921.9, -311.4, 561.6),
                new THREE.Vector3(-900.4, -313.6, 560.3),
                new THREE.Vector3(-881.6, -315.9, 576.9),
                new THREE.Vector3(-870.2, -318.1, 604.3),
                new THREE.Vector3(-845.6, -320.3, 627.0),
                new THREE.Vector3(-822.5, -322.6, 642.4),
                new THREE.Vector3(-811.4, -324.8, 660.7),
                new THREE.Vector3(-816.7, -327.0, 687.5),
                new THREE.Vector3(-837.8, -329.3, 710.9),
                new THREE.Vector3(-870.5, -331.5, 724.6),
                new THREE.Vector3(-907.5, -333.7, 731.8),
                new THREE.Vector3(-944.6, -336.0, 738.8),
                new THREE.Vector3(-981.6, -338.2, 746.1),
                new THREE.Vector3(-1018.6, -340.4, 753.8),
                new THREE.Vector3(-1053.0, -342.7, 763.2),
                new THREE.Vector3(-1081.4, -344.9, 781.2),
                new THREE.Vector3(-1106.0, -347.1, 807.2),
                new THREE.Vector3(-1136.1, -349.4, 829.9),
                new THREE.Vector3(-1167.3, -351.6, 851.2),
                new THREE.Vector3(-1199.6, -353.8, 870.7),
                new THREE.Vector3(-1232.4, -356.0, 889.5),
                new THREE.Vector3(-1264.8, -358.3, 908.8),
                new THREE.Vector3(-1292.7, -360.5, 927.8),
                new THREE.Vector3(-1312.9, -362.7, 959.4),
                new THREE.Vector3(-1328.9, -365.0, 991.4),
                new THREE.Vector3(-1337.7, -367.2, 1006.9),
                new THREE.Vector3(-1348.6, -369.4, 1015.0),
                new THREE.Vector3(-1361.5, -371.7, 1011.4),
                new THREE.Vector3(-1366.4, -373.9, 998.9),
                new THREE.Vector3(-1352.5, -376.1, 966.2),
                new THREE.Vector3(-1338.7, -378.3, 931.1),
                new THREE.Vector3(-1331.5, -380.5, 906.3),
                new THREE.Vector3(-1332.0, -382.7, 892.6),
                new THREE.Vector3(-1340.4, -384.9, 881.9),
                new THREE.Vector3(-1353.7, -387.0, 880.9),
                new THREE.Vector3(-1371.2, -389.2, 908.6),
                new THREE.Vector3(-1386.6, -391.3, 943.0),
                new THREE.Vector3(-1406.2, -393.5, 975.3),
                new THREE.Vector3(-1430.0, -395.6, 1004.5),
                new THREE.Vector3(-1455.5, -397.8, 1032.3),
                new THREE.Vector3(-1482.0, -399.9, 1053.2),
                new THREE.Vector3(-1497.9, -402.0, 1070.6),
                new THREE.Vector3(-1496.4, -404.1, 1103.5),
                new THREE.Vector3(-1486.0, -406.2, 1139.8),
                new THREE.Vector3(-1478.6, -408.3, 1176.8),
                new THREE.Vector3(-1474.6, -410.4, 1212.3),
                new THREE.Vector3(-1469.7, -412.5, 1243.4),
                new THREE.Vector3(-1448.1, -414.5, 1274.3),
                new THREE.Vector3(-1429.3, -416.6, 1299.8),
                new THREE.Vector3(-1424.1, -418.6, 1336.8),
                new THREE.Vector3(-1424.1, -420.7, 1366.6),
                new THREE.Vector3(-1425.2, -422.7, 1382.4),
                new THREE.Vector3(-1433.2, -424.7, 1393.2),
                new THREE.Vector3(-1446.5, -426.7, 1392.3),
                new THREE.Vector3(-1462.0, -428.7, 1372.3),
                new THREE.Vector3(-1467.7, -430.7, 1345.2),
                new THREE.Vector3(-1474.8, -432.6, 1325.0),
                new THREE.Vector3(-1503.8, -434.6, 1313.3),
                new THREE.Vector3(-1537.0, -436.6, 1295.8),
                new THREE.Vector3(-1567.3, -438.5, 1273.2),
                new THREE.Vector3(-1596.2, -440.4, 1249.0),
                new THREE.Vector3(-1623.3, -442.3, 1222.7),
                new THREE.Vector3(-1648.1, -444.2, 1197.0),
                new THREE.Vector3(-1662.8, -446.1, 1171.4),
                new THREE.Vector3(-1663.8, -448.0, 1138.0),
                new THREE.Vector3(-1652.3, -449.9, 1104.2),
                new THREE.Vector3(-1641.6, -451.7, 1082.9),
                new THREE.Vector3(-1638.5, -453.5, 1069.5),
                new THREE.Vector3(-1644.3, -455.3, 1057.3),
                new THREE.Vector3(-1657.1, -457.1, 1053.2),
                new THREE.Vector3(-1676.1, -458.9, 1069.3),
                new THREE.Vector3(-1690.5, -460.7, 1104.1),
                new THREE.Vector3(-1707.1, -462.4, 1138.0),
                new THREE.Vector3(-1719.2, -464.2, 1167.4),
                new THREE.Vector3(-1718.4, -465.9, 1196.7),
                new THREE.Vector3(-1701.0, -467.6, 1227.7),
                new THREE.Vector3(-1677.2, -469.3, 1257.0),
                new THREE.Vector3(-1651.5, -470.9, 1284.7),
                new THREE.Vector3(-1624.4, -472.5, 1311.0),
                new THREE.Vector3(-1595.7, -474.1, 1335.5),
                new THREE.Vector3(-1566.0, -475.7, 1358.7),
                new THREE.Vector3(-1544.5, -477.2, 1379.3),
                new THREE.Vector3(-1534.2, -478.8, 1404.8),
                new THREE.Vector3(-1539.4, -480.2, 1435.7),
                new THREE.Vector3(-1559.2, -481.7, 1467.9),
                new THREE.Vector3(-1579.2, -483.1, 1499.9),
                new THREE.Vector3(-1598.4, -484.4, 1532.4),
                new THREE.Vector3(-1613.5, -485.8, 1567.0),
                new THREE.Vector3(-1625.8, -487.0, 1602.6),
                new THREE.Vector3(-1635.0, -488.2, 1639.2),
                new THREE.Vector3(-1642.4, -489.2, 1676.3),
                new THREE.Vector3(-1649.5, -490.0, 1705.1)
            ];
            if (courseType === 'akina_uphill') {
                points = this.buildAkinaUphillPoints(akinaBasePoints);
            } else {
                points = akinaBasePoints;
            }
        }

        this.curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
        this.trackLength = this.curve.getLength();

        this.samples = [];
        for (let i = 0; i <= this.sampleCount; i++) {
            const t = i / this.sampleCount;
            const pos = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t).normalize();
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            let curvature = 0;
            let turnDir = 0;
            const windowSize = 8;
            if (i >= windowSize && i <= this.sampleCount - windowSize) {
                const prevTan = this.curve.getTangentAt((i - windowSize) / this.sampleCount).normalize();
                const nextTan = this.curve.getTangentAt((i + windowSize) / this.sampleCount).normalize();
                const angle = prevTan.angleTo(nextTan);
                curvature = angle / (windowSize * 2 * (this.trackLength / this.sampleCount));
                const crossY = prevTan.x * nextTan.z - prevTan.z * nextTan.x;
                if (curvature > 0.0018) {
                    turnDir = crossY > 0 ? 1 : -1;
                }
            } else if (i > 0 && i < this.sampleCount) {
                const prevTan = this.curve.getTangentAt((i - 1) / this.sampleCount).normalize();
                const nextTan = this.curve.getTangentAt((i + 1) / this.sampleCount).normalize();
                const angle = prevTan.angleTo(nextTan);
                curvature = angle / (2 * (this.trackLength / this.sampleCount));
                const crossY = prevTan.x * nextTan.z - prevTan.z * nextTan.x;
                if (curvature > 0.0018) {
                    turnDir = crossY > 0 ? 1 : -1;
                }
            }

            // 道路の横傾斜（バンク角）：全ステージ完全水平（カーブでの道の傾きを解消）
            const bankAngle = 0;

            // 溝落とし可能区間（妙義は全域ガードレールの高速バトルのため側溝なし）
            const hasGutter = (courseType === 'myogi') ? false :
                              (courseType === 'akina') ? ((t >= 0.270 && t <= 0.355) || (t >= 0.54 && t <= 0.58) || (t >= 0.72 && t <= 0.88)) :
                              (courseType === 'akina_uphill') ? (((1 - t) >= 0.270 && (1 - t) <= 0.355) || ((1 - t) >= 0.54 && (1 - t) <= 0.58) || ((1 - t) >= 0.72 && (1 - t) <= 0.88)) :
                              (courseType === 'irohazaka') ? (t >= 0.38 && t <= 0.82) :
                              (courseType === 'tsubaki') ? ((t >= 0.18 && t <= 0.35) || (t >= 0.58 && t <= 0.96)) :
                              (courseType === 'usui') ? (t >= 0.20 && t <= 0.85) :
                              (courseType === 'akagi') ? (t >= 0.35 && t <= 0.68) :
                              (courseType === 'happo') ? (t >= 0.28 && t <= 0.72) : false;

            this.samples.push({
                t,
                pos,
                tangent,
                normal,
                curvature,
                turnDir,
                bankAngle,
                hasGutter
            });
        }

        this.buildTrackMesh();
        this.buildDecorations();
    }

    buildTrackMesh() {
        const segments = 2400;
        const halfW = this.roadWidth / 2;

        const roadPositions = [];
        const roadNormals = [];
        const roadUvs = [];
        const roadIndices = [];

        const leftRailPositions = [];
        const rightRailPositions = [];
        const leftRailIndices = [];
        const rightRailIndices = [];

        const gutterPositions = [];
        const gutterNormals = [];
        const gutterUvs = [];
        const gutterIndices = [];

        const hasGutterCourse = (this.courseType !== 'myogi');
        const gutterW = 0.65;
        const railOffset = halfW + (hasGutterCourse ? gutterW : 0.0);

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const pos = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t).normalize();
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            const sampleIdx = Math.min(this.sampleCount, Math.floor(t * this.sampleCount));
            // 道路断面を完全水平に配置（カーブでの道の横傾きを解消）
            const pLeft = pos.clone().add(normal.clone().multiplyScalar(-halfW));
            const pRight = pos.clone().add(normal.clone().multiplyScalar(halfW));

            roadPositions.push(pLeft.x, pLeft.y, pLeft.z);
            roadPositions.push(pRight.x, pRight.y, pRight.z);

            // 路面法線（真上基準）
            const rNorm = new THREE.Vector3(0, 1, 0);
            roadNormals.push(rNorm.x, rNorm.y, rNorm.z, rNorm.x, rNorm.y, rNorm.z);
            roadUvs.push(0, t * 140, 1, t * 140);

            if (i < segments) {
                const base = i * 2;
                roadIndices.push(base, base + 1, base + 2);
                roadIndices.push(base + 1, base + 3, base + 2);
            }

            // 2. ★ガードレール配置（立体側溝の外側 railOffset = halfW + gutterW に配置！）
            const pLeftRail = pos.clone().add(normal.clone().multiplyScalar(-railOffset));
            const pRightRail = pos.clone().add(normal.clone().multiplyScalar(railOffset));

            const wH = [0.12, 0.32, 0.48, 0.64, 0.82];
            const wD = [0.0, 0.055, 0.0, 0.055, 0.0];

            for (let k = 0; k < 5; k++) {
                // 左ガードレール
                const pL = pLeftRail.clone().add(normal.clone().multiplyScalar(wD[k]));
                pL.y += wH[k];
                leftRailPositions.push(pL.x, pL.y, pL.z);

                // 右ガードレール
                const pR = pRightRail.clone().add(normal.clone().multiplyScalar(-wD[k]));
                pR.y += wH[k];
                rightRailPositions.push(pR.x, pR.y, pR.z);
            }

            if (i < segments) {
                const rRow1 = i * 5;
                const rRow2 = (i + 1) * 5;
                for (let k = 0; k < 4; k++) {
                    const a = rRow1 + k, b = rRow1 + k + 1, c = rRow2 + k, d = rRow2 + k + 1;
                    leftRailIndices.push(a, b, c);
                    leftRailIndices.push(b, d, c);
                    rightRailIndices.push(a, c, b);
                    rightRailIndices.push(b, c, d);
                }
            }

            // 3. ★本物完全再現：立体コンクリートU字側溝（U-Shaped Gutter & Curb）
            // 道路端（halfW）とガードレール（railOffset）の間に、深さ22cmの本格U字溝を彫り込み！
            if (hasGutterCourse) {
                const uvV = t * 180;
                const vY = pos.y;

                // --- 左側溝 (Left Gutter: -normal 方向) ---
                const gL0 = pLeft.clone();
                gL0.y = vY + 0.015; // 道路端・縁石内側天面
                const gL1 = pLeft.clone().add(normal.clone().multiplyScalar(-0.05));
                gL1.y = vY + 0.015; // 溝内壁天面
                const gL2 = pLeft.clone().add(normal.clone().multiplyScalar(-0.07));
                gL2.y = vY - 0.22;  // 溝底面内側（垂直落下）
                const gL3 = pLeft.clone().add(normal.clone().multiplyScalar(-(gutterW - 0.07)));
                gL3.y = vY - 0.22;  // 溝底面外側（底面幅約44cm）
                const gL4 = pLeft.clone().add(normal.clone().multiplyScalar(-(gutterW - 0.05)));
                gL4.y = vY + 0.02;  // 溝外壁天面（垂直立ち上がり）
                const gL5 = pLeftRail.clone();
                gL5.y = vY + 0.02;  // ガードレール足元基礎天面

                gutterPositions.push(
                    gL0.x, gL0.y, gL0.z,
                    gL1.x, gL1.y, gL1.z,
                    gL2.x, gL2.y, gL2.z,
                    gL3.x, gL3.y, gL3.z,
                    gL4.x, gL4.y, gL4.z,
                    gL5.x, gL5.y, gL5.z
                );
                gutterNormals.push(
                    0, 1, 0,
                    0, 1, 0,
                    -normal.x, 0, -normal.z,
                    0, 1, 0,
                    normal.x, 0, normal.z,
                    0, 1, 0
                );
                gutterUvs.push(
                    0.0, uvV,
                    0.15, uvV,
                    0.30, uvV,
                    0.70, uvV,
                    0.85, uvV,
                    1.0, uvV
                );

                // --- 右側溝 (Right Gutter: +normal 方向) ---
                const gR0 = pRight.clone();
                gR0.y = vY + 0.015;
                const gR1 = pRight.clone().add(normal.clone().multiplyScalar(0.05));
                gR1.y = vY + 0.015;
                const gR2 = pRight.clone().add(normal.clone().multiplyScalar(0.07));
                gR2.y = vY - 0.22;
                const gR3 = pRight.clone().add(normal.clone().multiplyScalar(gutterW - 0.07));
                gR3.y = vY - 0.22;
                const gR4 = pRight.clone().add(normal.clone().multiplyScalar(gutterW - 0.05));
                gR4.y = vY + 0.02;
                const gR5 = pRightRail.clone();
                gR5.y = vY + 0.02;

                gutterPositions.push(
                    gR0.x, gR0.y, gR0.z,
                    gR1.x, gR1.y, gR1.z,
                    gR2.x, gR2.y, gR2.z,
                    gR3.x, gR3.y, gR3.z,
                    gR4.x, gR4.y, gR4.z,
                    gR5.x, gR5.y, gR5.z
                );
                gutterNormals.push(
                    0, 1, 0,
                    0, 1, 0,
                    normal.x, 0, normal.z,
                    0, 1, 0,
                    -normal.x, 0, -normal.z,
                    0, 1, 0
                );
                gutterUvs.push(
                    0.0, uvV,
                    0.15, uvV,
                    0.30, uvV,
                    0.70, uvV,
                    0.85, uvV,
                    1.0, uvV
                );

                if (i < segments) {
                    const row1 = i * 12;
                    const row2 = (i + 1) * 12;

                    // 左側溝 5クアッド
                    for (let q = 0; q < 5; q++) {
                        const a = row1 + q, b = row1 + q + 1;
                        const c = row2 + q, d = row2 + q + 1;
                        gutterIndices.push(a, b, c);
                        gutterIndices.push(b, d, c);
                    }

                    // 右側溝 5クアッド (インデックス反転で法線上向き)
                    for (let q = 0; q < 5; q++) {
                        const a = row1 + 6 + q, b = row1 + 6 + q + 1;
                        const c = row2 + 6 + q, d = row2 + 6 + q + 1;
                        gutterIndices.push(a, c, b);
                        gutterIndices.push(b, c, d);
                    }
                }
            }
        }

        const roadGeom = new THREE.BufferGeometry();
        roadGeom.setAttribute('position', new THREE.Float32BufferAttribute(roadPositions, 3));
        roadGeom.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
        roadGeom.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
        roadGeom.setIndex(roadIndices);
        roadGeom.computeVertexNormals();

        const roadTexture = this.generateRoadTexture();
        roadTexture.wrapS = THREE.RepeatWrapping;
        roadTexture.wrapT = THREE.RepeatWrapping;

        this.roadMat = new THREE.MeshStandardMaterial({
            map: roadTexture,
            roughness: 0.85,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        const roadMesh = new THREE.Mesh(roadGeom, this.roadMat);
        roadMesh.receiveShadow = true;
        this.trackGroup.add(roadMesh);

        // ガードレールメッシュ
        const railMat = new THREE.MeshStandardMaterial({
            color: 0xd0d0d0,
            roughness: 0.35,
            metalness: 0.85,
            side: THREE.DoubleSide
        });

        const leftRailGeom = new THREE.BufferGeometry();
        leftRailGeom.setAttribute('position', new THREE.Float32BufferAttribute(leftRailPositions, 3));
        leftRailGeom.setIndex(leftRailIndices);
        leftRailGeom.computeVertexNormals();
        this.trackGroup.add(new THREE.Mesh(leftRailGeom, railMat));

        const rightRailGeom = new THREE.BufferGeometry();
        rightRailGeom.setAttribute('position', new THREE.Float32BufferAttribute(rightRailPositions, 3));
        rightRailGeom.setIndex(rightRailIndices);
        rightRailGeom.computeVertexNormals();
        this.trackGroup.add(new THREE.Mesh(rightRailGeom, railMat));

        // 立体コンクリート側溝メッシュ
        if (hasGutterCourse && gutterPositions.length > 0) {
            const gutterGeom = new THREE.BufferGeometry();
            gutterGeom.setAttribute('position', new THREE.Float32BufferAttribute(gutterPositions, 3));
            gutterGeom.setAttribute('normal', new THREE.Float32BufferAttribute(gutterNormals, 3));
            gutterGeom.setAttribute('uv', new THREE.Float32BufferAttribute(gutterUvs, 2));
            gutterGeom.setIndex(gutterIndices);

            const gutterTexture = this.generateGutterTexture();
            const gutterMat = new THREE.MeshStandardMaterial({
                map: gutterTexture,
                roughness: 0.92,
                metalness: 0.05,
                side: THREE.DoubleSide
            });
            const gutterMesh = new THREE.Mesh(gutterGeom, gutterMat);
            gutterMesh.receiveShadow = true;
            this.trackGroup.add(gutterMesh);
        }

        // ガードレール支柱＆リフレクター、落石防止ネット
        this.buildGuardrailDecorations();
        this.buildRockfallFences();

        // ★コーナー事前配置リアルドリフト痕（アウト・イン・アウト、テールスライドブラックマーク）
        this.buildPermanentDriftMarks();

        this.buildTerrain();
    }

    /**
     * ★立体コンクリートU字側溝テクスチャ生成
     * セメント骨材、型枠目地、溝底面の湿り気・黒ずみ・堆積ダストをプロシージャル描画
     */
    generateGutterTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 1. ベースコンクリート（明るめのセメントグレー）
        ctx.fillStyle = '#a2a4a8';
        ctx.fillRect(0, 0, 512, 512);

        // 粗粒度セメント粒子ノイズ (25,000点)
        for (let i = 0; i < 25000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const c = Math.floor(Math.random() * 45) + 130;
            ctx.fillStyle = `rgb(${c},${c + 2},${c + 4})`;
            ctx.fillRect(x, y, 2, 2);
        }

        // 2. コンクリート型枠目地ライン（横方向・等間隔スリット）
        ctx.strokeStyle = '#4a4c50';
        ctx.lineWidth = 3;
        for (let y = 0; y < 512; y += 128) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }

        // 3. 溝底面（中央ゾーン U=0.3〜0.7）の湿り気・黒ずみ・堆積ダスト
        const bottomGrad = ctx.createLinearGradient(0, 0, 512, 0);
        bottomGrad.addColorStop(0.0, 'rgba(70,72,76, 0.0)');
        bottomGrad.addColorStop(0.24, 'rgba(50,48,42, 0.20)');
        bottomGrad.addColorStop(0.33, 'rgba(38,34,28, 0.65)');
        bottomGrad.addColorStop(0.50, 'rgba(30,26,20, 0.75)');
        bottomGrad.addColorStop(0.67, 'rgba(38,34,28, 0.65)');
        bottomGrad.addColorStop(0.76, 'rgba(50,48,42, 0.20)');
        bottomGrad.addColorStop(1.0, 'rgba(70,72,76, 0.0)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(0, 0, 512, 512);

        // 溝底面に溜まる雨水ジミ・泥シミ・小石斑点 (2,000点)
        for (let i = 0; i < 2000; i++) {
            const x = 160 + Math.random() * 192;
            const y = Math.random() * 512;
            const c = Math.floor(Math.random() * 40) + 25;
            ctx.fillStyle = `rgba(${c + 20},${c + 15},${c}, 0.80)`;
            ctx.beginPath();
            ctx.arc(x, y, 1.2 + Math.random() * 2.8, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    generateRoadTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        // =========================================================================
        // 1. ベースアスファルト（経年劣化と山岳ウェザリングの風合い）
        // =========================================================================
        ctx.fillStyle = '#222528';
        ctx.fillRect(0, 0, 1024, 1024);

        // 粗粒度骨材・アスファルト粒子ノイズ (50,000点)
        for (let i = 0; i < 50000; i++) {
            const x = Math.random() * 1024;
            const y = Math.random() * 1024;
            const c = Math.floor(Math.random() * 28) + 24;
            ctx.fillStyle = `rgb(${c},${c + 2},${c + 3})`;
            ctx.fillRect(x, y, 2, 2);
        }

        // =========================================================================
        // 2. 走行レーン（レコードライン）の自然な微細摩耗
        // =========================================================================
        // 左レーン レコードライン (X=140〜420)
        const gradL = ctx.createLinearGradient(140, 0, 420, 0);
        gradL.addColorStop(0, 'rgba(12, 14, 16, 0)');
        gradL.addColorStop(0.25, 'rgba(12, 14, 16, 0.14)');
        gradL.addColorStop(0.75, 'rgba(12, 14, 16, 0.14)');
        gradL.addColorStop(1, 'rgba(12, 14, 16, 0)');
        ctx.fillStyle = gradL;
        ctx.fillRect(140, 0, 280, 1024);

        // 右レーン レコードライン (X=604〜884)
        const gradR = ctx.createLinearGradient(604, 0, 884, 0);
        gradR.addColorStop(0, 'rgba(12, 14, 16, 0)');
        gradR.addColorStop(0.25, 'rgba(12, 14, 16, 0.14)');
        gradR.addColorStop(0.75, 'rgba(12, 14, 16, 0.14)');
        gradR.addColorStop(1, 'rgba(12, 14, 16, 0)');
        ctx.fillStyle = gradR;
        ctx.fillRect(604, 0, 280, 1024);

        // =========================================================================
        // 3. ★峠道あるある：車道中央・路肩寄りの「砂埃・土汚れ・堆積ダスト層」
        // 車があまり通らないゾーン（白線内側〜車線端、センターライン両脇）に山風で積もる茶色の土埃
        // =========================================================================
        // 左路肩寄り土埃ゾーン (X=85〜200)
        const dustLeft = ctx.createLinearGradient(85, 0, 200, 0);
        dustLeft.addColorStop(0, 'rgba(74, 56, 38, 0.50)');
        dustLeft.addColorStop(0.5, 'rgba(64, 48, 32, 0.28)');
        dustLeft.addColorStop(1, 'rgba(64, 48, 32, 0.0)');
        ctx.fillStyle = dustLeft;
        ctx.fillRect(85, 0, 115, 1024);

        // センターライン左側土埃 (X=380〜504)
        const dustCenterL = ctx.createLinearGradient(380, 0, 504, 0);
        dustCenterL.addColorStop(0, 'rgba(64, 48, 32, 0.0)');
        dustCenterL.addColorStop(0.6, 'rgba(68, 52, 36, 0.25)');
        dustCenterL.addColorStop(1, 'rgba(74, 56, 38, 0.42)');
        ctx.fillStyle = dustCenterL;
        ctx.fillRect(380, 0, 124, 1024);

        // センターライン右側土埃 (X=520〜644)
        const dustCenterR = ctx.createLinearGradient(520, 0, 644, 0);
        dustCenterR.addColorStop(0, 'rgba(74, 56, 38, 0.42)');
        dustCenterR.addColorStop(0.4, 'rgba(68, 52, 36, 0.25)');
        dustCenterR.addColorStop(1, 'rgba(64, 48, 32, 0.0)');
        ctx.fillStyle = dustCenterR;
        ctx.fillRect(520, 0, 124, 1024);

        // 右路肩寄り土埃ゾーン (X=824〜939)
        const dustRight = ctx.createLinearGradient(824, 0, 939, 0);
        dustRight.addColorStop(0, 'rgba(64, 48, 32, 0.0)');
        dustRight.addColorStop(0.5, 'rgba(64, 48, 32, 0.28)');
        dustRight.addColorStop(1, 'rgba(74, 56, 38, 0.50)');
        ctx.fillStyle = dustRight;
        ctx.fillRect(824, 0, 115, 1024);

        // 雨水や風で路面に流れ込んだ不規則な土砂のシミ（Mud Stains & Streaks）
        for (let i = 0; i < 28; i++) {
            const sx = (i % 2 === 0) ? 75 + Math.random() * 80 : 860 + Math.random() * 80;
            const sy = Math.random() * 1024;
            const sw = 30 + Math.random() * 55;
            const sh = 12 + Math.random() * 35;
            ctx.fillStyle = `rgba(${58 + Math.random() * 18}, ${42 + Math.random() * 14}, ${28 + Math.random() * 10}, ${0.12 + Math.random() * 0.18})`;
            ctx.beginPath();
            ctx.ellipse(sx, sy, sw, sh, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // =========================================================================
        // 4. アスファルトの黒タール補修ひび割れ筋（Tar Snake Cracks）
        // =========================================================================
        ctx.fillStyle = 'rgba(10, 11, 13, 0.75)';
        for (let i = 0; i < 7; i++) {
            const py = (i * 155 + 40) % 1024;
            ctx.fillRect(130, py, 290, 3);
            ctx.fillRect(600, py + 35, 270, 3);
        }

        // =========================================================================
        // 5. 白線（外側線）＆ センターライン（経年劣化と土汚れ）
        // =========================================================================
        // 左白線 (X=72〜88)
        ctx.fillStyle = 'rgba(235, 235, 230, 0.88)';
        ctx.fillRect(72, 0, 16, 1024);
        // 右白線 (X=936〜952)
        ctx.fillRect(936, 0, 16, 1024);

        // 白線のかすれ・土かぶり表現
        for (let y = 0; y < 1024; y += 16) {
            if (Math.random() > 0.4) {
                ctx.fillStyle = `rgba(55, 42, 28, ${0.2 + Math.random() * 0.35})`;
                ctx.fillRect(70, y, 20, 8 + Math.random() * 12);
                ctx.fillRect(934, y + 4, 20, 8 + Math.random() * 12);
            }
        }

        // イエロー/オレンジ センターライン (X=504〜520)
        ctx.fillStyle = '#ffaa00';
        ctx.fillRect(504, 0, 16, 1024);
        // センターラインの土埃・カスレ
        for (let y = 0; y < 1024; y += 32) {
            ctx.fillStyle = `rgba(50, 38, 25, ${0.15 + Math.random() * 0.25})`;
            ctx.fillRect(503, y, 18, 12);
        }

        // =========================================================================
        // 6. ★核心部：白線外側の「未舗装 土・砂利・小石路肩ストリップ」
        // 左側: X=0〜72、右側: X=952〜1024
        // ガードレール足元・側溝との境界に広がるリアルな砂利・砕石・赤土の吹き溜まり！
        // =========================================================================
        // 土砂ベース下地（茶褐色〜暗灰土）
        ctx.fillStyle = '#2f2317';
        ctx.fillRect(0, 0, 72, 1024);
        ctx.fillRect(952, 0, 72, 1024);

        // 土砂の濃淡グラデーション（道路側に向かってアスファルトと自然に溶け合う）
        const shGradL = ctx.createLinearGradient(0, 0, 75, 0);
        shGradL.addColorStop(0, 'rgba(42, 30, 19, 0.95)');
        shGradL.addColorStop(0.7, 'rgba(56, 42, 28, 0.85)');
        shGradL.addColorStop(1, 'rgba(40, 34, 28, 0.0)');
        ctx.fillStyle = shGradL;
        ctx.fillRect(0, 0, 75, 1024);

        const shGradR = ctx.createLinearGradient(1024, 0, 949, 0);
        shGradR.addColorStop(0, 'rgba(42, 30, 19, 0.95)');
        shGradR.addColorStop(0.7, 'rgba(56, 42, 28, 0.85)');
        shGradR.addColorStop(1, 'rgba(40, 34, 28, 0.0)');
        ctx.fillStyle = shGradR;
        ctx.fillRect(949, 0, 75, 1024);

        // 密集する粗い砂利・砕石・小石粒子群（左側 & 右側路肩）
        const gravelColors = [
            '#4a4a4a', '#636363', '#787878', '#8c8c8c', // 砕石グレー
            '#523e2b', '#6b5138', '#856647', '#9e7b57', // 土・赤土・砂
            '#2e2419', '#1f1b16', '#3b3228', '#b09476'  // 砂利ハイライト
        ];

        for (let i = 0; i < 18000; i++) {
            // 左側路肩 (0〜74)
            const xl = Math.random() * 74;
            const yl = Math.random() * 1024;
            const sizeL = 1.5 + Math.random() * 3.5;
            ctx.fillStyle = gravelColors[Math.floor(Math.random() * gravelColors.length)];
            ctx.fillRect(xl, yl, sizeL, sizeL * 0.85);

            // 右側路肩 (950〜1024)
            const xr = 950 + Math.random() * 74;
            const yr = Math.random() * 1024;
            const sizeR = 1.5 + Math.random() * 3.5;
            ctx.fillStyle = gravelColors[Math.floor(Math.random() * gravelColors.length)];
            ctx.fillRect(xr, yr, sizeR, sizeR * 0.85);
        }

        // 白線を越えて車道側に少し飛び散ったリアルな小石・砂利（Gravel Spill）
        for (let i = 0; i < 1200; i++) {
            // 左側白線の内側 (74〜120)
            const xl = 74 + Math.random() * 46;
            const yl = Math.random() * 1024;
            const size = 1.2 + Math.random() * 2.8;
            ctx.fillStyle = gravelColors[Math.floor(Math.random() * gravelColors.length)];
            ctx.fillRect(xl, yl, size, size * 0.8);

            // 右側白線の内側 (904〜950)
            const xr = 904 + Math.random() * 46;
            const yr = Math.random() * 1024;
            ctx.fillStyle = gravelColors[Math.floor(Math.random() * gravelColors.length)];
            ctx.fillRect(xr, yr, size, size * 0.8);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.anisotropy = 4;
        return texture;
    }

    setWeather(weather) {
        this.weather = weather || 'dry';
        if (!this.roadMat) return;
        if (this.weather === 'rain') {
            this.roadMat.roughness = 0.16;
            this.roadMat.metalness = 0.55;
            this.roadMat.color.setHex(0xaaaaaa);
        } else if (this.weather === 'fog') {
            this.roadMat.roughness = 0.65;
            this.roadMat.metalness = 0.20;
            this.roadMat.color.setHex(0xd5d5d5);
        } else {
            this.roadMat.roughness = 0.85;
            this.roadMat.metalness = 0.10;
            this.roadMat.color.setHex(0xffffff);
        }
        this.roadMat.needsUpdate = true;
    }

    generateRetainingWallTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // ベースの落ち着いたコンクリートグレー（白飛びせず重厚感のある山岳擁壁）
        ctx.fillStyle = '#404448';
        ctx.fillRect(0, 0, 512, 512);

        // コンクリートのざらざらノイズ
        for (let i = 0; i < 20000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const c = Math.floor(Math.random() * 40) + 50;
            ctx.fillStyle = `rgb(${c},${c + 2},${c + 4})`;
            ctx.fillRect(x, y, 2, 2);
        }

        // 精密な菱形格子法面枠工（日本の山道特有の法面保護フレーム）
        ctx.strokeStyle = '#282b2e';
        ctx.lineWidth = 4;
        const step = 48;
        for (let x = -512; x < 1024; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 512, 512);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + 512, 0);
            ctx.lineTo(x, 512);
            ctx.stroke();
        }

        // 横方向の打設目地（コンクリートブロックの水平ライン）
        ctx.strokeStyle = '#1e2022';
        ctx.lineWidth = 2.5;
        for (let y = 0; y < 512; y += 48) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(512, y);
            ctx.stroke();
        }

        // 水抜きパイプ穴（丸い黒穴＋垂れ染み）
        for (let y = 24; y < 512; y += 48) {
            for (let x = 24; x < 512; x += 48) {
                ctx.fillStyle = '#0f1011';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();

                // 雨染み（水垢の黒ずみ）
                ctx.fillStyle = 'rgba(15, 18, 20, 0.45)';
                ctx.fillRect(x - 2, y + 4, 5, 20);
            }
        }

        // 苔・下草の染み（下部に蓄積）
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * 512;
            const y = 280 + Math.random() * 232;
            ctx.fillStyle = 'rgba(28, 48, 20, 0.35)';
            ctx.fillRect(x, y, Math.random() * 12 + 2, Math.random() * 8 + 2);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    generateCliffRockTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 岩肌ベース（赤城・妙義・秋名の岩盤）
        ctx.fillStyle = (this.courseType === 'myogi') ? '#302a24' : '#282624';
        ctx.fillRect(0, 0, 512, 512);

        // 岩肌の凹凸ノイズ
        for (let i = 0; i < 20000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const c = Math.floor(Math.random() * 45) + 30;
            ctx.fillStyle = `rgb(${c + 8},${c + 5},${c})`;
            ctx.fillRect(x, y, 3, 2);
        }

        // 地層の斜めクラック・岩の割れ目
        ctx.strokeStyle = '#181614';
        ctx.lineWidth = 3.5;
        for (let i = 0; i < 22; i++) {
            let y = Math.random() * 512;
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x < 512; x += 40) {
                y += (Math.random() - 0.48) * 18;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // 苔とシダの斑点
        for (let i = 0; i < 800; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            ctx.fillStyle = 'rgba(26, 44, 18, 0.45)';
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 12 + 2, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    generateSlopeGrassTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // 深緑の山岳草地ベース
        const isMyogi = (this.courseType === 'myogi');
        const isIroha = (this.courseType === 'irohazaka');
        ctx.fillStyle = isMyogi ? '#182012' : (isIroha ? '#1e2414' : '#142010');
        ctx.fillRect(0, 0, 512, 512);

        // 草の濃淡
        for (let i = 0; i < 22000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const g = Math.floor(Math.random() * 50) + 25;
            ctx.fillStyle = `rgb(${Math.floor(g * 0.7)},${g},${Math.floor(g * 0.45)})`;
            ctx.fillRect(x, y, 3, 3);
        }

        // 土や腐葉土の斑点
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            ctx.fillStyle = 'rgba(38, 30, 16, 0.45)';
            ctx.fillRect(x, y, Math.random() * 14, Math.random() * 10);
        }

        // いろは坂：落ち葉・紅葉の散り斑点
        if (isIroha) {
            for (let i = 0; i < 600; i++) {
                const x = Math.random() * 512;
                const y = Math.random() * 512;
                ctx.fillStyle = Math.random() < 0.5 ? 'rgba(150, 40, 22, 0.5)' : 'rgba(165, 100, 22, 0.5)';
                ctx.fillRect(x, y, Math.random() * 6 + 2, Math.random() * 6 + 2);
            }
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    }

    /**
     * ★本物完全再現：ガードレール支柱ポスト＆丸型リフレクター（反射板）
     * 支柱ポスト（6mおき）とオレンジ色リフレクター（14mおき）を完全配置
     */
    buildGuardrailDecorations() {
        const segments = 2400;
        const halfW = this.roadWidth / 2;

        const postGeom = new THREE.CylinderGeometry(0.065, 0.065, 0.95, 6);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x888c92, roughness: 0.6, metalness: 0.7 });

        const reflectorGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.04, 8);
        reflectorGeom.rotateX(Math.PI / 2);
        const reflectorMat = new THREE.MeshBasicMaterial({ color: 0xff6600 }); // 鮮烈なオレンジ反射板

        const postGroup = new THREE.Group();
        const reflectorGroup = new THREE.Group();

        const hasGutterCourse = (this.courseType !== 'myogi');
        const railOffset = halfW + (hasGutterCourse ? 0.65 : 0.0);

        for (let i = 0; i <= segments; i += 6) {
            const t = i / segments;
            const pos = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t).normalize();
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            // 左側支柱（ガードレール外側 0.08m）
            const pLPost = pos.clone().add(normal.clone().multiplyScalar(-(railOffset + 0.08)));
            const postL = new THREE.Mesh(postGeom, postMat);
            postL.position.set(pLPost.x, pos.y + 0.47, pLPost.z);
            postGroup.add(postL);

            // 右側支柱
            const pRPost = pos.clone().add(normal.clone().multiplyScalar(railOffset + 0.08));
            const postR = new THREE.Mesh(postGeom, postMat);
            postR.position.set(pRPost.x, pos.y + 0.47, pRPost.z);
            postGroup.add(postR);

            // リフレクター（丸型反射板 / 12セグメント≒14mおき）
            if (i % 12 === 0) {
                // 左リフレクター（中央谷 y=0.52m）
                const pLRef = pos.clone().add(normal.clone().multiplyScalar(-railOffset));
                const refL = new THREE.Mesh(reflectorGeom, reflectorMat);
                refL.position.set(pLRef.x, pos.y + 0.52, pLRef.z);
                refL.lookAt(pLRef.clone().add(normal));
                reflectorGroup.add(refL);

                // 右リフレクター
                const pRRef = pos.clone().add(normal.clone().multiplyScalar(railOffset));
                const refR = new THREE.Mesh(reflectorGeom, reflectorMat);
                refR.position.set(pRRef.x, pos.y + 0.52, pRRef.z);
                refR.lookAt(pRRef.clone().add(normal.clone().negate()));
                reflectorGroup.add(refR);
            }
        }

        this.trackGroup.add(postGroup);
        this.trackGroup.add(reflectorGroup);
    }

    /**
     * ★頭文字DAC象徴：落石防止フェンス・転落防止金網ネット（Rockfall Protective Mesh Fences）
     * 山側の崖沿いや急斜面にそびえ立つ、H鋼支柱＋菱形エキスパンドメタル金網ネットを完全再現
     */
    buildRockfallFences() {
        const segments = 2400;
        const halfW = this.roadWidth / 2;
        const fenceDist = halfW + 0.38; // ガードレール外側0.38m

        const fenceTex = this.generateChainlinkTexture();
        const fenceMat = new THREE.MeshStandardMaterial({
            map: fenceTex,
            transparent: true,
            alphaTest: 0.25,
            roughness: 0.7,
            metalness: 0.6,
            side: THREE.DoubleSide
        });

        const postMat = new THREE.MeshStandardMaterial({ color: 0x3d4248, roughness: 0.7, metalness: 0.8 });
        const postGeom = new THREE.BoxGeometry(0.12, 2.4, 0.12);

        const leftFencePos = [], leftFenceUvs = [], leftFenceIndices = [];
        const rightFencePos = [], rightFenceUvs = [], rightFenceIndices = [];

        const postGroup = new THREE.Group();

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const pos = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t).normalize();
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            // 左側フェンス（高さ 0.3m 〜 2.5m = 高さ2.2mの金網）
            const pLBot = pos.clone().add(normal.clone().multiplyScalar(-fenceDist));
            pLBot.y += 0.30;
            const pLTop = pLBot.clone();
            pLTop.y += 2.20;

            leftFencePos.push(pLBot.x, pLBot.y, pLBot.z);
            leftFencePos.push(pLTop.x, pLTop.y, pLTop.z);
            leftFenceUvs.push(0, t * 240.0, 1, t * 240.0);

            // 右側フェンス
            const pRBot = pos.clone().add(normal.clone().multiplyScalar(fenceDist));
            pRBot.y += 0.30;
            const pRTop = pRBot.clone();
            pRTop.y += 2.20;

            rightFencePos.push(pRBot.x, pRBot.y, pRBot.z);
            rightFencePos.push(pRTop.x, pRTop.y, pRTop.z);
            rightFenceUvs.push(0, t * 240.0, 1, t * 240.0);

            if (i < segments) {
                const base = i * 2;
                leftFenceIndices.push(base, base + 1, base + 2);
                leftFenceIndices.push(base + 1, base + 3, base + 2);

                rightFenceIndices.push(base, base + 2, base + 1);
                rightFenceIndices.push(base + 1, base + 2, base + 3);
            }

            // H鋼支柱（4セグメント≒4.8mおき）
            if (i % 4 === 0) {
                const postL = new THREE.Mesh(postGeom, postMat);
                postL.position.set(pLBot.x, pos.y + 1.40, pLBot.z);
                postGroup.add(postL);

                const postR = new THREE.Mesh(postGeom, postMat);
                postR.position.set(pRBot.x, pos.y + 1.40, pRBot.z);
                postGroup.add(postR);
            }
        }

        const leftGeom = new THREE.BufferGeometry();
        leftGeom.setAttribute('position', new THREE.Float32BufferAttribute(leftFencePos, 3));
        leftGeom.setAttribute('uv', new THREE.Float32BufferAttribute(leftFenceUvs, 2));
        leftGeom.setIndex(leftFenceIndices);
        leftGeom.computeVertexNormals();
        this.trackGroup.add(new THREE.Mesh(leftGeom, fenceMat));

        const rightGeom = new THREE.BufferGeometry();
        rightGeom.setAttribute('position', new THREE.Float32BufferAttribute(rightFencePos, 3));
        rightGeom.setAttribute('uv', new THREE.Float32BufferAttribute(rightFenceUvs, 2));
        rightGeom.setIndex(rightFenceIndices);
        rightGeom.computeVertexNormals();
        this.trackGroup.add(new THREE.Mesh(rightGeom, fenceMat));

        this.trackGroup.add(postGroup);
    }

    /**
     * ★落石防止ネット用菱形エキスパンドメタル金網テクスチャ生成
     */
    generateChainlinkTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 128, 128);

        // 菱形金網ワイヤー
        ctx.strokeStyle = '#353a40';
        ctx.lineWidth = 3.5;
        const step = 32;
        for (let x = -128; x <= 256; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + 128, 128);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + 128, 0);
            ctx.lineTo(x, 128);
            ctx.stroke();
        }

        // 上下横ワイヤーロープ
        ctx.strokeStyle = '#22252a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(128, 4);
        ctx.moveTo(0, 64);
        ctx.lineTo(128, 64);
        ctx.moveTo(0, 124);
        ctx.lineTo(128, 124);
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    /**
     * ★頭文字D・峠道完全再現：主要コーナーに焼き付いたリアルな事前配置ドリフト痕（Permanent Drift Marks）
     * 直線には一切存在せず、カーブ手前のアウト側ブレーキングゾーンからApexへ向けて斜めに切れ込み、
     * カウンターを当てて立ち上がっていく走り屋たちのブラックマークを美しく描画
     */
    buildPermanentDriftMarks() {
        if (!this.samples || this.samples.length < 20) return;

        const N = this.samples.length;
        const positions = [];
        const colors = [];
        const indices = [];
        let vertCount = 0;

        // 1. コーナー区間の検出 (曲率 0.0125 以上)
        const corners = [];
        let inCorner = false;
        let curCorner = null;

        for (let i = 0; i < N; i++) {
            const s = this.samples[i];
            if (s.curvature >= 0.0125) {
                if (!inCorner) {
                    inCorner = true;
                    curCorner = {
                        startIdx: i,
                        endIdx: i,
                        apexIdx: i,
                        maxCurv: s.curvature,
                        turnDir: s.turnDir
                    };
                } else {
                    curCorner.endIdx = i;
                    if (s.curvature > curCorner.maxCurv) {
                        curCorner.maxCurv = s.curvature;
                        curCorner.apexIdx = i;
                        curCorner.turnDir = s.turnDir;
                    }
                }
            } else {
                if (inCorner) {
                    inCorner = false;
                    if (curCorner.endIdx - curCorner.startIdx >= 6) {
                        corners.push(curCorner);
                    }
                    curCorner = null;
                }
            }
        }
        if (inCorner && curCorner && (curCorner.endIdx - curCorner.startIdx >= 6)) {
            corners.push(curCorner);
        }

        // 2. 各コーナーにドリフト痕リボンを生成
        const tireWidth = 0.23; // 実車タイヤ幅 (235〜255サイズ)
        const halfTire = tireWidth * 0.5;
        const treadWidth = 1.48; // 実車のリアトレッド幅

        for (const corner of corners) {
            const turnDir = corner.turnDir || 1; // +1: 右コーナー, -1: 左コーナー
            const isHairpin = (corner.maxCurv >= 0.023);
            const numLines = isHairpin ? 2 : 1; // ヘアピンは大外と鋭角イン切りの2組の走り屋ラインが重なる

            // アプローチ区間 (Apex手前26サンプル〜Apex通過後18サンプル)
            const approachSamples = Math.min(30, Math.max(16, corner.apexIdx - corner.startIdx + 8));
            const exitSamples = Math.min(24, Math.max(12, corner.endIdx - corner.apexIdx + 6));
            const startScan = Math.max(0, corner.apexIdx - approachSamples);
            const endScan = Math.min(N - 1, corner.apexIdx + exitSamples);

            for (let line = 0; line < numLines; line++) {
                // ラインごとのわずかなバラつき
                const lineOffsetBias = (line === 0) ? 0 : (turnDir * -0.32);
                const driftAngleMultiplier = (line === 0) ? 1.0 : 0.82;

                // 左右リアタイヤの軌跡生成
                const generateWheelStrip = (wheelSideOffset) => {
                    const stripPoints = [];
                    const stripAlphas = [];

                    for (let idx = startScan; idx <= endScan; idx++) {
                        const s = this.samples[idx];
                        const progress = (idx - startScan) / Math.max(1, (endScan - startScan));

                        // ドリフトラインの横方向オフセット (アウト側からインのApex、そしてアウトへ)
                        let targetOffset = 0;
                        let alpha = 0;

                        if (idx <= corner.apexIdx) {
                            // 進入〜Apex: アウト側からイン側クリッピングポイントへ滑り込む
                            const t = (idx - startScan) / Math.max(1, (corner.apexIdx - startScan));
                            const entryOffset = -turnDir * 1.5; // アウト側車線寄り
                            const apexOffset = turnDir * (this.roadWidth * 0.36); // イン側クリッピングポイント
                            targetOffset = entryOffset + (apexOffset - entryOffset) * Math.sin(t * Math.PI * 0.5);
                            alpha = Math.pow(t, 1.6) * (isHairpin ? 0.70 : 0.56);
                        } else {
                            // Apex〜脱出: カウンターを当ててアウト側へ流れる
                            const t = (idx - corner.apexIdx) / Math.max(1, (endScan - corner.apexIdx));
                            const apexOffset = turnDir * (this.roadWidth * 0.36);
                            const exitOffset = -turnDir * 1.7; // アウト側へドリフトアウト
                            targetOffset = apexOffset + (exitOffset - apexOffset) * (1.0 - Math.cos(t * Math.PI * 0.5));
                            alpha = (1.0 - Math.pow(t, 1.4)) * (isHairpin ? 0.70 : 0.56);
                        }

                        // リアタイヤの横滑り（テールスライド）による偏位
                        const tailSlide = -turnDir * (isHairpin ? 0.60 : 0.38) * driftAngleMultiplier * Math.sin(progress * Math.PI);
                        const totalOffset = targetOffset + lineOffsetBias + wheelSideOffset + tailSlide;

                        // 路面上の位置（左右法線ベクトル）
                        const normal = s.normal.clone().normalize();
                        const p = s.pos.clone().add(normal.clone().multiplyScalar(totalOffset));
                        p.y += 0.016; // 路面からわずか1.6cm上に配置（Zファイト完全防止）

                        stripPoints.push({ pos: p, tangent: s.tangent.clone().normalize() });
                        stripAlphas.push(Math.max(0, Math.min(0.80, alpha)));
                    }

                    // 頂点配列とインデックスへの登録
                    for (let k = 0; k < stripPoints.length - 1; k++) {
                        const ptA = stripPoints[k];
                        const ptB = stripPoints[k + 1];
                        const aA = stripAlphas[k];
                        const aB = stripAlphas[k + 1];

                        if (aA <= 0.02 && aB <= 0.02) continue;

                        const sideA = new THREE.Vector3(-ptA.tangent.z, 0, ptA.tangent.x).normalize();
                        const sideB = new THREE.Vector3(-ptB.tangent.z, 0, ptB.tangent.x).normalize();

                        const v0 = ptA.pos.clone().sub(sideA.clone().multiplyScalar(halfTire));
                        const v1 = ptA.pos.clone().add(sideA.clone().multiplyScalar(halfTire));
                        const v2 = ptB.pos.clone().sub(sideB.clone().multiplyScalar(halfTire));
                        const v3 = ptB.pos.clone().add(sideB.clone().multiplyScalar(halfTire));

                        const baseIdx = vertCount;
                        positions.push(
                            v0.x, v0.y, v0.z,
                            v1.x, v1.y, v1.z,
                            v2.x, v2.y, v2.z,
                            v3.x, v3.y, v3.z
                        );

                        // 焼き付きタイヤゴムの漆黒 (R:0.04, G:0.04, B:0.05)
                        const cR = 0.04, cG = 0.04, cB = 0.05;
                        colors.push(
                            cR, cG, cB, aA,
                            cR, cG, cB, aA,
                            cR, cG, cB, aB,
                            cR, cG, cB, aB
                        );

                        indices.push(
                            baseIdx, baseIdx + 1, baseIdx + 2,
                            baseIdx + 2, baseIdx + 1, baseIdx + 3
                        );
                        vertCount += 4;
                    }
                };

                // 左リアタイヤと右リアタイヤ
                generateWheelStrip(-treadWidth * 0.5);
                generateWheelStrip(treadWidth * 0.5);
            }
        }

        if (positions.length === 0) return;

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 4));
        geom.setIndex(indices);

        const mat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -1.0,
            polygonOffsetUnits: -4.0,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.renderOrder = 2; // 路面の直後に描画
        this.trackGroup.add(mesh);
    }

    buildTerrain() {
        this.buildMountainStrips();
        this.buildDistantMountains();
        this.buildValleyFloor();
    }

    /**
     * ★頭文字D ARCADE STAGE完全再現：道路沿いの連続山岳立体地形
     * 【下段】：高さ4.5〜6mのコンクリート擁壁（菱形枠工・水抜き穴・打設目地）
     * 【上段】：高さ10〜24mの豊かな緑の山肌・岩肌・森林斜面
     * これにより、奥の道路を100%遮断し、本物の峠道のダイナミックな景観を創出
     */
    buildMountainStrips() {
        const segments = 2400;
        const halfW = this.roadWidth / 2;

        // 1. 擁壁メッシュ用データ（左右）
        const leftWallPos = [], leftWallUvs = [], leftWallIndices = [];
        const rightWallPos = [], rightWallUvs = [], rightWallIndices = [];

        // 2. 山肌・斜面メッシュ用データ（左右）
        const leftSlopePos = [], leftSlopeUvs = [], leftSlopeIndices = [];
        const rightSlopePos = [], rightSlopeUvs = [], rightSlopeIndices = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const pos = this.curve.getPointAt(t);
            const tangent = this.curve.getTangentAt(t).normalize();
            const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

            // カーブ曲率（外積計算）
            const nextT = Math.min(1.0, t + 0.003);
            const nextTan = this.curve.getTangentAt(nextT).normalize();
            const crossY = tangent.x * nextTan.z - tangent.z * nextTan.x;
            const curveFactor = Math.min(1.0, Math.max(-1.0, crossY * 75.0));

            // 山岳全体の起伏うねり（大局的斜面）
            const baseWave = Math.sin(t * Math.PI * 14.0);
            const sideBias = 0.65 * curveFactor + 0.35 * baseWave;
            // 滑らかなtanh連続補間 (-1.0 〜 +1.0)
            const m = Math.tanh(sideBias * 2.0);

            // 急カーブ内側（イン側）の法線自己交差（クロスオーバー）を動的圧縮で完全防止
            const absCurv = Math.min(0.5, Math.abs(crossY) * 14.0);
            // 左側がイン側（crossY > 0）なら左を圧縮、右側がイン側（crossY < 0）なら右を圧縮
            const leftInFactor = (crossY > 0) ? Math.max(0.60, 1.0 - absCurv) : 1.0;
            const rightInFactor = (crossY < 0) ? Math.max(0.60, 1.0 - absCurv) : 1.0;

            // === 1. 左側 (Left Side) ===
            const mL = m;
            // 完全連続な高さ設計（段差0、滑らかに山肌と谷面が遷移）
            const lH0 = -0.20; // 道路端より下に潜らせて路面干渉ゼロ
            const lH1 = -0.10 + mL * 0.25; // 基礎コンクリート
            const lH2 = (mL >= 0) ? (0.6 + mL * 5.4) : (0.6 + mL * 3.8); // 擁壁天辺 (-3.2m 〜 +6.0m)
            const lH3 = (mL >= 0) ? (1.5 + mL * 13.5) : (1.5 + mL * 12.0); // 山肌天辺 (-10.5m 〜 +15.0m)
            const lHMid = (lH2 + lH3) * 0.5;

            // 道路端からの距離（隣接道路に届かない最大5.1m厳格制限）
            const lWDists = [
                halfW + 0.35 * leftInFactor,
                halfW + 1.10 * leftInFactor,
                halfW + 2.50 * leftInFactor
            ];
            const lWHeights = [lH0, lH1, lH2];

            const lSDists = [
                halfW + 2.50 * leftInFactor,
                halfW + 3.80 * leftInFactor,
                halfW + 5.10 * leftInFactor
            ];
            const lSHeights = [lH2, lHMid, lH3];

            // 左擁壁（3頂点）
            for (let j = 0; j < 3; j++) {
                const p = pos.clone().add(normal.clone().multiplyScalar(-lWDists[j]));
                p.y = pos.y + lWHeights[j];
                leftWallPos.push(p.x, p.y, p.z);
                leftWallUvs.push(j / 2.0, t * 180.0);
            }

            // 左山肌斜面（3頂点）
            for (let j = 0; j < 3; j++) {
                const p = pos.clone().add(normal.clone().multiplyScalar(-lSDists[j]));
                p.y = pos.y + lSHeights[j];
                leftSlopePos.push(p.x, p.y, p.z);
                leftSlopeUvs.push(j / 2.0, t * 140.0);
            }

            // === 2. 右側 (Right Side) ===
            const mR = -m;
            const rH0 = -0.20;
            const rH1 = -0.10 + mR * 0.25;
            const rH2 = (mR >= 0) ? (0.6 + mR * 5.4) : (0.6 + mR * 3.8);
            const rH3 = (mR >= 0) ? (1.5 + mR * 13.5) : (1.5 + mR * 12.0);
            const rHMid = (rH2 + rH3) * 0.5;

            const rWDists = [
                halfW + 0.35 * rightInFactor,
                halfW + 1.10 * rightInFactor,
                halfW + 2.50 * rightInFactor
            ];
            const rWHeights = [rH0, rH1, rH2];

            const rSDists = [
                halfW + 2.50 * rightInFactor,
                halfW + 3.80 * rightInFactor,
                halfW + 5.10 * rightInFactor
            ];
            const rSHeights = [rH2, rHMid, rH3];

            // 右擁壁（3頂点）
            for (let j = 0; j < 3; j++) {
                const p = pos.clone().add(normal.clone().multiplyScalar(rWDists[j]));
                p.y = pos.y + rWHeights[j];
                rightWallPos.push(p.x, p.y, p.z);
                rightWallUvs.push(j / 2.0, t * 180.0);
            }

            // 右山肌斜面（3頂点）
            for (let j = 0; j < 3; j++) {
                const p = pos.clone().add(normal.clone().multiplyScalar(rSDists[j]));
                p.y = pos.y + rSHeights[j];
                rightSlopePos.push(p.x, p.y, p.z);
                rightSlopeUvs.push(j / 2.0, t * 140.0);
            }

            // インデックス
            if (i < segments) {
                const row1 = i * 3;
                const row2 = (i + 1) * 3;
                for (let j = 0; j < 2; j++) {
                    const a = row1 + j, b = row1 + j + 1, c = row2 + j, d = row2 + j + 1;
                    // 左側
                    leftWallIndices.push(a, c, b);
                    leftWallIndices.push(b, c, d);
                    leftSlopeIndices.push(a, c, b);
                    leftSlopeIndices.push(b, c, d);
                    // 右側
                    rightWallIndices.push(a, b, c);
                    rightWallIndices.push(b, d, c);
                    rightSlopeIndices.push(a, b, c);
                    rightSlopeIndices.push(b, d, c);
                }
            }
        }

        // テクスチャとマテリアル準備
        const wallTex = this.generateRetainingWallTexture();
        const grassTex = this.generateSlopeGrassTexture();

        const wallMat = new THREE.MeshStandardMaterial({
            map: wallTex,
            roughness: 0.85,
            metalness: 0.15,
            side: THREE.DoubleSide
        });

        const slopeMat = new THREE.MeshStandardMaterial({
            map: grassTex,
            roughness: 0.92,
            metalness: 0.05,
            side: THREE.DoubleSide
        });

        // 1. 左側・右側の擁壁メッシュ（下段）
        const leftWallGeom = new THREE.BufferGeometry();
        leftWallGeom.setAttribute('position', new THREE.Float32BufferAttribute(leftWallPos, 3));
        leftWallGeom.setAttribute('uv', new THREE.Float32BufferAttribute(leftWallUvs, 2));
        leftWallGeom.setIndex(leftWallIndices);
        leftWallGeom.computeVertexNormals();
        const leftWallMesh = new THREE.Mesh(leftWallGeom, wallMat);
        leftWallMesh.receiveShadow = true;
        this.trackGroup.add(leftWallMesh);

        const rightWallGeom = new THREE.BufferGeometry();
        rightWallGeom.setAttribute('position', new THREE.Float32BufferAttribute(rightWallPos, 3));
        rightWallGeom.setAttribute('uv', new THREE.Float32BufferAttribute(rightWallUvs, 2));
        rightWallGeom.setIndex(rightWallIndices);
        rightWallGeom.computeVertexNormals();
        const rightWallMesh = new THREE.Mesh(rightWallGeom, wallMat);
        rightWallMesh.receiveShadow = true;
        this.trackGroup.add(rightWallMesh);

        // 2. 左側・右側の緑の山肌斜面メッシュ（上段）
        const leftSlopeGeom = new THREE.BufferGeometry();
        leftSlopeGeom.setAttribute('position', new THREE.Float32BufferAttribute(leftSlopePos, 3));
        leftSlopeGeom.setAttribute('uv', new THREE.Float32BufferAttribute(leftSlopeUvs, 2));
        leftSlopeGeom.setIndex(leftSlopeIndices);
        leftSlopeGeom.computeVertexNormals();
        const leftSlopeMesh = new THREE.Mesh(leftSlopeGeom, slopeMat);
        leftSlopeMesh.receiveShadow = true;
        this.trackGroup.add(leftSlopeMesh);

        const rightSlopeGeom = new THREE.BufferGeometry();
        rightSlopeGeom.setAttribute('position', new THREE.Float32BufferAttribute(rightSlopePos, 3));
        rightSlopeGeom.setAttribute('uv', new THREE.Float32BufferAttribute(rightSlopeUvs, 2));
        rightSlopeGeom.setIndex(rightSlopeIndices);
        rightSlopeGeom.computeVertexNormals();
        const rightSlopeMesh = new THREE.Mesh(rightSlopeGeom, slopeMat);
        rightSlopeMesh.receiveShadow = true;
        this.trackGroup.add(rightSlopeMesh);
    }

    /**
     * ★遠景の連峰・山並み（Distant Mountain Silhouette / Ridges）
     * 地平線に広がる雄大な山脈により、昼や夕暮れのスカスカ感を完全に解消
     */
    buildDistantMountains() {
        const ringSegments = 64;
        const radius = 2400;
        const mountainPositions = [];
        const mountainIndices = [];
        const mountainUvs = [];

        // コースの中心座標を概算
        let midX = 0, midY = 0, midZ = 0;
        const count = this.samples.length;
        for (let i = 0; i < count; i += 20) {
            midX += this.samples[i].pos.x;
            midY += this.samples[i].pos.y;
            midZ += this.samples[i].pos.z;
        }
        const sampleCountDiv = Math.floor(count / 20) || 1;
        midX /= sampleCountDiv;
        midY /= sampleCountDiv;
        midZ /= sampleCountDiv;

        for (let i = 0; i <= ringSegments; i++) {
            const angle = (i / ringSegments) * Math.PI * 2;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            // フラクタル山頂の高さ変化（連峰のギザギザ稜線）
            const peakHeight = 220 +
                Math.sin(angle * 3.0) * 80 +
                Math.sin(angle * 7.0 + 1.2) * 50 +
                Math.cos(angle * 13.0) * 35;

            const bx = midX + cosA * radius;
            const bz = midZ + sinA * radius;
            const byBottom = midY - 350;
            const byTop = midY + peakHeight;

            mountainPositions.push(bx, byBottom, bz);
            mountainPositions.push(bx, byTop, bz);

            mountainUvs.push(i / ringSegments, 0);
            mountainUvs.push(i / ringSegments, 1);

            if (i < ringSegments) {
                const base = i * 2;
                mountainIndices.push(base, base + 1, base + 2);
                mountainIndices.push(base + 1, base + 3, base + 2);
            }
        }

        const mountainGeom = new THREE.BufferGeometry();
        mountainGeom.setAttribute('position', new THREE.Float32BufferAttribute(mountainPositions, 3));
        mountainGeom.setAttribute('uv', new THREE.Float32BufferAttribute(mountainUvs, 2));
        mountainGeom.setIndex(mountainIndices);
        mountainGeom.computeVertexNormals();

        // 遠景マウンテンマテリアル（霞んだ山並み色）
        const isMyogi = (this.courseType === 'myogi');
        const mountainMat = new THREE.MeshStandardMaterial({
            color: isMyogi ? 0x222620 : 0x18241c,
            roughness: 0.95,
            metalness: 0.05,
            side: THREE.DoubleSide
        });
        const mountainMesh = new THREE.Mesh(mountainGeom, mountainMat);
        this.trackGroup.add(mountainMesh);
    }

    /**
     * ★山岳ベースグラウンド（コース下部の雄大な谷底大地）
     */
    buildValleyFloor() {
        const groundGeom = new THREE.PlaneGeometry(7500, 7500, 16, 16);
        groundGeom.rotateX(-Math.PI / 2);
        groundGeom.translate(0, -320, 1500);

        const groundMat = new THREE.MeshStandardMaterial({
            color: this.courseType === 'myogi' ? 0x161a12 : 0x0f1c11,
            roughness: 0.98,
            metalness: 0.02
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.receiveShadow = true;
        this.trackGroup.add(ground);
    }

    buildDecorations() {
        const isAkagi = (this.courseType === 'akagi');
        const isIroha = (this.courseType === 'irohazaka');
        const isMyogi = (this.courseType === 'myogi');



        // === ストリートファニチャー用マテリアル＆ジオメトリ ===
        // 街灯マテリアル
        const streetlightMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
        const lightGlowMat = new THREE.MeshBasicMaterial({ color: 0xffe090 });

        // チャッターバー（センターライン鋲）
        const studGeom = new THREE.BoxGeometry(0.18, 0.08, 0.35);
        const studMat = new THREE.MeshBasicMaterial({ color: 0xff8800 });

        // カーブミラー（凸面鏡：オレンジ支柱＋フード＋シルバー鏡面）
        const mirrorPoleGeom = new THREE.CylinderGeometry(0.08, 0.08, 3.4, 6);
        const mirrorFrameGeom = new THREE.CylinderGeometry(0.65, 0.65, 0.12, 12);
        const mirrorDishGeom = new THREE.CircleGeometry(0.58, 12);
        const mirrorOrangeMat = new THREE.MeshStandardMaterial({ color: 0xff5500, roughness: 0.4, metalness: 0.2 });
        const mirrorSilverMat = new THREE.MeshStandardMaterial({ color: 0xf5f8ff, roughness: 0.08, metalness: 0.95 });

        // 急カーブ注意シェブロン警戒標（黄黒矢印）
        const chevronPlateGeom = new THREE.BoxGeometry(0.8, 0.55, 0.06);
        const chevronPoleGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 4);
        const chevronMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.3 });

        // 電柱（コンクリート柱＋トランス＋腕金）
        const poleGeom = new THREE.CylinderGeometry(0.18, 0.22, 8.5, 6);
        const poleArmGeom = new THREE.BoxGeometry(1.6, 0.1, 0.1);
        const transformerGeom = new THREE.CylinderGeometry(0.32, 0.32, 1.1, 8);
        const utilityPoleMat = new THREE.MeshStandardMaterial({ color: 0x777c82, roughness: 0.9 });
        const utilityMetalMat = new THREE.MeshStandardMaterial({ color: 0x44494f, metalness: 0.8 });

        // 架線（電線）接続用ノードリスト
        const utilityPoleNodes = [];

        // === メインループ：装飾・樹木・ストリートファニチャー配置 ===
        for (let i = 2; i < this.sampleCount - 2; i += 5) {
            const sample = this.samples[i];
            const normal = sample.normal;
            const tangent = sample.tangent;
            const t = sample.t;

            // 1. チャッターバー（鋲）- センターライン
            const stud = new THREE.Mesh(studGeom, studMat);
            stud.position.copy(sample.pos);
            stud.position.y += 0.04;
            stud.lookAt(sample.pos.clone().add(tangent));
            this.trackGroup.add(stud);

            // 2. 街灯 (八方ヶ原は街灯ゼロの完全漆黒)
            if (this.courseType !== 'happo') {
                if (i % 7 === 0) {
                    if (!(this.courseType === 'usui' && t >= 0.214 && t <= 0.226)) {
                        const side = (i % 14 === 0) ? -1 : 1;
                        const poleOffset = (this.roadWidth / 2 + 1.2) * side;
                        const polePos = sample.pos.clone().add(normal.clone().multiplyScalar(poleOffset));

                        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 6.5, 6), streetlightMat);
                        pole.position.set(polePos.x, polePos.y + 3.25, polePos.z);
                        this.trackGroup.add(pole);

                        const lampHead = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.8), streetlightMat);
                        lampHead.position.set(polePos.x, polePos.y + 6.4, polePos.z);
                        this.trackGroup.add(lampHead);

                        const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 6), lightGlowMat);
                        bulb.position.set(polePos.x, polePos.y + 6.2, polePos.z);
                        this.trackGroup.add(bulb);

                        if (i % 21 === 0) {
                            const pLight = new THREE.PointLight(0xffcc88, 1.2, 50, 2.0);
                            pLight.position.set(polePos.x, polePos.y + 6.0, polePos.z);
                            this.trackGroup.add(pLight);
                        }
                    }
                }
            } else {
                // 八方ヶ原専用デリネーター（赤白反射鋲）
                if (i % 3 === 0) {
                    for (let sideMul of [-1, 1]) {
                        const delinPos = sample.pos.clone().add(normal.clone().multiplyScalar((this.roadWidth / 2 + 0.12) * sideMul));
                        const delinGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.65, 6);
                        const delinColor = (sideMul > 0) ? 0xee2222 : 0xffffff;
                        const delinMat = new THREE.MeshBasicMaterial({ color: delinColor });
                        const delin = new THREE.Mesh(delinGeom, delinMat);
                        delin.position.set(delinPos.x, delinPos.y + 0.65, delinPos.z);
                        this.trackGroup.add(delin);
                    }
                }
            }

            // 3. 日本の山道電柱（60mおき）
            if (i % 15 === 0 && (i % 30 !== 0)) {
                const poleSide = -1; // 道路左側の路肩外
                const pPos = sample.pos.clone().add(normal.clone().multiplyScalar((this.roadWidth / 2 + 1.8) * poleSide));
                const uPoleGroup = new THREE.Group();

                const uPole = new THREE.Mesh(poleGeom, utilityPoleMat);
                uPole.position.y = 4.25;
                uPoleGroup.add(uPole);

                const uArm = new THREE.Mesh(poleArmGeom, utilityMetalMat);
                uArm.position.y = 7.8;
                uPoleGroup.add(uArm);

                // 変圧器バケツ（トランス）
                if (i % 30 === 15) {
                    const trans = new THREE.Mesh(transformerGeom, utilityPoleMat);
                    trans.position.set(0.35, 6.8, 0);
                    uPoleGroup.add(trans);
                }

                uPoleGroup.position.set(pPos.x, sample.pos.y, pPos.z);
                this.trackGroup.add(uPoleGroup);

                // 架線用：腕金の左右・中央碍子3座標を記録
                const armY = sample.pos.y + 7.85;
                const armL = pPos.clone().add(normal.clone().multiplyScalar(-0.75));
                armL.y = armY;
                const armM = pPos.clone();
                armM.y = armY;
                const armR = pPos.clone().add(normal.clone().multiplyScalar(0.75));
                armR.y = armY;
                utilityPoleNodes.push([armL, armM, armR]);
            }

            // 4. カーブ曲率の計算（カーブミラー & シェブロン警戒標の配置判定）
            const nextSample = this.samples[Math.min(this.sampleCount - 1, i + 3)];
            let crossY = 0;
            if (nextSample) {
                crossY = tangent.x * nextSample.tangent.z - tangent.z * nextSample.tangent.x;
            }
            const isSharpCurve = Math.abs(crossY) > 0.035;

            // ★カーブミラー（ブラインドコーナー・急カーブ手前の山側・イン側に配置）
            if (isSharpCurve && (i % 15 === 0)) {
                const mirrorSide = crossY > 0 ? -1 : 1; // カーブ内側（イン側）
                const mPos = sample.pos.clone().add(normal.clone().multiplyScalar((this.roadWidth / 2 + 1.2) * mirrorSide));
                const mirrorGroup = new THREE.Group();

                // 支柱
                const mPole = new THREE.Mesh(mirrorPoleGeom, mirrorOrangeMat);
                mPole.position.y = 1.7;
                mirrorGroup.add(mPole);

                // オレンジ丸枠
                const mFrame = new THREE.Mesh(mirrorFrameGeom, mirrorOrangeMat);
                mFrame.rotation.x = Math.PI / 2;
                mFrame.position.set(0, 3.2, 0.1);
                mirrorGroup.add(mFrame);

                // 鏡面
                const mDish = new THREE.Mesh(mirrorDishGeom, mirrorSilverMat);
                mDish.position.set(0, 3.2, 0.17);
                mirrorGroup.add(mDish);

                mirrorGroup.position.set(mPos.x, sample.pos.y, mPos.z);
                mirrorGroup.lookAt(sample.pos.clone().add(new THREE.Vector3(0, 1.5, 0)));
                this.trackGroup.add(mirrorGroup);
            }

            // ★急カーブ警告看板（黄黒シェブロン矢印：アウト側ガードレールに沿って配置）
            if (isSharpCurve && (i % 5 === 0)) {
                const signSide = crossY > 0 ? 1 : -1; // カーブ外側（アウト側）
                const sPos = sample.pos.clone().add(normal.clone().multiplyScalar((this.roadWidth / 2 + 0.6) * signSide));
                const chevGroup = new THREE.Group();

                const cPole = new THREE.Mesh(chevronPoleGeom, streetlightMat);
                cPole.position.y = 0.7;
                chevGroup.add(cPole);

                const cPlate = new THREE.Mesh(chevronPlateGeom, chevronMat);
                cPlate.position.set(0, 1.1, 0);
                chevGroup.add(cPlate);

                chevGroup.position.set(sPos.x, sample.pos.y, sPos.z);
                chevGroup.lookAt(sample.pos.clone().add(tangent));
                this.trackGroup.add(chevGroup);
            }

        }

        // ★秋名・峠道架線（電線）の配置
        if (utilityPoleNodes.length > 1) {
            this.buildPowerLines(utilityPoleNodes);
        }

        // ★名物看板・ランドマーク
        if (this.courseType === 'akina' || this.courseType === 'akina_uphill') {
            this.buildAkinaWaterTower();
            this.buildHairpinSigns();
            this.buildAkinaTollGate();
            this.buildAkinaGuideSigns();
        } else if (this.courseType === 'irohazaka') {
            this.buildIrohazakaSigns();
        } else if (this.courseType === 'myogi') {
            this.buildMyogiSigns();
        } else if (this.courseType === 'usui') {
            this.buildMeganeBridge();
            this.buildUsuiSigns();
        } else if (this.courseType === 'akagi') {
            this.buildAkagiTorii();
            this.buildAkagiSigns();
        } else if (this.courseType === 'happo') {
            this.buildSnakeBridges();
            this.buildHappoSigns();
        } else if (this.courseType === 'tsubaki') {
            this.buildTsubakiSevenHairpins();
            this.buildTsubakiMonuments();
        }

        // ★リアル峠道：カーブ手前の減速帯（ゼブラ・ラブルストリップ）
        this.buildDecelerationBands();

        // ★リアル峠道：センターラインのチャッターバー（キャッツアイ／道路鋲）
        this.buildChatterBars();

        // ★リアル峠道：カーブ外側の赤白矢印板（シェブロンデリネーター）
        this.buildChevronMarkers();

        // ★頭文字DAC象徴：3D青色コーナーナビゲーション矢印システム
        this.buildDacCornerNavigationGroup();

        // ★頭文字DAC公式：セクション計測トラスゲート群 ＆ フィニッシュライン
        this.buildSectionGates();

        // ★頭文字DAC完全再現：超高密度 リアル峠フォレスト（InstancedMesh 森林システム）
        this.buildDenseTougeForest();

        // ★峠道あるある完全再現：3D立体砂利・砕石・小石マウンド（3D Gravel Patches）
        this.build3DGravelPatches();
    }

    /**
     * ★頭文字DAC完全再現：超高密度 リアル峠フォレスト（InstancedMesh 森林システム）
     * ガードレール直後の最前列から頭上キャノピー、山肌、遠景まで数千〜1万本規模の立体樹木が覆い尽くす圧巻の峠道風景
     * 3段傘スギ・ボリューム広葉樹・ガードレール路肩ブッシュの3大樹木で完全再現
     */
    buildDenseTougeForest() {
        const isAkagi = (this.courseType === 'akagi');
        const isIroha = (this.courseType === 'irohazaka');
        const isMyogi = (this.courseType === 'myogi');

        // バッファジオメトリ結合ヘルパー
        const mergeGeoms = (geometries) => {
            let totalVerts = 0;
            let totalIndices = 0;
            let hasIndex = false;

            geometries.forEach(g => {
                totalVerts += g.attributes.position.count;
                if (g.index) {
                    hasIndex = true;
                    totalIndices += g.index.count;
                }
            });

            const positions = new Float32Array(totalVerts * 3);
            const normals = new Float32Array(totalVerts * 3);
            let indices = hasIndex ? new Uint32Array(totalIndices) : null;

            let posOffset = 0;
            let normOffset = 0;
            let indexOffset = 0;
            let vertOffset = 0;

            geometries.forEach(g => {
                const p = g.attributes.position.array;
                positions.set(p, posOffset);
                posOffset += p.length;

                if (g.attributes.normal) {
                    const n = g.attributes.normal.array;
                    normals.set(n, normOffset);
                    normOffset += n.length;
                }

                if (g.index) {
                    const idx = g.index.array;
                    for (let i = 0; i < idx.length; i++) {
                        indices[indexOffset + i] = idx[i] + vertOffset;
                    }
                    indexOffset += idx.length;
                }
                vertOffset += g.attributes.position.count;
            });

            const merged = new THREE.BufferGeometry();
            merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
            if (indices) {
                merged.setIndex(new THREE.BufferAttribute(indices, 1));
            }
            return merged;
        };

        // 1. カラーパレット（日光の直射でも白飛びせず、本物の日本の峠の深い常緑樹林を再現）
        let cedarColor, broadColor, bushColor;
        if (isIroha) {
            // いろは坂：名所中禅寺湖畔・日光の紅葉
            cedarColor = 0x6e1610;
            broadColor = 0x822210;
            bushColor  = 0x5e120c;
        } else if (isAkagi) {
            // 赤城：ブナ・白樺混生林
            cedarColor = 0x10360e;
            broadColor = 0x144012;
            bushColor  = 0x0e300c;
        } else if (isMyogi) {
            // 妙義：奇岩と深山オリーブ・針葉樹
            cedarColor = 0x0b1a0a;
            broadColor = 0x0e200c;
            bushColor  = 0x091608;
        } else {
            // 秋名・碓氷・八方・椿：日本の伝統的峠杉林（深いフォレストグリーン・重厚な陰影）
            cedarColor = 0x091c0a; // 雄大なスギ・ヒノキのディープパイン
            broadColor = 0x0d250e; // 豊かなブナ・ナラのディープフォレスト
            bushColor  = 0x081a09; // ガードレール際を隙間なく覆う濃緑ブッシュ
        }

        // 幹マテリアル（暗褐色バーク）
        const trunkMat = new THREE.MeshStandardMaterial({
            color: isAkagi ? 0x8a8276 : 0x2e1e12,
            roughness: 0.98,
            metalness: 0.0
        });

        // 葉マテリアル（白飛び完全遮断：ディープトーン ＋ roughness 1.0 ＋ スムースシェーディング）
        const cedarLeavesMat = new THREE.MeshStandardMaterial({
            color: cedarColor,
            roughness: 1.0,
            metalness: 0.0,
            flatShading: false
        });
        const broadLeavesMat = new THREE.MeshStandardMaterial({
            color: broadColor,
            roughness: 1.0,
            metalness: 0.0,
            flatShading: false
        });
        const bushLeavesMat = new THREE.MeshStandardMaterial({
            color: bushColor,
            roughness: 1.0,
            metalness: 0.0,
            flatShading: false
        });

        // --- ジオメトリ構築 ---
        // A. スギ（Cedar）：スリムな幹 ＋ 3段重ね円錐（美しい段状シルエット）
        const cTrunkGeom = new THREE.CylinderGeometry(0.26, 0.44, 5.2, 5);
        cTrunkGeom.translate(0, 2.6, 0);

        const tier1 = new THREE.ConeGeometry(3.3, 5.2, 7);
        tier1.translate(0, 5.6, 0);
        const tier2 = new THREE.ConeGeometry(2.5, 4.6, 7);
        tier2.translate(0, 8.4, 0);
        const tier3 = new THREE.ConeGeometry(1.6, 4.2, 7);
        tier3.translate(0, 11.2, 0);
        const cedarLeavesGeom = mergeGeoms([tier1, tier2, tier3]);

        // B. 広葉樹（Broadleaf）：頑丈な幹 ＋ 2個の重なり球体
        const bTrunkGeom = new THREE.CylinderGeometry(0.34, 0.52, 4.2, 5);
        bTrunkGeom.translate(0, 2.1, 0);

        const bSphere1 = new THREE.IcosahedronGeometry(2.8, 1);
        bSphere1.scale(1.1, 1.3, 1.1);
        bSphere1.translate(0, 6.2, 0);
        const bSphere2 = new THREE.IcosahedronGeometry(2.2, 1);
        bSphere2.scale(1.1, 1.1, 1.1);
        bSphere2.translate(0.6, 7.8, 0.3);
        const broadLeavesGeom = mergeGeoms([bSphere1, bSphere2]);

        // C. ガードレール路肩ブッシュ（低木生け垣）
        const bushGeom = new THREE.SphereGeometry(1.6, 7, 5);
        bushGeom.scale(1.25, 0.65, 1.15);
        bushGeom.translate(0, 0.85, 0);

        // 配置リスト
        const cedarInstances = [];
        const broadInstances = [];
        const bushInstances  = [];

        const totalSamples = this.samples.length;
        const halfW = this.roadWidth / 2;

        for (let i = 2; i < totalSamples - 2; i++) {
            const s = this.samples[i];
            const nextS = this.samples[Math.min(totalSamples - 1, i + 3)];
            let crossY = 0;
            if (nextS) {
                crossY = s.tangent.x * nextS.tangent.z - s.tangent.z * nextS.tangent.x;
            }

            const baseWave = Math.sin(s.t * Math.PI * 14.0);
            const sideBias = 0.65 * Math.min(1.0, Math.max(-1.0, crossY * 75.0)) + 0.35 * baseWave;

            for (let sideMul of [-1, 1]) {
                // 碓氷めがね橋直下はスキップ
                if (this.courseType === 'usui' && s.t >= 0.208 && s.t <= 0.232) continue;

                const isMountain = (sideMul < 0) ? (sideBias > 0) : (sideBias < 0);

                // === レイヤー 0: ガードレール直後の低木ブッシュ（生け垣・密生） ===
                // サンプル1個おき（約2m〜3m間隔）でガードレール足元の隙間を隙間なく埋め尽くす
                if (i % 2 === 0) {
                    const dBush = halfW + 1.05 + ((i * 3) % 4) * 0.18;
                    const posBush = s.pos.clone().add(s.normal.clone().multiplyScalar(dBush * sideMul));
                    posBush.y = s.pos.y + (isMountain ? 0.15 : -0.15);

                    const scaleBush = 0.95 + ((i * 5) % 5) * 0.08;
                    const rotY = (i * 1.63) % (Math.PI * 2);

                    bushInstances.push({
                        pos: posBush,
                        scale: scaleBush,
                        rotY: rotY,
                        seed: i
                    });
                }

                // === レイヤー 1: 最前列・巨大樹木トンネル（ガードレール直後、頭上キャノピー） ===
                // サンプル2個おきに巨大スギ・広葉樹を配置。上空5m〜14mで道路頭上に枝葉が覆いかぶさる
                if (i % 2 === 1) {
                    const d1 = halfW + 1.35 + ((i * 5) % 4) * 0.22;
                    const pos1 = s.pos.clone().add(s.normal.clone().multiplyScalar(d1 * sideMul));
                    pos1.y = s.pos.y + (isMountain ? 0.35 : -0.30);

                    // 枝葉を道路上空方向へせり出させ、頭上を覆うアーチ状グリーンキャノピーを形成
                    const leavesPos1 = pos1.clone().add(s.normal.clone().multiplyScalar(-1.25 * sideMul));

                    const scale1 = 1.15 + ((i * 7) % 6) * 0.08;
                    const isBroad = (i % 5 === 1);
                    const rotY = (i * 1.37) % (Math.PI * 2);

                    const targetList = isBroad ? broadInstances : cedarInstances;
                    targetList.push({
                        pos: pos1,
                        leavesPos: leavesPos1,
                        scale: scale1,
                        rotY: rotY,
                        seed: i + 5
                    });
                }

                // === レイヤー 2: 斜面・路肩の2列目（厚みと重厚な奥行き） ===
                if (i % 3 === 0) {
                    const d2 = halfW + 3.4 + ((i * 5) % 4) * 0.35;
                    const pos2 = s.pos.clone().add(s.normal.clone().multiplyScalar(d2 * sideMul));
                    pos2.y = s.pos.y + (isMountain ? 2.6 : -2.8);

                    const scale2 = 1.18 + ((i * 7) % 5) * 0.09;
                    const isBroad = ((i + 2) % 4 === 0);
                    const rotY = ((i + 1) * 1.51) % (Math.PI * 2);

                    const targetList = isBroad ? broadInstances : cedarInstances;
                    targetList.push({
                        pos: pos2,
                        scale: scale2,
                        rotY: rotY,
                        seed: i + 15
                    });
                }

                // === レイヤー 3: 中景斜面（山肌全体を深い緑で覆い尽くす） ===
                if (i % 4 === 0) {
                    const d3 = halfW + 6.8 + ((i * 7) % 5) * 0.55;
                    const pos3 = s.pos.clone().add(s.normal.clone().multiplyScalar(d3 * sideMul));
                    pos3.y = s.pos.y + (isMountain ? 6.2 : -7.0);

                    const scale3 = 1.28 + ((i * 3) % 5) * 0.10;
                    const isBroad = ((i + 3) % 4 === 0);
                    const rotY = ((i + 2) * 1.23) % (Math.PI * 2);

                    const targetList = isBroad ? broadInstances : cedarInstances;
                    targetList.push({
                        pos: pos3,
                        scale: scale3,
                        rotY: rotY,
                        seed: i + 25
                    });
                }

                // === レイヤー 4: 遠景・山奥（スカスカ感を完全に根絶） ===
                if (i % 5 === 0) {
                    const d4 = halfW + 13.5 + ((i * 11) % 6) * 1.1;
                    const pos4 = s.pos.clone().add(s.normal.clone().multiplyScalar(d4 * sideMul));
                    pos4.y = s.pos.y + (isMountain ? 12.0 : -14.0);

                    const scale4 = 1.42 + ((i * 5) % 5) * 0.12;
                    const isBroad = ((i + 4) % 5 === 0);
                    const rotY = ((i + 3) * 1.77) % (Math.PI * 2);

                    const targetList = isBroad ? broadInstances : cedarInstances;
                    targetList.push({
                        pos: pos4,
                        scale: scale4,
                        rotY: rotY,
                        seed: i + 35
                    });
                }
            }
        }

        const dummy = new THREE.Object3D();
        const colorHelper = new THREE.Color();

        // A. 杉（Cedar）インスタンス生成
        if (cedarInstances.length > 0) {
            const count = cedarInstances.length;
            const cedarTrunkMesh = new THREE.InstancedMesh(cTrunkGeom, trunkMat, count);
            const cedarLeavesMesh = new THREE.InstancedMesh(cedarLeavesGeom, cedarLeavesMat, count);

            cedarTrunkMesh.castShadow = true;
            cedarLeavesMesh.castShadow = true;
            cedarLeavesMesh.receiveShadow = true;

            for (let idx = 0; idx < count; idx++) {
                const item = cedarInstances[idx];
                dummy.position.copy(item.pos);
                dummy.rotation.set(0, item.rotY, 0);
                dummy.scale.set(item.scale, item.scale, item.scale);
                dummy.updateMatrix();
                cedarTrunkMesh.setMatrixAt(idx, dummy.matrix);

                dummy.position.copy(item.leavesPos || item.pos);
                dummy.updateMatrix();
                cedarLeavesMesh.setMatrixAt(idx, dummy.matrix);
            }

            cedarTrunkMesh.instanceMatrix.needsUpdate = true;
            cedarLeavesMesh.instanceMatrix.needsUpdate = true;

            this.trackGroup.add(cedarTrunkMesh);
            this.trackGroup.add(cedarLeavesMesh);
        }

        // B. 広葉樹（Broadleaf）インスタンス生成
        if (broadInstances.length > 0) {
            const count = broadInstances.length;
            const broadTrunkMesh = new THREE.InstancedMesh(bTrunkGeom, trunkMat, count);
            const broadLeavesMesh = new THREE.InstancedMesh(broadLeavesGeom, broadLeavesMat, count);

            broadTrunkMesh.castShadow = true;
            broadLeavesMesh.castShadow = true;
            broadLeavesMesh.receiveShadow = true;

            for (let idx = 0; idx < count; idx++) {
                const item = broadInstances[idx];
                dummy.position.copy(item.pos);
                dummy.rotation.set(0, item.rotY, 0);
                dummy.scale.set(item.scale, item.scale, item.scale);
                dummy.updateMatrix();
                broadTrunkMesh.setMatrixAt(idx, dummy.matrix);

                dummy.position.copy(item.leavesPos || item.pos);
                dummy.updateMatrix();
                broadLeavesMesh.setMatrixAt(idx, dummy.matrix);
            }

            broadTrunkMesh.instanceMatrix.needsUpdate = true;
            broadLeavesMesh.instanceMatrix.needsUpdate = true;

            this.trackGroup.add(broadTrunkMesh);
            this.trackGroup.add(broadLeavesMesh);
        }

        // C. ガードレール路肩ブッシュ（Bush）インスタンス生成
        if (bushInstances.length > 0) {
            const count = bushInstances.length;
            const bushMesh = new THREE.InstancedMesh(bushGeom, bushLeavesMat, count);
            bushMesh.castShadow = true;
            bushMesh.receiveShadow = true;

            for (let idx = 0; idx < count; idx++) {
                const item = bushInstances[idx];
                dummy.position.copy(item.pos);
                dummy.rotation.set(0, item.rotY, 0);
                dummy.scale.set(item.scale, item.scale, item.scale);
                dummy.updateMatrix();

                bushMesh.setMatrixAt(idx, dummy.matrix);
            }

            bushMesh.instanceMatrix.needsUpdate = true;

            this.trackGroup.add(bushMesh);
        }
    }

    /**
     * ★峠道あるある完全再現：3D立体砂利・砕石・小石マウンド（3D Gravel Patches）
     * コーナーのクリッピングポイント路肩やガードレール足元に吹き溜まる立体的な小石・砂利クラスタ
     * THREE.InstancedMesh を用いて軽量かつ高密度（約2400個）に一括描画
     */
    build3DGravelPatches() {
        const halfW = this.roadWidth / 2;
        const totalSamples = this.samples.length;
        if (totalSamples < 10) return;

        const maxPebbles = 2400;

        // リアルな不規則割栗石・小石・砂利の形状（変形12面体）
        const baseGeom = new THREE.DodecahedronGeometry(0.08, 1);
        const posAttr = baseGeom.attributes.position;
        // 頂点を歪ませて天然の砕石・小石形状を形成
        for (let i = 0; i < posAttr.count; i++) {
            const vx = posAttr.getX(i);
            const vy = posAttr.getY(i);
            const vz = posAttr.getZ(i);
            const noise = 0.82 + 0.36 * Math.sin(vx * 19 + vy * 29 + vz * 37);
            posAttr.setXYZ(i, vx * noise, vy * noise * 0.65, vz * noise);
        }
        baseGeom.computeVertexNormals();

        const pebbleMat = new THREE.MeshStandardMaterial({
            roughness: 0.95,
            metalness: 0.05,
            flatShading: true
        });

        const pebbleMesh = new THREE.InstancedMesh(baseGeom, pebbleMat, maxPebbles);
        pebbleMesh.receiveShadow = true;
        pebbleMesh.castShadow = false;

        const dummy = new THREE.Object3D();
        const colors = [
            new THREE.Color(0x4a4744), // スレートグレー
            new THREE.Color(0x5e564d), // ダーク砕石
            new THREE.Color(0x786958), // 黄土砂利
            new THREE.Color(0x8a7a67), // ライトグラベル
            new THREE.Color(0x66523e), // 赤茶土石
            new THREE.Color(0x3d3934), // アスファルト混じり暗石
        ];

        let count = 0;

        for (let i = 4; i < totalSamples - 4 && count < maxPebbles; i++) {
            const s = this.samples[i];
            const isCorner = (s.curvature > 0.0016) && (s.turnDir !== 0);

            // サンプル地点ごとに小石を配置するか判定
            let pebblesHere = 0;
            if (isCorner) {
                // コーナーでは 1〜3 個の小石クラスタ
                if ((i % 2 === 0) || Math.random() < 0.6) {
                    pebblesHere = 1 + Math.floor(Math.random() * 3);
                }
            } else {
                // 直線では間引き配置（約4サンプルに1個）
                if (i % 4 === 0 && Math.random() < 0.65) {
                    pebblesHere = 1;
                }
            }

            for (let k = 0; k < pebblesHere && count < maxPebbles; k++) {
                let side;
                let offsetDist;

                if (isCorner) {
                    // 75% はイン側路肩（クリッピングポイントで削られる場所）
                    // 25% はアウト側（ガードレール足元に跳ね飛んだ吹き溜まり）
                    const placeInner = (Math.random() < 0.75);
                    side = placeInner ? s.turnDir : -s.turnDir;

                    if (placeInner) {
                        // 白線外側の未舗装砂利帯（halfW - 0.72m 〜 halfW - 0.05m）
                        offsetDist = (halfW - 0.72) + Math.random() * 0.65;
                    } else {
                        // ガードレール際（halfW - 0.40m 〜 halfW + 0.10m）
                        offsetDist = (halfW - 0.40) + Math.random() * 0.50;
                    }
                } else {
                    side = (Math.random() < 0.5) ? 1 : -1;
                    offsetDist = (halfW - 0.68) + Math.random() * 0.60;
                }

                // 進行方向微小ジッター
                const jitterForward = (Math.random() - 0.5) * 1.2;
                const pebblePos = s.pos.clone()
                    .add(s.normal.clone().multiplyScalar(side * offsetDist))
                    .add(s.tangent.clone().multiplyScalar(jitterForward));

                const scaleXZ = 0.5 + Math.random() * 1.1; // 径 0.04m〜0.17m
                const scaleY = 0.25 + Math.random() * 0.6; // 偏平な砂利
                pebblePos.y = s.pos.y + scaleY * 0.04; // 路面に埋まりつつ頭を出す

                dummy.position.copy(pebblePos);
                dummy.rotation.set(
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2,
                    Math.random() * Math.PI * 2
                );
                dummy.scale.set(scaleXZ, scaleY, scaleXZ);
                dummy.updateMatrix();

                pebbleMesh.setMatrixAt(count, dummy.matrix);

                const col = colors[Math.floor(Math.random() * colors.length)];
                const jitter = 0.88 + Math.random() * 0.24;
                const finalCol = new THREE.Color(col.r * jitter, col.g * jitter, col.b * jitter);
                pebbleMesh.setColorAt(count, finalCol);

                count++;
            }
        }

        pebbleMesh.count = count;
        pebbleMesh.instanceMatrix.needsUpdate = true;
        if (pebbleMesh.instanceColor) pebbleMesh.instanceColor.needsUpdate = true;
        this.trackGroup.add(pebbleMesh);
    }

    /**
     * ★秋名・峠道の架線・電線（3本架線・カテナリー曲線サグ）
     * 電柱の腕金碍子間を自然なたるみを持って結ぶ電線
     */
    buildPowerLines(utilityPoleNodes) {
        if (!utilityPoleNodes || utilityPoleNodes.length < 2) return;

        const linePositions = [];
        const lineIndices = [];
        let vertOffset = 0;
        const sag = 0.45; // 電線のたるみ (m)
        const halfThick = 0.02; // 電線の半幅 (2cm -> 太さ約4cm)

        for (let i = 0; i < utilityPoleNodes.length - 1; i++) {
            const poleA = utilityPoleNodes[i];
            const poleB = utilityPoleNodes[i + 1];

            // 2基間の距離チェック（120m以上の異常な離れは繋がない）
            const dist = poleA[1].distanceTo(poleB[1]);
            if (dist > 120 || dist < 5) continue;

            // 3本の電線（左碍子、中央碍子、右碍子）
            for (let wireIdx = 0; wireIdx < 3; wireIdx++) {
                const ptA = poleA[wireIdx];
                const ptB = poleB[wireIdx];
                const segments = 8;

                const points = [];
                for (let s = 0; s <= segments; s++) {
                    const u = s / segments;
                    const p = ptA.clone().lerp(ptB, u);
                    // 放物線サグ（中央で最大たるむ）
                    p.y -= sag * 4.0 * u * (1.0 - u);
                    points.push(p);
                }

                // 細いクアッドリボンとしてジオメトリ構築
                for (let s = 0; s <= segments; s++) {
                    const p = points[s];
                    linePositions.push(p.x - halfThick, p.y, p.z - halfThick);
                    linePositions.push(p.x + halfThick, p.y, p.z + halfThick);
                }

                for (let s = 0; s < segments; s++) {
                    const base = vertOffset + s * 2;
                    lineIndices.push(base, base + 1, base + 2);
                    lineIndices.push(base + 1, base + 3, base + 2);
                }
                vertOffset += (segments + 1) * 2;
            }
        }

        if (linePositions.length === 0) return;

        const wireGeom = new THREE.BufferGeometry();
        wireGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        wireGeom.setIndex(lineIndices);
        wireGeom.computeVertexNormals();

        const wireMat = new THREE.MeshBasicMaterial({
            color: 0x1f2124,
            side: THREE.DoubleSide
        });
        const wireMesh = new THREE.Mesh(wireGeom, wireMat);
        this.trackGroup.add(wireMesh);
    }

    /**
     * ★警戒縞模様（黄黒ゼブラ）テクスチャ生成
     */
    generateZebraTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(0, 0, 128, 128);

        ctx.fillStyle = '#111111';
        const stripeW = 32;
        for (let x = -128; x < 256; x += stripeW * 2) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x + stripeW, 0);
            ctx.lineTo(x + stripeW + 64, 128);
            ctx.lineTo(x + 64, 128);
            ctx.closePath();
            ctx.fill();
        }
        return new THREE.CanvasTexture(canvas);
    }

    /**
     * ★秋名名物：麓の旧料金所跡（伊香保料金所ゲート）
     * 頭文字DAC秋名上りスタート / 下りフィニッシュの象徴的ランドマーク
     */
    buildAkinaTollGate() {
        // 配置位置：上りではスタート直後 t = 0.015、下りではゴール直前 t = 0.985
        const targetT = (this.courseType === 'akina_uphill') ? 0.015 : 0.985;
        const sample = this.samples[Math.floor(this.sampleCount * targetT)];
        if (!sample) return;

        const gateGroup = new THREE.Group();
        const pos = sample.pos;
        const tangent = sample.tangent;

        // 1. 中央分離アイランド（コンクリート安全島）
        const islandGeom = new THREE.BoxGeometry(0.9, 0.35, 12.0);
        const zebraTex = this.generateZebraTexture();
        zebraTex.repeat.set(1, 6);
        zebraTex.wrapS = THREE.RepeatWrapping;
        zebraTex.wrapT = THREE.RepeatWrapping;
        const islandMat = new THREE.MeshStandardMaterial({
            map: zebraTex,
            roughness: 0.8
        });
        const island = new THREE.Mesh(islandGeom, islandMat);
        island.position.y = 0.18;
        gateGroup.add(island);

        // 中央アイランド上の警戒ポール（ラバーポール）
        const postGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.85, 8);
        const postMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        for (let zOffset of [-4.5, -1.5, 1.5, 4.5]) {
            const p = new THREE.Mesh(postGeom, postMat);
            p.position.set(0, 0.60, zOffset);
            gateGroup.add(p);
        }

        // 2. 料金所トラス支柱（3基：左路肩、中央アイランド、右路肩）
        const colGeom = new THREE.BoxGeometry(0.45, 5.8, 0.45);
        const trussMat = new THREE.MeshStandardMaterial({
            color: 0x1e4b88, // 頭文字Dらしいディープブルーの鉄骨トラス
            roughness: 0.45,
            metalness: 0.75
        });

        const spanW = this.roadWidth / 2 + 1.2;
        [-spanW, 0, spanW].forEach(xOff => {
            const col = new THREE.Mesh(colGeom, trussMat);
            col.position.set(xOff, 2.9, 0);
            gateGroup.add(col);

            const baseGeom = new THREE.BoxGeometry(0.7, 0.8, 0.7);
            const baseMat = new THREE.MeshStandardMaterial({ color: 0x666b70, roughness: 0.9 });
            const baseMesh = new THREE.Mesh(baseGeom, baseMat);
            baseMesh.position.set(xOff, 0.4, 0);
            gateGroup.add(baseMesh);
        });

        // 3. 上部立体トラス梁（道路横断ビーム）
        const beamW = (spanW + 1.5) * 2;
        const beamGeom = new THREE.BoxGeometry(beamW, 1.2, 2.4);
        const beam = new THREE.Mesh(beamGeom, trussMat);
        beam.position.set(0, 5.6, 0);
        gateGroup.add(beam);

        // 4. キャノピー屋根板（上部トタン・スレート屋根）
        const roofGeom = new THREE.BoxGeometry(beamW + 0.8, 0.15, 6.5);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x3a4248, roughness: 0.7 });
        const roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.set(0, 6.3, 0);
        gateGroup.add(roof);

        // 5. 料金所ゲート看板（前後に設置）
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#0a2e5c';
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 500, 116);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('渋川・伊香保 料金所跡', 256, 48);
        ctx.font = 'bold 28px "Impact", sans-serif';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('AKINA TOLL GATE - SLOW DOWN', 256, 92);

        const signTex = new THREE.CanvasTexture(canvas);
        const signPlaneGeom = new THREE.PlaneGeometry(8.5, 1.8);
        const signMat = new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide });

        const signFwd = new THREE.Mesh(signPlaneGeom, signMat);
        signFwd.position.set(0, 5.6, -1.25);
        gateGroup.add(signFwd);

        const signBwd = new THREE.Mesh(signPlaneGeom, signMat);
        signBwd.position.set(0, 5.6, 1.25);
        signBwd.rotation.y = Math.PI;
        gateGroup.add(signBwd);

        // 黄色警戒灯（キャノピー下の誘導シグナル）
        const lampGeom = new THREE.SphereGeometry(0.18, 8, 8);
        const lampMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        [-3.0, 3.0].forEach(lx => {
            const lamp = new THREE.Mesh(lampGeom, lampMat);
            lamp.position.set(lx, 4.8, -1.3);
            gateGroup.add(lamp);
        });

        gateGroup.position.copy(pos);
        gateGroup.lookAt(pos.clone().add(tangent));
        this.trackGroup.add(gateGroup);
    }

    /**
     * ★秋名名物：県道33号 方面案内青看板（大型オーバーヘッド標識）
     */
    buildAkinaGuideSigns() {
        const isUphill = (this.courseType === 'akina_uphill');
        const signLocations = [
            {
                t: isUphill ? 0.12 : 0.88,
                title: '群馬県道 33',
                line1: '↑ 榛名湖・伊香保温泉 (Harunakoko)',
                line2: '← 渋川市街 (Shibukawa)',
                type: 'overhead'
            },
            {
                t: isUphill ? 0.58 : 0.42,
                title: '急カーブ連続 速度落とせ',
                line1: 'CAUTION! 5 HAIRPINS AHEAD',
                line2: '↑ 榛名山頂 4km (Summit)',
                type: 'roadside'
            }
        ];

        signLocations.forEach(loc => {
            const sample = this.samples[Math.floor(this.sampleCount * loc.t)];
            if (!sample) return;

            const signGroup = new THREE.Group();
            const pos = sample.pos;
            const normal = sample.normal;
            const tangent = sample.tangent;

            if (loc.type === 'overhead') {
                const polePos = pos.clone().add(normal.clone().multiplyScalar(-(this.roadWidth / 2 + 1.2)));
                const poleGeom = new THREE.CylinderGeometry(0.18, 0.20, 6.8, 8);
                const poleMat = new THREE.MeshStandardMaterial({ color: 0x889098, metalness: 0.8 });
                const pole = new THREE.Mesh(poleGeom, poleMat);
                pole.position.y = 3.4;
                signGroup.add(pole);

                const armGeom = new THREE.BoxGeometry(this.roadWidth * 0.75, 0.25, 0.25);
                const arm = new THREE.Mesh(armGeom, poleMat);
                arm.position.set(this.roadWidth * 0.35, 6.2, 0);
                signGroup.add(arm);

                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#0055aa';
                ctx.fillRect(0, 0, 512, 256);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 10;
                ctx.strokeRect(8, 8, 496, 240);

                // 県道33号ヘキサマーク
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(70, 30);
                ctx.lineTo(110, 48);
                ctx.lineTo(110, 88);
                ctx.lineTo(70, 106);
                ctx.lineTo(30, 88);
                ctx.lineTo(30, 48);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#0055aa';
                ctx.font = 'bold 32px "sans-serif"';
                ctx.textAlign = 'center';
                ctx.fillText('33', 70, 78);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px "Hiragino Kaku Gothic ProN", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('榛名湖 / 伊香保温泉', 130, 75);

                ctx.font = 'bold 30px "sans-serif"';
                ctx.fillText(loc.line1, 30, 160);
                ctx.font = 'bold 26px "sans-serif"';
                ctx.fillStyle = '#ffcc00';
                ctx.fillText(loc.line2, 30, 215);

                const tex = new THREE.CanvasTexture(canvas);
                const board = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x0055aa }));
                board.position.set(this.roadWidth * 0.35, 5.6, 0);
                signGroup.add(board);

                const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.3), new THREE.MeshBasicMaterial({ map: tex }));
                textPlane.position.set(this.roadWidth * 0.35, 5.6, 0.06);
                signGroup.add(textPlane);

                signGroup.position.copy(polePos);
                signGroup.lookAt(polePos.clone().sub(tangent));
            } else {
                const roadsidePos = pos.clone().add(normal.clone().multiplyScalar(-(this.roadWidth / 2 + 1.8)));
                const poleGeom = new THREE.CylinderGeometry(0.12, 0.12, 5.2, 8);
                const poleMat = new THREE.MeshStandardMaterial({ color: 0x777e85, metalness: 0.8 });
                const pole1 = new THREE.Mesh(poleGeom, poleMat);
                pole1.position.set(-1.0, 2.6, 0);
                signGroup.add(pole1);
                const pole2 = new THREE.Mesh(poleGeom, poleMat);
                pole2.position.set(1.0, 2.6, 0);
                signGroup.add(pole2);

                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffee00';
                ctx.fillRect(0, 0, 512, 256);
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 10;
                ctx.strokeRect(8, 8, 496, 240);

                ctx.fillStyle = '#000000';
                ctx.font = 'bold 42px "Hiragino Kaku Gothic ProN", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(loc.title, 256, 75);
                ctx.fillStyle = '#dd1111';
                ctx.font = 'bold 32px "Impact", sans-serif';
                ctx.fillText(loc.line1, 256, 150);
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 28px "sans-serif"';
                ctx.fillText(loc.line2, 256, 215);

                const tex = new THREE.CanvasTexture(canvas);
                const board = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.0, 0.1), new THREE.MeshStandardMaterial({ color: 0xffee00 }));
                board.position.set(0, 3.8, 0);
                signGroup.add(board);

                const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.9), new THREE.MeshBasicMaterial({ map: tex }));
                textPlane.position.set(0, 3.8, 0.06);
                signGroup.add(textPlane);

                signGroup.position.copy(roadsidePos);
                signGroup.lookAt(roadsidePos.clone().sub(tangent));
            }

            this.trackGroup.add(signGroup);
        });
    }

    /**
     * ★秋名名物：巨大給水塔（Water Tower）の3Dモデリング
     * 給水塔コーナーのアウト側にそびえ立つ象徴的ランドマーク
     */
    buildAkinaWaterTower() {
        // 下り：山頂高速コーナー外側 t = 0.165 付近
        // 上り：逆走のため山頂手前 t = 1 - 0.165 = 0.835 付近
        const isUphill = (this.courseType === 'akina_uphill');
        const targetT = isUphill ? 0.835 : 0.165;
        const sample = this.samples[Math.floor(this.sampleCount * targetT)];
        if (!sample) return;

        const towerGroup = new THREE.Group();
        const normal = sample.normal;
        const sideOffset = isUphill ? -(this.roadWidth / 2 + 14) : (this.roadWidth / 2 + 14);
        const towerPos = sample.pos.clone().add(normal.clone().multiplyScalar(sideOffset));

        // 1. 円筒コンクリートタワー本体
        const towerGeom = new THREE.CylinderGeometry(6.5, 7.5, 24, 20);
        const towerMat = new THREE.MeshStandardMaterial({
            color: 0xdddddd,
            roughness: 0.6,
            metalness: 0.1
        });
        const tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.y = 12;
        towerGroup.add(tower);

        // 2. 上部貯水タンクキャノピー
        const tankGeom = new THREE.CylinderGeometry(8.5, 7.0, 7, 20);
        const tank = new THREE.Mesh(tankGeom, towerMat);
        tank.position.y = 27;
        towerGroup.add(tank);

        // 3. 円錐屋根
        const roofGeom = new THREE.ConeGeometry(9.2, 4, 20);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.8 });
        const roof = new THREE.Mesh(roofGeom, roofMat);
        roof.position.y = 32.5;
        towerGroup.add(roof);

        // 4. 赤色航空障害灯（トップの赤い点滅灯）
        const beaconGeom = new THREE.SphereGeometry(0.5, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1111 });
        const beacon = new THREE.Mesh(beaconGeom, beaconMat);
        beacon.position.y = 35;
        towerGroup.add(beacon);

        const beaconLight = new THREE.PointLight(0xff2222, 1.5, 40);
        beaconLight.position.y = 35;
        towerGroup.add(beaconLight);

        towerGroup.position.set(towerPos.x, sample.pos.y, towerPos.z);
        this.trackGroup.add(towerGroup);
    }

    /**
     * ★秋名名物：5連ヘアピン標識（下り：1/5〜5/5、上り：5/5〜1/5 動画完全準拠）
     */
    buildHairpinSigns() {
        const isUphill = (this.courseType === 'akina_uphill');
        // 下り：1/5から始まる
        // 上り：頭文字DAC公式動画の通り、麓から登る際は5/5から始まり、第4ヘアピン[GUTTER]を経て1/5へ
        const hairpinT = isUphill ? [
            { t: 0.660, label: '5/5' },
            { t: 0.675, label: '4/5 [GUTTER]' },
            { t: 0.691, label: '3/5' },
            { t: 0.705, label: '2/5' },
            { t: 0.724, label: '1/5' }
        ] : [
            { t: 0.276, label: '1/5' },
            { t: 0.295, label: '2/5' },
            { t: 0.309, label: '3/5' },
            { t: 0.325, label: '4/5 [GUTTER]' },
            { t: 0.340, label: '5/5' }
        ];

        hairpinT.forEach(hp => {
            const sample = this.samples[Math.floor(this.sampleCount * hp.t)];
            if (!sample) return;

            const signGroup = new THREE.Group();
            const side = (sample.curvature >= 0) ? -1 : 1;
            const signPos = sample.pos.clone().add(sample.normal.clone().multiplyScalar((this.roadWidth / 2 + 1.8) * side));

            // ポール
            const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 4.5, 6);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8 });
            const pole = new THREE.Mesh(poleGeom, poleMat);
            pole.position.y = 2.25;
            signGroup.add(pole);

            // 看板板面（黄色に黒枠）
            const boardGeom = new THREE.BoxGeometry(2.4, 1.2, 0.1);
            const boardMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4 });
            const board = new THREE.Mesh(boardGeom, boardMat);
            board.position.y = 4.2;
            signGroup.add(board);

            // アーケード標識文字テクスチャ生成
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(0, 0, 256, 128);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 10;
            ctx.strokeRect(5, 5, 246, 118);
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 36px "Impact", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('HAIRPIN', 128, 48);
            ctx.font = 'bold 44px "Impact", sans-serif';
            ctx.fillStyle = hp.label.includes('GUTTER') ? '#ee1111' : '#000000';
            ctx.fillText(hp.label, 128, 102);

            const textTexture = new THREE.CanvasTexture(canvas);
            const textMat = new THREE.MeshBasicMaterial({ map: textTexture });
            const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.1), textMat);
            textPlane.position.set(0, 4.2, 0.06);
            signGroup.add(textPlane);

            signGroup.position.set(signPos.x, sample.pos.y, signPos.z);
            signGroup.lookAt(signPos.clone().sub(sample.tangent));
            this.trackGroup.add(signGroup);
        });
    }

    /**
     * ★日光第一いろは坂名物：ひらがなコーナー標識（第30号「い」〜第36号「と」）
     */
    buildIrohazakaSigns() {
        const irohaSigns = [
            { t: 0.531, no: '30', kana: 'い' },
            { t: 0.554, no: '31', kana: 'ろ' },
            { t: 0.576, no: '32', kana: 'は' },
            { t: 0.607, no: '33', kana: 'に [JUMP]' }, // 小柏カイ空挺インベタジャンプ
            { t: 0.636, no: '34', kana: 'ほ' },
            { t: 0.678, no: '35', kana: 'へ' },
            { t: 0.707, no: '36', kana: 'と' }
        ];

        irohaSigns.forEach(item => {
            const sample = this.samples[Math.floor(this.sampleCount * item.t)];
            if (!sample) return;

            const signGroup = new THREE.Group();
            const side = (sample.curvature >= 0) ? -1 : 1;
            const signPos = sample.pos.clone().add(sample.normal.clone().multiplyScalar((this.roadWidth / 2 + 1.8) * side));

            // ポール
            const poleGeom = new THREE.CylinderGeometry(0.1, 0.1, 4.5, 6);
            const poleMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8 });
            const pole = new THREE.Mesh(poleGeom, poleMat);
            pole.position.y = 2.25;
            signGroup.add(pole);

            // 看板板面（群青色・白文字のリアル道路標識）
            const boardGeom = new THREE.BoxGeometry(2.4, 1.3, 0.1);
            const boardMat = new THREE.MeshStandardMaterial({ color: 0x003388, roughness: 0.35 });
            const board = new THREE.Mesh(boardGeom, boardMat);
            board.position.y = 4.2;
            signGroup.add(board);

            // テクスチャ描画
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#003388';
            ctx.fillRect(0, 0, 256, 128);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.strokeRect(6, 6, 244, 116);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 26px "sans-serif"';
            ctx.textAlign = 'center';
            ctx.fillText(`第${item.no}コーナー`, 128, 42);

            ctx.font = 'bold 60px "sans-serif"';
            ctx.fillStyle = item.kana.includes('JUMP') ? '#ffcc00' : '#ffffff';
            ctx.fillText(item.kana, 128, 104);

            const textTexture = new THREE.CanvasTexture(canvas);
            const textMat = new THREE.MeshBasicMaterial({ map: textTexture });
            const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.2), textMat);
            textPlane.position.set(0, 4.2, 0.06);
            signGroup.add(textPlane);

            signGroup.position.set(signPos.x, sample.pos.y, signPos.z);
            signGroup.lookAt(signPos.clone().sub(sample.tangent));
            this.trackGroup.add(signGroup);
        });
    }

    /**
     * ★妙義山名物：ダブルヘアピン標識
     */
    buildMyogiSigns() {
        const myogiSigns = [
            { t: 0.122, label: 'DOUBLE HAIRPIN 1/2' },
            { t: 0.165, label: 'DOUBLE HAIRPIN 2/2' },
            { t: 0.495, label: 'LOOP HAIRPIN' },
            { t: 0.848, label: 'SWITCHBACK 1/2' },
            { t: 0.885, label: 'SWITCHBACK 2/2' }
        ];

        myogiSigns.forEach(item => {
            const sample = this.samples[Math.floor(this.sampleCount * item.t)];
            if (!sample) return;

            const signGroup = new THREE.Group();
            const side = (sample.curvature >= 0) ? -1 : 1;
            const signPos = sample.pos.clone().add(sample.normal.clone().multiplyScalar((this.roadWidth / 2 + 1.8) * side));

            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.5, 6), new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8 }));
            pole.position.y = 2.25;
            signGroup.add(pole);

            const board = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.4 }));
            board.position.y = 4.2;
            signGroup.add(board);

            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#cc2222';
            ctx.fillRect(0, 0, 256, 128);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.strokeRect(6, 6, 244, 116);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px "Impact", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('MYOGI TOUGE', 128, 44);

            ctx.font = 'bold 26px "Impact", sans-serif';
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(item.label, 128, 96);

            const textTexture = new THREE.CanvasTexture(canvas);
            const textMat = new THREE.MeshBasicMaterial({ map: textTexture });
            const textPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.1), textMat);
            textPlane.position.set(0, 4.2, 0.06);
            signGroup.add(textPlane);

            signGroup.position.set(signPos.x, sample.pos.y, signPos.z);
            signGroup.lookAt(signPos.clone().sub(sample.tangent));
            this.trackGroup.add(signGroup);
        });
    }

    /**
     * ★碓氷峠名物：国指定重要文化財「めがね橋（碓氷第三橋梁）」完全再現
     * 原作・アニメ・アーケード版準拠：道路をまたぐようにそびえ立ち、車が巨大な4連赤レンガアーチの下をくぐり抜ける！
     * 1892年(明治25年)竣工・日本最大の4連赤レンガ造り鉄道アーチ橋（全長91m・高さ31m・アプト式廃線遺構）
     * 迫石(アーチリング)・要石(キーストーン)・5基の切石基礎テーパー橋脚・帯石・コーニス・バラスト・
     * 走行レール＆アプト式複列ラックレール・第4号/第5号トンネル坑口・手前の展望見学広場・記念石碑
     */
    buildMeganeBridge() {
        const bridgeGroup = new THREE.Group();
        bridgeGroup.name = 'meganeBridgeGroup';

        // マテリアル（赤レンガ・迫石・切石基礎・軌条レール・アプト式ラックレール）
        const brickMat = new THREE.MeshStandardMaterial({
            color: 0x8f3525,
            roughness: 0.82,
            metalness: 0.05
        });
        const darkBrickMat = new THREE.MeshStandardMaterial({
            color: 0x682216,
            roughness: 0.9,
            metalness: 0.05,
            side: THREE.DoubleSide
        });
        const stoneTrimMat = new THREE.MeshStandardMaterial({
            color: 0xdcd7cd,
            roughness: 0.72,
            metalness: 0.08
        });
        const foundationMat = new THREE.MeshStandardMaterial({
            color: 0x6a6660,
            roughness: 0.9
        });
        const ballastMat = new THREE.MeshStandardMaterial({ color: 0x3d3832, roughness: 0.95 });
        const railMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.85 });
        const rackMat = new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.45, metalness: 0.8 });
        const tieMat = new THREE.MeshStandardMaterial({ color: 0x271e16, roughness: 0.92 });
        const mountainMat = new THREE.MeshStandardMaterial({ color: 0x182e20, roughness: 0.95 });

        // 実物寸法（全長91.0m、川底からの高さ約31m、幅7.4m、4径間アーチ）
        const totalLength = 91.0;
        const bridgeWidth = 7.4;
        const archCount = 4;
        const spanPitch = 18.2;
        const archRadius = 7.2;
        
        // 道路面（Y=0基準）からのクリアランス設計：
        // 道路は第2アーチ（局所X = -9.1m）の中心を通過。
        // アーチ湧出線（スプリングライン）: 道路面上6.5m
        // アーチ頂部（クラウン）: 道路面上 6.5 + 7.2 = 13.7m（十分な頭上高さを確保！）
        // 最上部鉄道デッキ: 道路面上 20.5m
        // 橋脚基礎底面: 道路面下 -45.0m（谷底・地中深くにしっかりとアンカー）
        const riverbedY = -45.0;
        const springY = 6.5;
        const crownY = springY + archRadius; // 13.7m
        const deckY = 20.5;

        // 1. 上部スパンドレル壁（アーチ頂部からデッキまでの連続レンガ梁）
        const upperBeamHeight = deckY - crownY; // 6.8m
        const upperBeamGeom = new THREE.BoxGeometry(totalLength, upperBeamHeight, bridgeWidth);
        const upperBeam = new THREE.Mesh(upperBeamGeom, brickMat);
        upperBeam.position.set(0, crownY + upperBeamHeight / 2, 0);
        bridgeGroup.add(upperBeam);

        // 2. スパンドレル曲面ウェッジ（アーチ間の三角レンガ壁）
        for (let p = 1; p < archCount; p++) {
            const archLeftX = (p - 1 - 1.5) * spanPitch;
            const archRightX = (p - 1.5) * spanPitch;

            const wedgeShape = new THREE.Shape();
            wedgeShape.moveTo(archLeftX, crownY);
            const segs = 16;
            for (let s = segs; s >= 0; s--) {
                const angle = Math.PI / 2 * (s / segs);
                const x = archLeftX + Math.cos(angle) * archRadius;
                const y = springY + Math.sin(angle) * archRadius;
                wedgeShape.lineTo(x, y);
            }
            wedgeShape.lineTo(archRightX - archRadius, springY);
            for (let s = 0; s <= segs; s++) {
                const angle = Math.PI - Math.PI / 2 * (s / segs);
                const x = archRightX + Math.cos(angle) * archRadius;
                const y = springY + Math.sin(angle) * archRadius;
                wedgeShape.lineTo(x, y);
            }
            wedgeShape.lineTo(archLeftX, crownY);
            wedgeShape.closePath();

            const wedgeGeom = new THREE.ExtrudeGeometry(wedgeShape, { depth: bridgeWidth, bevelEnabled: false });
            wedgeGeom.translate(0, 0, -bridgeWidth / 2);
            bridgeGroup.add(new THREE.Mesh(wedgeGeom, brickMat));
        }

        // 両端アバットメント壁
        const leftArchX = (0 - 1.5) * spanPitch;
        const rightArchX = (3 - 1.5) * spanPitch;

        const leftAbutShape = new THREE.Shape();
        leftAbutShape.moveTo(-totalLength / 2, crownY);
        leftAbutShape.lineTo(leftArchX, crownY);
        for (let s = 0; s <= 16; s++) {
            const angle = Math.PI / 2 + Math.PI / 2 * (s / 16);
            const x = leftArchX + Math.cos(angle) * archRadius;
            const y = springY + Math.sin(angle) * archRadius;
            leftAbutShape.lineTo(x, y);
        }
        leftAbutShape.lineTo(-totalLength / 2, springY);
        leftAbutShape.closePath();
        const leftAbutGeom = new THREE.ExtrudeGeometry(leftAbutShape, { depth: bridgeWidth, bevelEnabled: false });
        leftAbutGeom.translate(0, 0, -bridgeWidth / 2);
        bridgeGroup.add(new THREE.Mesh(leftAbutGeom, brickMat));

        const rightAbutShape = new THREE.Shape();
        rightAbutShape.moveTo(totalLength / 2, crownY);
        rightAbutShape.lineTo(totalLength / 2, springY);
        rightAbutShape.lineTo(rightArchX + archRadius, springY);
        for (let s = 0; s <= 16; s++) {
            const angle = Math.PI / 2 * (s / 16);
            const x = rightArchX + Math.cos(angle) * archRadius;
            const y = springY + Math.sin(angle) * archRadius;
            rightAbutShape.lineTo(x, y);
        }
        rightAbutShape.closePath();
        const rightAbutGeom = new THREE.ExtrudeGeometry(rightAbutShape, { depth: bridgeWidth, bevelEnabled: false });
        rightAbutGeom.translate(0, 0, -bridgeWidth / 2);
        bridgeGroup.add(new THREE.Mesh(rightAbutGeom, brickMat));

        // 3. 真正な中空4連半円アーチヴォールト（筒状レンガ天井）
        for (let i = 0; i < archCount; i++) {
            const archX = (i - 1.5) * spanPitch;
            const vaultGeom = new THREE.CylinderGeometry(archRadius, archRadius, bridgeWidth, 36, 1, true, -Math.PI / 2, Math.PI);
            vaultGeom.rotateX(Math.PI / 2);
            vaultGeom.rotateZ(Math.PI);
            const vaultMesh = new THREE.Mesh(vaultGeom, darkBrickMat);
            vaultMesh.position.set(archX, springY, 0);
            bridgeGroup.add(vaultMesh);

            // 前後両面の迫石アーチリング（Voussoirs）
            for (let side of [-bridgeWidth / 2 - 0.04, bridgeWidth / 2 + 0.04]) {
                const ringGeom = new THREE.RingGeometry(archRadius - 0.02, archRadius + 0.85, 36, 1, 0, Math.PI);
                const ringMesh = new THREE.Mesh(ringGeom, stoneTrimMat);
                ringMesh.position.set(archX, springY, side);
                if (side < 0) ringMesh.rotation.y = Math.PI;
                bridgeGroup.add(ringMesh);

                // 頂部要石（Keystone）
                const keystone = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.5, 0.2), stoneTrimMat);
                keystone.position.set(archX, crownY + 0.45, side + (side > 0 ? 0.08 : -0.08));
                bridgeGroup.add(keystone);
            }
        }

        // 4. 5本の巨大レンガ橋脚（谷底深く-45mまでアンカー・車道周辺の安全クリアランス確保）
        for (let p = 0; p < 5; p++) {
            const pierX = (p - 2) * spanPitch;
            const pierGroup = new THREE.Group();

            // 基礎切石（谷底深くに配置）
            const b1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.0, bridgeWidth + 2.0), foundationMat);
            b1.position.y = riverbedY + 2.0;
            pierGroup.add(b1);

            const b2 = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.0, bridgeWidth + 1.4), stoneTrimMat);
            b2.position.y = riverbedY + 5.5;
            pierGroup.add(b2);

            // 橋脚本体（テーパー形状・谷底深部から立ち上げ）
            const pierBottomY = riverbedY + 7.0; // -38.0m
            const bodyHeight = springY - pierBottomY; // 44.5m
            const pierGeom = new THREE.CylinderGeometry(1.7, 2.5, bodyHeight, 4, 1);
            pierGeom.rotateY(Math.PI / 4);
            pierGeom.scale(1.0, 1.0, (bridgeWidth + 0.5) / 3.4);
            const pierBody = new THREE.Mesh(pierGeom, brickMat);
            pierBody.position.y = pierBottomY + bodyHeight / 2;
            pierGroup.add(pierBody);

            // 帯石（道路通過ラインと干渉しないよう地下とアーチ直下に配置）
            for (let yBand of [-18.0, -8.0, 3.8]) {
                const band = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.45, bridgeWidth + 0.7), stoneTrimMat);
                band.position.y = yBand;
                pierGroup.add(band);
            }

            // 迫台（Impost Capital）
            const impost = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.65, bridgeWidth + 0.8), stoneTrimMat);
            impost.position.y = springY - 0.32;
            pierGroup.add(impost);

            pierGroup.position.set(pierX, 0, 0);
            bridgeGroup.add(pierGroup);
        }

        // 5. 上部鉄道デッキ「アプトの道」（蛇腹コーニス・バラスト・枕木・軌条・アプト式ラックレール）
        for (let side of [-bridgeWidth / 2, bridgeWidth / 2]) {
            const cornice = new THREE.Mesh(new THREE.BoxGeometry(totalLength + 1.0, 0.55, 0.45), stoneTrimMat);
            cornice.position.set(0, deckY + 0.28, side + (side > 0 ? 0.2 : -0.2));
            bridgeGroup.add(cornice);
        }

        const ballast = new THREE.Mesh(new THREE.BoxGeometry(totalLength + 1.5, 0.65, bridgeWidth - 0.6), ballastMat);
        ballast.position.set(0, deckY + 0.33, 0);
        bridgeGroup.add(ballast);

        for (let side of [-bridgeWidth / 2 + 0.25, bridgeWidth / 2 - 0.25]) {
            const parapet = new THREE.Mesh(new THREE.BoxGeometry(totalLength + 1.5, 1.25, 0.45), brickMat);
            parapet.position.set(0, deckY + 1.2, side);
            bridgeGroup.add(parapet);

            const coping = new THREE.Mesh(new THREE.BoxGeometry(totalLength + 2.0, 0.2, 0.6), stoneTrimMat);
            coping.position.set(0, deckY + 1.9, side);
            bridgeGroup.add(coping);
        }

        const tieGeom = new THREE.BoxGeometry(0.22, 0.18, 2.5);
        for (let tx = -totalLength / 2 + 2; tx <= totalLength / 2 - 2; tx += 1.3) {
            const tie = new THREE.Mesh(tieGeom, tieMat);
            tie.position.set(tx, deckY + 0.72, 0);
            bridgeGroup.add(tie);
        }

        for (let rz of [-0.53, 0.53]) {
            const rail = new THREE.Mesh(new THREE.BoxGeometry(totalLength + 2.0, 0.2, 0.1), railMat);
            rail.position.set(0, deckY + 0.9, rz);
            bridgeGroup.add(rail);
        }

        // 中央アプト式複列ラックレール（歯条レール）
        for (let rk of [-0.07, 0.07]) {
            const rack = new THREE.Mesh(new THREE.BoxGeometry(totalLength + 2.0, 0.16, 0.05), rackMat);
            rack.position.set(0, deckY + 0.92, rk);
            bridgeGroup.add(rack);
        }

        // 6. 両端の雄大な山肌＆歴史的「第4号・第5号トンネル坑口」
        for (let px of [-totalLength / 2 - 0.5, totalLength / 2 + 0.5]) {
            const portalGroup = new THREE.Group();
            const pWall = new THREE.Mesh(new THREE.BoxGeometry(1.5, 10.0, 9.0), brickMat);
            pWall.position.set(0, deckY + 4.5, 0);
            portalGroup.add(pWall);

            const pArch = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 2.0, 24, 1, false, 0, Math.PI), darkBrickMat);
            pArch.rotateZ(Math.PI / 2);
            pArch.position.set(0, deckY + 3.2, 0);
            portalGroup.add(pArch);

            const pIn = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 14.0, 24, 1, true), darkBrickMat);
            pIn.rotateZ(Math.PI / 2);
            pIn.position.set(px < 0 ? -7.0 : 7.0, deckY + 3.2, 0);
            portalGroup.add(pIn);

            // 谷底からそびえ立つ重厚な山肌尾根
            const mRidge1 = new THREE.Mesh(new THREE.ConeGeometry(45, 95, 14), mountainMat);
            mRidge1.position.set(px < 0 ? -22 : 22, deckY - 15, 0);
            portalGroup.add(mRidge1);

            const mRidge2 = new THREE.Mesh(new THREE.ConeGeometry(38, 80, 12), mountainMat);
            mRidge2.position.set(px < 0 ? -30 : 30, deckY - 10, px < 0 ? 18 : -18);
            portalGroup.add(mRidge2);

            portalGroup.position.set(px, 0, 0);
            bridgeGroup.add(portalGroup);
        }

        // 7. 側方アーチ下の谷底景観（針葉樹林・碓氷川清流）
        const treeTrunkMat = new THREE.MeshStandardMaterial({ color: 0x3d271d, roughness: 0.9 });
        const treeFoliageMat = new THREE.MeshStandardMaterial({ color: 0x1c3822, roughness: 0.85 });
        const treeTrunkGeom = new THREE.CylinderGeometry(0.3, 0.45, 7.0, 6);
        const treeFoliageGeom = new THREE.ConeGeometry(2.8, 8.5, 7);

        for (let archIdx of [0, 2, 3]) {
            const archCenterX = (archIdx - 1.5) * spanPitch;
            for (let t = 0; t < 5; t++) {
                const tx = archCenterX + ((t * 37) % 11 - 5.5);
                const tz = ((t * 53) % 30 - 15) + (t % 2 === 0 ? 12 : -12);
                const ty = riverbedY + 8.0 + (t * 1.5);

                const tg = new THREE.Group();
                const trunk = new THREE.Mesh(treeTrunkGeom, treeTrunkMat);
                trunk.position.y = 3.5;
                tg.add(trunk);
                const foliage = new THREE.Mesh(treeFoliageGeom, treeFoliageMat);
                foliage.position.y = 9.0;
                tg.add(foliage);

                tg.position.set(tx, ty, tz);
                bridgeGroup.add(tg);
            }
        }

        const waterMat = new THREE.MeshStandardMaterial({ color: 0x1d3d44, roughness: 0.2, metalness: 0.4 });
        const river = new THREE.Mesh(new THREE.BoxGeometry(totalLength + 40, 0.5, 20), waterMat);
        river.position.set(0, riverbedY + 1.0, 0);
        bridgeGroup.add(river);

        // 8. 道路をまたぐ精密正規直交配置（t = 0.560の道路直上に第2アーチが跨がるよう架橋）
        const crossingSample = this.samples[Math.floor(this.sampleCount * 0.220)];
        if (crossingSample) {
            const tanHoriz = new THREE.Vector3(crossingSample.tangent.x, 0, crossingSample.tangent.z).normalize();
            const up = new THREE.Vector3(0, 1, 0);
            const xBridge = new THREE.Vector3().crossVectors(up, tanHoriz).normalize(); // 道路右方向の正規ベクトル

            // 橋梁ローカルX軸の第2アーチ中心（X = -9.1m）を道路中心に一致させるオフセット
            const bridgePos = crossingSample.pos.clone().add(xBridge.clone().multiplyScalar(9.1));
            bridgePos.y = crossingSample.pos.y; // 道路面高さに基準点を設定

            bridgeGroup.position.copy(bridgePos);

            // 右手系正規直交基底（det = +1）で道路進行方向に厚み・直交方向に長手方向を回転整合
            const rotMatrix = new THREE.Matrix4();
            rotMatrix.makeBasis(xBridge, up, tanHoriz);
            bridgeGroup.setRotationFromMatrix(rotMatrix);

            this.trackGroup.add(bridgeGroup);
        }

        // ★アプローチ手前（t = 0.548）：めがね橋記念案内看板＆展望広場
        const signSample = this.samples[Math.floor(this.sampleCount * 0.208)];
        if (signSample) {
            const plazaGroup = new THREE.Group();
            const nor = new THREE.Vector3(signSample.normal.x, 0, signSample.normal.z).normalize();
            const tan = new THREE.Vector3(signSample.tangent.x, 0, signSample.tangent.z).normalize();

            // 道路脇の展望テラス
            const turnoutMat = new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.85 });
            const turnout = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.3, 16.0), turnoutMat);
            turnout.position.set(2.0, 0.15, 0);
            plazaGroup.add(turnout);

            // 木柵
            const woodMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.85 });
            for (let wz = -7; wz <= 7; wz += 2.4) {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), woodMat);
                post.position.set(3.8, 0.75, wz);
                plazaGroup.add(post);
            }
            const railTop = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 15.0), woodMat);
            railTop.position.set(3.8, 1.3, 0);
            plazaGroup.add(railTop);

            // 国指定重要文化財「碓氷第三橋梁 めがね橋」記念石碑
            const steleStone = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.0, 2.4), new THREE.MeshStandardMaterial({ color: 0x88847a, roughness: 0.9 }));
            steleStone.position.set(2.8, 1.15, -2.0);
            plazaGroup.add(steleStone);

            const stCanvas = document.createElement('canvas');
            stCanvas.width = 512;
            stCanvas.height = 256;
            const sctx = stCanvas.getContext('2d');
            sctx.fillStyle = '#222220';
            sctx.fillRect(0, 0, 512, 256);
            sctx.strokeStyle = '#c5a059';
            sctx.lineWidth = 10;
            sctx.strokeRect(8, 8, 496, 240);
            sctx.fillStyle = '#f0ebe1';
            sctx.font = 'bold 36px "serif"';
            sctx.textAlign = 'center';
            sctx.fillText('国指定重要文化財', 256, 60);
            sctx.font = '900 52px "serif"';
            sctx.fillStyle = '#ffcc44';
            sctx.fillText('碓氷第三橋梁 (めがね橋)', 256, 130);
            sctx.font = 'bold 26px "sans-serif"';
            sctx.fillStyle = '#d0ccc0';
            sctx.fillText('1892年(明治25年)竣工・アプト式廃線遺構', 256, 185);
            sctx.fillText('日本最大の4連煉瓦造アーチ鉄道橋 (全長91m・高31m)', 256, 222);

            const plaqueTexture = new THREE.CanvasTexture(stCanvas);
            const plaqueMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.05), new THREE.MeshBasicMaterial({ map: plaqueTexture }));
            plaqueMesh.position.set(2.38, 1.25, -2.0);
            plaqueMesh.rotateY(-Math.PI / 2);
            plazaGroup.add(plaqueMesh);

            plazaGroup.position.copy(signSample.pos).add(nor.clone().multiplyScalar(-this.roadWidth / 2 - 0.2));
            plazaGroup.position.y = signSample.pos.y;
            plazaGroup.lookAt(plazaGroup.position.clone().add(tan));
            this.trackGroup.add(plazaGroup);
        }
    }

    /**
     * ★碓氷峠名物：超高速難所「C-121コーナー」＆「おぎのや」看板
     */
    buildUsuiSigns() {
        // 1. C-121 警告標識 (t = 0.38)
        const c121Sample = this.samples[Math.floor(this.sampleCount * 0.885)];
        if (c121Sample) {
            const signGroup = new THREE.Group();
            const signPos = c121Sample.pos.clone().add(c121Sample.normal.clone().multiplyScalar(this.roadWidth / 2 + 1.8));

            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.5, 6), new THREE.MeshStandardMaterial({ color: 0x777777 }));
            pole.position.y = 2.75;
            signGroup.add(pole);

            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffcc00';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 14;
            ctx.strokeRect(8, 8, 240, 240);
            ctx.fillStyle = '#000000';
            ctx.font = '900 68px "Impact", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('C-121', 128, 90);
            ctx.font = 'bold 30px "sans-serif"';
            ctx.fillStyle = '#cc0000';
            ctx.fillText('超難関 減速！', 128, 145);
            ctx.font = 'bold 26px "Impact", sans-serif';
            ctx.fillStyle = '#000000';
            ctx.fillText('CRITICAL DRIFT', 128, 195);
            ctx.fillText('>>>', 128, 235);

            const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 0.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
            board.position.y = 4.2;
            signGroup.add(board);

            signGroup.position.set(signPos.x, c121Sample.pos.y, signPos.z);
            signGroup.lookAt(signPos.clone().add(c121Sample.tangent));
            this.trackGroup.add(signGroup);
        }

        // 2. おぎのや 峠の釜めし 看板 (t = 0.78)
        const oginoyaSample = this.samples[Math.floor(this.sampleCount * 0.78)];
        if (oginoyaSample) {
            const signGroup = new THREE.Group();
            const signPos = oginoyaSample.pos.clone().add(oginoyaSample.normal.clone().multiplyScalar(-(this.roadWidth / 2 + 2.5)));

            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#a62b2b';
            ctx.fillRect(0, 0, 512, 128);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.strokeRect(6, 6, 500, 116);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 44px "sans-serif"';
            ctx.textAlign = 'center';
            ctx.fillText('元祖 峠の釜めし おぎのや', 256, 55);
            ctx.font = 'bold 28px "Impact", sans-serif';
            ctx.fillStyle = '#ffea9f';
            ctx.fillText('OGINOYA TOUGE KAMAMESHI - YOKOKAWA', 256, 102);

            const board = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.2, 0.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
            board.position.y = 3.5;
            signGroup.add(board);

            const p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.0, 6), new THREE.MeshStandardMaterial({ color: 0x666666 }));
            p1.position.set(-1.8, 2.0, 0);
            signGroup.add(p1);
            const p2 = p1.clone();
            p2.position.set(1.8, 2.0, 0);
            signGroup.add(p2);

            signGroup.position.set(signPos.x, oginoyaSample.pos.y, signPos.z);
            signGroup.lookAt(signPos.clone().add(oginoyaSample.tangent));
            this.trackGroup.add(signGroup);
        }
    }

    /**
     * ★赤城山名物：赤城大鳥居（Grand Torii Gate）
     * スタート直後に道路をまたぐ巨大な朱色の神道大鳥居
     */
    buildAkagiTorii() {
        const sample = this.samples[Math.floor(this.sampleCount * 0.025)];
        if (!sample) return;

        const toriiGroup = new THREE.Group();
        const halfW = this.roadWidth / 2 + 1.8;
        const vermilionMat = new THREE.MeshStandardMaterial({ color: 0xc42010, roughness: 0.45 });
        const blackMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.6 });

        // 主柱 2本
        const postGeom = new THREE.CylinderGeometry(0.55, 0.65, 12, 12);
        const pLeft = new THREE.Mesh(postGeom, vermilionMat);
        pLeft.position.set(-halfW, 6, 0);
        toriiGroup.add(pLeft);

        const pRight = new THREE.Mesh(postGeom, vermilionMat);
        pRight.position.set(halfW, 6, 0);
        toriiGroup.add(pRight);

        // 笠木・島木（最上部横木）
        const kasagiGeom = new THREE.BoxGeometry(halfW * 2 + 5.5, 0.9, 1.2);
        const kasagi = new THREE.Mesh(kasagiGeom, blackMat);
        kasagi.position.y = 12.2;
        toriiGroup.add(kasagi);

        // 貫（下部水平貫通木）
        const nukiGeom = new THREE.BoxGeometry(halfW * 2 + 4.0, 0.7, 0.7);
        const nuki = new THREE.Mesh(nukiGeom, vermilionMat);
        nuki.position.y = 9.8;
        toriiGroup.add(nuki);

        // 額束（中央神額「赤城神社」）
        const plaqueCanvas = document.createElement('canvas');
        plaqueCanvas.width = 128;
        plaqueCanvas.height = 256;
        const ctx = plaqueCanvas.getContext('2d');
        ctx.fillStyle = '#111111';
        ctx.fillRect(0, 0, 128, 256);
        ctx.strokeStyle = '#c5a059';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 120, 248);
        ctx.fillStyle = '#e6c875';
        ctx.font = 'bold 36px "serif"';
        ctx.textAlign = 'center';
        ctx.fillText('赤', 64, 60);
        ctx.fillText('城', 64, 115);
        ctx.fillText('神', 64, 170);
        ctx.fillText('社', 64, 225);

        const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.15), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(plaqueCanvas) }));
        plaque.position.set(0, 11.0, 0.4);
        toriiGroup.add(plaque);

        toriiGroup.position.set(sample.pos.x, sample.pos.y, sample.pos.z);
        toriiGroup.lookAt(sample.pos.clone().add(sample.tangent));
        this.trackGroup.add(toriiGroup);
    }

    /**
     * ★赤城山名物：悪魔のV字コーナー＆レッドサンズ看板
     */
    buildAkagiSigns() {
        // 1. 悪魔のV字コーナー警告看板 (t = 0.44)
        const vSample = this.samples[Math.floor(this.sampleCount * 0.44)];
        if (vSample) {
            const signGroup = new THREE.Group();
            const signPos = vSample.pos.clone().add(vSample.normal.clone().multiplyScalar(-(this.roadWidth / 2 + 1.8)));

            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff1111';
            ctx.fillRect(0, 0, 256, 256);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 12;
            ctx.strokeRect(8, 8, 240, 240);
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 52px "Impact", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('CAUTION!', 128, 70);
            ctx.font = 'bold 30px "sans-serif"';
            ctx.fillText('悪魔のV字コーナー', 128, 125);
            ctx.font = 'bold 24px "Impact", sans-serif';
            ctx.fillStyle = '#ffea00';
            ctx.fillText('SHARP V-TURN >>', 128, 175);
            ctx.fillText('FULL BRAKE!', 128, 220);

            const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 0.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
            board.position.y = 4.2;
            signGroup.add(board);

            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.5, 6), new THREE.MeshStandardMaterial({ color: 0x777777 }));
            pole.position.y = 2.75;
            signGroup.add(pole);

            signGroup.position.set(signPos.x, vSample.pos.y, signPos.z);
            signGroup.lookAt(signPos.clone().add(vSample.tangent));
            this.trackGroup.add(signGroup);
        }

        // 2. 赤城レッドサンズ 看板 (t = 0.18)
        const rsSample = this.samples[Math.floor(this.sampleCount * 0.18)];
        if (rsSample) {
            const signGroup = new THREE.Group();
            const signPos = rsSample.pos.clone().add(rsSample.normal.clone().multiplyScalar(this.roadWidth / 2 + 2.4));

            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#111111';
            ctx.fillRect(0, 0, 512, 128);
            ctx.strokeStyle = '#eedd22';
            ctx.lineWidth = 8;
            ctx.strokeRect(6, 6, 500, 116);
            ctx.fillStyle = '#eedd22';
            ctx.font = '900 48px "Impact", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('AKAGI RED SUNS', 256, 55);
            ctx.font = 'bold 24px "sans-serif"';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('赤城レッドサンズ 本拠地', 256, 100);

            const board = new THREE.Mesh(new THREE.BoxGeometry(5.0, 1.2, 0.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
            board.position.y = 3.6;
            signGroup.add(board);

            signGroup.position.set(signPos.x, rsSample.pos.y, signPos.z);
            signGroup.lookAt(signPos.clone().add(rsSample.tangent));
            this.trackGroup.add(signGroup);
        }
    }

    /**
     * ★八方ヶ原名物：スネークブリッジ（鉄骨トラス大橋 2基）
     * 谷間に架かる迫力の赤/緑鉄骨トラス構造
     */
    buildSnakeBridges() {
        const bridgeT = [0.05, 0.46]; // スネーク第1橋 & 第2橋 & 第2橋

        bridgeT.forEach((t, idx) => {
            const sample = this.samples[Math.floor(this.sampleCount * t)];
            if (!sample) return;

            const bridgeGroup = new THREE.Group();
            const halfW = this.roadWidth / 2 + 0.6;
            const spanLen = 48; // 橋長48m
            const trussH = 5.5; // トラス高5.5m

            const steelMat = new THREE.MeshStandardMaterial({
                color: idx === 0 ? 0xa02218 : 0x225533, // 第1橋は赤鉄骨、第2橋は緑鉄骨
                metalness: 0.8,
                roughness: 0.35
            });

            // 左右のトラス構台
            for (let sideMul of [-1, 1]) {
                const sideX = sideMul * halfW;

                // 上弦材（上部水平梁）
                const topBeam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, spanLen), steelMat);
                topBeam.position.set(sideX, trussH, 0);
                bridgeGroup.add(topBeam);

                // 垂直柱（Vertical Posts）5本
                for (let p = -2; p <= 2; p++) {
                    const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, trussH, 0.3), steelMat);
                    post.position.set(sideX, trussH / 2, p * 11);
                    bridgeGroup.add(post);

                    // 斜材（Diagonals）
                    if (p < 2) {
                        const diag = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 12.5), steelMat);
                        diag.position.set(sideX, trussH / 2, (p + 0.5) * 11);
                        diag.rotation.x = Math.atan2(trussH, 11) * (p % 2 === 0 ? 1 : -1);
                        bridgeGroup.add(diag);
                    }
                }
            }

            // 橋梁下部コンクリート橋脚
            const pierMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
            const pierL = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 20, 8), pierMat);
            pierL.position.set(-halfW, -10, 0);
            bridgeGroup.add(pierL);

            const pierR = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 20, 8), pierMat);
            pierR.position.set(halfW, -10, 0);
            bridgeGroup.add(pierR);

            // 橋名板看板
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#1c2826';
            ctx.fillRect(0, 0, 256, 64);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px "sans-serif"';
            ctx.textAlign = 'center';
            ctx.fillText(`スネーク第${idx + 1}橋`, 128, 42);

            const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
            signBoard.position.set(0, trussH + 0.5, -spanLen / 2);
            bridgeGroup.add(signBoard);

            bridgeGroup.position.set(sample.pos.x, sample.pos.y, sample.pos.z);
            bridgeGroup.lookAt(sample.pos.clone().add(sample.tangent));
            this.trackGroup.add(bridgeGroup);
        });
    }

    /**
     * ★八方ヶ原名物：東堂塾（TODO JUKU）エリア看板＆ランドマーク標識群
     */
    buildHappoSigns() {
        const signData = [
            { t: 0.08, title: 'TODO JUKU RACING SCHOOL', sub: '東堂塾 ホームコース 八方ヶ原', color: '#e6af2e', bg: '#0a192f', w: 4.6, h: 1.2 },
            { t: 0.28, title: 'スネークマルチヘアピン', sub: 'SNAKE 4-HAIRPINS SECTION', color: '#ff4444', bg: '#1c1c24', w: 4.2, h: 1.2 },
            { t: 0.535, title: 'スネーク第2橋 接近', sub: 'SNAKE BRIDGE 2 (谷渡り緑トラス大橋)', color: '#22cc88', bg: '#1c2826', w: 4.4, h: 1.2 },
            { t: 0.639, title: '折り返しシケイン', sub: 'HORSESHOE PAPERCLIP CHICANE', color: '#ffaa00', bg: '#1c1c24', w: 4.4, h: 1.2 },
            { t: 0.934, title: '最終160°大ヘアピン', sub: 'FINAL HAIRPIN (急勾配ラストスパート)', color: '#ee2222', bg: '#2b0000', w: 4.4, h: 1.2 }
        ];

        signData.forEach(item => {
            const sample = this.samples[Math.floor(this.sampleCount * item.t)];
            if (!sample) return;

            const signGroup = new THREE.Group();
            const signPos = sample.pos.clone().add(sample.normal.clone().multiplyScalar(this.roadWidth / 2 + 2.2));

            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = item.bg;
            ctx.fillRect(0, 0, 512, 128);
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 8;
            ctx.strokeRect(6, 6, 500, 116);
            ctx.fillStyle = item.color;
            ctx.font = '900 42px "Impact", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.title, 256, 54);
            ctx.font = 'bold 24px "sans-serif"';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(item.sub, 256, 100);

            const board = new THREE.Mesh(new THREE.BoxGeometry(item.w, item.h, 0.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
            board.position.y = 3.5;
            signGroup.add(board);

            signGroup.position.set(signPos.x, sample.pos.y, signPos.z);
            signGroup.lookAt(signPos.clone().add(sample.tangent));
            this.trackGroup.add(signGroup);
        });
    }

    /**
     * ★椿ライン名物：七曲り（7連続ヘアピン 1/7〜7/7標識）
     */
    buildTsubakiSevenHairpins() {
        const hairpinT = [0.798, 0.817, 0.855, 0.880, 0.896, 0.938, 0.956];

        hairpinT.forEach((t, idx) => {
            const sample = this.samples[Math.floor(this.sampleCount * t)];
            if (!sample) return;

            const signGroup = new THREE.Group();
            const side = (sample.curvature >= 0) ? -1 : 1;
            const signPos = sample.pos.clone().add(sample.normal.clone().multiplyScalar((this.roadWidth / 2 + 1.8) * side));

            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0d47a1';
            ctx.fillRect(0, 0, 256, 128);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 8;
            ctx.strokeRect(6, 6, 244, 116);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px "sans-serif"';
            ctx.textAlign = 'center';
            ctx.fillText('七曲り', 128, 42);
            ctx.font = '900 48px "Impact", sans-serif';
            ctx.fillStyle = '#ffeb3b';
            ctx.fillText(`${idx + 1}/7 HAIRPIN`, 128, 102);

            const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 0.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
            board.position.y = 4.0;
            signGroup.add(board);

            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.5, 6), new THREE.MeshStandardMaterial({ color: 0x777777 }));
            pole.position.y = 2.25;
            signGroup.add(pole);

            signGroup.position.set(signPos.x, sample.pos.y, signPos.z);
            signGroup.lookAt(signPos.clone().add(sample.tangent));
            this.trackGroup.add(signGroup);
        });
    }

    /**
     * ★椿ライン名物：大観山展望モニュメント＆しとどの窟看板
     */
    buildTsubakiMonuments() {
        // 大観山展望モニュメント (t = 0.015)
        const dSample = this.samples[Math.floor(this.sampleCount * 0.015)];
        if (dSample) {
            const mGroup = new THREE.Group();
            const mPos = dSample.pos.clone().add(dSample.normal.clone().multiplyScalar(this.roadWidth / 2 + 4.5));

            // 石碑
            const stoneGeom = new THREE.BoxGeometry(3.5, 5.0, 1.2);
            const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a5d60, roughness: 0.9 });
            const stone = new THREE.Mesh(stoneGeom, stoneMat);
            stone.position.y = 2.5;
            mGroup.add(stone);

            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#3a3d40';
            ctx.fillRect(0, 0, 256, 256);
            ctx.fillStyle = '#f0f0f0';
            ctx.font = 'bold 30px "serif"';
            ctx.textAlign = 'center';
            ctx.fillText('箱根 大観山', 128, 60);
            ctx.font = 'bold 22px "serif"';
            ctx.fillText('標高 1,015m', 128, 110);
            ctx.font = 'bold 20px "sans-serif"';
            ctx.fillStyle = '#ffcc00';
            ctx.fillText('富士山・芦ノ湖 眺望', 128, 160);
            ctx.fillText('椿ライン START', 128, 210);

            const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 3.0), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) }));
            plaque.position.set(0, 2.5, 0.65);
            mGroup.add(plaque);

            mGroup.position.set(mPos.x, dSample.pos.y, mPos.z);
            mGroup.lookAt(mPos.clone().add(dSample.tangent));
            this.trackGroup.add(mGroup);
        }
    }

    /**
     * ★減速帯用ゼブラ（赤茶・オレンジ）テクスチャ
     */
    generateDecelStripeTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 128, 256);

        // 赤茶色・鮮烈オレンジのラブルストリップ
        const stripeH = 16;
        for (let y = 0; y < 256; y += stripeH * 2) {
            ctx.fillStyle = '#b82810';
            ctx.fillRect(4, y, 120, stripeH);
            ctx.fillStyle = '#ff6611';
            ctx.fillRect(8, y + 2, 112, 4);
        }
        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        return tex;
    }

    /**
     * ★カーブ手前のリアル減速帯（ゼブラ・ラブルストリップ）配置
     * 動画（秋名上り）および各コースの急カーブ手前にのみピンポイント敷設
     */
    buildDecelerationBands() {
        const decelRanges = [];
        const isAkinaUphill = (this.courseType === 'akina_uphill');
        const isAkinaDownhill = (this.courseType === 'akina');

        if (isAkinaUphill) {
            // 秋名上り動画に登場する減速帯の精確な区間
            decelRanges.push(
                { startT: 0.142, endT: 0.158 }, // S字手前
                { startT: 0.315, endT: 0.332 }, // 第1中速コーナー手前
                { startT: 0.435, endT: 0.452 }, // 複合コーナー手前
                { startT: 0.648, endT: 0.658 }, // 5/5ヘアピン手前
                { startT: 0.666, endT: 0.674 }, // 4/5ヘアピン手前
                { startT: 0.682, endT: 0.690 }, // 3/5ヘアピン手前
                { startT: 0.698, endT: 0.704 }, // 2/5ヘアピン手前
                { startT: 0.716, endT: 0.723 }, // 1/5ヘアピン手前
                { startT: 0.832, endT: 0.842 }, // 給水塔後 高速コーナー手前
                { startT: 0.902, endT: 0.912 }  // 山頂直前コーナー手前
            );
        } else if (isAkinaDownhill) {
            decelRanges.push(
                { startT: 0.088, endT: 0.098 },
                { startT: 0.158, endT: 0.168 },
                { startT: 0.268, endT: 0.275 }, // 1/5ヘアピン手前
                { startT: 0.287, endT: 0.294 }, // 2/5ヘアピン手前
                { startT: 0.302, endT: 0.308 }, // 3/5ヘアピン手前
                { startT: 0.318, endT: 0.324 }, // 4/5ヘアピン手前
                { startT: 0.333, endT: 0.339 }, // 5/5ヘアピン手前
                { startT: 0.540, endT: 0.555 },
                { startT: 0.670, endT: 0.685 },
                { startT: 0.845, endT: 0.858 }
            );
        } else {
            // 他コース：曲率の高いコーナー手前25m〜45mを自動検出
            const N = this.samples.length;
            for (let i = 20; i < N - 40; i += 15) {
                const ahead = this.samples[i + 15];
                if (ahead && ahead.curvature > 0.0035 && this.samples[i].curvature < 0.0022) {
                    const startT = Math.max(0.01, (i - 12) / N);
                    const endT = i / N;
                    decelRanges.push({ startT, endT });
                }
            }
        }

        if (decelRanges.length === 0) return;

        const decelTex = this.generateDecelStripeTexture();
        const decelMat = new THREE.MeshStandardMaterial({
            map: decelTex,
            roughness: 0.7,
            metalness: 0.1,
            transparent: true,
            side: THREE.DoubleSide
        });

        const halfW = (this.roadWidth * 0.86) / 2;

        decelRanges.forEach(range => {
            const startIdx = Math.floor(range.startT * this.sampleCount);
            const endIdx = Math.floor(range.endT * this.sampleCount);
            const count = endIdx - startIdx;
            if (count < 2) return;

            const positions = [];
            const uvs = [];
            const indices = [];

            for (let k = 0; k <= count; k++) {
                const idx = Math.min(this.sampleCount - 1, startIdx + k);
                const s = this.samples[idx];
                const pL = s.pos.clone().add(s.normal.clone().multiplyScalar(-halfW));
                const pR = s.pos.clone().add(s.normal.clone().multiplyScalar(halfW));
                pL.y += 0.015; // 路面からわずかに浮かせZ-fight防止
                pR.y += 0.015;

                positions.push(pL.x, pL.y, pL.z);
                positions.push(pR.x, pR.y, pR.z);

                const v = (k / count) * 8.0;
                uvs.push(0, v, 1, v);

                if (k < count) {
                    const base = k * 2;
                    indices.push(base, base + 1, base + 2);
                    indices.push(base + 1, base + 3, base + 2);
                }
            }

            const geom = new THREE.BufferGeometry();
            geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geom.setIndex(indices);
            geom.computeVertexNormals();

            const mesh = new THREE.Mesh(geom, decelMat);
            this.trackGroup.add(mesh);
        });
    }

    /**
     * ★センターラインのチャッターバー（キャッツアイ／道路鋲）
     * カーブ区間（追越禁止黄色ライン）に等間隔に配置される立体反射鋲
     */
    buildChatterBars() {
        const barGeom = new THREE.BoxGeometry(0.32, 0.05, 0.16);
        const barMat = new THREE.MeshStandardMaterial({
            color: 0xffaa00,
            roughness: 0.3,
            metalness: 0.8
        });

        const chatterGroup = new THREE.Group();
        const step = 8; // 約4〜5m間隔
        const count = this.samples.length;

        for (let i = 10; i < count - 10; i += step) {
            const s = this.samples[i];
            if (s.curvature > 0.0016 || this.courseType === 'akina_uphill' || this.courseType === 'akina') {
                const mesh = new THREE.Mesh(barGeom, barMat);
                mesh.position.set(s.pos.x, s.pos.y + 0.025, s.pos.z);
                mesh.lookAt(s.pos.clone().add(s.tangent));
                chatterGroup.add(mesh);
            }
        }
        this.trackGroup.add(chatterGroup);
    }

    /**
     * ★シェブロン（赤白矢印板）テクスチャ生成
     * @param {'left'|'right'} dir 矢印の向き
     */
    generateChevronTexture(dir) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        // 赤背景
        ctx.fillStyle = '#cc1111';
        ctx.fillRect(0, 0, 256, 160);

        // 白い太いくの字矢印
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        if (dir === 'left') {
            ctx.moveTo(170, 20);
            ctx.lineTo(80, 80);
            ctx.lineTo(170, 140);
            ctx.lineTo(130, 140);
            ctx.lineTo(40, 80);
            ctx.lineTo(130, 20);
        } else {
            ctx.moveTo(86, 20);
            ctx.lineTo(176, 80);
            ctx.lineTo(86, 140);
            ctx.lineTo(126, 140);
            ctx.lineTo(216, 80);
            ctx.lineTo(126, 20);
        }
        ctx.closePath();
        ctx.fill();

        // 外枠
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.strokeRect(3, 3, 250, 154);

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * ★カーブ外側の赤白矢印板群（シェブロンデリネーター）
     * 急カーブのアウト側ガードレール後方に連続配置
     */
    buildChevronMarkers() {
        const texL = this.generateChevronTexture('left');
        const texR = this.generateChevronTexture('right');

        const matL = new THREE.MeshBasicMaterial({ map: texL });
        const matR = new THREE.MeshBasicMaterial({ map: texR });

        const boardGeom = new THREE.PlaneGeometry(1.2, 0.75);
        const poleGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.7 });

        const N = this.samples.length;
        const halfW = this.roadWidth / 2 + 0.35;

        for (let i = 15; i < N - 15; i += 7) {
            const s = this.samples[i];
            if (s.curvature > 0.0026) {
                const isTurnRight = (s.turnDir > 0);
                const side = isTurnRight ? -1 : 1;
                const mat = isTurnRight ? matR : matL;

                const pos = s.pos.clone().add(s.normal.clone().multiplyScalar(halfW * side));
                const signGroup = new THREE.Group();

                const pole = new THREE.Mesh(poleGeom, poleMat);
                pole.position.y = 0.9;
                signGroup.add(pole);

                const board = new THREE.Mesh(boardGeom, mat);
                board.position.y = 1.35;
                signGroup.add(board);

                signGroup.position.set(pos.x, s.pos.y, pos.z);
                signGroup.lookAt(pos.clone().sub(s.tangent));
                this.trackGroup.add(signGroup);
            }
        }
    }

    /**
     * ★頭文字DAC公式 セクション計測トラスゲート群 & フィニッシュライン
     */
    buildSectionGates() {
        const isUphill = (this.courseType === 'akina_uphill');
        const isDownhill = (this.courseType === 'akina');

        const titleNames = {
            'akina': 'AKINA DOWNHILL',
            'akina_uphill': 'AKINA UPHILL',
            'myogi': 'MYOGI HIGHSPEED',
            'irohazaka': 'IROHAZAKA EXTREME',
            'usui': 'USUI PASS',
            'akagi': 'AKAGI DOWNHILL',
            'happo': 'HAPPOGAHARA',
            'tsubaki': 'TSUBAKI LINE'
        };
        const titleName = titleNames[this.courseType] || 'TOUGE BATTLE';

        const gates = [
            {
                t: 0.003,
                type: 'start',
                title: `START - ${titleName}`,
                sub: isUphill ? '伊香保旧料金所跡スタート (7,552m)' : '秋名山頂展望台スタート (7,552m)',
                color: '#ffcc00'
            },
            {
                t: 0.250,
                type: 'section',
                secNum: 'SECTION 2',
                title: isUphill ? 'SECTION 2 / 榛名湖・山頂方面' : 'SECTION 2 / 高速ワインディング',
                sub: 'TIME ATTACK SPLIT GATE',
                color: '#00cc88'
            },
            {
                t: 0.520,
                type: 'section',
                secNum: 'SECTION 3',
                title: isUphill ? 'SECTION 3 / 連続5連ヘアピン進入' : 'SECTION 3 / 名物5連ヘアピン進入',
                sub: 'CAUTION : 5 CONSECUTIVE HAIRPINS',
                color: '#ffcc00'
            },
            {
                t: 0.760,
                type: 'section',
                secNum: 'SECTION 4',
                title: isUphill ? 'SECTION 4 / 給水塔・山頂高速セクション' : 'SECTION 4 / 麓・旧料金所ストレート',
                sub: 'FINAL SECTION PUSH',
                color: '#00aaff'
            },
            {
                t: 0.988,
                type: 'finish',
                title: `FINISH - ${titleName}`,
                sub: isUphill ? '榛名湖畔ゴール地点 / TIME TRIAL FINISH' : '伊香保旧料金所前ゴール / TIME TRIAL FINISH',
                color: '#ff2222'
            }
        ];

        gates.forEach(g => {
            this.buildDacTrussArch(g);
        });
    }

    /**
     * ★DAC本格スチールトラスゲート（支柱・トラス梁・案内看板）
     */
    buildDacTrussArch(gateData) {
        const sample = this.samples[Math.floor(gateData.t * this.sampleCount)];
        if (!sample) return;

        const pos = sample.pos;
        const normal = sample.normal;
        const tangent = sample.tangent;
        const halfW = this.roadWidth / 2 + 1.6;

        const gateGroup = new THREE.Group();
        const steelMat = new THREE.MeshStandardMaterial({
            color: 0x3a424a,
            roughness: 0.45,
            metalness: 0.8
        });

        // 1. 左右のメイン柱
        const pL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.2, 0.5), steelMat);
        pL.position.set(-normal.x * halfW, 3.6, -normal.z * halfW);
        gateGroup.add(pL);

        const pR = new THREE.Mesh(new THREE.BoxGeometry(0.5, 7.2, 0.5), steelMat);
        pR.position.set(normal.x * halfW, 3.6, normal.z * halfW);
        gateGroup.add(pR);

        // 2. トラス横梁
        const beamW = halfW * 2 + 0.8;
        const topBeam = new THREE.Mesh(new THREE.BoxGeometry(beamW, 0.4, 0.4), steelMat);
        topBeam.position.y = 7.0;
        gateGroup.add(topBeam);

        const botBeam = new THREE.Mesh(new THREE.BoxGeometry(beamW, 0.4, 0.4), steelMat);
        botBeam.position.y = 5.8;
        gateGroup.add(botBeam);

        // 3. 大型道路案内／セクション看板板面
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        const isFinish = (gateData.type === 'finish');
        const isStart = (gateData.type === 'start');
        ctx.fillStyle = isFinish ? '#111111' : (isStart ? '#182438' : '#0a3a2a');
        ctx.fillRect(0, 0, 512, 128);

        ctx.strokeStyle = gateData.color || '#ffcc00';
        ctx.lineWidth = 6;
        ctx.strokeRect(4, 4, 504, 120);

        if (isFinish) {
            for (let x = 8; x < 504; x += 20) {
                ctx.fillStyle = ((x / 20) % 2 === 0) ? '#ffffff' : '#cc1111';
                ctx.fillRect(x, 8, 20, 16);
            }
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = gateData.color || '#ffffff';
        ctx.font = 'bold 36px "Impact", sans-serif';
        ctx.fillText(gateData.title, 256, isFinish ? 66 : 58);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(gateData.sub, 256, isFinish ? 104 : 98);

        const signTex = new THREE.CanvasTexture(canvas);
        const signPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(beamW * 0.72, 1.6),
            new THREE.MeshBasicMaterial({ map: signTex, side: THREE.DoubleSide })
        );
        signPlane.position.y = 6.4;
        gateGroup.add(signPlane);

        // 4. フィニッシュの場合は路面にチェッカーラインを敷設
        if (isFinish) {
            const chkCanvas = document.createElement('canvas');
            chkCanvas.width = 256;
            chkCanvas.height = 64;
            const chkCtx = chkCanvas.getContext('2d');
            for (let y = 0; y < 64; y += 16) {
                for (let x = 0; x < 256; x += 16) {
                    const isWhite = ((x / 16 + y / 16) % 2 === 0);
                    chkCtx.fillStyle = isWhite ? '#ffffff' : '#111111';
                    chkCtx.fillRect(x, y, 16, 16);
                }
            }
            const chkTex = new THREE.CanvasTexture(chkCanvas);
            chkTex.repeat.set(4, 1);
            chkTex.wrapS = THREE.RepeatWrapping;

            const chkPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(this.roadWidth * 0.95, 2.5),
                new THREE.MeshBasicMaterial({ map: chkTex, side: THREE.DoubleSide })
            );
            chkPlane.rotation.x = -Math.PI / 2;
            chkPlane.position.y = 0.02;
            gateGroup.add(chkPlane);
        }

        gateGroup.position.set(pos.x, pos.y, pos.z);
        gateGroup.lookAt(pos.clone().add(tangent));
        this.trackGroup.add(gateGroup);
    }

    /**
     * ★頭文字DAC象徴：3D青色コーナーナビゲーション矢印システム
     * コーナー進入前に道路上空に青く光る菱形矢印（＜＜ / ＞＞）を表示
     */
    buildDacCornerNavigationGroup() {
        this.navArrowsGroup = new THREE.Group();
        this.navArrowsGroup.visible = false;

        const arrowTexL = this.generateNavArrowTexture('left');
        const arrowTexR = this.generateNavArrowTexture('right');

        this.navMatL = new THREE.MeshBasicMaterial({
            map: arrowTexL,
            transparent: true,
            opacity: 0.88,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        this.navMatR = new THREE.MeshBasicMaterial({
            map: arrowTexR,
            transparent: true,
            opacity: 0.88,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        this.navArrowMeshes = [];
        const geom = new THREE.PlaneGeometry(2.4, 2.4);
        for (let i = 0; i < 3; i++) {
            const mesh = new THREE.Mesh(geom, this.navMatL);
            mesh.visible = false;
            this.navArrowsGroup.add(mesh);
            this.navArrowMeshes.push(mesh);
        }
        this.trackGroup.add(this.navArrowsGroup);
    }

    generateNavArrowTexture(dir) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, 256, 256);
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 18;
        ctx.lineWidth = 28;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'miter';

        ctx.beginPath();
        if (dir === 'left') {
            ctx.moveTo(170, 48);
            ctx.lineTo(76, 128);
            ctx.lineTo(170, 208);
        } else {
            ctx.moveTo(86, 48);
            ctx.lineTo(180, 128);
            ctx.lineTo(86, 208);
        }
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.stroke();

        return new THREE.CanvasTexture(canvas);
    }

    /**
     * 毎フレームのコーナーナビ更新
     * @param {THREE.Vector3} playerPos 
     * @param {number} playerT 
     */
    updateCornerNavigation(playerPos, playerT) {
        if (!this.navArrowsGroup || !this.samples || this.samples.length === 0) return;

        const N = this.samples.length;
        const pIdx = Math.floor((playerT || 0) * N);
        let targetCorner = null;

        for (let offset = 12; offset <= 36; offset += 4) {
            const idx = (pIdx + offset) % N;
            const s = this.samples[idx];
            if (s && s.curvature >= 0.0135) { // ★主要コーナー（黄・赤）のみに限定
                targetCorner = { sample: s, idx: idx, offset: offset };
                break;
            }
        }

        if (!targetCorner) {
            this.navArrowsGroup.visible = false;
            return;
        }

        this.navArrowsGroup.visible = true;
        const s = targetCorner.sample;
        const isRight = (s.turnDir > 0);
        const mat = isRight ? this.navMatR : this.navMatL;

        // ★主要コーナーのきつさに応じて3D矢印のカラーも同期 (黄 / 赤)
        const navColorHex = (s.curvature >= 0.0260) ? 0xff1744 : 0xffea00;
        mat.color.setHex(navColorHex);

        const pulse = 0.70 + Math.sin(Date.now() * 0.012) * 0.28;
        mat.opacity = pulse;

        for (let k = 0; k < 3; k++) {
            const arrowSampleIdx = (targetCorner.idx + (k - 1) * 3 + N) % N;
            const as = this.samples[arrowSampleIdx];
            const mesh = this.navArrowMeshes[k];
            if (as && mesh) {
                mesh.material = mat;
                mesh.visible = true;
                mesh.position.set(as.pos.x, as.pos.y + 2.5, as.pos.z);
                mesh.lookAt(as.pos.clone().add(as.tangent));
            }
        }
    }

    getSmoothTrackInfo(worldPos, hintT = null) {
        let minDistSq = Infinity;
        let closestIdx = 0;
        const totalSamples = this.samples.length;

        // 1. ローカルウィンドウ探索（hintTが渡されている場合）
        // 峠の道路は連続しており、1フレームで車が何十メートルも離れたヘアピンへ飛ぶことはない。
        // hintT 前後45サンプル（約±95m）を優先的に3D重み付き探索し、現在の路面に100%拘束する。
        if (hintT !== null && hintT !== undefined && !isNaN(hintT) && totalSamples > 0) {
            const clampedHintT = Math.max(0, Math.min(1, hintT));
            const hintIdx = Math.floor(clampedHintT * (totalSamples - 1));
            const windowRadius = 45;
            const startIdx = Math.max(0, hintIdx - windowRadius);
            const endIdx = Math.min(totalSamples - 1, hintIdx + windowRadius);

            for (let i = startIdx; i <= endIdx; i++) {
                const s = this.samples[i];
                const dx = worldPos.x - s.pos.x;
                const dy = worldPos.y - s.pos.y;
                const dz = worldPos.z - s.pos.z;
                // 高低差(Y)に重み5.0を付与：上下に重なる立体ヘアピンへの誤吸着を完全に遮断
                const dSq = dx * dx + (dy * 5.0) * (dy * 5.0) + dz * dz;
                if (dSq < minDistSq) {
                    minDistSq = dSq;
                    closestIdx = i;
                }
            }

            // ローカル範囲で道路近傍（距離25m以内）が見つかれば確定
            if (minDistSq < 625.0) {
                // closestIdx を確定
            } else {
                // コース外等で窓外にいる場合はグローバル探索へフォールバック
                minDistSq = Infinity;
            }
        }

        // 2. グローバル3D探索（初回配置時やフォールバック時）
        if (minDistSq === Infinity) {
            for (let i = 0; i < totalSamples; i++) {
                const s = this.samples[i];
                const dx = worldPos.x - s.pos.x;
                const dy = worldPos.y - s.pos.y;
                const dz = worldPos.z - s.pos.z;
                // 高低差(Y)に重み5.0を付与し、立体交差・ヘアピン段差でのテレポートを完全防止
                const dSq = dx * dx + (dy * 5.0) * (dy * 5.0) + dz * dz;
                if (dSq < minDistSq) {
                    minDistSq = dSq;
                    closestIdx = i;
                }
            }
        }

        const s0 = this.samples[closestIdx];
        let prevIdx = Math.max(0, closestIdx - 1);
        let nextIdx = Math.min(this.samples.length - 1, closestIdx + 1);

        const segVec = new THREE.Vector3().subVectors(this.samples[nextIdx].pos, this.samples[prevIdx].pos);
        const toPos = new THREE.Vector3().subVectors(worldPos, this.samples[prevIdx].pos);
        const segLenSq = segVec.lengthSq();
        const projT = segLenSq > 0 ? Math.max(0, Math.min(1, toPos.dot(segVec) / segLenSq)) : 0;

        const smoothT = this.samples[prevIdx].t + projT * (this.samples[nextIdx].t - this.samples[prevIdx].t);

        const centerPos = this.curve.getPointAt(Math.max(0, Math.min(1, smoothT)));
        const tangent = this.curve.getTangentAt(Math.max(0, Math.min(1, smoothT))).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const offsetVec = new THREE.Vector3().subVectors(worldPos, centerPos);
        const offset = offsetVec.dot(normal);

        return {
            t: smoothT,
            centerPos: centerPos,
            tangent: tangent,
            normal: normal,
            offset: offset,
            distanceToCenter: Math.abs(offset),
            curvature: s0.curvature,
            turnDir: s0.turnDir || 0,
            bankAngle: s0.bankAngle || 0,
            hasGutter: s0.hasGutter
        };
    }

    getClosestSample(worldPos, hintT = null) {
        return this.getSmoothTrackInfo(worldPos, hintT);
    }

    getPointAt(t) {
        return this.curve.getPointAt(Math.max(0, Math.min(1, t)));
    }

    /**
     * 任意の位置 (X, Z) 直下におけるアスファルト道路表面の真の標高 (Y) を高精度算出
     * 下り坂・登り坂・立体カント傾斜をミリ単位で完全反映
     */
    getRoadSurfaceY(worldPos, hintT = null) {
        const info = this.getSmoothTrackInfo(worldPos, hintT);
        const bankOffsetY = Math.sin(info.bankAngle || 0) * info.offset;
        return info.centerPos.y + bankOffsetY;
    }
}

window.TougeTrack = TougeTrack;
