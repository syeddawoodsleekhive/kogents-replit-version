import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { formatPassTime } from "@/functions/index-v2";

const PastChatHistory = ({
  chatHistoryId,
  pastChats,
  setChatHistoryId,
}: {
  chatHistoryId: string | null;
  pastChats: any[];
  setChatHistoryId: (id: string) => void;
}) => {
  return (
    <div
      className={cn(
        "overflow-y-scroll h-[calc(100%_-_25px)] m-3 border rounded-lg bg-white",
        chatHistoryId !== null ? "max-h-[200px]" : ""
      )}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Agent</TableHead>
            <TableHead className="w-[200px]">Time</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pastChats && pastChats.length > 0
            ? pastChats.map((item, index) =>
                (() => {
                  const agentMsg = item.find(
                    (msg: any) => msg.sender === "live-agent" && msg.name
                  );
                  return (
                    <TableRow
                      key={index}
                      onClick={() => setChatHistoryId(item.id)}
                      className="cursor-pointer"
                    >
                      <TableCell className="text-nowrap">
                        {agentMsg ? agentMsg.name : "-"}
                      </TableCell>
                      <TableCell>{formatPassTime(item[0].timestamp)}</TableCell>
                      <TableCell>
                        {(() => {
                          const lastMsg = [...item]
                            .reverse()
                            .find((msg) => msg.sender !== "system");
                          if (lastMsg) {
                            return lastMsg.content || "-";
                          }
                          return "-";
                        })()}
                      </TableCell>
                    </TableRow>
                  );
                })()
              )
            : null}
        </TableBody>
      </Table>
    </div>
  );
};

export default PastChatHistory;
