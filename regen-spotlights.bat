@echo off
echo ================================================
echo  BooksVersusMovies — Spotlight Regeneration
echo  %date% %time%
echo ================================================
echo.

echo [1/11] reminders-of-him
node scripts/pipeline-spotlight.js --slug reminders-of-him --force
echo.

echo [2/11] lonesome-dove
node scripts/pipeline-spotlight.js --slug lonesome-dove --force
echo.

echo [3/11] dune
node scripts/pipeline-spotlight.js --slug dune --force
echo.

echo [4/11] fight-club
node scripts/pipeline-spotlight.js --slug fight-club --force
echo.

echo [5/11] gone-girl
node scripts/pipeline-spotlight.js --slug gone-girl --force
echo.

echo [6/11] the-shining
node scripts/pipeline-spotlight.js --slug the-shining --force
echo.

echo [7/11] it-ends-with-us
node scripts/pipeline-spotlight.js --slug it-ends-with-us
echo.

echo [8/11] normal-people
node scripts/pipeline-spotlight.js --slug normal-people
echo.

echo [9/11] the-fault-in-our-stars
node scripts/pipeline-spotlight.js --slug the-fault-in-our-stars
echo.

echo [10/11] where-the-crawdads-sing
node scripts/pipeline-spotlight.js --slug where-the-crawdads-sing
echo.

echo [11/11] a-little-life
node scripts/pipeline-spotlight.js --slug a-little-life
echo.

echo ================================================
echo  All done. Run consistency audit next:
echo  node scripts/utils/consistency-audit.js
echo ================================================
pause
