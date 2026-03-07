import smtplib

email = "underbumpbump@gmail.com"
receiver_email = input("Receiver Email: ")

subject = "Python Test Mail"
message = "Hi this is a python test mail. Please disregard. Thank you!"
text = f"Subject: {subject}\n\n{message}"

server = smtplib.SMTP("smtp.gmail.com", "587")
server.starttls()

server.login(email, "xavsstqurdilgkej") # xavs stqu rdil gkej
server.sendmail(email, receiver_email, text)

print("email has been sent to", receiver_email)