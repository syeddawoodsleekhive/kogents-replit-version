"use client"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Clock, Smile, Heart, Coffee, Car, Star, ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// Emoji metadata for better search
type EmojiData = {
  emoji: string
  description: string
  keywords: string[]
  category: string
  supportsSkinTone?: boolean
}

// Skin tone modifiers
const skinTones = {
  default: "",
  light: "🏻",
  mediumLight: "🏼",
  medium: "🏽",
  mediumDark: "🏾",
  dark: "🏿",
}

type SkinTone = keyof typeof skinTones

// Emoji categories and their emojis
const emojiCategories = {
  recent: {
    icon: <Clock size={18} />,
    label: "Recent",
    emojis: ["😀", "👍", "❤️", "🎉", "🔥", "😂", "👏", "🙏", "🤔", "😍"],
  },
  favorites: {
    icon: <Star size={18} />,
    label: "Favorites",
    emojis: [] as string[],
  },
  smileys: {
    icon: <Smile size={18} />,
    label: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
      "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
      "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
      "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
      "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
      "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    ],
  },
  people: {
    icon: <Heart size={18} />,
    label: "People",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
      "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍",
      "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝",
      "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂",
      "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅",
      "👄", "💋", "🩸", "👶", "👧", "🧒", "👦", "👩", "🧑", "👨",
    ],
  },
  nature: {
    icon: <Coffee size={18} />,
    label: "Nature",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐻‍❄️", "🐨",
      "🐯", "🦁", "🐮", "🐷", "🐽", "🐸", "🐵", "🙈", "🙉", "🙊",
      "🐒", "🐔", "🐧", "🐦", "🐤", "🐣", "🐥", "🦆", "🦅", "🦉",
      "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌",
      "🐞", "🐜", "🪰", "🪲", "🪳", "🦟", "🦗", "🕷️", "🕸️", "🦂",
      "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀",
    ],
  },
  food: {
    icon: <Coffee size={18} />,
    label: "Food",
    emojis: [
      "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈",
      "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦",
      "🥬", "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔",
      "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈",
      "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟",
      "🍕", "🫓", "🥪", "🥙", "🧆", "🌮", "🌯", "🫔", "🥗", "🥘",
    ],
  },
  activities: {
    icon: <Car size={18} />,
    label: "Activities",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱",
      "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🪃", "🥅", "⛳",
      "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛼", "🛷",
      "⛸️", "🥌", "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤼", "🤸", "⛹️",
      "🤺", "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣", "🧗",
      "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅", "🎖️", "🏵️", "🎗️",
    ],
  },
  travel: {
    icon: <Car size={18} />,
    label: "Travel",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐",
      "🛻", "🚚", "🚛", "🚜", "🦯", "🦽", "🦼", "🛴", "🚲", "🛵",
      "🏍️", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟",
      "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇",
      "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "�Satellite", "🚀",
      "🛸", "🚁", "🛶", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢", "⚓",
      "🪝",
    ],
  },
  objects: {
    icon: <Star size={18} />, // Changed to Star as Music is unused
    label: "Objects",
    emojis: [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️",
      "🗜️", "💽", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥",
      "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️",
      "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋",
      "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️", "💸", "💵", "💴",
      "💶", "💷", "💰", "💳", "💎", "⚖️", "🪜", "🧰", "🪛", "🔧",
    ],
  },
  symbols: {
    icon: <Star size={18} />, // Changed to Star as Flag is unused in this context
    label: "Symbols",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
      "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
      "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐",
      "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐",
      "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳",
      "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️",
    ],
  },
  flags: {
    icon: <Star size={18} />, // Changed to Star as Flag is unused in this context
    label: "Flags",
    emojis: [
      "🏁", "🚩", "🎌", "🏴", "🏳️", "🏳️‍🌈", "🏳️‍⚧️", "🏴‍☠️", "🇦🇫", "🇦🇽",
      "🇦🇱", "🇩🇿", "🇦🇸", "🇦🇩", "🇦🇴", "🇦🇮", "🇦🇶", "🇦🇬", "🇦🇷", "🇦🇲",
      "🇦🇼", "🇦🇺", "🇦🇹", "🇦🇿", "🇧🇸", "🇧🇭", "🇧🇩", "🇧🇧", "🇧🇾", "🇧🇪",
      "🇧🇿", "🇧🇯", "🇧🇲", "🇧🇹", "🇧🇴", "🇧🇦", "🇧🇼", "🇧🇷", "🇮🇴", "🇻🇬",
      "🇧🇳", "🇧🇬", "🇧🇫", "🇧🇮", "🇰🇭", "🇨🇲", "🇨🇦", "🇮🇨", "🇨🇻", "🇧🇶",
      "🇰🇾", "🇨🇫", "🇹🇩", "🇨🇱", "🇨🇳", "🇨🇽", "🇨🇨", "🇨🇴", "🇰🇲", "🇨🇬",
    ],
  },
}

