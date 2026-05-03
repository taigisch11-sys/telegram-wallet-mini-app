import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(9, 0, 0, 0);
  return date;
}

async function main() {
  const user = await prisma.user.upsert({
    where: { telegramId: "100000001" },
    update: { username: "demo_wallet", firstName: "Demo" },
    create: {
      telegramId: "100000001",
      username: "demo_wallet",
      firstName: "Demo"
    }
  });

  await prisma.history.deleteMany({ where: { userId: user.id } });
  await prisma.balanceSnapshot.deleteMany({ where: { userId: user.id } });
  await prisma.payment.deleteMany({ where: { userId: user.id } });
  await prisma.income.deleteMany({ where: { userId: user.id } });
  await prisma.debt.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });
  await prisma.settings.deleteMany({ where: { userId: user.id } });

  await prisma.settings.create({
    data: {
      userId: user.id,
      currentMonth: new Date().toISOString().slice(0, 7),
      startBalance: "72000.00",
      editedBalance: "68650.00"
    }
  });

  await prisma.account.createMany({
    data: [
      { userId: user.id, name: "Основная карта", balance: "54800.00" },
      { userId: user.id, name: "Наличные", balance: "7350.00" },
      { userId: user.id, name: "Резерв", balance: "18000.00" }
    ]
  });

  await prisma.debt.createMany({
    data: [
      { userId: user.id, name: "Кредитная карта", amount: "-8500.00" },
      { userId: user.id, name: "Рассрочка", amount: "-3000.00" }
    ]
  });

  await prisma.income.createMany({
    data: [
      {
        userId: user.id,
        name: "Аванс",
        amount: "42000.00",
        plannedDate: daysFromNow(-8),
        actualDate: daysFromNow(-8),
        status: "received_on_time"
      },
      {
        userId: user.id,
        name: "Фриланс",
        amount: "16000.00",
        plannedDate: daysFromNow(-3),
        expectedDate: daysFromNow(2),
        status: "delayed",
        note: "Клиент перенес оплату"
      },
      {
        userId: user.id,
        name: "Зарплата",
        amount: "78000.00",
        plannedDate: daysFromNow(12),
        status: "planned"
      }
    ]
  });

  await prisma.payment.createMany({
    data: [
      {
        userId: user.id,
        name: "Аренда",
        amount: "35000.00",
        plannedDate: daysFromNow(-2),
        actualDate: daysFromNow(-1),
        status: "paid_late"
      },
      {
        userId: user.id,
        name: "Интернет",
        amount: "900.00",
        plannedDate: daysFromNow(-1),
        status: "overdue"
      },
      {
        userId: user.id,
        name: "Кредит",
        amount: "12000.00",
        plannedDate: daysFromNow(4),
        status: "planned"
      },
      {
        userId: user.id,
        name: "Коммунальные",
        amount: "6200.00",
        plannedDate: daysFromNow(8),
        status: "planned"
      }
    ]
  });

  await prisma.balanceSnapshot.createMany({
    data: [
      {
        userId: user.id,
        accountBalance: "70500.00",
        debtBalance: "-14000.00",
        netBalance: "56500.00",
        createdAt: daysFromNow(-14)
      },
      {
        userId: user.id,
        accountBalance: "80150.00",
        debtBalance: "-11500.00",
        netBalance: "68650.00",
        createdAt: daysFromNow(0)
      }
    ]
  });

  await prisma.history.createMany({
    data: [
      {
        userId: user.id,
        type: "balance_reconciled",
        payload: {
          accountBalance: "80150.00",
          debtBalance: "-11500.00",
          netBalance: "68650.00",
          additionalExpenses: "-3350.00"
        }
      },
      {
        userId: user.id,
        type: "payment_paid",
        payload: { name: "Аренда", amount: "35000.00", status: "paid_late" }
      },
      {
        userId: user.id,
        type: "income_received",
        payload: { name: "Аванс", amount: "42000.00", status: "received_on_time" }
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
