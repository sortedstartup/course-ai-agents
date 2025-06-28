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
from agents.mcp import MCPServerStdio, MCPServerStreamableHttp
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

async def ai_devops_agent():

    # AWS Cost Explorer MCP server
    aws_cost_explorer_mcp_server = MCPServerStdio(params={
        "command": "uvx",
        "args": ["awslabs.cost-analysis-mcp-server@latest"],
        "env": {
            "AWS_PROFILE": os.getenv("AWS_PROFILE", "default"),
            "AWS_REGION": os.getenv("AWS_REGION", "us-east-1"),
            "FASTMCP_LOG_LEVEL": "ERROR"
        }
    })

    async with aws_cost_explorer_mcp_server:
           
            agent = Agent(
                name="Agent Devops",
                model="gpt-4.1",
                instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
                You are a devops agent specialized in AWS infrastructure and cost optimization.
                You are an expert with Amazon Web Services and have access to AWS cost analysis tools.
                
                You have access to the AWS Cost Analysis MCP server which provides:
                - Pre-deployment cost estimates for AWS services
                - Cost analysis and optimization recommendations  
                - AWS pricing information and comparisons
                - Infrastructure cost planning and budgeting insights

                Based on given problems, suggest standard development designs and provide:
                1. AWS infrastructure architecture recommendations
                2. Detailed cost estimates for the proposed infrastructure
                3. Cost optimization strategies and alternatives
                4. Monthly/annual cost projections
                
                Always provide creative, cost-effective solutions that balance performance and budget.
                           
                """,
                mcp_servers=[aws_cost_explorer_mcp_server],               
            )
           

            result = await Runner.run(agent, 
            """
             I want to create a Java web application with the following requirements:
             - 4 replicas for high availability
             - Redis for caching
             - PostgreSQL database
             - Support for 1 million concurrent users
             - Deployment on AWS
             
             Please provide:
             1. A complete AWS architecture design
             2. Detailed monthly cost estimates
             3. Cost optimization recommendations
             4. Alternative cost-effective solutions
  
            """, max_turns=20)
          
            print(result.final_output)


if __name__ == "__main__":
    asyncio.run(ai_devops_agent())