#!/usr/bin/env python3
"""
8x assignment prompt/response capture hook for Claude Code.

Fires automatically from .claude/settings.json:
  - UserPromptSubmit -> `capture.py prompt`  (records the verbatim prompt)
  - Stop             -> `capture.py response`(records the FINAL assistant text only)

Design goals:
  - Never break the session. Any error -> exit 0 silently.
  - One markdown file per session in .agent-logs/, named
    YYYY-MM-DD_HH-MM-SS_<session-id>.md
  - Capture ONLY the prompt and the final response. No thinking, no tool
    calls, no intermediate assistant narration.
"""

import sys
import os
import json
import re
from datetime import datetime, timezone

AUTHOR = "imlaak"          # github handle used in frontmatter
TOOL = "claude-code"
PROJECT = "NoteFlow"

# Resolve .agent-logs/ relative to the repo root (this file lives in
# <repo>/.claude/hooks/capture.py).
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LOG_DIR = os.path.join(REPO_ROOT, ".agent-logs")


def now_iso():
    """UTC timestamp like 2026-08-28T09:14:02.118Z"""
    n = datetime.now(timezone.utc)
    return n.strftime("%Y-%m-%dT%H:%M:%S.") + f"{n.microsecond // 1000:03d}Z"


def short_id(session_id):
    return (session_id or "unknown").split("-")[0][:8]


def read_stdin_json():
    try:
        raw = sys.stdin.read()
        return json.loads(raw) if raw.strip() else {}
    except Exception:
        return {}


def find_session_file(session_id):
    """Return existing log file path for this session, or None."""
    if not os.path.isdir(LOG_DIR):
        return None
    suffix = f"_{session_id}.md"
    for name in os.listdir(LOG_DIR):
        if name.endswith(suffix):
            return os.path.join(LOG_DIR, name)
    return None


def new_session_file(session_id):
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d_%H-%M-%S")
    return os.path.join(LOG_DIR, f"{stamp}_{session_id}.md")


def parse_transcript(path):
    """Yield parsed JSON objects from a JSONL transcript, tolerating junk."""
    try:
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    yield json.loads(line)
                except Exception:
                    continue
    except Exception:
        return


def latest_model(transcript_path):
    """Most recent assistant model in the transcript, or None."""
    model = None
    for obj in parse_transcript(transcript_path):
        msg = obj.get("message") or {}
        if obj.get("type") == "assistant" or msg.get("role") == "assistant":
            m = msg.get("model")
            if m:
                model = m
    return model


def final_response_text(transcript_path):
    """
    The final assistant response for the just-finished turn.
    We take the LAST assistant message that contains text blocks and return
    only its text content joined -- deliberately excluding thinking blocks,
    tool_use/tool_result, and any earlier intermediate assistant narration.
    Returns (text, model).
    """
    last_text = None
    last_model = None
    for obj in parse_transcript(transcript_path):
        msg = obj.get("message") or {}
        is_assistant = obj.get("type") == "assistant" or msg.get("role") == "assistant"
        if not is_assistant:
            continue
        content = msg.get("content")
        texts = []
        if isinstance(content, str):
            if content.strip():
                texts.append(content)
        elif isinstance(content, list):
            for block in content:
                if isinstance(block, dict) and block.get("type") == "text":
                    t = block.get("text", "")
                    if t.strip():
                        texts.append(t)
        if texts:
            last_text = "\n".join(texts)
            last_model = msg.get("model") or last_model
    return last_text, last_model


# ---- frontmatter maintenance -------------------------------------------------

def split_doc(text):
    """Return (frontmatter_dict_ordered_lines, body) from an existing file."""
    if text.startswith("---\n"):
        end = text.find("\n---\n", 4)
        if end != -1:
            fm = text[4:end]
            body = text[end + 5:]
            return fm, body
    return "", text


def count_prompts(body):
    return len(re.findall(r"\[LOG_ENTRY type=PROMPT ", body))


def all_prompt_times(body):
    return re.findall(
        r"\[LOG_ENTRY type=PROMPT [^\]]*\]\ntimestamp: ([^\n]+)", body
    )


def build_frontmatter(session_id, date, model, total, first_t, last_t):
    return (
        "---\n"
        f"session_id: {session_id}\n"
        f"date: {date}\n"
        f"author: {AUTHOR}\n"
        f"model: {model}\n"
        f"tool: {TOOL}\n"
        f"project: {PROJECT}\n"
        f"total_exchanges: {total}\n"
        f"first_prompt_time: {first_t}\n"
        f"last_prompt_time: {last_t}\n"
        "---\n"
    )


