@echo off
echo ================================================
echo  RavensEdge API — Scaffold Project Structure
echo  %date% %time%
echo ================================================
echo.

set ROOT=C:\Users\andre\projects\ravens-api

echo Creating root folder...
mkdir %ROOT%
cd %ROOT%

echo Creating api functions...
mkdir api
echo. > api\gsc.js
echo. > api\analytics.js
echo. > api\tasks.js
echo. > api\docs.js
echo. > api\docs-sync.js
echo. > api\config.js

echo Creating scripts...
mkdir scripts
mkdir scripts\migrate
echo. > scripts\migrate\seed-analytics.js
echo. > scripts\migrate\seed-tasks.js
echo. > scripts\migrate\seed-decisions.js
echo. > scripts\migrate\seed-notes.js
echo. > scripts\migrate\seed-brainstorming.js

echo Creating supabase folder...
mkdir supabase
echo. > supabase\setup-phase1.sql

echo Creating config...
mkdir config
echo. > config\sites.json

echo Creating docs...
mkdir docs
echo. > docs\README.md
echo. > docs\architecture.md

echo Creating .env.example...
(
echo SUPABASE_URL=
echo SUPABASE_ANON_KEY=
echo SUPABASE_SERVICE_KEY=
echo GOOGLE_CLIENT_EMAIL=
echo GOOGLE_PRIVATE_KEY=
echo GSC_SITE_URL=https://booksversusmovies.com/
echo GA_PROPERTY_ID=
echo BEEHIIV_API_KEY=
echo BEEHIIV_PUBLICATION_ID=
echo OPENROUTER_API_KEY=
echo SITE_ID=1
) > .env.example

echo Creating .gitignore...
(
echo .env
echo node_modules/
echo .vercel/
) > .gitignore

echo Creating vercel.json...
(
echo {
echo   "functions": {
echo     "api/**/*.js": { "memory": 512, "maxDuration": 30 }
echo   },
echo   "crons": [
echo     { "path": "/api/gsc", "schedule": "0 6 * * *" },
echo     { "path": "/api/docs-sync", "schedule": "0 7 * * 1" }
echo   ]
echo }
) > vercel.json

echo Creating package.json...
(
echo {
echo   "name": "ravens-api",
echo   "version": "1.0.0",
echo   "description": "RavensEdge AI LLC — Vercel API backend for BooksVersusMovies.com",
echo   "private": true,
echo   "dependencies": {
echo     "@supabase/supabase-js": "^2.0.0"
echo   }
echo }
) > package.json

echo Creating README.md...
(
echo # ravens-api
echo.
echo RavensEdge AI LLC — Vercel API backend
echo.
echo Serves BooksVersusMovies.com and future sites via site_id.
echo.
echo ## Structure
echo.
echo api/          Vercel serverless functions
echo supabase/     SQL schema and migration scripts
echo scripts/      One-time migration and seed scripts
echo config/       Site configuration
echo docs/         Architecture and planning docs
echo.
echo ## Setup
echo.
echo 1. Copy .env.example to .env and fill in credentials
echo 2. Run supabase/setup-phase1.sql in Supabase SQL editor
echo 3. Run migration scripts to seed from existing JSON files
echo 4. Deploy to Vercel
echo.
echo ## Sites
echo.
echo site_id 1 = BooksVersusMovies.com
echo site_id 2 = TheApiaryGuide.com ^(future^)
) > README.md

echo.
echo ================================================
echo  Done. Structure created at %ROOT%
echo.
echo  Next steps:
echo    1. cd %ROOT%
echo    2. git init
echo    3. git add .
echo    4. git commit -m "init: scaffold ravens-api"
echo    5. Create repo on GitHub and push
echo    6. Import to Vercel
echo    7. Copy setup-phase1.sql from movies repo
echo ================================================
pause
