export interface Instant {
    occuredOn: Date;
    windSpeed: number;
    windDirection: number;
    rainfall: number;
    temperature: number;
    humidity: number;
    pressure: number;
}

export interface Reading {
    id: number;
    readingCode: string;
    high: number;
    low: number;
    mean: number;
    updatedOn: Date;
}

export interface ReadingTypes {
    name: string;
    readingCode: string;
}