import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

// Configurar variables de entorno
dotenv.config();

// Crear la instancia de Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const app = express();
app.use(express.json());
app.use(cors());

const PUERTO = process.env.PORT || 3000;

// Ruta para registrar asistencia y comidas
app.post("/registro", async (req, res) => {
    try {
        const { trabajador_id, trabajo, desayuno, almuerzo, cena, pago_diario } = req.body;

        if (!trabajador_id || trabajo === undefined || !pago_diario) {
            return res.status(400).json({ error: "Faltan datos obligatorios." });
        }

        // Calcular el costo total de las comidas
        const costo_comida = ((desayuno ? 1 : 0) + (almuerzo ? 1 : 0) + (cena ? 1 : 0)) * 3;
        
        // Calcular el pago total por ese día
        const pago_total = trabajo ? pago_diario : 0;

        // Insertar en la base de datos
        const { data, error } = await supabase
            .from("registros")
            .insert([{ trabajador_id, trabajo, desayuno, almuerzo, cena, pago_total, costo_comida }]);

        if (error) throw error;

        res.status(201).json({ mensaje: "Registro exitoso", data });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para consultar todos los registros de asistencia
app.get("/registros", async (req, res) => {
    try {
        const { data, error } = await supabase.from("registros").select("*");

        if (error) throw error;

        res.json(data);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Ruta para obtener el resumen de un trabajador
app.get("/trabajador/:id/resumen", async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener el resumen del trabajador desde la tabla de registros
        const { data, error } = await supabase
            .from("registros")
            .select("trabajador_id, SUM(pago_total) as total_pago, SUM(costo_comida) as total_comida, COUNT(trabajo) as dias_trabajados")
            .eq("trabajador_id", id)
            .single();

        if (error) throw error;

        res.json({
            trabajador_id: id,
            dias_trabajados: data.dias_trabajados,
            total_pago: data.total_pago,
            total_comida: data.total_comida
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(PUERTO, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PUERTO}`);
});
