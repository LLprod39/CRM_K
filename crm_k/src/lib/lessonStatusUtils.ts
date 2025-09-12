/**
 * Утилиты для работы со статусами занятий
 */

export type LessonStatus = 
  | 'scheduled'      // Запланировано
  | 'prepaid'        // Предоплачено
  | 'cancelled'      // Отменено
  | 'completed'      // Проведено
  | 'paid'           // Оплачено
  | 'debt'           // Задолженность
  | 'unpaid';        // Не оплачено

export interface LessonStatusInfo {
  status: LessonStatus;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}

/**
 * Получить информацию о статусе занятия
 */
export function getLessonStatusInfo(
  isCompleted: boolean,
  isPaid: boolean,
  isCancelled: boolean,
  lessonDate?: Date
): LessonStatusInfo {
  // Отменено
  if (isCancelled) {
    return {
      status: 'cancelled',
      label: 'Отменено',
      description: 'Занятие отменено',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: '❌'
    };
  }

  // Проведено
  if (isCompleted) {
    if (isPaid) {
      return {
        status: 'paid',
        label: 'Оплачено',
        description: 'Занятие проведено и оплачено',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: '✅'
      };
    } else {
      return {
        status: 'debt',
        label: 'Задолженность',
        description: 'Занятие проведено, но не оплачено',
        color: 'text-orange-700',
        bgColor: 'bg-orange-100',
        icon: '⚠️'
      };
    }
  }

  // Не проведено
  if (isPaid) {
    return {
      status: 'prepaid',
      label: 'Предоплачено',
      description: 'Занятие предоплачено',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: '💳'
    };
  }

  // Проверяем, прошло ли занятие
  if (lessonDate && new Date() > lessonDate) {
    return {
      status: 'unpaid',
      label: 'Не оплачено',
      description: 'Занятие прошло, но не оплачено',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      icon: '⏰'
    };
  }

  // Запланировано
  return {
    status: 'scheduled',
    label: 'Запланировано',
    description: 'Занятие запланировано',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '📅'
  };
}

/**
 * Получить все возможные статусы
 */
export function getAllLessonStatuses(): LessonStatusInfo[] {
  return [
    {
      status: 'scheduled',
      label: 'Запланировано',
      description: 'Занятие запланировано',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      icon: '📅'
    },
    {
      status: 'prepaid',
      label: 'Предоплачено',
      description: 'Занятие предоплачено',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: '💳'
    },
    {
      status: 'completed',
      label: 'Проведено',
      description: 'Занятие проведено',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-100',
      icon: '🎯'
    },
    {
      status: 'paid',
      label: 'Оплачено',
      description: 'Занятие проведено и оплачено',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: '✅'
    },
    {
      status: 'debt',
      label: 'Задолженность',
      description: 'Занятие проведено, но не оплачено',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      icon: '⚠️'
    },
    {
      status: 'unpaid',
      label: 'Не оплачено',
      description: 'Занятие прошло, но не оплачено',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      icon: '⏰'
    },
    {
      status: 'cancelled',
      label: 'Отменено',
      description: 'Занятие отменено',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      icon: '❌'
    }
  ];
}

/**
 * Проверить, можно ли отменить занятие
 */
export function canCancelLesson(lessonDate: Date, hoursBeforeLesson: number = 5): boolean {
  const now = new Date();
  const timeDiff = lessonDate.getTime() - now.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  return hoursDiff >= hoursBeforeLesson;
}

/**
 * Получить информацию об отмене занятия
 */
export function getCancellationInfo(lessonDate: Date, cost: number) {
  const canCancel = canCancelLesson(lessonDate);
  
  return {
    canCancel,
    refundType: canCancel ? 'prepaid' : 'income',
    refundDescription: canCancel 
      ? 'Сумма вернется в предоплату ученика'
      : 'Сумма засчитывается как доход',
    hoursBeforeLesson: Math.floor((lessonDate.getTime() - new Date().getTime()) / (1000 * 60 * 60))
  };
}

