import React from "react";

interface CompressionProgressBarProps {
  isCompressing: boolean;
  compressionProgress: number;
}

const CompressionProgressBar = React.memo(({ 
  isCompressing, 
  compressionProgress 
}: CompressionProgressBarProps) => {
  if (!isCompressing) return null;

  return (
    <div className="mb-3 p-2 bg-blue-50 rounded-md border border-blue-200">
      <div className="flex items-center justify-between text-sm text-blue-700 mb-1">
        <span>Processing files...</span>
        <span>{compressionProgress}%</span>
      </div>
      <div className="w-full bg-blue-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${compressionProgress}%` }}
        />
      </div>
      {compressionProgress > 0 && compressionProgress < 100 && (
        <div className="text-xs text-blue-600 mt-1">
          {compressionProgress < 50
            ? "Compressing images..."
            : "Uploading in chunks..."}
        </div>
      )}
    </div>
  );
});

CompressionProgressBar.displayName = 'CompressionProgressBar';

export default CompressionProgressBar;
