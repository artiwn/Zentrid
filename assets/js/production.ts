type ProductionCurrency = 'USD' | 'EUR' | string;
type ProductionLevel = 'tenantList' | 'tenantDetail' | 'clientList' | 'clientDetail' | 'plantList' | 'plantDetail' | 'plantIndex';
type ProductionHierarchy = 'tenantFirst' | 'plantFirst';
type ProductionTab = 'overview' | 'clients' | 'plants' | 'flow' | 'day' | 'weekly' | 'monthly' | 'revenue' | 'source' | 'activity';
type ProductionChartTab = 'day' | 'weekly' | 'monthly';
type ProductionNumericFlowField = Exclude<keyof ProductionFlowFields, 'currency'>;
type ProductionKind = 'tenant' | 'client' | 'plant';

interface ProductionFlowFields {
  produced: number;
  used: number;
  batteryCharge: number;
  batteryDischarge: number;
  gridExport: number;
  gridImport: number;
  revenue: number;
  currency: ProductionCurrency;
}

interface ProductionTenant extends ProductionFlowFields {
  id: string;
  name: string;
  type: string;
  status: string;
  clients: number;
  plants: number;
  freshness: string;
  alerts: number;
}

interface ProductionClient extends ProductionFlowFields {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  status: string;
  plants: number;
  tariff: string;
  freshness: string;
}

interface ProductionPlant extends ProductionFlowFields {
  id: string;
  clientId: string;
  tenantId: string;
  name: string;
  code: string;
  vendor: string;
  status: string;
  pvPower: string;
  exportRate: string;
  freshness: string;
  tariff: string;
  dataQuality: string;
  sourceScreen: string;
}

type ProductionRecord = Partial<ProductionTenant> & Partial<ProductionClient> & Partial<ProductionPlant>;

interface ProductionState {
  level: ProductionLevel;
  hierarchy: ProductionHierarchy;
  tenantId: string | null;
  clientId: string | null;
  plantId: string | null;
  period: string;
  query: string;
  detailTab: ProductionTab;
}

interface ProductionChartRow extends Record<string, string | number | undefined> {
  time?: string;
  label?: string;
  production: number;
  home: number;
  battery: number;
  grid: number;
}

