import express, { type Request, type Response } from "express";
import type telemetria = require("./interface/telemetria.js");
import { swaggerUiMiddleware, swaggerSpec } from "./config/swagger.js";
import { db, runMigrations } from "./config/db.js";

const app = express();
app.use(express.json());

// Configurações do Swagger
app.use("/docs", swaggerUiMiddleware.serve, swaggerUiMiddleware.setup(swaggerSpec));

const url = "http://localhost:9003/v1/";

/**
 * @openapi
 * tags:
 *   - name: Telemetria
 *     description: Endpoints relacionados à telemetria de dispositivos IoT
 */

/**
 * @openapi
 * /telemetria:
 *   post:
 *     tags:
 *       - Telemetria
 *     summary: Recebe telemetria real enviada por um dispositivo IoT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deviceId:
 *                 type: string
 *                 example: "truck-01-001"
 *               timestamp:
 *                 type: string
 *                 example: "2025-11-23T18:00:00.000Z"
 *               data:
 *                 type: object
 *                 properties:
 *                   speed:
 *                     type: number
 *                     example: 85.32
 *                   fuel:
 *                     type: number
 *                     example: 67.45
 *                   temperature:
 *                     type: number
 *                     example: 24.12
 *                   location:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                         example: -23.5421
 *                       lng:
 *                         type: number
 *                         example: -46.6234
 *     responses:
 *       201:
 *         description: Telemetria registrada com sucesso
 */
app.post("/telemetria", async (req: Request, res: Response) => {
    try {
        const body: telemetria.Telemetria = req.body;

        if (!body.data || !body.deviceId || !body.timestamp) {
            return res.status(400).json({ error: "JSON inválido" });
        }

        const result = await db.query(
            `INSERT INTO telemetry (
        device_id, timestamp, speed, fuel, temperature, lat, lng, raw_json
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
            [
                body.deviceId,
                body.timestamp,
                body.data.speed,
                body.data.fuel,
                body.data.temperature,
                body.data.location?.lat || null,
                body.data.location?.lng || null,
                req.body,
            ]
        );

        res.status(201).json({
            message: "Telemetria registrada com sucesso",
            dados: result.rows[0]
        });

    } catch (err) {
        console.error("Erro ao salvar telemetria:", err);
        res.status(500).json({ error: "Erro ao salvar telemetria" });
    }
});

/**
 * @openapi
 * /telemetria/mock/{deviceId}:
 *   post:
 *     tags:
 *       - Telemetria
 *     summary: Busca telemetria de um mock de IoT externo e registra no sistema
 *     parameters:
 *       - in: path
 *         name: deviceId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: count
 *         required: false
 *         schema:
 *           type: integer
 *         description: Quantidade de registros de telemetria a gerar
 *     responses:
 *       201:
 *         description: Telemetria mock registrada
 */
app.post("/telemetria/mock/:deviceId", async (req: Request, res: Response) => {
    try {
        const { deviceId } = req.params;
        const countParam = req.query.count;
        const count = Number(countParam ?? 1);


        if (!deviceId) {
            return res.status(400).json({ error: "Device ID é obrigatório" });
        }

        const dadosTelemetria = await getTelemetria(count, deviceId)

        for (const dado of dadosTelemetria) {
            await db.query(
                `INSERT INTO telemetry (device_id, timestamp, speed, fuel, temperature, lat, lng, raw_json)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    dado.deviceId,
                    dado.timestamp,
                    dado.speed,
                    dado.fuel,
                    dado.temperature,
                    dado.lat,
                    dado.lng,
                    dado.raw_json
                ]
            );
        }

        res.status(201).json({
            message: "Telemetria mock registrada com sucesso",
            dados: dadosTelemetria
        });

    } catch (err) {
        console.error("Erro ao registrar telemetria mock:", err);
        res.status(500).json({ error: "Erro ao registrar telemetria mock" });
    }
});

app.listen(3000, async () => {
    console.log("API rodando na porta 3000");
    await runMigrations();
});

async function getTelemetria(count = 1, deviceId: string) {
    const response = await fetch(url + "telemetry/" + deviceId + "?count=" + count);
    const data = await response.json();
    return data;
}