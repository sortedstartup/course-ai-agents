#!/usr/bin/env node

import OpenAI from 'openai';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Tool definitions for shell commands
const tools = [
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List .txt files in a directory",
      parameters: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Directory path to list files from"
          }
        },
        required: ["directory"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_file_head",
      description: "Read the first few lines of a file to understand its content",
      parameters: {
        type: "object",
        properties: {
          filepath: {
            type: "string",
            description: "Path to the file to read"
          },
          lines: {
            type: "number",
            description: "Number of lines to read from the beginning",
            default: 10
          }
        },
        required: ["filepath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "read_full_file",
      description: "Read the complete content of a file if needed for better classification",
      parameters: {
        type: "object",
        properties: {
          filepath: {
            type: "string",
            description: "Path to the file to read completely"
          }
        },
        required: ["filepath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_directory",
      description: "Create a directory for file classification",
      parameters: {
        type: "object",
        properties: {
          directory: {
            type: "string",
            description: "Directory name to create"
          }
        },
        required: ["directory"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "copy_file",
      description: "Copy a file to a target directory",
      parameters: {
        type: "object",
        properties: {
          source: {
            type: "string",
            description: "Source file path"
          },
          destination: {
            type: "string",
            description: "Destination directory path"
          }
        },
        required: ["source", "destination"]
      }
    }
  }
];

// Tool execution functions
async function executeFunction(name, args) {
  try {
    switch (name) {
      case 'list_files':
        return listFiles(args.directory);
      
      case 'read_file_head':
        return readFileHead(args.filepath, args.lines || 10);
      
      case 'read_full_file':
        return readFullFile(args.filepath);
      
      case 'create_directory':
        return createDirectory(args.directory);
      
      case 'copy_file':
        return copyFile(args.source, args.destination);
      
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  } catch (error) {
    return `Error executing ${name}: ${error.message}`;
  }
}

function listFiles(directory) {
  try {
    const result = execSync(`find "${directory}" -maxdepth 1 -name "*.txt" -type f`, { encoding: 'utf8' });
    const files = result.trim().split('\n').filter(file => file.length > 0);
    return `Found ${files.length} .txt files:\n${files.join('\n')}`;
  } catch (error) {
    return `Error listing files: ${error.message}`;
  }
}

function readFileHead(filepath, lines) {
  try {
    const result = execSync(`head -n ${lines} "${filepath}"`, { encoding: 'utf8' });
    return `First ${lines} lines of ${filepath}:\n${result}`;
  } catch (error) {
    return `Error reading file head: ${error.message}`;
  }
}

function readFullFile(filepath) {
  try {
    const result = execSync(`cat "${filepath}"`, { encoding: 'utf8' });
    return `Full content of ${filepath}:\n${result}`;
  } catch (error) {
    return `Error reading full file: ${error.message}`;
  }
}

function createDirectory(directory) {
  try {
    execSync(`mkdir -p "${directory}"`, { encoding: 'utf8' });
    return `Created directory: ${directory}`;
  } catch (error) {
    return `Error creating directory: ${error.message}`;
  }
}

function copyFile(source, destination) {
  try {
    execSync(`cp "${source}" "${destination}/"`, { encoding: 'utf8' });
    const filename = path.basename(source);
    return `Copied ${filename} to ${destination}/`;
  } catch (error) {
    return `Error copying file: ${error.message}`;
  }
}

// Main classification logic
async function classifyFiles(targetDirectory) {
  const messages = [
    {
      role: "system",
      content: `You are a smart file classifier agent. Your job is to:
1. List all .txt files in the target directory
2. Read the content of each file (using head first, full content if needed)
3. Classify each file into categories: invoice, note, article, log, code, unknown
4. Create appropriate directories for each category
5. Copy files to their classified directories
6. For each file moved, explain your reasoning in one clear sentence

Classification guidelines:
- invoice: Contains billing information, amounts, dates, company names
- note: Personal notes, reminders, short informal text
- article: Longer formatted text, structured content, news articles
- log: System logs, timestamps, error messages, structured data entries
- code: Programming code, scripts, configuration files
- unknown: Ambiguous or unclassifiable content

Always use the tools provided to perform file operations. Be methodical and classify one file at a time.`
    },
    {
      role: "user",
      content: `Please classify all .txt files in the directory: ${targetDirectory}`
    }
  ];

  let conversation = [...messages];

  while (true) {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: conversation,
      tools: tools,
      tool_choice: "auto"
    });

    const message = response.choices[0].message;
    conversation.push(message);

    if (message.tool_calls) {
      // Execute all tool calls
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`\n🔧 Executing: ${functionName}(${JSON.stringify(functionArgs)})`);
        
        const result = await executeFunction(functionName, functionArgs);
        
        // Special handling for file copying to show progress
        if (functionName === 'copy_file') {
          const filename = path.basename(functionArgs.source);
          const destDir = functionArgs.destination;
          console.log(`✅ ${filename} → ${destDir} (${message.content || 'Classification completed'})`);
        }
        
        conversation.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result
        });
      }
    } else {
      // No more tool calls, agent is done or providing explanation
      if (message.content) {
        console.log(`\n🤖 Agent: ${message.content}`);
      }
      
      // Check if the agent is asking for more input or is done
      if (message.content && (
        message.content.toLowerCase().includes('complete') ||
        message.content.toLowerCase().includes('finished') ||
        message.content.toLowerCase().includes('done')
      )) {
        break;
      }
      
      // Continue the conversation
      conversation.push({
        role: "user",
        content: "Continue with the next file if there are more to classify, or let me know if you're done."
      });
    }
  }
}

// Main function
async function main() {
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is required');
    console.error('Set it with: export OPENAI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  // Get target directory from command line
  const targetDirectory = process.argv[2];
  
  if (!targetDirectory) {
    console.error('❌ Usage: node main.mjs <directory_path>');
    console.error('Example: node main.mjs /path/to/txt/files');
    process.exit(1);
  }

  // Verify directory exists
  if (!fs.existsSync(targetDirectory)) {
    console.error(`❌ Error: Directory "${targetDirectory}" does not exist`);
    process.exit(1);
  }

  console.log(`🚀 Starting File Classifier Agent`);
  console.log(`📁 Target Directory: ${targetDirectory}`);
  console.log(`🤖 Using OpenAI GPT-4 for classification\n`);

  try {
    await classifyFiles(targetDirectory);
    console.log('\n✅ File classification completed!');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
