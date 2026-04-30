import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Grid, Typography, Button, Select, MenuItem, FormControl,
  Chip, CircularProgress, IconButton, Tooltip, Stack, Divider,
  TextField, Alert
} from '@mui/material';
import Editor from '@monaco-editor/react';
import PlayArrowIcon       from '@mui/icons-material/PlayArrow';
import ContentCopyIcon     from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon     from '@mui/icons-material/AutoAwesome';
import TerminalIcon        from '@mui/icons-material/Terminal';
import DeleteSweepIcon     from '@mui/icons-material/DeleteSweep';
import RestartAltIcon      from '@mui/icons-material/RestartAlt';
import ExpandMoreIcon      from '@mui/icons-material/ExpandMore';
import ExpandLessIcon      from '@mui/icons-material/ExpandLess';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon    from '@mui/icons-material/ErrorOutline';
import StopIcon            from '@mui/icons-material/Stop';
import TimerIcon           from '@mui/icons-material/Timer';
import MemoryIcon          from '@mui/icons-material/Memory';
import api from '../redux/api';
import Layout from '../components/Layout';

/* ─── Languages ─────────────────────────────────────────────────────────── */
const LANGS = [
  { id: 'python',     label: 'Python 3',      ext: '.py',   dot: '#3776ab', monaco: 'python'     },
  { id: 'javascript', label: 'JavaScript',    ext: '.js',   dot: '#f59e0b', monaco: 'javascript' },
  { id: 'java',       label: 'Java 15',       ext: '.java', dot: '#ea580c', monaco: 'java'       },
  { id: 'c',          label: 'C  (GCC 10)',   ext: '.c',    dot: '#8b5cf6', monaco: 'c'          },
  { id: 'cpp',        label: 'C++  (GCC 10)', ext: '.cpp',  dot: '#6366f1', monaco: 'cpp'        },
];

const TEMPLATES = {
  python: `# Python 3
def main():
    print("Hello, World!")
    nums = [1, 2, 3, 4, 5]
    print(f"Sum = {sum(nums)}")

if __name__ == "__main__":
    main()`,

  javascript: `// JavaScript (Node.js)
console.log("Hello, World!");

const nums = [1, 2, 3, 4, 5];
const sum = nums.reduce((a, b) => a + b, 0);
console.log(\`Sum = \${sum}\`);`,

  java: `// Java 15
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        int[] nums = {1, 2, 3, 4, 5};
        int sum = 0;
        for (int n : nums) sum += n;
        System.out.println("Sum = " + sum);
    }
}`,

  c: `// C (GCC 10)
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    int nums[] = {1,2,3,4,5}, sum = 0;
    for (int i = 0; i < 5; i++) sum += nums[i];
    printf("Sum = %d\\n", sum);
    return 0;
}`,

  cpp: `// C++ (GCC 10)
#include <iostream>
#include <vector>
#include <numeric>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    vector<int> nums = {1, 2, 3, 4, 5};
    cout << "Sum = " << accumulate(nums.begin(), nums.end(), 0) << endl;
    return 0;
}`,
};

