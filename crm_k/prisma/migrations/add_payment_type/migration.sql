-- Добавляем поле type в таблицу payments
ALTER TABLE "payments" ADD COLUMN "type" TEXT DEFAULT 'payment';

-- Обновляем существующие записи
UPDATE "payments" SET "type" = 'prepayment' WHERE "description" LIKE '%абонемент%' OR "description" LIKE '%предоплата%' OR "description" LIKE '%занятий%';
UPDATE "payments" SET "type" = 'payment' WHERE "type" IS NULL;
