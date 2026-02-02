// NCIC PROCEDURAL GENERATOR
// Simulates a massive database by generating consistent details from a name seed

export function generateProfile(nameQuery) {
    if (!nameQuery) nameQuery = generateRandomName();
    const seed = nameQuery.toUpperCase().replace(/[^A-Z]/g, '');
    const isWarrant = simpleHash(seed) % 5 === 0; // 20% Risk
    const isGang = simpleHash(seed) % 8 === 0; // 12% Risk

    // Bio
    const age = (simpleHash(seed + 'AGE') % 50) + 18;
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age);

    const profile = {
        name: nameQuery.toUpperCase(),
        dob: dob.toLocaleDateString(),
        sex: (simpleHash(seed + 'SEX') % 2 === 0) ? 'M' : 'F',
        race: ['W', 'B', 'H', 'A'][simpleHash(seed + 'RACE') % 4],
        height: `${5 + (simpleHash(seed) % 2)}'${simpleHash(seed) % 11}"`,
        weight: `${140 + (simpleHash(seed) % 100)} lbs`,
        status: isWarrant ? 'WANTED' : 'VALID',
        flags: [],
        history: [],
        vehicles: []
    };

    // Flags
    if (isWarrant) profile.flags.push({ type: 'DANGER', label: 'ACTIVE WARRANT' });
    if (isGang) profile.flags.push({ type: 'WARN', label: 'KNOWN GANG MEMBER' });
    if (simpleHash(seed) % 10 === 0) profile.flags.push({ type: 'INFO', label: 'CARRY PERMIT' });

    // CCH (Computerized Criminal History)
    const crimes = ['Theft', 'Simple Assault', 'DUI', 'Poss. Sch. VI', 'Vandalism', 'Burglary', 'Disorderly Conduct'];
    const count = simpleHash(seed + 'CRIME') % 5; // 0-4 priors

    for (let i = 0; i < count; i++) {
        profile.history.push({
            date: `20${18 + i}-0${(i % 9) + 1}-12`,
            charge: crimes[(simpleHash(seed + i) % crimes.length)],
            disposition: 'GUILTY - PROBATION'
        });
    }

    // Vehicles
    const cars = [
        { make: 'FORD', model: 'F150', style: 'TRK', year: 2024 },
        { make: 'TOYOTA', model: 'CAMRY', style: 'SDN', year: 2024 },
        { make: 'CHEVY', model: 'MALIBU', style: 'SDN', year: 2023 },
        { make: 'HONDA', model: 'CIVIC', style: 'CPE', year: 2024 },
        { make: 'TESLA', model: 'MODEL Y', style: 'SUV', year: 2025 },
        { make: 'BMW', model: 'M3', style: 'SDN', year: 2024 },
        { make: 'RIVIAN', model: 'R1T', style: 'TRK', year: 2024 },
        { make: 'PORSCHE', model: '911', style: 'CPE', year: 2025 },
        { make: 'JEEP', model: 'WRANGLER', style: 'SUV', year: 2024 },
        { make: 'HYUNDAI', model: 'IONIQ 5', style: 'SUV', year: 2024 },
        { make: 'MAZDA', model: 'MX-5', style: 'CPE', year: 2023 },
        { make: 'SUBARU', model: 'OUTBACK', style: 'WGN', year: 2025 },
        { make: 'NISSAN', model: 'ROGUE', style: 'SUV', year: 2024 },
        { make: 'KIA', model: 'EV6', style: 'SUV', year: 2024 },
        { make: 'AUDI', model: 'Q5', style: 'SUV', year: 2024 },
        { make: 'LEXUS', model: 'RX', style: 'SUV', year: 2024 },
        { make: 'RAM', model: '1500', style: 'TRK', year: 2025 },
        { make: 'GMC', model: 'SIERRA', style: 'TRK', year: 2024 },
        { make: 'CADILLAC', model: 'ESCALADE', style: 'SUV', year: 2025 },
        { make: 'VOLVO', model: 'XC90', style: 'SUV', year: 2024 },
        { make: 'MERCEDES', model: 'S-CLASS', style: 'SDN', year: 2026 },
        { make: 'VOLKSWAGEN', model: 'GOLF R', style: 'HATCH', year: 2024 },
        { make: 'DODGE', model: 'CHALLENGER', style: 'CPE', year: 2023 },
        { make: 'LAND ROVER', model: 'DEFENDER', style: 'SUV', year: 2024 },
        { make: 'CHEVY', model: 'CORVETTE', style: 'CPE', year: 2025 },
        { make: 'TOYOTA', model: 'TACOMA', style: 'TRK', year: 2024 },
        { make: 'HONDA', model: 'ACCORD', style: 'SDN', year: 2024 },
        { make: 'FORD', model: 'MUSTANG', style: 'CPE', year: 2025 },
        { make: 'TESLA', model: 'MODEL 3', style: 'SDN', year: 2024 },
        { make: 'HYUNDAI', model: 'ELANTRA', style: 'SDN', year: 2024 },
        { make: 'NISSAN', model: 'Z', style: 'CPE', year: 2024 },
        { make: 'KIA', model: 'TELLURIDE', style: 'SUV', year: 2024 },
        { make: 'SUBARU', model: 'WRX', style: 'SDN', year: 2023 },
        { make: 'MAZDA', model: 'CX-5', style: 'SUV', year: 2024 },
        { make: 'ACURA', model: 'INTEGRA', style: 'SDN', year: 2024 },
        { make: 'CHEVY', model: 'SILVERADO', style: 'TRK', year: 2025 },
        { make: 'TOYOTA', model: 'RAV4', style: 'SUV', year: 2024 },
        { make: 'FORD', model: 'BRONCO', style: 'SUV', year: 2024 },
        { make: 'BMW', model: 'X5', style: 'SUV', year: 2024 },
        { make: 'AUDI', model: 'A4', style: 'SDN', year: 2024 },
        { make: 'LEXUS', model: 'IS', style: 'SDN', year: 2024 },
        { make: 'JEEP', model: 'GRAND CHEROKEE', style: 'SUV', year: 2025 },
        { make: 'RAM', model: '2500', style: 'TRK', year: 2024 },
        { make: 'TESLA', model: 'MODEL S', style: 'SDN', year: 2024 },
        { make: 'PORSCHE', model: 'TAYCAN', style: 'SDN', year: 2025 },
        { make: 'FERRARI', model: '296 GTB', style: 'CPE', year: 2024 },
        { make: 'LAMBORGHINI', model: 'URUS', style: 'SUV', year: 2024 },
        { make: 'MCLAREN', model: '750S', style: 'CPE', year: 2024 },
        { make: 'GENESIS', model: 'GV80', style: 'SUV', year: 2025 },
        { make: 'LUCID', model: 'AIR', style: 'SDN', year: 2024 },
        { make: 'HONDA', model: 'CR-V', style: 'SUV', year: 2025 },
        { make: 'TOYOTA', model: 'COROLLA', style: 'SDN', year: 2024 },
        { make: 'FORD', model: 'EXPLORER', style: 'SUV', year: 2025 },
        { make: 'CHEVY', model: 'EQUINOX', style: 'SUV', year: 2025 },
        { make: 'NISSAN', model: 'ALTIMA', style: 'SDN', year: 2025 },
        { make: 'KIA', model: 'SPORTAGE', style: 'SUV', year: 2025 },
        { make: 'MAZDA', model: '3', style: 'HATCH', year: 2024 },
        { make: 'SUBARU', model: 'CROSSTREK', style: 'SUV', year: 2024 },
        { make: 'HYUNDAI', model: 'SANTA FE', style: 'SUV', year: 2024 },
        { make: 'VOLKSWAGEN', model: 'ID.4', style: 'SUV', year: 2024 },
        { make: 'BMW', model: 'i4', style: 'SDN', year: 2024 },
        { make: 'AUDI', model: 'E-TRON GT', style: 'SDN', year: 2024 },
        { make: 'MERCEDES', model: 'EQE', style: 'SUV', year: 2026 },
        { make: 'TESLA', model: 'MODEL X', style: 'SUV', year: 2024 },
        { make: 'POLESTAR', model: '2', style: 'SDN', year: 2024 },
        { make: 'FORD', model: 'MAVERICK', style: 'TRK', year: 2025 },
        { make: 'TOYOTA', model: 'TUNDRA', style: 'TRK', year: 2024 },
        { make: 'CHEVY', model: 'COLORADO', style: 'TRK', year: 2024 },
        { make: 'GMC', model: 'HUMMER EV', style: 'TRK', year: 2024 },
        { make: 'NISSAN', model: 'TITAN', style: 'TRK', year: 2024 },
        { make: 'HONDA', model: 'PILOT', style: 'SUV', year: 2025 },
        { make: 'LEXUS', model: 'GX', style: 'SUV', year: 2024 },
        { make: 'JEEP', model: 'GLADIATOR', style: 'TRK', year: 2024 },
        { make: 'VOLVO', model: 'EX90', style: 'SUV', year: 2025 },
        { make: 'LAND ROVER', model: 'RANGE ROVER', style: 'SUV', year: 2025 },
        { make: 'PORSCHE', model: 'MACAN', style: 'SUV', year: 2024 },
        { make: 'AUDI', model: 'Q8', style: 'SUV', year: 2024 },
        { make: 'BMW', model: '7-SERIES', style: 'SDN', year: 2025 },
        { make: 'MERCEDES', model: 'G-WAGON', style: 'SUV', year: 2025 },
        { make: 'CHEVY', model: 'TAHOE', style: 'SUV', year: 2025 },
        { make: 'TOYOTA', model: 'SIENNA', style: 'VAN', year: 2024 },
        { make: 'HONDA', model: 'ODYSSEY', style: 'VAN', year: 2024 },
        { make: 'KIA', model: 'CARNIVAL', style: 'VAN', year: 2025 },
        { make: 'CHRYSLER', model: 'PACIFICA', style: 'VAN', year: 2024 },
        { make: 'FORD', model: 'TRANSIT', style: 'VAN', year: 2025 },
        { make: 'MAZDA', model: 'CX-90', style: 'SUV', year: 2024 },
        { make: 'HYUNDAI', model: 'PALISADE', style: 'SUV', year: 2024 },
        { make: 'SUBARU', model: 'FORESTER', style: 'SUV', year: 2025 },
        { make: 'NISSAN', model: 'PATHFINDER', style: 'SUV', year: 2024 },
        { make: 'MITSUBISHI', model: 'OUTLANDER', style: 'SUV', year: 2024 },
        { make: 'INFINITI', model: 'QX80', style: 'SUV', year: 2025 },
        { make: 'ACURA', model: 'MDX', style: 'SUV', year: 2024 },
        { make: 'LINCOLN', model: 'NAVIGATOR', style: 'SUV', year: 2025 },
        { make: 'TESLA', model: 'CYBERTRUCK', style: 'TRK', year: 2024 },
        { make: 'ROLLS-ROYCE', model: 'SPECTRE', style: 'CPE', year: 2024 },
        { make: 'BENTLEY', model: 'BENTAYGA', style: 'SUV', year: 2024 },
        { make: 'ASTON MARTIN', model: 'DBX', style: 'SUV', year: 2025 },
        { make: 'KOENIGSEGG', model: 'JESKO', style: 'CPE', year: 2024 },
        { make: 'BUGATTI', model: 'CHIRON', style: 'CPE', year: 2023 },
        { make: 'TOYOTA', model: 'LAND CRUISER', style: 'SUV', year: 2024 }
    ];
    profile.vehicles.push({
        ...cars[simpleHash(seed + 'CAR') % cars.length],
        plate: `${seed.substr(0, 3)}-${simpleHash(seed)}`,
        color: ['BLK', 'WHI', 'SIL', 'RED'][simpleHash(seed + 'COL') % 4]
    });

    return profile;
}

// Simple deterministic hash for "Consistent" randoms
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function generateRandomName() {
    const firsts = ['JAMES', 'JOHN', 'ROBERT', 'MICHAEL', 'WILLIAM', 'DAVID', 'RICHARD', 'JOSEPH', 'THOMAS', 'MARY', 'PATRICIA', 'JENNIFER', 'LINDA', 'ELIZABETH', 'BARBARA', 'SUSAN', 'JESSICA', 'SARAH', 'KAREN'];
    const lasts = ['SMITH', 'JOHNSON', 'WILLIAMS', 'BROWN', 'JONES', 'GARCIA', 'MILLER', 'DAVIS', 'RODRIGUEZ', 'MARTINEZ', 'HERNANDEZ', 'LOPEZ', 'GONZALEZ', 'WILSON', 'ANDERSON', 'THOMAS', 'TAYLOR', 'MOORE'];

    return `${lasts[Math.floor(Math.random() * lasts.length)]}, ${firsts[Math.floor(Math.random() * firsts.length)]}`;
}
