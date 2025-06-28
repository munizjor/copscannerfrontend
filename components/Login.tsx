import React, { useState } from "react";
import styles from "./Login.module.css";

export default function Login({ onLogin }: { onLogin: (user: { username: string }) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError("Invalid username or password");
      }
    } catch {
      setError("Login failed");
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Sherlock IQ</h1>
      </header>
      <div className={styles.centered}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>Login</h2>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={styles.input} />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
      <footer className={styles.footer}>
        &copy; 2025 Sherlock IQ. All rights reserved. | v1.0.0
      </footer>
    </div>
  );
}
