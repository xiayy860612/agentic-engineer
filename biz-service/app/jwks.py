from __future__ import annotations

import json
import time
from datetime import UTC, datetime
from functools import lru_cache

import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError, PyJWKClientError

from app.config import get_settings

# #region agent log
_DEBUG_LOG_PATH = "/Users/amos/workspace/agentic-engineer/.cursor/debug-a483c6.log"


def _agent_debug_log(
    *,
    location: str,
    message: str,
    data: dict[str, object],
    hypothesis_id: str,
    run_id: str = "pre-fix",
) -> None:
    try:
        with open(_DEBUG_LOG_PATH, "a", encoding="utf-8") as log_file:
            log_file.write(
                json.dumps(
                    {
                        "sessionId": "a483c6",
                        "runId": run_id,
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


class SupabaseJwtVerifier:
    """Validate Supabase access tokens using the project's JWKS endpoint."""

    def __init__(self, jwks_url: str) -> None:
        self._jwks_client = PyJWKClient(jwks_url, cache_keys=True)

    def decode_access_token(self, token: str) -> dict[str, object]:
        # #region agent log
        now_ts = int(datetime.now(UTC).timestamp())
        unverified: dict[str, object] = {}
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
        except InvalidTokenError as exc:
            _agent_debug_log(
                location="jwks.py:decode_access_token",
                message="unverified decode failed",
                data={"errorType": type(exc).__name__, "nowTs": now_ts},
                hypothesis_id="H5",
            )
        else:
            exp = unverified.get("exp")
            _agent_debug_log(
                location="jwks.py:decode_access_token",
                message="token claims before verify",
                data={
                    "hasExp": isinstance(exp, (int, float)),
                    "exp": exp if isinstance(exp, (int, float)) else None,
                    "nowTs": now_ts,
                    "expiredByClock": isinstance(exp, (int, float)) and exp < now_ts,
                    "subPrefix": str(unverified.get("sub", ""))[:8],
                },
                hypothesis_id="H1,H2,H5",
            )
        # #endregion

        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
        except PyJWKClientError as exc:
            # #region agent log
            _agent_debug_log(
                location="jwks.py:decode_access_token",
                message="jwks signing key lookup failed",
                data={"errorType": type(exc).__name__},
                hypothesis_id="H5",
            )
            # #endregion
            raise InvalidTokenError(str(exc)) from exc

        algorithms = [signing_key.algorithm_name] if signing_key.algorithm_name else None
        decode_options = {
            "verify_exp": True,
            "require": ["exp", "sub", "aud"],
        }
        try:
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=algorithms,
                audience="authenticated",
                options=decode_options,
            )
        except InvalidTokenError as exc:
            # #region agent log
            _agent_debug_log(
                location="jwks.py:decode_access_token",
                message="verified decode rejected token",
                data={
                    "errorType": type(exc).__name__,
                    "nowTs": now_ts,
                    "hasExp": isinstance(unverified.get("exp"), (int, float)),
                    "exp": unverified.get("exp")
                    if isinstance(unverified.get("exp"), (int, float))
                    else None,
                },
                hypothesis_id="H1,H2,H5",
            )
            # #endregion
            raise
        # #region agent log
        _agent_debug_log(
            location="jwks.py:decode_access_token",
            message="verified decode accepted token",
            data={
                "nowTs": now_ts,
                "hasExp": isinstance(unverified.get("exp"), (int, float)),
                "exp": unverified.get("exp")
                if isinstance(unverified.get("exp"), (int, float))
                else None,
                "expiredByClock": isinstance(unverified.get("exp"), (int, float))
                and unverified.get("exp") < now_ts,
            },
            hypothesis_id="H1,H2,H5",
        )
        # #endregion
        return payload


@lru_cache
def get_jwt_verifier() -> SupabaseJwtVerifier:
    settings = get_settings()
    return SupabaseJwtVerifier(settings.biz_jwks_url)


def reset_jwt_verifier_for_tests() -> None:
    get_jwt_verifier.cache_clear()
