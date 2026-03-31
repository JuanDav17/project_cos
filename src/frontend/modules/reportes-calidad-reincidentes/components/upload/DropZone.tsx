'use client';

import React, { useRef, useState } from 'react';
import styles from './DropZone.module.css';

interface DropZoneProps {
  onFileSelected: (file: File) => void;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelected }) => {
  const [isOver, setIsOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      className={`${styles.dropZone} ${isOver ? styles.over : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className={styles.hiddenInput}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFileSelected(file);
        }}
      />
      <div className={styles.icon}><i className="bi bi-cloud-arrow-up" aria-hidden="true" /></div>
      <h3 className={styles.title}>Arrastra tu archivo aqui</h3>
      <p className={styles.hint}>o haz clic para seleccionar - XLSX - XLS - CSV</p>
    </div>
  );
};
