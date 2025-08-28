"use client";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatButton from "@/components/chat-button";
import { jest } from "@jest/globals";

// Mock the necessary dependencies
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    return <img {...props} />;
  },
}));

describe("ChatButton Component", () => {
  it("renders correctly", () => {
    render(<ChatButton onClick={() => {}} unreadCount={0} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("displays unread count when greater than 0", () => {
    render(<ChatButton onClick={() => {}} unreadCount={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("does not display unread count when 0", () => {
    render(<ChatButton onClick={() => {}} unreadCount={0} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("calls onClick handler when clicked", () => {
    const handleClick = jest.fn();
    render(<ChatButton onClick={handleClick} unreadCount={0} />);

    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("check unread messages count", () => {
    render(<ChatButton unreadCount={5} />);

    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("check unread messages count more than 9", () => {
    render(<ChatButton unreadCount={12} />);

    expect(screen.getByText("9+")).toBeInTheDocument();
  });
});
