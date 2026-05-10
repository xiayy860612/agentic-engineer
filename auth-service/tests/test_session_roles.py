from app.session_store import InMemorySessionStore


def test_session_record_has_roles() -> None:
    from app.session_store import _SessionRecord
    rec = _SessionRecord(user_id=1, username="u", expires_at=999, roles=["super_admin"])
    assert rec.roles == ["super_admin"]


def test_create_with_roles() -> None:
    store = InMemorySessionStore(600)
    token = store.create(user_id=1, username="u", roles=["super_admin"])
    rec = store.get(token)
    assert rec is not None
    assert rec.roles == ["super_admin"]


def test_create_without_roles() -> None:
    store = InMemorySessionStore(600)
    token = store.create(user_id=1, username="u", roles=[])
    rec = store.get(token)
    assert rec is not None
    assert rec.roles == []