/* ─── Log-line colours ────────────────────────────────────────────────────  */
const LOG_COLOR = { out: '#e2e8f0', err: '#f87171', sys: '#475569' };

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CodeGen() {
  const [langId,   setLangId]   = useState('python');
  const [code,     setCode]     = useState(TEMPLATES.python);
  const [stdin,    setStdin]    = useState('');
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [executionTimeout, setExecutionTimeout] = useState(3000); // 3 seconds
  const [abortController, setAbortController] = useState(null);
  const [executionMetrics, setExecutionMetrics] = useState(null);

  const editorRef  = useRef(null);
  const logEnd     = useRef(null);
  const lang       = LANGS.find(l => l.id === langId);

  useEffect(() => { setCode(TEMPLATES[langId]); setAiResult(null); }, [langId]);
  useEffect(() => { 
    // Only scroll to bottom if there are actual logs and console is open
    if (logs.length > 0 && consoleOpen) {
      logEnd.current?.scrollIntoView({ behavior: 'smooth' }); 
    }
  }, [logs, consoleOpen]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getCode = () => editorRef.current?.getValue() ?? code;

  const pushLog = (text, type = 'sys') => {
    const ts = new Date().toLocaleTimeString('en-GB');
    setLogs(p => [...p, { text, type, ts }]);
  };

  /* ── Run ── */
  const handleRun = async () => {
    setLoading(true);
    setIsRunning(true);
    setLogs([]);
    setConsoleOpen(true);
    setExecutionMetrics(null);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    setAbortController(controller);
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      controller.abort();
      pushLog('✗ Time Limit Exceeded (3s)', 'err');
      setLoading(false);
      setIsRunning(false);
      setExecutionMetrics({
        status: 'TLE',
        executionTime: '>3000ms',
        memoryUsed: 'N/A'
      });
    }, executionTimeout);
    
    pushLog(`▶  ${lang.label} — compiling…`, 'sys');
    try {
      const { data } = await api.post('/codegen/compile', {
        code: getCode(), 
        language: langId, 
        stdin,
        timeout: executionTimeout,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const { output: out, error: err, executionTime, memoryUsed, exitCode, signal: signalKilled } = data.data;
      
      // Handle different execution scenarios
      if (err && err.includes('Time Limit Exceeded')) {
        pushLog('✗ Time Limit Exceeded', 'err');
      } else if (signalKilled && !err.includes('Time Limit Exceeded')) {
        pushLog('✗ Process terminated by signal', 'err');
      } else if (exitCode !== 0) {
        pushLog(`✗ Runtime Error (Exit Code: ${exitCode})`, 'err');
        if (err) {
          // Parse error for line numbers and specific error types
          const parsedError = parseError(err);
          pushLog(parsedError.message, 'err');
        }
      } else {
        if (out) pushLog(out, 'out');
        if (err) pushLog(err, 'err');
        if (!out && !err) pushLog('(no output)', 'sys');
      }
      
      // Set execution metrics
      setExecutionMetrics({
        status: err && err.includes('Time Limit Exceeded') ? 'TLE' : 
                signalKilled ? 'KILLED' : exitCode !== 0 ? 'ERROR' : 'SUCCESS',
        executionTime: executionTime || 'N/A',
        memoryUsed: memoryUsed || 'N/A',
        exitCode: exitCode || 0
      });
      
      if (!signalKilled && exitCode === 0 && !(err && err.includes('Time Limit Exceeded'))) {
        pushLog(`✓ ${executionTime}ms · ${Math.round((memoryUsed || 0) / 1024)} KB`, 'sys');
      }
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        pushLog('✗ Execution stopped by user', 'err');
      } else {
        pushLog(`✗ ${e.response?.data?.message || e.message}`, 'err');
      }
      setExecutionMetrics({
        status: 'FAILED',
        executionTime: 'N/A',
        memoryUsed: 'N/A'
      });
    } finally { 
      setLoading(false);
      setIsRunning(false);
      setAbortController(null);
    }
  };
  
  /* ── Stop Execution ── */
  const handleStop = () => {
    if (abortController) {
      abortController.abort();
      pushLog('⏹️  Execution stopped by user', 'sys');
      setIsRunning(false);
      setLoading(false);
      setExecutionMetrics({
        status: 'STOPPED',
        executionTime: 'N/A',
        memoryUsed: 'N/A'
      });
    }
  };
  
  /* ── Parse Error Messages ── */
  const parseError = (errorString) => {
    // Try to extract line numbers and error types
    const patterns = [
      { regex: /segmentation fault/i, type: 'Segmentation Fault', suggestion: 'Check array bounds and pointer usage' },
      { regex: /division by zero/i, type: 'Division by Zero', suggestion: 'Check denominator before division' },
      { regex: /index out of range/i, type: 'Index Out of Range', suggestion: 'Check array/list bounds' },
      { regex: /null pointer/i, type: 'Null Pointer Exception', suggestion: 'Initialize variables before use' },
      { regex: /stack overflow/i, type: 'Stack Overflow', suggestion: 'Reduce recursion depth or stack usage' },
      { regex: /memory.*exhausted/i, type: 'Memory Limit Exceeded', suggestion: 'Optimize memory usage' }
    ];
    
    let message = errorString;
    let lineMatch = errorString.match(/line\s+(\d+)/i);
    
    for (const pattern of patterns) {
      if (pattern.regex.test(errorString)) {
        message = `Runtime Error: ${pattern.type}`;
        if (lineMatch) {
          message += ` (Line ${lineMatch[1]})`;
        }
        message += `\n💡 ${pattern.suggestion}`;
        break;
      }
    }
    
    return { message };
  };

  /* ── AI ── */
  const handleAi = async () => {
    setLoading(true);
    pushLog('🤖 Analysing code…', 'sys');
    try {
      const { data } = await api.post('/codegen/detect-ai', { code: getCode() });
      setAiResult(data.data);
      pushLog('✓ Analysis complete.', 'sys');
    } catch { pushLog('✗ AI analysis failed.', 'err'); }
    finally { setLoading(false); }
  };

  /* ── Helpers ── */
  const handleCopy  = () => { navigator.clipboard.writeText(getCode()); pushLog('📋 Copied.', 'sys'); };
  const handleReset = () => {
    const t = TEMPLATES[langId];
    setCode(t);
    editorRef.current?.setValue(t);
    setLogs([]);
    setAiResult(null);
  };

  const aiVerdict = !aiResult ? null
    : aiResult.aiProbability > 60 ? { label: 'Likely AI-generated',  sev: 'warning' }
    : aiResult.aiProbability > 40 ? { label: 'Possibly AI-assisted', sev: 'info'    }
    :                                { label: 'Appears human-written', sev: 'success' };

  /* ═══════ RENDER ═══════ */
  return (
    <Layout>
      {/*
        Layout gives us:  flex-col  min-h-screen
          └─ <main flexGrow:1>   ← our content fills this
          └─ <Footer>

        We want the IDE to fill all available space without causing page scroll.
        Using flex: 1 and height: 100% on the outer container will make it fill
        the available space within the Layout's main element.
      */}
      <Box
        sx={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f8fafc',
          overflow: 'hidden',
        }}
      >
        {/* ══ IDE Header Bar ══════════════════════════════════════════════ */}
        <Box
          sx={{
            px: 3, py: 1.25,
            bgcolor: 'white',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          {/* Left: page title */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
              Code Compiler
            </Typography>
            <Divider orientation="vertical" flexItem />
            {/* Language Select */}
            <FormControl size="small">
              <Select
                value={langId}
                onChange={e => setLangId(e.target.value)}
                sx={{
                  height: 32, minWidth: 155, fontSize: '0.82rem',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                }}
              >
                {LANGS.map(l => (
                  <MenuItem key={l.id} value={l.id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: l.dot, flexShrink: 0 }} />
                      <span>{l.label}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
              main{lang.ext}
            </Typography>
          </Stack>

          {/* Right: actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Copy code"><IconButton size="small" onClick={handleCopy} sx={{ color: '#64748b' }}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
            <Tooltip title="Reset to template"><IconButton size="small" onClick={handleReset} sx={{ color: '#64748b' }}><RestartAltIcon fontSize="small" /></IconButton></Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Button
              variant="contained" size="small"
              startIcon={loading ? <CircularProgress size={13} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleRun} disabled={loading}
              sx={{
                bgcolor: '#22c55e', '&:hover': { bgcolor: '#16a34a' },
                px: 2, borderRadius: 1.5, fontSize: '0.8rem',
                '&.Mui-disabled': { bgcolor: '#bbf7d0', color: '#166534' }
              }}
            >
              {loading ? 'Running…' : 'Run'}
            </Button>
            
            {isRunning && (
              <Button
                variant="outlined" size="small"
                startIcon={<StopIcon />}
                onClick={handleStop}
                sx={{
                  color: '#ef4444', borderColor: '#fca5a5',
                  px: 2, borderRadius: 1.5, fontSize: '0.8rem',
                  '&:hover': { borderColor: '#ef4444', bgcolor: '#fef2f2' }
                }}
              >
                Stop
              </Button>
            )}
            <Button
              variant="outlined" size="small"
              startIcon={<AutoAwesomeIcon sx={{ fontSize: 15 }} />}
              onClick={handleAi} disabled={loading}
              sx={{ color: '#6366f1', borderColor: '#c7d2fe', px: 2, borderRadius: 1.5, fontSize: '0.8rem' }}
            >
              AI Check
            </Button>
          </Stack>
        </Box>

        {/* ══ Main IDE Area (fills remaining height) ═══════════════════════ */}
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* ── Editor + Console column ─────────────────────────────────── */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* Monaco Editor — fills all available vertical space */}
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Editor
                height="100%"
                language={lang.monaco}
                theme="vs-dark"
                value={code}
                onChange={v => setCode(v ?? '')}
                onMount={e => { editorRef.current = e; }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  lineNumbersMinChars: 3,
                  fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
                  fontLigatures: true,
                  renderWhitespace: 'none',
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                }}
              />
            </Box>

            {/* ── Console Panel ──────────────────────────────────────────── */}
            <Box
              sx={{
                position: 'sticky',
                bottom: 0,
                borderTop: '1px solid #334155',
                bgcolor: '#0f172a',
                display: 'flex', flexDirection: 'column',
                height: consoleOpen ? 200 : 38,
                transition: 'height 0.25s ease',
                zIndex: 10,
              }}
            >
              {/* Console toolbar */}
              <Box
                sx={{
                  px: 2, py: 0.5, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  borderBottom: consoleOpen ? '1px solid #1e293b' : 'none',
                }}
              >
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <TerminalIcon sx={{ color: '#64748b', fontSize: 14 }} />
                  <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                    Console
                  </Typography>
                  {logs.some(l => l.type === 'err') && (
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#ef4444' }} />
                  )}
                  {logs.some(l => l.type === 'out') && !logs.some(l => l.type === 'err') && (
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#22c55e' }} />
                  )}
                </Stack>
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Clear"><IconButton size="small" sx={{ color: '#64748b' }} onClick={() => setLogs([])}><DeleteSweepIcon sx={{ fontSize: 14 }} /></IconButton></Tooltip>
                  <IconButton size="small" sx={{ color: '#64748b' }} onClick={() => setConsoleOpen(!consoleOpen)}>
                    {consoleOpen ? <ExpandMoreIcon sx={{ fontSize: 14 }} /> : <ExpandLessIcon sx={{ fontSize: 14 }} />}
                  </IconButton>
                </Stack>
              </Box>

              {/* Log lines */}
              {consoleOpen && (
                <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1, fontFamily: '"Fira Code", Consolas, monospace' }}>
                  {logs.length === 0
                    ? <Typography sx={{ color: '#334155', fontSize: '0.78rem' }}>
                        Click <span style={{ color: '#4ade80' }}>Run</span> to execute your code…
                      </Typography>
                    : logs.map((l, i) => (
                        <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 0.35 }}>
                          <Typography sx={{ color: '#1e3a5f', fontSize: '0.7rem', minWidth: 65, pt: 0.2, flexShrink: 0 }}>{l.ts}</Typography>
                          <Typography sx={{ color: LOG_COLOR[l.type] || '#e2e8f0', fontSize: '0.8rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {l.text}
                          </Typography>
                        </Box>
                      ))
                  }
                  <div ref={logEnd} />
                </Box>
              )}
            </Box>
          </Box>

          {/* ── Right Sidebar ────────────────────────────────────────────── */}
          <Box
            sx={{
              width: 300, flexShrink: 0,
              borderLeft: '1px solid #e2e8f0',
              bgcolor: 'white',
              overflowY: 'auto',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Language Switcher */}
            <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Language
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75} mt={1}>
                {LANGS.map(l => (
                  <Chip
                    key={l.id} label={l.label} size="small"
                    onClick={() => setLangId(l.id)}
                    sx={{
                      bgcolor: langId === l.id ? l.dot : '#f1f5f9',
                      color:   langId === l.id ? '#fff'  : '#475569',
                      fontWeight: 500, cursor: 'pointer', fontSize: '0.72rem',
                      '&:hover': { opacity: 0.85 }, transition: '0.2s',
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Execution Metrics */}
            <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimerIcon sx={{ fontSize: 13, color: '#059669' }} /> Execution Metrics
              </Typography>
              
              {!executionMetrics ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Run code to see metrics
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} mt={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Chip 
                      size="small" 
                      label={executionMetrics.status}
                      sx={{
                        bgcolor: executionMetrics.status === 'SUCCESS' ? '#dcfce7' :
                               executionMetrics.status === 'ERROR' ? '#fee2e2' :
                               executionMetrics.status === 'TLE' ? '#fef3c7' :
                               executionMetrics.status === 'STOPPED' ? '#e0e7ff' : '#f3f4f6',
                        color: executionMetrics.status === 'SUCCESS' ? '#166534' :
                               executionMetrics.status === 'ERROR' ? '#991b1b' :
                               executionMetrics.status === 'TLE' ? '#92400e' :
                               executionMetrics.status === 'STOPPED' ? '#3730a3' : '#6b7280',
                        fontSize: '0.7rem',
                        fontWeight: 600
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <TimerIcon sx={{ fontSize: 12, color: '#64748b' }} />
                      <Typography variant="caption" color="text.secondary">Time</Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={600} color="#059669">
                      {executionMetrics.executionTime}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <MemoryIcon sx={{ fontSize: 12, color: '#64748b' }} />
                      <Typography variant="caption" color="text.secondary">Memory</Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={600} color="#7c3aed">
                      {typeof executionMetrics.memoryUsed === 'number' 
                        ? `${Math.round(executionMetrics.memoryUsed / 1024)} KB`
                        : executionMetrics.memoryUsed
                      }
                    </Typography>
                  </Box>
                  
                  {executionMetrics.exitCode !== undefined && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Exit Code</Typography>
                      <Typography variant="caption" fontWeight={600} 
                        sx={{ color: executionMetrics.exitCode === 0 ? '#059669' : '#dc2626' }}>
                        {executionMetrics.exitCode}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>

            {/* Stdin */}
            <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9' }}>
              <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Standard Input
              </Typography>
              <TextField
                fullWidth multiline minRows={2} maxRows={4}
                placeholder="Enter input here if required…"
                value={stdin}
                onChange={e => setStdin(e.target.value)}
                size="small" variant="outlined"
                sx={{ mt: 1, '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '0.82rem' } }}
              />
            </Box>

            {/* AI Analysis */}
            <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', flex: 1 }}>
              <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AutoAwesomeIcon sx={{ fontSize: 13, color: '#6366f1' }} /> AI Analysis
              </Typography>

              {!aiResult ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 36, color: '#e2e8f0', mb: 0.75 }} />
                  <Typography variant="caption" color="text.secondary" display="block">
                    Click <strong>AI Check</strong> to analyse code patterns.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1.5} mt={1}>
                  {[
                    { label: 'AI Probability', val: aiResult.aiProbability, col: aiResult.aiProbability > 60 ? '#ef4444' : '#f59e0b' },
                    { label: 'Human Score',    val: aiResult.humanScore,    col: '#22c55e' },
                  ].map(({ label, val, col }) => (
                    <Box key={label}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="caption" fontWeight={700} sx={{ color: col }}>{val}%</Typography>
                      </Stack>
                      <Box sx={{ mt: 0.5, height: 6, bgcolor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ width: `${val}%`, height: '100%', bgcolor: col, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </Box>
                    </Box>
                  ))}
                  <Alert
                    severity={aiVerdict.sev}
                    icon={aiVerdict.sev === 'success' ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />}
                    sx={{ borderRadius: 2, py: 0.25, fontSize: '0.78rem' }}
                  >
                    <Typography variant="caption" fontWeight={600}>{aiVerdict.label}</Typography>
                  </Alert>
                  {aiResult.suggestions?.map((s, i) => (
                    <Box key={i} sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5, borderLeft: '3px solid #6366f1' }}>
                      <Typography variant="caption" color="text.secondary">• {s}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Tips */}
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                💡 Tips
              </Typography>
              <Stack spacing={1} mt={1}>
                {[
                  ['Python',     'Indentation required. Use main() as entry.'],
                  ['JavaScript', 'Runs in Node.js. Use console.log().'],
                  ['Java',       'Class must be named Main.'],
                  ['C / C++',    'Include headers. Return 0 from main().'],
                ].map(([t, d]) => (
                  <Box key={t} sx={{ p: 1, bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="#2563eb">{t}</Typography>
                    <Typography variant="body2" color="text.secondary" fontSize="0.73rem" mt={0.25}>{d}</Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
