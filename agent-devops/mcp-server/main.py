from mcp.server.fastmcp import FastMCP
import logging
import os
import asyncio
from fastapi import FastAPI
import uvicorn
from datetime import datetime
import time
import io
import sys

mcp = FastMCP("Company Info MCP server")


@mcp.tool()
def python_code_execution(code: str):
    """Execute Python code and return the output"""
    try:
        # Capture output
        old_stdout = sys.stdout
        sys.stdout = buffer = io.StringIO()
        
        # Execute code
        exec(code)
        
        # Get output
        output = buffer.getvalue()
        sys.stdout = old_stdout
        
        return {"success": True, "output": output}
        
    except Exception as e:
        sys.stdout = old_stdout
        return {"success": False, "error": str(e)}


app = FastAPI()
# app.mount("/mcp", mcp.streamable_http_app())
# if __name__ == "__main__":
#     uvicorn.run(app, host="127.0.0.1", port=8001)

if __name__ == "__main__":
    app.mount("/", mcp.sse_app())
    uvicorn.run(app, host="127.0.0.1", port=8001)
