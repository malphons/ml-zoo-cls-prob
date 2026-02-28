/* ============================================================
   Gaussian Naive Bayes — Data & Configuration
   Generates 2-class 2D Gaussian data with per-class mean/variance
   and a Bayes-rule classify function.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Seeded PRNG (LCG, seed=42) ---------- */
    var seed = 42;
    function rand() {
        seed = (seed * 16807 + 0) % 2147483647;
        return (seed - 1) / 2147483646;
    }
    function randn() {
        var u = rand(), v = rand();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    /* ---------- Per-class Gaussian parameters ---------- */
    var classParams = [
        { mean: [3.0, 6.5], cov: [[1.2, 0.3], [0.3, 1.0]] },
        { mean: [7.0, 3.5], cov: [[1.0, -0.2], [-0.2, 1.4]] }
    ];
    var prior = [0.5, 0.5];

    /* ---------- Generate points using Cholesky decomposition ---------- */
    function cholesky2x2(cov) {
        var l00 = Math.sqrt(cov[0][0]);
        var l10 = cov[1][0] / l00;
        var l11 = Math.sqrt(cov[1][1] - l10 * l10);
        return [l00, l10, l11];
    }

    var points = [];
    var i, cls;
    for (cls = 0; cls < 2; cls++) {
        var cp = classParams[cls];
        var L = cholesky2x2(cp.cov);
        for (i = 0; i < 30; i++) {
            var z1 = randn(), z2 = randn();
            var px = cp.mean[0] + L[0] * z1;
            var py = cp.mean[1] + L[1] * z1 + L[2] * z2;
            points.push({
                x: Math.round(Math.max(0.1, Math.min(9.9, px)) * 100) / 100,
                y: Math.round(Math.max(0.1, Math.min(9.9, py)) * 100) / 100,
                cls: cls
            });
        }
    }

    /* ---------- Gaussian PDF (log) ---------- */
    function logGaussPdf(x, y, mean, cov) {
        var dx = x - mean[0], dy = y - mean[1];
        var a = cov[0][0], b = cov[0][1], d = cov[1][1];
        var det = a * d - b * b;
        if (det <= 0) det = 1e-8;
        var invA =  d / det, invB = -b / det, invD = a / det;
        var exponent = -0.5 * (dx * dx * invA + 2 * dx * dy * invB + dy * dy * invD);
        var logNorm = -Math.log(2 * Math.PI) - 0.5 * Math.log(det);
        return logNorm + exponent;
    }

    /* ---------- Bayes-rule classifier ---------- */
    function classifyFn(x, y) {
        var logPost0 = Math.log(prior[0]) + logGaussPdf(x, y, classParams[0].mean, classParams[0].cov);
        var logPost1 = Math.log(prior[1]) + logGaussPdf(x, y, classParams[1].mean, classParams[1].cov);
        return logPost0 >= logPost1 ? 0 : 1;
    }

    /* ---------- Contour data for shared diagram ---------- */
    var gaussians = [
        { mean: classParams[0].mean, cov: classParams[0].cov, color: '#58a6ff', label: 'Class 0' },
        { mean: classParams[1].mean, cov: classParams[1].cov, color: '#f85149', label: 'Class 1' }
    ];

    /* ---------- Export ---------- */
    window.MLZoo = window.MLZoo || {};
    window.MLZoo.modelData = {
        config: {
            width: 800,
            height: 400,
            xDomain: [0, 10],
            yDomain: [0, 10],
            accentColor: '#d2a8ff',
            xLabel: 'Feature x\u2081',
            yLabel: 'Feature x\u2082'
        },
        points: points,
        classParams: classParams,
        gaussians: gaussians,
        classifyFn: classifyFn,
        prior: prior
    };
})();
