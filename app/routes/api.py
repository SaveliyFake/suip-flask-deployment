from flask import Blueprint, render_template, request, jsonify
from app.database import get_db_cursor
import logging
from psycopg2 import sql, DatabaseError

api_bp = Blueprint('api', __name__)

# Настройка логгера
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@api_bp.route('/<table_name>')
def get_table(table_name):
    allowed_tables = ['os', 'works', 'materials', 'equipment']
    if table_name not in allowed_tables:
        logger.warning(f"попытка доступа к несуществующей таблице: {table_name}")
        return "Invalid table", 400
    
    search_query = request.args.get('search', '')
    logger.info(f"Запрос к таблицу {table_name}, поиск: '{search_query}'")
    
    
    with get_db_cursor() as cursor:
        # Получаем список всех колонок таблицы
        cursor.execute(sql.SQL("SELECT * FROM {} LIMIT 0").format(sql.Identifier(table_name)))
        columns = [desc[0] for desc in cursor.description]
        
        base_query = sql.SQL("SELECT * FROM {}").format(sql.Identifier(table_name))
        params = []
        
        # Условия поиска
        if search_query:
            search_conditions = [
                sql.SQL("CAST({} AS TEXT) ILIKE %s").format(sql.Identifier(col)) for col in columns
            ]
            logger.info(f"search_conditions: {search_conditions}")
            base_query = base_query + sql.SQL(" WHERE {}").format(
                sql.SQL('OR ').join(search_conditions)
            )
            
            params = ['%' + search_query + '%'] * len(columns)
            logger.info(f"params: {params}")
        
        cursor.execute(base_query, params)
        data = [dict(zip(columns, row)) for row in cursor.fetchall()]
        logger.info(f"base_query: {base_query}, params: '{params}'")
        
    
    return render_template(
        'index.html', 
        active_table=table_name, 
        data=data, 
        search_query=search_query,
        columns=columns
    )
    
@api_bp.route('/add-form-fields')
def get_add_form_fields():
    table_name = request.args.get('table')
    allowed_tables = ['os', 'works', 'materials', 'equipment']
    
    if table_name not in allowed_tables:
        return "Invalid table", 400
    
    column_translations = {
        'os': {
            'REGION': 'Регион',
            'PLATFORM_ADDRESS': 'Адрес площадки',
            'EQUIPMENT_MODEL': 'Модель оборудования',
            'INVENTORY_NUMBER': 'Инвентарный номер',
            'EXPLOITATION_DATE': 'Дата добавления'
        },
        'works': {
            'DESCRIPTION': 'Описание работ',
            'OS': 'ОС',
            'PLANNED_DATE': 'Запланированная дата',
            'STATUS': 'Статус'
        },
        'materials': {
            'TYPE': 'Тип комплектующего',
            'NAME': 'Название модели',
            'PART_NUMBER': 'Артикул производителя',
            'SERIAL_NUMBER': 'Серийный номер',
            'STORE_ADDRESS': 'Адрес склада',
            'RECEIVE_DATE': 'Дата получения',
            'ROW': 'Ряд',
            'SHELF': 'Полка',
            'CONTAINER': 'Контейнер'
        },
        'equipment': {
            'MODEL': 'Модель оборудования',
            'MODEL_SERIES': 'Модель серии'
        }
    }
    
    # Получаем колонки таблицы
    with get_db_cursor() as cursor:
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 0")
        columns = [desc[0] for desc in cursor.description]
    
    # Фильтруем колонки, которые разрешены для отображения
    allowed_columns = {
        'os': ['REGION', 'PLATFORM_ADDRESS', 'EQUIPMENT_MODEL', 'INVENTORY_NUMBER', 'EXPLOITATION_DATE'],
        'works': ['DESCRIPTION', 'OS', 'PLANNED_DATE', 'STATUS'],
        'materials': ['TYPE', 'NAME', 'PART_NUMBER', 'SERIAL_NUMBER', 'STORE_ADDRESS', 'RECEIVE_DATE', 'ROW', 'SHELF', 'CONTAINER'],
        'equipment': ['MODEL', 'MODEL_SERIES']
    }
    
    # Выбираем нужные колонки
    selected_columns = [col for col in columns if col in allowed_columns[table_name]]
    
    # Создаем список переводов
    translations = column_translations.get(table_name, {})
    selected_columns_translated = [translations.get(col, col) for col in selected_columns]
    
    return jsonify({
        "columns": selected_columns, 
        "columns_translated": selected_columns_translated
    })

