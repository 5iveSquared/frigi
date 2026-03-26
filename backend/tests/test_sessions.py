import pytest


@pytest.mark.asyncio
async def test_create_session_requires_auth(client):
    response = await client.post("/sessions", json={"level_id": "test-level-id"})
    assert response.status_code == 403
