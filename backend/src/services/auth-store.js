const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', '..', 'data', 'auth-users.json');
const SECRET = process.env.AUTH_SECRET || 'mnm-bandat-dev-secret';

function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const seed = {
      nextId: 4,
      users: [
        {
          id: 1,
          username: 'admin',
          password: hashPassword('admin123'),
          email: 'admin@mnm.local',
          full_name: 'System Admin',
          role: 'admin',
          linked_agent_id: null,
        },
        {
          id: 2,
          username: 'agent',
          password: hashPassword('agent123'),
          email: 'agent@mnm.local',
          full_name: 'Demo Agent',
          role: 'agent',
          linked_agent_id: null,
        },
        {
          id: 3,
          username: 'user',
          password: hashPassword('user123'),
          email: 'user@mnm.local',
          full_name: 'Demo User',
          role: 'user',
          linked_agent_id: null,
        },
      ],
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(seed, null, 2), 'utf8');
  }
  const raw = fs.readFileSync(STORE_PATH, 'utf8');
  return JSON.parse(raw);
}

function saveStore(store) {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

function normalizeRole(role) {
  return ['admin', 'agent', 'user'].includes(role) ? role : 'user';
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password), salt, 120000, 32, 'sha256').toString('base64');
  return `pbkdf2$${salt}$${hash}`;
}

function verifyPassword(stored, password) {
  if (!stored) return false;
  if (stored.startsWith('pbkdf2$')) {
    const [, salt, hash] = stored.split('$');
    const candidate = crypto.pbkdf2Sync(String(password), salt, 120000, 32, 'sha256').toString('base64');
    return crypto.timingSafeEqual(Buffer.from(hash, 'base64'), Buffer.from(candidate, 'base64'));
  }
  return String(stored) === String(password);
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    linked_agent_id: user.linked_agent_id ?? null,
  };
}

function signToken(user) {
  const payload = JSON.stringify({ id: user.id, username: user.username, role: user.role });
  const body = Buffer.from(payload).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  if (expected !== sig) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const store = ensureStore();
    const user = store.users.find((item) => item.id === payload.id);
    return publicUser(user || null);
  } catch {
    return null;
  }
}

function findByUsername(username) {
  const store = ensureStore();
  return store.users.find((user) => user.username.toLowerCase() === String(username || '').toLowerCase()) || null;
}

function findById(id) {
  const store = ensureStore();
  return store.users.find((user) => user.id === Number(id)) || null;
}

function authenticate(username, password) {
  const user = findByUsername(username);
  if (!user) return null;
  if (!verifyPassword(user.password, password)) return null;
  return { user: publicUser(user), token: signToken(user) };
}

function createUser(payload) {
  const store = ensureStore();
  const username = String(payload.username || '').trim();
  if (!username) throw new Error('username is required');
  if (!payload.password) throw new Error('password is required');
  if (findByUsername(username)) throw new Error('username already exists');

  const user = {
    id: store.nextId++,
    username,
    password: hashPassword(payload.password),
    email: String(payload.email || '').trim(),
    full_name: String(payload.full_name || '').trim(),
    role: normalizeRole(payload.role),
    linked_agent_id: payload.linked_agent_id ? Number(payload.linked_agent_id) : null,
  };
  store.users.push(user);
  saveStore(store);
  return { user: publicUser(user), token: signToken(user) };
}

function updateUser(id, patch) {
  const store = ensureStore();
  const user = store.users.find((item) => item.id === Number(id));
  if (!user) return null;
  if (patch.username) {
    const next = String(patch.username).trim();
    const conflict = store.users.find((item) => item.id !== user.id && item.username.toLowerCase() === next.toLowerCase());
    if (conflict) throw new Error('username already exists');
    user.username = next;
  }
  if (patch.email !== undefined) user.email = String(patch.email || '').trim();
  if (patch.full_name !== undefined) user.full_name = String(patch.full_name || '').trim();
  if (patch.role !== undefined) user.role = normalizeRole(patch.role);
  if (patch.linked_agent_id !== undefined) user.linked_agent_id = patch.linked_agent_id ? Number(patch.linked_agent_id) : null;
  if (patch.password) user.password = hashPassword(patch.password);
  saveStore(store);
  return publicUser(user);
}

module.exports = {
  authenticate,
  createUser,
  findById,
  findByUsername,
  hashPassword,
  publicUser,
  signToken,
  updateUser,
  verifyPassword,
  verifyToken,
};
