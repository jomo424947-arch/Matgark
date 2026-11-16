import crypto from "node:crypto"
import { withTransaction } from "@/server/db/client"
import { checkRateLimit } from "@/server/auth/rate-limit"
import type { OtpCode } from "@/types/domain"

function getSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    "matgarak-default-dev-secret-key-replace-in-production-32chars"
  )
}

export function generateOtpCode(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

export function hashOtpCode(phone: string, code: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(`${phone}:${code}`)
    .digest("hex")
}

export async function createAndSendOtp(
  phone: string
): Promise<{ ok: boolean; error?: string; devOtp?: string }> {
  // Rate limit: 5 requests per 10 minutes per phone
  const rate = checkRateLimit(`otp:req:${phone}`, 5, 10 * 60 * 1000)
  if (!rate.allowed) {
    const minutes = Math.ceil(rate.resetMs / 60000)
    return {
      ok: false,
      error: `تم تجاوز الحد الأقصى لطلب الأكواد. يرجى الانتظار ${minutes} دقيقة والمحاولة مرة أخرى.`,
    }
  }

  const code = generateOtpCode()
  const codeHash = hashOtpCode(phone, code)
  const expiresAt = Date.now() + 5 * 60 * 1000 // 5 minutes validity

  const record: OtpCode = {
    id: `otp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    phone,
    codeHash,
    attempts: 0,
    expiresAt,
    used: false,
  }

  await withTransaction((db) => {
    // Invalidate existing unused codes for this phone
    for (const item of db.otpCodes) {
      if (item.phone === phone && !item.used) {
        item.used = true
      }
    }
    db.otpCodes.push(record)
  })

  // Log in server console for transparency
  console.log(`[MATGARAK OTP] Phone: ${phone} | Code: ${code}`)

  // In non-production, expose devOtp for 1-click test button in UI
  const isDev = process.env.NODE_ENV !== "production"
  return {
    ok: true,
    devOtp: isDev ? code : undefined,
  }
}

export async function verifyOtpCode(
  phone: string,
  code: string
): Promise<{ ok: boolean; error?: string }> {
  // Verify rate limit: 10 verify attempts per 10 minutes per phone
  const rate = checkRateLimit(`otp:ver:${phone}`, 10, 10 * 60 * 1000)
  if (!rate.allowed) {
    return {
      ok: false,
      error: "تم تجاوز عدد محاولات إدخال الكود. يرجى طلب كود تأكيد جديد.",
    }
  }

  return withTransaction((db) => {
    const candidate = [...db.otpCodes]
      .reverse()
      .find((item) => item.phone === phone && !item.used)

    if (!candidate) {
      return {
        ok: false,
        error: "لم يتم العثور على كود تأكيد نشط لهذا الرقم. يرجى طلب كود جديد.",
      }
    }

    if (Date.now() > candidate.expiresAt) {
      candidate.used = true
      return {
        ok: false,
        error: "كود التأكيد منتهي الصلاحية. يرجى طلب كود جديد.",
      }
    }

    if (candidate.attempts >= 5) {
      candidate.used = true
      return {
        ok: false,
        error: "تم تجاوز الحد الأقصى للمحاولات الخاطئة. يرجى طلب كود جديد.",
      }
    }

    const expectedHash = candidate.codeHash
    const providedHash = hashOtpCode(phone, code)

    const expectedBuf = Buffer.from(expectedHash, "hex")
    const providedBuf = Buffer.from(providedHash, "hex")

    const matches =
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf)

    if (!matches) {
      candidate.attempts += 1
      const remainingAttempts = 5 - candidate.attempts
      return {
        ok: false,
        error:
          remainingAttempts > 0
            ? `كود التأكيد غير صحيح. متبقي ${remainingAttempts} محاولات.`
            : "كود التأكيد غير صحيح وتم قفل هذا الكود. يرجى طلب كود جديد.",
      }
    }

    // Success
    candidate.used = true
    return { ok: true }
  })
}
