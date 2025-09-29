#!/usr/bin/env node

import OpenAI from 'openai';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Tool definitions for analytics operations
const tools = [
  {
    type: "function",
    function: {
      name: "execute_sql",
      description: "Execute SQL queries on the SQLite database and return data output as string",
      parameters: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description: "SQL query to execute on the database"
          }
        },
        required: ["sql"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_csv",
      description: "Execute SQL query and generate CSV file from the results",
      parameters: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description: "SQL query to execute and export as CSV"
          }
        },
        required: ["sql"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_graph_image",
      description: "Generate a graph image from CSV file using gnuplot",
      parameters: {
        type: "object",
        properties: {
          csv: {
            type: "string",
            description: "Path to the CSV file to generate graph from"
          }
        },
        required: ["csv"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create a file with the given content",
      parameters: {
        type: "object",
        properties: {
          file_name: {
            type: "string",
            description: "Name of the file to create"
          },
          content: {
            type: "string",
            description: "Content to write to the file"
          }
        },
        required: ["file_name", "content"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_timestamp",
      description: "Get current timestamp",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

// Tool execution functions
async function executeFunction(name, args) {
  try {
    switch (name) {
      case 'execute_sql':
        return executeSql(args.sql);
      
      case 'generate_csv':
        return generateCsv(args.sql);
      
      case 'generate_graph_image':
        return generateGraphImage(args.csv);
      
      case 'write_file':
        return writeFile(args.file_name, args.content);
      
      case 'get_timestamp':
        return getTimestamp();
      
      default:
        throw new Error(`Unknown function: ${name}`);
    }
  } catch (error) {
    return `Error executing ${name}: ${error.message}`;
  }
}

function executeSql(sql) {
  try {
    const result = execSync(`sqlite3 data.db "${sql}"`, { encoding: 'utf8' });
    return `SQL Query Result:\n${result}`;
  } catch (error) {
    return `Error executing SQL: ${error.message}`;
  }
}

function generateCsv(sql) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const csvFileName = `data_export_${timestamp}.csv`;
    
    // Execute SQL and output as CSV
    execSync(`sqlite3 -header -csv data.db "${sql}" > ${csvFileName}`, { encoding: 'utf8' });
    
    return `Generated CSV file: ${csvFileName}`;
  } catch (error) {
    return `Error generating CSV: ${error.message}`;
  }
}

function generateGraphImage(csv) {
  try {
    // Check if CSV file exists and has content
    if (!fs.existsSync(csv)) {
      return `Error: CSV file '${csv}' does not exist`;
    }
    
    const csvContent = fs.readFileSync(csv, 'utf8').trim();
    if (!csvContent) {
      return `Error: CSV file '${csv}' is empty`;
    }
    
    const lines = csvContent.split('\n');
    if (lines.length < 2) {
      return `Error: CSV file '${csv}' needs at least a header and one data row`;
    }
    
    // Check if gnuplot is available
    try {
      execSync('which gnuplot', { encoding: 'utf8' });
    } catch (error) {
      // Fallback to Python matplotlib
      return generateGraphWithPython(csv);
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const imageFileName = `chart_${timestamp}.png`;
    
    // Create a basic gnuplot script for the CSV
    const gnuplotScript = `
set terminal png size 800,600
set output '${imageFileName}'
set datafile separator ','
set style data histogram
set style histogram cluster gap 1
set style fill solid border -1
set boxwidth 0.9
set xtic rotate by -45 scale 0
set grid
set title 'Data Analysis Chart'
plot '${csv}' using 2:xtic(1) with histogram title 'Data'
`;
    
    // Write gnuplot script to temporary file
    const scriptFile = 'temp_plot.gnuplot';
    fs.writeFileSync(scriptFile, gnuplotScript);
    
    // Execute gnuplot
    execSync(`gnuplot ${scriptFile}`, { encoding: 'utf8' });
    
    // Clean up script file
    fs.unlinkSync(scriptFile);
    
    return `Generated graph image: ${imageFileName}`;
  } catch (error) {
    return `Error generating graph: ${error.message}`;
  }
}

function generateGraphWithPython(csv) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const imageFileName = `chart_${timestamp}.png`;
    
    // Create Python script for plotting
    const pythonScript = `
import pandas as pd
import matplotlib.pyplot as plt
import sys

try:
    # Read CSV file
    df = pd.read_csv('${csv}')
    
    # Create a basic bar chart
    plt.figure(figsize=(10, 6))
    
    # If we have exactly 2 columns, use them as x and y
    if len(df.columns) == 2:
        plt.bar(df.iloc[:, 0], df.iloc[:, 1])
        plt.xlabel(df.columns[0])
        plt.ylabel(df.columns[1])
    else:
        # For more complex data, plot the first numeric column
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            df[numeric_cols[0]].plot(kind='bar')
            plt.ylabel(numeric_cols[0])
        else:
            # Fallback: count occurrences of first column
            df.iloc[:, 0].value_counts().plot(kind='bar')
            plt.ylabel('Count')
    
    plt.title('Data Analysis Chart')
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.savefig('${imageFileName}', dpi=150, bbox_inches='tight')
    print('Graph generated successfully')
    
except Exception as e:
    print(f'Error: {e}')
    sys.exit(1)
`;
    
    // Write Python script to temporary file
    const scriptFile = 'temp_plot.py';
    fs.writeFileSync(scriptFile, pythonScript);
    
    // Check if Python is available
    try {
      execSync('which python3', { encoding: 'utf8' });
      execSync(`python3 ${scriptFile}`, { encoding: 'utf8' });
    } catch (pythonError) {
      try {
        execSync('which python', { encoding: 'utf8' });
        execSync(`python ${scriptFile}`, { encoding: 'utf8' });
      } catch (fallbackError) {
        fs.unlinkSync(scriptFile);
        return `Error: Neither gnuplot nor Python (with matplotlib/pandas) is available for graph generation. Please install one of them:\n- Install gnuplot: brew install gnuplot (Mac) or apt-get install gnuplot (Linux)\n- Install Python with packages: pip install matplotlib pandas`;
      }
    }
    
    // Clean up script file
    fs.unlinkSync(scriptFile);
    
    return `Generated graph image: ${imageFileName} (using Python matplotlib)`;
  } catch (error) {
    return `Error generating graph with Python: ${error.message}`;
  }
}

function writeFile(fileName, content) {
  try {
    fs.writeFileSync(fileName, content, 'utf8');
    return `Created file: ${fileName}`;
  } catch (error) {
    return `Error writing file: ${error.message}`;
  }
}

function getTimestamp() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return timestamp;
  } catch (error) {
    return `Error getting timestamp: ${error.message}`;
  }
}

