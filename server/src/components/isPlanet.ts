import { AtmosphericComposition, Zone } from "../spawners/planetTypes";
import { Year, Kilometer, TerranMass, Kelvin, GForce } from "../utils/unitTypes";
import {Component} from "./utils";

export class IsPlanetComponet extends Component {
    static id = "isPlanet" as const;
    /**
     * Age of the planet in years
     */
    age: Year = 4543000000;
    /**
     * Star Trek planetary classification can be found here: https://memory-alpha.fandom.com/wiki/Planetary_classification
     */
    classification: string = "M";
    /**
     * Radius of the planet in kilometers
     */
    radius: Kilometer = 3959;
    /**
     * Mass of the planet compared to Earth
     */
    terranMass: TerranMass = 1;
    /**
     * If the planet is habitable or not
     */
    isHabitable: boolean = true;
    /**
     * A description of lifeforms on the planet
     */
    lifeforms: string[] = ["Unknown"];
    /**
     * Which zone the planet lies in: hot, cold, or just right for habitable life
     */
    zone: Zone = ["habitable"];
    /**
     * A list of the components that make up the planet's atmosphere
     */
    atmosphericComposition: AtmosphericComposition = [{component: "oxygen", concentration: 100}];
    /**
     * Density of rings around a planet
     */
    hasRings: number = 0;
    /**
     * Density of clouds in the planet's atmosphere
     */
    hasClouds: number = 0.5;

    /*
    assets: Partial<{
        texture: string;
        clouds: string;
        rings: string;
    }> = {};
    */
}

