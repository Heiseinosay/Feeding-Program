from mysql.connector import (connection)
from mysql.connector import Error

import secrets
import string

# DB CONNECTION
def connect_to_db():
    try:
        print("Attempting to connect...")

        # First method
        mysqldb = connection.MySQLConnection(
            user='root', 
            password='HelloWorld#,12345',                   
            host='localhost',
            database='FeedingProgram' # Use Existing Database
            # user='root',
            # password='vRbegrxYKNkDNwQvoByWSEylhwWGSJHU',
            # host='viaduct.proxy.rlwy.net',
            # database='railway',
            # port=41816   
        )

        print("Connection successful!")
        # Cursor
        cursor = mysqldb.cursor()

        return mysqldb, cursor

    except Error as e:
        print(f"Error: {e}")



