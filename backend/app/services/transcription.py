"""Phase 4 transcription orchestration: normalize Recall/AssemblyAI transcripts and run the
idempotent background jobs that create + download + persist them.

The download-artifact JSON shape must be reconciled with the real Recall payload when we run the
live transcript test; `normalize_transcript` is written defensively for the documented shapes and
is unit-tested with a representative fixture.
"""
from __future__ import annotations

import logging

from sqlalchemy.exc import IntegrityError

from app.config import get_settings
from app.db import SessionLocal
from app.models import Job, Meeting, MeetingParticipant, TranscriptSegment
from app.services.recall import get_recall_service

DEFAULT_SOURCE = "assembly_ai_async"
log = logging.getLogger("noteflow.transcription")


# ── Normalization (pure) ────────────────────────────────────────────────────────

def _word_time_seconds(obj: dict, key: str) -> float | None:
    """Best-effort extract a start/end time in seconds from varied word/segment shapes."""
    ts = obj.get(f"{key}_timestamp")
    if isinstance(ts, dict):
        v = ts.get("relative", ts.get("absolute"))
        if v is not None:
            try:
                return float(v)
            except (TypeError, ValueError):
                pass
    for k in (key, f"{key}_time", f"{key}_seconds"):
        if obj.get(k) is not None:
            try:
                return float(obj[k])
            except (TypeError, ValueError):
                pass
    if obj.get(f"{key}_ms") is not None:
        try:
            return float(obj[f"{key}_ms"]) / 1000.0
        except (TypeError, ValueError):
            pass
    return None


# Split a speaker's word stream into readable, timestamped lines.
_MAX_WORDS = 45
_MAX_SPAN_S = 18.0
_MIN_SENTENCE_WORDS = 6


def _entry_speaker(entry: dict) -> str | None:
    """Real Recall shape carries `participant.name`; older/simpler shapes use `speaker`."""
    part = entry.get("participant")
    if isinstance(part, dict):
        name = part.get("name")
        if name:
            return str(name)
        if part.get("id") is not None:
            return f"Speaker {part['id']}"
    speaker = entry.get("speaker", entry.get("speaker_label"))
    if isinstance(speaker, int):
        return f"Speaker {speaker}"
    return str(speaker) if speaker not in (None, "") else None


def _chunk_words(words: list) -> list[tuple[str, float, float]]:
    """Group a participant's words into natural lines (sentence-ish, capped by words/duration)."""
    chunks: list[tuple[str, float, float]] = []
    cur: list[tuple[str, float, float]] = []
    for w in words:
        if not isinstance(w, dict):
            continue
        txt = (w.get("text") or "").strip()
        if not txt:
            continue
        start = _word_time_seconds(w, "start")
        end = _word_time_seconds(w, "end")
        start = start if start is not None else (cur[-1][2] if cur else 0.0)
        end = end if end is not None else start
        cur.append((txt, start, end))
        span = cur[-1][2] - cur[0][1]
        ends_sentence = txt[-1] in ".?!"
        if (ends_sentence and len(cur) >= _MIN_SENTENCE_WORDS) or len(cur) >= _MAX_WORDS or span >= _MAX_SPAN_S:
            chunks.append((" ".join(t for t, _, _ in cur).strip(), cur[0][1], cur[-1][2]))
            cur = []
    if cur:
        chunks.append((" ".join(t for t, _, _ in cur).strip(), cur[0][1], cur[-1][2]))
    return chunks


def _entries(payload) -> list:
    """Unwrap the artifact's entry list from the documented container shapes ([] if none)."""
    entries = payload
    if isinstance(payload, dict):
        entries = []
        for key in ("transcript", "segments", "utterances", "monologues", "results"):
            if isinstance(payload.get(key), list):
                entries = payload[key]
                break
    return entries if isinstance(entries, list) else []


