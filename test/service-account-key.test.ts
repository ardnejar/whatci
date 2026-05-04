import { describe, expect, it } from 'vitest'

/**
  Diagnostic tests for GOOGLE_SERVICE_ACCOUNT_KEY PEM parsing.
  Tests three formats the runtime may deliver the value in:
    A. Quoted with literal \\n sequences (as written in .dev.vars, quotes NOT stripped)
    B. Unquoted with literal \\n sequences (quotes stripped, \\n kept — some dotenv parsers)
    C. Unquoted with real newlines (quotes stripped, \\n processed — standard dotenv for double-quoted values)
**/

const BASE64_BODY =
  'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3r8xNBIlnwlrf' +
  '+Z2dvGhVBuHoJvrLuQ6fJUFDxcQ/LeRFJCd2hWCcszkId3mbmo+mXTFY3eZldMmE' +
  'EMT9aWBJOjOOpz+r/f3PwNKajArj6jozatK9SobRVJBuEL5FfK2mRs7lGoE0YEN4' +
  'BRF9zdQEYrNBzFU/9POzHoPJFFh2VLCvNlrQ+MLgIhOvmS2h+UzgBBMn/FXVoUf2' +
  'Qwcd6hE+7FlCAd4dY43IAtAAjb/0yWhtg37U2jRWUjcCBEdO5pmBAj1WEYkjLgoF' +
  'IQ8Awdbek4PvUh/rBIM9aSQsF6lhVJT8PPiUW623fBlhdoZTLquBQ+fmDi3NP3+N' +
  'YIiS4cQTAgMBAAECggEAEzj1eKsx30bf5bJ57nOKDjkt051IqkslHuhyKlp8OAm1' +
  'wA/m2qizPJLQ3smfU0uwdBN/7NyD6412N+OICeZI1OufUPLAX1+xe61NHNlCRn77' +
  'ij1H7SvrFzrx8Q1q1rC+fLkfllWDZ0IaWBQHtDz2+WKEKdhCpPJzElqY0KaCv2yI' +
  'ptnQ1riHeEe9Xzzm3Ri8h7gcobllHRq6kjRrvSkFWRvI0md1FOJCkTM9sUG97BWB' +
  'nvsvDYnir90A6z2v5qv9FxbHITnpwNcZ+5/xg/uFCdKJRbQrLOjuT9eKKLiyODXz' +
  'iBLk/HMw/dsJOMpk2/U3YICiOjD+na+FlkxYJsXlaQKBgQDmiEi1ltylCwlfjtFJ' +
  'lJqxQJmMAHj/0gkRvcFjL72OVgOXs+5RTzCSAHvP4A1ZQxGZ3Skdipx2RyVRdrfq' +
  'Bukb1DHlkM9KKsjwMFyDpbt6LTCoh5HyvfaEmcmFaD+iGoEsB6Ldc4EZHZdGPULo' +
  '+ldqi/MlGm9dRjd82xfI0ce//QKBgQDL+qqEuFxDB435AmYj9LLxdRz/2cKcbmFQ' +
  '7KI3Yxctwy3jVCjYdEp4W/iQsz36QPZj4MMq7XYcKD7lddmdx/Nli+velSFi/Mrf' +
  'eX5wdUbZg3pB6IY5jZpSq53z72WyzzllhT11Xy7cR4ZfXCgObywCsfPaHmcuCw0d' +
  'N7fBN9YpTwKBgDOTLeEiXT63V2N/iicSDgG12CRQPsHM9aZ4c3mDRr8/UxJveNPM' +
  'CavAW/LHx3S+4oMvzXEEf7iediThkIfU//Xv5THc0eNf6xCBYVE6lNTio04w9l/+' +
  'S9aiqUklZ4cWsuts0e0FWE6MJjnansuMpl357W3RmjSd7vAJ/Co7dJrpAoGAFxaG' +
  'WoNrngKq5TaKTSOTZZU19Re22XH8/eXq7o3+v6VJ+mM6RFXVYA448lf3ee4EdYWp' +
  'UaCTL9i2Vc6jFSLev+24gvcqUkP+ypC76Qq9PD2PhwpEtxr6DsVyGXxNbJHcE0uj' +
  'izd83F4ULZMGzatztdJioZuzXhjOITJ/UBV73i0CgYEAyvth09mXbg/HajFmWupb' +
  'X70FKTxu1teE2CYjyekSEMcy2Bv4Pl6dSs3/nzUPo/ThUdrG4eWY20YJMAq0U6eE' +
  'n6NiV7F28vCPTvCHlQpvPmSBJ5eTaGghg9Sq/9bKgVl0v9QCUd9wHtGRAcBgLMCo' +
  'DzGalHbuErAAuw3wd6Ghkg4='

// Format A: as written in .dev.vars — surrounding quotes present, literal \n sequences
const FORMAT_A_QUOTED_ESCAPED =
  '"-----BEGIN PRIVATE KEY-----\\n' + BASE64_BODY + '\\n-----END PRIVATE KEY-----\\n"'

// Format B: quotes stripped by dotenv, literal \n sequences remain
const FORMAT_B_UNQUOTED_ESCAPED = '-----BEGIN PRIVATE KEY-----\\n' + BASE64_BODY + '\\n-----END PRIVATE KEY-----\\n'

// Format C: quotes stripped AND \n processed into real newlines (standard dotenv double-quote behaviour)
const FORMAT_C_REAL_NEWLINES = '-----BEGIN PRIVATE KEY-----\n' + BASE64_BODY + '\n-----END PRIVATE KEY-----\n'

function parsePemBody(raw: string): string {
  return raw
    .replace(/^["']|["']$/g, '')
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('-----'))
    .join('')
}

describe('GOOGLE_SERVICE_ACCOUNT_KEY parsing', () => {
  it('format A: quoted + escaped \\n — strips quotes and extracts base64 body', () => {
    const pem_body = parsePemBody(FORMAT_A_QUOTED_ESCAPED)
    expect(pem_body.length).toBeGreaterThan(100)
    expect(pem_body).not.toContain('-----')
    expect(pem_body).toBe(BASE64_BODY)
  })

  it('format B: unquoted + escaped \\n — extracts base64 body', () => {
    const pem_body = parsePemBody(FORMAT_B_UNQUOTED_ESCAPED)
    expect(pem_body.length).toBeGreaterThan(100)
    expect(pem_body).toBe(BASE64_BODY)
  })

  it('format C: unquoted + real newlines (wrangler dotenv processing) — extracts base64 body', () => {
    const pem_body = parsePemBody(FORMAT_C_REAL_NEWLINES)
    expect(pem_body.length).toBeGreaterThan(100)
    expect(pem_body).toBe(BASE64_BODY)
  })

  it('can be imported as a PKCS8 signing key by the Web Crypto API', async () => {
    const pem_body = parsePemBody(FORMAT_C_REAL_NEWLINES)
    const der = Uint8Array.from(atob(pem_body), (c) => c.charCodeAt(0)).buffer as ArrayBuffer
    const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
    expect(key.type).toBe('private')
  })
})
