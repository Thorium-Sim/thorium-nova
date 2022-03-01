import { stringify } from "querystring";
import PlanetPlugin from "server/src/classes/Plugins/Universe/Planet";
import StarPlugin from "server/src/classes/Plugins/Universe/Star";
//Do Zone, PlanetTypes, and AtomosphericComposition need to be put into the units page?
import { AtmosphericComposition, planetTypes, PlanetTypes, Zone } from "server/src/spawners/planetTypes";
import { DataContext } from "server/src/utils/DataContext";
import { pubsub } from "server/src/utils/pubsub";
import { randomFromRange } from "server/src/utils/randomFromRange";
import { Kelvin, Kilometer, TerranMass } from "server/src/utils/unitTypes";
import { getPlugin } from "../utils";

function getStar(
    context: DataContext,
    pluginId: string,
    starId: string
) {
    const plugin = getPlugin(context, pluginId);
    const star = plugin.aspects.stars.find(
        star => star.name === starId
    );
    if (!star) {
        throw new Error(`No star found with id ${starId}`);
    }
    return star;
}

/**
 * Distance between planet orbits in a system
 */
const PLANET_DISTANCE = 2;

export const planetPluginInputs = {
    pluginPlanetCreate(
        context: DataContext,
        params: {
            pluginId: string,
            starId: string,
            planetType: PlanetTypes;
        }
    ) {
        const star = getStar(
            context,
            params.pluginId,
            params.starId
        );
        const childrenPlanets = star.planets;//is that a bad name? They're more like sibling planets

        const planetType = planetTypes.find(
            p => p.classification === params.planetType//I need to figure out planetType vs classification
        );
        if (!planetType) {
            throw new Error(`Invalid planet type: ${params.planetType}`);
        }
        const name = `${star.name} ${childrenPlanets.length}`;

        //I probably don't need this here if the radius is negligible for orbit...right? Is it planetary radius or orbital radius?
        const radius = randomFromRange(planetType.radiusRange);

        //I need to learn how to calculate these for new planets
        let semiMajorAxis = childrenPlanets.length * PLANET_DISTANCE;
        let orbitalArc = Math.random() * 360;

        const planet = new PlanetPlugin(
            {
                name,
                isPlanet: {
                    age: randomFromRange(planetType.ageRange),
                    classification: planetType.classification,
                    radius: radius,
                    terranMass: randomFromRange(planetType.terranMassRange),
                    isHabitable: planetType.habitable,
                    lifeforms: planetType.lifeforms,
                    zone: planetType.zone,
                    atmosphericComposition: planetType.atmosphericComposition,
                    hasClouds: planetType.hasClouds,
                    hasRings: planetType.hasRings,
                },
                satellite: {
                    orbitalArc,
                    semiMajorAxis,
                    showOrbit: true,
                    parentId: star.name,
                },
                population: {
                    count: randomFromRange(planetType.population),
                },
                temperature: {
                    temperature: randomFromRange(planetType.temperatureRange),
                }
            },
            star
        );
        star.planets.push(planet);
        
        //I need to add this somewhere for it to work...
        pubsub.publish("pluginStar", {
            pluginId: params.pluginId,
            starId: star.name,
        });

        return planet;
    },
    pluginPlanetDelete(
        context: DataContext,
        params: {
            pluginId: string;
            starId: string;
            planetId: string;
        }
    ) {
        const star = getStar(
            context,
            params.pluginId,
            params.starId
        );
        const planet = star.planets.find(s => s.name === params.planetId);
        if (!star) {
            throw new Error(`No planet found with id ${params.planetId}`);
        }
        star.planets = star.planets.filter(s => s !== planet);
        pubsub.publish("pluginStar", {
            pluginId: params.pluginId,
            starId: star.name,
        });
        return planet;
    },
    pluginPlanetUpdate(
        context: DataContext,
        params: {
            pluginId: string;
            starId: string;
            planetId: string;
            name?: string;
            age?: number,
            classification?: PlanetTypes,
            radius?: Kilometer,
            terranMass?: TerranMass,
            isHabitable?: boolean,
            lifeforms?: string[],
            zone?: Zone,
            atmosphericComposition?: AtmosphericComposition,
            hasClouds?: number,
            hasRings?: number,
            population?: number,
            temperature?: Kelvin,
        }
    ) {
        const star = getStar(
            context,
            params.pluginId,
            params.starId
        );
        const planet = star.planets.find(s => s.name === params.planetId);
        if (!planet) {
            throw new Error(`No planet found with id ${params.planetId}`);
        }
        if (params.name) {
            planet.name = params.name;
        }
        if (params.age) {
            planet.isPlanet.age = params.age;
        }
        //should all of these be editable? I know planet class influences a lot of attributes.
        if (params.classification) {
            planet.isPlanet.classification = params.classification;
        }
        if (params.radius) {
            planet.isPlanet.radius = params.radius;
        }
        if (params.terranMass) {
            planet.isPlanet.terranMass = params.terranMass;
        }
        if (params.isHabitable) {
            planet.isPlanet.isHabitable = params.isHabitable;
        }
        if (params.lifeforms) {
            planet.isPlanet.lifeforms = params.lifeforms;
        }
        if (params.zone) {
            planet.isPlanet.zone = params.zone;
        }
        if (params.atmosphericComposition) {
            planet.isPlanet.atmosphericComposition = params.atmosphericComposition;
        }
        if (params.hasClouds) {
            planet.isPlanet.hasClouds = params.hasClouds;
        }
        if (params.hasRings) {
            planet.isPlanet.hasRings = params.hasRings;
        }
        if (params.population) {
            planet.population.count = params.population;
        }
        if (params.temperature) {
            planet.temperature.temperature = params.temperature;
        }
        pubsub.publish("pluginStar", {
            pluginId: params.pluginId,
            starId: star.name
        });
        return planet;
    },
}