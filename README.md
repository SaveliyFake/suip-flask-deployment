# Inventory Management System 🏭

**Веб-приложение для учета материалов на складе**  
[![Flask](https://img.shields.io/badge/Flask-3.1.0-important)](https://flask.palletsprojects.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue)](https://www.postgresql.org/)

Демо на Render.com - https://suip-sberestov.onrender.com

## О проекте
Система инвентаризации материалов для оптимизации учета на складе. Реализовано:
- Управление материалами: добавление, редактирование, удаление.
- Поиск по названию, категориям, количеству.
- Заведение новых материалов в интерактивном формате.

## 🛠 Технологии
**Бэкенд**:
- Python 3.10+
- Flask 3.1.0
- PostgreSQL (psycopg2)

**Фронтенд**:
- HTML5 / CSS3
- JavaScript

## 🚀 Запуск локально
1. **Клонировать репозиторий**:
   ```bash
   git clone https://github.com/SaveliyFake/suip-flask-deployment.git
   cd suip-flask-deployment

2. **Настроить виртуальное окружение**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate    # Windows

3. Установить зависимости
   ```bash
   pip install -r requirements.txt

4. Запустить приложение
   ```bash
   python run.app

## 📸 Демонстрация работы
1. Гамбургер-меню и вывод записей из таблиц
   
![Гамбургер-меню и вывод записей из таблиц](https://github.com/SaveliyFake/suip-flask-deployment/blob/main/assets/01.gif)

2. Добавление нового материала
   
![Добавление нового материала](https://github.com/SaveliyFake/suip-flask-deployment/blob/main/assets/02.gif)

3. Форма дополнительной проверки после заведения данных
   
![Форма дополнительной проверки после заведения данных](https://github.com/SaveliyFake/suip-flask-deployment/blob/main/assets/03.gif)

4. Просмотр данных записи
   
![Просмотр данных записи](https://github.com/SaveliyFake/suip-flask-deployment/blob/main/assets/04.gif)

5. Редактирование текущей записи
    
![Редактирование текущей записи](https://github.com/SaveliyFake/suip-flask-deployment/blob/main/assets/05.gif)

6. Уадление записи
    
![Уадление записи](https://github.com/SaveliyFake/suip-flask-deployment/blob/main/assets/06.gif)

7. Поиск
    
![Поиск](https://github.com/SaveliyFake/suip-flask-deployment/blob/main/assets/07.gif)
