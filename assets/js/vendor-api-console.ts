function renderVendorApiConsole(): string {
  return `<section class="page-hero">
    <div>
      <p class="eyebrow">Deprecated</p>
      <h1>Vendor API Console Disabled</h1>
      <p class="muted">Direct DeyeCloud, Huawei and SolarX endpoints are not present in the provided Swagger snapshot, so this console was removed from the active API surface. Use Platform API Console and ProviderIntegrations instead.</p>
    </div>
    <a class="create-action" href="api-console.html"><span class="pulse"></span><div><strong>Open Platform API Console</strong><small>Active Swagger endpoints only</small></div></a>
  </section>

  <section class="panel glass-card">
    <div class="panel-head"><div><h2>Active replacement</h2><p>Provider work now goes through templates and provider integration lifecycle endpoints.</p></div></div>
    <div class="data-table compact-table api-method-table">
      <div class="data-head"><span>Area</span><span>Active endpoint family</span><span>Status</span></div>
      <div class="data-row"><strong>Provider templates</strong><span><code>/api/admin/provider-integrations/templates</code></span><span class="badge success">Active</span></div>
      <div class="data-row"><strong>Provider integrations</strong><span><code>/api/admin/provider-integrations</code></span><span class="badge success">Active</span></div>
      <div class="data-row"><strong>Live integration summary</strong><span><code>/api/integrations</code></span><span class="badge success">Active</span></div>
    </div>
  </section>`;
}

function wireVendorApiConsole(): void {}

window.renderVendorApiConsole = renderVendorApiConsole;
window.wireVendorApiConsole = wireVendorApiConsole;
