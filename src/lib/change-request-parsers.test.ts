import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseApplyBody,
  parseDraftBody,
  parseJson,
  parseListQuery,
  parseMessageBody,
  parseResolveTicketsBody,
  parseStatusBody,
} from "./change-request-parsers.ts";

const okValue = <T>(r: { ok: boolean; value?: T; message?: string }) => {
  assert.equal(r.ok, true, r.message);

  return r.value;
};
const message = (r: { ok: boolean; message?: string }) => {
  assert.equal(r.ok, false);

  return r.message;
};

describe("parseJson", () => {
  it("reads JSON, treats an empty body as {} and refuses garbage", () => {
    assert.deepEqual(okValue(parseJson('{"a":1}')), { a: 1 });
    assert.deepEqual(okValue(parseJson("  ")), {});
    assert.match(message(parseJson("{nope")) ?? "", /not valid JSON/);
  });
});

describe("parseMessageBody", () => {
  it("keeps only body, trimmed, with line breaks and no control characters", () => {
    assert.deepEqual(okValue(parseMessageBody({ body: "  Hi\r\nthere\u0007 " })), {
      body: "Hi\nthere",
    });
  });

  it("refuses empty, long, non-text and extra fields", () => {
    assert.match(message(parseMessageBody({ body: "   " })) ?? "", /Write a message/);
    assert.match(message(parseMessageBody({ body: 4 })) ?? "", /Write a message/);
    assert.match(
      message(parseMessageBody({ body: "x".repeat(2001) })) ?? "",
      /2000/,
    );
    assert.match(
      message(parseMessageBody({ body: "ok", authorKind: "CLINIC" })) ?? "",
      /authorKind/,
    );
    assert.ok(message(parseMessageBody(null)));
    assert.ok(message(parseMessageBody([])));
  });
});

describe("parseStatusBody", () => {
  it("accepts a plain move and drops an empty note", () => {
    assert.deepEqual(okValue(parseStatusBody({ status: "IN_PROGRESS" })), {
      status: "IN_PROGRESS",
    });
    assert.deepEqual(
      okValue(parseStatusBody({ status: "OPEN", resolutionNote: "  " })),
      { status: "OPEN" },
    );
  });

  it("requires a note to resolve or reject", () => {
    for (const status of ["RESOLVED", "REJECTED"]) {
      assert.match(message(parseStatusBody({ status })) ?? "", /note is required/);
      assert.match(
        message(parseStatusBody({ status, resolutionNote: "  " })) ?? "",
        /note is required/,
      );
      assert.deepEqual(
        okValue(parseStatusBody({ status, resolutionNote: " Done. " })),
        { status, resolutionNote: "Done." },
      );
    }
  });

  it("refuses unknown statuses, extra fields and long notes", () => {
    assert.ok(message(parseStatusBody({ status: "DONE" })));
    assert.ok(message(parseStatusBody({})));
    assert.match(
      message(parseStatusBody({ status: "OPEN", resolvedByEmail: "a@b.c" })) ?? "",
      /resolvedByEmail/,
    );
    assert.match(
      message(
        parseStatusBody({ status: "RESOLVED", resolutionNote: "x".repeat(2001) }),
      ) ?? "",
      /2000/,
    );
    assert.ok(message(parseStatusBody({ status: "RESOLVED", resolutionNote: 3 })));
  });
});

describe("parseApplyBody", () => {
  it("note is optional", () => {
    assert.deepEqual(okValue(parseApplyBody({})), {});
    assert.deepEqual(okValue(parseApplyBody({ note: " " })), {});
    assert.deepEqual(okValue(parseApplyBody({ note: " ok " })), { note: "ok" });
  });

  it("refuses extra fields and non-text notes", () => {
    assert.ok(message(parseApplyBody({ note: 1 })));
    assert.ok(message(parseApplyBody({ clinicId: "x" })));
  });

  it("forwards a category id only when it is given and well-formed", () => {
    assert.deepEqual(okValue(parseApplyBody({ categoryId: " FAC ", note: "ok" })), {
      note: "ok",
      categoryId: "FAC",
    });
    assert.deepEqual(okValue(parseApplyBody({ categoryId: null })), {});
    for (const bad of ["", "a/b", "x".repeat(33), 5, "../x"])
      assert.ok(message(parseApplyBody({ categoryId: bad })), String(bad));
  });
});

describe("parseResolveTicketsBody", () => {
  it("requires a note and nothing else", () => {
    assert.deepEqual(okValue(parseResolveTicketsBody({ note: " Live. " })), {
      note: "Live.",
    });
    assert.ok(message(parseResolveTicketsBody({})));
    assert.ok(message(parseResolveTicketsBody({ note: "  " })));
    assert.ok(message(parseResolveTicketsBody({ note: "a", extra: 1 })));
  });
});

describe("parseDraftBody", () => {
  it("takes an empty object only", () => {
    assert.deepEqual(okValue(parseDraftBody({})), {});
    assert.ok(message(parseDraftBody({ programId: "p" })));
  });
});

describe("parseListQuery", () => {
  const parse = (qs: string) => parseListQuery(new URLSearchParams(qs));

  it("forwards the known filters and drops the rest", () => {
    const value = okValue(
      parse(
        "status=OPEN&type=BONO&clinicId=c_1&q=%20glow%20&limit=10&cursor=abc_-%3D&evil=1",
      ),
    );

    assert.equal(
      value?.toString(),
      "status=OPEN&type=BONO&clinicId=c_1&q=glow&limit=10&cursor=abc_-%3D",
    );
  });

  it("empty values mean no filter", () => {
    assert.equal(okValue(parse("status=&q=&type="))?.toString(), "");
  });

  it("refuses invalid values instead of silently listing everything", () => {
    for (const qs of [
      "status=DONE",
      "type=REFUND",
      "clinicId=../x",
      "limit=0",
      "limit=51",
      "limit=1.5",
      "limit=abc",
      "cursor=a/b",
      `q=${"x".repeat(121)}`,
    ]) {
      assert.ok(message(parse(qs)), qs);
    }
  });
});
