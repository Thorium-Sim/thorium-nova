import {useConfirm, usePrompt} from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import Menubar from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import TagInput from "@thorium/ui/TagInput";
import UploadWell from "@thorium/ui/UploadWell";
import {useNetRequest} from "client/src/context/useNetRequest";
import {netSend} from "client/src/context/netSend";
import {useEffect, useState} from "react";
import {FaEdit} from "react-icons/fa";
import {Link, NavLink, useNavigate, useParams} from "react-router-dom";

export default function PluginEdit() {
  const [error, setError] = useState(false);
  const data = useNetRequest("pluginsList");
  const navigate = useNavigate();
  const {pluginId} = useParams();
  const prompt = usePrompt();
  const confirm = useConfirm();
  const plugin = data.find(d => d.id === pluginId);

  useEffect(() => {
    if (!plugin) {
      navigate("/config");
    }
  }, [plugin, navigate]);
  return (
    <div className="h-full">
      <Menubar></Menubar>
      <div className="p-8 h-[calc(100%-2rem)]">
        <h1 className="font-bold text-white text-3xl mb-4">Plugin Config</h1>

        <div className="flex gap-8 h-[calc(100%-3rem)]">
          <div className="flex flex-col w-80 h-full">
            <Button
              className="w-full btn-sm btn-success"
              onClick={async () => {
                const name = await prompt({header: "Enter plugin name"});
                if (typeof name !== "string") return;
                const {pluginId} = await netSend("pluginCreate", {name});
                navigate(`/config/${pluginId}`);
              }}
            >
              New Plugin
            </Button>

            <SearchableList
              items={data.map(d => ({
                id: d.id,
                name: d.name,
                description: d.description,
                tags: d.tags,
                author: d.author,
                active: d.active,
              }))}
              searchKeys={["name", "author", "tags"]}
              selectedItem={pluginId || null}
              setSelectedItem={id => navigate(`/config/${id}`)}
              renderItem={c => (
                <div className="flex justify-between items-center" key={c.id}>
                  <div>
                    {c.name}
                    {c.active ? (
                      ""
                    ) : (
                      <span className="text-red-600"> (inactive)</span>
                    )}
                    <div>
                      <small>{c.author}</small>
                    </div>
                  </div>
                  <NavLink
                    {...{to: `/config/${c.id}/list`}}
                    onClick={e => e.stopPropagation()}
                  >
                    <FaEdit />
                  </NavLink>
                </div>
              )}
            />
          </div>
          <div className="w-96 space-y-4" key={plugin?.id}>
            <Input
              label="Plugin Name"
              defaultValue={plugin?.name}
              isInvalid={error}
              invalidMessage="Name is required"
              disabled={!plugin}
              onChange={() => setError(false)}
              onBlur={async (e: React.FocusEvent<Element>) => {
                const target = e.target as HTMLInputElement;
                if (!plugin) return;
                if (target.value) {
                  const {pluginId} = await netSend("pluginUpdate", {
                    name: target.value,
                    pluginId: plugin.id,
                  });
                  navigate(`/config/${pluginId}`);
                } else {
                  setError(true);
                }
              }}
            />
            <Input
              label="Description"
              as="textarea"
              className="h-64"
              defaultValue={plugin?.description}
              onChange={() => setError(false)}
              disabled={!plugin}
              onBlur={(e: React.FocusEvent<Element>) => {
                const target = e.target as HTMLInputElement;
                plugin &&
                  netSend("pluginUpdate", {
                    description: target.value,
                    pluginId: plugin.id,
                  });
              }}
            />
            <TagInput
              label="Tags"
              tags={plugin?.tags || []}
              disabled={!plugin}
              onAdd={tag => {
                if (plugin?.tags.includes(tag) || !plugin) return;
                netSend("pluginUpdate", {
                  tags: [...plugin.tags, tag],
                  pluginId: plugin.id,
                });
              }}
              onRemove={tag => {
                if (!plugin) return;
                netSend("pluginUpdate", {
                  tags: plugin.tags.filter(t => t !== tag),
                  pluginId: plugin.id,
                });
              }}
            />
            {plugin?.active ? (
              <Button
                className="w-full btn-outline btn-warning"
                disabled={!pluginId}
                onClick={async () => {
                  if (!pluginId) return;
                  netSend("pluginUpdate", {pluginId, active: false});
                }}
              >
                Deactivate Plugin
              </Button>
            ) : (
              <Button
                className="w-full btn-outline btn-success"
                disabled={!pluginId}
                onClick={async () => {
                  if (!pluginId) return;
                  netSend("pluginUpdate", {pluginId, active: true});
                }}
              >
                Activate Plugin
              </Button>
            )}
            <Button
              className="w-full btn-outline btn-error"
              disabled={!pluginId}
              onClick={async () => {
                if (
                  !pluginId ||
                  !(await confirm({
                    header: "Are you sure you want to delete this plugin?",
                    body: "All content in this plugin, including images and other assets, will be gone forever.",
                  }))
                )
                  return;
                netSend("pluginDelete", {pluginId});
                navigate("/config");
              }}
            >
              Delete Plugin
            </Button>
            <Button
              className="w-full btn-outline btn-alert"
              disabled={!pluginId}
              onClick={async () => {
                if (!pluginId) return;
                const name = await prompt({
                  header: "What is the name of the duplicated plugin?",
                });
                if (!name || typeof name !== "string") return;
                const {pluginId: duplicateId} = await netSend(
                  "pluginDuplicate",
                  {
                    pluginId: pluginId,
                    name,
                  }
                );
                navigate(`/config/${duplicateId}`);
              }}
            >
              Duplicate Plugin
            </Button>
            <Link
              className={`btn w-full btn-outline btn-warning ${
                !pluginId ? "btn-disabled" : ""
              }`}
              to={`/config/${pluginId}/list`}
            >
              Edit Plugin
            </Link>
          </div>
          <div>
            <label>
              <span className="flex">
                Cover Image{" "}
                <InfoTip>
                  Used on the Thorium Plugin Registry. Images should be square
                  and at least 1024x1024 in size.
                </InfoTip>
              </span>
              <UploadWell
                accept="image/*"
                onChange={(files: FileList) => {
                  if (!plugin) return;
                  netSend("pluginUpdate", {
                    pluginId: plugin.id,
                    coverImage: files[0],
                  });
                }}
              >
                {plugin?.coverImage && (
                  <img
                    src={`${plugin.coverImage}?${new Date().getTime()}`}
                    className="w-[90%] h-[90%] object-cover"
                    alt="Cover"
                  />
                )}
              </UploadWell>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
