"use client";

import Link from "next/link";
import {
  CalendarDays,
  MessageSquare,
  Users,
  UserCheck,
  ShieldCheck,
  WandSparkles,
  Tag,
  MessageSquareText,
  ChartNoAxesCombined,
  Monitor,
  HomeIcon,
  CircleUser,
  UserRoundPen,
  Palette,
  Goal,
  Shield,
  Bot,
  Settings,
  ChevronDown,
  Zap,
  Briefcase,
  Chrome,
  Component,
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import "../../globals.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import {
  initNotificationListeners,
  requestNotificationPermission,
} from "@/utils/notification";
import ProfileDropdownSkeleton from "@/components/skeleton/profile-dropdown-skeleton";
import { VisitorProvider } from "@/context/VisitorContext";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile, logoutUser } from "@/api/v2/user";
import { NotificationCenter } from "@/components/notification-center";
import { TeamsDialog } from "@/components/teams";
import { dummyAgents } from "@/dummyData/agents";
import { TeamDialog } from "@/components/teams/team-dialog";

type ListItemBase = {
  href?: string;
  label: string;
  icon?: React.ComponentType<any>;
  list?: ListItem[];
  online?: boolean; // add here if used
};

type ListItemWithComponent = ListItemBase & {
  component: ({ children }: { children: React.ReactNode }) => ReactElement;
  viewAll: ({ children }: { children: React.ReactNode }) => ReactElement;
  total: number;
};

