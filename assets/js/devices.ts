type ZentridDeviceStatusTone = "success" | "warning" | "danger" | "info" | "neutral" | string;

interface ZentridDeviceRecord {
  [key: string]: any;
  id: string;
  externalId?: string;
  name: string;
  type: string;
  subtype?: string;
  manufacturer?: string;
  model?: string;
  serial?: string;
  serialNumber?: string;
  firmware?: string;
  protocol?: string;
  ip?: string;
  mac?: string;
  plantId?: string;
  plant?: string;
  tenant?: string;
  vendor?: string;
  integration?: string;
  status?: string;
  lifecycle?: string;
  capacity?: string;
  installation?: string;
  installDate?: string;
  warranty?: string;
  lastSeen?: string;
  lastSeenAt?: string;
  alerts?: number | string;
  power?: string;
  voltage?: string;
  current?: string;
  temperature?: string;
  pr?: string;
  sourceStatus?: string;
  parent?: string;
  children?: string;
  location?: string;
  linkedDevices?: unknown;
  connectivityDetail?: unknown;
  networkDetail?: unknown;
  warrantyDetail?: unknown;
  telemetryLatest?: unknown;
  liveId?: string;
  registryDeviceId?: string;
  canonicalDeviceId?: string;
  sourceDeviceId?: string;
  liveDetail?: unknown;
  liveConnectivityDetail?: unknown;
  liveNetworkDetail?: unknown;
  liveWarrantyDetail?: unknown;
  liveTelemetryLatest?: unknown;
  auditDetail?: unknown;
  relatedAlerts?: Array<Record<string, unknown>>;
  alertsLoaded?: boolean;
  relatedPlant?: Record<string, unknown> | null;
  documents?: ZentridDeviceDocument[];
  raw?: Record<string, unknown>;
}

interface ZentridDeviceDocument {
  id: string;
  name: string;
  type: string;
  status?: string;
  expiry?: string;
  uploaded?: boolean;
  fileName?: string;
  filePath?: string;
}

interface ZentridDevicePagerState {
  page: number;
  size: number;
}

interface ZentridDevicePageSlice<T> {
  total: number;
  pages: number;
  page: number;
  start: number;
  end: number;
  rows: T[];
}

type ZentridDeviceCardItem = unknown[];
type ZentridDeviceTab = "overview" | "master" | "topology" | "telemetry" | "source" | "operating" | "configuration" | "alerts" | "control" | string | undefined;

interface ZentridDevicePrimaryMetric {
  label: string;
  value: unknown;
  hint: string;
}

declare const ZentridLocalStore: ZentridLocalStoreApi;
declare function plants(): Array<Record<string, unknown>>;

function saveDevices(_list: ZentridDeviceRecord[]): void { /* API-only: use a confirmed backend mutation. */ }
function optionText(value: unknown): string { return String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[character] || character)); }
function deviceEditableValue(value: unknown): string { const text=String(value ?? '').trim(); return !text || text === '—' || text.toLowerCase() === 'null' || text.toLowerCase() === 'undefined' ? '' : text; }
function deviceStatusCls(v: unknown): ZentridDeviceStatusTone { const text = String(v).toLowerCase(); if(text.includes('offline')||text.includes('fault')) return 'danger'; if(text.includes('warning')||text.includes('delayed')) return 'warning'; return 'success'; }
function deviceStatusPill(d: ZentridDeviceRecord): string { return `<span class="badge ${deviceStatusCls(d.status)}">${optionText(d.status || 'Unknown')}</span>`; }
function deviceUiFreshness(d: ZentridDeviceRecord): ZentridRecordFreshnessResult {
  return window.ZentridDataFreshness?.evaluateRecord(d, 'device') || { status:'unknown', label:'Unknown', tone:'neutral', ageMs:null, ageLabel:'Timestamp unavailable', timestamp:null, basis:'Last communication', backendStatus:String(d.sourceStatus || ''), contradictsBackend:false };
}
function deviceFreshnessHtml(d: ZentridDeviceRecord): string {
  const freshness=deviceUiFreshness(d);
  const backend=freshness.backendStatus || String(d.sourceStatus || '—');
  const mismatch=freshness.contradictsBackend ? ' · backend status conflicts with timestamp' : '';
  const title=`${freshness.basis}: ${freshness.timestamp || 'unavailable'}${backend && backend !== '—' ? ` · Backend: ${backend}` : ''}${mismatch}`;
  return `<span class="badge ${freshness.tone}" title="${optionText(title)}">${optionText(freshness.label)}</span><small>${optionText(freshness.basis)} ${optionText(freshness.ageLabel)} · Backend: ${optionText(backend)}${freshness.contradictsBackend ? ' · mismatch' : ''}</small>`;
}
function deviceLiveRecord(d: ZentridDeviceRecord): Record<string, unknown> { return deviceRawRecord(d.liveDetail); }
function deviceLiveId(d: ZentridDeviceRecord): string { const live=deviceLiveRecord(d); return String(d.liveId || live.deviceId || live.id || '').trim(); }
function deviceLiveStatus(d: ZentridDeviceRecord): string { const live=deviceLiveRecord(d); const summary=deviceRawRecord(live.technicalSummary); return String(live.normalizedStatus || live.status || summary.connectivityStatus || d.status || 'Unknown'); }
function deviceLiveLastSeen(d: ZentridDeviceRecord): string { const live=deviceLiveRecord(d); return String(live.lastSeenText || live.lastSeenAtUtc || d.lastSeen || '—'); }
function deviceLiveLastSync(d: ZentridDeviceRecord): string { const live=deviceLiveRecord(d); return String(live.lastSyncText || live.lastSyncAtUtc || '—'); }
function deviceLiveSourcePlantId(d: ZentridDeviceRecord): string { const live=deviceLiveRecord(d); const source=deviceRawRecord(live.sourceReference); return String(live.sourcePlantId || source.sourcePlantId || '—'); }
function deviceLiveDataQuality(d: ZentridDeviceRecord): string { const live=deviceLiveRecord(d); return String(live.dataQualityStatus || d.sourceStatus || '—'); }
function deviceLiveLookupStatus(d: ZentridDeviceRecord): string { return String(d.liveLookupStatus || (deviceLiveId(d) ? 'matched' : 'not-linked')); }
function deviceOperationalSourceLabel(d: ZentridDeviceRecord): string { return deviceLiveId(d) ? 'Platform Live' : 'Device Registry / plant relation'; }
function deviceLifecycleTone(value: unknown): ZentridDeviceStatusTone { const text=String(value||'').toLowerCase(); if(text.includes('inactive')||text.includes('archived')||text.includes('retired')) return 'neutral'; if(text.includes('draft')||text.includes('pending')) return 'warning'; if(text.includes('active')||text.includes('commissioned')) return 'success'; return 'info'; }
function deviceLifecyclePill(d: ZentridDeviceRecord): string { return `<span class="badge ${deviceLifecycleTone(d.lifecycle)}">${optionText(d.lifecycle || 'Unknown')}</span>`; }
function deviceApiHumanValue(label: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  const token=String(label || '').toLowerCase().replace(/[^a-z0-9]+/g,'');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if ((token.endsWith('connectstatus') || token.endsWith('connectionstatus')) && (value === 1 || value === 0 || value === '1' || value === '0')) return String(value) === '1' ? 'Connected' : 'Disconnected';
  if (token.endsWith('onlinestatus') && (value === 1 || value === 0 || value === '1' || value === '0')) return String(value) === '1' ? 'Online' : 'Offline';
  if ((token.endsWith('collectiontime') || token.endsWith('collectiontimestamp')) && /^\d{10,13}$/.test(String(value))) {
    const raw=Number(value); const millis=String(value).length === 13 ? raw : raw * 1000;
    const date=new Date(millis); if (Number.isFinite(date.getTime())) return date.toLocaleString();
  }
  return String(value);
}
function deviceApiValueRows(payload: unknown, prefix = '', depth = 0): Array<[string, string]> {
  if (payload === null || payload === undefined || depth > 3) return [];
  if (Array.isArray(payload)) {
    return payload.slice(0, 20).flatMap((item, index) => deviceApiValueRows(item, `${prefix}${prefix ? ' · ' : ''}${index + 1}`, depth + 1));
  }
  if (typeof payload !== 'object') return [[prefix || 'Value', deviceApiHumanValue(prefix || 'Value', payload)]];
  return Object.entries(payload as Record<string, unknown>).flatMap(([key, value]) => {
    const label = `${prefix}${prefix ? ' · ' : ''}${key.replace(/([a-z])([A-Z])/g, '$1 $2')}`;
    if (value !== null && typeof value === 'object') return deviceApiValueRows(value, label, depth + 1);
    return [[label, deviceApiHumanValue(label, value)]];
  });
}
function deviceApiPanel(title: string, payload: unknown, emptyText: string, sourceNote = 'Loaded from Device Registry API.'): string {
  const rows = deviceApiValueRows(payload).slice(0, 60);
  if (!rows.length) return `<div class="empty-state"><strong>${optionText(emptyText)}</strong><small>The endpoint returned no displayable fields.</small></div>`;
  return `<div class="section-title-v17 mini"><div><h3>${optionText(title)}</h3><p class="muted">${optionText(sourceNote)}</p></div></div><div class="info-grid">${rows.map(([label,value])=>`<div><span>${optionText(label)}</span><strong>${optionText(value)}</strong></div>`).join('')}</div>`;
}
function deviceLiveSubresourcePanel(d: ZentridDeviceRecord, title: string, payload: unknown, emptyText: string, endpointSuffix = ''): string {
  if (!deviceLiveId(d)) return `<div class="empty-state"><strong>Platform Live device not linked</strong><small>${optionText(title)} was not requested because no Platform Live identity is currently resolved for this Device Registry record.</small></div>`;
  const suffix=endpointSuffix ? `/${endpointSuffix.replace(/^\/+/, '')}` : '';
  return deviceApiPanel(title, payload, emptyText, `Platform Live API · GET /api/devices/{liveDeviceId}${suffix}`);
}
function deviceTelemetryAvailabilityNote(d: ZentridDeviceRecord): string {
  const adminLoaded=d.telemetryLatest !== undefined;
  const liveLoaded=d.liveTelemetryLatest !== undefined;
  const adminRows=deviceApiValueRows(d.telemetryLatest).length;
  const liveRows=deviceApiValueRows(d.liveTelemetryLatest).length;
  if (!adminLoaded && !liveLoaded) return `<div class="plant-data-state-v119 empty"><strong>Realtime telemetry not loaded yet</strong><small>Open Telemetry Summary to query the latest backend snapshot for this device.</small></div>`;
  if (!adminRows && !liveRows) return `<div class="plant-data-state-v119 empty"><strong>No realtime telemetry available</strong><small>The latest telemetry request completed without returning displayable measurement fields.</small></div>`;
  return '';
}
function linkedDevicesPanel(payload: unknown): string {
  const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
  const items = Array.isArray(payload) ? payload : Array.isArray(record.items) ? record.items : Array.isArray(record.data) ? record.data : [];
  if (!items.length) return `<div class="empty-state"><strong>No linked devices returned</strong><small>GET /api/admin/devices/{id}/linked-devices returned an empty collection.</small></div>`;
  return `<div class="data-table compact-table subordinate-device-table-v59"><div class="data-head"><span>Status</span><span>Device Type</span><span>Model</span><span>Software Version</span><span>SN</span></div>${items.map(item=>{ const row=(item||{}) as Record<string,unknown>; return `<div class="data-row"><div><span class="badge ${deviceStatusCls(row.status)}">${optionText(row.status || row.operationalStatus || 'Unknown')}</span></div><div><strong>${optionText(row.deviceType || row.type || '—')}</strong></div><div><span>${optionText(row.model || row.name || '—')}</span></div><div><span>${optionText(row.firmwareVersion || row.softwareVersion || '—')}</span></div><div><span>${optionText(row.serialNumber || row.serial || row.id || '—')}</span></div></div>`;}).join('')}</div>`;
}
function deviceAuditEntries(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload.filter(item => item && typeof item === 'object') as Array<Record<string, unknown>>;
  if (!payload || typeof payload !== 'object') return [];
  const record=payload as Record<string, unknown>;
  for (const key of ['items','data','auditHistory','history']) {
    const value=record[key];
    if (Array.isArray(value)) return value.filter(item => item && typeof item === 'object') as Array<Record<string, unknown>>;
  }
  return [];
}
function deviceAuditPanel(payload: unknown): string {
  const entries=deviceAuditEntries(payload);
  if (!entries.length) return `<div class="empty-state"><strong>No audit entries returned</strong><small>The device audit endpoint returned an empty collection.</small></div>`;
  return `<div class="timeline-v17 device-api-audit-v141">${entries.map(entry=>{ const occurred=entry.occurredAtUtc || entry.occurredAt || entry.timestamp || '—'; const action=entry.action || 'Activity'; const summary=entry.summary || entry.message || 'Device activity recorded.'; const actor=entry.actor || entry.user || 'System'; const changes=entry.changes && typeof entry.changes==='object' ? Object.entries(entry.changes as Record<string,unknown>).map(([key,value])=>`${key.replace(/([a-z])([A-Z])/g,'$1 $2')}: ${String(value)}`).join(' · ') : ''; return `<div><b>${optionText(occurred)}</b><span><strong>${optionText(action)}</strong> · ${optionText(summary)}<small>${optionText(actor)}${changes ? ` · ${optionText(changes)}` : ''}</small></span></div>`;}).join('')}</div>`;
}
function deviceTelemetryPanel(payload: unknown, sourceNote = 'Device Registry API · GET /api/admin/devices/{id}/telemetry/latest'): string {
  const rows=deviceApiValueRows(payload).slice(0,60);
  if (!rows.length) return `<div class="empty-state"><strong>Telemetry has not been received</strong><small>The latest telemetry endpoint returned an empty object. This is a valid empty state, not an API error.</small></div>`;
  return deviceApiPanel('Latest Telemetry', payload, 'No latest telemetry returned', sourceNote);
}
function selectedDevice(): ZentridDeviceRecord { const list=devices(); const id=new URLSearchParams(location.search).get('id') || localStorage.getItem('zentrid_selected_device'); const snapshot=window.ZentridLiveSelection?.readDevice?.(id) as ZentridDeviceRecord | null | undefined; return list.find(d=>d.id===id || d.externalId===id || d.serial===id) ?? snapshot ?? (!id ? list[0] : undefined) ?? ({} as ZentridDeviceRecord); }

function deviceIdentityRows(payload: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(payload)) return payload.filter(item => item && typeof item === 'object') as Array<Record<string, unknown>>;
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  for (const key of ['items', 'data', 'results', 'rows', 'devices']) {
    const value = record[key];
    if (Array.isArray(value)) return value.filter(item => item && typeof item === 'object') as Array<Record<string, unknown>>;
  }
  return [];
}

function deviceSourceIdentity(value: unknown): string { return String(value ?? '').trim().toLowerCase(); }

function canonicalDeviceCandidateMatches(candidate: Record<string, unknown>, device: ZentridDeviceRecord): boolean {
  const source = candidate.source && typeof candidate.source === 'object' ? candidate.source as Record<string, unknown> : {};
  const identity = candidate.identity && typeof candidate.identity === 'object' ? candidate.identity as Record<string, unknown> : {};
  const candidateIds = [candidate.sourceDeviceId, source.sourceDeviceId, candidate.deviceCode, identity.deviceCode, candidate.serialNumber, identity.serialNumber]
    .map(deviceSourceIdentity).filter(Boolean);
  const deviceIds = [device.sourceDeviceId, device.externalId, device.serial, device.serialNumber]
    .map(deviceSourceIdentity).filter(Boolean);
  return deviceIds.some(id => candidateIds.includes(id));
}

async function resolveDeviceCanonicalId(device: ZentridDeviceRecord): Promise<string> {
  const existing = String(device.canonicalDeviceId || deviceLiveId(device) || '').trim();
  if (existing) return existing;
  const registryPlantId = String(device.plantId || '').trim();
  if (registryPlantId && window.ZentridPlatformAPI?.plantRegistry?.devices) {
    try {
      const payload = await window.ZentridPlatformAPI.plantRegistry.devices(registryPlantId);
      const match = deviceIdentityRows(payload).find(candidate => canonicalDeviceCandidateMatches(candidate, device));
      const canonicalId = String(match?.id || match?.deviceId || '').trim();
      if (canonicalId) {
        device.canonicalDeviceId = canonicalId;
        device.liveId = canonicalId;
        device.registryDeviceId = String(device.id || '').trim();
        return canonicalId;
      }
    } catch { /* Fall through to the live collection compatibility lookup. */ }
  }
  const sourceDeviceId = String(device.sourceDeviceId || device.externalId || device.serial || '').trim();
  if (sourceDeviceId && sourceDeviceId !== '—' && window.ZentridPlatformAPI?.liveDevices?.list) {
    try {
      const payload = await window.ZentridPlatformAPI.liveDevices.list({ page: 1, pageSize: 50, search: sourceDeviceId });
      const match = deviceIdentityRows(payload).find(candidate => canonicalDeviceCandidateMatches(candidate, device));
      const canonicalId = String(match?.id || match?.deviceId || '').trim();
      if (canonicalId) {
        device.canonicalDeviceId = canonicalId;
        device.liveId = canonicalId;
        device.registryDeviceId = String(device.id || '').trim();
        return canonicalId;
      }
    } catch { /* No unsafe Registry UUID fallback. */ }
  }
  return '';
}