// Emoji metadata for improved search
const emojiMetadata: Record<string, EmojiData> = {
  "😀": { emoji: "😀", description: "Grinning Face", keywords: ["smile", "happy", "joy", "grin"], category: "smileys" },
  "👍": { emoji: "👍", description: "Thumbs Up", keywords: ["like", "approve", "ok"], category: "people", supportsSkinTone: true },
  "❤️": { emoji: "❤️", description: "Red Heart", keywords: ["love", "like", "emotion"], category: "symbols" },
  "🎉": { emoji: "🎉", description: "Party Popper", keywords: ["celebration", "party", "tada", "hooray"], category: "objects" },
  "🔥": { emoji: "🔥", description: "Fire", keywords: ["hot", "lit", "burn", "trending"], category: "symbols" },
  "😂": { emoji: "😂", description: "Face with Tears of Joy", keywords: ["laugh", "lol", "haha", "joy"], category: "smileys" },
  "👏": { emoji: "👏", description: "Clapping Hands", keywords: ["applause", "praise", "clap"], category: "people", supportsSkinTone: true },
  "🙏": { emoji: "🙏", description: "Folded Hands", keywords: ["please", "thank you", "pray", "request"], category: "people", supportsSkinTone: true },
  "🤔": { emoji: "🤔", description: "Thinking Face", keywords: ["hmm", "wonder", "confused"], category: "smileys" },
  "😍": { emoji: "😍", description: "Smiling Face with Heart-Eyes", keywords: ["love", "crush", "adore"], category: "smileys" },
}

// Emoji shortcut mappings
const emojiShortcuts: Record<string, string> = {
  ":)": "🙂",
  ":D": "😀",
  ":(": "🙁",
  ";)": "😉",
  ":P": "😛",
  ":O": "😮",
  "<3": "❤️",
  ":/": "😕",
  ":'(": "😢",
  ":*": "😘",
  "-_-": "😑",
  "^_^": "😊",
  ">:(": "😠",
  ":smile:": "😊",
  ":laugh:": "😂",
  ":joy:": "😂",
  ":heart:": "❤️",
  ":fire:": "🔥",
  ":thumbsup:": "👍",
  ":clap:": "👏",
  ":pray:": "🙏",
  ":thinking:": "🤔",
  ":heart_eyes:": "😍",
}

// Skin tone modifiable emojis (partial list)
const skinToneModifiableEmojis = [
  "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
  "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "☝️", "👍", "👎",
  "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏",
  "✍️", "💪", "🦵", "🦶", "👂", "🦻", "👃", "👶", "👧", "🧒",
  "👦", "👩", "🧑", "👨", "👱", "👴", "👵", "🧓",
]

