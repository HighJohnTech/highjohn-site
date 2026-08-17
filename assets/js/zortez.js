/* ==========================================================================
   ZORTEZ — behavior controller
   Progressive enhancement: if this script never runs, the launcher stays
   hidden (see zortez.css .zortez-launcher default display:none) and the
   rest of the site is completely unaffected.
   ========================================================================== */
(function(){
  'use strict';

  var root = document.getElementById('zortez-root');
  if(!root) return; // zortez disabled in _data/zortez.yml — nothing to do

  var launcher   = document.getElementById('zortez-launcher');
  var panel      = document.getElementById('zortez-panel');
  var closeBtn   = panel.querySelector('.zortez-panel-close');
  var moreToggle = panel.querySelector('.zortez-more-toggle');
  var panelBody  = panel.querySelector('.zortez-panel-body');
  var scrollCue  = document.getElementById('zortez-scroll-cue');
  var moreList   = document.getElementById('zortez-intents-secondary');
  var video      = panel.querySelector('.zortez-frame-video');
  var poster     = panel.querySelector('.zortez-frame-poster');
  var voiceBtn   = document.getElementById('zortez-voice-btn');
  var voiceAudio = document.getElementById('zortez-voice-audio');

  var isHome       = root.getAttribute('data-is-home') === 'true';
  var cooldownDays = parseInt(root.getAttribute('data-cooldown-days'), 10) || 7;
  var STORAGE_KEY  = 'hjt_zortez_intro_last_seen';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var autoCollapseTimer = null;
  var videoInitialized  = false;
  var posterInitialized = false;

  // Default no-op; replaced with real cancellation logic below only when an
  // automatic welcome is actually pending (isHome && cooldown expired).
  var cancelPendingAutoWelcome = function(){};

  /* ---------- Analytics (safe no-op if nothing is listening yet) ---------- */
  function track(eventName, detail){
    try{
      window.dispatchEvent(new CustomEvent('zortez:' + eventName, { detail: detail || {} }));
      if(window.dataLayer && typeof window.dataLayer.push === 'function'){
        window.dataLayer.push(Object.assign({ event: 'zortez_' + eventName }, detail || {}));
      }
    }catch(e){ /* analytics must never break the assistant */ }
  }

  /* ---------- Cooldown logic ---------- */
  function cooldownExpired(){
    var raw = null;
    try{ raw = window.localStorage.getItem(STORAGE_KEY); }catch(e){ return true; } // storage blocked -> treat as first visit
    if(!raw) return true;
    var last = parseInt(raw, 10);
    if(isNaN(last)) return true;
    var msPerDay = 24 * 60 * 60 * 1000;
    return (Date.now() - last) > (cooldownDays * msPerDay);
  }

  function markSeen(){
    try{ window.localStorage.setItem(STORAGE_KEY, String(Date.now())); }catch(e){ /* ignore */ }
  }

  /* ---------- Poster (lazy — only requested once Zortez is actually about to show) ---------- */
  function ensurePosterLoaded(){
    if(posterInitialized || !poster) return;
    var src = poster.getAttribute('data-src');
    if(src){ poster.src = src; }
    posterInitialized = true;
  }

  /* ---------- Video (homepage only, lazy-attached, sources added exactly once) ---------- */
  function ensureVideoSources(){
    if(videoInitialized || !video) return;
    var mp4  = video.getAttribute('data-src-mp4');
    var webm = video.getAttribute('data-src-webm');
    // MP4 first: it's the smaller file (643KB vs 1.04MB WebM) and browsers pick
    // the first <source> they can play, in document order — not the "best" one.
    if(mp4){
      var s1 = document.createElement('source'); s1.src = mp4; s1.type = 'video/mp4';
      video.appendChild(s1);
    }
    if(webm){
      var s2 = document.createElement('source'); s2.src = webm; s2.type = 'video/webm';
      video.appendChild(s2);
    }
    video.load();
    videoInitialized = true;
  }

  /* Matches the CSS mobile breakpoint exactly (max-width:640px in zortez.css).
     CSS display:none alone does not stop a browser from downloading the video —
     this is what actually prevents the request. */
  function isMobileViewport(){
    return window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
  }

  function playVideo(){
    if(!isHome || !video) return;
    if(isMobileViewport()) return; // mobile = poster/portrait + CSS orbit only, never initializes or downloads video
    ensureVideoSources();
    video.currentTime = 0; // one-shot 5.2s gesture, never loops — always restart from frame 0
    video.classList.remove('is-playing');
    if(poster) poster.style.opacity = '';
    video.play().then(function(){
      video.classList.add('is-playing');
      if(poster) poster.style.opacity = '0';
    }).catch(function(){
      /* autoplay blocked or failed — poster stays visible, nothing breaks */
    });
  }

  function pauseVideo(){
    if(video && !video.paused) video.pause();
  }

  /* ---------- Scroll cue: subtle bottom fade when more content exists below the fold ---------- */
  function updateScrollCue(){
    if(!panelBody || !scrollCue) return;
    var hasMoreBelow = (panelBody.scrollHeight - panelBody.scrollTop - panelBody.clientHeight) > 4;
    scrollCue.classList.toggle('is-visible', hasMoreBelow);
  }
  if(panelBody){
    panelBody.addEventListener('scroll', updateScrollCue, { passive: true });
    window.addEventListener('resize', updateScrollCue);
  }

  /* ---------- Open / close / minimize ----------
     isManual is only true on direct user action — automatic open/collapse
     must never steal keyboard focus from whatever the visitor is already doing. */
  function openPanel(withVideo, isManual){
    ensurePosterLoaded();
    panel.hidden = false;
    // force reflow so the transition runs
    void panel.offsetWidth;
    panel.classList.add('is-open');
    launcher.setAttribute('aria-expanded', 'true');
    if(isManual) closeBtn.focus();
    track('open');
    if(withVideo && !reducedMotion) playVideo();
    updateScrollCue();

    if(withVideo){
      clearTimeout(autoCollapseTimer);
      autoCollapseTimer = setTimeout(function(){ closePanel('auto_collapse', false); }, 8000);
    }
  }

  function closePanel(reason, isManual){
    panel.classList.remove('is-open');
    launcher.setAttribute('aria-expanded', 'false');
    clearTimeout(autoCollapseTimer);
    pauseVideo();
    if(voiceAudio && !voiceAudio.paused){
      voiceAudio.pause();
      voiceAudio.currentTime = 0;
    }
    if(voiceBtn){
      voiceBtn.classList.remove('is-playing');
      voiceBtn.setAttribute('aria-pressed', 'false');
      var vLabel = voiceBtn.querySelector('.zortez-voice-label');
      if(vLabel) vLabel.textContent = 'Hear Zortez';
    }
    markSeen();
    track(reason === 'minimize' ? 'minimize' : 'close');
    setTimeout(function(){ panel.hidden = true; }, 320); // matches CSS transition duration
    if(isManual) launcher.focus();
  }

  /* ---------- Wire up controls (all direct user actions -> manual) ---------- */
  launcher.addEventListener('click', function(){
    if(panel.classList.contains('is-open')){ closePanel('close', true); return; }
    cancelPendingAutoWelcome(); // an explicit manual open takes priority either way
    openPanel(isHome, true); // manual reopen: video only on homepage, per performance budget
  });

  closeBtn.addEventListener('click', function(){ closePanel('minimize', true); });

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && panel.classList.contains('is-open')) closePanel('close', true);
  });

  moreToggle.addEventListener('click', function(){
    var expanded = moreToggle.getAttribute('aria-expanded') === 'true';
    moreToggle.setAttribute('aria-expanded', String(!expanded));
    moreList.hidden = expanded;
    updateScrollCue();
  });

  var allIntentBtns = panel.querySelectorAll('[data-zortez-intent]');
  for(var i=0; i<allIntentBtns.length; i++){
    allIntentBtns[i].addEventListener('click', function(e){
      track('intent_selected', { intent: e.currentTarget.getAttribute('data-zortez-intent') });
      markSeen(); // choosing a destination counts as "seen" — don't re-greet on the next page
    });
  }

  /* ---------- Voice / speaker control ----------
     No autoplay, ever — only plays after an explicit tap. If the MP3 doesn't
     exist yet (or fails to load for any reason), this fails silently: the
     button just returns to its default state, nothing breaks, nothing errors
     visibly. Same button re-used to stop/replay. */
  if(voiceBtn && voiceAudio){
    var voiceLabel = voiceBtn.querySelector('.zortez-voice-label');

    function setVoicePlaying(isPlaying){
      voiceBtn.classList.toggle('is-playing', isPlaying);
      voiceBtn.setAttribute('aria-pressed', String(isPlaying));
      if(voiceLabel) voiceLabel.textContent = isPlaying ? 'Stop' : 'Hear Zortez';
    }

    voiceBtn.addEventListener('click', function(){
      if(!voiceAudio.paused){
        voiceAudio.pause();
        voiceAudio.currentTime = 0;
        setVoicePlaying(false);
        return;
      }
      voiceAudio.play().then(function(){
        setVoicePlaying(true);
        track('voice_play');
      }).catch(function(){
        /* missing file, decode error, blocked — button just stays "Hear Zortez".
           Character/video continue working normally regardless. */
        setVoicePlaying(false);
      });
    });

    voiceAudio.addEventListener('ended', function(){ setVoicePlaying(false); });
    voiceAudio.addEventListener('error', function(){ setVoicePlaying(false); });
  }

  /* ---------- Reveal launcher (only once JS has actually run successfully) ---------- */
  launcher.classList.add('is-ready');

  /* ---------- First-visit / cooldown eligibility (homepage only) ----------
     Cancel the automatic welcome if the visitor is already actively using the
     page during the pre-intro delay — scrolling, clicking, typing, or
     navigating by keyboard all count as "they know where they're going."
     A cancelled auto-welcome does NOT mark the intro as seen: it stays
     eligible to try again on a genuinely fresh load. */
  if(isHome && cooldownExpired()){
    var autoWelcomeCancelled = false;
    var cleanupListeners = [];

    cancelPendingAutoWelcome = function(){
      if(autoWelcomeCancelled) return;
      autoWelcomeCancelled = true;
      cleanupListeners.forEach(function(fn){ fn(); });
    };

    function addEngagementListener(target, type, handler, opts){
      target.addEventListener(type, handler, opts);
      cleanupListeners.push(function(){ target.removeEventListener(type, handler, opts); });
    }

    var scrollStartY = window.scrollY;
    addEngagementListener(window, 'scroll', function(){
      if(Math.abs(window.scrollY - scrollStartY) > 40) cancelPendingAutoWelcome();
    }, { passive: true });

    addEngagementListener(document, 'pointerdown', cancelPendingAutoWelcome, { passive: true });
    addEngagementListener(document, 'keydown', cancelPendingAutoWelcome, { passive: true });
    addEngagementListener(document, 'input', cancelPendingAutoWelcome, { passive: true });

    window.addEventListener('load', function(){
      setTimeout(function(){
        cleanupListeners.forEach(function(fn){ fn(); }); // decision window is over either way
        if(autoWelcomeCancelled) return;
        track('intro_view');
        openPanel(true, false); // automatic — never steals focus
      }, 2000);
    });
  }

})();
