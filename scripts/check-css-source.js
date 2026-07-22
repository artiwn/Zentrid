const { existsSync, readFileSync, readdirSync, statSync } = require('fs');
const { extname, resolve, sep } = require('path');

const root = process.cwd();
const sourceRoot = resolve(root, 'assets', 'css', 'src');
const generatedSourcePath = resolve(root, 'assets', 'css', 'styles.css');
const manifestPath = resolve(sourceRoot, 'manifest.json');
const failures = [];


const sharedBadgeBaseModule = 'components/badge-base.css';
const sharedBadgeBaseProperties = new Map([
  ['.badge', new Set(['display', 'align-items', 'justify-content', 'min-width', 'padding', 'border-radius', 'font-size', 'font-weight', 'background', 'vertical-align'])],
  ['.badge + small', new Set(['display', 'margin-top', 'line-height'])],
  ['.badge + .muted', new Set(['display', 'margin-top', 'line-height'])]
]);

const sharedBadgeToneModule = 'components/badge-tones.css';
const sharedBadgeToneProperties = new Map([
  ['.badge.good', new Set(['color', 'border', 'background'])],
  ['.badge.success', new Set(['color', 'border', 'background'])],
  ['.badge.warn', new Set(['color', 'border', 'background'])],
  ['.badge.warning', new Set(['color', 'border', 'background'])],
  ['.badge.bad', new Set(['color', 'border', 'background'])],
  ['.badge.danger', new Set(['color', 'border', 'background'])],
  ['.badge.muted', new Set(['background', 'color', 'border-color'])]
]);

const sharedModalDrawerShellModule = 'components/modal-drawer-shells.css';
const sharedModalDrawerShellProperties = new Map([
  ['.modal', new Set(['position', 'inset', 'display', 'place-items', 'padding', 'background', 'backdrop-filter', 'z-index'])],
  ['.modal.open', new Set(['display'])],
  ['.modal-card', new Set(['position', 'width', 'max-height', 'overflow', 'border-radius', 'padding', 'background', 'border', 'box-shadow'])],
  ['.detail-drawer', new Set(['position', 'top', 'right', 'bottom', 'width', 'height', 'transform', 'transition', 'padding', 'background', 'border-left', 'z-index', 'box-shadow', 'overflow'])],
  ['.detail-drawer.open', new Set(['transform'])],
  ['.modal-close', new Set(['position', 'right', 'top', 'width', 'height', 'border-radius', 'border', 'background', 'color', 'font-size'])],
  ['.drawer-close', new Set(['position', 'right', 'top', 'width', 'height', 'border-radius', 'border', 'background', 'color', 'font-size'])]
]);

const sharedInformationGridContentModule = 'components/information-grid-content.css';
const sharedInformationGridContentProperties = new Map([
  ['.info-grid', new Set(['display', 'gap'])],
  ['.info-grid div', new Set(['min-height', 'padding', 'border-radius', 'background', 'border'])],
  ['.discovery-grid div', new Set(['min-height', 'padding', 'border-radius', 'background', 'border'])],
  ['.info-grid span', new Set(['display', 'color', 'font-size', 'margin-bottom'])],
  ['.discovery-grid span', new Set(['display', 'color', 'font-size', 'margin-bottom'])],
  ['.info-grid strong', new Set(['font-size'])],
  ['.discovery-grid strong', new Set(['font-size'])],
  ['.discovery-grid', new Set(['display', 'gap', 'grid-column'])]
]);

const sharedInformationCellOverflowModule = 'components/information-cell-overflow.css';
const sharedInformationCellOverflowProperties = new Map([
  ['.placeholder-grid.compact-cards article', new Set(['min-width'])],
  ['.info-grid > div', new Set(['min-width'])],
  ['.placeholder-grid.compact-cards article > span', new Set(['max-width', 'overflow', 'text-overflow', 'white-space'])],
  ['.placeholder-grid.compact-cards article > strong', new Set(['max-width', 'overflow', 'text-overflow', 'white-space'])],
  ['.placeholder-grid.compact-cards article > small', new Set(['max-width', 'overflow', 'text-overflow', 'display', '-webkit-line-clamp', '-webkit-box-orient'])],
  ['.info-grid > div > span', new Set(['max-width', 'overflow', 'text-overflow', 'white-space'])],
  ['.info-grid > div > strong', new Set(['max-width', 'overflow', 'text-overflow', 'white-space'])],
  ['.info-grid > div > small', new Set(['max-width', 'overflow', 'text-overflow', 'display', '-webkit-line-clamp', '-webkit-box-orient'])]
]);

