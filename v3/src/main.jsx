import React, { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, Environment, Float, Lightformer, PerformanceMonitor, Preload, Sparkles } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { gsap } from 'gsap';
import { Howler } from 'howler';
import { createPortal } from 'react-dom';
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, CircleHelp, Flower2, Heart, Lamp, Leaf, Menu, Moon, Music2, Pause, Play, RotateCcw, Sparkle, Star, Sun, X } from 'lucide-react';
import * as THREE from 'three';
import content from './content.json';
import config from './config.json';
import credits from './credits.json';
import { MALASH, readPref, writePref } from './core/malash.js';
import { useMalash } from './core/store.js';
import './styles.css';

const icons = [<CircleHelp/>, <Heart/>, <Flower2/>, <ArrowRight/>, <Star/>, <Leaf/>];
const labels = ['The Gate','The Courtyard','The Tree of Wishes','Three Days, One Journey','Names in Light','Dawn Farewell'];
function relativeLuminance(hex){const c=hex.match(/[0-9a-f]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
function contrast(a,b){const l=[relativeLuminance(a),relativeLuminance(b)].sort((x,y)=>y-x);return (l[0]+.05)/(l[1]+.05);}
function drawSticker(ctx,name,x,y){ctx.save();ctx.translate(x,y);ctx.strokeStyle='#7b4fbf';ctx.fillStyle='#f2b6e3';ctx.lineWidth=5;if(name==='heart'){ctx.beginPath();ctx.moveTo(0,20);ctx.bezierCurveTo(-45,-5,-27,-36,0,-12);ctx.bezierCurveTo(27,-36,45,-5,0,20);ctx.stroke();}else if(name==='star'){ctx.beginPath();for(let i=0;i<10;i++){const r=i%2?10:24,a=-Math.PI/2+i*Math.PI/5;(i?ctx.lineTo:ctx.moveTo).call(ctx,Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.stroke();}else if(name==='moon'){ctx.beginPath();ctx.arc(0,0,21,-Math.PI/2,Math.PI/2);ctx.arc(12,0,18,Math.PI/2,-Math.PI/2,true);ctx.stroke();}else if(name==='flower'){ctx.beginPath();for(let i=0;i<6;i++){ctx.ellipse(Math.cos(i*Math.PI/3)*12,Math.sin(i*Math.PI/3)*12,8,14,i*Math.PI/3,0,Math.PI*2);}ctx.stroke();}else if(name==='leaf'){ctx.beginPath();ctx.ellipse(0,0,13,25,-.65,0,Math.PI*2);ctx.moveTo(-15,18);ctx.lineTo(12,-18);ctx.stroke();}else{ctx.strokeRect(-13,-20,26,40);ctx.beginPath();ctx.ellipse(0,-20,18,5,0,0,Math.PI*2);ctx.ellipse(0,20,18,5,0,0,Math.PI*2);ctx.moveTo(0,-34);ctx.lineTo(0,-20);ctx.stroke();}ctx.restore();}

function Backdrop({ tier }) {
  const group = useRef(), background=useRef();
  const dark = useMalash(s => s.theme === 'dark');
  const progress=useMalash(s=>s.progress), activeAct=useMalash(s=>s.act);
  const stops=dark?MALASH.colors.dark:MALASH.colors.light;
  const threeStops=useMemo(()=>stops.map(color=>new THREE.Color(color)),[dark]);
  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.rotation.y += (state.pointer.x * .06 - group.current.rotation.y) * Math.min(dt, .08);
    group.current.rotation.x += (-state.pointer.y * .025 - group.current.rotation.x) * Math.min(dt, .08);
    const targetZ=9-activeAct*.55, targetX=activeAct*.18;
    state.camera.position.z+=(targetZ-state.camera.position.z)*Math.min(1,dt*.65);
    state.camera.position.x+=(targetX-state.camera.position.x)*Math.min(1,dt*.65);
    const at=progress*(stops.length-1), index=Math.min(stops.length-2,Math.floor(at));
    background.current?.copy(threeStops[index]).lerp(threeStops[index+1],at-index);
  });
  const petal = useMemo(() => {
    const shapes = [];
    for (let n=0; n<8; n++) { const a=n*Math.PI/4, x=Math.cos(a)*.28, y=Math.sin(a)*.28; shapes.push({x,y,a}); }
    return shapes;
  }, []);
  return <>
    <color ref={background} attach="background" args={[stops[0]]} />
    <ambientLight intensity={dark ? 1.15 : 1.55} color={dark ? '#f2b6e3' : '#fff1e4'} />
    <pointLight position={[0,4,-2]} intensity={dark ? 28 : 16} color="#f2b6e3" distance={28} />
    <directionalLight position={[-4,6,5]} intensity={1.2} color="#f4ece1" />
    <group ref={group} position={[0,0,-2]}>
      {[-4,-1.5,1.2,3.6].map((z,i)=><group key={z} position={[0,0,z]}>
        <mesh position={[0,0,0]}><planeGeometry args={[14,9]} /><meshStandardMaterial color={i%2 ? '#6e1450' : '#351034'} roughness={1} transparent opacity={.55-i*.06} /></mesh>
        <mesh position={[0,0,.02]}><ringGeometry args={[2.1,2.18,64,1,0,Math.PI]} /><meshStandardMaterial color="#c9b8e8" side={2} transparent opacity={.55} /></mesh>
        {petal.map((p,j)=><mesh key={j} position={[p.x,p.y,.08]} rotation={[0,0,p.a]}><circleGeometry args={[.08,7]} /><meshStandardMaterial color={j%2 ? '#f2b6e3' : '#c9b8e8'} transparent opacity={.5} /></mesh>)}
        <mesh position={[0,-3,.09]}><boxGeometry args={[14,.035,.025]} /><meshStandardMaterial color="#c9b8e8" transparent opacity={.4} /></mesh>
      </group>)}
      <Float speed={.35} floatIntensity={.18} rotationIntensity={.08}><mesh position={[0,.1,2]}><dodecahedronGeometry args={[.56,1]} /><meshPhysicalMaterial color="#f4ece1" roughness={.3} metalness={.1} clearcoat={.5} /></mesh></Float>
    </group>
    <Sparkles count={tier === 'low' ? 12 : 28} scale={[10,6,10]} size={1.2} speed={.08} color={dark ? '#f2b6e3' : '#7b4fbf'} opacity={.42} />
    <Environment resolution={128}><Lightformer form="rect" intensity={2} position={[0,4,-2]} scale={[8,2,1]} color="#f2b6e3" /><Lightformer form="ring" intensity={1.1} position={[4,1,2]} scale={4} color="#c9b8e8" /></Environment>
    {tier !== 'low' && <EffectComposer multisampling={0}><Bloom luminanceThreshold={.88} intensity={.22} mipmapBlur /><Vignette eskil={false} offset={.24} darkness={.28} /></EffectComposer>}
    <AdaptiveDpr pixelated />
    <Preload all />
  </>;
}

function GardenCanvas() {
  const [tier,setTier] = useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches||(navigator.deviceMemory&&navigator.deviceMemory<=4)||navigator.hardwareConcurrency<=4?'low':'mid');
  const [failed,setFailed] = useState(false);
  if (failed) return <div className="canvas-fallback" aria-hidden="true" />;
  return <div className="garden-canvas" aria-hidden="true"><Canvas fallback={<div className="canvas-fallback"/>} dpr={[1,1.6]} camera={{position:[0,0,9],fov:36}} gl={{alpha:false,antialias:true,powerPreference:'low-power'}} onCreated={({gl})=>gl.domElement.addEventListener('webglcontextlost', e=>{e.preventDefault();setFailed(true);})}>
    <Suspense fallback={null}><PerformanceMonitor onDecline={()=>setTier('low')}><Backdrop tier={tier}/></PerformanceMonitor></Suspense>
  </Canvas></div>;
}

function MalashModal({ modal, onClose }) {
  const card=useRef(null), closeRef=useRef(null), sourceRef=useRef(null), timeline=useRef(null), [ready,setReady]=useState(false);
  useLayoutEffect(()=>{
    if (!modal) return;
    const y=window.scrollY, scrolling=document.scrollingElement;
    const active=document.activeElement; sourceRef.current=modal.source || active;
    const siblings=[...document.body.children].filter(x=>x.id!=='modal-root'&&!x.inert); siblings.forEach(x=>x.inert=true);
    document.documentElement.classList.add('modal-lock');
    const focusables=()=>[...card.current.querySelectorAll('button:not([disabled]),a[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);
    const key=e=>{
      if(e.key==='Escape'){e.preventDefault();onClose();return;}
      if(e.key==='Tab'){const f=focusables(),first=f[0],last=f[f.length-1];if(!f.length){e.preventDefault();card.current?.focus({preventScroll:true});}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus({preventScroll:true});}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus({preventScroll:true});}}
    };
    window.addEventListener('keydown',key,true);
    setReady(false);
    const sourceRect=sourceRef.current?.getBoundingClientRect?.(), cardRect=card.current.getBoundingClientRect();
    const flip=sourceRect&&sourceRect.width&&sourceRect.height?{x:sourceRect.left+sourceRect.width/2-(cardRect.left+cardRect.width/2),y:sourceRect.top+sourceRect.height/2-(cardRect.top+cardRect.height/2),scale:Math.min(sourceRect.width/cardRect.width,sourceRect.height/cardRect.height,1)}:{x:0,y:12,scale:.88};
    const speed=modal.speed??1, reduced=matchMedia('(prefers-reduced-motion: reduce)').matches, duration=d=>reduced ? .2 : d*speed;
    timeline.current=gsap.timeline({onComplete:()=>{closeRef.current?.focus({preventScroll:true});}})
      .fromTo('.modal-backdrop',{autoAlpha:0,backdropFilter:'blur(0px)'},{autoAlpha:1,backdropFilter:'blur(10px)',duration:duration(.4)})
      .fromTo(card.current,{autoAlpha:0,...flip},{autoAlpha:1,x:0,y:0,scale:1,duration:duration(.9),ease:MALASH.ease.cinematic},0)
      .fromTo('.modal-frame path',{strokeDashoffset:1},{strokeDashoffset:0,duration:duration(.9)},duration(.2))
      .fromTo('.modal-content-line',{autoAlpha:0,y:8},{autoAlpha:1,y:0,duration:duration(.35),stagger:duration(.08)},duration(.55));
    const bodyOverflow=document.body.style.overflow;
    return ()=>{timeline.current?.kill();window.removeEventListener('keydown',key,true);document.documentElement.classList.remove('modal-lock');siblings.forEach(x=>x.inert=false);document.scrollingElement.scrollTop=scrolling.scrollTop;window.scrollTo({top:y,behavior:'instant'});document.body.style.overflow=bodyOverflow;sourceRef.current?.focus?.({preventScroll:true});};
  },[modal,onClose]);
  if(!modal) return null;
  const close=()=>{timeline.current?.reverse().eventCallback('onReverseComplete',onClose);};
  return createPortal(<div className="malash-modal" role="presentation" onPointerDown={e=>{if(e.target===e.currentTarget||e.target.classList.contains('modal-backdrop'))close();}}><div className="modal-backdrop"/><section ref={card} className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1}>
    <svg className="modal-frame" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M3 3H97V97H3Z" pathLength="1"/></svg>
    <button ref={closeRef} className="close-btn" aria-label="Close" onClick={close}><X/></button>
    <div className="modal-copy"><p className="modal-name modal-content-line">{modal.kind==='letter'?'Machele & Salash':''}</p><p className="modal-greeting modal-content-line">{modal.kind==='letter'?'To our dear newlyweds':''}</p><h2 id="modal-title" className="modal-content-line">{modal.title}</h2>
      {modal.kind==='card' ? <CardReady modal={modal} onClose={close}/> : <><div className="modal-body">{modal.lines?.map((line,i)=><p className="modal-content-line" key={i}>{line}</p>)}</div><p className="signature modal-content-line">{modal.signature}</p></>}
    </div>
  </section></div>,document.getElementById('modal-root'));
}

