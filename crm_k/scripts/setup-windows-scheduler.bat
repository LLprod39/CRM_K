@echo off
echo Настройка автоматического запуска notification worker...

REM Получаем текущую директорию
set CURRENT_DIR=%CD%

REM Создаем XML файл для Task Scheduler
echo ^<?xml version="1.0" encoding="UTF-16"?^> > notification-worker-task.xml
echo ^<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^> >> notification-worker-task.xml
echo   ^<RegistrationInfo^> >> notification-worker-task.xml
echo     ^<Description^>CRM Notification Worker - автоматическая отправка уведомлений^</Description^> >> notification-worker-task.xml
echo   ^</RegistrationInfo^> >> notification-worker-task.xml
echo   ^<Triggers^> >> notification-worker-task.xml
echo     ^<TimeTrigger^> >> notification-worker-task.xml
echo       ^<Repetition^> >> notification-worker-task.xml
echo         ^<Interval^>PT5M^</Interval^> >> notification-worker-task.xml
echo         ^<StopAtDurationEnd^>false^</StopAtDurationEnd^> >> notification-worker-task.xml
echo       ^</Repetition^> >> notification-worker-task.xml
echo       ^<StartBoundary^>2025-01-01T00:00:00^</StartBoundary^> >> notification-worker-task.xml
echo       ^<Enabled^>true^</Enabled^> >> notification-worker-task.xml
echo     ^</TimeTrigger^> >> notification-worker-task.xml
echo   ^</Triggers^> >> notification-worker-task.xml
echo   ^<Principals^> >> notification-worker-task.xml
echo     ^<Principal id="Author"^> >> notification-worker-task.xml
echo       ^<LogonType^>InteractiveToken^</LogonType^> >> notification-worker-task.xml
echo       ^<RunLevel^>LeastPrivilege^</RunLevel^> >> notification-worker-task.xml
echo     ^</Principal^> >> notification-worker-task.xml
echo   ^</Principals^> >> notification-worker-task.xml
echo   ^<Settings^> >> notification-worker-task.xml
echo     ^<MultipleInstancesPolicy^>IgnoreNew^</MultipleInstancesPolicy^> >> notification-worker-task.xml
echo     ^<DisallowStartIfOnBatteries^>false^</DisallowStartIfOnBatteries^> >> notification-worker-task.xml
echo     ^<StopIfGoingOnBatteries^>false^</StopIfGoingOnBatteries^> >> notification-worker-task.xml
echo     ^<AllowHardTerminate^>true^</AllowHardTerminate^> >> notification-worker-task.xml
echo     ^<StartWhenAvailable^>true^</StartWhenAvailable^> >> notification-worker-task.xml
echo     ^<RunOnlyIfNetworkAvailable^>false^</RunOnlyIfNetworkAvailable^> >> notification-worker-task.xml
echo     ^<IdleSettings^> >> notification-worker-task.xml
echo       ^<StopOnIdleEnd^>false^</StopOnIdleEnd^> >> notification-worker-task.xml
echo       ^<RestartOnIdle^>false^</RestartOnIdle^> >> notification-worker-task.xml
echo     ^</IdleSettings^> >> notification-worker-task.xml
echo     ^<AllowStartOnDemand^>true^</AllowStartOnDemand^> >> notification-worker-task.xml
echo     ^<Enabled^>true^</Enabled^> >> notification-worker-task.xml
echo     ^<Hidden^>false^</Hidden^> >> notification-worker-task.xml
echo     ^<RunOnlyIfIdle^>false^</RunOnlyIfIdle^> >> notification-worker-task.xml
echo     ^<WakeToRun^>false^</WakeToRun^> >> notification-worker-task.xml
echo     ^<ExecutionTimeLimit^>PT1H^</ExecutionTimeLimit^> >> notification-worker-task.xml
echo     ^<Priority^>7^</Priority^> >> notification-worker-task.xml
echo   ^</Settings^> >> notification-worker-task.xml
echo   ^<Actions Context="Author"^> >> notification-worker-task.xml
echo     ^<Exec^> >> notification-worker-task.xml
echo       ^<Command^>node^</Command^> >> notification-worker-task.xml
echo       ^<Arguments^>scripts/notification-worker.js^</Arguments^> >> notification-worker-task.xml
echo       ^<WorkingDirectory^>%CURRENT_DIR%^</WorkingDirectory^> >> notification-worker-task.xml
echo     ^</Exec^> >> notification-worker-task.xml
echo   ^</Actions^> >> notification-worker-task.xml
echo ^</Task^> >> notification-worker-task.xml

echo.
echo XML файл создан: notification-worker-task.xml
echo.
echo Для установки задачи выполните следующую команду от имени администратора:
echo.
echo schtasks /create /tn "CRM Notification Worker" /xml notification-worker-task.xml
echo.
echo Для удаления задачи:
echo schtasks /delete /tn "CRM Notification Worker" /f
echo.
echo Для запуска задачи вручную:
echo schtasks /run /tn "CRM Notification Worker"
echo.
echo Для просмотра статуса:
echo schtasks /query /tn "CRM Notification Worker"
echo.
pause
