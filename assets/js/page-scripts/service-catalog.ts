(() => {
interface ServiceCatalogRow { [key: string]: string; }
interface ZentridServiceCatalogWindowApi { toast(msg: string): void; open(type: string, title: string, meta: string): void; }
const serviceCatalog: ServiceCatalogRow[] = [
      {code:'SRV-MON', name:'Fleet Monitoring', category:'Operations', package:'Core Operations', billing:'Subscription', sla:'Standard', status:'Active'},
      {code:'SRV-PM', name:'Preventive Maintenance', category:'Maintenance', package:'O&M Care', billing:'Per plant / schedule', sla:'Premium', status:'Active'},
      {code:'SRV-CM', name:'Corrective Maintenance', category:'Maintenance', package:'Incident Response', billing:'Work order based', sla:'Premium', status:'Active'},
      {code:'SRV-DIAG', name:'Remote Diagnostics', category:'Technical', package:'Advanced Operations', billing:'Usage based', sla:'Critical', status:'Active'},
      {code:'SRV-REP', name:'Reporting & Export', category:'Reporting', package:'Commercial Insights', billing:'Included / add-on', sla:'Standard', status:'Review'},
      {code:'SRV-ENERGY', name:'Energy Analytics', category:'Analytics', package:'Performance Insights', billing:'Per MW', sla:'Standard', status:'Active'}
    ];
    const categories: ServiceCatalogRow[] = [
      {name:'Operations', owner:'Global Operations', services:'1', lifecycle:'Active', visibility:'Tenant + Client', status:'Active'},
      {name:'Maintenance', owner:'O&M Office', services:'2', lifecycle:'Active', visibility:'Tenant only', status:'Active'},
      {name:'Technical', owner:'Engineering', services:'1', lifecycle:'Controlled', visibility:'Tenant only', status:'Active'},
      {name:'Reporting', owner:'Commercial Ops', services:'1', lifecycle:'Review', visibility:'Tenant + Client', status:'Review'},
      {name:'Analytics', owner:'Data Governance', services:'1', lifecycle:'Active', visibility:'Tenant + Client', status:'Active'}
    ];
    const packages: ServiceCatalogRow[] = [
      {name:'Core Operations', includes:'Fleet Monitoring · Basic alerts · Monthly summary', target:'SMB / standard tenants', price:'Mapped in Pricing', status:'Active'},
      {name:'O&M Care', includes:'Preventive maintenance · SLA response · work orders', target:'Managed plants', price:'Per plant / MW', status:'Active'},
      {name:'Advanced Operations', includes:'Remote diagnostics · performance checks · RCA support', target:'Enterprise tenants', price:'Usage + subscription', status:'Active'},
      {name:'Commercial Insights', includes:'Reports · export · payment-ready summaries', target:'Owners / finance teams', price:'Add-on', status:'Review'}
    ];
    const slaMapping: ServiceCatalogRow[] = [
      {service:'Fleet Monitoring', severity:'Warning', response:'4 h', resolution:'Best effort', escalation:'Tenant Admin', status:'Active'},
      {service:'Corrective Maintenance', severity:'Critical', response:'15 min', resolution:'4 h', escalation:'Operations Manager', status:'Active'},
      {service:'Remote Diagnostics', severity:'Major', response:'1 h', resolution:'24 h', escalation:'L2 Engineer', status:'Active'},
      {service:'Preventive Maintenance', severity:'Scheduled', response:'Planned', resolution:'Per schedule', escalation:'O&M Coordinator', status:'Active'}
    ];
    const availability: ServiceCatalogRow[] = [
      {service:'Fleet Monitoring', tenants:'All Tenants', countries:'All Regions', clients:'All active clients', dependency:'Integration active', status:'Available'},
      {service:'Preventive Maintenance', tenants:'Managed O&M only', countries:'Armenia · EU', clients:'Contracted clients', dependency:'Agreement active', status:'Available'},
      {service:'Remote Diagnostics', tenants:'Enterprise tenants', countries:'All Regions', clients:'Premium package', dependency:'Device telemetry', status:'Limited'},
      {service:'Energy Analytics', tenants:'Commercial tenants', countries:'All Regions', clients:'Analytics package', dependency:'Accounting data', status:'Available'}
    ];
    const lifecycle: ServiceCatalogRow[] = [
      {service:'Reporting & Export', version:'v1.4', stage:'Review', next:'Approve templates', owner:'Commercial Ops', status:'Review'},
      {service:'Remote Diagnostics', version:'v2.1', stage:'Active', next:'Add BESS diagnostics', owner:'Engineering', status:'Active'},
      {service:'Energy Analytics', version:'v1.8', stage:'Active', next:'Pricing mapping', owner:'Data Governance', status:'Active'}
    ];
    const audit: ServiceCatalogRow[] = [
      {time:'Today · 12:20', actor:'Global Admin', action:'Service package updated', entity:'O&M Care', status:'Completed'},
      {time:'Yesterday · 15:05', actor:'Commercial Admin', action:'SLA mapping changed', entity:'Corrective Maintenance', status:'Completed'},
      {time:'10 Jun 2026', actor:'Global Admin', action:'Service created', entity:'Energy Analytics', status:'Completed'}
    ];

    function tone(v: unknown): string{
      const value = String(v||'').toLowerCase();
      if(value.includes('active')||value.includes('available')||value.includes('completed')) return 'success';
      if(value.includes('review')||value.includes('limited')||value.includes('controlled')) return 'warning';
      if(value.includes('blocked')||value.includes('inactive')) return 'danger';
      return 'info';
    }
    function status(v: unknown): string{ return `<span class="badge ${tone(v)}">${v}</span>`; }
    function actions(label: string, call: string): string{ return `<div class="row-actions kebabified service-catalog-actions-cell-v125"><button class="small-btn" type="button" onclick="ZentridServiceCatalogV125.${call}">${label}</button></div>`; }
    function table(heads: string[], rows: string[], cls = 'service-catalog-table-v125'): string{ return `<div class="data-table ${cls}"><div class="data-head">${heads.map(h=>`<span>${h}</span>`).join('')}</div>${rows.join('')}</div>`; }
    function title(h: string, p: string, btn?: string): string{ return `<div class="section-title-v17 service-title-v125"><div><h2>${h}</h2><p class="muted">${p}</p></div>${btn||''}</div>`; }
    function kpis(): string{
      return `<section class="module-grid service-kpis-v125">
        <article class="module-card"><span>Active Services</span><strong>5</strong><small>1 service under review</small></article>
        <article class="module-card"><span>Service Packages</span><strong>4</strong><small>Commercially reusable bundles</small></article>
        <article class="module-card"><span>SLA Mappings</span><strong>4</strong><small>Linked to operations response</small></article>
        <article class="module-card"><span>Catalog Coverage</span><strong>82%</strong><small>Ready for pricing mapping</small></article>
      </section>`;
    }
    function overview(): string{
      return title('Service Catalog Overview','Define what Zentrid sells or provides: services, packages, SLA mappings, availability and lifecycle.',`<button class="primary-action" onclick="ZentridServiceCatalogV125.toast('Service editor opened')">Create Service</button>`)+
      kpis()+
      `<div class="service-flow-v125">
        <article><span>01</span><strong>Service</strong><small>Operational or commercial capability</small></article>
        <article><span>02</span><strong>Package</strong><small>Bundle for client / tenant offer</small></article>
        <article><span>03</span><strong>SLA</strong><small>Response and resolution commitments</small></article>
        <article><span>04</span><strong>Agreement</strong><small>Contractual binding with client or tenant</small></article>
        <article><span>05</span><strong>Pricing</strong><small>Mapped later to plans and billing rules</small></article>
      </div>
      <div class="section-title-v17 mini service-title-v125"><div><h3>Catalog Summary</h3><p class="muted">Current configuration used by Commercial Agreements and Payment/Billing flows.</p></div></div>
      <div class="info-grid service-info-grid-v125">
        <div><span>Default Lifecycle</span><strong>Draft → Review → Active → Archived</strong><small>Every service should have a clear approval state.</small></div>
        <div><span>Pricing Dependency</span><strong>Pricing model required</strong><small>Active services can be mapped to pricing and subscription plans.</small></div>
        <div><span>SLA Dependency</span><strong>Operations linked</strong><small>Maintenance and incident services should map to SLA rules.</small></div>
        <div><span>Agreement Dependency</span><strong>Contract required</strong><small>Client-facing services should be attached to agreements.</small></div>
      </div>`;
    }
    function services(): string{
      return title('Service Catalog','Master list of services that can be sold, bundled, mapped to SLA and connected to agreements.',`<button class="secondary-action" onclick="ZentridServiceCatalogV125.toast('New service form opened')">Add Service</button>`)+
      table(['Service','Category / Package','Billing Logic','SLA','Status','Actions'], serviceCatalog.map(s=>`<div class="data-row service-catalog-row-v125"><div><strong>${s.name}</strong><small>${s.code}</small></div><div><strong>${s.category}</strong><small>${s.package}</small></div><div><strong>${s.billing}</strong><small>Commercial mapping</small></div><div>${status(s.sla)}</div><div>${status(s.status)}</div>${actions('Open',`open('Service','${s.name}','${s.category} · ${s.package}')`)}</div>`));
    }
    function categoryTab(): string{
      return title('Service Categories','Organize service responsibility, visibility and lifecycle by business domain.',`<button class="secondary-action" onclick="ZentridServiceCatalogV125.toast('Category editor opened')">Add Category</button>`)+
      table(['Category','Owner','Services','Visibility','Status','Actions'], categories.map(c=>`<div class="data-row service-catalog-row-v125"><div><strong>${c.name}</strong><small>${c.lifecycle}</small></div><div><strong>${c.owner}</strong><small>Owner team</small></div><div><strong>${c.services}</strong><small>Linked services</small></div><div><strong>${c.visibility}</strong><small>Portal scope</small></div><div>${status(c.status)}</div>${actions('Open',`open('Service Category','${c.name}','${c.owner} · ${c.visibility}')`)}</div>`));
    }
    function packageTab(): string{
      return title('Service Packages','Reusable bundles that later connect to pricing models, subscriptions and agreements.',`<button class="secondary-action" onclick="ZentridServiceCatalogV125.toast('Package builder opened')">Add Package</button>`)+
      table(['Package','Included Services','Target Segment','Pricing','Status','Actions'], packages.map(p=>`<div class="data-row service-package-row-v125"><div><strong>${p.name}</strong><small>Service package</small></div><div><small>${p.includes}</small></div><div><strong>${p.target}</strong><small>Commercial scope</small></div><div><strong>${p.price}</strong><small>Pricing dependency</small></div><div>${status(p.status)}</div>${actions('Open',`open('Service Package','${p.name}','${p.includes}')`)}</div>`), 'service-package-table-v125');
    }
    function slaTab(): string{
      return title('Service SLA Mapping','Connect service catalog entries to response and resolution commitments for operations.',`<button class="secondary-action" onclick="ZentridServiceCatalogV125.toast('SLA mapping editor opened')">Add SLA Mapping</button>`)+
      table(['Service','Severity','Response','Resolution','Escalation','Actions'], slaMapping.map(s=>`<div class="data-row service-catalog-row-v125"><div><strong>${s.service}</strong><small>Mapped service</small></div><div>${status(s.severity)}</div><div><strong>${s.response}</strong><small>Response time</small></div><div><strong>${s.resolution}</strong><small>Resolution target</small></div><div><strong>${s.escalation}</strong><small>${s.status}</small></div>${actions('Open',`open('SLA Mapping','${s.service}','${s.severity} · ${s.response} / ${s.resolution}')`)}</div>`));
    }
    function availabilityTab(): string{
      return title('Service Availability','Define where each service is available by tenant, country, client segment and data dependency.',`<button class="secondary-action" onclick="ZentridServiceCatalogV125.toast('Availability rule editor opened')">Add Rule</button>`)+
      table(['Service','Tenants','Countries','Clients','Dependency','Status'], availability.map(a=>`<div class="data-row service-catalog-row-v125"><div><strong>${a.service}</strong><small>Service</small></div><div><strong>${a.tenants}</strong><small>Tenant scope</small></div><div><strong>${a.countries}</strong><small>Geo scope</small></div><div><strong>${a.clients}</strong><small>Client segment</small></div><div><strong>${a.dependency}</strong><small>Required condition</small></div><div>${status(a.status)}</div></div>`));
    }
    function lifecycleTab(): string{
      return title('Service Lifecycle','Control service versions, ownership, review state and next release actions.',`<button class="secondary-action" onclick="ZentridServiceCatalogV125.toast('Lifecycle change request opened')">Create Change</button>`)+
      table(['Service','Version','Stage','Next Action','Owner','Actions'], lifecycle.map(l=>`<div class="data-row service-catalog-row-v125"><div><strong>${l.service}</strong><small>${l.version}</small></div><div><strong>${l.version}</strong><small>Catalog version</small></div><div>${status(l.stage)}</div><div><strong>${l.next}</strong><small>Next step</small></div><div><strong>${l.owner}</strong><small>${l.status}</small></div>${actions('Open',`open('Lifecycle Record','${l.service}','${l.stage} · ${l.next}')`)}</div>`));
    }
    function auditLog(): string{
      return title('Audit Log','Immutable trace of service catalog, package and SLA configuration changes.',`<button class="secondary-action" onclick="ZentridServiceCatalogV125.toast('Service catalog audit export prepared')">Export Audit</button>`)+
      table(['Timestamp','Actor','Action','Entity','Status','Actions'], audit.map(a=>`<div class="data-row service-catalog-row-v125"><div><strong>${a.time}</strong><small>Timestamp</small></div><div><strong>${a.actor}</strong><small>Actor</small></div><div><strong>${a.action}</strong><small>Action</small></div><div><strong>${a.entity}</strong><small>Entity</small></div><div>${status(a.status)}</div>${actions('Open',`open('Audit Record','${a.action}','${a.entity}')`)}</div>`));
    }
    function content(tab: string): string{
      return tab==='services'?services():tab==='categories'?categoryTab():tab==='packages'?packageTab():tab==='sla'?slaTab():tab==='availability'?availabilityTab():tab==='lifecycle'?lifecycleTab():tab==='audit'?auditLog():overview();
    }
    window.ZentridServiceCatalogV125 = {
      toast(msg: string): void{ if(window.ZentridLayout && ZentridLayout.toast) ZentridLayout.toast(msg); else alert(msg); },
      open(type: string, title: string, meta: string): void{
        const layout = ZentridLayout as unknown as ZentridLayoutLegacyApi;
        if(window.ZentridLayout && layout.drawer){
          layout.drawer(type, {Title:title, Context:meta, Status:'Mock detail'}, '<div class="drawer-action-grid"><button>Edit Draft</button><button>Validate</button><button>Map Pricing</button><button>View Audit</button></div>');
        } else this.toast(type+': '+title);
      }
    };
    ZentridLayout.mount(`<section class="page-hero"><div><p class="eyebrow">Global Admin · Financial Operations</p><h1>Service Catalog</h1><p class="muted">Services, categories, packages, SLA mapping, availability, lifecycle and audit for commercial operations.</p></div><button class="secondary-action" onclick="location.href='commercial-agreements.html'">Back to Agreements</button></section><section class="plant-workspace-v17 service-catalog-workspace-v125"><aside class="glass-card plant-side-card-v17 service-catalog-side-v125"><h3>Service Workspace</h3><button class="active" data-service-catalog-tab="overview">Overview</button><button data-service-catalog-tab="services">Service Catalog</button><button data-service-catalog-tab="categories">Service Categories</button><button data-service-catalog-tab="packages">Service Packages</button><button data-service-catalog-tab="sla">Service SLA Mapping</button><button data-service-catalog-tab="availability">Service Availability</button><button data-service-catalog-tab="lifecycle">Service Lifecycle</button><button data-service-catalog-tab="audit">Audit Log</button></aside><section class="glass-card plant-main-card-v17 service-catalog-main-card-v125" id="serviceCatalogContent">${content('overview')}</section></section>`);
    document.addEventListener('click', (e: MouseEvent)=>{
      const b = (e.target instanceof Element ? e.target.closest('[data-service-catalog-tab]') : null) as HTMLElement | null;
      if(!b) return;
      document.querySelectorAll('[data-service-catalog-tab]').forEach(x=>x.classList.toggle('active',x===b));
      const serviceCatalogContent = document.getElementById('serviceCatalogContent');
      if(serviceCatalogContent) serviceCatalogContent.innerHTML=content(b.dataset.serviceCatalogTab || 'overview');
    });

})();
