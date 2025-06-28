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
            """,
            "repositoryUrl": "https://github.com/janakiramg/demo-stream"
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
            """,
            "repositoryUrl": "https://github.com/janakiramg/demo-sortedinterview"
        },
        {
            "name": "Sorted Chat",
            "description": """
            Chat with multiple LLM models at once. 
            You can also upload files and have them analyzed by the LLM models
            Chat history is saved
            There are inbuild tools also available to use
            """,
            "repositoryUrl": "https://github.com/janakiramg/demo-sortedchat"
        }
        
    ]

@mcp.tool()
def get_meeting_notes():
    return [
        {
            "title": "Meeting with Deepak",
            "notes": """
             Deepak: I think we should implement a new feature called tenant and user can create courses under tenant
             Janaki: Right, we can do that
             Deepak: We can add members to the tenant, add memebers to courses
             Janaki: Yes, good idea Deepak, once we add a member to tenant and gave access to course, then memeber can see videos in that course
             Janaki: Also we can delete video from course permissions to admin,in this case tenant creator
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
