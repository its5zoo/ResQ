#!/bin/bash
echo "--- COMMAND A (Frontend Unused Files) ---"
cd frontend/src && \
find . -type f \( -name "*.jsx" -o -name "*.js" -o -name "*.css" \) \
  ! -name "main.jsx" ! -name "App.jsx" ! -name "index.js" \
  | sed 's|^\./||' \
  | while read file; do
      name=$(basename "$file" | sed 's/\.[^.]*$//')
      count=$(grep -rl "$name" . --include="*.jsx" --include="*.js" \
              --exclude-dir=node_modules 2>/dev/null | grep -v "/$file$" | wc -l)
      echo "$count $file"
    done \
  | sort -n | head -40

echo "--- COMMAND B (Backend Unused Files) ---"
cd ../../backend && \
find . -type f -name "*.js" \
  ! -name "server.js" ! -name "app.js" ! -name "index.js" \
  ! -path "*/node_modules/*" \
  | sed 's|^\./||' \
  | while read file; do
      name=$(basename "$file" | sed 's/\.[^.]*$//')
      count=$(grep -rl "$name" . --include="*.js" \
              --exclude-dir=node_modules 2>/dev/null | grep -v "/$file$" | wc -l)
      echo "$count $file"
    done \
  | sort -n | head -40

echo "--- COMMAND C (Unused CSS in Frontend) ---"
cd .. && \
find frontend/src -name "*.css" | while read file; do
  name=$(basename "$file")
  count=$(grep -rl "$name" frontend/src --include="*.jsx" --include="*.js" 2>/dev/null | wc -l)
  echo "$count $file"
done | sort -n

echo "--- COMMAND D (Console Logs) ---"
grep -rn "console\.log\|console\.error\|console\.warn\|debugger\|\/\/ test\|\/\/ debug\|\/\/ temp\|\/\/ remove" \
  --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules . 2>/dev/null | wc -l
echo "^ Total instances found. Snippet:"
grep -rn "console\.log\|console\.error\|console\.warn\|debugger\|\/\/ test\|\/\/ debug\|\/\/ temp\|\/\/ remove" \
  --include="*.js" --include="*.jsx" \
  --exclude-dir=node_modules . 2>/dev/null | head -10

echo "--- COMMAND E (Large Files) ---"
find . -type f \( -name "*.js" -o -name "*.jsx" -o -name "*.css" \) \
  ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" \
  -size +50k 2>/dev/null | sort -rh | head -20
