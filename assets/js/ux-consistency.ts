type ZentridUXTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';
type ZentridUXStateKind = 'loading' | 'empty' | 'error' | 'success' | 'warning' | 'info';

type ZentridUXStatusDefinition = {
  label: string;
  tone: ZentridUXTone;
};

type ZentridUXConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger' | 'warning';
};

type ZentridUXStateOptions = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

const ZentridUX = (() => {
  const statusDefinitions: Record<string, ZentridUXStatusDefinition> = {
    active: { label: 'Active', tone: 'success' },
    online: { label: 'Online', tone: 'success' },
    normal: { label: 'Normal', tone: 'success' },
    healthy: { label: 'Healthy', tone: 'success' },
    connected: { label: 'Connected', tone: 'success' },
    valid: { label: 'Valid', tone: 'success' },
    verified: { label: 'Verified', tone: 'success' },
    approved: { label: 'Approved', tone: 'success' },
    completed: { label: 'Completed', tone: 'success' },
    complete: { label: 'Complete', tone: 'success' },
    resolved: { label: 'Resolved', tone: 'success' },
    passed: { label: 'Passed', tone: 'success' },
    success: { label: 'Success', tone: 'success' },
    ready: { label: 'Ready', tone: 'success' },
    paid: { label: 'Paid', tone: 'success' },
    processed: { label: 'Processed', tone: 'success' },
    matched: { label: 'Matched', tone: 'success' },
    configured: { label: 'Configured', tone: 'success' },
    fresh: { label: 'Fresh', tone: 'success' },
    acknowledged: { label: 'Acknowledged', tone: 'success' },
    warning: { label: 'Warning', tone: 'warning' },
    attention: { label: 'Needs Attention', tone: 'warning' },
    'needs attention': { label: 'Needs Attention', tone: 'warning' },
    pending: { label: 'Pending', tone: 'warning' },
    draft: { label: 'Draft', tone: 'warning' },
    suspended: { label: 'Suspended', tone: 'warning' },
    delayed: { label: 'Delayed', tone: 'warning' },
    partial: { label: 'Partial', tone: 'warning' },
    review: { label: 'Review', tone: 'warning' },
    'in review': { label: 'In Review', tone: 'warning' },
    unacknowledged: { label: 'Unacknowledged', tone: 'warning' },
    due: { label: 'Due', tone: 'warning' },
    expiring: { label: 'Expiring', tone: 'warning' },
    processing: { label: 'Processing', tone: 'warning' },
    'in progress': { label: 'In Progress', tone: 'warning' },
    retrying: { label: 'Retrying', tone: 'warning' },
    inactive: { label: 'Inactive', tone: 'neutral' },
    archived: { label: 'Archived', tone: 'neutral' },
    disabled: { label: 'Disabled', tone: 'neutral' },
    cancelled: { label: 'Cancelled', tone: 'neutral' },
    canceled: { label: 'Cancelled', tone: 'neutral' },
    closed: { label: 'Closed', tone: 'neutral' },
    unknown: { label: 'Unknown', tone: 'neutral' },
    'not configured': { label: 'Not Configured', tone: 'neutral' },
    'no data': { label: 'No Data', tone: 'neutral' },
    unsupported: { label: 'Unsupported', tone: 'neutral' },
    fault: { label: 'Fault', tone: 'danger' },
    failed: { label: 'Failed', tone: 'danger' },
    error: { label: 'Error', tone: 'danger' },
    critical: { label: 'Critical', tone: 'danger' },
    offline: { label: 'Offline', tone: 'danger' },
    blocked: { label: 'Blocked', tone: 'danger' },
    rejected: { label: 'Rejected', tone: 'danger' },
    overdue: { label: 'Overdue', tone: 'danger' },
    expired: { label: 'Expired', tone: 'danger' }
  };

  const stateIcons: Record<ZentridUXStateKind, string> = {
    loading: '↻',
    empty: '∅',
    error: '!',
    success: '✓',
    warning: '△',
    info: 'i'
  };

  let confirmResolver: ((value: boolean) => void) | null = null;
  let confirmReturnFocus: HTMLElement | null = null;
  let observer: MutationObserver | null = null;
  const pendingRoots = new Set<HTMLElement>();

  function escape(value: unknown): string {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function normalizedStatus(value: unknown): string {
    return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  function status(value: unknown): ZentridUXStatusDefinition | null {
    return statusDefinitions[normalizedStatus(value)] || null;
  }

  function statusTone(value: unknown, fallback: ZentridUXTone = 'neutral'): ZentridUXTone {
    return status(value)?.tone || fallback;
  }

  function statusLabel(value: unknown): string {
    return status(value)?.label || String(value ?? '').trim();
  }

  function applyStatusElement(element: HTMLElement): void {
    if (element.dataset.zentridStatusLocked === 'true') return;
    const raw = element.dataset.status || element.dataset.state || element.textContent || '';
    const definition = status(raw);
    if (!definition) return;
    const toneClasses = ['good', 'warn', 'bad', 'success', 'warning', 'danger', 'muted', 'neutral', 'info'];
    toneClasses.forEach(className => element.classList.remove(className));
    const className = definition.tone === 'neutral' ? 'muted' : definition.tone;
    element.classList.add(className);
    element.dataset.zentridStatus = normalizedStatus(raw);
    element.dataset.zentridStatusTone = definition.tone;
    if (element.childElementCount === 0 && element.textContent?.trim() !== definition.label) element.textContent = definition.label;
    if (!element.hasAttribute('aria-label')) element.setAttribute('aria-label', `Status: ${definition.label}`);
  }

  function applyStatuses(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('.badge, .status-pill, .status-badge, [data-status]').forEach(applyStatusElement);
    if (root instanceof HTMLElement && root.matches?.('.badge, .status-pill, .status-badge, [data-status]')) applyStatusElement(root);
  }

  function ensureStateCopy(element: HTMLElement, icon: HTMLElement): HTMLElement {
    let copy = Array.from(element.children).find(child => child.classList.contains('zentrid-ux-state-copy')) as HTMLElement | undefined;
    if (!copy) {
      copy = document.createElement('div');
      copy.className = 'zentrid-ux-state-copy';
    }
    Array.from(element.childNodes).forEach(node => {
      if (node === icon || node === copy) return;
      copy?.append(node);
    });
    if (copy.parentElement !== element) element.append(copy);
    element.dataset.zentridUxStateCopyWrapped = 'true';
    return copy;
  }

  function enhanceStateElement(element: HTMLElement, kind: ZentridUXStateKind): void {
    if (element.dataset.zentridUxStateEnhanced === 'true') return;
    element.dataset.zentridUxStateEnhanced = 'true';
    element.dataset.zentridUxState = kind;
    element.classList.add('zentrid-ux-state', `zentrid-ux-state-${kind}`);
    element.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    element.setAttribute('aria-live', kind === 'error' ? 'assertive' : 'polite');
    let icon = Array.from(element.children).find(child => child.classList.contains('zentrid-ux-state-icon')) as HTMLElement | undefined;
    if (!icon) {
      icon = document.createElement('span');
      icon.className = 'zentrid-ux-state-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = stateIcons[kind];
      element.prepend(icon);
    }
    ensureStateCopy(element, icon);
  }

  function enhanceStates(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('.empty-state, .empty-card, .empty-search').forEach(element => enhanceStateElement(element, 'empty'));
    root.querySelectorAll<HTMLElement>('.api-error, .error-state, [data-state="error"]').forEach(element => enhanceStateElement(element, 'error'));
    root.querySelectorAll<HTMLElement>('.loading-state, [data-state="loading"]').forEach(element => enhanceStateElement(element, 'loading'));
  }

  function stateMarkup(kind: ZentridUXStateKind, options: ZentridUXStateOptions): string {
    const action = options.actionLabel
      ? `<button type="button" class="secondary-action zentrid-ux-state-action">${escape(options.actionLabel)}</button>`
      : '';
    return `<section class="zentrid-ux-state zentrid-ux-state-${kind}" data-zentrid-ux-state="${kind}" role="${kind === 'error' ? 'alert' : 'status'}" aria-live="${kind === 'error' ? 'assertive' : 'polite'}">
      <span class="zentrid-ux-state-icon" aria-hidden="true">${stateIcons[kind]}</span>
      <div class="zentrid-ux-state-copy"><strong>${escape(options.title)}</strong><span>${escape(options.message)}</span>${action}</div>
    </section>`;
  }

  function renderState(container: HTMLElement, kind: ZentridUXStateKind, options: ZentridUXStateOptions): void {
    container.innerHTML = stateMarkup(kind, options);
    if (options.actionLabel && options.onAction) container.querySelector<HTMLButtonElement>('.zentrid-ux-state-action')?.addEventListener('click', options.onAction);
  }

  function inferTone(message: string): ZentridUXTone {
    const value = message.toLowerCase();
    if (/\b(fail|failed|error|unable|denied|invalid|blocked|expired|not saved)\b/.test(value)) return 'danger';
    if (/\b(warn|warning|pending|draft|local|read-only|unavailable|delayed|required)\b/.test(value)) return 'warning';
    if (/\b(success|successful|saved|created|completed|updated|approved|activated|connected|passed|ready)\b/.test(value)) return 'success';
    return 'info';
  }

  function ensureConfirmDialog(): HTMLElement {
    let overlay = document.getElementById('zentridUxConfirmOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'zentridUxConfirmOverlay';
    overlay.className = 'zentrid-ux-confirm-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `<section class="zentrid-ux-confirm" role="alertdialog" aria-modal="true" aria-labelledby="zentridUxConfirmTitle" aria-describedby="zentridUxConfirmMessage">
      <span class="zentrid-ux-confirm-icon" aria-hidden="true">!</span>
      <div class="zentrid-ux-confirm-copy"><strong id="zentridUxConfirmTitle"></strong><span id="zentridUxConfirmMessage"></span></div>
      <div class="zentrid-ux-confirm-actions"><button type="button" class="secondary-action" data-zentrid-confirm="cancel">Cancel</button><button type="button" class="primary-action" data-zentrid-confirm="accept">Confirm</button></div>
    </section>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const choice = target.closest<HTMLElement>('[data-zentrid-confirm]')?.dataset.zentridConfirm;
      if (choice === 'accept') closeConfirm(true);
      if (choice === 'cancel' || target === overlay) closeConfirm(false);
    });
    document.addEventListener('keydown', event => {
      if (overlay?.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeConfirm(false);
      }
      if (event.key === 'Tab') trapConfirmFocus(event, overlay);
    });
    return overlay;
  }

  function trapConfirmFocus(event: KeyboardEvent, overlay: HTMLElement): void {
    const focusable = Array.from(overlay.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function closeConfirm(value: boolean): void {
    const overlay = document.getElementById('zentridUxConfirmOverlay');
    if (overlay) overlay.hidden = true;
    const resolver = confirmResolver;
    confirmResolver = null;
    resolver?.(value);
    confirmReturnFocus?.focus({ preventScroll: true });
    confirmReturnFocus = null;
  }

  function confirmAction(options: ZentridUXConfirmOptions): Promise<boolean> {
    if (confirmResolver) closeConfirm(false);
    const overlay = ensureConfirmDialog();
    const panel = overlay.querySelector<HTMLElement>('.zentrid-ux-confirm');
    const title = overlay.querySelector<HTMLElement>('#zentridUxConfirmTitle');
    const message = overlay.querySelector<HTMLElement>('#zentridUxConfirmMessage');
    const accept = overlay.querySelector<HTMLButtonElement>('[data-zentrid-confirm="accept"]');
    const cancel = overlay.querySelector<HTMLButtonElement>('[data-zentrid-confirm="cancel"]');
    if (!panel || !title || !message || !accept || !cancel) return Promise.resolve(false);
    confirmReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    title.textContent = options.title;
    message.textContent = options.message;
    accept.textContent = options.confirmLabel || 'Confirm';
    cancel.textContent = options.cancelLabel || 'Cancel';
    panel.dataset.tone = options.tone || 'primary';
    accept.className = options.tone === 'danger' ? 'danger-action' : options.tone === 'warning' ? 'secondary-action warning-action' : 'primary-action';
    overlay.hidden = false;
    requestAnimationFrame(() => cancel.focus());
    return new Promise<boolean>(resolve => { confirmResolver = resolve; });
  }

  function flushObservedRoots(): void {
    const roots = [...pendingRoots];
    pendingRoots.clear();
    roots.forEach(root => {
      if (!root.isConnected) return;
      applyStatuses(root);
      enhanceStates(root);
    });
  }

  function scheduleObservedFlush(): void {
    if (window.ZentridRuntimeStability) {
      ZentridRuntimeStability.frame('ux-consistency:mutations', flushObservedRoots);
      return;
    }
    requestAnimationFrame(flushObservedRoots);
  }

  function stopObserving(): void {
    observer?.disconnect();
    observer = null;
    pendingRoots.clear();
  }

  function observe(): void {
    if (observer) return;
    observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) pendingRoots.add(node);
      }));
      if (pendingRoots.size) scheduleObservedFlush();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    ZentridRuntimeStability?.registerCleanup('ux-consistency:observer', stopObserving);
  }

  function init(): void {
    applyStatuses(document);
    enhanceStates(document);
    observe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();

  return {
    applyStatuses,
    confirmAction,
    enhanceStates,
    escape,
    inferTone,
    renderState,
    stateMarkup,
    status,
    statusLabel,
    statusTone
  };
})();

Object.assign(window, { ZentridUX });
