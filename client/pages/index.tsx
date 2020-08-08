import React from "react";
import {
  Box,
  Collapse,
  Flex,
  Grid,
  Heading,
  Link,
  List,
  ListItem,
  Stack,
} from "@chakra-ui/core";
import QuoteOfTheDay from "../components/QuoteOfTheDay";
import Credits from "../components/Credits";
import {Link as RouterLink} from "react-router-dom";
import {useFlightsQuery} from "../generated/graphql";
import {Trans, useTranslation} from "react-i18next";
import Button from "../components/ui/button";
import getUDPChannel from "../helpers/udpClient";
import {NavLink} from "react-router-dom";

const Welcome = () => {
  const {t} = useTranslation("welcome");
  const [show, setShow] = React.useState(false);
  const {data} = useFlightsQuery();
  return (
    <>
      <Grid
        templateColumns="1fr 1fr"
        templateRows="1fr 1fr"
        templateAreas={`"logo credits"
    "button credits"`}
        height="100%"
        gap={16}
      >
        <Box m={16} gridArea="logo">
          <Flex alignItems="flex-end" alignSelf="start">
            <Box
              as="img"
              draggable={false}
              // @ts-ignore 2322
              src={require("url:../images/logo.svg")}
              alt="Thorium Logo"
              maxH={32}
            ></Box>
            <Heading as="h1" size="2xl" color="white" minWidth="12ch" ml={3}>
              Thorium Nova
            </Heading>
          </Flex>
          <Heading size="md" mt={2}>
            {/* @ts-ignore */}
            <Link as={RouterLink} color="purple.300" to="/releases">
              {t("Version {{version}}", {
                version: require("../../package.json").version,
              })}
            </Link>
          </Heading>
        </Box>
        <Stack gridArea="button" alignSelf="end" m={16} spacing={4} width={400}>
          <Button size="lg" variantColor="primary" variant="outline">
            {t(`Start a New Flight`)}
          </Button>
          <Button
            size="lg"
            variantColor="info"
            variant="outline"
            onClick={() => setShow(s => !s)}
          >
            {t(`Load a Saved Flight`)}
          </Button>
          <Collapse isOpen={show}>
            <List
              maxHeight={200}
              overflowY="auto"
              border="solid 1px"
              borderColor="whiteAlpha.500"
            >
              {data?.flights.map(f => (
                <ListItem
                  p={4}
                  borderBottom="solid 1px"
                  borderColor="whiteAlpha.500"
                  key={f.id}
                >
                  <strong>{f.name}</strong>
                  <br />
                  <small>{new Date(f.date).toLocaleDateString()}</small>
                </ListItem>
              ))}
            </List>
          </Collapse>
          <Button size="lg" variantColor="warning" variant="outline">
            {t(`Join a Server`)}
          </Button>
          <Button
            size="lg"
            variantColor="alert"
            variant="outline"
            as={NavLink}
            {...{to: "/config"}}
          >
            {t(`Configure Plugins`)}
          </Button>
        </Stack>
        <Credits></Credits>
      </Grid>
      <QuoteOfTheDay />
    </>
  );
};
export default Welcome;