type EmojiPickerProps = {
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState("recent")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredEmojis, setFilteredEmojis] = useState<string[]>([])
  // const [searchResults, setSearchResults] = useState<{ emoji: string; score: number }[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedSkinTone, setSelectedSkinTone] = useState<SkinTone>("default")
  const [showSkinToneSelector, setShowSkinToneSelector] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [showShortcutSuggestions, setShowShortcutSuggestions] = useState(false)
  const [shortcutSuggestions, setShortcutSuggestions] = useState<string[]>([])
  const pickerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load favorites and skin tone preference from localStorage
  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem("emojiPickerFavorites")
      if (storedFavorites) {
        const parsedFavorites = JSON.parse(storedFavorites)
        setFavorites(parsedFavorites)
        emojiCategories.favorites.emojis = parsedFavorites
      }

      const storedSkinTone = localStorage.getItem("emojiPickerSkinTone") as SkinTone | null
      if (storedSkinTone && skinTones[storedSkinTone]) {
        setSelectedSkinTone(storedSkinTone)
      }
    } catch (e) {
      console.error("Failed to load emoji preferences", e)
    }
  }, [])

  // Handle search
  useEffect(() => {
    if (searchTerm) {
      const allEmojis = Object.values(emojiCategories).flatMap((category) => category.emojis)
      const results = allEmojis
        .map((emoji) => {
          const metadata = emojiMetadata[emoji] || {
            emoji,
            description: "",
            keywords: [],
            category: "",
          }

          let score = 0
          if (emoji.includes(searchTerm)) score += 100
          if (metadata.description.toLowerCase().includes(searchTerm.toLowerCase())) score += 50
          const keywordMatch = metadata.keywords.some((keyword) =>
            keyword.toLowerCase().includes(searchTerm.toLowerCase()),
          )
          if (keywordMatch) score += 30

          return { emoji, score }
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)

      // setSearchResults(results)
      setFilteredEmojis(results.map((r) => r.emoji))
    } else {
      setFilteredEmojis([])
      // setSearchResults([])
    }
  }, [searchTerm])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (inputValue) {
      const matchingShortcuts = Object.keys(emojiShortcuts).filter(
        (shortcut) =>
          shortcut.toLowerCase().includes(inputValue.toLowerCase()) ||
          shortcut.toLowerCase().startsWith(`:${inputValue.toLowerCase()}`),
      )

      if (matchingShortcuts.length > 0) {
        setShortcutSuggestions(matchingShortcuts)
        setShowShortcutSuggestions(true)
      } else {
        setShowShortcutSuggestions(false)
      }
    } else {
      setShowShortcutSuggestions(false)
    }
  }, [inputValue])

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Apply skin tone to emoji if supported
  const applySkinTone = (emoji: string): string => {
    if (selectedSkinTone === "default" || !skinToneModifiableEmojis.includes(emoji)) {
      return emoji
    }
    return emoji + skinTones[selectedSkinTone]
  }

  const handleEmojiClick = (emoji: string) => {
    const finalEmoji = applySkinTone(emoji)
    onEmojiSelect(finalEmoji)

    const currentRecent = [...emojiCategories.recent.emojis]
    if (!currentRecent.includes(emoji)) {
      currentRecent.unshift(emoji)
      if (currentRecent.length > 10) {
        currentRecent.pop()
      }
      emojiCategories.recent.emojis = currentRecent
      try {
        localStorage.setItem("emojiPickerRecent", JSON.stringify(currentRecent))
      } catch (e) {
        console.error("Failed to save recent emojis", e)
      }
    }
  }

  const toggleFavorite = (emoji: string, e: React.MouseEvent) => {
    e.stopPropagation()
    let updatedFavorites: string[]

    if (favorites.includes(emoji)) {
      updatedFavorites = favorites.filter((e) => e !== emoji)
    } else {
      updatedFavorites = [...favorites, emoji]
    }

    setFavorites(updatedFavorites)
    emojiCategories.favorites.emojis = updatedFavorites
    try {
      localStorage.setItem("emojiPickerFavorites", JSON.stringify(updatedFavorites))
    } catch (e) {
      console.error("Failed to save emoji favorites", e)
    }
  }

  const handleSkinToneSelect = (tone: SkinTone) => {
    setSelectedSkinTone(tone)
    setShowSkinToneSelector(false)
    try {
      localStorage.setItem("emojiPickerSkinTone", tone)
    } catch (e) {
      console.error("Failed to save skin tone preference", e)
    }
  }

  const handleShortcutSelect = (shortcut: string) => {
    const emoji = emojiShortcuts[shortcut]
    if (emoji) {
      handleEmojiClick(emoji)
    }
    setShowShortcutSuggestions(false)
    setInputValue("")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)

    if (emojiShortcuts[value]) {
      handleEmojiClick(emojiShortcuts[value])
      setInputValue("")
      return
    }

    setSearchTerm(value)
  }

  const getSkinToneName = (tone: SkinTone): string => {
    switch (tone) {
      case "default": return "Default"
      case "light": return "Light"
      case "mediumLight": return "Medium Light"
      case "medium": return "Medium"
      case "mediumDark": return "Medium Dark"
      case "dark": return "Dark"
    }
  }

  const getSkinTonePreview = (tone: SkinTone): string => {
    return tone === "default" ? "👋" : `👋${skinTones[tone]}`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showShortcutSuggestions && shortcutSuggestions.length > 0) {
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        handleShortcutSelect(shortcutSuggestions[0])
      } else if (e.key === "Escape") {
        setShowShortcutSuggestions(false)
      }
    }
  }

  return (
    <motion.div
      ref={pickerRef}
      className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg z-10 w-64 overflow-hidden"
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      transition={{ duration: 0.15 }}
    >
      <div className="p-2 border-b" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <Search
            className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={16}
          />
          <Input
            ref={inputRef}
            placeholder="Search or type :emoji:"
            className="pl-8 h-8 text-sm"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center">
            <button
              type="button"
              className="text-lg hover:bg-gray-100 rounded p-0.5 flex items-center"
              onClick={(e) => {
                e.stopPropagation();
                setShowSkinToneSelector(!showSkinToneSelector);
              }}
            >
              {getSkinTonePreview(selectedSkinTone)}
              <ChevronDown size={12} className="ml-0.5" />
            </button>
          </div>
          {showShortcutSuggestions && shortcutSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-md rounded-md z-20 max-h-32 overflow-y-auto">
              {shortcutSuggestions.map((shortcut, index) => (
                <button
                  type="button"
                  key={index}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center"
                  onClick={() => handleShortcutSelect(shortcut)}
                >
                  <span className="mr-2 text-lg">
                    {emojiShortcuts[shortcut]}
                  </span>
                  <span className="text-sm text-gray-600">{shortcut}</span>
                </button>
              ))}
            </div>
          )}
          {showSkinToneSelector && (
            <div className="absolute top-full right-0 mt-1 bg-white shadow-md rounded-md z-20">
              {(Object.keys(skinTones) as SkinTone[]).map((tone) => (
                <button
                  type="button"
                  key={tone}
                  className={cn(
                    "w-full text-left px-3 py-1.5 hover:bg-gray-100 flex items-center justify-between",
                    selectedSkinTone === tone ? "bg-gray-100" : ""
                  )}
                  onClick={() => handleSkinToneSelect(tone)}
                >
                  <span className="text-sm">{getSkinToneName(tone)}</span>
                  <span className="text-lg">{getSkinTonePreview(tone)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <Tabs
        defaultValue="recent"
        value={activeCategory}
        onValueChange={setActiveCategory}
      >
        <TabsList
          className="grid grid-cols-5 h-10 bg-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          {Object.entries(emojiCategories)
            .slice(0, 5)
            .map(([key, category]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center justify-center p-0 data-[state=active]:bg-white"
                onClick={(e) => e.stopPropagation()}
              >
                {category.icon}
              </TabsTrigger>
            ))}
        </TabsList>

        {searchTerm ? (
          <div className="p-2 h-60 overflow-y-auto">
            {filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis.map((emoji, index) => (
                  <div key={index} className="relative group">
                    <button
                      type="button"
                      className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEmojiClick(emoji);
                      }}
                      title={emojiMetadata[emoji]?.description || emoji}
                    >
                      {applySkinTone(emoji)}
                    </button>
                    <button
                      type="button"
                      className={cn(
                        "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                        favorites.includes(emoji)
                          ? "bg-yellow-400 text-yellow-800"
                          : "bg-gray-200 hover:bg-gray-300"
                      )}
                      onClick={(e) => toggleFavorite(emoji, e)}
                    >
                      <Star
                        size={8}
                        className={
                          favorites.includes(emoji) ? "fill-yellow-800" : ""
                        }
                      />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No emojis found for "{searchTerm}"</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        ) : (
          Object.entries(emojiCategories).map(([key, category]) => (
            <TabsContent
              key={key}
              value={key}
              className="p-2 h-60 overflow-y-auto m-0"
            >
              {key === "favorites" && favorites.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Star size={24} className="mb-2" />
                  <p>No favorite emojis yet</p>
                  <p className="text-xs mt-1">
                    Click the star on any emoji to add it here
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-8 gap-1">
                  {category.emojis.map((emoji, index) => (
                    <div key={index} className="relative group">
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-100 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEmojiClick(emoji);
                        }}
                        title={emojiMetadata[emoji]?.description || emoji}
                      >
                        {applySkinTone(emoji)}
                      </button>
                                              <button
                          type="button"
                          className={cn(
                            "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
                            favorites.includes(emoji)
                              ? "bg-yellow-400 text-yellow-800"
                              : "bg-gray-200 hover:bg-gray-300"
                          )}
                          onClick={(e) => toggleFavorite(emoji, e)}
                        >
                        <Star
                          size={8}
                          className={
                            favorites.includes(emoji) ? "fill-yellow-800" : ""
                          }
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))
        )}
      </Tabs>

      <div
        className="p-2 border-t bg-gray-50 flex justify-between items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-gray-500">
          {searchTerm
            ? `${filteredEmojis.length} results`
            : activeCategory === "recent"
            ? "Recently used"
            : activeCategory === "favorites"
            ? "Your favorites"
            : emojiCategories[activeCategory as keyof typeof emojiCategories].label}
        </span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}