def _entry_participant(entry: dict) -> dict:
    """Observed participant metadata for one entry — ONLY what the payload actually carries.
    Never fabricates a name or email, never invents an id. (Phase 6B: the id/name that Perfect
    Diarization already delivers in the artifact, which used to be discarded past speaker_label.)"""
    provider_pid = None
    display_name = None
    email = None
    part = entry.get("participant")
    if isinstance(part, dict):
        if part.get("id") is not None:
            provider_pid = str(part["id"])
        if part.get("name"):
            display_name = str(part["name"])
        if part.get("email"):  # real providers rarely include this; use it only if present
            email = str(part["email"])
    return {"provider_participant_id": provider_pid, "display_name": display_name, "email": email}


def normalize_with_participants(payload, source: str = DEFAULT_SOURCE) -> tuple[list[dict], list[dict]]:
    """Like `normalize_transcript`, but also returns a parallel list of observed participant
    metadata (one per segment). The segment dicts are byte-identical to `normalize_transcript`'s
    output; the metas let ingestion build MeetingParticipant rows and link segments to them."""
    segments: list[dict] = []
    metas: list[dict] = []
    seq = 0
    for entry in _entries(payload):
        if not isinstance(entry, dict):
            continue
        speaker_label = _entry_speaker(entry)
        meta = _entry_participant(entry)
        meta["speaker_label"] = speaker_label
        words = entry.get("words")

        if isinstance(words, list) and words:
            lines = _chunk_words(words)
        else:
            text = (entry.get("text") or "").strip()
            if not text:
                continue
            start_s = _word_time_seconds(entry, "start") or 0.0
            end_s = _word_time_seconds(entry, "end") or start_s
            lines = [(text, start_s, end_s)]

        for text, start_s, end_s in lines:
            if not text:
                continue
            segments.append(
                {
                    "speaker_label": speaker_label,
                    "text": text,
                    "start_ms": int(round(start_s * 1000)),
                    "end_ms": int(round(end_s * 1000)),
                    "sequence": seq,
                    "source": source,
                }
            )
            metas.append(meta)
            seq += 1
    return segments, metas


def normalize_transcript(payload, source: str = DEFAULT_SOURCE) -> list[dict]:
    """Turn a Recall transcript artifact into ordered, readable segment dicts.

    Real Recall async shape: a list of {participant:{name,...}, words:[{text,start_timestamp,
    end_timestamp}]} — one entry per speaker turn. We split each turn into short timestamped lines
    (better reading + seek granularity). Also handles {speaker,text,start,end} entries. [] if empty.
    Participant-aware ingestion uses `normalize_with_participants`; this stays the pure segment view.
    """
    segments, _ = normalize_with_participants(payload, source)
    return segments


def _participant_key(meta: dict) -> str | None:
    """Stable per-meeting identity for an observed participant: a stable provider id when present,
    else the diarization label. None when neither exists → the segment stays unlinked (correct)."""
    pid = meta.get("provider_participant_id")
    if pid:
        return f"pid:{pid}"
    label = meta.get("speaker_label")
    if label:
        return f"label:{label}"
    return None


def _sync_participants(db, meeting, metas: list[dict]) -> dict[str, str]:
    """Get-or-create one MeetingParticipant per DISTINCT observed participant in this meeting and
    return {participant_key: participant_id}. Idempotent (get-or-create) so reprocessing/retries
    never duplicate. NEVER creates a Person and NEVER sets person_id — identity resolution is 6C.
    A shared display name with distinct provider ids stays two rows (keyed by provider id)."""
    distinct: dict[str, dict] = {}
    for meta in metas:
        key = _participant_key(meta)
        if key is None:
            continue
        agg = distinct.setdefault(key, {
            "provider_participant_id": meta.get("provider_participant_id"),
            "speaker_label": meta.get("speaker_label"),
        })
        # Enrich from whichever observation actually carries a real name/email.
        if meta.get("display_name") and not agg.get("display_name"):
            agg["display_name"] = meta["display_name"]
        if meta.get("email") and not agg.get("email"):
            agg["email"] = meta["email"]

    ids: dict[str, str] = {}
    for key, meta in distinct.items():
        pid = meta.get("provider_participant_id")
        label = meta.get("speaker_label")
        q = db.query(MeetingParticipant).filter(MeetingParticipant.meeting_id == meeting.id)
        if pid:
            row = q.filter(MeetingParticipant.provider_participant_id == pid).first()
        else:
            row = q.filter(
                MeetingParticipant.provider_participant_id.is_(None),
                MeetingParticipant.speaker_label == label,
            ).first()
        if row is None:
            row = MeetingParticipant(
                meeting_id=meeting.id,
                provider=meeting.provider,
                provider_participant_id=pid,
                display_name=meta.get("display_name"),
                speaker_label=label,
                email=meta.get("email"),
            )
            db.add(row)
            db.flush()  # assign id for segment linking, surface any race as IntegrityError here
        else:
            # Enrich an existing row without ever nulling a prior observation.
            if meta.get("display_name") and not row.display_name:
                row.display_name = meta["display_name"]
            if meta.get("email") and not row.email:
                row.email = meta["email"]
        ids[key] = row.id
    return ids


