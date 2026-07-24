from os import getenv
from dotenv import load_dotenv
load_dotenv()
from aiogram import Bot, Dispatcher
import asyncio
from Handlers.routers import router
from Handlers.database import init_db

load_dotenv()
BOT_TOKEN = getenv("BOT_TOKEN")

dp = Dispatcher()
dp.include_router(router)

async def main():
    bot = Bot(token=BOT_TOKEN)
    await init_db()
    print("Бот запустился...")
    await dp.start_polling(bot)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Бот отключён")