"use client";

import { useState } from "react";

export function PasswordField() {
  const [show, setShow] = useState(false);
  return (
    <label className="block">
      <span className="label">Password</span>
      <input
        name="password"
        type={show ? "text" : "password"}
        required
        autoFocus
        autoComplete="current-password"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className="input"
      />
      <span className="mt-2 flex items-center gap-2 text-xs text-black/60">
        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-dusk-700" />
        Show password
      </span>
    </label>
  );
}