type ListItem = ListItemBase | ListItemWithComponent;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, user, workspace } = useSelector(
    (state: RootReducerState) => state.user
  );

  const dispatch: AppReducerDispatch = useDispatch();

  const workspaceSlug = workspace?.slug || "orbittech";
  const router = useRouter();

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchUserProfile());
    }
  }, [token, user, router]);

  const mainLinks = useMemo(
    () => [
      {
        href: `/${workspaceSlug}`,
        icon: HomeIcon,
        label: "Home",
      },
      {
        href: `/${workspaceSlug}`,
        icon: MessageSquare,
        label: "Visitors",
      },
      {
        href: `/${workspaceSlug}/chat-logs`,
        icon: MessageSquareText,
        label: "Chat History",
      },
    ],
    [workspaceSlug]
  );

  const settingsList = useMemo(
    () => [
      {
        href: `/${workspaceSlug}/users`,
        icon: Users,
        label: "Users",
      },
      {
        href: `/${workspaceSlug}/banned-visitors`,
        icon: Shield,
        label: "Banned Visitors",
      },
      {
        href: `/${workspaceSlug}/tags`,
        icon: Tag,
        label: "Tags",
      },
      {
        href: `/${workspaceSlug}/canned-responses`,
        icon: WandSparkles,
        label: "Canned Responses",
      },
      // {
      //   href: `/${workspaceSlug}/goals`,
      //   icon: Goal,
      //   label: "Goals",
      // },
      {
        href: `/${workspaceSlug}/widget-settings`,
        icon: Palette,
        label: "Widget",
      },
      {
        href: `/${workspaceSlug}/roles`,
        icon: UserCheck,
        label: "Roles",
      },
      {
        href: `/${workspaceSlug}/permissions`,
        icon: ShieldCheck,
        label: "Permissions",
      },
      {
        href: `/${workspaceSlug}/triggers`,
        icon: Zap,
        label: "Triggers",
      },
      {
        href: `/${workspaceSlug}/departments`,
        icon: Briefcase,
        label: "Departments",
      },
      {
        href: `/${workspaceSlug}/personal`,
        icon: UserRoundPen,
        label: "Personal",
      },
      {
        href: `/${workspaceSlug}/account`,
        icon: CircleUser,
        label: "Account",
      },
    ],
    [workspaceSlug]
  );

  const chatBotLinks = useMemo(
    () => [
      {
        href: `/${workspaceSlug}/chatbots`,
        icon: Bot,
        label: "Chatbots",
      },
    ],
    [workspaceSlug]
  );

  const settingsLinks = useMemo(
    () => [
      {
        href: `/${workspaceSlug}/analytics`,
        icon: ChartNoAxesCombined,
        label: "Analytics",
      },
      {
        href: `/${workspaceSlug}/monitor`,
        icon: Monitor,
        label: "Monitor",
      },
      {
        icon: Settings,
        label: "Settings",
        list: settingsList.map((item) => ({
          ...item,
          list: undefined,
        })),
      },
      {
        href: `/${workspaceSlug}/teams`,
        icon: Component,
        label: "Teams",
        list: [
          {
            label: "View All",
            total: dummyAgents.length || 0,
            item: false,
            viewAll: ({ children }: { children: React.ReactNode }) => (
              <TeamsDialog>{children}</TeamsDialog>
            ),
          },
          ...dummyAgents.map((agent) => ({
            ...agent,
            component: ({ children }: { children: React.ReactNode }) => (
              <TeamDialog>{children}</TeamDialog>
            ),
          })),
        ],
      },
    ],
    [workspaceSlug]
  );

  useEffect(() => {
    initNotificationListeners();
    requestNotificationPermission();
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    router.push(`/${workspaceSlug}/login`);
  };

  const [openDropdowns, setOpenDropdowns] = useState<number[]>([]);
  const handleToggleDropdown = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    e.stopPropagation();
    if (openDropdowns.includes(index)) {
      setOpenDropdowns(openDropdowns.filter((i) => i !== index)); // Close
    } else {
      setOpenDropdowns([...openDropdowns, index]); // Open
    }
  };

  const requests = 0;
  function isListItemWithComponent(
    item: ListItem
  ): item is ListItemWithComponent {
    return (item as ListItemWithComponent).viewAll !== undefined;
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden md:flex w-64 min-w-64 flex-col border-r bg-background sticky top-0 max-h-screen">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            <span className="text-xl font-bold capitalize">
              {workspace?.name}
            </span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2 min-h-[100vh-6.25rem] overflow-y-auto">
          {mainLinks.map(({ href, icon: Icon, label }, index) => (
            <Link
              key={index}
              href={href}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          {/* {chatBotLinks.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted"
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))} */}
          {/* <p className="px-2 pt-7 text-[0.8125rem] font-medium">Settings</p> */}
          {settingsLinks.map(({ href, icon: Icon, label, list }, index) => (
            <div
              key={index}
              onClick={(e: any) => handleToggleDropdown(e, index)}
            >
              <Link
                href={href || "#"}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition-all hover:bg-muted relative"
              >
                {Icon && <Icon className="h-4 w-4 sm:h-5 sm:w-5" />}
                <span className="hidden sm:inline">{label}</span>
                {list && list.length > 0 && (
                  <div
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-transform duration-300 ${
                      openDropdowns.includes(index) ? "rotate-180" : "rotate-0"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </div>
                )}
              </Link>
              <div
                className={`pl-6 overflow-y-auto transition-[max-height] duration-300 ease-in-out ${
                  openDropdowns.includes(index) ? "max-h-[26rem]" : "max-h-0"
                }`}
              >
                {list?.map((item: any, idx) => (
                  <React.Fragment key={idx}>
                    {isListItemWithComponent(item) ? (
                      <item.viewAll>
                        <button
                          type="button"
                          className="flex items-center justify-between w-full text-left px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded truncate"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.label}
                          {item.total && (
                            <span className="ml-2 bg-gray-200 w-7 h-7 flex items-center justify-center font-medium rounded-md text-xs text-muted-foreground">
                              {item.total}
                            </span>
                          )}
                        </button>
                      </item.viewAll>
                    ) : item?.component ? (
                      <item.component>
                        <Link
                          href={item.href ?? "#"}
                          onClick={(e) => e.stopPropagation()}
                          className="group px-4 py-2 text-sm rounded flex items-center gap-2 text-muted-foreground hover:text-black"
                        >
                          {typeof item?.online === "boolean" && (
                            <span
                              className={`w-2 h-2 min-w-2 min-h-2 rounded-full transition-colors duration-150 ${
                                item.online
                                  ? "bg-green-500/70 group-hover:bg-green-500"
                                  : "bg-gray-400/70 group-hover:bg-gray-400"
                              }`}
                            />
                          )}
                          <span className="truncate">{item.name}</span>
                        </Link>
                      </item.component>
                    ) : (
                      <Link
                        href={item.href ?? "#"}
                        onClick={(e) => e.stopPropagation()}
                        className="group px-4 py-2 text-sm rounded flex items-center gap-2 text-muted-foreground hover:text-black"
                      >
                        {typeof item?.online === "boolean" && (
                          <span
                            className={`w-2 h-2 min-w-2 min-h-2 rounded-full transition-colors duration-150 ${
                              item.online
                                ? "bg-green-500/70 group-hover:bg-green-500"
                                : "bg-gray-400/70 group-hover:bg-gray-400"
                            }`}
                          />
                        )}
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t w-full p-2 max-w-52 mx-auto">
          <img
            src="/favicon.png"
            alt=""
            className="mx-auto w-9 h-9"
            style={{ filter: "grayscale(1)" }}
          />
          <div className="flex items-center justify-center p-2 w-full">
            <span
              className={`p-3 ${
                requests > 0 ? "bg-black text-white" : "bg-gray-200"
              }  rounded-[5rem] w-full text-center text-xs font-medium`}
            >
              {requests > 0 ? "Server 1 requests" : "0 requests"}
            </span>
          </div>
        </div>
      </div>
      <div
        className="flex flex-col min-h-screen"
        style={{ width: "calc(100vw - 16rem)" }}
      >
        {/* Topbar Navigation */}
        <header className="sticky top-0 z-10 border-b bg-background flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold capitalize"></span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center space-x-2 p-1"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt="" />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.name?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-sm text-left hidden md:block">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {user?.role?.name || "Admin"}
                      </p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push(`/${workspaceSlug}/profile`)}
                  >
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <ProfileDropdownSkeleton />
            )}
          </div>
        </header>
        {/* Main Content */}
        <VisitorProvider>
          <div className="flex-1">
            {children}
            <Toaster />
          </div>
        </VisitorProvider>
      </div>
    </div>
  );
}
