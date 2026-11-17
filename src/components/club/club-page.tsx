"use client";

import { useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import type { PublicClinic, PublicClub } from "@/lib/api-client";
import {
  badgeText,
  nextTierOf,
  numberLadder,
  recurringText,
  referralHeading,
  styleOfTier,
  tierPosition,
  welcomeText,
} from "./club-style";

/**
 * A clinic's public club page: what a member gets at each tier, the prizes on the way and what
 * recommending the clinic earns. Everything on it comes from the clinic's live programme, so it
 * says what the card says; the clinic only brings its name, logo and photo.
 */

type SectionId = "niveles" | "premios" | "recomienda";

const cssVars = (vars: Record<string, string>) => vars as CSSProperties;

function Accordion({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: SectionId;
  title: string;
  open: boolean;
  onToggle: (id: SectionId) => void;
  children: ReactNode;
}) {
  return (
    <div className="acc" data-open={open} id={id}>
      <div className="wrap">
        <h2 className="acc-h">
          <button
            type="button"
            className="row"
            aria-expanded={open}
            aria-controls={`${id}-panel`}
            id={`${id}-button`}
            onClick={() => onToggle(id)}
          >
            <span className="t">{title}</span>
            <span className="plus" aria-hidden="true" />
          </button>
        </h2>
      </div>
      <div className="acc-panel" id={`${id}-panel`} role="region" aria-labelledby={`${id}-button`}>
        <div className="acc-inner" inert={!open}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function ClubPage({ clinic, club }: { clinic: PublicClinic; club: PublicClub }) {
  const { programName, logoUrl, heroImageUrl } = clinic.template;
  const [open, setOpen] = useState<SectionId | null>(null);
  const [tierIndex, setTierIndex] = useState(0);
  const [railOn, setRailOn] = useState(0);
  const [railProgress, setRailProgress] = useState(0.08);
  const rail = useRef<HTMLDivElement>(null);
  const nivelesRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<number | null>(null);

  const tiers = club.tiers;
  const tier = tiers[tierIndex] ?? tiers[0];
  const tierStyle = styleOfTier(tier.key);
  const groups = numberLadder(club.ladder);

  const reveal = (id: SectionId, target: HTMLElement | null) => {
    // The sections above fold as this one opens, so a title scrolled out of view is brought back.
    requestAnimationFrame(() => {
      if (target && target.getBoundingClientRect().top < 0) {
        target.scrollIntoView({ behavior: "instant", block: "start" });
      }
    });
    setOpen(id);
  };

  const toggle = (id: SectionId) => {
    if (open === id) return setOpen(null);

    reveal(id, document.getElementById(id));
  };

  const showTier = (index: number, focus = false) => {
    setTierIndex(index);

    if (focus) document.getElementById(`tab-${tiers[index]?.key}`)?.focus();
  };

  const onTabKey = (event: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];

    if (!step) return;

    event.preventDefault();
    showTier((tierIndex + step + tiers.length) % tiers.length, true);
  };

  const firstOffset = (tierKey: string): number => {
    const first = rail.current?.querySelector<HTMLElement>(`[data-tier="${tierKey}"]`);
    const start = rail.current?.firstElementChild as HTMLElement | null;

    return first && start ? first.offsetLeft - start.offsetLeft : 0;
  };

  const onRailScroll = () => {
    const el = rail.current;

    if (!el) return;

    const max = el.scrollWidth - el.clientWidth;

    setRailProgress(max > 0 ? Math.max(0.08, el.scrollLeft / max) : 1);

    const left = el.scrollLeft + 40;
    let on = 0;

    groups.forEach((group, index) => {
      if (firstOffset(group.tierKey) <= left) on = index;
    });
    setRailOn(on);
  };

  const goToTier = (tierKey: string) => {
    const index = tiers.findIndex((candidate) => candidate.key === tierKey);

    if (index < 0) return;

    setTierIndex(index);
    reveal("niveles", nivelesRef.current);
    nivelesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="club">
      <header
        className="hero-bg"
        style={cssVars({ "--hero": heroImageUrl ? `url("${heroImageUrl}")` : "none" })}
      >
        <div className="wrap">
          <div className="lockup">
            {logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={clinic.name} />
                <i />
              </>
            ) : null}
            <span>{programName}</span>
          </div>
        </div>
        <div className="wrap hero">
          <div>
            <h1>
              Cuidarte tiene <em>premio</em>
            </h1>
            <p className="lead">
              Descubre tus ventajas en cada nivel, los premios que te esperan visita a visita y todo
              lo que ganas al recomendarnos.
            </p>
          </div>
        </div>
      </header>

      <div className="menu">
        <div ref={nivelesRef}>
          <Accordion id="niveles" title="Tus ventajas por nivel" open={open === "niveles"} onToggle={toggle}>
            <section>
              <div className="wrap">
                <div className="sec-head">
                  <p className="lead">
                    Subes de nivel con tus visitas. Cada nivel mantiene lo anterior y añade más.
                  </p>
                </div>
                <div className="tabs" role="tablist" aria-label="Niveles" onKeyDown={onTabKey}>
                  {tiers.map((candidate, index) => (
                    <button
                      key={candidate.key}
                      type="button"
                      className="tab"
                      role="tab"
                      id={`tab-${candidate.key}`}
                      aria-selected={index === tierIndex}
                      aria-controls="club-tier-panel"
                      tabIndex={index === tierIndex ? 0 : -1}
                      onClick={() => showTier(index)}
                    >
                      {candidate.label}
                    </button>
                  ))}
                </div>
                <div
                  className="tier"
                  role="tabpanel"
                  id="club-tier-panel"
                  aria-labelledby={`tab-${tier.key}`}
                >
                  <div
                    className="card-stage"
                    onTouchStart={(event) => {
                      swipeStart.current = event.touches[0]?.clientX ?? null;
                    }}
                    onTouchEnd={(event) => {
                      const from = swipeStart.current;

                      swipeStart.current = null;

                      if (from === null) return;

                      const dx = (event.changedTouches[0]?.clientX ?? from) - from;

                      if (Math.abs(dx) > 40) {
                        setTierIndex((current) =>
                          Math.min(tiers.length - 1, Math.max(0, current + (dx < 0 ? 1 : -1))),
                        );
                      }
                    }}
                  >
                    <div
                      className="mcard"
                      key={tier.key}
                      style={cssVars({ "--fin": tierStyle.fin, "--fg": tierStyle.fg })}
                    >
                      <div className="top">
                        <span className="club-name">{programName}</span>
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            className={tierStyle.light ? "logo light" : "logo"}
                            src={logoUrl}
                            alt={clinic.name}
                          />
                        ) : null}
                      </div>
                      <span className="chip" />
                      <div className="mrow">
                        <div>
                          <div className="lvl">Nivel</div>
                          <div className="name">{tier.label}</div>
                        </div>
                        <span className="of">{tierPosition(tierIndex, tiers.length)}</span>
                      </div>
                    </div>
                  </div>
                  <ul className="perks fade" key={`perks-${tier.key}`}>
                    {tier.benefits.map((benefit) => (
                      <li key={benefit.text}>
                        <b>{benefit.text}</b>
                        <span className="badge">{badgeText(benefit.badge)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </Accordion>
        </div>

        {groups.length > 0 ? (
          <Accordion id="premios" title="Tu escalera de premios" open={open === "premios"} onToggle={toggle}>
            <section>
              <div className="wrap">
                <div className="sec-head">
                  <p className="lead">
                    Los premios llegan en este orden con tus visitas. Desliza para verlos todos.
                  </p>
                </div>
                <div className="rail-head">
                  <div className="jumps">
                    {groups.map((group, index) => (
                      <button
                        key={group.tierKey}
                        type="button"
                        className={index === railOn ? "jump on" : "jump"}
                        onClick={() =>
                          rail.current?.scrollTo({ left: firstOffset(group.tierKey), behavior: "smooth" })
                        }
                      >
                        {group.tierLabel}
                      </button>
                    ))}
                  </div>
                  <div className="arrows">
                    <button
                      type="button"
                      className="arrow"
                      aria-label="Anteriores"
                      onClick={() => rail.current?.scrollBy({ left: -304, behavior: "smooth" })}
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      className="arrow"
                      aria-label="Siguientes"
                      onClick={() => rail.current?.scrollBy({ left: 304, behavior: "smooth" })}
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
              <div className="rail" ref={rail} onScroll={onRailScroll}>
                {groups.map((group) => {
                  const next = nextTierOf(tiers, group.tierKey);
                  const style = styleOfTier(group.tierKey);

                  return [
                    ...group.steps.map((step) => (
                      <article
                        className="v"
                        key={step.number}
                        data-tier={group.tierKey}
                        style={cssVars({ "--fin": style.fin })}
                      >
                        <div className="body">
                          <div className="meta">
                            <span>
                              <i />
                              {group.tierLabel}
                            </span>
                            <span>{step.position}</span>
                          </div>
                          <div className="step">{step.number}</div>
                          <h3>{step.title}</h3>
                          {step.detail ? <p>{step.detail}</p> : null}
                        </div>
                        <div className="stub">
                          <span>{step.label}</span>
                          <strong>{step.mark ?? ""}</strong>
                        </div>
                      </article>
                    )),
                    next ? (
                      <button
                        type="button"
                        className="v up"
                        key={`up-${group.tierKey}`}
                        data-tier={group.tierKey}
                        style={cssVars({
                          "--fin": styleOfTier(next.key).fin,
                          "--fg": styleOfTier(next.key).fg,
                        })}
                        onClick={() => goToTier(next.key)}
                      >
                        <div style={{ position: "relative" }}>
                          <small>Subes a</small>
                          <h3>{next.label}</h3>
                        </div>
                        <span className="go">
                          Ver ventajas de {next.label} <span aria-hidden="true">→</span>
                        </span>
                      </button>
                    ) : null,
                  ];
                })}
              </div>
              <div className="wrap">
                <div className="progress">
                  <span style={{ transform: `scaleX(${railProgress})` }} />
                </div>
                {club.recurring.every > 0 && club.recurring.name ? (
                  <p className="note rail-note">{recurringText(club.recurring)}</p>
                ) : null}
              </div>
            </section>
          </Accordion>
        ) : null}

        {club.referrals.length > 0 ? (
          <Accordion id="recomienda" title="Recomienda y gana" open={open === "recomienda"} onToggle={toggle}>
            <section>
              <div className="wrap">
                <div className="sec-head">
                  <p className="lead">
                    Cada persona que se une al club gracias a ti cuenta como una recomendación.
                  </p>
                </div>
                <ol className="flow">
                  <li>
                    <span className="who you">Tú</span>
                    <b>Recomiendas {clinic.name}</b>
                    <p>A quien quieras: familia, amistades, compañeros.</p>
                  </li>
                  <li>
                    <span className="who" style={{ font: "500 16px/1 var(--sans)" }}>
                      +1
                    </span>
                    <b>Se une con ventaja</b>
                    <p>{welcomeText(programName, club.welcome)}</p>
                  </li>
                  <li>
                    <span className="who you">Tú</span>
                    <b>Sumas una recomendación</b>
                    <p>En cuanto hace su primer tratamiento de pago.</p>
                    <span className="tag">+1 recomendación</span>
                  </li>
                </ol>
                <div className="meter-head">
                  <h3>Tus premios por recomendar</h3>
                </div>
                <ol className="meter" style={cssVars({ "--cols": String(club.referrals.length) })}>
                  {club.referrals.map((referral) => (
                    <li key={referral.n}>
                      <span className="dot">{referral.n}</span>
                      <div>
                        <small>{referralHeading(referral.n)}</small>
                        <b>{referral.name}</b>
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="note">
                  Los premios se acumulan: cada escalón de recomendaciones mantiene los anteriores.
                </p>
              </div>
            </section>
          </Accordion>
        ) : null}

        <div className="wrap">
          <a className="join" href={`/alta/${encodeURIComponent(clinic.slug)}`}>
            ¿Todavía no eres miembro? <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <footer>
        <div className="wrap">
          <p>Consulta tu nivel y tus premios en tu tarjeta o en recepción.</p>
          <div className="powered">
            Powered by {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/voone-logo.png" alt="Voone" />
          </div>
        </div>
      </footer>
    </main>
  );
}
