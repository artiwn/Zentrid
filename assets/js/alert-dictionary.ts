type AlertDictionaryTab = 'overview' | 'codes' | 'vendor' | 'bindings';
type AlertDictionaryTone = 'danger' | 'warning' | 'neutral' | 'success';

interface AlertDictionaryCounts {
  canonical_alerts?: number;
  vendor_mappings?: number;
}

interface AlertCanonicalUiBinding {
  code_field_key?: string;
  category_field_key?: string;
  name_field_key?: string;
  mapped_vendor_record_count?: number;
}

interface AlertCanonicalRecord {
  zentrid_alert_code: string;
  zentrid_alert_name: string;
  category: string;
  description?: string;
  ui_binding?: AlertCanonicalUiBinding;
}

interface AlertMappingRecord {
  mapping_id?: string;
  zentrid_alert?: {
    code?: string;
    name?: string;
    category?: string;
  };
  source_alert?: {
    vendor?: string;
    code?: string;
    name?: string;
    description?: string;
    severity?: string;
    recommended_action?: string;
    probable_cause?: string;
    device_family?: string;
  };
  ui_fields?: Record<string, string>;
}

interface AlertDictionaryData {
  counts?: AlertDictionaryCounts;
  canonical_alerts?: AlertCanonicalRecord[];
  vendor_mappings?: AlertMappingRecord[];
}

interface AlertDictionaryStateModel {
  tab: AlertDictionaryTab;
  group: string;
  severity: string;
  q: string;
  data: AlertDictionaryData | null;
}


