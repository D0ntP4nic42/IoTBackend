import fs from "fs";
import pkg from "pg";

const { Pool } = pkg;

export const db = new Pool({
    user: process.env.DB_USER || "postgres",
    host: process.env.DB_HOST || "localhost",
    database: process.env.DB_NAME || "postgres",
    password: process.env.DB_PASSWORD || "root",
    port: Number(process.env.DB_PORT) || 5432,
});

export async function runMigrations() {
    try {
        const sql = fs.readFileSync("scripts/initDb.sql", "utf8");
        await db.query(sql);
        console.log(">> Tabelas criadas/validadas com sucesso!");
    } catch (err) {
        if (err instanceof Error && err.message.includes("já existe")) {
            console.log(">> Tabelas já existem, pulando criação.");
            return;
        }
        console.error("Erro ao executar script SQL:", err);
    }
}