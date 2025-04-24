from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    DB_CONFIG = {
        'host': os.getenv('DB_HOST'),
        'database': os.getenv('DB_NAME'),
        'user': os.getenv('DB_USER'),
        'password': os.getenv('DB_PASSWORD')
    }
    SECRET_KEY = os.getenv('SECRET_KEY')