import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../app/App";

describe("App", () => {
  it("renders bottom navigation", () => {
    render(<App />);
    expect(screen.getAllByText("Финансы").length).toBeGreaterThan(0);
    expect(screen.getByText("Графики")).toBeInTheDocument();
  });
});
