"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Check } from "lucide-react";
import { useState } from "react";

const teams = [
  {
    id: "1",
    name: "Sales Team",
    agents: [
      { name: "Daniel Lucas", online: true, admin: false, chats: "1 / 3" },
      {
        name: "John Man - BD",
        online: true,
        admin: true,
        chats: "1 / 3",
        selected: true,
      },
    ],
  },
  {
    id: "2",
    name: "Support Team",
    agents: [
      { name: "Eddy", online: true, admin: false, chats: "— / 3" },
      { name: "Jack", online: false, admin: false, chats: "— / 3" },
    ],
  },
];

type TeamsDialogProps = {
  children: React.ReactNode;
};

export function TeamsDialog({ children }: TeamsDialogProps) {
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div onClick={handleClick}>
      <Dialog
        open={agentDialogOpen}
        onOpenChange={setAgentDialogOpen}
        modal={false}
      >
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[700px] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-lg font-semibold">
              Agents by Team
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <Accordion type="multiple" className="w-full" defaultValue={["1"]}>
              {teams.map((team) => (
                <AccordionItem key={team.id} value={team.id}>
                  <AccordionTrigger className="text-left">
                    {team.name} ({team.agents.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <table className="w-full text-sm border-t">
                      <thead>
                        <tr>
                          <th className="text-left py-2">Agent</th>
                          <th className="text-left py-2">Admin</th>
                          <th className="text-left py-2"># chats</th>
                        </tr>
                      </thead>
                      <tbody>
                        {team.agents.map((agent, index) => (
                          <tr
                            key={index}
                            className={`border-t ${
                              agent.selected ? "bg-muted text-green-600" : ""
                            }`}
                          >
                            <td className="py-2 flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  agent.online ? "bg-green-500" : "bg-gray-400"
                                }`}
                              />
                              {agent.name}
                            </td>
                            <td className="py-2">
                              {agent.admin && (
                                <Check className="w-4 h-4 text-blue-600" />
                              )}
                            </td>
                            <td className="py-2">{agent.chats}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
