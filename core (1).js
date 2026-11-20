/* ==========================================================================
   Núcleo do jogo: funções puras (distância, pontuação, sorteio de locais).
   Não depende do navegador, por isso também pode ser testado no Node.
   ========================================================================== */
(function (root) {
  "use strict";

  var EARTH_KM = 6371.0088;
  var rad = function (d) { return (d * Math.PI) / 180; };

  // Raio de sorteio (jitter) e raio de busca de imagem (snap), em metros, por nível.
  var LEVELS = {
    facil:   { jitter: 40,   snap: 150 },
    medio:   { jitter: 300,  snap: 250 },
    dificil: { jitter: 1200, snap: 300 }
  };

  /** Distância em km entre dois pontos {lat,lng} (fórmula de haversine). */
  function haversineKm(a, b) {
    var dLat = rad(b.lat - a.lat);
    var dLng = rad(b.lng - a.lng);
    var s = Math.pow(Math.sin(dLat / 2), 2) +
            Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.pow(Math.sin(dLng / 2), 2);
    return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  /** Pontuação (0..MAX_SCORE): máxima dentro do raio perfeito, depois cai exponencialmente. */
  function scoreFromDistanceKm(km, cfg) {
    var max = cfg.MAX_SCORE;
    var perfect = cfg.PERFECT_RADIUS_M / 1000;
    var k = cfg.SCORE_DECAY_KM;
    if (!(km >= 0)) return 0;
    if (km <= perfect) return max;
    var s = Math.round(max * Math.exp(-(km - perfect) / k));
    return Math.max(0, Math.min(max, s));
  }

  /** Gerador pseudoaleatório com semente (útil para testes). */
  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    rng = rng || Math.random;
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /** Ponto aleatório (distribuição uniforme) dentro de um círculo de raio `radiusM` metros. */
  function randomPointNear(lat, lng, radiusM, rng) {
    rng = rng || Math.random;
    if (!radiusM) return { lat: lat, lng: lng };
    var r = radiusM * Math.sqrt(rng());
    var th = rng() * 2 * Math.PI;
    var dLat = (r * Math.cos(th)) / 111320;
    var dLng = (r * Math.sin(th)) / (111320 * Math.cos(rad(lat)));
    return { lat: lat + dLat, lng: lng + dLng };
  }

  /** Caixa (bbox) em torno de um ponto, com `m` metros de raio. */
  function bboxFor(lat, lng, m) {
    var dLat = m / 111320;
    var dLng = m / (111320 * Math.cos(rad(lat)));
    return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
  }

  /** Dado um local do banco, devolve o ponto sorteado e o raio de busca de imagem. */
  function resolveLocation(loc, rng, jitterScale) {
    var lv = LEVELS[loc.dif] || LEVELS.medio;
    var jitter = (loc.j != null ? loc.j : lv.jitter) * (jitterScale == null ? 1 : jitterScale);
    var snap = loc.s != null ? loc.s : lv.snap;
    return { point: randomPointNear(loc.lat, loc.lng, jitter, rng), snapM: snap, jitterM: jitter };
  }

  /** Nível de cada rodada. "misto" mistura fácil/médio/difícil em ordem aleatória. */
  function difficultyPlan(difficulty, rounds, rng) {
    var plan = [];
    if (difficulty !== "misto") {
      for (var i = 0; i < rounds; i++) plan.push(difficulty);
      return plan;
    }
    var cycle = ["facil", "medio", "dificil", "medio", "dificil"];
    for (var k = 0; k < rounds; k++) plan.push(cycle[k % cycle.length]);
    return shuffle(plan, rng);
  }

  /** Sorteia locais sem repetir dentro da mesma partida. */
  function createPicker(locais, rng) {
    var used = {};
    var queues = {};
    function refill(dif) {
      var pool = locais.filter(function (l) { return l.dif === dif && !used[l.id]; });
      queues[dif] = shuffle(pool.slice(), rng);
    }
    return {
      next: function (dif) {
        if (!queues[dif] || !queues[dif].length) refill(dif);
        if (!queues[dif].length) { // todos já usados nesta partida: libera de novo
          locais.forEach(function (l) { if (l.dif === dif) delete used[l.id]; });
          refill(dif);
        }
        var c = queues[dif].pop();
        if (c) used[c.id] = true;
        return c;
      },
      usedCount: function () { return Object.keys(used).length; }
    };
  }

  function formatDistance(km) {
    if (km == null) return "—";
    if (km < 1) return Math.round(km * 1000).toLocaleString("pt-BR") + " m";
    var txt = km < 10 ? km.toFixed(2) : km.toFixed(1);
    return txt.replace(".", ",") + " km";
  }

  function formatPoints(n) { return Math.round(n).toLocaleString("pt-BR"); }

  function rankTitle(total, max) {
    var p = total / max;
    if (p >= 0.9) return "Cartógrafo da Ilha";
    if (p >= 0.7) return "Morador raiz";
    if (p >= 0.5) return "Conhece o caminho";
    if (p >= 0.3) return "Turista curioso";
    return "Perdido na BR-101";
  }

  var api = {
    LEVELS: LEVELS,
    haversineKm: haversineKm,
    scoreFromDistanceKm: scoreFromDistanceKm,
    makeRng: makeRng,
    shuffle: shuffle,
    randomPointNear: randomPointNear,
    bboxFor: bboxFor,
    resolveLocation: resolveLocation,
    difficultyPlan: difficultyPlan,
    createPicker: createPicker,
    formatDistance: formatDistance,
    formatPoints: formatPoints,
    rankTitle: rankTitle
  };

  root.GeoCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
