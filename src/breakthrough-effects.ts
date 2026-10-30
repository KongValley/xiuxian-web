import { SCENE_TIMING } from './breakthrough-scene.js';
import type { BreakthroughScene } from './breakthrough-scene.js';

const MOTION_KEY='wendao-breakthrough-animation';
let memoryEnabled: boolean|undefined;
export function animationPreference(): {enabled:boolean;systemReduced:boolean} {
  let enabled=memoryEnabled??true;
  try{if(memoryEnabled===undefined)enabled=localStorage.getItem(MOTION_KEY)!=='off';}catch{/* Session preference remains available without storage. */}
  return {enabled,systemReduced:window.matchMedia('(prefers-reduced-motion: reduce)').matches};
}
export function setAnimationEnabled(enabled: boolean): void {
  memoryEnabled=enabled;
  try{localStorage.setItem(MOTION_KEY,enabled?'on':'off');}catch{/* Do not interrupt the game for a visual preference. */}
}

interface Point {x:number;y:number}
interface Bolt {at:number;points:Point[];branches:Point[][]}
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>1-Math.pow(1-clamp(n),3);
const palettes={immortal:{rgb:'170, 211, 174',ink:'#6eac98',light:'#eef4d2'},demon:{rgb:'217, 149, 139',ink:'#a55765',light:'#f8dbc0'},yao:{rgb:'217, 193, 134',ink:'#a58a51',light:'#fff0bc'}};
function makeBolt(at:number,index:number,w:number,h:number): Bolt {
  const cx=w*.5,cy=h*.62,scale=Math.min(w,h);
  const points: Point[]=[{x:cx+(index%2?1:-1)*scale*.17,y:-h*.04}];
  for(let j=1;j<12;j++){
    const t=j/12,previous=points[j-1];
    points.push({x:cx+Math.sin(j*2.9+index*1.7)*scale*.09*(1-t)+(index%2?1:-1)*scale*.12*(1-t),y:previous.y+(cy+h*.04)/12});
  }
  points.push({x:cx,y:cy});
  const branches: Point[][]=[];
  for(const [j,side]of [[3,-1],[5,1],[7,-1]]){
    const start=points[j];branches.push([start,{x:start.x+side*scale*.07,y:start.y+scale*.04},{x:start.x+side*scale*.12,y:start.y+scale*.055},{x:start.x+side*scale*.16,y:start.y+scale*.13}]);
  }
  return {at,points,branches};
}