const sharedDataTableContentModule = 'components/data-table-content.css';
const sharedDataTableContentProperties = new Map([
  ['.data-head', new Set(['display', 'gap', 'align-items', 'padding', 'color', 'font-size', 'font-weight', 'text-transform', 'letter-spacing'])],
  ['.data-row', new Set(['display', 'gap', 'align-items', 'padding', 'border-radius', 'background', 'border', 'transition'])],
  ['.data-row strong', new Set(['display', 'font-size'])],
  ['.data-row small', new Set(['color', 'font-size', 'line-height'])],
]);
const sharedDataTableContentUniqueProperties = new Map([
  ['.data-head', new Set(['gap', 'align-items', 'padding', 'color', 'font-size', 'font-weight', 'text-transform', 'letter-spacing'])],
  ['.data-row', new Set(['display', 'gap', 'align-items', 'padding', 'border-radius', 'background', 'border', 'transition'])],
  ['.data-row strong', new Set(['display', 'font-size'])],
  ['.data-row small', new Set(['color', 'font-size', 'line-height'])],
]);

const sharedFormPrimitivesModule = 'components/form-primitives.css';
const sharedFormPrimitiveProperties = new Map([
  ['.toolbar input', new Set(['width', 'min-width', 'min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline'])],
  ['.toolbar select', new Set(['width', 'min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline'])],
  ['label input', new Set(['width', 'min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline'])],
  ['label select', new Set(['width', 'min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline'])],
  ['textarea', new Set(['width', 'min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline', 'resize'])],
  ['.form-grid', new Set(['display'])],
  ['label', new Set(['display', 'gap', 'color', 'font-size', 'font-weight'])],
  ['label.full', new Set(['grid-column'])],
  ['.full', new Set(['grid-column'])],
  ['label.check', new Set(['grid-template-columns', 'align-items', 'min-height', 'border', 'background', 'border-radius', 'padding'])],
  ['label.check input', new Set(['width', 'min-height'])]
]);
const sharedFormPrimitiveUniqueProperties = new Map([
  ['.toolbar input', new Set(['min-width', 'min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline'])],
  ['.toolbar select', new Set(['min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline'])],
  ['label input', new Set(['width', 'min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline'])],
  ['label select', new Set(['width', 'min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline'])],
  ['textarea', new Set(['width', 'min-height', 'border-radius', 'border', 'background', 'color', 'padding', 'outline', 'resize'])],
  ['.form-grid', new Set(['display'])],
  ['label', new Set(['display', 'gap', 'color', 'font-size', 'font-weight'])],
  ['label.full', new Set(['grid-column'])],
  ['.full', new Set(['grid-column'])],
  ['label.check', new Set(['grid-template-columns', 'align-items', 'min-height', 'border', 'background', 'border-radius', 'padding'])],
  ['label.check input', new Set(['width', 'min-height'])]
]);

const sharedDataTableLayoutModule = 'components/data-table-layout.css';
const sharedDataTableLayoutProperties = new Map([
  ['.data-table', new Set(['min-width', 'width', 'overflow-x', 'display', 'gap', 'padding-bottom'])],
  ['.data-table > .data-head', new Set(['display', 'align-items', 'gap'])],
  ['.data-table > .data-row', new Set(['display', 'align-items', 'gap'])]
]);

const sharedMetricCardContentModule = 'components/metric-card-content.css';
const sharedMetricCardContentProperties = new Map([
  ['.kpi-card', new Set(['display', 'flex-direction', 'align-items', 'justify-content', 'gap', 'min-width', 'isolation'])],
  ['.kpi-card > *', new Set(['position', 'z-index', 'max-width'])],
  ['.kpi-card > span:not(.kpi-icon)', new Set(['display', 'color', 'font-size', 'font-weight', 'line-height', 'margin'])],
  ['.kpi-card .kpi-label', new Set(['display', 'color', 'font-size', 'font-weight', 'line-height', 'margin'])],
  ['.kpi-card > strong', new Set(['display', 'color', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'margin', 'overflow-wrap'])],
  ['.kpi-card .kpi-value', new Set(['display', 'color', 'font-size', 'font-weight', 'letter-spacing', 'line-height', 'margin', 'overflow-wrap'])],
  ['.kpi-card > small', new Set(['color', 'font-size', 'line-height', 'margin-top', 'overflow-wrap'])],
  ['.kpi-card .kpi-delta', new Set(['display', 'color', 'font-size', 'line-height', 'margin-top', 'overflow-wrap'])]
]);

const sharedMetricCardOverflowModule = 'components/metric-card-overflow.css';
const sharedMetricCardOverflowProperties = new Map([
  ['.kpi-card > span', new Set(['overflow', 'text-overflow', 'white-space'])],
  ['.kpi-card > strong', new Set(['overflow', 'text-overflow', 'white-space'])],
  ['.kpi-card > small', new Set(['display', 'overflow', 'text-overflow', '-webkit-line-clamp', '-webkit-box-orient'])]
]);


