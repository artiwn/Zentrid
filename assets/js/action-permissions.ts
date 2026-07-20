type ZentridPermissionAction = 'view' | 'create' | 'edit' | 'activate' | 'deactivate' | 'suspend' | 'archive' | 'export';
type ZentridPermissionResource = 'tenant' | 'client' | 'plant' | 'integration' | 'report' | 'generic';
type ZentridPermissionProfile = 'platform-admin' | 'tenant-admin' | 'client-admin' | 'operator' | 'finance' | 'viewer' | 'restricted' | 'verifying';

type ZentridPermissionContext = {
  action: ZentridPermissionAction;
  resource?: ZentridPermissionResource;
  record?: unknown;
  status?: unknown;
  origin?: unknown;
  updateAvailable?: boolean;
  localOverride?: boolean;
};

type ZentridPermissionDecision = {
  allowed: boolean;
  action: ZentridPermissionAction;
  resource: ZentridPermissionResource;
  profile: ZentridPermissionProfile;
  profileLabel: string;
  reason: string;
};

type ZentridPermissionApi = {
  currentProfile(): ZentridPermissionProfile;
  currentProfileLabel(): string;
  decide(context: ZentridPermissionContext): ZentridPermissionDecision;
  can(context: ZentridPermissionContext): boolean;
  guard(context: ZentridPermissionContext, onDenied?: (decision: ZentridPermissionDecision) => void): boolean;
  apply(element: HTMLElement, context?: ZentridPermissionContext): ZentridPermissionDecision | null;
  refresh(root?: ParentNode): void;
  summary(resource?: ZentridPermissionResource): string;
};

