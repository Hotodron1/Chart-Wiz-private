import { useState, useEffect, useRef } from "react";

// ── TICKER DATA ────────────────────────────────────────────────────────────────
const TICKERS = [
  {t:"NVDA",  p:"$887.42",  c:"+3.21%", up:true },
  {t:"AAPL",  p:"$189.30",  c:"+0.84%", up:true },
  {t:"NASDAQ",p:"16,384",   c:"+0.91%", up:true },
  {t:"VIX",   p:"14.82",    c:"-3.21%", up:false},
  {t:"TSLA",  p:"$248.23",  c:"-1.87%", up:false},
  {t:"MSFT",  p:"$415.20",  c:"+1.12%", up:true },
  {t:"META",  p:"$512.87",  c:"+2.45%", up:true },
  {t:"SPY",   p:"$521.44",  c:"+0.62%", up:true },
  {t:"AMD",   p:"$164.32",  c:"-0.94%", up:false},
  {t:"JPM",   p:"$204.67",  c:"+0.55%", up:true },
];

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const Icon = {
  Chart:   ()=><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Scan:    ()=><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  Shield:  ()=><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Bell:    ()=><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  News:    ()=><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Brain:   ()=><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
  Info:    ()=><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Check:   ()=><svg width="14" height="14" fill="none" stroke="#2563eb" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  CheckG:  ()=><svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  X:       ()=><svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Star:    ()=><svg width="13" height="13" fill="#f59e0b" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Windows: ()=><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>,
  Apple:   ()=><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>,
};

// ── DOWNLOAD CONFIG ────────────────────────────────────────────────────────────
const VERSION = "1.0.0";
const DOWNLOADS = {
  win: {
    url: `https://github.com/YOUR_USERNAME/chartwiz/releases/latest/download/ChartWiz-Setup-${VERSION}.exe`,
    label: "Download for Windows",
    sub: `v${VERSION}  ·  ~90 MB  ·  Windows 10/11`,
  },
  mac: {
    url: `https://github.com/YOUR_USERNAME/chartwiz/releases/latest/download/ChartWiz-${VERSION}.dmg`,
    label: "Download for Mac",
    sub: `v${VERSION}  ·  ~95 MB  ·  macOS 11+`,
  },
};

function DownloadButtons({ center = false }) {
  const [os, setOs] = useState("win");
  useEffect(() => { if (navigator.userAgent.includes("Mac")) setOs("mac"); }, []);
  const primary   = DOWNLOADS[os];
  const secondary = DOWNLOADS[os === "win" ? "mac" : "win"];
  const align     = center ? "center" : "flex-start";
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:align, gap:12 }}>
      <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:align }}>
        <a href={primary.url} download style={{ textDecoration:"none" }}>
          <button className="primary-btn" style={{ display:"flex", alignItems:"center", gap:9, background:"#2563eb", color:"#fff", border:"none", borderRadius:9, cursor:"pointer", padding:"13px 22px", fontSize:14, fontWeight:700, fontFamily:"inherit", boxShadow:"0 4px 14px rgba(37,99,235,0.3)", transition:"all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}
            onMouseEnter={e=>{e.currentTarget.style.background="#1d4ed8"; e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="#2563eb"; e.currentTarget.style.transform="translateY(0)";}}>
            {os === "win" ? <Icon.Windows/> : <Icon.Apple/>}
            {primary.label}
          </button>
        </a>
        <a href={secondary.url} download style={{ textDecoration:"none" }}>
          <button style={{ display:"flex", alignItems:"center", gap:8, background:"transparent", color:"#475569", border:"1.5px solid #e2e8f0", borderRadius:9, cursor:"pointer", padding:"13px 18px", fontSize:13, fontWeight:500, fontFamily:"inherit", transition:"all 0.15s" }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor="#2563eb"; e.currentTarget.style.color="#2563eb"; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.color="#475569"; }}>
            {os === "win" ? <Icon.Apple/> : <Icon.Windows/>}
            {os === "win" ? "Mac" : "Windows"}
          </button>
        </a>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:14, justifyContent:align, flexWrap:"wrap" }}>
        <span style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11, fontWeight:600, color:"#16a34a", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:20, padding:"3px 10px" }}>
          <span style={{ width:5, height:5, borderRadius:"50%", background:"#16a34a", display:"inline-block" }}/>
          v{VERSION} — Latest
        </span>
        <span style={{ fontSize:12, color:"#94a3b8" }}>{primary.sub}</span>
      </div>
      <div style={{ display:"flex", gap:18, flexWrap:"wrap", justifyContent:align }}>
        {["Free to download","No account required","Auto-updates"].map(t=>(
          <div key={t} style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, color:"#64748b" }}>
            <Icon.CheckG/>{t}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HERO CHART ─────────────────────────────────────────────────────────────────
function HeroChart() {
  const candles = [];
  let price = 820;
  for (let i = 0; i < 60; i++) {
    const move = (Math.random() - 0.44) * price * 0.018;
    const open = price;
    price = Math.max(price + move, 700);
    const high = Math.max(open, price) + Math.random() * price * 0.005;
    const low  = Math.min(open, price) - Math.random() * price * 0.005;
    candles.push({ open, close: price, high, low, up: price >= open });
  }
  const vals = candles.flatMap(c => [c.high, c.low]);
  const min = Math.min(...vals)*0.998, max = Math.max(...vals)*1.002, range = max-min;
  const W = 340, H = 160, cw = W/candles.length;
  const closes = candles.map(c=>c.close);
  const ma = closes.map((_,i)=>i<14?null:closes.slice(i-14,i+1).reduce((a,b)=>a+b,0)/15);
  const maPts = ma.map((v,i)=>v?`${i*cw+cw/2},${H-((v-min)/range)*H}`:null).filter(Boolean).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:160}} preserveAspectRatio="none">
      {[0.25,0.5,0.75].map(g=><line key={g} x1="0" y1={H*g} x2={W} y2={H*g} stroke="#e2e8f0" strokeWidth="0.5"/>)}
      {candles.map((c,i)=>{
        const x=i*cw, bT=H-((Math.max(c.open,c.close)-min)/range)*H;
        const bB=H-((Math.min(c.open,c.close)-min)/range)*H;
        const wT=H-((c.high-min)/range)*H, wB=H-((c.low-min)/range)*H;
        const col=c.up?"#2563eb":"#dc2626";
        return(<g key={i}><line x1={x+cw/2} y1={wT} x2={x+cw/2} y2={wB} stroke={col} strokeWidth="0.8" opacity="0.45"/><rect x={x+0.3} y={bT} width={Math.max(cw-0.6,0.4)} height={Math.max(bB-bT,1)} fill={col} opacity="0.85"/></g>);
      })}
      {maPts&&<polyline points={maPts} fill="none" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.75"/>}
    </svg>
  );
}

