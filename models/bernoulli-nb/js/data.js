/* ============================================================
   Bernoulli Naive Bayes — Data & Configuration
   Simulates binary feature data for 2 classes (spam vs. ham)
   where each feature is a binary indicator (word present/absent).
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Feature (word) names ---------- */
    var featureNames = [
        'free', 'offer', 'click', 'buy', 'winner',
        'hello', 'meeting', 'report', 'project', 'team'
    ];

    var classNames = ['Spam', 'Ham'];

    /* ---------- Per-class feature presence probabilities ---------- */
    var classBernoulliProbs = [
        /* Spam: high presence for promotional words */
        [0.85, 0.78, 0.72, 0.65, 0.60, 0.15, 0.10, 0.08, 0.05, 0.05],
        /* Ham: high presence for work-related words */
        [0.08, 0.10, 0.12, 0.05, 0.03, 0.70, 0.80, 0.75, 0.85, 0.78]
    ];

    var prior = [0.3, 0.7]; /* 30% spam, 70% ham */

    /* ---------- Seeded PRNG ---------- */
    var seed = 77;
    function rand() {
        seed = (seed * 16807 + 0) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    /* ---------- Generate simulated binary-feature documents ---------- */
    var documents = [];
    var i, j;

    /* Spam documents */
    for (i = 0; i < 15; i++) {
        var featSpam = [];
        for (j = 0; j < featureNames.length; j++) {
            featSpam.push(rand() < classBernoulliProbs[0][j] ? 1 : 0);
        }
        documents.push({ cls: 0, label: 'Spam', features: featSpam });
    }

    /* Ham documents */
    for (i = 0; i < 25; i++) {
        var featHam = [];
        for (j = 0; j < featureNames.length; j++) {
            featHam.push(rand() < classBernoulliProbs[1][j] ? 1 : 0);
        }
        documents.push({ cls: 1, label: 'Ham', features: featHam });
    }

    /* ---------- Feature importance (log-likelihood ratio) ---------- */
    var featureImportance = featureNames.map(function (name, j) {
        var ratio = Math.log(classBernoulliProbs[0][j] / classBernoulliProbs[1][j]);
        return { feature: name, importance: ratio, index: j };
    });
    featureImportance.sort(function (a, b) { return b.importance - a.importance; });

    /* ---------- Classify a document by binary features ---------- */
    function classifyDoc(features) {
        var logPost = [Math.log(prior[0]), Math.log(prior[1])];
        for (var k = 0; k < 2; k++) {
            for (var j = 0; j < features.length; j++) {
                var p = classBernoulliProbs[k][j];
                if (features[j] === 1) {
                    logPost[k] += Math.log(p + 1e-10);
                } else {
                    logPost[k] += Math.log(1 - p + 1e-10);
                }
            }
        }
        return logPost[0] > logPost[1] ? 0 : 1;
    }

    /* ---------- Export ---------- */
    window.MLZoo = window.MLZoo || {};
    window.MLZoo.modelData = {
        featureNames: featureNames,
        classNames: classNames,
        classBernoulliProbs: classBernoulliProbs,
        prior: prior,
        documents: documents,
        featureImportance: featureImportance,
        classifyDoc: classifyDoc
    };
})();