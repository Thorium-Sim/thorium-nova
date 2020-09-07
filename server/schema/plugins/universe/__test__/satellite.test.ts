import {gqlCall} from "server/helpers/gqlCall";
import {getPlanetId} from "./utils";

describe("universe satellite", () => {
  describe("should set the satellite properties", () => {
    it("should set axial tilt", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $axialTilt:Float!) {
          pluginUniverseSatelliteSetAxialTilt(id:$id, objectId:$objectId, axialTilt:$axialTilt) {
          id 
          satellite {
            axialTilt
          }
        }
      }`,
        variables: {id, objectId: planetId, axialTilt: 1337},
      });
      expect(
        planet.data?.pluginUniverseSatelliteSetAxialTilt.satellite.axialTilt
      ).toEqual(1337);
    });
    it("should set distance", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $distance:Float!) {
          pluginUniverseSatelliteSetDistance(id:$id, objectId:$objectId, distance:$distance) {
          id 
          satellite {
            distance
          }
        }
      }`,
        variables: {id, objectId: planetId, distance: 1337},
      });
      expect(
        planet.data?.pluginUniverseSatelliteSetDistance.satellite.distance
      ).toEqual(1337);
    });
    it("should set orbital arc", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $orbitalArc:Float!) {
          pluginUniverseSatelliteSetOrbitalArc(id:$id, objectId:$objectId, orbitalArc:$orbitalArc) {
          id 
          satellite {
            orbitalArc
          }
        }
      }`,
        variables: {id, objectId: planetId, orbitalArc: 1337},
      });
      expect(
        planet.data?.pluginUniverseSatelliteSetOrbitalArc.satellite.orbitalArc
      ).toEqual(1337);
    });
    it("should set orbital inclination", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $orbitalInclination:Float!) {
          pluginUniverseSatelliteSetOrbitalInclination(id:$id, objectId:$objectId, orbitalInclination:$orbitalInclination) {
          id 
          satellite {
            orbitalInclination
          }
        }
      }`,
        variables: {id, objectId: planetId, orbitalInclination: 1337},
      });
      expect(
        planet.data?.pluginUniverseSatelliteSetOrbitalInclination.satellite
          .orbitalInclination
      ).toEqual(1337);
    });
    it("should set eccentricity", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $eccentricity:Float!) {
          pluginUniverseSatelliteSetEccentricity(id:$id, objectId:$objectId, eccentricity:$eccentricity) {
          id 
          satellite {
            eccentricity
          }
        }
      }`,
        variables: {id, objectId: planetId, eccentricity: 1337},
      });
      expect(
        planet.data?.pluginUniverseSatelliteSetEccentricity.satellite
          .eccentricity
      ).toEqual(1337);
    });
    it("should set show orbit", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $showOrbit:Boolean!) {
          pluginUniverseSatelliteSetShowOrbit(id:$id, objectId:$objectId, showOrbit:$showOrbit) {
          id 
          satellite {
            showOrbit
          }
        }
      }`,
        variables: {id, objectId: planetId, showOrbit: false},
      });
      expect(
        planet.data?.pluginUniverseSatelliteSetShowOrbit.satellite.showOrbit
      ).toEqual(false);
      const planet2 = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $showOrbit:Boolean!) {
          pluginUniverseSatelliteSetShowOrbit(id:$id, objectId:$objectId, showOrbit:$showOrbit) {
          id 
          satellite {
            showOrbit
          }
        }
      }`,
        variables: {id, objectId: planetId, showOrbit: true},
      });
      expect(
        planet2.data?.pluginUniverseSatelliteSetShowOrbit.satellite.showOrbit
      ).toEqual(true);
    });
  });
});
