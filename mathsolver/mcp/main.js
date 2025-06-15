// OpenAI MCP Arithmetic Agent
// Usage: node main.js "3 * (4 + 5) / 2"
// Requires OPENAI_API_KEY environment variable

const fs = require('fs');
const path = require('path');

const API_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-4o-mini"; // any recent model that supports MCP
const MCP_SERVER_URL = "https://a295-2406-b400-b5-519f-8bd-4fe0-3d94-f319.ngrok-free.app/mcp";

// Helper function to create timestamped log files
function logToFile(data, type) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${type}_${timestamp}.json`;
  const logPath = path.join(__dirname, 'logs', filename);
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(logPath, JSON.stringify(data, null, 2));
    console.log(`${type} logged to: ${filename}`);
  } catch (error) {
    console.error(`Failed to write ${type} log:`, error.message);
  }
}

// -------------------------------
// Helper to call the OpenAI REST API with MCP
// -------------------------------
async function openaiChat(body) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in the environment.");
  }

  // Log the request
  logToFile(body, 'request');

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI API error: ${response.status} – ${errorBody}`);
  }

  const response_json = await response.json()

  // Log the response
  logToFile(response_json, 'response');

  // uncomment for debugging
  // console.log("body", JSON.stringify(body, null, 2));
  // console.log("response.json()", JSON.stringify(response_json, null, 2));

  return response_json;
}

// Helper function to clean LaTeX formatting
function cleanLatexFormatting(text) {
  return text.replace(/\\?\\\(/g, '(').replace(/\\?\\\)/g, ')');
}

// Helper function
function logAssistant(text) {
  if (text?.trim()) {
    console.log(`Assistant: ${text.trim()}`);
  }
}

// -------------------------------
// Agent function using MCP
// -------------------------------
async function solve(expression) {
  console.log(`Solving: ${expression}`);

  const requestBody = {
    model: MODEL,
    tools: [
      {
        type: "mcp",
        server_label: "mathsolver",
        server_url: MCP_SERVER_URL,
        require_approval: "never"
      }
    ],
    input: `Please solve this arithmetic expression: ${expression}`
  };

  try {
    const data = await openaiChat(requestBody);
    
    // uncomment for debugging
    // console.log("Full Response:", JSON.stringify(data, null, 2));
    
    // Parse MCP response structure
    if (data.output && Array.isArray(data.output)) {
      // Find the message output in the response
      const messageOutput = data.output.find(item => item.type === "message");
      
      if (messageOutput && messageOutput.content && messageOutput.content[0]) {
        const rawResult = messageOutput.content[0].text;
        const cleanResult = cleanLatexFormatting(rawResult);
        console.log(`Assistant: ${cleanResult}`);
        return cleanResult;
      }
      
      // If no message found, look for MCP call results
      const mcpCall = data.output.find(item => item.type === "mcp_call");
      if (mcpCall && mcpCall.output) {
        const result = `The answer is: ${mcpCall.output}`;
        console.log(`Assistant: ${result}`);
        return result;
      }
    }
    
    // Fallback: print full response for debugging
    console.log("Full Response:", JSON.stringify(data, null, 2));
    return "Received response from MCP server";
    
  } catch (error) {
    console.error("Error calling MCP server:", error.message);
    throw error;
  }
}

// CLI entry point
if (require.main === module) {
  const expression = process.argv.slice(2).join(" ");
  if (!expression) {
    console.error("Usage: node main.js \"<arithmetic expression>\"");
    process.exit(1);
  }
  
  solve(expression)
    .then(answer => console.log(`Answer: ${answer}`))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
