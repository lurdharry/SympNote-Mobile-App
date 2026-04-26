import { useProfileStore } from "../stores/useProfileStore";
import { useAppointmentsStore } from "../stores/useAppointmentsStore";
import { useRecordingsStore } from "../stores/useRecordingsStore";
import { useBriefsStore } from "../stores/useBriefsStore";
import { uuid } from "./uuid";
import { parseISO } from "date-fns";
import type { Brief } from "../stores/types";

/**
 * One-shot reconciliation pass that brings the legacy "free text
 * clinician name" model into line with the canonical Clinician
 * entity. Reads each store's current state, find-or-creates a
 * Clinician for every loose `doctorName` / `clinicianNames[]`, and
 * writes back the matching `clinicianId` / `clinicianIds[]`.
 *
 * Idempotent — appointments + recordings that already carry an id
 * are skipped, so calling this every app start is safe and costs
 * almost nothing once the user is migrated.
 *
 * Why this lives outside Zustand's persist `migrate`: the migration
 * is cross-store, and the appointments / recordings persist
 * lifecycles run independently of the profile store. Doing it here
 * after stores have hydrated keeps the dependency direction simple
 * and lets callers run it from a top-level useEffect.
 */
export function migrateClinicianRefs(): void {
  const profile = useProfileStore.getState();
  if (!profile.personalization) return; // pre-onboarding state — nothing to do

  const appointments = useAppointmentsStore.getState().appointments;
  const recordings = useRecordingsStore.getState().recordings;

  let appointmentsTouched = false;
  const nextAppointments = appointments.map((a) => {
    if (a.clinicianId) return a;
    if (!a.doctorName || !a.doctorName.trim()) return a;
    const clinician = profile.findOrCreateClinicianByName(
      a.doctorName,
      a.specialty || "Clinician",
    );
    if (!clinician) return a;
    appointmentsTouched = true;
    return { ...a, clinicianId: clinician.id };
  });
  if (appointmentsTouched) {
    useAppointmentsStore.setState({ appointments: nextAppointments });
  }

  let recordingsTouched = false;
  const nextRecordings = recordings.map((r) => {
    if (r.clinicianIds || !r.clinicianNames || r.clinicianNames.length === 0) {
      return r;
    }
    const ids: string[] = [];
    for (const name of r.clinicianNames) {
      const clinician = profile.findOrCreateClinicianByName(name, "Clinician");
      if (clinician) ids.push(clinician.id);
    }
    recordingsTouched = true;
    return { ...r, clinicianIds: ids };
  });
  if (recordingsTouched) {
    useRecordingsStore.setState({ recordings: nextRecordings });
  }

  // Lift legacy briefs into the new first-class Brief collection.
  // Briefs are now their own entity — neither clinicians nor
  // appointments own them. Clinician.brief and Appointment.brief
  // become history that needs to be migrated once.
  const careTeam = useProfileStore.getState().personalization?.careTeam ?? [];
  const allRecordings = useRecordingsStore.getState().recordings;

  const inferWindowStart = (sourceIds: string[], generatedAt: string): string => {
    if (sourceIds.length === 0) return generatedAt;
    const oldest = allRecordings
      .filter((r) => sourceIds.includes(r.id))
      .map((r) => parseISO(r.createdAt).getTime())
      .sort((a, b) => a - b)[0];
    return oldest ? new Date(oldest).toISOString() : generatedAt;
  };

  // 1) Clinician-owned legacy briefs → Brief records, tagged with
  //    that clinician.
  for (const c of careTeam) {
    if (!c.brief || !c.briefGeneratedAt) continue;
    const newBrief: Brief = {
      id: uuid(),
      generatedAt: c.briefGeneratedAt,
      windowStart: inferWindowStart(c.briefSourceRecordingIds, c.briefGeneratedAt),
      windowEnd: c.briefGeneratedAt,
      sourceRecordingIds: c.briefSourceRecordingIds,
      content: c.brief,
      clinicianIds: [c.id],
    };
    useBriefsStore.getState().add(newBrief);
    useProfileStore.getState().clearClinicianBrief(c.id);
  }

  // 2) Appointment-owned legacy briefs → Brief records, tagged with
  //    the appointment + its clinician (when known).
  const apptsWithBrief = useAppointmentsStore
    .getState()
    .appointments.filter((a) => !!a.brief && !!a.briefGeneratedAt);
  for (const a of apptsWithBrief) {
    const newBrief: Brief = {
      id: uuid(),
      generatedAt: a.briefGeneratedAt!,
      windowStart: inferWindowStart(a.briefSourceRecordingIds, a.briefGeneratedAt!),
      windowEnd: a.briefGeneratedAt!,
      sourceRecordingIds: a.briefSourceRecordingIds,
      content: a.brief!,
      clinicianIds: a.clinicianId ? [a.clinicianId] : [],
      appointmentId: a.id,
    };
    useBriefsStore.getState().add(newBrief);
    useAppointmentsStore.getState().update(a.id, {
      brief: null,
      briefGeneratedAt: null,
      briefSourceRecordingIds: [],
    });
  }
}