const sharedCardSurfaceModule = 'components/card-surfaces.css';
const sharedCardSurfaceProperties = new Map([
  ['.glass-card', new Set(['background', 'border', 'box-shadow', 'backdrop-filter'])],
  ['.panel', new Set(['border-radius', 'padding', 'min-height'])],
  ['.panel-lite', new Set(['border', 'border-radius', 'padding', 'background', 'min-width'])],
  ['.kpi-card', new Set(['position', 'overflow', 'min-height', 'padding', 'border-radius', 'background', 'box-shadow'])],
  ['.module-card', new Set(['position', 'overflow', 'padding', 'border-radius'])]
]);

const sharedActionModule = 'components/actions.css';
const sharedActionSelectors = new Set([
  '.primary-action',
  '.primary-action:hover',
  '.secondary-action',
  '.secondary-action:hover',
  '.danger-action',
  '.danger-action:hover'
]);


const sharedDetailCardShellModule = 'components/detail-card-shells.css';
const sharedDetailCardShellSelectors = new Set([
  '.client-side-card-v17',
  '.plant-side-card-v17',
  '.production-side-card-v92',
  '.client-side-card-v17 h3',
  '.plant-side-card-v17 h3',
  '.production-side-card-v92 h3',
  '.client-side-card-v17 button',
  '.plant-side-card-v17 button',
  '.production-side-card-v92 button',
  '.client-side-card-v17 button.active',
  '.plant-side-card-v17 button.active',
  '.production-side-card-v92 button.active',
  '.client-main-card-v17',
  '.plant-main-card-v17',
  '.production-main-card-v92'
]);

const sharedDataSourceIndicatorsModule = 'components/data-source-indicators.css';
const sharedLiveDataStatesModule = 'components/live-data-states.css';

const sharedActionLayoutModule = 'components/action-layouts.css';
const sharedActionLayoutSelectors = new Set([
  '.page-actions',
  '.inline-actions',
  '.integration-page-actions',
  '.hero-actions',
  '.drawer-actions',
  '.modal-actions',
  '.row-actions',
  '.vertical-actions',
  '.inline-form-actions'
]);

function findOwnedSelectors(cssText, ownedSelectors) {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = [];
  const ruleHeaderPattern = /([^{}]+)\{/g;
  let match;
  while ((match = ruleHeaderPattern.exec(withoutComments)) !== null) {
    const header = match[1].trim();
    if (!header || header.startsWith('@')) continue;
    for (const selector of header.split(',').map(value => value.trim())) {
      if (ownedSelectors.has(selector)) selectors.push(selector);
    }
  }
  return selectors;
}

function findOwnedSelectorProperties(cssText, ownership) {
  const withoutComments = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = rulePattern.exec(withoutComments)) !== null) {
    const header = match[1].trim();
    if (!header || header.startsWith('@')) continue;
    const selectors = header.split(',').map(value => value.trim());
    const declarations = new Set();
    const declarationPattern = /(?:^|;)\s*([\w-]+)\s*:/g;
    let declarationMatch;
    while ((declarationMatch = declarationPattern.exec(match[2])) !== null) {
      declarations.add(declarationMatch[1].toLowerCase());
    }
    for (const selector of selectors) {
      const ownedProperties = ownership.get(selector);
      if (!ownedProperties) continue;
      for (const property of declarations) {
        if (ownedProperties.has(property)) found.push({ selector, property });
      }
    }
  }
  return found;
}

function findGlobalActionSelectors(cssText) {
  return findOwnedSelectors(cssText, sharedActionSelectors);
}

function findGlobalActionLayoutSelectors(cssText) {
  return findOwnedSelectors(cssText, sharedActionLayoutSelectors);
}

if (existsSync(generatedSourcePath)) {
  failures.push('assets/css/styles.css must not be checked in; it is generated into dist/.');
}
if (!existsSync(manifestPath)) {
  failures.push('CSS manifest is missing: assets/css/src/manifest.json');
}

