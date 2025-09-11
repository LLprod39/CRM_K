const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestStudents() {
  try {
    console.log('🌱 Добавление тестовых учеников...');

    // Получаем всех пользователей
    const users = await prisma.user.findMany();
    if (users.length === 0) {
      console.log('❌ Нет пользователей в системе. Сначала создайте пользователей.');
      return;
    }

    // Список тестовых учеников с разными именами
    const testStudents = [
      {
        fullName: 'Александр Иванов',
        phone: '+7 (701) 111-11-11',
        age: 8,
        diagnosis: 'ДЦП',
        comment: 'Активный ребенок, любит музыку',
        parentName: 'Мария Иванова'
      },
      {
        fullName: 'Анна Петрова',
        phone: '+7 (702) 222-22-22',
        age: 6,
        diagnosis: 'Аутизм',
        comment: 'Требует индивидуального подхода',
        parentName: 'Елена Петрова'
      },
      {
        fullName: 'Дмитрий Сидоров',
        phone: '+7 (703) 333-33-33',
        age: 9,
        diagnosis: 'ЗПР',
        comment: 'Хорошо развивается, показывает прогресс',
        parentName: 'Ольга Сидорова'
      },
      {
        fullName: 'Екатерина Козлова',
        phone: '+7 (704) 444-44-44',
        age: 7,
        diagnosis: 'СДВГ',
        comment: 'Нужны частые перерывы в занятиях',
        parentName: 'Наталья Козлова'
      },
      {
        fullName: 'Максим Волков',
        phone: '+7 (705) 555-55-55',
        age: 5,
        diagnosis: 'Нарушение речи',
        comment: 'Работаем над произношением звуков',
        parentName: 'Ирина Волкова'
      },
      {
        fullName: 'София Морозова',
        phone: '+7 (706) 666-66-66',
        age: 8,
        diagnosis: 'ДЦП',
        comment: 'Показывает отличные результаты',
        parentName: 'Татьяна Морозова'
      },
      {
        fullName: 'Артем Лебедев',
        phone: '+7 (707) 777-77-77',
        age: 6,
        diagnosis: 'Аутизм',
        comment: 'Любит рисовать и лепить',
        parentName: 'Светлана Лебедева'
      },
      {
        fullName: 'Полина Новикова',
        phone: '+7 (708) 888-88-88',
        age: 7,
        diagnosis: 'ЗПР',
        comment: 'Усидчивая и внимательная',
        parentName: 'Анна Новикова'
      },
      {
        fullName: 'Иван Соколов',
        phone: '+7 (709) 999-99-99',
        age: 9,
        diagnosis: 'СДВГ',
        comment: 'Требует особого внимания к концентрации',
        parentName: 'Елена Соколова'
      },
      {
        fullName: 'Варвара Кузнецова',
        phone: '+7 (710) 000-00-00',
        age: 6,
        diagnosis: 'Нарушение речи',
        comment: 'Быстро осваивает новые слова',
        parentName: 'Марина Кузнецова'
      },
      {
        fullName: 'Кирилл Попов',
        phone: '+7 (711) 111-22-33',
        age: 8,
        diagnosis: 'ДЦП',
        comment: 'Очень мотивированный ребенок',
        parentName: 'Людмила Попова'
      },
      {
        fullName: 'Алиса Смирнова',
        phone: '+7 (712) 222-33-44',
        age: 7,
        diagnosis: 'Аутизм',
        comment: 'Хорошо реагирует на структурированные задания',
        parentName: 'Галина Смирнова'
      },
      {
        fullName: 'Роман Федоров',
        phone: '+7 (713) 333-44-55',
        age: 5,
        diagnosis: 'ЗПР',
        comment: 'Нужна помощь в развитии мелкой моторики',
        parentName: 'Валентина Федорова'
      },
      {
        fullName: 'Милана Орлова',
        phone: '+7 (714) 444-55-66',
        age: 8,
        diagnosis: 'СДВГ',
        comment: 'Творческая личность, любит петь',
        parentName: 'Ирина Орлова'
      },
      {
        fullName: 'Тимофей Захаров',
        phone: '+7 (715) 555-66-77',
        age: 6,
        diagnosis: 'Нарушение речи',
        comment: 'Работаем над связной речью',
        parentName: 'Оксана Захарова'
      }
    ];

    console.log(`👶 Создаем ${testStudents.length} тестовых учеников...`);

    let createdCount = 0;
    let existingCount = 0;

    for (const studentData of testStudents) {
      // Проверяем, существует ли уже ученик с таким именем
      const existingStudent = await prisma.student.findFirst({
        where: {
          fullName: studentData.fullName
        }
      });

      if (existingStudent) {
        console.log(`ℹ️  Ученик уже существует: ${studentData.fullName}`);
        existingCount++;
        continue;
      }

      // Выбираем случайного пользователя для ученика
      const randomUser = users[Math.floor(Math.random() * users.length)];

      const student = await prisma.student.create({
        data: {
          ...studentData,
          userId: randomUser.id
        }
      });

      console.log(`✅ Создан ученик: ${student.fullName} (${studentData.diagnosis})`);
      createdCount++;
    }

    console.log(`\n📊 Результат:`);
    console.log(`✅ Создано новых учеников: ${createdCount}`);
    console.log(`ℹ️  Уже существовало: ${existingCount}`);
    console.log(`📈 Всего учеников в системе: ${createdCount + existingCount}`);

    // Показываем статистику по диагнозам
    const allStudents = await prisma.student.findMany();
    const diagnosisStats = {};
    
    allStudents.forEach(student => {
      diagnosisStats[student.diagnosis] = (diagnosisStats[student.diagnosis] || 0) + 1;
    });

    console.log(`\n📋 Статистика по диагнозам:`);
    Object.entries(diagnosisStats).forEach(([diagnosis, count]) => {
      console.log(`${diagnosis}: ${count} учеников`);
    });

    console.log('\n🎉 Тестовые ученики успешно добавлены!');

  } catch (error) {
    console.error('❌ Ошибка при добавлении тестовых учеников:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestStudents();
