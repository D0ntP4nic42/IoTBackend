export interface Telemetria {
    deviceId: string;
    timestamp: string;
    data: {
        speed: string;
        fuel: string;
        temperature: string;
        location: {
            lat: number;
            lng: number;
        };
    };
}
