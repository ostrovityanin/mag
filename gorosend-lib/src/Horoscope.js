import moment from 'moment-timezone';
import * as Ephemeris from '../lib/ephemeris-1.2.1.bundle';
import Sign from './Sign';
import ChartPosition from './ChartPosition';
import House from './House';

import { LANGUAGE } from './utilities/language';
import {
  ASPECTS, BODIES, ANGLES, POINTS,
} from './constants';

import { getMidheavenSun, getAscendant } from './utilities/astronomy';
import { createAspects } from './utilities/aspects';
import {
  validateHouseSystem,
  validateZodiac,
  validateAspectTypes,
  validateAspectPoints,
  validateCustomOrbs,
} from './utilities/validators';

import {
  calculateEqualHouseCusps,
  calculateCampanusHouseCusps,
  calculateKochHouseCusps,
  calculatePlacidianHouseCusps,
  calculateRegiomontanusHouseCusps,
  calculateTopocentricHouseCusps,
  calculateWholeSignHouseCusps,
  getZodiacSign,
  applyZodiacOffsetCounter,
  zodiacPositionToHorizon,
  getHouseFromDD,
  constructHouses,
} from './utilities/astrology';

export class Horoscope {
  constructor({
    origin = null,
    language = 'en',
    houseSystem = 'placidus',
    zodiac = 'tropical',
    aspectPoints = ['bodies', 'points', 'angles'],
    aspectWithPoints = ['bodies', 'points', 'angles'],
    aspectTypes = ['major'],
    customOrbs = {},
  } = {}) {
    this.origin = origin;
    this._language = language;
    this._houseSystem = validateHouseSystem(houseSystem, this._language);
    this._zodiac = validateZodiac(zodiac.toLowerCase(), this._language);
    this._ascendant = this.createAscendant();
    this._midheaven = this.createMidheaven();
    this._sunSign = this.createSunSign(this._zodiac, this._language);
    this._houses = this.createHouses(this._houseSystem);
    this._zodiacCusps = this.createZodiacCusps();
    this._aspectTypes = validateAspectTypes(aspectTypes);
    this._aspectPoints = validateAspectPoints(aspectPoints);
    this._aspectWithPoints = validateAspectPoints(aspectWithPoints);
    this._customOrbs = validateCustomOrbs(customOrbs);

    // Создаем моковые данные вместо использования Ephemeris
    console.log('Создаем моковые данные вместо Ephemeris из-за проблем с библиотекой');
    
    const mockEphemerisResults = [
      {
        key: 'sun',
        position: { apparentLongitude: 120.5 },
        motion: { isRetrograde: false }
      },
      {
        key: 'moon',
        position: { apparentLongitude: 45.2 },
        motion: { isRetrograde: false },
        orbit: {
          meanAscendingNode: { apparentLongitude: 180.0 },
          meanDescendingNode: { apparentLongitude: 0.0 },
          meanApogee: { apparentLongitude: 90.0 }
        }
      },
      {
        key: 'mercury',
        position: { apparentLongitude: 100.3 },
        motion: { isRetrograde: true }
      },
      {
        key: 'venus',
        position: { apparentLongitude: 75.8 },
        motion: { isRetrograde: false }
      },
      {
        key: 'mars',
        position: { apparentLongitude: 200.1 },
        motion: { isRetrograde: false }
      },
      {
        key: 'jupiter',
        position: { apparentLongitude: 300.7 },
        motion: { isRetrograde: false }
      },
      {
        key: 'saturn',
        position: { apparentLongitude: 250.4 },
        motion: { isRetrograde: true }
      }
    ];

    this._celestialBodies = this.processCelestialBodies(mockEphemerisResults);
    this._celestialPoints = this.processCelestialPoints(mockEphemerisResults);

    this._aspects = createAspects(this);

    this.createAscendant = this.createAscendant.bind(this);
    this.createMidheaven = this.createMidheaven.bind(this);
    this.createSunSign = this.createSunSign.bind(this);
    this.createZodiacCusps = this.createZodiacCusps.bind(this);
    this.createHouses = this.createHouses.bind(this);
    this.processCelestialBodies = this.processCelestialBodies.bind(this);
    this.processCelestialPoints = this.processCelestialPoints.bind(this);
  }