function CardReady({modal,onClose}) {
  const send=()=>{const link=window.open('about:blank','_blank');modal.download();setTimeout(()=>{if(link)link.location.href=modal.whatsappUrl;else window.location.href=modal.whatsappUrl;},600);};
  const share=async()=>{const file=new File([modal.blob],modal.fileName,{type:'image/png'});if(navigator.canShare?.({files:[file]}))await navigator.share({files:[file],title:'A wish for Machele & Salash'});else modal.download();};
  return <div className="ready-flow"><img src={modal.preview} alt="Preview of your greeting card"/><p>{content.whatsapp.promptBody}</p><ol>{content.whatsapp.steps.map((x,i)=><li key={i}>{x}</li>)}</ol><div className="ready-actions"><button className="button primary" onClick={send}>{content.whatsapp.send}</button><button className="button" onClick={share}>{content.whatsapp.shareOther}</button><button className="button quiet" onClick={()=>{modal.download();onClose();}}>{content.whatsapp.save}</button></div></div>;
}

function WishCardMaker({onReady}) {
  const templates=['Ivory Paper','Plum Night','Lavender Bloom','Violet Geometry'], palette={Plum:'#6e1450',Lavender:'#c9b8e8',Violet:'#7b4fbf',Rose:'#f2b6e3',Ivory:'#f4ece1'};
  const [template,setTemplate]=useState(0),[bg,setBg]=useState('Ivory'),[fg,setFg]=useState('Plum'),[accent,setAccent]=useState('Rose'),[name,setName]=useState(''),[wish,setWish]=useState(''),[blessing,setBlessing]=useState('none'),[stickers,setStickers]=useState([]),[align,setAlign]=useState('center'),[size,setSize]=useState('card'),[step,setStep]=useState(0),[quick,setQuick]=useState(-1);
  const canvasRef=useRef(null); const width=1080,height=size==='card'?1350:1920;
  useEffect(()=>{let canceled=false;document.fonts.ready.then(()=>{if(canceled)return;const c=canvasRef.current,ctx=c?.getContext('2d');if(!ctx)return;c.width=width;c.height=height;ctx.fillStyle=palette[bg];ctx.fillRect(0,0,width,height);ctx.strokeStyle=palette[accent];ctx.lineWidth=template===3?14:8;ctx.strokeRect(35,35,width-70,height-70);if(template===2){for(let i=0;i<8;i++){ctx.beginPath();ctx.arc(width/2+(i%4-1.5)*145,105+Math.floor(i/4)*38,16,0,Math.PI*2);ctx.stroke();}}else if(template===3){ctx.beginPath();ctx.moveTo(width/2,45);ctx.lineTo(width-45,height/2);ctx.lineTo(width/2,height-45);ctx.lineTo(45,height/2);ctx.closePath();ctx.stroke();}else ctx.strokeRect(58,58,width-116,height-116);const foreground=contrast(palette[fg],palette[bg])>=4.5?palette[fg]:(contrast('#12031c',palette[bg])>=contrast('#f4ece1',palette[bg])?'#12031c':'#f4ece1');ctx.fillStyle=foreground;ctx.textAlign=align==='centre'?'center':align;ctx.font='88px Sacramento';ctx.fillText('To Machele & Salash',width/2,230);ctx.font='40px "Exo 2"';drawWrapped(ctx,wish||'Your wish for a beautiful life together',width/2,420,width-220,60);if(name)ctx.fillText(`With love, ${name}`,width/2,height-190);ctx.font='30px "Exo 2"';ctx.fillText('from the GMSA-KNUST family',width/2,height-130);const item=content.blessings.items.find(x=>x.id===blessing);if(item){let y=height-340;if(item.arabic){ctx.direction='rtl';ctx.font='46px Amiri';ctx.fillText(item.arabic,width/2,y);y+=60;ctx.direction='ltr';ctx.font='24px "Exo 2"';if(item.transliteration)ctx.fillText(item.transliteration,width/2,y);y+=44;}ctx.font='28px "Exo 2"';ctx.fillText(item.translation,width/2,y);}stickers.forEach((s,i)=>drawSticker(ctx,s,width-110,height-155-i*75));ctx.fillStyle=foreground;ctx.textAlign='center';ctx.font='22px "Exo 2"';ctx.fillText('GMSA-KNUST',width/2,height-70);});return()=>{canceled=true;};},[template,bg,fg,accent,name,wish,blessing,stickers,align,size,width,height]);
  function drawWrapped(ctx,text,x,y,maxWidth,lineHeight){const words=String(text).split(' ');let line='',lines=[];for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word;}else line=test;}lines.push(line);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));}
  const create=async()=>{await document.fonts.ready;canvasRef.current.toBlob(blob=>{if(!blob)return;const preview=canvasRef.current.toDataURL('image/png'),fullName=name.trim()||'a friend',message=content.whatsapp.message.replace('{name}',fullName),params=new URLSearchParams({text:message}),url=`https://wa.me/${config.share.whatsappNumber}?${params}`;onReady({blob,preview,whatsappUrl:url,fileName:`malash-wish-${Date.now()}.png`,download(){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`malash-wish-${Date.now()}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),3000);}});},'image/png');};
  const quickWish=()=>{const i=(quick+1)%content.quickWishes.length;setQuick(i);setWish(content.quickWishes[i]);};
  const stickerNames=[['heart',Heart],['star',Star],['moon',Moon],['lantern',Lamp],['leaf',Leaf],['flower',Flower2]];
  return <div className="card-maker"><div className="maker-preview"><canvas ref={canvasRef} aria-label="Greeting card preview"/><div className="size-switch"><button aria-pressed={size==='card'} onClick={()=>setSize('card')}>Card</button><button aria-pressed={size==='status'} onClick={()=>setSize('status')}>Status</button></div></div><div className="maker-controls"><div className="step-tabs" role="tablist">{['Style','Colour','Message','Blessing','Stickers','Layout'].map((x,i)=><button role="tab" aria-selected={step===i} onClick={()=>setStep(i)} key={x}>{String(i+1).padStart(2,'0')}</button>)}</div>
    {step===0&&<div className="control-section"><h3>Choose a paper</h3>{templates.map((x,i)=><button className="choice" aria-pressed={template===i} onClick={()=>{setTemplate(i);setBg(['Ivory','Plum','Lavender','Violet'][i]);setAccent(i===0?'Rose':'Ivory');}} key={x}>{x}</button>)}</div>}
    {step===1&&<div className="control-section"><h3>Colours</h3>{[['Paper',bg,setBg],['Text',fg,setFg],['Accent',accent,setAccent]].map(([label,value,change])=><label className="swatch-row" key={label}>{label}<select value={value} onChange={e=>change(e.target.value)}>{Object.entries(palette).map(([n,c])=><option value={n} key={n}>{n}</option>)}</select><i style={{background:palette[value]}}/></label>)}</div>}
    {step===2&&<div className="control-section"><h3>Your words</h3><label>Your name <span>{name.length}/30</span><input maxLength={30} value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label><label>Your wish <span>{wish.length}/140</span><textarea maxLength={140} value={wish} onChange={e=>setWish(e.target.value)} placeholder="Write a short wish"/></label><button className="button" onClick={quickWish}>Quick wish</button></div>}
    {step===3&&<div className="control-section"><h3>{content.blessings.title}</h3><select value={blessing} onChange={e=>setBlessing(e.target.value)}><option value="none">{content.blessings.none}</option>{content.blessings.items.map(x=><option key={x.id} value={x.id}>{x.translation}</option>)}</select>{content.blessings.items.filter(x=>x.id===blessing&&x.arabic).map(x=><p lang="ar" dir="rtl" className="arabic sample-arabic" key={x.id}>{x.arabic}</p>)}</div>}
    {step===4&&<div className="control-section"><h3>Small keepsakes</h3><div className="sticker-row">{stickerNames.map(([x,Icon])=><button aria-label={x} title={x} aria-pressed={stickers.includes(x)} onClick={()=>setStickers(s=>s.includes(x)?s.filter(y=>y!==x):s.length<3?[...s,x]:s)} key={x}><Icon/></button>)}</div></div>}
    {step===5&&<div className="control-section"><h3>Finishing touches</h3><div className="align-row">{['left','centre','right'].map(x=><button aria-pressed={align===x} onClick={()=>setAlign(x)} key={x}>{x}</button>)}</div><button className="button primary" onClick={create}>Create card</button></div>}
    <div className="maker-nav"><button className="button" disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))}><ChevronLeft/>Back</button><button className="button" disabled={step===5} onClick={()=>setStep(Math.min(5,step+1))}>Continue<ChevronRight/></button></div>
  </div></div>;
}

function App(){
  const act=useMalash(s=>s.act),travelMode=useMalash(s=>s.travelMode),theme=useMalash(s=>s.theme),sound=useMalash(s=>s.sound),narration=useMalash(s=>s.narration),auto=useMalash(s=>s.auto),setAct=useMalash(s=>s.setAct),setMode=useMalash(s=>s.setMode),toggleTheme=useMalash(s=>s.toggleTheme),toggleSound=useMalash(s=>s.toggleSound),toggleNarration=useMalash(s=>s.toggleNarration),reset=useMalash(s=>s.reset);
  const wishesRead=useMalash(s=>s.wishesRead),readWish=useMalash(s=>s.readWish),secretsFound=useMalash(s=>s.secretsFound),findSecret=useMalash(s=>s.findSecret),eggCracked=useMalash(s=>s.eggCracked),crackEgg=useMalash(s=>s.crackEgg),moments=useMalash(s=>s.moments);
  const scrollRef=useRef(null),touchStart=useRef(null),[modal,setModal]=useState(null),[menu,setMenu]=useState(false),[activeWish,setActiveWish]=useState(null),[secretToast,setSecretToast]=useState(''),[autoOn,setAutoOn]=useState(auto),[wishScroll,setWishScroll]=useState(false),[letterOpens,setLetterOpens]=useState(0),[eggCracking,setEggCracking]=useState(false),[constellation,setConstellation]=useState(new Set()),[shards,setShards]=useState(new Set()),[tailRevealed,setTailRevealed]=useState(false);
  const dialogClose=useCallback(()=>setModal(null),[]);
  const go=useCallback(n=>{const next=Math.max(0,Math.min(5,n));setAct(next);if(travelMode==='scroll')scrollRef.current?.scrollTo({top:next*innerHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});},[setAct,travelMode]);
  const changeTheme=()=>{const commit=()=>toggleTheme();if(document.startViewTransition){const r=document.querySelector('[aria-label="Switch theme"]')?.getBoundingClientRect();if(r){document.documentElement.style.setProperty('--reveal-x',`${r.left+r.width/2}px`);document.documentElement.style.setProperty('--reveal-y',`${r.top+r.height/2}px`);}document.startViewTransition(commit);}else{document.documentElement.classList.add('theme-fallback');commit();setTimeout(()=>document.documentElement.classList.remove('theme-fallback'),600);}};
  const closeMenu=()=>{setMenu(false);requestAnimationFrame(()=>document.querySelector('.menu-toggle')?.focus({preventScroll:true}));};
  useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
  useEffect(()=>{const onKey=e=>{if(modal||e.target.matches('input,textarea,select,[contenteditable=true]'))return;if(e.key===' '&&e.target.matches('button,a'))return;if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();go(act+1);}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();go(act-1);}else if(e.key==='Home')go(0);else if(e.key==='End')go(5);};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[act,modal,go]);
  useEffect(()=>{if(travelMode!=='scroll'||!scrollRef.current)return;const el=scrollRef.current;el.scrollTo({top:act*innerHeight,behavior:'auto'});const read=()=>{const i=Math.round(el.scrollTop/innerHeight);if(i!==act)setAct(i);};const resize=()=>el.scrollTo({top:act*innerHeight,behavior:'auto'});el.addEventListener('scroll',read,{passive:true});window.addEventListener('resize',resize);return()=>{el.removeEventListener('scroll',read);window.removeEventListener('resize',resize);};},[travelMode,act,setAct]);
  useEffect(()=>{if(!autoOn)return;const id=setInterval(()=>{const s=useMalash.getState(),i=s.act,key={1:'egg',2:'tree',4:'names'}[i];if(key&&s.moments[key]==='playing')return;go(i+1);},10000);return()=>clearInterval(id);},[autoOn,go]);
  useEffect(()=>{const store=useMalash.getState();if(act===2&&store.moments.tree==='pending'){useMalash.setState(s=>({moments:{...s.moments,tree:'playing'}}));const timer=setTimeout(()=>useMalash.setState(s=>({moments:{...s.moments,tree:'done'}})),1600);return()=>{clearTimeout(timer);useMalash.setState(s=>({moments:{...s.moments,tree:'done'}}));};}if(act===4&&store.moments.names==='pending'){useMalash.setState(s=>({moments:{...s.moments,names:'playing'}}));const timer=setTimeout(()=>useMalash.setState(s=>({moments:{...s.moments,names:'done'}})),1800);return()=>{clearTimeout(timer);useMalash.setState(s=>({moments:{...s.moments,names:'done'}}));};}},[act]);
  useEffect(()=>{if(!secretToast)return;const id=setTimeout(()=>setSecretToast(''),3000);return()=>clearTimeout(id);},[secretToast]);
  useEffect(()=>{Howler.mute(!sound);},[sound]);
  useEffect(()=>{const visibility=()=>{if(document.hidden){setAutoOn(false);Howler.mute(true);}else Howler.mute(!useMalash.getState().sound);};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility);},[]);
  useEffect(()=>{if(!menu)return;const key=e=>{if(e.key==='Escape')closeMenu();};const outside=e=>{if(!e.target.closest('.top-controls'))closeMenu();};window.addEventListener('keydown',key);window.addEventListener('pointerdown',outside);return()=>{window.removeEventListener('keydown',key);window.removeEventListener('pointerdown',outside);};},[menu]);
  useEffect(()=>{if(!autoOn)return;const pause=()=>setAutoOn(false);window.addEventListener('pointerdown',pause,{once:true});window.addEventListener('keydown',pause,{once:true});return()=>{window.removeEventListener('pointerdown',pause);window.removeEventListener('keydown',pause);};},[autoOn]);
  const revealSecret=key=>{const before=useMalash.getState().secretsFound.size;findSecret(key);if(useMalash.getState().secretsFound.size>before)setSecretToast(content.surprises.counter.replace('{n}',String(before+1)));};
  const openLetter=source=>setModal({kind:'letter',source,title:content.letter.title,lines:content.letter.lines,signature:content.letter.signature,speed:letterOpens===0?1:.4});
  const onReady=card=>setModal({kind:'card',title:content.whatsapp.promptTitle,...card});
  const horizontalWheel=e=>{if(travelMode==='sideways'&&Math.abs(e.deltaY)>12){e.preventDefault();go(act+(e.deltaY>0?1:-1));}};
  const gates=<section className="act gate" aria-label={labels[0]}><div className="gate-arch"><div className="lattice"/><div className="gate-glow"/></div><p className="arabic basmalah" lang="ar" dir="rtl">{content.arrival.basmalah}</p><div className="pattern-loader" aria-label="Preparing the courtyard"><i/></div><p className="eyebrow">{content.meta.associationShort}</p><h1>{content.home.title}</h1><p className="lede">{content.home.subline}</p><button className="button primary enter-button" onClick={()=>go(1)}>{content.home.enter}<ArrowRight/></button><div className="gate-options"><span>Travel mode</span><button className="text-button" aria-pressed={travelMode==='sideways'} onClick={()=>setMode('sideways')}>Swipe sideways</button><button className="text-button" aria-pressed={travelMode==='scroll'} onClick={()=>setMode('scroll')}>Scroll down</button></div><button className="sound-switch" aria-pressed={sound} onClick={toggleSound}><Music2/>{sound?content.home.soundOn:content.home.soundOff}</button><p className="sound-hint">{content.arrival.soundHint}</p></section>;
  const courtyard=<section className="act courtyard" aria-label={labels[1]}><p className="eyebrow">02 / THE COURTYARD</p><h2>A quiet beginning</h2><div className="stone-plinth"><div className="lantern-scene" aria-hidden="true"><Lamp/><div className="lantern-glass"/></div><button id="egg-button" className={`egg ${eggCracked?'cracked':''} ${eggCracking?'is-cracking':''} ${eggCracking&&letterOpens?'is-reopening':''}`} aria-label={eggCracked?content.nav.openLetter:content.letter.sealHint} aria-expanded={Boolean(modal?.kind==='letter')} onClick={()=>{if(eggCracking)return;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;if(!eggCracked)crackEgg();setEggCracking(true);setTimeout(()=>{setEggCracking(false);setLetterOpens(n=>n+1);openLetter(document.getElementById('egg-button'));},reduced?200:(letterOpens?1440:3600));}}><span>{eggCracked?<Sparkle/>:<Heart/>}</span><small>{eggCracked?content.nav.reopenHint:content.letter.sealHint}</small></button>{eggCracked&&<div className="egg-shards">{[0,1,2].map(n=><button key={n} aria-label={`Collect glowing shard ${n+1}`} onClick={()=>{const next=new Set(shards).add(n);setShards(next);if(next.size===3)revealSecret('shards');}}><Sparkle/></button>)}</div>}<div className="plinth"/></div><p className="lede">The letter waits beneath the lantern.</p><button className="text-button" onClick={()=>openLetter(null)}>Read their letter</button></section>;
  const tree=<section className="act tree" aria-label={labels[2]}><p className="eyebrow">03 / THE TREE OF WISHES</p><h2>{content.wishes.sectionTitle}</h2><p>{content.wishes.tapHint}</p><div className="wish-garden"><div className="paper-tree" aria-hidden="true"><div className="tree-trunk"/><div className="tree-crown"/>{content.wishes.items.map((_,i)=><i className={`blossom blossom-${i%6}`} key={i}/>)}</div><div className="wish-blossoms">{content.wishes.items.map((w,i)=><button className={`blossom-button ${activeWish===i?'selected':''}`} onClick={()=>{setActiveWish(i);readWish(i);}} key={i} aria-label={content.ui.wishFrom.replace('{name}',w.from)}>{i%2?<Flower2/>:<Sparkle/>}</button>)}</div></div><div className="secret-stars" aria-label="Dew glints"><button aria-label="Find a dew glint" onClick={()=>{const next=new Set(constellation).add(0);setConstellation(next);if(next.size===3)revealSecret('constellation');}}><Star/></button><button aria-label="Find a dew glint" onClick={()=>{const next=new Set(constellation).add(1);setConstellation(next);if(next.size===3)revealSecret('constellation');}}><Star/></button><button aria-label="Find a dew glint" onClick={()=>{const next=new Set(constellation).add(2);setConstellation(next);if(next.size===3)revealSecret('constellation');}}><Star/></button></div><button className="held-heart" aria-label="Press and hold to reveal a message" onPointerDown={()=>{window.__heartTimer=setTimeout(()=>{revealSecret('heart');setModal({kind:'letter',title:content.surprises.heartTagline,lines:[]});},500);}} onPointerUp={()=>clearTimeout(window.__heartTimer)} onPointerLeave={()=>clearTimeout(window.__heartTimer)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();revealSecret('heart');setModal({kind:'letter',title:content.surprises.heartTagline,lines:[]});}}}><Heart/></button><p className="read-count">{content.wishes.readCounter.replace('{n}',String(wishesRead.size)).replace('{total}',String(content.wishes.items.length))}</p><button className="button" onClick={()=>setWishScroll(x=>!x)}>{wishScroll?'Hide':'All wishes'}</button>{activeWish!==null&&<aside className="wish-note" aria-live="polite"><p>{content.wishes.items[activeWish].text}</p><small>{content.wishes.items[activeWish].from}</small></aside>}{wishScroll&&<div className="wish-list">{content.wishes.items.map((w,i)=><p key={i}>{w.text}<small>{w.from}</small></p>)}</div>}</section>;
  const journey=<section className="act journey" aria-label={labels[3]}><p className="eyebrow">04 / THREE DAYS, ONE JOURNEY</p><h2>{content.journey.title}</h2><div className="arch-journey">{content.journey.events.map((event,i)=><article className="journey-stop" key={event.name}><div className="paper-arch"><span>0{i+1}</span></div><h3>{event.name}</h3><p>{event.date}</p></article>)}</div><p className="script-line">{content.couple.journeyLine}</p></section>;
  const names=<section className="act names-act" aria-label={labels[4]}><p className="eyebrow">05 / NAMES IN LIGHT</p><h2>{content.names.lead}</h2><div className={`names-light ${moments.names==='playing'?'playing':''} ${moments.names==='done'?'done':''}`}><span>Machele</span><i aria-hidden="true"><Sparkle/></i><span>Salash</span></div><p className="hashtag">{content.couple.merged}</p><div className="verse"><p className="arabic" lang="ar" dir="rtl">{content.names.verseArabic}</p><p>{content.names.verseTranslation}</p><small>{content.names.verseReference}</small><p className="arabic" lang="ar" dir="rtl">{content.names.duaArabic}</p><p>{content.names.duaTransliteration}</p><p>{content.names.duaTranslation}</p></div><button className="button primary" onClick={()=>{if(moments.ameen==='done')return;useMalash.setState(s=>({moments:{...s.moments,ameen:'playing'}}));gsap.fromTo('.ameen-light',{y:10,autoAlpha:0},{y:-120,autoAlpha:1,duration:1.2,onComplete:()=>{useMalash.setState(s=>({moments:{...s.moments,ameen:'done'}}));gsap.to('.ameen-light',{autoAlpha:0,duration:.7});}});}}>{content.ameen.button}</button><i className="ameen-light" aria-hidden="true"><Sparkle/></i></section>;
  const farewell=<section className="act farewell" aria-label={labels[5]}><p className="eyebrow">06 / DAWN FAREWELL</p><h2>{content.farewell.closingLine}</h2><button className="crescent-secret" aria-label="Reveal the hidden blessing" onClick={()=>{revealSecret('crescent');setModal({kind:'letter',title:content.surprises.crescent.translation,lines:[content.surprises.crescent.transliteration,content.surprises.crescent.arabic]});}}><Moon/></button><div className="maker-shell"><h3>{content.wishCard.title}</h3><WishCardMaker onReady={onReady}/></div><div className="share-footer"><button className="button" onClick={()=>{revealSecret('ec');setModal({kind:'letter',title:content.surprises.ecNote.title,lines:[content.surprises.ecNote.body],signature:content.surprises.ecNote.signature});}}>EC Office note</button><button className="button" onClick={()=>{reset();go(0);}}>Restart<RotateCcw/></button></div><div className="tail-blessing"><button className="icon-btn" aria-label="Reveal the final blessing" onClick={()=>{revealSecret('tail');setTailRevealed(true);}}><Star/></button>{tailRevealed&&<p>{content.surprises.tailLine}</p>}</div><footer><img src={credits.logos.association} alt={credits.logoGmsaAlt}/><p>{credits.heading}</p><p>{credits.subheading}</p></footer></section>;
  const acts=[gates,courtyard,tree,journey,names,farewell];
  const modeToggle=()=>setMode(travelMode==='sideways'?'scroll':'sideways');
  return <>
    <GardenCanvas/>
    <div className="spotlight" aria-hidden="true"/>
    <header className={`top-controls ${menu?'menu-open':''}`}>
      <button className="menu-toggle icon-btn" aria-label={menu?'Close controls':'Open controls'} aria-expanded={menu} aria-controls="utility-menu" onClick={()=>setMenu(x=>!x)}>{menu?<X/>:<Menu/>}</button>
      <nav className="utility-menu" id="utility-menu" aria-label="Experience controls">
        <button className="icon-btn" aria-label={sound?'Turn sound off':'Turn sound on'} aria-pressed={sound} onClick={toggleSound}><Music2/></button>
        <button className="icon-btn" aria-label={narration?'Turn narration off':'Turn narration on'} aria-pressed={narration} onClick={toggleNarration}><span className="utility-letter">A</span></button>
        <button className="icon-btn" aria-label="Switch theme" onClick={changeTheme}>{theme==='dark'?<Sun/>:<Moon/>}</button>
        <button className="icon-btn" aria-label="Switch travel mode" onClick={modeToggle}>{travelMode==='sideways'?<ArrowDown/>:<ArrowRight/>}</button>
        <button className="icon-btn" aria-label={autoOn?'Pause auto play':'Start auto play'} aria-pressed={autoOn} onClick={()=>setAutoOn(x=>!x)}>{autoOn?<Pause/>:<Play/>}</button>
        <button className="icon-btn" aria-label="Restart experience" onClick={()=>{setAutoOn(false);reset();go(0);}}><RotateCcw/></button>
      </nav>
    </header>
    <div className="experience" onWheel={horizontalWheel} onTouchStart={e=>{const x=e.touches[0].clientX;if(x>24&&x<innerWidth-24)touchStart.current={x,y:e.touches[0].clientY};}} onTouchEnd={e=>{if(travelMode!=='sideways'||!touchStart.current)return;const dx=e.changedTouches[0].clientX-touchStart.current.x;if(Math.abs(dx)>60)go(act+(dx<0?1:-1));touchStart.current=null;}}>
      {travelMode==='sideways'?<div className="horizontal-track" style={{transform:`translate3d(-${act*100}vw,0,0)`}}>{acts.map((node,i)=><div className={`act-wrap ${i===act?'is-active':''}`} key={i}>{node}</div>)}</div>:<div className="vertical-track" ref={scrollRef}>{acts.map((node,i)=><div className={`act-wrap ${i===act?'is-active':''}`} key={i}>{node}</div>)}</div>}
    </div>
    <nav className={`chapter-dock ${travelMode==='sideways'?'dock-bottom':'dock-right'}`} aria-label="Chapters" style={{'--active':act}}><div className="dock-progress" style={{'--progress':`${act*20}%`}}/><div className="dock-indicator"/>{labels.map((label,i)=><button key={label} className={`dock-stop ${i===act?'active':''}`} aria-label={label} aria-current={i===act?'step':undefined} onClick={()=>go(i)}>{icons[i]}<span className="dock-label">{label}</span><small>{String(i+1).padStart(2,'0')}</small></button>)}</nav>
    <div className="act-counter" aria-live="polite">{String(act+1).padStart(2,'0')} / 06</div>
    {secretToast&&<div className="secret-toast" role="status">{secretToast}</div>}
    <MalashModal modal={modal} onClose={dialogClose}/>
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);

