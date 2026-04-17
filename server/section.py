from mysql.connector import Error

from dbutils import connect_to_db

def f_add_section(data):
    mysqldb, cursor = connect_to_db()
    print("Im in f_add_section!")
    print(data)

    user_id = data.get("userId")
    last_name = data.get("lastName")
    section_name = data.get("sectionName")
    grade_level = data.get("grade")
    if grade_level == "Grade 8":
        grade_level = 8
    else:
        grade_level = 0

    try:        
        cursor.execute("SELECT COALESCE(MAX(section_seq), 2000) + 1 FROM tblsections")
        next_seq_row = cursor.fetchone()
        next_seq = next_seq_row[0] if next_seq_row and next_seq_row[0] else 2001

        section_id = str(user_id) + "_" + last_name + "_" + str(next_seq)
        no_spaces_section_id = section_id.replace(" ", "")

        insert_query = """
            INSERT INTO tblsections(section_id, section_seq, section_name, grade_level, teacher_id)
                VALUES(%s, %s, %s, %s, %s)
            ;
            """

        record = (no_spaces_section_id, next_seq, section_name, grade_level, user_id)
        cursor.execute(insert_query, record)
        mysqldb.commit()

        return { 'status': True, 'sectionId': no_spaces_section_id }

    except Error as e:
        print(f"Error in inserting student: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()


def f_get_all_section(data):
    mysqldb, cursor = connect_to_db()
    print("Im in f_get_all_section!")
    # print(data)
    user_id = data.get("userId")

    if not user_id:
        mysqldb.close()
        return {
            "status": False,
            "message": "Missing userId",
            "sections": [],
        }

    try:
        read_query = (
            "SELECT * FROM tblsections WHERE teacher_id = %s"
        )
        cursor.execute(read_query, (user_id,))
        result = cursor.fetchall()
        columns = [column[0] for column in cursor.description]
        rows = [dict(zip(columns, row)) for row in result]

        sections = []
        for row in rows:
            section_name = row.get("section_name")
            grade_level = row.get("grade_level")
            created_at = row.get("created_at")
            section_id = row.get("section_id")

            grade_text = ""
            if grade_level == 0:
                grade_text = "Pre-elementary"
            else:
                grade_text = "Grade " + str(grade_level)

            if hasattr(created_at, "isoformat"):
                created_at = created_at.isoformat()

            sections.append({
                "id": section_id,
                "name": section_name,
                "grade": grade_text,
                "createdAt": created_at,
            })

        print(sections)

        if len(sections) == 0:
            return {
                "status": False,
                "message": "Nothing",
                "sections": [],
            }

        return {
            "status": True,
            "sections": sections,
        }
            

    except Error as e:
        print(f"Error in login: {e}")
        return {
            "status": False,
            "message": "Server error",
            "sections": [],
        }
    finally:
        mysqldb.close()


# UPDATE SECTION
def f_update_section(data):
    mysqldb, cursor = connect_to_db()
    print("Im on f_update_section!")
    
    new_section_name = data.get("newSectionName")
    new_grade_level = data.get("newGradeLevel")
    user_id = data.get("userId")
    last_name = data.get("lastName")
    section_id = data.get("sectionId")

    if new_grade_level == "Grade 8":
        new_grade_level = 8
    else:
        new_grade_level = 0

    print(new_section_name, new_grade_level, section_id, user_id)

    try:
    # UPDATE TASK
        update_query = "UPDATE tblsections SET section_name=%s, grade_level=%s  WHERE section_id=%s AND teacher_id=%s"
        cursor.execute(update_query, (new_section_name, new_grade_level, section_id, user_id))
        mysqldb.commit()
    
        return { 'status': True }
    except Error as e:
        print(f"Error in updating section: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()


# DELETE SECTION
def f_delete_section(data):
    mysqldb, cursor = connect_to_db()
    
    print("Im on delete_section!")
    user_id = data.get("userId")
    section_id = data.get("sectionId")
    print(user_id, section_id)
    if not user_id or not section_id:
        mysqldb.close()
        return { 'status': False, 'message': 'Missing userId or sectionId' }

    try:
        delete_query = "DELETE FROM tblsections WHERE teacher_id = %s AND section_id = %s"
        cursor.execute(delete_query, (user_id, section_id))

        delete_query = "DELETE FROM tblstudents WHERE teacher_id = %s AND section_id = %s"
        cursor.execute(delete_query, (user_id, section_id))
        mysqldb.commit()

        return { 'status': True }
    except Error as e:
        print(f"Error in deleting section: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()
