import aiosqlite

async def init_db():
    async with aiosqlite.connect('database.db') as conn:
        await conn.execute("PRAGMA foreign_keys = ON")
        await conn.execute("""
    CREATE TABLE IF NOT EXISTS users(
                           user_id INTEGER PRIMARY KEY,
                           phone TEXT UNIQUE
                           )
                           """)
        
        await conn.execute("""
    CREATE TABLE IF NOT EXISTS requests(
                           id INTEGER PRIMARY KEY AUTOINCREMENT,
                           user_id INTEGER NOT NULL,
                           category TEXT NOT NULL,
                           request TEXT NOT NULL,
                           file_id TEXT,
                           status TEXT DEFAULT 'Новая',
                           FOREIGN KEY(user_id) REFERENCES users(user_id)
                           )
""")
        await conn.commit()

async def add_user(user_id, phone):
    async with aiosqlite.connect("database.db") as conn:
        await conn.execute(
            "INSERT INTO users(user_id, phone) VALUES (?, ?)", (user_id, phone))
        await conn.commit()

async def get_user(user_id):
    async with aiosqlite.connect('database.db') as conn:
        cursor = await conn.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))

        if await cursor.fetchone():
            return True
        return False

async def add_request(user_id, category, request, file_id):
    async with aiosqlite.connect('database.db') as conn:
        await conn.execute("INSERT INTO requests (user_id, category, request, file_id) VALUES (?,?,?,?)", (user_id, category, request, file_id))
        await conn.commit()

async def get_my_requests(user_id):
    async with aiosqlite.connect('database.db') as conn:
        cursor = await conn.execute("SELECT * FROM requests WHERE user_id = ?", (user_id,))

        return await cursor.fetchall()