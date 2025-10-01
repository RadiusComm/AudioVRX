// src/pdf-setup.ts
import { GlobalWorkerOptions } from 'pdfjs-dist';

// Set static path (Netlify will serve this from /public)
GlobalWorkerOptions.workerSrc = '/pdf.worker.js';
