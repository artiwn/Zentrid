window.renderUIFieldDictionary().then((html: string) => window.ZentridLayout.mount(html)).catch((err: Error) => {
    window.ZentridLayout.mount(`<section class="panel glass-card"><h1>UI Field Dictionary</h1><p class="muted">Failed to load JSON dictionaries: ${err.message}</p></section>`);
  });
