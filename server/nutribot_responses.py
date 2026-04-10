from typing import Any


TABLE_NAME = "tblStudents"
ATTENDANCE_TABLE_NAME = "tblAttendance"
AT_RISK_TYPES = ("underweight", "overweight")
BMI_CATEGORIES = ("underweight", "normal", "overweight")
CAPABILITY_EXAMPLES = [
    {
        "intent": "list_at_risk_students",
        "sample_questions": [
            "show at risk students",
            "list at risk learners",
            "which students are at risk",
            "show underweight and overweight students",
            "who are the risky pupils in section a",
        ],
    },
    {
        "intent": "count_at_risk_students",
        "sample_questions": [
            "how many at risk students are there",
            "count underweight students",
            "what is the total number of overweight students",
            "how many risky learners are in section b",
            "count at risk students in sec c",
        ],
    },
    {
        "intent": "list_students_by_bmi_category",
        "sample_questions": [
            "list underweight students",
            "show overweight students in section a",
            "which students are normal",
            "display normal bmi students in sec b",
            "show students who are underweight",
        ],
    },
    {
        "intent": "list_at_risk_recently_absent_students",
        "sample_questions": [
            "show at risk students who were recently absent",
            "list absent at risk students",
            "which underweight students were absent in the latest feeding session",
            "show overweight students absent from feeding",
            "who are the at risk students that missed the last feeding",
        ],
    },
    {
        "intent": "find_student",
        "sample_questions": [
            "find Maria Santos",
            "search student John Cruz",
            "who is student 1023",
            "locate learner Anna Reyes",
            "look up Pedro Dela Cruz",
        ],
    },
    {
        "intent": "summarise_section_nutrition_status",
        "sample_questions": [
            "summarise section a",
            "give me the nutrition summary of section b",
            "show the bmi status breakdown of sec c",
            "section 1 nutrition overview",
            "provide a section summary for section a",
        ],
    },
    {
        "intent": "get_student_bmi_history",
        "sample_questions": [
            "show bmi history of Maria Santos",
            "what is the bmi history of John Cruz",
            "how has Maria's bmi changed",
            "show me the bmi trend of student 1023",
            "give me the measurement history of Anna Reyes",
        ],
    },
    {
        "intent": "get_student_latest_bmi",
        "sample_questions": [
            "what is Maria Santos' latest bmi",
            "show the latest bmi of John Cruz",
            "what is student 1023's current bmi",
            "give me the most recent bmi of Anna Reyes",
            "show me the newest bmi record of Carla Mendoza",
        ],
    },
    {
        "intent": "list_students_missing_recent_measurement",
        "sample_questions": [
            "which students have no recent measurement",
            "show students missing bmi records",
            "who still needs to be measured",
            "list students without recent bmi",
            "show students without a recent measurement in section a",
        ],
    },
]


def _normalize_risk_types(risk_types: Any) -> list[str]:
    """
    Keep only the supported at-risk BMI categories for this intent.
    """
    if not isinstance(risk_types, list):
        return list(AT_RISK_TYPES)

    normalized = []
    for risk_type in risk_types:
        if isinstance(risk_type, str):
            value = risk_type.strip().lower()
            if value in AT_RISK_TYPES and value not in normalized:
                normalized.append(value)

    return normalized or list(AT_RISK_TYPES)


def _normalize_bmi_category(bmi_category: Any) -> str | None:
    """
    Keep only the supported single BMI category values for this intent.
    """
    if not isinstance(bmi_category, str):
        return None

    cleaned = bmi_category.strip().lower()
    if cleaned in BMI_CATEGORIES:
        return cleaned

    return None


