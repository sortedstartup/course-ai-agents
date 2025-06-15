 Smart File Classifier Agent (v1)
🎯 Goal
Classify .txt files into folders based on content, using reasoning (e.g., invoice, log, note, code, article).

🛠 Shell Tools Used
Tool	Purpose
ls	List files
cat	Read full file contents if needed
head	Peek at top lines (faster preview)
mkdir	Create category folders
cp	Move files to target folders

🧠 LLM Reasoning Tasks
Interpret top N lines (head) of each file

Infer category: invoice, note, article, log, code, unknown

Handle edge cases: empty, unreadable, ambiguous

Dynamically suggest/create folders if needed