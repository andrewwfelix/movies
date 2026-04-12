@echo off
echo Running Pass 2 on pages missing ctaBlocks...
echo.

node scripts\pipeline-revise.js --slug ready-player-one --pass 2 --force
node scripts\pipeline-revise.js --slug the-pillars-of-the-earth --pass 2 --force
node scripts\pipeline-revise.js --slug the-princess-bride --pass 2 --force
node scripts\pipeline-revise.js --slug the-road --pass 2 --force
node scripts\pipeline-revise.js --slug the-secret-garden --pass 2 --force
node scripts\pipeline-revise.js --slug the-secret-life-of-bees --pass 2 --force
node scripts\pipeline-revise.js --slug the-shining --pass 2 --force
node scripts\pipeline-revise.js --slug the-sisterhood-of-the-traveling-pants --pass 2 --force
node scripts\pipeline-revise.js --slug the-three-body-problem --pass 2 --force
node scripts\pipeline-revise.js --slug the-thursday-murder-club --pass 2 --force
node scripts\pipeline-revise.js --slug the-time-travelers-wife --pass 2 --force
node scripts\pipeline-revise.js --slug the-witcher --pass 2 --force
node scripts\pipeline-revise.js --slug the-woman-in-the-window --pass 2 --force
node scripts\pipeline-revise.js --slug thirteen-reasons-why --pass 2 --force
node scripts\pipeline-revise.js --slug to-kill-a-mockingbird --pass 2 --force
node scripts\pipeline-revise.js --slug verity --pass 2 --force
node scripts\pipeline-revise.js --slug water-for-elephants --pass 2 --force
node scripts\pipeline-revise.js --slug where-the-crawdads-sing --pass 2 --force
node scripts\pipeline-revise.js --slug white-noise --pass 2 --force
node scripts\pipeline-revise.js --slug wolf-hall --pass 2 --force
node scripts\pipeline-revise.js --slug world-war-z --pass 2 --force
node scripts\pipeline-revise.js --slug wuthering-heights --pass 2 --force

echo.
echo Done. Run fix-cta-titles.js next.
