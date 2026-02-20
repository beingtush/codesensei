"use client";

import { useCallback } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  readOnly?: boolean;
  height?: string;
}

export default function CodeEditor({
  value,
  onChange,
  language = "python",
  readOnly = false,
  height = "400px",
}: CodeEditorProps) {
  const handleMount: OnMount = useCallback((editor) => {
    // Focus the editor on mount
    setTimeout(() => editor.focus(), 100);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        onMount={handleMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbers: "on",
          renderLineHighlight: "line",
          tabSize: 4,
          wordWrap: "on",
          readOnly,
          cursorBlinking: "smooth",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          suggestOnTriggerCharacters: true,
        }}
      />
    </div>
  );
}
