#!/bin/bash

# Codebase cleanup script - removes unnecessary documentation and test files
# while preserving essential system files

echo "🧹 Starting codebase cleanup..."

# Files to KEEP (essential for system operation)
KEEP_FILES=(
    "README.md"                    # Main project documentation
    "package.json"                 # Dependencies
    "tsconfig*.json"               # TypeScript configuration
    "vite.config.ts"              # Build configuration
    "tailwind.config.ts"          # Styling configuration
    "eslint.config.js"            # Code quality
    "postcss.config.*"            # CSS processing
    "components.json"             # UI components config
)

# Directories with important system files to preserve
IMPORTANT_DIRS=(
    "src/"
    "public/"
    "lib/"
    "node_modules/"
    ".git/"
    "migrations/"  # Keep database migrations
)

echo "📋 Files that will be preserved:"
for file in "${KEEP_FILES[@]}"; do
    if ls $file 2>/dev/null; then
        echo "  ✅ $file"
    fi
done

echo ""
echo "📁 Directories that will be preserved:"
for dir in "${IMPORTANT_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir"
    fi
done

echo ""
echo "🗑️  Files to be removed:"

# Count files before cleanup
total_removed=0

# Remove all .md files except README.md
echo "Removing documentation files (.md)..."
for file in *.md; do
    if [ "$file" != "README.md" ] && [ -f "$file" ]; then
        echo "  🗑️  $file"
        rm "$file"
        ((total_removed++))
    fi
done

# Remove all .mjs test files
echo "Removing test files (.mjs)..."
for file in *.mjs; do
    if [ -f "$file" ]; then
        echo "  🗑️  $file"
        rm "$file"
        ((total_removed++))
    fi
done

# Remove debug/test .js files (but keep essential ones)
KEEP_JS_FILES=(
    "app.js"           # Might be needed
    "index.js"         # Might be needed
    "eslint.config.js" # Essential
    "postcss.config.js" # Essential
)

echo "Removing debug/test JavaScript files..."
for file in *.js; do
    if [ -f "$file" ]; then
        keep_file=false
        for keep in "${KEEP_JS_FILES[@]}"; do
            if [ "$file" == "$keep" ]; then
                keep_file=true
                break
            fi
        done
        
        if [ "$keep_file" = false ]; then
            echo "  🗑️  $file"
            rm "$file"
            ((total_removed++))
        fi
    fi
done

# Remove .sql files that look like temporary/debug files
echo "Removing temporary SQL files..."
for file in *.sql; do
    if [ -f "$file" ]; then
        # Remove SQL files that contain debug/test patterns
        if [[ "$file" =~ (debug|test|temp|fix|cleanup) ]]; then
            echo "  🗑️  $file"
            rm "$file"
            ((total_removed++))
        fi
    fi
done

# Remove CSV test files
echo "Removing test data files..."
for file in *.csv; do
    if [ -f "$file" ]; then
        # Keep sample files but remove test uploads
        if [[ "$file" =~ (test|upload|temp) ]]; then
            echo "  🗑️  $file"
            rm "$file"
            ((total_removed++))
        fi
    fi
done

# Remove temporary TypeScript files
echo "Removing temporary TypeScript files..."
for file in *.ts; do
    if [ -f "$file" ]; then
        # Remove TypeScript files that look temporary (but preserve config files)
        if [[ "$file" =~ (debug|test|temp|check) ]] && [[ ! "$file" =~ (config|setup) ]]; then
            echo "  🗑️  $file"
            rm "$file"
            ((total_removed++))
        fi
    fi
done

# Clean up any .bak or .tmp files
echo "Removing backup and temporary files..."
for pattern in "*.bak" "*.tmp" "*.temp" "*.old"; do
    for file in $pattern; do
        if [ -f "$file" ]; then
            echo "  🗑️  $file"
            rm "$file"
            ((total_removed++))
        fi
    done
done

echo ""
echo "✨ Cleanup complete!"
echo "📊 Total files removed: $total_removed"
echo ""
echo "✅ Preserved essential files:"
echo "  - Package configuration (package.json, tsconfig.*, etc.)"
echo "  - Build configuration (vite.config.ts, tailwind.config.ts, etc.)"
echo "  - Source code (src/ directory)"
echo "  - Database migrations (migrations/ directory)"
echo "  - Main documentation (README.md)"
echo ""
echo "🗑️  Removed:"
echo "  - Debug/test documentation files"
echo "  - Test scripts (.mjs files)"
echo "  - Debug JavaScript files"
echo "  - Temporary SQL files"
echo "  - Test data files"
echo "  - Backup files"
echo ""
echo "🎯 Your codebase is now clean and organized!"