def extract_download_url(transcript_obj) -> str | None:
    if not isinstance(transcript_obj, dict):
        return None
    data = transcript_obj.get("data") if isinstance(transcript_obj.get("data"), dict) else {}
    return (data or {}).get("download_url") or transcript_obj.get("download_url")


# ── Job idempotency ─────────────────────────────────────────────────────────────

def enqueue_job(db, meeting_id: str, job_type: str, *, force: bool = False) -> bool:
    """Create a job row; returns True only if newly created (caller then schedules the work).

    Unique (meeting_id, type) guarantees duplicate webhook deliveries can't start duplicate work.
    With force=True (manual reprocess), an existing job is reset to pending and True is returned.
    """
    db.add(Job(meeting_id=meeting_id, type=job_type, status="pending"))
    try:
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        if force:
            job = _job(db, meeting_id, job_type)
            if job:
                job.status = "pending"
                job.error = None
                db.commit()
                return True
        return False


def _job(db, meeting_id: str, job_type: str) -> Job | None:
    return (
        db.query(Job)
        .filter(Job.meeting_id == meeting_id, Job.type == job_type)
        .first()
    )


# ── Background runners (own their DB session) ────────────────────────────────────

def _parse_iso(value):
    from datetime import datetime
    if not isinstance(value, str) or not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def reconcile_recording(db, meeting, recall) -> bool:
    """Fill recall_recording_id (+ real started/ended/duration) from the bot object when the
    webhook payload didn't carry them. Returns True if the meeting has a recording id after."""
    if meeting.recall_recording_id:
        return True
    if not meeting.recall_bot_id:
        return False
    bot = recall.get_bot(meeting.recall_bot_id)
    recordings = bot.get("recordings") or []
    if not recordings:
        log.warning("reconcile meeting_id=%s: bot has no recordings yet", meeting.id)
        return False
    rec = recordings[-1]
    meeting.recall_recording_id = rec.get("id")
    started = _parse_iso(rec.get("started_at"))
    ended = _parse_iso(rec.get("completed_at"))
    if started and not meeting.started_at:
        meeting.started_at = started
    if ended and not meeting.ended_at:
        meeting.ended_at = ended
    if meeting.duration_seconds is None and started and ended:
        meeting.duration_seconds = int((ended - started).total_seconds())
    db.commit()
    log.info("reconcile meeting_id=%s -> recording_id=%s", meeting.id, meeting.recall_recording_id)
    return bool(meeting.recall_recording_id)


def _recording_transcript_shortcut(bot: dict) -> dict:
    """The latest recording's media_shortcuts.transcript object ({} if absent)."""
    recordings = bot.get("recordings") or []
    if not recordings:
        return {}
    return (recordings[-1].get("media_shortcuts") or {}).get("transcript") or {}


