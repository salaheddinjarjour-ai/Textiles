import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ---- helpers ---------------------------------------------------------------
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}
function pick<T>(arr: T[]): T {
  return arr[randInt(0, arr.length - 1)];
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

const TAX_RATE = 0.085; // 8.5% sales tax

async function main() {
  console.log("Clearing existing data…");
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.user.deleteMany();

  // ---- warehouses ----------------------------------------------------------
  console.log("Creating warehouses…");
  const main = await prisma.warehouse.create({
    data: { name: "Main Warehouse", location: "New York, NY" },
  });
  const warehouseB = await prisma.warehouse.create({
    data: { name: "Warehouse B", location: "Newark, NJ" },
  });

  // ---- users ---------------------------------------------------------------
  console.log("Creating users…");
  const passwordHash = await bcrypt.hash("password123", 10);
  const users = await Promise.all(
    [
      { name: "Arjun Mehta", email: "admin@textilehub.com", role: "ADMIN" },
      { name: "Priya Sharma", email: "manager@textilehub.com", role: "MANAGER" },
      { name: "Daniel Cruz", email: "sales@textilehub.com", role: "SALES" },
      { name: "Marcus Lee", email: "warehouse@textilehub.com", role: "WAREHOUSE" },
      { name: "Nadia Rahman", email: "accounts@textilehub.com", role: "ACCOUNTANT" },
    ].map((u) => prisma.user.create({ data: { ...u, passwordHash } })),
  );
  const salesUser = users.find((u) => u.role === "SALES")!;
  const adminUser = users.find((u) => u.role === "ADMIN")!;

  // ---- suppliers -----------------------------------------------------------
  console.log("Creating suppliers…");
  const supplierNames = [
    ["Atlas Cotton Mills", "Atlas Cotton Mills, LLC"],
    ["Premier Yarn Supply", "Premier Yarn Supply Co."],
    ["Global Weave Imports", "Global Weave Imports Inc."],
    ["Southern Fiber Co.", "Southern Fiber Company"],
    ["Delta Dye & Finish", "Delta Dye & Finish LLC"],
    ["Highland Wool Traders", "Highland Wool Traders"],
  ];
  const suppliers = await Promise.all(
    supplierNames.map(([name, company], i) =>
      prisma.supplier.create({
        data: {
          name,
          company,
          email: `sales@${name.toLowerCase().replace(/[^a-z]/g, "")}.com`,
          phone: `+1 (212) 555-0${100 + i}`,
          address: `${randInt(100, 900)} Industrial Ave, Charlotte, NC`,
        },
      }),
    ),
  );

  // ---- customers -----------------------------------------------------------
  console.log("Creating customers…");
  const customerData = [
    "Metro Apparel Co.",
    "Riverside Garments",
    "Kingston Fabrics",
    "Summit Clothing",
    "Harbor Textiles",
    "Crossroads Apparel",
    "Liberty Mills",
    "Golden Gate Fashion",
    "Northside Uniforms",
    "Evergreen Textiles",
    "Pinnacle Garments",
    "Coastal Threads",
  ];
  const cities = [
    ["New York", "NY"],
    ["Los Angeles", "CA"],
    ["Chicago", "IL"],
    ["Houston", "TX"],
    ["Atlanta", "GA"],
    ["Boston", "MA"],
  ];
  const customers = await Promise.all(
    customerData.map((company) => {
      const [city, state] = pick(cities);
      return prisma.customer.create({
        data: {
          name: company,
          company,
          email: `orders@${company.toLowerCase().replace(/[^a-z]/g, "")}.com`,
          phone: `+1 (${randInt(200, 799)}) 555-${randInt(1000, 9999)}`,
          address: `${randInt(100, 9000)} ${pick(["Market", "Main", "Broad", "Oak", "Pine"])} St, ${city}, ${state}`,
          city,
          country: "USA",
        },
      });
    }),
  );

  // ---- products ------------------------------------------------------------
  console.log("Creating products…");
  const productSpecs = [
    ["Cotton Roll (40s)", "CR-40S", "Cotton", "Roll", "Natural", 45, 68, 20],
    ["Linen Beige", "LN-BEI", "Linen", "Meter", "Beige", 6.5, 11, 200],
    ["Denim Blue", "DN-BLU", "Denim", "Meter", "Indigo", 5.0, 9.5, 150],
    ["Satin White", "ST-WHT", "Satin", "Meter", "White", 3.2, 6.8, 150],
    ["Polyester Black", "PL-BLK", "Polyester", "Meter", "Black", 1.8, 4.2, 200],
    ["Silk Ivory", "SK-IVY", "Silk", "Meter", "Ivory", 14, 26, 80],
    ["Wool Grey", "WL-GRY", "Wool", "Meter", "Grey", 9, 18, 60],
    ["Cotton Poplin White", "CP-WHT", "Cotton", "Meter", "White", 2.8, 5.5, 250],
    ["Chambray Light Blue", "CH-LBL", "Cotton", "Meter", "Light Blue", 3.5, 7, 120],
    ["Velvet Emerald", "VL-EMR", "Polyester", "Meter", "Emerald", 7, 15, 50],
    ["Corduroy Tan", "CD-TAN", "Cotton", "Meter", "Tan", 4.5, 9, 90],
    ["Twill Navy", "TW-NVY", "Cotton", "Meter", "Navy", 3.0, 6.2, 140],
  ] as const;

  const products = await Promise.all(
    productSpecs.map(
      ([name, sku, category, unit, color, cost, sell, reorder]) =>
        prisma.product.create({
          data: {
            name,
            sku,
            category,
            unit,
            color,
            costPrice: cost,
            sellPrice: sell,
            reorderLevel: reorder,
          },
        }),
    ),
  );

  // ---- stock ---------------------------------------------------------------
  console.log("Creating stock…");
  // Deliberately low lots to populate the low-stock alerts.
  const lowLots: Record<string, { qty: number; wh: string; lot: string }> = {
    "Cotton Roll (40s)": { qty: 8, wh: "A", lot: "CR-2604-09" },
    "Linen Beige": { qty: 18, wh: "A", lot: "LN-2605-17" },
    "Denim Blue": { qty: 96, wh: "A", lot: "DN-2604-21" },
    "Satin White": { qty: 104, wh: "B", lot: "ST-2605-11" },
    "Polyester Black": { qty: 132, wh: "B", lot: "PL-2605-03" },
    "Twill Navy": { qty: 70, wh: "A", lot: "TW-2605-05" },
  };
  for (const p of products) {
    const low = lowLots[p.name];
    const wh = low?.wh === "B" ? warehouseB : main;
    const qty = low ? low.qty : randInt(p.reorderLevel * 2, p.reorderLevel * 6);
    const lot =
      low?.lot ?? `${p.sku}-${randInt(2601, 2607)}-${randInt(10, 40)}`;
    await prisma.stock.create({
      data: {
        productId: p.id,
        warehouseId: wh.id,
        lotNumber: lot,
        quantity: qty,
      },
    });
  }

  // ---- sales orders --------------------------------------------------------
  console.log("Creating sales orders…");
  const now = new Date();
  const statuses = [
    "COMPLETED",
    "COMPLETED",
    "COMPLETED",
    "COMPLETED",
    "PROCESSING",
    "PROCESSING",
    "PENDING",
    "CANCELLED",
  ];
  let seq = 1000;

  for (let d = 44; d >= 0; d--) {
    const ordersToday = randInt(1, d < 25 ? 5 : 3);
    for (let k = 0; k < ordersToday; k++) {
      const created = new Date(now);
      created.setDate(created.getDate() - d);
      if (d === 0) {
        // earlier today, always <= now
        created.setTime(now.getTime() - randInt(20, 8 * 60) * 60 * 1000);
      } else {
        created.setHours(randInt(8, 18), randInt(0, 59), 0, 0);
      }

      const customer = pick(customers);
      const lineCount = randInt(1, 4);
      const chosen = new Set<string>();
      const items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        unitCost: number;
        lineTotal: number;
      }[] = [];

      for (let li = 0; li < lineCount; li++) {
        const p = pick(products);
        if (chosen.has(p.id)) continue;
        chosen.add(p.id);
        const qty =
          p.unit === "Roll" ? randInt(1, 12) : randInt(20, 300);
        const unitPrice = round2(p.sellPrice * rand(0.95, 1.08));
        const lineTotal = round2(unitPrice * qty);
        items.push({
          productId: p.id,
          quantity: qty,
          unitPrice,
          unitCost: p.costPrice,
          lineTotal,
        });
      }
      if (items.length === 0) continue;

      const subtotal = round2(items.reduce((s, i) => s + i.lineTotal, 0));
      const taxAmount = round2(subtotal * TAX_RATE);
      const total = round2(subtotal + taxAmount);
      const status = pick(statuses);
      seq++;
      const ym = `${created.getFullYear().toString().slice(2)}${String(
        created.getMonth() + 1,
      ).padStart(2, "0")}`;
      const orderNumber = `SO-${ym}-${seq}`;

      const makeInvoice = status === "COMPLETED";
      const invStatus = makeInvoice
        ? pick(["PAID", "PAID", "PAID", "PARTIAL", "UNPAID"])
        : null;
      const amountPaid =
        invStatus === "PAID"
          ? total
          : invStatus === "PARTIAL"
            ? round2(total * rand(0.3, 0.7))
            : 0;

      await prisma.salesOrder.create({
        data: {
          orderNumber,
          customerId: customer.id,
          status,
          subtotal,
          taxRate: TAX_RATE,
          taxAmount,
          total,
          createdById: pick([salesUser.id, adminUser.id]),
          createdAt: created,
          items: { create: items },
          ...(makeInvoice && invStatus
            ? {
                invoice: {
                  create: {
                    invoiceNumber: `INV-${ym}-${seq}`,
                    customerId: customer.id,
                    amount: total,
                    amountPaid,
                    status: invStatus,
                    issueDate: created,
                    dueDate: new Date(
                      created.getTime() + 30 * 24 * 60 * 60 * 1000,
                    ),
                    ...(amountPaid > 0
                      ? {
                          payments: {
                            create: {
                              customerId: customer.id,
                              amount: amountPaid,
                              method: pick([
                                "Bank Transfer",
                                "Check",
                                "Card",
                              ]),
                              receivedAt: created,
                            },
                          },
                        }
                      : {}),
                  },
                },
              }
            : {}),
        },
      });
    }
  }

  // ---- purchase orders -----------------------------------------------------
  console.log("Creating purchase orders…");
  let poSeq = 1000;
  for (let k = 0; k < 16; k++) {
    const created = new Date(now);
    created.setDate(created.getDate() - randInt(0, 40));
    const supplier = pick(suppliers);
    const lineCount = randInt(1, 4);
    const chosen = new Set<string>();
    const poItems: {
      productId: string;
      quantity: number;
      unitCost: number;
      lineTotal: number;
    }[] = [];
    for (let li = 0; li < lineCount; li++) {
      const p = pick(products);
      if (chosen.has(p.id)) continue;
      chosen.add(p.id);
      const quantity = p.unit === "Roll" ? randInt(5, 40) : randInt(100, 800);
      poItems.push({
        productId: p.id,
        quantity,
        unitCost: p.costPrice,
        lineTotal: round2(p.costPrice * quantity),
      });
    }
    if (poItems.length === 0) continue;
    const total = round2(poItems.reduce((s, i) => s + i.lineTotal, 0));
    poSeq++;
    const ym = `${created.getFullYear().toString().slice(2)}${String(
      created.getMonth() + 1,
    ).padStart(2, "0")}`;
    await prisma.purchaseOrder.create({
      data: {
        poNumber: `PO-${ym}-${poSeq}`,
        supplierId: supplier.id,
        status: pick(["RECEIVED", "RECEIVED", "RECEIVED", "PENDING"]),
        total,
        createdById: adminUser.id,
        createdAt: created,
        items: { create: poItems },
      },
    });
  }

  // ---- expense / income transactions (for accounting) ----------------------
  console.log("Creating ledger transactions…");
  const expenseCats = [
    ["Rent", 6500],
    ["Salaries", 24000],
    ["Utilities", 1800],
    ["Freight & Shipping", 2200],
    ["Dyeing & Finishing", 3400],
    ["Marketing", 1500],
    ["Office Supplies", 600],
  ];
  for (let m = 0; m < 2; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 5);
    for (const [category, base] of expenseCats) {
      await prisma.transaction.create({
        data: {
          type: "EXPENSE",
          category: category as string,
          description: `${category} — ${monthDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}`,
          amount: round2((base as number) * rand(0.9, 1.1)),
          date: monthDate,
        },
      });
    }
  }

  const counts = {
    users: await prisma.user.count(),
    products: await prisma.product.count(),
    customers: await prisma.customer.count(),
    suppliers: await prisma.supplier.count(),
    orders: await prisma.salesOrder.count(),
    purchaseOrders: await prisma.purchaseOrder.count(),
    invoices: await prisma.invoice.count(),
    payments: await prisma.payment.count(),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