def _normalize_section(section: Any) -> tuple[str | None, str | None]:
    """
    Convert the detected section entity into values usable for section_name/section_id filters.
    """
    if not isinstance(section, str):
        return None, None

    cleaned = section.strip()
    if not cleaned:
        return None, None

    lowered = cleaned.lower()
    if lowered.startswith("section "):
        section_code = cleaned.split(" ", 1)[1].strip()
    elif lowered.startswith("sec "):
        section_code = cleaned.split(" ", 1)[1].strip()
    else:
        section_code = cleaned

    if section_code.isalpha():
        section_code = section_code.upper()

    cleaned = f"Section {section_code}"

    return cleaned, section_code


def _normalize_student_name(student_name: Any) -> str | None:
    """
    Collapse whitespace and keep a usable student-name search string.
    """
    if not isinstance(student_name, str):
        return None

    cleaned = " ".join(student_name.strip().split())
    return cleaned or None


def _normalize_teacher_id(teacher_id: Any) -> int | None:
    """
    Keep only a valid numeric teacher identifier.
    """
    if teacher_id is None:
        return None

    raw = str(teacher_id).strip()
    if not raw.isdigit():
        return None

    return int(raw)


def _require_teacher_id(intent_result: dict[str, Any]) -> int:
    """
    Extract the current teacher id required for all NutriBot student queries.
    """
    teacher_id = _normalize_teacher_id(intent_result.get("teacher_id"))
    if teacher_id is None:
        raise ValueError("Missing valid teacher_id for NutriBot query.")

    return teacher_id


def _build_measurement_date_parse_expression(field_name: str) -> str:
    """
    Build a MySQL expression that tries a few practical date formats for measurement dates.
    """
    return f"""
COALESCE(
    STR_TO_DATE({field_name}, '%Y-%m-%d'),
    STR_TO_DATE({field_name}, '%Y/%m/%d'),
    STR_TO_DATE({field_name}, '%m/%d/%Y'),
    STR_TO_DATE({field_name}, '%Y-%m'),
    STR_TO_DATE({field_name}, '%b %Y'),
    STR_TO_DATE({field_name}, '%M %Y')
)
""".strip()


def _build_section_filter(
    entities: dict[str, Any],
    section_name_field: str = "section_name",
    section_id_field: str = "section_id",
) -> tuple[list[str], list[Any]]:
    """
    Build the WHERE clauses and params for section-scoped queries.
    """
    section_name, section_code = _normalize_section(entities.get("section"))

    if not (section_name and section_code):
        return ["1 = 0"], []

    return [
        f"({section_name_field} = %s OR {section_id_field} = %s)"
    ], [section_name, section_code]


def _build_optional_section_filter(
    entities: dict[str, Any],
    section_name_field: str = "section_name",
    section_id_field: str = "section_id",
) -> tuple[list[str], list[Any]]:
    """
    Build optional WHERE clauses and params for queries that may or may not be section-scoped.
    """
    section_name, section_code = _normalize_section(entities.get("section"))

    if not (section_name and section_code):
        return [], []

    return [
        f"({section_name_field} = %s OR {section_id_field} = %s)"
    ], [section_name, section_code]


def _build_student_lookup_filters(entities: dict[str, Any]) -> tuple[list[str], list[Any]]:
    """
    Build the WHERE clauses and params for basic student lookup.
    """
    student_id = entities.get("student_id")
    student_name = _normalize_student_name(entities.get("student_name"))

    if student_id is not None and str(student_id).strip().isdigit():
        return ["student_id = %s"], [int(str(student_id).strip())]

    if not student_name:
        return ["1 = 0"], []

    name_tokens = student_name.split()
    wildcard_name = f"%{student_name}%"

    if len(name_tokens) == 1:
        where_clauses = [
            "("
            "LOWER(first_name) LIKE LOWER(%s) "
            "OR LOWER(middle_name) LIKE LOWER(%s) "
            "OR LOWER(last_name) LIKE LOWER(%s)"
            ")"
        ]
        return where_clauses, [wildcard_name, wildcard_name, wildcard_name]

    where_clauses = [
        "("
        "LOWER(TRIM(CONCAT_WS(' ', first_name, middle_name, last_name))) LIKE LOWER(%s) "
        "OR LOWER(TRIM(CONCAT_WS(' ', first_name, last_name))) LIKE LOWER(%s) "
        "OR LOWER(first_name) LIKE LOWER(%s) "
        "OR LOWER(middle_name) LIKE LOWER(%s) "
        "OR LOWER(last_name) LIKE LOWER(%s)"
        ")"
    ]
    return where_clauses, [wildcard_name, wildcard_name, wildcard_name, wildcard_name, wildcard_name]


