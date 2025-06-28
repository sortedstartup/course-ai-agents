## Metadata
```
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "curl-client",
        "version": "1.0.0"
      }
    }
  }'
```

## Tool List
```
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'
```


```
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "add",
      "arguments": {
        "a": 10,
        "b": 5
      }
    }
  }'
```

# Creating a New AI Agent with MCP Integration

This guide will help you create a new AI agent that can interact with GitHub and custom MCP servers for processing meeting notes and managing project tasks.

## Step 1: Set Up the Agent Environment

### 1.1 Create Project Structure
```bash
# Create a new folder for your agent
mkdir my-agent
cd my-agent

# Create Python virtual environment
uv venv

# Activate the virtual environment (optional, uv run will handle this)
# source .venv/bin/activate  # On macOS/Linux
# .venv\Scripts\activate     # On Windows
```

### 1.2 Install Dependencies
```bash
# Install the agents framework
uv pip install openai-agents
```

### 1.3 Create Environment Configuration
Create a `.env` file in your agent folder:
```bash
# Create .env file for API keys
touch .env
```

Add your API keys to the `.env` file:
```env
# GitHub Personal Access Token (get from https://github.com/settings/tokens)
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_token_here

# Add other API keys as needed
```

## Step 2: Create the Agent Code

### 2.1 Create the Main Agent File
Create `agent.py` in your agent folder and add code to call mcp servers and create agent

## Step 3: Create a Custom MCP Server (Optional)

If you need a custom MCP server for company-specific data:

### 3.1 Create MCP Server Structure
```bash
# Create MCP server folder inside your agent directory
mkdir mcp-server
cd mcp-server

# Initialize UV project
uv init

# Add MCP dependencies
uv add "mcp[cli]"
uv add fastapi
uv add uvicorn
```

### 3.2 Create MCP Server Code
Create `main.py` in the `mcp-server` folder and implement the tools you want to use.

## Step 4: Running the System

### 4.1 Start the MCP Server (if using custom server)
```bash
# Navigate to mcp-server folder
cd mcp-server

# Start the MCP server
uv run main.py

# Optional: Test the server with MCP inspector
uv run mcp dev main.py
```

### 4.2 Start the Agent
```bash
# Navigate back to agent folder
cd ..

# Run the agent
uv run agent.py
```
