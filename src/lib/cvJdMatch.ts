import type { DocumentInput } from '../types'

export type CvPresetId = 'khanh_my' | 'hai_dang' | 'gia_khanh'
export type JdPresetId =
  | 'whitestar_livestream'
  | 'bd_specialist'
  | 'belending_ba'
  | 'cybersecurity'
  | 'big_data_de'

const CV_RULES: { id: CvPresetId; patterns: RegExp[] }[] = [
  {
    id: 'gia_khanh',
    patterns: [
      /huynh\s*ngo\s*gia\s*khanh/i,
      /cv_huynh|cv_hu.?nh/i,
      /gia\s*khanh/i,
      /huynh.*khanh/i,
      /obs\s*studio/i,
      /livestream\s*operation/i,
      /whitestar\s*beauty/i,
      /likapz/i,
      /vibula/i,
      /huynhkhanh1218/i,
    ],
  },
  {
    id: 'hai_dang',
    patterns: [
      /nguyen\s*tran\s*hai\s*dang/i,
      /cv_dang/i,
      /pyspark|databricks|delta\s*live\s*tables/i,
      /langgraph|data\s*engineer/i,
      /lease\s*control\s*tower/i,
      /ai\s*cv\s*scorer/i,
    ],
  },
  {
    id: 'khanh_my',
    patterns: [
      /tran\s*khanh\s*my/i,
      /trankhanhmy/i,
      /cv_tran/i,
      /international\s*business/i,
      /prime\s*real\s*estate/i,
      /sale\s*simulation/i,
      /henmet\s*charity/i,
    ],
  },
]

const JD_RULES: { id: JdPresetId; patterns: RegExp[] }[] = [
  {
    id: 'whitestar_livestream',
    patterns: [
      /whitestar\s*beauty|\bwhitestar\b/i,
      /vận\s*hành\s*livestream/i,
      /van\s*hanh\s*livestream/i,
      /jd_whitestar/i,
      /seller\s*center/i,
      /livestream\s*operation/i,
      /obs\s*studio|\bobs\b/i,
      /tiktok\s*shop.*live|shopee\s*live|tiktok\s*live/i,
      /tro\s*live|kich\s*ban\s*live/i,
      /live\s*commerce|livestream\s*kpi/i,
    ],
  },
  {
    id: 'bd_specialist',
    patterns: [
      /business\s*development\s*specialist/i,
      /sales\s*specialist/i,
      /flavour|flavor/i,
      /essential\s*flavour|essential\s*flavor/i,
      /essential.*1989|future\s*memories/i,
      /food\s*&?\s*beverage|f\s*&\s*b\s*industry/i,
      /jd_business\s*development/i,
      /b2b\s*sales|sales\s*hunter|hunter\s*pipeline/i,
      /manufacturing\s*partner|flavour\s*industry/i,
    ],
  },
  {
    id: 'belending_ba',
    patterns: [
      /be\s*group/i,
      /belending|be\s*lending/i,
      /lending\s*vertical|vertical\s*lending/i,
      /business\s*analyst.*(?:lending|fintech|loan)/i,
      /(?:lending|fintech).*business\s*analyst/i,
      /disbursement|approval\s*rate|credit\s*score/i,
      /jd_belending/i,
      /consumer\s*lending|lending\s*funnel|portfolio\s*metrics/i,
      /cho\s*vay\s*tieu\s*dung|fintech.*lending/i,
    ],
  },
  {
    id: 'cybersecurity',
    patterns: [
      /an\s*ninh\s*mạng|an\s*ninh\s*mang|an\s*toàn\s*thông\s*tin|antoan\s*thong\s*tin/i,
      /\batt\b|an\s*ninh\s*ung\s*dung/i,
      /vina\s*aspire/i,
      /owasp|nessus|burp\s*suite|pentest|penetration\s*test/i,
      /chuyên\s*viên.*an\s*ninh|chuyen\s*vien.*an\s*ninh/i,
      /cyber\s*security|information\s*security|application\s*security/i,
      /network\s*security|\bceh\b|ecsa\b/i,
      /jd_chuy|jd_an\s*ninh/i,
      /java.*security|\.net.*security/i,
    ],
  },
  {
    id: 'big_data_de',
    patterns: [
      /big\s*data.*cloud\s*data\s*engineer/i,
      /cloud\s*data\s*engineer/i,
      /jd_big\s*data/i,
      /data\s*lakehouse|data\s*lake|datalake/i,
      /(?:etl|data)\s*pipeline/i,
      /aws\s*glue|amazon\s*emr/i,
      /azure\s*databricks|\bdatabricks\b/i,
      /azure\s*synapse|synapse\s*analytics/i,
      /azure\s*stack.*data|data.*azure\s*stack/i,
      /big\s*data\s*technolog/i,
      /(?:flink|spark).*databricks|databricks.*(?:flink|spark)/i,
      /(?:apache\s*)?spark.*(?:hadoop|mapreduce)|hadoop.*spark/i,
      /data\s*engineer.*(?:azure|cloud|spark)/i,
    ],
  },
]

/** Bỏ dấu tiếng Việt để match filename PDF (VD: HUỲNH → huynh) */
function normalizeForMatch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
}

function normalizeHaystack(input: DocumentInput): string {
  const parts: string[] = []
  if (input.fileName) parts.push(input.fileName)
  if (input.textContent) parts.push(input.textContent.slice(0, 12000))
  return normalizeForMatch(parts.join('\n'))
}