@api_bp.route('/add/<table_name>', methods=['POST'])
def add_entry(table_name):
    allowed_tables = ['os', 'works', 'materials', 'equipment']
    if table_name not in allowed_tables:
        return jsonify({"error": "Invalid table"}), 400
    
    try:
        # Получаем json объект из форм
        form_data = request.get_json()
        if not form_data:
            return jsonify({"error": "No data provided"}), 400
        
        # Получаем колонки таблицы
        with get_db_cursor() as cursor:
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 0")
            columns = [desc[0].upper() for desc in cursor.description]
        
        # Проверка данных из json
        valid_data = {key.upper(): item for key, item in form_data.items() if key.upper() in columns}
        
        # Формируем SQL-запрос
        query = sql.SQL("""
            INSERT INTO {} ({})
            VALUES ({})
        """).format(
            sql.Identifier(table_name),
            sql.SQL(', ').join(map(sql.Identifier, valid_data.keys())),
            sql.SQL(', ').join([sql.Placeholder()] * len(valid_data))
        )
        
        # Выполняем запрос
        with get_db_cursor() as cursor:
            cursor.execute(query, list(valid_data.values()))
        
        return jsonify({"success": True}), 200

    except DatabaseError as e:
        logger.error(f"Database error: {e}")
        return jsonify({"error": str(e)}), 500
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500
    
@api_bp.route('/<table_name>/<int:entry_id>')
def get_entry(table_name, entry_id):
    allowed_tables = ['os', 'works', 'materials', 'equipment']
    if table_name not in allowed_tables:
        return jsonify({"error": "Invalid table"}), 400
    
    with get_db_cursor() as cursor:
        query = sql.SQL("SELECT * FROM {} WHERE \"ID\" = %s").format(sql.Identifier(table_name))
        cursor.execute(query, (entry_id,))
        entry = cursor.fetchone()
        if not entry:
            return jsonify({"error": "Entry not found"}), 404
        
        columns = [desc[0] for desc in cursor.description]
        data = dict(zip(columns, entry))
        
    return jsonify(data)
    
@api_bp.route('/delete/<table_name>/<int:entry_id>', methods=['DELETE'])
def delete_entry(table_name, entry_id):
    allowed_tables = ['os', 'works', 'materials', 'equipment']
    if table_name not in allowed_tables:
        return jsonify({"error": "Invalid table"}), 400
    
    with get_db_cursor() as cursor:
        query = sql.SQL("DELETE FROM {} WHERE \"ID\" = %s").format(sql.Identifier(table_name))
        cursor.execute(query, (entry_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Cannot delete entry"}), 404
        
    return jsonify({"success": True}), 200

@api_bp.route('/update/<table_name>/<int:entry_id>', methods=['PUT'])
def update_entry(table_name, entry_id):
    allowed_tables = ['os', 'works', 'materials', 'equipment']
    if table_name not in allowed_tables:
        return jsonify({"error": "Invalid table"}), 400
    
    try:
        form_data = request.get_json()
        if not form_data:
            return jsonify({"error": "No data provided"}), 400
        
        with get_db_cursor() as cursor:
            # Получаем все поля таблицы
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 0")
            columns = [desc[0] for desc in cursor.description]
            
            set_clause = sql.SQL(', ').join([
                sql.SQL("{} = %s").format(sql.Identifier(key))
                for key in form_data if key in columns
            ])
            
            if not set_clause:
                return jsonify({"error": "No valid field to update"}), 400
            
            query = sql.SQL("""
                UPDATE {}   
                SET {}
                WHERE \"ID\" = %s
            """).format(
                sql.Identifier(table_name),
                set_clause
            )
            
            values = list(form_data.values()) + [entry_id]
            cursor.execute(query, values)
            
        return jsonify({"success": True}), 200
            
    except DatabaseError as e:
        logger.error(f"Database error: {e}")
        return jsonify({"error": "Database error"}), 500
    
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({"error": str(e)}), 500