async function openDeviceAlerts(device: ZentridDeviceRecord): Promise<void> {
  const canonicalDeviceId = await resolveDeviceCanonicalId(device);
  if (!canonicalDeviceId) {
    window.ZentridLayout?.toast?.('Operational Device ID could not be resolved. Alerts were not opened with a Registry UUID.');
    return;
  }
  localStorage.setItem('zentrid_alert_context', JSON.stringify({ deviceId: canonicalDeviceId, tenant: device.tenant }));
  location.href = 'alerts.html';
}
function wireDevices(): void {
  const table = document.getElementById('deviceTable') as HTMLElement;
  const search = document.getElementById('deviceSearch') as HTMLInputElement;
  const type = document.getElementById('deviceTypeFilter') as HTMLSelectElement;
  const status = document.getElementById('deviceStatusFilter') as HTMLSelectElement;
  const plantFilter=()=>localStorage.getItem('zentrid_device_filter_plant') || '';
  function baseList(){ const pf=plantFilter(); return pf ? devices().filter(d=>d.plantId===pf) : devices(); }
  function apply(resetPage = true){
    if (resetPage && !window.ZentridRegistryQuery?.pagination('devices')) ZentridDevicePager.page = 1;
    const q=(search.value||'').toLowerCase();
    let list=baseList().filter(d=>[d.name,d.id,d.serial,d.plant,d.tenant,d.vendor,d.type,d.status,d.model].join(' ').toLowerCase().includes(q));
    if(type.value!=='All Types') list=list.filter(d=>d.type===type.value);
    if(status.value!=='All Statuses') list=list.filter(d=>d.status===status.value);
    ZentridRuntimeStability.replaceHtml(table, deviceRows(list));
    window.ZentridRegistryQuery?.update('devices', { search: q || null, deviceType: type.value === 'All Types' ? null : type.value, deviceStatus: status.value === 'All Statuses' ? null : status.value, page: 1 }, { replace: true, emit: true });
    const scope = document.getElementById('deviceFilterScopeV126');
    if (scope) scope.innerHTML = window.ZentridRegistryQuery?.filterScopeHtml('devices') || '';
    bindRows();
  }
  function bindRows(){ table.querySelectorAll('.data-row').forEach(row=> row.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{ const id=row.dataset.id; const d=devices().find(x=>x.id===id); if(btn.dataset.action==='open' && id){ if (d && window.ZentridLiveSelection?.selectDevice) window.ZentridLiveSelection.selectDevice(d); else { localStorage.setItem('zentrid_selected_device', id); location.href='device-detail.html'; } } if(btn.dataset.action==='plant' && d?.plantId){ localStorage.setItem('zentrid_selected_plant', d.plantId); location.href='plant-detail.html'; } if(btn.dataset.action==='telemetry' && d){ localStorage.setItem('zentrid_telemetry_context', JSON.stringify({tenant:d.tenant, plant:d.plant, plantId:'', device:d.name, deviceId:deviceLiveId(d) || '', metric:'current_power_kw', range:localStorage.getItem('zentrid_time')||'Last 24h', layer:'Normalized', source:'Device Registry'})); location.href='telemetry.html'; } if(btn.dataset.action==='alerts' && d){ void openDeviceAlerts(d); } })); table.querySelectorAll('[data-device-page]').forEach(btn=>btn.onclick=()=>{ if (window.ZentridRegistryQuery?.pagination('devices')) return; ZentridDevicePager.page += btn.dataset.devicePage === 'next' ? 1 : -1; apply(false); }); }
  search?.addEventListener('input', () => ZentridRuntimeStability.debounce('registry:devices:search', () => apply(true), 220));
  [type,status].forEach(el=> el && el.addEventListener('change', ()=>apply(true)));
  bindRows();
  document.getElementById('clearPlantDeviceFilter')?.addEventListener('click',()=>{ localStorage.removeItem('zentrid_device_filter_plant'); location.reload(); });

  let deviceCreatePlantRows: Array<Record<string, unknown>> = [];
  let deviceCreateProviderRows: Array<Record<string, unknown>> = [];
  const collectionRows = (payload: unknown): Array<Record<string, unknown>> => {
    if (Array.isArray(payload)) return payload.filter(item => item && typeof item === 'object') as Array<Record<string, unknown>>;
    if (!payload || typeof payload !== 'object') return [];
    const record = payload as Record<string, unknown>;
    for (const key of ['items','data','results','providers','rows']) {
      const value = record[key];
      if (Array.isArray(value)) return value.filter(item => item && typeof item === 'object') as Array<Record<string, unknown>>;
      if (value && typeof value === 'object') {
        const nested = collectionRows(value);
        if (nested.length) return nested;
      }
    }
    return [];
  };
  const plantLocation = (plant: Record<string, unknown>): { id: string; label: string } => {
    const nested = plant.location && typeof plant.location === 'object' ? plant.location as Record<string, unknown> : {};
    const id = String(plant.locationId || nested.id || plant.siteLocationId || '');
    const label = [plant.address || nested.address, plant.city || nested.city, plant.region || nested.region, plant.country || nested.country]
      .map(value => String(value || '').trim()).filter(Boolean).join(' · ') || String(plant.locationName || nested.name || plant.name || 'Plant location');
    return { id: id || label, label };
  };
  const syncLocationFromPlant = (): void => {
    const plantSelect = document.getElementById('devicePlantSelect') as HTMLSelectElement | null;
    const locationSelect = document.getElementById('deviceLocationSelect') as HTMLSelectElement | null;
    if (!plantSelect || !locationSelect) return;
    const plant = deviceCreatePlantRows.find(row => String(row.id || row.plantId || row.adminId || '') === plantSelect.value);
    if (!plant) { locationSelect.innerHTML = '<option value="">Select a plant first</option>'; return; }
    const location = plantLocation(plant);
    locationSelect.innerHTML = `<option value="${optionText(location.id)}">${optionText(location.label)}</option>`;
  };
  const loadDeviceCreateReferences = async (): Promise<void> => {
    const plantSelect = document.getElementById('devicePlantSelect') as HTMLSelectElement | null;
    const vendorSelect = document.getElementById('deviceVendorSelect') as HTMLSelectElement | null;
    if (plantSelect) plantSelect.innerHTML = '<option value="">Loading plants…</option>';
    if (vendorSelect) vendorSelect.innerHTML = '<option value="">Loading vendors…</option>';
    const [plantsResult, providersResult] = await Promise.allSettled([
      window.ZentridPlatformAPI?.plantRegistry?.list(),
      window.ZentridPlatformAPI?.live?.integrations()
    ]);
    deviceCreatePlantRows = plantsResult.status === 'fulfilled' ? collectionRows(plantsResult.value) : [];
    deviceCreateProviderRows = providersResult.status === 'fulfilled' ? collectionRows(providersResult.value) : [];
    const current = localStorage.getItem('zentrid_device_filter_plant') || '';
    if (plantSelect) {
      plantSelect.innerHTML = '<option value="">Select plant</option>' + deviceCreatePlantRows.map(row => {
        const id = String(row.id || row.plantId || row.adminId || '');
        const name = String(row.name || row.plantName || row.code || id || 'Plant');
        const tenant = String(row.tenantName || row.tenant || row.operator || '');
        return `<option value="${optionText(id)}" ${id === current ? 'selected' : ''}>${optionText(name)}${tenant ? ` · ${optionText(tenant)}` : ''}</option>`;
      }).join('');
      if (!deviceCreatePlantRows.length) plantSelect.innerHTML = '<option value="">No plants returned by API</option>';
    }
    if (vendorSelect) {
      vendorSelect.innerHTML = '<option value="">Select manufacturer / vendor</option>' + deviceCreateProviderRows.map(row => {
        const id = String(row.id || row.providerId || row.provider || row.code || row.providerType || row.name || '');
        const name = String(row.displayName || row.provider || row.name || row.providerName || row.providerType || row.code || id);
        return `<option value="${optionText(id)}" data-provider-name="${optionText(name)}">${optionText(name)}</option>`;
      }).join('');
      if (!deviceCreateProviderRows.length) vendorSelect.innerHTML = '<option value="">No vendors returned by /api/integrations</option>';
    }
    syncLocationFromPlant();
  };
  document.getElementById('openDeviceCreate')?.addEventListener('click', async ()=>{
    document.getElementById('deviceCreateModal')?.classList.add('open');
    await loadDeviceCreateReferences().catch(error => {
      console.groupCollapsed('[Device Create Debug] Reference data load failed');
      console.error(error);
      console.groupEnd();
      ZentridLayout.toast('Device reference data failed to load. Open Console for details.');
    });
    syncDevicePayload();
  });
  const closeDeviceCreate = () => document.getElementById('deviceCreateModal')?.classList.remove('open');
  document.getElementById('closeDeviceCreate')?.addEventListener('click', closeDeviceCreate);
  document.getElementById('cancelDeviceCreate')?.addEventListener('click', closeDeviceCreate);
  type DeviceCreateField = { name: string; label: string; path: string; type?: 'text'|'number'|'select'|'checkbox'; required?: boolean; unit?: string; placeholder?: string; options?: string[]; step?: string };
  const deviceCreateTypeFields: Record<string, DeviceCreateField[]> = {
    Inverter: [
      {name:'ratedActivePowerKw',label:'Rated Active Power',path:'specification.ratedActivePowerKw',type:'number',required:true,unit:'kW',step:'any'},
      {name:'ratedApparentPowerKva',label:'Rated Apparent Power',path:'specification.ratedApparentPowerKva',type:'number',unit:'kVA',step:'any'},
      {name:'phaseType',label:'Phase Type',path:'specification.phaseType',type:'select',required:true,options:['SinglePhase','ThreePhase']},
      {name:'inverterCategory',label:'Inverter Category',path:'specification.inverterCategory',type:'select',required:true,options:['String','Central','Hybrid','Microinverter']},
      {name:'mpptCount',label:'MPPT Count',path:'specification.mpptCount',type:'number',step:'1'},
      {name:'pvInputCount',label:'PV Input Count',path:'specification.pvInputCount',type:'number',step:'1'},
      {name:'maxDcVoltageV',label:'Maximum DC Voltage',path:'specification.maxDcVoltageV',type:'number',unit:'V',step:'any'},
      {name:'maxDcCurrentA',label:'Maximum DC Current',path:'specification.maxDcCurrentA',type:'number',unit:'A',step:'any'},
      {name:'nominalAcVoltageV',label:'Nominal AC Voltage',path:'specification.nominalAcVoltageV',type:'number',unit:'V',step:'any'},
      {name:'gridFrequencyHz',label:'Grid Frequency',path:'specification.gridFrequencyHz',type:'select',options:['50','60'],unit:'Hz'},
      {name:'maxEfficiencyPct',label:'Maximum Efficiency',path:'specification.maxEfficiencyPct',type:'number',unit:'%',step:'any'},
      {name:'batterySupported',label:'Battery Supported',path:'capabilities.batterySupported',type:'checkbox'}
    ],
    Battery: [
      {name:'chemistry',label:'Battery Chemistry',path:'specification.chemistry',type:'select',required:true,options:['LFP','NMC','LeadAcid','Other']},
      {name:'nominalCapacityKwh',label:'Nominal Capacity',path:'specification.nominalCapacityKwh',type:'number',required:true,unit:'kWh',step:'any'},
      {name:'usableCapacityKwh',label:'Usable Capacity',path:'specification.usableCapacityKwh',type:'number',unit:'kWh',step:'any'},
      {name:'nominalVoltageV',label:'Nominal Voltage',path:'specification.nominalVoltageV',type:'number',unit:'V',step:'any'},
      {name:'maxChargePowerKw',label:'Maximum Charge Power',path:'specification.maxChargePowerKw',type:'number',unit:'kW',step:'any'},
      {name:'maxDischargePowerKw',label:'Maximum Discharge Power',path:'specification.maxDischargePowerKw',type:'number',unit:'kW',step:'any'},
      {name:'minSocPct',label:'Minimum SOC',path:'specification.minSocPct',type:'number',unit:'%',step:'any'},
      {name:'maxSocPct',label:'Maximum SOC',path:'specification.maxSocPct',type:'number',unit:'%',step:'any'},
      {name:'reserveSocPct',label:'Backup Reserve SOC',path:'specification.reserveSocPct',type:'number',unit:'%',step:'any'},
      {name:'moduleCount',label:'Pack / Module Count',path:'specification.moduleCount',type:'number',step:'1'},
      {name:'bmsModel',label:'BMS Model',path:'specification.bmsModel',type:'text'},
      {name:'couplingType',label:'Coupling Type',path:'specification.couplingType',type:'select',options:['ACCoupled','DCCoupled']}
    ],
    Meter: [
      {name:'meterType',label:'Meter Type',path:'specification.meterType',type:'select',required:true,options:['Smart','Grid','Generation','Consumption','Revenue']},
      {name:'measurementDirection',label:'Measurement Direction',path:'specification.measurementDirection',type:'select',required:true,options:['Import','Export','Bidirectional']},
      {name:'phaseType',label:'Phase Type',path:'specification.phaseType',type:'select',required:true,options:['SinglePhase','ThreePhase']},
      {name:'nominalVoltageV',label:'Nominal Voltage',path:'specification.nominalVoltageV',type:'number',unit:'V',step:'any'},
      {name:'nominalCurrentA',label:'Nominal Current',path:'specification.nominalCurrentA',type:'number',unit:'A',step:'any'},
      {name:'ctRatio',label:'CT Ratio',path:'specification.ctRatio',type:'text',placeholder:'200/5'},
      {name:'vtRatio',label:'VT Ratio',path:'specification.vtRatio',type:'text',placeholder:'10000/100'},
      {name:'accuracyClass',label:'Accuracy Class',path:'specification.accuracyClass',type:'select',options:['0.2S','0.5S','1.0','Other']},
      {name:'modbusAddress',label:'Modbus Address',path:'communication.modbusAddress',type:'number',step:'1'},
      {name:'accountingPointId',label:'Accounting Point ID',path:'specification.accountingPointId',type:'text'}
    ],
    'Weather Station': [
      {name:'stationType',label:'Station Type',path:'specification.stationType',type:'select',required:true,options:['Compact','Modular','PyranometerOnly','Other']},
      {name:'irradiance',label:'Irradiance Sensor',path:'capabilities.irradiance',type:'checkbox'},
      {name:'ambientTemperature',label:'Ambient Temperature Sensor',path:'capabilities.ambientTemperature',type:'checkbox'},
      {name:'moduleTemperature',label:'Module Temperature Sensor',path:'capabilities.moduleTemperature',type:'checkbox'},
      {name:'windSpeed',label:'Wind Speed Sensor',path:'capabilities.windSpeed',type:'checkbox'},
      {name:'windDirection',label:'Wind Direction Sensor',path:'capabilities.windDirection',type:'checkbox'},
      {name:'humidity',label:'Humidity Sensor',path:'capabilities.humidity',type:'checkbox'},
      {name:'rainfall',label:'Rainfall Sensor',path:'capabilities.rainfall',type:'checkbox'},
      {name:'atmosphericPressure',label:'Atmospheric Pressure Sensor',path:'capabilities.atmosphericPressure',type:'checkbox'},
      {name:'sensorHeightM',label:'Sensor Height',path:'specification.sensorHeightM',type:'number',unit:'m',step:'any'},
      {name:'samplingIntervalSec',label:'Sampling Interval',path:'communication.samplingIntervalSec',type:'number',unit:'sec',step:'1'}
    ],
    Logger: [
      {name:'loggerType',label:'Logger Type',path:'specification.loggerType',type:'select',required:true,options:['DataLogger','CommunicationManager','VendorLogger','Other']},
      {name:'protocol',label:'Primary Protocol',path:'communication.protocol',type:'select',options:['ModbusRTU','ModbusTCP','MQTT','REST','Proprietary']},
      {name:'ethernet',label:'Ethernet Supported',path:'capabilities.ethernet',type:'checkbox'},
      {name:'wifi',label:'Wi-Fi Supported',path:'capabilities.wifi',type:'checkbox'},
      {name:'cellular',label:'Cellular Supported',path:'capabilities.cellular',type:'checkbox'},
      {name:'simIccid',label:'SIM ICCID',path:'communication.simIccid',type:'text'},
      {name:'imei',label:'IMEI',path:'communication.imei',type:'text'},
      {name:'lanIp',label:'LAN IP',path:'communication.lanIp',type:'text'},
      {name:'macAddress',label:'MAC Address',path:'communication.macAddress',type:'text'},
      {name:'maxConnectedDevices',label:'Maximum Connected Devices',path:'specification.maxConnectedDevices',type:'number',step:'1'},
      {name:'pollingIntervalSec',label:'Polling Interval',path:'communication.pollingIntervalSec',type:'number',unit:'sec',step:'1'},
      {name:'timezone',label:'Timezone',path:'communication.timezone',type:'text',placeholder:'Asia/Yerevan'}
    ],
    Gateway: [
      {name:'gatewayRole',label:'Gateway Role',path:'specification.gatewayRole',type:'select',required:true,options:['ProtocolGateway','EdgeGateway','SiteController','CloudGateway']},
      {name:'primaryConnection',label:'Primary Connection',path:'communication.primaryConnection',type:'select',options:['Ethernet','WiFi','Cellular','Fiber','Other']},
      {name:'backupConnection',label:'Backup Connection',path:'communication.backupConnection',type:'select',options:['None','Ethernet','WiFi','Cellular','Other']},
      {name:'edgeProcessing',label:'Edge Processing Enabled',path:'capabilities.edgeProcessing',type:'checkbox'},
      {name:'localStorageGb',label:'Local Storage Capacity',path:'specification.localStorageGb',type:'number',unit:'GB',step:'any'},
      {name:'vpn',label:'VPN Supported',path:'capabilities.vpn',type:'checkbox'},
      {name:'maxConnectedDevices',label:'Connected Device Capacity',path:'specification.maxConnectedDevices',type:'number',step:'1'},
      {name:'southboundProtocols',label:'Southbound Protocols',path:'communication.southboundProtocols',type:'text',placeholder:'ModbusRTU, ModbusTCP'},
      {name:'northboundProtocols',label:'Northbound Protocols',path:'communication.northboundProtocols',type:'text',placeholder:'MQTT, HTTPS'}
    ],
    Transformer: [
      {name:'transformerType',label:'Transformer Type',path:'specification.transformerType',type:'select',required:true,options:['StepUp','StepDown','Isolation','Distribution']},
      {name:'ratedPowerKva',label:'Rated Power',path:'specification.ratedPowerKva',type:'number',required:true,unit:'kVA',step:'any'},
      {name:'primaryVoltageV',label:'Primary Voltage',path:'specification.primaryVoltageV',type:'number',required:true,unit:'V',step:'any'},
      {name:'secondaryVoltageV',label:'Secondary Voltage',path:'specification.secondaryVoltageV',type:'number',required:true,unit:'V',step:'any'},
      {name:'tertiaryVoltageV',label:'Tertiary Voltage',path:'specification.tertiaryVoltageV',type:'number',unit:'V',step:'any'},
      {name:'phaseCount',label:'Phase Count',path:'specification.phaseCount',type:'select',required:true,options:['1','3']},
      {name:'vectorGroup',label:'Vector Group',path:'specification.vectorGroup',type:'text',placeholder:'Dyn11'},
      {name:'frequencyHz',label:'Frequency',path:'specification.frequencyHz',type:'select',options:['50','60'],unit:'Hz'},
      {name:'coolingMethod',label:'Cooling Method',path:'specification.coolingMethod',type:'select',options:['AN','AF','ONAN','ONAF','OFAF','Other']},
      {name:'impedancePct',label:'Impedance',path:'specification.impedancePct',type:'number',unit:'%',step:'any'},
      {name:'tapChangerType',label:'Tap Changer Type',path:'specification.tapChangerType',type:'select',options:['OffCircuit','OnLoad','None']},
      {name:'installationType',label:'Installation Type',path:'specification.installationType',type:'select',options:['Indoor','Outdoor']},
      {name:'temperatureSensors',label:'Temperature Sensors',path:'capabilities.temperatureSensors',type:'checkbox'},
      {name:'oilLevelSensor',label:'Oil Level Sensor',path:'capabilities.oilLevelSensor',type:'checkbox'}
    ],
    Microinverter: [
      {name:'ratedAcPowerW',label:'Rated AC Power',path:'specification.ratedAcPowerW',type:'number',required:true,unit:'W',step:'any'},
      {name:'moduleInputCount',label:'Module Input Count',path:'specification.moduleInputCount',type:'number',required:true,step:'1'},
      {name:'mpptCount',label:'MPPT Count',path:'specification.mpptCount',type:'number',step:'1'},
      {name:'maxInputVoltageV',label:'Maximum Input Voltage',path:'specification.maxInputVoltageV',type:'number',unit:'V',step:'any'},
      {name:'maxInputCurrentA',label:'Maximum Input Current',path:'specification.maxInputCurrentA',type:'number',unit:'A',step:'any'},
      {name:'gridFrequencyHz',label:'Grid Frequency',path:'specification.gridFrequencyHz',type:'select',options:['50','60'],unit:'Hz'},
      {name:'rapidShutdown',label:'Rapid Shutdown Supported',path:'capabilities.rapidShutdown',type:'checkbox'}
    ],
    'PV Module': [
      {name:'ratedPowerWp',label:'Rated Power',path:'specification.ratedPowerWp',type:'number',required:true,unit:'Wp',step:'any'},
      {name:'moduleTechnology',label:'Module Technology',path:'specification.moduleTechnology',type:'select',required:true,options:['Monocrystalline','Polycrystalline','ThinFilm','Bifacial']},
      {name:'cellTechnology',label:'Cell Technology',path:'specification.cellTechnology',type:'select',options:['PERC','TOPCon','HJT','IBC','Other']},
      {name:'efficiencyPct',label:'Module Efficiency',path:'specification.efficiencyPct',type:'number',unit:'%',step:'any'},
      {name:'vocV',label:'Open Circuit Voltage',path:'specification.vocV',type:'number',unit:'V',step:'any'},
      {name:'iscA',label:'Short Circuit Current',path:'specification.iscA',type:'number',unit:'A',step:'any'},
      {name:'vmpV',label:'Maximum Power Voltage',path:'specification.vmpV',type:'number',unit:'V',step:'any'},
      {name:'impA',label:'Maximum Power Current',path:'specification.impA',type:'number',unit:'A',step:'any'},
      {name:'cellCount',label:'Cell Count',path:'specification.cellCount',type:'number',step:'1'},
      {name:'bifacialFactorPct',label:'Bifacial Factor',path:'specification.bifacialFactorPct',type:'number',unit:'%',step:'any'},
      {name:'row',label:'Position Row',path:'position.row',type:'text'},
      {name:'column',label:'Position Column',path:'position.column',type:'text'}
    ],
    Other: [
      {name:'customType',label:'Custom Device Type',path:'specification.customType',type:'text',required:true},
      {name:'description',label:'Technical Description',path:'specification.description',type:'text'}
    ]
  };
  const setNestedDeviceValue = (target: Record<string, unknown>, path: string, value: unknown): void => {
    const parts = path.split('.'); let cursor: Record<string, unknown> = target;
    parts.forEach((part, index) => { if (index === parts.length - 1) cursor[part] = value; else { const next = cursor[part]; if (!next || typeof next !== 'object' || Array.isArray(next)) cursor[part] = {}; cursor = cursor[part] as Record<string, unknown>; } });
  };
  const renderDeviceTypeFields = (): void => {
    const host = document.getElementById('deviceTypeSpecificFields');
    const form = document.getElementById('deviceCreateForm') as HTMLFormElement | null;
    if (!host || !form) return;
    const type = String(new FormData(form).get('type') || 'Inverter');
    const fields = deviceCreateTypeFields[type] || deviceCreateTypeFields.Other || [];
    const placeholderForField = (field: DeviceCreateField): string => {
      if (field.placeholder) return field.placeholder;
      if (field.type === 'number') {
        if (field.unit === '%') return 'e.g. 95';
        if (field.unit === 'Hz') return 'e.g. 50';
        if (field.unit === 'V') return 'e.g. 400';
        if (field.unit === 'A') return 'e.g. 120';
        if (field.unit === 'kW' || field.unit === 'kVA' || field.unit === 'kWh') return 'e.g. 100';
        if (field.unit === 'W' || field.unit === 'Wp') return 'e.g. 550';
        if (field.unit === 'GB') return 'e.g. 64';
        if (field.unit === 'm') return 'e.g. 2.5';
        return field.step === '1' ? 'e.g. 1' : 'e.g. 10';
      }
      return `Enter ${field.label.toLowerCase()}`;
    };
    host.innerHTML = `<div class="full device-type-fields-head"><strong>${optionText(type)} technical specification</strong><small>Fields below are specific to the selected device type.</small></div>` + fields.map(field => {
      const req = field.required ? ' required aria-required="true"' : '';
      const labelText = `<span class="device-field-label">${optionText(field.label)}${field.unit ? `<small class="device-field-unit">${optionText(field.unit)}</small>` : ''}</span>`;
      if (field.type === 'select') return `<label>${labelText}<select name="${optionText(field.name)}" data-device-path="${optionText(field.path)}"${req}><option value="">Select ${optionText(field.label.toLowerCase())}</option>${(field.options||[]).map(v=>`<option value="${optionText(v)}">${optionText(v)}</option>`).join('')}</select></label>`;
      if (field.type === 'checkbox') return `<label class="device-checkbox-field"><input type="checkbox" name="${optionText(field.name)}" data-device-path="${optionText(field.path)}"><span>${optionText(field.label)}</span></label>`;
      return `<label>${labelText}<input type="${field.type === 'number' ? 'number' : 'text'}" name="${optionText(field.name)}" data-device-path="${optionText(field.path)}"${field.step ? ` step="${optionText(field.step)}"` : ''} placeholder="${optionText(placeholderForField(field))}"${req}></label>`;
    }).join('');
    host.querySelectorAll('input,select').forEach(control => { control.addEventListener('input', syncDevicePayload); control.addEventListener('change', syncDevicePayload); });
  };
  const deviceCreateForm = document.getElementById('deviceCreateForm') as HTMLFormElement | null;
  const buildDeviceCreatePayload = (): Record<string, unknown> => {
    const fd = new FormData(deviceCreateForm || undefined);
    const field = (name: string): string => String(fd.get(name) || '').trim();
    const providerValue = field('vendorId');
    const providerName = (document.getElementById('deviceVendorSelect') as HTMLSelectElement | null)?.selectedOptions[0]?.dataset.providerName || providerValue;
    const locationValue = field('locationId');
    const locationText = (document.getElementById('deviceLocationSelect') as HTMLSelectElement | null)?.selectedOptions[0]?.textContent?.trim() || '';
    const selectedType = field('type');
    const canonicalType: Record<string,string> = { 'Weather Station':'WeatherStation', 'PV Module':'PVModule' };
    const deviceType = canonicalType[selectedType] || selectedType;
    const deviceName = field('name');
    const serialNumber = field('serial');
    const deviceCode = (deviceName || serialNumber || deviceType)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `device-${Date.now()}`;
    const model = field('model');
    const payload: Record<string, unknown> = {
      deviceCode,
      plantRelation: { plantId: field('plantId') },
      identity: {
        deviceName,
        deviceType,
        serialNumber,
        deviceCode,
        manufacturer: providerName,
        model
      },
      source: {
        provider: providerName,
        sourceDeviceId: serialNumber
      },
      status: {
        lifecycleStatus: field('status') || 'Draft'
      },
      technical: {
        vendorModel: model,
        firmwareVersion: field('firmware'),
        location: locationText || locationValue
      }
    };
    deviceCreateForm?.querySelectorAll<HTMLElement>('[data-device-path]').forEach(control => {
      const path = control.dataset.devicePath || '';
      if (!path) return;
      let value: unknown = '';
      if (control instanceof HTMLInputElement && control.type === 'checkbox') value = control.checked;
      else if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) value = control.value.trim();
      if (value === '' || value === false) return;
      if (control instanceof HTMLInputElement && control.type === 'number') value = Number(control.value);
      if ((path.endsWith('Protocols')) && typeof value === 'string') value = value.split(',').map(item => item.trim()).filter(Boolean);
      setNestedDeviceValue(payload, path, value);
    });
    const specification = payload.specification && typeof payload.specification === 'object' ? payload.specification as Record<string, unknown> : null;
    const technical = payload.technical && typeof payload.technical === 'object' ? payload.technical as Record<string, unknown> : null;
    if (technical && specification) {
      const ratedPower = specification.ratedActivePowerKw ?? specification.ratedPowerKw ?? specification.ratedPowerKva;
      if (ratedPower !== undefined && ratedPower !== null && ratedPower !== '') technical.ratedPowerKw = ratedPower;
    }
    const compactObject = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(compactObject).filter(item => item !== undefined);
      if (!value || typeof value !== 'object') return value === '' ? undefined : value;
      const entries = Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [key, compactObject(item)] as const)
        .filter(([, item]) => item !== undefined);
      return entries.length ? Object.fromEntries(entries) : undefined;
    };
    return compactObject(payload) as Record<string, unknown>;
  };
  const syncDevicePayload = (): void => { /* Payload is generated in memory and logged on submit. */ };
  deviceCreateForm?.querySelectorAll('input,select').forEach(control => { control.addEventListener('input', syncDevicePayload); control.addEventListener('change', syncDevicePayload); });
  deviceCreateForm?.querySelector<HTMLSelectElement>('select[name="type"]')?.addEventListener('change', () => { renderDeviceTypeFields(); syncDevicePayload(); });
  renderDeviceTypeFields();
  document.getElementById('devicePlantSelect')?.addEventListener('change', () => { syncLocationFromPlant(); syncDevicePayload(); });
  deviceCreateForm?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const submit = deviceCreateForm.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (submit) submit.disabled = true;
    const payload = buildDeviceCreatePayload();
    const requestStartedAt = new Date();
    const requestStartedAtMs = requestStartedAt.getTime();
    const debugId = `device-create-${requestStartedAtMs}`;
    const endpoint = '/api/admin/devices';
    console.group(`[Device Create Debug] ${debugId} · POST ${endpoint}`);
    console.info('Started at', requestStartedAt.toISOString());
    console.info('Request endpoint', endpoint);
    console.info('Request payload', payload);
    console.info('Request payload JSON', JSON.stringify(payload, null, 2));
    const persistCreateDebug = (details: Record<string, unknown>): void => {
      const snapshot = { debugId, endpoint, timestamp: new Date().toISOString(), requestPayload: payload, ...details };
      try { sessionStorage.setItem('zentrid_last_device_create_debug', JSON.stringify(snapshot, null, 2)); } catch (_error) { /* best effort */ }
      (window as unknown as { __ZENTRID_LAST_DEVICE_CREATE_DEBUG__?: unknown }).__ZENTRID_LAST_DEVICE_CREATE_DEBUG__ = snapshot;
      console.info('Persistent debug snapshot', snapshot);
      console.info('Copy later with: copy(window.__ZENTRID_LAST_DEVICE_CREATE_DEBUG__)');
    };
    try {
      const response = await window.ZentridPlatformAPI?.deviceRegistry?.create(payload);
      const created = (response && typeof response === 'object' && 'data' in response) ? (response as { data?: unknown }).data : response;
      const createdRecord = created && typeof created === 'object' ? created as Record<string, unknown> : {};
      const createdId = String(createdRecord.id || createdRecord.deviceId || createdRecord.adminId || '');
      console.info('HTTP/API response', response);
      console.info('Normalized created record', created);
      console.info('Resolved device id', createdId || '(not returned)');
      persistCreateDebug({ outcome: 'success', apiResponse: response, createdRecord: created, createdId });
      if (createdId) localStorage.setItem('zentrid_selected_device', createdId);
      window.ZentridFormReadiness?.markCommitted(deviceCreateForm);
      ZentridLayout.toast('Device created through Admin API');
      window.setTimeout(() => location.reload(), 700);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const errorRecord = error && typeof error === 'object' ? error as Record<string, unknown> : null;
      const backendBody = errorRecord?.responseBody;
      const validationErrors = backendBody && typeof backendBody === 'object' && 'errors' in (backendBody as Record<string, unknown>)
        ? (backendBody as { errors?: Record<string, unknown> }).errors || {}
        : {};
      const operationalStatusBlocked = Object.prototype.hasOwnProperty.call(validationErrors, 'status.operationalStatus');
      console.error('Create request failed', error);
      console.error('Error message', message);
      console.error('Backend response body', backendBody ?? '(not available)');
      console.error('Validation errors', validationErrors);
      const errorProperties = errorRecord ? Object.fromEntries(Object.getOwnPropertyNames(errorRecord).map(key => [key, errorRecord[key]])) : error;
      console.info('Error object properties', errorProperties);
      const status = typeof errorRecord?.status === 'number' ? errorRecord.status : null;
      const shouldVerifyCommit = status === null || [500, 502, 503, 504].includes(status);
      persistCreateDebug({ outcome: 'request-error', errorMessage: message, backendResponse: backendBody, validationErrors, errorProperties, httpStatus: status, commitVerificationEligible: shouldVerifyCommit });

      if (!shouldVerifyCommit) {
        console.info(`Commit verification skipped for HTTP ${status}. Validation/client errors are treated as pre-commit failures.`);
        if (Object.keys(validationErrors).length) console.table(Object.entries(validationErrors).map(([field, details]) => ({ field, details: Array.isArray(details) ? details.join(' | ') : String(details) })));
        ZentridLayout.toast(operationalStatusBlocked ? 'Device API is waiting for the operationalStatus backend fix' : 'Device validation failed. Open Console for field details.');
      } else {
        console.warn(`The request returned ${status ? `HTTP ${status}` : 'a network error'}. Verifying whether this exact device was committed…`);
        try {
          const deviceCode = String(payload.deviceCode || '');
          const identity = payload.identity && typeof payload.identity === 'object' ? payload.identity as Record<string, unknown> : {};
          const plantRelation = payload.plantRelation && typeof payload.plantRelation === 'object' ? payload.plantRelation as Record<string, unknown> : {};
          const source = payload.source && typeof payload.source === 'object' ? payload.source as Record<string, unknown> : {};
          const serialNumber = String(identity.serialNumber || '');
          const plantId = String(plantRelation.plantId || '');
          const sourceDeviceId = String(source.sourceDeviceId || '');
          const verificationResponse = await window.ZentridPlatformAPI?.deviceRegistry?.list({ search: deviceCode, page: 1, pageSize: 100 });
          const verificationBody = verificationResponse && typeof verificationResponse === 'object' && 'data' in verificationResponse
            ? (verificationResponse as { data?: unknown }).data
            : verificationResponse;
          const verificationRecord = verificationBody && typeof verificationBody === 'object' ? verificationBody as Record<string, unknown> : {};
          const items = Array.isArray(verificationRecord.items) ? verificationRecord.items as Array<Record<string, unknown>> : Array.isArray(verificationBody) ? verificationBody as Array<Record<string, unknown>> : [];
          const normalize = (value: unknown): string => String(value || '').trim().toLowerCase();
          const match = items.find(item => {
            const createdAtMs = Date.parse(String(item.createdAtUtc || ''));
            const recentEnough = Number.isFinite(createdAtMs) && createdAtMs >= requestStartedAtMs - 5000;
            const sameCode = normalize(item.deviceCode) === normalize(deviceCode);
            const sameSerial = !serialNumber || normalize(item.serialNumber) === normalize(serialNumber);
            const samePlant = !plantId || normalize(item.plantId) === normalize(plantId);
            const sameSource = !sourceDeviceId || !item.sourceDeviceId || normalize(item.sourceDeviceId) === normalize(sourceDeviceId);
            return sameCode && sameSerial && samePlant && sameSource && recentEnough;
          });
          console.info('Post-error verification criteria', { deviceCode, serialNumber, plantId, sourceDeviceId, requestStartedAt: requestStartedAt.toISOString(), allowedClockSkewMs: 5000 });
          console.info('Post-error verification response', verificationResponse);
          console.table(items.map(item => ({ id: item.id, deviceCode: item.deviceCode, serialNumber: item.serialNumber, plantId: item.plantId, deviceName: item.deviceName, lifecycleStatus: item.lifecycleStatus, provider: item.provider, createdAtUtc: item.createdAtUtc })));
          if (match) {
            console.warn('POST returned an error, but the exact newly-created device was found on the server.', match);
            const createdId = String(match.id || '');
            if (createdId) localStorage.setItem('zentrid_selected_device', createdId);
            persistCreateDebug({ outcome: 'committed-after-error', backendResponse: backendBody, validationErrors, verifiedDevice: match, verificationResponse, verificationCriteria: { deviceCode, serialNumber, plantId, sourceDeviceId, requestStartedAt: requestStartedAt.toISOString() } });
            console.error(`Backend returned ${status ? `HTTP ${status}` : 'a network error'} after the device was committed. The popup will remain open and the page will not reload.`);
            console.info('Use copy(window.__ZENTRID_LAST_DEVICE_CREATE_DEBUG__) to copy the complete debug object.');
            ZentridLayout.toast(`Device was created, but backend returned ${status || 'a network error'}. Popup kept open; see Console.`);
          } else {
            persistCreateDebug({ outcome: 'not-found-after-error', backendResponse: backendBody, validationErrors, verificationResponse, verificationCriteria: { deviceCode, serialNumber, plantId, sourceDeviceId, requestStartedAt: requestStartedAt.toISOString() } });
            console.error('Verification did not find an exact newly-created device. Older records with the same deviceCode are ignored.');
            ZentridLayout.toast('Device creation failed or could not be confirmed. Open Console for full debug.');
          }
        } catch (verificationError) {
          persistCreateDebug({ outcome: 'verification-error', backendResponse: backendBody, validationErrors, verificationError: verificationError instanceof Error ? { name: verificationError.name, message: verificationError.message, stack: verificationError.stack } : String(verificationError) });
          console.error('Post-error verification request also failed', verificationError);
          ZentridLayout.toast('Device creation returned an error. Open Console for full debug.');
        }
      }
    } finally {
      console.info('Finished at', new Date().toISOString());
      console.groupEnd();
      if (submit) submit.disabled = false;
    }
  });

  document.getElementById('openDeviceSource')?.addEventListener('click',()=>document.getElementById('deviceSourceDrawer')?.classList.add('open'));
  document.getElementById('closeDeviceSource')?.addEventListener('click',()=>document.getElementById('deviceSourceDrawer')?.classList.remove('open'));
}
function devicePortalStatusTextV92(d: ZentridDeviceRecord): string {
  const s=String(d.status||'').toLowerCase();
  if(s.includes('offline')) return 'Not visible as healthy in client portal';
  if(s.includes('warning')) return 'Visible with warning note in client portal';
  return 'Visible as working in client portal';
}
function devicePassportPanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Technical Passport</h2><p class="muted">Static device master data used by registry, support, warranty and replacement workflows.</p></div></div>
  <div class="device-passport-grid-v92">
    <article><span>Identity</span><strong>${d.name}</strong><small>${d.id} · ${d.externalId}</small></article>
    <article><span>Classification</span><strong>${optionText(deviceEffectiveType(d))}</strong><small>${optionText(d.subtype || '—')}</small></article>
    <article><span>Manufacturer</span><strong>${d.manufacturer || d.vendor}</strong><small>${d.model}</small></article>
    <article><span>Serial Number</span><strong>${d.serial}</strong><small>Unique traceable device number</small></article>
    <article><span>Firmware / Protocol</span><strong>${optionText(d.firmware || '—')}</strong><small>${optionText(d.protocol || '—')}</small></article>
    <article><span>Rated Capacity</span><strong>${d.capacity}</strong><small>Technical passport value</small></article>
    <article><span>Network / Addressing</span><strong>${optionText(d.protocol || '—')}</strong><small>IP ${optionText(d.ip || '—')} · MAC ${optionText(d.mac || '—')}</small></article>
    <article><span>Warranty</span><strong>${d.warranty}</strong><small>Installed ${d.installation}</small></article>
  </div>
  <div class="data-table compact-table device-passport-table-v92"><div class="data-head"><span>Parameter</span><span>Value</span><span>Used By</span></div>
    <div class="data-row"><div><strong>Rated Power / Capacity</strong></div><div><span>${d.capacity}</span></div><div><small>Reports · Device & Topology Registry · Lifecycle</small></div></div>
    <div class="data-row"><div><strong>Parent Relation</strong></div><div><span>${d.parent}</span></div><div><small>Topology · Plant Detail · Alerts</small></div></div>
    <div class="data-row"><div><strong>Child Objects</strong></div><div><span>${d.children}</span></div><div><small>Topology · Impact analysis</small></div></div>
  </div>`;
}
function deviceConnectivityFullPanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Connectivity</h2><p class="muted">Only communication and freshness values returned by backend sources are shown.</p></div></div>
  ${cardGrid([
    ['Operational Status', deviceLiveStatus(d), `${deviceOperationalSourceLabel(d)} status`],
    ['Last Seen', deviceLiveLastSeen(d), 'Latest returned communication timestamp'],
    ['Signal Strength', deviceMetricValue(d,'signal'), 'Returned telemetry only'],
    ['Data Quality', deviceLiveDataQuality(d), 'Backend quality/freshness status'],
    ['Parent Device', d.parent || '—', 'Returned topology relation'],
    ['Integration', d.integration || '—', 'Registry source relation']
  ], 'device-param-grid-v58')}`;
}
function telemetrySummaryPanelV92(d: ZentridDeviceRecord): string {
  const key=deviceTypeKey(d);
  const rows = key==='battery' ? [['SOC',deviceMetricValue(d,'soc')],['Active Power',deviceMetricValue(d,'activePower')],['Battery Voltage',deviceMetricValue(d,'voltage')],['Battery Current',deviceMetricValue(d,'current')],['Battery Temperature',deviceMetricValue(d,'temperature')],['SOH',deviceMetricValue(d,'soh')]] :
    key==='meter' ? [['Import Today',deviceMetricValue(d,'todayImport')],['Export Today',deviceMetricValue(d,'todayExport')],['Total Import',deviceMetricValue(d,'import')],['Total Export',deviceMetricValue(d,'export')],['Voltage',deviceMetricValue(d,'voltage')],['Frequency',deviceMetricValue(d,'frequency')]] :
    key==='logger' ? [['Signal',deviceMetricValue(d,'signal')],['Data Lag',deviceMetricValue(d,'dataLag')],['Linked Devices',deviceMetricValue(d,'linked')],['WLAN',deviceMetricValue(d,'wlan')],['LAN IP',deviceMetricValue(d,'lanIp')],['Last Seen',deviceLiveLastSeen(d)]] :
    [['Current Power',deviceMetricValue(d,'activePower')],['Daily Yield',deviceMetricValue(d,'dailyEnergy')],['Total Yield',deviceMetricValue(d,'totalYield')],['Temperature',deviceMetricValue(d,'temperature')],['Voltage',deviceMetricValue(d,'lineVoltage')],['Current',deviceMetricValue(d,'phaseCurrent')]];
  return `<div class="section-title-v17"><div><h2>Telemetry Summary</h2><p class="muted">Only values returned by API sources are displayed; unavailable metrics remain blank.</p></div></div>
  ${deviceTelemetryCharts(d)}
  ${cardGrid(rows, 'device-param-grid-v58')}`;
}

function lifecyclePanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Lifecycle / Replacement History</h2><p class="muted">Lifecycle status comes from DeviceRegistry; warranty and audit data load from their dedicated endpoints.</p></div></div>
  <div class="device-lifecycle-summary-v92">
    <article><span>Lifecycle Status</span><strong>${deviceLifecyclePill(d)}</strong><small>Registry lifecycle state</small></article>
    <article><span>Operational Status</span><strong>${deviceStatusPill(d)}</strong><small>Connectivity and operating state</small></article>
    <article><span>Commissioning Date</span><strong>${optionText(d.installation || '—')}</strong><small>First operational binding</small></article>
    <article><span>Warranty Until</span><strong>${optionText(d.warranty || '—')}</strong><small>Warranty and service tracking</small></article>
  </div>
  ${deviceApiPanel('Device Registry Warranty', d.warrantyDetail, 'No Device Registry warranty returned')}${deviceLiveSubresourcePanel(d, 'Platform Live Warranty', d.liveWarrantyDetail, 'No Platform Live warranty returned', 'warranty')}
  <div class="section-title-v17 mini"><div><h3>Lifecycle Audit</h3><p class="muted">Server-recorded create, update and lifecycle actions.</p></div></div>${deviceAuditPanel(d.auditDetail)}`;
}
function relatedObjectsPanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Related Objects</h2><p class="muted">Relations shown here come from Device Registry and Platform Live data only.</p></div></div>
  <div class="device-related-flow-v92">
    <article><span>Tenant</span><strong>${optionText(d.tenant || '—')}</strong><small>Administrative plant relation</small></article>
    <i></i>
    <article><span>Plant</span><strong>${optionText(d.plant || '—')}</strong><small>${optionText(d.plantId || '—')}</small></article>
    <i></i>
    <article><span>Device</span><strong>${optionText(d.name || '—')}</strong><small>${optionText(deviceEffectiveType(d))} · ${optionText(d.serial || '—')}</small></article>
    <i></i>
    <article><span>Vendor Source</span><strong>${optionText(d.vendor || '—')}</strong><small>${optionText(d.externalId || '—')}</small></article>
  </div>
  <div class="data-table compact-table device-related-table-v92"><div class="data-head"><span>Relation</span><span>Object / Party</span><span>Source</span><span>Action</span></div>
    <div class="data-row"><div><strong>Parent Plant</strong></div><div><span>${optionText(d.plant || '—')}</span></div><div><small>DeviceRegistry plantRelation</small></div><div><button class="small-btn" type="button" onclick="localStorage.setItem('zentrid_selected_plant','${optionText(d.plantId || '')}');location.href='plant-detail.html'">Open</button></div></div>
    <div class="data-row"><div><strong>Managing Tenant</strong></div><div><span>${optionText(d.tenant || '—')}</span></div><div><small>DeviceRegistry plantRelation</small></div><div><span>—</span></div></div>
    <div class="data-row"><div><strong>Integration</strong></div><div><span>${optionText(d.integration || '—')}</span></div><div><small>DeviceRegistry source</small></div><div><button class="small-btn" type="button" onclick="location.href='integrations.html'">Open Integrations</button></div></div>
    <div class="data-row"><div><strong>Platform Live Device</strong></div><div><span>${optionText(deviceLiveId(d) || '—')}</span></div><div><small>Matched by provider + sourceDeviceId</small></div><div><span>${deviceLiveId(d) ? 'Linked' : 'Not matched'}</span></div></div>
  </div>`;
}

