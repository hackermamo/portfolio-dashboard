import bcrypt

password = "SuSMr.Md@4806295638"

# string → bytes
password_bytes = password.encode('utf-8')

# hash create karo
hashed_password = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))

print(hashed_password.decode())
