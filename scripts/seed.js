const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const usuarios = [
    {
      name: "Jose Herrera",
      email: "jherrera@unmsm.edu.pe",
      password: "123456",
      role: "administrador",
    },
    {
      name: "Jose Herrera",
      email: "jherrera@unmsm.edu.pe",
      password: "123456",
      role: "coordinador",
    },
    {
      name: "Luzmila Pro",
      email: "lpro@unmsm.edu.pe",
      password: "123456",
      role: "docente",
    },
    {
      name: "Sergio Quiroz",
      email: "sergioq@unmsm.edu.pe",
      password: "123456",
      role: "estudiante",
    },
  ];

  for (const usuario of usuarios) {
    const hashedPassword = await bcrypt.hash(usuario.password, 10);

    const existente = await prisma.user.findUnique({
      where: { email: usuario.email },
    });

    if (existente) {
      console.log(`⚠️ El usuario ${usuario.email} ya existe, se omite.`);
      continue;
    }

    await prisma.user.create({
      data: {
        name: usuario.name,
        email: usuario.email,
        password: hashedPassword,
        role: usuario.role,
      },
    });

    console.log(`✅ Usuario creado: ${usuario.name} (${usuario.role})`);
  }

  console.log("🎉 Seed de usuarios completado correctamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
