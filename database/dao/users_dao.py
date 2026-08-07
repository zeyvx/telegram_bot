import aiosqlite
import sqlite3

async def add_user(user_id, phone):
    try:
        async with aiosqlite.connect('database.db') as conn:
            await conn.execute(
                "INSERT INTO users(user_id, phone) VALUES (?, ?)", (user_id, phone))
            await conn.commit()
            return True
    
    except sqlite3.IntegrityError:
        return False

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