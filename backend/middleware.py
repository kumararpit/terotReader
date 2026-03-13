import time
import uuid
import logging
from fastapi import Request
from services.logger import set_request_id

# Get the logger from the setup
logger = logging.getLogger("app")

async def log_requests_middleware(request: Request, call_next):
    """Log every incoming request and its response details."""
    request_id = str(uuid.uuid4())[:8]
    set_request_id(request_id)
    start_time = time.time()


    # Attach request_id to request state for use inside routes
    request.state.request_id = request_id

    # Filter out health checks and favicon from heavy logging if desired, 
    # but for now, we log everything per user request.
    logger.info(
        f"[{request_id}] ➜ {request.method} {request.url.path} "
        f"| IP: {request.client.host} "
        f"| UA: {request.headers.get('user-agent', 'unknown')[:50]}"
    )

    try:
        response = await call_next(request)
    except Exception as exc:
        duration = round((time.time() - start_time) * 1000, 2)
        logger.error(
            f"[{request_id}] ✗ {request.method} {request.url.path} "
            f"| FAILED after {duration}ms | Error: {exc}",
            exc_info=True,
        )
        raise

    duration = round((time.time() - start_time) * 1000, 2)
    level = logging.WARNING if duration > 1000 else logging.INFO

    logger.log(
        level,
        f"[{request_id}] ✓ {request.method} {request.url.path} "
        f"| Status: {response.status_code} | {duration}ms"
        + (" ⚠ SLOW REQUEST" if duration > 1000 else ""),
    )

    response.headers["X-Request-ID"] = request_id
    return response
