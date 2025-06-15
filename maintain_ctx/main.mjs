#!/usr/bin/env node

// CLI chat with OpenAI GPT-4o-mini
// Requires: OPENAI_API_KEY environment variable

import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable required');
  process.exit(1);
}

const history = [
  { role: 'system', content: 'You are a concise talking male guy, you talk in bullet points' },

  { role: 'user', content: 'your name is alpha' },
  { role: 'assistant', content: 'ok!' },

  { role: 'user', content: 'your age is 10 years old' },
  { role: 'assistant', content: 'ok!' }
  
];

async function askGPT(question) {
  const messages = [...history, { role: 'user', content: question }];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`API Error ${response.status}:`, error);
    process.exit(1);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || 'No response';
}

async function main() {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  const question = (await rl.question('You: ')).trim();
  rl.close();

  if (!question) {
    console.log('No question provided.');
    return;
  }

  console.log('Thinking...');
  const answer = await askGPT(question);
  console.log(`GPT: ${answer}`);
}

main().catch(console.error);
