import { MonitorAgentActivity } from "@/components/monitor/MonitorAgentActivity";
import { MonitorQueueStats } from "@/components/monitor/MonitorQueueStats";

const stats = {
  queue: { chats: 4, alert: 3, ok: 1 },
  waitTime: { longest: "1m 5s", average: "5s" },
  missedChats: 1,
  currentlyServed: 24,
  chatsPerAgent: { loggedIn: 219, online: 343 },
  responseTime: { longest: "1m 28s", average: "9s" },
  chatDuration: { longest: "18m 3s", average: "10m 12s" },
  loggedIn: 11,
  status: { green: 7, orange: 1, gray: 3 },
  satisfaction: 96,
  ratings: { up: 26, down: 1 },
  // Additional dummy data
  recentChats: [
    {
      id: 1,
      customer: "John Smith",
      agent: "Sarah Johnson",
      duration: "12m 34s",
      status: "completed",
      rating: 5,
    },
    {
      id: 2,
      customer: "Maria Garcia",
      agent: "Mike Chen",
      duration: "8m 12s",
      status: "active",
      rating: null,
    },
    {
      id: 3,
      customer: "David Wilson",
      agent: "Lisa Brown",
      duration: "15m 45s",
      status: "completed",
      rating: 4,
    },
    {
      id: 4,
      customer: "Emma Davis",
      agent: "Tom Anderson",
      duration: "6m 23s",
      status: "completed",
      rating: 5,
    },
    {
      id: 5,
      customer: "Alex Thompson",
      agent: "Sarah Johnson",
      duration: "22m 18s",
      status: "active",
      rating: null,
    },
  ],
  agentPerformance: [
    {
      name: "Sarah Johnson",
      chats: 45,
      avgResponse: "8s",
      satisfaction: 98,
      status: "online",
    },
    {
      name: "Mike Chen",
      chats: 38,
      avgResponse: "12s",
      satisfaction: 94,
      status: "online",
    },
    {
      name: "Lisa Brown",
      chats: 52,
      avgResponse: "6s",
      satisfaction: 97,
      status: "online",
    },
    {
      name: "Tom Anderson",
      chats: 29,
      avgResponse: "15s",
      satisfaction: 91,
      status: "away",
    },
    {
      name: "Jessica Lee",
      chats: 41,
      avgResponse: "9s",
      satisfaction: 96,
      status: "online",
    },
  ],
  hourlyStats: [
    { hour: "09:00", chats: 12, avgWait: "3s", satisfaction: 95 },
    { hour: "10:00", chats: 18, avgWait: "5s", satisfaction: 94 },
    { hour: "11:00", chats: 25, avgWait: "8s", satisfaction: 92 },
    { hour: "12:00", chats: 32, avgWait: "12s", satisfaction: 89 },
    { hour: "13:00", chats: 28, avgWait: "7s", satisfaction: 93 },
    { hour: "14:00", chats: 35, avgWait: "10s", satisfaction: 90 },
    { hour: "15:00", chats: 42, avgWait: "15s", satisfaction: 87 },
    { hour: "16:00", chats: 38, avgWait: "9s", satisfaction: 92 },
  ],
  topIssues: [
    { issue: "Product Information", count: 156, percentage: 28 },
    { issue: "Technical Support", count: 134, percentage: 24 },
    { issue: "Billing Questions", count: 98, percentage: 18 },
    { issue: "Order Status", count: 87, percentage: 16 },
    { issue: "Returns & Refunds", count: 67, percentage: 12 },
    { issue: "Account Issues", count: 23, percentage: 4 },
  ],
  customerSatisfaction: {
    excellent: 342,
    good: 156,
    average: 45,
    poor: 12,
    terrible: 3,
  },
  responseTimeDistribution: {
    under5s: 234,
    "5-10s": 189,
    "10-30s": 98,
    "30-60s": 45,
    over60s: 23,
  },
  chatVolume: {
    today: 589,
    yesterday: 523,
    thisWeek: 3247,
    lastWeek: 2987,
    thisMonth: 12456,
    lastMonth: 11892,
  },
  peakHours: [
    { hour: "10:00", volume: 45 },
    { hour: "11:00", volume: 52 },
    { hour: "12:00", volume: 38 },
    { hour: "13:00", volume: 41 },
    { hour: "14:00", volume: 48 },
    { hour: "15:00", volume: 55 },
    { hour: "16:00", volume: 42 },
    { hour: "17:00", volume: 35 },
  ],
  agentWorkload: {
    available: 8,
    busy: 3,
    away: 2,
    offline: 1,
    total: 14,
  },
  queueHistory: [
    { time: "09:00", queue: 2 },
    { time: "10:00", queue: 5 },
    { time: "11:00", queue: 8 },
    { time: "12:00", queue: 12 },
    { time: "13:00", queue: 9 },
    { time: "14:00", queue: 15 },
    { time: "15:00", queue: 18 },
    { time: "16:00", queue: 11 },
    { time: "17:00", queue: 6 },
  ],
  systemAlerts: [
    {
      id: 1,
      type: "high_queue",
      message: "Queue length exceeded threshold",
      time: "2 minutes ago",
      severity: "warning",
    },
    {
      id: 2,
      type: "agent_offline",
      message: "Agent Sarah Johnson went offline",
      time: "5 minutes ago",
      severity: "info",
    },
    {
      id: 3,
      type: "system_maintenance",
      message: "Scheduled maintenance in 30 minutes",
      time: "15 minutes ago",
      severity: "info",
    },
  ],
};

