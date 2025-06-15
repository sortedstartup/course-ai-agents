# Smart File Classifier Agent

A tool-calling OpenAI agent that automatically classifies `.txt` files into organized folders based on their content using GPT-4.

## Features

- 🤖 **AI-Powered Classification**: Uses OpenAI GPT-4 with function calling
- 📁 **Smart Categorization**: Classifies files into categories: invoice, note, article, log, code, unknown
- 🔧 **Shell Tool Integration**: Uses native shell commands (ls, cat, head, mkdir, cp)
- 📊 **Real-time Progress**: Shows which files are moved to which directories with reasoning
- 🎯 **Command Line Interface**: Simple CLI for easy automation

## Prerequisites

- Node.js 18+ 
- OpenAI API key
- Linux/macOS environment with standard shell tools

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set your OpenAI API key:**
   ```bash
   export OPENAI_API_KEY=your_api_key_here
   ```

3. **Make the script executable:**
   ```bash
   chmod +x main.mjs
   ```

## Usage

```bash
node main.mjs <directory_path>
```

### Example

```bash
node main.mjs /path/to/your/txt/files
```

## How it Works

1. **Discovery**: Lists all `.txt` files in the specified directory
2. **Analysis**: Reads file content (head first, full content if needed)
3. **Classification**: Uses GPT-4 to categorize each file based on content patterns
4. **Organization**: Creates category directories and moves files accordingly
5. **Reporting**: Prints progress with reasoning for each file move

## Classification Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **invoice** | Billing information, amounts, dates, company names | Bills, receipts, invoices |
| **note** | Personal notes, reminders, short informal text | Personal notes, to-do lists |
| **article** | Longer formatted text, structured content | News articles, blog posts |
| **log** | System logs, timestamps, error messages | Application logs, system output |
| **code** | Programming code, scripts, configuration files | Source code, config files |
| **unknown** | Ambiguous or unclassifiable content | Mixed or unclear content |

## Sample Output

```
🚀 Starting File Classifier Agent
📁 Target Directory: /home/user/documents
🤖 Using OpenAI GPT-4 for classification

🔧 Executing: list_files({"directory":"/home/user/documents"})

🔧 Executing: read_file_head({"filepath":"/home/user/documents/invoice_2024.txt","lines":10})

🔧 Executing: create_directory({"directory":"/home/user/documents/invoice"})

🔧 Executing: copy_file({"source":"/home/user/documents/invoice_2024.txt","destination":"/home/user/documents/invoice"})

✅ invoice_2024.txt → /home/user/documents/invoice (Contains billing information with company details and amounts)

🤖 Agent: Classification complete! All files have been organized into appropriate directories.

✅ File classification completed!
```

## Error Handling

- **Missing API Key**: Clear error message with setup instructions
- **Invalid Directory**: Validates directory existence before processing
- **File Read Errors**: Graceful handling of unreadable files
- **Tool Execution Errors**: Detailed error reporting for debugging

## Customization

You can modify the classification categories and logic by editing the system prompt in the `classifyFiles` function within `main.mjs`.

## API Usage

The agent uses OpenAI's GPT-4 model with function calling. Each run will consume API tokens based on:
- Number of files to classify
- File content length
- Complexity of classification decisions

## License

MIT License 