const AlertDictionaryState: AlertDictionaryStateModel = { tab: 'overview', group: 'All', severity: 'All', q: '', data: null };
const ALERT_JSON_PATH = '../assets/data/Zentrid_Canonical_Alerts_UI_Ready_v1.json';
function alertDictEsc(value: unknown): string { const entities: Record<string, string> = {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}; return String(value ?? '').replace(/[&<>'"]/g, (c: string) => entities[c] ?? c); }
function alertDictTone(value: unknown): AlertDictionaryTone { const v=String(value||'').toLowerCase(); if(v.includes('critical')) return 'danger'; if(v.includes('fault')||v.includes('high')) return 'warning'; if(v.includes('warn')||v.includes('medium')) return 'neutral'; return 'success'; }
function alertDictTitleBlock(title: string, desc: string, action = ''): string { return `<div class="section-title-v17"><div><h2>${alertDictEsc(title)}</h2><p class="muted">${alertDictEsc(desc)}</p></div>${action}</div>`; }
async function loadAlertDictionary(): Promise<void> {
  try {
    const res = await fetch(ALERT_JSON_PATH, {cache:'no-store'});
    AlertDictionaryState.data = await res.json();
  } catch(err) {
    AlertDictionaryState.data = {counts:{canonical_alerts:0,vendor_mappings:0}, canonical_alerts:[], vendor_mappings:[]};
    console.error('Cannot load Zentrid alert dictionary', err);
  }
  renderPage();
}
function alertDictCanonical(): AlertCanonicalRecord[] { return AlertDictionaryState.data?.canonical_alerts || []; }
function alertDictMappings(): AlertMappingRecord[] { return AlertDictionaryState.data?.vendor_mappings || []; }
function vendorCountFor(code: string): number { return alertDictMappings().filter(m=>m.zentrid_alert?.code===code).length; }
function uniqueVendorsFor(code: string): string[] { return [...new Set(alertDictMappings().filter(m=>m.zentrid_alert?.code===code).map(m => m.source_alert?.vendor).filter((vendor): vendor is string => Boolean(vendor)))]; }
function severityFor(code: string): string {
  const sevs = alertDictMappings().filter(m=>m.zentrid_alert?.code===code).map(m=>String(m.source_alert?.severity||'').toLowerCase());
  if(sevs.some(s=>s.includes('critical'))) return 'Critical';
  if(sevs.some(s=>s.includes('high')||s.includes('fault'))) return 'Fault';
  if(sevs.some(s=>s.includes('medium')||s.includes('warning'))) return 'Warning';
  return 'Info';
}
function alertDictGroups(): string[] { return ['All', ...new Set(alertDictCanonical().map(a => a.category).filter((category): category is string => Boolean(category)).sort())]; }
function filteredCodes(): AlertCanonicalRecord[] {
  const q=AlertDictionaryState.q.toLowerCase().trim();
  return alertDictCanonical().filter(a => (AlertDictionaryState.group==='All'||a.category===AlertDictionaryState.group))
    .filter(a => AlertDictionaryState.severity==='All'||severityFor(a.zentrid_alert_code)===AlertDictionaryState.severity)
    .filter(a => !q || [a.zentrid_alert_code,a.zentrid_alert_name,a.category,...uniqueVendorsFor(a.zentrid_alert_code)].join(' ').toLowerCase().includes(q));
}
function renderOverview(): string {
  const c=AlertDictionaryState.data?.counts||{};
  const vendors=[...new Set(alertDictMappings().map(m=>m.source_alert?.vendor).filter(Boolean))].sort();
  const catCount=alertDictGroups().length-1;
  return `${alertDictTitleBlock('Zentrid Alert Dictionary','Canonical alert taxonomy loaded from Alert Mapping Registry. No local mock codes are used on this page.')}
  <section class="kpi-grid compact-kpis alert-dict-kpis-v95"><article class="kpi-card cyan"><span>Canonical Alerts</span><strong>${c.canonical_alerts||alertDictCanonical().length}</strong><small>Zentrid high-level alert buckets</small></article><article class="kpi-card blue"><span>Vendor Mappings</span><strong>${c.vendor_mappings||alertDictMappings().length}</strong><small>source code → Zentrid code</small></article><article class="kpi-card green"><span>Vendors</span><strong>${vendors.length}</strong><small>${alertDictEsc(vendors.join(' · '))}</small></article><article class="kpi-card yellow"><span>Categories</span><strong>${catCount}</strong><small>GRID · PV · BATTERY · INVERTER...</small></article></section>
  <div class="normalization-empty-grid">${alertDictGroups().filter(g=>g!=='All').map(g=>`<article data-group="${alertDictEsc(g)}"><strong>${alertDictEsc(g)}</strong><small>${alertDictCanonical().filter(a=>a.category===g).length} Zentrid alerts · ${alertDictMappings().filter(m=>m.zentrid_alert?.category===g).length} vendor mappings</small></article>`).join('')}</div>`;
}
function renderFilters(): string { return `<section class="filter-panel compact-filter-panel"><label>Category<select id="dictGroupFilter">${alertDictGroups().map(g=>`<option ${AlertDictionaryState.group===g?'selected':''}>${alertDictEsc(g)}</option>`).join('')}</select></label><label>Severity<select id="dictSeverityFilter">${['All','Critical','Fault','Warning','Info'].map(s=>`<option ${AlertDictionaryState.severity===s?'selected':''}>${s}</option>`).join('')}</select></label><label>Search<input id="dictSearch" value="${alertDictEsc(AlertDictionaryState.q)}" placeholder="Zentrid code, vendor, category..." /></label><button class="secondary-action" id="dictReset" type="button">Reset</button></section>`; }
function renderCodes(): string {
  return `${alertDictTitleBlock('Canonical Zentrid Alerts','Each row is a normalized Zentrid alert code. Vendor-specific codes remain visible inside the mapping drawer.', '<button class="primary-action" id="dictExport" type="button">Export</button>')}${renderFilters()}<div class="data-table alert-dictionary-table-v95"><div class="data-head"><span>Zentrid Code</span><span>Zentrid Alert Name</span><span>Category</span><span>Severity</span><span>Vendor Mappings</span><span>Actions</span></div>${filteredCodes().map(a=>{const sev=severityFor(a.zentrid_alert_code); const v=uniqueVendorsFor(a.zentrid_alert_code); return `<div class="data-row dictionary-row-v95" data-code="${alertDictEsc(a.zentrid_alert_code)}"><div><strong>${alertDictEsc(a.zentrid_alert_code)}</strong><small>${alertDictEsc(a.ui_binding?.code_field_key || 'normalized_alarm_code')}</small></div><div><strong>${alertDictEsc(a.zentrid_alert_name)}</strong><small>${alertDictEsc(a.description || 'Zentrid normalized alert bucket')}</small></div><div><strong>${alertDictEsc(a.category)}</strong><small>${alertDictEsc(a.ui_binding?.category_field_key || 'alarm_category')}</small></div><span class="badge ${alertDictTone(sev)}">${sev}</span><div><strong>${vendorCountFor(a.zentrid_alert_code)}</strong><small>${alertDictEsc(v.slice(0,3).join(' · '))}${v.length>3?'...':''}</small></div><div class="row-actions"><button class="secondary-action small-btn" data-open-code="${alertDictEsc(a.zentrid_alert_code)}" type="button">Open</button></div></div>`;}).join('')}</div>`;
}
function renderVendorMappings(): string {
  const items=alertDictMappings().slice(0,150);
  return `${alertDictTitleBlock('Vendor Alert Mappings','Real vendor mappings from Alert Mapping Registry. The table keeps Zentrid fields and raw vendor fields separated.')}
  <div class="data-table alert-vendor-map-table-v95"><div class="data-head"><span>Zentrid Alert</span><span>Vendor Code</span><span>Vendor Error Name</span><span>Severity</span><span>Recommended Action</span><span>Device Family</span></div>${items.map(m=>`<div class="data-row"><div><strong>${alertDictEsc(m.zentrid_alert?.code)}</strong><small>${alertDictEsc(m.zentrid_alert?.name)}</small></div><div><strong>${alertDictEsc(m.source_alert?.vendor)} ${alertDictEsc(m.source_alert?.code)}</strong><small>${alertDictEsc(m.source_alert?.vendor)}</small></div><div><strong>${alertDictEsc(m.source_alert?.name)}</strong><small>${alertDictEsc(m.source_alert?.description).slice(0,90)}</small></div><span class="badge ${alertDictTone(m.source_alert?.severity)}">${alertDictEsc(m.source_alert?.severity || 'Info')}</span><div><strong>${alertDictEsc(m.source_alert?.recommended_action).slice(0,80)}</strong><small>${alertDictEsc(m.source_alert?.probable_cause).slice(0,70)}</small></div><div><strong>${alertDictEsc(m.source_alert?.device_family).slice(0,40)}</strong><small>${alertDictEsc(m.mapping_id)}</small></div></div>`).join('')}</div><p class="muted table-note-v95">Showing first 150 of ${alertDictMappings().length} mappings for prototype performance.</p>`;
}
function renderIntegration(): string {
  const sample=alertDictMappings()[0];
  const fields=sample?.ui_fields || {};
  return `${alertDictTitleBlock('UI Field Bindings','How Alert Dictionary is connected to Zentrid UI Dictionary. These field keys must be used by Alert List and Alert Detail.')}
  <div class="data-table alert-bindings-table-v4"><div class="data-head"><span>Data Field</span><span>UI Field</span><span>Meaning</span></div>${Object.entries(fields).map(([k,v])=>`<div class="data-row"><div><strong>${alertDictEsc(k)}</strong><small>mapped value</small></div><div><strong>${alertDictEsc(v)}</strong><small>shared UI label</small></div><div><strong>${alertDictEsc(k.includes('zentrid')?'Normalized Zentrid field':'Original vendor field')}</strong><small>single label source for frontend</small></div></div>`).join('')}</div>`;
}
function activeContent(): string { if(AlertDictionaryState.tab==='codes') return renderCodes(); if(AlertDictionaryState.tab==='vendor') return renderVendorMappings(); if(AlertDictionaryState.tab==='bindings') return renderIntegration(); return renderOverview(); }
function shell(content: string): string { return `<section class="normalization-workspace-v92"><aside class="glass-card production-side-card-v92"><h3>Alert Dictionary</h3><button class="${AlertDictionaryState.tab==='overview'?'active':''}" data-alert-dict-tab="overview">Overview</button><button class="${AlertDictionaryState.tab==='codes'?'active':''}" data-alert-dict-tab="codes">Canonical Alerts</button><button class="${AlertDictionaryState.tab==='vendor'?'active':''}" data-alert-dict-tab="vendor">Vendor Mappings</button><button class="${AlertDictionaryState.tab==='bindings'?'active':''}" data-alert-dict-tab="bindings">UI Bindings</button></aside><section class="glass-card production-main-card-v92" id="alertDictContent">${content}</section></section>`; }
function renderPage(): void { ZentridLayout.mount(`<section class="page-hero"><div><p class="eyebrow">Global Admin · Data Governance</p><h1>Alert Dictionary</h1><p class="muted">Zentrid canonical alert dictionary and source vendor mappings controlled by the normalization layer.</p></div><button class="freshness-card" onclick="ZentridLayout.toast('Alert dictionary is loaded')"><span class="pulse"></span><div><strong>v1.0.0</strong><small>28 alerts · 844 mappings</small></div></button></section>${shell(activeContent())}<aside class="detail-drawer alert-code-drawer-v95" id="alertCodeDrawer"><button class="drawer-close" type="button" id="alertCodeDrawerClose">x</button><div id="alertCodeDrawerBody"></div></aside>`); wire(); }
function wire(): void {
  document.querySelectorAll('[data-alert-dict-tab]').forEach(btn => btn.onclick = () => { AlertDictionaryState.tab = (btn as HTMLElement).dataset.alertDictTab as AlertDictionaryTab; renderPage(); });
  document.querySelectorAll('[data-group]').forEach(card => card.onclick = () => { AlertDictionaryState.group = (card as HTMLElement).dataset.group || 'All'; AlertDictionaryState.tab = 'codes'; renderPage(); });
  document.getElementById('dictGroupFilter')?.addEventListener('change', (e: Event) => { AlertDictionaryState.group = (e.target as HTMLSelectElement).value; renderPage(); });
  document.getElementById('dictSeverityFilter')?.addEventListener('change', (e: Event) => { AlertDictionaryState.severity = (e.target as HTMLSelectElement).value; renderPage(); });
  document.getElementById('dictSearch')?.addEventListener('input', (e: Event) => { AlertDictionaryState.q = (e.target as HTMLInputElement).value; setTimeout(renderPage, 80); });
  document.getElementById('dictReset')?.addEventListener('click',()=>{AlertDictionaryState.group='All';AlertDictionaryState.severity='All';AlertDictionaryState.q='';renderPage();});
  document.querySelectorAll('[data-open-code], .dictionary-row-v95').forEach(el => el.onclick = (ev: Event) => { const code = (el as HTMLElement).dataset.openCode || (el as HTMLElement).dataset.code || (el.closest('[data-code]') as HTMLElement | null)?.dataset.code; if (code) openDrawer(code); ev.stopPropagation(); });
  document.getElementById('alertCodeDrawerClose')?.addEventListener('click',()=>document.getElementById('alertCodeDrawer')?.classList.remove('open'));
}
function openDrawer(code: string): void { const a = alertDictCanonical().find(x => x.zentrid_alert_code === code); const items = alertDictMappings().filter(m => m.zentrid_alert?.code === code).slice(0, 30); const body = document.getElementById('alertCodeDrawerBody'); if (!body) return; body.innerHTML =`<p class="eyebrow">Zentrid Alert Detail</p><h2>${alertDictEsc(code)}</h2><p class="muted">${alertDictEsc(a?.zentrid_alert_name)}</p><div class="info-grid alert-code-info-v95"><div><span>Category</span><strong>${alertDictEsc(a?.category)}</strong></div><div><span>Severity</span><strong>${severityFor(code)}</strong></div><div><span>Vendor Mappings</span><strong>${vendorCountFor(code)}</strong></div><div><span>UI Field</span><strong>${alertDictEsc(a?.ui_binding?.name_field_key || 'alarm_name')}</strong></div></div><div class="section-title-v17 mini"><div><h3>Vendor Examples</h3><p class="muted">${items.map(m=>`${alertDictEsc(m.source_alert?.vendor)} ${alertDictEsc(m.source_alert?.code)} — ${alertDictEsc(m.source_alert?.name)}`).join('<br>')}</p></div></div>`; document.getElementById('alertCodeDrawer')?.classList.add('open'); }
ZentridLayout.mount('<section class="glass-card"><p class="muted">Loading Zentrid alert dictionary...</p></section>');
loadAlertDictionary();
