const defaults = [
      { key:'chargers', icon:'🔌', name:'Chargers', type:'EV Charging', status:'Draft', description:'Future EV charging registry with its own columns and create form.' },
      { key:'smart-home', icon:'🏠', name:'Smart Home', type:'Smart Home', status:'Draft', description:'Future Smart Home registry and dedicated onboarding flow.' },
      { key:'bess', icon:'🔋', name:'BESS', type:'Storage', status:'Draft', description:'Future storage device group; storage devices remain visible in Device List.' }
    ];
    function groups(){
      try { return JSON.parse(localStorage.getItem('zentrid_sidebar_groups') || '[]'); } catch(e){ return []; }
    }
    const key = new URLSearchParams(location.search).get('group');
    const group = [...groups(), ...defaults].find(g => g.key === key) || { icon:'🧩', name:'Custom Group', type:'Custom', status:'Draft', description:'Custom group registry placeholder.' };
    FleetLayout.mount(`
      <section class="page-hero"><div><p class="eyebrow">Global Admin · Groups</p><h1>${group.icon || '🧩'} ${group.name}</h1><p class="muted">${group.description || 'This group is prepared as a separate registry. Its own table, filters, create form and detail page will be designed separately.'}</p></div><button class="secondary-btn" onclick="location.href='groups.html'">Back to Groups</button></section>
      <section class="context-bar glass-card"><button class="ctx-item"><span>Group Type</span><strong>${group.type || 'Custom'}</strong></button><button class="ctx-item"><span>Status</span><strong>${group.status || 'Draft'}</strong></button><button class="ctx-item"><span>Objects</span><strong>${group.objects || 0}</strong></button><button class="ctx-item"><span>Sidebar</span><strong>${group.show ? 'Visible' : 'Hidden'}</strong></button></section>
      <section class="panel glass-card"><div class="panel-head"><div><h2>${group.name} Registry</h2><p>This is a placeholder registry. We keep it separate from Plants because this group will have its own fields, filters, detail page and create wizard.</p></div><button class="create-action" type="button"><span class="pulse"></span><div><strong>+ Add ${group.name}</strong><small>Dedicated wizard later</small></div></button></div><div class="empty-state-card"><strong>No ${group.name} objects yet</strong><small>Use Groups to configure sidebar visibility. The real registry will be added when this group type is defined.</small></div></section>
    `);
