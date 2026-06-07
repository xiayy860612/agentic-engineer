from app.config import Settings, resolve_env_files


def test_resolve_env_files_returns_empty_when_no_files(tmp_path, monkeypatch):
    monkeypatch.setattr("app.config._SERVICE_ROOT", tmp_path)
    assert resolve_env_files() == ()


def test_resolve_env_files_includes_existing_files(tmp_path, monkeypatch):
    monkeypatch.setattr("app.config._SERVICE_ROOT", tmp_path)
    (tmp_path / ".env").write_text("BIZ_JWKS_URL=http://from-env\n", encoding="utf-8")
    assert resolve_env_files() == (str(tmp_path / ".env"),)

    (tmp_path / ".env.local").write_text("BIZ_JWKS_URL=http://from-local\n", encoding="utf-8")
    assert resolve_env_files() == (
        str(tmp_path / ".env"),
        str(tmp_path / ".env.local"),
    )


def test_env_local_overrides_env(tmp_path, monkeypatch):
    monkeypatch.delenv("BIZ_JWKS_URL", raising=False)
    (tmp_path / ".env").write_text(
        "BIZ_JWKS_URL=http://from-env\nBIZ_CORS_ORIGINS=http://localhost:3000\n",
        encoding="utf-8",
    )
    (tmp_path / ".env.local").write_text("BIZ_JWKS_URL=http://from-local\n", encoding="utf-8")

    settings = Settings(
        _env_file=(str(tmp_path / ".env"), str(tmp_path / ".env.local")),
    )
    assert settings.biz_jwks_url == "http://from-local"


def test_os_env_overrides_env_files(tmp_path, monkeypatch):
    (tmp_path / ".env").write_text("BIZ_JWKS_URL=http://from-env\n", encoding="utf-8")
    (tmp_path / ".env.local").write_text("BIZ_JWKS_URL=http://from-local\n", encoding="utf-8")
    monkeypatch.setenv("BIZ_JWKS_URL", "http://from-os")

    settings = Settings(
        _env_file=(str(tmp_path / ".env"), str(tmp_path / ".env.local")),
    )
    assert settings.biz_jwks_url == "http://from-os"
