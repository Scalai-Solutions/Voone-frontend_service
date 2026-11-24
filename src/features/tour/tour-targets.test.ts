import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { allTargetIds, chapterSeconds, chapterViews, nextChapterId, stepRoute, visibleSteps, TOUR_CHAPTERS } from "./tour-chapters.ts";

/** The values `nav-${item.icon}` can take in the clinic shell (ClinicShellIcon). */
const SHELL_ICONS = ["overview", "templates", "members", "scan", "engage", "settings"];
const SRC = join(import.meta.dirname, "..", "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return name.endsWith(".tsx") && !name.endsWith(".test.tsx") ? [path] : [];
  });
}

/** Every data-tour id written in src/, literal or `prefix-${expr}` (expanded over the shell icons). */
function anchorsInSource(): Set<string> {
  const anchors = new Set<string>();

  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/data-tour="([^"]+)"/g)) anchors.add(match[1]);
    // Settings sections take their anchor as a prop: <SettingsSection tourId="…">.
    for (const match of text.matchAll(/tourId="([^"]+)"/g)) anchors.add(match[1]);
    for (const match of text.matchAll(/data-tour=\{`([^`$]*)\$\{[^}]+\}([^`]*)`\}/g)) {
      for (const icon of SHELL_ICONS) anchors.add(`${match[1]}${icon}${match[2]}`);
    }
  }

  return anchors;
}

const owner = {
  role: "owner",
  navHrefs: ["/dashboard/templates", "/dashboard/members", "/dashboard", "/dashboard/scan", "/dashboard/engage"],
  canRequest: true,
  canManageTeam: true,
};
/** Pages whose tabs unmount when inactive: every step there must say which tab it needs. */
const TABBED_ROUTES = new Set(["/dashboard/members", "/dashboard/templates", "/dashboard/engage"]);
const staff = { role: "staff", navHrefs: ["/dashboard", "/dashboard/scan"] };

describe("clinic tutorial targets", () => {
  it("points only at data-tour anchors that exist somewhere in src/", () => {
    const anchors = anchorsInSource();
    const missing = allTargetIds().filter((id) => !anchors.has(id));

    assert.deepEqual(missing, [], `tour targets with no data-tour="…" anchor: ${missing.join(", ")}`);
  });

  it("starts every available chapter's first step somewhere real", () => {
    for (const chapter of TOUR_CHAPTERS.filter((item) => item.available)) {
      assert.ok(chapter.steps.length > 0, `${chapter.id} has no steps`);
      if (chapter.optional) assert.ok(chapter.steps[0].route, `${chapter.id} starts without a route`);
    }
  });

  it("names the tab for every step on a tabbed page, so Back lands on the right one", () => {
    for (const chapter of TOUR_CHAPTERS) {
      chapter.steps.forEach((step, index) => {
        const route = stepRoute(chapter.steps, index);
        if (route && TABBED_ROUTES.has(route)) assert.ok(step.tab, `${chapter.id}/${step.id} has no tab`);
      });
    }
  });
});

describe("clinic tutorial chapters", () => {
  it("puts scanning first, as recommended, for front-desk staff", () => {
    const views = chapterViews(staff);

    assert.equal(views[0].chapter.id, "scan");
    assert.equal(views[0].recommended, true);
    assert.ok(views.every((view) => view.chapter.id === "scan" || !view.recommended));
  });

  it("keeps the welcome chapter first for owners and recommends nothing", () => {
    const views = chapterViews(owner);

    assert.equal(views[0].chapter.id, "welcome");
    assert.ok(views.every((view) => !view.recommended));
  });

  it("hides chapters and sweep stops for nav items the person cannot see", () => {
    const views = chapterViews(staff).map((view) => view.chapter.id);
    assert.ok(!views.includes("members") && !views.includes("center") && !views.includes("engage"));

    const welcome = TOUR_CHAPTERS.find((chapter) => chapter.id === "welcome")!;
    const sweep = visibleSteps(welcome, staff).find((step) => step.stops);
    assert.deepEqual(sweep?.stops?.map((stop) => stop.target), ["nav-scan"]);
  });

  it("estimates durations from steps and page changes, rounded up to 5 s", () => {
    assert.equal(chapterSeconds([{ id: "a", copy: "welcome.intro" }]), 10);
    assert.equal(chapterSeconds([{ id: "a", copy: "welcome.intro", route: "/dashboard/scan", seconds: 8 }]), 10);
    assert.equal(chapterSeconds([{ id: "a", copy: "welcome.intro", route: "/dashboard/metrics", seconds: 7 }]), 10);
    assert.equal(chapterSeconds([]), 0);
  });

  it("runs route-less steps on the previous step's page", () => {
    const scan = TOUR_CHAPTERS.find((chapter) => chapter.id === "scan")!;

    assert.equal(stepRoute(scan.steps, 2), "/dashboard/scan");
    assert.equal(stepRoute([{ id: "a", copy: "welcome.intro" }], 0), undefined);
  });

  it("chains only through the essentials; optional chapters lead back to the hub", () => {
    const views = chapterViews(owner);

    assert.equal(nextChapterId(views, "welcome", ["welcome"]), "scan");
    assert.equal(nextChapterId(views, "scan", ["scan"]), "welcome");
    assert.equal(nextChapterId(views, "scan", ["welcome", "scan"]), null);
    assert.equal(nextChapterId(views, "members", ["members"]), null);
  });

  it("lists the four optional chapters for an owner, and drops steps they lack permission for", () => {
    const optional = chapterViews(owner).filter((view) => view.chapter.optional).map((view) => view.chapter.id);
    assert.deepEqual(optional, ["members", "center", "engage", "insights"]);

    const manager = { ...owner, role: "manager", canManageTeam: false };
    const insights = chapterViews(manager).find((view) => view.chapter.id === "insights")!;
    assert.ok(!insights.steps.some((step) => step.id === "team"));

    const editorWithoutRequests = { ...owner, role: "staff", canRequest: false };
    const center = chapterViews(editorWithoutRequests).find((view) => view.chapter.id === "center")!;
    assert.deepEqual(center.steps.map((step) => step.id), ["tabs"]);
  });
});
