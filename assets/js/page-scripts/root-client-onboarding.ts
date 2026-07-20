const KEY_INVITES = 'zentrid_tenant_invites_v1';

type TenantInvite = Record<string, unknown> & {
  token?: string;
  tenantName?: string;
  email?: string;
  country?: string;
  tenantType?: string;
  status?: string;
};

type ContactPayload = Record<string, string> & {
  fullName?: string;
  email?: string;
  phone?: string;
};

const read = <T>(key: string, fallback: T): T => JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) as T;
const write = <T>(key: string, value: T): void => localStorage.setItem(key, JSON.stringify(value));
const params = new URLSearchParams(location.search);
const token = params.get('token') || '';
let invites = read<TenantInvite[]>(KEY_INVITES, []);
let invite: TenantInvite = invites.find(i => i.token === token) || { token, tenantName:'New Tenant', email:'', country:'', tenantType:'Owner', status:'Direct form' };
const summary = document.getElementById('inviteSummary');
if (summary) {
  summary.innerHTML = `<div><span>Tenant</span><strong>${invite.tenantName || 'New Tenant'}</strong></div><div><span>Invitation status</span><strong>${invite.status || 'Invited'}</strong></div><div><span>Primary email</span><strong>${invite.email || '—'}</strong></div><div><span>Country</span><strong>${invite.country || '—'}</strong></div>`;
}
const form = document.getElementById('onboardingForm') as (HTMLFormElement & Record<string, HTMLInputElement | HTMLSelectElement>) | null;
if(form && invite.email) form.email.value = invite.email;
if(form && invite.country) form.country.value = invite.country;
if(form && invite.tenantType) form.tenantType.value = invite.tenantType;
if(form && invite.tenantName) form.legalName.value = invite.tenantName;

const labels = ['Company','Address','Contacts','Portal','Compliance'];
let current = 0;
const stepsEl = document.getElementById('steps');
if (stepsEl) stepsEl.innerHTML = labels.map((l,i)=>`<button type="button" data-jump="${i}" class="${i===0?'active':''}">${i+1}. ${l}</button>`).join('');
function showStep(i: number): void{
  current = Math.max(0, Math.min(labels.length-1, i));
  document.querySelectorAll<HTMLElement>('.step').forEach(s => s.classList.toggle('active', Number(s.dataset.step) === current));
  document.querySelectorAll<HTMLElement>('[data-jump]').forEach(b => b.classList.toggle('active', Number(b.dataset.jump) === current));
  const prevBtn = document.getElementById('prevBtn') as HTMLElement | null;
  const nextBtn = document.getElementById('nextBtn') as HTMLElement | null;
  const submitBtn = document.getElementById('submitBtn') as HTMLElement | null;
  prevBtn?.classList.toggle('is-invisible', current === 0);
  if (nextBtn) nextBtn.hidden = current === labels.length - 1;
  if (submitBtn) submitBtn.hidden = current !== labels.length - 1;
}
document.querySelectorAll<HTMLElement>('[data-jump]').forEach(b => b.onclick = () => showStep(Number(b.dataset.jump)));
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
if (prevBtn) prevBtn.onclick = () => showStep(current - 1);
if (nextBtn) nextBtn.onclick = () => showStep(current + 1);
showStep(0);

function refreshContactNumbers(): void{
  document.querySelectorAll<HTMLElement>('[data-contact-card]').forEach((card, index) => {
    const title = card.querySelector<HTMLElement>('.contact-head strong');
    if(title) title.textContent = `Contact ${index + 1}`;
    const note = card.querySelector<HTMLElement>('.contact-head .hint');
    if(note) note.textContent = index === 0 ? 'Primary contact is required' : 'Additional contact';
    card.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach(el => {
      const base = el.getAttribute('data-contact-field') || el.name;
      el.name = index === 0 ? (base === 'fullName' ? 'contactName' : base === 'role' ? 'contactRole' : base === 'phone' ? 'phone' : base) : `contact_${index}_${base}`;
      if(index > 0) el.required = false;
    });
  });
}

function addContact(): void{
  const list = document.getElementById('contactList');
  const first = list?.querySelector<HTMLElement>('[data-contact-card]');
  if (!list || !first) return;
  const clone = first.cloneNode(true) as HTMLElement;
  clone.querySelectorAll<HTMLInputElement>('input').forEach(input => input.value = '');
  clone.querySelectorAll<HTMLSelectElement>('select').forEach(select => select.selectedIndex = 0);
  const head = clone.querySelector<HTMLElement>('.contact-head');
  let remove = clone.querySelector<HTMLButtonElement>('.remove-contact');
  if(!remove){
    remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-contact';
    remove.textContent = 'Remove';
    head?.appendChild(remove);
  }
  remove.onclick = () => { clone.remove(); refreshContactNumbers(); };
  list.appendChild(clone);
  refreshContactNumbers();
}

const addContactBtn = document.getElementById('addContactBtn');
if (addContactBtn) addContactBtn.onclick = addContact;
refreshContactNumbers();

if (form) {
  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const fileNames = ['registrationFile','taxFile','ndaFile','poaFile'].reduce<Record<string, string>>((acc, name) => {
      const f = fd.get(name);
      if(f instanceof File && f.name) acc[name] = f.name;
      return acc;
    }, {});
    invites = read<TenantInvite[]>(KEY_INVITES, []);
    const idx = invites.findIndex(i => i.token === token);
    const payload: TenantInvite = { ...(idx >= 0 ? invites[idx] : invite) };
    for(const [key, value] of fd.entries()){
      if(value instanceof File) continue;
      payload[key] = String(value);
    }
    payload.contacts = Array.from(document.querySelectorAll<HTMLElement>('[data-contact-card]')).map(card => {
      const contact: ContactPayload = {};
      card.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-contact-field]').forEach(el => {
        const field = el.dataset.contactField;
        if (field) contact[field] = el.value;
      });
      return contact;
    }).filter(c => c.fullName || c.email || c.phone);
    payload.documents = fileNames;
    payload.status = 'Submitted';
    payload.submittedAt = new Date().toLocaleString();
    payload.token = token || payload.token || `DIRECT-${Date.now()}`;
    if(idx >= 0) invites[idx] = payload; else invites.unshift(payload);
    write(KEY_INVITES, invites);
    const formCard = document.getElementById('formCard');
    const successPanel = document.getElementById('successPanel');
    if (formCard) formCard.hidden = true;
    if (successPanel) successPanel.hidden = false;
    window.scrollTo({top:0, behavior:'smooth'});
  };
}
