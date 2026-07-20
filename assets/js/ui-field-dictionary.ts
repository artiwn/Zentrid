(function(){
  type ZentridDictRecord = Record<string, unknown> & {
    field_key?: string;
    ui_key?: string;
    ui_label?: string;
    description?: string;
    entity?: string;
    category?: string;
    data_type?: string;
    unit?: string;
    used_in?: unknown[];
    screen_id?: string;
    screen_name?: string;
    section_name?: string;
    source_file?: string;
    sections?: ZentridDictRecord[];
    fields?: ZentridDictRecord[];
    vendor_mappings?: ZentridDictRecord[];
    zentrid_alert_code?: string;
    zentrid_code?: string;
    zentrid_alert_name?: string;
    zentrid_name?: string;
    zentrid_alert_ui_label?: string;
    vendor?: string;
    vendor_alert_code?: string;
    vendor_error_code?: string;
    vendor_alert_name?: string;
    vendor_error_name?: string;
    vendor_description?: string;
    vendor_recommended_action?: string;
    severity?: string;
  };
  type ZentridDictState = { tab: string; query: string; category: string; screen: string };
  type ZentridDictData = {
    fields: { fields?: ZentridDictRecord[] };
    screens: { screens?: ZentridDictRecord[] };
    alerts: { vendor_mappings?: ZentridDictRecord[]; canonical_alerts?: ZentridDictRecord[] };
  };
  const esc = (v: unknown): string => String(v ?? '').replace(/[&<>"]/g, (c: string) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c] || c));
  const unit = (u: unknown): string => u === undefined || u === null || u === '' ? '—' : String(u).replace(/^KW$/,'kW').replace(/^KWh$/,'kWh').replace(/^KWP$/,'kWp');
  let state: ZentridDictState = {tab:'fields', query:'', category:'all', screen:'all'};
  let data: ZentridDictData = { fields: {}, screens: {}, alerts: {} };
  async function load<T>(name: string): Promise<T>{ const r = await fetch('../assets/data/' + name, {cache:'no-store'}); if(!r.ok) throw new Error(name); return r.json() as Promise<T>; }
  function fieldsByKey(): Map<string, ZentridDictRecord>{ return new Map((data.fields.fields || []).map((f: ZentridDictRecord) => [String(f.field_key || ''), f])); }
  function flattenScreens(): ZentridDictRecord[]{
    return (data.screens.screens || []).flatMap((s: ZentridDictRecord) => (s.sections || []).flatMap((sec: ZentridDictRecord) => (sec.fields || []).map((f: ZentridDictRecord) => ({
      ...f,
      ...(s.screen_id !== undefined ? { screen_id: s.screen_id } : {}),
      ...(s.screen_name !== undefined ? { screen_name: s.screen_name } : {}),
      ...(sec.section_name !== undefined ? { section_name: sec.section_name } : {}),
      ...(s.source_file !== undefined ? { source_file: s.source_file } : {})
    }))));
  }
  function canonicalAlertRows(): ZentridDictRecord[]{
    const alerts = data.alerts.canonical_alerts || [];
    return alerts.flatMap((a: ZentridDictRecord) => (a.vendor_mappings || []).map((m: ZentridDictRecord) => {
      const alertCode = a.zentrid_alert_code || a.zentrid_code || m.zentrid_alert_code;
      const alertName = a.zentrid_alert_name || a.zentrid_name || m.zentrid_alert_name;
      const category = a.category || m.category;
      const severity = a.severity || m.severity;
      return {
        ...m,
        ...(alertCode !== undefined ? { zentrid_alert_code: alertCode } : {}),
        ...(alertName !== undefined ? { zentrid_alert_name: alertName } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(severity !== undefined ? { severity } : {})
      };
    }));
  }
  function kpis(): string{
    const fields = data.fields.fields || [];
    const screens = data.screens.screens || [];
    const refs = flattenScreens();
    const alerts = data.alerts.vendor_mappings || canonicalAlertRows();
    return `<section class="module-grid production-kpis ui-dict-grid">
      <article class="kpi-card blue"><span class="kpi-icon">🔑</span><span class="kpi-label">UI Field Keys</span><strong class="kpi-value">${fields.length}</strong><small>From Zentrid_UI_Field_Dictionary</small></article>
      <article class="kpi-card cyan"><span class="kpi-icon">🖥️</span><span class="kpi-label">UI Screens</span><strong class="kpi-value">${screens.length}</strong><small>Screen-level canonical bindings</small></article>
      <article class="kpi-card green"><span class="kpi-icon">🧩</span><span class="kpi-label">Screen Field References</span><strong class="kpi-value">${refs.length}</strong><small>Fields placed into screen sections</small></article>
      <article class="kpi-card red"><span class="kpi-icon">🚨</span><span class="kpi-label">Vendor Alert Mappings</span><strong class="kpi-value">${alerts.length}</strong><small>Vendor alarms mapped to Zentrid alerts</small></article>
    </section>`;
  }
  function tabs(): string{
    const names = [['fields','UI Field Dictionary'],['screens','Screen Field Mapping'],['alerts','Alert UI Mapping']];
    return `<div class="ui-dict-tabs">${names.map(([id,label]) => `<button class="ui-dict-tab ${state.tab===id?'active':''}" data-tab="${id}">${label}</button>`).join('')}</div>`;
  }
  function filterBar(): string{
    const categories = [...new Set((data.fields.fields || []).map((f: ZentridDictRecord) => f.category).filter(Boolean).map(String))].sort();
    const screens = (data.screens.screens || []).map((s: ZentridDictRecord) => [String(s.screen_id || ''), String(s.screen_name || '')] as [string, string]);
    return `<div class="ui-dict-filter">
      <input id="uiDictSearch" placeholder="Search field key, label, entity, vendor code..." value="${esc(state.query)}" />
      ${state.tab === 'fields' ? `<select id="uiDictCategory"><option value="all">All categories</option>${categories.map((c: string) => `<option value="${esc(c)}" ${state.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select>` : ''}
      ${state.tab === 'screens' ? `<select id="uiDictScreen"><option value="all">All screens</option>${screens.map(([id,name]: [string, string]) => `<option value="${esc(id)}" ${state.screen===id?'selected':''}>${esc(name)}</option>`).join('')}</select>` : ''}
    </div>`;
  }
  function table(headers: string[], rows: string): string{ return `<div class="data-table-wrapper"><table class="canonical-field-table"><thead><tr>${headers.map((h: string)=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`; }
  function matches(o: unknown): boolean{ const q = state.query.toLowerCase().trim(); if(!q) return true; return JSON.stringify(o).toLowerCase().includes(q); }
  function renderFields(): string{
    let arr = data.fields.fields || [];
    if(state.category !== 'all') arr = arr.filter((f: ZentridDictRecord) => f.category === state.category);
    arr = arr.filter(matches);
    const rows = arr.map((f: ZentridDictRecord,i: number)=>`<tr><td>${i+1}</td><td><code>${esc(f.field_key)}</code><small>${esc(f.ui_key)}</small></td><td><strong>${esc(f.ui_label)}</strong><small>${esc(f.description || '')}</small></td><td>${esc(f.entity || '')}</td><td>${esc(f.category || '')}</td><td>${esc(f.data_type || '')}</td><td>${esc(unit(f.unit))}</td><td>${esc((f.used_in || []).join(', '))}</td></tr>`).join('');
    return table(['#','Field Key','UI Label / Meaning','Entity','Category','Type','Unit','Used In'], rows);
  }
  function renderScreens(): string{
    let arr = flattenScreens();
    if(state.screen !== 'all') arr = arr.filter((f: ZentridDictRecord) => f.screen_id === state.screen);
    arr = arr.filter(matches);
    const dict = fieldsByKey();
    const rows = arr.map((f: ZentridDictRecord,i: number)=>`<tr><td>${i+1}</td><td><strong>${esc(f.screen_name)}</strong><small>${esc(f.section_name)}</small></td><td><code>${esc(f.field_key)}</code><small>${esc(f.ui_key)}</small></td><td>${esc(f.ui_label || dict.get(String(f.field_key || ''))?.ui_label || '')}</td><td>${esc(f.entity || dict.get(String(f.field_key || ''))?.entity || '')}</td><td>${esc(f.data_type || dict.get(String(f.field_key || ''))?.data_type || '')}</td><td>${esc(unit(f.unit || dict.get(String(f.field_key || ''))?.unit))}</td><td>${dict.has(String(f.field_key || ''))?'<span class="badge success">OK</span>':'<span class="badge warning">Missing</span>'}</td></tr>`).join('');
    return table(['#','Screen / Section','Field Key','UI Label','Entity','Type','Unit','Dictionary'], rows);
  }
  function renderAlerts(): string{
    let arr = data.alerts.vendor_mappings || canonicalAlertRows();
    arr = arr.filter(matches);
    const rows = arr.map((m: ZentridDictRecord,i: number)=>`<tr><td>${i+1}</td><td><code>${esc(m.zentrid_alert_code)}</code><small>${esc(m.zentrid_alert_name || m.zentrid_alert_ui_label || '')}</small></td><td>${esc(m.vendor)}</td><td><code>${esc(m.vendor_alert_code || m.vendor_error_code)}</code></td><td><strong>${esc(m.vendor_alert_name || m.vendor_error_name)}</strong><small>${esc(m.vendor_description || '')}</small></td><td>${esc(m.vendor_recommended_action || '')}</td><td>${esc(m.severity || '')}</td></tr>`).join('');
    return table(['#','Zentrid Alert','Vendor','Vendor Code','Vendor Error / Description','Vendor Recommended Action','Severity'], rows);
  }
  function content(): string{ return `${kpis()}${tabs()}${filterBar()}${state.tab==='fields'?renderFields():state.tab==='screens'?renderScreens():renderAlerts()}`; }
  function rerender(): void{ const body = document.getElementById('uiDictBody'); if (body) body.innerHTML = content(); wire(); }
  function wire(): void{
    document.querySelectorAll<HTMLElement>('.ui-dict-tab').forEach((b: HTMLElement)=>b.onclick=()=>{state.tab=String(b.dataset.tab || 'fields'); state.query=''; rerender();});
    const q=document.getElementById('uiDictSearch') as HTMLInputElement | null; if(q) q.oninput=()=>{state.query=q.value; rerender();};
    const c=document.getElementById('uiDictCategory') as HTMLSelectElement | null; if(c) c.onchange=()=>{state.category=c.value; rerender();};
    const s=document.getElementById('uiDictScreen') as HTMLSelectElement | null; if(s) s.onchange=()=>{state.screen=s.value; rerender();};
  }
  window.renderUIFieldDictionary = async function(): Promise<string>{
    data.fields = await load<{ fields?: ZentridDictRecord[] }>('Zentrid_UI_Field_Dictionary_v1.json');
    data.screens = await load<{ screens?: ZentridDictRecord[] }>('Zentrid_UI_Screens_v1.json');
    data.alerts = await load<{ vendor_mappings?: ZentridDictRecord[]; canonical_alerts?: ZentridDictRecord[] }>('Zentrid_Canonical_Alerts_UI_Ready_v1.json');
    return `<section class="page-hero production-hero ui-dictionary-page"><div><p class="eyebrow">Global Admin · UI Data Model</p><h1>Zentrid UI Field Dictionary</h1><p class="muted">Single source of truth for UI labels, field keys, screen bindings and alert mappings. Vendor data must be normalized into these keys before rendering.</p></div><a class="freshness-card" href="data-governance.html"><span class="pulse"></span><div><strong>JSON Source Ready</strong><small>Field Dictionary · Screens · Alerts</small></div></a></section><div id="uiDictBody">${content()}</div>`;
  };
})();
