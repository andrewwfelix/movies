@echo off
REM ============================================================
REM docs-cleanup.bat
REM BooksVersusMovies.com — Reorganize docs/ folder
REM Run from project root: docs\docs-cleanup.bat
REM Or double-click from docs\ folder
REM ============================================================

echo.
echo docs-cleanup.bat — reorganizing docs folder
echo ============================================================

REM ── Navigate to project root ──────────────────────────────
cd /d "%~dp0\.."
echo Working directory: %CD%
echo.

REM ── Fix misplaced files in docs root ──────────────────────

echo Moving misplaced files...

REM narrator idea belongs in brainstorming
if exist "docs\narrator-idea.txt" (
    move "docs\narrator-idea.txt" "docs\brainstorming\uncategorized-ideas\narrator-idea.txt"
    echo   moved: narrator-idea.txt ^> brainstorming/uncategorized-ideas/
)

REM project plan belongs in strategy
if exist "docs\project-plan.txt" (
    move "docs\project-plan.txt" "docs\strategy\project-plan.txt"
    echo   moved: project-plan.txt ^> strategy/
)

REM indexing priority belongs in strategy
if exist "docs\indexing-priority.txt" (
    move "docs\indexing-priority.txt" "docs\strategy\indexing-priority.txt"
    echo   moved: indexing-priority.txt ^> strategy/
)

REM title optimization belongs in strategy not pillars
if exist "docs\pillars\title-optimization.txt" (
    move "docs\pillars\title-optimization.txt" "docs\strategy\title-optimization.txt"
    echo   moved: pillars/title-optimization.txt ^> strategy/
)

REM CSV export belongs in data/reports not docs
if exist "docs\sonnet-titles-encoding-fixed.csv" (
    if not exist "data\reports" mkdir "data\reports"
    move "docs\sonnet-titles-encoding-fixed.csv" "data\reports\sonnet-titles-encoding-fixed.csv"
    echo   moved: sonnet-titles-encoding-fixed.csv ^> data/reports/
)

REM ── Resolve duplicate completed-tasks.md ──────────────────

echo.
echo Resolving duplicates...

REM Keep docs/pipeline/completed-tasks.md as canonical
REM Remove the older copy in docs/reference/
if exist "docs\reference\completed-tasks.md" (
    del "docs\reference\completed-tasks.md"
    echo   deleted: docs/reference/completed-tasks.md (keeping docs/pipeline/ version)
)

REM Keep docs/README.md as canonical
REM Remove the copy in docs/reference/
if exist "docs\reference\README.md" (
    del "docs\reference\README.md"
    echo   deleted: docs/reference/README.md (keeping docs/README.md)
)

REM ── Delete generated/temp files ───────────────────────────

echo.
echo Cleaning generated files...

REM consolidated-docs.txt is generated — delete it (regenerate anytime with consolidate-docs.js)
if exist "docs\consolidated-docs.txt" (
    del "docs\consolidated-docs.txt"
    echo   deleted: consolidated-docs.txt (regenerate with: node scripts/content/consolidate-docs.js)
)

REM ── Done ──────────────────────────────────────────────────

echo.
echo ============================================================
echo Done. Run tree to verify:
echo   node scripts/utils/tree.js --dir docs ^> docs-tree.txt
echo ============================================================
echo.
pause
