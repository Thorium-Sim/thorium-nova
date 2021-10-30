import {usePrompt} from "@thorium/ui/AlertDialog";
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
import {NavLink, useNavigate, useParams} from "react-router-dom";

let plugin: null | {
  id: string;
  name: string;
  description: string;
  tags: string[];
} = null;
const setName = (params: any) => {};
const setDescription = (params: any) => {};
const setTags = (params: any) => {};
export default function Config() {
  const [error, setError] = useState(false);
  const data = useNetRequest("pluginsList");
  const netSend = useNetSend();
  const navigate = useNavigate();
  const params = useParams();
  const prompt = usePrompt();
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
                navigate(`/config/${id}/edit`);
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
              className="pb-4"
              label="Plugin Name"
              defaultValue={plugin?.name}
              isInvalid={error}
              invalidMessage="Name is required"
              onChange={() => setError(false)}
              onBlur={(e: React.FocusEvent<Element>) => {
                const target = e.target as HTMLInputElement;
                plugin && target.value
                  ? setName({
                      variables: {id: plugin.id, name: target.value},
                    })
                  : setError(true);
              }}
            />
            <Input
              className="pb-4"
              label="Description"
              defaultValue={plugin?.description}
              onChange={() => setError(false)}
              onBlur={(e: React.FocusEvent<Element>) => {
                const target = e.target as HTMLInputElement;
                plugin && target.value
                  ? setDescription({
                      variables: {id: plugin.id, description: target.value},
                    })
                  : setError(true);
              }}
            />
            <TagInput
              label="Tags"
              tags={plugin?.tags || []}
              onAdd={tag => {
                if (plugin?.tags.includes(tag) || !plugin) return;
                setTags({
                  variables: {id: plugin.id, tags: plugin.tags.concat(tag)},
                });
              }}
              onRemove={tag => {
                if (!plugin) return;
                setTags({
                  variables: {
                    id: plugin.id,
                    tags: plugin.tags.filter(t => t !== tag),
                  },
                });
              }}
            />
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
