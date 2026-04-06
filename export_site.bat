@echo off
setlocal

set OUTPUT=site_aggregate.txt
set SITE_DIR=%~dp0

echo BooksVersusMovies.com — Site Aggregate > %OUTPUT%
echo Generated: %date% %time% >> %OUTPUT%
echo ============================================================ >> %OUTPUT%
echo. >> %OUTPUT%

:: Directory listing
echo DIRECTORY STRUCTURE >> %OUTPUT%
echo ------------------------------------------------------------ >> %OUTPUT%
dir /b %SITE_DIR% >> %OUTPUT%
echo. >> %OUTPUT%

:: CSS
echo ============================================================ >> %OUTPUT%
echo FILE: css\style.css >> %OUTPUT%
echo ============================================================ >> %OUTPUT%
type "%SITE_DIR%css\style.css" >> %OUTPUT%
echo. >> %OUTPUT%

:: All HTML files
for %%f in ("%SITE_DIR%*.html") do (
    echo ============================================================ >> %OUTPUT%
    echo FILE: %%~nxf >> %OUTPUT%
    echo ============================================================ >> %OUTPUT%
    type "%%f" >> %OUTPUT%
    echo. >> %OUTPUT%
)

echo Done. Output saved to %OUTPUT%
start notepad %OUTPUT%
