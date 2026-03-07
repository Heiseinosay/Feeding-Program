from dbutils import connect_to_db
from mysql.connector import Error
import json
from datetime import date


def f_get_all_status_count(user_id):
    mysqldb, cursor = connect_to_db()
    print("Im in f_get_all_status_count!")
    try:
        read_query = (
            """
                # SELECT TOTAL STUDENTS FOR EACH STATUS AND SECTION
                WITH flattened AS (
                SELECT
                    s.student_id,
                    s.section_id,
                    jt.mdate AS measurement_date,
                    DATE_FORMAT(jt.mdate, '%Y-%m-01') AS month_key,
                    JSON_UNQUOTE(JSON_EXTRACT(s.bmi_measurement, CONCAT('$[', jt.rn - 1, ']'))) AS bmi_status
                FROM tblStudents s
                JOIN JSON_TABLE(
                    s.measurement_date,
                    '$[*]' COLUMNS (
                    rn FOR ORDINALITY,
                    mdate DATE PATH '$'
                    )
                ) jt
                WHERE s.teacher_id = %s
                ),
                ranked AS (
                SELECT
                    *,
                    ROW_NUMBER() OVER (
                    PARTITION BY student_id, section_id, month_key
                    ORDER BY measurement_date DESC
                    ) AS rn_latest
                FROM flattened
                ),
                latest_per_month AS (
                SELECT
                    student_id,
                    section_id,
                    month_key,
                    bmi_status
                FROM ranked
                WHERE rn_latest = 1
                )
                SELECT
                section_id,
                month_key AS month,
                SUM(bmi_status = 'overweight')  AS overweight_count,
                SUM(bmi_status = 'normal')      AS normal_count,
                SUM(bmi_status = 'underweight') AS underweight_count,
                COUNT(*)                        AS total_students_counted
                FROM latest_per_month
                GROUP BY section_id, month_key
                ORDER BY section_id, month_key;
            """
        )
        cursor.execute(read_query, (user_id,))
        result = cursor.fetchall()

        return { 
                'status': True,
                'Summary': result 
            }
    except Error as e:
        print(f"error on fetching bar chart counts: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()