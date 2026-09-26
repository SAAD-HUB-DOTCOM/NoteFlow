"""Phase 6C — conservative cross-meeting identity resolution + People aggregation.

Turns  Transcript speaker → MeetingParticipant  into  … → Person  WITHOUT guessing. A shared
display name or speaker label NEVER creates a cross-meeting identity. Evidence priority, most to
least trustworthy:

  1. stable provider participant id  — matched against KNOWN identities (never invents a Person on
     its own; Recall participant ids are not guaranteed stable across meetings)
  2. normalized email                — matched, and trustworthy enough to auto-create a Person
  3. explicit manual association      — the reliable path today
  4. otherwise                        — person_id stays null (correct, not a failure)

Raw participant data (provider_participant_id, display_name, speaker_label, email) is preserved on
MeetingParticipant even after it links to a Person — linking only sets person_id. Every operation
is owner-scoped: a user can never read, link, unlink, or merge another owner's people/participants.
"""
import logging
import re

from sqlalchemy import func

from app.models import Meeting, MeetingParticipant, Person, PersonIdentity, TranscriptSegment

log = logging.getLogger("noteflow.people")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class NotFound(Exception):
    """Owner-scoped lookup miss — endpoints translate this to 404 (never reveal existence)."""


def normalize_email(raw) -> str | None:
    """Lower/trimmed email if syntactically valid, else None (never fabricated/guessed)."""
    if not isinstance(raw, str):
        return None
    e = raw.strip().lower()
    return e if _EMAIL_RE.match(e) else None


# ── identity evidence helpers ─────────────────────────────────────────────────────

def _identity_person_id(db, owner_user_id: str, kind: str, provider: str, value: str) -> str | None:
    row = (
        db.query(PersonIdentity)
        .filter_by(owner_user_id=owner_user_id, kind=kind, provider=provider or "", value=value)
        .first()
    )
    return row.person_id if row else None


def _add_identity(db, person: Person, kind: str, value: str, *, provider: str = "",
                  source: str = "ingestion", confidence: str = "high") -> bool:
    """Attach identity evidence to `person` unless it is already claimed by ANOTHER person.
    Never steals evidence (that would be a silent merge). True if the evidence now belongs to
    this person."""
    provider = provider or ""
    existing = (
        db.query(PersonIdentity)
        .filter_by(owner_user_id=person.owner_user_id, kind=kind, provider=provider, value=value)
        .first()
    )
    if existing:
        return existing.person_id == person.id
    db.add(PersonIdentity(
        owner_user_id=person.owner_user_id, person_id=person.id,
        kind=kind, provider=provider, value=value, source=source, confidence=confidence,
    ))
    db.flush()
    return True


# ── resolution (ingestion path) ────────────────────────────────────────────────────

def resolve_participant(db, meeting: Meeting, participant: MeetingParticipant) -> str | None:
    """Resolve ONE observed participant to a Person using trustworthy evidence only. Idempotent —
    an already-linked participant is left untouched. Returns the person_id or None."""
    if participant.person_id:
        return participant.person_id

    owner = meeting.owner_user_id
    provider = participant.provider or ""
    ppid = participant.provider_participant_id
    email = normalize_email(participant.email)

    # 1. stable provider participant id → link to a KNOWN identity only (never auto-create).
    if ppid:
        pid = _identity_person_id(db, owner, "provider_participant_id", provider, ppid)
        if pid:
            participant.person_id = pid
            if email:
                _add_identity(db, db.get(Person, pid), "email", email)
            db.flush()
            return pid

    # 2. normalized email → link if known, else auto-create (email is a real human identity).
    if email:
        pid = _identity_person_id(db, owner, "email", "", email)
        if pid:
            participant.person_id = pid
            if ppid:
                _add_identity(db, db.get(Person, pid), "provider_participant_id", ppid, provider=provider)
            db.flush()
            return pid
        person = Person(owner_user_id=owner, display_name=participant.display_name, primary_email=email)
        db.add(person)
        db.flush()
        _add_identity(db, person, "email", email)
        if ppid:
            _add_identity(db, person, "provider_participant_id", ppid, provider=provider)
        participant.person_id = person.id
        db.flush()
        return person.id

    # 3./4. no trustworthy evidence → leave unresolved (manual association is the reliable path).
    return None


