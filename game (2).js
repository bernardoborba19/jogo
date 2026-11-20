/* ==========================================================================
   FloriGuesser — lógica do jogo e interface
   Provedores de imagem (nesta ordem, quando configurados):
     1) Google Street View   2) Mapillary (gratuito)   3) Satélite (sempre disponível)
   ========================================================================== */
(function () {
  "use strict";

  var CFG = window.GEO_CONFIG;
  var C = window.GeoCore;
  var LOCAIS = window.LOCAIS || [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var DIFF_LABEL = { facil: "Fácil", medio: "Médio", dificil: "Difícil", misto: "Misto" };
  var PROVIDER_LABEL = { google: "Google Street View", mapillary: "Mapillary", satelite: "Satélite" };
  var BEST_KEY = "geoguessr-floripa:melhor";

  var E = {
    screens: { menu: $("#screenMenu"), game: $("#screenGame"), result: $("#screenResult"), final: $("#screenFinal") },
    pano: $("#pano"), loading: $("#loading"), loadingText: $("#loadingText"),
    hudRound: $("#hudRound"), hudDiff: $("#hudDiff"), hudScore: $("#hudScore"),
    hudTimer: $("#hudTimer"), hudTimerWrap: $("#hudTimerWrap"),
    btnReset: $("#btnReset"), btnForward: $("#btnForward"), btnBack: $("#btnBack"), btnQuit: $("#btnQuit"), badge: $("#sourceBadge"),
    mapPanel: $("#mapPanel"), guessMap: $("#guessMap"), btnGuess: $("#btnGuess"),
    btnMapToggle: $("#btnMapToggle"), btnMapFab: $("#btnMapFab"),
    selTimer: $("#selTimer"), selProvider: $("#selProvider"), providerNote: $("#providerNote"),
    btnPlay: $("#btnPlay"), bestScore: $("#bestScore"),
    resMap: $("#resultMap"), resCard: $("#resultCard"), resRound: $("#resRound"), resPlace: $("#resPlace"),
    resPoints: $("#resPoints"), resBar: $("#resBar"), resDistance: $("#resDistance"), resHint: $("#resHint"),
    resTotal: $("#resTotal"), btnNext: $("#btnNext"),
    finTotal: $("#finTotal"), finTitle: $("#finTitle"), finBest: $("#finBest"), finStats: $("#finStats"),
    finRows: $("#finRows"), finMap: $("#finalMap"),
    btnAgain: $("#btnAgain"), btnMenu: $("#btnMenu"), btnCopy: $("#btnCopy"),
    toast: $("#toast")
  };

  var S = {
    difficulty: "medio", timerSec: 0, providerChoice: "auto",
    picker: null, plan: [], round: 0, total: 0, results: [],
    phase: "menu", locked: false, view: null, guess: null,
    deadline: 0, timerId: 0, gameId: 0,
    disabled: { google: false, mapillary: false },
    gm: { loading: null }, mly: { loading: null },
    guessMap: null, guessMarker: null, resMap: null, resLayer: null, finMap: null, finLayer: null,
    pinned: false
  };

  /* ---------------------------------------------------------------- utilidades */
  function toast(msg, ms) {
    E.toast.textContent = msg;
    E.toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { E.toast.classList.remove("show"); }, ms || 4200);
  }

  function showScreen(name) {
    Object.keys(E.screens).forEach(function (k) { E.screens[k].hidden = k !== name; });
    document.body.setAttribute("data-screen", name);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("Falha ao carregar " + src)); };
      document.head.appendChild(s);
    });
  }

  function safeStorageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeStorageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignora */ } }

  function hasHover() { return window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches; }
  function isMobileLayout() { return window.matchMedia && window.matchMedia("(max-width: 700px)").matches; }

  /* ---------------------------------------------------------------- provedores */
  function availability() {
    return {
      google: !!CFG.GOOGLE_MAPS_API_KEY && !S.disabled.google,
      mapillary: !!CFG.MAPILLARY_TOKEN && !S.disabled.mapillary,
      satelite: true
    };
  }

  /** Provedores de rua ativos, na ordem de preferência, segundo a escolha do jogador. */
  function streetProviders() {
    var av = availability();
    if (S.providerChoice === "satelite") return [];
    if (S.providerChoice === "google") return av.google ? ["google"] : [];
    if (S.providerChoice === "mapillary") return av.mapillary ? ["mapillary"] : [];
    var list = [];
    if (av.google) list.push("google");
    if (av.mapillary) list.push("mapillary");
    return list;
  }

  /* ---- Google Street View ---- */
  function loadGoogle() {
    if (S.gm.loading) return S.gm.loading;
    S.gm.loading = new Promise(function (resolve, reject) {
      if (window.google && window.google.maps && window.google.maps.StreetViewService) return resolve();
      window.__geoGoogleReady = function () { resolve(); };
      window.gm_authFailure = function () {
        S.disabled.google = true;
        toast("O Google recusou a chave da API. Usando outra fonte de imagens.");
        refreshProviderUI();
      };
      var s = document.createElement("script");
      s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(CFG.GOOGLE_MAPS_API_KEY) +
              "&callback=__geoGoogleReady&language=pt-BR&region=BR";
      s.async = true;
      s.onerror = function () { S.disabled.google = true; reject(new Error("Falha ao carregar o Google Maps")); };
      document.head.appendChild(s);
      setTimeout(function () { reject(new Error("Tempo esgotado ao carregar o Google Maps")); }, 15000);
    });
    return S.gm.loading;
  }

  function findGoogle(pt, snapM) {
    return loadGoogle().then(function () {
      if (S.disabled.google) throw new Error("Google indisponível");
      var g = window.google.maps;
      if (!S.gm.svc) S.gm.svc = new g.StreetViewService();
      return S.gm.svc.getPanorama({
        location: { lat: pt.lat, lng: pt.lng },
        radius: snapM,
        preference: g.StreetViewPreference.NEAREST,
        source: g.StreetViewSource.OUTDOOR
      }).then(function (res) {
        var d = res && res.data;
        if (!d || !d.location || !d.location.latLng) return null;
        if (!/google/i.test(d.copyright || "")) return null; // ignora fotos de usuários/interiores
        return { pano: d.location.pano, lat: d.location.latLng.lat(), lng: d.location.latLng.lng() };
      }, function (err) {
        var code = err && (err.code || err.message || "");
        if (/ZERO_RESULTS/i.test(String(code))) return null;
        throw err;
      });
    });
  }

  function renderGoogle(view) {
    var g = window.google.maps;
    E.pano.innerHTML = "";
    var pov = { heading: Math.random() * 360, pitch: 0 };
    view.handle = new g.StreetViewPanorama(E.pano, {
      pano: view.ref.pano, pov: pov, zoom: 1,
      addressControl: false, showRoadLabels: false, fullscreenControl: false,
      enableCloseButton: false, motionTracking: false, motionTrackingControl: false,
      zoomControl: true, panControl: false, linksControl: true, clickToGo: true,
      imageDateControl: false, visible: true
    });
    view.start = { pano: view.ref.pano, pov: pov };
  }

  /* ---- Mapillary ---- */
  function loadMapillary() {
    if (S.mly.loading) return S.mly.loading;
    S.mly.loading = loadScript("https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.js").then(function () {
      if (!window.mapillary || !window.mapillary.Viewer) throw new Error("mapillary-js indisponível");
    });
    return S.mly.loading;
  }

  function findMapillary(pt, snapM) {
    return loadMapillary().then(function () {
      var b = C.bboxFor(pt.lat, pt.lng, snapM);
      var url = "https://graph.mapillary.com/images?access_token=" + encodeURIComponent(CFG.MAPILLARY_TOKEN) +
        "&fields=id,geometry,is_pano,captured_at&limit=200&bbox=" +
        [b.minLng, b.minLat, b.maxLng, b.maxLat].map(function (n) { return n.toFixed(6); }).join(",");
      return fetch(url).then(function (r) {
        if (r.status === 401 || r.status === 403) { S.disabled.mapillary = true; refreshProviderUI(); throw new Error("Token do Mapillary recusado"); }
        if (!r.ok) throw new Error("Mapillary HTTP " + r.status);
        return r.json();
      }).then(function (j) {
        var arr = (j && j.data) || [];
        var cands = arr.filter(function (x) { return x && x.geometry && x.geometry.coordinates; }).map(function (x) {
          var c = x.geometry.coordinates;
          return { id: String(x.id), lat: c[1], lng: c[0], pano: !!x.is_pano, t: x.captured_at || 0,
                   d: C.haversineKm(pt, { lat: c[1], lng: c[0] }) };
        }).filter(function (x) { return x.d <= snapM / 1000; }).sort(function (a, b2) { return a.d - b2.d; });
        if (!cands.length) return null;
        var recent = cands.filter(function (x) { return x.t >= Date.UTC(2018, 0, 1); });
        var pool = recent.length ? recent : cands;
        var panos = pool.filter(function (x) { return x.pano; });
        var pick = (panos.length ? panos : pool).slice(0, 6);
        return pick[Math.floor(Math.random() * pick.length)];
      });
    });
  }

  function renderMapillary(view) {
    E.pano.innerHTML = "";
    view.handle = new window.mapillary.Viewer({
      accessToken: CFG.MAPILLARY_TOKEN,
      container: E.pano,
      imageId: view.ref.id,
      // Câmera livre: arrastar com mouse/toque gira 360° (horizontal e vertical em panoramas).
      component: { cover: false, pointer: { dragPan: true, scrollZoom: true, touchZoom: true } }
    });
    view.start = { id: view.ref.id };
    // A direção de deslocamento vem da ordem da sequência de captura, nunca do ângulo da câmera.
    view.nav = { curId: view.ref.id, seqId: null, ids: null, busy: false };
    view.handle.on("image", function (e) {
      if (!e || !e.image) return;
      view.nav.curId = String(e.image.id);
      if (e.image.sequenceId !== view.nav.seqId) { view.nav.seqId = e.image.sequenceId; view.nav.ids = null; }
    });
  }

  /** Anda `dir` (+1 frente, -1 trás) vários quadros da sequência de uma vez. */
  function stepForward(dir) {
    var v = S.view;
    if (!v || v.provider !== "mapillary" || !v.nav || S.phase !== "playing" || v.nav.busy) return;
    var nav = v.nav;
    var n = (CFG.STEP_IMAGES || 8) * dir;
    nav.busy = true;
    var ready = nav.ids ? Promise.resolve(nav.ids) :
      (nav.seqId ? fetch("https://graph.mapillary.com/image_ids?sequence_id=" + encodeURIComponent(nav.seqId) +
        "&access_token=" + encodeURIComponent(CFG.MAPILLARY_TOKEN)).then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        }).then(function (j) { nav.ids = ((j && j.data) || []).map(function (x) { return String(x.id); }); return nav.ids; })
       : Promise.reject(new Error("sequência desconhecida")));
    ready.then(function (ids) {
      var i = ids.indexOf(nav.curId);
      if (i < 0) throw new Error("posição fora da sequência");
      var j = Math.max(0, Math.min(ids.length - 1, i + n));
      if (j === i) { toast(dir > 0 ? "Fim da rua por aqui." : "Início da rua por aqui.", 1800); return null; }
      return v.handle.moveTo(ids[j]);
    }).catch(function (err) {
      console.warn("[avançar]", err);
      // alternativa: usa a navegação nativa do Mapillary, quadro a quadro
      var ND = window.mapillary && window.mapillary.NavigationDirection;
      if (!ND) return;
      var k = Math.abs(n), p = Promise.resolve();
      for (var c = 0; c < k; c++) p = p.then(function () { return v.handle.moveDir(dir > 0 ? ND.Next : ND.Prev); });
      return p.catch(function () {});
    }).then(function () { nav.busy = false; });
  }

  /* ---- Satélite (alternativa sem chave) ---- */
  function renderSat(view) {
    E.pano.innerHTML = "";
    var div = document.createElement("div");
    div.className = "sat";
    E.pano.appendChild(div);
    var m = L.map(div, { zoomControl: true, minZoom: 15, maxZoom: 19, zoomSnap: 1, attributionControl: true })
      .setView([view.lat, view.lng], 17);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, maxNativeZoom: 18, attribution: "Imagens © Esri, Maxar, Earthstar Geographics"
    }).addTo(m);
    m.setMaxBounds(L.latLng(view.lat, view.lng).toBounds(3200));
    L.marker([view.lat, view.lng], {
      interactive: false, keyboard: false,
      icon: L.divIcon({ className: "sat-pin", html: "<span></span>", iconSize: [26, 26], iconAnchor: [13, 13] })
    }).addTo(m);
    view.handle = m;
    view.start = { lat: view.lat, lng: view.lng };
  }

  var FIND = { google: findGoogle, mapillary: findMapillary };
  var RENDER = { google: renderGoogle, mapillary: renderMapillary, satelite: renderSat };

  function disposeView() {
    var v = S.view;
    if (v && v.handle) {
      try {
        if (v.provider === "mapillary") v.handle.remove();
        else if (v.provider === "satelite") v.handle.remove();
      } catch (e) { /* ignora */ }
    }
    E.pano.innerHTML = "";
    S.view = null;
  }

  function resetView() {
    var v = S.view;
    if (!v || !v.handle || S.phase !== "playing") return;
    try {
      if (v.provider === "google") { v.handle.setPano(v.start.pano); v.handle.setPov(v.start.pov); }
      else if (v.provider === "mapillary") { v.handle.moveTo(v.start.id).catch(function () {}); }
      else { v.handle.setView([v.start.lat, v.start.lng], 17); }
    } catch (e) { /* ignora */ }
  }

  function tooClose(found) {
    var minKm = CFG.MIN_SEPARATION_KM || 0;
    return S.results.some(function (r) { return C.haversineKm(r.truePos, found) < minKm; });
  }

  /** Acha uma imagem para o nível pedido; sem cobertura, tenta outros locais; por fim usa satélite. */
  function acquireView(dif, gameId) {
    var errors = { google: 0, mapillary: 0 };
    var lastLoc = null;
    var attempt = 0;

    function finishSat() {
      var loc = lastLoc || S.picker.next(dif);
      var r = C.resolveLocation(loc, Math.random, 0.35);
      return { provider: "satelite", loc: loc, lat: r.point.lat, lng: r.point.lng, ref: null,
               fallback: attempt > 0 };
    }

    function tryNext() {
      if (gameId !== S.gameId) return Promise.resolve(null);
      var providers = streetProviders();
      if (!providers.length || attempt >= CFG.MAX_ATTEMPTS) return Promise.resolve(finishSat());
      attempt++;
      var loc = S.picker.next(dif);
      lastLoc = loc;
      var r = C.resolveLocation(loc, Math.random);
      E.loadingText.textContent = "Procurando um lugar em " + loc.cidade + "…";

      function tryProvider(i) {
        if (i >= providers.length) return Promise.resolve(null);
        var p = providers[i];
        if (S.disabled[p]) return tryProvider(i + 1);
        return FIND[p](r.point, r.snapM).then(function (found) {
          if (!found || tooClose(found)) return tryProvider(i + 1);
          return { provider: p, loc: loc, lat: found.lat, lng: found.lng, ref: found };
        }, function (err) {
          console.warn("[" + p + "]", err);
          errors[p]++;
          if (errors[p] >= 3) { S.disabled[p] = true; refreshProviderUI(); }
          return tryProvider(i + 1);
        });
      }

      return tryProvider(0).then(function (view) { return view || tryNext(); });
    }
    return tryNext();
  }

  /* ---------------------------------------------------------------- mapas Leaflet */
  // Mapa de palpites: OpenStreetMap padrão, sem chave de API (independente do Mapillary/Google).
  var TILE_STREETS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  var ATTR_STREETS = "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors";
  var TILE_SAT = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
  var ATTR_SAT = "Imagens © Esri, Maxar, Earthstar Geographics";
  var REGION_CENTER = [-27.65, -48.58];
  var REGION_BOUNDS = [[-28.4, -49.4], [-26.9, -47.8]];

  function baseLayers() {
    return {
      "Mapa": L.tileLayer(TILE_STREETS, { maxZoom: 19, attribution: ATTR_STREETS }),
      "Satélite": L.tileLayer(TILE_SAT, { maxZoom: 19, maxNativeZoom: 18, attribution: ATTR_SAT })
    };
  }

  function makeMap(el, withLayers) {
    var map = L.map(el, { center: REGION_CENTER, zoom: 10, minZoom: 8, maxZoom: 19, maxBounds: REGION_BOUNDS, zoomControl: true });
    var layers = baseLayers();
    layers["Mapa"].addTo(map);
    if (withLayers) L.control.layers(layers, null, { position: "topleft", collapsed: true }).addTo(map);
    return map;
  }

  function pinIcon(kind, label) {
    return L.divIcon({
      className: "pin-wrap",
      html: "<span class='pin-shape pin-" + kind + "'><i>" + (label || "") + "</i></span>",
      iconSize: [30, 30], iconAnchor: [15, 36]
    });
  }

  function initGuessMap() {
    if (S.guessMap) return;
    S.guessMap = makeMap(E.guessMap, true);
    S.guessMap.on("click", function (e) {
      if (S.phase !== "playing" || S.locked) return;
      placeGuess(e.latlng);
    });
  }

  function placeGuess(latlng) {
    S.guess = { lat: latlng.lat, lng: latlng.lng };
    if (S.guessMarker) S.guessMarker.setLatLng(latlng);
    else S.guessMarker = L.marker(latlng, { icon: pinIcon("guess", "●"), keyboard: false }).addTo(S.guessMap);
    E.btnGuess.disabled = false;
    E.btnGuess.textContent = "Fazer palpite";
  }

  function clearGuess() {
    S.guess = null;
    if (S.guessMarker && S.guessMap) { S.guessMap.removeLayer(S.guessMarker); }
    S.guessMarker = null;
    E.btnGuess.disabled = true;
    E.btnGuess.textContent = "Marque no mapa";
    if (S.guessMap) S.guessMap.setView(REGION_CENTER, 10, { animate: false });
  }

  function setMapOpen(open) {
    E.mapPanel.classList.toggle("open", !!open);
    E.btnMapToggle.setAttribute("aria-expanded", open ? "true" : "false");
    setTimeout(function () { if (S.guessMap) S.guessMap.invalidateSize(); }, 320);
  }

  /* ---------------------------------------------------------------- HUD e cronômetro */
  function updateHud() {
    E.hudRound.textContent = (S.round + 1) + "/" + CFG.ROUNDS;
    E.hudDiff.textContent = DIFF_LABEL[S.plan[S.round]] || DIFF_LABEL[S.difficulty];
    E.hudScore.textContent = C.formatPoints(S.total);
  }

  function clearTimer() { if (S.timerId) { clearInterval(S.timerId); S.timerId = 0; } }

  function startTimer() {
    clearTimer();
    if (!S.timerSec) { E.hudTimerWrap.hidden = true; return; }
    E.hudTimerWrap.hidden = false;
    S.deadline = Date.now() + S.timerSec * 1000;
    tick();
    S.timerId = setInterval(tick, 250);
  }

  function tick() {
    var left = Math.max(0, S.deadline - Date.now());
    var sec = Math.ceil(left / 1000);
    var mm = String(Math.floor(sec / 60)).padStart(2, "0");
    var ss = String(sec % 60).padStart(2, "0");
    E.hudTimer.textContent = mm + ":" + ss;
    E.hudTimerWrap.classList.toggle("warn", sec <= 10);
    if (left <= 0) { clearTimer(); submitGuess(true); }
  }

  function setLoading(on, text) {
    E.loading.hidden = !on;
    if (text) E.loadingText.textContent = text;
  }

  /* ---------------------------------------------------------------- fluxo da partida */
  function readSettings() {
    var d = $("input[name='difficulty']:checked");
    S.difficulty = d ? d.value : "medio";
    S.timerSec = parseInt(E.selTimer.value, 10) || 0;
    S.providerChoice = E.selProvider.value || "auto";
  }

  function startGame() {
    readSettings();
    S.gameId++;
    S.picker = C.createPicker(LOCAIS, Math.random);
    S.plan = C.difficultyPlan(S.difficulty, CFG.ROUNDS, Math.random);
    S.round = 0; S.total = 0; S.results = [];
    disposeView();
    showScreen("game");
    initGuessMap();
    startRound();
  }

  function startRound() {
    var id = S.gameId;
    S.phase = "loading"; S.locked = false;
    clearTimer();
    clearGuess();
    setMapOpen(false);
    S.pinned = false;
    E.hudTimerWrap.hidden = true;
    E.badge.textContent = "";
    E.btnForward.hidden = true; E.btnBack.hidden = true;
    updateHud();
    showScreen("game");
    setLoading(true, "Procurando um lugar…");
    if (S.guessMap) setTimeout(function () { S.guessMap.invalidateSize(); }, 50);

    acquireView(S.plan[S.round], id).then(function (view) {
      if (id !== S.gameId || !view) return;
      disposeView();
      S.view = view;
      try {
        RENDER[view.provider](view);
      } catch (err) {
        console.warn("Falha ao renderizar " + view.provider + "; usando satélite.", err);
        var r = C.resolveLocation(view.loc, Math.random, 0.35);
        view = { provider: "satelite", loc: view.loc, lat: r.point.lat, lng: r.point.lng, ref: null, fallback: true };
        S.view = view;
        RENDER.satelite(view);
      }
      E.badge.textContent = PROVIDER_LABEL[view.provider] + (view.provider === "satelite" ? " — vista aérea" : "");
      E.badge.className = "badge badge-" + view.provider;
      E.btnForward.hidden = view.provider !== "mapillary";
      E.btnBack.hidden = view.provider !== "mapillary";
      if (view.provider === "satelite" && view.fallback) {
        toast("Sem imagens de rua neste ponto: usando vista de satélite nesta rodada.");
      }
      setLoading(false);
      S.phase = "playing";
      startTimer();
    }).catch(function (err) {
      console.error(err);
      toast("Algo deu errado ao carregar a rodada. Tente de novo.");
      setLoading(false);
    });
  }

  function submitGuess(auto) {
    if (S.locked || S.phase !== "playing" || !S.view) return;
    if (!S.guess && !auto) return;
    S.locked = true;
    S.phase = "result";
    clearTimer();

    var v = S.view;
    var truePos = { lat: v.lat, lng: v.lng };
    var km = null, pts = 0;
    if (S.guess) {
      km = C.haversineKm(S.guess, truePos);
      pts = C.scoreFromDistanceKm(km, CFG);
    }
    S.total += pts;
    var rec = {
      round: S.round + 1, place: v.loc.nome, city: v.loc.cidade, provider: v.provider,
      dif: v.loc.dif, truePos: truePos, guess: S.guess ? { lat: S.guess.lat, lng: S.guess.lng } : null,
      km: km, pts: pts, timedOut: !S.guess
    };
    S.results.push(rec);
    disposeView();
    showResult(rec);
  }

  function nextStep() {
    if (S.phase !== "result") return;
    S.round++;
    if (S.round >= CFG.ROUNDS) showFinal();
    else startRound();
  }

  function quitToMenu() {
    S.gameId++;
    clearTimer();
    disposeView();
    S.phase = "menu";
    setLoading(false);
    showScreen("menu");
    refreshBest();
  }

  /* ---------------------------------------------------------------- resultado da rodada */
  function hintFor(km) {
    if (km == null) return "Tempo esgotado: nenhum palpite marcado.";
    if (km <= CFG.PERFECT_RADIUS_M / 1000) return "Na mosca! 🎯";
    if (km < 1) return "Quase lá!";
    if (km < 5) return "Muito perto!";
    if (km < 15) return "Você acertou a região.";
    return "Longe desta vez, mas cada rodada ensina algo.";
  }

  function countUp(el, to, ms) {
    var t0 = performance.now();
    function step(t) {
      var k = Math.min(1, (t - t0) / ms);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = C.formatPoints(to * e);
      if (k < 1) requestAnimationFrame(step); else el.textContent = C.formatPoints(to);
    }
    requestAnimationFrame(step);
  }

  function showResult(rec) {
    showScreen("result");
    E.resRound.textContent = "Rodada " + rec.round + " de " + CFG.ROUNDS;
    E.resPlace.textContent = rec.place + " · " + rec.city;
    E.resDistance.innerHTML = rec.km == null
      ? "Sem palpite"
      : "Você ficou a <strong>" + C.formatDistance(rec.km) + "</strong> do local.";
    E.resHint.textContent = hintFor(rec.km);
    E.resTotal.textContent = C.formatPoints(S.total);
    E.btnNext.textContent = (S.round + 1 >= CFG.ROUNDS) ? "Ver resultado final" : "Próxima rodada";
    E.resBar.style.width = "0%";
    E.resPoints.textContent = "0";

    if (!S.resMap) S.resMap = makeMap(E.resMap, false);
    S.resMap.invalidateSize();
    if (S.resLayer) S.resLayer.remove();
    S.resLayer = L.layerGroup().addTo(S.resMap);

    var t = L.latLng(rec.truePos.lat, rec.truePos.lng);
    L.marker(t, { icon: pinIcon("true", "★"), keyboard: false }).addTo(S.resLayer);
    var pts = [t];
    var line = null;
    if (rec.guess) {
      var g = L.latLng(rec.guess.lat, rec.guess.lng);
      L.marker(g, { icon: pinIcon("guess", "●"), keyboard: false }).addTo(S.resLayer);
      line = L.polyline([g, t], { color: "#fbbf24", weight: 3, dashArray: "6 9", className: "res-line" });
      pts.push(g);
    }

    var mobile = isMobileLayout();
    var opts = mobile
      ? { paddingTopLeft: [40, 70], paddingBottomRight: [40, Math.round(window.innerHeight * 0.5)], maxZoom: 16, animate: false }
      : { paddingTopLeft: [440, 70], paddingBottomRight: [70, 70], maxZoom: 16, animate: false };
    S.resMap.fitBounds(L.latLngBounds(pts).pad(0.15), opts);
    if (pts.length === 1) S.resMap.setView(t, 15, { animate: false });
    if (line) setTimeout(function () { if (S.resLayer) line.addTo(S.resLayer); }, 450);

    setTimeout(function () {
      countUp(E.resPoints, rec.pts, 900);
      E.resBar.style.width = (rec.pts / CFG.MAX_SCORE * 100) + "%";
    }, 250);
    E.hudScore.textContent = C.formatPoints(S.total);
  }

  /* ---------------------------------------------------------------- resultado final */
  function showFinal() {
    S.phase = "final";
    showScreen("final");
    var max = CFG.MAX_SCORE * CFG.ROUNDS;
    E.finTotal.textContent = "0";
    countUp(E.finTotal, S.total, 1100);
    E.finTitle.textContent = C.rankTitle(S.total, max);

    var prev = parseInt(safeStorageGet(BEST_KEY) || "0", 10) || 0;
    if (S.total > prev) {
      safeStorageSet(BEST_KEY, String(S.total));
      E.finBest.textContent = prev ? "Novo recorde pessoal! (anterior: " + C.formatPoints(prev) + ")" : "Primeiro recorde registrado!";
    } else {
      E.finBest.textContent = "Seu recorde: " + C.formatPoints(prev);
    }

    var withGuess = S.results.filter(function (r) { return r.km != null; });
    var avg = withGuess.length ? withGuess.reduce(function (a, r) { return a + r.km; }, 0) / withGuess.length : null;
    var best = S.results.reduce(function (a, r) { return !a || r.pts > a.pts ? r : a; }, null);
    var worst = withGuess.reduce(function (a, r) { return !a || r.km > a.km ? r : a; }, null);
    var near = withGuess.filter(function (r) { return r.km < 1; }).length;
    function stat(label, value) { return "<div class='stat'><span>" + label + "</span><strong>" + value + "</strong></div>"; }
    E.finStats.innerHTML =
      stat("Distância média", avg == null ? "—" : C.formatDistance(avg)) +
      stat("Melhor rodada", best ? C.formatPoints(best.pts) + " pts" : "—") +
      stat("Maior erro", worst ? C.formatDistance(worst.km) : "—") +
      stat("Palpites a menos de 1 km", near + " de " + S.results.length);

    E.finRows.innerHTML = S.results.map(function (r) {
      return "<tr><td>" + r.round + "</td><td>" + r.place + "<small>" + r.city + "</small></td><td>" +
        (r.km == null ? "—" : C.formatDistance(r.km)) + "</td><td>" + C.formatPoints(r.pts) + "</td></tr>";
    }).join("");

    if (!S.finMap) S.finMap = makeMap(E.finMap, false);
    setTimeout(function () {
      S.finMap.invalidateSize();
      if (S.finLayer) S.finLayer.remove();
      S.finLayer = L.layerGroup().addTo(S.finMap);
      var all = [];
      S.results.forEach(function (r) {
        var t = L.latLng(r.truePos.lat, r.truePos.lng);
        all.push(t);
        L.marker(t, { icon: pinIcon("true", r.round), keyboard: false })
          .bindTooltip(r.place, { direction: "top", offset: [0, -34] }).addTo(S.finLayer);
        if (r.guess) {
          var g = L.latLng(r.guess.lat, r.guess.lng);
          all.push(g);
          L.marker(g, { icon: pinIcon("guess", r.round), keyboard: false }).addTo(S.finLayer);
          L.polyline([g, t], { color: "#fbbf24", weight: 2.5, dashArray: "5 8" }).addTo(S.finLayer);
        }
      });
      if (all.length) S.finMap.fitBounds(L.latLngBounds(all).pad(0.2), { maxZoom: 14, animate: false });
    }, 120);
  }

  function copyResult() {
    var max = CFG.MAX_SCORE * CFG.ROUNDS;
    var lines = ["FloriGuesser — " + C.formatPoints(S.total) + "/" + C.formatPoints(max) +
                 " (" + C.rankTitle(S.total, max) + ")"];
    S.results.forEach(function (r) {
      var sq = r.pts >= 4000 ? "🟩" : r.pts >= 2000 ? "🟨" : "🟥";
      lines.push(sq + " " + r.round + ". " + r.place + " — " + C.formatDistance(r.km) + " — " + C.formatPoints(r.pts));
    });
    var text = lines.join("\n");
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); toast("Resultado copiado!"); } catch (e) { toast("Não foi possível copiar."); }
      ta.remove();
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast("Resultado copiado!"); }, fallback);
    } else fallback();
  }

  /* ---------------------------------------------------------------- menu */
  function refreshBest() {
    var b = parseInt(safeStorageGet(BEST_KEY) || "0", 10) || 0;
    E.bestScore.textContent = b ? "Seu recorde: " + C.formatPoints(b) + " pontos" : "";
  }

  function refreshProviderUI() {
    var av = availability();
    var keep = E.selProvider.value || "auto";
    var opts = [
      ["auto", "Automático (melhor disponível)", true],
      ["google", "Google Street View" + (CFG.GOOGLE_MAPS_API_KEY ? (av.google ? "" : " (indisponível)") : " (sem chave)"), av.google],
      ["mapillary", "Mapillary" + (CFG.MAPILLARY_TOKEN ? (av.mapillary ? "" : " (indisponível)") : " (sem chave)"), av.mapillary],
      ["satelite", "Satélite (vista aérea)", true]
    ];
    E.selProvider.innerHTML = opts.map(function (o) {
      return "<option value='" + o[0] + "'" + (o[2] ? "" : " disabled") + ">" + o[1] + "</option>";
    }).join("");
    var allowed = opts.filter(function (o) { return o[2]; }).map(function (o) { return o[0]; });
    E.selProvider.value = allowed.indexOf(keep) >= 0 ? keep : "auto";

    var street = [];
    if (av.google) street.push("Google Street View");
    if (av.mapillary) street.push("Mapillary");
    E.providerNote.textContent = street.length
      ? "Imagens de rua ativas: " + street.join(" + ") + ". Onde não houver cobertura, o jogo usa satélite."
      : "Nenhuma chave configurada: o jogo usará vista de satélite. Veja o README para ativar imagens de rua (Mapillary é grátis).";
    E.providerNote.classList.toggle("warn", !street.length);
  }

  /* ---------------------------------------------------------------- eventos */
  function bind() {
    E.btnPlay.addEventListener("click", startGame);
    E.btnGuess.addEventListener("click", function () { submitGuess(false); });
    E.btnNext.addEventListener("click", nextStep);
    E.btnReset.addEventListener("click", resetView);
    E.btnQuit.addEventListener("click", function () {
      if (window.confirm("Sair da partida e voltar ao menu?")) quitToMenu();
    });
    E.btnAgain.addEventListener("click", startGame);
    E.btnMenu.addEventListener("click", function () { S.gameId++; showScreen("menu"); S.phase = "menu"; refreshBest(); });
    E.btnCopy.addEventListener("click", copyResult);

    E.btnMapToggle.addEventListener("click", function () {
      S.pinned = !E.mapPanel.classList.contains("open");
      setMapOpen(S.pinned);
    });
    E.btnForward.addEventListener("click", function () { stepForward(1); });
    E.btnBack.addEventListener("click", function () { stepForward(-1); });
    E.btnMapFab.addEventListener("click", function () { setMapOpen(!E.mapPanel.classList.contains("open")); });
    E.mapPanel.addEventListener("transitionend", function () { if (S.guessMap) S.guessMap.invalidateSize(); });
    E.mapPanel.addEventListener("mouseenter", function () { if (hasHover() && S.phase === "playing") setMapOpen(true); });
    E.mapPanel.addEventListener("mouseleave", function () { if (hasHover() && !S.pinned) setMapOpen(false); });

    document.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      if (/INPUT|SELECT|TEXTAREA/.test(tag)) return;
      if (S.phase === "playing") {
        if (e.key === "Enter" && S.guess) { e.preventDefault(); submitGuess(false); }
        else if (e.key === "m" || e.key === "M") { S.pinned = !E.mapPanel.classList.contains("open"); setMapOpen(S.pinned); }
        else if (e.key === "r" || e.key === "R") { resetView(); }
        else if (e.key === "w" || e.key === "W") { stepForward(1); }
        else if (e.key === "s" || e.key === "S") { stepForward(-1); }
      } else if (S.phase === "result" && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault(); nextStep();
      }
    });

    window.addEventListener("resize", function () {
      [S.guessMap, S.resMap, S.finMap].forEach(function (m) { if (m) m.invalidateSize(); });
      if (S.view && S.view.provider === "mapillary" && S.view.handle) { try { S.view.handle.resize(); } catch (e) { /* ignora */ } }
    });
  }

  function init() {
    if (typeof L === "undefined") {
      document.body.innerHTML = "<div style='padding:32px;font:16px system-ui;color:#fff;background:#0b1020;min-height:100vh'>" +
        "<h1>Não foi possível carregar o mapa</h1><p>A biblioteca Leaflet não carregou (internet ou bloqueio de anúncios?). Recarregue a página.</p></div>";
      return;
    }
    if (!LOCAIS.length) { toast("Banco de locais vazio. Confira o arquivo locais.js."); }
    refreshProviderUI();
    refreshBest();
    bind();
    showScreen("menu");
  }

  init();
})();
