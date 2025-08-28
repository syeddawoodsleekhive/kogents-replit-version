import React from "react";

interface DuplicateInfoProps {
  duplicateInfo: string;
}

const DuplicateInfo = React.memo(({ duplicateInfo }: DuplicateInfoProps) => {
  if (!duplicateInfo) return null;

  return (
    <div className="mb-3 p-2 bg-green-50 rounded-md border border-green-200">
      <div className="text-sm text-green-700">
        <span>✓ {duplicateInfo}</span>
      </div>
      <div className="text-xs text-green-600 mt-1">
        Duplicate files are automatically prevented from being sent multiple
        times.
      </div>
    </div>
  );
});

DuplicateInfo.displayName = 'DuplicateInfo';

export default DuplicateInfo;
