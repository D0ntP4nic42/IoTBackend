CREATE TABLE telemetry (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    speed NUMERIC,
    fuel NUMERIC,
    temperature NUMERIC,
    lat NUMERIC,
    lng NUMERIC,
    raw_json JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
