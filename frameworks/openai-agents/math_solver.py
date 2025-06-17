from agents import Agent, Runner
from agents import Agent, FunctionTool, RunContextWrapper, function_tool
from typing_extensions import TypedDict, Any


@function_tool  
async def add(a: float, b: float) -> float:
    """Add two numbers together.

    Args:
        a: The first number
        b: The second number
    """
    return a + b


@function_tool  
async def sub(a: float, b: float) -> float:
    """Subtract the second number from the first number.

    Args:
        a: The first number
        b: The second number
    """
    return a - b


@function_tool  
async def mul(a: float, b: float) -> float:
    """Multiply two numbers together.

    Args:
        a: The first number
        b: The second number
    """
    return a * b


@function_tool  
async def div(a: float, b: float) -> float:
    """Divide the first number by the second number.

    Args:
        a: The first number (dividend)
        b: The second number (divisor)
    """
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b


agent = Agent(name="Math Solver",
  model="gpt-4o-mini",
 instructions="You are a helpful math assistant. Use the available functions to solve mathematical problems.",
 tools=[add, sub, mul, div])

result = Runner.run_sync(agent, "What is 15 + 27 multiplied by 3?")
print(result.final_output)
