import {useConfirm, usePrompt} from "@thorium/ui/AlertDialog";
import Button from "@thorium/ui/Button";
import InfoTip from "@thorium/ui/InfoTip";
import Input from "@thorium/ui/Input";
import Menubar from "@thorium/ui/Menubar";
import SearchableList from "@thorium/ui/SearchableList";
import TagInput from "@thorium/ui/TagInput";
import UploadWell from "@thorium/ui/UploadWell";
import {useNetSend} from "client/src/context/ThoriumContext";
import {useNetRequest} from "client/src/context/useNetRequest";
import {useState} from "react";
import {FaEdit} from "react-icons/fa";
import {NavLink, useMatch, useNavigate, useParams} from "react-router-dom";

export default function Config() {
  const [error, setError] = useState(false);
  const data = useNetRequest("pluginsList");
  const netSend = useNetSend();
  const navigate = useNavigate();
  const match = useMatch("/config/:pluginId/*");
  const params = match?.params || {};
  const prompt = usePrompt();
  const confirm = useConfirm();
  const plugin = data.find(d => d.id === params.pluginId);
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
                const id = await netSend("pluginCreate", {name});
                navigate(`/config/${id}`);
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
              }))}
              searchKeys={["name", "author", "tags"]}
              selectedItem={params.pluginId || null}
              setSelectedItem={id => navigate(`/config/${id}`)}
              renderItem={c => (
                <div className="flex justify-between items-center" key={c.id}>
                  <div>
                    {c.name}
                    <div>
                      <small>{c.author}</small>
                    </div>
                  </div>
                  <NavLink
                    {...{to: `/config/${c.id}/edit`}}
                    onClick={e => e.stopPropagation()}
                  >
                    <FaEdit />
                  </NavLink>
                </div>
              )}
            />
          </div>
          <div className="w-96 space-y-4">
            <Input
              label="Plugin Name"
              defaultValue={plugin?.name}
              isInvalid={error}
              invalidMessage="Name is required"
              disabled={!plugin}
              onChange={() => setError(false)}
              onBlur={(e: React.FocusEvent<Element>) => {
                const target = e.target as HTMLInputElement;
                if (!plugin) return;
                target.value
                  ? netSend("pluginSetName", {
                      name: target.value,
                      pluginId: plugin.id,
                    })
                  : setError(true);
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
                  netSend("pluginSetDescription", {
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
                netSend("pluginSetTags", {
                  tags: [...plugin.tags, tag],
                  pluginId: plugin.id,
                });
              }}
              onRemove={tag => {
                if (!plugin) return;
                netSend("pluginSetTags", {
                  tags: plugin.tags.filter(t => t !== tag),
                  pluginId: plugin.id,
                });
              }}
            />
            <Button
              className="w-full btn-outline btn-error"
              disabled={!params.pluginId}
              onClick={async () => {
                if (
                  !params.pluginId ||
                  !(await confirm({
                    header: "Are you sure you want to delete this plugin?",
                    body: "All content in this plugin, including images and other assets, will be gone forever.",
                  }))
                )
                  return;
                netSend("pluginDelete", {pluginId: params.pluginId});
                navigate("/config");
              }}
            >
              Delete Plugin
            </Button>
            <Button
              className="w-full btn-outline btn-alert"
              disabled={!params.pluginId}
              onClick={async () => {
                if (!params.pluginId) return;
                const name = await prompt({
                  header: "What is the name of the duplicated plugin?",
                });
                if (!name || typeof name !== "string") return;
                const pluginId = await netSend("pluginDuplicate", {
                  pluginId: params.pluginId,
                  name,
                });
                navigate(`/config/${pluginId}`);
              }}
            >
              Duplicate Plugin
            </Button>
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
                  // if (!plugin) return;
                  // setCoverImage({variables: {id: plugin?.id, image: files[0]}});
                }}
              >
                {/* {plugin?.coverImage && (
                <img
                  src={`${plugin.coverImage}?${new Date().getTime()}`}
                  className="w-[90%] h-[90%] object-cover"
                  alt="Cover"
                />
              )} */}
              </UploadWell>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
