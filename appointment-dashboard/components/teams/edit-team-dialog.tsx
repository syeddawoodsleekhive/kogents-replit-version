import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dummy team data for demo
const dummyTeams = [
  {
    id: "1",
    name: "Fresh Sales",
    color: "#22c55e",
    memberCount: 1,
    totalMemberCount: 1,
    enabled: true,
    description: "Handles all inbound and outbound sales.",
    agents: [
      {
        id: "a1",
        name: "John Man - BD",
        online: true,
        admin: true,
        chats: "1 / 3",
      },
    ],
  },
  // ...add more teams as needed
];

interface EditTeamDialogProps {
  teamId: string;
  onClose: () => void;
}

export function EditTeamDialog({ teamId, onClose }: EditTeamDialogProps) {
  const [open, setOpen] = useState(true);
  // Find team by id
  const team = dummyTeams.find((t) => t.id === teamId);
  const [name, setName] = useState(team?.name || "");
  const [color, setColor] = useState(team?.color || "#6366f1");
  const [memberCount, setMemberCount] = useState(team?.memberCount || 0);
  const [enabled, setEnabled] = useState(team?.enabled ?? true);
  const [description, setDescription] = useState(team?.description || "");
  const [agents, setAgents] = useState(team?.agents || []);
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || "");
  const selectedAgent = agents.find((a: any) => a.id === selectedAgentId);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Team Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-8 p-0 border-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Member Count</label>
            <Input type="number" value={memberCount} onChange={(e) => setMemberCount(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Enabled</label>
            <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Agents</label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent: any) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${agent.online ? "bg-green-500" : "bg-gray-400"}`} />
                      <span>{agent.name}</span>
                      {agent.admin && <span className="text-xs text-blue-600 ml-2">Admin</span>}
                      <span className="text-xs ml-2">{agent.chats}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Show selected agent details for editing */}
            {selectedAgent && (
              <div className="mt-4 space-y-2">
                <Input
                  value={selectedAgent.name}
                  onChange={(e) => {
                    setAgents((prev: any) =>
                      prev.map((a: any) =>
                        a.id === selectedAgent.id ? { ...a, name: e.target.value } : a
                      )
                    );
                  }}
                  className="w-32"
                />
                <span className="text-xs">Chats: {selectedAgent.chats}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedAgent.admin}
                    onChange={(e) => {
                      setAgents((prev: any) =>
                        prev.map((a: any) =>
                          a.id === selectedAgent.id ? { ...a, admin: e.target.checked } : a
                        )
                      );
                    }}
                  />
                  <span className="text-xs">Admin</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={handleClose}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
