const $ = (selector) => document.querySelector(selector);
const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
const SECTIONS = ['home', 'data', 'maps', 'games', 'lab', 'photography', 'about'];
const EXAMPLES = ['home', 'data', 'maps', 'games', 'lab'];
const CATEGORIES = ['lab', 'data', 'maps', 'games'];
const STATUSES = ['idea', 'prototype', 'published', 'archived'];
const LABELS = { home: 'Home', data: 'Data', maps: 'Maps', games: 'Games', lab: 'Lab', photography: 'Photography', about: 'About' };
let user = null;
let token = null;
let revision = null;
let config = null;
let sources = [];
let tab = 'home';
let dirty = false;
function message(text, error = false) {
  $('#message').textContent = text;
  $('#message').classList.toggle('error', error);
}
const access = (role) => user?.root || user?.permissions.includes(role);
async function api(path, method = 'GET', value) {
  const response = await fetch(`/mladmin/api/${path}`, {
    method,
    headers: method === 'GET' ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': token ?? '' },
    body: value === undefined ? undefined : JSON.stringify(value),
    credentials: 'same-origin', cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw Error(data.error ?? 'Request failed.');
  return data;
}
function button(text, callback, disabled = false) {
  const node = element('button', text);
  node.type = 'button'; node.disabled = disabled;
  node.addEventListener('click', callback);
  return node;
}
function select(options, chosen, callback) {
  const node = element('select');
  for (const item of options) {
    const option = element('option', LABELS[item] ?? item);
    option.value = item; option.selected = item === chosen; node.append(option);
  }
  node.addEventListener('change', () => callback(node.value));
  return node;
}
function editable() { dirty = true; $('#save').textContent = 'Save local changes *'; }
function projectInfo(source) { return { ...source, ...(config.projects[source.slug] ?? {}) }; }
function controls(list, index, callback) {
  const actions = element('div', undefined, 'order-actions');
  actions.append(button('↑', () => callback(index, -1), index === 0), button('↓', () => callback(index, 1), index === list.length - 1));
  actions.querySelector('button').setAttribute('aria-label', 'Move up');
  actions.querySelectorAll('button')[1].setAttribute('aria-label', 'Move down');
  return actions;
}
function reorder(list, index, delta) { [list[index], list[index + delta]] = [list[index + delta], list[index]]; editable(); }
function renderHome() {
  const host = $('#section-order'); host.replaceChildren();
  config.sectionOrder.forEach((id, index) => {
    const row = element('div', undefined, 'order-row'); row.append(element('strong', LABELS[id]));
    row.append(controls(config.sectionOrder, index, (i, d) => { reorder(config.sectionOrder, i, d); renderHome(); })); host.append(row);
  });
  const examplesHost = $('#examples'); examplesHost.replaceChildren();
  for (const section of EXAMPLES) {
    const area = element('section', undefined, 'examples-section'); area.append(element('h4', `${LABELS[section]} examples`));
    const list = element('div', undefined, 'examples-list');
    const ids = config.examples[section];
    ids.forEach((slug, index) => {
      const row = element('div', undefined, 'order-row');
      row.append(element('strong', sources.find((source) => source.slug === slug)?.title ?? slug));
      row.append(controls(ids, index, (i, d) => { reorder(ids, i, d); renderHome(); }));
      row.append(button('Remove', () => { ids.splice(index, 1); editable(); renderHome(); })); list.append(row);
    });
    area.append(list);
    const available = sources.filter((source) => {
      const info = projectInfo(source);
      return info.visible !== false && !ids.includes(source.slug) && (section === 'home' || info.category === section);
    }).sort((a, b) => a.title.localeCompare(b.title));
    const picker = element('div', undefined, 'example-picker');
    const selectNode = select(available.map((item) => item.slug), available[0]?.slug, () => {});
    [...selectNode.options].forEach((option) => { option.textContent = sources.find((source) => source.slug === option.value)?.title ?? option.value; });
    selectNode.setAttribute('aria-label', `Add ${LABELS[section]} example`);
    picker.append(selectNode, button('Add example', () => {
      if (selectNode.value) { ids.push(selectNode.value); editable(); renderHome(); }
    }, available.length === 0));
    area.append(picker); examplesHost.append(area);
  }
}
function fieldLabel(name, node) {
  const label = element('label', name); label.append(node); return label;
}
function renderProjects() {
  const host = $('#project-list'); host.replaceChildren();
  const ordered = sources.map(projectInfo).sort((a, b) => a.sortOrder - b.sortOrder || a.slug.localeCompare(b.slug));
  ordered.forEach((project, index) => {
    const row = element('div', undefined, 'project-row');
    const heading = element('div'); heading.append(element('strong', project.title), element('small', project.slug)); row.append(heading);
    const patch = (field, value) => {
      config.projects[project.slug] ??= {};
      config.projects[project.slug][field] = value;
      editable();
      if (field === 'category' || field === 'visible') renderHome();
    };
    row.append(fieldLabel('Section', select(CATEGORIES, project.category, (value) => patch('category', value))));
    row.append(fieldLabel('Maturity', select(STATUSES, project.status, (value) => patch('status', value))));
    row.append(fieldLabel('Card label', select(['default', 'updated'], project.badge ?? 'default', (value) => patch('badge', value))));
    const visibility = element('input'); visibility.type = 'checkbox'; visibility.checked = project.visible !== false;
    visibility.addEventListener('change', () => patch('visible', visibility.checked));
    row.append(fieldLabel('Show publicly', visibility));
    const actions = controls(ordered, index, (i, delta) => {
      [ordered[i], ordered[i + delta]] = [ordered[i + delta], ordered[i]];
      ordered.forEach((item, position) => { config.projects[item.slug] ??= {}; config.projects[item.slug].sortOrder = position * 10; });
      editable(); renderProjects();
    });
    row.append(actions); host.append(row);
  });
}
function showCredentials(data) {
  const host = $('#credentials'); host.hidden = false;
  host.textContent = `Account: ${data.username}\nTemporary password (copy now): ${data.temporaryPassword}\nThis password will not be shown again.`;
}
async function renderUsers() {
  const host = $('#users'); host.replaceChildren();
  const data = await api('users');
  for (const account of data.users) {
    const row = element('div', undefined, 'user-row'); row.append(element('strong', `${account.username}${account.root ? ' · Main admin' : ''}`));
    if (account.root) { row.append(element('span', 'Full access')); host.append(row); continue; }
    const permissions = element('div', undefined, 'permissions');
    for (const perm of ['home', 'projects', 'games']) {
      const checkbox = element('input'); checkbox.type = 'checkbox'; checkbox.checked = account.permissions.includes(perm);
      checkbox.value = perm;
      permissions.append(fieldLabel(LABELS[perm], checkbox));
    }
    row.append(permissions);
    row.append(button('Update access', async () => {
      const selected = [...permissions.querySelectorAll('input:checked')].map((input) => input.value);
      try { await api(`users/${account.username}`, 'PATCH', { permissions: selected }); message(`Updated access for ${account.username}.`); }
      catch (error) { message(error.message, true); }
    }));
    row.append(button('Reset password', async () => {
      if (!confirm(`Reset ${account.username}'s password?`)) return;
      try { showCredentials(await api(`users/${account.username}/reset`, 'POST')); message('Password reset. Existing sessions revoked.'); }
      catch (error) { message(error.message, true); }
    }));
    row.append(button('Delete', async () => {
      if (!confirm(`Permanently delete ${account.username}?`)) return;
      try { await api(`users/${account.username}`, 'DELETE'); $('#credentials').hidden = true; await renderUsers(); message('Account deleted.'); }
      catch (error) { message(error.message, true); }
    })); host.append(row);
  }
}
function selectTab(next) {
  tab = next;
  for (const buttonNode of document.querySelectorAll('[data-tab]')) buttonNode.setAttribute('aria-current', buttonNode.dataset.tab === next ? 'page' : 'false');
  for (const section of document.querySelectorAll('.tab-panel')) section.hidden = section.id !== `tab-${next}`;
  if (next === 'accounts' && user.root) renderUsers().catch((error) => message(error.message, true));
}
async function loadWorkspace() {
  $('#login-panel').hidden = true; $('#workspace').hidden = false; $('#logout').hidden = false;
  $('#account-label').textContent = `Signed in as ${user.username}${user.root ? ' · Main admin' : ''}`;
  for (const buttonNode of document.querySelectorAll('[data-tab]')) {
    const role = buttonNode.dataset.tab === 'accounts' ? 'root' : buttonNode.dataset.tab;
    buttonNode.hidden = role === 'root' ? !user.root : !access(role);
  }
  const canEditSite = access('home') || access('projects');
  $('#save').hidden = !canEditSite;
  if (canEditSite) {
    const data = await api('site');
    revision = data.revision; config = data.config; sources = data.sources;
    if (access('home')) renderHome();
    if (access('projects')) renderProjects();
  }
  selectTab(access('home') ? 'home' : access('projects') ? 'projects' : access('games') ? 'games' : 'accounts');
}
$('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const response = await api('login', 'POST', { username: form.get('username'), password: form.get('password') });
    user = response.user; token = response.csrf;
    event.currentTarget.reset(); message('Signed in.'); await loadWorkspace();
  } catch (error) { message(error.message, true); }
});
$('#logout').addEventListener('click', async () => {
  try { await api('logout', 'POST'); location.reload(); } catch (error) { message(error.message, true); }
});
$('#save').addEventListener('click', async () => {
  try {
    const response = await api('site', 'POST', { revision, config });
    revision = response.revision; config = response.config; dirty = false;
    $('#save').textContent = 'Save local changes';
    if (access('home')) renderHome(); if (access('projects')) renderProjects();
    message('Saved locally. Refresh the Astro preview to review. Commit and publish separately.');
  } catch (error) { message(error.message, true); }
});
for (const node of document.querySelectorAll('[data-tab]')) node.addEventListener('click', () => selectTab(node.dataset.tab));
window.addEventListener('beforeunload', (event) => {
  if (dirty) { event.preventDefault(); event.returnValue = ''; }
});
$('#create-user').addEventListener('submit', async (event) => {
  event.preventDefault(); const form = new FormData(event.currentTarget);
  try {
    const response = await api('users', 'POST', { username: form.get('username'), permissions: form.getAll('permissions') });
    showCredentials(response); event.currentTarget.reset(); await renderUsers(); message('Account created.');
  } catch (error) { message(error.message, true); }
});
api('session').then(async (session) => {
  if (session.user) { user = session.user; token = session.csrf; await loadWorkspace(); }
}).catch((error) => message(error.message, true));
