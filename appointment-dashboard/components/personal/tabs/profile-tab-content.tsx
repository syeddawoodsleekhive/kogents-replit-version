import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useRef } from "react";

export function ProfileTabContent() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setAvatar(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold mb-2">Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center text-sm justify-between">
            <span className="font-medium">Name</span>
            <span>John Man</span>
          </div>
          <div className="flex items-center text-sm justify-between">
            <span className="font-medium">Email</span>
            <span>logoorbit@gmail.com</span>
          </div>
          <div className="flex items-center text-sm justify-between">
            <span className="font-medium">Profile</span>
            <a href="#" className="text-blue-600 hover:underline text-sm">Edit profile <span aria-label="external link">↗</span></a>
          </div>
          <CardDescription className="text-xs text-muted-foreground">Update your name, email, and password</CardDescription>
          <div className="text-sm">
            <label className="font-medium block text-sm mb-1">Display name</label>
            <input className="border rounded px-3 py-2 w-full" defaultValue="John Man - BD" />
          </div>
          <div className="text-sm">
            <label className="font-medium block text-sm mb-1">Tagline</label>
            <input className="border rounded px-3 py-2 w-full" placeholder="" />
          </div>
          <div>
            <label className="font-medium block text-sm mb-1">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="border rounded w-16 h-16 flex items-center justify-center bg-gray-100 overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded" />
                ) : (
                  <svg width="32" height="32" fill="none"><rect width="32" height="32" fill="#e5e7eb" /><path d="M8 24l4-4 4 4 4-8 4 8" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  className="text-xs px-3 py-1 rounded bg-primary text-white mr-2"
                  onClick={handleUploadClick}
                >
                  Upload image
                </button>
                <button className="px-3 py-1 rounded bg-muted text-muted-foreground text-sm" disabled>Remove</button>
                <p className="text-xs text-muted-foreground mt-2">
                  Appears when chatting with visitors using the new widget<br />
                  Maximum size 100 KB, recommended dimensions 50x50px
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
