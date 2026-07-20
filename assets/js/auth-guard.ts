(() => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const isLoginPage = page === 'login.html';
  const prefix = window.location.pathname.includes('/pages/') ? '../' : '';
  const REQUIRED_ROLE = 'GlobalAdmin';

  if (!window.ZentridAuth || isLoginPage) return;

  let redirecting = false;

  function redirectToLogin(reason: 'session' | 'role'): void {
    if (redirecting) return;
    redirecting = true;
    ZentridAuth.logout(false);
    const cleanPath = window.location.pathname.replace(/^\/+/, '');
    const next = encodeURIComponent(cleanPath + window.location.search + window.location.hash);
    window.location.replace(`${prefix}login.html?reason=${reason}&next=${next}`);
  }

  function validateSynchronizedSession(): void {
    if (redirecting) return;
    const synchronizedToken = ZentridAuth.getAccessToken();
    if (!synchronizedToken) {
      redirectToLogin('session');
      return;
    }
    const synchronizedRoles = ZentridAuth.getRoles();
    if (synchronizedRoles.length > 0 && !ZentridAuth.hasRole(REQUIRED_ROLE)) redirectToLogin('role');
  }

  window.addEventListener('zentrid:session-expired', () => redirectToLogin('session'));
  window.addEventListener('zentrid:auth', validateSynchronizedSession);
  window.addEventListener('zentrid:session-sync', validateSynchronizedSession);
  window.addEventListener('pageshow', event => {
    if (!(event as PageTransitionEvent).persisted) return;
    void ZentridAuth.ensureSession(REQUIRED_ROLE).then(valid => {
      if (!valid) redirectToLogin(ZentridAuth.getRoles().length > 0 ? 'role' : 'session');
    });
  });

  const token = ZentridAuth.getAccessToken();
  if (!token) {
    redirectToLogin('session');
    return;
  }

  const roles = ZentridAuth.getRoles();
  if (roles.length > 0 && !ZentridAuth.hasRole(REQUIRED_ROLE)) {
    redirectToLogin('role');
    return;
  }

  if (ZentridAuth.isAuthenticated() && ZentridAuth.hasRole(REQUIRED_ROLE)) return;

  void ZentridAuth.ensureSession(REQUIRED_ROLE).then(valid => {
    if (!valid) redirectToLogin(ZentridAuth.getRoles().length > 0 ? 'role' : 'session');
  }).catch(() => redirectToLogin('session'));
})();