// ── ANIMATED COUNTER ───────────────────────────────────────────────────────────
function Counter({ end, suffix="" }) {
  const [n,setN]=useState(0);
  const ref=useRef();
  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{
      if(e.isIntersecting){let v=0;const s=end/60;const t=setInterval(()=>{v+=s;if(v>=end){setN(end);clearInterval(t);}else setN(Math.floor(v));},16);}
    },{threshold:0.5});
    if(ref.current)obs.observe(ref.current);
    return()=>obs.disconnect();
  },[end]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

// ── AI CONVERSATION DEMO ───────────────────────────────────────────────────────
function AiConvoDemo() {
  const convos=[
    {q:"What does RSI mean?",a:"RSI measures momentum — how fast a stock is moving. Below 30 suggests it may be oversold. Above 70 suggests it may be overbought. NVDA is at 62 — healthy momentum, not extreme in either direction."},
    {q:"Is AAPL worth looking at right now?",a:"AAPL at $189 is trading above its 50-day average of $182 — generally a positive sign. RSI at 54 is neutral with room to move. The setup looks mildly constructive with support around $182 if price pulls back."},
    {q:"I'm new — where do I start?",a:"Start with the Signal Scanner. It finds stocks with strong setups so you don't have to dig through hundreds of charts manually. Pick one, open the chart, and ask me anything about it. Plain English answers every time."},
  ];
  const [active,setActive]=useState(0);
  useEffect(()=>{const t=setInterval(()=>setActive(a=>(a+1)%convos.length),4200);return()=>clearInterval(t);},[]);
  return(
    <div className="ai-demo-box" style={{background:"#f8f9fc",border:"1px solid #e2e8f0",borderRadius:12,padding:20,minHeight:170}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <div style={{width:26,height:26,background:"#2563eb",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{color:"#fff",fontSize:10,fontWeight:700}}>AI</span>
        </div>
        <span style={{fontSize:12,color:"#94a3b8",fontWeight:500}}>ChartWiz AI</span>
        <div style={{marginLeft:"auto",display:"flex",gap:4}}>
          {convos.map((_,i)=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:active===i?"#2563eb":"#e2e8f0",transition:"background 0.3s"}}/>)}
        </div>
      </div>
      {convos.map((c,i)=>(
        <div key={i} style={{display:active===i?"flex":"none",flexDirection:"column",gap:10,animation:"fadeUp 0.4s ease"}}>
          <div style={{alignSelf:"flex-end",background:"#2563eb",color:"#fff",padding:"8px 12px",borderRadius:"10px 10px 2px 10px",fontSize:13,maxWidth:"85%"}}>{c.q}</div>
          <div style={{alignSelf:"flex-start",background:"#fff",border:"1px solid #e2e8f0",padding:"10px 13px",borderRadius:"2px 10px 10px 10px",fontSize:13,color:"#475569",lineHeight:1.65,maxWidth:"95%"}}>{c.a}</div>
        </div>
      ))}
    </div>
  );
}

// ── LEARN SECTION ─────────────────────────────────────────────────────────────
const ARTICLES = [
  // Trading Basics
  {cat:"Trading Basics", title:"What is a stock? A plain-English guide for new investors", desc:"Stocks represent ownership in a company. Here's what that actually means, how prices move, and why people buy them.", mins:4},
  {cat:"Trading Basics", title:"How to read a stock chart for the first time", desc:"Candlestick charts look intimidating but follow simple rules. This guide walks you through open, high, low, and close — in plain English.", mins:5},
  {cat:"Trading Basics", title:"What is RSI and why does everyone talk about it?", desc:"RSI measures momentum — how fast a stock is moving. Learn how to spot overbought and oversold conditions without needing a finance degree.", mins:4},
  {cat:"Trading Basics", title:"Support and resistance: the two levels every trader watches", desc:"These price levels act like floors and ceilings on a chart. Understanding them helps you see where a stock might pause, bounce, or break out.", mins:5},
  {cat:"Trading Basics", title:"Volume explained: why it matters more than price alone", desc:"Price tells you what happened. Volume tells you how convincingly. Learn why high-volume moves are more meaningful than low-volume ones.", mins:3},
  {cat:"Trading Basics", title:"Moving averages: what they are and how traders use them", desc:"Moving averages smooth out price noise and help you see the trend. We cover the 20, 50, and 200-day averages and what each one signals.", mins:5},
  // Using ChartWiz
  {cat:"Using ChartWiz", title:"Getting started with ChartWiz: a walkthrough for new users", desc:"A step-by-step guide to setting up your watchlist, reading your first chart, and asking the AI your first question.", mins:6},
  {cat:"Using ChartWiz", title:"How to use the Signal Scanner to find trade setups", desc:"The scanner does the heavy lifting. Learn how to filter results, understand the signals it surfaces, and find stocks worth investigating.", mins:5},
  {cat:"Using ChartWiz", title:"Using the Risk Calculator before every trade", desc:"One of the most overlooked tools in trading. Learn how to use it to size your position correctly and protect your account from big losses.", mins:4},
  {cat:"Using ChartWiz", title:"How to draw support and resistance lines on your chart", desc:"Drawing your own levels takes about 30 seconds. This guide shows you how to add lines, move them, and delete ones you no longer need.", mins:3},
  {cat:"Using ChartWiz", title:"Setting price alerts so you never miss a move", desc:"Stop watching charts all day. Set an alert at your key price level and ChartWiz will notify you the moment the stock gets there.", mins:3},
  {cat:"Using ChartWiz", title:"How to ask the AI better questions and get better answers", desc:"The AI is only as useful as the question you ask. Here are the most effective ways to phrase your questions to get specific, actionable responses.", mins:4},
];

