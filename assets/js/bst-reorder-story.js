(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const colors = {L:'#0c867c', R:'#287ac2', root:'#7556cf'};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pauseAll = [];
  function svgElement(tag, attrs = {}, text) {
    const e = document.createElementNS(NS,tag);
    Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));
    if(text !== undefined) e.textContent = text;
    return e;
  }
  function canvas(parent, label, height = 230) {
    const svg = svgElement('svg',{viewBox:`0 0 640 ${height}`,role:'img','aria-label':label,class:'bst-story-svg'});
    parent.append(svg); return svg;
  }
  function label(svg,x,y,text,cls='bst-svg-label') {svg.append(svgElement('text',{x,y,class:cls},text));}
  function token(svg,value,side,x,y) {
    const g = svgElement('g',{class:'bst-moving-token',transform:`translate(${x} ${y})`});
    g.append(svgElement('rect',{x:-22,y:-22,width:44,height:44,rx:12,fill:colors[side]}));
    g.append(svgElement('text',{'text-anchor':'middle','dominant-baseline':'central'},value));
    svg.append(g); return {g,x,y};
  }
  function move(t,x,y) {
    if(t.animation) t.animation.cancel();
    t.g.setAttribute('transform',`translate(${x} ${y})`);
    if(!reduced && (x !== t.x || y !== t.y)) {
      t.animation=t.g.animate([{transform:`translate(${t.x}px,${t.y}px)`},{transform:`translate(${x}px,${y}px)`}],{duration:550,easing:'ease-in-out'});
    }
    t.x=x;t.y=y;
  }
  function controls(lab,last,render) {
    const bar=document.createElement('div');bar.className='bst-controls';
    bar.innerHTML='<button type="button">Play</button><button type="button">Next step</button><button type="button">Reset</button>';
    lab.querySelector('.bst-story-stage').before(bar);
    const [play,next,reset]=bar.children;
    let frame=0,timer=null;
    const pause=()=>{clearInterval(timer);timer=null;play.textContent=frame===last?'Replay':'Play';};
    const draw=()=>{render(frame);next.disabled=frame===last;};
    const advance=()=>{if(frame<last)frame++;draw();if(frame===last)pause();};
    play.onclick=()=>{if(timer){pause();return;}if(frame===last)frame=0;draw();play.textContent='Pause';timer=setInterval(advance,1600);};
    next.onclick=()=>{pause();advance();};
    reset.onclick=()=>{pause();frame=0;draw();play.textContent='Play';};
    pauseAll.push(pause);draw();
  }
  function patterns(x,y) {
    if(!x)return ['R'.repeat(y)];if(!y)return ['L'.repeat(x)];
    return [...patterns(x-1,y).map(s=>'L'+s),...patterns(x,y-1).map(s=>'R'+s)];
  }
  function merge(left,right,mask) {let l=0,r=0;return [...mask].map(s=>s==='L'?left[l++]:right[r++]);}
  const masks=patterns(2,2);
  const partition=document.querySelector('[data-story="partition"]');
  if(partition) {
    const svg=canvas(partition.querySelector('.bst-story-stage'),'Partition the input into a root and two ordered subsequences',300);
    label(svg,320,24,'INPUT → ROOT + TWO SUBSEQUENCES');
    label(svg,125,278,'LEFT · smaller than 3');label(svg,505,278,'RIGHT · larger than 3');
    const values=[3,4,5,1,2];const tokens=values.map((v,i)=>token(svg,v,v===3?'root':v<3?'L':'R',100+i*110,75));
    const targets={3:[320,160],1:[85,230],2:[165,230],4:[465,230],5:[545,230]};
    const captions=['Start with [3,4,5,1,2]. Scan from left to right.','3 is first, so the root is fixed.','4 > 3: append 4 to the right subsequence.','5 > 3: append 5 after 4 on the right.','1 < 3: append 1 to the left subsequence.','2 < 3: append 2 after 1 on the left. The relative order on each side is preserved.'];
    controls(partition,5,frame=>{tokens.forEach((t,i)=>move(t,...(i<frame?targets[values[i]]:[100+i*110,75])));partition.querySelector('.bst-story-status').textContent=captions[frame];});
  }
  const blocks=document.querySelector('[data-story="blocks"]');
  if(blocks) {
    const svg=canvas(blocks.querySelector('.bst-story-stage'),'Six interleavings of left 1,2 and right 4,5',170);
    const tokens=[3,1,2,4,5].map((v,i)=>token(svg,v,v===3?'root':v<3?'L':'R',80+120*i,80));
    const orderMasks=['LLRR','RRLL','LRLR','LRRL','RLLR','RLRL'];
    label(svg,320,145,'The order within each color never changes.');
    controls(blocks,5,frame=>{const order=[3,...merge([1,2],[4,5],orderMasks[frame])];tokens.forEach((t,i)=>move(t,80+120*order.indexOf([3,1,2,4,5][i]),80));blocks.querySelector('.bst-story-status').textContent=`${frame+1} / 6 · ${orderMasks[frame].split('').join(' ')} → [${order.join(',')}]. ${frame<2?'A compact block arrangement.':'A valid mixed order that the compact-block assumption misses.'}`;});
  }
  const depth=document.querySelector('[data-story="depth"]');
  if(depth) {
    const svg=canvas(depth.querySelector('.bst-story-stage'),'Insertion can visit level 3 before finishing level 2',310);
    const pos={4:[320,45],2:[175,140],6:[465,140],1:[100,235],3:[245,235],5:[395,235],7:[540,235]};
    [45,140,235].forEach((y,i)=>{svg.append(svgElement('line',{x1:25,y1:y,x2:610,y2:y,class:'bst-level-line'}));label(svg,50,y-28,`Level ${i+1}`);});
    const links=[[4,2],[4,6],[2,1],[2,3],[6,5],[6,7]].map(([a,b])=>{const e=svgElement('line',{x1:pos[a][0],y1:pos[a][1],x2:pos[b][0],y2:pos[b][1],class:'bst-edge'});svg.append(e);return {e,b};});
    const seq=[4,2,1,3,6,5,7];const tokens=seq.map(v=>token(svg,v,v===4?'root':v<4?'L':'R',...pos[v]));
    const captions=['Empty tree. The outlines show the target.','Insert 4: level 1.','Insert 2: level 2, left of 4.','Insert 1: level 3! Node 6 on level 2 is still absent.','Insert 3: another level-3 node arrives before 6.','Now insert 6 on level 2. The earlier deeper insertions caused no problem.','Insert 5: left child of 6.','Insert 7: right child of 6. Same tree, without level-by-level insertion.'];
    const seqLabel=svgElement('text',{x:320,y:292,class:'bst-svg-label'});svg.append(seqLabel);
    controls(depth,7,frame=>{tokens.forEach((t,i)=>{t.g.style.opacity=i<frame?'1':'.16';t.g.classList.toggle('bst-token-current',i===frame-1);});links.forEach(({e,b})=>e.style.opacity=seq.indexOf(b)<frame?'1':'.16');seqLabel.textContent=`Inserted: [${seq.slice(0,frame).join(', ')}]`;depth.querySelector('.bst-story-status').textContent=captions[frame];});
  }
  const slotLab=document.getElementById('bst-slot-lab');
  if(slotLab) {
    const svg=canvas(slotLab.querySelector('.bst-merge-stage'),'Merge the two fixed orders into the chosen slots',190);
    label(svg,320,24,'ROOT + FOUR CHOSEN SLOTS');
    const vals=[3,1,2,4,5];const tokens=vals.map((v,i)=>token(svg,v,v===3?'root':v<3?'L':'R',80+120*i,85));
    const choices=slotLab.querySelector('.bst-slot-buttons');let mask='LLRR',timer=null;
    for(let i=0;i<4;i++){const b=document.createElement('button');b.type='button';b.onclick=()=>{pause();mask=mask.slice(0,i)+(mask[i]==='L'?'R':'L')+mask.slice(i+1);render();};choices.append(b);}
    const play=slotLab.querySelector('[data-slot="play"]');
    function pause(){clearInterval(timer);timer=null;play.textContent='Play choices';}
    function render(){
      const count=[...mask].filter(s=>s==='L').length,valid=count===2;
      [...choices.children].forEach((b,i)=>{b.textContent=`Slot ${i+1}: ${mask[i]}`;b.className=mask[i]==='L'?'bst-slot-left':'bst-slot-right';b.setAttribute('aria-pressed',String(mask[i]==='L'));b.setAttribute('aria-label',`Slot ${i+1}: ${mask[i]==='L'?'left':'right'}. Switch side`);});
      const order=valid?[3,...merge([1,2],[4,5],mask)]:vals;
      tokens.forEach((t,i)=>{move(t,80+120*order.indexOf(vals[i]),85);t.g.style.opacity=valid?'1':'.25';});
      slotLab.querySelector('.bst-slot-status').textContent=valid?`Choice ${masks.indexOf(mask)+1} / 6 · ${mask.split('').join(' ')} → [${order.join(',')}]. Two left slots force the other two right slots.`:`${count} left slots selected; choose exactly 2. This pattern cannot hold the fixed groups of 2 and 2.`;
    }
    function next(){mask=masks[(masks.indexOf(mask)+1)%masks.length];render();}
    play.onclick=()=>{if(timer){pause();return;}if(!masks.includes(mask))mask=masks[0];render();play.textContent='Pause';timer=setInterval(next,1500);};
    slotLab.querySelector('[data-slot="next"]').onclick=()=>{pause();next();};
    slotLab.querySelector('[data-slot="reset"]').onclick=()=>{pause();mask=masks[0];render();};
    pauseAll.push(pause);slotLab.querySelector('.bst-controls').hidden=false;render();
  }
  const factors=document.getElementById('bst-factor-lab');
  if(factors) {
    const left=[[2,1,3],[2,3,1]],right=[[6,5,7],[6,7,5]],choices=patterns(3,3);
    let l=0,r=0,m=0;
    const svg=canvas(factors.querySelector('.bst-factor-stage'),'One of eighty insertion orders for the seven-node tree',150);
    const vals=[4,2,1,3,6,5,7];const tokens=vals.map((v,i)=>token(svg,v,v===4?'root':v<4?'L':'R',50+90*i,70));
    function render(){const order=[4,...merge(left[l],right[r],choices[m])];tokens.forEach((t,i)=>move(t,50+90*order.indexOf(vals[i]),70));factors.querySelector('.bst-factor-readout').textContent=`Left: [${left[l]}] · Right: [${right[r]}] · Pattern ${m+1}/20: ${choices[m].split('').join(' ')}`;factors.querySelector('.bst-factor-status').textContent=`Combination ${l*40+r*20+m+1} / 80 → [${order.join(',')}]. Each triple gives a distinct valid order.`;}
    factors.querySelector('[data-factor="left"]').onclick=()=>{l=1-l;render();};
    factors.querySelector('[data-factor="right"]').onclick=()=>{r=1-r;render();};
    factors.querySelector('[data-factor="mask"]').onclick=()=>{m=(m+1)%20;render();};
    factors.querySelector('.bst-controls').hidden=false;render();
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseAll.forEach(pause=>pause());});
})();
