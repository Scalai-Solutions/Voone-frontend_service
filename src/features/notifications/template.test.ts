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

  it("previews the real review link once the centre has set it", () => {
    const values = sampleValues("Sol", {
      googleReviewUrl: "https://g.page/r/abc",
      referralRewardText: "15 € de descuento",
    });

    assert.equal(renderPreview("{google_maps_link}", values), "https://g.page/r/abc");
  });

  it("never previews a typed-in reward: the programme picks it per client", () => {
    const values = sampleValues("Sol", {
      googleReviewUrl: null,
      referralRewardText: "15 € de descuento",
    });

    assert.equal(
      renderPreview("{referral_reward} · {birthday_gift}", values),
      "Limpieza facial · Mascarilla hidratante",
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