const ZentridActionPermissions: ZentridPermissionApi = (() => {
  const mutableActions = new Set<ZentridPermissionAction>(['create', 'edit', 'activate', 'deactivate', 'suspend', 'archive']);
  const profileLabels: Record<ZentridPermissionProfile, string> = {
    'platform-admin': 'Platform Administrator',
    'tenant-admin': 'Tenant Administrator',
    'client-admin': 'Client Administrator',
    operator: 'Operations / Engineer',
    finance: 'Finance User',
    viewer: 'Read-only Viewer',
    restricted: 'Restricted Role',
    verifying: 'Verifying access'
  };

  const roleAliases: Array<{ profile: ZentridPermissionProfile; values: string[] }> = [
    { profile: 'platform-admin', values: ['globaladmin', 'global admin', 'platformadministrator', 'platform administrator', 'superadmin', 'super admin'] },
    { profile: 'tenant-admin', values: ['tenantadmin', 'tenant admin', 'tenantadministrator', 'tenant administrator', 'organizationadmin', 'organization admin'] },
    { profile: 'client-admin', values: ['clientadmin', 'client admin', 'owneruser', 'owner user'] },
    { profile: 'operator', values: ['operator', 'operationsviewer', 'operations viewer', 'omengineer', 'o&m engineer', 'fieldengineer', 'field engineer', 'serviceuser', 'service user'] },
    { profile: 'finance', values: ['financeuser', 'finance user', 'financeviewer', 'finance viewer'] },
    { profile: 'viewer', values: ['viewer', 'readonly', 'read only', 'read-only', 'readonlyviewer', 'read-only viewer', 'analyst'] }
  ];

  const policy: Record<ZentridPermissionProfile, Partial<Record<ZentridPermissionResource, ZentridPermissionAction[]>>> = {
    'platform-admin': {
      tenant: ['view', 'create', 'edit', 'activate', 'deactivate', 'archive', 'export'],
      client: ['view', 'create', 'edit', 'archive', 'export'],
      plant: ['view', 'create', 'edit', 'archive', 'export'],
      integration: ['view', 'create', 'edit', 'activate', 'suspend', 'archive', 'export'],
      report: ['view', 'create', 'export'],
      generic: ['view', 'create', 'edit', 'activate', 'deactivate', 'suspend', 'archive', 'export']
    },
    'tenant-admin': {
      tenant: ['view', 'export'],
      client: ['view', 'create', 'edit', 'export'],
      plant: ['view', 'create', 'edit', 'export'],
      integration: ['view', 'export'],
      report: ['view', 'create', 'export'],
      generic: ['view', 'export']
    },
    'client-admin': {
      tenant: ['view'],
      client: ['view', 'edit', 'export'],
      plant: ['view', 'export'],
      integration: [],
      report: ['view', 'export'],
      generic: ['view']
    },
    operator: {
      tenant: [],
      client: ['view'],
      plant: ['view'],
      integration: ['view'],
      report: ['view'],
      generic: ['view']
    },
    finance: {
      tenant: ['view', 'export'],
      client: ['view', 'export'],
      plant: ['view', 'export'],
      integration: [],
      report: ['view', 'create', 'export'],
      generic: ['view', 'export']
    },
    viewer: {
      tenant: ['view'],
      client: ['view'],
      plant: ['view'],
      integration: ['view'],
      report: ['view'],
      generic: ['view']
    },
    restricted: {
      tenant: [], client: [], plant: [], integration: [], report: [], generic: []
    },
    verifying: {
      tenant: ['view'], client: ['view'], plant: ['view'], integration: ['view'], report: ['view'], generic: ['view']
    }
  };

  function normalize(value: unknown): string {
    return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  }

  function roleProfile(role: string): ZentridPermissionProfile | null {
    const normalized = normalize(role);
    for (const entry of roleAliases) {
      if (entry.values.some(value => normalize(value) === normalized)) return entry.profile;
    }
    return null;
  }

  function currentProfile(): ZentridPermissionProfile {
    const roles: string[] = window.ZentridAuth?.getRoles?.() || [];
    if (!roles.length) return window.ZentridAuth?.getAccessToken?.() ? 'verifying' : 'restricted';
    const profiles = roles.map(roleProfile).filter((value: ZentridPermissionProfile | null): value is ZentridPermissionProfile => Boolean(value));
    const priority: ZentridPermissionProfile[] = ['platform-admin', 'tenant-admin', 'client-admin', 'operator', 'finance', 'viewer'];
    return priority.find(item => profiles.includes(item)) || 'restricted';
  }

  function currentProfileLabel(): string {
    return profileLabels[currentProfile()];
  }

  function recordValue(record: unknown, key: string): unknown {
    return record && typeof record === 'object' ? (record as Record<string, unknown>)[key] : undefined;
  }

  function resolveOrigin(context: ZentridPermissionContext): string {
    const explicit = normalize(context.origin);
    if (explicit) return explicit;
    const record = context.record;
    const resource = context.resource || 'generic';
    if (record && window.ZentridDataSource && resource !== 'generic' && resource !== 'report') {
      return normalize(window.ZentridDataSource.origin(record, resource));
    }
    return normalize(recordValue(record, 'dataOrigin') || recordValue(record, 'source'));
  }

  function resolveStatus(context: ZentridPermissionContext): string {
    return normalize(context.status || recordValue(context.record, 'status') || recordValue(context.record, 'lifecycleStatus'));
  }

  function roleAllows(profile: ZentridPermissionProfile, resource: ZentridPermissionResource, action: ZentridPermissionAction): boolean {
    return (policy[profile][resource] || policy[profile].generic || []).includes(action);
  }

  function decisionReason(context: ZentridPermissionContext, profile: ZentridPermissionProfile, allowedByRole: boolean): string {
    const action = context.action;
    const resource = context.resource || 'generic';
    const status = resolveStatus(context);
    const origin = resolveOrigin(context);
    const backendManaged = origin === 'live' || origin === 'mixed';

    if (profile === 'verifying' && mutableActions.has(action)) return 'Permissions are still being verified. Try again after the session finishes loading.';
    if (!allowedByRole) return `${profileLabels[profile]} does not allow ${action} on ${resource} records.`;
    if (status === 'archived' && mutableActions.has(action)) return `Archived ${resource} records are read-only.`;
    if (action === 'edit' && backendManaged && context.updateAvailable === false && context.localOverride !== true) return `Live ${resource} editing is unavailable until the backend exposes an update endpoint.`;
    if (action === 'edit' && backendManaged && context.updateAvailable === false && context.localOverride === true) return `${profileLabels[profile]} permits a local browser override. No backend request will be sent.`;

    if (resource === 'tenant') {
      if (action === 'activate' && ['active', 'archived'].includes(status)) return `Tenant cannot be activated from ${status || 'its current'} status.`;
      if (action === 'deactivate' && status !== 'active') return 'Only an active tenant can be deactivated.';
      if (action === 'archive' && status === 'archived') return 'Tenant is already archived.';
    }
    if (resource === 'integration') {
      if (action === 'activate' && ['active', 'archived'].includes(status)) return `Connector cannot be activated from ${status || 'its current'} status.`;
      if (action === 'suspend' && status !== 'active') return 'Only an active connector can be suspended.';
      if (action === 'archive' && status === 'archived') return 'Connector is already archived.';
    }
    return `${profileLabels[profile]} permits this action.`;
  }

  function decide(context: ZentridPermissionContext): ZentridPermissionDecision {
    const resource = context.resource || 'generic';
    const profile = currentProfile();
    const allowedByRole = roleAllows(profile, resource, context.action);
    const reason = decisionReason(context, profile, allowedByRole);
    const localOverridePermit = context.action === 'edit' && context.localOverride === true && reason.includes('permits a local browser override');
    const blockedByConstraint = !localOverridePermit && reason !== `${profileLabels[profile]} permits this action.`;
    return {
      allowed: allowedByRole && !blockedByConstraint,
      action: context.action,
      resource,
      profile,
      profileLabel: profileLabels[profile],
      reason
    };
  }

  function can(context: ZentridPermissionContext): boolean {
    return decide(context).allowed;
  }

  function guard(context: ZentridPermissionContext, onDenied?: (decision: ZentridPermissionDecision) => void): boolean {
    const result = decide(context);
    if (result.allowed) return true;
    if (onDenied) onDenied(result);
    else if (window.ZentridLayout?.toast) window.ZentridLayout.toast(result.reason);
    return false;
  }

  function contextFromElement(element: HTMLElement): ZentridPermissionContext | null {
    const action = element.dataset.permissionAction as ZentridPermissionAction | undefined;
    if (!action) return null;
    const context: ZentridPermissionContext = {
      action,
      resource: (element.dataset.permissionResource || 'generic') as ZentridPermissionResource,
      status: element.dataset.permissionStatus,
      origin: element.dataset.permissionOrigin
    };
    if (element.dataset.permissionUpdateAvailable !== undefined) {
      context.updateAvailable = element.dataset.permissionUpdateAvailable === 'true';
    }
    if (element.dataset.permissionLocalOverride !== undefined) {
      context.localOverride = element.dataset.permissionLocalOverride === 'true';
    }
    return context;
  }

  function apply(element: HTMLElement, context = contextFromElement(element) || undefined): ZentridPermissionDecision | null {
    if (!context) return null;
    const result = decide(context);
    const control = element as HTMLButtonElement;
    const baseDisabled = element.dataset.permissionBaseDisabled === 'true' || element.dataset.defaultDisabled === 'true';
    if (element.dataset.permissionOriginalTitle === undefined) element.dataset.permissionOriginalTitle = element.getAttribute('title') || '';
    const originalTitle = element.dataset.permissionOriginalTitle || '';
    element.dataset.permissionState = result.allowed ? 'allowed' : 'denied';
    element.dataset.permissionReason = result.reason;
    element.dataset.permissionProfile = result.profile;
    element.setAttribute('title', !result.allowed ? result.reason : baseDisabled ? (originalTitle || 'Action is unavailable in the current record state.') : (originalTitle || `${result.profileLabel}: allowed`));

    if ('disabled' in control) control.disabled = baseDisabled || !result.allowed;
    element.setAttribute('aria-disabled', baseDisabled || !result.allowed ? 'true' : 'false');
    element.classList.toggle('permission-denied-v121', !result.allowed);
    return result;
  }

  function updateSummary(element: HTMLElement): void {
    const resource = (element.dataset.permissionResource || 'generic') as ZentridPermissionResource;
    const profile = currentProfile();
    const text = `${profileLabels[profile]} · ${resource === 'generic' ? 'Current workspace' : resource}`;
    if (element.textContent !== text) element.textContent = text;
    element.dataset.permissionProfile = profile;
    element.classList.toggle('warning', profile === 'verifying' || profile === 'restricted');
  }

  function refresh(root: ParentNode = document): void {
    root.querySelectorAll<HTMLElement>('[data-permission-action]').forEach(element => apply(element));
    root.querySelectorAll<HTMLElement>('[data-permission-summary]').forEach(updateSummary);
  }

  function summary(resource: ZentridPermissionResource = 'generic'): string {
    return `${currentProfileLabel()} · ${resource === 'generic' ? 'Current workspace' : resource}`;
  }

  function install(): void {
    const run = (): void => refresh(document);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
    else run();

    document.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const element = target.closest<HTMLElement>('[data-permission-action]');
      if (!element) return;
      const context = contextFromElement(element);
      if (!context) return;
      const result = decide(context);
      if (result.allowed) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (window.ZentridLayout?.toast) window.ZentridLayout.toast(result.reason);
    }, true);

    window.addEventListener('zentrid:auth', run);
    const observer = new MutationObserver(records => {
      if (!records.some(record => record.type === 'childList' && record.addedNodes.length > 0)) return;
      refresh(document);
    });
    const observe = (): void => {
      if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    };
    if (document.body) observe();
    else document.addEventListener('DOMContentLoaded', observe, { once: true });
  }

  install();
  return { currentProfile, currentProfileLabel, decide, can, guard, apply, refresh, summary };
})();

Object.assign(window, { ZentridActionPermissions });
