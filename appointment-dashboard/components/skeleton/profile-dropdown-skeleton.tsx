import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";

const ProfileDropdownSkeleton = () => {
  return (
    <Button
      variant="ghost"
      className="flex items-center space-x-2 p-1 cursor-not-allowed"
    >
      <Avatar className="h-8 w-8 bg-gray-200">
        <AvatarFallback />
      </Avatar>
      <div className="text-sm text-left hidden md:block space-y-1">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </Button>
  );
};

export default ProfileDropdownSkeleton;
