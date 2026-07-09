/**
 * Unit tests for the SEO Report Plugin (RFC-008).
 *
 * Tests cover:
 * - Plugin registration with engine
 * - Plugin execution in report phase
 * - Integration with existing analyzer plugins
 * - End-to-end report generation
 */

import { describe, it, expect } from "vitest";
import { createReportPlugin } from "../report-plugin";
import { SeoEngine } from "../../core";
import { createRegistry } from "../../core";
import { createTitlePlugin } from "../../analyzer";
import type { ReportPluginPayload } from "../types";
import type { SeoCheckResult, PageSignals } from "../../types";

describe("Report Plugin Registration", () => {
  it("registers with correct id and capability", () => {
    const plugin = createReportPlugin();
    expect(plugin.id).toBe("report.generator");
    expect(plugin.capability).toBe("report");
    expect(plugin.name).toBe("SEO Report Generator");
  });

  it("has version 1.0.0", () => {
    const plugin = createReportPlugin();
    expect(plugin.version).toBe("1.0.0");
  });

  it("can be registered with the registry", () => {
    const registry = createRegistry();
    const plugin = createReportPlugin();
    expect(() => registry.register(plugin)).not.toThrow();
    expect(registry.has("report.generator")).toBe(true);
  });
});

describe("Report Plugin Execution", () => {
  it("produces a valid report for valid input", async () => {
    const plugin = createReportPlugin();
    const payload: ReportPluginPayload = {
      propertyId: "prop-1",
      url: "https://example.com/page",
      checks: [
        {
          checkId: "test-check",
          summary: "Test",
          issues: [],
          passed: true,
        },
      ],
    };

    const result = await plugin.run({
      phase: "report",
      capability: "report",
      payload,
      config: {
        runId: "test-run",
        enabledPlugins: new Set(["report.generator"]),
        priorities: new Map(),
        version: "0.1.0",
        options: {},
      },
      state: {
        set: () => {},
        get: () => undefined,
        has: () => false,
        entries: function* () {},
      },
    });

    expect(result.kind).toBe("artifact");
    expect(result.pluginId).toBe("report.generator");
    if (result.kind === "artifact") {
      const report = result.value;
      expect(report.overallScore).toBe(100);
      expect(report.metadata.propertyId).toBe("prop-1");
    }
  });

  it("throws on missing propertyId", async () => {
    const plugin = createReportPlugin();
    const payload: ReportPluginPayload = {
      propertyId: "",
      checks: [],
    };

    await expect(
      plugin.run({
        phase: "report",
        capability: "report",
        payload,
        config: {
          runId: "test-run",
          enabledPlugins: new Set(),
          priorities: new Map(),
          version: "0.1.0",
          options: {},
        },
        state: {
          set: () => {},
          get: () => undefined,
          has: () => false,
          entries: function* () {},
        },
      })
    ).rejects.toThrow("Report input validation failed: metadata.propertyId is required");
  });
});

describe("Engine Integration", () => {
  it("runs the report plugin via the engine", async () => {
    const engine = new SeoEngine();
    const reportPlugin = createReportPlugin();
    engine.use(reportPlugin);

    const payload: ReportPluginPayload = {
      propertyId: "engine-test",
      checks: [
        {
          checkId: "test",
          summary: "Test",
          issues: [],
          passed: true,
        },
      ],
    };

    const result = await engine.run({
      capability: "report",
      payload,
    });

    expect(result.ok).toBe(true);
    expect(result.executed).toContain("report.generator");
    expect(result.outputs["report.generator"]).toBeDefined();
  });

  it("integrates with analyzer plugins in a multi-phase run", async () => {
    const engine = new SeoEngine();
    engine.use(createTitlePlugin());
    engine.use(createReportPlugin());

    const analyzerOutput = await engine.run({
      capability: "analyzer",
      payload: {
        title: "Test Property Title for SEO",
      } as PageSignals,
    });

    expect(analyzerOutput.ok).toBe(true);
    const titleCheck = Object.values(analyzerOutput.outputs)[0];
    if (titleCheck && titleCheck.kind === "issues") {
      const reportPayload: ReportPluginPayload = {
        propertyId: "integration-test",
        checks: [titleCheck.value as SeoCheckResult],
      };

      const reportRun = await engine.run({
        capability: "report",
        payload: reportPayload,
      });

      expect(reportRun.ok).toBe(true);
      const reportOutput = reportRun.outputs["report.generator"];
      if (reportOutput && reportOutput.kind === "artifact") {
        const report = reportOutput.value;
        expect(report.metadata.propertyId).toBe("integration-test");
        expect(report.totalChecks).toBe(1);
      }
    }
  });
});