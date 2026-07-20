interface CommercialLicensingTariffPlan {
  id: string;
  code: string;
  publicName: string;
  customerType: string;
  billingType: string;
  currency: string;
  status: string;
  baseMonthlyFee: number;
  includedStations: number;
  overageStationPrice: number;
  includedCommands: number;
  overageCommandPrice: number;
  slaLevel: string;
  slaMarkupPct: number;
  operatorDiscountPct: number;
  activeClients: number;
  version: string;
  updated: string;
}

interface CommercialLicensingDevicePrice {
  tariffId: string;
  deviceType: string;
  pricingModel: string;
  tier: string;
  price: number;
  note: string;
}

interface CommercialLicensingPremiumModule {
  code: string;
  name: string;
  pricingBasis: string;
  price: number;
  allowed: string[];
}

interface CommercialLicensingAssignment {
  client: string;
  tariff: string;
  start: string;
  status: string;
  discount: string;
  modules: string;
  lastInvoice: string;
}

type CommercialLicensingFieldMap = Record<string, string>;

const CommercialLicensing = (() => {
  const tariffPlans: CommercialLicensingTariffPlan[] = [
    {
      id: 'industrial_operator_plus',
      code: 'industrial_operator_plus',
      publicName: 'Industrial Operator Plus',
      customerType: 'Operator',
      billingType: 'Postpaid',
      currency: 'EUR',
      status: 'Active',
      baseMonthlyFee: 500,
      includedStations: 3,
      overageStationPrice: 150,
      includedCommands: 1000,
      overageCommandPrice: 0.05,
      slaLevel: '24/7 Premium',
      slaMarkupPct: 10,
      operatorDiscountPct: 20,
      activeClients: 14,
      version: 'v3.2',
      updated: '18 Jun 2026'
    },
    {
      id: 'enterprise_storage_control',
      code: 'enterprise_storage_control',
      publicName: 'Enterprise Storage Control',
      customerType: 'End Customer',
      billingType: 'Postpaid',
      currency: 'USD',
      status: 'Draft',
      baseMonthlyFee: 1200,
      includedStations: 5,
      overageStationPrice: 220,
      includedCommands: 2500,
      overageCommandPrice: 0.035,
      slaLevel: 'Mission Critical',
      slaMarkupPct: 30,
      operatorDiscountPct: 0,
      activeClients: 0,
      version: 'v1.0-draft',
      updated: '21 Jun 2026'
    },
    {
      id: 'vendor_marketplace_basic',
      code: 'vendor_marketplace_basic',
      publicName: 'Vendor Marketplace Basic',
      customerType: 'Vendor',
      billingType: 'Prepaid',
      currency: 'EUR',
      status: 'Active',
      baseMonthlyFee: 250,
      includedStations: 0,
      overageStationPrice: 0,
      includedCommands: 0,
      overageCommandPrice: 0,
      slaLevel: '8x5 Standard',
      slaMarkupPct: 0,
      operatorDiscountPct: 0,
      activeClients: 9,
      version: 'v1.7',
      updated: '10 Jun 2026'
    }
  ];

  const devicePrices: CommercialLicensingDevicePrice[] = [
    { tariffId: 'industrial_operator_plus', deviceType: 'Inverter', pricingModel: 'Graduated', tier: '1–50', price: 12, note: 'Base inverter tier' },
    { tariffId: 'industrial_operator_plus', deviceType: 'Inverter', pricingModel: 'Graduated', tier: '51–200', price: 10, note: 'Industrial fleet tier' },
    { tariffId: 'industrial_operator_plus', deviceType: 'Inverter', pricingModel: 'Graduated', tier: '201+', price: 8, note: 'High-volume tier' },
    { tariffId: 'industrial_operator_plus', deviceType: 'Smart Meter', pricingModel: 'Flat', tier: 'All', price: 5, note: 'Per meter / month' },
    { tariffId: 'industrial_operator_plus', deviceType: 'BESS Controller', pricingModel: 'Capacity-Based', tier: 'Per MWh', price: 18, note: 'Storage control pricing' },
    { tariffId: 'enterprise_storage_control', deviceType: 'BESS', pricingModel: 'Capacity-Based', tier: 'Per MWh', price: 22, note: 'Enterprise BESS pricing' },
    { tariffId: 'enterprise_storage_control', deviceType: 'Gateway', pricingModel: 'Flat', tier: 'All', price: 15, note: 'SCADA / gateway endpoint' },
    { tariffId: 'vendor_marketplace_basic', deviceType: 'Vendor Listing', pricingModel: 'Flat', tier: 'Monthly', price: 250, note: 'Marketplace catalog placement' }
  ];

  const premiumModules: CommercialLicensingPremiumModule[] = [
    { code: 'ai_forecasting', name: 'AI Forecasting', pricingBasis: 'Fixed', price: 200, allowed: ['industrial_operator_plus', 'enterprise_storage_control'] },
    { code: 'predictive_maintenance', name: 'Predictive Maintenance', pricingBasis: 'Per Station', price: 35, allowed: ['industrial_operator_plus', 'enterprise_storage_control'] },
    { code: 'bess_smart_control', name: 'BESS Smart Control', pricingBasis: 'Per MW', price: 12, allowed: ['enterprise_storage_control'] },
    { code: 'api_enterprise', name: 'API Enterprise Access', pricingBasis: 'API Calls', price: 0.001, allowed: ['industrial_operator_plus', 'enterprise_storage_control'] },
    { code: 'esg_reporting', name: 'ESG Reporting', pricingBasis: 'Fixed', price: 120, allowed: ['industrial_operator_plus', 'enterprise_storage_control'] },
    { code: 'vendor_listing', name: 'Vendor Marketplace Listing', pricingBasis: 'Fixed', price: 250, allowed: ['vendor_marketplace_basic'] }
  ];

  const assignments: CommercialLicensingAssignment[] = [
    { client: 'Arpi Solar Group', tariff: 'industrial_operator_plus', start: '01 Jun 2026', status: 'Active', discount: '20%', modules: 'AI Forecasting · ESG Reporting', lastInvoice: '1170.40 EUR' },
    { client: 'SunVolt Operations', tariff: 'industrial_operator_plus', start: '01 May 2026', status: 'Active', discount: '15%', modules: 'Predictive Maintenance', lastInvoice: '1840.75 EUR' },
    { client: 'Green Valley Estate', tariff: 'enterprise_storage_control', start: 'Draft', status: 'Pending approval', discount: 'Custom', modules: 'BESS Smart Control · API Enterprise', lastInvoice: 'Not generated' }
  ];

  const initialPlan = tariffPlans[0];
  if (!initialPlan) throw new Error('At least one tariff plan is required');
  let activePlanId = initialPlan.id;

  const customerOptions = [
    'Arpi Solar Group',
    'SunVolt Operations',
    'Green Valley Estate',
    'Armenia Energy Holding',
    'Caucasus Solar O&M',
    'VoltBridge Vendor Network'
  ];

  function slugify(value: unknown): string {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || `tariff_${Date.now()}`;
  }

  function escapeHtml(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function money(value: unknown, currency = 'EUR'): string {
    return `${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }

  function badge(status: unknown): string {
    const s = String(status || '').toLowerCase();
    if (s.includes('active') || s.includes('approved')) return 'success';
    if (s.includes('draft') || s.includes('pending') || s.includes('review')) return 'warning';
    if (s.includes('archived') || s.includes('blocked')) return 'danger';
    return 'info';
  }

  function getActivePlan(): CommercialLicensingTariffPlan {
    const plan = tariffPlans.find(item => item.id === activePlanId) || tariffPlans[0];
    if (!plan) throw new Error('No tariff plan is available');
    return plan;
  }

  function canPhysicallyDeletePlan(plan: CommercialLicensingTariffPlan): boolean {
    return String(plan?.status || '').toLowerCase() === 'draft' && Number(plan?.activeClients || 0) === 0;
  }

  function handlePlanRowKey(event: KeyboardEvent, id: string): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    selectPlan(id);
  }

  function planRows(items: CommercialLicensingTariffPlan[] = tariffPlans): string {
    return items.map(plan => {
      const deleteLabel = canPhysicallyDeletePlan(plan) ? 'Delete' : 'Archive';
      const deleteTitle = canPhysicallyDeletePlan(plan)
        ? 'Delete unused draft tariff'
        : 'Archive tariff because it has usage or assigned clients';
      return `
        <div class="data-row tariff-plan-row ${plan.id === activePlanId ? 'selected' : ''}" role="button" tabindex="0" data-plan-id="${plan.id}" onclick="CommercialLicensing.selectPlan('${plan.id}')" onkeydown="CommercialLicensing.handlePlanRowKey(event, '${plan.id}')">
          <div><strong>${plan.publicName}</strong><small>${plan.code}<br>${plan.version} · updated ${plan.updated}</small></div>
          <div><span class="badge ${badge(plan.status)}">${plan.status}</span><small>${plan.customerType} · ${plan.billingType}</small></div>
          <div><strong>${money(plan.baseMonthlyFee, plan.currency)}</strong><small>${plan.includedStations} stations included · ${money(plan.overageStationPrice, plan.currency)} overage</small></div>
          <div><strong>${plan.slaLevel}</strong><small>${plan.slaMarkupPct}% SLA markup · ${plan.operatorDiscountPct}% operator discount</small></div>
          <div><strong>${plan.activeClients}</strong><small>Assigned clients</small></div>
          <div class="tariff-row-actions" onclick="event.stopPropagation()">
            <button class="secondary-action compact-action" type="button" onclick="CommercialLicensing.cloneTariff('${plan.id}')">Clone</button>
            <button class="danger-action compact-action" type="button" title="${deleteTitle}" onclick="CommercialLicensing.openDeleteTariff('${plan.id}')">${deleteLabel}</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function deviceRows(planId: string = activePlanId): string {
    const rows = devicePrices.filter(item => item.tariffId === planId);
    if (!rows.length) return '<div class="empty-state">No device pricing rules configured for this tariff.</div>';
    return rows.map(item => `
      <div class="data-row tariff-device-row">
        <div><strong>${item.deviceType}</strong><small>${item.note}</small></div>
        <div><strong>${item.pricingModel}</strong><small>Pricing model</small></div>
        <div><strong>${item.tier}</strong><small>Range / basis</small></div>
        <div><strong>${money(item.price, getActivePlan().currency)}</strong><small>Monthly price</small></div>
      </div>
    `).join('');
  }

  function moduleCards(planId: string = activePlanId): string {
    return premiumModules.map(module => {
      const enabled = module.allowed.includes(planId);
      return `
        <article class="premium-module-card ${enabled ? 'enabled' : 'disabled'}">
          <div><strong>${module.name}</strong><small>${module.code}</small></div>
          <span class="badge ${enabled ? 'success' : 'muted'}">${enabled ? 'Allowed' : 'Not allowed'}</span>
          <p>${module.pricingBasis} · ${module.price}${module.pricingBasis === 'API Calls' ? ' / call' : ' / month'}</p>
        </article>
      `;
    }).join('');
  }

  function assignmentRows(): string {
    return assignments.map(item => `
      <div class="data-row tariff-assignment-row">
        <div><strong>${item.client}</strong><small>Customer billing profile</small></div>
        <div><strong>${item.tariff}</strong><small>Active tariff code</small></div>
        <div><span class="badge ${badge(item.status)}">${item.status}</span><small>Start: ${item.start}</small></div>
        <div><strong>${item.discount}</strong><small>Discount / override</small></div>
        <div><strong>${item.lastInvoice}</strong><small>${item.modules}</small></div>
      </div>
    `).join('');
  }

  function filter(): void {
    const q = String(document.getElementById('tariffSearch')?.value || '').toLowerCase();
    const type = document.getElementById('tariffCustomerType')?.value || 'All customer types';
    const status = document.getElementById('tariffStatus')?.value || 'All statuses';
    const items = tariffPlans.filter(plan => {
      const text = `${plan.code} ${plan.publicName} ${plan.customerType} ${plan.status}`.toLowerCase();
      return (!q || text.includes(q))
        && (type === 'All customer types' || plan.customerType === type)
        && (status === 'All statuses' || plan.status === status);
    });
    const container = document.getElementById('tariffPlanRows');
    if (container) container.innerHTML = planRows(items);
  }

  function selectPlan(id: string): void {
    activePlanId = id;
    const plan = getActivePlan();
    document.querySelectorAll<HTMLElement>('.tariff-plan-row').forEach(row => row.classList.toggle('selected', row.dataset.planId === id));
    const details = document.getElementById('tariffPlanDetails');
    if (details) details.innerHTML = renderPlanDetails(plan);
    const devices = document.getElementById('tariffDeviceRows');
    if (devices) devices.innerHTML = deviceRows(id);
    const modules = document.getElementById('premiumModuleGrid');
    if (modules) modules.innerHTML = moduleCards(id);
    updateSimulatorDefaults(plan);
    simulate();
  }

  function updateSimulatorDefaults(plan: CommercialLicensingTariffPlan): void {
    const fields = {
      simStations: Math.max(plan.includedStations + 1, plan.includedStations),
      simCommands: plan.includedCommands + 200,
      simSlaPct: plan.slaMarkupPct,
      simDiscountPct: plan.operatorDiscountPct,
      simBaseFee: plan.baseMonthlyFee,
      simStationPrice: plan.overageStationPrice,
      simCommandPrice: plan.overageCommandPrice
    };
    Object.entries(fields).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (field) field.value = String(value);
    });
  }

  function numberValue(id: string, fallback = 0): number {
    const value = Number(document.getElementById(id)?.value || fallback);
    return Number.isFinite(value) ? value : fallback;
  }

  function simulate(): void {
    const plan = getActivePlan();
    const stations = numberValue('simStations', plan.includedStations);
    const inverters = numberValue('simInverters', 55);
    const bess = numberValue('simBess', 0);
    const commands = numberValue('simCommands', plan.includedCommands);
    const modules = numberValue('simModules', 1);
    const baseFee = numberValue('simBaseFee', plan.baseMonthlyFee);
    const stationPrice = numberValue('simStationPrice', plan.overageStationPrice);
    const commandPrice = numberValue('simCommandPrice', plan.overageCommandPrice);
    const slaPct = numberValue('simSlaPct', plan.slaMarkupPct);
    const discountPct = numberValue('simDiscountPct', plan.operatorDiscountPct);
    const vatPct = numberValue('simVatPct', 20);

    const extraStations = Math.max(0, stations - plan.includedStations);
    const stationCharge = extraStations * stationPrice;
    const inverterCharge = calculateInverters(inverters);
    const bessCharge = bess * 18;
    const commandOverage = Math.max(0, commands - plan.includedCommands);
    const commandCharge = commandOverage * commandPrice;
    const moduleCharge = modules * 200;
    const subtotal = baseFee + stationCharge + inverterCharge + bessCharge + commandCharge + moduleCharge;
    const slaAmount = subtotal * (slaPct / 100);
    const discountBase = subtotal + slaAmount;
    const discountAmount = discountBase * (discountPct / 100);
    const taxableAmount = discountBase - discountAmount;
    const vatAmount = taxableAmount * (vatPct / 100);
    const total = taxableAmount + vatAmount;

    const result = document.getElementById('tariffSimulationResult');
    if (!result) return;
    result.innerHTML = `
      <div class="simulation-total"><span>Estimated invoice</span><strong>${money(total, plan.currency)}</strong><small>${plan.publicName} · ${plan.currency}</small></div>
      <div class="simulation-trace">
        ${traceLine('Base Subscription', baseFee, plan.currency)}
        ${traceLine('Station Fees', stationCharge, plan.currency, `${extraStations} over limit`)}
        ${traceLine('Device Fees', inverterCharge + bessCharge, plan.currency, `${inverters} inverters · ${bess} BESS`)}
        ${traceLine('Telecontrol Fees', commandCharge, plan.currency, `${commandOverage} over limit`)}
        ${traceLine('Premium Modules', moduleCharge, plan.currency)}
        ${traceLine('SLA Markup', slaAmount, plan.currency, `${slaPct}%`)}
        ${traceLine('Discounts', -discountAmount, plan.currency, `${discountPct}%`)}
        ${traceLine('Taxes', vatAmount, plan.currency, `${vatPct}% VAT`)}
      </div>
    `;
  }

  function calculateInverters(qty: number): number {
    const plan = getActivePlan();
    if (plan.id === 'vendor_marketplace_basic') return 0;
    const first = Math.min(qty, 50) * 12;
    const second = Math.min(Math.max(qty - 50, 0), 150) * 10;
    const third = Math.max(qty - 200, 0) * 8;
    return first + second + third;
  }

  function traceLine(label: string, amount: number, currency: string, meta = ''): string {
    return `<div><span>${label}</span><strong>${amount < 0 ? '-' : ''}${money(Math.abs(amount), currency)}</strong><small>${meta}</small></div>`;
  }

  function renderPlanDetails(plan: CommercialLicensingTariffPlan = getActivePlan()): string {
    return `
      <div class="tariff-detail-header">
        <div>
          <span class="eyebrow">Selected Tariff Plan</span>
          <h2>${plan.publicName}</h2>
          <p>${plan.code} · ${plan.customerType} · ${plan.billingType}</p>
        </div>
        <span class="badge ${badge(plan.status)}">${plan.status}</span>
      </div>
      <div class="info-grid tariff-info-grid">
        <div><span>Base Monthly Fee</span><strong>${money(plan.baseMonthlyFee, plan.currency)}</strong><small>Minimum subscription amount</small></div>
        <div><span>Station Overage</span><strong>${money(plan.overageStationPrice, plan.currency)}</strong><small>${plan.includedStations} stations included</small></div>
        <div><span>Command Overage</span><strong>${money(plan.overageCommandPrice, plan.currency)}</strong><small>${plan.includedCommands} commands included</small></div>
        <div><span>SLA</span><strong>${plan.slaLevel}</strong><small>${plan.slaMarkupPct}% markup before discounts</small></div>
        <div><span>Operator Discount</span><strong>${plan.operatorDiscountPct}%</strong><small>Applied after SLA markup</small></div>
        <div><span>Invoice Snapshot</span><strong>Required</strong><small>Tariff version and trace stored with invoice</small></div>
      </div>
    `;
  }


  function refreshAll(): void {
    filter();
    selectPlan(activePlanId);
    const assignmentRoot = document.getElementById('tariffAssignmentRows');
    if (assignmentRoot) assignmentRoot.innerHTML = assignmentRows();
  }

  function toast(message: string): void {
    window.ZentridLayout?.toast?.(message);
  }

  function modalShell(title: string, description: string, body: string, footer: string): void {
    closeModal();
    const modal = document.createElement('div');
    modal.className = 'commercial-modal-backdrop';
    modal.id = 'commercialModalRoot';
    modal.innerHTML = `
      <div class="commercial-modal" role="dialog" aria-modal="true" aria-labelledby="commercialModalTitle">
        <div class="commercial-modal-head">
          <div><h2 id="commercialModalTitle">${title}</h2><p>${description}</p></div>
          <button type="button" class="modal-close-btn" onclick="CommercialLicensing.closeModal()">×</button>
        </div>
        <div class="commercial-modal-body">${body}</div>
        <div class="commercial-modal-footer">${footer}</div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function closeModal(): void {
    document.getElementById('commercialModalRoot')?.remove();
  }

  function readModalFields(ids: string[]): CommercialLicensingFieldMap {
    return ids.reduce<CommercialLicensingFieldMap>((acc, id) => {
      acc[id] = document.getElementById(id)?.value || '';
      return acc;
    }, {});
  }

  function openCreateTariff(): void {
    modalShell(
      'Create Tariff Plan',
      'Create a draft tariff plan. It can be reviewed, simulated and assigned after approval.',
      `
        <div class="modal-form-grid two-col">
          <label>Public Name<input id="newTariffPublicName" placeholder="Industrial Operator Plus"></label>
          <label>Code<input id="newTariffCode" placeholder="industrial_operator_plus"></label>
          <label>Customer Type<select id="newTariffCustomerType"><option>End Customer</option><option>Operator</option><option>Vendor</option></select></label>
          <label>Billing Type<select id="newTariffBillingType"><option>Postpaid</option><option>Prepaid</option></select></label>
          <label>Currency<select id="newTariffCurrency"><option>EUR</option><option>USD</option><option>AMD</option><option>GBP</option></select></label>
          <label>Status<select id="newTariffStatus"><option>Draft</option><option>Active</option></select></label>
          <label>Base Monthly Fee<input id="newTariffBaseFee" type="number" min="0" value="500"></label>
          <label>Included Stations<input id="newTariffIncludedStations" type="number" min="0" value="3"></label>
          <label>Station Overage Price<input id="newTariffStationPrice" type="number" min="0" value="150"></label>
          <label>Included Commands<input id="newTariffCommands" type="number" min="0" value="1000"></label>
          <label>Command Overage Price<input id="newTariffCommandPrice" type="number" min="0" step="0.001" value="0.05"></label>
          <label>SLA Level<select id="newTariffSla"><option>8x5 Standard</option><option>12x6 Business</option><option>24/7 Premium</option><option>Mission Critical</option></select></label>
          <label>SLA Markup %<input id="newTariffSlaPct" type="number" min="0" value="10"></label>
          <label>Operator Discount %<input id="newTariffDiscountPct" type="number" min="0" max="100" value="0"></label>
        </div>
      `,
      `<button class="secondary-action" type="button" onclick="CommercialLicensing.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="CommercialLicensing.saveTariffPlan()">Create Draft</button>`
    );
    const name = document.getElementById('newTariffPublicName');
    const code = document.getElementById('newTariffCode');
    name?.addEventListener('input', () => { if (!code?.dataset.touched) code!.value = slugify(name.value); });
    code?.addEventListener('input', () => { code.dataset.touched = 'true'; });
    name?.focus();
  }

  function saveTariffPlan(): void {
    const f = readModalFields(['newTariffPublicName','newTariffCode','newTariffCustomerType','newTariffBillingType','newTariffCurrency','newTariffStatus','newTariffBaseFee','newTariffIncludedStations','newTariffStationPrice','newTariffCommands','newTariffCommandPrice','newTariffSla','newTariffSlaPct','newTariffDiscountPct']);
    const publicName = (f.newTariffPublicName || '').trim();
    const code = slugify(f.newTariffCode || publicName);
    if (!publicName) return toast('Public name is required');
    if (tariffPlans.some(plan => plan.code === code || plan.id === code)) return toast('Tariff code must be unique');
    const plan: CommercialLicensingTariffPlan = {
      id: code,
      code,
      publicName,
      customerType: f.newTariffCustomerType || '',
      billingType: f.newTariffBillingType || '',
      currency: f.newTariffCurrency || '',
      status: f.newTariffStatus || '',
      baseMonthlyFee: Number(f.newTariffBaseFee || 0),
      includedStations: Number(f.newTariffIncludedStations || 0),
      overageStationPrice: Number(f.newTariffStationPrice || 0),
      includedCommands: Number(f.newTariffCommands || 0),
      overageCommandPrice: Number(f.newTariffCommandPrice || 0),
      slaLevel: f.newTariffSla || '',
      slaMarkupPct: Number(f.newTariffSlaPct || 0),
      operatorDiscountPct: Number(f.newTariffDiscountPct || 0),
      activeClients: 0,
      version: 'v1.0-draft',
      updated: '22 Jun 2026'
    };
    tariffPlans.unshift(plan);
    activePlanId = plan.id;
    closeModal();
    refreshAll();
    toast('Tariff plan created as draft');
  }

  function cloneTariff(planId: string = activePlanId): void {
    const source = tariffPlans.find(item => item.id === planId) || getActivePlan();
    const id = `${source.id}_copy_${Date.now().toString().slice(-4)}`;
    const clone: CommercialLicensingTariffPlan = {
      ...source,
      id,
      code: id,
      publicName: `${source.publicName} Copy`,
      status: 'Draft',
      activeClients: 0,
      version: 'v1.0-draft',
      updated: '22 Jun 2026'
    };
    tariffPlans.unshift(clone);
    devicePrices
      .filter(item => item.tariffId === source.id)
      .forEach(item => devicePrices.push({ ...item, tariffId: id }));
    premiumModules.forEach(module => {
      if (module.allowed.includes(source.id) && !module.allowed.includes(id)) module.allowed.push(id);
    });
    activePlanId = id;
    refreshAll();
    toast('Tariff cloned as draft');
  }

  function openDeleteTariff(planId: string = activePlanId): void {
    const plan = tariffPlans.find(item => item.id === planId);
    if (!plan) return toast('Tariff plan not found');
    const isDelete = canPhysicallyDeletePlan(plan);
    modalShell(
      isDelete ? 'Delete Tariff Plan' : 'Archive Tariff Plan',
      isDelete
        ? 'This draft tariff has no assigned clients and can be removed from the prototype list.'
        : 'Used tariff plans are archived instead of being physically deleted, so existing invoice snapshots remain auditable.',
      `
        <div class="delete-confirm-card">
          <strong>${escapeHtml(plan.publicName)}</strong>
          <small>${escapeHtml(plan.code)} · ${escapeHtml(plan.status)} · ${Number(plan.activeClients || 0)} assigned clients</small>
          <p>${isDelete ? 'The tariff will be removed from the list.' : 'The tariff status will be changed to Archived and it will no longer be available for new assignments.'}</p>
        </div>
      `,
      `<button class="secondary-action" type="button" onclick="CommercialLicensing.closeModal()">Cancel</button><button class="danger-action modal-danger-action" type="button" onclick="CommercialLicensing.deleteTariff('${plan.id}')">${isDelete ? 'Delete Tariff' : 'Archive Tariff'}</button>`
    );
  }

  function deleteTariff(planId: string = activePlanId): void {
    const index = tariffPlans.findIndex(item => item.id === planId);
    if (index < 0) return toast('Tariff plan not found');
    const plan = tariffPlans[index];
    if (!plan) return toast('Tariff plan not found');
    if (canPhysicallyDeletePlan(plan)) {
      tariffPlans.splice(index, 1);
      for (let i = devicePrices.length - 1; i >= 0; i -= 1) {
        const devicePrice = devicePrices[i];
        if (devicePrice?.tariffId === planId) devicePrices.splice(i, 1);
      }
      premiumModules.forEach(module => {
        module.allowed = module.allowed.filter(id => id !== planId);
      });
      activePlanId = tariffPlans[0]?.id || '';
      closeModal();
      refreshAll();
      toast('Tariff plan deleted');
      return;
    }
    plan.status = 'Archived';
    plan.updated = '22 Jun 2026';
    closeModal();
    activePlanId = plan.id;
    refreshAll();
    toast('Tariff plan archived');
  }

  function openAddDeviceTier(): void {
    const plan = getActivePlan();
    modalShell(
      'Add Device Tier',
      `Add pricing rule to ${plan.publicName}. Only one active pricing model should be used per device type.`,
      `
        <div class="modal-form-grid two-col">
          <label>Device Type<select id="newDeviceType"><option>Inverter</option><option>Smart Meter</option><option>BESS</option><option>BESS Controller</option><option>Tracker</option><option>Weather Station</option><option>Gateway</option><option>SCADA Endpoint</option><option>Protection Relay</option><option>EV Charger</option><option>Vendor Listing</option></select></label>
          <label>Pricing Model<select id="newDevicePricingModel"><option>Flat</option><option>Tiered</option><option>Graduated</option><option>Volume</option><option>Capacity-Based</option><option>Revenue-Based</option></select></label>
          <label>Tier / Range<input id="newDeviceTier" placeholder="1–50 / 201+ / Per MWh" value="All"></label>
          <label>Monthly Unit Price<input id="newDevicePrice" type="number" min="0" step="0.01" value="10"></label>
          <label class="modal-form-wide">Note<input id="newDeviceNote" placeholder="Pricing note shown in the grid"></label>
        </div>
      `,
      `<button class="secondary-action" type="button" onclick="CommercialLicensing.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="CommercialLicensing.saveDeviceTier()">Add Tier</button>`
    );
  }

  function saveDeviceTier(): void {
    const f = readModalFields(['newDeviceType','newDevicePricingModel','newDeviceTier','newDevicePrice','newDeviceNote']);
    const duplicateConflict = devicePrices.some(item => item.tariffId === activePlanId && item.deviceType === f.newDeviceType && item.pricingModel !== f.newDevicePricingModel);
    if (duplicateConflict) return toast('Conflict: this device type already uses another pricing model');
    devicePrices.push({
      tariffId: activePlanId,
      deviceType: f.newDeviceType || '',
      pricingModel: f.newDevicePricingModel || '',
      tier: f.newDeviceTier || 'All',
      price: Number(f.newDevicePrice || 0),
      note: f.newDeviceNote || 'Custom pricing tier'
    });
    closeModal();
    selectPlan(activePlanId);
    toast('Device tier added');
  }

  function openAddModule(): void {
    const plan = getActivePlan();
    modalShell(
      'Add Premium Module',
      `Create or allow premium module for ${plan.publicName}.`,
      `
        <div class="modal-form-grid two-col">
          <label>Module Name<input id="newModuleName" placeholder="Revenue Optimization"></label>
          <label>Module Code<input id="newModuleCode" placeholder="revenue_optimization"></label>
          <label>Pricing Basis<select id="newModuleBasis"><option>Fixed</option><option>Per Station</option><option>Per MW</option><option>Per User</option><option>API Calls</option><option>Revenue Share</option></select></label>
          <label>Price<input id="newModulePrice" type="number" min="0" step="0.001" value="100"></label>
          <label class="checkbox-label checkbox-inline modal-form-wide"><input id="newModuleAllowCurrent" type="checkbox" checked><span>Allow this module for selected tariff</span></label>
        </div>
      `,
      `<button class="secondary-action" type="button" onclick="CommercialLicensing.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="CommercialLicensing.saveModule()">Add Module</button>`
    );
    const name = document.getElementById('newModuleName') as HTMLInputElement | null;
    const code = document.getElementById('newModuleCode') as HTMLInputElement | null;
    if (name && code) {
      name.addEventListener('input', () => { if (!code.dataset.touched) code.value = slugify(name.value); });
      code.addEventListener('input', () => { code.dataset.touched = 'true'; });
    }
  }

  function saveModule(): void {
    const f = readModalFields(['newModuleName','newModuleCode','newModuleBasis','newModulePrice']);
    const name = (f.newModuleName || '').trim();
    const code = slugify(f.newModuleCode || name);
    if (!name) return toast('Module name is required');
    if (premiumModules.some(module => module.code === code)) return toast('Module code must be unique');
    const allowCurrent = document.getElementById('newModuleAllowCurrent')?.checked;
    premiumModules.push({
      code,
      name,
      pricingBasis: f.newModuleBasis || '',
      price: Number(f.newModulePrice || 0),
      allowed: allowCurrent ? [activePlanId] : []
    });
    closeModal();
    selectPlan(activePlanId);
    toast('Premium module added');
  }

  function openAssignTariff(): void {
    const plan = getActivePlan();
    modalShell(
      'Assign Tariff to Customer',
      'Create a Customer Billing Profile assignment with tariff, discount and enabled modules.',
      `
        <div class="modal-form-grid two-col">
          <label>Customer<select id="assignCustomer">${customerOptions.map(name => `<option>${escapeHtml(name)}</option>`).join('')}</select></label>
          <label>Tariff<select id="assignTariff">${tariffPlans.map(item => `<option value="${escapeHtml(item.id)}" ${item.id === plan.id ? 'selected' : ''}>${escapeHtml(item.publicName)}</option>`).join('')}</select></label>
          <label>Start Date<input id="assignStart" type="date" value="2026-06-22"></label>
          <label>Status<select id="assignStatus"><option>Active</option><option>Pending approval</option><option>Draft</option></select></label>
          <label>Discount / Override<input id="assignDiscount" placeholder="20% / Custom / 0%" value="${plan.operatorDiscountPct}%"></label>
          <label>Last Invoice<input id="assignInvoice" placeholder="Not generated" value="Not generated"></label>
          <label class="modal-form-wide">Enabled Modules<input id="assignModules" placeholder="AI Forecasting · ESG Reporting"></label>
        </div>
      `,
      `<button class="secondary-action" type="button" onclick="CommercialLicensing.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="CommercialLicensing.saveAssignment()">Assign Tariff</button>`
    );
  }

  function saveAssignment(): void {
    const f = readModalFields(['assignCustomer','assignTariff','assignStart','assignStatus','assignDiscount','assignInvoice','assignModules']);
    const plan = tariffPlans.find(item => item.id === f.assignTariff) || getActivePlan();
    assignments.unshift({
      client: f.assignCustomer || '',
      tariff: plan.code,
      start: f.assignStart || '22 Jun 2026',
      status: f.assignStatus || '',
      discount: f.assignDiscount || '0%',
      modules: f.assignModules || 'No premium modules',
      lastInvoice: f.assignInvoice || 'Not generated'
    });
    plan.activeClients = Number(plan.activeClients || 0) + 1;
    activePlanId = plan.id;
    closeModal();
    refreshAll();
    toast('Tariff assigned to customer');
  }

  function render(): string {
    const plan = getActivePlan();
    setTimeout(() => { updateSimulatorDefaults(plan); simulate(); }, 0);
    return `
      <section class="page-hero commercial-hero tariff-hero">
        <div>
          <p class="eyebrow">Global Admin · Financial Operations</p>
          <h1>Licenses & Subscriptions</h1>
          <p class="muted">Tariff Plans Builder for platform subscription, station fees, device pricing, telecontrol limits, SLA, premium modules and calculation simulation.</p>
        </div>
        <div class="hero-actions">
          <span class="badge info">Tariff governance</span>
        </div>
      </section>

      <section class="module-grid commercial-kpis tariff-kpis">
        <article class="module-card"><span>Active tariff plans</span><strong>12</strong><small>3 customer types · 4 billing models</small></article>
        <article class="module-card"><span>Assigned customers</span><strong>34</strong><small>Operators, vendors and end customers</small></article>
        <article class="module-card"><span>Premium modules</span><strong>13</strong><small>Feature flags controlled by tariff</small></article>
        <article class="module-card"><span>Calculation trace</span><strong>JSONB</strong><small>Snapshot required for every invoice</small></article>
      </section>

      <section class="tariff-workspace">
        <section class="panel glass-card commercial-panel tariff-plan-list-panel">
          <div class="panel-head">
            <div><h2>Tariff Plans</h2><p>Create, review and govern platform tariff plans. Tariffs are archived, not physically deleted after usage.</p></div>
            <div class="tariff-plan-head-actions"><button class="primary-action" type="button" onclick="CommercialLicensing.openCreateTariff()">+ Create Tariff Plan</button></div>
            <div class="toolbar commercial-toolbar tariff-toolbar">
              <input id="tariffSearch" placeholder="Search code, plan, type..." oninput="CommercialLicensing.filter()" />
              <select id="tariffCustomerType" onchange="CommercialLicensing.filter()"><option>All customer types</option><option>End Customer</option><option>Operator</option><option>Vendor</option></select>
              <select id="tariffStatus" onchange="CommercialLicensing.filter()"><option>All statuses</option><option>Active</option><option>Draft</option><option>Archived</option></select>
            </div>
          </div>
          <div class="data-table commercial-table tariff-plan-table">
            <div class="data-head tariff-plan-row"><div>Tariff</div><div>Status</div><div>Subscription / Stations</div><div>SLA / Discounts</div><div>Clients</div><div>Actions</div></div>
            <div id="tariffPlanRows">${planRows()}</div>
          </div>
        </section>

        <aside class="panel glass-card tariff-detail-panel" id="tariffPlanDetails">${renderPlanDetails(plan)}</aside>
      </section>

      <section class="module-grid tariff-builder-grid">
        <section class="panel glass-card commercial-panel">
          <div class="panel-head"><div><h2>Device Pricing Grid</h2><p>One active pricing model per device type. Supports Flat, Tiered, Graduated, Volume and Capacity-Based pricing.</p></div><button class="secondary-action" type="button" onclick="CommercialLicensing.openAddDeviceTier()">+ Add Device Tier</button></div>
          <div class="data-table commercial-table tariff-device-table">
            <div class="data-head tariff-device-row"><div>Device Type</div><div>Model</div><div>Tier</div><div>Unit Price</div></div>
            <div id="tariffDeviceRows">${deviceRows()}</div>
          </div>
        </section>

        <section class="panel glass-card commercial-panel">
          <div class="panel-head"><div><h2>Premium Modules & Feature Flags</h2><p>Modules can be enabled for customer only when allowed by the assigned tariff.</p></div><button class="secondary-action" type="button" onclick="CommercialLicensing.openAddModule()">+ Add Module</button></div>
          <div class="premium-module-grid" id="premiumModuleGrid">${moduleCards()}</div>
        </section>
      </section>

      <section class="module-grid tariff-builder-grid bottom">
        <section class="panel glass-card commercial-panel tariff-simulator-panel">
          <div class="panel-head"><div><h2>Tariff Simulator</h2><p>Preview invoice calculation before assigning a tariff to customer billing profile.</p></div><button class="secondary-action" type="button" onclick="CommercialLicensing.simulate()">Run Simulation</button></div>
          <div class="tariff-simulator-form">
            <label>Stations<input id="simStations" type="number" min="0" value="4" oninput="CommercialLicensing.simulate()"></label>
            <label>Inverters<input id="simInverters" type="number" min="0" value="55" oninput="CommercialLicensing.simulate()"></label>
            <label>BESS / Storage Units<input id="simBess" type="number" min="0" value="1" oninput="CommercialLicensing.simulate()"></label>
            <label>Successful Commands<input id="simCommands" type="number" min="0" value="1200" oninput="CommercialLicensing.simulate()"></label>
            <label>Premium Modules<input id="simModules" type="number" min="0" value="1" oninput="CommercialLicensing.simulate()"></label>
            <label>Base Fee<input id="simBaseFee" type="number" min="0" value="500" oninput="CommercialLicensing.simulate()"></label>
            <label>Station Overage Price<input id="simStationPrice" type="number" min="0" value="150" oninput="CommercialLicensing.simulate()"></label>
            <label>Command Overage Price<input id="simCommandPrice" type="number" min="0" step="0.001" value="0.05" oninput="CommercialLicensing.simulate()"></label>
            <label>SLA Markup %<input id="simSlaPct" type="number" min="0" value="10" oninput="CommercialLicensing.simulate()"></label>
            <label>Discount %<input id="simDiscountPct" type="number" min="0" value="20" oninput="CommercialLicensing.simulate()"></label>
            <label>VAT %<input id="simVatPct" type="number" min="0" value="20" oninput="CommercialLicensing.simulate()"></label>
          </div>
        </section>

        <section class="panel glass-card commercial-panel tariff-result-panel">
          <div class="panel-head"><div><h2>Calculation Trace</h2><p>Invoice must store tariff version, rules, discounts, taxes and final amount snapshot.</p></div></div>
          <div id="tariffSimulationResult"></div>
        </section>
      </section>

      <section class="panel glass-card commercial-panel tariff-assignment-panel">
        <div class="panel-head"><div><h2>Customer Tariff Assignments</h2><p>Customer Billing Profile: active tariff, modules, overrides, current usage and invoice history.</p></div><button class="secondary-action" type="button" onclick="CommercialLicensing.openAssignTariff()">Assign Tariff</button></div>
        <div class="data-table commercial-table tariff-assignment-table">
          <div class="data-head tariff-assignment-row"><div>Customer</div><div>Tariff</div><div>Status</div><div>Discount</div><div>Last Invoice</div></div>
          <div id="tariffAssignmentRows">${assignmentRows()}</div>
        </div>
      </section>
    `;
  }

  return { render, filter, selectPlan, handlePlanRowKey, simulate, cloneTariff, openDeleteTariff, deleteTariff, openCreateTariff, saveTariffPlan, openAddDeviceTier, saveDeviceTier, openAddModule, saveModule, openAssignTariff, saveAssignment, closeModal };
})();
