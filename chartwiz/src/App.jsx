// ─── CANVAS ROUNDRECT POLYFILL ───────────────────────────────────────────────
if(typeof CanvasRenderingContext2D!=="undefined"&&!CanvasRenderingContext2D.prototype.roundRect){
  CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r=0){
    const R=Math.min(r,w/2,h/2);
    this.beginPath();
    this.moveTo(x+R,y);
    this.lineTo(x+w-R,y);this.quadraticCurveTo(x+w,y,x+w,y+R);
    this.lineTo(x+w,y+h-R);this.quadraticCurveTo(x+w,y+h,x+w-R,y+h);
    this.lineTo(x+R,y+h);this.quadraticCurveTo(x,y+h,x,y+h-R);
    this.lineTo(x,y+R);this.quadraticCurveTo(x,y,x+R,y);
    this.closePath();
    return this;
  };
}

import { useState, useEffect, useRef, useCallback, Component } from "react";

class ErrorBoundary extends Component {
  constructor(props){super(props);this.state={err:null};}
  static getDerivedStateFromError(e){return{err:e};}
  render(){
    if(this.state.err)return(
      <div style={{padding:40,fontFamily:"monospace",color:"#dc2626",background:"#fff",height:"100vh"}}>
        <h2 style={{marginBottom:16}}>⚠ ChartWiz Error</h2>
        <pre style={{background:"#fef2f2",padding:20,borderRadius:8,overflow:"auto",fontSize:13}}>{this.state.err.message}\n\n{this.state.err.stack}</pre>
        <p style={{marginTop:16,color:"#666",fontSize:13}}>Open DevTools Console (F12) for more details.</p>
      </div>
    );
    return this.props.children;
  }
}

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const LIGHT = {
  bg:"#F8FAFC",
  surface:"#FFFFFF",
  surfaceRaised:"#F1F5F9",
  border:"#E2E8F0",
  borderLight:"#F1F5F9",
  text:"#000000",
  textSub:"#000000",
  textMuted:"#111111",
  accent:"#2563EB",
  accentLight:"#EFF6FF",
  accentBorder:"#BFDBFE",
  pos:"#16A34A",
  neg:"#DC2626",
  amber:"#D97706",
  chartBg:"#FFFFFF",
  chartGrid:"#F1F5F9",
  chartText:"#1a1a1a",
  panelBg:"#F8FAFC",
  shadow:"0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)",
  shadowMd:"0 4px 6px rgba(15,23,42,0.05), 0 2px 4px rgba(15,23,42,0.04)",
  ui:"'DM Sans', system-ui, sans-serif", num:"'DM Mono', monospace",
};
const DARK = {
  bg:"#0F1117", surface:"#161B22", surfaceRaised:"#1C2128", border:"#21262D", borderLight:"#1C2128",
  text:"#E6EDF3", textSub:"#C9D1D9", textMuted:"#8B949E",
  accent:"#4493F8", accentLight:"#1A2637", accentBorder:"#1D4170",
  pos:"#3FB950", neg:"#F85149", amber:"#D29922",
  chartBg:"#0D1117", chartGrid:"#1C2128", chartText:"#484F58",
  panelBg:"#0D1117",
  ui:"'DM Sans', system-ui, sans-serif", num:"'DM Mono', monospace",
};
// C is set at render time via context — components receive it as prop
const C = LIGHT; // fallback (overridden at component level via theme prop)

// ─── SPACING SYSTEM (8/16/24/32) ─────────────────────────────────────────────
const sp = { xs:4, sm:8, md:16, lg:24, xl:32 };

// ─── STOCK DATA ───────────────────────────────────────────────────────────────
const STOCKS = {
  AMD:   {name:"Advanced Micro Devices",price:164.32,change:-0.94,open:165.80,high:166.75,low:163.42,vol:"48.5M",avgVol:"52.2M",mktCap:"265B", pe:44.1,rsi:45, resistance:166.75,support:161.45,trend:"Sideways",momentum:"Building",volume:"Elevated"},
  NVDA:  {name:"NVIDIA Corporation",    price:887.42,change:3.21, open:860.10,high:891.20,low:856.33,vol:"42.1M",avgVol:"38.2M",mktCap:"2.18T",pe:65.2,rsi:62, resistance:910.00,support:850.00,trend:"Upward",  momentum:"Strong",   volume:"Elevated"},
  AAPL:  {name:"Apple Inc.",            price:189.30,change:0.84, open:187.50,high:190.10,low:186.90,vol:"58.4M",avgVol:"62.1M",mktCap:"2.93T",pe:30.1,rsi:54, resistance:192.00,support:185.00,trend:"Upward",  momentum:"Moderate", volume:"Normal"},
  MSFT:  {name:"Microsoft Corporation", price:415.20,change:1.12, open:410.80,high:416.50,low:409.20,vol:"19.3M",avgVol:"22.8M",mktCap:"3.08T",pe:36.4,rsi:58, resistance:420.00,support:405.00,trend:"Upward",  momentum:"Strong",   volume:"Normal"},
  META:  {name:"Meta Platforms",        price:512.87,change:2.45, open:500.20,high:514.10,low:499.80,vol:"21.7M",avgVol:"19.4M",mktCap:"1.31T",pe:27.8,rsi:67, resistance:520.00,support:495.00,trend:"Upward",  momentum:"Strong",   volume:"Elevated"},
  AMZN:  {name:"Amazon.com",            price:198.54,change:-0.32,open:199.40,high:200.10,low:197.80,vol:"31.8M",avgVol:"35.6M",mktCap:"2.08T",pe:58.9,rsi:48, resistance:202.00,support:195.00,trend:"Sideways",momentum:"Fading",  volume:"Normal"},
  TSLA:  {name:"Tesla, Inc.",           price:248.23,change:-1.87,open:253.80,high:254.20,low:246.10,vol:"88.3M",avgVol:"92.4M",mktCap:"792B", pe:72.3,rsi:42, resistance:255.00,support:240.00,trend:"Downward",momentum:"Weak",    volume:"Elevated"},
  SPY:   {name:"SPDR S&P 500 ETF",      price:521.44,change:0.62, open:518.20,high:522.10,low:517.60,vol:"72.8M",avgVol:"81.4M",mktCap:"—",    pe:22.1,rsi:56, resistance:525.00,support:515.00,trend:"Upward",  momentum:"Moderate", volume:"Normal"},
  JPM:   {name:"JPMorgan Chase",        price:204.67,change:0.55, open:203.50,high:205.30,low:202.80,vol:"12.4M",avgVol:"11.9M",mktCap:"591B", pe:12.4,rsi:53, resistance:208.00,support:200.00,trend:"Upward",  momentum:"Moderate", volume:"Normal"},
  GOOGL: {name:"Alphabet Inc.",         price:175.98,change:1.63, open:173.20,high:176.40,low:172.90,vol:"24.1M",avgVol:"26.3M",mktCap:"2.17T",pe:24.6,rsi:60, resistance:178.00,support:172.00,trend:"Upward",  momentum:"Strong",   volume:"Normal"},
};

// ─── SCANNER UNIVERSE ────────────────────────────────────────────────────────
// Pure client-side technical analysis — zero API calls, scans in < 1 second
const SCAN_UNIVERSE=(()=>{
  const r=[
    // Technology — mega cap
    ["AAPL","Apple",189],["MSFT","Microsoft",415],["NVDA","NVIDIA",887],
    ["GOOGL","Alphabet",176],["META","Meta",513],["AMZN","Amazon",199],
    ["TSLA","Tesla",248],["AMD","AMD",164],["AVGO","Broadcom",1320],
    ["ORCL","Oracle",145],["CRM","Salesforce",278],["ADBE","Adobe",370],
    ["NOW","ServiceNow",886],["INTU","Intuit",652],["CDNS","Cadence",294],
    ["SNPS","Synopsys",510],["ANSS","Ansys",357],["CTSH","Cognizant",70],
    ["WDAY","Workday",262],["IBM","IBM",187],["ACN","Accenture",348],
    // Semiconductors
    ["INTC","Intel",21],["QCOM","Qualcomm",152],["TXN","Texas Instruments",165],
    ["AMAT","Applied Materials",174],["KLAC","KLA Corp",780],["LRCX","Lam Research",890],
    ["MU","Micron",98],["MCHP","Microchip",52],["NXPI","NXP Semi",216],
    ["ON","ON Semi",58],["SWKS","Skyworks",88],["MPWR","Monolithic Power",720],
    ["TER","Teradyne",122],["ENTG","Entegris",118],["ONTO","Onto Innovation",154],
    ["ACLS","Axcelis",95],["RMBS","Rambus",64],["AMBA","Ambarella",66],
    ["SMCI","Super Micro",820],["ARM","ARM Holdings",122],
    // Cloud / SaaS
    ["PLTR","Palantir",24],["DDOG","Datadog",115],["SNOW","Snowflake",148],
    ["CRWD","CrowdStrike",350],["NET","Cloudflare",88],["ZS","Zscaler",195],
    ["PANW","Palo Alto",310],["OKTA","Okta",100],["FTNT","Fortinet",64],
    ["S","SentinelOne",18],["COIN","Coinbase",225],["HOOD","Robinhood",21],
    ["UBER","Uber",71],["LYFT","Lyft",15],["ABNB","Airbnb",165],
    ["SHOP","Shopify",105],["ETSY","Etsy",58],["EBAY","eBay",50],
    ["SPOT","Spotify",358],["NFLX","Netflix",635],["RBLX","Roblox",40],
    ["SNAP","Snap",14],["PINS","Pinterest",32],["RDDT","Reddit",60],
    ["DUOL","Duolingo",216],["MNDY","Monday.com",267],["BILL","Bill.com",68],
    ["AFRM","Affirm",47],["UPST","Upstart",44],["SOFI","SoFi",7],
    ["SAMSARA","Samsara",43],["APP","Applovin",82],["CELH","Celsius",32],
    // Financials
    ["JPM","JPMorgan Chase",205],["BAC","Bank of America",39],["GS","Goldman Sachs",510],
    ["MS","Morgan Stanley",99],["WFC","Wells Fargo",62],["C","Citigroup",65],
    ["USB","US Bancorp",38],["PNC","PNC Financial",142],["TFC","Truist Financial",37],
    ["KEY","KeyCorp",15],["RF","Regions Financial",23],["FITB","Fifth Third",34],
    ["SCHW","Charles Schwab",74],["BLK","BlackRock",855],["AXP","American Express",238],
    ["V","Visa",279],["MA","Mastercard",487],["PYPL","PayPal",61],
    ["SQ","Block",66],["ICE","Intercontinental Exchange",148],["CME","CME Group",225],
    ["NDAQ","Nasdaq Inc",66],["CBOE","CBOE Global",185],["SPGI","S&P Global",467],
    ["MCO","Moody's",387],["MSCI","MSCI Inc",548],
    // Insurance
    ["MET","MetLife",76],["PRU","Prudential",118],["AFL","Aflac",94],
    ["AIG","AIG",77],["CB","Chubb",264],["TRV","Travelers",226],
    ["ALL","Allstate",193],["PGR","Progressive",237],["HIG","Hartford Financial",107],
    // Real Estate
    ["AMT","American Tower",195],["CCI","Crown Castle",115],["EQIX","Equinix",790],
    ["PLD","Prologis",122],["SPG","Simon Property",165],["O","Realty Income",52],
    ["WELL","Welltower",105],["AVB","AvalonBay",198],["VTR","Ventas",49],
    ["PSA","Public Storage",288],["ARE","Alexandria RE",107],["CBRE","CBRE Group",108],
    // Healthcare
    ["JNJ","Johnson & Johnson",156],["UNH","UnitedHealth",506],["PFE","Pfizer",27],
    ["ABBV","AbbVie",175],["LLY","Eli Lilly",785],["MRK","Merck",130],
    ["BMY","Bristol-Myers",57],["AMGN","Amgen",313],["GILD","Gilead",68],
    ["BIIB","Biogen",225],["VRTX","Vertex Pharma",505],["REGN","Regeneron",977],
    ["ISRG","Intuitive Surgical",395],["MDT","Medtronic",79],["SYK","Stryker",340],
    ["BSX","Boston Scientific",82],["BDX","Becton Dickinson",240],["EW","Edwards Life",98],
    ["DHR","Danaher",225],["TMO","Thermo Fisher",558],["A","Agilent",130],
    ["IDXX","IDEXX Labs",510],["ZBH","Zimmer Biomet",126],["DXCM","Dexcom",82],
    ["HOLX","Hologic",85],["BAX","Baxter",28],["CAH","Cardinal Health",87],
    ["MCK","McKesson",540],["ABC","AmerisourceBergen",225],["CVS","CVS Health",62],
    ["HCA","HCA Healthcare",337],["CNC","Centene",66],["ELV","Elevance Health",495],
    ["CI","Cigna",346],["HUM","Humana",385],["MRNA","Moderna",107],
    ["BNTX","BioNTech",95],["CRSP","CRISPR Therapeutics",65],["ALNY","Alnylam",230],
    // Consumer Discretionary
    ["MCD","McDonald's",296],["SBUX","Starbucks",82],["CMG","Chipotle",3200],
    ["YUM","Yum Brands",137],["QSR","Restaurant Brands",75],["DPZ","Domino's",465],
    ["DRI","Darden Restaurants",168],["TXRH","Texas Roadhouse",160],["EAT","Brinker",72],
    ["NKE","Nike",75],["LULU","Lululemon",318],["UAA","Under Armour",7],
    ["VFC","VF Corp",14],["PVH","PVH Corp",108],["RL","Ralph Lauren",198],
    ["TPR","Tapestry",52],["CROX","Crocs",132],["SKX","Skechers",66],
    ["DECK","Deckers",185],["HD","Home Depot",345],["LOW","Lowe's",234],
    ["TGT","Target",155],["DG","Dollar General",153],["DLTR","Dollar Tree",128],
    ["KR","Kroger",56],["SFM","Sprouts Farmers",122],["COST","Costco",892],
    ["WMT","Walmart",67],["BJ","BJ's Wholesale",78],["DIS","Disney",108],
    ["PARA","Paramount",11],["WBD","Warner Bros",8],["EA","Electronic Arts",135],
    ["TTWO","Take-Two",162],["ATVI","Activision",95],["DKNG","DraftKings",43],
    // Consumer Staples
    ["KO","Coca-Cola",64],["PEP","PepsiCo",169],["PM","Philip Morris",118],
    ["MO","Altria",43],["PG","Procter & Gamble",162],["CL","Colgate",96],
    ["KMB","Kimberly-Clark",132],["CHD","Church & Dwight",94],["CLX","Clorox",140],
    ["MDLZ","Mondelez",67],["HSY","Hershey",184],["GIS","General Mills",62],
    ["CAG","Conagra",30],["SJM","J.M. Smucker",112],["MKC","McCormick",79],
    ["CPB","Campbell Soup",46],
    // Energy
    ["XOM","ExxonMobil",118],["CVX","Chevron",155],["COP","ConocoPhillips",114],
    ["SLB","SLB",47],["OXY","Occidental",62],["EOG","EOG Resources",128],
    ["PSX","Phillips 66",148],["VLO","Valero Energy",161],["MPC","Marathon Petroleum",187],
    ["HES","Hess",150],["DVN","Devon Energy",37],["FANG","Diamondback",235],
    ["APA","APA Corp",26],["KMI","Kinder Morgan",21],["WMB","Williams",37],
    ["OKE","ONEOK",87],["ET","Energy Transfer",15],["ENB","Enbridge",42],
    // Industrials
    ["BA","Boeing",175],["CAT","Caterpillar",350],["GE","GE Aerospace",185],
    ["HON","Honeywell",207],["RTX","RTX Corp",120],["LMT","Lockheed Martin",462],
    ["NOC","Northrop Grumman",445],["GD","General Dynamics",280],["LHX","L3Harris",210],
    ["ITW","Illinois Tool",244],["EMR","Emerson Electric",107],["ROK","Rockwell Auto",290],
    ["PH","Parker Hannifin",581],["CARR","Carrier Global",71],["OTIS","Otis Worldwide",94],
    ["UPS","UPS",142],["FDX","FedEx",268],["NSC","Norfolk Southern",243],
    ["UNP","Union Pacific",247],["CSX","CSX",35],["DE","Deere",415],
    ["AGCO","AGCO",100],["CNH","CNH Industrial",14],["WM","Waste Management",208],
    ["RSG","Republic Services",197],["CTAS","Cintas",183],["PAYX","Paychex",128],
    // Materials
    ["LIN","Linde",473],["APD","Air Products",307],["SHW","Sherwin-Williams",344],
    ["ECL","Ecolab",225],["PPG","PPG Industries",130],["NEM","Newmont",48],
    ["FCX","Freeport-McMoRan",47],["NUE","Nucor",190],["STLD","Steel Dynamics",133],
    ["VMC","Vulcan Materials",280],["MLM","Martin Marietta",575],["CF","CF Industries",87],
    ["MOS","Mosaic",27],["IFF","Int'l Flavors",79],
    // Utilities
    ["NEE","NextEra Energy",68],["DUK","Duke Energy",102],["SO","Southern Company",73],
    ["D","Dominion Energy",54],["EXC","Exelon",36],["SRE","Sempra",72],
    ["AEP","American Electric",87],["XEL","Xcel Energy",60],["WEC","WEC Energy",89],
    ["ES","Eversource",66],["PPL","PPL Corp",28],["CMS","CMS Energy",62],
    ["AES","AES Corp",18],["ETR","Entergy",112],["EIX","Edison International",67],
    // Communication
    ["T","AT&T",22],["VZ","Verizon",40],["CMCSA","Comcast",39],
    ["CHTR","Charter Communications",369],["TMUS","T-Mobile",197],
    ["FOXA","Fox Corp A",44],["NYT","NY Times",52],["ZM","Zoom",63],
    // ETFs
    ["SPY","S&P 500 ETF",521],["QQQ","Nasdaq-100 ETF",441],["IWM","Russell 2000 ETF",195],
    ["GLD","Gold ETF",234],["SLV","Silver ETF",26],["TLT","20Y Treasury ETF",91],
    ["HYG","High Yield Bond ETF",77],["LQD","Corp Bond ETF",110],
    ["EEM","Emerging Markets ETF",41],["EFA","Intl Developed ETF",75],
    ["GDX","Gold Miners ETF",37],["XLE","Energy ETF",95],["XLF","Financial ETF",43],
    ["XLK","Technology ETF",218],["XLV","Healthcare ETF",152],["XLU","Utilities ETF",68],
    ["XLI","Industrial ETF",125],["XLB","Materials ETF",88],["XLRE","Real Estate ETF",38],
    ["XLY","Consumer Discret ETF",194],["XLP","Consumer Staples ETF",78],
    ["ARKK","ARK Innovation ETF",48],["ARKG","ARK Genomics ETF",28],
  ];
  return Object.fromEntries(r.map(([t,n,p])=>[t,{name:n,price:p}]));
})();


// ─── NEUTRAL AI SUMMARIES (compliance-safe) ───────────────────────────────────
function getSummary(ticker, stock) {
  const lvlNote = `Price is currently near ${stock.resistance.toFixed(2)}, a level some traders commonly monitor as resistance. The ${stock.support.toFixed(2)} area is frequently referenced as nearby support.`;
  const summaries = {
    Upward:   `${ticker} has been moving higher in recent sessions, with momentum indicators pointing ${stock.momentum.toLowerCase()}. ${lvlNote}`,
    Sideways: `${ticker} is moving sideways, showing signs of ${stock.momentum === "Building" ? "increasing" : "decreasing"} momentum. ${lvlNote}`,
    Downward: `${ticker} has seen downward pressure recently, with momentum remaining ${stock.momentum.toLowerCase()}. ${lvlNote}`,
  };
  return summaries[stock.trend] || summaries.Sideways;
}

function getScenario(stock) {
  if (stock.trend === "Upward") return [
    `Price is approaching ${stock.resistance.toFixed(2)}, a level commonly watched for potential continuation`,
    `A move above this area may indicate further upside to some market participants`,
    `The ${stock.support.toFixed(2)} area is a commonly referenced level if price pulls back`,
  ];
  if (stock.trend === "Downward") return [
    `Price is near ${stock.resistance.toFixed(2)}, which some traders monitor as overhead resistance`,
    `A move below ${stock.support.toFixed(2)} may indicate continued downward pressure`,
    `Volume has been ${stock.volume.toLowerCase()}, which some traders interpret as confirming recent price action`,
  ];
  return [
    `Price is currently between ${stock.support.toFixed(2)} and ${stock.resistance.toFixed(2)}, a range some traders watch closely`,
    `A move above ${stock.resistance.toFixed(2)} may draw attention from traders monitoring this range`,
    `Volume is ${stock.volume.toLowerCase()}, which may suggest limited conviction in the current direction`,
  ];
}

// ─── CHART MATH ──────────────────────────────────────────────────────────────
function genCandles(base,n=160,tf="1D"){
  const v={"1W":0.025,"1M":0.04,"3M":0.05,"1Y":0.07,"5Y":0.09,"1D":0.014}[tf]||0.014;
  const c=[];let p=base*0.91;
  for(let i=0;i<n;i++){const m=(Math.random()-0.468)*p*v,o=p;p=Math.max(p+m,base*0.5);c.push({open:o,close:p,high:Math.max(o,p)+Math.random()*p*v*0.4,low:Math.min(o,p)-Math.random()*p*v*0.4,vol:Math.floor(Math.random()*700000+150000),up:p>=o});}
  return c;
}
function calcSMA(cs,p){return cs.map((_,i)=>i<p-1?null:cs.slice(i-p+1,i+1).reduce((s,c)=>s+c.close,0)/p);}
function calcEMA(cs,p){const k=2/(p+1);let e=cs[0].close;return cs.map(c=>{e=c.close*k+e*(1-k);return e;});}
function calcMACD(cs,fast=12,slow=26,sig=9){const ema=(a,p)=>{const k=2/(p+1);let e=a[0];return a.map(v=>{e=v*k+e*(1-k);return e;});};const cl=cs.map(c=>c.close);const mc=ema(cl,fast).map((v,i)=>v-ema(cl,slow)[i]);const sg=ema(mc,sig);return{macd:mc,signal:sg,hist:mc.map((v,i)=>v-sg[i])};}
function calcBB(cs,p=20,k=2){return cs.map((_,i)=>{if(i<p-1)return null;const sl=cs.slice(i-p+1,i+1).map(c=>c.close),mn=sl.reduce((a,b)=>a+b,0)/p,sd=Math.sqrt(sl.reduce((s,v)=>s+(v-mn)**2,0)/p);return{upper:mn+k*sd,mid:mn,lower:mn-k*sd};});}
function calcRSI(cs,p=14){const g=[],l=[];for(let i=1;i<cs.length;i++){const d=cs[i].close-cs[i-1].close;g.push(d>0?d:0);l.push(d<0?-d:0);}const avg=(a,i)=>{if(i<p-1)return null;if(i===p-1)return a.slice(0,p).reduce((s,v)=>s+v,0)/p;const prev=avg(a,i-1);return prev===null?null:(prev*(p-1)+a[i])/p;};return cs.map((_,i)=>{if(i===0)return null;const a=avg(g,i-1),b=avg(l,i-1);if(a===null||b===null)return null;return b===0?100:100-100/(1+a/b);});}
function calcVWAP(cs){let cv=0,vt=0;return cs.map(c=>{const tp=(c.high+c.low+c.close)/3;cv+=tp*c.vol;vt+=c.vol;return vt>0?cv/vt:null;});}
function calcATR(cs,p=14){const tr=cs.map((c,i)=>i===0?c.high-c.low:Math.max(c.high-c.low,Math.abs(c.high-cs[i-1].close),Math.abs(c.low-cs[i-1].close)));return tr.map((_,i)=>{if(i<p-1)return null;return tr.slice(i-p+1,i+1).reduce((s,v)=>s+v,0)/p;});}
function calcSupertrend(cs,p=10,mult=3){
  const atr=calcATR(cs,p);
  const res=[];
  let dir=1; // 1=up(green), -1=down(red)
  let prevUB=0,prevLB=0,prevST=0;
  for(let i=0;i<cs.length;i++){
    if(atr[i]==null){res.push(null);continue;}
    const hl2=(cs[i].high+cs[i].low)/2;
    const basicUB=hl2+mult*atr[i];
    const basicLB=hl2-mult*atr[i];
    const ub=basicUB<prevUB||cs[i-1]?.close>prevUB?basicUB:prevUB;
    const lb=basicLB>prevLB||cs[i-1]?.close<prevLB?basicLB:prevLB;
    if(i===p){dir=cs[i].close>ub?1:-1;}
    else if(i>p){
      if(prevST===prevUB&&cs[i].close>=ub)dir=1;
      else if(prevST===prevUB&&cs[i].close<ub)dir=-1;
      else if(prevST===prevLB&&cs[i].close<=lb)dir=-1;
      else if(prevST===prevLB&&cs[i].close>lb)dir=1;
    }
    const st=dir===1?lb:ub;
    res.push({val:st,dir});
    prevUB=ub;prevLB=lb;prevST=st;
  }
  return res;
}
function calcStochRSI(cs,p=14){const rsi=calcRSI(cs,p);return rsi.map((_,i)=>{if(i<p*2)return null;const sl=rsi.slice(i-p+1,i+1).filter(v=>v!==null);if(sl.length<p)return null;const mn=Math.min(...sl),mx=Math.max(...sl),rng=mx-mn;return rng===0?0:(rsi[i]-mn)/rng*100;});}

// ─── DATA LAYER — Yahoo Finance via Electron IPC ─────────────────────────────
const inElectron = () => typeof window !== "undefined" && !!window.chartWizAPI?.isElectron;

async function fetchYahooBars(ticker, tf) {
  if(!inElectron()) throw new Error("not in electron");
  const res = await window.chartWizAPI.fetchChart(ticker, tf);
  if(!res.ok) throw new Error(res.error || "fetch failed");
  if(!res.bars?.length) throw new Error("no bars returned");
  return res.bars;
}

async function fetchYahooQuote(ticker) {
  if(!inElectron()) throw new Error("not in electron");
  const res = await window.chartWizAPI.fetchQuote(ticker);
  if(!res.ok) throw new Error(res.error || "quote failed");
  return res.data; // { price, change, open, high, low, vol, name }
}

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
function Spark({open,high,low,close,change,ticker="",width=48,height=20,T=LIGHT}){
  const col=(close!=null?close>=(open??close):change>=0)?T.pos:T.neg;
  // Seeded rng so shape is stable across re-renders (same ticker = same curve)
  const mkRng=seed=>{let s=Math.abs(String(seed).split('').reduce((a,c)=>(a*31+c.charCodeAt(0))|0,1))||1;return()=>{s=(s*1664525+1013904223)>>>0;return s/0xFFFFFFFF;};};
  let d;
  if(open!=null&&high!=null&&low!=null&&close!=null&&high>low){
    const rng=mkRng(ticker+open.toFixed(2)+close.toFixed(2));
    const range=high-low;
    const toY=v=>height-2-((Math.max(low,Math.min(high,v))-low)/range)*(height-4);
    const isUp=close>=open;
    const N=22;
    // High/low positions: on up days high comes late, low comes early — and vice versa
    const hiPos=isUp?0.48+rng()*0.28:0.06+rng()*0.18;
    const loPos=isUp?0.06+rng()*0.18:0.48+rng()*0.28;
    const hiAmp=high-Math.max(open,close);
    const loAmp=Math.min(open,close)-low;
    const pts=[];
    for(let i=0;i<=N;i++){
      const t=i/N;
      const base=open+(close-open)*t;
      const hi=hiAmp*Math.exp(-((t-hiPos)**2)/0.032);
      const lo=loAmp*Math.exp(-((t-loPos)**2)/0.032);
      const noise=(rng()-0.5)*range*0.065;
      pts.push([t*width,toY(base+hi-lo+noise)]);
    }
    pts[0][1]=toY(open);pts[N][1]=toY(close);
    d=pts.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  } else {
    const rng=mkRng(ticker+change);const pts=[];let v=50;
    for(let i=0;i<18;i++){v+=((change>=0?0.55:0.45)+rng()*0.08-0.04)*3;pts.push(Math.max(5,Math.min(95,v)));}
    const mn=Math.min(...pts),mx=Math.max(...pts),rv=mx-mn||1;
    d=pts.map((y,i)=>`${(i/(pts.length-1))*width},${height-((y-mn)/rv)*(height-4)-2}`).join(" ");
  }
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{flexShrink:0,opacity:0.85}}><polyline points={d} fill="none" stroke={col} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

// ─── TRADING CHART ────────────────────────────────────────────────────────────
// ─── INDICATOR CATALOG ───────────────────────────────────────────────────────
const IND_CATALOG = {
  sma20:  {label:"SMA 20",   col:"#10B981", group:"overlay"},
  sma50:  {label:"SMA 50",   col:"#F59E0B", group:"overlay"},
  ema9:   {label:"EMA 9",    col:"#3B82F6", group:"overlay"},
  ema21:  {label:"EMA 21",   col:"#8B5CF6", group:"overlay"},
  ema50:  {label:"EMA 50",   col:"#F97316", group:"overlay"},
  vol:    {label:"Volume",   col:"#64748B", group:"panel"},
  rsi:    {label:"RSI (14)", col:"#6366F1", group:"panel"},
};

// ─── DRAWING TOOL CATALOG ─────────────────────────────────────────────────────
const TOOL_CATALOG = {
  cursor:  {label:"Select / Pan",          group:"basic"},
  hline:   {label:"Horizontal Line",       group:"lines"},
  vline:   {label:"Vertical Line",         group:"lines"},
  trend:   {label:"Trend Line",            group:"lines"},
  ray:     {label:"Ray",                   group:"lines"},
  extline: {label:"Extended Line",         group:"lines"},
  rect:    {label:"Rectangle",             group:"shapes"},
  channel: {label:"Parallel Channel",      group:"shapes"},
  fib:     {label:"Fibonacci Retracement", group:"fib"},
  text:    {label:"Text Note",             group:"annotation"},
};

const DEFAULT_INDS = {sma20:false,sma50:true,ema9:false,ema21:false,ema50:false,vol:true,rsi:false};

// Detected once at module level — stable across renders
const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform);

// ─── AVATAR HELPERS ──────────────────────────────────────────────────────────
const AVATAR_PALETTE=["#2563EB","#7C3AED","#DB2777","#059669","#D97706","#0891B2","#9333EA","#DC2626"];
const getInitials=name=>{const p=name.trim().split(/\s+/).filter(Boolean);if(!p.length)return"?";if(p.length===1)return p[0].slice(0,2).toUpperCase();return(p[0][0]+p[p.length-1][0]).toUpperCase();};
const avatarColor=name=>{const h=name.split('').reduce((a,c)=>(a*31+c.charCodeAt(0))|0,1);return AVATAR_PALETTE[Math.abs(h)%AVATAR_PALETTE.length];};

// ─── FREE TIER LIMITS ────────────────────────────────────────────────────────
const FREE_ALERT_LIMIT     = 3;
const FREE_AI_DAILY_LIMIT  = 5;
const FREE_WATCHLIST_LIMIT = Infinity; // watchlist is unlimited — AI is the paygate
const ALERT_COLORS = ["#F59E0B","#3B82F6","#EC4899","#10B981","#8B5CF6"];
// Auto-activate premium when running from localhost (dev mode)
const DEV_MODE = typeof window !== "undefined" && window.location.protocol === "http:";

