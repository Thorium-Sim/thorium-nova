import NoMatch from "@client/pages/NotFound";
import {LoadingSpinner} from "@thorium/ui/LoadingSpinner";
import {useMenubar} from "@thorium/ui/Menubar";
import {Suspense} from "react";
import {Route, Routes, useParams} from "react-router-dom";
import {TimelineAction} from "./TimelineAction";
import {TimelineStep} from "./TimelineStep";
import {TimelineDetails} from "./TimelineDetails";
import {TimelineLayout} from "./TimelineLayout";
import {TimelineList} from "./TimelineList";

export default function TimelinesConfig() {
  const {pluginId} = useParams() as {
    pluginId: string;
  };

  useMenubar({
    backTo: `/config/${pluginId}/list`,
  });
  return (
    <Routes>
      <Route path="/" element={<TimelineList />}>
        <Route
          path=":timelineId"
          element={
            <Suspense fallback={<LoadingSpinner />}>
              <TimelineLayout />
            </Suspense>
          }
        >
          <Route path="details" element={<TimelineDetails />} />
          <Route path=":stepId" element={<TimelineStep />}>
            <Route path=":actionId" element={<TimelineAction />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
}
