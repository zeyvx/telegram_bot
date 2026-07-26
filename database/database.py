import aiosqlite

async def init_db(conn):
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
                        admin_id INTEGER NULL,
                        FOREIGN KEY(user_id) REFERENCES users(user_id)
                        )
""")
    await conn.commit()