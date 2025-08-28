import Axios from "@/lib/axios";
import type { BannedVisitor, BannedVisitorAPIData } from "@/types/visitor";
import moment from "moment";

export const createBan = (data: BannedVisitorAPIData) =>
  Axios.post("/banned-visitors", data);

export const fetchBans = (workspace: string) =>
  Axios.get<{ data: BannedVisitorAPIData[] }>(`/banned-visitors`, {
    params: { workspace },
  });

export const fetchBanById = (id: string) =>
  Axios.get<{ data: BannedVisitorAPIData }>(`/banned-visitors/${id}`);

export const updateBan = (id: string, data: Partial<BannedVisitorAPIData>) =>
  Axios.put<{ data: BannedVisitorAPIData }>(`/banned-visitors/${id}`, data);

export const deleteBan = (id: string) =>
  Axios.delete<void>(`/banned-visitors/${id}`);

export function toBannedVisitor(api: BannedVisitorAPIData): BannedVisitor {
  return {
    id: api._id || "",
    visitorName: `IP: ${api.ip}`,
    ipAddress: api.ip,
    reason: api.reason as any,
    customReason: api.note,
    bannedBy: api?.bannedBy?.name || "",
    bannedAt: api.createdAt ? new Date(api.createdAt) : new Date(),
    expiresAt: api.expiresAt ? new Date(api.expiresAt) : undefined,
    isActive: api.active,
    isPermanent: api.permanent,
    notes: api.note,
  };
}

export function toBannedVisitorAPIData(
  visitor: BannedVisitor,
  workspace: string
): BannedVisitorAPIData {
  return {
    // _id: visitor.id,
    ip: visitor.ipAddress || "",
    permanent: visitor.isPermanent,
    expiresAt: visitor.isPermanent
      ? null
      : visitor.expiresAt
      ? moment(visitor.expiresAt).toISOString()
      : null,
    reason: visitor.reason,
    note: visitor.notes,
    workspace,
    active: visitor.isActive,
    // createdAt: visitor.bannedAt,
    // updatedAt: undefined,
  };
}
