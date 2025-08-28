import Axios from "@/lib/axios";

export const exportResponse = (workspaceId: string) => {
    return Axios.get(`/workspace/${workspaceId}/canned-responses/export`);
};
export const importResponse = (workspaceId: string, data: Record<string, any>[]) => {
    return Axios.post(`/workspace/${workspaceId}/canned-responses/import`, data);
};

