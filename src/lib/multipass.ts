// Server-side only — balance fetcher for multipass.co.il

import { parse } from 'node-html-parser';

const BALANCE_URL = 'https://multipass.co.il/GetBalance';

export async function fetchCardBalance(cardNumber: string): Promise<number | null> {
  try {
    // Step 1: GET the page to obtain any session cookies / hidden fields
    const getRes = await fetch(BALANCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!getRes.ok) return null;

    const html = await getRes.text();
    const root = parse(html);

    // Extract hidden form fields (CSRF tokens, viewstate, etc.)
    const formFields: Record<string, string> = {};
    root.querySelectorAll('input[type="hidden"]').forEach((el) => {
      const name = el.getAttribute('name');
      const value = el.getAttribute('value') || '';
      if (name) formFields[name] = value;
    });

    // Find the card number input name
    const cardInput =
      root.querySelector('input[type="text"]') ||
      root.querySelector('input[name*="card"]') ||
      root.querySelector('input[name*="Card"]') ||
      root.querySelector('input[id*="card"]');

    const cardInputName = cardInput?.getAttribute('name') || 'cardNumber';

    // Step 2: POST with the card number
    const cookies = getRes.headers.get('set-cookie') || '';
    const formBody = new URLSearchParams({
      ...formFields,
      [cardInputName]: cardNumber,
    });

    const postRes = await fetch(BALANCE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Cookie: cookies,
        Referer: BALANCE_URL,
        Origin: 'https://multipass.co.il',
      },
      body: formBody.toString(),
    });

    if (!postRes.ok) return null;

    const resultHtml = await postRes.text();
    const resultRoot = parse(resultHtml);

    // Try to find a balance amount in the response
    // Look for patterns like "₪123.45" or "123.45 ₪" or elements with class containing "balance"
    const bodyText = resultRoot.text;

    // Match numbers near ₪ symbol
    const shekelMatch = bodyText.match(/₪\s*([\d,]+\.?\d*)/);
    if (shekelMatch) {
      return parseFloat(shekelMatch[1].replace(',', ''));
    }

    // Try reversed format
    const shekelMatch2 = bodyText.match(/([\d,]+\.?\d*)\s*₪/);
    if (shekelMatch2) {
      return parseFloat(shekelMatch2[1].replace(',', ''));
    }

    // Look for balance in elements
    const balanceEl =
      resultRoot.querySelector('[class*="balance"]') ||
      resultRoot.querySelector('[class*="amount"]') ||
      resultRoot.querySelector('[id*="balance"]') ||
      resultRoot.querySelector('[id*="amount"]');

    if (balanceEl) {
      const num = parseFloat(balanceEl.text.replace(/[^\d.]/g, ''));
      if (!isNaN(num)) return num;
    }

    return null;
  } catch {
    return null;
  }
}
