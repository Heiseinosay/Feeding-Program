from dbutils import connect_to_db
from datetime import date, datetime, timedelta
import json
from mysql.connector import Error


def _normalize_section_ids(section_ids):
    if not isinstance(section_ids, list):
        return []

    normalized = []
    seen = set()
    for section_id in section_ids:
        value = str(section_id).strip()
        if not value or value in seen:
            continue
        normalized.append(value)
        seen.add(value)
    return normalized


def _parse_session_date(value):
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value

    raw = str(value or "").strip()
    if not raw:
        return None

    try:
        return datetime.strptime(raw, "%Y-%m-%d").date()
    except ValueError:
        return None


def _load_session_section_ids(raw_value):
    if isinstance(raw_value, list):
        return _normalize_section_ids(raw_value)

    if isinstance(raw_value, str):
        try:
            parsed = json.loads(raw_value)
        except json.JSONDecodeError:
            return []
        return _normalize_section_ids(parsed)

    return []


def _find_weekly_section_conflicts(cursor, user_id, session_date, section_ids, exclude_session_id=None):
    parsed_date = _parse_session_date(session_date)
    normalized_section_ids = _normalize_section_ids(section_ids)

    if not parsed_date or not normalized_section_ids:
        return []

    week_start = parsed_date - timedelta(days=parsed_date.weekday())
    week_end = week_start + timedelta(days=6)

    query = """
        SELECT session_id, participating_section
        FROM tblsessions
        WHERE teacher_id = %s
          AND session_date BETWEEN %s AND %s
    """
    params = [user_id, week_start, week_end]

    if exclude_session_id:
        query += " AND session_id <> %s"
        params.append(exclude_session_id)

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()

    conflicts = []
    requested_sections = set(normalized_section_ids)
    for _, raw_sections in rows:
        existing_sections = set(_load_session_section_ids(raw_sections))
        conflicts.extend(sorted(requested_sections.intersection(existing_sections)))

    deduped_conflicts = []
    seen = set()
    for section_id in conflicts:
        if section_id in seen:
            continue
        deduped_conflicts.append(section_id)
        seen.add(section_id)
    return deduped_conflicts

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
            "EXISTS(SELECT 1 FROM tblattendance a WHERE a.session_id = s.session_id) AS attendance_taken "
            "FROM tblsessions s WHERE s.teacher_id = %s"
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
    section_ids = _normalize_section_ids(data.get("section_ids"))
    section_ids_json = json.dumps(section_ids)
    sponsors_text = data.get("sponsors_text")
    foods_text = data.get("foods_text")

    print(user_id, date, section_ids_json, sponsors_text, foods_text)

    parsed_date = _parse_session_date(date)
    if not user_id or not parsed_date:
        mysqldb.close()
        return { 'status': False, 'message': 'Missing or invalid session date.' }

    if parsed_date.weekday() >= 5:
        mysqldb.close()
        return { 'status': False, 'message': 'Only weekdays (Monday to Friday) are allowed.' }

    if not section_ids:
        mysqldb.close()
        return { 'status': False, 'message': 'Please select at least one section.' }

    try:        
        conflicting_sections = _find_weekly_section_conflicts(cursor, user_id, parsed_date, section_ids)
        if conflicting_sections:
            return {
                'status': False,
                'message': 'One or more sections already have a session scheduled in the same week.',
                'conflicting_sections': conflicting_sections,
            }

        insert_query = """
            INSERT INTO tblsessions (teacher_id, session_date, participating_section, sponsors, foods_serve)
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
        update_query = "UPDATE tblsessions SET status='cancelled' WHERE session_id=%s AND teacher_id=%s"
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
        update_query = "UPDATE tblsessions SET status='completed' WHERE session_id=%s AND teacher_id=%s"
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
        verify_query = "SELECT 1 FROM tblsessions WHERE teacher_id = %s AND session_id = %s LIMIT 1"
        cursor.execute(verify_query, (user_id, session_id))
        owned_session = cursor.fetchone()
        if not owned_session:
            return { 'status': False, 'message': 'Session not found or unauthorized' }

        # Delete attendance rows tied to this session first (no orphan attendance).
        delete_attendance_query = "DELETE FROM tblattendance WHERE session_id = %s"
        cursor.execute(delete_attendance_query, (session_id,))

        delete_query = "DELETE FROM tblsessions WHERE teacher_id = %s AND session_id = %s"
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
    section_ids = _normalize_section_ids(data.get("section_ids"))
    section_ids_json = json.dumps(section_ids if isinstance(section_ids, list) else [])
    sponsors_text = data.get("sponsors_text")
    foods_text = data.get("foods_text")

    print(session_id, user_id, session_date, section_ids_json, sponsors_text, foods_text)

    if not session_id or not user_id:
        mysqldb.close()
        return { 'status': False, 'message': 'Missing userId or sessionId' }

    parsed_date = _parse_session_date(session_date)
    if not parsed_date:
        mysqldb.close()
        return { 'status': False, 'message': 'Missing or invalid session date.' }

    if parsed_date.weekday() >= 5:
        mysqldb.close()
        return { 'status': False, 'message': 'Only weekdays (Monday to Friday) are allowed.' }

    if not section_ids:
        mysqldb.close()
        return { 'status': False, 'message': 'Please select at least one section.' }

    try:
        conflicting_sections = _find_weekly_section_conflicts(cursor, user_id, parsed_date, section_ids, exclude_session_id=session_id)
        if conflicting_sections:
            return {
                'status': False,
                'message': 'One or more sections already have a session scheduled in the same week.',
                'conflicting_sections': conflicting_sections,
            }

        update_query = """
            UPDATE tblsessions
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
            FROM tblsessions
            WHERE teacher_id = %s AND session_date >= CURRENT_DATE
            ORDER BY session_date
            LIMIT 1
        """
        cursor.execute(nearest_query, (user_id,))
        nearest_rows = cursor.fetchall()

        total_completed_query = """
            SELECT COUNT(*) AS total_completed
            FROM tblsessions
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
