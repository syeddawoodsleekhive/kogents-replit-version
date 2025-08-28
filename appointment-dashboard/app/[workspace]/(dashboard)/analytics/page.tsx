"use client";
import { useState } from "react";
import {
  ChevronDown,
  MessageCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ComposedChart,
  Area,
} from "recharts";

// Dummy data matching the image
const chartData = [
  { date: "Apr 5", served: 580, missed: 25, total: 605, waitTime: 45 },
  { date: "Apr 6", served: 720, missed: 35, total: 755, waitTime: 52 },
  { date: "Apr 7", served: 480, missed: 20, total: 500, waitTime: 38 },
  { date: "Apr 8", served: 890, missed: 30, total: 920, waitTime: 78 },
  { date: "Apr 9", served: 820, missed: 28, total: 848, waitTime: 65 },
  { date: "Apr 10", served: 750, missed: 32, total: 782, waitTime: 58 },
  { date: "Apr 11", served: 620, missed: 22, total: 642, waitTime: 42 },
];

const AnalyticsPage = () => {
  const [selectedTab, setSelectedTab] = useState("total");
  const [timeRange, setTimeRange] = useState("7days");
  const [granularity, setGranularity] = useState("daily");
  const [department, setDepartment] = useState("all");

  return (
    <div className="p-6 bg-[#f6f6f6] min-h-screen">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm text-gray-500">Date Range</div>
              <div className="text-lg font-semibold">
                Sat, Apr 5 2014 - Fri, Apr 11 2014
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-800">4,402</div>
            <div className="text-sm text-gray-600">Total Chats</div>
          </div>

          <div className="flex gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={granularity} onValueChange={setGranularity}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>

            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Filter Department</SelectItem>
                <SelectItem value="support">Support</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedTab("total")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === "total"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Total Chats
          </button>
          <button
            onClick={() => setSelectedTab("served")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === "served"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Chats Served
          </button>
          <button
            onClick={() => setSelectedTab("missed")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedTab === "missed"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Chats Missed
          </button>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#666" }}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#666" }}
              domain={[0, 2000]}
              ticks={[0, 500, 1000, 1500, 2000]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#666" }}
              domain={[0, 80]}
              ticks={[0, 20, 40, 60, 80]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
                      <div className="font-semibold text-gray-800 mb-2">
                        {label}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-orange-500 rounded"></div>
                          <span className="text-orange-600">
                            Chats Missed: {payload[0]?.payload.missed}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-green-600">
                            Chats Served: {payload[0]?.payload.served}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          Wait Time (Served): {payload[0]?.payload.waitTime}s
                        </div>
                        <div className="text-red-500 text-sm cursor-pointer">
                          View Agent Reports
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Stacked Bars */}
            <Bar dataKey="served" stackId="a" fill="#22C55E" yAxisId="left" />
            <Bar dataKey="missed" stackId="a" fill="#F97316" yAxisId="left" />

            {/* Line for wait time */}
            <Line
              type="monotone"
              dataKey="waitTime"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
              yAxisId="right"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">3,918</div>
              <div className="text-sm text-gray-500">Chats Served</div>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500 ml-auto" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">484</div>
              <div className="text-sm text-gray-500">Chats Missed</div>
            </div>
            <TrendingDown className="w-4 h-4 text-orange-500 ml-auto" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">35s</div>
              <div className="text-sm text-gray-500">Wait Time (Served)</div>
            </div>
            <TrendingUp className="w-4 h-4 text-green-500 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
