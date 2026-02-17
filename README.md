# Intucate Mini-Build — Diagnostic to Summary Flow

## Overview

This project implements a mini admin flow:

Login → Diagnostic Prompt Save → Student Attempt Upload → SQI Engine → Summary Customizer Payload JSON

Built using:
- React (Vite)
- TypeScript
- Local state management
- No external backend (logic in frontend)

---

## Features

### 1. Mock Login
- Accepts any @intucate.com email
- Password must be 8+ characters
- Session persisted using localStorage

### 2. Admin Console
- Save Diagnostic Agent Prompt
- Paste Student Attempt JSON
- Compute:
  - Overall SQI
  - Topic-wise SQI
  - Concept-wise SQI
  - Ranked Concepts (with weights & reasons)

### 3. Summary Customizer Payload
Generates:

- overall_sqi
- topic_scores
- concept_scores
- ranked_concepts_for_summary
- metadata (engine version + timestamp)

Supports:
- Download JSON
- Copy JSON

---

## SQI Formula
Base:
correct ? +marks : -neg_marks


Weighted by:
- Importance (A=1, B=0.7, C=0.5)
- Difficulty (E=0.6, M=1.0, H=1.4)
- Type (Practical=1.1, Theory=1.0)

Behavior adjustments:
- Slow solve (>1.5x) → *0.9
- Very slow (>2x) → *0.8
- Marked review & wrong → *0.9
- Revisited & corrected → +0.2 * marks

Normalized:
(raw / max_possible) * 100

Ranking Weights:
- 40% Wrong at least once
- 25% Importance
- 20% Time behavior
- 15% Diagnostic quality

---

## Run Locally

```bash
npm install
npm run dev
Demo Flow

Login with test@intucate.com

Save diagnostic prompt

Paste student attempt JSON

Click Compute SQI

Download summary_customizer_input.json

---

# 🔹 3️⃣ GitHub Upload

Run:

```bash
git init
git add .
git commit -m "Initial Intucate Mini Build"
git branch -M main
git remote add origin <your-repo-link>
git push -u origin main


Base:
