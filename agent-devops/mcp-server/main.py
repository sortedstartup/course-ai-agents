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
import ast
import operator

mcp = FastMCP("Calculator MCP server")


# Supported operators
ops = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.Mod: operator.mod,
    ast.USub: operator.neg,
}

@mcp.tool()
def calculate(expression: str) -> str:
    """
    This is a calculator tool, it takes input as a mathematical expression and return the result.
    """
    # Supported operators
    ops = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
        ast.USub: operator.neg
    }

    def _eval(node):
        if isinstance(node, ast.Num):  # number
            return node.n
        elif isinstance(node, ast.UnaryOp):  # -3
            return ops[type(node.op)](_eval(node.operand))
        elif isinstance(node, ast.BinOp):  # 2 + 3
            return ops[type(node.op)](_eval(node.left), _eval(node.right))
        else:
            raise ValueError("Unsupported expression")

    try:
        parsed = ast.parse(expression, mode='eval').body
        result = _eval(parsed)
        return str(result)
    except Exception as e:
        return f"Error: {e}"

@mcp.tool()
def create_file(file_name: str, file_content: str) -> str:
    """
    This is a file creation tool, it takes a file name and file content as input and create a file with the given content.
    """
    with open(file_name, "w") as f:
        f.write(file_content)
    return f"File {file_name} created successfully"
        

app = FastAPI()
# app.mount("/mcp", mcp.streamable_http_app())
# if __name__ == "__main__":
#     uvicorn.run(app, host="127.0.0.1", port=8001)

if __name__ == "__main__":
    app.mount("/", mcp.sse_app())
    uvicorn.run(app, host="127.0.0.1", port=8001)
