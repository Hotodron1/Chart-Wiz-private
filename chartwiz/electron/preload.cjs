'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, typed API to the React renderer.
// Nothing from Node/Electron leaks into the renderer beyond these methods.
contextBridge.exposeInMainWorld('chartWizAPI', {
  // Fetch OHLCV bars  — returns { ok, bars } or { ok:false, error }
  fetchChart: (symbol, tf) => ipcRenderer.invoke('yf:chart', symbol, tf),

  // Fetch live quote  — returns { ok, data } or { ok:false, error }
  fetchQuote: (symbol)    => ipcRenderer.invoke('yf:quote', symbol),

  // Search symbols   — returns { ok, hits } or { ok:false, error }
  search: (query)         => ipcRenderer.invoke('yf:search', query),

  // Analyst ratings  — returns { ok, data } or { ok:false, error }
  fetchAnalysts: (symbol) => ipcRenderer.invoke('yf:analysts', symbol),

  // OS desktop notification for price alerts
  notify: (title, body) => ipcRenderer.invoke('alert:notify', { title, body }),

  // Frameless window controls
  windowMinimize:    ()   => ipcRenderer.invoke('window:minimize'),
  windowMaximize:    ()   => ipcRenderer.invoke('window:maximize'),
  windowClose:       ()   => ipcRenderer.invoke('window:close'),
  windowIsMaximized: ()   => ipcRenderer.invoke('window:isMaximized'),
  onWindowMaximize:  (cb) => ipcRenderer.on('window:maximized', (_,v) => cb(v)),

  // AI chat via Anthropic (proxied to avoid CORS)
  aiChat: (payload)       => ipcRenderer.invoke('ai:chat', payload),

  // Settings (API key storage)
  getSettings: ()         => ipcRenderer.invoke('settings:get'),
  setSettings: (data)     => ipcRenderer.invoke('settings:set', data),

  // Detect we're inside Electron
  isElectron: true,
});
