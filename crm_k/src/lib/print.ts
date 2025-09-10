// Утилиты для печати

export const printElement = (elementId: string, title?: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Элемент для печати не найден');
    return;
  }

  // Создаем новое окно для печати
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Не удалось открыть окно для печати');
    return;
  }

  // Получаем стили из текущего документа
  const styles = Array.from(document.styleSheets)
    .map(styleSheet => {
      try {
        return Array.from(styleSheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  // HTML для печати
  const printHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || 'Документ для печати'}</title>
      <style>
        ${styles}
        
        /* Стили для печати */
        @media print {
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print-break {
            page-break-before: always;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }
          
          .print-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .print-date {
            font-size: 12px;
            color: #666;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          .print-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        }
        
        /* Скрываем элементы, которые не должны печататься */
        .no-print {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <div class="print-title">${title || 'Документ'}</div>
        <div class="print-date">Дата печати: ${new Date().toLocaleDateString('ru-RU')}</div>
      </div>
      
      ${element.innerHTML}
      
      <div class="print-footer">
        <p>Документ сгенерирован системой CRM_K</p>
        <p>Время печати: ${new Date().toLocaleString('ru-RU')}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();

  // Ждем загрузки и печатаем
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};

export const printStudentsList = (students: Array<{
  fullName: string;
  phone: string;
  age: number;
  diagnosis?: string | null;
  comment?: string | null;
}>) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Не удалось открыть окно для печати');
    return;
  }

  const printHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Список учеников</title>
      <style>
        @media print {
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }
          
          .print-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .print-date {
            font-size: 12px;
            color: #666;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          .print-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <div class="print-title">Список учеников</div>
        <div class="print-date">Дата печати: ${new Date().toLocaleDateString('ru-RU')}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>ФИО</th>
            <th>Телефон</th>
            <th>Возраст</th>
            <th>Диагноз</th>
            <th>Комментарий</th>
          </tr>
        </thead>
        <tbody>
          ${students.map((student, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${student.fullName}</td>
              <td>${student.phone}</td>
              <td>${student.age} лет</td>
              <td>${student.diagnosis || '—'}</td>
              <td>${student.comment || '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="print-footer">
        <p>Документ сгенерирован системой CRM_K</p>
        <p>Время печати: ${new Date().toLocaleString('ru-RU')}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};

export const printSchedule = (lessons: Array<{
  date: string | Date;
  student?: { fullName: string };
  cost: number;
  status: string;
}>, date?: Date) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    console.error('Не удалось открыть окно для печати');
    return;
  }

  const title = date 
    ? `Расписание на ${date.toLocaleDateString('ru-RU')}`
    : 'Расписание занятий';

  const printHTML = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @media print {
          body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          
          .print-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #000;
          }
          
          .print-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .print-date {
            font-size: 12px;
            color: #666;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          
          th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          
          .status-scheduled { color: #3b82f6; }
          .status-completed { color: #10b981; }
          .status-cancelled { color: #ef4444; }
          .status-paid { color: #8b5cf6; }
          
          .print-footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-header">
        <div class="print-title">${title}</div>
        <div class="print-date">Дата печати: ${new Date().toLocaleDateString('ru-RU')}</div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>№</th>
            <th>Дата и время</th>
            <th>Ученик</th>
            <th>Стоимость</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          ${lessons.map((lesson, index) => {
            const lessonDate = new Date(lesson.date);
            const statusText = {
              'SCHEDULED': 'Запланировано',
              'COMPLETED': 'Проведено',
              'CANCELLED': 'Отменено',
              'PAID': 'Оплачено'
            }[lesson.status] || lesson.status;
            
            return `
              <tr>
                <td>${index + 1}</td>
                <td>${lessonDate.toLocaleString('ru-RU')}</td>
                <td>${lesson.student?.fullName || 'Неизвестно'}</td>
                <td>₸${lesson.cost}</td>
                <td class="status-${lesson.status.toLowerCase()}">${statusText}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
      
      <div class="print-footer">
        <p>Документ сгенерирован системой CRM_K</p>
        <p>Время печати: ${new Date().toLocaleString('ru-RU')}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(printHTML);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };
};
