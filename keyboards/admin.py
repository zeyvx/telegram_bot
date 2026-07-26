from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

def start_menu():
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='Новые заявки', callback_data='new_requests'), InlineKeyboardButton(text='Мои заявки', callback_data='my_works')],
        [InlineKeyboardButton(text='Все заявки', callback_data='all_requests'), InlineKeyboardButton(text='Статистика', callback_data='statistic')]
    ])

    return keyboard


