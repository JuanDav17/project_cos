'use client';

import Image from 'next/image';
import logoCos from '@/frontend/img/logo_cos - copia.png';
import styles from '@/frontend/shared/progress/ProgressScreen.module.css';

interface ProgressScreenProps {
  progress: number;
  message: string;
}

export function ProgressScreen({ progress, message }: ProgressScreenProps) {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div id="progress-screen" className={`${styles.screen} ${styles.qualityTone}`}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandCopy}>
            <span className={styles.eyebrow}>GroupCOS</span>
            <strong className={styles.brandName}>Reporte de Calidad</strong>
          </div>
          <span className={styles.percent}>{safeProgress}%</span>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <div className={styles.ring}>
            <div className={styles.ringCore}>
              <Image src={logoCos} alt="" className={styles.ringLogo} priority />
            </div>
          </div>
          <div className={styles.signal}>
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className={styles.copy}>
          <h2 className={styles.title}>Cargando reporte</h2>
        </div>

        <div className={styles.progress}>
          <div className={styles.progressMeta}>
            <span>Progreso de preparacion</span>
            <span>{safeProgress}% completado</span>
          </div>
          <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={safeProgress} aria-label="Cargando reporte de calidad">
            <div className={styles.barFill} style={{ width: `${safeProgress}%` }} />
          </div>
          <div className={styles.message}>{message}</div>
        </div>
      </div>
    </div>
  );
}
