from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from states.request_send import SendRequest
import keyboards.user as kb
from database.dao import users_dao

router = Router()

@router.callback_query(F.data == 'send_request')
async def send_request(callback: CallbackQuery, state: FSMContext):
    await state.set_state(SendRequest.category)
    await callback.message.edit_text("Пожалуйста выберите категорию", reply_markup=kb.problems_keyboard())
    await callback.answer()

@router.callback_query(SendRequest.category, F.data.startswith("problem_"))
async def choose_category(callback: CallbackQuery, state: FSMContext):
    category = callback.data.replace('problem_', "")

    await state.update_data(category=category)
    await state.set_state(SendRequest.request)

    bot_message = await callback.message.edit_text("Пожалуйста опишите вашу проблему")

    await state.update_data(request_message_id=bot_message.message_id)

    await callback.answer()

@router.message(SendRequest.request, F.text)
async def get_request(message: Message, state: FSMContext):
    await state.update_data(request=message.text)

    data = await state.get_data()

    await message.bot.delete_message(
        chat_id=message.chat.id,
        message_id=data['request_message_id']
    )

    await state.set_state(SendRequest.file)

    bot_message = await message.answer(
        "Прикрепите файл или нажмите 'Пропустить'",
        reply_markup=kb.skip()
    )

    await state.update_data(file_message_id=bot_message.message_id)

@router.message(SendRequest.request)
async def invalid_request(message:Message, state: FSMContext):
    await message.answer("Пожалуйста, опишите проблему текстом")
    

@router.message(SendRequest.file, F.document)
async def get_file(message: Message, state: FSMContext):
    await state.update_data(file=message.document.file_id)
    await _save_request(message, state)


@router.message(SendRequest.file, F.photo)
async def get_photo(message: Message, state: FSMContext):
    await state.update_data(file=message.photo[-1].file_id)
    await _save_request(message, state)


async def _save_request(message: Message, state: FSMContext):
    data = await state.get_data()

    await message.bot.delete_message(
        chat_id=message.chat.id,
        message_id=data['file_message_id']
    )

    await users_dao.add_request(
        message.from_user.id,
        category=data['category'],
        request=data['request'],
        file_id=data['file']
    )

    await state.clear()

    await message.answer(
        "✅ Заявка успешно отправлена!",
        reply_markup=kb.main_keyboard()
    )


@router.callback_query(SendRequest.file, F.data == "skip")
async def skip_file(callback: CallbackQuery, state: FSMContext):
    data = await state.get_data()

    await users_dao.add_request(
        user_id=callback.from_user.id,
        category=data["category"],
        request=data["request"],
        file_id=None
    )

    await state.clear()

    await callback.message.edit_text(
        "✅ Заявка успешно отправлена!",
        reply_markup=kb.main_keyboard()
    )

    await callback.answer()


@router.message(SendRequest.file)
async def get_file_invalid(message: Message, state: FSMContext):
    await message.answer(
        "Пожалуйста, прикрепите файл или фото, либо нажмите 'Пропустить' ⬆️"
    )

#Посмотреть свои заявки

def format_text(request):

    categories = {
        "tech": "Техническая",
        "payment": "Оплата",
        "delivery": "Доставка",
        "order": "Заказ",
        "another": "Другое"
    }

    category = categories.get(
        request[2],
        request[2]
    )

    return (
        f"📋 Заявка №{request[0]}\n\n"
        f"📂 Категория: {category}\n"
        f"📝 Описание:\n{request[3]}\n\n"
        f"📌 Статус: {request[5]}"
    )

@router.callback_query(F.data == 'my_requests')
async def my_requests(callback: CallbackQuery):

    user_id = callback.from_user.id

    requests = await users_dao.get_my_requests(user_id)

    if not requests:
        await callback.message.edit_text(
            "У вас пока нет заявок",
            reply_markup=kb.main_keyboard()
        )

        await callback.answer()
        return

    current = 0

    request = requests[current]

    await callback.message.edit_text(
        text=format_text(request),
        reply_markup=kb.get_navigation(
            current=current,
            total=len(requests)
        )
    )

    await callback.answer()


@router.callback_query(F.data.startswith("request_page:"))
async def request_page(callback: CallbackQuery):

    page = int(
        int(callback.data.split(":")[1])
    )

    user_id = callback.from_user.id

    requests = await users_dao.get_my_requests(user_id)

    if not requests:
        await callback.answer(
            "У вас нет заявок"
        )
        return

    if page < 0 or page >= len(requests):
        await callback.answer(
            "Заявка не найдена"
        )
        return

    request = requests[page]

    await callback.message.edit_text(
        text=format_text(request),
        reply_markup=kb.get_navigation(
            current=page,
            total=len(requests)
        )
    )

    await callback.answer()