const productionTenants: ProductionTenant[] = [
  { id:'TEN-ALPHA', name:'Tenant Alpha Energy', type:'Solar O&M Tenant', status:'Active', clients:3, plants:5, produced:247.4, used:68.2, batteryCharge:29.6, batteryDischarge:6.8, gridExport:156.4, gridImport:4.2, revenue:18420, currency:'USD', freshness:'2 min ago', alerts:7 },
  { id:'TEN-NORTH', name:'Tenant North Operations', type:'Hybrid Devices Tenant', status:'Active', clients:2, plants:3, produced:126.8, used:31.4, batteryCharge:58.7, batteryDischarge:14.1, gridExport:50.8, gridImport:2.9, revenue:10320, currency:'USD', freshness:'8 min ago', alerts:4 },
  { id:'TEN-GAMMA', name:'Tenant Gamma Grid', type:'Commercial Solar Tenant', status:'Warning', clients:2, plants:3, produced:88.1, used:23.7, batteryCharge:0, batteryDischarge:0, gridExport:64.4, gridImport:7.5, revenue:7240, currency:'EUR', freshness:'18 min ago', alerts:12 },
  { id:'TEN-DELTA', name:'Tenant Delta Enterprise', type:'Enterprise Tenant', status:'Active', clients:1, plants:1, produced:148.0, used:39.5, batteryCharge:21.4, batteryDischarge:5.2, gridExport:92.3, gridImport:1.4, revenue:12180, currency:'EUR', freshness:'3 min ago', alerts:1 }
];
const productionClients: ProductionClient[] = [
  { id:'CLI-ARPI', tenantId:'TEN-ALPHA', name:'Arpi Solar Group', type:'Legal Entity', status:'Active', plants:3, produced:247.4, used:68.2, batteryCharge:29.6, batteryDischarge:6.8, gridExport:156.4, gridImport:4.2, revenue:18420, currency:'USD', tariff:'Export + self-use', freshness:'2 min ago' },
  { id:'CLI-IVAN', tenantId:'TEN-ALPHA', name:'Ivan Petrov', type:'Individual', status:'Active', plants:1, produced:18.6, used:10.4, batteryCharge:0, batteryDischarge:0, gridExport:8.2, gridImport:0.4, revenue:820, currency:'USD', tariff:'Residential export', freshness:'4 min ago' },
  { id:'CLI-ROOF', tenantId:'TEN-ALPHA', name:'Yerevan Rooftop Cluster', type:'Legal Entity', status:'Review', plants:1, produced:29.7, used:20.8, batteryCharge:0, batteryDischarge:0, gridExport:8.9, gridImport:1.1, revenue:610, currency:'USD', tariff:'Missing tariff review', freshness:'11 min ago' },
  { id:'CLI-NORTH', tenantId:'TEN-NORTH', name:'North Valley Client', type:'Legal Entity', status:'Active', plants:1, produced:30.8, used:11.4, batteryCharge:10.9, batteryDischarge:2.8, gridExport:11.3, gridImport:0.9, revenue:1980, currency:'USD', tariff:'Hybrid settlement', freshness:'7 min ago' },
  { id:'CLI-ARMAVIR', tenantId:'TEN-NORTH', name:'Armavir Storage Holdings', type:'Legal Entity', status:'Warning', plants:2, produced:96.0, used:20.0, batteryCharge:47.8, batteryDischarge:11.3, gridExport:39.5, gridImport:2.0, revenue:8340, currency:'USD', tariff:'Storage + export', freshness:'18 min ago' },
  { id:'CLI-GAMMA', tenantId:'TEN-GAMMA', name:'Gamma Grid Holdings', type:'Legal Entity', status:'Warning', plants:2, produced:25.0, used:9.6, batteryCharge:0, batteryDischarge:0, gridExport:15.4, gridImport:5.0, revenue:2120, currency:'EUR', tariff:'Commercial export', freshness:'54 min ago' },
  { id:'CLI-VALENCIA', tenantId:'TEN-GAMMA', name:'Valencia Rooftop Owners', type:'Client Group', status:'Active', plants:1, produced:63.1, used:14.1, batteryCharge:0, batteryDischarge:0, gridExport:49.0, gridImport:2.5, revenue:5120, currency:'EUR', tariff:'Rooftop export', freshness:'1 min ago' },
  { id:'CLI-LYON', tenantId:'TEN-DELTA', name:'Lyon Energy Client', type:'Legal Entity', status:'Active', plants:1, produced:148.0, used:39.5, batteryCharge:21.4, batteryDischarge:5.2, gridExport:92.3, gridImport:1.4, revenue:12180, currency:'EUR', tariff:'Enterprise PPA', freshness:'3 min ago' }
];
const productionPlants: ProductionPlant[] = [
  { id:'PLT-000421', clientId:'CLI-ARPI', tenantId:'TEN-ALPHA', name:'Plant A', code:'ARM-BER-001', vendor:'Huawei', status:'Normal', produced:182.0, used:42.0, batteryCharge:23.8, batteryDischarge:5.8, gridExport:122.0, gridImport:2.4, revenue:14200, currency:'USD', pvPower:'31.8 MW', exportRate:'67%', freshness:'2 min ago', tariff:'Enterprise export tariff', dataQuality:'Fresh', sourceScreen:'Huawei · Plant Dashboard' },
  { id:'PLT-000422', clientId:'CLI-ARPI', tenantId:'TEN-ALPHA', name:'Gyumri Solar West', code:'ARM-GYU-002', vendor:'Huawei', status:'Warning', produced:41.0, used:18.2, batteryCharge:5.8, batteryDischarge:1.0, gridExport:18.0, gridImport:1.1, revenue:3180, currency:'USD', pvPower:'6.4 MW', exportRate:'44%', freshness:'11 min ago', tariff:'Commercial export tariff', dataQuality:'Delayed', sourceScreen:'Huawei · Plant Dashboard' },
  { id:'PLT-000817', clientId:'CLI-ARPI', tenantId:'TEN-ALPHA', name:'Plant B', code:'ARP-MAS-008', vendor:'Deye', status:'Normal', produced:24.4, used:8.0, batteryCharge:0, batteryDischarge:0, gridExport:16.4, gridImport:0.7, revenue:1040, currency:'USD', pvPower:'3.7 MW', exportRate:'67%', freshness:'4 min ago', tariff:'Residential / small C&I', dataQuality:'Fresh', sourceScreen:'Deye · Plant Detail' },
  { id:'PLT-IVAN-01', clientId:'CLI-IVAN', tenantId:'TEN-ALPHA', name:'Residential PV 01', code:'RES-YER-014', vendor:'GoodWe', status:'Normal', produced:18.6, used:10.4, batteryCharge:0, batteryDischarge:0, gridExport:8.2, gridImport:0.4, revenue:820, currency:'USD', pvPower:'2.1 kW', exportRate:'44%', freshness:'4 min ago', tariff:'Residential export', dataQuality:'Fresh', sourceScreen:'GoodWe · Plant Detail' },
  { id:'PLT-ROOF-01', clientId:'CLI-ROOF', tenantId:'TEN-ALPHA', name:'Yerevan Rooftop A', code:'ROOF-YER-002', vendor:'Solis', status:'Pending Review', produced:29.7, used:20.8, batteryCharge:0, batteryDischarge:0, gridExport:8.9, gridImport:1.1, revenue:610, currency:'USD', pvPower:'1.9 MW', exportRate:'30%', freshness:'11 min ago', tariff:'Missing tariff review', dataQuality:'Needs mapping review', sourceScreen:'Solis · Plant Overview' },
  { id:'PLT-NORTH-01', clientId:'CLI-NORTH', tenantId:'TEN-NORTH', name:'North Valley Solar 01', code:'NOR-SOL-001', vendor:'Sungrow', status:'Normal', produced:30.8, used:11.4, batteryCharge:10.9, batteryDischarge:2.8, gridExport:11.3, gridImport:0.9, revenue:1980, currency:'USD', pvPower:'4.8 MW', exportRate:'37%', freshness:'7 min ago', tariff:'Hybrid settlement', dataQuality:'Fresh', sourceScreen:'Sungrow · Plant Detail' },
  { id:'PLT-000501', clientId:'CLI-ARMAVIR', tenantId:'TEN-NORTH', name:'Armavir BESS Solar', code:'NOR-ARM-101', vendor:'Sungrow', status:'Warning', produced:96.0, used:20.0, batteryCharge:47.8, batteryDischarge:11.3, gridExport:39.5, gridImport:2.0, revenue:8340, currency:'USD', pvPower:'18.5 MW', exportRate:'41%', freshness:'18 min ago', tariff:'Storage + export', dataQuality:'Partial', sourceScreen:'Sungrow · Hybrid Dashboard' },
  { id:'PLT-GAMMA-01', clientId:'CLI-GAMMA', tenantId:'TEN-GAMMA', name:'Madrid East', code:'HEL-MAD-014', vendor:'Solis', status:'Fault', produced:6.0, used:3.2, batteryCharge:0, batteryDischarge:0, gridExport:2.8, gridImport:3.7, revenue:410, currency:'EUR', pvPower:'0.0 MW', exportRate:'47%', freshness:'54 min ago', tariff:'Commercial export', dataQuality:'Stale', sourceScreen:'Solis · Faulted Plant' },
  { id:'PLT-GAMMA-02', clientId:'CLI-GAMMA', tenantId:'TEN-GAMMA', name:'Madrid Backup Rooftop', code:'HEL-MAD-018', vendor:'Solis', status:'Warning', produced:19.0, used:6.4, batteryCharge:0, batteryDischarge:0, gridExport:12.6, gridImport:1.3, revenue:1710, currency:'EUR', pvPower:'1.4 MW', exportRate:'66%', freshness:'22 min ago', tariff:'Commercial export', dataQuality:'Delayed', sourceScreen:'Solis · Plant Overview' },
  { id:'PLT-000612', clientId:'CLI-VALENCIA', tenantId:'TEN-GAMMA', name:'Valencia Rooftop Cluster', code:'HEL-VAL-015', vendor:'Solis', status:'Normal', produced:63.1, used:14.1, batteryCharge:0, batteryDischarge:0, gridExport:49.0, gridImport:2.5, revenue:5120, currency:'EUR', pvPower:'2.1 MW', exportRate:'78%', freshness:'1 min ago', tariff:'Rooftop export', dataQuality:'Fresh', sourceScreen:'Solis · Plant Overview' },
  { id:'PLT-000720', clientId:'CLI-LYON', tenantId:'TEN-DELTA', name:'Lyon PV Park', code:'SOL-LYO-004', vendor:'Huawei', status:'Normal', produced:148.0, used:39.5, batteryCharge:21.4, batteryDischarge:5.2, gridExport:92.3, gridImport:1.4, revenue:12180, currency:'EUR', pvPower:'25.2 MW', exportRate:'62%', freshness:'3 min ago', tariff:'Enterprise PPA', dataQuality:'Fresh', sourceScreen:'Huawei · Plant Dashboard' }
];


let productionState: ProductionState = { level:'tenantList', hierarchy:'tenantFirst', tenantId:null, clientId:null, plantId:null, period:'Today', query:'', detailTab:'overview' };

