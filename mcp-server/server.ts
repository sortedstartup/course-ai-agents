import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

function getServer(): McpServer {
  
  const server = new McpServer({
    name: "Arithmetic Server",
    version: "1.0.0"
  });

  server.tool(
    "add",
    { a: z.number(), b: z.number() },
    async ({ a, b }) => {
      console.log(`[ADD] Called with a=${a}, b=${b}`);
      const result = a + b;
      console.log(`[ADD] Result: ${result}`);
      return {
        content: [{ type: "text", text: `${result}` }]
      };
    }
  );

  server.tool(
    "sub",
    { a: z.number(), b: z.number() },
    async ({ a, b }) => {
      console.log(`[SUB] Called with a=${a}, b=${b}`);
      const result = a - b;
      console.log(`[SUB] Result: ${result}`);
      return {
        content: [{ type: "text", text: `${result}` }]
      };
    }
  );

  server.tool(
    "mul",
    { a: z.number(), b: z.number() },
    async ({ a, b }) => {
      console.log(`[MUL] Called with a=${a}, b=${b}`);
      const result = a * b;
      console.log(`[MUL] Result: ${result}`);
      return {
        content: [{ type: "text", text: `${result}` }]
      };
    }
  );

  server.tool(
    "div",
    { a: z.number(), b: z.number() },
    async ({ a, b }) => {
      console.log(`[DIV] Called with a=${a}, b=${b}`);
      if (b === 0) {
        console.log(`[DIV] Error: Division by zero attempted`);
        return {
          content: [{ type: "text", text: "Error: Division by zero is not allowed" }]
        };
      }
      const result = a / b;
      console.log(`[DIV] Result: ${result}`);
      return {
        content: [{ type: "text", text: `${result}` }]
      };
    }
  );

  return server;
}

const app = express();
app.use(express.json());

app.post("/mcp", async (req: Request, res: Response) => {
  try {
    const server = getServer(); 
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    res.on("close", () => {
      console.log("Request closed");
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error"
        },
        id: null
      });
    }
  }
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`MCP Server running on http://localhost:${PORT}/mcp`);
});
