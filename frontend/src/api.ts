const BASE = '/api';

interface PaginationParams {
  page?: number;
  limit?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function qs(params: any): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json = await res.json();
  if (!res.ok) throw json;
  return json;
}

// Medications
export function getMedications(params?: PaginationParams & { schedule?: string }) {
  return request<{ data: Medication[]; pagination: Pagination }>(
    `/medications${qs(params ?? {})}`
  );
}

export function getMedication(slug: string) {
  return request<{ data: MedicationDetail }>(`/medications/${slug}`);
}

export function createMedication(body: {
  name: string;
  schedule: string;
  slug: string;
  unit: string;
  stockQuantity?: number;
}) {
  return request<{ data: Medication }>('/medications', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Transactions
export function getTransactions(params?: PaginationParams & { type?: string; medicationId?: string }) {
  return request<{ data: Transaction[]; pagination: Pagination }>(
    `/transactions${qs(params ?? {})}`
  );
}

export function createTransaction(body: {
  medicationId: string;
  nurseId: string;
  witnessId: string;
  type: string;
  quantity: number;
  notes?: string;
}) {
  return request<{ data: Transaction }>('/transactions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Audit Log
export function getAuditLog(params?: PaginationParams & { entityType?: string }) {
  return request<{ data: AuditLogEntry[]; pagination: Pagination }>(
    `/audit-log${qs(params ?? {})}`
  );
}

// Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Medication {
  id: string;
  name: string;
  schedule: string;
  unit: string;
  stockQuantity: number;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicationDetail extends Medication {
  transactions: Transaction[];
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export interface Transaction {
  id: string;
  medicationId: string;
  nurseId: string;
  witnessId: string;
  type: string;
  quantity: number;
  notes: string | null;
  createdAt: string;
  medication: Medication;
  nurse: UserSummary;
  witness: UserSummary;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  performedById: string;
  details: Record<string, unknown>;
  createdAt: string;
  performedBy: UserSummary;
}
