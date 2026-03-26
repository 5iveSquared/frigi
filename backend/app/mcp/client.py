# MCP client placeholder — extend when integrating a dedicated MCP server
# Currently level generation uses OpenAI function calling directly (see level_generator.py)

class MCPClient:
    """Stub for future MCP server integration."""

    async def call_tool(self, tool_name: str, arguments: dict) -> dict:
        raise NotImplementedError("MCP server not yet configured")
