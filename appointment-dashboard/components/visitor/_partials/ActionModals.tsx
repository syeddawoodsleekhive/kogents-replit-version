import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dummyAgents } from "@/dummyData/agents";
import { useMemo, useState } from "react";

const ActionModals = ({
  showAction = "",
  setShowAction,
}: {
  showAction: actionModalType;
  setShowAction: (action: actionModalType) => void;
}) => {
  const [agentEmail, setAgentEmail] = useState("");
  const [showAgentSuggestions, setShowAgentSuggestions] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState("upsell");

  const [banReason, setBanReason] = useState("");
  const [banIPAddress, setBanIPAddress] = useState(false);

  // Filter agents based on input
  const filteredAgents = useMemo(() => {
    if (!agentEmail.trim()) return dummyAgents;
    const searchTerm = agentEmail.toLowerCase();
    return dummyAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchTerm) ||
        agent.email.toLowerCase().includes(searchTerm) ||
        agent.role.toLowerCase().includes(searchTerm)
    );
  }, [agentEmail]);

  const handleAgentSelect = (agent: (typeof dummyAgents)[0]) => {
    setAgentEmail(agent.email);
    setShowAgentSuggestions(false);
  };

  const handleReset = () => {
    setShowAction("");
    setAgentEmail("");
    setShowAgentSuggestions(false);
  };

  return (
    <>
      {showAction === "invite-agent" ? (
        <div className="absolute left-0 right-0 top-0 z-50 bottom-0 bg-white flex">
          <div className="m-auto w-full max-w-2xl mx-auto mx-4">
            <div className=" px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-medium text-center">
                Invite agent / transfer to agent
              </h2>
            </div>

            <div className="px-6 py-2">
              <div className="mb-6 text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent email
                </label>
                <div className="relative max-w-2xl mx-auto">
                  <input
                    type="text"
                    autoComplete="off"
                    value={agentEmail}
                    onChange={(e) => {
                      setAgentEmail(e.target.value);
                      setShowAgentSuggestions(true);
                    }}
                    onFocus={() => setShowAgentSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowAgentSuggestions(false), 200)
                    }
                    placeholder="Enter agent name/email and select from list"
                    className="placeholder:text-sm text-sm w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-gray-400"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  {showAgentSuggestions && filteredAgents.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-1">
                        <div className="text-xs font-medium text-gray-500 px-2 py-1.5 border-b border-gray-100">
                          {filteredAgents.length} agent
                          {filteredAgents.length !== 1 ? "s" : ""} found
                        </div>
                        {filteredAgents.map((agent) => (
                          <div
                            key={agent.id}
                            onClick={() => handleAgentSelect(agent)}
                            className="group px-2 py-2 hover:bg-blue-50 cursor-pointer rounded transition-all duration-200 hover:shadow-sm border border-transparent hover:border-blue-200"
                          >
                            <div className="flex items-center space-x-2">
                              {/* <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-xs">
                                    {agent.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </div>
                                </div> */}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
                                      {agent.name}
                                    </div>
                                    <div className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                                      {agent.email}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex-shrink-0">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 group-hover:bg-blue-200 transition-colors">
                                  {agent.role}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button onClick={handleReset} className="px-4 py-2">
                  Transfer and leave
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="px-4 py-2 bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                >
                  Invite
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="px-4 py-2 bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : showAction === "transfer-department" ? (
        <div className="absolute left-0 right-0 top-0 z-50 bottom-0 w-full h-full flex">
          <div className="m-auto mx-auto w-full max-w-2xl mx-4">
            <div className="p-6">
              <div className="mb-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h2 className="text-lg font-medium text-gray-800">
                    Transfer to another department?
                  </h2>
                  <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-gray-600">?</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="relative max-w-2xl mx-auto">
                  <Select
                    onValueChange={(value) => setSelectedDepartment(value)}
                    defaultValue={selectedDepartment}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upsell">upsell</SelectItem>
                      <SelectItem value="support">support</SelectItem>
                      <SelectItem value="sales">sales</SelectItem>
                      <SelectItem value="billing">billing</SelectItem>
                      <SelectItem value="technical">technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowAction("")}
                  variant="outline"
                  className="px-4 py-2 bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Handle transfer logic here
                    console.log("Transfer to department:", selectedDepartment);
                    setShowAction("");
                  }}
                  className="px-4 py-2"
                >
                  Transfer
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : showAction === "export-transcript" ? (
        <div className="absolute left-0 right-0 top-0 z-50 bottom-0 w-full h-full">
          <div className="px-6 py-4 border border-b">
            <h2 className="text-lg font-medium">Export chat transcript</h2>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4 text-left">
              Email chat transcript to recipient(s).
            </p>

            <div className="mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 h-96 overflow-y-auto">
                <div className="text-sm text-gray-800 font-mono space-y-1">
                  <div>
                    Chat started on Wednesday, August 13, 2025 10:38:56 PM
                  </div>
                  <div>*** Visitor 6803137 has joined the chat ***</div>
                  <div>(10:38:56 PM) Visitor 6803137: Helllo</div>
                  <div>
                    (10:39:12 PM) John Man - BD: Hello! How can I help you
                    today?
                  </div>
                  <div>(10:39:45 PM) Visitor 6803137: sds</div>
                  <div>
                    (10:40:02 PM) John Man - BD: I'm here to assist you. Could
                    you please provide more details about what you need help
                    with?
                  </div>
                  <div>(10:40:30 PM) *** Visitor 6803137 has left ***</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setShowAction("")}
                variant="outline"
                className="px-4 py-2 bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      ) : showAction === "ban-visitor" ? (
        <div className="absolute left-0 right-0 top-0 z-50 bottom-0 w-full h-full flex items-center justify-center">
          <div className="bg-white  w-full max-w-2xl mx-4">
            <div className="px-6  text-center">
              <h2 className="text-lg font-medium">Ban visitor</h2>
            </div>

            <div className="p-6">
              <div className="mb-6 text-center">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (optional)
                </label>
                <div className="max-w-2xl mx-auto">
                  <input
                    type="text"
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="(optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="mb-6 text-center">
                  <label className="flex items-center justify-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={banIPAddress}
                      onChange={(e) => setBanIPAddress(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">
                      Also ban visitor's IP address
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setShowAction("")}
                    variant="outline"
                    className="px-4 py-2 bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Handle ban visitor logic here
                      console.log(
                        "Ban visitor with reason:",
                        banReason,
                        "IP ban:",
                        banIPAddress
                      );
                      setShowAction("");
                    }}
                    className="px-4 py-2"
                  >
                    Ban user
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default ActionModals;