def _build_at_risk_filters(
    entities: dict[str, Any],
    bmi_status_field: str = "latest_bmi_status",
    section_name_field: str = "section_name",
    section_id_field: str = "section_id",
) -> tuple[list[str], list[Any]]:
    """
    Build the shared WHERE clauses and params for at-risk student filtering.
    """
    risk_types = _normalize_risk_types(entities.get("risk_types"))
    section_name, section_code = _normalize_section(entities.get("section"))

    where_clauses = [
        f"{bmi_status_field} IN ({', '.join(['%s'] * len(risk_types))})",
    ]
    params: list[Any] = list(risk_types)

    if section_name and section_code:
        where_clauses.append(f"({section_name_field} = %s OR {section_id_field} = %s)")
        params.extend([section_name, section_code])

    return where_clauses, params


def _build_recent_absence_filter(entities: dict[str, Any]) -> tuple[list[str], list[Any]]:
    """
    Build the shared WHERE clauses and params for the v1 latest-session absence concept.
    """
    where_clauses, params = _build_at_risk_filters(
        entities,
        bmi_status_field="latest_student_bmi.latest_bmi_status",
        section_name_field="latest_student_bmi.section_name",
        section_id_field="latest_student_bmi.section_id",
    )
    where_clauses.append("latest_attendance.present = %s")
    params.append(0)

    return where_clauses, params


def _build_bmi_category_filters(
    entities: dict[str, Any],
    bmi_status_field: str = "latest_bmi_status",
    section_name_field: str = "section_name",
    section_id_field: str = "section_id",
) -> tuple[list[str], list[Any]]:
    """
    Build the shared WHERE clauses and params for one explicit BMI category.
    """
    bmi_category = _normalize_bmi_category(entities.get("bmi_category"))
    section_name, section_code = _normalize_section(entities.get("section"))

    where_clauses = [f"{bmi_status_field} = %s"]
    params: list[Any] = [bmi_category]

    if section_name and section_code:
        where_clauses.append(f"({section_name_field} = %s OR {section_id_field} = %s)")
        params.extend([section_name, section_code])

    return where_clauses, params


def build_list_at_risk_students_query(intent_result: dict[str, Any]) -> dict[str, Any]:
    """
    Build the SQL and parameters for the `list_at_risk_students` intent.

    Expected entities:
    - risk_types: ['underweight', 'overweight']
    - section: optional, e.g. 'Section A'
    """
    teacher_id = _require_teacher_id(intent_result)
    entities = intent_result.get("entities", {})
    where_clauses, params = _build_at_risk_filters(entities)

    sql = f"""
SELECT
    student_id,
    CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name,
    sex,
    grade_level,
    section_name,
    latest_bmi_status,
    latest_measurement_date
FROM (
    SELECT
        student_id,
        first_name,
        middle_name,
        last_name,
        sex,
        grade_level,
        section_name,
        section_id,
        JSON_UNQUOTE(
            JSON_EXTRACT(bmi_measurement, CONCAT('$[', JSON_LENGTH(bmi) - 1, ']'))
        ) AS latest_bmi_status,
        CASE
            WHEN measurement_date IS NOT NULL
             AND COALESCE(JSON_LENGTH(measurement_date), 0) > 0
            THEN JSON_UNQUOTE(
                JSON_EXTRACT(
                    measurement_date,
                    CONCAT('$[', JSON_LENGTH(measurement_date) - 1, ']')
                )
            )
            ELSE NULL
        END AS latest_measurement_date
    FROM {TABLE_NAME}
    WHERE teacher_id = %s
      AND bmi IS NOT NULL
      AND COALESCE(JSON_LENGTH(bmi), 0) > 0
) AS latest_student_bmi
WHERE {" AND ".join(where_clauses)}
ORDER BY section_name, last_name, first_name;
""".strip()

    return {
        "intent": "list_at_risk_students",
        "sql": sql,
        "params": [teacher_id, *params],
        "selected_fields": [
            "student_id",
            "full_name",
            "sex",
            "grade_level",
            "section_name",
            "latest_bmi_status",
            "latest_measurement_date",
        ],
    }


