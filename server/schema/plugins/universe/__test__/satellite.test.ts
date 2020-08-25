import {gqlCall} from "server/helpers/gqlCall";
import {getPlanetId} from "./utils";

describe("universe satellite", () => {
  describe("should set the satellite properties", () => {
    it("should set axial tilt", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $axialTilt:Float!) {
          universeTemplateSatelliteSetAxialTilt(id:$id, objectId:$objectId, axialTilt:$axialTilt) {
          id 
          satellite {
            axialTilt
          }
        }
      }`,
        variables: {id, objectId: planetId, axialTilt: 1337},
      });
      expect(
        planet.data?.universeTemplateSatelliteSetAxialTilt.satellite.axialTilt
      ).toEqual(1337);
    });
    it("should set distance", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $distance:Float!) {
          universeTemplateSatelliteSetDistance(id:$id, objectId:$objectId, distance:$distance) {
          id 
          satellite {
            distance
          }
        }
      }`,
        variables: {id, objectId: planetId, distance: 1337},
      });
      expect(
        planet.data?.universeTemplateSatelliteSetDistance.satellite.distance
      ).toEqual(1337);
    });
    it("should set orbital arc", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $orbitalArc:Float!) {
          universeTemplateSatelliteSetOrbitalArc(id:$id, objectId:$objectId, orbitalArc:$orbitalArc) {
          id 
          satellite {
            orbitalArc
          }
        }
      }`,
        variables: {id, objectId: planetId, orbitalArc: 1337},
      });
      expect(
        planet.data?.universeTemplateSatelliteSetOrbitalArc.satellite.orbitalArc
      ).toEqual(1337);
    });
    it("should set orbital inclination", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $orbitalInclination:Float!) {
          universeTemplateSatelliteSetOrbitalInclination(id:$id, objectId:$objectId, orbitalInclination:$orbitalInclination) {
          id 
          satellite {
            orbitalInclination
          }
        }
      }`,
        variables: {id, objectId: planetId, orbitalInclination: 1337},
      });
      expect(
        planet.data?.universeTemplateSatelliteSetOrbitalInclination.satellite
          .orbitalInclination
      ).toEqual(1337);
    });
    it("should set eccentricity", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $eccentricity:Float!) {
          universeTemplateSatelliteSetEccentricity(id:$id, objectId:$objectId, eccentricity:$eccentricity) {
          id 
          satellite {
            eccentricity
          }
        }
      }`,
        variables: {id, objectId: planetId, eccentricity: 1337},
      });
      expect(
        planet.data?.universeTemplateSatelliteSetEccentricity.satellite
          .eccentricity
      ).toEqual(1337);
    });
    it("should set show orbit", async () => {
      const {id, planetId} = await getPlanetId();
      const planet = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $showOrbit:Boolean!) {
          universeTemplateSatelliteSetShowOrbit(id:$id, objectId:$objectId, showOrbit:$showOrbit) {
          id 
          satellite {
            showOrbit
          }
        }
      }`,
        variables: {id, objectId: planetId, showOrbit: false},
      });
      expect(
        planet.data?.universeTemplateSatelliteSetShowOrbit.satellite.showOrbit
      ).toEqual(false);
      const planet2 = await gqlCall({
        query: `mutation ChangePlanet($id:ID!, $objectId:ID!, $showOrbit:Boolean!) {
          universeTemplateSatelliteSetShowOrbit(id:$id, objectId:$objectId, showOrbit:$showOrbit) {
          id 
          satellite {
            showOrbit
          }
        }
      }`,
        variables: {id, objectId: planetId, showOrbit: true},
      });
      expect(
        planet2.data?.universeTemplateSatelliteSetShowOrbit.satellite.showOrbit
      ).toEqual(true);
    });
  });
});
