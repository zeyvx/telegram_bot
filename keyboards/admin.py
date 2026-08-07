from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

def start_menu():
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='Новые заявки', callback_data='new_requests'), InlineKeyboardButton(text='Мои заявки', callback_data='my_works')],
        [InlineKeyboardButton(text='Все заявки', callback_data='all_requests'), InlineKeyboardButton(text='Статистика', callback_data='statistic')]
    ])

    return keyboard


def request_actions_keyboard(request_id):
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='✅ Завершить', callback_data=f'complete_request:{request_id}'),
        InlineKeyboardButton(text='💬 Ответить', callback_data=f'reply_request:{request_id}')],
        [InlineKeyboardButton(text='🔄 Вернуть в очередь', callback_data=f'return_request:{request_id}')],
        [InlineKeyboardButton(text='🔙 Назад', callback_data='my_works')]
    ])

    return keyboard

def my_works_list_keyboard(requests):
    builder = InlineKeyboardBuilder()

    for i, request in enumerate(requests):
        builder.button(text=str(i + 1), callback_data=f"open_request:{request[0]}")

    builder.adjust(3)
    return builder.as_markup()