const CATS = ["All", "Trading Basics", "Using ChartWiz"];

function LearnSection() {
  const [activeCat, setActiveCat] = useState("All");
  const [expanded, setExpanded] = useState(false);
  const filtered = ARTICLES.filter(a => activeCat === "All" || a.cat === activeCat);
  const visible  = expanded ? filtered : filtered.slice(0, 6);

  return (
    <section id="learn" style={{background:"#f8f9fc",borderTop:"1px solid #e2e8f0",borderBottom:"1px solid #e2e8f0",padding:"96px 24px"}}>
      <div style={{maxWidth:1140,margin:"0 auto"}}>

        {/* Header */}
        <div style={{textAlign:"center",marginBottom:48}}>
          <div style={{display:"inline-block",background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:20,marginBottom:14}}>Learn</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3.5vw,44px)",fontWeight:700,color:"#0f1729",lineHeight:1.15,marginBottom:14}}>
            Learn to trade.<br/><em style={{color:"#2563eb",fontStyle:"italic",fontWeight:500}}>At your own pace.</em>
          </h2>
          <p style={{fontSize:16,color:"#475569",maxWidth:480,margin:"0 auto",lineHeight:1.7}}>
            Short, practical articles on trading basics and how to get the most out of ChartWiz. No jargon, no filler.
          </p>
        </div>

        {/* Category filter */}
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:40,flexWrap:"wrap"}}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>{setActiveCat(c);setExpanded(false);}}
              style={{padding:"7px 18px",borderRadius:20,border:`1.5px solid ${activeCat===c?"#2563eb":"#e2e8f0"}`,background:activeCat===c?"#2563eb":"#fff",color:activeCat===c?"#fff":"#475569",fontSize:13,fontWeight:activeCat===c?600:400,cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit"}}>
              {c}
            </button>
          ))}
        </div>

        {/* Article grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18,marginBottom:36}}>
          {visible.map((a,i)=>(
            <div key={i} style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"22px 22px 20px",display:"flex",flexDirection:"column",gap:10,cursor:"pointer",transition:"all 0.18s"}}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="#bfdbfe";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor="#e2e8f0";}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:10,fontWeight:600,color:a.cat==="Using ChartWiz"?"#2563eb":"#d97706",background:a.cat==="Using ChartWiz"?"#eff6ff":"#fffbeb",border:`1px solid ${a.cat==="Using ChartWiz"?"#bfdbfe":"#fde68a"}`,borderRadius:20,padding:"2px 10px"}}>
                  {a.cat}
                </span>
                <span style={{fontSize:11,color:"#94a3b8"}}>{a.mins} min read</span>
              </div>
              <h3 style={{fontSize:14,fontWeight:700,color:"#0f1729",lineHeight:1.4,margin:0}}>{a.title}</h3>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.65,margin:0,flex:1}}>{a.desc}</p>
              <div style={{display:"flex",alignItems:"center",gap:4,fontSize:12,fontWeight:600,color:"#2563eb",marginTop:4}}>
                Read article
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          ))}
        </div>

        {/* Show more / less */}
        {filtered.length > 6 && (
          <div style={{textAlign:"center"}}>
            <button onClick={()=>setExpanded(v=>!v)}
              style={{padding:"10px 28px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",color:"#475569",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="#2563eb";e.currentTarget.style.color="#2563eb";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.color="#475569";}}>
              {expanded ? "Show fewer articles" : `View all ${filtered.length} articles`}
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [annual,setAnnual]=useState(false);
  const [faqOpen,setFaqOpen]=useState(null);
  const tickRef=useRef(null);

  useEffect(()=>{
    let pos=0,raf;
    const animate=()=>{
      pos-=0.4;
      if(tickRef.current){const half=tickRef.current.scrollWidth/2;if(Math.abs(pos)>=half)pos=0;tickRef.current.style.transform=`translateX(${pos}px)`;}
      raf=requestAnimationFrame(animate);
    };
    raf=requestAnimationFrame(animate);
    return()=>cancelAnimationFrame(raf);
  },[]);

  const PLANS=[
    {name:"Free",price:{m:"$0",a:"$0"},desc:"Get started with no commitment.",hot:false,
     features:["Full stock dashboard","5 watchlist symbols","Daily charts","Basic drawing tools","Signal scanner (once per day)"],
     locked:["AI chart analysis","Intraday charts (1m–1H)","Unlimited scanner","Price alerts","News feed"],cta:"Download Free"},
    {name:"Pro",price:{m:"$6.99",a:"$5.99"},desc:"Everything you need to invest with confidence.",hot:true,
     features:["15-min delayed data","Unlimited AI questions","25 watchlist symbols","All chart timeframes","All drawing tools & indicators","20 price alerts","Full news feed","Priority support"],
     locked:[],cta:"Start 14-Day Free Trial"},
  ];

  const VS=[
    {feature:"AI chart analysis",us:true,them:false},
    {feature:"Plain-English explanations",us:true,them:false},
    {feature:"Signal scanner",us:true,them:false},
    {feature:"Risk calculator",us:true,them:false},
    {feature:"Ads on free plan",us:false,them:true,flip:true},
    {feature:"400+ indicators (overwhelming)",us:false,them:true,flip:true},
    {feature:"Free trial on paid plans",us:true,them:false},
    {feature:"Price (comparable plan)",us:"$7/mo",them:"$14.95/mo"},
  ];

  return(
    <div className="app-container" style={{background:"#ffffff",color:"#09090b",fontFamily:"'Inter',sans-serif",minHeight:"100vh",overflowX:"hidden"}}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:6px;} ::-webkit-scrollbar-thumb{background:#d4d4d8;border-radius:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        button,a{cursor:pointer;font-family:inherit;}
        input{font-family:inherit;}
        .tick-tape{display:inline-flex;white-space:nowrap;}
        .tick-item{display:inline-flex;align-items:center;gap:10px;padding:0 24px;font-family:'JetBrains Mono',monospace;font-size:13px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .f1{animation:fadeUp 0.4s 0.05s both cubic-bezier(0.16, 1, 0.3, 1);}
        .f2{animation:fadeUp 0.4s 0.1s both cubic-bezier(0.16, 1, 0.3, 1);}
        .f3{animation:fadeUp 0.4s 0.15s both cubic-bezier(0.16, 1, 0.3, 1);}
        .f4{animation:fadeUp 0.4s 0.2s both cubic-bezier(0.16, 1, 0.3, 1);}
        .faq-row{border-bottom:1px solid #e4e4e7;}
        .faq-btn{width:100%;background:none;border:none;color:#09090b;font-family:inherit;font-size:15px;font-weight:500;padding:24px 0;text-align:left;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;transition:color 0.2s;}
        .faq-btn:hover{color:#2563eb;}
        .tab-btn{background:none;border:none;padding:7px 16px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;transition:all 0.2s;}
      `}</style>

      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(255,255,255,0.95)",backdropFilter:"blur(12px)",borderBottom:"1px solid #e2e8f0"}}>
        <div style={{maxWidth:1140,margin:"0 auto",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:36}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <svg width="34" height="34" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="16" fill="#2563EB"/><polyline points="8,15 16,31 24,20 32,31 40,12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="40" cy="12" r="3" fill="white"/></svg>
              <span style={{fontSize:17,fontWeight:700,color:"#0f1729",letterSpacing:"-0.02em"}}>ChartWiz</span>
            </div>
            <div style={{display:"flex",gap:2}}>
              {[["How it Works","#how"],["Pricing","#pricing"],["Learn","#learn"]].map(([l,h])=>(
                <a key={l} href={h} style={{textDecoration:"none"}}><button className="nav-link">{l}</button></a>
              ))}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button className="nav-link">Log in</button>
            <a href={DOWNLOADS.win.url} download style={{textDecoration:"none"}}>
              <button className="primary-btn" style={{background:"#2563eb",color:"#fff",border:"none",borderRadius:7,padding:"8px 18px",fontSize:13,fontWeight:600,fontFamily:"inherit",boxShadow:"0 2px 8px rgba(37,99,235,0.28)", transition:"all 0.3s"}}>
                Download Free
              </button>
            </a>
          </div>
        </div>
      </nav>

      {/* TICKER */}
      <div className="tick-tape-container" style={{background:"#f8f9fc",borderBottom:"1px solid #e2e8f0",overflow:"hidden",padding:"8px 0"}}>
        <div ref={tickRef} className="tick-tape">
          {[...TICKERS,...TICKERS,...TICKERS,...TICKERS].map((tk,i)=>(
            <div key={i} className="tick-item">
              <span style={{fontWeight:600,color:"#0f1729"}}>{tk.t}</span>
              <span style={{color:"#475569"}}>{tk.p}</span>
              <span style={{color:tk.up?"#16a34a":"#dc2626",fontWeight:600}}>{tk.c}</span>
              <span style={{color:"#e2e8f0"}}>|</span>
            </div>
          ))}
        </div>
      </div>

      {/* HERO */}
      <section style={{maxWidth:1140,margin:"0 auto",padding:"84px 24px 76px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:64,alignItems:"center"}}>
        <div>
          <div className="f1" style={{display:"inline-flex",alignItems:"center",gap:7,background:"#eff6ff",border:"1px solid #bfdbfe",color:"#2563eb",fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:20,marginBottom:24}}>
            <span style={{width:6,height:6,background:"#2563eb",borderRadius:"50%"}}/>
            Built for investors at every level
          </div>
          <h1 className="f2" style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(36px,4vw,52px)",fontWeight:700,color:"#0f1729",lineHeight:1.1,marginBottom:20,letterSpacing:"-0.02em"}}>
            Understand any stock<br/>in <em style={{color:"#2563eb",fontStyle:"italic",fontWeight:500}}>plain English.</em>
          </h1>
          <p className="f3" style={{fontSize:17,color:"#475569",lineHeight:1.8,marginBottom:10,maxWidth:480}}>
            ChartWiz reads the charts so you don't have to. Get clear signals, plain-English explanations, and an AI you can ask anything — free to download.
          </p>
          <p className="f3" style={{fontSize:14,color:"#94a3b8",marginBottom:40,maxWidth:480}}>No finance degree required. No overwhelming jargon.</p>
          <div className="f4"><DownloadButtons/></div>
        </div>

        <div className="f3">
          <div className="hero-card" style={{borderRadius:16,overflow:"hidden",boxShadow:"0 16px 48px rgba(37,99,235,0.11)",border:"1px solid #e2e8f0",background:"#fff"}}>
            <div style={{padding:"16px 20px",borderBottom:"1px solid #e2e8f0"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:15,color:"#0f1729"}}>NVDA</span>
                    <span style={{fontSize:12,color:"#94a3b8"}}>NVIDIA Corp</span>
                  </div>
                  <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                    <span style={{fontSize:26,fontWeight:700,color:"#0f1729",fontFamily:"'DM Mono',monospace"}}>$887.42</span>
                    <span style={{fontSize:13,color:"#16a34a",fontWeight:600}}>+3.21%</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,color:"#94a3b8",marginBottom:5,letterSpacing:"0.06em",textTransform:"uppercase"}}>AI Signal</div>
                  <span style={{background:"#2563eb",color:"#fff",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:5,display:"inline-block"}}>Bullish</span>
                </div>
              </div>
            </div>
            <div style={{padding:"10px 16px 6px",background:"#f8f9fc"}}><HeroChart/></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",borderTop:"1px solid #e2e8f0",borderBottom:"1px solid #e2e8f0"}}>
              {[{l:"Momentum",v:"Strong",c:"#16a34a"},{l:"Trend",v:"Upward",c:"#2563eb"},{l:"Volume",v:"Above avg",c:"#0f1729"},{l:"RSI",v:"62",c:"#d97706"}].map((s,i)=>(
                <div key={i} style={{padding:"10px 12px",borderRight:i<3?"1px solid #e2e8f0":"none"}}>
                  <div style={{fontSize:9,color:"#94a3b8",letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:3}}>{s.l}</div>
                  <div style={{fontSize:13,fontWeight:700,color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"14px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{width:28,height:28,background:"#2563eb",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{color:"#fff",fontSize:11,fontWeight:700}}>AI</span>
              </div>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.65}}>
                <strong style={{color:"#0f1729"}}>NVDA is trending higher with healthy momentum.</strong> Volume is above average, which suggests active participation. The $855 area is commonly referenced as nearby support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <div style={{background:"#f8f9fc",borderTop:"1px solid #e2e8f0",borderBottom:"1px solid #e2e8f0",padding:"18px 24px"}}>
        <div style={{maxWidth:1140,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:20}}>
          <div style={{fontSize:13,color:"#94a3b8"}}>Trusted by <strong style={{color:"#0f1729"}}>12,000+</strong> investors</div>
          <div style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
            {[{bg:"#2563eb",init:"M",name:"Marcus",text:"\"Finally understand what I'm buying\""},{bg:"#16a34a",init:"S",name:"Sarah",text:"\"The AI saved me from a bad trade\""},{bg:"#d97706",init:"J",name:"James",text:"\"Best $7 I spend each month\""}].map((r,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:r.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",flexShrink:0}}>{r.init}</div>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#0f1729"}}>{r.name}</div>
                  <div style={{fontSize:11,color:"#94a3b8"}}>{r.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="how" style={{maxWidth:1140,margin:"0 auto",padding:"96px 24px"}}>
        <div style={{textAlign:"center",marginBottom:64}}>
          <div style={{display:"inline-block",background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:20,marginBottom:14}}>How It Works</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3.5vw,44px)",fontWeight:700,color:"#0f1729",lineHeight:1.15,marginBottom:14}}>
            From confused to confident<br/><em style={{color:"#2563eb",fontStyle:"italic",fontWeight:500}}>in three steps.</em>
          </h2>
          <p style={{fontSize:16,color:"#475569",maxWidth:480,margin:"0 auto",lineHeight:1.7}}>No courses to take. No books to read. ChartWiz does the analysis — you make the decisions.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24,position:"relative"}}>
          <div style={{position:"absolute",top:32,left:"calc(16.6% + 24px)",right:"calc(16.6% + 24px)",height:1,background:"linear-gradient(90deg,#bfdbfe,#2563eb,#bfdbfe)",zIndex:0}}/>
          {[
            {num:"01",icon:<Icon.Scan/>,title:"Find a setup",desc:"The Signal Scanner automatically surfaces stocks with strong patterns so you always know where to look — no manual searching required.",col:"#eff6ff",border:"#bfdbfe",text:"#2563eb"},
            {num:"02",icon:<Icon.Brain/>,title:"Understand it",desc:"Open any chart and ask the AI what you're looking at. \"Is this a good entry?\" \"What does this indicator mean?\" — plain English answers every time.",col:"#f0fdf4",border:"#bbf7d0",text:"#16a34a"},
            {num:"03",icon:<Icon.Shield/>,title:"Manage your risk",desc:"Use the Risk Calculator before every trade. Enter your account size and maximum loss — it tells you exactly how many shares to buy.",col:"#fffbeb",border:"#fde68a",text:"#d97706"},
          ].map((s,i)=>(
            <div key={i} className="step-card" style={{background:s.col,border:`1.5px solid ${s.border}`,borderRadius:14,padding:"28px 24px",position:"relative",zIndex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
                <div style={{width:40,height:40,background:"#fff",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:s.text,border:`1px solid ${s.border}`}}>{s.icon}</div>
                <span style={{fontSize:11,fontWeight:700,color:s.text,letterSpacing:"0.06em"}}>{s.num}</span>
              </div>
              <h3 style={{fontSize:17,fontWeight:700,color:"#0f1729",marginBottom:10}}>{s.title}</h3>
              <p style={{fontSize:14,color:"#475569",lineHeight:1.75}}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI DEMO */}
      <section style={{background:"#f8f9fc",borderTop:"1px solid #e2e8f0",borderBottom:"1px solid #e2e8f0",padding:"80px 24px"}}>
        <div style={{maxWidth:1100,margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:72,alignItems:"center"}}>
          <div>
            <div style={{display:"inline-block",background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:20,marginBottom:16}}>AI Trading Assistant</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3.2vw,42px)",fontWeight:700,color:"#0f1729",lineHeight:1.15,marginBottom:16}}>
              Ask anything.<br/><em style={{color:"#2563eb",fontStyle:"italic",fontWeight:500}}>Get a real answer.</em>
            </h2>
            <p style={{fontSize:15,color:"#475569",lineHeight:1.8,marginBottom:24}}>Most trading tools show you charts and leave you to figure it out. ChartWiz AI explains what every chart and indicator means based on current data — not generic advice.</p>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[
                {q:"\"Should I buy this stock?\"",a:"Gets a direct signal with specific reasoning behind it"},
                {q:"\"What does RSI mean?\"",a:"Gets a plain-English explanation in seconds"},
                {q:"\"How much should I risk?\"",a:"Gets position size, stop-loss level, and risk percentage"},
              ].map((item,i)=>(
                <div key={i} style={{display:"flex",gap:14,alignItems:"center",padding:"12px 16px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:10}}>
                  <div style={{fontSize:13,color:"#2563eb",fontWeight:600,fontFamily:"'DM Mono',monospace",flexShrink:0}}>{item.q}</div>
                  <div style={{width:1,background:"#e2e8f0",alignSelf:"stretch",flexShrink:0}}/>
                  <div style={{fontSize:13,color:"#475569"}}>{item.a}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <AiConvoDemo/>
            <div style={{marginTop:14,padding:"13px 15px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{color:"#2563eb",flexShrink:0,marginTop:1}}><Icon.Info/></div>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.65}}><strong style={{color:"#0f1729"}}>Unlike a Google search</strong> — ChartWiz AI knows what the stock is doing right now and gives answers based on real current data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{maxWidth:1140,margin:"0 auto",padding:"96px 24px"}}>
        <div style={{textAlign:"center",marginBottom:60}}>
          <div style={{display:"inline-block",background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:20,marginBottom:14}}>What You Get</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3.5vw,44px)",fontWeight:700,color:"#0f1729",lineHeight:1.15,marginBottom:14}}>
            Professional tools.<br/><em style={{color:"#2563eb",fontStyle:"italic",fontWeight:500}}>Designed to be simple.</em>
          </h2>
          <p style={{fontSize:16,color:"#475569",maxWidth:500,margin:"0 auto",lineHeight:1.7}}>Every feature is designed to make you a smarter investor — not to overwhelm you with options you'll never use.</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
          {[
            {icon:<Icon.Chart/>,title:"Live Stock Charts",desc:"See how any stock has moved over time. Add indicators with one click, draw your own levels, and switch between timeframes instantly.",badge:null},
            {icon:<Icon.Brain/>,title:"AI That Explains Everything",desc:"Every signal, every indicator, every chart pattern — explained in plain English. Ask follow-up questions. Get specific. No more Googling jargon.",badge:"Most used"},
            {icon:<Icon.Scan/>,title:"Signal Scanner",desc:"Instead of checking hundreds of charts manually, the scanner surfaces stocks with strong patterns right now so you always know where to look.",badge:null},
            {icon:<Icon.Shield/>,title:"Risk Calculator",desc:"Know exactly how many shares to buy before you place a trade. Enter your account size and maximum loss — it calculates everything automatically.",badge:"Protect your account"},
            {icon:<Icon.Bell/>,title:"Price Alerts",desc:"Set an alert on any stock and get notified the moment it hits your price. Stop watching charts all day.",badge:null},
            {icon:<Icon.News/>,title:"Pre-Analyzed News",desc:"Every headline is tagged Bullish, Bearish, or Neutral so you instantly know if news is good or bad for the stock — no interpretation needed.",badge:null},
          ].map((f,i)=>(
            <div key={i} className="feat-card" style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"24px 22px",position:"relative"}}>
              {f.badge&&<div style={{position:"absolute",top:14,right:14,fontSize:10,fontWeight:600,color:"#2563eb",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:10,padding:"2px 8px"}}>{f.badge}</div>}
              <div style={{width:44,height:44,background:"#eff6ff",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"#2563eb",marginBottom:14}}>{f.icon}</div>
              <h3 style={{fontSize:15,fontWeight:700,color:"#0f1729",marginBottom:8}}>{f.title}</h3>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.75}}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VS — hidden, keeping data in case needed later */}
      {false && <section style={{background:"#f8f9fc",borderTop:"1px solid #e2e8f0",borderBottom:"1px solid #e2e8f0",padding:"80px 24px"}}>
        <div style={{maxWidth:800,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <div style={{display:"inline-block",background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:20,marginBottom:14}}>ChartWiz vs TradingView</div>
            <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(26px,3vw,40px)",fontWeight:700,color:"#0f1729",lineHeight:1.15,marginBottom:12}}>
              Same charts. Half the price.<br/><em style={{color:"#2563eb",fontStyle:"italic",fontWeight:500}}>Plus AI they don't have.</em>
            </h2>
            <p style={{fontSize:15,color:"#475569",lineHeight:1.7}}>TradingView is great — but it's overwhelming for beginners, shows ads on free, and has no AI. We built ChartWiz to fix all three.</p>
          </div>
          <div style={{overflow:"hidden",border:"1px solid #e2e8f0",borderRadius:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",background:"#0f1729",padding:"14px 20px"}}>
              <div style={{fontSize:12,color:"#64748b",fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>Feature</div>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <svg width="20" height="20" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill="#2563EB"/><polyline points="8,15 16,31 24,20 32,31 40,12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="40" cy="12" r="3" fill="white"/></svg>
                ChartWiz
              </div>
              <div style={{fontSize:13,fontWeight:600,color:"#64748b",textAlign:"center"}}>TradingView</div>
            </div>
            {VS.map((row,i)=>(
              <div key={i} className="vs-row" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"13px 20px",borderBottom:i<VS.length-1?"1px solid #e2e8f0":"none",alignItems:"center"}}>
                <div style={{fontSize:13,color:"#475569",fontWeight:500}}>{row.feature}</div>
                <div style={{textAlign:"center",fontSize:13,fontWeight:700}}>
                  {typeof row.us==="string"?<span style={{color:"#16a34a"}}>{row.us}</span>
                    :row.us&&!row.flip?<Icon.CheckG/>
                    :!row.us&&row.flip?<span style={{color:"#16a34a",fontSize:12,fontWeight:600}}>No</span>
                    :<Icon.X/>}
                </div>
                <div style={{textAlign:"center",fontSize:13,fontWeight:600}}>
                  {typeof row.them==="string"?<span style={{color:"#dc2626"}}>{row.them}</span>
                    :row.them&&!row.flip?<Icon.CheckG/>
                    :!row.them&&row.flip?<span style={{color:"#dc2626",fontSize:12,fontWeight:600}}>Yes</span>
                    :<Icon.X/>}
                </div>
              </div>
            ))}
          </div>
          <p style={{textAlign:"center",fontSize:13,color:"#94a3b8",marginTop:14}}>TradingView is a strong tool for advanced traders. ChartWiz is built for everyone else.</p>
        </div>
      </section>}

      {/* STATS */}
      <section style={{maxWidth:1140,margin:"0 auto",padding:"72px 24px"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:18}}>
          {[
            {v:12000,s:"+",l:"Investors signed up",sub:"and growing every day"},
            {v:8400,s:"+",l:"Stocks covered",sub:"US equities and ETFs"},
            {v:0,s:"$0",l:"To get started",sub:"Free forever, upgrade anytime",custom:true},
            {v:30,s:" sec",l:"To open an account",sub:"No lengthy forms"},
          ].map((s,i)=>(
            <div key={i} style={{border:"1px solid #e2e8f0",borderRadius:12,padding:"26px 22px",textAlign:"center"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:40,fontWeight:700,color:"#0f1729",lineHeight:1,marginBottom:6}}>
                {s.custom?<span>{s.s}</span>:<Counter end={s.v} suffix={s.s}/>}
              </div>
              <div style={{fontSize:13,fontWeight:600,color:"#0f1729",marginBottom:3}}>{s.l}</div>
              <div style={{fontSize:12,color:"#94a3b8"}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{background:"#f8f9fc",borderTop:"1px solid #e2e8f0",borderBottom:"1px solid #e2e8f0",padding:"80px 24px"}}>
        <div style={{maxWidth:1140,margin:"0 auto"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:36,fontWeight:700,color:"#0f1729",textAlign:"center",marginBottom:8}}>What our users say</h2>
          <p style={{textAlign:"center",fontSize:15,color:"#94a3b8",marginBottom:48}}>From first-time investors to experienced traders who wanted something simpler.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:18}}>
            {[
              {bg:"#2563eb",init:"M",name:"Marcus T.",role:"New investor, 6 months in",text:"I tried TradingView and had no idea what I was looking at. ChartWiz was the first tool where I actually understood what the chart was telling me. The AI explains everything without making me feel lost."},
              {bg:"#16a34a",init:"S",name:"Sarah K.",role:"Moved savings to stocks last year",text:"The risk calculator alone is worth the subscription. I used to guess how many shares to buy. Now I know exactly how much I'm risking on every trade before I place it."},
              {bg:"#d97706",init:"J",name:"James L.",role:"Casual investor, 2 years trading",text:"I still use TradingView for some things, but ChartWiz is where I go first. The signal scanner finds setups I would have missed, and the AI saves me significant research time every morning."},
            ].map((t,i)=>(
              <div key={i} style={{border:"1px solid #e2e8f0",borderRadius:12,padding:"24px 22px",background:"#fff"}}>
                <div style={{display:"flex",gap:2,marginBottom:14}}>{[...Array(5)].map((_,j)=><Icon.Star key={j}/>)}</div>
                <p style={{fontSize:14,color:"#475569",lineHeight:1.8,marginBottom:18}}>"{t.text}"</p>
                <div style={{height:1,background:"#e2e8f0",marginBottom:14}}/>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:t.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{t.init}</div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#0f1729"}}>{t.name}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{maxWidth:1100,margin:"0 auto",padding:"96px 24px"}}>
        <div style={{textAlign:"center",marginBottom:52}}>
          <div style={{display:"inline-block",background:"#f1f5f9",color:"#475569",fontSize:12,fontWeight:600,padding:"5px 14px",borderRadius:20,marginBottom:14}}>Pricing</div>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,3.5vw,44px)",fontWeight:700,color:"#0f1729",lineHeight:1.15,marginBottom:16}}>
            Start free.<br/><em style={{color:"#2563eb",fontStyle:"italic",fontWeight:500}}>Upgrade when you're ready.</em>
          </h2>
          <p style={{fontSize:15,color:"#475569",maxWidth:480,margin:"0 auto 24px",lineHeight:1.7}}>The free plan is genuinely useful. Upgrade when you want AI analysis, more stocks, or real-time data.</p>
          <div style={{display:"inline-flex",background:"#f1f5f9",borderRadius:8,padding:4,gap:2}}>
            {[["monthly","Monthly"],["annual","Annual — save ~20%"]].map(([v,l])=>(
              <button key={v} className="tab-btn" onClick={()=>setAnnual(v==="annual")}
                style={{background:annual===(v==="annual")?"#fff":"transparent",color:annual===(v==="annual")?"#0f1729":"#64748b",fontWeight:annual===(v==="annual")?600:400,boxShadow:annual===(v==="annual")?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"start",maxWidth:780,margin:"0 auto"}}>
          {PLANS.map((plan,pi)=>(
            <div key={pi} className="plan-card" style={{border:plan.hot?"2px solid #2563eb":"1.5px solid #e2e8f0",borderRadius:16,position:"relative",boxShadow:plan.hot?"0 8px 28px rgba(37,99,235,0.12)":"none",background:"#fff"}}>
              {plan.hot&&<div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",background:"#2563eb",color:"#fff",fontSize:11,fontWeight:700,padding:"4px 18px",borderRadius:20,whiteSpace:"nowrap"}}>Most Popular</div>}
              <div style={{padding:"28px 28px 0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:19,fontWeight:700,color:"#0f1729",fontFamily:"inherit"}}>{plan.name}</span>
                  <span style={{fontSize:10,fontWeight:600,background:"#f8fafc",color:"#94a3b8",border:"1px solid #e2e8f0",borderRadius:20,padding:"3px 8px"}}>
                    {plan.name==="Free"?"Free forever":"15-min delay"}
                  </span>
                </div>
                <p style={{fontSize:13,color:"#94a3b8",marginBottom:16}}>{plan.desc}</p>
                <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <span style={{fontSize:48,fontWeight:800,color:plan.hot?"#2563eb":"#0f1729",fontFamily:"'DM Mono',monospace",lineHeight:1}}>{annual?plan.price.a:plan.price.m}</span>
                  {plan.price.m!=="$0"&&<span style={{fontSize:14,color:"#94a3b8"}}>/mo</span>}
                  {annual&&plan.price.m!=="$0"&&<span style={{fontSize:11,color:"#16a34a",fontWeight:600,marginLeft:4}}>billed annually</span>}
                </div>
              </div>
              <div style={{height:1,background:"#e2e8f0",margin:"20px 0"}}/>
              <div style={{padding:"0 28px"}}>
                <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:10}}>Included</div>
                <div style={{display:"flex",flexDirection:"column",gap:9,marginBottom:plan.locked.length?16:0}}>
                  {plan.features.map((f,i)=>(
                    <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start"}}>
                      <span style={{marginTop:1,flexShrink:0}}><Icon.Check/></span>
                      <span style={{fontSize:13,color:"#475569",lineHeight:1.45}}>{f}</span>
                    </div>
                  ))}
                </div>
                {plan.locked.length>0&&(
                  <>
                    <div style={{fontSize:11,color:"#94a3b8",fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",margin:"14px 0 10px"}}>Not included</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {plan.locked.map((f,i)=>(
                        <div key={i} style={{display:"flex",gap:9,alignItems:"flex-start",opacity:0.4}}>
                          <span style={{marginTop:1,flexShrink:0}}><Icon.X/></span>
                          <span style={{fontSize:13,color:"#94a3b8"}}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <div style={{padding:"24px 28px 28px"}}>
                <button className={plan.hot ? "primary-btn" : ""} style={{width:"100%",padding:"14px 0",fontSize:14,fontFamily:"inherit",fontWeight:700,background:plan.hot?"#2563eb":"transparent",color:plan.hot?"#fff":"#0f1729",border:plan.hot?"none":"1.5px solid #e2e8f0",borderRadius:9,boxShadow:plan.hot?"0 4px 14px rgba(37,99,235,0.28)":"none",cursor:"pointer", transition: "all 0.3s"}}>
                  {plan.cta}
                </button>
                {plan.price.m!=="$0"&&<p style={{textAlign:"center",fontSize:11,color:"#94a3b8",marginTop:10}}>14-day free trial · Cancel anytime</p>}
              </div>
            </div>
          ))}
        </div>
        <div style={{marginTop:24,padding:"16px 22px",background:"#f8f9fc",border:"1px solid #e2e8f0",borderRadius:10,textAlign:"center"}}>
          <p style={{fontSize:13,color:"#475569",lineHeight:1.7}}>
            <strong style={{color:"#0f1729"}}>Not sure which plan?</strong> Start with the free download. Most users stay on the free plan for weeks before upgrading. No pressure and no expiry on your free account.
          </p>
        </div>
      </section>

      {/* LEARN */}
      <LearnSection/>

      {/* FAQ */}
      <section style={{maxWidth:700,margin:"0 auto",padding:"0 24px 80px"}}>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:34,fontWeight:700,color:"#0f1729",textAlign:"center",marginBottom:48}}>Common questions</h2>
        {[
          {q:"Do I need to know anything about investing to use this?",a:"Not at all — that's the whole point. ChartWiz is designed for people who are just starting out. The AI explains every chart, every indicator, and every signal in plain English. You can ask 'what does this mean?' and get a clear answer."},
          {q:"Is it really free? What's the catch?",a:"Genuinely free to download. No credit card, no trial that auto-charges. The free plan gives you full access to the dashboard and charts. Upgrade when you want AI analysis, more watchlist symbols, or real-time data."},
          {q:"What's the difference between the plans?",a:"Free and Pro show prices from 15 minutes ago — fine for swing trading and investing where you're holding for days or weeks. Day Trader shows live prices updated in real time, which you need for active intraday trading."},
          {q:"How is this different from just Googling stock tips?",a:"Google gives you generic opinions. ChartWiz AI looks at the actual current data for the specific stock you're asking about — its RSI, moving averages, volume, price action — and gives you analysis based on that."},
          {q:"Can I cancel my subscription anytime?",a:"Yes, always. No contracts, no cancellation fees. Cancel from your account settings whenever you want."},
          {q:"What stocks can I analyze?",a:"All major US equities and ETFs — over 8,400 stocks total including NVDA, AAPL, TSLA, SPY, QQQ, and thousands more."},
        ].map((f,i)=>(
          <div key={i} className="faq-row">
            <button className="faq-btn" onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
              <span>{f.q}</span>
              <span style={{color:"#2563eb",fontSize:22,transition:"transform 0.2s",transform:faqOpen===i?"rotate(45deg)":"rotate(0deg)",display:"inline-block",flexShrink:0}}>+</span>
            </button>
            <div style={{maxHeight:faqOpen===i?300:0,overflow:"hidden",transition:"max-height 0.35s ease"}}>
              <p style={{fontSize:14,color:"#475569",lineHeight:1.85,paddingBottom:20}}>{f.a}</p>
            </div>
          </div>
        ))}
      </section>

      {/* FINAL CTA */}
        <section style={{background: "var(--bg-primary)", padding:"88px 24px", color: "var(--text-main)"}}>
        <div style={{maxWidth:580,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:"clamp(28px,4vw,46px)",fontWeight:700,color:"#fff",lineHeight:1.15,marginBottom:14}}>
            Stop guessing.<br/><em style={{color:"#93c5fd",fontStyle:"italic",fontWeight:500}}>Start understanding.</em>
          </h2>
          <p style={{fontSize:15,color:"#64748b",lineHeight:1.75,marginBottom:36}}>
            Join 12,000+ investors who use ChartWiz to make smarter decisions — even if they're just starting out.
          </p>
          <DownloadButtons center/>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#0f1729",borderTop:"1px solid rgba(255,255,255,0.06)",padding:"28px 24px"}}>
        <div style={{maxWidth:1140,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <svg width="30" height="30" viewBox="0 0 48 48" fill="none"><rect width="48" height="48" rx="14" fill="#2563EB"/><polyline points="8,15 16,31 24,20 32,31 40,12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="40" cy="12" r="3" fill="white"/></svg>
            <span style={{fontSize:14,fontWeight:700,color:"#fff"}}>ChartWiz</span>
            <span style={{fontSize:12,color:"#334155",marginLeft:6}}>The stock analysis tool for everyone</span>
          </div>
          <div style={{display:"flex",gap:2}}>
            {["Privacy","Terms","Contact"].map(l=>(
              <button key={l} className="nav-link" style={{color:"#475569",fontSize:13}}>{l}</button>
            ))}
          </div>
          <span style={{fontSize:12,color:"#334155"}}>© 2025 ChartWiz. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
