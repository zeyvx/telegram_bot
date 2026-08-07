from aiogram.types import CallbackQuery
from aiogram import Router, F
import database.dao.admins_dao as admins_dao
from keyboards import navigation, admin
from services import requests_service

router = Router()


@router.callback_query(F.data == 'new_requests')
async def new_requests(callback: CallbackQuery):
    requests = await admins_dao.get_new_requests()
    if not requests:
        await callback.message.edit_text("Пока нет новый заявок", reply_markup=admin.start_menu())
        await callback.answer()
        return

    current = 0
    
    request = requests[current]

    await callback.message.edit_text(
        text=requests_service.format_text(request),
        reply_markup=navigation.get_navigation(
            current=current,
            total=len(requests),
            prefix='new_requests',
            request_id=request[0]
        )
    )   

    await callback.answer()

@router.callback_query(F.data.startswith("new_requests_page:"))
async def new_request_page(callback: CallbackQuery):

    page = int(
        callback.data.split(":")[1]
    )

    requests = await admins_dao.get_new_requests()

    if not requests:
        await callback.answer(
            "Нет новых заявок"
        )
        return

    if page < 0 or page >= len(requests):
        await callback.answer(
            "Заявка не найдена"
        )
        return

    request = requests[page]

    await callback.message.edit_text(
        text=requests_service.format_text(request),
        reply_markup=navigation.get_navigation(
            current=page,
            total=len(requests),
            prefix='new_requests',
            request_id=request[0]
        )
    )

    await callback.answer()


@router.callback_query(F.data == 'my_works')
async def my_works(callback: CallbackQuery):
    my_requests = await admins_dao.get_my_admin_requests(callback.from_user.id)

    if not my_requests:
        await callback.message.edit_text("У вас пока нет новых заявок", reply_markup=admin.start_menu())
        await callback.answer()
        return

    page_requests = my_requests[:5]

    text = "\n".join(
        requests_service.format_short(request, i + 1)
        for i, request in enumerate(page_requests)
    )

    await callback.message.edit_text(
        text=text,
        reply_markup=admin.my_works_list_keyboard(page_requests)
    )

    await callback.answer()

@router.callback_query(F.data.startswith('my_works_page:'))
async def my_works_page(callback: CallbackQuery):
    page = int(callback.data.split(':')[1])

    my_requests = await admins_dao.get_my_admin_requests(callback.from_user.id)

    if not my_requests:
        await callback.answer("У вас нет заявок")
        return

    if page < 0 or page >= len(my_requests):
        await callback.answer("Заявка не найдена")
        return

    request = my_requests[page]
    
    await callback.message.edit_text(
        text=requests_service.format_text(request),
        reply_markup=navigation.get_navigation(
            current=page,
            total=len(my_requests),
            prefix='my_works'
        )
    )

    await callback.answer()

@router.callback_query(F.data == 'all_requests')
async def all_requests(callback: CallbackQuery):
    requests = await admins_dao.get_all_requests()

    if not requests:
        await callback.message.edit_text("Нет никаких заявок", reply_markup=admin.start_menu())
        await callback.answer()
        return

    current = 0

    request = requests[current]

    await callback.message.edit_text(text=requests_service.format_text(request),
                                     reply_markup=navigation.get_navigation(current=current,
                                                                            total=len(requests),
                                                                            prefix='all_requests',))
    await callback.answer()

@router.callback_query(F.data.startswith("all_requests_page:"))
async def all_request_page(callback: CallbackQuery):

    page = int(
        callback.data.split(":")[1]
    )

    requests = await admins_dao.get_all_requests()

    if not requests:
        await callback.answer(
            "Нет никаких заявок"
        )
        return

    if page < 0 or page >= len(requests):
        await callback.answer(
            "Заявка не найдена"
        )
        return

    request = requests[page]

    await callback.message.edit_text(
        text=requests_service.format_text(request),
        reply_markup=navigation.get_navigation(
            current=page,
            total=len(requests),
            prefix='all_requests'
        )
    )

    await callback.answer()