def build_count_at_risk_students_query(intent_result: dict[str, Any]) -> dict[str, Any]:
    """
    Build the SQL and parameters for the `count_at_risk_students` intent.

    Expected entities:
    - risk_types: ['underweight', 'overweight']
    - section: optional, e.g. 'Section A'
    """
    teacher_id = _require_teacher_id(intent_result)
    entities = intent_result.get("entities", {})
    where_clauses, params = _build_at_risk_filters(entities)

    sql = f"""
SELECT
    latest_bmi_status,
    COUNT(*) AS student_count
FROM (
    SELECT
        student_id,
        section_name,
        section_id,
        JSON_UNQUOTE(
            JSON_EXTRACT(bmi_measurement, CONCAT('$[', JSON_LENGTH(bmi) - 1, ']'))
        ) AS latest_bmi_status
    FROM {TABLE_NAME}
    WHERE teacher_id = %s
      AND bmi IS NOT NULL
      AND COALESCE(JSON_LENGTH(bmi), 0) > 0
) AS latest_student_bmi
WHERE {" AND ".join(where_clauses)}
GROUP BY latest_bmi_status;
""".strip()

    return {
        "intent": "count_at_risk_students",
        "sql": sql,
        "params": [teacher_id, *params],
        "selected_fields": [
            "student_count",
        ],
    }


def build_list_students_by_bmi_category_query(intent_result: dict[str, Any]) -> dict[str, Any]:
    """
    Build the SQL and parameters for the `list_students_by_bmi_category` intent.

    Expected entities:
    - bmi_category: 'underweight' | 'normal' | 'overweight'
    - section: optional, e.g. 'Section A'
    """
    teacher_id = _require_teacher_id(intent_result)
    entities = intent_result.get("entities", {})
    where_clauses, params = _build_bmi_category_filters(entities)

    sql = f"""
SELECT
    student_id,
    CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name,
    sex,
    grade_level,
    section_name,
    latest_bmi_status,
    latest_measurement_date
FROM (
    SELECT
        student_id,
        first_name,
        middle_name,
        last_name,
        sex,
        grade_level,
        section_name,
        section_id,
        JSON_UNQUOTE(
            JSON_EXTRACT(bmi_measurement, CONCAT('$[', JSON_LENGTH(bmi) - 1, ']'))
        ) AS latest_bmi_status,
        CASE
            WHEN measurement_date IS NOT NULL
             AND COALESCE(JSON_LENGTH(measurement_date), 0) > 0
            THEN JSON_UNQUOTE(
                JSON_EXTRACT(
                    measurement_date,
                    CONCAT('$[', JSON_LENGTH(measurement_date) - 1, ']')
                )
            )
            ELSE NULL
        END AS latest_measurement_date
    FROM {TABLE_NAME}
    WHERE teacher_id = %s
      AND bmi IS NOT NULL
      AND COALESCE(JSON_LENGTH(bmi), 0) > 0
) AS latest_student_bmi
WHERE {" AND ".join(where_clauses)}
ORDER BY section_name, last_name, first_name;
""".strip()

    return {
        "intent": "list_students_by_bmi_category",
        "sql": sql,
        "params": [teacher_id, *params],
        "selected_fields": [
            "student_id",
            "full_name",
            "sex",
            "grade_level",
            "section_name",
            "latest_bmi_status",
            "latest_measurement_date",
        ],
    }