def run_create_transcript(meeting_id: str) -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        meeting = db.get(Meeting, meeting_id)
        if not meeting:
            return
        job = _job(db, meeting_id, "create_transcript")
        if job:
            job.status = "running"
            job.attempts = (job.attempts or 0) + 1
            db.commit()
        try:
            recall = get_recall_service(settings.recall_api_key, settings.recall_region)
            # Real payloads may not carry the recording id — reconcile from the bot object.
            if not reconcile_recording(db, meeting, recall):
                # TRANSIENT: the recording often materializes on the bot object seconds after
                # the webhook. Leave the job pending for the sweeper to retry — never brand the
                # meeting failed over a race.
                if job:
                    job.status = "pending"
                    job.error = "No recording on the bot object yet; will retry."
                    db.commit()
                log.info("create_transcript meeting_id=%s: no recording yet, left pending", meeting_id)
                return

            # FAST PATH: the bot transcribes in realtime, so the recording usually already
            # carries a finished transcript — skip the async AssemblyAI job entirely.
            bot = recall.get_bot(meeting.recall_bot_id) if meeting.recall_bot_id else {}
            shortcut = _recording_transcript_shortcut(bot)
            if shortcut.get("id"):
                meeting.recall_transcript_id = shortcut["id"]
                if job:
                    job.status = "succeeded"
                    job.error = None
                db.commit()
                log.info("create_transcript meeting_id=%s: realtime transcript %s already exists -> processing",
                         meeting_id, shortcut["id"])
                if enqueue_job(db, meeting_id, "process_transcript"):
                    run_process_transcript(meeting_id)
                return

            log.info("create_transcript meeting_id=%s recording_id=%s -> calling Recall (async fallback)",
                     meeting_id, meeting.recall_recording_id)
            result = recall.create_transcript(meeting.recall_recording_id)
            log.info("create_transcript meeting_id=%s accepted by Recall transcript_id=%s",
                     meeting_id, (result or {}).get("id"))
            if job:
                job.status = "succeeded"
                job.error = None
            db.commit()
        except Exception as exc:  # noqa: BLE001 — persist truthful failure, never fake success
            db.rollback()
            log.exception("create_transcript FAILED meeting_id=%s: %s", meeting_id, exc)
            _record_failure(db, meeting_id, job_type="create_transcript",
                            code="create_transcript_failed", message=str(exc))
    finally:
        db.close()


