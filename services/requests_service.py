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