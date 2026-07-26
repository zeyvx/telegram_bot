import aiosqlite

async def get_all_users():
    async with aiosqlite.connect('database.db') as conn:
        cursor = await conn.execute("SELECT * FROM users")
        return await cursor.fetchall()

async def get_all_requests():
    async with aiosqlite.connect('database.db') as conn:
        cursor = await conn.execute("SELECT * FROM requests")
        return await cursor.fetchall()

async def get_new_requests():
    async with aiosqlite.connect('database.db') as conn:
        cursor = await conn.execute("SELECT * FROM requests WHERE status = 'Новая'")
        return await cursor.fetchall()

async def get_my_admin_requests(admin_id):
    async with aiosqlite.connect('database.db') as conn:
        cursor = await conn.execute("SELECT * FROM requests WHERE admin_id = ? AND status = 'В работе' ORDER BY id DESC", (admin_id,))
        return await cursor.fetchall()

async def take_request(request_id, admin_id):
    async with aiosqlite.connect('database.db') as conn:
        cursor = await conn.execute("UPDATE requests SET admin_id = ?, status = 'В работе' WHERE id = ? AND status = 'Новая'", (admin_id, request_id))
        await conn.commit()
        return cursor.rowcount > 0