type CommercialScalar = string | number;

interface CommercialRecord {
  [key: string]: CommercialScalar;
  id: string;
  client: string;
  tenant: string;
  assignedPlants: string;
  plan: string;
  billingModel: string;
  contractStatus: string;
  renewalDate: string;
  sla: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  autoRenewal: string;
  baseFee: string;
  discount: string;
  finalFee: string;
  currency: string;
  includedPlants: string;
  includedUsers: string;
  includedIntegrations: string;
  paymentTerms: string;
  invoiceCycle: string;
  paymentStatus: string;
  primaryBank: string;
  invoiceEmail: string;
  seller: string;
  buyerType: string;
  buyerName: string;
  salesChannel: string;
  salePrice: string;
  saleCurrency: string;
  salePeriod: string;
  saleStart: string;
  saleEnd: string;
  settlementMethod: string;
  settlementDate: string;
  settlementDestination: string;
  audit: string;
  tariffCode: string;
  actualStations: number;
  inverters: number;
  bess: number;
  commands: number;
  modules: string;
  snapshot: string;
}

interface CommercialTariffPlan {
  code: string;
  name: string;
  currency: string;
  billing: string;
  customer: string;
  status: string;
  base: string;
  included: string;
  overage: string;
  commands: string;
  commandPrice: string;
  sla: string;
  discount: string;
  modules: string;
  version: string;
}

interface CommercialTariffAudit {
  version: string;
  tariff: string;
  status: string;
  author: string;
  date: string;
  note: string;
}

interface CommercialDevicePrice {
  type: string;
  model: string;
  range: string;
  price: string;
  rule: string;
}

interface CommercialRuleStep {
  step: string;
  name: string;
  type: string;
  rule: string;
}

interface CommercialAssignment {
  client: string;
  tariff: string;
  code: string;
  start: string;
  end: string;
  status: string;
  modules: string;
}

interface CommercialKpiItem {
  label: string;
  value: string | number;
  note: string;
}

interface CommercialSimulationResult {
  base: number;
  station: number;
  inverter: number;
  command: number;
  module: number;
  subtotal: number;
  sla: number;
  rawDiscount: number;
  discountCap: number;
  discount: number;
  capApplied: boolean;
  taxable: number;
  vat: number;
  total: number;
}

interface CommercialTenantClientPlant {
  client: string;
  plants: string;
}

type CommercialTenantCatalog = Record<string, CommercialTenantClientPlant[]>;
type CommercialModalSaveHandler = () => void;

