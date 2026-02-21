"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  language: "python" | "java" | "text";
  initialValue?: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const TRACK_LANGUAGE_MAP: Record<string, "python" | "java" | "text"> = {
  "python-advanced": "python",
  "java-enterprise": "java",
  "dsa-mastery": "python",
  "automation-devops": "python",
};

export function getLanguageForTrack(track: string): "python" | "java" | "text" {
  return TRACK_LANGUAGE_MAP[track] || "text";
}

export default function CodeEditor({ language, initialValue = "", onChange, readOnly = false }: CodeEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/50">
      <div className="flex items-center gap-2 border-b border-slate-700/50 bg-slate-800/50 px-4 py-2">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/60" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
          <div className="h-3 w-3 rounded-full bg-green-500/60" />
        </div>
        <span className="ml-2 text-xs text-slate-500">{language}</span>
      </div>
      <Editor
        height="400px"
        language={language}
        value={initialValue}
        theme="vs-dark"
        onChange={(value) => onChange(value || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          readOnly,
          padding: { top: 16 },
          renderLineHighlight: "gutter",
          scrollbar: {
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
    </div>
  );
}
