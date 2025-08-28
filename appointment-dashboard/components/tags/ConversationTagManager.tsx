"use client";

import type React from "react";
import { useRef, useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Plus, X, Loader2 } from "lucide-react";
import { useConversationTags } from "@/hooks/useConversationTags";
import Link from "next/link";
import { useSelector } from "react-redux";

interface ConversationTagManagerProps {
  conversationId: string;
  className?: string;
  connected: boolean;
  assignTagToChat: (roomId: string, tagId: string) => void;
  unassignTagFromChat: (roomId: string, tagId: string) => void;
}

const ConversationTagManager: React.FC<ConversationTagManagerProps> = ({
  conversationId,
  className = "",
  connected = false,
  assignTagToChat,
  unassignTagFromChat,
}) => {
  const user = useSelector((state: RootReducerState) => state.user.user);
  const {
    conversationTags,
    unassignedTags,
    addTag,
    removeTag,
    getCategoryName,
  } = useConversationTags(conversationId, assignTagToChat, unassignTagFromChat);

  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(
    new Set()
  );

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentTagIds = new Set(conversationTags.map((tag) => tag.id));

    setPendingOperations((prev) => {
      const newSet = new Set(prev);

      currentTagIds.forEach((tagId) => newSet.delete(tagId));

      prev.forEach((pendingTagId) => {
        if (!currentTagIds.has(pendingTagId)) {
          newSet.delete(pendingTagId);
        }
      });

      return newSet;
    });
  }, [conversationTags]);

  const filteredUnassignedTags = useMemo(() => {
    if (!searchQuery.trim()) return unassignedTags;

    const lowercaseQuery = searchQuery.toLowerCase();
    return unassignedTags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(lowercaseQuery) ||
        (tag.categoryId &&
          getCategoryName(tag.categoryId)
            ?.toLowerCase()
            .includes(lowercaseQuery))
    );
  }, [unassignedTags, searchQuery, getCategoryName]);

  const handleAddExistingTag = async (tag: Tag) => {
    setPendingOperations((prev) => new Set(prev).add(tag.id));

    try {
      const success = await addTag(tag);
      if (success) {
        setSearchQuery("");
        setShowDropdown(false);
        inputRef.current?.blur();
      }
    } catch (error) {
      setPendingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tag.id);
        return newSet;
      });
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    setPendingOperations((prev) => new Set(prev).add(tagId));

    try {
      await removeTag(tagId);
    } catch (error) {
      setPendingOperations((prev) => {
        const newSet = new Set(prev);
        newSet.delete(tagId);
        return newSet;
      });
    }
  };

  const handleInputFocus = () => setShowDropdown(true);
  const handleInputBlur = () => setTimeout(() => setShowDropdown(false), 500);
  const handleSearchChange = (value: string) => setSearchQuery(value);

  const isTagPending = (tagId: string) => pendingOperations.has(tagId);

  return (
    <Card className={className}>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm font-medium text-gray-700 block">
          <div className="flex justify-between mb-2">
            <span>Tags</span>
            <button className="relative z-50 group text-gray-500 rounded-full bg-gray-200 h-5 w-5 flex items-center justify-center text-xs font-semibold">
              ?{" "}
              <div className="group-hover:block hidden absolute right-3 top-3 z-40 text-start rounded-lg border bg-card text-card-foreground shadow-sm w-[250px]">
                <div className="border-b p-3">
                  <span>Tags</span>
                </div>
                <p className="p-3 font-normal leading-5">
                  Categorize and group chats with <br /> tags to gain insight
                  into your chat session.{" "}
                  <Link href="/" className="text-blue-700">
                    Learn more
                  </Link>
                </p>
              </div>
            </button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        <div className="space-y-2">
          <Command className="border rounded-md relative overflow-visible group focus-within:z-10 remove-border-bottom">
            <CommandInput
              placeholder="Add chat tags"
              value={searchQuery}
              onValueChange={handleSearchChange}
              disabled={!connected}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              ref={inputRef}
            />
            {connected && showDropdown && (
              <CommandList className="absolute max-h-32 bg-white top-full left-0 w-full shadow-lg rounded-md transition-all duration-200 group-focus-within:opacity-100 group-focus-within:visible opacity-0 invisible z-20">
                <CommandEmpty className="flex items-center text-[0.75rem] space-x-2">
                  <span className="flex-1">No available tags found.</span>
                </CommandEmpty>
                {filteredUnassignedTags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    className="flex items-center text-[0.75rem] space-x-2 cursor-pointer"
                    onSelect={() => handleAddExistingTag(tag)}
                    disabled={isTagPending(tag.id)}
                  >
                    <span className="flex-1">{tag.name}</span>
                    {isTagPending(tag.id) && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                  </CommandItem>
                ))}
              </CommandList>
            )}
          </Command>
        </div>

        {conversationTags.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {conversationTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="flex items-center group gap-1 bg-gray-200 p-1 font-normal text-[0.6875rem] leading-[1.35] px-2 rounded-sm hover:bg-gray-300"
                  >
                    {tag.name}
                    {connected && tag.assignedBy === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-2.5 w-2.5 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveTag(tag.id)}
                        disabled={isTagPending(tag.id)}
                      >
                        {isTagPending(tag.id) ? (
                          <Loader2 className="h-1 w-1 animate-spin" />
                        ) : (
                          <X className="h-1 w-1 text-gray-500" />
                        )}
                      </Button>
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ConversationTagManager;