const DEVICE_DOCUMENT_TYPES = ['Technical','Commercial','Legal','Compliance','Warranty','Manual','Other'];
function deviceDocumentCacheKey(deviceId: string): string { return `zentrid_device_documents_${deviceId}`; }
function readDeviceDocumentCache(deviceId: string): ZentridDeviceDocument[] {
  try { const parsed=JSON.parse(sessionStorage.getItem(deviceDocumentCacheKey(deviceId)) || '[]'); return Array.isArray(parsed) ? parsed : []; } catch (_error) { return []; }
}
function writeDeviceDocumentCache(deviceId: string, documents: ZentridDeviceDocument[]): void {
  try { sessionStorage.setItem(deviceDocumentCacheKey(deviceId), JSON.stringify(documents)); } catch (_error) { /* best effort */ }
}
function deviceDocuments(d: ZentridDeviceRecord): ZentridDeviceDocument[] {
  const apiDocuments=Array.isArray(d.documents) ? d.documents.filter(item => item && typeof item === 'object') : [];
  const cached=readDeviceDocumentCache(d.id);
  const merged=[...apiDocuments, ...cached].reduce<ZentridDeviceDocument[]>((items, item) => {
    const document=item as ZentridDeviceDocument; const key=String(document.id || document.filePath || document.fileName || '');
    if (!key || items.some(existing => String(existing.id || existing.filePath || existing.fileName) === key)) return items;
    items.push(document); return items;
  }, []);
  return merged;
}
function deviceDocumentsPanelV92(d: ZentridDeviceRecord): string {
  const documents=deviceDocuments(d);
  const rows=documents.length ? documents.map(document => `<div class="data-row" data-device-document-id="${optionText(document.id)}"><div><strong>${optionText(document.name || document.fileName || 'Device document')}</strong><small>${optionText(document.fileName || 'Stored file')}</small></div><div><span>${optionText(document.type || 'Other')}</span></div><div><span class="badge ${String(document.status || '').toLowerCase()==='pending' ? 'warning' : 'success'}">${optionText(document.status || 'Uploaded')}</span></div><div><span>${optionText(document.expiry || '—')}</span></div><div class="mini-row-actions"><button class="small-btn" type="button" data-download-device-document="${optionText(document.id)}">Download</button><button class="danger-action" type="button" data-delete-device-document="${optionText(document.id)}">Delete</button></div></div>`).join('') : '<div class="empty-state"><strong>No device documents</strong><small>Upload a document to make it available from Device Detail.</small></div>';
  return `<div class="section-title-v17"><div><h2>Documents</h2><p class="muted">Upload, download and delete files through the DeviceRegistry document endpoints.</p></div></div>
  <form id="deviceDocumentUploadForm" class="glass-card compact-form device-document-upload-v141" novalidate>
    <div class="form-grid">
      <label>Document Name<input id="deviceDocumentName" name="name" required placeholder="Document name"></label>
      <label>Type<select id="deviceDocumentType" name="type">${DEVICE_DOCUMENT_TYPES.map(type => `<option value="${type}">${type}</option>`).join('')}</select></label>
      <label>Expiry<input id="deviceDocumentExpiry" name="expiry" type="datetime-local"></label>
      <label class="full">File<input id="deviceDocumentFile" name="file" type="file" required></label>
    </div>
    <div id="deviceDocumentFeedback" class="api-inline-result" aria-live="polite"></div>
    <div class="drawer-actions"><button class="primary-action" type="submit">Upload Document</button></div>
  </form>
  <div class="data-table compact-table device-document-table-v141"><div class="data-head"><span>Document</span><span>Type</span><span>Status</span><span>Expiry</span><span>Actions</span></div>${rows}</div>`;
}
function deviceAuditPanelV92(d: ZentridDeviceRecord): string {
  return `<div class="section-title-v17"><div><h2>Audit</h2><p class="muted">Immutable device change trail across registry, integration, topology and user actions.</p></div></div>
  <div class="timeline-v17 device-audit-v92">
    <div><b>Created</b><span>${d.installation} · Device record created for ${d.plant}</span></div>
    <div><b>Imported</b><span>Vendor source imported from ${d.integration}</span></div>
    <div><b>Mapped</b><span>External ID ${d.externalId} mapped to Zentrid ID ${d.id}</span></div>
    <div><b>Linked</b><span>Topology relation set: ${d.parent}</span></div>
    <div><b>Checked</b><span>Last communication checked · ${d.lastSeen}</span></div>
    <div><b>Modified</b><span>Updated by Global Admin · 15 Jun 2026</span></div>
  </div>`;
}

/* v59 Device Detail v2: type-driven workspace, topology and architecture */
function devices(): ZentridDeviceRecord[] {
  return Array.isArray(window.ZentridLiveDevices) ? window.ZentridLiveDevices : [];
}

