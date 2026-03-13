import logging
import sys
import os
import json
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler

# Context variable to store request ID
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

def get_request_id() -> str:
    return request_id_ctx.get()

def set_request_id(request_id: str):
    return request_id_ctx.set(request_id)

def mask_pii(value: str, pii_type: str = "email") -> str:
    """Mask sensitive information for production logs."""
    if os.getenv("ENV") != "production":
        return value
    
    if not value:
        return ""
    
    if pii_type == "email":
        if "@" not in value: return "***"
        user, domain = value.split("@")
        return f"{user[:2]}***@{domain}"
    elif pii_type == "phone":
        return f"{value[:3]}***{value[-2:]}"
    return "***"



# Log level mapping
LOG_LEVEL = logging.DEBUG if os.getenv("ENV") == "development" else logging.INFO
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | [%(request_id)s] | %(name)s | %(funcName)s:%(lineno)d | %(message)s"
LOG_FILE = "logs/app.log"

class RequestIDFilter(logging.Filter):
    def filter(self, record):
        record.request_id = get_request_id()
        return True

class JSONFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": self.formatTime(record, "%Y-%m-%dT%H:%M:%S"),
            "level": record.levelname,
            "request_id": getattr(record, 'request_id', '-'),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "message": record.getMessage(),
        }
        if hasattr(record, "extra"):
            log_data.update(record.extra)
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

def setup_logger(name: str = "app") -> logging.Logger:
    """Configure and return a logger instance."""
    # Ensure logs directory exists relative to backend
    log_dir = os.path.dirname(os.path.abspath(LOG_FILE)) if os.path.isabs(LOG_FILE) else os.path.join(os.getcwd(), "logs")
    os.makedirs(log_dir, exist_ok=True)
    
    # Correct path if we are running from backend/
    actual_log_file = LOG_FILE if os.path.isabs(LOG_FILE) else os.path.join(os.getcwd(), LOG_FILE)

    logger = logging.getLogger(name)
    logger.setLevel(LOG_LEVEL)
    
    # Add RequestIDFilter
    logger.addFilter(RequestIDFilter())

    # Avoid duplicate handlers on reload
    if logger.handlers:
        return logger

    # Check if we should use JSON formatting (production)
    is_production = os.getenv("ENV") == "production"
    
    if is_production:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter(LOG_FORMAT)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Rotating file handler (10MB per file, keep 5 backups)
    file_handler = RotatingFileHandler(actual_log_file, maxBytes=10_000_000, backupCount=5)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger

# Default logger instance
logger = setup_logger()
