from agents import Agent, Runner
from agents import Agent, FunctionTool, RunContextWrapper, function_tool
from typing_extensions import TypedDict, Any


@function_tool  
async def fetch_weather(location: str) -> str:
    
    """Fetch the weather for a given location.

    Args:
        location: The location to fetch the weather for.
    """
    print("fetching weather for", location)
    # In real life, we'd fetch the weather from a weather API
    return "sunny"


agent = Agent(name="Assistant",
  model="gpt-4o-mini",
 instructions="You are a grumpy assistant",
 tools=[fetch_weather])

result = Runner.run_sync(agent, "what is the weather in cscd")
print(result.final_output)
