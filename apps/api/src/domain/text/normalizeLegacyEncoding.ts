const mojibakePattern = /(?:Ã.|Â.|â..)/;

/** Corrige UTF-8 que chegou como Latin-1 sem modificar texto já válido. */
export function normalizeLegacyEncoding(value: string): string {
    if (!mojibakePattern.test(value)) return value;
    const normalized = Buffer.from(value, 'latin1').toString('utf8');
    return normalized.includes('�') ? value : normalized;
}
