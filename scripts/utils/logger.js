/**
 * logger.js
 * BooksVersusMovies.com — shared pipeline logger
 *
 * Creates a logger instance that writes to both console and a dated log file
 * in the logs/ directory. Every pipeline script should use this module.
 *
 * Usage:
 *   const { createLogger } = require('./logger');
 *   const log = createLogger('html-to-json');
 *
 *   log.info('Processing 163 files...');
 *   log.warn('atonement.html', 'missing story brief');
 *   log.error('big-fish.html', 'could not parse differences');
 *   log.result({ written: 163, skipped: 0, errors: 0 });
 *   log.checkpoint('PASSED', ['All pages have affiliateLink']);
 *   log.close();  // flushes and closes the file stream
 *
 * Log files are written to:
 *   logs/YYYY-MM-DD_HH-MM-SS_<scriptName>.log
 *
 * Each run produces one log file. Logs are never overwritten.
 */

const fs   = require('fs');
const path = require('path');

const LOGS_DIR = path.resolve(__dirname, '../../logs');

function createLogger(scriptName) {
  // Ensure logs directory exists
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }

  // Build timestamped filename
  const now       = new Date();
  const datePart  = now.toISOString().split('T')[0];                        // YYYY-MM-DD
  const timePart  = now.toTimeString().split(' ')[0].replace(/:/g, '-');    // HH-MM-SS
  const logFile   = path.join(LOGS_DIR, `${datePart}_${timePart}_${scriptName}.log`);
  const stream    = fs.createWriteStream(logFile, { flags: 'a', encoding: 'utf8' });

  const startTime = Date.now();

  // Write header
  const header = [
    `${'='.repeat(60)}`,
    `Script:  ${scriptName}`,
    `Started: ${now.toISOString()}`,
    `${'='.repeat(60)}`,
    '',
  ].join('\n');

  stream.write(header);

  // Internal write — goes to both console and file
  function write(level, ...parts) {
    const timestamp = new Date().toISOString().split('T')[1].replace('Z','');
    const message   = parts.join(' ');
    const fileLine  = `[${timestamp}] [${level.padEnd(5)}] ${message}`;
    const conLine   = message;

    stream.write(fileLine + '\n');

    // Console formatting
    if (level === 'ERROR') {
      console.error(`  ✗  ${conLine}`);
    } else if (level === 'WARN') {
      console.log(`  ⚠  ${conLine}`);
    } else if (level === 'PASS') {
      console.log(`  ✓  ${conLine}`);
    } else if (level === 'SKIP') {
      console.log(`  –  ${conLine}`);
    } else {
      console.log(conLine);
    }
  }

  const logger = {
    // General info — no prefix
    info: (...parts) => write('INFO ', ...parts),

    // File processed successfully
    pass: (filename, detail) => write('PASS', detail ? `${filename} — ${detail}` : filename),

    // File processed with minor warnings
    warn: (filename, detail) => write('WARN', detail ? `${filename}: ${detail}` : filename),

    // File failed to process
    error: (filename, detail) => write('ERROR', detail ? `${filename}: ${detail}` : filename),

    // File skipped (already exists)
    skip: (filename, reason) => write('SKIP', reason ? `${filename} (${reason})` : filename),

    // Section divider — goes to both console and file
    section: label => {
      const line = `\n── ${label} ${'─'.repeat(Math.max(0, 45 - label.length))}`;
      stream.write(line + '\n');
      console.log(line);
    },

    // Summary block — key/value pairs
    summary: (pairs) => {
      const lines = ['', '── Summary ' + '─'.repeat(37)];
      for (const [key, value] of Object.entries(pairs)) {
        lines.push(`  ${key.padEnd(20)} ${value}`);
      }
      lines.push('─'.repeat(48));
      const block = lines.join('\n');
      stream.write(block + '\n');
      console.log(block);
    },

    // Checkpoint result
    checkpoint: (status, checks) => {
      const lines = ['', '── Checkpoint ' + '─'.repeat(34)];
      for (const check of checks) {
        const prefix = check.passed ? '  ✓  ' : '  ✗  ';
        lines.push(`${prefix}${check.name}`);
        if (!check.passed && check.detail) {
          lines.push(`       ${check.detail}`);
        }
      }
      lines.push('');
      lines.push('─'.repeat(48));
      const statusLine = status === 'PASSED'
        ? `  CHECKPOINT PASSED — ready for next pipeline step`
        : `  CHECKPOINT FAILED — resolve issues before proceeding`;
      lines.push(statusLine);
      const block = lines.join('\n');
      stream.write(block + '\n');
      console.log(block);
    },

    // Close the stream and write footer
    close: () => {
      const elapsed  = ((Date.now() - startTime) / 1000).toFixed(1);
      const footer   = [
        '',
        '='.repeat(60),
        `Finished: ${new Date().toISOString()}`,
        `Elapsed:  ${elapsed}s`,
        `Log:      ${logFile}`,
        '='.repeat(60),
        '',
      ].join('\n');
      stream.write(footer);
      stream.end();
      console.log(`\n✓ Log written → ${logFile}`);
    },

    // Expose log file path for reference
    logFile,
  };

  return logger;
}

module.exports = { createLogger };
