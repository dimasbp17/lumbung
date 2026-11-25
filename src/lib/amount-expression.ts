import { formatNumber } from "@/lib/format"

/** Operators shown to the user. */
export type Operator = "+" | "−" | "×"

type Token = { kind: "number"; value: number } | { kind: "operator"; op: Operator }

/** Keeps every number (and the total) safe as a JS number (< 2^53). */
export const MAX_AMOUNT = 999_999_999_999_999

const OPERATOR_ALIASES: Record<string, Operator> = {
  "+": "+",
  "-": "−",
  "−": "−",
  "*": "×",
  "×": "×",
  x: "×",
  X: "×",
}

/**
 * Splits typed text into numbers and operators. Thousands dots and other
 * characters inside a number are ignored; a leading operator is dropped and
 * repeated operators keep the last one.
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  let digits = ""
  const flush = () => {
    if (!digits) return
    tokens.push({ kind: "number", value: Math.min(Number.parseInt(digits.slice(0, 15), 10), MAX_AMOUNT) })
    digits = ""
  }
  for (const ch of text) {
    if (ch >= "0" && ch <= "9") {
      digits += ch
      continue
    }
    const op = OPERATOR_ALIASES[ch]
    if (!op) continue
    flush()
    const last = tokens[tokens.length - 1]
    if (!last) continue
    if (last.kind === "operator") last.op = op
    else tokens.push({ kind: "operator", op })
  }
  flush()
  return tokens
}

export function hasOperator(tokens: Token[]): boolean {
  return tokens.some((t) => t.kind === "operator")
}

/** "25.000 + 21.000 +" — numbers with thousands dots, operators spaced; no trailing space. */
export function formatTokens(tokens: Token[]): string {
  return tokens.map((t) => (t.kind === "number" ? formatNumber(t.value) : t.op)).join(" ")
}

/** Evaluates with × before + and −. A trailing operator is ignored. */
export function evaluate(tokens: Token[]): number {
  let total = 0
  let term = 1
  let sign = 1
  let expectNumber = true
  let pendingMultiply = false
  for (const t of tokens) {
    if (t.kind === "number") {
      term = pendingMultiply ? term * t.value : t.value
      pendingMultiply = false
      expectNumber = false
    } else if (t.op === "×") {
      pendingMultiply = true
    } else {
      if (!expectNumber) total += sign * term
      sign = t.op === "+" ? 1 : -1
      term = 0
      expectNumber = true
      pendingMultiply = false
    }
  }
  if (!expectNumber) total += sign * term
  return total
}