// Main analytics logic
async function generateAnalyticsReport(analyticsQuery) {
  const messages = [
    {
      role: "system",
      content: `You are a data analyst you create analytics reports by analytics data in sqlite
- you have access to a sqlite database and can execute sql queries on it
- when you generate a report use this filename strategy : report_<current_timestamp>.md

You are using sqlite3 to execute sql queries make sure you write the correct query the first time. If you don't find sqlite3 then quit.

Process:
1. First, explore the database structure to understand available tables and columns. Don't assume, if you can't access database then quit. You must access datbase and check tables.
2. Write SQL queries to extract relevant data for the analytics request
3. Generate CSV files for data that would benefit from visualization
4. Create graphs/charts from the CSV data using gnuplot. This is manadatory. Limit csv to 3 and each csv must have a graph png file.
5. Make sure png is not corrupted.
6. Compile everything into a comprehensive markdown report.
7. Save the report using the filename strategy: report_<current_timestamp>.md
8. Save the graph using the filename strategy: graph_<current_timestamp>.png

Always provide clear explanations of your analysis and findings in the report.`
    },
    {
      role: "user",
      content: `Generate a report for: ${analyticsQuery}`
    }
  ];

  let conversation = [...messages];

  while (true) {
    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
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
        
        // Special handling for report generation
        if (functionName === 'write_file' && functionArgs.file_name.startsWith('report_')) {
          console.log(`✅ Analytics report generated: ${functionArgs.file_name}`);
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
        console.log(`\n🤖 Analyst: ${message.content}`);
      }
      
      // Check if the agent is asking for more input or is done
      if (message.content && (
        message.content.toLowerCase().includes('complete') ||
        message.content.toLowerCase().includes('finished') ||
        message.content.toLowerCase().includes('done') ||
        message.content.toLowerCase().includes('report has been generated')
      )) {
        break;
      }
      
      // Continue the conversation
      conversation.push({
        role: "user",
        content: "Continue with the analysis if there's more to do, or let me know if the report is complete."
      });
    }
  }
}

// Main function
async function main() {
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error(' Error: OPENAI_API_KEY environment variable is required');
    console.error('Set it with: export OPENAI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  // Get analytics query from command line
  const analyticsQuery = process.argv.slice(2).join(' ');
  
  if (!analyticsQuery) {
    console.error(' Usage: node main.mjs <analytics_query>');
    console.error('Example: node main.mjs "analyze sales performance by region"');
    process.exit(1);
  }

  // Check if sqlite3 is available
  try {
    execSync('which sqlite3', { encoding: 'utf8' });
  } catch (error) {
    console.error(' Error: sqlite3 is not installed');
    process.exit(1);
  }

  // Verify database exists
  if (!fs.existsSync('data.db')) {
    console.error(` Error: Database "data.db" does not exist`);
    process.exit(1);
  }

  console.log(` Starting Data Analytics Agent`);
  console.log(`Analytics Query: ${analyticsQuery}`);
  console.log(` Database: data.db`);
  console.log(` Using OpenAI GPT-4 for analysis\n`);

  try {
    await generateAnalyticsReport(analyticsQuery);
    console.log('\n Analytics report generation completed!');
  } catch (error) {
    console.error(` Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(path.basename(process.argv[1]))) {
  main().catch(console.error);
}