def resolve_meeting_participants(db, meeting: Meeting) -> int:
    """Resolve every participant of a meeting. Best-effort caller wraps this so a failure here
    never breaks transcript ingestion."""
    n = 0
    for p in db.query(MeetingParticipant).filter_by(meeting_id=meeting.id).all():
        if resolve_participant(db, meeting, p):
            n += 1
    return n


# ── owner-scoped lookups ─────────────────────────────────────────────────────────

def _owned_person(db, owner_user_id: str, person_id: str) -> Person:
    person = db.get(Person, person_id)
    if person is None or person.owner_user_id != owner_user_id:
        raise NotFound("person")
    return person


def _owned_participant(db, owner_user_id: str, participant_id: str) -> MeetingParticipant:
    part = db.get(MeetingParticipant, participant_id)
    if part is None:
        raise NotFound("participant")
    meeting = db.get(Meeting, part.meeting_id)
    if meeting is None or meeting.owner_user_id != owner_user_id:
        raise NotFound("participant")
    return part


# ── manual association / unlink / merge ────────────────────────────────────────────

def create_person(db, owner_user_id: str, *, meeting_participant_id: str | None = None,
                  display_name: str | None = None) -> Person:
    """Create a Person for this owner, optionally seeded from an observed participant (which also
    links that participant and promotes its evidence so future ingests auto-link)."""
    seed = _owned_participant(db, owner_user_id, meeting_participant_id) if meeting_participant_id else None
    person = Person(
        owner_user_id=owner_user_id,
        display_name=display_name or (seed.display_name if seed else None),
        primary_email=normalize_email(seed.email) if seed else None,
    )
    db.add(person)
    db.flush()
    if seed:
        _link(db, seed, person)
    db.flush()
    return person


def _link(db, participant: MeetingParticipant, person: Person) -> None:
    """Link a participant to a person and promote its evidence to reliable identities so future
    ingests auto-link. Raw participant fields are preserved."""
    participant.person_id = person.id
    if participant.provider_participant_id:
        _add_identity(db, person, "provider_participant_id", participant.provider_participant_id,
                      provider=participant.provider or "", source="manual")
    email = normalize_email(participant.email)
    if email:
        _add_identity(db, person, "email", email, source="manual")
    # A manual marker keyed to THIS participant records the explicit human decision. Re-point it
    # if the participant was previously linked elsewhere (never violate the identity unique key).
    db.query(PersonIdentity).filter_by(
        owner_user_id=person.owner_user_id, kind="manual", provider="", value=participant.id
    ).delete()
    db.add(PersonIdentity(owner_user_id=person.owner_user_id, person_id=person.id,
                          kind="manual", provider="", value=participant.id, source="manual"))
    db.flush()


def link_participant_to_person(db, owner_user_id: str, meeting_participant_id: str, person_id: str) -> Person:
    part = _owned_participant(db, owner_user_id, meeting_participant_id)
    person = _owned_person(db, owner_user_id, person_id)
    _link(db, part, person)
    return person


def unlink_participant(db, owner_user_id: str, meeting_participant_id: str) -> MeetingParticipant:
    """Detach a participant from its person. Removes the manual marker so re-ingestion won't
    silently re-link it. Raw participant data is preserved."""
    part = _owned_participant(db, owner_user_id, meeting_participant_id)
    part.person_id = None
    db.query(PersonIdentity).filter_by(
        owner_user_id=owner_user_id, kind="manual", provider="", value=part.id
    ).delete()
    db.flush()
    return part


