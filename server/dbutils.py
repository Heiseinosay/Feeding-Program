import os
from pathlib import Path

from dotenv import load_dotenv
from mysql.connector import Error
from mysql.connector import connection


load_dotenv(Path(__file__).resolve().parent / ".env")

# DB CONNECTION
def connect_to_db():
    try:
        print("Attempting to connect...")
        db_user = os.getenv("DB_USER")
        db_password = os.getenv("DB_PASSWORD")
        db_host = os.getenv("DB_HOST", "localhost")
        db_name = os.getenv("DB_NAME")
        db_port = os.getenv("DB_PORT")

        if not db_user or not db_password or not db_name:
            raise ValueError(
                "Missing database environment variables. "
                "Set DB_USER, DB_PASSWORD, and DB_NAME in server/.env."
            )

        connection_kwargs = {
            "user": db_user,
            "password": db_password,
            "host": db_host,
            "database": db_name,
        }
        if db_port:
            connection_kwargs["port"] = int(db_port)

        mysqldb = connection.MySQLConnection(
            **connection_kwargs
        )

        print("Connection successful!")
        # Cursor
        cursor = mysqldb.cursor()

        return mysqldb, cursor

    except (Error, ValueError) as e:
        print(f"Error: {e}")



