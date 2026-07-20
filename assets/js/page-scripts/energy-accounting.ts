interface EnergyAccountingRecordV58 {
  id: string;
  tenant: string;
  client: string;
  plant: string;
  period: string;
  interval: string;
  meter: string;
  produced: number;
  self: number;
  exported: number;
  imported: number;
  bessIn: number;
  bessOut: number;
  quality: string;
  accounting: string;
  settlement: string;
}

type EnergyAccountingNumericFieldV58 = 'produced' | 'self' | 'exported' | 'imported' | 'bessIn' | 'bessOut';

interface EnergyLedgerRowV58 {
  id: string;
  source: string;
  type: string;
  qty: string;
  counterparty: string;
  price: string;
  amount: string;
  status: string;
}

const accountingRecords: EnergyAccountingRecordV58[] = [
      { id:'EAR-2026-06-0001', tenant:'Tenant Alpha Energy', client:'Arpi Solar Group', plant:'Arpi Rooftop 01', period:'June 2026', interval:'Monthly', meter:'Grid Meter GM-001', produced:125000, self:40200, exported:84800, imported:14200, bessIn:8600, bessOut:7900, quality:'Validated', accounting:'Approved', settlement:'Ready' },
      { id:'EAR-2026-06-0002', tenant:'Tenant North Operations', client:'Ivan Petrov', plant:'Residential PV', period:'June 2026', interval:'Monthly', meter:'Smart Meter SM-014', produced:1850, self:1240, exported:610, imported:420, bessIn:220, bessOut:180, quality:'Estimated', accounting:'Under Review', settlement:'Blocked' },
      { id:'EAR-2026-06-0003', tenant:'GridOps Partner', client:'Green Valley Estate', plant:'Green Valley East', period:'June 2026', interval:'Monthly', meter:'Main Export Meter GEM-77', produced:734000, self:188500, exported:545500, imported:32200, bessIn:44600, bessOut:38900, quality:'Validated', accounting:'Locked', settlement:'Settled' },
      { id:'EAR-2026-06-0004', tenant:'Tenant Alpha Energy', client:'Arpi Solar Group', plant:'Storage Pilot', period:'June 2026', interval:'Monthly', meter:'BESS Meter BM-09', produced:68400, self:12100, exported:56300, imported:5200, bessIn:18200, bessOut:17100, quality:'Corrected', accounting:'Approved', settlement:'Ready' }
    ];

    const ledger: EnergyLedgerRowV58[] = [
      { id:'LED-2026-0001', source:'Arpi Rooftop 01', type:'Export', qty:'84,800 kWh', counterparty:'Green Market Trader LLC', price:'€0.092 / kWh', amount:'€7,801.60', status:'Ready' },
      { id:'LED-2026-0002', source:'Residential PV', type:'Self Consumption', qty:'1,240 kWh', counterparty:'Owner site load', price:'Internal offset', amount:'€161.20', status:'Review' },
      { id:'LED-2026-0003', source:'Green Valley East', type:'Direct PPA', qty:'545,500 kWh', counterparty:'Green Valley Mall', price:'$0.118 / kWh', amount:'$64,369.00', status:'Settled' },
      { id:'LED-2026-0004', source:'Storage Pilot', type:'BESS Discharge', qty:'17,100 kWh', counterparty:'Aggregator Pool', price:'€0.105 / kWh', amount:'€1,795.50', status:'Ready' }
    ];

    function tone(value: string | number | null | undefined): string{ const v=String(value||'').toLowerCase(); if(v.includes('validated')||v.includes('approved')||v.includes('locked')||v.includes('ready')||v.includes('settled')) return 'success'; if(v.includes('review')||v.includes('estimated')||v.includes('corrected')) return 'warning'; if(v.includes('blocked')||v.includes('missing')||v.includes('rejected')) return 'danger'; return 'info'; }
    function n(value: number | string | null | undefined): string{ return Number(value||0).toLocaleString(); }
    function total(field: EnergyAccountingNumericFieldV58): number{ return accountingRecords.reduce((sum: number,row: EnergyAccountingRecordV58)=>sum+Number(row[field]||0),0); }

    function accountingRecordRow(r: EnergyAccountingRecordV58): string{ return `<div class="data-row energy-accounting-row-v160"><div><strong>${r.plant}</strong><small>${r.id}<br>${r.client}</small></div><div><strong>${r.period}</strong><small>${r.interval} · ${r.meter}</small></div><div><strong>${n(r.produced)} kWh</strong><small>Produced</small></div><div><strong>${n(r.self)} kWh</strong><small>Self-consumed</small></div><div><strong>${n(r.exported)} kWh</strong><small>Exported</small></div><div><strong>${n(r.imported)} kWh</strong><small>Imported</small></div><div><span class="badge ${tone(r.quality)}">${r.quality}</span><small>${r.accounting}</small></div><div><span class="badge ${tone(r.settlement)}">${r.settlement}</span></div></div>`; }
    function ledgerRow(l: EnergyLedgerRowV58): string{ return `<div class="data-row energy-ledger-row-v160"><div><strong>${l.id}</strong><small>${l.source}</small></div><div><strong>${l.type}</strong><small>${l.qty}</small></div><div><strong>${l.counterparty}</strong><small>${l.price}</small></div><div><strong>${l.amount}</strong></div><div><span class="badge ${tone(l.status)}">${l.status}</span></div></div>`; }
    const accountingRows = accountingRecords.map(accountingRecordRow).join('');
    const ledgerRows = ledger.map(ledgerRow).join('');

    function ensurePanel(id: string, className = 'modal'): HTMLElement{
      let el = document.getElementById(id);
      if(!el){ el = document.createElement('div'); el.id = id; el.className = className; document.body.appendChild(el); }
      return el;
    }
    function closePanel(id: string): void{ const el = document.getElementById(id); if(el) el.classList.remove('open'); }
    function fieldValue(id: string): string{ const input = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null; return (input?.value || '').trim(); }

    window.EnergyAccounting = {
      openCorrection(){
        const modal = ensurePanel('energyAccountingModal');
        modal.innerHTML = `<div class="modal-card"><button class="modal-close" type="button" onclick="EnergyAccounting.closeModal()">×</button><div class="panel-head"><div><h2>Correction Record</h2><p>Create a controlled correction instead of overwriting closed accounting data.</p></div><span class="badge warning">Pending Review</span></div><div class="client-form-grid two-col"><label>Plant<select id="corPlant"><option>Arpi Rooftop 01</option><option>Residential PV</option><option>Green Valley East</option><option>Storage Pilot</option></select></label><label>Accounting Period<select id="corPeriod"><option>June 2026</option><option>May 2026</option><option>Custom Period</option></select></label><label>Record Type<select id="corType"><option>Production</option><option>Export</option><option>Import</option><option>Self Consumption</option><option>Battery Charge</option><option>Battery Discharge</option></select></label><label>Source Meter<input id="corMeter" value="Grid Meter GM-001" /></label><label>Original Value, kWh<input id="corOriginal" type="number" value="84800" /></label><label>Corrected Value, kWh<input id="corCorrected" type="number" value="85120" /></label><label class="wide-field">Reason<select id="corReason"><option>Meter backfill received</option><option>Vendor correction</option><option>Manual meter read</option><option>Missing interval recovered</option><option>Duplicate interval removed</option></select></label><label class="wide-field">Evidence / Comment<input id="corEvidence" value="Attach meter report or operator note in production version" /></label></div><div class="modal-actions"><button class="secondary-action" type="button" onclick="EnergyAccounting.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="EnergyAccounting.saveCorrection()">Save Correction Draft</button></div></div>`;
        modal.classList.add('open');
      },
      saveCorrection(){
        const original = Number(fieldValue('corOriginal') || 0);
        const corrected = Number(fieldValue('corCorrected') || 0);
        const diff = corrected - original;
        const plant = fieldValue('corPlant') || 'Arpi Rooftop 01';
        const rec: EnergyAccountingRecordV58 = { id:`COR-${new Date().getFullYear()}-${String(accountingRecords.length+1).padStart(4,'0')}`, tenant:'Tenant Alpha Energy', client: plant === 'Residential PV' ? 'Ivan Petrov' : 'Arpi Solar Group', plant, period:fieldValue('corPeriod') || 'June 2026', interval:'Correction', meter:fieldValue('corMeter') || 'Manual correction', produced: fieldValue('corType') === 'Production' ? corrected : 0, self: fieldValue('corType') === 'Self Consumption' ? corrected : 0, exported: fieldValue('corType') === 'Export' ? corrected : 0, imported: fieldValue('corType') === 'Import' ? corrected : 0, bessIn: fieldValue('corType') === 'Battery Charge' ? corrected : 0, bessOut: fieldValue('corType') === 'Battery Discharge' ? corrected : 0, quality:'Corrected', accounting:'Pending Review', settlement:'Blocked' };
        accountingRecords.push(rec);
        document.getElementById('accountingRecordsTable')?.insertAdjacentHTML('beforeend', accountingRecordRow(rec));
        window.EnergyAccounting.closeModal();
        ZentridLayout.toast(`Correction draft ${rec.id} created · Δ ${diff.toLocaleString()} kWh`);
      },
      runAccounting(){
        const modal = ensurePanel('energyAccountingModal');
        modal.innerHTML = `<div class="modal-card"><button class="modal-close" type="button" onclick="EnergyAccounting.closeModal()">×</button><div class="panel-head"><div><h2>Energy Accounting Run</h2><p>Validate meters, create accounting records and prepare the period for settlement.</p></div><span class="badge info">Wizard</span></div><div class="commercial-governance-flow-v99 energy-flow-v160"><article><span>01</span><strong>Period</strong><small>Select accounting month</small></article><article><span>02</span><strong>Scope</strong><small>All or selected plants</small></article><article><span>03</span><strong>Validation</strong><small>Missing, estimated, invalid</small></article><article><span>04</span><strong>Records</strong><small>Create accounting rows</small></article></div><div class="client-form-grid two-col"><label>Accounting Period<select id="runPeriod"><option>June 2026</option><option>May 2026</option><option>April 2026</option></select></label><label>Plant Scope<select id="runScope"><option>All Plants</option><option>Only validated plants</option><option>Selected plants</option></select></label><label>Validation Policy<select id="runPolicy"><option>Block missing meter data</option><option>Allow estimated data with warning</option><option>Strict billing-ready only</option></select></label><label>Output Status<select id="runStatus"><option>Under Review</option><option>Approved</option><option>Locked</option></select></label></div><div class="info-grid commercial-spaced-v120"><div><span>Meter Checks</span><strong>4 passed · 1 warning</strong><small>Residential PV has estimated intervals.</small></div><div><span>Expected Records</span><strong>4 monthly records</strong><small>Production, self-use, export and import.</small></div><div><span>Settlement Readiness</span><strong>3 ready · 1 blocked</strong><small>Blocked records cannot create settlement.</small></div></div><div class="modal-actions"><button class="secondary-action" type="button" onclick="EnergyAccounting.closeModal()">Cancel</button><button class="primary-action" type="button" onclick="EnergyAccounting.startRun()">Start Accounting Run</button></div></div>`;
        modal.classList.add('open');
      },
      startRun(){
        const runId = `ACC-RUN-${(fieldValue('runPeriod') || 'June 2026').replace(/ /g,'-').toUpperCase()}`;
        window.EnergyAccounting.closeModal();
        const drawer = ensurePanel('energyAccountingDrawer','detail-drawer');
        drawer.innerHTML = `<button class="drawer-close" type="button" onclick="EnergyAccounting.closeDrawer()">×</button><p class="eyebrow">Accounting Run</p><h2>${runId}</h2><p class="muted">Run completed in demo mode. In production this would create versioned accounting records and validation logs.</p><div class="info-grid"><div><span>Period</span><strong>${fieldValue('runPeriod') || 'June 2026'}</strong></div><div><span>Scope</span><strong>${fieldValue('runScope') || 'All Plants'}</strong></div><div><span>Policy</span><strong>${fieldValue('runPolicy') || 'Block missing meter data'}</strong></div><div><span>Status</span><strong>${fieldValue('runStatus') || 'Under Review'}</strong></div></div><div class="modal-actions"><button class="primary-action" type="button" onclick="location.href='settlement-center.html'">Open Settlement Center</button></div>`;
        drawer.classList.add('open');
        ZentridLayout.toast('Monthly energy accounting run completed');
      },
      closeModal(){ closePanel('energyAccountingModal'); },
      closeDrawer(){ closePanel('energyAccountingDrawer'); }
    };

    ZentridLayout.mount(`
      <section class="page-hero"><div><p class="eyebrow">Global Admin · Financial Operations</p><h1>Energy Accounting</h1><p class="muted">Validated energy layer between Production and Billing. It stores accounting records, quality state, period close and settlement readiness before any invoice can be generated.</p></div><div class="toolbar"><button class="secondary-action" onclick="location.href='commercial-models.html'">Back to Commercial Models</button><button class="primary-action" onclick="EnergyAccounting.runAccounting()">Run Accounting</button></div></section>
      <section class="module-grid commercial-kpis-v78"><article class="kpi-card"><span>Produced</span><strong>${n(total('produced'))} kWh</strong><small>Current accounting period</small></article><article class="kpi-card"><span>Exported</span><strong>${n(total('exported'))} kWh</strong><small>Settlement candidate energy</small></article><article class="kpi-card"><span>Self-consumed</span><strong>${n(total('self'))} kWh</strong><small>Internal consumption offset</small></article><article class="kpi-card"><span>Accounting Status</span><strong>3 / 4 ready</strong><small>Validated, approved or locked</small></article></section>
      <section class="panel glass-card"><div class="panel-head"><div><h2>Production → Accounting → Settlement → Billing</h2><p>Billing should not consume raw production numbers directly. It should consume approved accounting records or settlement records.</p></div><span class="badge success">New bridge layer</span></div><div class="commercial-governance-flow-v99 energy-flow-v160"><article><span>01</span><strong>Production</strong><small>Raw and normalized telemetry</small></article><article><span>02</span><strong>Metering Validation</strong><small>Meter source, completeness, quality</small></article><article><span>03</span><strong>Accounting Record</strong><small>Produced, consumed, export, import</small></article><article><span>04</span><strong>Period Close</strong><small>Open → Review → Approved → Locked</small></article><article><span>05</span><strong>Settlement Ready</strong><small>Energy can be priced and invoiced</small></article></div></section>
      <section class="panel glass-card commercial-spaced-v120"><div class="panel-head"><div><h2>Accounting Records</h2><p>Each row is a billable energy fact with source meter, period, quality and settlement status.</p></div><button class="secondary-action" onclick="EnergyAccounting.openCorrection()">Add Correction</button></div><div class="data-table energy-accounting-table-v160" id="accountingRecordsTable"><div class="data-head energy-accounting-row-v160"><span>Plant / Client</span><span>Period / Source</span><span>Produced</span><span>Self-use</span><span>Export</span><span>Import</span><span>Quality</span><span>Settlement</span></div>${accountingRows}</div></section>
      <section class="panel glass-card commercial-spaced-v120"><div class="panel-head"><div><h2>Energy Ledger</h2><p>Ledger entries translate approved kWh into commercial facts used by Settlement Center.</p></div><button class="secondary-action" onclick="location.href='settlement-center.html'">Open Settlement Center</button></div><div class="data-table energy-ledger-table-v160"><div class="data-head energy-ledger-row-v160"><span>Ledger</span><span>Energy Type</span><span>Counterparty / Price</span><span>Amount</span><span>Status</span></div>${ledgerRows}</div></section>
      <section class="panel glass-card commercial-spaced-v120"><div class="panel-head"><div><h2>Close Controls</h2><p>Closed periods are immutable. Any change after close must be a correction record, not an overwrite.</p></div></div><div class="info-grid"><div><span>Period Lifecycle</span><strong>Open → Under Review → Approved → Locked → Closed</strong><small>Controls invoice reliability.</small></div><div><span>Quality States</span><strong>Validated · Estimated · Missing · Rejected · Corrected</strong><small>Separates billable data from operational telemetry.</small></div><div><span>Source of Truth</span><strong>Smart Meter / Grid Meter / BESS Meter</strong><small>Production chart is not enough for billing.</small></div><div><span>Downstream Consumer</span><strong>Settlement Center, Billing Engine, Reports</strong><small>Invoices use locked snapshots.</small></div></div></section>
    `);
