import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Hàm tính ETA giữa hai điểm
const getETA = async (origin, destination) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: origin,           // ví dụ: '10.762622,106.660172'
        destinations: destination, // ví dụ: '10.776889,106.700806'
        key: GOOGLE_MAPS_API_KEY,
        mode: 'driving',
        language: 'vi',
      },
    });

    const data = response.data;
    const duration = data.rows[0].elements[0].duration.text; // ví dụ: '15 phút'
    const distance = data.rows[0].elements[0].distance.text; // ví dụ: '5.2 km'

    return { duration, distance };
  } catch (error) {
    throw new Error('Không thể tính ETA: ' + error.message);
  }
};

// Hàm chuyển địa chỉ thành tọa độ (geocoding)
const geocodeAddress = async (address) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    const location = response.data.results[0].geometry.location;
    return location; // { lat: ..., lng: ... }
  } catch (error) {
    throw new Error('Không thể chuyển địa chỉ: ' + error.message);
  }
};

export default {
  getETA,
  geocodeAddress,
};
