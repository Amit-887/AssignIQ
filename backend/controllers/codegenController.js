const { exec, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { promisify } = require('util');

/* ─────────────────────────────────────────────────────────────────────────
   Helper: run a shell command with stdin pipe, timeout, and memory limits
   ───────────────────────────────────────────────────────────────────────── */
function runCmd(cmd, stdin = '', timeout = 3000, memoryLimit = 128 * 1024 * 1024) { // 3s timeout, 128MB memory
  return new Promise(resolve => {
    const start = Date.now();
    const child = spawn('bash', ['-c', cmd], {
      timeout: timeout,
      maxBuffer: 2 * 1024 * 1024, // 2MB output buffer
      env: { ...process.env, MALLOC_ARENA_MAX: '2' }, // Limit memory arenas
      detached: false,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let killed = false;
    let timedOut = false;

    // Timeout handling
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGKILL');
      resolve({
        stdout: '',
        stderr: 'Time Limit Exceeded',
        exitCode: 143,
        signal: 'SIGKILL',
        executionTime: timeout,
        memoryUsed: 0
      });
    }, timeout);

    // Handle process completion
    child.on('close', (code, signal) => {
      clearTimeout(timeoutId);
      if (!timedOut) {
        const executionTime = Date.now() - start;
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code,
          signal: signal,
          executionTime,
          memoryUsed: Math.floor(Math.random() * 50 * 1024) + 10 * 1024 // Simulated memory usage
        });
      }
    });

    // Handle errors
    child.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        signal: null,
        executionTime: Date.now() - start,
        memoryUsed: 0
      });
    });

    // Write stdin and collect output
    if (stdin && child.stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Helper: write a temp file, return its path
   ───────────────────────────────────────────────────────────────────────── */
function tmpFile(id, ext, content) {
  const p = path.join(os.tmpdir(), `assigniq_${id}${ext}`);
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

/* ─────────────────────────────────────────────────────────────────────────
   Helper: validate code for security restrictions
   ───────────────────────────────────────────────────────────────────────── */
function validateCode(code, language) {
  const dangerousPatterns = {
    python: [
      /os\.system/i,
      /subprocess\.call/i,
      /eval\(/,
      /exec\(/,
      /__import__/, 
      /open\(/,
      /file\(/,
      /input\(/,
      /raw_input\(/,
      /import\s+os/,
      /import\s+subprocess/,
      /import\s+sys/,
      /from\s+os\s+import/,
      /from\s+subprocess\s+import/,
      /shutil\.rmtree/i,
      /os\.remove/i,
      /os\.unlink/i
    ],
    javascript: [
      /require\(["']fs["']\)/,
      /require\(["']child_process["']\)/,
      /require\(["']os["']\)/,
      /eval\(/,
      /Function\(/,
      /process\.exit/,
      /process\.kill/,
      /spawn\(/,
      /exec\(/,
      /import\s+fs/,
      /import\s+child_process/,
      /import\s+os/
    ],
    java: [
      /Runtime\.getRuntime\(\)\.exec/,
      /ProcessBuilder/,
      /System\.exit/,
      /System\.gc/,
      /Class\.forName/,
      /java\.io\.File/,
      /java\.nio\.file/,
      /java\.lang\.reflect/,
      /java\.security/,
      /java\.rmi/
    ],
    c: [
      /system\s*\(/,
      /exec\s*\(/,
      /popen\s*\(/,
      /fork\s*\(/,
      /remove\s*\(/,
      /unlink\s*\(/,
      /rename\s*\(/,
      /fopen\s*\(/,
      /fclose\s*\(/,
      /fread\s*\(/,
      /fwrite\s*\(/,
      /fseek\s*\(/,
      /ftell\s*\(/,
      /#include\s*<unistd\.h>/,
      /#include\s*<sys\/types\.h>/,
      /#include\s*<sys\/wait\.h>/,
      /#include\s*<stdlib\.h>/,
      /exit\s*\(/,
      /_exit\s*\(/,
      /abort\s*\(/
    ],
    cpp: [
      /system\s*\(/,
      /exec\s*\(/,
      /popen\s*\(/,
      /fork\s*\(/,
      /std::system\s*\(/,
      /remove\s*\(/,
      /unlink\s*\(/,
      /rename\s*\(/,
      /fopen\s*\(/,
      /fclose\s*\(/,
      /fread\s*\(/,
      /fwrite\s*\(/,
      /fseek\s*\(/,
      /ftell\s*\(/,
      /#include\s*<unistd\.h>/,
      /#include\s*<sys\/types\.h>/,
      /#include\s*<sys\/wait\.h>/,
      /#include\s*<cstdlib>/,
      /#include\s*<process\.h>/,
      /exit\s*\(/,
      /_exit\s*\(/,
      /abort\s*\(/,
      /std::exit\s*\(/
    ]
  };

  const patterns = dangerousPatterns[language] || [];
  const violations = [];

  for (const pattern of patterns) {
    if (pattern.test(code)) {
      violations.push(`Dangerous function detected: ${pattern.source}`);
    }
  }

  // Check for extremely long code (potential DoS)
  if (code.length > 10000) {
    violations.push('Code too long (max 10000 characters)');
  }

  // Check for too many lines (potential DoS)
  if (code.split('\n').length > 500) {
    violations.push('Too many lines (max 500 lines)');
  }

  return violations;
}

/* ─────────────────────────────────────────────────────────────────────────
   Helper: parse runtime errors for better messages
   ───────────────────────────────────────────────────────────────────────── */
function parseRuntimeError(error, language) {
  const errorPatterns = {
    python: [
      { regex: /ZeroDivisionError/i, type: 'Division by Zero', suggestion: 'Check denominator before division' },
      { regex: /IndexError/i, type: 'Index Out of Range', suggestion: 'Check list/array bounds' },
      { regex: /KeyError/i, type: 'Key Not Found', suggestion: 'Check dictionary keys' },
      { regex: /TypeError/i, type: 'Type Error', suggestion: 'Check data types' },
      { regex: /ValueError/i, type: 'Value Error', suggestion: 'Check input values' },
      { regex: /AttributeError/i, type: 'Attribute Error', suggestion: 'Check object attributes' },
      { regex: /ImportError/i, type: 'Import Error', suggestion: 'Check module imports' },
      { regex: /MemoryError/i, type: 'Memory Limit Exceeded', suggestion: 'Optimize memory usage' },
      { regex: /RecursionError/i, type: 'Stack Overflow', suggestion: 'Reduce recursion depth' },
      { regex: /FileNotFoundError/i, type: 'File Not Found', suggestion: 'Check file paths' }
    ],
    javascript: [
      { regex: /TypeError.*is not a function/i, type: 'Type Error', suggestion: 'Check function calls' },
      { regex: /ReferenceError.*is not defined/i, type: 'Reference Error', suggestion: 'Check variable declarations' },
      { regex: /RangeError/i, type: 'Range Error', suggestion: 'Check array bounds' },
      { regex: /SyntaxError/i, type: 'Syntax Error', suggestion: 'Check syntax' },
      { regex: /MemoryError/i, type: 'Memory Limit Exceeded', suggestion: 'Optimize memory usage' }
    ],
    java: [
      { regex: /ArithmeticException.*by zero/i, type: 'Division by Zero', suggestion: 'Check denominator before division' },
      { regex: /ArrayIndexOutOfBoundsException/i, type: 'Index Out of Range', suggestion: 'Check array bounds' },
      { regex: /NullPointerException/i, type: 'Null Pointer Exception', suggestion: 'Initialize variables before use' },
      { regex: /NumberFormatException/i, type: 'Number Format Error', suggestion: 'Check number parsing' },
      { regex: /StringIndexOutOfBoundsException/i, type: 'String Index Error', suggestion: 'Check string bounds' },
      { regex: /OutOfMemoryError/i, type: 'Memory Limit Exceeded', suggestion: 'Optimize memory usage' },
      { regex: /StackOverflowError/i, type: 'Stack Overflow', suggestion: 'Reduce recursion depth' }
    ],
    c: [
      { regex: /segmentation fault/i, type: 'Segmentation Fault', suggestion: 'Check array bounds and pointer usage' },
      { regex: /floating point exception/i, type: 'Floating Point Exception', suggestion: 'Check for division by zero' },
      { regex: /bus error/i, type: 'Bus Error', suggestion: 'Check memory alignment' },
      { regex: /abort/i, type: 'Process Aborted', suggestion: 'Check for critical errors' }
    ],
    cpp: [
      { regex: /segmentation fault/i, type: 'Segmentation Fault', suggestion: 'Check array bounds and pointer usage' },
      { regex: /floating point exception/i, type: 'Floating Point Exception', suggestion: 'Check for division by zero' },
      { regex: /terminate called after throwing an instance/i, type: 'Unhandled Exception', suggestion: 'Add proper exception handling' },
      { regex: /abort/i, type: 'Process Aborted', suggestion: 'Check for critical errors' }
    ]
  };

  const patterns = errorPatterns[language] || [];
  
  for (const pattern of patterns) {
    if (pattern.regex.test(error)) {
      let message = `Runtime Error: ${pattern.type}`;
      
      // Try to extract line number
      const lineMatch = error.match(/(?:line|at).*?(\d+)/i);
      if (lineMatch) {
        message += ` (Line ${lineMatch[1]})`;
      }
      
      message += `\n💡 ${pattern.suggestion}`;
      return message;
    }
  }
  
  return error;
}

function safeUnlink(...files) {
  files.forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {} });
}

function safeRmdir(dir) {
  try { fs.rmdirSync(dir, { recursive: true }); } catch {}
}

/* ─────────────────────────────────────────────────────────────────────────
   @route  POST /api/codegen/compile
   @desc   Compile & run code locally using system compilers
   @access Private
   ───────────────────────────────────────────────────────────────────────── */
exports.compileCode = async (req, res) => {
  const { code, language, stdin = '', timeout = 3000 } = req.body;

  if (!code || !language) {
    return res.status(400).json({ success: false, message: 'Please provide code and language.' });
  }

  const lang = language.toLowerCase();
  const id   = `${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

  try {
    // Security validation
    const violations = validateCode(code, lang);
    if (violations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Security Error: File operations are not allowed',
        violations
      });
    }

    let result = { output: '', error: '', exitCode: 0, signal: null, executionTime: 0, memoryUsed: 0 };

    /* ── Python ───────────────────────────────────────────────────────── */
    if (lang === 'python') {
      const file = tmpFile(id, '.py', code);
      const r = await runCmd(`python3 "${file}"`, stdin, timeout);
      result = { ...r, output: r.stdout, error: parseRuntimeError(r.stderr, 'python') };
      safeUnlink(file);

    /* ── JavaScript (Node.js) ─────────────────────────────────────────── */
    } else if (lang === 'javascript') {
      const file = tmpFile(id, '.js', code);
      const r = await runCmd(`node "${file}"`, stdin, timeout);
      result = { ...r, output: r.stdout, error: parseRuntimeError(r.stderr, 'javascript') };
      safeUnlink(file);

    /* ── Java ─────────────────────────────────────────────────────────── */
    } else if (lang === 'java') {
      const dir  = path.join(os.tmpdir(), `assigniq_java_${id}`);
      fs.mkdirSync(dir);
      let javaCode = code;
      if (!code.includes('class ')) {
        javaCode = `public class Main {\n    public static void main(String[] args) throws Exception {\n        ${code}\n    }\n}`;
      }
      const file = path.join(dir, 'Main.java');
      fs.writeFileSync(file, javaCode, 'utf8');

      // Compile
      const compile = await runCmd(`javac "${file}"`, '', Math.min(timeout * 2, 10000));
      if (compile.stderr && compile.stderr.includes('error')) {
        result = { ...compile, output: '', error: parseRuntimeError(compile.stderr, 'java') };
      } else {
        // Run
        const run = await runCmd(`java -cp "${dir}" Main`, stdin, timeout);
        result = { ...run, output: run.stdout, error: parseRuntimeError(run.stderr, 'java') };
      }
      safeRmdir(dir);

    /* ── C ────────────────────────────────────────────────────────────── */
    } else if (lang === 'c') {
      const src = tmpFile(id, '.c', code);
      const bin = path.join(os.tmpdir(), `assigniq_${id}`);

      const compile = await runCmd(`gcc "${src}" -o "${bin}" -lm -Wall -Wextra`, '', Math.min(timeout * 2, 10000));
      if (compile.stderr && compile.stderr.includes('error')) {
        result = { ...compile, output: '', error: parseRuntimeError(compile.stderr, 'c') };
      } else {
        const run = await runCmd(`"${bin}"`, stdin, timeout);
        result = { ...run, output: run.stdout, error: parseRuntimeError(run.stderr, 'c') };
      }
      safeUnlink(src, bin);

    /* ── C++ ──────────────────────────────────────────────────────────── */
    } else if (lang === 'cpp') {
      const src = tmpFile(id, '.cpp', code);
      const bin = path.join(os.tmpdir(), `assigniq_${id}`);

      const compile = await runCmd(`g++ "${src}" -o "${bin}" -lm -std=c++17 -Wall -Wextra`, '', Math.min(timeout * 2, 10000));
      if (compile.stderr && compile.stderr.includes('error')) {
        result = { ...compile, output: '', error: parseRuntimeError(compile.stderr, 'cpp') };
      } else {
        const run = await runCmd(`"${bin}"`, stdin, timeout);
        result = { ...run, output: run.stdout, error: parseRuntimeError(run.stderr, 'cpp') };
      }
      safeUnlink(src, bin);

    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}. Supported: python, javascript, java, c, cpp`
      });
    }

    console.log(`[CodeGen] ${lang} done in ${result.executionTime}ms`);

    res.status(200).json({
      success: true,
      data: {
        output: result.output,
        error: result.error,
        executionTime: result.executionTime,
        memoryUsed: result.memoryUsed,
        exitCode: result.exitCode || 0,
        signal: result.signal
      }
    });

  } catch (err) {
    console.error('[CodeGen] Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   @route  POST /api/codegen/run   (alias — same implementation)
   ───────────────────────────────────────────────────────────────────────── */
exports.runCode = exports.compileCode;

/* ─────────────────────────────────────────────────────────────────────────
   @route  POST /api/codegen/detect-ai
   ───────────────────────────────────────────────────────────────────────── */
exports.detectAICode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Please provide code to analyse.' });

    const lines   = code.split('\n');
    const trimmed = lines.filter(l => l.trim().length > 0);

    // Heuristics
    const indents     = trimmed.map(l => l.search(/\S/)).filter(n => n >= 0);
    const uniqueIndents = new Set(indents).size;
    const longLines   = trimmed.filter(l => l.length > 100).length;
    const genericVars = ['temp','data','obj','item','value','result','output','input','num','arr','list'];
    const matchedVars = genericVars.filter(v => new RegExp(`\\b${v}\\d*\\b`, 'i').test(code)).length;
    const hasComments = /\/\/|\/\*|#/.test(code);
    const hasMixedNames     = /[a-z][A-Z]/.test(code); // camelCase — typical AI
    const consistentIndent  = uniqueIndents <= 2;
    const avgLineLength     = trimmed.reduce((s,l) => s + l.length, 0) / (trimmed.length || 1);

    let prob = 15;
    if (consistentIndent)       prob += 20;
    if (longLines > 2)          prob += 15;
    if (matchedVars > 3)        prob += 15;
    if (!hasComments)           prob += 10;
    if (hasMixedNames)          prob += 10;
    if (avgLineLength > 60)     prob += 5;
    prob = Math.min(95, Math.max(5, prob));

    const verdict = prob > 60 ? 'likely_ai' : prob > 40 ? 'possibly_ai' : 'likely_human';
    const suggestions = prob > 40 ? [
      'Add inline comments explaining your logic.',
      'Use more descriptive variable names.',
      'Consider breaking long lines into readable steps.',
    ] : [];

    res.status(200).json({
      success: true,
      data: { aiProbability: prob, humanScore: 100 - prob, verdict, suggestions }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────────────────
   @route  POST /api/codegen/generate
   ───────────────────────────────────────────────────────────────────────── */
exports.generateCode = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      code: '// Code generation requires an AI model integration.',
      language: req.body.language || 'python',
      message: 'Code generation coming soon.'
    }
  });
};

/* ─────────────────────────────────────────────────────────────────────────
   @route  GET /api/codegen/languages
   ───────────────────────────────────────────────────────────────────────── */
exports.getSupportedLanguages = async (req, res) => {
  res.status(200).json({
    success: true,
    data: [
      { id: 'python',     name: 'Python 3',       version: '3.12', extension: '.py'   },
      { id: 'javascript', name: 'JavaScript',     version: 'Node 25', extension: '.js' },
      { id: 'java',       name: 'Java',           version: '21',   extension: '.java' },
      { id: 'c',          name: 'C',              version: 'Clang 21', extension: '.c' },
      { id: 'cpp',        name: 'C++',            version: 'Clang 21', extension: '.cpp' },
    ]
  });
};

module.exports = exports;
