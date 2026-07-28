from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, KeyboardButton

def main_keyboard():
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='Отправить заявку', callback_data='send_request'), InlineKeyboardButton(text='Мои заявки', callback_data='my_requests')],
        [InlineKeyboardButton(text='FAQ', callback_data='faq'), InlineKeyboardButton(text='Связаться с оператором', callback_data='call_operator')]
    ])

    return keyboard

def problems_keyboard():
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='Техническая', callback_data='problem_tech'), InlineKeyboardButton(text='Оплата', callback_data='problem_payment')],
        [InlineKeyboardButton(text='Доставка', callback_data='problem_delivery'), InlineKeyboardButton(text='Заказ', callback_data='problem_order')],
        [InlineKeyboardButton(text='Другое', callback_data='problem_another')]
    ])

    return keyboard

def skip():
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text='Пропустить', callback_data='skip')]
    ])

    return keyboard

def send_contact():
    keyboard = ReplyKeyboardMarkup(keyboard=[
        [KeyboardButton(text='Отправить контакт', request_contact=True)]
    ], resize_keyboard=True, one_time_keyboard=True)

    return keyboard