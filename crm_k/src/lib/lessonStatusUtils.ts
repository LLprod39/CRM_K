import type { LessonStatus } from '@/domain/entities/Lesson';

export type { LessonStatus } from '@/domain/entities/Lesson';

export interface LessonStatusInfo {
  status: LessonStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}

type LessonStatusSource = {
  isCompleted: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  date?: Date | string | null;
};

type NormalizedLessonStatusSource = {
  isCompleted: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  date?: Date;
};

const ALL_STATUSES: LessonStatus[] = ['scheduled', 'prepaid', 'completed', 'debt', 'unpaid', 'cancelled'];

const STATUS_META: Record<LessonStatus, Omit<LessonStatusInfo, 'status'>> = {
  scheduled: {
    label: 'Запланировано',
    description: 'Занятие запланировано',
    color: 'text-sky-700',
    bgColor: 'bg-sky-100',
    icon: '??'
  },
  prepaid: {
    label: 'Предоплачено',
    description: 'Занятие предоплачено',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '??'
  },
  completed: {
    label: 'Проведено',
    description: 'Занятие проведено и оплачено',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: '??'
  },
  debt: {
    label: 'Задолженность',
    description: 'Занятие проведено, но не оплачено',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: '??'
  },
  unpaid: {
    label: 'Не оплачено',
    description: 'Занятие прошло, но не оплачено',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '?'
  },
  cancelled: {
    label: 'Отменено',
    description: 'Занятие отменено',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    icon: '?'
  }
};

const NEXT_STATUS_MAP: Record<LessonStatus, LessonStatus[]> = {
  scheduled: ['prepaid', 'completed', 'debt', 'cancelled'],
  prepaid: ['completed', 'cancelled'],
  completed: [],
  debt: ['completed'],
  unpaid: ['completed', 'debt'],
  cancelled: []
};

function isLessonStatusSource(value: unknown): value is LessonStatusSource {
  return (
    typeof value === 'object' &&
    value !== null &&
    'isCompleted' in value &&
    'isPaid' in value &&
    'isCancelled' in value
  );
}

function isLessonStatus(value: unknown): value is LessonStatus {
  return typeof value === 'string' && (ALL_STATUSES as string[]).includes(value);
}

