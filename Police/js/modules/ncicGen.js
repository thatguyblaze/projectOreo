// NCIC PROCEDURAL GENERATOR
// Simulates a massive database by generating consistent details from a name seed

export function generateProfile(nameQuery) {
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
        { make: 'FORD', model: 'F150', style: 'TRK' },
        { make: 'TOYOTA', model: 'CAMRY', style: 'SDN' },
        { make: 'CHEVY', model: 'MALIBU', style: 'SDN' },
        { make: 'HONDA', model: 'CIVIC', style: 'CPE' }
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