let manifest = null;
if (existsSync(manifestPath)) {
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    failures.push(`Cannot parse CSS manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (manifest) {
  if (manifest.version !== 1) failures.push('CSS manifest version must be 1.');
  if (manifest.output !== 'assets/css/styles.css') {
    failures.push('CSS manifest output must be assets/css/styles.css.');
  }
  if (!Array.isArray(manifest.sources) || manifest.sources.length === 0) {
    failures.push('CSS manifest must list at least one source fragment.');
  } else {
    const listed = new Set();
    for (const name of manifest.sources) {
      if (typeof name !== 'string' || extname(name).toLowerCase() !== '.css') {
        failures.push(`Invalid CSS source entry: ${String(name)}`);
        continue;
      }
      if (listed.has(name)) failures.push(`Duplicate CSS source entry: ${name}`);
      listed.add(name);

      const path = resolve(sourceRoot, name);
      if (path !== sourceRoot && !path.startsWith(`${sourceRoot}${sep}`)) {
        failures.push(`CSS source escapes assets/css/src: ${name}`);
      } else if (!existsSync(path)) {
        failures.push(`Listed CSS source is missing: ${name}`);
      } else if (statSync(path).size === 0) {
        failures.push(`CSS source fragment is empty: ${name}`);
      }
    }

    const badgeBaseIndex = manifest.sources.indexOf(sharedBadgeBaseModule);
    const badgeToneIndex = manifest.sources.indexOf(sharedBadgeToneModule);
    const modalDrawerShellIndex = manifest.sources.indexOf(sharedModalDrawerShellModule);
    const cardSurfaceIndex = manifest.sources.indexOf(sharedCardSurfaceModule);
    const informationGridContentIndex = manifest.sources.indexOf(sharedInformationGridContentModule);
    const informationCellOverflowIndex = manifest.sources.indexOf(sharedInformationCellOverflowModule);
    const dataTableContentIndex = manifest.sources.indexOf(sharedDataTableContentModule);
    const dataTableLayoutIndex = manifest.sources.indexOf(sharedDataTableLayoutModule);
    const formPrimitivesIndex = manifest.sources.indexOf(sharedFormPrimitivesModule);
    const metricCardContentIndex = manifest.sources.indexOf(sharedMetricCardContentModule);
    const metricCardOverflowIndex = manifest.sources.indexOf(sharedMetricCardOverflowModule);
    const actionIndex = manifest.sources.indexOf(sharedActionModule);
    const actionLayoutIndex = manifest.sources.indexOf(sharedActionLayoutModule);
    const detailCardShellIndex = manifest.sources.indexOf(sharedDetailCardShellModule);
    const dataSourceIndicatorsIndex = manifest.sources.indexOf(sharedDataSourceIndicatorsModule);
    const liveDataStatesIndex = manifest.sources.indexOf(sharedLiveDataStatesModule);
    const foundationIndex = manifest.sources.indexOf('00-foundation.css');
    const platformPatchIndex = manifest.sources.indexOf('05-platform-core-patches.css');
    const clientBaseIndex = manifest.sources.indexOf('10-client-plant-device.css');
    const clientDetailIndex = manifest.sources.indexOf('11-client-plant-device-details.css');
    const devicesAlertsIndex = manifest.sources.indexOf('30-devices-alerts-and-groups.css');
    const commercialDataIndex = manifest.sources.indexOf('40-commercial-data-access-audit.css');
    const commercialIndex = manifest.sources.indexOf('60-licensing-billing-payments-rbac.css');
    if (badgeBaseIndex === -1) {
      failures.push(`Shared badge base component is missing from manifest: ${sharedBadgeBaseModule}`);
    } else if (foundationIndex !== -1 && badgeBaseIndex <= foundationIndex) {
      failures.push(`${sharedBadgeBaseModule} must load after 00-foundation.css.`);
    } else if (cardSurfaceIndex !== -1 && badgeBaseIndex >= cardSurfaceIndex) {
      failures.push(`${sharedBadgeBaseModule} must load before ${sharedCardSurfaceModule}.`);
    }

    if (badgeToneIndex === -1) {
      failures.push(`Shared badge tone component is missing from manifest: ${sharedBadgeToneModule}`);
    } else if (platformPatchIndex !== -1 && badgeToneIndex <= platformPatchIndex) {
      failures.push(`${sharedBadgeToneModule} must load after 05-platform-core-patches.css.`);
    } else if (modalDrawerShellIndex !== -1 && badgeToneIndex >= modalDrawerShellIndex) {
      failures.push(`${sharedBadgeToneModule} must load before ${sharedModalDrawerShellModule}.`);
    }

    for (const [moduleName, ownership] of [
      [sharedBadgeBaseModule, sharedBadgeBaseProperties],
      [sharedBadgeToneModule, sharedBadgeToneProperties]
    ]) {
      const modulePath = resolve(sourceRoot, moduleName);
      if (!existsSync(modulePath)) continue;
      const ownedProperties = findOwnedSelectorProperties(readFileSync(modulePath, 'utf8'), ownership);
      const foundBySelector = new Map();
      for (const { selector, property } of ownedProperties) {
        const properties = foundBySelector.get(selector) || new Set();
        properties.add(property);
        foundBySelector.set(selector, properties);
      }
      for (const [selector, properties] of ownership) {
        const foundProperties = foundBySelector.get(selector) || new Set();
        for (const property of properties) {
          if (!foundProperties.has(property)) {
            failures.push(`Shared badge property is missing from ${moduleName}: ${selector} { ${property} }`);
          }
        }
      }
    }

    if (modalDrawerShellIndex === -1) {
      failures.push(`Shared modal/drawer shell component is missing from manifest: ${sharedModalDrawerShellModule}`);
    } else if (platformPatchIndex !== -1 && modalDrawerShellIndex <= platformPatchIndex) {
      failures.push(`${sharedModalDrawerShellModule} must load after 05-platform-core-patches.css.`);
    } else if (clientBaseIndex !== -1 && modalDrawerShellIndex >= clientBaseIndex) {
      failures.push(`${sharedModalDrawerShellModule} must load before 10-client-plant-device.css.`);
    }

    const modalDrawerShellPath = resolve(sourceRoot, sharedModalDrawerShellModule);
    if (existsSync(modalDrawerShellPath)) {
      const ownedProperties = findOwnedSelectorProperties(
        readFileSync(modalDrawerShellPath, 'utf8'),
        sharedModalDrawerShellProperties
      );
      const foundBySelector = new Map();
      for (const { selector, property } of ownedProperties) {
        const properties = foundBySelector.get(selector) || new Set();
        properties.add(property);
        foundBySelector.set(selector, properties);
      }
      for (const [selector, properties] of sharedModalDrawerShellProperties) {
        const foundProperties = foundBySelector.get(selector) || new Set();
        for (const property of properties) {
          if (!foundProperties.has(property)) {
            failures.push(`Shared modal/drawer shell property is missing from ${sharedModalDrawerShellModule}: ${selector} { ${property} }`);
          }
        }
      }
    }

    if (cardSurfaceIndex === -1) {
      failures.push(`Shared card surface component is missing from manifest: ${sharedCardSurfaceModule}`);
    } else if (foundationIndex !== -1 && cardSurfaceIndex <= foundationIndex) {
      failures.push(`${sharedCardSurfaceModule} must load after 00-foundation.css.`);
    } else if (platformPatchIndex !== -1 && cardSurfaceIndex >= platformPatchIndex) {
      failures.push(`${sharedCardSurfaceModule} must load before 05-platform-core-patches.css.`);
    }

    const cardSurfacePath = resolve(sourceRoot, sharedCardSurfaceModule);
    if (existsSync(cardSurfacePath)) {
      const ownedProperties = findOwnedSelectorProperties(
        readFileSync(cardSurfacePath, 'utf8'),
        sharedCardSurfaceProperties
      );
      const foundBySelector = new Map();
      for (const { selector, property } of ownedProperties) {
        const properties = foundBySelector.get(selector) || new Set();
        properties.add(property);
        foundBySelector.set(selector, properties);
      }
      for (const [selector, properties] of sharedCardSurfaceProperties) {
        const foundProperties = foundBySelector.get(selector) || new Set();
        for (const property of properties) {
          if (!foundProperties.has(property)) {
            failures.push(`Shared card surface property is missing from ${sharedCardSurfaceModule}: ${selector} { ${property} }`);
          }
        }
      }
    }

    if (informationGridContentIndex === -1) {
      failures.push(`Shared information grid content component is missing from manifest: ${sharedInformationGridContentModule}`);
    } else if (foundationIndex !== -1 && informationGridContentIndex <= foundationIndex) {
      failures.push(`${sharedInformationGridContentModule} must load after 00-foundation.css.`);
    } else if (platformPatchIndex !== -1 && informationGridContentIndex >= platformPatchIndex) {
      failures.push(`${sharedInformationGridContentModule} must load before 05-platform-core-patches.css.`);
    }

    if (informationCellOverflowIndex === -1) {
      failures.push(`Shared information cell overflow component is missing from manifest: ${sharedInformationCellOverflowModule}`);
    } else if (devicesAlertsIndex !== -1 && informationCellOverflowIndex <= devicesAlertsIndex) {
      failures.push(`${sharedInformationCellOverflowModule} must load after 30-devices-alerts-and-groups.css.`);
    } else if (metricCardOverflowIndex !== -1 && informationCellOverflowIndex >= metricCardOverflowIndex) {
      failures.push(`${sharedInformationCellOverflowModule} must load before ${sharedMetricCardOverflowModule}.`);
    }

    for (const [moduleName, ownership] of [
      [sharedInformationGridContentModule, sharedInformationGridContentProperties],
      [sharedInformationCellOverflowModule, sharedInformationCellOverflowProperties]
    ]) {
      const modulePath = resolve(sourceRoot, moduleName);
      if (!existsSync(modulePath)) continue;
      const ownedProperties = findOwnedSelectorProperties(readFileSync(modulePath, 'utf8'), ownership);
      const foundBySelector = new Map();
      for (const { selector, property } of ownedProperties) {
        const properties = foundBySelector.get(selector) || new Set();
        properties.add(property);
        foundBySelector.set(selector, properties);
      }
      for (const [selector, properties] of ownership) {
        const foundProperties = foundBySelector.get(selector) || new Set();
        for (const property of properties) {
          if (!foundProperties.has(property)) {
            failures.push(`Shared information cell property is missing from ${moduleName}: ${selector} { ${property} }`);
          }
        }
      }
    }

    if (dataTableContentIndex === -1) {
      failures.push(`Shared data-table content component is missing from manifest: ${sharedDataTableContentModule}`);
    } else if (informationGridContentIndex !== -1 && dataTableContentIndex <= informationGridContentIndex) {
      failures.push(`${sharedDataTableContentModule} must load after ${sharedInformationGridContentModule}.`);
    } else if (platformPatchIndex !== -1 && dataTableContentIndex >= platformPatchIndex) {
      failures.push(`${sharedDataTableContentModule} must load before 05-platform-core-patches.css.`);
    }

    if (formPrimitivesIndex === -1) {
      failures.push(`Shared form primitives component is missing from manifest: ${sharedFormPrimitivesModule}`);
    } else if (dataTableContentIndex !== -1 && formPrimitivesIndex <= dataTableContentIndex) {
      failures.push(`${sharedFormPrimitivesModule} must load after ${sharedDataTableContentModule}.`);
    } else if (platformPatchIndex !== -1 && formPrimitivesIndex >= platformPatchIndex) {
      failures.push(`${sharedFormPrimitivesModule} must load before 05-platform-core-patches.css.`);
    }

    const formPrimitivesPath = resolve(sourceRoot, sharedFormPrimitivesModule);
    if (existsSync(formPrimitivesPath)) {
      const ownedProperties = findOwnedSelectorProperties(
        readFileSync(formPrimitivesPath, 'utf8'),
        sharedFormPrimitiveProperties
      );
      const foundBySelector = new Map();
      for (const { selector, property } of ownedProperties) {
        const properties = foundBySelector.get(selector) || new Set();
        properties.add(property);
        foundBySelector.set(selector, properties);
      }
      for (const [selector, properties] of sharedFormPrimitiveProperties) {
        const foundProperties = foundBySelector.get(selector) || new Set();
        for (const property of properties) {
          if (!foundProperties.has(property)) {
            failures.push(`Shared form primitive property is missing from ${sharedFormPrimitivesModule}: ${selector} { ${property} }`);
          }
        }
      }
    }

    if (dataTableLayoutIndex === -1) {
      failures.push(`Shared data-table layout component is missing from manifest: ${sharedDataTableLayoutModule}`);
    } else {
      const productionTablesIndex = manifest.sources.indexOf('50-production-normalization-tenant-tables.css');
      if (productionTablesIndex !== -1 && dataTableLayoutIndex <= productionTablesIndex) {
        failures.push(`${sharedDataTableLayoutModule} must load after 50-production-normalization-tenant-tables.css.`);
      } else if (actionIndex !== -1 && dataTableLayoutIndex >= actionIndex) {
        failures.push(`${sharedDataTableLayoutModule} must load before ${sharedActionModule}.`);
      }
    }

    for (const [moduleName, ownership] of [
      [sharedDataTableContentModule, sharedDataTableContentProperties],
      [sharedDataTableLayoutModule, sharedDataTableLayoutProperties]
    ]) {
      const modulePath = resolve(sourceRoot, moduleName);
      if (!existsSync(modulePath)) continue;
      const ownedProperties = findOwnedSelectorProperties(readFileSync(modulePath, 'utf8'), ownership);
      const foundBySelector = new Map();
      for (const { selector, property } of ownedProperties) {
        const properties = foundBySelector.get(selector) || new Set();
        properties.add(property);
        foundBySelector.set(selector, properties);
      }
      for (const [selector, properties] of ownership) {
        const foundProperties = foundBySelector.get(selector) || new Set();
        for (const property of properties) {
          if (!foundProperties.has(property)) {
            failures.push(`Shared data-table property is missing from ${moduleName}: ${selector} { ${property} }`);
          }
        }
      }
    }

    if (metricCardContentIndex === -1) {
      failures.push(`Shared metric card content component is missing from manifest: ${sharedMetricCardContentModule}`);
    } else if (foundationIndex !== -1 && metricCardContentIndex <= foundationIndex) {
      failures.push(`${sharedMetricCardContentModule} must load after 00-foundation.css.`);
    } else if (platformPatchIndex !== -1 && metricCardContentIndex >= platformPatchIndex) {
      failures.push(`${sharedMetricCardContentModule} must load before 05-platform-core-patches.css.`);
    }

    if (metricCardOverflowIndex === -1) {
      failures.push(`Shared metric card overflow component is missing from manifest: ${sharedMetricCardOverflowModule}`);
    } else if (devicesAlertsIndex !== -1 && metricCardOverflowIndex <= devicesAlertsIndex) {
      failures.push(`${sharedMetricCardOverflowModule} must load after 30-devices-alerts-and-groups.css.`);
    } else if (commercialDataIndex !== -1 && metricCardOverflowIndex >= commercialDataIndex) {
      failures.push(`${sharedMetricCardOverflowModule} must load before 40-commercial-data-access-audit.css.`);
    }

    for (const [moduleName, ownership] of [
      [sharedMetricCardContentModule, sharedMetricCardContentProperties],
      [sharedMetricCardOverflowModule, sharedMetricCardOverflowProperties]
    ]) {
      const modulePath = resolve(sourceRoot, moduleName);
      if (!existsSync(modulePath)) continue;
      const ownedProperties = findOwnedSelectorProperties(readFileSync(modulePath, 'utf8'), ownership);
      const foundBySelector = new Map();
      for (const { selector, property } of ownedProperties) {
        const properties = foundBySelector.get(selector) || new Set();
        properties.add(property);
        foundBySelector.set(selector, properties);
      }
      for (const [selector, properties] of ownership) {
        const foundProperties = foundBySelector.get(selector) || new Set();
        for (const property of properties) {
          if (!foundProperties.has(property)) {
            failures.push(`Shared metric card property is missing from ${moduleName}: ${selector} { ${property} }`);
          }
        }
      }
    }

    if (actionIndex === -1) {
      failures.push(`Shared action component is missing from manifest: ${sharedActionModule}`);
    } else if (commercialIndex !== -1 && actionIndex > commercialIndex) {
      failures.push(`${sharedActionModule} must load before 60-licensing-billing-payments-rbac.css.`);
    }
    if (actionLayoutIndex === -1) {
      failures.push(`Shared action layout component is missing from manifest: ${sharedActionLayoutModule}`);
    } else if (foundationIndex !== -1 && actionLayoutIndex <= foundationIndex) {
      failures.push(`${sharedActionLayoutModule} must load after 00-foundation.css.`);
    } else if (platformPatchIndex !== -1 && actionLayoutIndex >= platformPatchIndex) {
      failures.push(`${sharedActionLayoutModule} must load before 05-platform-core-patches.css.`);
    }

    if (dataSourceIndicatorsIndex === -1) {
      failures.push(`Data source indicator component is missing from manifest: ${sharedDataSourceIndicatorsModule}`);
    } else if (liveDataStatesIndex === -1 || dataSourceIndicatorsIndex !== liveDataStatesIndex + 1) {
      failures.push(`${sharedDataSourceIndicatorsModule} must load immediately after ${sharedLiveDataStatesModule}.`);
    }

    const dataSourceIndicatorsPath = resolve(sourceRoot, sharedDataSourceIndicatorsModule);
    if (existsSync(dataSourceIndicatorsPath)) {
      const dataSourceCss = readFileSync(dataSourceIndicatorsPath, 'utf8');
      for (const requiredSelector of [
        '.data-source-summary',
        '.data-source-legend',
        '.record-origin-chip',
        '.record-origin-chip.live',
        '.record-origin-chip.unavailable',
        '.record-origin-chip.local',
        '.record-origin-chip.mixed'
      ]) {
        if (!dataSourceCss.includes(requiredSelector)) {
          failures.push(`Data source indicator selector is missing from ${sharedDataSourceIndicatorsModule}: ${requiredSelector}`);
        }
      }
    }

    if (detailCardShellIndex === -1) {
      failures.push(`Shared detail card shell component is missing from manifest: ${sharedDetailCardShellModule}`);
    } else if (clientBaseIndex !== -1 && detailCardShellIndex <= clientBaseIndex) {
      failures.push(`${sharedDetailCardShellModule} must load after 10-client-plant-device.css.`);
    } else if (clientDetailIndex !== -1 && detailCardShellIndex >= clientDetailIndex) {
      failures.push(`${sharedDetailCardShellModule} must load before 11-client-plant-device-details.css.`);
    }

    const detailCardShellPath = resolve(sourceRoot, sharedDetailCardShellModule);
    if (existsSync(detailCardShellPath)) {
      const foundDetailSelectors = new Set(findOwnedSelectors(
        readFileSync(detailCardShellPath, 'utf8'),
        sharedDetailCardShellSelectors
      ));
      for (const selector of sharedDetailCardShellSelectors) {
        if (!foundDetailSelectors.has(selector)) {
          failures.push(`Shared detail card shell selector is missing from ${sharedDetailCardShellModule}: ${selector}`);
        }
      }
    }

    for (const name of manifest.sources) {
      const path = resolve(sourceRoot, name);
      if (!existsSync(path)) continue;
      const cssText = readFileSync(path, 'utf8');
      if (name !== sharedBadgeBaseModule) {
        const duplicateBadgeBaseProperties = findOwnedSelectorProperties(cssText, sharedBadgeBaseProperties);
        for (const { selector, property } of duplicateBadgeBaseProperties) {
          failures.push(`Shared badge base property ${selector} { ${property} } must be owned by ${sharedBadgeBaseModule}, not ${name}.`);
        }
      }
      if (name !== sharedBadgeToneModule) {
        const duplicateBadgeToneProperties = findOwnedSelectorProperties(cssText, sharedBadgeToneProperties);
        for (const { selector, property } of duplicateBadgeToneProperties) {
          failures.push(`Shared badge tone property ${selector} { ${property} } must be owned by ${sharedBadgeToneModule}, not ${name}.`);
        }
      }
      if (name !== sharedModalDrawerShellModule) {
        const duplicateModalDrawerProperties = findOwnedSelectorProperties(cssText, sharedModalDrawerShellProperties);
        for (const { selector, property } of duplicateModalDrawerProperties) {
          failures.push(`Shared modal/drawer shell property ${selector} { ${property} } must be owned by ${sharedModalDrawerShellModule}, not ${name}.`);
        }
      }
      if (name !== sharedInformationGridContentModule) {
        const duplicateInformationProperties = findOwnedSelectorProperties(cssText, sharedInformationGridContentProperties);
        for (const { selector, property } of duplicateInformationProperties) {
          failures.push(`Shared information grid property ${selector} { ${property} } must be owned by ${sharedInformationGridContentModule}, not ${name}.`);
        }
      }
      if (name !== sharedInformationCellOverflowModule) {
        const duplicateInformationOverflowProperties = findOwnedSelectorProperties(cssText, sharedInformationCellOverflowProperties);
        for (const { selector, property } of duplicateInformationOverflowProperties) {
          failures.push(`Shared information cell overflow property ${selector} { ${property} } must be owned by ${sharedInformationCellOverflowModule}, not ${name}.`);
        }
      }
      if (name !== sharedFormPrimitivesModule) {
        const duplicateFormPrimitiveProperties = findOwnedSelectorProperties(cssText, sharedFormPrimitiveUniqueProperties);
        for (const { selector, property } of duplicateFormPrimitiveProperties) {
          failures.push(`Shared form primitive property ${selector} { ${property} } must be owned by ${sharedFormPrimitivesModule}, not ${name}.`);
        }
      }
      if (name !== sharedDataTableContentModule) {
        const duplicateDataTableContentProperties = findOwnedSelectorProperties(cssText, sharedDataTableContentUniqueProperties);
        for (const { selector, property } of duplicateDataTableContentProperties) {
          failures.push(`Shared data-table content property ${selector} { ${property} } must be owned by ${sharedDataTableContentModule}, not ${name}.`);
        }
      }
      if (name !== sharedDataTableLayoutModule) {
        const duplicateDataTableLayoutProperties = findOwnedSelectorProperties(cssText, sharedDataTableLayoutProperties);
        for (const { selector, property } of duplicateDataTableLayoutProperties) {
          failures.push(`Shared data-table layout property ${selector} { ${property} } must be owned by ${sharedDataTableLayoutModule}, not ${name}.`);
        }
      }
      if (name !== sharedCardSurfaceModule) {
        const duplicateSurfaceProperties = findOwnedSelectorProperties(cssText, sharedCardSurfaceProperties);
        for (const { selector, property } of duplicateSurfaceProperties) {
          failures.push(`Shared card surface property ${selector} { ${property} } must be owned by ${sharedCardSurfaceModule}, not ${name}.`);
        }
      }
      if (name !== sharedMetricCardContentModule) {
        const duplicateMetricProperties = findOwnedSelectorProperties(cssText, sharedMetricCardContentProperties);
        for (const { selector, property } of duplicateMetricProperties) {
          failures.push(`Shared metric card content property ${selector} { ${property} } must be owned by ${sharedMetricCardContentModule}, not ${name}.`);
        }
      }
      if (name !== sharedMetricCardOverflowModule) {
        const duplicateMetricOverflowProperties = findOwnedSelectorProperties(cssText, sharedMetricCardOverflowProperties);
        for (const { selector, property } of duplicateMetricOverflowProperties) {
          failures.push(`Shared metric card overflow property ${selector} { ${property} } must be owned by ${sharedMetricCardOverflowModule}, not ${name}.`);
        }
      }
      if (name !== sharedActionModule) {
        const duplicateSelectors = findGlobalActionSelectors(cssText);
        for (const selector of duplicateSelectors) {
          failures.push(`Global action selector ${selector} must be owned by ${sharedActionModule}, not ${name}.`);
        }
      }
      if (name !== sharedActionLayoutModule) {
        const duplicateLayoutSelectors = findGlobalActionLayoutSelectors(cssText);
        for (const selector of duplicateLayoutSelectors) {
          failures.push(`Global action layout selector ${selector} must be owned by ${sharedActionLayoutModule}, not ${name}.`);
        }
      }
    }

    if (existsSync(sourceRoot)) {
      function discoverCssSources(directory, prefix = '') {
        const discovered = [];
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          const relativeName = prefix ? `${prefix}/${entry.name}` : entry.name;
          const absolutePath = resolve(directory, entry.name);
          if (entry.isDirectory()) discovered.push(...discoverCssSources(absolutePath, relativeName));
          else if (entry.isFile() && entry.name.endsWith('.css')) discovered.push(relativeName);
        }
        return discovered;
      }

      for (const name of discoverCssSources(sourceRoot)) {
        if (!listed.has(name)) failures.push(`CSS source fragment is not listed in manifest: ${name}`);
      }
    }
  }
}

if (failures.length) {
  console.error('CSS source-of-truth check failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}

console.log(`CSS source of truth OK: ${manifest.sources.length} ordered fragment(s), generated output kept only in dist/.`);
