(function(){
	'use strict';

	function onReady(fn){
		if(document.readyState === 'loading'){
			document.addEventListener('DOMContentLoaded', fn);
		} else {
			try { fn(); } catch(e){}
		}
	}

	onReady(function init(){
		var $splash = document.getElementById('splash');
		var $play = document.getElementById('splash-play');
		var $backSplash = document.getElementById('splash-back');
		var $setup = document.getElementById('setup');
		var $battle = document.getElementById('battle');
		var $actions = document.getElementById('actions');
		var $log = document.getElementById('log');
		var $restart = document.getElementById('restart-btn');
		var $home = document.getElementById('home-btn');
		var $back = document.getElementById('back-btn');

		var $playerName = document.getElementById('player-name');
		var $enemyName = document.getElementById('enemy-name');
		var $playerType = document.getElementById('player-type');
		var $enemyType = document.getElementById('enemy-type');
		var $vsLeftInner = document.getElementById('vs-left-inner');
		var $vsRightInner = document.getElementById('vs-right-inner');
		var $vsLeftHp = document.getElementById('vs-left-hp');
		var $vsRightHp = document.getElementById('vs-right-hp');
		var $playerHpFill = document.getElementById('player-hp-fill');
		var $enemyHpFill = document.getElementById('enemy-hp-fill');
		var $playerEffects = document.getElementById('player-effects');
		var $enemyEffects = document.getElementById('enemy-effects');
		var $turnLeft = document.getElementById('turn-left');
		var $turnRight = document.getElementById('turn-right');
		var $roundCounter = document.getElementById('round-counter');
		var $benchR = document.getElementById('vs-right-bench-hp');

		var SOUNDS = {
			start: new Audio('Sounds/Start.wav'),
			pass: new Audio('Sounds/Pass.wav'),
			stun: new Audio('Sounds/Stun.wav'),
			poison: new Audio('Sounds/Poison.wav'),
			regenerate: new Audio('Sounds/Regenerate.wav'),
			heal: new Audio('Sounds/Heal.wav'),
			bolster: new Audio('Sounds/Bolster.wav'),
			attack: new Audio('Sounds/Attack.wav'),
			chargeHeal: new Audio('Sounds/Charge Heal.wav'),
			chargeAttack: new Audio('Sounds/Charge Attack.wav'),
			murder: new Audio('Sounds/Murder.wav'),
			defend: new Audio('Sounds/Defend.wav'),
			curse: new Audio('Sounds/Curse.wav'),
			restart: new Audio('Sounds/Restart.wav')
		};
		var soundEnabled = true;
		var volumeLevel = 0.85;
		var STORAGE_KEYS = { enabled: 'petBrawlSoundEnabled', volume: 'petBrawlVolume' };
		function applyVol(){
			try{ for(var k in SOUNDS){ try{ SOUNDS[k].volume = volumeLevel; }catch(e){} } }catch(e){}
		}
		applyVol();

		function saveSoundPref(){
			try{
				localStorage.setItem(STORAGE_KEYS.enabled, soundEnabled ? '1' : '0');
				localStorage.setItem(STORAGE_KEYS.volume, String(volumeLevel));
			}catch(e){}
		}

		function loadSoundPref(){
			try{
				var e = localStorage.getItem(STORAGE_KEYS.enabled);
				var v = localStorage.getItem(STORAGE_KEYS.volume);
				if(e !== null) soundEnabled = (e === '1');
				if(v !== null){
					var fv = parseFloat(v);
					if(!isNaN(fv)) volumeLevel = Math.max(0, Math.min(1, fv));
				}
			}catch(err){}
			applyVol();
		}

		function playSound(key){
			try{
				if(!soundEnabled) return;
				var s = SOUNDS[key];
				if(!s) return;
				try{ s.currentTime = 0; }catch(e){}
				var p = s.play();
				if(p && p.catch) p.catch(function(){});
			}catch(e){}
		}

		function createVolumeControlUI(){
			var container = document.createElement('div');
			container.className = 'petb-volume blue';
			container.innerHTML = '' +
				'<div class="volume-icon" title="Toggle sound">🔊</div>' +
				'<div class="volume-control">' +
				  '<div class="volume-meter" id="petb-volume-meter">' +
				    '<div class="volume-bar" id="petb-volume-bar"><div class="volume-bar-inner"></div></div>' +
				    '<div class="volume-segments" id="petb-volume-segments"></div>' +
				    '<div class="volume-handle" id="petb-volume-handle"></div>' +
				  '</div>' +
				'</div>';
			document.body.appendChild(container);

			var icon = container.querySelector('.volume-icon');
			var meter = container.querySelector('#petb-volume-meter');
			var bar = container.querySelector('#petb-volume-bar');
			var barInner = bar ? bar.querySelector('.volume-bar-inner') : null;
			var segWrap = container.querySelector('#petb-volume-segments');
			var handle = container.querySelector('#petb-volume-handle');
			var VOL_SEG_COUNT = 16;
			if(segWrap && !segWrap.childElementCount){
				for(var si=0; si<VOL_SEG_COUNT; si++){
					var seg = document.createElement('div');
					seg.className = 'vol-seg';
					segWrap.appendChild(seg);
				}
			}

			var collapseTimer = null;
			var isVolDragging = false;
			var lastNonZeroVolume = Math.round((volumeLevel||0) * 100) || 60;

			function render(){
				var pct = Math.round((volumeLevel||0) * 100);
				bar.style.width = pct + '%';
				if(barInner){
					barInner.style.transform = 'scaleX(' + (pct/100) + ')';
				}
				if(segWrap){
					var segs = segWrap.querySelectorAll('.vol-seg');
					var totalSegs = segs.length || VOL_SEG_COUNT;
					var active = Math.round((pct/100) * totalSegs);
					segWrap.classList.remove('vol-ok','vol-warn','vol-danger');
					if(pct > 80) segWrap.classList.add('vol-ok');
					else if(pct > 60) segWrap.classList.add('vol-warn');
					else segWrap.classList.add('vol-danger');
					for(var si2=0; si2<segs.length; si2++){
						if(si2 < active){ segs[si2].classList.add('on'); }
						else { segs[si2].classList.remove('on'); }
					}
				}
				var rect = meter.getBoundingClientRect();
				var meterW = Math.max(8, rect.width || 120);
				var handleX = (pct/100) * meterW;
				handle.style.left = handleX + 'px';
				icon.textContent = soundEnabled ? (pct>66? '🔊' : pct>0? '🔉' : '🔈') : '🔇';
				if(!soundEnabled) container.classList.add('muted'); else container.classList.remove('muted');
			}

			function setVolumeFromEvent(ev){
				var rect = meter.getBoundingClientRect();
				var clientX = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
				var x = clientX - rect.left;
				var v = x / rect.width; if(v<0) v=0; if(v>1) v=1;
				volumeLevel = v;
				if(Math.round(volumeLevel*100) > 0) lastNonZeroVolume = Math.round(volumeLevel*100);
				soundEnabled = Math.round(volumeLevel*100) > 0;
				applyVol(); saveSoundPref(); render();
			}

			meter.addEventListener('mousedown', function(e){
				isVolDragging = true;
				meter.classList.add('dragging');
				container.classList.add('expanded');
				setVolumeFromEvent(e);
			});
			window.addEventListener('mousemove', function(e){ if(!isVolDragging) return; setVolumeFromEvent(e); });
			window.addEventListener('mouseup', function(){
				if(isVolDragging){
					isVolDragging = false;
					meter.classList.remove('dragging');
					setTimeout(function(){ if(!container.matches(':hover')) container.classList.remove('expanded'); }, 180);
				}
			});
			meter.addEventListener('touchstart', function(e){ isVolDragging=true; meter.classList.add('dragging'); container.classList.add('expanded'); setVolumeFromEvent(e); });
			window.addEventListener('touchmove', function(e){ if(!isVolDragging) return; setVolumeFromEvent(e); });
			window.addEventListener('touchend', function(){
				if(isVolDragging){
					isVolDragging=false;
					meter.classList.remove('dragging');
					setTimeout(function(){ if(!container.matches(':hover')) container.classList.remove('expanded'); }, 180);
				}
			});

			icon.addEventListener('click', function(){
				if(soundEnabled && volumeLevel>0){
					soundEnabled = false;
					volumeLevel = 0;
					container.classList.add('muted');
				} else {
					soundEnabled = true;
					volumeLevel = Math.max(0, Math.min(1, (lastNonZeroVolume || 60)/100));
					container.classList.remove('muted');
				}
				applyVol(); saveSoundPref(); render();
			});

			container.addEventListener('mouseenter', function(){
				try{ clearTimeout(collapseTimer); }catch(e){}
				container.classList.add('expanded');
			});
			container.addEventListener('mouseleave', function(){
				if(isVolDragging) return;
				collapseTimer = setTimeout(function(){ container.classList.remove('expanded'); }, 500);
			});

			render();

			window._petBrawlVolume = {
				getVolume: function(){ return volumeLevel; },
				setVolume: function(v){ volumeLevel = Math.max(0, Math.min(1, v)); applyVol(); saveSoundPref(); render(); },
				isEnabled: function(){ return soundEnabled; }
			};
		}

		loadSoundPref();
		setTimeout(createVolumeControlUI, 50);

		var PETS = [
			{ id:'p7', name:'Haju', type:'Blight', maxHp:650, power:10.5, healing:0.5, image:'Images/Haju.png' },
			{ id:'p1', name:'Kivi', type:'Stone', maxHp:900, power:7.5, healing:2.5, image:'Images/Kivi.png' },
			{ id:'p2', name:'Tuuli', type:'Storm', maxHp:750, power:8, healing:2.5, image:'Images/Tuli.png' },
			{ id:'p4', name:'Vala', type:'Gleam', maxHp:650, power:6.5, healing:5.75, image:'Images/Vala.png' },
			{ id:'p6', name:'Palo', type:'Flame', maxHp:650, power:11, healing:3, image:'Images/Palo.png' },
			{ id:'p3', name:'Vika', type:'Gloom', maxHp:700, power:9, healing:3, image:'Images/Vika.png' },
			{ id:'p5', name:'Vesi', type:'Fluid', maxHp:700, power:8, healing:4, image:'Images/Vesi.png' },
			{ id:'p8', name:'Sieni', type:'Bloom', maxHp:700, power:6, healing:5, image:'Images/Sieni.png' }
		];

		var PLAYER_ABILITIES = [
			'pass',
			'defend',
			'bolster',
			'shatter',
			'attack',
			'bleed',
			'teamAttack',
			'crystalize'
		];
		var PLAYER_LABELS = ['Pass','Guard','Bolster','Shatter','Strike','Bleed','Sweep','Crystalize'];

		var ABILITY_NAMES = {
			pass:'Pass', defend:'Defend', bolster:'Bolster', shatter:'Shatter', attack:'Strike', bleed:'Bleed', teamAttack:'Sweep', crystalize:'Crystalize',
			toxin:'Toxin', bubble:'Bubble', hurricane:'Hurricane', scorch:'Scorch', vines:'Vines', curse:'Curse', regen:'Regen', teamHeal:'Team Heal', heal:'Heal', chargeAttack:'Charge Attack', chargeHeal:'Charge Heal', beam:'Beam'
		};

		var state = {
			player:null,
			enemy:null,
			enemyTeam:[],
			turn:'player',
			round:1,
			inputLocked:false,
			_displayHp:{ player:0, enemy:0 },
			_hpAnim:{ player:null, enemy:null }
		};

	const ABILITIES = [
  { 
    id:'heal', 
    name:'Heal', 
    type:'support', 
    desc:'Restore HP' },
  { 
    id:'attack', 
    name:'Attack', 
    type:'offense', 
    desc:'Simple attack' },
  { 
    id:'bolster', 
    name:'Bolster', 
    type:'support', 
    desc:'Amplify next ability' },
  { 
    id:'hot', 
    name:'Regen', 
    type:'support', 
    desc:'Heal over time <br> (3 rounds)' },
  { 
    id:'dot', 
    name:'Bleed', 
    type:'offense', 
    desc:'Dmg over time <br> (3 rounds)' },
  { 
    id:'charge-heal', 
    name:'Charge Heal', 
    type:'support', 
    desc:'Charge 1 round' },
  { 
    id:'charge-attack', 
    name:'Charge Attack', 
    type:'offense',
     desc:'Charge 1 round' },
  { 
    id:'defend', 
    name:'Defend', 
    type:'support', 
    desc:'Reduce incoming damage' },
  { 
    id:'stun', 
    name:'Stun', 
    type:'offense', 
    desc:"Interrupt opponent" },
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
      desc: 'Heavy strike; causes recoil damage to self' },
    { 
      id: 'hurricane', 
      name: 'Hurricane', 
      type: 'type-special', 
      desc: 'Damage enemy team for 3 rounds' },
    { 
      id: 'renew', 
      name: 'Renew', 
      type: 'type-special', 
      desc: 'Large self heal' },
    { 
      id: 'curse', 
      name: 'Curse', 
      type: 'type-special', 
      desc: 'Weaken opponent (3 rounds)' },
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

	ABILITIES.push(
		{ 
			id: 'pass', 
			name: 'Pass', 
			type: 'support', 
			desc: 'End your turn' },
		{ 
			id: 'bleed', 
			name: 'Bleed', 
			type: 'offense', 
			desc: 'Inflict damage over time' },
		{ 
			id: 'teamAttack', 
			name: 'Sweep', 
			type: 'offense', 
			desc: 'Cleave all enemies' },
		{ 
			id: 'crystalize', 
			name: 'Crystalize', 
			type: 'offense', 
			desc: 'Apply escalating damage over time and weaken enemy' }
	);

		function rint(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
		function logMsg(msg, type){
			if(!msg) return;
			var d=document.createElement('div');
			d.className='log-msg enter';
			var text='';
			if(typeof msg==='string'){
				text = msg;
				var txt = text.toLowerCase();
				var cls=null;
				if(/\b(prepares|active)\b/.test(txt)) cls='announce';
				else if(/\b(lost|begins charging)\b/.test(txt)) cls='lost';
				else if(/\b(healed|recovered|applied|is charging|received|rejuvenates)\b/.test(txt)) cls='heal-key';
				else if(/\b(attacks|attack|injects|dealt|struck|lashes out|returned)\b/.test(txt)) cls='attack';
				else if(/\b(inflicted)\b/.test(txt)) cls='blight';
				else if(/\b(beams)\b/.test(txt)) cls='beam';
				else if(/\b(shatters)\b/.test(txt)) cls='shatter';
				else if(/\b(crystalizes)\b/.test(txt)) d.style.color = '#ff00ff';
				else if(/\b(cursed|curses)\b/.test(txt)) d.style.color = 'rebeccapurple';
				else if(/\b(braced|braces|defends|stunned|passed|bolstered|intervened|avenge)\b/.test(txt)) cls='support';
				else if(/\b(started|ended)\b/.test(txt)) cls='announce';
				else if(/\b(brutally)\b/.test(txt)) cls='brutally';
				if(type) d.classList.add(type);
				if(cls) d.classList.add(cls);
				d.textContent = text;
			} else if(typeof msg==='object'){
				text = msg.text || '';
				var cls=null;
				if(msg.type) cls = msg.type;
				if(!cls){
					var tx = (text||'').toLowerCase();
					if(/\b(prepares)\b/.test(tx)) cls='announce';
					else if(/\b(lost)\b/.test(tx)) cls='lost';
					else if(/\b(heal|recovered|regenerate)\b/.test(tx)) cls='heal-key';
					else if(/\b(attacks|poison|bleed|lashes out|struck)\b/.test(tx)) cls='attack';
					else if(/\b(braced|stunned|bolstered|intervened|reduces)\b/.test(tx)) cls='support';
					else if(/\b(crystalizes)\b/.test(tx)) cls='crystalize';
					else if(/\b(cursed|curses)\b/.test(tx)) cls='curse';
					else if(/\b(started|ended)\b/.test(tx)) cls='started';
					else if(/\b(brutally|weakens)\b/.test(tx)) cls='brutally';
				}
				if(type) d.classList.add(type);
				if(cls) d.classList.add(cls);
				d.textContent = text;
			}
			$log.prepend(d);
			try{ void d.offsetWidth; }catch(e){}
			try{ requestAnimationFrame(function(){ d.classList.remove('enter'); }); }catch(e){}
		}
		function log(msg){ logMsg(msg, 'info'); }
		function setActiveTurn(which){
			state.turn = which;
			var combats = document.querySelectorAll('.combatant');
			for(var i=0;i<combats.length;i++){ combats[i].classList.remove('active'); }
			var p = document.querySelector('.combatant.player');
			var e = document.querySelector('.combatant.enemy');
			if(which==='player' && p) p.classList.add('active');
			if(which==='enemy' && e) e.classList.add('active');
			if(which==='player'){ $turnLeft.classList.remove('hidden'); $turnRight.classList.add('hidden'); }
			else { $turnLeft.classList.add('hidden'); $turnRight.classList.remove('hidden'); }
			$actions.classList.toggle('disabled', which!=='player' || state.inputLocked===true);
		}
		function animateNumber(el, start, end, duration, key, maxValue){
			if(!el) return;
			duration = (typeof duration==='number')? duration : 420;
			key = key||'player';
			if(state._hpAnim[key]) cancelAnimationFrame(state._hpAnim[key]);
			var range=end-start, t0=performance.now();
			function step(t){
				var k=Math.min(1,(t-t0)/duration);
				var e=k<0.5?2*k*k:-1+(4-2*k)*k;
				var v=Math.round(start+range*e);
				el.textContent = (v + ' / ' + maxValue);
				if(k<1){ state._hpAnim[key]=requestAnimationFrame(step); }
				else { el.textContent=(end+' / '+maxValue); state._displayHp[key]=end; state._hpAnim[key]=null; }
			}
			state._hpAnim[key]=requestAnimationFrame(step);
		}
		function animateBenchHp(el, start, end, duration, maxValue){
			if(!el) return;
			duration = (typeof duration==='number')? duration : 420;
			if(state._hpAnim.bench) cancelAnimationFrame(state._hpAnim.bench);
			var range = end - start, t0 = performance.now();
			function step(t){
				var k = Math.min(1,(t-t0)/duration);
				var e = k<0.5?2*k*k:-1+(4-2*k)*k;
				var v = Math.round(start + range*e);
				el.textContent = 'Bench: ' + v + ' / ' + maxValue;
				if(k<1){ state._hpAnim.bench = requestAnimationFrame(step); }
				else { el.textContent = 'Bench: ' + end + ' / ' + maxValue; state._displayHp.bench = end; state._hpAnim.bench = null; }
			}
			state._hpAnim.bench = requestAnimationFrame(step);
		}
		function flash(fill, kind){
			var inner = fill && fill.querySelector ? fill.querySelector('.fill-inner') : null;
			if(!inner) return;
			inner.classList.remove(kind==='hit'?'heal':'hit');
			inner.classList.add(kind);
			setTimeout(function(){ inner.classList.remove(kind); }, kind==='hit'?520:700);
		}
		function updateRound(){ if($roundCounter) $roundCounter.textContent = String(state.round||1); }
		function updateBars(){
			var p=state.player, e=state.enemy;
			var pNow=Math.max(0,Math.round(p.hp)), eNow=Math.max(0,Math.round(e.hp));
			animateNumber($vsLeftHp, (state._displayHp.player!=null?state._displayHp.player:pNow), pNow, 420, 'player', p.maxHp);
			animateNumber($vsRightHp, (state._displayHp.enemy!=null?state._displayHp.enemy:eNow), eNow, 420, 'enemy', e.maxHp);
			var pw=Math.max(0,p.hp/p.maxHp), ew=Math.max(0,e.hp/e.maxHp);
			ensureHpSegments();
			setHpSegments('player', pw);
			setHpSegments('enemy', ew);
			$playerEffects.textContent = (p.effects||[]).map(function(x){ return x.name + (x.stacks?(' ['+x.stacks+']'):'') + '(' + x.rounds + ')'; }).join(', ');
			$enemyEffects.textContent = (e.effects||[]).map(function(x){ return x.name + (x.stacks?(' ['+x.stacks+']'):'') + '(' + x.rounds + ')'; }).join(', ');
			if($benchR){
				var bench=state.enemyTeam.slice(1);
				var cur=0, tot=0;
				for(var i=0;i<bench.length;i++){ cur += (bench[i].hp||0); tot += (bench[i].maxHp||0); }
				state._displayHp.bench = (typeof state._displayHp.bench === 'number')? state._displayHp.bench : cur;
				animateBenchHp($benchR, state._displayHp.bench, cur, 420, tot);
			}
		}
		function ensureHpSegments(){
			try{
				var left = document.querySelector('.vs-fill.left');
				var right = document.querySelector('.vs-fill.right');
				if(left && !left.querySelector('.vs-segments')){
					var segs = document.createElement('div'); segs.className='vs-segments';
					for(var i=0;i<20;i++){ var d=document.createElement('div'); d.className='vs-seg'; segs.appendChild(d); }
					left.appendChild(segs);
				}
				if(right && !right.querySelector('.vs-segments')){
					var segs2 = document.createElement('div'); segs2.className='vs-segments';
					for(var j=0;j<20;j++){ var d2=document.createElement('div'); d2.className='vs-seg'; segs2.appendChild(d2); }
					right.appendChild(segs2);
				}
			}catch(e){}
		}
		function setHpSegments(side, ratio){
			try{
				var root = document.querySelector(side==='player'?'.vs-fill.left':'.vs-fill.right');
				if(!root) return;
				var segWrap = root.querySelector('.vs-segments');
				if(!segWrap) return;
				var segs = segWrap.querySelectorAll('.vs-seg');
				var total = 20;
				var target = Math.max(0, Math.min(total, Math.floor(ratio * total)));
				segWrap.classList.remove('hp-ok','hp-warn','hp-danger');
				if(ratio > 0.6) segWrap.classList.add('hp-ok'); else if(ratio > 0.3) segWrap.classList.add('hp-warn'); else segWrap.classList.add('hp-danger');
				state._segCounts = state._segCounts || { player: null, enemy: null };
				state._segAnim = state._segAnim || { player: null, enemy: null };
				var key = side==='player' ? 'player' : 'enemy';
				var from = (state._segCounts[key] == null) ? target : state._segCounts[key];
				if(state._segAnim[key] && state._segAnim[key].raf){ cancelAnimationFrame(state._segAnim[key].raf); state._segAnim[key] = null; }
				if(from === target){
					for(var idx=0; idx<segs.length; idx++){
						var shouldOn = idx >= (total - target);
						if(shouldOn){ if(!segs[idx].classList.contains('on')) segs[idx].classList.add('on'); }
						else { if(segs[idx].classList.contains('on')) segs[idx].classList.remove('on'); }
					}
					state._segCounts[key] = target;
					return;
				}
				var duration = 420;
				var startTime = performance.now();
				function draw(now){
					var t = Math.min(1, (now - startTime) / duration);
					var eased = t<0.5 ? 2*t*t : -1 + (4-2*t)*t;
					var cur = from + (target - from) * eased;
					var curCount = Math.max(0, Math.min(total, Math.round(cur)));
					for(var idx=0; idx<segs.length; idx++){
						var shouldOn = idx >= (total - curCount);
						var isOn = segs[idx].classList.contains('on');
						if(shouldOn && !isOn){ segs[idx].classList.add('on'); }
						if(!shouldOn && isOn){ segs[idx].classList.remove('on'); }
					}
					if(t < 1){ state._segAnim[key] = { raf: requestAnimationFrame(draw) }; }
					else {
						for(var idx=0; idx<segs.length; idx++){
							var shouldOn = idx >= (total - target);
							var isOn = segs[idx].classList.contains('on');
							if(shouldOn && !isOn){ segs[idx].classList.add('on','flicker-on'); (function(elm){ setTimeout(function(){ elm.classList.remove('flicker-on'); }, 180); })(segs[idx]); }
							if(!shouldOn && isOn){ segs[idx].classList.remove('on'); segs[idx].classList.add('flicker-off'); (function(elm){ setTimeout(function(){ elm.classList.remove('flicker-off'); }, 180); })(segs[idx]); }
						}
						state._segCounts[key] = target;
						state._segAnim[key] = null;
					}
				}
				state._segAnim[key] = { raf: requestAnimationFrame(draw) };
			}catch(e){}
		}
		function updateNamesAndSprites(){
			try{
				function deadSpriteFor(name){
					var map = { Kivi:'KiviDead.png', Tuuli:'TuliDead.png', Vala:'ValaDead.png', Palo:'PaloDead.png', Vika:'VikaDead.png', Vesi:'VesiDead.png', Sieni:'SieniDead.png', Haju:'HajuDead.png' };
					var file = map[name];
					return file ? ('DeadSprites/' + file) : null;
				}
				if($playerName) $playerName.textContent = state.player.name;
				if($enemyName) $enemyName.textContent = state.enemy.name;
				if($playerType) $playerType.textContent = state.player.type||'';
				if($enemyType) $enemyType.textContent = state.enemy.type||'';
				var ps=document.getElementById('player-sprite'); if(ps) ps.src = state.player.image;
				var es=document.getElementById('enemy-sprite'); if(es) es.src = state.enemy.image;
				var host = document.querySelector('.combatant.enemy .sprite');
				if (host) {
					var ring = host.querySelector('.enemy-backring');
					if (!ring) {
						ring = document.createElement('div');
						ring.className = 'enemy-backring';
						ring.setAttribute('id', 'enemy-backring');
						host.appendChild(ring);
					}
					var benchAll = (state.enemyTeam||[]).slice(1).filter(function(p){ return !!p; });
					var init = (state.enemyInitialOrder||[]);
					benchAll.sort(function(a,b){ return init.indexOf(a && a.id) - init.indexOf(b && b.id); });
					var n = benchAll.length;
					var existing = new Map();
					Array.prototype.forEach.call(ring.querySelectorAll('img[data-id]'), function(img){
						existing.set(img.getAttribute('data-id'), img);
					});
					var W = host.clientWidth || 120;
					var H = host.clientHeight || 100;
					var cx = W * 0.5;
					var rr = Math.min(W, H) * 0.46;
					var startDeg = 180; 
					var endDeg = 0;
					var step = n <= 1 ? 0 : (startDeg - endDeg) / (n - 1);
					var cy = Math.max(8, Math.min(16, H * 0.16));
					var aliveIds = new Set();
					for (var i=0;i<n;i++){
						var p = benchAll[i];
						var id = p.id || p.name || ('idx-'+(i+1));
						aliveIds.add(id);
						var theta = (startDeg - i * step) * Math.PI / 180;
						var ICON = 18;
						var x = cx + rr * Math.cos(theta) - (ICON/2);
						var y = cy - rr * Math.sin(theta) - (ICON/2);
						var img = existing.get(id);
						if (!img) {
							img = document.createElement('img');
							img.setAttribute('data-id', id);
							img.src = (p.dead || p.hp<=0) ? (deadSpriteFor(p.name) || p.image) : p.image;
							img.alt = p.name;
							img.title = p.name;
							img.style.opacity = '0';
							ring.appendChild(img);
							void img.offsetWidth;
							img.style.opacity = '0.38';
						} else {
							img.src = (p.dead || p.hp<=0) ? (deadSpriteFor(p.name) || p.image) : p.image; 
							img.alt = p.name;
							img.title = p.name;
							img.classList.remove('dead');
						}
						if(p.dead || p.hp<=0){ img.classList.add('dead'); }
						img.style.left = x + 'px';
						img.style.top = y + 'px';
					}
					existing.forEach(function(img, id){
						if (!aliveIds.has(id)) {
							img.classList.add('dead');
							img.style.opacity = '0';
							setTimeout(function(){ if (img.parentElement === ring) ring.removeChild(img); }, 260);
						}
					});
					try{
						for(var bi=0; bi<benchAll.length; bi++){
							var bp = benchAll[bi];
							if(!bp) continue;
							var bid = bp.id || bp.name || ('idx-'+(bi+1));
							if(bp.dead || (typeof bp.hp==='number' && bp.hp<=0)){
								var imgEl = ring.querySelector('img[data-id="' + bid + '"]');
								if(imgEl){
									var ds = deadSpriteFor(bp.name) || bp.image;
									if(ds) imgEl.src = ds;
									imgEl.classList.add('dead');
								}
							}
						}
					}catch(e){}
				}
			}catch(e){}
		}

		function removeEffect(actor, id){
			if(!actor.effects) return;
			actor.effects = actor.effects.filter(function(x){ return x.id!==id; });
		}
		function addEffect(actor, eff){
			actor.effects = actor.effects||[];
			actor.effects.push(eff);
		}
		function hasEffect(actor, id){
			if(!actor || !actor.effects) return false;
			for(var i=0;i<actor.effects.length;i++) if(actor.effects[i].id===id) return true;
			return false;
		}
		function getWeakenMultiplier(actor){
			var m = 1;
			if(!actor || !actor.effects) return m;
			for(var i=0;i<actor.effects.length;i++){
				var eff=actor.effects[i];
				if(eff.id==='weaken' && typeof eff.factor==='number') m *= eff.factor;
				if(eff.id==='crystalize') m *= 0.4;
			}
			return m;
		}

		function triggerVinesReflect(defender, attacker, dmg){
			try{
				if(!defender || !defender.effects || !attacker) return;
				var vine = null;
				for(var vi=0; vi<defender.effects.length; vi++){ if(defender.effects[vi].id==='vines'){ vine = defender.effects[vi]; break; } }
				if(!vine || !(dmg>0)) return;
				var pct = (typeof vine.pct==='number')? vine.pct : (typeof vine.value==='number'? vine.value : 0.3);
				var ret = Math.max(0, Math.round(dmg * pct));
				if(ret <= 0) return;
				var reflected = ret;
				if(attacker.defend){ var sstr = (typeof attacker.defend === 'number')? attacker.defend : 1; reflected = Math.round(sstr >= 2 ? reflected * 0.25 : reflected * 0.5); attacker.defend = false; }
				if(attacker && attacker.effects){ for(var bi=0;bi<attacker.effects.length;bi++){ if(attacker.effects[bi].id==='bubble' && typeof attacker.effects[bi].value==='number'){ reflected = Math.max(0, reflected - attacker.effects[bi].value); break; } } }
				reflected = Math.max(0, reflected);
				if(reflected>0){
					attacker.hp = Math.max(0, attacker.hp - reflected);
					logMsg(defender.name + "'s vines returned " + reflected + ' damage to ' + attacker.name + '.', 'attack');
					playSound('defend');
					if(attacker.hp<=0 && !attacker.dead){ attacker.hp=0; attacker.dead=true; logMsg(attacker.name + ' was brutally murdered!', 'brutally'); playSound('murder');
						try{ if(attacker===state.enemy){ rotateNextEnemy(); } else { setPlayerDeathSprite(); finishBattle(); } }catch(e){}
					}
				}
			}catch(e){}
		}
		function consumeDefend(actor){
			if(!actor) return;
			if(actor.defend){ actor.defend=false; removeEffect(actor,'defended'); }
		}
		function setPlayerDeathSprite(){
			if(state.player && state.player.dead){
				state.player.image = 'Sprites/Sick2.gif';
				var ps = document.getElementById('player-sprite'); if(ps) ps.src = state.player.image;
			}
		}
		function ensureActiveEnemyAlive(){
			var team = state.enemyTeam;
			if(!team || team.length===0){ finishBattle(); return; }
			var firstIdx = -1;
			for(var i=0;i<team.length;i++){
				if(team[i] && !team[i].dead && team[i].hp>0){ firstIdx = i; break; }
			}
			if(firstIdx === -1){ finishBattle(); return; }
			var switched = false;
			if(firstIdx !== 0){
				var next = team.splice(firstIdx,1)[0];
				team.unshift(next);
				switched = true;
			}
			if(state.enemy !== team[0]){
				state.enemy = team[0];
				updateNamesAndSprites();
				logMsg(state.enemy.name + ' shall avenge them!','announce');
				try{ var es = document.querySelector('.combatant.enemy .sprite'); if(es){ es.classList.add('switch-bounce'); setTimeout(function(){ es.classList.remove('switch-bounce'); }, 600); } }catch(e){}
				try{ playSound('switch'); }catch(e){}
			}
		}
		function applyDamageFromTo(atk, def, baseDamage, label){
			var raw = Math.max(0, Math.round(baseDamage));
			raw = Math.round(raw * getWeakenMultiplier(atk));
			var guardEff = null;
			if(def && def.effects){
				for(var gdi=0; gdi<def.effects.length; gdi++){
					if(def.effects[gdi].id==='eguard'){ guardEff = def.effects[gdi]; break; }
				}
			}
			if(guardEff){
				var gpct = (typeof guardEff.pct==='number') ? guardEff.pct : 0.5;
				raw = Math.round(raw * gpct);
			}
			if(def.defend){
				var defendedEff=null;
				if(def.effects){
					for(var di=0; di<def.effects.length; di++){
						if(def.effects[di].id==='defended'){ defendedEff=def.effects[di]; break; }
					}
				}
				var reduction = 0.5;
				if(def.name === 'Eggling'){
					var bolsteredActive = def.bolster || hasEffect(def,'bolstered');
					reduction = bolsteredActive ? 0 : 0.25;
				}
				raw = Math.round(raw * reduction);
				if(typeof def.defendCharges === 'number' && def.defendCharges > 1){
					def.defendCharges -= 1;
					if(defendedEff){ defendedEff.stacks = def.defendCharges; }
				} else {
					consumeDefend(def);
					def.defendCharges = 0;
					if(defendedEff){ defendedEff.stacks = 0; }
				}
			}
			var bubble=null;
			if(def.effects){ for(var i=0;i<def.effects.length;i++){ if(def.effects[i].id==='bubble'){ bubble=def.effects[i]; break; } } }
			if(bubble && typeof bubble.value==='number') raw = Math.max(0, raw - bubble.value);
			def.hp = Math.max(0, def.hp - raw);
			if(!(label && /suppress-log/i.test(label))){
				playSound('attack');
				logMsg(atk.name + ' dealt ' + raw + ' damage to ' + def.name + '.');
			}
			try{
				var vines = null;
				if(def && def.effects){
					for(var vi=0;vi<def.effects.length;vi++){
						if(def.effects[vi].id==='vines'){ vines = def.effects[vi]; break; }
					}
				}
				if(vines && raw>0){
					var pct = (typeof vines.pct==='number')? vines.pct : (typeof vines.value==='number'? vines.value/100 : 0.3);
					var ret = Math.max(0, Math.round(raw * pct));
					if(ret>0){
						atk.hp = Math.max(0, atk.hp - ret);
						logMsg(def.name + "'s vines returned " + ret + ' damage to ' + atk.name + '.', 'attack');
						if(atk.hp<=0 && !atk.dead){
							atk.hp=0; atk.dead=true; logMsg(atk.name + ' was brutally murdered!', 'brutally'); playSound('murder');
							if(atk===state.enemy){ rotateNextEnemy(); } else { setPlayerDeathSprite(); finishBattle(); }
						}
					}
				}
			}catch(e){}
			try{
				var atkSel = (atk===state.player) ? '.combatant.player .sprite' : '.combatant.enemy .sprite';
				var atkEl = document.querySelector(atkSel);
				if(atkEl){ atkEl.classList.add('attack-bounce'); setTimeout(function(){ atkEl.classList.remove('attack-bounce'); }, 520); }
			}catch(e){}
			if(def.hp<=0 && !def.dead){
				def.hp=0; def.dead=true;
				try{ updateNamesAndSprites(); }catch(e){}
				logMsg(def.name + ' was brutally murdered!', 'brutally');
				playSound('murder');
				if(def===state.enemy){
					ensureActiveEnemyAlive();
				} else if(def===state.player){
					setPlayerDeathSprite();
				}
			}
			return raw;
		}
		function applyEffects(side){
			var actor = (side==='player')? state.player : state.enemy;
			if(!actor || actor.dead) return;
			var remaining=[], total=0;
			var i, eff;
			var guardEff=null, guardPct=null;
			if(actor.effects){
				for(var gi=0; gi<actor.effects.length; gi++){
					if(actor.effects[gi].id==='eguard'){ guardEff=actor.effects[gi]; guardPct = (typeof guardEff.pct==='number')? guardEff.pct : 0.5; break; }
				}
			}
			for(i=0;i<(actor.effects||[]).length;i++){
				eff = actor.effects[i];
				if(eff.id==='dot' || eff.id==='scorch' || eff.id==='hurricane' || eff.id==='rot'){
					var d = eff.value||0;
					if(guardPct!=null){ d = Math.round(d * guardPct); }
					var bub=null; if(actor.effects){ for(var bi=0;bi<actor.effects.length;bi++){ if(actor.effects[bi].id==='bubble'){ bub=actor.effects[bi]; break; } } }
					if(bub && typeof bub.value==='number') d = Math.max(0, d - bub.value);
					actor.hp = Math.max(0, actor.hp - d); total -= d; playSound('poison');
					try{
						var sel = (side==='player')? '.combatant.player .sprite' : '.combatant.enemy .sprite';
						var el = document.querySelector(sel);
						if(el){ el.classList.add('dot-hit'); setTimeout(function(){ el.classList.remove('dot-hit'); }, 520); }
					}catch(e){}
					try{
						var attacker = (side === 'player') ? state.enemy : state.player;
						triggerVinesReflect(actor, attacker, d);
					}catch(e){}
				}
				else if(eff.id==='toxin'){
					if(eff.rounds<=1){
						var exec = eff.exec || {};
						var dmg = (typeof exec.damage==='number')? exec.damage : (275 + rint(0,25));
						var dtx = dmg;
						if(guardPct!=null){ dtx = Math.round(dtx * guardPct); }
						var bub2=null; if(actor.effects){ for(var bk=0;bk<actor.effects.length;bk++){ if(actor.effects[bk].id==='bubble'){ bub2=actor.effects[bk]; break; } } }
						if(bub2 && typeof bub2.value==='number') dtx = Math.max(0, dtx - bub2.value);
						actor.hp = Math.max(0, actor.hp - dtx); total -= dtx; playSound('poison');
						var rotVal = (typeof exec.rotValue==='number')? exec.rotValue : 25;
						var rotRounds = (typeof exec.rotRounds==='number')? exec.rotRounds : 8;
						addEffect(actor, { id:'rot', name:'Rot', rounds: rotRounds, value: rotVal });
						logMsg(` Haju's Toxin burst for ` + dtx + ' damage and inflicted Rot (' + rotVal + '/round).');
						try{
							var selTx = (side==='player')? '.combatant.player .sprite' : '.combatant.enemy .sprite';
							var elTx = document.querySelector(selTx);
							if(elTx){ elTx.classList.add('dot-hit'); setTimeout(function(){ elTx.classList.remove('dot-hit'); }, 520); }
						}catch(e){}
					}
				}
				else if(eff.id==='hot'){
					var h = eff.value||0; actor.hp = Math.min(actor.maxHp, actor.hp + h); total += h; playSound('regenerate');
					try{
						var selH = (side==='player')? '.combatant.player .sprite' : '.combatant.enemy .sprite';
						var elH = document.querySelector(selH);
						if(elH){ elH.classList.add('heal-bounce'); setTimeout(function(){ elH.classList.remove('heal-bounce'); }, 520); }
					}catch(e){}
				}
				else if(eff.id==='crystalize'){
					var seq = eff.seq || [30,45,60];
					var step = (typeof eff.step==='number'? eff.step : 0);
					var c = seq[ step < seq.length ? step : (seq.length-1) ];
					var d2 = c||0;
					if(guardPct!=null){ d2 = Math.round(d2 * guardPct); }
					var bb=null; if(actor.effects){ for(var bj=0;bj<actor.effects.length;bj++){ if(actor.effects[bj].id==='bubble'){ bb=actor.effects[bj]; break; } } }
					if(bb && typeof bb.value==='number') d2 = Math.max(0, d2 - bb.value);
					actor.hp = Math.max(0, actor.hp - d2); total -= d2; playSound('poison');
					try{ var selC = (side==='player')? '.combatant.player .sprite' : '.combatant.enemy .sprite'; var elC = document.querySelector(selC); if(elC){ elC.classList.add('dot-hit'); setTimeout(function(){ elC.classList.remove('dot-hit'); }, 520); } }catch(e){}
					eff.step = step + 1;
				}
				eff.rounds -= 1;
				if(eff.rounds>0) remaining.push(eff);
			}
			actor.effects = remaining;
			if(total!==0){
				logMsg(actor.name + ' ' + (total<0?'lost':'recovered') + ' ' + Math.abs(total) + ' HP.', total<0?'damage':'heal');
				flash( side==='player'? $playerHpFill : $enemyHpFill, total<0?'hit':'heal');
			}
			if(actor.hp<=0 && !actor.dead){
				actor.dead=true; actor.hp=0;
				try{ updateNamesAndSprites(); }catch(e){}
				logMsg(actor.name + ' was brutally murdered!', 'brutally'); playSound('murder');
				if(side==='enemy'){
					ensureActiveEnemyAlive();
				} else {
					setPlayerDeathSprite();
					finishBattle();
				}
			}
			updateBars();
		}

		function rotateNextEnemy(){
			ensureActiveEnemyAlive();
			updateBars();
		}

		function renderActions(){
			$actions.innerHTML = '';
			for(var i=0;i<PLAYER_ABILITIES.length;i++){
				var id = PLAYER_ABILITIES[i];
				var b=document.createElement('button');
				b.className='ability-btn';
				b.setAttribute('data-id', id);
				b.setAttribute('data-key', String(i+1));
				b.innerHTML = '<span class="keybind">' + (i+1) + '</span>' + PLAYER_LABELS[i];
				(function(ability){ b.addEventListener('click', function(){ playerUseAbility(ability); }); })(id);
				var abilityObj = (Array.isArray(ABILITIES) && ABILITIES.find)? ABILITIES.find(function(a){ return a.id===id; }) : null;
				var desc = (abilityObj && abilityObj.desc) ? abilityObj.desc : (ABILITY_NAMES[id] || id);
				b.setAttribute('data-desc', desc);
				( function(btn, text){
					var holdTimer = null;
					var SHOW_DELAY = 400;
					btn.addEventListener('mouseenter', function(){ try{ if(holdTimer) clearTimeout(holdTimer); holdTimer = setTimeout(function(){ showAbilityTooltip(btn, text); }, SHOW_DELAY); }catch(e){} });
					btn.addEventListener('mouseleave', function(){ try{ if(holdTimer) clearTimeout(holdTimer); hideAbilityTooltip(); }catch(e){} });
					btn.addEventListener('focus', function(){ try{ if(holdTimer) clearTimeout(holdTimer); holdTimer = setTimeout(function(){ showAbilityTooltip(btn, text); }, SHOW_DELAY); }catch(e){} });
					btn.addEventListener('blur', function(){ try{ if(holdTimer) clearTimeout(holdTimer); hideAbilityTooltip(); }catch(e){} });
					btn.addEventListener('touchstart', function(ev){ try{ if(holdTimer) clearTimeout(holdTimer); holdTimer = setTimeout(function(){ showAbilityTooltip(btn, text); }, SHOW_DELAY); }catch(e){} });
					btn.addEventListener('touchend', function(){ try{ if(holdTimer) clearTimeout(holdTimer); hideAbilityTooltip(); }catch(e){} });
					btn.addEventListener('touchcancel', function(){ try{ if(holdTimer) clearTimeout(holdTimer); hideAbilityTooltip(); }catch(e){} });
				})(b, desc);
				$actions.appendChild(b);
			}
			$actions.classList.toggle('disabled', state.turn!=='player');
			var map={ pass:'blue', defend:'white', bolster:'white', shatter:'gray', attack:'red', bleed:'red', teamAttack:'red', crystalize:'pink' };
			var btns=$actions.querySelectorAll('button.ability-btn');
			for(var j=0;j<btns.length;j++){ var ab=btns[j].getAttribute('data-id'); var cls=map[ab]; if(cls) btns[j].classList.add(cls); }
			var cds = (state.player && state.player.cooldowns) ? state.player.cooldowns : {};
			for(var k=0;k<btns.length;k++){
				var abid=btns[k].getAttribute('data-id');
				var cd=cds[abid]||0;
				var ov = btns[k].querySelector('.cooldown-overlay');
				if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
				if(cd>0){
					btns[k].disabled=true;
					btns[k].title='Cooldown ' + cd + ' rounds';
					var span=document.createElement('span');
					span.className='cooldown-overlay';
					span.textContent=String(cd);
					btns[k].appendChild(span);
				}else{
					btns[k].disabled=false;
					btns[k].removeAttribute('title');
				}
			}
		}

		var _abilityTooltipEl = null;

		function showAbilityTooltip(targetEl, text){
			try{
				if(!targetEl) return;
				if(!_abilityTooltipEl){ _abilityTooltipEl = document.createElement('div'); _abilityTooltipEl.className = 'ability-tooltip'; document.body.appendChild(_abilityTooltipEl); }
				_abilityTooltipEl.innerHTML = text;
				_abilityTooltipEl.classList.add('visible');
				var rect = targetEl.getBoundingClientRect();
				var ttRect = _abilityTooltipEl.getBoundingClientRect();
				var left = rect.left + (rect.width/2) - (ttRect.width/2);
				left = Math.max(8, Math.min(left, window.innerWidth - ttRect.width - 8));
				var top = rect.top - ttRect.height - 10;
				if(top < 8) top = rect.bottom + 10;
				_abilityTooltipEl.style.left = Math.round(left) + 'px';
				_abilityTooltipEl.style.top = Math.round(top) + 'px';
			}catch(e){}
		}

		function hideAbilityTooltip(){
			try{ if(_abilityTooltipEl){ _abilityTooltipEl.classList.remove('visible'); } }catch(e){}
		}

		function finishBattle(){
			if(state.turn==='finished') return;
			state.turn='finished';
			$restart.classList.remove('hidden');
			logMsg('Battle ended.','ended');
			var controls=document.querySelector('.controls'); if(controls) controls.style.justifyContent='center';
			try{
				var playerAlive = state.player && state.player.hp>0;
				var anyEnemyAlive = (state.enemyTeam||[]).some(function(p){ return p && !p.dead && p.hp>0; });
				if(playerAlive && !anyEnemyAlive){
					try{ if(state._winPopupTimeoutId) clearTimeout(state._winPopupTimeoutId); }catch(e){}
					state._winPopupTimeoutId = setTimeout(function(){ try{ state._winPopupTimeoutId=null; showWinPopup(); }catch(e){} }, 1200);
				}
			}catch(e){}
		}

		function showWinPopup(){
			try{ if(state._winPopupTimeoutId){ clearTimeout(state._winPopupTimeoutId); state._winPopupTimeoutId = null; } }catch(e){}
			if(document.getElementById('win-overlay')) return;
			var overlay = document.createElement('div'); overlay.className='modal-overlay'; overlay.id='win-overlay';
			var popup = document.createElement('div'); popup.className='win-popup';
			var img = document.createElement('img'); img.alt='Won'; img.src='Images/won.gif';
			var closeBtn = document.createElement('button'); closeBtn.className='close-btn'; closeBtn.innerHTML='Close';
			popup.appendChild(img); popup.appendChild(closeBtn); overlay.appendChild(popup); document.body.appendChild(overlay);
			function removePopup(){
				try{ popup.classList.add('closing'); overlay.classList.add('closing'); }catch(e){}
				var onAnimEnd = function(){
					try{ document.body.removeChild(overlay); }catch(e){}
					try{ document.removeEventListener('keydown', onKey); }catch(e){}
					popup.removeEventListener('animationend', onAnimEnd);
				};
				popup.addEventListener('animationend', onAnimEnd);
			}
			function onKey(ev){ if(ev.key==='Escape'){ ev.stopPropagation(); removePopup(); } }
			overlay.addEventListener('click', function(ev){ if(ev.target===overlay) removePopup(); });
			closeBtn.addEventListener('click', function(){ removePopup(); });
			document.addEventListener('keydown', onKey);
		}

		function endTurn(last){
			if(state.player.hp<=0 || state.enemy.hp<=0){ finishBattle(); return; }
			if(last==='player'){
				setActiveTurn('enemy');
				applyEffects('enemy');
				if(state.turn==='finished') return;
				if(state.enemy && state.enemy.cooldowns){
					for(var ck in state.enemy.cooldowns){ if(state.enemy.cooldowns[ck]>0){ state.enemy.cooldowns[ck]-=1; if(state.enemy.cooldowns[ck]<=0) delete state.enemy.cooldowns[ck]; } }
				}
				setTimeout(enemyAct, 800);
			}else{
				state.round = (state.round||1) + 1;
				updateRound();
				logMsg('--Round ' + state.round + '--', 'announce');
				if(state.player){
					state.player.cooldowns = state.player.cooldowns || {};
					for(var key in state.player.cooldowns){ if(state.player.cooldowns[key]>0){ state.player.cooldowns[key]-=1; if(state.player.cooldowns[key]<=0) delete state.player.cooldowns[key]; } }
				}
				state.inputLocked = false;
				setActiveTurn('player');
				applyEffects('player'); if(state.turn==='finished') return;
				updateBars(); renderActions();
			}
		}

		function enemyAct(){
			var actor=state.enemy; if(!actor || actor.dead){ endTurn('enemy'); return; }
			actor.cooldowns = actor.cooldowns || {};
			var avail=(actor.selectedAbilities||['attack']).slice().filter(function(a){ return !(actor.cooldowns[a]>0); });
			var pool = avail.filter(function(a){ return a !== 'pass'; });
			var specialMap = { Haju:'toxin', Kivi:'shatter', Tuuli:'hurricane', Palo:'scorch', Vesi:'bubble', Vika:'curse', Sieni:'vines', Vala:'beam' };
			var specialId = specialMap[actor.name];
			if(specialId && pool.indexOf(specialId) !== -1){ pool = [specialId]; }
			if(pool.length===0) pool = ['pass'];
			var id = pool[Math.floor(Math.random()*pool.length)] || 'attack';
			var prepName = ABILITY_NAMES[id] || id;
			logMsg(actor.name + ' prepares ' + prepName + '...');
			setTimeout(function(){
				switch(id){
					case 'pass': playSound('pass'); logMsg(actor.name + ' passed the turn.'); break;
					case 'attack': {
						var base = (actor.power||0)*15 + rint(0,12);
						if(actor.bolster){ base += 50; actor.bolster=false; }
						applyDamageFromTo(actor, state.player, base);
					} break;
					case 'defend': {
						actor.defend=true; addEffect(actor,{id:'defended',name:'Defended',rounds:2}); playSound('defend');
						logMsg(actor.name + ' braced for incoming damage.');
						actor.cooldowns['defend'] = 2;
					} break;
						case 'bleed': {
							var valB = Math.round((actor.power||0)*7 + rint(0,5));
							if(actor.bolster){ valB = Math.round(valB * 1.5); actor.bolster = false; removeEffect(actor,'bolstered'); }
							addEffect(state.player,{id:'dot',name:'Bleed',rounds:3,value: valB});
							playSound('poison');
							logMsg(actor.name + ' lashes out (' + valB + '/round).');
							actor.cooldowns['bleed'] = 1;
						} break;
					case 'toxin': {
						var exec = { damage: 275 + rint(0,25), rotValue:45, rotRounds:8 };
						addEffect(state.player,{id:'toxin',name:'Toxin',rounds:3,exec: exec});
						playSound('curse');
						logMsg(actor.name + ' injects a delayed toxin (3 rounds).');
						actor.cooldowns['toxin'] = 5;
					} break;
					case 'bubble': {
						addEffect(actor,{id:'bubble',name:'Bubble',rounds:3,value:45});
						playSound('defend');
						logMsg({ text: actor.name + ' reduces damage taken (3 rounds).', abilityId: 'bubble' });
						actor.cooldowns['bubble'] = 7;
					} break;
					case 'bolster': {
						actor.bolster=true; addEffect(actor,{id:'bolstered',name:'Bolstered',rounds:2}); playSound('bolster');
						logMsg(actor.name + ' bolstered their next ability.');
						actor.cooldowns['bolster'] = 3;
					} break;
					case 'shatter': {
						var dmg=150, self=65; if(actor.bolster){ dmg=200; self=80; actor.bolster=false; }
						var applied = applyDamageFromTo(actor, state.player, dmg, 'suppress-log');
						var selfTaken = self;
						if(actor && actor.effects){
							for(var gi=0; gi<actor.effects.length; gi++){
								if(actor.effects[gi].id === 'eguard'){
									var gpct = (typeof actor.effects[gi].pct === 'number') ? actor.effects[gi].pct : 0.5;
									selfTaken = Math.round(selfTaken * gpct);
									break;
								}
							}
							for(var bi=0; bi<actor.effects.length; bi++){
								if(actor.effects[bi].id === 'bubble' && typeof actor.effects[bi].value === 'number'){
									selfTaken = Math.max(0, selfTaken - actor.effects[bi].value);
									break;
								}
							}
						}
						actor.hp = Math.max(0, actor.hp - selfTaken);
						playSound('chargeAttack');
						logMsg(actor.name + ' struck ' + state.player.name + ' for ' + applied + ' damage and takes ' + selfTaken + '.', 'gray');
						if(actor.hp<=0 && !actor.dead){
							actor.hp=0; actor.dead=true; logMsg(actor.name + ' was brutally murdered!', 'brutally'); playSound('murder');
							ensureActiveEnemyAlive();
							updateBars();
							if(state.turn==='finished') return;
						}
						actor.cooldowns['shatter'] = 2;
					} break;
					case 'hurricane': {
						var hv = 75;
						addEffect(state.player,{id:'hurricane',name:'Hurricane',rounds:3,value:hv});
						playSound('chargeAttack');
						logMsg({ text: actor.name + ' struck ' + state.player.name + ' for ' + hv + ' damage.' , abilityId: 'hurricane' });
						actor.cooldowns['hurricane'] = 3;
						try{ var es4 = document.querySelector('.combatant.enemy .sprite'); if(es4){ es4.classList.add('team-attack-left'); setTimeout(function(){ es4.classList.remove('team-attack-left'); }, 520); } }catch(e){}
					} break;
					case 'scorch': {
						addEffect(state.player,{id:'scorch',name:'Scorch',rounds:3,value:75});
						playSound('chargeAttack');
						logMsg({ text: actor.name + ' scorches ' + state.player.name + '. (3 rounds).', abilityId: 'scorch' });
						actor.cooldowns['scorch'] = 3;
						try{ var es5 = document.querySelector('.combatant.enemy .sprite'); if(es5){ es5.classList.add('attack-bounce'); setTimeout(function(){ es5.classList.remove('attack-bounce'); }, 520); } }catch(e){}
					} break;
					case 'vines': {
						var pct = actor.bolster ? 0.5 : 0.3;
						addEffect(actor,{id:'vines',name:'Vines',rounds:3,pct:pct});
						if(actor.bolster){ actor.bolster=false; removeEffect(actor,'bolstered'); }
						playSound('defend');
						logMsg({ text: actor.name + "'s vines return a portion of damage taken. (3 rounds).", abilityId: 'vines' });
						actor.cooldowns['vines'] = 5;
					} break;
					case 'curse': {
						addEffect(state.player,{id:'weaken',name:'Curse',rounds:3,factor:0.10});
						playSound('curse');
						logMsg({ text: actor.name + ' curses ' + state.player.name + ' (3 rounds).', abilityId: 'curse' });
						actor.cooldowns['curse'] = 5;
					} break;
					case 'regen': {
						var valR = 45; addEffect(actor,{id:'hot',name:'Regen',rounds:3,value:valR}); playSound('regenerate'); logMsg(actor.name + ' applied Regenerate (' + valR + '/round).');
						actor.cooldowns['regen'] = 3;
						try{ var es2 = document.querySelector('.combatant.enemy .sprite'); if(es2){ es2.classList.add('heal-bounce'); setTimeout(function(){ es2.classList.remove('heal-bounce'); }, 520); } }catch(e){}
					} break;
					case 'teamHeal': {
						var healEach = Math.round((actor.healing||3)*18 + rint(8,16));
						for(var i=0;i<state.enemyTeam.length;i++){
							var al = state.enemyTeam[i]; if(!al || al.dead || al.hp<=0) continue;
							al.hp = Math.min(al.maxHp, al.hp + healEach);
							logMsg(actor.name + ' healed ' + al.name + ' for ' + healEach + ' HP.');
						}
						playSound('heal');
						actor.cooldowns['teamHeal'] = 3;
						try{ var es3 = document.querySelector('.combatant.enemy .sprite'); if(es3){ es3.classList.add('team-heal-up'); setTimeout(function(){ es3.classList.remove('team-heal-up'); }, 520); } }catch(e){}
					} break;
					case 'heal': {
						var amt = Math.round((actor.healing||3)*30 + rint(10,25));
						actor.hp = Math.min(actor.maxHp, actor.hp + amt); playSound('heal'); logMsg(actor.name + ' healed ' + amt + ' HP.');
						actor.cooldowns['heal'] = 3;
					} break;
					case 'chargeAttack': {
						actor.bolster=true; playSound('bolster'); logMsg(actor.name + ' begins charging an attack.');
						actor.cooldowns['chargeAttack'] = 2;
					} break;
					case 'chargeHeal': {
						addEffect(actor,{id:'hot',name:'Charge Heal',rounds:3,value:45}); playSound('bolster'); logMsg(actor.name + ' is charging a heal.');
						actor.cooldowns['chargeHeal'] = 3;
					} break;
					case 'beam': {
						var baseB = (actor.power||0)*16 + rint(0,9) + 30;
						if(actor.bolster){ baseB += 30; actor.bolster=false; removeEffect(actor,'bolstered'); }
						playSound('chargeAttack');
						var dealt = applyDamageFromTo(actor, state.player, baseB, 'suppress-log');
						logMsg(actor.name + ' beams ' + (state.player ? state.player.name : 'opponent') + ' for ' + dealt + '.', 'attack');
						if(dealt>0){
							actor.hp = Math.min(actor.maxHp, actor.hp + dealt);
							logMsg(actor.name + ' restores ' + dealt + ' HP.', 'heal');
							playSound('heal');
							try{ var esB = document.querySelector('.combatant.enemy .sprite'); if(esB){ esB.classList.add('heal-bounce'); setTimeout(function(){ esB.classList.remove('heal-bounce'); }, 520); } }catch(e){}
						}
						actor.cooldowns['beam'] = 3;
					} break;
					default: logMsg(actor.name + ' passed the turn.','info'); playSound('pass');
				}
				updateBars();
				setTimeout(function(){ endTurn('enemy'); }, 750);
			}, 900);
		}

		function playerUseAbility(id){
			if(state.turn!=='player' || state.inputLocked===true) return; var actor=state.player; if(!actor || actor.dead) return;
			state.inputLocked = true;
			if($actions) $actions.classList.add('disabled');
			var prepName = ABILITY_NAMES[id] || id;
			logMsg(actor.name + ' prepares ' + prepName + '...');
			setTimeout(function(){
				switch(id){
					case 'pass': playSound('pass'); logMsg(actor.name + ' passed the turn.'); break;
					case 'attack': {
						var base=(actor.power||0)*10 + rint(0,15); if(actor.bolster){ base+=50; actor.bolster=false; }
						applyDamageFromTo(actor, state.enemy, base);
						flash($enemyHpFill,'hit');
					} break;
					case 'defend': {
						if(actor.name === 'Eggling'){
							var bolsteredActive = actor.bolster || hasEffect(actor,'bolstered');
							var pct = bolsteredActive ? 0.25 : 0.5;
							addEffect(actor,{ id:'eguard', name:'Guard', rounds:3, pct:pct });
							if(actor.bolster){ actor.bolster=false; }
							removeEffect(actor,'bolstered');
							playSound('defend');
								logMsg(actor.name + ' braces for incoming damage (3 rounds).');
								actor.defend=false; actor.defendCharges=0;
						} else {
							actor.defend=true; actor.defendCharges=1;
							addEffect(actor,{id:'defended',name:'Defended',rounds:3});
							playSound('defend'); logMsg(actor.name + ' braced for incoming damage.');
						}
						actor.cooldowns = actor.cooldowns || {}; actor.cooldowns['defend'] = 5;
					} break;
					case 'bolster': {
						actor.bolster=true; addEffect(actor,{id:'bolstered',name:'Bolstered',rounds:2}); playSound('bolster'); logMsg(actor.name + ' bolstered their next ability.');
						actor.cooldowns = actor.cooldowns || {}; actor.cooldowns['bolster'] = 5;
					} break;
					case 'bleed': {
						var valB = Math.round((actor.power||0)*5 + rint(0,5));
						if(actor.bolster){ valB = Math.round(valB * 1.5); actor.bolster = false; removeEffect(actor,'bolstered'); }
						addEffect(state.enemy,{id:'dot',name:'Bleed',rounds:3,value: valB});
						playSound('poison');
						logMsg(actor.name + ' lashes out (' + valB + '/round).');
						actor.cooldowns = actor.cooldowns || {}; actor.cooldowns['bleed'] = 3;
						try{ var psB=document.querySelector('.combatant.player .sprite'); if(psB){ psB.classList.add('attack-bounce'); setTimeout(function(){ psB.classList.remove('attack-bounce'); }, 520); } }catch(e){}
					} break;
					case 'shatter': {
						var dmg=150, self=90; if(actor.bolster){ dmg=200; self=125; actor.bolster=false; }
						var applied = applyDamageFromTo(actor, state.enemy, dmg, 'suppress-log');
						var selfTaken = self;
						if(actor && actor.effects){
							for(var gi=0; gi<actor.effects.length; gi++){
								if(actor.effects[gi].id === 'eguard'){
									var gpct = (typeof actor.effects[gi].pct === 'number') ? actor.effects[gi].pct : 0.5;
									selfTaken = Math.round(selfTaken * gpct);
									break;
								}
							}
							for(var bi=0; bi<actor.effects.length; bi++){
								if(actor.effects[bi].id === 'bubble' && typeof actor.effects[bi].value === 'number'){
									selfTaken = Math.max(0, selfTaken - actor.effects[bi].value);
									break;
								}
							}
						}
						actor.hp = Math.max(0, actor.hp - selfTaken);
						playSound('chargeAttack');
						logMsg(actor.name + ' shatters ' + state.enemy.name + ' for ' + applied + ' damage and takes ' + selfTaken + '.', 'gray');
						actor.cooldowns = actor.cooldowns || {}; actor.cooldowns['shatter'] = 5;
					} break;
					case 'teamAttack': {
							var targets = state.enemyTeam.slice();
							for(var ti=0; ti<targets.length; ti++){
								var t = targets[ti]; if(!t || t.dead || t.hp<=0) continue;
								var baseA=(actor.power||0)*3.25 + rint(0,15); if(actor.bolster){ baseA+=35; }
								var hit = applyDamageFromTo(actor, t, baseA, 'suppress-log');
								logMsg(actor.name + ' struck ' + t.name + ' for ' + hit + ' damage.');
							}
							actor.bolster=false;
							actor.cooldowns = actor.cooldowns || {}; actor.cooldowns['teamAttack'] = 4;
							try{ playSound('chargeAttack'); }catch(e){}
							try{ var psT=document.querySelector('.combatant.player .sprite'); if(psT){ psT.classList.add('team-attack-right'); setTimeout(function(){ psT.classList.remove('team-attack-right'); }, 520); } }catch(e){}
							ensureActiveEnemyAlive();
							if(!state.enemy || state.enemy.dead || state.enemy.hp<=0){ finishBattle(); }
						} break;
					case 'crystalize': {
						actor.cooldowns = actor.cooldowns || {};
						var cd=actor.cooldowns['crystalize']||0; if(cd>0){ logMsg('Crystalize is on cooldown ('+cd+' rounds).','warn'); break; }
						var seq = [30,45,60];
						if(actor.bolster){ seq = [45,60,75]; actor.bolster=false; removeEffect(actor,'bolstered'); }
						addEffect(state.enemy,{ id:'crystalize', name:'Crystalized', rounds:3, step:0, seq: seq });
						actor.cooldowns['crystalize']=5;
						playSound('curse');
						var ps=document.querySelector('.combatant.player .sprite'); if(ps){ ps.classList.add('attack-bounce'); setTimeout(function(){ ps.classList.remove('attack-bounce'); }, 480); }
						logMsg({ text: actor.name + ' crystalizes ' + state.enemy.name + ' (3 rounds).', abilityId: 'crystalize' });
					} break;
					default: playSound('pass'); logMsg(actor.name + ' passed the turn.','info');
				}
				updateBars();
				setTimeout(function(){ endTurn('player'); }, 750);
			}, 900);
		}

		function renderBattle(){
			$setup.classList.add('hidden');
			$battle.classList.remove('hidden');
			document.body.classList.add('battle-visible');
			$restart.classList.add('hidden');
			$log.innerHTML='';
			renderActions(); updateRound(); updateBars(); setActiveTurn('player'); logMsg('Battle started!');
		}

		function makeBoss(){
			return { id:'boss-eggling-custom', 
				name:'Eggling', 
				type:'Boss', 
				maxHp:7000, 
				power:10, 
				healing:4, 
				image:'Sprites/Adult2.gif', 
				hp:7000, 
				effects:[], 
				defend:false,
				dead:false, 
				cooldowns:{} };
		}
		function makeEnemy(p){
			var e = JSON.parse(JSON.stringify(p));
			e.hp=e.maxHp; e.effects=[]; e.defend=false; e.dead=false;
			var loadouts = {
				Haju:['pass','toxin','chargeAttack','bolster','bleed'],
				Kivi:['pass','shatter','defend','attack','chargeHeal'],
				Tuuli:['pass','hurricane','attack','regen','bleed'],
				Vala:['pass','beam','teamHeal','bolster','attack'],
				Palo:['pass','scorch','attack','chargeAttack','bleed'],
				Vika:['pass','curse','chargeAttack','teamHeal','bolster'],
				Vesi:['pass','bubble','attack','bleed','regen'],
				Sieni:['pass','vines','attack','defend','bolster']
			};
			e.selectedAbilities = loadouts[e.name] || ['attack','defend','bleed','bolster'];
			return e;
		}
		function buildEnemyTeam(){
			var order=['Haju','Kivi','Tuuli','Vala','Palo','Vika','Vesi','Sieni'];
			var team=[];
			for(var i=0;i<order.length;i++){
				var base=PETS.find(function(pp){ return pp.name===order[i]; });
				if(base) team.push(makeEnemy(base));
			}
			state.enemyTeam = team; state.enemy = team[0];
			state.enemyInitialOrder = (team||[]).map(function(p){ return p && p.id; });
		}
		function startBattle(){
			state.player = makeBoss();
			buildEnemyTeam();
			state.turn='player'; state.round=1;
			state._displayHp={ player: state.player.maxHp, enemy: state.enemy.maxHp };
			updateNamesAndSprites(); renderBattle();
		}

		if($play){ $play.addEventListener('click', function(){ try{ playSound('start'); }catch(e){} if($splash) $splash.classList.add('hidden'); startBattle(); }); }
		if($backSplash){ $backSplash.addEventListener('click', function(){ if(document.referrer){ history.back(); } else { window.location.href = 'index.html'; } }); }
		if($back){ $back.addEventListener('click', function(){ playSound('restart'); $battle.classList.add('hidden'); if($splash) $splash.classList.remove('hidden'); state.turn='finished'; }); }
		if($home){ $home.addEventListener('click', function(){ playSound('restart'); window.location.href = '../index.html'; }); }
		if($restart){ $restart.addEventListener('click', function(){ playSound('restart'); window.location.reload(); }); }



		window.addEventListener('keydown', function(ev){
			try{
				if(['1','2','3','4','5','6','7','8'].indexOf(ev.key)>=0){
					if($battle.classList.contains('hidden')) return;
					if(state.turn!=='player' || state.inputLocked===true) return;
					var btn = document.querySelector('#actions button[data-key="' + ev.key + '"]');
					if(btn && !btn.disabled) btn.click();
				}
				if(ev.key==='Escape'){ if($back) $back.click(); }
			}catch(e){}
		});
	});
})();
