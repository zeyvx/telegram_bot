from aiogram import Router, F
from aiogram.types import Message, ReplyKeyboardRemove, CallbackQuery
from aiogram.filters import CommandStart
import keyboards.user
from database.dao import users_dao
from config import OPERATOR_PHONE

router = Router()

@router.message(CommandStart())
async def start(message: Message):
    user = await users_dao.get_user(message.from_user.id)

    if user:
        await message.answer(
        "Добро пожаловать в главное меню!\n\n"
        "Выберите нужное действие:" ,reply_markup=keyboards.user.main_keyboard())

    else:
        await message.answer(
    "Здравствуйте! 👋\n\n"
    "Добро пожаловать в службу поддержки.\n"
    "Для начала работы отправьте свой контакт, нажав кнопку ниже.", reply_markup=keyboards.user.send_contact())

@router.message(F.contact)
async def save_user(message: Message):
    if message.contact.user_id != message.from_user.id:
        await message.answer("Пожалуйста отправьте свой номер")
        return
    
    phone = message.contact.phone_number

    success = await users_dao.add_user(message.from_user.id, phone)

    if not success:
        await message.answer(
            "⚠️ Этот номер телефона уже зарегистрирован в системе.\n"
            "Если это ошибка — свяжитесь с оператором."
        )
        return
    
    await message.answer(
    "✅ Вы успешно зарегистрированы!\n\n"
    "Для начала работы перезапустите бота, отправив команду /start.", reply_markup=ReplyKeyboardRemove())

@router.callback_query(F.data == 'faq')
async def faq(callback: CallbackQuery):
    await callback.message.answer("FAQ")
    await callback.answer()

@router.callback_query(F.data == 'call_operator')
async def operator(callback: CallbackQuery):
    await callback.message.answer(f"Номер оператора: {OPERATOR_PHONE}")
    await callback.answer()