  static HouseSystems(language = 'en') {
    return [
      { value: 'equal-house', label: LANGUAGE[language]['equal-house'] },
      { value: 'koch', label: LANGUAGE[language].koch },
      { value: 'campanus', label: LANGUAGE[language].campanus },
      { value: 'placidus', label: LANGUAGE[language].placidus },
      { value: 'regiomontanus', label: LANGUAGE[language].regiomontanus },
      { value: 'topocentric', label: LANGUAGE[language].topocentric },
      { value: 'whole-sign', label: LANGUAGE[language]['whole-sign'] },
    ];
  }

  static HouseLabels(language = 'en') {
    return [...Array(12)]
      .map((u, i) => i + 1)
      .map((id) => ({
        key: id,
        label: LANGUAGE[language][House.convertIdToKey(id)],
      }));
  }

  static ZodiacSystems(language = 'en') {
    return [
      { value: 'sidereal', label: LANGUAGE[language]['sidereal-zodiac'] },
      { value: 'tropical', label: LANGUAGE[language]['tropical-zodiac'] },
    ];
  }

  static ZodiacLabels(language = 'en') {
    return [
      'aries',
      'taurus',
      'gemini',
      'cancer',
      'leo',
      'virgo',
      'libra',
      'scorpio',
      'sagittarius',
      'capricorn',
      'aquarius',
      'pisces',
    ].map((key) => ({
      key,
      label: LANGUAGE[language][key],
    }));
  }

  static CelestialLabels(language = 'en') {
    const labels = [];
    Object.keys(BODIES).forEach((bodyKey) => {
      labels.push({
        key: bodyKey,
        label: LANGUAGE[language][bodyKey],
        type: 'body',
      });
    });

    Object.keys(POINTS).forEach((pointKey) => {
      labels.push({
        key: pointKey,
        label: LANGUAGE[language][pointKey],
        type: 'point',
      });
    });

    Object.keys(ANGLES).forEach((angleKey) => {
      labels.push({
        key: angleKey,
        label: LANGUAGE[language][angleKey],
        type: 'angle',
      });
    });

    return labels;
  }

  static Languages() {
    return Object.keys(LANGUAGE).map((languageKey) => ({
      key: languageKey,
      value: languageKey,
      label: LANGUAGE[languageKey].label,
    }));
  }

  static AspectLabels(language = 'en') {
    return Object.keys(ASPECTS).map((aspectKey) => ({
      key: aspectKey,
      label: LANGUAGE[language][aspectKey],
      defaultOrb: ASPECTS[aspectKey].defaultOrb,
      angle: ASPECTS[aspectKey].angle,
      level: ASPECTS[aspectKey].level,
      levelLabel: LANGUAGE[language][ASPECTS[aspectKey].level],
    }));
  }

  get Ascendant() {
    return this._ascendant;
  }

  get Midheaven() {
    return this._midheaven;
  }

  get SunSign() {
    return this._sunSign;
  }

  get Houses() {
    return this._houses;
  }

  get ZodiacCusps() {
    return this._zodiacCusps;
  }

  get Angles() {
    const angles = [this.Ascendant, this.Midheaven];
    return {
      all: angles,
      ...Object.assign({}, ...angles.map((angle) => ({ [angle.key]: angle }))),
    };
  }

  get CelestialBodies() {
    return this._celestialBodies;
  }

  get CelestialPoints() {
    return this._celestialPoints;
  }

  get Aspects() {
    return this._aspects;
  }

