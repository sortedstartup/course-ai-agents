// OpenAI Tool-Calling Arithmetic Agent
// Usage: node main.js "3 * (4 + 5) / 2"
// Requires OPENAI_API_KEY environment variable

const API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // any recent model that supports function calling
// const API_URL = "http://localhost:11434/v1/chat/completions";
// const MODEL = "qwen3:1.7b"; // any recent model that supports function calling

// Tool implementations
const tools = {
  add: ({ a, b }) => (a + b).toString(),
  sub: ({ a, b }) => (a - b).toString(), 
  mul: ({ a, b }) => (a * b).toString(),
  div: ({ a, b }) => {
    if (b === 0) throw new Error("Division by zero");
    return (a / b).toString();
  }
};

// -------------------------------
// JSON schema describing each tool
// -------------------------------
const toolSchema = [
  {
    type: "function",
    function: {
      name: "add",
      description: "Add two numbers and return the sum as a string.",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number", description: "first number" },
          b: { type: "number", description: "second number" },
        },
        required: ["a", "b"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sub",
      description: "Subtract b from a and return the difference as a string.",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number", description: "first number" },
          b: { type: "number", description: "second number" },
        },
        required: ["a", "b"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mul",
      description: "Multiply two numbers and return the product as a string.",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number", description: "first number" },
          b: { type: "number", description: "second number" },
        },
        required: ["a", "b"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "div",
      description: "Divide a by b and return the quotient as a string.",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number", description: "Dividend" },
          b: { type: "number", description: "Divisor (non-zero)" },
        },
        required: ["a", "b"],
      },
    },
  },
];

// -------------------------------
// Helper to call the OpenAI REST API
// -------------------------------
async function openaiChat(body) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY in the environment.");
  }

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

  //print both body and response.json()
  const response_json = await response.json()

// un comment for debugging
  // console.log("body", JSON.stringify(body, null, 2));
  // console.log("response.json()", JSON.stringify(response_json, null, 2));

  return response_json;
}

// -------------------------------
// Agent loop
// -------------------------------
async function solve(expression) {
  
  const messages = [
    { role: "system", content: "" },
    { role: "user", content: expression }
  ];

  let iteration = 0;
  while (iteration < 10) {
    iteration++;

    const data = await openaiChat({
      model: MODEL,
      messages,
      tools: toolSchema,
      tool_choice: "auto"
    });

    const message = data.choices[0].message;
    const finishReason = data.choices[0].finish_reason;

    if (finishReason === "stop") {
      // Final explanation / answer.
      logAssistant(message.content);
      return message.content;
    }

    if (message.tool_calls?.length) {
      logAssistant(message.content);
      messages.push(message);

      for (const call of message.tool_calls) {
        const { name, arguments: argStr } = call.function;
        const args = JSON.parse(argStr || "{}");
        
        if (!tools[name]) {
          throw new Error(`Unknown tool: ${name}`);
        }
        
        const result = tools[name](args);
        console.log(`Tool → ${name}(${JSON.stringify(args)}) = ${result}`);

        // Push tool result message corresponding to this call
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result
        });
      }
      continue;
    }

    throw new Error("Unexpected response format from OpenAI.");
  }
  
  throw new Error("Iterations limit reached without solution.");
}

// Helper function
function logAssistant(text) {
  if (text?.trim()) {
    console.log(`Assistant: ${text.trim()}`);
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