function deviceEffectiveType(d: ZentridDeviceRecord): string {
  const live=deviceLiveRecord(d);
  const summary=deviceRawRecord(live.technicalSummary);
  return String(live.deviceType || live.type || summary.deviceType || d.type || 'Unknown');
}
function isType(d: ZentridDeviceRecord, name: string): boolean { return deviceEffectiveType(d).toLowerCase().includes(name); }
function deviceTypeKey(d: ZentridDeviceRecord): string {
  const t=deviceEffectiveType(d).toLowerCase();
  if(t.includes('micro')) return 'microinverter';
  if(t.includes('inverter')) return 'inverter';
  if(t.includes('battery')) return 'battery';
  if(t.includes('logger')||t.includes('gateway')||t.includes('communication')) return 'logger';
  if(t.includes('meter')) return 'meter';
  if(t.includes('weather')) return 'weather';
  if(t.includes('pv module')||t.includes('module')) return 'module';
  return 'generic';
}
function deviceTypeLabel(d: ZentridDeviceRecord): string {
  const map: Record<string, string> = {inverter:'Inverter',microinverter:'Microinverter',battery:'Battery',logger:'Logger / Communication',meter:'Meter',weather:'Weather Station',module:'PV Module',generic:deviceEffectiveType(d) || 'Device'};
  return map[deviceTypeKey(d)] || deviceEffectiveType(d) || 'Device';
}
var ZentridDevicePager: ZentridDevicePagerState = window.ZentridDevicePager || (window.ZentridDevicePager = { page: 1, size: 50 });
let deviceDetailActiveTab: ZentridDeviceTab = 'overview';
function pageSlice<T>(list: T[], pager: ZentridDevicePagerState): ZentridDevicePageSlice<T> {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pager.size));
  pager.page = Math.min(Math.max(1, Number(pager.page) || 1), pages);
  const start = (pager.page - 1) * pager.size;
  return { total, pages, page: pager.page, start, end: Math.min(start + pager.size, total), rows: list.slice(start, start + pager.size) };
}
function pagerHtml(kind: string, state: ZentridDevicePageSlice<unknown>): string {
  if (state.total <= ZentridDevicePager.size) return `<div class="pagination-bar"><span>Showing ${state.total} row(s)</span></div>`;
  return `<div class="pagination-bar"><span>Showing ${state.start + 1}-${state.end} of ${state.total}</span><div class="row-actions"><button data-${kind}-page="prev" ${state.page<=1?'disabled':''}>Prev</button><strong>Page ${state.page} / ${state.pages}</strong><button data-${kind}-page="next" ${state.page>=state.pages?'disabled':''}>Next</button></div></div>`;
}
function operationalDevices(): ZentridDeviceRecord[] { return Array.isArray(window.ZentridOperationalDevices) ? window.ZentridOperationalDevices : []; }
function operationalDeviceKpi(): Record<string, unknown> { const value=window.ZentridOperationalDeviceKpi; return value && typeof value === 'object' ? value as Record<string, unknown> : {}; }
function deviceOptionalNumber(value: unknown): number | null { if (value === null || value === undefined || value === '' || value === '—') return null; const parsed=Number(value); return Number.isFinite(parsed) ? parsed : null; }
function deviceOperationalSnapshotHtml(): string {
  const rows=operationalDevices();
  const state=String(window.ZentridOperationalDevicesState || 'pending');
  const pagination=window.ZentridOperationalDevicePagination as ZentridRepositoryPagination | undefined;
  const kpi=operationalDeviceKpi();
  if (state === 'pending') return `<div class="empty-state"><strong>Loading operational device data…</strong><small>/api/devices is loading separately from the administrative Device Registry.</small></div>`;
  if (state === 'error') return `<div class="empty-state"><strong>Operational device data unavailable</strong><small>The Device Registry remains usable. Online, Attention and mapping KPI values are not inferred from the current registry page.</small></div>`;
  if (!rows.length) return `<div class="empty-state"><strong>No operational device records</strong><small>/api/devices returned no records for the operational snapshot page.</small></div>`;
  const total=deviceOptionalNumber(kpi.totalCount) ?? pagination?.totalCount ?? rows.length;
  const online=deviceOptionalNumber(kpi.onlineCount);
  const attention=deviceOptionalNumber(kpi.attentionCount);
  const mapped=deviceOptionalNumber(kpi.mappedDevicesCount);
  return `<div class="integration-live-summary-grid device-operational-kpis"><article><span>Operational devices</span><strong>${Number(total).toLocaleString()}</strong><small>/api/devices KPI / totalCount</small></article><article><span>Online / Attention</span><strong>${online === null ? '—' : online.toLocaleString()} / ${attention === null ? '—' : attention.toLocaleString()}</strong><small>Global backend KPI</small></article><article><span>Mapped devices</span><strong>${mapped === null ? '—' : mapped.toLocaleString()}</strong><small>Global backend KPI</small></article></div><div class="data-table device-operational-table"><div class="data-head"><span>Device</span><span>Plant</span><span>Type</span><span>Provider</span><span>Status</span><span>UI Freshness</span></div>${rows.map(row => `<div class="data-row"><div><strong>${optionText(row.name || row.externalId || row.id)}</strong><small>${optionText(row.externalId || row.id)}</small></div><div><strong>${optionText(row.plant || '—')}</strong><small>${optionText(row.plantId || '—')}</small></div><div><strong>${optionText(deviceEffectiveType(row))}</strong><small>${optionText(row.subtype || row.model || '—')}</small></div><div><strong>${optionText(row.vendor || row.manufacturer || '—')}</strong><small>${optionText(row.integration || '—')}</small></div><div><span class="badge ${deviceStatusCls(row.status)}">${optionText(row.status || 'Unknown')}</span><small>${row.alerts === null || row.alerts === undefined ? '—' : `${optionText(row.alerts)} alert(s)`}</small></div><div>${deviceFreshnessHtml(row)}</div></div>`).join('')}</div>`;
}

