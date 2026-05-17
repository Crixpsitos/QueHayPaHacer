export interface Location {
    city: string;
    department: string;
    country: string;
    venue: string;
    address: string;
    coordinates: {
        lat: number;
        lng: number;
    }
}