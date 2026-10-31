import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  missingClinicValue,
  renderPreview,
  sampleValues,
  unknownVariables,
} from "./template.ts";

const clinic = { googleReviewUrl: null, referralRewardText: null };

describe("notification templates", () => {
  it("fills the preview with sample values and the centre's real name", () => {
    const values = sampleValues("Clínica Sol", clinic);

    assert.equal(
      renderPreview(
        "Hola {first_name}, gracias por venir a {clinic_name}",
        values,
      ),
      "Hola Lucía, gracias por venir a Clínica Sol",
    );
  });

  it("previews the real review link and reward once the centre has set them", () => {
    const values = sampleValues("Sol", {
      googleReviewUrl: "https://g.page/r/abc",
      referralRewardText: "15 € de descuento",
    });

    assert.equal(
      renderPreview("{google_maps_link} {referral_reward}", values),
      "https://g.page/r/abc 15 € de descuento",
    );
  });

  it("flags variables the event does not offer", () => {
    assert.deepEqual(
      unknownVariables("{first_name} {nope} {nope}", ["first_name"]),
      ["nope"],
    );
  });

  it("knows when an event is waiting for a centre value", () => {
    const review = { requires: "googleReviewUrl" } as never;

    assert.equal(missingClinicValue(review, clinic), true);
    assert.equal(
      missingClinicValue(review, {
        ...clinic,
        googleReviewUrl: "https://g.page/r/abc",
      }),
      false,
    );
    assert.equal(missingClinicValue({} as never, clinic), false);
  });
});