function deviceRows(list: ZentridDeviceRecord[]): string {
  const serverPagination = window.ZentridRegistryQuery?.pagination('devices');
  const state = serverPagination
    ? { total: serverPagination.totalCount, pages: serverPagination.totalPages, page: serverPagination.page, start: (serverPagination.page - 1) * serverPagination.pageSize, end: Math.min(serverPagination.page * serverPagination.pageSize, serverPagination.totalCount), rows: list }
    : pageSlice(list, ZentridDevicePager);
  const pager = serverPagination ? window.ZentridRegistryQuery?.pagerHtml('devices', list.length) || '' : pagerHtml('device', state);
  return `${pager}<div class="data-table device-table"><div class="data-head"><span>Device</span><span>Plant / Tenant</span><span>Type</span><span>Vendor Source</span><span>Status</span><span>Actions</span></div>${state.rows.map(d=>`<div class="data-row" data-id="${d.id}"><div><span class="record-origin-chip live" data-record-origin="live" title="Data source: Device Registry API · /api/admin/devices">Device Registry</span><strong>${d.name}</strong><small>${d.id}<br>${d.serial}</small></div><div><strong>${d.plant}</strong><small>${d.tenant}</small></div><div><strong>${d.type}</strong><small>${d.subtype} · ${d.capacity}</small></div><div><strong>${d.vendor}</strong><small>${d.integration}<br>${d.sourceStatus}</small></div><div><span class="badge ${deviceStatusCls(d.status)}">${d.status}</span>${deviceFreshnessHtml(d)}<small>${d.alerts === null || d.alerts === undefined ? '—' : `${optionText(d.alerts)} alert(s)`} · Last seen ${optionText(d.lastSeen || '—')}</small></div><div class="row-actions"><button data-action="open">Open</button><button data-action="plant">Plant</button><button data-action="telemetry">Telemetry</button><button data-action="alerts">Alerts</button></div></div>`).join('')}</div>${pager}`;
}
function renderDevices(): string {
  const all=devices();
  const queryState = window.ZentridRegistryQuery?.read('devices');
  const serverPagination = window.ZentridRegistryQuery?.pagination('devices');
  const initialSearch = queryState?.search || '';
  const initialType = queryState?.params.deviceType || 'All Types';
  const initialStatus = queryState?.params.deviceStatus || 'All Statuses';
  const activePlantFilter=localStorage.getItem('zentrid_device_filter_plant') || '';
  const activePlant=activePlantFilter ? all.find(d=>d.plantId===activePlantFilter) : null;
  const list=activePlantFilter ? all.filter(d=>d.plantId===activePlantFilter) : all;
  const registryPage=serverPagination?.page || 1;
  const registryPages=serverPagination?.totalPages || 1;
  const plantsOnPage=new Set(list.map(d=>String(d.plantId||d.plant||'')).filter(Boolean)).size;
  const typesOnPage=new Set(list.map(d=>deviceEffectiveType(d)).filter(Boolean)).size;
  const draftOnPage=list.filter(d=>String(d.lifecycle||'').toLowerCase()==='draft').length;
  const types=[...new Set(all.map(d=>d.type).filter(Boolean))].sort();
  const statuses=Array.from(new Set(['Online','Warning','Fault','Offline','Draft',...all.map(d=>String(d.status||'').trim()).filter(Boolean)]));
  const optionText=(value: unknown): string=>String(value??'').replace(/[&<>"']/g, character=>({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[character]||character));
  const filterBanner=activePlantFilter ? `<div class="filter-banner"><div><strong>Filtered by plant</strong><small>${activePlant ? activePlant.plant : activePlantFilter} · ${list.length} device records</small></div><button id="clearPlantDeviceFilter">Clear filter</button></div>` : '';
  return `<section class="page-hero"><div><p class="eyebrow">Global Admin · Groups</p><h1>Device List</h1><p class="muted">All devices connected to Plants, grouped by plant, tenant, vendor source and operational status.</p></div><div class="hero-actions"><button class="create-action" id="openDeviceCreate" type="button"><span class="pulse"></span><div><strong>+ Add Device</strong><small>POST /api/admin/devices</small></div></button><button class="freshness-card" id="openDeviceSource"><span class="pulse"></span><div><strong>Source Traceability</strong><small>Vendor ID → Zentrid Device</small></div></button></div></section>
  ${filterBanner}
  <section class="context-bar glass-card"><div class="ctx-item"><span>Registry Records</span><strong>${(serverPagination?.totalCount || list.length).toLocaleString()}</strong></div><div class="ctx-item"><span>Registry Page</span><strong>${registryPage} / ${registryPages}</strong></div><div class="ctx-item"><span>Rows Loaded</span><strong>${list.length}</strong></div><div class="ctx-item"><span>Plants on Page</span><strong>${plantsOnPage}</strong></div><div class="ctx-item"><span>Types on Page</span><strong>${typesOnPage}</strong></div><div class="ctx-item"><span>Draft on Page</span><strong>${draftOnPage}</strong></div></section>
  <section class="panel glass-card"><div class="panel-head"><div><p class="eyebrow">Master data · /api/admin/devices</p><h2>Device Registry</h2><p>Administrative identity, plant relation, lifecycle and technical passport fields. Global operational KPI values are not calculated from this page.</p></div><div class="toolbar"><input id="deviceSearch" value="${String(initialSearch).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" placeholder="Search current page by device, serial, plant..."/><select id="deviceTypeFilter"><option ${initialType === 'All Types' ? 'selected' : ''}>All Types</option>${types.map(t=>`<option ${t === initialType ? 'selected' : ''}>${optionText(t)}</option>`).join('')}</select><select id="deviceStatusFilter"><option ${initialStatus === 'All Statuses' ? 'selected' : ''}>All Statuses</option>${statuses.map(value=>`<option ${value === initialStatus ? 'selected' : ''}>${optionText(value)}</option>`).join('')}</select></div></div><div id="deviceFilterScopeV126">${window.ZentridRegistryQuery?.filterScopeHtml('devices') || ''}</div><div id="deviceTable">${deviceRows(list)}</div></section>
  <section class="panel glass-card" id="deviceOperationalSnapshot"><div class="panel-head"><div><p class="eyebrow">Operational data · /api/devices</p><h2>Operational Device Snapshot</h2><p>Operational status, provider, freshness and global device KPI values are loaded separately from the administrative registry.</p></div><button class="go" type="button" data-live-refresh="devices">Refresh</button></div>${deviceOperationalSnapshotHtml()}</section>
  <aside class="modal" id="deviceCreateModal"><div class="modal-card wide-modal device-create-modal-v2"><button class="modal-close" id="closeDeviceCreate" type="button">×</button><div class="panel-head device-create-panel-head"><div><h2>Add Device</h2><p>Create a typed administrative device. Common identity fields stay fixed; technical specification changes by Device Type.</p></div><span class="badge info">Typed Admin API</span></div><form id="deviceCreateForm" class="client-form-grid two-col" data-zentrid-form-readiness="api" data-zentrid-form-contract="DeviceCreateRequest" data-zentrid-form-method="POST" data-zentrid-form-validation="native" data-zentrid-form-api-note="POST /api/admin/devices with type-specific specification, capabilities and communication objects."><div class="full device-form-section-title"><strong>Classification & identity</strong><small>Fields shared by every device type.</small></div><label>Device Name<input name="name" required placeholder="Inverter 01"></label><label>Device Type<select name="type"><option>Inverter</option><option>Microinverter</option><option>Battery</option><option>Meter</option><option>Weather Station</option><option>Transformer</option><option>Gateway</option><option>Logger</option><option>PV Module</option><option>Other</option></select></label><label>Plant<select name="plantId" id="devicePlantSelect" required></select></label><label>Administrative Status<select name="status"><option>Draft</option><option>Active</option><option>Inactive</option></select></label><label>Manufacturer / Vendor<select name="vendorId" id="deviceVendorSelect" required><option value="">Loading vendors…</option></select></label><label>Model<input name="model" placeholder="Device model"></label><label>Serial Number<input name="serial" required placeholder="Serial number"></label><label>Firmware<input name="firmware" placeholder="Firmware version"></label><label>Location<select name="locationId" id="deviceLocationSelect" required><option value="">Select a plant first</option></select><small>Location is loaded from the selected plant record.</small></label><div id="deviceTypeSpecificFields" class="full client-form-grid two-col device-type-specific-fields"></div><div class="modal-actions full"><button class="secondary-action" id="cancelDeviceCreate" type="button">Cancel</button><button class="primary-action" type="submit">Create Device via API</button></div></form></div></aside><aside class="detail-drawer" id="deviceSourceDrawer"><button class="drawer-close" id="closeDeviceSource">x</button><h2>Device Source Traceability</h2><div class="drawer-body"><p>Each device is stored as Zentrid master data and keeps the source reference from the vendor platform.</p><ul><li>External Device ID</li><li>Vendor and integration name</li><li>Plant relationship</li><li>Parent / child topology</li><li>Last seen and freshness</li></ul></div><div class="drawer-actions"><button class="primary-action" onclick="location.href='plants.html'">Open Groups</button></div></aside>`;
}
function devicePrimaryMetric(d: ZentridDeviceRecord): ZentridDevicePrimaryMetric {
  const k=deviceTypeKey(d);
  if(k==='battery') return {label:'SOC / SOH', value:`${deviceMetricValue(d,'soc')} · ${deviceMetricValue(d,'soh')}`, hint:'Battery health from API telemetry'};
  if(k==='logger') return {label:'Signal / Data Lag', value:`${deviceMetricValue(d,'signal')} · ${deviceMetricValue(d,'dataLag')}`, hint:'Communication health from API'};
  if(k==='meter') return {label:'Grid Power', value:deviceMetricValue(d,'activePower'), hint:'Accounting point telemetry'};
  if(k==='weather') return {label:'Irradiance', value:deviceMetricValue(d,'irradiance'), hint:'Weather telemetry'};
  if(k==='module') return {label:'Module Power', value:deviceMetricValue(d,'activePower'), hint:'Module-level telemetry'};
  return {label:'Active Power', value:deviceMetricValue(d,'activePower'), hint:'Latest API telemetry'};
}

function deviceHeroActions(d: ZentridDeviceRecord): string {
  const lifecycle=String(d.lifecycle || '').trim().toLowerCase();
  const lifecycleActions = lifecycle === 'archived'
    ? ''
    : `${lifecycle === 'active' ? '<button class="secondary-action" type="button" data-device-lifecycle-action="deactivate">Deactivate</button>' : '<button class="secondary-action" type="button" data-device-lifecycle-action="activate">Activate</button>'}<button class="secondary-action danger-action" type="button" data-device-lifecycle-action="archive">Archive</button>`;
  return `<button class="secondary-action" type="button" onclick="location.href='devices.html'">Back to Device List</button><button class="secondary-action" type="button" onclick="localStorage.setItem('zentrid_selected_plant','${d.plantId}');location.href='plant-detail.html'">Open Plant</button><button class="secondary-action" type="button" id="openDeviceEdit">Edit Device</button>${lifecycleActions}<button class="primary-action" type="button" id="refreshDeviceV59">Refresh</button>`;
}
function deviceKpis(d: ZentridDeviceRecord): string {
  const primary=devicePrimaryMetric(d);
  const liveId=deviceLiveId(d);
  return `<section class="kpi-grid detail-kpis device-kpi-grid-v58 device-kpi-grid-v59" id="deviceDetailKpis">
    <article class="kpi-card"><span>Operational Status</span><strong>${optionText(deviceLiveStatus(d))}</strong><small>${optionText(deviceLiveLastSeen(d))} · ${optionText(deviceOperationalSourceLabel(d))}${liveId ? ` · ${optionText(liveId)}` : ''}</small></article>
    <article class="kpi-card"><span>${primary.label}</span><strong>${primary.value}</strong><small>${primary.hint}</small></article>
    <article class="kpi-card"><span>Lifecycle</span><strong>${optionText(d.lifecycle || '—')}</strong><small>Device Registry administrative state</small></article>
    <article class="kpi-card"><span>Vendor / Model</span><strong>${d.vendor}</strong><small>${d.model}</small></article>
    <article class="kpi-card"><span>Serial / Source ID</span><strong>${d.serial}</strong><small>${d.externalId}</small></article>
    <article class="kpi-card"><span>UI Freshness</span><strong>${deviceFreshnessHtml(d)}</strong></article>
  </section>`;
}
function universalDeviceSidebar(d: ZentridDeviceRecord, activeTab: ZentridDeviceTab = deviceDetailActiveTab): string {
  const key=deviceTypeKey(d);
  const typeSpecific = key==='inverter'||key==='microinverter' ? `<button class="${activeTab === 'strings' ? 'active' : ''}" data-device-tab="strings" type="button" ${activeTab === 'strings' ? 'aria-current=\"page\"' : ''}><span>PV Strings</span></button>` :
    key==='battery' ? `<button class="${activeTab === 'battery' ? 'active' : ''}" data-device-tab="battery" type="button" ${activeTab === 'battery' ? 'aria-current=\"page\"' : ''}><span>Battery State</span></button>` :
    key==='logger' ? `<button class="${activeTab === 'connectivity' ? 'active' : ''}" data-device-tab="connectivity" type="button" ${activeTab === 'connectivity' ? 'aria-current=\"page\"' : ''}><span>Logger View</span></button>` :
    key==='meter' ? `<button class="${activeTab === 'measurements' ? 'active' : ''}" data-device-tab="measurements" type="button" ${activeTab === 'measurements' ? 'aria-current=\"page\"' : ''}><span>Measurements</span></button>` :
    key==='weather' ? `<button class="${activeTab === 'weather' ? 'active' : ''}" data-device-tab="weather" type="button" ${activeTab === 'weather' ? 'aria-current=\"page\"' : ''}><span>Weather Data</span></button>` :
    key==='module' ? `<button class="${activeTab === 'module' ? 'active' : ''}" data-device-tab="module" type="button" ${activeTab === 'module' ? 'aria-current=\"page\"' : ''}><span>Module Data</span></button>` : '';
  const button = (tab: string, label: string): string => `<button class="${activeTab === tab ? 'active' : ''}" data-device-tab="${tab}" type="button" ${activeTab === tab ? 'aria-current="page"' : ''}><span>${label}</span></button>`;
  return `<aside class="detail-side-nav device-detail-nav-v58 device-detail-nav-v92" aria-label="Device navigation">
    ${button('overview','Overview')}
    ${button('passport','Technical Passport')}
    ${button('connectivity-full','Connectivity')}
    ${button('telemetry','Telemetry Summary')}
    ${button('architecture','Topology')}
    ${typeSpecific}
    ${button('alerts','Alerts / Events')}
    ${button('lifecycle','Lifecycle')}
    ${button('related','Related Objects')}
    ${button('documents','Documents')}
    ${button('configuration','Configuration')}
    ${button('audit','Audit')}
    ${button('source','Source & Sync')}
  </aside>`;
}

type ZentridDeviceTelemetryRecord = Record<string, unknown>;

function deviceTelemetryRecords(d: ZentridDeviceRecord): ZentridDeviceTelemetryRecord[] {
  const store = window.ZentridLiveTelemetryByDevice as Record<string, ZentridDeviceTelemetryRecord[]> | undefined;
  if (!store) return [];
  const keys = [d.id, d.externalId, d.serial].map(value => String(value || '').trim()).filter(Boolean);
  for (const key of keys) {
    const records = store[key];
    if (Array.isArray(records)) return records;
  }
  return [];
}

function deviceTelemetryLoaded(d: ZentridDeviceRecord): boolean {
  const loaded = window.ZentridLiveTelemetryLoadedDevices as Record<string, boolean> | undefined;
  if (!loaded) return false;
  return [d.id, d.externalId, d.serial].some(value => Boolean(value && loaded[String(value)]));
}

function deviceTelemetryMetricToken(value: unknown): string {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function deviceTelemetryEscape(value: unknown): string {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function deviceTelemetryTimestamp(record: ZentridDeviceTelemetryRecord): number {
  const value = record.timestampRaw || record.timestamp;
  const timestamp = Date.parse(String(value || ''));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function deviceTelemetryAliases(key: string): string[] {
  const aliases: Record<string, string[]> = {
    activePower: ['active power', 'active power kw', 'current power', 'current power kw', 'ac power', 'ac power kw', 'output power', 'power'],
    reactivePower: ['reactive power', 'reactive power kvar'],
    powerFactor: ['power factor', 'pf'],
    frequency: ['grid frequency', 'grid frequency hz', 'frequency', 'frequency hz', 'ac frequency'],
    dailyEnergy: ['daily energy', 'daily energy kwh', 'today energy', 'today energy kwh', 'energy today', 'daily yield', 'today yield'],
    totalYield: ['total yield', 'total yield kwh', 'lifetime yield', 'total energy', 'total energy kwh', 'cumulative energy'],
    temperature: ['internal temperature', 'device temperature', 'temperature', 'temperature c', 'inverter temperature'],
    phaseCurrent: ['phase current', 'ac current', 'output current'],
    lineVoltage: ['line voltage', 'ac voltage', 'output voltage'],
    voltage: ['battery voltage', 'battery voltage v', 'dc voltage', 'dc voltage v', 'voltage', 'voltage v'],
    current: ['battery current', 'battery current a', 'dc current', 'dc current a', 'current', 'current a'],
    soc: ['soc', 'soc pct', 'state of charge', 'battery soc'],
    soh: ['soh', 'soh pct', 'state of health', 'battery soh'],
    charged: ['charged today', 'charge energy today', 'daily charge energy'],
    discharged: ['discharged today', 'discharge energy today', 'daily discharge energy'],
    signal: ['signal strength', 'signal quality', 'rssi'],
    wlan: ['wlan', 'wifi signal', 'wireless signal'],
    dataLag: ['data lag', 'telemetry lag', 'communication delay'],
    todayImport: ['import today', 'today import', 'daily import energy'],
    todayExport: ['export today', 'today export', 'daily export energy'],
    import: ['total import', 'import energy'],
    export: ['total export', 'export energy'],
    irradiance: ['irradiance', 'solar irradiance', 'poa irradiance'],
    ambient: ['ambient temperature', 'air temperature'],
    moduleTemp: ['module temperature', 'panel temperature']
  };
  return aliases[key] || [key];
}

function deviceTelemetryMetricValue(d: ZentridDeviceRecord, key: string): string {
  const expected = deviceTelemetryAliases(key).map(deviceTelemetryMetricToken);
  const matches = deviceTelemetryRecords(d)
    .filter(record => expected.includes(deviceTelemetryMetricToken(record.metric)))
    .sort((a, b) => deviceTelemetryTimestamp(b) - deviceTelemetryTimestamp(a));
  const record = matches[0];
  if (!record) return '';
  const display = String(record.displayValue || '').trim();
  if (display && display !== '—') return display;
  const value = record.valueText ?? record.value;
  if (value === undefined || value === null || value === '') return '';
  const unit = String(record.unit || '').trim();
  return `${String(value)}${unit ? ` ${unit}` : ''}`;
}

function deviceTelemetryLatestTimestamp(d: ZentridDeviceRecord): string {
  const record = deviceTelemetryRecords(d).slice().sort((a, b) => deviceTelemetryTimestamp(b) - deviceTelemetryTimestamp(a))[0];
  return String(record?.timestamp || '').trim();
}

function deviceLatestTelemetryLeaves(payload: unknown, path: string[] = [], depth = 0): Array<{ key: string; path: string; value: unknown; unit: string }> {
  if (payload === null || payload === undefined || depth > 5) return [];
  if (Array.isArray(payload)) return payload.slice(0, 50).flatMap((item, index) => deviceLatestTelemetryLeaves(item, [...path, String(index)], depth + 1));
  if (typeof payload !== 'object') {
    const key=path[path.length - 1] || '';
    return [{ key, path: path.join('.'), value: payload, unit: '' }];
  }
  const record=payload as Record<string, unknown>;
  const valueKey=['value','reading','metricValue','numericValue'].find(key => record[key] !== undefined && record[key] !== null && typeof record[key] !== 'object');
  if (valueKey && path.length) {
    const unit=String(record.unit || record.unitOfMeasure || record.uom || '').trim();
    return [{ key: path[path.length - 1] || '', path: path.join('.'), value: record[valueKey], unit }];
  }
  return Object.entries(record).flatMap(([key,value]) => deviceLatestTelemetryLeaves(value, [...path, key], depth + 1));
}

function deviceLatestTelemetryMetricValue(d: ZentridDeviceRecord, key: string): string {
  const expected=deviceTelemetryAliases(key).map(deviceTelemetryMetricToken);
  const payloads=[d.liveTelemetryLatest, d.telemetryLatest];
  for (const payload of payloads) {
    const candidates=deviceLatestTelemetryLeaves(payload);
    const match=candidates.find(candidate => {
      const keyToken=deviceTelemetryMetricToken(candidate.key);
      const pathToken=deviceTelemetryMetricToken(candidate.path);
      return expected.some(token => keyToken === token || pathToken.endsWith(token) || pathToken.endsWith(`${token}value`));
    });
    if (!match || match.value === '' || match.value === null || match.value === undefined) continue;
    const unit=match.unit.trim();
    return `${String(match.value)}${unit ? ` ${unit}` : ''}`;
  }
  return '';
}

function deviceMetricValue(d: ZentridDeviceRecord, key: string): string {
  const latestValue = deviceLatestTelemetryMetricValue(d, key);
  if (latestValue) return latestValue;
  const telemetryValue = deviceTelemetryMetricValue(d, key);
  if (telemetryValue) return telemetryValue;
  const direct: Record<string, unknown> = {
    activePower: d.power,
    frequency: d.frequency,
    temperature: d.temperature,
    voltage: d.voltage,
    lineVoltage: d.voltage,
    current: d.current,
    soc: d.soc,
    soh: d.soh,
    signal: d.signal,
    wlan: d.wlan,
    dataLag: d.dataLag || d.lastSeen,
    lanIp: d.lanIp || d.ip,
    linked: d.children,
    irradiance: d.irradiance,
    ambient: d.ambient,
    moduleTemp: d.moduleTemp,
    dailyEnergy: d.dailyEnergy,
    totalYield: d.totalYield,
    todayImport: d.todayImport,
    todayExport: d.todayExport,
    import: d.import,
    export: d.export
  };
  const value=direct[key];
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

function cardGrid(items: ZentridDeviceCardItem[], cls: string = 'device-param-grid-v58'): string {
  return `<div class="${cls}">${items.map(([k,v,h])=>`<article><span>${k}</span><strong>${v}</strong>${h?`<small>${h}</small>`:''}</article>`).join('')}</div>`;
}
function operatingDataGrid(d: ZentridDeviceRecord): string {
  const key=deviceTypeKey(d);
  if(key==='logger') return cardGrid([['Signal Strength',deviceMetricValue(d,'signal')],['WLAN',deviceMetricValue(d,'wlan')],['Data Lag',deviceMetricValue(d,'dataLag')],['Linked Devices',deviceMetricValue(d,'linked')],['LAN IP',deviceMetricValue(d,'lanIp')],['Cyber Security Version',deviceMetricValue(d,'cybersecurity')],['Status',d.status],['Last Update',deviceTelemetryLatestTimestamp(d) || d.lastSeen]]);
  if(key==='battery') return cardGrid([['SOC',deviceMetricValue(d,'soc')],['SOH',deviceMetricValue(d,'soh')],['Voltage',deviceMetricValue(d,'voltage')],['Current',deviceMetricValue(d,'current')],['Temperature',deviceMetricValue(d,'temperature')],['Rated Capacity',deviceMetricValue(d,'rated')],['Charged Today',deviceMetricValue(d,'charged')],['Discharged Today',deviceMetricValue(d,'discharged')]]);
  if(key==='weather') return cardGrid([['Irradiance',deviceMetricValue(d,'irradiance')],['Ambient Temp',deviceMetricValue(d,'ambient')],['Module Temp',deviceMetricValue(d,'moduleTemp')],['Wind Speed',deviceMetricValue(d,'wind')],['Humidity',deviceMetricValue(d,'humidity')],['Rainfall',deviceMetricValue(d,'rainfall')]]);
  if(key==='meter') return cardGrid([['Active Power',deviceMetricValue(d,'activePower')],['Import Today',deviceMetricValue(d,'todayImport')],['Export Today',deviceMetricValue(d,'todayExport')],['Voltage',deviceMetricValue(d,'voltage')],['Current',deviceMetricValue(d,'current')],['Frequency',deviceMetricValue(d,'frequency')]]);
  if(key==='module') return cardGrid([['Power',deviceMetricValue(d,'activePower')],['Voltage',deviceMetricValue(d,'voltage')],['Current',deviceMetricValue(d,'current')],['Temperature',deviceMetricValue(d,'temperature')],['String',deviceMetricValue(d,'string')],['MPPT',deviceMetricValue(d,'mppt')],['Position',deviceMetricValue(d,'position')]]);
  return cardGrid([['Active Power',deviceMetricValue(d,'activePower')],['Reactive Power',deviceMetricValue(d,'reactivePower')],['Power Factor',deviceMetricValue(d,'powerFactor')],['Grid Frequency',deviceMetricValue(d,'frequency')],['Daily Energy',deviceMetricValue(d,'dailyEnergy')],['Total Yield',deviceMetricValue(d,'totalYield')],['Phase Current',deviceMetricValue(d,'phaseCurrent')],['Line Voltage',deviceMetricValue(d,'lineVoltage')],['Internal Temperature',deviceMetricValue(d,'temperature')],['Insulation Resistance',deviceMetricValue(d,'insulation')],['Startup Time',deviceMetricValue(d,'startup')],['Shutdown Time',deviceMetricValue(d,'shutdown')]]);
}
function deviceMiniChart(label: string): string {
  return `<div class="device-chart-card-v58"><div class="chart-card-head-v20"><strong>${optionText(label)}</strong><small>API telemetry</small></div><div class="empty-state"><strong>No chart samples returned</strong><small>No synthetic values are displayed.</small></div></div>`;
}


function deviceTelemetryCharts(d: ZentridDeviceRecord): string {
  const groups = new Map<string, ZentridDeviceTelemetryRecord[]>();
  deviceTelemetryRecords(d).forEach(record => {
    const metric = String(record.metric || '').trim();
    const numeric = Number(record.numericValue ?? record.value);
    if (!metric || !Number.isFinite(numeric)) return;
    const rows = groups.get(metric) || [];
    rows.push(record);
    groups.set(metric, rows);
  });
  const selected = [...groups.entries()]
    .sort((left, right) => right[1].length - left[1].length)
    .slice(0, 2);
  if (!selected.length) {
    return `<div class="device-monitoring-grid-v58"><div class="device-chart-card-v58"><div class="chart-card-head-v20"><strong>Telemetry Samples</strong><small>/api/telemetry</small></div><div class="empty-state"><strong>No numeric telemetry samples</strong><small>The endpoint returned no chart-ready values for this device on the loaded page.</small></div></div></div>`;
  }
  return `<div class="device-monitoring-grid-v58">${selected.map(([metric, records]) => {
    const ordered = records.slice().sort((a, b) => deviceTelemetryTimestamp(a) - deviceTelemetryTimestamp(b)).slice(-12);
    const values = ordered.map(record => Number(record.numericValue ?? record.value)).filter(Number.isFinite);
    const max = Math.max(...values.map(value => Math.abs(value)), 1);
    const bars = values.map(value => `<span style="height:${Math.max(12, Math.round(Math.abs(value) / max * 100))}%" title="${deviceTelemetryEscape(value)}"></span>`).join('');
    const latest = String(ordered[ordered.length - 1]?.timestamp || '').trim() || 'Latest API sample';
    return `<div class="device-chart-card-v58"><div class="chart-card-head-v20"><strong>${deviceTelemetryEscape(metric)}</strong><small>${ordered.length} API sample(s) · ${deviceTelemetryEscape(latest)}</small></div><div class="mini-bar-chart-v20">${bars}</div></div>`;
  }).join('')}</div>`;
}
function architectureFlow(d: ZentridDeviceRecord): string {
  const live=deviceLiveRecord(d);
  const parentName=String(live.parentDeviceName || d.parent || '—');
  const parentId=String(live.parentDeviceId || '');
  const childCount=deviceOptionalNumber(live.childCount ?? d.children);
  const nodes: Array<[string,string]> = [];
  if (d.plant && d.plant !== '—') nodes.push(['Plant', String(d.plant)]);
  if (parentName && parentName !== '—') nodes.push(['Parent Device', parentName]);
  nodes.push(['Device', String(d.name || d.id)]);
  if (childCount !== null && childCount > 0) nodes.push(['Child Devices', String(childCount)]);
  return `<div class="device-architecture-v59">${nodes.map((n,i)=>`<div class="arch-node-v59"><span>${optionText(n[0])}</span><strong>${optionText(n[1])}</strong></div>${i<nodes.length-1?'<div class="arch-link-v59"><span></span></div>':''}`).join('')}</div>${parentId ? `<p class="muted device-note-v58">Parent device ID: ${optionText(parentId)}</p>` : ''}`;
}
function architectureRelations(d: ZentridDeviceRecord): string {
  const live=deviceLiveRecord(d);
  const childCount=deviceOptionalNumber(live.childCount ?? d.children);
  return `<div class="split-grid device-relations-v59"><div class="panel-lite"><h3>Returned Topology</h3>${cardGrid([['Plant',d.plant || '—'],['Parent Device',live.parentDeviceName || d.parent || '—'],['Parent Device ID',live.parentDeviceId || '—'],['Child Count',childCount === null ? '—' : childCount]],'device-param-grid-v58 compact-v59')}</div><div class="panel-lite"><h3>Source Relation</h3>${cardGrid([['Provider',d.vendor || '—'],['Integration',d.integration || '—'],['Source Device ID',d.externalId || '—'],['Data Quality',deviceLiveDataQuality(d)]],'device-param-grid-v58 compact-v59')}</div></div>`;
}
function stringRows(d: ZentridDeviceRecord): string {
  const live=deviceLiveRecord(d);
  const payload={ mpptChannels: live.mpptChannels ?? null, pvStrings: live.pvStrings ?? null, inputChannels: live.inputChannels ?? null };
  const hasData=[payload.mpptChannels,payload.pvStrings,payload.inputChannels].some(value => Array.isArray(value) ? value.length > 0 : Boolean(value));
  if (!hasData) return `<div class="empty-state"><strong>No PV string / MPPT data returned</strong><small>Platform Live did not return mpptChannels, pvStrings or inputChannels for this device.</small></div>`;
  return deviceApiPanel('Platform Live PV / MPPT Data', payload, 'No PV input data returned', 'Platform Live API · embedded in /api/devices/{liveDeviceId}');
}

function batteryDetail(d: ZentridDeviceRecord): string {
  const live=deviceLiveRecord(d);
  return `<div class="section-title-v17"><div><h2>Battery State</h2><p class="muted">Battery values are rendered only from telemetry and Platform Live battery modules.</p></div></div>${cardGrid([['SOC',deviceMetricValue(d,'soc')],['SOH',deviceMetricValue(d,'soh')],['Voltage',deviceMetricValue(d,'voltage')],['Current',deviceMetricValue(d,'current')],['Temperature',deviceMetricValue(d,'temperature')]],'device-param-grid-v58 compact-v59')}${deviceApiPanel('Platform Live Battery Modules', live.batteryModules, 'No battery modules returned', 'Platform Live API · embedded in /api/devices/{liveDeviceId}')}${deviceApiPanel('Platform Live Specification', live.specification, 'No live battery specification returned', 'Platform Live API · embedded in /api/devices/{liveDeviceId}')}`;
}

function configurationPanel(d: ZentridDeviceRecord): string {
  const live=deviceLiveRecord(d);
  const admin=deviceRawObject(d);
  return `<div class="section-title-v17"><div><h2>Configuration</h2><p class="muted">Capability, communication and security data are read from backend contracts. Write commands remain capability-gated.</p></div></div>${deviceApiPanel('Admin Specification', admin.specification, 'No administrative specification returned')}${deviceApiPanel('Platform Live Capabilities', live.capabilities, 'No live capabilities returned', 'Platform Live API · embedded in /api/devices/{liveDeviceId}')}${deviceApiPanel('Platform Live Communication', live.communication, 'No live communication profile returned', 'Platform Live API · embedded in /api/devices/{liveDeviceId}')}${deviceApiPanel('Platform Live Security', live.security, 'No live security profile returned', 'Platform Live API · embedded in /api/devices/{liveDeviceId}')}${deviceApiPanel('Platform Live Position', live.position, 'No live position returned', 'Platform Live API · embedded in /api/devices/{liveDeviceId}')}`;
}

function remoteControlPanel(d: ZentridDeviceRecord): string {
  const key=deviceTypeKey(d);
  const actions = key==='logger' ? ['Restart Communication','Search for Devices','Run Connectivity Test','Refresh Linked Devices'] : key==='battery' ? ['Manual Battery Health Check','Charge / Discharge Mode','Set SOC Reserve','Emergency Stop'] : key==='meter' ? ['Refresh Measurements','Verify Accounting Point','Sync Meter Clock'] : key==='weather' ? ['Refresh Sensors','Run Sensor Check','Calibrate Sensor'] : key==='module' ? ['Refresh Module Data','Locate Module','Open Parent Microinverter'] : ['Device Start / Stop','Active Power Adjustment','Reactive Power Adjustment','Power Factor Adjustment','Firmware Upgrade'];
  const capabilities=deviceRawRecord(deviceLiveRecord(d).capabilities);
  const capabilityConfirmed=Object.keys(capabilities).length > 0;
  const reason=capabilityConfirmed ? 'No mapped write endpoint · audit required' : 'Capability not confirmed by backend';
  return `<div class="device-control-grid-v58">${actions.map(a=>`<button type="button" disabled aria-disabled="true" title="${optionText(reason)}"><strong>${a}</strong><small>${optionText(reason)}</small></button>`).join('')}</div><p class="muted device-note-v58">Remote write actions are disabled until both backend capability and a supported audited mutation endpoint are available.</p>`;
}
function deviceLazyPanel(tab: ZentridDeviceTab, content: string): string {
  return window.ZentridDetailLazyTabs?.panel('device', String(tab || 'overview'), content) || content;
}
function deviceAlertsPanel(d: ZentridDeviceRecord): string {
  const loaded=Boolean(d.alertsLoaded);
  const alerts=Array.isArray(d.relatedAlerts) ? d.relatedAlerts : [];
  if (!loaded) return `<div class="plant-data-state-v119 empty"><strong>Alerts not loaded yet</strong><small>The device-scoped alert request runs when this tab opens.</small></div>`;
  if (!alerts.length) return `<div class="empty-state"><strong>No related alerts</strong><small>The device-scoped alert request completed without returning records for this device.</small></div>`;
  return `<div class="data-table compact-table device-alert-table-v58"><div class="data-head"><span>Alert</span><span>Severity</span><span>Source</span><span>Time</span><span>Status</span></div>${alerts.map(alert => `<div class="data-row"><div><strong>${optionText(alert.title || alert.canonicalName || alert.name || 'Alert')}</strong><small>${optionText(alert.message || alert.description || '')}</small></div><div><span class="badge ${deviceStatusCls(alert.severity)}">${optionText(alert.severity || alert.canonicalSeverity || 'Unknown')}</span></div><div><span>${optionText(alert.device || alert.deviceName || d.name)}</span></div><div><span>${optionText(alert.occurredAtUtc || alert.created || alert.updated || '—')}</span></div><div><span>${optionText(alert.status || alert.occurrenceStatus || '—')}</span></div></div>`).join('')}</div>`;
}

function deviceDetailPanel(d: ZentridDeviceRecord, tab: ZentridDeviceTab): string {
  if(tab==='overview') return `<div class="section-title-v17"><div><h2>Device Overview</h2><p class="muted">Type-driven workspace: ${deviceTypeLabel(d)} shows only relevant operational data.</p></div></div><div class="device-overview-grid-v58"><article><span>Operational Status</span><strong>${deviceStatusPill(d)}</strong><small>${d.lastSeen} · ${optionText(deviceUiFreshness(d).label)}</small></article><article><span>Lifecycle</span><strong>${deviceLifecyclePill(d)}</strong><small>Device Registry state</small></article><article><span>Plant</span><strong>${d.plant}</strong><small>${d.tenant}</small></article><article><span>Vendor / Model</span><strong>${d.vendor}</strong><small>${d.model}</small></article><article><span>Serial Number</span><strong>${d.serial}</strong><small>Admin Registry ID: ${optionText(d.id)}</small></article></div><div class="section-title-v17 mini"><div><h3>Realtime Snapshot</h3><p class="muted">Main values change by device type.</p></div></div>${deviceTelemetryAvailabilityNote(d)}${operatingDataGrid(d)}`;
  if(tab==='telemetry'||tab==='monitoring') return deviceLazyPanel(tab, `<div class="section-title-v17"><div><h2>Telemetry</h2><p class="muted">Administrative and live operational telemetry remain separate and are mapped into the same workspace.</p></div></div><div class="section-title-v17 mini"><div><h3>Device Registry Latest Telemetry</h3><p class="muted">GET /api/admin/devices/{id}/telemetry/latest</p></div></div>${deviceTelemetryPanel(d.telemetryLatest, 'Device Registry API · GET /api/admin/devices/{id}/telemetry/latest')}<div class="section-title-v17 mini"><div><h3>Platform Live Latest Telemetry</h3><p class="muted">GET /api/devices/{liveDeviceId}/telemetry/latest</p></div></div>${deviceLiveId(d) ? deviceTelemetryPanel(d.liveTelemetryLatest, 'Platform Live API · GET /api/devices/{liveDeviceId}/telemetry/latest') : `<div class="empty-state"><strong>Platform Live device not linked</strong><small>The administrative UUID is not assumed to be a Platform Live device id. Live telemetry is skipped until a source-device match is resolved.</small></div>`}`);
  if(tab==='architecture') return deviceLazyPanel(tab, `<div class="section-title-v17"><div><h2>Architecture</h2><p class="muted">Visual relationship between plant, device and connected objects.</p></div></div>${architectureFlow(d)}${architectureRelations(d)}`);
  if(tab==='strings') return `<div class="section-title-v17"><div><h2>PV Strings / Inputs</h2><p class="muted">MPPT and PV input values for inverter and microinverter devices.</p></div></div>${stringRows(d)}`;
  if(tab==='battery') return `<div class="section-title-v17"><div><h2>Battery State</h2><p class="muted">Storage-specific information: SOC, health, voltage/current, packages and limits.</p></div></div>${batteryDetail(d)}`;
  if(tab==='connectivity') return `<div class="section-title-v17"><div><h2>Connectivity</h2><p class="muted">Registry connectivity and Platform Live operational connectivity are shown separately.</p></div></div>${deviceApiPanel('Device Registry Connectivity', d.connectivityDetail, 'No Device Registry connectivity returned')}${deviceLiveSubresourcePanel(d, 'Platform Live Connectivity', d.liveConnectivityDetail, 'No Platform Live connectivity returned', 'connectivity')}${deviceApiPanel('Device Registry Network', d.networkDetail, 'No Device Registry network returned')}${deviceLiveSubresourcePanel(d, 'Platform Live Network', d.liveNetworkDetail, 'No Platform Live network returned', 'network')}<div class="section-title-v17 mini"><div><h3>Subordinate Devices</h3><p class="muted">Devices managed through this logger.</p></div></div>${linkedDevicesPanel(d.linkedDevices)}`;
  if(tab==='measurements') return `<div class="section-title-v17"><div><h2>Measurements</h2><p class="muted">Meter measurements returned by backend telemetry.</p></div></div>${operatingDataGrid(d)}${cardGrid([['Total Import',deviceMetricValue(d,'import')],['Total Export',deviceMetricValue(d,'export')]])}`;
  if(tab==='weather') return `<div class="section-title-v17"><div><h2>Weather Data</h2><p class="muted">Weather plant values used for performance analytics.</p></div></div>${operatingDataGrid(d)}`;
  if(tab==='module') return `<div class="section-title-v17"><div><h2>Module Data</h2><p class="muted">Module-level values are shown inside the device topology without turning the whole registry into module-only UI.</p></div></div>${deviceTelemetryAvailabilityNote(d)}${operatingDataGrid(d)}`;
  if(tab==='information') return `<div class="section-title-v17"><div><h2>Technical Info</h2><p class="muted">Static master data, vendor identifiers and lifecycle attributes.</p></div></div><div class="info-grid"><div><span>Device Name</span><strong>${d.name}</strong></div><div><span>Device Type</span><strong>${d.type}</strong></div><div><span>Subtype</span><strong>${d.subtype}</strong></div><div><span>Vendor</span><strong>${d.vendor}</strong></div><div><span>Manufacturer</span><strong>${d.manufacturer}</strong></div><div><span>Model</span><strong>${d.model}</strong></div><div><span>Serial Number</span><strong>${d.serial}</strong></div><div><span>Firmware</span><strong>${d.firmware}</strong></div><div><span>IP Address</span><strong>${d.ip}</strong></div><div><span>MAC Address</span><strong>${d.mac}</strong></div><div><span>Installation Date</span><strong>${d.installation}</strong></div><div><span>Warranty</span><strong>${d.warranty}</strong></div></div>`;
  if(tab==='alerts') return deviceLazyPanel(tab, `<div class="section-title-v17"><div><h2>Alerts / Faults</h2><p class="muted">Device-level events returned by the device-scoped alert query.</p></div></div>${deviceAlertsPanel(d)}<div class="drawer-actions"><button class="primary-action" onclick='void openDeviceAlerts(selectedDevice())'>Open Alerts Center</button></div>`);
  if(tab==='configuration') return configurationPanel(d) + `<div class="section-title-v17 mini"><div><h3>Remote Actions</h3><p class="muted">Common actions are shown below the config blocks.</p></div></div>${remoteControlPanel(d)}`;
  if(tab==='activity') return deviceLazyPanel(tab, `<div class="section-title-v17"><div><h2>Activity Log</h2><p class="muted">Server-recorded device activity from DeviceRegistry.</p></div></div>${deviceAuditPanel(d.auditDetail)}`);
  if(tab==='source') { const live=deviceLiveRecord(d); const sourceRef=deviceRawRecord(live.sourceReference); return `<div class="section-title-v17"><div><h2>Source & Sync</h2><p class="muted">Administrative identity and Platform Live vendor-normalized identity are intentionally kept separate.</p></div></div><div class="info-grid"><div><span>Integration</span><strong>${d.integration}</strong></div><div><span>Vendor</span><strong>${d.vendor}</strong></div><div><span>Source Device ID</span><strong>${d.externalId}</strong></div><div><span>Admin Registry ID</span><strong>${d.id}</strong></div><div><span>Canonical / Platform Live ID</span><strong>${optionText(deviceLiveId(d) || 'Not linked')}</strong></div><div><span>Live Identity Lookup</span><strong>${optionText(deviceLiveLookupStatus(d) === 'matched' ? 'Matched by source identity' : 'Not matched')}</strong><small>Admin Registry UUID is not assumed to be a Platform Live ID</small></div><div><span>Source Plant ID</span><strong>${optionText(deviceLiveSourcePlantId(d))}</strong></div><div><span>UI Freshness</span><strong>${deviceFreshnessHtml(d)}</strong></div><div><span>Backend Data Quality</span><strong>${optionText(deviceLiveDataQuality(d))}</strong></div><div><span>Operational Status</span><strong>${optionText(deviceLiveStatus(d))}</strong></div><div><span>Last Seen</span><strong>${optionText(deviceLiveLastSeen(d))}</strong></div><div><span>Last Sync</span><strong>${optionText(deviceLiveLastSync(d))}</strong></div><div><span>Data Updated</span><strong>${optionText(live.dataUpdatedAtUtc || '—')}</strong></div><div><span>Raw Payload Ref</span><strong>${optionText(sourceRef.rawPayloadRef || '—')}</strong></div></div>${deviceLiveId(d) ? `${deviceApiPanel('Platform Live Technical Summary', live.technicalSummary, 'No Platform Live technical summary returned', 'Platform Live API · GET /api/devices/{liveDeviceId}')}${deviceApiPanel('Platform Live Source Reference', live.sourceReference, 'No Platform Live source reference returned', 'Platform Live API · normalized sourceReference from /api/devices/{liveDeviceId}')}${deviceApiPanel('Vendor Extensions', live.vendorExtensions, 'No vendor extensions returned', 'Platform Live API · vendorExtensions from /api/devices/{liveDeviceId}')}` : `<div class="empty-state"><strong>Platform Live device not linked</strong><small>No live technical, source-reference or vendor-extension subresources are shown until the source identity is matched.</small></div>`}`; }
  if(tab==='passport') return deviceLazyPanel(tab, devicePassportPanelV92(d) + deviceApiPanel('Device Registry Warranty', d.warrantyDetail, 'No Device Registry warranty returned') + deviceLiveSubresourcePanel(d, 'Platform Live Warranty', d.liveWarrantyDetail, 'No Platform Live warranty returned', 'warranty'));
  if(tab==='connectivity-full') return deviceLazyPanel(tab, deviceConnectivityFullPanelV92(d) + deviceApiPanel('Device Registry Connectivity', d.connectivityDetail, 'No Device Registry connectivity returned') + deviceLiveSubresourcePanel(d, 'Platform Live Connectivity', d.liveConnectivityDetail, 'No Platform Live connectivity returned', 'connectivity') + deviceApiPanel('Device Registry Network', d.networkDetail, 'No Device Registry network returned') + deviceLiveSubresourcePanel(d, 'Platform Live Network', d.liveNetworkDetail, 'No Platform Live network returned', 'network'));
  if(tab==='lifecycle') return deviceLazyPanel(tab, lifecyclePanelV92(d));
  if(tab==='related') return deviceLazyPanel(tab, relatedObjectsPanelV92(d));
  if(tab==='documents') return deviceDocumentsPanelV92(d);
  if(tab==='audit') return deviceLazyPanel(tab, `<div class="section-title-v17"><div><h2>Device Audit</h2><p class="muted">Create, update and lifecycle actions returned by DeviceRegistry.</p></div></div>${deviceAuditPanel(d.auditDetail)}`);
  return '';
}

function deviceRawObject(d: ZentridDeviceRecord): Record<string, unknown> {
  return d.raw && typeof d.raw === 'object' ? d.raw : {};
}
function deviceRawRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function deviceUpdatePayload(d: ZentridDeviceRecord, form: HTMLFormElement): Record<string, unknown> {
  const raw=deviceRawObject(d);
  const identity=deviceRawRecord(raw.identity);
  const source=deviceRawRecord(raw.source);
  const status=deviceRawRecord(raw.status);
  const technical=deviceRawRecord(raw.technical);
  const plantRelation=deviceRawRecord(raw.plantRelation);
  const fd=new FormData(form);
  const text=(name:string, fallback=''):string=>deviceEditableValue(fd.get(name) ?? fallback);
  const payload: Record<string, unknown> = {
    deviceCode: text('deviceCode', String(raw.deviceCode || identity.deviceCode || d.externalId || d.id)),
    plantRelation: { plantId: text('plantId', String(plantRelation.plantId || d.plantId || '')) },
    identity: {
      deviceName: text('deviceName', String(identity.deviceName || d.name || '')),
      deviceType: String(identity.deviceType || d.type || ''),
      serialNumber: text('serialNumber', String(identity.serialNumber || d.serial || '')),
      deviceCode: text('deviceCode', String(raw.deviceCode || identity.deviceCode || d.externalId || d.id)),
      manufacturer: text('manufacturer', String(identity.manufacturer || d.manufacturer || d.vendor || '')),
      model: text('model', String(identity.model || d.model || ''))
    },
    source: {
      provider: String(source.provider || d.vendor || ''),
      integration: source.integration ?? undefined,
      sourceDeviceId: String(source.sourceDeviceId || identity.serialNumber || d.serial || '')
    },
    status: {
      lifecycleStatus: String(status.lifecycleStatus || status.deviceStatus || d.lifecycle || 'Draft'),
      dataQualityStatus: status.dataQualityStatus ?? undefined
    },
    technical: {
      vendorModel: text('model', String(technical.vendorModel || identity.model || d.model || '')),
      ratedPowerKw: technical.ratedPowerKw ?? undefined,
      role: technical.role ?? undefined,
      firmwareVersion: text('firmwareVersion', String(technical.firmwareVersion || d.firmware || '')),
      protocolVersion: technical.protocolVersion ?? undefined,
      location: text('location', String(technical.location || d.location || '')),
      ipAddress: technical.ipAddress ?? undefined,
      macAddress: technical.macAddress ?? undefined,
      warranty: technical.warranty ?? undefined
    }
  };
  for (const key of ['locationRelation','topology','parentRelation','lifecycle','specification','capabilities','communication','security','position','relations','telemetry','mpptChannels','pvStrings','batteryModules','inputChannels','linkedModules','accounting','vendorPayload','vendorExtensions']) {
    if (raw[key] !== undefined) payload[key]=raw[key];
  }
  const compact=(value:unknown):unknown=>{
    if (Array.isArray(value)) return value.map(compact);
    if (!value || typeof value !== 'object') return value === undefined ? undefined : value;
    const entries=Object.entries(value as Record<string,unknown>).map(([key,item])=>[key,compact(item)] as const).filter(([,item])=>item!==undefined);
    return Object.fromEntries(entries);
  };
  return compact(payload) as Record<string, unknown>;
}
function deviceEditModal(d: ZentridDeviceRecord): string {
  const raw=deviceRawObject(d); const identity=deviceRawRecord(raw.identity); const technical=deviceRawRecord(raw.technical); const plantRelation=deviceRawRecord(raw.plantRelation);
  return `<aside class="modal" id="deviceEditModal"><div class="modal-card wide-modal device-create-modal-v2"><button class="modal-close" id="closeDeviceEdit" type="button">×</button><div class="panel-head device-create-panel-head"><div><h2>Edit Device</h2><p>Updates the administrative record through PUT. The request is never retried automatically.</p></div><span class="badge warning">Backend-safe mode</span></div><form id="deviceEditForm" class="client-form-grid two-col"><label>Device Name<input name="deviceName" required value="${optionText(identity.deviceName || d.name || '')}"></label><label>Device Code<input name="deviceCode" required value="${optionText(raw.deviceCode || identity.deviceCode || d.externalId || '')}"></label><label>Plant ID<input name="plantId" required value="${optionText(plantRelation.plantId || d.plantId || '')}"></label><label>Serial Number<input name="serialNumber" required value="${optionText(identity.serialNumber || d.serial || '')}"></label><label>Manufacturer<input name="manufacturer" value="${optionText(deviceEditableValue(identity.manufacturer || d.manufacturer || d.vendor || ''))}"></label><label>Model<input name="model" value="${optionText(deviceEditableValue(identity.model || d.model || ''))}"></label><label>Firmware<input name="firmwareVersion" value="${optionText(deviceEditableValue(technical.firmwareVersion || d.firmware || ''))}"></label><label>Location<input name="location" value="${optionText(deviceEditableValue(technical.location || d.location || ''))}"></label><details class="full device-payload-details"><summary>PUT payload preview</summary><label class="full">Request JSON<textarea id="deviceEditPayload" rows="18" spellcheck="false"></textarea><small>Operational status is intentionally excluded. Existing type-specific objects are preserved from the latest GET response.</small></label></details><div id="deviceEditResult" class="api-inline-result neutral full"><strong>No update sent yet</strong><small>After any 500 response the UI verifies the actual server state with GET.</small></div><div class="modal-actions full"><button class="secondary-action" id="cancelDeviceEdit" type="button">Cancel</button><button class="primary-action" type="submit">Save Device</button></div></form></div></aside>`;
}
function deviceUpdateMatches(payload: Record<string, unknown>, raw: Record<string, unknown>): boolean {
  const wantedIdentity=deviceRawRecord(payload.identity); const actualIdentity=deviceRawRecord(raw.identity);
  const wantedTechnical=deviceRawRecord(payload.technical); const actualTechnical=deviceRawRecord(raw.technical);
  return ['deviceName','serialNumber','manufacturer','model'].every(key => String(wantedIdentity[key] ?? '') === String(actualIdentity[key] ?? '')) &&
    ['firmwareVersion','location','vendorModel'].every(key => String(wantedTechnical[key] ?? '') === String(actualTechnical[key] ?? ''));
}
function wireDeviceEdit(d: ZentridDeviceRecord): void {
  const modal=document.getElementById('deviceEditModal'); const form=document.getElementById('deviceEditForm') as HTMLFormElement | null; const editor=document.getElementById('deviceEditPayload') as HTMLTextAreaElement | null; const result=document.getElementById('deviceEditResult');
  if (!modal || !form || !editor) return;
  const sync=()=>{ editor.value=JSON.stringify(deviceUpdatePayload(d, form), null, 2); };
  document.getElementById('openDeviceEdit')?.addEventListener('click',()=>{ sync(); modal.classList.add('open'); });
  const close=()=>modal.classList.remove('open');
  document.getElementById('closeDeviceEdit')?.addEventListener('click',close); document.getElementById('cancelDeviceEdit')?.addEventListener('click',close);
  form.querySelectorAll('input').forEach(control=>control.addEventListener('input',sync)); sync();
  form.addEventListener('submit', async event=>{
    event.preventDefault(); const submit=form.querySelector<HTMLButtonElement>('button[type="submit"]'); if (submit) submit.disabled=true;
    let payload:Record<string,unknown>; try { payload=JSON.parse(editor.value); } catch (_error) { if(result){result.className='api-inline-result danger';result.innerHTML='<strong>Invalid JSON</strong><small>Correct the PUT payload before saving.</small>';} if(submit)submit.disabled=false; return; }
    if(result){result.className='api-inline-result loading';result.innerHTML='<strong>Updating device…</strong><small>PUT /api/admin/devices/{id}</small>';}
    try {
      await window.ZentridPlatformAPI.deviceRegistry.update(d.id,payload);
      if(result){result.className='api-inline-result success';result.innerHTML='<strong>Device updated</strong><small>The backend returned a successful response.</small>';}
      window.setTimeout(()=>location.reload(),600);
    } catch(error) {
      const message=error instanceof Error?error.message:String(error);
      try {
        const verification=await window.ZentridPlatformAPI.deviceRegistry.get(d.id) as Record<string,unknown>;
        const verified=deviceUpdateMatches(payload, verification);
        if(verified){ if(result){result.className='api-inline-result warning';result.innerHTML='<strong>Update saved despite server error</strong><small>The PUT returned an error, but a follow-up GET confirmed the edited values. The request was not retried.</small>';} window.setTimeout(()=>location.reload(),1000); }
        else if(result){result.className='api-inline-result danger';result.innerHTML=`<strong>Device update failed</strong><small>${optionText(message)} Follow-up GET did not confirm the requested values.</small>`;}
      } catch(_verificationError) { if(result){result.className='api-inline-result danger';result.innerHTML=`<strong>Device update failed</strong><small>${optionText(message)} Server state could not be verified.</small>`;} }
      if(submit) submit.disabled=false;
    }
  });
}

function renderDeviceDetail(): string {
  const d=selectedDevice();
  if (!d.id) return window.ZentridApiOnly?.emptyState('Device Detail', 'The device endpoint has not returned a selected record.', '/api/admin/devices') || '';
  const sourceBadge=deviceLiveId(d) ? '<span class="record-origin-chip mixed compact" data-record-origin="mixed" title="Data source: Device Registry + Platform Live">Registry + Live</span>' : '<span class="record-origin-chip live compact" data-record-origin="live" title="Data source: Device Registry API">Device Registry API</span>';
  return `<section class="page-hero device-hero-v58 device-hero-v59"><div><p class="eyebrow">Global Admin · Device Detail ${sourceBadge}</p><h1>${d.name}</h1><p class="muted">${deviceTypeLabel(d)} · ${d.manufacturer || d.vendor} ${d.model} · ${d.serial}</p></div><div class="hero-actions">${deviceHeroActions(d)}</div></section>
  <section class="context-bar glass-card device-context-v58"><div><span>Plant</span><strong>${d.plant}</strong></div><div><span>Tenant</span><strong>${d.tenant}</strong></div><div><span>Device Type</span><strong>${deviceTypeLabel(d)}</strong></div><div><span>Last Communication</span><strong>${d.lastSeen}</strong></div></section>
  ${deviceKpis(d)}
  <section class="detail-layout-v58 device-detail-layout-v58 device-detail-layout-v59">${universalDeviceSidebar(d, deviceDetailActiveTab)}<main class="glass-card detail-main-v58"><div id="deviceDetailContent">${deviceDetailPanel(d,deviceDetailActiveTab)}</div></main></section>${deviceEditModal(d)}`;
}
function deviceDocumentFeedback(tone: string, title: string, message: string): void {
  const box=document.getElementById('deviceDocumentFeedback');
  if (!box) return;
  box.className=`api-inline-result ${tone}`;
  box.innerHTML=`<strong>${optionText(title)}</strong><small>${optionText(message)}</small>`;
}
async function downloadDeviceDocument(deviceId: string, deviceDocument: ZentridDeviceDocument): Promise<void> {
  const payload=await window.ZentridPlatformAPI.deviceRegistry.getDocument(deviceId, deviceDocument.id);
  const blob=payload instanceof Blob ? payload : new Blob([typeof payload === 'string' ? payload : JSON.stringify(payload ?? {})], { type:'application/octet-stream' });
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url; link.download=deviceDocument.fileName || deviceDocument.name || 'device-document';
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url), 1000);
}
function wireDeviceDocuments(d: ZentridDeviceRecord): void {
  const form=document.getElementById('deviceDocumentUploadForm') as HTMLFormElement | null;
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const fileInput=document.getElementById('deviceDocumentFile') as HTMLInputElement | null;
    const nameInput=document.getElementById('deviceDocumentName') as HTMLInputElement | null;
    const typeInput=document.getElementById('deviceDocumentType') as HTMLSelectElement | null;
    const expiryInput=document.getElementById('deviceDocumentExpiry') as HTMLInputElement | null;
    const file=fileInput?.files?.[0];
    const name=String(nameInput?.value || '').trim();
    if (!file || !name) { deviceDocumentFeedback('danger','Missing document data','Select a file and enter a document name.'); return; }
    const payload=new FormData(); payload.append('file', file); payload.append('name', name); payload.append('type', typeInput?.value || 'Other');
    if (expiryInput?.value) payload.append('expiry', new Date(expiryInput.value).toISOString());
    deviceDocumentFeedback('info','Uploading document','Sending multipart/form-data to DeviceRegistry…');
    try {
      const response=await window.ZentridPlatformAPI.deviceRegistry.uploadDocument(d.id, payload) as ZentridDeviceDocument;
      const documents=deviceDocuments(d).filter(item => item.id !== response.id); documents.unshift(response); writeDeviceDocumentCache(d.id, documents); d.documents=documents;
      const content=document.getElementById('deviceDetailContent'); if (content) content.innerHTML=deviceDocumentsPanelV92(d); wireDeviceDocuments(d);
      deviceDocumentFeedback('success','Document uploaded',`${response.name || name} is available for download.`);
    } catch (error) { deviceDocumentFeedback('danger','Document upload failed',error instanceof Error ? error.message : String(error)); }
  });
  document.querySelectorAll<HTMLElement>('[data-download-device-document]').forEach(button => button.addEventListener('click', async () => {
    const id=button.dataset.downloadDeviceDocument || ''; const document=deviceDocuments(d).find(item => item.id===id); if (!document) return;
    button.setAttribute('disabled','true');
    try { await downloadDeviceDocument(d.id, document); } catch (error) { deviceDocumentFeedback('danger','Download failed',error instanceof Error ? error.message : String(error)); } finally { button.removeAttribute('disabled'); }
  }));
  document.querySelectorAll<HTMLElement>('[data-delete-device-document]').forEach(button => button.addEventListener('click', async () => {
    const id=button.dataset.deleteDeviceDocument || ''; if (!id) return;
    button.setAttribute('disabled','true');
    try {
      await window.ZentridPlatformAPI.deviceRegistry.deleteDocument(d.id, id);
      const documents=deviceDocuments(d).filter(item => item.id!==id); writeDeviceDocumentCache(d.id, documents); d.documents=documents;
      const content=document.getElementById('deviceDetailContent'); if (content) content.innerHTML=deviceDocumentsPanelV92(d); wireDeviceDocuments(d);
      deviceDocumentFeedback('success','Document deleted','The device document was deleted successfully.');
    } catch (error) { button.removeAttribute('disabled'); deviceDocumentFeedback('danger','Delete failed',error instanceof Error ? error.message : String(error)); }
  }));
}

async function runDeviceLifecycleAction(d: ZentridDeviceRecord, action: 'activate' | 'deactivate' | 'archive'): Promise<void> {
  const api=window.ZentridPlatformAPI?.deviceRegistry;
  if (!api || !d.id) return;
  const label=action === 'activate' ? 'Activate' : action === 'deactivate' ? 'Deactivate' : 'Archive';
  if (action === 'archive' && !window.confirm(`Archive ${d.name}? The device will remain in Device Registry with lifecycle status Archived.`)) return;
  try {
    const button=document.querySelector<HTMLElement>(`[data-device-lifecycle-action="${action}"]`);
    button?.setAttribute('disabled','true');
    const payload=await api[action](d.id) as Record<string, unknown>;
    const status=(payload?.status && typeof payload.status === 'object') ? payload.status as Record<string,unknown> : {};
    const next=String(status.lifecycleStatus || status.deviceStatus || label);
    window.ZentridAPIRepositories?.cache.invalidate('devices');
    ZentridLayout.toast(`${d.name}: lifecycle changed to ${next}`);
    window.setTimeout(()=>location.reload(), 120);
  } catch (error) {
    ZentridLayout.toast(error instanceof Error ? error.message : `${label} failed`);
    document.querySelector<HTMLElement>(`[data-device-lifecycle-action="${action}"]`)?.removeAttribute('disabled');
  }
}

function wireDeviceDetail(): void {
  const d=selectedDevice();
  if (!d.id) return;
  document.getElementById('refreshDeviceV59')?.addEventListener('click',()=>location.reload());
  document.querySelectorAll<HTMLElement>('[data-device-lifecycle-action]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.deviceLifecycleAction;
    if (action === 'activate' || action === 'deactivate' || action === 'archive') void runDeviceLifecycleAction(d, action);
  }));
  wireDeviceEdit(d);
  window.ZentridDetailLazyTabs?.observe('device', 'device-detail-content', () => {
    const current=selectedDevice();
    const content=document.getElementById('deviceDetailContent');
    if(content) content.innerHTML=deviceDetailPanel(current, deviceDetailActiveTab);
    const kpis=document.getElementById('deviceDetailKpis');
    if (kpis) {
      const holder=document.createElement('div'); holder.innerHTML=deviceKpis(current);
      const next=holder.firstElementChild; if (next) kpis.replaceWith(next);
    }
    if (deviceDetailActiveTab === 'documents') wireDeviceDocuments(current);
  });
  document.querySelectorAll<HTMLElement>('[data-device-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    deviceDetailActiveTab = btn.dataset.deviceTab || 'overview';
    document.querySelectorAll<HTMLElement>('[data-device-tab]').forEach(item => {
      const active = item.dataset.deviceTab === deviceDetailActiveTab;
      item.classList.toggle('active', active);
      if (active) item.setAttribute('aria-current','page'); else item.removeAttribute('aria-current');
    });
    window.ZentridDetailLazyTabs?.activate('device', String(deviceDetailActiveTab));
    const current=selectedDevice();
    const content=document.getElementById('deviceDetailContent');
    if(content) content.innerHTML=deviceDetailPanel(current, deviceDetailActiveTab);
    if (deviceDetailActiveTab === 'documents') wireDeviceDocuments(current);
  }));
}