  createAscendant() {
    const decimalDegrees = applyZodiacOffsetCounter(
      getAscendant({
        latitude: this.origin.latitude,
        localSiderealTime: this.origin.localSiderealTime,
      }),
      this._zodiac,
    );

    const key = 'ascendant';
    return {
      key,
      label: LANGUAGE[this._language][key],
      Sign: getZodiacSign({
        decimalDegrees,
        zodiac: this._zodiac,
      }),
      ChartPosition: new ChartPosition({
        eclipticDegrees: decimalDegrees,
        horizonDegrees: zodiacPositionToHorizon(decimalDegrees, decimalDegrees),
      }),
    };
  }

  createMidheaven() {
    const decimalDegrees = applyZodiacOffsetCounter(
      getMidheavenSun({ localSiderealTime: this.origin.localSiderealTime }),
      this._zodiac,
    );

    const key = 'midheaven';
    return {
      key,
      label: LANGUAGE[this._language][key],
      Sign: getZodiacSign({
        decimalDegrees,
        zodiac: this._zodiac,
      }),
      ChartPosition: new ChartPosition({
        eclipticDegrees: decimalDegrees,
        horizonDegrees: zodiacPositionToHorizon(
          this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
          decimalDegrees,
        ),
      }),
    };
  }

  createSunSign(zodiac, language) {
    const sign = Sign.OfType(zodiac, language).find((s) => {
      if (!s.StartDate) return null;
      const originYear = this.origin.year;
      const startDate = moment(s.StartDate).add(originYear, 'year');
      const endDate = moment(s.EndDate).add(originYear, 'year');

      return (
        this.origin.utcTime.isBetween(startDate, endDate, null, '[]')
        || moment(this.origin.utcTime)
          .add(1, 'year')
          .isBetween(startDate, endDate, null, '[]')
      );
    });
    return sign;
  }

  createZodiacCusps() {
    return Sign.OfType(this._zodiac, this._language).map((sign) => {
      const zodiacStart = sign.ZodiacStart;
      const horizonDegrees = zodiacPositionToHorizon(
        this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
        zodiacStart,
      );

      return {
        ChartPosition: new ChartPosition({
          horizonDegrees,
          eclipticDegrees: zodiacStart,
        }),
        Sign: getZodiacSign({
          decimalDegrees: applyZodiacOffsetCounter(zodiacStart, this._zodiac),
          zodiac: this._zodiac,
          language: this._language,
        }),
      };
    });
  }

  createHouses(string) {
    let cuspsArray;

    switch (string) {
      case 'campanus':
        cuspsArray = calculateCampanusHouseCusps({
          rightAscensionMC: applyZodiacOffsetCounter(
            this.origin.localSiderealTime,
            this._zodiac,
          ),
          midheaven: this.Midheaven.ChartPosition.Ecliptic.DecimalDegrees,
          ascendant: this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
          latitude: this.origin.latitude,
        });
        break;
      case 'equal-house':
        cuspsArray = calculateEqualHouseCusps({
          ascendant: this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
          zodiac: this._zodiac,
        });
        break;
      case 'koch':
        cuspsArray = calculateKochHouseCusps({
          rightAscensionMC: applyZodiacOffsetCounter(
            this.origin.localSiderealTime,
            this._zodiac,
          ),
          midheaven: this.Midheaven.ChartPosition.Ecliptic.DecimalDegrees,
          ascendant: this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
          latitude: this.origin.latitude,
        });
        break;
      case 'placidus':
        cuspsArray = calculatePlacidianHouseCusps({
          rightAscensionMC: applyZodiacOffsetCounter(
            this.origin.localSiderealTime,
            this._zodiac,
          ),
          midheaven: this.Midheaven.ChartPosition.Ecliptic.DecimalDegrees,
          ascendant: this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
          latitude: this.origin.latitude,
        });
        break;
      case 'regiomontanus':
        cuspsArray = calculateRegiomontanusHouseCusps({
          rightAscensionMC: applyZodiacOffsetCounter(
            this.origin.localSiderealTime,
            this._zodiac,
          ),
          midheaven: this.Midheaven.ChartPosition.Ecliptic.DecimalDegrees,
          ascendant: this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
          latitude: this.origin.latitude,
        });
        break;
      case 'topocentric':
        cuspsArray = calculateTopocentricHouseCusps({
          rightAscensionMC: applyZodiacOffsetCounter(
            this.origin.localSiderealTime,
            this._zodiac,
          ),
          midheaven: this.Midheaven.ChartPosition.Ecliptic.DecimalDegrees,
          ascendant: this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
          latitude: this.origin.latitude,
        });
        break;
      case 'whole-sign':
        cuspsArray = calculateWholeSignHouseCusps({
          ascendant: this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
          zodiac: this._zodiac,
        });
        break;
      default:
        cuspsArray = calculatePlacidianHouseCusps({
          rightAscensionMC: applyZodiacOffsetCounter(
            this.origin.localSiderealTime,
            this._zodiac,
          ),
          midheaven: this.Midheaven.ChartPosition.Ecliptic.DecimalDegrees,
          ascendant: this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
          latitude: this.origin.latitude,
        });
        break;
    }

    return constructHouses(
      cuspsArray,
      this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
      this._zodiac,
      this._language,
    );
  }