def run_process_transcript(meeting_id: str) -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        meeting = db.get(Meeting, meeting_id)
        if not meeting:
            return
        # Idempotent: segments already persisted → nothing to do.
        if db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).count():
            return
        job = _job(db, meeting_id, "process_transcript")
        if job:
            job.status = "running"
            job.attempts = (job.attempts or 0) + 1
            db.commit()
        try:
            recall = get_recall_service(settings.recall_api_key, settings.recall_region)
            download_url = None
            if meeting.recall_transcript_id:
                transcript_obj = recall.get_transcript(meeting.recall_transcript_id)
                download_url = extract_download_url(transcript_obj)
            else:
                # Reconcile: the recording's media_shortcuts.transcript carries id + download_url.
                bot = recall.get_bot(meeting.recall_bot_id) if meeting.recall_bot_id else {}
                recordings = bot.get("recordings") or []
                shortcut = ((recordings[-1] if recordings else {}).get("media_shortcuts") or {}).get("transcript") or {}
                if shortcut.get("id"):
                    meeting.recall_transcript_id = shortcut["id"]
                    db.commit()
                download_url = extract_download_url(shortcut) or (
                    (shortcut.get("data") or {}).get("download_url") if isinstance(shortcut.get("data"), dict) else None
                )
            if not download_url:
                raise RuntimeError("Recall transcript has no download_url yet")
            payload = recall.download_transcript(download_url)
            segments, metas = normalize_with_participants(payload)
            if not segments:
                # Artifact downloaded fine but has no speech — truthful empty transcript, not failure.
                meeting.status = "ready"
                if job:
                    job.status = "succeeded"
                    job.error = None
                db.commit()
                log.info("process_transcript meeting_id=%s: transcript empty (no speech) -> ready", meeting_id)
                return

            # Build observed participants (Phase 6B). This is best-effort: incomplete identity
            # metadata must NEVER fail transcript ingestion. A savepoint isolates any participant
            # error so the segments still persist, just with meeting_participant_id = null.
            participant_ids: dict[str, str] = {}
            try:
                with db.begin_nested():
                    participant_ids = _sync_participants(db, meeting, metas)
            except Exception as exc:  # noqa: BLE001 — participants are optional; transcript is not
                participant_ids = {}
                log.warning("participant sync skipped meeting_id=%s (segments still persist): %s",
                            meeting_id, exc)

            # Phase 6C: resolve observed participants to cross-meeting Persons using trustworthy
            # evidence only (never names). Best-effort in its own savepoint — a resolution failure
            # must leave participants + transcript intact.
            try:
                with db.begin_nested():
                    from app.services.people import resolve_meeting_participants
                    resolve_meeting_participants(db, meeting)
            except Exception as exc:  # noqa: BLE001 — identity is optional; transcript is not
                log.warning("identity resolution skipped meeting_id=%s: %s", meeting_id, exc)

            for seg, meta in zip(segments, metas):
                db.add(TranscriptSegment(
                    meeting_id=meeting_id,
                    meeting_participant_id=participant_ids.get(_participant_key(meta)),
                    **seg,
                ))
            meeting.status = "ready"
            if job:
                job.status = "succeeded"
                job.error = None
            db.commit()  # atomic: segments + status + job together
            log.info("process_transcript meeting_id=%s persisted %d segments -> ready",
                     meeting_id, len(segments))
            # Phase 5: generate meeting intelligence from the real transcript (best-effort;
            # transcript stays 'ready' even if Groq is down).
            try:
                from app.services.intelligence import generate_intelligence
                generate_intelligence(meeting_id)
            except Exception as exc:  # noqa: BLE001
                log.exception("intelligence generation errored meeting_id=%s: %s", meeting_id, exc)
        except IntegrityError:
            db.rollback()  # concurrent run already inserted segments — treat as done
            log.info("process_transcript meeting_id=%s: segments already present (concurrent)", meeting_id)
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            log.exception("process_transcript FAILED meeting_id=%s: %s", meeting_id, exc)
            _record_failure(db, meeting_id, job_type="process_transcript",
                            code="transcript_processing_failed", message=str(exc))
    finally:
        db.close()


def _record_failure(db, meeting_id: str, *, job_type: str, code: str, message: str) -> None:
    meeting = db.get(Meeting, meeting_id)
    if meeting:
        meeting.status = "failed"
        meeting.processing_error_code = code
        meeting.processing_error_message = message[:2000]
    job = _job(db, meeting_id, job_type)
    if job:
        job.status = "failed"
        job.error = message[:2000]
    db.commit()


# ── Finalization + stuck-meeting sweeper ────────────────────────────────────────
#
# Webhooks are best-effort (deliveries fail, instances restart mid-task), so the pipeline can't
# depend on them alone. finalize_meeting() reconciles ONE meeting against Recall's bot object and
# advances it to wherever it should be; sweep_stuck_meetings() applies it to anything that has sat
# in a non-terminal status too long. Both are idempotent and safe to run repeatedly.

# Statuses that mean "work is (supposedly) still happening".
ACTIVE_STATUSES = (
    "bot_scheduled", "joining", "in_waiting_room", "recording",
    "recording_complete", "transcribing", "generating_intelligence",
)


