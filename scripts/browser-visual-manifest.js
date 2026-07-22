const viewports = [
  { id: 'desktop-wide', width: 1440, height: 1000 },
  { id: 'desktop', width: 1280, height: 900 },
  { id: 'tablet-landscape', width: 1024, height: 900 },
  { id: 'tablet', width: 768, height: 1024 },
  { id: 'mobile', width: 390, height: 844 }
];

const scenarios = [
  {
    id: 'login', label: 'Login', route: '/login.html', bootstrapAuth: false, ready: '#loginForm',
    main: '.login-shell, .login-card',
    fingerprint: ['.login-shell', '.login-card', '#loginForm', '#loginForm button[type="submit"]'],
    sourceHints: [['login.html', 'loginApp'], ['assets/css/src/80-auth-and-api-console.css', '.login']]
  },
  {
    id: 'clients', label: 'Clients Registry', route: '/pages/clients.html?page=1&pageSize=20', ready: '.client-table-v17 .data-row[data-client]',
    main: '.main-content',
    fingerprint: ['.main-content', '.page-head', '.client-main-card-v17', '.client-table-v17', '.registry-pagination'],
    sourceHints: [['pages/clients.html', 'id="app"'], ['assets/js/client-hierarchy.ts', 'data-client']]
  },
  {
    id: 'plants', label: 'Plant Registry', route: '/pages/plants.html?page=1&pageSize=20', ready: '.plant-table .data-row[data-id]',
    main: '.main-content',
    fingerprint: ['.main-content', '.page-hero', '#solarPlantsRegistryView', '.plant-table', '.registry-pagination'],
    sourceHints: [['pages/plants.html', 'id="app"'], ['assets/js/plants.ts', 'data-plant']]
  },
  {
    id: 'devices', label: 'Device Registry', route: '/pages/devices.html?page=1&pageSize=20', ready: '.device-table .data-row[data-id]',
    main: '.main-content',
    fingerprint: ['.main-content', '.page-hero', '.panel.glass-card', '.device-table', '.registry-pagination'],
    sourceHints: [['pages/devices.html', 'id="app"'], ['assets/js/devices.ts', 'data-device']]
  },
  {
    id: 'alerts', label: 'Alerts Registry', route: '/pages/alerts.html?page=1&pageSize=20', ready: '.alert-row[data-alert-id]',
    main: '.main-content',
    fingerprint: ['.main-content', '.page-hero', '.panel.glass-card', '.alert-row', '.registry-pagination'],
    sourceHints: [['pages/alerts.html', 'id="app"'], ['assets/js/alerts.ts', 'data-alert-id']]
  },
  {
    id: 'plant-detail', label: 'Plant Detail', route: '/pages/plant-detail.html', storage: { zentrid_selected_plant: 'plant-1' }, ready: '[data-plant-tab="overview"]',
    main: '.main-content',
    fingerprint: ['.main-content', '.page-hero', '.detail-kpis', '.plant-side-card-v17', '.plant-main-card-v17'],
    sourceHints: [['pages/plant-detail.html', 'id="app"'], ['assets/js/plants.ts', 'data-plant-tab="overview"']]
  },
  {
    id: 'integration-detail', label: 'Integration Detail', route: '/pages/integration-detail.html', storage: { zentrid_selected_integration: 'integration-1' }, ready: '[data-integration-tab="general"]',
    main: '.main-content',
    fingerprint: ['.main-content', '.page-hero', '.integration-detail-control-v116', '.detail-layout-standard', '#integrationDetailContent'],
    sourceHints: [['pages/integration-detail.html', 'id="app"'], ['assets/js/integrations.ts', 'data-integration-tab="general"']]
  },
  {
    id: 'api-console', label: 'Platform API Console', route: '/pages/api-console.html', ready: '#runApiChecks',
    main: '.main-content',
    prepare: [
      { type: 'click', selector: '#runApiChecks' },
      { type: 'wait-count', selector: '#apiConsoleResults .api-check-card', min: 10, timeoutMs: 25000 }
    ],
    fingerprint: ['.main-content', '.page-head', '#apiConsoleStatus', '#apiConsoleResults', '.api-check-card', '#apiFieldMappingAudit'],
    sourceHints: [['pages/api-console.html', 'id="app"'], ['assets/js/api-console.ts', 'apiConsoleResults']]
  }
];

module.exports = { viewports, scenarios };
