import React, { useState } from 'react';
import { BarcodeIcon } from '../common/MedicalIcons';

/**
 * Generates deterministic barcode stripe widths from any alphanumeric input string (Code-128 aesthetic).
 */
function generateBarcodeStripes(text) {
  const clean = text || 'PAT-AUTO';
  const stripes = [];
  let seed = 0;
  for (let i = 0; i < clean.length; i++) {
    seed += clean.charCodeAt(i);
  }

  // Generate 36 vertical bars
  for (let i = 0; i < 38; i++) {
    const isBar = (i % 2 === 0);
    const weight = ((seed * (i + 7) + 13) % 3) + 1; // 1, 2, or 3px
    stripes.push({ isBar, weight });
  }
  return stripes;
}

export default function BarcodeDisplay({ value, isAuto = false }) {
  const [copied, setCopied] = useState(false);
  const displayVal = value || 'PAT-AUTO';
  const stripes = generateBarcodeStripes(displayVal);

  const handleCopy = () => {
    if (value && value !== 'PAT-AUTO') {
      navigator.clipboard?.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="hospital-barcode-card" onClick={handleCopy} title="Click to copy Patient ID">
      <div className="barcode-top-label">
        <span className="barcode-indicator-dot" />
        <span className="barcode-title-text">
          {isAuto ? 'Auto-Assigned Barcode' : 'Patient ID & Barcode'}
        </span>
        {copied && <span className="barcode-copied-badge">Copied!</span>}
      </div>

      {/* SVG Barcode Graphic */}
      <div className="barcode-svg-container">
        <svg
          className="barcode-svg-graphic"
          viewBox="0 0 160 36"
          preserveAspectRatio="none"
          aria-label={`Barcode for ${displayVal}`}
        >
          {stripes.map((s, idx) => {
            if (!s.isBar) return null;
            const x = (idx * 4.2);
            return (
              <rect
                key={idx}
                x={x}
                y="2"
                width={s.weight * 1.3}
                height="32"
                fill="#1e293b"
                rx="0.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Monospace Code Display */}
      <div className="barcode-alphanumeric-text">
        <BarcodeIcon className="barcode-mini-icon" />
        <span className="barcode-code-string">{displayVal}</span>
      </div>
    </div>
  );
}
