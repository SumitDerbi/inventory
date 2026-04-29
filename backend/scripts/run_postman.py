"""Run the Postman collection against a freshly-started dev server.

Usage:  .venv/Scripts/python.exe scripts/run_postman.py

Requires `npx` on PATH (Node).
"""
from __future__ import annotations

import os
import shutil
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ROOT.parent
COLLECTION = REPO_ROOT / "postman" / "inventory.postman_collection.json"
ENVIRONMENT = REPO_ROOT / "postman" / "environments" / "local.postman_environment.json"


def find_free_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def wait_until_up(port: int, timeout: float = 30.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1.0):
                return
        except OSError:
            time.sleep(0.5)
    raise RuntimeError(f"server on :{port} did not respond in {timeout}s")


def main() -> int:
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if not npx:
        sys.stderr.write("npx not found on PATH; install Node.js.\n")
        return 2

    py = sys.executable
    env = {**os.environ, "DJANGO_SETTINGS_MODULE": "config.settings.dev"}

    # Seed admin (idempotent).
    seed = subprocess.run(
        [py, "scripts/seed_postman_admin.py"], cwd=ROOT, env=env, capture_output=True, text=True
    )
    if seed.returncode != 0:
        sys.stderr.write(seed.stderr)
        return seed.returncode
    admin_user_id = ""
    for line in seed.stdout.splitlines():
        if line.startswith("admin_user_id="):
            admin_user_id = line.split("=", 1)[1].strip()

    port = find_free_port()
    server = subprocess.Popen(
        [py, "manage.py", "runserver", f"127.0.0.1:{port}", "--noreload", "--insecure"],
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    try:
        wait_until_up(port)
        cmd = [
            npx, "--yes", "newman@6", "run", str(COLLECTION),
            "-e", str(ENVIRONMENT),
            "--env-var", f"base_url=http://127.0.0.1:{port}",
            "--env-var", f"admin_user_id={admin_user_id}",
            "--reporters", "cli",
        ]
        proc = subprocess.run(cmd, cwd=REPO_ROOT)
        return proc.returncode
    finally:
        if server.poll() is None:
            if os.name == "nt":
                server.send_signal(signal.CTRL_BREAK_EVENT) if False else server.terminate()
            else:
                server.terminate()
            try:
                server.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server.kill()


if __name__ == "__main__":
    sys.exit(main())
