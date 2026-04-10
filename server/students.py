from dbutils import connect_to_db
from mysql.connector import Error
import json
from datetime import date

# for add students 1
def f_fetch_section_id(user_id, grade, section):
    mysqldb, cursor = connect_to_db()
    print("Im in f_fetch_section_id!")
    try:
        read_query = (
            "SELECT section_id FROM tblSections WHERE teacher_id=%s AND grade_level=%s AND section_name=%s"
        )
        cursor.execute(read_query, (user_id, grade, section))
        result = cursor.fetchone()

        print(result[0])

        return result[0]
    except Error as e:
        print(f"error on fetching section ID: {e}")
        return False
    finally:
        mysqldb.close()


# for add students 2
def f_add_students(data):
    mysqldb, cursor = connect_to_db()
    print("Im in f_add_students!")
    print(data)
    first_name = data.get("firstName")
    middle_name = data.get("middleName")
    last_name = data.get("lastName")
    sex = data.get("sex")
    age = data.get("age")
    grade = data.get("grade")
    section = data.get("section")

    height = data.get("height")
    weight = data.get("weight")
    bmi = data.get("bmi")
    bmiStatus = data.get("bmiStatus")
    user_id =  data.get("userId")

    if grade == "Pre-elementary":
        grade = 0
    else:
        grade = 8

    section_id = f_fetch_section_id(user_id, grade, section)
    print(section_id)
    if section_id == False:
        return { 'status': False }

    
    try:        
        insert_query = """
            INSERT INTO tblStudents (first_name, middle_name, last_name, sex, age, grade_level, section_id, section_name, height_cm, weight_kg, bmi, bmi_measurement, measurement_date, teacher_id)
                VALUES(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, JSON_ARRAY(%s), JSON_ARRAY(%s), JSON_ARRAY(CURRENT_DATE), %s)
            ;
            """

        record = (first_name, middle_name, last_name, sex, age, grade, section_id, section, height, weight, bmi, bmiStatus, user_id)        
        # print(record)

        cursor.execute(insert_query, record)
        mysqldb.commit()
        student_id = cursor.lastrowid

        return { 'status': True, 'studentId': student_id }

    except Error as e:
        print(f"Error in inserting student: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()


def f_get_all_students(user_id):
    mysqldb, cursor = connect_to_db()
    print("Im in f_get_all_students!")
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
            "SELECT * FROM tblStudents WHERE teacher_id = %s"
        )
        cursor.execute(read_query, (user_id,))
        result = cursor.fetchall()

        print(result)

        return { 
                'status': True,
                'students': result 
            }
    except Error as e:
        print(f"f_get_all_students!Error in inserting student: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()



def f_add_students_attendance(data):
    mysqldb, cursor = connect_to_db()
    print("Im in f_add_students_attendance!")
    print(data)

    try:
        if not data:
            return { 'status': False, 'message': 'Missing payload' }

        attendance_rows = data.get("attendance") if isinstance(data, dict) else data
        if not isinstance(attendance_rows, list) or len(attendance_rows) == 0:
            return { 'status': False, 'message': 'No attendance rows' }

        insert_query = """
            INSERT INTO tblAttendance (student_id, session_id, section_id, present, remarks)
            VALUES (%s, %s, %s, %s, %s)
        """

        records = []
        for row in attendance_rows:
            if not isinstance(row, dict):
                continue
            student_id = row.get("student_id")
            session_id = row.get("session_id")
            section_id = row.get("section_id")
            present = row.get("present", 0)
            remarks = row.get("remarks", "")

            if student_id is None or session_id is None or section_id in (None, ""):
                continue

            try:
                present_val = int(present)
            except (TypeError, ValueError):
                present_val = 0

            records.append((student_id, session_id, section_id, present_val, remarks))

        if not records:
            return { 'status': False, 'message': 'No valid attendance rows' }

        cursor.executemany(insert_query, records)
        mysqldb.commit()

        return { 'status': True }
    except Error as e:
        print(f"f_update_section!Error in inserting student: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()



# DELETE student
def f_delete_student(data):
    mysqldb, cursor = connect_to_db()
    
    print("Im on delete_student!")
    user_id = data.get("userId")
    student_id = data.get("studentId")
    print(user_id, student_id)
    if not user_id or not student_id:
        mysqldb.close()
        return { 'status': False, 'message': 'Missing userId or studentId' }

    try:
        delete_query = "DELETE FROM tblStudents WHERE teacher_id = %s AND student_id = %s"
        cursor.execute(delete_query, (user_id, student_id))
        mysqldb.commit()

        return { 'status': True }
    except Error as e:
        print(f"Error in deleting students: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()



def f_update_bmi_measurement(data):
    mysqldb, cursor = connect_to_db()
    
    print("Im on f_update_bmi_measurement!")
    user_id = data.get("userId")
    students = data.get("students") or []
    # print(data.students)
    # for student in students:
    #     print(student)
    # return
    try:
        if not user_id or not students:
            return { 'status': False, 'message': 'Missing userId or students' }

        def as_json_list(value):
            if value is None:
                return []

            if isinstance(value, (bytes, bytearray)):
                value = value.decode("utf-8")

            parsed = value
            if isinstance(value, str):
                try:
                    parsed = json.loads(value)
                except Exception:
                    return [value]

            if isinstance(parsed, list):
                return parsed
            return [parsed]

        def clean_status(value):
            if value is None:
                return "normal"
            status = str(value).strip()
            if not status:
                return "normal"
            # Handle legacy values like "\"underweight\""
            if status.startswith('"') and status.endswith('"'):
                try:
                    status = json.loads(status)
                except Exception:
                    status = status.strip('"')
            return str(status).strip().lower()

        select_query = """
            SELECT bmi, bmi_measurement, measurement_date
            FROM tblStudents
            WHERE student_id=%s AND teacher_id=%s
            LIMIT 1
        """

        update_query = """
            UPDATE tblStudents
            SET
                height_cm=%s,
                weight_kg=%s,
                bmi=%s,
                bmi_measurement=%s,
                measurement_date=%s
            WHERE student_id=%s AND teacher_id=%s
        """

        today = date.today().isoformat()
        records = []

        for student in students:
            student_id = student.get('studentId')
            height = student.get('height')
            weight = student.get('weight')
            bmi = student.get('bmi')
            bmi_status = clean_status(student.get('bmiStatus'))

            if not student_id:
                continue

            try:
                bmi_value = round(float(bmi), 1)
            except (TypeError, ValueError):
                bmi_value = None

            if bmi_value is None:
                continue

            cursor.execute(select_query, (student_id, user_id))
            existing = cursor.fetchone()
            if not existing:
                continue

            bmi_history = as_json_list(existing[0])
            status_history = [clean_status(v) for v in as_json_list(existing[1])]
            date_history = [str(v)[:10] for v in as_json_list(existing[2])]

            if date_history and date_history[-1] == today:
                if bmi_history:
                    bmi_history[-1] = bmi_value
                else:
                    bmi_history.append(bmi_value)

                if status_history:
                    status_history[-1] = bmi_status
                else:
                    status_history.append(bmi_status)
            else:
                bmi_history.append(bmi_value)
                status_history.append(bmi_status)
                date_history.append(today)

            records.append((
                height,
                weight,
                json.dumps(bmi_history),
                json.dumps(status_history),
                json.dumps(date_history),
                student_id,
                user_id
            ))

        if not records:
            return { 'status': False, 'message': 'No valid students' }

        cursor.executemany(update_query, records)
        mysqldb.commit()

        return { 'status': True }
    except Error as e:
        print(f"Error in updating session: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()


def f_update_student_information(data):
    mysqldb, cursor = connect_to_db()
    print("Im on f_edit_student!")
    
    student_id = data.get("studentId")
    user_id = data.get("userId")
    first_name = data.get("firstName")
    middle_name = data.get("middleName")
    last_name = data.get("lastName")
    sex = data.get("sex")
    age = data.get("age")

    print(student_id, user_id, first_name, middle_name, last_name, sex, age)

    try:
    # UPDATE TASK
        update_query = """
            UPDATE tblStudents 
            SET first_name=%s, middle_name=%s, last_name=%s, sex=%s, age=%s
            WHERE student_id=%s AND teacher_id=%s
        """
        
        cursor.execute(update_query, (first_name, middle_name, last_name, sex, age, student_id, user_id))
        mysqldb.commit()
    
        return { 'status': True }
    except Error as e:
        print(f"Error in updating student: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()



def f_get_student_attendance(student_id):
    mysqldb, cursor = connect_to_db()
    print("Im in f_get_student_attendance!")
    print("student_id for attendance: ", student_id)

    if not student_id:
        mysqldb.close()
        return {
            "status": False,
            "message": "Missing studentIId",
            "sections": [],
        }

    try:
        read_query = (
            """
                SELECT * 
                FROM tblAttendance 
                WHERE student_id = %s
            """
        )
        cursor.execute(read_query, (student_id,))
        result = cursor.fetchall()

        print(result)

        return { 
                'status': True,
                'studentsAttendance': result 
            }
    except Error as e:
        print(f"f_get_student_attendance! Error in inserting student: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()


def f_get_all_student_attendance(user_id):
    mysqldb, cursor = connect_to_db()
    print("Im in f_get_all_student_attendance!")
    print("user_id for attendance: ", user_id)

    if not user_id:
        mysqldb.close()
        return {
            "status": False,
            "message": "Missing user_id",
            "sections": [],
        }

    try:
        read_query = (
            """
                WITH sections AS (
                    SELECT DISTINCT section_id
                    FROM tblstudents
                    WHERE teacher_id = %s
                )

                SELECT *
                FROM tblAttendance
                WHERE section_id IN (
                        SELECT * FROM sections
                    )
            """
        )
        cursor.execute(read_query, (user_id,))
        result = cursor.fetchall()

        print(result)

        return { 
                'status': True,
                'studentsAttendance': result 
            }
    except Error as e:
        print(f"f_get_all_student_attendance! Error in inserting student: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()


def f_update_student_measurement_targeted(data):
    mysqldb, cursor = connect_to_db()
    print("Im on f_update_student_measurement_targeted!")

    student_id = data.get("studentId")
    user_id = data.get("userId")
    height = data.get("height")
    weight = data.get("weight")
    bmi = data.get("bmi")
    bmi_status = data.get("bmiStatus")

    if not user_id or not student_id:
        mysqldb.close()
        return { 'status': False, 'message': 'Missing userId or studentId' }

    try:
        def as_json_list(value):
            if value is None:
                return []

            if isinstance(value, (bytes, bytearray)):
                value = value.decode("utf-8")

            parsed = value
            if isinstance(value, str):
                raw = value.strip()
                if not raw:
                    return []
                try:
                    parsed = json.loads(raw)
                except Exception:
                    return [raw]

            if isinstance(parsed, list):
                return parsed
            return [parsed]

        def clean_status(value):
            if value is None:
                return "normal"
            status = str(value).strip()
            if not status:
                return "normal"
            if status.startswith('"') and status.endswith('"'):
                try:
                    status = json.loads(status)
                except Exception:
                    status = status.strip('"')
            return str(status).strip().lower() or "normal"

        try:
            bmi_value = round(float(bmi), 1)
            height_value = round(float(height), 1)
            weight_value = round(float(weight), 1)
        except (TypeError, ValueError):
            return { 'status': False, 'message': 'Invalid measurement values' }

        if height_value <= 0 or weight_value <= 0:
            return { 'status': False, 'message': 'Invalid measurement values' }

        select_query = """
            SELECT bmi, bmi_measurement, measurement_date
            FROM tblStudents
            WHERE student_id=%s AND teacher_id=%s
            LIMIT 1
        """
        cursor.execute(select_query, (student_id, user_id))
        existing = cursor.fetchone()
        if not existing:
            return { 'status': False, 'message': 'Student not found' }

        bmi_history = as_json_list(existing[0])
        status_history = [clean_status(v) for v in as_json_list(existing[1])]
        date_history = [str(v)[:10] for v in as_json_list(existing[2])]

        today = date.today().isoformat()
        next_status = clean_status(bmi_status)

        if date_history and date_history[-1] == today:
            if bmi_history:
                bmi_history[-1] = bmi_value
            else:
                bmi_history.append(bmi_value)

            if status_history:
                status_history[-1] = next_status
            else:
                status_history.append(next_status)
        else:
            bmi_history.append(bmi_value)
            status_history.append(next_status)
            date_history.append(today)

        update_query = """
            UPDATE tblStudents
            SET
                height_cm=%s,
                weight_kg=%s,
                bmi=%s,
                bmi_measurement=%s,
                measurement_date=%s
            WHERE student_id=%s AND teacher_id=%s
        """

        cursor.execute(
            update_query,
            (
                height_value,
                weight_value,
                json.dumps(bmi_history),
                json.dumps(status_history),
                json.dumps(date_history),
                student_id,
                user_id,
            ),
        )
        mysqldb.commit()

        return {
            'status': True,
            'studentId': student_id,
            'bmi': bmi_value,
            'bmiStatus': next_status,
            'measurementDate': today,
        }
    except Error as e:
        print(f"Error in updating student targeted measurement: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()
