import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canApplyType,
  hasTicketFlag,
  canDraftType,
  countLabel,
  isUnresolved,
  unresolvedLinkedTo,
  CHANGE_REQUEST_TYPES,
  STATUS_LABEL,
  actionNeedsNote,
  actionTarget,
  statusActions,
  unresolvedCount,
  knownErrorMessage,
  statusesFor,
  mergeNewestFirst,
  chipCount,
  TYPE_LABEL,
} from "./admin-change-requests.ts";

describe("change request helpers", () => {
  it("only SERVICE_* and BONO can be applied; only REWARD and LEVEL get a draft", () => {
    const applicable = CHANGE_REQUEST_TYPES.filter(canApplyType);
    const draftable = CHANGE_REQUEST_TYPES.filter(canDraftType);

    assert.deepEqual(applicable, [
      "SERVICE_EDIT",
      "SERVICE_ADD",
      "SERVICE_REMOVE",
      "BONO",
    ]);
    assert.deepEqual(draftable, ["REWARD", "LEVEL"]);
    assert.equal(canApplyType("OTHER"), false);
    assert.equal(canDraftType("OTHER"), false);
  });

  it("only REWARD and SERVICE_EDIT tickets get the 5-year flag", () => {
    assert.deepEqual(CHANGE_REQUEST_TYPES.filter(hasTicketFlag), ["REWARD", "SERVICE_EDIT"]);
  });

  it("unresolved means open or in progress", () => {
    assert.equal(isUnresolved("OPEN"), true);
    assert.equal(isUnresolved("IN_PROGRESS"), true);
    assert.equal(isUnresolved("RESOLVED"), false);
    assert.equal(isUnresolved("REJECTED"), false);
  });

  it("unresolvedLinkedTo keeps this programme's open and in-progress tickets", () => {
    const tickets = [
      { id: "1", programId: "p1", status: "IN_PROGRESS" as const },
      { id: "2", programId: "p1", status: "OPEN" as const },
      { id: "3", programId: "p1", status: "RESOLVED" as const },
      { id: "4", programId: "p2", status: "IN_PROGRESS" as const },
      { id: "5", programId: null, status: "OPEN" as const },
    ];

    assert.deepEqual(
      unresolvedLinkedTo(tickets, "p1").map((t) => t.id),
      ["1", "2"],
    );
    assert.deepEqual(unresolvedLinkedTo(tickets, "none"), []);
  });

  it("a count with a next page is a lower bound", () => {
    assert.equal(countLabel({ items: [1, 2, 3], nextCursor: null }), "3");
    assert.equal(countLabel({ items: [1, 2, 3], nextCursor: "c" }), "3+");
    assert.equal(countLabel({ items: [], nextCursor: null }), "0");
  });

  it("every status and type has English copy", () => {
    assert.equal(STATUS_LABEL.IN_PROGRESS, "In progress");
    for (const type of CHANGE_REQUEST_TYPES) assert.ok(TYPE_LABEL[type], type);
  });

  it("status actions follow the backend's transition table", () => {
    assert.deepEqual(statusActions("OPEN"), ["start", "resolve", "reject"]);
    assert.deepEqual(statusActions("IN_PROGRESS"), ["resolve", "reject", "back_to_open"]);
    assert.deepEqual(statusActions("RESOLVED"), ["reopen"]);
    assert.deepEqual(statusActions("REJECTED"), ["reopen"]);
    assert.equal(actionTarget.start, "IN_PROGRESS");
    assert.equal(actionTarget.reopen, "OPEN");
    assert.equal(actionTarget.resolve, "RESOLVED");
    assert.equal(actionTarget.reject, "REJECTED");
  });

  it("only resolve and reject need a note", () => {
    assert.equal(actionNeedsNote("resolve"), true);
    assert.equal(actionNeedsNote("reject"), true);
    for (const a of ["start", "back_to_open", "reopen"] as const)
      assert.equal(actionNeedsNote(a), false, a);
  });

  it("unresolvedCount adds the pages and flags a lower bound", () => {
    assert.deepEqual(
      unresolvedCount([
        { items: [1, 2], nextCursor: null },
        { items: [3], nextCursor: null },
      ]),
      { count: 3, more: false },
    );
    assert.deepEqual(
      unresolvedCount([
        { items: [1, 2], nextCursor: "c" },
        { items: [], nextCursor: null },
      ]),
      { count: 2, more: true },
    );
    assert.deepEqual(unresolvedCount([]), { count: 0, more: false });
  });

  it("statusesFor maps the inbox filter to backend statuses", () => {
    assert.deepEqual(statusesFor("ACTIVE"), ["OPEN", "IN_PROGRESS"]);
    assert.deepEqual(statusesFor("RESOLVED"), ["RESOLVED"]);
    assert.deepEqual(statusesFor(""), []);
  });

  it("mergeNewestFirst sorts by date, breaks ties by id and drops repeats", () => {
    const a = { id: "a", createdAt: "2026-03-01T00:00:00Z" };
    const b = { id: "b", createdAt: "2026-03-03T00:00:00Z" };
    const c = { id: "c", createdAt: "2026-03-03T00:00:00Z" };

    assert.deepEqual(
      mergeNewestFirst([[a, b], [c, a]]).map((r) => r.id),
      ["c", "b", "a"],
    );
    assert.deepEqual(mergeNewestFirst([]), []);
  });

  it("chipCount sums the statuses a chip stands for and is blank until they are loaded", () => {
    const open = { items: [1, 2], nextCursor: null };
    const prog = { items: [1], nextCursor: "c" };

    assert.equal(chipCount("OPEN", { OPEN: open }), "2");
    assert.equal(chipCount("ACTIVE", { OPEN: open, IN_PROGRESS: prog }), "3+");
    assert.equal(chipCount("ACTIVE", { OPEN: open }), null);
    assert.equal(
      chipCount("", {
        OPEN: open,
        IN_PROGRESS: prog,
        RESOLVED: { items: [], nextCursor: null },
        REJECTED: { items: [], nextCursor: null },
      }),
      "3+",
    );
  });

  it("knownErrorMessage names the two admin-specific backend errors", () => {
    assert.equal(
      knownErrorMessage("STAFF_KEY_NOT_CONFIGURED"),
      "Backend is not configured for admin access.",
    );
    assert.equal(
      knownErrorMessage("CHANGE_REQUEST_ALREADY_APPLIED"),
      "This ticket was already applied.",
    );
    assert.equal(knownErrorMessage("CHANGE_REQUEST_CONFLICT"), null);
    assert.equal(knownErrorMessage(undefined), null);
  });
});
