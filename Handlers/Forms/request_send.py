from aiogram.fsm.state import State, StatesGroup

class SendRequest(StatesGroup):
    category = State()
    request = State()
    file = State()