def build_list_at_risk_recently_absent_students_query(
    intent_result: dict[str, Any]
) -> dict[str, Any]:
    """
    Build the SQL and parameters for the `list_at_risk_recently_absent_students` intent.

    Expected entities:
    - risk_types: ['underweight', 'overweight']
    - section: optional, e.g. 'Section A'
    - absence_context: 'latest_feeding_session'
    """
    teacher_id = _require_teacher_id(intent_result)
    entities = intent_result.get("entities", {})
    where_clauses, params = _build_recent_absence_filter(entities)

    sql = f"""
SELECT
    latest_student_bmi.student_id,
    CONCAT_WS(
        ' ',
        latest_student_bmi.first_name,
        latest_student_bmi.middle_name,
        latest_student_bmi.last_name
    ) AS full_name,
    latest_student_bmi.sex,
    latest_student_bmi.grade_level,
    latest_student_bmi.section_name,
    latest_student_bmi.latest_bmi_status,
    latest_attendance.session_id AS latest_session_id,
    latest_attendance.remarks AS attendance_remarks
FROM (
    SELECT
        student_id,
        first_name,
        middle_name,
        last_name,
        sex,
        grade_level,
        section_name,
        section_id,
        JSON_UNQUOTE(
            JSON_EXTRACT(bmi_measurement, CONCAT('$[', JSON_LENGTH(bmi) - 1, ']'))
        ) AS latest_bmi_status
    FROM {TABLE_NAME}
    WHERE teacher_id = %s
      AND bmi IS NOT NULL
      AND COALESCE(JSON_LENGTH(bmi), 0) > 0
) AS latest_student_bmi
INNER JOIN (
    SELECT
        student_id,
        section_id,
        session_id,
        present,
        remarks
    FROM {ATTENDANCE_TABLE_NAME}
    WHERE session_id = (
        SELECT MAX(session_id)
        FROM {ATTENDANCE_TABLE_NAME}
    )
) AS latest_attendance
    ON latest_attendance.student_id = latest_student_bmi.student_id
WHERE {" AND ".join(where_clauses)}
ORDER BY latest_student_bmi.section_name, latest_student_bmi.last_name, latest_student_bmi.first_name;
""".strip()

    return {
        "intent": "list_at_risk_recently_absent_students",
        "sql": sql,
        "params": [teacher_id, *params],
        "selected_fields": [
            "student_id",
            "full_name",
            "sex",
            "grade_level",
            "section_name",
            "latest_bmi_status",
            "latest_session_id",
            "attendance_remarks",
        ],
    }


def build_find_student_query(intent_result: dict[str, Any]) -> dict[str, Any]:
    """
    Build the SQL and parameters for the `find_student` intent.

    Expected entities:
    - student_id: optional numeric identifier
    - student_name: optional person-name text
    """
    teacher_id = _require_teacher_id(intent_result)
    entities = intent_result.get("entities", {})
    where_clauses, params = _build_student_lookup_filters(entities)

    sql = f"""
SELECT
    student_id,
    CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name,
    sex,
    age,
    grade_level,
    section_name,
    school_name
FROM {TABLE_NAME}
WHERE teacher_id = %s
  AND {" AND ".join(where_clauses)}
ORDER BY last_name, first_name;
""".strip()

    return {
        "intent": "find_student",
        "sql": sql,
        "params": [teacher_id, *params],
        "selected_fields": [
            "student_id",
            "full_name",
            "sex",
            "age",
            "grade_level",
            "section_name",
            "school_name",
        ],
    }


