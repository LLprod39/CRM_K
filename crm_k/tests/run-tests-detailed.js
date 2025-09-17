const { spawn } = require('child_process')
const path = require('path')

class TestRunner {
  constructor() {
    this.currentTest = ''
    this.totalTests = 0
    this.completedTests = 0
    this.failedTests = 0
    this.passedTests = 0
    this.startTime = Date.now()
  }

  runTests(testPattern = '') {
    console.log('\n🚀 ЗАПУСК ДЕТАЛЬНОГО ТЕСТИРОВАНИЯ CRM СИСТЕМЫ')
    console.log('═'.repeat(80))
    console.log('📋 Информация о тестировании:')
    console.log(`   🕐 Время запуска: ${new Date().toLocaleString('ru-RU')}`)
    console.log(`   📁 Директория: ${__dirname}`)
    console.log(`   🎯 Паттерн тестов: ${testPattern || 'все тесты'}`)
    console.log('═'.repeat(80))
    console.log('🎯 ЦЕЛЬ: Получить максимально подробную информацию о состоянии системы')
    console.log('═'.repeat(80) + '\n')
    
    const args = ['--runInBand', '--reporters=./reporters/russian-reporter.js', '--verbose']
    if (testPattern) {
      args.push('--testPathPattern=' + testPattern)
    }

    const jestProcess = spawn('npx', ['jest', ...args], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true // Добавляем shell для Windows
    })

    jestProcess.stdout.on('data', (data) => {
      const output = data.toString()
      this.parseOutput(output)
      process.stdout.write(output)
    })

    jestProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString()
      console.log('\n⚠️  ОШИБКИ В ПРОЦЕССЕ ТЕСТИРОВАНИЯ:')
      console.log('─'.repeat(80))
      console.log(errorOutput)
      console.log('─'.repeat(80))
    })

    jestProcess.on('close', (code) => {
      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2)
      
      console.log('\n' + '═'.repeat(80))
      console.log('🏁 ДЕТАЛЬНОЕ ТЕСТИРОВАНИЕ ЗАВЕРШЕНО')
      console.log('═'.repeat(80))
      console.log(`📊 Итоговая статистика:`)
      console.log(`   🕐 Время завершения: ${new Date().toLocaleString('ru-RU')}`)
      console.log(`   ⏱️  Общее время выполнения: ${duration}с`)
      console.log(`   📈 Код завершения: ${code}`)
      console.log(`   ✅ Пройдено тестов: ${this.passedTests}`)
      console.log(`   ❌ Провалено тестов: ${this.failedTests}`)
      console.log(`   📊 Всего выполнено: ${this.completedTests}`)
      
      if (code === 0) {
        console.log('\n🎉 ВСЕ ТЕСТЫ ВЫПОЛНЕНЫ УСПЕШНО!')
        console.log('✨ Система полностью готова к работе!')
      } else {
        console.log('\n⚠️  ОБНАРУЖЕНЫ ПРОБЛЕМЫ В СИСТЕМЕ!')
        console.log('🔧 Рекомендуется исправить все ошибки перед развертыванием')
      }
      
      console.log('\n📋 ДОПОЛНИТЕЛЬНЫЕ КОМАНДЫ:')
      console.log('   • npm run test:coverage - запуск с анализом покрытия кода')
      console.log('   • npm run test:watch - запуск в режиме наблюдения')
      console.log('   • npm run test:unit - запуск только unit тестов')
      console.log('   • npm run test:integration - запуск только интеграционных тестов')
      console.log('   • npm run test:e2e - запуск только e2e тестов')
      console.log('═'.repeat(80) + '\n')
    })

    jestProcess.on('error', (error) => {
      console.log('\n❌ КРИТИЧЕСКАЯ ОШИБКА ПРИ ЗАПУСКЕ ТЕСТОВ:')
      console.log('─'.repeat(80))
      console.log(`💡 Проблема: ${error.message}`)
      console.log('🔧 Что делать:')
      console.log('   • Убедитесь, что Jest установлен: npm install')
      console.log('   • Проверьте, что вы находитесь в правильной директории')
      console.log('   • Убедитесь, что все зависимости установлены')
      console.log('   • Проверьте права доступа к файлам')
      console.log('─'.repeat(80) + '\n')
    })
  }

  parseOutput(output) {
    // Парсим вывод для отслеживания прогресса
    const lines = output.split('\n')
    
    lines.forEach(line => {
      if (line.includes('ТЕСТИРУЕМ:')) {
        this.currentTest = line.trim()
        console.log(`\n🔄 ${this.currentTest}`)
      }
      
      if (line.includes('УСПЕШНО ПРОЙДЕН')) {
        this.passedTests++
        this.completedTests++
        console.log(`✅ ${this.currentTest} - завершен успешно`)
      }
      
      if (line.includes('ОБНАРУЖЕНЫ ПРОБЛЕМЫ')) {
        this.failedTests++
        this.completedTests++
        console.log(`❌ ${this.currentTest} - завершен с ошибками`)
      }
    })
  }
}

// Запуск тестов
const runner = new TestRunner()

// Получаем аргументы командной строки
const args = process.argv.slice(2)
const testPattern = args.find(arg => arg.startsWith('--test='))?.split('=')[1] || ''

runner.runTests(testPattern)
