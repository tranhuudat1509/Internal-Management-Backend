import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    const name =
        process.env.ADMIN_NAME ?? "Administrator";

    const username =
        process.env.ADMIN_USERNAME ?? "admin";

    const password =
        process.env.ADMIN_PASSWORD;

    if (!password) {
        throw new Error(
            "ADMIN_PASSWORD environment variable is required.",
        );
    }

    const passwordHash =
        await bcrypt.hash(password, 12);

    await prisma.user.upsert({
        where: {
            username,
        },

        update: {
            name,
            passwordHash,
            isActive: true,
        },

        create: {
            name,
            username,
            passwordHash,
            isActive: true,
        },
    });

    console.log(
        `Admin user "${username}" is ready.`,
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });