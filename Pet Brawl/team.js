(function(){
  const TYPES = ['Fluid','Flame','Stone','Storm','Gleam','Gloom','Blight','Bloom'];
  function typeMultiplier(attackerType, defenderType){
    return 1;
  }

  const ABILITIES = [
  { 
    id:'heal', 
    name:'Heal', 
    type:'support', 
    desc:'Restore HP' 
  },
  { 
    id:'attack', 
    name:'Attack', 
    type:'offense', 
    desc:'Deal direct damage' 
    
  },
  { 
    id:'bolster', 
    name:'Bolster', 
    type:'support', 
    desc:'Amplify next ability' 
    
  },
  { 
    id:'hot', 
    name:'Regen', 
    type:'support', 
    desc:'Heal over time <br> (3 rounds)' 
    
  },
  { 
    id:'dot', 
    name:'Bleed', 
    type:'offense', 
    desc:'Dmg over time <br> (3 rounds)' 
    
  },
  { 
    id:'charge-heal', 
    name:'Charge Heal', 
    type:'support', 
    desc:'Charge 1 round' 
    
  },
  { 
    id:'charge-attack', 
    name:'Charge Attack', 
    type:'offense', 
    desc:'Charge 1 round' 
    
  },
  { 
    id:'defend', 
    name:'Defend', 
    type:'support', 
    desc:'Reduce next damage' 
    
  },
  { 
    id:'stun', 
    name:'Stun', 
    type:'offense', 
    desc:"Interrupt opponent" 
    
  },
  { 
    id:'team-heal', 
    name:'Team Heal', 
    type:'support', 
    desc:'Heal your pets' 
    
  },
  { 
    id:'team-attack', 
    name:'Team Attack', 
    type:'offense', 
    desc:'Dmg enemy pets' 
    
  },
  { 
    id:'intervene', 
    name:'Intervene', 
    type:'support', 
    desc:'Switch and buff next pet' 
    
  }
  ];

  ABILITIES.push(
    { 
      id: 'bubble', 
      name: 'Bubble', 
      type: 'type-special', 
      desc: 'Reduce damage taken (3 rounds)' },
    { 
      id: 'scorch', 
      name: 'Scorch', 
      type: 'type-special', 
      desc: 'Scorch target (50 dmg / round, 3 rounds)' },
    { 
      id: 'shatter', 
      name: 'Shatter', 
      type: 'type-special', 
      desc: 'Heavy strike to enemy, recoil to self' },
    { 
      id: 'hurricane', 
      name: 'Hurricane', 
      type: 'type-special', 
      desc: 'Damage enemy team for 3 rounds' },
    { 
      id: 'beam', 
      name: 'Beam', 
      type: 'type-special', 
      desc: 'Heavy damage and heal equal to damage dealt (CD 4)' },
    { 
      id: 'curse', 
      name: 'Curse', 
      type: 'type-special', 
      desc: 'Weaken opponent (3 rounds)' }
  ,
    {
      id: 'toxin',
      name: 'Toxin',
      type: 'type-special',
      desc: 'Inject delayed toxin: executes in 3 rounds, deals 275 + rand(0-25) and applies Rot (25/round for 8 rounds).'
    },
    {
    id: 'vines',
    name: 'Vines',
    type: 'type-special',
    desc: 'Anchor vines: 4 rounds; return a portion of damage taken to the attacker (30% base, 50% when bolstered).'
  }
  );

  ABILITIES.push({
    id: 'scratch',
    name: 'Scratch',
    type: 'offense',
    desc: 'Boss-only: direct claw attack and applies Poison (2 rounds, 30/round).'
  });

  const ABILITY_COLOR = {
    attack: 'red',
    dot: 'red',
    'charge-attack': 'red',
    defend: 'white',
    stun: 'white',
    bolster: 'white',
    heal: 'green',
    hot: 'green',
    'charge-heal': 'green',
    'team-heal': 'green', 
    'team-attack': 'red', 
    'intervene': 'white'
  };

  ABILITY_COLOR.bubble = 'blue';
  ABILITY_COLOR.scorch = 'red';
  ABILITY_COLOR.shatter = 'gray';
  ABILITY_COLOR.hurricane = 'green';
  ABILITY_COLOR.beam = 'yellow';
  ABILITY_COLOR.curse = 'purple';
  ABILITY_COLOR.toxin = 'blight';
  ABILITY_COLOR.vines = 'bloom';
  ABILITY_COLOR.decay = 'orange';
  ABILITY_COLOR.scratch = 'red';
  const PETS = [

    { id:'p1',
      name:'Kivi',
      type:'Stone',
      maxHp:1000,
      power:7,
      healing:2,
      hpBars:6,
      powerBars:2,
      healingBars:1,
      image:'Images/Kivi.png'
    },

    { id:'p2',
      name:'Tuuli',
      type:'Storm',
      maxHp:900,
      power:7.5,
      healing:2,
      hpBars:5,
      powerBars:3,
      healingBars:1,
      image:'Images/Tuli.png'
    },

    { id:'p3',
      name:'Vika',
      type:'Gloom',
      maxHp:800,
      power:8.5,
      healing:2.5,
      hpBars:4,
      powerBars:4,
      healingBars:2,
      image:'Images/Vika.png'
    },

    { id:'p4',
      name:'Vala',
      type:'Gleam',
      maxHp:600,
      power:6,
      healing:5.5,
      hpBars:2,
      powerBars:1,
      healingBars:6,
      image:'Images/Vala.png'
    },

    { id:'p5',
      name:'Vesi',
      type:'Fluid',
      maxHp:700,
      power:7.5,
      healing:3.5,
      hpBars:3,
      powerBars:3,
      healingBars:3,
      image:'Images/Vesi.png'
    },

    { id:'p6',
      name:'Palo',
      type:'Flame',
      maxHp:500,
      power:10.5,
      healing:2.5,
      hpBars:1,
      powerBars:6,
      healingBars:2,
      image:'Images/Palo.png'
    },
    { id: 'p7',
      name: 'Haju',
      type: 'Blight',
      maxHp:700,
      power:11,
      healing:0.5,
      hpBars:3,
      powerBars:6,
      healingBars:0,
      image:'Images/Haju.png'
    },
    { id: 'p8',
      name: 'Sieni',
      type: 'Bloom',
      maxHp:750,
      power:6,
      healing:5,
      hpBars:4,
      powerBars:2,
      healingBars:4,
      image:'Images/Sieni.png'
    },
  ];

  let state = {
    playerTeam: [],
    enemyTeam: [],
    player: null,
    enemy: null,
    selectedAbilities: [],
    enemyAbilities: [],
    turn: 'player',
    log: [],
    round: 1,
    activePetIndex: 0
  };

  const $petList = document.getElementById('pet-list');
  const $abilityList = document.getElementById('ability-list');
  const $startBtn = document.getElementById('start-btn');
  const $setup = document.getElementById('setup');
  const $splash = document.getElementById('splash');
  const $splashPlay = document.getElementById('splash-play');
  const $battle = document.getElementById('battle');
  const $actions = document.getElementById('actions');
  const $log = document.getElementById('log');
  const $back = document.getElementById('back-btn');
  const $restart = document.getElementById('restart-btn');
  const $home = document.getElementById('home-btn');

  const $playerName = document.getElementById('player-name');
  const $enemyName = document.getElementById('enemy-name');
  const $playerType = document.getElementById('player-type');
  const $enemyType = document.getElementById('enemy-type');
  const $playerHpFill = document.getElementById('player-hp-fill');
  const $enemyHpFill = document.getElementById('enemy-hp-fill');
  const $playerHpInner = document.getElementById('player-hp-inner');
  const $enemyHpInner = document.getElementById('enemy-hp-inner');
  const $vsLeftInner = document.getElementById('vs-left-inner');
  const $vsRightInner = document.getElementById('vs-right-inner');
  const $playerHpText = document.getElementById('player-hp-text');
  const $enemyHpText = document.getElementById('enemy-hp-text');
  const $vsLeftHp = document.getElementById('vs-left-hp');
  const $vsRightHp = document.getElementById('vs-right-hp');
  const $playerEffects = document.getElementById('player-effects');
  const $enemyEffects = document.getElementById('enemy-effects');
  const $playerStatus = document.getElementById('player-status');
  const $enemyStatus = document.getElementById('enemy-status');
  const $turnLeft = document.getElementById('turn-left');
  const $turnRight = document.getElementById('turn-right');

  const SOUNDS = {
    selectPet: new Audio('Sounds/Select Pet.wav'),
    selectAbility: new Audio('Sounds/Select Ability.wav'),
    start: new Audio('Sounds/Start.wav'),
    pass: new Audio('Sounds/Pass.wav'),
    stun: new Audio('Sounds/Stun.wav'),
    poison: new Audio('Sounds/Poison.wav'),
    meow: new Audio('Sounds/meow.wav'),
    regenerate: new Audio('Sounds/Regenerate.wav'),
    heal: new Audio('Sounds/Heal.wav'),
    bolster: new Audio('Sounds/Bolster.wav'),
    attack: new Audio('Sounds/Attack.wav'),
    chargeHeal: new Audio('Sounds/Charge Heal.wav'),
    chargeAttack: new Audio('Sounds/Charge Attack.wav'),
    murder: new Audio('Sounds/Murder.wav'),
    curse: new Audio('Sounds/Curse.wav'),
    defend: new Audio('Sounds/Defend.wav')
  };
  SOUNDS.restart = new Audio('Sounds/Restart.wav');
  SOUNDS.switch = new Audio('Sounds/Switch.wav');

  try{
    Object.values(SOUNDS).forEach(s=>{
      try{ s.preload = 'auto'; if(typeof s.load === 'function') s.load(); }catch(e){}
    });
  }catch(e){}

  const STORAGE_KEYS = { enabled: 'petBrawlSoundEnabled', volume: 'petBrawlVolume' };
  const BOSS_STORAGE_KEY = 'petBrawlDefeatedBosses';

  function getDefeatedBosses(){
    try{
      const raw = localStorage.getItem(BOSS_STORAGE_KEY);
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }catch(e){ return []; }
  }

  function markBossDefeated(id){
    if(!id) return;
    try{
      const arr = getDefeatedBosses();
      if(arr.indexOf(id) === -1){ arr.push(id); localStorage.setItem(BOSS_STORAGE_KEY, JSON.stringify(arr)); }
    }catch(e){}
  }

  function isRosieUnlocked(){
    const arr = getDefeatedBosses();
    return arr.includes('boss-ancient') && arr.includes('boss-experiment');
  }

  function updateBossPanelUI(){
    try{
      const panel = document.getElementById('boss-panel');
      if(!panel) return;
      const rosieBtn = panel.querySelector('button[data-boss="boss-rosie"]');
      if(!rosieBtn) return;
      const unlocked = isRosieUnlocked();
      if(unlocked){ rosieBtn.disabled = false; rosieBtn.textContent = 'Rosie'; rosieBtn.title = ''; rosieBtn.classList.remove('disabled'); }
      else { rosieBtn.disabled = true; rosieBtn.textContent = 'Defeat The Others First'; rosieBtn.title = 'Defeat Eggling and Experiment 137-B first.'; rosieBtn.classList.add('disabled'); }
    }catch(e){}
  }
  let soundEnabled = true;
  let volumeLevel = 0.8;

  function applyVolumeToAll(){
    try{
      Object.values(SOUNDS).forEach(s=>{ try{ s.volume = typeof volumeLevel === 'number' ? volumeLevel : 0.8; }catch(e){} });
    }catch(e){}
  }

  function saveSoundPref(){
    try{ localStorage.setItem(STORAGE_KEYS.enabled, soundEnabled ? '1' : '0'); localStorage.setItem(STORAGE_KEYS.volume, String(volumeLevel)); }catch(e){}
  }

  function loadSoundPref(){
    try{
      const e = localStorage.getItem(STORAGE_KEYS.enabled);
      const v = localStorage.getItem(STORAGE_KEYS.volume);
      if(e !== null) soundEnabled = e === '1';
      if(v !== null) volumeLevel = Math.max(0, Math.min(1, parseFloat(v) || 0));
    }catch(e){}
    applyVolumeToAll();
  }
  function playSound(key){
    try{
      if(!soundEnabled) return;
      const s = SOUNDS[key];
      if(!s) return;
      try{ s.currentTime = 0; }catch(e){}
      try{ s.volume = typeof volumeLevel === 'number' ? volumeLevel : 0.8; }catch(e){}
      const p = s.play();
      if(p && p.catch) p.catch(()=>{});
    }catch(e){ }
  }

  function createVolumeControlUI(){
    

  const container = document.createElement('div'); container.className = 'petb-volume';
  container.innerHTML = `<div class="volume-icon" title="Toggle sound">🔊</div><div class="volume-control"><div class="volume-meter" id="petb-volume-meter"><div id="petb-volume-bar"></div><div class="volume-handle" id="petb-volume-handle"></div></div></div>`;
    document.body.appendChild(container);

    const icon = container.querySelector('.volume-icon');
    const meter = container.querySelector('#petb-volume-meter');
    const bar = container.querySelector('#petb-volume-bar');
    const handle = container.querySelector('#petb-volume-handle');

    let collapseTimer = null;
    let isVolDragging = false;
    let lastNonZeroVolume = Math.round((volumeLevel||0) * 100) || 60;

    function render(){
      const pct = Math.round((volumeLevel||0) * 100);
      bar.style.width = pct + '%';
      const rect = meter.getBoundingClientRect();
      const meterW = Math.max(8, rect.width || 120);
      const handleX = (pct/100) * meterW;
      handle.style.left = `${handleX}px`;
      icon.textContent = soundEnabled ? (pct>66? '🔊' : pct>0? '🔉' : '🔈') : '🔇';
      if(!soundEnabled) container.classList.add('muted'); else container.classList.remove('muted');
    }

    function setVolumeFromEvent(e){
      const rect = meter.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      let v = x / rect.width; if(v<0) v=0; if(v>1) v=1; volumeLevel = v; 
      if(Math.round(volumeLevel*100) > 0) lastNonZeroVolume = Math.round(volumeLevel*100);
      soundEnabled = Math.round(volumeLevel*100) > 0;
      applyVolumeToAll(); saveSoundPref(); render();
    }

    meter.addEventListener('mousedown', e=>{ 
      isVolDragging = true; 
      meter.classList.add('dragging'); 
      container.classList.add('expanded'); 
      setVolumeFromEvent(e); 
    });
    window.addEventListener('mousemove', e=>{ 
      if(!isVolDragging) return; 
      setVolumeFromEvent(e); 
    });
    window.addEventListener('mouseup', ()=>{ 
      if(isVolDragging){ 
        isVolDragging=false; 
        meter.classList.remove('dragging'); 
        setTimeout(()=>{ 
          if(!container.matches(':hover')) container.classList.remove('expanded'); 
        }, 180); 
      } 
    });
    meter.addEventListener('touchstart', e=>{ 
      isVolDragging=true; 
      meter.classList.add('dragging'); 
      container.classList.add('expanded'); 
      setVolumeFromEvent(e); 
    });
    window.addEventListener('touchmove', e=>{ 
      if(!isVolDragging) return; 
      setVolumeFromEvent(e); 
    });
    window.addEventListener('touchend', ()=>{ 
      if(isVolDragging){ 
        isVolDragging=false; 
        meter.classList.remove('dragging'); 
        setTimeout(()=>{ 
          if(!container.matches(':hover')) container.classList.remove('expanded'); 
        }, 180); 
      } 
    });

    icon.addEventListener('click', ()=>{ if(soundEnabled && volumeLevel>0){
        soundEnabled = false; 
        volumeLevel = 0; 
        container.classList.add('muted');
      } else {
        soundEnabled = true; 
        volumeLevel = Math.max(0, Math.min(1, (lastNonZeroVolume || 60)/100)); 
        container.classList.remove('muted');
      }
      applyVolumeToAll(); saveSoundPref(); render();
    });

    container.addEventListener('mouseenter', () => {
      clearTimeout(collapseTimer);
      container.classList.add('expanded');
    });
    container.addEventListener('mouseleave', () => {
      if(isVolDragging) return;
      collapseTimer = setTimeout(()=> container.classList.remove('expanded'), 500);
    });

    render();

    window._petBrawlVolume = { 
      getVolume: () => volumeLevel, setVolume: v=>{ volumeLevel = Math.max(0, Math.min(1, v)); applyVolumeToAll(); saveSoundPref(); render(); }, isEnabled: ()=>soundEnabled 
    };
  }

  loadSoundPref();
  setTimeout(createVolumeControlUI, 50);

  function updateRoundDisplay(){
    const el = document.getElementById('round-counter');
    if(!el) return;
    el.textContent = (state.round || 1);
  }

  function el(tag, attrs={}, children=''){ 
    const e=document.createElement(tag); 
    Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v)); 
    if(typeof children==='string') e.innerHTML=children; return e 
  }

  function log(msg){
    const _msgText = (typeof msg === 'string') ? msg : (msg && msg.text) ? msg.text : '';
    const last = state.log && state.log.length ? state.log[state.log.length - 1] : null;
    const lastText = (typeof last === 'string') ? last : (last && last.text) ? last.text : null;
    if(_msgText && lastText === _msgText) return;
    state.log.push(msg);
    const p = document.createElement('div');
    p.className = 'log-msg';
    const TYPE_MAP = {
      red: 'damage',
      green: 'heal',
      white: 'neutral',
      damage: 'damage',
      heal: 'heal',
      neutral: 'neutral',
      info: 'info',
      warn: 'warn'
    };

    if(typeof msg === 'string'){
      p.textContent = msg;
      let cls = null;
      const txt = (msg || '').toLowerCase();
      if(/\b(prepares|active)\b/.test(txt)) cls = 'announce';
      else if(/\b(lost)\b/.test(txt)) cls = 'lost';
      else if(/\b(healed|recovered|applied|is charging|received|rejuvenates)\b/.test(txt)) cls = 'heal-key';
      else if(/\b(attacks|attack|injects|begins charging|dealt|struck|lashes out|returned)\b/.test(txt)) cls = 'attack';
      else if(/\b(braced|defends|stunned|passed|bolstered|intervened|avenge)\b/.test(txt)) cls = 'support';
      else if(/\b(started|ended)\b/.test(txt)) cls = 'started';
      else if(/\b(brutally)\b/.test(txt)) cls = 'brutally';
      if(cls) p.classList.add(cls);
      else p.classList.add('info');
    } else if(typeof msg === 'object'){
      p.textContent = msg.text || '';
      let cls = null;
      if(msg.type) cls = TYPE_MAP[msg.type] || msg.type;
      else if(msg.color) cls = TYPE_MAP[msg.color] || msg.color;
      if(msg.abilityId && ABILITY_COLOR[msg.abilityId]){
        const abilCol = ABILITY_COLOR[msg.abilityId];
        cls = TYPE_MAP[abilCol] || abilCol;
      }
      if(!cls){
        const txt = (msg.text || '').toLowerCase();
        if(/\b(prepares)\b/.test(txt)) cls = 'announce';
        else if(/\b(lost)\b/.test(txt)) cls = 'lost';
        else if(/\b(heal|recovered|Regenerate)\b/.test(txt)) cls = 'heal-key';
        else if(/\b(Regenerate)\b/.test(txt)) cls = 'heal-key';
        else if(/\b(attacks|Poison|Bleed|lashes out)\b/.test(txt)) cls = 'attack';
        else if(/\b(braced|stunned|bolstered|intervened)\b/.test(txt)) cls = 'status';
        else if(/\b(started|ended)\b/.test(txt)) cls = 'started';
        else if(/\b(brutally)\b/.test(txt)) cls = 'brutally';
      }
      if(cls) p.classList.add(cls);

      if(msg.ability){
        const lbl = document.createElement('span');
        const col = (msg.abilityId && ABILITY_COLOR[msg.abilityId]) || msg.color || '';
        lbl.className = 'ability-label ' + (col || '');
        lbl.textContent = msg.ability;
        p.appendChild(lbl);
      }
    }
    p.classList.add('enter');
    $log.prepend(p);
    try{ void p.offsetWidth; }catch(e){}
    try{ requestAnimationFrame(()=>{ p.classList.remove('enter'); }); }catch(e){}
  }

  function renderPets(){
  const maxHp = Math.max(...PETS.map(x=>x.maxHp));
  const maxPower = Math.max(...PETS.map(x=>x.power));
  const maxHealing = Math.max(...PETS.map(x=>x.healing || 0));
    PETS.forEach(p=>{
      const d = el('div',{class:'pet',tabindex:0,'data-id':p.id});
  const hpCount = (typeof p.hpBars === 'number') ? Math.max(0, Math.min(6, p.hpBars)) : Math.max(0, Math.min(6, Math.round((p.maxHp / maxHp) * 6)));
  const powCount = (typeof p.powerBars === 'number') ? Math.max(0, Math.min(6, p.powerBars)) : Math.max(0, Math.min(6, Math.round((p.power / maxPower) * 6)));
  const healCount = (typeof p.healingBars === 'number') ? Math.max(0, Math.min(6, p.healingBars)) : Math.max(0, Math.min(6, Math.round(((p.healing || 0) / maxHealing) * 6)));
      const makeBars = (filled, cls) => {
        let s = `<div class="bars ${cls}">`;
        for(let i=0;i<6;i++) s += `<div class="bar${i<filled? ' filled':''}"></div>`;
        s += `</div>`;
        return s;
      };
      const typeClass = (p.type || '').toLowerCase();
      d.innerHTML = `<div class="img-wrap"><h4>${p.name}</h4><img src="${p.image}" alt="${p.name}"/></div><div>
        <div class='type ${typeClass}'>${p.type}</div>
        <div class="stats">
          <div class="stat"><div class="label">HP</div>${makeBars(hpCount,'hp')}</div>
          <div class="stat"><div class="label">Power</div>${makeBars(powCount,'power')}<div class="stat-value"></div></div>
          <div class="stat"><div class="label">Healing</div>${makeBars(healCount,'healing')}<div class="stat-value"></div></div>
        </div>
      </div>`;
  d.addEventListener('click',()=>{
        playSound('selectPet');
        const existingIdx = state.playerTeam.findIndex(x => x.id === p.id);
        if(existingIdx >= 0){
          state.playerTeam.splice(existingIdx, 1);
          d.classList.remove('selected');
          const badge = d.querySelector('.order-badge'); if(badge) badge.remove();
          renderSelectedAbilities();
        } else {
          if(state.playerTeam.length >= 3) return;
          const newPet = JSON.parse(JSON.stringify(p));
          newPet.selectedAbilities = newPet.selectedAbilities || [];
          state.playerTeam.push(newPet);
          state.activePetIndex = state.playerTeam.length - 1;
          d.classList.add('selected');
          const badge = document.createElement('div'); badge.className = 'order-badge'; badge.textContent = state.playerTeam.length;
          d.appendChild(badge);
        }
        document.querySelectorAll('.pet').forEach(el=>{
          const id = el.getAttribute('data-id');
          const idx = state.playerTeam.findIndex(x=>x.id===id);
          let b = el.querySelector('.order-badge');
          if(idx>=0){ if(!b){ b = document.createElement('div'); b.className='order-badge'; el.appendChild(b); } b.textContent = (idx+1); el.classList.add('selected'); }
          else { if(b){ b.remove(); } el.classList.remove('selected'); }
        });
        state.player = state.playerTeam[0] ? state.playerTeam[0] : null;
        const ps = document.getElementById('player-sprite'); if(ps && state.player) ps.src = state.player.image;
        checkStartReady();
        renderSelectedAbilities();
      });
      $petList.appendChild(d);
    })
  }

  function renderAbilities(){
    $abilityList.innerHTML = '';
    const cats = [
      { id: 'healing', label: 'Healing', ids: ['heal','hot','charge-heal','team-heal'], cls: 'green' },
      { id: 'damage', label: 'Damage', ids: ['attack','dot','charge-attack','team-attack'], cls: 'red' },
      { id: 'support', label: 'Support', ids: ['defend','stun','bolster','intervene'], cls: 'white' }
    ];
    cats.forEach(cat => {
      const wrap = el('div',{class:'cat'});
      const btn = el('button',{class:'cat-btn '+cat.cls,'data-cat':cat.id}); btn.textContent = cat.label;
      const menu = el('div',{class:'cat-menu','data-cat':cat.id});
      cat.ids.forEach(aid=>{
        const a = ABILITIES.find(x=>x.id===aid);
        if(!a) return;
        const colorClass = ABILITY_COLOR[a.id] || '';
        const item = el('div',{class:'cat-item ' + colorClass, 'data-id':a.id});
        item.innerHTML = `<div class="name">${a.name}</div><div class="desc">${a.desc}</div>`;
        const petSel = (state.playerTeam[state.activePetIndex] && state.playerTeam[state.activePetIndex].selectedAbilities) || [];
        if(petSel.indexOf(a.id) >= 0){ item.classList.add('selected'); }
          item.addEventListener('click',()=>{
            const petIdx = state.activePetIndex;
            if(typeof petIdx !== 'number' || !state.playerTeam[petIdx]){
              log('Select a pet to assign abilities to.');
              return;
            }
            const id = a.id;
      const healingIds = ['heal','hot','charge-heal','team-heal'];
            playSound('selectAbility');
            const sel = state.playerTeam[petIdx].selectedAbilities = state.playerTeam[petIdx].selectedAbilities || [];
            const idx = sel.indexOf(id);
            if(idx>=0){
              sel.splice(idx,1);
              item.classList.remove('selected');
            } else {
              if(sel.length>=3) return;
              if(healingIds.includes(id) && sel.some(s=>healingIds.includes(s))){
                log('A single pet may only choose one healing ability.');
                return;
              }
              sel.push(id);
              item.classList.add('selected');
            }
            checkStartReady();
            refreshAbilityStates();
            renderSelectedAbilities();
          });
        menu.appendChild(item);
      });
      wrap.appendChild(btn);
      wrap.appendChild(menu);
      $abilityList.appendChild(wrap);
    });
    setupCategoryBehavior();
    renderSelectedAbilities();
  }

  function setupCategoryBehavior(){
    const buttons = Array.from(document.querySelectorAll('.cat-btn'));
    let open = null;
    buttons.forEach(b=>{
      b.addEventListener('click', ()=>{
        playSound('selectPet');
        const id = b.getAttribute('data-cat');
        if(open && open !== id){
          const prev = document.querySelector('.cat-menu[data-cat="'+open+'"]');
          if(prev){ prev.classList.remove('open'); if(prev.parentElement) prev.parentElement.classList.remove('open'); }
          open = null;
        }
        const menu = document.querySelector('.cat-menu[data-cat="'+id+'"]');
        if(!menu) return;
        if(menu.classList.contains('open')){ 
          menu.classList.remove('open'); 
          if(menu.parentElement) menu.parentElement.classList.remove('open');
          open = null; 
        }
        else { 
          menu.classList.add('open'); 
          if(menu.parentElement) menu.parentElement.classList.add('open');
          open = id; 
        }
      });
    });
  }

  function renderSelectedAbilities(){
    const container = document.getElementById('selected-abilities');
    if(!container) return;
    container.innerHTML = '';
    if(!state.playerTeam || state.playerTeam.length === 0){
      const ph = el('div', {class: 'sel placeholder'}, 'No pets selected');
      container.appendChild(ph);
      return;
    }
    state.playerTeam.forEach((pet, pidx)=>{
      const wrap = el('div',{class:'pet-ability-block'});
      const header = el('div',{class:'pet-ability-header'}, `<strong>${pidx+1}. ${pet.name}</strong> <button class="choose-pet" data-idx="${pidx}">Edit</button>`);
      wrap.appendChild(header);
      const list = el('div',{class:'pet-ability-list'});
      const sel = pet.selectedAbilities || [];
      if(sel.length===0) list.appendChild(el('div',{class:'sel placeholder'}, 'No abilities assigned'));
      sel.forEach((id, idx)=>{
        const a = ABILITIES.find(x=>x.id===id);
        if(!a) return;
        const colorClass = ABILITY_COLOR[a.id] || '';
        const s = el('div',{class:'sel '+colorClass,'data-id':id}, '');
        s.innerHTML = `<div class="name">${a.name}</div><div class="desc">${a.desc.replace(/<br>/g,' ')}</div>`;
        const btn = document.createElement('button'); btn.className='sel-remove'; btn.textContent='X';
        btn.addEventListener('click', (ev)=>{ ev.stopPropagation(); const i = sel.indexOf(id); if(i>=0) sel.splice(i,1); refreshAbilityStates(); checkStartReady(); renderSelectedAbilities(); });
        s.appendChild(btn);
        list.appendChild(s);
      });
      wrap.appendChild(list);
      container.appendChild(wrap);
    });

    Array.from(container.querySelectorAll('.choose-pet')).forEach(b=>{
      b.addEventListener('click', ()=>{
        const idx = parseInt(b.getAttribute('data-idx'),10);
        state.activePetIndex = idx;
        document.querySelectorAll('.cat-menu.open').forEach(m=>m.classList.remove('open'));
        document.querySelectorAll('#ability-list .cat-item.selected').forEach(it=>it.classList.remove('selected'));
        renderAbilities();
        refreshAbilityStates();
        renderSelectedAbilities();
      });
    });
  }

  function refreshAbilityStates(){
    const healingIds = ['heal','hot','charge-heal','team-heal'];
    const petIdx = state.activePetIndex;
    const sel = (state.playerTeam[petIdx] && state.playerTeam[petIdx].selectedAbilities) || [];
    const healingSelected = sel.some(s=>healingIds.includes(s));
    document.querySelectorAll('#ability-list .cat-item').forEach(elm=>{
      const id = elm.getAttribute('data-id');
      if(healingIds.includes(id) && healingSelected && !sel.includes(id)){
        elm.classList.add('disabled');
      } else {
        elm.classList.remove('disabled');
      }
      if(sel.includes(id)) elm.classList.add('selected'); else elm.classList.remove('selected');
    });
  }

  function checkStartReady(){
    const ready = Array.isArray(state.playerTeam) && state.playerTeam.length === 3 && state.playerTeam.every(p=>Array.isArray(p.selectedAbilities) && p.selectedAbilities.length === 3);
    $startBtn.disabled = !ready;
    const startControls = $startBtn.parentElement;
    if(ready){
      $startBtn.textContent = 'Start Battle';
      $startBtn.classList.add('ready');
      $startBtn.classList.add('pulse');
      if(startControls){ startControls.style.flexDirection = 'column'; startControls.style.alignItems = 'stretch'; }
      if(!document.getElementById('boss-panel')){
        const panel = document.createElement('div');
        panel.id = 'boss-panel';
        panel.className = 'boss-panel';
        const title = document.createElement('div');
        title.className = 'boss-title';
        title.textContent = 'Boss Fights';
        panel.appendChild(title);
        const btnEgg = document.createElement('button');
        btnEgg.className = 'boss-btn ' + ($startBtn.className || '');
        btnEgg.setAttribute('data-boss','boss-ancient');
        btnEgg.textContent = 'Eggling';
        btnEgg.addEventListener('click', ()=>{ playSound('start'); chooseBoss(); startBattle(); });
        panel.appendChild(btnEgg);
        const btnExp = document.createElement('button');
        btnExp.className = 'boss-btn ' + ($startBtn.className || '');
        btnExp.setAttribute('data-boss','boss-experiment');
        btnExp.textContent = 'Experiment 137-B';
        btnExp.addEventListener('click', ()=>{ playSound('start'); chooseBossExperiment(); startBattle(); });
        panel.appendChild(btnExp);
        const btnRosie = document.createElement('button');
        btnRosie.className = 'boss-btn ' + ($startBtn.className || '');
        btnRosie.setAttribute('data-boss','boss-rosie');
        if(!isRosieUnlocked()){
          btnRosie.disabled = true;
          btnRosie.textContent = 'Defeat The Others First';
          btnRosie.title = 'Defeat Eggling and Experiment 137-B first.';
          btnRosie.classList.add('disabled');
        } else {
          btnRosie.textContent = 'Rosie';
        }
        btnRosie.addEventListener('click', ()=>{ if(btnRosie.disabled) return; playSound('start'); chooseBossRosie(); startBattle(); });
        panel.appendChild(btnRosie);
        updateBossPanelUI();
        $startBtn.insertAdjacentElement('afterend', panel);
      } else {
      }
    } else {
      const bp = document.getElementById('boss-panel'); if(bp){ bp.remove(); }
      if(startControls){ startControls.style.flexDirection = ''; startControls.style.alignItems = ''; }
      const parts = [];
      $startBtn.textContent = parts.join(' • ') || 'Pick 3 pets and 3 abilities each';
      $startBtn.classList.remove('ready');
      $startBtn.classList.remove('pulse');
    }
  }

  function chooseBoss(){
    const boss = {
      id: 'boss-ancient',
      name: 'Eggling',
      type: 'Boss',
      maxHp: 2500,
      power: 7.5,
      healing: 5,
      hpBars: 12,
      powerBars: 6,
      healingBars: 6,
      image: 'Sprites/Adult2 (1).gif',
      sickImage: 'Sprites/Sick2.gif'
    };
      state.enemy = JSON.parse(JSON.stringify(boss));
    state.enemy.isBoss = true;
    const healingIds = ['heal','hot','charge-heal','team-heal'];
    state.enemyAbilities = ABILITIES.filter(a => !healingIds.includes(a.id) && a.id !== 'intervene' && a.id !== 'beam' && a.id !== 'decay' && a.id !== 'scratch').map(a=>a.id);
  }

  function chooseBossExperiment(){
    const boss = {
      id: 'boss-experiment',
      name: '137-B',
      type: 'Boss',
      maxHp: 3000,
      power: 5,
      healing: 0,
      hpBars: 6,
      powerBars: 3,
      healingBars: 0,
      image: 'Sprites/Adult (1).gif',
      sickImage: 'Sprites/Sick.gif'
    };
      state.enemy = JSON.parse(JSON.stringify(boss));
    state.enemy.isBoss = true;
    state.enemyAbilities = ['decay'];
  }

  function chooseBossRosie(){
    const boss = {
      id: 'boss-rosie',
      name: 'Rosie',
      type: 'Boss',
      maxHp: 2500,
      power: 8.25,
      healing: 0,
      hpBars: 6,
      powerBars: 3,
      healingBars: 0,
      image: 'Sprites/Rosie.png',
      sickImage: 'Sprites/Splat.png'
    };
      state.enemy = JSON.parse(JSON.stringify(boss));
    state.enemy.isBoss = true;
    const rosieAllowed = ['bubble','scorch','shatter','hurricane','curse','toxin','vines','scratch','bolster','pass'];
    state.enemyAbilities = rosieAllowed.filter(id => ABILITIES.find(a=>a.id===id));
  }

  function chooseEnemy(){
    const pool = PETS.filter(p=>!state.player || p.id!==state.player.id);
    const pick = pool[Math.floor(Math.random()*pool.length)];
    state.enemy = JSON.parse(JSON.stringify(pick));
    state.enemy.isBoss = false;
  const healingIds = ['heal','hot','charge-heal','team-heal'];
  const offenses = ABILITIES.filter(a=>a.type === 'offense' && a.id !== 'decay' && a.id !== 'scratch');
  const all = ABILITIES.filter(a => a.id !== 'intervene' && a.id !== 'decay' && a.id !== 'scratch');
  const typeMap = { Fluid: 'bubble', Flame: 'scorch', Stone: 'shatter', Storm: 'hurricane', Gleam: 'beam', Gloom: 'curse', Blight: 'toxin', Bloom: 'vines' };
  const typeSpecialIds = ['bubble','scorch','shatter','hurricane','beam','curse','toxin','vines'];
    let chosen = [];
    const attackAbility = ABILITIES.find(a=>a.id === 'attack' && a.type === 'offense');
    if(attackAbility){
      chosen.push(attackAbility);
    } else if(offenses.length){
      const pickOff = offenses[Math.floor(Math.random()*offenses.length)];
      if(pickOff) chosen.push(pickOff);
    }
    while(chosen.length < 4){
      const takenIds = new Set(chosen.map(c=>c.id));
      let candidates = all.filter(a=>!takenIds.has(a.id));
      if(chosen.some(c=>healingIds.includes(c.id))){
        candidates = candidates.filter(a=>!healingIds.includes(a.id));
      }
      if(!state.enemy.isBoss){
        candidates = candidates.filter(a=>{
          if(typeSpecialIds.includes(a.id)){
            const mapped = state.enemy && state.enemy.type ? typeMap[state.enemy.type] : null;
            return mapped === a.id;
          }
          return true;
        });
      }
      if(candidates.length === 0){
        candidates = all.filter(a=>!takenIds.has(a.id));
      }
      const c = candidates[Math.floor(Math.random()*candidates.length)];
      if(!c) break;
      chosen.push(c);
    }
    try{
      const mappedId = state.enemy && state.enemy.type ? typeMap[state.enemy.type] : null;
      if(mappedId){
        const has = chosen.some(c=>c.id === mappedId);
        if(!has){
          const mappedAbility = ABILITIES.find(a=>a.id === mappedId);
          if(mappedAbility){
            if(chosen.length < 4) chosen.push(mappedAbility);
            else chosen[chosen.length - 1] = mappedAbility;
          }
        }
      }
    }catch(e){}
    try{
      const mappedId = state.enemy && state.enemy.type ? typeMap[state.enemy.type] : null;
      const healIds = ['heal','hot','charge-heal','team-heal'];
      const attackId = 'attack';

      let healCount = chosen.filter(c=> healIds.includes(c.id)).length;
      for(let i = chosen.length - 1; i >= 0 && healCount > 1; i--){
        if(healIds.includes(chosen[i].id) && chosen[i].id !== mappedId){ chosen.splice(i,1); healCount--; }
      }

      if(!chosen.some(c=>c.id === attackId)){
        const attackAbility = ABILITIES.find(a=>a.id === attackId);
        if(attackAbility){
          if(chosen.length < 4) chosen.push(attackAbility);
          else {
            let replaced = false;
            for(let i = chosen.length - 1; i >= 0; i--){ if(chosen[i].id !== mappedId){ chosen[i] = attackAbility; replaced = true; break; } }
            if(!replaced) chosen[chosen.length - 1] = attackAbility;
          }
        }
      }

      if(mappedId){
        const mappedAbility = ABILITIES.find(a=>a.id === mappedId);
        if(mappedAbility){ chosen = chosen.filter(c=> c.id !== mappedId); chosen.unshift(mappedAbility); }
      }

      const seen = new Set(); const out = []; for(const c of chosen){ if(!seen.has(c.id)){ seen.add(c.id); out.push(c); } } chosen = out;
      while(chosen.length < 4){ const cand = ABILITIES.find(a=> !chosen.some(c=>c.id===a.id)); if(!cand) break; chosen.push(cand); }

      healCount = chosen.filter(c=> healIds.includes(c.id)).length;
      for(let i = chosen.length -1; i >=0 && healCount > 1; i--){
        if(healIds.includes(chosen[i].id) && chosen[i].id !== mappedId){
          const repl = ABILITIES.find(a=> !chosen.some(c=>c.id===a.id) && !healIds.includes(a.id));
          if(repl) chosen[i] = repl; else chosen.splice(i,1);
          healCount--;
        }
      }
      if(chosen.length > 4) chosen = chosen.slice(0,4);
      while(chosen.length < 4){ const cand = ABILITIES.find(a=> !chosen.some(c=>c.id===a.id)); if(!cand) break; chosen.push(cand); }
    }catch(e){}
    state.enemyAbilities = chosen.slice(0,4).map(a=>a.id);
  }

  function chooseEnemyTeam(){
    const pool = PETS.slice();
    const picks = [];
    for(let i=0;i<3;i++){
      const srcPool = pool.length ? pool : PETS.slice();
      const pick = srcPool[Math.floor(Math.random()*srcPool.length)];
      const enemy = JSON.parse(JSON.stringify(pick));
      enemy.selectedAbilities = [];
  const all = ABILITIES.filter(a => a.id !== 'intervene');
  const healingIds = ['heal','hot','charge-heal','team-heal'];
      const typeMap = { Fluid: 'bubble', Flame: 'scorch', Stone: 'shatter', Storm: 'hurricane', Gleam: 'beam', Gloom: 'curse', Blight: 'toxin', Bloom: 'vines' };
      const typeSpecialIds = ['bubble','scorch','shatter','hurricane','beam','curse','toxin','vines'];
      let chosen = [];
      const offenses = ABILITIES.filter(a=>a.type === 'offense');
      const attackAbility = ABILITIES.find(a=>a.id === 'attack' && a.type === 'offense');
      if(attackAbility) chosen.push(attackAbility);
      while(chosen.length < 4){
        const takenIds = new Set(chosen.map(c=>c.id));
        let candidates = all.filter(a=>!takenIds.has(a.id));
        if(chosen.some(c=>healingIds.includes(c.id))){
          candidates = candidates.filter(a=>!healingIds.includes(a.id));
        }
        if(typeSpecialIds && enemy && !enemy.isBoss){
          candidates = candidates.filter(a=>{
            if(typeSpecialIds.includes(a.id)){
              const mapped = enemy && enemy.type ? typeMap[enemy.type] : null;
              return mapped === a.id;
            }
            return true;
          });
          candidates = candidates.filter(a => a.id !== 'decay' && a.id !== 'scratch');
        }
        if(candidates.length === 0) candidates = all.filter(a=>!takenIds.has(a.id));
        const c = candidates[Math.floor(Math.random()*candidates.length)];
        if(!c) break;
        chosen.push(c);
      }
        try{
          const mappedId = enemy && enemy.type ? typeMap[enemy.type] : null;
          const healIds = ['heal','hot','charge-heal','team-heal'];
          const attackId = 'attack';

          let healCount = chosen.filter(c=> healIds.includes(c.id)).length;
          for(let i = chosen.length - 1; i >= 0 && healCount > 1; i--){
            if(healIds.includes(chosen[i].id) && chosen[i].id !== mappedId){ chosen.splice(i,1); healCount--; }
          }

          if(!chosen.some(c=>c.id === attackId)){
            const attackAbility = ABILITIES.find(a=>a.id === attackId);
            if(attackAbility){
              if(chosen.length < 4) chosen.push(attackAbility);
              else {
                let replaced = false;
                for(let i = chosen.length - 1; i >= 0; i--){ if(chosen[i].id !== mappedId){ chosen[i] = attackAbility; replaced = true; break; } }
                if(!replaced) chosen[chosen.length - 1] = attackAbility;
              }
            }
          }

          if(mappedId){
            const mappedAbility = ABILITIES.find(a=>a.id === mappedId);
            if(mappedAbility){ chosen = chosen.filter(c=> c.id !== mappedId); chosen.unshift(mappedAbility); }
          }

          const seen = new Set(); const out = []; for(const c of chosen){ if(!seen.has(c.id)){ seen.add(c.id); out.push(c); } } chosen = out;
          while(chosen.length < 4){ const cand = ABILITIES.find(a=> !chosen.some(c=>c.id===a.id)); if(!cand) break; chosen.push(cand); }
          healCount = chosen.filter(c=> healIds.includes(c.id)).length;
          for(let i = chosen.length -1; i >=0 && healCount > 1; i--){ if(healIds.includes(chosen[i].id) && chosen[i].id !== mappedId){ const repl = ABILITIES.find(a=> !chosen.some(c=>c.id===a.id) && !healIds.includes(a.id)); if(repl) chosen[i] = repl; else chosen.splice(i,1); healCount--; } }
          if(chosen.length > 4) chosen = chosen.slice(0,4);
          while(chosen.length < 4){ const cand = ABILITIES.find(a=> !chosen.some(c=>c.id===a.id)); if(!cand) break; chosen.push(cand); }
        }catch(e){}
        enemy.selectedAbilities = chosen.slice(0,4).map(a=>a.id);
      picks.push(enemy);
    }
    state.enemyTeam = picks;
  }

  function startBattle(){
    if(Array.isArray(state.playerTeam) && state.playerTeam.length > 0){
      state.playerTeam.forEach(p=>{
        p.hp = p.maxHp;
        p.effects = [];
        p.defend = false;
        p.charged = null;
        p.cooldowns = {};
        p.stunned = 0;
        p.selectedAbilities = p.selectedAbilities || [];
      });
      if(Array.isArray(state.enemyTeam) && state.enemyTeam.length>0){
        state.enemyTeam.forEach(e=>{
          e.hp = e.maxHp;
          e.effects = [];
          e.defend = false;
          e.charged = null;
          e.cooldowns = {};
          e.stunned = 0;
          e.selectedAbilities = e.selectedAbilities || [];
        });
      } else if(state.enemy){
        state.enemy.hp = state.enemy.maxHp; state.enemy.effects = []; state.enemy.defend=false; state.enemy.charged=null; state.enemy.cooldowns={}; state.enemy.stunned=0;
      }
      state.player = state.playerTeam[0];
      if(state.enemy && state.enemy.isBoss){
      } else {
        state.enemy = (state.enemyTeam && state.enemyTeam[0]) || state.enemy;
      }
      const sumHp = team => team.reduce((s,x)=>s + (x.hp||0), 0);
      state._displayHp = { player: sumHp(state.playerTeam), enemy: state.enemyTeam && state.enemyTeam.length ? sumHp(state.enemyTeam) : (state.enemy && state.enemy.hp) };
      state._hpAnim = { player: null, enemy: null };
    } else {
      ['player','enemy'].forEach(k=>{
        state[k].hp = state[k].maxHp;
        state[k].effects = [];
        state[k].defend = false;
        state[k].charged = null;
        state[k].cooldowns = {};
        state[k].stunned = 0;
      })
      state._displayHp = { player: state.player.maxHp, enemy: state.enemy.maxHp };
      state._hpAnim = { player: null, enemy: null };
    }

    state.turn = 'player';
    $setup.classList.add('hidden');
    $battle.classList.remove('hidden');
  try{ document.body.classList.add('battle-visible'); }catch(e){}
    $restart.classList.add('hidden');
  const controls = document.querySelector('.controls');
  if(controls){ controls.style.justifyContent = ''; }
  if($back) $back.style.marginRight = ''; if($home) $home.style.margin = ''; if($restart) $restart.style.marginLeft = '';
    $log.innerHTML='';
    state.log=[];
  if($playerName) $playerName.textContent = state.player.name || '';
  if($enemyName) {
    $enemyName.textContent = state.enemy.name || '';
    if(state.enemy && state.enemy.name === 'Rosie'){
      $enemyName.style.color = '#f5f1e0';
    } else if(state.enemy && state.enemy.name === '137-B'){
      $enemyName.style.color = '#0f0';
    } else {
      $enemyName.style.color = state.enemy && state.enemy.isBoss ? '#f0f' : '';
    }
  }
  if($playerType) $playerType.textContent = state.player.type || '';
  if($enemyType) $enemyType.textContent = state.enemy.type || '';
  const ps = document.getElementById('player-sprite'); if(ps) ps.src = state.player.image;
  const es = document.getElementById('enemy-sprite'); if(es) es.src = state.enemy.image;
  const enemyPanel = document.querySelector('.combatant.enemy');
  if(enemyPanel){
    if(state.enemy && state.enemy.isBoss) enemyPanel.classList.add('boss');
    else enemyPanel.classList.remove('boss');
  }
  const vsTrack = document.querySelector('.vs-track');
  if(vsTrack){
    if(state.enemy && state.enemy.isBoss) vsTrack.classList.add('boss');
    else vsTrack.classList.remove('boss');
  }
  state.round = 1;
  updateRoundDisplay();
  updateUI();
    renderActions();
    updateBattleSprites();
    log('Battle started!');
  state.turn = 'player';
  setActiveTurn('player');
  console.log('startBattle: turn=', state.turn);
  }

  function deadSpriteFor(name){
    const map = { Kivi:'KiviDead.png', Tuuli:'TuliDead.png', Vala:'ValaDead.png', Palo:'PaloDead.png', Vika:'VikaDead.png', Vesi:'VesiDead.png', Sieni:'SieniDead.png', Haju:'HajuDead.png' };
    const file = map[name];
    return file ? ('DeadSprites/' + file) : null;
  }

  function spriteSrcForPet(p){
    if(!p) return '';
    if(p.dead || (typeof p.hp === 'number' && p.hp <= 0)){
      if(p.isBoss) return p.sickImage || p.image || '';
      const d = deadSpriteFor(p.name);
      return d || p.image || '';
    }
    return p.image || '';
  }

  function updateBattleSprites(){
    const main = document.getElementById('player-sprite');
    const b1 = document.getElementById('player-sprite-back1');
    const b2 = document.getElementById('player-sprite-back2');
    if(Array.isArray(state.playerTeam) && state.playerTeam.length>0){
      const p0 = state.playerTeam[0]; if(main) { main.src = spriteSrcForPet(p0); if(p0.dead) main.classList.add('dead'); else main.classList.remove('dead'); }
      const p1 = state.playerTeam[1]; if(b1) { if(p1){ b1.src = spriteSrcForPet(p1); b1.style.display='block'; if(p1.dead) b1.classList.add('dead'); else b1.classList.remove('dead'); } else { b1.style.display='none'; } }
      const p2 = state.playerTeam[2]; if(b2) { if(p2){ b2.src = spriteSrcForPet(p2); b2.style.display='block'; if(p2.dead) b2.classList.add('dead'); else b2.classList.remove('dead'); } else { b2.style.display='none'; } }
    } else {
      if(main && state.player) main.src = spriteSrcForPet(state.player);
      if(b1) b1.style.display='none'; if(b2) b2.style.display='none';
    }
    try{
      const activePlayer = (Array.isArray(state.playerTeam) && state.playerTeam.length>0) ? state.playerTeam[0] : state.player;
      if(activePlayer){
        if($playerName) $playerName.textContent = activePlayer.name || '';
        if($playerType) $playerType.textContent = activePlayer.type || '';
      }
    }catch(e){}
    const em = document.getElementById('enemy-sprite');
    const eb1 = document.getElementById('enemy-sprite-back1');
    const eb2 = document.getElementById('enemy-sprite-back2');
    if(Array.isArray(state.enemyTeam) && state.enemyTeam.length>0){
      const e0 = state.enemyTeam[0]; if(em) { em.src = spriteSrcForPet(e0); if(e0.dead) em.classList.add('dead'); else em.classList.remove('dead'); }
      const e1 = state.enemyTeam[1]; if(eb1) { if(e1){ eb1.src = spriteSrcForPet(e1); eb1.style.display='block'; if(e1.dead) eb1.classList.add('dead'); else eb1.classList.remove('dead'); } else { eb1.style.display='none'; } }
      const e2 = state.enemyTeam[2]; if(eb2) { if(e2){ eb2.src = spriteSrcForPet(e2); eb2.style.display='block'; if(e2.dead) eb2.classList.add('dead'); else eb2.classList.remove('dead'); } else { eb2.style.display='none'; } }
    } else if(state.enemy){
      if(em) em.src = spriteSrcForPet(state.enemy); if(eb1) eb1.style.display='none'; if(eb2) eb2.style.display='none';
    }
    try{
      const activeEnemy = (Array.isArray(state.enemyTeam) && state.enemyTeam.length>0) ? state.enemyTeam[0] : state.enemy;
      if(activeEnemy){
        if($enemyName) {
          $enemyName.textContent = activeEnemy.name || '';
          if(activeEnemy && activeEnemy.name === 'Rosie'){
              $enemyName.style.color = '#f4d77aff';
            } else if(activeEnemy && activeEnemy.name === '137-B'){
              $enemyName.style.color = '#0f0';
            } else {
              $enemyName.style.color = activeEnemy.isBoss ? '#f0f' : '';
            }
        }
        if($enemyType) $enemyType.textContent = activeEnemy.type || '';
      }
    }catch(e){}
  }

  function tickCooldowns(actor){
    if(!actor || !actor.cooldowns) return;
    Object.keys(actor.cooldowns).forEach(k=>{
      actor.cooldowns[k] -= 1;
      if(actor.cooldowns[k] <= 0) delete actor.cooldowns[k];
    });
  }

  function tickCooldownsForSide(side){
    if(side === 'player'){
      const team = Array.isArray(state.playerTeam) && state.playerTeam.length ? state.playerTeam : (state.player ? [state.player] : []);
      team.forEach(a=>{ if(a && a.cooldowns){ Object.keys(a.cooldowns).forEach(k=>{ a.cooldowns[k] -= 1; if(a.cooldowns[k] <= 0) delete a.cooldowns[k]; }); } });
    } else if(side === 'enemy'){
      const team = Array.isArray(state.enemyTeam) && state.enemyTeam.length ? state.enemyTeam : (state.enemy ? [state.enemy] : []);
      team.forEach(a=>{ if(a && a.cooldowns){ Object.keys(a.cooldowns).forEach(k=>{ a.cooldowns[k] -= 1; if(a.cooldowns[k] <= 0) delete a.cooldowns[k]; }); } });
    }
  }

  function setActiveTurn(which){
  state.turn = which;
  document.querySelectorAll('.combatant').forEach(el=>el.classList.remove('active'));
    if(which === 'player') document.querySelector('.combatant.player')?.classList.add('active');
    if(which === 'enemy') document.querySelector('.combatant.enemy')?.classList.add('active');
    const actionsEl = document.getElementById('actions');
    if(actionsEl) {
      if(which !== 'player') actionsEl.classList.add('disabled');
      else actionsEl.classList.remove('disabled');
    }
    updateTurnPills();
  }

  function updateTurnPills(){
    if(!$turnLeft || !$turnRight) return;
    if(state.turn === 'player'){
      $turnLeft.classList.remove('hidden');
      $turnRight.classList.add('hidden');
    } else if(state.turn === 'enemy'){
      $turnLeft.classList.add('hidden');
      $turnRight.classList.remove('hidden');
    } else {
      $turnLeft.classList.add('hidden');
      $turnRight.classList.add('hidden');
    }
  }

  function updateUI(){
    const p = state.player, e = state.enemy;
  const newP = p ? Math.max(0, Math.round(p.hp)) : 0;
  const newE = e ? Math.max(0, Math.round(e.hp)) : 0;
  animateNumber($vsLeftHp, state._displayHp?.player ?? newP, newP, 420, 'player', p ? p.maxHp : 0);
  animateNumber($vsRightHp, state._displayHp?.enemy ?? newE, newE, 420, 'enemy', e ? e.maxHp : 0);
  let pw = p && p.maxHp ? Math.max(0, (p.hp / p.maxHp)) : 0;
  let ew = e && e.maxHp ? Math.max(0, (e.hp / e.maxHp)) : 0;
  ensureHpSegments();
  setHpSegments('player', pw);
  setHpSegments('enemy', ew);
    $playerEffects.textContent = p && p.effects ? p.effects.map(x=>`${x.name}(${x.rounds})`).join(', ') : '';
    $enemyEffects.textContent = e && e.effects ? e.effects.map(x=>`${x.name}(${x.rounds})`).join(', ') : '';
    $playerEffects.textContent = p.effects.map(x=>`${x.name}${x.stacks ? ' ['+x.stacks+']' : ''}(${x.rounds})`).join(', ');
    $enemyEffects.textContent = e.effects.map(x=>`${x.name}${x.stacks ? ' ['+x.stacks+']' : ''}(${x.rounds})`).join(', ');

    const leftBenchEl = document.getElementById('vs-left-bench-hp');
    const rightBenchEl = document.getElementById('vs-right-bench-hp');
    if(leftBenchEl){
      const team = state.playerTeam || [];
      const bench = team.slice(1);
      const cur = bench.reduce((s,x)=>s + (x.hp||0),0);
      const totalMax = bench.reduce((s,x)=>s + (x.maxHp||0),0);
      leftBenchEl.textContent = `Bench: ${cur} / ${totalMax}`;
    }
    if(rightBenchEl){
      const team = state.enemyTeam && state.enemyTeam.length ? state.enemyTeam : (state.enemy ? [state.enemy] : []);
      const bench = (state.enemyTeam && state.enemyTeam.length) ? (team.slice(1)) : [];
      const cur = bench.reduce((s,x)=>s + (x.hp||0),0);
      const totalMax = bench.reduce((s,x)=>s + (x.maxHp||0),0);
      rightBenchEl.textContent = `Bench: ${cur} / ${totalMax}`;
    }
  }

  function ensureHpSegments(){
    try{
      const left = document.querySelector('.vs-fill.left');
      const right = document.querySelector('.vs-fill.right');
      if(left && !left.querySelector('.vs-segments')){
        const segs = document.createElement('div'); segs.className = 'vs-segments';
        for(let i=0;i<20;i++){ const d=document.createElement('div'); d.className='vs-seg'; segs.appendChild(d); }
        left.appendChild(segs);
      }
      if(right && !right.querySelector('.vs-segments')){
        const segs = document.createElement('div'); segs.className = 'vs-segments';
        for(let i=0;i<20;i++){ const d=document.createElement('div'); d.className='vs-seg'; segs.appendChild(d); }
        right.appendChild(segs);
      }
    }catch(e){}
  }

  function setHpSegments(side, ratio){
    try{
      const root = document.querySelector(side==='player'?'.vs-fill.left':'.vs-fill.right');
      if(!root) return;
      const segWrap = root.querySelector('.vs-segments');
      if(!segWrap) return;
      const segs = segWrap.querySelectorAll('.vs-seg');
      const total = 20;
      const target = Math.max(0, Math.min(total, Math.floor(ratio * total)));
      segWrap.classList.remove('hp-ok','hp-warn','hp-danger');
      if(ratio > 0.6) segWrap.classList.add('hp-ok'); else if(ratio > 0.3) segWrap.classList.add('hp-warn'); else segWrap.classList.add('hp-danger');
      state._segCounts = state._segCounts || { player: null, enemy: null };
      state._segAnim = state._segAnim || { player: null, enemy: null };
      const key = side==='player' ? 'player' : 'enemy';
      const from = (state._segCounts[key] == null) ? target : state._segCounts[key];
      if(state._segAnim[key] && state._segAnim[key].raf){ cancelAnimationFrame(state._segAnim[key].raf); state._segAnim[key] = null; }
      if(from === target){
        for(let idx=0; idx<segs.length; idx++){
          const shouldOn = idx >= (total - target);
          if(shouldOn){ if(!segs[idx].classList.contains('on')) segs[idx].classList.add('on'); }
          else { if(segs[idx].classList.contains('on')) segs[idx].classList.remove('on'); }
        }
        state._segCounts[key] = target;
        return;
      }
      const duration = 420;
      const startTime = performance.now();
      function draw(now){
        const t = Math.min(1, (now - startTime) / duration);
        const eased = t<0.5 ? 2*t*t : -1 + (4-2*t)*t;
        const cur = from + (target - from) * eased;
        const curCount = Math.max(0, Math.min(total, Math.round(cur)));
        for(let idx=0; idx<segs.length; idx++){
          const shouldOn = idx >= (total - curCount);
          const isOn = segs[idx].classList.contains('on');
          if(shouldOn && !isOn){ segs[idx].classList.add('on'); }
          if(!shouldOn && isOn){ segs[idx].classList.remove('on'); }
        }
        if(t < 1){ state._segAnim[key] = { raf: requestAnimationFrame(draw) }; }
        else {
          for(let idx=0; idx<segs.length; idx++){
            const shouldOn = idx >= (total - target);
            const isOn = segs[idx].classList.contains('on');
            if(shouldOn && !isOn){ segs[idx].classList.add('on','flicker-on'); setTimeout(()=> segs[idx].classList.remove('flicker-on'), 180); }
            if(!shouldOn && isOn){ segs[idx].classList.remove('on'); segs[idx].classList.add('flicker-off'); setTimeout(()=> segs[idx].classList.remove('flicker-off'), 180); }
          }
          state._segCounts[key] = target;
          state._segAnim[key] = null;
        }
      }
      state._segAnim[key] = { raf: requestAnimationFrame(draw) };
    }catch(e){}
  }

  function animateNumber(el, start, end, duration=420, key='player', maxValue){
    if(!el) return;
    if(!state._hpAnim) state._hpAnim = {};
    if(state._hpAnim[key]) cancelAnimationFrame(state._hpAnim[key].raf);
    const range = end - start;
    const startTime = performance.now();
    function step(now){
      const t = Math.min(1, (now - startTime) / duration);
      const eased = t<0.5 ? 2*t*t : -1 + (4-2*t)*t;
      const val = Math.round(start + range * eased);
      el.textContent = (typeof maxValue !== 'undefined') ? `${val} / ${maxValue}` : String(val);
      if(t < 1){
        state._hpAnim[key].raf = requestAnimationFrame(step);
      } else {
        el.textContent = (typeof maxValue !== 'undefined') ? `${end} / ${maxValue}` : String(end);
        state._displayHp = state._displayHp || {};
        state._displayHp[key] = end;
        state._hpAnim[key] = null;
      }
    }
    state._hpAnim[key] = { raf: requestAnimationFrame(step) };
  }

  function renderActions(){
    $actions.innerHTML='';
  const passBtn = el('button',{'data-id':'pass','data-key':'1'});
  passBtn.innerHTML = `<span class="keybind">1</span>Pass`;
  passBtn.addEventListener('click',()=>{ playerUseAbility('pass'); });
  passBtn.classList.add('ability-btn');
  $actions.appendChild(passBtn);
  const switchBtn = el('button', {'data-id':'switch','data-key':'2'});
  switchBtn.innerHTML = `<span class="keybind">2</span>Switch`;
  switchBtn.classList.add('ability-btn');
  switchBtn.addEventListener('click', ()=>{ playerUseAbility('switch'); });
  if(state.player && state.player.stunned && state.player.stunned > 0) switchBtn.disabled = true;
  try{
    const team = Array.isArray(state.playerTeam) && state.playerTeam.length ? state.playerTeam : (state.player ? [state.player] : []);
    const aliveOthers = (team || []).filter(p => p && p !== state.player && !p.dead && p.hp > 0).length;
    if(aliveOthers === 0) switchBtn.disabled = true;
  }catch(e){}
  $actions.appendChild(switchBtn);
  try{
    const typeMap = { 
      Fluid: 'bubble', 
      Flame: 'scorch', 
      Stone: 'shatter', 
      Storm: 'hurricane', 
      Gleam: 'beam', 
      Gloom: 'curse',
      Blight: 'toxin',
      Bloom: 'vines' };
    const typeId = state.player && state.player.type ? typeMap[state.player.type] : null;
    if(typeId){
      const cd = (state.player && state.player.cooldowns && state.player.cooldowns[typeId]) || 0;
      const abilDef = ABILITIES.find(a=>a.id===typeId) || {};
      const tbtn = el('button', {'data-id': typeId, 'data-key': '3'});
      const label = (abilDef.name || typeId);
      tbtn.innerHTML = `<span class="keybind">3</span>${label}`;
      if(cd>0) tbtn.disabled = true;
      if(state.player && state.player.stunned && state.player.stunned > 0) tbtn.disabled = true;
      const color = ABILITY_COLOR[typeId]; if(color) tbtn.classList.add('ability-btn', color);
      if(cd>0){
        const ov = document.createElement('span');
        ov.className = 'cooldown-overlay';
        ov.textContent = String(cd);
        tbtn.appendChild(ov);
      }
      tbtn.addEventListener('click', ()=>{ playerUseAbility(typeId); });
      $actions.appendChild(tbtn);
    }
  }catch(e){}
    const abilSource = (state.player && state.player.selectedAbilities) || state.selectedAbilities || [];
    abilSource.forEach((id, idx)=>{
      const a = ABILITIES.find(x=>x.id===id);
      const key = String(idx + 4);
      const b = el('button',{'data-id':id,'data-key':key});
      const cd = (state.player && state.player.cooldowns && state.player.cooldowns[id]) || 0;
      const label = a.name;
      b.innerHTML = `<span class="keybind">${key}</span>${label}`;
      if(cd>0) b.disabled = true;
      if(state.player && state.player.stunned && state.player.stunned > 0) b.disabled = true;
      const color = ABILITY_COLOR[id]; if(color) b.classList.add('ability-btn', color);
      if(cd>0){
        const ov = document.createElement('span');
        ov.className = 'cooldown-overlay';
        ov.textContent = String(cd);
        b.appendChild(ov);
      }
      b.addEventListener('click',()=>{ playerUseAbility(id); });
      $actions.appendChild(b);
    })
  if($playerStatus) $playerStatus.className = 'status' + (state.player.stunned && state.player.stunned > 0 ? ' stunned' : '');
  if($enemyStatus) $enemyStatus.className = 'status' + (state.enemy.stunned && state.enemy.stunned > 0 ? ' stunned' : '');
  }

  function applyEffects(target){
    function _processActorEffects(actor, side){
      if(!actor) return;
      if(actor.dead) return;
      const resolveSource = (s) => {
        if(!s) return null;
        if(typeof s === 'object') return s;
        if(typeof s === 'string'){
          if(s === 'player' || s === 'enemy') return state[s];
          const findIn = (team) => Array.isArray(team) ? team.find(p=>p && p.id === s) : null;
          let found = findIn(state.playerTeam) || findIn(state.enemyTeam);
          if(!found){ if(state.player && state.player.id === s) found = state.player; if(state.enemy && state.enemy.id === s) found = state.enemy; }
          return found || null;
        }
        return null;
      };
      let total = 0;
      const remaining = [];
      (actor.effects || []).forEach(eff=>{
        if(eff.id==='dot'){
          let dmg = eff.value;
          const src = resolveSource(eff.source);
          if(actor && Array.isArray(actor.effects)){
            const curse = actor.effects.find(e=>e.id === 'curse');
            if(curse && typeof curse.value === 'number') dmg = Math.round(dmg * (1 + curse.value));
          }
          if(actor.defend){
            const strength = (typeof actor.defend === 'number') ? actor.defend : 1;
            dmg = Math.round(strength >= 2 ? dmg * 0.25 : dmg * 0.5);
            actor.defend = false;
          }
          if(actor && Array.isArray(actor.effects)){
            const bubble = actor.effects.find(e=>e.id === 'bubble');
            if(bubble && typeof bubble.value === 'number') dmg -= bubble.value;
          }
          dmg = Math.max(0, dmg);
          actor.hp -= dmg; total -= dmg; playSound('poison');
          try{ if(side === 'player') animateSprite('player','dot','small'); else animateSprite('enemy','dot','small'); }catch(e){}
          if(side==='player') flashShake('small', $playerHpFill); else flashShake('small', $enemyHpFill);
          try{ triggerVinesReflect(actor, src, dmg); }catch(e){}
        }
        if(eff.id==='rot'){
          let dmg = eff.value;
          const src = resolveSource(eff.source);
          if(actor && Array.isArray(actor.effects)){
            const curse = actor.effects.find(e=>e.id === 'curse');
            if(curse && typeof curse.value === 'number') dmg = Math.round(dmg * (1 + curse.value));
          }
          if(actor.defend){
            const strength = (typeof actor.defend === 'number') ? actor.defend : 1;
            dmg = Math.round(strength >= 2 ? dmg * 0.25 : dmg * 0.5);
            actor.defend = false;
          }
          if(actor && Array.isArray(actor.effects)){
            const bubble = actor.effects.find(e=>e.id === 'bubble');
            if(bubble && typeof bubble.value === 'number') dmg -= bubble.value;
          }
          dmg = Math.max(0, dmg);
          actor.hp -= dmg; total -= dmg; playSound('poison');
          try{ if(side === 'player') animateSprite('player','dot','small'); else animateSprite('enemy','dot','small'); }catch(e){}
          if(side==='player') flashShake('small', $playerHpFill); else flashShake('small', $enemyHpFill);
          try{ triggerVinesReflect(actor, src, dmg); }catch(e){}
        }
        if(eff.id==='poison'){
          let dmg = eff.value;
          const src = resolveSource(eff.source);
          if(actor && Array.isArray(actor.effects)){
            const curse = actor.effects.find(e=>e.id === 'curse');
            if(curse && typeof curse.value === 'number') dmg = Math.round(dmg * (1 + curse.value));
          }
          if(actor.defend){
            const strength = (typeof actor.defend === 'number') ? actor.defend : 1;
            dmg = Math.round(strength >= 2 ? dmg * 0.25 : dmg * 0.5);
            actor.defend = false;
          }
          if(actor && Array.isArray(actor.effects)){
            const bubble = actor.effects.find(e=>e.id === 'bubble');
            if(bubble && typeof bubble.value === 'number') dmg -= bubble.value;
          }
          dmg = Math.max(0, dmg);
          actor.hp -= dmg; total -= dmg; playSound('poison');
          try{ if(side === 'player') animateSprite('player','dot','small'); else animateSprite('enemy','dot','small'); }catch(e){}
          if(side==='player') flashShake('small', $playerHpFill); else flashShake('small', $enemyHpFill);
          try{ triggerVinesReflect(actor, src, dmg); }catch(e){}
        }
        if(eff.id==='decay'){
          const stacks = (typeof eff.stacks === 'number') ? eff.stacks : 1;
          let dmg = (eff.value || 7) * stacks;
          const src = resolveSource(eff.source);
          if(actor && Array.isArray(actor.effects)){
            const curse = actor.effects.find(e=>e.id === 'curse');
            if(curse && typeof curse.value === 'number') dmg = Math.round(dmg * (1 + curse.value));
          }
          if(actor.defend){
            const strength = (typeof actor.defend === 'number') ? actor.defend : 1;
            dmg = Math.round(strength >= 2 ? dmg * 0.25 : dmg * 0.5);
            actor.defend = false;
          }
          if(actor && Array.isArray(actor.effects)){
            const bubble = actor.effects.find(e=>e.id === 'bubble');
            if(bubble && typeof bubble.value === 'number') dmg -= bubble.value;
          }
          dmg = Math.max(0, dmg);
          actor.hp -= dmg; total -= dmg; playSound('poison');
          try{ if(side === 'player') animateSprite('player','dot','small'); else animateSprite('enemy','dot','small'); }catch(e){}
          if(side==='player') flashShake('small', $playerHpFill); else flashShake('small', $enemyHpFill);
          try{
            if(actor && Array.isArray(actor.effects) && !(eff._reflected)){
              const vine = actor.effects.find(e=>e.id === 'vines');
              if(vine && dmg > 0 && src){
                const pct = (typeof vine.value === 'number') ? vine.value : 0.3;
                const ret = Math.round(dmg * pct);
                if(ret > 0){
                  let reflected = ret;
                  if(src.defend){
                    const sstr = (typeof src.defend === 'number') ? src.defend : 1;
                    reflected = Math.round(sstr >= 2 ? reflected * 0.25 : reflected * 0.5);
                    src.defend = false;
                  }
                  if(src && Array.isArray(src.effects)){
                    const sbubble = src.effects.find(e=>e.id === 'bubble');
                    if(sbubble && typeof sbubble.value === 'number') reflected -= sbubble.value;
                  }
                  reflected = Math.max(0, reflected);
                  src.hp -= reflected;
                  log(`${actor.name}'s Vines returned ${reflected} damage to ${src.name}.`);
                  try{
                    const attackerKey = (src === state.player || (Array.isArray(state.playerTeam) && state.playerTeam.includes(src))) ? 'player' : 'enemy';
                    animateSprite(attackerKey,'dot','small');
                    if(attackerKey === 'player') flashShake('small', $playerHpFill); else flashShake('small', $enemyHpFill);
                  }catch(e){}
                  if(src.hp <= 0){ src.hp = 0; if(!src.dead){ src.dead = true; log(`${src.name} was brutally murdered!`); playSound('murder'); try{ if(src.isBoss){ const es = document.getElementById('enemy-sprite'); if(es) es.src = (src.sickImage || es.src); } }catch(e){} finishBattle(); } }
                }
              }
            }
          }catch(e){}
        }
        if(eff.id==='hot'){ 
          if(!actor.dead){ actor.hp += eff.value; total += eff.value; if(actor.hp>actor.maxHp) actor.hp=actor.maxHp; playSound('regenerate'); }
        }
        if(eff.id==='scorch'){
          let dmg = eff.value;
          const src = resolveSource(eff.source);
          if(actor && Array.isArray(actor.effects)){
            const curse = actor.effects.find(e=>e.id === 'curse');
            if(curse && typeof curse.value === 'number') dmg = Math.round(dmg * (1 + curse.value));
          }
          if(actor.defend){
            const strength = (typeof actor.defend === 'number') ? actor.defend : 1;
            dmg = Math.round(strength >= 2 ? dmg * 0.25 : dmg * 0.5);
            actor.defend = false;
          }
          if(actor && Array.isArray(actor.effects)){
            const bubble = actor.effects.find(e=>e.id === 'bubble');
            if(bubble && typeof bubble.value === 'number') dmg -= bubble.value;
          }
          dmg = Math.max(0, dmg);
          actor.hp -= dmg; total -= dmg; playSound('attack');
          if(side==='player') flashShake('medium', $playerHpFill); else flashShake('medium', $enemyHpFill);
          try{ triggerVinesReflect(actor, src, dmg); }catch(e){}
        }
        if(eff.id==='hurricane'){
          let dmg = eff.value;
          const src = resolveSource(eff.source);
          if(src && Array.isArray(src.effects)){
            const curse = src.effects.find(e=>e.id === 'curse');
            if(curse && typeof curse.value === 'number') dmg = Math.round(dmg * Math.max(0, 1 - curse.value));
          }
          if(actor.defend){
            const strength = (typeof actor.defend === 'number') ? actor.defend : 1;
            dmg = Math.round(strength >= 2 ? dmg * 0.25 : dmg * 0.5);
            actor.defend = false;
          }
          if(actor && Array.isArray(actor.effects)){
            const bubble = actor.effects.find(e=>e.id === 'bubble');
            if(bubble && typeof bubble.value === 'number') dmg -= bubble.value;
          }
          dmg = Math.max(0, dmg);
          actor.hp -= dmg; total -= dmg; playSound('attack');
          if(side==='player') flashShake('medium', $playerHpFill); else flashShake('medium', $enemyHpFill);
          try{ triggerVinesReflect(actor, src, dmg); }catch(e){}
        }
        if(eff.id === 'toxin'){
          try{
            if(eff.rounds > 1){
            } else {
              const fromKey = eff.sourceKey || (eff.source || null) || null;
              const srcKey = (fromKey === 'player' || fromKey === 'enemy') ? fromKey : null;
              const attackerKey = srcKey || (side === 'player' ? 'enemy' : 'player');
              let exec = Math.round(275 + randInt(0,25));
              let rot = 25;
              if(eff.bolstered){ exec = Math.round(exec * 1.15); rot = 40; }
              try{ animateSprite(attackerKey, 'attack', 'big'); }catch(e){}
              const applied = applyDamage(attackerKey, side === 'player' ? 'player' : 'enemy', exec, 'toxin-execute');
              if(actor && actor.hp > 0){ remaining.push({ id: 'rot', name: 'Rot', rounds: 8, value: rot, source: attackerKey }); }
              log({ text: `${(eff.sourceKey === 'player' ? 'Player' : eff.sourceKey === 'enemy' ? 'Enemy' : 'Unknown')} toxin burst for ${applied} damage on ${actor? actor.name : side}.`, abilityId: 'toxin' });
              if(side === 'player') flashShake('large', $playerHpFill); else flashShake('large', $enemyHpFill);
            }
          }catch(e){}
        }
        eff.rounds -= 1;
        if(eff.rounds>0) remaining.push(eff);
      });
      actor.effects = remaining;
      if(total!==0) {
        log(`${actor.name || side} ${total<0? 'lost':'recovered'} ${Math.abs(total)} HP.`);
        if(total<0){ if(side==='player') flashHit($playerHpFill); else flashHit($enemyHpFill); }
        else { if(side==='player') flashHeal($playerHpFill); else flashHeal($enemyHpFill); }
      }
      updateUI();
      try{ updateBattleSprites(); }catch(e){}
      if(actor.hp <= 0){
        actor.hp = 0;
        updateUI();
        if(!actor.dead){
          actor.dead = true;
          log(`${actor.name} was brutally murdered!`);
          playSound('murder');
          try{ if(actor.isBoss){ const es = document.getElementById('enemy-sprite'); if(es) es.src = (actor.sickImage || es.src); } }catch(e){}
          const playerTeam = state.playerTeam || [];
          const enemyTeam = state.enemyTeam || [];
          if(playerTeam.includes(actor)){
            if(state.player === actor){
              const nextIdx = playerTeam.findIndex(p=> p && p !== actor && !p.dead && (typeof p.hp === 'number' ? p.hp > 0 : true));
              if(nextIdx > -1){ const picked = playerTeam.splice(nextIdx,1)[0]; playerTeam.unshift(picked); state.player = playerTeam[0]; log(`${state.player.name} will avenge them!`); }
              else { finishBattle(); return; }
            }
          } else if(enemyTeam.includes(actor)){
            if(state.enemy === actor){
              const nextIdx = enemyTeam.findIndex(p=> p && p !== actor && !p.dead && (typeof p.hp === 'number' ? p.hp > 0 : true));
              if(nextIdx > -1){ const picked = enemyTeam.splice(nextIdx,1)[0]; enemyTeam.unshift(picked); state.enemy = enemyTeam[0]; log(`${state.enemy.name} will avenge them!`); try{ updateBattleSprites(); }catch(e){} try{ animateSprite('enemy','switch','big'); }catch(e){} try{ playSound('switch'); }catch(e){} }
              else { finishBattle(); return; }
            }
          } else {
            finishBattle();
          }
        }
      }
    }

    if(target === 'player'){
      if(Array.isArray(state.playerTeam) && state.playerTeam.length){
        state.playerTeam.forEach(p=> _processActorEffects(p, 'player'));
      } else {
        _processActorEffects(state.player, 'player');
      }
      return;
    }
    if(target === 'enemy'){
      if(Array.isArray(state.enemyTeam) && state.enemyTeam.length){
        state.enemyTeam.forEach(e=> _processActorEffects(e, 'enemy'));
      } else {
        _processActorEffects(state.enemy, 'enemy');
      }
      return;
    }
  }

  function consumeBolster(actor){
    if(!actor) return;
    actor.bolster = false;
    if(Array.isArray(actor.effects)) actor.effects = actor.effects.filter(e=>e.id !== 'bolstered');
  }

  function consumeDefend(actor){
    if(!actor) return;
    actor.defend = false;
    if(Array.isArray(actor.effects)) actor.effects = actor.effects.filter(e=>e.id !== 'defended');
  }

  function triggerVinesReflect(defender, attacker, dmg){
    try{
      if(!defender || !Array.isArray(defender.effects) || !attacker) return;
      const vine = defender.effects.find(e=>e.id === 'vines');
      if(!vine || !(dmg > 0)) return;
      const pct = (typeof vine.value === 'number') ? vine.value : 0.3;
      const ret = Math.round(dmg * pct);
      if(ret <= 0) return;
      let reflected = ret;
      if(attacker.defend){ const sstr = (typeof attacker.defend === 'number') ? attacker.defend : 1; reflected = Math.round(sstr >= 2 ? reflected * 0.25 : reflected * 0.5); attacker.defend = false; }
      if(attacker && Array.isArray(attacker.effects)){ const sbubble = attacker.effects.find(e=>e.id === 'bubble'); if(sbubble && typeof sbubble.value === 'number') reflected -= sbubble.value; }
      reflected = Math.max(0, reflected);
      if(reflected > 0){
        attacker.hp -= reflected;
        log(`${defender.name}'s Vines returned ${reflected} damage to ${attacker.name}.`);
        playSound('defend');
        if(attacker.hp <= 0){ attacker.hp = 0; if(!attacker.dead){ attacker.dead = true; log(`${attacker.name} was brutally murdered!`); playSound('murder'); try{ if(attacker.isBoss){ const es = document.getElementById('enemy-sprite'); if(es) es.src = (attacker.sickImage || es.src); } }catch(e){} finishBattle(); } }
      }
    }catch(e){}
  }

  function applyStunTo(target, rounds){
    if(!target) return;
    target.stunned = (target.stunned && target.stunned>0) ? target.stunned + rounds : rounds;
    try{ target._justStunned = true; }catch(e){}
    target.effects = target.effects || [];
    const s = target.effects.find(e=>e.id === 'stunned');
    if(s) s.rounds = target.stunned;
    else target.effects.push({ id: 'stunned', name: 'Stunned', rounds: target.stunned });
  }

  function finishBattle(){
    if(state.turn === 'finished') return;
    state.turn = 'finished';
    $restart.classList.remove('hidden');
    log('Battle ended.');
    const controls = document.querySelector('.controls');
    if(controls) controls.style.justifyContent = 'center';
    if($back) $back.style.marginRight = '24px';
    if($home) $home.style.margin = '0';
    if($restart) $restart.style.marginLeft = '24px';
    try{
      if(state.player && state.enemy && state.player.hp > 0 && state.enemy.hp <= 0){
        try{ if(state._winPopupTimeoutId) clearTimeout(state._winPopupTimeoutId); }catch(e){}
        try{ if(state.enemy && state.enemy.isBoss && state.enemy.id){ markBossDefeated(state.enemy.id); updateBossPanelUI(); } }catch(e){}
        state._winPopupTimeoutId = setTimeout(()=>{ try{ state._winPopupTimeoutId = null; showWinPopup(); }catch(e){} }, 1200);
      }
    }catch(e){ console.error(e); }
  }

  function showWinPopup(){
    try{ if(state._winPopupTimeoutId){ clearTimeout(state._winPopupTimeoutId); state._winPopupTimeoutId = null; } }catch(e){}
    if(document.getElementById('win-overlay')) return;
    const overlay = document.createElement('div'); overlay.className = 'modal-overlay'; overlay.id = 'win-overlay';
    const popup = document.createElement('div'); popup.className = 'win-popup';
    const img = document.createElement('img'); img.alt = 'Won';
    img.src = 'Images/won.gif';
    const closeBtn = document.createElement('button'); closeBtn.className = 'close-btn'; closeBtn.innerHTML = 'Close';
    popup.appendChild(img);
    popup.appendChild(closeBtn);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    function removePopup(){
      try{ popup.classList.add('closing'); overlay.classList.add('closing'); }catch(e){}
      const onAnimEnd = function(){
        try{ document.body.removeChild(overlay); }catch(e){}
        try{ document.removeEventListener('keydown', onKey); }catch(e){}
        popup.removeEventListener('animationend', onAnimEnd);
      };
      popup.addEventListener('animationend', onAnimEnd);
    }
    function onKey(ev){ if(ev.key === 'Escape'){ ev.stopPropagation(); removePopup(); } }

    overlay.addEventListener('click', (ev)=>{ if(ev.target === overlay) removePopup(); });
    closeBtn.addEventListener('click', ()=> removePopup());
    document.addEventListener('keydown', onKey);
  }

  function applyCharged(actorKey){
    const actor = state[actorKey];
    if(!actor) return;
    if(actor.dead) return;
    if(actor.charged){
      if(typeof actor.charged.rounds === 'number' && actor.charged.rounds > 1){
        actor.charged.rounds -= 1;
        return;
      }
      if(actor.stunned && actor.stunned > 0){
        log(`${actor.name}'s charged action was interrupted by stun.`);
        actor.charged = null;
        return;
      }
      const {type} = actor.charged;
      let amount = actor.charged.value || 0;
      if(type === 'attack'){
        const targetKey = actorKey === 'player' ? 'enemy' : 'player';
        animateSprite(actorKey, 'attack', 'big');
        if(actor.bolster){ amount += 50; actor.bolster = false; }
        playSound('chargeAttack');
        applyDamage(actorKey, targetKey, amount, 'charged attack');
      } else if(type === 'heal'){
        animateSprite(actorKey, 'heal', 'big');
        if(actor.bolster){ amount += 40; actor.bolster = false; }
        actor.hp += amount; if(actor.hp>actor.maxHp) actor.hp = actor.maxHp;
        log(`${actor.name} received a charged heal of ${amount}.`);
        if(actorKey==='player') flashHeal($playerHpFill); else flashHeal($enemyHpFill);
        playSound('chargeHeal');
        updateUI();
      }
      else if(type === 'toxin'){
        const targetKey = actorKey === 'player' ? 'enemy' : 'player';
        let exec = Math.round(275 + randInt(0,25));
        let rot = 25;
        if(actor.bolster){ exec = Math.round(exec * 1.15); rot = 40; actor.bolster = false; }
        animateSprite(actorKey, 'attack', 'big');
        playSound('attack');
        const applied = applyDamage(actorKey, targetKey, exec, 'toxin-execute');
        const target = state[targetKey];
        if(target && target.hp > 0){ target.effects = target.effects || []; target.effects.push({ id: 'rot', name: 'Rot', rounds: 8, value: rot, source: actorKey }); }
        log({ text: `${actor.name}'s Toxin burst for ${applied} damage and afflicted ${target? target.name : ''} with Rot.`, abilityId: 'toxin' });
        if(targetKey === 'player') flashShake('large', $playerHpFill); else flashShake('large', $enemyHpFill);
      }
      actor.charged = null;
    }
    }

  function animateSprite(actorKey, type, size='small'){
    const selector = actorKey === 'player' ? '.combatant.player .sprite' : '.combatant.enemy .sprite';
    const el = document.querySelector(selector);
    if(!el) return;
    let cls = '';
    if(type === 'attack'){
      cls = size === 'big' ? 'attack-bounce-big' : 'attack-bounce';
    } else if(type === 'heal'){
      if(size === 'big') cls = 'heal-bounce-big';
      else if(size === 'small') cls = 'heal-bounce-small';
      else cls = 'heal-bounce';
    } else if(type === 'dot'){
      if(size === 'big') cls = 'dot-hit-big';
      else if(size === 'small') cls = 'dot-hit-small';
      else cls = 'dot-hit';
    } else if(type === 'switch'){
      cls = 'switch-bounce';
    } else if(type === 'team-attack'){
      cls = (actorKey === 'player') ? (size === 'big' ? 'team-attack-right-big' : 'team-attack-right') : (size === 'big' ? 'team-attack-left-big' : 'team-attack-left');
    } else if(type === 'team-heal'){
      cls = size === 'big' ? 'team-heal-up-big' : 'team-heal-up';
    }
    if(!cls) return;
    el.classList.add(cls);
    setTimeout(()=> el.classList.remove(cls), 600);
  }

  function randInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

  function applyDamage(fromKey, toKey, rawAmount, label){
    const atk = state[fromKey];
    const def = state[toKey];
    let dmg = Math.round(rawAmount);
    if(atk && Array.isArray(atk.effects)){
      const curseAtt = atk.effects.find(e=>e.id === 'curse');
      if(curseAtt && typeof curseAtt.value === 'number'){
        const factor = Math.max(0, 1 - curseAtt.value);
        dmg = Math.round(dmg * factor);
      }
    }

    if(def.defend){
      const strength = (typeof def.defend === 'number') ? def.defend : 1;
      if(strength >= 2) dmg = Math.round(dmg * 0.25);
      else dmg = Math.round(dmg * 0.5);
      consumeDefend(def);
    }
    if(def && Array.isArray(def.effects)){
      const bubble = def.effects.find(e=>e.id === 'bubble');
      if(bubble && typeof bubble.value === 'number') dmg -= bubble.value;
    }
    if(def && Array.isArray(def.effects)){
      const curseDef = def.effects.find(e=>e.id === 'curse');
      if(curseDef && typeof curseDef.value === 'number'){
        dmg = Math.round(dmg * (1 + curseDef.value));
      }
    }
    dmg = Math.max(0, dmg);
    def.hp -= dmg;
    try{
      if(def && Array.isArray(def.effects) && !(label && /vines-reflect/i.test(label))){
        const vine = def.effects.find(e=>e.id === 'vines');
        if(vine && dmg > 0){
          const pct = (typeof vine.value === 'number') ? vine.value : 0.3;
          const ret = Math.round(dmg * pct);
          if(ret > 0 && state && state[fromKey]){
            applyDamage(toKey, fromKey, ret, 'vines-reflect-suppress');
            log(`${def.name}'s Vines returned ${ret} damage to ${atk.name}.`);
            playSound('defend');
          }
        }
      }
    }catch(e){}
    if(!(label && (/charged/i.test(label) || /no-attack-sound/i.test(label)))){ playSound('attack'); }
    if(!(label && /suppress/i.test(label))){
      log(`${atk.name} dealt ${dmg} damage to ${def.name}.`);
    }
    if(def.hp<=0){
      def.hp = 0;
      if(!def.dead){
        def.dead = true;
        log(`${def.name} was brutally murdered!`);
        playSound('murder');
        try{ if(def.isBoss){ const es = document.getElementById('enemy-sprite'); if(es) es.src = (def.sickImage || es.src); } }catch(e){}
        const playerTeam = state.playerTeam || [];
        const enemyTeam = state.enemyTeam || [];
        const isPlayerPet = playerTeam.includes(def);
        const isEnemyPet = enemyTeam.includes(def);
        if(isPlayerPet){
          if(state.player === def){
            const next = playerTeam.find(p=>!p.dead && p !== def);
            if(next){
              const idx = playerTeam.indexOf(next);
              const picked = playerTeam.splice(idx,1)[0];
              playerTeam.unshift(picked);
              state.player = playerTeam[0];
              log(`${state.player.name} will avenge them!`);
            } else {
              finishBattle();
              updateUI();
              return dmg;
            }
          }
        } else if(isEnemyPet){
              if(state.enemy === def){
              const next = enemyTeam.find(p=>!p.dead && p !== def);
              if(next){
                const idx = enemyTeam.indexOf(next);
                const picked = enemyTeam.splice(idx,1)[0];
                enemyTeam.unshift(picked);
                state.enemy = enemyTeam[0];
                log(`${state.enemy.name} will avenge them!`);
                try{ updateBattleSprites(); }catch(e){}
                try{ animateSprite('enemy','switch','big'); }catch(e){}
                try{ playSound('switch'); }catch(e){}
              } else {
                state.enemy = def;
                finishBattle();
                updateUI();
                return dmg;
              }
          }
        } else {
          finishBattle();
        }
      }
    }
    updateUI();
    try{ updateBattleSprites(); }catch(e){}
    if(toKey === 'player') flashHit($playerHpFill); else flashHit($enemyHpFill);
    return dmg;
  }

  function dealDamage(fromKey, toKey, base, label){
    const atk = state[fromKey];
    const raw = Math.round(base * (atk.power/50));
    applyDamage(fromKey, toKey, raw, label);
  }

  function flashHit($fill){
  if(!$fill) return;
  const inner = $fill.querySelector('.fill-inner');
  if(!inner) return;
  inner.classList.remove('heal');
  inner.classList.add('hit');
  setTimeout(()=> inner.classList.remove('hit'), 520);
  const combatant = $fill.id.includes('player') ? document.querySelector('.combatant.player .sprite') : document.querySelector('.combatant.enemy .sprite');
    if(combatant){
      combatant.classList.add('shake');
      setTimeout(()=> combatant.classList.remove('shake'), 420);
    }
  }
  function flashHeal($fill){
  if(!$fill) return;
  const inner = $fill.querySelector('.fill-inner');
  if(!inner) return;
  inner.classList.remove('hit');
  inner.classList.add('heal');
  setTimeout(()=> inner.classList.remove('heal'), 700);
  }

  function flashShake(size, $fill){
    if(!$fill) return;
    const combatant = $fill.id && $fill.id.includes('player') ? document.querySelector('.combatant.player .sprite') : document.querySelector('.combatant.enemy .sprite');
    if(!combatant) return;
    const cls = size === 'large' ? 'shake-large' : (size === 'small' ? 'shake-small' : 'shake-medium');
    combatant.classList.add(cls);
    setTimeout(()=> combatant.classList.remove(cls), (size === 'large' ? 700 : 420));
  }

  function playerUseAbility(id){
    if(state.turn !== 'player') return;
    const actor = state.player;
    const targetKey = 'enemy';
    if((actor.stunned && actor.stunned > 0) && id !== 'pass'){
      log(`${actor.name} is stunned and can only Pass.`);
      return;
    }
    $actions.classList.add('disabled');
    const ability = ABILITIES.find(a=>a.id===id);
    log(`${actor.name} prepares ${ability? ability.name : id}...`);
    setTimeout(()=>{
      switch(id){
        case 'attack': {
          animateSprite('player','attack');
          let atkAmount = (actor.power || 0) * 12 + randInt(0,9);
          if(actor.bolster){ atkAmount += 30; actor.bolster = false; }
          applyDamage('player','enemy', atkAmount, 'attacks,');
        } break;
        case 'toxin': {
          animateSprite('player','attack');
          const target = (state.enemyTeam && state.enemyTeam.length) ? state.enemyTeam[0] : state.enemy;
          if(target){
            target.effects = target.effects || [];
            target.effects.push({ id: 'toxin', name: 'toxin', rounds: 3, sourceKey: 'player', bolstered: !!actor.bolster });
          }
          actor.cooldowns['toxin'] = 11;
          if(actor.bolster) actor.bolster = false;
          log(`${actor.name} injects a delayed toxin (3 rounds).`);
          playSound('curse');
        } break;
        case 'heal': {
          animateSprite('player','heal','medium');
          let amount = Math.round((actor.healing || 0) * 25 + randInt(0,9));
          if(actor.bolster){ amount += 30; actor.bolster = false; }
          const curse = (actor.effects||[]).find(e=>e.id==='curse');
          if(curse && typeof curse.value === 'number') amount = Math.round(amount * (1 - curse.value));
          actor.hp += amount; if(actor.hp>actor.maxHp) actor.hp=actor.maxHp; log(`${actor.name} healed ${amount} HP.`);
          actor.cooldowns['heal'] = 2;
          playSound('heal');
        } break;
          
        case 'defend': { 
          animateSprite('player','heal','medium');
          actor.defend = 1;
          if(actor.bolster){ actor.defend = 2; actor.bolster = false; 
            actor.effects = actor.effects || []; if(!actor.effects.find(e=>e.id==='bolstered')) actor.effects.push({ id: 'bolstered', name: 'Bolstered', rounds: 2 }); }
          actor.effects = actor.effects || [];
          const existing = actor.effects.find(e=>e.id === 'defended');
          if(existing) existing.rounds = Math.max(existing.rounds, actor.defend);
          else actor.effects.push({ id: 'defended', name: 'Defended', rounds: actor.defend });
          log(`${actor.name} braced for incoming damage.`);
          playSound('defend');
          actor.cooldowns['defend'] = 2;
        } break;
        case 'dot': {
          animateSprite('player','attack');
          let value = Math.round((actor.power || 0) * 8 + randInt(0,9));
          if(actor.bolster){ value += 20; actor.bolster = false; }
          state.enemy.effects.push({id:'dot',name:'Bleed',rounds:3,value, source: actor.id || 'player'}); log(`${actor.name} lashes out (${value}/round).`);
          actor.cooldowns['dot'] = 2;
        } break;
        case 'hot': {
          animateSprite('player','heal','small');
          let value = Math.round((actor.healing || 0) * 12 + randInt(0,9));
          if(actor.bolster){ value += 18; actor.bolster = false; }
          const curse = (actor.effects||[]).find(e=>e.id==='curse');
          if(curse && typeof curse.value === 'number') value = Math.round(value * (1 - curse.value));
          actor.effects.push({id:'hot',name:'Regen',rounds:3,value}); log(`${actor.name} applied Regenerate (${value}/round).`);
          playSound('regenerate');
          actor.cooldowns['hot'] = 2;
        } break;
        case 'charge-attack': {
          const value = Math.round((actor.power || 0) * 32 + randInt(0,15));
          actor.charged = {type:'attack',id:'charge-attack',value, rounds: 1};
          log(`${actor.name} begins charging an attack.`);
          actor.cooldowns['charge-attack'] = Math.max(actor.cooldowns['charge-attack'] || 0, 3);
          updateUI(); renderActions();
        } break;
        case 'bubble': {
          animateSprite('player','heal','medium');
          const rounds = 3;
          let value = 20;
          if(actor.bolster){ value += 15; actor.bolster = false; }
          actor.effects = actor.effects || [];
          actor.effects.push({ id: 'bubble', name: 'Bubble', rounds, value });
          actor.cooldowns['bubble'] = 5;
          log({ text: `${actor.name} reduces damage taken (${rounds} rounds).`, abilityId: 'bubble' });
          playSound('defend');
        } break;
        case 'vines': {
          animateSprite('player','heal','medium');
          const rounds = 4;
          let value = 0.3;
          if(actor.bolster){ value = 0.5; actor.bolster = false; }
          actor.effects = actor.effects || [];
          actor.effects.push({ id: 'vines', name: 'Vines', rounds, value });
          actor.cooldowns['vines'] = 7;
          log({ text: `${actor.name}'s vines return a portion of damage taken. (${rounds} rounds).`, abilityId: 'vines' });
          playSound('defend');
        } break;
        case 'scorch': {
          animateSprite('player','attack');
          const rounds = 3;
          const value = 50;
          const target = state.enemy;
          if(actor.bolster){
            target.effects = target.effects || [];
            target.effects.push({ id: 'scorch', name: 'Scorch', rounds: rounds + 2, value, source: actor.id || 'player' });
          } else {
            target.effects = target.effects || [];
            target.effects.push({ id: 'scorch', name: 'Scorch', rounds, value, source: actor.id || 'player' });
          }
          actor.cooldowns['scorch'] = 5;
          log({ text: `${actor.name} scorches ${target.name}.`, abilityId: 'scorch' });
          playSound('attack');
        } break;
        case 'shatter': {
          animateSprite('player','attack');
          let dmg = 120;
          let self = 30;
          if(actor.bolster){ dmg = 150; self = 40; actor.bolster = false; }
          const applied = applyDamage('player','enemy', dmg, 'shatter-suppress');
          actor.hp -= self; if(actor.hp < 0) actor.hp = 0;
          actor.cooldowns['shatter'] = 4;
          log({ text: `${actor.name} struck ${state.enemy.name} for ${applied} damage and takes ${self}.`, abilityId: 'shatter' });
          playSound('chargeAttack');
        } break;
        case 'hurricane': {
          animateSprite('player','attack');
          const rounds = 3;
          const value = 50;
          const rawTargets = state.enemyTeam && state.enemyTeam.length ? state.enemyTeam : [state.enemy];
          const targets = (rawTargets || []).filter(t => t && !t.dead && t.hp > 0);
          targets.forEach(t => {
            t.effects = t.effects || [];
            if(actor.bolster) t.effects.push({ id: 'hurricane', name: 'Hurricane', rounds: rounds + 2, value, source: actor.id || 'player' });
            else t.effects.push({ id: 'hurricane', name: 'Hurricane', rounds, value, source: actor.id || 'player' });
          });
          actor.cooldowns['hurricane'] = 7;
          if(actor.bolster) actor.bolster = false;
          if(targets.length){ log({ text: `${actor.name} struck ${targets.map(x=>x.name).join(', ')} for ${value} damage.`, abilityId: 'hurricane' }); playSound('attack'); }
        } break;
        case 'beam': {
          animateSprite('player','attack');
          let base = Math.round((actor.power || 0) * 32 + randInt(0,15));
          if(actor.bolster){ base += 50; actor.bolster = false; }
          const dealt = applyDamage('player','enemy', base, 'beam-suppress');
          const targetName = state.enemy ? state.enemy.name : 'opponent';
          log({ text: `${actor.name} beams ${targetName} for ${dealt}.`, abilityId: 'beam' });
          if(dealt > 0 && actor && actor.hp > 0){
            animateSprite('player','heal','small');
            actor.hp += dealt; if(actor.hp > actor.maxHp) actor.hp = actor.maxHp;
            playSound('attack');
            playSound('heal');
            log({ text: `${actor.name} restores ${dealt} HP.`, abilityId: 'heal' });
          }
          actor.cooldowns['beam'] = 4;
        } break;
        case 'curse': {
          animateSprite('player','attack');
          const rounds = 3;
          let value = 0.15;
          if(actor.bolster){ value = 0.25; actor.bolster = false; }
          const target = state.enemy;
          target.effects = target.effects || [];
          target.effects.push({ id: 'curse', name: 'Curse', rounds, value });
          actor.cooldowns['curse'] = 5;
          log({ text: `${actor.name} weakens ${target.name} (${rounds} rounds).`, abilityId: 'curse' });
        } break;
        case 'charge-heal': {
          const value = Math.round((actor.healing || 0) * 70 + randInt(0,15));
          actor.charged = {type:'heal',id:'charge-heal',value, rounds: 1};
          log(`${actor.name} is charging a heal.`);
          actor.cooldowns['charge-heal'] = Math.max(actor.cooldowns['charge-heal'] || 0, 4);
          updateUI(); renderActions();
        } break;
        case 'stun': {
          animateSprite('player','attack');
          applyStunTo(state.enemy, 1);
          if(actor.bolster){ applyStunTo(state.enemy, 1); actor.bolster = false; }
          actor.cooldowns['stun'] = 5; 
          log(`${actor.name} stunned ${state.enemy.name}!`);
          playSound('stun');
        } break;
        case 'bolster': {
          animateSprite('player','heal','medium');
          actor.bolster = true;
          actor.effects = actor.effects || [];
          if(!actor.effects.find(e=>e.id==='bolstered')) actor.effects.push({ id: 'bolstered', name: 'Bolstered', rounds: 2 });
          log(`${actor.name} bolstered their next ability.`);
          playSound('bolster');
          actor.cooldowns['bolster'] = 4;
        } break;
        case 'team-heal': {
          animateSprite('player','team-heal','big');
          const team = state.playerTeam && state.playerTeam.length ? state.playerTeam : [state.player];
          const boost = actor.bolster ? 30 : 0;
          const alive = (team || []).filter(p => p && !p.dead && p.hp > 0);
          alive.forEach(p=>{
            let amount = Math.round((actor.healing || 0) * 15 + randInt(0,9));
            if(boost) amount += boost;
            const curse = (actor.effects||[]).find(e=>e.id==='curse');
            if(curse && typeof curse.value === 'number') amount = Math.round(amount * (1 - curse.value));
            p.hp += amount; if(p.hp>p.maxHp) p.hp = p.maxHp;
            log(`${actor.name} healed ${p.name} for ${amount} HP.`);
          });
          if(actor.bolster) actor.bolster = false;
          actor.cooldowns['team-heal'] = 2;
          playSound('heal');
        } break;
        case 'team-attack': {
          animateSprite('player','team-attack','big');
          const enemies = state.enemyTeam && state.enemyTeam.length ? state.enemyTeam : [state.enemy];
          const boostAtk = actor.bolster ? 30 : 0;
          enemies.forEach(en=>{
            if(!en || en.dead || en.hp <= 0) return;
            let baseDmg = Math.round((actor.power || 0) * 12 + randInt(0,9));
            if(boostAtk) baseDmg += boostAtk;
            let actual = baseDmg;
            if(actor && Array.isArray(actor.effects)){
              const curse = actor.effects.find(e=>e.id === 'curse');
              if(curse && typeof curse.value === 'number'){
                const factor = Math.max(0, 1 - curse.value);
                actual = Math.round(actual * factor);
              }
            }
            if(en.defend){
              const strength = (typeof en.defend === 'number') ? en.defend : 1;
              actual = Math.round(strength >= 2 ? actual * 0.25 : actual * 0.5);
              en.defend = false;
            }
            if(en && Array.isArray(en.effects)){
              const bubble = en.effects.find(e=>e.id === 'bubble');
              if(bubble && typeof bubble.value === 'number') actual -= bubble.value;
            }
            if(actual < 0) actual = 0;
            en.hp -= actual;
            log(`${actor.name} struck ${en.name} for ${actual} damage.`);
            try{ triggerVinesReflect(en, actor, actual); }catch(e){}
            if(en.hp<=0) en.hp = 0;
          });
          if(actor.bolster) actor.bolster = false;
          actor.cooldowns['team-attack'] = 2;
          playSound('attack');
          const enemyTeam = state.enemyTeam || [];
          if(enemyTeam.length){
            enemyTeam.forEach((en, idx)=>{
              if(en.hp <= 0 && !en.dead){
                en.dead = true;
                log(`${en.name} was brutally murdered!`);
                playSound('murder');
                try{ if(en.isBoss){ const es = document.getElementById('enemy-sprite'); if(es) es.src = (en.sickImage || es.src); } }catch(e){}
                if(state.enemy === en){
                  const next = enemyTeam.find(p=>!p.dead && p !== en);
                  if(next){ const i = enemyTeam.indexOf(next); const picked = enemyTeam.splice(i,1)[0]; enemyTeam.unshift(picked); state.enemy = enemyTeam[0]; log(`${state.enemy.name} will avenge them!`); }
                }
              }
            });
            const anyAlive = enemyTeam.some(p=>!p.dead && p.hp>0);
            if(!anyAlive){ finishBattle(); }
          } else {
            if(state.enemy && state.enemy.hp <= 0) finishBattle();
          }
        } break;
        
        case 'intervene': {
          const team = state.playerTeam || [];
          if(team.length <= 1){
            log('No one is coming to save you.');
          } else {
            let attempts = 0;
            while(attempts < team.length){
              team.push(team.shift());
              attempts++;
              if(!team[0].dead) break;
            }
            if(team[0] && !team[0].dead && (typeof team[0].hp !== 'number' || team[0].hp > 0)){
              state.player = team[0];
              state.player.defend = 2;
              state.player.bolster = true;
              state.player.effects = state.player.effects || [];
              const existingDef = state.player.effects.find(e=>e.id === 'defended');
              if(existingDef) existingDef.rounds = Math.max(existingDef.rounds, state.player.defend);
              else state.player.effects.push({ id: 'defended', name: 'Defended', rounds: state.player.defend });
              if(!state.player.effects.find(e=>e.id === 'bolstered')) state.player.effects.push({ id: 'bolstered', name: 'Bolstered', rounds: 1 });
              log(`${actor.name} intervened, ${state.player.name} enters with a vengeance!`);
              actor.cooldowns['intervene'] = 4;
              try{ updateBattleSprites(); }catch(e){}
              animateSprite('player','switch','big');
              playSound('bolster');
              playSound('switch');
            } else {
              log('No one is coming to save you.');
            }
          }
        } break;
        case 'switch': {
          try{
            const team = Array.isArray(state.playerTeam) && state.playerTeam.length ? state.playerTeam : (state.player ? [state.player] : []);
            const aliveOthers = (team || []).filter(p => p && p !== state.player && !p.dead && p.hp > 0).length;
            if(aliveOthers === 0){
              log('No alive ally to switch to.');
            } else {
              let attempts = 0;
              do {
                team.push(team.shift());
                attempts++;
              } while(team[0] && (team[0].dead || (typeof team[0].hp === 'number' && team[0].hp <= 0)) && attempts < team.length);
              if(team[0] === state.player){
                log('No alive ally to switch to.');
              } else if(team[0] && !team[0].dead){
                state.player = team[0];
                try{ updateBattleSprites(); }catch(e){}
                animateSprite('player','switch','big');
                playSound('switch');
                log(`${actor.name} switched out. ${state.player.name} is now active.`);
              } else {
                log('No alive ally to switch to.');
              }
            }
          }catch(e){ log('No ally to switch to.'); }
        } break;
        case 'pass': {
          log(`${actor.name} passed the turn.`); 
          playSound('pass');
        } break;
      }
      if(id === 'heal') actor.cooldowns['heal'] = 2;
      updateUI();
      try{ updateBattleSprites(); }catch(e){}
      console.log('playerUseAbility -> executed -> scheduling endTurn from player');
      setTimeout(()=> endTurn('player'), 750);
    }, 1000);
  }

  function enemyAct(){
    const actor = state.enemy;
    const abilPool = (actor && actor.selectedAbilities) || state.enemyAbilities || [];
    const avail = abilPool.filter(id=>!(actor.cooldowns && actor.cooldowns[id]));
    const filteredAvail = avail.filter(i=> i !== 'intervene');
  const typeMap = { Fluid: 'bubble', Flame: 'scorch', Stone: 'shatter', Storm: 'hurricane', Gleam: 'beam', Gloom: 'curse', Blight: 'toxin', Bloom: 'vines' };
    const typeSpecialIds = ['bubble','scorch','shatter','hurricane','beam','curse','toxin','vines'];
    const finalAvail = filteredAvail.filter(aid => {
      if(typeSpecialIds.includes(aid)){
        if(actor && actor.isBoss) return aid !== 'beam';
        const mapped = actor && actor.type ? typeMap[actor.type] : null;
        return mapped === aid;
      }
      return true;
    });
    let id = null;
    if(actor && actor.isBoss && actor.name === 'Rosie' && finalAvail.includes('scratch') && !(actor.cooldowns && actor.cooldowns['scratch'])){
      id = 'scratch';
    } else if(finalAvail.length) id = finalAvail[Math.floor(Math.random()*finalAvail.length)];
    else {
      const nonType = filteredAvail.filter(aid=> !typeSpecialIds.includes(aid));
      id = nonType.length ? nonType[Math.floor(Math.random()*nonType.length)] : 'attack';
    }
    const ability = ABILITIES.find(a=>a.id===id);
    log(`${actor.name} prepares ${ability? ability.name : id}...`);
    setTimeout(()=>{
      switch(id){
        case 'attack': {
          animateSprite('enemy','attack');
          let enemyAtk = (actor.power || 0) * 12 + randInt(0,9);
          if(actor.bolster){ enemyAtk += 30; actor.bolster = false; }
          applyDamage('enemy','player', enemyAtk, 'attacks,');
        } break;
        case 'scratch': {
          animateSprite('enemy','attack');
          let enemyAtk = (actor.power || 0) * 12 + randInt(0,9);
          if(actor.bolster){ enemyAtk += 30; actor.bolster = false; }
          const applied = applyDamage('enemy','player', enemyAtk, 'scratch-no-attack-sound');
          const target = state.player;
          if(target && target.hp > 0){ target.effects = target.effects || []; target.effects.push({ id: 'poison', name: 'Poison', rounds: 2, value: 30, source: actor.id || 'enemy' }); log({ text: `${actor.name} inflicted Poison on ${target.name}.`, abilityId: 'scratch' }); }
          actor.cooldowns['scratch'] = 4;
          playSound('meow');
        } break;
        case 'heal': {
          let amount = Math.round((actor.healing || 0) * 20 + randInt(0,9));
          if(actor.bolster){ amount += 30; actor.bolster = false; }
          const curse = (actor.effects||[]).find(e=>e.id==='curse');
          if(curse && typeof curse.value === 'number') amount = Math.round(amount * (1 - curse.value));
          actor.hp += amount; if(actor.hp>actor.maxHp) actor.hp=actor.maxHp; log(`${actor.name} healed ${amount} HP.`);
          playSound('heal');
          actor.cooldowns['heal'] = 3;
        } break;
        case 'defend':{ 
          actor.defend = 2;
          if(actor.bolster){ actor.defend = 3; actor.bolster = false; 
            actor.effects = actor.effects || []; if(!actor.effects.find(e=>e.id==='bolstered')) actor.effects.push({ id: 'bolstered', name: 'Bolstered', rounds: 1 }); }
          actor.effects = actor.effects || [];
          const existing = actor.effects.find(e=>e.id === 'defended');
          if(existing) existing.rounds = Math.max(existing.rounds, actor.defend);
          else actor.effects.push({ id: 'defended', name: 'Defended', rounds: actor.defend });
          log(`${actor.name} braced for incoming damage.`);
          playSound('defend');
          actor.cooldowns['defend'] = 2;
          if(actor.isBoss) actor.cooldowns['defend'] += 3;
        } break;
        case 'dot': {
          animateSprite('enemy','attack');
          let value = Math.round((actor.power || 0) * 5 + randInt(0,5));
          if(actor.bolster){ value += 20; actor.bolster = false; }
          state.player.effects.push({id:'dot',name:'Bleed',rounds:3,value, source: actor.id || 'enemy'}); log(`${actor.name} lashes out (${value}/round).`);
          actor.cooldowns['dot'] = 1;
        } break;
        case 'decay': {
          animateSprite('player','dot','small');
          const rounds = 99;
          const value = 7;
          const target = state.player;
          target.effects = target.effects || [];
          const existing = target.effects.find(e=>e.id === 'decay');
          if(existing){ existing.stacks = (existing.stacks || 1) + 1; existing.rounds = rounds; existing.source = 'enemy'; existing.value = value; }
          else target.effects.push({ id: 'decay', name: 'Decay', rounds, value, stacks: 1, source: actor.id || 'enemy' });
          log({ text: `${actor.name} released a miasma of Decay${existing ? ' ['+existing.stacks+']' : ''} (${rounds} rounds).`, abilityId: 'decay' });
        } break;
        case 'hot': {
          animateSprite('enemy','heal','small');
          let value = Math.round((actor.healing || 0) * 15 + randInt(0,5));
          if(actor.bolster){ value += 10; actor.bolster = false; }
          const curse = (actor.effects||[]).find(e=>e.id==='curse');
          if(curse && typeof curse.value === 'number') value = Math.round(value * (1 - curse.value));
          actor.effects.push({id:'hot',name:'Regen',rounds:3,value}); log(`${actor.name} applied Regenerate (${value}/round).`);
          playSound('regenerate');
          actor.cooldowns['hot'] = 2;
        } break;
        case 'charge-attack': {
          const value = Math.round((actor.power || 0) * 22 + randInt(0,9));
          actor.charged = {type:'attack',id:'charge-attack',value, rounds: 1}; log(`${actor.name} begins charging an attack.`);
          actor.cooldowns['charge-attack'] = Math.max(actor.cooldowns['charge-attack'] || 0, 4);
          updateUI(); renderActions();
        } break;
        case 'charge-heal': {
          const value = Math.round((actor.healing || 0) * 50 + randInt(0,9));
          actor.charged = {type:'heal',id:'charge-heal',value, rounds: 2}; log(`${actor.name} is charging a heal.`);
          actor.cooldowns['charge-heal'] = Math.max(actor.cooldowns['charge-heal'] || 0, 4);
          updateUI(); renderActions();
        } break;
        case 'stun': {
          applyStunTo(state.player, 2);
          if(actor.bolster){ applyStunTo(state.player, 1); actor.bolster = false; }
          actor.cooldowns['stun'] = 4;
          if(actor.isBoss) actor.cooldowns['stun'] += 3;
          log(`${actor.name} stunned ${state.player.name}!`); playSound('stun');
        } break;
        case 'bolster': {
          actor.bolster = true;
          log(`${actor.name} bolstered their next ability.`);
          playSound('bolster');
          actor.cooldowns['bolster'] = 4;
          if(actor.isBoss) actor.cooldowns['bolster'] += 3;
        } break;
        case 'team-attack': {
          const rawTargets = state.playerTeam && state.playerTeam.length ? state.playerTeam : [state.player];
          const targets = (rawTargets || []).filter(t => t && !t.dead && t.hp > 0);
          const boostAtk = actor.bolster ? 30 : 0;
          animateSprite('enemy','team-attack','big');
          targets.forEach(t=>{
            let baseDmg = Math.round((actor.power || 0) * 6 + randInt(0,5));
            if(boostAtk) baseDmg += boostAtk;
            let actual = baseDmg;
            if(actor && Array.isArray(actor.effects)){
              const curse = actor.effects.find(e=>e.id === 'curse');
              if(curse && typeof curse.value === 'number'){
                const factor = Math.max(0, 1 - curse.value);
                actual = Math.round(actual * factor);
              }
            }
            if(t.defend){
              const strength = (typeof t.defend === 'number') ? t.defend : 1;
              actual = Math.round(strength >= 2 ? actual * 0.25 : actual * 0.5);
              t.defend = false;
            }
            if(t && Array.isArray(t.effects)){
              const bubble = t.effects.find(e=>e.id === 'bubble');
              if(bubble && typeof bubble.value === 'number') actual -= bubble.value;
            }
            if(actual < 0) actual = 0;
            t.hp -= actual;
            log(`${actor.name} struck ${t.name} for ${actual} damage.`);
            try{ triggerVinesReflect(t, actor, actual); }catch(e){}
            if(t.hp<=0) t.hp = 0;
          });
          if(actor.bolster) actor.bolster = false;
          actor.cooldowns['team-attack'] = 2;
          playSound('attack');
          const playerTeam = state.playerTeam || [];
          if(playerTeam.length){
            playerTeam.forEach((p, idx)=>{
              if(p.hp <= 0 && !p.dead){ p.dead = true; log(`${p.name} was brutally murdered!`); playSound('murder'); if(state.player === p){ const next = playerTeam.find(x=>!x.dead && x !== p); if(next){ const i = playerTeam.indexOf(next); const picked = playerTeam.splice(i,1)[0]; playerTeam.unshift(picked); state.player = playerTeam[0]; log(`${state.player.name} will avenge them!`); } } }
            });
            const anyAlive = playerTeam.some(p=>!p.dead && p.hp>0);
            if(!anyAlive) finishBattle();
          } else {
            if(state.player && state.player.hp <= 0) finishBattle();
          }
        } break;
        case 'team-heal': {
          const team = state.enemyTeam && state.enemyTeam.length ? state.enemyTeam : [state.enemy];
          const boost = actor.bolster ? 30 : 0;
          animateSprite('enemy','team-heal','big');
          const alive = (team || []).filter(p => p && !p.dead && p.hp > 0);
          alive.forEach(p=>{
            let amount = Math.round((actor.healing || 0) * 12 + randInt(0,9));
            if(boost) amount += boost;
            p.hp += amount; if(p.hp>p.maxHp) p.hp = p.maxHp;
            log(`${actor.name} healed ${p.name} for ${amount} HP.`);
          });
          if(actor.bolster) actor.bolster = false;
          actor.cooldowns['team-heal'] = 2;
          playSound('heal');
        } break;
        case 'bubble': {
          const rounds = 3;
          let value = 15;
          if(actor.bolster){ value += 10; actor.bolster = false; }
          actor.effects = actor.effects || [];
          actor.effects.push({ id: 'bubble', name: 'Bubble', rounds, value });
          actor.cooldowns['bubble'] = 5;
          playSound('defend');
          log({ text: `${actor.name} reduces damage taken (${rounds} rounds).`, abilityId: 'bubble' });
        } break;
        case 'scorch': {
          const rounds = 3;
          const value = 50;
          const target = state.player;
          target.effects = target.effects || [];
          if(actor.bolster) target.effects.push({ id: 'scorch', name: 'Scorch', rounds: rounds + 2, value, source: actor.id || 'enemy' });
          else target.effects.push({ id: 'scorch', name: 'Scorch', rounds, value, source: actor.id || 'enemy' });
          actor.cooldowns['scorch'] = 5;
          if(actor.bolster) actor.bolster = false;
          log({ text: `${actor.name} scorches ${target.name}. (${rounds} rounds).`, abilityId: 'scorch' });
          playSound('curse');
        } break;
        case 'shatter': {
          let dmg = 100;
          let self = 30;
          if(actor.bolster){ dmg = 150; self = 45; actor.bolster = false; }
          const applied = applyDamage('enemy','player', dmg, 'shatter-suppress');
          actor.hp -= self; if(actor.hp < 0) actor.hp = 0;
          actor.cooldowns['shatter'] = 4;
          log({ text: `${actor.name} struck ${state.player.name} for ${applied} damage and takes ${self}.`, abilityId: 'shatter' });
          playSound('chargeAttack');
        } break;
        case 'hurricane': {
          const rounds = 3;
          const value = 50;
          const rawTargets = state.playerTeam && state.playerTeam.length ? state.playerTeam : [state.player];
          const targets = (rawTargets || []).filter(t => t && !t.dead && t.hp > 0);
          targets.forEach(t => {
            t.effects = t.effects || [];
            if(actor.bolster) t.effects.push({ id: 'hurricane', name: 'Hurricane', rounds: rounds + 1, value, source: actor.id || 'enemy' });
            else t.effects.push({ id: 'hurricane', name: 'Hurricane', rounds, value, source: actor.id || 'enemy' });
          });
          actor.cooldowns['hurricane'] = 7;
          if(actor.bolster) actor.bolster = false;
          if(targets.length){ log({ text: `${actor.name} struck ${targets.map(x=>x.name).join(', ')} for ${value} damage.`, abilityId: 'hurricane' }); playSound('attack'); }
        } break;
        case 'beam': {
          animateSprite('enemy','attack');
          let base = Math.round((actor.power || 0) * 22 + randInt(0,9));
          if(actor.bolster){ base += 50; actor.bolster = false; }
          const dealt = applyDamage('enemy','player', base, 'beam-suppress');
          const targetName = state.player ? state.player.name : 'opponent';
          log({ text: `${actor.name} beams ${targetName} for ${dealt}.`, abilityId: 'beam' });
          if(dealt > 0 && actor && actor.hp > 0){
            animateSprite('enemy','heal','small');
            actor.hp += dealt; if(actor.hp>actor.maxHp) actor.hp = actor.maxHp;
            playSound('attack');
            playSound('heal');
            log({ text: `${actor.name} restores ${dealt} HP.`, abilityId: 'heal' });
          }
          actor.cooldowns['beam'] = 4;
        } break;
        case 'curse': {
          const rounds = 3;
          let value = 0.15;
          if(actor.bolster){ value = 0.25; actor.bolster = false; }
          const target = state.player;
          target.effects = target.effects || [];
          target.effects.push({ id: 'curse', name: 'Curse', rounds, value });
          actor.cooldowns['curse'] = 5;
          playSound('curse');
          log({ text: `${actor.name} weakens ${target.name} (${rounds} rounds).`, abilityId: 'curse' });
        } break;
        case 'toxin': {
          animateSprite('enemy','attack');
          const target = (state.playerTeam && state.playerTeam.length) ? state.playerTeam[0] : state.player;
          if(target){
            target.effects = target.effects || [];
            target.effects.push({ id: 'toxin', name: 'toxin', rounds: 3, sourceKey: 'enemy', bolstered: !!actor.bolster });
          }
          actor.cooldowns['toxin'] = 11;
          if(actor.bolster) actor.bolster = false;
          log(`${actor.name} injects a delayed toxin (3 rounds).`);
          playSound('curse');
        } break;
        case 'vines': {
          animateSprite('enemy','heal','medium');
          const rounds = 4;
          let value = 0.3;
          if(actor.bolster){ value = 0.5; actor.bolster = false; }
          actor.effects = actor.effects || [];
          actor.effects.push({ id: 'vines', name: 'Vines', rounds, value });
          actor.cooldowns['vines'] = 7;
          log({ text: `${actor.name}'s vines return a portion of damage taken. (${rounds} rounds).`, abilityId: 'vines' });
          playSound('defend');
        } break;
        case 'pass': log(`${actor.name} passed the turn.`); playSound('pass'); break;
      }
      if(id === 'heal') actor.cooldowns['heal'] = 1;
      updateUI();
      console.log('enemyAct executed -> scheduling endTurn from enemy');
      setTimeout(()=> endTurn('enemy'), 1100);
    }, 1000);
  }

  function endTurn(lastActor){
    if(state.player.hp<=0 || state.enemy.hp<=0){
      finishBattle();
      return;
    }
  console.log('endTurn called with', lastActor, 'current state.turn=', state.turn);
  if(lastActor === 'player'){
    setActiveTurn('enemy');
  applyEffects('enemy');
  if(state.turn === 'finished') return;
  tickCooldownsForSide('enemy');
  applyCharged('enemy');
  if(state.turn === 'finished') return;
      if(state.enemy.stunned && state.enemy.stunned > 0){
        const just = !!state.enemy._justStunned;
        if(!just || state.enemy.stunned > 1){
          log(`${state.enemy.name} is stunned and skips their turn.`);
        }
        try{ state.enemy._justStunned = false; }catch(e){}
        state.enemy.stunned -= 1;
        if(Array.isArray(state.enemy.effects)){
          const se = state.enemy.effects.find(e=>e.id === 'stunned');
          if(se){ se.rounds = Math.max(0, se.rounds - 1); if(se.rounds <= 0) state.enemy.effects = state.enemy.effects.filter(e=>e.id !== 'stunned'); }
        }
        setTimeout(()=> endTurn('enemy'), 700);
        return;
      }
      setTimeout(()=>{
        if(state.turn === 'finished') return;
        console.log('triggering enemyAct');
        enemyAct();
      }, 900);
    } else if(lastActor === 'enemy'){
        state.round = (state.round || 1) + 1;
        updateRoundDisplay();
        try{ log({ text: `--Round ${state.round}--`, type: 'announce' }); }catch(e){}
      setActiveTurn('player');
      applyEffects('player');
  if(state.turn === 'finished') return;
  tickCooldownsForSide('player');
  applyCharged('player');
      if(state.turn === 'finished'){
        updateUI();
        return;
      }
      if(state.player.stunned && state.player.stunned > 0){
        const just = !!state.player._justStunned;
        if(!just || state.player.stunned > 1){
          log(`${state.player.name} is stunned and skips their turn.`);
        }
        try{ state.player._justStunned = false; }catch(e){}
        state.player.stunned -= 1;
        if(Array.isArray(state.player.effects)){
          const sp = state.player.effects.find(e=>e.id === 'stunned');
          if(sp){ sp.rounds = Math.max(0, sp.rounds - 1); if(sp.rounds <= 0) state.player.effects = state.player.effects.filter(e=>e.id !== 'stunned'); }
        }
        updateUI();
        renderActions();
        return;
      }
      updateUI();
      renderActions();
    }
  }

  $startBtn.addEventListener('click',()=>{ 
    playSound('start');
    if(state.enemy && state.enemy.isBoss){
    } else if(Array.isArray(state.playerTeam) && state.playerTeam.length === 3){
      chooseEnemyTeam();
    } else {
      chooseEnemy();
    }
    startBattle();
  });
  if($splashPlay){
    $splashPlay.addEventListener('click', ()=>{
      try{ playSound('start'); }catch(e){}
      try{
        if(window.SOUNDS && SOUNDS.start){ try{ SOUNDS.start.currentTime = 0; }catch(e){} const p = SOUNDS.start.play(); if(p && p.catch) p.catch(()=>{}); }
      }catch(e){}
      if($splash) $splash.classList.add('hidden');
      if($setup) $setup.classList.remove('hidden');
      setTimeout(()=>{ document.querySelector('.pet')?.focus(); }, 60);
    });
  }
  const $splashBack = document.getElementById('splash-back');
  if($splashBack){
    $splashBack.addEventListener('click', ()=>{
      try{ playSound('restart'); }catch(e){}
      window.location.href = 'index.html';
    });
  }
  $back.addEventListener('click',()=>{ 
    try{ if(state._winPopupTimeoutId){ clearTimeout(state._winPopupTimeoutId); state._winPopupTimeoutId = null; } }catch(e){}
    try{
      if(state.enemy && state.enemy.isBoss){ state.enemy = null; }
      state.enemyTeam = null;
      state.enemyAbilities = [];
    }catch(e){}
    playSound('restart'); $battle.classList.add('hidden'); $setup.classList.remove('hidden'); 
  });
  $back.addEventListener('click', ()=>{ 
    try{ if(state._winPopupTimeoutId){ clearTimeout(state._winPopupTimeoutId); state._winPopupTimeoutId = null; } }catch(e){}
    try{ document.body.classList.remove('battle-visible'); }catch(e){}
  });
  $restart.addEventListener('click',()=>{ 
    playSound('restart');
    window.location.reload();
  });
  if($home) $home.addEventListener('click',()=>{ playSound('restart'); window.location.href = '../index.html'; });

  window.addEventListener('keydown', (ev)=>{
    try{
      if(document.activeElement && /input|textarea|select/i.test(document.activeElement.tagName)) return;
      const k = ev.key;
      if(k === 'Escape'){
        if($back && !$back.disabled){ $back.click(); }
        return;
      }
  if(!['1','2','3','4','5','6'].includes(k)) return;
      if($battle && $battle.classList.contains('hidden')) return;
      if(state.turn !== 'player') return;
      const btn = document.querySelector(`#actions button[data-key="${k}"]`);
      if(btn && !btn.disabled){ btn.click(); }
    }catch(e){}
  });

  renderPets(); renderAbilities();

  window._petBattler = { state, PETS, ABILITIES,
    debugEnemyPicks(opts = {}){
      const mode = opts.mode || 'single';
      const iterations = typeof opts.iterations === 'number' ? opts.iterations : 100;
      const typeMap = { Fluid: 'bubble', Flame: 'scorch', Stone: 'shatter', Storm: 'hurricane', Gleam: 'beam', Gloom: 'curse', Blight: 'toxin', Bloom: 'vines' };
      const summary = {};
      const prev = JSON.parse(JSON.stringify(state));
      for(let i=0;i<iterations;i++){
        try{
          if(mode === 'single'){
            chooseEnemy();
            const en = state.enemy || {};
            const pet = en.name || en.id || 'unknown';
            summary[pet] = summary[pet] || { count:0, specialPresent:0, specialPosCounts:{}, abilitiesCount:{} };
            summary[pet].count++;
            const mapped = en.type ? typeMap[en.type] : null;
            const abilities = state.enemyAbilities || [];
            if(mapped && abilities.includes(mapped)){ summary[pet].specialPresent++; const pos = abilities.indexOf(mapped); summary[pet].specialPosCounts[pos] = (summary[pet].specialPosCounts[pos]||0) + 1; }
            abilities.forEach(a=> summary[pet].abilitiesCount[a] = (summary[pet].abilitiesCount[a]||0) + 1);
          } else if(mode === 'team'){
            chooseEnemyTeam();
            const team = state.enemyTeam || [];
            team.forEach(en=>{
              const pet = en.name || en.id || 'unknown';
              summary[pet] = summary[pet] || { count:0, specialPresent:0, specialPosCounts:{}, abilitiesCount:{} };
              summary[pet].count++;
              const mapped = en.type ? typeMap[en.type] : null;
              const abilities = en.selectedAbilities || [];
              if(mapped && abilities.includes(mapped)){ summary[pet].specialPresent++; const pos = abilities.indexOf(mapped); summary[pet].specialPosCounts[pos] = (summary[pet].specialPosCounts[pos]||0) + 1; }
              abilities.forEach(a=> summary[pet].abilitiesCount[a] = (summary[pet].abilitiesCount[a]||0) + 1);
            });
          }
        }catch(e){ console.error('debugEnemyPicks iteration error', e); }
      }
      try{
        Object.keys(state).forEach(k=> delete state[k]);
        Object.keys(prev).forEach(k=> state[k] = prev[k]);
        try{ updateUI(); renderActions(); }catch(e){}
      }catch(e){ console.error('debugEnemyPicks restore error', e); }
      console.log('debugEnemyPicks', { mode, iterations });
      const rows = Object.keys(summary).map(name=>({ name, count: summary[name].count, specialRate: (summary[name].specialPresent/summary[name].count).toFixed(2) }));
      console.table(rows);
      console.log('full summary object:', summary);
      return summary;
    }
  };

})();