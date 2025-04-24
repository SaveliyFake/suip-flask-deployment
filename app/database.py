import psycopg2
from contextlib import contextmanager
from config import Config
import logging

# Настройка логгера
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@contextmanager
def get_db_connection():
    try:
        conn = psycopg2.connect(**Config.DB_CONFIG)
        logger.info("Успешное подключение к БД")
        try:
            yield conn
        finally:
            conn.close()
            logger.info("Подключение к БД закрыто")
    except psycopg2.Error as e:
        logger.info(f"Ошибка подключение к БД: {e}")
        raise
        
@contextmanager
def get_db_cursor():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            logger.info("Курсор создан")
            try:
                yield cursor
                conn.commit()
                logger.info("Транзакция зафиксирована")
            except psycopg2.Error as e:
                conn.rollback()
                logger.error(f"Ошибка при выполнении запроса: {e}")
                raise
            finally:
                cursor.close()
                logger.info("Курсор закрыт")
    except psycopg2.Error as e:
        logger.error(f"Ошибка при работе с курсором: {e}")
        raise
    