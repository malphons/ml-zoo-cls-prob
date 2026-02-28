/* ============================================================
   Bayesian Network Classifier — Data & Configuration
   Simulates a simple 2-feature Bayesian network where features
   have conditional dependencies. The network structure:
     Class -> X1, Class -> X2, X1 -> X2
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Seeded PRNG ---------- */
    var seed = 63;
    function rand() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }
    function randn() { var u = rand(), v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

    /* ---------- Network parameters ----------
       P(Class=1) = 0.5
       X1 | Class ~ N(mu1[cls], sigma1^2)
       X2 | Class, X1 ~ N(mu2[cls] + beta * X1, sigma2^2)
    */
    var params = {
        prior: 0.5,
        mu1: [3.0, 7.0],       /* mean of X1 per class */
        sigma1: 1.2,
        mu2: [6.5, 3.5],       /* base mean of X2 per class */
        beta: 0.3,              /* X1 -> X2 dependency */
        sigma2: 1.0
    };

    /* ---------- Generate points ---------- */
    var points = [];
    var i;

    for (i = 0; i < 30; i++) {
        var x1_0 = params.mu1[0] + randn() * params.sigma1;
        var x2_0 = params.mu2[0] + params.beta * x1_0 + randn() * params.sigma2;
        points.push({
            x: Math.round(Math.max(0.2, Math.min(9.8, x1_0)) * 100) / 100,
            y: Math.round(Math.max(0.2, Math.min(9.8, x2_0)) * 100) / 100,
            cls: 0
        });
    }
    for (i = 0; i < 30; i++) {
        var x1_1 = params.mu1[1] + randn() * params.sigma1;
        var x2_1 = params.mu2[1] + params.beta * x1_1 + randn() * params.sigma2;
        points.push({
            x: Math.round(Math.max(0.2, Math.min(9.8, x1_1)) * 100) / 100,
            y: Math.round(Math.max(0.2, Math.min(9.8, x2_1)) * 100) / 100,
            cls: 1
        });
    }

    /* ---------- Log-likelihood under the Bayesian network ---------- */
    function logLikelihood(x1, x2, cls) {
        var logPrior = cls === 0 ? Math.log(params.prior) : Math.log(1 - params.prior);
        /* P(X1 | Class) */
        var dX1 = x1 - params.mu1[cls];
        var logP_X1 = -0.5 * Math.log(2 * Math.PI * params.sigma1 * params.sigma1) - (dX1 * dX1) / (2 * params.sigma1 * params.sigma1);
        /* P(X2 | Class, X1) — conditional on X1 */
        var condMean = params.mu2[cls] + params.beta * x1;
        var dX2 = x2 - condMean;
        var logP_X2 = -0.5 * Math.log(2 * Math.PI * params.sigma2 * params.sigma2) - (dX2 * dX2) / (2 * params.sigma2 * params.sigma2);
        return logPrior + logP_X1 + logP_X2;
    }

    /* ---------- Naive Bayes comparison (ignores X1->X2 arc) ---------- */
    function logLikelihoodNaive(x1, x2, cls) {
        var logPrior = cls === 0 ? Math.log(params.prior) : Math.log(1 - params.prior);
        var dX1 = x1 - params.mu1[cls];
        var logP_X1 = -0.5 * Math.log(2 * Math.PI * params.sigma1 * params.sigma1) - (dX1 * dX1) / (2 * params.sigma1 * params.sigma1);
        /* In naive version, X2 has unconditional parameters per class */
        var naiveMu2 = params.mu2[cls] + params.beta * params.mu1[cls];
        var naiveSigma2 = Math.sqrt(params.sigma2 * params.sigma2 + params.beta * params.beta * params.sigma1 * params.sigma1);
        var dX2 = x2 - naiveMu2;
        var logP_X2 = -0.5 * Math.log(2 * Math.PI * naiveSigma2 * naiveSigma2) - (dX2 * dX2) / (2 * naiveSigma2 * naiveSigma2);
        return logPrior + logP_X1 + logP_X2;
    }

    /* ---------- Classifiers ---------- */
    function classifyFn(x, y) {
        return logLikelihood(x, y, 0) >= logLikelihood(x, y, 1) ? 0 : 1;
    }

    function classifyNaiveFn(x, y) {
        return logLikelihoodNaive(x, y, 0) >= logLikelihoodNaive(x, y, 1) ? 0 : 1;
    }

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
        params: params,
        classifyFn: classifyFn,
        classifyNaiveFn: classifyNaiveFn
    };
})();