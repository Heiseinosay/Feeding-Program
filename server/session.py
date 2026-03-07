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
        print(f"f_get_all_session!Error in getting all session: {e}")
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
        # Ensure the session belongs to the requesting teacher before deleting anything.
        verify_query = "SELECT 1 FROM tblSessions WHERE teacher_id = %s AND session_id = %s LIMIT 1"
        cursor.execute(verify_query, (user_id, session_id))
        owned_session = cursor.fetchone()
        if not owned_session:
            return { 'status': False, 'message': 'Session not found or unauthorized' }

        # Delete attendance rows tied to this session first (no orphan attendance).
        delete_attendance_query = "DELETE FROM tblAttendance WHERE session_id = %s"
        cursor.execute(delete_attendance_query, (session_id,))

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



def _f_get_session_dashboard_summary(user_id):
    mysqldb, cursor = connect_to_db()
    print("Im in _f_get_session_dashboard_summary!")
    print(user_id)

    if not user_id:
        mysqldb.close()
        return {
            "status": False,
            "message": "Missing userId",
            "sessions": [],
            "totalCompleted": 0,
        }

    try:
        nearest_query = """
            SELECT session_id, session_date, status, created_at, updated_at
            FROM tblSessions
            WHERE teacher_id = %s AND session_date >= CURRENT_DATE
            ORDER BY session_date
            LIMIT 1
        """
        cursor.execute(nearest_query, (user_id,))
        nearest_rows = cursor.fetchall()

        total_completed_query = """
            SELECT COUNT(*) AS total_completed
            FROM tblSessions
            WHERE status = 'completed' AND teacher_id = %s
        """
        cursor.execute(total_completed_query, (user_id,))
        total_completed_row = cursor.fetchone()
        total_completed = int(total_completed_row[0]) if total_completed_row else 0

        return {
            "status": True,
            "sessions": nearest_rows,
            "nearestSession": nearest_rows[0] if nearest_rows else None,
            "totalCompleted": total_completed,
        }
    except Error as e:
        print(f"_f_get_session_dashboard_summary!Error in getting dashboard session summary: {e}")
        return {
            "status": False,
            "sessions": [],
            "nearestSession": None,
            "totalCompleted": 0,
        }
    finally:
        mysqldb.close()


def f_get_nearest_upcoming_session(user_id):
    print("Im in f_get_nearest_upcoming_session!")
    return _f_get_session_dashboard_summary(user_id)


def f_get_total_completed_session(user_id):
    print("Im in f_get_total_completed_session!")
    summary = _f_get_session_dashboard_summary(user_id)

    if not summary.get("status"):
        return {
            "status": False,
            "sessions": [],
            "totalCompleted": 0,
        }

    total_completed = summary.get("totalCompleted", 0)
    return {
        "status": True,
        "sessions": [(total_completed,)],
        "totalCompleted": total_completed,
    }
