(() => {
  'use strict';
  const root = document.getElementById('home-experience');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.getElementById('motion-toggle');
  let paused = reduced.matches;
  let canvasVisible = true;
  let animation = null;
  let elapsed = 0;
  let previousTime = 0;
  const canvas = document.getElementById('quantum-canvas');
  const ctx = canvas.getContext('2d');
  let width = 1, height = 1;
  const pointer = {x: 0, y: 0};
  const tilt = {x: 0, y: 0};
  const colors = ['#7adeff', '#af9bff', '#78e4bd'];

  function project(x, y, z = 0) {
    const angle = -.12 + Math.sin(elapsed * .14) * .07 + tilt.x * .08;
    const a = x * Math.cos(angle) - y * Math.sin(angle);
    const b = x * Math.sin(angle) + y * Math.cos(angle);
    const unit = width * .053;
    return [width * .5 + (a - b) * unit, height * .48 + (a + b) * unit * (.49 + tilt.y * .05) - z * width / 520];
  }
  function path(points, close = false) {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); if (close) ctx.closePath();
  }
  function circle(point, radius, color) { ctx.beginPath(); ctx.arc(...point, radius, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
  function board(z, opacity) {
    const points = [[-3.9,-3.9],[3.9,-3.9],[3.9,3.9],[-3.9,3.9]].map(p => project(...p,z));
    path(points,true); ctx.fillStyle = `rgba(19,32,57,${opacity})`; ctx.fill(); ctx.strokeStyle = `rgba(112,151,213,${opacity * .44})`; ctx.lineWidth = 1; ctx.stroke();
  }
  function draw() {
    if (!ctx) return;
    ctx.clearRect(0,0,width,height);
    const halo = ctx.createRadialGradient(width*.5,height*.5,0,width*.5,height*.5,width*.5);
    halo.addColorStop(0,'#5365c328'); halo.addColorStop(.65,'#295e8e0b'); halo.addColorStop(1,'#070c1800'); ctx.fillStyle = halo; ctx.fillRect(0,0,width,height);
    // Orbital traces surround a layered, isometric chip. All geometry is illustrative.
    for (let ring=0;ring<2;ring++) {
      const points=[];
      for(let n=0;n<=100;n++) { const a=n/100*Math.PI*2; points.push(project(Math.cos(a)*(5.5+ring*.5),Math.sin(a)*(5.5+ring*.5), Math.sin(a)*20-12)); }
      path(points); ctx.strokeStyle=ring?'#849edf0b':'#8ddaff1b';ctx.lineWidth=1;ctx.stroke();
      const angle=elapsed*.18+ring*Math.PI;
      const point=project(Math.cos(angle)*(5.5+ring*.5),Math.sin(angle)*(5.5+ring*.5),Math.sin(angle)*20-12);
      ctx.shadowColor=colors[ring];ctx.shadowBlur=12;circle(point,2,colors[ring]);ctx.shadowBlur=0;
    }
    board(-35,.3);board(-21,.55);board(-7,.9);
    const nodes=[];
    for(let row=0;row<7;row++) for(let col=0;col<7;col++) {
      const group=col<3?0:row<4?1:2;
      nodes.push({x:col-3,y:row-3,group});
    }
    const edges=[];
    nodes.forEach((node,i)=>{ if(i%7<6) edges.push([i,i+1]); if(i<42) edges.push([i,i+7]); });
    edges.forEach(([from,to],i)=>{
      const a=nodes[from],b=nodes[to];const color=colors[a.group];const same=a.group===b.group;
      const p=project(a.x,a.y,3),q=project(b.x,b.y,3);path([p,q]);ctx.strokeStyle=same?color+'48':'#95afd520';ctx.lineWidth=same?1.2:.6;ctx.stroke();
      if(same && i%3===0) { const t=(elapsed*.3+i*.173)%1;ctx.shadowColor=color;ctx.shadowBlur=8;circle([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t],1.8,color);ctx.shadowBlur=0; }
    });
    nodes.forEach((node,i)=>{
      const p=project(node.x,node.y,3),q=project(node.x,node.y,10);const color=colors[node.group];
      path([p,q]);ctx.strokeStyle=color+'55';ctx.stroke();circle(p,3.5,color+'16');
      const pulse=(Math.sin(elapsed*1.4+i*.7)+1)/2;
      ctx.shadowColor=color;ctx.shadowBlur=7+pulse*8;circle(q,2.4+pulse*.7,color);ctx.shadowBlur=0;circle(q,1.2,'#f0ffff');
    });
    // Pins fan out from the chip substrate, keeping the visual recognizably hardware-like.
    for(let n=-3;n<=3;n++) for(const sign of [-1,1]) { path([project(n,sign*3.9,-9),project(n,sign*4.35,-9)]);ctx.strokeStyle='#7693c653';ctx.lineWidth=2;ctx.stroke();path([project(sign*3.9,n,-9),project(sign*4.35,n,-9)]);ctx.stroke(); }
    for(let i=0;i<18;i++){const x=(Math.sin(i*43.1)+1)*width*.5;const y=(Math.cos(i*17.3)+1)*height*.45;circle([x,y+Math.sin(elapsed*.3+i)*5],i%3===0?1.2:.6,'#83a7da45');}
  }
  function running() { return !paused && !document.hidden && canvasVisible && Boolean(ctx); }
  function frame(time) {
    animation=null;if(!running()){previousTime=0;return;}
    if(time-previousTime>=30){elapsed+=previousTime?Math.min((time-previousTime)/1000,.1):0;previousTime=time;tilt.x+=(pointer.x-tilt.x)*.045;tilt.y+=(pointer.y-tilt.y)*.045;draw();}
    animation=requestAnimationFrame(frame);
  }
  function syncMotion() {
    root.classList.toggle('is-motion-paused',paused||document.hidden);
    toggle.setAttribute('aria-pressed',String(paused));document.getElementById('motion-label').textContent=paused?'启用动效':'暂停动效';
    if(animation!==null)cancelAnimationFrame(animation);animation=null;previousTime=0;
    if(running())animation=requestAnimationFrame(frame);else draw();
  }
  toggle.addEventListener('click',()=>{paused=!paused;syncMotion();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;syncMotion();});
  document.addEventListener('visibilitychange',syncMotion);
  window.addEventListener('pagehide',()=>{if(animation!==null)cancelAnimationFrame(animation);animation=null;});
  window.addEventListener('pageshow',syncMotion);
  canvas.addEventListener('pointermove',event=>{if(event.pointerType==='touch'||paused)return;const box=canvas.getBoundingClientRect();pointer.x=(event.clientX-box.left)/box.width-.5;pointer.y=(event.clientY-box.top)/box.height-.5;});
  canvas.addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0;});
  new ResizeObserver(()=>{const box=canvas.getBoundingClientRect();width=box.width;height=box.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);draw();}).observe(canvas);
  new IntersectionObserver(entries=>{canvasVisible=entries[0].isIntersecting;syncMotion();},{rootMargin:'50px'}).observe(canvas);

  const strategies={
    gsp:{kicker:'STRUCTURE FIRST',title:['把紧密相连的计算，','放在一起。'],description:'从量子比特之间的交互关系出发，将线路划分为相互协作的子区域，让分区边界尽量避开频繁交互。',benefits:['以减少跨分区通信为优化目标','兼顾分区规模与资源分配','图结构直观，便于分析与对照'],label:'INTERACTION GRAPH',principle:'减少跨区连接，保留区内协作'},
    qhsp:{kicker:'HARDWARE AWARE',title:['让分区策略，','理解硬件的约束。'],description:'将芯片拓扑与误差模型纳入分区和映射的考量，让方案适应目标硬件的连接关系与资源条件。',benefits:['面向拓扑连接关系选择映射','关注额外 SWAP 操作的开销','综合考虑通信成本与噪声影响'],label:'HARDWARE CONNECTIVITY',principle:'结合硬件约束，权衡映射与通信'},
    dqp:{kicker:'DYNAMIC PARTITIONING',title:['让计算边界，','随任务需求调整。'],description:'把分区视为可调整的计算边界，在连通性、跨区通信和资源规模之间，探索适合当前任务的分配方式。',benefits:['强调分区内部的拓扑连通性','以降低跨分区量子门开销为目标','为变化的任务与资源探索分区方案'],label:'ADAPTIVE BOUNDARIES',principle:'调整计算边界，保持区内连通'}
  };
  const graph=document.getElementById('algorithm-graph');const ns='http://www.w3.org/2000/svg';
  function svg(tag,attributes){const el=document.createElementNS(ns,tag);Object.entries(attributes).forEach(([key,value])=>el.setAttribute(key,value));return el;}
  const points=Array.from({length:24},(_,i)=>({x:52+(i%6)*67,y:60+Math.floor(i/6)*53}));
  const regions=points.map(p=>{const el=svg('circle',{cx:p.x,cy:p.y,r:28,class:'graph-region'});graph.append(el);return el;});
  const graphEdges=[];
  points.forEach((p,i)=>{const next=[];if(i%6<5)next.push(i+1);if(i<18)next.push(i+6);next.forEach(j=>{const el=svg('line',{x1:p.x,y1:p.y,x2:points[j].x,y2:points[j].y,'stroke-width':1.4,class:'graph-edge'});graph.append(el);graphEdges.push({el,a:i,b:j});});});
  const dots=points.map((p,i)=>{const el=svg('circle',{cx:p.x,cy:p.y,r:5,'stroke-width':1.5,class:'graph-node'});graph.append(el);return el;});
  function group(index,key){const col=index%6,row=Math.floor(index/6);if(key==='qhsp')return col>=3?2:row<2?0:1;if(key==='dqp')return col<2||(col===2&&row===0)?0:col>=4||(col===3&&row===3)?2:1;return Math.floor(col/2);}
  function paintGraph(key){dots.forEach((dot,i)=>{const color=colors[group(i,key)];dot.setAttribute('fill',color+'44');dot.setAttribute('stroke',color);regions[i].setAttribute('fill',color+'09');});graphEdges.forEach(edge=>{const same=group(edge.a,key)===group(edge.b,key);edge.el.setAttribute('stroke',same?colors[group(edge.a,key)]+'85':'#526580');edge.el.setAttribute('opacity',same?'1':'.3');edge.el.classList.toggle('graph-signal',same&&edge.a%3===0);});graph.setAttribute('aria-label',`${key.toUpperCase()} 分区策略示意，彩色节点表示不同计算区域`);}
  const tabs=[...document.querySelectorAll('.algorithm-tab')];
  function select(key){const data=strategies[key];tabs.forEach(tab=>{const active=tab.dataset.strategy===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});const panel=document.getElementById('algorithm-detail');panel.dataset.strategy=key;panel.setAttribute('aria-labelledby',`tab-${key}`);const title=document.getElementById('algorithm-title');title.replaceChildren(document.createTextNode(data.title[0]),document.createElement('br'),document.createTextNode(data.title[1]));['kicker','description','principle'].forEach(field=>document.getElementById(`algorithm-${field}`).textContent=data[field]);document.getElementById('algorithm-visual-label').textContent=data.label;document.getElementById('algorithm-benefits').replaceChildren(...data.benefits.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));paintGraph(key);}
  tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>select(tab.dataset.strategy));tab.addEventListener('keydown',event=>{let target;if(event.key==='ArrowRight')target=(index+1)%tabs.length;else if(event.key==='ArrowLeft')target=(index+tabs.length-1)%tabs.length;else if(event.key==='Home')target=0;else if(event.key==='End')target=tabs.length-1;else return;event.preventDefault();tabs[target].focus();select(tabs[target].dataset.strategy);});});
  paintGraph('gsp');

  const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}}),{threshold:.08});
  root.querySelectorAll('.home-reveal').forEach(el=>reveal.observe(el));root.classList.add('home-motion-ready');
  let scrollPending=false;
  function updateScroll(){scrollPending=false;const max=document.documentElement.scrollHeight-innerHeight;root.style.setProperty('--page-progress',String(max>0?Math.min(1,scrollY/max):0));}
  window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll);}},{passive:true});updateScroll();
  root.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{const target=document.querySelector(link.getAttribute('href'));if(target){event.preventDefault();target.scrollIntoView({behavior:paused||reduced.matches?'instant':'smooth',block:'start'});}}));
  const menu=document.getElementById('mobileMenuToggle');const sidebar=document.querySelector('.sidebar-nav');
  function closeMenu(){sidebar.classList.remove('open');menu.setAttribute('aria-expanded','false');}
  menu.addEventListener('click',()=>{const open=sidebar.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  document.addEventListener('click',event=>{if(innerWidth<=768&&!sidebar.contains(event.target)&&!menu.contains(event.target))closeMenu();});
  window.addEventListener('resize',()=>{if(innerWidth>768)closeMenu();});
  syncMotion();
})();
