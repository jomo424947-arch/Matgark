#!/usr/bin/env python3
"""
Optional standalone HTTP streaming microservice for Matgarak Python AI Copilot.
Run with: python3 python-ai/server.py
(Next.js also runs python-ai/merchant_agent.py directly out-of-the-box without needing a second server.)
"""

import json
import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

AGENT_SCRIPT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "merchant_agent.py")
PORT = int(os.environ.get("PYTHON_AI_PORT", "8001"))


class CopilotHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            groq_ready = bool(os.environ.get("GROQ_API_KEY", "").strip())
            body = json.dumps(
                {
                    "ok": True,
                    "runtime": "python",
                    "groqConfigured": groq_ready,
                    "model": os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"),
                }
            ).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(body)
            return
        self.send_response(404)
        self.end_headers()

    def do_POST(self):
        if self.path != "/chat/stream":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(min(length, 256_000))

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()

        proc = subprocess.Popen(
            [sys.executable, AGENT_SCRIPT],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        assert proc.stdin and proc.stdout
        proc.stdin.write(raw)
        proc.stdin.close()

        for line in proc.stdout:
            decoded = line.decode("utf-8", errors="ignore").strip()
            if decoded:
                self.wfile.write(f"data: {decoded}\n\n".encode("utf-8"))
                self.wfile.flush()
        proc.wait()


if __name__ == "__main__":
    print(f"[Matgarak Python AI] Listening on http://127.0.0.1:{PORT}")
    ThreadingHTTPServer(("127.0.0.1", PORT), CopilotHandler).serve_forever()
