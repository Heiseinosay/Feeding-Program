from datetime import timedelta
from dbutils import connect_to_db
from flask import jsonify
from mysql.connector import Error

from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    set_refresh_cookies,
)



# LOGIN
def f_auth_login(mail, password, remember, is_from_change_pwd):
    mysqldb, cursor = connect_to_db()
    try:
        read_query = (
            "SELECT teacher_id, first_name, last_name, email, Password, mobile_no, is_first_login "
            "FROM tblTeachers WHERE email = %s AND Password = %s"
        )
        cursor.execute(read_query, (mail, password))
        result = cursor.fetchone()
        print(result)

        if not result:
            return jsonify({
                "status": False,
                "message": "Invalid credentials"
            }), 200

        if (is_from_change_pwd):
            return jsonify({
                "status": True, 
                "message": "Credentials found"
            }), 200


        user = {
            "user_id": result[0],
            "mail": result[3],
            "is_first_login": result[6],
        }

        # Access token always short-lived
        access_token = create_access_token(identity=str(result[0]))

        # Refresh token lifetime depends on "remember me"
        refresh_expires = timedelta(days=30) if remember else timedelta(hours=8)

        refresh_token = create_refresh_token(
            identity=str(result[0]),
            expires_delta=refresh_expires,
        )

        resp = jsonify({
            "access_token": access_token,
            "user": user,
            "status": True,

        })

        # Stores refresh token in HttpOnly cookie
        set_refresh_cookies(resp, refresh_token)
        return resp, 200
            

    except Error as e:
        print(f"Error in login: {e}")
        return jsonify({
            "status": False,
            "message": "Server error"
        }), 500
    finally:
        mysqldb.close()


def f_me(user_id):
    mysqldb, cursor = connect_to_db()
    try:
        read_query = (
            "SELECT teacher_id, first_name, middle_name, last_name, email, mobile_no, is_first_login, school_name, created_at "
            "FROM tblTeachers WHERE teacher_id = %s"
        )
        cursor.execute(read_query, (user_id,))
        result = cursor.fetchone()
        print(result)

        if not result:
            return jsonify({
                "status": False,
                "message": "User not found"
            }), 404

        return jsonify({
            "status": True,
            "id": result[0],
            "first_name": result[1],
            "middle_name": result[2],
            "last_name": result[3],
            "email": result[4],
            "mobile_no": result[5],
            "is_first_login": result[6],
            "school_name": result[7],
            "created_at": result[8]
        }), 200

    except Error as e:
        print(f"Error in me: {e}")
        return jsonify({
            "status": False,
            "message": "Server error"
        }), 500
    finally:
        mysqldb.close()

        

# Change password
def f_auth_first_update_password(data):
    print("Im in f_auth_first_update_password!")
    uid = data.get("uid")
    email = data.get("email")
    current_password = data.get("currrentPassword")
    new_password = data.get("newPassword")

    # **Note:Fourth argument is for a check if the request comes from f_auth_first_update_password
    log_response = f_auth_login(email, current_password, False, True)
    if isinstance(log_response, tuple):
        log = log_response[0].get_json()
    else:
        log = log_response.get_json()
    print(log)
    if(log["status"] == False): 
        print("failed")
        # 1 = success, 2 = failed, 3 = wrong password
        return { 'status': 3 }

    print(uid, new_password)

    mysqldb, cursor = connect_to_db()
    try:
        update_query = "UPDATE tblTeachers SET Password=%s, is_first_login=0  WHERE teacher_id = %s"
        cursor.execute(update_query, (new_password, uid))
        mysqldb.commit()

        return { 'status': True }
    except Error as e:
        print(f"Error in updating: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()



def f_auth_update_user_information(data):
    mysqldb, cursor = connect_to_db()
    print("Im in f_auth_update_user_information!")
    first_name = data.get('firstName')
    middle_name = data.get('middleName')
    last_name = data.get('lastName')
    mobile_no = data.get('mobileNo')
    user_id = data.get('userId')

    print(user_id, first_name, middle_name, last_name, mobile_no)

    # return
    try:
    # UPDATE TASK
        update_query = """
            UPDATE tblTeachers 
            SET first_name=%s, middle_name=%s, last_name=%s, mobile_no=%s
            WHERE teacher_id=%s
        """
        cursor.execute(update_query, (first_name, middle_name, last_name, mobile_no, user_id))
        mysqldb.commit()
    
        return { 'status': True }
    except Error as e:
        print(f"Error in updating user information: {e}")
        return { 'status': False }
    finally:
        mysqldb.close()