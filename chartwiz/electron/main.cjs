'use strict';

const { app, BrowserWindow, ipcMain, shell, Notification } = require('electron');
const path = require('path');
const fs   = require('fs');
const isMac = process.platform === 'darwin';

// ── Persist settings (API key, etc.) to userData/settings.json ───────────────
function settingsPath() {
  return path.join(app.getPath('userData'), 'chartwiz-settings.json');
}
function loadSettings() {
  try { return JSON.parse(fs.readFileSync(settingsPath(),'utf8')); } catch { return {}; }
}
function saveSettings(data) {
  fs.writeFileSync(settingsPath(), JSON.stringify(data, null, 2));
}

const isDev = !app.isPackaged;

// ── Window ────────────────────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  const iconPath = path.join(__dirname, '../assets/icon.png');
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    // Frameless — custom title bar drawn in React
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 16, y: 18 } }
      : { frame: false }),
    backgroundColor: '#ffffff',
    show: false,
    ...(fs.existsSync(iconPath) ? { icon: iconPath } : {}),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Notify renderer when window is maximized / restored
  mainWindow.on('maximize',   () => mainWindow.webContents.send('window:maximized', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:maximized', false));
}

// ── IPC: frameless window controls ───────────────────────────────────────────
ipcMain.handle('window:minimize',    () => mainWindow?.minimize());
ipcMain.handle('window:maximize',    () => { mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize(); });
ipcMain.handle('window:close',       () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// ── Yahoo Finance — direct API (no crumb needed) ──────────────────────────────
// Uses the v8/finance/chart endpoint which returns both OHLCV bars AND the
// current quote price without requiring a crumb token.

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://finance.yahoo.com/',
  'Origin': 'https://finance.yahoo.com',
};

async function yfFetch(url) {
  const res = await fetch(url, { headers: YF_HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

// Yahoo Finance crumb auth — required for quoteSummary and other restricted endpoints
let _yfCrumb = null;
let _yfCookies = '';
let _yfCrumbExpiry = 0;

async function ensureYFAuth() {
  if (_yfCrumb && Date.now() < _yfCrumbExpiry) return;
  try {
    // Step 1: grab cookies
    const r1 = await fetch('https://fc.yahoo.com/v1/test/solicit?b=2', { headers: YF_HEADERS });
    _yfCookies = (r1.headers.get('set-cookie') || '')
      .split(',').map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
    // Step 2: exchange cookies for crumb
    const r2 = await fetch('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      headers: { ...YF_HEADERS, Cookie: _yfCookies },
    });
    _yfCrumb = (await r2.text()).trim();
    _yfCrumbExpiry = Date.now() + 50 * 60 * 1000; // valid ~55 min, refresh at 50
    console.log('[main] YF auth ok, crumb:', _yfCrumb.slice(0, 6) + '…');
  } catch (e) {
    console.warn('[main] YF auth failed:', e.message);
    _yfCrumb = '';
  }
}

async function yfFetchAuthed(url) {
  await ensureYFAuth();
  const sep = url.includes('?') ? '&' : '?';
  const full = _yfCrumb ? `${url}${sep}crumb=${encodeURIComponent(_yfCrumb)}` : url;
  const res = await fetch(full, {
    headers: { ...YF_HEADERS, ...(_yfCookies ? { Cookie: _yfCookies } : {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return res.json();
}

// Timeframe → Yahoo Finance interval + range
const TF_OPTIONS = {
  '1D':  { interval: '5m',  range: '1d'  },
  '1W':  { interval: '15m', range: '5d'  },
  '1M':  { interval: '60m', range: '1mo' },
  '3M':  { interval: '1d',  range: '3mo' },
  '6M':  { interval: '1d',  range: '6mo' },
  'YTD': { interval: '1d',  range: 'ytd' },
  '1Y':  { interval: '1d',  range: '1y'  },
  '5Y':  { interval: '1wk', range: '5y'  },
  'MAX': { interval: '1mo', range: 'max' },
};

// ── IPC: OHLCV bars ───────────────────────────────────────────────────────────
ipcMain.handle('yf:chart', async (_evt, symbol, tf) => {
  try {
    const { interval, range } = TF_OPTIONS[tf] || TF_OPTIONS['1D'];
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}&includePrePost=false`;
    const json = await yfFetch(url);
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error('No data returned');

    const timestamps = result.timestamp || [];
    const ohlcv = result.indicators?.quote?.[0] || {};
    const bars = timestamps.map((t, i) => ({
      open:  ohlcv.open?.[i],
      close: ohlcv.close?.[i],
      high:  ohlcv.high?.[i],
      low:   ohlcv.low?.[i],
      vol:   ohlcv.volume?.[i] ?? 0,
      time:  new Date(t * 1000).toISOString(),
      up:    (ohlcv.close?.[i] ?? 0) >= (ohlcv.open?.[i] ?? 0),
    })).filter(b => b.open != null && b.close != null);

    console.log(`[main] chart ok: ${symbol} ${tf} — ${bars.length} bars`);
    return { ok: true, bars };
  } catch (err) {
    console.error('[main] chart error:', symbol, err.message);
    return { ok: false, error: err.message };
  }
});

// ── IPC: live quote ───────────────────────────────────────────────────────────
ipcMain.handle('yf:quote', async (_evt, symbol) => {
  try {
    // Use the chart endpoint with range=1d — the meta block contains current price
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const json = await yfFetch(url);
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error('No meta in response');

    const price  = meta.regularMarketPrice;
    const prev   = meta.chartPreviousClose || meta.previousClose || price;
    const change = prev ? +((price - prev) / prev * 100).toFixed(2) : 0;

    console.log(`[main] quote ok: ${symbol} $${price} (${change}%)`);
    return {
      ok: true,
      data: {
        price,
        change,
        open:   meta.regularMarketOpen  ?? price,
        high:   meta.regularMarketDayHigh ?? price,
        low:    meta.regularMarketDayLow  ?? price,
        vol:    meta.regularMarketVolume  ?? 0,
        name:        meta.longName || meta.shortName || symbol,
        marketState: meta.marketState || 'CLOSED',
      },
    };
  } catch (err) {
    console.error('[main] quote error:', symbol, err.message);
    return { ok: false, error: err.message };
  }
});

// ── IPC: symbol search ────────────────────────────────────────────────────────
ipcMain.handle('yf:search', async (_evt, query) => {
  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const json = await yfFetch(url);
    const hits = (json?.quotes || [])
      .filter(r => r.symbol && r.quoteType !== 'NONE')
      .slice(0, 10)
      .map(r => ({ symbol: r.symbol, name: r.longname || r.shortname || '', type: r.quoteType }));
    return { ok: true, hits };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// ── IPC: analyst recommendations ─────────────────────────────────────────────
ipcMain.handle('yf:analysts', async (_evt, symbol) => {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=recommendationTrend`;
    const json = await yfFetchAuthed(url);
    const trend = json?.quoteSummary?.result?.[0]?.recommendationTrend?.trend;
    if (!trend?.length) throw new Error('No analyst data');

    // Use the most recent period (0m = current month)
    const cur = trend.find(t => t.period === '0m') || trend[0];
    const totalBuy  = (cur.strongBuy  || 0) + (cur.buy  || 0);
    const hold      =  cur.hold  || 0;
    const totalSell = (cur.strongSell || 0) + (cur.sell || 0);
    const total     = totalBuy + hold + totalSell;
    if (total === 0) throw new Error('No ratings available');

    const buyPct  = Math.round((totalBuy  / total) * 100);
    const holdPct = Math.round((hold      / total) * 100);
    const sellPct = 100 - buyPct - holdPct;
    const rating  = buyPct >= 60 ? 'Buy' : sellPct >= 40 ? 'Sell' : 'Hold';

    console.log(`[main] analysts ok: ${symbol} buy:${totalBuy} hold:${hold} sell:${totalSell}`);
    return { ok: true, data: { buy: totalBuy, hold, sell: totalSell, total, buyPct, holdPct, sellPct, rating } };
  } catch (err) {
    console.error('[main] analysts error:', symbol, err.message);
    return { ok: false, error: err.message };
  }
});

// ── IPC: OS desktop notification (price alerts) ───────────────────────────────
ipcMain.handle('alert:notify', (_evt, { title, body }) => {
  if (!Notification.isSupported()) return;
  new Notification({ title, body, silent: false }).show();
});

// ── IPC: settings (get/set API key) ──────────────────────────────────────────
ipcMain.handle('settings:get', () => loadSettings());
ipcMain.handle('settings:set', (_evt, data) => { saveSettings({...loadSettings(),...data}); return true; });

// Set your Anthropic API key here so all users can access AI without entering their own.
// Get one at https://console.anthropic.com — free tier available.
const CHARTWIZ_AI_KEY = '';

// ── IPC: Anthropic AI chat (proxied through main to avoid CORS) ───────────────
ipcMain.handle('ai:chat', async (_evt, { messages, systemPrompt, premium }) => {
  const settings = loadSettings();
  const apiKey   = settings.anthropicKey || CHARTWIZ_AI_KEY || process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) return { ok: false, error: 'AI key not set up yet. Add your Anthropic API key in Settings → App Settings.' };

  // Premium users get Claude Sonnet (smarter, more detailed) with higher token budget
  const model     = premium ? 'claude-sonnet-4-6'       : 'claude-haiku-4-5-20251001';
  const maxTokens = premium ? 600                        : 180;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system:     systemPrompt,
        messages,
      }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    const text = data.content?.find(b => b.type === 'text')?.text || '';
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
