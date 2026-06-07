def test_openapi_json_available(client):
    res = client.get("/openapi.json")
    assert res.status_code == 200
    schema = res.json()
    assert schema["info"]["title"] == "Agentic Biz"
    schemes = schema["components"]["securitySchemes"]
    assert set(schemes) == {"BearerAuth"}
    assert schemes["BearerAuth"]["scheme"] == "bearer"


def test_openapi_instruments_requires_bearer(client):
    schema = client.get("/openapi.json").json()
    operation = schema["paths"]["/api/v1/instruments"]["get"]
    assert {"BearerAuth": []} in operation["security"]


def test_openapi_health_is_public(client):
    schema = client.get("/openapi.json").json()
    operation = schema["paths"]["/health"]["get"]
    assert operation.get("security") in (None, [])


def test_swagger_ui_available(client):
    res = client.get("/docs")
    assert res.status_code == 200
    assert "swagger" in res.text.lower()
