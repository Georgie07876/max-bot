export type Role = 'admin' | 'superAdmin';

export interface Session {
  role: Role;
  username: string;
}

export interface MenuButton {
  id: string;
  label: string;
  type: 'callback' | 'url';
  value: string;
}

export interface MenuItem {
  text: string;
  parent: string | null;
  buttons: MenuButton[];
}

export type MenuMap = Record<string, MenuItem>;

export interface AdminRecord {
  id: string;
  username: string;
  createdAt: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE = '/admin';

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    ...options,
  });

  if (res.status === 401 || res.status === 403) {
    throw new ApiError('unauthorized', res.status);
  }

  if (!res.ok) {
    const body = await parseJson<unknown>(res).catch(() => undefined);
    throw new ApiError(res.statusText || 'request failed', res.status, body);
  }

  if (res.status === 204) return {} as T;
  return parseJson<T>(res);
}

export async function login(
  username: string,
  password: string,
): Promise<{ ok: boolean; role?: Role }> {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await parseJson<{ ok: boolean; role?: Role }>(res);
  if (!res.ok) {
    throw new ApiError('login failed', res.status, data);
  }
  return data;
}

export async function logout(): Promise<void> {
  await request('/logout', { method: 'POST' });
}

export async function getSession(): Promise<Session> {
  return request<Session>('/api/session');
}

export async function getContent(): Promise<Record<string, string>> {
  return request<Record<string, string>>('/api/content');
}

export async function updateContent(
  key: string,
  value: string,
): Promise<{ ok: boolean; key: string }> {
  return request(`/api/content/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}

export async function getMenus(): Promise<MenuMap> {
  return request<MenuMap>('/api/menus');
}

export async function createMenu(body: {
  id: string;
  text: string;
  parent: string | null;
}): Promise<{ ok: boolean }> {
  return request('/api/menus', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateMenuText(
  id: string,
  text: string,
): Promise<{ ok: boolean }> {
  return request(`/api/menus/${encodeURIComponent(id)}/text`, {
    method: 'PUT',
    body: JSON.stringify({ text }),
  });
}

export async function deleteMenu(id: string): Promise<{ ok: boolean }> {
  return request(`/api/menus/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function addButton(
  menuId: string,
  body: { label: string; type: 'callback' | 'url'; value: string },
): Promise<{ ok: boolean; button?: MenuButton }> {
  return request(`/api/menus/${encodeURIComponent(menuId)}/buttons`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateButton(
  menuId: string,
  btnId: string,
  body: { label: string; type: 'callback' | 'url'; value: string },
): Promise<{ ok: boolean }> {
  return request(
    `/api/menus/${encodeURIComponent(menuId)}/buttons/${encodeURIComponent(btnId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );
}

export async function deleteButton(
  menuId: string,
  btnId: string,
): Promise<{ ok: boolean }> {
  return request(
    `/api/menus/${encodeURIComponent(menuId)}/buttons/${encodeURIComponent(btnId)}`,
    { method: 'DELETE' },
  );
}

export async function moveButton(
  menuId: string,
  btnId: string,
  direction: 'up' | 'down',
): Promise<{ ok: boolean }> {
  return request(
    `/api/menus/${encodeURIComponent(menuId)}/buttons/${encodeURIComponent(btnId)}/move`,
    {
      method: 'POST',
      body: JSON.stringify({ direction }),
    },
  );
}

export async function getAdmins(): Promise<AdminRecord[]> {
  return request<AdminRecord[]>('/api/admins');
}

export async function createAdmin(body: {
  username: string;
  password: string;
}): Promise<{ ok: boolean; user?: AdminRecord }> {
  return request('/api/admins', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function changePassword(
  id: string,
  password: string,
): Promise<{ ok: boolean }> {
  return request(`/api/admins/${encodeURIComponent(id)}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
}

export async function deleteAdmin(id: string): Promise<{ ok: boolean }> {
  return request(`/api/admins/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function getActiveUsers(): Promise<{ count: number }> {
  return request<{ count: number }>('/api/stats/active-users');
}