function TradingChart({ticker,stock,T=LIGHT,dark=false,alertsOpen=false,onAlertsToggle=()=>{},isPremium=false,onAddToWatchlist=()=>{}}){
  const cvRef=useRef(null),ovRef=useRef(null);
  const zRef=useRef(1),offRef=useRef(0);
  const toolRef=useRef("cursor"),adRef=useRef(null);
  const [tf,setTf]=useState("1D");
  const [inds,setInds]=useState({...DEFAULT_INDS});
  const [activeTools,setActiveTools]=useState(["cursor","hline","vline","trend","ray","extline","rect","channel","fib"]);
  const [showIndMenu,setShowIndMenu]=useState(false);
  const [indSettings,setIndSettings]=useState({
    ema9:{period:9},ema21:{period:21},ema50:{period:50},
    sma20:{period:20},sma50:{period:50},
    rsi:{period:14},
  });
  const [editingInd,setEditingInd]=useState(null);
  const [candles,setCandles]=useState([]);
  const [zoom,setZoom]=useState(1);
  const [off,setOff]=useState(0);
  const [ch,setCh]=useState(null);
  const [tool,_setTool]=useState("cursor");
  const [drawings,setDrawings]=useState([]);
  const [history,setHistory]=useState([[]]);   // undo stack
  const [histIdx,setHistIdx]=useState(0);
  const drawingsByKeyRef=useRef({});            // saves drawings per ticker+tf
  const prevKeyRef=useRef(`${ticker}_${tf}`);
  const [chartType,setChartType]=useState("candle");
  const chartTypeRef=useRef("candle");
  const [activeD,_setAD]=useState(null);
  const [selectedId,setSelectedId]=useState(null);
  const [alerts,setAlerts]=useState([]); // [{id,price,triggered,col}]
  const [toasts,setToasts]=useState([]);  // [{id,msg,col}]
  const [alertInput,setAlertInput]=useState("");
  const commitAlert=()=>{
    const p=parseFloat(alertInput);
    if(!isNaN(p)&&p>0&&(isPremium||alerts.length<FREE_ALERT_LIMIT)){
      setAlerts(prev=>[...prev,{id:Date.now(),price:p,col:ALERT_COLORS[prev.length%ALERT_COLORS.length],triggered:false}]);
      setAlertInput("");
    }
  };
  const alertsRef=useRef([]);
  useEffect(()=>{alertsRef.current=alerts;},[alerts]);
  const [colorPickerOpen,setColorPickerOpen]=useState(false);
  const isDraggingRef=useRef(false);
  const dragStartRef=useRef(null);   // {x,y,drawingSnapshot}
  const selectedIdRef=useRef(null);
  const [expanded,setExpanded]=useState(false);
  const isPanningRef=useRef(false);
  const panStartRef=useRef(null);    // {x, y, offSnapshot, priceOffSnapshot, pR, cH}
  const priceOffRef=useRef(0);       // vertical price-axis pan offset (price units)
  const [priceOff,setPriceOff]=useState(0);
  const isResizingRef=useRef(null);  // {handle, snapshot} for rect corner resize
  const chartAreaRef=useRef(null);   // for fullscreen API
  const [wickColors,setWickColors]=useState({up:"",down:""});
  const [showCandleStyle,setShowCandleStyle]=useState(false);
  const [magnetMode,setMagnetMode]=useState(false);
  const magnetRef=useRef(false);
  useEffect(()=>{magnetRef.current=magnetMode;},[magnetMode]);
  const [textPlacing,setTextPlacing]=useState(null); // {x,y,ci,price} — pending text input
  const [textDraft,setTextDraft]=useState("");

  const setTool=t=>{toolRef.current=t;_setTool(t);};

  // ── History helpers ─────────────────────────────────────────────────────
  const pushHistory=(newDrawings)=>{
    setHistory(h=>{const next=h.slice(0,histIdx+1);next.push(newDrawings.map(d=>({...d})));return next;});
    setHistIdx(i=>i+1);
    setDrawings(newDrawings);
  };
  const undo=()=>{
    setHistIdx(i=>{if(i<=0)return i;const ni=i-1;setHistory(h=>{setDrawings(h[ni]||[]);return h;});return ni;});
  };
  const redo=()=>{
    setHistIdx(i=>{setHistory(h=>{if(i+1>=h.length)return h;setDrawings(h[i+1]);return h;});return Math.min(i+1,history.length-1);});
  };
  const deleteSelected=()=>{
    if(selectedIdRef.current==null)return;
    const next=drawings.filter(d=>d.id!==selectedIdRef.current);
    pushHistory(next);
    selectedIdRef.current=null;setSelectedId(null);setColorPickerOpen(false);
  };

  // ── Hit testing — is (mx,my) near a drawing? ─────────────────────────────
  const hitTest=(mx,my,dList,toY2,si2,tw2,cw2,cH2,pR2,minP2)=>{
    const THRESH=8;
    const distPtLine=(px,py,x1,y1,x2,y2)=>{
      const dx=x2-x1,dy=y2-y1,len2=dx*dx+dy*dy;
      if(len2===0)return Math.hypot(px-x1,py-y1);
      const t=Math.max(0,Math.min(1,((px-x1)*dx+(py-y1)*dy)/len2));
      return Math.hypot(px-(x1+t*dx),py-(y1+t*dy));
    };
    for(let i=dList.length-1;i>=0;i--){
      const d=dList[i];
      if(d.type==="hline"){
        if(Math.abs(my-toY2(d.price))<THRESH)return d.id;
      } else if(d.type==="vline"){
        const x=((d.ci-si2)*tw2+cw2/2);
        if(Math.abs(mx-x)<THRESH)return d.id;
      } else if((d.type==="trend"||d.type==="extline"||d.type==="ray")&&d.p2){
        const x1=(d.p1.ci-si2)*tw2+cw2/2,y1=toY2(d.p1.price);
        const x2=(d.p2.ci-si2)*tw2+cw2/2,y2=toY2(d.p2.price);
        if(distPtLine(mx,my,x1,y1,x2,y2)<THRESH)return d.id;
      } else if(d.type==="rect"&&d.p2){
        const x1=(d.p1.ci-si2)*tw2,x2=(d.p2.ci-si2)*tw2;
        const y1=toY2(d.p1.price),y2=toY2(d.p2.price);
        const rx=Math.min(x1,x2),ry=Math.min(y1,y2),rw=Math.abs(x2-x1),rh=Math.abs(y2-y1);
        if(mx>=rx-THRESH&&mx<=rx+rw+THRESH&&my>=ry-THRESH&&my<=ry+rh+THRESH)return d.id;
      } else if(d.type==="fib"&&d.p2){
        const levels=[0,0.236,0.382,0.5,0.618,0.786,1];
        for(const l of levels){
          const lp=d.p2.price-(d.p2.price-d.p1.price)*l;
          if(Math.abs(my-toY2(lp))<THRESH)return d.id;
        }
      }
    }
    return null;
  };
  // live crosshair indicator values — updated via ref to avoid re-render on every mousemove
  const liveIndsRef=useRef({});
  const [liveInds,setLiveInds]=useState({});
  const setAD=d=>{adRef.current=d;_setAD(d);};

  // Derived panel heights from inds state
  // Resizable panel heights
  const [panelSizes,setPanelSizes]=useState({vol:72,rsi:84});
  const resizingRef=useRef(null); // {panel,startY,startH}
  const VH_val=inds.vol?panelSizes.vol:0;
  const RH_val=inds.rsi?panelSizes.rsi:0;
  const VH=VH_val, MH=RH_val, PW=64;
  const VHRef=useRef(VH),MHRef=useRef(MH);
  useEffect(()=>{VHRef.current=VH;},[VH]);
  useEffect(()=>{MHRef.current=MH;},[MH]);

  // Panel resize handlers
  const onResizeStart=(e,panel)=>{
    e.preventDefault();e.stopPropagation();
    resizingRef.current={panel,startY:e.clientY,startH:panelSizes[panel]};
    const onMove=ev=>{
      if(!resizingRef.current)return;
      const{panel:p,startY,startH}=resizingRef.current;
      const delta=startY-ev.clientY; // drag up = bigger panel
      const MIN=28,MAX=200;
      setPanelSizes(s=>({...s,[p]:Math.max(MIN,Math.min(MAX,startH+delta))}));
    };
    const onUp=()=>{resizingRef.current=null;window.removeEventListener("mousemove",onMove);window.removeEventListener("mouseup",onUp);document.body.style.cursor="";};
    window.addEventListener("mousemove",onMove);
    window.addEventListener("mouseup",onUp);
    document.body.style.cursor="ns-resize";
  };
  const resetPanelSize=(panel)=>{
    const defaults={vol:52,rsi:56};
    setPanelSizes(s=>({...s,[panel]:defaults[panel]}));
  };

  // tf ref so drawOv can access current tf without stale closure
  const tf_ref=useRef(tf);
  useEffect(()=>{tf_ref.current=tf;},[tf]);
  useEffect(()=>{chartTypeRef.current=chartType;},[chartType]);
  useEffect(()=>{
    const newKey=`${ticker}_${tf}`;
    // Save drawings for the key we're leaving, restore for the new key
    drawingsByKeyRef.current[prevKeyRef.current]=drawings;
    prevKeyRef.current=newKey;
    const restored=drawingsByKeyRef.current[newKey]||[];
    setOff(0);offRef.current=0;priceOffRef.current=0;setPriceOff(0);
    setHistory([restored.map(d=>({...d}))]);setHistIdx(0);
    setDrawings(restored);
    setCandles([]);
    if(inElectron()){
      fetchYahooBars(ticker,tf)
        .then(bars=>setCandles(bars))
        .catch(()=>setCandles(genCandles(stock.price,160,tf)));
    } else {
      setCandles(genCandles(stock.price,160,tf));
    }
  },[ticker,tf]);

  // Check alert triggers when price or candles change
  useEffect(()=>{
    if(!candles.length)return;
    const price=candles[candles.length-1].close;
    setAlerts(prev=>{
      let changed=false;
      const next=prev.map(al=>{
        if(al.triggered)return al;
        const prevCandle=candles[candles.length-2];
        if(!prevCandle)return al;
        const prevP=prevCandle.close;
        const crossed=(prevP<al.price&&price>=al.price)||(prevP>al.price&&price<=al.price);
        if(crossed){
          changed=true;
          const dir=price>=al.price?"above":"below";
          const msg=`${ticker} crossed ${dir} $${al.price.toFixed(2)}`;
          const toastId=Date.now();
          setToasts(t=>[...t,{id:toastId,msg:`Alert: ${msg}`,col:al.col||"#F59E0B"}]);
          setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==toastId)),4000);
          // Fire OS desktop notification (works even when app is minimized)
          if(inElectron())window.chartWizAPI.notify(`ChartWiz Alert — ${ticker}`,msg);
          // Play a short chime via Web Audio API
          try{const ac=new(window.AudioContext||window.webkitAudioContext)();const o=ac.createOscillator();const g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type="sine";o.frequency.setValueAtTime(880,ac.currentTime);o.frequency.setValueAtTime(660,ac.currentTime+0.12);g.gain.setValueAtTime(0.25,ac.currentTime);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+0.45);o.start(ac.currentTime);o.stop(ac.currentTime+0.45);}catch{}
          return {...al,triggered:true};
        }
        return al;
      });
      return changed?next:prev;
    });
  },[candles]);

  // Global mouseup — stop pan/drag even if mouse is released outside the canvas
  useEffect(()=>{
    const onGlobalUp=()=>{
      if(isPanningRef.current){isPanningRef.current=false;panStartRef.current=null;if(ovRef.current)ovRef.current.style.cursor="crosshair";}
      if(isDraggingRef.current){isDraggingRef.current=false;dragStartRef.current=null;}
      if(isResizingRef.current){isResizingRef.current=null;}
    };
    window.addEventListener("mouseup",onGlobalUp);
    return()=>window.removeEventListener("mouseup",onGlobalUp);
  },[]);

  // Keyboard shortcuts: Cmd+Z undo, Cmd+Shift+Z redo, Delete/Backspace remove selected
  useEffect(()=>{
    const onKey=e=>{
      const tag=document.activeElement?.tagName;
      if(tag==="INPUT"||tag==="TEXTAREA")return;
      if((e.metaKey||e.ctrlKey)&&e.shiftKey&&e.key==="z"){e.preventDefault();redo();return;}
      if((e.metaKey||e.ctrlKey)&&e.key==="z"){e.preventDefault();undo();return;}
      if((e.key==="Delete"||e.key==="Backspace")&&selectedIdRef.current!=null){e.preventDefault();deleteSelected();}
    };
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[drawings,histIdx]);
  useEffect(()=>{
    if(inElectron()){
      // Poll Yahoo Finance quote every 15s for a live price tick
      const iv=setInterval(async()=>{
        try{
          const q=await fetchYahooQuote(ticker);
          if(q?.price){
            setCandles(p=>{
              if(!p.length)return p;
              const u=[...p],l={...u[u.length-1]};
              l.close=q.price;l.high=Math.max(l.high,q.price);l.low=Math.min(l.low,q.price);l.up=l.close>=l.open;
              u[u.length-1]=l;return u;
            });
          }
        }catch{}
      },15000);
      return()=>clearInterval(iv);
    } else {
      // Browser: simulated tick for demo
      const iv=setInterval(()=>{
        setCandles(p=>{if(!p.length)return p;const u=[...p],l={...u[u.length-1]};const t=(Math.random()-0.496)*l.close*0.0006;l.close=Math.max(l.close+t,l.close*0.95);l.high=Math.max(l.high,l.close);l.low=Math.min(l.low,l.close);l.up=l.close>=l.open;u[u.length-1]=l;return u;});
      },800);
      return()=>clearInterval(iv);
    }
  },[ticker]);

  const draw=useCallback(()=>{
    const cv=cvRef.current;if(!cv||!candles.length)return;
    const dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
    cv.width=W*dpr;cv.height=H*dpr;
    const ctx=cv.getContext("2d");ctx.scale(dpr,dpr);
    const pH=VH+MH,cH=H-pH-4,cW=W-PW;
    const cw=Math.max(3,Math.floor((cW/100)*zRef.current)),tw=cw+Math.max(1,Math.floor(cw*0.2));
    const vc=Math.floor(cW/tw)+2,si=Math.max(0,candles.length-vc-Math.floor(offRef.current));
    const vis=candles.slice(si,Math.min(candles.length,si+vc+2));if(!vis.length)return;
    const allH=vis.flatMap(c=>[c.high,c.low]),bMinP=Math.min(...allH)*0.9985,bMaxP=Math.max(...allH)*1.0015;
    const maxV=Math.max(...vis.map(c=>c.vol)),pR=bMaxP-bMinP;
    const minP=bMinP+priceOffRef.current,maxP=bMaxP+priceOffRef.current;
    const toY=p=>cH-((p-minP)/pR)*(cH-24)-12;

    ctx.fillStyle=T.chartBg;ctx.fillRect(0,0,W,H);

    // ── Smart price scale — clean round numbers ────────────────────────────
    // niceNum: pick a human-readable interval that gives ~5 grid lines
    const niceInterval=(range,targetLines=6)=>{
      const rough=range/targetLines;
      const mag=Math.pow(10,Math.floor(Math.log10(rough)));
      const norm=rough/mag;
      let nice;
      if(norm<1.5)nice=1;
      else if(norm<3)nice=2;
      else if(norm<7)nice=5;
      else nice=10;
      return nice*mag;
    };
    const interval=niceInterval(pR);
    const gridMin=Math.ceil(minP/interval)*interval;
    const gridLines=[];
    for(let p2=gridMin;p2<=maxP;p2=Math.round((p2+interval)*1e8)/1e8){
      const y=toY(p2);
      if(y>8&&y<cH-8)gridLines.push({y,p:p2});
    }

    // Horizontal grid lines + price labels
    ctx.font=`10px ${C.num}`;ctx.textAlign="left";
    gridLines.forEach(({y,p:p2})=>{
      ctx.strokeStyle=T.chartGrid;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,Math.round(y)+0.5);ctx.lineTo(cW,Math.round(y)+0.5);ctx.stroke();
      // Price label — format based on magnitude
      const decimals=p2>=100?0:p2>=10?1:2;
      ctx.fillStyle="#9AA3B2";
      ctx.fillText(p2.toFixed(decimals),cW+4,Math.round(y)+4);
    });

    // ── Vertical time grid lines + X-axis labels ──────────────────────────
    const timeStep=Math.ceil(vis.length/6);
    const fmtTime=(c)=>{
      if(c?.time){
        const d=new Date(c.time);
        const tfv=tf_ref.current||"1D";
        if(tfv==="1D")return d.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:true});
        if(tfv==="1W"||tfv==="1M")return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
        return d.toLocaleDateString("en-US",{month:"short",year:"2-digit"});
      }
      return "";
    };
    vis.forEach((c,i)=>{
      if(i%timeStep!==0)return;
      const x=Math.round(i*tw+cw/2)+0.5;
      ctx.strokeStyle=T.chartGrid;ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,cH);ctx.stroke();
      // Time label at bottom of chart area
      const label=fmtTime(candles[si+i]);
      if(label){
        ctx.save();
        ctx.fillStyle=dark?"#C9D1D9":"#1a1a1a";
        ctx.font=`bold 10px ${T.ui}`;
        ctx.textAlign="center";
        ctx.fillText(label,x,cH-4);
        ctx.restore();
      }
    });

    // SMA lines
    if(inds.sma20){const s=calcSMA(candles,indSettings.sma20.period);ctx.beginPath();ctx.strokeStyle="#10B981";ctx.lineWidth=1.5;vis.forEach((_,i)=>{const v=s[si+i];if(!v)return;const x=i*tw+cw/2;if(i===0||!s[si+i-1])ctx.moveTo(x,toY(v));else ctx.lineTo(x,toY(v));});ctx.stroke();}
    if(inds.sma50){const s=calcSMA(candles,indSettings.sma50.period);ctx.beginPath();ctx.strokeStyle="#F59E0B";ctx.lineWidth=1.5;vis.forEach((_,i)=>{const v=s[si+i];if(!v)return;const x=i*tw+cw/2;if(i===0||!s[si+i-1])ctx.moveTo(x,toY(v));else ctx.lineTo(x,toY(v));});ctx.stroke();}
    // EMA lines
    [{k:"ema9",p:indSettings.ema9.period,col:"#3B82F6"},{k:"ema21",p:indSettings.ema21.period,col:"#8B5CF6"},{k:"ema50",p:indSettings.ema50.period,col:"#F97316"}].forEach(({k,p,col})=>{
      if(!inds[k])return;
      const e=calcEMA(candles,p);
      ctx.beginPath();ctx.strokeStyle=col;ctx.lineWidth=1.5;
      vis.forEach((_,i)=>{const v=e[si+i];if(v==null)return;const x=i*tw+cw/2;if(i===0)ctx.moveTo(x,toY(v));else ctx.lineTo(x,toY(v));});
      ctx.stroke();
    });
    // ── Alert lines (drawn ABOVE indicators, below candles) ────────────────
    alertsRef.current.forEach(al=>{
      const y=toY(al.price);
      if(y<0||y>cH)return;
      const col=al.triggered?"#94A3B8":al.col||"#F59E0B";
      ctx.save();
      ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.setLineDash([6,4]);
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cW,y);ctx.stroke();
      ctx.setLineDash([]);
      // Label pill on right axis
      const lStr=al.price.toFixed(2);
      const lW=ctx.measureText(lStr).width+20;
      ctx.fillStyle=col;
      ctx.beginPath();
      const px=cW+2,pw=lW,ph=18,pr2=4;
      ctx.moveTo(px+pr2,y-ph/2);ctx.lineTo(px+pw-pr2,y-ph/2);ctx.quadraticCurveTo(px+pw,y-ph/2,px+pw,y-ph/2+pr2);ctx.lineTo(px+pw,y+ph/2-pr2);ctx.quadraticCurveTo(px+pw,y+ph/2,px+pw-pr2,y+ph/2);ctx.lineTo(px+pr2,y+ph/2);ctx.quadraticCurveTo(px,y+ph/2,px,y+ph/2-pr2);ctx.lineTo(px,y-ph/2+pr2);ctx.quadraticCurveTo(px,y-ph/2,px+pr2,y-ph/2);ctx.closePath();ctx.fill();
      ctx.fillStyle="#fff";ctx.font=`bold 9px ${C.num}`;ctx.textAlign="center";ctx.fillText(lStr,px+pw/2,y+3.5);
      // Bell icon hint
      ctx.fillStyle=col;ctx.font=`10px sans-serif`;ctx.textAlign="left";ctx.fillText("⚡",2,y-2);
      ctx.restore();
    });

    // ── Chart type rendering ────────────────────────────────────────────────
    const ct=chartTypeRef.current||"candle";

    // Compute Heikin Ashi candles when needed
    let renderCandles=vis;
    if(ct==="ha"){
      const haAll=[];let prevHaO=candles[0].open,prevHaC=(candles[0].open+candles[0].close+candles[0].high+candles[0].low)/4;
      candles.forEach(c=>{
        const haC=(c.open+c.high+c.low+c.close)/4;
        const haO=(prevHaO+prevHaC)/2;
        const haH=Math.max(c.high,haO,haC);
        const haL=Math.min(c.low,haO,haC);
        haAll.push({open:haO,close:haC,high:haH,low:haL,vol:c.vol,up:haC>=haO});
        prevHaO=haO;prevHaC=haC;
      });
      renderCandles=haAll.slice(si,Math.min(haAll.length,si+vis.length+2));
    }

    if(ct==="line"||ct==="area"){
      // Line / Area
      const pts=vis.map((c,i)=>({x:i*tw+cw/2,y:toY(c.close)}));
      if(ct==="area"){
        // Gradient fill
        const grad=ctx.createLinearGradient(0,0,0,cH);
        grad.addColorStop(0,"rgba(37,99,235,0.15)");
        grad.addColorStop(1,"rgba(37,99,235,0.01)");
        ctx.beginPath();
        pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
        ctx.lineTo(pts[pts.length-1].x,cH-10);
        ctx.lineTo(pts[0].x,cH-10);
        ctx.closePath();
        ctx.fillStyle=grad;ctx.fill();
      }
      ctx.beginPath();ctx.strokeStyle="#2563EB";ctx.lineWidth=2;
      pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
      ctx.stroke();
      // Dot on last point
      const lp=pts[pts.length-1];
      ctx.beginPath();ctx.arc(lp.x,lp.y,3,0,Math.PI*2);
      ctx.fillStyle="#2563EB";ctx.fill();
    } else if(ct==="bar"){
      // OHLC bars
      vis.forEach((c,i)=>{
        const x=Math.floor(i*tw+cw/2)+0.5;
        const up=c.close>=c.open;
        const col=up?"#22C55E":"#EF4444";
        ctx.strokeStyle=col;ctx.lineWidth=1.5;
        // Vertical line high-low
        ctx.beginPath();ctx.moveTo(x,toY(c.high));ctx.lineTo(x,toY(c.low));ctx.stroke();
        // Left tick = open
        ctx.beginPath();ctx.moveTo(x-cw*0.4,toY(c.open));ctx.lineTo(x,toY(c.open));ctx.stroke();
        // Right tick = close
        ctx.beginPath();ctx.moveTo(x,toY(c.close));ctx.lineTo(x+cw*0.4,toY(c.close));ctx.stroke();
      });
    } else {
      // Candle (default) or Heikin Ashi (same rendering, different data)
      renderCandles.forEach((c,i)=>{
        const x=i*tw,up=c.up;
        const bT=toY(Math.max(c.open,c.close)),bB=toY(Math.min(c.open,c.close)),bH=Math.max(bB-bT,1.5);
        // Wick — configurable color, 1.5px
        ctx.strokeStyle=up?(wickColors.up||"#16A34A"):(wickColors.down||"#DC2626");ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(Math.floor(x+cw/2)+0.5,toY(c.high));ctx.lineTo(Math.floor(x+cw/2)+0.5,toY(c.low));ctx.stroke();
        // Body — solid fill, rounded feel with 1px rounding
        ctx.fillStyle=up?"#16A34A":"#DC2626";
        ctx.fillRect(Math.floor(x)+1,bT,Math.max(cw-2,2),bH);
        // Thin outline for definition
        ctx.strokeStyle=up?"#15803D":"#B91C1C";ctx.lineWidth=0.5;
        ctx.strokeRect(Math.floor(x)+1,bT,Math.max(cw-2,2),bH);
      });
    }

    // Drawings
    drawings.forEach(d=>{
      ctx.save();
      const isSelected=d.id===selectedIdRef.current;
      const col=d.col||"#F59E0B";
      ctx.strokeStyle=isSelected?"#2563EB":col;
      ctx.lineWidth=isSelected?2.5:2;
      if(isSelected)ctx.setLineDash([5,3]);else ctx.setLineDash([]);
      if(d.type==="hline"){
        ctx.beginPath();ctx.moveTo(0,toY(d.price));ctx.lineTo(cW,toY(d.price));ctx.stroke();
        // Price label pill
        const lStr=d.price.toFixed(2);
        const lW=ctx.measureText(lStr).width+10;
        ctx.fillStyle=col;
        ctx.beginPath();ctx.roundRect?ctx.roundRect(2,toY(d.price)-9,lW,14,3):ctx.rect(2,toY(d.price)-9,lW,14);ctx.fill();
        ctx.fillStyle="#fff";ctx.font=`bold 9px ${C.num}`;ctx.textAlign="left";ctx.fillText(lStr,7,toY(d.price)+3);
      } else if(d.type==="vline"){
        const x=((d.ci-si)*tw+cw/2);
        if(x>=0&&x<=cW){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,cH);ctx.stroke();}
      } else if(d.type==="trend"&&d.p2){
        const x1=(d.p1.ci-si)*tw+cw/2,x2=(d.p2.ci-si)*tw+cw/2;
        ctx.beginPath();ctx.moveTo(x1,toY(d.p1.price));ctx.lineTo(x2,toY(d.p2.price));ctx.stroke();
        // Endpoint dots / drag handles
        [d.p1,d.p2].forEach(p=>{
          const px=(p.ci-si)*tw+cw/2;
          ctx.setLineDash([]);
          ctx.beginPath();ctx.arc(px,toY(p.price),isSelected?6:4,0,Math.PI*2);
          ctx.fillStyle=isSelected?"#2563EB":col;ctx.fill();
          if(isSelected){ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();}
        });
      } else if(d.type==="ray"&&d.p2){
        const x1=(d.p1.ci-si)*tw+cw/2,x2=(d.p2.ci-si)*tw+cw/2;
        const dx=x2-x1,dy=toY(d.p2.price)-toY(d.p1.price),len=Math.sqrt(dx*dx+dy*dy)||1;
        const scale=(cW-x1)/len;
        ctx.beginPath();ctx.moveTo(x1,toY(d.p1.price));ctx.lineTo(x1+dx*scale,toY(d.p1.price)+dy*scale);ctx.stroke();
        ctx.beginPath();ctx.arc(x1,toY(d.p1.price),4,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();
      } else if(d.type==="extline"&&d.p2){
        const x1=(d.p1.ci-si)*tw+cw/2,x2=(d.p2.ci-si)*tw+cw/2;
        const dx=x2-x1,dy=toY(d.p2.price)-toY(d.p1.price),len=Math.sqrt(dx*dx+dy*dy)||1;
        const fwd=(cW-x1)/len,bwd=x1/len;
        ctx.beginPath();ctx.moveTo(x1-dx*bwd,toY(d.p1.price)-dy*bwd);ctx.lineTo(x1+dx*fwd,toY(d.p1.price)+dy*fwd);ctx.stroke();
      } else if(d.type==="rect"&&d.p2){
        const x1=(d.p1.ci-si)*tw,x2=(d.p2.ci-si)*tw,y1=toY(d.p1.price),y2=toY(d.p2.price);
        ctx.fillStyle=col+"18";ctx.fillRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));
        ctx.strokeRect(Math.min(x1,x2),Math.min(y1,y2),Math.abs(x2-x1),Math.abs(y2-y1));
      } else if(d.type==="channel"&&d.p2){
        const x1=(d.p1.ci-si)*tw+cw/2,x2=(d.p2.ci-si)*tw+cw/2;
        const offset=(d.p2.price-d.p1.price)*0.015*(cH/pR);
        ctx.beginPath();ctx.moveTo(x1,toY(d.p1.price));ctx.lineTo(x2,toY(d.p2.price));ctx.stroke();
        ctx.setLineDash([4,3]);
        ctx.beginPath();ctx.moveTo(x1,toY(d.p1.price)+offset);ctx.lineTo(x2,toY(d.p2.price)+offset);ctx.stroke();
        ctx.setLineDash([]);
        // Fill between
        ctx.fillStyle=col+"18";
        ctx.beginPath();ctx.moveTo(x1,toY(d.p1.price));ctx.lineTo(x2,toY(d.p2.price));ctx.lineTo(x2,toY(d.p2.price)+offset);ctx.lineTo(x1,toY(d.p1.price)+offset);ctx.closePath();ctx.fill();
      } else if(d.type==="fib"&&d.p2){
        const levels=[0,0.236,0.382,0.5,0.618,0.786,1];
        const colors=["#22C55E","#3B82F6","#8B5CF6","#F59E0B","#EC4899","#3B82F6","#EF4444"];
        levels.forEach((l,li)=>{
          const lp=d.p2.price-(d.p2.price-d.p1.price)*l,y=toY(lp);
          // Fib level — full color lines, pill labels
          ctx.strokeStyle=colors[li];ctx.lineWidth=li===0||li===6?1.5:1;
          ctx.setLineDash(li===3?[4,3]:[]);
          ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cW,y);ctx.stroke();
          ctx.setLineDash([]);
          // Label pill
          const fibStr=`${(l*100).toFixed(1)}%`;
          const fibW=ctx.measureText(fibStr).width+8;
          ctx.fillStyle=colors[li];
          ctx.beginPath();if(ctx.roundRect)ctx.roundRect(4,y-8,fibW,13,3);else ctx.rect(4,y-8,fibW,13);ctx.fill();
          ctx.fillStyle="#fff";ctx.font=`bold 8px ${C.num}`;ctx.textAlign="left";
          ctx.fillText(fibStr,8,y+3);
          // Price on the right
          ctx.fillStyle=colors[li];ctx.font=`9px ${C.num}`;ctx.textAlign="right";
          ctx.fillText(lp.toFixed(2),cW-4,y-2);
        });
      } else if(d.type==="text"&&d.text){
        const x=(d.p1.ci-si)*tw+cw/2,y=toY(d.p1.price);
        if(x>-200&&x<cW+200){
          ctx.font=`600 12px ${C.ui}`;
          const tw2=ctx.measureText(d.text).width;
          const pw=tw2+16,ph=24,pr=5;
          ctx.fillStyle=col+"22";
          ctx.strokeStyle=col;ctx.lineWidth=1;
          ctx.beginPath();ctx.roundRect(x-pw/2,y-ph/2,pw,ph,pr);ctx.fill();ctx.stroke();
          ctx.fillStyle=col;ctx.textAlign="center";ctx.textBaseline="middle";
          ctx.fillText(d.text,x,y);
        }
      }
      ctx.restore();
    });

    // Current price pill
    const last=candles[candles.length-1];
    if(last){
      const py=toY(last.close),col=last.up?C.pos:C.neg;
      ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle=col+"50";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(cW,py);ctx.stroke();ctx.setLineDash([]);
      const lx=cW+1,lw=PW-2,lh=20,r=3,ly=py-lh/2;
      ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(lx+r,ly);ctx.lineTo(lx+lw-r,ly);ctx.quadraticCurveTo(lx+lw,ly,lx+lw,ly+r);ctx.lineTo(lx+lw,ly+lh-r);ctx.quadraticCurveTo(lx+lw,ly+lh,lx+lw-r,ly+lh);ctx.lineTo(lx+r,ly+lh);ctx.quadraticCurveTo(lx,ly+lh,lx,ly+lh-r);ctx.lineTo(lx,ly+r);ctx.quadraticCurveTo(lx,ly,lx+r,ly);ctx.closePath();ctx.fill();
      ctx.fillStyle="#fff";ctx.font=`bold 10px ${C.num}`;ctx.textAlign="center";ctx.fillText(last.close.toFixed(last.close>10?2:4),lx+lw/2,py+4);ctx.restore();
    }

    // ── SUB-PANELS ────────────────────────────────────────────────────────────
    const drawPanel=(py,ph,label,fn)=>{
      ctx.fillStyle=T.panelBg;ctx.fillRect(0,py,cW,ph);
      ctx.strokeStyle=T.border;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,py);ctx.lineTo(cW,py);ctx.stroke();
      ctx.fillStyle=T.chartText;ctx.font=`9px ${T.ui}`;ctx.textAlign="left";ctx.fillText(label,4,py+11);
      fn(py,ph);
    };

    let panelY=cH+4;

    // Volume
    if(inds.vol){
      drawPanel(panelY,VH_val,"VOL",(py,ph)=>{
        vis.forEach((c,i)=>{const bh=(c.vol/maxV)*(ph-14);ctx.fillStyle=(c.up?"#22C55E":"#EF4444")+"45";ctx.fillRect(i*tw,py+ph-bh-4,cw,bh);});
      });
      panelY+=VH_val+4;
    }

    if(false){ // placeholder block — never executes
      const ph=0;
      drawPanel(panelY,ph,"",(py)=>{
        const am=[];if(!am.length)return;
        const mMin=Math.min(...am),mMax=Math.max(...am),mR=mMax-mMin||1;
        const toMY=v=>py+ph-((v-mMin)/mR)*(ph-16)-8;
        // Zero line
        const zeroY=toMY(0);
        ctx.strokeStyle="#E5E7EB";ctx.lineWidth=0.5;ctx.setLineDash([3,3]);
        ctx.beginPath();ctx.moveTo(0,zeroY);ctx.lineTo(cW,zeroY);ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle="#9AA3B2";ctx.font=`8px ${C.num}`;ctx.textAlign="left";ctx.fillText("0",cW+4,zeroY+3);
        // Histogram — green above zero, red below, stronger color for momentum
        vis.forEach((_,i)=>{
          const h=hist[si+i];if(h==null)return;
          const prevH=hist[si+i-1];
          const z=toMY(0),barH=toMY(h)-z;
          const barAbs=Math.abs(barH);
          // Brightening: if histogram expanding use full color, contracting use lighter
          const expanding=prevH==null||(h>=0?(h>prevH):(h<prevH));
          const alpha=expanding?"80":"40";
          ctx.fillStyle=(h>=0?"#22C55E":"#EF4444")+alpha;
          ctx.fillRect(i*tw,Math.min(z,z+barH),Math.max(cw-1,2),Math.max(barAbs,1));
        });
        // MACD line (blue)
        ctx.beginPath();ctx.strokeStyle="#3B82F6";ctx.lineWidth=1.5;
        vis.forEach((_,i)=>{const v=macd[si+i];if(v==null)return;const x=i*tw+cw/2;if(i===0||macd[si+i-1]==null)ctx.moveTo(x,toMY(v));else ctx.lineTo(x,toMY(v));});
        ctx.stroke();
        // Signal line (amber)
        ctx.beginPath();ctx.strokeStyle="#F59E0B";ctx.lineWidth=1.5;
        vis.forEach((_,i)=>{const v=signal[si+i];if(v==null)return;const x=i*tw+cw/2;if(i===0||signal[si+i-1]==null)ctx.moveTo(x,toMY(v));else ctx.lineTo(x,toMY(v));});
        ctx.stroke();
        // Current values on right axis
        const li=candles.length-1;
        const lm=macd[li],ls2=signal[li],lh=hist[li];
        if(lm!=null&&ls2!=null&&lh!=null){
          ctx.font=`bold 8px ${C.num}`;ctx.textAlign="left";
          ctx.fillStyle="#3B82F6";ctx.fillText(`M:${lm.toFixed(2)}`,cW+2,py+22);
          ctx.fillStyle="#F59E0B";ctx.fillText(`S:${ls2.toFixed(2)}`,cW+2,py+32);
          ctx.fillStyle=lh>=0?"#22C55E":"#EF4444";ctx.fillText(`H:${lh.toFixed(2)}`,cW+2,py+42);
        }
      });
    }

    // RSI panel
    if(inds.rsi){
      const ph=RH_val;
      const rp=indSettings.rsi.period;
      const lbl=`RSI (${rp})`;
      drawPanel(panelY,ph,lbl,(py)=>{
        const toRY=v=>py+ph-((v/100))*(ph-14)-7;
        const ob70=toRY(70),os30=toRY(30),mid50=toRY(50);

        // ── Shaded overbought zone (>70) — faint red
        ctx.fillStyle="rgba(229,57,53,0.06)";
        ctx.fillRect(0,py+7,cW,ob70-py-7);
        // ── Shaded oversold zone (<30) — faint green
        ctx.fillStyle="rgba(22,163,74,0.06)";
        ctx.fillRect(0,os30,cW,py+ph-14-os30);

        // Reference lines
        ctx.setLineDash([3,3]);ctx.lineWidth=0.8;
        [{v:70,col:"#EF444460"},{v:50,col:"#E5E7EB"},{v:30,col:"#22C55E60"}].forEach(({v,col})=>{
          const y=toRY(v);
          ctx.strokeStyle=col;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cW,y);ctx.stroke();
          ctx.fillStyle="#9AA3B2";ctx.font=`8px ${C.num}`;ctx.textAlign="left";ctx.fillText(String(v),cW+4,y+3);
        });
        ctx.setLineDash([]);

        if(inds.rsi){
          const rv=calcRSI(candles,rp);
          // Draw RSI as segments — color changes at 70/30 boundaries
          const rsiPts=vis.map((_,i)=>({v:rv[si+i],x:i*tw+cw/2}));

          // First draw a filled area under/over the line within zones
          // Oversold fill (green)
          ctx.beginPath();
          let inOsZone=false;
          rsiPts.forEach(({v,x},i)=>{
            if(v==null)return;
            const y=toRY(v);
            if(v<=30){
              if(!inOsZone){ctx.moveTo(x,os30);inOsZone=true;}
              ctx.lineTo(x,y);
            } else if(inOsZone){ctx.lineTo(x,os30);inOsZone=false;}
          });
          if(inOsZone)ctx.lineTo(rsiPts.filter(p=>p.v!=null).slice(-1)[0]?.x||0,os30);
          ctx.fillStyle="rgba(22,163,74,0.15)";ctx.fill();

          // Overbought fill (red)
          ctx.beginPath();
          let inObZone=false;
          rsiPts.forEach(({v,x},i)=>{
            if(v==null)return;
            const y=toRY(v);
            if(v>=70){
              if(!inObZone){ctx.moveTo(x,ob70);inObZone=true;}
              ctx.lineTo(x,y);
            } else if(inObZone){ctx.lineTo(x,ob70);inObZone=false;}
          });
          if(inObZone)ctx.lineTo(rsiPts.filter(p=>p.v!=null).slice(-1)[0]?.x||0,ob70);
          ctx.fillStyle="rgba(229,57,53,0.15)";ctx.fill();

          // RSI line — single path, color-coded by zone
          ctx.lineWidth=1.5;
          let seg=[];let segCol="#6366F1";
          const flushSeg=()=>{if(seg.length<2)return;ctx.beginPath();ctx.strokeStyle=segCol;seg.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.stroke();};
          rsiPts.forEach(({v,x})=>{
            if(v==null){flushSeg();seg=[];return;}
            const y=toRY(v);
            const col=v>70?"#EF4444":v<30?"#22C55E":"#6366F1";
            if(col!==segCol&&seg.length>0){
              // Add bridging point at boundary
              seg.push({x,y});flushSeg();seg=[{x,y}];segCol=col;
            } else {seg.push({x,y});segCol=col;}
          });
          flushSeg();

          // Current RSI value label
          const lastRsi=rv[candles.length-1];
          if(lastRsi!=null){
            const rsiCol=lastRsi>70?"#EF4444":lastRsi<30?"#22C55E":"#6366F1";
            ctx.fillStyle=rsiCol;ctx.font=`bold 8px ${C.num}`;ctx.textAlign="left";
            ctx.fillText(lastRsi.toFixed(1),cW+4,py+11);
          }
        }

      });
      panelY+=RH_val+4;
    }

    // ── Time axis labels — aligned to vertical grid, real-looking labels ────
    const timeAxisY=Math.min(panelY>cH+4?panelY+2:cH+VH_val+14,H-4);
    const getAxisLabel=(idx,total,tfLabel)=>{
      const pct=idx/total;
      if(tfLabel==="1D"){const h=9+Math.floor(pct*7);const m=Math.round((pct*7%1)*60);return `${h}:${String(m).padStart(2,"0")}`;}
      if(tfLabel==="1W"){const d=["Mon","Tue","Wed","Thu","Fri"];return d[Math.floor(pct*5)%5];}
      if(tfLabel==="1M"){const mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return `${Math.floor(pct*28)+1} ${mo[new Date().getMonth()]}`;}
      if(tfLabel==="3M"){const mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return mo[Math.floor(pct*3+new Date().getMonth())%12];}
      if(tfLabel==="1Y"){const mo=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return mo[Math.floor(pct*12)%12];}
      return `${new Date().getFullYear()-Math.floor((1-pct)*5)}`; 
    };
    ctx.fillStyle="#9AA3B2";ctx.font=`10px ${C.num}`;ctx.textAlign="center";
    vis.forEach((_,i)=>{
      if(i%timeStep!==0)return;
      const label=getAxisLabel(si+i,candles.length,tf);
      ctx.fillText(label,i*tw+cw/2,timeAxisY);
    });

  },[candles,inds,drawings,zoom,off,priceOff,wickColors,VH,MH,VH_val,RH_val,tf,chartType,alerts,T,dark]);
  useEffect(()=>{draw();},[draw]);

  const drawOv=useCallback((mx,my,ad)=>{
    const cv=ovRef.current;if(!cv||!candles.length)return;
    const dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
    cv.width=W*dpr;cv.height=H*dpr;const ctx=cv.getContext("2d");ctx.scale(dpr,dpr);

    if(mx===null){setLiveInds({});return;}

    const VH=VHRef.current,MH=MHRef.current;
    const cH=H-VH-MH-4,cW=W-PW;
    const cw=Math.max(3,Math.floor((cW/100)*zRef.current)),tw=cw+Math.max(1,Math.floor(cw*0.2));
    const vc=Math.floor(cW/tw)+2,si=Math.max(0,candles.length-vc-Math.floor(offRef.current));
    const vis=candles.slice(si,Math.min(candles.length,si+vc+2));if(!vis.length)return;
    const allH=vis.flatMap(c=>[c.high,c.low]),bMinP=Math.min(...allH)*0.9985,bMaxP=Math.max(...allH)*1.0015,pR=bMaxP-bMinP;
    const minP=bMinP+priceOffRef.current,maxP=bMaxP+priceOffRef.current;
    const toY=p=>cH-((p-minP)/pR)*(cH-24)-12;
    const toP=y=>minP+((cH-y-12)/(cH-24))*pR;
    const toCi=x=>si+Math.floor(x/tw);

    if(mx>=cW||my>=cH){return;}

    // ── Snap crosshair X to nearest candle center ──────────────────────────
    const rawCi=toCi(mx);
    const ci=Math.max(si,Math.min(si+vis.length-1,rawCi));
    const snapX=(ci-si)*tw+cw/2;
    const candle=candles[ci];
    if(!candle)return;

    // ── Full-canvas crosshair lines (solid, light) ─────────────────────────
    ctx.save();
    ctx.strokeStyle=dark?"#444C56":"#C8CDD5";ctx.lineWidth=1;ctx.setLineDash([]);
    // Vertical — snapped to candle center
    ctx.beginPath();ctx.moveTo(snapX+0.5,0);ctx.lineTo(snapX+0.5,H);ctx.stroke();
    // Horizontal — follows cursor Y exactly
    ctx.beginPath();ctx.moveTo(0,Math.floor(my)+0.5);ctx.lineTo(W,Math.floor(my)+0.5);ctx.stroke();
    ctx.restore();

    // ── Draw delete handle on selected drawing ─────────────────────────────
    if(selectedIdRef.current!=null){
      const sel=drawings.find(d=>d.id===selectedIdRef.current);
      if(sel){
        // Find the center/anchor point of the selected drawing
        let hx=null,hy=null;
        if(sel.type==="hline"){hx=cW*0.85;hy=toY(sel.price);}
        else if(sel.type==="vline"){hx=((sel.ci-si)*tw+cw/2);hy=cH*0.12;}
        else if(sel.p1&&sel.p2&&sel.p2!==true){hx=((sel.p1.ci-si)*tw+(sel.p2.ci-si)*tw)/2+cw/2;hy=(toY(sel.p1.price)+toY(sel.p2.price))/2;}
        else if(sel.p1){hx=(sel.p1.ci-si)*tw+cw/2;hy=toY(sel.p1.price);}
        if(hx!==null&&hy!==null&&hx>0&&hx<cW&&hy>8&&hy<cH-8){
          // Delete ×  button drawn on canvas
          ctx.save();
          ctx.fillStyle="#DC2626";
          ctx.beginPath();ctx.arc(hx,hy,9,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle="#fff";ctx.lineWidth=1.5;
          ctx.beginPath();ctx.moveTo(hx-4,hy-4);ctx.lineTo(hx+4,hy+4);ctx.stroke();
          ctx.beginPath();ctx.moveTo(hx+4,hy-4);ctx.lineTo(hx-4,hy+4);ctx.stroke();
          ctx.restore();
        }
      }
    }

    // ── Resize handles for selected rect ──────────────────────────────────
    if(selectedIdRef.current!=null){
      const selR=drawings.find(d=>d.id===selectedIdRef.current&&d.type==="rect"&&d.p2&&d.p2!==true);
      if(selR){
        const rx1=(selR.p1.ci-si)*tw,rx2=(selR.p2.ci-si)*tw;
        const ry1=toY(selR.p1.price),ry2=toY(selR.p2.price);
        [[rx1,ry1],[rx2,ry1],[rx1,ry2],[rx2,ry2]].forEach(([cx,cy])=>{
          ctx.save();
          ctx.fillStyle="#2563EB";
          ctx.beginPath();ctx.arc(cx,cy,5,0,Math.PI*2);ctx.fill();
          ctx.strokeStyle="#fff";ctx.lineWidth=1.5;ctx.stroke();
          ctx.restore();
        });
      }
    }

    // ── Highlight the snapped candle ───────────────────────────────────────
    ctx.save();
    const bT=toY(Math.max(candle.open,candle.close));
    const bB=toY(Math.min(candle.open,candle.close));
    const bH=Math.max(bB-bT,2);
    ctx.strokeStyle=candle.up?"#16A34A":"#DC2626";ctx.lineWidth=2;
    ctx.strokeRect(Math.floor(snapX-cw/2),bT,Math.max(cw,4),bH);
    ctx.restore();

    // ── Price label on right axis (follows cursor Y) ───────────────────────
    ctx.save();
    const priceAtCursor=toP(my);
    const priceStr=priceAtCursor>1?priceAtCursor.toFixed(2):priceAtCursor.toFixed(4);
    const plx=cW+1,plw=PW-2,plh=20,plr=3,ply=my-plh/2;
    ctx.fillStyle="#1E293B";
    ctx.beginPath();
    ctx.moveTo(plx+plr,ply);ctx.lineTo(plx+plw-plr,ply);ctx.quadraticCurveTo(plx+plw,ply,plx+plw,ply+plr);
    ctx.lineTo(plx+plw,ply+plh-plr);ctx.quadraticCurveTo(plx+plw,ply+plh,plx+plw-plr,ply+plh);
    ctx.lineTo(plx+plr,ply+plh);ctx.quadraticCurveTo(plx,ply+plh,plx,ply+plh-plr);
    ctx.lineTo(plx,ply+plr);ctx.quadraticCurveTo(plx,ply,plx+plr,ply);
    ctx.closePath();ctx.fill();
    ctx.fillStyle="#fff";ctx.font=`bold 10px ${C.num}`;ctx.textAlign="center";
    ctx.fillText(priceStr,plx+plw/2,my+4);
    ctx.restore();

    // ── Time label on bottom axis (snapped to candle) ──────────────────────
    ctx.save();
    const totalCandles=candles.length;
    const candleIdx=ci;
    // Generate a time label based on timeframe and position
    const getTimeLabel=(idx,total,tfLabel)=>{
      const pct=idx/total;
      if(tfLabel==="1D"){const h=9+Math.floor(pct*7),m=Math.round((pct*7%1)*60);return `${h}:${m.toString().padStart(2,"0")}`;}
      if(tfLabel==="1W"){const days=["Mon","Tue","Wed","Thu","Fri"];return days[Math.floor(pct*5)%5]||"Mon";}
      if(tfLabel==="1M"){return `${Math.floor(pct*30)+1} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Math.floor(pct*12)%12]}`;}
      if(tfLabel==="3M"){const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return months[Math.floor(pct*3)%12];}
      if(tfLabel==="1Y"){const months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];return months[Math.floor(pct*12)%12];}
      return `${Math.floor(pct*5)+1}Y`;
    };
    // Find the current tf from the component's tf state — we pass it via closure
    const tlabel=getTimeLabel(candleIdx,totalCandles,tf_ref.current||"1D");
    const tlCtx=ctx;
    const tw2=tlabel.length*7+16;const th2=18;
    const tx=snapX-tw2/2;const ty=H-VH-MH-4+4;
    if(tx>0&&tx+tw2<cW){
      tlCtx.fillStyle="#1E293B";
      tlCtx.beginPath();tlCtx.moveTo(tx+3,ty);tlCtx.lineTo(tx+tw2-3,ty);tlCtx.quadraticCurveTo(tx+tw2,ty,tx+tw2,ty+3);tlCtx.lineTo(tx+tw2,ty+th2-3);tlCtx.quadraticCurveTo(tx+tw2,ty+th2,tx+tw2-3,ty+th2);tlCtx.lineTo(tx+3,ty+th2);tlCtx.quadraticCurveTo(tx,ty+th2,tx,ty+th2-3);tlCtx.lineTo(tx,ty+3);tlCtx.quadraticCurveTo(tx,ty,tx+3,ty);tlCtx.closePath();tlCtx.fill();
      tlCtx.fillStyle="#fff";tlCtx.font=`10px ${C.num}`;tlCtx.textAlign="center";
      tlCtx.fillText(tlabel,snapX,ty+th2/2+4);
    }
    ctx.restore();

    // ── Floating OHLCV tooltip ─────────────────────────────────────────────
    ctx.save();
    const isDark=candle.close<candle.open;
    const candleCol=candle.up?"#16A34A":"#DC2626";
    const chg=candle.close-candle.open;
    const chgPct=(chg/candle.open*100);

    // Tooltip layout
    const rows=[
      ["O", candle.open.toFixed(candle.open>10?2:4),  "#525866"],
      ["H", candle.high.toFixed(candle.high>10?2:4),  "#16A34A"],
      ["L", candle.low.toFixed(candle.low>10?2:4),    "#DC2626"],
      ["C", candle.close.toFixed(candle.close>10?2:4),candleCol],
      ["V", (candle.vol/1e6).toFixed(2)+"M",           "#525866"],
      [chg>=0?"+"+chgPct.toFixed(2)+"%":chgPct.toFixed(2)+"%", "", candleCol],
    ];

    const tFont=`11px ${C.num}`;const tFontB=`bold 11px ${C.num}`;
    const rowH=18;const ttPad=10;const ttW=130;
    const ttH=rows.length*rowH+ttPad*1.5;

    // Position: try top-right of candle, flip if near edges
    let ttX=snapX+14;let ttY=my-ttH/2;
    if(ttX+ttW>cW-4)ttX=snapX-ttW-14;
    if(ttY<4)ttY=4;
    if(ttY+ttH>cH-4)ttY=cH-ttH-4;

    // Background
    ctx.fillStyle=T.surface;
    ctx.shadowColor="rgba(0,0,0,0.15)";ctx.shadowBlur=8;ctx.shadowOffsetY=2;
    ctx.beginPath();ctx.moveTo(ttX+6,ttY);ctx.lineTo(ttX+ttW-6,ttY);ctx.quadraticCurveTo(ttX+ttW,ttY,ttX+ttW,ttY+6);ctx.lineTo(ttX+ttW,ttY+ttH-6);ctx.quadraticCurveTo(ttX+ttW,ttY+ttH,ttX+ttW-6,ttY+ttH);ctx.lineTo(ttX+6,ttY+ttH);ctx.quadraticCurveTo(ttX,ttY+ttH,ttX,ttY+ttH-6);ctx.lineTo(ttX,ttY+6);ctx.quadraticCurveTo(ttX,ttY,ttX+6,ttY);ctx.closePath();ctx.fill();
    ctx.shadowColor="transparent";ctx.shadowBlur=0;ctx.shadowOffsetY=0;
    // Border
    ctx.strokeStyle=T.border;ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(ttX+6,ttY);ctx.lineTo(ttX+ttW-6,ttY);ctx.quadraticCurveTo(ttX+ttW,ttY,ttX+ttW,ttY+6);ctx.lineTo(ttX+ttW,ttY+ttH-6);ctx.quadraticCurveTo(ttX+ttW,ttY+ttH,ttX+ttW-6,ttY+ttH);ctx.lineTo(ttX+6,ttY+ttH);ctx.quadraticCurveTo(ttX,ttY+ttH,ttX,ttY+ttH-6);ctx.lineTo(ttX,ttY+6);ctx.quadraticCurveTo(ttX,ttY,ttX+6,ttY);ctx.closePath();ctx.stroke();

    // Left color stripe
    ctx.fillStyle=candleCol;ctx.fillRect(ttX,ttY+6,3,ttH-12);

    // Rows
    rows.forEach((row,i)=>{
      const ry=ttY+ttPad/2+i*rowH+rowH/2;
      if(row[0].includes("%")){
        // Change row — centered, bold
        ctx.font=`bold 11px ${C.num}`;ctx.fillStyle=row[2];
        ctx.textAlign="center";ctx.fillText(row[0],ttX+ttW/2,ry+5);
      } else {
        ctx.font=`10px ${T.ui}`;ctx.fillStyle=T.chartText;ctx.textAlign="left";
        ctx.fillText(row[0],ttX+10,ry+4);
        ctx.font=tFont;ctx.fillStyle=row[2];ctx.textAlign="right";
        ctx.fillText(row[1],ttX+ttW-8,ry+4);
      }
    });
    ctx.restore();

    // ── Update header OHLCV ────────────────────────────────────────────────
    setCh({o:candle.open.toFixed(2),h:candle.high.toFixed(2),l:candle.low.toFixed(2),c:candle.close.toFixed(2),v:(candle.vol/1e6).toFixed(1)+"M"});

    // ── Live indicator values at cursor position ───────────────────────────
    const newLive={};
    if(inds.ema9){const e=calcEMA(candles,9);if(e[ci]!=null)newLive.ema9=e[ci].toFixed(2);}
    if(inds.ema21){const e=calcEMA(candles,21);if(e[ci]!=null)newLive.ema21=e[ci].toFixed(2);}
    if(inds.ema50){const e=calcEMA(candles,50);if(e[ci]!=null)newLive.ema50=e[ci].toFixed(2);}
    if(inds.sma20){const s=calcSMA(candles,indSettings.sma20.period);if(s[ci]!=null)newLive.sma20=s[ci].toFixed(2);}
    if(inds.sma50){const s=calcSMA(candles,indSettings.sma50.period);if(s[ci]!=null)newLive.sma50=s[ci].toFixed(2);}
    // Use rAF to batch the React state update
    if(JSON.stringify(newLive)!==JSON.stringify(liveIndsRef.current)){
      liveIndsRef.current=newLive;
      requestAnimationFrame(()=>setLiveInds({...newLive}));
    }

    // ── Drawing tool preview ───────────────────────────────────────────────
    if(ad&&ad.p2){
      const price=toP(my);
      ctx.lineWidth=2;ctx.setLineDash([]);
      const x1=(ad.p1.ci-si)*tw+cw/2,x2=(ci-si)*tw+cw/2;
      if(ad.type==="trend"||ad.type==="extline"){
        ctx.strokeStyle="#F59E0B";ctx.beginPath();ctx.moveTo(x1,toY(ad.p1.price));ctx.lineTo(x2,toY(price));ctx.stroke();
      } else if(ad.type==="ray"){
        const dx=x2-x1,dy=toY(price)-toY(ad.p1.price),len=Math.sqrt(dx*dx+dy*dy)||1,scale=(cW-x1)/len;
        ctx.strokeStyle="#F59E0B";ctx.beginPath();ctx.moveTo(x1,toY(ad.p1.price));ctx.lineTo(x1+dx*scale,toY(ad.p1.price)+dy*scale);ctx.stroke();
      } else if(ad.type==="rect"){
        const rx1=(ad.p1.ci-si)*tw,rx2=(ci-si)*tw,ry1=toY(ad.p1.price),ry2=toY(price);
        ctx.strokeStyle="#F59E0B";ctx.fillStyle="#F59E0B08";
        ctx.fillRect(Math.min(rx1,rx2),Math.min(ry1,ry2),Math.abs(rx2-rx1),Math.abs(ry2-ry1));
        ctx.strokeRect(Math.min(rx1,rx2),Math.min(ry1,ry2),Math.abs(rx2-rx1),Math.abs(ry2-ry1));
      } else if(ad.type==="channel"){
        ctx.strokeStyle="#3B82F6";
        ctx.beginPath();ctx.moveTo(x1,toY(ad.p1.price));ctx.lineTo(x2,toY(price));ctx.stroke();
        const off=(price-ad.p1.price)*0.015*(cH/pR);
        ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(x1,toY(ad.p1.price)+off);ctx.lineTo(x2,toY(price)+off);ctx.stroke();ctx.setLineDash([]);
      } else if(ad.type==="fib"){
        [0,0.236,0.382,0.5,0.618,0.786,1].forEach(l=>{
          const lp=price-(price-ad.p1.price)*l,y=toY(lp);
          ctx.strokeStyle="#F59E0B40";ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(cW,y);ctx.stroke();
        });
      }
    }
  },[candles,inds,VH,MH,VH_val,RH_val,T,dark]);

  const getXY=e=>{const r=ovRef.current.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};

  // Helper: get chart geometry at current moment
  const getChartGeo=()=>{
    const cv=ovRef.current;if(!cv||!candles.length)return null;
    const H=cv.clientHeight,W=cv.clientWidth;
    const VH=VHRef.current,MH=MHRef.current;
    const cH=H-VH-MH-4,cW=W-PW;
    const cw=Math.max(3,Math.floor((cW/100)*zRef.current));
    const tw=cw+Math.max(1,Math.floor(cw*0.2));
    const vc=Math.floor(cW/tw)+2;
    const si=Math.max(0,candles.length-vc-Math.floor(offRef.current));
    const vis=candles.slice(si,Math.min(candles.length,si+vc+2));
    if(!vis.length)return null;
    const allH=vis.flatMap(c=>[c.high,c.low]);
    const bMinP2=Math.min(...allH)*0.9985,bMaxP2=Math.max(...allH)*1.0015,pR=bMaxP2-bMinP2;
    const minP=bMinP2+priceOffRef.current,maxP=bMaxP2+priceOffRef.current;
    const toY2=p=>cH-((p-minP)/pR)*(cH-24)-12;
    const toP2=y=>minP+((cH-y-12)/(cH-24))*pR;
    const toCi2=x=>Math.max(0,Math.min(candles.length-1,si+Math.floor(x/tw)));
    return{cH,cW,cw,tw,vc,si,vis,minP,maxP,pR,toY2,toP2,toCi2};
  };

  const toPAt=(y,mx)=>{
    const g=getChartGeo();if(!g)return{price:0,ci:0};
    const ci=g.toCi2(mx);
    let price=g.toP2(y);
    if(magnetRef.current&&candles.length){
      const c=candles[Math.max(0,Math.min(ci,candles.length-1))];
      if(c){const levels=[c.open,c.high,c.low,c.close];price=levels.reduce((b,v)=>Math.abs(v-price)<Math.abs(b-price)?v:b,price);}
    }
    return{price,ci};
  };

  const onMouseDown=e=>{
    if(e.button!==0)return;
    const{x,y}=getXY(e);
    const g=getChartGeo();if(!g)return;
    if(toolRef.current==="cursor"&&y<g.cH){
      // Check rect resize handles first
      if(selectedIdRef.current!=null){
        const selR=drawings.find(d=>d.id===selectedIdRef.current&&d.type==="rect"&&d.p2&&d.p2!==true);
        if(selR){
          const rx1=(selR.p1.ci-g.si)*g.tw,rx2=(selR.p2.ci-g.si)*g.tw;
          const ry1=g.toY2(selR.p1.price),ry2=g.toY2(selR.p2.price);
          const corners=[['p1',rx1,ry1],['x2y1',rx2,ry1],['x1y2',rx1,ry2],['p2',rx2,ry2]];
          for(const[handle,cx,cy] of corners){
            if(Math.hypot(x-cx,y-cy)<10){
              isResizingRef.current={handle,snapshot:{...selR,p1:{...selR.p1},p2:{...selR.p2}}};
              e.preventDefault();return;
            }
          }
        }
      }
      // Try to hit a drawing first
      const hitId=hitTest(x,y,drawings,g.toY2,g.si,g.tw,g.cw,g.cH,g.pR,g.minP);
      if(hitId!=null){
        // Start drawing drag
        selectedIdRef.current=hitId;setSelectedId(hitId);setColorPickerOpen(false);
        isDraggingRef.current=true;
        dragStartRef.current={x,y,snapshot:drawings.map(d=>({...d,p1:d.p1?{...d.p1}:undefined,p2:d.p2?{...d.p2}:undefined}))};
        e.preventDefault();
      } else {
        // Deselect + start chart pan (both horizontal and vertical)
        selectedIdRef.current=null;setSelectedId(null);setColorPickerOpen(false);
        isPanningRef.current=true;
        panStartRef.current={x,y,offSnapshot:offRef.current,priceOffSnapshot:priceOffRef.current,pR:g.pR,cH:g.cH};
        if(ovRef.current)ovRef.current.style.cursor="grabbing";
        e.preventDefault();
      }
    }
  };

  const onMove=e=>{
    const{x,y}=getXY(e);

    // ── Rect resize ──────────────────────────────────────────────────────────
    if(isResizingRef.current&&selectedIdRef.current!=null){
      const g=getChartGeo();if(!g)return;
      const{handle}=isResizingRef.current;
      const price=g.toP2(y);
      const ci=Math.max(0,Math.min(candles.length-1,g.toCi2(x)));
      const moved=drawings.map(d=>{
        if(d.id!==selectedIdRef.current)return d;
        const nd={...d,p1:{...d.p1},p2:{...d.p2}};
        if(handle==='p1'){nd.p1.price=price;nd.p1.ci=ci;}
        else if(handle==='p2'){nd.p2.price=price;nd.p2.ci=ci;}
        else if(handle==='x2y1'){nd.p2.ci=ci;nd.p1.price=price;}
        else if(handle==='x1y2'){nd.p1.ci=ci;nd.p2.price=price;}
        return nd;
      });
      setDrawings(moved);
      drawOv(x,y,adRef.current);
      return;
    }

    // ── Chart pan (horizontal + vertical) ────────────────────────────────────
    if(isPanningRef.current&&panStartRef.current){
      const dx=x-panStartRef.current.x;
      const dy=y-panStartRef.current.y;
      const{offSnapshot,priceOffSnapshot,pR,cH}=panStartRef.current;
      const g=getChartGeo();if(!g)return;
      // Horizontal: drag right = older candles = increase offset
      const dCandles=dx/g.tw;
      const newOff=Math.max(0,Math.min(candles.length-20,offSnapshot+dCandles));
      offRef.current=newOff;setOff(newOff);
      // Vertical: drag up (dy<0) = candles shift up = priceOff decreases
      const newPriceOff=priceOffSnapshot+dy*pR/(cH-24);
      priceOffRef.current=newPriceOff;setPriceOff(newPriceOff);
      drawOv(x,y,adRef.current);
      return;
    }

    if(isDraggingRef.current&&dragStartRef.current&&selectedIdRef.current!=null){
      // Dragging a drawing
      const g=getChartGeo();if(!g)return;
      const dx=x-dragStartRef.current.x;
      const dy=y-dragStartRef.current.y;
      const dPrice=-(dy/g.cH)*g.pR*0.95;
      const dCi=Math.round(dx/g.tw);
      const snap=dragStartRef.current.snapshot;
      const moved=snap.map(d=>{
        if(d.id!==selectedIdRef.current)return d;
        const nd={...d};
        if(d.type==="hline"){nd.price=d.price+dPrice;}
        else if(d.type==="vline"){nd.ci=Math.max(0,Math.min(candles.length-1,(d.ci||0)+dCi));}
        else if(d.p1){
          nd.p1={...d.p1,price:d.p1.price+dPrice,ci:Math.max(0,Math.min(candles.length-1,d.p1.ci+dCi))};
          if(d.p2&&d.p2!==true)nd.p2={...d.p2,price:d.p2.price+dPrice,ci:Math.max(0,Math.min(candles.length-1,d.p2.ci+dCi))};
        }
        return nd;
      });
      setDrawings(moved);
      drawOv(x,y,adRef.current);
      return;
    }
    // Cursor style based on hover (only when not panning/dragging/resizing)
    if(toolRef.current==="cursor"&&!isPanningRef.current&&!isDraggingRef.current&&!isResizingRef.current){
      const g=getChartGeo();
      if(g&&y<g.cH){
        // Check resize handles first
        if(selectedIdRef.current!=null){
          const selR=drawings.find(d=>d.id===selectedIdRef.current&&d.type==="rect"&&d.p2&&d.p2!==true);
          if(selR){
            const rx1=(selR.p1.ci-g.si)*g.tw,rx2=(selR.p2.ci-g.si)*g.tw;
            const ry1=g.toY2(selR.p1.price),ry2=g.toY2(selR.p2.price);
            const cursors=[['nw-resize',rx1,ry1],['ne-resize',rx2,ry1],['sw-resize',rx1,ry2],['se-resize',rx2,ry2]];
            let found=false;
            for(const[cur,cx,cy] of cursors){if(Math.hypot(x-cx,y-cy)<10){ovRef.current.style.cursor=cur;found=true;break;}}
            if(found){drawOv(x,y,adRef.current);return;}
          }
        }
        const hitId=hitTest(x,y,drawings,g.toY2,g.si,g.tw,g.cw,g.cH,g.pR,g.minP);
        ovRef.current.style.cursor=hitId!=null?"move":"grab";
      }
    }
    drawOv(x,y,adRef.current);
  };

  const onMouseUp=e=>{
    if(isResizingRef.current){
      isResizingRef.current=null;
      setDrawings(prev=>{pushHistory([...prev]);return prev;});
      if(ovRef.current)ovRef.current.style.cursor="crosshair";
      return;
    }
    if(isDraggingRef.current&&dragStartRef.current){
      isDraggingRef.current=false;
      setDrawings(prev=>{pushHistory([...prev]);return prev;});
      dragStartRef.current=null;
    }
    if(isPanningRef.current){
      isPanningRef.current=false;
      panStartRef.current=null;
      // Restore cursor based on hover state
      if(ovRef.current)ovRef.current.style.cursor="crosshair";
    }
  };

  const onDblClick=e=>{
    // Double-click on chart resets vertical pan
    const{y}=getXY(e);
    const g=getChartGeo();
    if(g&&y<g.cH&&toolRef.current==="cursor"){
      priceOffRef.current=0;setPriceOff(0);
    }
  };

  const onLeave=()=>{
    isDraggingRef.current=false;
    isPanningRef.current=false;
    panStartRef.current=null;
    setCh(null);setLiveInds({});drawOv(null,null,null);
    if(ovRef.current)ovRef.current.style.cursor="crosshair";
  };

  const onClick=e=>{
    const t=toolRef.current;
    // If cursor and a drawing is selected — check if click hit the delete handle
    if(t==="cursor"&&selectedIdRef.current!=null){
      const{x,y}=getXY(e);
      const g=getChartGeo();if(!g)return;
      const sel=drawings.find(d=>d.id===selectedIdRef.current);
      if(sel){
        let hx=null,hy=null;
        if(sel.type==="hline"){hx=g.cW*0.85;hy=g.toY2(sel.price);}
        else if(sel.type==="vline"){hx=((sel.ci-g.si)*g.tw+g.cw/2);hy=g.cH*0.12;}
        else if(sel.p1&&sel.p2&&sel.p2!==true){hx=((sel.p1.ci-g.si)*g.tw+(sel.p2.ci-g.si)*g.tw)/2+g.cw/2;hy=(g.toY2(sel.p1.price)+g.toY2(sel.p2.price))/2;}
        else if(sel.p1){hx=(sel.p1.ci-g.si)*g.tw+g.cw/2;hy=g.toY2(sel.p1.price);}
        if(hx!==null&&Math.hypot(x-hx,y-hy)<12){
          e.stopPropagation();deleteSelected();return;
        }
      }
      return;
    }
    if(t==="cursor")return;   // selection handled in onMouseDown
    const{x,y}=getXY(e);const{price,ci}=toPAt(y,x);const ad=adRef.current;
    if(t==="hline"){const nd={type:"hline",price,col:"#F59E0B",id:Date.now()};pushHistory([...drawings,nd]);return;}
    if(t==="vline"){const nd={type:"vline",ci,col:"#94A3B8",id:Date.now()};pushHistory([...drawings,nd]);return;}
    if(t==="text"){
      // Get canvas-relative position for the floating input
      const rect=ovRef.current?.getBoundingClientRect();
      if(rect)setTextPlacing({x:e.clientX-rect.left,y:e.clientY-rect.top,ci,price});
      setTextDraft("");
      return;
    }
    if(!ad){setAD({type:t,p1:{price,ci},p2:true});}
    else{
      // Only one rect allowed at a time — remove previous rects before adding
      const base=ad.type==="rect"?drawings.filter(d=>d.type!=="rect"):drawings;
      const nd={...ad,p2:{price,ci},col:ad.type==="fib"?"#F59E0B":ad.type==="channel"?"#3B82F6":"#F59E0B",id:Date.now()};
      pushHistory([...base,nd]);
      // Auto-select the new rect so resize handles appear immediately
      if(ad.type==="rect"){selectedIdRef.current=nd.id;setSelectedId(nd.id);}
      setAD(null);
    }
  };

  const onRightClick=e=>{
    e.preventDefault();
    const{x,y}=getXY(e);
    const g=getChartGeo();if(!g)return;
    // Right-click on chart — if near a drawing, delete it
    if(y<g.cH){
      const hitId=hitTest(x,y,drawings,g.toY2,g.si,g.tw,g.cw,g.cH,g.pR,g.minP);
      if(hitId!=null){
        selectedIdRef.current=hitId;setSelectedId(hitId);
        const next=drawings.filter(d=>d.id!==hitId);
        pushHistory(next);selectedIdRef.current=null;setSelectedId(null);
        return;
      }
      // Right-click on empty chart area — check if near an alert line
      const price=g.toP2(y);
      const nearAlert=alertsRef.current.find(al=>Math.abs(g.toY2(al.price)-y)<8);
      if(nearAlert){
        setAlerts(p=>p.filter(a=>a.id!==nearAlert.id));
        return;
      }
    }
    // Right-click on price axis (x > cW) — create new alert at that price
    if(x>g.cW-10){
      if(!isPremium&&alertsRef.current.length>=FREE_ALERT_LIMIT){
        const toastId=Date.now();
        setToasts(t=>[...t,{id:toastId,msg:`Free plan: max ${FREE_ALERT_LIMIT} alerts. Upgrade for unlimited.`,col:"#F59E0B"}]);
        setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==toastId)),3500);
        return;
      }
      const price=g.toP2(y);
      const col=ALERT_COLORS[alertsRef.current.length%ALERT_COLORS.length];
      setAlerts(p=>[...p,{id:Date.now(),price,col,triggered:false}]);
    }
  };
  // Keep a mutable ref so the non-passive DOM listener always calls the latest version
  const onWheelLatest=useRef(null);
  const onWheel=e=>{
    e.preventDefault();
    const{x}=getXY(e);
    const cv=ovRef.current;
    if(!cv||!candles.length)return;
    const cW=cv.clientWidth-PW;
    const oldZ=zRef.current;
    const cw=Math.max(3,Math.floor((cW/100)*oldZ));
    const tw=cw+Math.max(1,Math.floor(cw*0.2));
    const vc=Math.floor(cW/tw)+2;
    const si=Math.max(0,candles.length-vc-Math.floor(offRef.current));

    if(e.ctrlKey||Math.abs(e.deltaX)<2){
      // ── Zoom anchored to cursor position ───────────────────────────────
      // Which candle index is under the cursor right now?
      const cursorCi=si+Math.floor(x/tw);
      // Cursor X as fraction of chart width
      const cursorFrac=Math.min(x,cW)/cW;

      const factor=e.deltaY>0?0.88:1.14;
      const newZ=Math.max(0.4,Math.min(8,oldZ*factor));
      zRef.current=newZ;

      // After zoom, recalculate so the same candle stays under cursor
      const newCw=Math.max(3,Math.floor((cW/100)*newZ));
      const newTw=newCw+Math.max(1,Math.floor(newCw*0.2));
      const newVc=Math.floor(cW/newTw)+2;
      // We want: cursorCi = newSi + cursorFrac * newVc
      // => newSi = cursorCi - cursorFrac * newVc
      const newSi=Math.round(cursorCi-cursorFrac*newVc);
      const newOff=Math.max(0,Math.min(candles.length-20,candles.length-newVc-newSi));
      offRef.current=newOff;
      setZoom(newZ);
      setOff(newOff);
    } else {
      // ── Pan left/right (delta>0 = scroll/swipe right = older candles) ────
      const delta=e.deltaY!==0?e.deltaY:e.deltaX;
      const step=Math.max(1,Math.floor(vc/8));
      offRef.current=Math.max(0,Math.min(candles.length-20,offRef.current+(delta>0?step:-step)));
      setOff(offRef.current);
    }
  };
  // Update the ref on every render so the DOM listener never goes stale
  onWheelLatest.current=onWheel;

  // Attach wheel handler as non-passive so e.preventDefault() actually stops
  // browser Ctrl+scroll page zoom — React's onWheel JSX prop can be passive.
  useEffect(()=>{
    const el=chartAreaRef.current;if(!el)return;
    const h=e=>onWheelLatest.current(e);
    el.addEventListener("wheel",h,{passive:false});
    return()=>el.removeEventListener("wheel",h);
  },[]);

  // ── Export chart as PNG ────────────────────────────────────────────────────
  const exportChart=()=>{
    const cv=cvRef.current;if(!cv)return;
    const dpr=window.devicePixelRatio||1;
    const W=cv.width/dpr,H=cv.height/dpr;
    const HEADER=64;
    const exp=document.createElement("canvas");
    exp.width=W*dpr;exp.height=(H+HEADER)*dpr;
    const ctx=exp.getContext("2d");ctx.scale(dpr,dpr);
    // Background + header
    ctx.fillStyle=dark?"#0D1117":"#FFFFFF";ctx.fillRect(0,0,W,H+HEADER);
    ctx.fillStyle=dark?"#161B22":"#F7F8FA";ctx.fillRect(0,0,W,HEADER);
    ctx.strokeStyle=dark?"#21262D":"#EAECF0";ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,HEADER);ctx.lineTo(W,HEADER);ctx.stroke();
    // Logo
    ctx.fillStyle="#2563EB";
    const lr=8;const lx=16,ly=16,lw=32,lh=32;
    ctx.beginPath();ctx.moveTo(lx+lr,ly);ctx.lineTo(lx+lw-lr,ly);ctx.quadraticCurveTo(lx+lw,ly,lx+lw,ly+lr);ctx.lineTo(lx+lw,ly+lh-lr);ctx.quadraticCurveTo(lx+lw,ly+lh,lx+lw-lr,ly+lh);ctx.lineTo(lx+lr,ly+lh);ctx.quadraticCurveTo(lx,ly+lh,lx,ly+lh-lr);ctx.lineTo(lx,ly+lr);ctx.quadraticCurveTo(lx,ly,lx+lr,ly);ctx.closePath();ctx.fill();
    ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.lineCap="round";
    const pts=[[6,13],[10,21],[14,15],[18,21],[22,9]];
    ctx.beginPath();pts.forEach(([px,py],i)=>i===0?ctx.moveTo(lx+px,ly+py):ctx.lineTo(lx+px,ly+py));ctx.stroke();
    // Ticker + price
    ctx.fillStyle=dark?"#E6EDF3":"#0D0F12";
    ctx.font=`bold 16px 'DM Sans',sans-serif`;ctx.textAlign="left";ctx.fillText(ticker+" · "+stock.name,58,28);
    ctx.font=`bold 18px 'DM Mono',monospace`;ctx.fillText("$"+stock.price.toFixed(2),58,50);
    ctx.fillStyle=stock.change>=0?"#16A34A":"#EF4444";
    ctx.font=`600 13px 'DM Mono',monospace`;ctx.fillText(`${stock.change>=0?"+":""}${stock.change}%`,58+ctx.measureText("$"+stock.price.toFixed(2)).width+8,50);
    // Date + TF badge top-right
    ctx.fillStyle=dark?"#484F58":"#9AA3B2";ctx.font=`11px 'DM Sans',sans-serif`;ctx.textAlign="right";
    ctx.fillText(`${tf} · ${new Date().toLocaleDateString()}`,W-16,28);
    ctx.fillText("ChartWiz",W-16,50);
    // Draw chart
    ctx.drawImage(cv,0,HEADER,W,H);
    // Download
    const a=document.createElement("a");
    a.download=`${ticker}_${tf}_${chartType}.png`;
    a.href=exp.toDataURL("image/png",1.0);a.click();
  };

  // EMA legend values
  const emaVals={
    ema9:  candles.length?calcEMA(candles,9)[candles.length-1]?.toFixed(2):"",
    ema21: candles.length?calcEMA(candles,21)[candles.length-1]?.toFixed(2):"",
    ema50: candles.length?calcEMA(candles,50)[candles.length-1]?.toFixed(2):"",
    sma20: candles.length?calcSMA(candles,20).filter(Boolean).slice(-1)[0]?.toFixed(2):"",
    sma50: candles.length?calcSMA(candles,50).filter(Boolean).slice(-1)[0]?.toFixed(2):"",
  };

  const TFS=["1D","1W","1M","3M","6M","YTD","1Y","5Y","MAX"];

  // Drawing tools from activeTools
  const ALL_DRAW_TOOLS={
    cursor:  {tip:"Select",            svg:<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M4 0l16 12-7 1-4 7z"/></svg>},
    hline:   {tip:"Horizontal Line",   svg:<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="3" y2="18" strokeDasharray="2,2"/><line x1="21" y1="6" x2="21" y2="18" strokeDasharray="2,2"/></svg>},
    vline:   {tip:"Vertical Line",     svg:<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><line x1="12" y1="3" x2="12" y2="21"/></svg>},
    trend:   {tip:"Trend Line",        svg:<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><line x1="3" y1="20" x2="21" y2="4"/><circle cx="3" cy="20" r="2" fill="currentColor"/><circle cx="21" cy="4" r="2" fill="currentColor"/></svg>},
    ray:     {tip:"Ray",               svg:<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><line x1="3" y1="20" x2="21" y2="4"/><circle cx="3" cy="20" r="2" fill="currentColor"/><polyline points="17,4 21,4 21,8"/></svg>},
    extline: {tip:"Extended Line",     svg:<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><line x1="2" y1="20" x2="22" y2="4"/></svg>},
    rect:    {tip:"Rectangle",         svg:<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><rect x="3" y="3" width="18" height="18" rx="1"/></svg>},
    channel: {tip:"Parallel Channel",  svg:<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><line x1="3" y1="18" x2="21" y2="6"/><line x1="3" y1="22" x2="21" y2="10" strokeDasharray="3,2"/></svg>},
    fib:     {tip:"Fibonacci",         svg:<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><line x1="3" y1="5" x2="21" y2="5"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="14" x2="21" y2="14"/><line x1="3" y1="19" x2="21" y2="19"/></svg>},
    text:    {tip:"Text Note",         svg:<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>},
  };

  // IND color legend entries to show above chart
  const IND_COLORS={sma20:"#10B981",sma50:"#F59E0B",ema9:"#3B82F6",ema21:"#8B5CF6",ema50:"#F97316"};

  // ── Toolbar A: Minimal accent bar ──────────────────────────────────────────
  const [showToolPicker,setShowToolPicker_]=useState(false);
  const toolPickerRef=useRef(null);

  useEffect(()=>{
    const h=e=>{if(toolPickerRef.current&&!toolPickerRef.current.contains(e.target))setShowToolPicker_(false);};
    if(showToolPicker)document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[showToolPicker]);

  const TOOL_GROUPS=[
    {label:"Select",     tools:["cursor"]},
    {label:"Lines",      tools:["hline","vline","trend","ray","extline"]},
    {label:"Shapes",     tools:["rect","channel"]},
    {label:"Studies",    tools:["fib"]},
    {label:"Annotation", tools:["text"]},
  ];

  // Design A tool button — 36px wide, clean hover, 3px left accent bar
  const ToolBtn=({tid})=>{
    const t=ALL_DRAW_TOOLS[tid];if(!t)return null;
    const isActive=tool===tid;
    return(
      <div style={{position:"relative",width:"100%",padding:"2px 5px"}}>
        <button
          onClick={()=>{setTool(tid);setAD(null);setShowToolPicker_(false);}}
          title={t.tip}
          style={{
            width:"100%",height:30,
            border:"none",cursor:"pointer",
            borderRadius:6,
            background:isActive?T.accent:"transparent",
            display:"flex",alignItems:"center",justifyContent:"center",
            color:isActive?"#fff":"#111111",
            transition:"background 0.12s,color 0.12s",
          }}
          onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background="#111111";e.currentTarget.style.color="#FFFFFF";}}}
          onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#111111";}}}>
          {t.svg}
        </button>
      </div>
    );
  };

  return (
    <>
    {expanded&&<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9998}} onClick={()=>setExpanded(false)}/>}
    <div style={expanded
      ?{position:"fixed",top:16,left:16,right:16,bottom:16,zIndex:9999,display:"flex",borderRadius:12,overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,0.35)",background:T.surface}
      :{display:"flex",height:"100%",background:T.surface}}>

      {/* ── Design A toolbar: 36px, white, accent bar ───────────────────────── */}
      <div style={{
        width:36,flexShrink:0,
        borderRight:`1px solid ${T.border}`,
        background:T.surface,
        display:"flex",flexDirection:"column",
        position:"relative",
        userSelect:"none",
      }}>
        {/* ── Tool groups (scrollable) ── */}
        <div style={{flex:1,overflowY:"auto",paddingTop:6}}>
          {TOOL_GROUPS.map((grp,gi)=>{
            const visible=grp.tools.filter(tid=>activeTools.includes(tid)||tid==="cursor");
            if(!visible.length)return null;
            return(
              <div key={grp.label}>
                {gi>0&&(
                  <div style={{height:1,margin:"5px 8px",background:"#E2E8F0"}}/>
                )}
                {visible.map(tid=><ToolBtn key={tid} tid={tid}/>)}
              </div>
            );
          })}
        </div>

        {/* ── Bottom actions ── */}
        <div style={{borderTop:`1px solid ${T.border}`,paddingBottom:4}}>

          {/* Undo */}
          <button onClick={undo} title="Undo (Cmd+Z)" disabled={histIdx<=0}
            style={{width:"calc(100% - 10px)",height:30,border:"none",cursor:histIdx<=0?"not-allowed":"pointer",borderRadius:6,margin:"2px 5px",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:histIdx<=0?"#CBD5E1":"#64748B",opacity:histIdx<=0?0.4:1,transition:"all 0.12s"}}
            onMouseEnter={e=>{if(histIdx>0){e.currentTarget.style.background="#111111";e.currentTarget.style.color="#fff";}}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=histIdx<=0?"#CBD5E1":"#64748B";}}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
          </button>

          {/* Redo */}
          <button onClick={redo} title="Redo (Cmd+Shift+Z)" disabled={histIdx>=history.length-1}
            style={{width:"calc(100% - 10px)",height:30,border:"none",cursor:histIdx>=history.length-1?"not-allowed":"pointer",borderRadius:6,margin:"2px 5px",background:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:histIdx>=history.length-1?"#CBD5E1":"#64748B",opacity:histIdx>=history.length-1?0.4:1,transition:"all 0.12s"}}
            onMouseEnter={e=>{if(histIdx<history.length-1){e.currentTarget.style.background="#111111";e.currentTarget.style.color="#fff";}}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=histIdx>=history.length-1?"#CBD5E1":"#64748B";}}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg>
          </button>

          <div ref={toolPickerRef} style={{position:"relative"}}>

            {/* ── Flyout panel ── */}
            {showToolPicker&&(
              <div style={{
                position:"absolute",
                left:"calc(100% + 6px)",
                bottom:0,
                width:228,
                background:T.surface,
                border:`1px solid ${T.border}`,
                borderRadius:10,
                boxShadow:"0 12px 32px rgba(15,23,42,0.10),0 2px 8px rgba(15,23,42,0.06)",
                zIndex:600,
                overflow:"hidden",
              }}>
                {/* Header */}
                <div style={{
                  padding:"11px 14px 10px",
                  borderBottom:`1px solid ${T.border}`,
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                }}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text,letterSpacing:"-0.01em"}}>Drawing Tools</span>
                  <span style={{fontSize:10,color:T.textMuted,fontWeight:400}}>toggle to show</span>
                </div>

                {/* Tool rows */}
                <div style={{maxHeight:300,overflowY:"auto",padding:"4px 0"}}>
                  {TOOL_GROUPS.map(grp=>(
                    <div key={grp.label}>
                      <div style={{
                        padding:"8px 14px 3px",
                        fontSize:10,fontWeight:600,
                        color:T.textMuted,
                        letterSpacing:"0.07em",
                        textTransform:"uppercase",
                      }}>{grp.label}</div>
                      {grp.tools.filter(t=>t!=="cursor").map(tid=>{
                        const t=ALL_DRAW_TOOLS[tid];if(!t)return null;
                        const isOn=activeTools.includes(tid);
                        return(
                          <button
                            key={tid}
                            onClick={()=>{
                              if(isOn){
                                setActiveTools(p=>p.filter(x=>x!==tid));
                                if(tool===tid){setTool("cursor");toolRef.current="cursor";}
                              } else {
                                setActiveTools(p=>[...p,tid]);
                              }
                            }}
                            style={{
                              width:"100%",display:"flex",alignItems:"center",
                              gap:10,padding:"6px 14px",
                              border:"none",background:"transparent",
                              cursor:"pointer",transition:"background 0.1s",
                            }}
                            onMouseEnter={e=>e.currentTarget.style.background="rgba(15,23,42,0.04)"}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            {/* Toggle pill */}
                            <div style={{
                              width:28,height:15,borderRadius:99,
                              background:isOn?T.accent:T.border,
                              position:"relative",transition:"background 0.18s",
                              flexShrink:0,
                            }}>
                              <div style={{
                                position:"absolute",
                                top:2,left:isOn?13:2,
                                width:11,height:11,
                                borderRadius:"50%",
                                background:"#fff",
                                boxShadow:"0 1px 3px rgba(0,0,0,0.18)",
                                transition:"left 0.18s",
                              }}/>
                            </div>
                            {/* Icon */}
                            <span style={{
                              display:"flex",alignItems:"center",flexShrink:0,
                              color:isOn?T.text:T.textMuted,
                            }}>{t.svg}</span>
                            {/* Label */}
                            <span style={{
                              fontSize:12,fontWeight:isOn?500:400,
                              color:isOn?T.text:T.textMuted,
                              flex:1,textAlign:"left",
                              letterSpacing:"-0.01em",
                            }}>{t.tip}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Footer actions */}
                <div style={{
                  borderTop:`1px solid ${T.border}`,
                  padding:"9px 14px",
                  display:"flex",alignItems:"center",gap:0,
                }}>
                  <button
                    onClick={()=>{
                      setActiveTools(["cursor","hline","vline","trend","ray","extline","rect","channel","fib"]);
                      setShowToolPicker_(false);
                    }}
                    style={{fontSize:11,fontWeight:500,color:T.accent,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:T.ui}}>
                    Enable all
                  </button>
                  <span style={{color:T.border,padding:"0 8px",userSelect:"none"}}>·</span>
                  <button
                    onClick={()=>{
                      setActiveTools(["cursor"]);
                      setTool("cursor");toolRef.current="cursor";
                      setShowToolPicker_(false);
                    }}
                    style={{fontSize:11,fontWeight:400,color:T.textMuted,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:T.ui}}>
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clear all drawings */}
          <button
            onClick={()=>setDrawings([])}
            title="Clear all drawings"
            style={{
              width:"calc(100% - 10px)",height:30,border:"none",cursor:"pointer",
              borderRadius:6,margin:"2px 5px",
              background:"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",
              color:"#64748B",transition:"background 0.12s,color 0.12s",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="#2D1515";e.currentTarget.style.color="#F87171";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#64748B";}}>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>

          {/* Magnet toggle */}
          <button
            onClick={()=>setMagnetMode(v=>!v)}
            title={magnetMode?"Magnet: ON — snapping to candle OHLC":"Magnet: OFF — click to snap drawings to candles"}
            style={{
              width:"calc(100% - 10px)",height:30,border:"none",cursor:"pointer",
              borderRadius:6,margin:"2px 5px",
              background:magnetMode?T.accentLight:"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",
              color:magnetMode?T.accent:"#64748B",
              transition:"background 0.12s,color 0.12s",
              outline:magnetMode?`1px solid ${T.accentBorder}`:"none",
            }}
            onMouseEnter={e=>{if(!magnetMode){e.currentTarget.style.background=T.bg;e.currentTarget.style.color=T.text;}}}
            onMouseLeave={e=>{if(!magnetMode){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#64748B";}}}>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13">
              <path d="M6 15a6 6 0 1 0 12 0V9"/><path d="M6 9V7a6 6 0 0 1 12 0v2"/><line x1="6" y1="9" x2="18" y2="9"/>
            </svg>
          </button>

        </div>
      </div>

      {/* Chart area */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>

        {/* Chart header */}
        <div style={{padding:"14px 16px 0",flexShrink:0}}>
          {/* Row 1: Company + tags + actions */}
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:16,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>{stock.name||ticker}</span>
            <span style={{fontSize:13,fontWeight:500,color:T.textMuted,letterSpacing:"-0.01em"}}>{ticker}</span>
            <div style={{flex:1}}/>
            {ch&&<div style={{display:"flex",gap:6}}>
              {[["O",ch.o],["H",ch.h,T.pos],["L",ch.l,T.neg],["V",ch.v]].map(([k,v,col])=>(
                <span key={k} style={{fontSize:10,fontFamily:T.num,color:col||T.textMuted}}><span style={{color:T.textMuted}}>{k} </span>{v}</span>
              ))}
            </div>}
            <button onClick={()=>onAddToWatchlist(ticker)} style={{display:"flex",alignItems:"center",gap:4,height:26,padding:"0 10px",borderRadius:5,border:`1px solid ${T.border}`,background:T.surface,fontSize:11,fontWeight:500,color:T.textSub,cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSub;}}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add to watchlist
            </button>
            <button onClick={exportChart} title="Export chart as PNG"
              style={{display:"flex",alignItems:"center",gap:4,height:26,padding:"0 10px",borderRadius:5,border:`1px solid ${T.border}`,background:T.surface,fontSize:11,fontWeight:500,color:T.textSub,cursor:"pointer"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.accent;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textSub;}}>
              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
          </div>
          {/* Row 2: Price + change + market status */}
          <div style={{display:"flex",alignItems:"baseline",gap:10,marginBottom:2}}>
            <span style={{fontSize:30,fontWeight:700,color:T.text,fontFamily:T.num,letterSpacing:"-0.03em"}}>{stock.price.toLocaleString()}</span>
            <span style={{fontSize:13,color:T.textMuted,fontFamily:T.num}}>USD</span>
            <span style={{fontSize:14,fontWeight:600,color:stock.change>=0?T.pos:T.neg,fontFamily:T.num}}>{stock.change>=0?"+":""}{((stock.price*stock.change/100)||0).toFixed(2)} ({stock.change>=0?"+":""}{stock.change}%)</span>
          </div>
          <div style={{fontSize:11,color:T.textMuted,marginBottom:10}}>
            {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} · NYSE / NASDAQ
          </div>

          {/* TF row + chart type + legend + controls */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${T.border}`,paddingBottom:0}}>
            <div style={{display:"flex",alignItems:"stretch",height:30,gap:0}}>
              {TFS.map(t=>(
                <button key={t} onClick={()=>setTf(t)} style={{height:26,padding:"0 10px",background:tf===t?T.accent:"transparent",border:"none",borderRadius:20,fontSize:11,fontWeight:tf===t?600:400,color:tf===t?"#fff":T.textSub,cursor:"pointer",margin:"0 1px",alignSelf:"center",transition:"all 0.15s"}}>
                  {t}
                </button>
              ))}
              <div style={{width:1,height:18,background:T.border,alignSelf:"center",margin:"0 4px"}}/>
              {/* Chart type switcher */}
              {[
                {id:"candle",tip:"Candlestick",svg:<svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="13" height="13"><rect x="4" y="7" width="4" height="8" rx="0.5"/><line x1="6" y1="4" x2="6" y2="7"/><line x1="6" y1="15" x2="6" y2="20"/><rect x="14" y="9" width="4" height="6" rx="0.5"/><line x1="16" y1="5" x2="16" y2="9"/><line x1="16" y1="15" x2="16" y2="19"/></svg>},
                {id:"ha",    tip:"Heikin Ashi",svg:<svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="13" height="13"><rect x="4" y="6" width="4" height="10" rx="0.5" fill="currentColor" fillOpacity="0.3"/><line x1="6" y1="3" x2="6" y2="6"/><line x1="6" y1="16" x2="6" y2="20"/><rect x="14" y="8" width="4" height="7" rx="0.5" fill="currentColor" fillOpacity="0.3"/><line x1="16" y1="4" x2="16" y2="8"/><line x1="16" y1="15" x2="16" y2="20"/></svg>},
                {id:"bar",   tip:"OHLC Bars",  svg:<svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="13" height="13"><line x1="6" y1="4" x2="6" y2="20"/><line x1="3" y1="8" x2="6" y2="8"/><line x1="6" y1="14" x2="9" y2="14"/><line x1="16" y1="5" x2="16" y2="19"/><line x1="13" y1="10" x2="16" y2="10"/><line x1="16" y1="15" x2="19" y2="15"/></svg>},
                {id:"line",  tip:"Line",        svg:<svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="13" height="13"><polyline points="3 17 8 11 13 14 21 6"/></svg>},
                {id:"area",  tip:"Area",        svg:<svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" width="13" height="13"><polyline points="3 17 8 11 13 14 21 6"/><path d="M3 17 L21 6 L21 20 L3 20 Z" fill="currentColor" fillOpacity="0.15" stroke="none"/></svg>},
              ].map(ct=>(
                <button key={ct.id} title={ct.tip} onClick={()=>{setChartType(ct.id);chartTypeRef.current=ct.id;}}
                  style={{height:"100%",width:28,background:"transparent",border:"none",borderBottom:chartType===ct.id?`2px solid ${T.accent}`:"2px solid transparent",color:chartType===ct.id?T.accent:T.textMuted,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:-1,transition:"all 0.1s"}}>
                  {ct.svg}
                </button>
              ))}
            </div>
            {/* Controls right side */}
            <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0,paddingBottom:6}}>
              {/* Indicators button */}
              <div style={{position:"relative"}}>
                <button onClick={e=>{e.stopPropagation();setShowIndMenu(v=>!v);}} style={{display:"flex",alignItems:"center",gap:4,height:24,padding:"0 10px",borderRadius:20,border:`1px solid ${T.border}`,background:showIndMenu?T.accentLight:T.surface,cursor:"pointer",fontSize:11,color:showIndMenu?T.accent:T.textSub,fontWeight:showIndMenu?600:400,transition:"all 0.1s"}}>
                  Indicators
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {showIndMenu&&(
                  <div style={{position:"absolute",right:0,top:28,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.1)",zIndex:200,minWidth:200,padding:"8px 0"}} onClick={e=>e.stopPropagation()}>
                    <div style={{padding:"4px 12px 8px",fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Overlays</div>
                    {/* Indicator rows with period settings */}
                    {[...Object.entries(IND_CATALOG).filter(([,v])=>v.group==="overlay")].map(([k,v])=>(
                      <div key={k}>
                        <div style={{display:"flex",alignItems:"center",padding:"4px 12px",gap:8,cursor:"pointer"}}
                          onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <label style={{display:"flex",alignItems:"center",gap:8,flex:1,cursor:"pointer",fontSize:12,color:T.text}}>
                            <input type="checkbox" checked={!!inds[k]} onChange={()=>{setInds(p=>({...p,[k]:!p[k]}));}} style={{accentColor:v.col,width:13,height:13,cursor:"pointer"}}/>
                            <span style={{width:10,height:2,background:v.col,display:"inline-block",borderRadius:1,flexShrink:0}}/>
                            {v.label}
                          </label>
                          {indSettings[k]&&<button onClick={e=>{e.stopPropagation();setEditingInd(editingInd===k?null:k);}} style={{width:18,height:18,borderRadius:3,border:`1px solid ${editingInd===k?T.accent:T.border}`,background:editingInd===k?T.accentLight:"transparent",cursor:"pointer",color:editingInd===k?T.accent:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                          </button>}
                        </div>
                        {editingInd===k&&indSettings[k]&&(
                          <div style={{padding:"6px 12px 8px 36px",background:T.bg,borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`}}>
                            {Object.entries(indSettings[k]).map(([param,val])=>(
                              <div key={param} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                <span style={{fontSize:10,color:T.textMuted,width:50,textTransform:"capitalize"}}>{param}</span>
                                <input type="number" value={val} min={1} max={200}
                                  onChange={e=>{const n=Math.max(1,Math.min(200,parseInt(e.target.value)||val));setIndSettings(s=>({...s,[k]:{...s[k],[param]:n}}));}}
                                  style={{width:52,height:22,padding:"0 6px",borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.num,color:T.text,background:T.surface,outline:"none"}}/>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{height:1,background:T.border,margin:"6px 0"}}/>
                    <div style={{padding:"4px 12px 6px",fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.06em"}}>Panels</div>
                    {Object.entries(IND_CATALOG).filter(([,v])=>v.group==="panel").map(([k,v])=>(
                      <div key={k}>
                        <div style={{display:"flex",alignItems:"center",padding:"4px 12px",gap:8,cursor:"pointer"}}
                          onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <label style={{display:"flex",alignItems:"center",gap:8,flex:1,cursor:"pointer",fontSize:12,color:T.text}}>
                            <input type="checkbox" checked={!!inds[k]} onChange={()=>{setInds(p=>({...p,[k]:!p[k]}));}} style={{accentColor:v.col,width:13,height:13,cursor:"pointer"}}/>
                            <span style={{width:10,height:2,background:v.col,display:"inline-block",borderRadius:1,flexShrink:0}}/>
                            {v.label}
                          </label>
                          {indSettings[k]&&<button onClick={e=>{e.stopPropagation();setEditingInd(editingInd===k?null:k);}} style={{width:18,height:18,borderRadius:3,border:`1px solid ${editingInd===k?T.accent:T.border}`,background:editingInd===k?T.accentLight:"transparent",cursor:"pointer",color:editingInd===k?T.accent:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <svg width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                          </button>}
                        </div>
                        {editingInd===k&&indSettings[k]&&(
                          <div style={{padding:"6px 12px 8px 36px",background:T.bg,borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`}}>
                            {Object.entries(indSettings[k]).map(([param,val])=>(
                              <div key={param} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                                <span style={{fontSize:10,color:T.textMuted,width:50,textTransform:"capitalize"}}>{param}</span>
                                <input type="number" value={val} min={1} max={200}
                                  onChange={e=>{const n=Math.max(1,Math.min(200,parseInt(e.target.value)||val));setIndSettings(s=>({...s,[k]:{...s[k],[param]:n}}));}}
                                  style={{width:52,height:22,padding:"0 6px",borderRadius:4,border:`1px solid ${T.border}`,fontSize:11,fontFamily:T.num,color:T.text,background:T.surface,outline:"none"}}/>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <div style={{height:1,background:T.border,margin:"6px 0 4px"}}/>
                    <button onClick={()=>{setInds({...DEFAULT_INDS});setShowIndMenu(false);}} style={{display:"block",width:"100%",padding:"5px 12px",fontSize:11,color:T.textMuted,background:"none",border:"none",cursor:"pointer",textAlign:"left"}}>Reset to default</button>
                  </div>
                )}
              </div>

              {/* ── Candle / wick color picker ── */}
              <div style={{position:"relative"}}>
                <button onClick={e=>{e.stopPropagation();setShowCandleStyle(v=>!v);}}
                  title="Candle & wick colors"
                  style={{display:"flex",alignItems:"center",gap:4,height:24,padding:"0 10px",borderRadius:20,border:`1px solid ${showCandleStyle?T.accent:T.border}`,background:showCandleStyle?T.accentLight:T.surface,cursor:"pointer",fontSize:11,fontFamily:T.ui,color:showCandleStyle?T.accent:T.textSub,fontWeight:showCandleStyle?600:500,transition:"all 0.12s"}}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                  Candle
                </button>
                {showCandleStyle&&(
                  <div style={{position:"absolute",right:0,top:28,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.1)",zIndex:300,width:220,padding:"12px 14px"}} onClick={e=>e.stopPropagation()}>
                    <div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Wick Colors</div>
                    {[
                      {label:"Up wick",key:"up",def:"#16A34A"},
                      {label:"Down wick",key:"down",def:"#DC2626"},
                    ].map(({label,key,def})=>(
                      <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontSize:12,color:T.text}}>{label}</span>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <div style={{width:20,height:20,borderRadius:4,background:wickColors[key]||def,border:`1px solid ${T.border}`,cursor:"pointer",position:"relative",overflow:"hidden"}}>
                            <input type="color" value={wickColors[key]||def}
                              onChange={e=>setWickColors(p=>({...p,[key]:e.target.value}))}
                              style={{opacity:0,position:"absolute",inset:0,width:"100%",height:"100%",cursor:"pointer"}}/>
                          </div>
                          {wickColors[key]&&<button onClick={()=>setWickColors(p=>({...p,[key]:""}))} style={{fontSize:9,color:T.textMuted,background:"none",border:"none",cursor:"pointer",padding:0}}>reset</button>}
                        </div>
                      </div>
                    ))}
                    <div style={{height:1,background:T.border,margin:"8px 0"}}/>
                    <button onClick={()=>setWickColors({up:"",down:""})} style={{fontSize:11,color:T.textMuted,background:"none",border:"none",cursor:"pointer",padding:0}}>Reset all to default</button>
                  </div>
                )}
              </div>

              {/* ── Expand overlay ── */}
              <button
                onClick={()=>setExpanded(v=>!v)}
                title={expanded?"Collapse chart":"Expand chart"}
                style={{display:"flex",alignItems:"center",gap:4,height:24,padding:"0 10px",borderRadius:20,border:`1px solid ${expanded?T.accent:T.border}`,background:expanded?T.accentLight:T.surface,cursor:"pointer",fontSize:11,fontFamily:T.ui,color:expanded?T.accent:T.textSub,fontWeight:expanded?600:500,transition:"all 0.12s"}}
                onMouseEnter={e=>{if(!expanded){e.currentTarget.style.background=T.bg;e.currentTarget.style.color=T.text;}}}
                onMouseLeave={e=>{if(!expanded){e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.textSub;}}}>
                {expanded
                  ?<svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>
                  :<svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>}
                {expanded?"Collapse":"Expand"}
              </button>

            </div>
          </div>
        </div>

        {/* Canvas */}
        <div ref={chartAreaRef} style={{flex:1,position:"relative",overflow:"hidden",background:T.chartBg}} onClick={()=>{setShowIndMenu(false);setShowCandleStyle(false);}}>
          <canvas ref={cvRef} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>

          {/* Toast notifications */}
          <div style={{position:"absolute",top:8,right:72,display:"flex",flexDirection:"column",gap:6,zIndex:200,pointerEvents:"none"}}>
            {toasts.map(toast=>(
              <div key={toast.id} style={{
                display:"flex",alignItems:"center",gap:8,
                padding:"8px 12px",
                background:"#111111",
                borderRadius:8,
                boxShadow:"0 4px 12px rgba(0,0,0,0.2)",
                borderLeft:`3px solid ${toast.col}`,
                animation:"slideIn 0.2s ease",
                pointerEvents:"auto",
              }}>
                <span style={{fontSize:11,color:"#fff",fontFamily:T.ui,fontWeight:500}}>{toast.msg}</span>
              </div>
            ))}
          </div>

          {/* Floating text input when text tool is active */}
          {textPlacing&&(
            <div style={{position:"absolute",left:textPlacing.x,top:textPlacing.y,transform:"translate(-50%,-50%)",zIndex:500}}>
              <input autoFocus value={textDraft} onChange={e=>setTextDraft(e.target.value)}
                onKeyDown={e=>{
                  if(e.key==="Enter"&&textDraft.trim()){
                    pushHistory([...drawings,{type:"text",p1:{ci:textPlacing.ci,price:textPlacing.price},text:textDraft.trim(),col:"#F59E0B",id:Date.now()}]);
                    setTextPlacing(null);setTextDraft("");
                  }
                  if(e.key==="Escape"){setTextPlacing(null);setTextDraft("");}
                }}
                onBlur={()=>{
                  if(textDraft.trim())pushHistory([...drawings,{type:"text",p1:{ci:textPlacing.ci,price:textPlacing.price},text:textDraft.trim(),col:"#F59E0B",id:Date.now()}]);
                  setTextPlacing(null);setTextDraft("");
                }}
                placeholder="Type note…"
                style={{height:28,padding:"0 10px",borderRadius:6,border:"2px solid #F59E0B",background:T.surface,color:T.text,fontSize:12,fontFamily:T.ui,outline:"none",minWidth:120,boxShadow:"0 4px 12px rgba(0,0,0,0.2)"}}
              />
            </div>
          )}

          {/* Active alerts badge — bottom right of chart */}
          {alerts.length>0&&(
            <div style={{position:"absolute",bottom:VH+MH+12,right:72,zIndex:100,display:"flex",flexDirection:"column",gap:4}}>
              {alerts.map(al=>(
                <div key={al.id} style={{
                  display:"flex",alignItems:"center",gap:6,
                  padding:"4px 8px",
                  background:al.triggered?"#F1F5F9":"#111111",
                  borderRadius:6,
                  border:`1px solid ${al.triggered?"#E2E8F0":al.col}`,
                  cursor:"pointer",
                  opacity:al.triggered?0.5:1,
                }} onClick={()=>setAlerts(p=>p.filter(a=>a.id!==al.id))}
                title="Click to remove alert">
                  <div style={{width:6,height:6,borderRadius:"50%",background:al.triggered?"#94A3B8":al.col,flexShrink:0}}/>
                  <span style={{fontSize:10,fontFamily:T.num,fontWeight:600,color:al.triggered?T.textMuted:"#fff"}}>{al.price.toFixed(2)}</span>
                  <span style={{fontSize:9,color:al.triggered?"#94A3B8":"#ffffff80"}}>×</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Alerts panel ──────────────────────────────────────────────── */}
          {alertsOpen&&(
            <div style={{position:"absolute",top:52,right:16,width:272,background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,boxShadow:"0 8px 24px rgba(0,0,0,0.14)",zIndex:500,overflow:"hidden"}}>
              {/* Header */}
              <div style={{padding:"12px 14px 10px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <svg width="13" height="13" fill="none" stroke={T.accent} strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <span style={{fontSize:13,fontWeight:600,color:T.text}}>Price Alerts</span>
                  {alerts.length>0&&<span style={{fontSize:10,fontWeight:700,color:T.accent,background:T.accentLight,borderRadius:10,padding:"1px 6px"}}>{alerts.length}</span>}
                </div>
                <button onClick={onAlertsToggle} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,fontSize:18,lineHeight:1,padding:0}}>×</button>
              </div>

              {/* Add alert */}
              <div style={{padding:"10px 14px",borderBottom:`1px solid ${T.border}`}}>
                {!isPremium&&alerts.length>=FREE_ALERT_LIMIT?(
                  <div style={{padding:"10px 12px",borderRadius:8,background:dark?"#2D1F00":"#FFFBEB",border:`1px solid ${dark?"#5C3D00":"#FDE68A"}`,textAlign:"center"}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:3}}>Alert limit reached</div>
                    <div style={{fontSize:11,color:T.textMuted}}>Free plan allows {FREE_ALERT_LIMIT} alerts. Upgrade to Pro for unlimited.</div>
                  </div>
                ):(
                  <>
                    <div style={{fontSize:11,color:T.textMuted,marginBottom:6}}>
                      Notify when {ticker} reaches:
                      {!isPremium&&<span style={{marginLeft:6,color:T.textMuted}}>{alerts.length}/{FREE_ALERT_LIMIT} used</span>}
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      <input
                        type="number"
                        value={alertInput}
                        onChange={e=>setAlertInput(e.target.value)}
                        onKeyDown={e=>{if(e.key==="Enter")commitAlert();}}
                        placeholder={`e.g. ${stock?.price?(stock.price*1.05).toFixed(2):"150.00"}`}
                        style={{flex:1,height:30,padding:"0 8px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:12,fontFamily:T.num,outline:"none"}}
                      />
                      <button onClick={commitAlert}
                        style={{height:30,padding:"0 12px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
                        Add
                      </button>
                    </div>
                    <div style={{fontSize:10,color:T.textMuted,marginTop:5}}>You can also right-click the price axis on the chart to set an alert at that level.</div>
                  </>
                )}
              </div>

              {/* Alert list */}
              <div style={{maxHeight:220,overflowY:"auto"}}>
                {alerts.length===0&&(
                  <div style={{padding:"20px 14px",textAlign:"center",color:T.textMuted,fontSize:12}}>No alerts set for {ticker}</div>
                )}
                {alerts.map(al=>(
                  <div key={al.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderBottom:`1px solid ${T.borderLight}`}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:al.col,flexShrink:0,opacity:al.triggered?0.4:1}}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:al.triggered?T.textMuted:T.text,fontFamily:T.num}}>${al.price.toFixed(2)}</div>
                      <div style={{fontSize:10,color:T.textMuted}}>{al.triggered?"Triggered":"Active"}</div>
                    </div>
                    <button
                      onClick={()=>setAlerts(p=>p.filter(a=>a.id!==al.id))}
                      style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,fontSize:16,lineHeight:1,padding:0}}
                      onMouseEnter={e=>e.currentTarget.style.color=T.neg}
                      onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}>
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {alerts.length>0&&(
                <div style={{padding:"8px 14px",borderTop:`1px solid ${T.border}`}}>
                  <button onClick={()=>setAlerts([])} style={{fontSize:11,color:T.neg,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Clear all alerts</button>
                </div>
              )}
            </div>
          )}


          {/* Selection toolbar — appears when a drawing is selected */}
          {selectedId!=null&&(()=>{
            const selD=drawings.find(d=>d.id===selectedId);
            if(!selD)return null;
            const COLORS=["#F59E0B","#EF4444","#3B82F6","#8B5CF6","#10B981","#EC4899","#06B6D4","#F97316"];
            return(
              <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",display:"flex",alignItems:"center",gap:4,background:"#fff",border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 8px",boxShadow:"0 2px 12px rgba(0,0,0,0.1)",zIndex:100}}>
                <span style={{fontSize:10,color:T.textMuted,fontFamily:T.ui,paddingRight:4,borderRight:`1px solid ${T.border}`,marginRight:4}}>Color</span>
                {COLORS.map(col=>(
                  <button key={col} onClick={e=>{e.stopPropagation();const next=drawings.map(d=>d.id===selectedId?{...d,col}:d);pushHistory(next);}}
                    style={{width:16,height:16,borderRadius:"50%",background:col,border:selD.col===col?"2px solid #0D0F12":"2px solid transparent",cursor:"pointer",flexShrink:0,padding:0}}/>
                ))}
                <div style={{width:1,height:16,background:T.border,margin:"0 4px"}}/>
                <button onClick={e=>{e.stopPropagation();deleteSelected();}}
                  style={{height:22,padding:"0 10px",borderRadius:4,border:"none",background:"#DC2626",color:"#fff",cursor:"pointer",fontSize:10,fontFamily:T.ui,fontWeight:600,display:"flex",alignItems:"center",gap:4}}
                  onMouseEnter={e=>e.currentTarget.style.background="#B91C1C"}
                  onMouseLeave={e=>e.currentTarget.style.background="#DC2626"}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                  Delete
                </button>
                <button onClick={e=>{e.stopPropagation();selectedIdRef.current=null;setSelectedId(null);}}
                  style={{height:22,width:22,borderRadius:4,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
              </div>
            );
          })()}
          <canvas ref={ovRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",cursor:"crosshair"}}
            onMouseDown={onMouseDown}
            onMouseMove={onMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onLeave}
            onClick={e=>{e.stopPropagation();onClick(e);}}
            onDoubleClick={onDblClick}
            onContextMenu={onRightClick}/>
        </div>
      </div>

    </div>
    </>
  );
}


// ─── MARKET SNAPSHOT PANEL (right) ───────────────────────────────────────────
function MarketSnapshot({ticker,stock,T=LIGHT,dark=false,isPremium=false,onUpgrade=()=>{},analysts=null}){
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const chatRef=useRef(null);
  const summary=getSummary(ticker,stock);
  const scenario=getScenario(stock);

  const PROMPTS=[
    `What are the key levels to watch for ${ticker}?`,
    `How is ${ticker}'s momentum looking?`,
    `What does the volume tell us about ${ticker}?`,
  ];

  const getDailyAiUsed = () => {
    try{
      const s=JSON.parse(localStorage.getItem("chartwiz-ai-daily")||"{}");
      return s.date===new Date().toDateString() ? (s.count||0) : 0;
    }catch{return 0;}
  };
  const incrementDailyAi = () => {
    const count=getDailyAiUsed()+1;
    localStorage.setItem("chartwiz-ai-daily",JSON.stringify({date:new Date().toDateString(),count}));
  };

  const [dailyUsed,setDailyUsed]=useState(getDailyAiUsed);
  const chatsLeft = isPremium ? Infinity : Math.max(0, FREE_AI_DAILY_LIMIT - dailyUsed);

  useEffect(()=>{setMsgs([]);},[ticker]);
  useEffect(()=>{if(chatRef.current)chatRef.current.scrollTop=chatRef.current.scrollHeight;},[msgs]);

  const send=async msg=>{
    if(!msg.trim()||loading)return;
    if(!isPremium&&getDailyAiUsed()>=FREE_AI_DAILY_LIMIT){
      setMsgs(p=>[...p,{role:"user",content:msg},{role:"assistant",content:"__upgrade__"}]);
      setInput("");return;
    }
    const nm=[...msgs,{role:"user",content:msg}];setMsgs(nm);setInput("");setLoading(true);
    const systemPrompt = isPremium
      ? `You are ChartWiz AI Premium, an advanced educational chart analysis assistant. The user is analyzing ${ticker} (${stock.name}), trading at $${stock.price?.toFixed(2)} with a ${stock.change>=0?'+':''}${stock.change?.toFixed(2)}% change today.

Technical context:
- Trend: ${stock.trend} | Momentum: ${stock.momentum} | Volume: ${stock.volume}
- Day range: $${stock.low?.toFixed(2)} – $${stock.high?.toFixed(2)}
- Resistance: $${stock.resistance?.toFixed?.(2)??stock.resistance} | Support: $${stock.support?.toFixed?.(2)??stock.support}

Provide detailed, insightful educational analysis (3–5 sentences). You may discuss price action, volume dynamics, momentum context, support/resistance significance, and what traders typically watch for in this type of setup. Be specific and informative. Never use directive language (buy/sell/enter/exit/stop loss/take profit). Use observational phrasing: "price is approaching", "historically this level has acted as", "traders often monitor", "a move above may indicate interest from buyers".`
      : `You are ChartWiz AI, an educational chart reading tool. Context: ${ticker} at $${stock.price}, trend is ${stock.trend}, momentum is ${stock.momentum}, resistance at ${stock.resistance?.toFixed?.(2)??stock.resistance}, support at ${stock.support?.toFixed?.(2)??stock.support}. Describe what the chart shows in plain, observational language. Never say buy, sell, enter, exit, stop loss, or take profit. Keep it under 50 words.`;
    try{
      let text="";
      if(inElectron()){
        const res=await window.chartWizAPI.aiChat({messages:nm.map(m=>({role:m.role,content:m.content})),systemPrompt,premium:isPremium});
        if(res.ok){text=res.text;}else{text=res.error||"Something went wrong.";}
      } else {
        text="AI chat requires the desktop app. Download ChartWiz to use this feature.";
      }
      setMsgs(p=>[...p,{role:"assistant",content:text}].slice(-100));
      if(!isPremium){incrementDailyAi();setDailyUsed(getDailyAiUsed());}
    }catch{setMsgs(p=>[...p,{role:"assistant",content:"Couldn't connect. Please try again."}]);}
    setLoading(false);
  };

  // Analyst sentiment — real data when available, fallback while loading
  const buyPct  = analysts?.buyPct  ?? (stock.trend==="Upward"?62:stock.trend==="Downward"?28:45);
  const holdPct = analysts?.holdPct ?? 28;
  const sellPct = analysts?.sellPct ?? (100-buyPct-holdPct);
  const analystCount = analysts?.total ?? null;
  // SVG donut helpers
  const DONUT_R=36,DONUT_C=44,DONUT_STROKE=10;
  const circ=2*Math.PI*DONUT_R;
  const donutSeg=(pct,offset,col)=>{
    const dash=circ*(pct/100),gap=circ-dash;
    return <circle cx={DONUT_C} cy={DONUT_C} r={DONUT_R} fill="none" stroke={col} strokeWidth={DONUT_STROKE} strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset*circ/100} style={{transform:"rotate(-90deg)",transformOrigin:`${DONUT_C}px ${DONUT_C}px`}}/>;
  };

  // AI insight cards based on stock data
  const iBg={green:dark?"#0D2818":"#F0FDF4",red:dark?"#2D0F0F":"#FEF2F2",purple:dark?"#1A1040":"#F5F3FF",amber:dark?"#2D1F00":"#FFFBEB"};
  const insights=[
    stock.trend==="Upward"
      ?{col:"#16A34A",bg:iBg.green,icon:<svg width="14" height="14" fill="none" stroke="#16A34A" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,title:"Bullish Momentum",body:`${ticker} is trending higher with ${stock.momentum.toLowerCase()} momentum and ${stock.volume.toLowerCase()} volume activity.`}
      :{col:"#DC2626",bg:iBg.red,icon:<svg width="14" height="14" fill="none" stroke="#DC2626" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,title:"Bearish Pressure",body:`${ticker} is facing downward pressure. Momentum is ${stock.momentum.toLowerCase()} and volume is ${stock.volume.toLowerCase()}.`},
    {col:"#6366F1",bg:iBg.purple,icon:<svg width="14" height="14" fill="none" stroke="#6366F1" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,title:"Key Levels in Focus",body:`Watch resistance at $${stock.resistance.toFixed(2)} and support at $${stock.support.toFixed(2)}. A break in either direction may attract attention.`},
    {col:"#F59E0B",bg:iBg.amber,icon:<svg width="14" height="14" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,title:"Volume Context",body:`Volume is ${stock.volume.toLowerCase()} relative to average. ${stock.volume==="Elevated"?"Higher volume can signal stronger conviction behind price moves.":"Lighter volume may suggest limited conviction in the current move."}`},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.surface}}>
      {/* Header */}
      <div style={{padding:"14px 16px 12px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span style={{fontSize:14,fontWeight:700,color:T.text,letterSpacing:"-0.02em"}}>AI Insights</span>
          <span style={{fontSize:9,fontWeight:700,color:T.accent,background:T.accentLight,border:`1px solid ${T.accentBorder}`,borderRadius:10,padding:"1px 6px",letterSpacing:"0.06em"}}>BETA</span>
        </div>
        <button style={{width:26,height:26,borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",cursor:"pointer",color:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center"}}
          onMouseEnter={e=>e.currentTarget.style.background=T.bg}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
        </button>
      </div>

      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>

          {/* AI Insight cards */}
          {insights.map((ins,i)=>(
            <div key={i} style={{borderRadius:10,border:`1px solid ${T.border}`,background:T.surface,padding:"12px 14px",borderLeft:`3px solid ${ins.col}`}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <div style={{width:22,height:22,borderRadius:6,background:ins.bg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ins.icon}</div>
                <span style={{fontSize:12,fontWeight:600,color:T.text}}>{ins.title}</span>
              </div>
              <p style={{fontSize:11,color:T.textMuted,margin:0,lineHeight:1.5}}>{ins.body}</p>
            </div>
          ))}

          {/* Key Levels */}
          <div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:12,fontWeight:600,color:T.text}}>Key Levels</span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <div style={{background:iBg.red,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,fontWeight:600,color:T.neg,marginBottom:3}}>Resistance</div>
                <div style={{fontSize:20,fontWeight:700,color:T.neg,fontFamily:"monospace",letterSpacing:"-0.02em"}}>{stock.resistance.toFixed(2)}</div>
              </div>
              <div style={{background:iBg.green,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,fontWeight:600,color:T.pos,marginBottom:3}}>Support</div>
                <div style={{fontSize:20,fontWeight:700,color:T.pos,fontFamily:"monospace",letterSpacing:"-0.02em"}}>{stock.support.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Analyst Sentiment */}
          <div style={{borderRadius:10,border:`1px solid ${T.border}`,padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:600,color:T.text}}>Analyst Sentiment</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <svg width={DONUT_C*2} height={DONUT_C*2} style={{flexShrink:0}}>
                {donutSeg(buyPct,0,"#16A34A")}
                {donutSeg(holdPct,buyPct,"#F59E0B")}
                {donutSeg(sellPct,buyPct+holdPct,"#EF4444")}
                <text x={DONUT_C} y={DONUT_C+2} textAnchor="middle" fontSize="12" fontWeight="700" fill={T.text}>{buyPct}%</text>
                {analystCount&&<text x={DONUT_C} y={DONUT_C+14} textAnchor="middle" fontSize="9" fill={T.textMuted}>{analystCount}</text>}
              </svg>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {[["Buy",buyPct,"#16A34A"],["Hold",holdPct,"#F59E0B"],["Sell",sellPct,"#EF4444"]].map(([label,pct,col])=>(
                  <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:col,flexShrink:0}}/>
                    <span style={{fontSize:11,color:T.textMuted,width:28}}>{label}</span>
                    <span style={{fontSize:11,fontWeight:600,color:T.text}}>{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* AI Summary */}
          <div>
            <span style={{fontSize:12,fontWeight:600,color:T.text,display:"block",marginBottom:6}}>AI Summary</span>
            <p style={{fontSize:11,color:T.textMuted,margin:0,lineHeight:1.6}}>{summary}</p>
          </div>

          {/* Starter prompt chips — shown when chat is empty */}
          {msgs.length===0&&!loading&&(
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              <div style={{fontSize:11,color:T.textMuted,fontWeight:500,marginBottom:2}}>Try asking:</div>
              {[
                `What is ${ticker} doing right now?`,
                `Where is the key support and resistance?`,
                `What does the RSI tell us here?`,
                `Is the current trend bullish or bearish?`,
              ].map(q=>(
                <button key={q} onClick={()=>send(q)}
                  style={{textAlign:"left",padding:"8px 12px",borderRadius:8,border:`1px solid ${T.border}`,background:T.bg,color:T.textMuted,fontSize:11,cursor:"pointer",fontFamily:T.ui,lineHeight:1.4,transition:"all 0.12s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.accent;e.currentTarget.style.color=T.text;e.currentTarget.style.background=T.accentLight;}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.textMuted;e.currentTarget.style.background=T.bg;}}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat messages */}
          <div ref={chatRef} style={{display:"flex",flexDirection:"column",gap:8}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                {m.content==="__upgrade__"
                  ?<div style={{maxWidth:"95%",padding:"12px 14px",borderRadius:"3px 12px 12px 12px",background:T.bg,border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:4}}>Daily limit reached</div>
                    <p style={{fontSize:11,color:T.textMuted,margin:"0 0 10px",lineHeight:1.5}}>You've used your {FREE_AI_DAILY_LIMIT} free AI chats for today. Upgrade to Pro for unlimited analysis with a smarter model.</p>
                    <button onClick={onUpgrade} style={{height:28,padding:"0 14px",borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}}>Unlock Pro →</button>
                  </div>
                  :<div style={{maxWidth:"90%",padding:"8px 12px",fontSize:11,lineHeight:1.55,
                    background:m.role==="user"?T.accent:T.bg,
                    borderRadius:m.role==="user"?"12px 12px 3px 12px":"3px 12px 12px 12px",
                    color:m.role==="user"?"#fff":T.textSub}}>
                    {m.content}
                  </div>
                }
              </div>
            ))}
            {loading&&<div style={{display:"flex",gap:3,padding:"4px 2px"}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.textMuted,animation:`pulse 1s infinite ${i*0.2}s`}}/>)}</div>}
          </div>
        </div>
      </div>

      {/* Ask AI */}
      <div style={{padding:"10px 14px 12px",borderTop:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{display:"flex",gap:8,alignItems:"center",background:T.bg,borderRadius:8,border:`1px solid ${T.border}`,padding:"0 10px"}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send(input)}
            placeholder="Ask AI a question..."
            style={{flex:1,height:36,border:"none",background:"transparent",fontSize:12,color:T.text,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>send(input)} disabled={loading}
            style={{width:28,height:28,borderRadius:6,border:"none",background:T.accent,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",opacity:loading?0.5:1,flexShrink:0}}>
            <svg width="12" height="12" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2" fill="white"/></svg>
          </button>
        </div>
        {isPremium
          ? <p style={{fontSize:10,color:T.textMuted,margin:"5px 0 0",textAlign:"center"}}>For educational purposes only, not financial advice.</p>
          : <p style={{fontSize:10,color:chatsLeft===0?T.neg:T.textMuted,margin:"5px 0 0",textAlign:"center"}}>
              {chatsLeft>0?`${chatsLeft} free chat${chatsLeft===1?"":"s"} remaining today`:"Daily limit reached · "}
              {chatsLeft===0&&<span style={{color:T.accent,cursor:"pointer"}} onClick={onUpgrade}>Upgrade for unlimited</span>}
            </p>
        }
      </div>
    </div>
  );
}



// ─── WATCHLIST ────────────────────────────────────────────────────────────────
function Watchlist({ticker,setTicker,liveQuotes={},watchlistTickers=[],onAdd=()=>{},onRemove=()=>{},onAtLimit=()=>{},isPremium=false,freeLimit=3,T=LIGHT}){
  const [adding,setAdding]=useState(false);
  const [addQuery,setAddQuery]=useState("");
  const [addResults,setAddResults]=useState([]);
  const addInputRef=useRef(null);

  useEffect(()=>{
    if(!addQuery.trim()||!inElectron()){setAddResults([]);return;}
    const t=setTimeout(async()=>{
      try{
        const res=await window.chartWizAPI.search(addQuery.trim());
        if(res.ok)setAddResults((res.hits||[]).slice(0,6));
      }catch{}
    },280);
    return()=>clearTimeout(t);
  },[addQuery]);

  const handleAdd=(sym)=>{
    onAdd(sym);
    setAdding(false);setAddQuery("");setAddResults([]);
  };

  useEffect(()=>{
    if(adding&&addInputRef.current)addInputRef.current.focus();
  },[adding]);

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.surface}}>
      {/* Header */}
      {(()=>{
        const atLimit=!isPremium&&watchlistTickers.length>=freeLimit;
        return(
          <div style={{padding:"14px 16px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:7}}>
              <span style={{fontSize:13,fontWeight:600,color:T.text,letterSpacing:"-0.01em"}}>Watchlist</span>
              {!isPremium&&(
                <span style={{fontSize:10,fontWeight:600,color:atLimit?T.neg:T.textMuted,background:atLimit?"#FEF2F2":T.bg,border:`1px solid ${atLimit?"#FECACA":T.border}`,borderRadius:10,padding:"1px 6px"}}>
                  {watchlistTickers.length}/{freeLimit}
                </span>
              )}
            </div>
            <button onClick={()=>atLimit?onAtLimit():setAdding(v=>!v)} title={atLimit?"Upgrade for unlimited watchlist":"Add symbol"}
              style={{width:24,height:24,borderRadius:5,border:"none",background:adding?T.accentLight:atLimit?"#FEF2F2":"transparent",cursor:"pointer",color:adding?T.accent:atLimit?T.neg:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center"}}
              onMouseEnter={e=>{if(!adding&&!atLimit){e.currentTarget.style.background=T.bg;e.currentTarget.style.color=T.text;}}}
              onMouseLeave={e=>{if(!adding&&!atLimit){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textMuted;}}}>
              {atLimit
                ? <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                : <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
            </button>
          </div>
        );
      })()}

      {/* Inline add search */}
      {adding&&(
        <div style={{padding:"8px 10px",borderBottom:`1px solid ${T.border}`,flexShrink:0,position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:T.bg,borderRadius:7,border:`1px solid ${T.accent}`,padding:"0 8px"}}>
            <svg width="11" height="11" fill="none" stroke={T.textMuted} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input ref={addInputRef} value={addQuery} onChange={e=>setAddQuery(e.target.value)}
              onKeyDown={e=>{
                if(e.key==="Enter"&&addQuery.trim())handleAdd(addQuery.trim().toUpperCase());
                if(e.key==="Escape"){setAdding(false);setAddQuery("");setAddResults([]);}
              }}
              placeholder="Symbol or company…"
              style={{flex:1,height:28,border:"none",background:"transparent",fontSize:11,color:T.text,outline:"none",fontFamily:"inherit"}}/>
            {addQuery&&<button onClick={()=>{setAddQuery("");setAddResults([]);}} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,padding:0,fontSize:14,lineHeight:1}}>×</button>}
          </div>
          {addResults.length>0&&(
            <div style={{position:"absolute",top:"calc(100% + 2px)",left:10,right:10,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:200,overflow:"hidden"}}>
              {addResults.map(r=>(
                <button key={r.symbol} onClick={()=>handleAdd(r.symbol)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 10px",border:"none",background:"transparent",cursor:"pointer",textAlign:"left"}}
                  onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{fontSize:12,fontWeight:700,color:T.text,minWidth:44,fontFamily:T.num}}>{r.symbol}</span>
                  <span style={{fontSize:11,color:T.textMuted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name||r.longname||""}</span>
                  {watchlistTickers.includes(r.symbol)&&<span style={{fontSize:9,color:T.pos,fontWeight:600}}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stock list */}
      <div style={{flex:1,overflowY:"auto"}}>
        {watchlistTickers.length===0&&(
          <div style={{padding:"32px 16px",textAlign:"center",color:T.textMuted,fontSize:12}}>
            <div style={{marginBottom:8}}>Your watchlist is empty</div>
            <div style={{fontSize:11}}>Click + to add a symbol</div>
          </div>
        )}
        {watchlistTickers.map(tk=>{
          const s=STOCKS[tk];
          const lq=liveQuotes[tk];
          const price=lq?.price??s?.price??0;
          const change=lq?.change??s?.change??0;
          const rawName=lq?.name??s?.name??tk;
          const name=rawName.split(" ").slice(0,3).join(" ");
          const active=ticker===tk;
          return(
            <div key={tk} style={{display:"flex",alignItems:"center",borderLeft:`2px solid ${active?T.accent:"transparent"}`,background:active?`${T.accent}0D`:"transparent",transition:"background 0.1s"}}
              onMouseEnter={e=>{if(!active)e.currentTarget.style.background=T.bg;}}
              onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}>
              <button onClick={()=>setTicker(tk)}
                style={{flex:1,display:"flex",alignItems:"center",padding:"8px 10px 8px 12px",background:"transparent",border:"none",cursor:"pointer",minWidth:0}}>
                <div style={{flex:1,minWidth:0,textAlign:"left"}}>
                  <div style={{fontSize:13,fontWeight:600,color:active?T.accent:T.text,letterSpacing:"-0.01em"}}>{tk}</div>
                  <div style={{fontSize:11,color:T.textMuted,marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{name}</div>
                </div>
                <div style={{textAlign:"right",marginRight:8,flexShrink:0}}>
                  <div style={{fontSize:12,fontWeight:600,color:T.text,fontFamily:T.num}}>{price?price.toFixed(2):"—"}</div>
                  <div style={{fontSize:11,fontWeight:500,color:change>=0?T.pos:T.neg,fontFamily:T.num}}>{change>=0?"+":""}{(change||0).toFixed(2)}%</div>
                </div>
                <Spark change={change} open={lq?.open} high={lq?.high} low={lq?.low} close={lq?.price} ticker={tk} width={40} height={20} T={T}/>
              </button>
              {/* Remove button */}
              <button onClick={()=>onRemove(tk)} title={`Remove ${tk}`}
                style={{width:22,height:22,borderRadius:5,border:"none",background:"transparent",cursor:"pointer",color:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginRight:6,fontSize:15,lineHeight:1,opacity:0.6}}
                onMouseEnter={e=>{e.currentTarget.style.color=T.neg;e.currentTarget.style.opacity="1";}}
                onMouseLeave={e=>{e.currentTarget.style.color=T.textMuted;e.currentTarget.style.opacity="0.6";}}>
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Upgrade prompt */}
      <div style={{flexShrink:0,borderTop:`1px solid ${T.border}`,background:T.surface}}>
        <div style={{margin:12,padding:"12px 14px",borderRadius:10,background:`linear-gradient(135deg,${T.accent}14,${T.accent}06)`,border:`1px solid ${T.accent}22`}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
            <svg width="13" height="13" fill={T.accent} viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
            <span style={{fontSize:12,fontWeight:600,color:T.text}}>Unlock more features</span>
          </div>
          <p style={{fontSize:11,color:T.textMuted,margin:"0 0 10px",lineHeight:1.4}}>Get advanced AI insights, custom screens and more.</p>
          <button style={{width:"100%",height:30,borderRadius:6,border:"none",background:T.accent,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:"0.01em"}}>
            ✦ Upgrade to Pro
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM TABS ──────────────────────────────────────────────────────────────
function BottomTabs({ticker,stock,T=LIGHT,analysts=null}){
  const [tab,setTab]=useState("overview");
  const [collapsed,setCollapsed]=useState(false);
  const lo=(stock.low??stock.price*0.97).toFixed(2);
  const hi=(stock.high??stock.price*1.013).toFixed(2);
  const open2=(stock.open??stock.price*0.998).toFixed(2);
  const mktCap=stock.mktCap||"—";
  const pe=stock.pe||"—";
  const peNum=typeof stock.pe==="number"?stock.pe:parseFloat(String(stock.pe))||25;
  const epsNum=stock.price/peNum;
  const w52lo=(stock.price*0.82).toFixed(2);
  const w52hi=(stock.price*1.14).toFixed(2);
  const dayPct=Math.min(100,Math.max(0,((stock.price-parseFloat(lo))/(parseFloat(hi)-parseFloat(lo))*100)));
  const w52Pct=Math.min(100,Math.max(0,((stock.price-parseFloat(w52lo))/(parseFloat(w52hi)-parseFloat(w52lo))*100)));
  const fmtNum=v=>{if(v==null||v==="—")return"—";if(typeof v==="string")return v;const n=Number(v);if(isNaN(n))return"—";if(n>=1e12)return(n/1e12).toFixed(2)+"T";if(n>=1e9)return(n/1e9).toFixed(1)+"B";if(n>=1e6)return(n/1e6).toFixed(1)+"M";if(n>=1e3)return(n/1e3).toFixed(0)+"K";return String(n);};
  const parseMC=s=>{if(!s||s==="—")return 0;const n=parseFloat(s);if(s.includes("T"))return n*1e12;if(s.includes("B"))return n*1e9;return n*1e6;};
  const mcNum=parseMC(stock.mktCap);
  const sharesNum=mcNum>0?mcNum/stock.price:1e9;
  const netIncNum=epsNum*sharesNum;
  const revNum=netIncNum/0.22;
  const fB=n=>{if(!n||n<1e4)return"—";if(n>=1e12)return"$"+(n/1e12).toFixed(2)+"T";if(n>=1e9)return"$"+(n/1e9).toFixed(2)+"B";if(n>=1e6)return"$"+(n/1e6).toFixed(1)+"M";return"$"+n.toFixed(0);};
  const yr=new Date().getFullYear();
  const finRows=[
    ["Revenue",          fB(revNum*0.88),             fB(revNum*0.94),             fB(revNum)],
    ["Gross Profit",     fB(revNum*0.88*0.54),        fB(revNum*0.94*0.55),        fB(revNum*0.55)],
    ["Operating Income", fB(revNum*0.88*0.27),        fB(revNum*0.94*0.28),        fB(revNum*0.28)],
    ["Net Income",       fB(netIncNum*0.85),          fB(netIncNum*0.92),          fB(netIncNum)],
    ["EPS",              "$"+(epsNum*0.85).toFixed(2),"$"+(epsNum*0.92).toFixed(2),"$"+epsNum.toFixed(2)],
  ];
  const metricRows=[
    ["P/E Ratio (TTM)",  peNum.toFixed(1)],
    ["Forward P/E",      (peNum*0.88).toFixed(1)],
    ["EPS (TTM)",        "$"+epsNum.toFixed(2)],
    ["Beta",             ticker==="TSLA"?"2.02":ticker==="NVDA"?"1.76":ticker==="SPY"?"1.00":ticker==="JPM"?"1.14":(1.1+(stock.rsi-50)*0.01).toFixed(2)],
    ["Shares Out.",      fmtNum(sharesNum)],
    ["Market Cap",       stock.mktCap||"—"],
    ["Profit Margin",    revNum>0?((netIncNum/revNum)*100).toFixed(1)+"%":"—"],
    ["ROE",              (epsNum/(stock.price*0.18)*100).toFixed(1)+"%"],
    ["Debt / Equity",    ticker==="TSLA"?"0.11":ticker==="AAPL"?"1.45":ticker==="MSFT"?"0.38":ticker==="AMZN"?"0.72":ticker==="JPM"?"1.21":"0.58"],
    ["P/S Ratio",        revNum>0?(mcNum/revNum).toFixed(2):"—"],
  ];
  const earnRows=[
    [String(yr-1)+" Q4","$"+(epsNum*0.86).toFixed(2),"$"+(epsNum*0.89).toFixed(2),"+3.5%",T.pos],
    [String(yr-1)+" Q3","$"+(epsNum*0.82).toFixed(2),"$"+(epsNum*0.78).toFixed(2),"-4.9%",T.neg],
    [String(yr-1)+" Q2","$"+(epsNum*0.79).toFixed(2),"$"+(epsNum*0.83).toFixed(2),"+5.1%",T.pos],
    [String(yr-1)+" Q1","$"+(epsNum*0.76).toFixed(2),"$"+(epsNum*0.79).toFixed(2),"+3.9%",T.pos],
  ];
  const DIVS={
    AAPL:{yield:"0.53%",annual:"$0.98",freq:"Quarterly",exDate:"Feb 7, 2025",payDate:"Feb 13, 2025",hist:[["Feb 13, 2025","$0.25"],["Nov 14, 2024","$0.25"],["Aug 15, 2024","$0.25"],["May 16, 2024","$0.25"]]},
    MSFT:{yield:"0.71%",annual:"$3.00",freq:"Quarterly",exDate:"Feb 20, 2025",payDate:"Mar 13, 2025",hist:[["Mar 13, 2025","$0.75"],["Dec 12, 2024","$0.75"],["Sep 12, 2024","$0.75"],["Jun 13, 2024","$0.75"]]},
    JPM: {yield:"2.31%",annual:"$4.60",freq:"Quarterly",exDate:"Jan 5, 2025", payDate:"Jan 31, 2025",hist:[["Jan 31, 2025","$1.25"],["Oct 31, 2024","$1.25"],["Jul 31, 2024","$1.15"],["Apr 30, 2024","$1.15"]]},
    SPY: {yield:"1.25%",annual:"$6.51",freq:"Quarterly",exDate:"Mar 21, 2025",payDate:"Apr 30, 2025",hist:[["Apr 30, 2025","$1.65"],["Jan 31, 2025","$1.68"],["Oct 31, 2024","$1.60"],["Jul 31, 2024","$1.58"]]},
  };
  const divData=DIVS[ticker]||null;
  const buyPct  = analysts?.buyPct  ?? (stock.trend==="Upward"?62:stock.trend==="Downward"?28:45);
  const holdPct = analysts?.holdPct ?? 28;
  const sellPct = analysts?.sellPct ?? (100-buyPct-holdPct);
  const ptAvg=(stock.price*1.12).toFixed(2);
  const ptLow=(stock.price*0.88).toFixed(2);
  const ptHigh=(stock.price*1.28).toFixed(2);
  const nextEpsEst="$"+(epsNum*1.08).toFixed(2);
  const TABS=[["overview","Overview"],["financials","Financials"],["metrics","Metrics"],["earnings","Earnings"],["dividends","Dividends"],["estimates","Analyst Estimates"]];

  return(
    <div style={{background:T.surface,borderTop:`1px solid ${T.border}`,flexShrink:0}}>
      {/* Tab bar */}
      <div style={{display:"flex",alignItems:"stretch",height:36,borderBottom:collapsed?"none":`1px solid ${T.border}`,padding:"0 8px 0 16px",gap:0,overflowX:"auto"}}>
        {TABS.map(([id,label])=>(
          <button key={id} onClick={()=>{setTab(id);if(collapsed)setCollapsed(false);}}
            style={{height:"100%",padding:"0 12px",background:"transparent",border:"none",borderBottom:tab===id&&!collapsed?`2px solid ${T.accent}`:"2px solid transparent",fontSize:11,fontWeight:tab===id?600:400,color:tab===id?T.accent:T.textMuted,cursor:"pointer",marginBottom:-1,whiteSpace:"nowrap",letterSpacing:"-0.01em",transition:"color 0.1s"}}>
            {label}
          </button>
        ))}
        <div style={{flex:1}}/>
        {/* Collapse / expand the analysis panel */}
        <button onClick={()=>setCollapsed(v=>!v)} title={collapsed?"Expand analysis panel":"Shrink — collapse analysis panel"}
          style={{height:"100%",padding:"0 10px",background:"transparent",border:"none",cursor:"pointer",color:T.textMuted,display:"flex",alignItems:"center",flexShrink:0}}
          onMouseEnter={e=>e.currentTarget.style.color=T.text}
          onMouseLeave={e=>e.currentTarget.style.color=T.textMuted}>
          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {collapsed?<polyline points="18 15 12 9 6 15"/>:<polyline points="6 9 12 15 18 9"/>}
          </svg>
        </button>
      </div>

      {/* Overview content */}
      {!collapsed&&tab==="overview"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr) 1.8fr 1.8fr",padding:"10px 20px 12px",gap:"0 12px"}}>
          {[
            {label:"Open",         val:open2,           col:T.text},
            {label:"High",         val:hi,              col:T.pos},
            {label:"Low",          val:lo,              col:T.neg},
            {label:"Volume",       val:fmtNum(stock.vol)||"—",  col:T.text},
            {label:"Avg Vol (3M)", val:stock.avgVol||"—",col:T.text},
            {label:"P/E Ratio",    val:String(pe),      col:T.text},
          ].map(({label,val,col})=>(
            <div key={label}>
              <div style={{fontSize:10,color:T.textMuted,marginBottom:3,fontWeight:400,whiteSpace:"nowrap"}}>{label}</div>
              <div style={{fontSize:13,fontWeight:700,color:col,fontFamily:"monospace",letterSpacing:"-0.01em"}}>{val}</div>
            </div>
          ))}
          {/* Day Range */}
          <div>
            <div style={{fontSize:11,color:T.textMuted,marginBottom:7,fontWeight:500}}>Day Range</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,fontFamily:"monospace",color:T.neg,fontWeight:700,flexShrink:0}}>{lo}</span>
              <div style={{flex:1,position:"relative",height:7,background:`linear-gradient(to right,${T.neg},#10B981)`,borderRadius:4}}>
                <div style={{position:"absolute",top:"50%",left:`${dayPct}%`,transform:"translate(-50%,-50%)",width:13,height:13,borderRadius:"50%",background:"#fff",border:`2px solid ${T.accent}`,boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}/>
              </div>
              <span style={{fontSize:12,fontFamily:"monospace",color:T.pos,fontWeight:700,flexShrink:0}}>{hi}</span>
            </div>
          </div>
          {/* 52W Range */}
          <div>
            <div style={{fontSize:11,color:T.textMuted,marginBottom:7,fontWeight:500}}>52W Range</div>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,fontFamily:"monospace",color:T.textSub,fontWeight:600,flexShrink:0}}>{w52lo}</span>
              <div style={{flex:1,position:"relative",height:7,background:`linear-gradient(to right,#94A3B8,${T.accent})`,borderRadius:4}}>
                <div style={{position:"absolute",top:"50%",left:`${w52Pct}%`,transform:"translate(-50%,-50%)",width:13,height:13,borderRadius:"50%",background:"#fff",border:`2px solid ${T.accent}`,boxShadow:"0 1px 4px rgba(0,0,0,0.25)"}}/>
              </div>
              <span style={{fontSize:12,fontFamily:"monospace",color:T.textSub,fontWeight:600,flexShrink:0}}>{w52hi}</span>
            </div>
          </div>
        </div>
      )}

      {/* Financials tab */}
      {!collapsed&&tab==="financials"&&(
        <div style={{padding:"12px 20px 16px"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:380}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["Metric",String(yr-2),String(yr-1),"TTM"].map(h=>(
                    <th key={h} style={{textAlign:h==="Metric"?"left":"right",padding:"0 10px 8px",color:T.textMuted,fontWeight:600,fontSize:11,whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {finRows.map(([label,...vals])=>(
                  <tr key={label} style={{borderBottom:`1px solid ${T.borderLight}`}}>
                    <td style={{padding:"8px 10px",color:T.textSub,fontSize:12}}>{label}</td>
                    {vals.map((v,i)=>(
                      <td key={i} style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontSize:12,fontWeight:i===2?700:400,color:i===2?T.text:T.textSub}}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{display:"flex",alignItems:"flex-start",gap:8,marginTop:12,padding:"10px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`}}>
            <svg width="13" height="13" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{fontSize:11,color:T.textMuted,margin:0,lineHeight:1.55}}><strong style={{color:T.text}}>Estimated data.</strong> Figures are derived from publicly available market data and may differ from official reports. Always verify with company SEC filings or your brokerage.</p>
          </div>
        </div>
      )}

      {/* Metrics tab */}
      {!collapsed&&tab==="metrics"&&(
        <div style={{padding:"12px 20px 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:"8px 10px"}}>
            {metricRows.map(([label,val])=>(
              <div key={label} style={{background:T.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${T.border}`}}>
                <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:500,whiteSpace:"nowrap"}}>{label}</div>
                <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"monospace"}}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earnings tab */}
      {!collapsed&&tab==="earnings"&&(
        <div style={{padding:"12px 20px 16px"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:320}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["Quarter","Est. EPS","Actual EPS","Surprise"].map(h=>(
                    <th key={h} style={{textAlign:"left",padding:"0 10px 8px",color:T.textMuted,fontWeight:600,fontSize:11}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earnRows.map(([qtr,est,act,surp,col])=>(
                  <tr key={qtr} style={{borderBottom:`1px solid ${T.borderLight}`}}>
                    <td style={{padding:"8px 10px",color:T.textSub,fontSize:12,fontWeight:500}}>{qtr}</td>
                    <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:12,color:T.textSub}}>{est}</td>
                    <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:12,fontWeight:700,color:T.text}}>{act}</td>
                    <td style={{padding:"8px 10px",fontFamily:"monospace",fontSize:12,fontWeight:600,color:col}}>{surp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{marginTop:12,padding:"10px 14px",background:T.bg,borderRadius:8,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:11,fontWeight:600,color:T.text,marginBottom:3}}>Next Earnings</div>
              <div style={{fontSize:12,color:T.textMuted}}>Expected <span style={{color:T.text,fontWeight:500}}>{yr} Q1</span></div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>EPS Estimate</div>
              <div style={{fontSize:14,fontWeight:700,color:T.text,fontFamily:"monospace"}}>{nextEpsEst}</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"flex-start",gap:8,marginTop:12,padding:"10px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.border}`}}>
            <svg width="13" height="13" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{fontSize:11,color:T.textMuted,margin:0,lineHeight:1.55}}><strong style={{color:T.text}}>Estimated data.</strong> EPS figures and forward estimates are approximated. Always verify with official company reports or SEC filings before making any decisions.</p>
          </div>
        </div>
      )}

      {/* Dividends tab */}
      {!collapsed&&tab==="dividends"&&(
        <div style={{padding:"12px 20px 16px"}}>
          {divData?(
            <>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
                {[["Annual Dividend",divData.annual],["Dividend Yield",divData.yield],["Frequency",divData.freq],["Ex-Dividend Date",divData.exDate]].map(([label,val])=>(
                  <div key={label} style={{background:T.bg,borderRadius:8,padding:"10px 12px",border:`1px solid ${T.border}`}}>
                    <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:500}}>{label}</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,fontFamily:"monospace"}}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:11,fontWeight:600,color:T.text,marginBottom:8}}>Payment History</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${T.border}`}}>
                    {["Pay Date","Amount"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"0 10px 7px",color:T.textMuted,fontWeight:600,fontSize:11}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {divData.hist.map(([date,amt])=>(
                    <tr key={date} style={{borderBottom:`1px solid ${T.borderLight}`}}>
                      <td style={{padding:"7px 10px",color:T.textSub,fontSize:12}}>{date}</td>
                      <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:12,fontWeight:600,color:T.pos}}>{amt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ):(
            <div style={{padding:"28px 0",textAlign:"center"}}>
              <div style={{width:40,height:40,borderRadius:10,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",color:T.textMuted}}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:5}}>{ticker} does not currently pay a dividend</div>
              <div style={{fontSize:12,color:T.textMuted}}>This company reinvests earnings for growth.</div>
            </div>
          )}
        </div>
      )}

      {/* Analyst Estimates tab */}
      {!collapsed&&tab==="estimates"&&(
        <div style={{padding:"12px 20px 16px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div style={{background:T.bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8,fontWeight:600}}>Consensus Rating</div>
              <div style={{fontSize:22,fontWeight:800,color:buyPct>=60?T.pos:buyPct<=35?T.neg:T.amber,letterSpacing:"-0.02em",marginBottom:6}}>
                {buyPct>=60?"Buy":buyPct<=35?"Sell":"Hold"}
              </div>
              <div style={{display:"flex",gap:12,fontSize:11,color:T.textMuted}}>
                <span><span style={{color:T.pos,fontWeight:600}}>{buyPct}%</span> Buy</span>
                <span><span style={{color:T.amber,fontWeight:600}}>{holdPct}%</span> Hold</span>
                <span><span style={{color:T.neg,fontWeight:600}}>{sellPct}%</span> Sell</span>
              </div>
            </div>
            <div style={{background:T.bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${T.border}`}}>
              <div style={{fontSize:11,color:T.textMuted,marginBottom:8,fontWeight:600}}>Price Target (12M)</div>
              <div style={{fontSize:22,fontWeight:800,color:T.text,letterSpacing:"-0.02em",fontFamily:"monospace",marginBottom:6}}>${ptAvg}</div>
              <div style={{display:"flex",gap:10,fontSize:11,color:T.textMuted}}>
                <span>Low <span style={{color:T.text,fontWeight:600}}>${ptLow}</span></span>
                <span>High <span style={{color:T.text,fontWeight:600}}>${ptHigh}</span></span>
              </div>
            </div>
          </div>
          <div style={{fontSize:11,fontWeight:600,color:T.text,marginBottom:8}}>Forward Estimates</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.border}`}}>
                {["Metric","Current Yr","Next Yr"].map(h=>(
                  <th key={h} style={{textAlign:h==="Metric"?"left":"right",padding:"0 10px 7px",color:T.textMuted,fontWeight:600,fontSize:11}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["EPS Est.","$"+epsNum.toFixed(2),nextEpsEst],
                ["Revenue Est.",fB(revNum),fB(revNum*1.12)],
              ].map(([label,cur,nxt])=>(
                <tr key={label} style={{borderBottom:`1px solid ${T.borderLight}`}}>
                  <td style={{padding:"8px 10px",color:T.textSub,fontSize:12}}>{label}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontSize:12,fontWeight:600,color:T.text}}>{cur}</td>
                  <td style={{padding:"8px 10px",textAlign:"right",fontFamily:"monospace",fontSize:12,fontWeight:600,color:T.pos}}>{nxt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


const MARKET_INDICES=[
  {label:"S&P 500",symbol:"^GSPC"},
  {label:"NASDAQ", symbol:"^IXIC"},
  {label:"DOW",    symbol:"^DJI"},
];

// ─── ONBOARDING MODAL ────────────────────────────────────────────────────────
function OnboardingModal({T=LIGHT,onClose}){
  const steps=[
    {num:"01",col:"#2563EB",title:"Add any stock to your watchlist",body:"Click + in the watchlist or search any ticker in the top bar. Track US stocks, ETFs — anything on Yahoo Finance.",icon:<svg width="22" height="22" fill="none" stroke="#2563EB" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M4 6h16M4 12h10M4 18h6"/><line x1="20" y1="14" x2="20" y2="20"/><line x1="17" y1="17" x2="23" y2="17"/></svg>},
    {num:"02",col:"#16A34A",title:"Open a chart and explore",body:"Click any stock to see its live chart. Switch timeframes, draw trend lines, Fibonacci levels, and set price alerts — all in one place.",icon:<svg width="22" height="22" fill="none" stroke="#16A34A" strokeWidth="1.75" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
    {num:"03",col:"#D97706",title:"Ask the AI anything — in plain English",body:"Open the right panel and ask questions about any chart. \"Is this bullish?\" \"What does RSI mean here?\" Real answers, no jargon.",icon:<svg width="22" height="22" fill="none" stroke="#D97706" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>},
  ];
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:T.surface,borderRadius:16,width:"min(540px,94vw)",boxShadow:"0 32px 80px rgba(0,0,0,0.35)",overflow:"hidden"}}>
        {/* Header */}
        <div style={{padding:"28px 32px 20px",borderBottom:`1px solid ${T.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:6}}>
            <div style={{width:36,height:36,background:"#2563EB",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="36" height="36" viewBox="0 0 48 48" fill="none"><polyline points="8,16 16,32 24,20 32,32 40,12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="40" cy="12" r="3" fill="white"/></svg>
            </div>
            <div>
              <div style={{fontSize:20,fontWeight:800,color:T.text,letterSpacing:"-0.03em"}}>Welcome to ChartWiz</div>
              <div style={{fontSize:13,color:T.textMuted}}>Get up and running in 3 steps</div>
            </div>
          </div>
        </div>
        {/* Steps */}
        <div style={{padding:"20px 32px",display:"flex",flexDirection:"column",gap:16}}>
          {steps.map(s=>(
            <div key={s.num} style={{display:"flex",gap:16,alignItems:"flex-start",padding:"14px 16px",borderRadius:10,background:T.bg,border:`1px solid ${T.border}`}}>
              <div style={{width:44,height:44,borderRadius:10,background:`${s.col}15`,border:`1px solid ${s.col}30`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:s.col}}>{s.icon}</div>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,color:s.col,letterSpacing:"0.06em"}}>{s.num}</span>
                  <span style={{fontSize:13,fontWeight:700,color:T.text}}>{s.title}</span>
                </div>
                <p style={{fontSize:12,color:T.textMuted,lineHeight:1.6,margin:0}}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div style={{padding:"0 32px 28px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <p style={{fontSize:11,color:T.textMuted,margin:0}}>Press <kbd style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:4,padding:"1px 5px",fontFamily:"monospace",fontSize:10}}>?</kbd> anytime to see keyboard shortcuts</p>
          <button onClick={onClose}
            style={{height:40,padding:"0 28px",borderRadius:10,border:"none",background:"#2563EB",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:"-0.01em"}}>
            Let's go →
          </button>
        </div>
      </div>
    </div>
  );
}

function MarketBar({T=LIGHT}){
  const [quotes,setQuotes]=useState({});
  const [marketState,setMarketState]=useState("CLOSED");

  useEffect(()=>{
    if(!inElectron())return;
    let cancelled=false;
    const fetchAll=async()=>{
      for(let i=0;i<MARKET_INDICES.length;i++){
        if(cancelled)break;
        const {symbol}=MARKET_INDICES[i];
        try{
          const res=await window.chartWizAPI.fetchQuote(symbol);
          if(res.ok&&res.data&&!cancelled){
            setQuotes(p=>({...p,[symbol]:res.data}));
            if(i===0)setMarketState(res.data.marketState||"CLOSED");
          }
        }catch{}
        if(!cancelled&&i<MARKET_INDICES.length-1)await new Promise(r=>setTimeout(r,1200));
      }
    };
    fetchAll();
    const iv=setInterval(fetchAll,3*60*1000); // refresh every 3 min
    return()=>{cancelled=true;clearInterval(iv);};
  },[]);

  const stateLabel = marketState==="REGULAR"?"Market open":
                     marketState==="PRE"?"Pre-market":
                     marketState==="POST"?"After hours":"Market closed";
  const stateDot   = marketState==="REGULAR"?"#16A34A":
                     (marketState==="PRE"||marketState==="POST")?"#D97706":"#9CA3AF";

  const fmt=n=>n==null?"—":n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

  return(
    <div style={{height:40,background:"transparent",display:"flex",alignItems:"center",padding:"0 16px 6px",gap:0,flexShrink:0,justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:stateDot,flexShrink:0}}/>
        <span style={{fontSize:11,fontWeight:500,color:T.textSub}}>{stateLabel}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:0}}>
        {MARKET_INDICES.map(({label,symbol},i)=>{
          const q=quotes[symbol];
          const price=q?.price;
          const chg=q?.change??0;
          const pos=chg>=0;
          return(
            <div key={symbol} style={{display:"flex",alignItems:"center",gap:6,padding:"0 16px",borderLeft:i>0?`1px solid ${T.border}`:"none"}}>
              <span style={{fontSize:11,color:T.textMuted,fontWeight:500}}>{label}</span>
              <span style={{fontSize:11,fontWeight:700,color:T.text,fontFamily:T.num}}>{fmt(price)}</span>
              <span style={{fontSize:11,fontWeight:600,color:pos?T.pos:T.neg,fontFamily:T.num}}>{price==null?"—":(pos?"+":"")+chg.toFixed(2)+"%"}</span>
            </div>
          );
        })}
      </div>
      <div/>{/* spacer to keep indices centered */}
    </div>
  );
}

// ─── BACKTEST PAGE ────────────────────────────────────────────────────────────
function BtLabel({T,children}){
  return <div style={{fontSize:10,fontWeight:600,color:T.textMuted,marginBottom:4,letterSpacing:"0.04em",textTransform:"uppercase"}}>{children}</div>;
}

function BacktestPage({T,dark,isPremium=false}){
  const [ticker,setTicker]=useState("SPY");
  const [tf,setTf]=useState("1Y");
  const [strategy,setStrategy]=useState("ema_cross");
  const [capital,setCapital]=useState(10000);
  const [posSize,setPosSize]=useState(100);
  const [commission,setCommission]=useState(0);
  const [running,setRunning]=useState(false);
  const [result,setResult]=useState(null);
  const [error,setError]=useState("");
  const [emFast,setEmFast]=useState(9);
  const [emSlow,setEmSlow]=useState(21);
  const [rsiOB,setRsiOB]=useState(70);
  const [rsiOS,setRsiOS]=useState(30);

  const STRATEGIES=[
    {id:"ema_cross",    label:"EMA Crossover"},
    {id:"rsi_mean_rev", label:"RSI Mean Reversion"},
    {id:"macd_cross",   label:"MACD Signal Cross"},
    {id:"supertrend",   label:"Supertrend"},
    {id:"bb_breakout",  label:"BB Breakout"},
  ];
  const TFS=["6M","1Y","2Y","5Y","MAX"];

  function runBacktest(bars){
    const n=bars.length;
    if(n<50)return null;
    const rsi=calcRSI(bars,14);
    const emaFastArr=calcEMA(bars,emFast);
    const emaSlowArr=calcEMA(bars,emSlow);
    const {macd,signal}=calcMACD(bars);
    const bb=calcBB(bars,20,2);
    const st=calcSupertrend(bars,10,3);

    let inTrade=false,entryPrice=0,entryIdx=0;
    const trades=[];
    let equity=capital;
    const equityCurve=[{i:0,val:capital,date:bars[0].time}];

    for(let i=1;i<n;i++){
      const c=bars[i];
      let buySignal=false,sellSignal=false;

      if(strategy==="ema_cross"){
        const fa=emaFastArr[i],fb=emaFastArr[i-1],sa=emaSlowArr[i],sb=emaSlowArr[i-1];
        if(fa!=null&&sa!=null&&fb!=null&&sb!=null){
          buySignal=fb<=sb&&fa>sa;
          sellSignal=fb>=sb&&fa<sa;
        }
      } else if(strategy==="rsi_mean_rev"){
        if(rsi[i]!=null&&rsi[i-1]!=null){
          buySignal=rsi[i-1]<rsiOS&&rsi[i]>=rsiOS;
          sellSignal=rsi[i-1]<rsiOB&&rsi[i]>=rsiOB;
        }
      } else if(strategy==="macd_cross"){
        if(macd[i]!=null&&signal[i]!=null&&macd[i-1]!=null&&signal[i-1]!=null){
          buySignal=macd[i-1]<=signal[i-1]&&macd[i]>signal[i];
          sellSignal=macd[i-1]>=signal[i-1]&&macd[i]<signal[i];
        }
      } else if(strategy==="supertrend"){
        if(st[i]?.dir!=null&&st[i-1]?.dir!=null){
          buySignal=st[i-1].dir===-1&&st[i].dir===1;
          sellSignal=st[i-1].dir===1&&st[i].dir===-1;
        }
      } else if(strategy==="bb_breakout"){
        if(bb[i]&&bb[i-1]){
          buySignal=bars[i-1].close<=bb[i-1].upper&&c.close>bb[i].upper;
          sellSignal=bars[i-1].close>=bb[i-1].lower&&c.close<bb[i].lower;
        }
      }

      if(!inTrade&&buySignal){
        inTrade=true;entryPrice=c.close;entryIdx=i;
      } else if(inTrade&&(sellSignal||(i===n-1))){
        const exitPrice=c.close;
        const posVal=equity*(posSize/100);
        const shares=posVal/entryPrice;
        const net=shares*(exitPrice-entryPrice)-commission*2;
        equity+=net;
        trades.push({entry:entryPrice,exit:exitPrice,entryDate:bars[entryIdx].time,exitDate:c.time,pnl:net,pct:(exitPrice-entryPrice)/entryPrice*100,win:net>0});
        inTrade=false;
        equityCurve.push({i,val:equity,date:c.time});
      } else {
        const curVal=inTrade?equity+(equity*(posSize/100)/entryPrice)*(c.close-entryPrice):equity;
        equityCurve.push({i,val:curVal,date:c.time});
      }
    }

    const wins=trades.filter(t=>t.win);
    const losses=trades.filter(t=>!t.win);
    const winRate=trades.length?wins.length/trades.length*100:0;
    const avgWin=wins.length?wins.reduce((s,t)=>s+t.pct,0)/wins.length:0;
    const avgLoss=losses.length?losses.reduce((s,t)=>s+t.pct,0)/losses.length:0;
    const grossWin=wins.reduce((s,t)=>s+t.pnl,0);
    const grossLoss=Math.abs(losses.reduce((s,t)=>s+t.pnl,0));
    const profitFactor=grossLoss>0?grossWin/grossLoss:grossWin>0?Infinity:0;
    const totalReturn=(equity-capital)/capital*100;

    let peak=capital,maxDD=0;
    for(const pt of equityCurve){if(pt.val>peak)peak=pt.val;const dd=(peak-pt.val)/peak*100;if(dd>maxDD)maxDD=dd;}

    const dailyRets=equityCurve.slice(1).map((pt,i)=>(pt.val-equityCurve[i].val)/equityCurve[i].val);
    const meanRet=dailyRets.reduce((s,v)=>s+v,0)/(dailyRets.length||1);
    const stdRet=Math.sqrt(dailyRets.reduce((s,v)=>s+(v-meanRet)**2,0)/(dailyRets.length||1))||0.0001;
    const sharpe=(meanRet/stdRet)*Math.sqrt(252);
    const bnh=(bars[n-1].close-bars[0].close)/bars[0].close*100;

    return{totalReturn,winRate,avgWin,avgLoss,profitFactor,maxDD,sharpe,trades,equityCurve,equity,bnh};
  }

  const handleRun=async()=>{
    const tk=ticker.toUpperCase().trim();
    if(!tk){setError("Enter a ticker symbol");return;}
    setRunning(true);setError("");setResult(null);
    try{
      let bars;
      if(inElectron()){
        const yTf=tf==="2Y"?"1Y":tf;
        const res=await window.chartWizAPI.fetchChart(tk,yTf);
        if(!res.ok)throw new Error(res.error||"Fetch failed");
        bars=res.bars;
      } else {
        const bp=(SCAN_UNIVERSE[tk]?.price||STOCKS[tk]?.price||100);
        bars=genCandles(bp,252,"1D");
      }
      if(!bars||bars.length<30)throw new Error("Not enough historical data");
      const r=runBacktest(bars);
      if(!r)throw new Error("Insufficient bars for this strategy");
      setResult(r);
    }catch(e){setError(e.message);}
    setRunning(false);
  };

  const EquityCurve=({curve})=>{
    if(!curve?.length)return null;
    const W=600,H=130;
    const vals=curve.map(p=>p.val);
    const mn=Math.min(...vals),mx=Math.max(...vals),range=mx-mn||1;
    const toX=i=>(i/(curve.length-1||1))*W;
    const toY=v=>H-4-((v-mn)/range)*(H-8);
    const pts=curve.map((p,i)=>`${toX(i).toFixed(1)},${toY(p.val).toFixed(1)}`).join(" ");
    const isUp=vals[vals.length-1]>=vals[0];
    const col=isUp?T.pos:T.neg;
    const fillPath=`M${toX(0).toFixed(1)},${toY(curve[0].val).toFixed(1)} ${curve.map((p,i)=>`L${toX(i).toFixed(1)},${toY(p.val).toFixed(1)}`).join(" ")} L${toX(curve.length-1).toFixed(1)},${H} L${toX(0).toFixed(1)},${H} Z`;
    return(
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:"block"}}>
        <defs><linearGradient id="btec" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={col} stopOpacity="0.2"/><stop offset="100%" stopColor={col} stopOpacity="0.01"/></linearGradient></defs>
        <path d={fillPath} fill="url(#btec)" stroke="none"/>
        <polyline points={pts} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  };

  const fmt=(n,d=2)=>n==null?"—":isFinite(n)?n.toFixed(d):"∞";
  const fmtPct=(n,sign=false)=>n==null?"—":`${sign&&n>0?"+":""}${n.toFixed(2)}%`;
  const fmtCur=(n)=>n==null?"—":`$${(+n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const inputStyle={width:"100%",boxSizing:"border-box",padding:"7px 10px",borderRadius:6,border:`1px solid ${T.border}`,background:T.bg,color:T.text,fontSize:12,fontFamily:T.num,outline:"none"};

  return(
    <div style={{height:"100%",display:"flex",gap:8,overflow:"hidden"}}>
      {/* Config panel */}
      <div style={{width:236,flexShrink:0,background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div style={{padding:"18px 16px 12px",flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
          <div style={{fontSize:15,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:2}}>Backtester</div>
          <div style={{fontSize:11,color:T.textMuted}}>Simulate strategies on historical data</div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"14px 14px 14px"}}>
          <BtLabel T={T}>Ticker</BtLabel>
          <input value={ticker} onChange={e=>setTicker(e.target.value.toUpperCase())} placeholder="e.g. AAPL" style={{...inputStyle,marginBottom:12}}/>

          <BtLabel T={T}>Timeframe</BtLabel>
          <div style={{display:"flex",gap:3,marginBottom:12,flexWrap:"wrap"}}>
            {TFS.map(t=>(
              <button key={t} onClick={()=>setTf(t)} style={{flex:"1 0 auto",padding:"5px 0",borderRadius:5,border:`1px solid ${tf===t?T.accent:T.border}`,background:tf===t?T.accentLight:"transparent",color:tf===t?T.accent:T.textMuted,fontSize:10,fontWeight:600,cursor:"pointer",minWidth:32,transition:"all 0.1s"}}>
                {t}
              </button>
            ))}
          </div>

          <BtLabel T={T}>Strategy</BtLabel>
          <select value={strategy} onChange={e=>{setStrategy(e.target.value);setResult(null);}} style={{...inputStyle,marginBottom:12,cursor:"pointer"}}>
            {STRATEGIES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select>

          {strategy==="ema_cross"&&(
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{flex:1}}>
                <BtLabel T={T}>Fast EMA</BtLabel>
                <input type="number" value={emFast} onChange={e=>setEmFast(+e.target.value)} min={2} max={50} style={inputStyle}/>
              </div>
              <div style={{flex:1}}>
                <BtLabel T={T}>Slow EMA</BtLabel>
                <input type="number" value={emSlow} onChange={e=>setEmSlow(+e.target.value)} min={5} max={200} style={inputStyle}/>
              </div>
            </div>
          )}
          {strategy==="rsi_mean_rev"&&(
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{flex:1}}>
                <BtLabel T={T}>Buy below</BtLabel>
                <input type="number" value={rsiOS} onChange={e=>setRsiOS(+e.target.value)} min={10} max={49} style={inputStyle}/>
              </div>
              <div style={{flex:1}}>
                <BtLabel T={T}>Sell above</BtLabel>
                <input type="number" value={rsiOB} onChange={e=>setRsiOB(+e.target.value)} min={51} max={95} style={inputStyle}/>
              </div>
            </div>
          )}

          <div style={{height:1,background:T.border,margin:"4px 0 12px"}}/>

          <BtLabel T={T}>Starting Capital ($)</BtLabel>
          <input type="number" value={capital} onChange={e=>setCapital(+e.target.value)} min={1000} step={1000} style={{...inputStyle,marginBottom:12}}/>

          <BtLabel T={T}>Position Size — {posSize}% of equity</BtLabel>
          <input type="range" value={posSize} onChange={e=>setPosSize(+e.target.value)} min={10} max={100} step={5}
            style={{width:"100%",accentColor:T.accent,marginBottom:12}}/>

          <BtLabel T={T}>Commission ($ per side)</BtLabel>
          <input type="number" value={commission} onChange={e=>setCommission(+e.target.value)} min={0} step={0.5} style={{...inputStyle,marginBottom:16}}/>

          <button onClick={handleRun} disabled={running}
            style={{width:"100%",padding:"9px 0",borderRadius:8,border:"none",background:running?T.border:T.accent,color:running?T.textMuted:"#fff",fontSize:13,fontWeight:600,cursor:running?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:T.ui,transition:"all 0.15s"}}>
            {running
              ?<><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Running…</>
              :<><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>Run Backtest</>
            }
          </button>
          {error&&<div style={{marginTop:10,fontSize:11,color:T.neg,textAlign:"center"}}>{error}</div>}

          <div style={{marginTop:12,padding:"9px 10px",borderRadius:7,background:dark?"#1A1F2A":"#F0F4FF",border:`1px solid ${dark?"#2A3450":"#C7D7FF"}`}}>
            <div style={{fontSize:10,color:T.textMuted,lineHeight:1.5}}>Educational use only. Simulated results assume no slippage. Past performance does not indicate future results.</div>
          </div>
        </div>
      </div>

      {/* Results panel */}
      <div style={{flex:1,display:"flex",flexDirection:"column",gap:8,overflow:"hidden",minWidth:0}}>
        {!result&&!running&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:T.surface,borderRadius:14,border:`1px solid ${T.border}`,gap:12}}>
            <div style={{width:52,height:52,borderRadius:14,background:T.bg,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.textMuted}}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div style={{fontSize:13,color:T.textSub,textAlign:"center",maxWidth:340,lineHeight:1.6}}>
              Configure a strategy and click <strong style={{color:T.text}}>Run Backtest</strong> to simulate it on historical price data.
            </div>
          </div>
        )}

        {result&&(
          <>
            {/* Stat cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,flexShrink:0}}>
              {[
                {label:"Total Return",    val:fmtPct(result.totalReturn,true), color:result.totalReturn>=0?T.pos:T.neg,  sub:`vs B&H: ${fmtPct(result.bnh,true)}`},
                {label:"Win Rate",        val:`${fmt(result.winRate,1)}%`,       color:result.winRate>=50?T.pos:T.neg,    sub:`${result.trades.length} trades`},
                {label:"Max Drawdown",    val:fmtPct(-result.maxDD),             color:T.neg,                             sub:"Peak to trough"},
                {label:"Profit Factor",   val:fmt(result.profitFactor),          color:result.profitFactor>=1?T.pos:T.neg,sub:`Sharpe: ${fmt(result.sharpe,2)}`},
                {label:"Final Equity",    val:fmtCur(result.equity),             color:result.equity>=capital?T.pos:T.neg,sub:`Started: ${fmtCur(capital)}`},
                {label:"Avg Win",         val:fmtPct(result.avgWin,true),        color:T.pos,                             sub:"Per winning trade"},
                {label:"Avg Loss",        val:fmtPct(result.avgLoss,true),       color:T.neg,                             sub:"Per losing trade"},
                {label:"Sharpe Ratio",    val:fmt(result.sharpe,2),              color:result.sharpe>=1?T.pos:result.sharpe>=0?T.amber:T.neg, sub:"Annualized"},
              ].map(({label,val,color,sub})=>(
                <div key={label} style={{background:T.surface,borderRadius:10,border:`1px solid ${T.border}`,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:T.textMuted,marginBottom:4,fontWeight:500}}>{label}</div>
                  <div style={{fontSize:16,fontWeight:700,color,fontFamily:T.num,letterSpacing:"-0.02em"}}>{val}</div>
                  <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Equity curve */}
            <div style={{background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,padding:"14px 16px",flexShrink:0}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontSize:12,fontWeight:600,color:T.text}}>Equity Curve</span>
                <span style={{fontSize:10,color:T.textMuted,fontFamily:T.num}}>{ticker} · {tf} · {STRATEGIES.find(s=>s.id===strategy)?.label}</span>
              </div>
              <div style={{height:130,borderRadius:6,overflow:"hidden"}}>
                <EquityCurve curve={result.equityCurve}/>
              </div>
            </div>

            {/* Trade log */}
            <div style={{flex:1,background:T.surface,borderRadius:12,border:`1px solid ${T.border}`,overflow:"hidden",display:"flex",flexDirection:"column",minHeight:0}}>
              <div style={{padding:"12px 14px",fontSize:12,fontWeight:600,color:T.text,flexShrink:0,borderBottom:`1px solid ${T.border}`}}>
                Trade Log <span style={{fontWeight:400,color:T.textMuted}}>({result.trades.length} trades)</span>
              </div>
              <div style={{flex:1,overflowY:"auto",minHeight:0}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{position:"sticky",top:0,background:T.surface,zIndex:1}}>
                      {["#","Entry Date","Entry $","Exit Date","Exit $","Return","P&L","Result"].map(h=>(
                        <th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,fontWeight:600,color:T.textMuted,whiteSpace:"nowrap",borderBottom:`1px solid ${T.border}`}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.trades.map((t,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${T.borderLight}`,transition:"background 0.1s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"7px 10px",color:T.textMuted,fontFamily:T.num}}>{i+1}</td>
                        <td style={{padding:"7px 10px",color:T.textMuted,fontFamily:T.num,whiteSpace:"nowrap"}}>{t.entryDate?new Date(t.entryDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"}):"—"}</td>
                        <td style={{padding:"7px 10px",color:T.text,fontFamily:T.num,fontWeight:600}}>${(+t.entry).toFixed(2)}</td>
                        <td style={{padding:"7px 10px",color:T.textMuted,fontFamily:T.num,whiteSpace:"nowrap"}}>{t.exitDate?new Date(t.exitDate).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"}):"—"}</td>
                        <td style={{padding:"7px 10px",color:T.text,fontFamily:T.num,fontWeight:600}}>${(+t.exit).toFixed(2)}</td>
                        <td style={{padding:"7px 10px",fontFamily:T.num,fontWeight:600,color:t.pct>=0?T.pos:T.neg}}>{t.pct>=0?"+":""}{t.pct.toFixed(2)}%</td>
                        <td style={{padding:"7px 10px",fontFamily:T.num,color:t.win?T.pos:T.neg}}>{t.pnl>=0?"+":""}{fmtCur(t.pnl)}</td>
                        <td style={{padding:"7px 10px"}}>
                          <span style={{fontSize:9,fontWeight:700,padding:"2px 6px",borderRadius:3,background:t.win?(dark?"#0D2818":"#F0FDF4"):(dark?"#2D0F0F":"#FEF2F2"),color:t.win?T.pos:T.neg}}>
                            {t.win?"WIN":"LOSS"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {result.trades.length===0&&(
                      <tr><td colSpan={8} style={{padding:24,textAlign:"center",color:T.textMuted,fontSize:12}}>No trades generated — try a different strategy or timeframe</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SCANNER PAGE ─────────────────────────────────────────────────────────────
const SCAN_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function ScannerPage({T,dark,onSelect,isPremium=false}){
  const [results,setResults]=useState({bullish:[],bearish:[],neutral:[],total:0});
  const [scanning,setScanning]=useState(false);
  const [progress,setProgress]=useState(0);
  const [scanned,setScanned]=useState(false);
  const [scanBlocked,setScanBlocked]=useState(false);
  const [scanningTicker,setScanningTicker]=useState("");

  const canScan=()=>{
    if(isPremium)return true;
    const last=localStorage.getItem("chartwiz-last-scan");
    return !last||(Date.now()-parseInt(last,10))>SCAN_COOLDOWN_MS;
  };
  const nextScanDate=()=>{
    const last=localStorage.getItem("chartwiz-last-scan");
    if(!last)return null;
    return new Date(parseInt(last,10)+SCAN_COOLDOWN_MS);
  };

  // ── Enhanced scan logic — real OHLCV bars, multi-indicator confluence ──────
  const analyzeStock=(ticker,name,candles)=>{
    if(!candles||candles.length<30)return null;
    const price=candles[candles.length-1].close;

    // Indicators
    const rsiVals=calcRSI(candles,14);
    const rsi=rsiVals[rsiVals.length-1]||50;
    const rsiRecent=rsiVals.slice(-5).filter(Boolean);
    const rsiMom=rsiRecent.length>=2?rsiRecent[rsiRecent.length-1]-rsiRecent[0]:0;

    const ema9=calcEMA(candles,9);const ema21=calcEMA(candles,21);
    const ema50=calcEMA(candles,50);const ema200=calcEMA(candles,200);
    const e9=ema9[ema9.length-1],e21=ema21[ema21.length-1];
    const e50=ema50[ema50.length-1],e200=ema200[ema200.length-1];

    const bb=calcBB(candles,20,2);const lastBB=bb[bb.length-1];
    const bbW=lastBB?(lastBB.upper-lastBB.lower)/lastBB.mid*100:5;
    const bbWAvg=bb.slice(-15).filter(Boolean).reduce((s,b)=>s+(b.upper-b.lower)/b.mid*100,0)/15;

    const atrVals=calcATR(candles,14);const atr=atrVals[atrVals.length-1]||0;
    const st=calcSupertrend(candles,10,3);const lastST=st[st.length-1];

    const vol=candles[candles.length-1].vol;
    const vol20=candles.slice(-20).reduce((s,c)=>s+c.vol,0)/20;
    const volRatio=vol/vol20;
    const volTrend=candles.slice(-5).reduce((s,c)=>s+c.vol,0)/5 / (candles.slice(-20,-5).reduce((s,c)=>s+c.vol,0)/15);

    const p5=candles[candles.length-6]?.close||price;
    const p20=candles[candles.length-21]?.close||price;
    const roc5=(price-p5)/p5*100;
    const roc20=(price-p20)/p20*100;

    const hi20=Math.max(...candles.slice(-20).map(c=>c.high));
    const lo20=Math.min(...candles.slice(-20).map(c=>c.low));

    // ── Weighted signal scoring ────────────────────────────────────────────
    let bull=0,bear=0;const signals=[];

    // RSI
    if(rsi<28){bull+=30;signals.push("RSI Oversold");}
    else if(rsi<38){bull+=15;signals.push("RSI Near Oversold");}
    if(rsi>72){bear+=30;signals.push("RSI Overbought");}
    else if(rsi>62){bear+=15;signals.push("RSI Extended");}
    if(rsiMom>5&&rsi<60){bull+=8;}
    if(rsiMom<-5&&rsi>40){bear+=8;}

    // EMA alignment
    if(e9>e21&&e21>e50&&e50>e200){bull+=35;signals.push("Full Bull Stack");}
    else if(e9>e21&&e21>e50){bull+=22;signals.push("EMA Bull Stack");}
    else if(e9>e21){bull+=10;}
    if(e9<e21&&e21<e50&&e50<e200){bear+=35;signals.push("Full Bear Stack");}
    else if(e9<e21&&e21<e50){bear+=22;signals.push("EMA Bear Stack");}
    else if(e9<e21){bear+=10;}

    // Price vs long-term EMAs
    if(price>e200){bull+=10;}else{bear+=10;}
    if(price>e50&&price>e200){bull+=6;}
    if(price<e50&&price<e200){bear+=6;}

    // Supertrend
    if(lastST?.dir===1){bull+=18;signals.push("Supertrend Up");}
    else if(lastST?.dir===-1){bear+=18;signals.push("Supertrend Down");}

    // Momentum (rate of change)
    if(roc5>3){bull+=14;signals.push("Short Momentum");}
    else if(roc5<-3){bear+=14;signals.push("Momentum Fading");}
    if(roc20>8){bull+=10;signals.push("Trend Confirmed");}
    else if(roc20<-8){bear+=10;signals.push("Downtrend");}

    // Bollinger Bands
    if(lastBB){
      if(price>lastBB.upper){bull+=20;signals.push("BB Breakout");}
      else if(price<lastBB.lower){bear+=20;signals.push("BB Breakdown");}
      else if(price>lastBB.mid&&price>lastBB.mid*1.005){bull+=8;}
      else if(price<lastBB.mid){bear+=8;}
    }
    const bbSqueeze=bbW<bbWAvg*0.75;
    if(bbSqueeze){signals.push("BB Squeeze");}

    // Volume confirmation
    if(volRatio>2.0&&bull>bear){bull+=18;signals.push("Volume Surge");}
    else if(volRatio>2.0&&bear>bull){bear+=18;signals.push("Volume Surge");}
    else if(volRatio>1.5){bull>bear?bull+=10:bear+=10;}
    if(volTrend>1.3){bull>bear?bull+=6:bear+=6;}

    // Price position in 20-day range
    const rangePct=(price-lo20)/(hi20-lo20||1)*100;
    if(rangePct>85){bear+=8;signals.push("Near 20D High");}
    if(rangePct<15){bull+=8;signals.push("Near 20D Low");}

    // ATR volatility context
    const atrPct=atr/price*100;
    if(atrPct<1.2&&rangePct>30&&rangePct<70){signals.push("Consolidating");}

    // Determine setup type + confidence from weighted scores
    const total=bull+bear||1;
    const bullRatio=bull/total;
    let setupType="neutral",confidence=50;

    if(bullRatio>=0.60){
      setupType="bullish";
      confidence=Math.min(97,52+bull*0.45);
    } else if(bullRatio<=0.40){
      setupType="bearish";
      confidence=Math.min(97,52+bear*0.45);
    } else {
      setupType="neutral";
      confidence=Math.min(92,48+Math.min(bull,bear)*0.3+(bbSqueeze?12:0));
    }

    if(signals.length===0)signals.push("No Clear Setup");
    const change=((price-(candles[candles.length-2]?.close||price))/(candles[candles.length-2]?.close||price)*100);
    return{ticker,name,rsi:rsi.toFixed(1),price:price.toFixed(2),atrPct:atrPct.toFixed(1),volRatio:volRatio.toFixed(1),signals,setupType,confidence:Math.round(confidence),change:change.toFixed(2)};
  };

  const runScan=async()=>{
    if(!canScan()){setScanBlocked(true);return;}
    setScanBlocked(false);
    setScanning(true);setProgress(0);setResults({bullish:[],bearish:[],neutral:[],total:0});

    const tickers=Object.keys(SCAN_UNIVERSE);
    const out=[];
    const CONCURRENCY=5;  // parallel requests per batch
    const BATCH_DELAY=350; // ms between batches to avoid rate limiting
    let done=0;

    if(inElectron()){
      // Fetch real 1-year daily bars for every ticker in parallel batches
      for(let i=0;i<tickers.length;i+=CONCURRENCY){
        const batch=tickers.slice(i,i+CONCURRENCY);
        setScanningTicker(`${SCAN_UNIVERSE[batch[0]]?.name||batch[0]}`);
        const batchResults=await Promise.all(
          batch.map(async tk=>{
            try{
              const res=await window.chartWizAPI.fetchChart(tk,"1Y");
              if(!res.ok||!res.bars?.length)return null;
              return analyzeStock(tk,SCAN_UNIVERSE[tk].name,res.bars);
            }catch{return null;}
          })
        );
        batchResults.forEach(r=>r&&out.push(r));
        done+=batch.length;
        setProgress(Math.round(done/tickers.length*100));
        if(i+CONCURRENCY<tickers.length)await new Promise(r=>setTimeout(r,BATCH_DELAY));
      }
    } else {
      // Browser fallback — synthetic candles (dev/demo only)
      for(const [tk,s] of Object.entries(SCAN_UNIVERSE)){
        const r=analyzeStock(tk,s.name,genCandles(s.price,220,"1D"));
        if(r)out.push(r);
      }
    }

    if(!isPremium)localStorage.setItem("chartwiz-last-scan",Date.now().toString());

    const top=(type,n=10)=>[...out].filter(r=>r.setupType===type).sort((a,b)=>b.confidence-a.confidence).slice(0,n);
    setResults({bullish:top("bullish"),bearish:top("bearish"),neutral:top("neutral"),total:out.length});
    setScanning(false);setScanned(true);
  };

  const setupColor=t=>t==="bullish"?T.pos:t==="bearish"?T.neg:T.amber;
  const setupBg=t=>t==="bullish"?(dark?"#0D2818":"#F0FDF4"):t==="bearish"?(dark?"#2D0F0F":"#FEF2F2"):(dark?"#2D2000":"#FFFBEB");
  const setupBd=t=>t==="bullish"?(dark?"#1A4D2E":"#BBF7D0"):t==="bearish"?(dark?"#5C1A1A":"#FECACA"):(dark?"#5C3D00":"#FDE68A");

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:T.bg,overflow:"hidden"}}>
      {/* Scanner header */}
      <div style={{padding:"20px 28px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <div style={{fontSize:20,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:3}}>Market Scanner</div>
            <div style={{fontSize:12,color:T.textMuted}}>
              {scanning&&scanningTicker
                ?<span>Analyzing <strong style={{color:T.text}}>{scanningTicker}</strong>… {progress}% complete</span>
                :scanned?`Scanned ${results.total} stocks · top 10 per category shown`:`${Object.keys(SCAN_UNIVERSE).length} stocks · real market data · RSI, EMA, BB, Supertrend`}
            </div>
            {!isPremium&&<div style={{fontSize:11,color:T.textMuted,marginTop:3}}>Free: 1 scan per week · <span style={{color:T.accent,cursor:"pointer"}}>Upgrade for unlimited</span></div>}
          </div>
          <button onClick={runScan} disabled={scanning}
            style={{display:"flex",alignItems:"center",gap:6,height:34,padding:"0 16px",borderRadius:6,border:"none",background:scanning?T.border:T.accent,color:scanning?T.textMuted:"#fff",cursor:scanning?"not-allowed":"pointer",fontSize:12,fontFamily:T.ui,fontWeight:600,transition:"all 0.15s"}}>
            {scanning
              ? <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Scanning {progress}%</>
              : <><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>{scanned?"Re-scan":"Run Scan"}</>
            }
          </button>
        </div>

        {/* Progress bar */}
        {scanning&&(
          <div style={{height:3,background:T.border,borderRadius:2,overflow:"hidden",marginBottom:16}}>
            <div style={{height:"100%",width:`${progress}%`,background:T.accent,borderRadius:2,transition:"width 0.1s"}}/>
          </div>
        )}

        {/* Free scan limit notice */}
        {scanBlocked&&(
          <div style={{marginBottom:16,padding:"12px 14px",borderRadius:8,background:dark?"#2D1F00":"#FFFBEB",border:`1px solid ${dark?"#5C3D00":"#FDE68A"}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:2}}>Weekly scan limit reached</div>
              <div style={{fontSize:11,color:T.textMuted}}>
                {nextScanDate()?`Next free scan available ${nextScanDate().toLocaleDateString('en-US',{month:'short',day:'numeric'})}`:""} · Upgrade for unlimited scans
              </div>
            </div>
            <button onClick={()=>setScanBlocked(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,fontSize:18,lineHeight:1}}>×</button>
          </div>
        )}

      </div>

      {/* Results — three sections */}
      <div style={{flex:1,overflowY:"auto",padding:"0 20px 24px"}}>
        {!scanned&&!scanning&&(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12}}>
            <div style={{width:48,height:48,borderRadius:12,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.textMuted}}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </div>
            <div style={{fontSize:13,color:T.textSub,textAlign:"center",maxWidth:300,lineHeight:1.6}}>
              Click <strong style={{color:T.text}}>Run Scan</strong> to screen {Object.keys(SCAN_UNIVERSE).length} stocks using RSI, EMA alignment, Bollinger Bands, Supertrend, and volume analysis. Returns top 10 in each category.
            </div>
          </div>
        )}

        {scanned&&!scanning&&(()=>{
          const SectionHeader=({type,label,count})=>(
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"14px 0 8px"}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:setupColor(type),flexShrink:0}}/>
              <span style={{fontSize:13,fontWeight:700,color:T.text,letterSpacing:"-0.01em"}}>{label}</span>
              <span style={{fontSize:11,color:T.textMuted}}>Top {count}</span>
              <div style={{flex:1,height:1,background:T.border,marginLeft:4}}/>
            </div>
          );

          const Row=({r})=>(
            <div style={{display:"grid",gridTemplateColumns:"90px 1fr 58px 46px 80px",gap:"0 8px",padding:"9px 10px",borderBottom:`1px solid ${T.borderLight}`,alignItems:"center",cursor:"pointer",borderRadius:6,transition:"background 0.1s"}}
              onClick={()=>onSelect(r.ticker)}
              onMouseEnter={e=>e.currentTarget.style.background=T.surfaceRaised||T.bg}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {/* Ticker + name */}
              <div>
                <div style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:T.num,letterSpacing:"-0.01em"}}>{r.ticker}</div>
                <div style={{fontSize:10,color:T.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:84}}>{r.name}</div>
              </div>
              {/* Signals */}
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                {r.signals.slice(0,2).map(s=>(
                  <span key={s} style={{fontSize:9,fontWeight:600,padding:"2px 6px",borderRadius:3,background:setupBg(r.setupType),border:`1px solid ${setupBd(r.setupType)}`,color:setupColor(r.setupType),whiteSpace:"nowrap"}}>{s}</span>
                ))}
                {r.signals.length>2&&<span style={{fontSize:9,color:T.textMuted}}>+{r.signals.length-2}</span>}
              </div>
              {/* RSI */}
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,fontWeight:700,fontFamily:T.num,color:parseFloat(r.rsi)>68?T.neg:parseFloat(r.rsi)<32?T.pos:T.text}}>{r.rsi}</div>
                <div style={{fontSize:9,color:T.textMuted}}>RSI</div>
              </div>
              {/* Vol */}
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,fontWeight:600,fontFamily:T.num,color:parseFloat(r.volRatio)>1.8?T.pos:T.textSub}}>{r.volRatio}x</div>
                <div style={{fontSize:9,color:T.textMuted}}>Vol</div>
              </div>
              {/* Confidence bar */}
              <div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:9,color:T.textMuted}}>Score</span>
                  <span style={{fontSize:9,fontWeight:700,color:setupColor(r.setupType),fontFamily:T.num}}>{r.confidence}%</span>
                </div>
                <div style={{height:4,background:T.border,borderRadius:2,overflow:"hidden"}}>
                  <div style={{width:`${r.confidence}%`,height:"100%",background:setupColor(r.setupType),borderRadius:2}}/>
                </div>
              </div>
            </div>
          );

          return(
            <>
              <SectionHeader type="bullish" label="Bullish Setups" count={results.bullish?.length}/>
              {results.bullish?.map(r=><Row key={r.ticker} r={r}/>)}
              <SectionHeader type="bearish" label="Bearish Setups" count={results.bearish?.length}/>
              {results.bearish?.map(r=><Row key={r.ticker} r={r}/>)}
              <SectionHeader type="neutral" label="Neutral / Coiling" count={results.neutral?.length}/>
              {results.neutral?.map(r=><Row key={r.ticker} r={r}/>)}
            </>
          );
        })()}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
function ChartWizInner(){
  const [ticker,setTicker]=useState("AMD");
  const [search,setSearch]=useState("");
  const [searchResults,setSearchResults]=useState([]);
  const [searchFocused,setSearchFocused]=useState(false);
  const [dark,setDark]=useState(false);
  const [page,setPage]=useState("chart"); // "chart" | "scanner"
  const [showWatchlist,setShowWatchlist]=useState(true);
  const [liveQuotes,setLiveQuotes]=useState({});
  const [analystData,setAnalystData]=useState({});
  const [chartAlertsOpen,setChartAlertsOpen]=useState(false);
  const [isWinMaximized,setIsWinMaximized]=useState(false);
  const [showOnboarding,setShowOnboarding]=useState(()=>!localStorage.getItem("chartwiz-onboarded"));
  const [showShortcuts,setShowShortcuts]=useState(false);
  useEffect(()=>{
    const h=e=>{
      if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA")return;
      if(e.key==="?"||e.key==="/")setShowShortcuts(v=>!v);
      if(e.key==="Escape"){setShowShortcuts(false);}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]); // { [ticker]: {buy,hold,sell,buyPct,holdPct,sellPct,rating} }
  const [watchlistTickers,setWatchlistTickers]=useState(Object.keys(STOCKS));
  const watchlistRef=useRef(Object.keys(STOCKS)); // ref so fetchAll loop sees updates
  const [isPremium,setIsPremium]=useState(DEV_MODE);
  const [showSettings,setShowSettings]=useState(false);
  const [settingsTab,setSettingsTab]=useState("profile");
  const [userName,setUserName]=useState("Your Name");
  const [userEmail,setUserEmail]=useState("");
  const [licenseKey,setLicenseKey]=useState("");
  const [licenseStatus,setLicenseStatus]=useState(""); // "ok" | "error" | ""
  const [anthropicKey,setAnthropicKey]=useState("");
  const searchRef=useRef(null);

  const T=dark?DARK:LIGHT;

  // Load saved settings on mount
  useEffect(()=>{
    if(!inElectron())return;
    window.chartWizAPI.windowIsMaximized().then(setIsWinMaximized).catch(()=>{});
    window.chartWizAPI.onWindowMaximize(setIsWinMaximized);
    window.chartWizAPI.getSettings().then(s=>{
      if(s.licenseKey){setLicenseKey(s.licenseKey);setIsPremium(true);}
      if(s.anthropicKey)setAnthropicKey(s.anthropicKey);
      if(s.userName)setUserName(s.userName);
      if(s.userEmail)setUserEmail(s.userEmail);
      if(Array.isArray(s.watchlist)&&s.watchlist.length>0){
        watchlistRef.current=s.watchlist;
        setWatchlistTickers(s.watchlist);
        setTicker(s.watchlist[0]);
      }
    }).catch(()=>{});
  },[]);

  const saveLicense=async()=>{
    const key=licenseKey.trim();
    if(!key){setLicenseStatus("error");return;}
    // TODO: validate against backend — for now any non-empty key activates premium
    if(inElectron())await window.chartWizAPI.setSettings({licenseKey:key,anthropicKey});
    setIsPremium(true);setLicenseStatus("ok");
    setTimeout(()=>{setShowSettings(false);setLicenseStatus("");},1200);
  };

  const saveAnthropicKey=async()=>{
    if(inElectron())await window.chartWizAPI.setSettings({anthropicKey,licenseKey,userName,userEmail});
  };
  const saveProfile=async()=>{
    if(inElectron())await window.chartWizAPI.setSettings({anthropicKey,licenseKey,userName,userEmail});
  };

  const addToWatchlist=(sym)=>{
    const tk=sym.toUpperCase().trim();
    if(!tk)return;
    if(!watchlistRef.current.includes(tk)){
      const next=[...watchlistRef.current,tk];
      watchlistRef.current=next;
      setWatchlistTickers(next);
      if(inElectron()){
        fetchYahooQuote(tk).then(q=>{if(q)setLiveQuotes(p=>({...p,[tk]:q}));}).catch(()=>{});
        window.chartWizAPI.setSettings({watchlist:next}).catch(()=>{});
      }
    }
    setTicker(tk);
  };

  const removeFromWatchlist=(tk)=>{
    const next=watchlistRef.current.filter(t=>t!==tk);
    watchlistRef.current=next;
    setWatchlistTickers(next);
    if(ticker===tk&&next.length>0)setTicker(next[0]);
    if(inElectron())window.chartWizAPI.setSettings({watchlist:next}).catch(()=>{});
  };

  // Merge static stock data with live quote, deriving real trend/momentum/levels
  const baseStock=STOCKS[ticker]||{name:ticker,price:0,change:0,open:0,high:0,low:0,vol:"—",avgVol:"—",mktCap:"—",pe:"—",rsi:50,resistance:0,support:0,trend:"Sideways",momentum:"Moderate",volume:"Normal"};
  const lq=liveQuotes[ticker];
  const stock=(()=>{
    if(!lq)return baseStock;
    const chg=lq.change||0;
    // Derive trend from today's % change
    const trend=chg>1.5?"Upward":chg<-1.5?"Downward":"Sideways";
    // Derive momentum from magnitude of move
    const momentum=Math.abs(chg)>3?(chg>0?"Strong":"Weak"):Math.abs(chg)>1?(chg>0?"Moderate":"Fading"):"Building";
    // Use day high/low as intraday resistance/support; fall back to static if unavailable
    const resistance=lq.high||baseStock.resistance;
    const support=lq.low||baseStock.support;
    // Compare volume to static avgVol estimate
    const avgVolNum=(parseFloat(String(baseStock.avgVol))||50)*1e6;
    const volume=(lq.vol||0)>avgVolNum*1.15?"Elevated":"Normal";
    return{
      ...baseStock,
      price:lq.price, change:lq.change,
      open:lq.open,   high:lq.high, low:lq.low,
      vol:lq.vol,     name:lq.name||baseStock.name,
      trend, momentum, volume, resistance, support,
    };
  })();

  // Fetch quotes sequentially — one at a time with a 3s gap to avoid Yahoo 429s
  useEffect(()=>{
    if(!inElectron())return;
    let cancelled=false;

    const fetchAll=async()=>{
      for(const tk of watchlistRef.current){
        if(cancelled)break;
        try{
          const q=await fetchYahooQuote(tk);
          if(q&&!cancelled){
            console.log("[ChartWiz] quote ok:",tk,q.price);
            setLiveQuotes(p=>({...p,[tk]:q}));
          }
        }catch(err){
          console.error("[ChartWiz] quote fail:",tk,err?.message);
        }
        // 3 second gap between each ticker to stay under rate limit
        if(!cancelled)await new Promise(r=>setTimeout(r,3000));
      }
    };

    fetchAll();
    // Re-run the full sweep every 2 minutes
    const iv=setInterval(fetchAll,120000);
    return()=>{cancelled=true;clearInterval(iv);};
  },[]);

  // Immediately refresh selected ticker when user switches
  useEffect(()=>{
    if(!inElectron())return;
    fetchYahooQuote(ticker)
      .then(q=>{if(q)setLiveQuotes(p=>({...p,[ticker]:q}));})
      .catch(()=>{});
  },[ticker]);

  // Fetch real analyst recommendations per ticker (cached after first load)
  useEffect(()=>{
    if(!inElectron()||analystData[ticker])return;
    window.chartWizAPI.fetchAnalysts(ticker)
      .then(res=>{if(res.ok)setAnalystData(p=>({...p,[ticker]:res.data}));})
      .catch(()=>{});
  },[ticker]);

  // Symbol search via Yahoo Finance
  useEffect(()=>{
    if(!search.trim()||!inElectron()){setSearchResults([]);return;}
    const t=setTimeout(async()=>{
      try{
        const res=await window.chartWizAPI.search(search.trim());
        if(res.ok)setSearchResults(res.hits||[]);
      }catch{}
    },300);
    return()=>clearTimeout(t);
  },[search]);

  const pickSymbol=(sym)=>{
    addToWatchlist(sym.toUpperCase());
    setSearch("");setSearchResults([]);setSearchFocused(false);
  };

  return(
    <div style={{height:"100vh",background:T.bg,fontFamily:T.ui,color:T.text,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-thumb{background:${dark?"#30363D":"#D1D5DB"};border-radius:2px;}
        ::-webkit-scrollbar-track{background:transparent;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}} @keyframes slideIn{from{opacity:0;transform:translateX(8px)}to{opacity:1;transform:translateX(0)}}
        button{font-family:inherit;} input{font-family:inherit;} input:focus{outline:none;border-color:${T.accent} !important;}
      `}</style>

      {/* HEADER */}
      <header style={{height:52,background:T.surface,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",padding:`0 0 0 ${isMac&&inElectron()?80:16}px`,gap:16,flexShrink:0,WebkitAppRegion:"drag",userSelect:"none"}}
        onDoubleClick={()=>inElectron()&&!isMac&&window.chartWizAPI.windowMaximize()}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:28,height:28,background:T.accent,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
              <polyline points="8,16 16,32 24,20 32,32 40,12" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="40" cy="12" r="3" fill="white"/>
            </svg>
          </div>
          <span style={{fontSize:15,fontWeight:700,color:T.text,letterSpacing:"-0.03em",userSelect:"none"}}>ChartWiz</span>
        </div>

        {/* Divider */}
        <div style={{width:1,height:22,background:T.border,flexShrink:0}}/>

        {/* Nav */}
        <nav style={{display:"flex",alignItems:"stretch",height:"100%",gap:0,flexShrink:0,WebkitAppRegion:"no-drag"}}>
          {[["chart","Chart"],["scanner","Scanner"]].map(([id,label])=>(
            <button key={id} onClick={()=>setPage(id)} style={{
              height:"100%",padding:"0 12px",
              background:"transparent",border:"none",
              borderBottom:page===id?`2px solid ${T.accent}`:"2px solid transparent",
              fontSize:12,fontWeight:page===id?600:400,
              color:page===id?T.accent:T.textSub,
              cursor:"pointer",marginBottom:-1,
              transition:"color 0.1s",
            }}>
              {label}
            </button>
          ))}
        </nav>

        {/* Search — centered with live results dropdown */}
        <div style={{flex:1,display:"flex",justifyContent:"center",WebkitAppRegion:"no-drag"}}>
          <div style={{position:"relative",width:300}} ref={searchRef}>
            <svg style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}} width="12" height="12" fill="none" stroke={T.textMuted} strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              onFocus={()=>setSearchFocused(true)}
              onBlur={()=>setTimeout(()=>setSearchFocused(false),150)}
              onKeyDown={e=>{if(e.key==="Enter"&&search.trim())pickSymbol(search.trim());if(e.key==="Escape"){setSearch("");setSearchResults([]);}}}
              placeholder={inElectron()?"Search any symbol…":"Search symbol…"}
              style={{width:"100%",height:30,padding:"0 10px 0 26px",borderRadius:6,border:`1px solid ${searchFocused?T.accent:T.border}`,fontSize:11,color:T.text,background:T.surfaceRaised||T.bg,fontFamily:"inherit",outline:"none"}}/>
            {/* Results dropdown */}
            {searchFocused&&searchResults.length>0&&(
              <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,boxShadow:"0 8px 24px rgba(0,0,0,0.12)",zIndex:1000,overflow:"hidden"}}>
                {searchResults.map(r=>(
                  <button key={r.symbol} onClick={()=>pickSymbol(r.symbol)}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"8px 12px",border:"none",background:"transparent",cursor:"pointer",textAlign:"left"}}
                    onMouseEnter={e=>e.currentTarget.style.background=T.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{fontSize:12,fontWeight:600,color:T.text,minWidth:52,fontFamily:T.num}}>{r.symbol}</span>
                    <span style={{fontSize:11,color:T.textMuted,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
                    <span style={{fontSize:10,color:T.textMuted,flexShrink:0}}>{r.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right controls */}
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,WebkitAppRegion:"no-drag",paddingRight:8}}>

          {/* Data source indicator */}
          <div style={{display:"flex",alignItems:"center",gap:5,height:26,padding:"0 10px",borderRadius:5,border:`1px solid ${T.border}`,fontSize:11,fontWeight:500,color:inElectron()?T.pos:T.textMuted}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:inElectron()?"#16A34A":"#D1D5DB"}}/>
            {inElectron()?"Yahoo Finance":"Demo"}
          </div>

          {/* Divider */}
          <div style={{width:1,height:18,background:T.border,margin:"0 2px"}}/>

          {/* Dark mode */}
          <button onClick={()=>setDark(d=>!d)} title={dark?"Light mode":"Dark mode"}
            style={{width:28,height:28,borderRadius:5,border:`1px solid ${T.border}`,background:"transparent",cursor:"pointer",color:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center"}}
            onMouseEnter={e=>{e.currentTarget.style.background=T.bg;e.currentTarget.style.color=T.text;}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textMuted;}}>
            {dark
              ?<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
              :<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            }
          </button>

          {/* Bell */}
          <button onClick={()=>setChartAlertsOpen(v=>!v)} title="Price Alerts"
            style={{position:"relative",width:28,height:28,borderRadius:5,border:`1px solid ${chartAlertsOpen?T.accent:T.border}`,background:chartAlertsOpen?T.accentLight:"transparent",cursor:"pointer",color:chartAlertsOpen?T.accent:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center"}}
            onMouseEnter={e=>{if(!chartAlertsOpen){e.currentTarget.style.background=T.bg;e.currentTarget.style.color=T.text;}}}
            onMouseLeave={e=>{if(!chartAlertsOpen){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textMuted;}}}>
            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </button>

          {/* Avatar */}
          <div onClick={()=>{setSettingsTab("profile");setShowSettings(true);}}
            style={{display:"flex",alignItems:"center",gap:4,marginLeft:2,cursor:"pointer"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:avatarColor(userName),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <span style={{fontSize:10,fontWeight:700,color:"#fff"}}>{getInitials(userName)}</span>
            </div>
            <svg width="10" height="10" fill="none" stroke={T.textMuted} strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
          </div>

        </div>

        {/* Custom window controls — Windows / Linux only (macOS has native traffic lights) */}
        {!isMac&&inElectron()&&(
          <div style={{display:"flex",alignSelf:"stretch",marginLeft:"auto",flexShrink:0,WebkitAppRegion:"no-drag"}}>
            <button onClick={()=>window.chartWizAPI.windowMinimize()} title="Minimize"
              style={{width:46,height:"100%",border:"none",background:"transparent",cursor:"pointer",color:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.bg}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <svg width="11" height="1" viewBox="0 0 11 1"><rect width="11" height="1.5" fill="currentColor"/></svg>
            </button>
            <button onClick={()=>window.chartWizAPI.windowMaximize()} title={isWinMaximized?"Restore":"Maximize"}
              style={{width:46,height:"100%",border:"none",background:"transparent",cursor:"pointer",color:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.background=T.bg}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {isWinMaximized
                ?<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3" y="0" width="8" height="8" stroke="currentColor" strokeWidth="1.2"/><path d="M0 3h3v8h8v-3" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
                :<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="0.5" y="0.5" width="10" height="10" stroke="currentColor" strokeWidth="1.2"/></svg>
              }
            </button>
            <button onClick={()=>window.chartWizAPI.windowClose()} title="Close"
              style={{width:46,height:"100%",border:"none",background:"transparent",cursor:"pointer",color:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.1s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="#EF4444";e.currentTarget.style.color="#fff";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textMuted;}}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><line x1="0" y1="0" x2="11" y2="11" stroke="currentColor" strokeWidth="1.4"/><line x1="11" y1="0" x2="0" y2="11" stroke="currentColor" strokeWidth="1.4"/></svg>
            </button>
          </div>
        )}
      </header>

      {/* BODY */}
      <div style={{flex:1,overflow:"hidden",minHeight:0,background:dark?"#0A0D12":"#F0F2F5",padding:8}}>
        {/* Chart and Scanner are always mounted — CSS show/hide preserves scanner results */}
        <div style={{display:page==="chart"?"flex":"none",height:"100%",gap:8,position:"relative"}}>

            {/* Icon sidebar */}
            <div style={{width:52,flexShrink:0,borderRadius:14,background:T.surface,border:`1px solid ${T.border}`,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:8,gap:2,overflow:"hidden"}}>
              {[
                {id:"chart",    tip:"Dashboard",  svg:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>},
                {id:"scanner",  tip:"Screener",   svg:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>},
                {id:"backtest", tip:"Backtester", svg:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>},
              ].map(({id,tip,svg})=>{
                const isActive=page===id||(id==="chart"&&page==="chart");
                return(
                  <button key={id} onClick={()=>setPage(id)} title={tip}
                    style={{width:36,height:36,borderRadius:8,border:"none",background:isActive?T.accentLight:"transparent",cursor:"pointer",color:isActive?T.accent:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.12s"}}
                    onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background=T.bg;e.currentTarget.style.color=T.text;}}}
                    onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textMuted;}}}>
                    {svg}
                  </button>
                );
              })}
              <div style={{flex:1}}/>
              <button title="Settings" onClick={()=>{setSettingsTab("settings");setShowSettings(true);}}
                style={{width:36,height:36,borderRadius:8,border:"none",background:"transparent",cursor:"pointer",color:T.textMuted,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}
                onMouseEnter={e=>{e.currentTarget.style.background=T.bg;e.currentTarget.style.color=T.text;}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=T.textMuted;}}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
              </button>
            </div>

            {/* Watchlist — collapses with smooth transition */}
            <div style={{
              width:showWatchlist?248:0,
              flexShrink:0,
              overflow:"hidden",
              borderRadius:14,
              transition:"width 0.22s cubic-bezier(0.4,0,0.2,1)",
            }}>
              <div style={{width:248,height:"100%",border:`1px solid ${T.border}`,borderRadius:14,overflow:"hidden"}}>
                <Watchlist ticker={ticker} setTicker={setTicker} liveQuotes={liveQuotes} watchlistTickers={watchlistTickers} onAdd={addToWatchlist} onRemove={removeFromWatchlist} onAtLimit={()=>setShowSettings(true)} isPremium={isPremium} freeLimit={FREE_WATCHLIST_LIMIT} T={T}/>
              </div>
            </div>

            {/* Toggle tab — sits on the border between watchlist and chart */}
            <div style={{
              position:"absolute",
              left:showWatchlist?300:52,
              top:"50%",
              transform:"translateY(-50%)",
              zIndex:50,
              transition:"left 0.22s cubic-bezier(0.4,0,0.2,1)",
            }}>
              <button
                onClick={()=>setShowWatchlist(v=>!v)}
                title={showWatchlist?"Collapse watchlist":"Expand watchlist"}
                style={{
                  width:16,
                  height:48,
                  background:T.surface,
                  border:`1px solid ${T.border}`,
                  borderRadius:"0 6px 6px 0",
                  borderLeft:"none",
                  cursor:"pointer",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  color:T.textMuted,
                  padding:0,
                  boxShadow:"2px 0 6px rgba(15,23,42,0.06)",
                  transition:"background 0.12s, color 0.12s",
                }}
                onMouseEnter={e=>{e.currentTarget.style.background=T.surfaceRaised||"#F8FAFC";e.currentTarget.style.color=T.text;}}
                onMouseLeave={e=>{e.currentTarget.style.background=T.surface;e.currentTarget.style.color=T.textMuted;}}>
                {showWatchlist
                  ? <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
                  : <svg width="8" height="8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                }
              </button>
            </div>

            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0,borderRadius:14,border:`1px solid ${T.border}`,background:T.surface}}>
              <div style={{flex:1,overflow:"hidden",minHeight:0}}>
                <TradingChart ticker={ticker} stock={stock} T={T} dark={dark} alertsOpen={chartAlertsOpen} onAlertsToggle={()=>setChartAlertsOpen(v=>!v)} isPremium={isPremium} onAddToWatchlist={addToWatchlist}/>
              </div>
              <BottomTabs ticker={ticker} stock={stock} T={T} analysts={analystData[ticker]}/>
            </div>
            <div style={{width:308,flexShrink:0,overflow:"hidden",display:"flex",flexDirection:"column",background:T.surface,borderRadius:14,border:`1px solid ${T.border}`}}>
              <MarketSnapshot ticker={ticker} stock={stock} T={T} dark={dark} isPremium={isPremium} onUpgrade={()=>setShowSettings(true)} analysts={analystData[ticker]}/>
            </div>
          </div>
        <div style={{display:page==="scanner"?"block":"none",borderRadius:14,overflow:"hidden",height:"100%",border:`1px solid ${T.border}`}}>
          <ScannerPage T={T} dark={dark} isPremium={isPremium} onSelect={tk=>{setTicker(tk);setPage("chart");}}/>
        </div>
        {page==="backtest"&&(
          <div style={{height:"100%",overflow:"hidden"}}>
            <BacktestPage T={T} dark={dark} isPremium={isPremium}/>
          </div>
        )}
      </div>

      <MarketBar T={T}/>

      {/* ── Onboarding modal — first launch only ── */}
      {showOnboarding&&<OnboardingModal T={T} onClose={()=>{setShowOnboarding(false);localStorage.setItem("chartwiz-onboarded","1");}}/>}

      {/* ── Keyboard shortcuts modal ── */}
      {showShortcuts&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:10000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowShortcuts(false)}>
          <div style={{background:T.surface,borderRadius:14,width:"min(440px,94vw)",boxShadow:"0 24px 60px rgba(0,0,0,0.3)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:15,fontWeight:700,color:T.text}}>Keyboard Shortcuts</span>
              <button onClick={()=>setShowShortcuts(false)} style={{background:"none",border:"none",cursor:"pointer",color:T.textMuted,fontSize:18}}>×</button>
            </div>
            <div style={{padding:"12px 24px 24px",display:"flex",flexDirection:"column",gap:2}}>
              {[
                ["Chart Navigation",""],
                ["Scroll","Zoom in / out"],
                ["Click + drag","Pan chart"],
                ["",""],
                ["Drawing Tools",""],
                ["Ctrl/Cmd + Z","Undo"],
                ["Ctrl/Cmd + Shift + Z","Redo"],
                ["Delete / Backspace","Delete selected drawing"],
                ["Escape","Deselect / cancel text input"],
                ["",""],
                ["General",""],
                ["?","Show / hide this panel"],
                ["Ctrl/Cmd + ,","Open settings"],
              ].map(([key,desc],i)=>{
                if(!key&&!desc)return <div key={i} style={{height:8}}/>;
                if(!desc)return <div key={i} style={{fontSize:10,fontWeight:700,color:T.textMuted,letterSpacing:"0.06em",textTransform:"uppercase",padding:"8px 0 4px"}}>{key}</div>;
                return(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 8px",borderRadius:6,background:T.bg}}>
                    <span style={{fontSize:12,color:T.textMuted}}>{desc}</span>
                    <kbd style={{fontSize:11,fontWeight:600,color:T.text,background:T.surface,border:`1px solid ${T.border}`,borderRadius:5,padding:"2px 8px",fontFamily:"monospace"}}>{key}</kbd>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Settings / Profile full-page modal ── */}
      {showSettings&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>{setShowSettings(false);setLicenseStatus("");}}>
          <div style={{background:T.surface,borderRadius:16,width:"min(900px,96vw)",height:"min(620px,92vh)",boxShadow:"0 32px 80px rgba(0,0,0,0.3)",display:"flex",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

            {/* Left sidebar */}
            <div style={{width:200,flexShrink:0,background:T.bg,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",padding:"24px 12px"}}>
              {/* Avatar + name */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"0 0 20px",borderBottom:`1px solid ${T.border}`,marginBottom:12}}>
                <div style={{width:56,height:56,borderRadius:"50%",background:avatarColor(userName),display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:18,fontWeight:700,color:"#fff"}}>{getInitials(userName)}</span>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:13,fontWeight:600,color:T.text,letterSpacing:"-0.01em"}}>{userName}</div>
                  {userEmail&&<div style={{fontSize:11,color:T.textMuted,marginTop:1}}>{userEmail}</div>}
                </div>
                {isPremium&&<span style={{fontSize:10,fontWeight:700,color:"#16A34A",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:20,padding:"2px 10px"}}>Pro</span>}
              </div>

              {[
                {id:"profile",  label:"Profile",    icon:<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>},
                {id:"membership",label:"Membership", icon:<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>},
                {id:"settings", label:"Settings",   icon:<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>},
                {id:"legal",    label:"Legal",      icon:<svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>},
              ].map(({id,label,icon})=>(
                <button key={id} onClick={()=>setSettingsTab(id)}
                  style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",width:"100%",marginBottom:2,background:settingsTab===id?T.accentLight:"transparent",color:settingsTab===id?T.accent:T.textMuted,fontSize:12,fontWeight:settingsTab===id?600:400,fontFamily:T.ui,transition:"all 0.1s"}}
                  onMouseEnter={e=>{if(settingsTab!==id)e.currentTarget.style.background=T.surface;}}
                  onMouseLeave={e=>{if(settingsTab!==id)e.currentTarget.style.background="transparent";}}>
                  {icon}{label}
                </button>
              ))}

              <div style={{flex:1}}/>
              <button onClick={()=>{setShowSettings(false);setLicenseStatus("");}}
                style={{display:"flex",alignItems:"center",gap:8,padding:"9px 12px",borderRadius:8,border:"none",cursor:"pointer",background:"transparent",color:T.textMuted,fontSize:12,fontFamily:T.ui,width:"100%"}}
                onMouseEnter={e=>e.currentTarget.style.background=T.surface}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>Close
              </button>
            </div>

            {/* Right content */}
            <div style={{flex:1,overflowY:"auto",padding:"28px 32px"}}>

              {/* ── Profile tab ── */}
              {settingsTab==="profile"&&(
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:4}}>Your Profile</div>
                  <div style={{fontSize:13,color:T.textMuted,marginBottom:24}}>Personalize your ChartWiz account.</div>

                  {/* Big avatar */}
                  <div style={{display:"flex",alignItems:"center",gap:20,marginBottom:28,padding:"20px 24px",background:T.bg,borderRadius:12,border:`1px solid ${T.border}`}}>
                    <div style={{width:72,height:72,borderRadius:"50%",background:avatarColor(userName),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:26,fontWeight:700,color:"#fff"}}>{getInitials(userName)}</span>
                    </div>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,color:T.text}}>{userName||"Your Name"}</div>
                      <div style={{fontSize:12,color:T.textMuted,marginTop:3}}>{userEmail||"No email set"}</div>
                      <div style={{fontSize:11,color:T.textMuted,marginTop:6}}>Avatar is generated from your name — colors update automatically.</div>
                    </div>
                  </div>

                  <div style={{display:"flex",flexDirection:"column",gap:16}}>
                    <div>
                      <label style={{fontSize:12,fontWeight:600,color:T.text,display:"block",marginBottom:6}}>Display Name</label>
                      <input value={userName} onChange={e=>setUserName(e.target.value)}
                        placeholder="Your full name"
                        style={{width:"100%",height:38,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,color:T.text,background:T.bg,outline:"none",fontFamily:T.ui,boxSizing:"border-box"}}/>
                    </div>
                    <div>
                      <label style={{fontSize:12,fontWeight:600,color:T.text,display:"block",marginBottom:6}}>Email Address</label>
                      <input value={userEmail} onChange={e=>setUserEmail(e.target.value)}
                        type="email" placeholder="you@example.com"
                        style={{width:"100%",height:38,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:13,color:T.text,background:T.bg,outline:"none",fontFamily:T.ui,boxSizing:"border-box"}}/>
                    </div>
                    <button onClick={saveProfile}
                      style={{height:38,padding:"0 20px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",alignSelf:"flex-start"}}>
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* ── Membership tab ── */}
              {settingsTab==="membership"&&(
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:4}}>Membership</div>
                  <div style={{fontSize:13,color:T.textMuted,marginBottom:24}}>Your current plan and available features.</div>

                  {/* Plan card */}
                  <div style={{padding:"18px 22px",borderRadius:12,border:`2px solid ${isPremium?"#16A34A":T.border}`,background:isPremium?"#F0FDF4":T.bg,marginBottom:24}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:isPremium?"#16A34A":T.textMuted,marginBottom:4}}>{isPremium?"ChartWiz Pro":"ChartWiz Free"}</div>
                        <div style={{fontSize:22,fontWeight:800,color:T.text,letterSpacing:"-0.02em"}}>{isPremium?"$6.99 / mo":"$0 / mo"}</div>
                      </div>
                      <div style={{width:48,height:48,borderRadius:12,background:isPremium?"#16A34A":T.border,display:"flex",alignItems:"center",justifyContent:"center"}}>
                        {isPremium
                          ?<svg width="22" height="22" fill="#fff" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                          :<svg width="22" height="22" fill="none" stroke={T.textMuted} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
                        }
                      </div>
                    </div>
                  </div>

                  {/* Feature comparison */}
                  <div style={{borderRadius:10,border:`1px solid ${T.border}`,overflow:"hidden",marginBottom:24}}>
                    {[
                      ["Watchlist stocks",        "3 stocks",           "Unlimited"],
                      ["AI chat",                  "2 per day",          "Unlimited (Sonnet)"],
                      ["Price alerts",             "2 alerts",           "Unlimited"],
                      ["Scanner",                  "1 scan / week",      "Unlimited scans"],
                      ["OS notifications",         "Included",           "Included"],
                      ["Chart drawings",           "Included",           "Included"],
                    ].map(([feat,free,pro],i)=>(
                      <div key={feat} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"10px 16px",borderBottom:i<5?`1px solid ${T.borderLight}`:"none",background:i%2===0?T.bg:T.surface,alignItems:"center"}}>
                        <span style={{fontSize:12,color:T.text}}>{feat}</span>
                        <span style={{fontSize:12,color:isPremium?T.textMuted:T.accent,fontWeight:isPremium?400:600}}>{free}</span>
                        <span style={{fontSize:12,color:isPremium?T.pos:T.textMuted,fontWeight:isPremium?600:400}}>{pro}</span>
                      </div>
                    ))}
                  </div>

                  {!isPremium&&(
                    <button onClick={()=>inElectron()?window.open("https://chartwiz.app/#pricing"):null}
                      style={{width:"100%",height:42,borderRadius:10,border:"none",background:T.accent,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:"-0.01em"}}>
                      Upgrade to Pro — $6.99 / mo
                    </button>
                  )}
                  {isPremium&&(
                    <div style={{fontSize:12,color:T.textMuted,textAlign:"center"}}>
                      To manage your subscription, visit your account portal or contact support@chartwiz.app
                    </div>
                  )}
                </div>
              )}

              {/* ── Settings tab ── */}
              {settingsTab==="settings"&&(
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:4}}>App Settings</div>
                  <div style={{fontSize:13,color:T.textMuted,marginBottom:24}}>Customize your ChartWiz experience.</div>

                  {/* Theme */}
                  <div style={{marginBottom:20,padding:"16px 18px",background:T.bg,borderRadius:10,border:`1px solid ${T.border}`}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:600,color:T.text,marginBottom:2}}>Appearance</div>
                        <div style={{fontSize:12,color:T.textMuted}}>{dark?"Dark mode":"Light mode"}</div>
                      </div>
                      <button onClick={()=>setDark(d=>!d)}
                        style={{height:34,padding:"0 16px",borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
                        {dark
                          ?<><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>Switch to Light</>
                          :<><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>Switch to Dark</>
                        }
                      </button>
                    </div>
                  </div>

                  {/* License Key */}
                  <div style={{marginBottom:20}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <svg width="13" height="13" fill="none" stroke={isPremium?"#16A34A":T.accent} strokeWidth="2" viewBox="0 0 24 24"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                      <span style={{fontSize:13,fontWeight:600,color:T.text}}>License Key</span>
                      {isPremium&&<span style={{fontSize:10,fontWeight:700,color:"#16A34A",background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:20,padding:"1px 8px"}}>Active</span>}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      <input value={licenseKey} onChange={e=>setLicenseKey(e.target.value)}
                        placeholder="CW-XXXX-XXXX-XXXX"
                        style={{flex:1,height:36,padding:"0 12px",borderRadius:8,border:`1px solid ${licenseStatus==="error"?"#EF4444":licenseStatus==="ok"?"#16A34A":T.border}`,fontSize:12,color:T.text,background:T.bg,outline:"none",fontFamily:"monospace"}}/>
                      <button onClick={saveLicense} style={{height:36,padding:"0 14px",borderRadius:8,border:"none",background:T.accent,color:"#fff",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                        {licenseStatus==="ok"?"✓ Active":"Activate"}
                      </button>
                    </div>
                    {licenseStatus==="error"&&<p style={{fontSize:11,color:"#EF4444",marginTop:5}}>Invalid license key.</p>}
                  </div>

                  {/* Anthropic API Key */}
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <svg width="13" height="13" fill="none" stroke={T.accent} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <span style={{fontSize:13,fontWeight:600,color:T.text}}>Anthropic API Key</span>
                      <span style={{fontSize:10,color:T.textMuted,background:T.bg,border:`1px solid ${T.border}`,borderRadius:20,padding:"1px 8px"}}>Optional</span>
                    </div>
                    <p style={{fontSize:12,color:T.textMuted,marginBottom:8,lineHeight:1.5}}>Your personal key for AI chat. Stored locally on your device only.</p>
                    <div style={{display:"flex",gap:8}}>
                      <input value={anthropicKey} onChange={e=>setAnthropicKey(e.target.value)}
                        type="password" placeholder="sk-ant-..."
                        style={{flex:1,height:36,padding:"0 12px",borderRadius:8,border:`1px solid ${T.border}`,fontSize:12,color:T.text,background:T.bg,outline:"none",fontFamily:"monospace"}}/>
                      <button onClick={saveAnthropicKey} style={{height:36,padding:"0 14px",borderRadius:8,border:`1px solid ${T.border}`,background:T.surface,color:T.text,fontSize:12,cursor:"pointer"}}>Save</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Legal tab ── */}
              {settingsTab==="legal"&&(
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:T.text,letterSpacing:"-0.02em",marginBottom:4}}>Legal & Compliance</div>
                  <div style={{fontSize:13,color:T.textMuted,marginBottom:20}}>Please read these disclosures carefully.</div>

                  {/* Educational disclaimer — most important, styled prominently */}
                  <div style={{padding:"16px 18px",borderRadius:10,background:dark?"#2D1F00":"#FFFBEB",border:`1px solid ${dark?"#5C3D00":"#FDE68A"}`,marginBottom:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                      <svg width="14" height="14" fill="none" stroke="#D97706" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span style={{fontSize:13,fontWeight:700,color:T.text}}>Educational Use Only</span>
                    </div>
                    <p style={{fontSize:12,color:T.text,lineHeight:1.7,margin:0}}>
                      ChartWiz is a <strong>financial education tool</strong> designed to help users learn about chart reading and technical analysis. It does <strong>not</strong> provide financial advice, investment recommendations, or trading signals. All analysis, AI responses, and data displayed are for informational and educational purposes only.
                    </p>
                  </div>

                  {[
                    {title:"Risk Disclosure",body:"Trading and investing in securities involves substantial risk of loss and is not appropriate for everyone. Past performance is not indicative of future results. You may lose some or all of your invested capital. Never trade with money you cannot afford to lose."},
                    {title:"Not Financial Advice",body:"Nothing in ChartWiz constitutes financial, investment, tax, or legal advice. ChartWiz LLC is not a registered investment adviser, broker-dealer, or financial planner. Always consult a qualified financial professional before making investment decisions."},
                    {title:"Data Accuracy",body:"Market data is sourced from Yahoo Finance and may be delayed, inaccurate, or incomplete. ChartWiz makes no warranty regarding the accuracy, completeness, or timeliness of any data displayed. Do not rely solely on this data for trading decisions."},
                    {title:"AI Disclaimer",body:"AI-generated analysis is produced by large language models and is inherently probabilistic. It may contain errors, outdated information, or hallucinated content. All AI responses are observational and educational only — never directional trading advice."},
                  ].map(({title,body})=>(
                    <div key={title} style={{marginBottom:14,padding:"14px 16px",background:T.bg,borderRadius:10,border:`1px solid ${T.border}`}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.text,marginBottom:6}}>{title}</div>
                      <p style={{fontSize:12,color:T.textMuted,lineHeight:1.65,margin:0}}>{body}</p>
                    </div>
                  ))}

                  <div style={{display:"flex",gap:12,marginTop:8,paddingTop:16,borderTop:`1px solid ${T.border}`}}>
                    {[["Terms of Service","https://chartwiz.app/terms.html"],["Privacy Policy","https://chartwiz.app/privacy.html"],["Support","mailto:support@chartwiz.app"]].map(([label,href])=>(
                      <a key={label} href={href} style={{fontSize:12,color:T.accent,textDecoration:"none",fontWeight:500}}
                        onClick={e=>{e.preventDefault();if(inElectron())window.open(href);}}>
                        {label} →
                      </a>
                    ))}
                    <span style={{marginLeft:"auto",fontSize:11,color:T.textMuted}}>ChartWiz v1.0.0</span>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ChartWiz(){
  return <ErrorBoundary><ChartWizInner/></ErrorBoundary>;
}