const Commercial = (() => {
  const records: CommercialRecord[] = [
    { id:'COM-00091', client:'Arpi Solar Group', tenant:'Tenant Alpha Energy', assignedPlants:'Plant A · Berlin Rooftop · Storage Pilot', plan:'Industrial Operator Plus', billingModel:'Hybrid', contractStatus:'Active', renewalDate:'12 Dec 2027', sla:'24/7 Premium', contractNumber:'CNT-2026-041', startDate:'12 Dec 2025', endDate:'12 Dec 2027', autoRenewal:'Enabled', baseFee:'€500 / month', discount:'20%', finalFee:'€1,170.40 / month', currency:'EUR', includedPlants:'3', includedUsers:'75', includedIntegrations:'8', paymentTerms:'Net 15', invoiceCycle:'Monthly', paymentStatus:'Current', primaryBank:'ACBA Bank · EUR · AM110001234567890', invoiceEmail:'billing@arpisolar.example', seller:'Arpi Solar Group', buyerType:'Energy Trader', buyerName:'Green Market Trader LLC', salesChannel:'Aggregator Contract', salePrice:'€0.092 / kWh', saleCurrency:'EUR', salePeriod:'Monthly', saleStart:'01 Jan 2026', saleEnd:'31 Dec 2027', settlementMethod:'Bank transfer', settlementDate:'15th day after period close', settlementDestination:'Primary bank · ACBA Bank', audit:'Updated by Global Admin · 12 Jun 2026', tariffCode:'industrial_operator_plus', actualStations:3, inverters:55, bess:2, commands:1200, modules:'AI Forecasting, ERP Connector', snapshot:'JSONB snapshot locked on invoice approval' },
    { id:'COM-00104', client:'Ivan Petrov', tenant:'Tenant North Operations', assignedPlants:'Residential PV · Home Battery', plan:'Professional Solar', billingModel:'Per Device', contractStatus:'Review', renewalDate:'30 Sep 2026', sla:'8x5 Standard', contractNumber:'CNT-2026-055', startDate:'01 Oct 2025', endDate:'30 Sep 2026', autoRenewal:'Manual review', baseFee:'€120 / month', discount:'0%', finalFee:'€284.30 / month', currency:'EUR', includedPlants:'1', includedUsers:'12', includedIntegrations:'3', paymentTerms:'Net 30', invoiceCycle:'Monthly', paymentStatus:'Pending review', primaryBank:'Ameriabank · EUR · AM220009876543210', invoiceEmail:'ivan.petrov@example.com', seller:'Ivan Petrov', buyerType:'Grid Operator', buyerName:'Local Distribution Grid', salesChannel:'Feed-in agreement', salePrice:'€0.065 / kWh', saleCurrency:'EUR', salePeriod:'Monthly', saleStart:'01 Oct 2025', saleEnd:'30 Sep 2026', settlementMethod:'Bank transfer', settlementDate:'End of month + 20 days', settlementDestination:'Primary bank · Ameriabank', audit:'Created by Commercial Ops · 03 Jun 2026', tariffCode:'professional_solar', actualStations:2, inverters:12, bess:1, commands:320, modules:'Predictive Maintenance', snapshot:'Draft snapshot, pending approval' },
    { id:'COM-00121', client:'Green Valley Estate', tenant:'GridOps Partner', assignedPlants:'Green Valley East · Green Valley West · EV Campus', plan:'Enterprise Override', billingModel:'Contract Override', contractStatus:'Active', renewalDate:'18 Jan 2028', sla:'Mission Critical', contractNumber:'CNT-2026-077', startDate:'18 Jan 2026', endDate:'18 Jan 2028', autoRenewal:'Enabled', baseFee:'$900 / month', discount:'8%', finalFee:'$5,940 / month', currency:'USD', includedPlants:'Custom', includedUsers:'Custom', includedIntegrations:'Custom', paymentTerms:'Net 10', invoiceCycle:'Monthly', paymentStatus:'Current', primaryBank:'HSBC · USD · GB29NWBK60161331926819', invoiceEmail:'finance@greenvalley.example', seller:'Green Valley Estate', buyerType:'Direct Consumer', buyerName:'Green Valley Mall', salesChannel:'Direct PPA', salePrice:'$0.118 / kWh', saleCurrency:'USD', salePeriod:'Custom period', saleStart:'18 Jan 2026', saleEnd:'18 Jan 2028', settlementMethod:'Bank transfer', settlementDate:'Custom PPA schedule', settlementDestination:'Primary bank · HSBC', audit:'Renewal rules checked · 09 Jun 2026', tariffCode:'enterprise_override', actualStations:9, inverters:220, bess:8, commands:8400, modules:'Trading, Digital Twin, ESG Reporting', snapshot:'Approved invoice snapshots protected from tariff changes' }
  ];

  const tariffPlans: CommercialTariffPlan[] = [
    { code:'industrial_operator_plus', name:'Industrial Operator Plus', currency:'EUR', billing:'Postpaid', customer:'Operator', status:'Active', base:'500', included:'3', overage:'150', commands:'1000', commandPrice:'0.05', sla:'10%', discount:'20%', modules:'AI, ERP, Trading', version:'v1.4' },
    { code:'professional_solar', name:'Professional Solar', currency:'EUR', billing:'Prepaid + Overage', customer:'End Customer', status:'Review', base:'120', included:'1', overage:'45', commands:'500', commandPrice:'0.04', sla:'0%', discount:'0%', modules:'Predictive Maintenance', version:'v0.9' },
    { code:'enterprise_override', name:'Enterprise Override', currency:'USD', billing:'Postpaid', customer:'Enterprise', status:'Active', base:'900', included:'Custom', overage:'Contract', commands:'5000', commandPrice:'0.03', sla:'30%', discount:'8%', modules:'Trading, Digital Twin, ESG', version:'v2.1' }
  ];

  const tariffVersionAudit: CommercialTariffAudit[] = [
    { version:'v1.4', tariff:'Industrial Operator Plus', status:'Active', author:'Global Admin', date:'12 Jun 2026', note:'SLA, operator discount and device graduated tiers locked for invoice snapshot.' },
    { version:'v1.3', tariff:'Industrial Operator Plus', status:'Archived', author:'Commercial Ops', date:'22 May 2026', note:'Previous tariff version retained for approved invoices.' },
    { version:'v2.1', tariff:'Enterprise Override', status:'Active', author:'Enterprise Admin', date:'09 Jun 2026', note:'Contract override prices and mission critical SLA applied.' }
  ];

  const devicePrices: CommercialDevicePrice[] = [
    { type:'Inverter', model:'Graduated', range:'1–50', price:'12 EUR', rule:'Tier 1' },
    { type:'Inverter', model:'Graduated', range:'51–200', price:'10 EUR', rule:'Tier 2' },
    { type:'Inverter', model:'Graduated', range:'201+', price:'8 EUR', rule:'Tier 3' },
    { type:'BESS Controller', model:'Flat', range:'All', price:'60 EUR', rule:'Per unit / month' },
    { type:'Smart Meter', model:'Flat', range:'All', price:'5 EUR', rule:'Per unit / month' },
    { type:'SCADA Endpoint', model:'Capacity-Based', range:'Per MW', price:'3 EUR', rule:'Capacity fee' }
  ];

  const billingRules: CommercialRuleStep[] = [
    { step:'01', name:'Base Subscription', type:'Fixed charge', rule:'base_monthly_fee with prorata if partial month' },
    { step:'02', name:'Station Fees', type:'Usage charge', rule:'MAX(0, actual - included) × overage price' },
    { step:'03', name:'Device Fees', type:'Usage charge', rule:'Flat / Tiered / Graduated / Volume per device type' },
    { step:'04', name:'Telecontrol Fees', type:'Usage charge', rule:'Successful commands above included limit × price' },
    { step:'05', name:'Marketplace / API / Storage', type:'Usage charge', rule:'Transactions, API calls, webhooks, TB archives' },
    { step:'06', name:'Premium Modules', type:'Feature flags', rule:'Only modules allowed by tariff can be activated' },
    { step:'07', name:'Markups', type:'Markup', rule:'Emergency Support → Premium SLA → Custom Services → Regional Adjustment' },
    { step:'08', name:'Discounts', type:'Discount', rule:'Operator → Volume → Contract → Promo → Manual, with maximum cap' },
    { step:'09', name:'Taxes & Rounding', type:'Tax', rule:'VAT / Sales Tax / Local Tax after markups and discounts' }
  ];

  const assignments: CommercialAssignment[] = records.map((r: CommercialRecord) => ({ client:r.client, tariff:r.plan, code:r.tariffCode, start:r.startDate, end:r.endDate, status:r.contractStatus, modules:r.modules }));
  const firstRecord = records[0];
  if (!firstRecord) throw new Error('Commercial governance requires a default record.');
  let activeId = firstRecord.id;
  let activeGovernanceTab = 'models';

  const tenantCatalog: CommercialTenantCatalog = records.reduce<CommercialTenantCatalog>((acc, item) => {
    const tenantItems = acc[item.tenant] ?? (acc[item.tenant] = []);
    tenantItems.push({ client: item.client, plants: item.assignedPlants });
    return acc;
  }, {});

  const badge = (status: unknown): string => {
    const s = String(status || '').toLowerCase();
    if (s.includes('active') || s.includes('enabled') || s.includes('current') || s.includes('approved')) return 'success';
    if (s.includes('review') || s.includes('pending') || s.includes('draft')) return 'warning';
    if (s.includes('expired') || s.includes('blocked') || s.includes('failed')) return 'danger';
    return 'info';
  };
  const toast = (msg: string): void => (window.FleetLayout && FleetLayout.toast) ? FleetLayout.toast(msg) : alert(msg);
  const byId = (id: string): CommercialRecord => records.find(item => item.id === id) ?? firstRecord;
  const money = (value: unknown): string => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function miniKpis(items: CommercialKpiItem[]): string {
    return `<section class="module-grid commercial-kpis-v78 commercial-governance-kpis-v100">${items.map(item => `<article class="module-card"><span>${item.label}</span><strong>${item.value}</strong><small>${item.note}</small></article>`).join('')}</section>`;
  }

  function dataTable(heads: string[], body: string[], cls = 'commercial-billing-table-v120'): string {
    return `<div class="data-table ${cls}"><div class="data-head">${heads.map(h => `<span>${h}</span>`).join('')}</div>${body.join('')}</div>`;
  }

  function row(item: CommercialRecord): string {
    return `<div class="data-row commercial-registry-row" data-commercial-id="${item.id}">
      <div><strong>${item.client}</strong><small>${item.id}<br>${item.tenant}</small></div>
      <div><strong>${item.plan}</strong><small>${item.billingModel} · ${item.tariffCode}</small></div>
      <div><span class="badge ${badge(item.contractStatus)}">${item.contractStatus}</span><small>${item.contractNumber}</small></div>
      <div><strong>${item.paymentStatus}</strong><small>${item.paymentTerms} · ${item.invoiceCycle}</small></div>
      <div><strong>${item.finalFee}</strong><small>${item.sla} · Discount ${item.discount}</small></div>
      <div class="row-actions kebabified"><button type="button" class="secondary-action compact-action" data-action="open-commercial" data-id="${item.id}">Open</button></div>
    </div>`;
  }
  const rows = (items: CommercialRecord[] = records): string => items.map(row).join('');

  function renderOverview(record: CommercialRecord): string {
    return `<section class="panel glass-card commercial-detail-panel active" data-commercial-panel="overview">
      <div class="panel-head"><div><h2>Commercial Billing Profile</h2><p>Client scope, tariff assignment, billing cycle and invoice snapshot readiness.</p></div><span class="badge ${badge(record.contractStatus)}">${record.contractStatus}</span></div>
      ${miniKpis([
        {label:'Tariff Code', value:record.tariffCode, note:'Used by API and Billing Engine'},
        {label:'Billing Model', value:record.billingModel, note:'Pricing basis'},
        {label:'Current Invoice', value:record.finalFee, note:`${record.invoiceCycle} · ${record.currency}`},
        {label:'Snapshot', value:'Enabled', note:'Old invoices protected from tariff edits'}
      ])}
      <div class="info-grid commercial-info-grid-v78">
        <div><span>Client</span><strong>${record.client}</strong><small>Commercial counterparty</small></div>
        <div><span>Tenant</span><strong>${record.tenant}</strong><small>Multi-tenant context</small></div>
        <div><span>Assigned Plants</span><strong>${record.assignedPlants}</strong><small>Station scope for billing</small></div>
        <div><span>Active Modules</span><strong>${record.modules}</strong><small>Allowed by tariff feature flags</small></div>
        <div><span>Usage Metrics</span><strong>${record.actualStations} stations · ${record.inverters} inverters</strong><small>${record.commands} telecontrol commands</small></div>
        <div><span>Invoice Snapshot</span><strong>${record.snapshot}</strong><small>Calculation trace must be stored with invoice</small></div>
      </div>
    </section>`;
  }

  function renderTariffAssignment(record: CommercialRecord): string {
    return `<section class="panel glass-card commercial-detail-panel" data-commercial-panel="tariff">
      <div class="panel-head"><div><h2>Tariff Assignment</h2><p>Tariff plan assigned to customer billing profile.</p></div><button class="secondary-action" type="button" data-prototype-action="Assign tariff draft opened">Assign Tariff</button></div>
      <div class="info-grid commercial-info-grid-v78">
        <div><span>Tariff Plan</span><strong>${record.plan}</strong><small>${record.tariffCode}</small></div>
        <div><span>Contract</span><strong>${record.contractNumber}</strong><small>${record.startDate} → ${record.endDate}</small></div>
        <div><span>Billing Type</span><strong>${record.invoiceCycle}</strong><small>${record.paymentTerms}</small></div>
        <div><span>Currency</span><strong>${record.currency}</strong><small>Invoice currency</small></div>
        <div><span>Included Stations</span><strong>${record.includedPlants}</strong><small>Station overage applies after limit</small></div>
        <div><span>SLA</span><strong>${record.sla}</strong><small>Markup before discounts</small></div>
      </div>
    </section>`;
  }

  function renderUsageCharges(record: CommercialRecord): string {
    const body = [
      ['Stations', `${record.actualStations}`, `Included: ${record.includedPlants}`, 'Prorata + Overage'],
      ['Inverters', `${record.inverters}`, 'Graduated tiering', 'Device Charges'],
      ['BESS Controllers', `${record.bess}`, 'Flat per unit', 'Device Charges'],
      ['Telecontrol Commands', `${record.commands}`, 'Included limit + overage', 'Command Overage'],
      ['Premium Modules', record.modules, 'Feature flag controlled', 'Module Charges']
    ].map(x => `<div class="data-row"><div><strong>${x[0]}</strong><small>${x[3]}</small></div><div><strong>${x[1]}</strong></div><div><span class="badge info">${x[2]}</span></div><button class="secondary-action compact-action" type="button" data-prototype-action="${x[0]} charge rule opened">Configure</button></div>`);
    return `<section class="panel glass-card commercial-detail-panel" data-commercial-panel="usage">
      <div class="panel-head"><div><h2>Usage & Charge Sources</h2><p>Billing units collected by Metering Service before Rating Engine calculation.</p></div></div>
      ${dataTable(['Billable Unit','Quantity','Pricing Rule','Action'], body)}
    </section>`;
  }

  function renderInvoiceSnapshot(record: CommercialRecord): string {
    return `<section class="panel glass-card commercial-detail-panel" data-commercial-panel="snapshot">
      <div class="panel-head"><div><h2>Calculation Snapshot</h2><p>Invoice must store tariff version, rules, discounts, FX rates, taxes and full calculation trace.</p></div><span class="badge success">JSONB ready</span></div>
      <pre class="commercial-json-v120">{
  "customer": "${record.client}",
  "tariff_code": "${record.tariffCode}",
  "tariff_version": "${tariffPlans.find(t => t.code === record.tariffCode)?.version || 'v1.0'}",
  "period": "2026-06",
  "charges": {
    "base_subscription": "${record.baseFee}",
    "stations": ${record.actualStations},
    "inverters": ${record.inverters},
    "commands": ${record.commands},
    "premium_modules": "${record.modules}"
  },
  "sla": "${record.sla}",
  "discount": "${record.discount}",
  "invoice_total": "${record.finalFee}",
  "locked_after_approval": true
}</pre>
    </section>`;
  }

  function renderPayments(record: CommercialRecord): string {
    return `<section class="panel glass-card commercial-detail-panel" data-commercial-panel="payments">
      <div class="panel-head"><div><h2>Payment Handoff</h2><p>Payment Settings owns payment methods, terms, allocation and reconciliation after invoice generation.</p></div><button class="secondary-action" type="button" onclick="location.href='payment-settings.html'">Open Payment Settings</button></div>
      <div class="info-grid commercial-info-grid-v78">
        <div><span>Payment Status</span><strong>${record.paymentStatus}</strong><small>Invoice collection state</small></div>
        <div><span>Payment Terms</span><strong>${record.paymentTerms}</strong><small>Due rule and grace period</small></div>
        <div><span>Invoice Email</span><strong>${record.invoiceEmail}</strong><small>Billing contact</small></div>
        <div><span>Primary Bank</span><strong>${record.primaryBank}</strong><small>Default settlement account</small></div>
        <div><span>Allocation Priority</span><strong>Fees → Penalties → Oldest invoices</strong><small>Payment allocation rule</small></div>
        <div><span>Reconciliation</span><strong>Invoice number + customer + amount</strong><small>Exact / partial / probable matching</small></div>
      </div>
    </section>`;
  }

  function renderEnergySales(record: CommercialRecord): string {
    return `<section class="panel glass-card commercial-detail-panel" data-commercial-panel="energy-sales">
      <div class="panel-head"><div><h2>Energy Sales & Marketplace</h2><p>Commercial route for generated energy and future marketplace settlement.</p></div></div>
      <div class="info-grid commercial-info-grid-v78">
        <div><span>Seller</span><strong>${record.seller}</strong><small>Client selling energy</small></div>
        <div><span>Buyer / Offtaker</span><strong>${record.buyerName}</strong><small>${record.buyerType}</small></div>
        <div><span>Sales Channel</span><strong>${record.salesChannel}</strong><small>Grid, trader, PPA or aggregator</small></div>
        <div><span>Sale Price</span><strong>${record.salePrice}</strong><small>${record.saleCurrency}</small></div>
        <div><span>Marketplace Fees</span><strong>Transaction + Vendor + Promotion</strong><small>Available for equipment, EPC, services, spare parts</small></div>
        <div><span>Payout</span><strong>${record.settlementDestination}</strong><small>${record.settlementDate}</small></div>
      </div>
    </section>`;
  }

  function renderAudit(record: CommercialRecord): string {
    return `<section class="panel glass-card commercial-detail-panel" data-commercial-panel="audit">
      <div class="panel-head"><div><h2>Audit & Versioning</h2><p>Tariff edits, assignments, recalculations, approvals and manual overrides.</p></div><span class="badge success">Full trace</span></div>
      <div class="commercial-audit-v78">
        ${[
          ['Created', record.startDate, `Commercial billing profile opened for ${record.client}.`],
          ['Tariff assigned', record.plan, `${record.tariffCode} linked to customer assignment.`],
          ['Snapshot rule', 'Invoice approval', 'Old invoices keep tariff version, taxes, discounts and calculation trace.'],
          ['Modified', 'Latest change', record.audit]
        ].map(x => `<article class="commercial-audit-item-v78"><div class="commercial-audit-marker-v78"></div><div class="commercial-audit-content-v78"><div class="commercial-audit-top-v78"><strong>${x[0]}</strong><span>${x[1]}</span></div><p>${x[2]}</p></div></article>`).join('')}
      </div>
    </section>`;
  }

  function detail(record: CommercialRecord): string {
    return `<section class="page-hero commercial-detail-hero-v78"><div><p class="eyebrow">Global Admin · Commercial Model Detail</p><h1>${record.client}</h1><p class="muted">${record.tenant} · ${record.plan} · ${record.billingModel} · ${record.paymentStatus}</p></div><button class="secondary-action" type="button" data-back-commercial>Back to Commercial Models</button></section>
      <section class="setup-layout commercial-detail-layout-v78"><aside class="setup-rail commercial-detail-rail-v78" aria-label="Commercial detail navigation">
        <button class="active" type="button" data-commercial-tab="overview"><span>Overview</span></button>
        <button type="button" data-commercial-tab="tariff"><span>Tariff Assignment</span></button>
        <button type="button" data-commercial-tab="usage"><span>Usage & Charges</span></button>
        <button type="button" data-commercial-tab="snapshot"><span>Invoice Snapshot</span></button>
        <button type="button" data-commercial-tab="audit"><span>Audit</span></button>
      </aside><div class="setup-form commercial-detail-main-v78">${renderOverview(record)}${renderTariffAssignment(record)}${renderUsageCharges(record)}${renderInvoiceSnapshot(record)}${renderAudit(record)}</div></section>`;
  }

  function renderTariffPlans(): string {
    const body = tariffPlans.map(t => `<div class="data-row commercial-tariff-row-v120"><div><strong>${t.name}</strong><small>${t.code} · ${t.version}</small></div><div><strong>${t.currency}</strong><small>${t.billing} · ${t.customer}</small></div><div><strong>${t.base} / month</strong><small>${t.included} stations included · ${t.overage} overage</small></div><div><strong>${t.commands}</strong><small>${t.commandPrice} per overage command</small></div><div><strong>${t.modules}</strong><small>SLA ${t.sla} · Discount ${t.discount}</small></div><div class="row-actions kebabified"><span class="badge ${badge(t.status)}">${t.status}</span><button class="secondary-action compact-action" type="button" data-prototype-action="Tariff version history opened">History</button><button class="secondary-action compact-action" type="button" data-prototype-action="Tariff clone version opened">Clone</button></div></div>`);
    const deviceBody = devicePrices.map(d => `<div class="data-row"><div><strong>${d.type}</strong><small>${d.rule}</small></div><div><strong>${d.model}</strong></div><div><strong>${d.range}</strong></div><div><span class="badge info">${d.price}</span></div></div>`);
    const versionBody = tariffVersionAudit.map(v => `<div class="data-row"><div><strong>${v.version}</strong><small>${v.tariff}</small></div><div><span class="badge ${badge(v.status)}">${v.status}</span></div><div><strong>${v.author}</strong><small>${v.date}</small></div><div><span>${v.note}</span></div></div>`);
    const modelCards = ['Flat','Tiered','Graduated','Volume','Capacity-Based','Revenue-Based'].map((m, idx) => `<article><span>0${idx + 1}</span><strong>${m}</strong><small>${m === 'Flat' ? 'Fixed price per unit' : m === 'Tiered' ? 'Range-based device pricing' : m === 'Graduated' ? 'Each range calculated separately' : m === 'Volume' ? 'All units use reached tier' : m === 'Capacity-Based' ? 'Price by MW / capacity' : 'Percentage of revenue basis'}</small></article>`).join('');
    return `<div class="section-title-v17"><div><h2>Tariff Plans</h2><p class="muted">Constructor blocks: base parameters, stations, devices, telecontrol, premium modules, marketplace, API, storage and commercial rules.</p></div><button class="secondary-action" type="button" data-prototype-action="Tariff plan editor opened">Create Tariff</button></div>
      ${miniKpis([{label:'Active Tariffs', value:tariffPlans.filter(x => x.status === 'Active').length, note:'Archived instead of deleted'}, {label:'Device Models', value:'6', note:'Flat, Tiered, Graduated, Volume, Capacity, Revenue'}, {label:'Currencies', value:'EUR · USD · AMD', note:'Multi-currency ready'}, {label:'Versioning', value:'Required', note:'Invoices link to tariff version'}])}
      <section class="panel glass-card"><div class="panel-head"><div><h2>Tariff Plan Registry</h2><p>Core tariff records used by Rating Engine. Tariffs are versioned and archived instead of deleted.</p></div></div>${dataTable(['Plan','Billing','Station Fees','Commands','Modules / SLA','Status / Actions'], body, 'commercial-tariff-table-v120')}</section>
      <section class="panel glass-card commercial-spaced-v120"><div class="panel-head"><div><h2>Tariff Versioning</h2><p>Every invoice stores the tariff version; future edits cannot affect approved invoices.</p></div><button class="secondary-action" type="button" data-prototype-action="Tariff version history opened">View History</button></div>${dataTable(['Version','Status','Changed By','Snapshot Note'], versionBody, 'commercial-version-table-v131')}</section>
      <section class="panel glass-card commercial-spaced-v120"><div class="panel-head"><div><h2>Device Pricing Models</h2><p>All documented models are available; only one active model can be used per device type.</p></div></div><div class="commercial-model-cards-v130">${modelCards}</div></section>
      <section class="panel glass-card commercial-spaced-v120"><div class="panel-head"><div><h2>Dynamic Device Pricing Grid</h2><p>One active pricing model per device type; overlapping ranges must be rejected.</p></div><button class="secondary-action" type="button" data-prototype-action="Device price tier draft opened">Add Device Tier</button></div>${dataTable(['Device','Model','Range','Price'], deviceBody)}</section>`;
  }

  function calcSimulation(): CommercialSimulationResult {
    const stations = Number(document.getElementById('simStations')?.value || 3);
    const inverters = Number(document.getElementById('simInverters')?.value || 55);
    const commands = Number(document.getElementById('simCommands')?.value || 1200);
    const ai = document.getElementById('simAI')?.checked !== false;
    const operatorDiscount = Number(document.getElementById('simDiscount')?.value || 20) / 100;
    const base = 500;
    const station = Math.max(0, stations - 3) * 150;
    const inverter = Math.min(inverters, 50) * 12 + Math.max(0, Math.min(inverters, 200) - 50) * 10 + Math.max(0, inverters - 200) * 8;
    const command = Math.max(0, commands - 1000) * 0.05;
    const module = ai ? 200 : 0;
    const subtotal = base + station + inverter + command + module;
    const sla = subtotal * 0.10;
    const afterMarkup = subtotal + sla;
    const rawDiscount = afterMarkup * operatorDiscount;
    const maxDiscountPct = 0.40;
    const discountCap = afterMarkup * maxDiscountPct;
    const discount = Math.min(rawDiscount, discountCap);
    const capApplied = rawDiscount > discountCap;
    const taxable = afterMarkup - discount;
    const vat = taxable * 0.20;
    const total = taxable + vat;
    return { base, station, inverter, command, module, subtotal, sla, rawDiscount, discountCap, discount, capApplied, taxable, vat, total };
  }

  function renderSimulationResult(): void {
    const r = calcSimulation();
    const target = document.getElementById('commercialSimulationResult');
    if (!target) return;
    const lines: Array<[string, number, string]> = [
      ['01 · Base Subscription', r.base, 'fixed'], ['02 · Station Fees', r.station, 'usage'], ['03 · Device Fees', r.inverter, 'usage'], ['04 · Telecontrol Fees', r.command, 'usage'], ['05 · Premium Modules', r.module, 'feature'], ['06 · Subtotal', r.subtotal, 'subtotal'], ['07 · SLA Markup 10%', r.sla, 'markup'], ['08 · Discount Applied', -r.discount, r.capApplied ? 'capped' : 'discount'], ['09 · VAT 20%', r.vat, 'tax'], ['10 · Final Amount', r.total, 'total']
    ];
    target.innerHTML = `<div class="commercial-trace-stack-v130">${lines.map(x => `<div class="commercial-calc-line-v120 ${x[2] === 'total' ? 'total' : ''}"><span>${x[0]} <small>${x[2]}</small></span><strong>${x[1] < 0 ? '-' : ''}€${money(Math.abs(x[1]))}</strong></div>`).join('')}</div><div class="commercial-discount-cap-v130 ${r.capApplied ? 'warning' : 'success'}"><strong>Maximum Allowed Discount: 40%</strong><span>${r.capApplied ? `Raw discount €${money(r.rawDiscount)} was capped at €${money(r.discountCap)}.` : `Discount is within cap. Remaining discount capacity: €${money(r.discountCap - r.discount)}.`}</span></div>`;
  }

  function renderSimulator(): string {
    return `<div class="section-title-v17"><div><h2>Rating Simulator</h2><p class="muted">Prototype of Rating Engine flow: metering → rules → charges → SLA → discounts → tax → snapshot.</p></div><button class="secondary-action" type="button" data-run-simulation>Run Simulation</button></div>
      <section class="commercial-simulator-grid-v120"><div class="panel glass-card"><div class="panel-head"><div><h2>Simulation Input</h2><p>Change usage values and run the calculation.</p></div></div><div class="client-form-grid two-col commercial-create-grid-v78">
        <label>Stations<input id="simStations" type="number" value="3" min="0" /></label>
        <label>Inverters<input id="simInverters" type="number" value="55" min="0" /></label>
        <label>Telecontrol Commands<input id="simCommands" type="number" value="1200" min="0" /></label>
        <label>Operator Discount %<input id="simDiscount" type="number" value="20" min="0" max="60" /></label>
        <label class="commercial-check-v120"><input id="simAI" type="checkbox" checked /> <span>AI Forecasting module enabled</span></label>
        <label>SLA Level<select><option>Premium 24x7 · 10%</option><option>Business 12x6 · 15%</option><option>Mission Critical · 30%</option></select></label>
      </div></div><div class="panel glass-card"><div class="panel-head"><div><h2>Calculation Trace</h2><p>Stored later in invoice JSONB snapshot.</p></div><span class="badge success">VAT included</span></div><div id="commercialSimulationResult" class="commercial-calc-v120"></div><div class="commercial-snapshot-note-v130"><strong>Snapshot payload</strong><small>Trace stores tariff version, charges, markups, discounts, taxes, FX and rounding data.</small><button class="secondary-action compact-action" type="button" data-prototype-action="Calculation trace snapshot opened">Preview JSON</button></div></div></section>`;
  }

  function renderRules(): string {
    const body = billingRules.map(r => `<div class="data-row commercial-rule-row-v120"><div><strong>${r.step}</strong><small>Sequence locked</small></div><div><strong>${r.name}</strong><small>${r.type}</small></div><div><span>${r.rule}</span></div><button class="secondary-action compact-action" type="button" data-prototype-action="${r.name} rule opened">Open</button></div>`);
    return `<div class="section-title-v17"><div><h2>Billing Rules</h2><p class="muted">Calculation order is fixed and should not be changed by UI settings.</p></div><span class="badge success">Rule Engine</span></div>
      ${miniKpis([{label:'Rule Order', value:'Contract → Customer → Operator → Tariff → Defaults', note:'Conflict resolution'}, {label:'Device Conflict', value:'Flat + Tiered blocked', note:'One active model per device'}, {label:'Rounding', value:'EUR/USD 0.01 · AMD 1', note:'Final stage'}, {label:'Taxes', value:'Always last', note:'After markups and discounts'}])}
      <section class="panel glass-card commercial-spaced-v120"><div class="panel-head"><div><h2>Rule Resolution Order</h2><p>Conflict resolution order is fixed: higher priority overrides lower priority.</p></div><button class="secondary-action compact-action" type="button" data-prototype-action="Rule resolution order opened">Open</button></div><div class="commercial-priority-flow-v130"><article><span>Level 1</span><strong>Contract Override</strong><small>Individual agreement wins</small></article><article><span>Level 2</span><strong>Customer Override</strong><small>Customer-specific settings</small></article><article><span>Level 3</span><strong>Operator Override</strong><small>White-label partner rules</small></article><article><span>Level 4</span><strong>Tariff Plan</strong><small>Default tariff configuration</small></article><article><span>Level 5</span><strong>System Defaults</strong><small>Fallback values</small></article></div></section>
      <section class="panel glass-card">${dataTable(['Step','Rule','Logic','Action'], body, 'commercial-rule-table-v120')}</section>`;
  }

  function renderDiscounts(): string {
    const discounts = [
      ['Operator Discount','20%','Applied first after markups','Active'],
      ['Volume Discount','10%','Applied after operator discount','Active'],
      ['Contract Discount','5%','Customer contract override','Active'],
      ['Promo Discount','5%','Optional promotion rule','Review'],
      ['Maximum Allowed Discount','40%','Cap to protect margin','Required']
    ].map(x => `<div class="data-row"><div><strong>${x[0]}</strong><small>${x[2]}</small></div><div><strong>${x[1]}</strong></div><div><span class="badge ${badge(x[3])}">${x[3]}</span></div><button class="secondary-action compact-action" type="button" data-prototype-action="${x[0]} opened">Edit</button></div>`);
    const markups = [
      ['Emergency Support','5%','Level 1'], ['Premium SLA','10%','Level 2'], ['Custom Services','By package','Level 3'], ['Regional Adjustment','By country','Level 4']
    ].map(x => `<div class="data-row"><div><strong>${x[0]}</strong><small>${x[2]}</small></div><div><strong>${x[1]}</strong></div><span class="badge info">Summed</span></div>`);
    return `<div class="section-title-v17"><div><h2>Discounts & Markups</h2><p class="muted">Sequential discounts, summed markups and maximum discount protection.</p></div><button class="secondary-action" type="button" data-prototype-action="Commercial rule draft opened">Add Rule</button></div>
      <section class="commercial-simulator-grid-v120"><div class="panel glass-card"><div class="panel-head"><div><h2>Discount Application Order</h2><p>Discounts are applied sequentially, not summed.</p></div><span class="badge warning">Max cap 40%</span></div>${dataTable(['Discount','Value','Status','Action'], discounts)}<div class="commercial-discount-policy-v130"><strong>Maximum Allowed Discount</strong><span>Operator + Volume + Contract + Promo + Manual cannot exceed 40%. If the sequence produces more, the engine caps it and writes audit log.</span><button class="secondary-action compact-action" type="button" data-prototype-action="Maximum discount policy opened">Edit Cap</button></div></div><div class="panel glass-card"><div class="panel-head"><div><h2>Markup Application Order</h2><p>Markups are summed before discounts and taxes.</p></div></div>${dataTable(['Markup','Value','Rule'], markups)}</div></section>`;
  }

  function renderAssignments(): string {
    const body = assignments.map(a => `<div class="data-row commercial-assignment-row-v120"><div><strong>${a.client}</strong><small>${a.code}</small></div><div><strong>${a.tariff}</strong><small>${a.start} → ${a.end}</small></div><div><span>${a.modules}</span></div><span class="badge ${badge(a.status)}">${a.status}</span><button class="secondary-action compact-action" type="button" data-prototype-action="Customer billing profile opened">Open Profile</button></div>`);
    return `<div class="section-title-v17"><div><h2>Customer Assignments</h2><p class="muted">Active tariff, customer overrides, enabled modules, usage scope and invoice history entry point.</p></div><button class="secondary-action" type="button" data-prototype-action="Customer tariff assignment draft opened">Assign Customer</button></div>
      ${miniKpis([{label:'Assignments', value:assignments.length, note:'Customer tariff links'}, {label:'Override Support', value:'Contract + Customer', note:'Enterprise-specific pricing'}, {label:'Module Validation', value:'Required', note:'Cannot enable module not allowed by tariff'}, {label:'Inactive Tariffs', value:'Blocked', note:'Cannot assign archived tariff'}])}
      <section class="panel glass-card">${dataTable(['Customer','Tariff Period','Enabled Modules','Status','Action'], body, 'commercial-assignment-table-v120')}</section>`;
  }

  function renderGovernanceModels(): string {
    return `<div class="section-title-v17"><div><h2>Commercial Models Registry</h2><p class="muted">Customer billing profiles connected to tariff plans, usage charges, invoices, payment handoff and audit.</p></div><span class="badge success">Billing-ready</span></div>
      ${miniKpis([{label:'Commercial Records', value:records.length, note:'Customer profiles'}, {label:'Tariff Plans', value:tariffPlans.length, note:'Versioned, archive-only'}, {label:'Invoice Snapshot', value:'Required', note:'Calculation trace JSONB'}, {label:'Payment Handoff', value:'Separated', note:'Payment Settings owns collection'}])}
      <div class="commercial-governance-flow-v99"><article><span>01</span><strong>Tariff Plan</strong><small>Base, station, device, commands, modules</small></article><article><span>02</span><strong>Metering</strong><small>Stations, devices, API, storage, marketplace</small></article><article><span>03</span><strong>Rating Engine</strong><small>Rules, markups, discounts, taxes</small></article><article><span>04</span><strong>Invoice</strong><small>Charges, approval, snapshot</small></article><article><span>05</span><strong>Payment</strong><small>Allocation, reconciliation, ERP sync</small></article></div>
      <section class="panel glass-card commercial-registry-panel-v78"><div class="panel-head"><div><h2>Commercial Billing Profiles</h2><p>Open a row to inspect tariff assignment, usage charges, invoice snapshot and payment handoff.</p></div><div class="toolbar commercial-toolbar-v78"><input id="commercialSearch" placeholder="Search client, tenant, tariff, contract..." /><select id="commercialPlan"><option>All plans</option><option>Industrial Operator Plus</option><option>Professional Solar</option><option>Enterprise Override</option></select><select id="commercialStatus"><option>All statuses</option><option>Active</option><option>Review</option><option>Expired</option></select></div></div><div class="data-table commercial-registry-table-v78"><div class="data-head commercial-registry-row"><span>Client / Tenant</span><span>Tariff</span><span>Contract</span><span>Payments</span><span>Invoice Total</span><span>Actions</span></div><div id="commercialRows">${rows()}</div></div></section>`;
  }

  function renderAuditVersions(): string {
    const auditRows = records.map(item => `<article class="commercial-audit-item-v78"><div class="commercial-audit-marker-v78"></div><div class="commercial-audit-content-v78"><div class="commercial-audit-top-v78"><strong>${item.client}</strong><span>${item.id}</span></div><p>${item.audit}</p><small>${item.tariffCode} · ${item.snapshot}</small></div></article>`).join('');
    return `<div class="section-title-v17"><div><h2>Audit & Versions</h2><p class="muted">Tariff changes, customer assignments, recalculations, invoice approvals and payment handoff logs.</p></div></div><section class="panel glass-card"><div class="commercial-audit-v78">${auditRows}</div></section>`;
  }

  function renderGovernanceContent(tab: string = 'models'): string {
    if (tab === 'tariffs') return renderTariffPlans();
    if (tab === 'simulator') return renderSimulator();
    if (tab === 'rules') return renderRules();
    if (tab === 'discounts') return renderDiscounts();
    if (tab === 'assignments') return renderAssignments();
    if (tab === 'audit') return renderAuditVersions();
    return renderGovernanceModels();
  }

  function registry(): string {
    return `<section class="page-hero commercial-hero-v78"><div><p class="eyebrow">Global Admin · Financial Operations</p><h1>Commercial Models</h1><p class="muted">Tariff constructor, Rating Engine simulation, billing rules, discounts, assignments and invoice snapshot governance.</p></div><button class="primary-action" type="button" id="openCommercialCreate">Create Commercial Model</button></section>
      <section class="plant-workspace-v17 commercial-governance-workspace-v99"><aside class="glass-card plant-side-card-v17 commercial-governance-side-v99"><h3>Commercial Models</h3><button class="active" type="button" data-commercial-governance-tab="models">Customer Profiles</button><button type="button" data-commercial-governance-tab="tariffs">Tariff Plans</button><button type="button" data-commercial-governance-tab="simulator">Rating Simulator</button><button type="button" data-commercial-governance-tab="rules">Billing Rules</button><button type="button" data-commercial-governance-tab="discounts">Discounts & Markups</button><button type="button" data-commercial-governance-tab="assignments">Customer Assignments</button><button type="button" data-commercial-governance-tab="audit">Audit & Versions</button></aside><section class="glass-card plant-main-card-v17 commercial-governance-main-v99" id="commercialGovernanceContent">${renderGovernanceContent('models')}</section></section>`;
  }

  function createModal(): void {
    document.getElementById('commercialCreateModal')?.remove();
    const tenants = Object.keys(tenantCatalog); const firstTenant = tenants[0] || 'Tenant Alpha Energy'; const firstClient = tenantCatalog[firstTenant]?.[0]?.client || 'Arpi Solar Group'; const firstPlants = tenantCatalog[firstTenant]?.[0]?.plants || 'Plant A';
    document.body.insertAdjacentHTML('beforeend', `<div class="modal commercial-create-modal-v78 open" id="commercialCreateModal" aria-hidden="false"><div class="modal-card wide-modal commercial-create-card-v78"><div class="modal-head"><div><h2>Create Commercial Model</h2><p>Wizard follows the documentation: scope → tariff → usage → rules → modules → payment handoff → review.</p></div><button class="modal-close" type="button" data-close-commercial-create>×</button></div><section class="setup-layout commercial-create-wizard-v87"><aside class="setup-rail commercial-create-steps-v87" aria-label="Commercial setup steps">${['scope:Client Scope','tariff:Tariff Plan','usage:Usage Charges','rules:Billing Rules','modules:Modules & SLA','payment:Payment Handoff','review:Review'].map((x,i)=>{const [k,t]=x.split(':');return `<button class="${i===0?'active':''}" type="button" data-commercial-create-step="${k}"><b>${i+1}</b><span>${t}</span></button>`}).join('')}</aside><div class="setup-form commercial-create-form-v87">
      <div class="commercial-create-panel-v87 active" data-commercial-create-panel="scope"><div class="section-heading"><span>Step 1</span><h3>Client & Plant Scope</h3><p>Select tenant, customer and plant scope for billing.</p></div><div class="client-form-grid two-col commercial-create-grid-v78"><label>Tenant<select id="commercialCreateTenant">${tenants.map(t=>`<option>${t}</option>`).join('')}</select></label><label>Client<select id="commercialCreateClient">${(tenantCatalog[firstTenant]||[]).map(x=>`<option>${x.client}</option>`).join('')}</select></label><label class="wide-field">Assigned Plants<select id="commercialCreatePlants"><option>${firstPlants}</option></select></label><label>Customer Type<select><option>operator</option><option>end_customer</option><option>vendor</option></select></label></div></div>
      <div class="commercial-create-panel-v87" data-commercial-create-panel="tariff"><div class="section-heading"><span>Step 2</span><h3>Tariff Plan</h3><p>Configure base parameters used by API, billing and integration.</p></div><div class="client-form-grid two-col commercial-create-grid-v78"><label>Tariff Code<input placeholder="industrial_operator_plus" /></label><label>Public Name<input placeholder="Industrial Operator Plus" /></label><label>Currency<select><option>EUR</option><option>USD</option><option>AMD</option></select></label><label>Billing Type<select><option>postpaid</option><option>prepaid</option></select></label><label>Base Monthly Fee<input type="number" placeholder="500" /></label><label>Invoice Cycle<select><option>Monthly</option><option>Quarterly</option><option>Annual</option><option>Custom</option></select></label></div></div>
      <div class="commercial-create-panel-v87" data-commercial-create-panel="usage"><div class="section-heading"><span>Step 3</span><h3>Usage Charges</h3><p>Stations, devices, telecontrol, marketplace, API and data storage.</p></div><div class="client-form-grid two-col commercial-create-grid-v78"><label>Included Stations<input type="number" placeholder="3" /></label><label>Station Overage Price<input type="number" placeholder="150" /></label><label>Device Pricing Model<select><option>Graduated</option><option>Flat</option><option>Tiered</option><option>Volume</option><option>Capacity-Based</option><option>Revenue-Based</option></select></label><label>Included Commands<input type="number" placeholder="1000" /></label><label>Overage Command Price<input placeholder="0.05" /></label><label>Storage Overage<select><option>25 EUR / TB</option><option>0.02 EUR / 1000 records</option><option>Custom</option></select></label></div></div>
      <div class="commercial-create-panel-v87" data-commercial-create-panel="rules"><div class="section-heading"><span>Step 4</span><h3>Billing Rules</h3><p>Fixed order: fixed charges, usage, marketplace, modules, markups, discounts, taxes, rounding.</p></div><div class="check-list commercial-validation-v86"><label class="check-row success"><span class="check-indicator success">✓</span><div><strong>Rule priority</strong><small>Contract → Customer → Operator → Tariff → Defaults.</small></div><span class="check-status success">Locked</span></label><label class="check-row success"><span class="check-indicator success">✓</span><div><strong>Device conflict validation</strong><small>Flat + Tiered for one device type is rejected.</small></div><span class="check-status success">Required</span></label><label class="check-row warning"><span class="check-indicator warning">•</span><div><strong>Maximum discount</strong><small>Cap total discount to protect margin.</small></div><span class="check-status warning">Set value</span></label></div></div>
      <div class="commercial-create-panel-v87" data-commercial-create-panel="modules"><div class="section-heading"><span>Step 5</span><h3>Premium Modules & SLA</h3><p>Only modules allowed by tariff can be enabled for customer.</p></div><div class="client-form-grid two-col commercial-create-grid-v78"><label>SLA Level<select><option>8x5 Standard</option><option>12x6 Business</option><option>24/7 Premium</option><option>Mission Critical</option></select></label><label>SLA Markup %<input placeholder="10" /></label><label class="commercial-check-v120"><input type="checkbox" checked /> <span>AI Forecasting</span></label><label class="commercial-check-v120"><input type="checkbox" /> <span>Energy Trading</span></label><label class="commercial-check-v120"><input type="checkbox" /> <span>ERP Connector</span></label><label class="commercial-check-v120"><input type="checkbox" /> <span>ESG Reporting</span></label></div></div>
      <div class="commercial-create-panel-v87" data-commercial-create-panel="payment"><div class="section-heading"><span>Step 6</span><h3>Payment Handoff</h3><p>Commercial Models prepare payment terms; Payment Settings owns gateways, bank accounts, reconciliation and refunds.</p></div><div class="client-form-grid two-col commercial-create-grid-v78"><label>Payment Term<select><option>Net 7</option><option>Net 15</option><option>Net 30</option><option>Prepaid</option></select></label><label>Preferred Invoice Format<select><option>PDF</option><option>Excel</option><option>XML</option><option>EDI</option><option>Peppol</option></select></label><label>Billing Email<input placeholder="billing@example.com" /></label><label>Credit Limit<input placeholder="10000" /></label></div></div>
      <div class="commercial-create-panel-v87" data-commercial-create-panel="review"><div class="section-heading"><span>Step 7</span><h3>Review & Create</h3><p>Minimum validation before creating commercial billing profile.</p></div><div class="check-list commercial-validation-v86"><label class="check-row success"><span class="check-indicator success">✓</span><div><strong>Tariff versioning</strong><small>Future edits will not affect approved invoices.</small></div><span class="check-status success">Ready</span></label><label class="check-row success"><span class="check-indicator success">✓</span><div><strong>Snapshot requirement</strong><small>Invoice stores calculation trace, rates, taxes and discounts.</small></div><span class="check-status success">Ready</span></label><label class="check-row warning"><span class="check-indicator warning">•</span><div><strong>Payment setup</strong><small>Gateway and bank account should be finished in Payment Settings.</small></div><span class="check-status warning">Next module</span></label></div></div>
    </div></section><div class="modal-actions commercial-create-actions-v87"><button class="secondary-action" type="button" data-close-commercial-create>Cancel</button><div class="commercial-create-nav-v87"><button class="secondary-action" type="button" data-commercial-create-prev disabled>Back</button><button class="primary-action" type="button" data-commercial-create-next>Next</button><button class="primary-action hidden" type="button" data-save-commercial-create>Create Commercial Model</button></div></div></div></div>`);
  }

  const stepOrder = (): string[] => ['scope','tariff','usage','rules','modules','payment','review'];
  function showCreateStep(step: string): void {
    const order = stepOrder();
    const idx = Math.max(0, order.indexOf(step));
    const currentStep = order[idx] || order[0] || 'scope';
    document.querySelectorAll<HTMLElement>('[data-commercial-create-step]').forEach(btn => btn.classList.toggle('active', btn.dataset.commercialCreateStep === currentStep));
    document.querySelectorAll<HTMLElement>('[data-commercial-create-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.commercialCreatePanel === currentStep));
    const prev = document.querySelector<HTMLButtonElement>('[data-commercial-create-prev]');
    const next = document.querySelector<HTMLButtonElement>('[data-commercial-create-next]');
    const save = document.querySelector<HTMLButtonElement>('[data-save-commercial-create]');
    if (prev) prev.disabled = idx === 0;
    if (next) next.classList.toggle('hidden', idx === order.length - 1);
    if (save) save.classList.toggle('hidden', idx !== order.length - 1);
  }
  function moveCreateStep(delta: number): void {
    const order = stepOrder();
    const active = document.querySelector<HTMLElement>('[data-commercial-create-step].active')?.dataset.commercialCreateStep || order[0] || 'scope';
    const nextIndex = Math.min(order.length - 1, Math.max(0, order.indexOf(active) + delta));
    showCreateStep(order[nextIndex] || order[0] || 'scope');
  }
  function closeModal(): void { document.getElementById('commercialCreateModal')?.remove(); }
  function updateCommercialCreateClientOptions(): void {
    const tenant = document.getElementById('commercialCreateTenant')?.value || '';
    const clients: CommercialTenantClientPlant[] = tenantCatalog[tenant] || [];
    const clientSelect = document.getElementById('commercialCreateClient');
    if (clientSelect) clientSelect.innerHTML = clients.map((item: CommercialTenantClientPlant) => `<option>${item.client}</option>`).join('') || '<option>No clients</option>';
    updateCommercialCreatePlantOptions();
  }
  function updateCommercialCreatePlantOptions(): void {
    const tenant = document.getElementById('commercialCreateTenant')?.value || '';
    const client = document.getElementById('commercialCreateClient')?.value || '';
    const selected = (tenantCatalog[tenant] || []).find((item: CommercialTenantClientPlant) => item.client === client);
    const plantSelect = document.getElementById('commercialCreatePlants');
    if (plantSelect) plantSelect.innerHTML = `<option>${selected?.plants || 'No assigned plants'}</option>`;
  }

  function filterRows(): void { const q = (document.getElementById('commercialSearch')?.value || '').toLowerCase().trim(); const plan = document.getElementById('commercialPlan')?.value || 'All plans'; const status = document.getElementById('commercialStatus')?.value || 'All statuses'; const filtered = records.filter(item => { const hay = `${item.client} ${item.tenant} ${item.plan} ${item.billingModel} ${item.contractStatus} ${item.contractNumber} ${item.sla} ${item.paymentStatus} ${item.buyerName} ${item.tariffCode}`.toLowerCase(); return (!q || hay.includes(q)) && (plan === 'All plans' || item.plan === plan) && (status === 'All statuses' || item.contractStatus === status); }); const target = document.getElementById('commercialRows'); if (target) target.innerHTML = filtered.length ? rows(filtered) : '<div class="empty-state">No commercial records match this filter.</div>'; }
  function openDetail(id: string): void { activeId = id || activeId; const root = document.getElementById('commercialRoot'); if (root) root.innerHTML = detail(byId(activeId)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function showTab(tab: string): void { document.querySelectorAll('[data-commercial-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.commercialTab === tab)); document.querySelectorAll('[data-commercial-panel]').forEach(panel => panel.classList.toggle('active', panel.dataset.commercialPanel === tab)); }


  function rerenderGovernance(tab: string = activeGovernanceTab): void {
    activeGovernanceTab = tab;
    const target = document.getElementById('commercialGovernanceContent');
    if (!target) return;
    target.innerHTML = renderGovernanceContent(tab);
    if (tab === 'simulator') renderSimulationResult();
  }

  function closeCommercialActionModal(): void { document.querySelector('[data-commercial-action-modal]')?.remove(); }

  function openCommercialActionModal(title: string, description: string, fields: string, onSave?: CommercialModalSaveHandler): void {
    closeCommercialActionModal();
    const html = `<div class="commercial-modal-backdrop" data-commercial-action-modal>
      <div class="commercial-modal" role="dialog" aria-modal="true">
        <div class="commercial-modal-head"><div><h2>${title}</h2><p>${description}</p></div><button class="modal-close-btn" type="button" data-close-commercial-action>×</button></div>
        <div class="commercial-modal-body"><div class="client-form-grid two-col commercial-create-grid-v78">${fields}</div></div>
        <div class="commercial-modal-footer"><button class="secondary-action" type="button" data-close-commercial-action>Cancel</button><button class="primary-action" type="button" data-save-commercial-action>Save</button></div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    const save = document.querySelector('[data-save-commercial-action]');
    if (save) save.onclick = () => { onSave?.(); closeCommercialActionModal(); };
  }

  function fieldValue(name: string, fallback = ''): string {
    return document.querySelector(`[data-action-field="${name}"]`)?.value || fallback;
  }

  function openPrototypeAction(action: unknown): void {
    const text = String(action || 'Action opened');
    if (text.includes('Device price tier')) {
      openCommercialActionModal('Add Device Tier', 'Adds a documented equipment pricing tier: device type, one pricing model, range and unit price.',
        `<label>Device Type<select data-action-field="type"><option>Inverter</option><option>BESS Controller</option><option>Smart Meter</option><option>Tracker / SSU</option><option>Weather Station</option><option>Gateway / Data Logger</option><option>SCADA Endpoint</option></select></label>
         <label>Pricing Model<select data-action-field="model"><option>Flat</option><option>Tiered</option><option>Graduated</option><option>Volume</option><option>Capacity-Based</option><option>Revenue-Based</option></select></label>
         <label>Range From<input data-action-field="from" type="number" min="1" value="1" /></label>
         <label>Range To<input data-action-field="to" placeholder="50 or empty for open range" /></label>
         <label>Monthly Price per Unit<input data-action-field="price" type="number" min="0" step="0.01" value="12" /></label>
         <label>Currency<select data-action-field="currency"><option>EUR</option><option>USD</option><option>AMD</option></select></label>`,
        () => {
          const from = fieldValue('from','1'); const to = fieldValue('to','');
          devicePrices.push({ type:fieldValue('type','Inverter'), model:fieldValue('model','Flat'), range: to ? `${from}–${to}` : `${from}+`, price:`${fieldValue('price','0')} ${fieldValue('currency','EUR')}`, rule:'Draft tier' });
          rerenderGovernance('tariffs'); toast('Device pricing tier added');
        });
      return;
    }
    if (text.includes('Tariff plan editor')) {
      openCommercialActionModal('Create Tariff Plan', 'Creates a tariff plan using the documented constructor blocks: base parameters, station limits, telecontrol limits, SLA and allowed modules.',
        `<label>Code<input data-action-field="code" value="new_tariff_plan" /></label>
         <label>Public Name<input data-action-field="name" value="New Tariff Plan" /></label>
         <label>Currency<select data-action-field="currency"><option>EUR</option><option>USD</option><option>AMD</option></select></label>
         <label>Billing Type<select data-action-field="billing"><option>Postpaid</option><option>Prepaid</option><option>Prepaid + Overage</option></select></label>
         <label>Customer Type<select data-action-field="customer"><option>End Customer</option><option>Operator</option><option>Vendor</option></select></label>
         <label>Base Monthly Fee<input data-action-field="base" type="number" min="0" value="500" /></label>
         <label>Included Stations<input data-action-field="included" type="number" min="0" value="3" /></label>
         <label>Overage Station Price<input data-action-field="overage" type="number" min="0" value="150" /></label>`,
        () => {
          tariffPlans.push({ code:fieldValue('code','new_tariff_plan'), name:fieldValue('name','New Tariff Plan'), currency:fieldValue('currency','EUR'), billing:fieldValue('billing','Postpaid'), customer:fieldValue('customer','End Customer'), status:'Draft', base:fieldValue('base','0'), included:fieldValue('included','0'), overage:fieldValue('overage','0'), commands:'1000', commandPrice:'0.05', sla:'0%', discount:'0%', modules:'None', version:'v0.1' });
          rerenderGovernance('tariffs'); toast('Tariff plan draft created');
        });
      return;
    }
    if (text.includes('Commercial rule draft')) {
      openCommercialActionModal('Add Commercial Rule', 'Adds a documented discount or markup rule. Discounts are sequential; markups are summed before taxes.',
        `<label>Rule Type<select data-action-field="type"><option>Operator Discount</option><option>Volume Discount</option><option>Contract Discount</option><option>Promo Discount</option><option>Manual Discount</option><option>Premium SLA</option><option>Emergency Support</option></select></label>
         <label>Value %<input data-action-field="value" type="number" min="0" max="100" value="5" /></label>
         <label class="wide-field">Rule Note<input data-action-field="note" value="Applied according to billing rule priority" /></label>`,
        () => { toast(`${fieldValue('type','Commercial rule')} saved at ${fieldValue('value','0')}%`); rerenderGovernance('discounts'); });
      return;
    }
    if (text.includes('Assign tariff') || text.includes('Customer tariff assignment')) {
      openCommercialActionModal('Assign Customer Tariff', 'Assigns an active tariff to a customer billing profile. Inactive tariffs are blocked by validation.',
        `<label>Customer<select data-action-field="client">${records.map(r => `<option>${r.client}</option>`).join('')}</select></label>
         <label>Tariff Plan<select data-action-field="tariff">${tariffPlans.map(t => `<option>${t.name}</option>`).join('')}</select></label>
         <label>Start Date<input data-action-field="start" type="date" /></label>
         <label>End Date<input data-action-field="end" type="date" /></label>
         <label>Custom Discount %<input data-action-field="discount" type="number" min="0" max="60" value="0" /></label>
         <label>Status<select data-action-field="status"><option>Active</option><option>Review</option></select></label>`,
        () => { assignments.push({ client:fieldValue('client'), tariff:fieldValue('tariff'), code:'assignment_draft', start:fieldValue('start','Start'), end:fieldValue('end','Open'), status:fieldValue('status','Review'), modules:'Validated by tariff' }); rerenderGovernance('assignments'); toast('Customer tariff assignment added'); });
      return;
    }
    if (text.includes('Tariff version history')) {
      openCommercialActionModal('Tariff Version History', 'Review retained tariff versions. Approved invoices keep the version that was used during calculation.',
        `${tariffVersionAudit.map(v => `<div class="commercial-version-modal-row-v130 wide-field"><strong>${v.version} · ${v.tariff}</strong><span>${v.status} · ${v.author} · ${v.date}</span><small>${v.note}</small></div>`).join('')}`,
        () => toast('Tariff version history reviewed'));
      return;
    }
    if (text.includes('Tariff clone version')) {
      openCommercialActionModal('Clone Tariff Version', 'Creates a new draft version without changing previous approved invoice snapshots.',
        `<label>Source Version<select data-action-field="source">${tariffPlans.map(t => `<option>${t.name} ${t.version}</option>`).join('')}</select></label><label>New Version<input data-action-field="version" value="v1.5" /></label><label class="wide-field">Change Note<input data-action-field="note" value="Draft cloned for commercial review" /></label>`,
        () => { tariffVersionAudit.unshift({ version:fieldValue('version','v1.5'), tariff:fieldValue('source','Tariff').replace(/ v[0-9.]+$/, ''), status:'Draft', author:'Global Admin', date:'Today', note:fieldValue('note','Draft cloned') }); rerenderGovernance('tariffs'); toast('Tariff version cloned as draft'); });
      return;
    }
    if (text.includes('Calculation trace snapshot')) {
      const r = calcSimulation();
      openCommercialActionModal('Calculation Trace Snapshot', 'JSONB-style preview stored on invoice approval.',
        `<pre class="commercial-json-v120 wide-field">{
  "tariff_version": "v1.4",
  "base_subscription": ${r.base},
  "device_fees": ${r.inverter},
  "telecontrol_fees": ${r.command},
  "premium_modules": ${r.module},
  "markup_sla": ${r.sla},
  "discount_applied": ${r.discount},
  "maximum_discount_cap": ${r.discountCap},
  "tax_vat": ${r.vat},
  "final_amount": ${r.total}
}</pre>`,
        () => toast('Calculation trace snapshot previewed'));
      return;
    }
    if (text.includes('Maximum discount policy')) {
      openCommercialActionModal('Maximum Discount Policy', 'Protects margin by capping total sequential discounts.',
        `<label>Maximum Allowed Discount %<input data-action-field="cap" type="number" min="0" max="100" value="40" /></label><label class="wide-field">Audit Behavior<select data-action-field="audit"><option>Cap and write audit log</option><option>Block invoice approval</option><option>Require manual approval</option></select></label>`,
        () => toast(`Maximum discount cap set to ${fieldValue('cap','40')}%`));
      return;
    }
    if (text.includes('Rule resolution order') || text.includes('Rule Resolution Order')) {
      openCommercialActionModal('Rule Resolution Order', 'Fixed override hierarchy used by Rule Engine.',
        `<div class="commercial-priority-flow-v130 wide-field"><article><span>Level 1</span><strong>Contract Override</strong><small>Wins over all lower rules</small></article><article><span>Level 2</span><strong>Customer Override</strong><small>Specific customer rules</small></article><article><span>Level 3</span><strong>Operator Override</strong><small>White-label partner rules</small></article><article><span>Level 4</span><strong>Tariff Plan</strong><small>Plan defaults</small></article><article><span>Level 5</span><strong>System Defaults</strong><small>Fallback</small></article></div>`,
        () => toast('Rule resolution order reviewed'));
      return;
    }
    if (text.includes('opened') || text.includes('rule')) {
      openCommercialActionModal(text.replace(' opened',''), 'Review and update the documented configuration. The prototype keeps the audit action visible and prevents silent changes.',
        `<label class="wide-field">Configuration Name<input data-action-field="name" value="${text.replace(/ opened/g,'')}" /></label>
         <label>Status<select data-action-field="status"><option>Active</option><option>Review</option><option>Draft</option><option>Archived</option></select></label>
         <label class="wide-field">Audit Note<input data-action-field="note" value="Changed through Global Admin prototype" /></label>`,
        () => toast(`${fieldValue('name','Configuration')} saved`));
      return;
    }
    toast(text);
  }

  function wire(): void {
    document.addEventListener('click', e => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const proto = target.closest<HTMLElement>('[data-prototype-action]');
      if (proto) { openPrototypeAction(proto.dataset.prototypeAction || ''); return; }
      if (target.closest('[data-close-commercial-action]')) { closeCommercialActionModal(); return; }
      if (target.closest('#openCommercialCreate')) { createModal(); return; }
      if (target.closest('[data-close-commercial-create]')) { closeModal(); return; }
      if (target.closest('[data-save-commercial-create]')) { toast('Commercial model saved in prototype'); closeModal(); return; }
      const governanceTab = target.closest<HTMLElement>('[data-commercial-governance-tab]');
      if (governanceTab) {
        const tabName = governanceTab.dataset.commercialGovernanceTab || 'models';
        activeGovernanceTab = tabName;
        document.querySelectorAll<HTMLElement>('[data-commercial-governance-tab]').forEach(btn => btn.classList.toggle('active', btn === governanceTab));
        rerenderGovernance(tabName);
        return;
      }
      const createStep = target.closest<HTMLElement>('[data-commercial-create-step]');
      if (createStep) { showCreateStep(createStep.dataset.commercialCreateStep || 'scope'); return; }
      if (target.closest('[data-commercial-create-next]')) { moveCreateStep(1); return; }
      if (target.closest('[data-commercial-create-prev]')) { moveCreateStep(-1); return; }
      if (target.closest('[data-run-simulation]')) { renderSimulationResult(); toast('Rating simulation recalculated'); return; }
      const openBtn = target.closest<HTMLElement>('[data-action="open-commercial"]');
      if (openBtn?.dataset.id) { openDetail(openBtn.dataset.id); return; }
      const row = target.closest<HTMLElement>('.commercial-registry-row[data-commercial-id]');
      if (row?.dataset.commercialId && !target.closest('.row-actions')) { openDetail(row.dataset.commercialId); return; }
      const tab = target.closest<HTMLElement>('[data-commercial-tab]');
      if (tab) { showTab(tab.dataset.commercialTab || 'overview'); return; }
      if (target.closest('[data-back-commercial]')) { const root = document.getElementById('commercialRoot'); if (root) root.innerHTML = registry(); return; }
    });
    document.addEventListener('input', e => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.id === 'commercialSearch') filterRows();
      if (['simStations','simInverters','simCommands','simDiscount'].includes(target.id)) renderSimulationResult();
    });
    document.addEventListener('change', e => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.id === 'commercialPlan' || target.id === 'commercialStatus') filterRows();
      if (target.id === 'commercialCreateTenant') updateCommercialCreateClientOptions();
      if (target.id === 'commercialCreateClient') updateCommercialCreatePlantOptions();
      if (target.id === 'simAI') renderSimulationResult();
    });
  }

  function render(): void { FleetLayout.mount(`<div id="commercialRoot">${registry()}</div>`); wire(); }
  return { render };
})();
