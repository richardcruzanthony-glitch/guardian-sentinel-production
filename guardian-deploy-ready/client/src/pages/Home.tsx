import { useState } from 'react';
import { getLoginUrl } from '@/const';
import { HomeROICalculator } from '@/components/HomeROICalculator';
import { CADViewer } from '@/components/CADViewer';

// Simple barcode SVG generator
function generateBarcodesSVG(text: string) {
  const width = 150;
  const height = 50;
  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${width}" height="${height}" fill="white" stroke="#000" stroke-width="1"/>`;
  
  let xPos = 5;
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const pattern = (charCode % 256).toString(2).padStart(8, '0');
    for (let j = 0; j < pattern.length; j++) {
      if (pattern[j] === '1') {
        svg += `<rect x="${xPos}" y="5" width="1.5" height="30" fill="black"/>`;
      }
      xPos += 1.5;
    }
  }
  
  svg += `<text x="${width/2}" y="45" font-size="8" text-anchor="middle" font-family="monospace">${text}</text>`;
  svg += '</svg>';
  return svg;
}

export function Home() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMfgPackages, setShowMfgPackages] = useState(false);
  const [showCompliancePackages, setShowCompliancePackages] = useState(false);
  const [packageTab, setPackageTab] = useState<'mfg' | 'compliance'>('mfg');

  const handleFileUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    
    if (!file) {
      alert('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      // Simulate analysis
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Detailed analysis results with digital twin and costs
      setUploadResult({
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2),
        analysisTime: '2.3s',
        routing: {
          operations: 8,
          estimatedTime: '14.5 hours',
          complexity: 'Medium',
          bottleneck: '5-axis machining (Op 4)'
        },
        machining: {
          machines: ['5-axis VMC', 'CNC Lathe', 'Grinder'],
          tooling: 'Standard + 2 custom tools',
          setupTime: '45 minutes',
          cycleTime: '8.2 hours'
        },
        outsideProcessing: {
          required: true,
          processes: ['Heat treat', 'Plating'],
          vendor: 'Approved vendors available',
          leadTime: '3-5 business days'
        },
        inspection: {
          checkpoints: 5,
          criticalDimensions: 12,
          testingRequired: 'Hardness, Surface finish',
          estimatedTime: '2 hours'
        },
        compliance: {
          standards: ['AS9100', 'ISO 9001'],
          requirements: 'Traceability, Documentation, Inspection records',
          status: 'Compliant'
        },
        shipping: {
          weight: '2.4 lbs',
          packaging: 'Standard',
          leadTime: '1 business day'
        },
        totalLeadTime: '6-8 business days',
        recommendation: 'Route through 5-axis VMC first to minimize setup changes',
        // Digital Twin - Department Costs & Details
        digitalTwin: {
          departments: [
            {
              name: 'Engineering',
              status: 'Complete',
              cost: '$285',
              details: 'Design review, routing analysis, tool selection',
              time: '2.5 hours',
              riskLevel: 'Low'
            },
            {
              name: 'Procurement',
              status: 'In Progress',
              cost: '$450',
              details: 'Material sourcing, vendor quotes, lead time coordination',
              time: '1.2 hours',
              riskLevel: 'Medium',
              items: ['Raw stock: 6061-T6 Aluminum', 'Heat treat vendor: ABC Heat Treat', 'Plating: XYZ Plating Co']
            },
            {
              name: 'Planning',
              status: 'Scheduled',
              cost: '$180',
              details: 'Job scheduling, capacity planning, constraint optimization',
              time: '3.8 hours',
              riskLevel: 'Low',
              schedule: 'Week of March 10, 2026'
            },
            {
              name: 'Manufacturing',
              status: 'Scheduled',
              cost: '$1,240',
              details: '5-axis VMC (4.2h) + CNC Lathe (2.1h) + Grinder (1.9h)',
              time: '8.2 hours',
              riskLevel: 'Medium',
              machines: ['5-axis VMC: 4.2 hours', 'CNC Lathe: 2.1 hours', 'Grinder: 1.9 hours']
            },
            {
              name: 'Quality & Inspection',
              status: 'Planned',
              cost: '$320',
              details: '5 inspection checkpoints, 12 critical dimensions, hardness & surface testing',
              time: '2.0 hours',
              riskLevel: 'Low',
              inspections: ['First article inspection', 'In-process checks', 'Final dimensional check', 'Surface finish verification', 'Hardness testing']
            },
            {
              name: 'Shipping',
              status: 'Pending',
              cost: '$85',
              details: 'Packaging, labeling, carrier coordination',
              time: '0.5 hours',
              riskLevel: 'Low'
            }
          ],
          get totalCost() {
            const costs = this.departments.map(d => {
              const amount = d.cost.replace('$', '').replace(',', '');
              return parseInt(amount) || 0;
            });
            const total = costs.reduce((a, b) => a + b, 0);
            return `$${total.toLocaleString()}`;
          },
          profitMargin: '38%',
          get quotePrice() {
            const costStr = this.totalCost.replace('$', '').replace(',', '');
            const cost = parseInt(costStr) || 0;
            const margin = 0.38;
            const quote = Math.round(cost * (1 + margin));
            return `$${quote.toLocaleString()}`;
          },
          compliancePackages: [
            {
              standard: 'AS9100',
              status: 'Required',
              requirements: ['Traceability documentation', 'Material certs', 'Inspection records', 'Process control logs', 'Supplier audits'],
              cost: '$180',
              time: '1.5 hours'
            },
            {
              standard: 'ISO 9001',
              status: 'Required',
              requirements: ['Quality plan', 'Process documentation', 'Inspection procedures', 'Non-conformance tracking', 'Customer communication'],
              cost: '$120',
              time: '1.0 hour'
            }
          ]
        }
      });
    } catch (error) {
      alert('Error analyzing file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setUploadResult(null);
    const form = document.querySelector('#upload-form') as HTMLFormElement;
    if (form) form.reset();
  };

  return (
    <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '32px 20px 64px' }}>
      <style>{`
        :root {
          --bg: #05060a;
          --bg-alt: #0b0d14;
          --accent: #4fd1c5;
          --accent-soft: rgba(79, 209, 197, 0.12);
          --text: #f7fafc;
          --muted: #a0aec0;
          --border: #2d3748;
          --danger: #f56565;
          --radius-lg: 14px;
          --radius-md: 10px;
          --shadow-soft: 0 18px 45px rgba(0, 0, 0, 0.55);
          --shadow-subtle: 0 10px 30px rgba(0, 0, 0, 0.35);
          --transition-fast: 0.18s ease-out;
        }

        body {
          background: radial-gradient(circle at top, #111827 0, #020308 55%);
          color: var(--text);
        }

        section {
          margin-bottom: 56px;
        }

        h1, h2, h3 {
          font-weight: 650;
          letter-spacing: -0.03em;
        }

        h1 {
          font-size: clamp(2.6rem, 4vw, 3.4rem);
          margin-bottom: 10px;
        }

        h2 {
          font-size: clamp(1.7rem, 2.4vw, 2.1rem);
          margin-bottom: 14px;
        }

        h3 {
          font-size: 1.1rem;
          margin-bottom: 8px;
        }

        p {
          color: var(--muted);
          font-size: 0.98rem;
        }

        /* HERO */
        #hero {
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(0, 2.4fr);
          gap: 32px;
          align-items: center;
          padding: 24px 22px;
          border-radius: 22px;
          background: radial-gradient(circle at top left, #111827 0, #020308 60%);
          box-shadow: var(--shadow-soft);
          border: 1px solid rgba(148, 163, 184, 0.18);
          margin-bottom: 52px;
        }

        #hero-main {
          padding-right: 10px;
        }

        .tagline {
          font-size: 1.05rem;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.18em;
          margin-bottom: 10px;
        }

        .sub {
          font-size: 1.02rem;
          margin-bottom: 18px;
          color: #e2e8f0;
        }

        .hero-body {
          font-size: 0.98rem;
          margin-bottom: 22px;
        }

        .hero-cta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }

        .btn-primary {
          padding: 10px 18px;
          border-radius: 999px;
          background: linear-gradient(135deg, #4fd1c5, #63b3ed);
          color: #0b1120;
          font-weight: 600;
          font-size: 0.95rem;
          box-shadow: 0 12px 30px rgba(79, 209, 197, 0.35);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          cursor: pointer;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast), filter var(--transition-fast);
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 40px rgba(79, 209, 197, 0.45);
          filter: brightness(1.05);
        }

        .btn-secondary {
          padding: 9px 16px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.4);
          color: #e2e8f0;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: background var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
        }

        .btn-secondary:hover {
          background: rgba(15, 23, 42, 1);
          border-color: var(--accent);
          transform: translateY(-1px);
        }

        .hero-footnote {
          font-size: 0.8rem;
          color: #94a3b8;
        }

        #hero-side {
          border-radius: 18px;
          background: radial-gradient(circle at top, #0f172a 0, #020617 70%);
          border: 1px solid rgba(148, 163, 184, 0.25);
          padding: 16px 16px 14px;
          box-shadow: var(--shadow-subtle);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .hero-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 4px;
        }

        .chip {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          padding: 4px 8px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          color: #cbd5f5;
          background: rgba(15, 23, 42, 0.9);
        }

        .chip-accent {
          border-color: rgba(79, 209, 197, 0.7);
          color: #a5f3fc;
          background: rgba(15, 118, 110, 0.18);
        }

        .hero-metric-card {
          border-radius: 14px;
          padding: 10px 12px;
          background: radial-gradient(circle at top left, #0f172a 0, #020617 70%);
          border: 1px solid rgba(148, 163, 184, 0.35);
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 10px;
          align-items: center;
        }

        .metric-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #94a3b8;
          margin-bottom: 4px;
        }

        .metric-value {
          font-size: 1.1rem;
          color: #e2e8f0;
          font-weight: 600;
        }

        .metric-sub {
          font-size: 0.78rem;
          color: #9ca3af;
        }

        .metric-pill {
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.4);
          color: #cbd5f5;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .metric-pill span {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #22c55e;
        }

        /* ARCHITECTURE */
        #architecture {
          padding: 22px 20px;
          border-radius: var(--radius-lg);
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: var(--shadow-subtle);
        }

        .arch-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 10px;
        }

        .arch-block {
          padding: 14px 14px 12px;
          border-radius: var(--radius-md);
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .arch-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 6px;
        }

        .arch-label-seq {
          color: #f97373;
        }

        .arch-label-neural {
          color: var(--accent);
        }

        .arch-list {
          margin-top: 8px;
          list-style: none;
          font-size: 0.86rem;
          color: #9ca3af;
        }

        .arch-list li {
          margin-bottom: 4px;
          display: flex;
          gap: 6px;
        }

        .arch-dot {
          margin-top: 6px;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.7);
          flex-shrink: 0;
        }

        /* DIGITAL TWIN */
        #digital-twin {
          padding: 22px 20px;
          border-radius: var(--radius-lg);
          background: radial-gradient(circle at top left, #020617 0, #020308 70%);
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: var(--shadow-subtle);
        }

        .twin-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.6fr);
          gap: 18px;
          align-items: center;
          margin-top: 10px;
        }

        .twin-meta {
          font-size: 0.9rem;
          color: #9ca3af;
        }

        .twin-meta ul {
          list-style: none;
          margin-top: 8px;
        }

        .twin-meta li {
          margin-bottom: 4px;
        }

        .twin-card {
          border-radius: 16px;
          background: radial-gradient(circle at top, #020617 0, #020308 70%);
          border: 1px solid rgba(148, 163, 184, 0.3);
          padding: 12px 12px 10px;
          font-size: 0.8rem;
          color: #e5e7eb;
          box-shadow: var(--shadow-subtle);
        }

        .twin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .twin-title {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: #94a3b8;
        }

        .twin-pill {
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid rgba(148, 163, 184, 0.4);
          color: #cbd5f5;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .twin-pill span {
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #22c55e;
        }

        .twin-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 8px;
        }

        .twin-cell {
          border-radius: 10px;
          padding: 6px 7px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.35);
        }

        .twin-cell-label {
          font-size: 0.7rem;
          color: #9ca3af;
          margin-bottom: 2px;
        }

        .twin-cell-value {
          font-size: 0.85rem;
          color: #e5e7eb;
        }

        .twin-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 4px;
        }

        /* UPLOAD */
        #upload {
          padding: 22px 20px;
          border-radius: var(--radius-lg);
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: var(--shadow-subtle);
        }

        #upload p {
          margin-bottom: 12px;
        }

        #upload-form {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          margin-bottom: 10px;
        }

        #file-input {
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(148, 163, 184, 0.5);
          background: rgba(15, 23, 42, 0.9);
          color: #e5e7eb;
          font-size: 0.9rem;
          max-width: 260px;
        }

        #upload-form button {
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(79, 209, 197, 0.12);
          border: 1px solid rgba(79, 209, 197, 0.7);
          color: #a5f3fc;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: background var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);
        }

        #upload-form button:hover {
          background: rgba(79, 209, 197, 0.2);
          transform: translateY(-1px);
          border-color: #4fd1c5;
        }

        .upload-results {
          margin-top: 20px;
          padding: 16px;
          border-radius: 12px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(79, 209, 197, 0.4);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.25);
        }

        .result-title {
          font-size: 1.1rem;
          color: #4fd1c5;
          font-weight: 600;
        }

        .result-meta {
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .result-section {
          margin-bottom: 16px;
          padding: 12px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
        }

        .result-section-title {
          font-size: 0.9rem;
          color: #e2e8f0;
          font-weight: 600;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .result-section-title span {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 999px;
          background: #4fd1c5;
        }

        .result-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          font-size: 0.85rem;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        }

        .result-item-label {
          color: #9ca3af;
        }

        .result-item-value {
          color: #e2e8f0;
          font-weight: 500;
        }

        .result-recommendation {
          padding: 12px;
          border-radius: 10px;
          background: rgba(79, 209, 197, 0.08);
          border-left: 3px solid #4fd1c5;
          color: #cbd5f5;
          font-size: 0.9rem;
          margin-top: 12px;
        }

        .result-actions {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(148, 163, 184, 0.25);
        }

        .btn-reset {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.1);
          border: 1px solid rgba(148, 163, 184, 0.4);
          color: #cbd5f5;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background var(--transition-fast), transform var(--transition-fast);
        }

        .btn-reset:hover {
          background: rgba(148, 163, 184, 0.2);
          transform: translateY(-1px);
        }

        .btn-demo {
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(79, 209, 197, 0.12);
          border: 1px solid rgba(79, 209, 197, 0.7);
          color: #a5f3fc;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background var(--transition-fast), transform var(--transition-fast);
        }

        .btn-demo:hover {
          background: rgba(79, 209, 197, 0.2);
          transform: translateY(-1px);
        }

        .digital-twin-section { margin-top: 24px; padding-top: 20px; border-top: 2px solid rgba(79, 209, 197, 0.3); }
        .digital-twin-title { font-size: 1.1rem; color: #4fd1c5; font-weight: 600; margin-bottom: 16px; }
        .departments-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
        .department-card { padding: 14px; border-radius: 10px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.2); }
        .dept-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(148, 163, 184, 0.15); }
        .dept-name { font-weight: 600; color: #e2e8f0; font-size: 0.95rem; }
        .dept-status { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; padding: 3px 8px; border-radius: 999px; background: rgba(79, 209, 197, 0.15); color: #4fd1c5; }
        .dept-status.in-progress { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
        .dept-details { font-size: 0.8rem; color: #9ca3af; margin-bottom: 8px; line-height: 1.4; }
        .dept-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 8px; }
        .dept-metric { padding: 6px; border-radius: 6px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(148, 163, 184, 0.15); text-align: center; }
        .dept-metric-label { font-size: 0.65rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 2px; }
        .dept-metric-value { font-size: 0.85rem; color: #4fd1c5; font-weight: 600; }
        .dept-risk { font-size: 0.75rem; padding: 4px 8px; border-radius: 4px; display: inline-block; background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        .dept-risk.medium { background: rgba(251, 191, 36, 0.15); color: #fbbf24; }
        .dept-items { font-size: 0.75rem; color: #cbd5f5; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(148, 163, 184, 0.15); list-style: none; }
        .dept-items li { margin-bottom: 4px; display: flex; gap: 6px; }
        .cost-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; padding: 14px; border-radius: 10px; background: rgba(79, 209, 197, 0.08); border: 1px solid rgba(79, 209, 197, 0.3); }
        .cost-item { text-align: center; }
        .cost-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 6px; }
        .cost-value { font-size: 1.2rem; color: #4fd1c5; font-weight: 600; }
        .compliance-packages { margin-top: 16px; }
        .compliance-title { font-size: 0.95rem; color: #e2e8f0; font-weight: 600; margin-bottom: 12px; }
        .compliance-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .compliance-card { padding: 12px; border-radius: 10px; background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(148, 163, 184, 0.2); }
        .compliance-header { font-weight: 600; color: #e2e8f0; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
        .compliance-status { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; padding: 3px 8px; border-radius: 999px; background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        .compliance-requirements { font-size: 0.8rem; color: #9ca3af; margin-bottom: 8px; list-style: none; }
        .compliance-requirements li { margin-bottom: 4px; display: flex; gap: 6px; }
        .compliance-cost { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; padding-top: 8px; border-top: 1px solid rgba(148, 163, 184, 0.15); margin-top: 8px; }
        .compliance-cost-label { color: #9ca3af; }
        .compliance-cost-value { color: #4fd1c5; font-weight: 600; }
        .btn-view-packages { padding: 10px 16px; border-radius: 8px; background: rgba(79, 209, 197, 0.12); border: 1px solid rgba(79, 209, 197, 0.7); color: #4fd1c5; font-size: 0.9rem; font-weight: 600; cursor: pointer; margin-top: 12px; width: 100%; }
        .btn-view-packages:hover { background: rgba(79, 209, 197, 0.2); }
        .packages-modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
        .packages-modal-content { background: #ffffff; border-radius: 12px; max-width: 1100px; width: 100%; max-height: 90vh; overflow: auto; }
        .packages-modal-header { padding: 24px; border-bottom: 2px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; background: #f9fafb; }
        .packages-modal-title { margin: 0; font-size: 1.5rem; color: #1f2937; }
        .packages-modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
        .packages-modal-tabs { display: flex; border-bottom: 1px solid #e5e7eb; background: #f9fafb; }
        .packages-modal-tab { flex: 1; padding: 16px; border: none; background: transparent; cursor: pointer; font-size: 1rem; font-weight: 500; color: #6b7280; border-bottom: 3px solid transparent; }
        .packages-modal-tab.active { background: #ffffff; border-bottom-color: #000; color: #000; font-weight: 600; }
        .packages-modal-body { padding: 32px; color: #1f2937; line-height: 1.6; }
        .packages-section { margin-bottom: 32px; }
        .packages-section-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 8px; }
        .packages-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 12px; }
        .packages-item { padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; }
        .packages-item-label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
        .packages-item-value { font-size: 0.95rem; font-weight: 600; color: #1f2937; }
        .packages-list { list-style: none; padding: 0; margin: 12px 0; }
        .packages-list li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; }
        .packages-list li:last-child { border-bottom: none; }

        /* ROI */
        #roi {
          padding: 22px 20px;
          border-radius: var(--radius-lg);
          background: rgba(15, 23, 42, 0.96);
          border: 1px solid rgba(148, 163, 184, 0.25);
          box-shadow: var(--shadow-subtle);
        }

        #roi p {
          margin-bottom: 12px;
        }

        /* FINAL CTA */
        #cta-final {
          text-align: center;
          padding: 26px 20px 10px;
        }

        #cta-final p {
          margin-bottom: 14px;
        }

        #cta-demo {
          padding: 10px 20px;
          border-radius: 999px;
          background: linear-gradient(135deg, #4fd1c5, #63b3ed);
          color: #0b1120;
          font-weight: 600;
          font-size: 0.95rem;
          box-shadow: 0 12px 30px rgba(79, 209, 197, 0.35);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          cursor: pointer;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast), filter var(--transition-fast);
        }

        #cta-demo:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 40px rgba(79, 209, 197, 0.45);
          filter: brightness(1.05);
        }

        /* RESPONSIVE */
        @media (max-width: 880px) {
          #hero {
            grid-template-columns: minmax(0, 1fr);
          }

          #hero-main {
            padding-right: 0;
          }

          .twin-layout {
            grid-template-columns: minmax(0, 1fr);
          }

          .arch-grid {
            grid-template-columns: minmax(0, 1fr);
          }

          .result-grid {
            grid-template-columns: minmax(0, 1fr);
          }
        }

        @media (max-width: 640px) {
          main {
            padding: 20px 14px 40px;
          }

          #hero {
            padding: 18px 16px;
          }

          section {
            margin-bottom: 40px;
          }
        }
      `}</style>

      {/* HERO */}
      <section id="hero">
        <div id="hero-main">
          <div className="tagline">Operations Intelligence Layer</div>
          <h1>Guardian OS</h1>
          <p className="sub">Learns your shop. Recommends. Alerts. Executes — in real time.</p>
          <p className="hero-body">
            Guardian OS sits on top of your existing systems and runs a parallel reasoning graph across quoting, planning,
            machining, inspection, and shipping — so your entire operation behaves like a single, coordinated brain.
          </p>

          <div className="hero-cta-row">
            <button className="btn-primary" onClick={() => window.location.href = getLoginUrl()}>
              Request live demo
            </button>
            <button className="btn-secondary" onClick={() => alert('Demo video coming soon! Contact sales@guardianos.com for a live walkthrough.')}>
              Watch 3‑minute walkthrough
            </button>
          </div>
          <div className="hero-footnote">
            No rip‑and‑replace. Guardian OS learns from your current data, machines, and workflows.
          </div>
        </div>

        <aside id="hero-side">
          <div className="hero-chip-row">
            <button className="chip chip-accent" onClick={() => alert('Neural Operations: Guardian OS runs a parallel reasoning graph across your entire shop.')} style={{ border: 'none', background: 'inherit', cursor: 'pointer', padding: 0 }}>Neural operations</button>
            <button className="chip" onClick={() => alert('Digital Twin: Live model of your machines, work centers, constraints, and quality gates.')} style={{ border: 'none', background: 'inherit', cursor: 'pointer', padding: 0 }}>Digital twin</button>
            <button className="chip" onClick={() => alert('Constraint Engine: Automatically optimizes routing, priorities, and lead times.')} style={{ border: 'none', background: 'inherit', cursor: 'pointer', padding: 0 }}>Constraint engine</button>
          </div>

          <div className="hero-metric-card">
            <div>
              <div className="metric-label">Live coordination</div>
              <div className="metric-value">Every department, every job</div>
              <div className="metric-sub">Guardian OS updates routing, priorities, and constraints as reality changes.</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button className="metric-pill" onClick={() => alert('Live Twin Online: Your digital twin is synchronized in real-time with your shop floor.')} style={{ border: 'none', background: 'inherit', cursor: 'pointer', padding: 0 }}>
                <span></span>
                Live twin online
              </button>
            </div>
          </div>
        </aside>
      </section>

      {/* ARCHITECTURE */}
      <section id="architecture">
        <h2>From sequential decisions to neural operations</h2>
        <p>
          Traditional shops move decisions one department at a time. Guardian OS runs them all in parallel — quoting,
          planning, machining, inspection, and shipping share the same live constraints.
        </p>

        <div className="arch-grid">
          <div className="arch-block">
            <div className="arch-label arch-label-seq">Sequential</div>
            <h3>One step waits for the last</h3>
            <ul className="arch-list">
              <li><span className="arch-dot"></span><span>Quoting guesses at capacity and lead time.</span></li>
              <li><span className="arch-dot"></span><span>Scheduling fights yesterday's priorities.</span></li>
              <li><span className="arch-dot"></span><span>Machining discovers constraints too late.</span></li>
              <li><span className="arch-dot"></span><span>Inspection and shipping scramble at the end.</span></li>
            </ul>
          </div>

          <div className="arch-block">
            <div className="arch-label arch-label-neural">Neural</div>
            <h3>Every department sees the same live truth</h3>
            <ul className="arch-list">
              <li><span className="arch-dot"></span><span>Guardian OS runs a parallel reasoning graph across your entire shop.</span></li>
              <li><span className="arch-dot"></span><span>Routing, priorities, and constraints update in real time.</span></li>
              <li><span className="arch-dot"></span><span>Every job carries its own intelligence through the system.</span></li>
              <li><span className="arch-dot"></span><span>Leaders see the whole operation as a single, live model.</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* DIGITAL TWIN */}
      <section id="digital-twin">
        <h2>Your shop, alive in real time</h2>
        <div className="twin-layout">
          <div className="twin-meta">
            <p>
              Guardian OS maintains a live digital twin of your machines, work centers, constraints, and quality gates.
              Every job, every part, every routing decision is grounded in this live model.
            </p>
            <ul>
              <li>• Machine capabilities, tooling, and setup constraints</li>
              <li>• Work center calendars and outside processing</li>
              <li>• Quality plans, inspection steps, and compliance</li>
              <li>• Lead‑time rules, priorities, and customer promises</li>
            </ul>
          </div>

          <div className="twin-card">
            <div className="twin-header">
              <div className="twin-title">Guardian OS · Digital twin</div>
              <div className="twin-pill">
                <span></span>
                Live sync
              </div>
            </div>

            <div className="twin-grid">
              <div className="twin-cell">
                <div className="twin-cell-label">Machines online</div>
                <div className="twin-cell-value">12 / 12</div>
              </div>
              <div className="twin-cell">
                <div className="twin-cell-label">Jobs in motion</div>
                <div className="twin-cell-value">47</div>
              </div>
              <div className="twin-cell">
                <div className="twin-cell-label">Risk alerts</div>
                <div className="twin-cell-value">3</div>
              </div>
            </div>

            <div className="twin-grid">
              <div className="twin-cell">
                <div className="twin-cell-label">Bottleneck</div>
                <div className="twin-cell-value">5‑axis cell · 82% load</div>
              </div>
              <div className="twin-cell">
                <div className="twin-cell-label">Next decision</div>
                <div className="twin-cell-value">Re‑route OP30</div>
              </div>
              <div className="twin-cell">
                <div className="twin-cell-label">Impact</div>
                <div className="twin-cell-value">‑2.3 days lead time</div>
              </div>
            </div>

            <div className="twin-footer">
              <span>Updated seconds ago</span>
              <span>Every change propagates across quoting, planning, and the floor.</span>
            </div>
          </div>
        </div>
      </section>

      {/* UPLOAD */}
      <section id="upload">
        <h2>See your part flow through Guardian OS</h2>
        <p>
          Upload a drawing or model. Guardian OS analyzes routing, machining logic, outside processing, inspection, and
          compliance — and shows you how your part would move through a live, neural operation.
        </p>

        {!uploadResult ? (
          <form id="upload-form" onSubmit={handleFileUpload} encType="multipart/form-data">
            <input
              type="file"
              id="file-input"
              name="file"
              accept=".pdf,.dxf,.step,.stp,.png,.jpg,.jpeg"
              required
              disabled={isUploading}
            />
            <button type="submit" disabled={isUploading} style={{ cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1 }}>
              {isUploading ? 'Analyzing...' : 'Analyze part'}
            </button>
          </form>
        ) : (
          <div className="upload-results">
            <div className="result-header">
              <div>
                <div className="result-title">✓ Analysis Complete</div>
                <div className="result-meta">{uploadResult.fileName} • {uploadResult.fileSize} KB • {uploadResult.analysisTime}</div>
              </div>
            </div>

            <div className="result-section">
              <div className="result-section-title"><span></span>Routing & Operations</div>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-item-label">Operations</span>
                  <span className="result-item-value">{uploadResult.routing.operations} steps</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Estimated Time</span>
                  <span className="result-item-value">{uploadResult.routing.estimatedTime}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Complexity</span>
                  <span className="result-item-value">{uploadResult.routing.complexity}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Bottleneck</span>
                  <span className="result-item-value">{uploadResult.routing.bottleneck}</span>
                </div>
              </div>
            </div>

            <div className="result-section">
              <div className="result-section-title"><span></span>Machining</div>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-item-label">Machines</span>
                  <span className="result-item-value">{uploadResult.machining.machines.length} required</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Setup Time</span>
                  <span className="result-item-value">{uploadResult.machining.setupTime}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Cycle Time</span>
                  <span className="result-item-value">{uploadResult.machining.cycleTime}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Tooling</span>
                  <span className="result-item-value">{uploadResult.machining.tooling}</span>
                </div>
              </div>
            </div>

            <div className="result-section">
              <div className="result-section-title"><span></span>Outside Processing</div>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-item-label">Required</span>
                  <span className="result-item-value">{uploadResult.outsideProcessing.required ? 'Yes' : 'No'}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Processes</span>
                  <span className="result-item-value">{uploadResult.outsideProcessing.processes.join(', ')}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Vendor</span>
                  <span className="result-item-value">{uploadResult.outsideProcessing.vendor}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Lead Time</span>
                  <span className="result-item-value">{uploadResult.outsideProcessing.leadTime}</span>
                </div>
              </div>
            </div>

            <div className="result-section">
              <div className="result-section-title"><span></span>Inspection & Quality</div>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-item-label">Checkpoints</span>
                  <span className="result-item-value">{uploadResult.inspection.checkpoints}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Critical Dimensions</span>
                  <span className="result-item-value">{uploadResult.inspection.criticalDimensions}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Testing</span>
                  <span className="result-item-value">{uploadResult.inspection.testingRequired}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Inspection Time</span>
                  <span className="result-item-value">{uploadResult.inspection.estimatedTime}</span>
                </div>
              </div>
            </div>

            <div className="result-section">
              <div className="result-section-title"><span></span>Compliance</div>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-item-label">Standards</span>
                  <span className="result-item-value">{uploadResult.compliance.standards.join(', ')}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Status</span>
                  <span className="result-item-value">{uploadResult.compliance.status}</span>
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#9ca3af' }}>
                {uploadResult.compliance.requirements}
              </div>
            </div>

            <div className="result-section">
              <div className="result-section-title"><span></span>Shipping</div>
              <div className="result-grid">
                <div className="result-item">
                  <span className="result-item-label">Weight</span>
                  <span className="result-item-value">{uploadResult.shipping.weight}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Packaging</span>
                  <span className="result-item-value">{uploadResult.shipping.packaging}</span>
                </div>
                <div className="result-item">
                  <span className="result-item-label">Lead Time</span>
                  <span className="result-item-value">{uploadResult.shipping.leadTime}</span>
                </div>
              </div>
            </div>

            <div className="result-section">
              <div className="result-section-title"><span></span>Summary</div>
              <div style={{ fontSize: '0.9rem', color: '#e2e8f0', marginBottom: '8px' }}>
                <strong>Total Lead Time:</strong> {uploadResult.totalLeadTime}
              </div>
              <div className="result-recommendation">
                <strong>Recommendation:</strong> {uploadResult.recommendation}
              </div>
            </div>

            <div className="result-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <button className="btn-reset" onClick={handleReset} style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>← Back</button>
              <button className="btn-demo" onClick={() => setShowMfgPackages(true)} style={{ background: '#06b6d4', border: 'none', color: '#000', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>📊 View Digital Twin</button>
              <button className="btn-reset" onClick={handleReset} style={{ background: '#1f2937', border: '1px solid #374151', color: '#e5e7eb', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }}>Analyze Another Part</button>
              <button className="btn-demo" onClick={() => window.location.href = getLoginUrl()} style={{ background: '#06b6d4', border: 'none', color: '#000', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>Request Demo</button>
            </div>
            {uploadResult.digitalTwin && (<div className="digital-twin-section"><div className="digital-twin-title"><span></span>Digital Twin: Department Flow</div><div className="cost-summary"><div className="cost-item"><div className="cost-label">Total Cost</div><div className="cost-value">{uploadResult.digitalTwin.totalCost}</div></div><div className="cost-item"><div className="cost-label">Quote Price</div><div className="cost-value">{uploadResult.digitalTwin.quotePrice}</div></div><div className="cost-item"><div className="cost-label">Profit Margin</div><div className="cost-value">{uploadResult.digitalTwin.profitMargin}</div></div><div className="cost-item"><div className="cost-label">Lead Time</div><div className="cost-value">{uploadResult.totalLeadTime}</div></div></div><div className="departments-grid">{uploadResult.digitalTwin.departments.map((dept: any, idx: number) => (<div key={idx} className="department-card"><div className="dept-header"><div className="dept-name">{dept.name}</div><div className={`dept-status ${dept.status === 'In Progress' ? 'in-progress' : ''}`}>{dept.status}</div></div><div className="dept-details">{dept.details}</div><div className="dept-metrics"><div className="dept-metric"><div className="dept-metric-label">Cost</div><div className="dept-metric-value">{dept.cost}</div></div><div className="dept-metric"><div className="dept-metric-label">Time</div><div className="dept-metric-value">{dept.time}</div></div><div className="dept-metric"><div className="dept-metric-label">Risk</div><div className={`dept-risk ${dept.riskLevel === 'Medium' ? 'medium' : ''}`}>{dept.riskLevel}</div></div></div>{dept.items && <ul className="dept-items">{dept.items.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul>}{dept.machines && <ul className="dept-items">{dept.machines.map((m: string, i: number) => <li key={i}>{m}</li>)}</ul>}{dept.inspections && <ul className="dept-items">{dept.inspections.map((insp: string, i: number) => <li key={i}>{insp}</li>)}</ul>}</div>))}</div><div className="compliance-packages"><div className="compliance-title"><span></span>Compliance Packages</div><div className="compliance-grid">{uploadResult.digitalTwin.compliancePackages.map((pkg: any, idx: number) => (<div key={idx} className="compliance-card"><div className="compliance-header"><div>{pkg.standard}</div><div className="compliance-status">{pkg.status}</div></div><ul className="compliance-requirements">{pkg.requirements.map((req: string, i: number) => <li key={i}>{req}</li>)}</ul><div className="compliance-cost"><span className="compliance-cost-label">{pkg.cost} • {pkg.time}</span><span className="compliance-cost-value">Included</span></div></div>))}                </div></div></div>)}
                <button className="btn-view-packages" onClick={() => setShowMfgPackages(true)}>Manufacturing Packages Complete - Click to View</button>
          </div>
        )}
      </section>
      <section id="roi">
        <h2>Your numbers. Your reality.</h2>
        <p>
          Rough‑cut what Guardian OS could unlock for your operation. Enter your shop's annual revenue, jobs per month, and hours saved per job.
        </p>
        <HomeROICalculator />
      </section>

      {/* FINAL CTA */}
      <section id="cta-final">
        <p>Ready to see Guardian OS in action?</p>
        <button id="cta-demo" onClick={() => window.location.href = getLoginUrl()}>
          Request live demo
        </button>
      </section>

      {/* MANUFACTURING PACKAGES MODAL */}
      {showMfgPackages && (
        <div className="packages-modal">
          <div className="packages-modal-content">
            <div className="packages-modal-header">
              <div>
                <h2 className="packages-modal-title">Production Packages</h2>
                <p className="packages-modal-subtitle">Part: {uploadResult?.fileName}</p>
              </div>
              <button className="packages-modal-close" onClick={() => setShowMfgPackages(false)}>×</button>
            </div>
            <div className="packages-modal-tabs">
              <button className={`packages-modal-tab ${packageTab === 'mfg' ? 'active' : ''}`} onClick={() => setPackageTab('mfg')}>Manufacturing Package</button>
              <button className={`packages-modal-tab ${packageTab === 'compliance' ? 'active' : ''}`} onClick={() => setPackageTab('compliance')}>Compliance Package</button>
            </div>
            <div className="packages-modal-body">
              {packageTab === 'mfg' && (
                <div>
                  {/* LETTERHEAD */}
                  <div style={{ borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#000' }}>GUARDIAN OS</div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>Neural Operations Intelligence Platform</div>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '8px' }}>2500 Innovation Drive, San Jose, CA 95110 | Phone: (408) 555-0147 | www.guardianOS.com</div>
                  </div>

                  {/* DETAILED QUOTE */}
                  <div className="packages-section">
                    <div className="packages-section-title">MANUFACTURING QUOTE</div>
                    <div className="packages-grid">
                      <div className="packages-item"><div className="packages-item-label">Quote #</div><div className="packages-item-value">Q-2026-0847</div></div>
                      <div className="packages-item"><div className="packages-item-label">Quantity</div><div className="packages-item-value">100 pcs</div></div>
                      <div className="packages-item"><div className="packages-item-label">Date</div><div className="packages-item-value">March 4, 2026</div></div>
                      <div className="packages-item"><div className="packages-item-label">Valid Until</div><div className="packages-item-value">April 4, 2026</div></div>
                      <div className="packages-item"><div className="packages-item-label">Lead Time</div><div className="packages-item-value">{uploadResult?.totalLeadTime}</div></div>
                    </div>
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px' }}>Cost Breakdown:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}><div style={{ fontSize: '0.8rem', color: '#666' }}>Material Cost</div><div style={{ fontSize: '0.95rem', fontWeight: '600' }}>$1,240.00</div></div>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}><div style={{ fontSize: '0.8rem', color: '#666' }}>Labor Cost</div><div style={{ fontSize: '0.95rem', fontWeight: '600' }}>$890.00</div></div>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}><div style={{ fontSize: '0.8rem', color: '#666' }}>Overhead</div><div style={{ fontSize: '0.95rem', fontWeight: '600' }}>$320.00</div></div>
                        <div style={{ padding: '8px', background: '#f9fafb', borderRadius: '4px' }}><div style={{ fontSize: '0.8rem', color: '#666' }}>Tooling</div><div style={{ fontSize: '0.95rem', fontWeight: '600' }}>$110.00</div></div>
                      </div>
                      <div style={{ marginTop: '12px', padding: '12px', background: '#f0f0f0', borderRadius: '4px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        <div><div style={{ fontSize: '0.8rem', color: '#666' }}>Subtotal</div><div style={{ fontSize: '1rem', fontWeight: '700' }}>$2,560.00</div></div>
                        <div><div style={{ fontSize: '0.8rem', color: '#666' }}>Tax (8%)</div><div style={{ fontSize: '1rem', fontWeight: '700' }}>$204.80</div></div>
                        <div><div style={{ fontSize: '0.8rem', color: '#000', fontWeight: '600' }}>TOTAL QUOTE</div><div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#000' }}>${uploadResult?.digitalTwin?.quotePrice}</div></div>
                      </div>
                    </div>
                  </div>

                  {/* MATERIAL REQUIREMENTS */}
                  <div className="packages-section">
                    <div className="packages-section-title">MATERIAL REQUIREMENTS</div>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div className="packages-item"><div className="packages-item-label">Material Spec</div><div className="packages-item-value">Aluminum 6061-T6</div></div>
                        <div className="packages-item"><div className="packages-item-label">Quantity</div><div className="packages-item-value">100 pcs</div></div>
                        <div className="packages-item"><div className="packages-item-label">Stock Size</div><div className="packages-item-value">2.5" x 3.0" x 0.75"</div></div>
                        <div className="packages-item"><div className="packages-item-label">Unit Cost</div><div className="packages-item-value">$12.40</div></div>
                        <div className="packages-item"><div className="packages-item-label">Supplier</div><div className="packages-item-value">Alcoa Metals Inc.</div></div>
                        <div className="packages-item"><div className="packages-item-label">Lead Time</div><div className="packages-item-value">5 business days</div></div>
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '4px', fontSize: '0.9rem' }}>
                      <div><strong>Certification Required:</strong> Mill Certificate (ASTM B221)</div>
                      <div style={{ marginTop: '8px' }}><strong>Total Material Cost:</strong> $1,240.00</div>
                    </div>
                  </div>

                  {/* ENGINEERING REVIEW */}
                  <div className="packages-section">
                    <div className="packages-section-title">ENGINEERING REVIEW</div>
                    <div className="packages-grid">
                      <div className="packages-item"><div className="packages-item-label">Drawing #</div><div className="packages-item-value">DWG-2024-1847</div></div>
                      <div className="packages-item"><div className="packages-item-label">Revision</div><div className="packages-item-value">Rev B</div></div>
                      <div className="packages-item"><div className="packages-item-label">Surface Finish</div><div className="packages-item-value">Anodize Type II</div></div>
                      <div className="packages-item"><div className="packages-item-label">Tolerance Class</div><div className="packages-item-value">ISO 2768-m</div></div>
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Critical Dimensions:</div>
                      <ul className="packages-list">
                        <li>Overall Length: 3.000" ±0.010"</li>
                        <li>Width: 2.500" ±0.010"</li>
                        <li>Thickness: 0.750" ±0.005"</li>
                        <li>Hole Pattern: 4x M6 (±0.2mm)</li>
                        <li>Surface Roughness: Ra 1.6 µm (finish surfaces)</li>
                      </ul>
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Compliance Standards:</div>
                      <ul className="packages-list">
                        <li>AS9100 Rev D (Aerospace Quality)</li>
                        <li>ISO 9001:2015 (Quality Management)</li>
                        <li>ASTM B117 (Salt Spray Test)</li>
                      </ul>
                    </div>
                  </div>

                  {/* 3D CAD MODEL VIEWER */}
                  <div className="packages-section">
                    <div className="packages-section-title">3D PART MODEL - INTERACTIVE VIEWER</div>
                    <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '4px', border: '1px solid #ddd' }}>
                      <CADViewer modelUrl="https://d2xsxph8kpxj0f.cloudfront.net/310519663291553249/iBFHoh35KPA7cxPLw9eMxj/p80-g26-slide_78bb1be8.stl" partName="P80-G26 Slide" />
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px', fontStyle: 'italic' }}>Interactive 3D model - Use mouse to rotate, scroll to zoom. This is the actual part geometry from CAD.</div>
                    </div>
                  </div>

                  {/* MANUFACTURING ROUTING */}
                  <div className="packages-section">
                    <div className="packages-section-title">MANUFACTURING ROUTING - DETAILED OPERATIONS</div>
                    {[1,2,3,4,5,6].map((op) => (
                      <div key={op} style={{ marginBottom: '16px', padding: '12px', border: '2px solid #333', borderRadius: '6px', background: '#fff' }}>
                        {/* Operation Header with Barcode */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                          <div>
                            <div style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '4px' }}>Operation {op}: {['Saw Cut & Deburr', 'CNC Milling - Pocket', 'Drilling - Hole Pattern', 'Anodize Prep', 'Anodize Type II', 'Final Inspection'][op-1]}</div>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>OP-{String(op).padStart(2, '0')}-Q2026-0847</div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG(`OP${op}Q20260847`) }} />
                          </div>
                        </div>

                        {/* Operation Details & Quantity Tracking */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '0.85rem', marginBottom: '12px' }}>
                          <div><strong>Machine:</strong> {['Horizontal Band Saw', 'Haas VF-4', 'Haas VF-4', 'Cleaning Station', 'Anodize Tank', 'CMM'][op-1]}</div>
                          <div><strong>Setup Time:</strong> {[15, 45, 30, 20, 10, 25][op-1]} min</div>
                          <div><strong>Cycle Time:</strong> {[8, 22, 18, 12, 15, 20][op-1]} min/pc</div>
                          <div style={{ background: '#e8f5e9', padding: '6px 8px', borderRadius: '4px', fontWeight: '600', textAlign: 'center' }}><strong>Qty Complete:</strong> {[95, 92, 90, 88, 85, 85][op-1]}/100</div>
                        </div>
                        <div style={{ fontSize: '0.85rem', marginBottom: '12px' }}>
                          <div><strong>Tooling:</strong> {['Carbide Blade', 'End Mill 1/2", Slot Drill', 'Twist Drill #27', 'Alkaline Cleaner', 'DC Power Supply', 'Probe Set'][op-1]}</div>
                          <div style={{ marginTop: '4px' }}><strong>Compliance:</strong> AS9100 Rev D, ISO 9001:2015</div>
                          <div style={{ marginTop: '4px' }}><strong>Quality Check:</strong> {['Dimension check', 'Surface finish', 'Hole position', 'Cleanliness', 'Coating thickness', 'Final dimensions'][op-1]}</div>
                        </div>

                        {/* SETUP SHEET WITH DIMENSIONS & FIXTURES */}
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', background: '#fff', padding: '12px', borderRadius: '4px', marginBottom: '12px', border: '1px solid #ddd' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>SETUP SHEET - DIMENSIONS & FIXTURES</div>
                          
                          {/* PART DRAWING - STAGE PROGRESSION */}
                          <div style={{ marginBottom: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>Orthographic View - Part Stage After Operation {op}</div>
                            <svg width="100%" height="200" viewBox="0 0 400 200" style={{ border: '1px solid #ddd', borderRadius: '4px', background: '#fff' }}>
                              {/* OPERATION 0: RAW STOCK */}
                              {op === 0 && (
                                <>
                                  {/* Top View - Raw Stock */}
                                  <text x="50" y="15" fontSize="11" fontWeight="bold">Top View</text>
                                  <rect x="20" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <text x="50" y="110" fontSize="9" textAnchor="middle">3.0" × 2.5"</text>
                                  
                                  {/* Front View - Raw Stock */}
                                  <text x="150" y="15" fontSize="11" fontWeight="bold">Front View</text>
                                  <rect x="120" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <text x="150" y="110" fontSize="9" textAnchor="middle">3.0" × 1.0"</text>
                                  
                                  {/* Side View - Raw Stock */}
                                  <text x="250" y="15" fontSize="11" fontWeight="bold">Side View</text>
                                  <rect x="220" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <text x="250" y="110" fontSize="9" textAnchor="middle">2.5" × 1.0"</text>
                                  
                                  {/* Legend */}
                                  <rect x="20" y="130" width="15" height="15" fill="#d4a574" stroke="#000" strokeWidth="1" />
                                  <text x="40" y="142" fontSize="9">Material (Aluminum 6061)</text>
                                </>
                              )}
                              
                              {/* OPERATION 1: SAW CUT */}
                              {op === 1 && (
                                <>
                                  {/* Top View - After Cut */}
                                  <text x="50" y="15" fontSize="11" fontWeight="bold">Top View</text>
                                  <rect x="20" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <line x1="50" y1="25" x2="50" y2="75" stroke="#ff6b6b" strokeWidth="2" strokeDasharray="2,2" />
                                  <text x="50" y="75" fontSize="8" textAnchor="middle">①</text>
                                  <text x="50" y="110" fontSize="9" textAnchor="middle">Cut @ 3.0"</text>
                                  
                                  {/* Front View - V-Block Fixture */}
                                  <text x="150" y="15" fontSize="11" fontWeight="bold">Front View (in Fixture)</text>
                                  <polygon points="120,75 140,25 160,25 180,75" fill="#b8860b" stroke="#000" strokeWidth="1" />
                                  <text x="150" y="45" fontSize="8" textAnchor="middle" fontWeight="bold">V-Block</text>
                                  <rect x="120" y="75" width="60" height="3" fill="#d4a574" stroke="#000" strokeWidth="1" />
                                  <text x="150" y="110" fontSize="9" textAnchor="middle">Clamped 500 lbs</text>
                                  
                                  {/* Side View - After Cut */}
                                  <text x="250" y="15" fontSize="11" fontWeight="bold">Side View</text>
                                  <rect x="220" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <line x1="250" y1="25" x2="250" y2="75" stroke="#ff6b6b" strokeWidth="2" strokeDasharray="3,3" />
                                  <text x="250" y="75" fontSize="8" textAnchor="middle">Cut face</text>
                                  <text x="250" y="110" fontSize="9" textAnchor="middle">±0.010" TIR</text>
                                  
                                  {/* Legend */}
                                  <rect x="20" y="130" width="15" height="15" fill="#d4a574" stroke="#000" strokeWidth="1" />
                                  <text x="40" y="142" fontSize="9">Material</text>
                                  <rect x="140" y="130" width="15" height="15" fill="#b8860b" stroke="#000" strokeWidth="1" />
                                  <text x="160" y="142" fontSize="9">Fixture (V-Block)</text>
                                  <line x1="270" y1="137" x2="280" y2="137" stroke="#ff6b6b" strokeWidth="2" strokeDasharray="2,2" />
                                  <text x="290" y="142" fontSize="9">Feature ① (Cut)</text>
                                </>
                              )}
                              
                              {/* OPERATION 2: POCKET MILL */}
                              {op === 2 && (
                                <>
                                  {/* Top View - After Pocket */}
                                  <text x="50" y="15" fontSize="11" fontWeight="bold">Top View</text>
                                  <rect x="20" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <rect x="32" y="38" width="36" height="24" fill="#fff" stroke="#ff6b6b" strokeWidth="2" />
                                  <text x="50" y="75" fontSize="8" textAnchor="middle">②</text>
                                  <text x="50" y="110" fontSize="9" textAnchor="middle">Pocket 0.500"</text>
                                  
                                  {/* Front View - Vise Fixture with Pocket */}
                                  <text x="150" y="15" fontSize="11" fontWeight="bold">Front View (in Vise)</text>
                                  <rect x="120" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <rect x="130" y="38" width="40" height="24" fill="#fff" stroke="#ff6b6b" strokeWidth="2" />
                                  <rect x="115" y="30" width="5" height="40" fill="#b8860b" stroke="#000" strokeWidth="1" />
                                  <rect x="185" y="30" width="5" height="40" fill="#b8860b" stroke="#000" strokeWidth="1" />
                                  <text x="150" y="110" fontSize="9" textAnchor="middle">Precision Vise</text>
                                  
                                  {/* Side View - Pocket Depth */}
                                  <text x="250" y="15" fontSize="11" fontWeight="bold">Side View</text>
                                  <rect x="220" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <line x1="250" y1="50" x2="250" y2="65" stroke="#ff6b6b" strokeWidth="2" />
                                  <text x="250" y="75" fontSize="8" textAnchor="middle">0.500" depth</text>
                                  <text x="250" y="110" fontSize="9" textAnchor="middle">Ra 1.6 µm finish</text>
                                  
                                  {/* Legend */}
                                  <rect x="20" y="130" width="15" height="15" fill="#d4a574" stroke="#000" strokeWidth="1" />
                                  <text x="40" y="142" fontSize="9">Material</text>
                                  <rect x="140" y="130" width="15" height="15" fill="#b8860b" stroke="#000" strokeWidth="1" />
                                  <text x="160" y="142" fontSize="9">Fixture (Vise Jaws)</text>
                                  <rect x="270" y="130" width="15" height="15" fill="#fff" stroke="#ff6b6b" strokeWidth="2" />
                                  <text x="290" y="142" fontSize="9">Feature ② (Pocket)</text>
                                </>
                              )}
                              
                              {/* OPERATION 3: DRILLING */}
                              {op === 3 && (
                                <>
                                  {/* Top View - After Drilling */}
                                  <text x="50" y="15" fontSize="11" fontWeight="bold">Top View</text>
                                  <rect x="20" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <rect x="32" y="38" width="36" height="24" fill="#fff" stroke="#000" strokeWidth="1" />
                                  <circle cx="37" cy="42" r="2.5" fill="#ff6b6b" stroke="#000" strokeWidth="1" />
                                  <circle cx="52" cy="42" r="2.5" fill="#ff6b6b" stroke="#000" strokeWidth="1" />
                                  <circle cx="37" cy="58" r="2.5" fill="#ff6b6b" stroke="#000" strokeWidth="1" />
                                  <circle cx="52" cy="58" r="2.5" fill="#ff6b6b" stroke="#000" strokeWidth="1" />
                                  <text x="50" y="75" fontSize="8" textAnchor="middle">③</text>
                                  <text x="50" y="110" fontSize="9" textAnchor="middle">4x M6 Holes</text>
                                  
                                  {/* Front View - Drill Jig with Holes */}
                                  <text x="150" y="15" fontSize="11" fontWeight="bold">Front View (in Jig)</text>
                                  <rect x="120" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <rect x="132" y="38" width="36" height="24" fill="#fff" stroke="#000" strokeWidth="1" />
                                  <circle cx="137" cy="42" r="2.5" fill="#ff6b6b" stroke="#000" strokeWidth="1" />
                                  <circle cx="152" cy="42" r="2.5" fill="#ff6b6b" stroke="#000" strokeWidth="1" />
                                  <circle cx="137" cy="58" r="2.5" fill="#ff6b6b" stroke="#000" strokeWidth="1" />
                                  <circle cx="152" cy="58" r="2.5" fill="#ff6b6b" stroke="#000" strokeWidth="1" />
                                  <rect x="115" y="25" width="5" height="50" fill="#b8860b" stroke="#000" strokeWidth="1" />
                                  <text x="150" y="110" fontSize="9" textAnchor="middle">Drill Jig Fixture</text>
                                  
                                  {/* Side View - Through Holes */}
                                  <text x="250" y="15" fontSize="11" fontWeight="bold">Side View</text>
                                  <rect x="220" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <line x1="250" y1="25" x2="250" y2="75" stroke="#ff6b6b" strokeWidth="2" strokeDasharray="2,2" />
                                  <text x="250" y="75" fontSize="8" textAnchor="middle">Through</text>
                                  <text x="250" y="110" fontSize="9" textAnchor="middle">±0.2mm TIR</text>
                                  
                                  {/* Legend */}
                                  <rect x="20" y="130" width="15" height="15" fill="#d4a574" stroke="#000" strokeWidth="1" />
                                  <text x="40" y="142" fontSize="9">Material</text>
                                  <rect x="140" y="130" width="15" height="15" fill="#b8860b" stroke="#000" strokeWidth="1" />
                                  <text x="160" y="142" fontSize="9">Fixture (Drill Jig)</text>
                                  <circle cx="277" cy="137" r="3" fill="#ff6b6b" stroke="#000" strokeWidth="1" />
                                  <text x="290" y="142" fontSize="9">Features ③ (Holes)</text>
                                </>
                              )}
                              
                              {/* OPERATIONS 4-6: ANODIZE & INSPECTION */}
                              {(op === 4 || op === 5 || op === 6) && (
                                <>
                                  {/* Top View */}
                                  <text x="50" y="15" fontSize="11" fontWeight="bold">Top View</text>
                                  <rect x="20" y="25" width="60" height="50" fill="#d4a574" stroke="#000" strokeWidth="1.5" />
                                  <rect x="32" y="38" width="36" height="24" fill="#fff" stroke="#000" strokeWidth="1" />
                                  <circle cx="37" cy="42" r="2.5" fill="#000" />
                                  <circle cx="52" cy="42" r="2.5" fill="#000" />
                                  <circle cx="37" cy="58" r="2.5" fill="#000" />
                                  <circle cx="52" cy="58" r="2.5" fill="#000" />
                                  <text x="50" y="110" fontSize="9" textAnchor="middle">{op === 4 ? 'Cleaned' : op === 5 ? 'Anodized' : 'Inspected'}</text>
                                  
                                  {/* Front View */}
                                  <text x="150" y="15" fontSize="11" fontWeight="bold">Front View</text>
                                  <rect x="120" y="25" width="60" height="50" fill={op === 5 ? '#a0a0a0' : '#d4a574'} stroke="#000" strokeWidth="1.5" />
                                  <rect x="132" y="38" width="36" height="24" fill="#fff" stroke="#000" strokeWidth="1" />
                                  <circle cx="137" cy="42" r="2.5" fill="#000" />
                                  <circle cx="152" cy="42" r="2.5" fill="#000" />
                                  <circle cx="137" cy="58" r="2.5" fill="#000" />
                                  <circle cx="152" cy="58" r="2.5" fill="#000" />
                                  <text x="150" y="110" fontSize="9" textAnchor="middle">{op === 4 ? 'Alkaline Clean' : op === 5 ? 'Type II Anodize' : 'Final Inspection'}</text>
                                  
                                  {/* Side View */}
                                  <text x="250" y="15" fontSize="11" fontWeight="bold">Side View</text>
                                  <rect x="220" y="25" width="60" height="50" fill={op === 5 ? '#a0a0a0' : '#d4a574'} stroke="#000" strokeWidth="1.5" />
                                  <text x="250" y="75" fontSize="8" textAnchor="middle">{op === 4 ? 'pH 10.5-11.5' : op === 5 ? '0.0009" coating' : 'CMM Verified'}</text>
                                  <text x="250" y="110" fontSize="9" textAnchor="middle">{op === 4 ? '15 min @ 140°F' : op === 5 ? '45 min @ 12V' : 'All dims OK'}</text>
                                  
                                  {/* Legend */}
                                  <rect x="20" y="130" width="15" height="15" fill="#d4a574" stroke="#000" strokeWidth="1" />
                                  <text x="40" y="142" fontSize="9">Material</text>
                                  {op === 5 && (
                                    <>
                                      <rect x="140" y="130" width="15" height="15" fill="#a0a0a0" stroke="#000" strokeWidth="1" />
                                      <text x="160" y="142" fontSize="9">Anodized Coating</text>
                                    </>
                                  )}
                                </>
                              )}
                            </svg>
                          </div>

                          {/* ISOMETRIC 3D VIEW - PART IN FIXTURE */}
                          <div style={{ marginBottom: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>Isometric View - Part in Fixture (3-2-1 Principle)</div>
                            <svg width="100%" height="200" viewBox="0 0 400 200" style={{ border: '1px solid #ddd', borderRadius: '4px', background: '#fff' }}>
                              {op === 1 && (
                                <>
                                  {/* V-BLOCK FIXTURE - Realistic isometric shape */}
                                  {/* Base block */}
                                  <polygon points="50,120 150,80 150,160 50,200" fill="#8b6914" stroke="#000" strokeWidth="2" />
                                  <polygon points="50,120 50,200 80,220 80,140" fill="#6b5310" stroke="#000" strokeWidth="2" />
                                  <polygon points="150,80 150,160 80,140 80,60" fill="#b8860b" stroke="#000" strokeWidth="2" />
                                  
                                  {/* V-shaped groove */}
                                  <polygon points="70,100 130,70 130,140 70,170" fill="#4a4a4a" stroke="#000" strokeWidth="1.5" />
                                  <line x1="100" y1="70" x2="100" y2="170" stroke="#333" strokeWidth="1" />
                                  
                                  {/* ALUMINUM PART - Positioned on V-block */}
                                  <polygon points="95,110 125,95 125,145 95,160" fill="#d4a574" stroke="#000" strokeWidth="2" />
                                  <polygon points="95,110 95,160 110,170 110,120" fill="#c99560" stroke="#000" strokeWidth="2" />
                                  <polygon points="125,95 125,145 110,120 110,70" fill="#e8c4a0" stroke="#000" strokeWidth="2" />
                                  
                                  {/* Material to be removed (end to cut) */}
                                  <polygon points="120,95 125,92 125,145 120,148" fill="#ffcccc" stroke="#ff6b6b" strokeWidth="2" />
                                  
                                  {/* Bubble annotation - Material to Remove */}
                                  <line x1="125" y1="120" x2="155" y2="100" stroke="#ff6b6b" strokeWidth="1.5" />
                                  <circle cx="160" cy="95" r="12" fill="#fff" stroke="#ff6b6b" strokeWidth="2" />
                                  <text x="154" y="100" fontSize="11" fontWeight="bold" fill="#ff6b6b">①</text>
                                  <text x="130" y="115" fontSize="7" fill="#ff6b6b" fontWeight="bold">Remove</text>
                                  
                                  {/* Bubble annotation - Remaining Material */}
                                  <line x1="100" y1="125" x2="70" y2="155" stroke="#d4a574" strokeWidth="1.5" />
                                  <circle cx="60" cy="165" r="12" fill="#fff" stroke="#d4a574" strokeWidth="2" />
                                  <text x="54" y="170" fontSize="11" fontWeight="bold" fill="#d4a574">②</text>
                                  <text x="25" y="185" fontSize="7" fill="#d4a574" fontWeight="bold">Remaining</text>
                                  
                                  {/* Clamping force indicator */}
                                  <line x1="40" y1="140" x2="48" y2="140" stroke="#000" strokeWidth="2" />
                                  <polygon points="48,140 40,135 40,145" fill="#000" />
                                  <text x="25" y="145" fontSize="8">Clamp</text>
                                  
                                  {/* Legend */}
                                  <rect x="10" y="175" width="8" height="8" fill="#d4a574" stroke="#000" strokeWidth="1" />
                                  <text x="22" y="182" fontSize="7">Part</text>
                                  <rect x="70" y="175" width="8" height="8" fill="#ffcccc" stroke="#ff6b6b" strokeWidth="1" />
                                  <text x="82" y="182" fontSize="7">Remove</text>
                                  <rect x="135" y="175" width="8" height="8" fill="#8b6914" stroke="#000" strokeWidth="1" />
                                  <text x="147" y="182" fontSize="7">Fixture</text>
                                </>
                              )}
                              
                              {op === 2 && (
                                <>
                                  {/* PRECISION VISE FIXTURE - Realistic isometric shape */}
                                  {/* Vise body - main block */}
                                  <polygon points="40,110 160,70 160,150 40,190" fill="#8b6914" stroke="#000" strokeWidth="2" />
                                  <polygon points="40,110 40,190 70,210 70,130" fill="#6b5310" stroke="#000" strokeWidth="2" />
                                  <polygon points="160,70 160,150 70,130 70,50" fill="#b8860b" stroke="#000" strokeWidth="2" />
                                  
                                  {/* Left jaw */}
                                  <polygon points="50,115 60,110 60,175 50,180" fill="#444" stroke="#000" strokeWidth="1.5" />
                                  {/* Right jaw */}
                                  <polygon points="150,75 160,70 160,150 150,155" fill="#444" stroke="#000" strokeWidth="1.5" />
                                  
                                  {/* ALUMINUM PART - Clamped between jaws */}
                                  <polygon points="65,115 145,80 145,140 65,175" fill="#d4a574" stroke="#000" strokeWidth="2" />
                                  <polygon points="65,115 65,175 85,190 85,130" fill="#c99560" stroke="#000" strokeWidth="2" />
                                  <polygon points="145,80 145,140 85,130 85,70" fill="#e8c4a0" stroke="#000" strokeWidth="2" />
                                  
                                  {/* POCKET CAVITY - White area showing depth */}
                                  <polygon points="85,125 125,105 125,130 85,150" fill="#fff" stroke="#ff6b6b" strokeWidth="2" />
                                  <text x="105" y="128" fontSize="9" fontWeight="bold" fill="#ff6b6b">②</text>
                                  
                                  {/* Material to be removed (pocket) */}
                                  <polygon points="120,105 145,90 145,140 120,155" fill="#ffcccc" stroke="#ff6b6b" strokeWidth="1.5" />
                                  
                                  {/* Bubble annotation - Material to Remove (Pocket) */}
                                  <line x1="145" y1="115" x2="175" y2="95" stroke="#ff6b6b" strokeWidth="1.5" />
                                  <circle cx="185" cy="85" r="12" fill="#fff" stroke="#ff6b6b" strokeWidth="2" />
                                  <text x="179" y="90" fontSize="11" fontWeight="bold" fill="#ff6b6b">①</text>
                                  <text x="155" y="105" fontSize="7" fill="#ff6b6b" fontWeight="bold">Pocket</text>
                                  
                                  {/* Bubble annotation - Remaining Material */}
                                  <line x1="80" y1="130" x2="50" y2="160" stroke="#d4a574" strokeWidth="1.5" />
                                  <circle cx="40" cy="170" r="12" fill="#fff" stroke="#d4a574" strokeWidth="2" />
                                  <text x="34" y="175" fontSize="11" fontWeight="bold" fill="#d4a574">②</text>
                                  <text x="5" y="190" fontSize="7" fill="#d4a574" fontWeight="bold">Remaining</text>
                                  
                                  {/* Clamping force arrows */}
                                  <line x1="35" y1="140" x2="42" y2="140" stroke="#000" strokeWidth="2" />
                                  <polygon points="42,140 35,135 35,145" fill="#000" />
                                  <line x1="165" y1="110" x2="172" y2="110" stroke="#000" strokeWidth="2" />
                                  <polygon points="165,110 172,105 172,115" fill="#000" />
                                  
                                  {/* Legend */}
                                  <rect x="10" y="175" width="8" height="8" fill="#d4a574" stroke="#000" strokeWidth="1" />
                                  <text x="22" y="182" fontSize="7">Part</text>
                                  <rect x="70" y="175" width="8" height="8" fill="#ffcccc" stroke="#ff6b6b" strokeWidth="1" />
                                  <text x="82" y="182" fontSize="7">Remove</text>
                                  <rect x="135" y="175" width="8" height="8" fill="#8b6914" stroke="#000" strokeWidth="1" />
                                  <text x="147" y="182" fontSize="7">Fixture</text>
                                </>
                              )}
                              
                              {op === 3 && (
                                <>
                                  {/* DRILL JIG FIXTURE - Realistic isometric shape */}
                                  {/* Jig base plate */}
                                  <polygon points="35,110 175,70 175,150 35,190" fill="#8b6914" stroke="#000" strokeWidth="2" />
                                  <polygon points="35,110 35,190 65,210 65,130" fill="#6b5310" stroke="#000" strokeWidth="2" />
                                  <polygon points="175,70 175,150 65,130 65,50" fill="#b8860b" stroke="#000" strokeWidth="2" />
                                  
                                  {/* Drill bushings - 4 holes */}
                                  <circle cx="75" cy="95" r="5" fill="#555" stroke="#000" strokeWidth="1.5" />
                                  <circle cx="135" cy="80" r="5" fill="#555" stroke="#000" strokeWidth="1.5" />
                                  <circle cx="75" cy="155" r="5" fill="#555" stroke="#000" strokeWidth="1.5" />
                                  <circle cx="135" cy="140" r="5" fill="#555" stroke="#000" strokeWidth="1.5" />
                                  
                                  {/* ALUMINUM PART - Positioned in jig */}
                                  <polygon points="60,110 155,75 155,135 60,170" fill="#d4a574" stroke="#000" strokeWidth="2" />
                                  <polygon points="60,110 60,170 80,185 80,125" fill="#c99560" stroke="#000" strokeWidth="2" />
                                  <polygon points="155,75 155,135 80,125 80,65" fill="#e8c4a0" stroke="#000" strokeWidth="2" />
                                  
                                  {/* POCKET CAVITY - White area */}
                                  <polygon points="80,120 130,100 130,130 80,150" fill="#fff" stroke="#ff6b6b" strokeWidth="1.5" />
                                  
                                  {/* 4 DRILL HOLES - Light red showing removed material */}
                                  <circle cx="75" cy="110" r="3" fill="#ffcccc" stroke="#ff6b6b" strokeWidth="1.5" />
                                  <circle cx="135" cy="95" r="3" fill="#ffcccc" stroke="#ff6b6b" strokeWidth="1.5" />
                                  <circle cx="75" cy="150" r="3" fill="#ffcccc" stroke="#ff6b6b" strokeWidth="1.5" />
                                  <circle cx="135" cy="135" r="3" fill="#ffcccc" stroke="#ff6b6b" strokeWidth="1.5" />
                                  
                                  {/* Bubble annotation - Material to Remove (Holes) */}
                                  <line x1="135" y1="95" x2="165" y2="70" stroke="#ff6b6b" strokeWidth="1.5" />
                                  <circle cx="175" cy="60" r="12" fill="#fff" stroke="#ff6b6b" strokeWidth="2" />
                                  <text x="169" y="65" fontSize="11" fontWeight="bold" fill="#ff6b6b">①</text>
                                  <text x="140" y="85" fontSize="7" fill="#ff6b6b" fontWeight="bold">4x Holes</text>
                                  
                                  {/* Bubble annotation - Remaining Material */}
                                  <line x1="75" y1="130" x2="45" y2="160" stroke="#d4a574" strokeWidth="1.5" />
                                  <circle cx="35" cy="170" r="12" fill="#fff" stroke="#d4a574" strokeWidth="2" />
                                  <text x="29" y="175" fontSize="11" fontWeight="bold" fill="#d4a574">②</text>
                                  <text x="0" y="190" fontSize="7" fill="#d4a574" fontWeight="bold">Remaining</text>
                                  
                                  {/* Drill spindle - drilling from above */}
                                  <line x1="105" y1="35" x2="105" y2="70" stroke="#ff6b6b" strokeWidth="2" />
                                  <polygon points="105,30 100,40 110,40" fill="#ff6b6b" />
                                  <text x="110" y="35" fontSize="9" fill="#ff6b6b">Drill</text>
                                  
                                  {/* Legend */}
                                  <rect x="10" y="175" width="8" height="8" fill="#d4a574" stroke="#000" strokeWidth="1" />
                                  <text x="22" y="182" fontSize="7">Part</text>
                                  <rect x="70" y="175" width="8" height="8" fill="#ffcccc" stroke="#ff6b6b" strokeWidth="1" />
                                  <text x="82" y="182" fontSize="7">Remove</text>
                                  <rect x="135" y="175" width="8" height="8" fill="#8b6914" stroke="#000" strokeWidth="1" />
                                  <text x="147" y="182" fontSize="7">Fixture</text>
                                </>
                              )}
                              
                              {(op === 4 || op === 5 || op === 6) && (
                                <>
                                  {/* Basket Fixture - Isometric */}
                                  <polygon points="70,100 170,60 170,140 70,180" fill="#b8860b" stroke="#000" strokeWidth="1.5" />
                                  <polygon points="70,100 70,180 100,200 100,120" fill="#9d7608" stroke="#000" strokeWidth="1.5" />
                                  <polygon points="170,60 170,140 100,120 100,40" fill="#d4af37" stroke="#000" strokeWidth="1.5" />
                                  
                                  {/* Part in Basket */}
                                  <polygon points="80,100 160,65 160,135 80,170" fill={op === 5 ? '#a0a0a0' : '#d4a574'} stroke="#000" strokeWidth="1.5" />
                                  <polygon points="80,100 80,170 110,190 110,120" fill={op === 5 ? '#808080' : '#c99560'} stroke="#000" strokeWidth="1.5" />
                                  <polygon points="160,65 160,135 110,120 110,50" fill={op === 5 ? '#b8b8b8' : '#e8c4a0'} stroke="#000" strokeWidth="1.5" />
                                  
                                  {/* Process label */}
                                  <text x="100" y="130" fontSize="11" fontWeight="bold" fill="#ff6b6b">
                                    {op === 4 ? 'Cleaning' : op === 5 ? 'Anodizing' : 'Inspection'}
                                  </text>
                                  
                                  {/* Labels */}
                                  <text x="50" y="140" fontSize="10" fontWeight="bold">Basket Fixture</text>
                                  <text x="200" y="190" fontSize="8" fill="#666">
                                    {op === 4 ? 'Alkaline clean 15 min @ 140°F' : op === 5 ? 'Type II anodize 45 min @ 12V' : 'Final CMM inspection'}
                                  </text>
                                </>
                              )}
                            </svg>
                          </div>
                          
                          {op === 1 && (
                            <div style={{ fontSize: '0.8rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                <div><strong>Part Orientation:</strong> Length-wise in vise</div>
                                <div><strong>Fixture:</strong> Aluminum V-block vise (soft jaws)</div>
                                <div><strong>Clamping Force:</strong> 500 lbs (avoid marring)</div>
                                <div><strong>Blade Type:</strong> Carbide, 0.035\" thick, 14 TPI</div>
                              </div>
                              <div style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderLeft: '3px solid #000' }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Dimensions Established:</div>
                                <div>• Overall Length: 3.000\" ±0.010\" (cut length)</div>
                                <div>• Cut face perpendicularity: ±0.005\" TIR</div>
                                <div>• Deburr: Remove all sharp edges (0.5mm chamfer)</div>
                              </div>
                            </div>
                          )}
                          
                          {op === 2 && (
                            <div style={{ fontSize: '0.8rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                <div><strong>Part Orientation:</strong> Flat on parallels, pocket up</div>
                                <div><strong>Fixture:</strong> Precision vise with 1-2-3 blocks</div>
                                <div><strong>Clamping:</strong> Bottom edges only (avoid pocket)</div>
                                <div><strong>Tool:</strong> 1/2\" End Mill, 4-flute, Carbide</div>
                              </div>
                              <div style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderLeft: '3px solid #000' }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Dimensions Established:</div>
                                <div>• Pocket depth: 0.500\" ±0.005\" (from top surface)</div>
                                <div>• Pocket width: 2.500\" ±0.010\"</div>
                                <div>• Surface finish: Ra 1.6 µm (feed 0.003\"/tooth)</div>
                                <div>• Spindle: 1200 RPM, Feed: 0.006\"/rev</div>
                              </div>
                            </div>
                          )}
                          
                          {op === 3 && (
                            <div style={{ fontSize: '0.8rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                <div><strong>Part Orientation:</strong> Pocket down on parallels</div>
                                <div><strong>Fixture:</strong> Drill jig with 4x M6 bushings</div>
                                <div><strong>Alignment:</strong> Datum A (top surface) to jig</div>
                                <div><strong>Tool:</strong> #27 Twist Drill (0.144\"), Carbide</div>
                              </div>
                              <div style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderLeft: '3px solid #000' }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Dimensions Established:</div>
                                <div>• Hole pattern: 4x M6 ±0.2mm from datum</div>
                                <div>• Hole depth: Through (0.750\")</div>
                                <div>• Hole perpendicularity: ±0.1mm TIR</div>
                                <div>• Spindle: 2000 RPM, Feed: 0.004\"/rev</div>
                              </div>
                            </div>
                          )}
                          
                          {op === 4 && (
                            <div style={{ fontSize: '0.8rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                <div><strong>Part Orientation:</strong> Loose in basket</div>
                                <div><strong>Fixture:</strong> Stainless steel mesh basket</div>
                                <div><strong>Solution:</strong> Alkaline cleaner, 140°F</div>
                                <div><strong>Time:</strong> 15 minutes, agitate every 3 min</div>
                              </div>
                              <div style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderLeft: '3px solid #000' }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Condition Established:</div>
                                <div>• Surface cleanliness: Oil/grease free</div>
                                <div>• pH: 10.5-11.5 (alkaline)</div>
                                <div>• No oxidation or corrosion</div>
                                <div>• Ready for anodize (critical for adhesion)</div>
                              </div>
                            </div>
                          )}
                          
                          {op === 5 && (
                            <div style={{ fontSize: '0.8rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                <div><strong>Part Orientation:</strong> Suspended on titanium racks</div>
                                <div><strong>Fixture:</strong> Titanium anodize rack (non-reactive)</div>
                                <div><strong>Bath:</strong> Sulfuric acid, 15% concentration</div>
                                <div><strong>Temperature:</strong> 65-75°F, voltage: 12V DC</div>
                              </div>
                              <div style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderLeft: '3px solid #000' }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Coating Established:</div>
                                <div>• Type II Anodize per MIL-A-8625</div>
                                <div>• Thickness: 0.0007\" - 0.0012\" (target 0.0009\")</div>
                                <div>• Color: Natural (clear)</div>
                                <div>• Duration: 45 minutes at 12A/sq ft</div>
                              </div>
                            </div>
                          )}
                          
                          {op === 6 && (
                            <div style={{ fontSize: '0.8rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                                <div><strong>Part Orientation:</strong> On CMM table</div>
                                <div><strong>Fixture:</strong> Precision CMM fixture (granite base)</div>
                                <div><strong>Datum Setup:</strong> Top surface (Datum A)</div>
                                <div><strong>Equipment:</strong> Coordinate Measuring Machine</div>
                              </div>
                              <div style={{ marginTop: '8px', padding: '8px', background: '#f9fafb', borderLeft: '3px solid #000' }}>
                                <div style={{ fontWeight: '600', marginBottom: '4px' }}>Final Verification:</div>
                                <div>• All dimensions verified to print</div>
                                <div>• Surface finish: Ra 1.6 µm (Profilometer)</div>
                                <div>• Coating thickness: 0.0007\" - 0.0012\" (Eddy Current)</div>
                                <div>• Visual inspection: No defects, scratches, or damage</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Sign-Off Section */}
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', background: '#f9fafb', padding: '12px', borderRadius: '4px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>OPERATOR SIGN-OFF & VERIFICATION</div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.75rem' }}>
                            <div>
                              <div>Operator Name: ________________</div>
                              <div style={{ marginTop: '4px' }}>Employee ID: ________________</div>
                            </div>
                            <div>
                              <div>Date: ________________</div>
                              <div style={{ marginTop: '4px' }}>Time: ________________</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div>Signature: _________________________ | Quality Check: ☐ PASS  ☐ REWORK  ☐ SCRAP</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* VENDOR PURCHASE ORDERS */}
                  <div className="packages-section">
                    <div className="packages-section-title">VENDOR PURCHASE ORDERS & OUTSIDE PROCESSING</div>
                    {[1,2].map((po) => (
                      <div key={po} style={{ marginBottom: '16px', padding: '12px', border: '2px solid #333', borderRadius: '6px', background: '#fff' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                          <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>PO #{po === 1 ? 'PO-2026-4521' : 'PO-2026-4522'}</div>
                          <div style={{ textAlign: 'center' }}>
                            <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG(`PO${po}2026`) }} />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.85rem', marginBottom: '12px' }}>
                          <div><strong>Vendor:</strong> {po === 1 ? 'Alcoa Metals Inc.' : 'Premier Anodizing Corp'}</div>
                          <div><strong>Contact:</strong> {po === 1 ? 'John Smith (408) 555-0198' : 'Sarah Lee (510) 555-0234'}</div>
                          <div><strong>Part/Service:</strong> {po === 1 ? 'Aluminum Stock (6061-T6)' : 'Anodize Type II Processing'}</div>
                          <div><strong>Quantity:</strong> {po === 1 ? '100 pcs' : '100 pcs'}</div>
                          <div><strong>Unit Price:</strong> {po === 1 ? '$12.40' : '$8.50'}</div>
                          <div><strong>Total:</strong> {po === 1 ? '$1,240.00' : '$850.00'}</div>
                          <div><strong>Delivery Date:</strong> {po === 1 ? 'March 9, 2026' : 'March 14, 2026'}</div>
                          <div><strong>Lead Time:</strong> {po === 1 ? '5 days' : '10 days'}</div>
                        </div>
                        <div style={{ padding: '8px', background: '#fff', borderRadius: '4px', fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Processing Instructions:</div>
                          <ul className="packages-list">
                            {po === 1 ? (
                              <>
                                <li>Provide Mill Certificate ASTM B221</li>
                                <li>Stock must be clean, no surface defects</li>
                                <li>Deliver in protective wrap</li>
                              </>
                            ) : (
                              <>
                                <li>Type II Anodize per MIL-A-8625</li>
                                <li>Thickness: 0.0007" - 0.0012"</li>
                                <li>Color: Natural (clear)</li>
                                <li>Salt Spray Test: ASTM B117 (500 hours)</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* QUALITY INSPECTION SHEET */}
                  <div className="packages-section">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <div className="packages-section-title" style={{ margin: 0 }}>QUALITY INSPECTION SHEET & DRAWING</div>
                      <div style={{ textAlign: 'center' }}>
                        <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG('INSP-SHEET-Q2026') }} />
                      </div>
                    </div>

                    {/* DRAWING WITH BUBBLE ANNOTATIONS */}
                    <div style={{ marginBottom: '16px', padding: '16px', border: '2px solid #000', background: '#fff', borderRadius: '4px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>DWG-2024-1847 Rev B | Part: Aluminum Bracket Assembly | Scale: 1:1</div>
                      
                      {/* SVG Drawing with Bubble Annotations */}
                      <svg width="100%" height="300" viewBox="0 0 600 300" style={{ border: '1px solid #ccc', marginBottom: '12px' }}>
                        {/* Part outline - rectangular bracket */}
                        <rect x="100" y="80" width="400" height="150" fill="#f5f5f5" stroke="#000" strokeWidth="2"/>
                        
                        {/* Pocket/cutout */}
                        <rect x="150" y="120" width="300" height="70" fill="#fff" stroke="#000" strokeWidth="1.5" strokeDasharray="5,5"/>
                        
                        {/* Holes - 4x M6 pattern */}
                        <circle cx="180" cy="110" r="8" fill="none" stroke="#000" strokeWidth="1.5"/>
                        <circle cx="420" cy="110" r="8" fill="none" stroke="#000" strokeWidth="1.5"/>
                        <circle cx="180" cy="220" r="8" fill="none" stroke="#000" strokeWidth="1.5"/>
                        <circle cx="420" cy="220" r="8" fill="none" stroke="#000" strokeWidth="1.5"/>
                        
                        {/* Dimension lines */}
                        <line x1="80" y1="250" x2="520" y2="250" stroke="#000" strokeWidth="0.5"/>
                        <text x="300" y="270" fontSize="12" textAnchor="middle" fontFamily="Arial">3.000\" ±0.010\"</text>
                        
                        {/* Bubble Annotations */}
                        {/* Bubble 1 - Overall Length */}
                        <circle cx="550" cy="100" r="16" fill="none" stroke="#000" strokeWidth="2"/>
                        <text x="550" y="106" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="Arial">①</text>
                        <line x1="534" y1="100" x2="520" y2="100" stroke="#000" strokeWidth="1"/>
                        
                        {/* Bubble 2 - Width */}
                        <circle cx="550" cy="160" r="16" fill="none" stroke="#000" strokeWidth="2"/>
                        <text x="550" y="166" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="Arial">②</text>
                        <line x1="534" y1="160" x2="520" y2="160" stroke="#000" strokeWidth="1"/>
                        
                        {/* Bubble 3 - Pocket */}
                        <circle cx="70" cy="155" r="16" fill="none" stroke="#000" strokeWidth="2"/>
                        <text x="70" y="161" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="Arial">③</text>
                        <line x1="86" y1="155" x2="150" y2="155" stroke="#000" strokeWidth="1"/>
                        
                        {/* Bubble 4 - Hole Pattern */}
                        <circle cx="300" cy="30" r="16" fill="none" stroke="#000" strokeWidth="2"/>
                        <text x="300" y="36" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="Arial">④</text>
                        <line x1="300" y1="46" x2="300" y2="80" stroke="#000" strokeWidth="1"/>
                        
                        {/* Bubble 5 - Surface Finish */}
                        <circle cx="50" cy="80" r="16" fill="none" stroke="#000" strokeWidth="2"/>
                        <text x="50" y="86" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="Arial">⑤</text>
                        <line x1="66" y1="80" x2="100" y2="80" stroke="#000" strokeWidth="1"/>
                      </svg>
                    </div>

                    {/* INSPECTION DETAILS CORRESPONDING TO BUBBLES */}
                    <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>INSPECTION POINTS & REQUIREMENTS:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.85rem' }}>
                        <div style={{ padding: '8px', background: '#fff', borderLeft: '3px solid #000', borderRadius: '2px' }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>① Overall Length</div>
                          <div>Spec: 3.000\" ±0.010\"</div>
                          <div>Tool: CMM</div>
                          <div>Status: ☐ PASS  ☐ FAIL</div>
                        </div>
                        <div style={{ padding: '8px', background: '#fff', borderLeft: '3px solid #000', borderRadius: '2px' }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>② Width</div>
                          <div>Spec: 2.500\" ±0.010\"</div>
                          <div>Tool: CMM</div>
                          <div>Status: ☐ PASS  ☐ FAIL</div>
                        </div>
                        <div style={{ padding: '8px', background: '#fff', borderLeft: '3px solid #000', borderRadius: '2px' }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>③ Pocket Depth</div>
                          <div>Spec: 0.500\" ±0.005\"</div>
                          <div>Tool: Depth Gauge</div>
                          <div>Status: ☐ PASS  ☐ FAIL</div>
                        </div>
                        <div style={{ padding: '8px', background: '#fff', borderLeft: '3px solid #000', borderRadius: '2px' }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>④ Hole Pattern (4x M6)</div>
                          <div>Spec: ±0.2mm from datum</div>
                          <div>Tool: CMM / Go-No-Go</div>
                          <div>Status: ☐ PASS  ☐ FAIL</div>
                        </div>
                        <div style={{ padding: '8px', background: '#fff', borderLeft: '3px solid #000', borderRadius: '2px' }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>⑤ Surface Finish</div>
                          <div>Spec: Ra 1.6 µm max</div>
                          <div>Tool: Profilometer</div>
                          <div>Status: ☐ PASS  ☐ FAIL</div>
                        </div>
                        <div style={{ padding: '8px', background: '#fff', borderLeft: '3px solid #000', borderRadius: '2px' }}>
                          <div style={{ fontWeight: '600', marginBottom: '4px' }}>Anodize Coating</div>
                          <div>Spec: 0.0007\" - 0.0012\"</div>
                          <div>Tool: Eddy Current</div>
                          <div>Status: ☐ PASS  ☐ FAIL</div>
                        </div>
                      </div>
                    </div>

                    {/* FIRST ARTICLE INSPECTION (FAI) REQUIREMENTS */}
                    <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>First Article Inspection (FAI) Requirements:</div>
                      <ul className="packages-list">
                        <li>100% dimensional verification (CMM) - All 5 inspection points</li>
                        <li>Surface finish verification (Profilometer) - Ra 1.6 µm</li>
                        <li>Material certification review - ASTM B221 Mill Certificate</li>
                        <li>Coating thickness verification (Eddy Current) - 0.0007\" - 0.0012\"</li>
                        <li>Salt spray test (ASTM B117 - 500 hours minimum)</li>
                        <li>First 5 pieces require 100% inspection before release</li>
                        <li>FAI Report must be signed by Quality Manager</li>
                      </ul>
                    </div>

                    {/* INSPECTION SIGN-OFF */}
                    <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '600', marginBottom: '12px', fontSize: '0.9rem' }}>INSPECTION SIGN-OFF</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.8rem' }}>
                        <div>
                          <div>Inspector Name: ________________</div>
                          <div style={{ marginTop: '4px' }}>Employee ID: ________________</div>
                        </div>
                        <div>
                          <div>Date: ________________</div>
                          <div style={{ marginTop: '4px' }}>Time: ________________</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div>Signature: _________________________ | FAI Status: ☐ APPROVED  ☐ CONDITIONAL  ☐ REJECTED</div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div>Quality Manager Approval: _________________________ Date: _________</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SHIPPING INSTRUCTIONS */}
                  <div className="packages-section">
                    <div className="packages-section-title">SHIPPING INSTRUCTIONS & DOCUMENTATION</div>
                    <div className="packages-grid">
                      <div className="packages-item"><div className="packages-item-label">Packaging Type</div><div className="packages-item-value">Foam-lined Box</div></div>
                      <div className="packages-item"><div className="packages-item-label">Total Weight</div><div className="packages-item-value">45 lbs</div></div>
                      <div className="packages-item"><div className="packages-item-label">Box Dimensions</div><div className="packages-item-value">12" x 10" x 8"</div></div>
                      <div className="packages-item"><div className="packages-item-label">Shipping Method</div><div className="packages-item-value">FedEx Ground</div></div>
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Documentation Included:</div>
                      <ul className="packages-list">
                        <li>Packing List (itemized, quantities)</li>
                        <li>Certificate of Conformance</li>
                        <li>Material Certification (Mill Certificate)</li>
                        <li>FAI Report (if applicable)</li>
                        <li>Inspection Report</li>
                        <li>Anodize Test Report (Salt Spray)</li>
                      </ul>
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Special Handling:</div>
                      <ul className="packages-list">
                        <li>Handle with clean gloves (anodized surfaces)</li>
                        <li>Do not stack weight on top</li>
                        <li>Protect from moisture and dust</li>
                        <li>Inspect upon receipt for damage</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              {packageTab === 'compliance' && (
                <div>
                  {/* LETTERHEAD */}
                  <div style={{ borderBottom: '2px solid #000', paddingBottom: '16px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#000' }}>GUARDIAN OS</div>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>Compliance & Quality Assurance</div>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '8px' }}>2500 Innovation Drive, San Jose, CA 95110 | Phone: (408) 555-0147 | www.guardianOS.com</div>
                  </div>

                  {/* AS9100 COMPLIANCE */}
                  <div className="packages-section">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <div className="packages-section-title" style={{ margin: 0 }}>AS9100 REV D - AEROSPACE QUALITY MANAGEMENT</div>
                      <div style={{ textAlign: 'center' }}>
                        <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG('AS9100REV-D') }} />
                      </div>
                    </div>
                    <div className="packages-grid">
                      <div className="packages-item"><div className="packages-item-label">Standard</div><div className="packages-item-value">AS9100 Rev D</div></div>
                      <div className="packages-item"><div className="packages-item-label">Certification Status</div><div className="packages-item-value">Compliant</div></div>
                      <div className="packages-item"><div className="packages-item-label">Audit Date</div><div className="packages-item-value">Feb 15, 2026</div></div>
                      <div className="packages-item"><div className="packages-item-label">Valid Until</div><div className="packages-item-value">Feb 14, 2029</div></div>
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Key Requirements for This Job:</div>
                      <ul className="packages-list">
                        <li>Configuration Management - Drawing control (DWG-2024-1847 Rev B)</li>
                        <li>Product Safety - Material certification (ASTM B221)</li>
                        <li>Foreign Object Debris (FOD) - Clean room procedures</li>
                        <li>Counterfeit Parts Prevention - Supplier verification</li>
                        <li>Traceability - Serial number tracking</li>
                        <li>Tool Control - Calibrated inspection equipment (CMM, Eddy Current)</li>
                        <li>First Article Inspection (FAI) - 100% verification of first 5 pieces</li>
                        <li>Nonconforming Product - Documented disposition</li>
                      </ul>
                    </div>
                  </div>

                  {/* ISO 9001 COMPLIANCE */}
                  <div className="packages-section">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <div className="packages-section-title" style={{ margin: 0 }}>ISO 9001:2015 - QUALITY MANAGEMENT SYSTEM</div>
                      <div style={{ textAlign: 'center' }}>
                        <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG('ISO9001-2015') }} />
                      </div>
                    </div>
                    <div className="packages-grid">
                      <div className="packages-item"><div className="packages-item-label">Standard</div><div className="packages-item-value">ISO 9001:2015</div></div>
                      <div className="packages-item"><div className="packages-item-label">Certification Status</div><div className="packages-item-value">Compliant</div></div>
                      <div className="packages-item"><div className="packages-item-label">Audit Date</div><div className="packages-item-value">Jan 20, 2026</div></div>
                      <div className="packages-item"><div className="packages-item-label">Valid Until</div><div className="packages-item-value">Jan 19, 2027</div></div>
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Quality Procedures Applied:</div>
                      <ul className="packages-list">
                        <li>QP-001: Design & Engineering Review</li>
                        <li>QP-002: Manufacturing Process Control</li>
                        <li>QP-003: Inspection & Testing</li>
                        <li>QP-004: Nonconforming Product Control</li>
                        <li>QP-005: Corrective & Preventive Action (CAPA)</li>
                        <li>QP-006: Document & Record Control</li>
                        <li>QP-007: Internal Audits</li>
                      </ul>
                    </div>
                  </div>

                  {/* MATERIAL CERTIFICATION */}
                  <div className="packages-section">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <div className="packages-section-title" style={{ margin: 0 }}>MATERIAL CERTIFICATION & TRACEABILITY</div>
                      <div style={{ textAlign: 'center' }}>
                        <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG('MATCERT-ALU6061') }} />
                      </div>
                    </div>
                    <div className="packages-grid">
                      <div className="packages-item"><div className="packages-item-label">Material</div><div className="packages-item-value">Aluminum 6061-T6</div></div>
                      <div className="packages-item"><div className="packages-item-label">Supplier</div><div className="packages-item-value">Alcoa Metals Inc.</div></div>
                      <div className="packages-item"><div className="packages-item-label">Lot Number</div><div className="packages-item-value">ALU-2026-4521</div></div>
                      <div className="packages-item"><div className="packages-item-label">Heat Number</div><div className="packages-item-value">H-847-2026</div></div>
                    </div>
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '4px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>Mill Certificate (ASTM B221):</div>
                      <ul className="packages-list">
                        <li>Tensile Strength: 45,000 psi (verified)</li>
                        <li>Yield Strength: 40,000 psi (verified)</li>
                        <li>Elongation: 8% (verified)</li>
                        <li>Hardness: 95 HB (verified)</li>
                        <li>Chemical Composition: Within specification</li>
                      </ul>
                    </div>
                  </div>

                  {/* TESTING & VALIDATION */}
                  <div className="packages-section">
                    <div className="packages-section-title">TESTING & VALIDATION REPORTS</div>
                    <div style={{ marginBottom: '12px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fafafa' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600' }}>Salt Spray Test (ASTM B117) - Anodize Coating</div>
                        <div style={{ textAlign: 'center' }}>
                          <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG('ASTM-B117') }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.85rem' }}>
                        <div><strong>Test Duration:</strong> 500 hours</div>
                        <div><strong>Result:</strong> PASS - No red rust</div>
                        <div><strong>Coating Thickness:</strong> 0.0009" (within spec)</div>
                        <div><strong>Test Date:</strong> March 1, 2026</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: '12px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fafafa' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: '600' }}>Dimensional Verification (CMM Report)</div>
                        <div style={{ textAlign: 'center' }}>
                          <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG('CMM-REPORT') }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.85rem' }}>
                        <div><strong>Overall Length:</strong> 3.0004" (PASS)</div>
                        <div><strong>Width:</strong> 2.5002" (PASS)</div>
                        <div><strong>Thickness:</strong> 0.7498" (PASS)</div>
                        <div><strong>Hole Position:</strong> Within tolerance (PASS)</div>
                      </div>
                    </div>
                  </div>

                  {/* VENDOR COMPLIANCE */}
                  <div className="packages-section">
                    <div className="packages-section-title">VENDOR COMPLIANCE & CERTIFICATIONS</div>
                    {[{name: 'Alcoa Metals Inc.', cert: 'AS9100 Rev D, ISO 9001:2015', contact: 'John Smith (408) 555-0198', barcode: 'VENDOR-ALCOA'}, {name: 'Premier Anodizing Corp', cert: 'AS9100 Rev D, ISO 9001:2015', contact: 'Sarah Lee (510) 555-0234', barcode: 'VENDOR-PREMIER'}].map((vendor, idx) => (
                      <div key={idx} style={{ marginBottom: '12px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '8px' }}>
                          <div style={{ fontWeight: '600' }}>{vendor.name}</div>
                          <div style={{ textAlign: 'center' }}>
                            <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG(vendor.barcode) }} />
                          </div>
                        </div>
                        <div style={{ fontSize: '0.85rem' }}>
                          <div><strong>Certifications:</strong> {vendor.cert}</div>
                          <div style={{ marginTop: '4px' }}><strong>Contact:</strong> {vendor.contact}</div>
                          <div style={{ marginTop: '4px' }}><strong>Audit Status:</strong> Current (Last audit: {idx === 0 ? 'Jan 2026' : 'Feb 2026'})</div>
                          <div style={{ marginTop: '4px' }}><strong>Performance Rating:</strong> Excellent (100% on-time delivery, zero defects)</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* FAI REPORT */}
                  <div className="packages-section">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <div className="packages-section-title" style={{ margin: 0 }}>FIRST ARTICLE INSPECTION (FAI) REPORT</div>
                      <div style={{ textAlign: 'center' }}>
                        <div dangerouslySetInnerHTML={{ __html: generateBarcodesSVG('FAI-REPORT-Q2026') }} />
                      </div>
                    </div>
                    <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '4px', marginBottom: '12px' }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px' }}>FAI Performed On: First 5 pieces (per AS9100)</div>
                      <ul className="packages-list">
                        <li>100% dimensional verification (CMM)</li>
                        <li>Surface finish verification (Profilometer)</li>
                        <li>Material certification review (PASS)</li>
                        <li>Coating thickness verification (Eddy Current) - PASS</li>
                        <li>Salt spray test (ASTM B117 - 500 hours) - PASS</li>
                        <li>FAI Status: APPROVED</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
