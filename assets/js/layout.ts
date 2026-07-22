type ZentridSidebarGroup = {
  key: string;
  icon?: string;
  name: string;
  type?: string;
  status?: string;
  show?: boolean;
  system?: boolean;
};

type ZentridNavItem = {
  icon: string;
  label: string;
  href: string;
  key: string;
  dynamicGroupKey?: string;
};

type ZentridNavGroup = {
  section: string;
  items: ZentridNavItem[];
};

type ZentridMenuItem = {
  label: string;
  value: string;
  action?: string;
};

type ZentridContextState = {
  tenant: string;
  time: string;
  region: string;
};

type ZentridSearchItem = {
  type: string;
  label: string;
  meta: string;
  action: string;
  keywords?: string[];
};

type ZentridScoredSearchItem = ZentridSearchItem & { score: number };

type FloatingKebabMenu = HTMLElement & {
  __zentridHome?: {
    parent: ParentNode;
    next: ChildNode | null;
  };
};

function layoutEventTarget(event: Event): Element | null {
  return event.target instanceof Element ? event.target : null;
}

function layoutErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const ZentridLayout = (() => {
  const basePath = window.location.pathname.includes('/pages/') ? '../' : '';
  const current = window.location.pathname.split('/').pop() || 'index.html';

  function sidebarGroupItems(): ZentridSidebarGroup[] {
    const defaults: ZentridSidebarGroup[] = [
      { key:'plants', icon:'☀️', name:'Plants', type:'Plant', status:'Active', show:true, system:true },
      { key:'chargers', icon:'🔌', name:'Chargers', type:'EV Charging', status:'Draft', show:false },
      { key:'smart-home', icon:'🏠', name:'Smart Home', type:'Smart Home', status:'Draft', show:false },
      { key:'bess', icon:'🔋', name:'BESS', type:'Storage', status:'Draft', show:false }
    ];
    try {
      const saved = JSON.parse(localStorage.getItem('zentrid_sidebar_groups') || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) {}
    return defaults;
  }

  function customSidebarItems(): ZentridNavItem[] {
    return sidebarGroupItems()
      .filter(g => g.show && g.key !== 'plants')
      .map(g => ({
        icon: g.icon || '🧩',
        label: g.name,
        href: basePath + 'pages/group-detail.html?group=' + encodeURIComponent(g.key),
        key: 'group-detail.html',
        dynamicGroupKey: g.key
      }));
  }

  const managedGroups = sidebarGroupItems();
  const plantGroup = managedGroups.find(g => g.key === 'plants');

  const tenantManagementItems: ZentridNavItem[] = [
    { icon: '🏢', label: 'Tenant Registry', href: basePath + 'pages/tenants.html', key: 'tenants.html' },
    { icon: '👤', label: 'Client Registry', href: basePath + 'pages/clients.html', key: 'clients.html' },
    ...(plantGroup?.show !== false ? [{ icon: '☀️', label: 'Plants', href: basePath + 'pages/plants.html?view=solar', key: 'plants.html' }] : []),
    { icon: '🔌', label: 'Device List', href: basePath + 'pages/devices.html', key: 'devices.html' },
    { icon: '🚨', label: 'Alerts', href: basePath + 'pages/alerts.html', key: 'alerts.html' },
    { icon: '⚡', label: 'Production', href: basePath + 'pages/production.html', key: 'production.html' },
    { icon: '🧩', label: 'Groups', href: basePath + 'pages/groups.html', key: 'groups.html' },
    ...customSidebarItems()
  ];

  const nav: ZentridNavGroup[] = [
    { section: 'Dashboard', items: [
      { icon: '🏠', label: 'Platform Overview', href: basePath + 'index.html', key: 'index.html' },
      { icon: '🔗', label: 'Platform API Console', href: basePath + 'pages/api-console.html', key: 'api-console.html' },
    ] },
    { section: 'Tenant Management', items: tenantManagementItems },
    { section: 'Integration Governance', items: [
      { icon: '🌐', label: 'Connector Registry', href: basePath + 'pages/integrations.html', key: 'integrations.html' },
      { icon: '🛠', label: 'Connector Operations', href: basePath + 'pages/integration-operations.html', key: 'integration-operations.html' },
      { icon: '🗄️', label: 'Integration Archive', href: basePath + 'pages/archive-integrations.html', key: 'archive-integrations.html' }
    ] },
    { section: 'Data Governance', items: [
      { icon: '🧭', label: 'Data Governance Center', href: basePath + 'pages/data-governance.html', key: 'data-governance.html' },
      { icon: '⚡', label: 'Production Normalization', href: basePath + 'pages/production-normalization.html', key: 'production-normalization.html' },
      { icon: '🔋', label: 'Storage Normalization', href: basePath + 'pages/storage-normalization.html', key: 'storage-normalization.html' },
      { icon: '📚', label: 'Alert Dictionary', href: basePath + 'pages/alert-dictionary.html', key: 'alert-dictionary.html' },
      { icon: '🚦', label: 'Incident Normalization', href: basePath + 'pages/alert-normalization.html', key: 'alert-normalization.html' },
      { icon: '🧪', label: 'Data Quality Center', href: basePath + 'pages/data-quality.html', key: 'data-quality.html' }
    ] },
    { section: 'Operations Center', items: [
      { icon: '🚨', label: 'Incident Governance', href: basePath + 'pages/incident-center.html', key: 'incident-center.html' },
      { icon: '✅', label: 'Work Order Oversight', href: basePath + 'pages/work-orders.html', key: 'work-orders.html' },
      { icon: '🧭', label: 'SOP Templates', href: basePath + 'pages/sop-center.html', key: 'sop-center.html' }
    ] },
    { section: 'Financial Operations', items: [
      { icon: '🏷️', label: 'Tariff Plans', href: basePath + 'pages/tariff-plans.html', key: 'tariff-plans.html' },
      { icon: '🧾', label: 'Billing Management', href: basePath + 'pages/billing-management.html', key: 'billing-management.html' },
      { icon: '📄', label: 'Invoice Center', href: basePath + 'pages/invoice-center.html', key: 'invoice-center.html' },
      { icon: '💳', label: 'Payment Settings', href: basePath + 'pages/payment-settings.html', key: 'payment-settings.html' },
      { icon: '💰', label: 'Revenue & Settlements', href: basePath + 'pages/revenue-settlements.html', key: 'revenue-settlements.html' }
    ] },
    { section: 'Platform Governance', items: [
      { icon: '🛡️', label: 'User & Access Governance', href: basePath + 'pages/users.html', key: 'users.html' },
      { icon: '🧾', label: 'Platform Audit Center', href: basePath + 'pages/audit-center.html', key: 'audit-center.html' },
      { icon: '⚙️', label: 'Platform Settings', href: basePath + 'pages/settings.html', key: 'settings.html' }
    ] }
  ];

  const state: ZentridContextState = {
    tenant: localStorage.getItem('zentrid_tenant') || 'All Tenants',
    time: localStorage.getItem('zentrid_time') || 'Last 24h',
    region: localStorage.getItem('zentrid_region') || 'All Regions'
  };


  const SIDEBAR_SCROLL_KEY = 'zentrid_sidebar_scroll_top';

  function saveSidebarScroll() {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;
    sessionStorage.setItem(SIDEBAR_SCROLL_KEY, String(sidebarEl.scrollTop || 0));
  }

  function restoreSidebarScroll() {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;
    const savedTop = Number(sessionStorage.getItem(SIDEBAR_SCROLL_KEY) || 0);
    requestAnimationFrame(() => {
      sidebarEl.scrollTop = Number.isFinite(savedTop) ? savedTop : 0;
    });
  }

  function wireSidebarScrollMemory() {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;
    restoreSidebarScroll();

    let scrollTimer = 0;
    sidebarEl.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(saveSidebarScroll, 80);
    }, { passive: true });

    sidebarEl.querySelectorAll('a.nav-item').forEach(link => {
      link.addEventListener('pointerdown', saveSidebarScroll);
      link.addEventListener('click', saveSidebarScroll);
    });

    window.addEventListener('beforeunload', saveSidebarScroll);
  }

  function sidebar() {
    return `
      <aside class="sidebar" id="sidebar">
        <button class="brand" id="goHome" type="button">
          <div class="brand-mark">Z</div>
          <div>
            <div class="brand-name">Zentrid</div>
            <div class="brand-subtitle">Global Admin Console</div>
          </div>
        </button>
        <nav class="side-nav">
          ${nav.map(group => `
            <div class="nav-group">
              <div class="nav-section">${group.section}</div>
              ${group.items.map(item => `
                <a class="nav-item ${(current === item.key || (current === 'incident-detail.html' && item.key === 'incident-center.html') || (current === 'work-order-detail.html' && item.key === 'work-orders.html')) && (!item.dynamicGroupKey || new URLSearchParams(window.location.search).get('group') === item.dynamicGroupKey) ? 'active' : ''}" href="${item.href}">
                  <span class="nav-icon">${item.icon}</span>
                  <span>${item.label}</span>
                </a>
              `).join('')}
            </div>
          `).join('')}
        </nav>
      </aside>`;
  }

  function menu(id: string, items: ZentridMenuItem[]): string {
    return `<div class="dropdown-menu" id="${id}">${items.map(x => `<button type="button" data-value="${x.value}" data-action="${x.action || ''}">${x.label}</button>`).join('')}</div>`;
  }

  function currentUserLabel(): string {
    const user = window.ZentridAuth?.getUser?.() || {};
    return user.fullName || user.full_name || user.name || user.username || 'Global Admin';
  }

  function currentUserInitials(): string {
    return String(currentUserLabel()).split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('').toUpperCase() || 'GA';
  }

  function currentUserRole(): string {
    const session = window.ZentridAuth?.getSession?.() || {};
    const user = window.ZentridAuth?.getUser?.() || {};
    return user.role || user.userRole || user.roleName || session.role || 'GlobalAdmin';
  }

  function currentUserEmail(): string {
    const session = window.ZentridAuth?.getSession?.() || {};
    const claims = session.claims || {};
    const user = window.ZentridAuth?.getUser?.() || {};
    return user.email || claims.email || claims.unique_name || '';
  }

  function header() {
    return `
      <header class="topbar">
        <button class="icon-btn" id="toggleSidebar" aria-label="Toggle sidebar">☰</button>
        <div class="search-wrap">
          <div class="search-box"><span>⌕</span><input id="globalSearch" autocomplete="off" placeholder="Search tenants, clients, connectors, plants, devices, normalization, incidents, payments..." /></div>
          <div class="search-results" id="searchResults"></div>
        </div>
        <div class="topbar-actions">
          <div class="menu-wrap">
            <button class="context-pill" id="tenantBtn">Scope: <strong id="tenantLabel">${state.tenant}</strong> ▾</button>
            ${menu('tenantMenu', [
              { label: 'All Tenants', value: 'All Tenants' }
            ])}
          </div>
          <div class="menu-wrap">
            <button class="context-pill" id="timeBtn"><strong id="timeLabel">${state.time}</strong> ▾</button>
            ${menu('timeMenu', [
              { label: 'Today', value: 'Today' },
              { label: 'Last 24h', value: 'Last 24h' },
              { label: '7 days', value: '7 days' },
              { label: '30 days', value: '30 days' },
              { label: 'Custom Range', value: 'Custom Range' }
            ])}
          </div>
          <div class="menu-wrap">
            <button class="notification-btn" id="notifyBtn" aria-label="Notifications">🔔</button>
            <div class="dropdown-menu wide" id="notifyMenu">
              <div class="dropdown-title">Global Admin Notifications</div>
              <div class="empty-state compact"><strong>No API notifications</strong><small>A notification endpoint is not connected.</small></div>
            </div>
          </div>
          <div class="menu-wrap">
            <button class="profile-btn" id="profileBtn"><span class="avatar" id="profileAvatar">${currentUserInitials()}</span><span id="profileName">${currentUserLabel()}</span>▾</button>
            <div class="dropdown-menu wide" id="profileMenu">
              <div class="dropdown-title"><strong id="profileMenuName">${currentUserLabel()}</strong><small id="profileMenuRole">${currentUserRole()}${currentUserEmail() ? ' · ' + currentUserEmail() : ''}</small></div>
              <button data-action="refresh-auth">🔐 Refresh Auth Profile</button>
              <button data-action="users">👤 RBAC / Access Scope</button>
              <button data-action="settings">⚙️ Platform Settings</button>
              <button data-action="audit">🧾 Audit Center</button>
              <button data-action="logout">↪ Logout</button>
            </div>
          </div>
        </div>
      </header>`;
  }

  function toast(message: string, requestedTone?: ZentridUXTone): void {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      t.setAttribute('aria-live', 'polite');
      t.setAttribute('aria-atomic', 'true');
      document.body.appendChild(t);
    }
    const tone = requestedTone || (typeof ZentridUX !== 'undefined' ? ZentridUX.inferTone(message) : 'info');
    const iconByTone: Record<ZentridUXTone, string> = { info:'i', success:'✓', warning:'△', danger:'!', neutral:'•' };
    t.className = `toast ${tone}`;
    t.setAttribute('role', tone === 'danger' ? 'alert' : 'status');
    t.replaceChildren();
    const icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = iconByTone[tone];
    const copy = document.createElement('span');
    copy.className = 'toast-message';
    copy.textContent = message;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'toast-close';
    close.setAttribute('aria-label', 'Dismiss notification');
    close.textContent = '×';
    close.addEventListener('click', () => t?.classList.remove('show'));
    t.append(icon, copy, close);
    requestAnimationFrame(() => t?.classList.add('show'));
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => t?.classList.remove('show'), tone === 'danger' ? 5200 : 3200);
  }

  function pathFor(action = ''): string {
    const map: Record<string, string> = {
      index: basePath + 'index.html',
      overview: basePath + 'index.html',
      tenants: basePath + 'pages/tenants.html',
      'tenant-detail': basePath + 'pages/tenant-detail.html',
      'tenant-provisioning': basePath + 'pages/tenant-provisioning.html',
      clients: basePath + 'pages/clients.html',
      'client-detail': basePath + 'pages/client-detail.html',
      'client-onboarding': basePath + 'pages/client-onboarding.html',
      'client-users-permissions': basePath + 'pages/client-users-permissions.html',
      users: basePath + 'pages/users.html',
      'user-access-detail': basePath + 'pages/user-access-detail.html',
      integrations: basePath + 'pages/integrations.html',
      'integration-detail': basePath + 'pages/integration-detail.html',
      'integration-operations': basePath + 'pages/integration-operations.html',
      'integration-archive': basePath + 'pages/integration-archive.html',
      'archive-integrations': basePath + 'pages/archive-integrations.html',
      'data-governance': basePath + 'pages/data-governance.html',
      'data-quality': basePath + 'pages/data-quality.html',
      'production-normalization': basePath + 'pages/production-normalization.html',
      'storage-normalization': basePath + 'pages/storage-normalization.html',
      'alert-dictionary': basePath + 'pages/alert-dictionary.html',
      'alert-normalization': basePath + 'pages/alert-normalization.html',
      plants: basePath + 'pages/plants.html?view=solar',
      groups: basePath + 'pages/groups.html',
      'plant-detail': basePath + 'pages/plant-detail.html',
      'asset-registry': basePath + 'pages/asset-registry.html',
      'asset-topology': basePath + 'pages/asset-topology.html',
      devices: basePath + 'pages/devices.html',
      production: basePath + 'pages/production.html',
      'device-detail': basePath + 'pages/device-detail.html',
      telemetry: basePath + 'pages/telemetry.html',
      incidents: basePath + 'pages/incident-center.html',
      'incident-center': basePath + 'pages/incident-center.html',
      alerts: basePath + 'pages/incident-center.html',
      'alert-detail': basePath + 'pages/alert-detail.html',
      'work-orders': basePath + 'pages/work-orders.html',
      'tasks-work-orders': basePath + 'pages/tasks-work-orders.html',
      'task-detail': basePath + 'pages/task-detail.html',
      'sop-center': basePath + 'pages/sop-center.html',
      'service-desk': basePath + 'pages/service-desk.html',
      'crm-service': basePath + 'pages/crm-service.html',
      'command-center': basePath + 'pages/command-center.html',
      'platform-operations': basePath + 'pages/platform-operations.html',
      'licenses-subscriptions': basePath + 'pages/licenses-subscriptions.html',
      'commercial-models': basePath + 'pages/commercial-models.html',
      'tariff-plans': basePath + 'pages/tariff-plans.html',
      'billing-management': basePath + 'pages/billing-management.html',
      'billing-payments': basePath + 'pages/billing-management.html',
      'invoice-center': basePath + 'pages/invoice-center.html',
      'payment-settings': basePath + 'pages/payment-settings.html',
      'revenue-settlements': basePath + 'pages/revenue-settlements.html',
      finance: basePath + 'pages/tariff-plans.html',
      analytics: basePath + 'pages/data-governance.html',
      reports: basePath + 'pages/reports.html',
      'admin-console': basePath + 'pages/data-governance.html',
      audit: basePath + 'pages/audit-center.html',
      'audit-center': basePath + 'pages/audit-center.html',
      settings: basePath + 'pages/settings.html',
      profile: basePath + 'pages/users.html'
    };
    return map[action] || basePath + 'index.html';
  }

  function closeMenus(except?: string): void {
    document.querySelectorAll('.dropdown-menu.open').forEach(x => { if (x.id !== except) x.classList.remove('open'); });
  }

  function updateAuthProfileUi(): void {
    const name = currentUserLabel();
    const role = currentUserRole();
    const email = currentUserEmail();
    const avatar = currentUserInitials();
    const profileName = document.getElementById('profileName');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileMenuName = document.getElementById('profileMenuName');
    const profileMenuRole = document.getElementById('profileMenuRole');
    if (profileName) profileName.textContent = name;
    if (profileAvatar) profileAvatar.textContent = avatar;
    if (profileMenuName) profileMenuName.textContent = name;
    if (profileMenuRole) profileMenuRole.textContent = `${role}${email ? ' · ' + email : ''}`;
  }

  async function hydrateAuthProfile(): Promise<void> {
    if (!window.ZentridAuth?.isAuthenticated?.()) return;
    updateAuthProfileUi();
    try {
      await window.ZentridAuth.me();
      updateAuthProfileUi();
    } catch (error) {
      // Keep local JWT claims/profile if /me is unavailable.
    }
  }

  function syncTenantMenuFromApi(): void {
    const menuEl = document.getElementById('tenantMenu');
    if (!menuEl) return;
    const rows = Array.isArray(window.ZentridLiveTenants) ? window.ZentridLiveTenants as Record<string, unknown>[] : [];
    const names = rows.map(row => ['name', 'tenantName', 'displayName', 'legalName', 'code', 'id'].map(key => row[key]).find(value => value !== undefined && value !== null && String(value).trim()) || '').map(String).map(value => value.trim()).filter(Boolean);
    const uniqueNames = Array.from(new Set(names));
    const options = ['All Tenants', ...uniqueNames];
    menuEl.innerHTML = options.map(value => `<button type="button" data-value="${value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}">${value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</button>`).join('');
    if (!options.includes(state.tenant)) {
      state.tenant = 'All Tenants';
      localStorage.setItem('zentrid_tenant', state.tenant);
      const label = document.getElementById('tenantLabel');
      if (label) label.textContent = state.tenant;
    }
  }

  function wireHeader(): void {
    syncTenantMenuFromApi();
    document.getElementById('toggleSidebar')?.addEventListener('click', () => document.body.classList.toggle('sidebar-collapsed'));
    document.getElementById('goHome')?.addEventListener('click', () => {
      saveSidebarScroll();
      if (current === 'index.html') window.scrollTo({ top: 0, behavior: 'smooth' });
      else window.location.href = basePath + 'index.html';
    });

    const headerMenus: Array<readonly [string, string]> = [['tenantBtn','tenantMenu'], ['timeBtn','timeMenu'], ['notifyBtn','notifyMenu'], ['profileBtn','profileMenu']];
    headerMenus.forEach(([btn, menuId]) => {
      document.getElementById(btn)?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menuId === 'tenantMenu') syncTenantMenuFromApi();
        const menuEl = document.getElementById(menuId);
        if (!menuEl) return;
        const wasOpen = menuEl.classList.contains('open');
        closeMenus(menuId);
        menuEl.classList.toggle('open', !wasOpen);
      });
    });

    document.getElementById('tenantMenu')?.addEventListener('click', e => {
      const b = layoutEventTarget(e)?.closest<HTMLButtonElement>('button'); if (!b) return;
      state.tenant = b.dataset.value; localStorage.setItem('zentrid_tenant', state.tenant);
      const tenantLabel = document.getElementById('tenantLabel');
      if (tenantLabel) tenantLabel.textContent = state.tenant;
      window.dispatchEvent(new CustomEvent('zentrid:context', { detail: { ...state, changed: 'tenant' } }));
      toast(`Global scope changed: ${state.tenant}`); closeMenus();
    });
    document.getElementById('timeMenu')?.addEventListener('click', e => {
      const b = layoutEventTarget(e)?.closest<HTMLButtonElement>('button'); if (!b) return;
      state.time = b.dataset.value; localStorage.setItem('zentrid_time', state.time);
      const timeLabel = document.getElementById('timeLabel');
      if (timeLabel) timeLabel.textContent = state.time;
      window.dispatchEvent(new CustomEvent('zentrid:context', { detail: { ...state, changed: 'time' } }));
      toast(`Time range changed: ${state.time}`); closeMenus();
    });

    document.getElementById('notifyMenu')?.addEventListener('click', e => {
      const b = layoutEventTarget(e)?.closest<HTMLButtonElement>('button[data-action]'); if (!b) return;
      window.location.href = pathFor(b.dataset.action);
    });
    document.getElementById('profileMenu')?.addEventListener('click', async e => {
      const b = layoutEventTarget(e)?.closest<HTMLButtonElement>('button[data-action]'); if (!b) return;
      if (b.dataset.action === 'logout') { void window.ZentridAuth?.logout?.(true); return; }
      if (b.dataset.action === 'refresh-auth') {
        try {
          await window.ZentridAuth?.me?.();
          updateAuthProfileUi();
          toast('Auth profile refreshed');
        } catch (error) {
          toast(`Auth profile error: ${layoutErrorMessage(error)}`);
        }
        closeMenus();
        return;
      }
      window.location.href = pathFor(b.dataset.action);
    });

    const input = document.getElementById('globalSearch') as HTMLInputElement | null;
    const box = document.getElementById('searchResults') as HTMLElement | null;
    const searchIcon = document.querySelector('.search-box span') as HTMLElement | null;

    const normalizeSearch = (value = ''): string => value
      .toString()
      .toLowerCase()
      .replace(/[·•→↔/\\|,;:()\[\]{}\-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const navIndex: ZentridSearchItem[] = nav.flatMap(group => group.items.map(item => ({
      type: group.section,
      label: item.label,
      meta: `Section · ${group.section}`,
      action: item.key.replace('.html', ''),
      keywords: [group.section, item.label, item.key.replace('.html', '')]
    })));

    function valueFrom(record: Record<string, unknown>, keys: string[]): string {
      for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
      }
      return '';
    }

    function liveRows(name: string): Record<string, unknown>[] {
      const value = window[name];
      return Array.isArray(value) ? value.filter(row => row && typeof row === 'object') as Record<string, unknown>[] : [];
    }

    function liveEntitySearchIndex(): ZentridSearchItem[] {
      const entities: Array<{
        global: string;
        type: string;
        action: string;
        names: string[];
        ids: string[];
        meta: string[];
      }> = [
        { global: 'ZentridLiveTenants', type: 'Tenant', action: 'tenants', names: ['name', 'tenantName', 'displayName', 'legalName'], ids: ['id', 'tenantId', 'code', 'externalId'], meta: ['status', 'country', 'region'] },
        { global: 'ZentridLiveClients', type: 'Client', action: 'client-detail', names: ['name', 'clientName', 'displayName', 'fullName', 'legalName'], ids: ['id', 'clientId', 'code', 'externalId'], meta: ['type', 'status', 'email'] },
        { global: 'ZentridLivePlants', type: 'Plant', action: 'plant-detail', names: ['name', 'plantName', 'displayName'], ids: ['id', 'plantId', 'code', 'externalId'], meta: ['status', 'city', 'country'] },
        { global: 'ZentridLiveDevices', type: 'Device', action: 'device-detail', names: ['name', 'deviceName', 'displayName', 'serialNumber'], ids: ['id', 'deviceId', 'serialNumber', 'externalId'], meta: ['type', 'deviceType', 'status', 'vendor'] },
        { global: 'ZentridLiveAlerts', type: 'Alert', action: 'alert-detail', names: ['title', 'name', 'message', 'alertName'], ids: ['id', 'alertId', 'code', 'externalId'], meta: ['severity', 'status', 'source'] },
        { global: 'ZentridLiveIntegrations', type: 'Connector', action: 'integration-detail', names: ['name', 'displayName', 'providerName', 'connectorName'], ids: ['id', 'integrationId', 'providerId', 'externalId'], meta: ['provider', 'status', 'syncStatus'] }
      ];

      return entities.flatMap(config => liveRows(config.global).reduce<ZentridSearchItem[]>((items, record) => {
        const id = valueFrom(record, config.ids);
        const label = valueFrom(record, config.names) || id;
        if (!label) return items;
        const metaValues = config.meta.map(key => valueFrom(record, [key])).filter(Boolean);
        items.push({
          type: config.type,
          label,
          meta: [config.type, ...metaValues].join(' · '),
          action: config.action,
          keywords: [label, id, ...metaValues].filter(Boolean)
        });
        return items;
      }, []));
    }

    function globalSearchIndex(): ZentridSearchItem[] {
      return [...navIndex, ...liveEntitySearchIndex()];
    }

    function scoreSearchItem(item: ZentridSearchItem, query: string): number {
      const text = normalizeSearch(`${item.type} ${item.label} ${item.meta} ${(item.keywords || []).join(' ')}`);
      const label = normalizeSearch(item.label);
      const tokens = text.split(' ').filter(Boolean);
      const queryTokens = query.split(' ').filter(Boolean);
      if (!queryTokens.length) return 0;
      let score = 0;
      if (label === query) score += 120;
      if (text === query) score += 100;
      if (label.startsWith(query)) score += 75;
      if (text.includes(query)) score += 45;
      queryTokens.forEach(qt => {
        if (tokens.includes(qt)) score += 35;
        else if (tokens.some(t => t.startsWith(qt))) score += 22;
        else if (tokens.some(t => t.includes(qt))) score += 10;
      });
      const allTokensMatched = queryTokens.every(qt => text.includes(qt) || tokens.some(t => t.startsWith(qt)));
      if (allTokensMatched) score += 25;
      return score;
    }

    function findSearchResults(value: string, limit = 8): { query: string; exact: ZentridScoredSearchItem[]; partial: ZentridScoredSearchItem[] } {
      const query = normalizeSearch(value);
      if (!query) return { query, exact: [], partial: [] };
      const ranked = globalSearchIndex()
        .map(item => ({ ...item, score: scoreSearchItem(item, query) }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
      const exact = ranked.filter(item => normalizeSearch(item.label) === query || normalizeSearch(item.keywords?.join(' ') || '').split(' ').includes(query));
      const exactKeys = new Set(exact.map(item => `${item.type}:${item.label}`));
      const partial = ranked.filter(item => !exactKeys.has(`${item.type}:${item.label}`));
      return { query, exact: exact.slice(0, limit), partial: partial.slice(0, limit) };
    }

    function renderSearchResults(value: string, fullMode = false): void {
      if (!box || !input) return;
      const { query, exact, partial } = findSearchResults(value, fullMode ? 30 : 8);
      if (!query) { box.classList.remove('open', 'full-mode'); box.innerHTML = ''; return; }
      const results = [...exact, ...partial].slice(0, fullMode ? 30 : 8);
      if (!results.length) {
        box.innerHTML = `<div class="empty-search"><strong>No results found</strong><br><small>Try a tenant, client, plant, device, connector, incident, payment, or normalization keyword.</small></div>`;
        box.classList.add('open');
        box.classList.toggle('full-mode', fullMode);
        return;
      }
      const exactHtml = exact.length ? `<div class="search-section-title">Exact match</div>${exact.map(searchButtonHtml).join('')}` : '';
      const partialHtml = partial.length ? `<div class="search-section-title">Similar results</div>${partial.slice(0, fullMode ? 30 : Math.max(0, 8 - exact.length)).map(searchButtonHtml).join('')}` : '';
      box.innerHTML = `
        <div class="search-summary"><strong>${results.length}</strong> result${results.length === 1 ? '' : 's'} for “${input.value.trim()}” <small>${exact.length ? 'exact + partial' : 'partial search'}</small></div>
        ${exactHtml}${partialHtml}
        <button class="search-view-all" data-search-full="true" type="button">View full search results</button>
      `;
      box.classList.add('open');
      box.classList.toggle('full-mode', fullMode);
    }

    function searchButtonHtml(item: ZentridSearchItem): string {
      return `<button data-action="${item.action}" data-search-label="${item.label.replace(/"/g, '&quot;')}" type="button"><span>${item.type}</span><strong>${item.label}</strong><small>${item.meta}</small></button>`;
    }

    function goToSearchResult(action: string, label?: string): void {
      const target = pathFor(action);
      const sep = target.includes('?') ? '&' : '?';
      window.location.href = `${target}${sep}search=${encodeURIComponent(input?.value || '')}&result=${encodeURIComponent(label || '')}`;
    }

    let searchTimer: ReturnType<typeof setTimeout> | null = null;
    input?.addEventListener('input', () => {
      if (searchTimer !== null) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => renderSearchResults(input.value, false), 120);
    });
    input?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const { exact, partial } = findSearchResults(input.value, 1);
        const first = exact[0] || partial[0];
        if (first) goToSearchResult(first.action, first.label);
        else renderSearchResults(input.value, true);
      }
    });
    searchIcon?.addEventListener('click', e => {
      e.stopPropagation();
      renderSearchResults(input?.value || '', true);
    });
    box?.addEventListener('click', e => {
      e.stopPropagation();
      const target = layoutEventTarget(e);
      const full = target?.closest('[data-search-full]');
      if (full) { renderSearchResults(input?.value || '', true); return; }
      const b = target?.closest<HTMLButtonElement>('button[data-action]'); if (!b) return;
      goToSearchResult(b.dataset.action, b.dataset.searchLabel || b.textContent);
    });
    input?.addEventListener('focus', () => {
      if (input.value.trim()) renderSearchResults(input.value, false);
    });

    document.addEventListener('click', () => { closeMenus(); box?.classList.remove('open'); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenus(); box?.classList.remove('open'); } });
  }


  function actionLabel(button: Element): string {
    const text = (button.textContent || '').trim();
    return text || button.getAttribute('title') || button.getAttribute('aria-label') || 'Action';
  }

  function enhanceActionMenus(root: Document | Element = document): void {
    const scope = root;

    // Standard rule: kebab menus are allowed only inside registry/table rows.
    // Wizard, modal, drawer and page-header actions stay as visible inline buttons.
    scope.querySelectorAll('.data-row > .row-actions:not(.kebabified)').forEach(actions => {
      if (actions.closest('.drawer-actions, .modal-actions, .panel-head, .wizard-actions')) return;
      if (actions.dataset.noKebab === 'true') return;
      if (actions.querySelector('.kebab-btn')) { actions.classList.add('kebabified'); return; }
      const buttons = Array.from(actions.children).filter((el): el is HTMLButtonElement => el.tagName === 'BUTTON');
      if (!buttons.length) return;
      if (buttons.length === 1) {
        const onlyButton = buttons[0];
        if (!onlyButton) return;
        actions.classList.add('single-action');
        onlyButton.classList.add('single-row-action');
        return;
      }
      const wrap = document.createElement('div');
      wrap.className = 'kebab-wrap global-action-wrap';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kebab-btn';
      btn.dataset.action = 'menu';
      btn.setAttribute('aria-label', 'Open actions');
      btn.setAttribute('title', 'Actions');
      btn.textContent = '⋮';
      const menu = document.createElement('div');
      menu.className = 'kebab-menu global-action-menu';
      buttons.forEach(original => {
        const label = actionLabel(original);
        original.classList.remove('primary-action', 'secondary-action', 'primary-btn', 'secondary-btn');
        original.textContent = label;
        original.type = 'button';
        menu.appendChild(original);
      });
      actions.replaceChildren(wrap);
      wrap.append(btn, menu);
      actions.classList.add('kebabified');
    });
  }

  function positionFloatingActionMenu(button?: Element | null, menu?: FloatingKebabMenu | null): void {
    if (!button || !menu) return;

    // Portal the menu to <body>. Otherwise fixed/absolute positioning can be
    // clipped or shifted by scrollable/transformed table containers.
    if (!menu.__zentridHome) {
      const parent = menu.parentNode;
      if (parent) menu.__zentridHome = { parent, next: menu.nextSibling };
    }
    if (menu.parentNode !== document.body) document.body.appendChild(menu);

    menu.classList.add('floating-menu');
    menu.style.visibility = 'hidden';
    menu.classList.add('open');

    const btn = button.getBoundingClientRect();
    const rect = menu.getBoundingClientRect();
    const gap = 8;
    const viewportGap = 12;
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight;

    let left = btn.right - rect.width;
    let top = btn.bottom + gap;

    if (left < viewportGap) left = viewportGap;
    if (left + rect.width > viewportWidth - viewportGap) {
      left = Math.max(viewportGap, viewportWidth - rect.width - viewportGap);
    }
    if (top + rect.height > viewportHeight - viewportGap) {
      top = Math.max(viewportGap, btn.top - rect.height - gap);
    }

    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.style.visibility = '';
  }

  function resetFloatingActionMenu(menu?: FloatingKebabMenu | null): void {
    if (!menu) return;
    menu.classList.remove('open', 'floating-menu');
    menu.style.left = '';
    menu.style.top = '';
    menu.style.visibility = '';
    if (menu.__zentridHome?.parent && menu.parentNode === document.body) {
      menu.__zentridHome.parent.insertBefore(menu, menu.__zentridHome.next || null);
    }
  }

  function closeActionMenus(except?: Element | null): void {
    document.querySelectorAll('.kebab-menu.open').forEach(menu => {
      if (menu !== except) resetFloatingActionMenu(menu as FloatingKebabMenu);
    });
  }

  function wireActionMenus(): void {
    if (window.__zentridActionMenusWired) return;
    window.__zentridActionMenusWired = true;

    document.addEventListener('click', e => {
      const target = layoutEventTarget(e);
      const kebab = target?.closest('.kebab-btn[data-action="menu"]');
      if (kebab) {
        e.preventDefault();
        e.stopPropagation();
        const menu = kebab.closest('.kebab-wrap')?.querySelector<FloatingKebabMenu>('.kebab-menu');
        const open = menu?.classList.contains('open');
        closeActionMenus(menu);
        if (menu && !open) positionFloatingActionMenu(kebab, menu);
        else if (menu) resetFloatingActionMenu(menu);
        return;
      }

      const menuButton = target?.closest<HTMLButtonElement>('.kebab-menu.floating-menu button[data-action]');
      if (menuButton) {
        e.preventDefault();
        e.stopPropagation();
        const menu = menuButton.closest<FloatingKebabMenu>('.kebab-menu');
        // Put the menu back into its row, then replay the click from the original
        // button so page-level delegated handlers (plants/devices/tenants/etc.)
        // can resolve context with button.closest('.data-row').
        if (menu?.__zentridHome?.parent && menu.parentNode === document.body) {
          menu.__zentridHome.parent.insertBefore(menu, menu.__zentridHome.next || null);
          menu.classList.remove('open', 'floating-menu');
          menu.style.left = '';
          menu.style.top = '';
          menu.style.visibility = '';
        }
        menuButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        return;
      }

      if (!target?.closest('.kebab-wrap') && !target?.closest('.kebab-menu')) closeActionMenus();
    }, true);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeActionMenus(); });
    window.addEventListener('resize', () => closeActionMenus());
    window.addEventListener('scroll', () => closeActionMenus(), true);
  }

  interface ZentridOpenOverlaySnapshot {
    id: string;
    html: string;
    scrollTop: number;
    activeControlKey: string;
  }

  function syncOverlayControlState(source: HTMLElement, clone: HTMLElement): void {
    const sourceControls = Array.from(source.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'));
    const cloneControls = Array.from(clone.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'));
    sourceControls.forEach((control, index) => {
      const copy = cloneControls[index];
      if (!copy) return;
      if (control instanceof HTMLInputElement && copy instanceof HTMLInputElement) {
        if (control.type !== 'file') copy.setAttribute('value', control.value);
        if (control.checked) copy.setAttribute('checked', '');
        else copy.removeAttribute('checked');
        return;
      }
      if (control instanceof HTMLTextAreaElement && copy instanceof HTMLTextAreaElement) {
        copy.textContent = control.value;
        return;
      }
      if (control instanceof HTMLSelectElement && copy instanceof HTMLSelectElement) {
        Array.from(copy.options).forEach((option, optionIndex) => {
          if (control.options[optionIndex]?.selected) option.setAttribute('selected', '');
          else option.removeAttribute('selected');
        });
      }
    });
  }

  function overlayControlKey(control: HTMLElement | null, overlay: HTMLElement): string {
    if (!control || !overlay.contains(control)) return '';
    if (control.id) return `#${CSS.escape(control.id)}`;
    const name = control.getAttribute('name');
    if (name) return `[name="${CSS.escape(name)}"]`;
    const aria = control.getAttribute('aria-label');
    if (aria) return `[aria-label="${CSS.escape(aria)}"]`;
    return '';
  }

  function captureOpenOverlays(app: HTMLElement): ZentridOpenOverlaySnapshot[] {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return Array.from(app.querySelectorAll<HTMLElement>('.modal.open[id], .detail-drawer.open[id]')).map(overlay => {
      const clone = overlay.cloneNode(true) as HTMLElement;
      syncOverlayControlState(overlay, clone);
      return {
        id: overlay.id,
        html: clone.outerHTML,
        scrollTop: overlay.scrollTop,
        activeControlKey: overlayControlKey(active, overlay)
      };
    });
  }

  function restoreOpenOverlays(app: HTMLElement, snapshots: ZentridOpenOverlaySnapshot[]): void {
    snapshots.forEach(snapshot => {
      const replacement = app.querySelector<HTMLElement>(`#${CSS.escape(snapshot.id)}`);
      if (!replacement) return;
      const template = document.createElement('template');
      template.innerHTML = snapshot.html.trim();
      const restored = template.content.firstElementChild as HTMLElement | null;
      if (!restored) return;
      replacement.replaceWith(restored);
      restored.scrollTop = snapshot.scrollTop;
      if (snapshot.activeControlKey) {
        window.setTimeout(() => restored.querySelector<HTMLElement>(snapshot.activeControlKey)?.focus(), 0);
      }
    });
  }

  function mount(content: string): ZentridContextState {
    const app = document.getElementById('app');
    if (!app) throw new Error('Zentrid app root not found');
    const openOverlays = captureOpenOverlays(app);
    app.innerHTML = `${sidebar()}<div class="workspace">${header()}<main class="main-content">${content}</main></div>`;
    restoreOpenOverlays(app, openOverlays);
    wireHeader();
    hydrateAuthProfile();
    wireSidebarScrollMemory();
    wireActionMenus();
    const main = app.querySelector('.main-content');
    if (main) enhanceActionMenus(main);
    const observer = new MutationObserver(() => {
      clearTimeout(window.__zentridActionEnhanceTimer);
      window.__zentridActionEnhanceTimer = setTimeout(() => { if (main) enhanceActionMenus(main); }, 20);
    });
    if (main) observer.observe(main, { childList: true, subtree: true });
    return state;
  }

  return { mount, toast, pathFor, state, enhanceActionMenus };
})();
