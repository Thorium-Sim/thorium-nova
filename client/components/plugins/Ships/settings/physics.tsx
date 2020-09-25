import {
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
} from "@chakra-ui/core";
import React from "react";
import {useTranslation} from "react-i18next";
import {
  usePluginShipPhysicsSubscription,
  usePluginShipSetMassMutation,
  usePluginShipSetSizeMutation,
} from "../../../../generated/graphql";
import {useParams} from "react-router";

const ShipBasic: React.FC = () => {
  const {t} = useTranslation();
  const {pluginId, shipId} = useParams();
  const {data} = usePluginShipPhysicsSubscription({
    variables: {pluginId, shipId},
  });
  const [setMass] = usePluginShipSetMassMutation();
  const [setSize] = usePluginShipSetSizeMutation();

  const [massError, setMassError] = React.useState(false);
  const [sizeError, setSizeError] = React.useState(false);

  const ship = data?.pluginShip;
  if (!ship) return <div>Loading...</div>;
  return (
    <Box as="fieldset" key={shipId} flex={1} overflowY="auto">
      <Box display="flex" flexWrap="wrap">
        <Box flex={1} pr={4}>
          <FormControl pb={4} isInvalid={massError}>
            <FormLabel width="100%">
              {t(`Mass`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={ship.isShip.mass}
                onChange={() => setMassError(false)}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (
                    !isNaN(parseFloat(e.target.value)) &&
                    parseFloat(e.target.value) >= 0
                  ) {
                    setMass({
                      variables: {
                        pluginId,
                        shipId,
                        mass: parseFloat(e.target.value),
                      },
                    });
                  } else {
                    setMassError(true);
                  }
                }}
              />
            </FormLabel>
            <FormHelperText>Mass is measured in kilograms</FormHelperText>
            <FormErrorMessage>
              {t(`Mass must be a number greater than 0`)}
            </FormErrorMessage>
          </FormControl>
          <FormControl pb={4} isInvalid={sizeError}>
            <FormLabel width="100%">
              {t(`Size`)}
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                defaultValue={ship.size.value}
                onChange={() => setSizeError(false)}
                onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                  if (
                    !isNaN(parseFloat(e.target.value)) &&
                    parseFloat(e.target.value) > 0
                  ) {
                    setSize({
                      variables: {
                        pluginId,
                        shipId,
                        size: parseFloat(e.target.value),
                      },
                    });
                  } else {
                    setSizeError(true);
                  }
                }}
              />
            </FormLabel>
            <FormHelperText>
              This is the scale of the ship in meters. This determines the size
              of the model on the viewscreen and the hit box for collisions.
            </FormHelperText>
            <FormErrorMessage>
              {t(`Size must be a number greater than 0`)}
            </FormErrorMessage>
          </FormControl>
        </Box>
      </Box>
    </Box>
  );
};

export default ShipBasic;
