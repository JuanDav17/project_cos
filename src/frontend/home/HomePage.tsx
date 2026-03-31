import Image from "next/image";
import Link from "next/link";
import { ClipboardCheck, GitCompareArrows, RefreshCw, ArrowRightCircle } from "lucide-react";
import logoCos from "@/frontend/img/logo_cos.png";
import styles from "./HomePage.module.css";

// ─── Data ────────────────────────────────────────────────────────────────────

const MODULES = [
  {
    href: "/reportes-calidad",
    title: "Reportes de Calidad",
    description:
      "Procesamiento centralizado de SOUL, Célula Antifraude y Speech Analytics para evaluación de calidad.",
    tag: "Módulo principal",
    Icon: ClipboardCheck,
  },
  {
    href: "/reportes-calidad-reincidentes",
    title: "Reincidentes",
    description:
      "Análisis de errores críticos repetidos con filtros avanzados, gráficas y reportes gerenciales.",
    tag: "Análisis profundo",
    Icon: RefreshCw,
  },
  {
    href: "/correlaciones",
    title: "Correlaciones",
    description:
      "Análisis integral cruzando 5 bases de datos: auditorías, antifraude, efectividad, voz cliente y NPS/FCR.",
    tag: "Análisis cruzado",
    Icon: GitCompareArrows,
  },
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export function HomePage() {
  return (
    <main className={styles.shell}>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <nav className={styles.topbar} aria-label="Navegación principal">
        <div className={styles.topbarInner}>
          <div className={styles.brand}>
            <Image src={logoCos} alt="GroupCOS" className={styles.brandLogo} priority />
            <span className={styles.brandSub}>Quality Hub</span>
          </div>
          <span className={styles.brandBadge}>Plataforma interna</span>
        </div>
      </nav>

      <div className={styles.page}>

        {/* ── Modules ──────────────────────────────────────────────────────── */}
        <section className={styles.modules}>
          <div className={styles.modulesHead}>

            {/* ── Title: "Reportes Internos" receives the alive accent animation ── */}
            <h2 className={styles.modulesTitle}>
              Plataforma de{" "}
              <span className={styles.modulesTitleAccent}>
                Reportes Internos
              </span>
            </h2>

            <p className={styles.modulesSub}>
              Selecciona el módulo que necesitas. Cada uno mantiene su flujo
              de trabajo original.
            </p>
          </div>

          <div className={styles.moduleGrid}>
            {MODULES.map(({ href, title, description, tag, Icon }) => (
              <Link key={href} href={href} className={styles.moduleCard}>
                <div className={styles.cardGlow} aria-hidden="true" />
                <div className={styles.cardInner}>

                  <div className={styles.cardMeta}>
                    <span className={styles.cardTag}>{tag}</span>
                    <div className={styles.cardIconWrap} aria-hidden="true">
                      <Icon size={20} strokeWidth={1.8} />
                    </div>
                  </div>

                  <h3 className={styles.cardTitle}>{title}</h3>
                  <p className={styles.cardDesc}>{description}</p>

                  <div className={styles.cardCta}>
                    <span>Ingresar al módulo</span>
                    <ArrowRightCircle size={20} strokeWidth={1.8} aria-hidden="true" />
                  </div>

                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Footer — margin-top: auto lo ancla al fondo ──────────────────── */}
        <footer className={styles.footer}>
          <span className={styles.footerBrand}>GroupCOS Quality Hub</span>
          <span className={styles.footerSep} aria-hidden="true">·</span>
          <span className={styles.footerNote}>Plataforma interna de reportes</span>
        </footer>

      </div>
    </main>
  );
}
