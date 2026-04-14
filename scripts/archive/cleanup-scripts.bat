@echo off
:: ============================================================
:: cleanup-scripts.bat
:: Run AFTER reorganize-scripts.bat and after verifying
:: that pipelines still work correctly.
:: Run from: C:\Users\andre\projects\movies\scripts\
:: ============================================================

echo.
echo cleanup-scripts.bat
echo ============================================================
echo This deletes original files from scripts\ root that were
echo copied to subdirectories by reorganize-scripts.bat.
echo.
echo Only run this after confirming pipelines still work.
echo.
pause

:: ── Delete moved utils ────────────────────────────────────────
del "logger.js"
del "validate-json-schema.js"
del "quality-gate.js"
del "tree.js"

:: ── Delete moved ops ─────────────────────────────────────────
del "check-nav.js"
del "check-fields.js"
del "fix-nav.js"
del "fix-titles-book-vs-movie.js"
del "fix-cta-titles.js"
del "housekeeping.js"
del "sitemap-generate.js"

:: ── Delete moved content ──────────────────────────────────────
del "generate-review.js"
del "generate-next-steps.js"
del "html-to-json.js"
del "export-titles.js"
del "import-titles.js"
del "log-all-titles.js"
del "consolidate-docs.js"

:: ── Delete moved reporting ────────────────────────────────────
del "dashboard.js"
del "get-advice.js"
del "review-pipeline-output.js"
del "get-todays-chages.js"

:: ── Delete the bat files themselves ──────────────────────────
del "reorganize-scripts.bat"

echo.
echo ============================================================
echo Done. Run: tree /f
echo to confirm clean structure, then:
echo   git add .
echo   git commit -m "refactor: reorganize scripts into subfolders"
echo ============================================================
echo.
pause
