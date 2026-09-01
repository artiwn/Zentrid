const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const root = process.cwd();
const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const read = relative => {
  const full = join(root, relative);
  expect(existsSync(full), `Missing file: ${relative}`);
  return existsSync(full) ? readFileSync(full, 'utf8') : '';
};

const live = read('assets/js/live-api-ui.ts');
const devices = read('assets/js/devices.ts');
const alerts = read('assets/js/alerts.ts');
const pkg = JSON.parse(read('package.json') || '{}');

[
  "device: 'zentrid_selected_device_record'",
  "alert: 'zentrid_selected_alert_record'",
  'function saveDetailSelection(',
  'function readDetailSelection(',
  'window.ZentridLiveSelection = {',
  'allowListFallback: false',
  "detailSourceMode: 'snapshot'",
  'const registryRecord = (result.item || result.items.find(record => detailSelectionMatches(record, requestedRegistryId)))',
  'Snapshot values are not merged into a successful Registry response.',
  "The selected alert was restored from this browser session because the direct Alert Registry detail request failed."
].forEach(token => expect(live.includes(token), `Detail selection snapshot token is missing: ${token}`));

expect(!live.includes("mappedDevices.find(d => d.id === selectedId || d.externalId === selectedId || d.serial === selectedId) || mappedDevices[0]"), 'Device Detail still replaces a missing selected device with the first API row.');
expect(live.includes('async function resolveAlertLiveId('), 'Alert Detail does not resolve a separate Platform Live alert identity.');
expect(live.includes("cacheVariant: 'live'"), 'Alert live identity resolution is not using the live alert collection.');
expect(!live.includes('liveAlerts.get(selectedId, requestOptions)'), 'Alert Detail still sends the Alert Registry id directly to Platform Live /api/alerts/{id}.');
expect(live.includes('adminRaw.__timelineLoaded === true'), 'Alert Detail does not distinguish successful Registry subresource loads from failed requests.');
expect(live.includes("adminTelemetryCurveLoaded ? 'admin' : liveTelemetryCurveLoaded ? 'live' : 'none'"), 'Alert telemetry-curve source priority is not Registry-first.');
expect(devices.includes('window.ZentridLiveSelection?.selectDevice'), 'Device Registry does not preserve the selected live record before navigation.');
expect(devices.includes('window.ZentridLiveSelection?.readDevice'), 'Device Detail renderer does not read the preserved selected record.');
expect(alerts.includes('window.ZentridLiveSelection?.selectAlert'), 'Alert Registry does not preserve the selected live record before navigation.');
expect(alerts.includes('window.ZentridLiveSelection?.readAlert'), 'Alert Detail renderer does not read the preserved selected record.');
expect(live.includes("onclick=\"window.ZentridLiveSelection.selectDevice"), 'Plant related-device navigation does not preserve the selected live record.');
expect(live.includes("onclick=\"window.ZentridLiveSelection.selectAlert"), 'Related-alert navigation does not preserve the selected live record.');
expect(pkg.scripts?.['check:detail-selection-snapshot'] === 'node scripts/check-detail-selection-snapshot.js', 'Package script check:detail-selection-snapshot is missing.');
expect(String(pkg.scripts?.verify || '').includes('check:detail-selection-snapshot'), 'verify does not run the detail selection snapshot check.');
expect(String(pkg.scripts?.['verify:vercel'] || '').includes('check:detail-selection-snapshot'), 'verify:vercel does not run the detail selection snapshot check.');

if (failures.length) {
  console.error('Device/Alert detail selection snapshot checks failed.');
  failures.forEach(message => console.error(`  ${message}`));
  process.exit(1);
}
console.log('Device/Alert detail selection snapshot checks OK: Device Detail is direct-Registry-first with snapshot-only failure fallback; Alert Detail preserves exact selected records without first-row substitution.');
