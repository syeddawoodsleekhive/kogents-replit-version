"use client";

type DialogProps = {
  children: React.ReactNode;
};

export function TeamDialog({ children }: DialogProps) {
  return <div onClick={(e) => e.stopPropagation()}>{children}</div>;
}
