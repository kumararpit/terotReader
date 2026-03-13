from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import os
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

def verify_password(plain_password, hashed_password):
    """Verify a plain password against its hash."""
    logger.debug("Action=verify_password Status=started")
    try:
        is_match = hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password
        logger.debug(f"Action=verify_password Status=finished Match={is_match}")
        return is_match
    except Exception as e:
        logger.error(f"Action=verify_password Status=failed Error={str(e)}", exc_info=True)
        raise

def get_password_hash(password):
    """Generate a hash for a password."""
    logger.debug("Action=get_password_hash Status=started")
    try:
        hashed = hashlib.sha256(password.encode()).hexdigest()
        logger.debug("Action=get_password_hash Status=finished")
        return hashed
    except Exception as e:
        logger.error(f"Action=get_password_hash Status=failed Error={str(e)}", exc_info=True)
        raise

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a new JWT access token."""
    username = data.get("sub", "unknown")
    logger.info(f"Action=create_access_token Status=started User={username}")
    
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        
        logger.info(f"Action=create_access_token Status=finished User={username}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"Action=create_access_token Status=failed User={username} Error={str(e)}", exc_info=True)
        raise

