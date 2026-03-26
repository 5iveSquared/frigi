import json
from typing import Any

import redis.asyncio as redis


class CacheService:
    def __init__(self, pool: redis.Redis):
        self.redis = pool

    async def get(self, key: str) -> Any | None:
        raw = await self.redis.get(key)
        if raw is None:
            return None
        return json.loads(raw)

    async def set(self, key: str, value: Any, ttl: int = 300) -> None:
        await self.redis.setex(key, ttl, json.dumps(value))

    async def delete(self, key: str) -> None:
        await self.redis.delete(key)

    async def exists(self, key: str) -> bool:
        return bool(await self.redis.exists(key))