function toDate(value?: Date | string | null): Date | undefined {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeLessonStatusInput(
  lessonOrIsCompleted: LessonStatusSource | boolean,
  isPaid?: boolean,
  isCancelled?: boolean,
  lessonDate?: Date | string | null
): NormalizedLessonStatusSource {
  if (isLessonStatusSource(lessonOrIsCompleted)) {
    return {
      isCompleted: Boolean(lessonOrIsCompleted.isCompleted),
      isPaid: Boolean(lessonOrIsCompleted.isPaid),
      isCancelled: Boolean(lessonOrIsCompleted.isCancelled),
      date: toDate(lessonOrIsCompleted.date)
    };
  }

  return {
    isCompleted: Boolean(lessonOrIsCompleted),
    isPaid: Boolean(isPaid),
    isCancelled: Boolean(isCancelled),
    date: toDate(lessonDate)
  };
}

function determineStatus(source: NormalizedLessonStatusSource): LessonStatus {
  if (source.isCancelled) {
    return 'cancelled';
  }

  if (source.isCompleted) {
    return source.isPaid ? 'completed' : 'debt';
  }

  if (source.isPaid) {
    return 'prepaid';
  }

  if (source.date && Date.now() > source.date.getTime()) {
    return 'unpaid';
  }

  return 'scheduled';
}

export function getLessonStatusInfo(lesson: LessonStatusSource): LessonStatusInfo;
export function getLessonStatusInfo(
  isCompleted: boolean,
  isPaid: boolean,
  isCancelled: boolean,
  lessonDate?: Date | string | null
): LessonStatusInfo;
export function getLessonStatusInfo(
  lessonOrIsCompleted: LessonStatusSource | boolean,
  isPaid?: boolean,
  isCancelled?: boolean,
  lessonDate?: Date | string | null
): LessonStatusInfo {
  const normalized = normalizeLessonStatusInput(lessonOrIsCompleted, isPaid, isCancelled, lessonDate);
  const status = determineStatus(normalized);
  const meta = STATUS_META[status];

  return {
    status,
    ...meta
  };
}

export function getAllLessonStatuses(): LessonStatusInfo[] {
  return ALL_STATUSES.map((status) => ({
    status,
    ...STATUS_META[status]
  }));
}

export function canCancelLesson(lessonDate: Date, hoursBeforeLesson: number = 5): boolean {
  const now = new Date();
  const timeDiff = lessonDate.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  return hoursDiff >= hoursBeforeLesson;
}

export function getCancellationInfo(lessonDate: Date, cost: number) {
  const canCancel = canCancelLesson(lessonDate);

  return {
    canCancel,
    refundType: canCancel ? 'prepaid' : 'income',
    refundDescription: canCancel
      ? 'Возврат производится в предоплаченный баланс'
      : 'Возврат оформляется как доход компании',
    hoursBeforeLesson: Math.floor((lessonDate.getTime() - new Date().getTime()) / (1000 * 60 * 60))
  };
}

export function getLessonStatusStats(lessons: Array<{
  isCompleted: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  date: Date;
  cost: number;
}>) {
  const stats = {
    scheduled: 0,
    prepaid: 0,
    completed: 0,
    debt: 0,
    unpaid: 0,
    cancelled: 0,
    totalRevenue: 0,
    totalDebt: 0,
    totalPrepaid: 0
  };

  lessons.forEach((lesson) => {
    const status = getLessonStatus({
      isCompleted: lesson.isCompleted,
      isPaid: lesson.isPaid,
      isCancelled: lesson.isCancelled,
      date: lesson.date
    });

    stats[status] += 1;

    if (status === 'completed') {
      stats.totalRevenue += lesson.cost;
    } else if (status === 'debt' || status === 'unpaid') {
      stats.totalDebt += lesson.cost;
    } else if (status === 'prepaid') {
      stats.totalPrepaid += lesson.cost;
    }
  });

  return stats;
}

export function getNextPossibleStatuses(
  isCompleted: boolean,
  isPaid: boolean,
  isCancelled: boolean,
  lessonDate?: Date | string | null
): LessonStatus[] {
  const status = getLessonStatus(isCompleted, isPaid, isCancelled, lessonDate);
  return NEXT_STATUS_MAP[status] ?? [];
}

export function isValidStatusTransition(
  fromStatus: LessonStatus,
  toStatus: LessonStatus
): boolean {
  return NEXT_STATUS_MAP[fromStatus]?.includes(toStatus) ?? false;
}

export function getLessonStatus(lesson: LessonStatusSource): LessonStatus;
export function getLessonStatus(
  isCompleted: boolean,
  isPaid: boolean,
  isCancelled: boolean,
  lessonDate?: Date | string | null
): LessonStatus;
export function getLessonStatus(
  lessonOrIsCompleted: LessonStatusSource | boolean,
  isPaid?: boolean,
  isCancelled?: boolean,
  lessonDate?: Date | string | null
): LessonStatus {
  const normalized = normalizeLessonStatusInput(lessonOrIsCompleted, isPaid, isCancelled, lessonDate);
  return determineStatus(normalized);
}

export function getLessonStatusText(status: LessonStatus): string;
export function getLessonStatusText(lesson: LessonStatusSource): string;
export function getLessonStatusText(
  lessonOrStatus: LessonStatus | LessonStatusSource | boolean,
  isPaid?: boolean,
  isCancelled?: boolean,
  lessonDate?: Date | string | null
): string {
  if (isLessonStatus(lessonOrStatus)) {
    return STATUS_META[lessonOrStatus]?.label ?? 'Неизвестно';
  }

  if (typeof lessonOrStatus === 'string') {
    return 'Неизвестно';
  }

  const status = getLessonStatus(lessonOrStatus as LessonStatusSource | boolean, isPaid, isCancelled, lessonDate);
  return STATUS_META[status]?.label ?? 'Неизвестно';
}

export function getCombinedLessonStatus(lesson: LessonStatusSource): string;
export function getCombinedLessonStatus(
  isCompleted: boolean,
  isPaid: boolean,
  isCancelled: boolean
): string;
export function getCombinedLessonStatus(
  lessonOrIsCompleted: LessonStatusSource | boolean,
  isPaid?: boolean,
  isCancelled?: boolean
): string {
  const normalized = normalizeLessonStatusInput(lessonOrIsCompleted, isPaid, isCancelled);
  const parts: string[] = [];

  if (normalized.isCompleted) {
    parts.push(STATUS_META.completed.label);
  }

  if (normalized.isPaid) {
    parts.push('Оплачено');
  }

  if (normalized.isCancelled) {
    parts.push(STATUS_META.cancelled.label);
  }

  return parts.length ? parts.join(' + ') : STATUS_META.scheduled.label;
}

export function getStatusAfterCompletion(lesson: {
  isCompleted: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  date: Date;
}): {
  isCompleted: boolean;
  isPaid: boolean;
  newStatus: LessonStatus;
} {
  const normalized = normalizeLessonStatusInput(lesson);

  if (normalized.isCompleted || normalized.isCancelled) {
    return {
      isCompleted: normalized.isCompleted,
      isPaid: normalized.isPaid,
      newStatus: determineStatus(normalized)
    };
  }

  const updated = {
    ...normalized,
    isCompleted: true
  };

  return {
    isCompleted: true,
    isPaid: updated.isPaid,
    newStatus: determineStatus(updated)
  };
}

