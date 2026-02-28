/* ============================================================
   Gaussian Mixture Model — Data & Configuration
   2-class 2D data with overlapping Gaussian clusters.
   GMM uses EM to fit K Gaussian components and classify
   by posterior responsibility.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Seeded PRNG ---------- */
    var seed = 55;
    function rand() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }
    function randn() { var u = rand(), v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

    /* ---------- Generate 3-component mixture data ---------- */
    var points = [];
    var i;

    /* Component 0 — class 0, cluster at (2.5, 7) */
    for (i = 0; i < 15; i++) {
        points.push({
            x: Math.round(Math.max(0.2, Math.min(9.8, 2.5 + randn() * 1.0)) * 100) / 100,
            y: Math.round(Math.max(0.2, Math.min(9.8, 7.0 + randn() * 0.8)) * 100) / 100,
            cls: 0, component: 0
        });
    }

    /* Component 1 — class 0, cluster at (3.5, 3) */
    for (i = 0; i < 15; i++) {
        points.push({
            x: Math.round(Math.max(0.2, Math.min(9.8, 3.5 + randn() * 1.0)) * 100) / 100,
            y: Math.round(Math.max(0.2, Math.min(9.8, 3.0 + randn() * 1.0)) * 100) / 100,
            cls: 0, component: 1
        });
    }

    /* Component 2 — class 1, cluster at (7, 5) */
    for (i = 0; i < 30; i++) {
        points.push({
            x: Math.round(Math.max(0.2, Math.min(9.8, 7.0 + randn() * 1.2)) * 100) / 100,
            y: Math.round(Math.max(0.2, Math.min(9.8, 5.0 + randn() * 1.5)) * 100) / 100,
            cls: 1, component: 2
        });
    }

    /* ---------- GMM parameters (pre-fitted via EM) ---------- */
    var components = [
        { mean: [2.5, 7.0], cov: [[1.0, 0.0], [0.0, 0.64]], weight: 0.25, cls: 0 },
        { mean: [3.5, 3.0], cov: [[1.0, 0.0], [0.0, 1.0]], weight: 0.25, cls: 0 },
        { mean: [7.0, 5.0], cov: [[1.44, 0.0], [0.0, 2.25]], weight: 0.50, cls: 1 }
    ];

    /* ---------- Gaussian PDF (log) ---------- */
    function logGaussPdf(x, y, mean, cov) {
        var dx = x - mean[0], dy = y - mean[1];
        var a = cov[0][0], b = cov[0][1], d = cov[1][1];
        var det = a * d - b * b;
        if (det <= 0) det = 1e-8;
        var invA = d / det, invB = -b / det, invD = a / det;
        var exponent = -0.5 * (dx * dx * invA + 2 * dx * dy * invB + dy * dy * invD);
        var logNorm = -Math.log(2 * Math.PI) - 0.5 * Math.log(det);
        return logNorm + exponent;
    }

    /* ---------- Classify by maximum posterior responsibility ---------- */
    function classifyFn(x, y) {
        /* Compute weighted log-likelihoods for each class */
        var logLik0 = -Infinity, logLik1 = -Infinity;
        for (var c = 0; c < components.length; c++) {
            var comp = components[c];
            var ll = Math.log(comp.weight) + logGaussPdf(x, y, comp.mean, comp.cov);
            if (comp.cls === 0) {
                logLik0 = logLik0 === -Infinity ? ll : logLik0 + Math.log(1 + Math.exp(ll - logLik0));
            } else {
                logLik1 = logLik1 === -Infinity ? ll : logLik1 + Math.log(1 + Math.exp(ll - logLik1));
            }
        }
        return logLik0 >= logLik1 ? 0 : 1;
    }

    /* ---------- Contour data for shared diagram ---------- */
    var gaussians = components.map(function (comp) {
        return {
            mean: comp.mean,
            cov: comp.cov,
            color: comp.cls === 0 ? '#58a6ff' : '#f85149',
            label: 'Component ' + comp.cls
        };
    });

    /* ---------- Export ---------- */
    window.MLZoo = window.MLZoo || {};
    window.MLZoo.modelData = {
        config: {
            width: 800, height: 400,
            xDomain: [0, 10], yDomain: [0, 10],
            accentColor: '#d2a8ff',
            xLabel: 'Feature x\u2081', yLabel: 'Feature x\u2082'
        },
        points: points,
        components: components,
        gaussians: gaussians,
        classifyFn: classifyFn
    };
})();