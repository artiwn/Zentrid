(function () {
type ZentridTenantLifecycleAction = 'activate' | 'deactivate' | 'archive';
type ZentridTenantLifecycleRecord = Record<string, unknown> & {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  dataOrigin?: unknown;
};

type ZentridTenantLifecycleApi = {
  render(record: ZentridTenantLifecycleRecord): string;
  wire(record: ZentridTenantLifecycleRecord): void;
  isBackendManaged(record: ZentridTenantLifecycleRecord): boolean;
};

const ZentridTenantLifecycle: ZentridTenantLifecycleApi = (() => {
  const FLASH_KEY = 'zentrid_tenant_lifecycle_flash';

  function text(value: unknown, fallback = ''): string {
    const normalized = String(value ?? '').trim();
    return normalized || fallback;
  }

  function escapeHtml(value: unknown): string {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function origin(record: ZentridTenantLifecycleRecord): string {
    if (window.ZentridDataSource) return window.ZentridDataSource.origin(record, 'tenant');
    return text(record.dataOrigin, 'mock').toLowerCase();
  }

  function isBackendManaged(record: ZentridTenantLifecycleRecord): boolean {
    const value = origin(record);
    return value === 'live' || value === 'mixed';
  }

  function normalizedStatus(record: ZentridTenantLifecycleRecord): string {
    return text(record.status, 'Active').toLowerCase();
  }

  function availableActions(record: ZentridTenantLifecycleRecord): ZentridTenantLifecycleAction[] {
    const status = normalizedStatus(record);
    if (status === 'archived') return [];
    if (status === 'active') return ['deactivate', 'archive'];
    return ['activate', 'archive'];
  }

  function actionLabel(action: ZentridTenantLifecycleAction): string {
    if (action === 'activate') return 'Activate';
    if (action === 'deactivate') return 'Deactivate';
    return 'Archive';
  }

  function actionClass(action: ZentridTenantLifecycleAction): string {
    if (action === 'activate') return 'primary-action';
    if (action === 'archive') return 'danger-action';
    return 'secondary-action';
  }

  function confirmation(action: ZentridTenantLifecycleAction, record: ZentridTenantLifecycleRecord): string | null {
    const name = text(record.name, 'this tenant');
    if (action === 'archive') return `Archive ${name}? This changes the tenant lifecycle state on the backend.`;
    if (action === 'deactivate') return `Deactivate ${name}? Tenant access and operations may be affected.`;
    return null;
  }

  function render(record: ZentridTenantLifecycleRecord): string {
    const backendManaged = isBackendManaged(record);
    const status = text(record.status, 'Active');
    const actions = backendManaged ? availableActions(record) : [];
    const actionButtons = actions.map(action => {
      const label = actionLabel(action);
      return `<button type="button" class="${actionClass(action)} tenant-lifecycle-button-v111" data-tenant-lifecycle-action="${action}" data-label="${label}" data-permission-action="${action}" data-permission-resource="tenant" data-permission-status="${escapeHtml(status)}" data-permission-origin="${escapeHtml(origin(record))}">${label}</button>`;
    }).join('');
    const stateText = backendManaged
      ? actions.length
        ? 'Lifecycle actions are written directly to the Zentrid backend.'
        : 'Archived tenant records are read-only.'
      : 'Lifecycle actions are available only for Live API tenant records.';
    const sourceBadge = backendManaged
      ? '<span class="badge success">Backend managed</span>'
      : '<span class="badge muted">Live API required</span>';

    return `<section class="tenant-lifecycle-v111" id="tenantLifecycleActions" data-tenant-lifecycle-origin="${escapeHtml(origin(record))}" aria-live="polite">
      <div class="tenant-lifecycle-copy-v111">
        <span>Tenant lifecycle</span>
        <strong>${escapeHtml(status)}</strong>
        <small>${escapeHtml(stateText)}</small>
      </div>
      <div class="tenant-lifecycle-controls-v111">
        ${sourceBadge}
        <div class="tenant-lifecycle-buttons-v111">${actionButtons}</div>
      </div>
      <div class="tenant-lifecycle-message-v111" id="tenantLifecycleMessage" hidden></div>
    </section>`;
  }

  function setBusy(container: HTMLElement, action: ZentridTenantLifecycleAction | null): void {
    container.setAttribute('aria-busy', action ? 'true' : 'false');
    container.querySelectorAll<HTMLButtonElement>('[data-tenant-lifecycle-action], [data-tenant-lifecycle-retry]').forEach(button => {
      button.disabled = Boolean(action);
      const label = button.dataset.label || button.textContent || '';
      if (!button.dataset.label) button.dataset.label = label;
      if (action && button.dataset.tenantLifecycleAction === action) button.textContent = `${actionLabel(action)}…`;
      else button.textContent = button.dataset.label || label;
    });
  }

  function messageElement(): HTMLElement | null {
    return document.getElementById('tenantLifecycleMessage');
  }

  function showMessage(message: string, tone: 'success' | 'error', retryAction?: ZentridTenantLifecycleAction): void {
    const target = messageElement();
    if (!target) return;
    target.hidden = false;
    target.className = `tenant-lifecycle-message-v111 ${tone}`;
    target.replaceChildren();
    const copy = document.createElement('span');
    copy.textContent = message;
    target.appendChild(copy);
    if (retryAction) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'secondary-action';
      retry.dataset.tenantLifecycleRetry = retryAction;
      retry.dataset.label = 'Retry';
      retry.textContent = 'Retry';
      target.appendChild(retry);
    }
  }

  function mutationFor(action: ZentridTenantLifecycleAction, id: string): Promise<ZentridMutationResult> {
    if (action === 'activate') return ZentridAPIMutations.tenants.activate(id);
    if (action === 'deactivate') return ZentridAPIMutations.tenants.deactivate(id);
    return ZentridAPIMutations.tenants.archive(id);
  }

  function saveFlash(message: string): void {
    try { sessionStorage.setItem(FLASH_KEY, message); } catch (error) {}
  }

  function consumeFlash(): string {
    try {
      const message = sessionStorage.getItem(FLASH_KEY) || '';
      if (message) sessionStorage.removeItem(FLASH_KEY);
      return message;
    } catch (error) { return ''; }
  }

  async function execute(action: ZentridTenantLifecycleAction, record: ZentridTenantLifecycleRecord, container: HTMLElement): Promise<void> {
    if (!isBackendManaged(record)) {
      showMessage('This record is not backed by the live Tenant API. No backend request was sent.', 'error');
      return;
    }
    const id = text(record.id);
    if (!id) {
      showMessage('The live tenant record has no backend identifier.', 'error');
      return;
    }
    const prompt = confirmation(action, record);
    if (prompt) {
      const confirmed = typeof ZentridUX !== 'undefined'
        ? await ZentridUX.confirmAction({
            title: `${actionLabel(action)} tenant?`,
            message: prompt,
            confirmLabel: actionLabel(action),
            tone: action === 'archive' ? 'danger' : 'warning'
          })
        : window.confirm(prompt);
      if (!confirmed) return;
    }
    if (!window.ZentridAPIMutations) {
      showMessage('The mutation service is unavailable on this page.', 'error');
      return;
    }

    setBusy(container, action);
    const result = await mutationFor(action, id);
    if (result.ok) {
      showMessage(result.message, 'success');
      ZentridLayout.toast(result.message);
      saveFlash(result.message);
      window.setTimeout(() => window.location.reload(), 650);
      return;
    }

    setBusy(container, null);
    showMessage(result.message, 'error', result.error.retriable ? action : undefined);
    ZentridLayout.toast(result.message);
  }

  function wire(record: ZentridTenantLifecycleRecord): void {
    const container = document.getElementById('tenantLifecycleActions');
    if (!container || container.dataset.lifecycleWired === 'true') return;
    container.dataset.lifecycleWired = 'true';
    const flash = consumeFlash();
    if (flash) ZentridLayout.toast(flash);
    container.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const actionButton = target.closest<HTMLElement>('[data-tenant-lifecycle-action]');
      const retryButton = target.closest<HTMLElement>('[data-tenant-lifecycle-retry]');
      const action = text(actionButton?.dataset.tenantLifecycleAction || retryButton?.dataset.tenantLifecycleRetry) as ZentridTenantLifecycleAction;
      if (action !== 'activate' && action !== 'deactivate' && action !== 'archive') return;
      if (typeof ZentridActionPermissions !== 'undefined' && !ZentridActionPermissions.guard({ action, resource:'tenant', record, status:record.status })) return;
      void execute(action, record, container);
    });
  }

  return { render, wire, isBackendManaged };
})();

window.ZentridTenantLifecycle = ZentridTenantLifecycle;
})();
