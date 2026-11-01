// Virtual clock: the page's time only moves when __advance(ms) is called, so every frame is exactly ms of game time.
module.exports=`(()=>{let vt=performance.now(),id=1;const timers=[];let rafs=[];
const realNow=performance.now.bind(performance);
performance.now=()=>vt;const d0=Date.now()-vt;Date.now=()=>d0+vt;
window.requestAnimationFrame=cb=>{const h=id++;rafs.push([h,cb]);return h};
window.cancelAnimationFrame=h=>{rafs=rafs.filter(x=>x[0]!==h)};
const add=(fn,ms,a,rep)=>{const h=id++;timers.push({h,t:vt+Math.max(0,ms||0),fn,a,rep:rep?Math.max(1,ms||0):0});return h};
window.setTimeout=(fn,ms,...a)=>add(fn,ms,a,false);window.setInterval=(fn,ms,...a)=>add(fn,ms,a,true);
window.clearTimeout=window.clearInterval=h=>{const i=timers.findIndex(x=>x.h===h);if(i>=0)timers.splice(i,1)};
window.__advance=(ms)=>{const end=vt+ms;
  for(;;){timers.sort((a,b)=>a.t-b.t);const n=timers[0];if(!n||n.t>end)break;vt=n.t;
    if(n.rep)n.t+=n.rep;else timers.shift();try{typeof n.fn==='function'?n.fn(...(n.a||[])):0}catch(e){console.error(e)}}
  vt=end;const list=rafs;rafs=[];for(const [h,cb] of list){try{cb(vt)}catch(e){console.error(e)}}};
})();`;