function productionStatusCls(v: unknown): string{ const value=String(v||'').toLowerCase(); if(value.includes('fault')||value.includes('stale'))return'danger'; if(value.includes('warning')||value.includes('review')||value.includes('pending')||value.includes('partial')||value.includes('delayed'))return'warning'; return'success'; }
function formatEnergy(v: unknown): string{ return `${Number(v||0).toLocaleString(undefined,{maximumFractionDigits:1})} MWh`; }
function formatRevenue(v: unknown,c: ProductionCurrency='USD'): string{ return `${c==='EUR'?'€':'$'}${Number(v||0).toLocaleString()}`; }
function getTenant(id: string | null): ProductionTenant | undefined{ return productionTenants.find(x=>x.id===id); }
function getClient(id: string | null): ProductionClient | undefined{ return productionClients.find(x=>x.id===id); }
function getPlant(id: string | null): ProductionPlant | undefined{ return productionPlants.find(x=>x.id===id); }
function getFlow(r: ProductionRecord = {}): ProductionFlowFields{ return { produced:+(r.produced||0), used:+(r.used||0), batteryCharge:+(r.batteryCharge||0), batteryDischarge:+(r.batteryDischarge||0), gridExport:+(r.gridExport||0), gridImport:+(r.gridImport||0), revenue:+(r.revenue||0), currency:r.currency||'USD' }; }
function sumRows(rows: ProductionRecord[],currency: ProductionCurrency='USD'): ProductionFlowFields{ return rows.reduce<ProductionFlowFields>((a,r)=>{ const f=getFlow(r); a.produced+=f.produced; a.used+=f.used; a.batteryCharge+=f.batteryCharge; a.batteryDischarge+=f.batteryDischarge; a.gridExport+=f.gridExport; a.gridImport+=f.gridImport; a.revenue+=f.revenue; a.currency=currency; return a; }, {produced:0,used:0,batteryCharge:0,batteryDischarge:0,gridExport:0,gridImport:0,revenue:0,currency}); }
function productionRecordValue(row: ProductionRecord, field: string): string | number | undefined{ return (row as Partial<Record<string, string | number | undefined>>)[field]; }
function byQuery<T extends ProductionRecord>(list: T[], fields: string[]): T[]{ const q=productionState.query.trim().toLowerCase(); if(!q)return list; return list.filter(item=>fields.some((f: string)=>String(productionRecordValue(item,f)||'').toLowerCase().includes(q))); }
function kpiContextHtml(flow: ProductionFlowFields, extras: Array<{label:string; value:string}> = []): string{ const items=[['Produced',formatEnergy(flow.produced)],['Used / Load',formatEnergy(flow.used)],['Battery Charge',formatEnergy(flow.batteryCharge)],['Battery Discharge',formatEnergy(flow.batteryDischarge)],['Grid Export',formatEnergy(flow.gridExport)],['Grid Import',formatEnergy(flow.gridImport)],['Revenue',formatRevenue(flow.revenue, flow.currency)],...extras.map(x=>[x.label,x.value])]; return `<section class="context-bar glass-card production-context-bar">${items.map(([l,v])=>`<button class="ctx-item" type="button"><span>${l}</span><strong>${v}</strong></button>`).join('')}</section>`; }
function productionToolbar(): string{ return `<div class="toolbar production-toolbar"><input id="productionSearch" placeholder="Search tenants, clients, plants, vendors..." value="${productionState.query}"><select id="productionPeriod"><option${productionState.period==='Today'?' selected':''}>Today</option><option${productionState.period==='Week'?' selected':''}>Week</option><option${productionState.period==='Month'?' selected':''}>Month</option></select><select id="productionHierarchy"><option value="tenantFirst"${productionState.hierarchy==='tenantFirst'?' selected':''}>Tenant → Client → Plant</option><option value="plantFirst"${productionState.hierarchy==='plantFirst'?' selected':''}>Plant → Client → Tenant</option></select><button class="secondary-btn" type="button" id="productionReset">Reset</button></div>`; }
function breadcrumbHtml(): string{ const tenant=getTenant(productionState.tenantId), client=getClient(productionState.clientId), plant=getPlant(productionState.plantId); const parts=[`<button type="button" data-prod-nav="${productionState.hierarchy==='tenantFirst'?'tenantList':'plantIndex'}">Production</button>`]; if(tenant)parts.push(`<span>›</span><button type="button" data-prod-open-tenant-detail="${tenant.id}">${tenant.name}</button>`); if(client)parts.push(`<span>›</span><button type="button" data-prod-open-client-detail="${client.id}">${client.name}</button>`); if(plant)parts.push(`<span>›</span><button type="button" data-prod-open-plant-detail="${plant.id}">${plant.name}</button>`); return `<div class="production-breadcrumb">${parts.join('')}</div>`; }
function rowActions(kind: ProductionKind,id: string): string{ return `<div class="row-actions kebabified production-actions-cell"><div class="kebab-wrap global-action-wrap"><button type="button" class="kebab-btn" data-action="menu" aria-label="Open actions" title="Actions">⋮</button><div class="kebab-menu global-action-menu"><button type="button" data-prod-open-${kind}-detail="${id}">Open Detail</button>${kind==='tenant'?`<button type="button" data-prod-list-clients="${id}">Open Clients</button><button type="button" data-prod-list-plants-tenant="${id}">Open Plants</button>`:''}${kind==='client'?`<button type="button" data-prod-list-plants-client="${id}">Open Plants</button><button type="button" data-prod-open-tenant-detail="${getClient(id)?.tenantId||''}">Open Tenant</button>`:''}${kind==='plant'?`<button type="button" data-prod-open-client-detail="${getPlant(id)?.clientId||''}">Open Client</button><button type="button" data-prod-open-tenant-detail="${getPlant(id)?.tenantId||''}">Open Tenant</button>`:''}</div></div></div>`; }
function flowCells(r: ProductionRecord): string{ const f=getFlow(r); return `<div><strong>${formatEnergy(f.produced)}</strong><small>Used ${formatEnergy(f.used)}</small></div><div><strong>${formatEnergy(f.gridExport)}</strong><small>Import ${formatEnergy(f.gridImport)}</small></div><div><strong>${formatEnergy(f.batteryCharge)}</strong><small>Discharge ${formatEnergy(f.batteryDischarge)}</small></div><div><strong>${formatRevenue(f.revenue,f.currency)}</strong><small>${r.freshness||'Fresh'}</small></div>`; }
function tenantTable(list: ProductionTenant[] = productionTenants): string{ const rows=byQuery(list,['name','type','status']); return `<div class="data-table production-tenant-table"><div class="data-head"><span>Tenant</span><span>Scope</span><span>Production Flow</span><span>Grid</span><span>Battery</span><span>Revenue</span><span>Actions</span></div>${rows.map(t=>`<div class="data-row clickable-row" data-prod-open-tenant-detail="${t.id}"><div><strong>${t.name}</strong><small>${t.id}<br>${t.type}</small></div><div><span class="badge ${productionStatusCls(t.status)}">${t.status}</span><small>${t.clients} clients · ${t.plants} plants · ${t.alerts} alerts</small></div>${flowCells(t)}${rowActions('tenant',t.id)}</div>`).join('')}</div>`; }
function clientTable(list: ProductionClient[]): string{ const rows=byQuery(list,['name','type','status','tariff']); return `<div class="data-table production-client-table"><div class="data-head"><span>Client</span><span>Type / Status</span><span>Production Flow</span><span>Grid</span><span>Battery</span><span>Revenue</span><span>Actions</span></div>${rows.map(c=>`<div class="data-row clickable-row" data-prod-open-client-detail="${c.id}"><div><strong>${c.name}</strong><small>${c.id}<br>${getTenant(c.tenantId)?.name||'-'}</small></div><div><span class="badge ${productionStatusCls(c.status)}">${c.status}</span><small>${c.type} · ${c.plants} plants</small></div>${flowCells(c)}${rowActions('client',c.id)}</div>`).join('')}</div>`; }
function plantTable(list: ProductionPlant[]): string{ const rows=byQuery(list,['name','code','vendor','status','tariff']); return `<div class="data-table production-plant-table"><div class="data-head"><span>Plant</span><span>Source</span><span>Production Flow</span><span>Grid</span><span>Battery</span><span>Status</span><span>Revenue</span><span>Actions</span></div>${rows.map(p=>`<div class="data-row clickable-row" data-prod-open-plant-detail="${p.id}"><div><strong>${p.name}</strong><small>${p.code}<br>${getClient(p.clientId)?.name||'-'}</small></div><div><strong>${p.vendor}</strong><small>${p.sourceScreen}</small></div><div><strong>${formatEnergy(p.produced)}</strong><small>Used ${formatEnergy(p.used)} · ${p.pvPower}</small></div><div><strong>${formatEnergy(p.gridExport)}</strong><small>Import ${formatEnergy(p.gridImport)}</small></div><div><strong>${formatEnergy(p.batteryCharge)}</strong><small>Discharge ${formatEnergy(p.batteryDischarge)}</small></div><div><span class="badge ${productionStatusCls(p.status)}">${p.status}</span><small>${p.dataQuality} · ${p.freshness}</small></div><div><strong>${formatRevenue(p.revenue,p.currency)}</strong><small>${p.tariff}</small></div>${rowActions('plant',p.id)}</div>`).join('')}</div>`; }
function makeSeries(obj: ProductionRecord, key: keyof ProductionFlowFields, count: number): number[]{ const base=+(obj[key]||0); return Array.from({length:count},(_,i)=>{ const wave=0.78 + (((i*7)%9)/30); return Math.max(0, +(base/count*wave).toFixed(2)); }); }
function chartMetricConfig(tab: ProductionChartTab){ if(tab==='weekly')return {count:7, labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], title:'Weekly Production Curve'}; if(tab==='monthly')return {count:12, labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], title:'Monthly Production Curve'}; return {count:12, labels:['06','08','10','12','14','16','18','20','22','00','02','04'], title:'Daily Production Curve'}; }
function pointsFor(series: number[],w: number,h: number,pad: number): string{ const max=Math.max(...series,1); return series.map((v,i)=>`${pad+(i*(w-pad*2)/(series.length-1||1))},${h-pad-(v/max)*(h-pad*2)}`).join(' '); }
function productionSvgChart(obj: ProductionRecord,tab: ProductionChartTab='day'): string{
  const cfg=chartMetricConfig(tab); const w=720,h=250,p=32;
  const produced=makeSeries(obj,'produced',cfg.count), used=makeSeries(obj,'used',cfg.count), exportS=makeSeries(obj,'gridExport',cfg.count), charge=makeSeries(obj,'batteryCharge',cfg.count);
  return `<div class="production-chart-card"><div class="production-chart-head"><div><h3>${cfg.title}</h3><p class="muted">Produced, used, grid export and battery charge shown as normalized trends.</p></div><span class="badge neutral">${productionState.period}</span></div><svg class="production-svg-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Production chart"><defs><linearGradient id="prodFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(34,211,238,.28)"/><stop offset="1" stop-color="rgba(34,211,238,0)"/></linearGradient></defs><g class="grid">${[0,1,2,3].map(i=>`<line x1="${p}" x2="${w-p}" y1="${p+i*(h-p*2)/3}" y2="${p+i*(h-p*2)/3}"/>`).join('')}</g><polyline class="area" points="${p},${h-p} ${pointsFor(produced,w,h,p)} ${w-p},${h-p}"/><polyline class="line produced" points="${pointsFor(produced,w,h,p)}"/><polyline class="line used" points="${pointsFor(used,w,h,p)}"/><polyline class="line export" points="${pointsFor(exportS,w,h,p)}"/><polyline class="line charge" points="${pointsFor(charge,w,h,p)}"/><g class="xlabels">${cfg.labels.map((l,i)=>`<text x="${p+(i*(w-p*2)/(cfg.labels.length-1||1))}" y="${h-8}">${l}</text>`).join('')}</g></svg><div class="production-chart-legend"><span class="produced">Produced</span><span class="used">Used / Load</span><span class="export">Grid Export</span><span class="charge">Battery Charge</span></div></div>`;
}
function productionComparisonCards(rows: ProductionRecord[], field: ProductionNumericFlowField = 'produced'): string{
  const numericValue = (row: ProductionRecord): number => Number(getFlow(row)[field] || 0);
  const max=Math.max(...rows.map((r: ProductionRecord)=>numericValue(r)),1);
  return `<div class="production-comparison-grid">${rows.map((r: ProductionRecord)=>`<button type="button" class="production-comparison-card" ${r.id?.startsWith('CLI')?`data-prod-open-client-detail="${r.id}"`:r.id?.startsWith('PLT')?`data-prod-open-plant-detail="${r.id}"`:''}><span>${r.name}</span><strong>${field==='revenue'?formatRevenue(getFlow(r).revenue,getFlow(r).currency):formatEnergy(numericValue(r))}</strong><div><b style="width:${Math.max(5,(numericValue(r)/max)*100)}%"></b></div></button>`).join('')}</div>`;
}
function flowBreakdownChart(row: ProductionRecord): string{ const f=getFlow(row); const items: Array<[string, number]>=[['Produced',f.produced],['Used / Load',f.used],['Battery Charge',f.batteryCharge],['Battery Discharge',f.batteryDischarge],['Grid Export',f.gridExport],['Grid Import',f.gridImport]]; const max=Math.max(...items.map(x=>x[1]),1); return `<div class="production-flow-breakdown">${items.map(([label,val])=>`<div class="production-flow-item"><span>${label}</span><div><b style="width:${Math.max(5,(val/max)*100)}%"></b></div><strong>${formatEnergy(val)}</strong></div>`).join('')}</div>`; }
function sideTabs(kind: ProductionKind): string{ const tabs: Record<ProductionKind, ProductionTab[]>={tenant:['overview','clients','plants','day','weekly','monthly','revenue','source','activity'],client:['overview','plants','day','weekly','monthly','revenue','source','activity'],plant:['overview','flow','day','weekly','monthly','revenue','source','activity']}; const labels: Record<ProductionTab, string>={overview:'Overview',clients:'Clients',plants:'Plants',flow:'Energy Flow',day:'Day Chart',weekly:'Week Chart',monthly:'Month Chart',revenue:'Revenue Rules',source:'Source Mapping',activity:'Activity'}; return `<aside class="glass-card plant-side-card-v17 production-side-v130"><h3>Production</h3>${tabs[kind].map((tab: ProductionTab)=>`<button type="button" class="${productionState.detailTab===tab?'active':''}" data-production-tab="${tab}">${labels[tab]}</button>`).join('')}</aside>`; }
function detailHeader(kind: ProductionKind,obj: ProductionRecord,subtitle: string): string{ return `<div class="section-title-v17"><div><h2>${obj.name}</h2><p class="muted">${subtitle}</p></div><span class="badge ${productionStatusCls(obj.status)}">${obj.status||'Active'}</span></div>`; }
function overviewGrid(obj: ProductionRecord, extras: Array<[string,string,string]> = []): string{ const f=getFlow(obj); const base=[['Produced',formatEnergy(f.produced),'Generated energy'],['Used / Load',formatEnergy(f.used),'Internal consumption'],['Battery Charge',formatEnergy(f.batteryCharge),'Energy into battery'],['Battery Discharge',formatEnergy(f.batteryDischarge),'Energy from battery'],['Grid Export',formatEnergy(f.gridExport),'Energy exported to grid'],['Grid Import',formatEnergy(f.gridImport),'Energy imported from grid'],['Revenue',formatRevenue(f.revenue,f.currency),obj.tariff||'Commercial result']]; return `<div class="info-grid production-detail-grid">${[...base,...extras].map(([a,b,c])=>`<div><span>${a}</span><strong>${b}</strong><small>${c||''}</small></div>`).join('')}</div>`; }
function sourceMappingTable(vendor: string='Multi-source'): string{ const rows: Array<[string,string,string,string]>=[['Energy Generation','generated_energy_kwh','Production Normalization','Mapped'],['Load / Used','load_consumption_kwh','Energy Flow Mapping','Mapped'],['Battery Charge','battery_charge_kwh','Storage Mapping','Mapped'],['Battery Discharge','battery_discharge_kwh','Storage Mapping','Mapped'],['Grid Export','grid_export_kwh','Grid Flow Mapping','Mapped'],['Grid Import','grid_import_kwh','Grid Flow Mapping','Mapped'],['Generation Revenue','generation_revenue','Revenue Mapping','Needs tariff']]; return `<div class="data-table compact-table production-mapping-preview-table"><div class="data-head"><span>Vendor Metric</span><span>Zentrid Field</span><span>Mapping Area</span><span>Status</span></div>${rows.map(r=>`<div class="data-row"><div><strong>${r[0]}</strong><small>${vendor}</small></div><div><strong>${r[1]}</strong></div><div><small>${r[2]}</small></div><div><span class="badge ${r[3].includes('Needs')?'warning':'success'}">${r[3]}</span></div></div>`).join('')}</div>`; }
function activityTable(entity: string | undefined): string{ return `<div class="data-table compact-table production-activity-table"><div class="data-head"><span>Time</span><span>Event</span><span>Source</span><span>Status</span></div><div class="data-row"><div><strong>Today · 10:42</strong></div><div><strong>Production snapshot refreshed</strong><small>${entity}</small></div><div><small>Vendor adapter</small></div><div><span class="badge success">Success</span></div></div><div class="data-row"><div><strong>Today · 09:15</strong></div><div><strong>Revenue recalculated</strong><small>Grid export and self-use rules applied</small></div><div><small>Commercial engine</small></div><div><span class="badge warning">Review</span></div></div></div>`; }
function detailBodyLegacy(kind: ProductionKind,obj: ProductionRecord): string{ const tab=productionState.detailTab; if(tab==='clients') return clientTable(productionClients.filter(c=>c.tenantId===obj.id)); if(tab==='plants') return plantTable(kind==='tenant'?productionPlants.filter(p=>p.tenantId===obj.id):productionPlants.filter(p=>p.clientId===obj.id)); if(tab==='flow') return `<div class="section-title-v17 mini"><div><h3>Energy Flow</h3><p class="muted">Bidirectional view for battery and grid flows.</p></div></div>${flowBreakdownChart(obj)}`; if(tab==='day'||tab==='weekly'||tab==='monthly'){ const rows: ProductionRecord[]=kind==='tenant'?productionClients.filter(c=>c.tenantId===obj.id):kind==='client'?productionPlants.filter(p=>p.clientId===obj.id):[obj]; return `<div class="section-title-v17 mini"><div><h3>${tab==='day'?'Day':tab==='weekly'?'Week':'Month'} Indicators</h3><p class="muted">Generated, used, battery, grid and revenue indicators for this ${kind}.</p></div></div>${productionSvgChart(obj,tab)}${productionComparisonCards(rows)}`; } if(tab==='revenue') return `<div class="info-grid production-detail-grid"><div><span>Revenue</span><strong>${formatRevenue(obj.revenue,obj.currency)}</strong><small>${obj.tariff||'Tenant-level commercial rules'}</small></div><div><span>Export Basis</span><strong>Grid Export</strong><small>${formatEnergy(obj.gridExport)} used for export settlement</small></div><div><span>Self-use Basis</span><strong>Used / Load</strong><small>${formatEnergy(obj.used)} retained by client</small></div><div><span>Battery Treatment</span><strong>Charge / Discharge separated</strong><small>No one-way “sent to battery” label</small></div></div>`; if(tab==='source') return sourceMappingTable(obj.vendor||'Multi-vendor'); if(tab==='activity') return activityTable(obj.name); return overviewGrid(obj); }
function detailWorkspace(kind: ProductionKind,obj: ProductionRecord,subtitle: string): string{ return `${kpiContextHtml(getFlow(obj),[{label:kind.charAt(0).toUpperCase()+kind.slice(1),value:obj.id || ''}])}<section class="plant-workspace-v17 production-detail-workspace">${sideTabs(kind)}<section class="glass-card plant-main-card-v17 production-detail-main">${detailHeader(kind,obj,subtitle)}<div id="productionDetailTabContent">${detailBody(kind,obj)}</div><div class="drawer-actions production-detail-actions"><button class="secondary-btn" type="button" data-prod-nav="${productionState.hierarchy==='tenantFirst'?'tenantList':'plantIndex'}">Back to ${productionState.hierarchy==='tenantFirst'?'Tenants':'Plants'}</button><button class="primary-action" type="button" onclick="window.location.href='production-normalization.html'">Open Normalization</button></div></section></section>`; }
function renderTenantList(): string{ const summary=sumRows(productionTenants,'USD'); return `${kpiContextHtml(summary,[{label:'Tenants',value:String(productionTenants.length)},{label:'Mode',value:'Tenant → Client → Plant'}])}<section class="panel glass-card"><div class="panel-head"><div><p class="eyebrow">Production · Tenant List</p><h2>Production Registry by Tenant</h2><p>Open a tenant detail, then inspect its clients and plant-level production.</p></div></div>${productionToolbar()}${tenantTable()}</section>`; }
function renderPlantIndex(): string{ const summary=sumRows(productionPlants,'USD'); return `${kpiContextHtml(summary,[{label:'Plants',value:String(productionPlants.length)},{label:'Mode',value:'Plant → Client → Tenant'}])}<section class="panel glass-card"><div class="panel-head"><div><p class="eyebrow">Production · Plant List</p><h2>Production Registry by Plant</h2><p>Alternative hierarchy. Start from plant and drill up to client or tenant details.</p></div></div>${productionToolbar()}${plantTable(productionPlants)}</section>`; }
function renderClientList(tenantId: string | null): string{ const tenant=getTenant(tenantId); const rows=productionClients.filter(c=>c.tenantId===tenantId); return `${kpiContextHtml(sumRows(rows,tenant?.currency||'USD'),[{label:'Tenant',value:tenant?.name||'-'},{label:'Clients',value:String(rows.length)}])}<section class="panel glass-card"><div class="panel-head"><div><p class="eyebrow">Production · Tenant Clients</p><h2>${tenant?.name||'Tenant'} Clients</h2><p>Choose a client to view its full production detail and plant list.</p></div></div>${productionToolbar()}${clientTable(rows)}</section>`; }
function renderPlantList(clientId: string | null): string{ const client=getClient(clientId); const rows=productionPlants.filter(p=>p.clientId===clientId); return `${kpiContextHtml(sumRows(rows,client?.currency||'USD'),[{label:'Client',value:client?.name||'-'},{label:'Plants',value:String(rows.length)}])}<section class="panel glass-card"><div class="panel-head"><div><p class="eyebrow">Production · Client Plants</p><h2>${client?.name||'Client'} Plant Production</h2><p>Each plant opens its own detail workspace with chart tabs, revenue and source mapping.</p></div></div>${productionToolbar()}${plantTable(rows)}</section>`; }
function renderProductionContent(): string{ if(productionState.level==='plantIndex') return renderPlantIndex(); if(productionState.level==='tenantDetail'){ const t=getTenant(productionState.tenantId); return t?detailWorkspace('tenant',t,'Tenant-level production, clients, plants and revenue aggregation.'):renderTenantList(); } if(productionState.level==='clientList') return renderClientList(productionState.tenantId); if(productionState.level==='clientDetail'){ const c=getClient(productionState.clientId); return c?detailWorkspace('client',c,`${getTenant(c.tenantId)?.name||'-'} · client production summary and plant list.`):renderTenantList(); } if(productionState.level==='plantList') return renderPlantList(productionState.clientId); if(productionState.level==='plantDetail'){ const p=getPlant(productionState.plantId); return p?detailWorkspace('plant',p,`${getTenant(p.tenantId)?.name||'-'} → ${getClient(p.clientId)?.name||'-'} · ${p.vendor} · ${p.code}`):renderPlantIndex(); } return renderTenantList(); }
function renderProduction(): string{ return `<div class="production-page"><section class="page-hero"><div><p class="eyebrow">Global Admin · Production</p><h1>Production Center</h1><p class="muted">Switch hierarchy, drill into tenant/client/plant detail pages, and review bidirectional battery/grid flows.</p></div><button class="create-action" type="button" id="openProductionMapping"><span class="pulse"></span><div><strong>Open Mapping</strong><small>Production Normalization</small></div></button></section>${breadcrumbHtml()}<div id="productionContent">${renderProductionContent()}</div></div>`; }
function refreshProduction(): void{ const host=document.getElementById('productionContent'); const bc=document.querySelector('.production-breadcrumb'); if(bc)bc.outerHTML=breadcrumbHtml(); if(host)host.innerHTML=renderProductionContent(); ZentridLayout.enhanceActionMenus?.(document); }
function gotoTenantDetail(id: string): void{ productionState.level='tenantDetail'; productionState.tenantId=id; productionState.clientId=null; productionState.plantId=null; productionState.detailTab='overview'; productionState.query=''; refreshProduction(); }
function gotoClientDetail(id: string): void{ const c=getClient(id); productionState.level='clientDetail'; productionState.clientId=id; productionState.tenantId=c?.tenantId||productionState.tenantId; productionState.plantId=null; productionState.detailTab='overview'; productionState.query=''; refreshProduction(); }
function gotoPlantDetail(id: string): void{ const p=getPlant(id); productionState.level='plantDetail'; productionState.plantId=id; productionState.clientId=p?.clientId||productionState.clientId; productionState.tenantId=p?.tenantId||productionState.tenantId; productionState.detailTab='overview'; productionState.query=''; refreshProduction(); }
function productionEventTarget(event: Event): HTMLElement | null {
  return event.target instanceof HTMLElement ? event.target : null;
}
function handleProductionAction(e: Event): boolean{
  const el=productionEventTarget(e)?.closest<HTMLElement>('[data-production-tab],#openProductionMapping,[data-prod-open-tenant-detail],[data-prod-open-client-detail],[data-prod-open-plant-detail],[data-prod-list-clients],[data-prod-list-plants-tenant],[data-prod-list-plants-client],[data-prod-nav],#productionReset');
  if(!el)return false;
  if(el.id==='openProductionMapping'){ window.location.href='production-normalization.html'; return true; }
  if(el.dataset.productionTab){ productionState.detailTab=el.dataset.productionTab as ProductionTab; refreshProduction(); return true; }
  if(el.dataset.prodOpenTenantDetail){ gotoTenantDetail(el.dataset.prodOpenTenantDetail); return true; }
  if(el.dataset.prodOpenClientDetail){ gotoClientDetail(el.dataset.prodOpenClientDetail); return true; }
  if(el.dataset.prodOpenPlantDetail){ gotoPlantDetail(el.dataset.prodOpenPlantDetail); return true; }
  if(el.dataset.prodListClients){ productionState.level='clientList'; productionState.tenantId=el.dataset.prodListClients; productionState.clientId=null; productionState.plantId=null; productionState.detailTab='overview'; productionState.query=''; refreshProduction(); return true; }
  if(el.dataset.prodListPlantsTenant){ productionState.level='plantIndex'; productionState.hierarchy='plantFirst'; productionState.tenantId=el.dataset.prodListPlantsTenant; productionState.clientId=null; productionState.plantId=null; productionState.detailTab='overview'; productionState.query=''; refreshProduction(); return true; }
  if(el.dataset.prodListPlantsClient){ productionState.level='plantList'; productionState.clientId=el.dataset.prodListPlantsClient; const c=getClient(productionState.clientId); productionState.tenantId=c?.tenantId||productionState.tenantId; productionState.plantId=null; productionState.detailTab='overview'; productionState.query=''; refreshProduction(); return true; }
  if(el.dataset.prodNav){ const target=el.dataset.prodNav as ProductionLevel; productionState.level=target; if(target==='tenantList'){productionState.hierarchy='tenantFirst'; productionState.tenantId=null; productionState.clientId=null; productionState.plantId=null;} if(target==='plantIndex'){productionState.hierarchy='plantFirst'; productionState.clientId=null; productionState.plantId=null;} productionState.query=''; productionState.detailTab='overview'; refreshProduction(); return true; }
  if(el.id==='productionReset'){ productionState.query=''; productionState.period='Today'; refreshProduction(); return true; }
  return false;
}
function wireProduction(): void{
  const app=document.getElementById('app');
  app?.addEventListener('click',e=>{ if(handleProductionAction(e)) return; });
  document.addEventListener('click',e=>{ if(productionEventTarget(e)?.closest('.global-action-menu')) handleProductionAction(e); });
  app?.addEventListener('input',e=>{ const target=productionEventTarget(e); if(target instanceof HTMLInputElement && target.id==='productionSearch'){ productionState.query=target.value; refreshProduction(); }});
  app?.addEventListener('change',e=>{ const target=productionEventTarget(e); if(!(target instanceof HTMLSelectElement)) return; if(target.id==='productionPeriod'){ productionState.period=target.value; refreshProduction(); } if(target.id==='productionHierarchy'){ productionState.hierarchy=target.value as ProductionHierarchy; productionState.level=target.value==='tenantFirst'?'tenantList':'plantIndex'; productionState.tenantId=null; productionState.clientId=null; productionState.plantId=null; productionState.detailTab='overview'; productionState.query=''; refreshProduction(); }});
  ZentridLayout.enhanceActionMenus?.(document);
}

