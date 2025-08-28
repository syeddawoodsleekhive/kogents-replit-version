"use client";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useState } from "react";

const agents = [
	{ name: "Prente", status: "Online", avatar: "https://randomuser.me/api/portraits/women/1.jpg", task: "Current task" },
	{ name: "Lint", status: "Offline", avatar: "https://randomuser.me/api/portraits/women/5.jpg", task: "Current task" },
	{ name: "Lute", status: "Offline", avatar: "https://randomuser.me/api/portraits/men/6.jpg", task: "Current task" },
	{ name: "Lmt", status: "Offline", avatar: "https://randomuser.me/api/portraits/women/7.jpg", task: "Current task" },
	{ name: "Ute", status: "Offline", avatar: "https://randomuser.me/api/portraits/men/8.jpg", task: "Current task" },
	{ name: "Line", status: "Offline", avatar: "https://randomuser.me/api/portraits/women/9.jpg", task: "Current task" },
	{ name: "Ih", status: "Offline", avatar: "https://randomuser.me/api/portraits/women/11.jpg", task: "Current task" },
	{ name: "Online", status: "Online", avatar: "https://randomuser.me/api/portraits/men/2.jpg", task: "Current task" },
	{ name: "Online", status: "Online", avatar: "https://randomuser.me/api/portraits/women/3.jpg", task: "Current task" },
	{ name: "Online", status: "Online", avatar: "https://randomuser.me/api/portraits/men/4.jpg", task: "Current task" },
	{ name: "Online", status: "Online", avatar: "https://randomuser.me/api/portraits/men/10.jpg", task: "Current task" },
	{ name: "Online", status: "Online", avatar: "https://randomuser.me/api/portraits/women/13.jpg", task: "Current task" },
	{ name: "Online", status: "Online", avatar: "https://randomuser.me/api/portraits/men/14.jpg", task: "Current task" },
	{ name: "Offline", status: "Offline", avatar: "https://randomuser.me/api/portraits/women/15.jpg", task: "Current task" },
	{ name: "Offline", status: "Offline", avatar: "https://randomuser.me/api/portraits/men/16.jpg", task: "Current task" },
];

export function MonitorAgentActivity() {
	const [filter, setFilter] = useState("All");
	const filteredAgents = filter === "All" ? agents : agents.filter((a) => a.name === filter);
	return (
		<div className="bg-white rounded shadow p-4">
			<div className="flex items-center justify-between mb-2">
				<div className="font-semibold">Agent Activity</div>
				<Select value={filter} onValueChange={setFilter}>
					<SelectTrigger className="w-32">
						<SelectValue placeholder="Prente" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="All">All</SelectItem>
						{agents.map((agent, idx) => (
							<SelectItem key={idx} value={agent.name}>
								{agent.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="grid grid-cols-2 md:grid-cols-4 gap-2">
				{filteredAgents.map((agent, idx) => (
					<div
						key={idx}
						className="border rounded p-2 flex flex-col items-center text-xs bg-white hover:bg-gray-50 transition"
					>
						<img src={agent.avatar} alt={agent.name} className="w-8 h-8 rounded-full mb-1" />
						<div className="flex items-center gap-1 font-semibold">
							<span
								className={`w-2 h-2 rounded-full ${
									agent.status === "Online" ? "bg-green-500" : "bg-gray-400"
								}`}
							></span>
							{agent.name}
						</div>
						<div className={`text-[10px] ${agent.status === "Online" ? "text-green-600" : "text-gray-500"}`}>
							{agent.status}
						</div>
						<div className="mt-1 text-[10px] text-muted-foreground">{agent.task}</div>
					</div>
				))}
			</div>
		</div>
	);
}
