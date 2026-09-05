"use client";

import { useEffect, useState } from "react";
import "./dashboard.css";
interface EmailSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function EmailSearch({ value, onChange }: EmailSearchProps) {
  const [input, setInput] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(input);
    }, 350);

    return () => clearTimeout(timer);
  }, [input, onChange]);

  return (
    <div className="email-search">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="email-search-icon"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>

      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Search emails..."
        className="email-search-input"
      />
    </div>
  );
}
