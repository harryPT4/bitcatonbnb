(function(){
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isNight(){ return document.documentElement.getAttribute('data-theme') === 'night'; }
  /* canvas and generated SVG can't inherit CSS tokens, so keep a matching palette here */
  function TC(){
    return isNight() ? {
      grid:'rgba(244,235,221,.10)', axis:'#7A6E5C',
      area:'247,147,26', line:'#F7931A', glow:'rgba(247,147,26,.45)',
      halo:'rgba(255,194,75,.25)', dot:'#FFC24B',
      cross:'rgba(244,235,221,.32)', hover:'#FFC24B',
      zones:['#5A3F14','#C46F08','#F7931A','#FFC24B'],
      mood:['#B8823C','#F7931A','#F7931A','#FFC24B']
    } : {
      grid:'rgba(21,18,14,.09)', axis:'#8C8477',
      area:'227,162,26', line:'#B8820F', glow:'rgba(227,162,26,.30)',
      halo:'rgba(227,162,26,.28)', dot:'#B8820F',
      cross:'rgba(21,18,14,.30)', hover:'#15120E',
      zones:['#E5D19A','#E3A21A','#B8820F','#2A2118'],
      mood:['#8A6008','#8A5B00','#8A6008','#15120E']
    };
  }
  var CA = '0x7d1A8DBB40B7b5518ef69b93a6fAEba91eea7777';

  // Keep the source order stable: no post-load section moves or layout jumps.
  function fetchData(url, options){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 10000);
    return fetch(url, Object.assign({}, options, {signal: controller.signal}))
      .then(function(response){
        if(!response.ok) throw new Error('Data source unavailable');
        return response.json();
      }).finally(function(){ clearTimeout(timer); });
  }

  /* ---- responsive site menu ---- */
  var menuBtn = document.getElementById('menuBtn');
  var siteNav = document.getElementById('siteNav');
  function closeMenu(){
    siteNav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-label', 'Open site menu');
    menuBtn.textContent = '☰';
  }
  menuBtn.addEventListener('click', function(){
    var open = !siteNav.classList.contains('open');
    if(open){
      siteNav.classList.add('open');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.setAttribute('aria-label', 'Close site menu');
      menuBtn.textContent = '×';
    } else closeMenu();
  });
  siteNav.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeMenu(); });

  /* ---- the cat (official pfp) ---- */
  var cat = document.getElementById('catImg');
  var navPfp = document.getElementById('navPfp');
  if(navPfp) navPfp.src = cat.src;
  cat.src = 'assets/bitcat-mascot-transparent.png';
  cat.alt = 'Bitcat mascot with a gold Bitcoin — interactive; try the head, belly and coin.';
  var catGaze = document.createElement('div');
  catGaze.className = 'cat-gaze';
  var catArt = document.createElement('div');
  catArt.className = 'cat-art';
  cat.parentNode.insertBefore(catGaze,cat);
  catGaze.appendChild(catArt);
  catArt.appendChild(cat);
  var catFace = document.createElement('div');
  catFace.className = 'cat-face';
  catFace.setAttribute('aria-hidden','true');
  ['left','right'].forEach(function(side){
    var eye = document.createElement('span');
    eye.className = 'cat-eye ' + side;
    catFace.appendChild(eye);
  });
  catArt.appendChild(catFace);
  /* ---- source-backed milestone board ---- */
  var milestoneSats = 73096688, milestoneHolders = 1961;
  var mileSatsValue = document.getElementById('mileSatsValue'), mileSatsFill = document.getElementById('mileSatsFill');
  var mileHoldersValue = document.getElementById('mileHoldersValue'), mileHoldersFill = document.getElementById('mileHoldersFill');
  var mileBtcbValue = document.getElementById('mileBtcbValue'), mileBtcbFill = document.getElementById('mileBtcbFill');
  var milePetsValue = document.getElementById('milePetsValue'), milePetsFill = document.getElementById('milePetsFill');
  function nextPetGoal(n){
    var goals=[777,1000,2500,5000,10000];
    for(var i=0;i<goals.length;i++) if(n<goals[i]) return goals[i];
    return Math.ceil(n/10000)*10000+10000;
  }
  function updateMilestones(sats,holders,pets){
    if(sats!==null && sats!==undefined && isFinite(sats) && sats>=0) milestoneSats=sats;
    if(holders!==null && holders!==undefined && isFinite(holders) && holders>=0) milestoneHolders=holders;
    var petNow=(pets!==null && pets!==undefined && isFinite(pets)) ? pets : (typeof globalPets==='number' ? globalPets : 0);
    mileSatsValue.textContent=Math.round(milestoneSats).toLocaleString()+' · 75M / 100M';
    mileSatsFill.style.width=Math.min(100,milestoneSats/1e8*100).toFixed(2)+'%';
    mileBtcbValue.textContent=(milestoneSats/1e8).toFixed(8)+' / 1';
    mileBtcbFill.style.width=Math.min(100,milestoneSats/1e8*100).toFixed(2)+'%';
    mileHoldersValue.textContent=Math.round(milestoneHolders).toLocaleString()+' / 5,000*';
    mileHoldersFill.style.width=Math.min(100,milestoneHolders/5000*100).toFixed(2)+'%';
    var petGoal=nextPetGoal(petNow);
    milePetsValue.textContent=Math.round(petNow).toLocaleString()+' / '+petGoal.toLocaleString();
    milePetsFill.style.width=Math.min(100,petNow/petGoal*100).toFixed(2)+'%';
  }
  updateMilestones();
  /* ---- pets: local streak + global counter via db ---- */
  var stage = document.getElementById('catStage');
  var petEl = document.getElementById('petCount');
  var streakChip = document.getElementById('streakChip');
  var globalPets = 0, db = null, petsDoc = null, pushTimer = null;
  var ABACUS = 'https://abacus.jasoncameron.dev', abacusOn = false, pendingHits = 0, sendingHit = false;

  function setCount(n){
    if(typeof n === 'number' && n > globalPets){
      globalPets = n;
      petEl.textContent = globalPets.toLocaleString();
      updateMilestones(null,null,globalPets);
      checkLuckyNumber(globalPets,'The community pet counter landed on lucky 7777.');
    }
  }

  function showStreak(){
    try{
      var s = JSON.parse(localStorage.getItem('bitcat-streak')||'null');
      if(s && s.streak > 1){
        streakChip.textContent = '🔥 ' + s.streak + '-day pet streak';
        streakChip.style.display = 'inline-block';
      }
    }catch(e){}
  }
  function bumpStreak(){
    try{
      var today = new Date().toISOString().slice(0,10);
      var y = new Date(Date.now()-864e5).toISOString().slice(0,10);
      var s = JSON.parse(localStorage.getItem('bitcat-streak')||'null') || {last:'', streak:0};
      if(s.last !== today){
        s.streak = (s.last === y) ? s.streak+1 : 1;
        s.last = today;
        localStorage.setItem('bitcat-streak', JSON.stringify(s));
      }
    }catch(e){}
    showStreak();
  }
  showStreak();

  /* global count: claude db on the claude.ai artifact, Abacus on the open web */
  function initAbacus(){
    try{
      fetch(ABACUS + '/get/bitcat-site/pets').then(function(r){
        abacusOn = true;
        return r.ok ? r.json() : null;
      }).then(function(j){
        if(j) setCount(j.value);
      }).catch(function(){});
    }catch(e){}
  }
  function sendHits(){
    if(sendingHit || pendingHits <= 0 || !abacusOn) return;
    sendingHit = true; pendingHits--;
    var done = function(){ sendingHit = false; sendHits(); };
    fetch(ABACUS + '/hit/bitcat-site/pets').then(function(r){
      return r.ok ? r.json() : null;
    }).then(function(j){
      if(j) setCount(j.value);
      done();
    }, done);
  }
  if(window.claude && claude.use){
    claude.use('db').then(function(ns){
      if(!ns){ initAbacus(); return; }
      db = ns;
      petsDoc = db.doc('stats/pets');
      try{
        petsDoc.onSnapshot(function(snap){
          var data = snap && snap.data ? snap.data() : null;
          if(data) setCount(data.count);
        });
      }catch(e){}
    }).catch(function(){ initAbacus(); });
  } else {
    initAbacus();
  }
  function pushPets(){
    if(!petsDoc) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function(){
      try{ petsDoc.set({count: globalPets, updated: Date.now()}); }catch(e){}
    }, 900);
  }

  /* ---- Bitcat companion: tilt, hotspots, voice, sound and secret zoomies ---- */
  var catTilt = document.getElementById('catTilt');
  var catSpeech = document.getElementById('catSpeech');
  var speechTimer = null, reactionTimer = null, companionHits = 0, lastCatAction = Date.now();
  cat.setAttribute('tabindex','0');
  cat.setAttribute('role','button');
  cat.setAttribute('aria-label','Pet Bitcat');
  cat.setAttribute('aria-describedby','companionHint');

  function pickCat(lines){ return lines[Math.floor(Math.random()*lines.length)]; }
  function sayCat(text, duration){
    clearTimeout(speechTimer);
    lastCatAction = Date.now();
    catSpeech.textContent = text;
    catSpeech.classList.add('show');
    speechTimer = setTimeout(function(){ catSpeech.classList.remove('show'); }, duration || 2800);
  }
  /* ---- Lucky 7777: CA copy, lucky counters and four hidden paws ---- */
  var luckyOverlay=document.getElementById('luckyOverlay'), luckyReason=document.getElementById('luckyReason');
  var luckyClose=document.getElementById('luckyClose'), luckyActive=false, luckyNumbers={};
  function closeLucky(){
    luckyOverlay.classList.remove('show'); luckyOverlay.setAttribute('aria-hidden','true');
    stage.classList.remove('lucky-7777'); luckyActive=false;
  }
  function triggerLucky(reason){
    if(luckyActive) return;
    luckyActive=true; luckyReason.textContent=reason || 'The rare gold cat has appeared.';
    luckyOverlay.classList.add('show'); luckyOverlay.setAttribute('aria-hidden','false');
    stage.classList.add('lucky-7777'); sayCat('7777 detected. Golden mode unlocked.',4200);
    setTimeout(function(){ luckyClose.focus(); },80);
  }
  function checkLuckyNumber(value,reason){
    var digits=String(Math.round(Number(value)||0));
    if(digits.indexOf('7777')<0 || luckyNumbers[digits]) return;
    luckyNumbers[digits]=1; triggerLucky(reason || ('Lucky number '+digits+' appeared.'));
  }
  luckyClose.addEventListener('click',closeLucky);
  luckyOverlay.addEventListener('click',function(e){ if(e.target===luckyOverlay) closeLucky(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape' && luckyActive) closeLucky(); });
  (function plantLuckyPaws(){
    var hosts=['how','calc','hunt','milestones'], spots=[['8%','78%','-14deg'],['76%','12%','12deg'],['12%','88%','18deg'],['82%','83%','-9deg']];
    var found=[]; try{ found=JSON.parse(localStorage.getItem('bitcat-lucky-paws')||'[]'); }catch(e){}
    hosts.forEach(function(id,i){
      var host=document.getElementById(id); if(!host) return; host.classList.add('paw-host');
      var paw=document.createElement('button'); paw.type='button'; paw.className='lucky-paw'; paw.textContent='🐾';
      paw.style.left=spots[i][0]; paw.style.top=spots[i][1]; paw.style.setProperty('--paw-r',spots[i][2]);
      paw.setAttribute('aria-label','Hidden lucky paw '+(i+1));
      if(found.indexOf(i)>=0) paw.classList.add('found');
      paw.addEventListener('click',function(){
        if(found.indexOf(i)<0) found.push(i);
        paw.classList.add('found');
        try{ localStorage.setItem('bitcat-lucky-paws',JSON.stringify(found)); }catch(e){}
        if(found.length>=4) triggerLucky('All four hidden pawprints found. The rare gold cat approves.');
        else sayCat('Hidden paw '+found.length+' of 4 found.',2200);
      });
      host.appendChild(paw);
    });
  })();
  function animateCat(kind){
    clearTimeout(reactionTimer);
    ['react-head','react-belly','react-bitcoin'].forEach(function(name){ stage.classList.remove(name); });
    void cat.offsetWidth;
    stage.classList.add('react-' + kind);
    reactionTimer = setTimeout(function(){ stage.classList.remove('react-' + kind); },760);
  }
  function companionHit(){
    companionHits++;
    lastCatAction = Date.now();
    if(companionHits % 7 === 0){
      stage.classList.add('bonus-zoomies');
      sayCat('Secret zoomies unlocked. Seven taps was the password.',4200);
      setTimeout(function(){ stage.classList.remove('bonus-zoomies'); },4200);
    }
  }
  function burstAt(clientX, clientY, words){
    if(reduced) return;
    var r = stage.getBoundingClientRect();
    var x = isFinite(clientX) ? clientX-r.left : r.width/2;
    var y = isFinite(clientY) ? clientY-r.top : r.height/2;
    for(var i=0;i<3;i++){
      var c = document.createElement('div');
      c.className = 'coin';
      c.textContent = words ? words[i % words.length] : (Math.random() < .65 ? '₿' : '+sats');
      c.style.left = (x - 10 + (Math.random()*60-30)) + 'px';
      c.style.top  = (y - 10 + (Math.random()*20-10)) + 'px';
      c.style.fontSize = (14 + Math.random()*12) + 'px';
      stage.appendChild(c);
      setTimeout(function(el){ return function(){ el.remove(); }; }(c),1200);
    }
  }
  function petCat(clientX,clientY){
    globalPets++;
    petEl.textContent = globalPets.toLocaleString();
    updateMilestones(null,null,globalPets);
    checkLuckyNumber(globalPets,'The community pet counter landed on lucky 7777.');
    pushPets();
    if(abacusOn){ pendingHits++; sendHits(); }
    bumpStreak();
    animateCat('head');
    companionHit();
    if(companionHits % 7 !== 0) sayCat(pickCat(['Good human.','Purr protocol accepted.','Pet received. Sats still pending.','You may continue.']));
    burstAt(clientX,clientY,['♥','purr','✦']);
  }
  cat.addEventListener('click',function(e){ petCat(e.clientX,e.clientY); });
  cat.addEventListener('keydown',function(e){
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); petCat(NaN,NaN); }
  });
  document.querySelectorAll('.cat-hotspot').forEach(function(zone){
    zone.addEventListener('click',function(e){
      e.stopPropagation();
      var action = zone.getAttribute('data-cat-action');
      var zr = zone.getBoundingClientRect();
      var zx = zr.left+zr.width/2, zy = zr.top+zr.height/2;
      if(action === 'head') petCat(zx,zy);
      if(action === 'belly'){
        companionHit(); animateCat('belly');
        burstAt(zx,zy,['!','?','!']);
        if(companionHits % 7 !== 0) sayCat(pickCat(['Personal space, please.','That is not the treat button.','Belly access temporarily denied.']));
      }
      if(action === 'bitcoin'){
        companionHit(); animateCat('bitcoin'); burstAt(zx,zy,['₿','+sats']);
        if(companionHits % 7 !== 0) sayCat(pickCat(['Vault inspected. Still shiny.','This Bitcoin is load-bearing.','Hands off the paycheck.']));
      }
    });
  });
  if(!reduced && matchMedia('(pointer:fine)').matches){
    var eyeX = 0, eyeY = 0, eyeTargetX = 0, eyeTargetY = 0, eyeFrame = 0;
    function renderEyeGaze(){
      eyeX += (eyeTargetX-eyeX)*.16;
      eyeY += (eyeTargetY-eyeY)*.16;
      catArt.style.setProperty('--pupil-x',eyeX.toFixed(2)+'px');
      catArt.style.setProperty('--pupil-y',eyeY.toFixed(2)+'px');
      if(Math.abs(eyeTargetX-eyeX)>.03 || Math.abs(eyeTargetY-eyeY)>.03) eyeFrame=requestAnimationFrame(renderEyeGaze);
      else eyeFrame=0;
    }
    function aimEyes(x,y){
      eyeTargetX=x; eyeTargetY=y;
      if(!eyeFrame) eyeFrame=requestAnimationFrame(renderEyeGaze);
    }
    catTilt.addEventListener('pointermove',function(e){
      var r = catTilt.getBoundingClientRect();
      var px = Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));
      var py = Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));
      var dx=(px-.5)*2, dy=(py-.5)*2;
      var distance=Math.max(1,Math.sqrt((dx*dx)+(dy*dy)));
      dx/=distance; dy/=distance;
      var rx = ((.5-py)*2.6).toFixed(2), ry = ((px-.5)*3.8).toFixed(2);
      catGaze.style.transform = 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-2px)';
      aimEyes(dx*4.1,dy*2.8);
    });
    catTilt.addEventListener('pointerleave',function(){
      catGaze.style.transform = '';
      aimEyes(0,0);
    });
  }
  setInterval(function(){
    var r = stage.getBoundingClientRect();
    var visible = r.bottom > 0 && r.top < innerHeight;
    if(visible && document.visibilityState === 'visible' && Date.now()-lastCatAction > 14000){
      sayCat(pickCat(['Are you still staring?','The chart will not pet itself.','Mouse patrol is serious work.','I accept payment in attention.']),3200);
    }
  },16000);

  /* ---- daily mouse hunt: one find per local calendar day ---- */
  var dailyMouse = document.getElementById('dailyMouse');
  var mouseHint = document.getElementById('mouseHint');
  var mouseToast = document.getElementById('mouseToast');
  var mouseToastText = document.getElementById('mouseToastText');
  var shareMouse = document.getElementById('shareMouse');
  var mouseState = {last:'', streak:0, total:0};
  function localDay(d){
    function z(n){ return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + z(d.getMonth()+1) + '-' + z(d.getDate());
  }
  var mouseToday = localDay(new Date());
  var mouseYesterdayDate = new Date();
  mouseYesterdayDate.setDate(mouseYesterdayDate.getDate()-1);
  var mouseYesterday = localDay(mouseYesterdayDate);
  try{ mouseState = JSON.parse(localStorage.getItem('bitcat-mouse-hunt')||'null') || mouseState; }catch(e){}
  function mouseLabel(){
    if(mouseState.last === mouseToday){
      mouseHint.textContent = mouseState.total.toLocaleString() + (mouseState.total === 1 ? ' mouse caught' : ' mice caught') + ' · back tomorrow';
    } else {
      mouseHint.textContent = 'daily mouse hunt · ' + (mouseState.streak ? mouseState.streak + '-day streak' : 'ready');
    }
  }
  mouseLabel();
  var mouseHosts = ['how','market','vault','receipts','hunt','bowl','story','faq','lives'];
  var mouseSeed = +mouseToday.replace(/-/g,'');
  var mouseHost = document.getElementById(mouseHosts[mouseSeed % mouseHosts.length]);
  if(mouseState.last !== mouseToday && mouseHost){
    mouseHost.classList.add('mouse-host');
    mouseHost.appendChild(dailyMouse);
    dailyMouse.style[(mouseSeed % 2) ? 'left' : 'right'] = (8 + mouseSeed % 28) + 'px';
    dailyMouse.hidden = false;
    requestAnimationFrame(function(){
      var available = Math.max(100, mouseHost.offsetHeight - 120);
      dailyMouse.style.top = (55 + (mouseSeed * 17) % available) + 'px';
    });
  }
  var toastTimer;
  function showMouseToast(text){
    clearTimeout(toastTimer);
    mouseToastText.textContent = text;
    mouseToast.classList.add('show');
    toastTimer = setTimeout(function(){ mouseToast.classList.remove('show'); }, 5200);
  }
  dailyMouse.addEventListener('click', function(){
    if(mouseState.last === mouseToday) return;
    mouseState.streak = mouseState.last === mouseYesterday ? mouseState.streak + 1 : 1;
    mouseState.last = mouseToday;
    mouseState.total = (mouseState.total || 0) + 1;
    try{ localStorage.setItem('bitcat-mouse-hunt', JSON.stringify(mouseState)); }catch(e){}
    mouseLabel();
    if(!reduced) dailyMouse.classList.add('is-caught');
    setTimeout(function(){ dailyMouse.hidden = true; }, reduced ? 0 : 520);
    showMouseToast('Mouse caught! ' + mouseState.streak + '-day hunt streak. The cat approves.');
  });
  mouseHint.addEventListener('click', function(){
    if(mouseState.last === mouseToday){
      showMouseToast('Today\'s mouse is safely in the bowl. A new one appears tomorrow.');
      return;
    }
    dailyMouse.scrollIntoView({behavior:reduced ? 'auto' : 'smooth', block:'center'});
    dailyMouse.classList.remove('is-hinted');
    void dailyMouse.offsetWidth;
    dailyMouse.classList.add('is-hinted');
    setTimeout(function(){ dailyMouse.focus({preventScroll:true}); }, reduced ? 0 : 500);
  });
  shareMouse.addEventListener('click', function(){
    var text = 'I caught today\'s BITCAT mouse — hunt streak: ' + mouseState.streak + ' day' + (mouseState.streak === 1 ? '' : 's') + '.';
    if(navigator.share){ navigator.share({title:'BITCAT daily mouse hunt', text:text, url:location.href.split('#')[0]}).catch(function(){}); }
    else if(navigator.clipboard){ navigator.clipboard.writeText(text + ' ' + location.href.split('#')[0]).then(function(){ showMouseToast('Streak copied — ready to share.'); }); }
  });

  /* ---- BTCB odometer ---- */
  var odo = document.getElementById('satsOdo');
  var TARGET_BTCB = 0.73096688;
  /* the chain value always wins: once it lands the count-up stops writing, and a
     timer settles the number even if rAF is throttled (hidden tab) and never finishes */
  var odoLive = false;
  function odoSettle(){ if(!odoLive) odo.textContent = TARGET_BTCB.toFixed(8) + ' BTCB'; }
  if(!reduced){
    var startV = TARGET_BTCB*0.985, t0 = null;
    var tick = function(ts){
      if(odoLive) return;
      if(!t0) t0 = ts;
      var p = Math.min(1, (ts-t0)/1600);
      var eased = 1 - Math.pow(1-p, 3);
      odo.textContent = (startV + (TARGET_BTCB-startV)*eased).toFixed(8) + ' BTCB';
      if(p < 1) requestAnimationFrame(tick); else odoSettle();
    };
    requestAnimationFrame(tick);
    setTimeout(odoSettle, 2000);
  }

  /* ---- hunt log: real snapshot, revealed one by one ---- */
  var trades = [
    {k:'sell', usd:62.42,   amt:'156,906',   t:'06:14:21'},
    {k:'buy',  usd:4.25,    amt:'10,605',    t:'06:14:20'},
    {k:'sell', usd:1024.08, amt:'2,501,273', t:'06:14:10'},
    {k:'buy',  usd:98.85,   amt:'234,579',   t:'06:14:08'},
    {k:'buy',  usd:54.42,   amt:'129,830',   t:'06:13:04'},
    {k:'sell', usd:2.93,    amt:'7,022',     t:'06:12:37'},
    {k:'buy',  usd:1.89,    amt:'4,510',     t:'06:12:32'},
    {k:'buy',  usd:29.65,   amt:'70,736',    t:'06:11:26'},
    {k:'buy',  usd:287.39,  amt:'691,636',   t:'06:10:41'},
    {k:'sell', usd:16.90,   amt:'41,148',    t:'06:10:37'},
    {k:'buy',  usd:37.31,   amt:'90,536',    t:'06:09:45'},
    {k:'buy',  usd:65.01,   amt:'158,241',   t:'06:08:56'}
  ];
  var buyLines  = ['caught a <b>$USD</b> mouse', 'pounced on <b>$USD</b>', 'dragged home a <b>$USD</b> bird', 'cornered <b>$USD</b> behind the fridge'];
  var sellLines = ['hairball — <b>$USD</b> coughed up', 'knocked <b>$USD</b> off the table', 'let a <b>$USD</b> mouse go (on purpose, surely)'];
  var huntList = document.getElementById('huntList');
  var huntTheatre = document.getElementById('huntTheatre'), huntSceneLabel = document.getElementById('huntSceneLabel');
  var huntTheatreTimer = null;
  function animateHunt(kind,label){
    if(!huntTheatre) return;
    clearTimeout(huntTheatreTimer);
    huntTheatre.classList.remove('play-buy','play-sell','play-payout');
    void huntTheatre.offsetWidth;
    huntSceneLabel.textContent=label || (kind==='buy' ? 'new buy · mouse delivered' : kind==='sell' ? 'new sell · hairball incoming' : 'vault payout · Bitcoin crumb');
    if(!reduced) huntTheatre.classList.add('play-'+kind);
    huntTheatreTimer=setTimeout(function(){
      huntTheatre.classList.remove('play-buy','play-sell','play-payout');
      huntSceneLabel.textContent='watching for the next catch…';
    },1700);
  }
  function fmtUsd(u){ return '$' + (u>=100 ? Math.round(u).toLocaleString() : u.toFixed(2)); }
  function tradeLi(tr, i){
    var pool = tr.k==='buy' ? buyLines : sellLines;
    var line = pool[i % pool.length].replace('$USD', fmtUsd(tr.usd));
    var li = document.createElement('li');
    li.className = tr.k;
    li.innerHTML = '<span>' + (tr.k==='buy' ? '🐭' : '😾') + '</span>' +
      '<span class="what">' + line + '</span>' +
      '<span class="amt">' + tr.amt + ' BITCAT · ' + tr.t + '</span>';
    return li;
  }
  var MAX_ROWS = 8, huntKeys = {};
  function hkey(t){ return t.k + '|' + t.usd + '|' + t.amt + '|' + t.t; }
  function renderHunt(list, animateNew){
    var oldKeys=huntKeys, newCount = 0, firstNew=null;
    if(animateNew) list.slice(0, MAX_ROWS).forEach(function(t){
      if(!oldKeys[hkey(t)]){ newCount++; if(!firstNew) firstNew=t; }
    });
    huntKeys = {};
    while(huntList.firstChild) huntList.removeChild(huntList.firstChild);
    list.slice(0, MAX_ROWS).forEach(function(t, i){
      huntKeys[hkey(t)] = 1;
      var li = tradeLi(t, i);
      if(animateNew && !reduced && i < newCount) li.classList.add('fresh');
      huntList.appendChild(li);
    });
    if(firstNew) animateHunt(firstNew.k,(firstNew.k==='buy' ? 'new buy · mouse into the bowl' : 'new sell · playful hairball')+' · '+fmtUsd(firstNew.usd));
  }
  renderHunt(trades, false);
  function setTrades(list){
    if(!list || !list.length) return;
    trades = list;
    renderHunt(trades, true);
  }

  /* ---- purr gauge: zones + scale adapt to the volume ---- */
  var VOL24 = 197405; /* fallback 24h volume, USD */
  var catMood = document.getElementById('catMood');
  var lastCompanionMood = null;
  function setCatMood(level){
    var names = ['sleepy','purring','alert','zoomies'];
    var labels = ['sleepy','steady purr','on the prowl','zoomies'];
    var reactions = ['Volume is quiet. Nap protocol active.','A respectable purr has begun.','Movement detected. I am watching.','Volume spike. Initiating zoomies.'];
    names.forEach(function(name){ stage.classList.remove('mood-' + name); });
    stage.classList.add('mood-' + names[level]);
    catMood.innerHTML = 'live mood · <b>' + labels[level] + '</b>';
    catMood.title = 'Mood responds to current 24-hour trading volume';
    if(lastCompanionMood !== null && lastCompanionMood !== level) sayCat(reactions[level],3600);
    lastCompanionMood = level;
  }
  function renderGauge(VOL24){
    var steps = [50e3, 100e3, 250e3, 500e3, 1e6, 2.5e6, 5e6, 10e6, 25e6];
    var top = steps.find(function(x){ return x >= VOL24*1.4; }) || VOL24*2;
    function fmt(n){ return n >= 1e6 ? '$'+(n/1e6).toLocaleString()+'M' : '$'+Math.round(n/1e3)+'K'; }
    var C = {x:150, y:158}, R = 118, NS = 'http://www.w3.org/2000/svg';
    function pt(deg){
      var t = deg*Math.PI/180;
      return [C.x - R*Math.cos(t), C.y - R*Math.sin(t)];
    }
    function arc(a0, a1){
      var p0 = pt(a0), p1 = pt(a1);
      return 'M'+p0[0].toFixed(1)+' '+p0[1].toFixed(1)+' A'+R+' '+R+' 0 0 1 '+p1[0].toFixed(1)+' '+p1[1].toFixed(1);
    }
    var tc = TC(), colors = tc.zones, moodInk = tc.mood;
    var moods  = ['SOFT PURR','STEADY PURR','DEEP RUMBLE','MEGA PURR'];
    var bounds = [0, .15, .40, .75, 1]; /* soft | steady | deep rumble | mega */
    var frac = Math.min(1, VOL24/top);
    var active = 3;
    for(var j=0;j<4;j++){ if(frac < bounds[j+1]){ active = j; break; } }
    var zones = document.getElementById('gZones');
    while(zones.firstChild) zones.removeChild(zones.firstChild);
    for(var i=0;i<4;i++){
      var a0 = bounds[i]*180 + (i===0 ? 0 : 2), a1 = bounds[i+1]*180 - (i===3 ? 0 : 2);
      var p = document.createElementNS(NS,'path');
      p.setAttribute('d', arc(a0, a1));
      p.setAttribute('fill','none');
      p.setAttribute('stroke', colors[i]);
      p.setAttribute('stroke-width','16');
      p.setAttribute('stroke-linecap','round');
      p.setAttribute('opacity', i===active ? '1' : '.35');
      zones.appendChild(p);
    }
    var ticks = document.getElementById('gTicks');
    while(ticks.firstChild) ticks.removeChild(ticks.firstChild);
    [['$0', 32, 182], [fmt(top/2), 150, 22], [fmt(top), 268, 182]].forEach(function(t){
      var el = document.createElementNS(NS,'text');
      el.setAttribute('x', t[1]); el.setAttribute('y', t[2]); el.setAttribute('text-anchor', 'middle');
      el.textContent = t[0];
      ticks.appendChild(el);
    });
    document.getElementById('purrRead').innerHTML =
      fmt(VOL24) + " / 24h → <b style='color:" + moodInk[active] + "'>" + moods[active] + "</b>";
    setCatMood(active);
    setTimeout(function(){
      document.getElementById('needle').style.transform = 'rotate(' + (-90 + frac*180) + 'deg)';
    }, reduced ? 0 : 400);
  }
  var lastVol = VOL24;
  renderGauge(lastVol);

  /* ---- calculator ---- */
  // Total DEX volume includes buys and sells. Apply the per-trade fee once.
  var SUPPLY = 1e9, TAX = 0.01, MIN = 10000;
  var hold = document.getElementById('hold'), holdRange = document.getElementById('holdRange');
  var vol = document.getElementById('vol'), btcp = document.getElementById('btcp');
  var outBtcb = document.getElementById('outBtcb'),
      outSats = document.getElementById('outSats'), outUsd = document.getElementById('outUsd'),
      outMo = document.getElementById('outMo'), elig = document.getElementById('eligible'),
      calcGuidance = document.getElementById('calcGuidance');
  function calc(){
    var h = Math.min(SUPPLY, Math.max(0, +hold.value||0)), v = Math.max(0, +vol.value||0), b = Math.max(1, +btcp.value||1);
    var usd = h >= MIN ? v * TAX * (h / SUPPLY) : 0;
    var sats = usd / b * 1e8;
    checkLuckyNumber(sats,'Your estimated daily sats revealed lucky 7777.');
    outBtcb.textContent = (usd/b).toFixed(8);
    outSats.textContent = Math.round(sats).toLocaleString();
    outUsd.textContent = usd.toFixed(2);
    outMo.textContent = Math.round(usd*30).toLocaleString();
    if(h >= MIN){
      elig.textContent = '✓ eligible threshold met'; elig.className = 'eligible yes';
      calcGuidance.textContent = 'Your bag clears the 10,000 BITCAT eligibility threshold.';
    } else {
      var gap = MIN - h;
      elig.textContent = 'Not eligible yet'; elig.className = 'eligible no';
      calcGuidance.textContent = 'This holding is ' + Math.ceil(gap).toLocaleString() + ' BITCAT below the eligibility threshold. Estimated rewards are zero.';
    }
  }
  hold.addEventListener('input', function(){ holdRange.value = Math.min(+holdRange.max, +hold.value||0); calc(); });
  holdRange.addEventListener('input', function(){ hold.value = holdRange.value; calc(); });
  vol.addEventListener('input', calc);
  btcp.addEventListener('input', calc);
  calc();
  var postcardBtn = document.getElementById('shareCalc');
  var postcardStatus = document.getElementById('postcardStatus');
  function makePostcard(){
    var canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 630;
    var c = canvas.getContext('2d');
    var h=Number(hold.value||0), v=Number(vol.value||0), b=Number(btcp.value||0);
    c.fillStyle='#FCFBF7'; c.fillRect(0,0,1200,630);
    c.fillStyle='#F1E1B4'; c.beginPath(); c.arc(1040,330,330,0,Math.PI*2); c.fill();
    c.fillStyle='#15120E'; c.fillRect(0,0,1200,18);
    c.fillStyle='#E3A21A'; c.fillRect(0,18,1200,9);
    c.strokeStyle='#D8CDBD'; c.lineWidth=2; c.strokeRect(38,54,1124,536);
    c.fillStyle='#15120E'; c.font='38px "Bowlby One SC", Arial Black, sans-serif'; c.fillText('BITCAT',72,112);
    c.fillStyle='#8A5B00'; c.font='17px "IBM Plex Mono", monospace'; c.fillText('DAILY SATS POSTCARD · BNB CHAIN',72,146);
    c.fillStyle='#15120E'; c.font='34px "Atkinson Hyperlegible", Arial, sans-serif';
    c.fillText('My cat could bring home ≈',72,224);
    c.fillStyle='#E3A21A'; c.font='700 65px "IBM Plex Mono", monospace';
    c.fillText(outSats.textContent+' sats/day.',72,304);
    c.fillStyle='#5B5348'; c.font='22px "IBM Plex Mono", monospace';
    c.fillText('≈ $'+outUsd.textContent+'/day · $'+outMo.textContent+'/month',72,350);
    c.fillStyle='#15120E'; c.font='700 15px "IBM Plex Mono", monospace'; c.fillText('CURRENT ASSUMPTIONS',72,405);
    c.fillStyle='#5B5348'; c.font='16px "IBM Plex Mono", monospace';
    c.fillText(h.toLocaleString()+' BITCAT held · $'+v.toLocaleString()+' 24h volume',72,438);
    c.fillText('$'+b.toLocaleString()+' BTC · 1% per trade · 1B supply model',72,468);
    c.fillStyle='#8C8477'; c.font='14px "IBM Plex Mono", monospace';
    c.fillText('Illustrative estimate only. Actual rewards vary with volume, eligible',72,526);
    c.fillText('supply and contract operation. Not financial advice; meme tokens are risky.',72,549);
    c.fillStyle='#8A5B00'; c.font='13px "IBM Plex Mono", monospace';
    c.fillText('0x7d1A…7777 · verify on-chain',72,578);
    c.drawImage(cat,790,94,344,344);
    c.fillStyle='#15120E'; c.font='17px "IBM Plex Mono", monospace'; c.textAlign='center';
    c.fillText('the cat did the math',962,485);
    return canvas;
  }
  function downloadPostcard(blob){
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'bitcat-sats-postcard.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); },1000);
    postcardStatus.textContent = 'Postcard downloaded ✓';
  }
  postcardBtn.addEventListener('click', function(){
    postcardBtn.disabled = true;
    postcardStatus.textContent = 'Drawing your postcard…';
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function(){
      var canvas = makePostcard();
      canvas.toBlob(function(blob){
        postcardBtn.disabled = false;
        if(!blob){ postcardStatus.textContent = 'Could not create the postcard. Please try again.'; return; }
        downloadPostcard(blob);
      },'image/png');
    }).catch(function(){ postcardBtn.disabled = false; postcardStatus.textContent = 'Could not create the postcard. Please try again.'; });
  });

  /* ---- shareable community milestone card ---- */
  var milestoneShareButton = document.getElementById('shareMilestone');
  var milestoneShareStatus = document.getElementById('milestoneShareStatus');
  function makeMilestoneCard(){
    var canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 630;
    var c = canvas.getContext('2d');
    c.fillStyle = '#15120E'; c.fillRect(0,0,1200,630);
    c.fillStyle = '#F7931A'; c.fillRect(0,0,16,630);
    c.fillStyle = '#F7F3EA'; c.font = '700 38px "IBM Plex Mono", monospace'; c.fillText('BITCAT',64,94);
    c.fillStyle = '#F7931A'; c.font = '600 18px "IBM Plex Mono", monospace'; c.fillText('COMMUNITY MILESTONES · BNB CHAIN',66,130);
    c.strokeStyle = 'rgba(247,147,26,.35)'; c.lineWidth = 2; c.strokeRect(58,164,1080,344);
    var cards = [
      ['BTCB DISTRIBUTED', document.getElementById('mileBtcbValue').textContent],
      ['INDEXED HOLDERS', document.getElementById('mileHoldersValue').textContent],
      ['COMMUNITY PETS', document.getElementById('milePetsValue').textContent]
    ];
    cards.forEach(function(item,i){
      var y = 224 + i*86;
      c.fillStyle = '#B9B0A3'; c.font = '600 15px "IBM Plex Mono", monospace'; c.fillText(item[0],88,y);
      c.fillStyle = '#F7F3EA'; c.font = '700 32px "IBM Plex Mono", monospace'; c.fillText(item[1].slice(0,26),390,y);
    });
    c.fillStyle = '#B9B0A3'; c.font = '14px "IBM Plex Mono", monospace';
    c.fillText('Generated ' + new Date().toISOString().slice(0,10) + ' · figures can lag; verify on the live site.',66,554);
    c.fillStyle = '#F7931A'; c.font = '600 17px "IBM Plex Mono", monospace'; c.fillText('bitcatbnb.family · verify rewards at flap.sh · contract 0x7d1A…7777',66,588);
    if(cat.complete && cat.naturalWidth) c.drawImage(cat,930,42,170,104);
    return canvas;
  }
  milestoneShareButton.addEventListener('click', function(){
    milestoneShareButton.disabled = true;
    milestoneShareStatus.textContent = 'Preparing the card…';
    makeMilestoneCard().toBlob(function(blob){
      milestoneShareButton.disabled = false;
      if(!blob){ milestoneShareStatus.textContent = 'Could not make the image. Please try again.'; return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'bitcat-community-milestones.png';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(a.href); },1000);
      milestoneShareStatus.textContent = 'Milestone card downloaded · check the live page before sharing figures.';
    },'image/png');
  });

  /* ---- check your bowl ---- */
  var addr = document.getElementById('addr');
  var bowlErr = document.getElementById('bowlErr'), bowlLinks = document.getElementById('bowlLinks');
  addr.addEventListener('input', function(){
    var v = addr.value.trim();
    if(!v){ bowlErr.style.display='none'; bowlLinks.hidden = true; return; }
    if(/^0x[a-fA-F0-9]{40}$/.test(v)){
      bowlErr.style.display='none';
      document.getElementById('bowlFlap').href = 'https://flap.sh/bnb/' + CA.toLowerCase() + '/taxinfo';
      document.getElementById('bowlScan').href = 'https://bscscan.com/token/' + CA + '?a=' + v;
      bowlLinks.hidden = false;
    } else {
      bowlErr.style.display='block'; bowlLinks.hidden = true;
    }
  });

  /* ---- marquee loop ---- */
  var track = document.getElementById('marqueeTrack');
  track.innerHTML += track.innerHTML;

  /* ---- copy CA ---- */
  var copyBtn = document.getElementById('copyBtn');
  copyBtn.addEventListener('click', function(){
    function done(){
      copyBtn.textContent = 'Copied ✓';
      triggerLucky('You copied the contract ending in 7777. The rare gold cat appeared.');
      setTimeout(function(){ copyBtn.textContent = 'Copy CA'; }, 1600);
    }
    function fallback(){
      var ta = document.createElement('textarea');
      ta.value = CA; document.body.appendChild(ta); ta.select();
      try{ document.execCommand('copy'); done(); }catch(e){}
      ta.remove();
    }
    try{
      if(navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(CA).then(done, fallback);
      } else fallback();
    }catch(e){ fallback(); }
  });
  /* ---- rewards vault: live on-chain reads via public BSC RPC ---- */
  var DIVIDEND = '0xec5f57fde4e02cf83bcbe26c6e7f9a1c456518c1';
  var BTCB_ADDR = '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c';
  var RPCS = ['https://bsc-rpc.publicnode.com', 'https://bsc-dataseed.binance.org'];
  /* BSC has changed block time repeatedly (3s -> 1.5s -> 0.75s -> 0.45s today), so measure
     it: a stale constant silently skews every "N min ago" in the payout feed. */
  var blockSec = 0.45, blockSecOk = false;
  function measureBlockTime(head){
    if(blockSecOk) return Promise.resolve();
    var back = 10000;
    return Promise.all([
      rpc('eth_getBlockByNumber', ['0x' + head.toString(16), false]),
      rpc('eth_getBlockByNumber', ['0x' + (head - back).toString(16), false])
    ]).then(function(b){
      var sec = (parseInt(b[0].timestamp,16) - parseInt(b[1].timestamp,16)) / back;
      if(sec > 0.05 && sec < 20){ blockSec = sec; blockSecOk = true; }
    }).catch(function(){});
  }
  var btcUsd = 0;
  function rpc(method, params, idx){
    idx = idx || 0;
    if(idx >= RPCS.length) return Promise.reject(new Error('rpc unavailable'));
    var p;
    try{
      p = fetchData(RPCS[idx], {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({jsonrpc: '2.0', id: 1, method: method, params: params})
      });
    }catch(e){ return rpc(method, params, idx+1); }
    return p.then(function(j){
      if(j && j.result !== undefined && j.result !== null) return j.result;
      throw new Error('rpc error');
    }).catch(function(){ return rpc(method, params, idx+1); });
  }
  function hexWei(x){ return parseInt(x, 16) / 1e18; }
  var vaultDot = document.getElementById('vaultDot');
  var vaultBal = document.getElementById('vaultBal'), vaultBalSub = document.getElementById('vaultBalSub');
  var vaultTotal = document.getElementById('vaultTotal'), vaultTotalSub = document.getElementById('vaultTotalSub');
  var odoSub = document.getElementById('odoSub');
  var payList = document.getElementById('payList');
  var lastTotal = 0, lastBal = -1, lastPayoutKey = '';
  /* the price fetch and the chain reads race each other; repaint the ≈$ lines whenever
     either side lands so the dollar figures are never silently missing */
  function paintVaultUsd(){
    if(lastTotal > 0){
      vaultTotalSub.textContent = '≈ ' + Math.round(lastTotal * 1e8).toLocaleString() + ' sats' +
        (btcUsd > 0 ? ' · ≈ $' + Math.round(lastTotal * btcUsd).toLocaleString() : '') + ' · on-chain';
    }
    if(lastBal >= 0){
      vaultBalSub.textContent = 'not yet in holders\u2019 wallets' +
        (btcUsd > 0 ? ' · ≈ $' + Math.round(lastBal * btcUsd).toLocaleString() : '');
    }
  }
  function refreshVault(){
    var totalOk = rpc('eth_call', [{to: DIVIDEND, data: '0x85a6b3ae'}, 'latest']).then(function(res){
      var total = hexWei(res);
      if(!(total > 0)) return;
      var sats = Math.round(total * 1e8).toLocaleString();
      odoLive = true;
      lastTotal = total;
      vaultTotal.textContent = total.toFixed(8) + ' BTCB';
      paintVaultUsd();
      odo.textContent = total.toFixed(8) + ' BTCB';
      odoSub.textContent = '≈ ' + sats + ' sats distributed';
      vaultDot.classList.remove('off');
      updateMilestones(total*1e8,null,null);
      checkLuckyNumber(total*1e8,'The vault total revealed lucky 7777.');
      return true;
    }).catch(function(){ return false; });
    rpc('eth_call', [{to: BTCB_ADDR, data: '0x70a08231000000000000000000000000' + DIVIDEND.slice(2)}, 'latest']).then(function(res){
      var bal = hexWei(res);
      if(!(bal >= 0)) return;
      lastBal = bal;
      vaultBal.textContent = bal.toFixed(8) + ' BTCB';
      paintVaultUsd();
    }).catch(function(){});
    return totalOk;
  }
  function refreshPayouts(){
    var head, gotLogs = false;
    rpc('eth_blockNumber', []).then(function(h){
      head = parseInt(h, 16);
      return measureBlockTime(head);
    }).then(function(){
      var topics = ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
                    '0x000000000000000000000000' + DIVIDEND.slice(2)];
      var logs = [];
      function win(i){
        if(i >= 4) return Promise.resolve(logs);
        var to = head - i*2000, from = to - 1999;
        return rpc('eth_getLogs', [{
          address: BTCB_ADDR,
          fromBlock: '0x' + from.toString(16),
          toBlock: '0x' + to.toString(16),
          topics: topics
        }]).then(function(r){
          if(Array.isArray(r)){ gotLogs = true; logs = logs.concat(r); }
          return win(i+1);
        }, function(){ return win(i+1); });
      }
      return win(0);
    }).then(function(logs){
      if(!logs || !logs.length){
        /* reachable but quiet is a different fact from unreachable */
        if(gotLogs){
          payList.innerHTML = '<li><span class="who">no payouts in the last ~' +
            Math.round(8000 * blockSec / 60) +
            ' min — the vault pays out as trades come in</span><span class="when">see BscScan \u2193</span></li>';
        }
        return;
      }
      logs.sort(function(a,b){ return parseInt(b.blockNumber,16) - parseInt(a.blockNumber,16); });
      var newestPayout=logs[0].transactionHash+'|'+logs[0].logIndex;
      if(lastPayoutKey && newestPayout!==lastPayoutKey) animateHunt('payout','new vault payout · gold Bitcoin crumb');
      lastPayoutKey=newestPayout;
      while(payList.firstChild) payList.removeChild(payList.firstChild);
      logs.slice(0, 8).forEach(function(l){
        var to = '0x' + l.topics[2].slice(-40);
        var amt = parseInt(l.data, 16) / 1e18;
        var blk = parseInt(l.blockNumber, 16);
        var mins = Math.max(0, Math.round((head - blk) * blockSec / 60));
        var li = document.createElement('li');
        li.innerHTML = '<span class="who">' + to.slice(0,6) + '…' + to.slice(-4) +
          ' <span class="amt">+' + amt.toFixed(8) + ' BTCB</span>' +
          (btcUsd > 0 ? ' <span class="when">≈ $' + (amt*btcUsd).toFixed(2) + '</span>' : '') +
          '</span><span class="when">' + (mins < 1 ? 'just now' : '~' + mins + ' min ago') + ' · vault payout</span>';
        payList.appendChild(li);
      });
    }).catch(function(){});
  }

  /* ---- live market data: DexScreener + GeckoTerminal, snapshot fallback ---- */
  var POOL = '0xd09e60fb451cdc6e1fcd0e1dee6db553e89dafa9';
  var statMcap = document.getElementById('statMcap');
  var statMcapSub = document.getElementById('statMcapSub');
  var statHolders = document.getElementById('statHolders');
  var statHoldersSub = document.getElementById('statHoldersSub');
  var adoptCost = document.getElementById('adoptCost');
  var asofLine = document.getElementById('asofLine');
  var huntTag = document.getElementById('huntTag');
  var huntFootNote = document.getElementById('huntFootNote');
  function fmtBig(n){
    if(!isFinite(n) || n <= 0) return '—';
    if(n >= 1e9) return '$' + (n/1e9).toFixed(2) + 'B';
    if(n >= 1e6) return '$' + (n/1e6).toFixed(2) + 'M';
    if(n >= 1e3) return '$' + Math.round(n/1e3) + 'K';
    return '$' + Math.round(n);
  }
  function nowUtc(){
    var d = new Date();
    function z(x){ return (x<10?'0':'')+x; }
    return z(d.getUTCHours()) + ':' + z(d.getUTCMinutes()) + ' UTC';
  }
  function refreshPair(){
    return fetchData('https://api.dexscreener.com/latest/dex/pairs/bsc/' + POOL)
      .then(function(j){
        var p = (j && j.pair) || (j && j.pairs && j.pairs[0]);
        if(!p) return false;
        var pn = +p.priceNative, pu = +p.priceUsd;
        if(pn > 0 && pu > 0){
          btcUsd = pu / pn;
          if(document.activeElement !== btcp){ btcp.value = Math.round(btcUsd); calc(); }
        }
        if(pu > 0){
          termPrice.textContent = '$' + pu.toPrecision(3);
          adoptCost.textContent = 'Eligibility threshold value: ≈ $' + (pu * 10000).toFixed(2) + ' at the current price.';
        }
        paintVaultUsd();
        var chg = p.priceChange && +p.priceChange.h24;
        if(isFinite(chg)){
          termChg.textContent = (chg >= 0 ? '▲ +' : '▼ ') + chg.toFixed(1) + '% · 24h';
          termChg.className = 'chip ' + (chg >= 0 ? 'up' : 'down');
        }
        var v24 = p.volume && +p.volume.h24;
        if(Number.isFinite(v24) && v24 >= 0){
          lastVol = v24;
          renderGauge(v24);
          if(document.activeElement !== vol){ vol.value = Math.round(v24); calc(); }
        }
        if(+p.marketCap > 0){
          statMcap.textContent = fmtBig(+p.marketCap);
          statMcapSub.textContent = 'DexScreener estimate · BITCAT/BTCB pool';
        } else {
          statMcap.textContent = '—';
          statMcapSub.textContent = 'not returned by the market feed · verify below';
        }
        return true;
      })
      .catch(function(){ return false; });
  }
  function refreshTrades(){
    return fetchData('https://api.geckoterminal.com/api/v2/networks/bsc/pools/' + POOL + '/trades')
      .then(function(j){
        if(!j || !Array.isArray(j.data)) return false;
        if(!j.data.length){
          trades = []; renderHunt([], false);
          huntList.textContent = 'No trades returned in the current feed.';
          return true;
        }
        var list = j.data.slice(0, 12).map(function(row){
          var a = row.attributes || {};
          var isBuy = a.kind === 'buy';
          var amt = +(isBuy ? a.to_token_amount : a.from_token_amount) || 0;
          return {
            k: isBuy ? 'buy' : 'sell',
            usd: +a.volume_in_usd || 0,
            amt: Math.round(amt).toLocaleString(),
            t: (a.block_timestamp || '').slice(11, 19)
          };
        });
        setTrades(list);
        return true;
      })
      .catch(function(){ return false; });
  }
  function refreshHolders(){
    return fetchData('https://api.geckoterminal.com/api/v2/networks/bsc/tokens/' + CA.toLowerCase() + '/info')
      .then(function(j){
        var hd = j && j.data && j.data.attributes && j.data.attributes.holders;
        var h = hd && +hd.count;
        if(!(h > 0)) return false;
        statHolders.textContent = h.toLocaleString();
        updateMilestones(null,h,null);
        checkLuckyNumber(h,'The indexed holder count revealed lucky 7777.');
        /* indexed periodically, so name the index time instead of implying live */
        statHoldersSub.textContent = 'eligible above 10,000 BITCAT' +
          (hd.last_updated ? ' · indexed ' + hd.last_updated.slice(11,16) + ' UTC' : '');
        return true;
      })
      .catch(function(){ return false; });
  }
  function goLive(){
    try{
      refreshPayouts();
      refreshChartLive();
      /* three separate sources feed the stat band; only call the row "live" when all
         three answered, so a snapshot figure never sits under that word */
      Promise.all([refreshPair(), refreshVault(), refreshHolders(), refreshTrades()]).then(function(r){
        if(r[0] && r[1] && r[2]){
          asofLine.textContent = 'live · dexscreener, geckoterminal & bnb chain rpc · updated ' +
            nowUtc() + ' · tax terms from the flap.sh vault';
        } else if(r[0] || r[1] || r[2] || r[3]){
          asofLine.textContent = 'partly live · updated ' + nowUtc() +
            ' · figures without a live source are from the sept 12, 2026 snapshot';
        } else {
          asofLine.textContent = 'Live sources unavailable · showing last received figures or labelled snapshots dated September 12, 2026. Check the linked sources.';
        }
        if(r[3]){
          huntTag.textContent = 'live · updated ' + nowUtc();
          huntFootNote.textContent = 'live from the BITCAT/BTCB pool · refreshes every 60s.';
        }
      });
    }catch(e){}
  }
  /* ---- price terminal: canvas sparkline ---- */
  var SNAP24 = [[1789124400,0.000158925],[1789125300,0.000159336],[1789126200,0.000161041],[1789127100,0.000161292],[1789128000,0.00015758],[1789128900,0.000158873],[1789129800,0.000155347],[1789130700,0.000150964],[1789131600,0.000151463],[1789132500,0.000162991],[1789133400,0.000184978],[1789134300,0.000189514],[1789135200,0.00019087],[1789136100,0.000178404],[1789137000,0.000177885],[1789137900,0.000191151],[1789138800,0.000193102],[1789139700,0.000204745],[1789140600,0.000206972],[1789141500,0.000241089],[1789142400,0.000256601],[1789143300,0.000248698],[1789144200,0.000243614],[1789145100,0.000282069],[1789146000,0.000315719],[1789146900,0.000324986],[1789147800,0.00028584],[1789148700,0.000264895],[1789149600,0.000267829],[1789150500,0.000255778],[1789151400,0.000253545],[1789152300,0.000245131],[1789153200,0.000251815],[1789154100,0.000244118],[1789155000,0.000243903],[1789155900,0.000247252],[1789156800,0.000250895],[1789157700,0.000250878],[1789158600,0.000251287],[1789159500,0.000248048],[1789160400,0.000263062],[1789161300,0.000258194],[1789162200,0.000263855],[1789163100,0.000271743],[1789164000,0.000278872],[1789164900,0.000277178],[1789165800,0.000281346],[1789166700,0.000311433],[1789167600,0.000350855],[1789168500,0.000371933],[1789169400,0.000372375],[1789170300,0.000365228],[1789171200,0.000376384],[1789172100,0.000323291],[1789173000,0.000339585],[1789173900,0.000297679],[1789174800,0.000319866],[1789175700,0.000333779],[1789176600,0.000347027],[1789177500,0.000436429],[1789178400,0.000487506],[1789179300,0.000490263],[1789180200,0.000548192],[1789181100,0.000552286],[1789182000,0.000514471],[1789182900,0.000448179],[1789183800,0.000449405],[1789184700,0.000486075],[1789185600,0.000556482],[1789186500,0.000609355],[1789187400,0.000579983],[1789188300,0.000569426],[1789189200,0.000472848],[1789190100,0.000501499],[1789191000,0.000504501],[1789191900,0.000488548],[1789192800,0.000388897],[1789193700,0.000396578],[1789194600,0.000414501],[1789195500,0.000412021],[1789196400,0.00040301],[1789197300,0.000388752],[1789198200,0.000371493],[1789199100,0.000390582],[1789200000,0.000433712],[1789200900,0.000433266],[1789201800,0.000401143],[1789202700,0.000403628],[1789203600,0.000399281],[1789204500,0.00040308],[1789205400,0.000403262],[1789206300,0.000393744],[1789207200,0.000392971],[1789208100,0.000342174],[1789209000,0.000358489],[1789209900,0.000360234]];
  var SNAP7D = [[1788912000,0.000525874],[1788926400,0.000278013],[1788940800,0.000194999],[1788955200,0.000453826],[1788969600,0.000264168],[1788984000,0.000247979],[1788998400,0.000203992],[1789012800,0.000309161],[1789027200,0.00019015],[1789041600,0.000195309],[1789056000,0.000134435],[1789070400,0.000114187],[1789084800,0.000147313],[1789099200,0.000116476],[1789113600,0.000161292],[1789128000,0.000241089],[1789142400,0.000247252],[1789156800,0.000365228],[1789171200,0.000486075],[1789185600,0.000390582],[1789200000,0.000360234]];
  var chartData = {'24h': SNAP24, '7d': SNAP7D};
  var chartRange = '24h', chartOtherFetched = false;
  var chartCv = document.getElementById('chart');
  var chartTip = document.getElementById('chartTip');
  var chartXY = [], chartHover = null;
  var termPrice = document.getElementById('termPrice');
  var termChg = document.getElementById('termChg');
  var chartTag = document.getElementById('chartTag');
  function fmtPrice(p){ return '$' + (+p).toPrecision(3); }
  function utcDay(ts){ return new Date(ts*1000).toLocaleDateString('en-US', {month:'short', day:'numeric', timeZone:'UTC'}); }
  function utcHm(ts){
    var d = new Date(ts*1000);
    function z(x){ return (x<10?'0':'')+x; }
    return z(d.getUTCHours()) + ':' + z(d.getUTCMinutes());
  }
  /* a 24h window usually straddles midnight, so two bare clock times read backwards
     (17:30 on the left, 17:15 on the right). Date-stamp the ends when the days differ. */
  function fmtT(ts, otherTs){
    if(chartRange === '7d') return utcDay(ts);
    var a = new Date(ts*1000), b = new Date(otherTs*1000);
    var sameDay = a.getUTCDate() === b.getUTCDate() && a.getUTCMonth() === b.getUTCMonth();
    return sameDay ? utcHm(ts) : utcDay(ts) + ' · ' + utcHm(ts);
  }
  function drawChart(pts){
    if(!chartCv) return;
    var dpr = window.devicePixelRatio || 1;
    var W = chartCv.clientWidth || 600, H = 240;
    chartCv.width = W*dpr; chartCv.height = H*dpr;
    var g = chartCv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    if(!pts || pts.length < 2) return;
    var padL = 6, padR = 70, padT = 14, padB = 24;
    var iw = W - padL - padR, ih = H - padT - padB;
    var t0 = pts[0][0], t1 = pts[pts.length-1][0];
    var omin = Infinity, omax = -Infinity;
    pts.forEach(function(p){ if(p[1] < omin) omin = p[1]; if(p[1] > omax) omax = p[1]; });
    if(omax === omin){ omax *= 1.001; omin *= 0.999; }
    var span0 = omax - omin;
    var min = omin - span0*0.07, max = omax + span0*0.07, span = max - min;
    function X(t){ return padL + (t - t0)/(t1 - t0)*iw; }
    function Y(v){ return padT + (1 - (v - min)/span)*ih; }
    var tc = TC();
    g.font = '10.5px "IBM Plex Mono", monospace';
    g.textBaseline = 'middle';
    [omax, (omax+omin)/2, omin].forEach(function(v){
      var y = Y(v);
      g.strokeStyle = tc.grid; g.lineWidth = 1;
      g.beginPath(); g.moveTo(padL, y); g.lineTo(padL + iw, y); g.stroke();
      g.fillStyle = tc.axis; g.textAlign = 'left';
      g.fillText(fmtPrice(v), padL + iw + 8, y);
    });
    var grad = g.createLinearGradient(0, padT, 0, H - padB);
    grad.addColorStop(0, 'rgba(' + tc.area + ',.30)');
    grad.addColorStop(1, 'rgba(' + tc.area + ',0)');
    g.beginPath();
    pts.forEach(function(p, i){ i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])); });
    g.lineTo(X(t1), H - padB); g.lineTo(X(t0), H - padB); g.closePath();
    g.fillStyle = grad; g.fill();
    g.beginPath();
    pts.forEach(function(p, i){ i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])); });
    g.strokeStyle = tc.line; g.lineWidth = 2; g.lineJoin = 'round';
    g.shadowColor = tc.glow; g.shadowBlur = 6;
    g.stroke();
    g.shadowBlur = 0;
    var lx = X(t1), ly = Y(pts[pts.length-1][1]);
    g.beginPath(); g.arc(lx, ly, 8, 0, 7); g.fillStyle = tc.halo; g.fill();
    g.beginPath(); g.arc(lx, ly, 3.5, 0, 7); g.fillStyle = tc.dot; g.fill();
    g.fillStyle = tc.axis; g.textBaseline = 'alphabetic';
    g.textAlign = 'left'; g.fillText(fmtT(t0, t1), padL, H - 8);
    g.textAlign = 'right'; g.fillText(fmtT(t1, t0) + (chartRange === '7d' ? '' : ' UTC'), padL + iw, H - 8);
    if(chartHover !== null && pts[chartHover]){
      var hx = X(pts[chartHover][0]), hy = Y(pts[chartHover][1]);
      g.strokeStyle = tc.cross; g.lineWidth = 1; g.setLineDash([4,4]);
      g.beginPath(); g.moveTo(hx, padT); g.lineTo(hx, H - padB); g.stroke();
      g.setLineDash([]);
      g.beginPath(); g.arc(hx, hy, 4.5, 0, 7); g.fillStyle = tc.hover; g.fill();
    }
    chartXY = pts.map(function(p){ return [X(p[0]), Y(p[1])]; });
  }
  var LAUNCH = Date.UTC(2026, 8, 9, 0, 43, 47) / 1000; /* BITCAT/BTCB pool creation, on-chain */
  function fetchOhlcv(range){
    var url = 'https://api.geckoterminal.com/api/v2/networks/bsc/pools/' + POOL;
    if(range === '7d'){
      /* request enough candles to actually reach the launch, or the button lies as the
         token ages: 4h candles while they fit, daily candles after that */
      var hrs = (Date.now()/1000 - LAUNCH) / 3600;
      url += hrs <= 3900
        ? '/ohlcv/hour?aggregate=4&limit=' + Math.min(1000, Math.ceil(hrs/4) + 2)
        : '/ohlcv/day?aggregate=1&limit=' + Math.min(1000, Math.ceil(hrs/24) + 2);
    } else {
      url += '/ohlcv/minute?aggregate=15&limit=96';
    }
    return fetch(url).then(function(r){ return r.json(); }).then(function(j){
      var lst = j && j.data && j.data.attributes && j.data.attributes.ohlcv_list;
      if(!lst || !lst.length) return;
      chartData[range] = lst.slice().sort(function(a,b){ return a[0]-b[0]; })
        .map(function(c){ return [c[0], +c[4], +c[5] || 0]; });
      chartTag.textContent = 'live · updated ' + nowUtc();
      if(range === chartRange) drawChart(chartData[chartRange]);
    }).catch(function(){});
  }
  function refreshChartLive(){
    fetchOhlcv(chartRange);
    if(!chartOtherFetched){
      chartOtherFetched = true;
      fetchOhlcv(chartRange === '24h' ? '7d' : '24h');
    }
  }
  document.querySelectorAll('.ttab').forEach(function(b){
    b.addEventListener('click', function(){
      document.querySelectorAll('.ttab').forEach(function(x){ x.classList.remove('on'); x.setAttribute('aria-pressed','false'); });
      b.classList.add('on');
      b.setAttribute('aria-pressed','true');
      chartRange = b.dataset.range;
      chartHover = null; chartTip.hidden = true;
      drawChart(chartData[chartRange]);
      fetchOhlcv(chartRange);
    });
  });
  window.addEventListener('resize', function(){ drawChart(chartData[chartRange]); });
  function fmtTip(ts){ return utcDay(ts) + ' · ' + utcHm(ts) + ' UTC'; }
  function chartPointer(px){
    var pts = chartData[chartRange];
    if(!chartXY.length || !pts) return;
    var best = 0, bd = Infinity;
    for(var i = 0; i < chartXY.length; i++){
      var d = Math.abs(chartXY[i][0] - px);
      if(d < bd){ bd = d; best = i; }
    }
    chartHover = best;
    drawChart(pts);
    var p = pts[best], xy = chartXY[best];
    chartTip.innerHTML = '<b>' + fmtPrice(p[1]) + '</b>' +
      '<div class="t">' + fmtTip(p[0]) + (p[2] ? ' · vol ' + fmtBig(p[2]) : '') + '</div>';
    chartTip.hidden = false;
    var tw = chartTip.offsetWidth, th = chartTip.offsetHeight;
    chartTip.style.left = Math.max(4, Math.min(xy[0] - tw/2, chartCv.clientWidth - tw - 4)) + 'px';
    chartTip.style.top = Math.max(4, xy[1] - th - 14) + 'px';
  }
  function chartTipHide(){
    chartHover = null;
    chartTip.hidden = true;
    drawChart(chartData[chartRange]);
  }
  chartCv.addEventListener('mousemove', function(e){ chartPointer(e.offsetX); });
  chartCv.addEventListener('mouseleave', chartTipHide);
  function chartTouch(e){
    var r = chartCv.getBoundingClientRect();
    chartPointer(e.touches[0].clientX - r.left);
  }
  chartCv.addEventListener('touchstart', chartTouch, {passive: true});
  chartCv.addEventListener('touchmove', chartTouch, {passive: true});
  chartCv.addEventListener('touchend', function(){ setTimeout(chartTipHide, 1600); }, {passive: true});
  drawChart(chartData[chartRange]);
  termPrice.textContent = fmtPrice(SNAP24[SNAP24.length-1][1]);

  /* ---- theme switch: paper (the pfp) <-> night (the original after-dark skin) ---- */
  var themeBtn = document.getElementById('themeBtn');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  function syncThemeBtn(){
    var n = isNight();
    var label = n ? 'Switch to day mode' : 'Switch to night mode';
    themeBtn.setAttribute('aria-pressed', n ? 'true' : 'false');
    themeBtn.setAttribute('aria-label', label);
    themeBtn.title = label;
    if(themeMeta) themeMeta.setAttribute('content', n ? '#0B0908' : '#FCFBF7');
  }
  syncThemeBtn();
  themeBtn.addEventListener('click', function(){
    var night = !isNight();
    if(night) document.documentElement.setAttribute('data-theme', 'night');
    else document.documentElement.removeAttribute('data-theme');
    try{ localStorage.setItem('bitcat-theme', night ? 'night' : 'day'); }catch(e){}
    syncThemeBtn();
    /* canvas/SVG were painted with the old palette — repaint both */
    drawChart(chartData[chartRange]);
    renderGauge(lastVol);
  });

  /* ---- scroll progress + scrollspy ---- */
  var sbar = document.getElementById('scrollbar');
  var sTick = false;
  window.addEventListener('scroll', function(){
    if(sTick) return; sTick = true;
    requestAnimationFrame(function(){
      var h = document.documentElement;
      var m = h.scrollHeight - h.clientHeight;
      sbar.style.width = (m > 0 ? h.scrollTop/m*100 : 0) + '%';
      sTick = false;
    });
  }, {passive: true});
  var spyLinks = {};
  document.querySelectorAll('.nav-links a[href^="#"]').forEach(function(a){
    spyLinks[a.getAttribute('href').slice(1)] = a;
  });
  if('IntersectionObserver' in window){
    var curSpy = null;
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting && spyLinks[e.target.id]){
          if(curSpy) curSpy.classList.remove('active');
          curSpy = spyLinks[e.target.id];
          curSpy.classList.add('active');
        }
      });
    }, {rootMargin: '-25% 0px -65% 0px'});
    Object.keys(spyLinks).forEach(function(id){
      var el = document.getElementById(id);
      if(el) io.observe(el);
    });
  }

  goLive();
  setInterval(function(){
    if(document.visibilityState === 'visible') goLive();
  }, 60000);

})();
