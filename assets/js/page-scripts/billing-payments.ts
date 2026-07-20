window.BillingConfiguration = (() => {
      const storageKey = 'zentrid.billing.configuration.v3';
      const seed = {
        activeTab: 'overview',
        selectedInvoiceId: 'INV-2026-0041',
        billingCycles: [
          { id: 'CYC-2026-06', name: 'June 2026 Monthly Billing', period: '01 Jun 2026 — 30 Jun 2026', status: 'Running', customers: 42, invoices: 38, revenue: 284650, currency: 'EUR', progress: 74 },
          { id: 'CYC-2026-05', name: 'May 2026 Monthly Billing', period: '01 May 2026 — 31 May 2026', status: 'Closed', customers: 40, invoices: 40, revenue: 312880, currency: 'EUR', progress: 100 },
          { id: 'CYC-Q2-2026', name: 'Q2 Enterprise Billing', period: '01 Apr 2026 — 30 Jun 2026', status: 'Draft', customers: 8, invoices: 0, revenue: 0, currency: 'EUR', progress: 12 }
        ],
        usageRecords: [
          { id: 'USG-1001', client: 'Arpi Solar Group', category: 'Stations', metric: 'Active plants', quantity: 4, unit: 'plant-month', source: 'Asset Registry', status: 'Confirmed' },
          { id: 'USG-1002', client: 'Arpi Solar Group', category: 'Devices', metric: 'Inverters', quantity: 55, unit: 'device-month', source: 'Device Registry', status: 'Confirmed' },
          { id: 'USG-1003', client: 'Arpi Solar Group', category: 'Telecontrol', metric: 'Successful commands', quantity: 1200, unit: 'command', source: 'Command Center', status: 'Confirmed' },
          { id: 'USG-1004', client: 'Green Valley Estate', category: 'API', metric: 'API calls', quantity: 50000, unit: 'call', source: 'API Gateway', status: 'Review' },
          { id: 'USG-1005', client: 'Solar Market Vendor', category: 'Marketplace', metric: 'Vendor transactions', quantity: 10000, unit: 'EUR', source: 'Marketplace', status: 'Confirmed' }
        ],
        invoices: [
          {
            id: 'INV-2026-0041', client: 'Arpi Solar Group', tenant: 'Tenant Alpha Energy', tariff: 'Industrial Operator Plus', period: 'Jun 2026', currency: 'EUR', status: 'Draft', due: 'Net 15', subtotal: 1330, markups: 133, discounts: 292.6, taxes: 234.08, total: 1404.48,
            charges: [
              { type: 'Base Subscription', basis: 'Monthly fee', amount: 500 },
              { type: 'Device Fees', basis: '55 inverters · graduated tier', amount: 620 },
              { type: 'Telecontrol Overage', basis: '200 commands × 0.05', amount: 10 },
              { type: 'Premium Module', basis: 'AI Forecasting', amount: 200 }
            ],
            trace: [
              { step: 'Fixed Charges', amount: 500, note: 'Base monthly subscription' },
              { step: 'Usage Charges', amount: 630, note: 'Devices + telecontrol overage' },
              { step: 'Premium Modules', amount: 200, note: 'AI Forecasting enabled' },
              { step: 'SLA Markup', amount: 133, note: '10% Premium SLA' },
              { step: 'Operator Discount', amount: -292.6, note: '20% operator discount' },
              { step: 'VAT', amount: 234.08, note: '20% VAT after discounts' }
            ]
          },
          {
            id: 'INV-2026-0042', client: 'Ivan Petrov', tenant: 'Tenant North Operations', tariff: 'Residential Professional', period: 'Jun 2026', currency: 'EUR', status: 'Sent', due: 'Net 30', subtotal: 980, markups: 0, discounts: 0, taxes: 196, total: 1176,
            charges: [
              { type: 'Platform Fee', basis: 'Residential subscription', amount: 480 },
              { type: 'Device Fees', basis: '20 devices flat pricing', amount: 300 },
              { type: 'Reports', basis: 'Custom reporting pack', amount: 200 }
            ],
            trace: [
              { step: 'Fixed Charges', amount: 480, note: 'Base subscription' },
              { step: 'Usage Charges', amount: 300, note: 'Device fees' },
              { step: 'Premium Modules', amount: 200, note: 'Reporting pack' },
              { step: 'VAT', amount: 196, note: '20% VAT' }
            ]
          },
          {
            id: 'INV-2026-0043', client: 'Green Valley Estate', tenant: 'GridOps Partner', tariff: 'Enterprise Custom PPA', period: 'Jun 2026', currency: 'USD', status: 'Paid', due: 'Net 10', subtotal: 67240, markups: 0, discounts: 0, taxes: 0, total: 67240,
            charges: [
              { type: 'PPA Service', basis: 'Portfolio settlement', amount: 48240 },
              { type: 'O&M Service', basis: 'Contract service charge', amount: 12000 },
              { type: 'Marketplace Fee', basis: 'Service transaction commission', amount: 7000 }
            ],
            trace: [
              { step: 'Usage Charges', amount: 48240, note: 'PPA settlement' },
              { step: 'Support Fees', amount: 12000, note: 'O&M service' },
              { step: 'Marketplace Fees', amount: 7000, note: 'Service commission' }
            ]
          }
        ],
        taxRules: [
          { id: 'TAX-EU-VAT-20', name: 'EU VAT Standard', jurisdiction: 'EU', rate: 20, status: 'Active' },
          { id: 'TAX-AM-VAT-20', name: 'Armenia VAT', jurisdiction: 'AM', rate: 20, status: 'Active' },
          { id: 'TAX-EXEMPT-EXPORT', name: 'Export Exemption', jurisdiction: 'Cross-border', rate: 0, status: 'Review' }
        ],
        integrations: [
          { system: '1C ERP', object: 'Invoices + payments', mode: 'Batch export', status: 'Ready' },
          { system: 'SAP', object: 'Revenue recognition', mode: 'API pending', status: 'Review' },
          { system: 'Xero', object: 'SMB invoices', mode: 'Webhook', status: 'Ready' }
        ],
        dashboardMetrics: [
          { label: 'MRR', value: 1240000, currency: 'EUR', note: 'Monthly recurring revenue' },
          { label: 'ARR', value: 14880000, currency: 'EUR', note: 'Annual recurring revenue' },
          { label: 'Outstanding Receivables', value: 284650, currency: 'EUR', note: 'Open customer balance' },
          { label: 'Overdue Invoices', value: 18, note: 'Collections queue' },
          { label: 'Cash Collection Rate', value: '96.8%', note: 'Paid vs issued invoices' },
          { label: 'Average Revenue per MW', value: 38.6, currency: 'EUR', suffix: 'k', note: 'Portfolio normalized KPI' }
        ],
        revenueBreakdown: [
          { name: 'Revenue by Customer', value: 'Arpi Solar Group', amount: 428000, currency: 'EUR', status: 'Top contributor' },
          { name: 'Revenue by Country', value: 'Armenia', amount: 386000, currency: 'EUR', status: 'Active market' },
          { name: 'Revenue by Asset Type', value: 'Inverters', amount: 182000, currency: 'EUR', status: 'Device charges' },
          { name: 'Revenue by Module', value: 'AI Forecasting', amount: 92000, currency: 'EUR', status: 'Premium module' },
          { name: 'Revenue by Marketplace', value: 'Services commission', amount: 64000, currency: 'EUR', status: 'Marketplace' }
        ],
        creditAccounts: [
          { customer: 'Arpi Solar Group', limit: 250000, balance: 68400, advance: 12000, deposit: 35000, securityDeposit: 50000, status: 'Healthy' },
          { customer: 'Green Valley Estate', limit: 500000, balance: 0, advance: 45000, deposit: 75000, securityDeposit: 100000, status: 'Healthy' },
          { customer: 'Solar Market Vendor', limit: 75000, balance: 18400, advance: 0, deposit: 5000, securityDeposit: 15000, status: 'Watch' }
        ],
        dunningPolicies: [
          { stage: 'Reminder', day: 1, action: 'Email reminder', channel: 'Email', status: 'Active' },
          { stage: 'Second Notice', day: 7, action: 'Email + in-app notice', channel: 'Email / In-App', status: 'Active' },
          { stage: 'Warning', day: 15, action: 'Escalate to account owner', channel: 'Email / Task', status: 'Active' },
          { stage: 'Service Restriction', day: 30, action: 'Restrict non-critical services', channel: 'System Rule', status: 'Review' },
          { stage: 'Suspension', day: 60, action: 'Suspend services after approval', channel: 'Approval Workflow', status: 'Manual Approval' }
        ],
        revenueRecognition: [
          { stream: 'Subscription Revenue', basis: 'Monthly platform subscription', amount: 520000, currency: 'EUR', status: 'Recognized' },
          { stream: 'Marketplace Revenue', basis: 'Vendor and services commission', amount: 84000, currency: 'EUR', status: 'Recognized' },
          { stream: 'Trading Revenue', basis: 'Energy trading settlement', amount: 126000, currency: 'EUR', status: 'Deferred' },
          { stream: 'Support Revenue', basis: 'SLA and support packages', amount: 65000, currency: 'EUR', status: 'Recognized' },
          { stream: 'Professional Services', basis: 'Implementation milestones', amount: 48000, currency: 'EUR', status: 'Pending' }
        ]
      };

      let state: typeof seed = load();

      function load(): typeof seed {
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
          if (saved && saved.invoices) return saved;
        } catch (e) {}
        return JSON.parse(JSON.stringify(seed));
      }

      function save(): void {
        localStorage.setItem(storageKey, JSON.stringify(state));
      }

      function money(value: string | number, currency: string = 'EUR'): string {
        const symbol = currency === 'USD' ? '$' : currency === 'AMD' ? '֏' : '€';
        return symbol + Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: currency === 'AMD' ? 0 : 2, maximumFractionDigits: currency === 'AMD' ? 0 : 2 });
      }

      function tone(value: string | number): string {
        const v = String(value || '').toLowerCase();
        if (v.includes('paid') || v.includes('closed') || v.includes('ready') || v.includes('confirmed') || v.includes('active')) return 'success';
        if (v.includes('draft') || v.includes('sent') || v.includes('running') || v.includes('review')) return 'warning';
        if (v.includes('overdue') || v.includes('failed') || v.includes('blocked')) return 'danger';
        return 'info';
      }

      function selectedInvoice() {
        return state.invoices.find(i => i.id === state.selectedInvoiceId) || state.invoices[0];
      }

      function kpis() {
        const open = state.invoices.filter(i => !['Paid', 'Cancelled'].includes(i.status)).length;
        const total = state.invoices.reduce((sum, i) => sum + Number(i.total || 0), 0);
        const overdue = state.invoices.filter(i => i.status === 'Overdue').length;
        const cycle = state.billingCycles.find(c => c.status === 'Running') || state.billingCycles[0];
        if (!cycle) return '';
        return `<section class="module-grid commercial-kpis-v78 billing-kpi-grid">
          <article class="module-card"><span>Active Billing Cycle</span><strong>${cycle.id}</strong><small>${cycle.progress}% completed</small></article>
          <article class="module-card"><span>Open Invoices</span><strong>${open}</strong><small>Draft / sent / overdue</small></article>
          <article class="module-card"><span>Current Invoice Value</span><strong>${money(total)}</strong><small>Mixed source mock data</small></article>
          <article class="module-card"><span>Overdue Invoices</span><strong>${overdue}</strong><small>Collections queue</small></article>
        </section>`;
      }

      function dataTable(heads: string[], rows: string[], cls: string = ''): string {
        return `<div class="data-table billing-config-table ${cls}"><div class="data-head">${heads.map(h => `<span>${h}</span>`).join('')}</div>${rows.join('')}</div>`;
      }

      function overview() {
        return `<section class="panel glass-card billing-config-panel">
          <div class="panel-head billing-panel-head">
            <div><h2>Billing Configuration</h2><p>Central financial configuration for metering, rating, invoices, taxes, ERP sync and audit snapshots.</p></div>
            <div class="toolbar billing-inline-actions"><button class="primary-action" type="button" onclick="BillingConfiguration.openInvoiceModal()">+ Create Invoice</button><button class="secondary-action" type="button" onclick="BillingConfiguration.runBillingCycle()">Run Cycle</button></div>
          </div>
          ${kpis()}
          <div class="commercial-governance-flow-v99 billing-flow-strip">
            <article><span>01</span><strong>Usage Records</strong><small>Stations, devices, API, marketplace</small></article>
            <article><span>02</span><strong>Rule Engine</strong><small>Priority, overrides, conflicts</small></article>
            <article><span>03</span><strong>Rating Engine</strong><small>Charges, markups, discounts, taxes</small></article>
            <article><span>04</span><strong>Invoice Service</strong><small>Draft, approve, send, snapshot</small></article>
            <article><span>05</span><strong>Payment / ERP</strong><small>Allocation, reconciliation, export</small></article>
          </div>
        </section>${invoices()}`;
      }

      function cycles() {
        const rows = state.billingCycles.map(c => `<div class="data-row billing-cycle-row">
          <div><strong>${c.name}</strong><small>${c.id}</small></div>
          <div><strong>${c.period}</strong><small>Billing period</small></div>
          <div><strong>${c.customers}</strong><small>Customers</small></div>
          <div><strong>${c.invoices}</strong><small>Invoices</small></div>
          <div><strong>${money(c.revenue, c.currency)}</strong><small>Expected revenue</small></div>
          <div><span class="badge ${tone(c.status)}">${c.status}</span><small>${c.progress}% progress</small></div>
        </div>`);
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>Billing Cycles</h2><p>Monthly, quarterly and custom billing runs. Running a cycle generates draft invoices from confirmed usage.</p></div><button class="primary-action" type="button" onclick="BillingConfiguration.openCycleModal()">+ New Cycle</button></div>${dataTable(['Cycle','Period','Customers','Invoices','Revenue','Status'], rows, 'billing-cycle-table')}</section>`;
      }

      function usage() {
        const rows = state.usageRecords.map(r => `<div class="data-row billing-usage-row">
          <div><strong>${r.id}</strong><small>${r.client}</small></div>
          <div><strong>${r.category}</strong><small>${r.metric}</small></div>
          <div><strong>${Number(r.quantity).toLocaleString()}</strong><small>${r.unit}</small></div>
          <div><strong>${r.source}</strong><small>Source system</small></div>
          <div><span class="badge ${tone(r.status)}">${r.status}</span></div>
        </div>`);
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>Usage Records</h2><p>Metering layer converts technical usage into billable units for the Rating Engine.</p></div><button class="secondary-action" type="button" onclick="BillingConfiguration.addUsageRecord()">+ Add Usage Record</button></div>${dataTable(['Record','Category','Quantity','Source','Status'], rows, 'billing-usage-table')}</section>`;
      }

      function invoices() {
        const rows = state.invoices.map(i => `<div class="data-row billing-invoice-row ${i.id === state.selectedInvoiceId ? 'selected' : ''}" data-invoice-id="${i.id}" onclick="BillingConfiguration.selectInvoice('${i.id}')">
          <div><strong>${i.id}</strong><small>${i.tariff}</small></div>
          <div><strong>${i.client}</strong><small>${i.tenant}</small></div>
          <div><strong>${i.period}</strong><small>${i.due}</small></div>
          <div><strong>${money(i.total, i.currency)}</strong><small>Subtotal ${money(i.subtotal, i.currency)}</small></div>
          <div><span class="badge ${tone(i.status)}">${i.status}</span></div>
          <div class="billing-row-actions"><button class="secondary-action compact-action" type="button" onclick="event.stopPropagation();BillingConfiguration.openSnapshot('${i.id}')">Snapshot</button><button class="primary-action compact-action" type="button" onclick="event.stopPropagation();BillingConfiguration.advanceInvoice('${i.id}')">Next</button></div>
        </div>`);
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>Invoices</h2><p>Invoice registry linked to tariff version, usage records, calculation trace and payment status.</p></div><button class="primary-action" type="button" onclick="BillingConfiguration.openInvoiceModal()">+ Create Invoice</button></div>${dataTable(['Invoice','Client / Tenant','Period','Amount','Status','Actions'], rows, 'billing-invoice-table')}</section>${invoiceDetail()}`;
      }

      function invoiceDetail() {
        const inv = selectedInvoice();
        if (!inv) return '';
        const charges = inv.charges.map(c => `<div class="data-row billing-charge-row"><div><strong>${c.type}</strong><small>${c.basis}</small></div><div><strong>${money(c.amount, inv.currency)}</strong><small>Charge amount</small></div></div>`).join('');
        const trace = inv.trace.map((t, idx) => `<article class="billing-trace-step"><span>${String(idx + 1).padStart(2, '0')}</span><div><strong>${t.step}</strong><small>${t.note}</small></div><b>${money(t.amount, inv.currency)}</b></article>`).join('');
        return `<section class="billing-detail-grid">
          <article class="panel glass-card billing-config-panel billing-detail-panel"><div class="panel-head"><div><h2>Selected Invoice</h2><p>${inv.id} · ${inv.client}</p></div><span class="badge ${tone(inv.status)}">${inv.status}</span></div>
            <div class="billing-summary-grid"><div><span>Subtotal</span><strong>${money(inv.subtotal, inv.currency)}</strong></div><div><span>Markups</span><strong>${money(inv.markups, inv.currency)}</strong></div><div><span>Discounts</span><strong>${money(inv.discounts, inv.currency)}</strong></div><div><span>Taxes</span><strong>${money(inv.taxes, inv.currency)}</strong></div><div class="total"><span>Total</span><strong>${money(inv.total, inv.currency)}</strong></div></div>
            <div class="billing-workflow-strip">${invoiceWorkflow(inv.status)}</div>
            <div class="billing-action-bar"><button class="secondary-action" type="button" onclick="BillingConfiguration.approveInvoice('${inv.id}')">Approve</button><button class="secondary-action" type="button" onclick="BillingConfiguration.sendInvoice('${inv.id}')">Send</button><button class="primary-action" type="button" onclick="BillingConfiguration.markInvoicePaid('${inv.id}')">Mark Paid</button><button class="danger-action" type="button" onclick="BillingConfiguration.cancelInvoice('${inv.id}')">Cancel</button></div>
            <div class="section-title compact-section-title"><div><h3>Charges</h3><p class="muted">Line items used by the invoice total.</p></div><button class="secondary-action" type="button" onclick="BillingConfiguration.openChargeModal()">+ Add Charge</button></div>
            <div class="data-table billing-charge-table">${charges}</div>
          </article>
          <article class="panel glass-card billing-config-panel billing-result-panel"><div class="panel-head"><div><h2>Calculation Trace</h2><p>Immutable calculation steps saved inside invoice snapshot.</p></div></div><div class="billing-trace-list">${trace}</div></article>
        </section>`;
      }

      function invoiceWorkflow(status: string): string {
        const steps = ['Draft', 'Approved', 'Sent', 'Paid'];
        const idx = Math.max(0, steps.indexOf(status));
        if (['Cancelled', 'Overdue'].includes(status)) {
          return `<article class="billing-workflow-step alert"><span>!</span><strong>${status}</strong><small>Terminal / exception state</small></article>`;
        }
        return steps.map((step, i) => `<article class="billing-workflow-step ${i <= idx ? 'done' : ''}"><span>${i + 1}</span><strong>${step}</strong><small>${i < idx ? 'Completed' : i === idx ? 'Current' : 'Pending'}</small></article>`).join('');
      }

      function rules() {
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>Rating & Rule Engine</h2><p>Calculation sequence and conflict resolution rules used before invoice generation.</p></div><button class="secondary-action" type="button" onclick="BillingConfiguration.testRating()">Test Rating</button></div>
          <div class="billing-rule-grid">
            ${['Fixed Charges','Usage Charges','Marketplace Charges','Premium Modules','Markups','Discounts','Taxes','Rounding'].map((r,idx)=>`<article><span>${String(idx+1).padStart(2,'0')}</span><strong>${r}</strong><small>${idx < 4 ? 'Subtotal input' : idx < 6 ? 'Adjustment phase' : 'Final phase'}</small></article>`).join('')}
          </div>
          <div class="billing-two-col">
            <div class="billing-rule-card"><strong>Rule Priority</strong><p>Contract Override → Customer Override → Operator Override → Tariff Plan → System Defaults</p></div>
            <div class="billing-rule-card"><strong>Conflict Control</strong><p>Only one active device pricing model per device type. Flat + Tiered is blocked.</p></div>
          </div>
        </section>`;
      }

      function taxes() {
        const rows = state.taxRules.map(t => `<div class="data-row billing-tax-row"><div><strong>${t.name}</strong><small>${t.id}</small></div><div><strong>${t.jurisdiction}</strong><small>Jurisdiction</small></div><div><strong>${t.rate}%</strong><small>Tax rate</small></div><div><span class="badge ${tone(t.status)}">${t.status}</span></div></div>`);
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>Taxes & Currency</h2><p>VAT, local tax, exemptions, FX sources and rounding rules applied after discounts.</p></div><button class="secondary-action" type="button" onclick="BillingConfiguration.openTaxModal()">+ Add Tax Rule</button></div>${dataTable(['Tax Rule','Jurisdiction','Rate','Status'], rows, 'billing-tax-table')}<div class="billing-two-col"><div class="billing-rule-card"><strong>FX Policy</strong><p>Invoice Currency: EUR · Payment Currency: AMD · Rate Source: Central Bank · FX Margin: 1.5%</p></div><div class="billing-rule-card"><strong>Rounding</strong><p>EUR/USD: 0.01 · AMD: 1 · rounding always after taxes.</p></div></div></section>`;
      }

      function dashboard() {
        const metricCards = state.dashboardMetrics.map(m => {
          const formatted = typeof m.value === 'number' ? (m.currency ? money(m.value, m.currency) : Number(m.value).toLocaleString()) : m.value;
          return `<article class="module-card"><span>${m.label}</span><strong>${formatted}${m.suffix || ''}</strong><small>${m.note}</small></article>`;
        }).join('');
        const rows = state.revenueBreakdown.map(r => `<div class="data-row billing-dashboard-row"><div><strong>${r.name}</strong><small>${r.value}</small></div><div><strong>${money(r.amount, r.currency)}</strong><small>Current period</small></div><div><span class="badge info">${r.status}</span></div></div>`);
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>Billing Dashboard</h2><p>Executive financial KPIs for recurring revenue, receivables, collections and normalized revenue by portfolio dimensions.</p></div><button class="secondary-action" type="button" onclick="BillingConfiguration.openSimulatorModal()">Run Billing Simulation</button></div><section class="module-grid commercial-kpis-v78 billing-enterprise-kpi-grid">${metricCards}</section>${dataTable(['Dimension','Revenue','Status'], rows, 'billing-dashboard-table')}</section>`;
      }

      function credit() {
        const rows = state.creditAccounts.map(c => `<div class="data-row billing-credit-row"><div><strong>${c.customer}</strong><small>Customer account</small></div><div><strong>${money(c.limit)}</strong><small>Credit limit</small></div><div><strong>${money(c.balance)}</strong><small>Credit balance</small></div><div><strong>${money(c.advance)}</strong><small>Advance payments</small></div><div><strong>${money(c.deposit)}</strong><small>Deposits</small></div><div><strong>${money(c.securityDeposit)}</strong><small>Security deposits</small></div><div><span class="badge ${tone(c.status)}">${c.status}</span></div></div>`);
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>Credit Management</h2><p>Credit limits, balances, advance payments, deposits and security deposits used before collections and service restriction.</p></div><div class="toolbar billing-inline-actions"><button class="secondary-action" type="button" onclick="BillingConfiguration.openCreditModal()">Adjust Credit</button><button class="primary-action" type="button" onclick="BillingConfiguration.addDeposit()">Add Deposit</button></div></div>${dataTable(['Customer','Limit','Balance','Advance','Deposit','Security','Status'], rows, 'billing-credit-table')}</section>`;
      }

      function dunning() {
        const rows = state.dunningPolicies.map(p => `<div class="data-row billing-dunning-row"><div><strong>${p.stage}</strong><small>Day ${p.day}</small></div><div><strong>${p.action}</strong><small>${p.channel}</small></div><div><span class="badge ${tone(p.status)}">${p.status}</span></div><div class="billing-row-actions"><button class="secondary-action compact-action" type="button" onclick="BillingConfiguration.editDunning('${p.stage}')">Edit</button></div></div>`);
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>Dunning Management</h2><p>Collections policy for overdue invoices: reminders, escalation, service restriction and final suspension.</p></div><button class="secondary-action" type="button" onclick="BillingConfiguration.configureDunning()">Configure Policy</button></div><div class="commercial-governance-flow-v99 billing-flow-strip billing-dunning-flow">${state.dunningPolicies.map(p => `<article><span>${p.day}</span><strong>${p.stage}</strong><small>${p.action}</small></article>`).join('')}</div>${dataTable(['Stage','Action','Status','Actions'], rows, 'billing-dunning-table')}</section>`;
      }

      function revenue() {
        const rows = state.revenueRecognition.map(r => `<div class="data-row billing-revenue-row"><div><strong>${r.stream}</strong><small>${r.basis}</small></div><div><strong>${money(r.amount, r.currency)}</strong><small>Recognized / deferred basis</small></div><div><span class="badge ${tone(r.status)}">${r.status}</span></div></div>`);
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>Revenue Recognition</h2><p>IFRS / GAAP oriented split of subscription, marketplace, trading, support and professional service revenue.</p></div><button class="secondary-action" type="button" onclick="BillingConfiguration.recognizeRevenue()">Run Recognition</button></div>${dataTable(['Revenue Stream','Amount','Status'], rows, 'billing-revenue-table')}<div class="billing-two-col"><div class="billing-rule-card"><strong>Recognition Policy</strong><p>Subscription revenue is recognized monthly. Trading and implementation revenue may be deferred until settlement or milestone acceptance.</p></div><div class="billing-rule-card"><strong>ERP Posting</strong><p>Recognition batches are exported to SAP, 1C, Odoo or other ERP systems with invoice snapshot references.</p></div></div></section>`;
      }

      function erp() {
        const rows = state.integrations.map(i => `<div class="data-row billing-erp-row"><div><strong>${i.system}</strong><small>${i.object}</small></div><div><strong>${i.mode}</strong><small>Integration mode</small></div><div><span class="badge ${tone(i.status)}">${i.status}</span></div><div class="billing-row-actions"><button class="secondary-action compact-action" type="button" onclick="BillingConfiguration.syncErp('${i.system}')">Sync</button></div></div>`);
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head billing-panel-head"><div><h2>ERP Integration</h2><p>Exports invoices, payments, revenue recognition and accounting batches to external ERP systems.</p></div><button class="secondary-action" type="button" onclick="BillingConfiguration.exportBatch()">Export Batch</button></div>${dataTable(['System','Mode','Status','Actions'], rows, 'billing-erp-table')}</section>`;
      }

      function audit() {
        const items = [
          ['Invoice snapshot created', 'INV-2026-0041 generated from tariff Industrial Operator Plus.'],
          ['Billing cycle started', 'June 2026 Monthly Billing moved to Running.'],
          ['Tax rule reviewed', 'Export Exemption marked for finance review.'],
          ['ERP export prepared', '1C ERP batch ready for posting.']
        ];
        return `<section class="panel glass-card billing-config-panel"><div class="panel-head"><div><h2>Billing Audit</h2><p>Trace configuration changes, calculations and lifecycle actions.</p></div></div><div class="commercial-audit-v78">${items.map((a,idx)=>`<article class="commercial-audit-item-v78"><div class="commercial-audit-marker-v78"></div><div class="commercial-audit-content-v78"><div class="commercial-audit-top-v78"><strong>${a[0]}</strong><span>${18-idx} Jun 2026</span></div><p>${a[1]}</p></div></article>`).join('')}</div></section>`;
      }

      function tabContent(tab: string): string {
        if (tab === 'dashboard') return dashboard();
        if (tab === 'cycles') return cycles();
        if (tab === 'usage') return usage();
        if (tab === 'invoices') return invoices();
        if (tab === 'rules') return rules();
        if (tab === 'taxes') return taxes();
        if (tab === 'credit') return credit();
        if (tab === 'dunning') return dunning();
        if (tab === 'revenue') return revenue();
        if (tab === 'erp') return erp();
        if (tab === 'audit') return audit();
        return overview();
      }

      function mount() {
        FleetLayout.mount(`<section class="page-hero billing-page-hero"><div><p class="eyebrow">Global Admin · Financial Operations</p><h1>Billing Management</h1><p class="muted">Usage records, rating rules, invoice generation, tax calculation, ERP sync and immutable calculation snapshots.</p></div><button class="secondary-action" type="button" onclick="location.href='tariff-plans.html'">Open Tariff Plans</button></section><section class="plant-workspace-v17 billing-workspace-v100 billing-config-workspace"><aside class="glass-card plant-side-card-v17 billing-side-nav"><h3>Billing Management</h3><button class="${state.activeTab==='overview'?'active':''}" data-billing-tab="overview">Overview</button><button class="${state.activeTab==='dashboard'?'active':''}" data-billing-tab="dashboard">Billing Dashboard</button><button class="${state.activeTab==='cycles'?'active':''}" data-billing-tab="cycles">Billing Cycles</button><button class="${state.activeTab==='usage'?'active':''}" data-billing-tab="usage">Usage Records</button><button class="${state.activeTab==='invoices'?'active':''}" data-billing-tab="invoices">Invoices</button><button class="${state.activeTab==='rules'?'active':''}" data-billing-tab="rules">Rating Rules</button><button class="${state.activeTab==='taxes'?'active':''}" data-billing-tab="taxes">Taxes & Currency</button><button class="${state.activeTab==='credit'?'active':''}" data-billing-tab="credit">Credit Management</button><button class="${state.activeTab==='dunning'?'active':''}" data-billing-tab="dunning">Dunning Management</button><button class="${state.activeTab==='revenue'?'active':''}" data-billing-tab="revenue">Revenue Recognition</button><button class="${state.activeTab==='erp'?'active':''}" data-billing-tab="erp">ERP Integration</button><button class="${state.activeTab==='audit'?'active':''}" data-billing-tab="audit">Audit</button></aside><section class="plant-main-card-v17 billing-main-card" id="billingContent">${tabContent(state.activeTab)}</section></section>`);
        document.addEventListener('click', handleClick);
      }

      function rerender() {
        save();
        const content = document.getElementById('billingContent');
        if (content) content.innerHTML = tabContent(state.activeTab);
        document.querySelectorAll('[data-billing-tab]').forEach(btn => btn.classList.toggle('active', btn.dataset.billingTab === state.activeTab));
      }

      function handleClick(event: Event): void {
        const target = event.target instanceof Element ? event.target : null;
        if (!target) return;
        const tab = target.closest('[data-billing-tab]');
        if (!tab) return;
        state.activeTab = tab.dataset.billingTab;
        rerender();
      }

      function closeModal() {
        const modal = document.querySelector('.commercial-modal-backdrop');
        if (modal) modal.remove();
      }

      function modal(title: string, subtitle: string, body: string, footer: string): void {
        closeModal();
        document.body.insertAdjacentHTML('beforeend', `<div class="commercial-modal-backdrop"><div class="commercial-modal billing-modal"><div class="commercial-modal-head"><div><h2>${title}</h2><p>${subtitle}</p></div><button class="modal-close-btn" type="button" onclick="BillingConfiguration.closeModal()">×</button></div><div class="commercial-modal-body">${body}</div><div class="commercial-modal-footer">${footer}</div></div></div>`);
      }

      function openInvoiceModal() {
        modal('Create Invoice Draft', 'Create a prototype invoice from tariff, usage records and tax settings.', `<div class="modal-form-grid two-col"><label>Client<input id="billClient" value="Arpi Solar Group"></label><label>Tenant<input id="billTenant" value="Tenant Alpha Energy"></label><label>Tariff<input id="billTariff" value="Industrial Operator Plus"></label><label>Period<input id="billPeriod" value="Jul 2026"></label><label>Currency<select id="billCurrency"><option>EUR</option><option>USD</option><option>AMD</option></select></label><label>Subtotal<input id="billSubtotal" type="number" value="1500"></label><label>SLA Markup %<input id="billMarkup" type="number" value="10"></label><label>Discount %<input id="billDiscount" type="number" value="20"></label><label>Tax %<input id="billTax" type="number" value="20"></label><label>Due Terms<select id="billDue"><option>Net 15</option><option>Net 30</option><option>Net 10</option><option>Prepaid</option></select></label></div>`, `<button class="secondary-action" type="button" onclick="BillingConfiguration.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="BillingConfiguration.saveInvoice()">Create Draft</button>`);
      }

      function saveInvoice() {
        const subtotal = Number(val('billSubtotal') || 0);
        const markupPct = Number(val('billMarkup') || 0);
        const discountPct = Number(val('billDiscount') || 0);
        const taxPct = Number(val('billTax') || 0);
        const markups = subtotal * markupPct / 100;
        const discounts = (subtotal + markups) * discountPct / 100;
        const taxable = subtotal + markups - discounts;
        const taxes = taxable * taxPct / 100;
        const total = taxable + taxes;
        const id = 'INV-2026-' + String(50 + state.invoices.length).padStart(4, '0');
        const inv = { id, client: val('billClient'), tenant: val('billTenant'), tariff: val('billTariff'), period: val('billPeriod'), currency: val('billCurrency'), status: 'Draft', due: val('billDue'), subtotal, markups, discounts, taxes, total, charges: [{ type: 'Base + Usage Charges', basis: 'Manual draft input', amount: subtotal }], trace: [{ step: 'Subtotal', amount: subtotal, note: 'Manual draft charges' }, { step: 'Markups', amount: markups, note: `${markupPct}% markup` }, { step: 'Discounts', amount: -discounts, note: `${discountPct}% discount` }, { step: 'Taxes', amount: taxes, note: `${taxPct}% tax` }] };
        state.invoices.unshift(inv);
        state.selectedInvoiceId = id;
        state.activeTab = 'invoices';
        closeModal();
        rerender();
        FleetLayout.toast('Invoice draft created');
      }

      function openChargeModal() {
        const inv = selectedInvoice();
        if (!inv) return;
        modal('Add Invoice Charge', `Add charge line to ${inv.id}.`, `<div class="modal-form-grid two-col"><label>Charge Type<input id="chargeType" value="Support Fees"></label><label>Basis<input id="chargeBasis" value="Manual support package"></label><label>Amount<input id="chargeAmount" type="number" value="250"></label></div>`, `<button class="secondary-action" type="button" onclick="BillingConfiguration.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="BillingConfiguration.saveCharge()">Add Charge</button>`);
      }

      function saveCharge() {
        const inv = selectedInvoice();
        if (!inv) return;
        const amount = Number(val('chargeAmount') || 0);
        inv.charges.push({ type: val('chargeType'), basis: val('chargeBasis'), amount });
        inv.subtotal += amount;
        inv.total += amount;
        inv.trace.push({ step: val('chargeType'), amount, note: val('chargeBasis') });
        closeModal();
        save();
        rerender();
        FleetLayout.toast('Charge added');
      }

      function openCycleModal() {
        modal('New Billing Cycle', 'Create a new billing cycle for monthly, quarterly or custom billing.', `<div class="modal-form-grid two-col"><label>Cycle Name<input id="cycleName" value="July 2026 Monthly Billing"></label><label>Cycle ID<input id="cycleId" value="CYC-2026-07"></label><label>Period<input id="cyclePeriod" value="01 Jul 2026 — 31 Jul 2026"></label><label>Customers<input id="cycleCustomers" type="number" value="42"></label><label>Currency<select id="cycleCurrency"><option>EUR</option><option>USD</option><option>AMD</option></select></label></div>`, `<button class="secondary-action" type="button" onclick="BillingConfiguration.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="BillingConfiguration.saveCycle()">Create Cycle</button>`);
      }

      function saveCycle() {
        state.billingCycles.unshift({ id: val('cycleId'), name: val('cycleName'), period: val('cyclePeriod'), status: 'Draft', customers: Number(val('cycleCustomers')), invoices: 0, revenue: 0, currency: val('cycleCurrency'), progress: 0 });
        closeModal();
        state.activeTab = 'cycles';
        rerender();
        FleetLayout.toast('Billing cycle created');
      }

      function openTaxModal() {
        modal('Add Tax Rule', 'Create tax rule for invoice calculation.', `<div class="modal-form-grid two-col"><label>Rule ID<input id="taxId" value="TAX-CUSTOM"></label><label>Name<input id="taxName" value="Custom VAT"></label><label>Jurisdiction<input id="taxJurisdiction" value="EU"></label><label>Rate %<input id="taxRate" type="number" value="20"></label><label>Status<select id="taxStatus"><option>Active</option><option>Review</option><option>Archived</option></select></label></div>`, `<button class="secondary-action" type="button" onclick="BillingConfiguration.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="BillingConfiguration.saveTaxRule()">Add Rule</button>`);
      }

      function saveTaxRule() {
        state.taxRules.unshift({ id: val('taxId'), name: val('taxName'), jurisdiction: val('taxJurisdiction'), rate: Number(val('taxRate')), status: val('taxStatus') });
        closeModal();
        state.activeTab = 'taxes';
        rerender();
        FleetLayout.toast('Tax rule added');
      }

      function openSimulatorModal() {
        modal('Billing Simulation', 'Preview invoice amount from customer usage, SLA, discounts and taxes.', `<div class="modal-form-grid two-col"><label>Customer<input id="simCustomer" value="Arpi Solar Group"></label><label>Tariff<input id="simTariff" value="Industrial Operator Plus"></label><label>Stations<input id="simStations" type="number" value="4"></label><label>Devices Amount<input id="simDevices" type="number" value="620"></label><label>Commands<input id="simCommands" type="number" value="1200"></label><label>Included Commands<input id="simIncludedCommands" type="number" value="1000"></label><label>Command Overage Price<input id="simCommandPrice" type="number" step="0.01" value="0.05"></label><label>Modules Amount<input id="simModules" type="number" value="200"></label><label>SLA Markup %<input id="simSla" type="number" value="10"></label><label>Discount %<input id="simDiscount" type="number" value="20"></label><label>Tax %<input id="simTax" type="number" value="20"></label></div><div id="simResult" class="billing-sim-result muted">Run simulation to see calculation trace.</div>`, `<button class="secondary-action" type="button" onclick="BillingConfiguration.closeModal()">Close</button><button class="primary-action" type="button" onclick="BillingConfiguration.runSimulation()">Run Simulation</button>`);
      }

      function runSimulation() {
        const base = 500;
        const devices = Number(val('simDevices') || 0);
        const commands = Math.max(0, Number(val('simCommands') || 0) - Number(val('simIncludedCommands') || 0)) * Number(val('simCommandPrice') || 0);
        const modules = Number(val('simModules') || 0);
        const subtotal = base + devices + commands + modules;
        const markup = subtotal * Number(val('simSla') || 0) / 100;
        const discount = (subtotal + markup) * Number(val('simDiscount') || 0) / 100;
        const taxable = subtotal + markup - discount;
        const tax = taxable * Number(val('simTax') || 0) / 100;
        const total = taxable + tax;
        const result = document.getElementById('simResult');
        if (result) result.innerHTML = `<div class="billing-sim-grid"><div><span>Base Fee</span><strong>${money(base)}</strong></div><div><span>Devices</span><strong>${money(devices)}</strong></div><div><span>Commands</span><strong>${money(commands)}</strong></div><div><span>Modules</span><strong>${money(modules)}</strong></div><div><span>SLA</span><strong>${money(markup)}</strong></div><div><span>Discount</span><strong>-${money(discount)}</strong></div><div><span>Taxes</span><strong>${money(tax)}</strong></div><div class="total"><span>Total</span><strong>${money(total)}</strong></div></div>`;
      }

      function openCreditModal() {
        modal('Adjust Credit', 'Update customer credit limit and current balance.', `<div class="modal-form-grid two-col"><label>Customer<input id="creditCustomer" value="Arpi Solar Group"></label><label>Credit Limit<input id="creditLimit" type="number" value="250000"></label><label>Credit Balance<input id="creditBalance" type="number" value="68400"></label><label>Status<select id="creditStatus"><option>Healthy</option><option>Watch</option><option>Blocked</option></select></label></div>`, `<button class="secondary-action" type="button" onclick="BillingConfiguration.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="BillingConfiguration.saveCreditAdjustment()">Save Credit</button>`);
      }

      function saveCreditAdjustment() {
        const row = state.creditAccounts.find(c => c.customer === val('creditCustomer')) || state.creditAccounts[0];
        if (!row) return;
        row.limit = Number(val('creditLimit') || row.limit);
        row.balance = Number(val('creditBalance') || row.balance);
        row.status = val('creditStatus') || row.status;
        closeModal();
        state.activeTab = 'credit';
        rerender();
        FleetLayout.toast('Credit profile updated');
      }

      function addDeposit() {
        const row = state.creditAccounts[0];
        if (!row) return;
        row.deposit += 1000;
        state.activeTab = 'credit';
        rerender();
        FleetLayout.toast('Deposit added to customer profile');
      }

      function configureDunning() {
        modal('Configure Dunning Policy', 'Update overdue collection stages and service restriction policy.', `<div class="modal-form-grid two-col"><label>Reminder Day<input id="dunReminder" type="number" value="1"></label><label>Second Notice Day<input id="dunNotice" type="number" value="7"></label><label>Warning Day<input id="dunWarning" type="number" value="15"></label><label>Restriction Day<input id="dunRestriction" type="number" value="30"></label><label>Suspension Day<input id="dunSuspension" type="number" value="60"></label><label>Restriction Rule<select id="dunRule"><option>Restrict non-critical services</option><option>Notify account owner only</option><option>Manual approval required</option></select></label></div>`, `<button class="secondary-action" type="button" onclick="BillingConfiguration.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="BillingConfiguration.saveDunningPolicy()">Save Policy</button>`);
      }

      function saveDunningPolicy() {
        const days = [Number(val('dunReminder')), Number(val('dunNotice')), Number(val('dunWarning')), Number(val('dunRestriction')), Number(val('dunSuspension'))];
        state.dunningPolicies = state.dunningPolicies.map((p, i) => ({ ...p, day: days[i] || p.day, status: i >= 3 ? 'Review' : 'Active' }));
        const restrictionPolicy = state.dunningPolicies[3];
        if (restrictionPolicy) restrictionPolicy.action = val('dunRule') || restrictionPolicy.action;
        closeModal();
        state.activeTab = 'dunning';
        save();
        rerender();
        FleetLayout.toast('Dunning policy updated');
      }

      function editDunning(stage: string): void {
        const item = state.dunningPolicies.find(p => p.stage === stage);
        if (!item) return;
        modal('Edit Dunning Stage', `${item.stage} collection step.`, `<div class="modal-form-grid two-col"><label>Stage<input id="dunStage" value="${item.stage}" disabled></label><label>Day<input id="dunStageDay" type="number" value="${item.day}"></label><label>Action<input id="dunStageAction" value="${item.action}"></label><label>Channel<input id="dunStageChannel" value="${item.channel}"></label><label>Status<select id="dunStageStatus"><option ${item.status === 'Active' ? 'selected' : ''}>Active</option><option ${item.status === 'Review' ? 'selected' : ''}>Review</option><option ${item.status === 'Manual Approval' ? 'selected' : ''}>Manual Approval</option></select></label></div>`, `<button class="secondary-action" type="button" onclick="BillingConfiguration.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="BillingConfiguration.saveDunningStage('${stage}')">Save Stage</button>`);
      }

      function saveDunningStage(stage: string): void {
        const item = state.dunningPolicies.find(p => p.stage === stage);
        if (!item) return;
        item.day = Number(val('dunStageDay') || item.day);
        item.action = val('dunStageAction') || item.action;
        item.channel = val('dunStageChannel') || item.channel;
        item.status = val('dunStageStatus') || item.status;
        closeModal();
        save();
        rerender();
        FleetLayout.toast(`${stage} dunning stage updated`);
      }

      function recognizeRevenue() {
        state.revenueRecognition = state.revenueRecognition.map(r => ({ ...r, status: r.status === 'Pending' ? 'Recognized' : r.status }));
        save();
        rerender();
        FleetLayout.toast('Revenue recognition batch prepared');
      }

      function val(id: string): string {
        const el = document.getElementById(id);
        return String(el?.value || '');
      }

      function selectInvoice(id: string): void {
        state.selectedInvoiceId = id;
        save();
        rerender();
      }

      function setInvoiceStatus(id: string, status: string, message?: string): void {
        const inv = state.invoices.find(i => i.id === id);
        if (!inv) return;
        inv.status = status;
        state.selectedInvoiceId = id;
        inv.trace.push({ step: `Status: ${status}`, amount: 0, note: message || `Invoice moved to ${status}` });
        save();
        rerender();
        FleetLayout.toast(`${inv.id} ${status}`);
      }

      function approveInvoice(id: string): void { setInvoiceStatus(id, 'Approved', 'Invoice approved by billing admin'); }
      function sendInvoice(id: string): void { setInvoiceStatus(id, 'Sent', 'Invoice sent to customer billing contact'); }
      function markInvoicePaid(id: string): void { setInvoiceStatus(id, 'Paid', 'Payment received and allocated to invoice'); }
      function cancelInvoice(id: string): void { setInvoiceStatus(id, 'Cancelled', 'Invoice cancelled by billing admin'); }

      function advanceInvoice(id: string): void {
        const inv = state.invoices.find(i => i.id === id);
        if (!inv) return;
        const flow = ['Draft', 'Approved', 'Sent', 'Paid'];
        const idx = flow.indexOf(inv.status);
        inv.status = flow[Math.min(idx + 1, flow.length - 1)] || 'Approved';
        save();
        rerender();
        FleetLayout.toast(`${inv.id} moved to ${inv.status}`);
      }

      function openSnapshot(id: string): void {
        const inv = state.invoices.find(i => i.id === id);
        if (!inv) return;
        const snapshot = { invoice_id: inv.id, tariff: inv.tariff, period: inv.period, currency: inv.currency, charges: inv.charges, subtotal: inv.subtotal, markups: inv.markups, discounts: inv.discounts, taxes: inv.taxes, total: inv.total, trace: inv.trace };
        modal('Invoice Calculation Snapshot', `${inv.id} immutable calculation preview.`, `<pre class="billing-snapshot-code">${JSON.stringify(snapshot, null, 2)}</pre>`, `<button class="primary-action" type="button" onclick="BillingConfiguration.closeModal()">Close</button>`);
      }

      function runBillingCycle() {
        const cycle = state.billingCycles.find(c => c.status === 'Running') || state.billingCycles[0];
        if (!cycle) return;
        cycle.progress = Math.min(100, cycle.progress + 8);
        cycle.invoices = Math.max(cycle.invoices, state.invoices.length);
        cycle.revenue = state.invoices.reduce((sum, i) => sum + Number(i.total || 0), 0);
        if (cycle.progress >= 100) cycle.status = 'Closed';
        save();
        rerender();
        FleetLayout.toast('Billing cycle recalculated');
      }

      function addUsageRecord() {
        const id = 'USG-' + (1001 + state.usageRecords.length);
        state.usageRecords.unshift({ id, client: 'New Enterprise Customer', category: 'Storage', metric: 'Telemetry retention', quantity: 1, unit: 'TB-month', source: 'Data Storage', status: 'Review' });
        save();
        rerender();
        FleetLayout.toast('Usage record added for review');
      }

      function testRating() {
        FleetLayout.toast('Rating test passed: no pricing conflicts');
      }

      function syncErp(system: string): void {
        const item = state.integrations.find(i => i.system === system);
        if (item) item.status = 'Ready';
        save();
        rerender();
        FleetLayout.toast(`${system} sync completed`);
      }

      function exportBatch() {
        state.integrations = state.integrations.map(i => ({ ...i, status: i.status === 'Review' ? 'Ready' : i.status }));
        save();
        rerender();
        FleetLayout.toast('ERP export batch prepared');
      }

      return { mount, closeModal, openInvoiceModal, saveInvoice, openChargeModal, saveCharge, openCycleModal, saveCycle, openTaxModal, saveTaxRule, openSimulatorModal, runSimulation, openCreditModal, saveCreditAdjustment, addDeposit, configureDunning, saveDunningPolicy, editDunning, saveDunningStage, recognizeRevenue, selectInvoice, approveInvoice, sendInvoice, markInvoicePaid, cancelInvoice, advanceInvoice, openSnapshot, runBillingCycle, addUsageRecord, testRating, syncErp, exportBatch };
    })();

    window.BillingConfiguration.mount();