def build_get_student_latest_bmi_query(intent_result: dict[str, Any]) -> dict[str, Any]:
    """
    Build the SQL and parameters for the `get_student_latest_bmi` intent.

    Expected entities:
    - student_id: optional numeric identifier
    - student_name: optional person-name text
    - bmi_scope: 'latest_bmi'
    """
    teacher_id = _require_teacher_id(intent_result)
    entities = intent_result.get("entities", {})
    where_clauses, params = _build_student_lookup_filters(entities)

    sql = f"""
SELECT
    student_id,
    CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name,
    section_name,
    latest_bmi_value,
    latest_bmi_status,
    latest_measurement_date
FROM (
    SELECT
        student_id,
        first_name,
        middle_name,
        last_name,
        section_name,
        JSON_UNQUOTE(
            JSON_EXTRACT(bmi, CONCAT('$[', JSON_LENGTH(bmi) - 1, ']'))
        ) AS latest_bmi_value,
        JSON_UNQUOTE(
            JSON_EXTRACT(bmi_measurement, CONCAT('$[', JSON_LENGTH(bmi_measurement) - 1, ']'))
        ) AS latest_bmi_status,
        CASE
            WHEN measurement_date IS NOT NULL
             AND COALESCE(JSON_LENGTH(measurement_date), 0) > 0
            THEN JSON_UNQUOTE(
                JSON_EXTRACT(
                    measurement_date,
                    CONCAT('$[', JSON_LENGTH(measurement_date) - 1, ']')
                )
            )
            ELSE NULL
        END AS latest_measurement_date
    FROM {TABLE_NAME}
    WHERE teacher_id = %s
      AND bmi IS NOT NULL
      AND COALESCE(JSON_LENGTH(bmi), 0) > 0
      AND bmi_measurement IS NOT NULL
      AND COALESCE(JSON_LENGTH(bmi_measurement), 0) > 0
) AS latest_student_bmi
WHERE {" AND ".join(where_clauses)}
ORDER BY last_name, first_name;
""".strip()

    return {
        "intent": "get_student_latest_bmi",
        "sql": sql,
        "params": [teacher_id, *params],
        "selected_fields": [
            "student_id",
            "full_name",
            "section_name",
            "latest_bmi_value",
            "latest_bmi_status",
            "latest_measurement_date",
        ],
    }


def build_get_student_bmi_history_query(intent_result: dict[str, Any]) -> dict[str, Any]:
    """
    Build the SQL and parameters for the `get_student_bmi_history` intent.

    Expected entities:
    - student_id: optional numeric identifier
    - student_name: optional person-name text
    - history_scope: 'bmi_history'
    """
    teacher_id = _require_teacher_id(intent_result)
    entities = intent_result.get("entities", {})
    where_clauses, params = _build_student_lookup_filters(entities)

    sql = f"""
SELECT
    students.student_id,
    CONCAT_WS(' ', students.first_name, students.middle_name, students.last_name) AS full_name,
    students.section_name,
    bmi_history.bmi_value,
    JSON_UNQUOTE(
        JSON_EXTRACT(students.bmi_measurement, CONCAT('$[', bmi_history.record_ordinal - 1, ']'))
    ) AS bmi_status,
    CASE
        WHEN students.measurement_date IS NOT NULL
         AND COALESCE(JSON_LENGTH(students.measurement_date), 0) >= bmi_history.record_ordinal
        THEN JSON_UNQUOTE(
            JSON_EXTRACT(
                students.measurement_date,
                CONCAT('$[', bmi_history.record_ordinal - 1, ']')
            )
        )
        ELSE NULL
    END AS measurement_date
FROM {TABLE_NAME} AS students
INNER JOIN JSON_TABLE(
    students.bmi,
    '$[*]' COLUMNS (
        record_ordinal FOR ORDINALITY,
        bmi_value VARCHAR(50) PATH '$'
    )
) AS bmi_history
WHERE {" AND ".join(where_clauses)}
  AND students.teacher_id = %s
  AND students.bmi IS NOT NULL
  AND COALESCE(JSON_LENGTH(students.bmi), 0) > 0
ORDER BY
    CASE
        WHEN students.measurement_date IS NOT NULL
         AND COALESCE(JSON_LENGTH(students.measurement_date), 0) >= bmi_history.record_ordinal
         AND JSON_UNQUOTE(
            JSON_EXTRACT(
                students.measurement_date,
                CONCAT('$[', bmi_history.record_ordinal - 1, ']')
            )
        ) IS NOT NULL
        THEN 0
        ELSE 1
    END ASC,
    CASE
        WHEN students.measurement_date IS NOT NULL
         AND COALESCE(JSON_LENGTH(students.measurement_date), 0) >= bmi_history.record_ordinal
        THEN JSON_UNQUOTE(
            JSON_EXTRACT(
                students.measurement_date,
                CONCAT('$[', bmi_history.record_ordinal - 1, ']')
            )
        )
        ELSE NULL
    END ASC,
    bmi_history.record_ordinal ASC;
""".strip()

    return {
        "intent": "get_student_bmi_history",
        "sql": sql,
        "params": [*params, teacher_id],
        "selected_fields": [
            "student_id",
            "full_name",
            "section_name",
            "bmi_value",
            "bmi_status",
            "measurement_date",
        ],
    }


