from app.security import hash_password, verify_password


def test_verify_password_mismatch() -> None:
    h = hash_password("secret")
    assert verify_password("wrong", h) is False


def test_verify_password_success() -> None:
    h = hash_password("ok")
    assert verify_password("ok", h) is True
