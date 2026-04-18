@echo off
echo ================================================
echo  BooksVersusMovies — Regen Failed + Stale
echo  %date% %time%
echo ================================================
echo.

echo [1/5] reminders-of-him (failed + stale JSON)
node scripts/pipeline-spotlight.js --slug reminders-of-him --force
echo.

echo [2/5] dune (failed)
node scripts/pipeline-spotlight.js --slug dune --force
echo.

echo [3/5] the-shining (failed)
node scripts/pipeline-spotlight.js --slug the-shining --force
echo.

echo [4/5] the-fault-in-our-stars (failed)
node scripts/pipeline-spotlight.js --slug the-fault-in-our-stars --force
echo.

echo [5/5] it-ends-with-us (stale JSON — old markdown)
node scripts/pipeline-spotlight.js --slug it-ends-with-us --force
echo.

echo [6/5] normal-people (stale JSON — old markdown)
node scripts/pipeline-spotlight.js --slug normal-people --force
echo.

echo ================================================
echo  All done. Run consistency audit next:
echo  node scripts/utils/consistency-audit.js
echo ================================================
pause