def write_file(path, frontmatter, body):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(frontmatter + body)
    os.replace(tmp, path)


def get_prompt_text(data):
    # Field name has varied across Claude Code versions; accept known variants.
    for key in ("prompt", "prompt_text", "user_prompt", "text"):
        v = data.get(key)
        if isinstance(v, str) and v.strip():
            return v
    return ""


def handle_prompt(data):
    session_id = data.get("session_id", "unknown")
    prompt = get_prompt_text(data)
    ts = now_iso()
    model = latest_model(data.get("transcript_path", "")) or "pending"

    os.makedirs(LOG_DIR, exist_ok=True)
    path = find_session_file(session_id)
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if path and os.path.exists(path):
        text = open(path, "r", encoding="utf-8").read()
        _, body = split_doc(text)
        # keep original date from filename if possible
        base = os.path.basename(path)
        m = re.match(r"(\d{4}-\d{2}-\d{2})_", base)
        if m:
            date = m.group(1)
    else:
        path = new_session_file(session_id)
        body = (
            f"\n# Session Log - {date}\n\n"
            f"Session: `{short_id(session_id)}` | Project: `{PROJECT}` | "
            f"Author: `{AUTHOR}`\n\n---\n\n"
        )

    num = count_prompts(body) + 1
    entry = (
        f"[LOG_ENTRY type=PROMPT num={num} session={short_id(session_id)}]\n"
        f"timestamp: {ts}\n"
        f"model: {model}\n\n"
        f"{prompt}\n\n\n"
    )
    body += entry

    times = all_prompt_times(body)
    first_t = times[0] if times else ts
    last_t = times[-1] if times else ts
    fm = build_frontmatter(session_id, date, model, count_prompts(body), first_t, last_t)
    write_file(path, fm, body)


def handle_response(data):
    session_id = data.get("session_id", "unknown")
    ts = now_iso()

    # Prefer the final-message field the Stop hook may provide directly; it is
    # already just the final assistant text (no thinking / tool calls). Fall
    # back to parsing the transcript if that field is absent/empty.
    text, model = None, None
    for key in ("last_assistant_message", "assistant_message", "response"):
        v = data.get(key)
        if isinstance(v, str) and v.strip():
            text = v
            break
    if text is None:
        text, model = final_response_text(data.get("transcript_path", ""))
    if text is None:
        text = "(no textual response captured for this turn)"
    if not model:
        model = latest_model(data.get("transcript_path", "")) or "unknown"

    os.makedirs(LOG_DIR, exist_ok=True)
    path = find_session_file(session_id)
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    if not (path and os.path.exists(path)):
        # A response with no preceding prompt file: create a minimal one.
        path = new_session_file(session_id)
        body = (
            f"# Session Log - {date}\n\n"
            f"Session: `{short_id(session_id)}` | Project: `{PROJECT}` | "
            f"Author: `{AUTHOR}`\n\n---\n\n"
        )
    else:
        full = open(path, "r", encoding="utf-8").read()
        _, body = split_doc(full)
        base = os.path.basename(path)
        m = re.match(r"(\d{4}-\d{2}-\d{2})_", base)
        if m:
            date = m.group(1)

    # Backfill a "pending" model on the most recent PROMPT entry.
    if model and model != "unknown":
        body = re.sub(
            r"(\[LOG_ENTRY type=PROMPT [^\]]*\]\ntimestamp: [^\n]+\nmodel: )pending",
            r"\1" + model,
            body,
        )

    num = max(count_prompts(body), 1)
    entry = (
        f"[LOG_ENTRY type=RESPONSE num={num} session={short_id(session_id)}]\n"
        f"timestamp: {ts}\n"
        f"model: {model}\n\n"
        f"{text}\n\n\n"
    )
    body += entry

    times = all_prompt_times(body)
    first_t = times[0] if times else ts
    last_t = times[-1] if times else ts
    fm = build_frontmatter(session_id, date, model, count_prompts(body), first_t, last_t)
    write_file(path, fm, body)


def main():
    try:
        mode = sys.argv[1] if len(sys.argv) > 1 else ""
        data = read_stdin_json()
        if mode == "prompt":
            handle_prompt(data)
        elif mode == "response":
            handle_response(data)
    except Exception:
        pass
    # Always succeed so we never interfere with the session.
    sys.exit(0)


if __name__ == "__main__":
    main()
