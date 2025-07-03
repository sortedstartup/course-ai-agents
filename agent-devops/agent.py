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
from agents.mcp import MCPServerSse

# Load environment variables from .env file
load_dotenv()

async def ai_devops_agent():

    # AWS Cost Explorer MCP server
    aws_cost_explorer_mcp_server = MCPServerStdio(params={
        "command": "uvx",
        "args": ["awslabs.cost-analysis-mcp-server@latest"],
    #     "env": {
    #     "FASTMCP_LOG_LEVEL": "ERROR",
    #     "AWS_PROFILE": "your-aws-profile"
    #   },
    #   "disabled": false,
    #   "autoApprove": []
    })

  
    # Calculator MCP server
    calculator_mcp_server = MCPServerSse(params={
                             "url": "http://127.0.0.1:8001/sse",
                            }, cache_tools_list=True)

    async with aws_cost_explorer_mcp_server, calculator_mcp_server:
           
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
                1. Detailed cost estimates for the proposed infrastructure
                2. Cost optimization strategies and alternatives
                3. Monthly/annual cost projections
                
                Always provide creative, cost-effective solutions that balance performance and budget.

                Write in markdown format
                Add mermaid diagrams to the file to explain the architecture.
                Add cost estimates in the file.
                Add cost optimization strategies and alternatives in the file.
                Add monthly/annual cost projections in the file.
                Add alternative cost-effective solutions in the file.
                
                You have calculator tool available to calculate the cost of the infrastructure.
                """,
                mcp_servers=[aws_cost_explorer_mcp_server, calculator_mcp_server],               
            )
           

            result = await Runner.run(agent, 
            """
             I want to create a Java web application with the following requirements:
             - 4 replicas for high availability
             - Redis for caching
             - PostgreSQL database
             - Support for 10000 concurrent users
             - Deployment on AWS
             
             Please provide:
             1. Detailed monthly cost estimates
             2. Cost optimization recommendations
             3. Alternative cost-effective solutions

             Save results in a file named <problem_description>.md
  
            """, max_turns=20)
          
            print(result.final_output)


if __name__ == "__main__":
    asyncio.run(ai_devops_agent())