function matchRules<T extends string>(
  haystack: string,
  rules: { id: T; patterns: RegExp[] }[],
): T | null {
  for (const rule of rules) {
    if (rule.patterns.some(p => p.test(haystack))) return rule.id
  }
  return null
}

export function detectCvPreset(input: DocumentInput): CvPresetId | null {
  return matchRules(normalizeHaystack(input), CV_RULES)
}

export function detectJdPreset(input: DocumentInput): JdPresetId | null {
  return matchRules(normalizeHaystack(input), JD_RULES)
}

/** Chỉ match tên/file CV — tránh false positive khi JD có keyword kỹ thuật (PySpark, Whitestar…) */
const CV_PERSON_RULES: { id: CvPresetId; patterns: RegExp[] }[] = [
  {
    id: 'gia_khanh',
    patterns: [
      /huynh\s*ngo\s*gia\s*khanh/i,
      /cv_huynh|cv_hu.?nh/i,
      /huynhkhanh1218/i,
    ],
  },
  {
    id: 'hai_dang',
    patterns: [/nguyen\s*tran\s*hai\s*dang/i, /cv_dang/i],
  },
  {
    id: 'khanh_my',
    patterns: [/tran\s*khanh\s*my/i, /trankhanhmy/i, /cv_tran/i],
  },
]

export function detectCvPerson(input: DocumentInput): CvPresetId | null {
  const haystack = normalizeHaystack(input)
  const fileName = normalizeForMatch(input.fileName ?? '')
  if (/\b(?:cv|resume)[\s_\-]|^cv[\s_\-]/i.test(fileName)) {
    return matchRules(haystack, CV_PERSON_RULES) ?? detectCvPreset(input)
  }
  return matchRules(haystack, CV_PERSON_RULES)
}

export function hasCvFileName(input: DocumentInput): boolean {
  const fileName = normalizeForMatch(input.fileName ?? '')
  return /\b(?:cv|resume)[\s_\-]|^cv[\s_\-]/i.test(fileName)
}

export function hasJdFileName(input: DocumentInput): boolean {
  const fileName = normalizeForMatch(input.fileName ?? '')
  return /\bjd[\s_\-]|^jd[\s_\-]/i.test(fileName)
}

export interface ScanDocumentValidation {
  ok: boolean
  errorTitle?: string
  errorMessage?: string
}

function jdPanelHasContent(input: DocumentInput): boolean {
  return !!(input.fileName?.trim() || input.textContent?.trim())
}

/** Rào CV nhầm ô JD (và JD nhầm ô CV) trước khi chạy mock demo */
export function validateScanDocuments(
  cvInput: DocumentInput,
  jdInput: DocumentInput,
): ScanDocumentValidation {
  if (hasJdFileName(cvInput) && !hasCvFileName(cvInput)) {
    return {
      ok: false,
      errorTitle: 'Sai vị trí tài liệu',
      errorMessage:
        'Ô CV đang chứa file JD. Vui lòng đặt CV (CV_*.pdf) bên trái và JD (JD_* hoặc dán mô tả công việc) bên phải.',
    }
  }

  if (!jdPanelHasContent(jdInput)) {
    return {
      ok: false,
      errorTitle: 'Thiếu JD',
      errorMessage:
        'Vui lòng tải file JD hoặc dán nội dung mô tả công việc vào ô bên phải trước khi phân tích.',
    }
  }

  if (hasCvFileName(jdInput)) {
    return {
      ok: false,
      errorTitle: 'JD không hợp lệ',
      errorMessage:
        'Ô JD đang chứa file CV. Demo yêu cầu: CV bên trái, JD bên phải — tải file JD_* hoặc dán nội dung mô tả công việc.',
    }
  }

  const cvPersonInJd = detectCvPerson(jdInput)
  if (cvPersonInJd) {
    return {
      ok: false,
      errorTitle: 'Phát hiện CV trong ô JD',
      errorMessage:
        'Nội dung bên JD giống hồ sơ ứng viên (CV), không phải mô tả công việc. Hãy dán JD hoặc tải file JD_* từ folder CV&JD.',
    }
  }

  const cvPersonLeft = detectCvPerson(cvInput)
  const cvPersonRight = detectCvPerson(jdInput)
  if (cvPersonLeft && cvPersonRight) {
    return {
      ok: false,
      errorTitle: 'Trùng loại tài liệu',
      errorMessage:
        'Cả hai ô đều được nhận diện là CV demo. Chỉ đặt một CV bên trái; bên phải cần JD tương ứng.',
    }
  }

  if (hasJdFileName(jdInput) && detectJdPreset(jdInput) === null) {
    return {
      ok: false,
      errorTitle: 'Không nhận diện JD',
      errorMessage:
        'File JD chưa khớp bộ demo. Dùng file JD_* trong folder CV&JD hoặc dán đủ nội dung mô tả công việc.',
    }
  }

  if (detectJdPreset(jdInput) === null) {
    return {
      ok: false,
      errorTitle: 'Không nhận diện JD',
      errorMessage:
        'Nội dung JD chưa khớp bộ demo. Dán đủ mô tả công việc (tiêu đề, yêu cầu, kỹ năng) hoặc dùng file JD_* tương ứng.',
    }
  }

  return { ok: true }
}

export type CvJdPairKey = `${CvPresetId}:${JdPresetId}`

export function pairKey(cv: CvPresetId, jd: JdPresetId): CvJdPairKey {
  return `${cv}:${jd}`
}
