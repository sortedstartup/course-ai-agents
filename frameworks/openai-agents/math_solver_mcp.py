from agents import Agent, Runner
from agents import Agent, FunctionTool, RunContextWrapper, function_tool
from agents.mcp import MCPServerSse, MCPServerStreamableHttp
from typing_extensions import TypedDict, Any
import asyncio


async def run_math_solver():
    async with MCPServerStreamableHttp(params={
                             "url": "http://localhost:3000/mcp",
                            }) as mcp_server:
        agent = Agent(
            name="Math Solver",
            model="gpt-4o-mini",
            instructions="You are a helpful math assistant. Use the available functions to solve mathematical problems.",
            mcp_servers=[mcp_server]
        )
        
        result = await Runner.run(agent, "What is 234234 + 27234 - 2342*34234 + 23432/23 ?")
        print(result.final_output)


if __name__ == "__main__":
    asyncio.run(run_math_solver())