def finalize_meeting(meeting_id: str) -> None:
    """Reconcile a meeting with Recall and advance it to its true state.

    - transcript segments already stored → status ready.
    - bot has a transcript (realtime or async) → process it now.
    - bot has a recording but no transcript → start the async fallback.
    - bot finished with NO recording at all → honest terminal state: ready with an explicit
      no_recording note (the old behavior of concluding silent calls in seconds, restored).
    """
    settings = get_settings()
    db = SessionLocal()
    try:
        meeting = db.get(Meeting, meeting_id)
        if not meeting or not meeting.recall_bot_id:
            return
        if meeting.status in ("ready", "cancelled"):
            return
        if db.query(TranscriptSegment).filter(TranscriptSegment.meeting_id == meeting_id).count():
            if meeting.status != "ready":
                meeting.status = "ready"
                db.commit()
            return

        recall = get_recall_service(settings.recall_api_key, settings.recall_region)
        bot = recall.get_bot(meeting.recall_bot_id)
        recordings = bot.get("recordings") or []

        # Terminal bot state with nothing recorded → conclude honestly, don't spin forever.
        if not recordings:
            statuses = bot.get("status_changes") or []
            last_code = (statuses[-1].get("code") if statuses else None) or ""
            bot_finished = last_code in ("done", "fatal", "call_ended") or (
                (bot.get("status") or {}).get("code") in ("done", "fatal")
            )
            # Meetings hard-failed by the old transient-race bug get healed to the honest
            # empty state too; genuinely failed bots (fatal etc.) stay failed.
            heal_failed = meeting.processing_error_code == "create_transcript_failed"
            if bot_finished and (meeting.status != "failed" or heal_failed):
                meeting.status = "ready"
                meeting.processing_error_code = "no_recording"
                meeting.processing_error_message = (
                    "The call ended without a recording — nobody spoke, or recording never started."
                )
                db.commit()
                log.info("finalize meeting_id=%s: no recording, concluded as ready/empty", meeting_id)
            return

        reconcile_recording(db, meeting, recall)
        shortcut = _recording_transcript_shortcut(bot)

        if shortcut.get("id") or meeting.recall_transcript_id:
            if shortcut.get("id") and not meeting.recall_transcript_id:
                meeting.recall_transcript_id = shortcut["id"]
            meeting.status = "transcribing"
            # Recover from an earlier transient failure and rerun.
            if meeting.processing_error_code in ("create_transcript_failed", "transcript_processing_failed"):
                meeting.processing_error_code = None
                meeting.processing_error_message = None
            db.commit()
            enqueue_job(db, meeting_id, "process_transcript", force=True)
            run_process_transcript(meeting_id)
            return

        # Recording exists but no transcript object yet → (re)start creation.
        meeting.status = "transcribing"
        db.commit()
        enqueue_job(db, meeting_id, "create_transcript", force=True)
        run_create_transcript(meeting_id)
    except Exception as exc:  # noqa: BLE001 — the sweeper will come back around
        log.warning("finalize meeting_id=%s errored (will retry on next sweep): %s", meeting_id, exc)
    finally:
        db.close()


def sweep_stuck_meetings(stale_after_s: int = 90, limit: int = 20) -> int:
    """Advance meetings stuck in non-terminal states; recover jobs orphaned by restarts.

    Runs periodically from the app lifespan. Returns how many meetings were reconciled.
    """
    from datetime import datetime, timedelta, timezone

    settings = get_settings()
    if not settings.recall_api_key:
        return 0
    now = datetime.now(timezone.utc)
    db = SessionLocal()
    try:
        # Jobs left 'running' by a crashed/restarted instance → back to pending.
        stale_jobs = (
            db.query(Job)
            .filter(Job.status == "running", Job.updated_at < now - timedelta(minutes=5))
            .all()
        )
        for j in stale_jobs:
            j.status = "pending"
            j.error = "Reset by sweeper: instance likely restarted mid-run."
        if stale_jobs:
            db.commit()

        stuck = (
            db.query(Meeting.id)
            .filter(
                Meeting.status.in_(ACTIVE_STATUSES),
                Meeting.recall_bot_id.isnot(None),
                Meeting.updated_at < now - timedelta(seconds=stale_after_s),
            )
            .order_by(Meeting.updated_at)
            .limit(limit)
            .all()
        )
        # Heal meetings previously hard-failed by the old transient-race bug.
        healable = (
            db.query(Meeting.id)
            .filter(
                Meeting.status == "failed",
                Meeting.processing_error_code == "create_transcript_failed",
                Meeting.processing_error_message.ilike("%No recording found%"),
                Meeting.recall_bot_id.isnot(None),
            )
            .limit(5)
            .all()
        )
        ids = [m.id for m in stuck] + [m.id for m in healable]
    finally:
        db.close()

    for mid in ids:
        finalize_meeting(mid)
    if ids:
        log.info("sweeper reconciled %d meeting(s)", len(ids))
    return len(ids)
