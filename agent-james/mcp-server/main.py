from mcp.server.fastmcp import FastMCP
import logging
import os
import asyncio
from fastapi import FastAPI
import uvicorn
from datetime import datetime
import time

mcp = FastMCP("Company Info MCP server")


@mcp.tool()
def get_projects():
    # Reutrn list of json
    # name and description of the project
    return [
        {
            "name": "Sorted Stream",
            "description": """
            This project has features similar to loom.
            User can record screen and audio and save to a file.
            Also upload existing recordings
            Browse recordings and play them back
            add comments to the recordings
            """
        },
        {
            "name": "Sorted Interview",
            "description": """
             This project is a learning tool.
             Users can prepare for interviews
             Users can choolse learning path
             go through topics and mark them as read
             System will remind users to review topics
             Based on forgetting curve, system will schedule reviews
            """
        },
        {
            "name": "Sorted Chat",
            "description": """
            Chat with multiple LLM models at once. 
            You can also upload files and have them analyzed by the LLM models
            Chat history is saved
            There are inbuild tools also available to use
            """
        }
        
    ]


app = FastAPI()
# app.mount("/mcp", mcp.streamable_http_app())
# if __name__ == "__main__":
#     uvicorn.run(app, host="127.0.0.1", port=8001)

if __name__ == "__main__":
    app.mount("/", mcp.sse_app())
    uvicorn.run(app, host="127.0.0.1", port=8001)
