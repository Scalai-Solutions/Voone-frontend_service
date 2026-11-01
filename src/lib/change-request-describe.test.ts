import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  appliedLine,
  describeRequest,
  emailStatusLine,
  formatEuroAmount,
  formatTimestamp,
  type DescribeLookup,
} from "./change-request-describe.ts";
import { listSearch } from "./admin-change-requests.ts";

const lookup: DescribeLookup = {
  treatments: new Map([
    ["t1", { name: "Bio-Pen", priceEuro: 45, categoryId: "FAC" }],
    ["t2", { name: "Peel", priceEuro: null, categoryId: null }],
  ]),
  bonos: new Map([["b1", { name: "Facial pack", totalEuro: 199.5, totalSessions: 5 }]]),
  categories: new Map([
    ["FAC", "Faciales"],
    ["MAS", "Masajes"],
  ]),
};

describe("formatEuroAmount", () => {
  it("drops the decimals of whole amounts", () => {
    assert.equal(formatEuroAmount(45), "45 €");
    assert.equal(formatEuroAmount(45.5), "45.50 €");
    assert.equal(formatEuroAmount(0.01), "0.01 €");
  });
});

describe("describeRequest", () => {
  it("a price change shows the old and the new price", () => {
    const d = describeRequest("SERVICE_EDIT", { treatmentId: "t1" }, { priceEuro: 50 }, lookup);

    assert.deepEqual(d.lines, ['Change price of "Bio-Pen": 45 € → 50 €']);
    assert.deepEqual(d.missing, []);
  });

  it("a combined edit gives one line per change, with category labels", () => {
    const d = describeRequest(
      "SERVICE_EDIT",
      { treatmentId: "t1" },
      { priceEuro: 50.5, name: "Bio-Pen Plus", categoryId: "MAS" },
      lookup,
    );

    assert.deepEqual(d.lines, [
      'Change price of "Bio-Pen": 45 € → 50.50 €',
      'Rename "Bio-Pen" to "Bio-Pen Plus"',
      'Move "Bio-Pen" from category Faciales to Masajes',
    ]);
  });

  it("a treatment with no stored price or category has no old value to show", () => {
    const d = describeRequest(
      "SERVICE_EDIT",
      { treatmentId: "t2" },
      { priceEuro: 30, categoryId: "MAS" },
      lookup,
    );

    assert.deepEqual(d.lines, [
      'Change price of "Peel" to 30 €',
      'Move "Peel" to category Masajes',
    ]);
  });

  it("a treatment that is gone is reported as missing", () => {
    const d = describeRequest("SERVICE_EDIT", { treatmentId: "zz" }, { priceEuro: 50 }, lookup);

    assert.deepEqual(d.missing, ["zz"]);
    assert.match(d.lines[0], /treatment zz/);

    const removal = describeRequest("SERVICE_REMOVE", { treatmentId: "zz" }, undefined, lookup);

    assert.deepEqual(removal.missing, ["zz"]);
  });

  it("without a lookup nothing is called missing", () => {
    const d = describeRequest("SERVICE_EDIT", { treatmentId: "zz" }, { priceEuro: 50 });

    assert.deepEqual(d.missing, []);
  });

  it("adding and removing a treatment", () => {
    assert.deepEqual(
      describeRequest("SERVICE_ADD", undefined, { name: "Hydra", priceEuro: 80, categoryId: "FAC" }, lookup).lines,
      ['Add treatment "Hydra" at 80 €', "Category: Faciales"],
    );
    assert.deepEqual(
      describeRequest("SERVICE_REMOVE", { treatmentId: "t1" }, undefined, lookup).lines,
      ['Remove treatment "Bio-Pen" (currently 45 €)'],
    );
  });

  it("bono add, edit (compares the pack total) and remove", () => {
    assert.deepEqual(
      describeRequest("BONO", undefined, { action: "add", name: "Body pack", priceEuro: 300, totalSessions: 6 }, lookup).lines,
      ['Add voucher "Body pack": 300 € for 6 sessions'],
    );
    assert.deepEqual(
      describeRequest("BONO", { bonoId: "b1" }, { action: "edit", priceEuro: 210, totalSessions: 6 }, lookup).lines,
      [
        'Change pack price of "Facial pack": 199.50 € → 210 €',
        'Change sessions of "Facial pack": 5 → 6',
      ],
    );
    assert.deepEqual(
      describeRequest("BONO", { bonoId: "b1" }, { action: "remove" }, lookup).lines,
      ['Remove voucher "Facial pack"'],
    );
  });

  it("a bono ticket with no proposed values points to the reason", () => {
    const d = describeRequest("BONO", { bonoId: "b1" }, undefined, lookup);

    assert.match(d.lines[0], /see the owner's reason/);
  });

  it("rewards, levels and other", () => {
    assert.deepEqual(
      describeRequest("REWARD", { milestone: 3 }, { text: "Free facial" }).lines,
      ["Reward at milestone 3", 'Proposed reward: "Free facial"'],
    );
    assert.deepEqual(
      describeRequest("LEVEL", { tier: "oro" }, { text: "10% off" }).lines,
      ["Level: oro", 'Proposed benefit: "10% off"'],
    );
    assert.match(describeRequest("REWARD", undefined, undefined).lines[0], /see the owner's reason/);
    assert.equal(describeRequest("OTHER", undefined, undefined).headline, "General request");
  });

  it("tolerates junk shapes", () => {
    const d = describeRequest("SERVICE_EDIT", "x", [1, 2], lookup);

    assert.ok(d.lines.length > 0);
  });
});

describe("timestamps and email status", () => {
  it("formats in a given time zone", () => {
    assert.equal(formatTimestamp("2026-03-12T10:04:00Z", "UTC"), "12 Mar 2026, 10:04");
    assert.equal(formatTimestamp("nope"), "");
  });

  it("an error wins over a sent time; neither means none recorded", () => {
    assert.equal(
      emailStatusLine({ emailSentAt: "2026-03-12T10:04:00Z", lastEmailError: null }, "UTC"),
      "Last email sent 12 Mar 2026, 10:04",
    );
    assert.equal(
      emailStatusLine({ emailSentAt: "2026-03-12T10:04:00Z", lastEmailError: "SENDGRID_HTTP_401" }),
      "Email not sent: SENDGRID_HTTP_401",
    );
    assert.equal(
      emailStatusLine({ emailSentAt: null, lastEmailError: null }),
      "No email recorded for this request.",
    );
  });
});

describe("listSearch", () => {
  it("leaves out empty filters and trims q", () => {
    assert.equal(listSearch({}), "");
    assert.equal(listSearch({ status: "", type: "", q: "  " }), "");
    assert.equal(
      listSearch({ status: "OPEN", type: "BONO", q: " glow ", limit: 20, cursor: "abc" }),
      "?status=OPEN&type=BONO&q=glow&limit=20&cursor=abc",
    );
  });
});

describe("appliedLine", () => {
  it("says when and by whom, and tolerates an older backend", () => {
    assert.equal(
      appliedLine({ appliedAt: "2026-03-12T10:04:00Z", appliedByEmail: "a@b.c" }, "UTC"),
      "Applied on 12 Mar 2026, 10:04 by a@b.c",
    );
    assert.equal(
      appliedLine({ appliedAt: "2026-03-12T10:04:00Z", appliedByEmail: null }, "UTC"),
      "Applied on 12 Mar 2026, 10:04",
    );
    assert.equal(appliedLine({ appliedAt: null, appliedByEmail: null }), null);
    assert.equal(appliedLine({}), null);
  });
});
