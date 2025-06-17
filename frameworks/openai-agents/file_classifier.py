import os
import subprocess
import shutil
from pathlib import Path
from agents import Agent, Runner, function_tool
import sys


@function_tool
async def list_files(directory: str) -> str:
    """List .txt files in a directory.
    
    Args:
        directory: Directory path to list files from
    """
    try:
        directory_path = Path(directory)
        if not directory_path.exists():
            return f"Error: Directory '{directory}' does not exist"
        
        txt_files = list(directory_path.glob("*.txt"))
        if not txt_files:
            return f"No .txt files found in {directory}"
        
        file_list = "\n".join([str(f) for f in txt_files])
        return f"Found {len(txt_files)} .txt files:\n{file_list}"
    except Exception as e:
        return f"Error listing files: {str(e)}"


@function_tool
async def read_file_head(filepath: str, lines: int = 10) -> str:
    """Read the first few lines of a file to understand its content.
    
    Args:
        filepath: Path to the file to read
        lines: Number of lines to read from the beginning (default: 10)
    """
    try:
        file_path = Path(filepath)
        if not file_path.exists():
            return f"Error: File '{filepath}' does not exist"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content_lines = []
            for i, line in enumerate(f):
                if i >= lines:
                    break
                content_lines.append(line.rstrip())
        
        content = "\n".join(content_lines)
        return f"First {lines} lines of {filepath}:\n{content}"
    except Exception as e:
        return f"Error reading file head: {str(e)}"


@function_tool
async def read_full_file(filepath: str) -> str:
    """Read the complete content of a file if needed for better classification.
    
    Args:
        filepath: Path to the file to read completely
    """
    try:
        file_path = Path(filepath)
        if not file_path.exists():
            return f"Error: File '{filepath}' does not exist"
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return f"Full content of {filepath}:\n{content}"
    except Exception as e:
        return f"Error reading full file: {str(e)}"


@function_tool
async def create_directory(directory: str) -> str:
    """Create a directory for file classification.
    
    Args:
        directory: Directory name to create
    """
    try:
        dir_path = Path(directory)
        dir_path.mkdir(parents=True, exist_ok=True)
        return f"Created directory: {directory}"
    except Exception as e:
        return f"Error creating directory: {str(e)}"


@function_tool
async def copy_file(source: str, destination: str) -> str:
    """Copy a file to a target directory.
    
    Args:
        source: Source file path
        destination: Destination directory path
    """
    try:
        source_path = Path(source)
        dest_path = Path(destination)
        
        if not source_path.exists():
            return f"Error: Source file '{source}' does not exist"
        
        if not dest_path.exists():
            return f"Error: Destination directory '{destination}' does not exist"
        
        dest_file = dest_path / source_path.name
        shutil.copy2(source_path, dest_file)
        
        return f"Copied {source_path.name} to {destination}/"
    except Exception as e:
        return f"Error copying file: {str(e)}"


# File classifier agent
agent = Agent(
    name="FileClassifier",
    model="gpt-4o-mini",
    instructions="""You are a smart file classifier agent. Your job is to:
1. List all .txt files in the target directory
2. Read the content of each file (using read_file_head first, read_full_file if needed)
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

Always use the tools provided to perform file operations. Be methodical and classify one file at a time.
Start by listing the files, then examine each one systematically.""",
    tools=[list_files, read_file_head, read_full_file, create_directory, copy_file]
)


def main():
    """Main function to run the file classifier agent."""
    if len(sys.argv) < 2:
        print("❌ Usage: python file_classifier.py <directory_path>")
        print("Example: python file_classifier.py /path/to/txt/files")
        sys.exit(1)
    
    target_directory = sys.argv[1]
    
    if not os.path.exists(target_directory):
        print(f"❌ Error: Directory '{target_directory}' does not exist")
        sys.exit(1)
    
    print("🚀 Starting File Classifier Agent")
    print(f"📁 Target Directory: {target_directory}")
    print("🤖 Using GPT-4o-mini for classification\n")
    
    try:
        result = Runner.run_sync(
            agent, 
            f"Please classify all .txt files in the directory: {target_directory}"
        )
        print("\n✅ File classification completed!")
        print(f"\n🤖 Final result: {result.final_output}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
