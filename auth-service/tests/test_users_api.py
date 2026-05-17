from app.database import seed_roles_and_admin


def test_list_users_requires_admin(client):
    seed_roles_and_admin()
    res = client.get("/api/v1/users")
    assert res.status_code == 401


def test_list_users_as_admin(client):
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    res = client.get("/api/v1/users")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["username"] == "admin"


def test_create_user(client):
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    res = client.post(
        "/api/v1/users",
        json={"username": "alice", "password": "pass123", "role": "user"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["username"] == "alice"
    assert data["role"] == "user"
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data
    assert "password_hash" not in data


def test_create_user_duplicate_username(client):
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    client.post(
        "/api/v1/users",
        json={"username": "alice", "password": "pass123", "role": "user"},
    )
    res = client.post(
        "/api/v1/users",
        json={"username": "alice", "password": "pass456", "role": "admin"},
    )
    assert res.status_code == 409
    assert res.json()["detail"] == "用户名已存在"


def test_create_user_invalid_role(client):
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    res = client.post(
        "/api/v1/users",
        json={"username": "eve", "password": "pass123", "role": "superadmin"},
    )
    assert res.status_code == 422


def test_update_user_role(client):
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    create_res = client.post(
        "/api/v1/users",
        json={"username": "bob", "password": "pass123", "role": "user"},
    )
    user_id = create_res.json()["id"]

    res = client.put(
        f"/api/v1/users/{user_id}",
        json={"role": "admin"},
    )
    assert res.status_code == 200
    assert res.json()["role"] == "admin"


def test_update_user_is_active(client):
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    create_res = client.post(
        "/api/v1/users",
        json={"username": "charlie", "password": "pass123", "role": "user"},
    )
    user_id = create_res.json()["id"]

    res = client.put(
        f"/api/v1/users/{user_id}",
        json={"is_active": False},
    )
    assert res.status_code == 200
    assert res.json()["is_active"] is False


def test_admin_cannot_edit_self(client):
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    session_res = client.get("/api/v1/auth/session")
    admin_username = session_res.json()["username"]

    list_res = client.get("/api/v1/users")
    admin_user = next(u for u in list_res.json() if u["username"] == admin_username)

    res = client.put(
        f"/api/v1/users/{admin_user['id']}",
        json={"role": "user"},
    )
    assert res.status_code == 403
    assert res.json()["detail"] == "不能编辑自己的账户"


def test_update_nonexistent_user_returns_404(client):
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    res = client.put("/api/v1/users/99999", json={"role": "user"})
    assert res.status_code == 404


def test_get_user_not_found(client):
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    res = client.get("/api/v1/users/99999")
    assert res.status_code == 404


def test_get_user_single(client):
    """GET /api/v1/users/{id} returns a single user (line 81)."""
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    create_res = client.post(
        "/api/v1/users",
        json={"username": "bob", "password": "pass123", "role": "user"},
    )
    user_id = create_res.json()["id"]
    res = client.get(f"/api/v1/users/{user_id}")
    assert res.status_code == 200
    assert res.json()["username"] == "bob"


def test_update_user_role_to_different_role(client):
    """Updating a user's role exercises the role-reassignment branch in update_user."""
    seed_roles_and_admin()
    client.post(
        "/api/v1/auth/login",
        json={"username": "admin", "password": "admin_secret"},
    )
    # Create user as 'user'
    create_res = client.post(
        "/api/v1/users",
        json={"username": "charlie", "password": "pass123", "role": "user"},
    )
    user_id = create_res.json()["id"]

    # Update role to 'admin' — exercises lines 102-111
    res = client.put(
        f"/api/v1/users/{user_id}",
        json={"role": "admin"},
    )
    assert res.status_code == 200
    assert res.json()["role"] == "admin"