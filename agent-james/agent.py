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

async def ai_infra_agent():

    company_info_mcp_server = MCPServerSse(params={
                             "url": "http://localhost:8001/sse",
                            }, cache_tools_list=True)


    async with company_info_mcp_server:
           
            agent = Agent(
                name="Agent James",
                model="gpt-4.1",
                instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
                            You are a personal assistant agent
                            you job is to look at a meeting transcript and do this - 
                            1. find new issues to be created created, for each issue find the project it belongs to
                            2. find new features to be implemented, for each feature find the project it belongs to
                            3. find new ideas to be implemented, for each idea find the project it belongs to

                            once have list of ideas, features and issues go and create them using the tools provided to you
                """,
                mcp_servers=[company_info_mcp_server],               
            )
           

            result = await Runner.run(agent, 
            """
               give me list of all company projects
               ....
               
            # """, max_turns=20)
          
            print(result.final_output)


if __name__ == "__main__":
    asyncio.run(ai_infra_agent())