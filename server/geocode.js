require('dotenv').config();
const mongoose = require('mongoose');
const Patient = require('./models/Patient');

const geocodeAddress = async (address) => {
    try {
        if (!address) return null;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const response = await fetch(url, { headers: { 'User-Agent': 'PostCareAI/1.0' } });
        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                formattedAddress: data[0].display_name
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error.message);
    }
    return null;
};

const runGeocode = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connected');

        const patients = await Patient.find({ 'location.lat': { $exists: false } });
        console.log(`Found ${patients.length} patients to geocode...`);

        for (const p of patients) {
            if (p.address && p.address.length > 3) {
                console.log(`Geocoding ${p.address}...`);
                const loc = await geocodeAddress(p.address);
                if (loc) {
                    p.location = loc;
                    await p.save();
                    console.log(`Saved coordinates for patient ${p.fullName}.`);
                }
                // Wait 1.5 seconds to respect Nominatim limits (1 request per second)
                await new Promise(r => setTimeout(r, 1500));
            }
        }

        console.log('Geocoding complete');
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

runGeocode();
