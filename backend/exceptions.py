import logging
from fastapi import Request
from fastapi.responses import JSONResponse

# Get the logger from the setup
logger = logging.getLogger("app")

async def global_exception_handler(request: Request, exc: Exception):
    """Catch all unhandled exceptions and log with full traceback."""
    request_id = getattr(request.state, "request_id", "unknown")

    logger.error(
        f"[{request_id}] Unhandled exception | "
        f"{request.method} {request.url.path}",
        exc_info=True,
        extra={
            "request_id": request_id,
            "url": str(request.url),
            "method": request.method,
        },
    )

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": request_id},
    )
