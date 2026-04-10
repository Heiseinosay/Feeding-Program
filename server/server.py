import os
from datetime import timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    get_jwt_identity,
    jwt_required,
    set_refresh_cookies,
    unset_jwt_cookies,
)

from dbutils import connect_to_db
from auth import f_auth_login, f_me, f_auth_first_update_password, f_auth_update_user_information
from students import f_get_all_students, f_add_students, f_add_students_attendance, f_delete_student, f_update_bmi_measurement, f_update_student_information, f_get_student_attendance, f_update_student_measurement_targeted, f_get_all_student_attendance
from section import f_add_section, f_get_all_section, f_delete_section, f_update_section
from session import f_get_all_session, f_add_session, f_set_cancel_session, f_set_complete_session, f_delete_session, f_update_session_information, f_get_nearest_upcoming_session, f_get_total_completed_session
from charts import f_get_all_status_count, f_get_bmi_trend, nutribot_database
from nutribot_intent import prompt_message

# to run python -m flask run

app = Flask(__name__)
# ACCESS TOKEN 
# In production, set via env var
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-me")

# Access token is always short-lived
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=15)

# Access tokens come from headers; refresh tokens are read from cookies explicitly
app.config["JWT_TOKEN_LOCATION"] = ["headers"]

# LOCAL DEV cookies over HTTP
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"  # Local dev friendly. In Netlify+Render later -> "None"
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # keep simple for now

# CORS(app, resources={r"/auth_login": {"origins": "http://localhost:3000"}})
# TODO: CHANGE EVER AND POINT TO START WITH "/api/"
CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True,
)

# Initialize JWT extension
jwt = JWTManager(app)


#** DEPLOYMENT TEST ==================================================================
@app.get("/api/health")
def health_check():
    return jsonify({
        "status": True,
        "message": "Server is running"
    }), 200


#** AUTHENTICATION WITH JWT ==================================================================
@app.route("/api/auth_login", methods=["POST"])
def auth_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    remember = bool(data.get("remember", False))

     # **Note:Fourth argument is for a check if the request comes from f_auth_first_update_password
    res = f_auth_login(email, password, remember, False)
    # print(res)
    return res


@app.post("/api/auth/refresh")
@jwt_required(refresh=True, locations=["cookies"])  # requires refresh token cookie
def refresh():
    identity = get_jwt_identity()
    new_access = create_access_token(identity=identity)
    return jsonify({"access_token": new_access}), 200


@app.get("/api/me")
@jwt_required(locations=["headers"])  # requires access token in Authorization header
def me():
    print("here at /api/me")
    identity = get_jwt_identity()
    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return jsonify({"status": False, "message": "Invalid token identity"}), 422

    # Replace with real DB lookup by user_id
    return f_me(user_id)


@app.post("/api/auth/logout")
def logout():
    resp = jsonify({"status": True})
    unset_jwt_cookies(resp)
    return resp, 200

# Update Password for the first time
@app.route("/api/auth_first_update_password", methods=["POST"])
def auth_first_update_password():
    data = request.json
    res = f_auth_first_update_password(data)
    print(res)
    print("f_auth_first_update_password here 5")
    return jsonify(res)


# Update user inforrmation
@app.route("/api/auth_update_user_information", methods=["POST"])
def auth_update_user_information():
    data = request.json
    res = f_auth_update_user_information(data)
    print(res)
    return jsonify(res)





#** SECTION PROCESS ==================================================================
# Add students 
@app.route("/api/add_section", methods=["POST"])
def add_section():
    data = request.json
    res = f_add_section(data)
    print(res)
    return res

# Fetch all Section
@app.route("/api/get_all_section", methods=["GET"])
def get_all_section():
    user_id = request.args.get("userId")
    res = f_get_all_section({"userId": user_id})
    # print(res)
    return jsonify(res)


# Update Section information
@app.route("/api/update_section", methods=["POST"])
def update_section():
    data = request.json
    res = f_update_section(data)
    print(res)
    return jsonify(res)


# Delete Section    
@app.route("/api/delete_section", methods=["DELETE"])
def delete_section():
    data = request.json
    res = f_delete_section(data)
    print(res)
    return jsonify(res)



#** STUDENT PROCESS ==================================================================
# Fetch all students
@app.route("/api/get_all_students", methods=["GET"])
def get_all_students():
    user_id = request.args.get("userId")
    res = f_get_all_students(user_id)
    print(res)
    return res


# Add students 
@app.route("/api/add_students", methods=["POST"])
def add_students():
    data = request.json
    res = f_add_students(data)
    # print(res)
    return jsonify(res)