const MonitorPage = () => {
  return (
    <div className="p-6 bg-[#f6f6f6] min-h-screen">
      {/* Row 1 - 4 cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Queue</div>
          <div className="flex items-center gap-6">
            <div className="text-4xl font-semibold text-gray-600">
              {stats.queue.chats}
            </div>
            <div className="flex flex-col gap-1">
              <span className="flex items-center gap-1 text-lg">
                <span className="w-3 h-3 bg-red-500 inline-block"></span>{" "}
                {stats.queue.alert}
              </span>
              <span className="flex items-center gap-1 text-lg">
                <span className="w-3 h-3 bg-green-500 inline-block"></span>{" "}
                {stats.queue.ok}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Wait Time</div>
          <div className="flex flex-col gap-2">
            <div className="text-4xl font-semibold text-gray-600">
              {stats.waitTime.longest}
            </div>
            <div className="text-4xl font-semibold text-gray-600">
              {stats.waitTime.average}
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Missed Chats</div>
          <div className="text-4xl font-semibold text-gray-600">
            {stats.missedChats}
          </div>
        </div>
        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Currently Served</div>
          <div className="text-4xl font-semibold text-gray-600">
            {stats.currentlyServed}
          </div>
        </div>
        {/* <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Empty Card</div>
          <div className="h-16 border-b border-gray-200"></div>
        </div> */}
      </div>

      {/* Row 2 - 4 cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Chats Per Agent</div>
          <div className="flex gap-6">
            <div className="text-4xl font-semibold text-gray-600">
              {stats.chatsPerAgent.loggedIn}
            </div>
            <div className="text-4xl font-semibold text-gray-600">
              {stats.chatsPerAgent.online}
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Response Time</div>
          <div className="flex flex-col gap-2">
            <div className="text-4xl font-semibold text-gray-600">
              {stats.responseTime.longest}
            </div>
            <div className="text-4xl font-semibold text-gray-600">
              {stats.responseTime.average}
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Chat Duration</div>
          <div className="flex flex-col gap-2">
            <div className="text-4xl font-semibold text-gray-600">
              {stats.chatDuration.longest}
            </div>
            <div className="text-4xl font-semibold text-gray-600">
              {stats.chatDuration.average}
            </div>
          </div>
        </div>
        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Status</div>
          <div className="flex justify-between gap-6">
            <div className="text-4xl font-semibold text-gray-600">
              {stats.loggedIn}
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <span className="flex items-center gap-1 text-lg">
                <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>{" "}
                {stats.status.green}
              </span>
              <span className="flex items-center gap-1 text-lg">
                <span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span>{" "}
                {stats.status.orange}
              </span>
              <span className="flex items-center gap-1 text-lg">
                <span className="w-3 h-3 rounded-full bg-gray-400 inline-block"></span>{" "}
                {stats.status.gray}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 - 4 cards */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Satisfaction</div>
          <div className="text-4xl font-semibold text-gray-600">
            {stats.satisfaction}%
          </div>
        </div>

        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Ratings</div>
          <div className="flex flex-col gap-1 mt-2">
            <span className="flex items-center gap-1 text-lg">
              <span className="text-green-500">👍</span> {stats.ratings.up}
            </span>
            <span className="flex items-center gap-1 text-lg">
              <span className="text-red-500">👎</span> {stats.ratings.down}
            </span>
          </div>
        </div>
        {/* 
        <div className="bg-white rounded shadow p-6">
          <div className="text-xs text-gray-500 mb-1">Empty Card</div>
          <div className="h-16 border-b border-gray-200"></div>
        </div> */}
      </div>

      {/* <MonitorAgentActivity /> */}
    </div>
  );
};

export default MonitorPage;