/**
 * Получить статистику по статусам занятий
 */
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
    paid: 0,
    debt: 0,
    unpaid: 0,
    cancelled: 0,
    totalRevenue: 0,
    totalDebt: 0,
    totalPrepaid: 0
  };

  lessons.forEach(lesson => {
    const statusInfo = getLessonStatusInfo(
      lesson.isCompleted,
      lesson.isPaid,
      lesson.isCancelled,
      lesson.date
    );

    stats[statusInfo.status]++;

    // Подсчет финансовых показателей
    if (statusInfo.status === 'paid') {
      stats.totalRevenue += lesson.cost;
    } else if (statusInfo.status === 'debt' || statusInfo.status === 'unpaid') {
      stats.totalDebt += lesson.cost;
    } else if (statusInfo.status === 'prepaid') {
      stats.totalPrepaid += lesson.cost;
    }
  });

  return stats;
}

/**
 * Получить следующий возможный статус для занятия
 */
export function getNextPossibleStatuses(
  isCompleted: boolean,
  isPaid: boolean,
  isCancelled: boolean,
  lessonDate?: Date
): LessonStatus[] {
  const currentStatus = getLessonStatusInfo(isCompleted, isPaid, isCancelled, lessonDate);
  
  switch (currentStatus.status) {
    case 'scheduled':
      return ['prepaid', 'completed', 'cancelled'];
    case 'prepaid':
      return ['completed', 'cancelled'];
    case 'completed':
      return ['paid', 'debt'];
    case 'debt':
      return ['paid'];
    case 'unpaid':
      return ['paid', 'debt'];
    case 'paid':
      return []; // Финальный статус
    case 'cancelled':
      return []; // Финальный статус
    default:
      return [];
  }
}

/**
 * Проверить валидность перехода статуса
 */
export function isValidStatusTransition(
  fromStatus: LessonStatus,
  toStatus: LessonStatus
): boolean {
  const validTransitions: Record<LessonStatus, LessonStatus[]> = {
    scheduled: ['prepaid', 'completed', 'cancelled'],
    prepaid: ['completed', 'cancelled'],
    completed: ['paid', 'debt'],
    debt: ['paid'],
    unpaid: ['paid', 'debt'],
    paid: [],
    cancelled: []
  };

  return validTransitions[fromStatus]?.includes(toStatus) || false;
}

/**
 * Получить статус занятия (для совместимости)
 */
export function getLessonStatus(
  isCompleted: boolean,
  isPaid: boolean,
  isCancelled: boolean,
  lessonDate?: Date
): LessonStatus {
  const statusInfo = getLessonStatusInfo(isCompleted, isPaid, isCancelled, lessonDate);
  return statusInfo.status;
}

/**
 * Получить текст статуса занятия (для совместимости)
 */
export function getLessonStatusText(
  isCompleted: boolean,
  isPaid: boolean,
  isCancelled: boolean,
  lessonDate?: Date
): string {
  const statusInfo = getLessonStatusInfo(isCompleted, isPaid, isCancelled, lessonDate);
  return statusInfo.label;
}

/**
 * Определить статус после проведения занятия
 * Используется для автоматического обновления статусов прошедших занятий
 */
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
  // Если занятие уже проведено или отменено, возвращаем текущие значения
  if (lesson.isCompleted || lesson.isCancelled) {
    return {
      isCompleted: lesson.isCompleted,
      isPaid: lesson.isPaid,
      newStatus: getLessonStatus(lesson.isCompleted, lesson.isPaid, lesson.isCancelled, lesson.date)
    };
  }

  // Занятие еще не проведено, но уже прошло по времени
  // Согласно логике:
  // 1. Если было предоплачено (isPaid = true) -> становится проведенным и остается оплаченным
  // 2. Если не было оплачено (isPaid = false) -> становится проведенным, но не оплаченным (задолженность)
  
  const newIsCompleted = true; // Занятие теперь проведено
  const newIsPaid = lesson.isPaid; // Статус оплаты остается прежним
  
  return {
    isCompleted: newIsCompleted,
    isPaid: newIsPaid,
    newStatus: getLessonStatus(newIsCompleted, newIsPaid, lesson.isCancelled, lesson.date)
  };
}