# Add students 
@app.route("/api/add_students_attendance", methods=["POST"])
def add_students_attendance():
    data = request.json
    res = f_add_students_attendance(data)
    # print(res)
    return jsonify(res)


# Delete Student     
@app.route("/api/delete_student", methods=["DELETE"])
def delete_student():
    data = request.json
    res = f_delete_student(data)
    print(res)
    return jsonify(res)


# Update Students BMI
@app.route("/api/update_quick_bmi_measurement", methods=["POST"])
def update_bmi_measurement():
    data = request.json
    res = f_update_bmi_measurement(data)
    print(res)
    return jsonify(res)


# Update Students information
@app.route("/api/update_student_information", methods=["POST"])
def update_student_information():
    data = request.json
    res = f_update_student_information(data)
    print(res)
    return jsonify(res)


# Fetch specific students attendance
@app.route("/api/get_student_attendance", methods=["GET"])
def get_student_attendance():
    student_id = request.args.get("studentId")
    res = f_get_student_attendance(student_id)
    print(res)
    return res


# Fetch all students attendance
@app.route("/api/get_all_student_attendance", methods=["GET"])
def get_all_student_attendance():
    user_id = request.args.get("userId")
    res = f_get_all_student_attendance(user_id)
    print(res)
    return res


# Update Students information
@app.route("/api/update_student_measurement_targeted", methods=["POST"])
def update_student_measurement_targeted():
    data = request.json
    res = f_update_student_measurement_targeted(data)
    print(res)
    return jsonify(res)




#** SESSION PROCESS ==================================================================
# Fetch all session
@app.route("/api/get_all_session", methods=["GET"])
def get_all_session():
    user_id = request.args.get("userId")
    res = f_get_all_session(user_id)
    print(res)
    return res


# Add Session
@app.route("/api/add_session", methods=["POST"])
def add_session():
    data = request.json
    res = f_add_session(data)
    print(res)
    return jsonify(res)


# Cancel Session
@app.route("/api/set_cancel_session", methods=["POST"])
def set_cancel_session():
    data = request.json
    res = f_set_cancel_session(data)
    print(res)
    return jsonify(res)


# Complete Session
@app.route("/api/set_complete_session", methods=["POST"])
def set_complete_session():
    data = request.json
    res = f_set_complete_session(data)
    print(res)
    return jsonify(res)


# Delete Session 
@app.route("/api/delete_session", methods=["DELETE"])
def delete_session():
    data = request.json
    res = f_delete_session(data)
    print(res)
    return jsonify(res)


# Update Session
@app.route("/api/update_session_information", methods=["POST"])
def update_session_information():
    data = request.json
    res = f_update_session_information(data)
    print(res)
    return jsonify(res)


# Fetch all nearest session
@app.route("/api/get_nearest_upcoming_session", methods=["GET"])
def get_nearest_upcoming_session():
    user_id = request.args.get("userId")
    res = f_get_nearest_upcoming_session(user_id)
    print(res)
    return res


# Fetch total completed session
@app.route("/api/get_total_completed_session", methods=["GET"])
def get_total_completed_session():
    user_id = request.args.get("userId")
    res = f_get_total_completed_session(user_id)
    print(res)
    return res



#** ANALYSIS  ==================================================================
# Fetch all aggreggated total students by status
@app.route("/api/get_all_status_count", methods=["GET"])
def get_all_status_count():
    user_id = request.args.get("userId")
    res = f_get_all_status_count(user_id)
    print(res)
    return res


# Fetch line chart bmi trend  
@app.route("/api/get_bmi_trend", methods=["GET"])
def get_bmi_trend():
    user_id = request.args.get("userId")
    res = f_get_bmi_trend(user_id)
    print(res)
    return res


##* AI BOT ==================================================================
# SEND MESSAGE
@app.route("/api/nutribot_send", methods=["GET"])
def get_nutribot_send():
    prompt = request.args.get("message", "")
    teacher_id = request.args.get("teacherId")
    if teacher_id is None or not str(teacher_id).strip().isdigit():
        return {
            "status": False,
            "message": "Unable to identify the current teacher for this NutriBot request.",
        }

    query_payload = prompt_message(prompt, teacher_id=teacher_id)
    if query_payload is None:
        return {
            "status": False,
            "message": "Sorry, I did not understand that request. Try asking about at-risk students, BMI history, or type 'What can you do?'",
        }

    if query_payload['intent'] == "show_nutribot_capabilities":
        return {
            "intent": query_payload['intent'],
            "status": True,
            "message": query_payload['capabilities']
        }

    res = nutribot_database(query_payload)

    return {
        "intent": query_payload['intent'],
        "status": res.get("status", False),
        "res": res,
    } or {}




if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