/* Production detail chart patch — keep current hierarchy/flow, reuse old v130 chart/table structure. */
function productionLegacySeries(obj: ProductionRecord, tab: ProductionTab): ProductionChartRow[]{
  const f = getFlow(obj || {});
  const scale = Math.max(f.produced || 1, 1);
  if(tab === 'weekly'){
    const labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const factors = [0.78,0.91,1.06,0.88,1.12,1.00,0.72];
    return labels.map((label,i)=>{
      const factor = factors[i] ?? 0;
      return {
        label,
        production:+((f.produced/7)*factor).toFixed(2),
        home:+((f.used/7)*factor).toFixed(2),
        battery:+((f.batteryCharge/7)*factor).toFixed(2),
        grid:+((f.gridExport/7)*factor).toFixed(2)
      };
    });
  }
  if(tab === 'monthly'){
    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const factors = [0.56,0.62,0.76,0.88,1.02,1.14,1.2,1.16,0.98,0.82,0.64,0.52];
    return labels.map((label,i)=>{
      const factor = factors[i] ?? 0;
      return {
        label,
        production:+((f.produced/12)*factor).toFixed(2),
        home:+((f.used/12)*factor).toFixed(2),
        battery:+((f.batteryCharge/12)*factor).toFixed(2),
        grid:+((f.gridExport/12)*factor).toFixed(2)
      };
    });
  }
  const hours = Array.from({length:24},(_,i)=>String(i).padStart(2,'0')+':00');
  const curve = [0,0,0,0,0,0,0.02,0.08,0.18,0.32,0.46,0.54,0.45,0.36,0.55,0.48,0.34,0.22,0.12,0.05,0,0,0,0];
  const totalCurve = curve.reduce((a,b)=>a+b,0) || 1;
  return hours.map((time,i)=>{
    const curveValue = curve[i] ?? 0;
    return {
      time,
      production:+(f.produced*(curveValue/totalCurve)).toFixed(2),
      home:+(f.used*(curveValue/totalCurve)).toFixed(2),
      battery:+((f.batteryCharge/24) * (curveValue ? 1.1 : .65)).toFixed(2),
      grid:+(f.gridExport*(curveValue/totalCurve)).toFixed(2)
    };
  });
}
function productionChartValue(row: ProductionChartRow, key: keyof ProductionChartRow): number {
  const value = row[key];
  return typeof value === 'number' ? value : Number(value || 0);
}
function productionLegacyBars(data: ProductionChartRow[], keys: Array<[keyof ProductionChartRow, string]>, max: number): string{
  const safeMax = Math.max(max || 1, ...data.flatMap(row => keys.map(([key]) => productionChartValue(row, key))), 1);
  return `<div class="production-chart-v130">${data.map(row=>`<div class="production-chart-col-v130"><div class="production-chart-stack-v130">${keys.map(([key,label])=>{ const value=productionChartValue(row,key); return `<em title="${label}: ${value.toLocaleString(undefined,{maximumFractionDigits:2})} MWh" style="height:${Math.max(2,(value/safeMax)*100)}%"></em>`; }).join('')}</div><span>${row.time||row.label}</span></div>`).join('')}</div>`;
}
function productionLegacyTable(heads: string[], rows: string[], cls: string='production-table-v130'): string{
  return `<div class="data-table ${cls}"><div class="data-head">${heads.map(h=>`<span>${h}</span>`).join('')}</div>${rows.join('')}</div>`;
}
function productionLegacyChartSection(obj: ProductionRecord, tab: ProductionTab): string{
  const titleMap = { day:'Daily Production', weekly:'Weekly Production', monthly:'Monthly Production' };
  const descMap = {
    day:'Hourly breakdown for production, local use, battery charge and grid export.',
    weekly:'Week view using the same production allocation logic.',
    monthly:'Month view using the same production allocation logic.'
  };
  const data = productionLegacySeries(obj, tab);
  const max = Math.max(...data.map(r=>r.production),1);
  const keys: Array<[keyof ProductionChartRow, string]> = tab === 'day'
    ? [['production','Produced'],['home','Used'],['battery','Battery Charge'],['grid','Grid Export']]
    : [['production','Produced'],['home','Used'],['battery','Battery Charge'],['grid','Grid Export']];
  const chart = `<section class="glass-card production-flow-card-v130">${productionLegacyBars(data, keys, max)}</section>`;
  if(tab === 'day'){
    const rows = data.map(r=>`<div class="data-row"><div><strong>${r.time}</strong><small>5-minute samples grouped hourly</small></div><div><strong>${r.production.toLocaleString(undefined,{maximumFractionDigits:2})} MWh</strong></div><div><strong>${r.home.toLocaleString(undefined,{maximumFractionDigits:2})} MWh</strong></div><div><strong>${r.battery.toLocaleString(undefined,{maximumFractionDigits:2})} MWh</strong></div><div><strong>${r.grid.toLocaleString(undefined,{maximumFractionDigits:2})} MWh</strong></div><div><span class="badge info">${r.production>0?'Daylight':'Night'}</span></div></div>`);
    return `<div class="section-title-v17 production-title-v130"><div><h2>${titleMap[tab]}</h2><p class="muted">${descMap[tab]}</p></div></div>${chart}${productionLegacyTable(['Time','Produced','Used by Plant','Battery Charge','Grid Export','State'], rows, 'production-table-v130 production-day-table-v130')}`;
  }
  const rateExport = obj.currency === 'EUR' ? 48 : 44;
  const rateSelf = obj.currency === 'EUR' ? 56 : 52;
  const chartTab = tab === 'monthly' ? 'monthly' : 'weekly';
  const rows = data.map(r=>`<div class="data-row"><div><strong>${r.label}</strong><small>${chartTab==='weekly'?'Mock week':'Mock month'} from current production profile</small></div><div><strong>${r.production.toLocaleString(undefined,{maximumFractionDigits:2})} MWh</strong></div><div><strong>${r.home.toLocaleString(undefined,{maximumFractionDigits:2})} MWh</strong></div><div><strong>${r.battery.toLocaleString(undefined,{maximumFractionDigits:2})} MWh</strong></div><div><strong>${r.grid.toLocaleString(undefined,{maximumFractionDigits:2})} MWh</strong></div><div><span class="badge success">${formatRevenue((r.grid*rateExport)+(r.home*rateSelf), obj.currency)}</span></div></div>`);
  return `<div class="section-title-v17 production-title-v130"><div><h2>${titleMap[chartTab]}</h2><p class="muted">${descMap[chartTab]}</p></div></div>${chart}${productionLegacyTable([chartTab==='weekly'?'Day':'Month','Produced','Used by Plant','Battery Charge','Grid Export','Estimated Value'], rows)}`;
}
function productionLegacyRevenue(obj: ProductionRecord): string{
  const f = getFlow(obj);
  const exportRate = obj.currency === 'EUR' ? 48 : 44;
  const selfRate = obj.currency === 'EUR' ? 56 : 52;
  const exportValue = f.gridExport * exportRate;
  const selfValue = f.used * selfRate;
  const symbol = obj.currency === 'EUR' ? '€' : '$';
  return `<div class="section-title-v17 production-title-v130"><div><h2>Revenue Calculation</h2><p class="muted">Shows how production is converted into estimated earning after allocation.</p></div></div><section class="module-grid production-kpis-v130 compact"><article class="module-card"><span>Export Value</span><strong>${symbol}${Math.round(exportValue).toLocaleString()}</strong><small>Grid export monetized by tariff.</small></article><article class="module-card"><span>Self-use Value</span><strong>${symbol}${Math.round(selfValue).toLocaleString()}</strong><small>Saved by using own energy.</small></article><article class="module-card"><span>Total Estimated</span><strong>${formatRevenue(f.revenue || (exportValue+selfValue), f.currency)}</strong><small>Revenue-ready summary.</small></article></section><div class="data-table production-table-v130 production-revenue-table-v130"><div class="data-head"><span>Rule</span><span>Rate</span><span>Calculation</span><span>Value</span><span>Actions</span></div><div class="data-row"><div><strong>Grid Export Tariff</strong><small>Applied to exported energy</small></div><div><strong>${exportRate} ${f.currency}/MWh</strong></div><div><small>${formatEnergy(f.gridExport)} x ${exportRate}</small></div><div><span class="badge success">${symbol}${Math.round(exportValue).toLocaleString()}</span></div><div class="row-actions single-action"><button class="small-btn single-row-action" onclick="ZentridLayout.toast('Edit export tariff mock')">Edit</button></div></div><div class="data-row"><div><strong>Self-use Value</strong><small>Energy used on-plant instead of buying from grid</small></div><div><strong>${selfRate} ${f.currency}/MWh</strong></div><div><small>${formatEnergy(f.used)} x ${selfRate}</small></div><div><span class="badge success">${symbol}${Math.round(selfValue).toLocaleString()}</span></div><div class="row-actions single-action"><button class="small-btn single-row-action" onclick="ZentridLayout.toast('Edit self-use tariff mock')">Edit</button></div></div><div class="data-row"><div><strong>Battery Storage</strong><small>Storage value is tracked but not monetized in this mock</small></div><div><strong>Pending rule</strong></div><div><small>${formatEnergy(f.batteryCharge)} charged · ${formatEnergy(f.batteryDischarge)} discharged</small></div><div><span class="badge warning">Not priced</span></div><div class="row-actions single-action"><button class="small-btn single-row-action" onclick="ZentridLayout.toast('Add battery value rule mock')">Open</button></div></div></div>`;
}
function detailBody(kind: ProductionKind,obj: ProductionRecord): string{
  const tab=productionState.detailTab;
  if(tab==='clients') return clientTable(productionClients.filter(c=>c.tenantId===obj.id));
  if(tab==='plants') return plantTable(kind==='tenant'?productionPlants.filter(p=>p.tenantId===obj.id):productionPlants.filter(p=>p.clientId===obj.id));
  if(tab==='flow') return `<div class="section-title-v17 mini"><div><h3>Energy Flow</h3><p class="muted">Bidirectional view for battery and grid flows.</p></div></div>${flowBreakdownChart(obj)}`;
  if(tab==='day'||tab==='weekly'||tab==='monthly') return productionLegacyChartSection(obj,tab);
  if(tab==='revenue') return productionLegacyRevenue(obj);
  if(tab==='source') return sourceMappingTable(obj.vendor||'Multi-vendor');
  if(tab==='activity') return activityTable(obj.name);
  return overviewGrid(obj);
}
