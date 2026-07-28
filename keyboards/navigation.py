from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def get_navigation(current, total, prefix, request_id = None):
    buttons = []

    if current > 0:
        buttons.append(InlineKeyboardButton(
            text='⬅️ Пред.',
            callback_data=f'{prefix}_page:{current - 1}'
        ))

    if current < total - 1:
        buttons.append(InlineKeyboardButton(
            text='След. ➡️',
            callback_data=f'{prefix}_page:{current + 1}'
        ))

    keyboard = [buttons]

    if request_id is not None:
        keyboard.append([InlineKeyboardButton(
            text='Взять в работу',
            callback_data=f'take_request:{request_id}'
        )])

    return InlineKeyboardMarkup(inline_keyboard=keyboard)