def merge_people(db, owner_user_id: str, source_person_id: str, target_person_id: str) -> Person:
    """Merge source into target: repoint every participant (no meeting association is lost) and
    move identities that don't collide, then delete the emptied source. Owner-scoped."""
    if source_person_id == target_person_id:
        raise ValueError("Cannot merge a person into itself.")
    source = _owned_person(db, owner_user_id, source_person_id)
    target = _owned_person(db, owner_user_id, target_person_id)

    db.query(MeetingParticipant).filter_by(person_id=source.id).update({"person_id": target.id})

    for ident in db.query(PersonIdentity).filter_by(person_id=source.id).all():
        clash = (
            db.query(PersonIdentity)
            .filter_by(owner_user_id=owner_user_id, kind=ident.kind, provider=ident.provider, value=ident.value)
            .filter(PersonIdentity.person_id == target.id)
            .first()
        )
        if clash:
            db.delete(ident)
        else:
            ident.person_id = target.id
    # Fill target gaps from source; never overwrite known target fields.
    if not target.primary_email and source.primary_email:
        target.primary_email = source.primary_email
    if not target.display_name and source.display_name:
        target.display_name = source.display_name
    if not target.avatar_url and source.avatar_url:
        target.avatar_url = source.avatar_url
    db.flush()
    db.delete(source)
    db.flush()
    return target


# ── aggregation (read models) ──────────────────────────────────────────────────────

def list_people(db, owner_user_id: str):
    """Resolved people with real, derivable stats, most-recent conversation first. Only people
    with at least one linked conversation appear. Returns rows of (Person, count, last_at)."""
    last_at = func.max(func.coalesce(Meeting.started_at, Meeting.created_at))
    return (
        db.query(Person, func.count(func.distinct(MeetingParticipant.meeting_id)), last_at)
        .join(MeetingParticipant, MeetingParticipant.person_id == Person.id)
        .join(Meeting, Meeting.id == MeetingParticipant.meeting_id)
        .filter(Person.owner_user_id == owner_user_id)
        .group_by(Person.id)
        .order_by(last_at.desc())
        .all()
    )


def person_meetings(db, owner_user_id: str, person: Person):
    """Distinct meetings this person is linked to (owner-scoped), most recent first."""
    return (
        db.query(Meeting)
        .join(MeetingParticipant, MeetingParticipant.meeting_id == Meeting.id)
        .filter(MeetingParticipant.person_id == person.id, Meeting.owner_user_id == owner_user_id)
        .distinct()
        .order_by(func.coalesce(Meeting.started_at, Meeting.created_at).desc())
        .all()
    )


# ── deterministic historical backfill (creates NO Person) ───────────────────────────

def backfill_participants_from_segments(db, meeting: Meeting) -> int:
    """Reconstruct label-only MeetingParticipants for a historical meeting that has transcript
    segments but no participant rows. DETERMINISTIC: only the distinct speaker_labels already in
    the data. Creates NO Person and never resolves identity (a label is not identity evidence).
    display_name stays null — the label lives in speaker_label. Idempotent. Returns rows created.
    """
    if db.query(MeetingParticipant).filter_by(meeting_id=meeting.id).count():
        return 0
    labels = [
        r[0] for r in db.query(TranscriptSegment.speaker_label)
        .filter(TranscriptSegment.meeting_id == meeting.id, TranscriptSegment.speaker_label.isnot(None))
        .distinct().all()
    ]
    label_to_id: dict[str, str] = {}
    for label in labels:
        row = MeetingParticipant(
            meeting_id=meeting.id, provider=meeting.provider,
            provider_participant_id=None, display_name=None, speaker_label=label,
        )
        db.add(row)
        db.flush()
        label_to_id[label] = row.id
    if label_to_id:
        for seg in db.query(TranscriptSegment).filter_by(meeting_id=meeting.id).all():
            if seg.speaker_label in label_to_id:
                seg.meeting_participant_id = label_to_id[seg.speaker_label]
        db.flush()
    return len(label_to_id)
