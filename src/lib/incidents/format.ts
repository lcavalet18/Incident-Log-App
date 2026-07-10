interface IssueTextInput {
  code: string | null;
  issue_description: string | null;
  incident_codes?: { label: string } | null;
}

/** For "Other" incidents, shows the invigilator's own description instead of the generic code label. */
export function formatIssueText(incident: IssueTextInput): string {
  if (incident.code === 'OTH' && incident.issue_description) {
    return `Other — ${incident.issue_description}`;
  }
  return incident.incident_codes?.label ?? '—';
}
