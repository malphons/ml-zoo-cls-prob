/* ============================================================
   Multinomial Naive Bayes — Data & Configuration
   Simulates word-count data for 2 classes (spam vs. ham) with
   per-class feature probabilities for a bar chart visualisation.
   ============================================================ */
(function () {
    'use strict';

    /* ---------- Feature (word) names ---------- */
    var featureNames = [
        'free', 'offer', 'click', 'buy', 'winner',
        'hello', 'meeting', 'report', 'project', 'team'
    ];

    /* ---------- Per-class word probabilities (with Laplace smoothing) ---------- */
    var classNames = ['Spam', 'Ham'];

    var classProbs = [
        /* Spam: high probability for promotional words */
        [0.18, 0.16, 0.14, 0.12, 0.10, 0.04, 0.03, 0.03, 0.02, 0.02],
        /* Ham: high probability for work-related words */
        [0.02, 0.03, 0.03, 0.02, 0.01, 0.12, 0.15, 0.16, 0.18, 0.14]
    ];

    /* Normalise so each sums to ~1 (they already roughly do) */
    classProbs.forEach(function (probs) {
        var s = probs.reduce(function (a, b) { return a + b; }, 0);
        for (var i = 0; i < probs.length; i++) probs[i] /= s;
    });

    var prior = [0.3, 0.7]; /* 30% spam, 70% ham */

    /* ---------- Seeded PRNG ---------- */
    var seed = 101;
    function rand() {
        seed = (seed * 16807 + 0) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    /* ---------- Generate simulated document word counts ---------- */
    function sampleMultinomial(probs, totalWords) {
        var counts = new Array(probs.length).fill(0);
        for (var w = 0; w < totalWords; w++) {
            var r = rand(), cumul = 0;
            for (var j = 0; j < probs.length; j++) {
                cumul += probs[j];
                if (r <= cumul) { counts[j]++; break; }
            }
        }
        return counts;
    }

    var documents = [];
    var i;

    /* Spam documents */
    for (i = 0; i < 15; i++) {
        var wordsSpam = 20 + Math.floor(rand() * 30);
        documents.push({
            cls: 0,
            label: 'Spam',
            counts: sampleMultinomial(classProbs[0], wordsSpam),
            totalWords: wordsSpam
        });
    }

    /* Ham documents */
    for (i = 0; i < 25; i++) {
        var wordsHam = 30 + Math.floor(rand() * 40);
        documents.push({
            cls: 1,
            label: 'Ham',
            counts: sampleMultinomial(classProbs[1], wordsHam),
            totalWords: wordsHam
        });
    }

    /* ---------- Feature importance (log-likelihood ratio) ---------- */
    var featureImportance = featureNames.map(function (name, j) {
        var ratio = Math.log(classProbs[0][j] / classProbs[1][j]);
        return { feature: name, importance: ratio, index: j };
    });
    featureImportance.sort(function (a, b) { return b.importance - a.importance; });

    /* ---------- Classify a document by word counts ---------- */
    function classifyDoc(counts) {
        var logPost = [Math.log(prior[0]), Math.log(prior[1])];
        for (var k = 0; k < 2; k++) {
            for (var j = 0; j < counts.length; j++) {
                logPost[k] += counts[j] * Math.log(classProbs[k][j] + 1e-10);
            }
        }
        return logPost[0] > logPost[1] ? 0 : 1;
    }

    /* ---------- Export ---------- */
    window.MLZoo = window.MLZoo || {};
    window.MLZoo.modelData = {
        featureNames: featureNames,
        classNames: classNames,
        classProbs: classProbs,
        prior: prior,
        documents: documents,
        featureImportance: featureImportance,
        classifyDoc: classifyDoc
    };
})();
