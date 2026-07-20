const scenarios = [
  {
    id: 'login-to-clients',
    label: 'Login → Clients',
    route: '/login.html?next=pages/clients.html',
    bootstrapAuth: false,
    ready: '#loginForm',
    sourceHints: [
      ['login.html', 'loginApp'],
      ['assets/js/login.ts', 'loginForm'],
      ['assets/js/login.ts', 'Sign in as Global Admin']
    ],
    actions: [
      { type: 'fill', selector: 'input[name="username"]', value: 'globaladmin' },
      { type: 'fill', selector: 'input[name="password"]', value: 'smoke-password' },
      { type: 'click', selector: '#loginForm button[type="submit"]' },
      { type: 'wait-url', includes: '/pages/clients.html' },
      { type: 'wait-selector', selector: '.client-table-v17 .data-row[data-client]' },
      { type: 'assert-storage', area: 'session', key: 'zentrid_access_token', equals: 'zentrid-e2e-token' }
    ]
  },
  {
    id: 'clients-query-state-and-modal',
    label: 'Clients pagination, query state and modal',
    route: '/pages/clients.html?page=1&pageSize=20',
    ready: '.client-table-v17 .data-row[data-client]',
    sourceHints: [
      ['assets/js/client-hierarchy.ts', 'clientSearchV28'],
      ['assets/js/client-hierarchy.ts', 'clientCreateBackdrop'],
      ['assets/js/registry-query-state.ts', 'data-registry-page="next"']
    ],
    actions: [
      { type: 'assert-text', selector: '.client-table-v17', includes: 'Smoke Client' },
      { type: 'click', selector: '#openClientCreate' },
      { type: 'assert-class', selector: '#clientCreateBackdrop', className: 'open' },
      { type: 'click', selector: '[data-close-client-create]' },
      { type: 'assert-not-class', selector: '#clientCreateBackdrop', className: 'open' },
      { type: 'click', selector: '[data-registry-page="next"][data-registry-entity="clients"]' },
      { type: 'wait-query', key: 'page', equals: '2' },
      { type: 'wait-request', path: '/api/admin/clients', query: { page: '2' } },
      { type: 'history-back' },
      { type: 'wait-query', key: 'page', equalsAny: ['', '1'] },
      { type: 'fill', selector: '#clientSearchV28', value: 'smoke' },
      { type: 'wait-query', key: 'search', equals: 'smoke' },
      { type: 'assert-selector', selector: '.registry-filter-scope' }
    ]
  },
  {
    id: 'plant-detail-lazy-tabs',
    label: 'Plant Detail lazy relations',
    route: '/pages/plant-detail.html',
    storage: { zentrid_selected_plant: 'plant-1' },
    ready: '[data-plant-tab="overview"]',
    sourceHints: [
      ['assets/js/plants.ts', 'data-plant-tab="structure"'],
      ['assets/js/live-api-ui.ts', "key: 'devices'"],
      ['assets/js/detail-lazy-tabs.ts', 'data-detail-lazy-status="loaded"']
    ],
    actions: [
      { type: 'assert-no-request', path: '/api/devices' },
      { type: 'click', selector: '[data-plant-tab="structure"]' },
      { type: 'wait-request', path: '/api/devices' },
      { type: 'wait-selector', selector: '[data-detail-lazy-page="plant"][data-detail-lazy-status="loaded"]' }
    ]
  },
  {
    id: 'device-detail-lazy-tabs',
    label: 'Device Detail lazy alerts',
    route: '/pages/device-detail.html',
    storage: { zentrid_selected_device: 'device-1' },
    ready: '[data-device-tab="overview"]',
    sourceHints: [
      ['assets/js/devices.ts', "button('alerts'"],
      ['assets/js/live-api-ui.ts', "key: 'alerts'"],
      ['assets/js/detail-lazy-tabs.ts', 'data-detail-lazy-page']
    ],
    actions: [
      { type: 'assert-no-request', path: '/api/alerts' },
      { type: 'click', selector: '[data-device-tab="alerts"]' },
      { type: 'wait-request', path: '/api/alerts' },
      { type: 'wait-selector', selector: '[data-detail-lazy-page="device"][data-detail-lazy-status="loaded"]' }
    ]
  },
  {
    id: 'integration-detail-lazy-summary',
    label: 'Integration Detail lazy synchronization summary',
    route: '/pages/integration-detail.html',
    storage: { zentrid_selected_integration: 'integration-1' },
    ready: '[data-integration-tab="general"]',
    sourceHints: [
      ['assets/js/integrations.ts', 'data-integration-tab="synchronization"'],
      ['assets/js/live-api-ui.ts', "key: 'operational-summary'"],
      ['assets/js/detail-lazy-tabs.ts', 'detail-lazy-panel loaded']
    ],
    actions: [
      { type: 'assert-no-request', path: '/api/integrations' },
      { type: 'click', selector: '[data-integration-tab="synchronization"]' },
      { type: 'wait-request', path: '/api/integrations' },
      { type: 'wait-selector', selector: '[data-detail-lazy-page="integration"][data-detail-lazy-status="loaded"]' }
    ]
  },
  {
    id: 'api-console-diagnostics',
    label: 'API Console safe diagnostics',
    route: '/pages/api-console.html',
    ready: '#runApiChecks',
    sourceHints: [
      ['pages/api-console.html', 'api-console.js'],
      ['assets/js/api-console.ts', 'runApiChecks'],
      ['assets/js/api-console.ts', 'apiConsoleResults']
    ],
    actions: [
      { type: 'click', selector: '#runApiChecks' },
      { type: 'wait-selector-count', selector: '#apiConsoleResults .api-check-card', min: 10, timeoutMs: 20000 },
      { type: 'assert-selector', selector: '#apiFieldMappingAudit' },
      { type: 'assert-no-text', selector: '#apiConsoleStatus', includes: 'failed' }
    ]
  }
];

module.exports = { scenarios };
