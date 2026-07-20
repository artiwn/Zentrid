window.renderUIFieldDictionary().then((html: string) => window.FleetLayout.mount(html)).catch((err: Error) => {
    window.FleetLayout.mount(`<section class="panel glass-card"><h1>UI Field Dictionary</h1><p class="muted">Failed to load JSON dictionaries: ${err.message}</p></section>`);
  });
