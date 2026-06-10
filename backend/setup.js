require('dotenv').config();
const pool = require('./db');

const users = [
  { id: 'admin-1', name: 'Kuri Admin', email: 'admin@kuriapp.com', password: 'admin123', role: 'admin', status: 'active', uniqueCode: '#MASTER01', avatar: 'https://ui-avatars.com/api/?name=Kuri+Admin&background=4f46e5&color=fff' },
  { id: 'u_1771416044062', name: 'Arshad', email: 'arshad@dummy.local', password: '123456', role: 'member', status: 'active', uniqueCode: '#0LJLM1', avatar: 'https://ui-avatars.com/api/?name=Arshad&background=random&color=fff' },
  { id: 'u_1771415516118', name: 'anzil', email: 'anzil@dummy.local', password: '123456', role: 'member', status: 'active', uniqueCode: '#DVCC4A', avatar: 'https://ui-avatars.com/api/?name=anzil&background=random&color=fff' },
  { id: 'u_1767405009433', name: 'Sajad', email: 'sajad@dummy.local', password: '787vp', role: 'member', status: 'active', uniqueCode: '#Y1N72T', avatar: 'https://ui-avatars.com/api/?name=Sajad&background=random&color=fff' },
  { id: 'u_1763883126899', name: 'Sayed Muhammed Aamir', email: 'pmaamirit@gmail.com', password: '12345678', role: 'member', status: 'active', uniqueCode: '#JV2F6W', avatar: 'https://ui-avatars.com/api/?name=Aamir&background=random&color=fff' },
  { id: 'u_1763883654797', name: 'Shamnad', email: 'shamnad@gmail.com', password: '123456', role: 'member', status: 'active', uniqueCode: '#1NWM1H', avatar: 'https://ui-avatars.com/api/?name=Shamnad&background=random&color=fff' },
  { id: 'u_1764443619258', name: 'Arshal', email: 'arshal@gmail.com', password: '123456', role: 'member', status: 'active', uniqueCode: '#HZ1DPZ', avatar: 'https://ui-avatars.com/api/?name=Arshal&background=random&color=fff' },
  { id: 'u_1773103418347', name: 'Arshad', email: 'arshad@gmail.com', password: '1234567', role: 'member', status: 'active', uniqueCode: '#5P7XJ7', avatar: 'https://ui-avatars.com/api/?name=Arshad&background=random&color=fff' },
];

const kuris = [
  {
    id: 'k_1771411726815', name: 'Test', monthlyAmount: 5000, description: 'test',
    duration: '10 Months', startDate: '2026-02-18', kuriTakenDate: '',
    adminId: 'u_1763883126899', memberIds: ['u_1763883126899','u_1771415516118','u_1771416044062','u_1763883654797'],
    status: 'rejected', type: 'new', createdBy: 'u_1763883126899',
    winners: [{ month: 1, memberId: 'u_1763883654797' }],
    nominations: [{ month: 1, originalWinnerId: 'u_1763883654797', nominatedMemberId: 'u_1763883126899', status: 'pending', nominatedAt: '2026-02-19T15:05:34.551Z' }],
    payments: []
  },
  {
    id: 'k_1767402554106', name: 'ICHRL NEW', monthlyAmount: 5000, description: 'new 2026',
    duration: '8', startDate: '2025-12-22', kuriTakenDate: '2026-01-10',
    adminId: 'u_1763883126899', memberIds: ['u_1763883126899','u_1763883654797','u_1764443619258','u_1767405009433','u_1771416044062','u_1771415516118'],
    status: 'active', type: 'new', createdBy: 'u_1763883126899',
    winners: [{ month: 2, memberId: 'u_1764443619258' }, { month: 1, memberId: 'u_1763883654797' }],
    nominations: [],
    payments: [
      { memberId: 'u_1767405009433', month: 1, status: 'paid', paidDate: '2026-01-03' },
      { memberId: 'u_1764443619258', month: 1, status: 'paid', paidDate: '2026-01-03' },
      { memberId: 'u_1763883654797', month: 1, status: 'paid', paidDate: '2026-01-03' },
      { memberId: 'u_1763883126899', month: 1, status: 'paid', paidDate: '2026-01-03' },
      { memberId: 'u_1763883126899', month: 2, status: 'paid', paidDate: '2026-02-14' },
      { memberId: 'u_1763883654797', month: 2, status: 'paid', paidDate: '2026-02-14' },
      { memberId: 'u_1764443619258', month: 2, status: 'paid', paidDate: '2026-02-14' },
      { memberId: 'u_1767405009433', month: 2, status: 'paid', paidDate: '2026-02-14' },
    ]
  }
];

async function setup() {
  const client = await pool.connect();
  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        role TEXT DEFAULT 'member',
        status TEXT DEFAULT 'active',
        unique_code TEXT,
        avatar TEXT,
        is_dummy BOOLEAN DEFAULT false,
        last_login TEXT,
        deactivated_at TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS kuris (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        monthly_amount NUMERIC NOT NULL,
        description TEXT,
        duration TEXT,
        start_date TEXT,
        kuri_taken_date TEXT,
        admin_id TEXT,
        member_ids JSONB DEFAULT '[]',
        status TEXT DEFAULT 'pending',
        type TEXT DEFAULT 'new',
        created_by TEXT,
        winners JSONB DEFAULT '[]',
        payments JSONB DEFAULT '[]',
        nominations JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Tables created');

    // Seed users
    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, name, email, password, role, status, unique_code, avatar)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
        [u.id, u.name, u.email, u.password, u.role, u.status, u.uniqueCode, u.avatar]
      );
    }
    console.log('Users seeded');

    // Seed kuris
    for (const k of kuris) {
      await client.query(
        `INSERT INTO kuris (id, name, monthly_amount, description, duration, start_date, kuri_taken_date, admin_id, member_ids, status, type, created_by, winners, payments, nominations)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (id) DO NOTHING`,
        [k.id, k.name, k.monthlyAmount, k.description, k.duration, k.startDate, k.kuriTakenDate,
         k.adminId, JSON.stringify(k.memberIds), k.status, k.type, k.createdBy,
         JSON.stringify(k.winners), JSON.stringify(k.payments), JSON.stringify(k.nominations)]
      );
    }
    console.log('Kuris seeded');
    console.log('Setup complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

setup().catch(err => { console.error(err); process.exit(1); });
