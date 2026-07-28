from aiogram.fsm.state import State, StatesGroup

class Registration(StatesGroup):
    waiting_contact = State()