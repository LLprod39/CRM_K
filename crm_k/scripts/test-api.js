const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Тестирование API...\n');

    // Тест логина
    console.log('1. Тестируем логин...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@crm.com',
        password: 'admin123'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Логин успешен:', loginData.name);
      
      const token = loginData.token;
      
      // Тест получения учеников
      console.log('\n2. Тестируем получение учеников...');
      const studentsResponse = await fetch('http://localhost:3000/api/students', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (studentsResponse.ok) {
        const students = await studentsResponse.json();
        console.log(`✅ Получено учеников: ${students.length}`);
        students.forEach(student => {
          console.log(`  - ${student.fullName} (${student.user?.name || 'Без владельца'})`);
        });
      } else {
        console.log('❌ Ошибка получения учеников:', await studentsResponse.text());
      }

      // Тест получения занятий
      console.log('\n3. Тестируем получение занятий...');
      const lessonsResponse = await fetch('http://localhost:3000/api/lessons', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (lessonsResponse.ok) {
        const lessons = await lessonsResponse.json();
        console.log(`✅ Получено занятий: ${lessons.length}`);
      } else {
        console.log('❌ Ошибка получения занятий:', await lessonsResponse.text());
      }

      // Тест финансовой статистики
      console.log('\n4. Тестируем финансовую статистику...');
      const financesResponse = await fetch('http://localhost:3000/api/finances/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (financesResponse.ok) {
        const finances = await financesResponse.json();
        console.log('✅ Финансовая статистика получена:');
        console.log(`  - Выручка за месяц: ${finances.monthlyRevenue} ₽`);
        console.log(`  - Общий долг: ${finances.totalDebt} ₽`);
        console.log(`  - Топ учеников: ${finances.topStudents.length}`);
      } else {
        console.log('❌ Ошибка получения финансов:', await financesResponse.text());
      }

    } else {
      console.log('❌ Ошибка логина:', await loginResponse.text());
    }

  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

// Ждем немного, чтобы сервер запустился
setTimeout(testAPI, 3000);
