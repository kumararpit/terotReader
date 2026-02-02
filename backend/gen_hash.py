from passlib.context import CryptContext
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    print(pwd_context.hash("admin123"))
except ImportError:
    print("ERROR: passlib not found")
