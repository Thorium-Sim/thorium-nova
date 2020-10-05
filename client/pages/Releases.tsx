import React from "react";
import preval from "preval.macro";
import {Link} from "react-router-dom";
import styled from "@emotion/styled/macro";
const ReleaseContainer = styled("div")`
  margin-bottom: 30px;
  border-bottom: solid 2px rgba(255, 255, 255, 0.5);
  h1 {
    font-size: 30px;
  }
  li {
    font-size: 18px;
  }
`;
const releaseNotes = preval`
const fs = require('fs');
const path = require('path');
const showdown  = require('showdown');
const converter = new showdown.Converter();
const releaseNotes = fs.readFileSync(path.resolve(__dirname + "/../../CHANGELOG.md"), 'utf8')
const html      = converter.makeHtml(releaseNotes);


module.exports = html`;

const Releases = () => {
  return (
    <div className="config-container">
      <div className="overflow-y-auto h-full">
        <h1>Release Notes</h1>
        <Link to="/">Go Back</Link>
        <ReleaseContainer dangerouslySetInnerHTML={{__html: releaseNotes}} />
      </div>
    </div>
  );
};
export default Releases;
