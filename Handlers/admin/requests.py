from aiogram.types import CallbackQuery
from aiogram import Router, F
from database.dao import admins_dao
from keyboards.admin import start_menu

router = Router()

@router.callback_query(F.data.startswith("take_request:"))
async def take_request(callback: CallbackQuery):
    request_id = int(callback.data.split(':')[1])

    success = await admins_dao.take_request(request_id, callback.from_user.id)

    if not success:
        await callback.answer("Заявку уже взяли в работу", show_alert=True)
        return

    await callback.message.edit_text("Заявка взята в работу!", reply_markup=start_menu())
    await callback.answer()