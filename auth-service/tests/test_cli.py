import sys
from io import StringIO
from app.cli import main as cli_main


def test_cli_create_user_with_default_role(monkeypatch) -> None:
    monkeypatch.setenv("AUTH_DATABASE_URL", "sqlite:///:memory:")
    captured = StringIO()
    monkeypatch.setattr("sys.stdout", captured)
    rc = cli_main(["--username", "testuser", "--password", "testpass123"])
    assert rc == 0
    assert "Created user: testuser with roles: user" in captured.getvalue()


def test_cli_create_user_with_roles(monkeypatch) -> None:
    monkeypatch.setenv("AUTH_DATABASE_URL", "sqlite:///:memory:")
    captured = StringIO()
    monkeypatch.setattr("sys.stdout", captured)
    rc = cli_main(["--username", "admin1", "--password", "adminpass123", "--roles", "admin,user"])
    assert rc == 0
    assert "Created user: admin1 with roles: admin,user" in captured.getvalue()


def test_cli_create_user_idempotent(monkeypatch) -> None:
    monkeypatch.setenv("AUTH_DATABASE_URL", "sqlite:///:memory:")
    out_captured = StringIO()
    err_captured = StringIO()
    monkeypatch.setattr("sys.stdout", out_captured)
    monkeypatch.setattr("sys.stderr", err_captured)
    rc1 = cli_main(["--username", "alice2", "--password", "alicepass123"])
    assert rc1 == 0
    rc2 = cli_main(["--username", "alice2", "--password", "alicepass123"])
    assert rc2 == 1
    assert "already exists" in err_captured.getvalue()