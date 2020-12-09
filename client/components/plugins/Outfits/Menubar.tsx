import React from "react";
import {FaArrowLeft, FaHome} from "react-icons/fa";
import Button from "../../ui/button";

import {Link, useParams} from "react-router-dom";

const Menubar: React.FC<{backLink?: boolean}> = ({backLink}) => {
  const {pluginId} = useParams();

  return (
    <div className="fixed top-0 left-0 w-screen p-2 ">
      <div className="space-x-4">
        <Button as={Link} to="/" variantColor="info" variant="ghost" size="sm">
          <FaHome />
        </Button>

        {backLink && (
          <Button
            as={Link}
            to={`/config/${pluginId}/edit`}
            variantColor="info"
            variant="ghost"
            size="sm"
          >
            <FaArrowLeft />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Menubar;
