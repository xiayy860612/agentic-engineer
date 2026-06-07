from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError

from app.jwks import SupabaseJwtVerifier, get_jwt_verifier

# #region agent log
_DEBUG_LOG_PATH = "/Users/amos/workspace/agentic-engineer/.cursor/debug-a483c6.log"


def _agent_debug_log(
    *,
    location: str,
    message: str,
    data: dict[str, object],
    hypothesis_id: str,
) -> None:
    try:
        with open(_DEBUG_LOG_PATH, "a", encoding="utf-8") as log_file:
            log_file.write(
                json.dumps(
                    {
                        "sessionId": "a483c6",
                        "runId": "pre-fix",
                        "hypothesisId": hypothesis_id,
                        "location": location,
                        "message": message,
                        "data": data,
                        "timestamp": int(time.time() * 1000),
                    }
                )
                + "\n"
            )
    except OSError:
        pass


# #endregion

_bearer = HTTPBearer(
    auto_error=False,
    scheme_name="BearerAuth",
    description=(
        "Supabase access token with aud=authenticated. Obtain via Supabase Auth after user login."
    ),
)


@dataclass(frozen=True, slots=True)
class AuthUser:
    sub: str
    role: str
    email: str | None = None


def auth_user_from_payload(payload: dict[str, object]) -> AuthUser:
    sub = payload.get("sub")
    role = payload.get("role")
    if not isinstance(sub, str) or not sub:
        raise InvalidTokenError("missing sub claim")
    if not isinstance(role, str) or not role:
        raise InvalidTokenError("missing role claim")
    email = payload.get("email")
    return AuthUser(
        sub=sub,
        role=role,
        email=email if isinstance(email, str) else None,
    )


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    verifier: Annotated[SupabaseJwtVerifier, Depends(get_jwt_verifier)],
) -> AuthUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        # #region agent log
        _agent_debug_log(
            location="auth.py:get_current_user",
            message="missing or non-bearer credentials",
            data={"hasCredentials": credentials is not None},
            hypothesis_id="H3",
        )
        # #endregion
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="missing or invalid authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = verifier.decode_access_token(credentials.credentials)
        user = auth_user_from_payload(payload)
        # #region agent log
        _agent_debug_log(
            location="auth.py:get_current_user",
            message="auth succeeded",
            data={"subPrefix": user.sub[:8], "role": user.role},
            hypothesis_id="H3",
        )
        # #endregion
        return user
    except InvalidTokenError as exc:
        # #region agent log
        _agent_debug_log(
            location="auth.py:get_current_user",
            message="auth rejected token",
            data={"errorType": type(exc).__name__},
            hypothesis_id="H3,H5",
        )
        # #endregion
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
