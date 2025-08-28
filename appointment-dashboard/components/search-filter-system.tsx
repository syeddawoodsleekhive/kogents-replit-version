"use client";

import type React from "react";

import { useState } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  X,
  Calendar,
  Check,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define the filter types
export type FilterValue = {
  search: string;
  status: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  source: string[];
};

// Define the props for the component
interface SearchFilterSystemProps {
  onFilterChange: (filters: FilterValue) => void;
  initialFilters?: FilterValue;
  showSourceFilter?: boolean;
  placeholder?: string;
}

// Status options
const statusOptions = [
  { value: "confirmed", label: "Confirmed" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// Source options (for future multi-source support)
const sourceOptions = [
  { value: "chatbot", label: "AI Chatbot" },
  { value: "website", label: "Website Form" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "walk-in", label: "Walk-in" },
];

export function SearchFilterSystem({
  onFilterChange,
  initialFilters = {
    search: "",
    status: [],
    dateRange: { from: null, to: null },
    source: ["chatbot"],
  },
  showSourceFilter = false,
  placeholder = "Search by name, email, or ID...",
}: SearchFilterSystemProps) {
  // State for filters
  const [filters, setFilters] = useState<FilterValue>(initialFilters);
  const [statusOpen, setStatusOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFilters = { ...filters, search: e.target.value };
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFiltersCount(newFilters);
  };

  // Handle status selection
  const handleStatusToggle = (value: string) => {
    const newStatus = filters.status.includes(value)
      ? filters.status.filter((item) => item !== value)
      : [...filters.status, value];

    const newFilters = { ...filters, status: newStatus };
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFiltersCount(newFilters);
  };

  // Handle source selection
  const handleSourceToggle = (value: string) => {
    const newSource = filters.source.includes(value)
      ? filters.source.filter((item) => item !== value)
      : [...filters.source, value];

    const newFilters = { ...filters, source: newSource };
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFiltersCount(newFilters);
  };

  // Handle date range selection
  const handleDateRangeChange = (field: "from" | "to", value: Date | null) => {
    const newDateRange = { ...filters.dateRange, [field]: value };
    const newFilters = { ...filters, dateRange: newDateRange };
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFiltersCount(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const newFilters = {
      search: "",
      status: [],
      dateRange: { from: null, to: null },
      source: showSourceFilter ? ["chatbot"] : [],
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
    updateActiveFiltersCount(newFilters);
  };

  // Update the count of active filters
  const updateActiveFiltersCount = (currentFilters: FilterValue) => {
    let count = 0;
    if (currentFilters.search) count++;
    if (currentFilters.status.length > 0) count++;
    if (currentFilters.dateRange.from || currentFilters.dateRange.to) count++;
    if (
      currentFilters.source.length > 0 &&
      currentFilters.source.length < sourceOptions.length
    )
      count++;
    setActiveFiltersCount(count);
  };

  // Format date range for display
  const formatDateRange = () => {
    const { from, to } = filters.dateRange;
    if (from && to) {
      return `${format(from, "MMM d, yyyy")} - ${format(to, "MMM d, yyyy")}`;
    } else if (from) {
      return `From ${format(from, "MMM d, yyyy")}`;
    } else if (to) {
      return `Until ${format(to, "MMM d, yyyy")}`;
    }
    return "Select date range";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative w-full sm:w-auto sm:flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            className="pl-8"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        {/* <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">{activeFiltersCount}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filters</h4>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                    <X className="mr-2 h-4 w-4" />
                    Clear all
                  </Button>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="status">
                    <AccordionTrigger className="py-2">Booking Status</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {statusOptions.map((status) => (
                          <div key={status.value} className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className={`w-full justify-start ${
                                filters.status.includes(status.value) ? "border-primary" : ""
                              }`}
                              onClick={() => handleStatusToggle(status.value)}
                            >
                              {filters.status.includes(status.value) && <Check className="mr-2 h-4 w-4 text-primary" />}
                              {status.label}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="date">
                    <AccordionTrigger className="py-2">Date Range</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="grid gap-2">
                          <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-medium">From</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start text-left font-normal">
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {filters.dateRange.from ? (
                                    format(filters.dateRange.from, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={filters.dateRange.from || undefined}
                                  onSelect={(date) => handleDateRangeChange("from", date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div className="flex flex-col space-y-1.5">
                            <label className="text-sm font-medium">To</label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start text-left font-normal">
                                  <Calendar className="mr-2 h-4 w-4" />
                                  {filters.dateRange.to ? (
                                    format(filters.dateRange.to, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={filters.dateRange.to || undefined}
                                  onSelect={(date) => handleDateRangeChange("to", date)}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  {showSourceFilter && (
                    <AccordionItem value="source">
                      <AccordionTrigger className="py-2">Chatbot/Channel Source</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2">
                          {sourceOptions.map((source) => (
                            <div key={source.value} className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className={`w-full justify-start ${
                                  filters.source.includes(source.value) ? "border-primary" : ""
                                }`}
                                onClick={() => handleSourceToggle(source.value)}
                              >
                                {filters.source.includes(source.value) && (
                                  <Check className="mr-2 h-4 w-4 text-primary" />
                                )}
                                {source.label}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </div>
              <div className="p-4 border-t">
                <Button className="w-full" onClick={() => {}}>
                  Apply Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div> */}
      </div>

      {/* Active filters display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Search className="h-3 w-3" />
              Search: {filters.search}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => {
                  const newFilters = { ...filters, search: "" };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                  updateActiveFiltersCount(newFilters);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.status.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Check className="h-3 w-3" />
              Status:{" "}
              {filters.status
                .map((s) => {
                  const option = statusOptions.find((o) => o.value === s);
                  return option ? option.label : s;
                })
                .join(", ")}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => {
                  const newFilters = { ...filters, status: [] };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                  updateActiveFiltersCount(newFilters);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDateRange()}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 p-0"
                onClick={() => {
                  const newFilters = {
                    ...filters,
                    dateRange: { from: null, to: null },
                  };
                  setFilters(newFilters);
                  onFilterChange(newFilters);
                  updateActiveFiltersCount(newFilters);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {showSourceFilter &&
            filters.source.length > 0 &&
            filters.source.length < sourceOptions.length && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Source:{" "}
                {filters.source
                  .map((s) => {
                    const option = sourceOptions.find((o) => o.value === s);
                    return option ? option.label : s;
                  })
                  .join(", ")}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => {
                    const newFilters = { ...filters, source: ["chatbot"] };
                    setFilters(newFilters);
                    onFilterChange(newFilters);
                    updateActiveFiltersCount(newFilters);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={clearFilters}
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Reset all
          </Button>
        </div>
      )}
    </div>
  );
}
