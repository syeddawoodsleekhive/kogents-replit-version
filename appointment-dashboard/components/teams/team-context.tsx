import React, { createContext, useContext, useState } from "react";

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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
  {
    id: "2",
    name: "Customer Support",
    color: "#3b82f6",
    memberCount: 2,
    totalMemberCount: 2,
    enabled: true,
    description: "Support for customers' queries and issues.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agents: [
      {
        id: "a2",
        name: "Alice Watson",
        online: false,
        admin: false,
        chats: "0 / 2",
      },
      {
        id: "a3",
        name: "Bob Dylan",
        online: true,
        admin: false,
        chats: "2 / 3",
      },
    ],
  },
  {
    id: "3",
    name: "Tech Support",
    color: "#f97316",
    memberCount: 1,
    totalMemberCount: 1,
    enabled: false,
    description: "Handles technical troubleshooting and bug reports.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agents: [
      {
        id: "a4",
        name: "Charlie Tech",
        online: false,
        admin: true,
        chats: "0 / 2",
      },
    ],
  },
  {
    id: "4",
    name: "Billing",
    color: "#8b5cf6",
    memberCount: 2,
    totalMemberCount: 2,
    enabled: true,
    description: "Manages invoices, refunds, and payment issues.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agents: [
      {
        id: "a5",
        name: "Dana Lee",
        online: true,
        admin: false,
        chats: "1 / 1",
      },
      {
        id: "a6",
        name: "Ethan Roy",
        online: false,
        admin: false,
        chats: "0 / 2",
      },
    ],
  },
  {
    id: "5",
    name: "Onboarding",
    color: "#eab308",
    memberCount: 1,
    totalMemberCount: 1,
    enabled: true,
    description: "Helps new users set up and get started.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    agents: [
      {
        id: "a7",
        name: "Fiona Onboard",
        online: true,
        admin: true,
        chats: "3 / 5",
      },
    ],
  },
];

const TeamContext = createContext({
  teams: dummyTeams,
  isLoading: false,
  deleteTeam: (id: string) => Promise.resolve(),
  deleteMember: (teamId: string, memberId: string) => Promise.resolve(),
});

export function useTeamContext() {
  return useContext(TeamContext);
}

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const [teams, setTeams] = useState(dummyTeams);
  const [isLoading, setIsLoading] = useState(false);

  const deleteTeam = async (id: string) => {
    setIsLoading(true);
    setTeams((prev) => prev.filter((team) => team.id !== id));
    setIsLoading(false);
  };

  const deleteMember = async (teamId: string, memberId: string) => {
    setIsLoading(true);
    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              agents: team.agents.filter((agent) => agent.id !== memberId),
              memberCount: team.agents.filter((agent) => agent.id !== memberId)
                .length,
            }
          : team
      )
    );
    setIsLoading(false);
  };

  return (
    <TeamContext.Provider
      value={{ teams, isLoading, deleteTeam, deleteMember }}
    >
      {children}
    </TeamContext.Provider>
  );
}
