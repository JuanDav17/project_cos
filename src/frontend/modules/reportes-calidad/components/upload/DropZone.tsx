'use client';

import { DragEvent, useRef } from 'react';
import { UploadKey } from '@quality/types/report';
import { classNames } from '@quality/lib/utils';
import styles from './DropZone.module.css';

interface DropZoneProps {
  type: UploadKey;
  title: string;
  description: string;
  required?: boolean;
  optionalLabel?: string;
  fileName?: string;
  onFileSelected: (type: UploadKey, file: File) => void;
  onDragStateChange: (type: UploadKey, active: boolean) => void;
  dragging: boolean;
}

const iconByType: Record<UploadKey, string> = {
  soul: 'bi-table',
  anti: 'bi-shield-exclamation',
  speech: 'bi-soundwave',
};

export function DropZone({
  type,
  title,
  description,
  required = false,
  optionalLabel,
  fileName,
  onFileSelected,
  onDragStateChange,
  dragging,
}: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const done = Boolean(fileName);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDragStateChange(type, false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelected(type, file);
  };

  return (
    <div
      className={classNames(styles.zone, optionalLabel ? styles.optional : '', done && styles.done, dragging && styles.dragging)}
      onDragOver={(event) => {
        event.preventDefault();
        onDragStateChange(type, true);
      }}
      onDragLeave={() => onDragStateChange(type, false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.xlsb"
        className={styles.input}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(type, file);
        }}
      />
      {optionalLabel ? <span className={styles.optionalBadge}>{optionalLabel}</span> : null}
      <span className={styles.iconWrap}>
        <i className={`${styles.icon} bi ${done ? 'bi-check-circle-fill' : iconByType[type]}`} aria-hidden="true" />
      </span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>
        {description}
        <br />
        <strong className={styles.status}>{required ? 'Requerido' : 'Opcional'}</strong>
      </p>
      <div className={styles.fileName}>{fileName ? fileName : ''}</div>
    </div>
  );
}
