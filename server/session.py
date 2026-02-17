from dbutils import connect_to_db
import json
from mysql.connector import Error

def f_get_all_session(user_id):
    mysqldb, cursor = connect_to_db()
    print("Im in f_get_all_session!")
    print(user_id)

    if not user_id:
        mysqldb.close()
        return {
            "status": False,
            "message": "Missing userId",
            "sections": [],
        }

    try:
        read_query = (
            "SELECT s.*, "
            "EXISTS(SELECT 1 FROM tblAttendance a WHERE a.session_id = s.session_id) AS attendance_taken "
            "FROM tblSessions s WHERE s.teacher_id = %s"
        )
        cursor.execute(read_query, (user_id,))
        result = cursor.fetchall()

        # print(result)

        return { 
                'status': True,
                'sessions': result 
            }
    except Error as e:
        print(f"f_update_section!Error in inserting student: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()



def f_add_session(data):
    mysqldb, cursor = connect_to_db()
    print("Im in add_session!")
    user_id = data.get("userId")
    date = data.get("date")
    section_ids = data.get("section_ids")
    section_ids_json = json.dumps(section_ids)
    sponsors_text = data.get("sponsors_text")
    foods_text = data.get("foods_text")

    print(user_id, date, section_ids_json, sponsors_text, foods_text)

    try:        
        insert_query = """
            INSERT INTO tblSessions (teacher_id, session_date, participating_section, sponsors, foods_serve)
                VALUES(%s, %s, %s, %s, %s)
            ;
            """

        record = (user_id, date, section_ids_json, sponsors_text, foods_text)
        print(record)
        cursor.execute(insert_query, record)
        mysqldb.commit()

        return { 'status': True, 'session_id': cursor.lastrowid }

    except Error as e:
        print(f"Error in inserting student: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()



def f_set_cancel_session(data):
    mysqldb, cursor = connect_to_db()
    print("Im in f_set_cancel_session!")
    print(data)
    session_id = data.get('sessionId')
    user_id = data.get('userId')

    print(session_id, user_id)

    try:
    # UPDATE TASK
        update_query = "UPDATE tblSessions SET status='cancelled' WHERE session_id=%s AND teacher_id=%s"
        cursor.execute(update_query, (session_id, user_id))
        mysqldb.commit()
    
        return { 'status': True }
    except Error as e:
        print(f"Error in updating session: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()
        



def f_set_complete_session(data):
    mysqldb, cursor = connect_to_db()
    print("Im in f_set_complete_session!")
    print(data)
    session_id = data.get('sessionId')
    user_id = data.get('userId')

    print(session_id, user_id)

    try:
    # UPDATE TASK
        update_query = "UPDATE tblSessions SET status='completed' WHERE session_id=%s AND teacher_id=%s"
        cursor.execute(update_query, (session_id, user_id))
        mysqldb.commit()
    
        return { 'status': True }
    except Error as e:
        print(f"Error in updating session: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()



# DELETE SECTION
def f_delete_session(data):
    mysqldb, cursor = connect_to_db()
    
    print("Im on delete_session!")
    user_id = data.get("userId")
    session_id = data.get("sessionId")
    print(user_id, session_id)
    if not user_id or not session_id:
        mysqldb.close()
        return { 'status': False, 'message': 'Missing userId or sessionId' }

    try:
        delete_query = "DELETE FROM tblSessions WHERE teacher_id = %s AND session_id = %s"
        cursor.execute(delete_query, (user_id, session_id))
        mysqldb.commit()

        return { 'status': True }
    except Error as e:
        print(f"Error in deleting session: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()



def f_update_session_information(data):
    mysqldb, cursor = connect_to_db()
    print("Im in f_update_session_information!")
    session_id = data.get('sessionId')
    user_id = data.get('userId')
    session_date = data.get("date")
    section_ids = data.get("section_ids")
    section_ids_json = json.dumps(section_ids if isinstance(section_ids, list) else [])
    sponsors_text = data.get("sponsors_text")
    foods_text = data.get("foods_text")

    print(session_id, user_id, session_date, section_ids_json, sponsors_text, foods_text)

    if not session_id or not user_id:
        mysqldb.close()
        return { 'status': False, 'message': 'Missing userId or sessionId' }

    try:
        update_query = """
            UPDATE tblSessions
            SET session_date=%s, participating_section=%s, sponsors=%s, foods_serve=%s
            WHERE session_id=%s AND teacher_id=%s
        """
        cursor.execute(update_query, (session_date, section_ids_json, sponsors_text, foods_text, session_id, user_id))
        mysqldb.commit()
    
        return { 'status': True }
    except Error as e:
        print(f"Error in updating session: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()
