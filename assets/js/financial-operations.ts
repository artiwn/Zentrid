window.FinancialOperations = (() => {
  const state: ZentridLegacyCompat = {
    draft: {
      name: 'Enterprise Solar Operator Plan',
      code: 'enterprise_solar_operator_plan',
      status: 'Draft',
      customerType: 'Operator',
      billingType: 'Postpaid',
      currency: 'EUR',
      baseFee: 500,
      includedUsers: 5,
      userOveragePrice: 18,
      includedPlants: 3,
      plantOveragePrice: 150,
      includedMw: 10,
      mwOveragePrice: 22,
      includedApi: 50000,
      apiOveragePrice: 0.001,
      includedCommands: 1000,
      commandOveragePrice: 0.05,
      includedStorageMonths: 12,
      storageOveragePriceTb: 25,
      slaLevel: 'Business 12x6',
      slaMarkupPct: 15,
      operatorDiscountPct: 20,
      customDiscountPct: 0,
      taxPct: 20,
      usage: { users: 8, plants: 5, mw: 24, apiCalls: 70000, commands: 1200, extraStorageTb: 1 },
      devices: [
        { id: 'dev_inv', type: 'Inverter', vendor: 'Deye', pricingModel: 'Graduated', unit: 'device / month', qty: 55, tiers: [{ from: 1, to: 50, price: 12 }, { from: 51, to: 200, price: 10 }, { from: 201, to: '', price: 8 }] },
        { id: 'dev_logger', type: 'Gateway / Data Logger', vendor: 'GoodWe', pricingModel: 'Flat', unit: 'device / month', qty: 5, tiers: [{ from: 1, to: '', price: 6 }] },
        { id: 'dev_meter', type: 'Smart Meter', vendor: 'Huawei', pricingModel: 'Volume', unit: 'device / month', qty: 8, tiers: [{ from: 1, to: 10, price: 9 }, { from: 11, to: 50, price: 7 }] }
      ],
      modules: [
        { code: 'ai_forecasting', name: 'AI Forecasting', enabled: true, price: 200, basis: 'Fixed' },
        { code: 'predictive_maintenance', name: 'Predictive Maintenance', enabled: false, price: 320, basis: 'Fixed' },
        { code: 'bess_smart_control', name: 'BESS Smart Control', enabled: false, price: 12, basis: 'Per MW' },
        { code: 'esg_reporting', name: 'ESG Reporting', enabled: true, price: 120, basis: 'Fixed' },
        { code: 'api_enterprise', name: 'API Enterprise', enabled: false, price: 150, basis: 'Fixed' }
      ]
    },
    selectedInvoice: 'INV-2026-0618',
    assignCode: '',
    assignOpen: false
  };

  const deviceTypes = ['Inverter','Smart Meter','Tracker / SSU','Weather Station','BESS Controller','Battery System','EV Charger','Gateway / Data Logger','SCADA Endpoint','Protection Relay','Transformer'];
  const vendors = ['Deye','GoodWe','Huawei','SolaX','Solis','iSolarCloud','Peimar','Generic / Mixed'];
  const pricingModels = ['Flat','Graduated','Volume','Tiered','Capacity-Based','Revenue-Based'];
  const currencies: ZentridLegacyCompat = { EUR: '€', USD: '$', AMD: '֏' };

  const tariffStorageKey = 'zentrid_tariff_plans';
  const assignmentStorageKey = 'zentrid_tenant_tariff_assignments';
  const usageSyncMap: ZentridLegacyCompat = {
    includedUsers: 'users',
    includedPlants: 'plants',
    includedMw: 'mw',
    includedApi: 'apiCalls',
    includedCommands: 'commands'
  };

  function clone(v: ZentridLegacyCompat){ return JSON.parse(JSON.stringify(v)); }
  function safeParse(key: ZentridLegacyCompat, fallback: ZentridLegacyCompat){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch(e){ return fallback; } }
  function savedPlans(){ return safeParse(tariffStorageKey, []); }
  function savePlans(rows: ZentridLegacyCompat){ localStorage.setItem(tariffStorageKey, JSON.stringify(rows)); }
  function assignments(){ return safeParse(assignmentStorageKey, []); }
  function saveAssignments(rows: ZentridLegacyCompat){ localStorage.setItem(assignmentStorageKey, JSON.stringify(rows)); }
  function tenants(){ try { const rows = JSON.parse(localStorage.getItem('zentrid_demo_tenants') || '[]'); if(rows.length) return rows; } catch(e){} if(window.ZentridDemo?.tenants) return window.ZentridDemo.tenants(); return [{id:'TNT-1001',name:'Sunridge Energy Group',code:'TN-SUNRIDGE'},{id:'TNT-1002',name:'Northpeak Operations',code:'TN-NORTHOPS'},{id:'TNT-1003',name:'Gamma Grid Services',code:'TN-GAMMA'},{id:'TNT-1004',name:'HelioWest Enterprise',code:'TN-HELIO'}]; }
  function currentPlanSnapshot(){ return { ...clone(state.draft), id: state.draft.id || 'TRF-' + Date.now(), updatedAt: new Date().toISOString(), calculationPreview: calc() }; }

  function esc(v: ZentridLegacyCompat){ return String(v ?? '').replace(/[&<>"']/g, (c: ZentridLegacyCompat) => (({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' } as ZentridLegacyCompat)[c])); }
  function n(v: ZentridLegacyCompat){ const x = Number(v); return Number.isFinite(x) ? x : 0; }
  function money(v: ZentridLegacyCompat, currency: ZentridLegacyCompat = state.draft.currency){ const s = currencies[currency] || currency; const x = n(v); return currency === 'AMD' ? `${s}${Math.round(x).toLocaleString('en-US')}` : `${s}${x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
  function badgeClass(v: ZentridLegacyCompat){ const s=String(v).toLowerCase(); if(/paid|active|ready|approved|matched|completed/.test(s)) return 'success'; if(/draft|pending|review|processing|sent/.test(s)) return 'warning'; if(/overdue|failed|blocked|exception|disputed/.test(s)) return 'danger'; return 'info'; }
  function setByPath(path: ZentridLegacyCompat, value: ZentridLegacyCompat){
    const parts = path.split('.');
    let o = state.draft;
    while(parts.length > 1) o = o[parts.shift()];
    const key = parts[0];
    const oldValue = o[key];
    o[key] = typeof o[key] === 'number' ? n(value) : value;
    if(path === 'name') state.draft.code = String(value||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') || 'new_tariff_plan';
    if(usageSyncMap[path] && (n(state.draft.usage[usageSyncMap[path]]) <= n(oldValue) || n(state.draft.usage[usageSyncMap[path]]) === 0)) {
      state.draft.usage[usageSyncMap[path]] = n(value);
    }
    refresh('tariffs');
  }
  function input(label: ZentridLegacyCompat, path: ZentridLegacyCompat, type: ZentridLegacyCompat = 'number', step: ZentridLegacyCompat = '1'){
    const val = path.split('.').reduce((o: ZentridLegacyCompat, p: ZentridLegacyCompat) =>o?.[p], state.draft);
    const linkedClass = path === 'usage.extraStorageTb' ? ' fo-linked-field' : '';
    const helper = path === 'usage.extraStorageTb' ? '<small aria-hidden="true">&nbsp;</small>' : '';
    return `<label class="fo-field${linkedClass}"><span>${esc(label)}</span><input data-fo-path="${esc(path)}" type="${type}" value="${esc(val)}" ${type==='number'?'min="0"':''} step="${step}" oninput="FinancialOperations.setField('${path}', this.value)">${helper}</label>`;
  }
  function linkedUsageInput(label: ZentridLegacyCompat, path: ZentridLegacyCompat, limitPath: ZentridLegacyCompat, priceLabel: ZentridLegacyCompat, pricePath: ZentridLegacyCompat){
    const val = path.split('.').reduce((o: ZentridLegacyCompat, p: ZentridLegacyCompat) =>o?.[p], state.draft);
    const limit = limitPath.split('.').reduce((o: ZentridLegacyCompat, p: ZentridLegacyCompat) =>o?.[p], state.draft);
    const price = pricePath.split('.').reduce((o: ZentridLegacyCompat, p: ZentridLegacyCompat) =>o?.[p], state.draft);
    return `<label class="fo-field fo-linked-field"><span>${esc(label)}</span><input data-fo-path="${esc(path)}" type="number" value="${esc(val)}" min="0" step="1" oninput="FinancialOperations.setField('${path}', this.value)"><small>Included: ${esc(limit)} · ${esc(priceLabel)}: ${esc(price)}</small></label>`;
  }
  function select(label: ZentridLegacyCompat, path: ZentridLegacyCompat, opts: ZentridLegacyCompat){ const val = path.split('.').reduce((o: ZentridLegacyCompat, p: ZentridLegacyCompat) =>o?.[p], state.draft); return `<label class="fo-field"><span>${esc(label)}</span><select data-fo-path="${esc(path)}" onchange="FinancialOperations.setField('${path}', this.value)">${opts.map((o: ZentridLegacyCompat) =>`<option ${o===val?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`; }
  function table(headers: ZentridLegacyCompat, rows: ZentridLegacyCompat, cls: ZentridLegacyCompat = ''){ const cols = headers.length; return `<div class="data-table fo-data-table ${cls}" style="--fo-cols:${cols}"><div class="data-head">${headers.map((h: ZentridLegacyCompat) =>`<span>${esc(h)}</span>`).join('')}</div>${rows.join('')}</div>`; }

  function tierCharge(qty: ZentridLegacyCompat, tiers: ZentridLegacyCompat, model: ZentridLegacyCompat){
    qty = n(qty); if(qty <= 0 || !tiers.length) return 0;
    const clean = tiers.map((t: ZentridLegacyCompat) =>({from:n(t.from||1), to:t.to===''||t.to==null?Infinity:n(t.to), price:n(t.price)})).sort((a: ZentridLegacyCompat, b: ZentridLegacyCompat) =>a.from-b.from);
    if(model === 'Flat') return qty * (clean[0]?.price || 0);
    if(model === 'Volume' || model === 'Tiered') { const tier = clean.find((t: ZentridLegacyCompat) =>qty>=t.from && qty<=t.to) || clean[clean.length-1]; return qty * (tier?.price || 0); }
    if(model === 'Capacity-Based') return qty * (clean[0]?.price || 0);
    if(model === 'Revenue-Based') return qty * (clean[0]?.price || 0);
    return clean.reduce((sum: ZentridLegacyCompat, t: ZentridLegacyCompat) =>{ const upper = Math.min(qty,t.to); if(upper < t.from) return sum; return sum + ((upper - t.from + 1) * t.price); },0);
  }

  function calc(){
    const d=state.draft,u=d.usage;
    const users = Math.max(0,n(u.users)-n(d.includedUsers))*n(d.userOveragePrice);
    const plants = Math.max(0,n(u.plants)-n(d.includedPlants))*n(d.plantOveragePrice);
    const capacity = Math.max(0,n(u.mw)-n(d.includedMw))*n(d.mwOveragePrice);
    const api = Math.max(0,n(u.apiCalls)-n(d.includedApi))*n(d.apiOveragePrice);
    const commands = Math.max(0,n(u.commands)-n(d.includedCommands))*n(d.commandOveragePrice);
    const storage = n(u.extraStorageTb)*n(d.storageOveragePriceTb);
    const deviceLines = d.devices.map((dev: ZentridLegacyCompat) => ({ ...dev, amount: tierCharge(dev.qty, dev.tiers, dev.pricingModel) }));
    const devices = deviceLines.reduce((s: ZentridLegacyCompat, x: ZentridLegacyCompat) =>s+x.amount,0);
    const modules = d.modules.filter((m: ZentridLegacyCompat) =>m.enabled).reduce((s: ZentridLegacyCompat, m: ZentridLegacyCompat) =>s + (m.basis === 'Per MW' ? n(u.mw)*n(m.price) : n(m.price)),0);
    const subtotal = n(d.baseFee)+users+plants+capacity+devices+api+commands+storage+modules;
    const markup = subtotal*n(d.slaMarkupPct)/100;
    const operatorDiscount = (subtotal+markup)*n(d.operatorDiscountPct)/100;
    const customDiscount = (subtotal+markup-operatorDiscount)*n(d.customDiscountPct)/100;
    const taxable = subtotal+markup-operatorDiscount-customDiscount;
    const tax = taxable*n(d.taxPct)/100;
    const total = taxable+tax;
    return { users, plants, capacity, api, commands, storage, deviceLines, devices, modules, subtotal, markup, operatorDiscount, customDiscount, taxable, tax, total };
  }

  function devicePricingEditor(){
    const d=state.draft;
    return `<section class="panel fo-builder-panel fo-wide-panel">
      <div class="panel-head"><div><h2>3. Device Pricing Matrix</h2><p>Add every billable device type separately. Each device can have its own vendor, quantity and pricing tiers.</p></div><button class="secondary-action" type="button" onclick="FinancialOperations.addDevice()">+ Add Device Type</button></div>
      <div class="fo-device-list">
        ${d.devices.map((dev: ZentridLegacyCompat, di: ZentridLegacyCompat) =>`
          <article class="fo-device-card">
            <div class="fo-device-head">
              <div><strong>${esc(dev.type)}</strong><small>${esc(dev.vendor)} · ${esc(dev.pricingModel)} · simulated qty ${esc(dev.qty)}</small></div>
              <button class="danger-action" type="button" onclick="FinancialOperations.removeDevice(${di})">Remove</button>
            </div>
            <div class="fo-form-grid compact">
              <label class="fo-field"><span>Device type</span><select onchange="FinancialOperations.updateDevice(${di}, 'type', this.value)">${deviceTypes.map((x: ZentridLegacyCompat) =>`<option ${x===dev.type?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
              <label class="fo-field"><span>Vendor</span><select onchange="FinancialOperations.updateDevice(${di}, 'vendor', this.value)">${vendors.map((x: ZentridLegacyCompat) =>`<option ${x===dev.vendor?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
              <label class="fo-field"><span>Pricing model</span><select onchange="FinancialOperations.updateDevice(${di}, 'pricingModel', this.value)">${pricingModels.map((x: ZentridLegacyCompat) =>`<option ${x===dev.pricingModel?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
              <label class="fo-field"><span>Simulated quantity</span><input type="number" min="0" value="${esc(dev.qty)}" oninput="FinancialOperations.updateDevice(${di}, 'qty', this.value)"></label>
            </div>
            ${table(['From qty','To qty','Unit price','Actions'], dev.tiers.map((t: ZentridLegacyCompat, ti: ZentridLegacyCompat) =>`<div class="data-row"><div><input class="fo-mini-input" type="number" min="1" value="${esc(t.from)}" oninput="FinancialOperations.updateTier(${di},${ti},'from',this.value)"></div><div><input class="fo-mini-input" type="number" min="1" placeholder="∞" value="${esc(t.to)}" oninput="FinancialOperations.updateTier(${di},${ti},'to',this.value)"></div><div><input class="fo-mini-input" type="number" min="0" step="0.01" value="${esc(t.price)}" oninput="FinancialOperations.updateTier(${di},${ti},'price',this.value)"></div><div class="row-actions fo-inline-actions" data-no-kebab="true"><button class="secondary-action" type="button" onclick="FinancialOperations.addTier(${di})">+ Tier</button><button class="danger-action" type="button" onclick="FinancialOperations.removeTier(${di},${ti})">Delete</button></div></div>`),'fo-tier-table')}
          </article>`).join('')}
      </div>
    </section>`;
  }

  function moduleEditor(){
    return `<section class="panel fo-builder-panel"><div class="panel-head"><div><h2>4. Premium Modules</h2><p>Enable feature flags and set their billing basis.</p></div></div><div class="fo-module-grid">${state.draft.modules.map((m: ZentridLegacyCompat, i: ZentridLegacyCompat) =>`<article class="fo-module-card ${m.enabled?'selected':''}"><label class="fo-check"><input type="checkbox" ${m.enabled?'checked':''} onchange="FinancialOperations.toggleModule(${i})"><span class="fo-check-box" aria-hidden="true"></span><span class="fo-check-label">${esc(m.name)}</span></label><div class="fo-form-grid compact"><label class="fo-field"><span>Price</span><input type="number" min="0" step="0.01" value="${esc(m.price)}" oninput="FinancialOperations.updateModule(${i}, 'price', this.value)"></label><label class="fo-field"><span>Basis</span><select onchange="FinancialOperations.updateModule(${i}, 'basis', this.value)"><option ${m.basis==='Fixed'?'selected':''}>Fixed</option><option ${m.basis==='Per MW'?'selected':''}>Per MW</option><option ${m.basis==='Per Plant'?'selected':''}>Per Plant</option><option ${m.basis==='Per User'?'selected':''}>Per User</option></select></label></div></article>`).join('')}</div></section>`;
  }

  function calculationTrace(){
    const c=calc();
    const rows = [
      ['Base subscription', money(state.draft.baseFee), 'Fixed monthly platform access'],
      ['Users over limit', money(c.users), `${Math.max(0,n(state.draft.usage.users)-n(state.draft.includedUsers))} users × ${money(state.draft.userOveragePrice)}`],
      ['Plants over limit', money(c.plants), `${Math.max(0,n(state.draft.usage.plants)-n(state.draft.includedPlants))} plants × ${money(state.draft.plantOveragePrice)}`],
      ['Capacity over limit', money(c.capacity), `${Math.max(0,n(state.draft.usage.mw)-n(state.draft.includedMw))} MW × ${money(state.draft.mwOveragePrice)}`],
      ['Device charges', money(c.devices), `${state.draft.devices.length} device pricing rules`],
      ['API overage', money(c.api), `${Math.max(0,n(state.draft.usage.apiCalls)-n(state.draft.includedApi)).toLocaleString('en-US')} calls × ${money(state.draft.apiOveragePrice)}`],
      ['Telecontrol overage', money(c.commands), `${Math.max(0,n(state.draft.usage.commands)-n(state.draft.includedCommands))} commands × ${money(state.draft.commandOveragePrice)}`],
      ['Storage overage', money(c.storage), `${state.draft.usage.extraStorageTb} TB × ${money(state.draft.storageOveragePriceTb)}`],
      ['Premium modules', money(c.modules), 'Enabled feature flags'],
      ['SLA markup', money(c.markup), `${state.draft.slaLevel} · ${state.draft.slaMarkupPct}%`],
      ['Operator discount', '-' + money(c.operatorDiscount), `${state.draft.operatorDiscountPct}%`],
      ['Custom discount', '-' + money(c.customDiscount), `${state.draft.customDiscountPct}%`],
      ['Taxes', money(c.tax), `${state.draft.taxPct}%`]
    ];
    return `${table(['Charge','Amount','Rule'], rows.map((r: ZentridLegacyCompat) =>`<div class="data-row"><div><strong>${r[0]}</strong></div><div><strong>${r[1]}</strong></div><div><span>${r[2]}</span></div></div>`),'fo-calc-table')}
      <div class="fo-total-card"><span>Final invoice preview</span><strong>${money(c.total)}</strong><small>Subtotal ${money(c.subtotal)} → Markups ${money(c.markup)} → Discounts ${money(c.operatorDiscount+c.customDiscount)} → Taxes ${money(c.tax)}</small></div>
      <details class="fo-json"><summary>JSON snapshot preview</summary><pre>${esc(JSON.stringify({ tariff: state.draft.code, charges: { base_fee: state.draft.baseFee, devices: c.deviceLines.map((x: ZentridLegacyCompat) =>({ type:x.type, vendor:x.vendor, qty:x.qty, model:x.pricingModel, amount:x.amount })), users:c.users, plants:c.plants, capacity:c.capacity, api:c.api, commands:c.commands, storage:c.storage, modules:c.modules }, subtotal:c.subtotal, markup:c.markup, discounts:c.operatorDiscount+c.customDiscount, tax:c.tax, total:c.total }, null, 2))}</pre></details>`;
  }

  function tariffBuilder(){
    const c=calc();
    return `<section class="page-hero fo-hero"><div><span class="eyebrow">Financial Operations / Tariff Plans</span><h1>Create Tariff Plan From Scratch</h1><p>Build a real tariff plan: base subscription, included limits, device pricing matrix, premium modules, SLA, discounts, taxes and live simulation.</p></div><div class="hero-actions"><button class="secondary-action" onclick="FinancialOperations.resetDraft()">Reset Draft</button><button class="secondary-action" onclick="FinancialOperations.saveTariff()">Save Tariff</button><button class="primary-action" onclick="FinancialOperations.openAssignTariff()">Assign to Tenant</button></div></section>
      <section class="fo-step-grid"><article class="fo-step-card active"><b>1</b><span>Base</span><small>Client type, currency and subscription fee.</small></article><article class="fo-step-card active"><b>2</b><span>Limits</span><small>Included users, plants, MW, API, commands.</small></article><article class="fo-step-card active"><b>3</b><span>Device Matrix</span><small>Device types, vendors, quantities and tier prices.</small></article><article class="fo-step-card active"><b>4</b><span>Simulation</span><small>Live Rating Engine preview.</small></article></section>
      <section class="fo-builder-layout">
        <section class="panel fo-builder-panel"><div class="panel-head"><div><h2>1. Plan Identity</h2><p>Basic commercial profile.</p></div><span class="badge warning">${esc(state.draft.status)}</span></div><div class="fo-form-grid">${input('Plan name','name','text')}${input('System code','code','text')}${select('Customer type','customerType',['End Customer','Operator','Vendor','White Label Partner'])}${select('Billing type','billingType',['Prepaid','Postpaid'])}${select('Currency','currency',['EUR','USD','AMD'])}${input('Base monthly fee','baseFee','number','0.01')}</div></section>
        <section class="panel fo-builder-panel"><div class="panel-head"><div><h2>2. Included Limits & Overage</h2><p>What is included and what is charged after the limit.</p></div></div><div class="fo-form-grid">${input('Included users','includedUsers')}${input('User overage price','userOveragePrice','number','0.01')}${input('Included plants','includedPlants')}${input('Plant overage price','plantOveragePrice','number','0.01')}${input('Included MW','includedMw')}${input('MW overage price','mwOveragePrice','number','0.01')}${input('Included API calls','includedApi')}${input('API overage price','apiOveragePrice','number','0.0001')}${input('Included commands','includedCommands')}${input('Command overage price','commandOveragePrice','number','0.01')}${input('Included storage months','includedStorageMonths')}${input('Extra storage price / TB','storageOveragePriceTb','number','0.01')}</div></section>
        ${devicePricingEditor()}
        ${moduleEditor()}
        <section class="panel fo-builder-panel"><div class="panel-head"><div><h2>5. SLA, Discounts & Taxes</h2><p>Applied after fixed and usage charges.</p></div></div><div class="fo-form-grid">${select('SLA level','slaLevel',['Standard 8x5','Business 12x6','Premium 24x7','Mission Critical'])}${input('SLA markup %','slaMarkupPct','number','0.01')}${input('Operator discount %','operatorDiscountPct','number','0.01')}${input('Custom discount %','customDiscountPct','number','0.01')}${input('Tax %','taxPct','number','0.01')}</div></section>
      </section>
      <section class="fo-simulator-layout"><section class="panel"><div class="panel-head"><div><h2>6. Tariff Simulator</h2><p>Actual usage is linked to Included Limits. If actual usage is not manually above the old limit, it follows the new included value.</p></div><div class="row-actions"><button class="secondary-action" onclick="FinancialOperations.syncSimulatorToLimits()">Use Included Limits</button><button class="secondary-action" onclick="FinancialOperations.loadLargeExample()">Load Large Example</button></div></div><div class="fo-form-grid">${linkedUsageInput('Actual users','usage.users','includedUsers','User overage price','userOveragePrice')}${linkedUsageInput('Actual plants','usage.plants','includedPlants','Plant overage price','plantOveragePrice')}${linkedUsageInput('Actual MW','usage.mw','includedMw','MW overage price','mwOveragePrice')}${linkedUsageInput('Actual API calls','usage.apiCalls','includedApi','API overage price','apiOveragePrice')}${linkedUsageInput('Actual commands','usage.commands','includedCommands','Command overage price','commandOveragePrice')}${input('Extra storage TB','usage.extraStorageTb','number','0.1')}</div></section><section class="panel"><div class="panel-head"><div><h2>Calculation Trace</h2><p>Every invoice later stores this as a JSON snapshot.</p></div><span class="badge success">Live</span></div>${calculationTrace()}</section></section>
      <section class="panel"><div class="panel-head"><div><h2>Generated Plan Summary</h2><p>Object saved by Tariff Service and used by Rating Engine.</p></div></div><div class="info-grid fo-info-grid"><div><span>Plan</span><strong>${esc(state.draft.name)}</strong></div><div><span>Code</span><strong>${esc(state.draft.code)}</strong></div><div><span>Device Rules</span><strong>${state.draft.devices.length}</strong></div><div><span>Enabled Modules</span><strong>${state.draft.modules.filter((m: ZentridLegacyCompat) =>m.enabled).length}</strong></div><div><span>Subtotal</span><strong>${money(c.subtotal)}</strong></div><div><span>Invoice Preview</span><strong>${money(c.total)}</strong></div></div></section>${savedPlansPanel()}${assignDrawer()}`;
  }


  function savedPlansPanel(){
    const rows = savedPlans();
    return `<section class="panel fo-wide-panel"><div class="panel-head"><div><h2>Saved Tariff Plans</h2><p>Saved in localStorage now. Later this becomes Tariff Service / tariff_plans table.</p></div><span class="badge info">${rows.length} saved</span></div>${rows.length ? table(['Plan','Code','Customer','Currency','Updated','Actions'], rows.map((p: ZentridLegacyCompat) =>`<div class="data-row"><div><strong>${esc(p.name)}</strong><small>${esc(p.status || 'Draft')}</small></div><div><span>${esc(p.code)}</span></div><div><span>${esc(p.customerType)}</span></div><div><span>${esc(p.currency)}</span></div><div><span>${esc((p.updatedAt||'').slice(0,10))}</span></div><div class="row-actions fo-inline-actions"><button class="secondary-action" onclick="FinancialOperations.loadTariff('${esc(p.code)}')">Load</button><button class="primary-action" onclick="FinancialOperations.openAssignTariff('${esc(p.code)}')">Assign</button></div></div>`),'fo-saved-tariffs') : '<div class="empty-state"><strong>No saved tariff plans yet</strong><small>Click Save Tariff to persist the current draft locally.</small></div>'}</section>`;
  }

  function assignDrawer(){
    const rows = tenants();
    const plans = savedPlans();
    const currentCode = state.assignCode || state.draft.code;
    return `<aside class="detail-drawer fo-assign-drawer ${state.assignOpen ? 'open' : ''}" id="tariffAssignDrawer">
      <button class="drawer-close" type="button" onclick="FinancialOperations.closeAssignTariff()">×</button>
      <div class="drawer-head"><span class="eyebrow">Tariff Assignment</span><h2>Assign tariff to tenant</h2><p>Select a tenant and create a local billing profile assignment.</p></div>
      <div class="fo-form-grid compact">
        <label class="fo-field"><span>Tariff Plan</span><select id="foAssignTariff">${[...plans, currentPlanSnapshot()].filter((p,i,a)=>a.findIndex((x: ZentridLegacyCompat) =>x.code===p.code)===i).map((p: ZentridLegacyCompat) =>`<option value="${esc(p.code)}" ${p.code===currentCode?'selected':''}>${esc(p.name)} · ${esc(p.code)}</option>`).join('')}</select></label>
        <label class="fo-field"><span>Tenant</span><select id="foAssignTenant">${rows.map((t: ZentridLegacyCompat) =>`<option value="${esc(t.id)}">${esc(t.name)} · ${esc(t.code)}</option>`).join('')}</select></label>
        <label class="fo-field"><span>Start date</span><input id="foAssignStart" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
        <label class="fo-field"><span>Payment term</span><select id="foAssignTerm"><option>Net 7</option><option selected>Net 15</option><option>Net 30</option><option>Prepaid</option></select></label>
        <label class="fo-field"><span>Custom discount %</span><input id="foAssignDiscount" type="number" min="0" step="0.01" value="${esc(state.draft.customDiscountPct || 0)}"></label>
        <label class="fo-field"><span>Status</span><select id="foAssignStatus"><option selected>Active</option><option>Draft</option><option>Review</option><option>Suspended</option></select></label>
      </div>
      <div class="drawer-actions"><button class="secondary-action" type="button" onclick="FinancialOperations.closeAssignTariff()">Cancel</button><button class="primary-action" type="button" onclick="FinancialOperations.assignTariffToTenant()">Save Assignment</button></div>
    </aside>`;
  }

  function kpi(label: ZentridLegacyCompat, value: ZentridLegacyCompat, note: ZentridLegacyCompat, icon: ZentridLegacyCompat = '•'){ return `<article class="metric-card"><span>${icon}</span><div><small>${esc(label)}</small><strong>${value}</strong><p>${esc(note)}</p></div></article>`; }
  function billingManagement(){ return `<section class="page-hero fo-hero"><div><span class="eyebrow">Financial Operations / Billing Management</span><h1>Billing Management</h1><p>Metering, Rating Engine, charges, billing cycles, customer profiles, taxes, revenue recognition and ERP handoff.</p></div><div class="hero-actions"><button class="primary-action" onclick="ZentridLayout.toast('Monthly billing run queued')">Run Monthly Billing</button></div></section><section class="metrics-grid fo-metrics-grid">${kpi('Usage Records','18,420','Stations, devices, commands, API, storage.','📊')}${kpi('Charges Ready',money(284500),'Draft charge lines before invoice approval.','🧾')}${kpi('Rating Exceptions','12','Rules requiring finance review.','⚠️')}${kpi('Open Period','June 2026','Monthly billing cycle in progress.','📅')}</section><section class="fo-two-col"><div class="panel"><div class="panel-head"><div><h2>Billing Workflow</h2><p>From technical usage to financial obligation.</p></div></div><div class="fo-timeline">${['Collect Usage','Resolve Tariff','Apply Rule Engine','Run Rating Engine','Create Charges','Generate Invoice','Approve & Send','Receive Payment','Close Period'].map((s: ZentridLegacyCompat, i: ZentridLegacyCompat) =>`<div class="fo-flow-step"><b>${String(i+1).padStart(2,'0')}</b><div><strong>${s}</strong><small>${i<5?'Automated / controlled':'Finance operation'}</small></div></div>`).join('')}</div></div><div class="panel"><div class="panel-head"><div><h2>Customer Billing Profiles</h2><p>Active tariff, payment terms, credit and modules.</p></div></div>${table(['Customer','Tariff','Terms','Status'],[['Yerevan Solar Holdings','Enterprise Solar Operator Plan','Net 15','Active'],['Caucasus Solar O&M','White Label Operator','Net 30','Review'],['Green Valley Estate','Storage Control Custom','Prepaid','Draft']].map((r: ZentridLegacyCompat) =>`<div class="data-row"><div><strong>${r[0]}</strong></div><div><strong>${r[1]}</strong></div><div><span>${r[2]}</span></div><div><span class="badge ${badgeClass(r[3])}">${r[3]}</span></div></div>`))}</div></section><section class="panel"><div class="panel-head"><div><h2>Charge Queue</h2><p>Rating Engine output before invoice generation.</p></div></div>${table(['Charge Type','Source','Rule','Amount','Status'],[['Base Subscription','Tariff Plan','Fixed monthly fee',500,'Ready'],['Device Charges','Device Matrix','Dynamic tier rules',653,'Ready'],['Telecontrol Overage','Command Log','200 commands over limit',10,'Ready'],['API Overage','API Gateway','20,000 calls over limit',20,'Ready'],['Storage Overage','Telemetry Store','1 TB extra retention',25,'Ready'],['Tax Rule','Tax Engine','VAT 20%',235,'Review']].map((r: ZentridLegacyCompat) =>`<div class="data-row"><div><strong>${r[0]}</strong></div><div><span>${r[1]}</span></div><div><span>${r[2]}</span></div><div><strong>${money(r[3])}</strong></div><div><span class="badge ${badgeClass(r[4])}">${r[4]}</span></div></div>`))}</section>`; }
  function invoiceCenter(){ const invoices=[['INV-2026-0618','Yerevan Solar Holdings','June 2026',money(1404.48),'Approved'],['INV-2026-0619','Caucasus Solar O&M','June 2026',money(8240.20),'Sent'],['INV-2026-0620','Green Valley Estate','June 2026',money(2180),'Draft'],['INV-2026-0602','Demo Industrial Plant','May 2026',money(600),'Overdue']]; return `<section class="page-hero fo-hero"><div><span class="eyebrow">Financial Operations / Invoice Center</span><h1>Invoice Center</h1><p>Manage invoices as legal documents: draft, approve, send, export, snapshot, credit notes and ERP sync.</p></div><div class="hero-actions"><button class="primary-action" onclick="ZentridLayout.toast('Invoice draft created')">Create Invoice</button></div></section><section class="metrics-grid fo-metrics-grid">${kpi('Draft','8','Awaiting finance validation.','📝')}${kpi('Sent','26','Waiting for payment.','📨')}${kpi('Paid','114','Closed this period.','✅')}${kpi('Overdue','4','Collections required.','🔴')}</section><section class="fo-two-col fo-invoice-layout"><div class="panel"><div class="panel-head"><div><h2>Invoice Queue</h2><p>Click an invoice to review lifecycle and snapshot.</p></div></div>${table(['Invoice','Customer','Period','Total','Status'],invoices.map((r: ZentridLegacyCompat) =>`<div class="data-row clickable-row" onclick="FinancialOperations.selectInvoice('${r[0]}')"><div><strong>${r[0]}</strong></div><div><strong>${r[1]}</strong></div><div><span>${r[2]}</span></div><div><strong>${r[3]}</strong></div><div><span class="badge ${badgeClass(r[4])}">${r[4]}</span></div></div>`))}</div><div class="panel" id="invoiceDetailPanel">${invoiceDetail()}</div></section>`; }
  function invoiceDetail(){ return `<div class="panel-head"><div><h2>${esc(state.selectedInvoice)}</h2><p>Snapshot and lifecycle are immutable after approval.</p></div><span class="badge success">Snapshot stored</span></div><div class="fo-timeline compact">${['Draft created','Charges attached','Calculation snapshot stored','Finance approved','Sent to customer','Payment pending','ERP export pending'].map((s: ZentridLegacyCompat, i: ZentridLegacyCompat) =>`<div class="fo-flow-step"><b>${i+1}</b><div><strong>${s}</strong><small>${i<5?'Completed':'Waiting'}</small></div></div>`).join('')}</div><div class="row-actions"><button class="secondary-action" onclick="ZentridLayout.toast('PDF export prepared')">Export PDF</button><button class="primary-action" onclick="ZentridLayout.toast('Invoice sent')">Send</button></div>`; }
  function paymentSettings(){ return `<section class="page-hero fo-hero"><div><span class="eyebrow">Financial Operations / Payment Settings</span><h1>Payment Settings</h1><p>Configure payment methods, gateways, bank accounts, terms, reconciliation, refunds, chargebacks, FX, payouts and security.</p></div><div class="hero-actions"><button class="primary-action" onclick="ZentridLayout.toast('Payment method wizard opened')">Add Payment Method</button></div></section><section class="metrics-grid fo-metrics-grid">${kpi('Payment Methods','8','Bank, card, SWIFT, SEPA, deposit.','💳')}${kpi('Gateways','3','Stripe, Adyen, local provider.','🔌')}${kpi('Unmatched','4','Need reconciliation review.','🧩')}${kpi('Refund Requests','2','Awaiting approval.','↩️')}</section><section class="fo-two-col"><div class="panel"><div class="panel-head"><div><h2>Payment Methods</h2><p>Availability by currency, country and reconciliation support.</p></div></div>${table(['Method','Currencies','Fee','Auto Match','Status'],[['Bank Transfer','EUR, USD, AMD','0','Yes','Active'],['Stripe Card','EUR, USD','2.9% + 0.30','Yes','Active'],['SWIFT','EUR, USD, GBP','25 fixed','Partial','Active'],['Deposit Balance','All billing currencies','0','Yes','Draft']].map((r: ZentridLegacyCompat) =>`<div class="data-row"><div><strong>${r[0]}</strong></div><div><span>${r[1]}</span></div><div><span>${r[2]}</span></div><div><span>${r[3]}</span></div><div><span class="badge ${badgeClass(r[4])}">${r[4]}</span></div></div>`))}</div><div class="panel"><div class="panel-head"><div><h2>Payment Terms</h2><p>Due days, grace period and suspension rules.</p></div></div>${table(['Term','Due','Penalty','Suspension'],[['Net 7','7 days','0.05% / day','Day 30'],['Net 15','15 days','0.05% / day','Day 45'],['Net 30','30 days','0.03% / day','Day 60'],['Prepaid','0 days','None','Immediate if unpaid']].map((r: ZentridLegacyCompat) =>`<div class="data-row"><div><strong>${r[0]}</strong></div><div><span>${r[1]}</span></div><div><span>${r[2]}</span></div><div><span>${r[3]}</span></div></div>`))}</div></section>`; }
  function revenueSettlements(){ return `<section class="page-hero fo-hero"><div><span class="eyebrow">Financial Operations / Revenue & Settlements</span><h1>Revenue & Settlements</h1><p>Marketplace commissions, vendor payouts, operator revenue share, energy trading settlements and revenue recognition.</p></div><div class="hero-actions"><button class="primary-action" onclick="ZentridLayout.toast('Settlement batch prepared')">Prepare Settlement Batch</button></div></section><section class="metrics-grid fo-metrics-grid">${kpi('Marketplace GMV',money(128400),'Gross transaction volume.','🛒')}${kpi('Platform Commission',money(14820),'Fees retained by Zentrid.','💰')}${kpi('Pending Payouts',money(46600),'Vendor/operator payouts.','🏦')}${kpi('Recognized Revenue',money(98200),'Current period revenue.','📈')}</section><section class="fo-two-col"><div class="panel"><div class="panel-head"><div><h2>Settlement Queue</h2><p>Money distribution after invoice/payment confirmation.</p></div></div>${table(['Recipient','Source','Commission','Payout','Status'],[['Vendor · SolarParts EU','Marketplace sale','5%',money(9500),'Ready'],['Operator · Caucasus Solar O&M','White-label revenue','12%',money(18400),'Pending'],['Energy Trader · GridFlow','Trading settlement','2%',money(18700),'Ready']].map((r: ZentridLegacyCompat) =>`<div class="data-row"><div><strong>${r[0]}</strong></div><div><span>${r[1]}</span></div><div><span>${r[2]}</span></div><div><strong>${r[3]}</strong></div><div><span class="badge ${badgeClass(r[4])}">${r[4]}</span></div></div>`))}</div><div class="panel"><div class="panel-head"><div><h2>Revenue Recognition</h2><p>Subscription, marketplace, support and implementation revenue.</p></div></div>${table(['Stream','Amount','Rule'],[['Subscription Revenue',money(62400),'Monthly recognized'],['Marketplace Revenue',money(14820),'On settlement'],['Support Revenue',money(12000),'Service period'],['Implementation Revenue',money(9000),'Milestone based']].map((r: ZentridLegacyCompat) =>`<div class="data-row"><div><strong>${r[0]}</strong></div><div><strong>${r[1]}</strong></div><div><span>${r[2]}</span></div></div>`))}</div></section>`; }


  function persistCurrentDraft(){
    const snapshot = currentPlanSnapshot();
    snapshot.status = 'Active';
    state.draft.status = 'Active';
    const rows = savedPlans();
    const idx = rows.findIndex((x: ZentridLegacyCompat) => x.code === snapshot.code);
    if(idx >= 0) rows[idx] = snapshot; else rows.unshift(snapshot);
    savePlans(rows);
    return snapshot;
  }
  function saveTariff(){ persistCurrentDraft(); ZentridLayout.toast('Tariff saved to localStorage'); refresh('tariffs'); }
  function loadTariff(code: ZentridLegacyCompat){ const plan = savedPlans().find((x: ZentridLegacyCompat) => x.code === code); if(!plan) return; state.draft = clone(plan); ZentridLayout.toast('Tariff loaded'); refresh('tariffs'); }
  function openAssignTariff(code: ZentridLegacyCompat){ state.assignCode = code || state.draft.code; if(!savedPlans().some((x: ZentridLegacyCompat) =>x.code===state.assignCode)) persistCurrentDraft(); state.assignOpen = true; refresh('tariffs'); }
  function closeAssignTariff(){ state.assignOpen = false; refresh('tariffs'); }
  function assignTariffToTenant(){
    const tariffCode = document.getElementById('foAssignTariff')?.value || state.draft.code;
    const tenantId = document.getElementById('foAssignTenant')?.value;
    if(!tenantId){ ZentridLayout.toast('No tenant selected'); return; }
    const plan = savedPlans().find((x: ZentridLegacyCompat) =>x.code===tariffCode) || persistCurrentDraft();
    const tenant = tenants().find((x: ZentridLegacyCompat) =>x.id===tenantId);
    const rows = assignments().filter((x: ZentridLegacyCompat) => !(x.tenantId === tenantId && x.status === 'Active'));
    rows.unshift({
      id: 'TBA-' + Date.now(),
      tenantId,
      tenantName: tenant?.name || tenantId,
      tariffCode,
      tariffName: plan.name,
      startDate: document.getElementById('foAssignStart')?.value || new Date().toISOString().slice(0,10),
      paymentTerm: document.getElementById('foAssignTerm')?.value || 'Net 15',
      customDiscountPct: n(document.getElementById('foAssignDiscount')?.value),
      status: document.getElementById('foAssignStatus')?.value || 'Active',
      currency: plan.currency,
      assignedAt: new Date().toISOString()
    });
    saveAssignments(rows);
    state.assignOpen = false;
    ZentridLayout.toast('Tariff assigned to tenant billing profile');
    refresh('tariffs');
  }
  function syncSimulatorToLimits(){ Object.assign(state.draft.usage, { users:n(state.draft.includedUsers), plants:n(state.draft.includedPlants), mw:n(state.draft.includedMw), apiCalls:n(state.draft.includedApi), commands:n(state.draft.includedCommands) }); ZentridLayout.toast('Simulator usage synced to included limits'); refresh('tariffs'); }

  function refresh(page: ZentridLegacyCompat){
    const root=document.getElementById('fo-page-root');
    if(!root || root.dataset.page !== 'tariffs') return;
    const active = document.activeElement as ZentridLegacyCompat;
    const activePath = active?.dataset?.foPath;
    const selectionStart = typeof active?.selectionStart === 'number' ? active.selectionStart : null;
    const selectionEnd = typeof active?.selectionEnd === 'number' ? active.selectionEnd : null;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    root.innerHTML = tariffBuilder();

    if(activePath){
      const nextActive = root.querySelector(`[data-fo-path="${CSS.escape(activePath)}"]`) as ZentridLegacyCompat;
      if(nextActive){
        nextActive.focus({ preventScroll: true });
        if(selectionStart !== null && typeof nextActive.setSelectionRange === 'function'){
          try { nextActive.setSelectionRange(selectionStart, selectionEnd ?? selectionStart); } catch(e) {}
        }
      }
    }
    window.scrollTo(scrollX, scrollY);
  }
  function addDevice(){ state.draft.devices.push({ id:'dev_'+Date.now(), type:'Inverter', vendor:'Generic / Mixed', pricingModel:'Graduated', unit:'device / month', qty:1, tiers:[{from:1,to:'',price:10}] }); refresh('tariffs'); }
  function removeDevice(i: ZentridLegacyCompat){ if(state.draft.devices.length>1) state.draft.devices.splice(i,1); refresh('tariffs'); }
  function updateDevice(i: ZentridLegacyCompat, k: ZentridLegacyCompat, v: ZentridLegacyCompat){ state.draft.devices[i][k] = k==='qty'?n(v):v; refresh('tariffs'); }
  function addTier(i: ZentridLegacyCompat){ state.draft.devices[i].tiers.push({from:1,to:'',price:0}); refresh('tariffs'); }
  function removeTier(i: ZentridLegacyCompat, t: ZentridLegacyCompat){ if(state.draft.devices[i].tiers.length>1) state.draft.devices[i].tiers.splice(t,1); refresh('tariffs'); }
  function updateTier(i: ZentridLegacyCompat, t: ZentridLegacyCompat, k: ZentridLegacyCompat, v: ZentridLegacyCompat){ state.draft.devices[i].tiers[t][k] = k==='to' && v==='' ? '' : n(v); refresh('tariffs'); }
  function toggleModule(i: ZentridLegacyCompat){ state.draft.modules[i].enabled=!state.draft.modules[i].enabled; refresh('tariffs'); }
  function updateModule(i: ZentridLegacyCompat, k: ZentridLegacyCompat, v: ZentridLegacyCompat){ state.draft.modules[i][k] = k==='price'?n(v):v; refresh('tariffs'); }
  function resetDraft(){ location.reload(); }
  function loadLargeExample(){ Object.assign(state.draft.usage,{users:42,plants:18,mw:220,apiCalls:320000,commands:7500,extraStorageTb:8}); state.draft.devices[0].qty=220; state.draft.devices[1].qty=18; state.draft.devices[2].qty=36; state.draft.slaLevel='Mission Critical'; state.draft.slaMarkupPct=30; refresh('tariffs'); }
  function selectInvoice(id: ZentridLegacyCompat){ state.selectedInvoice=id; const p=document.getElementById('invoiceDetailPanel'); if(p) p.innerHTML=invoiceDetail(); }
  function render(page: ZentridLegacyCompat = 'tariffs'){ let content=tariffBuilder(); if(page==='billing') content=billingManagement(); if(page==='invoices') content=invoiceCenter(); if(page==='payments') content=paymentSettings(); if(page==='settlements') content=revenueSettlements(); return `<main id="fo-page-root" data-page="${page}">${content}</main>`; }
  return { render, setField:setByPath, addDevice, removeDevice, updateDevice, addTier, removeTier, updateTier, toggleModule, updateModule, resetDraft, loadLargeExample, selectInvoice, saveTariff, loadTariff, openAssignTariff, closeAssignTariff, assignTariffToTenant, syncSimulatorToLimits };
})();
