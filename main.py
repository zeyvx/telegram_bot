from aiogram import Bot, Dispatcher
import asyncio
from database.database import init_db
import aiosqlite
from config import BOT_TOKEN
from handlers.user.start import router as start_router
from handlers.user.requests import router as requests_router

dp = Dispatcher()
dp.include_router(start_router)
dp.include_router(requests_router)

async def main():
    async with aiosqlite.connect("database.db") as db:
        await init_db(db)

    bot = Bot(token=BOT_TOKEN)

    print("Бот запустился...")

    await dp.start_polling(bot)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот отключён")