def build_summarise_section_nutrition_status_query(intent_result: dict[str, Any]) -> dict[str, Any]:
    """
    Build the SQL and parameters for the `summarise_section_nutrition_status` intent.

    Expected entities:
    - section: required, e.g. 'Section A'
    - summary_scope: 'nutrition_status_breakdown'
    """
    teacher_id = _require_teacher_id(intent_result)
    entities = intent_result.get("entities", {})
    where_clauses, params = _build_section_filter(entities)

    sql = f"""
SELECT
    section_name,
    COUNT(*) AS total_students,
    SUM(CASE WHEN latest_bmi_status = 'underweight' THEN 1 ELSE 0 END) AS underweight_count,
    SUM(CASE WHEN latest_bmi_status = 'normal' THEN 1 ELSE 0 END) AS normal_count,
    SUM(CASE WHEN latest_bmi_status = 'overweight' THEN 1 ELSE 0 END) AS overweight_count
FROM (
    SELECT
        student_id,
        section_name,
        section_id,
        CASE
            WHEN bmi_measurement IS NOT NULL
             AND COALESCE(JSON_LENGTH(bmi_measurement), 0) > 0
            THEN JSON_UNQUOTE(
                JSON_EXTRACT(
                    bmi_measurement,
                    CONCAT('$[', JSON_LENGTH(bmi_measurement) - 1, ']')
                )
            )
            ELSE NULL
        END AS latest_bmi_status
    FROM {TABLE_NAME}
    WHERE teacher_id = %s
) AS section_nutrition
WHERE {" AND ".join(where_clauses)}
GROUP BY section_name;
""".strip()

    return {
        "intent": "summarise_section_nutrition_status",
        "sql": sql,
        "params": [teacher_id, *params],
        "selected_fields": [
            "section_name",
            "total_students",
            "underweight_count",
            "normal_count",
            "overweight_count",
        ],
    }


