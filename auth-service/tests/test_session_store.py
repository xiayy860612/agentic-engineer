from app.session_store import InMemorySessionStore


def test_session_expires(monkeypatch) -> None:
    clock = {"t": 0.0}
    monkeypatch.setattr("app.session_store.time.monotonic", lambda: clock["t"])
    store = InMemorySessionStore(60)
    token = store.create(1, "user1")
    clock["t"] = 61.0
    assert store.get(token) is None


def test_delete_none_token() -> None:
    store = InMemorySessionStore(60)
    store.delete(None)


def test_get_none_token() -> None:
    store = InMemorySessionStore(60)
    assert store.get(None) is None


def test_get_unknown_token() -> None:
    store = InMemorySessionStore(60)
    assert store.get("totally-unknown") is None


def test_delete_existing_token(monkeypatch) -> None:
    clock = {"t": 0.0}
    monkeypatch.setattr("app.session_store.time.monotonic", lambda: clock["t"])
    store = InMemorySessionStore(600)
    token = store.create(1, "u")
    store.delete(token)
    assert store.get(token) is None
