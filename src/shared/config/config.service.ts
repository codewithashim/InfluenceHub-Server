import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

function loadDotEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const raw = fs.readFileSync(filePath, { encoding: 'utf8' });
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      result[key] = val;
    }
  } catch {
    // ignore missing .env
  }
  return result;
}

@Injectable()
export class ConfigService {
  private readonly store: Record<string, string> = {};

  constructor() {
    // Load from process.env first
    for (const k of Object.keys(process.env)) {
      const v = process.env[k];
      if (v !== undefined) this.store[k] = v;
    }

    // Then load .env file at project root if present
    const envPath = path.resolve(process.cwd(), '.env');
    const fileVars = loadDotEnvFile(envPath);
    for (const k of Object.keys(fileVars)) {
      if (!(k in this.store)) this.store[k] = fileVars[k];
    }
  }

  get(key: string, fallback?: string): string | undefined {
    const v = this.store[key];
    if (v !== undefined) return v;
    return fallback;
  }
}
