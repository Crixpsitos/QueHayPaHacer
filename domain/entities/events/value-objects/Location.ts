export interface LocationDetail {
  isoCode: string;
  name: string;
}

export interface Location {
  city: string;
  venue: string;
  address: string;
  moreInfo?: string; 
  
  department: LocationDetail;
  country: LocationDetail;
  
  coordinates: {
    lat: number;
    lng: number;
  };
}