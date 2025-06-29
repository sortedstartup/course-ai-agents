from agents import Agent, Runner, handoff, input_guardrail, GuardrailFunctionOutput
from agents import Agent, FunctionTool, RunContextWrapper, function_tool
from agents import (
    Agent,
    GuardrailFunctionOutput,
    InputGuardrailTripwireTriggered,
    RunContextWrapper,
    Runner,
    TResponseInputItem,
    input_guardrail,
)
from agents.mcp import MCPServerSse, MCPServerStreamableHttp
from typing_extensions import TypedDict, Any
import asyncio
from agents import enable_verbose_stdout_logging
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX
from agents.extensions import handoff_filters
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

async def ai_james_agent():

    company_info_mcp_server = MCPServerSse(params={
                             "url": "http://localhost:8001/sse",
                            }, cache_tools_list=True)

    # GitHub MCP Server configuration - reading directly from environment
    github_mcp_server = MCPServerStreamableHttp(params={
        "url": "https://api.githubcopilot.com/mcp/",
        "headers": {
            "Authorization": f"Bearer {os.getenv('GITHUB_PERSONAL_ACCESS_TOKEN')}",
            "Content-Type": "application/json"
        }
    }, cache_tools_list=True)

    async with company_info_mcp_server, github_mcp_server:
           
            agent = Agent(
                name="Agent James",
                model="gpt-4o",
                instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
                            You are a personal assistant agent with access to company information and GitHub.
                            Your job is to look at a meeting notes and do this - 
                            1. find new issues to be created, for each issue find the project it belongs to
                            2. find new features to be implemented, for each feature find the project it belongs to
                            3. find new ideas to be implemented, for each idea find the project it belongs to
                            
                            Once you have a list of ideas, features and issues, create them using the appropriate tools:
                            - Issues - create a issue in respective repository
                            - Features and Ideas - create new GitHub wiki pages in the respective project repositories
                            - add reference links to issues, wiki pages if needed
                            Create mermaid diagrams to explain the feature
                """,
                mcp_servers=[company_info_mcp_server, github_mcp_server],               
            )
           

            result = await Runner.run(agent, 
            """
              Read meeting notes and take action based on the notes
  
            """, max_turns=20)
          
            print(result.final_output)


if __name__ == "__main__":
    asyncio.run(ai_james_agent())