def build_list_students_missing_recent_measurement_query(
    intent_result: dict[str, Any]
) -> dict[str, Any]:
    """
    Build the SQL and parameters for the `list_students_missing_recent_measurement` intent.

    Expected entities:
    - section: optional, e.g. 'Section A'
    - measurement_scope: 'missing_recent_measurement'

    Current v1 interpretation:
    - a student is missing a recent measurement if they have no latest measurement date,
      no latest BMI value, or their latest measurement is older than the start of the
      previous month. This means the latest measurement must fall within either the
      current month or the immediately previous month.
    """
    teacher_id = _require_teacher_id(intent_result)
    entities = intent_result.get("entities", {})
    parsed_measurement_date = _build_measurement_date_parse_expression("latest_measurement_date")
    where_clauses = [
        "("
        "latest_measurement_date IS NULL "
        "OR latest_bmi_value IS NULL "
        f"OR {parsed_measurement_date} IS NULL "
        f"OR {parsed_measurement_date} < DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')"
        ")"
    ]
    params: list[Any] = [teacher_id]

    section_clauses, section_params = _build_optional_section_filter(entities)
    where_clauses.extend(section_clauses)
    params.extend(section_params)

    sql = f"""
SELECT
    student_id,
    CONCAT_WS(' ', first_name, middle_name, last_name) AS full_name,
    sex,
    grade_level,
    section_name,
    latest_bmi_value,
    latest_measurement_date
FROM (
    SELECT
        student_id,
        first_name,
        middle_name,
        last_name,
        sex,
        grade_level,
        section_name,
        section_id,
        CASE
            WHEN bmi IS NOT NULL
             AND COALESCE(JSON_LENGTH(bmi), 0) > 0
            THEN JSON_UNQUOTE(
                JSON_EXTRACT(
                    bmi,
                    CONCAT('$[', JSON_LENGTH(bmi) - 1, ']')
                )
            )
            ELSE NULL
        END AS latest_bmi_value,
        CASE
            WHEN measurement_date IS NOT NULL
             AND COALESCE(JSON_LENGTH(measurement_date), 0) > 0
            THEN JSON_UNQUOTE(
                JSON_EXTRACT(
                    measurement_date,
                    CONCAT('$[', JSON_LENGTH(measurement_date) - 1, ']')
                )
            )
            ELSE NULL
        END AS latest_measurement_date
    FROM {TABLE_NAME}
    WHERE teacher_id = %s
) AS student_measurement_status
WHERE {" AND ".join(where_clauses)}
ORDER BY section_name, last_name, first_name;
""".strip()

    return {
        "intent": "list_students_missing_recent_measurement",
        "sql": sql,
        "params": params,
        "selected_fields": [
            "student_id",
            "full_name",
            "sex",
            "grade_level",
            "section_name",
            "latest_bmi_value",
            "latest_measurement_date",
        ],
    }


def build_show_nutribot_capabilities_response(intent_result: dict[str, Any]) -> dict[str, Any]:
    """
    Return grouped sample prompts describing what NutriBot can currently do.
    """
    return {
        "intent": "show_nutribot_capabilities",
        "response_type": "capabilities",
        "title": "Here are sample questions you can ask NutriBot:",
        "capabilities": CAPABILITY_EXAMPLES,
    }




QUERY_BUILDERS = {
    "list_at_risk_students": build_list_at_risk_students_query,
    "count_at_risk_students": build_count_at_risk_students_query,
    "list_students_by_bmi_category": build_list_students_by_bmi_category_query,
    "list_at_risk_recently_absent_students": build_list_at_risk_recently_absent_students_query,
    "find_student": build_find_student_query,
    "get_student_latest_bmi": build_get_student_latest_bmi_query,
    "get_student_bmi_history": build_get_student_bmi_history_query,
    "summarise_section_nutrition_status": build_summarise_section_nutrition_status_query,
    "list_students_missing_recent_measurement": build_list_students_missing_recent_measurement_query,
    "show_nutribot_capabilities": build_show_nutribot_capabilities_response,
}


def build_query(intent_result: dict[str, Any]) -> dict[str, Any] | None:
    """
    Dispatch intent results to the matching SQL builder.
    """
    if not intent_result.get("matched"):
        return None

    builder = QUERY_BUILDERS.get(intent_result.get("intent"))
    if builder is None:
        return None

    return builder(intent_result)


def response(intent_result: dict[str, Any]) -> dict[str, Any] | None:
    """
    Temporary response-layer entry point used by main.py during development.
    """
    query_payload = build_query(intent_result)

    if query_payload is None:
        if not intent_result.get("matched"):
            print("No SQL query generated because no intent was matched.")
        else:
            print(f"No SQL builder implemented yet for intent: {intent_result.get('intent')}")
        return None

    # print("SQL query:")
    # print(query_payload["sql"])
    # print("Query params:")
    # print(query_payload["params"])
    # print(query_payload)

    return query_payload
