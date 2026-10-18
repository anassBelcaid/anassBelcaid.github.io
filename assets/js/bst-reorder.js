(() => {
  'use strict';
  const lab = document.getElementById('bst-reorder-lab');
  if (!lab) return;
  const orders = [[3,4,5,1,2],[3,1,2,4,5],[3,1,4,2,5],[3,1,4,5,2],[3,4,1,2,5],[3,4,1,5,2]];
  const positions = {3:[120,40],1:[60,115],2:[90,190],4:[180,115],5:[210,190]};
  const edges = [[3,1],[1,2],[3,4],[4,5]];
  const color = v => v === 3 ? '#7556cf' : v < 3 ? '#0c867c' : '#287ac2';
  // Build real insertion traces: each comparison and placement is one beat.
  function trace(order) {
    let root = null;
    const placed = [], events = [{placed:[], index:-1, at:null, text:'Ready. The first value will become the root.'}];
    order.forEach((value,index) => {
      const node = {value,left:null,right:null};
      if (!root) root = node;
      else {
        let cursor = root;
        while (true) {
          const side = value < cursor.value ? 'left' : 'right';
          events.push({placed:[...placed],index,at:cursor.value,text:`${value} ${side === 'left' ? '<' : '>'} ${cursor.value}: go ${side}.`});
          if (!cursor[side]) { cursor[side] = node; break; }
          cursor = cursor[side];
        }
      }
      placed.push(value);
      events.push({placed:[...placed],index,at:value,text:index === 0 ? `Insert ${value} as the root.` : `Insert ${value} in the empty position.${index === 4 ? ' Same BST ✓' : ''}`});
    });
    return events;
  }
  const traces = orders.map(trace);
  const last = Math.max(...traces.map(t => t.length)) - 1;
  const cards = orders.map((order,i) => {
    const card = document.createElement('section');
    card.className = 'bst-card';
    card.innerHTML = `<h3>${i === 0 ? 'ORIGINAL · excluded' : `ALTERNATIVE ${i} · counted`}</h3><div class="bst-sequence" aria-label="Insertion order ${order.join(', ')}">${order.map(v=>`<span>${v}</span>`).join('')}</div><svg viewBox="0 0 260 230" role="img" aria-label="BST construction"><g>${edges.map(([a,b])=>`<line class="bst-edge bst-ghost" data-child="${b}" x1="${positions[a][0]}" y1="${positions[a][1]}" x2="${positions[b][0]}" y2="${positions[b][1]}"/>`).join('')}</g>${[3,1,2,4,5].map(v=>`<g class="bst-node bst-ghost" data-value="${v}" transform="translate(${positions[v].join(' ')})"><circle r="21" fill="${color(v)}"/><text>${v}</text></g>`).join('')}<g class="bst-traveler" opacity="0"><circle r="27"/></g></svg><p></p>`;
    lab.querySelector('.bst-cards').appendChild(card);
    return card;
  });
  const play = lab.querySelector('[data-action="play"]');
  const step = lab.querySelector('[data-action="step"]');
  const speed = lab.querySelector('select');
  let beat = 0, timer = null;
  function render() {
    cards.forEach((card,i) => {
      const event = traces[i][Math.min(beat,traces[i].length-1)];
      card.querySelectorAll('.bst-node').forEach(n=>n.classList.toggle('bst-ghost',!event.placed.includes(Number(n.dataset.value))));
      card.querySelectorAll('.bst-edge').forEach(e=>e.classList.toggle('bst-ghost',!event.placed.includes(Number(e.dataset.child))));
      card.querySelectorAll('.bst-sequence span').forEach((s,j)=>{s.classList.toggle('current',j === event.index);s.classList.toggle('consumed',event.placed.includes(orders[i][j]));});
      const ring = card.querySelector('.bst-traveler');
      ring.setAttribute('opacity',event.at === null ? '0' : '1');
      if (event.at !== null) ring.style.transform = `translate(${positions[event.at][0]}px,${positions[event.at][1]}px)`;
      card.querySelector('p').textContent = event.text;
      card.querySelector('svg').setAttribute('aria-label',`Order ${orders[i].join(', ')}. Inserted: ${event.placed.join(', ') || 'none'}. ${event.text}`);
    });
    lab.querySelector('.bst-progress').textContent = beat === last ? 'All six trees match. Exclude the original → answer: 5.' : `Beat ${beat} / ${last} · gold marks the incoming value’s position.`;
    step.disabled = beat === last;
  }
  function pause() { clearInterval(timer); timer = null; play.textContent = beat === last ? 'Replay all' : 'Play all'; }
  function advance() { if (beat < last) beat++; render(); if (beat === last) pause(); }
  function start() { if (beat === last) beat = 0; render(); play.textContent = 'Pause'; timer = setInterval(advance,Number(speed.value)); }
  play.addEventListener('click',()=>timer ? pause() : start());
  step.addEventListener('click',()=>{pause();advance();});
  lab.querySelector('[data-action="reset"]').addEventListener('click',()=>{pause();beat=0;render();play.textContent='Play all';});
  speed.addEventListener('change',()=>{if(timer) {pause();start();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden) pause();});
  lab.querySelector('.bst-controls').hidden = false;
  render();
})();
