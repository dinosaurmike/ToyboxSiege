// Records the README header's gameplay frames (frames/f###.png) on a virtual clock (vclock.js), so a slow
// software-rendered browser still produces smooth 15 fps motion. The "camera" is table.y4m, a still wooden
// tabletop (make it with: ffmpeg -loop 1 -i table.png -t 2 -r 15 -pix_fmt yuv420p table.y4m).
// Serve the repo root on :8780 (python3 -m http.server 8780), then:
//   node record.js '{"title":22,"place":22,"intro":34,"pull":12,"pullDy":140,"flight":125}'
//   python3 make-gif.py banner-bg.png frames composite     (banner-bg.png = screenshot of banner.html at 960x560)
//   ffmpeg -framerate 15 -i composite/c%03d.png -vf "palettegen=max_colors=160:stats_mode=diff" pal.png
//   ffmpeg -framerate 15 -i composite/c%03d.png -i pal.png -lavfi "[0][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle" -loop 0 ../toybox-siege-header.gif
const {chromium}=require('playwright');const VC=require('./vclock.js');
const FPS=15,DT=1000/FPS;
(async()=>{const b=await chromium.launch({args:['--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--use-file-for-fake-video-capture='+__dirname+'/table.y4m']});
 const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1.5,isMobile:true,hasTouch:true,permissions:['camera']});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/WebSocket/.test(m.text()))errs.push(m.text().slice(0,120))});
 await p.addInitScript(VC);
 await p.routeWebSocket(/\/ws/,ws=>{});
 await p.goto('http://localhost:8780/index.html');
 for(let i=0;i<40;i++){await p.evaluate(dt=>__advance(dt),DT);await p.waitForTimeout(30);} // let it load
 const cdp=await ctx.newCDPSession(p);
 const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
 let f=0;const shot=async()=>{await p.screenshot({path:`frames/f${String(f++).padStart(3,'0')}.png`});};
 const run=async(n,onFrame)=>{for(let i=0;i<n;i++){if(onFrame)await onFrame(i);await p.evaluate(dt=>__advance(dt),DT);await shot();}};
 const plan=JSON.parse(process.argv[2]||'{}');
 require('fs').mkdirSync('frames',{recursive:true});
 await run(plan.title??20);
 await p.touchscreen.tap(195,780);
 await run(plan.place??14);
 await p.touchscreen.tap(195,735);
 await run(plan.intro??24);
 await touch('touchStart',195,700);
 const PD=plan.pullDy??140,PN=plan.pull??12;await run(PN,async i=>{await touch('touchMove',195,700+PD*(i+1)/PN);});
 await touch('touchEnd',0,0);
 await run(plan.flight??80);
 console.log('frames',f,'errors',JSON.stringify(errs.slice(0,5)));await b.close();})();