/** A modal, finite presentation; it never mutates game state or rolls randomness. */
export function playBreakthrough(scene: BreakthroughScene): Promise<void> {
  return new Promise(resolve=>{
    const view=document.createElement('dialog');
    view.className='breakthrough-cinema';view.setAttribute('aria-labelledby','breakthrough-title');
    view.dataset.kind=scene.kind;view.dataset.path=scene.path||'immortal';view.dataset.phase='gather';
    const palette=palettes[scene.path||'immortal'];view.style.setProperty('--fx-rgb',palette.rgb);
    view.innerHTML=`<canvas class="breakthrough-canvas" aria-hidden="true"></canvas><div class="fx-vignette" aria-hidden="true"></div><div class="fx-frame" aria-hidden="true"></div><div class="fx-heading"><span class="fx-seal" aria-hidden="true">境</span><div><span class="fx-chapter"></span><span class="fx-context"></span></div><button type="button" class="fx-skip">跳过动画 <span aria-hidden="true">↗</span></button></div><div class="fx-title-group"><p class="fx-kicker"></p><h2 id="breakthrough-title"></h2><p class="fx-target"></p></div><div class="fx-cultivator" aria-hidden="true"><svg viewBox="0 0 200 180"><defs><linearGradient id="fx-robe" x2="0" y2="1"><stop stop-color="#627b72"/><stop offset="1" stop-color="#0e1c19"/></linearGradient></defs><ellipse cx="100" cy="162" rx="75" ry="7" fill="#030a08"/><path d="M93 36q-12-18 1-23q18-3 13 24" fill="#0a1312"/><path d="M88 37q-5-11-1-22q2-15 16-9q9 5 10 18l-5 21" fill="#0b1513"/><path d="M90 27q0-14 11-11q12 5 5 23l-7 7-9-7Z" fill="#9fafa0"/><path d="M93 40l-10 11-12 21-14 44 27 24 37-2 28-23-17-43-15-23-13-8-6 22Z" fill="url(#fx-robe)"/><path d="M94 44l6 23 8-23M100 66l-7 57M84 65l-8 40 20 14M118 64l11 39-24 16" stroke="#a9bd9d" stroke-opacity=".3" fill="none"/><path d="M72 109q-32 8-39 37-2 11 12 12l56-17 56 17q13-1 9-12-10-30-39-36l-27 13Z" fill="#1d3029"/><path d="M74 109l24 14 25-14M43 148l43-17m29 0 40 17" stroke="#7b9380" stroke-opacity=".35" fill="none"/><path d="M86 113q9-5 14 4 8-9 15-4l-12 10-16-4Z" fill="#9caf9b"/><path d="M105 12l22-8" stroke="#9eaf8d" stroke-width="2"/></svg></div><div class="fx-caption"><p class="fx-stage" role="status" aria-live="polite"></p><div class="fx-progress" role="progressbar" aria-label="突破演出进度" aria-valuemin="0" aria-valuemax="100"><span></span></div><p class="fx-verse"></p></div><section class="fx-result" hidden aria-live="polite"><p class="fx-result-kind"></p><h3></h3><p class="fx-result-realm"></p><p class="fx-result-detail"></p><button type="button" class="fx-continue">继续修行 <span aria-hidden="true">→</span></button></section>`;
    const node=<T extends HTMLElement=HTMLElement>(selector:string):T=>view.querySelector<T>(selector)!;
    node('.fx-chapter').textContent=scene.preview?'演出预览 · 山中观想':scene.kind==='ascension'?'飞升之劫 · 天门将启':scene.kind==='major'?'大境突破 · 天雷试道':'小境突破 · 灵气归元';
    node('.fx-context').textContent=scene.from;
    node('.fx-kicker').textContent=scene.kind==='minor'?'一念澄明 · 周天流转':'天地为炉 · 以身问道';
    node('#breakthrough-title').textContent=scene.kind==='ascension'?'叩 问 天 门':scene.kind==='major'?'逆 雷 破 境':'灵 台 生 辉';
    node('.fx-target').textContent=scene.target;
    node('.fx-verse').textContent=scene.kind==='minor'?'静听灵气入丹田，一寸道心向长生。':'雷霆落处，仍有一念不灭。';
    const result=node('.fx-result'),skip=node<HTMLButtonElement>('.fx-skip'),continueButton=node<HTMLButtonElement>('.fx-continue');
    const canvas=node<HTMLCanvasElement>('canvas'),ctx=canvas.getContext('2d');
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference=animationPreference();
    const reduced=!preference.enabled||preference.systemReduced||!ctx;
    view.dataset.reduced=String(reduced);
    let frame=0,finished=false,revealed=false,start=performance.now(),width=0,height=0,bolts:Bolt[]=[],lastPercent=-1,lastStage='';
    const timing=SCENE_TIMING[scene.kind];
    const controls=new AbortController();
    const previousOverflow=document.documentElement.style.overflow;
    const resize=()=>{
      const box=view.getBoundingClientRect();width=box.width;height=box.height;
      const ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      ctx?.setTransform(ratio,0,0,ratio,0,0);
      bolts=timing.strikes.map((at,i)=>makeBolt(at,i,width,height));
      if(revealed)draw(timing.duration);
    };
    const observer=new ResizeObserver(resize);
    function finish():void {
      if(finished)return;finished=true;cancelAnimationFrame(frame);observer.disconnect();controls.abort();media.removeEventListener('change',motionChange);
      if(view.open)view.close();view.remove();document.documentElement.style.overflow=previousOverflow;resolve();
    }
    function reveal():void {
      if(revealed||finished)return;revealed=true;cancelAnimationFrame(frame);view.dataset.phase='result';view.dataset.success=String(scene.success);
      node('.fx-result-kind').textContent=scene.preview?'观想演出 · 不改变存档':scene.success?'仙途新章':'道心未折';
      node('h3').textContent=scene.headline;node('.fx-result-realm').textContent=scene.destination;node('.fx-result-detail').textContent=scene.detail;
      result.hidden=false;node('.fx-progress').setAttribute('aria-valuenow','100');node('.fx-progress span').style.width='100%';
      skip.textContent='收起演出 ↗';continueButton.focus({preventScroll:true});
      if(ctx)draw(timing.duration);
    }
    function motionChange():void {if(media.matches){view.dataset.reduced='true';reveal();}}
    function stroke(points:Point[],color:string,lineWidth:number,alpha:number,glow=0):void {
      if(!ctx||!points.length)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=lineWidth;ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor=color;ctx.shadowBlur=glow;
      ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();
    }
    function draw(elapsed:number):void {
      if(!ctx||!width||!height)return;
      const w=width,h=height,cx=w*.5,cy=h*.65,unit=Math.min(w,h),progress=clamp(elapsed/timing.duration),settled=revealed;
      ctx.clearRect(0,0,w,h);
      const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#07100f');sky.addColorStop(.6,'#152820');sky.addColorStop(1,'#07130f');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
      const halo=ctx.createRadialGradient(cx,cy,0,cx,cy,unit*.6);halo.addColorStop(0,`rgba(${palette.rgb},${settled?.06:.07+progress*.05})`);halo.addColorStop(1,'transparent');ctx.fillStyle=halo;ctx.fillRect(0,0,w,h);
      // Distant ridges form an ink landscape behind the cultivator.
      for(let layer=0;layer<3;layer++){
        ctx.beginPath();ctx.moveTo(0,h);
        for(let x=0;x<=w+20;x+=20){const y=h*(.57+layer*.13)-Math.abs(Math.sin(x/w*8.5+layer*1.8))*h*(.11-layer*.025)+Math.sin(x*.023+layer)*h*.015;ctx.lineTo(x,y);}
        ctx.lineTo(w,h);ctx.closePath();ctx.fillStyle=['#20372b66','#12271d99','#091a12'][layer];ctx.fill();
      }
      // Slow cloud banks, denser for the three/four thunder trials.
      if(scene.kind!=='minor')for(let i=0;i<9;i++){
        const x=((i*w/7+Math.sin(elapsed*.00016+i)*w*.05)%(w*1.3))-w*.15,y=h*.02+Math.sin(i*2.7)*h*.055;
        const cloud=ctx.createRadialGradient(x,y,0,x,y,w*.29);cloud.addColorStop(0,`rgba(55,69,66,${.38+progress*.17})`);cloud.addColorStop(.7,'rgba(12,22,21,.35)');cloud.addColorStop(1,'transparent');ctx.fillStyle=cloud;ctx.fillRect(0,0,w,h*.42);
      }
      // A perspective talisman circle with two rotating layers of geometry.
      ctx.save();ctx.translate(cx,cy+h*.045);ctx.scale(1,.34);
      for(let ring=0;ring<3;ring++){
        const radius=unit*(.18+ring*.034)*(settled?1:.85+ease(progress*2)*.15);
        ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.strokeStyle=`rgba(${palette.rgb},${settled?.12:.18+progress*.17})`;ctx.lineWidth=ring===1?1.5:.6;ctx.stroke();
      }
      ctx.rotate(settled?0:elapsed*.00009);
      for(let i=0;i<8;i++){const angle=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(angle)*unit*.17,Math.sin(angle)*unit*.17);ctx.lineTo(Math.cos(angle)*unit*.235,Math.sin(angle)*unit*.235);ctx.strokeStyle=`rgba(${palette.rgb},.3)`;ctx.lineWidth=1;ctx.stroke();}
      ctx.restore();
      // Seeded paths keep each particle stable without gameplay randomness.
      if(!settled)for(let i=0;i<65;i++){
        const angle=i*2.39996+elapsed*.00016,flow=(i*.137+elapsed*.00012)%1,radius=unit*(.08+.5*(1-flow));
        const x=cx+Math.cos(angle)*radius,y=cy+Math.sin(angle)*radius*.64-h*.21*flow;
        ctx.fillStyle=`rgba(${palette.rgb},${.12+flow*.44})`;ctx.beginPath();ctx.arc(x,y,i%8===0?1.8:.8,0,Math.PI*2);ctx.fill();
      }
      if(scene.kind==='minor'&&!settled){
        for(let i=0;i<4;i++){const angle=elapsed*.0011+i*Math.PI*.5;const points:Point[]=[];for(let j=0;j<50;j++){const t=j/49,a=angle+t*4,r=unit*(.035+t*.2)*(1-progress*.3);points.push({x:cx+Math.cos(a)*r,y:cy-h*.02-Math.sin(a)*r*.55-t*h*.08});}stroke(points,palette.ink,1,.14+progress*.18,5);}
      }
      if(!settled)for(const bolt of bolts){
        const age=elapsed-bolt.at;
        if(age<0||age>420)continue;
        const alpha=(1-age/420)*(.78+.14*Math.sin(age*.024));
        stroke(bolt.points,palette.ink,9,alpha*.1,28);stroke(bolt.points,'#b4d2db',3.6,alpha*.5,16);stroke(bolt.points,'#ecf7f2',1.3,alpha*.9,7);
        for(const branch of bolt.branches)stroke(branch,'#bcd9dd',.8,alpha*.52,7);
        const impact=ctx.createRadialGradient(cx,cy,0,cx,cy,unit*.22);impact.addColorStop(0,`rgba(${palette.rgb},${alpha*.2})`);impact.addColorStop(1,'transparent');ctx.fillStyle=impact;ctx.fillRect(cx-unit*.3,cy-unit*.3,unit*.6,unit*.6);
        ctx.save();ctx.translate(cx,cy+h*.04);ctx.scale(1,.35);ctx.beginPath();ctx.arc(0,0,unit*(.1+.35*age/420),0,Math.PI*2);ctx.strokeStyle=`rgba(${palette.rgb},${alpha*.4})`;ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
      }
      const burstAt=timing.duration-800,burst=clamp((elapsed-burstAt)/800);
      if(burst>0&&!settled){
        ctx.save();ctx.translate(cx,cy);ctx.globalAlpha=(1-burst)*.5;
        for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(0,0,unit*(.08+ease(burst)*(.23+i*.1)),0,Math.PI*2);ctx.strokeStyle=scene.success?palette.light:'#9eafa3';ctx.lineWidth=2-i*.5;ctx.stroke();}
        ctx.restore();
        if(scene.success){const beam=ctx.createLinearGradient(cx-unit*.12,0,cx+unit*.12,0);beam.addColorStop(0,'transparent');beam.addColorStop(.5,`rgba(${palette.rgb},${(1-burst)*.2})`);beam.addColorStop(1,'transparent');ctx.fillStyle=beam;ctx.fillRect(cx-unit*.12,h*.1,unit*.24,cy-h*.1);}
      }
    }
    function tick(now:number):void {
      if(finished||revealed)return;
      const elapsed=now-start,progress=clamp(elapsed/timing.duration),percent=Math.round(progress*100);
      if(percent!==lastPercent){lastPercent=percent;node('.fx-progress span').style.width=`${percent}%`;node('.fx-progress').setAttribute('aria-valuenow',String(percent));}
      const striking=scene.kind!=='minor'&&elapsed>=timing.strikes[0];
      const stage=elapsed>timing.duration-800?'道心归一':striking?'天雷试道':scene.kind==='minor'?'灵气汇聚，周天运转':'劫云压境，凝神守心';
      if(stage!==lastStage){lastStage=stage;node('.fx-stage').textContent=stage;view.dataset.phase=elapsed>timing.duration-800?'release':striking?'thunder':'gather';}
      draw(elapsed);
      if(elapsed>=timing.duration){reveal();return;}
      frame=requestAnimationFrame(tick);
    }
    skip.addEventListener('click',()=>revealed?finish():reveal(),{signal:controls.signal});
    continueButton.addEventListener('click',finish,{signal:controls.signal});
    view.addEventListener('cancel',event=>{event.preventDefault();revealed?finish():reveal();},{signal:controls.signal});
    view.addEventListener('close',finish,{signal:controls.signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)reveal();},{signal:controls.signal});
    media.addEventListener('change',motionChange);
    document.body.append(view);
    document.documentElement.style.overflow='hidden';
    try{view.showModal();resize();observer.observe(view);skip.focus({preventScroll:true});start=performance.now();if(reduced)reveal();else frame=requestAnimationFrame(tick);}
    catch{finish();}
  });
}