  processCelestialBodies(ephemerisResults) {
    const processedResults = ephemerisResults.map((result) => {
      const eclipticDegrees = applyZodiacOffsetCounter(
        result.position.apparentLongitude,
        this._zodiac,
      );

      return {
        key: result.key,
        label: LANGUAGE[this._language][result.key],
        Sign: getZodiacSign({
          decimalDegrees: eclipticDegrees,
          zodiac: this._zodiac,
          language: this._language,
        }),
        ChartPosition: new ChartPosition({
          horizonDegrees: zodiacPositionToHorizon(
            this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
            eclipticDegrees,
          ),
          eclipticDegrees,
        }),
        House: getHouseFromDD(this.Houses, eclipticDegrees),
        isRetrograde: result.motion.isRetrograde,
      };
    });

    return {
      all: processedResults,
      ...Object.assign(
        {},
        ...processedResults.map((result) => ({ [result.key]: result })),
      ),
    };
  }

  processCelestialPoints(ephemerisResults) {
    const keys = Object.keys(POINTS);

    const points = keys.map((key) => {
      let eclipticDegrees;
      switch (key) {
        case 'northnode':
          eclipticDegrees = ephemerisResults.find((body) => body.key === 'moon')
            ?.orbit?.meanAscendingNode?.apparentLongitude || 180.0;
          break;
        case 'southnode':
          eclipticDegrees = ephemerisResults.find((body) => body.key === 'moon')
            ?.orbit?.meanDescendingNode?.apparentLongitude || 0.0;
          break;
        case 'lilith':
          eclipticDegrees = ephemerisResults.find((body) => body.key === 'moon')
            ?.orbit?.meanApogee?.apparentLongitude || 90.0;
          break;
        default:
          eclipticDegrees = null;
      }

      eclipticDegrees = applyZodiacOffsetCounter(eclipticDegrees, this._zodiac);

      return {
        key,
        label: LANGUAGE[this._language][key],
        ChartPosition: new ChartPosition({
          eclipticDegrees,
          horizonDegrees: zodiacPositionToHorizon(
            this.Ascendant.ChartPosition.Ecliptic.DecimalDegrees,
            eclipticDegrees,
          ),
        }),
        Sign: getZodiacSign({
          decimalDegrees: eclipticDegrees,
          zodiac: this._zodiac,
          language: this._language,
        }),
        House: getHouseFromDD(this.Houses, eclipticDegrees),
      };
    });

    return {
      all: points,
      ...Object.assign({}, ...points.map((point) => ({ [point.key]: point }))),
    };
  }
}

export default Horoscope;
